/**
 * Feature Comparison Matrix
 *
 * Grid showing which properties have which features
 * Pool, Deck, Smart Home, Fireplace, EV Charging, Beach Access
 */

import { motion } from 'framer-motion';
import {
  Waves,
  Palmtree,
  Zap,
  Flame,
  Car,
  Home,
  Check,
  X,
  LayoutGrid,
} from 'lucide-react';

interface Features {
  pool?: number;
  deck?: number;
  smartHome?: number;
  fireplace?: number;
  evCharging?: number;
  beachAccess?: number;
}

interface Property {
  id: string | number;
  address: string;
  features?: Features;
  [key: string]: any;
}

interface FeatureComparisonMatrixProps {
  properties: Property[];
}

function shortAddress(address: string): string {
  return address.split(',')[0] || address;
}

const FEATURE_CONFIG = [
  { key: 'pool', label: 'Pool', icon: Waves, color: '#00D9FF' },
  { key: 'deck', label: 'Deck/Patio', icon: Home, color: '#F59E0B' },
  { key: 'smartHome', label: 'Smart Home', icon: Zap, color: '#8B5CF6' },
  { key: 'fireplace', label: 'Fireplace', icon: Flame, color: '#EF4444' },
  { key: 'evCharging', label: 'EV Charging', icon: Car, color: '#10B981' },
  { key: 'beachAccess', label: 'Beach Access', icon: Palmtree, color: '#06B6D4' },
];

function hasFeature(property: Property, featureKey: string): boolean {
  const features = property.features || {};
  const value = features[featureKey as keyof Features];
  // Value of 100 means feature is present, or any truthy number > 0
  return value === 100 || value === 1 || (typeof value === 'number' && value > 0);
}

export default function FeatureComparisonMatrix({ properties }: FeatureComparisonMatrixProps) {
  if (properties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No properties to compare</p>
      </div>
    );
  }

  // Calculate feature counts
  const featureCounts = FEATURE_CONFIG.map(feature => ({
    ...feature,
    count: properties.filter(p => hasFeature(p, feature.key)).length,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <LayoutGrid className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-semibold">Feature Comparison</h3>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-gray-400 font-medium py-3 px-2 sticky left-0 bg-gray-900/50">
                Feature
              </th>
              {properties.map(p => (
                <th key={p.id} className="text-center text-gray-400 font-medium py-3 px-4 min-w-[120px]">
                  <span className="block truncate" title={p.address}>
                    {shortAddress(p.address)}
                  </span>
                </th>
              ))}
              <th className="text-center text-gray-400 font-medium py-3 px-4">
                Coverage
              </th>
            </tr>
          </thead>
          <tbody>
            {FEATURE_CONFIG.map((feature, i) => {
              const Icon = feature.icon;
              const count = featureCounts[i].count;
              const coverage = Math.round((count / properties.length) * 100);

              return (
                <motion.tr
                  key={feature.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="py-3 px-2 sticky left-0 bg-gray-900/50">
                    <div className="flex items-center gap-2">
                      <div
                        className="p-1.5 rounded-lg"
                        style={{ backgroundColor: `${feature.color}20` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: feature.color }} />
                      </div>
                      <span className="text-white text-sm">{feature.label}</span>
                    </div>
                  </td>
                  {properties.map(p => {
                    const has = hasFeature(p, feature.key);
                    return (
                      <td key={p.id} className="text-center py-3 px-4">
                        {has ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20">
                            <Check className="w-5 h-5 text-green-400" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-700/50">
                            <X className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${coverage}%`,
                            backgroundColor: feature.color,
                          }}
                        />
                      </div>
                      <span className="text-gray-400 text-sm">{count}/{properties.length}</span>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Row */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Property Feature Count</span>
          <div className="flex gap-4">
            {properties.map(p => {
              const featureCount = FEATURE_CONFIG.filter(f => hasFeature(p, f.key)).length;
              return (
                <div key={p.id} className="text-center">
                  <span className="text-white font-bold text-lg">{featureCount}</span>
                  <span className="text-gray-500 text-xs">/{FEATURE_CONFIG.length}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
