/**
 * CLUES Score Normalization Utility
 *
 * Converts external API scores to CLUES 0-100 scale where:
 * - 0-20: RED (Bad/Poor)
 * - 21-40: ORANGE (Fairly Bad)
 * - 41-60: YELLOW (Neutral)
 * - 61-80: BLUE (Fairly Good)
 * - 81-100: GREEN (Good/Excellent)
 *
 * IMPORTANT: All functions normalize to "higher = better" for CLUES display.
 *
 * Sources verified:
 * - Walk Score: https://www.walkscore.com/methodology.shtml
 * - HowLoud Soundscore: https://howloud.com/soundscore/
 * - EPA AQI: https://www.airnow.gov/aqi/aqi-basics/
 * - NeighborhoodScout: https://help.neighborhoodscout.com/support/solutions/articles/25000001997
 * - FEMA Flood Zones: https://www.fema.gov/about/glossary/flood-zones
 * - GreatSchools: https://www.greatschools.org/gk/about/ratings/
 * - First Street Flood Factor: https://help.firststreet.org/hc/en-us/articles/360047585694
 */

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Map a value from one range to another
 */
function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// ============================================
// LOCATION & WALKABILITY SCORES
// Higher = Better (No Inversion Needed)
// ============================================

/**
 * Walk Score (0-100)
 * Source: walkscore.com
 * Native scale: 0-100 where 90-100 = "Walker's Paradise"
 * CLUES: Direct use - no conversion needed
 */
export function normalizeWalkScore(score: number | null): number {
  if (score === null || score === undefined) return 50; // Default neutral
  return clamp(Math.round(score), 0, 100);
}

/**
 * Transit Score (0-100)
 * Source: walkscore.com
 * Native scale: 0-100 where 90-100 = "Excellent Transit"
 * CLUES: Direct use - no conversion needed
 */
export function normalizeTransitScore(score: number | null): number {
  if (score === null || score === undefined) return 50;
  return clamp(Math.round(score), 0, 100);
}

/**
 * Bike Score (0-100)
 * Source: walkscore.com
 * Native scale: 0-100 where 90-100 = "Biker's Paradise"
 * CLUES: Direct use - no conversion needed
 */
export function normalizeBikeScore(score: number | null): number {
  if (score === null || score === undefined) return 50;
  return clamp(Math.round(score), 0, 100);
}

// ============================================
// NOISE & SOUND SCORES
// ============================================

/**
 * HowLoud Soundscore (50-100)
 * Source: howloud.com
 * Native scale: 50 (very loud) to 100 (very quiet)
 * CLUES: Map 50-100 → 0-100 (100 = quiet = good)
 */
export function normalizeSoundscore(score: number | null): number {
  if (score === null || score === undefined) return 50;
  // Map 50-100 to 0-100
  const normalized = mapRange(clamp(score, 50, 100), 50, 100, 0, 100);
  return Math.round(normalized);
}

/**
 * Noise Level in Decibels (dB)
 * Typical range: 30 dB (quiet) to 90 dB (very loud)
 * CLUES: Invert - lower dB = higher score
 */
export function normalizeNoiseLevel(db: number | null): number {
  if (db === null || db === undefined) return 50;
  // Map 30-90 dB to 100-0 (inverted)
  const clamped = clamp(db, 30, 90);
  const normalized = mapRange(clamped, 30, 90, 100, 0);
  return Math.round(normalized);
}

// ============================================
// SAFETY & CRIME SCORES
// ============================================

/**
 * NeighborhoodScout Crime Index (0-100)
 * Source: neighborhoodscout.com
 * Native scale: 0-100 where 100 = SAFEST (safer than 100% of neighborhoods)
 * CLUES: Direct use - already correct! Higher = safer = good
 */
export function normalizeNeighborhoodScoutCrime(score: number | null): number {
  if (score === null || score === undefined) return 50;
  return clamp(Math.round(score), 0, 100);
}

/**
 * Generic Crime Rate (per 1,000 population)
 * Higher crime rate = worse
 * CLUES: Invert - typical range 0-100 per 1,000
 */
export function normalizeCrimeRate(ratePerThousand: number | null): number {
  if (ratePerThousand === null || ratePerThousand === undefined) return 50;
  // Assume typical range 0-50 per 1,000
  const clamped = clamp(ratePerThousand, 0, 50);
  const normalized = mapRange(clamped, 0, 50, 100, 0);
  return Math.round(normalized);
}

/**
 * Safety Rating Text to Score
 * Converts categorical safety ratings to CLUES score
 */
export function normalizeSafetyRating(rating: string | null): number {
  if (!rating) return 50;
  const r = rating.toUpperCase().trim();

  if (r.includes('VERY LOW') || r.includes('MINIMAL') || r === 'VERY SAFE') return 95;
  if (r.includes('LOW') || r === 'SAFE') return 80;
  if (r.includes('MODERATE') || r.includes('MOD') || r === 'AVERAGE') return 55;
  if (r.includes('HIGH') && !r.includes('VERY')) return 30;
  if (r.includes('VERY HIGH') || r.includes('SEVERE') || r.includes('EXTREME')) return 10;

  return 50; // Default neutral
}

// ============================================
// ENVIRONMENTAL SCORES
// ============================================

/**
 * EPA Air Quality Index (AQI) (0-500)
 * Source: airnow.gov
 * Native scale: 0-50 = Good, 51-100 = Moderate, 101-150 = Unhealthy for Sensitive,
 *               151-200 = Unhealthy, 201-300 = Very Unhealthy, 301-500 = Hazardous
 * CLUES: Invert - lower AQI = better air quality
 */
export function normalizeAQI(aqi: number | null): number {
  if (aqi === null || aqi === undefined) return 75; // Assume decent air

  // Map AQI to CLUES score (inverted)
  if (aqi <= 50) return 95;      // Good → GREEN
  if (aqi <= 100) return 75;     // Moderate → BLUE
  if (aqi <= 150) return 55;     // Unhealthy for Sensitive → YELLOW
  if (aqi <= 200) return 35;     // Unhealthy → ORANGE
  if (aqi <= 300) return 15;     // Very Unhealthy → RED
  return 5;                       // Hazardous → Deep RED
}

/**
 * First Street Flood Factor (1-10)
 * Source: firststreet.org
 * Native scale: 1 = Minimal risk, 10 = Extreme risk
 * CLUES: Invert - lower flood factor = safer
 */
export function normalizeFloodFactor(factor: number | null): number {
  if (factor === null || factor === undefined) return 80; // Assume low risk
  const clamped = clamp(factor, 1, 10);
  // Map 1-10 to 100-0 (inverted)
  const normalized = mapRange(clamped, 1, 10, 100, 10);
  return Math.round(normalized);
}

/**
 * FEMA Flood Zone to Score
 * Source: fema.gov
 * Zones: X (unshaded) = minimal, X (shaded) = moderate, A/AE = high, V/VE = very high
 */
export function normalizeFEMAFloodZone(zone: string | null): number {
  if (!zone) return 80; // Assume low risk if unknown
  const z = zone.toUpperCase().trim();

  // Minimal risk zones
  if (z === 'X' || z === 'C') return 95;

  // Moderate risk zones (shaded X or B)
  if (z === 'X SHADED' || z === 'B' || z.includes('SHADED')) return 70;

  // High risk zones (A types)
  if (z.startsWith('A') || z === 'AE' || z === 'AH' || z === 'AO') return 35;

  // Very high risk coastal zones (V types)
  if (z.startsWith('V') || z === 'VE') return 15;

  // Undetermined
  if (z === 'D') return 50;

  return 50; // Default neutral
}

/**
 * Generic Risk Level Text to Score
 * Converts categorical risk levels to CLUES score
 */
export function normalizeRiskLevel(risk: string | null): number {
  if (!risk) return 50;
  const r = risk.toUpperCase().trim();

  if (r === 'NONE' || r === 'MINIMAL' || r.includes('VERY LOW')) return 95;
  if (r === 'LOW' || r === 'MINOR') return 80;
  if (r === 'MODERATE' || r === 'MOD' || r === 'MEDIUM') return 55;
  if (r === 'HIGH' || r === 'SIGNIFICANT') return 30;
  if (r === 'VERY HIGH' || r === 'SEVERE' || r === 'EXTREME') return 10;

  return 50;
}

// ============================================
// SCHOOL RATINGS
// ============================================

/**
 * GreatSchools Rating (1-10)
 * Source: greatschools.org
 * Native scale: 1-10 where 10 = best school
 * CLUES: Multiply by 10 to get 0-100
 */
export function normalizeSchoolRating(rating: number | null): number {
  if (rating === null || rating === undefined) return 50;
  const clamped = clamp(rating, 1, 10);
  return Math.round(clamped * 10);
}

/**
 * School Rating from text (e.g., "8/10" or "A+" grade)
 */
export function normalizeSchoolRatingText(rating: string | null): number {
  if (!rating) return 50;

  // Try to parse "X/10" format
  const match = rating.match(/(\d+)\s*\/\s*10/);
  if (match) {
    return normalizeSchoolRating(parseInt(match[1]));
  }

  // Try letter grades
  const grade = rating.toUpperCase().trim();
  if (grade.startsWith('A+') || grade === 'A+') return 98;
  if (grade.startsWith('A') || grade === 'A') return 93;
  if (grade.startsWith('A-') || grade === 'A-') return 90;
  if (grade.startsWith('B+') || grade === 'B+') return 87;
  if (grade.startsWith('B') || grade === 'B') return 83;
  if (grade.startsWith('B-') || grade === 'B-') return 80;
  if (grade.startsWith('C+') || grade === 'C+') return 77;
  if (grade.startsWith('C') || grade === 'C') return 73;
  if (grade.startsWith('C-') || grade === 'C-') return 70;
  if (grade.startsWith('D') || grade === 'D') return 65;
  if (grade.startsWith('F') || grade === 'F') return 50;

  // Try to parse just a number
  const num = parseInt(rating);
  if (!isNaN(num)) {
    if (num <= 10) return normalizeSchoolRating(num);
    if (num <= 100) return num;
  }

  return 50;
}

// ============================================
// FINANCIAL METRICS
// Note: These are context-dependent, not pure good/bad
// ============================================

/**
 * Cap Rate to Score
 * Higher cap rate = higher return BUT higher risk
 * This is NOT a simple good/bad metric - use with caution
 * For display purposes, we treat higher as "more opportunity"
 * Typical range: 3-12%
 */
export function normalizeCapRate(capRate: number | null): number {
  if (capRate === null || capRate === undefined) return 50;
  // Map 3-10% to 20-90 (not full range since it's risk/reward tradeoff)
  const clamped = clamp(capRate, 3, 10);
  const normalized = mapRange(clamped, 3, 10, 30, 85);
  return Math.round(normalized);
}

/**
 * Rental Yield to Score
 * Higher yield = better for investors
 * Typical range: 2-10%
 */
export function normalizeRentalYield(yieldPct: number | null): number {
  if (yieldPct === null || yieldPct === undefined) return 50;
  const clamped = clamp(yieldPct, 2, 10);
  const normalized = mapRange(clamped, 2, 10, 20, 95);
  return Math.round(normalized);
}

// ============================================
// PROPERTY CONDITION
// ============================================

/**
 * Property Condition Text to Score
 */
export function normalizeCondition(condition: string | null): number {
  if (!condition) return 50;
  const c = condition.toUpperCase().trim();

  if (c === 'EXCELLENT' || c === 'NEW' || c === 'PRISTINE') return 95;
  if (c === 'VERY GOOD') return 85;
  if (c === 'GOOD') return 75;
  if (c === 'FAIR' || c === 'AVERAGE') return 55;
  if (c === 'POOR' || c === 'BELOW AVERAGE') return 30;
  if (c === 'VERY POOR' || c === 'NEEDS WORK') return 15;

  return 50;
}

/**
 * Property Age to Condition Estimate
 * Newer = generally better condition
 */
export function normalizePropertyAge(yearBuilt: number | null): number {
  if (yearBuilt === null || yearBuilt === undefined) return 50;

  const currentYear = new Date().getFullYear();
  const age = currentYear - yearBuilt;

  if (age <= 0) return 95;      // New construction
  if (age <= 5) return 90;      // Nearly new
  if (age <= 10) return 80;     // Recent
  if (age <= 20) return 70;     // Established
  if (age <= 30) return 60;     // Mature
  if (age <= 50) return 45;     // Older
  if (age <= 75) return 30;     // Historic
  return 20;                     // Very old
}

// ============================================
// MASTER NORMALIZATION FUNCTION
// ============================================

export type MetricType =
  | 'walkScore' | 'transitScore' | 'bikeScore'
  | 'soundscore' | 'noiseLevel'
  | 'neighborhoodScoutCrime' | 'crimeRate' | 'safetyRating'
  | 'aqi' | 'floodFactor' | 'femaFloodZone' | 'riskLevel'
  | 'schoolRating' | 'schoolRatingText'
  | 'capRate' | 'rentalYield'
  | 'condition' | 'propertyAge';

/**
 * Master normalization function
 * Automatically routes to the correct normalizer based on metric type
 */
export function normalizeScore(
  value: number | string | null,
  metricType: MetricType
): number {
  switch (metricType) {
    // Location scores
    case 'walkScore': return normalizeWalkScore(value as number);
    case 'transitScore': return normalizeTransitScore(value as number);
    case 'bikeScore': return normalizeBikeScore(value as number);

    // Noise
    case 'soundscore': return normalizeSoundscore(value as number);
    case 'noiseLevel': return normalizeNoiseLevel(value as number);

    // Safety
    case 'neighborhoodScoutCrime': return normalizeNeighborhoodScoutCrime(value as number);
    case 'crimeRate': return normalizeCrimeRate(value as number);
    case 'safetyRating': return normalizeSafetyRating(value as string);

    // Environment
    case 'aqi': return normalizeAQI(value as number);
    case 'floodFactor': return normalizeFloodFactor(value as number);
    case 'femaFloodZone': return normalizeFEMAFloodZone(value as string);
    case 'riskLevel': return normalizeRiskLevel(value as string);

    // Schools
    case 'schoolRating': return normalizeSchoolRating(value as number);
    case 'schoolRatingText': return normalizeSchoolRatingText(value as string);

    // Financial
    case 'capRate': return normalizeCapRate(value as number);
    case 'rentalYield': return normalizeRentalYield(value as number);

    // Condition
    case 'condition': return normalizeCondition(value as string);
    case 'propertyAge': return normalizePropertyAge(value as number);

    default:
      console.warn(`Unknown metric type: ${metricType}`);
      return 50;
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Helpers
  clamp,
  mapRange,

  // Location
  normalizeWalkScore,
  normalizeTransitScore,
  normalizeBikeScore,

  // Noise
  normalizeSoundscore,
  normalizeNoiseLevel,

  // Safety
  normalizeNeighborhoodScoutCrime,
  normalizeCrimeRate,
  normalizeSafetyRating,

  // Environment
  normalizeAQI,
  normalizeFloodFactor,
  normalizeFEMAFloodZone,
  normalizeRiskLevel,

  // Schools
  normalizeSchoolRating,
  normalizeSchoolRatingText,

  // Financial
  normalizeCapRate,
  normalizeRentalYield,

  // Condition
  normalizeCondition,
  normalizePropertyAge,

  // Master
  normalizeScore,
};
