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
import { PROPERTY_COLORS, getPropertyColor, calcPricePerSqft } from '../chartColors';

interface CategoryKProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

// K-1: Commute Compass Radar - Show first 3 properties with P1/P2/P3 colors
function CommuteCompass({ properties }: CategoryKProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const propertyData = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;
    const commute = getVal(p.location?.commuteTimeCityCenter);

    return {
      id: p.id,
      label: `P${idx + 1}: ${address.slice(0, 12)}`,
      city: Math.max(0, 100 - ((commute ? parseInt(commute) || 20 : 20) * 2)),
      school: Math.max(0, 100 - ((getVal(p.location?.elementaryDistanceMiles) || 2) * 20)),
      hospital: Math.max(0, 100 - ((getVal(p.location?.distanceHospitalMiles) || 5) * 5)),
      grocery: Math.max(0, 100 - ((getVal(p.location?.distanceGroceryMiles) || 2) * 20)),
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  const data = {
    labels: ['City Center', 'Schools', 'Hospital', 'Grocery'],
    datasets: propertyData.map((prop) => ({
      label: prop.label,
      data: [prop.city, prop.school, prop.hospital, prop.grocery],
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
      title="Commute Compass"
      description={`Proximity scores for ${propertyData.length} properties`}
      chartId="K-commute-compass"
      color={PROPERTY_COLORS.P1.hex}
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

// K-3: Proximity Price Scatter - Show first 3 properties with P1/P2/P3 colors
function ProximityPriceScatter({ properties }: CategoryKProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const points = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const grocery = getVal(p.location?.distanceGroceryMiles) || 0;
    const hospital = getVal(p.location?.distanceHospitalMiles) || 0;
    const avgDist = (grocery + hospital) / 2;
    const pps = calcPricePerSqft(
      getVal(p.address?.pricePerSqft),
      getVal(p.address?.listingPrice),
      getVal(p.details?.livingSqft)
    );
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    return {
      id: p.id,
      x: avgDist,
      y: pps,
      color: propColor,
      propertyNum: idx + 1,
      address: address.slice(0, 15),
    };
  }).filter(p => p.x > 0 && p.y > 0);

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
        title: { display: true, text: 'Avg Distance (mi)', color: '#E5E7EB', font: { weight: 'bold' as const } },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#E5E7EB', font: { weight: 'bold' as const } },
      },
      y: {
        title: { display: true, text: '$/sqft', color: '#E5E7EB', font: { weight: 'bold' as const } },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#E5E7EB', font: { weight: 'bold' as const }, callback: (v: number | string) => `$${v}` },
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
      },
    },
  };

  return (
    <GlassChart
      title="Proximity vs Price"
      description={`Distance impact for ${points.length} properties`}
      chartId="K-proximity-price"
      color={PROPERTY_COLORS.P2.hex}
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
