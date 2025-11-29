/**
 * Appreciation Velocity Chart
 *
 * Semi-circle gauge showing 5-year appreciation rate
 */

import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { TrendingUp } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Property {
  id: string | number;
  address: string;
  roi?: {
    appreciation5yr?: number | null;
  };
  [key: string]: any;
}

interface AppreciationVelocityChartProps {
  properties: Property[];
  selectedId?: string | number | 'all';
}

function shortAddress(address: string): string {
  return address.split(',')[0] || address;
}

const COLORS = ['#00D9FF', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

function getAppreciation(p: Property): number {
  return p.roi?.appreciation5yr ?? 0;
}

function getColorForRate(rate: number): string {
  if (rate >= 8) return '#10B981'; // Green - excellent
  if (rate >= 5) return '#00D9FF'; // Cyan - good
  if (rate >= 3) return '#F59E0B'; // Amber - moderate
  return '#EF4444'; // Red - low
}

export default function AppreciationVelocityChart({ properties, selectedId = 'all' }: AppreciationVelocityChartProps) {
  const displayProperties = selectedId === 'all'
    ? properties
    : properties.filter(p => p.id === selectedId);

  if (displayProperties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No appreciation data available</p>
      </div>
    );
  }

  // Create gauge data for each property
  const gaugeData = displayProperties.map((p, i) => {
    const rate = getAppreciation(p);
    const normalizedRate = Math.min(rate, 15); // Cap at 15% for visual
    const color = getColorForRate(rate);

    return {
      address: shortAddress(p.address),
      rate,
      data: {
        datasets: [{
          data: [normalizedRate, 15 - normalizedRate],
          backgroundColor: [color, 'rgba(255, 255, 255, 0.05)'],
          borderColor: [color, 'rgba(255, 255, 255, 0.1)'],
          borderWidth: 2,
          circumference: 180,
          rotation: 270,
        }],
      },
    };
  });

  const gaugeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  // Find best performer
  const sortedByRate = [...displayProperties].sort((a, b) => getAppreciation(b) - getAppreciation(a));
  const bestPerformer = sortedByRate[0];
  const avgRate = displayProperties.reduce((sum, p) => sum + getAppreciation(p), 0) / displayProperties.length;

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
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-semibold">Appreciation Velocity</h3>
        </div>
        <div className="text-right">
          <span className="text-gray-400 text-xs">Avg</span>
          <span className="text-white font-bold ml-2">{avgRate.toFixed(1)}%</span>
          <span className="text-gray-500 text-xs">/yr</span>
        </div>
      </div>

      {/* Gauge Grid */}
      <div className={`grid gap-4 ${displayProperties.length === 1 ? 'grid-cols-1' : displayProperties.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {gaugeData.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            <div className="h-32 relative">
              <Doughnut data={item.data} options={gaugeOptions} />
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
                <span
                  className="text-2xl font-bold"
                  style={{ color: getColorForRate(item.rate) }}
                >
                  {item.rate.toFixed(1)}%
                </span>
                <span className="text-gray-500 text-xs">per year</span>
              </div>
            </div>
            <p className="text-center text-gray-400 text-sm mt-2 truncate" title={item.address}>
              {item.address}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Best Performer Callout */}
      {displayProperties.length > 1 && bestPerformer && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Top Performer</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{shortAddress(bestPerformer.address)}</span>
              <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400">
                {getAppreciation(bestPerformer).toFixed(1)}%/yr
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
