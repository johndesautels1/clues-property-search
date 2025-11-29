/**
 * Mobility Scores Chart (Mobility Trifecta)
 *
 * Radar chart showing Walk Score, Transit Score, Bike Score
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
import { Footprints, Train, Bike } from 'lucide-react';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Property {
  id: string | number;
  address: string;
  lifestyle?: {
    walkScore?: number | null;
    transitScore?: number | null;
    bikeScore?: number | null;
  };
  [key: string]: any;
}

interface MobilityScoresChartProps {
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

function getScoreColor(score: number | null | undefined): string {
  if (score == null) return '#6B7280';
  if (score >= 90) return '#10B981'; // Walker's Paradise
  if (score >= 70) return '#00D9FF'; // Very Walkable
  if (score >= 50) return '#F59E0B'; // Somewhat Walkable
  return '#EF4444'; // Car-Dependent
}

function getScoreLabel(score: number | null | undefined): string {
  if (score == null) return 'N/A';
  if (score >= 90) return 'Paradise';
  if (score >= 70) return 'Very Good';
  if (score >= 50) return 'Moderate';
  return 'Limited';
}

export default function MobilityScoresChart({ properties, selectedId = 'all' }: MobilityScoresChartProps) {
  const displayProperties = selectedId === 'all'
    ? properties
    : properties.filter(p => p.id === selectedId);

  if (displayProperties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No mobility data available</p>
      </div>
    );
  }

  const labels = ['Walk Score', 'Transit Score', 'Bike Score'];

  const datasets = displayProperties.map((p, i) => {
    const walkScore = p.lifestyle?.walkScore ?? 0;
    const transitScore = p.lifestyle?.transitScore ?? 0;
    const bikeScore = p.lifestyle?.bikeScore ?? 0;
    const color = COLORS[i % COLORS.length];

    return {
      label: shortAddress(p.address),
      data: [walkScore, transitScore, bikeScore],
      backgroundColor: color.bg,
      borderColor: color.border,
      borderWidth: 2,
      pointBackgroundColor: color.border,
      pointBorderColor: '#fff',
      pointRadius: 6,
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
          font: { size: 12, weight: 500 as const },
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
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.raw}/100`,
        },
      },
    },
  };

  // Score breakdown for single property view
  const singleProp = displayProperties.length === 1 ? displayProperties[0] : null;

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
        <Footprints className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-semibold">Mobility Trifecta</h3>
      </div>

      <div className="h-64">
        <Radar data={data} options={options} />
      </div>

      {/* Score Breakdown Icons */}
      {singleProp && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/20 mb-2">
                <Footprints className="w-6 h-6 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold" style={{ color: getScoreColor(singleProp.lifestyle?.walkScore) }}>
                {singleProp.lifestyle?.walkScore ?? 'N/A'}
              </p>
              <p className="text-gray-500 text-xs">Walk Score</p>
              <p className="text-gray-400 text-xs">{getScoreLabel(singleProp.lifestyle?.walkScore)}</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 mb-2">
                <Train className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-2xl font-bold" style={{ color: getScoreColor(singleProp.lifestyle?.transitScore) }}>
                {singleProp.lifestyle?.transitScore ?? 'N/A'}
              </p>
              <p className="text-gray-500 text-xs">Transit Score</p>
              <p className="text-gray-400 text-xs">{getScoreLabel(singleProp.lifestyle?.transitScore)}</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-2">
                <Bike className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-2xl font-bold" style={{ color: getScoreColor(singleProp.lifestyle?.bikeScore) }}>
                {singleProp.lifestyle?.bikeScore ?? 'N/A'}
              </p>
              <p className="text-gray-500 text-xs">Bike Score</p>
              <p className="text-gray-400 text-xs">{getScoreLabel(singleProp.lifestyle?.bikeScore)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Multi-property comparison */}
      {displayProperties.length > 1 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {displayProperties.map((p, i) => {
              const avg = Math.round(
                ((p.lifestyle?.walkScore ?? 0) + (p.lifestyle?.transitScore ?? 0) + (p.lifestyle?.bikeScore ?? 0)) / 3
              );
              return (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length].border }}
                    />
                    <span className="text-gray-400 text-sm truncate">{shortAddress(p.address)}</span>
                  </div>
                  <span className="text-white font-bold">{avg}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
