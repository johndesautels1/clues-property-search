/**
 * Category 03: Property Basics
 * Fields 17-29: Beds, Baths, Sqft, Lot Size, Year Built, Type, Stories, Garage
 *
 * 5 Charts from Claude Desktop Batch 1 - Category 4 (Size & Space):
 * 4.1 - Living Space Comparison Bubble Chart
 * 4.2 - Bedroom/Bathroom Count Matrix
 * 4.3 - Lot Size vs Building Size
 * 4.4 - Space Efficiency Ratios
 * 4.5 - Price Per Room Analysis
 */

import { motion } from 'framer-motion';
import type { ChartProperty } from '@/lib/visualsDataMapper';
import {
  BarChart, Bar, ScatterChart, Scatter,
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

export default function Category03_PropertyBasics({ properties }: CategoryProps) {
  // 4.1 - Living Space Bubble
  const spaceData = properties.map(p => ({
    name: p.city,
    sqft: p.livingSqft,
    price: p.listingPrice,
    bedrooms: p.bedrooms,
  }));

  // 4.2 - Bed/Bath Matrix
  const bedBathData = properties.map(p => ({
    beds: p.bedrooms,
    baths: p.bathrooms,
    count: 1,
  })).reduce((acc, item) => {
    const key = `${item.beds}/${item.baths}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const bedBathChart = Object.entries(bedBathData).map(([key, count]) => ({
    name: key,
    count,
  }));

  // 4.3 - Lot Size vs Building
  const lotVsBuilding = properties.map(p => ({
    address: p.city,
    lotSize: p.lotSizeSqft,
    buildingSize: p.livingSqft,
  }));

  // 4.4 - Space Efficiency
  const spaceEfficiency = properties.map(p => ({
    address: p.city,
    ratio: p.lotSizeSqft > 0 ? (p.livingSqft / p.lotSizeSqft * 100) : 0,
  }));

  // 4.5 - Price Per Room
  const pricePerRoom = properties.map(p => ({
    address: p.city,
    pricePerBed: p.bedrooms > 0 ? p.listingPrice / p.bedrooms : 0,
    pricePerBath: p.bathrooms > 0 ? p.listingPrice / p.bathrooms : 0,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard title="4.1 - Living Space Comparison Bubble">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="sqft" name="Sqft" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis dataKey="price" name="Price" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={spaceData} fill="#00D9FF" />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="4.2 - Bedroom/Bathroom Count Matrix">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bedBathChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#10B981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="4.3 - Lot Size vs Building Size">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={lotVsBuilding}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="address" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#fff' }} />
            <Bar dataKey="lotSize" fill="#8B5CF6" name="Lot Size (sqft)" />
            <Bar dataKey="buildingSize" fill="#00D9FF" name="Building Size (sqft)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="4.4 - Space Efficiency Ratios">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={spaceEfficiency}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="address" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} formatter={(val: number) => `${val.toFixed(1)}%`} />
            <Bar dataKey="ratio" fill="#F59E0B" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="4.5 - Price Per Room Analysis">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={pricePerRoom}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="address" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} formatter={(val: number) => `$${val.toLocaleString()}`} />
            <Legend wrapperStyle={{ color: '#fff' }} />
            <Bar dataKey="pricePerBed" fill="#EC4899" name="Per Bedroom" />
            <Bar dataKey="pricePerBath" fill="#06B6D4" name="Per Bathroom" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
