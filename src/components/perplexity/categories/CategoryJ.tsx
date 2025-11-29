/**
 * Category J: Location Scores (9 fields)
 * Charts:
 * 1. EXCELLENCE SPIDER - 9 axes radar
 * 2. 9-GAUGE CLUSTER - Mini neon rings 3x3 grid
 * 3. LOCATION→YIELD SCATTER - Avg score vs cap rate
 */

import { motion } from 'framer-motion';
import { Radar, Scatter } from 'react-chartjs-2';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';

interface CategoryJProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

// J-1: Location Excellence Spider
function LocationExcellenceSpider({ properties }: CategoryJProps) {
  const scores = properties.reduce((acc, p) => {
    acc.walk += getVal(p.location?.walkScore) || 0;
    acc.transit += getVal(p.location?.transitScore) || 0;
    acc.bike += getVal(p.location?.bikeScore) || 0;
    acc.grocery += 100 - Math.min((getVal(p.location?.distanceGroceryMiles) || 5) * 10, 100);
    acc.hospital += 100 - Math.min((getVal(p.location?.distanceHospitalMiles) || 10) * 5, 100);
    acc.park += 100 - Math.min((getVal(p.location?.distanceParkMiles) || 3) * 20, 100);
    acc.beach += 100 - Math.min((getVal(p.location?.distanceBeachMiles) || 10) * 5, 100);
    acc.count++;
    return acc;
  }, { walk: 0, transit: 0, bike: 0, grocery: 0, hospital: 0, park: 0, beach: 0, count: 0 });

  const count = scores.count || 1;

  const data = {
    labels: ['Walk', 'Transit', 'Bike', 'Grocery', 'Hospital', 'Park', 'Beach'],
    datasets: [{
      label: 'Avg Score',
      data: [
        scores.walk / count,
        scores.transit / count,
        scores.bike / count,
        scores.grocery / count,
        scores.hospital / count,
        scores.park / count,
        scores.beach / count,
      ],
      backgroundColor: 'rgba(0, 217, 255, 0.2)',
      borderColor: '#00D9FF',
      borderWidth: 2,
      pointBackgroundColor: '#00D9FF',
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
      title="Location Excellence Spider"
      description="7-axis location quality"
      chartId="J-excellence-spider"
      color="#00D9FF"
      webAugmented
      webSource="WalkScore API"
    >
      <Radar data={data} options={options} />
    </GlassChart>
  );
}

// J-2: 9-Gauge Cluster (using 3x3 mini gauges)
function GaugeCluster({ properties }: CategoryJProps) {
  const scores = properties.reduce((acc, p) => {
    acc.walk += getVal(p.location?.walkScore) || 0;
    acc.transit += getVal(p.location?.transitScore) || 0;
    acc.bike += getVal(p.location?.bikeScore) || 0;
    acc.count++;
    return acc;
  }, { walk: 0, transit: 0, bike: 0, count: 0 });

  const count = scores.count || 1;

  const gauges = [
    { label: 'Walk', value: Math.round(scores.walk / count), color: '#10B981' },
    { label: 'Transit', value: Math.round(scores.transit / count), color: '#00D9FF' },
    { label: 'Bike', value: Math.round(scores.bike / count), color: '#8B5CF6' },
  ];

  return (
    <GlassChart
      title="Mobility Scores"
      description="Walk / Transit / Bike"
      chartId="J-gauge-cluster"
      color="#10B981"
    >
      <div className="h-full flex items-center justify-around">
        {gauges.map((gauge, i) => {
          const circumference = 2 * Math.PI * 30;
          const strokeDashoffset = circumference - (gauge.value / 100) * circumference;

          return (
            <motion.div
              key={gauge.label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="30"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="30"
                    fill="none"
                    stroke={gauge.color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, delay: i * 0.2 }}
                    style={{ filter: `drop-shadow(0 0 6px ${gauge.color})` }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{gauge.value}</span>
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

// J-3: Location Yield Scatter
function LocationYieldScatter({ properties }: CategoryJProps) {
  const points = properties.map(p => {
    const walk = getVal(p.location?.walkScore) || 0;
    const transit = getVal(p.location?.transitScore) || 0;
    const bike = getVal(p.location?.bikeScore) || 0;
    const avgScore = (walk + transit + bike) / 3;
    const capRate = getVal(p.financial?.capRateEst) || 0;

    return { id: p.id, x: avgScore, y: capRate };
  }).filter(p => p.x > 0 && p.y > 0);

  const data = {
    datasets: [{
      label: 'Properties',
      data: points.map(p => ({ x: p.x, y: p.y })),
      backgroundColor: 'rgba(245, 158, 11, 0.6)',
      borderColor: '#F59E0B',
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
        title: { display: true, text: 'Avg Location Score', color: '#9CA3AF' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#9CA3AF' },
        min: 0,
        max: 100,
      },
      y: {
        title: { display: true, text: 'Cap Rate %', color: '#9CA3AF' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#9CA3AF', callback: (v: number | string) => `${v}%` },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        callbacks: {
          label: (ctx: any) => `Score: ${ctx.raw.x.toFixed(0)}, Cap: ${ctx.raw.y.toFixed(1)}%`,
        },
      },
    },
  };

  return (
    <GlassChart
      title="Location vs Yield"
      description="Score correlation with cap rate"
      chartId="J-location-yield"
      color="#F59E0B"
    >
      {points.length > 0 ? (
        <Scatter data={data} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          No location/yield data
        </div>
      )}
    </GlassChart>
  );
}

export default function CategoryJ({ properties, onPropertyClick }: CategoryJProps) {
  return (
    <>
      <LocationExcellenceSpider properties={properties} />
      <GaugeCluster properties={properties} />
      <LocationYieldScatter properties={properties} onPropertyClick={onPropertyClick} />
    </>
  );
}
