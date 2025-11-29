/**
 * Market Velocity Chart
 *
 * Gauge chart showing days on market and market absorption rate
 */

import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Clock, TrendingUp, Activity } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Property {
  id: string | number;
  address: string;
  market?: {
    daysOnMarket?: number | null;
    avgDaysOnMarket?: number | null;
    absorptionRate?: number | null;
    inventoryMonths?: number | null;
  };
  [key: string]: any;
}

interface MarketVelocityChartProps {
  properties: Property[];
  selectedId?: string | number | 'all';
}

function shortAddress(address: string): string {
  return address.split(',')[0] || address;
}

const COLORS = ['#00D9FF', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

function getDOMColor(days: number | null | undefined): string {
  if (days == null) return '#6B7280';
  if (days <= 14) return '#10B981'; // Hot market
  if (days <= 30) return '#00D9FF'; // Active
  if (days <= 60) return '#F59E0B'; // Moderate
  return '#EF4444'; // Slow
}

function getDOMLabel(days: number | null | undefined): string {
  if (days == null) return 'N/A';
  if (days <= 14) return 'Hot Market';
  if (days <= 30) return 'Active';
  if (days <= 60) return 'Moderate';
  return 'Slow Market';
}

function getAbsorptionLabel(rate: number | null | undefined): string {
  if (rate == null) return 'N/A';
  if (rate >= 20) return "Seller's Market";
  if (rate >= 15) return 'Balanced-Seller';
  if (rate >= 10) return 'Balanced';
  return "Buyer's Market";
}

export default function MarketVelocityChart({ properties, selectedId = 'all' }: MarketVelocityChartProps) {
  const displayProperties = selectedId === 'all'
    ? properties
    : properties.filter(p => p.id === selectedId);

  if (displayProperties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No market velocity data available</p>
      </div>
    );
  }

  // Create gauge data for each property
  const gaugeData = displayProperties.map((p, i) => {
    const dom = p.market?.daysOnMarket ?? p.market?.avgDaysOnMarket ?? 30;
    // Normalize to 0-100 scale where 0 days = 100, 90+ days = 0
    const normalizedDOM = Math.max(0, 100 - (dom / 90) * 100);
    const color = getDOMColor(dom);

    return {
      address: shortAddress(p.address),
      dom,
      absorptionRate: p.market?.absorptionRate,
      inventoryMonths: p.market?.inventoryMonths,
      data: {
        datasets: [{
          data: [normalizedDOM, 100 - normalizedDOM],
          backgroundColor: [color, 'rgba(255, 255, 255, 0.05)'],
          borderColor: [color, 'rgba(255, 255, 255, 0.1)'],
          borderWidth: 2,
          circumference: 180,
          rotation: 270,
        }],
      },
    };
  });

  const gaugeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  // Calculate averages
  const avgDOM = Math.round(
    displayProperties.reduce((sum, p) => sum + (p.market?.daysOnMarket ?? p.market?.avgDaysOnMarket ?? 30), 0) / displayProperties.length
  );

  // Find fastest selling property
  const sortedByDOM = [...displayProperties].sort((a, b) => {
    const aDOM = a.market?.daysOnMarket ?? a.market?.avgDaysOnMarket ?? Infinity;
    const bDOM = b.market?.daysOnMarket ?? b.market?.avgDaysOnMarket ?? Infinity;
    return aDOM - bDOM;
  });
  const fastestSelling = sortedByDOM[0];

  // Single property view
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-semibold">Market Velocity</h3>
        </div>
        <div className="text-right">
          <span className="text-gray-400 text-xs">Avg DOM</span>
          <span className="text-white font-bold ml-2">{avgDOM}</span>
          <span className="text-gray-500 text-xs"> days</span>
        </div>
      </div>

      {/* Gauge Grid */}
      <div className={`grid gap-4 ${displayProperties.length === 1 ? 'grid-cols-1' : displayProperties.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {gaugeData.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            <div className="h-28 relative">
              <Doughnut data={item.data} options={gaugeOptions} />
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                <span
                  className="text-2xl font-bold"
                  style={{ color: getDOMColor(item.dom) }}
                >
                  {item.dom}
                </span>
                <span className="text-gray-500 text-xs">days</span>
              </div>
            </div>
            <p className="text-center text-gray-400 text-sm mt-1 truncate" title={item.address}>
              {item.address}
            </p>
            <p className="text-center text-xs" style={{ color: getDOMColor(item.dom) }}>
              {getDOMLabel(item.dom)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Single property additional stats */}
      {singleProp && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-400 text-xs">Area Avg DOM</span>
              </div>
              <p className="text-white font-bold text-lg">
                {singleProp.market?.avgDaysOnMarket ?? 'N/A'}
                {singleProp.market?.avgDaysOnMarket && <span className="text-gray-500 text-xs"> days</span>}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-gray-400 text-xs">Absorption Rate</span>
              </div>
              <p className="text-white font-bold text-lg">
                {singleProp.market?.absorptionRate != null
                  ? `${singleProp.market.absorptionRate}%`
                  : 'N/A'}
              </p>
              <p className="text-gray-500 text-xs">
                {getAbsorptionLabel(singleProp.market?.absorptionRate)}
              </p>
            </div>
          </div>
          {singleProp.market?.inventoryMonths != null && (
            <div className="mt-3 p-3 rounded-xl bg-white/5 text-center">
              <span className="text-gray-400 text-sm">Inventory: </span>
              <span className="text-white font-bold">{singleProp.market.inventoryMonths} months</span>
              <span className="text-gray-500 text-xs ml-2">
                ({singleProp.market.inventoryMonths < 4 ? "Seller's" : singleProp.market.inventoryMonths > 6 ? "Buyer's" : "Balanced"} Market)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Multi-property fastest selling callout */}
      {displayProperties.length > 1 && fastestSelling && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Fastest Market</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{shortAddress(fastestSelling.address)}</span>
              <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400">
                {fastestSelling.market?.daysOnMarket ?? fastestSelling.market?.avgDaysOnMarket ?? 'N/A'} days
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
