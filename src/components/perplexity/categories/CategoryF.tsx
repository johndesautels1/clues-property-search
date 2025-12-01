/**
 * Category F: Interior Features (5 fields)
 * Charts:
 * 1. INTERIOR FEATURES GRID - True interior features from schema #167 + #52/#53
 * 2. INTERIOR UPGRADES - Quality upgrades from #50, #49, #134, #59
 * 3. FINISH INDEX BAR - Weighted composite score
 * 4. UPLIFT VIOLIN - Features vs $/sqft premium
 */

import { motion } from 'framer-motion';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';
import { Check, X, Flame, Home, Sparkles, PanelTop, Wind, GlassWater, Columns, BookOpen } from 'lucide-react';
import { PROPERTY_COLORS, getPropertyColor, calcPricePerSqft } from '../chartColors';

interface CategoryFProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

/**
 * F-1: Interior Features Grid
 * TRUE interior features from schema:
 * - Field #167: interior_features (multiselect) - Cathedral Ceiling(s), Walk-In Closet(s),
 *   Primary Bedroom Main Floor, Open Floor Plan, Crown Molding, Skylight(s), Wet Bar, Built-in Features
 * - Field #52: fireplace_yn (boolean)
 * - Field #53: fireplace_count (number)
 */
function InteriorFeaturesGrid({ properties, onPropertyClick }: CategoryFProps) {
  // Define true interior features with icons
  const features = [
    { key: 'fireplace', label: 'Fireplace', icon: Flame },
    { key: 'cathedral', label: 'Cathedral', icon: Home },
    { key: 'walkIn', label: 'Walk-In', icon: Columns },
    { key: 'openFloor', label: 'Open Plan', icon: PanelTop },
    { key: 'skylight', label: 'Skylight', icon: Sparkles },
    { key: 'wetBar', label: 'Wet Bar', icon: GlassWater },
    { key: 'crownMold', label: 'Crown', icon: Wind },
    { key: 'builtIns', label: 'Built-ins', icon: BookOpen },
  ];

  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const data = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    // Get interior features array from Stellar MLS (#167)
    const interiorFeatures = getVal(p.stellarMLS?.features?.interiorFeatures) || [];

    // Check for each feature (case-insensitive partial match)
    const hasFeature = (searchTerm: string) =>
      interiorFeatures.some(f => f.toLowerCase().includes(searchTerm.toLowerCase()));

    return {
      id: p.id,
      address: address.slice(0, 14),
      fireplace: getVal(p.structural?.fireplaceYn) || false,
      fireplaceCount: getVal(p.structural?.fireplaceCount) || 0,
      cathedral: hasFeature('cathedral'),
      walkIn: hasFeature('walk-in') || hasFeature('walkin'),
      openFloor: hasFeature('open floor'),
      skylight: hasFeature('skylight'),
      wetBar: hasFeature('wet bar'),
      crownMold: hasFeature('crown'),
      builtIns: hasFeature('built-in') || hasFeature('builtin'),
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  return (
    <GlassChart
      title="Interior Features Grid"
      description={`True features for ${data.length} properties (Schema #52, #53, #167)`}
      chartId="F-interior-features"
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
                  { has: row.fireplace, extra: row.fireplaceCount > 1 ? `(${row.fireplaceCount})` : '' },
                  { has: row.cathedral },
                  { has: row.walkIn },
                  { has: row.openFloor },
                  { has: row.skylight },
                  { has: row.wetBar },
                  { has: row.crownMold },
                  { has: row.builtIns },
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
            No interior feature data
          </div>
        )}
      </div>
    </GlassChart>
  );
}

/**
 * F-2: Interior Upgrades
 * Quality upgrades/improvements from schema:
 * - Field #50: kitchen_features (text) - Executive kitchen, granite, etc.
 * - Field #49: flooring_type (text) - Hardwood, marble, travertine
 * - Field #134: smart_home_features (text) - Smart home details
 * - Field #59: recent_renovations (text) - Renovation descriptions
 * - Field #48: interior_condition (select) - Excellent, Renovated, etc.
 */
function InteriorUpgrades({ properties, onPropertyClick }: CategoryFProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const data = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    // Get upgrade fields
    const kitchenFeatures = getVal(p.structural?.kitchenFeatures) || '';
    const flooringType = getVal(p.structural?.flooringType) || '';
    const smartHome = getVal(p.utilities?.smartHomeFeatures) || '';
    const renovations = getVal(p.structural?.recentRenovations) || '';
    const condition = getVal(p.structural?.interiorCondition) || '';

    // Calculate upgrade quality scores (0-3 scale: None, Basic, Good, Premium)
    const getKitchenScore = (k: string): number => {
      const kLower = k.toLowerCase();
      if (kLower.includes('executive') || kLower.includes('gourmet') || kLower.includes('chef')) return 3;
      if (kLower.includes('granite') || kLower.includes('quartz') || kLower.includes('stainless')) return 2;
      if (k.length > 0) return 1;
      return 0;
    };

    const getFlooringScore = (f: string): number => {
      const fLower = f.toLowerCase();
      if (fLower.includes('marble') || fLower.includes('travertine') || fLower.includes('hardwood')) return 3;
      if (fLower.includes('tile') || fLower.includes('laminate') || fLower.includes('wood')) return 2;
      if (f.length > 0) return 1;
      return 0;
    };

    const getSmartScore = (s: string): number => {
      const sLower = s.toLowerCase();
      if (sLower.includes('full') || sLower.includes('complete') || sLower.includes('integrated')) return 3;
      if (sLower.includes('thermostat') || sLower.includes('security') || sLower.includes('lighting')) return 2;
      if (s.length > 0) return 1;
      return 0;
    };

    const getConditionScore = (c: string): number => {
      const cLower = c.toLowerCase();
      if (cLower.includes('excellent') || cLower.includes('renovated')) return 3;
      if (cLower.includes('good')) return 2;
      if (cLower.includes('fair')) return 1;
      return 0;
    };

    return {
      id: p.id,
      address: address.slice(0, 14),
      kitchen: { score: getKitchenScore(kitchenFeatures), detail: kitchenFeatures },
      flooring: { score: getFlooringScore(flooringType), detail: flooringType },
      smart: { score: getSmartScore(smartHome), detail: smartHome },
      condition: { score: getConditionScore(condition), detail: condition },
      renovations: renovations,
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  const scoreLabels = ['None', 'Basic', 'Good', 'Premium'];
  const scoreColors = ['#6B7280', '#F59E0B', '#3B82F6', '#10B981'];

  return (
    <GlassChart
      title="Interior Upgrades"
      description={`Quality upgrades for ${data.length} properties (Schema #48, #49, #50, #59, #134)`}
      chartId="F-interior-upgrades"
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
            <div
              className="text-xs font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
              style={{ color: row.color.hex }}
            >
              P{row.propertyNum}: {row.address}
            </div>

            <div className="grid grid-cols-4 gap-1">
              {[
                { label: 'Kitchen', data: row.kitchen },
                { label: 'Flooring', data: row.flooring },
                { label: 'Smart', data: row.smart },
                { label: 'Condition', data: row.condition },
              ].map((item) => (
                <div key={item.label} className="text-center group relative">
                  <div className="text-[9px] text-gray-400 mb-0.5">{item.label}</div>
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
              ))}
            </div>

            {row.renovations && (
              <div className="text-[10px] text-cyan-400 truncate" title={row.renovations}>
                Reno: {row.renovations}
              </div>
            )}
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

// F-3: Finish Quality Index - Show first 3 properties with P1/P2/P3 colors
// Uses TRUE features from schema: #52 fireplace, #167 interior_features, #50 kitchen, #134 smart
function FinishQualityIndex({ properties }: CategoryFProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const scores = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    let score = 0;

    // Get TRUE interior features from #167
    const interiorFeatures = getVal(p.stellarMLS?.features?.interiorFeatures) || [];

    // Score based on TRUE features (not basics like "has kitchen")
    if (getVal(p.structural?.fireplaceYn)) score += 15;  // #52
    if (interiorFeatures.some(f => f.toLowerCase().includes('cathedral'))) score += 12;
    if (interiorFeatures.some(f => f.toLowerCase().includes('walk-in'))) score += 10;
    if (interiorFeatures.some(f => f.toLowerCase().includes('open floor'))) score += 12;
    if (interiorFeatures.some(f => f.toLowerCase().includes('crown'))) score += 8;
    if (interiorFeatures.some(f => f.toLowerCase().includes('skylight'))) score += 10;
    if (interiorFeatures.some(f => f.toLowerCase().includes('wet bar'))) score += 8;
    if (interiorFeatures.some(f => f.toLowerCase().includes('built-in'))) score += 10;

    // Upgrade quality bonuses from #50, #134
    const kitchen = (getVal(p.structural?.kitchenFeatures) || '').toLowerCase();
    if (kitchen.includes('executive') || kitchen.includes('gourmet')) score += 15;
    else if (kitchen.includes('granite') || kitchen.includes('quartz')) score += 8;

    const smart = getVal(p.utilities?.smartHomeFeatures) || '';
    if (smart.length > 0) score += 10;

    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    return {
      id: p.id,
      address: address.slice(0, 12),
      score: Math.min(score, 100), // Cap at 100
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  return (
    <GlassChart
      title="Finish Quality Index"
      description={`Interior score for ${scores.length} properties`}
      chartId="F-finish-index"
      color={PROPERTY_COLORS.P2.hex}
    >
      <div className="h-full flex flex-col justify-center space-y-3 px-2">
        {scores.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex justify-between text-xs mb-1">
              <span
                className="font-bold truncate max-w-[120px] drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                style={{ color: item.color.hex }}
              >
                P{item.propertyNum}: {item.address}
              </span>
              <span
                className="font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                style={{ color: item.color.hex }}
              >
                {item.score}/100
              </span>
            </div>
            <div className="h-4 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.score}%` }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${item.color.rgba(0.4)}, ${item.color.hex})`,
                  boxShadow: `0 0 8px ${item.color.rgba(0.5)}`,
                }}
              />
            </div>
          </motion.div>
        ))}

        {scores.length === 0 && (
          <div className="text-gray-300 font-medium text-sm text-center drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">No quality data</div>
        )}

        {/* Legend */}
        <div className="flex justify-center gap-4 pt-2 border-t border-white/10">
          {scores.map((item) => (
            <div key={item.id} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color.hex, boxShadow: `0 0 6px ${item.color.hex}` }}
              />
              <span className="text-xs text-gray-300 font-medium">P{item.propertyNum}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassChart>
  );
}

// F-4: Interior Uplift (feature count vs price)
// Uses TRUE features from schema: #52 fireplace, #167 interior_features count
function InteriorUplift({ properties }: CategoryFProps) {
  // Group by TRUE feature count
  const groups = new Map<number, number[]>();
  properties.forEach(p => {
    let count = 0;

    // Count TRUE interior features from #167
    const interiorFeatures = getVal(p.stellarMLS?.features?.interiorFeatures) || [];
    count += interiorFeatures.length;

    // Add fireplace from #52
    if (getVal(p.structural?.fireplaceYn)) count++;

    const pps = calcPricePerSqft(
      getVal(p.address?.pricePerSqft),
      getVal(p.address?.listingPrice),
      getVal(p.details?.livingSqft)
    );
    if (pps > 0) {
      if (!groups.has(count)) groups.set(count, []);
      groups.get(count)!.push(pps);
    }
  });

  const data = Array.from(groups.entries())
    .map(([count, prices]) => ({
      count,
      avg: prices.reduce((a, b) => a + b, 0) / prices.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
    }))
    .sort((a, b) => a.count - b.count);

  const maxPrice = Math.max(...data.map(d => d.max), 500);

  return (
    <GlassChart
      title="Feature Uplift"
      description="Interior features vs $/sqft"
      chartId="F-uplift"
      color="#00D9FF"
    >
      <div className="h-full flex flex-col justify-center space-y-3 px-2">
        {data.map((item, i) => (
          <motion.div
            key={item.count}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300 font-medium drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">{item.count} features</span>
              <span className="text-cyan-400 font-bold drop-shadow-[0_0_6px_rgba(0,217,255,0.5)]">${Math.round(item.avg)}/sqft avg</span>
            </div>
            <div className="relative h-4 bg-white/5 rounded-full">
              {/* Range */}
              <div
                className="absolute h-full rounded-full bg-cyan-500/30"
                style={{
                  left: `${(item.min / maxPrice) * 100}%`,
                  width: `${((item.max - item.min) / maxPrice) * 100}%`,
                }}
              />
              {/* Average marker */}
              <div
                className="absolute top-0 h-full w-1 bg-cyan-400"
                style={{ left: `${(item.avg / maxPrice) * 100}%` }}
              />
            </div>
          </motion.div>
        ))}

        {data.length === 0 && (
          <div className="text-gray-300 font-medium text-sm text-center drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">No uplift data</div>
        )}
      </div>
    </GlassChart>
  );
}

export default function CategoryF({ properties, onPropertyClick }: CategoryFProps) {
  return (
    <>
      <InteriorFeaturesGrid properties={properties} onPropertyClick={onPropertyClick} />
      <InteriorUpgrades properties={properties} onPropertyClick={onPropertyClick} />
      <FinishQualityIndex properties={properties} />
      <InteriorUplift properties={properties} />
    </>
  );
}
