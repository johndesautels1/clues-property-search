/**
 * Safety Barometer Chart
 *
 * Bar chart showing safety/crime scores for properties
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
import { Shield, AlertTriangle } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Property {
  id: string | number;
  address: string;
  risk?: {
    safetyScore?: number | null;
    crimeViolent?: string | null;
    crimeProperty?: string | null;
  };
  locationScore?: {
    safetyScore?: number | null;
  };
  [key: string]: any;
}

interface SafetyBarometerChartProps {
  properties: Property[];
  selectedId?: string | number | 'all';
}

function shortAddress(address: string): string {
  return address.split(',')[0] || address;
}

const COLORS = ['#00D9FF', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

function getSafetyScore(p: Property): number {
  return p.risk?.safetyScore ?? p.locationScore?.safetyScore ?? 50;
}

function getSafetyColor(score: number): string {
  if (score >= 80) return '#10B981'; // Safe
  if (score >= 60) return '#00D9FF'; // Moderate
  if (score >= 40) return '#F59E0B'; // Caution
  return '#EF4444'; // High Risk
}

function getSafetyLabel(score: number): string {
  if (score >= 80) return 'Very Safe';
  if (score >= 60) return 'Moderately Safe';
  if (score >= 40) return 'Use Caution';
  return 'High Risk';
}

function parseCrimeRating(rating: string | null | undefined): number {
  if (!rating) return 50;
  const ratingUpper = rating.toUpperCase();
  if (ratingUpper.includes('A') || ratingUpper.includes('LOW')) return 90;
  if (ratingUpper.includes('B') || ratingUpper.includes('MODERATE')) return 70;
  if (ratingUpper.includes('C') || ratingUpper.includes('AVERAGE')) return 50;
  if (ratingUpper.includes('D') || ratingUpper.includes('HIGH')) return 30;
  if (ratingUpper.includes('F') || ratingUpper.includes('VERY HIGH')) return 10;
  return 50;
}

export default function SafetyBarometerChart({ properties, selectedId = 'all' }: SafetyBarometerChartProps) {
  const displayProperties = selectedId === 'all'
    ? properties
    : properties.filter(p => p.id === selectedId);

  if (displayProperties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No safety data available</p>
      </div>
    );
  }

  const labels = displayProperties.map(p => shortAddress(p.address));
  const safetyScores = displayProperties.map(p => getSafetyScore(p));

  const data = {
    labels,
    datasets: [{
      label: 'Safety Score',
      data: safetyScores,
      backgroundColor: safetyScores.map(s => getSafetyColor(s) + '80'),
      borderColor: safetyScores.map(s => getSafetyColor(s)),
      borderWidth: 2,
      borderRadius: 8,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#9CA3AF' },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#E5E7EB', font: { size: 11 } },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: (ctx: any) => `Safety Score: ${ctx.raw}/100`,
        },
      },
    },
  };

  // Find safest property
  const sortedBySafety = [...displayProperties].sort((a, b) => getSafetyScore(b) - getSafetyScore(a));
  const safest = sortedBySafety[0];
  const avgSafety = Math.round(safetyScores.reduce((a, b) => a + b, 0) / safetyScores.length);

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
          <h3 className="text-white font-semibold">Safety Barometer</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">Avg</span>
          <span
            className="px-2 py-1 rounded-full text-xs font-bold"
            style={{
              backgroundColor: getSafetyColor(avgSafety) + '20',
              color: getSafetyColor(avgSafety),
            }}
          >
            {avgSafety}/100
          </span>
        </div>
      </div>

      <div className="h-48">
        <Bar data={data} options={options} />
      </div>

      {/* Crime breakdown for single property */}
      {displayProperties.length === 1 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-gray-400 text-xs">Violent Crime</span>
              </div>
              <p className="text-white font-semibold">
                {displayProperties[0].risk?.crimeViolent || 'N/A'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-gray-400 text-xs">Property Crime</span>
              </div>
              <p className="text-white font-semibold">
                {displayProperties[0].risk?.crimeProperty || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Multi-property comparison */}
      {displayProperties.length > 1 && safest && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Safest Location</span>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-white font-semibold">{shortAddress(safest.address)}</span>
              <span className="text-green-400 text-sm">{getSafetyLabel(getSafetyScore(safest))}</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
