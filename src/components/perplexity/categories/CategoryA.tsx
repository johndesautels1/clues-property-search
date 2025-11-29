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

// Normalize city names to handle variations like "Saint" vs "St.", "Mount" vs "Mt.", etc.
function normalizeCity(city: string): string {
  return city
    .replace(/^St\.?\s+/i, 'Saint ')
    .replace(/^Mt\.?\s+/i, 'Mount ')
    .replace(/^Ft\.?\s+/i, 'Fort ')
    .replace(/^N\.?\s+/i, 'North ')
    .replace(/^S\.?\s+/i, 'South ')
    .replace(/^E\.?\s+/i, 'East ')
    .replace(/^W\.?\s+/i, 'West ')
    .trim();
}

// A-1: Pin Cluster Orbs - Scatter visualization
function PinClusterOrbs({ properties, onPropertyClick }: CategoryAProps) {
  // Group properties by city for clustering (normalize city names)
  const clusters = new Map<string, Property[]>();
  const displayNames = new Map<string, string>(); // Store original display name

  properties.forEach(p => {
    const rawCity = getVal(p.address?.city) || 'Unknown';
    const normalizedCity = normalizeCity(rawCity);

    if (!clusters.has(normalizedCity)) {
      clusters.set(normalizedCity, []);
      displayNames.set(normalizedCity, rawCity); // Keep first occurrence as display name
    }
    clusters.get(normalizedCity)!.push(p);
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
      <div className="relative w-full h-full flex items-start justify-center overflow-auto pt-2">
        {/* Cluster visualization */}
        <div className="flex flex-wrap gap-6 justify-center items-start px-4 py-2">
          {clusterArray.map(([normalizedCity, props], i) => {
            const size = 50 + (props.length / maxCount) * 50;
            const colors = ['#10B981', '#00D9FF', '#8B5CF6', '#F59E0B', '#EF4444'];
            const color = colors[i % colors.length];
            const displayCity = displayNames.get(normalizedCity) || normalizedCity;

            return (
              <motion.div
                key={normalizedCity}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => props[0] && onPropertyClick?.(props[0].id)}
              >
                {/* Orb container */}
                <div className="relative">
                  {/* Outer glow */}
                  <div
                    className="absolute inset-0 rounded-full blur-xl opacity-50"
                    style={{
                      backgroundColor: color,
                      width: size,
                      height: size,
                    }}
                  />

                  {/* Main orb - only count inside */}
                  <div
                    className="relative rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{
                      width: size,
                      height: size,
                      background: `radial-gradient(circle at 30% 30%, ${color}60, ${color}20)`,
                      border: `2px solid ${color}`,
                      boxShadow: `0 0 20px ${color}40`,
                    }}
                  >
                    <div className="text-white font-bold text-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]">
                      {props.length}
                    </div>
                  </div>
                </div>

                {/* City name below orb */}
                <div
                  className="mt-3 text-center max-w-[100px]"
                  style={{ color }}
                >
                  <div className="text-xs font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.5)] whitespace-nowrap overflow-hidden text-ellipsis">
                    {displayCity}
                  </div>
                  <div className="text-xs text-gray-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
                    {props.length} {props.length === 1 ? 'property' : 'properties'}
                  </div>
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

// Shorten property type for display
function shortenPropertyType(type: string | null): string {
  if (!type) return 'SFH';
  const lower = type.toLowerCase();
  if (lower.includes('single') || lower.includes('sfh')) return 'SFH';
  if (lower.includes('condo')) return 'Condo';
  if (lower.includes('townhouse') || lower.includes('town')) return 'Town';
  if (lower.includes('multi')) return 'Multi';
  if (lower.includes('land') || lower.includes('lot')) return 'Land';
  if (lower.includes('commercial')) return 'Comm';
  return type.slice(0, 8);
}

// A-2: Identity Matrix - Table with hover glow
function IdentityMatrix({ properties, onPropertyClick }: CategoryAProps) {
  // Deduplicate properties by address to avoid showing same property twice
  const seen = new Set<string>();
  const uniqueProperties = properties.filter(p => {
    const addr = getVal(p.address?.streetAddress) || getVal(p.address?.fullAddress) || p.id;
    if (seen.has(addr)) return false;
    seen.add(addr);
    return true;
  });

  return (
    <GlassChart
      title="Identity Matrix"
      description={`${uniqueProperties.length} properties - scroll to see all`}
      chartId="A-identity-matrix"
      color="#00D9FF"
    >
      <div className="overflow-y-auto h-full scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-black/50 backdrop-blur-sm z-10">
            <tr className="text-gray-300 font-bold border-b border-white/10 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
              <th className="text-left py-2 px-1 w-12">#</th>
              <th className="text-left py-2 px-1">Address</th>
              <th className="text-left py-2 px-1 w-14">Type</th>
              <th className="text-left py-2 px-1 w-16">Status</th>
            </tr>
          </thead>
          <tbody>
            {uniqueProperties.map((p, i) => (
              <motion.tr
                key={`${p.id}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="border-b border-white/5 cursor-pointer hover:bg-cyan-500/10 transition-colors"
                onClick={() => onPropertyClick?.(p.id)}
              >
                <td className="py-2 px-1 text-cyan-400 font-mono font-bold drop-shadow-[0_0_4px_rgba(0,217,255,0.5)]">
                  {i + 1}
                </td>
                <td className="py-2 px-1 text-white font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]">
                  <div className="truncate max-w-[140px]">
                    {getVal(p.address?.streetAddress) || getVal(p.address?.fullAddress) || '—'}
                  </div>
                </td>
                <td className="py-2 px-1 text-gray-300 font-medium drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
                  {shortenPropertyType(getVal(p.details?.propertyType))}
                </td>
                <td className="py-2 px-1">
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                      getVal(p.address?.listingStatus) === 'Active'
                        ? 'bg-green-500/30 text-green-400 drop-shadow-[0_0_4px_rgba(34,197,94,0.5)]'
                        : getVal(p.address?.listingStatus) === 'For Sale'
                        ? 'bg-blue-500/30 text-blue-400 drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]'
                        : 'bg-gray-500/30 text-gray-300 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]'
                    }`}
                  >
                    {getVal(p.address?.listingStatus) || 'Active'}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {uniqueProperties.length === 0 && (
          <div className="text-gray-300 font-medium text-sm text-center py-8 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
            No properties to display
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
                <span className="text-gray-300 text-xs font-mono font-bold w-12 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
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
          <div className="text-gray-300 font-medium text-sm text-center drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
            No geographic data available
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-300 font-medium drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
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
