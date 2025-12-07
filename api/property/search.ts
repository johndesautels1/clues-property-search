/**
 * CLUES Property Search API (Non-Streaming Version)
 *
 * DATA SOURCE ORDER (Most Reliable First):
 * Tier 1: Stellar MLS (when eKey obtained - future)
 * Tier 2: Google APIs (Geocode, Places)
 * Tier 3: Paid/Free APIs (WalkScore, SchoolDigger, AirNow, HowLoud, Weather, Crime, FEMA, Census)
 * Tier 4: LLMs (Perplexity, Grok, Claude Opus, GPT, Claude Sonnet, Gemini)
 *
 * ADDED (2025-12-05):
 * - U.S. Census API (Vacancy Rate - Field 100) - Tier 3
 *
 * REMOVED (2025-11-27):
 * - Scrapers (Zillow, Redfin, Realtor) - blocked by anti-bot
 * - AirDNA - not wired
 * - Broadband - not wired
 * - HUD - geo-blocked outside US (disabled for now)
 *
 * RULES:
 * - Never store null values
 * - Most reliable source wins on conflicts
 * - Yellow warning for conflicts
 * - LLMs only fill gaps, never overwrite reliable data
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel serverless config - use global 300s limit from vercel.json for LLM cascade
export const config = {
  maxDuration: 300, // 5 minutes (Vercel Pro allows up to 300s)
};

// Timeout wrapper for API/LLM calls - prevents hanging
const STELLAR_MLS_TIMEOUT = 90000; // 90 seconds (1.5 minutes) for Stellar MLS via Bridge API (Tier 1)
const FREE_API_TIMEOUT = 60000; // 60 seconds for Redfin, Google, and all free APIs (Tier 2 & 3)
const LLM_TIMEOUT = 180000; // 180 seconds (3 minutes) for Claude, GPT-4, Gemini, Grok LLM enrichment (Tier 4)
const PERPLEXITY_TIMEOUT = 195000; // 195 seconds (3.25 minutes) for Perplexity (needs extra time for deep web search)
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}

import { scrapeFloridaCounty } from './florida-counties.js';
import { LLM_CASCADE_ORDER } from './llm-constants.js';
import { createArbitrationPipeline, type FieldValue, type ArbitrationResult } from './arbitration.js';
import { sanitizeAddress, isValidAddress } from '../../src/lib/safe-json-parse.js';
import { callCrimeGrade, callSchoolDigger, callFEMARiskIndex, callNOAAClimate, callNOAAStormEvents, callNOAASeaLevel, callUSGSElevation, callUSGSEarthquake, callEPAFRS, getRadonRisk/*, callRedfinProperty*/ } from './free-apis.js';
import { STELLAR_MLS_SOURCE, FBI_CRIME_SOURCE } from './source-constants.js';


// ============================================
// SEMANTIC VALUE COMPARISON
// Returns true if values are semantically equal (not a real conflict)
// ============================================
function valuesAreSemanticallySame(val1: any, val2: any): boolean {
  // Handle null/undefined
  if (val1 === null || val1 === undefined || val2 === null || val2 === undefined) {
    return val1 === val2;
  }

  // Convert to strings for comparison
  const str1 = String(val1).trim().toLowerCase();
  const str2 = String(val2).trim().toLowerCase();

  // Exact match after normalization
  if (str1 === str2) return true;

  // One contains the other (e.g., "Yes" vs "Yes - with details")
  if (str1.includes(str2) || str2.includes(str1)) return true;

  // Strip common suffixes/variations for comparison
  const normalize = (s: string) => s
    .replace(/\s*-\s*.*$/, '')  // Remove " - anything"
    .replace(/\s*\(.*\)$/, '')   // Remove "(anything)"
    .replace(/[,;].*$/, '')      // Remove after comma/semicolon
    .replace(/\s+/g, ' ')        // Normalize whitespace
    .trim();

  if (normalize(str1) === normalize(str2)) return true;

  // Additional fuzzy matching for minor differences
  // "Duke Energy" vs "Duke Energy Florida" or "Spectrum" vs "Spectrum Cable"
  const removeCompanyWords = (s: string) => s
    .replace(/\b(inc|llc|corp|corporation|company|co|ltd)\b\.?/gi, '')
    .replace(/\s+(florida|fl|usa|us|america)\b/gi, '')
    .trim();

  if (removeCompanyWords(str1) === removeCompanyWords(str2)) return true;

  // Semantic equivalence rules for common real estate terms
  const semanticRules = [
    // County variations
    { terms: ['county'], rule: (s: string) => s.replace(/\s*county$/i, '').trim() },
    // School district variations
    { terms: ['school'], rule: (s: string) => s.replace(/\s*school district$/i, '').replace(/\s*schools$/i, '').trim() },
    // Property type abbreviations
    { terms: ['condo', 'condominium'], rule: (s: string) => s.replace(/condominium/i, 'condo') },
    // Listing status equivalents
    { terms: ['active', 'for sale'], rule: () => 'active' },
    { terms: ['pending', 'under contract'], rule: () => 'pending' },
  ];

  // Apply semantic rules
  for (const { terms, rule } of semanticRules) {
    if (terms.some(term => str1.includes(term) || str2.includes(term))) {
      const normalized1 = rule(str1);
      const normalized2 = rule(str2);
      if (normalized1 === normalized2) return true;
    }
  }

  // Handle numeric comparisons with tolerance
  const num1 = parseFloat(str1.replace(/[^0-9.-]/g, ''));
  const num2 = parseFloat(str2.replace(/[^0-9.-]/g, ''));
  if (!isNaN(num1) && !isNaN(num2)) {
    // Numbers within 1% are considered same
    const diff = Math.abs(num1 - num2);
    const avg = (Math.abs(num1) + Math.abs(num2)) / 2;
    if (avg > 0 && diff / avg < 0.01) return true;
  }

  return false;
}

// ============================================
// COMPLETE TYPE MAP - ALL 168 FIELDS from fields-schema.ts
// Maps EVERY field key to its expected type for validation and coercion
// 336 total entries (168 numbered + 168 unnumbered key variants)
// ============================================
type FieldType = 'text' | 'number' | 'boolean' | 'currency' | 'percentage' | 'date' | 'select' | 'multiselect';
const FIELD_TYPE_MAP: Record<string, FieldType> = {
  // ================================================================
  // GROUP 1: Address & Identity (Fields 1-9)
  // ================================================================
  '1_full_address': 'text', 'full_address': 'text',
  '2_mls_primary': 'text', 'mls_primary': 'text',
  '3_mls_secondary': 'text', 'mls_secondary': 'text',
  '4_listing_status': 'select', 'listing_status': 'select',
  '5_listing_date': 'date', 'listing_date': 'date',
  '6_neighborhood': 'text', 'neighborhood': 'text',
  '7_county': 'text', 'county': 'text',
  '8_zip_code': 'text', 'zip_code': 'text',
  '9_parcel_id': 'text', 'parcel_id': 'text',

  // ================================================================
  // GROUP 2: Pricing & Value (Fields 10-16)
  // ================================================================
  '10_listing_price': 'currency', 'listing_price': 'currency',
  '11_price_per_sqft': 'currency', 'price_per_sqft': 'currency',
  '12_market_value_estimate': 'currency', 'market_value_estimate': 'currency',
  '13_last_sale_date': 'date', 'last_sale_date': 'date',
  '14_last_sale_price': 'currency', 'last_sale_price': 'currency',
  '15_assessed_value': 'currency', 'assessed_value': 'currency',
  '16_redfin_estimate': 'currency', 'redfin_estimate': 'currency',

  // ================================================================
  // GROUP 3: Property Basics (Fields 17-29)
  // ================================================================
  '17_bedrooms': 'number', 'bedrooms': 'number',
  '18_full_bathrooms': 'number', 'full_bathrooms': 'number',
  '19_half_bathrooms': 'number', 'half_bathrooms': 'number',
  '20_total_bathrooms': 'number', 'total_bathrooms': 'number',
  '21_living_sqft': 'number', 'living_sqft': 'number',
  '22_total_sqft_under_roof': 'number', 'total_sqft_under_roof': 'number',
  '23_lot_size_sqft': 'number', 'lot_size_sqft': 'number',
  '24_lot_size_acres': 'number', 'lot_size_acres': 'number',
  '25_year_built': 'number', 'year_built': 'number',
  '26_property_type': 'select', 'property_type': 'select',
  '27_stories': 'number', 'stories': 'number',
  '28_garage_spaces': 'number', 'garage_spaces': 'number',
  '29_parking_total': 'text', 'parking_total': 'text',

  // ================================================================
  // GROUP 4: HOA & Taxes (Fields 30-38)
  // ================================================================
  '30_hoa_yn': 'boolean', 'hoa_yn': 'boolean',
  '31_hoa_fee_annual': 'currency', 'hoa_fee_annual': 'currency',
  '32_hoa_name': 'text', 'hoa_name': 'text',
  '33_hoa_includes': 'text', 'hoa_includes': 'text',
  '34_ownership_type': 'select', 'ownership_type': 'select',
  '35_annual_taxes': 'currency', 'annual_taxes': 'currency',
  '36_tax_year': 'number', 'tax_year': 'number',
  '37_property_tax_rate': 'percentage', 'property_tax_rate': 'percentage',
  '38_tax_exemptions': 'text', 'tax_exemptions': 'text',

  // ================================================================
  // GROUP 5: Structure & Systems (Fields 39-48)
  // ================================================================
  '39_roof_type': 'select', 'roof_type': 'select',
  '40_roof_age_est': 'text', 'roof_age_est': 'text',
  '41_exterior_material': 'select', 'exterior_material': 'select',
  '42_foundation': 'select', 'foundation': 'select',
  '43_water_heater_type': 'text', 'water_heater_type': 'text',
  '44_garage_type': 'text', 'garage_type': 'text',
  '45_hvac_type': 'text', 'hvac_type': 'text',
  '46_hvac_age': 'text', 'hvac_age': 'text',
  '47_laundry_type': 'text', 'laundry_type': 'text',
  '48_interior_condition': 'select', 'interior_condition': 'select',

  // ================================================================
  // GROUP 6: Interior Features (Fields 49-53)
  // ================================================================
  '49_flooring_type': 'text', 'flooring_type': 'text',
  '50_kitchen_features': 'text', 'kitchen_features': 'text',
  '51_appliances_included': 'multiselect', 'appliances_included': 'multiselect',
  '52_fireplace_yn': 'boolean', 'fireplace_yn': 'boolean',
  '53_fireplace_count': 'number', 'fireplace_count': 'number',

  // ================================================================
  // GROUP 7: Exterior Features (Fields 54-58)
  // ================================================================
  '54_pool_yn': 'boolean', 'pool_yn': 'boolean',
  '55_pool_type': 'select', 'pool_type': 'select',
  '56_deck_patio': 'text', 'deck_patio': 'text',
  '57_fence': 'text', 'fence': 'text',
  '58_landscaping': 'text', 'landscaping': 'text',

  // ================================================================
  // GROUP 8: Permits & Renovations (Fields 59-62)
  // ================================================================
  '59_recent_renovations': 'text', 'recent_renovations': 'text',
  '60_permit_history_roof': 'text', 'permit_history_roof': 'text',
  '61_permit_history_hvac': 'text', 'permit_history_hvac': 'text',
  '62_permit_history_other': 'text', 'permit_history_other': 'text',

  // ================================================================
  // GROUP 9: Assigned Schools (Fields 63-73)
  // ================================================================
  '63_school_district': 'text', 'school_district': 'text',
  '64_elevation_feet': 'number', 'elevation_feet': 'number',
  '65_elementary_school': 'text', 'elementary_school': 'text',
  '66_elementary_rating': 'text', 'elementary_rating': 'text',
  '67_elementary_distance_mi': 'number', 'elementary_distance_mi': 'number',
  '68_middle_school': 'text', 'middle_school': 'text',
  '69_middle_rating': 'text', 'middle_rating': 'text',
  '70_middle_distance_mi': 'number', 'middle_distance_mi': 'number',
  '71_high_school': 'text', 'high_school': 'text',
  '72_high_rating': 'text', 'high_rating': 'text',
  '73_high_distance_mi': 'number', 'high_distance_mi': 'number',

  // ================================================================
  // GROUP 10: Location Scores (Fields 74-82)
  // ================================================================
  '74_walk_score': 'number', 'walk_score': 'number',
  '75_transit_score': 'number', 'transit_score': 'number',
  '76_bike_score': 'number', 'bike_score': 'number',
  '77_safety_score': 'number', 'safety_score': 'number',
  '78_noise_level': 'text', 'noise_level': 'text',
  '79_traffic_level': 'text', 'traffic_level': 'text',
  '80_walkability_description': 'text', 'walkability_description': 'text',
  '81_public_transit_access': 'text', 'public_transit_access': 'text',
  '82_commute_to_city_center': 'text', 'commute_to_city_center': 'text',

  // ================================================================
  // GROUP 11: Distances & Amenities (Fields 83-87)
  // ================================================================
  '83_distance_grocery_mi': 'number', 'distance_grocery_mi': 'number',
  '84_distance_hospital_mi': 'number', 'distance_hospital_mi': 'number',
  '85_distance_airport_mi': 'number', 'distance_airport_mi': 'number',
  '86_distance_park_mi': 'number', 'distance_park_mi': 'number',
  '87_distance_beach_mi': 'number', 'distance_beach_mi': 'number',

  // ================================================================
  // GROUP 12: Safety & Crime (Fields 88-90)
  // ================================================================
  '88_violent_crime_index': 'text', 'violent_crime_index': 'text',
  '89_property_crime_index': 'text', 'property_crime_index': 'text',
  '90_neighborhood_safety_rating': 'text', 'neighborhood_safety_rating': 'text',

  // ================================================================
  // GROUP 13: Market & Investment Data (Fields 91-103)
  // ================================================================
  '91_median_home_price_neighborhood': 'currency', 'median_home_price_neighborhood': 'currency',
  '92_price_per_sqft_recent_avg': 'currency', 'price_per_sqft_recent_avg': 'currency',
  '93_price_to_rent_ratio': 'number', 'price_to_rent_ratio': 'number',
  '94_price_vs_median_percent': 'percentage', 'price_vs_median_percent': 'percentage',
  '95_days_on_market_avg': 'number', 'days_on_market_avg': 'number',
  '96_inventory_surplus': 'text', 'inventory_surplus': 'text',
  '97_insurance_est_annual': 'currency', 'insurance_est_annual': 'currency',
  '98_rental_estimate_monthly': 'currency', 'rental_estimate_monthly': 'currency',
  '99_rental_yield_est': 'percentage', 'rental_yield_est': 'percentage',
  '100_vacancy_rate_neighborhood': 'percentage', 'vacancy_rate_neighborhood': 'percentage',
  '101_cap_rate_est': 'percentage', 'cap_rate_est': 'percentage',
  '102_financing_terms': 'text', 'financing_terms': 'text',
  '103_comparable_sales': 'text', 'comparable_sales': 'text',

  // ================================================================
  // GROUP 14: Utilities & Connectivity (Fields 104-116)
  // ================================================================
  '104_electric_provider': 'text', 'electric_provider': 'text',
  '105_avg_electric_bill': 'text', 'avg_electric_bill': 'text',
  '106_water_provider': 'text', 'water_provider': 'text',
  '107_avg_water_bill': 'text', 'avg_water_bill': 'text',
  '108_sewer_provider': 'text', 'sewer_provider': 'text',
  '109_natural_gas': 'text', 'natural_gas': 'text',
  '110_trash_provider': 'text', 'trash_provider': 'text',
  '111_internet_providers_top3': 'text', 'internet_providers_top3': 'text',
  '112_max_internet_speed': 'text', 'max_internet_speed': 'text',
  '113_fiber_available': 'text', 'fiber_available': 'text',
  '114_cable_tv_provider': 'text', 'cable_tv_provider': 'text',
  '115_cell_coverage_quality': 'text', 'cell_coverage_quality': 'text',
  '116_emergency_services_distance': 'text', 'emergency_services_distance': 'text',

  // ================================================================
  // GROUP 15: Environment & Risk (Fields 117-130)
  // ================================================================
  '117_air_quality_index': 'text', 'air_quality_index': 'text',
  '118_air_quality_grade': 'text', 'air_quality_grade': 'text',
  '119_flood_zone': 'text', 'flood_zone': 'text',
  '120_flood_risk_level': 'text', 'flood_risk_level': 'text',
  '121_climate_risk': 'text', 'climate_risk': 'text',
  '122_wildfire_risk': 'text', 'wildfire_risk': 'text',
  '123_earthquake_risk': 'text', 'earthquake_risk': 'text',
  '124_hurricane_risk': 'text', 'hurricane_risk': 'text',
  '125_tornado_risk': 'text', 'tornado_risk': 'text',
  '126_radon_risk': 'text', 'radon_risk': 'text',
  '127_superfund_site_nearby': 'text', 'superfund_site_nearby': 'text',
  '128_sea_level_rise_risk': 'text', 'sea_level_rise_risk': 'text',
  '129_noise_level_db_est': 'text', 'noise_level_db_est': 'text',
  '130_solar_potential': 'text', 'solar_potential': 'text',

  // ================================================================
  // GROUP 16: Additional Features (Fields 131-138)
  // ================================================================
  '131_view_type': 'text', 'view_type': 'text',
  '132_lot_features': 'text', 'lot_features': 'text',
  '133_ev_charging': 'text', 'ev_charging': 'text',
  '134_smart_home_features': 'text', 'smart_home_features': 'text',
  '135_accessibility_modifications': 'text', 'accessibility_modifications': 'text',
  '136_pet_policy': 'text', 'pet_policy': 'text',
  '137_age_restrictions': 'text', 'age_restrictions': 'text',
  '138_special_assessments': 'text', 'special_assessments': 'text',

  // ================================================================
  // GROUP 17: Stellar MLS - Parking & Garage (Fields 139-143)
  // ================================================================
  '139_carport_yn': 'boolean', 'carport_yn': 'boolean',
  '140_carport_spaces': 'number', 'carport_spaces': 'number',
  '141_garage_attached_yn': 'boolean', 'garage_attached_yn': 'boolean',
  '142_parking_features': 'multiselect', 'parking_features': 'multiselect',
  '143_assigned_parking_spaces': 'number', 'assigned_parking_spaces': 'number',

  // ================================================================
  // GROUP 18: Stellar MLS - Building Info (Fields 144-148)
  // ================================================================
  '144_floor_number': 'number', 'floor_number': 'number',
  '145_building_total_floors': 'number', 'building_total_floors': 'number',
  '146_building_name_number': 'text', 'building_name_number': 'text',
  '147_building_elevator_yn': 'boolean', 'building_elevator_yn': 'boolean',
  '148_floors_in_unit': 'number', 'floors_in_unit': 'number',

  // ================================================================
  // GROUP 19: Stellar MLS - Legal & Tax (Fields 149-154)
  // ================================================================
  '149_subdivision_name': 'text', 'subdivision_name': 'text',
  '150_legal_description': 'text', 'legal_description': 'text',
  '151_homestead_yn': 'boolean', 'homestead_yn': 'boolean',
  '152_cdd_yn': 'boolean', 'cdd_yn': 'boolean',
  '153_annual_cdd_fee': 'currency', 'annual_cdd_fee': 'currency',
  '154_front_exposure': 'select', 'front_exposure': 'select',

  // ================================================================
  // GROUP 20: Stellar MLS - Waterfront (Fields 155-159)
  // ================================================================
  '155_water_frontage_yn': 'boolean', 'water_frontage_yn': 'boolean',
  '156_waterfront_feet': 'number', 'waterfront_feet': 'number',
  '157_water_access_yn': 'boolean', 'water_access_yn': 'boolean',
  '158_water_view_yn': 'boolean', 'water_view_yn': 'boolean',
  '159_water_body_name': 'text', 'water_body_name': 'text',

  // ================================================================
  // GROUP 21: Stellar MLS - Leasing & Pets (Fields 160-165)
  // ================================================================
  '160_can_be_leased_yn': 'boolean', 'can_be_leased_yn': 'boolean',
  '161_minimum_lease_period': 'text', 'minimum_lease_period': 'text',
  '162_lease_restrictions_yn': 'boolean', 'lease_restrictions_yn': 'boolean',
  '163_pet_size_limit': 'text', 'pet_size_limit': 'text',
  '164_max_pet_weight': 'number', 'max_pet_weight': 'number',
  '165_association_approval_yn': 'boolean', 'association_approval_yn': 'boolean',

  // ================================================================
  // GROUP 22: Stellar MLS - Features & Flood (Fields 166-168)
  // ================================================================
  '166_community_features': 'multiselect', 'community_features': 'multiselect',
  '167_interior_features': 'multiselect', 'interior_features': 'multiselect',
  '168_exterior_features': 'multiselect', 'exterior_features': 'multiselect',
};

// ============================================
// TYPE COERCION FUNCTION - Validates and coerces LLM values
// Ensures values match expected types from the 168-field schema
// ============================================
function coerceValue(key: string, value: any): any {
  const expectedType = FIELD_TYPE_MAP[key];

  // If no type mapping (unknown field), return as-is
  if (!expectedType) {
    console.log(`⚠️ UNKNOWN FIELD: ${key} not in 168-field schema`);
    return value;
  }

  // TEXT, SELECT, MULTISELECT types - pass through as strings
  if (expectedType === 'text' || expectedType === 'select' || expectedType === 'multiselect') {
    // Already a string - return as-is
    if (typeof value === 'string') return value.trim();
    // Convert arrays to comma-separated for multiselect
    if (Array.isArray(value)) return value.join(', ');
    // Convert other types to string
    return String(value);
  }

  // NUMBER, CURRENCY, PERCENTAGE types - must be numeric
  if (expectedType === 'number' || expectedType === 'currency' || expectedType === 'percentage') {
    if (typeof value === 'number' && !isNaN(value)) return value;

    // Coerce string to number
    if (typeof value === 'string') {
      // Remove currency symbols, commas, percentage signs
      const cleaned = value.replace(/[$,€£%\s]/g, '').trim();
      const num = parseFloat(cleaned);
      if (!isNaN(num)) {
        console.log(`🔄 TYPE COERCED: ${key} "${value}" → ${num} (${expectedType})`);
        return num;
      }
    }
    // Invalid - return null to be filtered
    console.log(`⚠️ TYPE COERCION FAILED: ${key} "${value}" is not a valid ${expectedType}`);
    return null;
  }

  // BOOLEAN type
  if (expectedType === 'boolean') {
    if (typeof value === 'boolean') return value;

    // Coerce string to boolean
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      if (['true', 'yes', 'y', '1', 'on'].includes(lower)) {
        console.log(`🔄 TYPE COERCED: ${key} "${value}" → true (boolean)`);
        return true;
      }
      if (['false', 'no', 'n', '0', 'off', 'none'].includes(lower)) {
        console.log(`🔄 TYPE COERCED: ${key} "${value}" → false (boolean)`);
        return false;
      }
    }
    // Coerce number to boolean
    if (typeof value === 'number') {
      return value !== 0;
    }
    console.log(`⚠️ TYPE COERCION FAILED: ${key} "${value}" is not a valid boolean`);
    return null;
  }

  // DATE type - keep as string but validate
  if (expectedType === 'date') {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    return null;
  }

  // Default: return as-is
  return value;
}

// ============================================
// NULL BLOCKING HELPER - CRITICAL SYSTEM RULE
// NO NULL VALUES ARE ALLOWED INTO THE FIELD SYSTEM
// This function filters LLM responses to remove any nulls
// ============================================
// Filter Grok's fields to prevent hallucinations on Stellar MLS and Perplexity territory
function filterGrokRestrictedFields(parsed: any): Record<string, any> {
  const dataToProcess = parsed.fields || parsed;
  const allowed: Record<string, any> = {};
  let blockedCount = 0;
  const blockedFields: string[] = [];

  for (const [key, val] of Object.entries(dataToProcess)) {
    // Skip metadata fields (pass through)
    if (['llm', 'error', 'sources_searched', 'fields_found', 'fields_missing', 'note'].includes(key)) {
      allowed[key] = val;
      continue;
    }

    // Check if field is in restricted list
    if (GROK_RESTRICTED_FIELDS.has(key)) {
      blockedCount++;
      blockedFields.push(key);
      continue; // Block this field
    }

    // Field is allowed, keep it
    allowed[key] = val;
  }

  if (blockedCount > 0) {
    console.log(`🚫 [Grok Filter] Blocked ${blockedCount} restricted fields: ${blockedFields.slice(0, 10).join(', ')}${blockedCount > 10 ? ` ...and ${blockedCount - 10} more` : ''}`);
  }

  // Return in same format as input
  if (parsed.fields) {
    return { ...parsed, fields: allowed };
  }
  return allowed;
}

function filterNullValues(parsed: any, llmName: string): Record<string, any> {
  const fields: Record<string, any> = {};
  let nullsBlocked = 0;
  let fieldsAccepted = 0;
  let typesCoerced = 0;

  // Handle case where parsed has a 'fields' property
  const dataToProcess = parsed.fields || parsed;

  for (const [key, val] of Object.entries(dataToProcess)) {
    // Skip metadata fields
    if (['llm', 'error', 'sources_searched', 'fields_found', 'fields_missing', 'note'].includes(key)) {
      continue;
    }

    // BLOCK 1: Skip if val is directly null/undefined
    if (val === null || val === undefined) {
      nullsBlocked++;
      continue;
    }

    // Extract the actual value (handle both {value: x} objects and direct values)
    let rawValue: any;
    let source: string = llmName;
    let confidence: string = 'Medium';

    if (typeof val === 'object' && val !== null) {
      rawValue = (val as any).value;
      source = (val as any).source || llmName;
      confidence = (val as any).confidence || 'Medium';
    } else {
      rawValue = val;
    }

    // BLOCK 2: Skip null-like values
    if (rawValue === null || rawValue === undefined || rawValue === '' ||
        rawValue === 'null' || rawValue === 'N/A' || rawValue === 'Not found' ||
        rawValue === 'Unknown' || rawValue === 'not available' ||
        (typeof rawValue === 'string' && rawValue.toLowerCase() === 'none')) {
      nullsBlocked++;
      continue;
    }

    // TYPE COERCION: Validate and coerce value to expected type
    const originalValue = rawValue;
    const coercedValue = coerceValue(key, rawValue);

    // If coercion returned null, the value was invalid for expected type
    if (coercedValue === null) {
      nullsBlocked++;
      continue;
    }

    // Track if type was coerced
    if (coercedValue !== originalValue) {
      typesCoerced++;
    }

    // BLOCK 3: Skip NaN numbers
    if (typeof coercedValue === 'number' && isNaN(coercedValue)) {
      nullsBlocked++;
      continue;
    }

    // ACCEPT: Valid, type-coerced value
    fields[key] = {
      value: coercedValue,
      source: source,
      confidence: confidence
    };
    fieldsAccepted++;
  }

  console.log(`🛡️ ${llmName}: ${fieldsAccepted} fields ACCEPTED, ${nullsBlocked} nulls BLOCKED, ${typesCoerced} types COERCED`);
  return fields;
}

// ============================================
// CONVERT FLAT 168-FIELD TO NESTED STRUCTURE
// Maps API field keys to nested PropertyDetail format
// Updated: 2025-11-30 - Added Stellar MLS fields (139-168)
// ============================================
function convertFlatToNestedStructure(flatFields: Record<string, any>): any {
  // UPDATED: 2025-11-30 - Corrected ALL field numbers to match fields-schema.ts
  const fieldPathMap: Record<string, [string, string] | [string, string, string]> = {
    // ================================================================
    // GROUP 1: Address & Identity (Fields 1-9)
    // ================================================================
    '1_full_address': ['address', 'fullAddress'],
    '2_mls_primary': ['address', 'mlsPrimary'],
    '3_mls_secondary': ['address', 'mlsSecondary'],
    '4_listing_status': ['address', 'listingStatus'],
    '5_listing_date': ['address', 'listingDate'],
    '6_neighborhood': ['address', 'neighborhoodName'],
    '7_county': ['address', 'county'],
    '8_zip_code': ['address', 'zipCode'],
    '9_parcel_id': ['details', 'parcelId'],

    // ================================================================
    // GROUP 2: Pricing & Value (Fields 10-16)
    // ================================================================
    '10_listing_price': ['address', 'listingPrice'],
    '11_price_per_sqft': ['address', 'pricePerSqft'],
    '12_market_value_estimate': ['details', 'marketValueEstimate'],
    '13_last_sale_date': ['details', 'lastSaleDate'],
    '14_last_sale_price': ['details', 'lastSalePrice'],
    '15_assessed_value': ['details', 'assessedValue'],
    '16_redfin_estimate': ['financial', 'redfinEstimate'],

    // ================================================================
    // GROUP 3: Property Basics (Fields 17-29)
    // ================================================================
    '17_bedrooms': ['details', 'bedrooms'],
    '18_full_bathrooms': ['details', 'fullBathrooms'],
    '19_half_bathrooms': ['details', 'halfBathrooms'],
    '20_total_bathrooms': ['details', 'totalBathrooms'],
    '21_living_sqft': ['details', 'livingSqft'],
    '22_total_sqft_under_roof': ['details', 'totalSqftUnderRoof'],
    '23_lot_size_sqft': ['details', 'lotSizeSqft'],
    '24_lot_size_acres': ['details', 'lotSizeAcres'],
    '25_year_built': ['details', 'yearBuilt'],
    '26_property_type': ['details', 'propertyType'],
    '27_stories': ['details', 'stories'],
    '28_garage_spaces': ['details', 'garageSpaces'],
    '29_parking_total': ['details', 'parkingTotal'],

    // ================================================================
    // GROUP 4: HOA & Taxes (Fields 30-38)
    // ================================================================
    '30_hoa_yn': ['details', 'hoaYn'],
    '31_hoa_fee_annual': ['details', 'hoaFeeAnnual'],
    '32_hoa_name': ['details', 'hoaName'],
    '33_hoa_includes': ['details', 'hoaIncludes'],
    '34_ownership_type': ['details', 'ownershipType'],
    '35_annual_taxes': ['details', 'annualTaxes'],
    '36_tax_year': ['details', 'taxYear'],
    '37_property_tax_rate': ['financial', 'propertyTaxRate'],
    '38_tax_exemptions': ['financial', 'taxExemptions'],

    // ================================================================
    // GROUP 5: Structure & Systems (Fields 39-48)
    // ================================================================
    '39_roof_type': ['structural', 'roofType'],
    '40_roof_age_est': ['structural', 'roofAgeEst'],
    '41_exterior_material': ['structural', 'exteriorMaterial'],
    '42_foundation': ['structural', 'foundation'],
    '43_water_heater_type': ['structural', 'waterHeaterType'],
    '44_garage_type': ['structural', 'garageType'],
    '45_hvac_type': ['structural', 'hvacType'],
    '46_hvac_age': ['structural', 'hvacAge'],
    '47_laundry_type': ['structural', 'laundryType'],
    '48_interior_condition': ['structural', 'interiorCondition'],

    // ================================================================
    // GROUP 6: Interior Features (Fields 49-53)
    // ================================================================
    '49_flooring_type': ['structural', 'flooringType'],
    '50_kitchen_features': ['structural', 'kitchenFeatures'],
    '51_appliances_included': ['structural', 'appliancesIncluded'],
    '52_fireplace_yn': ['structural', 'fireplaceYn'],
    '53_fireplace_count': ['structural', 'fireplaceCount'],

    // ================================================================
    // GROUP 7: Exterior Features (Fields 54-58)
    // ================================================================
    '54_pool_yn': ['structural', 'poolYn'],
    '55_pool_type': ['structural', 'poolType'],
    '56_deck_patio': ['structural', 'deckPatio'],
    '57_fence': ['structural', 'fence'],
    '58_landscaping': ['structural', 'landscaping'],

    // ================================================================
    // GROUP 8: Permits & Renovations (Fields 59-62)
    // ================================================================
    '59_recent_renovations': ['structural', 'recentRenovations'],
    '60_permit_history_roof': ['structural', 'permitHistoryRoof'],
    '61_permit_history_hvac': ['structural', 'permitHistoryHvac'],
    '62_permit_history_other': ['structural', 'permitHistoryPoolAdditions'],

    // ================================================================
    // GROUP 9: Schools (Fields 63-73)
    // ================================================================
    '63_school_district': ['location', 'schoolDistrictName'],
    '64_elevation_feet': ['location', 'elevationFeet'],
    '65_elementary_school': ['location', 'assignedElementary'],
    '66_elementary_rating': ['location', 'elementaryRating'],
    '67_elementary_distance_mi': ['location', 'elementaryDistanceMiles'],
    '68_middle_school': ['location', 'assignedMiddle'],
    '69_middle_rating': ['location', 'middleRating'],
    '70_middle_distance_mi': ['location', 'middleDistanceMiles'],
    '71_high_school': ['location', 'assignedHigh'],
    '72_high_rating': ['location', 'highRating'],
    '73_high_distance_mi': ['location', 'highDistanceMiles'],

    // ================================================================
    // GROUP 10: Location Scores (Fields 74-82)
    // ================================================================
    '74_walk_score': ['location', 'walkScore'],
    '75_transit_score': ['location', 'transitScore'],
    '76_bike_score': ['location', 'bikeScore'],
    '77_safety_score': ['location', 'neighborhoodSafetyRating'],
    '78_noise_level': ['location', 'noiseLevel'],
    '79_traffic_level': ['location', 'trafficLevel'],
    '80_walkability_description': ['location', 'walkabilityDescription'],
    '81_public_transit_access': ['location', 'publicTransitAccess'],
    '82_commute_to_city_center': ['location', 'commuteTimeCityCenter'],

    // ================================================================
    // GROUP 11: Distances (Fields 83-87)
    // ================================================================
    '83_distance_grocery_mi': ['location', 'distanceGroceryMiles'],
    '84_distance_hospital_mi': ['location', 'distanceHospitalMiles'],
    '85_distance_airport_mi': ['location', 'distanceAirportMiles'],
    '86_distance_park_mi': ['location', 'distanceParkMiles'],
    '87_distance_beach_mi': ['location', 'distanceBeachMiles'],

    // ================================================================
    // GROUP 12: Safety & Crime (Fields 88-90)
    // ================================================================
    '88_violent_crime_index': ['location', 'crimeIndexViolent'],
    '89_property_crime_index': ['location', 'crimeIndexProperty'],
    '90_neighborhood_safety_rating': ['location', 'neighborhoodSafetyRating'],

    // ================================================================
    // GROUP 13: Market & Investment (Fields 91-103)
    // ================================================================
    '91_median_home_price_neighborhood': ['financial', 'medianHomePriceNeighborhood'],
    '92_price_per_sqft_recent_avg': ['financial', 'pricePerSqftRecentAvg'],
    '93_price_to_rent_ratio': ['financial', 'priceToRentRatio'],
    '94_price_vs_median_percent': ['financial', 'priceVsMedianPercent'],
    '95_days_on_market_avg': ['financial', 'daysOnMarketAvg'],
    '96_inventory_surplus': ['financial', 'inventorySurplus'],
    '97_insurance_est_annual': ['financial', 'insuranceEstAnnual'],
    '98_rental_estimate_monthly': ['financial', 'rentalEstimateMonthly'],
    '99_rental_yield_est': ['financial', 'rentalYieldEst'],
    '100_vacancy_rate_neighborhood': ['financial', 'vacancyRateNeighborhood'],
    '101_cap_rate_est': ['financial', 'capRateEst'],
    '102_financing_terms': ['financial', 'financingTerms'],
    '103_comparable_sales': ['financial', 'comparableSalesLast3'],

    // ================================================================
    // GROUP 14: Utilities (Fields 104-116)
    // ================================================================
    '104_electric_provider': ['utilities', 'electricProvider'],
    '105_avg_electric_bill': ['utilities', 'avgElectricBill'],
    '106_water_provider': ['utilities', 'waterProvider'],
    '107_avg_water_bill': ['utilities', 'avgWaterBill'],
    '108_sewer_provider': ['utilities', 'sewerProvider'],
    '109_natural_gas': ['utilities', 'naturalGas'],
    '110_trash_provider': ['utilities', 'trashProvider'],
    '111_internet_providers_top3': ['utilities', 'internetProvidersTop3'],
    '112_max_internet_speed': ['utilities', 'maxInternetSpeed'],
    '113_fiber_available': ['utilities', 'fiberAvailable'],
    '114_cable_tv_provider': ['utilities', 'cableTvProvider'],
    '115_cell_coverage_quality': ['utilities', 'cellCoverageQuality'],
    '116_emergency_services_distance': ['utilities', 'emergencyServicesDistance'],

    // ================================================================
    // GROUP 15: Environment & Risk (Fields 117-130)
    // ================================================================
    '117_air_quality_index': ['utilities', 'airQualityIndexCurrent'],
    '118_air_quality_grade': ['utilities', 'airQualityGrade'],
    '119_flood_zone': ['utilities', 'floodZone'],
    '120_flood_risk_level': ['utilities', 'floodRiskLevel'],
    '121_climate_risk': ['utilities', 'climateRiskWildfireFlood'],
    '122_wildfire_risk': ['utilities', 'wildfireRisk'],
    '123_earthquake_risk': ['utilities', 'earthquakeRisk'],
    '124_hurricane_risk': ['utilities', 'hurricaneRisk'],
    '125_tornado_risk': ['utilities', 'tornadoRisk'],
    '126_radon_risk': ['utilities', 'radonRisk'],
    '127_superfund_site_nearby': ['utilities', 'superfundNearby'],
    '128_sea_level_rise_risk': ['utilities', 'seaLevelRiseRisk'],
    '129_noise_level_db_est': ['utilities', 'noiseLevelDbEst'],
    '130_solar_potential': ['utilities', 'solarPotential'],

    // ================================================================
    // GROUP 16: Additional Features (Fields 131-138)
    // ================================================================
    '131_view_type': ['utilities', 'viewType'],
    '132_lot_features': ['utilities', 'lotFeatures'],
    '133_ev_charging': ['utilities', 'evChargingYn'],
    '134_smart_home_features': ['utilities', 'smartHomeFeatures'],
    '135_accessibility_modifications': ['utilities', 'accessibilityMods'],
    '136_pet_policy': ['utilities', 'petPolicy'],
    '137_age_restrictions': ['utilities', 'ageRestrictions'],
    '138_special_assessments': ['financial', 'specialAssessments'],

    // ================================================================
    // STELLAR MLS FIELDS (139-168)
    // ================================================================

    // Stellar MLS - Parking (139-143)
    '139_carport_yn': ['stellarMLS', 'parking', 'carportYn'],
    '140_carport_spaces': ['stellarMLS', 'parking', 'carportSpaces'],
    '141_garage_attached_yn': ['stellarMLS', 'parking', 'garageAttachedYn'],
    '142_parking_features': ['stellarMLS', 'parking', 'parkingFeatures'],
    '143_assigned_parking_spaces': ['stellarMLS', 'parking', 'assignedParkingSpaces'],

    // Stellar MLS - Building (144-148)
    '144_floor_number': ['stellarMLS', 'building', 'floorNumber'],
    '145_building_total_floors': ['stellarMLS', 'building', 'buildingTotalFloors'],
    '146_building_name_number': ['stellarMLS', 'building', 'buildingNameNumber'],
    '147_building_elevator_yn': ['stellarMLS', 'building', 'buildingElevatorYn'],
    '148_floors_in_unit': ['stellarMLS', 'building', 'floorsInUnit'],

    // Stellar MLS - Legal (149-154)
    '149_subdivision_name': ['stellarMLS', 'legal', 'subdivisionName'],
    '150_legal_description': ['stellarMLS', 'legal', 'legalDescription'],
    '151_homestead_yn': ['stellarMLS', 'legal', 'homesteadYn'],
    '152_cdd_yn': ['stellarMLS', 'legal', 'cddYn'],
    '153_annual_cdd_fee': ['stellarMLS', 'legal', 'annualCddFee'],
    '154_front_exposure': ['stellarMLS', 'legal', 'frontExposure'],

    // Stellar MLS - Waterfront (155-159)
    '155_water_frontage_yn': ['stellarMLS', 'waterfront', 'waterFrontageYn'],
    '156_waterfront_feet': ['stellarMLS', 'waterfront', 'waterfrontFeet'],
    '157_water_access_yn': ['stellarMLS', 'waterfront', 'waterAccessYn'],
    '158_water_view_yn': ['stellarMLS', 'waterfront', 'waterViewYn'],
    '159_water_body_name': ['stellarMLS', 'waterfront', 'waterBodyName'],

    // Stellar MLS - Leasing (160-165)
    '160_can_be_leased_yn': ['stellarMLS', 'leasing', 'canBeLeasedYn'],
    '161_minimum_lease_period': ['stellarMLS', 'leasing', 'minimumLeasePeriod'],
    '162_lease_restrictions_yn': ['stellarMLS', 'leasing', 'leaseRestrictionsYn'],
    '163_pet_size_limit': ['stellarMLS', 'leasing', 'petSizeLimit'],
    '164_max_pet_weight': ['stellarMLS', 'leasing', 'maxPetWeight'],
    '165_association_approval_yn': ['stellarMLS', 'leasing', 'associationApprovalYn'],

    // Stellar MLS - Features (166-168)
    '166_community_features': ['stellarMLS', 'features', 'communityFeatures'],
    '167_interior_features': ['stellarMLS', 'features', 'interiorFeatures'],
    '168_exterior_features': ['stellarMLS', 'features', 'exteriorFeatures'],
  };

  const nested: Record<string, any> = {
    address: {},
    details: {},
    structural: {},
    location: {},
    financial: {},
    utilities: {},
    // Stellar MLS nested structure
    stellarMLS: {
      parking: {},
      building: {},
      legal: {},
      waterfront: {},
      leasing: {},
      features: {},
    },
  };

  for (const [flatKey, fieldData] of Object.entries(flatFields)) {
    const path = fieldPathMap[flatKey];
    if (path) {
      if (path.length === 2) {
        // Standard 2-level path: [group, field]
        if (nested[path[0]]) {
          nested[path[0]][path[1]] = fieldData;
        }
      } else if (path.length === 3) {
        // Stellar MLS 3-level path: [stellarMLS, subgroup, field]
        if (nested[path[0]] && nested[path[0]][path[1]]) {
          nested[path[0]][path[1]][path[2]] = fieldData;
        }
      }
    }
  }

  return nested;
}

// ============================================
// SCRAPERS REMOVED (2025-11-27)
// Zillow/Redfin/Realtor blocked by anti-bot
// Use MLS API when eKey is obtained
// ============================================

// ============================================
// FREE API ENRICHMENT
// ============================================

async function geocodeAddress(address: string): Promise<{ lat: number; lon: number; county: string; zipCode: string } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results?.[0]) {
      const result = data.results[0];
      let county = '';
      let zipCode = '';
      for (const component of result.address_components) {
        if (component.types.includes('administrative_area_level_2')) {
          county = component.long_name;
        }
        if (component.types.includes('postal_code')) {
          zipCode = component.long_name;
        }
      }
      return { lat: result.geometry.location.lat, lon: result.geometry.location.lng, county, zipCode };
    }
  } catch (e) {
    console.error('Geocode error:', e);
  }
  return null;
}

async function getWalkScore(lat: number, lon: number, address: string): Promise<Record<string, any>> {
  const apiKey = process.env.WALKSCORE_API_KEY;
  if (!apiKey) {
    console.log('❌ [WalkScore] WALKSCORE_API_KEY not set in environment variables');
    return {};
  }

  console.log(`🔵 [WalkScore] Calling API for: ${address} (${lat}, ${lon})`);

  try {
    const url = `https://api.walkscore.com/score?format=json&address=${encodeURIComponent(address)}&lat=${lat}&lon=${lon}&wsapikey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    console.log(`🔵 [WalkScore] Response:`, JSON.stringify(data).substring(0, 300));
    console.log(`🔵 [WalkScore] Status: ${data.status}, Walk: ${data.walkscore}, Transit: ${data.transit?.score || 'N/A'}, Bike: ${data.bike?.score || 'N/A'}`);

    if (data.status !== 1) {
      console.log(`⚠️ [WalkScore] API returned non-success status: ${data.status}`);
      return {};
    }

    // UPDATED: 2025-11-30 - Corrected field numbers to match fields-schema.ts
    const fields = {
      '74_walk_score': { value: `${data.walkscore} - ${data.description}`, source: 'WalkScore', confidence: 'High' },
      '75_transit_score': { value: data.transit?.score ? `${data.transit.score} - ${data.transit.description}` : null, source: 'WalkScore', confidence: 'High' },
      '76_bike_score': { value: data.bike?.score ? `${data.bike.score} - ${data.bike.description}` : null, source: 'WalkScore', confidence: 'High' },
      '80_walkability_description': { value: data.description, source: 'WalkScore', confidence: 'High' }
    };

    console.log(`✅ [WalkScore] Returning 4 fields (transit/bike may be null)`);
    return fields;
  } catch (e) {
    console.error('❌ [WalkScore] Exception:', e);
    return {};
  }
}

async function getFloodZone(lat: number, lon: number): Promise<Record<string, any>> {
  console.log(`🔵 [FEMA] Calling API for coordinates: ${lat}, ${lon}`);
  try {
    // Updated 2025-12-04: FEMA changed URL from /gis/nfhl/rest to /arcgis/rest
    const url = `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query?where=1%3D1&geometry=${lon}%2C${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE%2CZONE_SUBTY%2CSFHA_TF&returnGeometry=false&f=json`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [FEMA] HTTP ${response.status}: ${errorText.substring(0, 200)}`);
      return {};
    }

    const data = await response.json();
    console.log(`🔵 [FEMA] Response status: ${response.status}, features: ${data.features?.length || 0}`);

    // UPDATED: 2025-11-30 - Corrected field numbers to match fields-schema.ts
    if (data.features?.[0]) {
      const zone = data.features[0].attributes;
      const floodZone = zone.FLD_ZONE || 'Unknown';
      const isHighRisk = ['A', 'AE', 'AH', 'AO', 'V', 'VE'].some(z => floodZone.startsWith(z));
      return {
        '119_flood_zone': { value: `FEMA Zone ${floodZone}`, source: 'FEMA NFHL', confidence: 'High' },
        '120_flood_risk_level': { value: isHighRisk ? 'High Risk (Special Flood Hazard Area)' : 'Minimal Risk', source: 'FEMA NFHL', confidence: 'High' }
      };
    }
    console.log(`✅ [FEMA] Returning default minimal risk zone`);
    return {
      '119_flood_zone': { value: 'Zone X (Minimal Risk)', source: 'FEMA NFHL', confidence: 'Medium' },
      '120_flood_risk_level': { value: 'Minimal', source: 'FEMA NFHL', confidence: 'Medium' }
    };
  } catch (e) {
    console.error('❌ [FEMA] Exception:', e);
    return {};
  }
}

async function getAirQuality(lat: number, lon: number): Promise<Record<string, any>> {
  const apiKey = process.env.AIRNOW_API_KEY;
  if (!apiKey) return {};

  try {
    const url = `https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${lat}&longitude=${lon}&distance=25&API_KEY=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    // UPDATED: 2025-11-30 - Corrected field numbers to match fields-schema.ts
    if (data?.[0]) {
      return {
        '117_air_quality_index': { value: `${data[0].AQI} - ${data[0].Category.Name}`, source: 'AirNow', confidence: 'High' }
      };
    }
  } catch (e) {}
  return {};
}

// U.S. Census API - Vacancy Rate
async function getCensusData(zipCode: string): Promise<Record<string, any>> {
  const apiKey = process.env.CENSUS_API_KEY;
  if (!apiKey) {
    console.log('❌ [Census] CENSUS_API_KEY not set in environment variables');
    return {};
  }

  console.log(`🔵 [Census] Calling API for ZIP: ${zipCode}`);

  try {
    // Use ACS 5-year estimates (most recent complete dataset)
    const year = 2023; // Most recent ACS5 data available

    // B25002: OCCUPANCY STATUS
    // B25002_001E = Total housing units
    // B25002_002E = Occupied housing units
    // B25002_003E = Vacant housing units
    const variables = 'NAME,B25002_001E,B25002_002E,B25002_003E';

    // Query by ZCTA (ZIP Code Tabulation Area)
    const url = `https://api.census.gov/data/${year}/acs/acs5?get=${variables}&for=zip%20code%20tabulation%20area:${zipCode}&key=${apiKey}`;

    console.log(`🔵 [Census] Requesting: ${url.replace(apiKey, 'REDACTED')}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'CLUES Property Dashboard (contact: admin@clues.com)',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Census] HTTP ${response.status}: ${errorText.substring(0, 200)}`);
      return {};
    }

    const data = await response.json();
    console.log(`🔵 [Census] Response:`, JSON.stringify(data).substring(0, 300));

    // Census API returns data in format: [["NAME", "B25002_001E", ...], [actual values...]]
    if (!Array.isArray(data) || data.length < 2) {
      console.error('❌ [Census] Invalid response format');
      return {};
    }

    const [headers, values] = data;

    // Parse the values
    const totalUnits = parseInt(values[1]) || 0;  // B25002_001E
    const occupiedUnits = parseInt(values[2]) || 0;  // B25002_002E
    const vacantUnits = parseInt(values[3]) || 0;  // B25002_003E

    console.log(`🔵 [Census] Parsed - Total: ${totalUnits}, Occupied: ${occupiedUnits}, Vacant: ${vacantUnits}`);

    if (totalUnits === 0) {
      console.log('⚠️ [Census] No housing units data available for this ZIP code');
      return {};
    }

    // Calculate vacancy rate as percentage
    const vacancyRate = (vacantUnits / totalUnits) * 100;
    const vacancyRateFormatted = vacancyRate.toFixed(2);

    console.log(`✅ [Census] Vacancy Rate: ${vacancyRateFormatted}% (${vacantUnits}/${totalUnits} units vacant)`);

    // Map to Field 100 in CLUES schema
    return {
      '100_vacancy_rate_neighborhood': {
        value: `${vacancyRateFormatted}%`,
        source: 'Census',
        confidence: 'High',
        metadata: {
          totalUnits,
          vacantUnits,
          occupiedUnits,
          year,
          zcta: zipCode,
        },
      },
    };

  } catch (error) {
    console.error('❌ [Census] Exception:', error);
    return {};
  }
}

// HowLoud API - Noise levels
async function getNoiseData(lat: number, lon: number): Promise<Record<string, any>> {
  const apiKey = process.env.HOWLOUD_API_KEY;
  if (!apiKey) {
    console.log('❌ [HowLoud] HOWLOUD_API_KEY not set in environment variables');
    return {};
  }

  console.log(`🔵 [HowLoud] Calling API for coordinates: ${lat}, ${lon}`);

  try {
    // Use x-api-key header as per HowLoud API docs
    const url = `https://api.howloud.com/score?lat=${lat}&lng=${lon}`;
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey
      }
    });

    console.log(`🔵 [HowLoud] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ [HowLoud] API error: ${response.status} - ${errorText.substring(0, 200)}`);
      return {};
    }

    const data = await response.json();
    console.log(`🔵 [HowLoud] Response data:`, JSON.stringify(data).substring(0, 500));

    const fields: Record<string, any> = {};

    // Response structure: { status: "OK", result: [{ score, traffic, local, airports, ... }] }
    // Note: result is an array, take first element
    const resultArray = data.result || [];
    const result = Array.isArray(resultArray) ? resultArray[0] : resultArray;

    if (result && result.score !== undefined) {
      // HowLoud score: 0-100 (higher = quieter)
      let noiseLevel = 'High Noise';
      if (result.score >= 80) noiseLevel = 'Very Quiet';
      else if (result.score >= 60) noiseLevel = 'Quiet';
      else if (result.score >= 40) noiseLevel = 'Moderate';
      else if (result.score >= 20) noiseLevel = 'Noisy';

      // UPDATED: 2025-11-30 - Corrected field numbers to match fields-schema.ts
      fields['78_noise_level'] = {
        value: `${noiseLevel} (Score: ${result.score}/100)`,
        source: 'HowLoud',
        confidence: 'High'
      };

      // Traffic noise component if available
      if (result.traffic !== undefined) {
        let trafficLevel = 'Heavy';
        if (result.traffic >= 80) trafficLevel = 'Very Light';
        else if (result.traffic >= 60) trafficLevel = 'Light';
        else if (result.traffic >= 40) trafficLevel = 'Moderate';
        else if (result.traffic >= 20) trafficLevel = 'Heavy';

        fields['79_traffic_level'] = {
          value: `${trafficLevel} (Score: ${result.traffic}/100)`,
          source: 'HowLoud',
          confidence: 'High'
        };
      }

      // Convert HowLoud score (0-100, higher=quieter) to estimated dB
      // Formula: dB ≈ 80 - (score * 0.4)
      // Score 100 (very quiet) → ~40 dB
      // Score 50 (moderate) → ~60 dB
      // Score 0 (very noisy) → ~80 dB
      const estimatedDb = Math.round(80 - (result.score * 0.4));
      fields['129_noise_level_db_est'] = {
        value: `${estimatedDb} dB`,
        source: 'HowLoud',
        confidence: 'Medium'
      };
    }

    console.log(`✅ [HowLoud] Returning ${Object.keys(fields).length} fields`);
    return fields;
  } catch (e) {
    console.error('❌ [HowLoud] Exception:', e);
    return {};
  }
}

// BroadbandNow REMOVED (2025-11-27) - Scraper was blocked and not wired
// Internet provider data now comes from LLM cascade (fields 96-98)

// Weather.com API - Climate data
async function getClimateData(lat: number, lon: number): Promise<Record<string, any>> {
  const apiKey = process.env.WEATHERCOM_API_KEY || process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    console.log('❌ [Weather] Neither WEATHERCOM_API_KEY nor OPENWEATHERMAP_API_KEY set in environment variables');
    return {};
  }
  console.log(`🔵 [Weather] Calling API for coordinates: ${lat}, ${lon}`);

  try {
    // Use OpenWeatherMap API if available, otherwise Weather.com
    const isOpenWeather = !process.env.WEATHERCOM_API_KEY && process.env.OPENWEATHERMAP_API_KEY;
    const url = isOpenWeather
      ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
      : `https://api.weather.com/v3/wx/observations/current?geocode=${lat},${lon}&units=e&language=en-US&format=json&apiKey=${apiKey}`;

    console.log(`🔵 [Weather] Using ${isOpenWeather ? 'OpenWeatherMap' : 'Weather.com'} API`);
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Weather] API error ${response.status}: ${errorText.substring(0, 200)}`);
      return {};
    }

    const data = await response.json();
    const fields: Record<string, any> = {};

    if (isOpenWeather && data.main) {
      // OpenWeatherMap format
      const conditions: string[] = [];
      if (data.main.temp) conditions.push(`Current: ${Math.round(data.main.temp)}°F`);
      if (data.main.feels_like) conditions.push(`Feels like: ${Math.round(data.main.feels_like)}°F`);
      if (data.main.humidity) conditions.push(`Humidity: ${data.main.humidity}%`);
      if (data.weather?.[0]?.description) conditions.push(data.weather[0].description);

      if (conditions.length > 0) {
        fields['121_climate_risk'] = {
          value: conditions.join(', '),
          source: 'OpenWeatherMap',
          confidence: 'High'
        };
      }
    } else if (!isOpenWeather && data) {
      // Weather.com format
      const conditions: string[] = [];
      if (data.temperature) conditions.push(`Current: ${data.temperature}°F`);
      if (data.temperatureFeelsLike) conditions.push(`Feels like: ${data.temperatureFeelsLike}°F`);
      if (data.relativeHumidity) conditions.push(`Humidity: ${data.relativeHumidity}%`);
      if (data.wxPhraseLong) conditions.push(data.wxPhraseLong);

      // UPDATED: 2025-11-30 - Corrected field numbers to match fields-schema.ts
      if (conditions.length > 0) {
        fields['121_climate_risk'] = {
          value: conditions.join(', '),
          source: 'Weather.com',
          confidence: 'High'
        };
      }

      // UV Index for solar potential estimate (Weather.com only)
      if (data.uvIndex !== undefined) {
        let solarPotential = 'Low';
        if (data.uvIndex >= 6) solarPotential = 'High';
        else if (data.uvIndex >= 3) solarPotential = 'Moderate';

        fields['130_solar_potential'] = {
          value: `${solarPotential} (UV Index: ${data.uvIndex})`,
          source: 'Weather.com',
          confidence: 'Medium'
        };
      }
    }

    console.log(`✅ [Weather] Returning ${Object.keys(fields).length} fields`);
    return fields;
  } catch (e) {
    console.error('❌ [Weather] Exception:', e);
    return {};
  }
}

// Google Places - Get distances to amenities
async function getDistances(lat: number, lon: number): Promise<Record<string, any>> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.log('GOOGLE_MAPS_API_KEY not set for distances');
    return {};
  }
  console.log('getDistances: Starting for coords', lat, lon);

  const origin = `${lat},${lon}`;
  const fields: Record<string, any> = {};

  // UPDATED: 2025-11-30 - Corrected field numbers to match fields-schema.ts
  const placeTypes = [
    { type: 'supermarket', field: '83_distance_grocery_mi', name: 'Grocery' },
    { type: 'hospital', field: '84_distance_hospital_mi', name: 'Hospital' },
    { type: 'airport', field: '85_distance_airport_mi', name: 'Airport' },
    { type: 'park', field: '86_distance_park_mi', name: 'Park' },
    { type: 'beach', field: '87_distance_beach_mi', name: 'Beach' },
  ];

  for (const place of placeTypes) {
    try {
      // Find nearest place of this type
      const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin}&rankby=distance&type=${place.type}&key=${apiKey}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      console.log(`getDistances: ${place.name} status=${searchData.status} results=${searchData.results?.length || 0}`);

      if (searchData.results && searchData.results.length > 0) {
        const nearest = searchData.results[0];
        const destLat = nearest.geometry.location.lat;
        const destLon = nearest.geometry.location.lng;

        // Get actual driving distance
        const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destLat},${destLon}&units=imperial&key=${apiKey}`;
        const distRes = await fetch(distUrl);
        const distData = await distRes.json();

        if (distData.rows?.[0]?.elements?.[0]?.distance) {
          const meters = distData.rows[0].elements[0].distance.value;
          const miles = (meters / 1609.34).toFixed(1);

          fields[place.field] = {
            value: parseFloat(miles),
            source: 'Google Places',
            confidence: 'High',
            details: nearest.name
          };
        }
      }
    } catch (e) {
      console.error(`Error getting ${place.name} distance:`, e);
    }
  }

  console.log(`getDistances: Returning ${Object.keys(fields).length} distance fields:`, Object.keys(fields));
  return fields;
}

// Google Places - School distances
async function getSchoolDistances(lat: number, lon: number): Promise<Record<string, any>> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.log('❌ [Google Places/Schools] GOOGLE_MAPS_API_KEY not set');
    return {};
  }

  console.log(`🔵 [Google Places/Schools] Searching for schools near: ${lat}, ${lon}`);
  const origin = `${lat},${lon}`;
  const fields: Record<string, any> = {};

  // Field numbers aligned with fields-schema.ts (SOURCE OF TRUTH) - Assigned Schools (63-73)
  const schoolTypes = [
    { type: 'primary_school', field: '67_elementary_distance_mi', name: 'Elementary School' },
    { type: 'secondary_school', field: '70_middle_distance_mi', name: 'Middle School' },
    { type: 'school', keyword: 'high school', field: '73_high_distance_mi', name: 'High School' },
  ];

  for (const school of schoolTypes) {
    try {
      let searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin}&rankby=distance&type=${school.type}&key=${apiKey}`;
      if (school.keyword) {
        searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin}&rankby=distance&keyword=${encodeURIComponent(school.keyword)}&key=${apiKey}`;
      }

      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      // Check for API errors
      if (searchData.status && searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
        console.log(`⚠️ [Google Places/Schools] API error for ${school.name}: ${searchData.status} - ${searchData.error_message || 'No error message'}`);
        continue;
      }

      if (searchData.results && searchData.results.length > 0) {
        const nearest = searchData.results[0];
        const destLat = nearest.geometry.location.lat;
        const destLon = nearest.geometry.location.lng;

        const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destLat},${destLon}&units=imperial&key=${apiKey}`;
        const distRes = await fetch(distUrl);
        const distData = await distRes.json();

        // Check for Distance Matrix API errors
        if (distData.status && distData.status !== 'OK') {
          console.log(`⚠️ [Google Places/Schools] Distance Matrix error for ${school.name}: ${distData.status} - ${distData.error_message || 'No error message'}`);
          continue;
        }

        if (distData.rows?.[0]?.elements?.[0]?.distance) {
          const meters = distData.rows[0].elements[0].distance.value;
          const miles = (meters / 1609.34).toFixed(1);

          fields[school.field] = {
            value: parseFloat(miles),
            source: 'Google Places',
            confidence: 'High',
            details: nearest.name
          };
        }
      }
    } catch (e) {
      console.error(`❌ [Google Places/Schools] Error getting ${school.name}:`, e);
    }
  }

  console.log(`✅ [Google Places/Schools] Returning ${Object.keys(fields).length} fields`);
  return fields;
}

// Google Places - Public transit access
async function getTransitAccess(lat: number, lon: number): Promise<Record<string, any>> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return {};

  const origin = `${lat},${lon}`;
  const fields: Record<string, any> = {};

  try {
    // Search for transit stations nearby
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin}&radius=1609&type=transit_station&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    // Field 81 = public_transit_access per fields-schema.ts
    if (searchData.results && searchData.results.length > 0) {
      const stations = searchData.results.slice(0, 3).map((s: any) => s.name);
      fields['81_public_transit_access'] = {
        value: `Yes - ${searchData.results.length} stations within 1 mile: ${stations.join(', ')}`,
        source: 'Google Places',
        confidence: 'High'
      };
    } else {
      // Check for bus stops
      const busUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin}&radius=805&type=bus_station&key=${apiKey}`;
      const busRes = await fetch(busUrl);
      const busData = await busRes.json();

      if (busData.results && busData.results.length > 0) {
        fields['81_public_transit_access'] = {
          value: `Limited - ${busData.results.length} bus stops within 0.5 miles`,
          source: 'Google Places',
          confidence: 'Medium'
        };
      } else {
        fields['81_public_transit_access'] = {
          value: 'No public transit within 1 mile',
          source: 'Google Places',
          confidence: 'High'
        };
      }
    }
  } catch (e) {
    console.error('Transit access error:', e);
  }

  return fields;
}

// Google Distance Matrix - Commute time to downtown
async function getCommuteTime(lat: number, lon: number, county: string): Promise<Record<string, any>> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return {};

  // Downtown coordinates for your counties
  const downtowns: Record<string, { coords: string; name: string }> = {
    'pinellas': { coords: '27.7676,-82.6403', name: 'Downtown St. Petersburg' },
    'hillsborough': { coords: '27.9506,-82.4572', name: 'Downtown Tampa' },
    'manatee': { coords: '27.4989,-82.5748', name: 'Downtown Bradenton' },
    'polk': { coords: '28.0395,-81.9498', name: 'Downtown Lakeland' },
    'pasco': { coords: '28.2362,-82.7179', name: 'Downtown New Port Richey' },
    'hernando': { coords: '28.4755,-82.4584', name: 'Downtown Brooksville' },
  };

  const countyLower = county.toLowerCase().replace(' county', '');
  const downtown = downtowns[countyLower] || downtowns['hillsborough']; // Default Tampa

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lon}&destinations=${downtown.coords}&departure_time=now&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    // Field 82 = commute_to_city_center per fields-schema.ts
    if (data.rows?.[0]?.elements?.[0]?.duration_in_traffic) {
      return {
        '82_commute_to_city_center': {
          value: data.rows[0].elements[0].duration_in_traffic.text,
          source: 'Google Distance Matrix',
          confidence: 'High',
          details: `To ${downtown.name}`
        }
      };
    } else if (data.rows?.[0]?.elements?.[0]?.duration) {
      return {
        '82_commute_to_city_center': {
          value: data.rows[0].elements[0].duration.text,
          source: 'Google Distance Matrix',
          confidence: 'High',
          details: `To ${downtown.name}`
        }
      };
    }
  } catch (e) {
    console.error('Commute time error:', e);
  }

  return {};
}

async function enrichWithFreeAPIs(address: string): Promise<Record<string, any>> {
  console.log('🔵 [enrichWithFreeAPIs] START - Address:', address);

  const geo = await geocodeAddress(address);
  if (!geo) {
    console.log('❌ [enrichWithFreeAPIs] FAILED - Geocoding returned null');
    return {};
  }

  console.log('✅ [enrichWithFreeAPIs] Geocoding success:', { lat: geo.lat, lon: geo.lon, county: geo.county });

  const fields: Record<string, any> = {};
  // Field 7 = county per fields-schema.ts
  fields['7_county'] = { value: geo.county, source: 'Google Geocode', confidence: 'High' };
  fields['coordinates'] = { value: { lat: geo.lat, lon: geo.lon }, source: 'Google Geocode', confidence: 'High' };

  console.log('🔵 [enrichWithFreeAPIs] Calling 11 APIs in parallel (including Census)...');
  const apiStartTime = Date.now();

  // Extract ZIP code from geo object for Census API
  const zipCode = geo.zipCode || geo.zip || '';

  // Call all APIs in parallel
  const [walkScore, floodZone, airQuality, censusData, noiseData, climateData, distances, commuteTime, schoolDistances, transitAccess, crimeDataResult, schoolDiggerResult, femaRiskResult, noaaClimateResult, noaaStormResult, noaaSeaLevelResult, usgsElevationResult, usgsEarthquakeResult, epaFRSResult, epaRadonResult/*, redfinResult*/] = await Promise.all([
    getWalkScore(geo.lat, geo.lon, address),
    getFloodZone(geo.lat, geo.lon),
    getAirQuality(geo.lat, geo.lon),
    getCensusData(zipCode),
    getNoiseData(geo.lat, geo.lon),
    getClimateData(geo.lat, geo.lon),
    getDistances(geo.lat, geo.lon),
    getCommuteTime(geo.lat, geo.lon, geo.county),
    getSchoolDistances(geo.lat, geo.lon),
    getTransitAccess(geo.lat, geo.lon),
    callCrimeGrade(geo.lat, geo.lon, address),
    callSchoolDigger(geo.lat, geo.lon),
    callFEMARiskIndex(geo.county, 'FL'),
    callNOAAClimate(geo.lat, geo.lon, geo.zip, geo.county), // RE-ENABLED: Detailed climate risk analysis
    callNOAAStormEvents(geo.county, geo.state || 'FL'), // RE-ENABLED: Historical hurricane/tornado data
    callNOAASeaLevel(geo.lat, geo.lon),
    callUSGSElevation(geo.lat, geo.lon),
    callUSGSEarthquake(geo.lat, geo.lon),
    callEPAFRS(geo.lat, geo.lon),
    getRadonRisk(geo.county, 'FL')
    // callRedfinProperty(address) // DISABLED: Redfin API autocomplete not working - returns dummy school data
  ]);

  // Extract fields from API result objects
  const crimeData = crimeDataResult.fields || {};
  const schoolDiggerData = schoolDiggerResult.fields || {};
  const femaRiskData = femaRiskResult.fields || {}; // FEMA Risk Index
  const noaaClimateData = noaaClimateResult.fields || {}; // NOAA Climate risk analysis
  const noaaStormData = noaaStormResult.fields || {}; // NOAA Storm Events (hurricanes/tornadoes)
  const noaaSeaLevelData = noaaSeaLevelResult.fields || {};
  const usgsElevationData = usgsElevationResult.fields || {};
  const usgsEarthquakeData = usgsEarthquakeResult.fields || {};
  const epaFRSData = epaFRSResult.fields || {};
  const epaRadonData = epaRadonResult.fields || {};
  // const redfinData = redfinResult.fields || {}; // DISABLED: Redfin API not working

  const apiEndTime = Date.now();
  console.log(`✅ [enrichWithFreeAPIs] All APIs completed in ${apiEndTime - apiStartTime}ms`);

  Object.assign(fields, walkScore, floodZone, airQuality, censusData, noiseData, climateData, distances, commuteTime, schoolDistances, transitAccess, crimeData, schoolDiggerData, femaRiskData, noaaClimateData, noaaStormData, noaaSeaLevelData, usgsElevationData, usgsEarthquakeData, epaFRSData, epaRadonData/*, redfinData*/);

  console.log('🔵 [enrichWithFreeAPIs] Raw field count before filtering:', Object.keys(fields).length);
  console.log('🔵 [enrichWithFreeAPIs] Field breakdown:');
  console.log('  - WalkScore fields:', Object.keys(walkScore || {}).length);
  console.log('  - FloodZone fields:', Object.keys(floodZone || {}).length);
  console.log('  - AirQuality fields:', Object.keys(airQuality || {}).length);
  console.log('  - Census fields:', Object.keys(censusData || {}).length);
  console.log('  - NoiseData fields:', Object.keys(noiseData || {}).length);
  console.log('  - ClimateData fields:', Object.keys(climateData || {}).length);
  console.log('  - Distances fields:', Object.keys(distances || {}).length);
  console.log('  - CommuteTime fields:', Object.keys(commuteTime || {}).length);
  console.log('  - SchoolDistances fields:', Object.keys(schoolDistances || {}).length);
  console.log('  - TransitAccess fields:', Object.keys(transitAccess || {}).length);
  console.log('  - CrimeData fields:', Object.keys(crimeData || {}).length);
  console.log('  - SchoolDigger fields:', Object.keys(schoolDiggerData || {}).length);
  console.log('  - FEMA Risk Index fields:', Object.keys(femaRiskData || {}).length);
  console.log('  - NOAA Climate fields:', Object.keys(noaaClimateData || {}).length);
  console.log('  - NOAA Storm Events fields:', Object.keys(noaaStormData || {}).length);
  console.log('  - NOAA Sea Level fields:', Object.keys(noaaSeaLevelData || {}).length);
  console.log('  - USGS Elevation fields:', Object.keys(usgsElevationData || {}).length);
  console.log('  - USGS Earthquake fields:', Object.keys(usgsEarthquakeData || {}).length);
  console.log('  - EPA FRS fields:', Object.keys(epaFRSData || {}).length);
  console.log('  - EPA Radon fields:', Object.keys(epaRadonData || {}).length);
  // console.log('  - Redfin fields:', Object.keys(redfinData || {}).length); // DISABLED

  // Store actual field counts in fields object for later tracking
  fields['__FBI_CRIME_COUNT__'] = { value: Object.keys(crimeData).length, source: 'INTERNAL', confidence: 'High' };
  fields['__SCHOOLDIGGER_COUNT__'] = { value: Object.keys(schoolDiggerData).length, source: 'INTERNAL', confidence: 'High' };
  fields['__CENSUS_COUNT__'] = { value: Object.keys(censusData || {}).length, source: 'INTERNAL', confidence: 'High' };
  fields['__FEMA_RISK_COUNT__'] = { value: Object.keys(femaRiskData || {}).length, source: 'INTERNAL', confidence: 'High' };
  fields['__NOAA_SEA_LEVEL_COUNT__'] = { value: Object.keys(noaaSeaLevelData || {}).length, source: 'INTERNAL', confidence: 'High' };
  fields['__USGS_ELEVATION_COUNT__'] = { value: Object.keys(usgsElevationData || {}).length, source: 'INTERNAL', confidence: 'High' };
  fields['__USGS_EARTHQUAKE_COUNT__'] = { value: Object.keys(usgsEarthquakeData || {}).length, source: 'INTERNAL', confidence: 'High' };
  fields['__EPA_FRS_COUNT__'] = { value: Object.keys(epaFRSData || {}).length, source: 'INTERNAL', confidence: 'High' };
  fields['__EPA_RADON_COUNT__'] = { value: Object.keys(epaRadonData || {}).length, source: 'INTERNAL', confidence: 'High' };

  // Filter out nulls
  const filteredFields = Object.fromEntries(
    Object.entries(fields).filter(([_, v]) => v.value !== null && v.value !== undefined)
  );

  console.log('✅ [enrichWithFreeAPIs] END - Returning', Object.keys(filteredFields).length, 'fields after filtering nulls');
  return filteredFields;
}

// ============================================
// PERPLEXITY - HAS REAL WEB SEARCH
// Refactored per Perplexity guidance: grouped fields, priority tiers,
// web search instructions at top, NO NULL VALUES ALLOWED
// ============================================

async function callPerplexity(address: string): Promise<Record<string, any>> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.log('❌ PERPLEXITY_API_KEY not set');
    return {};
  }

  // User message structured per Perplexity guidance:
  // TASK at top, then PROPERTY, then PRIORITY, then FIELDS, then FORMAT
  const userPrompt = `TASK:
1. Use REAL-TIME WEB SEARCH to look up this EXACT property
2. For each field below, find a SPECIFIC value from web sources
3. If you CANNOT find verified data for a field, DO NOT include it - simply omit it
4. NEVER return null values - only return fields where you found REAL data

PROPERTY:
Address: ${address}

PRIORITY:
- P1 (MUST attempt): prices, MLS ID, taxes, HOA fees, beds, baths, sqft, year built, lot size, schools, flood zone
- P2 (SHOULD attempt): utilities, systems, distances, environment/risk fields
- P3 (IF EASY): all remaining fields
If time/coverage is limited, prioritize: P1 > P2 > P3

FIELD SCHEMA (168 fields, grouped with source hints):
${FIELD_GROUPS_PERPLEXITY}

${JSON_RESPONSE_FORMAT_PERPLEXITY}`;

  try {
    console.log('✅ Calling Perplexity API with restructured prompt...');
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: PERPLEXITY_SYSTEM_MESSAGE
          },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Perplexity API error:', response.status, data);
      return {};
    }

    console.log('✅ Perplexity response received:', JSON.stringify(data).substring(0, 500));

    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      console.log('📝 Perplexity full response (first 2000 chars):', text.substring(0, 2000));

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('✅ Perplexity JSON parsed successfully, raw field count:', Object.keys(parsed).length);

          // Use shared filterNullValues with type coercion
          const filteredFields = filterNullValues(parsed, 'Perplexity');
          console.log('✅ Perplexity after filterNullValues:', Object.keys(filteredFields).length, 'fields');

          // Upgrade confidence to High for Perplexity (has web search)
          for (const key of Object.keys(filteredFields)) {
            filteredFields[key].confidence = 'High';
            if (!filteredFields[key].source.includes('Perplexity')) {
              filteredFields[key].source = `${filteredFields[key].source} (via Perplexity)`;
            }
          }
          console.log('✅ Perplexity final return:', Object.keys(filteredFields).length, 'fields');
          return filteredFields;
        } catch (parseError) {
          console.error('❌ Failed to parse Perplexity JSON:', parseError);
          console.error('❌ Raw text that failed:', text);
        }
      } else {
        console.log('❌ No JSON found in Perplexity response');
        console.log('❌ Full text received:', text);
      }
    } else {
      console.log('❌ No content in Perplexity response');
      console.log('❌ Full data object:', JSON.stringify(data));
    }
    return {};
  } catch (error) {
    console.error('❌ Perplexity error:', error);
    return {};
  }
}

// ============================================
// LLM CALLS (DISABLED - hallucinate without web access)
// ============================================

// Field definitions for the prompt - SYNCHRONIZED WITH fields-schema.ts (168 fields)
const FIELD_GROUPS = `
GROUP 1 - Address & Identity (Fields 1-9):
1. full_address, 2. mls_primary, 3. mls_secondary, 4. listing_status, 5. listing_date,
6. neighborhood, 7. county, 8. zip_code, 9. parcel_id

GROUP 2 - Pricing & Value (Fields 10-16):
10. listing_price, 11. price_per_sqft, 12. market_value_estimate, 13. last_sale_date,
14. last_sale_price, 15. assessed_value, 16. redfin_estimate

GROUP 3 - Property Basics (Fields 17-29):
17. bedrooms, 18. full_bathrooms, 19. half_bathrooms, 20. total_bathrooms, 21. living_sqft,
22. total_sqft_under_roof, 23. lot_size_sqft, 24. lot_size_acres, 25. year_built,
26. property_type, 27. stories, 28. garage_spaces, 29. parking_total

GROUP 4 - HOA & Taxes (Fields 30-38):
30. hoa_yn, 31. hoa_fee_annual, 32. hoa_name, 33. hoa_includes, 34. ownership_type,
35. annual_taxes, 36. tax_year, 37. property_tax_rate, 38. tax_exemptions

GROUP 5 - Structure & Systems (Fields 39-48):
39. roof_type, 40. roof_age_est, 41. exterior_material, 42. foundation, 43. water_heater_type,
44. garage_type, 45. hvac_type, 46. hvac_age, 47. laundry_type, 48. interior_condition

GROUP 6 - Interior Features (Fields 49-53):
49. flooring_type, 50. kitchen_features, 51. appliances_included, 52. fireplace_yn, 53. fireplace_count

GROUP 7 - Exterior Features (Fields 54-58):
54. pool_yn, 55. pool_type, 56. deck_patio, 57. fence, 58. landscaping

GROUP 8 - Permits & Renovations (Fields 59-62):
59. recent_renovations, 60. permit_history_roof, 61. permit_history_hvac, 62. permit_history_other

GROUP 9 - Assigned Schools (Fields 63-73):
63. school_district, 64. elevation_feet, 65. elementary_school, 66. elementary_rating,
67. elementary_distance_mi, 68. middle_school, 69. middle_rating, 70. middle_distance_mi,
71. high_school, 72. high_rating, 73. high_distance_mi

GROUP 10 - Location Scores (Fields 74-82):
74. walk_score, 75. transit_score, 76. bike_score, 77. safety_score, 78. noise_level,
79. traffic_level, 80. walkability_description, 81. public_transit_access, 82. commute_to_city_center

GROUP 11 - Distances & Amenities (Fields 83-87):
83. distance_grocery_mi, 84. distance_hospital_mi, 85. distance_airport_mi,
86. distance_park_mi, 87. distance_beach_mi

GROUP 12 - Safety & Crime (Fields 88-90):
88. violent_crime_index, 89. property_crime_index, 90. neighborhood_safety_rating

GROUP 13 - Market & Investment Data (Fields 91-103):
91. median_home_price_neighborhood, 92. price_per_sqft_recent_avg, 93. price_to_rent_ratio,
94. price_vs_median_percent, 95. days_on_market_avg, 96. inventory_surplus, 97. insurance_est_annual,
98. rental_estimate_monthly, 99. rental_yield_est, 100. vacancy_rate_neighborhood,
101. cap_rate_est, 102. financing_terms, 103. comparable_sales

GROUP 14 - Utilities & Connectivity (Fields 104-116):
104. electric_provider, 105. avg_electric_bill, 106. water_provider, 107. avg_water_bill,
108. sewer_provider, 109. natural_gas, 110. trash_provider, 111. internet_providers_top3,
112. max_internet_speed, 113. fiber_available, 114. cable_tv_provider, 115. cell_coverage_quality,
116. emergency_services_distance

GROUP 15 - Environment & Risk (Fields 117-130):
117. air_quality_index, 118. air_quality_grade, 119. flood_zone, 120. flood_risk_level,
121. climate_risk, 122. wildfire_risk, 123. earthquake_risk, 124. hurricane_risk, 125. tornado_risk,
126. radon_risk, 127. superfund_site_nearby, 128. sea_level_rise_risk, 129. noise_level_db_est, 130. solar_potential

GROUP 16 - Additional Features (Fields 131-138):
131. view_type, 132. lot_features, 133. ev_charging, 134. smart_home_features,
135. accessibility_modifications, 136. pet_policy, 137. age_restrictions, 138. special_assessments

GROUP 17 - Stellar MLS Parking (Fields 139-143):
139. carport_yn, 140. carport_spaces, 141. garage_attached_yn, 142. parking_features, 143. assigned_parking_spaces

GROUP 18 - Stellar MLS Building (Fields 144-148):
144. floor_number, 145. building_total_floors, 146. building_name_number, 147. building_elevator_yn, 148. floors_in_unit

GROUP 19 - Stellar MLS Legal (Fields 149-154):
149. subdivision_name, 150. legal_description, 151. homestead_yn, 152. cdd_yn, 153. annual_cdd_fee, 154. front_exposure

GROUP 20 - Stellar MLS Waterfront (Fields 155-159):
155. water_frontage_yn, 156. waterfront_feet, 157. water_access_yn, 158. water_view_yn, 159. water_body_name

GROUP 21 - Stellar MLS Leasing (Fields 160-165):
160. can_be_leased_yn, 161. minimum_lease_period, 162. lease_restrictions_yn, 163. pet_size_limit, 164. max_pet_weight, 165. association_approval_yn

GROUP 22 - Stellar MLS Features (Fields 166-168):
166. community_features, 167. interior_features, 168. exterior_features
`;

// ============================================
// PERPLEXITY-SPECIFIC CONSTANTS (with source hints for web search)
// These are SEPARATE from shared constants to avoid affecting other LLMs
// ============================================

const FIELD_GROUPS_PERPLEXITY = `
GROUP 1 - Address & Identity (Fields 1-9) [P1 = Priority 1]:
1. full_address (from listing sites), 2. mls_primary (from MLS/Zillow/Redfin) [P1],
3. mls_secondary, 4. listing_status (from listing sites) [P1], 5. listing_date (from MLS),
6. neighborhood (from listing sites), 7. county (from county records) [P1],
8. zip_code (from listing sites), 9. parcel_id (from county property appraiser) [P1]

GROUP 2 - Pricing & Value (Fields 10-16) [P1]:
10. listing_price (from Zillow/Redfin/Realtor) [P1], 11. price_per_sqft (calculated),
12. market_value_estimate (Zestimate/Redfin Estimate) [P1], 13. last_sale_date (from county records) [P1],
14. last_sale_price (from county records) [P1], 15. assessed_value (from county property appraiser) [P1],
16. redfin_estimate (from Redfin)

GROUP 3 - Property Basics (Fields 17-29) [P1]:
17. bedrooms (from listing sites) [P1], 18. full_bathrooms (from listing sites) [P1],
19. half_bathrooms (from listing sites), 20. total_bathrooms (calculated),
21. living_sqft (from listing/county) [P1], 22. total_sqft_under_roof (from county),
23. lot_size_sqft (from county) [P1], 24. lot_size_acres (calculated),
25. year_built (from county/listing) [P1], 26. property_type (from listing) [P1],
27. stories (from listing), 28. garage_spaces (from listing), 29. parking_total (from listing)

GROUP 4 - HOA & Taxes (Fields 30-38) [P1]:
30. hoa_yn (from listing) [P1], 31. hoa_fee_annual (from listing/HOA site) [P1],
32. hoa_name (from listing), 33. hoa_includes (from listing),
34. ownership_type (from county), 35. annual_taxes (from county tax collector) [P1],
36. tax_year (from county), 37. property_tax_rate (from county), 38. tax_exemptions (from county)

GROUP 5 - Structure & Systems (Fields 39-48) [P2]:
39. roof_type (from listing/permits), 40. roof_age_est (from permits),
41. exterior_material (from listing), 42. foundation (from listing),
43. water_heater_type (from listing), 44. garage_type (from listing),
45. hvac_type (from listing), 46. hvac_age (from permits),
47. laundry_type (from listing), 48. interior_condition (from listing)

GROUP 6 - Interior Features (Fields 49-53) [P2]:
49. flooring_type (from listing), 50. kitchen_features (from listing),
51. appliances_included (from listing), 52. fireplace_yn (from listing), 53. fireplace_count (from listing)

GROUP 7 - Exterior Features (Fields 54-58) [P2]:
54. pool_yn (from listing/aerial) [P1], 55. pool_type (from listing),
56. deck_patio (from listing), 57. fence (from listing), 58. landscaping (from listing)

GROUP 8 - Permits & Renovations (Fields 59-62) [P2]:
59. recent_renovations (from permits/listing), 60. permit_history_roof (from county permits),
61. permit_history_hvac (from county permits), 62. permit_history_other (from county permits)

GROUP 9 - Assigned Schools (Fields 63-73) [P1]:
63. school_district (from GreatSchools/school site) [P1], 64. elevation_feet (from elevation API),
65. elementary_school (from GreatSchools) [P1], 66. elementary_rating (from GreatSchools) [P1],
67. elementary_distance_mi (calculated), 68. middle_school (from GreatSchools) [P1],
69. middle_rating (from GreatSchools) [P1], 70. middle_distance_mi (calculated),
71. high_school (from GreatSchools) [P1], 72. high_rating (from GreatSchools) [P1],
73. high_distance_mi (calculated)

GROUP 10 - Location Scores (Fields 74-82) [P2]:
74. walk_score (from WalkScore.com), 75. transit_score (from WalkScore.com),
76. bike_score (from WalkScore.com), 77. safety_score (from crime sites),
78. noise_level (from HowLoud), 79. traffic_level (from traffic sites),
80. walkability_description, 81. public_transit_access, 82. commute_to_city_center

GROUP 11 - Distances & Amenities (Fields 83-87) [P2]:
83. distance_grocery_mi (from Google Maps), 84. distance_hospital_mi (from Google Maps),
85. distance_airport_mi (from Google Maps), 86. distance_park_mi (from Google Maps),
87. distance_beach_mi (from Google Maps)

GROUP 12 - Safety & Crime (Fields 88-90) [P2]:
88. violent_crime_index (from NeighborhoodScout/CrimeGrade), 89. property_crime_index (from crime sites),
90. neighborhood_safety_rating (from crime sites)

GROUP 13 - Market & Investment Data (Fields 91-103) [P2]:
91. median_home_price_neighborhood (from Zillow/Redfin), 92. price_per_sqft_recent_avg (from listing sites),
93. price_to_rent_ratio (calculated), 94. price_vs_median_percent (calculated),
95. days_on_market_avg (from listing sites), 96. inventory_surplus (from market reports),
97. insurance_est_annual (from insurance sites), 98. rental_estimate_monthly (from Rentometer/Zillow),
99. rental_yield_est (calculated), 100. vacancy_rate_neighborhood (from census),
101. cap_rate_est (calculated), 102. financing_terms, 103. comparable_sales (from listing sites)

GROUP 14 - Utilities & Connectivity (Fields 104-116) [P3]:
104. electric_provider (from utility sites), 105. avg_electric_bill,
106. water_provider (from utility sites), 107. avg_water_bill,
108. sewer_provider, 109. natural_gas, 110. trash_provider,
111. internet_providers_top3 (from BroadbandNow), 112. max_internet_speed,
113. fiber_available, 114. cable_tv_provider, 115. cell_coverage_quality,
116. emergency_services_distance

GROUP 15 - Environment & Risk (Fields 117-130) [P2]:
117. air_quality_index (from AirNow), 118. air_quality_grade,
119. flood_zone (from FEMA NFHL) [P1], 120. flood_risk_level (from FEMA) [P1],
121. climate_risk, 122. wildfire_risk, 123. earthquake_risk,
124. hurricane_risk, 125. tornado_risk, 126. radon_risk,
127. superfund_site_nearby, 128. sea_level_rise_risk, 129. noise_level_db_est, 130. solar_potential

GROUP 16 - Additional Features (Fields 131-138) [P3]:
131. view_type (from listing), 132. lot_features (from listing),
133. ev_charging (from listing), 134. smart_home_features (from listing),
135. accessibility_modifications, 136. pet_policy, 137. age_restrictions, 138. special_assessments

GROUP 17 - Stellar MLS Parking (Fields 139-143) [P3]:
139. carport_yn, 140. carport_spaces, 141. garage_attached_yn, 142. parking_features, 143. assigned_parking_spaces

GROUP 18 - Stellar MLS Building (Fields 144-148) [P3]:
144. floor_number, 145. building_total_floors, 146. building_name_number, 147. building_elevator_yn, 148. floors_in_unit

GROUP 19 - Stellar MLS Legal (Fields 149-154) [P3]:
149. subdivision_name (from county), 150. legal_description (from county),
151. homestead_yn (from county), 152. cdd_yn, 153. annual_cdd_fee, 154. front_exposure

GROUP 20 - Stellar MLS Waterfront (Fields 155-159) [P3]:
155. water_frontage_yn, 156. waterfront_feet, 157. water_access_yn, 158. water_view_yn, 159. water_body_name

GROUP 21 - Stellar MLS Leasing (Fields 160-165) [P3]:
160. can_be_leased_yn, 161. minimum_lease_period, 162. lease_restrictions_yn,
163. pet_size_limit, 164. max_pet_weight, 165. association_approval_yn

GROUP 22 - Stellar MLS Features (Fields 166-168) [P3]:
166. community_features, 167. interior_features, 168. exterior_features
`;

const JSON_RESPONSE_FORMAT_PERPLEXITY = `
RESPONSE FORMAT - Return ONLY valid JSON. DO NOT include fields you cannot find - simply omit them.

Example (for a DIFFERENT property - only showing fields that were FOUND):
{
  "10_listing_price": { "value": 650000, "source": "Zillow - https://www.zillow.com/..." },
  "7_county": { "value": "Pinellas County", "source": "County Property Appraiser - https://www.pcpao.gov/..." },
  "35_annual_taxes": { "value": 8234, "source": "County Tax Collector - https://..." },
  "17_bedrooms": { "value": 4, "source": "Redfin - https://www.redfin.com/..." },
  "119_flood_zone": { "value": "Zone X", "source": "FEMA - https://msc.fema.gov/..." }
}

CRITICAL RULES:
- Use EXACT field keys: [number]_[field_name] (e.g., "10_listing_price", "7_county", "17_bedrooms")
- If you CANNOT find verified data for a field, DO NOT include it in your response
- NEVER return null values - simply omit unfound fields
- Include source URL for every field you return
- Only return fields where you found REAL data from web search`;

const PERPLEXITY_SYSTEM_MESSAGE = `You are a real estate data researcher with REAL-TIME WEB SEARCH capabilities.

CRITICAL INSTRUCTIONS:
1. You MUST use web search to retrieve VERIFIED, up-to-date property data
2. Prefer official and primary sources: MLS portals (Zillow, Redfin, Realtor.com), county property appraisers, school rating sites (GreatSchools), FEMA
3. NEVER fabricate URLs, values, or data - only return what you actually find via web search
4. If you cannot find data for a field, DO NOT include that field - simply omit it from your response
5. NEVER return null values - omit unfound fields entirely

SOURCE PRIORITY:
1. County Property Appraiser websites (for taxes, assessed value, parcel ID, ownership)
2. MLS-powered listing sites (Zillow, Redfin, Realtor.com) for listing data
3. GreatSchools.org for school assignments and ratings
4. FEMA NFHL for flood zones
5. WalkScore.com for walk/transit/bike scores`;

// ============================================
// LLM-SPECIFIC PROMPTS - Tailored to each model's capabilities
// ============================================

// CRITICAL: Exact field key format for reliable mapping
// SOURCE OF TRUTH: src/types/fields-schema.ts - ALL 168 FIELDS
const EXACT_FIELD_KEYS = `
EXACT FIELD KEYS - You MUST use these EXACT keys (number_fieldname format):

GROUP 1 - Address & Identity (Fields 1-9):
1_full_address, 2_mls_primary, 3_mls_secondary, 4_listing_status, 5_listing_date,
6_neighborhood, 7_county, 8_zip_code, 9_parcel_id,

GROUP 2 - Pricing & Value (Fields 10-16):
10_listing_price, 11_price_per_sqft, 12_market_value_estimate, 13_last_sale_date,
14_last_sale_price, 15_assessed_value, 16_redfin_estimate,

GROUP 3 - Property Basics (Fields 17-29):
17_bedrooms, 18_full_bathrooms, 19_half_bathrooms, 20_total_bathrooms, 21_living_sqft,
22_total_sqft_under_roof, 23_lot_size_sqft, 24_lot_size_acres, 25_year_built,
26_property_type, 27_stories, 28_garage_spaces, 29_parking_total,

GROUP 4 - HOA & Taxes (Fields 30-38):
30_hoa_yn, 31_hoa_fee_annual, 32_hoa_name, 33_hoa_includes, 34_ownership_type,
35_annual_taxes, 36_tax_year, 37_property_tax_rate, 38_tax_exemptions,

GROUP 5 - Structure & Systems (Fields 39-48):
39_roof_type, 40_roof_age_est, 41_exterior_material, 42_foundation, 43_water_heater_type,
44_garage_type, 45_hvac_type, 46_hvac_age, 47_laundry_type, 48_interior_condition,

GROUP 6 - Interior Features (Fields 49-53):
49_flooring_type, 50_kitchen_features, 51_appliances_included, 52_fireplace_yn, 53_fireplace_count,

GROUP 7 - Exterior Features (Fields 54-58):
54_pool_yn, 55_pool_type, 56_deck_patio, 57_fence, 58_landscaping,

GROUP 8 - Permits & Renovations (Fields 59-62):
59_recent_renovations, 60_permit_history_roof, 61_permit_history_hvac, 62_permit_history_other,

GROUP 9 - Assigned Schools (Fields 63-73):
63_school_district, 64_elevation_feet, 65_elementary_school, 66_elementary_rating,
67_elementary_distance_mi, 68_middle_school, 69_middle_rating, 70_middle_distance_mi,
71_high_school, 72_high_rating, 73_high_distance_mi,

GROUP 10 - Location Scores (Fields 74-82):
74_walk_score, 75_transit_score, 76_bike_score, 77_safety_score, 78_noise_level,
79_traffic_level, 80_walkability_description, 81_public_transit_access, 82_commute_to_city_center,

GROUP 11 - Distances & Amenities (Fields 83-87):
83_distance_grocery_mi, 84_distance_hospital_mi, 85_distance_airport_mi,
86_distance_park_mi, 87_distance_beach_mi,

GROUP 12 - Safety & Crime (Fields 88-90):
88_violent_crime_index, 89_property_crime_index, 90_neighborhood_safety_rating,

GROUP 13 - Market & Investment Data (Fields 91-103):
91_median_home_price_neighborhood, 92_price_per_sqft_recent_avg, 93_price_to_rent_ratio,
94_price_vs_median_percent, 95_days_on_market_avg, 96_inventory_surplus, 97_insurance_est_annual,
98_rental_estimate_monthly, 99_rental_yield_est, 100_vacancy_rate_neighborhood,
101_cap_rate_est, 102_financing_terms, 103_comparable_sales,

GROUP 14 - Utilities & Connectivity (Fields 104-116):
104_electric_provider, 105_avg_electric_bill, 106_water_provider, 107_avg_water_bill,
108_sewer_provider, 109_natural_gas, 110_trash_provider, 111_internet_providers_top3,
112_max_internet_speed, 113_fiber_available, 114_cable_tv_provider, 115_cell_coverage_quality,
116_emergency_services_distance,

GROUP 15 - Environment & Risk (Fields 117-130):
117_air_quality_index, 118_air_quality_grade, 119_flood_zone, 120_flood_risk_level,
121_climate_risk, 122_wildfire_risk, 123_earthquake_risk, 124_hurricane_risk, 125_tornado_risk,
126_radon_risk, 127_superfund_site_nearby, 128_sea_level_rise_risk, 129_noise_level_db_est, 130_solar_potential,

GROUP 16 - Additional Features (Fields 131-138):
131_view_type, 132_lot_features, 133_ev_charging, 134_smart_home_features,
135_accessibility_modifications, 136_pet_policy, 137_age_restrictions, 138_special_assessments,

GROUP 17 - Stellar MLS Parking (Fields 139-143):
139_carport_yn, 140_carport_spaces, 141_garage_attached_yn, 142_parking_features, 143_assigned_parking_spaces,

GROUP 18 - Stellar MLS Building (Fields 144-148):
144_floor_number, 145_building_total_floors, 146_building_name_number, 147_building_elevator_yn, 148_floors_in_unit,

GROUP 19 - Stellar MLS Legal (Fields 149-154):
149_subdivision_name, 150_legal_description, 151_homestead_yn, 152_cdd_yn, 153_annual_cdd_fee, 154_front_exposure,

GROUP 20 - Stellar MLS Waterfront (Fields 155-159):
155_water_frontage_yn, 156_waterfront_feet, 157_water_access_yn, 158_water_view_yn, 159_water_body_name,

GROUP 21 - Stellar MLS Leasing (Fields 160-165):
160_can_be_leased_yn, 161_minimum_lease_period, 162_lease_restrictions_yn, 163_pet_size_limit, 164_max_pet_weight, 165_association_approval_yn,

GROUP 22 - Stellar MLS Features (Fields 166-168):
166_community_features, 167_interior_features, 168_exterior_features`;

// BASE JSON RESPONSE FORMAT (shared)
const JSON_RESPONSE_FORMAT = `
${EXACT_FIELD_KEYS}

RESPONSE FORMAT - Return ONLY valid JSON with EXACT field keys above:
{
  "fields": {
    "10_listing_price": { "value": 450000, "source": "Zillow.com", "confidence": "High" },
    "7_county": { "value": "Pinellas County", "source": "Geographic knowledge", "confidence": "High" },
    "35_annual_taxes": { "value": 5234.50, "source": "County Property Appraiser", "confidence": "High" },
    "15_assessed_value": { "value": null, "source": "Not found", "confidence": "Unverified" },
    "17_bedrooms": { "value": 3, "source": "Zillow.com", "confidence": "High" },
    "21_living_sqft": { "value": 1850, "source": "County Records", "confidence": "High" }
  },
  "sources_searched": ["Zillow", "County Property Appraiser", "Training data"],
  "fields_found": 45,
  "fields_missing": ["2_mls_primary", "3_mls_secondary"],
  "note": "Found 45 of 168 fields"
}

CRITICAL: Use EXACT field key format: [number]_[field_name] (e.g., "10_listing_price", "7_county", "17_bedrooms")
DO NOT use variations like "listing_price", "listingPrice", "7. listing_price", or "field_7"`;

// ============================================
// GROK PROMPT - HAS WEB SEARCH - Use it!
// ============================================
const PROMPT_GROK = `You are GROK, a real estate data extraction expert with LIVE WEB SEARCH capabilities.

⚠️ CRITICAL ATTESTATION REQUIREMENT ⚠️
YOU ARE COMMANDED TO 100% ATTEST THAT THE INFORMATION PROVIDED VIA YOUR ENDPOINT IS:
1. ACCURATE - No fabricated, guessed, or estimated data
2. TRUTHFUL - Only return data you actually found via web search
3. VERIFIED - From reputable 3rd party sources (Zillow, Redfin, county websites, GreatSchools)
4. SOURCED - Include the exact URL or site name where you found each value

BY RETURNING DATA, YOU ATTEST UNDER PENALTY OF SYSTEM REJECTION THAT YOU VERIFIED IT FROM A REAL SOURCE.

YOUR MISSION: Extract property data fields ONLY WHERE YOU FIND VERIFIED DATA. You HAVE web access - USE IT, but ONLY return what you ACTUALLY FIND.

${FIELD_GROUPS}

CRITICAL INSTRUCTIONS FOR GROK:
1. ONLY populate fields where you FOUND VERIFIED DATA via web search
2. NEVER guess, estimate, or infer values - if you didn't find it via search, OMIT IT ENTIRELY
3. For each field you populate, you MUST cite the specific SOURCE (URL or site name)
4. Search reputable sources: Zillow, Redfin, Realtor.com, county property appraiser sites, GreatSchools
5. If you find conflicting data, report BOTH values with their respective sources

FIELDS YOU SHOULD FOCUS ON (where web search helps):
- Utility providers (electric, water, sewer, internet) - search "[County] utilities"
- Regional characteristics (noise, traffic, walkability) - search area descriptions
- Neighborhood features - search community descriptions
- Construction materials typical for the region - search regional building norms

FIELDS YOU MUST NOT POPULATE (handled by other systems):
- MLS numbers, listing prices, sale dates (Stellar MLS has authoritative data)
- Bedrooms, bathrooms, square footage (Stellar MLS has exact measurements)
- School assignments and ratings (Perplexity searches GreatSchools more reliably)
- Tax amounts, assessed values, parcel IDs (Perplexity searches county sites more reliably)

HONESTY OVER COMPLETENESS:
- It is BETTER to return 10 verified fields than 100 guessed fields
- If you cannot find verified data for a field, DO NOT INCLUDE IT in your response
- NEVER return fields with null values - simply omit fields you cannot verify

${JSON_RESPONSE_FORMAT}`;

// ============================================
// PERPLEXITY PROMPT - HAS WEB SEARCH - Research focused
// ============================================
const PROMPT_PERPLEXITY = `You are a real estate research expert with LIVE WEB SEARCH capabilities.

YOUR MISSION: Research and extract ALL 168 property data fields. You have web access - search thoroughly and cite sources.

${FIELD_GROUPS}

CRITICAL INSTRUCTIONS FOR PERPLEXITY:
1. SEARCH multiple real estate sites: Zillow, Redfin, Realtor.com, Trulia, Homes.com
2. SEARCH county records: "[County Name] Property Appraiser" for tax data, ownership, parcel info
3. SEARCH for recent comparable sales in the neighborhood
4. SEARCH for school ratings, walk scores, crime statistics
5. For EVERY field you populate, include the SOURCE URL or site name

HIGH-VALUE SEARCHES TO PERFORM:
- "[Address] Zillow" - listing details, Zestimate, tax history
- "[Address] Redfin" - listing, estimate, neighborhood data
- "[County] Property Appraiser [Address]" - official tax records, assessed value, parcel ID
- "[Address] sold" - recent sale history
- "Schools near [Address]" - assigned schools and ratings
- "[ZIP code] flood zone" - FEMA flood data
- "[Neighborhood] median home price" - market comparisons

CONFIDENCE LEVELS:
- High: Found on official county site or multiple listing sites agree
- Medium: Found on one real estate site
- Low: Estimated or extrapolated
- Unverified: Could not find - return null

${JSON_RESPONSE_FORMAT}`;

// ============================================
// CLAUDE OPUS PROMPT - NO WEB - Highest reasoning, use training data
// ============================================
const PROMPT_CLAUDE_OPUS = `You are Claude Opus, the most capable AI assistant, helping extract property data. You do NOT have web access.

YOUR MISSION: Extract as many of the 168 property fields as possible using your training knowledge.

${FIELD_GROUPS}

WHAT YOU CAN PROVIDE (from training data):
1. GEOGRAPHIC KNOWLEDGE:
   - County names for any US address
   - Typical utility providers by region (Duke Energy for Tampa Bay, etc.)
   - School district names for well-known areas
   - General flood zone classifications for coastal/inland areas

2. REGIONAL NORMS:
   - Typical property tax rates by county
   - Common HOA fee ranges for property types
   - Average insurance costs by region
   - Typical construction materials for the region

3. DERIVED/CALCULATED VALUES:
   - If given sqft, can estimate price per sqft from regional averages
   - Can estimate lot size in acres from sqft
   - Can provide typical ranges for cap rates, rental yields

WHAT YOU CANNOT PROVIDE (require live data):
- Current listing prices, MLS numbers
- Actual assessed values, specific tax amounts
- Current owner names, recent sale dates/prices
- Live walk scores, current crime statistics

For fields requiring live data, return: { "value": null, "source": "Requires live data", "confidence": "Unverified" }

Be HONEST about uncertainty. It's better to return null than to guess.

${JSON_RESPONSE_FORMAT}`;

// ============================================
// GPT-4 PROMPT - NO WEB - Strong reasoning
// ============================================
const PROMPT_GPT = `You are GPT-4, a real estate data extraction assistant. You do NOT have web access.

YOUR MISSION: Extract property data fields using your training knowledge (cutoff: early 2024).

${FIELD_GROUPS}

EXTRACTION STRATEGY:
1. START with geographic/regional knowledge you're confident about
2. For Florida properties, you likely know:
   - County boundaries and names
   - Major utility providers (Duke Energy, TECO, Tampa Bay Water)
   - School district structures
   - General flood zone patterns (coastal vs inland)

3. PROVIDE estimates only when you can explain your reasoning:
   - "Based on Tampa Bay area averages..."
   - "Typical for Pinellas County residential..."

4. ALWAYS distinguish between:
   - KNOWN: From training data with high confidence
   - ESTIMATED: Reasonable inference from similar properties
   - UNKNOWN: Requires live data - return null

DO NOT INVENT:
- Specific prices, MLS numbers, parcel IDs
- Exact tax amounts or assessed values
- Owner names or sale dates
- Current listing status

${JSON_RESPONSE_FORMAT}`;

// ============================================
// CLAUDE SONNET PROMPT - NO WEB - Fast, efficient
// ============================================
const PROMPT_CLAUDE_SONNET = `You are Claude Sonnet, a fast and efficient property data extractor. No web access.

TASK: Extract property fields from training knowledge. Be quick but accurate.

${FIELD_GROUPS}

QUICK EXTRACTION RULES:
1. Geographic data (county, region): Usually can provide
2. Utility providers: Often know major providers by state/region
3. School districts: Know structure, not specific assignments
4. Tax rates: Know typical ranges by state
5. Property-specific data (prices, MLS, owners): Return null

CONFIDENCE GUIDE:
- High: Geographic facts, major utility providers
- Medium: Regional estimates, typical ranges
- Unverified: Anything property-specific

Keep responses focused. Don't over-explain.

${JSON_RESPONSE_FORMAT}`;

// ============================================
// COPILOT PROMPT - NO WEB - Structured output focus
// ============================================
const PROMPT_COPILOT = `You are an AI assistant helping extract structured property data. No web access.

TASK: Return a structured JSON with property fields from training knowledge.

${FIELD_GROUPS}

FOCUS ON:
1. Correctly structured JSON output
2. Proper field keys matching the schema
3. Appropriate null values for unknown data
4. Clear source attribution

PROVIDE:
- Geographic data you're confident about
- Regional utility/service provider names
- General area characteristics

RETURN NULL FOR:
- Specific prices, values, taxes
- MLS numbers, parcel IDs
- Owner information
- Current market data

${JSON_RESPONSE_FORMAT}`;

// ============================================
// GEMINI PROMPT - NO WEB - Knowledge focused
// ============================================
const PROMPT_GEMINI = `You are Gemini, a knowledgeable AI helping extract property data. No web access.

TASK: Extract property data fields using your training knowledge.

${FIELD_GROUPS}

EXTRACTION APPROACH:
1. Provide what you know from training data
2. Be clear about confidence levels
3. Return null for property-specific data requiring live lookups
4. Focus on geographic, regional, and structural knowledge

LIKELY CAN PROVIDE:
- County identification
- Regional utility providers
- General school district info
- Typical construction/architectural styles
- Climate and environmental generalities

CANNOT PROVIDE (return null):
- Current listing data
- Specific tax amounts
- Recent sales data
- Current owner info

${JSON_RESPONSE_FORMAT}`;

// Legacy fallback prompt
const SYSTEM_PROMPT = PROMPT_CLAUDE_OPUS;

// Claude Opus API call - MOST RELIABLE per audit
async function callClaudeOpus(address: string): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: 'ANTHROPIC_API_KEY not set', fields: {} };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 16000, // Increased from 8000 to handle 168 fields
        system: PROMPT_CLAUDE_OPUS,
        messages: [
          {
            role: 'user',
            content: `Extract all 168 property data fields for this address: ${address}

Use your training knowledge to provide geographic, regional, and structural data. Return null for fields requiring live data.`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.content && data.content[0]?.text) {
      const text = data.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          // 🛡️ NULL BLOCKING: Filter all null values before returning
          const filteredFields = filterNullValues(parsed, 'Claude Opus');
          return { fields: filteredFields, llm: 'Claude Opus' };
        } catch (parseError) {
          console.error('❌ Claude Opus JSON.parse error:', parseError);
          return { error: `JSON parse error: ${String(parseError)}`, fields: {}, llm: 'Claude Opus' };
        }
      }
    }
    return { error: 'Failed to parse Claude Opus response', fields: {}, llm: 'Claude Opus' };
  } catch (error) {
    return { error: String(error), fields: {}, llm: 'Claude Opus' };
  }
}

// Claude Sonnet API call - 4th in reliability per audit
async function callClaudeSonnet(address: string): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: 'ANTHROPIC_API_KEY not set', fields: {} };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000, // Increased from 8000 to handle 168 fields
        system: PROMPT_CLAUDE_SONNET,
        messages: [
          {
            role: 'user',
            content: `Extract property data fields for: ${address}

Quick extraction from training knowledge. Return null for property-specific data.`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.content && data.content[0]?.text) {
      const text = data.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          // 🛡️ NULL BLOCKING: Filter all null values before returning
          const filteredFields = filterNullValues(parsed, 'Claude Sonnet');
          return { fields: filteredFields, llm: 'Claude Sonnet' };
        } catch (parseError) {
          console.error('❌ Claude Sonnet JSON.parse error:', parseError);
          return { error: `JSON parse error: ${String(parseError)}`, fields: {}, llm: 'Claude Sonnet' };
        }
      }
    }
    return { error: 'Failed to parse Claude Sonnet response', fields: {}, llm: 'Claude Sonnet' };
  } catch (error) {
    return { error: String(error), fields: {}, llm: 'Claude Sonnet' };
  }
}

// GitHub Copilot API call - 5th in reliability per audit
async function callCopilot(address: string): Promise<any> {
  // Copilot uses Azure OpenAI or GitHub's API
  const apiKey = process.env.GITHUB_COPILOT_API_KEY || process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;

  if (!apiKey) return { error: 'COPILOT/AZURE API key not set', fields: {} };

  try {
    // If using Azure OpenAI endpoint
    const url = endpoint
      ? `${endpoint}/openai/deployments/gpt-4/chat/completions?api-version=2024-02-15-preview`
      : 'https://api.githubcopilot.com/chat/completions'; // GitHub Copilot API

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (endpoint) {
      headers['api-key'] = apiKey;
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'gpt-4',
        max_tokens: 16000, // Increased from 8000 to handle 168 fields
        messages: [
          { role: 'system', content: PROMPT_COPILOT },
          {
            role: 'user',
            content: `Extract property data fields for: ${address}

Return structured JSON with proper field keys. Use null for unknown data.`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.choices && data.choices[0]?.message?.content) {
      const text = data.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          // 🛡️ NULL BLOCKING: Filter all null values before returning
          const filteredFields = filterNullValues(parsed, 'Copilot');
          return { fields: filteredFields, llm: 'Copilot' };
        } catch (parseError) {
          console.error('❌ Copilot JSON.parse error:', parseError);
          return { error: `JSON parse error: ${String(parseError)}`, fields: {}, llm: 'Copilot' };
        }
      }
    }
    return { error: 'Failed to parse Copilot response', fields: {}, llm: 'Copilot' };
  } catch (error) {
    return { error: String(error), fields: {}, llm: 'Copilot' };
  }
}

// OpenAI GPT API call - #2 in reliability
async function callGPT(address: string): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { error: 'OPENAI_API_KEY not set', fields: {} };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 16000, // Increased from 8000 to handle 168 fields
        messages: [
          { role: 'system', content: PROMPT_GPT },
          {
            role: 'user',
            content: `Extract all 168 property data fields for this address: ${address}

Use your training knowledge. Return JSON with EXACT field keys (e.g., "10_listing_price", "7_county", "17_bedrooms"). Return null for fields requiring live data.`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.choices && data.choices[0]?.message?.content) {
      const text = data.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          // 🛡️ NULL BLOCKING: Filter all null values before returning
          const filteredFields = filterNullValues(parsed, 'GPT');
          return { fields: filteredFields, llm: 'GPT' };
        } catch (parseError) {
          console.error('❌ GPT JSON.parse error:', parseError);
          console.error('   JSON length:', jsonMatch[0].length, 'chars');
          console.error('   JSON sample (first 500 chars):', jsonMatch[0].substring(0, 500));
          console.error('   JSON sample (last 500 chars):', jsonMatch[0].substring(jsonMatch[0].length - 500));
          return { error: `JSON parse error: ${String(parseError)}`, fields: {}, llm: 'GPT' };
        }
      }
    }
    return { error: 'Failed to parse GPT response', fields: {}, llm: 'GPT' };
  } catch (error) {
    return { error: String(error), fields: {}, llm: 'GPT' };
  }
}

// ============================================
// GROK FIELD RESTRICTIONS
// Prevents Grok from hallucinating on fields that Stellar MLS and Perplexity handle authoritatively
// Grok was hallucinating on 75% of fields - now restricted to gap-filling only
// ============================================
const GROK_RESTRICTED_FIELDS = new Set([
  // Stellar MLS core listing data (Stellar is authoritative)
  '2_mls_primary', '3_mls_secondary', '4_listing_status', '5_listing_date',
  '10_listing_price', '13_last_sale_date', '14_last_sale_price',

  // Stellar MLS property data (exact measurements from MLS)
  '17_bedrooms', '18_full_bathrooms', '19_half_bathrooms',
  '21_living_sqft', '22_total_sqft_under_roof', '23_lot_size_sqft',
  '25_year_built', '26_property_type', '27_stories',
  '28_garage_spaces', '29_parking_total',

  // Stellar MLS HOA data
  '30_hoa_yn', '31_hoa_fee_annual', '32_hoa_name', '33_hoa_includes', '34_ownership_type',

  // Stellar MLS exclusive fields (139-168) - Grok has NO access to these
  '139_carport_yn', '140_carport_spaces', '141_garage_attached_yn',
  '142_parking_features', '143_assigned_parking_spaces',
  '144_floor_number', '145_building_total_floors', '146_building_name_number',
  '147_building_elevator_yn', '148_floors_in_unit',
  '149_subdivision_name', '150_legal_description', '151_homestead_yn',
  '152_cdd_yn', '153_annual_cdd_fee', '154_front_exposure',
  '155_water_frontage_yn', '156_waterfront_feet', '157_water_access_yn',
  '158_water_view_yn', '159_water_body_name',
  '160_can_be_leased_yn', '161_minimum_lease_period', '162_lease_restrictions_yn',
  '163_pet_size_limit', '164_max_pet_weight', '165_association_approval_yn',
  '166_community_features', '167_interior_features', '168_exterior_features',

  // Perplexity web search territory (Perplexity searches live sources)
  '9_parcel_id', '11_price_per_sqft', '12_market_value_estimate',
  '15_assessed_value', '16_redfin_estimate',
  '35_annual_taxes', '36_tax_year', '37_property_tax_rate', '38_tax_exemptions',
  '63_school_district', '65_elementary_school', '66_elementary_rating',
  '68_middle_school', '69_middle_rating', '71_high_school', '72_high_rating',
  '91_median_home_price_neighborhood', '92_price_per_sqft_recent_avg',
  '95_days_on_market_avg', '98_rental_estimate_monthly', '103_comparable_sales'
]);

// Grok API call (xAI) - #2 in reliability, HAS WEB SEARCH
async function callGrok(address: string): Promise<any> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) { console.log('❌ XAI_API_KEY not set'); return { error: 'XAI_API_KEY not set', fields: {} }; } console.log('✅ XAI_API_KEY found, calling Grok API...');

  // Grok-specific prompt with web search emphasis
  const grokSystemPrompt = `${PROMPT_GROK}

${EXACT_FIELD_KEYS}

CRITICAL: Use EXACT field keys like "10_listing_price", "7_county", "35_annual_taxes", "17_bedrooms"
SEARCH THE WEB AGGRESSIVELY for: listing prices, tax values, assessed values, MLS numbers, school ratings
CITE YOUR SOURCES for every field you populate`;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4',
        max_tokens: 16000, // Increased from 8000 to handle 168 fields (was causing truncated JSON)
        temperature: 0.1, // Low temperature for factual consistency
        messages: [
          { role: 'system', content: grokSystemPrompt },
          {
            role: 'user',
            content: `Use your web search tools to find REAL property data for this address: ${address}

Search Zillow, Redfin, Realtor.com, county records, and other public sources. Return ONLY verified data you found from actual web searches. Include source URLs in your response.`,
          },
        ],
      }),
    });

    const data = await response.json();
    console.log('Grok response:', JSON.stringify(data).substring(0, 500));

    if (data.choices && data.choices[0]?.message?.content) {
      const text = data.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);

          // 🛡️ GROK RESTRICTION: Remove fields reserved for Stellar MLS and Perplexity
          const restrictedFields = filterGrokRestrictedFields(parsed);

          // 🛡️ NULL BLOCKING: Filter all null values before returning
          const filteredFields = filterNullValues(restrictedFields, 'Grok');
          return { fields: filteredFields, llm: 'Grok' };
        } catch (parseError) {
          console.error('❌ Grok JSON.parse error:', parseError);
          console.error('   JSON length:', jsonMatch[0].length, 'chars');
          console.error('   JSON sample (first 500 chars):', jsonMatch[0].substring(0, 500));
          console.error('   JSON sample (last 500 chars):', jsonMatch[0].substring(jsonMatch[0].length - 500));
          return { error: `JSON parse error: ${String(parseError)}`, fields: {}, llm: 'Grok' };
        }
      }
    }
    return { error: 'Failed to parse Grok response', fields: {}, llm: 'Grok' };
  } catch (error) {
    console.error('Grok error:', error);
    return { error: String(error), fields: {}, llm: 'Grok' };
  }
}

// Gemini API call - #6 in reliability
async function callGemini(address: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { console.log('❌ GEMINI_API_KEY not set'); return { error: 'GEMINI_API_KEY not set', fields: {} }; } console.log('✅ GEMINI_API_KEY found, calling Gemini API...');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${PROMPT_GEMINI}

Extract property data fields for this address: ${address}

Use EXACT field keys like "10_listing_price", "7_county", "35_annual_taxes", "17_bedrooms".
Return null for property-specific data you don't have. Return JSON only.`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 16000, // Increased from 8000 to handle 168 fields
          },
        }),
      }
    );

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text;

      // Try extracting JSON from markdown code block first
      let jsonStr = null;
      const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      } else {
        // Fallback: try to find first complete JSON object (non-greedy)
        const jsonMatch = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }

      if (jsonStr) {
        try {
          const parsed = JSON.parse(jsonStr);
          console.log('🔍 Gemini parsed structure keys:', Object.keys(parsed));
          if (parsed.fields) {
            console.log('🔍 Gemini parsed.fields keys (first 10):', Object.keys(parsed.fields).slice(0, 10));
          }
          // 🛡️ NULL BLOCKING: Filter all null values before returning
          const filteredFields = filterNullValues(parsed, 'Gemini');
          console.log('🔍 Gemini filteredFields keys (first 10):', Object.keys(filteredFields).slice(0, 10));
          return { fields: filteredFields, llm: 'Gemini' };
        } catch (parseError) {
          console.error('❌ Gemini JSON.parse error:', parseError);
          console.error('   Failed JSON string:', jsonStr.substring(0, 200));
          return { error: `JSON parse error: ${String(parseError)}`, fields: {}, llm: 'Gemini' };
        }
      }
    }
    return { error: 'Failed to parse Gemini response', fields: {}, llm: 'Gemini' };
  } catch (error) {
    return { error: String(error), fields: {}, llm: 'Gemini' };
  }
}

// ============================================
// MERGE RESULTS FROM MULTIPLE LLMs
// CRITICAL: Additional NULL blocking layer as final defense
// ============================================
function mergeResults(results: any[]): any {
  const merged: any = {
    fields: {},
    sources: [],
    llm_responses: [],
    conflicts: [],
  };

  const confidenceOrder = { High: 3, Medium: 2, Low: 1, Unverified: 0 };
  let totalNullsBlocked = 0;

  // 🛡️ NULL-LIKE VALUES TO BLOCK (comprehensive list)
  const isNullLike = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim();
      return normalized === '' ||
             normalized === 'null' ||
             normalized === 'n/a' ||
             normalized === 'not found' ||
             normalized === 'unknown' ||
             normalized === 'not available' ||
             normalized === 'none' ||
             normalized === 'undefined' ||
             normalized === 'not specified' ||
             normalized === 'na' ||
             normalized === '-' ||
             normalized === '--';
    }
    if (typeof value === 'number' && isNaN(value)) return true;
    return false;
  };

  // Process each LLM result
  for (const result of results) {
    if (result.error) {
      merged.llm_responses.push({ llm: result.llm, error: result.error });
      continue;
    }

    merged.llm_responses.push({
      llm: result.llm,
      fields_found: result.fields_found || Object.keys(result.fields || {}).length,
    });

    if (result.sources_searched) {
      merged.sources.push(...result.sources_searched);
    }

    // Merge fields - highest confidence wins
    for (const [fieldKey, fieldData] of Object.entries(result.fields || {})) {
      const field = fieldData as any;

      // 🛡️ DEFENSIVE NULL BLOCKING: Skip any null-like values
      if (!field) {
        totalNullsBlocked++;
        continue;
      }

      // Check for null-like value in field object
      if (isNullLike(field.value)) {
        totalNullsBlocked++;
        continue;
      }

      // Check for direct null-like value (if field isn't wrapped)
      if (typeof field !== 'object' && isNullLike(field)) {
        totalNullsBlocked++;
        continue;
      }

      const existing = merged.fields[fieldKey];
      const newConfidence = confidenceOrder[field.confidence as keyof typeof confidenceOrder] || 0;
      const existingConfidence = existing ? confidenceOrder[existing.confidence as keyof typeof confidenceOrder] || 0 : -1;

      if (!existing || newConfidence > existingConfidence) {
        merged.fields[fieldKey] = {
          ...field,
          source: `${field.source} (via ${result.llm})`,
        };
      } else if (existing && !valuesAreSemanticallySame(existing.value, field.value) && newConfidence === existingConfidence) {
        // Conflict - same confidence, different values
        merged.conflicts.push({
          field: fieldKey,
          values: [
            { value: existing.value, llm: existing.source },
            { value: field.value, llm: `${field.source} (via ${result.llm})` },
          ],
        });
      }
    }
  }

  // 🛡️ Final sweep: Remove any nulls that slipped through
  const finalFields: Record<string, any> = {};
  for (const [key, value] of Object.entries(merged.fields)) {
    const v = value as any;
    if (v && !isNullLike(v.value)) {
      finalFields[key] = v;
    } else {
      totalNullsBlocked++;
    }
  }
  merged.fields = finalFields;

  // Dedupe sources
  merged.sources = Array.from(new Set(merged.sources));
  merged.total_fields_found = Object.keys(merged.fields).length;
  merged.completion_percentage = Math.round((merged.total_fields_found / 168) * 100);

  console.log(`🛡️ MERGE COMPLETE: ${merged.total_fields_found} fields accepted, ${totalNullsBlocked} nulls BLOCKED`);

  return merged;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CASCADE STRATEGY: Try all 6 LLMs in RELIABILITY order
  // Order: Perplexity → Grok → Claude Opus → GPT → Claude Sonnet → Gemini
  // Web-search LLMs first (verify real data), then knowledge-based LLMs
  const {
    address: rawAddress,
    url: rawUrl,
    engines = [...LLM_CASCADE_ORDER],  // All 6 LLMs enabled: Perplexity → Grok → Claude Opus → GPT → Claude Sonnet → Gemini
    skipLLMs = false,
    useCascade = true, // Enable cascade mode by default
    existingFields = {},  // Previously accumulated fields from prior LLM calls
    skipApis = false,  // Skip free APIs if we already have their data
  } = req.body;

  // 🛡️ INPUT SANITIZATION: Prevent prompt injection attacks
  const address = sanitizeAddress(rawAddress);
  const url = rawUrl ? sanitizeAddress(rawUrl) : undefined;

  if (!address && !url) {
    return res.status(400).json({ error: 'Address or URL required' });
  }

  // Validate address format
  if (address && !isValidAddress(address)) {
    return res.status(400).json({ error: 'Invalid address format' });
  }

  const searchQuery = address || `property at URL: ${url}`;

  try {
    console.log('=== STARTING PROPERTY SEARCH (with Arbitration Pipeline) ===');
    console.log('Address:', searchQuery);

    // Initialize arbitration pipeline with LLM quorum threshold of 2
    const arbitrationPipeline = createArbitrationPipeline(2);
    const llmResponses: any[] = [];
    const actualFieldCounts: Record<string, number> = {}; // Track ACTUAL fields returned by each source

    // Pre-load existing fields into the pipeline (from previous LLM calls)
    if (existingFields && Object.keys(existingFields).length > 0) {
      console.log(`[ACCUMULATE] Loading ${Object.keys(existingFields).length} existing fields into pipeline`);
      arbitrationPipeline.addFieldsFromSource(existingFields, 'Previous Session');
    }

    // ========================================
    // TIER 1: MLS DATA (Stellar MLS via Bridge Interactive API)
    // Highest authority - search first for property listings
    // ========================================
    if (!skipApis) {
      console.log('========================================');
      console.log('TIER 1: STELLAR MLS (via Bridge Interactive API)');
      console.log('========================================');
      console.log('🔍 [v1] Searching for address:', searchQuery);

      // Parse address into components for better MLS search
      // Format: "7791 W Gulf Blvd, Treasure Island, FL 33706"
      const addressParts = searchQuery.split(',').map(p => p.trim());
      const street = addressParts[0] || searchQuery;
      const city = addressParts[1] || undefined;
      const stateZip = addressParts[2] || '';
      const stateMatch = stateZip.match(/([A-Z]{2})\s*(\d{5})?/);
      const state = stateMatch ? stateMatch[1] : undefined;
      const zipCode = stateMatch && stateMatch[2] ? stateMatch[2] : undefined;

      console.log('📍 Parsed address components:', { street, city, state, zipCode });

      try {
        const bridgeResponse = await withTimeout(
          fetch(`${req.headers.host?.includes('localhost') ? 'http://localhost:3000' : 'https://' + req.headers.host}/api/property/bridge-mls`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: street,
              city: city,
              state: state,
              zipCode: zipCode
            })
          }),
          STELLAR_MLS_TIMEOUT,
          new Response(JSON.stringify({ success: false, error: 'Timeout after 90s' }), { status: 408 })
        );

        console.log('📡 Bridge API Response Status:', bridgeResponse.status, bridgeResponse.statusText);

        if (bridgeResponse.ok) {
          const bridgeData = await bridgeResponse.json();
          console.log('📦 Bridge API Response Data:', JSON.stringify(bridgeData, null, 2));

          if (bridgeData.success && bridgeData.fields) {
            const mlsFieldCount = Object.keys(bridgeData.fields).length;
            console.log('✅ Bridge returned fields:', mlsFieldCount, 'fields');
            console.log('📋 Field keys sample:', Object.keys(bridgeData.fields).slice(0, 10));

            // 🔍 DEBUG: Check for photo fields specifically
            const hasPhotoUrl = 'property_photo_url' in bridgeData.fields;
            const hasPhotoGallery = 'property_photos' in bridgeData.fields;
            console.log('📸 Photo fields check:', { hasPhotoUrl, hasPhotoGallery });
            if (hasPhotoUrl) {
              console.log('  ✅ property_photo_url:', bridgeData.fields.property_photo_url);
            }
            if (hasPhotoGallery) {
              console.log('  ✅ property_photos:', bridgeData.fields.property_photos);
            }

            // Convert Bridge fields to arbitration format
            const mlsFields: Record<string, FieldValue> = {};
            for (const [key, fieldData] of Object.entries(bridgeData.fields)) {
              const field = fieldData as any;
              mlsFields[key] = {
                value: field.value,
                source: field.source || STELLAR_MLS_SOURCE,
                confidence: field.confidence || 'High',
                tier: 1
              };
            }

            const mlsAdded = arbitrationPipeline.addFieldsFromSource(mlsFields, STELLAR_MLS_SOURCE);
            actualFieldCounts[STELLAR_MLS_SOURCE] = mlsFieldCount; // Track ACTUAL fields returned
            console.log(`✅ TIER 1 COMPLETE: Added ${mlsAdded} fields from ${STELLAR_MLS_SOURCE} (via Bridge Interactive)`);
            console.log('📊 Sample MLS field values:', JSON.stringify(Object.fromEntries(Object.entries(mlsFields).slice(0, 3)), null, 2));
          } else {
            console.log('⚠️ Bridge Interactive: No property found or no data returned');
            console.log('   - success:', bridgeData.success);
            console.log('   - fields:', bridgeData.fields ? 'exists but empty' : 'null/undefined');
            // Track that Stellar MLS was called even though it returned 0 fields
            arbitrationPipeline.addFieldsFromSource({}, STELLAR_MLS_SOURCE);
            actualFieldCounts[STELLAR_MLS_SOURCE] = 0;
          }
        } else {
          const errorText = await bridgeResponse.text();
          console.log('❌ Bridge Interactive API call failed');
          console.log('   - Status:', bridgeResponse.status, bridgeResponse.statusText);
          console.log('   - Error:', errorText);
          // Track that Stellar MLS was attempted even though it errored
          arbitrationPipeline.addFieldsFromSource({}, STELLAR_MLS_SOURCE);
          actualFieldCounts[STELLAR_MLS_SOURCE] = 0;
        }
      } catch (error) {
        console.log('❌ Bridge Interactive error (continuing to other sources)');
        console.log('   - Error:', error instanceof Error ? error.message : String(error));
        console.log('   - Stack:', error instanceof Error ? error.stack : 'N/A');
        // Track that Stellar MLS was attempted even though it threw exception
        arbitrationPipeline.addFieldsFromSource({}, STELLAR_MLS_SOURCE);
        actualFieldCounts[STELLAR_MLS_SOURCE] = 0;
      }
      console.log('========================================');
      console.log('');
    }

    // ========================================
    // TIER 2 & 3: FREE APIs (Google, WalkScore, FEMA, etc.)
    // Skip if we're only adding LLM data to existing session
    // ========================================
    if (!skipApis) {
      console.log('========================================');
      console.log('TIER 2 & 3: FREE APIs (Google, WalkScore, FEMA, etc.)');
      console.log('========================================');
      console.log('🔍 Calling enrichWithFreeAPIs with 60s timeout for:', searchQuery);
      try {
        const enrichedData = await withTimeout(
          enrichWithFreeAPIs(searchQuery),
          FREE_API_TIMEOUT,
          {} // Empty object fallback if timeout
        );
        console.log('📦 enrichWithFreeAPIs returned', Object.keys(enrichedData).length, 'fields');

      // Extract actual field counts from special tracking fields
      const fbiCrimeActualCount = (enrichedData['__FBI_CRIME_COUNT__'] as any)?.value || 0;
      const schoolDiggerActualCount = (enrichedData['__SCHOOLDIGGER_COUNT__'] as any)?.value || 0;
      actualFieldCounts[FBI_CRIME_SOURCE] = fbiCrimeActualCount;
      actualFieldCounts['SchoolDigger'] = schoolDiggerActualCount;
      console.log(`🔢 Actual field counts: FBI Crime=${fbiCrimeActualCount}, SchoolDigger=${schoolDiggerActualCount}`);

      // Remove internal tracking/metadata fields from enrichedData
      delete enrichedData['__FBI_CRIME_COUNT__'];
      delete enrichedData['__SCHOOLDIGGER_COUNT__'];
      delete enrichedData['__CENSUS_COUNT__'];
      delete enrichedData['coordinates']; // Lat/lon stored separately in address.latitude/longitude

      if (Object.keys(enrichedData).length === 0) {
        console.log('⚠️ WARNING: enrichWithFreeAPIs returned ZERO fields - no API data available');
      } else {
        console.log('✅ Processing', Object.keys(enrichedData).length, 'fields from enrichWithFreeAPIs');

        // Separate Tier 2 (Google) from Tier 3 (other APIs) and group by source
        const tier2Groups: Record<string, Record<string, FieldValue>> = {}; // Google sources
        const tier3Groups: Record<string, Record<string, FieldValue>> = {}; // Other API sources

        for (const [key, value] of Object.entries(enrichedData)) {
          const fieldData = value as any;
          const source = fieldData?.source || 'Unknown';
          const tier = source.includes('Google') ? 2 : 3;
          const fieldValue: FieldValue = {
            value: fieldData?.value !== undefined ? fieldData.value : fieldData,
            source: source,
            confidence: fieldData?.confidence || 'High',
            tier: tier as 1 | 2 | 3 | 4
          };

          // Group by actual source name to track each independently
          if (source.includes('Google')) {
            if (!tier2Groups[source]) tier2Groups[source] = {};
            tier2Groups[source][key] = fieldValue;
          } else {
            if (!tier3Groups[source]) tier3Groups[source] = {};
            tier3Groups[source][key] = fieldValue;
          }
        }

        console.log('🔵 TIER 2 Google sources:', Object.keys(tier2Groups).map(src => `${src} (${Object.keys(tier2Groups[src]).length} fields)`).join(', '));
        console.log('🔵 TIER 3 API sources:', Object.keys(tier3Groups).map(src => `${src} (${Object.keys(tier3Groups[src]).length} fields)`).join(', '));

        // Add each Google source independently as Tier 2
        for (const [source, fields] of Object.entries(tier2Groups)) {
          const added = arbitrationPipeline.addFieldsFromSource(fields, source);
          console.log(`✅ TIER 2: Added ${added} fields from ${source}`);
        }

        // Add each other API source independently as Tier 3
        for (const [source, fields] of Object.entries(tier3Groups)) {
          const added = arbitrationPipeline.addFieldsFromSource(fields, source);
          console.log(`✅ TIER 3: Added ${added} fields from ${source}`);
        }

        // CRITICAL: Track sources that were called but returned 0 fields
        // This ensures SchoolDigger, FBI Crime, etc. show up even if they fail or return nothing
        const allTier3Sources = ['SchoolDigger', FBI_CRIME_SOURCE, 'WalkScore', 'FEMA NFHL', 'AirNow', 'HowLoud', 'OpenWeatherMap'];
        for (const sourceName of allTier3Sources) {
          if (!tier3Groups[sourceName]) {
            // Source returned 0 fields - add to audit trail so it shows in source_breakdown
            arbitrationPipeline.addFieldsFromSource({}, sourceName);
          }
        }
      }
    } catch (e) {
      console.error('Free APIs enrichment failed:', e);
    }
    } else {
      console.log('Skipping free APIs - using cached data from previous session');
    }

    // ========================================
    // TIER 4: LLM CASCADE
    // ========================================
    if (!skipLLMs) {
      const intermediateResult = arbitrationPipeline.getResult();
      const currentFieldCount = Object.keys(intermediateResult.fields).length;
      console.log(`[LLM GATE] Current field count before LLMs: ${currentFieldCount}`);

      // ALWAYS call selected LLMs - removed the "skip if 110+ fields" logic
      // LLMs provide valuable additional data even if APIs returned some fields
      if (true) {  // Always run LLMs if enabled
        console.log(`\nStep 2: LLM Cascade (${currentFieldCount}/138 fields filled)...`);

        const llmSourceNames: Record<string, string> = {
          'perplexity': 'Perplexity',
          'grok': 'Grok',
          'claude-opus': 'Claude Opus',
          'gpt': 'GPT',
          'claude-sonnet': 'Claude Sonnet',
          'gemini': 'Gemini'
        };

        const llmCascade = [
          { id: 'perplexity', fn: callPerplexity, enabled: engines.includes('perplexity') },
          { id: 'grok', fn: callGrok, enabled: engines.includes('grok') },
          { id: 'claude-opus', fn: callClaudeOpus, enabled: engines.includes('claude-opus') },
          { id: 'gpt', fn: callGPT, enabled: engines.includes('gpt') },
          { id: 'claude-sonnet', fn: callClaudeSonnet, enabled: engines.includes('claude-sonnet') },
          { id: 'gemini', fn: callGemini, enabled: engines.includes('gemini') },
        ];

        // Filter to enabled LLMs only
        const enabledLlms = llmCascade.filter(llm => llm.enabled);

        if (enabledLlms.length > 0) {
          console.log(`\n=== Calling ${enabledLlms.length} LLMs in PARALLEL (Perplexity: ${PERPLEXITY_TIMEOUT}ms, Others: ${LLM_TIMEOUT}ms) ===`);

          // Run ALL enabled LLMs in parallel with timeout wrapper
          const llmResults = await Promise.allSettled(
            enabledLlms.map(llm =>
              withTimeout(
                llm.fn(searchQuery),
                llm.id === 'perplexity' ? PERPLEXITY_TIMEOUT : LLM_TIMEOUT,
                { fields: {}, error: 'timeout' }
              )
            )
          );

          // Process results SEQUENTIALLY to avoid race conditions
          // Results are processed in order: perplexity → grok → claude-opus → gpt → claude-sonnet → gemini
          console.log(`\n=== Processing ${llmResults.length} LLM results in sequence ===`);

          for (let idx = 0; idx < llmResults.length; idx++) {
            const result = llmResults[idx];
            const llm = enabledLlms[idx];
            const processingOrder = idx + 1;

            console.log(`[${processingOrder}/${llmResults.length}] Processing ${llm.id}...`);

            if (result.status === 'fulfilled') {
              const llmData = result.value;

              // Handle both formats: Perplexity returns fields directly, others return { fields: ... }
              const llmFields = llmData.fields || llmData;
              const llmError = llmData.error;
              const rawFieldCount = Object.keys(llmFields || {}).length;

              if (llmError) {
                console.log(`⚠️ [${processingOrder}] ${llm.id}: Error - ${llmError}`);
              }

              if (llmFields && rawFieldCount > 0) {
                // Convert to FieldValue format for arbitration
                const formattedFields: Record<string, FieldValue> = {};
                let skippedNulls = 0;
                let invalidKeys = 0;

                for (const [key, value] of Object.entries(llmFields)) {
                  const fieldData = value as any;
                  const fieldValue = fieldData?.value !== undefined ? fieldData.value : value;

                  // Skip null/empty responses
                  if (fieldValue === null || fieldValue === undefined || fieldValue === '' || fieldValue === 'Not available') {
                    skippedNulls++;
                    continue;
                  }

                  // Validate field key format (should be like "10_listing_price")
                  if (!/^\d+_/.test(key)) {
                    console.log(`⚠️ [${llm.id}] Invalid field key (not in schema): "${key}"`);
                    invalidKeys++;
                    continue;
                  }

                  // Assign tier based on LLM: Perplexity = 4, others = 5
                  const llmTier = llm.id === 'perplexity' ? 4 : 5;

                  formattedFields[key] = {
                    value: fieldValue,
                    source: llmSourceNames[llm.id],
                    confidence: fieldData?.confidence || 'Medium',
                    tier: llmTier as 4 | 5
                  };
                }

                const newUniqueFields = arbitrationPipeline.addFieldsFromSource(formattedFields, llmSourceNames[llm.id]);
                const totalAfter = arbitrationPipeline.getFieldCount();

                llmResponses.push({
                  llm: llm.id,
                  fields_found: rawFieldCount,
                  new_unique_fields: newUniqueFields,
                  success: !llmError
                });

                console.log(`✅ [${processingOrder}] ${llm.id}: ${rawFieldCount} returned, ${skippedNulls} nulls skipped, ${invalidKeys} invalid keys, ${newUniqueFields} new unique added (total now: ${totalAfter})`);
              } else {
                llmResponses.push({
                  llm: llm.id,
                  fields_found: 0,
                  new_unique_fields: 0,
                  success: false,
                  error: llmError || 'No fields returned'
                });
                console.log(`⚠️ [${processingOrder}] ${llm.id}: No fields returned`);
              }
            } else {
              console.error(`❌ [${processingOrder}] ${llm.id} promise rejected:`, result.reason);
              llmResponses.push({
                llm: llm.id,
                fields_found: 0,
                new_unique_fields: 0,
                success: false,
                error: String(result.reason)
              });
            }
          }

          console.log(`=== LLM processing complete. Total fields: ${arbitrationPipeline.getFieldCount()} ===\n`);
        }
      }
      // Removed "Sufficient data" skip logic - LLMs always run if enabled
    }

    // ========================================
    // GET FINAL ARBITRATION RESULT
    // ========================================
    const arbitrationResult = arbitrationPipeline.getResult();
    const totalFields = Object.keys(arbitrationResult.fields).length;
    const completionPercentage = Math.round((totalFields / 168) * 100);

    // Build source breakdown from ALL sources that submitted data (not just winners)
    // This ensures progress tracker shows all sources that attempted to provide data
    const sourceBreakdown: Record<string, number> = {};

    // Track winning fields
    for (const [_, field] of Object.entries(arbitrationResult.fields)) {
      const source = field.source || 'Unknown';
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
    }

    // Track ALL sources from audit trail (including those that lost or returned 0 fields)
    for (const audit of arbitrationResult.auditTrail) {
      if (audit.source && audit.source !== 'Unknown' && !sourceBreakdown[audit.source]) {
        // Initialize to 0 to show they ran but won no fields
        sourceBreakdown[audit.source] = 0;
      }
    }

    // CRITICAL: Override with ACTUAL field counts (not arbitration winners)
    // This shows how many fields each source actually returned, regardless of who won
    for (const [sourceName, actualCount] of Object.entries(actualFieldCounts)) {
      sourceBreakdown[sourceName] = actualCount;
    }

    // Track ACTUAL field counts from LLM responses
    const llmSourceNameMap: Record<string, string> = {
      'perplexity': 'Perplexity',
      'grok': 'Grok',
      'claude-opus': 'Claude Opus',
      'gpt': 'GPT',
      'claude-sonnet': 'Claude Sonnet',
      'gemini': 'Gemini'
    };

    for (const llmResponse of llmResponses) {
      const llmSourceName = llmSourceNameMap[llmResponse.llm];
      if (llmSourceName) {
        // Use fields_found (actual fields returned) NOT new_unique_fields (only winners)
        sourceBreakdown[llmSourceName] = llmResponse.fields_found || 0;
      }
    }

    console.log('========================================');
    console.log('SOURCE BREAKDOWN (for progress tracker):');
    console.log('========================================');
    console.log(JSON.stringify(sourceBreakdown, null, 2));
    console.log('Total fields:', totalFields);
    console.log('Completion:', completionPercentage + '%');
    console.log('========================================');

    // FIX #8: Build lookup maps once before loop instead of O(n) lookups per field
    // Previously: .find(), .some() calls inside loop = O(n*m) complexity
    // Now: O(n) map building + O(1) lookups = O(n+m) complexity
    const conflictMap = new Map<string, Array<{ source: string; value: any; tier: number }>>();
    for (const conflict of arbitrationResult.conflicts) {
      conflictMap.set(conflict.field, conflict.values);
    }

    const warningSet = new Set<string>();
    for (const warning of arbitrationResult.singleSourceWarnings) {
      warningSet.add(warning.field);
    }

    // Convert arbitration fields to frontend DataField format
    const convertedFields: Record<string, any> = {};
    for (const [key, field] of Object.entries(arbitrationResult.fields)) {
      let parsedValue = field.value;

      // Parse dates if they look like date strings
      if (typeof parsedValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(parsedValue)) {
        try {
          parsedValue = new Date(parsedValue).toISOString();
        } catch {}
      } else if (typeof parsedValue === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}/.test(parsedValue)) {
        try {
          const [m, d, y] = parsedValue.split('/');
          parsedValue = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`).toISOString();
        } catch {}
      }

      // FIX #8: O(1) Map/Set lookups instead of O(n) .some()/.find()
      const hasConflict = conflictMap.has(key);
      const hasSingleSourceWarning = warningSet.has(key);

      // Prefer field's own validation status (set by arbitration pipeline)
      // Fall back to recalculating from arrays for backwards compatibility
      const validationStatus = field.validationStatus ||
        (hasSingleSourceWarning ? 'warning' : 'passed');
      const validationMessage = field.validationMessage ||
        (hasSingleSourceWarning ? 'Single LLM source - verify independently' : undefined);

      // FIX #14: Explicit default for confidence
      convertedFields[key] = {
        value: parsedValue,
        confidence: field.confidence ?? 'Medium',
        notes: '',
        sources: [field.source],
        llmSources: field.llmSources ?? [],
        hasConflict: hasConflict,
        conflictValues: conflictMap.get(key) ?? [],
        validationStatus,
        validationMessage
      };
    }

    // Transform flat fields to nested structure for PropertyDetail & other pages
    const nestedFields = convertFlatToNestedStructure(convertedFields);

    // Build sources list from unique sources in result
    const sources = Array.from(new Set(
      Object.values(arbitrationResult.fields).map(f => f.source)
    ));

    return res.status(200).json({
      success: true,
      address: searchQuery,
      fields: convertedFields,
      nestedFields: nestedFields,
      total_fields_found: totalFields,
      completion_percentage: completionPercentage,
      sources: sources,
      source_breakdown: sourceBreakdown,
      conflicts: arbitrationResult.conflicts,
      validation_failures: arbitrationResult.validationFailures,
      llm_quorum_fields: arbitrationResult.llmQuorumFields,
      single_source_warnings: arbitrationResult.singleSourceWarnings,
      llm_responses: llmResponses,
      strategy: 'arbitration_pipeline',
      cascade_order: ['perplexity', 'grok', 'claude-opus', 'gpt', 'claude-sonnet', 'gemini']
    });
  } catch (error) {
    console.error('=== SEARCH ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', (error as Error).stack);
    return res.status(500).json({
      error: 'Failed to search property',
      details: String(error),
      message: (error as Error).message,
    });
  }
}

