/**
 * CLUES Property Dashboard - Global State Store
 * Using Zustand for lightweight, performant state management
 * Uses localStorage as temporary DB until PostgreSQL is connected
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PropertyCard, PropertyFilters, PropertySort } from '@/types/property';

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
  addProperty: (property: PropertyCard) => void;
  addProperties: (properties: PropertyCard[]) => void;
  removeProperty: (id: string) => void;
  updateProperty: (id: string, updates: Partial<PropertyCard>) => void;
  selectProperty: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<PropertyFilters>) => void;
  clearFilters: () => void;
  setSort: (sort: PropertySort) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: 'grid' | 'list' | 'map') => void;
  getPropertyById: (id: string) => PropertyCard | undefined;
}

const defaultFilters: PropertyFilters = {};

const defaultSort: PropertySort = {
  field: 'smartScore',
  direction: 'desc',
};

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set, get) => ({
      // Initial state - load demo properties
      properties: initialProperties,
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

      addProperty: (property) =>
        set((state) => ({
          properties: [property, ...state.properties],
        })),

      addProperties: (newProperties) =>
        set((state) => ({
          properties: [...newProperties, ...state.properties],
        })),

      removeProperty: (id) =>
        set((state) => ({
          properties: state.properties.filter((p) => p.id !== id),
        })),

      updateProperty: (id, updates) =>
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

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
    }),
    {
      name: 'clues-property-store',
      storage: createJSONStorage(() => localStorage),
      // Persist everything so properties survive page refresh
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
