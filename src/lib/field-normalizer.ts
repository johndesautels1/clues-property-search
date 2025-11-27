/**
 * CLUES Property Dashboard - Unified Field Normalizer
 * 
 * SINGLE SOURCE OF TRUTH for mapping flat 138-field API keys to the nested Property interface.
 * This MUST be the only place where field→path mapping is defined.
 * 
 * API returns: { "7_listing_price": { value: 450000, source: "Zillow" } }
 * Property type expects: property.address.listingPrice.value = 450000
 */

import type { Property, DataField, ConfidenceLevel } from '@/types/property';

export interface FlatFieldData {
  value: any;
  source?: string;
  confidence?: 'High' | 'Medium' | 'Low' | 'Unverified';
  llmSources?: string[];
  validationStatus?: 'passed' | 'failed' | 'warning' | 'valid' | 'single_source_warning';
  validationMessage?: string;
}

type GroupName = 'address' | 'details' | 'structural' | 'location' | 'financial' | 'utilities';

interface FieldPathMapping {
  fieldNumber: number;
  apiKey: string;
  group: GroupName;
  propName: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'any';
  validation?: (val: any) => boolean;
}

/**
 * Complete 138-field mapping to Property interface structure
 * group = the top-level object in Property (address, details, structural, location, financial, utilities)
 * propName = the property name within that group
 */
export const FIELD_TO_PROPERTY_MAP: FieldPathMapping[] = [
  // ========== GROUP: address (AddressData in property.ts) ==========
  { fieldNumber: 1, apiKey: '1_full_address', group: 'address', propName: 'fullAddress', type: 'string' },
  { fieldNumber: 2, apiKey: '2_mls_primary', group: 'address', propName: 'mlsPrimary', type: 'string' },
  { fieldNumber: 3, apiKey: '3_mls_secondary', group: 'address', propName: 'mlsSecondary', type: 'string' },
  { fieldNumber: 4, apiKey: '4_listing_status', group: 'address', propName: 'listingStatus', type: 'string' },
  { fieldNumber: 5, apiKey: '5_listing_date', group: 'address', propName: 'listingDate', type: 'date' },
  { fieldNumber: 7, apiKey: '7_listing_price', group: 'address', propName: 'listingPrice', type: 'number', validation: (v) => v > 0 && v < 1000000000 },
  { fieldNumber: 8, apiKey: '8_price_per_sqft', group: 'address', propName: 'pricePerSqft', type: 'number', validation: (v) => v > 0 && v < 50000 },
  { fieldNumber: 28, apiKey: '28_county', group: 'address', propName: 'county', type: 'string' },
  // Note: streetAddress, city, state, zipCode are DERIVED from 1_full_address via parsing (see end of normalizeToProperty)
  // Note: latitude, longitude are DERIVED from 'coordinates' field via parsing (see end of normalizeToProperty)
  // These are not separate API fields - they are parsed from composite fields

  // ========== GROUP: details (PropertyDetails in property.ts) ==========
  { fieldNumber: 6, apiKey: '6_parcel_id', group: 'details', propName: 'parcelId', type: 'string' },
  { fieldNumber: 9, apiKey: '9_market_value_estimate', group: 'details', propName: 'marketValueEstimate', type: 'number', validation: (v) => v > 0 && v < 1000000000 },
  { fieldNumber: 10, apiKey: '10_last_sale_date', group: 'details', propName: 'lastSaleDate', type: 'date' },
  { fieldNumber: 11, apiKey: '11_last_sale_price', group: 'details', propName: 'lastSalePrice', type: 'number', validation: (v) => v > 0 && v < 1000000000 },
  { fieldNumber: 12, apiKey: '12_bedrooms', group: 'details', propName: 'bedrooms', type: 'number', validation: (v) => v >= 0 && v <= 50 },
  { fieldNumber: 13, apiKey: '13_full_bathrooms', group: 'details', propName: 'fullBathrooms', type: 'number', validation: (v) => v >= 0 && v <= 30 },
  { fieldNumber: 14, apiKey: '14_half_bathrooms', group: 'details', propName: 'halfBathrooms', type: 'number', validation: (v) => v >= 0 && v <= 20 },
  { fieldNumber: 15, apiKey: '15_total_bathrooms', group: 'details', propName: 'totalBathrooms', type: 'number', validation: (v) => v >= 0 && v <= 50 },
  { fieldNumber: 16, apiKey: '16_living_sqft', group: 'details', propName: 'livingSqft', type: 'number', validation: (v) => v > 0 && v < 100000 },
  { fieldNumber: 17, apiKey: '17_total_sqft_under_roof', group: 'details', propName: 'totalSqftUnderRoof', type: 'number', validation: (v) => v > 0 && v < 150000 },
  { fieldNumber: 18, apiKey: '18_lot_size_sqft', group: 'details', propName: 'lotSizeSqft', type: 'number', validation: (v) => v > 0 },
  { fieldNumber: 19, apiKey: '19_lot_size_acres', group: 'details', propName: 'lotSizeAcres', type: 'number', validation: (v) => v > 0 },
  { fieldNumber: 20, apiKey: '20_year_built', group: 'details', propName: 'yearBuilt', type: 'number', validation: (v) => v >= 1700 && v <= new Date().getFullYear() + 2 },
  { fieldNumber: 21, apiKey: '21_property_type', group: 'details', propName: 'propertyType', type: 'string' },
  { fieldNumber: 22, apiKey: '22_stories', group: 'details', propName: 'stories', type: 'number', validation: (v) => v >= 1 && v <= 100 },
  { fieldNumber: 23, apiKey: '23_garage_spaces', group: 'details', propName: 'garageSpaces', type: 'number', validation: (v) => v >= 0 && v <= 20 },
  { fieldNumber: 24, apiKey: '24_parking_total', group: 'details', propName: 'parkingTotal', type: 'string' },
  { fieldNumber: 25, apiKey: '25_hoa_yn', group: 'details', propName: 'hoaYn', type: 'boolean' },
  { fieldNumber: 26, apiKey: '26_hoa_fee_annual', group: 'details', propName: 'hoaFeeAnnual', type: 'number', validation: (v) => v >= 0 && v < 500000 },
  { fieldNumber: 27, apiKey: '27_ownership_type', group: 'details', propName: 'ownershipType', type: 'string' },
  // Note: hoaName and hoaIncludes are not in the API's 138-field schema
  // If needed, they should be derived from other HOA fields or added manually
  { fieldNumber: 29, apiKey: '29_annual_taxes', group: 'details', propName: 'annualTaxes', type: 'number', validation: (v) => v >= 0 && v < 200000 },
  { fieldNumber: 30, apiKey: '30_tax_year', group: 'details', propName: 'taxYear', type: 'number', validation: (v) => v >= 1900 && v <= new Date().getFullYear() + 1 },
  { fieldNumber: 31, apiKey: '31_assessed_value', group: 'details', propName: 'assessedValue', type: 'number', validation: (v) => v > 0 && v < 1000000000 },

  // ========== GROUP: structural (StructuralDetails in property.ts) ==========
  // Note: waterHeaterType, garageType, laundryType, fireplaceCount are not in API's 138-field schema
  // They would conflict with official fields 30, 31, 38, 39 which have different meanings
  { fieldNumber: 36, apiKey: '36_roof_type', group: 'structural', propName: 'roofType', type: 'string' },
  { fieldNumber: 37, apiKey: '37_roof_age_est', group: 'structural', propName: 'roofAgeEst', type: 'string' },
  { fieldNumber: 38, apiKey: '38_exterior_material', group: 'structural', propName: 'exteriorMaterial', type: 'string' },
  { fieldNumber: 39, apiKey: '39_foundation', group: 'structural', propName: 'foundation', type: 'string' },
  { fieldNumber: 40, apiKey: '40_hvac_type', group: 'structural', propName: 'hvacType', type: 'string' },
  { fieldNumber: 41, apiKey: '41_hvac_age', group: 'structural', propName: 'hvacAge', type: 'string' },
  { fieldNumber: 42, apiKey: '42_flooring_type', group: 'structural', propName: 'flooringType', type: 'string' },
  { fieldNumber: 43, apiKey: '43_kitchen_features', group: 'structural', propName: 'kitchenFeatures', type: 'string' },
  { fieldNumber: 44, apiKey: '44_appliances_included', group: 'structural', propName: 'appliancesIncluded', type: 'array' },
  { fieldNumber: 45, apiKey: '45_fireplace_yn', group: 'structural', propName: 'fireplaceYn', type: 'boolean' },
  { fieldNumber: 46, apiKey: '46_interior_condition', group: 'structural', propName: 'interiorCondition', type: 'string' },
  { fieldNumber: 47, apiKey: '47_pool_yn', group: 'structural', propName: 'poolYn', type: 'boolean' },
  { fieldNumber: 48, apiKey: '48_pool_type', group: 'structural', propName: 'poolType', type: 'string' },
  { fieldNumber: 49, apiKey: '49_deck_patio', group: 'structural', propName: 'deckPatio', type: 'string' },
  { fieldNumber: 50, apiKey: '50_fence', group: 'structural', propName: 'fence', type: 'string' },
  { fieldNumber: 51, apiKey: '51_landscaping', group: 'structural', propName: 'landscaping', type: 'string' },
  { fieldNumber: 52, apiKey: '52_recent_renovations', group: 'structural', propName: 'recentRenovations', type: 'string' },
  { fieldNumber: 53, apiKey: '53_permit_history_roof', group: 'structural', propName: 'permitHistoryRoof', type: 'string' },
  { fieldNumber: 54, apiKey: '54_permit_history_hvac', group: 'structural', propName: 'permitHistoryHvac', type: 'string' },
  { fieldNumber: 55, apiKey: '55_permit_history_other', group: 'structural', propName: 'permitHistoryPoolAdditions', type: 'string' },

  // ========== GROUP: location (LocationData in property.ts) ==========
  { fieldNumber: 56, apiKey: '56_assigned_elementary', group: 'location', propName: 'assignedElementary', type: 'string' },
  { fieldNumber: 57, apiKey: '57_elementary_rating', group: 'location', propName: 'elementaryRating', type: 'string' },
  { fieldNumber: 58, apiKey: '58_elementary_distance_miles', group: 'location', propName: 'elementaryDistanceMiles', type: 'number' },
  { fieldNumber: 59, apiKey: '59_assigned_middle', group: 'location', propName: 'assignedMiddle', type: 'string' },
  { fieldNumber: 60, apiKey: '60_middle_rating', group: 'location', propName: 'middleRating', type: 'string' },
  { fieldNumber: 61, apiKey: '61_middle_distance_miles', group: 'location', propName: 'middleDistanceMiles', type: 'number' },
  { fieldNumber: 62, apiKey: '62_assigned_high', group: 'location', propName: 'assignedHigh', type: 'string' },
  { fieldNumber: 63, apiKey: '63_high_rating', group: 'location', propName: 'highRating', type: 'string' },
  { fieldNumber: 64, apiKey: '64_high_distance_miles', group: 'location', propName: 'highDistanceMiles', type: 'number' },
  { fieldNumber: 65, apiKey: '65_walk_score', group: 'location', propName: 'walkScore', type: 'any' },
  { fieldNumber: 66, apiKey: '66_transit_score', group: 'location', propName: 'transitScore', type: 'any' },
  { fieldNumber: 67, apiKey: '67_bike_score', group: 'location', propName: 'bikeScore', type: 'any' },
  { fieldNumber: 68, apiKey: '68_noise_level', group: 'location', propName: 'noiseLevel', type: 'string' },
  { fieldNumber: 69, apiKey: '69_traffic_level', group: 'location', propName: 'trafficLevel', type: 'string' },
  { fieldNumber: 70, apiKey: '70_walkability_description', group: 'location', propName: 'walkabilityDescription', type: 'string' },
  { fieldNumber: 71, apiKey: '71_commute_time_city_center', group: 'location', propName: 'commuteTimeCityCenter', type: 'string' },
  { fieldNumber: 72, apiKey: '72_public_transit_access', group: 'location', propName: 'publicTransitAccess', type: 'string' },
  { fieldNumber: 73, apiKey: '73_distance_grocery_miles', group: 'location', propName: 'distanceGroceryMiles', type: 'number' },
  { fieldNumber: 74, apiKey: '74_distance_hospital_miles', group: 'location', propName: 'distanceHospitalMiles', type: 'number' },
  { fieldNumber: 75, apiKey: '75_distance_airport_miles', group: 'location', propName: 'distanceAirportMiles', type: 'number' },
  { fieldNumber: 76, apiKey: '76_distance_park_miles', group: 'location', propName: 'distanceParkMiles', type: 'number' },
  { fieldNumber: 77, apiKey: '77_distance_beach_miles', group: 'location', propName: 'distanceBeachMiles', type: 'number' },
  { fieldNumber: 78, apiKey: '78_crime_index_violent', group: 'location', propName: 'crimeIndexViolent', type: 'string' },
  { fieldNumber: 79, apiKey: '79_crime_index_property', group: 'location', propName: 'crimeIndexProperty', type: 'string' },
  { fieldNumber: 80, apiKey: '80_neighborhood_safety_rating', group: 'location', propName: 'neighborhoodSafetyRating', type: 'string' },

  // ========== GROUP: financial (FinancialData in property.ts) ==========
  { fieldNumber: 32, apiKey: '32_tax_exemptions', group: 'financial', propName: 'taxExemptions', type: 'string' },
  { fieldNumber: 33, apiKey: '33_property_tax_rate', group: 'financial', propName: 'propertyTaxRate', type: 'number' },
  { fieldNumber: 34, apiKey: '34_recent_tax_history', group: 'financial', propName: 'recentTaxPaymentHistory', type: 'string' },
  { fieldNumber: 81, apiKey: '81_median_home_price_neighborhood', group: 'financial', propName: 'medianHomePriceNeighborhood', type: 'number' },
  { fieldNumber: 82, apiKey: '82_price_per_sqft_recent_avg', group: 'financial', propName: 'pricePerSqftRecentAvg', type: 'number' },
  { fieldNumber: 83, apiKey: '83_days_on_market_avg', group: 'financial', propName: 'daysOnMarketAvg', type: 'number' },
  { fieldNumber: 84, apiKey: '84_inventory_surplus', group: 'financial', propName: 'inventorySurplus', type: 'string' },
  { fieldNumber: 85, apiKey: '85_rental_estimate_monthly', group: 'financial', propName: 'rentalEstimateMonthly', type: 'number' },
  { fieldNumber: 86, apiKey: '86_rental_yield_est', group: 'financial', propName: 'rentalYieldEst', type: 'number' },
  { fieldNumber: 87, apiKey: '87_vacancy_rate_neighborhood', group: 'financial', propName: 'vacancyRateNeighborhood', type: 'number' },
  { fieldNumber: 88, apiKey: '88_cap_rate_est', group: 'financial', propName: 'capRateEst', type: 'number' },
  { fieldNumber: 89, apiKey: '89_insurance_est_annual', group: 'financial', propName: 'insuranceEstAnnual', type: 'number' },
  { fieldNumber: 90, apiKey: '90_financing_terms', group: 'financial', propName: 'financingTerms', type: 'string' },
  { fieldNumber: 91, apiKey: '91_comparable_sales', group: 'financial', propName: 'comparableSalesLast3', type: 'array' },

  // ========== GROUP: utilities (UtilitiesData in property.ts) ==========
  { fieldNumber: 35, apiKey: '35_special_assessments', group: 'financial', propName: 'specialAssessments', type: 'string' },
  { fieldNumber: 92, apiKey: '92_electric_provider', group: 'utilities', propName: 'electricProvider', type: 'string' },
  { fieldNumber: 93, apiKey: '93_water_provider', group: 'utilities', propName: 'waterProvider', type: 'string' },
  { fieldNumber: 94, apiKey: '94_sewer_provider', group: 'utilities', propName: 'sewerProvider', type: 'string' },
  { fieldNumber: 95, apiKey: '95_natural_gas', group: 'utilities', propName: 'naturalGas', type: 'string' },
  { fieldNumber: 96, apiKey: '96_internet_providers_top', group: 'utilities', propName: 'internetProvidersTop3', type: 'array' },
  { fieldNumber: 97, apiKey: '97_max_internet_speed', group: 'utilities', propName: 'maxInternetSpeed', type: 'string' },
  { fieldNumber: 98, apiKey: '98_cable_tv_provider', group: 'utilities', propName: 'cableTvProvider', type: 'string' },
  { fieldNumber: 99, apiKey: '99_air_quality_index_current', group: 'utilities', propName: 'airQualityIndexCurrent', type: 'string' },
  { fieldNumber: 100, apiKey: '100_flood_zone', group: 'utilities', propName: 'floodZone', type: 'string' },
  { fieldNumber: 101, apiKey: '101_flood_risk_level', group: 'utilities', propName: 'floodRiskLevel', type: 'string' },
  { fieldNumber: 102, apiKey: '102_climate_risk_summary', group: 'utilities', propName: 'climateRiskWildfireFlood', type: 'string' },
  { fieldNumber: 103, apiKey: '103_noise_level_db_est', group: 'utilities', propName: 'noiseLevelDbEst', type: 'string' },
  { fieldNumber: 104, apiKey: '104_solar_potential', group: 'utilities', propName: 'solarPotential', type: 'string' },
  { fieldNumber: 105, apiKey: '105_ev_charging_yn', group: 'utilities', propName: 'evChargingYn', type: 'string' },
  { fieldNumber: 106, apiKey: '106_smart_home_features', group: 'utilities', propName: 'smartHomeFeatures', type: 'string' },
  { fieldNumber: 107, apiKey: '107_accessibility_mods', group: 'utilities', propName: 'accessibilityMods', type: 'string' },
  { fieldNumber: 108, apiKey: '108_pet_policy', group: 'utilities', propName: 'petPolicy', type: 'string' },
  { fieldNumber: 109, apiKey: '109_age_restrictions', group: 'utilities', propName: 'ageRestrictions', type: 'string' },
  { fieldNumber: 110, apiKey: '110_notes_confidence_summary', group: 'utilities', propName: 'notesConfidenceSummary', type: 'string' },
  // NOTE: Do NOT add entries with apiKeys that conflict with official 138-field schema!
  // The apiKeyToMappingMap will overwrite earlier entries with later ones.
  // Fields like trashProvider, fiberAvailable, etc. that aren't in the API's 138-field
  // schema should be handled separately, NOT by reusing existing field numbers.
];

const apiKeyToMappingMap = new Map<string, FieldPathMapping>();
FIELD_TO_PROPERTY_MAP.forEach(mapping => {
  apiKeyToMappingMap.set(mapping.apiKey, mapping);
});

const fieldNumberToMappingMap = new Map<number, FieldPathMapping>();
FIELD_TO_PROPERTY_MAP.forEach(mapping => {
  fieldNumberToMappingMap.set(mapping.fieldNumber, mapping);
});

/**
 * Create a properly typed DataField from raw API data
 */
function createDataField<T>(
  value: T | null,
  confidence: ConfidenceLevel = 'Medium',
  source: string = 'Unknown',
  llmSources: string[] = [],
  hasConflict: boolean = false,
  conflictValues: Array<{ source: string; value: any }> = [],
  validationStatus?: 'passed' | 'failed' | 'warning' | 'valid' | 'single_source_warning',
  validationMessage?: string
): DataField<T> {
  return {
    value,
    confidence,
    notes: source,
    sources: [source],
    llmSources,
    hasConflict,
    conflictValues,
    lastUpdated: new Date().toISOString(),
    validationStatus,
    validationMessage,
  };
}

/**
 * Map API confidence strings to our ConfidenceLevel type
 */
function mapConfidence(apiConf?: string): ConfidenceLevel {
  if (!apiConf) return 'Medium';
  const lower = apiConf.toLowerCase();
  if (lower === 'high' || lower === 'verified') return 'High';
  if (lower === 'medium-high') return 'Medium-High';
  if (lower === 'medium') return 'Medium';
  return 'Low';
}

/**
 * Validate and coerce value based on expected type
 */
function validateAndCoerce(value: any, mapping: FieldPathMapping): { valid: boolean; coerced: any } {
  if (value === null || value === undefined || value === '') {
    return { valid: false, coerced: null };
  }

  let coerced = value;

  switch (mapping.type) {
    case 'number':
      if (typeof value === 'string') {
        coerced = parseFloat(value.replace(/[$,]/g, ''));
      } else if (typeof value !== 'number') {
        coerced = parseFloat(String(value));
      }
      if (isNaN(coerced)) return { valid: false, coerced: null };
      if (mapping.validation && !mapping.validation(coerced)) {
        console.warn(`Validation failed for ${mapping.apiKey}: ${coerced} out of range`);
        return { valid: false, coerced: null };
      }
      break;

    case 'boolean':
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        coerced = lower === 'true' || lower === 'yes' || lower === '1';
      } else {
        coerced = Boolean(value);
      }
      break;

    case 'array':
      if (typeof value === 'string') {
        coerced = value.split(',').map(s => s.trim()).filter(Boolean);
      } else if (!Array.isArray(value)) {
        coerced = [String(value)];
      }
      break;

    case 'date':
    case 'string':
    default:
      coerced = String(value);
      break;
  }

  return { valid: true, coerced };
}

/**
 * Normalize flat API fields to nested Property structure
 * 
 * @param flatFields - API response with flat 138-field keys like { "10_listing_price": { value: 450000, source: "Zillow" } }
 * @param propertyId - Unique ID for this property
 * @param fieldSources - Optional map of field key to LLM sources that provided it
 * @param conflicts - Optional array of field conflicts between LLMs
 * @returns Properly structured Property object matching the TypeScript interface
 */
export function normalizeToProperty(
  flatFields: Record<string, FlatFieldData>,
  propertyId: string,
  fieldSources: Record<string, string[]> = {},
  conflicts: Array<{ field: string; values: Array<{ source: string; value: any }> }> = []
): Property {
  const now = new Date().toISOString();

  const emptyDataField = <T>(defaultValue: T | null = null): DataField<T> => ({
    value: defaultValue,
    confidence: 'Low',
    notes: '',
    sources: [],
    llmSources: [],
    hasConflict: false,
    conflictValues: [],
  });

  const property: Property = {
    id: propertyId,
    createdAt: now,
    updatedAt: now,
    address: {
      fullAddress: emptyDataField(),
      mlsPrimary: emptyDataField(),
      mlsSecondary: emptyDataField(),
      listingStatus: emptyDataField(),
      listingDate: emptyDataField(),
      listingPrice: emptyDataField(),
      pricePerSqft: emptyDataField(),
      streetAddress: emptyDataField(),
      city: emptyDataField(),
      state: emptyDataField(),
      zipCode: emptyDataField(),
      county: emptyDataField(),
      latitude: emptyDataField(),
      longitude: emptyDataField(),
      neighborhoodName: emptyDataField(),
    },
    details: {
      bedrooms: emptyDataField(),
      fullBathrooms: emptyDataField(),
      halfBathrooms: emptyDataField(),
      totalBathrooms: emptyDataField(),
      livingSqft: emptyDataField(),
      totalSqftUnderRoof: emptyDataField(),
      lotSizeSqft: emptyDataField(),
      lotSizeAcres: emptyDataField(),
      yearBuilt: emptyDataField(),
      propertyType: emptyDataField(),
      stories: emptyDataField(),
      garageSpaces: emptyDataField(),
      parkingTotal: emptyDataField(),
      hoaYn: emptyDataField(),
      hoaFeeAnnual: emptyDataField(),
      hoaName: emptyDataField(),
      hoaIncludes: emptyDataField(),
      annualTaxes: emptyDataField(),
      taxYear: emptyDataField(),
      assessedValue: emptyDataField(),
      marketValueEstimate: emptyDataField(),
      lastSaleDate: emptyDataField(),
      lastSalePrice: emptyDataField(),
      ownershipType: emptyDataField(),
      parcelId: emptyDataField(),
    },
    structural: {
      roofType: emptyDataField(),
      roofAgeEst: emptyDataField(),
      exteriorMaterial: emptyDataField(),
      foundation: emptyDataField(),
      hvacType: emptyDataField(),
      hvacAge: emptyDataField(),
      waterHeaterType: emptyDataField(),
      garageType: emptyDataField(),
      flooringType: emptyDataField(),
      kitchenFeatures: emptyDataField(),
      appliancesIncluded: emptyDataField(),
      laundryType: emptyDataField(),
      fireplaceYn: emptyDataField(),
      fireplaceCount: emptyDataField(),
      poolYn: emptyDataField(),
      poolType: emptyDataField(),
      deckPatio: emptyDataField(),
      fence: emptyDataField(),
      landscaping: emptyDataField(),
      recentRenovations: emptyDataField(),
      permitHistoryRoof: emptyDataField(),
      permitHistoryHvac: emptyDataField(),
      permitHistoryPoolAdditions: emptyDataField(),
      interiorCondition: emptyDataField(),
    },
    location: {
      assignedElementary: emptyDataField(),
      elementaryRating: emptyDataField(),
      elementaryDistanceMiles: emptyDataField(),
      assignedMiddle: emptyDataField(),
      middleRating: emptyDataField(),
      middleDistanceMiles: emptyDataField(),
      assignedHigh: emptyDataField(),
      highRating: emptyDataField(),
      highDistanceMiles: emptyDataField(),
      schoolDistrictName: emptyDataField(),
      elevationFeet: emptyDataField(),
      walkScore: emptyDataField(),
      transitScore: emptyDataField(),
      bikeScore: emptyDataField(),
      distanceGroceryMiles: emptyDataField(),
      distanceHospitalMiles: emptyDataField(),
      distanceAirportMiles: emptyDataField(),
      distanceParkMiles: emptyDataField(),
      distanceBeachMiles: emptyDataField(),
      crimeIndexViolent: emptyDataField(),
      crimeIndexProperty: emptyDataField(),
      neighborhoodSafetyRating: emptyDataField(),
      noiseLevel: emptyDataField(),
      trafficLevel: emptyDataField(),
      walkabilityDescription: emptyDataField(),
      commuteTimeCityCenter: emptyDataField(),
      publicTransitAccess: emptyDataField(),
    },
    financial: {
      annualPropertyTax: emptyDataField(),
      taxExemptions: emptyDataField(),
      propertyTaxRate: emptyDataField(),
      recentTaxPaymentHistory: emptyDataField(),
      medianHomePriceNeighborhood: emptyDataField(),
      pricePerSqftRecentAvg: emptyDataField(),
      redfinEstimate: emptyDataField(),
      priceToRentRatio: emptyDataField(),
      priceVsMedianPercent: emptyDataField(),
      daysOnMarketAvg: emptyDataField(),
      inventorySurplus: emptyDataField(),
      rentalEstimateMonthly: emptyDataField(),
      rentalYieldEst: emptyDataField(),
      vacancyRateNeighborhood: emptyDataField(),
      capRateEst: emptyDataField(),
      insuranceEstAnnual: emptyDataField(),
      financingTerms: emptyDataField(),
      comparableSalesLast3: emptyDataField(),
      specialAssessments: emptyDataField(),
    },
    utilities: {
      electricProvider: emptyDataField(),
      waterProvider: emptyDataField(),
      sewerProvider: emptyDataField(),
      naturalGas: emptyDataField(),
      trashProvider: emptyDataField(),
      internetProvidersTop3: emptyDataField(),
      maxInternetSpeed: emptyDataField(),
      fiberAvailable: emptyDataField(),
      cableTvProvider: emptyDataField(),
      avgElectricBill: emptyDataField(),
      avgWaterBill: emptyDataField(),
      cellCoverageQuality: emptyDataField(),
      emergencyServicesDistance: emptyDataField(),
      airQualityIndexCurrent: emptyDataField(),
      airQualityGrade: emptyDataField(),
      floodZone: emptyDataField(),
      floodRiskLevel: emptyDataField(),
      climateRiskWildfireFlood: emptyDataField(),
      wildfireRisk: emptyDataField(),
      earthquakeRisk: emptyDataField(),
      hurricaneRisk: emptyDataField(),
      tornadoRisk: emptyDataField(),
      radonRisk: emptyDataField(),
      superfundNearby: emptyDataField(),
      seaLevelRiseRisk: emptyDataField(),
      noiseLevelDbEst: emptyDataField(),
      solarPotential: emptyDataField(),
      evChargingYn: emptyDataField(),
      smartHomeFeatures: emptyDataField(),
      accessibilityMods: emptyDataField(),
      viewType: emptyDataField(),
      lotFeatures: emptyDataField(),
      petPolicy: emptyDataField(),
      ageRestrictions: emptyDataField(),
      notesConfidenceSummary: emptyDataField(),
    },
  };

  let fieldsPopulated = 0;

  for (const [apiKey, fieldData] of Object.entries(flatFields)) {
    if (!fieldData) continue;

    const mapping = apiKeyToMappingMap.get(apiKey);
    if (!mapping) {
      continue;
    }

    const rawValue = fieldData.value !== undefined ? fieldData.value : fieldData;
    const { valid, coerced } = validateAndCoerce(rawValue, mapping);

    if (!valid) {
      continue;
    }

    const source = fieldData.source || 'Unknown';
    const confidence = mapConfidence(fieldData.confidence);
    const llmSources = fieldSources[apiKey] || fieldData.llmSources || [];

    const conflict = conflicts.find(c => c.field === apiKey);
    const hasConflict = !!conflict;
    const conflictValues = conflict?.values || [];

    const dataField = createDataField(
      coerced,
      confidence,
      source,
      llmSources,
      hasConflict,
      conflictValues,
      fieldData.validationStatus,
      fieldData.validationMessage
    );

    const group = property[mapping.group] as unknown as Record<string, DataField<any>>;
    if (group && mapping.propName in group) {
      group[mapping.propName] = dataField;
      fieldsPopulated++;
    }
  }

  if (flatFields['1_full_address']?.value) {
    const fullAddr = String(flatFields['1_full_address'].value);
    const parts = fullAddr.split(',').map(s => s.trim());
    if (parts[0]) {
      property.address.streetAddress = createDataField(parts[0], 'High', 'Parsed from full address');
    }
    if (parts[1]) {
      property.address.city = createDataField(parts[1], 'High', 'Parsed from full address');
    }
    if (parts[2]) {
      const stateMatch = parts[2].match(/([A-Z]{2})/);
      const zipMatch = parts[2].match(/(\d{5})/);
      if (stateMatch) {
        property.address.state = createDataField(stateMatch[1], 'High', 'Parsed from full address');
      }
      if (zipMatch) {
        property.address.zipCode = createDataField(zipMatch[1], 'High', 'Parsed from full address');
      }
    }
  }

  if (flatFields['coordinates']?.value) {
    const coords = flatFields['coordinates'].value;
    if (coords.lat) {
      property.address.latitude = createDataField(coords.lat, 'High', 'Geocoded');
    }
    if (coords.lon || coords.lng) {
      property.address.longitude = createDataField(coords.lon || coords.lng, 'High', 'Geocoded');
    }
  }

  property.dataCompleteness = Math.round((fieldsPopulated / 138) * 100);
  property.smartScore = Math.min(100, fieldsPopulated + 20);

  return property;
}

/**
 * Get the mapping info for a field by its API key
 */
export function getFieldMapping(apiKey: string): FieldPathMapping | undefined {
  return apiKeyToMappingMap.get(apiKey);
}

/**
 * Get the mapping info for a field by its number
 */
export function getFieldMappingByNumber(fieldNumber: number): FieldPathMapping | undefined {
  return fieldNumberToMappingMap.get(fieldNumber);
}

/**
 * Get all API keys as a flat array
 */
export function getAllApiKeys(): string[] {
  return FIELD_TO_PROPERTY_MAP.map(m => m.apiKey);
}

/**
 * Data quality range definitions for Dashboard display
 * Each range corresponds to a field group in the 138-field schema
 */
export const DATA_QUALITY_RANGES = [
  { label: 'Core Fields (1-38)', min: 1, max: 38, colorClass: 'text-quantum-green' },
  { label: 'Structural (39-62)', min: 39, max: 62, colorClass: 'text-quantum-cyan' },
  { label: 'Location (63-90)', min: 63, max: 90, colorClass: 'text-quantum-blue' },
  { label: 'Financial (91-116)', min: 91, max: 116, colorClass: 'text-quantum-purple' },
  { label: 'Environment (117-138)', min: 117, max: 138, colorClass: 'text-quantum-gold' },
] as const;

/**
 * Get fields within a specific number range
 */
export function getFieldsInRange(minField: number, maxField: number): FieldPathMapping[] {
  return FIELD_TO_PROPERTY_MAP.filter(
    mapping => mapping.fieldNumber >= minField && mapping.fieldNumber <= maxField
  );
}

/**
 * Check if a DataField has a populated (non-null, non-empty) value
 */
function isFieldPopulated(field: DataField<any> | undefined): boolean {
  if (!field) return false;
  const val = field.value;
  if (val === null || val === undefined) return false;
  if (typeof val === 'string' && val.trim() === '') return false;
  if (Array.isArray(val) && val.length === 0) return false;
  return true;
}

/**
 * Compute data quality percentage for a specific field range within a single property
 */
export function computeRangeQuality(
  property: Property,
  minField: number,
  maxField: number
): number {
  const fieldsInRange = getFieldsInRange(minField, maxField);
  if (fieldsInRange.length === 0) return 0;

  let populatedCount = 0;

  for (const mapping of fieldsInRange) {
    const group = property[mapping.group as keyof Property];
    if (group && typeof group === 'object') {
      const field = (group as Record<string, any>)[mapping.propName];
      if (isFieldPopulated(field)) {
        populatedCount++;
      }
    }
  }

  return Math.round((populatedCount / fieldsInRange.length) * 100);
}

export interface DataQualityMetrics {
  label: string;
  percentage: number;
  colorClass: string;
  populatedFields: number;
  totalFields: number;
}

/**
 * Compute data quality metrics for all ranges across all properties
 * Returns averaged percentages when multiple properties exist
 */
export function computeDataQualityByRange(properties: Property[]): DataQualityMetrics[] {
  if (properties.length === 0) {
    return DATA_QUALITY_RANGES.map(range => ({
      label: range.label,
      percentage: 0,
      colorClass: range.colorClass,
      populatedFields: 0,
      totalFields: getFieldsInRange(range.min, range.max).length,
    }));
  }

  return DATA_QUALITY_RANGES.map(range => {
    const totalFields = getFieldsInRange(range.min, range.max).length;
    let totalPopulated = 0;

    for (const property of properties) {
      const rangeQuality = computeRangeQuality(property, range.min, range.max);
      totalPopulated += Math.round((rangeQuality / 100) * totalFields);
    }

    const avgPopulated = Math.round(totalPopulated / properties.length);
    const percentage = totalFields > 0 ? Math.round((avgPopulated / totalFields) * 100) : 0;

    return {
      label: range.label,
      percentage,
      colorClass: range.colorClass,
      populatedFields: avgPopulated,
      totalFields,
    };
  });
}
