/**
 * CLUES-Smart Scoring System
 * Universal scoring utility for all 175 charts
 * Converts raw property data into 0-100 scores with color bands
 */

export type ScoreBand = 'poor' | 'below-average' | 'average' | 'good' | 'excellent';

export interface ScoreResult {
  score: number; // 0-100
  band: ScoreBand;
  color: string;
  label: string;
}

/**
 * Score band thresholds (CLUES-Smart System)
 */
export const SCORE_BANDS = {
  poor: { min: 0, max: 20, color: '#ef4444', label: 'Poor' },           // Red
  'below-average': { min: 21, max: 40, color: '#f97316', label: 'Below Average' }, // Orange
  average: { min: 41, max: 60, color: '#eab308', label: 'Average' },    // Yellow
  good: { min: 61, max: 80, color: '#3b82f6', label: 'Good' },          // Blue
  excellent: { min: 81, max: 100, color: '#22c55e', label: 'Excellent' }, // Green
} as const;

/**
 * Property colors (consistent across all charts)
 */
export const PROPERTY_COLORS = {
  property1: '#22c55e', // 1821 Hillcrest = Green
  property2: '#8b5cf6', // 1947 Oakwood = Lavender
  property3: '#ec4899', // 725 Live Oak = Pink
} as const;

/**
 * Get score band from a 0-100 score
 */
export function getScoreBand(score: number): ScoreBand {
  const normalizedScore = Math.max(0, Math.min(100, score));

  if (normalizedScore <= 20) return 'poor';
  if (normalizedScore <= 40) return 'below-average';
  if (normalizedScore <= 60) return 'average';
  if (normalizedScore <= 80) return 'good';
  return 'excellent';
}

/**
 * Get score result with band, color, and label
 */
export function getScoreResult(score: number): ScoreResult {
  const band = getScoreBand(score);
  const { color, label } = SCORE_BANDS[band];

  return {
    score: Math.round(score),
    band,
    color,
    label,
  };
}

/**
 * Normalize values to 0-100 scale (higher is better)
 */
export function normalizeHigherIsBetter(values: number[]): number[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 50); // All equal = average
  return values.map((v) => ((v - min) / (max - min)) * 100);
}

/**
 * Normalize values to 0-100 scale (lower is better)
 */
export function normalizeLowerIsBetter(values: number[]): number[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 50); // All equal = average
  return values.map((v) => ((max - v) / (max - min)) * 100);
}

/**
 * Calculate weighted average score across multiple metrics
 */
export function calculateWeightedScore(
  scores: number[],
  weights?: number[]
): number {
  if (!scores.length) return 0;

  const actualWeights = weights || scores.map(() => 1); // Equal weights if not provided
  const totalWeight = actualWeights.reduce((sum, w) => sum + w, 0);

  if (totalWeight === 0) return 0;

  const weightedSum = scores.reduce((sum, score, i) => {
    return sum + (score * actualWeights[i]);
  }, 0);

  return weightedSum / totalWeight;
}

/**
 * Find the property with the best score
 */
export function findBestProperty<T extends { id: string }>(
  properties: T[],
  scores: number[]
): { property: T; score: number; index: number } | null {
  if (!properties.length || !scores.length) return null;

  let bestIndex = 0;
  let bestScore = scores[0];

  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > bestScore) {
      bestScore = scores[i];
      bestIndex = i;
    }
  }

  return {
    property: properties[bestIndex],
    score: bestScore,
    index: bestIndex,
  };
}

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  return `${Math.round(score)}/100`;
}

/**
 * Get property color by index
 */
export function getPropertyColor(index: number): string {
  const colors = [
    PROPERTY_COLORS.property1,
    PROPERTY_COLORS.property2,
    PROPERTY_COLORS.property3,
  ];
  return colors[index] || '#94a3b8'; // Gray fallback
}
