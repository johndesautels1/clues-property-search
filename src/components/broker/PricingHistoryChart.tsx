/**
 * Pricing History Chart
 *
 * Waterfall/bar chart showing price evolution:
 * Sale Price → Assessment → Current List → Market Estimate
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
import { History, TrendingUp } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface PricingHistory {
  salePriceDate?: string;
  salePrice?: number;
  assessmentDate?: string;
  assessmentPrice?: number;
  currentListPrice?: number;
  marketEstimatePrice?: number;
}

interface Property {
  id: string | number;
  address: string;
  pricingHistory?: PricingHistory;
  listPrice: number;
  marketEstimate: number;
  assessedValue: number;
  [key: string]: any;
}

interface PricingHistoryChartProps {
  properties: Property[];
  selectedId?: string | number | 'all';
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
}

function shortAddress(address: string): string {
  return address.split(',')[0] || address;
}

const COLORS = ['#00D9FF', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function PricingHistoryChart({ properties, selectedId = 'all' }: PricingHistoryChartProps) {
  // Filter to selected property or all
  const displayProperties = selectedId === 'all'
    ? properties
    : properties.filter(p => p.id === selectedId);

  if (displayProperties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No pricing data available</p>
      </div>
    );
  }

  // For single property, show waterfall
  if (displayProperties.length === 1) {
    const p = displayProperties[0];
    const history = p.pricingHistory || {};

    const data = {
      labels: ['Sale Price', 'Assessment', 'List Price', 'Market Est.'],
      datasets: [{
        label: shortAddress(p.address),
        data: [
          history.salePrice || 0,
          history.assessmentPrice || p.assessedValue || 0,
          history.currentListPrice || p.listPrice || 0,
          history.marketEstimatePrice || p.marketEstimate || 0,
        ],
        backgroundColor: ['#6B7280', '#F59E0B', '#00D9FF', '#10B981'],
        borderRadius: 8,
      }],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          callbacks: {
            label: (ctx: any) => formatCurrency(ctx.raw),
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9CA3AF' },
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#9CA3AF',
            callback: (value: number | string) => formatCurrency(Number(value)),
          },
        },
      },
    };

    // Calculate appreciation
    const salePrice = history.salePrice || 0;
    const currentValue = history.marketEstimatePrice || p.marketEstimate || 0;
    const appreciation = salePrice > 0 ? ((currentValue - salePrice) / salePrice * 100) : 0;

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
            <History className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-semibold">Pricing History</h3>
          </div>
          {appreciation !== 0 && (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
              appreciation > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <TrendingUp className="w-4 h-4" />
              <span>{appreciation > 0 ? '+' : ''}{appreciation.toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="h-64">
          <Bar data={data} options={options} />
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-gray-500 text-xs">Sale ({history.salePriceDate?.split('-')[0] || 'N/A'})</p>
            <p className="text-white font-semibold">{formatCurrency(history.salePrice || 0)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Assessment</p>
            <p className="text-amber-400 font-semibold">{formatCurrency(history.assessmentPrice || p.assessedValue || 0)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">List Price</p>
            <p className="text-cyan-400 font-semibold">{formatCurrency(p.listPrice)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Market Est.</p>
            <p className="text-green-400 font-semibold">{formatCurrency(p.marketEstimate)}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // For multiple properties, show grouped bar chart
  const data = {
    labels: displayProperties.map(p => shortAddress(p.address)),
    datasets: [
      {
        label: 'Sale Price',
        data: displayProperties.map(p => p.pricingHistory?.salePrice || 0),
        backgroundColor: '#6B7280',
        borderRadius: 4,
      },
      {
        label: 'Assessment',
        data: displayProperties.map(p => p.pricingHistory?.assessmentPrice || p.assessedValue || 0),
        backgroundColor: '#F59E0B',
        borderRadius: 4,
      },
      {
        label: 'List Price',
        data: displayProperties.map(p => p.listPrice),
        backgroundColor: '#00D9FF',
        borderRadius: 4,
      },
      {
        label: 'Market Est.',
        data: displayProperties.map(p => p.marketEstimate),
        backgroundColor: '#10B981',
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: '#9CA3AF', usePointStyle: true },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#9CA3AF' },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#9CA3AF',
          callback: (value: number | string) => formatCurrency(Number(value)),
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
        <History className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-semibold">Pricing History Comparison</h3>
      </div>
      <div className="h-72">
        <Bar data={data} options={options} />
      </div>
    </motion.div>
  );
}
