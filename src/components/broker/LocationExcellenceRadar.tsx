/**
 * Location Excellence Radar
 *
 * 6-axis radar showing location quality metrics:
 * Beach Access, School Proximity, Transit Access, Safety, Walkability, Commute
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
import { MapPin, Star } from 'lucide-react';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface LocationExcellence {
  beachAccess: number;
  schoolProximity: number;
  transitAccess: number;
  safety: number;
  walkability: number;
  commute: number;
}

interface Property {
  id: string | number;
  address: string;
  locationExcellence?: LocationExcellence;
  walkScore?: number;
  transitScore?: number;
  safetyScore?: number;
  [key: string]: any;
}

interface LocationExcellenceRadarProps {
  properties: Property[];
  selectedId?: string | number | 'all';
}

function shortAddress(address: string): string {
  return address.split(',')[0] || address;
}

const COLORS = [
  { bg: 'rgba(16, 185, 129, 0.2)', border: '#10B981' },
  { bg: 'rgba(0, 217, 255, 0.2)', border: '#00D9FF' },
  { bg: 'rgba(139, 92, 246, 0.2)', border: '#8B5CF6' },
  { bg: 'rgba(245, 158, 11, 0.2)', border: '#F59E0B' },
  { bg: 'rgba(239, 68, 68, 0.2)', border: '#EF4444' },
];

function getLocationExcellence(p: Property): LocationExcellence {
  if (p.locationExcellence) return p.locationExcellence;

  // Generate defaults from available data
  return {
    beachAccess: p.features?.beachAccess || 50,
    schoolProximity: p.schools?.districtRating ? p.schools.districtRating * 10 : 70,
    transitAccess: p.transitScore || 50,
    safety: p.safetyScore || 75,
    walkability: p.walkScore || 60,
    commute: p.commute?.cityCenter ? Math.max(0, 100 - p.commute.cityCenter * 2) : 60,
  };
}

export default function LocationExcellenceRadar({ properties, selectedId = 'all' }: LocationExcellenceRadarProps) {
  const displayProperties = selectedId === 'all'
    ? properties
    : properties.filter(p => p.id === selectedId);

  if (displayProperties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No location data available</p>
      </div>
    );
  }

  const labels = [
    'Beach Access',
    'School Proximity',
    'Transit Access',
    'Safety',
    'Walkability',
    'Commute',
  ];

  const datasets = displayProperties.map((p, i) => {
    const loc = getLocationExcellence(p);
    const color = COLORS[i % COLORS.length];

    return {
      label: shortAddress(p.address),
      data: [
        loc.beachAccess,
        loc.schoolProximity,
        loc.transitAccess,
        loc.safety,
        loc.walkability,
        loc.commute,
      ],
      backgroundColor: color.bg,
      borderColor: color.border,
      borderWidth: 2,
      pointBackgroundColor: color.border,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: color.border,
    };
  });

  const data = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        pointLabels: { color: '#9CA3AF', font: { size: 11 } },
        ticks: {
          color: '#6B7280',
          backdropColor: 'transparent',
          stepSize: 20,
        },
        suggestedMin: 0,
        suggestedMax: 100,
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

  // Calculate location scores
  const locationScores = displayProperties.map(p => {
    const loc = getLocationExcellence(p);
    return {
      address: shortAddress(p.address),
      overall: Math.round(
        (loc.beachAccess + loc.schoolProximity + loc.transitAccess +
         loc.safety + loc.walkability + loc.commute) / 6
      ),
      best: Object.entries(loc).reduce((best, [key, val]) =>
        val > best.val ? { key, val } : best, { key: '', val: 0 }
      ),
    };
  });

  const categoryLabels: Record<string, string> = {
    beachAccess: 'Beach',
    schoolProximity: 'Schools',
    transitAccess: 'Transit',
    safety: 'Safety',
    walkability: 'Walkability',
    commute: 'Commute',
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
        <MapPin className="w-5 h-5 text-green-400" />
        <h3 className="text-white font-semibold">Location Excellence</h3>
      </div>

      <div className="h-80">
        <Radar data={data} options={options} />
      </div>

      {/* Location summary */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {locationScores.map((item, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-white/5"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length].border }}
              />
              <span className="text-gray-400 text-sm truncate">{item.address}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-bold">{item.overall}</span>
                <span className="text-gray-500 text-xs">/100</span>
              </div>
              <span className="text-xs text-gray-500">
                Best: <span className="text-green-400">{categoryLabels[item.best.key]}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
