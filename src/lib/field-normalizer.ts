/**
 * CLUES Property Dashboard - Unified Field Normalizer
 *
 * SINGLE SOURCE OF TRUTH for mapping flat 181-field API keys to the nested Property interface.
 * This MUST be the only place where field→path mapping is defined.
 * Updated: 2025-11-30 - Added 30 Stellar MLS fields (139-168)
 * Updated: 2025-01-05 - Added Market Performance (169-181)
 *
 * API returns: { "7_listing_price": { value: 450000, source: "Zillow" } }
 * Property type expects: property.address.listingPrice.value = 450000
 */

import type { Property, DataField, ConfidenceLevel } from '@/types/property';
import { enrichWithCalculatedFields } from './field-calculations';

// ============================================
// VALID DATA SOURCES - All recognized data sources
// Added: 2026-01-08 - Tavily integration
// ============================================
export const VALID_SOURCES = [
  // Tier 1: MLS
  'Stellar MLS',
  'Bridge MLS',
  'Bridge Interactive',
  // Tier 2: Google APIs
  'Google Places',
  'Google Geocoding',
  // Tier 3: Free APIs + Tavily
  'Tavily',
  'Tavily (Zillow)',
  'Tavily (Redfin)',
  'Tavily (Realtor.com)',
  'Tavily (Homes.com)',
  'Tavily (Property Appraiser)',  // Homestead/CDD from county PAO
  'Tavily (Tax Records)',          // Fallback tax record search
  'SchoolDigger',
  'FBI Crime',
  'WalkScore',
  'FEMA Flood',
  'AirNow',
  'HowLoud',
  'Weather',
  'U.S. Census',
  // Tier 4: LLMs
  'Perplexity',
  'Gemini',
  'GPT',
  'GPT-4o',
  'Claude Sonnet',
  'Grok',
  // Tier 5: Claude Opus
  'Claude Opus',
  // Legacy/Other
  'Zillow',
  'Redfin',
  'Realtor.com',
  'Homes.com',
  'County Records',
  'Unknown',
] as const;

export type ValidSource = typeof VALID_SOURCES[number];

// ============================================
// FIELD ALIASES - Backward compatibility layer
// Old keys → new canonical keys (transition support)
// ============================================
const FIELD_ALIASES: Record<string, string> = {
  // Old → new canonical (Field 31 refactor)
  "31_hoa_fee_annual": "31_association_fee",
  "hoa_fee_annual": "association_fee",
};

/**
 * Apply field aliases to normalize old keys to new canonical keys
 * Call this before validation to ensure backward compatibility
 */
export function applyFieldAliases(obj: Record<string, any>): Record<string, any> {
  for (const [oldKey, newKey] of Object.entries(FIELD_ALIASES)) {
    if (obj[oldKey] != null && obj[newKey] == null) {
      obj[newKey] = obj[oldKey];
    }
  }
  return obj;
}

export interface FlatFieldData {
  value: any;
  source?: string;
  confidence?: 'High' | 'Medium' | 'Low' | 'Unverified';
  llmSources?: string[];
  validationStatus?: 'passed' | 'failed' | 'warning' | 'valid' | 'single_source_warning';
  validationMessage?: string;
}

type GroupName = 'address' | 'details' | 'structural' | 'location' | 'financial' | 'utilities' | 'stellarMLS.parking' | 'stellarMLS.building' | 'stellarMLS.legal' | 'stellarMLS.waterfront' | 'stellarMLS.leasing' | 'stellarMLS.features' | 'marketPerformance';

interface FieldPathMapping {
  fieldNumber: number | string; // string for subfields like '16a', '16b', etc.
  apiKey: string;
  group: GroupName;
  propName: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'any';
  validation?: (val: any) => boolean;
}

/**
 * Complete 181-field mapping to Property interface structure
 * UPDATED: 2025-11-30 - Corrected ALL field numbers to match fields-schema.ts
 * UPDATED: 2026-01-05 - Added Market Performance fields (169-181)
 * group = the top-level object in Property (address, details, structural, location, financial, utilities, stellarMLS.*)
 * propName = the property name within that group
 */
export const FIELD_TO_PROPERTY_MAP: FieldPathMapping[] = [
  // ========== GROUP 1: Address & Identity (Fields 1-9) ==========
  { fieldNumber: 1, apiKey: '1_full_address', group: 'address', propName: 'fullAddress', type: 'string' },
  { fieldNumber: 2, apiKey: '2_mls_primary', group: 'address', propName: 'mlsPrimary', type: 'string' },
  { fieldNumber: 3, apiKey: '3_new_construction_yn', group: 'address', propName: 'newConstructionYN', type: 'boolean' },
  { fieldNumber: 4, apiKey: '4_listing_status', group: 'address', propName: 'listingStatus', type: 'string' },
  { fieldNumber: 5, apiKey: '5_listing_date', group: 'address', propName: 'listingDate', type: 'date' },
  { fieldNumber: 6, apiKey: '6_neighborhood', group: 'address', propName: 'neighborhoodName', type: 'string' },
  { fieldNumber: 7, apiKey: '7_county', group: 'address', propName: 'county', type: 'string' },
  { fieldNumber: 8, apiKey: '8_zip_code', group: 'address', propName: 'zipCode', type: 'string' },
  { fieldNumber: 9, apiKey: '9_parcel_id', group: 'details', propName: 'parcelId', type: 'string' },

  // ========== GROUP 2: Pricing & Value (Fields 10-16) ==========
  { fieldNumber: 10, apiKey: '10_listing_price', group: 'address', propName: 'listingPrice', type: 'number', validation: (v) => v > 0 && v < 1000000000 },
  { fieldNumber: 11, apiKey: '11_price_per_sqft', group: 'address', propName: 'pricePerSqft', type: 'number', validation: (v) => v > 0 && v < 50000 },

  // ========== PHOTOS - Stellar MLS Media (non-numbered, stored in address group) ==========
  // Photos do NOT have field numbers - they are stored directly in address.primaryPhotoUrl and address.photoGallery
  { fieldNumber: 'photo_primary', apiKey: 'property_photo_url', group: 'address', propName: 'primaryPhotoUrl', type: 'string' },
  { fieldNumber: 'photo_gallery', apiKey: 'property_photos', group: 'address', propName: 'photoGallery', type: 'array' },
  { fieldNumber: 12, apiKey: '12_market_value_estimate', group: 'details', propName: 'marketValueEstimate', type: 'number', validation: (v) => v > 0 && v < 1000000000 },
  { fieldNumber: 13, apiKey: '13_last_sale_date', group: 'details', propName: 'lastSaleDate', type: 'date' },
  { fieldNumber: 14, apiKey: '14_last_sale_price', group: 'details', propName: 'lastSalePrice', type: 'number', validation: (v) => v > 0 && v < 1000000000 },
  { fieldNumber: 15, apiKey: '15_assessed_value', group: 'details', propName: 'assessedValue', type: 'number', validation: (v) => v > 0 && v < 1000000000 },
  { fieldNumber: 16, apiKey: '16_avms', group: 'financial', propName: 'avms', type: 'number', validation: (v) => v >= 0 && v < 1000000000 },

  // ========== AVM Subfields (16a-16f) - Individual AVM Sources ==========
  { fieldNumber: '16a', apiKey: '16a_zestimate', group: 'financial', propName: 'zestimate', type: 'number', validation: (v) => v >= 0 && v < 1000000000 },
  { fieldNumber: '16b', apiKey: '16b_redfin_estimate', group: 'financial', propName: 'redfinEstimate', type: 'number', validation: (v) => v >= 0 && v < 1000000000 },
  { fieldNumber: '16c', apiKey: '16c_first_american_avm', group: 'financial', propName: 'firstAmericanAvm', type: 'number', validation: (v) => v >= 0 && v < 1000000000 },
  { fieldNumber: '16d', apiKey: '16d_quantarium_avm', group: 'financial', propName: 'quantariumAvm', type: 'number', validation: (v) => v >= 0 && v < 1000000000 },
  { fieldNumber: '16e', apiKey: '16e_ice_avm', group: 'financial', propName: 'iceAvm', type: 'number', validation: (v) => v >= 0 && v < 1000000000 },
  { fieldNumber: '16f', apiKey: '16f_collateral_analytics_avm', group: 'financial', propName: 'collateralAnalyticsAvm', type: 'number', validation: (v) => v >= 0 && v < 1000000000 },

  // ========== GROUP 3: Property Basics (Fields 17-29) ==========
  { fieldNumber: 17, apiKey: '17_bedrooms', group: 'details', propName: 'bedrooms', type: 'number', validation: (v) => v >= 0 && v <= 50 },
  { fieldNumber: 18, apiKey: '18_full_bathrooms', group: 'details', propName: 'fullBathrooms', type: 'number', validation: (v) => v >= 0 && v <= 30 },
  { fieldNumber: 19, apiKey: '19_half_bathrooms', group: 'details', propName: 'halfBathrooms', type: 'number', validation: (v) => v >= 0 && v <= 20 },
  { fieldNumber: 20, apiKey: '20_total_bathrooms', group: 'details', propName: 'totalBathrooms', type: 'number', validation: (v) => v >= 0 && v <= 50 },
  { fieldNumber: 21, apiKey: '21_living_sqft', group: 'details', propName: 'livingSqft', type: 'number', validation: (v) => v > 0 && v < 100000 },
  { fieldNumber: 22, apiKey: '22_total_sqft_under_roof', group: 'details', propName: 'totalSqftUnderRoof', type: 'number', validation: (v) => v > 0 && v < 150000 },
  { fieldNumber: 23, apiKey: '23_lot_size_sqft', group: 'details', propName: 'lotSizeSqft', type: 'number', validation: (v) => v > 0 },
  { fieldNumber: 24, apiKey: '24_lot_size_acres', group: 'details', propName: 'lotSizeAcres', type: 'number', validation: (v) => v > 0 },
  { fieldNumber: 25, apiKey: '25_year_built', group: 'details', propName: 'yearBuilt', type: 'number', validation: (v) => v >= 1700 && v <= new Date().getFullYear() + 2 },
  { fieldNumber: 26, apiKey: '26_property_type', group: 'details', propName: 'propertyType', type: 'string' },
  { fieldNumber: 27, apiKey: '27_stories', group: 'details', propName: 'stories', type: 'number', validation: (v) => v >= 1 && v <= 100 },
  { fieldNumber: 28, apiKey: '28_garage_spaces', group: 'details', propName: 'garageSpaces', type: 'number', validation: (v) => v >= 0 && v <= 20 },
  { fieldNumber: 29, apiKey: '29_parking_total', group: 'details', propName: 'parkingTotal', type: 'string' },

  // ========== GROUP 4: HOA & Taxes (Fields 30-38) ==========
  { fieldNumber: 30, apiKey: '30_hoa_yn', group: 'details', propName: 'hoaYn', type: 'boolean' },
  { fieldNumber: 31, apiKey: '31_association_fee', group: 'details', propName: 'associationFeeAnnualized', type: 'number', validation: (v) => v >= 0 && v < 500000 },
  // Fee subfields (31A-31F)
  { fieldNumber: '31A', apiKey: '31A_hoa_fee_monthly', group: 'details', propName: 'hoaFeeMonthly', type: 'number', validation: (v) => v >= 0 && v < 50000 },
  { fieldNumber: '31B', apiKey: '31B_hoa_fee_annual', group: 'details', propName: 'hoaFeeAnnual', type: 'number', validation: (v) => v >= 0 && v < 500000 },
  { fieldNumber: '31C', apiKey: '31C_condo_fee_monthly', group: 'details', propName: 'condoFeeMonthly', type: 'number', validation: (v) => v >= 0 && v < 50000 },
  { fieldNumber: '31D', apiKey: '31D_condo_fee_annual', group: 'details', propName: 'condoFeeAnnual', type: 'number', validation: (v) => v >= 0 && v < 500000 },
  { fieldNumber: '31E', apiKey: '31E_fee_frequency_primary', group: 'details', propName: 'feeFrequencyPrimary', type: 'string' },
  { fieldNumber: '31F', apiKey: '31F_fee_raw_notes', group: 'details', propName: 'feeRawNotes', type: 'string' },
  { fieldNumber: 32, apiKey: '32_hoa_name', group: 'details', propName: 'hoaName', type: 'string' },
  { fieldNumber: 33, apiKey: '33_hoa_includes', group: 'details', propName: 'hoaIncludes', type: 'string' },
  { fieldNumber: 34, apiKey: '34_ownership_type', group: 'details', propName: 'ownershipType', type: 'string' },
  { fieldNumber: 35, apiKey: '35_annual_taxes', group: 'details', propName: 'annualTaxes', type: 'number', validation: (v) => v >= 0 && v < 200000 },
  { fieldNumber: 36, apiKey: '36_tax_year', group: 'details', propName: 'taxYear', type: 'number', validation: (v) => v >= 1900 && v <= new Date().getFullYear() + 1 },
  { fieldNumber: 37, apiKey: '37_property_tax_rate', group: 'financial', propName: 'propertyTaxRate', type: 'number', validation: (v) => v >= 0 && v <= 10 },
  { fieldNumber: 38, apiKey: '38_tax_exemptions', group: 'financial', propName: 'taxExemptions', type: 'string' },

  // ========== GROUP 5: Structure & Systems (Fields 39-48) ==========
  { fieldNumber: 39, apiKey: '39_roof_type', group: 'structural', propName: 'roofType', type: 'string' },
  { fieldNumber: 40, apiKey: '40_roof_age_est', group: 'structural', propName: 'roofAgeEst', type: 'string' },
  { fieldNumber: 41, apiKey: '41_exterior_material', group: 'structural', propName: 'exteriorMaterial', type: 'string' },
  { fieldNumber: 42, apiKey: '42_foundation', group: 'structural', propName: 'foundation', type: 'string' },
  { fieldNumber: 43, apiKey: '43_water_heater_type', group: 'structural', propName: 'waterHeaterType', type: 'string' },
  { fieldNumber: 44, apiKey: '44_garage_type', group: 'structural', propName: 'garageType', type: 'string' },
  { fieldNumber: 45, apiKey: '45_hvac_type', group: 'structural', propName: 'hvacType', type: 'string' },
  { fieldNumber: 46, apiKey: '46_hvac_age', group: 'structural', propName: 'hvacAge', type: 'string' },
  { fieldNumber: 47, apiKey: '47_laundry_type', group: 'structural', propName: 'laundryType', type: 'string' },
  { fieldNumber: 48, apiKey: '48_interior_condition', group: 'structural', propName: 'interiorCondition', type: 'string' },

  // ========== GROUP 6: Interior Features (Fields 49-53) ==========
  { fieldNumber: 49, apiKey: '49_flooring_type', group: 'structural', propName: 'flooringType', type: 'string' },
  { fieldNumber: 50, apiKey: '50_kitchen_features', group: 'structural', propName: 'kitchenFeatures', type: 'string' },
  { fieldNumber: 51, apiKey: '51_appliances_included', group: 'structural', propName: 'appliancesIncluded', type: 'array' },
  { fieldNumber: 52, apiKey: '52_fireplace_yn', group: 'structural', propName: 'fireplaceYn', type: 'boolean' },
  { fieldNumber: 53, apiKey: '53_primary_br_location', group: 'structural', propName: 'primaryBrLocation', type: 'string' },

  // ========== GROUP 7: Exterior Features (Fields 54-58) ==========
  { fieldNumber: 54, apiKey: '54_pool_yn', group: 'structural', propName: 'poolYn', type: 'boolean' },
  { fieldNumber: 55, apiKey: '55_pool_type', group: 'structural', propName: 'poolType', type: 'string' },
  { fieldNumber: 56, apiKey: '56_deck_patio', group: 'structural', propName: 'deckPatio', type: 'string' },
  { fieldNumber: 57, apiKey: '57_fence', group: 'structural', propName: 'fence', type: 'string' },
  { fieldNumber: 58, apiKey: '58_landscaping', group: 'structural', propName: 'landscaping', type: 'string' },

  // ========== GROUP 8: Permits & Renovations (Fields 59-62) ==========
  { fieldNumber: 59, apiKey: '59_recent_renovations', group: 'structural', propName: 'recentRenovations', type: 'string' },
  { fieldNumber: 60, apiKey: '60_permit_history_roof', group: 'structural', propName: 'permitHistoryRoof', type: 'string' },
  { fieldNumber: 61, apiKey: '61_permit_history_hvac', group: 'structural', propName: 'permitHistoryHvac', type: 'string' },
  { fieldNumber: 62, apiKey: '62_permit_history_other', group: 'structural', propName: 'permitHistoryPoolAdditions', type: 'string' },

  // ========== GROUP 9: Schools (Fields 63-73) ==========
  { fieldNumber: 63, apiKey: '63_school_district', group: 'location', propName: 'schoolDistrictName', type: 'string' },
  { fieldNumber: 64, apiKey: '64_elevation_feet', group: 'location', propName: 'elevationFeet', type: 'number', validation: (v) => v >= -1000 && v <= 30000 },
  { fieldNumber: 65, apiKey: '65_elementary_school', group: 'location', propName: 'assignedElementary', type: 'string' },
  { fieldNumber: 66, apiKey: '66_elementary_rating', group: 'location', propName: 'elementaryRating', type: 'string' },
  { fieldNumber: 67, apiKey: '67_elementary_distance_mi', group: 'location', propName: 'elementaryDistanceMiles', type: 'number', validation: (v) => v >= 0 && v <= 100 },
  { fieldNumber: 68, apiKey: '68_middle_school', group: 'location', propName: 'assignedMiddle', type: 'string' },
  { fieldNumber: 69, apiKey: '69_middle_rating', group: 'location', propName: 'middleRating', type: 'string' },
  { fieldNumber: 70, apiKey: '70_middle_distance_mi', group: 'location', propName: 'middleDistanceMiles', type: 'number', validation: (v) => v >= 0 && v <= 100 },
  { fieldNumber: 71, apiKey: '71_high_school', group: 'location', propName: 'assignedHigh', type: 'string' },
  { fieldNumber: 72, apiKey: '72_high_rating', group: 'location', propName: 'highRating', type: 'string' },
  { fieldNumber: 73, apiKey: '73_high_distance_mi', group: 'location', propName: 'highDistanceMiles', type: 'number', validation: (v) => v >= 0 && v <= 100 },

  // ========== GROUP 10: Location Scores (Fields 74-82) ==========
  { fieldNumber: 74, apiKey: '74_walk_score', group: 'location', propName: 'walkScore', type: 'any' },
  { fieldNumber: 75, apiKey: '75_transit_score', group: 'location', propName: 'transitScore', type: 'any' },
  { fieldNumber: 76, apiKey: '76_bike_score', group: 'location', propName: 'bikeScore', type: 'any' },
  { fieldNumber: 77, apiKey: '77_safety_score', group: 'location', propName: 'safetyScore', type: 'any' },
  { fieldNumber: 78, apiKey: '78_noise_level', group: 'location', propName: 'noiseLevel', type: 'string' },
  { fieldNumber: 79, apiKey: '79_traffic_level', group: 'location', propName: 'trafficLevel', type: 'string' },
  { fieldNumber: 80, apiKey: '80_walkability_description', group: 'location', propName: 'walkabilityDescription', type: 'string' },
  { fieldNumber: 81, apiKey: '81_public_transit_access', group: 'location', propName: 'publicTransitAccess', type: 'string' },
  { fieldNumber: 82, apiKey: '82_commute_to_city_center', group: 'location', propName: 'commuteTimeCityCenter', type: 'string' },

  // ========== GROUP 11: Distances (Fields 83-87) ==========
  { fieldNumber: 83, apiKey: '83_distance_grocery_mi', group: 'location', propName: 'distanceGroceryMiles', type: 'number', validation: (v) => v >= 0 && v <= 100 },
  { fieldNumber: 84, apiKey: '84_distance_hospital_mi', group: 'location', propName: 'distanceHospitalMiles', type: 'number', validation: (v) => v >= 0 && v <= 100 },
  { fieldNumber: 85, apiKey: '85_distance_airport_mi', group: 'location', propName: 'distanceAirportMiles', type: 'number', validation: (v) => v >= 0 && v <= 500 },
  { fieldNumber: 86, apiKey: '86_distance_park_mi', group: 'location', propName: 'distanceParkMiles', type: 'number', validation: (v) => v >= 0 && v <= 100 },
  { fieldNumber: 87, apiKey: '87_distance_beach_mi', group: 'location', propName: 'distanceBeachMiles', type: 'number', validation: (v) => v >= 0 && v <= 500 },

  // ========== GROUP 12: Safety & Crime (Fields 88-90) ==========
  { fieldNumber: 88, apiKey: '88_violent_crime_index', group: 'location', propName: 'crimeIndexViolent', type: 'string' },
  { fieldNumber: 89, apiKey: '89_property_crime_index', group: 'location', propName: 'crimeIndexProperty', type: 'string' },
  { fieldNumber: 90, apiKey: '90_neighborhood_safety_rating', group: 'location', propName: 'neighborhoodSafetyRating', type: 'string' },

  // ========== GROUP 13: Market & Investment (Fields 91-103) ==========
  { fieldNumber: 91, apiKey: '91_median_home_price_neighborhood', group: 'financial', propName: 'medianHomePriceNeighborhood', type: 'number', validation: (v) => v >= 0 && v < 50000000 },
  { fieldNumber: 92, apiKey: '92_price_per_sqft_recent_avg', group: 'financial', propName: 'pricePerSqftRecentAvg', type: 'number', validation: (v) => v >= 0 && v < 50000 },
  { fieldNumber: 93, apiKey: '93_price_to_rent_ratio', group: 'financial', propName: 'priceToRentRatio', type: 'number', validation: (v) => v >= 0 && v <= 100 },
  { fieldNumber: 94, apiKey: '94_price_vs_median_percent', group: 'financial', propName: 'priceVsMedianPercent', type: 'number', validation: (v) => v >= -100 && v <= 1000 },
  { fieldNumber: 95, apiKey: '95_days_on_market_avg', group: 'financial', propName: 'daysOnMarketAvg', type: 'number', validation: (v) => v >= 0 && v <= 3650 },
  { fieldNumber: 96, apiKey: '96_inventory_surplus', group: 'financial', propName: 'inventorySurplus', type: 'string' },
  { fieldNumber: 97, apiKey: '97_insurance_est_annual', group: 'financial', propName: 'insuranceEstAnnual', type: 'number', validation: (v) => v >= 0 && v < 100000 },
  { fieldNumber: 98, apiKey: '98_rental_estimate_monthly', group: 'financial', propName: 'rentalEstimateMonthly', type: 'number', validation: (v) => v >= 0 && v < 500000 },
  { fieldNumber: 99, apiKey: '99_rental_yield_est', group: 'financial', propName: 'rentalYieldEst', type: 'number', validation: (v) => v >= 0 && v <= 50 },
  { fieldNumber: 100, apiKey: '100_vacancy_rate_neighborhood', group: 'financial', propName: 'vacancyRateNeighborhood', type: 'number', validation: (v) => v >= 0 && v <= 100 },
  { fieldNumber: 101, apiKey: '101_cap_rate_est', group: 'financial', propName: 'capRateEst', type: 'number', validation: (v) => v >= 0 && v <= 50 },
  { fieldNumber: 102, apiKey: '102_financing_terms', group: 'financial', propName: 'financingTerms', type: 'string' },
  { fieldNumber: 103, apiKey: '103_comparable_sales', group: 'financial', propName: 'comparableSalesLast3', type: 'array' },

  // ========== GROUP 14: Utilities (Fields 104-116) ==========
  { fieldNumber: 104, apiKey: '104_electric_provider', group: 'utilities', propName: 'electricProvider', type: 'string' },
  { fieldNumber: 105, apiKey: '105_avg_electric_bill', group: 'utilities', propName: 'avgElectricBill', type: 'string' },
  { fieldNumber: 106, apiKey: '106_water_provider', group: 'utilities', propName: 'waterProvider', type: 'string' },
  { fieldNumber: 107, apiKey: '107_avg_water_bill', group: 'utilities', propName: 'avgWaterBill', type: 'string' },
  { fieldNumber: 108, apiKey: '108_sewer_provider', group: 'utilities', propName: 'sewerProvider', type: 'string' },
  { fieldNumber: 109, apiKey: '109_natural_gas', group: 'utilities', propName: 'naturalGas', type: 'boolean' },
  { fieldNumber: 110, apiKey: '110_trash_provider', group: 'utilities', propName: 'trashProvider', type: 'string' },
  { fieldNumber: 111, apiKey: '111_internet_providers_top3', group: 'utilities', propName: 'internetProvidersTop3', type: 'array' },
  { fieldNumber: 112, apiKey: '112_max_internet_speed', group: 'utilities', propName: 'maxInternetSpeed', type: 'string' },
  { fieldNumber: 113, apiKey: '113_fiber_available', group: 'utilities', propName: 'fiberAvailable', type: 'boolean' },
  { fieldNumber: 114, apiKey: '114_cable_tv_provider', group: 'utilities', propName: 'cableTvProvider', type: 'string' },
  { fieldNumber: 115, apiKey: '115_cell_coverage_quality', group: 'utilities', propName: 'cellCoverageQuality', type: 'string' },
  { fieldNumber: 116, apiKey: '116_emergency_services_distance', group: 'utilities', propName: 'emergencyServicesDistance', type: 'string' },

  // ========== GROUP 15: Environment & Risk (Fields 117-130) ==========
  { fieldNumber: 117, apiKey: '117_air_quality_index', group: 'utilities', propName: 'airQualityIndexCurrent', type: 'string' },
  { fieldNumber: 118, apiKey: '118_air_quality_grade', group: 'utilities', propName: 'airQualityGrade', type: 'string' },
  { fieldNumber: 119, apiKey: '119_flood_zone', group: 'utilities', propName: 'floodZone', type: 'string' },
  { fieldNumber: 120, apiKey: '120_flood_risk_level', group: 'utilities', propName: 'floodRiskLevel', type: 'string' },
  { fieldNumber: 121, apiKey: '121_climate_risk', group: 'utilities', propName: 'climateRiskWildfireFlood', type: 'string' },
  { fieldNumber: 122, apiKey: '122_wildfire_risk', group: 'utilities', propName: 'wildfireRisk', type: 'string' },
  { fieldNumber: 123, apiKey: '123_earthquake_risk', group: 'utilities', propName: 'earthquakeRisk', type: 'string' },
  { fieldNumber: 124, apiKey: '124_hurricane_risk', group: 'utilities', propName: 'hurricaneRisk', type: 'string' },
  { fieldNumber: 125, apiKey: '125_tornado_risk', group: 'utilities', propName: 'tornadoRisk', type: 'string' },
  { fieldNumber: 126, apiKey: '126_radon_risk', group: 'utilities', propName: 'radonRisk', type: 'string' },
  { fieldNumber: 127, apiKey: '127_superfund_site_nearby', group: 'utilities', propName: 'superfundNearby', type: 'boolean' },
  { fieldNumber: 128, apiKey: '128_sea_level_rise_risk', group: 'utilities', propName: 'seaLevelRiseRisk', type: 'string' },
  { fieldNumber: 129, apiKey: '129_noise_level_db_est', group: 'utilities', propName: 'noiseLevelDbEst', type: 'string' },
  { fieldNumber: 130, apiKey: '130_solar_potential', group: 'utilities', propName: 'solarPotential', type: 'string' },

  // ========== GROUP 16: Additional Features (Fields 131-138) ==========
  { fieldNumber: 131, apiKey: '131_view_type', group: 'utilities', propName: 'viewType', type: 'string' },
  { fieldNumber: 132, apiKey: '132_lot_features', group: 'utilities', propName: 'lotFeatures', type: 'string' },
  { fieldNumber: 133, apiKey: '133_ev_charging', group: 'utilities', propName: 'evChargingYn', type: 'boolean' },
  { fieldNumber: 134, apiKey: '134_smart_home_features', group: 'utilities', propName: 'smartHomeFeatures', type: 'string' },
  { fieldNumber: 135, apiKey: '135_accessibility_modifications', group: 'utilities', propName: 'accessibilityMods', type: 'string' },
  { fieldNumber: 136, apiKey: '136_pet_policy', group: 'utilities', propName: 'petPolicy', type: 'string' },
  { fieldNumber: 137, apiKey: '137_age_restrictions', group: 'utilities', propName: 'ageRestrictions', type: 'string' },
  { fieldNumber: 138, apiKey: '138_special_assessments', group: 'financial', propName: 'specialAssessments', type: 'string' },

  // ========== GROUP 17: Stellar MLS - Parking (Fields 139-143) ==========
  { fieldNumber: 139, apiKey: '139_carport_yn', group: 'stellarMLS.parking', propName: 'carportYn', type: 'boolean' },
  { fieldNumber: 140, apiKey: '140_carport_spaces', group: 'stellarMLS.parking', propName: 'carportSpaces', type: 'number', validation: (v) => v >= 0 && v <= 20 },
  { fieldNumber: 141, apiKey: '141_garage_attached_yn', group: 'stellarMLS.parking', propName: 'garageAttachedYn', type: 'boolean' },
  { fieldNumber: 142, apiKey: '142_parking_features', group: 'stellarMLS.parking', propName: 'parkingFeatures', type: 'array' },
  { fieldNumber: 143, apiKey: '143_assigned_parking_spaces', group: 'stellarMLS.parking', propName: 'assignedParkingSpaces', type: 'number', validation: (v) => v >= 0 && v <= 20 },

  // ========== GROUP 18: Stellar MLS - Building (Fields 144-148) ==========
  { fieldNumber: 144, apiKey: '144_floor_number', group: 'stellarMLS.building', propName: 'floorNumber', type: 'number', validation: (v) => v >= 0 && v <= 200 },
  { fieldNumber: 145, apiKey: '145_building_total_floors', group: 'stellarMLS.building', propName: 'buildingTotalFloors', type: 'number', validation: (v) => v >= 1 && v <= 200 },
  { fieldNumber: 146, apiKey: '146_building_name_number', group: 'stellarMLS.building', propName: 'buildingNameNumber', type: 'string' },
  { fieldNumber: 147, apiKey: '147_building_elevator_yn', group: 'stellarMLS.building', propName: 'buildingElevatorYn', type: 'boolean' },
  { fieldNumber: 148, apiKey: '148_floors_in_unit', group: 'stellarMLS.building', propName: 'floorsInUnit', type: 'number', validation: (v) => v >= 1 && v <= 10 },

  // ========== GROUP 19: Stellar MLS - Legal (Fields 149-154) ==========
  { fieldNumber: 149, apiKey: '149_subdivision_name', group: 'stellarMLS.legal', propName: 'subdivisionName', type: 'string' },
  { fieldNumber: 150, apiKey: '150_legal_description', group: 'stellarMLS.legal', propName: 'legalDescription', type: 'string' },
  { fieldNumber: 151, apiKey: '151_homestead_yn', group: 'stellarMLS.legal', propName: 'homesteadYn', type: 'boolean' },
  { fieldNumber: 152, apiKey: '152_cdd_yn', group: 'stellarMLS.legal', propName: 'cddYn', type: 'boolean' },
  { fieldNumber: 153, apiKey: '153_annual_cdd_fee', group: 'stellarMLS.legal', propName: 'annualCddFee', type: 'number', validation: (v) => v >= 0 && v < 50000 },
  { fieldNumber: 154, apiKey: '154_front_exposure', group: 'stellarMLS.legal', propName: 'frontExposure', type: 'string' },

  // ========== GROUP 20: Stellar MLS - Waterfront (Fields 155-159) ==========
  { fieldNumber: 155, apiKey: '155_water_frontage_yn', group: 'stellarMLS.waterfront', propName: 'waterFrontageYn', type: 'boolean' },
  { fieldNumber: 156, apiKey: '156_waterfront_feet', group: 'stellarMLS.waterfront', propName: 'waterfrontFeet', type: 'number', validation: (v) => v >= 0 && v < 10000 },
  { fieldNumber: 157, apiKey: '157_water_access_yn', group: 'stellarMLS.waterfront', propName: 'waterAccessYn', type: 'boolean' },
  { fieldNumber: 158, apiKey: '158_water_view_yn', group: 'stellarMLS.waterfront', propName: 'waterViewYn', type: 'boolean' },
  { fieldNumber: 159, apiKey: '159_water_body_name', group: 'stellarMLS.waterfront', propName: 'waterBodyName', type: 'string' },

  // ========== GROUP 21: Stellar MLS - Leasing (Fields 160-165) ==========
  { fieldNumber: 160, apiKey: '160_can_be_leased_yn', group: 'stellarMLS.leasing', propName: 'canBeLeasedYn', type: 'boolean' },
  { fieldNumber: 161, apiKey: '161_minimum_lease_period', group: 'stellarMLS.leasing', propName: 'minimumLeasePeriod', type: 'string' },
  { fieldNumber: 162, apiKey: '162_lease_restrictions_yn', group: 'stellarMLS.leasing', propName: 'leaseRestrictionsYn', type: 'boolean' },
  { fieldNumber: 163, apiKey: '163_pet_size_limit', group: 'stellarMLS.leasing', propName: 'petSizeLimit', type: 'string' },
  { fieldNumber: 164, apiKey: '164_max_pet_weight', group: 'stellarMLS.leasing', propName: 'maxPetWeight', type: 'number', validation: (v) => v >= 0 && v <= 500 },
  { fieldNumber: 165, apiKey: '165_association_approval_yn', group: 'stellarMLS.leasing', propName: 'associationApprovalYn', type: 'boolean' },

  // ========== GROUP 22: Stellar MLS - Features (Fields 166-168) ==========
  { fieldNumber: 166, apiKey: '166_community_features', group: 'stellarMLS.features', propName: 'communityFeatures', type: 'array' },
  { fieldNumber: 167, apiKey: '167_interior_features', group: 'stellarMLS.features', propName: 'interiorFeatures', type: 'array' },
  { fieldNumber: '167C', apiKey: '167C_furnished_yn', group: 'stellarMLS.features', propName: 'furnishedYn', type: 'boolean' },
  { fieldNumber: 168, apiKey: '168_exterior_features', group: 'stellarMLS.features', propName: 'exteriorFeatures', type: 'array' },

  // ========== GROUP 23: Market Performance (Fields 169-181) - Section W ==========
  { fieldNumber: 169, apiKey: '169_months_of_inventory', group: 'marketPerformance', propName: 'monthsOfInventory', type: 'number', validation: (v) => v >= 0 },
  { fieldNumber: 170, apiKey: '170_new_listings_30d', group: 'marketPerformance', propName: 'newListings30d', type: 'number', validation: (v) => v >= 0 },
  { fieldNumber: 171, apiKey: '171_homes_sold_30d', group: 'marketPerformance', propName: 'homesSold30d', type: 'number', validation: (v) => v >= 0 },
  { fieldNumber: 172, apiKey: '172_median_dom_zip', group: 'marketPerformance', propName: 'medianDomZip', type: 'number', validation: (v) => v >= 0 },
  { fieldNumber: 173, apiKey: '173_price_reduced_percent', group: 'marketPerformance', propName: 'priceReducedPercent', type: 'number', validation: (v) => v >= 0 },
  { fieldNumber: 174, apiKey: '174_homes_under_contract', group: 'marketPerformance', propName: 'homesUnderContract', type: 'number', validation: (v) => v >= 0 },
  { fieldNumber: 175, apiKey: '175_market_type', group: 'marketPerformance', propName: 'marketType', type: 'string' },
  { fieldNumber: 176, apiKey: '176_avg_sale_to_list_percent', group: 'marketPerformance', propName: 'avgSaleToListPercent', type: 'number', validation: (v) => v >= 0 && v <= 200 },
  { fieldNumber: 177, apiKey: '177_avg_days_to_pending', group: 'marketPerformance', propName: 'avgDaysToPending', type: 'number', validation: (v) => v >= 0 && v <= 365 },
  { fieldNumber: 178, apiKey: '178_multiple_offers_likelihood', group: 'marketPerformance', propName: 'multipleOffersLikelihood', type: 'string' },
  { fieldNumber: 179, apiKey: '179_appreciation_percent', group: 'marketPerformance', propName: 'appreciationPercent', type: 'number', validation: (v) => v >= -100 && v <= 500 },
  { fieldNumber: 180, apiKey: '180_price_trend', group: 'marketPerformance', propName: 'priceTrend', type: 'string' },
  { fieldNumber: 181, apiKey: '181_rent_zestimate', group: 'marketPerformance', propName: 'rentZestimate', type: 'number', validation: (v) => v >= 0 && v < 100000 },
];

const apiKeyToMappingMap = new Map<string, FieldPathMapping>();
FIELD_TO_PROPERTY_MAP.forEach(mapping => {
  apiKeyToMappingMap.set(mapping.apiKey, mapping);
});

const fieldNumberToMappingMap = new Map<number | string, FieldPathMapping>();
FIELD_TO_PROPERTY_MAP.forEach(mapping => {
  fieldNumberToMappingMap.set(mapping.fieldNumber, mapping);
});

/**
 * PERPLEXITY FIELD NAME TRANSLATION MAP
 * Perplexity returns grouped field names (e.g., "property_basics_bedrooms")
 * This map translates them to our numbered schema (e.g., "17_bedrooms")
 */
const PERPLEXITY_TO_NUMBERED_FIELDS: Record<string, string> = {
  // Address & Identity
  'address_identity_full_address': '1_full_address',
  'address_identity_mls_primary': '2_mls_primary',
  'address_identity_new_construction_yn': '3_new_construction_yn',
  'address_identity_neighborhood': '6_neighborhood',
  'address_identity_county': '7_county',
  'address_identity_zip_code': '8_zip_code',
  'address_identity_parcel_id': '9_parcel_id',
  // ❌ REMOVED: street_address, city, state were overwriting 1_full_address
  // Only keep the grouped full_address mapping (line 271)
  'address_identity_latitude': 'coordinates',
  'address_identity_longitude': 'coordinates',

  // Pricing & Value
  'pricing_value_listing_status': '4_listing_status',
  'pricing_value_listing_date': '5_listing_date',
  'pricing_value_listing_price': '10_listing_price',
  'pricing_value_price_per_sq_ft': '11_price_per_sqft',
  'pricing_value_market_value_estimate': '12_market_value_estimate',
  'pricing_value_last_sale_date': '13_last_sale_date',
  'pricing_value_last_sale_price': '14_last_sale_price',
  'pricing_value_assessed_value': '15_assessed_value',
  'pricing_value_assessed_value_year': '15_assessed_value',

  // Property Basics
  'property_basics_bedrooms': '17_bedrooms',
  'property_basics_full_bathrooms': '18_full_bathrooms',
  'property_basics_half_bathrooms': '19_half_bathrooms',
  'property_basics_total_bathrooms': '20_total_bathrooms',
  'property_basics_living_sq_ft': '21_living_sqft',
  'property_basics_total_sq_ft_under_roof': '22_total_sqft_under_roof',
  'property_basics_lot_size_sq_ft': '23_lot_size_sqft',
  'property_basics_lot_size_acres': '24_lot_size_acres',
  'property_basics_year_built': '25_year_built',
  'property_basics_property_type': '26_property_type',
  'property_basics_stories': '27_stories',
  'property_basics_garage_spaces': '28_garage_spaces',
  'property_basics_parking_total': '29_parking_total',
  'property_basics_ownership_type': '34_ownership_type',

  // HOA & Taxes
  'hoa_taxes_hoa': '30_hoa_yn',
  'hoa_taxes_hoa_fee_monthly': '31_hoa_fee_annual',
  'hoa_taxes_hoa_name': '32_hoa_name',
  'hoa_taxes_hoa_includes': '33_hoa_includes',
  'hoa_taxes_annual_taxes': '35_annual_taxes',
  'hoa_taxes_tax_year': '36_tax_year',
  'hoa_taxes_property_tax_rate_percent': '37_property_tax_rate',

  // Structure & Systems
  'structure_systems_roof_type': '39_roof_type',
  'structure_systems_exterior_material': '41_exterior_material',
  'structure_systems_foundation': '42_foundation',
  'structure_systems_hvac_type': '45_hvac_type',
  'structure_systems_water_heater_type': '43_water_heater_type',
  'structure_systems_laundry_type': '47_laundry_type',

  // Interior Features
  'interior_features_flooring_type': '49_flooring_type',
  'interior_features_kitchen_features': '50_kitchen_features',
  'interior_features_appliances_included': '51_appliances_included',
  'interior_features_fireplace': '52_fireplace_yn',
  // FIXED 2026-01-08: Field 53 is Primary BR Location, NOT fireplace count
  'interior_features_primary_br_location': '53_primary_br_location',
  'primary_bedroom_level': '53_primary_br_location',
  'master_bedroom_level': '53_primary_br_location',

  // Exterior Features
  'exterior_features_pool': '54_pool_yn',
  'exterior_features_pool_type': '55_pool_type',
  'exterior_features_deck_patio': '56_deck_patio',
  'exterior_features_fence': '57_fence',
  'exterior_features_landscaping': '58_landscaping',
  'exterior_features_landscaping_quality': '58_landscaping',
  'exterior_features_yard_description': '58_landscaping',
  'exterior_features_waterfront': '155_water_frontage_yn',
  'exterior_features_waterfront_feet': '156_waterfront_feet',
  'exterior_features_water_access': '157_water_access_yn',
  'exterior_features_water_view': '158_water_view_yn',
  'exterior_features_water_body_name': '159_water_body_name',
  'exterior_features_view': '131_view_type',
  'exterior_features_lot_features': '132_lot_features',
  'exterior_features_lot_description': '132_lot_features',

  // Schools
  'schools_scores_school_district': '63_school_district',
  'schools_scores_elementary_school_name': '65_elementary_school',
  'schools_scores_elementary_school_rating': '66_elementary_rating',
  'schools_scores_middle_school_name': '68_middle_school',
  'schools_scores_middle_school_rating': '69_middle_rating',
  'schools_scores_high_school_name': '71_high_school',
  'schools_scores_high_school_rating': '72_high_rating',

  // Market & Investment
  'market_investment_median_home_price_neighborhood': '91_median_home_price_neighborhood',
  'market_investment_avg_days_on_market': '95_days_on_market_avg',
  'market_investment_insurance_estimate_annual': '97_insurance_est_annual',
  'market_investment_rental_estimate_monthly': '98_rental_estimate_monthly',
  'market_investment_rental_yield_percent': '99_rental_yield_est',
  'market_investment_cap_rate_est_percent': '101_cap_rate_est',

  // Utilities & Connectivity
  'utilities_connectivity_electric_provider': '104_electric_provider',
  'utilities_connectivity_water_provider': '106_water_provider',
  'utilities_connectivity_internet_providers': '111_internet_providers_top3',
  'utilities_connectivity_fiber_available': '113_fiber_available',

  // Environment & Risk
  'environment_risk_flood_zone_code': '119_flood_zone',
  'environment_risk_flood_risk_level': '120_flood_risk_level',
  'environment_risk_hurricane_risk': '124_hurricane_risk',
  'environment_risk_elevation_feet': '64_elevation_feet',
};

/**
 * Create a properly typed DataField from raw API data
 */
function createDataField<T>(
  value: T | null,
  confidence: ConfidenceLevel = 'Medium',
  source: string = 'API Data',
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
 * FIX #15: Handle empty string explicitly - treat as 'Medium' not 'Low'
 */
function mapConfidence(apiConf?: string): ConfidenceLevel {
  // FIX #15: Empty string should be treated same as undefined (return default)
  if (!apiConf || apiConf.trim() === '') return 'Medium';
  const lower = apiConf.toLowerCase().trim();
  if (lower === 'high' || lower === 'verified') return 'High';
  if (lower === 'medium-high') return 'Medium-High';
  if (lower === 'medium') return 'Medium';
  if (lower === 'low' || lower === 'unverified') return 'Low';
  // Unknown confidence values default to Medium, not Low
  return 'Medium';
}

/**
 * Normalize bi-monthly utility bills to monthly
 * FL utilities often bill bi-monthly (every 2 months)
 */
function normalizeUtilityBillToMonthly(fieldKey: string, value: any): number | null {
  // Parse string values like "$919" or "919" to numbers
  let numericValue: number;
  if (typeof value === 'number') {
    numericValue = value;
  } else if (typeof value === 'string') {
    const cleaned = value.replace(/[$,\s]/g, '').trim();
    numericValue = parseFloat(cleaned);
  } else {
    return null;
  }

  if (isNaN(numericValue) || numericValue <= 0) {
    return null;
  }

  // Field 107: Water bill - if > 120, assume bi-monthly
  if (fieldKey === '107_avg_water_bill' || fieldKey === 'avg_water_bill' || fieldKey === 'avgWaterBill') {
    if (numericValue > 120) {
      const monthly = Math.round(numericValue / 2);
      console.log(`[FIELD-NORMALIZER] 🔄 WATER BILL: $${numericValue} bi-monthly → $${monthly}/month`);
      return monthly;
    }
  }

  // NOTE: Electric bill normalization removed per user request - only water bills are normalized

  return null;
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
        // Reject pool type strings that should never be converted to boolean
        // (prevents "Community", "Private", "In-ground" from becoming boolean true/false)
        if (['community', 'private', 'in-ground', 'above-ground', 'heated', 'inground', 'aboveground'].some(t => lower.includes(t))) {
          return { valid: false, coerced: null };
        }
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

    case 'any':
      // FIX 2026-01-09: Preserve original type for 'any' fields (walk/transit/bike scores)
      // Don't convert to string - keep numbers as numbers
      coerced = value;
      break;

    case 'date':
    case 'string':
    default:
      // Handle objects returned by LLMs (prevents "[object Object]" display)
      if (typeof value === 'object' && value !== null) {
        // If it's an object with nested data, stringify it properly
        if (Array.isArray(value)) {
          coerced = value.join(', ');
        } else {
          // Try to extract meaningful string from object
          // Check for common patterns: { value: "foo" }, { text: "foo" }, etc.
          if ('value' in value && value.value) {
            coerced = String(value.value);
          } else if ('text' in value && value.text) {
            coerced = String(value.text);
          } else if ('name' in value && value.name) {
            coerced = String(value.name);
          } else {
            // Last resort: JSON stringify for debugging
            coerced = JSON.stringify(value);
          }
        }
      } else {
        coerced = String(value);
      }
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
  // Apply field aliases for backward compatibility (e.g., 31_hoa_fee_annual → 31_association_fee)
  // This mutates the keys in place to map old keys to new canonical keys
  applyFieldAliases(flatFields);

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
      newConstructionYN: emptyDataField(),
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
      // Photos (Fields 169-170) - Populated from Stellar MLS or Google Street View
      primaryPhotoUrl: emptyDataField(),
      photoGallery: emptyDataField([]),
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
      primaryBrLocation: emptyDataField(),
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
      safetyScore: emptyDataField(),
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
      avms: emptyDataField(),
      // AVM Subfields (16a-16f)
      zestimate: emptyDataField(),
      redfinEstimate: emptyDataField(),
      firstAmericanAvm: emptyDataField(),
      quantariumAvm: emptyDataField(),
      iceAvm: emptyDataField(),
      collateralAnalyticsAvm: emptyDataField(),
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
    // NEW: Stellar MLS fields (139-168) - Added 2025-11-30
    stellarMLS: {
      parking: {
        carportYn: emptyDataField(),
        carportSpaces: emptyDataField(),
        garageAttachedYn: emptyDataField(),
        parkingFeatures: emptyDataField(),
        assignedParkingSpaces: emptyDataField(),
      },
      building: {
        floorNumber: emptyDataField(),
        buildingTotalFloors: emptyDataField(),
        buildingNameNumber: emptyDataField(),
        buildingElevatorYn: emptyDataField(),
        floorsInUnit: emptyDataField(),
      },
      legal: {
        subdivisionName: emptyDataField(),
        legalDescription: emptyDataField(),
        homesteadYn: emptyDataField(),
        cddYn: emptyDataField(),
        annualCddFee: emptyDataField(),
        frontExposure: emptyDataField(),
      },
      waterfront: {
        waterFrontageYn: emptyDataField(),
        waterfrontFeet: emptyDataField(),
        waterAccessYn: emptyDataField(),
        waterViewYn: emptyDataField(),
        waterBodyName: emptyDataField(),
      },
      leasing: {
        canBeLeasedYn: emptyDataField(),
        minimumLeasePeriod: emptyDataField(),
        leaseRestrictionsYn: emptyDataField(),
        petSizeLimit: emptyDataField(),
        maxPetWeight: emptyDataField(),
        associationApprovalYn: emptyDataField(),
      },
      features: {
        communityFeatures: emptyDataField(),
        interiorFeatures: emptyDataField(),
        exteriorFeatures: emptyDataField(),
      },
    },
    // NEW: Market Performance fields (169-181) - Section W
    marketPerformance: {
      monthsOfInventory: emptyDataField(),
      newListings30d: emptyDataField(),
      homesSold30d: emptyDataField(),
      medianDomZip: emptyDataField(),
      priceReducedPercent: emptyDataField(),
      homesUnderContract: emptyDataField(),
      marketType: emptyDataField(),
      avgSaleToListPercent: emptyDataField(),
      avgDaysToPending: emptyDataField(),
      multipleOffersLikelihood: emptyDataField(),
      appreciationPercent: emptyDataField(),
      priceTrend: emptyDataField(),
      rentZestimate: emptyDataField(),
    },
  };

  let fieldsPopulated = 0;
  let fieldsReceived = 0;
  let fieldsMissingMapping = 0;
  let fieldsFailedValidation = 0;

  console.log(`🔍 normalizeToProperty: Received ${Object.keys(flatFields).length} fields`);

  for (const [rawApiKey, fieldData] of Object.entries(flatFields)) {
    fieldsReceived++;

    if (!fieldData) {
      console.log(`⚠️ Field ${rawApiKey}: No data`);
      continue;
    }

    // 🔥 FIX: Translate Perplexity's grouped field names to numbered schema
    const apiKey = PERPLEXITY_TO_NUMBERED_FIELDS[rawApiKey] || rawApiKey;
    if (apiKey !== rawApiKey) {
      console.log(`🔄 Translated ${rawApiKey} → ${apiKey}`);
    }

    const mapping = apiKeyToMappingMap.get(apiKey);
    if (!mapping) {
      fieldsMissingMapping++;
      console.log(`⚠️ Field ${rawApiKey} (translated: ${apiKey}): No mapping found`);
      continue;
    }

    const rawValue = fieldData.value !== undefined ? fieldData.value : fieldData;
    const { valid, coerced } = validateAndCoerce(rawValue, mapping);

    if (!valid) {
      fieldsFailedValidation++;
      console.log(`❌ Field ${apiKey} (${mapping.propName}): Validation failed for value:`, rawValue);
      continue;
    }

    // Apply bi-monthly to monthly normalization for utility bills
    let finalValue = coerced;
    const normalizedUtility = normalizeUtilityBillToMonthly(apiKey, coerced);
    if (normalizedUtility !== null) {
      finalValue = normalizedUtility;
    }

    // FIX: Don't show 'Unknown' - use actual source or derive from llmSources
    const source = fieldData.source || fieldData.llmSources?.[0] || 'API Data';
    const confidence = mapConfidence(fieldData.confidence);
    const llmSources = fieldSources[apiKey] || fieldData.llmSources || [];

    const conflict = conflicts.find(c => c.field === apiKey);
    const hasConflict = !!conflict;
    const conflictValues = conflict?.values || [];

    const dataField = createDataField(
      finalValue,
      confidence,
      source,
      llmSources,
      hasConflict,
      conflictValues,
      fieldData.validationStatus,
      fieldData.validationMessage
    );

    // Handle nested paths like 'stellarMLS.parking'
    if (mapping.group.startsWith('stellarMLS.')) {
      const subGroup = mapping.group.split('.')[1] as keyof typeof property.stellarMLS;
      if (property.stellarMLS && property.stellarMLS[subGroup]) {
        const target = property.stellarMLS[subGroup] as Record<string, DataField<any>>;
        if (mapping.propName in target) {
          target[mapping.propName] = dataField;
          fieldsPopulated++;
          console.log(`✅ Field ${apiKey} → stellarMLS.${subGroup}.${mapping.propName} = ${coerced}`);
        }
      }
    } else {
      const group = property[mapping.group as keyof Property] as unknown as Record<string, DataField<any>>;
      if (group && mapping.propName in group) {
        group[mapping.propName] = dataField;
        fieldsPopulated++;
        console.log(`✅ Field ${apiKey} → ${mapping.group}.${mapping.propName} = ${coerced}`);
      }
    }
  }

  console.log(`
📊 normalizeToProperty Summary:
   Received: ${fieldsReceived} fields
   Missing mapping: ${fieldsMissingMapping}
   Failed validation: ${fieldsFailedValidation}
   Successfully populated: ${fieldsPopulated}
  `);

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

  property.dataCompleteness = Math.round((fieldsPopulated / 181) * 100);
  // smartScore is calculated via 2-tier system during comparison, not here

  // 🔥 AUTOMATIC FIELD CALCULATIONS - Run after all API data is normalized
  // This fills data gaps with calculated values, FL regional defaults, and property-type inferences
  const enrichedProperty = enrichWithCalculatedFields(property);

  // Recalculate data completeness after adding calculated fields
  let totalFields = 0;
  let populatedFields = 0;
  Object.values(enrichedProperty).forEach(group => {
    if (typeof group === 'object' && group !== null && !Array.isArray(group) && 'value' in group) {
      totalFields++;
      if (group.value !== null && group.value !== undefined && group.value !== '') {
        populatedFields++;
      }
    } else if (typeof group === 'object' && group !== null) {
      Object.values(group).forEach(field => {
        if (typeof field === 'object' && field !== null && 'value' in field) {
          totalFields++;
          if (field.value !== null && field.value !== undefined && field.value !== '') {
            populatedFields++;
          }
        }
      });
    }
  });

  enrichedProperty.dataCompleteness = Math.round((populatedFields / totalFields) * 100);
  console.log(`[FIELD-NORMALIZER] ✅ Data completeness: ${enrichedProperty.dataCompleteness}% (${populatedFields}/${totalFields} fields)`);

  // Attach extended MLS data if available (not part of 168-field schema)
  if (flatFields['_extendedMLSData']?.value) {
    enrichedProperty.extendedMLS = flatFields['_extendedMLSData'].value;
    const fieldCount = Object.keys(enrichedProperty.extendedMLS || {}).length;
    console.log(`[FIELD-NORMALIZER] ✅ Extended MLS data attached (${fieldCount} fields)`);
  }

  return enrichedProperty;
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
 * Aligned with 22 SMART Score sections from SMART_SCORE_ARCHITECTURE.md
 *
 * CRITICAL SECTIONS (weight ≥ 4.85%): Always visible, contribute 94.44% of total score
 * OPTIONAL SECTIONS (weight < 4.85%): Expandable, contribute 5.56% of total score
 */
export const DATA_QUALITY_RANGES = [
  // ============================================================================
  // CRITICAL SECTIONS (9 sections - Always Visible)
  // ============================================================================
  { label: 'Section B: Pricing & Value', min: 11, max: 16, weight: 17.96, colorClass: 'text-quantum-gold', isCritical: true },
  { label: 'Section C: Property Basics', min: 17, max: 28, weight: 14.76, colorClass: 'text-quantum-green', isCritical: true },
  { label: 'Section I: Schools', min: 63, max: 73, weight: 11.94, colorClass: 'text-quantum-purple', isCritical: true },
  { label: 'Section D: HOA & Taxes', min: 30, max: 38, weight: 9.71, colorClass: 'text-quantum-cyan', isCritical: true },
  { label: 'Section O: Environment & Risk', min: 117, max: 130, weight: 8.74, colorClass: 'text-amber-400', isCritical: true },
  { label: 'Section M: Market & Investment', min: 91, max: 102, weight: 7.77, colorClass: 'text-emerald-400', isCritical: true },
  { label: 'Section E: Structure & Systems', min: 39, max: 48, weight: 6.80, colorClass: 'text-quantum-blue', isCritical: true },
  { label: 'Section T: Waterfront', min: 155, max: 159, weight: 5.83, colorClass: 'text-cyan-400', isCritical: true },
  { label: 'Section J: Location Scores', min: 74, max: 82, weight: 4.85, colorClass: 'text-teal-400', isCritical: true },

  // ============================================================================
  // OPTIONAL SECTIONS (13 sections - Expandable)
  // ============================================================================
  { label: 'Section L: Safety & Crime', min: 88, max: 90, weight: 3.88, colorClass: 'text-red-400', isCritical: false },
  { label: 'Section A: Property ID & Basics', min: 1, max: 9, weight: 1.94, colorClass: 'text-gray-400', isCritical: false },
  { label: 'Section K: Crime Details', min: 83, max: 87, weight: 1.94, colorClass: 'text-orange-400', isCritical: false },
  { label: 'Section G: Amenities & Features', min: 49, max: 62, weight: 1.94, colorClass: 'text-indigo-400', isCritical: false },
  { label: 'Section F: Lot & Land', min: 29, max: 29, weight: 0.97, colorClass: 'text-lime-400', isCritical: false },
  { label: 'Section H: Utilities & Services', min: 103, max: 104, weight: 0.49, colorClass: 'text-yellow-400', isCritical: false },
  { label: 'Section N: Demographics', min: 105, max: 116, weight: 0.49, colorClass: 'text-pink-400', isCritical: false },
  { label: 'Section P: Appreciation & Investment', min: 131, max: 138, weight: 0.00, colorClass: 'text-slate-400', isCritical: false },
  { label: 'Section Q: HOA Details', min: 139, max: 141, weight: 0.00, colorClass: 'text-slate-400', isCritical: false },
  { label: 'Section R: Builder & Community', min: 142, max: 144, weight: 0.00, colorClass: 'text-slate-400', isCritical: false },
  { label: 'Section S: Listing Details', min: 145, max: 154, weight: 0.00, colorClass: 'text-slate-400', isCritical: false },
  { label: 'Section U: Views & Premium', min: 160, max: 163, weight: 0.00, colorClass: 'text-slate-400', isCritical: false },
  { label: 'Section V: Stellar AI Insights', min: 164, max: 168, weight: 0.00, colorClass: 'text-slate-400', isCritical: false },
  { label: 'Section W: Market Performance', min: 169, max: 181, weight: 0.03, colorClass: 'text-cyan-400', isCritical: false },
] as const;

/**
 * Get fields within a specific number range
 */
export function getFieldsInRange(minField: number, maxField: number): FieldPathMapping[] {
  return FIELD_TO_PROPERTY_MAP.filter(
    mapping => typeof mapping.fieldNumber === 'number' && mapping.fieldNumber >= minField && mapping.fieldNumber <= maxField
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
  weight?: number;
  isCritical?: boolean;
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
      weight: range.weight,
      isCritical: range.isCritical,
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
      weight: range.weight,
      isCritical: range.isCritical,
    };
  });
}

/**
 * REVERSE FUNCTION: Convert a Property object back to flat field format
 * Used when calling the search API with existing data to enable additive merging.
 *
 * @param property - The full Property object to flatten
 * @returns Record<string, FlatFieldData> - Flat fields keyed by apiKey (e.g., "10_listing_price")
 */
export function propertyToFlatFields(property: Property): Record<string, FlatFieldData> {
  const flatFields: Record<string, FlatFieldData> = {};

  for (const mapping of FIELD_TO_PROPERTY_MAP) {
    const { apiKey, group, propName } = mapping;

    // Handle nested stellarMLS groups (e.g., "stellarMLS.parking")
    let groupObj: any;
    if (group.startsWith('stellarMLS.')) {
      const subGroup = group.split('.')[1] as keyof NonNullable<Property['stellarMLS']>;
      groupObj = property.stellarMLS?.[subGroup];
    } else {
      groupObj = property[group as keyof Property];
    }

    if (!groupObj || typeof groupObj !== 'object') continue;

    const field = groupObj[propName] as DataField<any> | undefined;
    if (!field) continue;

    // Only include fields with actual values
    const val = field.value;
    if (val === null || val === undefined || val === '') continue;
    if (typeof val === 'string' && val.trim() === '') continue;
    if (Array.isArray(val) && val.length === 0) continue;

    flatFields[apiKey] = {
      value: field.value,
      source: field.sources?.[0] || (field.llmSources?.[0] || 'API Data'),
      confidence: (field.confidence as 'High' | 'Medium' | 'Low' | 'Unverified') || 'Medium',
      llmSources: field.llmSources,
    };
  }

  return flatFields;
}
