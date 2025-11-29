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

import { PROPERTY_COLORS, getPropertyColor, LEGACY_PROPERTY_COLORS, calcPricePerSqft } from '../chartColors';

// Use shared property colors from chartColors.ts for consistency across all charts

// B-1: Value Gap Funnel - Vertical bar chart for 3-property comparison
function ValueGapFunnel({ properties }: CategoryBProps) {
  // Take only first 3 properties (comparison mode)
  const comparisonProperties = properties.slice(0, 3);

  const data = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    return {
      id: p.id,
      address: getVal(p.address?.streetAddress) || `Property ${idx + 1}`,
      assessed: getVal(p.details?.assessedValue) || 0,
      market: getVal(p.details?.marketValueEstimate) || 0,
      list: getVal(p.address?.listingPrice) || 0,
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  // Vertical bar chart - X axis = value types, Y axis = price
  // Each property gets its own colored bar within each category
  const chartData = {
    labels: ['Assessed', 'Market Est.', 'List Price'],
    datasets: data.map((d) => ({
      label: `P${d.propertyNum}: ${d.address.slice(0, 15)}`,
      data: [d.assessed / 1000000, d.market / 1000000, d.list / 1000000],
      backgroundColor: d.color.rgba(0.85),
      borderColor: d.color.hex,
      borderWidth: 2,
      borderRadius: 6,
      barThickness: 28,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        // Price on vertical axis
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: {
          color: '#E5E7EB',
          font: { size: 11, weight: 'bold' as const },
          callback: (value: number | string) => `$${value}M`,
        },
        title: {
          display: true,
          text: 'Price ($M)',
          color: '#E5E7EB',
          font: { size: 11, weight: 'bold' as const },
        },
      },
      x: {
        // Values/Estimates on horizontal axis
        grid: { display: false },
        ticks: {
          color: '#E5E7EB',
          font: { size: 11, weight: 'bold' as const },
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: '#E5E7EB',
          boxWidth: 14,
          padding: 15,
          font: { size: 10, weight: 'bold' as const },
          usePointStyle: true,
          pointStyle: 'rectRounded',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.9)',
        titleFont: { weight: 'bold' as const },
        bodyFont: { weight: 'bold' as const },
        padding: 12,
        callbacks: {
          label: (ctx: any) => {
            const value = ctx.raw * 1000000;
            return `${ctx.dataset.label}: $${value.toLocaleString()}`;
          },
        },
      },
    },
  };

  return (
    <GlassChart
      title="Value Gap Funnel"
      description={`Comparing ${data.length} properties: Assessed → Market → List`}
      chartId="B-value-gap"
      color="#4f9dff"
      webAugmented
      webSource="Zestimate/marketEstimate"
    >
      {data.length > 0 ? (
        <Bar data={chartData} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          No pricing data available
        </div>
      )}
    </GlassChart>
  );
}

// Normalize property type names to consolidate variations
function normalizePropertyType(type: string | null): string {
  if (!type) return 'Single Family';
  const normalized = type.toLowerCase().trim();
  if (normalized.includes('single') || normalized.includes('sfr') || normalized.includes('detached')) {
    return 'Single Family';
  }
  if (normalized.includes('condo') || normalized.includes('condominium')) {
    return 'Condo';
  }
  if (normalized.includes('town') || normalized.includes('attached')) {
    return 'Townhouse';
  }
  if (normalized.includes('multi') || normalized.includes('duplex') || normalized.includes('triplex')) {
    return 'Multi-Family';
  }
  if (normalized.includes('mobile') || normalized.includes('manufactured')) {
    return 'Mobile Home';
  }
  if (normalized.includes('land') || normalized.includes('lot') || normalized.includes('vacant')) {
    return 'Land';
  }
  return type; // Return original if no match
}

// B-2: Price/Sqft Comparison - Shows each property with P1/P2/P3 colors
function PriceSqftViolin({ properties }: CategoryBProps) {
  // Take first 3 properties for comparison (like Value Gap Funnel)
  const comparisonProperties = properties.slice(0, 3);

  const propertyData = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const pps = calcPricePerSqft(
      getVal(p.address?.pricePerSqft),
      getVal(p.address?.listingPrice),
      getVal(p.details?.livingSqft)
    );
    const propType = normalizePropertyType(getVal(p.details?.propertyType));

    return {
      id: p.id,
      address: getVal(p.address?.streetAddress) || `Property ${idx + 1}`,
      pricePerSqft: pps,
      propertyType: propType,
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  const maxVal = Math.max(...propertyData.map(p => p.pricePerSqft), 500);

  return (
    <GlassChart
      title="Price/Sqft Comparison"
      description={`Comparing ${propertyData.length} properties`}
      chartId="B-price-sqft"
      color={PROPERTY_COLORS.P2.hex}
    >
      <div className="h-full flex flex-col justify-center space-y-4 px-2">
        {propertyData.map((prop, i) => (
          <motion.div
            key={prop.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex justify-between text-xs mb-1">
              <span
                className="font-bold truncate max-w-[140px] drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                style={{ color: prop.color.hex }}
              >
                P{prop.propertyNum}: {prop.address.slice(0, 15)}
              </span>
              <span
                className="font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                style={{ color: prop.color.hex }}
              >
                ${Math.round(prop.pricePerSqft)}/sqft
              </span>
            </div>
            <div className="relative h-5 bg-white/5 rounded-full overflow-hidden">
              {/* Price bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(prop.pricePerSqft / maxVal) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.15 }}
                className="absolute h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${prop.color.rgba(0.4)}, ${prop.color.hex})`,
                  boxShadow: `0 0 10px ${prop.color.rgba(0.5)}`,
                }}
              />
            </div>
            <div className="text-xs text-gray-400 font-medium mt-0.5 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
              {prop.propertyType}
            </div>
          </motion.div>
        ))}

        {propertyData.length === 0 && (
          <div className="text-gray-300 font-medium text-sm text-center drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
            No price/sqft data available
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

// B-3: Triple Gauge - Shows market estimate for each of 3 properties
function TripleGauge({ properties }: CategoryBProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const gaugeData = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const market = getVal(p.details?.marketValueEstimate) || getVal(p.address?.listingPrice) || 0;
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    return {
      id: p.id,
      label: `P${idx + 1}`,
      address: address.slice(0, 20),
      value: market,
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  const maxVal = Math.max(...gaugeData.map(g => g.value), 1);

  return (
    <GlassChart
      title="Property Value Gauges"
      description={`Market estimates for ${gaugeData.length} properties`}
      chartId="B-triple-gauge"
      color={PROPERTY_COLORS.P3.hex}
      webAugmented
      webSource="Zestimate/Redfin"
    >
      <div className="h-full flex items-center justify-around px-4">
        {gaugeData.map((gauge, i) => {
          const percent = maxVal > 0 ? (gauge.value / maxVal) * 100 : 0;
          const circumference = 2 * Math.PI * 35;
          const strokeDashoffset = circumference - (percent / 100) * circumference;

          return (
            <motion.div
              key={gauge.id}
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
                    stroke={gauge.color.hex}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, delay: i * 0.2 }}
                    style={{
                      filter: `drop-shadow(0 0 8px ${gauge.color.hex})`,
                    }}
                  />
                </svg>
                {/* Center value */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-xs drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]">
                    {gauge.value > 0 ? `$${(gauge.value / 1000000).toFixed(1)}M` : '—'}
                  </span>
                </div>
              </div>
              <span
                className="text-xs font-bold mt-1 block drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                style={{ color: gauge.color.hex }}
              >
                {gauge.label}: {gauge.address}
              </span>
            </motion.div>
          );
        })}

        {gaugeData.length === 0 && (
          <div className="text-gray-300 font-medium text-sm text-center drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
            No value data available
          </div>
        )}
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
