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

interface CategoryGProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

// G-1: Exterior Feature Matrix
function ExteriorFeatureMatrix({ properties }: CategoryGProps) {
  const features = [
    { key: 'pool', label: 'Pool', icon: Waves },
    { key: 'deck', label: 'Deck', icon: TreeDeciduous },
    { key: 'ev', label: 'EV', icon: Zap },
    { key: 'garage', label: 'Garage', icon: Car },
  ];

  const data = properties.slice(0, 5).map(p => ({
    id: p.id,
    address: getVal(p.address?.streetAddress)?.slice(0, 8) || `#${p.id.slice(0, 4)}`,
    pool: getVal(p.structural?.poolYn) || false,
    deck: !!getVal(p.structural?.deckPatio),
    ev: getVal(p.utilities?.evChargingYn) === 'Yes',
    garage: (getVal(p.details?.garageSpaces) || 0) > 0,
  }));

  return (
    <GlassChart
      title="Exterior Feature Matrix"
      description="Outdoor amenities grid"
      chartId="G-feature-matrix"
      color="#10B981"
    >
      <div className="h-full flex flex-col justify-center">
        <div className="grid gap-2">
          {/* Header row */}
          <div className="grid grid-cols-5 gap-1 text-xs text-gray-400">
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
              <div className="text-xs text-gray-300 truncate">{row.address}</div>
              {[row.pool, row.deck, row.ev, row.garage].map((has, j) => (
                <div
                  key={j}
                  className={`h-8 rounded flex items-center justify-center ${
                    has ? 'bg-green-500/30' : 'bg-white/5'
                  }`}
                >
                  {has ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <X className="w-3 h-3 text-gray-600" />
                  )}
                </div>
              ))}
            </motion.div>
          ))}
        </div>

        {data.length === 0 && (
          <div className="text-gray-500 text-sm text-center">No exterior data</div>
        )}
      </div>
    </GlassChart>
  );
}

// G-2: Curb Appeal Radar
function CurbAppealRadar({ properties }: CategoryGProps) {
  const scores = properties.reduce((acc, p) => {
    acc.pool += getVal(p.structural?.poolYn) ? 1 : 0;
    acc.deck += getVal(p.structural?.deckPatio) ? 1 : 0;
    acc.landscaping += getVal(p.structural?.landscaping) ? 1 : 0;
    acc.fence += getVal(p.structural?.fence) ? 1 : 0;
    acc.view += getVal(p.utilities?.viewType) ? 1 : 0;
    acc.count++;
    return acc;
  }, { pool: 0, deck: 0, landscaping: 0, fence: 0, view: 0, count: 0 });

  const count = scores.count || 1;

  const data = {
    labels: ['Pool', 'Deck/Patio', 'Landscaping', 'Fence', 'View'],
    datasets: [{
      label: 'Feature %',
      data: [
        (scores.pool / count) * 100,
        (scores.deck / count) * 100,
        (scores.landscaping / count) * 100,
        (scores.fence / count) * 100,
        (scores.view / count) * 100,
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
      title="Curb Appeal Radar"
      description="Exterior feature coverage %"
      chartId="G-curb-appeal"
      color="#00D9FF"
    >
      <Radar data={data} options={options} />
    </GlassChart>
  );
}

// G-3: Outdoor ROI Bubbles
function OutdoorROIBubbles({ properties, onPropertyClick }: CategoryGProps) {
  const bubbles = properties.slice(0, 8).map(p => {
    let featureCount = 0;
    if (getVal(p.structural?.poolYn)) featureCount++;
    if (getVal(p.structural?.deckPatio)) featureCount++;
    if (getVal(p.utilities?.evChargingYn) === 'Yes') featureCount++;
    if (getVal(p.structural?.landscaping)) featureCount++;

    const pps = getVal(p.address?.pricePerSqft) || 0;

    return {
      id: p.id,
      address: getVal(p.address?.streetAddress)?.slice(0, 6) || `#${p.id.slice(0, 3)}`,
      features: featureCount,
      premium: pps,
    };
  });

  const maxPremium = Math.max(...bubbles.map(b => b.premium), 400);
  const maxFeatures = Math.max(...bubbles.map(b => b.features), 4);

  return (
    <GlassChart
      title="Outdoor ROI Bubbles"
      description="Feature count vs price premium"
      chartId="G-outdoor-roi"
      color="#8B5CF6"
    >
      <div className="h-full relative">
        {/* Axis labels */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-gray-500">
          $/sqft
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-gray-500">
          Features
        </div>

        {/* Bubble chart area */}
        <div className="absolute inset-4 border border-white/10 rounded-lg">
          {bubbles.map((bubble, i) => {
            const x = (bubble.features / maxFeatures) * 80 + 10;
            const y = 90 - (bubble.premium / maxPremium) * 80;
            const size = 20 + bubble.features * 8;

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
                    background: `radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.8), rgba(139, 92, 246, 0.3))`,
                    boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)',
                  }}
                >
                  <span className="text-xs text-white font-bold">{bubble.features}</span>
                </div>

                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded text-xs text-white">
                  {bubble.address}: ${Math.round(bubble.premium)}/sqft
                </div>
              </motion.div>
            );
          })}
        </div>

        {bubbles.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            No outdoor data
          </div>
        )}
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
