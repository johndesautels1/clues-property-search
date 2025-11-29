/**
 * Category G: Exterior Features (5 fields)
 * Charts:
 * 1. FEATURE MATRIX - Pool/Deck/EV/Beach heat grid
 * 2. CURB APPEAL RADAR - Multi-axis exterior scores
 * 3. OUTDOOR ROI BUBBLES - Feature count vs premium
 */

import { motion } from 'framer-motion';
import { Radar } from 'react-chartjs-2';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';
import { Check, X, Waves, Zap, TreeDeciduous, Car } from 'lucide-react';
import { PROPERTY_COLORS, getPropertyColor } from '../chartColors';

interface CategoryGProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

// G-1: Exterior Feature Matrix - Show first 3 properties with P1/P2/P3 colors
function ExteriorFeatureMatrix({ properties }: CategoryGProps) {
  const features = [
    { key: 'pool', label: 'Pool', icon: Waves },
    { key: 'deck', label: 'Deck', icon: TreeDeciduous },
    { key: 'ev', label: 'EV', icon: Zap },
    { key: 'garage', label: 'Gar', icon: Car },
  ];

  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const data = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;
    return {
      id: p.id,
      address: address.slice(0, 12),
      pool: getVal(p.structural?.poolYn) || false,
      deck: !!getVal(p.structural?.deckPatio),
      ev: getVal(p.utilities?.evChargingYn) === 'Yes',
      garage: (getVal(p.details?.garageSpaces) || 0) > 0,
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  return (
    <GlassChart
      title="Exterior Feature Matrix"
      description={`Outdoor amenities for ${data.length} properties`}
      chartId="G-feature-matrix"
      color={PROPERTY_COLORS.P1.hex}
    >
      <div className="h-full flex flex-col justify-center">
        <div className="grid gap-2">
          {/* Header row */}
          <div className="grid grid-cols-5 gap-1 text-xs text-gray-300 font-bold drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
            <div></div>
            {features.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.key} className="text-center">
                  <Icon className="w-4 h-4 mx-auto mb-1" />
                  {f.label}
                </div>
              );
            })}
          </div>

          {/* Data rows */}
          {data.map((row, i) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="grid grid-cols-5 gap-1 items-center"
            >
              <div
                className="text-xs font-bold truncate drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                style={{ color: row.color.hex }}
              >
                P{row.propertyNum}: {row.address}
              </div>
              {[row.pool, row.deck, row.ev, row.garage].map((has, j) => (
                <div
                  key={j}
                  className="h-8 rounded flex items-center justify-center"
                  style={{
                    backgroundColor: has ? row.color.rgba(0.3) : 'rgba(255,255,255,0.05)',
                    border: has ? `1px solid ${row.color.hex}` : 'none',
                  }}
                >
                  {has ? (
                    <Check className="w-4 h-4" style={{ color: row.color.hex }} />
                  ) : (
                    <X className="w-3 h-3 text-gray-600" />
                  )}
                </div>
              ))}
            </motion.div>
          ))}
        </div>

        {data.length === 0 && (
          <div className="text-gray-300 font-medium text-sm text-center drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">No exterior data</div>
        )}
      </div>
    </GlassChart>
  );
}

// G-2: Curb Appeal Radar - Show first 3 properties with P1/P2/P3 colors
function CurbAppealRadar({ properties }: CategoryGProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const propertyData = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    return {
      id: p.id,
      label: `P${idx + 1}: ${address.slice(0, 12)}`,
      pool: getVal(p.structural?.poolYn) ? 100 : 0,
      deck: getVal(p.structural?.deckPatio) ? 100 : 0,
      landscaping: getVal(p.structural?.landscaping) ? 100 : 0,
      fence: getVal(p.structural?.fence) ? 100 : 0,
      view: getVal(p.utilities?.viewType) ? 100 : 0,
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  const data = {
    labels: ['Pool', 'Deck/Patio', 'Landscaping', 'Fence', 'View'],
    datasets: propertyData.map((prop) => ({
      label: prop.label,
      data: [prop.pool, prop.deck, prop.landscaping, prop.fence, prop.view],
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
      title="Curb Appeal Radar"
      description={`Exterior features for ${propertyData.length} properties`}
      chartId="G-curb-appeal"
      color={PROPERTY_COLORS.P1.hex}
    >
      <Radar data={data} options={options} />
    </GlassChart>
  );
}

// G-3: Outdoor ROI Bubbles - Show first 3 properties with P1/P2/P3 colors
function OutdoorROIBubbles({ properties, onPropertyClick }: CategoryGProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const bubbles = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    let featureCount = 0;
    if (getVal(p.structural?.poolYn)) featureCount++;
    if (getVal(p.structural?.deckPatio)) featureCount++;
    if (getVal(p.utilities?.evChargingYn) === 'Yes') featureCount++;
    if (getVal(p.structural?.landscaping)) featureCount++;

    const pps = getVal(p.address?.pricePerSqft) || 0;
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    return {
      id: p.id,
      address: address.slice(0, 12),
      features: featureCount,
      premium: pps,
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  const maxPremium = Math.max(...bubbles.map(b => b.premium), 400);
  const maxFeatures = Math.max(...bubbles.map(b => b.features), 4);

  return (
    <GlassChart
      title="Outdoor ROI Bubbles"
      description={`Feature count vs $/sqft for ${bubbles.length} properties`}
      chartId="G-outdoor-roi"
      color={PROPERTY_COLORS.P3.hex}
    >
      <div className="h-full relative">
        {/* Axis labels */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-gray-300 font-bold drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          $/sqft
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-gray-300 font-bold drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          Features
        </div>

        {/* Bubble chart area */}
        <div className="absolute inset-4 border border-white/10 rounded-lg">
          {bubbles.map((bubble, i) => {
            const x = (bubble.features / maxFeatures) * 80 + 10;
            const y = 90 - (bubble.premium / maxPremium) * 80;
            const size = 28 + bubble.features * 8;

            return (
              <motion.div
                key={bubble.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="absolute cursor-pointer group"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() => onPropertyClick?.(bubble.id)}
              >
                <div
                  className="rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  style={{
                    width: size,
                    height: size,
                    background: `radial-gradient(circle at 30% 30%, ${bubble.color.rgba(0.9)}, ${bubble.color.rgba(0.4)})`,
                    boxShadow: `0 0 15px ${bubble.color.rgba(0.6)}`,
                    border: `2px solid ${bubble.color.hex}`,
                  }}
                >
                  <span
                    className="text-xs font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                    style={{ color: '#fff' }}
                  >
                    P{bubble.propertyNum}
                  </span>
                </div>

                {/* Tooltip */}
                <div
                  className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/90 px-2 py-1 rounded text-xs font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]"
                  style={{ color: bubble.color.hex }}
                >
                  {bubble.address}: {bubble.features} features, ${Math.round(bubble.premium)}/sqft
                </div>
              </motion.div>
            );
          })}
        </div>

        {bubbles.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
            No outdoor data
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 flex gap-4">
          {bubbles.map((b) => (
            <div key={b.id} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: b.color.hex, boxShadow: `0 0 6px ${b.color.hex}` }}
              />
              <span className="text-xs text-gray-300 font-medium">P{b.propertyNum}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassChart>
  );
}

export default function CategoryG({ properties, onPropertyClick }: CategoryGProps) {
  return (
    <>
      <ExteriorFeatureMatrix properties={properties} onPropertyClick={onPropertyClick} />
      <CurbAppealRadar properties={properties} />
      <OutdoorROIBubbles properties={properties} onPropertyClick={onPropertyClick} />
    </>
  );
}
