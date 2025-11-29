/**
 * Category K: Distances & Amenities (5 fields)
 * Charts:
 * 1. COMMUTE COMPASS - City/Elem/Transit arrows
 * 2. ACCESS TILES - Icon cards with times
 * 3. PROXIMITY→PRICE SCATTER - Avg commute vs $/sqft
 */

import { motion } from 'framer-motion';
import { Radar, Scatter } from 'react-chartjs-2';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';
import { Building2, GraduationCap, Train, Heart, ShoppingBag } from 'lucide-react';

interface CategoryKProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

// K-1: Commute Compass Radar
function CommuteCompass({ properties }: CategoryKProps) {
  const distances = properties.reduce((acc, p) => {
    const commute = getVal(p.location?.commuteTimeCityCenter);
    acc.city += commute ? parseInt(commute) || 20 : 20;
    acc.school += getVal(p.location?.elementaryDistanceMiles) || 2;
    acc.hospital += getVal(p.location?.distanceHospitalMiles) || 5;
    acc.grocery += getVal(p.location?.distanceGroceryMiles) || 2;
    acc.count++;
    return acc;
  }, { city: 0, school: 0, hospital: 0, grocery: 0, count: 0 });

  const count = distances.count || 1;

  // Convert to proximity scores (lower distance = higher score)
  const data = {
    labels: ['City Center', 'Schools', 'Hospital', 'Grocery'],
    datasets: [{
      label: 'Proximity Score',
      data: [
        Math.max(0, 100 - (distances.city / count) * 2),
        Math.max(0, 100 - (distances.school / count) * 20),
        Math.max(0, 100 - (distances.hospital / count) * 5),
        Math.max(0, 100 - (distances.grocery / count) * 20),
      ],
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      borderColor: '#8B5CF6',
      borderWidth: 2,
      pointBackgroundColor: '#8B5CF6',
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
    plugins: { legend: { display: false } },
  };

  return (
    <GlassChart
      title="Commute Compass"
      description="Proximity to key destinations"
      chartId="K-commute-compass"
      color="#8B5CF6"
    >
      <Radar data={data} options={options} />
    </GlassChart>
  );
}

// K-2: Access Tiles
function AccessTiles({ properties }: CategoryKProps) {
  const avgDistances = properties.reduce((acc, p) => {
    acc.grocery += getVal(p.location?.distanceGroceryMiles) || 0;
    acc.hospital += getVal(p.location?.distanceHospitalMiles) || 0;
    acc.airport += getVal(p.location?.distanceAirportMiles) || 0;
    acc.park += getVal(p.location?.distanceParkMiles) || 0;
    acc.beach += getVal(p.location?.distanceBeachMiles) || 0;
    acc.count++;
    return acc;
  }, { grocery: 0, hospital: 0, airport: 0, park: 0, beach: 0, count: 0 });

  const count = avgDistances.count || 1;

  const tiles = [
    { label: 'Grocery', value: avgDistances.grocery / count, icon: ShoppingBag, color: '#10B981' },
    { label: 'Hospital', value: avgDistances.hospital / count, icon: Heart, color: '#EF4444' },
    { label: 'Transit', value: 5, icon: Train, color: '#00D9FF' },
    { label: 'School', value: 2, icon: GraduationCap, color: '#8B5CF6' },
  ];

  return (
    <GlassChart
      title="Access Tiles"
      description="Distance to amenities"
      chartId="K-access-tiles"
      color="#10B981"
    >
      <div className="h-full grid grid-cols-2 gap-2 p-1">
        {tiles.map((tile, i) => {
          const Icon = tile.icon;
          const timeMin = Math.round(tile.value * 3); // ~3 min per mile

          return (
            <motion.div
              key={tile.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-3 rounded-xl flex flex-col items-center justify-center"
              style={{
                background: `${tile.color}15`,
                border: `1px solid ${tile.color}30`,
              }}
            >
              <Icon className="w-6 h-6 mb-1" style={{ color: tile.color }} />
              <div className="text-lg font-bold text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]">{tile.value.toFixed(1)}mi</div>
              <div className="text-xs text-gray-300 font-medium drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">{tile.label}</div>
              <div className="text-xs mt-1" style={{ color: tile.color }}>~{timeMin} min</div>
            </motion.div>
          );
        })}
      </div>
    </GlassChart>
  );
}

// K-3: Proximity Price Scatter
function ProximityPriceScatter({ properties }: CategoryKProps) {
  const points = properties.map(p => {
    const grocery = getVal(p.location?.distanceGroceryMiles) || 0;
    const hospital = getVal(p.location?.distanceHospitalMiles) || 0;
    const avgDist = (grocery + hospital) / 2;
    const pps = getVal(p.address?.pricePerSqft) || 0;

    return { id: p.id, x: avgDist, y: pps };
  }).filter(p => p.x > 0 && p.y > 0);

  const data = {
    datasets: [{
      label: 'Properties',
      data: points.map(p => ({ x: p.x, y: p.y })),
      backgroundColor: 'rgba(0, 217, 255, 0.6)',
      borderColor: '#00D9FF',
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
        title: { display: true, text: 'Avg Distance (mi)', color: '#9CA3AF' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#9CA3AF' },
      },
      y: {
        title: { display: true, text: '$/sqft', color: '#9CA3AF' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#9CA3AF', callback: (v: number | string) => `$${v}` },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(0,0,0,0.8)' },
    },
  };

  return (
    <GlassChart
      title="Proximity vs Price"
      description="Distance impact on $/sqft"
      chartId="K-proximity-price"
      color="#00D9FF"
    >
      {points.length > 0 ? (
        <Scatter data={data} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          No proximity data
        </div>
      )}
    </GlassChart>
  );
}

export default function CategoryK({ properties, onPropertyClick }: CategoryKProps) {
  return (
    <>
      <CommuteCompass properties={properties} />
      <AccessTiles properties={properties} />
      <ProximityPriceScatter properties={properties} onPropertyClick={onPropertyClick} />
    </>
  );
}
