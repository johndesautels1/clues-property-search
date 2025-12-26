/**
 * CLUES SMART Score - Normalization Functions Index
 *
 * Export all normalization functions for the SMART Score engine.
 *
 * Usage:
 * import { normalizeHighValueField, HIGH_VALUE_NORMALIZERS } from '@/lib/normalizations';
 * import { normalizeField, MEDIUM_VALUE_NORMALIZERS } from '@/lib/normalizations';
 */

// ============================================================
// HIGH-VALUE SECTIONS (B, C, I, M)
// ============================================================
export {
  // Individual field normalizers - Section B
  normalizeField11,
  normalizeField12,
  normalizeField14,
  normalizeField15,
  normalizeField16,

  // Individual field normalizers - Section C
  normalizeField17,
  normalizeField18,
  normalizeField19,
  normalizeField21,
  normalizeField22,
  normalizeField23,
  normalizeField25,
  normalizeField26,
  normalizeField27,
  normalizeField28,

  // Individual field normalizers - Section I
  normalizeField63,
  normalizeField64,
  normalizeField66,
  normalizeField67,
  normalizeField69,
  normalizeField70,
  normalizeField72,
  normalizeField73,

  // Individual field normalizers - Section M
  normalizeField91,
  normalizeField92,
  normalizeField93,
  normalizeField94,
  normalizeField95,
  normalizeField96,
  normalizeField97,
  normalizeField98,
  normalizeField99,
  normalizeField100,
  normalizeField101,
  normalizeField102,

  // Aggregated exports
  HIGH_VALUE_NORMALIZERS,
  normalizeHighValueField,
  normalizeAllHighValueFields,

  // Types
  type Property,
  type NormalizationContext,
} from './high-value-sections';

// ============================================================
// MEDIUM-VALUE SECTIONS (D, E, J, O)
// ============================================================
export {
  // Section D: HOA & Taxes (fields 30, 31, 33, 34, 35, 37, 38)
  normalizeHoaYn,
  normalizeHoaFeeAnnual,
  normalizeHoaIncludes,
  normalizeOwnershipType,
  normalizeAnnualTaxes,
  normalizePropertyTaxRate,
  normalizeTaxExemptions,

  // Section E: Structure & Systems (fields 39, 40, 41, 42, 43, 44, 45, 46, 47, 48)
  normalizeRoofType,
  normalizeRoofAge,
  normalizeExteriorMaterial,
  normalizeFoundation,
  normalizeWaterHeaterType,
  normalizeGarageType,
  normalizeHvacType,
  normalizeHvacAge,
  normalizeLaundryType,
  normalizeInteriorCondition,

  // Section J: Location Scores (fields 74, 75, 76, 77, 78, 79, 81, 82)
  normalizeWalkScore,
  normalizeTransitScore,
  normalizeBikeScore,
  normalizeSafetyScore,
  normalizeNoiseLevel,
  normalizeTrafficLevel,
  normalizePublicTransitAccess,
  normalizeCommuteToCityCenter,

  // Section O: Environment & Risk (fields 117-130)
  normalizeAirQualityIndex,
  normalizeAirQualityGrade,
  normalizeFloodZone,
  normalizeFloodRiskLevel,
  normalizeClimateRisk,
  normalizeWildfireRisk,
  normalizeEarthquakeRisk,
  normalizeHurricaneRisk,
  normalizeTornadoRisk,
  normalizeRadonRisk,
  normalizeSuperfundSiteNearby,
  normalizeSeaLevelRiseRisk,
  normalizeNoiseLevelDb,
  normalizeSolarPotential,

  // Aggregated exports
  MEDIUM_VALUE_NORMALIZERS,
  normalizeField,
  normalizeFields,

  // Florida-specific thresholds
  FLORIDA_COASTAL_THRESHOLDS,

  // Types
  type NormalizationResult,
  type NormalizationFunction,
} from './medium-value-sections';

// ============================================================
// REMAINING SECTIONS (A, F, G, H, K, L, N, P, Q, R, S, T, U, V)
// ============================================================
export {
  FIELD_NORMALIZERS as REMAINING_NORMALIZERS,
} from './remaining-sections';

// ============================================================
// MASTER NORMALIZER LOOKUP (ALL 140 FIELDS)
// ============================================================

import { HIGH_VALUE_NORMALIZERS } from './high-value-sections';
import { MEDIUM_VALUE_NORMALIZERS } from './medium-value-sections';
import { FIELD_NORMALIZERS as REMAINING_NORMALIZERS_IMPORT } from './remaining-sections';

/**
 * Master lookup table for all 140 scoreable field normalizers
 * Combines high-value, medium-value, and remaining section normalizers
 */
export const ALL_FIELD_NORMALIZERS: Record<number, any> = {
  ...HIGH_VALUE_NORMALIZERS,
  ...MEDIUM_VALUE_NORMALIZERS,
  ...REMAINING_NORMALIZERS_IMPORT,
};
