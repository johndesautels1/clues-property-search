/**
 * CLUES Brand Color System for Charts
 *
 * Two distinct color systems to avoid confusion:
 * 1. INDEX COLORS - For scored metrics (5-tier, 20-point increments)
 * 2. PROPERTY COLORS - For identifying comparison properties
 *
 * INDEX: RED -> ORANGE -> YELLOW -> BLUE -> GREEN (bad to good)
 * or reversed for metrics where higher = worse (crime, risk)
 */

// ============================================
// INDEX COLORS (5-tier rating scale)
// Used for: crime, safety, risk, quality scores, etc.
// Score ranges: 0-20, 21-40, 41-60, 61-80, 81-100
// ============================================

export const INDEX_COLORS = {
  // Score 0-20: Bad/Poor
  RED: {
    hex: '#EF4444',
    rgb: 'rgb(239, 68, 68)',
    rgba: (alpha: number) => `rgba(239, 68, 68, ${alpha})`,
  },
  // Score 21-40: Fairly Bad
  ORANGE: {
    hex: '#F97316',
    rgb: 'rgb(249, 115, 22)',
    rgba: (alpha: number) => `rgba(249, 115, 22, ${alpha})`,
  },
  // Score 41-60: Neutral
  YELLOW: {
    hex: '#EAB308',
    rgb: 'rgb(234, 179, 8)',
    rgba: (alpha: number) => `rgba(234, 179, 8, ${alpha})`,
  },
  // Score 61-80: Fairly Good
  BLUE: {
    hex: '#3B82F6',
    rgb: 'rgb(59, 130, 246)',
    rgba: (alpha: number) => `rgba(59, 130, 246, ${alpha})`,
  },
  // Score 81-100: Good/Excellent
  GREEN: {
    hex: '#22C55E',
    rgb: 'rgb(34, 197, 94)',
    rgba: (alpha: number) => `rgba(34, 197, 94, ${alpha})`,
  },
};

// Array for easy iteration (bad to good)
export const INDEX_SCALE = [
  INDEX_COLORS.RED,
  INDEX_COLORS.ORANGE,
  INDEX_COLORS.YELLOW,
  INDEX_COLORS.BLUE,
  INDEX_COLORS.GREEN,
];

// Array for reversed iteration (good to bad) - use for metrics where higher = worse
export const INDEX_SCALE_REVERSED = [
  INDEX_COLORS.GREEN,
  INDEX_COLORS.BLUE,
  INDEX_COLORS.YELLOW,
  INDEX_COLORS.ORANGE,
  INDEX_COLORS.RED,
];

/**
 * Get index color based on score (0-100)
 * @param score - Value from 0-100
 * @param reversed - If true, higher scores are bad (like crime index)
 */
export function getIndexColor(score: number, reversed = false): typeof INDEX_COLORS.RED {
  const scale = reversed ? INDEX_SCALE_REVERSED : INDEX_SCALE;

  if (score <= 20) return scale[0];
  if (score <= 40) return scale[1];
  if (score <= 60) return scale[2];
  if (score <= 80) return scale[3];
  return scale[4];
}

/**
 * Get index color for a normalized value (0-1)
 */
export function getIndexColorNormalized(value: number, reversed = false): typeof INDEX_COLORS.RED {
  return getIndexColor(value * 100, reversed);
}

// ============================================
// PROPERTY COLORS (for 3 comparison properties)
// Distinct from index colors to avoid confusion
// ============================================

export const PROPERTY_COLORS = {
  // Property 1 - Emerald/Teal (distinct from index green)
  P1: {
    hex: '#10B981',
    rgb: 'rgb(16, 185, 129)',
    rgba: (alpha: number) => `rgba(16, 185, 129, ${alpha})`,
    name: 'Emerald',
  },
  // Property 2 - Cyan/Electric Blue (distinct from index blue)
  P2: {
    hex: '#00D9FF',
    rgb: 'rgb(0, 217, 255)',
    rgba: (alpha: number) => `rgba(0, 217, 255, ${alpha})`,
    name: 'Cyan',
  },
  // Property 3 - Bright Fuchsia/Magenta (high contrast, distinct from index)
  P3: {
    hex: '#E879F9',
    rgb: 'rgb(232, 121, 249)',
    rgba: (alpha: number) => `rgba(232, 121, 249, ${alpha})`,
    name: 'Fuchsia',
  },
};

// Array for easy iteration
export const PROPERTY_SCALE = [
  PROPERTY_COLORS.P1,
  PROPERTY_COLORS.P2,
  PROPERTY_COLORS.P3,
];

/**
 * Get property color by index (0, 1, or 2)
 */
export function getPropertyColor(index: number): typeof PROPERTY_COLORS.P1 {
  return PROPERTY_SCALE[index % 3];
}

// ============================================
// Chart.js compatible format
// ============================================

export const CHARTJS_PROPERTY_COLORS = PROPERTY_SCALE.map(c => ({
  backgroundColor: c.rgba(0.85),
  borderColor: c.hex,
  hoverBackgroundColor: c.rgba(1),
  hoverBorderColor: c.hex,
}));

export const CHARTJS_INDEX_COLORS = INDEX_SCALE.map(c => ({
  backgroundColor: c.rgba(0.85),
  borderColor: c.hex,
  hoverBackgroundColor: c.rgba(1),
  hoverBorderColor: c.hex,
}));

// ============================================
// Legacy support - for gradual migration
// ============================================

export const LEGACY_PROPERTY_COLORS = [
  { bg: 'rgba(16, 185, 129, 0.85)', border: '#10B981', name: 'emerald' },
  { bg: 'rgba(0, 217, 255, 0.85)', border: '#00D9FF', name: 'cyan' },
  { bg: 'rgba(232, 121, 249, 0.85)', border: '#E879F9', name: 'fuchsia' },
];

// ============================================
// Helper Functions for Property Data
// ============================================

/**
 * Calculate price per sqft with fallback
 * Tries pricePerSqft field first, then calculates from listingPrice/livingSqft
 */
export function calcPricePerSqft(
  pricePerSqftValue: number | null | undefined,
  listingPrice: number | null | undefined,
  livingSqft: number | null | undefined
): number {
  // Try direct value first
  if (pricePerSqftValue && pricePerSqftValue > 0) {
    return pricePerSqftValue;
  }
  // Calculate from price/sqft
  if (listingPrice && livingSqft && listingPrice > 0 && livingSqft > 0) {
    return listingPrice / livingSqft;
  }
  return 0;
}
