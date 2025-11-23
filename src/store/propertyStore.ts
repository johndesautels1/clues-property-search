/**
 * CLUES Property Dashboard - Global State Store
 * Using Zustand for lightweight, performant state management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PropertyCard, PropertyFilters, PropertySort } from '@/types/property';

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
  addProperties: (properties: PropertyCard[]) => void;
  selectProperty: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<PropertyFilters>) => void;
  clearFilters: () => void;
  setSort: (sort: PropertySort) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: 'grid' | 'list' | 'map') => void;
}

const defaultFilters: PropertyFilters = {};

const defaultSort: PropertySort = {
  field: 'smartScore',
  direction: 'desc',
};

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set, get) => ({
      // Initial state
      properties: [],
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

      addProperties: (newProperties) =>
        set((state) => ({
          properties: [...state.properties, ...newProperties],
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
        set({ filters: defaultFilters }),

      setSort: (sort) =>
        set({ sort }),

      setSearchQuery: (searchQuery) =>
        set({ searchQuery }),

      setViewMode: (viewMode) =>
        set({ viewMode }),
    }),
    {
      name: 'clues-property-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        filters: state.filters,
        sort: state.sort,
        viewMode: state.viewMode,
      }),
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

// Filtered and sorted properties selector
export const useFilteredProperties = () => {
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
