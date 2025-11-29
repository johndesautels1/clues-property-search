/**
 * Utility Cost Chart
 *
 * Stacked bar chart showing electric/gas/water utility costs
 */

import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Zap, Flame, Droplets } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Property {
  id: string | number;
  address: string;
  costs?: {
    electricMonthly?: number | null;
    gasMonthly?: number | null;
    waterMonthly?: number | null;
    utilitiesMonthly?: number | null;
  };
  [key: string]: any;
}

interface UtilityCostChartProps {
  properties: Property[];
  selectedId?: string | number | 'all';
}

function shortAddress(address: string): string {
  return address.split(',')[0] || address;
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

export default function UtilityCostChart({ properties, selectedId = 'all' }: UtilityCostChartProps) {
  const displayProperties = selectedId === 'all'
    ? properties
    : properties.filter(p => p.id === selectedId);

  if (displayProperties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No utility cost data available</p>
      </div>
    );
  }

  // Extract utility data for each property
  const utilityData = displayProperties.map(p => {
    const electric = p.costs?.electricMonthly || 0;
    const gas = p.costs?.gasMonthly || 0;
    const water = p.costs?.waterMonthly || 0;
    const total = p.costs?.utilitiesMonthly || (electric + gas + water);

    // If we have total but not breakdown, estimate typical distribution
    const hasBreakdown = electric > 0 || gas > 0 || water > 0;

    return {
      address: shortAddress(p.address),
      electric: hasBreakdown ? electric : total * 0.5,
      gas: hasBreakdown ? gas : total * 0.3,
      water: hasBreakdown ? water : total * 0.2,
      total: hasBreakdown ? (electric + gas + water) : total,
    };
  });

  const labels = utilityData.map(d => d.address);

  const data = {
    labels,
    datasets: [
      {
        label: 'Electric',
        data: utilityData.map(d => d.electric),
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderColor: '#F59E0B',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Gas',
        data: utilityData.map(d => d.gas),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: '#EF4444',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Water',
        data: utilityData.map(d => d.water),
        backgroundColor: 'rgba(0, 217, 255, 0.7)',
        borderColor: '#00D9FF',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: '#9CA3AF', font: { size: 11 } },
      },
      y: {
        stacked: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#9CA3AF',
          callback: (value: number) => `$${value}`,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { color: '#9CA3AF', usePointStyle: true },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}/mo`,
          footer: (items: any[]) => {
            const total = items.reduce((sum, item) => sum + item.raw, 0);
            return `Total: ${formatCurrency(total)}/mo`;
          },
        },
      },
    },
  };

  // Calculate stats
  const avgTotal = Math.round(utilityData.reduce((sum, d) => sum + d.total, 0) / utilityData.length);

  // Find lowest utility cost
  const sortedByTotal = [...utilityData].sort((a, b) => a.total - b.total);
  const lowestCost = sortedByTotal[0];

  // Single property view with icons
  const singleProp = displayProperties.length === 1 ? displayProperties[0] : null;
  const singleData = singleProp ? utilityData[0] : null;

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
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="text-white font-semibold">Utility Costs</h3>
        </div>
        <div className="text-right">
          <span className="text-gray-400 text-xs">Avg Monthly</span>
          <span className="text-white font-bold ml-2">{formatCurrency(avgTotal)}</span>
        </div>
      </div>

      <div className="h-48">
        <Bar data={data} options={options as any} />
      </div>

      {/* Single property icon breakdown */}
      {singleProp && singleData && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 mb-2">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-white font-bold">{formatCurrency(singleData.electric)}</p>
              <p className="text-gray-500 text-xs">Electric/mo</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-500/20 mb-2">
                <Flame className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-white font-bold">{formatCurrency(singleData.gas)}</p>
              <p className="text-gray-500 text-xs">Gas/mo</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/20 mb-2">
                <Droplets className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-white font-bold">{formatCurrency(singleData.water)}</p>
              <p className="text-gray-500 text-xs">Water/mo</p>
            </div>
          </div>
          <div className="mt-3 p-3 rounded-xl bg-white/5 text-center">
            <span className="text-gray-400 text-sm">Annual Estimate: </span>
            <span className="text-white font-bold">{formatCurrency(singleData.total * 12)}</span>
          </div>
        </div>
      )}

      {/* Multi-property lowest cost callout */}
      {displayProperties.length > 1 && lowestCost && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Lowest Utilities</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{lowestCost.address}</span>
              <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400">
                {formatCurrency(lowestCost.total)}/mo
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
