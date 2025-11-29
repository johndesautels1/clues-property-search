/**
 * Property Tabs - P1/P2/P3 comparison property selector
 * Shows the 3 properties being compared with their addresses
 */

import { motion } from 'framer-motion';
import { MapPin, Home, X } from 'lucide-react';
import type { Property } from '@/types/property';
import { PROPERTY_COLORS } from './chartColors';

interface PropertyTabsProps {
  properties: Property[];
  selectedIndex: number | null;
  onSelectProperty: (index: number | null) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

export default function PropertyTabs({
  properties,
  selectedIndex,
  onSelectProperty,
}: PropertyTabsProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  if (comparisonProperties.length === 0) {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
        <p className="text-gray-400 text-center text-sm">
          No properties to compare. Add properties from the Compare tab.
        </p>
      </div>
    );
  }

  const propertyColors = [PROPERTY_COLORS.P1, PROPERTY_COLORS.P2, PROPERTY_COLORS.P3];

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Home className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-400 font-medium">Comparing Properties</span>
        {selectedIndex !== null && (
          <button
            onClick={() => onSelectProperty(null)}
            className="ml-auto text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Show all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {comparisonProperties.map((property, idx) => {
          const color = propertyColors[idx];
          const isSelected = selectedIndex === idx;
          const address = getVal(property.address?.streetAddress) || `Property ${idx + 1}`;
          const city = getVal(property.address?.city) || '';
          const state = getVal(property.address?.state) || '';
          const price = getVal(property.address?.listingPrice);
          const sqft = getVal(property.details?.livingSqft);
          const beds = getVal(property.details?.bedrooms);
          const baths = getVal(property.details?.totalBathrooms);

          return (
            <motion.button
              key={property.id}
              onClick={() => onSelectProperty(isSelected ? null : idx)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative p-4 rounded-xl text-left transition-all"
              style={{
                background: isSelected ? `${color.hex}15` : 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${isSelected ? color.hex : 'rgba(255, 255, 255, 0.1)'}`,
                boxShadow: isSelected ? `0 0 0 2px ${color.hex}` : 'none',
              }}
            >
              {/* Property number badge */}
              <div
                className="absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: color.hex,
                  color: '#000',
                  boxShadow: `0 0 12px ${color.hex}80`,
                }}
              >
                P{idx + 1}
              </div>

              {/* Address */}
              <div className="ml-4">
                <div className="flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3" style={{ color: color.hex }} />
                  <span
                    className="font-bold text-sm truncate drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]"
                    style={{ color: color.hex }}
                  >
                    {address}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {city}{city && state ? ', ' : ''}{state}
                </p>

                {/* Quick stats */}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-300">
                  {price && (
                    <span className="font-medium">
                      ${(price / 1000000).toFixed(2)}M
                    </span>
                  )}
                  {sqft && (
                    <span>{sqft.toLocaleString()} sqft</span>
                  )}
                  {beds && baths && (
                    <span>{beds}bd/{baths}ba</span>
                  )}
                </div>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  layoutId="property-selection"
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    boxShadow: `0 0 20px ${color.hex}40`,
                  }}
                />
              )}
            </motion.button>
          );
        })}

        {/* Empty slots if less than 3 properties */}
        {Array.from({ length: 3 - comparisonProperties.length }).map((_, idx) => (
          <div
            key={`empty-${idx}`}
            className="p-4 rounded-xl border border-dashed border-white/10 flex items-center justify-center"
          >
            <span className="text-gray-500 text-sm">
              Add property from Compare tab
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
