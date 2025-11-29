/**
 * Category P: Additional Features (8 fields)
 * Charts:
 * 1. FEATURE MOSAIC - 8x binary tiles grid
 * 2. PREMIUM INDEX - Weighted horizontal bar
 * 3. UPLIFT VIOLIN - Feature value distribution
 */

import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';
import {
  Waves, Car, Trees, Lock, Home, Sparkles,
  Building, Sun, Star
} from 'lucide-react';
import { PROPERTY_COLORS, getPropertyColor, getIndexColor } from '../chartColors';

interface CategoryPProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

function boolToNum(val: boolean | string | null | undefined): number {
  if (val === true || val === 'Yes' || val === 'yes' || val === 'TRUE') return 1;
  return 0;
}

// P-1: Feature Mosaic (8 binary tiles)
function FeatureMosaic({ properties }: CategoryPProps) {
  const features = properties.reduce((acc, p) => {
    acc.pool += boolToNum(getVal(p.structural?.poolType) !== null && getVal(p.structural?.poolType) !== 'None');
    acc.garage += getVal(p.details?.garageSpaces) && getVal(p.details?.garageSpaces)! > 0 ? 1 : 0;
    acc.fireplace += boolToNum(getVal(p.structural?.fireplaceYn));
    acc.gated += boolToNum(getVal(p.structural?.fence));
    acc.hoa += getVal(p.details?.hoaFeeAnnual) && getVal(p.details?.hoaFeeAnnual)! > 0 ? 1 : 0;
    acc.newConstruction += getVal(p.details?.yearBuilt) && getVal(p.details?.yearBuilt)! >= 2020 ? 1 : 0;
    acc.solar += boolToNum(getVal(p.utilities?.solarPotential));
    acc.smartHome += boolToNum(getVal(p.utilities?.smartHomeFeatures));
    acc.count++;
    return acc;
  }, { pool: 0, garage: 0, fireplace: 0, gated: 0, hoa: 0, newConstruction: 0, solar: 0, smartHome: 0, count: 0 });

  const count = features.count || 1;

  const tiles = [
    { label: 'Pool', value: features.pool, icon: Waves, color: '#00D9FF' },
    { label: 'Garage', value: features.garage, icon: Car, color: '#8B5CF6' },
    { label: 'Fireplace', value: features.fireplace, icon: Trees, color: '#10B981' },
    { label: 'Fenced', value: features.gated, icon: Lock, color: '#F59E0B' },
    { label: 'HOA', value: features.hoa, icon: Building, color: '#EF4444' },
    { label: 'New Build', value: features.newConstruction, icon: Home, color: '#06B6D4' },
    { label: 'Solar', value: features.solar, icon: Sun, color: '#FBBF24' },
    { label: 'Smart Home', value: features.smartHome, icon: Sparkles, color: '#A855F7' },
  ];

  return (
    <GlassChart
      title="Feature Mosaic"
      description="Property amenity presence"
      chartId="P-feature-mosaic"
      color="#8B5CF6"
    >
      <div className="h-full grid grid-cols-4 gap-2 p-1">
        {tiles.map((tile, i) => {
          const Icon = tile.icon;
          const percentage = Math.round((tile.value / count) * 100);
          const hasFeature = percentage > 0;

          return (
            <motion.div
              key={tile.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="relative p-2 rounded-lg flex flex-col items-center justify-center overflow-hidden"
              style={{
                background: hasFeature ? `${tile.color}20` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${hasFeature ? tile.color : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              {/* Glow effect for active tiles */}
              {hasFeature && (
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    background: `radial-gradient(circle at center, ${tile.color}30 0%, transparent 70%)`,
                  }}
                />
              )}

              <Icon
                className="w-5 h-5 mb-1 relative z-10"
                style={{ color: hasFeature ? tile.color : '#6B7280' }}
              />
              <div
                className="text-xs font-bold relative z-10"
                style={{
                  color: hasFeature ? '#fff' : '#6B7280',
                  textShadow: hasFeature ? '0 0 6px rgba(255,255,255,0.7)' : 'none'
                }}
              >
                {percentage}%
              </div>
              <div className="text-xs text-gray-400 font-medium relative z-10 truncate max-w-full drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
                {tile.label}
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassChart>
  );
}

// P-2: Premium Index - Show first 3 properties with P1/P2/P3 colors
function PremiumIndexBar({ properties }: CategoryPProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  // Calculate weighted premium score for each property
  const weights = {
    pool: 15,
    fireplace: 10,
    garage: 10,
    fenced: 5,
    newBuild: 18,
    solar: 8,
    smartHome: 6,
    views: 6,
  };

  const premiumScores = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    let score = 0;
    if (getVal(p.structural?.poolType) && getVal(p.structural?.poolType) !== 'None') score += weights.pool;
    if (boolToNum(getVal(p.structural?.fireplaceYn))) score += weights.fireplace;
    if (getVal(p.details?.garageSpaces) && getVal(p.details?.garageSpaces)! > 0) score += weights.garage;
    if (getVal(p.structural?.fence)) score += weights.fenced;
    if (getVal(p.details?.yearBuilt) && getVal(p.details?.yearBuilt)! >= 2020) score += weights.newBuild;
    if (getVal(p.utilities?.solarPotential)) score += weights.solar;
    if (getVal(p.utilities?.smartHomeFeatures)) score += weights.smartHome;
    if (getVal(p.utilities?.viewType)) score += weights.views;

    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    return {
      id: p.id,
      address: `P${idx + 1}: ${address.slice(0, 10)}`,
      score,
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  const data = {
    labels: premiumScores.map(p => p.address),
    datasets: [{
      label: 'Premium Index',
      data: premiumScores.map(p => p.score),
      backgroundColor: premiumScores.map(p => p.color.rgba(0.7)),
      borderColor: premiumScores.map(p => p.color.hex),
      borderWidth: 2,
      borderRadius: 4,
    }],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#E5E7EB', font: { weight: 'bold' as const } },
        max: 100,
      },
      y: {
        grid: { display: false },
        ticks: { color: '#E5E7EB', font: { size: 11, weight: 'bold' as const } },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.9)',
        titleFont: { weight: 'bold' as const },
        bodyFont: { weight: 'bold' as const },
        callbacks: {
          label: (ctx: any) => `Premium Score: ${ctx.raw}/100`,
        },
      },
    },
  };

  return (
    <GlassChart
      title="Premium Index"
      description={`Feature scores for ${premiumScores.length} properties`}
      chartId="P-premium-index"
      color={PROPERTY_COLORS.P1.hex}
    >
      {premiumScores.length > 0 ? (
        <Bar data={data} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          No premium data
        </div>
      )}
    </GlassChart>
  );
}

// P-3: Feature Uplift Violin (Distribution visualization)
function FeatureUpliftViolin({ properties }: CategoryPProps) {
  // Calculate uplift percentages for properties with vs without features
  const features = [
    { name: 'Pool', key: 'pool' },
    { name: 'Fireplace', key: 'fireplace' },
    { name: 'Garage', key: 'garage' },
    { name: 'Smart Home', key: 'smart' },
  ];

  const upliftData = features.map(feature => {
    let withFeature: number[] = [];
    let withoutFeature: number[] = [];

    properties.forEach(p => {
      const pps = getVal(p.address?.pricePerSqft) || 0;
      if (pps === 0) return;

      let hasFeature = false;
      switch (feature.key) {
        case 'pool':
          hasFeature = getVal(p.structural?.poolType) !== null && getVal(p.structural?.poolType) !== 'None';
          break;
        case 'fireplace':
          hasFeature = boolToNum(getVal(p.structural?.fireplaceYn)) === 1;
          break;
        case 'garage':
          hasFeature = getVal(p.details?.garageSpaces) !== null && getVal(p.details?.garageSpaces)! > 0;
          break;
        case 'smart':
          hasFeature = boolToNum(getVal(p.utilities?.smartHomeFeatures)) === 1;
          break;
      }

      if (hasFeature) {
        withFeature.push(pps);
      } else {
        withoutFeature.push(pps);
      }
    });

    const avgWith = withFeature.length > 0 ? withFeature.reduce((a, b) => a + b, 0) / withFeature.length : 0;
    const avgWithout = withoutFeature.length > 0 ? withoutFeature.reduce((a, b) => a + b, 0) / withoutFeature.length : 0;
    const uplift = avgWithout > 0 ? ((avgWith - avgWithout) / avgWithout * 100) : 0;

    return {
      name: feature.name,
      uplift: Math.round(uplift),
      count: withFeature.length,
    };
  });

  const colors = ['#00D9FF', '#10B981', '#8B5CF6', '#F59E0B'];
  const maxUplift = Math.max(...upliftData.map(d => Math.abs(d.uplift)), 50);

  return (
    <GlassChart
      title="Feature Uplift"
      description="$/sqft premium by feature"
      chartId="P-feature-uplift"
      color="#F59E0B"
      webAugmented
      webSource="Market Analysis"
    >
      <div className="h-full flex flex-col justify-center space-y-3 px-2">
        {upliftData.map((item, i) => {
          const isPositive = item.uplift >= 0;
          const barWidth = Math.abs(item.uplift) / maxUplift * 50;

          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2"
            >
              <div className="w-20 text-xs text-gray-300 font-medium text-right drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">{item.name}</div>

              {/* Violin-style distribution bar */}
              <div className="flex-1 h-8 relative flex items-center">
                {/* Center line */}
                <div className="absolute left-1/2 h-full w-px bg-white/20" />

                {/* Bar */}
                <div
                  className="absolute h-6 rounded-full flex items-center justify-center"
                  style={{
                    left: isPositive ? '50%' : `${50 - barWidth}%`,
                    width: `${barWidth}%`,
                    background: `linear-gradient(90deg, ${colors[i]}60, ${colors[i]})`,
                    boxShadow: `0 0 10px ${colors[i]}50`,
                  }}
                >
                  {barWidth > 15 && (
                    <span className="text-xs text-white font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]">
                      {isPositive ? '+' : ''}{item.uplift}%
                    </span>
                  )}
                </div>
              </div>

              {barWidth <= 15 && (
                <div className="w-12 text-xs font-bold" style={{ color: colors[i] }}>
                  {isPositive ? '+' : ''}{item.uplift}%
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Legend */}
        <div className="flex justify-center gap-4 text-xs text-gray-300 font-medium mt-2 pt-2 border-t border-white/10 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            <span>Baseline</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400" />
            <span>Premium Uplift</span>
          </div>
        </div>
      </div>
    </GlassChart>
  );
}

export default function CategoryP({ properties, onPropertyClick }: CategoryPProps) {
  return (
    <>
      <FeatureMosaic properties={properties} />
      <PremiumIndexBar properties={properties} onPropertyClick={onPropertyClick} />
      <FeatureUpliftViolin properties={properties} />
    </>
  );
}
