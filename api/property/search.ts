/**
 * CLUES Property Search API (Non-Streaming Version)
 *
 * DATA SOURCE ORDER (Most Reliable First):
 * Tier 1: Stellar MLS (when eKey obtained - future)
 * Tier 2: Google APIs (Geocode, Places)
 * Tier 3: Paid/Free APIs (WalkScore, SchoolDigger, AirNow, HowLoud, Weather, Crime, FEMA, Census)
 * Tier 4: Web-Search LLMs (Perplexity → Gemini → GPT → Grok)
 * Tier 5: Claude LLMs (Sonnet → Opus) - Opus is LAST (no web search)
 *
 * LLM CASCADE ORDER (Updated 2026-01-05):
 *   #1 Perplexity - Deep web search (HIGHEST)
 *   #2 Gemini - Google Search grounding
 *   #3 GPT - Web evidence mode
 *   #4 Grok - X/Twitter real-time data
 *   #5 Claude Sonnet - Web search beta
 *   #6 Claude Opus - Deep reasoning, NO web search (LAST)
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
import { GEMINI_FIELD_COMPLETER_SYSTEM } from '../../src/config/gemini-prompts.js';
import {
  buildPromptA,
  buildPromptB,
  buildPromptC,
  buildPromptD,
  buildPromptE,
  mapPerplexityFieldsToSchema,
  PERPLEXITY_SYSTEM_PROMPT,
  PERPLEXITY_CONFIG,
  type PromptDContext
} from './perplexity-prompts.js';

// Vercel serverless config - use global 300s limit from vercel.json for LLM cascade
export const config = {
  maxDuration: 300, // 5 minutes (Vercel Pro allows up to 300s)
};

// Timeout wrapper for API/LLM calls - prevents hanging
const STELLAR_MLS_TIMEOUT = 30000; // 30 seconds for Stellar MLS via Bridge API (Tier 1) - typically responds in <10s
const FREE_API_TIMEOUT = 60000; // 60 seconds for free APIs (Tier 2 & 3) - reduced from 90s
const LLM_TIMEOUT = 180000; // 180 seconds (3 min) for Claude, GPT, Gemini, Grok - GPT-5.2-pro with reasoning needs 2-3 min
const PERPLEXITY_TIMEOUT = 90000; // 90 seconds for Perplexity deep web search

// ============================================
// RATE LIMIT TRACKING - Skip LLMs only when 429 detected
// ============================================
const rateLimitState = {
  perplexity: { limited: false, resetAt: 0 },
  gemini: { limited: false, resetAt: 0 },
  gpt: { limited: false, resetAt: 0 },
  grok: { limited: false, resetAt: 0 },
};

function isRateLimited(llm: keyof typeof rateLimitState): boolean {
  const state = rateLimitState[llm];
  if (!state.limited) return false;
  // Reset after 60 seconds
  if (Date.now() > state.resetAt) {
    state.limited = false;
    return false;
  }
  return true;
}

function setRateLimited(llm: keyof typeof rateLimitState): void {
  rateLimitState[llm] = { limited: true, resetAt: Date.now() + 60000 };
  console.log(`⚠️ [Rate Limit] ${llm} rate limited (429) - skipping remaining calls for 60s`);
}
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}

import { LLM_CASCADE_ORDER } from './llm-constants.js';
import { createArbitrationPipeline, type FieldValue, type ArbitrationResult } from './arbitration.js';
import { sanitizeAddress, isValidAddress, safeFetch } from '../../src/lib/safe-json-parse.js';
import { callCrimeGrade, callSchoolDigger, callGreatSchools, callFEMARiskIndex, callNOAAClimate, callNOAAStormEvents, callNOAASeaLevel, callUSGSElevation, callUSGSEarthquake, callEPAFRS, getRadonRisk, callGoogleStreetView, callGoogleSolarAPI, callHowLoud/*, callRedfinProperty*/ } from './free-apis.js';
import { STELLAR_MLS_SOURCE, FBI_CRIME_SOURCE } from './source-constants.js';
import { calculateAllDerivedFields, type PropertyData } from '../../src/lib/calculate-derived-fields.js';
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
// REMOVED: Batch system deleted - using unified Field Completer prompt instead
// import { fetchAllMissingFields } from '../../src/services/valuation/geminiBatchWorker.js';
// import { TIER_35_FIELD_IDS } from '../../src/services/valuation/geminiConfig.js';


// ============================================
// ============================================
// COMPLETE TYPE MAP - ALL 181 FIELDS from fields-schema.ts
// Maps EVERY field key to its expected type for validation and coercion
// Includes subfields: 4A, 26A, 26B, 31A-31F, 132B, 167C, 167D
// Updated: 2025-01-05
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
  '4A_special_sale_type': 'select', 'special_sale_type': 'select',
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
  '16_avms': 'currency', 'avms': 'currency',
  // AVM Subfields (16a-16f) - Individual AVM Sources
  '16a_zestimate': 'currency', 'zestimate': 'currency',
  '16b_redfin_estimate': 'currency', 'redfin_estimate': 'currency',
  '16c_first_american_avm': 'currency', 'first_american_avm': 'currency',
  '16d_quantarium_avm': 'currency', 'quantarium_avm': 'currency',
  '16e_ice_avm': 'currency', 'ice_avm': 'currency',
  '16f_collateral_analytics_avm': 'currency', 'collateral_analytics_avm': 'currency',

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
  '26A_arch_style': 'text', 'arch_style': 'text',
  '26B_attached_yn': 'boolean', 'attached_yn': 'boolean',
  '27_stories': 'number', 'stories': 'number',
  '28_garage_spaces': 'number', 'garage_spaces': 'number',
  '29_parking_total': 'text', 'parking_total': 'text',

  // ================================================================
  // GROUP 4: HOA & Taxes (Fields 30-38)
  // ================================================================
  '30_hoa_yn': 'boolean', 'hoa_yn': 'boolean',
  '31_association_fee': 'currency', 'association_fee': 'currency',
  // Fee subfields (31A-31F)
  '31A_hoa_fee_monthly': 'currency', 'hoa_fee_monthly': 'currency',
  '31B_hoa_fee_annual': 'currency',
  '31C_condo_fee_monthly': 'currency', 'condo_fee_monthly': 'currency',
  '31D_condo_fee_annual': 'currency', 'condo_fee_annual': 'currency',
  '31E_fee_frequency_primary': 'text', 'fee_frequency_primary': 'text',
  '31F_fee_raw_notes': 'text', 'fee_raw_notes': 'text',
  // Back-compat aliases (Field 31 refactor)
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
  '53_primary_br_location': 'select', 'primary_br_location': 'select',

  // ================================================================
  // GROUP 7: Exterior Features (Fields 54-58)
  // ================================================================
  '54_pool_yn': 'boolean', 'pool_yn': 'boolean',
  '55_pool_type': 'multiselect', 'pool_type': 'multiselect',
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
  '132B_other_structures': 'text', 'other_structures': 'text',
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
  '167C_furnished_yn': 'boolean', 'furnished_yn': 'boolean',
  '168_exterior_features': 'multiselect', 'exterior_features': 'multiselect',

  // ================================================================
  // GROUP 23 (W): Market Performance (Fields 169-181) - NEW SECTION
  // ================================================================
  '169_zillow_views': 'number', 'zillow_views': 'number',
  '170_redfin_views': 'number', 'redfin_views': 'number',
  '171_homes_views': 'number', 'homes_views': 'number',
  '172_realtor_views': 'number', 'realtor_views': 'number',
  '173_total_views': 'number', 'total_views': 'number',
  '174_saves_favorites': 'number', 'saves_favorites': 'number',
  '175_market_type': 'select', 'market_type': 'select',
  '176_avg_sale_to_list_percent': 'percentage', 'avg_sale_to_list_percent': 'percentage',
  '177_avg_days_to_pending': 'number', 'avg_days_to_pending': 'number',
  '178_multiple_offers_likelihood': 'select', 'multiple_offers_likelihood': 'select',
  '179_appreciation_percent': 'percentage', 'appreciation_percent': 'percentage',
  '180_price_trend': 'select', 'price_trend': 'select',
  '181_rent_zestimate': 'currency', 'rent_zestimate': 'currency',
};

// Build a stable map from numeric field id -> primary numbered field key (e.g., 37 -> '37_property_tax_rate')
const FIELD_ID_TO_KEY: Record<number, string> = (() => {
  const map: Record<number, string> = {};
  for (const key of Object.keys(FIELD_TYPE_MAP)) {
    const m = key.match(/^(\d+)_/);
    if (!m) continue;
    const id = Number(m[1]);
    if (!map[id]) map[id] = key;
  }
  return map;
})();


// ============================================
// TYPE COERCION FUNCTION - Validates and coerces LLM values
// Ensures values match expected types from the 181-field schema
// ============================================
function coerceValue(key: string, value: any): any {
  const expectedType = FIELD_TYPE_MAP[key];

  // If no type mapping (unknown field), return as-is
  if (!expectedType) {
    // Skip unknown fields silently - they may be API response metadata
    return null;
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

      // Handle ranges like "1.7-2.0" or "100-150" - take the midpoint
      const rangeMatch = cleaned.match(/^(\d+\.?\d*)\s*[-–—to]+\s*(\d+\.?\d*)$/i);
      if (rangeMatch) {
        const low = parseFloat(rangeMatch[1]);
        const high = parseFloat(rangeMatch[2]);
        if (!isNaN(low) && !isNaN(high)) {
          const midpoint = (low + high) / 2;
          console.log(`🔄 TYPE COERCED RANGE: ${key} "${value}" → ${midpoint} (midpoint of ${low}-${high})`);
          return midpoint;
        }
      }

      // Handle "approximately X" or "~X" or "about X"
      const approxMatch = cleaned.match(/^(?:approximately|approx|about|~|≈)\s*(\d+\.?\d*)$/i);
      if (approxMatch) {
        const num = parseFloat(approxMatch[1]);
        if (!isNaN(num)) {
          console.log(`🔄 TYPE COERCED APPROX: ${key} "${value}" → ${num}`);
          return num;
        }
      }

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
// UTILITY BILL NORMALIZATION
// Many FL utilities bill bi-monthly - detect and convert to monthly
// Typical FL monthly ranges: Water $40-80, Electric $100-200
// ============================================
function normalizeUtilityBillToMonthly(fieldKey: string, value: any): { value: number; wasNormalized: boolean } | null {
  if (typeof value !== 'number' || isNaN(value) || value <= 0) {
    return null;
  }

  // Field 107: Water bill - typical monthly is $40-80, bi-monthly would be $80-160
  if (fieldKey === '107_avg_water_bill' || fieldKey === 'avg_water_bill') {
    if (value > 100) {
      // Likely bi-monthly - divide by 2
      const monthly = Math.round(value / 2);
      console.log(`🔄 UTILITY NORMALIZED: ${fieldKey} $${value} → $${monthly}/month (detected bi-monthly)`);
      return { value: monthly, wasNormalized: true };
    }
    return { value, wasNormalized: false };
  }

  // Field 105: Electric bill - typical monthly is $100-200, bi-monthly would be $200-400
  if (fieldKey === '105_avg_electric_bill' || fieldKey === 'avg_electric_bill') {
    if (value > 300) {
      // Likely bi-monthly - divide by 2
      const monthly = Math.round(value / 2);
      console.log(`🔄 UTILITY NORMALIZED: ${fieldKey} $${value} → $${monthly}/month (detected bi-monthly)`);
      return { value: monthly, wasNormalized: true };
    }
    return { value, wasNormalized: false };
  }

  return null;
}

// ============================================
// NULL BLOCKING HELPER - CRITICAL SYSTEM RULE
// NO NULL VALUES ARE ALLOWED INTO THE FIELD SYSTEM
// This function filters LLM responses to remove any nulls
// ============================================
// Filter Grok's fields to prevent hallucinations on Stellar MLS and Perplexity territory
// DEPRECATED 2026-01-02: Removed pre-filtering - arbitration pipeline handles tier precedence
// function filterGrokRestrictedFields(parsed: any): Record<string, any> {
//   // This function previously blocked Grok from populating certain fields
//   // Problem: It blocked fields even when they were NULL from higher tiers
//   // Solution: Let arbitration pipeline handle tier precedence naturally
//   // Grok (Tier 5) can now fill gaps but cannot overwrite higher-tier data
// }

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

// ============================================
// HOA FEE VALIDATION
// Prevents LLMs from confusing monthly fees with annual fees
// Common bug: LLM returns $300/month, but field expects $3,600/year
// ============================================
interface HOAValidationResult {
  valid: boolean;
  correctedValue?: number;
  warning?: string;
}

function validateHOAFee(feeAnnual: number, fieldData: any): HOAValidationResult {
  // Typical Florida HOA ranges:
  // - Single-family: $600-$3,600/year ($50-$300/month)
  // - Condos: $2,400-$15,000/year ($200-$1,250/month)
  // - Luxury condos: $6,000-$50,000/year ($500-$4,000/month)

  // RULE 1: If fee is suspiciously low (< $600), likely monthly fee
  if (feeAnnual < 600 && feeAnnual > 0) {
    const correctedAnnual = feeAnnual * 12;
    console.warn(`⚠️ Field 31 (hoa_fee_annual): $${feeAnnual}/year seems LOW (likely monthly). Auto-correcting to $${correctedAnnual}/year`);
    return {
      valid: true,
      correctedValue: correctedAnnual,
      warning: `Auto-corrected from monthly ($${feeAnnual}) to annual ($${correctedAnnual})`
    };
  }

  // RULE 2: If fee is suspiciously high (> $50,000), flag for review
  if (feeAnnual > 50000) {
    console.warn(`⚠️ Field 31 (hoa_fee_annual): $${feeAnnual}/year seems VERY HIGH. Verify this is correct.`);
    return {
      valid: true, // Still accept it, but flag
      warning: `Unusually high HOA fee ($${feeAnnual}/year) - verify accuracy`
    };
  }

  // RULE 3: Check if source explicitly says "monthly" but value is in annual field
  if (fieldData.source && fieldData.source.toLowerCase().includes('monthly') && !fieldData.source.toLowerCase().includes('annual')) {
    const correctedAnnual = feeAnnual * 12;
    console.warn(`⚠️ Field 31 (hoa_fee_annual): Source says "monthly" but value is in annual field. Correcting $${feeAnnual} → $${correctedAnnual}`);
    return {
      valid: true,
      correctedValue: correctedAnnual,
      warning: `Auto-corrected monthly fee to annual`
    };
  }

  // RULE 4: Normal range - accept as-is
  return { valid: true };
}

// ============================================
// TIME-BASED FIELD VALIDATION
// Prevents LLMs from returning stale/outdated data for time-sensitive fields
// ============================================
interface FieldDateValidation {
  maxAgeMonths: number; // How old can the data be?
  requiresDate: boolean; // Must source include "as of [date]"?
  typicalRange?: [number, number]; // Optional: [min, max] for sanity check
}

const TIME_SENSITIVE_FIELDS: Record<string, FieldDateValidation> = {
  // Market estimates (should be recent)
  '12_market_value_estimate': { maxAgeMonths: 6, requiresDate: false },
  '16_avms': { maxAgeMonths: 6, requiresDate: false },

  // Market data (should be current)
  '91_median_home_price_neighborhood': { maxAgeMonths: 6, requiresDate: true },
  '92_price_per_sqft_recent_avg': { maxAgeMonths: 6, requiresDate: true },
  '95_days_on_market_avg': { maxAgeMonths: 3, requiresDate: true, typicalRange: [15, 180] },

  // Financial estimates (insurance/rental)
  '97_insurance_est_annual': { maxAgeMonths: 12, requiresDate: false, typicalRange: [1000, 15000] },
  '98_rental_estimate_monthly': { maxAgeMonths: 6, requiresDate: false },
};

interface TimeValidationResult {
  valid: boolean;
  warning?: string;
}

function validateTimeBasedField(
  fieldKey: string,
  value: any,
  fieldData: any
): TimeValidationResult {

  const validation = TIME_SENSITIVE_FIELDS[fieldKey];
  if (!validation) return { valid: true }; // Not a time-sensitive field

  const currentDate = new Date();

  // STEP 1: Try to extract date from source
  let dataDate: Date | null = null;

  // Check if source includes "as of [date]"
  const datePatterns = [
    /as of (\w+ \d{4})/i,           // "as of November 2024"
    /\((\d{4})\)/,                   // "(2024)"
    /updated (\w+ \d+,? \d{4})/i,    // "updated December 18, 2024"
    /Q(\d) (\d{4})/i,                // "Q4 2024"
  ];

  if (fieldData.source) {
    for (const pattern of datePatterns) {
      const match = fieldData.source.match(pattern);
      if (match) {
        try {
          dataDate = new Date(match[1]);
          if (isNaN(dataDate.getTime())) {
            dataDate = null;
          }
          break;
        } catch (e) {
          // Could not parse date
        }
      }
    }
  }

  // STEP 2: If date required but not found, reject
  if (validation.requiresDate && !dataDate) {
    console.warn(`❌ Field ${fieldKey}: Source must include date (e.g., "as of November 2024"). Source: "${fieldData.source}"`);
    return { valid: false };
  }

  // STEP 3: If date found, check if too old
  if (dataDate) {
    const monthsSinceData = (currentDate.getTime() - dataDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsSinceData > validation.maxAgeMonths) {
      console.warn(`❌ Field ${fieldKey}: Data is ${Math.round(monthsSinceData)} months old (max ${validation.maxAgeMonths} months)`);
      return { valid: false };
    }
  }

  // STEP 4: Sanity check value if range provided
  if (validation.typicalRange) {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''));
    if (!isNaN(numValue)) {
      const [min, max] = validation.typicalRange;
      if (numValue < min || numValue > max) {
        return {
          valid: true, // Still accept, but warn
          warning: `Value $${numValue} is outside typical range [$${min}-$${max}]`
        };
      }
    }
  }

  return { valid: true };
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
    '16_avms': ['financial', 'avms'],

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
    '53_primary_br_location': ['structural', 'primaryBrLocation'],

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
    '77_safety_score': ['location', 'safetyScore'],
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

async function geocodeAddress(
  address: string,
  expectedCity?: string,
  expectedState?: string,
  expectedZip?: string
): Promise<{ lat: number; lon: number; county: string; zipCode: string; state: string } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    // Extract expected ZIP from address if not provided explicitly
    const zipMatch = address.match(/\b(\d{5})(?:-\d{4})?\b/);
    const expectedZipFromAddress = zipMatch ? zipMatch[1] : null;
    const finalExpectedZip = expectedZip || expectedZipFromAddress;

    console.log('[Geocode] Validation params:', { expectedCity, expectedState, expectedZip: finalExpectedZip });

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.error('[Geocode] No results found for address:', address);
      return null;
    }

    // CRITICAL: If multiple results, prefer the one matching expected ZIP AND street suffix
    // This prevents wrong property when "100 160th Street" vs "100 160th Court" exist
    if (data.results.length > 1) {
      console.warn(`[Geocode] ⚠️ Multiple results (${data.results.length}) for address: ${address}`);

      // Extract street suffix from user query (Street, St, Court, Ct, Avenue, Ave, etc.)
      const suffixMatch = address.match(/\b(Street|St|Court|Ct|Avenue|Ave|Drive|Dr|Road|Rd|Lane|Ln|Boulevard|Blvd|Way|Place|Pl|Circle|Cir|Terrace|Ter|Parkway|Pkwy)\b/i);
      const expectedSuffix = suffixMatch ? suffixMatch[1].toLowerCase() : null;

      if (finalExpectedZip || expectedSuffix || expectedCity || expectedState) {
        // Try to find result matching ALL expected params: city, state, ZIP, and street suffix
        const matchingResult = data.results.find((r: any) => {
          const components = r.address_components || [];
          const formattedAddress = r.formatted_address || '';

          // Check CITY match (locality or sublocality)
          let cityMatches = !expectedCity;
          if (expectedCity) {
            const city = components.find((c: any) =>
              c.types.includes('locality') || c.types.includes('sublocality'));
            if (city) {
              // Normalize both for comparison (handle "St Pete Beach" vs "St. Pete Beach")
              const normalizedExpected = expectedCity.toLowerCase().replace(/\./g, '');
              const normalizedActual = city.long_name.toLowerCase().replace(/\./g, '');
              cityMatches = normalizedActual === normalizedExpected ||
                           normalizedActual.includes(normalizedExpected) ||
                           normalizedExpected.includes(normalizedActual);
            }
          }

          // Check STATE match
          let stateMatches = !expectedState;
          if (expectedState) {
            const state = components.find((c: any) => c.types.includes('administrative_area_level_1'));
            if (state) {
              stateMatches = state.short_name === expectedState || state.long_name === expectedState;
            }
          }

          // Check ZIP match
          let zipMatches = !finalExpectedZip;
          if (finalExpectedZip) {
            const zip = components.find((c: any) => c.types.includes('postal_code'));
            zipMatches = zip && zip.long_name === finalExpectedZip;
          }

          // Check street suffix match
          let suffixMatches = !expectedSuffix;
          if (expectedSuffix) {
            const normalizedSuffix = expectedSuffix.replace(/^(street|court|avenue|drive|road|lane|boulevard|place|circle|terrace|parkway)$/i, (match) => {
              const abbrevMap: Record<string, string> = {
                'street': 'st', 'court': 'ct', 'avenue': 'ave', 'drive': 'dr',
                'road': 'rd', 'lane': 'ln', 'boulevard': 'blvd', 'place': 'pl',
                'circle': 'cir', 'terrace': 'ter', 'parkway': 'pkwy'
              };
              return abbrevMap[match.toLowerCase()] || match;
            });

            // Check if formatted address contains the expected suffix (or its abbreviation)
            const addressLower = formattedAddress.toLowerCase();
            const hasFullSuffix = addressLower.includes(` ${expectedSuffix.toLowerCase()} `) ||
                                  addressLower.includes(` ${expectedSuffix.toLowerCase()},`);
            const hasAbbrevSuffix = addressLower.includes(` ${normalizedSuffix} `) ||
                                    addressLower.includes(` ${normalizedSuffix},`);
            suffixMatches = hasFullSuffix || hasAbbrevSuffix;
          }

          const allMatch = cityMatches && stateMatches && zipMatches && suffixMatches;
          if (allMatch) {
            console.log('[Geocode] ✅ Found match:', formattedAddress, { cityMatches, stateMatches, zipMatches, suffixMatches });
          }
          return allMatch;
        });

        if (matchingResult) {
          console.log(`[Geocode] ✅ Selected result matching city=${expectedCity||'any'} state=${expectedState||'any'} ZIP=${finalExpectedZip||'any'} suffix=${expectedSuffix||'any'}`);
          const result = matchingResult;
          let county = '';
          let zipCode = '';
          let state = '';
          for (const component of result.address_components) {
            if (component.types.includes('administrative_area_level_2')) {
              county = component.long_name;
            }
            if (component.types.includes('postal_code')) {
              zipCode = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
              state = component.short_name; // e.g., "FL"
            }
          }
          return { lat: result.geometry.location.lat, lon: result.geometry.location.lng, county, zipCode, state };
        } else {
          console.warn(`[Geocode] ⚠️ No result matched expected city=${expectedCity||'any'} state=${expectedState||'any'} ZIP=${finalExpectedZip||'any'} suffix=${expectedSuffix||'any'}`);
          console.warn(`[Geocode] 🚨 CRITICAL: Using first result - MAY BE WRONG PROPERTY!`);
          console.warn(`[Geocode] Expected: ${expectedCity}, ${expectedState} ${finalExpectedZip}`);
          console.warn(`[Geocode] Available results:`);
          data.results.forEach((r: any, idx: number) => {
            console.warn(`  [${idx}] ${r.formatted_address}`);
          });
        }
      }
    }

    // Use first result (either single result or fallback when no ZIP match)
    const result = data.results[0];
    let county = '';
    let zipCode = '';
    let state = '';
    for (const component of result.address_components) {
      if (component.types.includes('administrative_area_level_2')) {
        county = component.long_name;
      }
      if (component.types.includes('postal_code')) {
        zipCode = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        state = component.short_name; // e.g., "FL"
      }
    }

    // Log warning if geocoded ZIP doesn't match expected ZIP
    if (expectedZip && zipCode && zipCode !== expectedZip) {
      console.error(`[Geocode] 🚨 ZIP MISMATCH! Expected: ${expectedZip}, Got: ${zipCode} for address: ${address}`);
      console.error(`[Geocode] County: ${county}, State: ${state}, Lat/Lon: ${result.geometry.location.lat}, ${result.geometry.location.lng}`);
    }

    return { lat: result.geometry.location.lat, lon: result.geometry.location.lng, county, zipCode, state };
  } catch (e) {
    console.error('[Geocode] Error:', e);
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
  console.log('🔍 [DIAGNOSIS] getFloodZone() CALLED with:', { lat, lon });
  console.log(`🔵 [FEMA] Calling API for coordinates: ${lat}, ${lon}`);
  try {
    // Updated 2025-12-04: FEMA changed URL from /gis/nfhl/rest to /arcgis/rest
    const url = `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query?where=1%3D1&geometry=${lon}%2C${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE%2CZONE_SUBTY%2CSFHA_TF&returnGeometry=false&f=json`;
    const fetchResult = await safeFetch<any>(url, undefined, 'FEMA-Flood', 60000); // 60s timeout

    if (!fetchResult.success || !fetchResult.data) {
      console.error(`❌ [FEMA] Fetch failed: ${fetchResult.error || 'Unknown error'}`);
      return {};
    }

    const data = fetchResult.data;
    console.log(`🔵 [FEMA] Response status: ${fetchResult.status}, features: ${data.features?.length || 0}`);

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
  if (!apiKey) {
    console.log('[AirNow] API key not configured');
    return {};
  }

  try {
    const url = `https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${lat}&longitude=${lon}&distance=25&API_KEY=${apiKey}`;
    console.log('[AirNow] Fetching air quality for lat:', lat, 'lon:', lon);
    const response = await fetch(url);
    const data = await response.json();
    console.log('[AirNow] API response:', JSON.stringify(data).substring(0, 200));

    // FIXED: Split AQI and Grade into separate fields (Field 117 and 118)
    if (data?.[0]) {
      const aqi = data[0].AQI;
      const grade = data[0].Category?.Name || '';
      console.log('[AirNow] ✅ Setting Field 117 (AQI):', aqi, 'and Field 118 (Grade):', grade);

      return {
        '117_air_quality_index': { value: aqi, source: 'AirNow', confidence: 'High' },
        '118_air_quality_grade': { value: grade, source: 'AirNow', confidence: 'High' }
      };
    } else {
      console.warn('[AirNow] ⚠️ No data in response or empty array');
    }
  } catch (e) {
    console.error('[AirNow] Error:', e);
  }
  return {};
}

// U.S. Census API - Vacancy Rate
async function getCensusData(zipCode: string): Promise<Record<string, any>> {
  console.log('🔍 [DIAGNOSIS] getCensusData() CALLED with:', { zipCode });

  const apiKey = process.env.CENSUS_API_KEY;
  if (!apiKey) {
    console.log('❌ [Census] CENSUS_API_KEY not set in environment variables');
    console.log('🔍 [DIAGNOSIS] Census SKIPPED - API key missing');
    return {};
  }
  console.log('🔍 [DIAGNOSIS] Census API key exists:', !!apiKey);

  if (!zipCode || zipCode === '') {
    console.log('🔍 [DIAGNOSIS] Census SKIPPED - zipCode is empty or missing!');
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
        source: 'U.S. Census',
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

// BroadbandNow REMOVED (2025-11-27) - Scraper was blocked and not wired
// Internet provider data now comes from LLM cascade (fields 96-98)

// Weather.com API - Climate data
async function getClimateData(lat: number, lon: number): Promise<Record<string, any>> {
  console.log('🔍 [DIAGNOSIS] getClimateData() CALLED with:', { lat, lon });

  const apiKey = process.env.WEATHERCOM_API_KEY || process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    console.log('❌ [Weather] Neither WEATHERCOM_API_KEY nor OPENWEATHERMAP_API_KEY set in environment variables');
    console.log('🔍 [DIAGNOSIS] Weather SKIPPED - API key missing');
    return {};
  }
  console.log('🔍 [DIAGNOSIS] Weather API key exists:', !!apiKey);
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
      // OpenWeatherMap format - estimate solar potential from current conditions
      // NOTE: Current weather conditions removed from field 121_climate_risk
      // Field 121 is for climate RISK assessment (FEMA/NOAA), not current temperature

      // Estimate solar potential based on cloud cover and weather conditions
      let solarPotential = 'Moderate';
      const cloudCover = data.clouds?.all || 50; // Cloud cover percentage (0-100)
      const weatherMain = data.weather?.[0]?.main || '';

      if (cloudCover <= 20 && !['Rain', 'Drizzle', 'Thunderstorm', 'Snow'].includes(weatherMain)) {
        solarPotential = 'High';
      } else if (cloudCover >= 70 || ['Rain', 'Drizzle', 'Thunderstorm', 'Snow'].includes(weatherMain)) {
        solarPotential = 'Low';
      }

      fields['130_solar_potential'] = {
        value: `${solarPotential} (${cloudCover}% cloud cover)`,
        source: 'Weather',
        confidence: 'Medium'
      };
    } else if (!isOpenWeather && data) {
      // Weather.com format
      // NOTE: Current weather conditions removed from field 121_climate_risk
      // Field 121 is for climate RISK assessment (FEMA/NOAA), not current temperature
      // Weather API does not provide climate risk data

      // UV Index for solar potential estimate (Weather.com only)
      if (data.uvIndex !== undefined) {
        let solarPotential = 'Low';
        if (data.uvIndex >= 6) solarPotential = 'High';
        else if (data.uvIndex >= 3) solarPotential = 'Moderate';

        fields['130_solar_potential'] = {
          value: `${solarPotential} (UV Index: ${data.uvIndex})`,
          source: 'Weather',
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

  // Helper: Calculate straight-line distance to nearest coastline point
  // Comprehensive Florida coastline points (Gulf, Atlantic, Intracoastal, Tampa Bay, Biscayne Bay)
  const calculateCoastlineDistance = (propLat: number, propLon: number): number => {
    const coastlinePoints = [
      // Gulf Coast - Panhandle (West to East)
      { lat: 30.3935, lon: -87.2169 }, // Pensacola Beach
      { lat: 30.3960, lon: -86.4958 }, // Destin
      { lat: 30.1588, lon: -85.6557 }, // Panama City Beach
      { lat: 29.9074, lon: -84.9808 }, // St. George Island
      { lat: 29.6516, lon: -84.3483 }, // Shell Point

      // Gulf Coast - Big Bend
      { lat: 29.1348, lon: -83.0353 }, // Cedar Key
      { lat: 28.8206, lon: -82.7579 }, // Crystal River
      { lat: 28.5383, lon: -82.6465 }, // Homosassa

      // Gulf Coast - Tampa Bay Area
      { lat: 28.3922, lon: -82.7381 }, // Weeki Wachee
      { lat: 28.2181, lon: -82.7709 }, // Bayport
      { lat: 28.1070, lon: -82.7376 }, // Hudson Beach
      { lat: 28.0156, lon: -82.7523 }, // New Port Richey
      { lat: 27.9506, lon: -82.4572 }, // Tampa Bay
      { lat: 27.8483, lon: -82.7618 }, // Clearwater Beach
      { lat: 27.7949, lon: -82.8401 }, // Madeira Beach / Treasure Island
      { lat: 27.7676, lon: -82.6403 }, // St. Pete Beach
      { lat: 27.6648, lon: -82.7282 }, // Pass-a-Grille

      // Gulf Coast - Central West
      { lat: 27.4989, lon: -82.5748 }, // Anna Maria Island
      { lat: 27.4706, lon: -82.7034 }, // Bradenton Beach
      { lat: 27.3364, lon: -82.5307 }, // Sarasota / Lido Key
      { lat: 27.2052, lon: -82.4543 }, // Siesta Key
      { lat: 27.0339, lon: -82.4515 }, // Venice Beach
      { lat: 26.9342, lon: -82.2810 }, // Fort Myers Beach
      { lat: 26.5629, lon: -82.0231 }, // Sanibel Island
      { lat: 26.4619, lon: -81.9480 }, // Captiva Island

      // Gulf Coast - Southwest
      { lat: 26.3856, lon: -81.8073 }, // Bonita Beach
      { lat: 26.1420, lon: -81.7948 }, // Naples
      { lat: 25.9399, lon: -81.7081 }, // Marco Island
      { lat: 25.8615, lon: -81.3792 }, // Everglades City

      // Florida Keys - Upper & Middle
      { lat: 25.5516, lon: -80.3997 }, // Key Largo
      { lat: 25.1372, lon: -80.6137 }, // Islamorada
      { lat: 24.7210, lon: -81.1060 }, // Marathon
      { lat: 24.5557, lon: -81.7782 }, // Key West

      // Atlantic Coast - Southeast
      { lat: 25.7617, lon: -80.1918 }, // Miami Beach
      { lat: 25.8736, lon: -80.1239 }, // Sunny Isles Beach
      { lat: 26.1224, lon: -80.0993 }, // Hollywood Beach
      { lat: 26.1420, lon: -80.0989 }, // Dania Beach
      { lat: 26.1224, lon: -80.1043 }, // Fort Lauderdale Beach
      { lat: 26.2159, lon: -80.0978 }, // Pompano Beach
      { lat: 26.3683, lon: -80.0832 }, // Boca Raton Beach
      { lat: 26.7056, lon: -80.0364 }, // Palm Beach
      { lat: 26.9478, lon: -80.0503 }, // Jupiter Beach

      // Atlantic Coast - Treasure Coast
      { lat: 27.2046, lon: -80.1937 }, // Stuart Beach
      { lat: 27.4667, lon: -80.3256 }, // Fort Pierce Beach
      { lat: 27.6648, lon: -80.3675 }, // Vero Beach
      { lat: 27.8106, lon: -80.4773 }, // Sebastian Inlet

      // Atlantic Coast - Space Coast
      { lat: 28.0837, lon: -80.6081 }, // Melbourne Beach
      { lat: 28.3922, lon: -80.6077 }, // Cocoa Beach
      { lat: 28.4158, lon: -80.6098 }, // Cape Canaveral
      { lat: 28.9931, lon: -80.8270 }, // New Smyrna Beach
      { lat: 29.2283, lon: -81.0226 }, // Daytona Beach
      { lat: 29.6684, lon: -81.2081 }, // Flagler Beach

      // Atlantic Coast - Northeast
      { lat: 29.9510, lon: -81.3124 }, // Marineland
      { lat: 30.2672, lon: -81.3993 }, // St. Augustine Beach
      { lat: 30.3322, lon: -81.3928 }, // Vilano Beach
      { lat: 30.4213, lon: -81.4313 }, // Ponte Vedra Beach
      { lat: 30.6954, lon: -81.5074 }, // Jacksonville Beach
      { lat: 30.7335, lon: -81.4421 }, // Atlantic Beach
      { lat: 30.6727, lon: -81.4651 }, // Neptune Beach
      { lat: 30.5427, lon: -81.4446 }, // Fernandina Beach
    ];

    let minDistance = Infinity;
    for (const point of coastlinePoints) {
      const R = 3959; // Earth radius in miles
      const dLat = (point.lat - propLat) * Math.PI / 180;
      const dLon = (point.lon - propLon) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(propLat * Math.PI / 180) * Math.cos(point.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      minDistance = Math.min(minDistance, distance);
    }
    return minDistance;
  };

  const actualCoastDistance = calculateCoastlineDistance(lat, lon);
  console.log(`getDistances: Actual coastline distance: ${actualCoastDistance.toFixed(1)} mi`);

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
          const googleMiles = (meters / 1609.34).toFixed(1);

          // BEACH/WATERFRONT VALIDATION:
          // Google Places finds "beaches" (named locations like public beach parks)
          // For waterfront properties, actual coastline distance is more accurate
          if (place.type === 'beach') {
            // If property is within 0.5 mi of actual coast/bay/intracoastal, use that distance
            // This handles waterfront homes that Google thinks are far from "beaches"
            if (actualCoastDistance < 0.5) {
              console.log(`⚠️ Waterfront property detected: coastline ${actualCoastDistance.toFixed(2)} mi, Google says ${googleMiles} mi to "${nearest.name}" - using coastline distance`);
              fields[place.field] = {
                value: parseFloat(actualCoastDistance.toFixed(1)),
                source: 'Coastline Calculation',
                confidence: 'High',
                details: 'Waterfront property'
              };
            } else {
              // Not waterfront - use Google Places distance to nearest named beach
              fields[place.field] = {
                value: parseFloat(googleMiles),
                source: 'Google Places',
                confidence: 'High',
                details: nearest.name
              };
            }
          } else {
            // Non-beach amenities - always use Google Places
            fields[place.field] = {
              value: parseFloat(googleMiles),
              source: 'Google Places',
              confidence: 'High',
              details: nearest.name
            };
          }
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
    { type: 'primary_school', nameField: '65_elementary_school', distField: '67_elementary_distance_mi', name: 'Elementary School' },
    { type: 'secondary_school', nameField: '68_middle_school', distField: '70_middle_distance_mi', name: 'Middle School' },
    { type: 'school', keyword: 'high school', nameField: '71_high_school', distField: '73_high_distance_mi', name: 'High School' },
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

          // Set school name (Fields 65, 68, 71)
          fields[school.nameField] = {
            value: nearest.name,
            source: 'Google Places',
            confidence: 'High'
          };

          // Set school distance (Fields 67, 70, 73)
          fields[school.distField] = {
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
    // CRITICAL: Differentiate between rail stations and bus stops
    // Google Places "transit_station" includes ALL transit (buses, trains, etc.)
    // Use specific types to provide accurate descriptions

    // Search for rail/subway stations (high-value transit)
    const railUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin}&radius=1609&type=subway_station&key=${apiKey}`;
    const railRes = await fetch(railUrl);
    const railData = await railRes.json();

    // Search for light rail/tram
    const lightRailUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin}&radius=1609&type=light_rail_station&key=${apiKey}`;
    const lightRailRes = await fetch(lightRailUrl);
    const lightRailData = await lightRailRes.json();

    // Search for bus stops
    const busUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin}&radius=1609&type=bus_station&key=${apiKey}`;
    const busRes = await fetch(busUrl);
    const busData = await busRes.json();

    const railCount = (railData.results?.length || 0) + (lightRailData.results?.length || 0);
    const busCount = busData.results?.length || 0;
    const totalCount = railCount + busCount;

    // Field 81 = public_transit_access per fields-schema.ts
    if (totalCount > 0) {
      let description = 'Yes - ';
      const parts: string[] = [];

      if (railCount > 0) {
        parts.push(`${railCount} rail station${railCount > 1 ? 's' : ''}`);
      }
      if (busCount > 0) {
        parts.push(`${busCount} bus stop${busCount > 1 ? 's' : ''}`);
      }

      description += parts.join(' + ') + ' within 1 mile';

      // Add sample names (prioritize rail stations)
      const sampleStations: string[] = [];
      if (railData.results && railData.results.length > 0) {
        sampleStations.push(...railData.results.slice(0, 2).map((s: any) => s.name));
      }
      if (lightRailData.results && lightRailData.results.length > 0 && sampleStations.length < 2) {
        sampleStations.push(...lightRailData.results.slice(0, 2 - sampleStations.length).map((s: any) => s.name));
      }
      if (busData.results && busData.results.length > 0 && sampleStations.length < 2) {
        sampleStations.push(...busData.results.slice(0, 2 - sampleStations.length).map((s: any) => s.name));
      }

      if (sampleStations.length > 0) {
        description += `: ${sampleStations.join(', ')}`;
      }

      fields['81_public_transit_access'] = {
        value: description,
        source: 'Google Places',
        confidence: 'High'
      };

      console.log(`[Transit Access] Found ${railCount} rail + ${busCount} bus stops within 1 mile`);
    } else {
      // No transit found within 1 mile
      // Check for bus stops at 0.5 mile radius as fallback
      const busNearUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin}&radius=805&type=bus_station&key=${apiKey}`;
      const busNearRes = await fetch(busNearUrl);
      const busNearData = await busNearRes.json();

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

// Google Places - Emergency Services Distance (Field 116)
async function getEmergencyServicesDistance(lat: number, lon: number): Promise<Record<string, any>> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.log('[Emergency Services] GOOGLE_MAPS_API_KEY not set');
    return {};
  }

  console.log(`[Emergency Services] Searching near: ${lat}, ${lon}`);
  const origin = `${lat},${lon}`;
  const fields: Record<string, any> = {};

  const services = [
    { type: 'fire_station', name: 'Fire Station' },
    { type: 'police', name: 'Police Station' },
    { type: 'hospital', name: 'Hospital' }
  ];

  const distances: number[] = [];
  const details: string[] = [];

  for (const service of services) {
    try {
      const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin}&rankby=distance&type=${service.type}&key=${apiKey}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (searchData.status && searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
        console.log(`[Emergency Services] API error for ${service.name}: ${searchData.status}`);
        continue;
      }

      if (searchData.results && searchData.results.length > 0) {
        const nearest = searchData.results[0];
        const destLat = nearest.geometry.location.lat;
        const destLon = nearest.geometry.location.lng;

        const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destLat},${destLon}&units=imperial&key=${apiKey}`;
        const distRes = await fetch(distUrl);
        const distData = await distRes.json();

        if (distData.rows?.[0]?.elements?.[0]?.distance) {
          const meters = distData.rows[0].elements[0].distance.value;
          const miles = meters / 1609.34;
          distances.push(miles);
          details.push(`${service.name}: ${miles.toFixed(1)} mi`);
          console.log(`[Emergency Services] ${service.name}: ${miles.toFixed(1)} mi (${nearest.name})`);
        }
      }
    } catch (e) {
      console.error(`[Emergency Services] Error getting ${service.name}:`, e);
    }
  }

  if (distances.length > 0) {
    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    fields['116_emergency_services_distance'] = {
      value: `${avgDistance.toFixed(1)} mi avg`,
      source: 'Google Places',
      confidence: 'High',
      details: details.join(', ')
    };
    console.log(`[Emergency Services] Average distance: ${avgDistance.toFixed(1)} mi`);
  }

  return fields;
}

// Google Distance Matrix - Commute time to downtown
async function getCommuteTime(lat: number, lon: number, county: string): Promise<Record<string, any>> {
  console.log('🔍 [DIAGNOSIS] getCommuteTime() CALLED with:', { lat, lon, county });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.log('🔍 [DIAGNOSIS] Google Distance SKIPPED - API key missing');
    return {};
  }
  console.log('🔍 [DIAGNOSIS] Google Distance API key exists:', !!apiKey);

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
    console.log('🔍 [DIAGNOSIS] Google Distance making API call to:', downtown.name);
    const response = await fetch(url);
    const data = await response.json();
    console.log('🔍 [DIAGNOSIS] Google Distance response status:', data.status);

    // Field 82 = commute_to_city_center per fields-schema.ts
    if (data.rows?.[0]?.elements?.[0]?.duration_in_traffic) {
      console.log('🔍 [DIAGNOSIS] Google Distance SUCCESS - returning field 82');
      return {
        '82_commute_to_city_center': {
          value: data.rows[0].elements[0].duration_in_traffic.text,
          source: 'Google Distance',
          confidence: 'High',
          details: `To ${downtown.name}`
        }
      };
    } else if (data.rows?.[0]?.elements?.[0]?.duration) {
      console.log('🔍 [DIAGNOSIS] Google Distance SUCCESS (no traffic) - returning field 82');
      return {
        '82_commute_to_city_center': {
          value: data.rows[0].elements[0].duration.text,
          source: 'Google Distance',
          confidence: 'High',
          details: `To ${downtown.name}`
        }
      };
    }
    console.log('🔍 [DIAGNOSIS] Google Distance FAILED - no valid data in response');
  } catch (e) {
    console.error('Commute time error:', e);
    console.log('🔍 [DIAGNOSIS] Google Distance EXCEPTION:', e);
  }

  console.log('🔍 [DIAGNOSIS] Google Distance returning empty {}');
  return {};
}

async function enrichWithFreeAPIs(
  address: string,
  expectedCity?: string,
  expectedState?: string,
  expectedZip?: string
): Promise<Record<string, any>> {
  console.log('🔵 [enrichWithFreeAPIs] START - Address:', address);
  console.log('🔵 [enrichWithFreeAPIs] Validation:', { expectedCity, expectedState, expectedZip });

  const geo = await geocodeAddress(address, expectedCity, expectedState, expectedZip);
  if (!geo) {
    console.log('❌ [enrichWithFreeAPIs] FAILED - Geocoding returned null or wrong location');
    console.log('🔍 [DIAGNOSIS] Geocoding failed for address:', address);
    console.log('🔍 [DIAGNOSIS] Expected location:', { city: expectedCity, state: expectedState, zip: expectedZip });
    console.log('🔍 [DIAGNOSIS] This will cause ALL 22 APIs to be skipped!');
    return {};
  }

  console.log('✅ [enrichWithFreeAPIs] Geocoding success:', { lat: geo.lat, lon: geo.lon, county: geo.county, zipCode: geo.zipCode, state: geo.state });
  console.log('🔍 [DIAGNOSIS] Geocoding returned all required parameters:');
  console.log('🔍 [DIAGNOSIS]   - lat/lon for Google Distance, FEMA Flood, Weather APIs:', geo.lat, geo.lon);
  console.log('🔍 [DIAGNOSIS]   - zipCode for Census API:', geo.zipCode || 'MISSING!');
  console.log('🔍 [DIAGNOSIS]   - county for Google Distance API:', geo.county || 'MISSING!');

  const fields: Record<string, any> = {};
  // Field 7 = county per fields-schema.ts
  fields['7_county'] = { value: geo.county, source: 'Google Geocode', confidence: 'High' };
  fields['coordinates'] = { value: { lat: geo.lat, lon: geo.lon }, source: 'Google Geocode', confidence: 'High' };

  console.log('🔵 [enrichWithFreeAPIs] Calling 22 APIs...');
  const apiStartTime = Date.now();

  // Extract ZIP code from geo object for Census API
  const zipCode = geo.zipCode || '';
  console.log('🔍 [DIAGNOSIS] Extracted zipCode for Census API:', zipCode || 'EMPTY!');

  // STEP 1: Call Google Places first to get beach distance (needed for accurate sea level risk)
  console.log('🔵 [Step 1/2] Calling Google Places for beach distance...');
  const distances = await getDistances(geo.lat, geo.lon);

  // Extract beach distance from Google Places result (field 87_distance_beach_mi)
  const beachDistanceMiles = distances['87_distance_beach_mi']?.value as number | undefined;
  console.log(`🔵 Beach distance extracted: ${beachDistanceMiles !== undefined ? beachDistanceMiles.toFixed(1) + ' mi' : 'unavailable'}`);

  // STEP 2: Call all other APIs in parallel (including NOAA Sea Level with beach distance)
  console.log('🔵 [Step 2/2] Calling remaining 22 APIs in parallel...');
  const [walkScore, floodZone, airQuality, censusData, noiseDataResult, climateData, commuteTime, schoolDistances, transitAccess, emergencyServices, crimeDataResult, schoolDiggerResult, femaRiskResult, noaaClimateResult, noaaStormResult, noaaSeaLevelResult, usgsElevationResult, usgsEarthquakeResult, epaFRSResult, epaRadonResult, streetViewResult, googleSolarResult/*, redfinResult*/] = await Promise.all([
    getWalkScore(geo.lat, geo.lon, address),
    getFloodZone(geo.lat, geo.lon),
    getAirQuality(geo.lat, geo.lon),
    getCensusData(zipCode),
    callHowLoud(geo.lat, geo.lon),
    getClimateData(geo.lat, geo.lon),
    getCommuteTime(geo.lat, geo.lon, geo.county),
    getSchoolDistances(geo.lat, geo.lon),
    getTransitAccess(geo.lat, geo.lon),
    getEmergencyServicesDistance(geo.lat, geo.lon), // Field 116: Emergency Services Distance
    callCrimeGrade(geo.lat, geo.lon, address),
    callSchoolDigger(geo.lat, geo.lon),
    callFEMARiskIndex(geo.county, 'FL'),
    callNOAAClimate(geo.lat, geo.lon, geo.zipCode, geo.county), // RE-ENABLED: Detailed climate risk analysis
    callNOAAStormEvents(geo.county, geo.state || 'FL'), // RE-ENABLED: Historical hurricane/tornado data
    callNOAASeaLevel(geo.lat, geo.lon, beachDistanceMiles), // Pass accurate beach distance from Google Places
    callUSGSElevation(geo.lat, geo.lon),
    callUSGSEarthquake(geo.lat, geo.lon),
    callEPAFRS(geo.lat, geo.lon),
    getRadonRisk(geo.county, 'FL'),
    callGoogleStreetView(geo.lat, geo.lon, address), // FALLBACK: Property front photo from Google Street View
    callGoogleSolarAPI(geo.lat, geo.lon) // Google Solar API: Rooftop solar potential
    // callRedfinProperty(address) // DISABLED: Redfin API autocomplete not working - returns dummy school data
  ]);

  // Extract fields from API result objects
  const crimeData = crimeDataResult.fields || {};
  const schoolDiggerData = schoolDiggerResult.fields || {};

  // FALLBACK: GreatSchools API if SchoolDigger missing ratings (Fields 66, 69, 72)
  // NOTE: School names come from Google Places (schoolDistances), not SchoolDigger
  let greatSchoolsData: Record<string, any> = {};
  const missingElemRating = !schoolDiggerData['66_elementary_rating'];
  const missingMidRating = !schoolDiggerData['69_middle_rating'];
  const missingHighRating = !schoolDiggerData['72_high_rating'];

  if (missingElemRating || missingMidRating || missingHighRating) {
    console.log(`[GreatSchools Fallback] SchoolDigger missing ratings - attempting GreatSchools API`);
    // Get school names from Google Places (schoolDistances), not SchoolDigger
    const schoolNames = {
      elem: missingElemRating && typeof schoolDistances['65_elementary_school']?.value === 'string' ? schoolDistances['65_elementary_school'].value : undefined,
      middle: missingMidRating && typeof schoolDistances['68_middle_school']?.value === 'string' ? schoolDistances['68_middle_school'].value : undefined,
      high: missingHighRating && typeof schoolDistances['71_high_school']?.value === 'string' ? schoolDistances['71_high_school'].value : undefined
    };

    console.log('[GreatSchools Fallback] School names from Google Places:', schoolNames);

    if (schoolNames.elem || schoolNames.middle || schoolNames.high) {
      const greatSchoolsResult = await callGreatSchools(geo.lat, geo.lon, schoolNames);
      greatSchoolsData = greatSchoolsResult.fields || {};
      console.log(`[GreatSchools Fallback] Retrieved ${Object.keys(greatSchoolsData).length} rating fields`);
    }
  }

  const femaRiskData = femaRiskResult.fields || {}; // FEMA Risk Index
  const noaaClimateData = noaaClimateResult.fields || {}; // NOAA Climate risk analysis
  const noaaStormData = noaaStormResult.fields || {}; // NOAA Storm Events (hurricanes/tornadoes)
  const noaaSeaLevelData = noaaSeaLevelResult.fields || {};
  const usgsElevationData = usgsElevationResult.fields || {};
  const usgsEarthquakeData = usgsEarthquakeResult.fields || {};
  const epaFRSData = epaFRSResult.fields || {};
  const epaRadonData = epaRadonResult.fields || {};
  const streetViewData = streetViewResult.fields || {}; // Google Street View fallback photos
  const googleSolarData = googleSolarResult.fields || {}; // Google Solar API: Rooftop solar potential
  const noiseData = noiseDataResult.fields || {}; // HowLoud API: Noise and traffic levels
  // const redfinData = redfinResult.fields || {}; // DISABLED: Redfin API not working

  const apiEndTime = Date.now();
  console.log(`✅ [enrichWithFreeAPIs] All APIs completed in ${apiEndTime - apiStartTime}ms`);

  Object.assign(fields, walkScore, floodZone, airQuality, censusData, noiseData, distances, commuteTime, schoolDistances, transitAccess, emergencyServices, crimeData, schoolDiggerData, greatSchoolsData, femaRiskData, noaaClimateData, noaaStormData, noaaSeaLevelData, usgsElevationData, usgsEarthquakeData, epaFRSData, epaRadonData, streetViewData, googleSolarData, climateData/*, redfinData*/);

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
  console.log('  - EmergencyServices fields:', Object.keys(emergencyServices || {}).length);
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
  console.log('  - Google Street View fields:', Object.keys(streetViewData || {}).length);
  console.log('  - Google Solar API fields:', Object.keys(googleSolarData || {}).length);
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
  fields['__GOOGLE_SOLAR_COUNT__'] = { value: Object.keys(googleSolarData || {}).length, source: 'INTERNAL', confidence: 'High' };

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

// ============================================
// PERPLEXITY - HAS REAL WEB SEARCH
// Consolidated 5-prompt system recommended by Perplexity team
// ============================================

/**
 * PROMPT A: Listing Portals & Neighborhood Pricing
 */
async function callPerplexityPromptA(address: string, context: any = {}): Promise<Record<string, any>> {
  if (isRateLimited('perplexity')) {
    console.log(`⏭️ [Perplexity A] Skipping - rate limited`);
    return {};
  }

  const userPrompt = buildPromptA(
    address,
    context.city || 'Unknown',
    context.county || 'Unknown'
  );

  return await callPerplexityWithMapping('Prompt A', userPrompt);
}

/**
 * PROMPT B: County / Public Records
 */
async function callPerplexityPromptB(address: string, context: any = {}): Promise<Record<string, any>> {
  if (isRateLimited('perplexity')) {
    console.log(`⏭️ [Perplexity B] Skipping - rate limited`);
    return {};
  }

  const userPrompt = buildPromptB(
    address,
    context.county || 'Unknown',
    context.parcelId
  );

  return await callPerplexityWithMapping('Prompt B', userPrompt);
}

/**
 * PROMPT C: Schools, Walkability, Crime
 */
async function callPerplexityPromptC(address: string, context: any = {}): Promise<Record<string, any>> {
  if (isRateLimited('perplexity')) {
    console.log(`⏭️ [Perplexity C] Skipping - rate limited`);
    return {};
  }

  const userPrompt = buildPromptC(
    address,
    context.city || 'Unknown',
    context.county || 'Unknown'
  );

  return await callPerplexityWithMapping('Prompt C', userPrompt);
}

/**
 * PROMPT D: Utilities & Recurring Bills
 */
async function callPerplexityPromptD(address: string, context: any = {}): Promise<Record<string, any>> {
  if (isRateLimited('perplexity')) {
    console.log(`⏭️ [Perplexity D] Skipping - rate limited`);
    return {};
  }

  const promptContext: PromptDContext = {
    address,
    city: context.city || 'Unknown',
    state: context.state || 'FL',
    zip: context.zip || '',
    bedrooms: context.bedrooms,
    bathrooms: context.bathrooms || context.total_bathrooms,
    hasPool: context.pool_yn || context.hasPool || false,
    sqft: context.sqft || context.living_sqft,
    floors: context.floors || context.stories,
    yearBuilt: context.yearBuilt || context.year_built
  };

  const userPrompt = buildPromptD(promptContext);

  return await callPerplexityWithMapping('Prompt D', userPrompt);
}

/**
 * PROMPT E: Comparable Sales (Optional)
 */
async function callPerplexityPromptE(address: string, context: any = {}): Promise<Record<string, any>> {
  if (isRateLimited('perplexity')) {
    console.log(`⏭️ [Perplexity E] Skipping - rate limited`);
    return {};
  }

  const userPrompt = buildPromptE(
    address,
    context.city || 'Unknown'
  );

  return await callPerplexityWithMapping('Prompt E', userPrompt);
}

/**
 * Shared Perplexity API caller with field mapping
 */
async function callPerplexityWithMapping(promptName: string, userPrompt: string): Promise<Record<string, any>> {
  if (isRateLimited('perplexity')) {
    console.log(`⏭️ [Perplexity ${promptName}] Skipping - rate limited`);
    return {};
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.error(`❌ [Perplexity ${promptName}] PERPLEXITY_API_KEY not set`);
    return {};
  }

  try {
    console.log(`✅ [Perplexity ${promptName}] Calling API...`);
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        ...PERPLEXITY_CONFIG,
        messages: [
          { role: 'system', content: PERPLEXITY_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ [Perplexity ${promptName}] API error: ${response.status} ${response.statusText}`);
      if (response.status === 429) setRateLimited('perplexity');
      return {};
    }

    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      console.log(`✅ [Perplexity ${promptName}] Response received (${text.length} chars)`);
      console.log(`📝 [Perplexity ${promptName}] Raw response (first 500 chars): ${text.substring(0, 500)}`);

      const cleaned = stripJsonCodeFences(text);

      // Try multiple JSON extraction methods
      let candidate: string | null = null;

      // Method 1: Try parsing cleaned text directly
      try {
        JSON.parse(cleaned);
        candidate = cleaned;
        console.log(`✅ [Perplexity ${promptName}] Method 1: Direct parse succeeded`);
      } catch {
        // Method 2: Extract first JSON object
        candidate = extractFirstJsonObject(cleaned);
        if (candidate) {
          console.log(`✅ [Perplexity ${promptName}] Method 2: extractFirstJsonObject succeeded`);
        } else {
          // Method 3: Try regex extraction as fallback
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            candidate = jsonMatch[0];
            console.log(`✅ [Perplexity ${promptName}] Method 3: Regex extraction succeeded`);
          }
        }
      }

      if (candidate) {
        try {
          const parsed = JSON.parse(candidate);

          // Check for nested structures (data_fields, fields, etc.)
          const fieldsToMap = parsed.data_fields || parsed.fields || parsed;
          console.log(`✅ [Perplexity ${promptName}] Parsed structure: ${parsed.data_fields ? 'data_fields' : parsed.fields ? 'fields' : 'flat'}`);

          // Map natural field names to schema field IDs
          const mapped = mapPerplexityFieldsToSchema(fieldsToMap);
          const rawCount = Object.keys(mapped).length;
          console.log(`✅ [Perplexity ${promptName}] Mapped ${rawCount} fields to schema IDs`);

          // Filter null values
          const filteredFields = filterNullValues(mapped, `Perplexity ${promptName}`);
          const finalCount = Object.keys(filteredFields).length;
          console.log(`✅ [Perplexity ${promptName}] Returning ${finalCount} fields after filtering`);

          // Upgrade confidence to High for Perplexity (has web search)
          for (const key of Object.keys(filteredFields)) {
            if (filteredFields[key] && typeof filteredFields[key] === 'object') {
              filteredFields[key].confidence = 'High';
              if (filteredFields[key].source && !filteredFields[key].source.includes('Perplexity')) {
                filteredFields[key].source = `${filteredFields[key].source} (via Perplexity)`;
              }
            }
          }

          return filteredFields;
        } catch (parseError) {
          console.error(`❌ [Perplexity ${promptName}] JSON parse error:`, parseError);
          console.error(`❌ [Perplexity ${promptName}] Candidate JSON (first 300 chars): ${candidate.substring(0, 300)}`);

          // Try to repair truncated JSON by closing unclosed braces
          try {
            const repaired = repairTruncatedJson(candidate);
            if (repaired !== candidate) {
              console.log(`🔧 [Perplexity ${promptName}] Attempting JSON repair...`);
              const repairedParsed = JSON.parse(repaired);
              const fieldsToMap = repairedParsed.data_fields || repairedParsed.fields || repairedParsed;
              const mapped = mapPerplexityFieldsToSchema(fieldsToMap);
              const filteredFields = filterNullValues(mapped, `Perplexity ${promptName}`);
              console.log(`✅ [Perplexity ${promptName}] JSON repair succeeded! Returning ${Object.keys(filteredFields).length} fields`);
              return filteredFields;
            }
          } catch (repairError) {
            console.error(`❌ [Perplexity ${promptName}] JSON repair also failed`);
          }
        }
      } else {
        console.log(`❌ [Perplexity ${promptName}] No JSON found in response`);
        console.log(`❌ [Perplexity ${promptName}] Cleaned text (first 500 chars): ${cleaned.substring(0, 500)}`);
      }
    } else {
      console.log(`❌ [Perplexity ${promptName}] No content in response`);
      console.log(`❌ [Perplexity ${promptName}] Full response: ${JSON.stringify(data).substring(0, 500)}`);
    }
    return {};
  } catch (error) {
    console.error(`❌ [Perplexity ${promptName}] Error:`, error);
    return {};
  }
}

// Helper functions for JSON extraction
function stripJsonCodeFences(text: string): string {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

/**
 * Attempts to repair truncated JSON by:
 * 1. Removing the last incomplete property
 * 2. Adding closing braces/brackets
 */
function repairTruncatedJson(json: string): string {
  let repaired = json.trim();

  // Count opening vs closing braces/brackets
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/]/g) || []).length;

  // If balanced, no repair needed
  if (openBraces === closeBraces && openBrackets === closeBrackets) {
    return json;
  }

  // Try to find the last complete property (ends with }, ], ", number, true, false, null)
  // Remove any trailing incomplete property
  const lastCompleteMatch = repaired.match(/^([\s\S]*(?:}|]|"|true|false|null|\d))\s*,?\s*"[^"]*"?\s*:?\s*(?:\{[^}]*)?$/);
  if (lastCompleteMatch) {
    repaired = lastCompleteMatch[1];
  }

  // Remove trailing comma if present
  repaired = repaired.replace(/,\s*$/, '');

  // Add missing closing brackets
  const missingBrackets = openBrackets - closeBrackets;
  for (let i = 0; i < missingBrackets; i++) {
    repaired += ']';
  }

  // Add missing closing braces
  const missingBraces = openBraces - closeBraces;
  for (let i = 0; i < missingBraces; i++) {
    repaired += '}';
  }

  return repaired;
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

// ============================================
// LLM CALLS (DISABLED - hallucinate without web access)
// ============================================

// Field definitions for the prompt - SYNCHRONIZED WITH fields-schema.ts (181 fields)
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
49. flooring_type, 50. kitchen_features, 51. appliances_included, 52. fireplace_yn, 53. primary_br_location

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

GROUP 23 - Market Performance (Fields 169-181):
169. zillow_views, 170. redfin_views, 171. homes_views, 172. realtor_views, 173. total_views,
174. saves_favorites, 175. market_type, 176. avg_sale_to_list_percent, 177. avg_days_to_pending,
178. multiple_offers_likelihood, 179. appreciation_percent, 180. price_trend, 181. rent_zestimate
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
51. appliances_included (from listing), 52. fireplace_yn (from listing), 53. primary_br_location (from listing)

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

Example format (use actual values from your web search, NOT these placeholders):
{
  "10_listing_price": { "value": <actual_price_number>, "source": "Zillow - <actual_url>" },
  "7_county": { "value": "<actual_county_name>", "source": "County Property Appraiser - <actual_url>" },
  "35_annual_taxes": { "value": <actual_tax_number>, "source": "County Tax Collector - <actual_url>" },
  "17_bedrooms": { "value": <actual_bedroom_count>, "source": "Redfin - <actual_url>" },
  "119_flood_zone": { "value": "<actual_FEMA_zone>", "source": "FEMA - <actual_url>" }
}

CRITICAL RULES:
- Use EXACT field keys: [number]_[field_name] (e.g., "10_listing_price", "7_county", "17_bedrooms")
- Replace ALL placeholders with ACTUAL values found via web search for the specific property
- If you CANNOT find verified data for a field, DO NOT include it in your response
- NEVER return null values - simply omit unfound fields
- Include source URL for every field you return
- Only return fields where you found REAL data from web search for THIS SPECIFIC ADDRESS`;

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
// SOURCE OF TRUTH: src/types/fields-schema.ts - ALL 181 FIELDS
const EXACT_FIELD_KEYS = `
EXACT FIELD KEYS - You MUST use these EXACT keys (number_fieldname format):

GROUP 1 - Address & Identity (Fields 1-9):
1_full_address, 2_mls_primary, 3_mls_secondary, 4_listing_status, 5_listing_date,
6_neighborhood, 7_county, 8_zip_code, 9_parcel_id,

GROUP 2 - Pricing & Value (Fields 10-16):
10_listing_price, 11_price_per_sqft, 12_market_value_estimate, 13_last_sale_date,
14_last_sale_price, 15_assessed_value, 16_avms,

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
49_flooring_type, 50_kitchen_features, 51_appliances_included, 52_fireplace_yn, 53_primary_br_location,

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

// ============================================
// CRITICAL FIELD DEFINITIONS FOR LLMs
// Prevents common confusions and ensures data freshness
// ============================================
const FIELD_CLARITY_RULES = `
## 🚨 CRITICAL FIELD DEFINITIONS (DO NOT CONFUSE!)

### CURRENT vs HISTORICAL DATA:
- **Field 10 (listing_price):** CURRENT asking price for active listings (property listed NOW, not from years ago!)
- **Field 14 (last_sale_price):** PRIOR sold price (historical, could be from years ago)
- **Field 4 (listing_status):** CURRENT status (Active/Pending/Sold NOW, not historical)
- **Field 5 (listing_date):** Date property was listed CURRENTLY (not prior listing dates)

### ANNUAL vs MONTHLY:
- **Field 31 (hoa_fee_annual):** ANNUAL HOA fee (if you find monthly, multiply by 12)
  - Example: "$250/month" = $3,000 for Field 31
- **Field 35 (annual_taxes):** ANNUAL property taxes (use most recent TAX YEAR)
  - Must include Field 36 (tax_year) to indicate which year

### TAX DATA REQUIREMENTS:
- **Field 35 & 36 MUST BE PAIRED:**
  - Field 35 (annual_taxes): $6,543
  - Field 36 (tax_year): 2023 (most recent completed tax year)
- Search county tax collector websites for authoritative data
- NEVER use tax data older than 2 years

### TIME-SENSITIVE FIELDS (MUST INCLUDE "AS OF" DATE):
- **Field 91 (median_home_price_neighborhood):** Include "as of [Month Year]"
  - Example: "Median home price: $425,000 as of November 2024"
- **Field 92 (price_per_sqft_recent_avg):** "Recent" = last 6 months
- **Field 95 (days_on_market_avg):** Average for properties sold in last 90 days
- **Field 98 (rental_estimate_monthly):** Current rental estimate "as of [Month Year]"
- **Field 103 (comparable_sales):** Sales within last 6 months only

### SQUARE FOOTAGE DISTINCTIONS:
- **Field 21 (living_sqft):** Interior heated/cooled living space ONLY (not garage!)
- **Field 22 (total_sqft_under_roof):** Living + garage + covered areas
- DO NOT use "total sqft" for "living sqft"

### BATHROOM DEFINITIONS:
- **Field 18 (full_bathrooms):** Toilet + sink + shower/tub
- **Field 19 (half_bathrooms):** Toilet + sink ONLY (no shower/tub)
- Count carefully! A "2.5 bath" home = 2 full + 1 half

### DATA FRESHNESS REQUIREMENTS:
✅ ACCEPT: Data from current year or last 6 months
⚠️ CAUTION: Data from last year (12-18 months old)
❌ REJECT: Data older than 18 months (except historical fields like Field 14)
`;

// BASE JSON RESPONSE FORMAT (shared)
const JSON_RESPONSE_FORMAT = `
${EXACT_FIELD_KEYS}

${FIELD_CLARITY_RULES}

RESPONSE FORMAT - Return ONLY valid JSON with EXACT field keys above (replace ALL placeholders with actual values):
{
  "fields": {
    "10_listing_price": { "value": <actual_number>, "source": "Zillow.com", "confidence": "High" },
    "7_county": { "value": "<actual_county>", "source": "Geographic knowledge", "confidence": "High" },
    "35_annual_taxes": { "value": <actual_number>, "source": "County Property Appraiser", "confidence": "High" },
    "17_bedrooms": { "value": <actual_number>, "source": "Zillow.com", "confidence": "High" },
    "21_living_sqft": { "value": <actual_number>, "source": "County Records", "confidence": "High" }
  },
  "sources_searched": ["<actual_sources_you_used>"],
  "fields_found": <actual_count>,
  "fields_missing": ["<actual_missing_field_keys>"],
  "note": "Use ACTUAL values from web search or knowledge for THIS SPECIFIC PROPERTY"
}

CRITICAL RULES:
- Use EXACT field key format: [number]_[field_name] (e.g., "10_listing_price", "7_county", "17_bedrooms")
- DO NOT use variations like "listing_price", "listingPrice", "7. listing_price", or "field_7"
- If you cannot find verified data for a field, DO NOT include it in your response (OMIT it entirely)
- NEVER return fields with null values - simply omit fields you cannot verify from sources`;

// ============================================
// GROK FIELD COMPLETER PROMPT (Grok 4.1 Fast Mode - Non-Reasoning)
// ============================================
const PROMPT_GROK = `You are the CLUES Field Completer (Grok 4.1 Fast Mode).
Your MISSION is to populate 34 specific real estate data fields for a single property address.

🟣 FIRING ORDER: You are the 4th LLM in the search chain (after Perplexity, Gemini, and GPT).
You ONLY search for fields that earlier LLMs did NOT find.
Do NOT re-search fields already populated - focus ONLY on MISSING fields.

### HARD RULES (EVIDENCE FIREWALL)
1. Use your built-in live web search capability to gather real-time data. Execute at least 4 distinct searches.
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

// ============================================
// NOTE: OLD PROMPT_PERPLEXITY removed - replaced by unified prompt in callPerplexity() function (line 2003)
// ============================================
// CLAUDE OPUS PROMPT - NO WEB - Highest reasoning, use training data
// ============================================
const PROMPT_CLAUDE_OPUS = `You are Claude Opus, the most capable AI assistant, helping extract property data. You do NOT have web access.

⚫ FIRING ORDER: You are the 6th and FINAL LLM in the search chain (after Perplexity, Gemini, GPT, Grok, and Sonnet).
You fire LAST as a final fallback for fields that NO OTHER LLM could find.
You can ONLY use your training knowledge - NO web search, NO live data, NO guessing.

YOUR MISSION: Extract ONLY fields that can be determined from static training knowledge, NOT live/current data.

🚫 CRITICAL: NEVER GUESS OR ESTIMATE LIVE DATA
You are EXPLICITLY FORBIDDEN from guessing, estimating, or inferring these fields:

FORBIDDEN FIELDS (require live data - DO NOT guess):
- 12_market_value_estimate (requires current market data)
- 16a_zestimate, 16b_redfin_estimate, 16c-f_*_avm (all AVMs require live data)
- 91_median_home_price_neighborhood (requires current market stats)
- 92_price_per_sqft_recent_avg (requires recent sales data)
- 95_days_on_market_avg (requires current market activity)
- 96_inventory_surplus (requires current inventory data)
- 97_insurance_est_annual (requires current insurance rates)
- 98_rental_estimate_monthly (requires current rental market)
- 103_comparable_sales (requires recent sales data)
- 169-172_*_views (Zillow/Redfin/Homes/Realtor views - requires live platform data)
- 174_saves_favorites (requires live platform data)
- 175_market_type (requires current market analysis)
- 176_avg_sale_to_list_percent (requires recent transaction data)
- 177_avg_days_to_pending (requires recent transaction data)
- 178_multiple_offers_likelihood (requires current market conditions)
- 180_price_trend (requires current market trend analysis)
- 181_rent_zestimate (requires current rental data)
- 10_listing_price (requires current MLS data)
- 13_last_sale_date, 14_last_sale_price (requires current property records)
- 15_assessed_value, 35_annual_taxes (requires current county records)
- 105_avg_electric_bill, 107_avg_water_bill (require current usage data)

WHAT YOU CAN PROVIDE (from static training knowledge):
1. GEOGRAPHIC/REGIONAL DATA:
   - County names for US addresses
   - Regional utility provider names (e.g., Duke Energy serves Tampa Bay area)
   - School district names for major metro areas
   - General climate/natural disaster risk levels by region

2. STATIC INFRASTRUCTURE:
   - 104_electric_provider, 106_water_provider, 110_trash_provider (if you know the regional monopoly provider)
   - 111_internet_providers_top3, 114_cable_tv_provider (major providers that serve a region)
   - 81_public_transit_access (if you know major transit lines in the area)
   - 82_commute_to_city_center (general knowledge of distances/routes)

3. PROPERTY CHARACTERISTICS (only if explicitly stated in context):
   - Structural details if provided in input
   - Neighborhood characteristics from training knowledge

RULES:
1. If a field requires CURRENT/LIVE data (prices, stats, views, estimates), OMIT it entirely - do NOT return null
2. Only return fields you can determine from STATIC training knowledge with HIGH confidence
3. When uncertain, OMIT the field - do NOT guess
4. NEVER estimate monetary values, statistics, or market metrics

${JSON_RESPONSE_FORMAT}`;
${JSON_RESPONSE_FORMAT}`;

// ============================================
// GPT-5.2-PRO FIELD COMPLETER - Web-Evidence Mode
// ============================================
const PROMPT_GPT_FIELD_COMPLETER = `You are CLUES Field Completer (GPT-5.2 Pro Web-Evidence Mode).

🟠 FIRING ORDER: You are the 3rd LLM in the search chain (after Perplexity and Gemini).
You ONLY search for fields that Perplexity and Gemini did NOT find.
Do NOT re-search fields already populated by earlier LLMs - focus ONLY on MISSING fields.

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
1) AVMs & Property Values:
   - "site:zillow.com [ADDRESS]" → Extract Zestimate (16a_zestimate), Rent Zestimate (181_rent_zestimate)
   - "site:redfin.com [ADDRESS]" → Extract Redfin Estimate (16b_redfin_estimate)
   - Calculate 12_market_value_estimate = average of Zestimate + Redfin Estimate

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
      "conflicts": [
        {
          "url": "<string>",
          "value_seen": "<string>",
          "why_rejected": "<string>"
        }
      ]
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

// Legacy alias for backward compatibility
const PROMPT_GPT = PROMPT_GPT_FIELD_COMPLETER;

// ============================================
// GPT-5.2-PRO FIELD COMPLETER USER TEMPLATE
// ============================================

/**
 * GPT Field Completer User Template
 * Formats input for GPT-5.2-pro web-evidence field completion
 */
const GPT_FIELD_COMPLETER_USER_TEMPLATE = (params: {
  address: string;
  knownData: unknown;
  missingFieldKeys?: string[];
  fieldRules?: unknown;
}) => `ADDRESS: ${params.address}

KNOWN_DATA_BLOBS (may be partial; do not treat as authoritative unless explicitly from government/official sources):
${JSON.stringify(params.knownData, null, 2)}

MISSING_FIELD_KEYS (populate ONLY these):
${JSON.stringify(params.missingFieldKeys || missingFieldsList.missing_field_keys, null, 2)}

FIELD_RULES:
${JSON.stringify(params.fieldRules || missingFieldsRules.field_rules, null, 2)}

TASK
Use web search to fill as many missing fields as possible with evidence.
Return ONLY the JSON object described in the system prompt.`;

// Legacy alias for backward compatibility
const PROMPT_GPT_ORCHESTRATOR = PROMPT_GPT_FIELD_COMPLETER;
const GPT_ORCHESTRATOR_USER_TEMPLATE = GPT_FIELD_COMPLETER_USER_TEMPLATE;

// ============================================
// DETERMINISTIC FIELD VALIDATOR (Replaces LLM Auditor)
// ============================================

interface FieldEvidence {
  url: string;
  title: string;
  snippet: string;
  retrieved_at: string;
}

interface ValidatedField {
  value: any;
  confidence: 'High' | 'Medium' | 'Low' | 'Unverified';
  evidence: FieldEvidence[];
  notes?: string;
  conflicts?: Array<{ url: string; value_seen: string; why_rejected: string }>;
}

interface GPTFieldResponse {
  address: string;
  fields: Record<string, ValidatedField>;
  fields_found: number;
  fields_missing: string[];
}

/**
 * Deterministic Field Validator
 * Validates GPT field completion response without LLM auditing
 * - Confirms output contains only allowed keys
 * - Confirms every non-null field has ≥1 evidence URL
 * - Requires 2 sources for high-risk fields (flood, hurricane)
 * - Forces null + Unverified if evidence missing
 */
function validateFieldCompleterResponse(
  response: GPTFieldResponse,
  allowedKeys: string[] = missingFieldsList.missing_field_keys,
  fieldRules: Record<string, any> = missingFieldsRules.field_rules
): GPTFieldResponse {
  const validated: GPTFieldResponse = {
    address: response.address,
    fields: {},
    fields_found: 0,
    fields_missing: []
  };

  // Process each field in the response
  for (const [key, field] of Object.entries(response.fields || {})) {
    // Rule 1: Only allow specified keys
    if (!allowedKeys.includes(key)) {
      console.log(`[Validator] Rejected field ${key}: not in allowed keys`);
      continue;
    }

    // Rule 2: Check evidence requirements
    const rules = fieldRules[key];
    const minSources = rules?.min_sources_required || 1;
    const evidenceCount = field.evidence?.length || 0;

    if (field.value !== null && field.value !== undefined) {
      // Rule 3: Force null if evidence missing
      if (evidenceCount < minSources) {
        console.log(`[Validator] Nullified field ${key}: requires ${minSources} sources, found ${evidenceCount}`);
        validated.fields[key] = {
          value: null,
          confidence: 'Unverified',
          evidence: [],
          notes: `Insufficient evidence: requires ${minSources} source(s), found ${evidenceCount}`
        };
        validated.fields_missing.push(key);
      } else {
        // Valid field with evidence
        validated.fields[key] = field;
        validated.fields_found++;
      }
    } else {
      // Null value - keep as is
      validated.fields[key] = {
        value: null,
        confidence: 'Unverified',
        evidence: [],
        notes: field.notes || 'No evidence found'
      };
      validated.fields_missing.push(key);
    }
  }

  // Add any missing keys that weren't in the response
  for (const key of allowedKeys) {
    if (!(key in validated.fields)) {
      validated.fields[key] = {
        value: null,
        confidence: 'Unverified',
        evidence: [],
        notes: 'Field not returned by LLM'
      };
      validated.fields_missing.push(key);
    }
  }

  return validated;
}

// Legacy aliases for backward compatibility (no longer used but kept to prevent breaks)
const PROMPT_GPT_LLM_AUDITOR = PROMPT_GPT_FIELD_COMPLETER;
const GPT_LLM_AUDITOR_USER_TEMPLATE = GPT_FIELD_COMPLETER_USER_TEMPLATE;

// ============================================
// CLAUDE SONNET PROMPT - WITH WEB SEARCH - Fast, accurate
// ============================================
const PROMPT_CLAUDE_SONNET = `You are Claude Sonnet, a property data specialist with web search capabilities.

🔵 FIRING ORDER: You are the 5th LLM in the search chain (after Perplexity, Gemini, GPT, and Grok). Claude Opus fires LAST.
You ONLY search for fields that earlier LLMs did NOT find.
Do NOT re-search fields already populated - focus ONLY on MISSING fields from the 34 high-velocity field list.

MISSION: Use web search to populate ANY of the 34 high-velocity fields that are still missing:

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
1. Use web search for "[ADDRESS]" on Zillow, Redfin, Homes.com, Realtor.com for AVMs and market activity
2. Search "[CITY/ZIP] median home price 2026" for market statistics
3. Search "[CITY] utility providers" for utility/service information
4. Search "[ADDRESS] public transit" for transit access
5. Only return fields you found with high confidence - use null for unverified data

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
// GEMINI 3 PRO - Uses GEMINI_FIELD_COMPLETER_SYSTEM from central config
// ============================================
const PROMPT_GEMINI = GEMINI_FIELD_COMPLETER_SYSTEM;

// Legacy fallback prompt
const SYSTEM_PROMPT = PROMPT_CLAUDE_OPUS;

// Claude Opus API call - MOST RELIABLE per audit
// NOTE: web_search NOT supported on Opus - removed per Anthropic docs
async function callClaudeOpus(address: string): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('❌ [Claude Opus] ANTHROPIC_API_KEY not set');
    return { error: 'ANTHROPIC_API_KEY not set', fields: {} };
  }
  
  console.log('✅ [Claude Opus] Calling API...');

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
        system: PROMPT_CLAUDE_OPUS,
        messages: [
          {
            role: 'user',
            content: `Extract all 181 property data fields for this address: ${address}

Return verified data only. If you cannot find data, return null for that field.`,
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
// UPDATED: Includes web_search tool per CLAUDE_MASTER_RULES Section 6.0
async function callClaudeSonnet(address: string): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('❌ [Claude Sonnet] ANTHROPIC_API_KEY not set');
    return { error: 'ANTHROPIC_API_KEY not set', fields: {} };
  }
  
  console.log('✅ [Claude Sonnet] Calling API with web_search tool...');

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
        system: PROMPT_CLAUDE_SONNET,
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
          }
        ],
        messages: [
          {
            role: 'user',
            content: `Property address: ${address}

SEARCH and extract these fields:
- 10_listing_price (search Zillow/Redfin for current price)
- 17_bedrooms, 18_full_bathrooms, 21_living_sqft (property specs)
- 25_year_built, 35_annual_taxes (county records)
- 7_county, 8_zip_code (geographic)

Return JSON with numbered field keys like "10_listing_price": {"value": 450000, "source": "Zillow"}`,
          },
        ],
      }),
    });

    const data = await response.json();

    // Log response structure for debugging
    console.log('[Claude Sonnet] Response status:', response.status);
    console.log('[Claude Sonnet] Content blocks:', data.content?.length || 0);
    console.log('[Claude Sonnet] Full response keys:', Object.keys(data));

    // Check for API error first
    if (data.error) {
      console.error('[Claude Sonnet] API Error:', JSON.stringify(data.error));
      return { error: data.error.message || JSON.stringify(data.error), fields: {}, llm: 'Claude Sonnet' };
    }

    // Handle web_search responses - may have multiple content blocks
    if (data.content && Array.isArray(data.content)) {
      console.log('[Claude Sonnet] Block types:', data.content.map((b: any) => b.type));

      // Find ALL text blocks (web_search may have multiple)
      const textBlocks = data.content.filter((block: any) => block.type === 'text');
      console.log('[Claude Sonnet] Found', textBlocks.length, 'text blocks');

      // Try each text block for JSON
      for (const textBlock of textBlocks) {
        if (textBlock?.text) {
          const text = textBlock.text;
          console.log('[Claude Sonnet] Checking text block, length:', text.length);
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              // 🛡️ NULL BLOCKING: Filter all null values before returning
              const filteredFields = filterNullValues(parsed, 'Claude Sonnet');
              console.log('[Claude Sonnet] Fields extracted:', Object.keys(filteredFields).length);
              return { fields: filteredFields, llm: 'Claude Sonnet' };
            } catch (parseError) {
              console.error('❌ Claude Sonnet JSON.parse error:', parseError);
              // Continue to next text block
            }
          }
        }
      }

      // If no JSON found in text blocks, check tool results
      const toolResults = data.content.filter((block: any) =>
        block.type === 'tool_result' || block.type === 'web_search_tool_result'
      );
      if (toolResults.length > 0) {
        console.log('[Claude Sonnet] Found', toolResults.length, 'tool results but no JSON in text');
      }

      console.log('[Claude Sonnet] No JSON found in any text block');
    }

    console.log('[Claude Sonnet] Full response:', JSON.stringify(data).substring(0, 500));
    return { error: 'Failed to parse Claude Sonnet response', fields: {}, llm: 'Claude Sonnet' };
  } catch (error) {
    return { error: String(error), fields: {}, llm: 'Claude Sonnet' };
  }
}

// Copilot API call - 5th in reliability per audit
async function callCopilot(address: string): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) return { error: 'OPENAI_API_KEY not set', fields: {} };

  const userPrompt = `Extract property data fields for: ${address}

Return structured JSON with proper field keys. Use null for unknown data.`;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.2-pro',
        max_output_tokens: 32000,
        input: [
          { role: 'system', content: PROMPT_COPILOT },
          { role: 'user', content: userPrompt },
        ],
        reasoning: { effort: 'medium' },
        tools: [{ type: 'web_search' }],
        tool_choice: 'auto',
        include: ['web_search_call.action.sources'],
      }),
    });

    const data = await response.json();

    let text: string | undefined;

    // Method 1: Direct output_text
    if (data.output_text) {
      text = data.output_text;
    }
    // Method 2: Parse output array for message item
    else if (Array.isArray(data.output)) {
      const webSearchCalls = data.output.filter((o: any) => o.type === 'web_search_call');
      if (webSearchCalls.length > 0) {
        console.log(`🔍 [Copilot] Web search executed: ${webSearchCalls.length} searches`);
      }

      const messageItem = data.output.find((o: any) => o.type === 'message');
      if (messageItem?.content) {
        if (Array.isArray(messageItem.content)) {
          const textItem = messageItem.content.find((c: any) => c.type === 'output_text' || c.type === 'text');
          text = textItem?.text;
        } else if (typeof messageItem.content === 'string') {
          text = messageItem.content;
        }
      }
    }
    // Method 3: Fallback to chat/completions format
    else if (data.choices?.[0]?.message?.content) {
      text = data.choices[0].message.content;
    }
    if (text) {
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

// OpenAI GPT-5.2-pro API call - Supports both legacy mode (address-only) and orchestrator mode (with input blobs)
async function callGPT5(
  address: string,
  inputBlobs?: {
    stellarMlsJson: unknown;
    countyJson: unknown;
    paidApisJson: unknown;
    webChunksJson: unknown;
  }
): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { error: 'OPENAI_API_KEY not set', fields: {} };

  try {
    // Determine which prompt mode to use
    const isOrchestratorMode = !!inputBlobs;
    const systemPrompt = isOrchestratorMode ? PROMPT_GPT_ORCHESTRATOR : PROMPT_GPT;

    // ALWAYS use the Field Completer template - it provides missing_field_keys and field_rules
    const userPrompt = GPT_FIELD_COMPLETER_USER_TEMPLATE({
      address,
      knownData: isOrchestratorMode && inputBlobs
        ? {
            stellarMls: inputBlobs.stellarMlsJson,
            county: inputBlobs.countyJson,
            paidApis: inputBlobs.paidApisJson,
            webChunks: inputBlobs.webChunksJson,
          }
        : null, // null not undefined - JSON.stringify(undefined) breaks the prompt
    });

    console.log(`[GPT] Calling API...`);

    const requestBody = {
      model: 'gpt-5.2-pro',
      max_output_tokens: 32000,
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      reasoning: { effort: 'medium' },
      tools: [{ type: 'web_search' }],
      tool_choice: 'auto',
      include: ['web_search_call.action.sources'],
    };

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GPT] API ERROR BODY:`, errorText);
      return { error: `API error: ${response.status} - ${errorText.substring(0, 200)}`, fields: {}, llm: 'GPT' };
    }

    let data = await response.json();

    // DEBUG: Log full response structure to diagnose issues
    console.log(`[GPT] Response keys: ${Object.keys(data).join(', ')}`);
    if (data.output) console.log(`[GPT] output type: ${typeof data.output}, isArray: ${Array.isArray(data.output)}, length: ${Array.isArray(data.output) ? data.output.length : 'N/A'}`);
    if (data.error) console.log(`[GPT] API error in response: ${JSON.stringify(data.error).substring(0, 300)}`);

    // Check if GPT returned tool_calls that need manual execution (chat/completions format)
    const assistantMessage = data.choices?.[0]?.message;
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`🔧 [GPT] Requesting ${assistantMessage.tool_calls.length} tool calls - executing via Tavily`);

      // Build messages array for follow-up
      const messages: any[] = [
        { role: 'system', content: isOrchestratorMode ? PROMPT_GPT_ORCHESTRATOR : PROMPT_GPT },
        { role: 'user', content: userPrompt },
        assistantMessage, // Include the assistant's tool_calls request
      ];

      // Execute each tool call via Tavily (limit to 3 to avoid timeout)
      const toolCalls = assistantMessage.tool_calls.slice(0, 3);
      for (const toolCall of toolCalls) {
        if (toolCall.function?.name === 'web_search') {
          const args = JSON.parse(toolCall.function.arguments || '{}');
          console.log(`🔍 [GPT] Searching: ${args.query}`);
          const searchResult = await callTavilySearch(args.query, args.num_results || 5);

          // Add tool result to messages
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: searchResult
          });
        }
      }

      // Second call - GPT processes tool results and returns final answer
      console.log('🔄 [GPT] Sending tool results back...');
      const response2 = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o', // Use chat/completions compatible model for tool results
          max_tokens: 32000,
          temperature: 0.2,
          messages: messages,
        }),
      });

      data = await response2.json();
      console.log('[GPT] Final response after tool execution received');
    }

    // Handle /v1/responses format - OpenAI handles web_search internally
    // The output array contains: web_search_call items (search metadata) + message item (final text)
    let text: string | undefined;

    // Method 1: Direct output_text (simplest case)
    if (data.output_text) {
      text = data.output_text;
      console.log('[GPT] Found text in output_text');
    }
    // Method 2: Parse output array for message item
    else if (Array.isArray(data.output)) {
      // Log what we received for debugging
      const outputTypes = data.output.map((o: any) => o.type).join(', ');
      console.log(`[GPT] Output array contains: ${outputTypes}`);

      // Check if web search was used
      const webSearchCalls = data.output.filter((o: any) => o.type === 'web_search_call');
      if (webSearchCalls.length > 0) {
        console.log(`🔍 [GPT] Web search executed: ${webSearchCalls.length} searches`);
      }

      // Find the message item with the actual response
      const messageItem = data.output.find((o: any) => o.type === 'message');
      if (messageItem?.content) {
        // Content is an array, find the output_text item
        if (Array.isArray(messageItem.content)) {
          const textItem = messageItem.content.find((c: any) => c.type === 'output_text' || c.type === 'text');
          text = textItem?.text;
          console.log(`[GPT] Found text in message.content array (${textItem?.type})`);
        } else if (typeof messageItem.content === 'string') {
          text = messageItem.content;
          console.log('[GPT] Found text in message.content string');
        }
      }
    }
    // Method 3: Fallback to chat/completions format
    else if (data.choices?.[0]?.message?.content) {
      text = data.choices[0].message.content;
      console.log('[GPT] Found text in choices[0].message.content (chat/completions format)');
    }

    if (text) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);

          // Handle different response formats
          if (isOrchestratorMode) {
            // Orchestrator mode returns { fields: {...}, conflicts: [...], ... }
            console.log('[GPT] Orchestrator response received');
            console.log(`  - fields_found: ${parsed.fields_found || 0}`);
            console.log(`  - conflicts: ${parsed.conflicts?.length || 0}`);
            return {
              fields: parsed.fields || {},
              conflicts: parsed.conflicts || [],
              fields_found: parsed.fields_found || 0,
              fields_missing: parsed.fields_missing || [],
              llm: 'GPT-Orchestrator'
            };
          } else {
            // Legacy mode: filter null values
            const filteredFields = filterNullValues(parsed, 'GPT');
            return { fields: filteredFields, llm: 'GPT' };
          }
        } catch (parseError) {
          console.error('❌ GPT JSON.parse error:', parseError);
          console.error('   JSON length:', jsonMatch[0].length, 'chars');
          console.error('   JSON sample (first 500 chars):', jsonMatch[0].substring(0, 500));
          console.error('   JSON sample (last 500 chars):', jsonMatch[0].substring(jsonMatch[0].length - 500));
          return { error: `JSON parse error: ${String(parseError)}`, fields: {}, llm: 'GPT' };
        }
      }
    }
    // No text found - log detailed diagnostics
    console.error('[GPT] No text content found in response');
    console.error('[GPT] Full response (first 1000 chars):', JSON.stringify(data).substring(0, 1000));
    return { error: 'Failed to parse GPT response - no text content', fields: {}, llm: 'GPT' };
  } catch (error) {
    console.error('[GPT] Exception:', error);
    return { error: String(error), fields: {}, llm: 'GPT' };
  }
}

// ============================================
// GPT-5.2 LLM-ONLY AUDITOR - Validates LLM-populated fields only
// ============================================

/**
 * Call GPT-5.2-pro LLM-Only Field Auditor
 * Validates ONLY fields populated by LLMs (Tier 4/5), skips API fields (Tier 1-3)
 */
async function callGPT5FieldAuditor(
  address: string,
  inputs: {
    stellarMlsJson: unknown;
    countyJson: unknown;
    paidApisJson: unknown;
    webChunksJson: unknown;
    llmOnlyFields: Record<string, any>;
    apiPopulatedFieldKeys: string[];
  }
): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[GPT LLM Auditor] OPENAI_API_KEY not set');
    return { fields: inputs.llmOnlyFields, fields_audited: 0, fields_corrected: 0, fields_nulled: 0 };
  }

  try {
    const systemPrompt = PROMPT_GPT_LLM_AUDITOR;
    const userPrompt = GPT_LLM_AUDITOR_USER_TEMPLATE({
      address,
      knownData: {
        stellarMls: inputs.stellarMlsJson,
        county: inputs.countyJson,
        paidApis: inputs.paidApisJson,
        webChunks: inputs.webChunksJson,
        llmOnlyFields: inputs.llmOnlyFields,
        apiPopulatedFieldKeys: inputs.apiPopulatedFieldKeys,
      },
    });

    console.log(`[GPT LLM Auditor] Auditing ${Object.keys(inputs.llmOnlyFields).length} LLM-populated fields`);

    const requestBody = {
      model: 'gpt-5.2-pro',
      max_output_tokens: 32000,
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      reasoning: { effort: 'medium' },
      tools: [{ type: 'web_search' }],
      tool_choice: 'auto',
      include: ['web_search_call.action.sources'],
    };

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    // LOG RAW RESPONSE STATUS
    console.log(`[GPT LLM Auditor] RESPONSE: status=${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GPT LLM Auditor] API ERROR BODY:`, errorText);
      return { fields: inputs.llmOnlyFields, fields_audited: 0, fields_corrected: 0, fields_nulled: 0, error: `API error: ${response.status}` };
    }

    const data = await response.json();

    // Handle /v1/responses format
    const text = data.output_text || data.choices?.[0]?.message?.content;
    if (text) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log(`[GPT LLM Auditor] Audit complete:`);
          console.log(`  - Fields audited: ${parsed.fields_audited || 0}`);
          console.log(`  - Fields corrected: ${parsed.fields_corrected || 0}`);
          console.log(`  - Fields nulled (hallucinations): ${parsed.fields_nulled || 0}`);
          console.log(`  - Conflicts detected: ${parsed.conflicts?.length || 0}`);
          return parsed;
        } catch (parseError) {
          console.error('[GPT LLM Auditor] JSON parse error:', parseError);
          return { fields: inputs.llmOnlyFields, fields_audited: 0, fields_corrected: 0, fields_nulled: 0 };
        }
      }
    }
    console.error('[GPT LLM Auditor] No valid response');
    return { fields: inputs.llmOnlyFields, fields_audited: 0, fields_corrected: 0, fields_nulled: 0 };
  } catch (error) {
    console.error('[GPT LLM Auditor] Error:', error);
    return { fields: inputs.llmOnlyFields, fields_audited: 0, fields_corrected: 0, fields_nulled: 0 };
  }
}

/**
 * Extract LLM-only fields from orchestrator output
 * Filters out API-populated fields (Tier 1-3) to focus audit on LLM fields (Tier 4-5)
 */
function extractLLMOnlyFields(
  cmaSchema: any,
  apiPopulatedFieldKeys: Set<string>
): { llmOnlyFields: Record<string, any>; llmFieldCount: number } {
  const llmOnlyFields: Record<string, any> = {};
  let llmFieldCount = 0;

  for (const [fieldKey, fieldData] of Object.entries(cmaSchema.fields || {})) {
    const field = fieldData as any;

    // Skip if from trusted API sources (Tier 1-3)
    if (apiPopulatedFieldKeys.has(fieldKey)) {
      continue;
    }

    // Skip if null (nothing to audit)
    if (field.value === null || field.value === undefined) {
      continue;
    }

    // This is an LLM-populated field - needs audit
    llmOnlyFields[fieldKey] = field;
    llmFieldCount++;
  }

  return { llmOnlyFields, llmFieldCount };
}

/**
 * Determines if LLM fields need GPT-5.2 audit
 * Feature flag + quality gates
 */
function shouldAuditLLMFields(llmFieldCount: number, llmOnlyFields: Record<string, any>): boolean {
  // Feature flag (can be toggled via environment variable)
  const ENABLE_LLM_AUDITOR = process.env.ENABLE_LLM_AUDITOR !== 'false'; // Default: enabled

  if (!ENABLE_LLM_AUDITOR) {
    console.log('[Audit Gate] LLM Auditor disabled via ENABLE_LLM_AUDITOR=false');
    return false;
  }

  // Gate 1: No LLM fields to audit
  if (llmFieldCount === 0) {
    console.log('[Audit Gate] No LLM fields to audit (all from APIs)');
    return false;
  }

  // Gate 2: Has computed fields (always audit calculations)
  const hasComputedFields = Object.values(llmOnlyFields).some(
    (field: any) => field.evidence_type === 'safe_computation'
  );
  if (hasComputedFields) {
    console.log(`[Audit Gate] Has computed fields - audit enabled`);
    return true;
  }

  // Gate 3: Sufficient LLM fields to warrant audit (threshold: 5+)
  if (llmFieldCount >= 5) {
    console.log(`[Audit Gate] ${llmFieldCount} LLM fields - audit enabled`);
    return true;
  }

  console.log(`[Audit Gate] Only ${llmFieldCount} LLM fields - skipping audit`);
  return false;
}

// ============================================
// GROK FIELD RESTRICTIONS
// Prevents Grok from hallucinating on fields that Stellar MLS and Perplexity handle authoritatively
// Grok was hallucinating on 75% of fields - now restricted to gap-filling only
// ============================================

// ============================================
// STELLAR MLS AUTHORITATIVE FIELDS
// These fields from Stellar MLS can NEVER be overwritten by ANY other source,
// regardless of confidence level. This ensures listing prices, sale dates, and
// exact property measurements from MLS are not corrupted by LLM hallucinations.
// ============================================
const STELLAR_MLS_AUTHORITATIVE_FIELDS = new Set([
  // CRITICAL: Current listing data (NOT historical)
  '2_mls_primary', '3_mls_secondary', '4_listing_status', '5_listing_date',
  '10_listing_price', // ← CRITICAL: CURRENT list price, not historical!
  '13_last_sale_date', '14_last_sale_price', // Historical sale data

  // Exact property measurements from MLS
  '17_bedrooms', '18_full_bathrooms', '19_half_bathrooms',
  '21_living_sqft', '22_total_sqft_under_roof', '23_lot_size_sqft',
  '25_year_built', '26_property_type', '27_stories',
  '28_garage_spaces', '29_parking_total',

  // Structure details from MLS (inferred from Bridge MLS data)
  '44_garage_type', // Inferred from GarageType or AttachedGarageYN

  // Permit history & Renovations (Backend-only: extract from MLS or scraper)
  '59_recent_renovations', // Extract from MLS PublicRemarks or structured fields
  '60_permit_history_roof', '61_permit_history_hvac', '62_permit_history_other',

  // HOA data from MLS
  '30_hoa_yn', '31_hoa_fee_annual', '32_hoa_name', '33_hoa_includes', '34_ownership_type',

  // Tax data (CRITICAL: LLMs often return old tax amounts)
  '35_annual_taxes', '36_tax_year', // County Tax Collector is authoritative

  // Backend calculations (Math-only: LLMs forbidden from calculating)
  '11_price_per_sqft', '20_total_bathrooms', '37_property_tax_rate',
  '40_roof_age_est', '46_hvac_age', '53_primary_br_location',
  '93_price_to_rent_ratio', '94_price_vs_median_percent',
  '99_rental_yield_est', '101_cap_rate_est',

  // REMOVED: Utility providers (104, 106, 108, 109) - Bridge MLS often doesn't provide these
  // These are now populated by Perplexity micro-prompts instead (Tier 4)
  // '104_electric_provider', '106_water_provider', '108_sewer_provider', '109_natural_gas',

  // Enhanced Bridge MLS fields (Priority 3 & 4)
  '132_lot_features', // Enhanced with Topography and Vegetation
  '138_special_assessments', // From SpecialListingConditions array

  // Stellar MLS exclusive fields (139-168)
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
]);

// Grok API call (xAI) - HAS WEB SEARCH
// Tavily search helper for Grok tool calls
async function callTavilySearch(query: string, numResults: number = 5): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.log('❌ TAVILY_API_KEY not set');
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

    // Format results for Grok
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

async function callGrok(address: string): Promise<any> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) { console.log('❌ XAI_API_KEY not set'); return { error: 'XAI_API_KEY not set', fields: {} }; }
  console.log('✅ XAI_API_KEY found, calling Grok API...');

  const grokSystemPrompt = PROMPT_GROK;
  const grokUserPrompt = `Extract property data for: ${address}`;

  const messages: any[] = [
    { role: 'system', content: grokSystemPrompt },
    { role: 'user', content: grokUserPrompt },
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
    console.log('Grok response:', JSON.stringify(data).substring(0, 500));

    // Check if Grok wants to use tools
    const assistantMessage = data.choices?.[0]?.message;
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`🔧 [Grok] Requesting ${assistantMessage.tool_calls.length} tool calls`);

      // Add assistant message with tool calls to conversation
      messages.push(assistantMessage);

      // Execute each tool call via Tavily (limit to 3 to avoid timeout)
      const toolCalls = assistantMessage.tool_calls.slice(0, 3);
      for (const toolCall of toolCalls) {
        if (toolCall.function?.name === 'web_search') {
          const args = JSON.parse(toolCall.function.arguments || '{}');
          const searchResult = await callTavilySearch(args.query, args.num_results || 5);

          // Add tool result to messages
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: searchResult
          });
        }
      }

      // Second call - Grok processes tool results and returns final answer
      console.log('🔄 [Grok] Sending tool results back...');
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
      console.log('Grok final response:', JSON.stringify(data).substring(0, 500));
    }

    // Parse the final response
    if (data.choices && data.choices[0]?.message?.content) {
      const text = data.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          // Grok may return { data_fields: {...} } or { fields: {...} } or flat fields
          const fieldsToFilter = parsed.data_fields || parsed.fields || parsed;
          console.log(`[Grok] Parsed structure: ${parsed.data_fields ? 'data_fields' : parsed.fields ? 'fields' : 'flat'}, keys: ${Object.keys(fieldsToFilter).length}`);
          const filteredFields = filterNullValues(fieldsToFilter, 'Grok');
          console.log(`[Grok] After filtering: ${Object.keys(filteredFields).length} fields accepted`);
          return { fields: filteredFields, llm: 'Grok' };
        } catch (parseError) {
          console.error('❌ Grok JSON.parse error:', parseError);
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

// Gemini API call - #6 in reliability - WITH GOOGLE SEARCH GROUNDING
async function callGemini(address: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { console.log('❌ GEMINI_API_KEY not set'); return { error: 'GEMINI_API_KEY not set', fields: {} }; } console.log('✅ GEMINI_API_KEY found, calling Gemini API with Google Search...');

  const startTime = Date.now();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // SYSTEM INSTRUCTION: Prompt goes here per 2026 Gemini 3 Pro specs
          system_instruction: {
            parts: [{ text: PROMPT_GEMINI }]
          },
          // USER CONTENT: Only the task/address
          contents: [
            {
              parts: [
                {
                  text: `Extract property data fields for this address: ${address}

Execute these searches:
1. "${address} Zillow listing and Zestimate"
2. "${address} Redfin Estimate and market data"
3. "${address} utility providers and average bills"

Return JSON only with the 34 field keys specified in the schema.`,
                },
              ],
            },
          ],
          // Enable Google Search (Gemini 3 Pro Preview - 2026 API format)
          tools: [{ google_search: {} }],
          tool_config: { function_calling_config: { mode: 'ANY' } },
          generationConfig: {
            thinking_config: {
              thinking_level: "high",
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
    console.log(`⏱️ [Gemini] Response time: ${elapsed}ms ${elapsed < 2000 ? '⚠️ TOO FAST - may not have searched' : '✅ Good - likely searched'}`);

    // Check for HTTP errors first
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Gemini] HTTP ${response.status}: ${errorText.substring(0, 500)}`);
      return { error: `HTTP ${response.status}: ${response.statusText}`, fields: {}, llm: 'Gemini' };
    }

    const data = await response.json();

    // Log API-level errors
    if (data.error) {
      console.error(`❌ [Gemini] API Error:`, JSON.stringify(data.error).substring(0, 500));
      return { error: `API Error: ${data.error.message || JSON.stringify(data.error)}`, fields: {}, llm: 'Gemini' };
    }

    // Log grounding metadata to verify search was used
    const groundingMeta = data.candidates?.[0]?.groundingMetadata;
    if (groundingMeta) {
      console.log('🔍 [Gemini] Grounding metadata detected');

      // Log the actual search queries Gemini used (critical for debugging null fields)
      if (groundingMeta.webSearchQueries && groundingMeta.webSearchQueries.length > 0) {
        console.log('🔎 [Gemini] Web Search Queries Used:');
        groundingMeta.webSearchQueries.forEach((query: string, i: number) => {
          console.log(`   ${i + 1}. "${query}"`);
        });
      }

      // Log search entry point
      if (groundingMeta.searchEntryPoint?.renderedContent) {
        console.log('✅ [Gemini] Google Search Entry Point confirmed');
      }

      // Log grounding chunks (sources used)
      if (groundingMeta.groundingChunks && groundingMeta.groundingChunks.length > 0) {
        console.log(`📚 [Gemini] Sources cited: ${groundingMeta.groundingChunks.length} chunks`);
      }
    } else {
      console.log('⚠️ [Gemini] No grounding metadata - search may not have fired');
    }

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
          // FIX: Extract fields - handle nested { fields: {...} } format
          // Gemini returns { fields: {...}, sources_searched: [...] } - we only want the fields
          const fieldsToFilter = parsed.fields || parsed;
          console.log('Gemini fieldsToFilter count:', Object.keys(fieldsToFilter).length);
          // NULL BLOCKING: Filter all null values before returning
          const filteredFields = filterNullValues(fieldsToFilter, 'Gemini');
          console.log('Gemini filteredFields count:', Object.keys(filteredFields).length);
          return { fields: filteredFields, llm: 'Gemini' };
        } catch (parseError) {
          console.error('❌ Gemini JSON.parse error:', parseError);
          console.error('   Failed JSON string:', jsonStr.substring(0, 200));
          return { error: `JSON parse error: ${String(parseError)}`, fields: {}, llm: 'Gemini' };
        }
      }
    }
    // Log what we received if we couldn't parse it
    console.error(`❌ [Gemini] No parseable response. Candidates:`, data.candidates ? 'present' : 'missing');
    if (data.candidates?.[0]) {
      console.error(`❌ [Gemini] Candidate 0 content:`, JSON.stringify(data.candidates[0]).substring(0, 300));
    }
    return { error: 'Failed to parse Gemini response', fields: {}, llm: 'Gemini' };
  } catch (error) {
    console.error(`❌ [Gemini] Exception:`, String(error));
    return { error: String(error), fields: {}, llm: 'Gemini' };
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

  // CASCADE STRATEGY: Try all 6 LLMs in RELIABILITY order
  // Order: Perplexity → Gemini → GPT → Grok → Sonnet → Opus
  // Web-search LLMs first (Tier 4), then Claude LLMs (Tier 5)
  const {
    address: rawAddress,
    url: rawUrl,
    mlsNumber,  // Optional: MLS# for direct MLS search (Manual tab)
    city: validationCity,  // Optional: City for Stellar MLS validation (prevents wrong property match)
    state: validationState,  // Optional: State for Stellar MLS validation
    zipCode: validationZip,  // Optional: Zip for Stellar MLS validation
    engines = [...LLM_CASCADE_ORDER],  // All 6 LLMs: Perplexity → Gemini → GPT → Grok → Sonnet → Opus
    skipLLMs = false,
    useCascade = true, // Enable cascade mode by default
    existingFields = {},  // Previously accumulated fields from prior LLM calls
    skipApis = false,  // Skip free APIs if we already have their data
    skipMLS = false,  // Skip ONLY Stellar MLS (TIER 1) - used by MLS-first search flow to avoid double-fetch
      disableGemini = false,  // Disable Gemini structured search (Tier 4.0)
  } = req.body;

  // 🛡️ INPUT SANITIZATION: Prevent prompt injection attacks
  const address = sanitizeAddress(rawAddress);
  const url = rawUrl ? sanitizeAddress(rawUrl) : undefined;

  if (!address && !url && !mlsNumber) {
    return res.status(400).json({ error: 'Address, URL, or MLS number required' });
  }

  // Validate address format
  if (address && !isValidAddress(address)) {
    return res.status(400).json({ error: 'Invalid address format' });
  }

  const searchQuery = address || (url ? `property at URL: ${url}` : `MLS# ${mlsNumber}`);

  try {
    console.log('=== STARTING PROPERTY SEARCH (with Arbitration Pipeline) ===');
    console.log('Address:', searchQuery);

    // Initialize arbitration pipeline with LLM quorum threshold of 2
    const arbitrationPipeline = createArbitrationPipeline(2);
    const llmResponses: any[] = [];
    const actualFieldCounts: Record<string, number> = {}; // Track ACTUAL fields returned by each source

    // CRITICAL: City/State/Zip from Bridge MLS for geocoding validation
    let mlsCity: string | undefined;
    let mlsState: string | undefined;
    let mlsZip: string | undefined;

    // Pre-load existing fields into the pipeline (from previous LLM calls)
    if (existingFields && Object.keys(existingFields).length > 0) {
      console.log(`[ACCUMULATE] Loading ${Object.keys(existingFields).length} existing fields into pipeline`);
      arbitrationPipeline.addFieldsFromSource(existingFields, 'Previous Session');
    }

    // ========================================
    // TIER 1: MLS DATA (Stellar MLS via Bridge Interactive API)
    // Highest authority - search first for property listings
    // ========================================
    if (!skipApis && !skipMLS) {
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
      console.log('📍 Validation params provided:', { validationCity, validationState, validationZip });

      // CRITICAL: Validation params from MLS-first flow MUST override parsed values
      // If validation params are provided, use them exclusively (they came from authoritative Bridge MLS)
      const finalCity = validationCity || city;
      const finalState = validationState || state;
      const finalZip = validationZip || zipCode;

      console.log('📍 Final components being sent to Bridge MLS:', { street, city: finalCity, state: finalState, zipCode: finalZip });

      try {
        const bridgeResponse = await withTimeout(
          fetch(`${req.headers.host?.includes('localhost') ? 'http://localhost:3000' : 'https://' + req.headers.host}/api/property/bridge-mls`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: street,
              mlsNumber: mlsNumber,  // Pass MLS# if provided (Manual tab)
              city: finalCity,
              state: finalState,
              zipCode: finalZip
            })
          }),
          STELLAR_MLS_TIMEOUT,
          new Response(JSON.stringify({ success: false, error: 'Timeout after 30s' }), { status: 408 })
        );

        console.log('📡 Bridge API Response Status:', bridgeResponse.status, bridgeResponse.statusText);

        if (bridgeResponse.ok) {
          const bridgeData = await bridgeResponse.json();
          console.log('📦 Bridge API Response Data:', JSON.stringify(bridgeData, null, 2));

          if (bridgeData.success && bridgeData.fields) {
            const mlsFieldCount = Object.keys(bridgeData.fields).length;
            console.log('✅ Bridge returned fields:', mlsFieldCount, 'fields');
            console.log('📋 Field keys sample:', Object.keys(bridgeData.fields).slice(0, 10));

            // 🔍 CRITICAL: Extract city/state/zip from raw Bridge data for geocoding validation
            mlsCity = bridgeData.rawData?.City;
            mlsState = bridgeData.rawData?.StateOrProvince;
            mlsZip = bridgeData.rawData?.PostalCode;
            console.log('🔍 Bridge MLS location (for validation):', { city: mlsCity, state: mlsState, zip: mlsZip });

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

            // Convert Bridge fields to arbitration format - pass primitives to addFieldsFromSource
            const mlsFields: Record<string, any> = {};
            for (const [key, fieldData] of Object.entries(bridgeData.fields)) {
              const field = fieldData as any;
              // Extract actual value from nested Bridge MLS response format
              const actualValue = typeof field.value === 'object' && field.value !== null && 'value' in field.value
                ? field.value.value
                : field.value;
              // addFieldsFromSource expects primitives, not wrapped FieldValue objects
              mlsFields[key] = actualValue;
            }

            const mlsAdded = arbitrationPipeline.addFieldsFromSource(mlsFields, STELLAR_MLS_SOURCE);
            actualFieldCounts[STELLAR_MLS_SOURCE] = mlsFieldCount; // Track ACTUAL fields returned
            console.log(`✅ TIER 1 COMPLETE: Added ${mlsAdded} fields from ${STELLAR_MLS_SOURCE} (via Bridge Interactive)`);
            console.log('📊 Sample MLS field values:', JSON.stringify(Object.fromEntries(Object.entries(mlsFields).slice(0, 3)), null, 2));

            // CRITICAL LOGGING: Track Field 10 (listing_price) from Stellar MLS
            if (mlsFields['10_listing_price']) {
              console.log(`🏠 [FIELD 10 DEBUG] Stellar MLS set Field 10 = $${mlsFields['10_listing_price']} (Source: ${STELLAR_MLS_SOURCE}, Confidence: High)`);
            } else {
              console.log(`⚠️ [FIELD 10 DEBUG] Stellar MLS did NOT return Field 10 (listing_price) - property may not be actively listed`);
            }
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
    } else if (skipMLS) {
      console.log('========================================');
      console.log('TIER 1: STELLAR MLS - SKIPPED (MLS-first flow already fetched)');
      console.log('========================================');
      console.log('');
    }

    // ========================================
    // FIELD 91: MEDIAN HOME PRICE FROM BRIDGE COMPS (Tier 1 Priority)
    // TODO: Requires dedicated /api/property/bridge-comps endpoint
    // Currently disabled - Perplexity provides Field 91 as fallback (Tier 4)
    // Will be implemented with Pull Comps feature
    // ========================================
    // DISABLED: bridge-mls doesn't support comps query parameters yet
    // if (mlsZip && !skipApis) {
    //   console.log('========================================');
    //   console.log('FIELD 91: MEDIAN HOME PRICE FROM BRIDGE COMPS');
    //   console.log('========================================');
    //
    //   const propertyTypeField = arbitrationPipeline.getResult().fields['26_property_type']?.value;
    //
    //   if (medianResult.median !== null) {
    //     arbitrationPipeline.addFieldsFromSource(
    //       { '91_median_home_price_neighborhood': medianResult.median },
    //       medianResult.source
    //     );
    //     console.log(`✅ Field 91 set from Bridge comps: $${medianResult.median.toLocaleString()}`);
    //   } else {
    //     console.log('⚠️ Field 91 will fall back to Perplexity (Tier 4) if available');
    //   }
    //   console.log('========================================');
    //   console.log('');
    // }

    // ========================================
    // CRITICAL: Extract real address for TIER 2-5
    // ========================================
    // After TIER 1 (Stellar MLS) completes, extract real address from results
    // Property Search: searchQuery is already full address (no change needed)
    // Manual tab MLS#: searchQuery is "MLS# TB1234567", need real address from field 1_full_address
    const intermediateResultForAddress = arbitrationPipeline.getResult();
    const realAddress = intermediateResultForAddress.fields['1_full_address']?.value || searchQuery;

    // BUG FIX #26: If Bridge MLS didn't provide city/state/zip, fallback to parsed values from searchQuery
    // This prevents "undefined" validation errors when Bridge MLS fails
    if (!mlsCity || !mlsState || !mlsZip) {
      console.log('⚠️ [Bug #26 Fix] Bridge MLS did not provide city/state/zip, falling back to parsed values');
      const addressParts = searchQuery.split(',').map(p => p.trim());
      const parsedCity = addressParts[1] || undefined;
      const stateZip = addressParts[2] || '';
      const stateMatch = stateZip.match(/([A-Z]{2})\s*(\d{5})?/);
      const parsedState = stateMatch ? stateMatch[1] : undefined;
      const parsedZip = stateMatch && stateMatch[2] ? stateMatch[2] : undefined;

      mlsCity = mlsCity || parsedCity;
      mlsState = mlsState || parsedState;
      mlsZip = mlsZip || parsedZip;

      console.log('🔍 Fallback validation values:', { city: mlsCity, state: mlsState, zip: mlsZip });
    }

    if (realAddress !== searchQuery) {
      console.log('========================================');
      console.log('🔄 ADDRESS SUBSTITUTION (MLS# Search)');
      console.log('========================================');
      console.log('Original query:', searchQuery);
      console.log('Real address from Bridge MLS:', realAddress);
      console.log('Expected location:', { city: mlsCity, state: mlsState, zip: mlsZip });
      console.log('⚠️  GEOCODING VALIDATION ENABLED: Will reject results not matching', mlsCity, mlsState, mlsZip);
      console.log('Using real address for TIER 2-5 (APIs + LLMs)');
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
      console.log('🔍 Calling enrichWithFreeAPIs with 60s timeout for:', realAddress); // Note: This is FREE_API_TIMEOUT, not STELLAR_MLS_TIMEOUT
      console.log('🔍 With validation: city=', mlsCity, 'state=', mlsState, 'zip=', mlsZip);
      try {
        const enrichedData = await withTimeout(
          enrichWithFreeAPIs(realAddress, mlsCity, mlsState, mlsZip),
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
        const allTier3Sources = ['SchoolDigger', FBI_CRIME_SOURCE, 'WalkScore', 'FEMA Flood', 'AirNow', 'HowLoud', 'Weather', 'U.S. Census'];
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
    // BATCH SYSTEM REMOVED
    // ========================================
    // The old batch system (geminiBatchWorker.ts + geminiConfig.ts) has been deleted.
    // Gemini now uses unified Field Completer prompt (callGemini function below)
    // which extracts all 34 fields in a single call.
    console.log('========================================');
    console.log('TIER 4: Gemini Batch System - REMOVED (using unified Field Completer)');
    console.log('========================================');

    console.log('[DEBUG] About to start Tier 4 LLM Cascade...');
    console.log('========================================');
    console.log('TIER 4: LLM CASCADE (Perplexity Micro-Prompts + Other LLMs)');
    console.log('========================================');
    console.log(`[DEBUG] skipLLMs = ${skipLLMs}`);

    if (!skipLLMs) {
      console.log('[DEBUG] Entering Tier 4 LLM cascade (skipLLMs is false)...');
      const intermediateResult = arbitrationPipeline.getResult();
      const currentFieldCount = Object.keys(intermediateResult.fields).length;
      console.log(`[LLM GATE] Current field count before LLMs: ${currentFieldCount}`);

      // ALWAYS call selected LLMs - removed the "skip if 110+ fields" logic
      // LLMs provide valuable additional data even if APIs returned some fields
      if (true) {  // Always run LLMs if enabled
        console.log(`\nStep 2: LLM Cascade (${currentFieldCount}/138 fields filled)...`);

        // Extract context for Perplexity micro-prompts (for disambiguation)
        const addressString = intermediateResult.fields['1_full_address']?.value || '';
        const perplexityContext = {
          county: intermediateResult.fields['7_county']?.value || 'Unknown',
          city: addressString ? addressString.split(',')[1]?.trim() || 'Unknown' : 'Unknown',
          state: 'FL',
          zip: intermediateResult.fields['8_zip_code']?.value || '',
          parcelId: intermediateResult.fields['9_parcel_id']?.value || 'Unknown',
          // Property attributes for utility bill estimation
          sqft: intermediateResult.fields['21_living_sqft']?.value || 'Unknown',
          living_sqft: intermediateResult.fields['21_living_sqft']?.value || 'Unknown',
          lot_size_sqft: intermediateResult.fields['23_lot_size_sqft']?.value || 0,
          property_type: intermediateResult.fields['26_property_type']?.value || 'Unknown',
          stories: intermediateResult.fields['27_stories']?.value || 1,
          floors: intermediateResult.fields['27_stories']?.value || 1,
          yearBuilt: intermediateResult.fields['25_year_built']?.value || 'Unknown',
          year_built: intermediateResult.fields['25_year_built']?.value || 'Unknown',
          bedrooms: intermediateResult.fields['17_bedrooms']?.value || 'Unknown',
          bathrooms: intermediateResult.fields['20_total_bathrooms']?.value || 'Unknown',
          total_bathrooms: intermediateResult.fields['20_total_bathrooms']?.value || 'Unknown',
          hoa_includes: intermediateResult.fields['33_hoa_includes']?.value || '',
          pool_yn: intermediateResult.fields['54_pool_yn']?.value || false,
          hvacAge: intermediateResult.fields['46_hvac_age']?.value || 'Unknown'
        };
        console.log('[Perplexity Context]', perplexityContext);

        const llmSourceNames: Record<string, string> = {
          'perplexity-a': 'Perplexity A (Portals & Pricing)',
          'perplexity-b': 'Perplexity B (County Records)',
          'perplexity-c': 'Perplexity C (Schools & Safety)',
          'perplexity-d': 'Perplexity D (Utilities)',
          'perplexity-e': 'Perplexity E (Comps)',
          'grok': 'Grok',
          'claude-opus': 'Claude Opus',
          'gpt': 'GPT',
          'claude-sonnet': 'Claude Sonnet',
          'gemini': 'Gemini'
        };

        const llmCascade = [
          // PERPLEXITY CONSOLIDATED PROMPTS (5 prompts - A through E)
          { id: 'perplexity-a', fn: (addr: string) => callPerplexityPromptA(addr, perplexityContext), enabled: engines.includes('perplexity') },
          { id: 'perplexity-b', fn: (addr: string) => callPerplexityPromptB(addr, perplexityContext), enabled: engines.includes('perplexity') },
          { id: 'perplexity-c', fn: (addr: string) => callPerplexityPromptC(addr, perplexityContext), enabled: engines.includes('perplexity') },
          { id: 'perplexity-d', fn: (addr: string) => callPerplexityPromptD(addr, perplexityContext), enabled: engines.includes('perplexity') },
          { id: 'perplexity-e', fn: (addr: string) => callPerplexityPromptE(addr, perplexityContext), enabled: engines.includes('perplexity') },

          // OTHER LLMs - Order: Gemini → GPT → Grok → Sonnet → Opus (matches LLM_CASCADE_ORDER)
          { id: 'gemini', fn: callGemini, enabled: engines.includes('gemini') },          // #2 - Google Search grounding
          { id: 'gpt', fn: callGPT5, enabled: engines.includes('gpt') },                 // #3 - Web evidence mode
          { id: 'grok', fn: callGrok, enabled: engines.includes('grok') },               // #4 - X/Twitter real-time
          { id: 'claude-sonnet', fn: callClaudeSonnet, enabled: engines.includes('claude-sonnet') }, // #5 - Web search beta
          { id: 'claude-opus', fn: callClaudeOpus, enabled: engines.includes('claude-opus') },       // #6 - LAST (no web)
        ];

        // Filter to enabled LLMs only
        const enabledLlms = llmCascade.filter(llm => llm.enabled);

        if (enabledLlms.length > 0) {
          // SEQUENTIAL LLM CASCADE: Each LLM fires in order (Firing Order: 1st->6th)
          // This allows each LLM to see what previous LLMs found and focus on MISSING fields only
          const llmResults: PromiseSettledResult<any>[] = [];

          console.log(`\n=== Running ${enabledLlms.length} LLMs SEQUENTIALLY (cascade order 1st->6th) ===`);

          for (let i = 0; i < enabledLlms.length; i++) {
            const llm = enabledLlms[i];
            const isPerplexity = llm.id.startsWith('perplexity');
            const timeout = isPerplexity ? PERPLEXITY_TIMEOUT : LLM_TIMEOUT;

            console.log(`  [${i + 1}/${enabledLlms.length}] Calling ${llm.id} (firing order position)...`);

            try {
              const result = await withTimeout(
                llm.fn(realAddress),
                timeout,
                { fields: {}, error: 'timeout' }
              );
              llmResults.push({ status: 'fulfilled', value: result });
              console.log(`  [${i + 1}/${enabledLlms.length}] ${llm.id} completed - found ${Object.keys(result?.fields || {}).length} fields`);
            } catch (err) {
              llmResults.push({ status: 'rejected', reason: err });
              console.log(`  [${i + 1}/${enabledLlms.length}] ${llm.id} failed: ${err}`);
            }

            // Add delay between Perplexity calls to avoid rate limiting
            if (isPerplexity && i < enabledLlms.length - 1 && enabledLlms[i + 1]?.id.startsWith('perplexity')) {
              console.log('  Waiting 500ms before next Perplexity call (rate limit protection)...');
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          // Process results SEQUENTIALLY to avoid race conditions
          // Results are processed in order: perplexity → gemini → gpt → grok → sonnet → opus
          console.log(`\n=== Processing ${llmResults.length} LLM results in sequence ===`);

          for (let idx = 0; idx < llmResults.length; idx++) {
            try {
              const result = llmResults[idx];
              const llm = enabledLlms[idx];
              if (!llm) {
                console.error(`[LLM Cascade] No LLM at index ${idx}`);
                continue;
              }
              const processingOrder = idx + 1;

              console.log(`[${processingOrder}/${llmResults.length}] Processing ${llm.id}...`);

              if (result.status === 'fulfilled') {
              const llmData = result.value;

              // Debug logging for Gemini to catch issues
              if (llm.id === 'gemini') {
                console.log(`[Gemini Debug] Result value type: ${typeof llmData}, keys: ${llmData ? Object.keys(llmData).join(', ') : 'null'}`);
                if (llmData?.error) console.log(`[Gemini Debug] Error: ${llmData.error}`);
              }

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
                  let fieldValue = fieldData?.value !== undefined ? fieldData.value : value;

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

                  // Convert arrays/objects to readable JSON strings for display (e.g., Field 103 comparable_sales)
                  if (Array.isArray(fieldValue)) {
                    // For arrays of objects (like comps), format as readable list
                    if (fieldValue.length > 0 && typeof fieldValue[0] === 'object') {
                      fieldValue = fieldValue.map((item: any, i: number) => {
                        if (item.address && item.price) {
                          return `${i + 1}. ${item.address} - $${item.price?.toLocaleString() || item.price}`;
                        }
                        return JSON.stringify(item);
                      }).join('; ');
                    } else {
                      fieldValue = fieldValue.join(', ');
                    }
                  } else if (typeof fieldValue === 'object' && fieldValue !== null) {
                    fieldValue = JSON.stringify(fieldValue);
                  }

                  // Assign tier based on LLM: Perplexity = 4, others = 5
                  const llmTier = llm.id.startsWith('perplexity') ? 4 : 5;

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
            } catch (loopError) {
              console.error(`[LLM Cascade] Error at index ${idx}:`, loopError);
              llmResponses.push({
                llm: enabledLlms[idx]?.id || `unknown-${idx}`,
                fields_found: 0,
                new_unique_fields: 0,
                success: false,
                error: `Processing error: ${String(loopError)}`
              });
            }
          }

          console.log(`=== LLM processing complete. Total fields: ${arbitrationPipeline.getFieldCount()} ===\n`);
        } else {
          console.log('[TIER 4] ⚠️  No LLMs enabled');
          console.log('[TIER 4] engines parameter:', engines);
          console.log('[TIER 4] valid engines:', ['perplexity', 'gpt', 'claude-opus', 'gemini', 'grok', 'claude-sonnet']);
          console.log('[TIER 4] Enabled LLMs: 0 - skipping LLM cascade');
        }
      }
      // Removed "Sufficient data" skip logic - LLMs always run if enabled
    } else {
      console.log('[TIER 4] ⏭️  SKIPPED - skipLLMs flag is true');
      console.log('[TIER 4] To enable LLMs, pass skipLLMs: false in request or check default settings');
    }

    // ========================================
    // BACKEND CALCULATIONS (Tier 1 Priority)
    // Calculate derived fields using backend math (never LLM)
    // ========================================
    console.log('========================================');
    console.log('BACKEND CALCULATIONS: Derived Fields');
    console.log('========================================');

    // Get current field values from arbitration pipeline
    const interimResult = arbitrationPipeline.getResult();

    // Helper to safely extract field value
    const getFieldValue = (fieldKey: string): any => {
      return interimResult.fields[fieldKey]?.value;
    };

    // Helper: Extract year from permit text like "Roof replacement permit issued 2018"
    const extractYearFromPermit = (permitText: any): number | undefined => {
      if (!permitText) return undefined;
      const match = String(permitText).match(/\b(19|20)\d{2}\b/);
      return match ? parseInt(match[0]) : undefined;
    };

    // Build PropertyData object from current field values
    const propertyData: PropertyData = {
      field_10_listing_price: getFieldValue('10_listing_price'),
      field_15_assessed_value: getFieldValue('15_assessed_value'),
      field_18_full_bathrooms: getFieldValue('18_full_bathrooms'),
      field_19_half_bathrooms: getFieldValue('19_half_bathrooms'),
      field_21_living_sqft: getFieldValue('21_living_sqft'),
      field_23_lot_size_sqft: getFieldValue('23_lot_size_sqft'),
      field_26_property_type: getFieldValue('26_property_type'),
      field_28_garage_spaces: getFieldValue('28_garage_spaces'),
      field_31_hoa_fee_annual: getFieldValue('31_hoa_fee_annual'),
      field_33_hoa_includes: getFieldValue('33_hoa_includes'),
      field_35_annual_taxes: getFieldValue('35_annual_taxes'),
      field_52_fireplace_yn: getFieldValue('52_fireplace_yn'),
      field_54_pool_yn: getFieldValue('54_pool_yn'),
      field_91_median_home_price_neighborhood: getFieldValue('91_median_home_price_neighborhood'),
      field_97_insurance_annual: getFieldValue('97_insurance_annual'),
      field_98_rental_estimate_monthly: getFieldValue('98_rental_estimate_monthly'),
      field_140_carport_spaces: getFieldValue('140_carport_spaces'),
      field_143_assigned_parking: getFieldValue('143_assigned_parking'),
      // Extract permit years from text fields (Field 60 = Roof, Field 61 = HVAC)
      permit_roof_year: extractYearFromPermit(getFieldValue('60_permit_history_roof')),
      permit_hvac_year: extractYearFromPermit(getFieldValue('61_permit_history_hvac'))
    };

    // DEBUG: Log inputs for Field 11 calculation
    console.log('[Field 11 DEBUG] Input values for price_per_sqft calculation:');
    console.log(`  - Field 10 (listing_price): ${propertyData.field_10_listing_price}`);
    console.log(`  - Field 21 (living_sqft): ${propertyData.field_21_living_sqft}`);

    // Run all backend calculations
    const calculatedFields = calculateAllDerivedFields(propertyData);

    // Add calculated fields to arbitration pipeline with Tier 1 priority
    const backendCalcFields: Record<string, FieldValue> = {};
    let calculationsAdded = 0;

    for (const [fieldKey, result] of Object.entries(calculatedFields)) {
      if (result !== null) {
        backendCalcFields[fieldKey] = {
          value: result.value,
          source: result.source,
          confidence: result.confidence,
          tier: 1 // Tier 1 = highest priority (same as Stellar MLS)
        };
        calculationsAdded++;
        console.log(`✅ Calculated ${fieldKey}: ${result.value} (method: ${result.calculation_method || 'N/A'})`);
      } else {
        console.log(`⏭️  Skipped ${fieldKey}: Missing input fields`);
      }
    }

    if (calculationsAdded > 0) {
      arbitrationPipeline.addFieldsFromSource(backendCalcFields, 'Backend Calculation');
      console.log(`✅ Added ${calculationsAdded} calculated fields to arbitration pipeline (Tier 1)`);
    } else {
      console.log('⚠️  No calculations performed - missing required input fields');
    }

    // ========================================
    // SMART DEFAULTS: N/A for Single-Family and Conditional Fields
    // ========================================
    const smartDefaults: Record<string, any> = {};
    const propertyType = getFieldValue('26_property_type') || '';
    const isSingleFamily = propertyType.toLowerCase().includes('single') ||
                           propertyType.toLowerCase().includes('detached') ||
                           propertyType.toLowerCase().includes('house');
    const isWaterfront = getFieldValue('155_water_frontage_yn') === 'Yes' ||
                         getFieldValue('155_water_frontage_yn') === true;

    // Fields N/A for single-family homes (not condos/apartments)
    if (isSingleFamily) {
      if (!getFieldValue('144_floor_number')) smartDefaults['144_floor_number'] = 'N/A (Single Family)';
      if (!getFieldValue('147_building_elevator_yn')) smartDefaults['147_building_elevator_yn'] = 'N/A';
      if (!getFieldValue('148_floors_in_unit')) smartDefaults['148_floors_in_unit'] = 'N/A (Single Family)';
    }

    // Water fields - defaults if not waterfront
    if (!isWaterfront) {
      if (!getFieldValue('156_waterfront_feet')) smartDefaults['156_waterfront_feet'] = 0; // Numeric field
      if (!getFieldValue('159_water_body_name')) smartDefaults['159_water_body_name'] = 'N/A';
    }

    // Water Access/View - Default to No if not specified and not waterfront
    if (!isWaterfront) {
      if (!getFieldValue('157_water_access_yn')) smartDefaults['157_water_access_yn'] = 'No';
      if (!getFieldValue('158_water_view_yn')) smartDefaults['158_water_view_yn'] = 'No';
    }

    // HOA Fee - If HOA=No, fee should be $0
    const hoaYn = getFieldValue('30_hoa_yn');
    if (hoaYn === false || hoaYn === 'No' || hoaYn === 'N') {
      if (!getFieldValue('31_association_fee') && !getFieldValue('31A_hoa_fee_monthly') && !getFieldValue('31B_hoa_fee_annual')) {
        smartDefaults['31_association_fee'] = 0;
        smartDefaults['31A_hoa_fee_monthly'] = 0;
        smartDefaults['31B_hoa_fee_annual'] = 0;
        console.log('✅ Inferred HOA fees = $0 (HOA=No)');
      }
    }

    if (Object.keys(smartDefaults).length > 0) {
      arbitrationPipeline.addFieldsFromSource(smartDefaults, 'Backend Logic');
      console.log(`✅ Added ${Object.keys(smartDefaults).length} smart defaults (N/A fields)`);
    }

    console.log('========================================');
    console.log('');

    // ========================================
    // GET FINAL ARBITRATION RESULT
    // ========================================
    const arbitrationResult = arbitrationPipeline.getResult();
    const totalFields = Object.keys(arbitrationResult.fields).length;
    const completionPercentage = Math.round((totalFields / 181) * 100);

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
      'perplexity-portals': 'Perplexity Portals',
      'perplexity-county': 'Perplexity County',
      'perplexity-schools': 'Perplexity Schools',
      'perplexity-crime': 'Perplexity Crime',
      'perplexity-utilities': 'Perplexity Utilities',
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
    let objectValueCount = 0;
    let primitiveValueCount = 0;
    const objectValueSamples: string[] = [];

    for (const [key, field] of Object.entries(arbitrationResult.fields)) {
      let parsedValue = field.value;

      // DIAGNOSTIC: Log value types for first 10 fields
      if (Object.keys(convertedFields).length < 10) {
        const valueType = Array.isArray(parsedValue) ? 'array' : typeof parsedValue;
        console.log(`🔍 [VALUE TYPE] ${key}: ${valueType}`,
          valueType === 'object' && parsedValue !== null ?
            `(keys: ${Object.keys(parsedValue).join(', ')})` :
            `(value: ${String(parsedValue).substring(0, 50)})`
        );
      }

      // Track object vs primitive counts
      if (typeof parsedValue === 'object' && parsedValue !== null && !Array.isArray(parsedValue) && key !== 'coordinates' && key !== '_extendedMLSData') {
        objectValueCount++;
        if (objectValueSamples.length < 5) {
          objectValueSamples.push(`${key}: ${JSON.stringify(parsedValue).substring(0, 60)}...`);
        }
      } else {
        primitiveValueCount++;
      }

      // CRITICAL: Deep unwrap if value is still wrapped (defensive fix for double-wrapping bug)
      // Check for wrapped format: {value: X, source: Y, confidence: Z} and extract X
      if (typeof parsedValue === 'object' && parsedValue !== null && 'value' in parsedValue && key !== 'coordinates') {
        console.warn(`⚠️ [UNWRAP] Field ${key} has nested value, extracting:`, JSON.stringify(parsedValue).substring(0, 100), '→', parsedValue.value);
        parsedValue = parsedValue.value;
        // Double-nested? Extract again
        if (typeof parsedValue === 'object' && parsedValue !== null && 'value' in parsedValue) {
          console.warn(`⚠️ [DEEP UNWRAP] Field ${key} triple-nested! Extracting again:`, parsedValue.value);
          parsedValue = parsedValue.value;
        }
      }

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

    // DIAGNOSTIC: Log value type summary
    console.log(`📊 [VALUE TYPE SUMMARY] Objects: ${objectValueCount}, Primitives: ${primitiveValueCount}`);
    if (objectValueCount > 0) {
      console.log(`🔍 [OBJECT SAMPLES]:`, objectValueSamples);
    }

    // Transform flat fields to nested structure for PropertyDetail & other pages
    const nestedFields = convertFlatToNestedStructure(convertedFields);

    // Build sources list from unique sources in result
    const sources = Array.from(new Set(
      Object.values(arbitrationResult.fields).map(f => f.source)
    ));

    console.log('=== ABOUT TO SEND RESPONSE ===');
    console.log('Fields count:', Object.keys(convertedFields).length);
    console.log('Conflicts:', arbitrationResult.conflicts?.length || 0);
    console.log('LLM responses:', llmResponses?.length || 0);

    return res.status(200).json({
      success: true,
      address: realAddress,
      fields: convertedFields,
      nestedFields: nestedFields,
      total_fields_found: totalFields,
      completion_percentage: completionPercentage,
      sources: sources,
      source_breakdown: sourceBreakdown,
      field_sources: sourceBreakdown, // Alias for backwards compatibility with Manual tab UI
      conflicts: arbitrationResult.conflicts,
      validation_failures: arbitrationResult.validationFailures,
      llm_quorum_fields: arbitrationResult.llmQuorumFields,
      single_source_warnings: arbitrationResult.singleSourceWarnings,
      llm_responses: llmResponses,
      strategy: 'arbitration_pipeline',
      cascade_order: ['perplexity-portals', 'perplexity-county', 'perplexity-schools', 'perplexity-crime', 'perplexity-utilities', 'perplexity-electric', 'perplexity-water', 'perplexity-internet-speed', 'perplexity-fiber', 'perplexity-cell', 'gemini', 'gpt', 'grok', 'claude-sonnet', 'claude-opus']
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
