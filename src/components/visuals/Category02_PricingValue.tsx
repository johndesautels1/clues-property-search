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

interface CategoryProps {
  properties: ChartProperty[];
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
    color: PROPERTY_COLORS_ARRAY[idx],
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
      {/* Chart 2.1 - Asking Price Comparison */}
      <ChartCard title="Field 10 - Asking Price Comparison">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={priceComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(val) => formatCurrency(val)}
              label={{ value: 'List Price ($)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip
              content={<CustomTooltip />}
              formatter={(val: number) => [`$${val.toLocaleString()}`, 'Price']}
            />
            <Bar dataKey="price" radius={[8, 8, 0, 0]}>
              {priceComparison.map((entry, index) => {
                // Green=best (lowest), Yellow=2nd, Red=3rd
                const color = entry.rank === 1 ? '#10B981' : entry.rank === 2 ? '#FDE047' : '#EF4444';
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <ComparisonLegend
          properties={compareProps}
          rankings={priceComparison.map(p => p.rank)}
          metric="Price"
          higherIsBetter={false}
        />
      </ChartCard>

      {/* Chart 2.2 - Price Per Square Foot */}
      <ChartCard title="Field 11 - Price Per Square Foot Analysis">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="sqft"
              name="Square Feet"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              label={{ value: 'Living Sqft', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
            />
            <YAxis
              dataKey="pricePerSqft"
              name="$/Sqft"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(val) => `$${val}`}
              label={{ value: 'Price Per Sqft ($)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                      <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                      <p className="text-white text-xs">Sqft: <span className="font-bold">{data.sqft.toLocaleString()}</span></p>
                      <p className="text-white text-xs">$/Sqft: <span className="font-bold">${data.pricePerSqft.toFixed(2)}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {pricePerSqftData.map((entry, index) => (
              <Scatter
                key={index}
                data={[entry]}
                fill={entry.color}
                name={entry.name}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
        <DualLegend properties={compareProps} />
      </ChartCard>

      {/* Chart 2.3 - Valuation Waterfall */}
      <ChartCard title="Fields 10, 12, 15, 16 - Valuation Comparison (List vs Estimates)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={valuationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(val) => formatCurrency(val)}
              label={{ value: 'Value ($)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip
              content={<CustomTooltip />}
              formatter={(val: number) => [`$${val.toLocaleString()}`, '']}
            />
            <Legend wrapperStyle={{ color: '#fff', paddingTop: '10px' }} />
            <Bar dataKey="List Price" fill="#d4af37" />
            <Bar dataKey="Market Est" fill="#4a9eff" />
            <Bar dataKey="Redfin Est" fill="#b76e79" />
            <Bar dataKey="Assessed" fill="#00d9a3" />
          </BarChart>
        </ResponsiveContainer>
        <DualLegend properties={compareProps} />
      </ChartCard>

      {/* Chart 2.4 - Historical Appreciation */}
      <ChartCard title="Fields 14 - Historical Appreciation Timeline">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={appreciationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              label={{ value: 'Appreciation (%)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                      <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                      <p className="text-white text-xs">Last Sale: <span className="font-bold">${data['Last Sale'].toLocaleString()}</span></p>
                      <p className="text-white text-xs">Current: <span className="font-bold">${data['Current Price'].toLocaleString()}</span></p>
                      <p className="text-white text-xs">Appreciation: <span className="font-bold">{data['Appreciation %'].toFixed(1)}%</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="Appreciation %"
              stroke="#10B981"
              strokeWidth={2}
              dot={(props: any) => {
                return <circle {...props} r={5} fill={props.payload.color} />;
              }}
            />
          </LineChart>
        </ResponsiveContainer>
        <DualLegend properties={compareProps} />
      </ChartCard>

      {/* Chart 2.5 - Value Differential Scatter */}
      <ChartCard title="Fields 10 vs 12 - List Price vs Market Value Gap">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="listPrice"
              name="List Price"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(val) => formatCurrency(val)}
              label={{ value: 'List Price ($)', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
            />
            <YAxis
              dataKey="difference"
              name="Difference"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(val) => formatCurrency(val)}
              label={{ value: 'Price Gap ($)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                      <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                      <p className="text-white text-xs">List Price: <span className="font-bold">${data.listPrice.toLocaleString()}</span></p>
                      <p className="text-white text-xs">Market Value: <span className="font-bold">${data.marketValue.toLocaleString()}</span></p>
                      <p className="text-white text-xs">Gap: <span className="font-bold">${data.difference.toLocaleString()} ({data.diffPercent.toFixed(1)}%)</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {valueDiffData.map((entry, index) => (
              <Scatter
                key={index}
                data={[entry]}
                fill={entry.color}
                name={entry.name}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
        <DualLegend properties={compareProps} />
      </ChartCard>
    </div>
  );
}
