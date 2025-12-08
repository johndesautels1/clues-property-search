/**
 * Category 04: HOA & Taxes
 * Fields 30-38: HOA (Y/N, Fee, Name, Includes), Annual Taxes, Tax Year, Assessed Value, Ownership Type
 *
 * ✅ ChartsReadme.md Requirements:
 * - Uses only 3 selected properties from dropdown
 * - Property-specific colors (Cyan, Purple, Pink)
 * - Dual legend system
 * - Enhanced tooltips with addresses
 * - Field numbers in titles
 * - Proper units and labels
 */

import { motion } from 'framer-motion';
import type { ChartProperty } from '@/lib/visualsDataMapper';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DualLegend } from './ChartLegends';
import { PROPERTY_COLORS_ARRAY, formatCurrency, truncateAddress } from './visualConstants';

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
  // Limit to 3 selected properties
  const compareProps = properties.slice(0, 3);

  if (compareProps.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Please select at least one property to compare
      </div>
    );
  }

  // 4.1 - Annual Carrying Costs Breakdown
  const carryingCosts = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 15),
    fullAddress: p.address,
    taxes: p.annualTaxes,
    hoa: p.hoaFeeAnnual,
    insurance: p.insuranceEstAnnual,
    total: p.annualTaxes + p.hoaFeeAnnual + p.insuranceEstAnnual,
    color: PROPERTY_COLORS_ARRAY[idx],
  }));

  // 4.2 - HOA Presence & Details
  const hoaComparison = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 20),
    fullAddress: p.address,
    hasHOA: p.hoaYn ? 'Yes' : 'No',
    hoaFeeAnnual: p.hoaFeeAnnual,
    hoaFeeMonthly: p.hoaFeeAnnual / 12,
    hoaName: p.hoaName || 'N/A',
    color: PROPERTY_COLORS_ARRAY[idx],
  }));

  // 4.3 - Tax Burden Comparison
  const taxComparison = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 15),
    fullAddress: p.address,
    annualTaxes: p.annualTaxes,
    assessedValue: p.assessedValue,
    taxRate: p.assessedValue > 0 ? (p.annualTaxes / p.assessedValue * 100) : 0,
    color: PROPERTY_COLORS_ARRAY[idx],
  }));

  // 4.4 - Carrying Cost as % of Price
  const costPercent = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 20),
    fullAddress: p.address,
    percent: p.listingPrice > 0 ? ((p.annualTaxes + p.hoaFeeAnnual + p.insuranceEstAnnual) / p.listingPrice * 100) : 0,
    annualTotal: p.annualTaxes + p.hoaFeeAnnual + p.insuranceEstAnnual,
    listingPrice: p.listingPrice,
    color: PROPERTY_COLORS_ARRAY[idx],
  }));

  // 4.5 - Total Annual Cost Comparison
  const totalAnnualCost = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 15),
    fullAddress: p.address,
    'Property Tax': p.annualTaxes,
    'HOA Fees': p.hoaFeeAnnual,
    'Insurance': p.insuranceEstAnnual,
    total: p.annualTaxes + p.hoaFeeAnnual + p.insuranceEstAnnual,
    color: PROPERTY_COLORS_ARRAY[idx],
  }));

  return (
    <div className="space-y-6">
      {/* Chart 4.1 - Annual Carrying Costs Breakdown */}
      <ChartCard title="Fields 30-35 - Annual Carrying Costs Breakdown">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={carryingCosts}>
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
              label={{ value: 'Annual Cost ($)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                      <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                      <p className="text-white text-xs">Property Tax: <span className="font-bold">${data.taxes.toLocaleString()}</span></p>
                      <p className="text-white text-xs">HOA Fees: <span className="font-bold">${data.hoa.toLocaleString()}</span></p>
                      <p className="text-white text-xs">Insurance: <span className="font-bold">${data.insurance.toLocaleString()}</span></p>
                      <p className="text-white text-xs mt-1 border-t border-white/20 pt-1">Total: <span className="font-bold">${data.total.toLocaleString()}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ color: '#fff', paddingTop: '10px' }} />
            <Bar dataKey="taxes" stackId="a" fill="#F59E0B" name="Property Tax" />
            <Bar dataKey="hoa" stackId="a" fill="#8B5CF6" name="HOA Fees" />
            <Bar dataKey="insurance" stackId="a" fill="#EF4444" name="Insurance" />
          </BarChart>
        </ResponsiveContainer>
        <DualLegend properties={compareProps} />
      </ChartCard>

      {/* Chart 4.2 - HOA Presence & Details */}
      <ChartCard title="Fields 30-33 - HOA Presence & Details">
        <div className="h-full flex items-center">
          <div className="w-full space-y-4">
            {hoaComparison.map((prop, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border"
                style={{
                  borderColor: `${prop.color}40`,
                  backgroundColor: `${prop.color}10`
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: prop.color }}
                  />
                  <span className="text-white font-semibold text-sm">{prop.fullAddress}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">Has HOA:</span>
                    <span className="text-white font-bold ml-2">{prop.hasHOA}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">HOA Name:</span>
                    <span className="text-white font-bold ml-2">{prop.hoaName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Annual Fee:</span>
                    <span className="text-white font-bold ml-2">${prop.hoaFeeAnnual.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Monthly Fee:</span>
                    <span className="text-white font-bold ml-2">${prop.hoaFeeMonthly.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DualLegend properties={compareProps} />
      </ChartCard>

      {/* Chart 4.3 - Tax Burden Comparison */}
      <ChartCard title="Fields 35-37 - Tax Burden Comparison">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={taxComparison}>
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
              label={{ value: 'Annual Tax ($)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                      <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                      <p className="text-white text-xs">Annual Taxes: <span className="font-bold">${data.annualTaxes.toLocaleString()}</span></p>
                      <p className="text-white text-xs">Assessed Value: <span className="font-bold">${data.assessedValue.toLocaleString()}</span></p>
                      <p className="text-white text-xs">Effective Rate: <span className="font-bold">{data.taxRate.toFixed(2)}%</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="annualTaxes" radius={[8, 8, 0, 0]}>
              {taxComparison.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <DualLegend properties={compareProps} />
      </ChartCard>

      {/* Chart 4.4 - Carrying Cost as % of Price */}
      <ChartCard title="Fields 30-35 - Carrying Cost as % of List Price">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={costPercent}>
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
              label={{ value: 'Cost as % of Price', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                      <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                      <p className="text-white text-xs">List Price: <span className="font-bold">${data.listingPrice.toLocaleString()}</span></p>
                      <p className="text-white text-xs">Annual Carrying Cost: <span className="font-bold">${data.annualTotal.toLocaleString()}</span></p>
                      <p className="text-white text-xs mt-1">As % of Price: <span className="font-bold">{data.percent.toFixed(2)}%</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="percent" radius={[8, 8, 0, 0]}>
              {costPercent.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <DualLegend properties={compareProps} />
      </ChartCard>

      {/* Chart 4.5 - Total Annual Cost Comparison */}
      <ChartCard title="Fields 30-35 - Total Annual Cost Comparison">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={totalAnnualCost}>
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
              label={{ value: 'Total Annual Cost ($)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                      <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                      <p className="text-white text-xs">Property Tax: <span className="font-bold">${data['Property Tax'].toLocaleString()}</span></p>
                      <p className="text-white text-xs">HOA Fees: <span className="font-bold">${data['HOA Fees'].toLocaleString()}</span></p>
                      <p className="text-white text-xs">Insurance: <span className="font-bold">${data['Insurance'].toLocaleString()}</span></p>
                      <p className="text-white text-xs mt-1 border-t border-white/20 pt-1">Total: <span className="font-bold">${data.total.toLocaleString()}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="total" radius={[8, 8, 0, 0]}>
              {totalAnnualCost.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <DualLegend properties={compareProps} />
      </ChartCard>
    </div>
  );
}
