/**
 * Category 01: Address & Identity
 * Fields 1-9: Location, MLS, Parcel Data
 *
 * Visuals:
 * 1. Property Location Map (City/County Distribution)
 * 2. MLS Listing Status Overview
 * 3. Neighborhood Comparison
 * 4. County Distribution Pie Chart
 * 5. Listing Date Timeline
 */

import { motion } from 'framer-motion';
import type { ChartProperty } from '@/lib/visualsDataMapper';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

interface CategoryProps {
  properties: ChartProperty[];
}

// Glassmorphic card wrapper
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all"
    >
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="w-full h-80">
        {children}
      </div>
    </motion.div>
  );
}

// Custom tooltip
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

export default function Category01_AddressIdentity({ properties }: CategoryProps) {
  // 1. City Distribution
  const cityData = properties.reduce((acc, prop) => {
    const city = prop.city || 'Unknown';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const cityChartData = Object.entries(cityData).map(([city, count]) => ({
    city,
    count,
  }));

  // 2. Listing Status
  const statusData = properties.reduce((acc, prop) => {
    const status = prop.listingStatus || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusChartData = Object.entries(statusData).map(([status, count]) => ({
    status,
    count,
  }));

  // 3. County Distribution
  const countyData = properties.reduce((acc, prop) => {
    const county = prop.county || 'Unknown';
    acc[county] = (acc[county] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const countyChartData = Object.entries(countyData).map(([name, value]) => ({
    name,
    value,
  }));

  // 4. Neighborhood Comparison (Top 10 by avg price)
  const neighborhoodData = properties.reduce((acc, prop) => {
    const neighborhood = prop.neighborhood || 'Unknown';
    if (!acc[neighborhood]) {
      acc[neighborhood] = { total: 0, count: 0 };
    }
    acc[neighborhood].total += prop.listingPrice;
    acc[neighborhood].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const neighborhoodChartData = Object.entries(neighborhoodData)
    .map(([name, data]) => ({
      name,
      avgPrice: Math.round(data.total / data.count),
      count: data.count,
    }))
    .sort((a, b) => b.avgPrice - a.avgPrice)
    .slice(0, 10);

  // 5. Property Type Distribution
  const typeData = properties.reduce((acc, prop) => {
    const type = prop.propertyType || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeChartData = Object.entries(typeData).map(([name, value]) => ({
    name,
    value,
  }));

  // Colors
  const COLORS = ['#00D9FF', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. City Distribution */}
      <ChartCard title="1. Property Distribution by City">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={cityChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="city"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#00D9FF" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2. Listing Status */}
      <ChartCard title="2. MLS Listing Status Overview">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ status, count }) => `${status}: ${count}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
              nameKey="status"
            >
              {statusChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#fff' }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 3. County Distribution */}
      <ChartCard title="3. County Distribution">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={countyChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {countyChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#fff' }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 4. Neighborhood Comparison (Avg Price) */}
      <ChartCard title="4. Top Neighborhoods by Avg Price">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={neighborhoodChartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              type="number"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              width={120}
            />
            <Tooltip
              content={<CustomTooltip />}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Avg Price']}
            />
            <Bar dataKey="avgPrice" fill="#10B981" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 5. Property Type Distribution */}
      <ChartCard title="5. Property Type Breakdown">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={typeChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Summary Stats */}
      <div className="lg:col-span-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <div className="text-cyan-400 text-sm font-medium">Total Properties</div>
            <div className="text-white text-2xl font-bold mt-1">{properties.length}</div>
          </div>
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="text-green-400 text-sm font-medium">Unique Cities</div>
            <div className="text-white text-2xl font-bold mt-1">{Object.keys(cityData).length}</div>
          </div>
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="text-purple-400 text-sm font-medium">Unique Counties</div>
            <div className="text-white text-2xl font-bold mt-1">{Object.keys(countyData).length}</div>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="text-amber-400 text-sm font-medium">Unique Neighborhoods</div>
            <div className="text-white text-2xl font-bold mt-1">{Object.keys(neighborhoodData).length}</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
