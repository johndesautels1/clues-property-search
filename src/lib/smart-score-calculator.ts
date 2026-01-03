/**
 * SMART Score Calculation Engine
 *
 * Calculates property quality scores (0-100) using weighted section methodology.
 *
 * This is the OUTPUT of the system, NOT an input.
 */

import { Property, ConfidenceLevel } from '../types/property';
import { ALL_FIELDS, type FieldDefinition } from '../types/fields-schema';
import { ALL_FIELD_NORMALIZERS } from './normalizations';

// ================================================================
// TYPE DEFINITIONS
// ================================================================

export interface SectionWeights {
  [sectionId: string]: number;  // Section ID ('A', 'B', etc.) -> weight % (0-100)
}

export interface FieldScore {
  fieldId: number;
  fieldName: string;
  rawValue: any;
  normalizedScore: number;  // 0-100
  confidence: ConfidenceLevel;
  notes?: string;
}

export interface SectionScore {
  sectionId: string;
  sectionName: string;
  sectionWeight: number;           // % of total (0-100)
  fieldScores: FieldScore[];
  sectionAverage: number;          // Average of field scores (0-100)
  weightedContribution: number;    // sectionAverage * sectionWeight / 100
  fieldsPopulated: number;
  fieldsTotal: number;
}

export interface SmartScoreResult {
  finalScore: number;                    // 0-100
  sectionBreakdown: SectionScore[];
  confidenceLevel: ConfidenceLevel;
  dataCompleteness: number;              // % of scoreable fields populated
  scoreableFieldsPopulated: number;
  scoreableFieldsTotal: number;
  calculationTimestamp: string;
  weightsUsed: SectionWeights;
  weightsSource: 'industry-standard' | 'user-defined' | string;
  version: 'v2';
}

// ================================================================
// SCOREABLE FIELDS (151 out of 181)
// ================================================================

export const SCOREABLE_FIELDS = [
  // Section A: Address & Identity (3 scoreable)
  6, 7, 8,

  // Section B: Pricing & Value (5 scoreable)
  11, 12, 14, 15, 16,

  // Section C: Property Basics (10 scoreable)
  17, 18, 19, 21, 22, 23, 25, 26, 27, 28,

  // Section D: HOA & Taxes (7 scoreable)
  30, 31, 33, 34, 35, 37, 38,

  // Section E: Structure & Systems (10 scoreable)
  39, 40, 41, 42, 43, 44, 45, 46, 47, 48,

  // Section F: Interior Features (4 scoreable)
  49, 50, 51, 52,

  // Section G: Exterior Features (5 scoreable)
  54, 55, 56, 57, 58,

  // Section H: Permits & Renovations (4 scoreable)
  59, 60, 61, 62,

  // Section I: Assigned Schools (8 scoreable)
  63, 64, 66, 67, 69, 70, 72, 73,

  // Section J: Location Scores (8 scoreable)
  74, 75, 76, 77, 78, 79, 81, 82,

  // Section K: Distances & Amenities (5 scoreable)
  83, 84, 85, 86, 87,

  // Section L: Safety & Crime (3 scoreable)
  88, 89, 90,

  // Section M: Market & Investment (12 scoreable)
  91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102,

  // Section N: Utilities & Connectivity (8 scoreable)
  105, 107, 109, 111, 112, 113, 115, 116,

  // Section O: Environment & Risk (14 scoreable)
  117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130,

  // Section P: Additional Features (8 scoreable)
  131, 132, 133, 134, 135, 136, 137, 138,

  // Section Q: Parking (5 scoreable)
  139, 140, 141, 142, 143,

  // Section R: Building (3 scoreable)
  144, 147, 148,

  // Section S: Legal (4 scoreable)
  151, 152, 153, 154,

  // Section T: Waterfront (5 scoreable)
  155, 156, 157, 158, 159,

  // Section U: Leasing (4 scoreable)
  160, 161, 162, 165,

  // Section V: Features (3 scoreable)
  166, 167, 168,

  // Section W: Market Performance (13 scoreable) - NEW
  169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181
];

// ================================================================
// FIELD NORMALIZATION TO 0-100 SCORES
// ================================================================

function getFieldValue(property: Property, fieldId: number): any {
  // Map each scoreable field to its Property object path
  switch (fieldId) {
    // ============================================================
    // SECTION A: Address & Identity (3 scoreable)
    // ============================================================
    case 6: return property.address.neighborhoodName?.value ?? null;
    case 7: return property.address.county?.value ?? null;
    case 8: return property.address.zipCode?.value ?? null;

    // ============================================================
    // SECTION B: Pricing & Value (5 scoreable)
    // ============================================================
    case 11: return property.address.pricePerSqft?.value ?? null;
    case 12: return property.details.marketValueEstimate?.value ?? null;
    case 14: return property.details.lastSalePrice?.value ?? null;
    case 15: return property.details.assessedValue?.value ?? null;
    case 16: return property.financial.redfinEstimate?.value ?? null;

    // ============================================================
    // SECTION C: Property Basics (10 scoreable)
    // ============================================================
    case 17: return property.details.bedrooms?.value ?? null;
    case 18: return property.details.fullBathrooms?.value ?? null;
    case 19: return property.details.halfBathrooms?.value ?? null;
    case 21: return property.details.livingSqft?.value ?? null;
    case 22: return property.details.totalSqftUnderRoof?.value ?? null;
    case 23: return property.details.lotSizeSqft?.value ?? null;
    case 25: return property.details.yearBuilt?.value ?? null;
    case 26: return property.details.propertyType?.value ?? null;
    case 27: return property.details.stories?.value ?? null;
    case 28: return property.details.garageSpaces?.value ?? null;

    // ============================================================
    // SECTION D: HOA & Taxes (7 scoreable)
    // ============================================================
    case 30: return property.details.hoaYn?.value ?? null;
    case 31: return property.details.hoaFeeAnnual?.value ?? null;
    case 33: return property.details.hoaIncludes?.value ?? null;
    case 34: return property.details.ownershipType?.value ?? null;
    case 35: return property.details.annualTaxes?.value ?? null;
    case 37: return property.financial.propertyTaxRate?.value ?? null;
    case 38: return property.financial.taxExemptions?.value ?? null;

    // ============================================================
    // SECTION E: Structure & Systems (10 scoreable)
    // ============================================================
    case 39: return property.structural.roofType?.value ?? null;
    case 40: return property.structural.roofAgeEst?.value ?? null;
    case 41: return property.structural.exteriorMaterial?.value ?? null;
    case 42: return property.structural.foundation?.value ?? null;
    case 43: return property.structural.waterHeaterType?.value ?? null;
    case 44: return property.structural.garageType?.value ?? null;
    case 45: return property.structural.hvacType?.value ?? null;
    case 46: return property.structural.hvacAge?.value ?? null;
    case 47: return property.structural.laundryType?.value ?? null;
    case 48: return property.structural.interiorCondition?.value ?? null;

    // ============================================================
    // SECTION F: Interior Features (4 scoreable)
    // ============================================================
    case 49: return property.structural.flooringType?.value ?? null;
    case 50: return property.structural.kitchenFeatures?.value ?? null;
    case 51: return property.structural.appliancesIncluded?.value ?? null;
    case 52: return property.structural.fireplaceYn?.value ?? null;

    // ============================================================
    // SECTION G: Exterior Features (5 scoreable)
    // ============================================================
    case 54: return property.structural.poolYn?.value ?? null;
    case 55: return property.structural.poolType?.value ?? null;
    case 56: return property.structural.deckPatio?.value ?? null;
    case 57: return property.structural.fence?.value ?? null;
    case 58: return property.structural.landscaping?.value ?? null;

    // ============================================================
    // SECTION H: Permits & Renovations (4 scoreable)
    // ============================================================
    case 59: return property.structural.recentRenovations?.value ?? null;
    case 60: return property.structural.permitHistoryRoof?.value ?? null;
    case 61: return property.structural.permitHistoryHvac?.value ?? null;
    case 62: return property.structural.permitHistoryPoolAdditions?.value ?? null;

    // ============================================================
    // SECTION I: Assigned Schools (8 scoreable)
    // ============================================================
    case 63: return property.location.schoolDistrictName?.value ?? null;
    case 64: return property.location.elevationFeet?.value ?? null;
    case 66: return property.location.elementaryRating?.value ?? null;
    case 67: return property.location.elementaryDistanceMiles?.value ?? null;
    case 69: return property.location.middleRating?.value ?? null;
    case 70: return property.location.middleDistanceMiles?.value ?? null;
    case 72: return property.location.highRating?.value ?? null;
    case 73: return property.location.highDistanceMiles?.value ?? null;

    // ============================================================
    // SECTION J: Location Scores (8 scoreable)
    // ============================================================
    case 74: return property.location.walkScore?.value ?? null;
    case 75: return property.location.transitScore?.value ?? null;
    case 76: return property.location.bikeScore?.value ?? null;
    case 77: return property.location.safetyScore?.value ?? null;
    case 78: return property.location.noiseLevel?.value ?? null;
    case 79: return property.location.trafficLevel?.value ?? null;
    case 81: return property.location.publicTransitAccess?.value ?? null;
    case 82: return property.location.commuteTimeCityCenter?.value ?? null;

    // ============================================================
    // SECTION K: Distances & Amenities (5 scoreable)
    // ============================================================
    case 83: return property.location.distanceGroceryMiles?.value ?? null;
    case 84: return property.location.distanceHospitalMiles?.value ?? null;
    case 85: return property.location.distanceAirportMiles?.value ?? null;
    case 86: return property.location.distanceParkMiles?.value ?? null;
    case 87: return property.location.distanceBeachMiles?.value ?? null;

    // ============================================================
    // SECTION L: Safety & Crime (3 scoreable)
    // ============================================================
    case 88: return property.location.crimeIndexViolent?.value ?? null;
    case 89: return property.location.crimeIndexProperty?.value ?? null;
    case 90: return property.location.neighborhoodSafetyRating?.value ?? null;

    // ============================================================
    // SECTION M: Market & Investment (12 scoreable)
    // ============================================================
    case 91: return property.financial.medianHomePriceNeighborhood?.value ?? null;
    case 92: return property.financial.pricePerSqftRecentAvg?.value ?? null;
    case 93: return property.financial.priceToRentRatio?.value ?? null;
    case 94: return property.financial.priceVsMedianPercent?.value ?? null;
    case 95: return property.financial.daysOnMarketAvg?.value ?? null;
    case 96: return property.financial.inventorySurplus?.value ?? null;
    case 97: return property.financial.insuranceEstAnnual?.value ?? null;
    case 98: return property.financial.rentalEstimateMonthly?.value ?? null;
    case 99: return property.financial.rentalYieldEst?.value ?? null;
    case 100: return property.financial.vacancyRateNeighborhood?.value ?? null;
    case 101: return property.financial.capRateEst?.value ?? null;
    case 102: return property.financial.financingTerms?.value ?? null;

    // ============================================================
    // SECTION N: Utilities & Connectivity (8 scoreable)
    // ============================================================
    case 105: return property.utilities.avgElectricBill?.value ?? null;
    case 107: return property.utilities.avgWaterBill?.value ?? null;
    case 109: return property.utilities.naturalGas?.value ?? null;
    case 111: return property.utilities.internetProvidersTop3?.value ?? null;
    case 112: return property.utilities.maxInternetSpeed?.value ?? null;
    case 113: return property.utilities.fiberAvailable?.value ?? null;
    case 115: return property.utilities.cellCoverageQuality?.value ?? null;
    case 116: return property.utilities.emergencyServicesDistance?.value ?? null;

    // ============================================================
    // SECTION O: Environment & Risk (14 scoreable)
    // ============================================================
    case 117: return property.utilities.airQualityIndexCurrent?.value ?? null;
    case 118: return property.utilities.airQualityGrade?.value ?? null;
    case 119: return property.utilities.floodZone?.value ?? null;
    case 120: return property.utilities.floodRiskLevel?.value ?? null;
    case 121: return property.utilities.climateRiskWildfireFlood?.value ?? null;
    case 122: return property.utilities.wildfireRisk?.value ?? null;
    case 123: return property.utilities.earthquakeRisk?.value ?? null;
    case 124: return property.utilities.hurricaneRisk?.value ?? null;
    case 125: return property.utilities.tornadoRisk?.value ?? null;
    case 126: return property.utilities.radonRisk?.value ?? null;
    case 127: return property.utilities.superfundNearby?.value ?? null;
    case 128: return property.utilities.seaLevelRiseRisk?.value ?? null;
    case 129: return property.utilities.noiseLevelDbEst?.value ?? null;
    case 130: return property.utilities.solarPotential?.value ?? null;

    // ============================================================
    // SECTION P: Additional Features (8 scoreable)
    // ============================================================
    case 131: return property.utilities.viewType?.value ?? null;
    case 132: return property.utilities.lotFeatures?.value ?? null;
    case 133: return property.utilities.evChargingYn?.value ?? null;
    case 134: return property.utilities.smartHomeFeatures?.value ?? null;
    case 135: return property.utilities.accessibilityMods?.value ?? null;
    case 136: return property.utilities.petPolicy?.value ?? null;
    case 137: return property.utilities.ageRestrictions?.value ?? null;
    case 138: return property.financial.specialAssessments?.value ?? null;

    // ============================================================
    // SECTION Q: Parking (5 scoreable)
    // ============================================================
    case 139: return property.stellarMLS?.parking?.carportYn?.value ?? null;
    case 140: return property.stellarMLS?.parking?.carportSpaces?.value ?? null;
    case 141: return property.stellarMLS?.parking?.garageAttachedYn?.value ?? null;
    case 142: return property.stellarMLS?.parking?.parkingFeatures?.value ?? null;
    case 143: return property.stellarMLS?.parking?.assignedParkingSpaces?.value ?? null;

    // ============================================================
    // SECTION R: Building (3 scoreable)
    // ============================================================
    case 144: return property.stellarMLS?.building?.floorNumber?.value ?? null;
    case 147: return property.stellarMLS?.building?.buildingElevatorYn?.value ?? null;
    case 148: return property.stellarMLS?.building?.floorsInUnit?.value ?? null;

    // ============================================================
    // SECTION S: Legal (4 scoreable)
    // ============================================================
    case 151: return property.stellarMLS?.legal?.homesteadYn?.value ?? null;
    case 152: return property.stellarMLS?.legal?.cddYn?.value ?? null;
    case 153: return property.stellarMLS?.legal?.annualCddFee?.value ?? null;
    case 154: return property.stellarMLS?.legal?.frontExposure?.value ?? null;

    // ============================================================
    // SECTION T: Waterfront (5 scoreable)
    // ============================================================
    case 155: return property.stellarMLS?.waterfront?.waterFrontageYn?.value ?? null;
    case 156: return property.stellarMLS?.waterfront?.waterfrontFeet?.value ?? null;
    case 157: return property.stellarMLS?.waterfront?.waterAccessYn?.value ?? null;
    case 158: return property.stellarMLS?.waterfront?.waterViewYn?.value ?? null;
    case 159: return property.stellarMLS?.waterfront?.waterBodyName?.value ?? null;

    // ============================================================
    // SECTION U: Leasing (4 scoreable)
    // ============================================================
    case 160: return property.stellarMLS?.leasing?.canBeLeasedYn?.value ?? null;
    case 161: return property.stellarMLS?.leasing?.minimumLeasePeriod?.value ?? null;
    case 162: return property.stellarMLS?.leasing?.leaseRestrictionsYn?.value ?? null;
    case 165: return property.stellarMLS?.leasing?.associationApprovalYn?.value ?? null;

    // ============================================================
    // SECTION V: Features (3 scoreable)
    // ============================================================
    case 166: return property.stellarMLS?.features?.communityFeatures?.value ?? null;
    case 167: return property.stellarMLS?.features?.interiorFeatures?.value ?? null;
    case 168: return property.stellarMLS?.features?.exteriorFeatures?.value ?? null;

    // ============================================================
    // DEFAULT: Field not in scoreable list
    // ============================================================
    default:
      return null;
  }
}

/**
 * Normalize a field value to a 0-100 score
 * Delegates to field-specific normalizers from normalizations module
 */
export function normalizeFieldToScore(fieldId: number, value: any, property?: Property): number {
  if (value === null || value === undefined || value === '') {
    return 0; // No data = no score
  }

  // Use field-specific normalizer from the comprehensive normalizations module
  const normalizer = ALL_FIELD_NORMALIZERS[fieldId];

  if (!normalizer) {
    // Fallback for unmapped fields (shouldn't happen with complete normalizers)
    console.warn(`No normalizer found for field ${fieldId}, using default`);
    return 50; // Neutral score
  }

  try {
    // Call the normalizer - some return just a number, others return NormalizationResult
    const result = normalizer(value, property);

    // Handle both formats: number or { score, confidence, notes }
    if (typeof result === 'number') {
      return Math.max(0, Math.min(100, result));
    } else if (result && typeof result === 'object' && 'score' in result) {
      return Math.max(0, Math.min(100, result.score));
    }

    console.warn(`Invalid normalizer return type for field ${fieldId}`);
    return 50;
  } catch (error) {
    console.error(`Error normalizing field ${fieldId}:`, error);
    return 0;
  }
}

// ================================================================
// DEPRECATED: Old placeholder normalization logic below
// Kept for reference only - not used in production
// ================================================================
function DEPRECATED_normalizeFieldToScore_OLD(fieldId: number, value: any, property?: Property): number {
  // This function is no longer used - see normalizeFieldToScore() above
  // Old placeholder logic preserved for reference:
  switch (fieldId) {
    // ============================================================
    // SECTION B: PRICING & VALUE
    // ============================================================

    case 11: // price_per_sqft
      // Lower is better (relative to market)
      // Assume $350/sqft is market average for FL coastal
      const marketAvg = 350;
      const pricePerSqft = Number(value);
      if (isNaN(pricePerSqft)) return 0;

      // Score: 100 at 20% below market, 50 at market, 0 at 50% above
      const percentDiff = ((pricePerSqft - marketAvg) / marketAvg) * 100;
      return Math.max(0, Math.min(100, 100 - (percentDiff * 2)));

    case 12: // market_value_estimate
    case 15: // assessed_value
    case 16: // redfin_estimate
      // Higher estimates suggest stronger property (if price is reasonable)
      // Compare to listing price for value assessment
      if (!property?.address?.listingPrice?.value) return 50;
      const listingPrice = property.address.listingPrice.value;
      const estimate = Number(value);
      if (isNaN(estimate) || estimate === 0) return 0;

      const ratio = listingPrice / estimate;
      // Best: listed below estimate (ratio < 1.0)
      // Fair: listed at estimate (ratio = 1.0)
      // Poor: listed above estimate (ratio > 1.1)
      if (ratio <= 0.90) return 100; // 10%+ below estimate
      if (ratio <= 0.95) return 90;  // 5-10% below
      if (ratio <= 1.00) return 75;  // At estimate
      if (ratio <= 1.05) return 60;  // Slightly above
      if (ratio <= 1.10) return 40;  // 10% above
      return 20; // More than 10% overpriced

    case 14: // last_sale_price
      // Calculate appreciation if we have year built
      if (!property?.address?.listingPrice?.value) return 50;
      const currentPrice = property.address.listingPrice.value;
      const lastSale = Number(value);
      if (isNaN(lastSale) || lastSale === 0) return 0;

      const appreciation = ((currentPrice - lastSale) / lastSale) * 100;
      // Good: 20-50% appreciation
      // Fair: 0-20% or 50-100% appreciation
      // Poor: negative or excessive (>100%)
      if (appreciation < 0) return 30; // Depreciation
      if (appreciation <= 20) return 70;
      if (appreciation <= 50) return 100; // Sweet spot
      if (appreciation <= 100) return 80;
      return 50; // Excessive appreciation may indicate bubble

    // ============================================================
    // SECTION C: PROPERTY BASICS
    // ============================================================

    case 17: // bedrooms
      const beds = Number(value);
      if (beds === 2) return 60;  // Small
      if (beds === 3) return 100; // Ideal for most buyers
      if (beds === 4) return 95;  // Great for families
      if (beds === 5) return 85;  // Large
      if (beds >= 6) return 70;   // Very large (niche market)
      return 40; // 1 bedroom or 0

    case 18: // full_bathrooms
    case 19: // half_bathrooms
      const baths = Number(value);
      return Math.min(100, baths * 33); // 1 bath = 33, 2 = 66, 3+ = 100

    case 21: // living_sqft
      const sqft = Number(value);
      if (sqft < 1000) return 40;
      if (sqft < 1500) return 70;
      if (sqft < 2000) return 90;
      if (sqft < 2500) return 100;
      if (sqft < 3500) return 95;
      return 85; // Very large homes are niche

    case 23: // lot_size_sqft
      const lotSqft = Number(value);
      if (lotSqft < 5000) return 50;   // Small lot
      if (lotSqft < 7500) return 75;   // Average
      if (lotSqft < 10000) return 90;  // Good
      if (lotSqft < 15000) return 100; // Excellent
      return 95; // Very large lots

    case 25: // year_built (Tiered approach as per user request)
      const yearBuilt = Number(value);
      const currentYear = new Date().getFullYear();
      const age = currentYear - yearBuilt;

      if (age <= 5) return 100;      // 0-5 years: Brand new
      if (age <= 10) return 90;      // 6-10 years: Very new
      if (age <= 20) return 75;      // 11-20 years: Modern
      if (age <= 30) return 60;      // 21-30 years: Mature
      if (age <= 50) return 40;      // 31-50 years: Older
      return 20;                     // 50+ years: Very old

    case 26: // property_type
      const type = String(value).toLowerCase();
      if (type.includes('single') || type.includes('detached')) return 100;
      if (type.includes('townhouse') || type.includes('townhome')) return 85;
      if (type.includes('condo')) return 70;
      if (type.includes('multi')) return 50;
      return 60;

    case 27: // stories
      const stories = Number(value);
      if (stories === 1) return 100; // Single-story premium (FL retirees)
      if (stories === 2) return 90;  // Two-story common
      return 70; // 3+ stories less desirable

    case 28: // garage_spaces
      const garageSpaces = Number(value);
      return Math.min(100, garageSpaces * 40); // 1 = 40, 2 = 80, 3 = 100

    // ============================================================
    // SECTION D: HOA & TAXES
    // ============================================================

    case 30: // hoa_yn
      // No HOA is generally preferred (more freedom)
      return value === true ? 60 : 100;

    case 31: // hoa_fee_annual
      const hoaAnnual = Number(value);
      // Lower fees are better
      if (hoaAnnual === 0) return 100;
      if (hoaAnnual < 1200) return 90;  // <$100/mo
      if (hoaAnnual < 2400) return 75;  // $100-200/mo
      if (hoaAnnual < 4800) return 60;  // $200-400/mo
      if (hoaAnnual < 7200) return 40;  // $400-600/mo
      return 20; // >$600/mo

    case 35: // annual_taxes
      const taxes = Number(value);
      // Lower taxes are better, but context matters (property value)
      if (!property?.address?.listingPrice?.value) return 50;
      const taxRate = (taxes / property.address.listingPrice.value) * 100;
      // Good: <1.5% effective rate
      // Fair: 1.5-2.5%
      // Poor: >2.5%
      if (taxRate < 1.0) return 100;
      if (taxRate < 1.5) return 90;
      if (taxRate < 2.0) return 70;
      if (taxRate < 2.5) return 50;
      return 30;

    // ============================================================
    // SECTION I: SCHOOLS
    // ============================================================

    case 66: // elementary_rating
    case 69: // middle_rating
    case 72: // high_rating
      const rating = parseFloat(String(value));
      if (isNaN(rating)) return 0;
      // Convert 0-10 scale to 0-100
      return Math.min(100, rating * 10);

    case 67: // elementary_distance_mi
    case 70: // middle_distance_mi
    case 73: // high_distance_mi
      const distMi = parseFloat(String(value));
      if (isNaN(distMi)) return 0;
      // Closer is better
      if (distMi <= 0.5) return 100; // Walking distance
      if (distMi <= 1.0) return 90;
      if (distMi <= 2.0) return 75;
      if (distMi <= 5.0) return 60;
      return 40; // Far from school

    // ============================================================
    // SECTION O: ENVIRONMENT & RISK
    // ============================================================

    case 119: // flood_zone (Use FEMA premium rates as requested)
      const zone = String(value).toUpperCase();
      // Based on typical FEMA insurance premiums:
      // Zone X: ~$450/yr (minimal risk)
      // Zone AE: ~$2,500/yr (high risk)
      // Zone VE: ~$5,000/yr (extreme risk)
      if (zone === 'X' || zone === 'C') return 100; // Minimal risk
      if (zone === 'A' || zone === 'AE') return 30; // High risk
      if (zone === 'V' || zone === 'VE') return 10; // Extreme risk
      return 50; // Unknown/Other

    case 120: // flood_risk_level
    case 121: // climate_risk
    case 122: // wildfire_risk
    case 123: // earthquake_risk
    case 124: // hurricane_risk
    case 125: // tornado_risk
      const risk = String(value).toLowerCase();
      if (risk.includes('minimal') || risk.includes('low')) return 100;
      if (risk.includes('moderate') || risk.includes('medium')) return 60;
      if (risk.includes('high') || risk.includes('severe')) return 20;
      return 50; // Unknown

    // ============================================================
    // SECTION G: EXTERIOR FEATURES
    // ============================================================

    case 54: // pool_yn (Per user request: Pool=100, No Pool=50)
      return value === true ? 100 : 50;

    case 55: // pool_type
      const poolType = String(value).toLowerCase();
      if (poolType.includes('heated') || poolType.includes('salt')) return 100;
      if (poolType.includes('in-ground') || poolType.includes('inground')) return 90;
      if (poolType.includes('screen')) return 85;
      return 70; // Basic pool

    // ============================================================
    // SECTION J: LOCATION SCORES
    // ============================================================

    case 74: // walk_score
    case 75: // transit_score
    case 76: // bike_score
    case 77: // safety_score
      // These are already 0-100 scores
      return Number(value) || 0;

    // ============================================================
    // SECTION T: WATERFRONT
    // ============================================================

    case 155: // water_frontage_yn
      return value === true ? 100 : 0;

    case 156: // waterfront_feet
      const waterfrontFt = Number(value);
      if (waterfrontFt === 0) return 0;
      if (waterfrontFt < 50) return 70;  // Small waterfront
      if (waterfrontFt < 100) return 85;
      if (waterfrontFt < 150) return 95;
      return 100; // 150+ feet

    case 157: // water_access_yn
      return value === true ? 100 : 30;

    case 158: // water_view_yn
      return value === true ? 90 : 0;

    case 159: // water_body_name
      const waterBody = String(value).toLowerCase();
      if (waterBody.includes('gulf')) return 100;  // Gulf of Mexico
      if (waterBody.includes('bay')) return 90;    // Tampa Bay, etc.
      if (waterBody.includes('ocean')) return 95;
      if (waterBody.includes('canal')) return 70;  // Canal access
      if (waterBody.includes('lake')) return 75;
      if (waterBody.includes('river')) return 80;
      return 60; // Generic water body

    // ============================================================
    // DEFAULT: If field is populated, give 50 points
    // ============================================================

    default:
      return 50;
  }
}

// ================================================================
// MAIN CALCULATION FUNCTION
// ================================================================

export function calculateSmartScore(
  property: Property,
  weights: SectionWeights,
  weightsSource: string = 'industry-standard'
): SmartScoreResult {

  const sectionScores: SectionScore[] = [];
  let totalScoreableFields = 0;
  let populatedScoreableFields = 0;

  // Group scoreable fields by section
  const fieldsBySection: Record<string, number[]> = {};

  SCOREABLE_FIELDS.forEach(fieldId => {
    const field = ALL_FIELDS.find((f: FieldDefinition) => f.num === fieldId);
    if (!field) return;

    // Extract section from group name (simplified - you'll need proper mapping)
    const sectionId = field.group.charAt(0); // This is simplified

    if (!fieldsBySection[sectionId]) {
      fieldsBySection[sectionId] = [];
    }
    fieldsBySection[sectionId].push(fieldId);
  });

  // Calculate scores for each section
  for (const [sectionId, fieldIds] of Object.entries(fieldsBySection)) {
    const fieldScores: FieldScore[] = [];

    for (const fieldId of fieldIds) {
      const fieldDef = ALL_FIELDS.find((f: FieldDefinition) => f.num === fieldId);
      if (!fieldDef) continue;

      const rawValue = getFieldValue(property, fieldId);
      const isPopulated = rawValue !== null && rawValue !== undefined && rawValue !== '';

      totalScoreableFields++;
      if (isPopulated) populatedScoreableFields++;

      const normalizedScore = isPopulated
        ? normalizeFieldToScore(fieldId, rawValue, property)
        : 0;

      // Get confidence from property field metadata
      const confidence: ConfidenceLevel = 'Medium'; // TODO: Extract from property

      fieldScores.push({
        fieldId,
        fieldName: fieldDef.label,
        rawValue,
        normalizedScore,
        confidence
      });
    }

    // Calculate section average (only populated fields)
    const populatedScores = fieldScores
      .filter(f => f.rawValue !== null && f.rawValue !== undefined && f.rawValue !== '')
      .map(f => f.normalizedScore);

    const sectionAverage = populatedScores.length > 0
      ? populatedScores.reduce((sum, score) => sum + score, 0) / populatedScores.length
      : 0;

    // Apply section weight
    const sectionWeight = weights[sectionId] || 0;
    const weightedContribution = (sectionAverage / 100) * sectionWeight;

    // Get section name from first field in this section
    const firstField = ALL_FIELDS.find((f: FieldDefinition) => f.num === fieldIds[0]);
    const sectionName = firstField?.group || sectionId;

    sectionScores.push({
      sectionId,
      sectionName,
      sectionWeight,
      fieldScores,
      sectionAverage: Math.round(sectionAverage * 10) / 10,
      weightedContribution: Math.round(weightedContribution * 10) / 10,
      fieldsPopulated: populatedScores.length,
      fieldsTotal: fieldScores.length
    });
  }

  // Sum weighted contributions = SMART Score
  const finalScore = sectionScores.reduce(
    (sum, section) => sum + section.weightedContribution,
    0
  );

  // Calculate overall confidence
  const avgConfidence: ConfidenceLevel = 'Medium'; // TODO: Calculate from field confidences

  // Calculate data completeness
  const dataCompleteness = totalScoreableFields > 0
    ? Math.round((populatedScoreableFields / totalScoreableFields) * 100)
    : 0;

  return {
    finalScore: Math.round(finalScore * 10) / 10,
    sectionBreakdown: sectionScores,
    confidenceLevel: avgConfidence,
    dataCompleteness,
    scoreableFieldsPopulated: populatedScoreableFields,
    scoreableFieldsTotal: totalScoreableFields,
    calculationTimestamp: new Date().toISOString(),
    weightsUsed: weights,
    weightsSource,
    version: 'v2'
  };
}

// ================================================================
// COMPARISON NORMALIZATION
// ================================================================

export function normalizeComparison(
  property1: Property,
  property2: Property,
  property3: Property,
  weights: SectionWeights
): {
  commonFields: number[];
  excludedFields: number[];
  normalizedScores: SmartScoreResult[];
} {
  const properties = [property1, property2, property3];

  // Find fields that ALL 3 properties have populated
  const commonFields = SCOREABLE_FIELDS.filter(fieldId => {
    return properties.every(prop => {
      const value = getFieldValue(prop, fieldId);
      return value !== null && value !== undefined && value !== '';
    });
  });

  const excludedFields = SCOREABLE_FIELDS.filter(
    fieldId => !commonFields.includes(fieldId)
  );

  console.log(`[COMPARISON NORMALIZATION]`);
  console.log(`  Common fields: ${commonFields.length}/${SCOREABLE_FIELDS.length}`);
  console.log(`  Excluded fields: ${excludedFields.length}`);

  // Recalculate scores using ONLY common fields
  // TODO: Implement filtered calculation

  const normalizedScores = properties.map(prop =>
    calculateSmartScore(prop, weights)
  );

  return {
    commonFields,
    excludedFields,
    normalizedScores
  };
}
