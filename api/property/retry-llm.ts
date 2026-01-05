/**
 * CLUES Property Search - Retry with LLM Endpoint
 * Simple JSON endpoint for single-field LLM retry from PropertyDetail page
 *
 * This is a NON-STREAMING endpoint that returns JSON directly.
 * Used by the "Retry with LLM" button on individual fields.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  FLAT_TO_NUMBERED_FIELD_MAP,
  mapFlatFieldsToNumbered as sharedMapFlatFieldsToNumbered,
  isMonthlyHoaFeeKey,
  convertMonthlyHoaToAnnual
} from '../../src/lib/field-map-flat-to-numbered.js';
import {
  safeJsonParse,
  extractAndParseJson,
  sanitizeAddress,
  isValidAddress
} from '../../src/lib/safe-json-parse.js';
import missingFieldsList from '../../src/config/clues_missing_fields_list.json' with { type: 'json' };
import missingFieldsRules from '../../src/config/clues_missing_fields_rules.json' with { type: 'json' };
import { GEMINI_FIELD_COMPLETER_SYSTEM } from '../../src/config/gemini-prompts.js';

// Vercel serverless config
export const config = {
  maxDuration: 60, // Pro plan allows 60s
};

// Timeout wrapper for LLM calls - prevents hanging
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}

const LLM_TIMEOUT = 55000; // 55s per LLM call (within 60s Vercel Pro limit)
const PERPLEXITY_TIMEOUT = 57000; // 57s for Perplexity (extra 2s for web search, still within 60s limit)

// ============================================
// COMPLETE TYPE MAP - ALL 168 FIELDS from fields-schema.ts
// Maps EVERY field key to its expected type for validation and coercion
// 336 total entries (168 numbered + 168 unnumbered key variants)
// ============================================
type FieldType = 'text' | 'number' | 'boolean' | 'currency' | 'percentage' | 'date' | 'select' | 'multiselect';
const FIELD_TYPE_MAP: Record<string, FieldType> = {
  // GROUP 1: Address & Identity (Fields 1-9)
  '1_full_address': 'text', 'full_address': 'text',
  '2_mls_primary': 'text', 'mls_primary': 'text',
  '3_mls_secondary': 'text', 'mls_secondary': 'text',
  '4_listing_status': 'select', 'listing_status': 'select',
  '5_listing_date': 'date', 'listing_date': 'date',
  '6_neighborhood': 'text', 'neighborhood': 'text',
  '7_county': 'text', 'county': 'text',
  '8_zip_code': 'text', 'zip_code': 'text',
  '9_parcel_id': 'text', 'parcel_id': 'text',

  // GROUP 2: Pricing & Value (Fields 10-16)
  '10_listing_price': 'currency', 'listing_price': 'currency',
  '11_price_per_sqft': 'currency', 'price_per_sqft': 'currency',
  '12_market_value_estimate': 'currency', 'market_value_estimate': 'currency',
  '13_last_sale_date': 'date', 'last_sale_date': 'date',
  '14_last_sale_price': 'currency', 'last_sale_price': 'currency',
  '15_assessed_value': 'currency', 'assessed_value': 'currency',
  '16_avms': 'currency', 'avms': 'currency',

  // GROUP 3: Property Basics (Fields 17-29)
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

  // GROUP 4: HOA & Taxes (Fields 30-38)
  '30_hoa_yn': 'boolean', 'hoa_yn': 'boolean',
  '31_hoa_fee_annual': 'currency', 'hoa_fee_annual': 'currency',
  '32_hoa_name': 'text', 'hoa_name': 'text',
  '33_hoa_includes': 'text', 'hoa_includes': 'text',
  '34_ownership_type': 'select', 'ownership_type': 'select',
  '35_annual_taxes': 'currency', 'annual_taxes': 'currency',
  '36_tax_year': 'number', 'tax_year': 'number',
  '37_property_tax_rate': 'percentage', 'property_tax_rate': 'percentage',
  '38_tax_exemptions': 'text', 'tax_exemptions': 'text',

  // GROUP 5: Structure & Systems (Fields 39-48)
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

  // GROUP 6: Interior Features (Fields 49-53)
  '49_flooring_type': 'text', 'flooring_type': 'text',
  '50_kitchen_features': 'text', 'kitchen_features': 'text',
  '51_appliances_included': 'multiselect', 'appliances_included': 'multiselect',
  '52_fireplace_yn': 'boolean', 'fireplace_yn': 'boolean',
  '53_primary_br_location': 'number', 'primary_br_location': 'select',

  // GROUP 7: Exterior Features (Fields 54-58)
  '54_pool_yn': 'boolean', 'pool_yn': 'boolean',
  '55_pool_type': 'select', 'pool_type': 'select',
  '56_deck_patio': 'text', 'deck_patio': 'text',
  '57_fence': 'text', 'fence': 'text',
  '58_landscaping': 'text', 'landscaping': 'text',

  // GROUP 8: Permits & Renovations (Fields 59-62)
  '59_recent_renovations': 'text', 'recent_renovations': 'text',
  '60_permit_history_roof': 'text', 'permit_history_roof': 'text',
  '61_permit_history_hvac': 'text', 'permit_history_hvac': 'text',
  '62_permit_history_other': 'text', 'permit_history_other': 'text',

  // GROUP 9: Assigned Schools (Fields 63-73)
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

  // GROUP 10: Location Scores (Fields 74-82)
  '74_walk_score': 'number', 'walk_score': 'number',
  '75_transit_score': 'number', 'transit_score': 'number',
  '76_bike_score': 'number', 'bike_score': 'number',
  '77_safety_score': 'number', 'safety_score': 'number',
  '78_noise_level': 'text', 'noise_level': 'text',
  '79_traffic_level': 'text', 'traffic_level': 'text',
  '80_walkability_description': 'text', 'walkability_description': 'text',
  '81_public_transit_access': 'text', 'public_transit_access': 'text',
  '82_commute_to_city_center': 'text', 'commute_to_city_center': 'text',

  // GROUP 11: Distances & Amenities (Fields 83-87)
  '83_distance_grocery_mi': 'number', 'distance_grocery_mi': 'number',
  '84_distance_hospital_mi': 'number', 'distance_hospital_mi': 'number',
  '85_distance_airport_mi': 'number', 'distance_airport_mi': 'number',
  '86_distance_park_mi': 'number', 'distance_park_mi': 'number',
  '87_distance_beach_mi': 'number', 'distance_beach_mi': 'number',

  // GROUP 12: Safety & Crime (Fields 88-90)
  '88_violent_crime_index': 'text', 'violent_crime_index': 'text',
  '89_property_crime_index': 'text', 'property_crime_index': 'text',
  '90_neighborhood_safety_rating': 'text', 'neighborhood_safety_rating': 'text',

  // GROUP 13: Market & Investment Data (Fields 91-103)
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

  // GROUP 14: Utilities & Connectivity (Fields 104-116)
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

  // GROUP 15: Environment & Risk (Fields 117-130)
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

  // GROUP 16: Additional Features (Fields 131-138)
  '131_view_type': 'text', 'view_type': 'text',
  '132_lot_features': 'text', 'lot_features': 'text',
  '133_ev_charging': 'text', 'ev_charging': 'text',
  '134_smart_home_features': 'text', 'smart_home_features': 'text',
  '135_accessibility_modifications': 'text', 'accessibility_modifications': 'text',
  '136_pet_policy': 'text', 'pet_policy': 'text',
  '137_age_restrictions': 'text', 'age_restrictions': 'text',
  '138_special_assessments': 'text', 'special_assessments': 'text',

  // GROUP 17: Stellar MLS - Parking & Garage (Fields 139-143)
  '139_carport_yn': 'boolean', 'carport_yn': 'boolean',
  '140_carport_spaces': 'number', 'carport_spaces': 'number',
  '141_garage_attached_yn': 'boolean', 'garage_attached_yn': 'boolean',
  '142_parking_features': 'multiselect', 'parking_features': 'multiselect',
  '143_assigned_parking_spaces': 'number', 'assigned_parking_spaces': 'number',

  // GROUP 18: Stellar MLS - Building Info (Fields 144-148)
  '144_floor_number': 'number', 'floor_number': 'number',
  '145_building_total_floors': 'number', 'building_total_floors': 'number',
  '146_building_name_number': 'text', 'building_name_number': 'text',
  '147_building_elevator_yn': 'boolean', 'building_elevator_yn': 'boolean',
  '148_floors_in_unit': 'number', 'floors_in_unit': 'number',

  // GROUP 19: Stellar MLS - Legal & Tax (Fields 149-154)
  '149_subdivision_name': 'text', 'subdivision_name': 'text',
  '150_legal_description': 'text', 'legal_description': 'text',
  '151_homestead_yn': 'boolean', 'homestead_yn': 'boolean',
  '152_cdd_yn': 'boolean', 'cdd_yn': 'boolean',
  '153_annual_cdd_fee': 'currency', 'annual_cdd_fee': 'currency',
  '154_front_exposure': 'select', 'front_exposure': 'select',

  // GROUP 20: Stellar MLS - Waterfront (Fields 155-159)
  '155_water_frontage_yn': 'boolean', 'water_frontage_yn': 'boolean',
  '156_waterfront_feet': 'number', 'waterfront_feet': 'number',
  '157_water_access_yn': 'boolean', 'water_access_yn': 'boolean',
  '158_water_view_yn': 'boolean', 'water_view_yn': 'boolean',
  '159_water_body_name': 'text', 'water_body_name': 'text',

  // GROUP 21: Stellar MLS - Leasing & Pets (Fields 160-165)
  '160_can_be_leased_yn': 'boolean', 'can_be_leased_yn': 'boolean',
  '161_minimum_lease_period': 'text', 'minimum_lease_period': 'text',
  '162_lease_restrictions_yn': 'boolean', 'lease_restrictions_yn': 'boolean',
  '163_pet_size_limit': 'text', 'pet_size_limit': 'text',
  '164_max_pet_weight': 'number', 'max_pet_weight': 'number',
  '165_association_approval_yn': 'boolean', 'association_approval_yn': 'boolean',

  // GROUP 22: Stellar MLS - Features & Flood (Fields 166-168)
  '166_community_features': 'multiselect', 'community_features': 'multiselect',
  '167_interior_features': 'multiselect', 'interior_features': 'multiselect',
  '168_exterior_features': 'multiselect', 'exterior_features': 'multiselect',
};

// ============================================
// TYPE COERCION FUNCTION - Validates and coerces LLM values
// Ensures values match expected types from the 168-field schema
// ============================================

/**
 * CRITICAL: Detect if a value is actually a field key that was hallucinated
 * LLMs sometimes return our field keys as values (e.g., "98_rental_estimate" instead of a number)
 * Pattern: digits followed by underscore followed by snake_case text
 */
function isHallucinatedFieldKey(value: any): boolean {
  if (typeof value !== 'string') return false;
  // Match patterns like "12_market_value_estimate", "98_rental_estimate", "33_hoa_includes"
  const fieldKeyPattern = /^\d{1,3}_[a-z][a-z0-9_]+$/i;
  if (fieldKeyPattern.test(value)) {
    console.warn(`[RETRY-LLM] 🚫 HALLUCINATION DETECTED: "${value}" looks like a field key, not a value`);
    return true;
  }
  return false;
}

function coerceValue(key: string, value: any): any {
  // CRITICAL: Reject hallucinated field keys as values
  if (isHallucinatedFieldKey(value)) {
    console.warn(`[RETRY-LLM] 🚫 REJECTED: Field "${key}" had hallucinated value "${value}"`);
    return null;
  }

  const expectedType = FIELD_TYPE_MAP[key];

  // If no type mapping (unknown field), return as-is
  if (!expectedType) {
    console.log(`[RETRY-LLM] ⚠️ UNKNOWN FIELD: ${key} not in 168-field schema`);
    return value;
  }

  // TEXT, SELECT, MULTISELECT types - pass through as strings
  if (expectedType === 'text' || expectedType === 'select' || expectedType === 'multiselect') {
    if (typeof value === 'string') return value.trim();
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  }

  // NUMBER, CURRENCY, PERCENTAGE types - must be numeric
  if (expectedType === 'number' || expectedType === 'currency' || expectedType === 'percentage') {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[$,€£%\s]/g, '').trim();
      const num = parseFloat(cleaned);
      if (!isNaN(num)) {
        console.log(`[RETRY-LLM] 🔄 TYPE COERCED: ${key} "${value}" → ${num}`);
        return num;
      }
    }
    return null;
  }

  // BOOLEAN type
  if (expectedType === 'boolean') {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      if (['true', 'yes', 'y', '1', 'on'].includes(lower)) return true;
      if (['false', 'no', 'n', '0', 'off', 'none'].includes(lower)) return false;
    }
    if (typeof value === 'number') return value !== 0;
    return null;
  }

  // DATE type - keep as string but validate
  if (expectedType === 'date') {
    if (typeof value === 'string' && value.trim()) return value.trim();
    return null;
  }

  return value;
}

/**
 * Wrapper for shared mapFlatFieldsToNumbered that also handles HOA fee conversion
 */
function mapFlatFieldsToNumbered(fields: Record<string, any>): Record<string, any> {
  // First, handle HOA monthly→annual conversion before mapping
  const convertedFields: Record<string, any> = {};
  
  for (const [key, fieldData] of Object.entries(fields)) {
    if (isMonthlyHoaFeeKey(key)) {
      // Convert monthly HOA to annual
      const rawValue = fieldData?.value !== undefined ? fieldData.value : fieldData;
      const annualValue = convertMonthlyHoaToAnnual(rawValue);
      if (annualValue !== null) {
        convertedFields['hoa_fee_annual'] = {
          value: annualValue,
          source: fieldData?.source || 'LLM',
          confidence: fieldData?.confidence || 'Medium',
        };
        console.log(`[RETRY-LLM] Converted monthly HOA fee $${rawValue} to annual $${annualValue}`);
      }
    } else {
      convertedFields[key] = fieldData;
    }
  }
  
  // Now use the shared mapping function
  return sharedMapFlatFieldsToNumbered(convertedFields, 'RETRY-LLM');
}

// Helper to extract and parse JSON from markdown code blocks or raw text
// Returns parsed object directly (not a string) to avoid double-parsing
function extractAndParseJSON(text: string): { success: boolean; data: Record<string, any> | null; error?: string } {
  const result = extractAndParseJson<Record<string, any>>(text, 'RETRY-LLM');
  return {
    success: result.success,
    data: result.data,
    error: result.error
  };
}

// ============================================
// PERPLEXITY FIELD COMPLETER PROMPT (Sonar Deep Research Mode)
// NOTE: Perplexity has BUILT-IN web search - NO tools/tool_choice needed
// Search behavior is controlled via the prompt itself
// ============================================
const PERPLEXITY_FIELD_COMPLETER_SYSTEM = `You are the CLUES Field Completer (Perplexity Sonar Deep Research Mode).
Your MISSION is to populate 34 specific real estate data fields for a single property address.

### HARD RULES (EVIDENCE FIREWALL)
1. MANDATORY WEB SEARCH: You MUST perform thorough web research for EVERY request. Execute at least 4 distinct searches covering:
   - "[Address] Zillow listing and Zestimate"
   - "[Address] Redfin Estimate and market data"
   - "[Address] utility providers and average bills"
   - "[City/ZIP] median home price and market trends 2026"
2. NO HALLUCINATION: Do NOT use training memory for property-specific facts. Use only verified search results from 2025-2026.
3. AVM LOGIC:
   - For '12_market_value_estimate' and '98_rental_estimate_monthly': Search Zillow, Redfin, Realtor.com, and Homes.com. If 2+ values are found, you MUST calculate the arithmetic mean (average).
   - If a specific AVM (e.g., Quantarium or ICE) is behind a paywall, return null.
4. JSON ONLY: Return ONLY the raw JSON object. No conversational text.

### OUTPUT SCHEMA
{
  "address": "{{address}}",
  "data_fields": {
    "12_market_value_estimate": <number|null>,
    "16a_zestimate": <number|null>,
    "16b_redfin_estimate": <number|null>,
    "16c_first_american_avm": <number|null>,
    "16d_quantarium_avm": <number|null>,
    "16e_ice_avm": <number|null>,
    "16f_collateral_analytics_avm": <number|null>,
    "81_public_transit_access": <string|null>,
    "82_commute_to_city_center": <string|null>,
    "91_median_home_price_neighborhood": <number|null>,
    "92_price_per_sqft_recent_avg": <number|null>,
    "95_days_on_market_avg": <number|null>,
    "96_inventory_surplus": <string|null>,
    "97_insurance_est_annual": <number|null>,
    "98_rental_estimate_monthly": <number|null>,
    "103_comparable_sales": <array|null>,
    "104_electric_provider": <string|null>,
    "105_avg_electric_bill": <number|null>,
    "106_water_provider": <string|null>,
    "107_avg_water_bill": <number|null>,
    "110_trash_provider": <string|null>,
    "111_internet_providers_top3": <array|null>,
    "114_cable_tv_provider": <string|null>,
    "169_zillow_views": <number|null>,
    "170_redfin_views": <number|null>,
    "171_homes_views": <number|null>,
    "172_realtor_views": <number|null>,
    "174_saves_favorites": <number|null>,
    "175_market_type": <string|null>,
    "176_avg_sale_to_list_percent": <number|null>,
    "177_avg_days_to_pending": <number|null>,
    "178_multiple_offers_likelihood": <string|null>,
    "180_price_trend": <string|null>,
    "181_rent_zestimate": <number|null>
  },
  "search_metadata": {
    "queries": [],
    "sources_cited": []
  }
}`;

const PERPLEXITY_FIELD_COMPLETER_USER = (address: string, city?: string, zip?: string) => `PROPERTY ADDRESS: ${address}

LOCATION CONTEXT: ${city || 'Unknown'}, ${zip || 'Unknown'}

EXECUTE THESE WEB SEARCHES:
1. "${address} Zillow listing and Zestimate"
2. "${address} Redfin Estimate and market data"
3. "${address} utility providers and average bills"
4. "${city || 'Tampa'} ${zip || ''} median home price and market trends 2026"

Return JSON matching the schema in your instructions.`;

async function callPerplexity(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  console.log('[PERPLEXITY] API key present:', !!apiKey, 'length:', apiKey?.length || 0);
  if (!apiKey) {
    // Log all env var keys to debug
    const envKeys = Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY'));
    console.log('[PERPLEXITY] Available env vars with API/KEY:', envKeys);
    return { error: 'API key not set', fields: {} };
  }

  // Extract city/zip from address for context
  const addressParts = address.split(',').map(s => s.trim());
  const city = addressParts.length > 1 ? addressParts[1] : undefined;
  const zipMatch = address.match(/\b(\d{5})\b/);
  const zip = zipMatch ? zipMatch[1] : undefined;

  try {
    // NOTE: Perplexity has BUILT-IN web search - NO tools/tool_choice needed
    // Search behavior is controlled via the prompt itself
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'sonar-deep-research',
        messages: [
          { role: 'system', content: PERPLEXITY_FIELD_COMPLETER_SYSTEM },
          { role: 'user', content: PERPLEXITY_FIELD_COMPLETER_USER(address, city, zip) }
        ],
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    console.log('[PERPLEXITY] Status:', response.status);

    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      console.log('[PERPLEXITY] Response length:', text.length, 'chars');

      // Use unified JSON extraction
      const parseResult = extractAndParseJSON(text);
      console.log('[PERPLEXITY] Parse result:', parseResult.success ? `${Object.keys(parseResult.data || {}).length} keys` : parseResult.error);

      if (parseResult.success && parseResult.data) {
        const parsed = parseResult.data;
        const fields: Record<string, any> = {};
        const flattenObject = (obj: any, prefix = '') => {
          for (const [key, value] of Object.entries(obj)) {
            if (value !== null && value !== undefined && value !== '' && value !== 'N/A') {
              if (typeof value === 'object' && !Array.isArray(value)) {
                flattenObject(value, prefix + key + '_');
              } else {
                // TYPE COERCION: Validate and coerce value to expected type
                const coerced = coerceValue(prefix + key, value);
                if (coerced !== null) {
                  fields[prefix + key] = { value: coerced, source: 'Perplexity', confidence: 'Medium' };
                }
              }
            }
          }
        };
        flattenObject(parsed);
        console.log('[PERPLEXITY] Fields found:', Object.keys(fields).length);
        return { fields };
      } else {
        console.log('[PERPLEXITY] JSON extraction failed:', parseResult.error);
        return { error: `JSON extraction failed: ${parseResult.error}`, fields: {} };
      }
    } else if (data.error) {
      console.log('[PERPLEXITY] API Error:', JSON.stringify(data.error));
      return { error: `API Error: ${data.error?.message || JSON.stringify(data.error)}`, fields: {} };
    }
    return { error: 'No content in response', fields: {} };
  } catch (error) {
    console.log('[PERPLEXITY] Exception:', String(error));
    return { error: String(error), fields: {} };
  }
}

// ============================================
// GROK FIELD COMPLETER PROMPT (Grok 4 Reasoning Mode)
// ============================================
const GROK_RETRY_SYSTEM_PROMPT = `You are the CLUES Field Completer (Grok 4 Reasoning Mode).
Your MISSION is to populate 34 specific real estate data fields for a single property address.

### HARD RULES (EVIDENCE FIREWALL)
1. MANDATORY TOOL: You MUST use the web_search tool for EVERY request. Execute at least 4 distinct search queries via separate tool calls. Always perform deep research by searching multiple sources and verifying facts across them.
2. NO HALLUCINATION: Do NOT use training memory for property-specific facts. Use only verified search results from 2025-2026.
3. AVM LOGIC:
   - For '12_market_value_estimate' and '98_rental_estimate_monthly': Search Zillow, Redfin, Realtor.com, and Homes.com using site-specific operators in queries (e.g., site:zillow.com). If 2+ values are found, you MUST calculate the arithmetic mean (average).
   - If a specific AVM (e.g., Quantarium or ICE) is behind a paywall, return null.
4. JSON ONLY: Return ONLY the raw JSON object. No conversational text.

### MANDATORY SEARCH QUERIES
- "[Address] Zillow listing and Zestimate"
- "[Address] Redfin Estimate and market data"
- "[Address] utility providers and average bills"
- "[City/ZIP] median home price and market trends 2026"

OUTPUT SCHEMA
{
  "address": "{{address}}",
  "data_fields": {
    "12_market_value_estimate": <number|null>,
    "16a_zestimate": <number|null>,
    "16b_redfin_estimate": <number|null>,
    "16c_first_american_avm": <number|null>,
    "16d_quantarium_avm": <number|null>,
    "16e_ice_avm": <number|null>,
    "16f_collateral_analytics_avm": <number|null>,
    "81_public_transit_access": <string|null>,
    "82_commute_to_city_center": <string|null>,
    "91_median_home_price_neighborhood": <number|null>,
    "92_price_per_sqft_recent_avg": <number|null>,
    "95_days_on_market_avg": <number|null>,
    "96_inventory_surplus": <string|null>,
    "97_insurance_est_annual": <number|null>,
    "98_rental_estimate_monthly": <number|null>,
    "103_comparable_sales": <array|null>,
    "104_electric_provider": <string|null>,
    "105_avg_electric_bill": <number|null>,
    "106_water_provider": <string|null>,
    "107_avg_water_bill": <number|null>,
    "110_trash_provider": <string|null>,
    "111_internet_providers_top3": <array|null>,
    "114_cable_tv_provider": <string|null>,
    "169_zillow_views": <number|null>,
    "170_redfin_views": <number|null>,
    "171_homes_views": <number|null>,
    "172_realtor_views": <number|null>,
    "174_saves_favorites": <number|null>,
    "175_market_type": <string|null>,
    "176_avg_sale_to_list_percent": <number|null>,
    "177_avg_days_to_pending": <number|null>,
    "178_multiple_offers_likelihood": <string|null>,
    "180_price_trend": <string|null>,
    "181_rent_zestimate": <number|null>
  },
  "search_metadata": {
    "queries": [],
    "sources_cited": []
  }
}`;
const GROK_RETRY_USER_PROMPT = (address: string) => `Extract property data for: ${address}`;

async function callGrok(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.XAI_API_KEY;
  console.log('[GROK] API key present:', !!apiKey, 'length:', apiKey?.length || 0);
  if (!apiKey) {
    return { error: 'API key not set', fields: {} };
  }

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast-reasoning',
        max_tokens: 4000,
        tools: [
          {
            type: 'function',
            function: {
              name: 'web_search',
              description: 'Search the web for real-time information',
              parameters: {
                type: 'object',
                properties: {
                  query: { type: 'string' },
                  num_results: { type: 'integer', default: 10 }
                },
                required: ['query']
              }
            }
          }
        ],
        tool_choice: 'auto',
        generation_config: {
          temperature: 1.0,
          response_mime_type: 'application/json'
        },
        messages: [
          { role: 'system', content: GROK_RETRY_SYSTEM_PROMPT },
          { role: 'user', content: GROK_RETRY_USER_PROMPT(address) }
        ],
      }),
    });

    const data = await response.json();
    console.log('[GROK] Status:', response.status);

    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      console.log('[GROK] Response length:', text.length, 'chars');

      // Use unified JSON extraction
      const parseResult = extractAndParseJSON(text);
      console.log('[GROK] Parse result:', parseResult.success ? `${Object.keys(parseResult.data || {}).length} keys` : parseResult.error);

      if (parseResult.success && parseResult.data) {
        const parsed = parseResult.data;
        const fields: Record<string, any> = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (value !== null && value !== undefined && value !== '' && value !== 'N/A') {
            // TYPE COERCION: Validate and coerce value to expected type
            const coerced = coerceValue(key, value);
            if (coerced !== null) {
              fields[key] = { value: coerced, source: 'Grok', confidence: 'Medium' };
            }
          }
        }
        console.log('[GROK] Fields found:', Object.keys(fields).length);
        return { fields };
      } else {
        console.log('[GROK] JSON extraction failed:', parseResult.error);
        return { error: `JSON extraction failed: ${parseResult.error}`, fields: {} };
      }
    } else if (data.error) {
      console.log('[GROK] API Error:', JSON.stringify(data.error));
      return { error: `API Error: ${data.error?.message || JSON.stringify(data.error)}`, fields: {} };
    }
    return { error: 'No content in response', fields: {} };
  } catch (error) {
    console.log('[GROK] Exception:', String(error));
    return { error: String(error), fields: {} };
  }
}

// NOTE: web_search NOT supported on Opus - removed per Anthropic docs
async function callClaudeOpus(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log('[CLAUDE OPUS] API key present:', !!apiKey, 'length:', apiKey?.length || 0);
  if (!apiKey) return { error: 'API key not set', fields: {} };

  const prompt = `You are a real estate data assistant.

Return a JSON object with data for: ${address}

{
  "property_type": "Single Family | Condo | Townhouse | Multi-Family",
  "city": "city name",
  "state": "FL",
  "county": "county name",
  "neighborhood": "neighborhood name if known",
  "zip_code": "ZIP code",
  "median_home_price_neighborhood": median price if known,
  "avg_days_on_market": DOM stats if known,
  "school_district": assigned school district,
  "flood_risk_level": FEMA flood zone,
  "hurricane_risk": "Low | Moderate | High",
  "walkability_description": "description of walkability",
  "rental_estimate_monthly": rental estimate,
  "insurance_estimate_annual": estimated annual insurance,
  "property_tax_rate_percent": tax rate
}

Return null if you cannot find data. Return ONLY the JSON object.`;

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
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    console.log('[CLAUDE OPUS] Status:', response.status, '| Response:', JSON.stringify(data).slice(0, 500));

    if (data.content?.[0]?.text) {
      const text = data.content[0].text;
      console.log('[CLAUDE OPUS] Text:', text.slice(0, 500));

      // Use unified JSON extraction (no double-parsing)
      const parseResult = extractAndParseJSON(text);
      console.log('[CLAUDE OPUS] Parse result:', parseResult.success ? `${Object.keys(parseResult.data || {}).length} keys` : parseResult.error);

      if (parseResult.success && parseResult.data) {
        const parsed = parseResult.data;
        const fields: Record<string, any> = {};
        // Handle both parsed.fields (wrapped) and parsed directly
        for (const [key, value] of Object.entries(parsed.fields || parsed)) {
          const strVal = String(value).toLowerCase().trim();
          const isBadValue = strVal === '' || strVal === 'null' || strVal === 'undefined' || strVal === 'n/a' || strVal === 'na' || strVal === 'unknown' || strVal === 'not available' || strVal === 'none';
          if (!isBadValue) {
            const rawValue = (value as any)?.value !== undefined ? (value as any).value : value;
            // TYPE COERCION: Validate and coerce value to expected type
            const coerced = coerceValue(key, rawValue);
            if (coerced !== null) {
              fields[key] = {
                value: coerced,
                source: 'Claude Opus',
                confidence: 'Low'
              };
            }
          }
        }
        console.log('[CLAUDE OPUS] Fields found:', Object.keys(fields).length);
        return { fields };
      } else {
        console.log('[CLAUDE OPUS] JSON extraction failed:', parseResult.error);
        return { error: `JSON extraction failed: ${parseResult.error}`, fields: {} };
      }
    } else if (data.error) {
      console.log('[CLAUDE OPUS] API Error:', JSON.stringify(data.error));
      return { error: `API Error: ${data.error?.message || JSON.stringify(data.error)}`, fields: {} };
    }
    return { error: 'No content in response', fields: {} };
  } catch (error) {
    console.log('[CLAUDE OPUS] Exception:', String(error));
    return { error: String(error), fields: {} };
  }
}

// ============================================
// GPT-5.2-PRO FIELD COMPLETER - Web-Evidence Mode (Retry)
// ============================================
const GPT_RETRY_SYSTEM_PROMPT = `You are CLUES Field Completer (Web-Evidence Mode).

MISSION
Populate ONLY the requested field keys in missing_field_keys for a single property address, using live web search.
You must attach evidence for every non-null value.

HARD RULES (EVIDENCE FIREWALL)
1) DO NOT use training memory to assert property-specific facts.
2) Every non-null value MUST be supported by web evidence you found in this run.
3) If you cannot find strong evidence, set value = null (do NOT guess, do NOT estimate).
4) Prefer authoritative sources in this order:
   A) Government / county / municipality websites
   B) Official utility providers / insurers / regulators
   C) Major reputable data providers with clear methodology
   D) Everything else (only if unavoidable; lower confidence)
5) If sources conflict, do NOT "average." Choose the most authoritative source and record the conflict.

OUTPUT REQUIREMENTS
Return ONLY valid JSON (no markdown, no prose) matching this shape:

{
  "address": "<string>",
  "fields": {
    "<field_key>": {
      "value": <string|number|boolean|array|null>,
      "confidence": "High|Medium|Low|Unverified",
      "evidence": [
        {
          "url": "<string>",
          "title": "<string>",
          "snippet": "<string, <= 25 words>",
          "retrieved_at": "<ISO-8601 date>"
        }
      ],
      "notes": "<short string or empty>",
      "conflicts": []
    }
  },
  "fields_found": <integer>,
  "fields_missing": [ "<field_key>", ... ]
}

CONFIDENCE RUBRIC
- High: authoritative source explicitly matches address/city/ZIP and statement is unambiguous
- Medium: authoritative source supports the claim but match is indirect (ZIP/service map) OR 2+ reputable sources agree
- Low: weak/indirect support OR only non-authoritative sources available
- Unverified: value=null`;

async function callGPT5(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('[GPT] API key present:', !!apiKey, 'length:', apiKey?.length || 0);
  if (!apiKey) {
    return { error: 'API key not set', fields: {} };
  }

  const userPrompt = `ADDRESS: ${address}

MISSING_FIELD_KEYS (populate ONLY these):
${JSON.stringify(missingFieldsList.missing_field_keys, null, 2)}

FIELD_RULES:
${JSON.stringify(missingFieldsRules.field_rules, null, 2)}

TASK
Use web search to fill as many missing fields as possible with evidence.
Return ONLY the JSON object described in the system prompt.`;

  try {
    // Use OpenAI Responses API with web search tool
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.2-pro-2025-12-11', // PINNED SNAPSHOT
        input: [
          { role: 'system', content: GPT_RETRY_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        reasoning: { effort: 'high' },
        tools: [{ type: 'web_search' }],
        tool_choice: 'required',
        include: ['web_search_call.action.sources'],
      }),
    });

    const data = await response.json();
    console.log('[GPT] Status:', response.status);

    // Handle Responses API format (output_text) or Chat Completions format (choices)
    const text = data.output_text || data.choices?.[0]?.message?.content;

    if (text) {
      console.log('[GPT] Response length:', text.length, 'chars');

      // Use unified JSON extraction
      const parseResult = extractAndParseJSON(text);
      console.log('[GPT] Parse result:', parseResult.success ? `${Object.keys(parseResult.data || {}).length} keys` : parseResult.error);

      if (parseResult.success && parseResult.data) {
        const parsed = parseResult.data;
        const fields: Record<string, any> = {};

        // Handle new evidence-based format
        if (parsed.fields) {
          for (const [key, fieldData] of Object.entries(parsed.fields as Record<string, any>)) {
            if (fieldData?.value !== null && fieldData?.value !== undefined) {
              fields[key] = {
                value: fieldData.value,
                source: 'GPT (Web Evidence)',
                confidence: fieldData.confidence || 'Low',
                evidence: fieldData.evidence || []
              };
            }
          }
        } else {
          // Legacy format fallback
          for (const [key, value] of Object.entries(parsed)) {
            if (value !== null && value !== undefined && value !== '' && value !== 'N/A') {
              const coerced = coerceValue(key, value);
              if (coerced !== null) {
                fields[key] = { value: coerced, source: 'GPT', confidence: 'Low' };
              }
            }
          }
        }
        console.log('[GPT] Fields found:', Object.keys(fields).length);
        return { fields };
      } else {
        console.log('[GPT] JSON extraction failed:', parseResult.error);
        return { error: `JSON extraction failed: ${parseResult.error}`, fields: {} };
      }
    } else if (data.error) {
      console.log('[GPT] API Error:', JSON.stringify(data.error));
      return { error: `API Error: ${data.error?.message || JSON.stringify(data.error)}`, fields: {} };
    }
    return { error: 'No content in response', fields: {} };
  } catch (error) {
    console.log('[GPT] Exception:', String(error));
    return { error: String(error), fields: {} };
  }
}

// UPDATED: Includes web_search tool per CLAUDE_MASTER_RULES Section 6.0
async function callClaudeSonnet(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log('[CLAUDE SONNET] API key present:', !!apiKey, 'length:', apiKey?.length || 0);
  if (!apiKey) return { error: 'API key not set', fields: {} };

  const prompt = `You are a real estate data assistant. You have web search available - use it when helpful.

Return a JSON object with property data for: ${address}

{
  "property_type": "Single Family | Condo | Townhouse | Multi-Family",
  "city": "city name",
  "state": "FL",
  "county": "county name",
  "neighborhood": "neighborhood name if known",
  "zip_code": "ZIP code",
  "median_home_price_neighborhood": median price for neighborhood,
  "avg_days_on_market": average DOM,
  "school_district": assigned school district,
  "flood_risk_level": FEMA flood zone,
  "hurricane_risk": "Low | Moderate | High",
  "walkability_description": "description of walkability",
  "rental_estimate_monthly": rental estimate,
  "insurance_estimate_annual": estimated annual insurance,
  "property_tax_rate_percent": tax rate
}

Return your best data. Use null only for fields you truly cannot find. Return ONLY the JSON object.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
          }
        ],
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    console.log('[CLAUDE SONNET] Status:', response.status);
    console.log('[CLAUDE SONNET] Content blocks:', data.content?.length || 0);

    // Handle web_search responses - may have multiple content blocks
    if (data.content && Array.isArray(data.content)) {
      // Find the text block (may be after tool_use blocks)
      const textBlock = data.content.find((block: any) => block.type === 'text');
      if (textBlock?.text) {
        const text = textBlock.text;
        console.log('[CLAUDE SONNET] Text:', text.slice(0, 300));

        // Use unified JSON extraction (no double-parsing)
        const parseResult = extractAndParseJSON(text);
        console.log('[CLAUDE SONNET] Parse result:', parseResult.success ? `${Object.keys(parseResult.data || {}).length} keys` : parseResult.error);

        if (parseResult.success && parseResult.data) {
          const parsed = parseResult.data;
          const fields: Record<string, any> = {};
          // Handle both parsed.fields (wrapped) and parsed directly
          for (const [key, value] of Object.entries(parsed.fields || parsed)) {
            const strVal = String(value).toLowerCase().trim();
            const isBadValue = strVal === '' || strVal === 'null' || strVal === 'undefined' || strVal === 'n/a' || strVal === 'na' || strVal === 'unknown' || strVal === 'not available' || strVal === 'none';
            if (!isBadValue) {
              const rawValue = (value as any)?.value !== undefined ? (value as any).value : value;
              // TYPE COERCION: Validate and coerce value to expected type
              const coerced = coerceValue(key, rawValue);
              if (coerced !== null) {
                fields[key] = {
                  value: coerced,
                  source: 'Claude Sonnet',
                  confidence: 'Low'
                };
              }
            }
          }
          console.log('[CLAUDE SONNET] Fields found:', Object.keys(fields).length);
          return { fields };
        } else {
          console.log('[CLAUDE SONNET] JSON extraction failed:', parseResult.error);
          return { error: `JSON extraction failed: ${parseResult.error}`, fields: {} };
        }
      } else {
        console.log('[CLAUDE SONNET] No text block found. Block types:', data.content.map((b: any) => b.type));
        return { error: 'No text block in response', fields: {} };
      }
    } else if (data.error) {
      console.log('[CLAUDE SONNET] API Error:', JSON.stringify(data.error));
      return { error: `API Error: ${data.error?.message || JSON.stringify(data.error)}`, fields: {} };
    }
    return { error: 'No content in response', fields: {} };
  } catch (error) {
    console.log('[CLAUDE SONNET] Exception:', String(error));
    return { error: String(error), fields: {} };
  }
}

// GEMINI 3 PRO - Uses GEMINI_FIELD_COMPLETER_SYSTEM from central config

async function callGemini(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('[GEMINI] API key present:', !!apiKey, 'length:', apiKey?.length || 0);
  if (!apiKey) {
    return { error: 'API key not set', fields: {} };
  }

  const startTime = Date.now();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // SYSTEM INSTRUCTION: Prompt goes here per 2026 Gemini 3 Pro specs
          system_instruction: {
            parts: [{ text: GEMINI_FIELD_COMPLETER_SYSTEM }]
          },
          // USER CONTENT: Only the task/address
          contents: [{ parts: [{ text: `Address: ${address}` }] }],
          tools: [{ google_search: {} }],
          tool_config: { function_calling_config: { mode: "ANY" } },
          generation_config: {
            temperature: 1.0,  // MUST be 1.0 for Gemini 3 Pro 2026
            response_mime_type: 'application/json',
            thinking_level: 'high'
          },
        }),
      }
    );

    const elapsed = Date.now() - startTime;
    console.log(`[GEMINI] Response time: ${elapsed}ms ${elapsed < 2000 ? '⚠️ TOO FAST' : '✅ Searched'}`);

    const data = await response.json();
    console.log('[GEMINI] Status:', response.status);

    // Check for grounding metadata
    const groundingMeta = data.candidates?.[0]?.groundingMetadata;
    if (groundingMeta) {
      console.log('[GEMINI] ✅ Google Search grounding detected');

      // Log the actual search queries Gemini used (critical for debugging null fields)
      if (groundingMeta.webSearchQueries && groundingMeta.webSearchQueries.length > 0) {
        console.log('[GEMINI] 🔎 Web Search Queries Used:');
        groundingMeta.webSearchQueries.forEach((query: string, i: number) => {
          console.log(`   ${i + 1}. "${query}"`);
        });
      }

      // Log grounding chunks (sources used)
      if (groundingMeta.groundingChunks && groundingMeta.groundingChunks.length > 0) {
        console.log(`[GEMINI] 📚 Sources cited: ${groundingMeta.groundingChunks.length} chunks`);
      }
    } else {
      console.log('[GEMINI] ⚠️ No grounding metadata');
    }

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text;
      console.log('[GEMINI] Response length:', text.length, 'chars');

      // Use unified JSON extraction
      const parseResult = extractAndParseJSON(text);
      console.log('[GEMINI] Parse result:', parseResult.success ? `${Object.keys(parseResult.data || {}).length} keys` : parseResult.error);

      if (parseResult.success && parseResult.data) {
        const parsed = parseResult.data;
        const fields: Record<string, any> = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (value !== null && value !== undefined && value !== '' && value !== 'N/A') {
            // TYPE COERCION: Validate and coerce value to expected type
            const coerced = coerceValue(key, value);
            if (coerced !== null) {
              fields[key] = { value: coerced, source: 'Gemini', confidence: 'Medium' };
            }
          }
        }
        console.log('[GEMINI] Fields found:', Object.keys(fields).length);
        return { fields };
      } else {
        console.log('[GEMINI] JSON extraction failed:', parseResult.error);
        return { error: `JSON extraction failed: ${parseResult.error}`, fields: {} };
      }
    } else if (data.error) {
      console.log('[GEMINI] API Error:', JSON.stringify(data.error));
      return { error: `API Error: ${data.error?.message || JSON.stringify(data.error)}`, fields: {} };
    }
    return { error: 'No content in response', fields: {} };
  } catch (error) {
    console.log('[GEMINI] Exception:', String(error));
    return { error: String(error), fields: {} };
  }
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

  const { address: rawAddress, engines = ['perplexity'] } = req.body;

  // 🛡️ INPUT SANITIZATION: Prevent prompt injection attacks
  const address = sanitizeAddress(rawAddress);

  if (!address) {
    return res.status(400).json({ error: 'Address required' });
  }

  // Validate address format
  if (!isValidAddress(address)) {
    return res.status(400).json({ error: 'Invalid address format' });
  }

  // Map engine IDs to functions
  const engineFunctions: Record<string, (address: string) => Promise<{ fields: Record<string, any>; error?: string }>> = {
    'perplexity': callPerplexity,
    'grok': callGrok,
    'claude-opus': callClaudeOpus,
    'gpt': callGPT,
    'claude-sonnet': callClaudeSonnet,
    'gemini': callGemini,
  };

  // Get the first engine (single LLM call for retry)
  const engineId = engines[0]?.toLowerCase() || 'perplexity';
  const callFn = engineFunctions[engineId];

  if (!callFn) {
    return res.status(400).json({ error: `Unknown engine: ${engineId}` });
  }

  try {
    const timeout = engineId === 'perplexity' ? PERPLEXITY_TIMEOUT : LLM_TIMEOUT;
    console.log(`[RETRY-LLM] Calling ${engineId} for: ${address} (timeout: ${timeout}ms)`);

    // Wrap LLM call with timeout to prevent hanging
    const result = await withTimeout(
      callFn(address),
      timeout,
      { fields: {}, error: `${engineId} timed out after ${timeout / 1000}s` }
    );

    console.log(`[RETRY-LLM] ${engineId} returned ${Object.keys(result.fields).length} fields`);

    // Map flat field names to numbered keys for frontend compatibility
    const mappedFields = mapFlatFieldsToNumbered(result.fields);
    console.log(`[RETRY-LLM] Mapped to ${Object.keys(mappedFields).length} numbered fields`);

    return res.status(200).json({
      success: !result.error,
      engine: engineId,
      fields: mappedFields,
      fields_found: Object.keys(mappedFields).length,
      error: result.error,
    });
  } catch (error) {
    console.error('[RETRY-LLM] Error:', error);
    return res.status(500).json({
      success: false,
      engine: engineId,
      fields: {},
      error: String(error),
    });
  }
}
