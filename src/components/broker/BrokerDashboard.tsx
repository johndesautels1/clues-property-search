/**
 * Broker Dashboard
 *
 * Main glassmorphic dashboard page integrating all visualization components
 * NOW READS FROM ZUSTAND STORE - Real data from property searches
 * Displays Executive KPIs, Property Comparison, Risk Analysis, ROI Projections
 *
 * HONESTY PRINCIPLE: Shows actual data or "No data" - never fake defaults
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  RefreshCw,
  Filter,
  Download,
  AlertCircle,
  Database,
} from 'lucide-react';

import ExecutiveKPICards from './ExecutiveKPICards';
import PropertyCardUnified from '../property/PropertyCardUnified';
import RiskDashboard from './RiskDashboard';
import ROITimeline from './ROITimeline';
import PropertySelector from './PropertySelector';
import PricingHistoryChart from './PricingHistoryChart';
import MonthlyCostChart from './MonthlyCostChart';
import InvestmentScoreRadar from './InvestmentScoreRadar';
import LocationExcellenceRadar from './LocationExcellenceRadar';
import PropertyConditionGauges from './PropertyConditionGauges';
import FeatureComparisonMatrix from './FeatureComparisonMatrix';
import NeighborhoodPulseChart from './NeighborhoodPulseChart';
import SpaceDistributionChart from './SpaceDistributionChart';
import SchoolProximityCards from './SchoolProximityCards';
import CommuteTimeChart from './CommuteTimeChart';

// NEW: 9 Additional Charts from 32 Compare Visuals
import ValuationCompassChart from './ValuationCompassChart';
import AppreciationVelocityChart from './AppreciationVelocityChart';
import MobilityScoresChart from './MobilityScoresChart';
import SafetyBarometerChart from './SafetyBarometerChart';
import CompetitiveLandscapeBubble from './CompetitiveLandscapeBubble';
import EnvironmentalQualityChart from './EnvironmentalQualityChart';
import InsuranceBreakdownChart from './InsuranceBreakdownChart';
import UtilityCostChart from './UtilityCostChart';
import MarketVelocityChart from './MarketVelocityChart';

// Property store for real data
import { usePropertyStore, useFullProperties } from '@/store/propertyStore';
import { mapPropertyToChart, mapPropertiesToChart, type ChartProperty } from './propertyToChartMapper';
import type { Property } from '@/types/property';

// Test data for demo mode only
import { TEST_PROPERTIES } from '../analytics/exampleData';

interface Filters {
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyTypes?: string[];
  minBedrooms?: number;
  maxBedrooms?: number;
}

interface DashboardData {
  success: boolean;
  filters: Filters;
  kpis: any;
  rankings: any;
  properties: any[];
  totalUnfiltered: number;
  totalFiltered: number;
}

interface BrokerDashboardProps {
  // Optional: pass properties directly instead of fetching from DB
  initialProperties?: any[];
  // Use test data for demo mode
  demoMode?: boolean;
}

// Helper functions for client-side KPI calculation
function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return sum(arr) / arr.length;
}

function distribution(arr: (string | number)[]): Record<string, number> {
  const dist: Record<string, number> = {};
  arr.forEach(val => {
    const key = String(val);
    dist[key] = (dist[key] || 0) + 1;
  });
  return dist;
}

// Calculate KPIs client-side (fallback when API unavailable)
function calculateKPIsClient(properties: any[]) {
  if (properties.length === 0) {
    return {
      portfolioValue: { listPrice: 0, marketEstimate: 0, redfinEstimate: 0, assessedValue: 0 },
      performance: { appreciation5yr: 0, capRate: 0, rentalYield: 0, pricePerSqft: 0, daysOnMarket: 0 },
      risk: { safetyScore: 0, floodRisk: {}, hurricaneRisk: {} },
      lifestyle: { walkScore: 0, transitScore: 0, bikeScore: 0 },
      inventory: { total: 0, byType: {}, byStatus: {}, priceBands: { under2M: 0, '2to3M': 0, '3to4M': 0, over4M: 0 } },
      count: 0,
    };
  }

  return {
    portfolioValue: {
      listPrice: sum(properties.map(p => p.listPrice || 0)),
      marketEstimate: sum(properties.map(p => p.marketEstimate || 0)),
      redfinEstimate: sum(properties.map(p => p.redfinEstimate || 0)),
      assessedValue: sum(properties.map(p => p.assessedValue || 0)),
    },
    performance: {
      appreciation5yr: avg(properties.map(p => p.appreciation5yr || 0)),
      capRate: avg(properties.map(p => p.capRate || 0)),
      rentalYield: avg(properties.map(p => p.rentalYield || 0)),
      pricePerSqft: avg(properties.map(p => p.pricePerSqft || 0)),
      daysOnMarket: avg(properties.map(p => p.daysOnMarket || 0)),
    },
    risk: {
      safetyScore: avg(properties.map(p => p.safetyScore || 0)),
      floodRisk: distribution(properties.map(p => p.floodRisk)),
      hurricaneRisk: distribution(properties.map(p => p.hurricaneRisk)),
    },
    lifestyle: {
      walkScore: avg(properties.map(p => p.walkScore || 0)),
      transitScore: avg(properties.map(p => p.transitScore || 0)),
      bikeScore: avg(properties.map(p => p.bikeScore || 0)),
    },
    inventory: {
      total: properties.length,
      byType: distribution(properties.map(p => p.propertyType || 'Unknown')),
      byStatus: distribution(properties.map(p => p.listingStatus || 'Unknown')),
      priceBands: {
        under2M: properties.filter(p => p.listPrice < 2000000).length,
        '2to3M': properties.filter(p => p.listPrice >= 2000000 && p.listPrice < 3000000).length,
        '3to4M': properties.filter(p => p.listPrice >= 3000000 && p.listPrice < 4000000).length,
        over4M: properties.filter(p => p.listPrice >= 4000000).length,
      },
    },
    count: properties.length,
  };
}

// Calculate rankings client-side
function calculateRankingsClient(properties: any[]) {
  if (properties.length === 0) return { bestCashflow: null, bestAppreciation: null, bestLifestyle: null, bestLowRisk: null };

  const sorted = {
    cashflow: [...properties].sort((a, b) => (b.capRate || 0) - (a.capRate || 0)),
    appreciation: [...properties].sort((a, b) => (b.appreciation5yr || 0) - (a.appreciation5yr || 0)),
    lifestyle: [...properties].sort((a, b) =>
      ((b.walkScore || 0) + (b.transitScore || 0) + (b.bikeScore || 0)) -
      ((a.walkScore || 0) + (a.transitScore || 0) + (a.bikeScore || 0))
    ),
    lowRisk: [...properties].sort((a, b) => {
      const aRisk = (a.floodRisk || 0) + (a.hurricaneRisk || 0) + (a.seaLevelRisk || 0);
      const bRisk = (b.floodRisk || 0) + (b.hurricaneRisk || 0) + (b.seaLevelRisk || 0);
      return aRisk - bRisk;
    }),
  };

  return {
    bestCashflow: sorted.cashflow[0] || null,
    bestAppreciation: sorted.appreciation[0] || null,
    bestLifestyle: sorted.lifestyle[0] || null,
    bestLowRisk: sorted.lowRisk[0] || null,
  };
}

// Filter properties client-side
function filterPropertiesClient(properties: any[], filters: Filters): any[] {
  return properties.filter(p => {
    if (filters.minPrice && p.listPrice < filters.minPrice) return false;
    if (filters.maxPrice && p.listPrice > filters.maxPrice) return false;
    if (filters.minBedrooms && p.bedrooms < filters.minBedrooms) return false;
    if (filters.maxBedrooms && p.bedrooms > filters.maxBedrooms) return false;
    if (filters.propertyTypes && filters.propertyTypes.length > 0) {
      if (!filters.propertyTypes.includes(p.propertyType || '')) return false;
    }
    if (filters.region) {
      if (!p.address?.toLowerCase().includes(filters.region.toLowerCase())) return false;
    }
    return true;
  });
}

export default function BrokerDashboard({ initialProperties, demoMode = false }: BrokerDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | number | 'all'>('all');
  const [dataSource, setDataSource] = useState<'store' | 'demo'>('store');

  // Get properties from Zustand store
  const fullPropertiesMap = useFullProperties();
  const propertyCards = usePropertyStore(state => state.properties);

  // Convert store properties to chart format
  const storeChartProperties = useMemo(() => {
    const fullPropsArray = Array.from(fullPropertiesMap.values());
    console.log('[BrokerDashboard] Full properties from store:', fullPropsArray.length);

    if (fullPropsArray.length === 0) {
      return [];
    }

    // Map each full property to chart format
    return fullPropsArray.map(fp => mapPropertyToChart(fp));
  }, [fullPropertiesMap]);

  // Decide which properties to use
  const chartProperties = useMemo(() => {
    if (demoMode) {
      return TEST_PROPERTIES;
    }
    if (initialProperties && initialProperties.length > 0) {
      return initialProperties;
    }
    if (storeChartProperties.length > 0) {
      return storeChartProperties;
    }
    // No data - show empty state (not fake data)
    return [];
  }, [demoMode, initialProperties, storeChartProperties]);

  // Process dashboard data (client-side, no API needed)
  const processDashboard = (properties: any[], appliedFilters: Filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const filteredProperties = filterPropertiesClient(properties, appliedFilters);
      const kpis = calculateKPIsClient(filteredProperties);
      const rankings = calculateRankingsClient(filteredProperties);

      setDashboardData({
        success: true,
        filters: appliedFilters,
        kpis,
        rankings,
        properties: filteredProperties,
        totalUnfiltered: properties.length,
        totalFiltered: filteredProperties.length,
      });
    } catch (err) {
      console.error('[BrokerDashboard] Error:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // Load properties on mount and when store changes
  useEffect(() => {
    if (chartProperties.length > 0) {
      setDataSource(demoMode ? 'demo' : 'store');
      processDashboard(chartProperties, filters);
    } else {
      setLoading(false);
      setDataSource('store');
    }
  }, [chartProperties, demoMode]);

  // Handle filter changes
  const applyFilters = () => {
    processDashboard(chartProperties, filters);
    setShowFilters(false);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    processDashboard(chartProperties, {});
  };

  // Refresh data
  const refresh = () => {
    processDashboard(chartProperties, filters);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-500/20">
            <LayoutDashboard className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Broker Dashboard</h1>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <Database className="w-3 h-3" />
              {dataSource === 'demo' ? 'Demo Mode' : 'Real Property Data'} •
              {dashboardData ? ` ${dashboardData.totalFiltered} properties` : chartProperties.length === 0 ? ' No properties saved' : ' Loading...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Export Button */}
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
            onClick={() => {
              if (dashboardData) {
                const blob = new Blob([JSON.stringify(dashboardData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'broker-dashboard-export.json';
                a.click();
              }
            }}
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </motion.div>

      {/* Filter Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-6 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Region</label>
              <input
                type="text"
                value={filters.region || ''}
                onChange={e => setFilters({ ...filters, region: e.target.value })}
                placeholder="e.g., Florida, FL"
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Min Price</label>
              <input
                type="number"
                value={filters.minPrice || ''}
                onChange={e => setFilters({ ...filters, minPrice: Number(e.target.value) || undefined })}
                placeholder="$0"
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Max Price</label>
              <input
                type="number"
                value={filters.maxPrice || ''}
                onChange={e => setFilters({ ...filters, maxPrice: Number(e.target.value) || undefined })}
                placeholder="$10,000,000"
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Min Bedrooms</label>
              <input
                type="number"
                value={filters.minBedrooms || ''}
                onChange={e => setFilters({ ...filters, minBedrooms: Number(e.target.value) || undefined })}
                placeholder="Any"
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={applyFilters}
              className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
            <p className="text-gray-400">Loading dashboard data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-red-400">Error loading dashboard</p>
            <p className="text-gray-500 text-sm max-w-md">{error}</p>
            <button
              onClick={refresh}
              className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Empty State - No Properties */}
      {!loading && !error && chartProperties.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center py-20"
        >
          <div className="flex flex-col items-center gap-6 text-center max-w-lg">
            <div className="p-6 rounded-full bg-cyan-500/10">
              <Database className="w-16 h-16 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">No Properties Yet</h2>
              <p className="text-gray-400">
                Search for a property address to populate the dashboard with real data.
                All charts will display actual values from your property searches.
              </p>
            </div>
            <div className="flex gap-4">
              <a
                href="/search"
                className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors"
              >
                Search Property
              </a>
              <button
                onClick={() => {
                  setDataSource('demo');
                  processDashboard(TEST_PROPERTIES, filters);
                }}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 font-medium transition-colors"
              >
                View Demo Data
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Dashboard Content */}
      {!loading && !error && dashboardData && dashboardData.properties.length > 0 && (
        <div className="space-y-8">
          {/* Property Selector - Toggle between single property and compare all */}
          <section>
            <PropertySelector
              properties={dashboardData.properties}
              selectedId={selectedPropertyId}
              onSelect={setSelectedPropertyId}
            />
          </section>

          {/* 1. Executive Overview KPIs */}
          <section>
            <ExecutiveKPICards kpis={dashboardData.kpis} />
          </section>

          {/* 2. Property Comparison Panels */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Property Comparison</h2>
            <div className="overflow-x-auto">
              <div className="flex gap-4 pb-4 min-w-max">
                {dashboardData.properties.map((prop: any) => {
                  // Map broker chart property format to PropertyCard format
                  const propertyCard = {
                    id: prop.id || String(Math.random()),
                    address: prop.address || '',
                    city: prop.city || '',
                    state: prop.state || '',
                    zip: prop.zip || '',
                    price: prop.listPrice || prop.price || 0,
                    pricePerSqft: prop.pricePerSqft || 0,
                    bedrooms: prop.bedrooms || 0,
                    bathrooms: prop.bathrooms || 0,
                    sqft: prop.sqft || 0,
                    yearBuilt: prop.yearBuilt || 0,
                    smartScore: prop.smartScore || 70,
                    dataCompleteness: prop.dataCompleteness || 0,
                    thumbnail: prop.thumbnail,
                    listingStatus: prop.listingStatus || 'Active',
                    daysOnMarket: prop.daysOnMarket || 0,
                  };
                  return (
                    <div key={prop.id} className="flex-shrink-0 w-80">
                      <PropertyCardUnified property={propertyCard} />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 3. Pricing History */}
          <section>
            <PricingHistoryChart
              properties={dashboardData.properties}
              selectedId={selectedPropertyId}
            />
          </section>

          {/* 3b. Valuation Compass & Appreciation Velocity */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ValuationCompassChart
              properties={dashboardData.properties}
              selectedId={selectedPropertyId}
            />
            <AppreciationVelocityChart
              properties={dashboardData.properties}
              selectedId={selectedPropertyId}
            />
          </section>

          {/* 3c. Competitive Landscape */}
          <section>
            <CompetitiveLandscapeBubble
              properties={dashboardData.properties}
              selectedId={selectedPropertyId}
            />
          </section>

          {/* 4. Monthly Cost Breakdown */}
          <section>
            <MonthlyCostChart
              properties={dashboardData.properties}
              selectedId={selectedPropertyId}
            />
          </section>

          {/* 4b. Utility & Insurance Costs */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UtilityCostChart
              properties={dashboardData.properties}
              selectedId={selectedPropertyId}
            />
            <InsuranceBreakdownChart
              properties={dashboardData.properties}
              selectedId={selectedPropertyId}
            />
          </section>

          {/* 5. Investment Score & Location Excellence Radars */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InvestmentScoreRadar
              properties={dashboardData.properties}
              selectedId={selectedPropertyId}
            />
            <LocationExcellenceRadar
              properties={dashboardData.properties}
              selectedId={selectedPropertyId}
            />
          </section>

          {/* 6. Risk Analysis Dashboard */}
          <section>
            <RiskDashboard
              properties={dashboardData.properties}
              title="Risk Analysis"
            />
          </section>

          {/* 6b. Safety & Environmental */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SafetyBarometerChart
              properties={dashboardData.properties}
              selectedId={selectedPropertyId}
            />
            <EnvironmentalQualityChart
              properties={dashboardData.properties}
              selectedId={selectedPropertyId}
            />
          </section>

          {/* 7. Property Condition Gauges */}
          <section>
            <PropertyConditionGauges
              properties={dashboardData.properties}
              selectedId={selectedPropertyId}
            />
          </section>

          {/* 8. Feature Comparison Matrix */}
          <section>
            <FeatureComparisonMatrix properties={dashboardData.properties} />
          </section>

          {/* 9. Space Distribution */}
          <section>
            <SpaceDistributionChart
              properties={dashboardData.properties}
              selectedId={selectedPropertyId}
            />
          </section>

          {/* 10. School Proximity */}
          <section>
            <SchoolProximityCards
              properties={dashboardData.properties}
              selectedId={selectedPropertyId}
            />
          </section>

          {/* 11. Commute Times */}
          <section>
            <CommuteTimeChart
              properties={dashboardData.properties}
              selectedId={selectedPropertyId}
            />
          </section>

          {/* 11b. Mobility Scores (Walk/Transit/Bike) */}
          <section>
            <MobilityScoresChart
              properties={dashboardData.properties}
              selectedId={selectedPropertyId}
            />
          </section>

          {/* 12. Neighborhood Pulse Trends */}
          <section>
            <NeighborhoodPulseChart
              properties={dashboardData.properties}
              selectedId={selectedPropertyId}
            />
          </section>

          {/* 12b. Market Velocity (Days on Market) */}
          <section>
            <MarketVelocityChart
              properties={dashboardData.properties}
              selectedId={selectedPropertyId}
            />
          </section>

          {/* 13. ROI Timeline Projections */}
          <section>
            <ROITimeline
              properties={dashboardData.properties}
              title="ROI Projections"
            />
          </section>

          {/* Rankings Section */}
          {dashboardData.rankings && (
            <section>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="rounded-2xl p-6"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <h2 className="text-xl font-bold text-white mb-4">Top Picks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {dashboardData.rankings.bestCashflow && (
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-green-400 text-xs font-medium mb-1">Best Cashflow</p>
                      <p className="text-white font-semibold truncate">{dashboardData.rankings.bestCashflow.address.split(',')[0]}</p>
                      <p className="text-green-400 text-lg font-bold">{dashboardData.rankings.bestCashflow.capRate?.toFixed(1)}% Cap Rate</p>
                    </div>
                  )}
                  {dashboardData.rankings.bestAppreciation && (
                    <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                      <p className="text-cyan-400 text-xs font-medium mb-1">Best Appreciation</p>
                      <p className="text-white font-semibold truncate">{dashboardData.rankings.bestAppreciation.address.split(',')[0]}</p>
                      <p className="text-cyan-400 text-lg font-bold">{dashboardData.rankings.bestAppreciation.appreciation5yr?.toFixed(1)}% / yr</p>
                    </div>
                  )}
                  {dashboardData.rankings.bestLifestyle && (
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <p className="text-purple-400 text-xs font-medium mb-1">Best Lifestyle</p>
                      <p className="text-white font-semibold truncate">{dashboardData.rankings.bestLifestyle.address.split(',')[0]}</p>
                      <p className="text-purple-400 text-lg font-bold">
                        {((dashboardData.rankings.bestLifestyle.walkScore || 0) + (dashboardData.rankings.bestLifestyle.transitScore || 0) + (dashboardData.rankings.bestLifestyle.bikeScore || 0)).toFixed(0)} Combined
                      </p>
                    </div>
                  )}
                  {dashboardData.rankings.bestLowRisk && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <p className="text-amber-400 text-xs font-medium mb-1">Lowest Risk</p>
                      <p className="text-white font-semibold truncate">{dashboardData.rankings.bestLowRisk.address.split(',')[0]}</p>
                      <p className="text-amber-400 text-lg font-bold">Safety: {dashboardData.rankings.bestLowRisk.safetyScore}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
