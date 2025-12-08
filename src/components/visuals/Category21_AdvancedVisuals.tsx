/**
 * Category 21: Advanced Visuals (25 Charts Total)
 * Combines DeepSeek D3.js charts (5) + Claude Recharts (10) + future expansions
 *
 * Charts:
 * DEEPSEEK D3.js (Charts 1-5):
 * 1. Market Radar - Multi-dimensional property comparison
 * 2. Value Momentum - Price progression visualization
 * 3. Price Topography - Value density contour mapping
 * 4. Time Series - Historical price timeline
 * 5. Comparative Analysis Matrix - Side-by-side property comparison
 *
 * CLAUDE RECHARTS (Charts 6-15):
 * 6. Listing Price Comparison
 * 7. $/Sq Ft Leaderboard
 * 8. List Price vs Market Value
 * 9. Value Score (0-100)
 * 10. Price Components
 * 11. Comparative Radar
 * 12. Value Gauges
 * 13. Appreciation Since Last Sale
 * 14. Overall Value Score
 * 15. Value Pyramid
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChartProperty } from '@/lib/visualsDataMapper';
import { usePropertyStore } from '@/store/propertyStore';
import { mapPropertiesToChart } from '@/lib/visualsDataMapper';
import PropertyComparisonSelector from './PropertyComparisonSelector';
import MarketRadarChart from './deepseek/MarketRadarChart';
import ValueMomentumChart from './deepseek/ValueMomentumChart';
import PriceTopographyChart from './deepseek/PriceTopographyChart';
import TimeSeriesChart from './deepseek/TimeSeriesChart';
import ComparativeAnalysisMatrix from './deepseek/ComparativeAnalysisMatrix';
import RealEstateDashboard from './recharts/RealEstateDashboard';

interface Category21Props {
  properties: ChartProperty[];
}

// Map ChartProperty to RealEstateDashboard Home interface
function mapToRealEstateHomes(properties: ChartProperty[]) {
  return properties.map((p) => ({
    id: p.id,
    name: p.address || 'Unknown Address',
    listingPrice: p.listingPrice || 0,
    pricePerSqFt: p.listingPrice && p.livingSqft ? p.listingPrice / p.livingSqft : 0,
    marketValue: p.zillowEstimate || p.redfinEstimate || p.listingPrice || 0,
    lastSaleDate: p.lastSaleDate || 'N/A',
    lastSalePrice: p.lastSalePrice || p.listingPrice || 0,
    assessedValue: p.assessedValue || p.listingPrice || 0,
    redfinEstimate: p.redfinEstimate || p.listingPrice || 0,
  }));
}

// Sample properties for testing (using correct schema field names)
const SAMPLE_PROPERTIES: ChartProperty[] = [
  {
    id: 'sample-1',
    address: '1821 Hillcrest Drive',
    city: 'Clearwater',
    state: 'FL',
    zip: '33764',
    listingPrice: 2849000,
    bedrooms: 4,
    bathrooms: 3.5,
    livingSqft: 2698,
    lotSizeSqft: 7200,
    marketValueEstimate: 2800000, // Field 12: market_value_estimate
    redfinEstimate: 2850000,      // Field 16: redfin_estimate
    lastSalePrice: 2500000,
    lastSaleDate: '2020-01-01',
    assessedValue: 2700000,
    yearBuilt: 2015,
    propertyType: 'Single Family',
    hoaFeeAnnual: 0,
    annualTaxes: 35000,
  } as ChartProperty,
  {
    id: 'sample-2',
    address: '1947 Oakwood Avenue',
    city: 'Clearwater',
    state: 'FL',
    zip: '33764',
    listingPrice: 2695000,
    bedrooms: 4,
    bathrooms: 3,
    livingSqft: 2728,
    lotSizeSqft: 8100,
    marketValueEstimate: 2650000, // Field 12: market_value_estimate
    redfinEstimate: 2700000,      // Field 16: redfin_estimate
    lastSalePrice: 2400000,
    lastSaleDate: '2021-01-01',
    assessedValue: 2600000,
    yearBuilt: 2016,
    propertyType: 'Single Family',
    hoaFeeAnnual: 0,
    annualTaxes: 33000,
  } as ChartProperty,
  {
    id: 'sample-3',
    address: '725 Live Oak Street',
    city: 'Clearwater',
    state: 'FL',
    zip: '33764',
    listingPrice: 2549000,
    bedrooms: 3,
    bathrooms: 3,
    livingSqft: 2795,
    lotSizeSqft: 9500,
    marketValueEstimate: 2600000, // Field 12: market_value_estimate
    redfinEstimate: 2550000,      // Field 16: redfin_estimate
    lastSalePrice: 2200000,
    lastSaleDate: '2019-01-01',
    assessedValue: 2500000,
    yearBuilt: 2014,
    propertyType: 'Single Family',
    hoaFeeAnnual: 0,
    annualTaxes: 31000,
  } as ChartProperty,
];

export default function Category21_AdvancedVisuals({ properties }: Category21Props) {
  const { fullProperties } = usePropertyStore();

  // State for 3 selected properties to compare
  const [selectedProperties, setSelectedProperties] = useState<[string | null, string | null, string | null]>([null, null, null]);

  // Convert all properties from store
  const allProperties = Array.from(fullProperties.values());
  const allChartProperties = mapPropertiesToChart(allProperties);

  // Use sample data if no real properties exist
  const availableProperties = allChartProperties.length > 0 ? allChartProperties : SAMPLE_PROPERTIES;

  // Auto-select first 3 properties if none selected and properties exist
  useEffect(() => {
    if (availableProperties.length >= 3 && !selectedProperties[0] && !selectedProperties[1] && !selectedProperties[2]) {
      setSelectedProperties([
        availableProperties[0].id,
        availableProperties[1].id,
        availableProperties[2].id,
      ]);
    } else if (availableProperties.length === 2 && !selectedProperties[0] && !selectedProperties[1]) {
      setSelectedProperties([availableProperties[0].id, availableProperties[1].id, null]);
    } else if (availableProperties.length === 1 && !selectedProperties[0]) {
      setSelectedProperties([availableProperties[0].id, null, null]);
    }
  }, [availableProperties.length]);

  // Handle property selection change
  const handlePropertySelect = (index: 0 | 1 | 2, propertyId: string | null) => {
    const newSelected = [...selectedProperties] as [string | null, string | null, string | null];
    newSelected[index] = propertyId;
    setSelectedProperties(newSelected);
  };

  // Get only the selected properties for charts
  const selectedChartProperties = availableProperties.filter(p =>
    selectedProperties.includes(p.id)
  );

  console.log('Category21 DEBUG:', {
    availablePropertiesCount: availableProperties.length,
    selectedProperties,
    selectedChartPropertiesCount: selectedChartProperties.length
  });

  return (
    <div className="space-y-8">
      {/* DEBUG INFO */}
      <div style={{
        padding: '20px',
        background: 'red',
        color: 'white',
        fontSize: '20px',
        fontWeight: 'bold'
      }}>
        DEBUG: Available Properties: {availableProperties.length} | Selected: {selectedChartProperties.length}
      </div>

      {/* Property Comparison Selector - 3 dropdown fields - ALWAYS VISIBLE */}
      <PropertyComparisonSelector
        properties={availableProperties}
        selectedProperties={selectedProperties}
        onPropertySelect={handlePropertySelect}
      />

      {/* Header Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30"
      >
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
        <span className="text-sm font-medium text-cyan-300">DeepSeek Advanced Visualizations</span>
      </motion.div>

      {/* Chart 2-1: Market Radar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 relative"
      >
        {/* Chart Number - Upper Left */}
        <div className="absolute top-3 left-3 text-[10px] font-mono text-gray-500">Chart 2-1</div>

        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Multi-Dimensional Market Position</h3>
            <p className="text-sm text-gray-400">Radar chart comparing properties across 6 key metrics</p>
          </div>
          {/* Smart Score Badge - will be populated by the chart component */}
          <div id="radar-smart-score"></div>
        </div>
        <div className="flex justify-center">
          <MarketRadarChart properties={selectedChartProperties} />
        </div>
        <div className="mt-4 space-y-2">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-xs text-blue-200">
              <span className="font-bold">How to read:</span> Each axis shows a normalized scale (0-100%) where 100% = best value among compared properties.
              <span className="font-semibold"> Value/Price axis</span> shows market value ÷ listing price ratio (higher = better deal).
              <span className="font-semibold"> Hover over data points</span> to see actual values (ratio, sqft, beds, etc.).
              Larger shapes = better overall property value.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <p className="text-xs text-purple-200">
              <span className="font-bold">🧠 Smart Score Calculation:</span> Weighted average of 6 metrics (Value/Price Ratio, Beds, Baths, SqFt, Lot, Age) normalized to 0-100 scale.
              <span className="font-semibold"> Value/Price Ratio</span> = Market Value ÷ Listing Price (ratio &gt; 1.0 = underpriced/good deal, &lt; 1.0 = overpriced).
              <span className="font-semibold"> Score Bands:</span>
              <span style={{ color: '#ef4444', fontWeight: 700 }}> 0-20 Red (Poor)</span>,
              <span style={{ color: '#f97316', fontWeight: 700 }}> 21-40 Orange (Below Average)</span>,
              <span style={{ color: '#eab308', fontWeight: 700 }}> 41-60 Yellow (Average)</span>,
              <span style={{ color: '#3b82f6', fontWeight: 700 }}> 61-80 Blue (Good)</span>,
              <span style={{ color: '#22c55e', fontWeight: 700 }}> 81-100 Green (Excellent)</span>.
              Higher scores = better overall value.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Chart 2-2: Value Momentum */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 relative"
      >
        {/* Chart Number - Upper Left */}
        <div className="absolute top-3 left-3 text-[10px] font-mono text-gray-500">Chart 2-2</div>

        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Value Momentum & Trends</h3>
            <p className="text-sm text-gray-400">Price progression with sale dates from last sale to current listing</p>
          </div>
          {/* Smart Score Badge - will be populated by the chart component */}
          <div id="momentum-smart-score"></div>
        </div>
        <div className="flex justify-center">
          <ValueMomentumChart properties={selectedChartProperties} />
        </div>
        <div className="mt-4 space-y-2">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-xs text-blue-200">
              <span className="font-bold">Understanding Value Types:</span>
              <span className="font-semibold"> Last Sale</span> = What the property actually sold for (with date).
              <span className="font-semibold"> Assessed Value</span> = County tax assessor's official valuation.
              <span className="font-semibold"> Market Estimate</span> = Current market value estimate (Zillow/Redfin/etc).
              <span className="font-semibold"> Current Listing</span> = What seller is asking today.
              Rising lines = appreciation, falling lines = depreciation from purchase.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <p className="text-xs text-purple-200">
              <span className="font-bold">🧠 Smart Score Calculation:</span> Weighted average of 3 momentum metrics:
              <span className="font-semibold"> (1) Appreciation</span> from last sale (50% weight): -20% = 0 pts, 0% = 50 pts, +20% = 100 pts.
              <span className="font-semibold"> (2) Market Est vs Listing</span> (30% weight): ratio &gt; 1.0 = underpriced (better).
              <span className="font-semibold"> (3) Assessed vs Listing</span> (20% weight): ratio &gt; 1.0 = underpriced (better).
              <span className="font-semibold"> Score Bands:</span>
              <span style={{ color: '#ef4444', fontWeight: 700 }}> 0-20 Red (Poor)</span>,
              <span style={{ color: '#f97316', fontWeight: 700 }}> 21-40 Orange (Below Average)</span>,
              <span style={{ color: '#eab308', fontWeight: 700 }}> 41-60 Yellow (Average)</span>,
              <span style={{ color: '#3b82f6', fontWeight: 700 }}> 61-80 Blue (Good)</span>,
              <span style={{ color: '#22c55e', fontWeight: 700 }}> 81-100 Green (Excellent)</span>.
              Higher momentum = stronger price trajectory.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Chart 3: Price Topography */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1">Value Density Topography</h3>
          <p className="text-sm text-gray-400">Contour visualization of property value distributions</p>
        </div>
        <div className="flex justify-center">
          <PriceTopographyChart properties={selectedChartProperties} />
        </div>
      </motion.div>

      {/* Chart 4: Time Series */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1">Price Evolution Timeline</h3>
          <p className="text-sm text-gray-400">Historical price changes over time</p>
        </div>
        <div className="flex justify-center">
          <TimeSeriesChart properties={selectedChartProperties} />
        </div>
      </motion.div>

      {/* Chart 5: Comparative Analysis Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1">Comparative Analysis Matrix</h3>
          <p className="text-sm text-gray-400">Side-by-side property comparison grid with percentage differences</p>
        </div>
        <div className="flex justify-center">
          <ComparativeAnalysisMatrix properties={selectedChartProperties} />
        </div>
      </motion.div>

      {/* Info Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20"
      >
        <p className="text-sm text-purple-200">
          <span className="font-semibold">Note:</span> These advanced visualizations use D3.js for sophisticated
          data representations. They provide alternative perspectives to the standard Recharts visualizations
          above for side-by-side comparison.
        </p>
      </motion.div>

      {/* Separator Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/20 to-violet-500/20 border border-teal-500/30"
      >
        <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
        <span className="text-sm font-medium text-teal-300">Claude Recharts Dashboard (10 Charts)</span>
      </motion.div>

      {/* Chart 6-15: Real Estate Dashboard with 10 integrated charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1">Comprehensive Property Analysis Dashboard</h3>
          <p className="text-sm text-gray-400">10 interactive Recharts visualizations for deep property comparison</p>
        </div>
        {selectedChartProperties.length > 0 ? (
          <RealEstateDashboard homes={mapToRealEstateHomes(selectedChartProperties)} />
        ) : (
          <div className="text-center py-12 text-gray-400">
            Please select at least one property from the dropdowns above
          </div>
        )}
      </motion.div>
    </div>
  );
}
