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

interface CategoryMProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

// M-1: ROI Highway Timeline
function ROIHighway({ properties }: CategoryMProps) {
  // Get first property with ROI data or create sample
  const p = properties[0];
  const currentPrice = p ? (getVal(p.address?.listingPrice) || 1000000) : 1000000;

  // Generate ROI projection (5.5% annual appreciation)
  const years = ['Today', 'Y1', 'Y2', 'Y3', 'Y5', 'Y7', 'Y10'];
  const multipliers = [1, 1.055, 1.113, 1.174, 1.307, 1.455, 1.708];
  const values = multipliers.map(m => (currentPrice * m) / 1000000);

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
      <Line data={data} options={options} />
    </GlassChart>
  );
}

// M-2: Cap Appreciation Bubbles
function CapAppreciationBubbles({ properties }: CategoryMProps) {
  const points = properties.map(p => {
    const capRate = getVal(p.financial?.capRateEst) || 0;
    const rentalIncome = getVal(p.financial?.rentalEstimateMonthly) || 0;

    return {
      id: p.id,
      x: capRate,
      y: 5.5, // Assumed appreciation
      r: Math.max(5, Math.min(rentalIncome / 500, 20)),
    };
  }).filter(p => p.x > 0);

  const data = {
    datasets: [{
      label: 'Properties',
      data: points.map(p => ({ x: p.x, y: p.y, r: p.r })),
      backgroundColor: 'rgba(0, 217, 255, 0.5)',
      borderColor: '#00D9FF',
      borderWidth: 2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: 'Cap Rate %', color: '#9CA3AF' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#9CA3AF', callback: (v: number | string) => `${v}%` },
      },
      y: {
        title: { display: true, text: 'Appreciation %', color: '#9CA3AF' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#9CA3AF', callback: (v: number | string) => `${v}%` },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        callbacks: {
          label: (ctx: any) => `Cap: ${ctx.raw.x}%, Appr: ${ctx.raw.y}%`,
        },
      },
    },
  };

  return (
    <GlassChart
      title="Cap vs Appreciation"
      description="Yield vs growth (size = rental income)"
      chartId="M-cap-appreciation"
      color="#00D9FF"
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

  const avgByYear = years.map(year => {
    let total = 0;
    let count = 0;
    properties.forEach(p => {
      const median = getVal(p.financial?.medianHomePriceNeighborhood);
      if (median) {
        // Simulate historical data based on current median
        const yearIndex = parseInt(year) - 2020;
        const historicalFactor = Math.pow(1.08, yearIndex - 5); // 8% annual growth
        total += median * historicalFactor;
        count++;
      }
    });
    return count > 0 ? total / count / 1000000 : 0;
  });

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
      description="Neighborhood trend 2020-2025"
      chartId="M-pulse-timeline"
      color="#F59E0B"
    >
      <Line data={data} options={options} />
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
