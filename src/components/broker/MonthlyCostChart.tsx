/**
 * Monthly Cost Breakdown Chart
 *
 * Donut/Pie chart showing monthly expenses:
 * Property Tax, Insurance, HOA, Utilities, Maintenance
 */

import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { DollarSign, PieChart } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Property {
  id: string | number;
  address: string;
  propertyTax: number;
  insurance: number;
  hoaFees?: number;
  utilities: number;
  maintenance: number;
  [key: string]: any;
}

interface MonthlyCostChartProps {
  properties: Property[];
  selectedId?: string | number | 'all';
}

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function shortAddress(address: string): string {
  return address.split(',')[0] || address;
}

const COST_COLORS = {
  propertyTax: '#EF4444',
  insurance: '#F59E0B',
  hoa: '#8B5CF6',
  utilities: '#00D9FF',
  maintenance: '#10B981',
};

export default function MonthlyCostChart({ properties, selectedId = 'all' }: MonthlyCostChartProps) {
  const displayProperties = selectedId === 'all'
    ? properties
    : properties.filter(p => p.id === selectedId);

  if (displayProperties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No cost data available</p>
      </div>
    );
  }

  // Calculate totals (monthly)
  const totals = {
    propertyTax: displayProperties.reduce((sum, p) => sum + (p.propertyTax || 0), 0) / 12,
    insurance: displayProperties.reduce((sum, p) => sum + (p.insurance || 0), 0) / 12,
    hoa: displayProperties.reduce((sum, p) => sum + (p.hoaFees || 0), 0),
    utilities: displayProperties.reduce((sum, p) => sum + (p.utilities || 0), 0),
    maintenance: displayProperties.reduce((sum, p) => sum + (p.maintenance || 0), 0),
  };

  const totalMonthly = Object.values(totals).reduce((a, b) => a + b, 0);

  const data = {
    labels: ['Property Tax', 'Insurance', 'HOA Fees', 'Utilities', 'Maintenance'],
    datasets: [{
      data: [totals.propertyTax, totals.insurance, totals.hoa, totals.utilities, totals.maintenance],
      backgroundColor: [
        COST_COLORS.propertyTax,
        COST_COLORS.insurance,
        COST_COLORS.hoa,
        COST_COLORS.utilities,
        COST_COLORS.maintenance,
      ],
      borderWidth: 0,
      hoverOffset: 10,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: (ctx: any) => {
            const value = ctx.raw;
            const pct = ((value / totalMonthly) * 100).toFixed(1);
            return `${ctx.label}: ${formatCurrency(value)}/mo (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <PieChart className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-semibold">Monthly Cost Breakdown</h3>
        <span className="text-gray-500 text-sm">
          {selectedId === 'all' ? `(${displayProperties.length} properties)` : shortAddress(displayProperties[0]?.address || '')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="relative h-64">
          <Doughnut data={data} options={options} />
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-gray-500 text-xs">Total Monthly</p>
            <p className="text-white text-2xl font-bold">{formatCurrency(totalMonthly)}</p>
            <p className="text-gray-500 text-xs">/month</p>
          </div>
        </div>

        {/* Legend with values */}
        <div className="flex flex-col justify-center space-y-3">
          <CostRow
            label="Property Tax"
            value={totals.propertyTax}
            total={totalMonthly}
            color={COST_COLORS.propertyTax}
          />
          <CostRow
            label="Insurance"
            value={totals.insurance}
            total={totalMonthly}
            color={COST_COLORS.insurance}
          />
          <CostRow
            label="HOA Fees"
            value={totals.hoa}
            total={totalMonthly}
            color={COST_COLORS.hoa}
          />
          <CostRow
            label="Utilities"
            value={totals.utilities}
            total={totalMonthly}
            color={COST_COLORS.utilities}
          />
          <CostRow
            label="Maintenance"
            value={totals.maintenance}
            total={totalMonthly}
            color={COST_COLORS.maintenance}
          />
        </div>
      </div>

      {/* Annual summary */}
      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-gray-400">Annual Total</span>
        <span className="text-white text-xl font-bold">{formatCurrency(totalMonthly * 12)}/year</span>
      </div>
    </motion.div>
  );
}

function CostRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-gray-400 text-sm">{label}</span>
        </div>
        <span className="text-white font-semibold">${value.toFixed(0)}/mo</span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
