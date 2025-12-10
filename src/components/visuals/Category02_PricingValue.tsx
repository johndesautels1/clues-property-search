/**
 * Category 02: Pricing & Value
 * Fields 10-16: List Price, Price/Sqft, Market Estimates, Assessed Value, Last Sale
 *
 * ✅ ChartsReadme.md Requirements:
 * - 3-property comparison with property-specific colors (Cyan, Purple, Pink)
 * - Dual legend system (Property + Score/Ranking)
 * - Universal 1-100 color scoring where applicable
 * - Comparison ranking colors (Green=Best, Yellow=2nd, Red=3rd)
 * - Clear data labels with units
 * - Hover tooltips with exact values
 */

import { motion } from 'framer-motion';
import type { ChartProperty } from '@/lib/visualsDataMapper';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { DualLegend, ComparisonLegend } from './ChartLegends';
import { PROPERTY_COLORS_ARRAY, formatCurrency, rankPropertiesByValue, truncateAddress } from './visualConstants';
import RealEstateDashboard from './recharts/RealEstateDashboard';
import MarketRadarChart from './deepseek/MarketRadarChart';
import ValueMomentumChart from './deepseek/ValueMomentumChart';

interface CategoryProps {
  properties: ChartProperty[];
}

// Map ChartProperty to RealEstateDashboard Home interface
// VERIFIED AGAINST SCHEMA: Fields 10, 11, 12, 13, 14, 15, 17-29
function mapToRealEstateHomes(properties: ChartProperty[]) {
  const currentYear = new Date().getFullYear();

  return properties.map((p, idx) => ({
    id: p.id,
    name: p.address || 'Unknown Address',
    listingPrice: p.listingPrice || 0,                                              // Field 10: listing_price
    pricePerSqFt: p.pricePerSqft || (p.listingPrice && p.livingSqft ? Math.round((p.listingPrice / p.livingSqft) * 100) / 100 : 0), // Field 11: price_per_sqft (calculated if not present, rounded to 2 decimals)
    marketValue: p.marketValueEstimate || 0,                                        // Field 12: market_value_estimate
    lastSaleDate: p.lastSaleDate || 'N/A',                                         // Field 13: last_sale_date
    lastSalePrice: p.lastSalePrice || 0,                                           // Field 14: last_sale_price
    assessedValue: p.assessedValue || 0,                                           // Field 15: assessed_value
    redfinEstimate: p.redfinEstimate || p.marketValueEstimate || 0,                // Field 12 fallback
    yearBuilt: p.yearBuilt || currentYear,                                         // Field 25: year_built
    // Fields 17-29 for Property Basics charts
    bedrooms: p.bedrooms || 0,                                                     // Field 17: bedrooms
    fullBathrooms: p.fullBathrooms || 0,                                           // Field 18: full_bathrooms
    halfBathrooms: p.halfBathrooms || 0,                                           // Field 19: half_bathrooms
    totalBathrooms: p.bathrooms || 0,                                              // Field 20: total_bathrooms
    livingSqft: p.livingSqft || 0,                                                 // Field 21: living_sqft
    totalSqftUnderRoof: p.totalSqftUnderRoof || p.livingSqft || 0,                // Field 22: total_sqft_under_roof
    lotSizeSqft: p.lotSizeSqft || 0,                                               // Field 23: lot_size_sqft
    lotSizeAcres: p.lotSizeAcres || (p.lotSizeSqft ? Math.round((p.lotSizeSqft / 43560) * 100) / 100 : 0), // Field 24: lot_size_acres
    propertyType: p.propertyType || 'Unknown',                                     // Field 26: property_type
    stories: p.stories || 1,                                                       // Field 27: stories
    garageSpaces: p.garageSpaces || 0,                                             // Field 28: garage_spaces
    parkingTotal: p.parkingTotal || 'N/A',                                         // Field 29: parking_total
    // Property color assignment
    color: ['#22c55e', '#8b5cf6', '#ec4899'][idx] || '#22c55e',                    // Green, Lavender, Pink
  }));
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all"
    >
      <h3 className="text-sm font-semibold text-cyan-400 mb-4">{title}</h3>
      <div className="w-full h-80">
        {children}
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
        <p className="text-cyan-400 font-semibold text-sm">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-white text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Chart 2-7 property colors: Teal, Violet, Pink
const CHART_2_7_COLORS = ['#14b8a6', '#8b5cf6', '#ec4899'];

export default function Category02_PricingValue({ properties }: CategoryProps) {
  // Limit to 3 properties max
  const compareProps = properties.slice(0, 3);

  // 2.1 - Asking Price Comparison
  // Show which property has best price (lowest for buyers)
  const prices = compareProps.map(p => p.listingPrice);
  const priceRankings = rankPropertiesByValue(prices, false); // Lower price is better

  const priceComparison = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 20),
    fullAddress: p.address,
    price: p.listingPrice,
    rank: priceRankings.indexOf(idx) + 1,
  }));

  // 2.2 - Price Per Square Foot Analysis
  const pricePerSqftData = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 15),
    fullAddress: p.address,
    sqft: p.livingSqft,
    pricePerSqft: p.pricePerSqft,
    color: CHART_2_7_COLORS[idx],
  }));

  // 2.3 - Valuation Waterfall (Market vs Listing)
  const valuationData = compareProps.map((p, idx) => ({
    name: `Prop ${idx + 1}`,
    fullAddress: p.address,
    'List Price': p.listingPrice,
    'Market Est': p.marketValueEstimate,
    'Redfin Est': p.redfinEstimate,
    'Assessed': p.assessedValue,
  }));

  // 2.4 - Historical Appreciation
  const appreciationData = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 15),
    fullAddress: p.address,
    'Last Sale': p.lastSalePrice,
    'Current Price': p.listingPrice,
    'Appreciation %': p.lastSalePrice > 0 ? ((p.listingPrice - p.lastSalePrice) / p.lastSalePrice * 100) : 0,
    color: PROPERTY_COLORS_ARRAY[idx],
  }));

  // 2.5 - Value Differential (List Price vs Market Value)
  const valueDiffData = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 15),
    fullAddress: p.address,
    listPrice: p.listingPrice,
    marketValue: p.marketValueEstimate,
    difference: p.listingPrice - p.marketValueEstimate,
    diffPercent: p.marketValueEstimate > 0 ? ((p.listingPrice - p.marketValueEstimate) / p.marketValueEstimate * 100) : 0,
    color: PROPERTY_COLORS_ARRAY[idx],
  }));

  return (
    <div className="space-y-6">
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
          <MarketRadarChart properties={compareProps} />
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
          <ValueMomentumChart properties={compareProps} />
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
              <span className="font-bold">🧠 Smart Score Calculation:</span> Weighted average of 3 momentum metrics using 5-tier scale:
              <span className="font-semibold"> (1) Appreciation</span> from last sale (50% weight): -20% = 0 pts (Red), -10% = 25 pts (Orange), 0% = 50 pts (Yellow), +10% = 75 pts (Blue), +20% = 100 pts (Green).
              <span className="font-semibold"> (2) Market Est vs Listing</span> (30% weight): Same 5-tier scale based on % difference from 1.0 ratio.
              <span className="font-semibold"> (3) Assessed vs Listing</span> (20% weight): Same 5-tier scale based on % difference from 1.0 ratio.
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

      {/* RealEstateDashboard: Charts 2-3 through 2-7 */}
      <RealEstateDashboard homes={mapToRealEstateHomes(compareProps)} />

      {/* Chart 2-8 - Price Per Square Foot Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 relative"
      >
        {/* Chart Number - Upper Left */}
        <div className="absolute top-3 left-3 text-[10px] font-mono text-gray-500">Chart 2-8</div>

        {/* Smart Score Badge - Top Right - WINNER ONLY */}
        {(() => {
          const lowestPriceSqft = Math.min(...pricePerSqftData.map(p => p.pricePerSqft));
          const highestPriceSqft = Math.max(...pricePerSqftData.map(p => p.pricePerSqft));

          // Winner score: inverse scale (lower $/sqft = higher score)
          // Winner always gets 100 since they have the lowest $/sqft
          const winnerScore = 100;
          const scoreColor = '#4CAF50'; // Green - Excellent

          return (
            <div className="absolute top-4 right-4 flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center opacity-90"
                style={{ backgroundColor: scoreColor }}
              >
                <span className="text-lg">🧠</span>
              </div>
              <div className="text-[0.6rem] font-bold text-white mt-1 text-center whitespace-nowrap">
                SMART: {winnerScore}
              </div>
            </div>
          );
        })()}

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1">Price Per Square Foot Comparison</h3>
          <p className="text-sm text-gray-400">Efficiency analysis: Lower $/sqft = better value</p>
        </div>

        {/* Horizontal Bar Chart */}
        <div className="mb-4">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={pricePerSqftData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                type="number"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(val) => `$${val}`}
                label={{ value: 'Price Per Sqft ($)', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                width={120}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                        <p className="text-cyan-400 font-semibold text-xs mb-2">{data.fullAddress}</p>
                        <p className="text-white text-xs">Living Sqft: <span className="font-bold">{data.sqft.toLocaleString()}</span></p>
                        <p className="text-white text-xs">Price/Sqft: <span className="font-bold">${data.pricePerSqft.toFixed(2)}</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="pricePerSqft" radius={[0, 8, 8, 0]}>
                {pricePerSqftData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Winner Badge */}
        {(() => {
          const lowestPriceSqft = Math.min(...pricePerSqftData.map(p => p.pricePerSqft));
          const winner = pricePerSqftData.find(p => p.pricePerSqft === lowestPriceSqft);
          const highestPriceSqft = Math.max(...pricePerSqftData.map(p => p.pricePerSqft));

          if (!winner) return null;

          // Winner's individual score (inverse scale: lower = better)
          const winnerScore = Math.round(((highestPriceSqft - lowestPriceSqft) / (highestPriceSqft - lowestPriceSqft)) * 100);
          const scoreColor =
            winnerScore >= 81 ? '#4CAF50' :
            winnerScore >= 61 ? '#2196F3' :
            winnerScore >= 41 ? '#FFEB3B' :
            winnerScore >= 21 ? '#FF9800' : '#FF4444';
          const scoreLabel =
            winnerScore >= 81 ? 'Excellent' :
            winnerScore >= 61 ? 'Good' :
            winnerScore >= 41 ? 'Average' :
            winnerScore >= 21 ? 'Fair' : 'Poor';

          return (
            <div className="mt-4 flex justify-center">
              <div
                className="flex items-center gap-3 px-5 py-3 rounded-xl"
                style={{
                  background: `${scoreColor}20`,
                  border: `2px solid ${scoreColor}`
                }}
              >
                <span className="text-2xl">🏆</span>
                <div>
                  <div className="text-sm font-bold text-white">
                    Winner: {winner.fullAddress}
                  </div>
                  <div className="text-xs text-gray-300">
                    CLUES-Smart Score: <span style={{ color: scoreColor, fontWeight: 700 }}>
                      {Math.round(winnerScore)}/100
                    </span> ({scoreLabel}) - ${lowestPriceSqft.toFixed(2)}/sqft (Best Value)
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Smart Score Legend & Calculation Breakdown */}
        <div className="mt-4 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <p className="text-xs text-purple-200 mb-3">
            <span className="font-bold">🧠 CLUES-Smart Score Calculation (Winner Property):</span>
          </p>

          {/* Step-by-step calculation */}
          {(() => {
            const lowestPriceSqft = Math.min(...pricePerSqftData.map(p => p.pricePerSqft));
            const highestPriceSqft = Math.max(...pricePerSqftData.map(p => p.pricePerSqft));
            const winner = pricePerSqftData.find(p => p.pricePerSqft === lowestPriceSqft);

            return (
              <div className="text-xs text-purple-100 space-y-2 font-mono bg-slate-900/40 p-3 rounded">
                <div><span className="text-purple-300 font-bold">Metric:</span> Price Per Square Foot (Lower = Better Value)</div>

                <div className="pt-2"><span className="text-purple-300 font-bold">Comparison Range:</span></div>
                <div className="pl-4">• Lowest $/sqft (Best) = ${lowestPriceSqft.toFixed(2)}</div>
                <div className="pl-4">• Highest $/sqft (Worst) = ${highestPriceSqft.toFixed(2)}</div>
                <div className="pl-4">• Range = ${(highestPriceSqft - lowestPriceSqft).toFixed(2)}</div>

                <div className="pt-2"><span className="text-purple-300 font-bold">Winner Property:</span></div>
                <div className="pl-4">• {winner?.fullAddress}</div>
                <div className="pl-4">• Price/Sqft = ${lowestPriceSqft.toFixed(2)}</div>
                <div className="pl-4">• Score = 100/100 (Lowest $/sqft = Best Value)</div>

                <div className="pt-2 font-bold text-green-300">✓ Winner gets 100/100 for having the best price efficiency</div>
              </div>
            );
          })()}

        </div>

        {/* Property Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-400">Properties:</span>
          {compareProps.map((prop, idx) => (
            <div key={prop.id} className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: CHART_2_7_COLORS[idx] }}
              />
              <span className="text-gray-400">{prop.address}</span>
            </div>
          ))}
        </div>

        {/* Score Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#FF4444' }} />
            <span className="text-gray-400">
              0–20 <span className="font-semibold">Poor</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#FF9800' }} />
            <span className="text-gray-400">
              21–40 <span className="font-semibold">Fair</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#FFEB3B' }} />
            <span className="text-gray-400">
              41–60 <span className="font-semibold">Average</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#2196F3' }} />
            <span className="text-gray-400">
              61–80 <span className="font-semibold">Good</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#4CAF50' }} />
            <span className="text-gray-400">
              81+ <span className="font-semibold">Excellent</span>
            </span>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
