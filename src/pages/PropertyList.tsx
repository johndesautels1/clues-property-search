/**
 * CLUES Property Dashboard - Property List Page
 * Mobile-first property grid with filters - CONNECTED TO STORE
 */

import { motion } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  Map,
  X,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PropertyCard from '@/components/property/PropertyCard';
import {
  usePropertyStore,
  useFilteredProperties,
  useSearchQuery,
  useFilters,
} from '@/store/propertyStore';

export default function PropertyList() {
  const filteredProperties = useFilteredProperties();
  const searchQuery = useSearchQuery();
  const filters = useFilters();
  const {
    viewMode,
    setViewMode,
    setSearchQuery,
    setFilters,
    clearFilters,
  } = usePropertyStore();

  const showFilters = usePropertyStore((state) =>
    Object.keys(state.filters).some(key => state.filters[key as keyof typeof state.filters] !== undefined)
  );

  const handleFilterChange = (key: string, value: string | number | undefined) => {
    if (value === '' || value === undefined) {
      const newFilters = { ...filters };
      delete newFilters[key as keyof typeof newFilters];
      usePropertyStore.setState({ filters: newFilters });
    } else {
      setFilters({ [key]: typeof value === 'string' ? parseInt(value) || value : value });
    }
  };

  return (
    <motion.div
      className="px-4 py-6 md:px-8 md:py-10 max-w-7xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-white mb-2">
          Properties
        </h1>
        <p className="text-gray-400 text-sm">
          {filteredProperties.length} properties found
        </p>
      </div>

      {/* Search & Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by address, city, or ZIP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-glass w-full pl-12"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5 text-gray-500 hover:text-white" />
            </button>
          )}
        </div>

        {/* Filter & View Controls */}
        <div className="flex gap-3">
          <button
            onClick={clearFilters}
            className={`btn-glass flex items-center gap-2 ${
              showFilters ? 'border-quantum-cyan text-quantum-cyan' : ''
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="hidden md:inline">
              {showFilters ? 'Clear Filters' : 'Filters'}
            </span>
          </button>

          {/* View Mode Toggle - Mobile: Icons only */}
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-quantum-cyan/20 text-quantum-cyan'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 transition-colors ${
                viewMode === 'list'
                  ? 'bg-quantum-cyan/20 text-quantum-cyan'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-3 transition-colors ${
                viewMode === 'map'
                  ? 'bg-quantum-cyan/20 text-quantum-cyan'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              <Map className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel - Always visible */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="glass-card p-4 md:p-6 mb-6"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-2">Min Price</label>
            <input
              type="number"
              placeholder="$0"
              value={filters.minPrice || ''}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="input-glass text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-2">Max Price</label>
            <input
              type="number"
              placeholder="$10M"
              value={filters.maxPrice || ''}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="input-glass text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-2">Min Beds</label>
            <select
              className="input-glass text-sm"
              value={filters.minBeds || ''}
              onChange={(e) => handleFilterChange('minBeds', e.target.value)}
            >
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-2">Min Baths</label>
            <select
              className="input-glass text-sm"
              value={filters.minBaths || ''}
              onChange={(e) => handleFilterChange('minBaths', e.target.value)}
            >
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Property Grid/List */}
      {filteredProperties.length > 0 ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-4'
          }
        >
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <p className="text-gray-400 mb-4">
            {searchQuery || Object.keys(filters).length > 0
              ? 'No properties match your filters'
              : 'No properties yet'}
          </p>
          {searchQuery || Object.keys(filters).length > 0 ? (
            <button onClick={clearFilters} className="btn-glass">
              Clear Filters
            </button>
          ) : (
            <Link to="/add" className="btn-quantum inline-flex">
              <Plus className="w-5 h-5" />
              Add Your First Property
            </Link>
          )}
        </div>
      )}

      {/* Add Property FAB for mobile */}
      <Link
        to="/add"
        className="fixed bottom-24 right-4 md:hidden btn-quantum w-14 h-14 rounded-full p-0 flex items-center justify-center shadow-lg shadow-quantum-cyan/30"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </motion.div>
  );
}
