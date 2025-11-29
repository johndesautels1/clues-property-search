/**
 * Category B: Pricing & Value (7 fields)
 * Charts:
 * 1. VALUE-GAP FUNNEL - Assessed→Market→List cascade
 * 2. PRICE/SQFT VIOLIN - Dual density by property type
 * 3. TRIPLE GAUGE - Assessed/Market/Redfin neon rings
 */

import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface CategoryBProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

// B-1: Value Gap Funnel
function ValueGapFunnel({ properties }: CategoryBProps) {
  const data = properties.slice(0, 5).map(p => ({
    id: p.id,
    address: getVal(p.address?.streetAddress)?.slice(0, 15) || `#${p.id.slice(0, 4)}`,
    assessed: getVal(p.details?.assessedValue) || 0,
    market: getVal(p.details?.marketValueEstimate) || 0,
    list: getVal(p.address?.listingPrice) || 0,
  }));

  const chartData = {
    labels: data.map(d => d.address),
    datasets: [
      {
        label: 'Assessed',
        data: data.map(d => d.assessed / 1000000),
        backgroundColor: 'rgba(79, 157, 255, 0.8)',
        borderColor: '#4f9dff',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Market',
        data: data.map(d => d.market / 1000000),
        backgroundColor: 'rgba(124, 243, 255, 0.8)',
        borderColor: '#7cf3ff',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'List',
        data: data.map(d => d.list / 1000000),
        backgroundColor: 'rgba(255, 107, 203, 0.8)',
        borderColor: '#ff6bcb',
        borderWidth: 1,
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
        stacked: false,
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: {
          color: '#9CA3AF',
          callback: (value: number | string) => `$${value}M`,
        },
      },
      y: {
        stacked: false,
        grid: { display: false },
        ticks: { color: '#9CA3AF', font: { size: 10 } },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { color: '#9CA3AF', boxWidth: 12, padding: 8 },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: $${(ctx.raw * 1000000).toLocaleString()}`,
        },
      },
    },
  };

  return (
    <GlassChart
      title="Value Gap Funnel"
      description="Assessed → Market → List comparison"
      chartId="B-value-gap"
      color="#4f9dff"
      webAugmented
      webSource="Zestimate/marketEstimate"
    >
      {data.length > 0 ? (
        <Bar data={chartData} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          No pricing data available
        </div>
      )}
    </GlassChart>
  );
}

// B-2: Price/Sqft Violin (simplified as distribution bars)
function PriceSqftViolin({ properties }: CategoryBProps) {
  // Group by property type
  const groups = new Map<string, number[]>();
  properties.forEach(p => {
    const type = getVal(p.details?.propertyType) || 'Single Family';
    const pps = getVal(p.address?.pricePerSqft);
    if (pps) {
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type)!.push(pps);
    }
  });

  const stats = Array.from(groups.entries()).map(([type, values]) => ({
    type,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    count: values.length,
  }));

  const maxVal = Math.max(...stats.map(s => s.max), 500);

  return (
    <GlassChart
      title="Price/Sqft Distribution"
      description="By property type"
      chartId="B-price-sqft"
      color="#8B5CF6"
    >
      <div className="h-full flex flex-col justify-center space-y-3 px-2">
        {stats.slice(0, 4).map((stat, i) => (
          <motion.div
            key={stat.type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span className="truncate max-w-[100px]">{stat.type}</span>
              <span className="text-purple-400">${Math.round(stat.avg)}/sqft</span>
            </div>
            <div className="relative h-4 bg-white/5 rounded-full overflow-hidden">
              {/* Range bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${((stat.max - stat.min) / maxVal) * 100}%`,
                  left: `${(stat.min / maxVal) * 100}%`,
                }}
                className="absolute h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #8B5CF660, #8B5CF6)',
                }}
              />
              {/* Average marker */}
              <div
                className="absolute top-0 h-full w-1 bg-white"
                style={{ left: `${(stat.avg / maxVal) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-0.5">
              <span>${stat.min}</span>
              <span>${stat.max}</span>
            </div>
          </motion.div>
        ))}

        {stats.length === 0 && (
          <div className="text-gray-500 text-sm text-center">
            No price/sqft data available
          </div>
        )}
      </div>
    </GlassChart>
  );
}

// B-3: Triple Gauge - Neon rings
function TripleGauge({ properties }: CategoryBProps) {
  // Calculate averages
  let totalAssessed = 0, totalMarket = 0, totalRedfin = 0, count = 0;
  properties.forEach(p => {
    const assessed = getVal(p.details?.assessedValue);
    const market = getVal(p.details?.marketValueEstimate);
    const redfin = getVal(p.financial?.redfinEstimate);
    if (assessed || market || redfin) {
      totalAssessed += assessed || 0;
      totalMarket += market || 0;
      totalRedfin += redfin || 0;
      count++;
    }
  });

  const avgAssessed = count > 0 ? totalAssessed / count : 0;
  const avgMarket = count > 0 ? totalMarket / count : 0;
  const avgRedfin = count > 0 ? totalRedfin / count : 0;
  const maxVal = Math.max(avgAssessed, avgMarket, avgRedfin, 1);

  const gauges = [
    { label: 'Assessed', value: avgAssessed, color: '#4f9dff' },
    { label: 'Market', value: avgMarket, color: '#7cf3ff' },
    { label: 'Redfin', value: avgRedfin, color: '#ff6bcb' },
  ];

  return (
    <GlassChart
      title="Triple Estimate Gauges"
      description="Portfolio value estimates"
      chartId="B-triple-gauge"
      color="#ff6bcb"
      webAugmented
      webSource="Redfin Estimate"
    >
      <div className="h-full flex items-center justify-around px-4">
        {gauges.map((gauge, i) => {
          const percent = maxVal > 0 ? (gauge.value / maxVal) * 100 : 0;
          const circumference = 2 * Math.PI * 35;
          const strokeDashoffset = circumference - (percent / 100) * circumference;

          return (
            <motion.div
              key={gauge.label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="relative w-20 h-20">
                {/* Background ring */}
                <svg className="w-20 h-20 -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="6"
                  />
                  {/* Animated ring */}
                  <motion.circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    stroke={gauge.color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, delay: i * 0.2 }}
                    style={{
                      filter: `drop-shadow(0 0 8px ${gauge.color})`,
                    }}
                  />
                </svg>
                {/* Center value */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">
                    {gauge.value > 0 ? `$${(gauge.value / 1000000).toFixed(1)}M` : '—'}
                  </span>
                </div>
              </div>
              <span className="text-xs text-gray-400 mt-1 block">{gauge.label}</span>
            </motion.div>
          );
        })}
      </div>
    </GlassChart>
  );
}

export default function CategoryB({ properties, onPropertyClick }: CategoryBProps) {
  return (
    <>
      <ValueGapFunnel properties={properties} onPropertyClick={onPropertyClick} />
      <PriceSqftViolin properties={properties} onPropertyClick={onPropertyClick} />
      <TripleGauge properties={properties} />
    </>
  );
}
