/**
 * CLUES Property Dashboard - Home Dashboard
 * Mobile-first overview with key metrics
 * 
 * Data Quality metrics are computed from REAL property data using field-normalizer
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Building2,
  DollarSign,
  BarChart3,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Plus,
  HelpCircle,
} from 'lucide-react';
import PropertyCardUnified from '@/components/property/PropertyCardUnified';
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

  // State for toggling Data Quality Overview (collapsed by default)
  const [showDataQuality, setShowDataQuality] = useState(false);

  // State for toggling optional sections in Data Quality Overview
  const [showOptionalSections, setShowOptionalSections] = useState(false);

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
      { label: 'Total Properties Saved', value: properties.length.toString(), icon: Building2, color: 'cyan' },
      { label: 'Avg. SMART Score', value: avgSmartScore.toString(), icon: Zap, color: 'purple' },
      { label: 'Total Value Properties Saved', value: formatValue(totalValue), icon: DollarSign, color: 'green' },
      { label: 'Average % Data Available Properties Saved', value: `${avgDataComplete}%`, icon: BarChart3, color: 'blue' },
    ];
  }, [properties]);

  // Compute REAL data quality metrics from full property data
  const dataQualityMetrics = useMemo(() => {
    return computeDataQualityByRange(fullPropertiesArray);
  }, [fullPropertiesArray]);

  // Split metrics into Critical (weight ≥ 4.85%) and Optional (weight < 4.85%)
  const { criticalMetrics, optionalMetrics } = useMemo(() => {
    const critical = dataQualityMetrics.filter(m => m.isCritical === true);
    const optional = dataQualityMetrics.filter(m => m.isCritical === false);
    return { criticalMetrics: critical, optionalMetrics: optional };
  }, [dataQualityMetrics]);

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
      <motion.div variants={itemVariants} className="mb-8 text-center">
        <h1 className="font-orbitron text-2xl md:text-4xl font-bold text-gradient-quantum mb-2">
          CLUES Dashboard
        </h1>
        <p className="text-gray-400">
          168-Field Property Intelligence Platform
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
              <PropertyCardUnified key={property.id} property={property} neonGreenScore={true} alwaysStartCollapsed={true} />
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
            <button
              className="group relative"
              title="Data Quality shows the percentage of fields populated across ALL your properties, organized by SMART Score sections. Higher percentages mean more complete property data for better analysis."
            >
              <HelpCircle className="w-4 h-4 text-gray-500 hover:text-quantum-cyan transition-colors cursor-help" />
              <div className="hidden group-hover:block absolute left-0 top-6 w-80 p-3 bg-gray-900 border border-quantum-cyan/30 rounded-lg shadow-lg z-10 text-xs font-normal text-left">
                <p className="text-white font-semibold mb-1">What is Data Quality?</p>
                <p className="text-gray-300 leading-relaxed mb-2">
                  Shows the % of fields populated across ALL your properties, organized by the 22 SMART Score sections.
                  Each section shows its weight in the overall SMART Score calculation.
                </p>
                <p className="text-quantum-cyan font-semibold mb-1">Critical Sections (94.44% of score):</p>
                <p className="text-gray-300 leading-relaxed mb-2">
                  9 sections with weight ≥ 4.85%. These drive most of your SMART Score.
                </p>
                <p className="text-amber-400 font-semibold mb-1">Optional Sections (5.56% of score):</p>
                <p className="text-gray-300 leading-relaxed">
                  13 sections with weight &lt; 4.85%. Expandable for detailed view.
                </p>
              </div>
            </button>
            {fullPropertiesArray.length === 0 && (
              <span className="text-xs text-gray-500 ml-2">(No properties yet)</span>
            )}
          </h3>

          {/* Toggle Button */}
          <button
            onClick={() => setShowDataQuality(!showDataQuality)}
            className="w-full mt-4 py-2 px-4 rounded-lg bg-quantum-cyan/10 hover:bg-quantum-cyan/20 border border-quantum-cyan/30 transition-colors flex items-center justify-center gap-2 text-quantum-cyan font-medium text-sm"
          >
            {showDataQuality ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show Detailed Data Quality
              </>
            )}
          </button>

          <AnimatePresence>
            {showDataQuality && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                {/* CRITICAL SECTIONS - Always Visible */}
                <div className="space-y-4 mb-6 mt-4">
            <h4 className="text-xs font-semibold text-quantum-cyan uppercase tracking-wider">
              Critical Sections (94.44% of SMART Score)
            </h4>
            {criticalMetrics.map((metric) => (
              <div key={metric.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">
                    {metric.label}
                    {metric.weight !== undefined && (
                      <span className="text-quantum-gold ml-2 text-xs">({metric.weight.toFixed(2)}%)</span>
                    )}
                  </span>
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

          {/* OPTIONAL SECTIONS - Expandable */}
          <div className="border-t border-gray-700 pt-4">
            <button
              onClick={() => setShowOptionalSections(!showOptionalSections)}
              className="w-full flex items-center justify-between text-sm text-gray-400 hover:text-quantum-cyan transition-colors mb-4"
            >
              <span className="font-semibold uppercase tracking-wider text-xs">
                Optional Sections (5.56% of SMART Score)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs">
                  {showOptionalSections ? 'Hide' : 'Show'} {optionalMetrics.length} sections
                </span>
                {showOptionalSections ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </button>

            {showOptionalSections && (
              <div className="space-y-4">
                {optionalMetrics.map((metric) => (
                  <div key={metric.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">
                        {metric.label}
                        {metric.weight !== undefined && (
                          <span className="text-gray-500 ml-2 text-xs">({metric.weight.toFixed(2)}%)</span>
                        )}
                      </span>
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
            )}
          </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
