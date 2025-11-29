/**
 * Category F: Interior Features (5 fields)
 * Charts:
 * 1. AMENITY HEATMAP - Kitchen/Smart/Fire binary grid
 * 2. FINISH INDEX BAR - Weighted composite score
 * 3. UPLIFT VIOLIN - Features vs $/sqft premium
 */

import { motion } from 'framer-motion';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';
import { Check, X } from 'lucide-react';
import { getIndexColor, PROPERTY_COLORS, getPropertyColor } from '../chartColors';

interface CategoryFProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

// F-1: Amenity Heatmap - Show first 3 properties with P1/P2/P3 colors
function AmenityHeatmap({ properties }: CategoryFProps) {
  const features = ['Kitchen', 'Smart', 'Fire', 'Floor', 'Appl'];

  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const data = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;
    return {
      id: p.id,
      address: address.slice(0, 12),
      kitchen: !!getVal(p.structural?.kitchenFeatures),
      smart: !!getVal(p.utilities?.smartHomeFeatures),
      fireplace: getVal(p.structural?.fireplaceYn) || false,
      flooring: !!getVal(p.structural?.flooringType),
      appliances: (getVal(p.structural?.appliancesIncluded) || []).length > 0,
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  return (
    <GlassChart
      title="Interior Amenity Grid"
      description={`Feature matrix for ${data.length} properties`}
      chartId="F-amenity-heatmap"
      color={PROPERTY_COLORS.P1.hex}
    >
      <div className="h-full overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-300 font-bold drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
              <th className="text-left py-1 px-1">Property</th>
              {features.map(f => (
                <th key={f} className="text-center py-1 px-1 truncate max-w-[40px]">{f}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="border-t border-white/5"
              >
                <td
                  className="py-1.5 px-1 font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                  style={{ color: row.color.hex }}
                >
                  P{row.propertyNum}: {row.address}
                </td>
                {[row.kitchen, row.smart, row.fireplace, row.flooring, row.appliances].map((has, j) => (
                  <td key={j} className="text-center py-1.5 px-1">
                    <div
                      className="w-6 h-6 mx-auto rounded flex items-center justify-center"
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
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="text-gray-300 font-medium text-sm text-center py-8 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">No feature data</div>
        )}
      </div>
    </GlassChart>
  );
}

// F-2: Finish Quality Index - Show first 3 properties with P1/P2/P3 colors
function FinishQualityIndex({ properties }: CategoryFProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const scores = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    let score = 0;
    if (getVal(p.structural?.kitchenFeatures)) score += 25;
    if (getVal(p.utilities?.smartHomeFeatures)) score += 20;
    if (getVal(p.structural?.fireplaceYn)) score += 15;
    if (getVal(p.structural?.flooringType)) score += 20;
    if ((getVal(p.structural?.appliancesIncluded) || []).length > 3) score += 20;
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    return {
      id: p.id,
      address: address.slice(0, 12),
      score,
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

// F-3: Interior Uplift (feature count vs price)
function InteriorUplift({ properties }: CategoryFProps) {
  // Group by feature count
  const groups = new Map<number, number[]>();
  properties.forEach(p => {
    let count = 0;
    if (getVal(p.structural?.kitchenFeatures)) count++;
    if (getVal(p.utilities?.smartHomeFeatures)) count++;
    if (getVal(p.structural?.fireplaceYn)) count++;
    if (getVal(p.structural?.flooringType)) count++;
    if ((getVal(p.structural?.appliancesIncluded) || []).length > 0) count++;

    const pps = getVal(p.address?.pricePerSqft);
    if (pps) {
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
      <AmenityHeatmap properties={properties} onPropertyClick={onPropertyClick} />
      <FinishQualityIndex properties={properties} />
      <InteriorUplift properties={properties} />
    </>
  );
}
