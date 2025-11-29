/**
 * Category E: Structure & Systems (10 fields)
 * Charts:
 * 1. SYSTEMS RADAR - 8pt star: Roof/HVAC/Foundation
 * 2. AGE→CONDITION TREND - Degradation curve
 * 3. REPLACEMENT BARS - Years left for Roof/HVAC
 */

import { motion } from 'framer-motion';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';
import { getIndexColor, PROPERTY_COLORS, getPropertyColor } from '../chartColors';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler);

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
// Aligned with standard inspection and construction practice categories
function SystemsRadar({ properties }: CategoryEProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  // Check if any property has a pool (to conditionally show Pool/Spa axis)
  const anyHasPool = comparisonProperties.some(p => {
    const poolYn = getVal(p.structural?.poolYn);
    const poolType = getVal(p.structural?.poolType);
    return poolYn === true || (poolType && poolType !== 'None');
  });

  const propertyData = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    // Determine pool status for this property
    const poolYn = getVal(p.structural?.poolYn);
    const poolType = getVal(p.structural?.poolType);
    const hasPool = poolYn === true || (poolType && poolType !== 'None');

    return {
      id: p.id,
      label: `P${idx + 1}: ${address.slice(0, 12)}`,
      // Core inspection categories
      roof: conditionToScore(getVal(p.structural?.roofType) ? 'GOOD' : getVal(p.structural?.roofAgeEst) ? 'FAIR' : null),
      foundation: conditionToScore(getVal(p.structural?.foundation)),
      electrical: conditionToScore(getVal(p.utilities?.electricProvider) ? 'GOOD' : null), // Infer from utility data
      plumbing: conditionToScore(getVal(p.utilities?.waterProvider) ? 'GOOD' : null), // Infer from utility data
      hvac: conditionToScore(getVal(p.structural?.hvacType) ? 'GOOD' : getVal(p.structural?.hvacAge) ? 'FAIR' : null),
      windowsExterior: conditionToScore(getVal(p.structural?.exteriorMaterial) ? 'GOOD' : null),
      poolSpa: hasPool ? conditionToScore('GOOD') : 0, // Only score if pool exists
      hasPool,
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  // Build labels and data arrays - Pool/Spa only included if any property has one
  const baseLabels = ['Roof', 'Foundation', 'Electrical', 'Plumbing', 'HVAC', 'Windows/Doors'];
  const labels = anyHasPool ? [...baseLabels, 'Pool/Spa'] : baseLabels;

  const data = {
    labels,
    datasets: propertyData.map((prop) => {
      const baseData = [prop.roof, prop.foundation, prop.electrical, prop.plumbing, prop.hvac, prop.windowsExterior];
      const chartData = anyHasPool ? [...baseData, prop.poolSpa] : baseData;

      return {
        label: prop.label,
        data: chartData,
        backgroundColor: prop.color.rgba(0.2),
        borderColor: prop.color.hex,
        borderWidth: 2,
        pointBackgroundColor: prop.color.hex,
        pointBorderColor: '#fff',
        pointRadius: 4,
      };
    }),
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
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0">
          <Radar data={data} options={options} />
        </div>
        {/* Property legend */}
        <div className="flex justify-center gap-4 pt-1">
          {propertyData.map((prop) => (
            <div key={prop.id} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: prop.color.hex, boxShadow: `0 0 6px ${prop.color.hex}` }}
              />
              <span className="text-[9px] text-gray-300 font-medium">{prop.label}</span>
            </div>
          ))}
        </div>
        {/* Scale legend */}
        <div className="mt-1 pt-1 border-t border-white/10 flex justify-center items-center gap-4 text-[9px] text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>0 = End of life</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>50 = Fair</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>100 = Excellent</span>
          </div>
        </div>
      </div>
    </GlassChart>
  );
}

// E-2: Interior Condition - Kitchen, Baths, Living Areas, Bedrooms, Flooring
function InteriorCondition({ properties }: CategoryEProps) {
  const currentYear = new Date().getFullYear();
  const comparisonProperties = properties.slice(0, 3);

  // Interior components to evaluate
  const interiorComponents = [
    { key: 'kitchen', label: 'Kitchen' },
    { key: 'baths', label: 'Baths' },
    { key: 'living', label: 'Living Areas' },
    { key: 'flooring', label: 'Flooring' },
    { key: 'interior', label: 'Overall' },
  ];

  const propertyData = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;
    const yearBuilt = getVal(p.details?.yearBuilt);
    const age = yearBuilt ? currentYear - yearBuilt : null;

    // Score each interior component
    const scores = {
      kitchen: conditionToScore(getVal(p.structural?.kitchenFeatures) ? 'GOOD' : null),
      baths: conditionToScore(getVal(p.details?.fullBathrooms) ? 'GOOD' : null),
      living: conditionToScore(getVal(p.structural?.interiorCondition)),
      flooring: conditionToScore(getVal(p.structural?.flooringType) ? 'GOOD' : null),
      interior: conditionToScore(getVal(p.structural?.interiorCondition)),
    };

    const avgScore = Math.round(
      Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
    );

    return {
      id: p.id,
      label: `P${idx + 1}`,
      address: address.slice(0, 15),
      age,
      scores,
      avgScore,
      color: propColor,
    };
  });

  return (
    <GlassChart
      title="Interior Condition"
      description="Kitchen, Baths, Living Areas, Flooring"
      chartId="E-interior-condition"
      color="#00D9FF"
    >
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-auto">
          {/* Header row */}
          <div className="grid grid-cols-6 gap-1 text-[8px] text-gray-400 font-bold mb-1 px-1">
            <div>Property</div>
            {interiorComponents.map(c => (
              <div key={c.key} className="text-center">{c.label}</div>
            ))}
          </div>

          {/* Property rows */}
          {propertyData.map((prop, i) => (
            <motion.div
              key={prop.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="grid grid-cols-6 gap-1 mb-2 px-1"
            >
              {/* Property info */}
              <div className="flex flex-col">
                <span
                  className="text-[9px] font-bold truncate drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]"
                  style={{ color: prop.color.hex }}
                >
                  {prop.label}: {prop.address}
                </span>
                <span className="text-[8px] text-gray-500">
                  {prop.age ? `${prop.age}yr old` : 'Age N/A'}
                </span>
              </div>

              {/* Score bars for each component */}
              {interiorComponents.map(c => {
                const score = prop.scores[c.key as keyof typeof prop.scores];
                const barColor = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
                return (
                  <div key={c.key} className="flex flex-col items-center">
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: barColor }}
                      />
                    </div>
                    <span className="text-[8px] text-gray-400 mt-0.5">{score}</span>
                  </div>
                );
              })}
            </motion.div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-1 pt-1 border-t border-white/10 flex justify-center gap-3 text-[8px] text-gray-400">
          <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />75+ Good</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1" />50-74 Fair</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />&lt;50 Poor</span>
        </div>
      </div>
    </GlassChart>
  );
}

// E-2b: Exterior Condition - Foundation, Siding, Soffit/Fascia, Gutters, Driveway, Landscaping, Roof
function ExteriorCondition({ properties }: CategoryEProps) {
  const currentYear = new Date().getFullYear();
  const comparisonProperties = properties.slice(0, 3);

  // Exterior components to evaluate
  const exteriorComponents = [
    { key: 'roof', label: 'Roof' },
    { key: 'foundation', label: 'Foundation' },
    { key: 'siding', label: 'Siding' },
    { key: 'landscape', label: 'Landscape' },
    { key: 'exterior', label: 'Overall' },
  ];

  const propertyData = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;
    const yearBuilt = getVal(p.details?.yearBuilt);
    const age = yearBuilt ? currentYear - yearBuilt : null;

    // Estimate roof condition from age
    const roofAgeStr = getVal(p.structural?.roofAgeEst);
    const roofAge = roofAgeStr ? parseInt(roofAgeStr) : (age ? Math.min(age, 20) : 10);
    const roofScore = Math.max(0, 100 - (roofAge * 4)); // Loses ~4 pts per year

    // Score each exterior component
    const scores = {
      roof: getVal(p.structural?.roofType) ? roofScore : conditionToScore(null),
      foundation: conditionToScore(getVal(p.structural?.foundation)),
      siding: conditionToScore(getVal(p.structural?.exteriorMaterial) ? 'GOOD' : null),
      landscape: conditionToScore(getVal(p.structural?.landscaping) ? 'GOOD' : null),
      exterior: conditionToScore(getVal(p.structural?.exteriorMaterial) ? 'GOOD' : null),
    };

    const avgScore = Math.round(
      Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
    );

    return {
      id: p.id,
      label: `P${idx + 1}`,
      address: address.slice(0, 15),
      age,
      scores,
      avgScore,
      color: propColor,
    };
  });

  return (
    <GlassChart
      title="Exterior Condition"
      description="Roof, Foundation, Siding, Landscaping"
      chartId="E-exterior-condition"
      color="#8B5CF6"
    >
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-auto">
          {/* Header row */}
          <div className="grid grid-cols-6 gap-1 text-[8px] text-gray-400 font-bold mb-1 px-1">
            <div>Property</div>
            {exteriorComponents.map(c => (
              <div key={c.key} className="text-center">{c.label}</div>
            ))}
          </div>

          {/* Property rows */}
          {propertyData.map((prop, i) => (
            <motion.div
              key={prop.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="grid grid-cols-6 gap-1 mb-2 px-1"
            >
              {/* Property info */}
              <div className="flex flex-col">
                <span
                  className="text-[9px] font-bold truncate drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]"
                  style={{ color: prop.color.hex }}
                >
                  {prop.label}: {prop.address}
                </span>
                <span className="text-[8px] text-gray-500">
                  {prop.age ? `${prop.age}yr old` : 'Age N/A'}
                </span>
              </div>

              {/* Score bars for each component */}
              {exteriorComponents.map(c => {
                const score = prop.scores[c.key as keyof typeof prop.scores];
                const barColor = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
                return (
                  <div key={c.key} className="flex flex-col items-center">
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: barColor }}
                      />
                    </div>
                    <span className="text-[8px] text-gray-400 mt-0.5">{score}</span>
                  </div>
                );
              })}
            </motion.div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-1 pt-1 border-t border-white/10 flex justify-center gap-3 text-[8px] text-gray-400">
          <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />75+ Good</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1" />50-74 Fair</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />&lt;50 Poor</span>
        </div>
      </div>
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
      <InteriorCondition properties={properties} />
      <ExteriorCondition properties={properties} />
      <ReplacementBars properties={properties} onPropertyClick={onPropertyClick} />
    </>
  );
}
