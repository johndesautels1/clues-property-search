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
import { getIndexColor, INDEX_COLORS, PROPERTY_COLORS } from '../chartColors';

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

// O-1: 14-Risk Constellation Radar
function RiskConstellation({ properties }: CategoryOProps) {
  const risks = properties.reduce((acc, p) => {
    acc.flood += riskToScore(getVal(p.utilities?.floodZone));
    acc.fire += riskToScore(getVal(p.utilities?.wildfireRisk));
    acc.earthquake += riskToScore(getVal(p.utilities?.earthquakeRisk));
    acc.hurricane += riskToScore(getVal(p.utilities?.hurricaneRisk));
    acc.tornado += riskToScore(getVal(p.utilities?.tornadoRisk));
    // Air quality from utilities
    const aqiStr = getVal(p.utilities?.airQualityIndexCurrent);
    const aqi = aqiStr ? parseInt(aqiStr) : null;
    acc.airQuality += aqi ? Math.max(0, 100 - aqi) : 70;
    // Noise level from utilities
    const noiseStr = getVal(p.utilities?.noiseLevelDbEst);
    const noise = noiseStr ? parseInt(noiseStr) : null;
    acc.noise += noise ? Math.max(0, 100 - (noise - 30)) : 70;
    acc.count++;
    return acc;
  }, { flood: 0, fire: 0, earthquake: 0, hurricane: 0, tornado: 0, airQuality: 0, noise: 0, count: 0 });

  const count = risks.count || 1;

  const data = {
    labels: ['Flood', 'Fire', 'Earthquake', 'Hurricane', 'Tornado', 'Air Quality', 'Noise'],
    datasets: [{
      label: 'Risk Score',
      data: [
        risks.flood / count,
        risks.fire / count,
        risks.earthquake / count,
        risks.hurricane / count,
        risks.tornado / count,
        risks.airQuality / count,
        risks.noise / count,
      ],
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      borderColor: '#EF4444',
      borderWidth: 2,
      pointBackgroundColor: '#EF4444',
      pointBorderColor: '#fff',
      pointRadius: 4,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(255,255,255,0.1)' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        pointLabels: { color: '#FFFFFF', font: { size: 9 } },
        ticks: { color: '#9CA3AF', backdropColor: 'transparent', stepSize: 25 },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    plugins: { legend: { display: false } },
  };

  return (
    <GlassChart
      title="Risk Constellation"
      description="7-axis environmental risk radar"
      chartId="O-risk-constellation"
      color="#EF4444"
      webAugmented
      webSource="FEMA, EPA"
    >
      <Radar data={data} options={options} />
    </GlassChart>
  );
}

// O-2: Risk Reward Matrix Scatter
function RiskRewardMatrix({ properties }: CategoryOProps) {
  const points = properties.map(p => {
    // Calculate composite risk score (lower is riskier)
    const floodScore = riskToScore(getVal(p.utilities?.floodZone));
    const fireScore = riskToScore(getVal(p.utilities?.wildfireRisk));
    const avgRisk = (floodScore + fireScore) / 2;

    // Reward = cap rate or rental yield
    const capRate = getVal(p.financial?.capRateEst) || 0;
    const rentalYield = getVal(p.financial?.rentalYieldEst) || capRate;

    return {
      id: p.id,
      x: avgRisk, // Higher = safer
      y: rentalYield,
      price: getVal(p.address?.listingPrice) || 1000000,
    };
  }).filter(p => p.y > 0);

  const data = {
    datasets: [{
      label: 'Properties',
      data: points.map(p => ({ x: p.x, y: p.y })),
      backgroundColor: points.map(p => {
        // Color by quadrant using INDEX colors
        if (p.x >= 60 && p.y >= 5) return INDEX_COLORS.GREEN.rgba(0.7); // High safety, high yield = green
        if (p.x >= 60 && p.y < 5) return INDEX_COLORS.BLUE.rgba(0.7); // High safety, low yield = blue
        if (p.x < 60 && p.y >= 5) return INDEX_COLORS.ORANGE.rgba(0.7); // Low safety, high yield = orange
        return INDEX_COLORS.RED.rgba(0.7); // Low safety, low yield = red
      }),
      borderColor: '#fff',
      borderWidth: 1,
      pointRadius: 10,
      pointHoverRadius: 14,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: 'Safety Score', color: '#9CA3AF' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#9CA3AF' },
        min: 0,
        max: 100,
      },
      y: {
        title: { display: true, text: 'Yield %', color: '#9CA3AF' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#9CA3AF', callback: (v: number | string) => `${v}%` },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
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
      description="Safety vs yield quadrants"
      chartId="O-risk-reward"
      color="#F59E0B"
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
