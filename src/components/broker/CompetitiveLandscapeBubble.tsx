/**
 * Competitive Landscape Bubble Chart
 *
 * Bubble chart showing price vs sqft with lot size as bubble radius
 */

import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bubble } from 'react-chartjs-2';
import { Target } from 'lucide-react';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

interface Property {
  id: string | number;
  address: string;
  listPrice?: number | null;
  sqft?: number | null;
  lotSize?: number | null;
  [key: string]: any;
}

interface CompetitiveLandscapeBubbleProps {
  properties: Property[];
  selectedId?: string | number | 'all';
}

function shortAddress(address: string): string {
  return address.split(',')[0] || address;
}

const COLORS = [
  { bg: 'rgba(0, 217, 255, 0.4)', border: '#00D9FF' },
  { bg: 'rgba(16, 185, 129, 0.4)', border: '#10B981' },
  { bg: 'rgba(139, 92, 246, 0.4)', border: '#8B5CF6' },
  { bg: 'rgba(245, 158, 11, 0.4)', border: '#F59E0B' },
  { bg: 'rgba(239, 68, 68, 0.4)', border: '#EF4444' },
];

function formatPrice(price: number): string {
  if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
  if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
  return `$${price}`;
}

function getPricePerSqft(price: number | null | undefined, sqft: number | null | undefined): number | null {
  if (!price || !sqft || sqft === 0) return null;
  return Math.round(price / sqft);
}

export default function CompetitiveLandscapeBubble({ properties, selectedId = 'all' }: CompetitiveLandscapeBubbleProps) {
  const displayProperties = selectedId === 'all'
    ? properties
    : properties.filter(p => p.id === selectedId);

  // Filter to properties with valid price and sqft data
  const validProperties = displayProperties.filter(
    p => p.listPrice && p.listPrice > 0 && p.sqft && p.sqft > 0
  );

  if (validProperties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No competitive landscape data available</p>
      </div>
    );
  }

  // Calculate bubble radius based on lot size (normalize to reasonable range)
  const lotSizes = validProperties.map(p => p.lotSize || 5000);
  const maxLot = Math.max(...lotSizes);
  const minLot = Math.min(...lotSizes);

  const datasets = validProperties.map((p, i) => {
    const lotSize = p.lotSize || 5000;
    // Normalize bubble radius between 8 and 25
    const normalizedRadius = minLot === maxLot
      ? 15
      : 8 + ((lotSize - minLot) / (maxLot - minLot)) * 17;
    const color = COLORS[i % COLORS.length];

    return {
      label: shortAddress(p.address),
      data: [{
        x: p.sqft!,
        y: p.listPrice!,
        r: normalizedRadius,
      }],
      backgroundColor: color.bg,
      borderColor: color.border,
      borderWidth: 2,
    };
  });

  const data = { datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Square Feet',
          color: '#9CA3AF',
        },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#9CA3AF' },
      },
      y: {
        title: {
          display: true,
          text: 'Price',
          color: '#9CA3AF',
        },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#9CA3AF',
          callback: (value: number) => formatPrice(value),
        },
      },
    },
    plugins: {
      legend: {
        display: validProperties.length > 1,
        labels: { color: '#9CA3AF', usePointStyle: true },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: (ctx: any) => {
            const prop = validProperties[ctx.datasetIndex];
            const pricePerSqft = getPricePerSqft(prop.listPrice, prop.sqft);
            return [
              `${ctx.dataset.label}`,
              `Price: ${formatPrice(prop.listPrice!)}`,
              `Size: ${prop.sqft?.toLocaleString()} sqft`,
              `$/sqft: ${pricePerSqft ? `$${pricePerSqft}` : 'N/A'}`,
              `Lot: ${prop.lotSize ? prop.lotSize.toLocaleString() : 'N/A'} sqft`,
            ];
          },
        },
      },
    },
  };

  // Calculate stats
  const avgPricePerSqft = validProperties.reduce((sum, p) => {
    const pps = getPricePerSqft(p.listPrice, p.sqft);
    return sum + (pps || 0);
  }, 0) / validProperties.length;

  // Find best value (lowest $/sqft)
  const sortedByValue = [...validProperties].sort((a, b) => {
    const aVal = getPricePerSqft(a.listPrice, a.sqft) || Infinity;
    const bVal = getPricePerSqft(b.listPrice, b.sqft) || Infinity;
    return aVal - bVal;
  });
  const bestValue = sortedByValue[0];

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
          <Target className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-semibold">Competitive Landscape</h3>
        </div>
        <div className="text-right">
          <span className="text-gray-400 text-xs">Avg $/sqft</span>
          <span className="text-white font-bold ml-2">${Math.round(avgPricePerSqft)}</span>
        </div>
      </div>

      <div className="h-64">
        <Bubble data={data} options={options as any} />
      </div>

      {/* Legend explanation */}
      <div className="mt-3 text-center">
        <span className="text-gray-500 text-xs">Bubble size represents lot size</span>
      </div>

      {/* Best Value Callout */}
      {validProperties.length > 1 && bestValue && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Best Value ($/sqft)</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{shortAddress(bestValue.address)}</span>
              <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400">
                ${getPricePerSqft(bestValue.listPrice, bestValue.sqft)}/sqft
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Property comparison grid */}
      {validProperties.length > 1 && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
          {validProperties.map((p, i) => (
            <div
              key={p.id}
              className="p-2 rounded-lg bg-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length].border }}
                />
                <span className="text-gray-400 text-xs truncate">{shortAddress(p.address)}</span>
              </div>
              <span className="text-white text-xs font-bold">
                ${getPricePerSqft(p.listPrice, p.sqft)}/sf
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
