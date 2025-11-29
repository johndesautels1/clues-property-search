/**
 * Environmental Quality Chart
 *
 * Radar chart showing air quality and noise scores
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
import { Wind, Volume2 } from 'lucide-react';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Property {
  id: string | number;
  address: string;
  environmental?: {
    airQualityIndex?: number | null;
    noiseScore?: number | null;
    soundScore?: number | null;
  };
  [key: string]: any;
}

interface EnvironmentalQualityChartProps {
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

function getAirQualityLabel(aqi: number | null | undefined): string {
  if (aqi == null) return 'N/A';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy (Sensitive)';
  if (aqi <= 200) return 'Unhealthy';
  return 'Very Unhealthy';
}

function getAirQualityColor(aqi: number | null | undefined): string {
  if (aqi == null) return '#6B7280';
  if (aqi <= 50) return '#10B981'; // Good - green
  if (aqi <= 100) return '#F59E0B'; // Moderate - yellow
  if (aqi <= 150) return '#F97316'; // Unhealthy for sensitive - orange
  return '#EF4444'; // Unhealthy - red
}

function getNoiseLabel(score: number | null | undefined): string {
  if (score == null) return 'N/A';
  if (score >= 80) return 'Very Quiet';
  if (score >= 60) return 'Quiet';
  if (score >= 40) return 'Moderate';
  return 'Noisy';
}

function getNoiseColor(score: number | null | undefined): string {
  if (score == null) return '#6B7280';
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#00D9FF';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

// Convert AQI to a 0-100 "quality" score (inverted - lower AQI = higher quality)
function aqiToQualityScore(aqi: number | null | undefined): number {
  if (aqi == null) return 50;
  // AQI 0-50 = Quality 100-80 (Good)
  // AQI 50-100 = Quality 80-60 (Moderate)
  // AQI 100-150 = Quality 60-40 (Unhealthy for sensitive)
  // AQI 150-200 = Quality 40-20 (Unhealthy)
  // AQI 200+ = Quality 20-0 (Very Unhealthy)
  if (aqi <= 50) return 100 - (aqi * 0.4);
  if (aqi <= 100) return 80 - ((aqi - 50) * 0.4);
  if (aqi <= 150) return 60 - ((aqi - 100) * 0.4);
  if (aqi <= 200) return 40 - ((aqi - 150) * 0.4);
  return Math.max(0, 20 - ((aqi - 200) * 0.2));
}

export default function EnvironmentalQualityChart({ properties, selectedId = 'all' }: EnvironmentalQualityChartProps) {
  const displayProperties = selectedId === 'all'
    ? properties
    : properties.filter(p => p.id === selectedId);

  if (displayProperties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No environmental data available</p>
      </div>
    );
  }

  const labels = ['Air Quality', 'Noise/Sound'];

  const datasets = displayProperties.map((p, i) => {
    const airScore = aqiToQualityScore(p.environmental?.airQualityIndex);
    const noiseScore = p.environmental?.soundScore ?? p.environmental?.noiseScore ?? 50;
    const color = COLORS[i % COLORS.length];

    return {
      label: shortAddress(p.address),
      data: [airScore, noiseScore],
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
          label: (ctx: any) => {
            const prop = displayProperties[ctx.datasetIndex];
            if (ctx.dataIndex === 0) {
              const aqi = prop.environmental?.airQualityIndex;
              return `${ctx.dataset.label}: AQI ${aqi ?? 'N/A'} (${getAirQualityLabel(aqi)})`;
            } else {
              const noise = prop.environmental?.soundScore ?? prop.environmental?.noiseScore;
              return `${ctx.dataset.label}: ${noise ?? 'N/A'}/100 (${getNoiseLabel(noise)})`;
            }
          },
        },
      },
    },
  };

  // Single property detail view
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
        <Wind className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-semibold">Environmental Quality</h3>
      </div>

      <div className="h-48">
        <Radar data={data} options={options} />
      </div>

      {/* Single property breakdown */}
      {singleProp && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Wind className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-400 text-xs">Air Quality Index</span>
              </div>
              <p
                className="text-2xl font-bold"
                style={{ color: getAirQualityColor(singleProp.environmental?.airQualityIndex) }}
              >
                {singleProp.environmental?.airQualityIndex ?? 'N/A'}
              </p>
              <p className="text-gray-500 text-xs">
                {getAirQualityLabel(singleProp.environmental?.airQualityIndex)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <span className="text-gray-400 text-xs">Sound Score</span>
              </div>
              <p
                className="text-2xl font-bold"
                style={{ color: getNoiseColor(singleProp.environmental?.soundScore ?? singleProp.environmental?.noiseScore) }}
              >
                {singleProp.environmental?.soundScore ?? singleProp.environmental?.noiseScore ?? 'N/A'}
              </p>
              <p className="text-gray-500 text-xs">
                {getNoiseLabel(singleProp.environmental?.soundScore ?? singleProp.environmental?.noiseScore)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Multi-property comparison */}
      {displayProperties.length > 1 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {displayProperties.map((p, i) => {
              const airScore = aqiToQualityScore(p.environmental?.airQualityIndex);
              const noiseScore = p.environmental?.soundScore ?? p.environmental?.noiseScore ?? 50;
              const avgScore = Math.round((airScore + noiseScore) / 2);
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
                  <span className="text-white font-bold">{avgScore}/100</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
