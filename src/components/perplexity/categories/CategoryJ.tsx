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
import { getIndexColor, PROPERTY_COLORS } from '../chartColors';

interface CategoryJProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

// J-1: Location Excellence Spider - Show first 3 properties with P1/P2/P3 colors
function LocationExcellenceSpider({ properties }: CategoryJProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const propertyData = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    return {
      id: p.id,
      label: `P${idx + 1}: ${address.slice(0, 12)}`,
      walk: getVal(p.location?.walkScore) || 0,
      transit: getVal(p.location?.transitScore) || 0,
      bike: getVal(p.location?.bikeScore) || 0,
      grocery: 100 - Math.min((getVal(p.location?.distanceGroceryMiles) || 5) * 10, 100),
      hospital: 100 - Math.min((getVal(p.location?.distanceHospitalMiles) || 10) * 5, 100),
      park: 100 - Math.min((getVal(p.location?.distanceParkMiles) || 3) * 20, 100),
      beach: 100 - Math.min((getVal(p.location?.distanceBeachMiles) || 10) * 5, 100),
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  const data = {
    labels: ['Walk', 'Transit', 'Bike', 'Grocery', 'Hospital', 'Park', 'Beach'],
    datasets: propertyData.map((prop) => ({
      label: prop.label,
      data: [prop.walk, prop.transit, prop.bike, prop.grocery, prop.hospital, prop.park, prop.beach],
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
      title="Location Excellence Spider"
      description={`7-axis quality for ${propertyData.length} properties`}
      chartId="J-excellence-spider"
      color={PROPERTY_COLORS.P1.hex}
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
                  <span className="text-white font-bold text-lg drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]">{gauge.value}</span>
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

// J-3: Location Yield Scatter - Show first 3 properties with P1/P2/P3 colors
function LocationYieldScatter({ properties }: CategoryJProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const points = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const walk = getVal(p.location?.walkScore) || 0;
    const transit = getVal(p.location?.transitScore) || 0;
    const bike = getVal(p.location?.bikeScore) || 0;
    const avgScore = (walk + transit + bike) / 3;
    const capRate = getVal(p.financial?.capRateEst) || 0;
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    return {
      id: p.id,
      x: avgScore,
      y: capRate,
      color: propColor,
      propertyNum: idx + 1,
      address: address.slice(0, 15),
    };
  }).filter(p => p.x > 0);

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
        title: { display: true, text: 'Avg Location Score', color: '#E5E7EB', font: { weight: 'bold' as const } },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#E5E7EB', font: { weight: 'bold' as const } },
        min: 0,
        max: 100,
      },
      y: {
        title: { display: true, text: 'Cap Rate %', color: '#E5E7EB', font: { weight: 'bold' as const } },
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
          label: (ctx: any) => `Score: ${ctx.raw.x.toFixed(0)}, Cap: ${ctx.raw.y.toFixed(1)}%`,
        },
      },
    },
  };

  return (
    <GlassChart
      title="Location vs Yield"
      description={`Comparing ${points.length} properties`}
      chartId="J-location-yield"
      color={PROPERTY_COLORS.P3.hex}
    >
      {points.length > 0 ? (
        <Scatter data={data} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
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
