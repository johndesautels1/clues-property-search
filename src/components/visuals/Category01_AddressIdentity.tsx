/**
 * Category 01: Address & Identity
 * Fields 1-9: Full Address, MLS Primary/Secondary, Listing Status, Date, Neighborhood, County, ZIP, Parcel ID
 *
 * 5 Charts for Address & Identity analysis:
 * 1.1 - Properties by City Distribution
 * 1.2 - Listing Status Overview
 * 1.3 - Neighborhood Distribution
 * 1.4 - MLS Listing Timeline
 * 1.5 - County Distribution Map
 */

import { motion } from 'framer-motion';
import type { ChartProperty } from '@/lib/visualsDataMapper';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
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

const COLORS = ['#00D9FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Category01_AddressIdentity({ properties }: CategoryProps) {
  // 1.1 - Properties by City Distribution
  const cityData = properties.reduce((acc, p) => {
    const city = p.city || 'Unknown';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const cityChart = Object.entries(cityData)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 1.2 - Listing Status Overview
  const statusData = properties.reduce((acc, p) => {
    const status = p.listingStatus || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusChart = Object.entries(statusData).map(([status, count]) => ({
    status,
    count,
  }));

  // 1.3 - Neighborhood Distribution
  const neighborhoodData = properties
    .filter(p => p.neighborhood)
    .reduce((acc, p) => {
      const neighborhood = p.neighborhood || 'Unknown';
      acc[neighborhood] = (acc[neighborhood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const neighborhoodChart = Object.entries(neighborhoodData)
    .map(([neighborhood, count]) => ({ neighborhood, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // 1.4 - MLS Listing Timeline (properties listed over time)
  const listingTimeline = properties
    .filter(p => p.listingDate)
    .map(p => {
      const date = new Date(p.listingDate);
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        timestamp: date.getTime(),
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp)
    .reduce((acc, item) => {
      acc[item.month] = (acc[item.month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const timelineChart = Object.entries(listingTimeline).map(([month, count]) => ({
    month,
    count,
  }));

  // 1.5 - County Distribution
  const countyData = properties
    .filter(p => p.county)
    .reduce((acc, p) => {
      const county = p.county || 'Unknown';
      acc[county] = (acc[county] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const countyChart = Object.entries(countyData)
    .map(([county, count]) => ({ county, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard title="1.1 - Properties by City Distribution">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={cityChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="city" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#00D9FF" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="1.2 - Listing Status Overview">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusChart}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {statusChart.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="1.3 - Neighborhood Distribution">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={neighborhoodChart} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis type="category" dataKey="neighborhood" tick={{ fill: '#9CA3AF', fontSize: 11 }} width={120} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#10B981" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="1.4 - MLS Listing Timeline">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timelineChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="count" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="1.5 - County Distribution">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={countyChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="county" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
