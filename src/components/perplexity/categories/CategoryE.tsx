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

// E-1: Systems Health Radar
function SystemsRadar({ properties }: CategoryEProps) {
  // Average condition scores across properties
  const scores = properties.reduce((acc, p) => {
    acc.roof += conditionToScore(getVal(p.structural?.roofType));
    acc.hvac += conditionToScore(getVal(p.structural?.hvacType) ? 'GOOD' : null);
    acc.foundation += conditionToScore(getVal(p.structural?.foundation));
    acc.kitchen += conditionToScore(getVal(p.structural?.kitchenFeatures) ? 'GOOD' : null);
    acc.interior += conditionToScore(getVal(p.structural?.interiorCondition));
    acc.count++;
    return acc;
  }, { roof: 0, hvac: 0, foundation: 0, kitchen: 0, interior: 0, count: 0 });

  const count = scores.count || 1;

  const data = {
    labels: ['Roof', 'HVAC', 'Foundation', 'Kitchen', 'Interior'],
    datasets: [{
      label: 'Avg Condition',
      data: [
        scores.roof / count,
        scores.hvac / count,
        scores.foundation / count,
        scores.kitchen / count,
        scores.interior / count,
      ],
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      borderColor: '#10B981',
      borderWidth: 2,
      pointBackgroundColor: '#10B981',
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(255,255,255,0.1)' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        pointLabels: { color: '#FFFFFF', font: { size: 10 } },
        ticks: { color: '#9CA3AF', backdropColor: 'transparent', stepSize: 25 },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <GlassChart
      title="Systems Health Radar"
      description="Condition scores by component"
      chartId="E-systems-radar"
      color="#10B981"
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

// E-3: Replacement Horizon Bars
function ReplacementBars({ properties }: CategoryEProps) {
  const currentYear = new Date().getFullYear();

  // Estimate years left based on typical lifespans
  const lifespans = { roof: 25, hvac: 15, waterHeater: 12 };

  const estimates = properties.slice(0, 5).map(p => {
    const roofAge = getVal(p.structural?.roofAgeEst);
    const hvacAge = getVal(p.structural?.hvacAge);
    const yearBuilt = getVal(p.details?.yearBuilt) || currentYear - 20;
    const age = currentYear - yearBuilt;

    return {
      id: p.id,
      address: getVal(p.address?.streetAddress)?.slice(0, 10) || `#${p.id.slice(0, 4)}`,
      roofYearsLeft: Math.max(lifespans.roof - (roofAge ? parseInt(roofAge) : age), 0),
      hvacYearsLeft: Math.max(lifespans.hvac - (hvacAge ? parseInt(hvacAge) : Math.min(age, 15)), 0),
    };
  });

  return (
    <GlassChart
      title="Replacement Horizon"
      description="Estimated years until replacement"
      chartId="E-replacement"
      color="#F59E0B"
    >
      <div className="h-full flex flex-col justify-center space-y-3 px-2">
        {estimates.map((est, i) => (
          <motion.div
            key={est.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="space-y-1"
          >
            <div className="text-xs text-gray-300 font-medium drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">{est.address}</div>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-orange-400">Roof</span>
                  <span className="text-white font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]">{est.roofYearsLeft}yr</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${Math.min((est.roofYearsLeft / 25) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-yellow-400">HVAC</span>
                  <span className="text-white font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]">{est.hvacYearsLeft}yr</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${Math.min((est.hvacYearsLeft / 15) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {estimates.length === 0 && (
          <div className="text-gray-300 font-medium text-sm text-center drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">No system data</div>
        )}
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
