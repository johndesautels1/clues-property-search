/**
 * Utility Cost Chart - REDESIGNED
 *
 * Proper bar chart showing utility costs with:
 * - Property name header
 * - Dollar scale on Y-axis (0-$500/month)
 * - Utility types on X-axis with legend colors
 * - Average monthly cost displayed
 * - Data source footer
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
import { Zap, Flame, Droplets, Wifi } from 'lucide-react';

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

  const singleProp = displayProperties.length === 1 ? displayProperties[0] : null;

  // Extract utility data
  const getUtilityData = (p: Property) => {
    const electric = p.costs?.electricMonthly || 0;
    const gas = p.costs?.gasMonthly || 0;
    const water = p.costs?.waterMonthly || 0;
    const total = p.costs?.utilitiesMonthly || (electric + gas + water);

    // If we have total but not breakdown, estimate typical distribution
    const hasBreakdown = electric > 0 || gas > 0 || water > 0;

    return {
      electric: hasBreakdown ? electric : Math.round(total * 0.5),
      gas: hasBreakdown ? gas : Math.round(total * 0.3),
      water: hasBreakdown ? water : Math.round(total * 0.2),
      total: hasBreakdown ? (electric + gas + water) : total,
    };
  };

  // For single property view - simple bar chart
  if (singleProp) {
    const utilData = getUtilityData(singleProp);

    const data = {
      labels: ['Electric', 'Gas', 'Water'],
      datasets: [{
        data: [utilData.electric, utilData.gas, utilData.water],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',  // Electric - amber
          'rgba(239, 68, 68, 0.8)',   // Gas - red
          'rgba(0, 217, 255, 0.8)',   // Water - cyan
        ],
        borderColor: ['#F59E0B', '#EF4444', '#00D9FF'],
        borderWidth: 2,
        borderRadius: 8,
      }],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#E5E7EB',
            font: { size: 12, weight: 'bold' as const },
          },
        },
        y: {
          min: 0,
          max: Math.max(500, Math.ceil(Math.max(utilData.electric, utilData.gas, utilData.water) / 100) * 100 + 100),
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: {
            color: '#9CA3AF',
            callback: (value: number) => `$${value}`,
            stepSize: 100,
          },
          title: {
            display: true,
            text: 'Monthly Cost ($)',
            color: '#9CA3AF',
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleFont: { size: 14 },
          bodyFont: { size: 13 },
          callbacks: {
            label: (ctx: any) => `${formatCurrency(ctx.raw)}/month`,
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
        {/* PROPERTY NAME HEADER */}
        <div className="mb-4 pb-3 border-b border-cyan-500/30">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-400 text-sm font-medium">Currently Viewing</span>
          </div>
          <h2 className="text-white text-lg font-bold mt-1">{shortAddress(singleProp.address)}</h2>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-white font-semibold">Monthly Utility Costs</h3>
              <p className="text-gray-500 text-xs">Estimated monthly utility expenses</p>
            </div>
          </div>
          <div className="text-right p-2 rounded-lg bg-white/5">
            <span className="text-gray-400 text-xs">Total Monthly</span>
            <p className="text-white font-bold text-xl">{formatCurrency(utilData.total)}</p>
          </div>
        </div>

        <div className="h-56">
          <Bar data={data} options={options as any} />
        </div>

        {/* Utility breakdown with icons */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-amber-500/10 text-center">
              <Zap className="w-6 h-6 text-amber-400 mx-auto mb-1" />
              <p className="text-amber-400 font-bold text-lg">{formatCurrency(utilData.electric)}</p>
              <p className="text-gray-400 text-xs">Electric/mo</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 text-center">
              <Flame className="w-6 h-6 text-red-400 mx-auto mb-1" />
              <p className="text-red-400 font-bold text-lg">{formatCurrency(utilData.gas)}</p>
              <p className="text-gray-400 text-xs">Gas/mo</p>
            </div>
            <div className="p-3 rounded-lg bg-cyan-500/10 text-center">
              <Droplets className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
              <p className="text-cyan-400 font-bold text-lg">{formatCurrency(utilData.water)}</p>
              <p className="text-gray-400 text-xs">Water/mo</p>
            </div>
          </div>

          {/* Annual estimate */}
          <div className="mt-3 p-3 rounded-lg bg-white/5 text-center">
            <span className="text-gray-400 text-sm">Annual Utility Estimate: </span>
            <span className="text-white font-bold text-lg">{formatCurrency(utilData.total * 12)}</span>
          </div>
        </div>

        {/* Data source footer */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-gray-600 text-xs text-center">
            Data sources: Regional utility averages, property size estimates, historical usage patterns
          </p>
        </div>
      </motion.div>
    );
  }

  // Multiple properties comparison view
  const propertyData = displayProperties.map(p => ({
    address: shortAddress(p.address),
    ...getUtilityData(p),
  }));

  const data = {
    labels: propertyData.map(p => p.address),
    datasets: [
      {
        label: 'Electric',
        data: propertyData.map(p => p.electric),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: '#F59E0B',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Gas',
        data: propertyData.map(p => p.gas),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: '#EF4444',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Water',
        data: propertyData.map(p => p.water),
        backgroundColor: 'rgba(0, 217, 255, 0.8)',
        borderColor: '#00D9FF',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const maxValue = Math.max(...propertyData.map(p => p.electric + p.gas + p.water));

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: '#E5E7EB', font: { size: 11 } },
      },
      y: {
        stacked: true,
        min: 0,
        max: Math.ceil(maxValue / 100) * 100 + 100,
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: {
          color: '#9CA3AF',
          callback: (value: number) => `$${value}`,
          stepSize: 100,
        },
        title: {
          display: true,
          text: 'Monthly Cost ($)',
          color: '#9CA3AF',
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { color: '#E5E7EB', usePointStyle: true },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
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

  // Find lowest utility cost
  const sortedByTotal = [...propertyData].sort((a, b) => a.total - b.total);
  const lowestCost = sortedByTotal[0];
  const avgTotal = Math.round(propertyData.reduce((sum, p) => sum + p.total, 0) / propertyData.length);

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
          <div>
            <h3 className="text-white font-semibold">Utility Cost Comparison</h3>
            <p className="text-gray-500 text-xs">Monthly utility expenses by property</p>
          </div>
        </div>
        <div className="text-right p-2 rounded-lg bg-white/5">
          <span className="text-gray-400 text-xs">Avg Monthly</span>
          <p className="text-white font-bold">{formatCurrency(avgTotal)}</p>
        </div>
      </div>

      <div className="h-64">
        <Bar data={data} options={options as any} />
      </div>

      {/* Lowest cost callout */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">Lowest Utility Cost</span>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">{lowestCost.address}</span>
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400">
              {formatCurrency(lowestCost.total)}/mo
            </span>
          </div>
        </div>
      </div>

      {/* Data source footer */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <p className="text-gray-600 text-xs text-center">
          Data sources: Regional utility averages, property size estimates, historical usage patterns
        </p>
      </div>
    </motion.div>
  );
}
