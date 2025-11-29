/**
 * Category C: Property Basics (13 fields)
 * Charts:
 * 1. ROOM SUNBURST - Bed→Bath→Living→Storage rings
 * 2. SPACE EFFICIENCY SCATTER - Living/Total vs $/sqft
 * 3. LAYOUT BARS - Bed/Bath/Garage horizontal bars
 */

import { motion } from 'framer-motion';
import { Bar, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  PointElement,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';
import { PROPERTY_COLORS, getPropertyColor, calcPricePerSqft } from '../chartColors';

ChartJS.register(BarElement, CategoryScale, PointElement, LinearScale, Tooltip, Legend);

interface CategoryCProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

// C-1: Room Comparison Bar - Compare rooms across P1/P2/P3 properties
function RoomComparisonBar({ properties }: CategoryCProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const propertyData = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;
    return {
      id: p.id,
      label: `P${idx + 1}: ${address.slice(0, 12)}`,
      beds: getVal(p.details?.bedrooms) || 0,
      baths: getVal(p.details?.totalBathrooms) || 0,
      garage: getVal(p.details?.garageSpaces) || 0,
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  const hasData = propertyData.some(p => p.beds > 0 || p.baths > 0 || p.garage > 0);

  const data = {
    labels: ['Bedrooms', 'Bathrooms', 'Garage'],
    datasets: propertyData.map((prop) => ({
      label: prop.label,
      data: [prop.beds, prop.baths, prop.garage],
      backgroundColor: prop.color.rgba(0.7),
      borderColor: prop.color.hex,
      borderWidth: 2,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#E5E7EB', font: { weight: 'bold' as const } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#E5E7EB', font: { weight: 'bold' as const } },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: '#E5E7EB',
          boxWidth: 12,
          padding: 10,
          font: { size: 10, weight: 'bold' as const },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.9)',
        titleFont: { weight: 'bold' as const },
        bodyFont: { weight: 'bold' as const },
      },
    },
  };

  return (
    <GlassChart
      title="Room Comparison"
      description={`Beds/baths/garage for ${propertyData.length} properties`}
      chartId="C-room-comparison"
      color={PROPERTY_COLORS.P1.hex}
    >
      {hasData ? (
        <Bar data={data} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          No room data available
        </div>
      )}
    </GlassChart>
  );
}

// C-2: Space Efficiency Scatter - Individual properties with P1/P2/P3 colors
function SpaceEfficiencyScatter({ properties, onPropertyClick }: CategoryCProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const points = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const living = getVal(p.details?.livingSqft) || 0;
    const total = getVal(p.details?.totalSqftUnderRoof) || living || 1;
    const pps = calcPricePerSqft(
      getVal(p.address?.pricePerSqft),
      getVal(p.address?.listingPrice),
      living
    );
    const efficiency = living / total;
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;
    return {
      id: p.id,
      x: efficiency * 100,
      y: pps,
      color: propColor,
      propertyNum: idx + 1,
      address: address.slice(0, 15),
    };
  }).filter(p => p.x > 0 && p.y > 0);

  // Create separate dataset for each property so they get distinct colors
  const data = {
    datasets: points.map((point) => ({
      label: `P${point.propertyNum}: ${point.address}`,
      data: [{ x: point.x, y: point.y }],
      backgroundColor: point.color.rgba(0.7),
      borderColor: point.color.hex,
      borderWidth: 2,
      pointRadius: 12,
      pointHoverRadius: 16,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: 'Space Efficiency %', color: '#E5E7EB', font: { weight: 'bold' as const } },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#E5E7EB', font: { weight: 'bold' as const } },
        min: 0,
        max: 100,
      },
      y: {
        title: { display: true, text: '$/sqft', color: '#E5E7EB', font: { weight: 'bold' as const } },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#E5E7EB', font: { weight: 'bold' as const }, callback: (v: number | string) => `$${v}` },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: '#E5E7EB',
          boxWidth: 12,
          padding: 10,
          font: { size: 10, weight: 'bold' as const },
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.9)',
        titleFont: { weight: 'bold' as const },
        bodyFont: { weight: 'bold' as const },
        callbacks: {
          label: (ctx: any) => `Efficiency: ${ctx.raw.x.toFixed(0)}%, Price: $${ctx.raw.y}/sqft`,
        },
      },
    },
  };

  return (
    <GlassChart
      title="Space Efficiency"
      description={`Comparing ${points.length} properties`}
      chartId="C-space-efficiency"
      color={PROPERTY_COLORS.P2.hex}
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

// C-3: Layout Bars - Show each property's room counts with P1/P2/P3 colors
function LayoutBars({ properties }: CategoryCProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const propertyData = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;
    const beds = getVal(p.details?.bedrooms) || 0;
    const baths = getVal(p.details?.totalBathrooms) || 0;
    const garage = getVal(p.details?.garageSpaces) || 0;
    const total = beds + baths + garage;

    return {
      id: p.id,
      address: address.slice(0, 12),
      beds,
      baths,
      garage,
      total,
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  const maxTotal = Math.max(...propertyData.map(p => p.total), 10);

  return (
    <GlassChart
      title="Layout Comparison"
      description={`Beds/Baths/Garage for ${propertyData.length} properties`}
      chartId="C-layout-bars"
      color={PROPERTY_COLORS.P1.hex}
    >
      <div className="h-full flex flex-col justify-center space-y-3 px-2">
        {propertyData.map((prop, i) => (
          <motion.div
            key={prop.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex justify-between text-xs mb-1">
              <span
                className="font-bold truncate max-w-[120px] drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                style={{ color: prop.color.hex }}
              >
                P{prop.propertyNum}: {prop.address}
              </span>
              <span className="text-gray-300 font-medium drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
                {prop.beds}bd / {prop.baths}ba / {prop.garage}ga
              </span>
            </div>
            <div className="h-4 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((prop.total / maxTotal) * 100, 100)}%` }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${prop.color.rgba(0.4)}, ${prop.color.hex})`,
                  boxShadow: `0 0 8px ${prop.color.rgba(0.5)}`,
                }}
              />
            </div>
          </motion.div>
        ))}

        {propertyData.length === 0 && (
          <div className="text-gray-300 font-medium text-sm text-center drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
            No layout data available
          </div>
        )}

        {/* Legend */}
        <div className="flex justify-center gap-4 pt-2 border-t border-white/10">
          {propertyData.map((prop) => (
            <div key={prop.id} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: prop.color.hex, boxShadow: `0 0 6px ${prop.color.hex}` }}
              />
              <span className="text-xs text-gray-300 font-medium">P{prop.propertyNum}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassChart>
  );
}

export default function CategoryC({ properties, onPropertyClick }: CategoryCProps) {
  return (
    <>
      <RoomComparisonBar properties={properties} />
      <SpaceEfficiencyScatter properties={properties} onPropertyClick={onPropertyClick} />
      <LayoutBars properties={properties} />
    </>
  );
}
