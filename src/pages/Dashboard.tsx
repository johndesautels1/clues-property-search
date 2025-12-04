/**
 * CLUES Property Dashboard - Home Dashboard
 * Mobile-first overview with key metrics
 * 
 * Data Quality metrics are computed from REAL property data using field-normalizer
 */

import { useMemo } from 'react';
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
import { useFilteredProperties, useProperties, useFullProperties } from '@/store/propertyStore';
import { computeDataQualityByRange } from '@/lib/field-normalizer';

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
  const properties = useProperties();
  const fullPropertiesMap = useFullProperties();
  const filteredProperties = useFilteredProperties();

  // Convert Map to array for data quality calculation
  const fullPropertiesArray = useMemo(() => {
    return Array.from(fullPropertiesMap.values());
  }, [fullPropertiesMap]);

  // Calculate real stats from store data
  const stats = useMemo(() => {
    const totalValue = properties.reduce((sum, p) => sum + p.price, 0);
    const avgSmartScore = properties.length > 0
      ? Math.round(properties.reduce((sum, p) => sum + (p.smartScore || 0), 0) / properties.length)
      : 0;
    const avgDataComplete = properties.length > 0
      ? Math.round(properties.reduce((sum, p) => sum + (p.dataCompleteness || 0), 0) / properties.length)
      : 0;

    const formatValue = (val: number) => {
      if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
      return `$${val}`;
    };

    return [
      { label: 'Total Properties', value: properties.length.toString(), icon: Building2, color: 'cyan' },
      { label: 'Avg. SMART Score', value: avgSmartScore.toString(), icon: Zap, color: 'purple' },
      { label: 'Total Value', value: formatValue(totalValue), icon: DollarSign, color: 'green' },
      { label: 'Data Complete', value: `${avgDataComplete}%`, icon: BarChart3, color: 'blue' },
    ];
  }, [properties]);

  // Compute REAL data quality metrics from full property data
  const dataQualityMetrics = useMemo(() => {
    return computeDataQualityByRange(fullPropertiesArray);
  }, [fullPropertiesArray]);

  // Get recently viewed properties (up to 3)
  // Sort by lastViewedAt timestamp (most recent first), fallback to original order
  const recentProperties = useMemo(() => {
    return [...filteredProperties]
      .sort((a, b) => {
        if (!a.lastViewedAt && !b.lastViewedAt) return 0;
        if (!a.lastViewedAt) return 1;
        if (!b.lastViewedAt) return -1;
        return new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime();
      })
      .slice(0, 3);
  }, [filteredProperties]);

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
          138-Field Property Intelligence Platform
        </p>
      </motion.div>

      {/* Quick Stats Grid - Mobile: 2x2, Desktop: 4x1 */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat) => {
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
          {recentProperties.length > 0 ? (
            recentProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))
          ) : (
            <div className="glass-card p-8 text-center">
              <p className="text-gray-400 mb-4">No properties yet</p>
              <Link to="/add" className="btn-quantum inline-flex">
                <Plus className="w-5 h-5" />
                Add Your First Property
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      {/* Data Quality Overview - REAL metrics from property data */}
      <motion.div variants={itemVariants} className="mt-8">
        <div className="glass-5d p-6 rounded-2xl">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-quantum-cyan" />
            Data Quality Overview
            {fullPropertiesArray.length === 0 && (
              <span className="text-xs text-gray-500 ml-2">(No properties yet)</span>
            )}
          </h3>

          <div className="space-y-4">
            {dataQualityMetrics.map((metric) => (
              <div key={metric.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{metric.label}</span>
                  <span className={metric.colorClass}>{metric.percentage}%</span>
                </div>
                <div className="progress-quantum">
                  <div 
                    className="progress-quantum-fill" 
                    style={{ width: `${metric.percentage}%` }} 
                  />
                </div>
                {fullPropertiesArray.length > 0 && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {metric.populatedFields}/{metric.totalFields} fields
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
