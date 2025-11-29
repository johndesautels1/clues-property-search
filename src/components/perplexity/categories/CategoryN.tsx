/**
 * Category N: Utilities & Connectivity (13 fields)
 * Charts:
 * 1. UTILITY SPECTRUM DONUT - Electric/Water/Gas/Internet
 * 2. CONNECTIVITY→LUXURY SCATTER - Internet vs $/sqft
 * 3. EXPENSE TREND SURFACE - Sqft vs total utilities
 */

import { motion } from 'framer-motion';
import { Doughnut, Scatter } from 'react-chartjs-2';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';
import { Wifi, Zap, Droplets, Flame } from 'lucide-react';

interface CategoryNProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

function parseBillAmount(bill: string | null): number {
  if (!bill) return 0;
  const match = bill.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

// N-1: Utility Cost Donut
function UtilityCostDonut({ properties }: CategoryNProps) {
  let totalElectric = 0, totalWater = 0, totalInternet = 0, totalGas = 0;

  properties.forEach(p => {
    totalElectric += parseBillAmount(getVal(p.utilities?.avgElectricBill)) * 12;
    totalWater += parseBillAmount(getVal(p.utilities?.avgWaterBill)) * 12;
    totalInternet += 100 * 12; // Assume $100/mo if fiber available
    totalGas += getVal(p.utilities?.naturalGas) === 'Yes' ? 50 * 12 : 0;
  });

  const data = {
    labels: ['Electric', 'Water', 'Internet', 'Gas'],
    datasets: [{
      data: [totalElectric, totalWater, totalInternet, totalGas],
      backgroundColor: [
        'rgba(245, 158, 11, 0.8)',
        'rgba(0, 217, 255, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
      borderColor: ['#F59E0B', '#00D9FF', '#8B5CF6', '#EF4444'],
      borderWidth: 2,
    }],
  };

  const total = totalElectric + totalWater + totalInternet + totalGas;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
        labels: { color: '#9CA3AF', boxWidth: 12, padding: 8, font: { size: 10 } },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        callbacks: {
          label: (ctx: any) => `${ctx.label}: $${ctx.raw.toLocaleString()}/yr`,
        },
      },
    },
  };

  return (
    <GlassChart
      title="Utility Spectrum"
      description="Annual cost breakdown"
      chartId="N-utility-donut"
      color="#F59E0B"
    >
      <div className="relative h-full">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]">${(total/1000).toFixed(0)}K</div>
            <div className="text-xs text-gray-300 font-medium drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">Total/yr</div>
          </div>
        </div>
      </div>
    </GlassChart>
  );
}

// N-2: Connectivity Luxury Scatter
function ConnectivityLuxuryScatter({ properties }: CategoryNProps) {
  const points = properties.map(p => {
    const fiber = getVal(p.utilities?.fiberAvailable);
    const maxSpeed = getVal(p.utilities?.maxInternetSpeed);
    const speed = maxSpeed ? parseInt(maxSpeed) || 100 : fiber ? 1000 : 100;
    const pps = getVal(p.address?.pricePerSqft) || 0;

    return { id: p.id, x: speed, y: pps };
  }).filter(p => p.y > 0);

  const data = {
    datasets: [{
      label: 'Properties',
      data: points.map(p => ({ x: p.x, y: p.y })),
      backgroundColor: 'rgba(139, 92, 246, 0.6)',
      borderColor: '#8B5CF6',
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
        title: { display: true, text: 'Internet Speed (Mbps)', color: '#9CA3AF' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#9CA3AF' },
        type: 'logarithmic' as const,
      },
      y: {
        title: { display: true, text: '$/sqft', color: '#9CA3AF' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#9CA3AF', callback: (v: number | string) => `$${v}` },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(0,0,0,0.8)' },
    },
  };

  return (
    <GlassChart
      title="Connectivity vs Luxury"
      description="Internet speed vs price"
      chartId="N-connectivity"
      color="#8B5CF6"
    >
      {points.length > 0 ? (
        <Scatter data={data} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          No connectivity data
        </div>
      )}
    </GlassChart>
  );
}

// N-3: Utility Expense Bars
function UtilityExpenseBars({ properties }: CategoryNProps) {
  const data = properties.slice(0, 5).map(p => {
    const sqft = getVal(p.details?.livingSqft) || 1500;
    const electric = parseBillAmount(getVal(p.utilities?.avgElectricBill));
    const water = parseBillAmount(getVal(p.utilities?.avgWaterBill));
    const total = (electric + water) * 12;

    return {
      id: p.id,
      address: getVal(p.address?.streetAddress)?.slice(0, 10) || `#${p.id.slice(0, 4)}`,
      sqft,
      total,
      perSqft: sqft > 0 ? (total / sqft).toFixed(2) : '0',
    };
  });

  const maxTotal = Math.max(...data.map(d => d.total), 1);

  return (
    <GlassChart
      title="Utility Expense Trend"
      description="Annual cost by property"
      chartId="N-expense-trend"
      color="#00D9FF"
    >
      <div className="h-full flex flex-col justify-center space-y-3 px-2">
        {data.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300 font-medium truncate max-w-[100px] drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">{item.address}</span>
              <span className="text-cyan-400 font-bold drop-shadow-[0_0_6px_rgba(0,217,255,0.5)]">${item.total.toLocaleString()}/yr</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.total / maxTotal) * 100}%` }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                />
              </div>
              <span className="text-xs text-gray-400 font-medium w-16 text-right drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">${item.perSqft}/sqft</span>
            </div>
          </motion.div>
        ))}

        {data.length === 0 && (
          <div className="text-gray-300 font-medium text-sm text-center drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">No utility data</div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-300 font-medium mt-2 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span>Electric</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="w-3 h-3 text-cyan-400" />
            <span>Water</span>
          </div>
        </div>
      </div>
    </GlassChart>
  );
}

export default function CategoryN({ properties, onPropertyClick }: CategoryNProps) {
  return (
    <>
      <UtilityCostDonut properties={properties} />
      <ConnectivityLuxuryScatter properties={properties} onPropertyClick={onPropertyClick} />
      <UtilityExpenseBars properties={properties} />
    </>
  );
}
