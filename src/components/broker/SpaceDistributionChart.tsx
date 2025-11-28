/**
 * Space Distribution Chart
 *
 * Visual breakdown of property square footage:
 * Living Space, Garage/Storage, Covered Areas, Lot Size
 * Uses stacked bars for comparison view
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
import { LayoutGrid, Home, Car, Trees } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Property {
  id: string | number;
  address: string;
  sqft: number;
  livingSpace?: number;
  garageStorage?: number;
  coveredAreas?: number;
  lotSize?: number;
  roomDistribution?: {
    bedrooms: number;
    bathrooms: number;
    livingAreas: number;
    storage: number;
  };
  [key: string]: any;
}

interface SpaceDistributionChartProps {
  properties: Property[];
  selectedId?: string | number | 'all';
}

function formatSqft(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return `${value}`;
}

function shortAddress(address: string): string {
  return address.split(',')[0] || address;
}

const SPACE_COLORS = {
  living: '#00D9FF',
  garage: '#F59E0B',
  covered: '#8B5CF6',
  outdoor: '#10B981',
};

function getSpaceData(p: Property) {
  return {
    living: p.livingSpace || Math.round(p.sqft * 0.85),
    garage: p.garageStorage || Math.round(p.sqft * 0.1),
    covered: p.coveredAreas || Math.round(p.sqft * 0.05),
    lot: p.lotSize || 0,
  };
}

export default function SpaceDistributionChart({ properties, selectedId = 'all' }: SpaceDistributionChartProps) {
  const displayProperties = selectedId === 'all'
    ? properties
    : properties.filter(p => p.id === selectedId);

  if (displayProperties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No space data available</p>
      </div>
    );
  }

  // Stacked bar chart for space breakdown
  const data = {
    labels: displayProperties.map(p => shortAddress(p.address)),
    datasets: [
      {
        label: 'Living Space',
        data: displayProperties.map(p => getSpaceData(p).living),
        backgroundColor: SPACE_COLORS.living,
        borderRadius: 4,
      },
      {
        label: 'Garage/Storage',
        data: displayProperties.map(p => getSpaceData(p).garage),
        backgroundColor: SPACE_COLORS.garage,
        borderRadius: 4,
      },
      {
        label: 'Covered Areas',
        data: displayProperties.map(p => getSpaceData(p).covered),
        backgroundColor: SPACE_COLORS.covered,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    scales: {
      x: {
        stacked: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#9CA3AF',
          callback: (value: number | string) => `${formatSqft(Number(value))} sqft`,
        },
      },
      y: {
        stacked: true,
        grid: { display: false },
        ticks: { color: '#9CA3AF' },
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: { color: '#9CA3AF', usePointStyle: true },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.raw.toLocaleString()} sqft`,
        },
      },
    },
  };

  // Room distribution for single property
  const singleProperty = displayProperties.length === 1 ? displayProperties[0] : null;
  const roomDist = singleProperty?.roomDistribution;

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
        <LayoutGrid className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-semibold">Space Distribution</h3>
      </div>

      <div className="h-48">
        <Bar data={data} options={options} />
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {displayProperties.map((p, i) => {
          const space = getSpaceData(p);
          const total = space.living + space.garage + space.covered;
          return (
            <div key={p.id} className="p-3 rounded-xl bg-white/5">
              <p className="text-gray-400 text-xs truncate mb-1">{shortAddress(p.address)}</p>
              <p className="text-white font-bold text-lg">{total.toLocaleString()}</p>
              <p className="text-gray-500 text-xs">total sqft</p>
              {space.lot > 0 && (
                <div className="flex items-center gap-1 mt-2 text-green-400 text-xs">
                  <Trees className="w-3 h-3" />
                  <span>{formatSqft(space.lot)} lot</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Room distribution for single property */}
      {roomDist && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-gray-400 text-sm mb-3">Room Distribution</p>
          <div className="flex gap-2">
            <RoomBar label="Bedrooms" value={roomDist.bedrooms} color="#00D9FF" />
            <RoomBar label="Bathrooms" value={roomDist.bathrooms} color="#10B981" />
            <RoomBar label="Living" value={roomDist.livingAreas} color="#8B5CF6" />
            <RoomBar label="Storage" value={roomDist.storage} color="#F59E0B" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

function RoomBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-500 text-xs">{label}</span>
        <span className="text-white text-xs font-semibold">{value}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
