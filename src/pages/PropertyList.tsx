/**
 * CLUES Property Dashboard - Property List Page
 * Mobile-first property grid with filters
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  Map,
  X,
} from 'lucide-react';
import PropertyCard from '@/components/property/PropertyCard';
import { usePropertyStore, useFilteredProperties } from '@/store/propertyStore';

// Demo properties
const demoProperties = [
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

export default function PropertyList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { viewMode, setViewMode } = usePropertyStore();

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
          {demoProperties.length} properties found
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
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-glass flex items-center gap-2 ${
              showFilters ? 'border-quantum-cyan text-quantum-cyan' : ''
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="hidden md:inline">Filters</span>
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

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="glass-card p-4 md:p-6 mb-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-2">Min Price</label>
              <input
                type="number"
                placeholder="$0"
                className="input-glass text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">Max Price</label>
              <input
                type="number"
                placeholder="$10M"
                className="input-glass text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">Beds</label>
              <select className="input-glass text-sm">
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">Baths</label>
              <select className="input-glass text-sm">
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Property Grid/List */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        }
      >
        {demoProperties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {/* Load More */}
      <div className="mt-8 text-center">
        <button className="btn-glass">Load More Properties</button>
      </div>
    </motion.div>
  );
}
