/**
 * Property Comparison Selector
 * 3 dropdown fields for selecting properties to compare across all visuals
 * Positioned below SMART Score section
 */

import { motion } from 'framer-motion';
import { Building2, ChevronDown } from 'lucide-react';
import type { ChartProperty } from '@/lib/visualsDataMapper';

interface PropertyComparisonSelectorProps {
  properties: ChartProperty[];
  selectedProperties: [string | null, string | null, string | null];
  onPropertySelect: (index: 0 | 1 | 2, propertyId: string | null) => void;
}

const PROPERTY_COLORS = ['#00D9FF', '#8B5CF6', '#EC4899']; // Cyan, Purple, Pink
const PROPERTY_LABELS = ['Property 1', 'Property 2', 'Property 3'];

export default function PropertyComparisonSelector({
  properties,
  selectedProperties,
  onPropertySelect,
}: PropertyComparisonSelectorProps) {
  const getSelectedProperty = (index: number) => {
    const id = selectedProperties[index];
    return properties.find(p => p.id === id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-6 h-6 text-cyan-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Property Comparison</h3>
            <p className="text-xs text-gray-400">Select up to 3 properties to compare across all visuals</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((index) => {
            const selectedProp = getSelectedProperty(index);
            const color = PROPERTY_COLORS[index];

            return (
              <div key={index} className="relative">
                <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {PROPERTY_LABELS[index]}
                </label>

                <select
                  value={selectedProperties[index] || ''}
                  onChange={(e) => onPropertySelect(index as 0 | 1 | 2, e.target.value || null)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border-2 transition-all duration-200 appearance-none cursor-pointer text-sm font-semibold"
                  style={{
                    borderColor: selectedProp ? color : 'rgba(255,255,255,0.1)',
                    color: selectedProp ? color : '#FFFFFF',
                  }}
                >
                  <option value="" style={{ backgroundColor: '#1e293b', color: '#FFFFFF' }}>-- Select Property --</option>
                  {properties.map((prop) => (
                    <option key={prop.id} value={prop.id} style={{ backgroundColor: '#1e293b', color: '#FFFFFF' }}>
                      {prop.address} ({prop.city})
                    </option>
                  ))}
                </select>

                <ChevronDown
                  className="absolute right-3 top-[38px] w-4 h-4 pointer-events-none"
                  style={{ color: selectedProp ? color : '#9CA3AF' }}
                />

                {selectedProp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 p-3 rounded-lg bg-slate-900/30 border"
                    style={{ borderColor: `${color}40` }}
                  >
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Price:</span>
                        <span className="text-white font-semibold">
                          ${selectedProp.listingPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Beds/Baths:</span>
                        <span className="text-white font-semibold">
                          {selectedProp.bedrooms}bd / {selectedProp.bathrooms}ba
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sqft:</span>
                        <span className="text-white font-semibold">
                          {selectedProp.livingSqft.toLocaleString()} sqft
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* Property Color Legend */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-gray-400 font-medium">Property Colors:</span>
            {PROPERTY_COLORS.map((color, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                <span className="text-gray-300">{PROPERTY_LABELS[index]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
