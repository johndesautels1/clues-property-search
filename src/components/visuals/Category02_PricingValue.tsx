/**
 * Category 02: Pricing & Value
 * Fields 10-16: List Price, Price/Sqft, Market Estimates, Assessed Value, Last Sale
 *
 * 5 Charts from Claude Desktop Batch 1 - Category 2:
 * 2.1 - Asking Price Comparison
 * 2.2 - Price Per Square Foot Analysis
 * 2.3 - Valuation Waterfall (Market vs Listing)
 * 2.4 - Historical Appreciation Timeline
 * 2.5 - Value Differential Scatter Plot
 */

import { motion } from 'framer-motion';
import type { ChartProperty } from '@/lib/visualsDataMapper';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

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
  // 2.1 - Asking Price Comparison
  const priceComparison = properties.map(p => ({
    address: p.city,
    price: p.listingPrice,
  }));

  // 2.2 - Price Per Square Foot
  const pricePerSqft = properties.map(p => ({
    address: p.city,
    pricePerSqft: p.pricePerSqft,
    sqft: p.livingSqft,
  }));

  // 2.3 - Valuation Waterfall
  const valuationData = properties.slice(0, 3).map(p => ({
    name: p.city,
    listing: p.listingPrice,
    market: p.marketValueEstimate,
    redfin: p.redfinEstimate,
    assessed: p.assessedValue,
  }));

  // 2.4 - Historical Appreciation
  const appreciationData = properties.map(p => ({
    address: p.city,
    lastSale: p.lastSalePrice,
    current: p.listingPrice,
    appreciation: p.lastSalePrice > 0 ? ((p.listingPrice - p.lastSalePrice) / p.lastSalePrice * 100) : 0,
  }));

  // 2.5 - Value Differential Scatter
  const valueDiff = properties.map(p => ({
    address: p.city,
    listPrice: p.listingPrice,
    marketValue: p.marketValueEstimate,
    diff: p.listingPrice - p.marketValueEstimate,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard title="2.1 - Asking Price Comparison">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={priceComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="address" tick={{ fill: '#9CA3AF', fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} formatter={(val: number) => `$${val.toLocaleString()}`} />
            <Bar dataKey="price" fill="#10B981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="2.2 - Price Per Square Foot Analysis">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="sqft" name="Sqft" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis dataKey="pricePerSqft" name="$/Sqft" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={pricePerSqft} fill="#00D9FF" />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="2.3 - Valuation Waterfall">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={valuationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} formatter={(val: number) => `$${val.toLocaleString()}`} />
            <Legend wrapperStyle={{ color: '#fff' }} />
            <Bar dataKey="listing" fill="#d4af37" name="List Price" />
            <Bar dataKey="market" fill="#4a9eff" name="Market Est" />
            <Bar dataKey="redfin" fill="#b76e79" name="Redfin Est" />
            <Bar dataKey="assessed" fill="#00d9a3" name="Assessed" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="2.4 - Historical Appreciation">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={appreciationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="address" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} formatter={(val: number) => `${val.toFixed(1)}%`} />
            <Line type="monotone" dataKey="appreciation" stroke="#10B981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="2.5 - Value Differential Scatter">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="listPrice" name="List Price" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
            <YAxis dataKey="diff" name="Difference" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={valueDiff} fill="#EF4444" />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
