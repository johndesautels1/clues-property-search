/**
 * Category G: Exterior Features (5 fields)
 * Charts:
 * 1. EXTERIOR FEATURES GRID - True exterior features from schema #168, #54-56
 * 2. EXTERIOR UPGRADES - Quality upgrades from #133, #130, #168
 * 3. CURB APPEAL RADAR - Multi-axis exterior scores
 * 4. OUTDOOR ROI BUBBLES - Feature count vs premium
 */

import { motion } from 'framer-motion';
import { Radar } from 'react-chartjs-2';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';
import { Check, X, Waves, Zap, TreeDeciduous, Car, Home, Anchor, UtensilsCrossed, ShowerHead, Shield, Droplets, Sun, BatteryCharging, Square } from 'lucide-react';
import { PROPERTY_COLORS, getPropertyColor, calcPricePerSqft } from '../chartColors';

interface CategoryGProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

/**
 * G-1: Exterior Features Grid
 * TRUE exterior features from schema:
 * - Field #168: exterior_features (multiselect) - Balcony, Outdoor Shower, Sidewalk,
 *   Sliding Doors, Hurricane Shutters, Sprinkler System, Outdoor Kitchen, Private Dock
 * - Field #54: pool_yn (boolean)
 * - Field #55: pool_type (select)
 * - Field #56: deck_patio (text)
 */
function ExteriorFeaturesGrid({ properties, onPropertyClick }: CategoryGProps) {
  // Define true exterior features with icons
  const features = [
    { key: 'pool', label: 'Pool', icon: Waves },
    { key: 'deck', label: 'Deck/Patio', icon: TreeDeciduous },
    { key: 'dock', label: 'Dock', icon: Anchor },
    { key: 'balcony', label: 'Balcony', icon: Home },
    { key: 'fence', label: 'Fence', icon: Square },
    { key: 'outShower', label: 'Out Shower', icon: ShowerHead },
    { key: 'hurricane', label: 'Shutters', icon: Shield },
    { key: 'sprinkler', label: 'Sprinkler', icon: Droplets },
  ];

  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const data = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    // Get exterior features array from Stellar MLS (#168)
    const exteriorFeatures = getVal(p.stellarMLS?.features?.exteriorFeatures) || [];

    // Check for each feature (case-insensitive partial match)
    const hasFeature = (searchTerm: string) =>
      exteriorFeatures.some(f => f.toLowerCase().includes(searchTerm.toLowerCase()));

    return {
      id: p.id,
      address: address.slice(0, 14),
      pool: getVal(p.structural?.poolYn) || false,
      poolType: getVal(p.structural?.poolType) || '',
      deck: !!getVal(p.structural?.deckPatio),
      deckDetail: getVal(p.structural?.deckPatio) || '',
      dock: hasFeature('dock'),
      balcony: hasFeature('balcony'),
      fence: !!getVal(p.structural?.fence),
      outShower: hasFeature('outdoor shower'),
      hurricane: hasFeature('hurricane') || hasFeature('shutter'),
      sprinkler: hasFeature('sprinkler'),
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  return (
    <GlassChart
      title="Exterior Features Grid"
      description={`True features for ${data.length} properties (Schema #54, #55, #56, #168)`}
      chartId="G-exterior-features"
      color={PROPERTY_COLORS.P1.hex}
    >
      <div className="h-full overflow-auto flex flex-col">
        {/* Header row with icons - full width with generous spacing */}
        <div className="flex justify-between px-2 mb-3">
          {features.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.key} className="text-center flex-1">
                <Icon className="w-4 h-4 mx-auto mb-1 text-gray-300" />
                <div className="text-[10px] text-gray-300 font-bold">{f.label}</div>
              </div>
            );
          })}
        </div>

        {/* Data rows - each property is a block with checkboxes above, address below */}
        <div className="flex-1 space-y-4">
          {data.map((row, i) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="cursor-pointer hover:bg-white/5 rounded-lg p-2"
              onClick={() => onPropertyClick?.(row.id)}
            >
              {/* Checkboxes row - full width with generous spacing */}
              <div className="flex justify-between px-2 mb-2">
                {[
                  { has: row.pool, extra: row.poolType ? `(${row.poolType.slice(0, 6)})` : '' },
                  { has: row.deck, extra: '' },
                  { has: row.dock },
                  { has: row.balcony },
                  { has: row.fence },
                  { has: row.outShower },
                  { has: row.hurricane },
                  { has: row.sprinkler },
                ].map((cell, j) => (
                  <div key={j} className="flex-1 flex justify-center">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center relative"
                      style={{
                        backgroundColor: cell.has ? row.color.rgba(0.3) : 'rgba(255,255,255,0.05)',
                        border: cell.has ? `2px solid ${row.color.hex}` : '1px solid rgba(255,255,255,0.1)',
                        boxShadow: cell.has ? `0 0 8px ${row.color.rgba(0.4)}` : 'none',
                      }}
                    >
                      {cell.has ? (
                        <>
                          <Check className="w-5 h-5" style={{ color: row.color.hex }} />
                          {cell.extra && (
                            <span
                              className="absolute -top-2 -right-2 text-[9px] font-bold bg-black/80 px-1 rounded"
                              style={{ color: row.color.hex }}
                            >
                              {cell.extra}
                            </span>
                          )}
                        </>
                      ) : (
                        <X className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Address below checkboxes - centered */}
              <div
                className="text-center text-xs font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                style={{ color: row.color.hex }}
              >
                P{row.propertyNum}: {row.address}
              </div>
            </motion.div>
          ))}
        </div>

        {data.length === 0 && (
          <div className="text-gray-300 font-medium text-sm text-center py-8 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
            No exterior feature data
          </div>
        )}
      </div>
    </GlassChart>
  );
}

/**
 * G-2: Exterior Upgrades
 * Quality upgrades/improvements from schema:
 * - Field #133: ev_charging (text) - EV charging station
 * - Field #130: solar_potential (text) - Solar panels/potential
 * - Field #168: exterior_features (multiselect) - for outdoor kitchen
 * - Field #58: landscaping (text)
 */
function ExteriorUpgrades({ properties, onPropertyClick }: CategoryGProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const data = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    // Get upgrade fields
    const evCharging = getVal(p.utilities?.evChargingYn) || '';
    const solarPotential = getVal(p.utilities?.solarPotential) || '';
    const fence = getVal(p.structural?.fence) || '';
    const landscaping = getVal(p.structural?.landscaping) || '';

    // Get exterior features array from Stellar MLS (#168)
    const exteriorFeatures = getVal(p.stellarMLS?.features?.exteriorFeatures) || [];
    const hasFeature = (searchTerm: string) =>
      exteriorFeatures.some(f => f.toLowerCase().includes(searchTerm.toLowerCase()));

    // Calculate upgrade quality scores (0-3 scale: None, Basic, Good, Premium)
    const getEvScore = (ev: string): number => {
      const evLower = ev.toLowerCase();
      if (evLower.includes('tesla') || evLower.includes('level 2') || evLower.includes('fast')) return 3;
      if (evLower === 'yes' || evLower.includes('charger') || evLower.includes('outlet')) return 2;
      if (ev.length > 0 && evLower !== 'no' && evLower !== 'none') return 1;
      return 0;
    };

    const getSolarScore = (s: string): number => {
      const sLower = s.toLowerCase();
      if (sLower.includes('installed') || sLower.includes('owned') || sLower.includes('panels')) return 3;
      if (sLower.includes('excellent') || sLower.includes('high')) return 2;
      if (s.length > 0 && sLower !== 'none' && sLower !== 'low') return 1;
      return 0;
    };

    const getFenceScore = (f: string): number => {
      const fLower = f.toLowerCase();
      if (fLower.includes('wrought iron') || fLower.includes('brick') || fLower.includes('stone')) return 3;
      if (fLower.includes('vinyl') || fLower.includes('aluminum') || fLower.includes('wood')) return 2;
      if (f.length > 0 && fLower !== 'none') return 1;
      return 0;
    };

    const getLandscapeScore = (l: string): number => {
      const lLower = l.toLowerCase();
      if (lLower.includes('professional') || lLower.includes('mature') || lLower.includes('tropical')) return 3;
      if (lLower.includes('maintained') || lLower.includes('irrigation')) return 2;
      if (l.length > 0 && lLower !== 'none') return 1;
      return 0;
    };

    return {
      id: p.id,
      address: address.slice(0, 14),
      ev: { score: getEvScore(evCharging), detail: evCharging },
      solar: { score: getSolarScore(solarPotential), detail: solarPotential },
      fence: { score: getFenceScore(fence), detail: fence },
      landscaping: { score: getLandscapeScore(landscaping), detail: landscaping },
      hasSprinkler: hasFeature('sprinkler'),
      hasHurricane: hasFeature('hurricane') || hasFeature('shutter'),
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  const scoreLabels = ['None', 'Basic', 'Good', 'Premium'];
  const scoreColors = ['#6B7280', '#F59E0B', '#3B82F6', '#10B981'];

  return (
    <GlassChart
      title="Exterior Upgrades"
      description={`Quality upgrades for ${data.length} properties (Schema #57, #58, #130, #133, #168)`}
      chartId="G-exterior-upgrades"
      color={PROPERTY_COLORS.P2.hex}
    >
      <div className="h-full flex flex-col justify-center space-y-3 px-1">
        {data.map((row, i) => (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="space-y-1.5 cursor-pointer hover:bg-white/5 rounded p-1"
            onClick={() => onPropertyClick?.(row.id)}
          >
            <div className="flex justify-between items-center">
              <div
                className="text-xs font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                style={{ color: row.color.hex }}
              >
                P{row.propertyNum}: {row.address}
              </div>
              {/* Quick badges for special features */}
              <div className="flex gap-1">
                {row.hasSprinkler && (
                  <div className="flex items-center gap-0.5 px-1 py-0.5 bg-blue-500/20 rounded text-[8px] text-blue-400">
                    <Droplets className="w-2.5 h-2.5" />
                  </div>
                )}
                {row.hasHurricane && (
                  <div className="flex items-center gap-0.5 px-1 py-0.5 bg-orange-500/20 rounded text-[8px] text-orange-400">
                    <Shield className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1">
              {[
                { label: 'EV Charging', data: row.ev, icon: BatteryCharging },
                { label: 'Solar', data: row.solar, icon: Sun },
                { label: 'Fencing', data: row.fence, icon: Shield },
                { label: 'Landscape', data: row.landscaping, icon: TreeDeciduous },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="text-center group relative">
                    <div className="flex items-center justify-center gap-0.5 text-[9px] text-gray-400 mb-0.5">
                      <Icon className="w-2.5 h-2.5" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <div
                      className="h-5 rounded flex items-center justify-center text-[10px] font-bold"
                      style={{
                        backgroundColor: `${scoreColors[item.data.score]}30`,
                        border: `1px solid ${scoreColors[item.data.score]}`,
                        color: scoreColors[item.data.score],
                      }}
                    >
                      {scoreLabels[item.data.score]}
                    </div>
                    {/* Tooltip with detail */}
                    {item.data.detail && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/95 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap max-w-[150px] truncate">
                        {item.data.detail}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}

        {data.length === 0 && (
          <div className="text-gray-300 font-medium text-sm text-center drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
            No upgrade data
          </div>
        )}

        {/* Legend */}
        <div className="flex justify-center gap-3 pt-2 border-t border-white/10">
          {scoreLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: scoreColors[i] }}
              />
              <span className="text-[10px] text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassChart>
  );
}

// G-3: Curb Appeal Radar - Show first 3 properties with P1/P2/P3 colors
// Uses TRUE features from schema: #54 pool, #56 deck, #57 fence, #58 landscaping, #131 view
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

// G-4: Outdoor ROI Bubbles - Show first 3 properties with P1/P2/P3 colors
// Uses TRUE features from schema: #54 pool, #56 deck, #168 exterior_features count
function OutdoorROIBubbles({ properties, onPropertyClick }: CategoryGProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const bubbles = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    let featureCount = 0;

    // Count TRUE exterior features from #168
    const exteriorFeatures = getVal(p.stellarMLS?.features?.exteriorFeatures) || [];
    featureCount += exteriorFeatures.length;

    // Add standard exterior features from schema
    if (getVal(p.structural?.poolYn)) featureCount++;  // #54
    if (getVal(p.structural?.deckPatio)) featureCount++;  // #56

    const pps = calcPricePerSqft(
      getVal(p.address?.pricePerSqft),
      getVal(p.address?.listingPrice),
      getVal(p.details?.livingSqft)
    );
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
      <ExteriorFeaturesGrid properties={properties} onPropertyClick={onPropertyClick} />
      <ExteriorUpgrades properties={properties} onPropertyClick={onPropertyClick} />
      <CurbAppealRadar properties={properties} />
      <OutdoorROIBubbles properties={properties} onPropertyClick={onPropertyClick} />
    </>
  );
}
