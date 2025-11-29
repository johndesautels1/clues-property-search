/**
 * Category M: Market & Investment (13 fields)
 * Charts:
 * 1. ROI HIGHWAY - Today→Year10 sparkline
 * 2. CAP→APPRECIATION BUBBLES - Yield vs growth
 * 3. PULSE TIMELINE - 2020→2025 neighborhood trend
 */

import { motion } from 'framer-motion';
import { Line, Scatter } from 'react-chartjs-2';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';
import { PROPERTY_COLORS, getPropertyColor } from '../chartColors';

interface CategoryMProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

// M-1: ROI Highway Timeline
function ROIHighway({ properties }: CategoryMProps) {
  // This chart requires appreciation rate data which is not yet in the schema
  // When marketAnalysis data is available, this will show real projections
  const hasData = false; // Placeholder until schema includes appreciation fields
  const values: number[] = [];
  const years = ['Today', 'Y1', 'Y2', 'Y3', 'Y5', 'Y7', 'Y10'];

  const data = {
    labels: years,
    datasets: [{
      label: 'Projected Value',
      data: values,
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#10B981',
      pointBorderColor: '#fff',
      pointRadius: 4,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#9CA3AF' },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: {
          color: '#9CA3AF',
          callback: (v: number | string) => `$${v}M`,
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        callbacks: {
          label: (ctx: any) => `$${(ctx.raw * 1000000).toLocaleString()}`,
        },
      },
    },
  };

  return (
    <GlassChart
      title="ROI Highway"
      description="10-year value projection"
      chartId="M-roi-highway"
      color="#10B981"
    >
      {values.length > 0 ? (
        <Line data={data} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          No appreciation data available
        </div>
      )}
    </GlassChart>
  );
}

// M-2: Cap Appreciation Bubbles - Show first 3 properties with P1/P2/P3 colors
function CapAppreciationBubbles({ properties }: CategoryMProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const points = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const capRate = getVal(p.financial?.capRateEst) || 0;
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    // Appreciation field not yet in schema - show cap rate only
    return {
      id: p.id,
      x: capRate,
      y: 0, // No appreciation data available in current schema
      color: propColor,
      propertyNum: idx + 1,
      address: address.slice(0, 15),
    };
  }).filter(p => p.x > 0);

  // Create separate dataset for each property for distinct colors
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
        title: { display: true, text: 'Cap Rate %', color: '#E5E7EB', font: { weight: 'bold' as const } },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#E5E7EB', font: { weight: 'bold' as const }, callback: (v: number | string) => `${v}%` },
      },
      y: {
        title: { display: true, text: 'Appreciation %', color: '#E5E7EB', font: { weight: 'bold' as const } },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#E5E7EB', font: { weight: 'bold' as const }, callback: (v: number | string) => `${v}%` },
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
          label: (ctx: any) => `Cap: ${ctx.raw.x}%, Appr: ${ctx.raw.y}%`,
        },
      },
    },
  };

  return (
    <GlassChart
      title="Cap vs Appreciation"
      description={`Yield vs growth for ${points.length} properties`}
      chartId="M-cap-appreciation"
      color={PROPERTY_COLORS.P2.hex}
    >
      {points.length > 0 ? (
        <Scatter data={data} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          No cap/appreciation data
        </div>
      )}
    </GlassChart>
  );
}

// M-3: Market Pulse Timeline
function MarketPulseTimeline({ properties }: CategoryMProps) {
  // Aggregate neighborhood pulse data
  const years = ['2020', '2021', '2022', '2023', '2024', '2025'];

  // Only use actual median home price data - no simulated historical data
  const currentMedian = properties.reduce((acc, p) => {
    const median = getVal(p.financial?.medianHomePriceNeighborhood);
    if (median) {
      acc.total += median;
      acc.count++;
    }
    return acc;
  }, { total: 0, count: 0 });

  const avgMedian = currentMedian.count > 0 ? currentMedian.total / currentMedian.count / 1000000 : 0;

  // Show only current year data point if we have it
  const avgByYear = avgMedian > 0 ? [null, null, null, null, null, avgMedian] : [];

  const data = {
    labels: years,
    datasets: [{
      label: 'Neighborhood Median',
      data: avgByYear,
      borderColor: '#F59E0B',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#9CA3AF' },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: {
          color: '#9CA3AF',
          callback: (v: number | string) => `$${v}M`,
        },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <GlassChart
      title="Market Pulse"
      description="Current neighborhood median"
      chartId="M-pulse-timeline"
      color="#F59E0B"
    >
      {avgMedian > 0 ? (
        <Line data={data} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          No neighborhood median data
        </div>
      )}
    </GlassChart>
  );
}

export default function CategoryM({ properties, onPropertyClick }: CategoryMProps) {
  return (
    <>
      <ROIHighway properties={properties} />
      <CapAppreciationBubbles properties={properties} onPropertyClick={onPropertyClick} />
      <MarketPulseTimeline properties={properties} />
    </>
  );
}
