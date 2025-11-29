/**
 * Category E: Structure & Systems (10 fields)
 * Charts:
 * 1. SYSTEMS RADAR - 8pt star: Roof/HVAC/Foundation
 * 2. AGE→CONDITION TREND - Degradation curve
 * 3. REPLACEMENT BARS - Years left for Roof/HVAC
 */

import { motion } from 'framer-motion';
import { Radar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';
import { getIndexColor, PROPERTY_COLORS, getPropertyColor } from '../chartColors';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, CategoryScale, LinearScale);

interface CategoryEProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

function conditionToScore(condition: string | null): number {
  if (!condition) return 50;
  const c = condition.toUpperCase();
  if (c === 'EXCELLENT') return 95;
  if (c === 'GOOD') return 75;
  if (c === 'FAIR') return 50;
  if (c === 'POOR') return 25;
  return 50;
}

// E-1: Systems Health Radar - Show first 3 properties with P1/P2/P3 colors
function SystemsRadar({ properties }: CategoryEProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const propertyData = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    return {
      id: p.id,
      label: `P${idx + 1}: ${address.slice(0, 12)}`,
      roof: conditionToScore(getVal(p.structural?.roofType)),
      hvac: conditionToScore(getVal(p.structural?.hvacType) ? 'GOOD' : null),
      foundation: conditionToScore(getVal(p.structural?.foundation)),
      kitchen: conditionToScore(getVal(p.structural?.kitchenFeatures) ? 'GOOD' : null),
      interior: conditionToScore(getVal(p.structural?.interiorCondition)),
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  const data = {
    labels: ['Roof', 'HVAC', 'Foundation', 'Kitchen', 'Interior'],
    datasets: propertyData.map((prop) => ({
      label: prop.label,
      data: [prop.roof, prop.hvac, prop.foundation, prop.kitchen, prop.interior],
      backgroundColor: prop.color.rgba(0.2),
      borderColor: prop.color.hex,
      borderWidth: 2,
      pointBackgroundColor: prop.color.hex,
      pointBorderColor: '#fff',
      pointRadius: 4,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(255,255,255,0.1)' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        pointLabels: { color: '#FFFFFF', font: { size: 10, weight: 'bold' as const } },
        ticks: { color: '#9CA3AF', backdropColor: 'transparent', stepSize: 25 },
        suggestedMin: 0,
        suggestedMax: 100,
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
    },
  };

  return (
    <GlassChart
      title="Systems Health Radar"
      description={`Comparing ${propertyData.length} properties`}
      chartId="E-systems-radar"
      color={PROPERTY_COLORS.P1.hex}
      webAugmented
      webSource="Permit history"
    >
      <Radar data={data} options={options} />
    </GlassChart>
  );
}

// E-2: Age Condition Trend
function AgeConditionTrend({ properties }: CategoryEProps) {
  const currentYear = new Date().getFullYear();
  const points = properties.map(p => {
    const yearBuilt = getVal(p.details?.yearBuilt) || currentYear;
    const age = currentYear - yearBuilt;
    const condition = conditionToScore(getVal(p.structural?.interiorCondition));
    return { age, condition };
  }).sort((a, b) => a.age - b.age);

  // Group by decade for trend
  const decades = new Map<number, number[]>();
  points.forEach(p => {
    const decade = Math.floor(p.age / 10) * 10;
    if (!decades.has(decade)) decades.set(decade, []);
    decades.get(decade)!.push(p.condition);
  });

  const trendData = Array.from(decades.entries())
    .map(([decade, conditions]) => ({
      decade,
      avgCondition: conditions.reduce((a, b) => a + b, 0) / conditions.length,
    }))
    .sort((a, b) => a.decade - b.decade);

  const data = {
    labels: trendData.map(d => `${d.decade}yr`),
    datasets: [{
      label: 'Avg Condition',
      data: trendData.map(d => d.avgCondition),
      borderColor: '#00D9FF',
      backgroundColor: 'rgba(0, 217, 255, 0.1)',
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
        ticks: { color: '#9CA3AF' },
        min: 0,
        max: 100,
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <GlassChart
      title="Age vs Condition"
      description="Degradation trend by property age"
      chartId="E-age-condition"
      color="#00D9FF"
    >
      {trendData.length > 0 ? (
        <Line data={data} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          No age/condition data
        </div>
      )}
    </GlassChart>
  );
}

// E-3: Replacement Horizon Bars - Show first 3 properties with P1/P2/P3 colors
function ReplacementBars({ properties }: CategoryEProps) {
  const currentYear = new Date().getFullYear();

  // Estimate years left based on typical lifespans
  const lifespans = { roof: 25, hvac: 15, waterHeater: 12 };

  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const estimates = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const roofAge = getVal(p.structural?.roofAgeEst);
    const hvacAge = getVal(p.structural?.hvacAge);
    const yearBuilt = getVal(p.details?.yearBuilt) || currentYear - 20;
    const age = currentYear - yearBuilt;
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    return {
      id: p.id,
      address: address.slice(0, 12),
      roofYearsLeft: Math.max(lifespans.roof - (roofAge ? parseInt(roofAge) : age), 0),
      hvacYearsLeft: Math.max(lifespans.hvac - (hvacAge ? parseInt(hvacAge) : Math.min(age, 15)), 0),
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  return (
    <GlassChart
      title="Replacement Horizon"
      description={`Years until replacement for ${estimates.length} properties`}
      chartId="E-replacement"
      color={PROPERTY_COLORS.P3.hex}
    >
      <div className="h-full flex flex-col justify-center space-y-4 px-2">
        {estimates.map((est, i) => (
          <motion.div
            key={est.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="space-y-1"
          >
            <div
              className="text-xs font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
              style={{ color: est.color.hex }}
            >
              P{est.propertyNum}: {est.address}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-300">Roof</span>
                  <span
                    className="font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                    style={{ color: est.color.hex }}
                  >
                    {est.roofYearsLeft}yr
                  </span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((est.roofYearsLeft / 25) * 100, 100)}%` }}
                    transition={{ duration: 0.6, delay: i * 0.15 }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${est.color.rgba(0.4)}, ${est.color.hex})`,
                      boxShadow: `0 0 6px ${est.color.rgba(0.5)}`,
                    }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-300">HVAC</span>
                  <span
                    className="font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                    style={{ color: est.color.hex }}
                  >
                    {est.hvacYearsLeft}yr
                  </span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((est.hvacYearsLeft / 15) * 100, 100)}%` }}
                    transition={{ duration: 0.6, delay: i * 0.15 }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${est.color.rgba(0.4)}, ${est.color.hex})`,
                      boxShadow: `0 0 6px ${est.color.rgba(0.5)}`,
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {estimates.length === 0 && (
          <div className="text-gray-300 font-medium text-sm text-center drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">No system data</div>
        )}

        {/* Legend */}
        <div className="flex justify-center gap-4 pt-2 border-t border-white/10">
          {estimates.map((est) => (
            <div key={est.id} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: est.color.hex, boxShadow: `0 0 6px ${est.color.hex}` }}
              />
              <span className="text-xs text-gray-300 font-medium">P{est.propertyNum}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassChart>
  );
}

export default function CategoryE({ properties, onPropertyClick }: CategoryEProps) {
  return (
    <>
      <SystemsRadar properties={properties} />
      <AgeConditionTrend properties={properties} />
      <ReplacementBars properties={properties} onPropertyClick={onPropertyClick} />
    </>
  );
}
