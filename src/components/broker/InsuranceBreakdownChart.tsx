/**
 * Insurance Breakdown Chart
 *
 * Doughnut chart showing insurance cost components
 */

import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Shield } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Property {
  id: string | number;
  address: string;
  costs?: {
    insuranceAnnual?: number | null;
    floodInsurance?: number | null;
    homeownersInsurance?: number | null;
  };
  [key: string]: any;
}

interface InsuranceBreakdownChartProps {
  properties: Property[];
  selectedId?: string | number | 'all';
}

function shortAddress(address: string): string {
  return address.split(',')[0] || address;
}

const CHART_COLORS = ['#00D9FF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

export default function InsuranceBreakdownChart({ properties, selectedId = 'all' }: InsuranceBreakdownChartProps) {
  const displayProperties = selectedId === 'all'
    ? properties
    : properties.filter(p => p.id === selectedId);

  if (displayProperties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No insurance data available</p>
      </div>
    );
  }

  // For single property, show breakdown of insurance components
  // For multiple properties, show comparison of total insurance
  const singleProp = displayProperties.length === 1 ? displayProperties[0] : null;

  if (singleProp) {
    // Single property - breakdown view
    const homeowners = singleProp.costs?.homeownersInsurance || 0;
    const flood = singleProp.costs?.floodInsurance || 0;
    const total = singleProp.costs?.insuranceAnnual || (homeowners + flood);

    // If we have total but not breakdown, estimate
    const estimatedHomeowners = homeowners || (total * 0.7);
    const estimatedFlood = flood || (total * 0.3);

    const data = {
      labels: ['Homeowners', 'Flood'],
      datasets: [{
        data: [estimatedHomeowners, estimatedFlood],
        backgroundColor: [
          'rgba(0, 217, 255, 0.7)',
          'rgba(139, 92, 246, 0.7)',
        ],
        borderColor: ['#00D9FF', '#8B5CF6'],
        borderWidth: 2,
      }],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          display: true,
          position: 'bottom' as const,
          labels: { color: '#9CA3AF', usePointStyle: true },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          callbacks: {
            label: (ctx: any) => `${ctx.label}: ${formatCurrency(ctx.raw)}/yr`,
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-semibold">Insurance Breakdown</h3>
          </div>
          <div className="text-right">
            <span className="text-gray-400 text-xs">Total Annual</span>
            <span className="text-white font-bold ml-2">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="h-48 relative">
          <Doughnut data={data} options={options} />
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-white">{formatCurrency(total)}</span>
            <span className="text-gray-500 text-xs">/year</span>
          </div>
        </div>

        {/* Monthly breakdown */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white/5">
              <span className="text-gray-400 text-xs">Monthly</span>
              <p className="text-white font-bold text-lg">{formatCurrency(Math.round(total / 12))}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <span className="text-gray-400 text-xs">Flood Risk</span>
              <p className="text-white font-bold text-lg">
                {flood > 0 ? `${Math.round((flood / total) * 100)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Multi-property comparison view
  const propertyData = displayProperties.map(p => ({
    address: shortAddress(p.address),
    total: p.costs?.insuranceAnnual || (p.costs?.homeownersInsurance || 0) + (p.costs?.floodInsurance || 0),
  })).filter(p => p.total > 0);

  if (propertyData.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No insurance data available</p>
      </div>
    );
  }

  const data = {
    labels: propertyData.map(p => p.address),
    datasets: [{
      data: propertyData.map(p => p.total),
      backgroundColor: propertyData.map((_, i) => CHART_COLORS[i % CHART_COLORS.length] + '80'),
      borderColor: propertyData.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
      borderWidth: 2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '50%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: { color: '#9CA3AF', usePointStyle: true },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: (ctx: any) => `${ctx.label}: ${formatCurrency(ctx.raw)}/yr`,
        },
      },
    },
  };

  // Find lowest insurance
  const sortedByInsurance = [...propertyData].sort((a, b) => a.total - b.total);
  const lowestInsurance = sortedByInsurance[0];
  const avgInsurance = Math.round(propertyData.reduce((sum, p) => sum + p.total, 0) / propertyData.length);

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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-semibold">Insurance Comparison</h3>
        </div>
        <div className="text-right">
          <span className="text-gray-400 text-xs">Avg</span>
          <span className="text-white font-bold ml-2">{formatCurrency(avgInsurance)}</span>
          <span className="text-gray-500 text-xs">/yr</span>
        </div>
      </div>

      <div className="h-48">
        <Doughnut data={data} options={options} />
      </div>

      {/* Lowest insurance callout */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">Lowest Insurance</span>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">{lowestInsurance.address}</span>
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400">
              {formatCurrency(lowestInsurance.total)}/yr
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
