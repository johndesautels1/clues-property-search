/**
 * Category 04: HOA & Taxes
 * Fields 30-38: HOA (Y/N, Fee, Name, Includes), Annual Taxes, Tax Year, Assessed Value, Ownership Type
 *
 * 5 Charts from Claude Desktop Batch 1 - Category 3 (Total Cost of Ownership):
 * 3.1 - Annual Carrying Costs Breakdown
 * 3.2 - Cost Components Stacked Bar
 * 3.3 - Monthly vs Annual Cost Comparison
 * 3.4 - Carrying Cost as % of Price
 * 3.5 - HOA vs Non-HOA Cost Analysis
 */

import { motion } from 'framer-motion';
import type { ChartProperty } from '@/lib/visualsDataMapper';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
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

export default function Category04_HOATaxes({ properties }: CategoryProps) {
  // 3.1 - Annual Carrying Costs
  const carryingCosts = properties.slice(0, 3).map(p => ({
    name: p.city,
    taxes: p.annualTaxes,
    hoa: p.hoaFeeAnnual,
    insurance: p.insuranceEstAnnual,
    total: p.annualTaxes + p.hoaFeeAnnual + p.insuranceEstAnnual,
  }));

  // 3.2 - Cost Components Stacked Bar
  const costComponents = properties.slice(0, 5).map(p => ({
    name: p.city,
    'Property Tax': p.annualTaxes,
    'HOA Fees': p.hoaFeeAnnual,
    'Insurance': p.insuranceEstAnnual,
  }));

  // 3.3 - Monthly vs Annual
  const monthlyVsAnnual = properties.slice(0, 3).map(p => ({
    name: p.city,
    monthly: (p.annualTaxes + p.hoaFeeAnnual + p.insuranceEstAnnual) / 12,
    annual: p.annualTaxes + p.hoaFeeAnnual + p.insuranceEstAnnual,
  }));

  // 3.4 - Carrying Cost %
  const costPercent = properties.map(p => ({
    address: p.city,
    percent: p.listingPrice > 0 ? ((p.annualTaxes + p.hoaFeeAnnual + p.insuranceEstAnnual) / p.listingPrice * 100) : 0,
  }));

  // 3.5 - HOA vs Non-HOA
  const hoaData = [
    { type: 'With HOA', count: properties.filter(p => p.hoaYn).length, avgCost: properties.filter(p => p.hoaYn).reduce((sum, p) => sum + p.hoaFeeAnnual, 0) / (properties.filter(p => p.hoaYn).length || 1) },
    { type: 'No HOA', count: properties.filter(p => !p.hoaYn).length, avgCost: 0 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard title="3.1 - Annual Carrying Costs Breakdown">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={carryingCosts}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} formatter={(val: number) => `$${val.toLocaleString()}`} />
            <Legend wrapperStyle={{ color: '#fff' }} />
            <Bar dataKey="taxes" stackId="a" fill="#F59E0B" name="Property Tax" />
            <Bar dataKey="hoa" stackId="a" fill="#8B5CF6" name="HOA Fees" />
            <Bar dataKey="insurance" stackId="a" fill="#EF4444" name="Insurance" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="3.2 - Cost Components Stacked Bar">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={costComponents}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} formatter={(val: number) => `$${val.toLocaleString()}`} />
            <Legend wrapperStyle={{ color: '#fff' }} />
            <Bar dataKey="Property Tax" stackId="a" fill="#F59E0B" />
            <Bar dataKey="HOA Fees" stackId="a" fill="#8B5CF6" />
            <Bar dataKey="Insurance" stackId="a" fill="#EF4444" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="3.3 - Monthly vs Annual Cost Comparison">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyVsAnnual}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} formatter={(val: number) => `$${val.toLocaleString()}`} />
            <Legend wrapperStyle={{ color: '#fff' }} />
            <Bar dataKey="monthly" fill="#00D9FF" name="Monthly" />
            <Bar dataKey="annual" fill="#10B981" name="Annual" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="3.4 - Carrying Cost as % of Price">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={costPercent}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="address" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} formatter={(val: number) => `${val.toFixed(2)}%`} />
            <Bar dataKey="percent" fill="#EC4899" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="3.5 - HOA vs Non-HOA Cost Analysis">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hoaData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="type" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#fff' }} />
            <Bar dataKey="count" fill="#8B5CF6" name="Property Count" />
            <Bar dataKey="avgCost" fill="#F59E0B" name="Avg Annual HOA" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
