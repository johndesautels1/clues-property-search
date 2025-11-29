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
          <div className="text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">No location data available</div>
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

// A-3: Geo Density Heat - Full zip codes with prices and heat grid
function GeoDensityHeat({ properties, onPropertyClick }: CategoryAProps) {
  // Group by full zip code with price data
  const zipData = new Map<string, { count: number; totalPrice: number; properties: Property[] }>();

  properties.forEach(p => {
    const zip = getVal(p.address?.zipCode) || 'Unknown';
    const price = getVal(p.address?.listingPrice) || 0;

    if (!zipData.has(zip)) {
      zipData.set(zip, { count: 0, totalPrice: 0, properties: [] });
    }
    const data = zipData.get(zip)!;
    data.count++;
    data.totalPrice += price;
    data.properties.push(p);
  });

  // Convert to array and sort by count
  const zipArray = Array.from(zipData.entries())
    .map(([zip, data]) => ({
      zip,
      count: data.count,
      avgPrice: data.count > 0 ? data.totalPrice / data.count : 0,
      properties: data.properties,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const maxCount = Math.max(...zipArray.map(z => z.count), 1);
  const maxPrice = Math.max(...zipArray.map(z => z.avgPrice), 1);

  // Color scale based on price (blue = lower, red = higher)
  const getPriceColor = (price: number) => {
    const ratio = price / maxPrice;
    if (ratio < 0.33) return { bg: '#3B82F6', text: 'blue' }; // Blue - lower
    if (ratio < 0.66) return { bg: '#F59E0B', text: 'amber' }; // Amber - mid
    return { bg: '#EF4444', text: 'red' }; // Red - higher
  };

  return (
    <GlassChart
      title="Zip Code Heat Map"
      description="Property density & avg price by zip"
      chartId="A-geo-density"
      color="#EF4444"
      webAugmented
      webSource="Census/USPS"
    >
      <div className="h-full flex flex-col">
        {/* Heat grid visualization */}
        <div className="flex-1 grid grid-cols-3 gap-2 p-1">
          {zipArray.map((item, i) => {
            const intensity = item.count / maxCount;
            const priceColor = getPriceColor(item.avgPrice);

            return (
              <motion.div
                key={item.zip}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className="relative rounded-lg p-2 cursor-pointer group overflow-hidden"
                style={{
                  background: `${priceColor.bg}${Math.round(20 + intensity * 40).toString(16)}`,
                  border: `1px solid ${priceColor.bg}60`,
                }}
                onClick={() => item.properties[0] && onPropertyClick?.(item.properties[0].id)}
              >
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `radial-gradient(circle at center, ${priceColor.bg}40 0%, transparent 70%)`,
                  }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full">
                  {/* Zip code */}
                  <div className="text-white font-bold text-sm drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]">
                    {item.zip}
                  </div>

                  {/* Property count badge */}
                  <div
                    className="mt-1 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: `${priceColor.bg}80`,
                      color: '#fff',
                      textShadow: '0 0 4px rgba(0,0,0,0.5)'
                    }}
                  >
                    {item.count} {item.count === 1 ? 'prop' : 'props'}
                  </div>

                  {/* Avg price */}
                  <div className="mt-1 text-xs text-gray-200 font-medium drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
                    ${item.avgPrice >= 1000000
                      ? `${(item.avgPrice / 1000000).toFixed(1)}M`
                      : `${(item.avgPrice / 1000).toFixed(0)}K`}
                    <span className="text-gray-400 ml-0.5">avg</span>
                  </div>
                </div>

                {/* Heat intensity bar at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${intensity * 100}%` }}
                    transition={{ delay: i * 0.1 + 0.3, duration: 0.4 }}
                    className="h-full"
                    style={{ backgroundColor: priceColor.bg }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {zipArray.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
            No geographic data available
          </div>
        )}

        {/* Legend */}
        <div className="mt-2 flex items-center justify-center gap-4 text-xs text-gray-300 font-medium drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>Lower $</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span>Mid $</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-red-400" />
            <span>Higher $</span>
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
      <GeoDensityHeat properties={properties} onPropertyClick={onPropertyClick} />
    </>
  );
}
