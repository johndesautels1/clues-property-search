/**
 * CLUES Property Dashboard - Global State Store
 * Using Zustand for lightweight, performant state management
 * Uses localStorage as temporary DB until PostgreSQL is connected
 *
 * DATA STACKING: When updating properties, data from multiple sources
 * is MERGED additively, not replaced. Higher tier sources take precedence.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PropertyCard, Property, PropertyFilters, PropertySort, DataField } from '@/types/property';

/**
 * Default values for data fields - centralized for consistency
 * FIX #11: Centralized defaults instead of scattered fallbacks
 */
const DEFAULTS = {
  SOURCE: 'Manual',
  CONFIDENCE: 'Medium' as const,
  TIER: 5,
  LLM_SOURCES: [] as string[],
} as const;

/**
 * Source tier hierarchy for data arbitration
 * Lower number = higher priority (wins conflicts)
 */
const SOURCE_TIERS: Record<string, number> = {
  'Stellar MLS': 1,
  'Stellar MLS PDF': 1,
  'MLS': 1,
  'County Records': 2,
  'County Assessor': 2,
  'FEMA': 2,
  'Google Maps': 3,
  'Google Geocode': 3,
  'Google Places': 3,
  'WalkScore': 3,
  'HowLoud': 3,
  'AirNow': 3,
  'SchoolDigger': 3,
  'Weather': 3,
  'BroadbandNow': 3,
  'CrimeGrade': 3,
  'Perplexity': 4,
  'Grok': 4,
  'Claude': 4,
  'GPT': 4,
  'Gemini': 4,
  'Manual': 5,
};

/**
 * FIX #1: Memoization cache for getSourceTier()
 * Prevents repeated string parsing on every field merge (50-100x per property)
 */
const sourceTierCache = new Map<string, number>();

/**
 * Get the tier for a source name (lower = higher priority)
 * FIX #1: Now uses memoization cache for O(1) repeat lookups
 */
function getSourceTier(source: string): number {
  // Check cache first
  const cached = sourceTierCache.get(source);
  if (cached !== undefined) return cached;

  let tier: number;

  // Check for exact match first
  if (SOURCE_TIERS[source]) {
    tier = SOURCE_TIERS[source];
  } else {
    // Check for partial matches
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes('mls')) {
      tier = 1;
    } else if (lowerSource.includes('county') || lowerSource.includes('fema')) {
      tier = 2;
    } else if (lowerSource.includes('google') || lowerSource.includes('walk') || lowerSource.includes('score')) {
      tier = 3;
    } else if (lowerSource.includes('perplexity') || lowerSource.includes('grok') ||
        lowerSource.includes('claude') || lowerSource.includes('gpt') ||
        lowerSource.includes('gemini')) {
      tier = 4;
    } else {
      tier = DEFAULTS.TIER; // FIX #11: Use centralized default
    }
  }

  // Cache the result
  sourceTierCache.set(source, tier);
  return tier;
}

/**
 * Check if a DataField has a valid (non-empty) value
 */
function hasValidValue(field: DataField<any> | undefined | null): boolean {
  if (!field) return false;
  const val = field.value;
  if (val === null || val === undefined || val === '') return false;
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    if (['n/a', 'na', 'unknown', 'null', 'undefined', 'none', '-', '--', 'tbd'].includes(lower)) {
      return false;
    }
  }
  if (Array.isArray(val) && val.length === 0) return false;
  return true;
}

/**
 * Merge a single DataField - only replace if:
 * 1. Existing field is empty/null AND new field has value, OR
 * 2. New source has higher priority (lower tier number) than existing
 */
function mergeDataField<T>(
  existing: DataField<T> | undefined,
  incoming: DataField<T> | undefined
): DataField<T> | undefined {
  // If no incoming data, keep existing
  if (!incoming || !hasValidValue(incoming)) {
    return existing;
  }

  // If no existing data, use incoming
  if (!existing || !hasValidValue(existing)) {
    return incoming;
  }

  // Both have values - check source priority
  // FIX #11: Use centralized DEFAULTS.SOURCE instead of hardcoded 'Manual'
  const existingTier = getSourceTier(existing.sources?.[0] || DEFAULTS.SOURCE);
  const incomingTier = getSourceTier(incoming.sources?.[0] || DEFAULTS.SOURCE);

  // Lower tier number = higher priority
  if (incomingTier < existingTier) {
    // Higher priority source - use incoming but preserve conflict info
    return {
      ...incoming,
      hasConflict: existing.value !== incoming.value,
      conflictValues: existing.value !== incoming.value
        ? [...(incoming.conflictValues || []), { source: existing.sources?.[0] || 'Unknown', value: existing.value }]
        : incoming.conflictValues,
    };
  }

  // Keep existing (higher priority) but track the conflict
  if (existing.value !== incoming.value) {
    return {
      ...existing,
      hasConflict: true,
      conflictValues: [...(existing.conflictValues || []), { source: incoming.sources?.[0] || 'Unknown', value: incoming.value }],
    };
  }

  return existing;
}

/**
 * Deep merge two Property objects - ADDITIVE merge
 * New data fills gaps, higher tier sources can override lower tier
 * NEVER removes existing data
 */
function mergeProperties(existing: Property, incoming: Property): Property {
  const merged: Property = { ...existing };

  // Helper to merge a section (e.g., address, details, location)
  // Uses type assertion since we know the structure matches
  const mergeSection = <T>(
    existingSection: T | undefined,
    incomingSection: T | undefined
  ): T => {
    if (!incomingSection) return existingSection as T;
    if (!existingSection) return incomingSection;

    const result = { ...existingSection } as Record<string, any>;
    const incSection = incomingSection as Record<string, any>;

    for (const key of Object.keys(incSection)) {
      const existField = result[key] as DataField<any> | undefined;
      const incField = incSection[key] as DataField<any> | undefined;

      const mergedField = mergeDataField(existField, incField);
      if (mergedField) {
        result[key] = mergedField;
      }
    }
    return result as T;
  };

  // Merge each section
  merged.address = mergeSection(existing.address, incoming.address);
  merged.details = mergeSection(existing.details, incoming.details);
  merged.structural = mergeSection(existing.structural, incoming.structural);
  merged.location = mergeSection(existing.location, incoming.location);
  merged.financial = mergeSection(existing.financial, incoming.financial);
  merged.utilities = mergeSection(existing.utilities, incoming.utilities);

  // Merge Stellar MLS data if present
  // FIX #17: Use proper empty object defaults instead of unsafe 'as any' cast
  if (incoming.stellarMLS || existing.stellarMLS) {
    const emptyMLSSection = {
      parking: undefined,
      building: undefined,
      legal: undefined,
      waterfront: undefined,
      leasing: undefined,
      features: undefined,
    };
    const existingMLS = existing.stellarMLS || emptyMLSSection;
    const incomingMLS = incoming.stellarMLS || emptyMLSSection;

    merged.stellarMLS = {
      parking: mergeSection(existingMLS.parking, incomingMLS.parking),
      building: mergeSection(existingMLS.building, incomingMLS.building),
      legal: mergeSection(existingMLS.legal, incomingMLS.legal),
      waterfront: mergeSection(existingMLS.waterfront, incomingMLS.waterfront),
      leasing: mergeSection(existingMLS.leasing, incomingMLS.leasing),
      features: mergeSection(existingMLS.features, incomingMLS.features),
    };
  }

  // Update metadata
  merged.updatedAt = new Date().toISOString();

  // Preserve computed scores - take higher value
  if (incoming.smartScore !== undefined || existing.smartScore !== undefined) {
    merged.smartScore = Math.max(incoming.smartScore || 0, existing.smartScore || 0);
  }
  if (incoming.dataCompleteness !== undefined || existing.dataCompleteness !== undefined) {
    merged.dataCompleteness = Math.max(incoming.dataCompleteness || 0, existing.dataCompleteness || 0);
  }

  return merged;
}

// Demo properties to start with
const initialProperties: PropertyCard[] = [
  {
    id: '1',
    address: '280 41st Ave',
    city: 'St Pete Beach',
    state: 'FL',
    zip: '33706',
    price: 549000,
    pricePerSqft: 385,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1426,
    yearBuilt: 1958,
    smartScore: 94,
    dataCompleteness: 98,
    listingStatus: 'Active',
    daysOnMarket: 12,
  },
  {
    id: '2',
    address: '2015 Hillwood Dr',
    city: 'Clearwater',
    state: 'FL',
    zip: '33763',
    price: 374800,
    pricePerSqft: 262,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1432,
    yearBuilt: 1979,
    smartScore: 88,
    dataCompleteness: 95,
    listingStatus: 'Active',
    daysOnMarket: 28,
  },
  {
    id: '3',
    address: '1240 Beach Blvd',
    city: 'Naples',
    state: 'FL',
    zip: '34102',
    price: 1250000,
    pricePerSqft: 520,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2404,
    yearBuilt: 2018,
    smartScore: 96,
    dataCompleteness: 100,
    listingStatus: 'Active',
    daysOnMarket: 5,
  },
];

interface PropertyState {
  // Properties data
  properties: PropertyCard[];
  fullProperties: Map<string, Property>; // Store full 138-field properties separately
  selectedPropertyId: string | null;
  isLoading: boolean;
  error: string | null;

  // Filters and sorting
  filters: PropertyFilters;
  sort: PropertySort;
  searchQuery: string;

  // View mode
  viewMode: 'grid' | 'list' | 'map';

  // Actions
  setProperties: (properties: PropertyCard[]) => void;
  addProperty: (property: PropertyCard, fullProperty?: Property) => void;
  addProperties: (properties: PropertyCard[], fullProperties?: Property[]) => void;
  removeProperty: (id: string) => void;
  updateProperty: (id: string, updates: Partial<PropertyCard>) => void;
  updateFullProperty: (id: string, property: Property) => void;
  selectProperty: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<PropertyFilters>) => void;
  clearFilters: () => void;
  setSort: (sort: PropertySort) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: 'grid' | 'list' | 'map') => void;
  getPropertyById: (id: string) => PropertyCard | undefined;
  getFullPropertyById: (id: string) => Property | undefined;
}

const defaultFilters: PropertyFilters = {};

const defaultSort: PropertySort = {
  field: 'smartScore',
  direction: 'desc',
};

// Custom storage to handle Map serialization
const customStorage = {
  getItem: (name: string) => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    try {
      const parsed = JSON.parse(str);
      // Convert fullProperties array back to Map
      if (parsed.state?.fullProperties && Array.isArray(parsed.state.fullProperties)) {
        parsed.state.fullProperties = new Map(parsed.state.fullProperties);
      }
      return parsed;
    } catch (parseError) {
      console.error('❌ Failed to parse localStorage data:', parseError);
      // Clear corrupted data to prevent infinite loops
      localStorage.removeItem(name);
      return null;
    }
  },
  setItem: (name: string, value: any) => {
    const toStore = {
      ...value,
      state: {
        ...value.state,
        // Convert Map to array for storage
        fullProperties: Array.from(value.state.fullProperties.entries()),
      },
    };
    console.log('💽 STORAGE: Saving to localStorage');
    console.log('💽 Full properties count:', value.state.fullProperties.size);
    console.log('💽 First property sample:', value.state.fullProperties.entries().next().value);
    localStorage.setItem(name, JSON.stringify(toStore));
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
};

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set, get) => ({
      // Initial state - load demo properties
      properties: initialProperties,
      fullProperties: new Map<string, Property>(),
      selectedPropertyId: null,
      isLoading: false,
      error: null,
      filters: defaultFilters,
      sort: defaultSort,
      searchQuery: '',
      viewMode: 'grid',

      // Actions
      setProperties: (properties) =>
        set({ properties, isLoading: false, error: null }),

      addProperty: (property, fullProperty) =>
        set((state) => {
          const newFullProperties = new Map(state.fullProperties);

          // Check if property already exists (for merging)
          const existingFull = newFullProperties.get(property.id);
          const existingCard = state.properties.find(p => p.id === property.id);

          if (fullProperty) {
            if (existingFull) {
              // ADDITIVE MERGE: Merge with existing property
              console.log('🔄 MERGE: Merging addProperty data with existing', property.id);
              newFullProperties.set(property.id, mergeProperties(existingFull, fullProperty));
            } else {
              newFullProperties.set(property.id, fullProperty);
            }
          }

          // Update or add property card
          let updatedProperties: PropertyCard[];
          if (existingCard) {
            // Update existing card
            updatedProperties = state.properties.map(p =>
              p.id === property.id ? { ...p, ...property } : p
            );
          } else {
            // Add new card
            updatedProperties = [property, ...state.properties];
          }

          return {
            properties: updatedProperties,
            fullProperties: newFullProperties,
          };
        }),

      addProperties: (newProperties, fullProperties) =>
        set((state) => {
          console.log('🏪 STORE: addProperties called');
          console.log('📥 Receiving:', newProperties.length, 'property cards');
          console.log('📥 Receiving:', fullProperties?.length || 0, 'full properties');

          const newFullPropertiesMap = new Map(state.fullProperties);
          if (fullProperties) {
            fullProperties.forEach((fp) => {
              const existing = newFullPropertiesMap.get(fp.id);
              if (existing) {
                // ADDITIVE MERGE: Merge with existing property
                console.log('🔄 MERGE: Merging addProperties data with existing', fp.id);
                newFullPropertiesMap.set(fp.id, mergeProperties(existing, fp));
              } else {
                console.log('💾 Storing new full property ID:', fp.id);
                newFullPropertiesMap.set(fp.id, fp);
              }
            });
          }

          console.log('📊 Map now has', newFullPropertiesMap.size, 'full properties');

          // FIX #2 & #9: Build lookup Map once instead of .find() per property (O(n) vs O(n²))
          // Also reuse existingIds Set for both operations
          const existingIds = new Set(state.properties.map(p => p.id));
          const incomingMap = new Map(newProperties.map(np => [np.id, np]));

          const updatedProperties = state.properties.map(p => {
            const incoming = incomingMap.get(p.id); // O(1) lookup instead of O(n) find
            return incoming ? { ...p, ...incoming } : p;
          });

          // Add truly new properties (reusing existingIds Set)
          const trulyNew = newProperties.filter(np => !existingIds.has(np.id));

          return {
            properties: [...trulyNew, ...updatedProperties],
            fullProperties: newFullPropertiesMap,
          };
        }),

      removeProperty: (id) =>
        set((state) => {
          const newFullProperties = new Map(state.fullProperties);
          newFullProperties.delete(id);
          return {
            properties: state.properties.filter((p) => p.id !== id),
            fullProperties: newFullProperties,
          };
        }),

      updateProperty: (id, updates) =>
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      updateFullProperty: (id, property) =>
        set((state) => {
          const newFullProperties = new Map(state.fullProperties);
          const existing = newFullProperties.get(id);

          // ADDITIVE MERGE: If property already exists, merge data instead of replacing
          if (existing) {
            console.log('🔄 MERGE: Merging new data with existing property', id);
            const merged = mergeProperties(existing, property);
            newFullProperties.set(id, merged);
          } else {
            console.log('➕ NEW: Adding new property', id);
            newFullProperties.set(id, property);
          }

          return { fullProperties: newFullProperties };
        }),

      selectProperty: (id) =>
        set({ selectedPropertyId: id }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      setError: (error) =>
        set({ error, isLoading: false }),

      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),

      clearFilters: () =>
        set({ filters: defaultFilters, searchQuery: '' }),

      setSort: (sort) =>
        set({ sort }),

      setSearchQuery: (searchQuery) =>
        set({ searchQuery }),

      setViewMode: (viewMode) =>
        set({ viewMode }),

      getPropertyById: (id) => {
        return get().properties.find((p) => p.id === id);
      },

      getFullPropertyById: (id) => {
        return get().fullProperties.get(id);
      },
    }),
    {
      name: 'clues-property-store',
      storage: customStorage,
    }
  )
);

// Selector hooks for optimized re-renders
export const useProperties = () => usePropertyStore((state) => state.properties);
export const useFullProperties = () => usePropertyStore((state) => state.fullProperties);
export const useSelectedProperty = () => usePropertyStore((state) => state.selectedPropertyId);
export const useFilters = () => usePropertyStore((state) => state.filters);
export const useSort = () => usePropertyStore((state) => state.sort);
export const useViewMode = () => usePropertyStore((state) => state.viewMode);
export const useIsLoading = () => usePropertyStore((state) => state.isLoading);
export const useSearchQuery = () => usePropertyStore((state) => state.searchQuery);

// Filtered and sorted properties selector
export const useFilteredProperties = (): PropertyCard[] => {
  const properties = usePropertyStore((state) => state.properties);
  const filters = usePropertyStore((state) => state.filters);
  const sort = usePropertyStore((state) => state.sort);
  const searchQuery = usePropertyStore((state) => state.searchQuery);

  let filtered = [...properties];

  // Apply search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.address.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query) ||
        p.zip.includes(query)
    );
  }

  // Apply filters
  if (filters.minPrice) {
    filtered = filtered.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice) {
    filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
  }
  if (filters.minBeds) {
    filtered = filtered.filter((p) => p.bedrooms >= filters.minBeds!);
  }
  if (filters.maxBeds) {
    filtered = filtered.filter((p) => p.bedrooms <= filters.maxBeds!);
  }
  if (filters.minBaths) {
    filtered = filtered.filter((p) => p.bathrooms >= filters.minBaths!);
  }
  if (filters.minSqft) {
    filtered = filtered.filter((p) => p.sqft >= filters.minSqft!);
  }
  if (filters.maxSqft) {
    filtered = filtered.filter((p) => p.sqft <= filters.maxSqft!);
  }
  if (filters.cities?.length) {
    filtered = filtered.filter((p) => filters.cities!.includes(p.city));
  }
  if (filters.listingStatus?.length) {
    filtered = filtered.filter((p) =>
      filters.listingStatus!.includes(p.listingStatus)
    );
  }

  // Apply sorting
  filtered.sort((a, b) => {
    const aVal = a[sort.field] ?? 0;
    const bVal = b[sort.field] ?? 0;

    if (sort.direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  return filtered;
};
