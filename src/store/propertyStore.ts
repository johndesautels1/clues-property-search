/**
 * CLUES Property Dashboard - Global State Store
 * Using Zustand for lightweight, performant state management
 * Uses localStorage as temporary DB until PostgreSQL is connected
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PropertyCard, Property, PropertyFilters, PropertySort } from '@/types/property';

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
  fullProperties: Map<string, Property>; // Store full 110-field properties separately
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
    const parsed = JSON.parse(str);
    // Convert fullProperties array back to Map
    if (parsed.state?.fullProperties && Array.isArray(parsed.state.fullProperties)) {
      parsed.state.fullProperties = new Map(parsed.state.fullProperties);
    }
    return parsed;
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
          if (fullProperty) {
            newFullProperties.set(property.id, fullProperty);
          }
          return {
            properties: [property, ...state.properties],
            fullProperties: newFullProperties,
          };
        }),

      addProperties: (newProperties, fullProperties) =>
        set((state) => {
          const newFullPropertiesMap = new Map(state.fullProperties);
          if (fullProperties) {
            fullProperties.forEach((fp) => {
              newFullPropertiesMap.set(fp.id, fp);
            });
          }
          return {
            properties: [...newProperties, ...state.properties],
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
          newFullProperties.set(id, property);
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
