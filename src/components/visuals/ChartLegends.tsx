/**
 * Chart Legends
 * Dual legend system for all charts:
 * 1. Property Legend - shows addresses with property colors
 * 2. Score Legend - shows 5-color grading scale
 */

import { PROPERTY_COLORS_ARRAY, SCORE_RANGES, truncateAddress } from './visualConstants';
import type { ChartProperty } from '@/lib/visualsDataMapper';

interface PropertyLegendProps {
  properties: ChartProperty[];
  className?: string;
}

interface ScoreLegendProps {
  className?: string;
}

/**
 * Property Legend
 * Shows the 3 selected property addresses with their colors
 */
export function PropertyLegend({ properties, className = '' }: PropertyLegendProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 text-xs ${className}`}>
      <span className="text-gray-500 font-semibold uppercase tracking-wide">Properties:</span>
      {properties.map((prop, index) => (
        <div key={prop.id} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: PROPERTY_COLORS_ARRAY[index] }}
          />
          <span className="text-gray-300" title={prop.address}>
            {truncateAddress(prop.address, 40)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Score Legend
 * Shows the 5-color grading scale (1-100)
 */
export function ScoreLegend({ className = '' }: ScoreLegendProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 text-xs ${className}`}>
      <span className="text-gray-500 font-semibold uppercase tracking-wide">Score Scale:</span>
      {SCORE_RANGES.map((range) => (
        <div key={range.label} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: range.color }}
          />
          <span className="text-gray-300">
            {range.label} ({range.min}-{range.max})
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Dual Legend
 * Combines both property and score legends
 */
interface DualLegendProps {
  properties: ChartProperty[];
  showScoreLegend?: boolean;
  className?: string;
}

export function DualLegend({ properties, showScoreLegend = false, className = '' }: DualLegendProps) {
  return (
    <div className={`space-y-2 pt-4 border-t border-white/10 ${className}`}>
      <PropertyLegend properties={properties} />
      {showScoreLegend && <ScoreLegend />}
    </div>
  );
}

/**
 * Comparison Legend
 * Shows ranking colors for comparison charts
 */
interface ComparisonLegendProps {
  properties: ChartProperty[];
  rankings: number[]; // Array of ranks [1, 2, 3] corresponding to properties
  metric: string; // e.g., "Price", "Sqft", etc.
  higherIsBetter: boolean;
  className?: string;
}

export function ComparisonLegend({
  properties,
  rankings,
  metric,
  higherIsBetter,
  className = '',
}: ComparisonLegendProps) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return '#10B981'; // Green
    if (rank === 2) return '#FDE047'; // Yellow
    return '#EF4444'; // Red
  };

  const getRankLabel = (rank: number) => {
    if (rank === 1) return higherIsBetter ? 'Best' : 'Lowest';
    if (rank === 2) return '2nd';
    return '3rd';
  };

  return (
    <div className={`space-y-2 pt-4 border-t border-white/10 ${className}`}>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-gray-500 font-semibold uppercase tracking-wide">{metric} Ranking:</span>
        {properties.map((prop, index) => {
          const rank = rankings[index];
          const color = getRankColor(rank);
          const label = getRankLabel(rank);

          return (
            <div key={prop.id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
              <span className="text-gray-300" title={prop.address}>
                {label}: {truncateAddress(prop.address, 30)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
