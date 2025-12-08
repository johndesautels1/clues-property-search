/**
 * Visual Constants
 * Universal color system and constants for all charts
 * Based on CLUES SMART scoring system (1-100 scale)
 */

// ============================================================================
// PROPERTY COLORS (Consistent across all visuals)
// ============================================================================
export const PROPERTY_COLORS = {
  PROPERTY_1: '#00D9FF', // Cyan
  PROPERTY_2: '#8B5CF6', // Purple
  PROPERTY_3: '#EC4899', // Pink
} as const;

export const PROPERTY_COLORS_ARRAY = [
  PROPERTY_COLORS.PROPERTY_1,
  PROPERTY_COLORS.PROPERTY_2,
  PROPERTY_COLORS.PROPERTY_3,
];

export const PROPERTY_LABELS = ['Property 1', 'Property 2', 'Property 3'];

// ============================================================================
// UNIVERSAL SCORING COLORS (1-100 scale)
// ============================================================================
export const SCORE_COLORS = {
  EXCELLENT: '#10B981', // Green (81-100)
  GOOD: '#3B82F6',      // Blue (61-80)
  FAIR: '#FDE047',      // Yellow (41-60)
  POOR: '#F59E0B',      // Orange (21-40)
  BAD: '#EF4444',       // Red (0-20)
} as const;

export const SCORE_RANGES = [
  { min: 81, max: 100, color: SCORE_COLORS.EXCELLENT, label: 'Excellent', grade: 'A' },
  { min: 61, max: 80, color: SCORE_COLORS.GOOD, label: 'Good', grade: 'B' },
  { min: 41, max: 60, color: SCORE_COLORS.FAIR, label: 'Fair', grade: 'C' },
  { min: 21, max: 40, color: SCORE_COLORS.POOR, label: 'Poor', grade: 'D' },
  { min: 0, max: 20, color: SCORE_COLORS.BAD, label: 'Bad', grade: 'F' },
] as const;

// ============================================================================
// COMPARISON RANKING COLORS (Best/2nd/3rd)
// ============================================================================
export const RANKING_COLORS = {
  BEST: SCORE_COLORS.EXCELLENT,   // Green
  SECOND: SCORE_COLORS.FAIR,      // Yellow
  THIRD: SCORE_COLORS.BAD,        // Red
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get color based on 1-100 score
 */
export function getScoreColor(score: number): string {
  if (score >= 81) return SCORE_COLORS.EXCELLENT;
  if (score >= 61) return SCORE_COLORS.GOOD;
  if (score >= 41) return SCORE_COLORS.FAIR;
  if (score >= 21) return SCORE_COLORS.POOR;
  return SCORE_COLORS.BAD;
}

/**
 * Get color based on ranking (1st, 2nd, 3rd)
 */
export function getRankingColor(rank: number): string {
  if (rank === 1) return RANKING_COLORS.BEST;
  if (rank === 2) return RANKING_COLORS.SECOND;
  return RANKING_COLORS.THIRD;
}

/**
 * Get property color by index (0-2)
 */
export function getPropertyColor(index: number): string {
  return PROPERTY_COLORS_ARRAY[index] || PROPERTY_COLORS.PROPERTY_1;
}

/**
 * Rank properties by value (higher is better)
 * Returns array of indices sorted by rank
 */
export function rankPropertiesByValue(values: number[], higherIsBetter: boolean = true): number[] {
  const indexed = values.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => higherIsBetter ? b.val - a.val : a.val - b.val);
  return indexed.map(item => item.idx);
}

/**
 * Format currency
 */
export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value.toLocaleString()}`;
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Truncate address for chart display
 */
export function truncateAddress(address: string, maxLength: number = 30): string {
  if (address.length <= maxLength) return address;
  return address.substring(0, maxLength - 3) + '...';
}
