/**
 * Category 07: Exterior Features
 * Fields 54-58 + 168: Pool, Deck, Fence, Landscaping, Exterior Amenities
 *
 * ✅ ChartsReadme.md Requirements:
 * - Uses only 3 selected properties from dropdown
 * - Property-specific colors (Green #22c55e, Lavender #8b5cf6, Pink #ec4899)
 * - CLUES-Smart scoring system (0-100 with 5-tier colors)
 * - Enhanced canvas animations
 * - Field numbers in titles
 * - Mobile responsive
 *
 * Contains 5 animated canvas charts:
 * 1. Helix Analysis - 6 quality scores in rotating DNA helix
 * 2. Orbital Gravity - Composite score visualization
 * 3. ISO-Layer Stack - Layered factor comparison
 * 6. Amenity Radial - 8 binary exterior features
 * 9. Connection Web - Amenity ownership network
 */

import { motion } from 'framer-motion';
import type { ChartProperty } from '@/lib/visualsDataMapper';
import { mapToExteriorChartsData } from '@/lib/exteriorFeaturesMapper';
import ExteriorChartsCanvas from './exterior/ExteriorChartsCanvas';

interface CategoryProps {
  properties: ChartProperty[];
}

export default function Category07_ExteriorFeatures({ properties }: CategoryProps) {
  // Limit to 3 selected properties
  const compareProps = properties.slice(0, 3);

  if (compareProps.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Please select at least one property to compare
      </div>
    );
  }

  // Transform properties into chart format
  const chartData = mapToExteriorChartsData(compareProps);

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-xl border border-white/10 rounded-xl"
      >
        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
        <div>
          <span className="text-base font-bold text-white">
            Section 7: Exterior Features - Advanced Analytics
          </span>
          <p className="text-xs text-gray-300 mt-1">
            Fields 54-58 + 168 • 5 Animated Canvas Charts • {compareProps.length} {compareProps.length === 1 ? 'Property' : 'Properties'}
          </p>
        </div>
      </motion.div>

      {/* Data Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['p1', 'p2', 'p3'] as const).slice(0, compareProps.length).map((propId, idx) => {
          const prop = chartData.properties[propId];
          const score = chartData.totalScores[propId];
          const amenityCount = chartData.amenityCounts[propId];

          // Score tier
          const tier = score >= 81 ? { color: '#4CAF50', label: 'Excellent' } :
                      score >= 61 ? { color: '#2196F3', label: 'Good' } :
                      score >= 41 ? { color: '#EAB308', label: 'Average' } :
                      score >= 21 ? { color: '#FF9800', label: 'Fair' } :
                                   { color: '#FF4444', label: 'Poor' };

          return (
            <motion.div
              key={propId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="p-5 rounded-xl backdrop-blur-xl border border-white/10"
              style={{
                background: `linear-gradient(135deg, ${prop.color}15, rgba(0,0,0,0.3))`,
                borderColor: `${prop.color}40`
              }}
            >
              {/* Property name */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: prop.color }}
                />
                <span className="text-sm font-bold text-white">{prop.name}</span>
              </div>

              {/* Total score */}
              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-1">Exterior Quality Score</div>
                <div className="flex items-end gap-2">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: tier.color }}
                  >
                    {score}
                  </span>
                  <span className="text-gray-400 text-sm mb-1">/100</span>
                </div>
                <div
                  className="text-xs font-semibold mt-1"
                  style={{ color: tier.color }}
                >
                  {tier.label}
                </div>
              </div>

              {/* Amenity count */}
              <div className="pt-3 border-t border-white/10">
                <div className="text-xs text-gray-400">Exterior Amenities</div>
                <div className="text-lg font-bold text-white">
                  {amenityCount}<span className="text-sm text-gray-400">/8</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Canvas Charts */}
      <ExteriorChartsCanvas data={chartData} />

      {/* Data Fields Reference */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-white/10 rounded-xl"
      >
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <span className="text-lg">📊</span>
          Data Sources: Exterior Features Fields
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-300">
          <div>
            <p className="font-semibold text-cyan-300 mb-2">Quality Scores (Charts 1-3)</p>
            <ul className="space-y-1 text-[11px]">
              <li><strong>Curb Appeal:</strong> Calculated from year built, exterior material, property type</li>
              <li><strong>Landscaping:</strong> Field 58 + quality scoring algorithm</li>
              <li><strong>Design:</strong> Calculated from architectural features</li>
              <li><strong>Deck/Patio:</strong> Field 56 + quality scoring</li>
              <li><strong>Pool:</strong> Fields 54-55 + type scoring</li>
              <li><strong>Fence:</strong> Field 57 + quality scoring</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-purple-300 mb-2">Binary Amenities (Charts 6 & 9)</p>
            <ul className="space-y-1 text-[11px]">
              <li><strong>Field 168:</strong> Exterior Features (multiselect)</li>
              <li>• Balcony</li>
              <li>• Outdoor Shower</li>
              <li>• Sidewalk</li>
              <li>• Sliding Doors</li>
              <li>• Hurricane Shutters</li>
              <li>• Sprinkler System</li>
              <li>• Outdoor Kitchen</li>
              <li>• Private Dock</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-yellow-200 text-xs">
            ⚡ All scores calculated from Source of Truth: Stellar MLS + verified APIs + Perplexity LLM analysis. No hallucinated data.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
