/**
 * Category A: Address & Identity (9 fields)
 * Charts:
 * 1. PIN-CLUSTER ORBS - Glass sphere clusters by location
 * 2. IDENTITY MATRIX - Table with row glow on hover
 * 3. GEO-DENSITY HEAT - Gulf Coast heatmap
 */

import { motion } from 'framer-motion';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';
import { MapPin, Table2, Flame } from 'lucide-react';

interface CategoryAProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

// Helper to get field value
function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

// A-1: Pin Cluster Orbs - Scatter visualization
function PinClusterOrbs({ properties, onPropertyClick }: CategoryAProps) {
  // Group properties by city for clustering
  const clusters = new Map<string, Property[]>();
  properties.forEach(p => {
    const city = getVal(p.address?.city) || 'Unknown';
    if (!clusters.has(city)) clusters.set(city, []);
    clusters.get(city)!.push(p);
  });

  const clusterArray = Array.from(clusters.entries());
  const maxCount = Math.max(...clusterArray.map(([, props]) => props.length), 1);

  return (
    <GlassChart
      title="Pin Cluster Orbs"
      description="Property clusters by location"
      chartId="A-pin-cluster"
      color="#10B981"
      webAugmented
      webSource="Redfin/Zillow validation"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Cluster visualization */}
        <div className="flex flex-wrap gap-4 justify-center items-center p-4">
          {clusterArray.map(([city, props], i) => {
            const size = 40 + (props.length / maxCount) * 60;
            const colors = ['#10B981', '#00D9FF', '#8B5CF6', '#F59E0B', '#EF4444'];
            const color = colors[i % colors.length];

            return (
              <motion.div
                key={city}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="relative cursor-pointer group"
                onClick={() => props[0] && onPropertyClick?.(props[0].id)}
              >
                {/* Outer glow */}
                <div
                  className="absolute inset-0 rounded-full blur-xl opacity-50"
                  style={{
                    backgroundColor: color,
                    width: size,
                    height: size,
                  }}
                />

                {/* Main orb */}
                <div
                  className="relative rounded-full flex items-center justify-center"
                  style={{
                    width: size,
                    height: size,
                    background: `radial-gradient(circle at 30% 30%, ${color}60, ${color}20)`,
                    border: `2px solid ${color}`,
                    boxShadow: `0 0 20px ${color}40`,
                  }}
                >
                  <div className="text-center">
                    <div className="text-white font-bold text-lg drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]">{props.length}</div>
                    <div className="text-xs text-gray-300 truncate max-w-[60px]">
                      {city}
                    </div>
                  </div>
                </div>

                {/* Hover tooltip */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs text-gray-400">
                  {props.length} properties
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty state */}
        {clusterArray.length === 0 && (
          <div className="text-gray-500 text-sm">No location data available</div>
        )}
      </div>
    </GlassChart>
  );
}

// A-2: Identity Matrix - Table with hover glow
function IdentityMatrix({ properties, onPropertyClick }: CategoryAProps) {
  return (
    <GlassChart
      title="Identity Matrix"
      description="Property identifiers at a glance"
      chartId="A-identity-matrix"
      color="#00D9FF"
    >
      <div className="overflow-auto h-full">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-white/10">
              <th className="text-left py-2 px-2">ID</th>
              <th className="text-left py-2 px-2">Address</th>
              <th className="text-left py-2 px-2">Type</th>
              <th className="text-left py-2 px-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {properties.slice(0, 6).map((p, i) => (
              <motion.tr
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-white/5 cursor-pointer hover:bg-cyan-500/10 transition-colors"
                onClick={() => onPropertyClick?.(p.id)}
              >
                <td className="py-2 px-2 text-cyan-400 font-mono">
                  #{p.id.slice(0, 4)}
                </td>
                <td className="py-2 px-2 text-white font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.5)] truncate max-w-[120px]">
                  {getVal(p.address?.streetAddress) || getVal(p.address?.fullAddress) || '—'}
                </td>
                <td className="py-2 px-2 text-gray-400">
                  {getVal(p.details?.propertyType) || 'SFH'}
                </td>
                <td className="py-2 px-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      getVal(p.address?.listingStatus) === 'Active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {getVal(p.address?.listingStatus) || 'Active'}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {properties.length === 0 && (
          <div className="text-gray-500 text-sm text-center py-8">
            No properties to display
          </div>
        )}

        {properties.length > 6 && (
          <div className="text-center text-gray-500 text-xs py-2">
            +{properties.length - 6} more properties
          </div>
        )}
      </div>
    </GlassChart>
  );
}

// A-3: Geo Density Heat - Heatmap by region
function GeoDensityHeat({ properties }: CategoryAProps) {
  // Group by zip code prefix for regional clustering
  const regions = new Map<string, number>();
  properties.forEach(p => {
    const zip = getVal(p.address?.zipCode) || '00000';
    const prefix = zip.slice(0, 3);
    regions.set(prefix, (regions.get(prefix) || 0) + 1);
  });

  const regionArray = Array.from(regions.entries()).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...regionArray.map(([, count]) => count), 1);

  return (
    <GlassChart
      title="Geo Density Heat"
      description="Property concentration by region"
      chartId="A-geo-density"
      color="#EF4444"
    >
      <div className="h-full flex flex-col justify-center">
        {/* Heat bars */}
        <div className="space-y-2">
          {regionArray.slice(0, 5).map(([region, count], i) => {
            const intensity = count / maxCount;
            const hue = 0; // Red hue
            const saturation = 70 + intensity * 30;
            const lightness = 50 - intensity * 20;

            return (
              <motion.div
                key={region}
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <span className="text-gray-400 text-xs font-mono w-12">
                  {region}xx
                </span>
                <div className="flex-1 h-6 rounded-lg overflow-hidden bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${intensity * 100}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="h-full rounded-lg flex items-center justify-end pr-2"
                    style={{
                      background: `linear-gradient(90deg, hsl(${hue}, ${saturation}%, ${lightness}%)30, hsl(${hue}, ${saturation}%, ${lightness}%))`,
                    }}
                  >
                    <span className="text-xs text-white font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]">{count}</span>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {regionArray.length === 0 && (
          <div className="text-gray-500 text-sm text-center">
            No geographic data available
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-red-400" />
            <span>High density</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-900/50" />
            <span>Low density</span>
          </div>
        </div>
      </div>
    </GlassChart>
  );
}

// Main Category A component
export default function CategoryA({ properties, onPropertyClick }: CategoryAProps) {
  return (
    <>
      <PinClusterOrbs properties={properties} onPropertyClick={onPropertyClick} />
      <IdentityMatrix properties={properties} onPropertyClick={onPropertyClick} />
      <GeoDensityHeat properties={properties} />
    </>
  );
}
