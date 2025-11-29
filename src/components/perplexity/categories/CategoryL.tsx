/**
 * Category L: Safety & Crime (3 fields)
 * Charts:
 * 1. CRIME GAUGE TRIO - Safety/Violent/Property levels
 * 2. SAFETY→YIELD GALAXY - Bubble scatter
 * 3. CRIME HEAT ROW - Horizontal heat cells
 */

import { motion } from 'framer-motion';
import { Scatter } from 'react-chartjs-2';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';
import { Shield, AlertTriangle, Home } from 'lucide-react';
import { INDEX_COLORS, getIndexColor, PROPERTY_COLORS, getPropertyColor } from '../chartColors';

interface CategoryLProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

function crimeToScore(crime: string | null): number {
  if (!crime) return 50;
  const c = crime.toUpperCase();
  if (c === 'LOW' || c === 'VERY LOW') return 90;
  if (c === 'MOD' || c === 'MODERATE') return 60;
  if (c === 'HIGH') return 30;
  return 50;
}

// L-1: Crime Gauge Trio
function CrimeGaugeTrio({ properties }: CategoryLProps) {
  const scores = properties.reduce((acc, p) => {
    const safety = getVal(p.location?.neighborhoodSafetyRating);
    const violent = getVal(p.location?.crimeIndexViolent);
    const property = getVal(p.location?.crimeIndexProperty);

    acc.safety += crimeToScore(safety);
    acc.violent += crimeToScore(violent);
    acc.property += crimeToScore(property);
    acc.count++;
    return acc;
  }, { safety: 0, violent: 0, property: 0, count: 0 });

  const count = scores.count || 1;

  const gauges = [
    { label: 'Safety', value: Math.round(scores.safety / count), icon: Shield, color: '#10B981' },
    { label: 'Violent', value: Math.round(scores.violent / count), icon: AlertTriangle, color: '#EF4444' },
    { label: 'Property', value: Math.round(scores.property / count), icon: Home, color: '#F59E0B' },
  ];

  return (
    <GlassChart
      title="Crime Gauge Trio"
      description="Safety & crime indices"
      chartId="L-crime-gauges"
      color="#10B981"
      webAugmented
      webSource="NeighborhoodScout"
    >
      <div className="h-full flex items-center justify-around">
        {gauges.map((gauge, i) => {
          const Icon = gauge.icon;
          const circumference = 2 * Math.PI * 28;
          const strokeDashoffset = circumference - (gauge.value / 100) * circumference;

          return (
            <motion.div
              key={gauge.label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="5"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke={gauge.color}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, delay: i * 0.2 }}
                    style={{ filter: `drop-shadow(0 0 8px ${gauge.color})` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Icon className="w-4 h-4" style={{ color: gauge.color }} />
                  <span className="text-white font-bold text-sm drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]">{gauge.value}</span>
                </div>
              </div>
              <span className="text-xs text-gray-300 font-medium mt-1 block drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">{gauge.label}</span>
            </motion.div>
          );
        })}
      </div>
    </GlassChart>
  );
}

// L-2: Safety Yield Scatter - Show first 3 properties with P1/P2/P3 colors
function SafetyYieldScatter({ properties }: CategoryLProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const points = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const safety = crimeToScore(getVal(p.location?.neighborhoodSafetyRating));
    const rentalYield = getVal(p.financial?.rentalYieldEst) || 0;
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    return {
      id: p.id,
      x: safety,
      y: rentalYield,
      color: propColor,
      propertyNum: idx + 1,
      address: address.slice(0, 15),
    };
  }).filter(p => p.y > 0);

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
        title: { display: true, text: 'Safety Score', color: '#E5E7EB', font: { weight: 'bold' as const } },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#E5E7EB', font: { weight: 'bold' as const } },
        min: 0,
        max: 100,
      },
      y: {
        title: { display: true, text: 'Rental Yield %', color: '#E5E7EB', font: { weight: 'bold' as const } },
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
          label: (ctx: any) => `Safety: ${ctx.raw.x}, Yield: ${ctx.raw.y.toFixed(1)}%`,
        },
      },
    },
  };

  return (
    <GlassChart
      title="Safety vs Yield Galaxy"
      description={`Risk-adjusted returns for ${points.length} properties`}
      chartId="L-safety-yield"
      color={PROPERTY_COLORS.P2.hex}
    >
      {points.length > 0 ? (
        <Scatter data={data} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          No safety/yield data
        </div>
      )}
    </GlassChart>
  );
}

// L-3: Crime Heat Row
function CrimeHeatRow({ properties }: CategoryLProps) {
  const data = properties.slice(0, 8).map(p => ({
    id: p.id,
    address: getVal(p.address?.streetAddress)?.slice(0, 6) || `#${p.id.slice(0, 3)}`,
    violent: crimeToScore(getVal(p.location?.crimeIndexViolent)),
    property: crimeToScore(getVal(p.location?.crimeIndexProperty)),
  }));

  // Use CLUES INDEX colors: higher safety score = better (GREEN), lower = worse (RED)
  const getColor = (score: number): string => {
    return getIndexColor(score).hex;
  };

  return (
    <GlassChart
      title="Crime Heat Row"
      description="Property safety comparison"
      chartId="L-crime-heat"
      color="#EF4444"
    >
      <div className="h-full flex flex-col justify-center">
        {/* Violent crime row */}
        <div className="mb-3">
          <div className="text-xs text-gray-300 font-medium mb-1 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">Violent Crime Index</div>
          <div className="flex gap-1">
            {data.map((d, i) => (
              <motion.div
                key={`v-${d.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex-1 h-10 rounded flex flex-col items-center justify-center"
                style={{ backgroundColor: `${getColor(d.violent)}40` }}
              >
                <span className="text-white text-xs font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]">{d.violent}</span>
                <span className="text-gray-300 text-xs font-medium truncate max-w-full px-1 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">{d.address}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Property crime row */}
        <div>
          <div className="text-xs text-gray-300 font-medium mb-1 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">Property Crime Index</div>
          <div className="flex gap-1">
            {data.map((d, i) => (
              <motion.div
                key={`p-${d.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 + 0.2 }}
                className="flex-1 h-10 rounded flex flex-col items-center justify-center"
                style={{ backgroundColor: `${getColor(d.property)}40` }}
              >
                <span className="text-white text-xs font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]">{d.property}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {data.length === 0 && (
          <div className="text-gray-300 font-medium text-sm text-center drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">No crime data</div>
        )}
      </div>
    </GlassChart>
  );
}

export default function CategoryL({ properties, onPropertyClick }: CategoryLProps) {
  return (
    <>
      <CrimeGaugeTrio properties={properties} />
      <SafetyYieldScatter properties={properties} onPropertyClick={onPropertyClick} />
      <CrimeHeatRow properties={properties} />
    </>
  );
}
