/**
 * CLUES Property Dashboard - Home Dashboard
 * Mobile-first overview with key metrics
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Building2,
  TrendingUp,
  DollarSign,
  BarChart3,
  Plus,
  ChevronRight,
  Zap,
} from 'lucide-react';
import PropertyCard from '@/components/property/PropertyCard';
import { useFilteredProperties } from '@/store/propertyStore';

// Demo data - will be replaced with real data
const demoStats = [
  { label: 'Total Properties', value: '24', icon: Building2, color: 'cyan' },
  { label: 'Avg. SMART Score', value: '87', icon: Zap, color: 'purple' },
  { label: 'Total Value', value: '$8.2M', icon: DollarSign, color: 'green' },
  { label: 'Data Complete', value: '94%', icon: BarChart3, color: 'blue' },
];

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
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  return (
    <motion.div
      className="px-4 py-6 md:px-8 md:py-10 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="font-orbitron text-2xl md:text-4xl font-bold text-gradient-quantum mb-2">
          CLUES Dashboard
        </h1>
        <p className="text-gray-400">
          110-Field Property Intelligence Platform
        </p>
      </motion.div>

      {/* Quick Stats Grid - Mobile: 2x2, Desktop: 4x1 */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {demoStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="glass-card p-4 md:p-6"
            >
              <div className={`w-10 h-10 rounded-xl bg-quantum-${stat.color}/20 flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 text-quantum-${stat.color}`} />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white mb-1">
                {stat.value}
              </p>
              <p className="text-xs md:text-sm text-gray-500">
                {stat.label}
              </p>
            </div>
          );
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          <Link to="/add" className="btn-quantum whitespace-nowrap">
            <Plus className="w-5 h-5" />
            Add Property
          </Link>
          <Link to="/compare" className="btn-glass whitespace-nowrap">
            <BarChart3 className="w-5 h-5" />
            Compare
          </Link>
          <button className="btn-glass whitespace-nowrap">
            <TrendingUp className="w-5 h-5" />
            Market Analysis
          </button>
        </div>
      </motion.div>

      {/* Recent Properties */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg text-white">
            Recent Properties
          </h2>
          <Link
            to="/properties"
            className="flex items-center gap-1 text-quantum-cyan text-sm hover:underline"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-4">
          {demoProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </motion.div>

      {/* Data Quality Overview */}
      <motion.div variants={itemVariants} className="mt-8">
        <div className="glass-5d p-6 rounded-2xl">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-quantum-cyan" />
            Data Quality Overview
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Core Fields (1-30)</span>
                <span className="text-quantum-green">98%</span>
              </div>
              <div className="progress-quantum">
                <div className="progress-quantum-fill" style={{ width: '98%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Structural (31-50)</span>
                <span className="text-quantum-cyan">92%</span>
              </div>
              <div className="progress-quantum">
                <div className="progress-quantum-fill" style={{ width: '92%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Location (51-75)</span>
                <span className="text-quantum-blue">96%</span>
              </div>
              <div className="progress-quantum">
                <div className="progress-quantum-fill" style={{ width: '96%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Financial (76-90)</span>
                <span className="text-quantum-purple">88%</span>
              </div>
              <div className="progress-quantum">
                <div className="progress-quantum-fill" style={{ width: '88%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Utilities (91-110)</span>
                <span className="text-quantum-gold">94%</span>
              </div>
              <div className="progress-quantum">
                <div className="progress-quantum-fill" style={{ width: '94%' }} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
