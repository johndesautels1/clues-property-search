/**
 * Valuation Compass Chart
 *
 * Radar chart showing price comparisons:
 * List Price, Market Estimate, Online AVM, Assessed Value
 */

import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { Compass } from 'lucide-react';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Property {
  id: string | number;
  address: string;
  listPrice?: number | null;
  marketEstimate?: number | null;
  redfinEstimate?: number | null;
  assessedValue?: number | null;
  [key: string]: any;
}

interface ValuationCompassChartProps {
  properties: Property[];
  selectedId?: string | number | 'all';
}

function shortAddress(address: string): string {
  return address.split(',')[0] || address;
}

const COLORS = [
  { bg: 'rgba(0, 217, 255, 0.2)', border: '#00D9FF' },
  { bg: 'rgba(16, 185, 129, 0.2)', border: '#10B981' },
  { bg: 'rgba(139, 92, 246, 0.2)', border: '#8B5CF6' },
  { bg: 'rgba(245, 158, 11, 0.2)', border: '#F59E0B' },
  { bg: 'rgba(239, 68, 68, 0.2)', border: '#EF4444' },
];

function normalizeValues(values: (number | null | undefined)[]): number[] {
  const validValues = values.filter((v): v is number => v != null && v > 0);
  if (validValues.length === 0) return values.map(() => 0);
  const max = Math.max(...validValues);
  return values.map(v => (v != null && v > 0) ? (v / max) * 100 : 0);
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

export default function ValuationCompassChart({ properties, selectedId = 'all' }: ValuationCompassChartProps) {
  const displayProperties = selectedId === 'all'
    ? properties
    : properties.filter(p => p.id === selectedId);

  if (displayProperties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No valuation data available</p>
      </div>
    );
  }

  const labels = ['List Price', 'Market Est.', 'Online AVM', 'Assessed'];
  const singleProp = displayProperties.length === 1 ? displayProperties[0] : null;

  const datasets = displayProperties.map((p, i) => {
    const rawValues = [p.listPrice, p.marketEstimate, p.redfinEstimate, p.assessedValue];
    const normalized = normalizeValues(rawValues);
    const color = COLORS[i % COLORS.length];

    return {
      label: shortAddress(p.address),
      data: normalized,
      backgroundColor: color.bg,
      borderColor: color.border,
      borderWidth: 2,
      pointBackgroundColor: color.border,
      pointBorderColor: '#fff',
      pointRadius: 5,
      pointBorderWidth: 2,
    };
  });

  const data = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          color: '#9CA3AF',
          backdropColor: 'transparent',
          font: { size: 10 },
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        pointLabels: {
          color: '#E5E7EB',
          font: { size: 11, weight: 500 as const },
        },
      },
    },
    plugins: {
      legend: {
        display: displayProperties.length > 1,
        labels: { color: '#9CA3AF', usePointStyle: true },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: (ctx: any) => {
            const prop = displayProperties[ctx.datasetIndex];
            const rawValues = [prop.listPrice, prop.marketEstimate, prop.redfinEstimate, prop.assessedValue];
            const rawValue = rawValues[ctx.dataIndex];
            if (rawValue == null) return `${ctx.dataset.label}: N/A`;
            return `${ctx.dataset.label}: $${rawValue.toLocaleString()}`;
          },
        },
      },
    },
  };

  // Summary stats
  const summaryData = displayProperties.map(p => ({
    address: shortAddress(p.address),
    list: p.listPrice,
    market: p.marketEstimate,
    variance: p.listPrice && p.marketEstimate
      ? ((p.listPrice - p.marketEstimate) / p.marketEstimate * 100).toFixed(1)
      : null,
  }));

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
      {/* PROPERTY NAME HEADER for single property */}
      {singleProp && (
        <div className="mb-4 pb-3 border-b border-cyan-500/30">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-400 text-sm font-medium">Currently Viewing</span>
          </div>
          <h2 className="text-white text-lg font-bold mt-1">{shortAddress(singleProp.address)}</h2>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <Compass className="w-5 h-5 text-cyan-400" />
        <div>
          <h3 className="text-white font-semibold">Valuation Compass</h3>
          <p className="text-gray-500 text-xs">Normalized comparison (highest value = 100%)</p>
        </div>
      </div>

      <div className="h-48">
        <Radar data={data} options={options} />
      </div>

      {/* ACTUAL VALUES TABLE - Shows real dollar amounts */}
      {singleProp && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-cyan-300 text-xs font-medium mb-3">ACTUAL VALUES</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-cyan-500/10">
              <p className="text-cyan-300 text-xs">List Price</p>
              <p className="text-white font-bold text-lg">{formatCurrency(singleProp.listPrice)}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10">
              <p className="text-green-300 text-xs">Market Estimate</p>
              <p className="text-white font-bold text-lg">{formatCurrency(singleProp.marketEstimate)}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10">
              <p className="text-purple-300 text-xs">Online AVM</p>
              <p className="text-white font-bold text-lg">{formatCurrency(singleProp.redfinEstimate)}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10">
              <p className="text-amber-300 text-xs">Assessed Value</p>
              <p className="text-white font-bold text-lg">{formatCurrency(singleProp.assessedValue)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Multi-property Variance Summary */}
      {displayProperties.length > 1 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {summaryData.map((item, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length].border }}
                  />
                  <span className="text-gray-400 text-sm truncate">{item.address}</span>
                </div>
                <div className="text-right">
                  {item.variance ? (
                    <span className={`font-bold ${parseFloat(item.variance) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {parseFloat(item.variance) > 0 ? '+' : ''}{item.variance}%
                    </span>
                  ) : (
                    <span className="text-gray-500 text-sm">N/A</span>
                  )}
                  <span className="text-gray-500 text-xs ml-1">vs market</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
