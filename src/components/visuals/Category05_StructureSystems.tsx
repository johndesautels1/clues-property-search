/**
 * Category 05: Structure & Systems
 * Fields 39-48: Roof, Exterior, Foundation, HVAC, Water Heater, Garage, Laundry, Interior Condition
 *
 * 5 Charts for Condition & Age analysis:
 * 5.1 - Property Age Distribution
 * 5.2 - Roof Age vs Property Age
 * 5.3 - HVAC System Age Analysis
 * 5.4 - Interior Condition Rating
 * 5.5 - Foundation Type Distribution
 */

import { motion } from 'framer-motion';
import type { ChartProperty } from '@/lib/visualsDataMapper';
import {
  BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter,
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

export default function Category05_StructureSystems({ properties }: CategoryProps) {
  // 5.1 - Property Age Distribution
  const currentYear = new Date().getFullYear();
  const ageDistribution = [
    { range: '0-10 years', count: properties.filter(p => currentYear - p.yearBuilt <= 10).length },
    { range: '11-20 years', count: properties.filter(p => currentYear - p.yearBuilt > 10 && currentYear - p.yearBuilt <= 20).length },
    { range: '21-30 years', count: properties.filter(p => currentYear - p.yearBuilt > 20 && currentYear - p.yearBuilt <= 30).length },
    { range: '31-50 years', count: properties.filter(p => currentYear - p.yearBuilt > 30 && currentYear - p.yearBuilt <= 50).length },
    { range: '50+ years', count: properties.filter(p => currentYear - p.yearBuilt > 50).length },
  ];

  // 5.2 - Roof Age vs Property Age
  const roofVsProperty = properties
    .filter(p => p.roofAge)
    .map(p => ({
      address: p.city,
      propertyAge: currentYear - p.yearBuilt,
      roofAge: parseInt(p.roofAge) || 0,
    }));

  // 5.3 - HVAC System Age
  const hvacAges = properties
    .filter(p => p.hvacAge)
    .map(p => ({
      address: p.city,
      hvacAge: parseInt(p.hvacAge) || 0,
      type: p.hvacType || 'Unknown',
    }));

  // 5.4 - Interior Condition Rating
  const conditionData = [
    { condition: 'Excellent', count: properties.filter(p => p.interiorCondition === 'Excellent').length },
    { condition: 'Good', count: properties.filter(p => p.interiorCondition === 'Good').length },
    { condition: 'Fair', count: properties.filter(p => p.interiorCondition === 'Fair').length },
    { condition: 'Needs Work', count: properties.filter(p => p.interiorCondition === 'Needs Work').length },
    { condition: 'Renovated', count: properties.filter(p => p.interiorCondition === 'Renovated').length },
  ].filter(item => item.count > 0);

  // 5.5 - Foundation Type Distribution
  const foundationData = properties.reduce((acc, p) => {
    const type = p.foundation || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const foundationChart = Object.entries(foundationData).map(([type, count]) => ({
    type,
    count,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard title="5.1 - Property Age Distribution">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ageDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="range" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#00D9FF" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="5.2 - Roof Age vs Property Age">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="propertyAge" name="Property Age" tick={{ fill: '#9CA3AF', fontSize: 12 }} label={{ value: 'Property Age (years)', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }} />
            <YAxis dataKey="roofAge" name="Roof Age" tick={{ fill: '#9CA3AF', fontSize: 12 }} label={{ value: 'Roof Age (years)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={roofVsProperty} fill="#F59E0B" />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="5.3 - HVAC System Age Analysis">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hvacAges}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="address" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} label={{ value: 'Age (years)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="hvacAge" fill="#10B981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="5.4 - Interior Condition Rating">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={conditionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ condition, percent }) => `${condition}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {conditionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="5.5 - Foundation Type Distribution">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={foundationChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="type" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
