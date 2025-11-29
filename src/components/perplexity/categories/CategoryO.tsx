/**
 * Category O: Environment & Risk (14 fields)
 * Charts:
 * 1. 14-RISK CONSTELLATION - Multi-axis star chart
 * 2. RISK→REWARD MATRIX - Scatter with quadrants
 * 3. ENV GAUGES - Air/Solar/Water quality gauges
 */

import { motion } from 'framer-motion';
import { Radar, Scatter } from 'react-chartjs-2';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';
import { Wind, Sun, Droplets } from 'lucide-react';
import { getIndexColor, INDEX_COLORS, PROPERTY_COLORS, getPropertyColor } from '../chartColors';

interface CategoryOProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

function riskToScore(risk: string | null): number {
  if (!risk) return 50;
  const r = risk.toUpperCase();
  if (r.includes('MINIMAL') || r.includes('LOW') || r === 'NONE') return 90;
  if (r.includes('MODERATE') || r.includes('MEDIUM')) return 60;
  if (r.includes('HIGH') || r.includes('SEVERE')) return 30;
  return 50;
}

// O-1: 14-Risk Constellation Radar - Show first 3 properties with P1/P2/P3 colors
function RiskConstellation({ properties }: CategoryOProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const propertyData = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;
    const aqiStr = getVal(p.utilities?.airQualityIndexCurrent);
    const aqi = aqiStr ? parseInt(aqiStr) : null;
    const noiseStr = getVal(p.utilities?.noiseLevelDbEst);
    const noise = noiseStr ? parseInt(noiseStr) : null;

    return {
      id: p.id,
      label: `P${idx + 1}: ${address.slice(0, 12)}`,
      flood: riskToScore(getVal(p.utilities?.floodZone)),
      fire: riskToScore(getVal(p.utilities?.wildfireRisk)),
      earthquake: riskToScore(getVal(p.utilities?.earthquakeRisk)),
      hurricane: riskToScore(getVal(p.utilities?.hurricaneRisk)),
      tornado: riskToScore(getVal(p.utilities?.tornadoRisk)),
      airQuality: aqi ? Math.max(0, 100 - aqi) : 70,
      noise: noise ? Math.max(0, 100 - (noise - 30)) : 70,
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  const data = {
    labels: ['Flood', 'Fire', 'Earthquake', 'Hurricane', 'Tornado', 'Air Quality', 'Noise'],
    datasets: propertyData.map((prop) => ({
      label: prop.label,
      data: [prop.flood, prop.fire, prop.earthquake, prop.hurricane, prop.tornado, prop.airQuality, prop.noise],
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
        pointLabels: { color: '#FFFFFF', font: { size: 9, weight: 'bold' as const } },
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
      title="Risk Constellation"
      description={`7-axis risk for ${propertyData.length} properties`}
      chartId="O-risk-constellation"
      color={PROPERTY_COLORS.P1.hex}
      webAugmented
      webSource="FEMA, EPA"
    >
      <Radar data={data} options={options} />
    </GlassChart>
  );
}

// O-2: Risk Reward Matrix Scatter - Show first 3 properties with P1/P2/P3 colors
function RiskRewardMatrix({ properties }: CategoryOProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const points = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    // Calculate composite risk score (lower is riskier)
    const floodScore = riskToScore(getVal(p.utilities?.floodZone));
    const fireScore = riskToScore(getVal(p.utilities?.wildfireRisk));
    const avgRisk = (floodScore + fireScore) / 2;

    // Reward = cap rate or rental yield
    const capRate = getVal(p.financial?.capRateEst) || 0;
    const rentalYield = getVal(p.financial?.rentalYieldEst) || capRate;
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    return {
      id: p.id,
      x: avgRisk, // Higher = safer
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
        title: { display: true, text: 'Yield %', color: '#E5E7EB', font: { weight: 'bold' as const } },
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
          label: (ctx: any) => `Safety: ${ctx.raw.x.toFixed(0)}, Yield: ${ctx.raw.y.toFixed(1)}%`,
        },
      },
    },
  };

  // Quadrant labels using INDEX colors
  const quadrantLabels = [
    { label: 'Safe & High Yield', x: '75%', y: '25%', color: INDEX_COLORS.GREEN.hex },
    { label: 'Safe & Low Yield', x: '75%', y: '75%', color: INDEX_COLORS.BLUE.hex },
    { label: 'Risky & High Yield', x: '25%', y: '25%', color: INDEX_COLORS.ORANGE.hex },
    { label: 'Risky & Low Yield', x: '25%', y: '75%', color: INDEX_COLORS.RED.hex },
  ];

  return (
    <GlassChart
      title="Risk-Reward Matrix"
      description={`Safety vs yield for ${points.length} properties`}
      chartId="O-risk-reward"
      color={PROPERTY_COLORS.P2.hex}
    >
      <div className="relative h-full">
        {points.length > 0 ? (
          <>
            <Scatter data={data} options={options} />
            {/* Quadrant labels overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {quadrantLabels.map((q, i) => (
                <div
                  key={i}
                  className="absolute text-xs opacity-40"
                  style={{ left: q.x, top: q.y, color: q.color, transform: 'translate(-50%, -50%)' }}
                >
                  {q.label}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
            No risk/yield data
          </div>
        )}
      </div>
    </GlassChart>
  );
}

// O-3: Environment Gauges (Air/Solar/Water)
function EnvironmentGauges({ properties }: CategoryOProps) {
  const envData = properties.reduce((acc, p) => {
    const aqiStr = getVal(p.utilities?.airQualityIndexCurrent);
    const aqi = aqiStr ? parseInt(aqiStr) : null;
    const solarStr = getVal(p.utilities?.solarPotential);
    const solar = solarStr ? parseFloat(solarStr) : null;
    const noiseStr = getVal(p.utilities?.noiseLevelDbEst);
    const noise = noiseStr ? parseInt(noiseStr) : null;

    if (aqi) acc.air += Math.max(0, 100 - aqi); // Lower AQI is better
    if (solar) acc.solar += Math.min(solar * 20, 100); // Scale solar to 0-100
    if (noise) acc.water += Math.max(0, 100 - (noise - 30)); // Use noise as proxy for tranquility

    acc.count++;
    return acc;
  }, { air: 0, solar: 0, water: 0, count: 0 });

  const count = envData.count || 1;

  const gauges = [
    {
      label: 'Air Quality',
      value: Math.round(envData.air / count) || 75,
      icon: Wind,
      color: '#10B981',
      description: 'AQI-based score',
    },
    {
      label: 'Solar Potential',
      value: Math.round(envData.solar / count) || 80,
      icon: Sun,
      color: '#F59E0B',
      description: 'kWh/sqft potential',
    },
    {
      label: 'Tranquility',
      value: Math.round(envData.water / count) || 70,
      icon: Droplets,
      color: '#00D9FF',
      description: 'Noise level score',
    },
  ];

  return (
    <GlassChart
      title="Environment Gauges"
      description="Air / Solar / Tranquility"
      chartId="O-env-gauges"
      color="#10B981"
      webAugmented
      webSource="EPA, NREL"
    >
      <div className="h-full flex items-center justify-around">
        {gauges.map((gauge, i) => {
          const Icon = gauge.icon;
          const circumference = 2 * Math.PI * 32;
          const strokeDashoffset = circumference - (gauge.value / 100) * circumference;

          return (
            <motion.div
              key={gauge.label}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="6"
                  />
                  <motion.circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="none"
                    stroke={gauge.color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, delay: i * 0.2 }}
                    style={{ filter: `drop-shadow(0 0 10px ${gauge.color})` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Icon className="w-5 h-5 mb-1" style={{ color: gauge.color }} />
                  <span className="text-white font-bold text-lg drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]">{gauge.value}</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xs text-white font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]">{gauge.label}</div>
                <div className="text-xs text-gray-400 font-medium drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">{gauge.description}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassChart>
  );
}

export default function CategoryO({ properties, onPropertyClick }: CategoryOProps) {
  return (
    <>
      <RiskConstellation properties={properties} />
      <RiskRewardMatrix properties={properties} onPropertyClick={onPropertyClick} />
      <EnvironmentGauges properties={properties} />
    </>
  );
}
