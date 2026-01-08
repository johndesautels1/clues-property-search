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
// Inline JSON data to avoid Vercel import issues with `with { type: 'json' }` syntax
const missingFieldsList = {
  missing_field_keys: [
    "12_market_value_estimate", "16a_zestimate", "16b_redfin_estimate",
    "16c_first_american_avm", "16d_quantarium_avm", "16e_ice_avm", "16f_collateral_analytics_avm",
    "81_public_transit_access", "82_commute_to_city_center",
    "91_median_home_price_neighborhood", "92_price_per_sqft_recent_avg", "95_days_on_market_avg",
    "96_inventory_surplus", "97_insurance_est_annual", "98_rental_estimate_monthly",
    "103_comparable_sales", "104_electric_provider", "105_avg_electric_bill",
    "106_water_provider", "107_avg_water_bill", "110_trash_provider",
    "111_internet_providers_top3", "114_cable_tv_provider",
    "169_zillow_views", "170_redfin_views", "171_homes_views", "172_realtor_views",
    "174_saves_favorites", "175_market_type", "176_avg_sale_to_list_percent",
    "177_avg_days_to_pending", "178_multiple_offers_likelihood", "180_price_trend", "181_rent_zestimate"
  ]
};
const missingFieldsRules = {
  field_rules: {
    // AVMs & Market Values
    "12_market_value_estimate": { type: "number", definition: "Estimated market value in USD. Average of Zestimate and Redfin Estimate if both available." },
    "16a_zestimate": { type: "number", definition: "Zillow's Zestimate value in USD. Search 'site:zillow.com [address]'." },
    "16b_redfin_estimate": { type: "number", definition: "Redfin's estimate value in USD. Search 'site:redfin.com [address]'." },
    "16c_first_american_avm": { type: "number", definition: "First American AVM value in USD. Often behind paywall - return null if unavailable." },
    "16d_quantarium_avm": { type: "number", definition: "Quantarium AVM value in USD. Often behind paywall - return null if unavailable." },
    "16e_ice_avm": { type: "number", definition: "ICE (Intercontinental Exchange) AVM value in USD. Often behind paywall - return null if unavailable." },
    "16f_collateral_analytics_avm": { type: "number", definition: "Collateral Analytics AVM value in USD. Often behind paywall - return null if unavailable." },

    // Transit & Location
    "81_public_transit_access": { type: "string", definition: "Description of public transit options (bus routes, train stations) within 1 mile of property." },
    "82_commute_to_city_center": { type: "string", definition: "Estimated commute time to nearest major city center by car during rush hour." },

    // Market Statistics
    "91_median_home_price_neighborhood": { type: "number", definition: "Median home sale price in the neighborhood/ZIP code in USD. Search '[ZIP] median home price 2024 2025'." },
    "92_price_per_sqft_recent_avg": { type: "number", definition: "Average price per square foot for recent sales in the area in USD." },
    "95_days_on_market_avg": { type: "number", definition: "Average days on market for listings in this ZIP/neighborhood." },
    "96_inventory_surplus": { type: "string", definition: "Market inventory status: 'Buyer's Market' (>6 months inventory), 'Seller's Market' (<3 months), or 'Balanced' (3-6 months)." },
    "97_insurance_est_annual": { type: "number", definition: "Estimated annual homeowners insurance cost in USD for this property type and location." },
    "98_rental_estimate_monthly": { type: "number", definition: "Estimated monthly rent in USD. Search 'site:zillow.com [address] rent' or 'site:rentometer.com [ZIP]'." },

    // Comparable Sales
    "103_comparable_sales": { type: "array", definition: "Array of 3-5 recent comparable sales within 1 mile. Each comp: {address, sale_price, sale_date, sqft, beds, baths}." },

    // Utilities
    "104_electric_provider": { type: "string", definition: "Primary electric utility company serving this address (e.g., 'Duke Energy', 'Florida Power & Light')." },
    "105_avg_electric_bill": { type: "number", definition: "Average monthly electric bill in USD for this property size in this area." },
    "106_water_provider": { type: "string", definition: "Primary water utility company or municipality providing water service." },
    "107_avg_water_bill": { type: "number", definition: "Average MONTHLY water/sewer bill in USD. IMPORTANT: Many FL utilities bill bi-monthly - if you find bi-monthly data, DIVIDE BY 2 to get monthly. Typical FL monthly water bill is $40-80." },
    "110_trash_provider": { type: "string", definition: "Trash/solid waste collection provider (often same as city/county)." },
    "111_internet_providers_top3": { type: "array", definition: "Top 3 internet providers available at this address with max speeds. Example: ['Spectrum (400 Mbps)', 'AT&T Fiber (1 Gbps)', 'T-Mobile 5G']." },
    "114_cable_tv_provider": { type: "string", definition: "Primary cable TV provider available at this address." },

    // Listing Activity & Views
    "169_zillow_views": { type: "number", definition: "Number of views on Zillow listing (if active listing). Return null if not listed or not available." },
    "170_redfin_views": { type: "number", definition: "Number of views on Redfin listing (if active listing). Return null if not listed or not available." },
    "171_homes_views": { type: "number", definition: "Number of views on Homes.com listing (if active listing). Return null if not listed or not available." },
    "172_realtor_views": { type: "number", definition: "Number of views on Realtor.com listing (if active listing). Return null if not listed or not available." },
    "174_saves_favorites": { type: "number", definition: "Number of times listing was saved/favorited across platforms. Return null if not available." },

    // Market Trends
    "175_market_type": { type: "string", definition: "Current market classification: 'Hot', 'Warm', 'Cool', or 'Cold' based on days on market and sale-to-list ratio." },
    "176_avg_sale_to_list_percent": { type: "number", definition: "Average sale price as percentage of list price in this area (e.g., 98.5 means homes sell for 98.5% of asking)." },
    "177_avg_days_to_pending": { type: "number", definition: "Average number of days from listing to pending status in this ZIP/neighborhood." },
    "178_multiple_offers_likelihood": { type: "string", definition: "Likelihood of multiple offers: 'High' (>50% of listings), 'Medium' (25-50%), 'Low' (<25%)." },
    "180_price_trend": { type: "string", definition: "Price trend direction: 'Rising', 'Stable', or 'Declining' based on YoY median price change." },
    "181_rent_zestimate": { type: "number", definition: "Zillow's Rent Zestimate (estimated monthly rent) in USD. Search 'site:zillow.com [address] rent zestimate'." },

    // Legacy fields (kept for backward compatibility)
    "120_flood_risk_level": { type: "string", definition: "FEMA flood zone designation or flood risk category." },
    "124_hurricane_risk": { type: "string", definition: "Hurricane risk level or evacuation zone." },
    "35_annual_taxes": { type: "number", definition: "Most recent annual property tax amount in USD from county records." }
  }
};
import { GEMINI_FIELD_COMPLETER_SYSTEM } from '../../src/config/gemini-prompts.js';

// Vercel serverless config
export const config = {
  maxDuration: 300, // 5 minutes - reduced timeouts leave buffer for processing
};

// Timeout wrapper for LLM calls - prevents hanging
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}

const LLM_TIMEOUT = 180000; // 180s (3 min) - GPT-4o with reasoning needs 2-3 min
const PERPLEXITY_TIMEOUT = 45000; // 45s for Perplexity

// ============================================
// COMPLETE TYPE MAP - ALL 181 FIELDS from fields-schema.ts
// Maps EVERY field key to its expected type for validation and coercion
// 362 total entries (181 numbered + 181 unnumbered key variants)
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
  // FIXED 2026-01-08: Field 53 is Primary BR Location (select), NOT fireplace count (number)
  '53_primary_br_location': 'select', 'primary_br_location': 'select',

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
// Ensures values match expected types from the 181-field schema
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

// ============================================
// FILTER NULL VALUES - UNIFIED FIELD VALIDATION
// Copied from search.ts to ensure UNIFORM rules across codebase
// ============================================
function filterNullValues(parsed: any, llmName: string): Record<string, any> {
  const fields: Record<string, any> = {};
  let nullsBlocked = 0;
  let fieldsAccepted = 0;
  let typesCoerced = 0;

  // Handle case where parsed has a 'fields' property
  const dataToProcess = parsed.fields || parsed;

  for (const [key, val] of Object.entries(dataToProcess)) {
    // Skip metadata fields
    if (['llm', 'error', 'sources_searched', 'fields_found', 'fields_missing', 'note', 'status', 'message', 'success', 'citations'].includes(key)) {
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
    let coercedValue = coerceValue(key, rawValue);

    // If coercion returned null, the value was invalid for expected type
    if (coercedValue === null) {
      nullsBlocked++;
      continue;
    }

    // UTILITY BILL NORMALIZATION: Convert bi-monthly to monthly
    const utilityNormalized = normalizeUtilityBillToMonthly(key, coercedValue);
    if (utilityNormalized) {
      coercedValue = utilityNormalized.value;
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

function coerceValue(key: string, value: any): any {
  // CRITICAL: Reject hallucinated field keys as values
  if (isHallucinatedFieldKey(value)) {
    console.warn(`[RETRY-LLM] 🚫 REJECTED: Field "${key}" had hallucinated value "${value}"`);
    return null;
  }

  const expectedType = FIELD_TYPE_MAP[key];

  // If no type mapping (unknown field), return as-is
  if (!expectedType) {
    console.log(`[RETRY-LLM] ⚠️ UNKNOWN FIELD: ${key} not in 181-field schema`);
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

      // Handle ranges like "1.7-2.0" or "100-150" - take the midpoint
      const rangeMatch = cleaned.match(/^(\d+\.?\d*)\s*[-–—to]+\s*(\d+\.?\d*)$/i);
      if (rangeMatch) {
        const low = parseFloat(rangeMatch[1]);
        const high = parseFloat(rangeMatch[2]);
        if (!isNaN(low) && !isNaN(high)) {
          const midpoint = (low + high) / 2;
          console.log(`[RETRY-LLM] 🔄 TYPE COERCED RANGE: ${key} "${value}" → ${midpoint}`);
          return midpoint;
        }
      }

      // Handle "approximately X" or "~X" or "about X"
      const approxMatch = cleaned.match(/^(?:approximately|approx|about|~|≈)\s*(\d+\.?\d*)$/i);
      if (approxMatch) {
        const num = parseFloat(approxMatch[1]);
        if (!isNaN(num)) {
          console.log(`[RETRY-LLM] 🔄 TYPE COERCED APPROX: ${key} "${value}" → ${num}`);
          return num;
        }
      }

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
 * UTILITY BILL NORMALIZATION
 * Many FL utilities bill bi-monthly - detect and convert to monthly
 * Typical FL monthly ranges: Water $40-80, Electric $100-200
 */
function normalizeUtilityBillToMonthly(fieldKey: string, value: any): { value: number; wasNormalized: boolean } | null {
  if (typeof value !== 'number' || isNaN(value) || value <= 0) {
    return null;
  }

  // Field 107: Water bill - typical monthly is $40-80, bi-monthly would be $80-160
  if (fieldKey === '107_avg_water_bill' || fieldKey === 'avg_water_bill') {
    if (value > 100) {
      const monthly = Math.round(value / 2);
      console.log(`[RETRY-LLM] 🔄 UTILITY NORMALIZED: ${fieldKey} $${value} → $${monthly}/month (detected bi-monthly)`);
      return { value: monthly, wasNormalized: true };
    }
    return { value, wasNormalized: false };
  }

  // Field 105: Electric bill - typical monthly is $100-200, bi-monthly would be $200-400
  if (fieldKey === '105_avg_electric_bill' || fieldKey === 'avg_electric_bill') {
    if (value > 300) {
      const monthly = Math.round(value / 2);
      console.log(`[RETRY-LLM] 🔄 UTILITY NORMALIZED: ${fieldKey} $${value} → $${monthly}/month (detected bi-monthly)`);
      return { value: monthly, wasNormalized: true };
    }
    return { value, wasNormalized: false };
  }

  return null;
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
   - "site:zillow.com [Address]" (for 16a_zestimate and 181_rent_zestimate)
   - "site:redfin.com [Address]" (for 16b_redfin_estimate)
   - "[Address] utility providers and average bills"
   - "[City/ZIP] median home price and market trends 2026"
2. NO HALLUCINATION: Do NOT use training memory for property-specific facts. Use only verified search results from 2025-2026.
3. SPECIFIC AVM SEARCH STRATEGY (search for EACH AVM individually):
   - 16a_zestimate: Search "site:zillow.com [ADDRESS]" to find Zillow's Zestimate
   - 16b_redfin_estimate: Search "site:redfin.com [ADDRESS]" to find Redfin Estimate
   - 16c_first_american_avm: Search for First American AVM if available
   - 16d_quantarium_avm: Search for Quantarium AVM if available
   - 16e_ice_avm: Search for ICE/Intercontinental Exchange AVM if available
   - 16f_collateral_analytics_avm: Search for Collateral Analytics AVM if available
   - 181_rent_zestimate: Search "site:zillow.com [ADDRESS] rent" for Zillow Rent Zestimate
   - 12_market_value_estimate: Calculate as arithmetic average of ALL AVMs found (if 2 found: add & divide by 2; if 3 found: add & divide by 3, etc.)
   - If a specific AVM is behind a paywall, return null for that field.
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
        model: 'sonar-reasoning-pro',
        messages: [
          { role: 'system', content: PERPLEXITY_FIELD_COMPLETER_SYSTEM },
          { role: 'user', content: PERPLEXITY_FIELD_COMPLETER_USER(address, city, zip) }
        ],
        temperature: 0.2,
        max_tokens: 32000,
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
                let coerced = coerceValue(prefix + key, value);
                if (coerced !== null) {
                  // UTILITY BILL NORMALIZATION: Convert bi-monthly to monthly
                  const utilityNormalized = normalizeUtilityBillToMonthly(prefix + key, coerced);
                  if (utilityNormalized) coerced = utilityNormalized.value;
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
// GROK FIELD COMPLETER PROMPT (Grok 4.1 Fast Mode - Non-Reasoning)
// ============================================
const GROK_RETRY_SYSTEM_PROMPT = `You are the CLUES Field Completer (Grok 4.1 Fast Mode).
Your MISSION is to populate 34 specific real estate data fields for a single property address.

### HARD RULES (EVIDENCE FIREWALL)
1. Use your built-in live web search capability to gather real-time data. Execute at least 4 distinct searches.
2. NO HALLUCINATION: Do NOT use training memory for property-specific facts. Use only verified search results from 2025-2026.
3. SPECIFIC AVM SEARCH STRATEGY (search for EACH AVM individually):
   - 16a_zestimate: Search "site:zillow.com [ADDRESS]" to find Zillow's Zestimate
   - 16b_redfin_estimate: Search "site:redfin.com [ADDRESS]" to find Redfin Estimate
   - 16c_first_american_avm: Search for First American AVM if available
   - 16d_quantarium_avm: Search for Quantarium AVM if available
   - 16e_ice_avm: Search for ICE/Intercontinental Exchange AVM if available
   - 16f_collateral_analytics_avm: Search for Collateral Analytics AVM if available
   - 181_rent_zestimate: Search "site:zillow.com [ADDRESS] rent" for Zillow Rent Zestimate
   - 12_market_value_estimate: Calculate as arithmetic average of ALL AVMs found (if 2 found: add & divide by 2; if 3 found: add & divide by 3, etc.)
   - If a specific AVM is behind a paywall, return null for that field.
4. JSON ONLY: Return ONLY the raw JSON object. No conversational text.

### MANDATORY SEARCH QUERIES
- "site:zillow.com [Address]" (for 16a_zestimate and 181_rent_zestimate)
- "site:redfin.com [Address]" (for 16b_redfin_estimate)
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
const GROK_RETRY_USER_PROMPT = (address: string) => `Extract property data for: ${address}

Use your built-in live web search to find real-time data from Zillow, Redfin, county records, and utility providers. Return JSON with field data.`;

// Tavily search helper for Grok tool calls
async function callTavilySearch(query: string, numResults: number = 5): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.log('❌ [Tavily] TAVILY_API_KEY not set');
    return 'Search unavailable - API key not configured';
  }

  try {
    console.log(`🔍 [Tavily] Searching: "${query}"`);
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic',
        max_results: Math.min(numResults, 10),
        include_answer: true,
        include_raw_content: false
      })
    });

    if (!response.ok) {
      console.error(`❌ [Tavily] HTTP ${response.status}`);
      return `Search failed with status ${response.status}`;
    }

    const data = await response.json();
    console.log(`✅ [Tavily] Got ${data.results?.length || 0} results`);

    let formatted = data.answer ? `Summary: ${data.answer}\n\n` : '';
    if (data.results && data.results.length > 0) {
      formatted += 'Sources:\n';
      data.results.forEach((r: any, i: number) => {
        formatted += `${i + 1}. ${r.title}: ${r.content?.substring(0, 300) || 'No content'}\n`;
      });
    }
    return formatted || 'No results found';
  } catch (error) {
    console.error('❌ [Tavily] Error:', error);
    return `Search error: ${String(error)}`;
  }
}

async function callGrok(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.XAI_API_KEY;
  console.log('[GROK] API key present:', !!apiKey, 'length:', apiKey?.length || 0);
  if (!apiKey) {
    return { error: 'API key not set', fields: {} };
  }

  const messages: any[] = [
    { role: 'system', content: GROK_RETRY_SYSTEM_PROMPT },
    { role: 'user', content: GROK_RETRY_USER_PROMPT(address) }
  ];

  try {
    // First call - Grok may request tool calls
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast', // Non-reasoning model for data extraction (faster, no thinking output)
        max_tokens: 32000,
        temperature: 0.2,
        messages: messages,
      }),
    });

    let data = await response.json();
    console.log('[GROK] Status:', response.status);

    // Check if Grok wants to use tools
    const assistantMessage = data.choices?.[0]?.message;
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`🔧 [GROK] Requesting ${assistantMessage.tool_calls.length} tool calls`);

      // Add assistant message with tool calls to conversation
      messages.push(assistantMessage);

      // Execute each tool call via Tavily (limit to 3 to avoid timeout)
      const toolCalls = assistantMessage.tool_calls.slice(0, 3);
      for (const toolCall of toolCalls) {
        if (toolCall.function?.name === 'web_search') {
          // CRASH FIX: Wrap JSON.parse in try-catch for tool call arguments
          let args: any = {};
          try {
            args = JSON.parse(toolCall.function.arguments || '{}');
          } catch (parseError) {
            console.error('[GROK] Failed to parse tool call arguments:', parseError);
            continue; // Skip this tool call
          }
          const searchResult = await callTavilySearch(args.query, args.num_results || 5);

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: searchResult
          });
        }
      }

      // Second call - Grok processes tool results
      console.log('🔄 [GROK] Sending tool results back...');
      const response2 = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'grok-4-1-fast', // Non-reasoning model for data extraction
          max_tokens: 32000,
          temperature: 0.2,
          messages: messages,
        }),
      });

      data = await response2.json();
      console.log('[GROK] Final response received');
    }

    // Parse the final response
    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      console.log('[GROK] Response length:', text.length, 'chars');

      const parseResult = extractAndParseJSON(text);
      console.log('[GROK] Parse result:', parseResult.success ? `${Object.keys(parseResult.data || {}).length} keys` : parseResult.error);

      if (parseResult.success && parseResult.data) {
        const parsed = parseResult.data;
        // Grok may return { data_fields: {...} } or { fields: {...} } or flat fields
        const fieldsToProcess = parsed.data_fields || parsed.fields || parsed;
        console.log(`[GROK] Parsed structure: ${parsed.data_fields ? 'data_fields' : parsed.fields ? 'fields' : 'flat'}, keys: ${Object.keys(fieldsToProcess).length}`);
        // Use unified filterNullValues() for consistent field validation
        const fields = filterNullValues(fieldsToProcess, 'Grok');
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
        max_tokens: 32000,
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
        // FIX: Handle nested { data_fields: {...} }, { fields: {...} }, or flat format
        const fieldsToProcess = parsed.data_fields || parsed.fields || parsed;
        console.log(`[CLAUDE OPUS] Parsed structure: ${parsed.data_fields ? 'data_fields' : parsed.fields ? 'fields' : 'flat'}, keys: ${Object.keys(fieldsToProcess).length}`);
        // Use unified filterNullValues() for consistent field validation
        const fields = filterNullValues(fieldsToProcess, 'Claude Opus');
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
// GPT-4o FIELD COMPLETER - Web-Evidence Mode (Retry)
// ============================================
const GPT_RETRY_SYSTEM_PROMPT = `You are CLUES Field Completer (GPT-4o Web-Evidence Mode).

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

### MANDATORY SEARCH QUERIES (execute ALL of these)
1) AVMs & Property Values (SEARCH FOR EACH SPECIFIC AVM):
   - "site:zillow.com [ADDRESS]" → Extract 16a_zestimate (Zillow Zestimate)
   - "site:redfin.com [ADDRESS]" → Extract 16b_redfin_estimate (Redfin Estimate)
   - "site:zillow.com [ADDRESS] rent" → Extract 181_rent_zestimate (Zillow Rent Zestimate)
   - Search for 16c_first_american_avm (First American AVM) if available
   - Search for 16d_quantarium_avm (Quantarium AVM) if available
   - Search for 16e_ice_avm (ICE/Intercontinental Exchange AVM) if available
   - Search for 16f_collateral_analytics_avm (Collateral Analytics AVM) if available
   - Calculate 12_market_value_estimate = arithmetic average of ALL AVMs found (if 2 found: add & divide by 2; if 3 found: add & divide by 3, etc.)

2) Market Statistics:
   - "[ZIP CODE] median home price 2025 2026" → 91_median_home_price_neighborhood
   - "[ZIP CODE] real estate market trends" → 95_days_on_market_avg, 175_market_type, 180_price_trend
   - "[ZIP CODE] price per square foot" → 92_price_per_sqft_recent_avg
   - "[CITY] housing inventory months supply" → 96_inventory_surplus

3) Rental & Investment:
   - "site:zillow.com [ADDRESS] rent" → 98_rental_estimate_monthly
   - "site:rentometer.com [ZIP CODE]" → 98_rental_estimate_monthly (backup)

4) Utilities:
   - "[CITY] [STATE] electric utility provider" → 104_electric_provider
   - "[CITY] [STATE] water utility provider" → 106_water_provider
   - "[CITY] trash collection service" → 110_trash_provider
   - "[ADDRESS] internet providers" → 111_internet_providers_top3
   - "[ZIP CODE] average electric bill" → 105_avg_electric_bill
   - "[ZIP CODE] average water bill" → 107_avg_water_bill

5) Insurance:
   - "[CITY] [STATE] average homeowners insurance" → 97_insurance_est_annual
   - "[ZIP CODE] home insurance cost" → 97_insurance_est_annual

6) Comparable Sales:
   - "site:zillow.com [NEIGHBORHOOD] recently sold" → 103_comparable_sales
   - "site:redfin.com [ZIP CODE] sold homes" → 103_comparable_sales

7) Transit & Location:
   - "[ADDRESS] public transit bus train" → 81_public_transit_access
   - "[ADDRESS] commute to [NEAREST MAJOR CITY] downtown" → 82_commute_to_city_center

8) Market Activity (if property is actively listed):
   - "site:zillow.com [ADDRESS]" → 169_zillow_views, 174_saves_favorites
   - "site:redfin.com [ADDRESS]" → 170_redfin_views
   - "[ZIP CODE] sale to list price ratio" → 176_avg_sale_to_list_percent
   - "[ZIP CODE] days to pending" → 177_avg_days_to_pending
   - "[ZIP CODE] multiple offers" → 178_multiple_offers_likelihood

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
        model: 'gpt-4o',
        max_output_tokens: 32000,
        input: [
          { role: 'system', content: GPT_RETRY_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        reasoning: { effort: 'low' },
        tools: [{ type: 'web_search' }],
        tool_choice: 'auto', // Changed from 'required' - auto lets model decide when to search
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
        // FIX: Handle nested { data_fields: {...} }, { fields: {...} }, or flat format
        const fieldsToProcess = parsed.data_fields || parsed.fields || parsed;
        console.log(`[GPT] Parsed structure: ${parsed.data_fields ? 'data_fields' : parsed.fields ? 'fields' : 'flat'}, keys: ${Object.keys(fieldsToProcess).length}`);
        // Use unified filterNullValues() for consistent field validation
        const fields = filterNullValues(fieldsToProcess, 'GPT');
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

  const prompt = `You are Claude Sonnet, a property data specialist with web search capabilities.

🔵 FIRING ORDER: You are the 4th LLM in the search chain (after Perplexity, Gemini, and GPT). Grok and Claude Opus fire AFTER you.
You ONLY search for fields that earlier LLMs did NOT find.
Do NOT re-search fields already populated - focus ONLY on MISSING fields from the 34 high-velocity field list.

MISSION: Use web search to populate ANY of the 34 high-velocity fields that are still missing for: ${address}

VALUATION & AVM FIELDS:
- 12_market_value_estimate: Estimated market value (average of available AVMs)
- 16a_zestimate: Zillow Zestimate
- 16b_redfin_estimate: Redfin Estimate
- 16c_first_american_avm: First American AVM
- 16d_quantarium_avm: Quantarium AVM
- 16e_ice_avm: ICE AVM
- 16f_collateral_analytics_avm: Collateral Analytics AVM

MARKET & PRICING FIELDS:
- 91_median_home_price_neighborhood: Median home price in neighborhood
- 92_price_per_sqft_recent_avg: Recent average $/sqft in area
- 95_days_on_market_avg: Average days on market
- 96_inventory_surplus: Market inventory level
- 175_market_type: Buyer's/Seller's/Balanced market
- 176_avg_sale_to_list_percent: Average sale-to-list price ratio
- 177_avg_days_to_pending: Average days to pending status
- 178_multiple_offers_likelihood: Likelihood of multiple offers
- 180_price_trend: Price trend direction

RENTAL & INVESTMENT FIELDS:
- 98_rental_estimate_monthly: Monthly rental estimate
- 181_rent_zestimate: Zillow Rent Zestimate
- 97_insurance_est_annual: Annual homeowners insurance estimate
- 103_comparable_sales: Recent comparable sales

UTILITY & SERVICE PROVIDER FIELDS:
- 104_electric_provider: Electric utility provider
- 105_avg_electric_bill: Average monthly electric bill
- 106_water_provider: Water utility provider
- 107_avg_water_bill: Average monthly water bill
- 110_trash_provider: Trash collection provider
- 111_internet_providers_top3: Top 3 internet providers available
- 114_cable_tv_provider: Cable TV provider

LOCATION & TRANSIT FIELDS:
- 81_public_transit_access: Public transit access description
- 82_commute_to_city_center: Commute time to city center

MARKET ACTIVITY FIELDS (if property is actively listed):
- 169_zillow_views: Number of Zillow views
- 170_redfin_views: Number of Redfin views
- 171_homes_views: Number of Homes.com views
- 172_realtor_views: Number of Realtor.com views
- 174_saves_favorites: Number of saves/favorites

SEARCH STRATEGY:
1. SPECIFIC AVM SEARCHES (search for EACH AVM individually):
   - "site:zillow.com [ADDRESS]" → Extract 16a_zestimate (Zillow Zestimate)
   - "site:redfin.com [ADDRESS]" → Extract 16b_redfin_estimate (Redfin Estimate)
   - "site:zillow.com [ADDRESS] rent" → Extract 181_rent_zestimate (Zillow Rent Zestimate)
   - Search for 16c_first_american_avm, 16d_quantarium_avm, 16e_ice_avm, 16f_collateral_analytics_avm if available
   - Calculate 12_market_value_estimate = arithmetic average of ALL AVMs found (if 2: add & divide by 2; if 3: add & divide by 3, etc.)
2. Search "[CITY/ZIP] median home price 2026" for market statistics
3. Search "[CITY] utility providers" for utility/service information
4. Search "[ADDRESS] public transit" for transit access
5. Only return fields you found with high confidence - use null for unverified data

Return JSON with numbered field keys like:
{
  "fields": {
    "12_market_value_estimate": {"value": 450000, "source": "Zillow.com", "confidence": "High"},
    "104_electric_provider": {"value": "Duke Energy", "source": "Duke Energy website", "confidence": "High"}
  }
}

Return ONLY the JSON object. Use null only for fields you truly cannot find.`;

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
        max_tokens: 32000,
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
          // FIX: Handle nested { data_fields: {...} }, { fields: {...} }, or flat format
          const fieldsToProcess = parsed.data_fields || parsed.fields || parsed;
          console.log(`[CLAUDE SONNET] Parsed structure: ${parsed.data_fields ? 'data_fields' : parsed.fields ? 'fields' : 'flat'}, keys: ${Object.keys(fieldsToProcess).length}`);
          // Use unified filterNullValues() for consistent field validation
          const fields = filterNullValues(fieldsToProcess, 'Claude Sonnet');
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
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
          generationConfig: {
            thinking_config: {
              thinking_level: "low",
              include_thoughts: false  // Just need data, not reasoning
            },
            temperature: 1.0,  // MUST be 1.0 for Gemini 3 Pro
            maxOutputTokens: 16000,
            responseMimeType: 'application/json'
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
        // FIX: Handle nested { data_fields: {...} }, { fields: {...} }, or flat format
        const fieldsToProcess = parsed.data_fields || parsed.fields || parsed;
        console.log(`[GEMINI] Parsed structure: ${parsed.data_fields ? 'data_fields' : parsed.fields ? 'fields' : 'flat'}, keys: ${Object.keys(fieldsToProcess).length}`);
        // Use unified filterNullValues() for consistent field validation
        const fields = filterNullValues(fieldsToProcess, 'Gemini');
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

  // Map engine IDs to functions (Order: Perplexity → Gemini → GPT → Sonnet → Grok → Opus)
  const engineFunctions: Record<string, (address: string) => Promise<{ fields: Record<string, any>; error?: string }>> = {
    'perplexity': callPerplexity,     // #1 - Deep web search (HIGHEST)
    'gemini': callGemini,             // #2 - Google Search grounding
    'gpt': callGPT5,                  // #3 - Web evidence mode
    'claude-sonnet': callClaudeSonnet, // #4 - Web search beta
    'grok': callGrok,                 // #5 - X/Twitter real-time
    'claude-opus': callClaudeOpus,    // #6 - Deep reasoning, NO web (LAST)
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
