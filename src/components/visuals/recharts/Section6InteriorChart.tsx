/**
 * Section 6: Interior Features - Interior Condition Chart
 * Moved from Section 5 Perplexity charts
 *
 * Chart: Interior Condition breakdown
 * - Kitchen score
 * - Bathrooms score
 * - Living areas score
 * - Flooring score
 * - Overall interior score
 */

import { motion } from 'framer-motion';

// ============================================
// DATA INTERFACE
// ============================================
export interface Home {
  id: string;
  name: string;
  color: string;

  // Interior fields
  interiorCondition: string;
  kitchenFeatures?: string;
  flooringType?: string;
  fullBathrooms?: number;
  yearBuilt?: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function conditionToScore(condition: string | null): number {
  if (!condition) return 50;
  const c = condition.toUpperCase();
  if (c === 'EXCELLENT') return 95;
  if (c === 'GOOD') return 75;
  if (c === 'FAIR') return 50;
  if (c === 'POOR') return 25;
  return 50;
}

function getConditionColor(score: number): string {
  if (score >= 81) return '#4CAF50'; // Green
  if (score >= 61) return '#2196F3'; // Blue
  if (score >= 41) return '#FFEB3B'; // Yellow
  if (score >= 21) return '#FF9800'; // Orange
  return '#FF4444'; // Red
}

// ============================================
// INTERIOR CONDITION CHART
// ============================================
export default function InteriorConditionChart({ homes }: { homes: Home[] }) {
  const currentYear = new Date().getFullYear();
  const comparisonProperties = homes.slice(0, 3);

  const interiorComponents = [
    { key: 'kitchen', label: 'Kitchen' },
    { key: 'baths', label: 'Baths' },
    { key: 'living', label: 'Living' },
    { key: 'flooring', label: 'Floors' },
    { key: 'interior', label: 'Overall' },
  ];

  const propertyData = comparisonProperties.map((h, idx) => {
    const address = h.name.split(',')[0] || `Property ${idx + 1}`;
    const age = h.yearBuilt ? currentYear - h.yearBuilt : null;

    const scores = {
      kitchen: conditionToScore(h.kitchenFeatures ? 'GOOD' : null),
      baths: conditionToScore(h.fullBathrooms ? 'GOOD' : null),
      living: conditionToScore(h.interiorCondition),
      flooring: conditionToScore(h.flooringType ? 'GOOD' : null),
      interior: conditionToScore(h.interiorCondition),
    };

    return {
      id: h.id,
      label: `P${idx + 1}`,
      address: address.slice(0, 18),
      age,
      scores,
      color: h.color,
    };
  });

  const maxScore = Math.max(...propertyData.flatMap(p => Object.values(p.scores)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      {/* Chart ID Label */}
      <div className="absolute -top-3 left-3 text-xs font-mono text-gray-400">
        Chart 6-1
      </div>

      {/* Brain Widget */}
      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Smart</span>
        <span className="text-base font-bold" style={{ color: getConditionColor(maxScore) }}>
          {Math.round(maxScore)}
        </span>
      </div>

      <h3 className="text-xl font-semibold text-white mb-2">Chart 6-1: Interior Condition</h3>
      <p className="text-xs text-gray-400 mb-4">Kitchen, Baths, Living Areas, Flooring</p>

      <div className="space-y-4">
        {/* Header row */}
        <div className="grid grid-cols-5 gap-2 text-xs text-gray-400 font-bold px-1">
          {interiorComponents.map(c => (
            <div key={c.key} className="text-center">{c.label}</div>
          ))}
        </div>

        {/* Property rows */}
        {propertyData.map((prop, i) => (
          <motion.div
            key={prop.id}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="space-y-2"
          >
            {/* Score bars row */}
            <div className="grid grid-cols-5 gap-2 px-1">
              {interiorComponents.map(c => {
                const score = prop.scores[c.key as keyof typeof prop.scores];
                const barColor = getConditionColor(score);
                return (
                  <div key={c.key} className="flex flex-col items-center">
                    <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: barColor }}
                      />
                    </div>
                    <span className="text-xs font-bold mt-1" style={{ color: barColor }}>{score}</span>
                  </div>
                );
              })}
            </div>

            {/* Property address below */}
            <div className="flex items-center gap-2 px-1">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: prop.color, boxShadow: `0 0 6px ${prop.color}` }}
              />
              <span className="text-xs font-bold truncate" style={{ color: prop.color }}>
                {prop.label}: {prop.address}
              </span>
              <span className="text-xs text-white font-bold flex-shrink-0">
                {prop.age ? `(${prop.age}yr)` : ''}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 5-color Legend */}
      <div className="mt-4 pt-3 border-t border-white/10 flex justify-center flex-wrap gap-3 text-xs text-gray-400">
        <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />0-20</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1" />21-40</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1" />41-60</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />61-80</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />81-100</span>
      </div>
    </motion.div>
  );
}
