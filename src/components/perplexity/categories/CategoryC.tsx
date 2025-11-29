/**
 * Category C: Property Basics (13 fields)
 * Charts:
 * 1. ROOM SUNBURST - Bed→Bath→Living→Storage rings
 * 2. SPACE EFFICIENCY SCATTER - Living/Total vs $/sqft
 * 3. LAYOUT BARS - Bed/Bath/Garage horizontal bars
 */

import { motion } from 'framer-motion';
import { Doughnut, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  PointElement,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';

ChartJS.register(ArcElement, PointElement, LinearScale, Tooltip, Legend);

interface CategoryCProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

// C-1: Room Sunburst (as nested donut)
function RoomSunburst({ properties }: CategoryCProps) {
  // Aggregate room data
  let totalBeds = 0, totalBaths = 0, totalGarage = 0;
  properties.forEach(p => {
    totalBeds += getVal(p.details?.bedrooms) || 0;
    totalBaths += getVal(p.details?.totalBathrooms) || 0;
    totalGarage += getVal(p.details?.garageSpaces) || 0;
  });

  const total = totalBeds + totalBaths + totalGarage || 1;

  const data = {
    labels: ['Bedrooms', 'Bathrooms', 'Garage'],
    datasets: [{
      data: [totalBeds, totalBaths, totalGarage],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(0, 217, 255, 0.8)',
        'rgba(139, 92, 246, 0.8)',
      ],
      borderColor: ['#10B981', '#00D9FF', '#8B5CF6'],
      borderWidth: 2,
      hoverOffset: 10,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '50%',
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
        labels: { color: '#9CA3AF', boxWidth: 12, padding: 8, font: { size: 10 } },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        callbacks: {
          label: (ctx: any) => `${ctx.label}: ${ctx.raw} total (${Math.round(ctx.raw/total*100)}%)`,
        },
      },
    },
  };

  return (
    <GlassChart
      title="Room Distribution"
      description="Aggregate room breakdown"
      chartId="C-room-sunburst"
      color="#10B981"
      webAugmented
      webSource="Public records"
    >
      {total > 1 ? (
        <Doughnut data={data} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          No room data available
        </div>
      )}
    </GlassChart>
  );
}

// C-2: Space Efficiency Scatter
function SpaceEfficiencyScatter({ properties, onPropertyClick }: CategoryCProps) {
  const points = properties.map(p => {
    const living = getVal(p.details?.livingSqft) || 0;
    const total = getVal(p.details?.totalSqftUnderRoof) || living || 1;
    const pps = getVal(p.address?.pricePerSqft) || 0;
    const efficiency = living / total;
    return { id: p.id, x: efficiency * 100, y: pps };
  }).filter(p => p.x > 0 && p.y > 0);

  const data = {
    datasets: [{
      label: 'Properties',
      data: points.map(p => ({ x: p.x, y: p.y })),
      backgroundColor: 'rgba(0, 217, 255, 0.6)',
      borderColor: '#00D9FF',
      borderWidth: 2,
      pointRadius: 8,
      pointHoverRadius: 12,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: 'Space Efficiency %', color: '#9CA3AF' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#9CA3AF' },
        min: 0,
        max: 100,
      },
      y: {
        title: { display: true, text: '$/sqft', color: '#9CA3AF' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#9CA3AF', callback: (v: number | string) => `$${v}` },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        callbacks: {
          label: (ctx: any) => `Efficiency: ${ctx.raw.x.toFixed(0)}%, Price: $${ctx.raw.y}/sqft`,
        },
      },
    },
  };

  return (
    <GlassChart
      title="Space Efficiency"
      description="Living space ratio vs price"
      chartId="C-space-efficiency"
      color="#00D9FF"
    >
      {points.length > 0 ? (
        <Scatter data={data} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          No space data available
        </div>
      )}
    </GlassChart>
  );
}

// C-3: Layout Bars
function LayoutBars({ properties }: CategoryCProps) {
  // Calculate averages
  const stats = properties.reduce((acc, p) => {
    acc.beds += getVal(p.details?.bedrooms) || 0;
    acc.baths += getVal(p.details?.totalBathrooms) || 0;
    acc.garage += getVal(p.details?.garageSpaces) || 0;
    acc.parking += parseInt(getVal(p.details?.parkingTotal) || '0') || 0;
    acc.count++;
    return acc;
  }, { beds: 0, baths: 0, garage: 0, parking: 0, count: 0 });

  const count = stats.count || 1;
  const bars = [
    { label: 'Avg Beds', value: stats.beds / count, max: 6, color: '#10B981' },
    { label: 'Avg Baths', value: stats.baths / count, max: 5, color: '#00D9FF' },
    { label: 'Avg Garage', value: stats.garage / count, max: 4, color: '#8B5CF6' },
    { label: 'Avg Parking', value: stats.parking / count, max: 6, color: '#F59E0B' },
  ];

  return (
    <GlassChart
      title="Layout Overview"
      description="Average room counts"
      chartId="C-layout-bars"
      color="#F59E0B"
    >
      <div className="h-full flex flex-col justify-center space-y-4 px-2">
        {bars.map((bar, i) => (
          <motion.div
            key={bar.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300 font-medium drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">{bar.label}</span>
              <span className="font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]" style={{ color: bar.color }}>{bar.value.toFixed(1)}</span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((bar.value / bar.max) * 100, 100)}%` }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="h-full rounded-full"
                style={{ backgroundColor: bar.color }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </GlassChart>
  );
}

export default function CategoryC({ properties, onPropertyClick }: CategoryCProps) {
  return (
    <>
      <RoomSunburst properties={properties} />
      <SpaceEfficiencyScatter properties={properties} onPropertyClick={onPropertyClick} />
      <LayoutBars properties={properties} />
    </>
  );
}
