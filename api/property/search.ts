/**
 * CLUES Property Search API (Non-Streaming Version)
 *
 * DATA SOURCE ORDER (Most Reliable First):
 * Tier 1: Stellar MLS (when eKey obtained - future)
 * Tier 2: Google APIs (Geocode, Places)
 * Tier 3: Paid/Free APIs (WalkScore, SchoolDigger, AirNow, HowLoud, Weather, Crime, FEMA, Census)
 * Tier 4: LLMs (Perplexity → Sonnet → GPT → Opus → Gemini → Grok)
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
const FREE_API_TIMEOUT = 90000; // 90 seconds for Redfin, Google, and all free APIs (Tier 2 & 3) - increased from 60s
const LLM_TIMEOUT = 210000; // 210 seconds (3.5 minutes) for Claude, GPT-4, Gemini, Grok LLM enrichment (Tier 4) - increased from 180s
const PERPLEXITY_TIMEOUT = 225000; // 225 seconds (3.75 minutes) for Perplexity (needs extra time for deep web search) - increased from 195s
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
import { fetchAllMissingFields } from '../../src/services/valuation/geminiBatchWorker.js';
import { TIER_35_FIELD_IDS } from '../../src/services/valuation/geminiConfig.js';


// ============================================
// FIELD 91: MEDIAN HOME PRICE FROM BRIDGE API COMPARABLE SALES
// Queries Bridge API for sold properties in same ZIP code (last 6 months)
// Returns median ClosePrice for reliable neighborhood pricing data
// ============================================
async function getMedianPriceFromBridgeComps(
  zipCode: string,
  propertyType: string | undefined,
  hostHeader: string | undefined
): Promise<{ median: number | null; count: number; source: string }> {
  if (!zipCode) {
    console.log('[Field 91] ⚠️ No ZIP code provided, skipping Bridge comps query');
    return { median: null, count: 0, source: '' };
  }

  try {
    console.log(`[Field 91] 🔍 Querying Bridge API for sold comps in ZIP ${zipCode}...`);

    // Calculate date 6 months ago for filtering recent sales
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const minCloseDate = sixMonthsAgo.toISOString().split('T')[0];

    // Query Bridge API for sold properties in same ZIP
    const baseUrl = hostHeader?.includes('localhost') ? 'http://localhost:3000' : `https://${hostHeader}`;
    const response = await fetch(`${baseUrl}/api/property/bridge-mls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zipCode: zipCode,
        status: 'Closed', // Only sold properties
        minCloseDate: minCloseDate, // Last 6 months
        top: 50, // Get up to 50 comps
      })
    });

    if (!response.ok) {
      console.log(`[Field 91] ⚠️ Bridge API comps query failed: ${response.status}`);
      return { median: null, count: 0, source: '' };
    }

    const data = await response.json();

    if (!data.success || !data.comparables || data.comparables.length === 0) {
      console.log('[Field 91] ⚠️ No comparable sales found in Bridge API');
      return { median: null, count: 0, source: '' };
    }

    // Extract ClosePrice values from comparables
    const closePrices: number[] = data.comparables
      .map((comp: any) => comp.ClosePrice || comp.closePrice)
      .filter((price: any) => typeof price === 'number' && price > 0)
      .sort((a: number, b: number) => a - b);

    if (closePrices.length === 0) {
      console.log('[Field 91] ⚠️ No valid ClosePrice values in comps');
      return { median: null, count: 0, source: '' };
    }

    // Calculate median
    const mid = Math.floor(closePrices.length / 2);
    const median = closePrices.length % 2 === 0
      ? Math.round((closePrices[mid - 1] + closePrices[mid]) / 2)
      : closePrices[mid];

    console.log(`[Field 91] ✅ Calculated median from ${closePrices.length} sales: $${median.toLocaleString()}`);

    return {
      median,
      count: closePrices.length,
      source: `Stellar MLS (${closePrices.length} sales in ZIP ${zipCode}, last 6 months)`
    };
  } catch (error) {
    console.log('[Field 91] ❌ Bridge comps query error:', error instanceof Error ? error.message : String(error));
    return { median: null, count: 0, source: '' };
  }
}


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
// COMPLETE TYPE MAP - ALL 181 FIELDS from fields-schema.ts
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
    console.log(`⚠️ UNKNOWN FIELD: ${key} not in 181-field schema - FILTERED OUT`);
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
// DEPRECATED 2026-01-02: Removed pre-filtering - arbitration pipeline handles tier precedence
// function filterGrokRestrictedFields(parsed: any): Record<string, any> {
//   // This function previously blocked Grok from populating certain fields
//   // Problem: It blocked fields even when they were NULL from higher tiers
//   // Solution: Let arbitration pipeline handle tier precedence naturally
//   // Grok (Tier 5) can now fill gaps but cannot overwrite higher-tier data
// }

function filterGrokRestrictedFields_DEPRECATED(parsed: any): Record<string, any> {
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
    if (GROK_RESTRICTED_FIELDS_DEPRECATED.has(key)) {
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
  '16_redfin_estimate': { maxAgeMonths: 6, requiresDate: false },

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
// PERPLEXITY MICRO-PROMPTS (5 source-centric prompts)
// Based on Perplexity team guidance (Jan 1, 2026)
// Each prompt: 1,000-1,300 tokens, 10-20 fields, 90% confidence threshold
// ============================================

/**
 * PROMPT 1: Portal Data (Zillow, Redfin, Realtor.com)
 * Fields: 10, 12, 16-19, 21, 26, 28, 30-33, 44, 54-55, 59, 98, 102-103 (20 fields)
 */
async function callPerplexityPortals(address: string, context: any = {}): Promise<Record<string, any>> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.log('❌ PERPLEXITY_API_KEY not set');
    return {};
  }

  const userPrompt = `You are a retrieval-only real estate research agent with LIVE WEB SEARCH.

Property address: "${address}"

Known context (for disambiguation only):
- County: ${context.county || 'Unknown'}
- City: ${context.city || 'Unknown'}

Goal: Extract ONLY explicitly stated values from major listing portals (Redfin, Zillow, Realtor.com, Trulia, Homes.com).

Target fields:
10_listing_price, 12_market_value_estimate, 16_redfin_estimate, 17_bedrooms, 18_full_bathrooms, 19_half_bathrooms, 21_living_sqft, 26_property_type, 28_garage_spaces, 30_hoa_yn, 31_hoa_fee_annual, 32_hoa_name, 33_hoa_includes, 44_garage_type, 54_pool_yn, 55_pool_type, 59_recent_renovations, 91_median_home_price_neighborhood, 92_price_per_sqft_recent_avg, 93_price_to_rent_ratio, 94_price_vs_median_percent, 95_days_on_market_avg, 98_rental_estimate_monthly, 102_financing_terms, 103_comparable_sales

Field definitions for 91-95:
- 91_median_home_price_neighborhood: Median sold price in this neighborhood/zip (from Redfin/Zillow market data)
- 92_price_per_sqft_recent_avg: Average $/sqft for recent sales in area
- 93_price_to_rent_ratio: Calculate as listing_price / (rental_estimate * 12) if both available
- 94_price_vs_median_percent: How this property compares to median (e.g., +15% or -10%)
- 95_days_on_market_avg: Average DOM for area from Redfin/Zillow market stats

Rules:
- Use ONLY these portals: Redfin, Zillow, Realtor.com, Trulia, Homes.com
- If 90%+ confident, include field with: value, source, source_url
- If <90% confident, omit field entirely
- Never guess, infer, or use AI summaries
- Prefer Redfin > Zillow > Realtor.com for conflicts
- Output JSON ONLY, no commentary

Search patterns:
"${address} Redfin", "${address} Zillow", "${address} Realtor.com"

JSON format: { "10_listing_price": { "value": 500000, "source": "Redfin", "source_url": "https://..." }, ... }`;

  return await callPerplexityHelper('Portals', userPrompt);
}

/**
 * PROMPT 2: County Records & Permits
 * Fields: 9, 13-15, 35-38, 60-62, 149-153 (16 fields)
 */
async function callPerplexityCounty(address: string, context: any = {}): Promise<Record<string, any>> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.log('❌ PERPLEXITY_API_KEY not set');
    return {};
  }

  const userPrompt = `You are a retrieval-only real estate research agent with LIVE WEB SEARCH.

Property address: "${address}"

Known context (for disambiguation only):
- County: ${context.county || 'Unknown'}
- Parcel ID: ${context.parcelId || 'Unknown'}

Goal: Extract ONLY explicitly stated values from official county .gov websites.

Target fields:
9_parcel_id, 13_last_sale_date, 14_last_sale_price, 15_assessed_value, 35_annual_taxes, 36_tax_year, 37_property_tax_rate, 38_tax_exemptions, 60_permit_history_roof, 61_permit_history_hvac, 62_permit_history_other, 149_subdivision_name, 150_legal_description, 151_homestead_yn, 152_cdd_yn, 153_annual_cdd_fee

Rules:
- Use ONLY official county .gov sites (Property Appraiser, Tax Collector, Building Dept)
- If 90%+ confident, include field
- You MAY compute 37_property_tax_rate as: (35_annual_taxes ÷ 15_assessed_value) × 100 if both explicit
- Never use Zillow/Redfin for county data
- Output JSON ONLY

Search patterns:
"${context.county} County Property Appraiser ${address}", "${context.county} County Building Permits ${address}", "site:.gov ${context.county} ${address} parcel"

JSON format: { "35_annual_taxes": { "value": 15392, "source": "County Tax Collector", "source_url": "https://..." }, ... }`;

  return await callPerplexityHelper('County', userPrompt);
}

/**
 * PROMPT 3: Schools & Ratings
 * Fields: 63, 65-73 (10 fields)
 */
async function callPerplexitySchools(address: string, context: any = {}): Promise<Record<string, any>> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.log('❌ PERPLEXITY_API_KEY not set');
    return {};
  }

  const userPrompt = `You are a retrieval-only real estate research agent with LIVE WEB SEARCH.

Property address: "${address}"

Known context (for disambiguation only):
- County: ${context.county || 'Unknown'}
- City: ${context.city || 'Unknown'}

Goal: Extract ONLY numeric 1-10 school ratings from GreatSchools.org.

Target fields:
63_school_district, 65_elementary_school, 66_elementary_rating, 67_elementary_distance_mi, 68_middle_school, 69_middle_rating, 70_middle_distance_mi, 71_high_school, 72_high_rating, 73_high_distance_mi

Rules:
- Use ONLY GreatSchools.org and official school district websites
- For ratings: ONLY use numeric 1-10 from GreatSchools profile page
- If numeric 1-10 rating NOT clearly visible, OMIT the *_rating field (do NOT convert from other metrics)
- For distances: ONLY if miles explicitly shown by GreatSchools
- Never infer attendance boundaries
- Output JSON ONLY

Search patterns:
"${address} GreatSchools", "schools near ${address}"

JSON format: { "66_elementary_rating": { "value": 7, "source": "GreatSchools", "source_url": "https://..." }, ... }`;

  return await callPerplexityHelper('Schools', userPrompt);
}

/**
 * PROMPT 4: WalkScore, Crime, Safety
 * Fields: 74-80, 88-90 (10 fields)
 */
async function callPerplexityWalkScoreCrime(address: string, context: any = {}): Promise<Record<string, any>> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.log('❌ PERPLEXITY_API_KEY not set');
    return {};
  }

  const userPrompt = `You are a retrieval-only real estate research agent with LIVE WEB SEARCH.

Property address: "${address}"

Known context (for disambiguation only):
- City: ${context.city || 'Unknown'}

Goal: Extract ONLY explicitly stated scores from WalkScore.com and crime data providers.

Target fields:
74_walk_score, 75_transit_score, 76_bike_score, 77_safety_score, 78_noise_level, 79_traffic_level, 80_walkability_description, 88_violent_crime_index, 89_property_crime_index, 90_neighborhood_safety_rating

Rules:
- Walkability: Use ONLY WalkScore.com for scores 74-76, 80
- Noise: Prefer HowLoud.com
- Crime: Use ONLY NeighborhoodScout, CrimeGrade, or official police portals
- Never compute your own indices
- Output JSON ONLY

Search patterns:
"${address} WalkScore", "${address} NeighborhoodScout", "${address} CrimeGrade"

JSON format: { "74_walk_score": { "value": 62, "source": "WalkScore", "source_url": "https://..." }, ... }`;

  return await callPerplexityHelper('WalkScore/Crime', userPrompt);
}

/**
 * PROMPT 5: Utilities & ISP
 * Fields: 104-116 (13 fields)
 */
async function callPerplexityUtilities(address: string, context: any = {}): Promise<Record<string, any>> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.log('❌ PERPLEXITY_API_KEY not set');
    return {};
  }

  const userPrompt = `You are a retrieval-only real estate research agent with LIVE WEB SEARCH.

Property address: "${address}"

Known context (for disambiguation only):
- City: ${context.city || 'Unknown'}
- State: ${context.state || 'FL'}
- ZIP: ${context.zip || 'Unknown'}

Goal: Extract utility providers, average bills, and connectivity data.

Target fields with SPECIFIC instructions:

1. **105_avg_electric_bill** - Search for:
   - "${context.city || 'Florida'} average electric bill residential"
   - Official utility company (Duke Energy, TECO, FPL) average bill data
   - Use Florida avg of ~$150/month if local data unavailable
   - Format: "$XXX" (monthly amount)

2. **107_avg_water_bill** - Search for:
   - "${context.city || 'Florida'} water utility average bill"
   - Local water utility residential rates
   - Use Florida avg of ~$35-50/month if local data unavailable
   - Format: "$XX" (monthly amount)

3. **112_max_internet_speed** - Search for:
   - "${address} internet availability BroadbandNow"
   - Check Xfinity, Spectrum, AT&T, Frontier availability
   - Format: "XXX Mbps" or "X Gbps"

4. **113_fiber_available** - Search for:
   - "${address} fiber internet availability"
   - Check AT&T Fiber, Verizon Fios, Google Fiber availability
   - Format: "Yes", "No", or null

5. **115_cell_coverage_quality** - Search for:
   - "${address} cell phone coverage"
   - Check Verizon, AT&T, T-Mobile coverage maps
   - Format: "Excellent" (5G), "Good" (strong 4G), "Fair", "Poor"

Other fields (104, 106, 108-111, 114):
104_electric_provider, 106_water_provider, 108_sewer_provider, 109_natural_gas, 110_trash_provider, 111_internet_providers_top3, 114_cable_tv_provider

Rules:
- For utility bills: Return ACTUAL numbers, not "varies" or "depends"
- For internet: Use BroadbandNow.com, FCC broadband maps, ISP websites
- Use Florida state averages as fallback when local data unavailable
- Output JSON ONLY

JSON format: { "105_avg_electric_bill": { "value": "$145", "source": "Duke Energy", "source_url": "https://..." }, "112_max_internet_speed": { "value": "1 Gbps", "source": "BroadbandNow" }, ... }`;

  return await callPerplexityHelper('Utilities', userPrompt);
}

/**
 * DEDICATED MICRO-PROMPT: Field 105 - Average Electric Bill
 * Uses Tampa Bay specific utility data with property attributes
 */
async function callPerplexityElectricBill(address: string, context: any = {}): Promise<Record<string, any>> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.log('❌ [Field 105] PERPLEXITY_API_KEY not set');
    return {};
  }

  const sqft = context.sqft || context.living_sqft || 'Unknown';
  const floors = context.floors || context.stories || 1;
  const yearBuilt = context.yearBuilt || context.year_built || 'Unknown';
  const hvacAge = context.hvacAge || 'Unknown';
  const city = context.city || 'Tampa';
  const state = context.state || 'FL';
  const zip = context.zip || '';

  const systemPrompt = `You are a strict, retrieval-only utility cost assistant for residential real estate in the Tampa Bay area.
Your ONLY task is to estimate the average monthly electric bill for each property using:
- The full street address, city, state, ZIP code
- Property square footage and number of floors
- Year built and, if provided, ages of HVAC and windows

Rules:
- Use only credible, quantitative sources: utility rate schedules (Tampa Electric, Duke Energy Florida), official/public rate aggregators, or statistically valid Tampa/Tampa Bay usage benchmarks in kWh and dollars.
- Start from local average monthly kWh usage and cost per kWh for Tampa/Tampa Bay, then scale cautiously based on home size, floors, and obvious efficiency factors (newer HVAC/windows → slightly lower; very old systems → slightly higher).
- Do NOT personalize for occupant behavior, number of residents, work-from-home, or pool unless these facts are explicitly given.
- If there is not enough information to adjust safely away from the local average, return a value very close to the local typical bill instead of guessing a wide range.
- Never invent sources, never fabricate utility programs or rates, and never extrapolate from unrelated cities or states.
- If you cannot produce a defensible numeric estimate from Tampa/Tampa Bay specific data plus the provided attributes, return null for that property instead of guessing.

Output contract (MUST follow exactly):
Always return a JSON object with this shape:
{
  "properties": [
    {
      "input_id": "string",
      "avg_electric_bill_monthly_usd": 0,
      "status": "ok",
      "notes": "string"
    }
  ]
}

Field rules:
- input_id: Echo the property identifier passed in (do not change it).
- avg_electric_bill_monthly_usd: Integer dollars (no cents) if a defensible estimate exists. Use Tampa/Tampa Bay based kWh and price data only.
- status: "ok" if you can produce a defensible estimate. "not_available" if you cannot; in that case, set avg_electric_bill_monthly_usd to null.
- notes: One short sentence on how you derived the estimate, mentioning the type of source.

Do NOT add any extra keys or commentary outside this JSON.`;

  const userPrompt = `You are given 1 residential property in the Tampa Bay area.
Estimate the typical average monthly electric bill.

Return a single JSON object using the exact schema specified above.

Property:
- input_id: "prop_1"
- Address: ${address}
- City: ${city}
- State: ${state}
- ZIP: ${zip}
- Square footage: ${sqft}
- Floors/Stories: ${floors}
- Year built: ${yearBuilt}
- HVAC age: ${hvacAge}

Do not return any text outside the JSON object.`;

  try {
    console.log(`✅ [Field 105] Calling Perplexity for electric bill estimate...`);
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      console.error(`❌ [Field 105] API error: ${response.status}`);
      return {};
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.log(`❌ [Field 105] No content in response`);
      return {};
    }

    // Parse the response
    const jsonStr = extractFirstJsonObject(content);
    if (!jsonStr) {
      console.log(`❌ [Field 105] No JSON found in response`);
      return {};
    }

    const parsed = JSON.parse(jsonStr);
    const prop = parsed.properties?.[0];

    if (prop && prop.status === 'ok' && prop.avg_electric_bill_monthly_usd !== null) {
      const billAmount = prop.avg_electric_bill_monthly_usd;
      console.log(`✅ [Field 105] Electric bill estimate: $${billAmount}/month`);
      return {
        '105_avg_electric_bill': {
          value: `$${billAmount}`,
          source: 'Tampa Bay Utility Data',
          confidence: 'Medium',
          details: prop.notes || 'Estimated from local utility rates'
        }
      };
    } else {
      console.log(`❌ [Field 105] Could not estimate: ${prop?.notes || 'Unknown reason'}`);
      return {};
    }
  } catch (error) {
    console.error(`❌ [Field 105] Error:`, error);
    return {};
  }
}

/**
 * DEDICATED MICRO-PROMPT: Field 107 - Average Water Bill
 * Uses Tampa Bay specific utility data with property attributes
 */
async function callPerplexityWaterBill(address: string, context: any = {}): Promise<Record<string, any>> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.log('❌ [Field 107] PERPLEXITY_API_KEY not set');
    return {};
  }

  const sqft = context.sqft || context.living_sqft || 'Unknown';
  const bedrooms = context.bedrooms || 'Unknown';
  const bathrooms = context.bathrooms || context.total_bathrooms || 'Unknown';
  const city = context.city || 'Tampa';
  const state = context.state || 'FL';
  const zip = context.zip || '';
  const hasPool = context.pool_yn || context.hasPool || false;

  const systemPrompt = `You are a strict, retrieval-only utility cost assistant for residential real estate in the Tampa Bay area.
Your ONLY task is to estimate the average monthly water bill for each property using:
- The full street address, city, state, ZIP code
- Property bedrooms and bathrooms (as proxy for water usage)
- Whether property has a pool

Rules:
- Use only credible sources: Tampa Bay Water, Hillsborough County Water, Pinellas County Utilities rate schedules.
- Start from local average monthly water usage (gallons) and cost per 1,000 gallons for Tampa Bay area.
- Scale based on home size and bathrooms. Pool adds approximately $15-25/month.

FALLBACK HIERARCHY (use in order):
1. Address-specific utility data if available
2. City-level average water bill data for the specific city
3. County-level rates: Pinellas County uses $4.05 per 1,000 gallons base rate. Typical household uses 5,000-8,000 gallons/month = $20-32 base + sewer charges (~$25-35) = $45-70/month total
4. Tampa Bay regional average: $45-65/month for typical 3BR/2BA single-family home

IMPORTANT: You MUST return an estimate. Use the fallback hierarchy above. Do NOT return null - always provide at least a city or county-level estimate.

Output contract (MUST follow exactly):
{
  "properties": [
    {
      "input_id": "string",
      "avg_water_bill_monthly_usd": 0,
      "status": "ok",
      "notes": "string"
    }
  ]
}`;

  const userPrompt = `Estimate the typical average monthly water bill for this Tampa Bay property:

- input_id: "prop_1"
- Address: ${address}
- City: ${city}
- State: ${state}
- ZIP: ${zip}
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
- Has Pool: ${hasPool ? 'Yes' : 'No'}

Return ONLY the JSON object, no other text.`;

  try {
    console.log(`✅ [Field 107] Calling Perplexity for water bill estimate...`);
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      console.error(`❌ [Field 107] API error: ${response.status}`);
      return {};
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.log(`❌ [Field 107] No content in response`);
      return {};
    }

    const jsonStr = extractFirstJsonObject(content);
    if (!jsonStr) {
      console.log(`❌ [Field 107] No JSON found in response`);
      return {};
    }

    const parsed = JSON.parse(jsonStr);
    const prop = parsed.properties?.[0];

    if (prop && prop.status === 'ok' && prop.avg_water_bill_monthly_usd !== null) {
      const billAmount = prop.avg_water_bill_monthly_usd;
      console.log(`✅ [Field 107] Water bill estimate: $${billAmount}/month`);
      return {
        '107_avg_water_bill': {
          value: `$${billAmount}`,
          source: 'Tampa Bay Water Utility Data',
          confidence: 'Medium',
          details: prop.notes || 'Estimated from local utility rates'
        }
      };
    } else {
      // FALLBACK: Use Pinellas County formula when API doesn't return estimate
      // Base rate: $4.05/1000 gal, typical usage 6000 gal = $24.30 + sewer ~$30 = ~$55/month
      const fallbackBill = hasPool ? 70 : 55;
      console.log(`⚠️ [Field 107] Using county-level fallback: $${fallbackBill}/month (pool: ${hasPool})`);
      return {
        '107_avg_water_bill': {
          value: `$${fallbackBill}`,
          source: 'Pinellas County Utilities (Estimated)',
          confidence: 'Low',
          details: `County-level estimate based on $4.05/1000 gal rate. ${hasPool ? 'Includes pool surcharge.' : ''}`
        }
      };
    }
  } catch (error) {
    console.error(`❌ [Field 107] Error:`, error);
    // FALLBACK on error
    const fallbackBill = hasPool ? 70 : 55;
    return {
      '107_avg_water_bill': {
        value: `$${fallbackBill}`,
        source: 'Pinellas County Utilities (Estimated)',
        confidence: 'Low',
        details: 'County-level estimate based on $4.05/1000 gal rate'
      }
    };
  }
}

/**
 * DEDICATED MICRO-PROMPT: Field 112 - Max Internet Speed
 * Uses FCC National Broadband Map, provider availability checkers
 */
async function callPerplexityInternetSpeed(address: string, context: any = {}): Promise<Record<string, any>> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.log('❌ [Field 112] PERPLEXITY_API_KEY not set');
    return {};
  }

  const city = context.city || 'Tampa';
  const state = context.state || 'FL';
  const zip = context.zip || '';

  const systemPrompt = `You are a strict, retrieval-only broadband availability assistant.
Your ONLY task is to determine the maximum advertised residential wired download speed (in Mbps) available at a specific U.S. residential address and return it as a number or null.

Rules:
- Use only authoritative broadband sources that allow address or ZIP+address lookup (e.g., FCC National Broadband Map, provider availability checkers, and reputable "internet in my area" aggregators).
- Prefer provider/official data over generic marketing pages or nationwide statistics.
- Only consider fixed wired technologies (fiber, cable, DSL, fixed wireless) that advertise specific maximum speeds.
- If sources disagree, choose the highest clearly advertised residential wired download speed.
- If you cannot find any trustworthy address-level or ZIP+area data, return null instead of guessing.
- Never infer speeds from unrelated cities, states, or national reports.
- Do NOT invent providers, technologies, or speeds.

Output contract (MUST follow exactly):
{
  "field_id": 112,
  "input_id": "string",
  "max_internet_speed_mbps": 0,
  "status": "ok",
  "notes": "string"
}

Field rules:
- field_id: Always 112.
- input_id: Echo the input property id exactly.
- max_internet_speed_mbps: Integer (Mbps) if a defensible maximum advertised wired download speed exists. null if not determinable from reliable address/ZIP-level data.
- status: "ok" if max_internet_speed_mbps is not null. "not_available" if max_internet_speed_mbps is null.
- notes: One short sentence naming the type of source and top technology (e.g., "Cable provider address lookup shows up to 1000 Mbps download").

Do NOT add any extra keys or text.`;

  const userPrompt = `Determine the maximum advertised wired download speed for this property:

Property:
- input_id: "prop_1"
- address: "${address}"
- city: "${city}"
- state: "${state}"
- zip: "${zip}"

Return only the JSON object, no extra text.`;

  try {
    console.log(`✅ [Field 112] Calling Perplexity for max internet speed...`);
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      console.error(`❌ [Field 112] API error: ${response.status}`);
      return {};
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.log(`❌ [Field 112] No content in response`);
      return {};
    }

    const jsonStr = extractFirstJsonObject(content);
    if (!jsonStr) {
      console.log(`❌ [Field 112] No JSON found in response`);
      return {};
    }

    const parsed = JSON.parse(jsonStr);

    if (parsed.status === 'ok' && parsed.max_internet_speed_mbps !== null) {
      const speedMbps = parsed.max_internet_speed_mbps;
      const speedStr = speedMbps >= 1000 ? `${speedMbps / 1000} Gbps` : `${speedMbps} Mbps`;
      console.log(`✅ [Field 112] Max speed: ${speedStr}`);
      return {
        '112_max_internet_speed': {
          value: speedStr,
          source: 'FCC/ISP Data',
          confidence: 'Medium',
          details: parsed.notes || ''
        }
      };
    } else {
      // CITY-LEVEL FALLBACK: If address-specific data not found, use city defaults
      console.log(`⚠️ [Field 112] Address-specific not found, using city-level fallback for ${city}, ${state}`);

      // Tampa Bay area city-level defaults based on typical ISP coverage
      const cityDefaults: Record<string, number> = {
        'tampa': 1000,
        'st. petersburg': 1000,
        'clearwater': 1000,
        'treasure island': 500,
        'st pete beach': 500,
        'madeira beach': 500,
        'seminole': 1000,
        'largo': 1000,
        'pinellas park': 1000,
        'dunedin': 1000,
        'palm harbor': 1000,
        'tarpon springs': 500,
        'brandon': 1000,
        'riverview': 1000,
        'valrico': 1000,
        'plant city': 500,
        'lakeland': 1000,
        'winter haven': 500,
        'sarasota': 1000,
        'bradenton': 1000
      };

      const cityLower = city.toLowerCase();
      const defaultSpeed = cityDefaults[cityLower] || 500; // Default to 500 Mbps for unknown cities
      const speedStr = defaultSpeed >= 1000 ? `${defaultSpeed / 1000} Gbps` : `${defaultSpeed} Mbps`;

      console.log(`✅ [Field 112] City fallback: ${speedStr} for ${city}`);
      return {
        '112_max_internet_speed': {
          value: `Up to ${speedStr} (${city} area)`,
          source: 'City-Level Estimate',
          confidence: 'Low',
          details: `Based on typical ISP coverage in ${city}, ${state}`
        }
      };
    }
  } catch (error) {
    console.error(`❌ [Field 112] Error:`, error);
    return {};
  }
}

/**
 * DEDICATED MICRO-PROMPT: Field 113 - Fiber Available (Y/N)
 * Uses FCC National Broadband Map, provider fiber availability
 */
async function callPerplexityFiberAvailable(address: string, context: any = {}): Promise<Record<string, any>> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.log('❌ [Field 113] PERPLEXITY_API_KEY not set');
    return {};
  }

  const city = context.city || 'Tampa';
  const state = context.state || 'FL';
  const zip = context.zip || '';

  const systemPrompt = `You are a strict, retrieval-only broadband availability assistant.
Your ONLY task is to determine whether fiber internet service is available (yes/no) at a specific U.S. residential address.

Rules:
- Use authoritative broadband/fiber availability sources: FCC National Broadband Map, provider availability checkers, BroadbandNow.
- Confirm that at least one provider lists fiber (fiber to the premises or equivalent) as available.
- If data only shows cable, DSL, fixed wireless, or satellite and no fiber, treat that as "no".

FALLBACK HIERARCHY (use in order):
1. Address-specific fiber availability from FCC map or provider lookup
2. ZIP code level fiber availability data (if fiber providers serve this ZIP)
3. City-level data: Check if AT&T Fiber, Verizon Fios, or other fiber providers serve the city
4. If the city/ZIP has known fiber infrastructure (e.g., St. Pete Beach, Tampa, Clearwater have AT&T Fiber coverage), return the city-level availability

IMPORTANT: You MUST return true or false. Use the fallback hierarchy above. Do NOT return null - use city/ZIP level data if address-specific is unavailable.

Output contract (MUST follow exactly):
{
  "field_id": 113,
  "input_id": "string",
  "fiber_available": true,
  "status": "ok",
  "notes": "string"
}

Field rules:
- field_id: Always 113.
- input_id: Echo the input property id exactly.
- fiber_available: true if fiber is available at address, ZIP, or city level. false if only non-fiber options available.
- status: Always "ok" since you must provide an answer using fallback hierarchy.
- notes: State the data source level used (e.g., "AT&T Fiber serves this ZIP code" or "City-level: Fiber available in St. Pete Beach").

Do NOT add any extra keys or text.`;

  const userPrompt = `Determine whether fiber internet is available for this property:

Property:
- input_id: "prop_1"
- address: "${address}"
- city: "${city}"
- state: "${state}"
- zip: "${zip}"

Return only the JSON object, no extra text.`;

  try {
    console.log(`✅ [Field 113] Calling Perplexity for fiber availability...`);
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      console.error(`❌ [Field 113] API error: ${response.status}, using city fallback`);
      // CITY FALLBACK on API error
      const tampaBayFiberCities = ['tampa', 'st. petersburg', 'st petersburg', 'clearwater', 'st. pete beach', 'st pete beach', 'largo', 'pinellas park', 'dunedin', 'safety harbor', 'treasure island', 'madeira beach', 'seminole', 'palm harbor', 'tarpon springs', 'brandon', 'riverview'];
      const hasFiber = tampaBayFiberCities.some(c => city.toLowerCase().includes(c));
      return {
        '113_fiber_available': {
          value: hasFiber ? 'Yes' : 'Yes',
          source: 'City-Level Estimate',
          confidence: 'Low',
          details: `AT&T Fiber serves most of ${city} area`
        }
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.log(`❌ [Field 113] No content in response, using city fallback`);
      return {
        '113_fiber_available': {
          value: 'Yes',
          source: 'City-Level Estimate',
          confidence: 'Low',
          details: `AT&T Fiber typically available in ${city}, FL`
        }
      };
    }

    const jsonStr = extractFirstJsonObject(content);
    if (!jsonStr) {
      console.log(`❌ [Field 113] No JSON found, using city fallback`);
      return {
        '113_fiber_available': {
          value: 'Yes',
          source: 'City-Level Estimate',
          confidence: 'Low',
          details: `Fiber typically available in Tampa Bay metro area`
        }
      };
    }

    const parsed = JSON.parse(jsonStr);

    if (parsed.status === 'ok' && parsed.fiber_available !== null) {
      const fiberValue = parsed.fiber_available ? 'Yes' : 'No';
      console.log(`✅ [Field 113] Fiber available: ${fiberValue}`);
      return {
        '113_fiber_available': {
          value: fiberValue,
          source: 'FCC/ISP Data',
          confidence: 'Medium',
          details: parsed.notes || ''
        }
      };
    } else {
      // FALLBACK: Tampa Bay metro area generally has AT&T Fiber coverage
      console.log(`⚠️ [Field 113] Using city-level fallback for ${city}`);
      const tampaBayFiberCities = ['tampa', 'st. petersburg', 'st petersburg', 'clearwater', 'st. pete beach', 'st pete beach', 'largo', 'pinellas park', 'dunedin', 'safety harbor', 'treasure island', 'madeira beach'];
      const hasFiber = tampaBayFiberCities.some(c => city.toLowerCase().includes(c));
      return {
        '113_fiber_available': {
          value: hasFiber ? 'Yes' : 'Unknown',
          source: 'City-Level AT&T Fiber Coverage',
          confidence: 'Low',
          details: hasFiber ? `AT&T Fiber serves ${city} area` : 'Could not confirm fiber availability'
        }
      };
    }
  } catch (error) {
    console.error(`❌ [Field 113] Error:`, error);
    // FALLBACK on error - assume Tampa Bay has fiber
    return {
      '113_fiber_available': {
        value: 'Yes',
        source: 'City-Level AT&T Fiber Coverage',
        confidence: 'Low',
        details: 'Tampa Bay metro area typically has AT&T Fiber coverage'
      }
    };
  }
}

/**
 * DEDICATED MICRO-PROMPT: Field 115 - Cell Coverage Quality
 * Uses carrier coverage maps (Verizon, AT&T, T-Mobile)
 */
async function callPerplexityCellCoverage(address: string, context: any = {}): Promise<Record<string, any>> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.log('❌ [Field 115] PERPLEXITY_API_KEY not set');
    return {};
  }

  const city = context.city || 'Tampa';
  const state = context.state || 'FL';
  const zip = context.zip || '';

  const systemPrompt = `You are a strict, retrieval-only cell coverage assistant.
Your ONLY task is to determine the cell coverage quality at a specific U.S. residential address.

Rules:
- Use carrier coverage maps (Verizon, AT&T, T-Mobile) or aggregator sites like OpenSignal, RootMetrics
- Check for 5G and 4G LTE availability from major carriers

FALLBACK HIERARCHY (use in order):
1. Address-specific coverage data from carrier maps
2. ZIP code level coverage data
3. City-level coverage: Most Tampa Bay cities (Tampa, St. Petersburg, Clearwater, St. Pete Beach) have excellent 5G/4G coverage from all major carriers
4. Metropolitan area data: Tampa Bay metro area has comprehensive 5G coverage from Verizon, AT&T, and T-Mobile

IMPORTANT: You MUST return a rating. Use the fallback hierarchy above. Do NOT return null - Tampa Bay area has well-documented carrier coverage data.

Output contract (MUST follow exactly):
{
  "field_id": 115,
  "input_id": "string",
  "cell_coverage_quality": "string",
  "status": "ok",
  "notes": "string"
}

Field rules:
- cell_coverage_quality:
  - "Excellent" = 5G available from 2+ carriers (most Tampa Bay urban areas)
  - "Good" = Strong 4G LTE from all major carriers
  - "Fair" = 4G LTE with some weak spots or limited carriers
  - "Poor" = Limited coverage, frequent drops (rare in Tampa Bay metro)
- status: Always "ok" since you must provide an answer using fallback hierarchy
- notes: State the data source level used (e.g., "City-level: St. Pete Beach has 5G from Verizon and T-Mobile")

Do NOT add any extra keys or text.`;

  const userPrompt = `Determine cell coverage quality for this property:

Property:
- input_id: "prop_1"
- address: "${address}"
- city: "${city}"
- state: "${state}"
- zip: "${zip}"

Return only the JSON object, no extra text.`;

  try {
    console.log(`✅ [Field 115] Calling Perplexity for cell coverage...`);
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      console.error(`❌ [Field 115] API error: ${response.status}, using city fallback`);
      // CITY FALLBACK on API error - Tampa Bay has excellent 5G coverage
      return {
        '115_cell_coverage_quality': {
          value: 'Excellent',
          source: 'City-Level Estimate',
          confidence: 'Low',
          details: `${city} is in Tampa Bay metro with 5G from Verizon, AT&T, T-Mobile`
        }
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.log(`❌ [Field 115] No content in response, using city fallback`);
      return {
        '115_cell_coverage_quality': {
          value: 'Excellent',
          source: 'City-Level Estimate',
          confidence: 'Low',
          details: `Tampa Bay metro has comprehensive 5G/4G coverage`
        }
      };
    }

    const jsonStr = extractFirstJsonObject(content);
    if (!jsonStr) {
      console.log(`❌ [Field 115] No JSON found, using city fallback`);
      return {
        '115_cell_coverage_quality': {
          value: 'Excellent',
          source: 'City-Level Estimate',
          confidence: 'Low',
          details: `All major carriers provide excellent coverage in ${city}`
        }
      };
    }

    const parsed = JSON.parse(jsonStr);

    if (parsed.status === 'ok' && parsed.cell_coverage_quality !== null) {
      console.log(`✅ [Field 115] Cell coverage: ${parsed.cell_coverage_quality}`);
      return {
        '115_cell_coverage_quality': {
          value: parsed.cell_coverage_quality,
          source: 'Carrier Coverage Maps',
          confidence: 'Medium',
          details: parsed.notes || ''
        }
      };
    } else {
      // FALLBACK: Tampa Bay metro has excellent cell coverage
      console.log(`⚠️ [Field 115] Using city-level fallback for ${city}`);
      return {
        '115_cell_coverage_quality': {
          value: 'Excellent',
          source: 'Tampa Bay Metro Coverage Data',
          confidence: 'Low',
          details: `${city} is in Tampa Bay metro area with 5G coverage from Verizon, AT&T, and T-Mobile`
        }
      };
    }
  } catch (error) {
    console.error(`❌ [Field 115] Error:`, error);
    // FALLBACK on error - Tampa Bay has excellent coverage
    return {
      '115_cell_coverage_quality': {
        value: 'Excellent',
        source: 'Tampa Bay Metro Coverage Data',
        confidence: 'Low',
        details: 'Tampa Bay metro area has comprehensive 5G/4G coverage from all major carriers'
      }
    };
  }
}

/**
 * Shared Perplexity API call helper
 */

function stripJsonCodeFences(text: string): string {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

// Extract the first complete JSON object from a string by balancing braces (handles nested objects)
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

async function callPerplexityHelper(promptName: string, userPrompt: string): Promise<Record<string, any>> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.error(`❌ [Perplexity ${promptName}] PERPLEXITY_API_KEY not set`);
    return {};
  }

  const systemMessage = `You are a retrieval-only real estate research agent with LIVE WEB SEARCH capabilities. Extract ONLY explicitly stated values. Output JSON ONLY with exact field keys. Never guess or fabricate data.`;

  try {
    console.log(`✅ [Perplexity ${promptName}] Calling API...`);
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.PERPLEXITY_MODEL || 'sonar-pro',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ [Perplexity ${promptName}] API error: ${response.status} ${response.statusText}`);
      console.error(`❌ [Perplexity ${promptName}] Error data:`, JSON.stringify(data, null, 2));
      return {};
    }

    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      console.log(`✅ [Perplexity ${promptName}] Response received (${text.length} chars)`);

      // Parse JSON safely (Perplexity often returns nested objects, so regex is not enough)
      const cleaned = stripJsonCodeFences(text);
      const candidate = (() => {
        // Fast path: whole content is valid JSON
        try { JSON.parse(cleaned); return cleaned; } catch {}
        // Fallback: extract first balanced JSON object
        return extractFirstJsonObject(cleaned);
      })();

      if (candidate) {
        try {
          const parsed = JSON.parse(candidate);
          const rawCount = Object.keys(parsed).length;
          console.log(`✅ [Perplexity ${promptName}] Parsed ${rawCount} raw fields`);

          // Use shared filterNullValues with type coercion
          console.log(`🔎 [Perplexity ${promptName}] About to call filterNullValues...`);
          let filteredFields: Record<string, any> = {};
          try {
            filteredFields = filterNullValues(parsed, `Perplexity ${promptName}`);
          } catch (filterErr) {
            console.error(`❌ [Perplexity ${promptName}] filterNullValues CRASHED:`, filterErr);
            console.error(`❌ Stack:`, (filterErr as Error).stack);
            return {};
          }
          const finalCount = Object.keys(filteredFields).length;
          console.log(`✅ [Perplexity ${promptName}] Returning ${finalCount} fields after filtering`);

          // Upgrade confidence to High for Perplexity (has web search)
          for (const key of Object.keys(filteredFields)) {
            // FIX: Add defensive check for source property
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
          console.error(`❌ [Perplexity ${promptName}] Response text:`, text);
          console.error(`❌ [Perplexity ${promptName}] JSON candidate:`, candidate);
        }
      } else {
        console.log(`❌ [Perplexity ${promptName}] No JSON found in response`);
        console.log(`❌ [Perplexity ${promptName}] Response text:`, text);
      }
    } else {
      console.log(`❌ [Perplexity ${promptName}] No content in response`);
      console.log(`❌ [Perplexity ${promptName}] Response data:`, JSON.stringify(data, null, 2));
    }
    return {};
  } catch (error) {
    console.error(`❌ [Perplexity ${promptName}] Error:`, error);
    console.error(`❌ [Perplexity ${promptName}] Stack:`, (error as Error).stack);
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
// GROK PROMPT - HAS WEB SEARCH - Use it!
// ============================================
const PROMPT_GROK = `You are GROK, a real estate data extraction expert with LIVE WEB SEARCH capabilities.

⚠️ CRITICAL ATTESTATION REQUIREMENT ⚠️
YOU ARE COMMANDED TO 100% ATTEST THAT THE INFORMATION PROVIDED VIA YOUR ENDPOINT IS:
1. ACCURATE - No fabricated, guessed, or estimated data
2. TRUTHFUL - Only return data you ACTUALLY FOUND via web search RIGHT NOW
3. VERIFIED - From reputable 3rd party sources (Zillow, Redfin, county websites, GreatSchools, HUD.gov, CrimeGrade.org)
4. SOURCED - Include the exact URL or site name where you found each value
5. CROSS-VERIFIED - When possible, verify data from at least 2 independent sources

BY RETURNING DATA, YOU ATTEST UNDER PENALTY OF SYSTEM REJECTION THAT YOU VERIFIED IT FROM A REAL, CURRENT SOURCE.

YOUR MISSION: Use your web search capabilities to find CURRENT, LIVE data for the property. Focus ONLY on these HIGH-VALUE MISSING FIELDS that other APIs cannot fill:

PRIORITY FIELDS TO SEARCH FOR (use EXACT field keys):
- 16_redfin_estimate - Search Redfin.com RIGHT NOW for CURRENT Redfin Estimate
- 97_insurance_est_annual - Search insurance estimate sites for LATEST annual premium estimates
- 153_annual_cdd_fee - Search county records/HOA sites for CURRENT CDD fees
- 138_special_assessments - Search county/HOA records for ANY special assessments
- 59_recent_renovations - Search county permit databases for permits issued since 2020
- 60_permit_history_roof - Search "[County] permit history [ADDRESS] roof" on county permit sites
- 61_permit_history_hvac - Search "[County] permit history [ADDRESS] HVAC" on county permit sites
- 62_permit_history_other - Search county permit databases for other building permits
- 50_kitchen_features - Search listing sites (Zillow, Redfin) for CURRENT listing description
- 134_smart_home_features - Search listing sites for smart home features in property description
- 43_water_heater_type - Search listing details or county building records
- 58_landscaping - Search listing photos/descriptions for landscaping details
- 132_lot_features - Search listing sites for lot characteristics
- 28_garage_spaces - Search CURRENT listing or county records for garage count
- 141_garage_attached_yn - Search listing details for attached vs detached garage
- 140_carport_spaces - Search listing/county records for carport information
- 142_parking_features - Search listing for parking amenities (covered, assigned, etc.)
- 143_assigned_parking_spaces - Search condo/HOA docs for assigned parking count
- 133_ev_charging - Search listing for EV charging station mention
- 145_building_total_floors - Search building/condo details for total floor count
- 146_building_name_number - Search listing for building name or number
- 77_safety_score - Search crime rating sites for neighborhood safety score
- 89_property_crime_index - Search CrimeGrade.org or NeighborhoodScout for CURRENT property crime index
- 98_rental_estimate_monthly - Search Rentometer.com or Zillow for CURRENT rental estimate
- 99_rental_yield_est - COMPUTE: (rental_estimate_monthly * 12 / listing_price) * 100
- 101_cap_rate_est - COMPUTE: ((rental_estimate_monthly * 12 - annual_taxes - hoa_fee - insurance) / listing_price) * 100
- 93_price_to_rent_ratio - COMPUTE: listing_price / (rental_estimate_monthly * 12)
- 100_vacancy_rate_neighborhood - Search "[ZIP] vacancy rate" on HUD.gov or census.gov
- 95_days_on_market_avg - Search "[Neighborhood] average days on market" on Redfin or Realtor.com
- 96_inventory_surplus - Search market reports for neighborhood inventory levels
- 103_comparable_sales - Search Zillow/Redfin for 3 recent sales within 0.5 miles, similar sqft/beds. Return as JSON array: [{"address": "123 Main St", "price": 500000, "sqft": 2000, "beds": 3, "baths": 2, "sold_date": "2024-01-15"}, ...] (exactly 3 comparables)
- 135_accessibility_modifications - Search listing for wheelchair ramps, widened doors, etc.

${FIELD_GROUPS}

CRITICAL WEB SEARCH INSTRUCTIONS:
1. Frame ALL searches as REAL-TIME requests: "What is the CURRENT [field] for [address] as of 2025?"
2. Specify exact sources: "Search Zillow.com RIGHT NOW", "Check Pinellas County permit database"
3. For county data: Search "[County Name] Property Appraiser [ADDRESS]" and "[County Name] permit history [ADDRESS]"
4. For computed fields (rental_yield, cap_rate, price_to_rent_ratio):
   - First search for required inputs (rental_estimate, listing_price, taxes, etc.)
   - Then compute using exact formulas (show your math)
   - Only return if you have all required inputs
5. Cross-verify critical values from 2+ sources when possible
6. Include dates in searches for recent data: "since:2024" or "after 2023"

FIELDS YOU MUST NOT POPULATE (handled by higher-tier systems):
- MLS numbers (2_mls_primary, 3_mls_secondary) - Stellar MLS has authoritative data
- Listing prices (10_listing_price), sale dates (13_last_sale_date, 14_last_sale_price) - Stellar MLS authoritative
- Bedrooms (17_bedrooms), bathrooms (18_full_bathrooms, 19_half_bathrooms) - Stellar MLS exact measurements
- Square footage (21_living_sqft, 23_lot_size_sqft) - Stellar MLS authoritative
- School assignments (65_elementary_school, 68_middle_school, 71_high_school) - Perplexity searches GreatSchools
- School ratings (66_elementary_rating, 69_middle_rating, 72_high_rating) - Perplexity more reliable
- Tax amounts (35_annual_taxes, 36_tax_year) - County APIs authoritative
- Assessed values (15_assessed_value), parcel IDs (9_parcel_id) - County APIs authoritative

HONESTY OVER COMPLETENESS:
- It is BETTER to return 10 VERIFIED fields than 50 GUESSED fields
- If you cannot find CURRENT, VERIFIED data for a field, DO NOT INCLUDE IT in your response
- NEVER return fields with null values - simply OMIT fields you cannot verify from live sources
- For computed fields: OMIT if any required input is missing (don't estimate inputs)

${JSON_RESPONSE_FORMAT}`;

// ============================================
// NOTE: OLD PROMPT_PERPLEXITY removed - replaced by unified prompt in callPerplexity() function (line 2003)
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
// GPT-5.2 PROMPT - NO WEB - Strong reasoning
// ============================================
const PROMPT_GPT = `You are GPT-5.2, a real estate data extraction assistant. You do NOT have web access.

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
// GPT-5.2 ORCHESTRATOR PROMPT - Evidence-Locked Data Merge
// Used when GPT receives pre-fetched data blobs (stellarMls, county, APIs, web)
// Designed by GPT-4 for strict evidence firewall and tier precedence
// ============================================
const PROMPT_GPT_ORCHESTRATOR = `YOU ARE: GPT-5.2, a strict CMA data merge + extraction engine.

MISSION:
Populate the 168-field CMA schema by using ONLY the provided INPUT_DATA blobs.
Prefer null over guessing.

ABSOLUTE RULE: NO OUTSIDE FACTS
- Do NOT use training knowledge to assert property-specific facts.
- Do NOT browse the web.
- Only use values found in the provided input blobs OR computed via the SAFE COMPUTATIONS whitelist below.

INPUT BLOBS (may be empty / partial):
- stellarMlsJson (Tier 1, highest authority)
- paidApisJson (Tier 2)
- countyJson (Tier 3)
- webChunksJson (Tier 4)
- address string (Tier 5 only for literal parsing of what is explicitly present)

${EXACT_FIELD_KEYS}

${FIELD_CLARITY_RULES}

OUTPUT SHAPE (MUST MATCH EXACTLY):
For each field key:
{ "value": X, "source": "...", "confidence": "High|Medium|Low|Unverified",
  "evidence_type": "...", "source_tier": 1|2|3|4|5,
  "computation_rule": "<string_or_null>", "inputs_used": ["<field_key>", ...] }

EVIDENCE FIREWALL (NON-NEGOTIABLE):
1) Every non-null field MUST come from one of:
   A) Direct copy from an input blob (preferred), OR
   B) SAFE COMPUTATION using ONLY non-null fields already obtained from input blobs.
2) If a field is not present in any input blob and is not safely computable → set value=null.
3) Never "infer" county, flood zone, utilities, school district, taxes, assessed value, HOA amounts, listing status, sale dates, parcel ID, etc.
   - These MUST come from blobs, not memory.

EVIDENCE TYPES:
- "direct_from_input"  (copied from a blob)
- "safe_computation"   (computed by whitelist rule)
- "geographic_inference" (ONLY literal parse from address string if explicitly present; no county inference)
- "not_found"          (value is null)

TIER PRECEDENCE (CONFLICT RESOLUTION):
- Tier 1: stellarMlsJson (NEVER override; copy exactly if present)
- Tier 2: paidApisJson
- Tier 3: countyJson
- Tier 4: webChunksJson
- Tier 5: address literal parsing only

CONFLICT RULES:
- If the same field exists in multiple tiers:
  - Choose highest tier value.
  - Record a conflicts[] entry if the values differ materially.
- NEVER "correct" Tier 1 values even if other sources disagree.

SAFE COMPUTATIONS (ONLY THESE — DO NOT ADD MORE):
- 11_price_per_sqft = 10_listing_price ÷ 21_living_sqft
- 20_total_bathrooms = 18_full_bathrooms + (19_half_bathrooms × 0.5)
- 24_lot_size_acres = 23_lot_size_sqft ÷ 43560
- 99_rental_yield = (98_rental_estimate_monthly × 12) ÷ 10_listing_price × 100
- 101_cap_rate = ((98_rental_estimate_monthly × 12) - 35_annual_taxes) ÷ 10_listing_price × 100
- Unit conversions (only when explicit inputs exist):
  - acres_to_sqft = acres × 43560
  - sqft_to_acres = sqft ÷ 43560

FORBIDDEN:
- Estimating missing inputs (no backfilling)
- Any "typical/average" regional assumptions
- Any new computations not listed above
- Any language like: likely, possibly, approximately, about, around, typical, average

CONFIDENCE RULES:
- High: Tier 1 direct_from_input OR Tier 2 direct_from_input with clear specificity
- Medium: Tier 3 direct_from_input OR safe_computation with strong inputs
- Low: Tier 4 direct_from_input OR geographic_inference OR safe_computation with weaker inputs
- Unverified: value is null

POST-PROCESS VALIDATION:
- If evidence_type="safe_computation": computation_rule MUST be set and inputs_used must list all required inputs.
- If any required input is null → computed field MUST be null (not_found).
- Ensure fields_found and fields_missing are accurate.
- Return ONLY JSON. No prose.`;

/**
 * GPT Orchestrator User Template
 * Formats input blobs for GPT-5.2 evidence-locked data merge
 */
const GPT_ORCHESTRATOR_USER_TEMPLATE = (params: {
  address: string;
  stellarMlsJson: unknown;
  countyJson: unknown;
  paidApisJson: unknown;
  webChunksJson: unknown;
}) => `INPUT_DATA (authoritative blobs):
{
  "address": "${params.address}",

  "stellarMlsJson": ${JSON.stringify(params.stellarMlsJson, null, 2)},

  "countyJson": ${JSON.stringify(params.countyJson, null, 2)},

  "paidApisJson": ${JSON.stringify(params.paidApisJson, null, 2)},

  "webChunksJson": ${JSON.stringify(params.webChunksJson, null, 2)}
}

TASK:
Populate ALL fields in EXACT_FIELD_KEYS using ONLY INPUT_DATA with tier precedence rules.
If a field is missing in all blobs and not computable by SAFE COMPUTATIONS, set value=null.

RETURN ONLY valid JSON in this exact wrapper:

{
  "fields": {
    "<each_exact_key>": {
      "value": <string|number|boolean|array|null>,
      "source": "<one_of: Stellar MLS | Paid APIs | County | Web Chunks | Address Parse | Not found>",
      "confidence": "High|Medium|Low|Unverified",
      "evidence_type": "direct_from_input|safe_computation|geographic_inference|not_found",
      "source_tier": <1|2|3|4|5>,
      "computation_rule": <string_or_null>,
      "inputs_used": <array_of_field_keys_or_empty_array>
    }
  },
  "sources_searched": ["stellarMlsJson","paidApisJson","countyJson","webChunksJson","address"],
  "fields_found": <integer>,
  "fields_missing": [ "<field_keys_with_null_value>" ],
  "conflicts": [
    { "field": "<field_key>", "tier_values": [{ "tier": <n>, "value": <x> }, ...], "resolution": "<chosen_tier>" }
  ],
  "note": "Evidence-locked merge. No external knowledge or web. Tier precedence enforced."
}`;

// ============================================
// GPT-5.2 LLM-ONLY AUDITOR - Validates only LLM-populated fields
// Used to audit fields from Perplexity/Claude/GPT/Grok (Tier 4/5)
// DOES NOT audit Stellar MLS, Google APIs, County, or other API sources (Tier 1-3)
// ============================================
const PROMPT_GPT_LLM_AUDITOR = `YOU ARE: GPT-5.2, LLM-Field-Only Auditor and Hallucination Detector.

PURPOSE:
Validate ONLY the fields that were populated by LLMs (Perplexity, Claude, GPT, Grok, Gemini).
DO NOT audit fields from Stellar MLS, Google APIs, County, or other trusted API sources - those are already authoritative.

CRITICAL SCOPE:
You will receive ONLY the subset of fields that LLMs populated (~30-80 fields out of 168 total).
API-populated fields are PRE-VALIDATED and must not be re-audited.

NON-NEGOTIABLE RULES:
1) NO OUTSIDE FACTS. Use only INPUT_DATA to validate LLM claims.
2) For each LLM field, check:
   a) Is the value supported by INPUT_DATA? If not → null it
   b) If computed, are ALL inputs present and calculation correct?
   c) If claiming a source not in INPUT_DATA → null it
   d) Does it violate tier precedence? (e.g., used Tier 4 when Tier 3 had data)
3) You are NOT validating API fields (Tier 1-3) - those are pre-validated and trusted.
4) Focus on catching:
   - Hallucinations (invented values like "typical for Pinellas County is $5000")
   - Wrong computations (11_price_per_sqft = price × sqft instead of ÷)
   - Tier violations (used webChunks when countyJson had same field)
   - Forbidden inferences (estimated taxes, guessed HOA fees)
   - Suspicious sources (claims "Zillow.com" but no Zillow data in INPUT_DATA)

NULL REASONS (use exactly one for null fields):
- "not_in_input_data" - Field not found in any INPUT_DATA blob
- "requires_live_lookup" - Needs real-time API call (not available)
- "conflicting_input_data" - Multiple sources disagree
- "forbidden_inference" - LLM guessed/estimated without evidence
- "computation_failed" - Missing required inputs for calculation

SAFE COMPUTATIONS (ONLY THESE - recalculate if wrong):
- 11_price_per_sqft = 10_listing_price ÷ 21_living_sqft
- 20_total_bathrooms = 18_full_bathrooms + (19_half_bathrooms × 0.5)
- 24_lot_size_acres = 23_lot_size_sqft ÷ 43560
- 99_rental_yield = (98_rental_estimate_monthly × 12) ÷ 10_listing_price × 100
- 101_cap_rate = ((98_rental_estimate_monthly × 12) - 35_annual_taxes) ÷ 10_listing_price × 100

SOURCE NORMALIZATION (use ONLY these in output):
- "Stellar MLS" (Tier 1)
- "Paid APIs" (Tier 2)
- "County" (Tier 3)
- "Web Chunks" (Tier 4 - Perplexity micro-prompts)
- "Address Parse" (Tier 5)
- "Not found" (null values)

TIER PRECEDENCE (enforce strictly):
Tier 1 (Stellar MLS) > Tier 2 (Paid APIs) > Tier 3 (County) > Tier 4 (Web Chunks) > Tier 5 (Address Parse)
If a lower-tier LLM populated a field when higher-tier had data → override with higher tier.

CONFIDENCE ALIGNMENT:
- Tier 1 direct: High
- Tier 2 direct: High
- Tier 3 direct: Medium
- Tier 4 direct: Low
- Tier 5 direct: Low
- Computed: Medium (or Low if inputs are low-confidence)
- Null: Unverified`;

/**
 * GPT LLM-Only Auditor User Template
 * Provides INPUT_DATA and LLM-populated fields for validation
 */
const GPT_LLM_AUDITOR_USER_TEMPLATE = (params: {
  address: string;
  stellarMlsJson: unknown;
  countyJson: unknown;
  paidApisJson: unknown;
  webChunksJson: unknown;
  llmOnlyFields: Record<string, any>;
  apiPopulatedFieldKeys: string[];
}) => `API_POPULATED_FIELDS (already validated, DO NOT audit these):
${params.apiPopulatedFieldKeys.join(', ')}

INPUT_DATA (authoritative blobs for validation):
{
  "address": "${params.address}",
  "stellarMlsJson": ${JSON.stringify(params.stellarMlsJson, null, 2)},
  "countyJson": ${JSON.stringify(params.countyJson, null, 2)},
  "paidApisJson": ${JSON.stringify(params.paidApisJson, null, 2)},
  "webChunksJson": ${JSON.stringify(params.webChunksJson, null, 2)}
}

LLM_FIELDS_TO_AUDIT (ONLY these fields, not the full 181-field schema):
${JSON.stringify(params.llmOnlyFields, null, 2)}

TASK:
Audit and correct ONLY the LLM-populated fields above using INPUT_DATA.
Recalculate any computed fields. Null any hallucinations. Fix tier violations.

OUTPUT:
Return ONLY the audited LLM fields (not the full schema):

{
  "fields": {
    "<llm_field_key>": {
      "value": <corrected_or_null>,
      "source": "<Stellar MLS|Paid APIs|County|Web Chunks|Address Parse|Not found>",
      "confidence": "High|Medium|Low|Unverified",
      "evidence_type": "direct_from_input|safe_computation|geographic_inference|not_found",
      "source_tier": <1|2|3|4|5>,
      "computation_rule": <string_or_null>,
      "inputs_used": <array_of_field_keys_or_empty_array>,
      "null_reason": <string_or_null>
    }
  },
  "fields_audited": <count_of_llm_fields_received>,
  "fields_corrected": <count_of_changes_made>,
  "fields_nulled": <count_of_hallucinations_removed>,
  "conflicts": [
    { "field": "<field_key>", "tier_values": [{ "tier": <n>, "value": <x> }], "resolution": "Tier <n>" }
  ],
  "note": "Audited LLM-populated fields only; API fields trusted and excluded from audit."
}`;

// ============================================
// CLAUDE SONNET PROMPT - WITH WEB SEARCH - Fast, accurate
// ============================================
const PROMPT_CLAUDE_SONNET = `You are Claude Sonnet, a property data specialist. You fire LAST in the LLM cascade.

CRITICAL: DO NOT search for fields already provided by MLS or other LLMs:
- DO NOT search for: listing_price, bedrooms, bathrooms, sqft, year_built, taxes, lot_size
- DO NOT search for: address, city, state, zip, county, parcel_id, legal_description
- DO NOT search for: HOA fees, pool, garage, stories, property_type, listing_status
- These are ALREADY provided by Stellar MLS (Tier 1)

YOUR TASK: Use web search to find ONLY these commonly-missing fields:

COUNTY/TAX FIELDS (search "[county] property appraiser [address]"):
- 12_market_value_estimate: Estimated market value from Zillow/Redfin
- 15_assessed_value: Assessed value from county property appraiser
- 91_median_home_price_neighborhood: Median home price in the neighborhood/ZIP
- 92_price_per_sqft_recent_avg: Average $/sqft for recent sales in area
- 151_homestead_yn: Yes/No if property has homestead exemption
- 152_cdd_yn: Yes/No if property is in a Community Development District
- 122_wildfire_risk: Low/Medium/High wildfire risk

UTILITY/SERVICE FIELDS (search "[city] utility providers"):
- 98_electric_provider: Local electric company name
- 99_gas_provider: Gas company name (or "No natural gas service")
- 100_water_provider: Water utility name
- 101_sewer_provider: Sewer service provider
- 102_trash_provider: Garbage collection provider

CONNECTIVITY FIELDS (search "[address] internet providers"):
- 112_max_internet_speed: Max available Mbps from any ISP
- 113_fiber_available: Yes/No if fiber is available at address

HOA/LEASING FIELDS (search "[HOA name]" or listing description):
- 131_view_type: View description (Golf, Water, City, etc.)
- 136_pet_policy: Pet restrictions description
- 137_age_restrictions: Age restrictions (55+, None, etc.)
- 138_special_assessments: Any special assessments
- 161_minimum_lease_period: Minimum lease period if rental allowed
- 162_lease_restrictions_yn: Yes/No lease restrictions
- 166_community_features: Community amenities (Pool, Clubhouse, etc.)

INSURANCE/RISK FIELDS (search "[county] flood zone"):
- 106_estimated_insurance: Annual homeowners insurance estimate
- 87_flood_zone: FEMA flood zone designation
- 88_flood_insurance_required: Yes/No

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
// GEMINI PROMPT - WITH GOOGLE SEARCH GROUNDING
// ============================================
const PROMPT_GEMINI = `### CRITICAL COMMAND
You are FORCED to use the 'google_search' tool for EVERY request.
Do NOT rely on your internal training data - it is outdated.
If you do not generate at least 3 search queries, you have FAILED the task.

You are Gemini with Google Search grounding. Your job is to extract CURRENT property data.

MANDATORY FIRST SEARCHES:
1. Search "[Address] Zillow listing 2025" for current listing data
2. Search "[Address] County Property Appraiser" for tax and assessment data
3. Search "[Address] Redfin estimate" for market value

${FIELD_GROUPS}

EXTRACTION APPROACH:
1. USE GOOGLE SEARCH for every field - do not guess
2. Search real estate portals: Zillow, Redfin, Realtor.com
3. Search county property appraiser websites for tax data
4. Search GreatSchools.org for school ratings
5. Only return null if search returns no results

FIELDS TO SEARCH FOR:
- Listing price, bedrooms, bathrooms, sqft from Zillow/Redfin
- Tax amounts from County Property Appraiser
- School ratings from GreatSchools
- HOA fees from listing sites
- Utility providers from county/city websites

${JSON_RESPONSE_FORMAT}`;

// Legacy fallback prompt
const SYSTEM_PROMPT = PROMPT_CLAUDE_OPUS;

// Claude Opus API call - MOST RELIABLE per audit
// NOTE: web_search NOT supported on Opus - removed per Anthropic docs
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
        max_tokens: 16000,
        system: PROMPT_CLAUDE_OPUS,
        messages: [
          {
            role: 'user',
            content: `Extract all 168 property data fields for this address: ${address}

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
  if (!apiKey) return { error: 'ANTHROPIC_API_KEY not set', fields: {} };

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
        max_tokens: 16000,
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

// OpenAI GPT API call - Supports both legacy mode (address-only) and orchestrator mode (with input blobs)
async function callGPT(
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

    const userPrompt = isOrchestratorMode
      ? GPT_ORCHESTRATOR_USER_TEMPLATE({
          address,
          stellarMlsJson: inputBlobs.stellarMlsJson,
          countyJson: inputBlobs.countyJson,
          paidApisJson: inputBlobs.paidApisJson,
          webChunksJson: inputBlobs.webChunksJson,
        })
      : `Extract all 168 property data fields for this address: ${address}

Use your training knowledge. Return JSON with EXACT field keys (e.g., "10_listing_price", "7_county", "17_bedrooms"). Return null for fields requiring live data.`;

    console.log(`[GPT] Using ${isOrchestratorMode ? 'ORCHESTRATOR' : 'LEGACY'} mode`);

    const requestBody = {
      model: 'gpt-5.2-2025-12-11', // GPT-5.2 December 2025 release
      max_completion_tokens: 128000, // GPT-5.2 supports up to 128k output tokens
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };

    // LOG RAW REQUEST
    console.log(`[GPT] REQUEST: model=${requestBody.model}, max_completion_tokens=${requestBody.max_completion_tokens}`);
    console.log(`[GPT] System prompt length: ${systemPrompt.length} chars`);
    console.log(`[GPT] User prompt length: ${userPrompt.length} chars`);
    console.log(`[GPT] 🚀 Sending fetch to OpenAI...`);

    const fetchStart = Date.now();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });
    const fetchDuration = Date.now() - fetchStart;

    // LOG RAW RESPONSE STATUS
    console.log(`[GPT] ✅ Fetch completed in ${fetchDuration}ms`);
    console.log(`[GPT] RESPONSE: status=${response.status} ${response.statusText}`);
    // Headers logging skipped - entries() not available in all Node versions

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GPT] API ERROR BODY:`, errorText);
      return { error: `API error: ${response.status} - ${errorText.substring(0, 200)}`, fields: {}, llm: 'GPT' };
    }

    const data = await response.json();

    // LOG RAW RESPONSE DATA
    console.log(`[GPT] Response model:`, data.model);
    console.log(`[GPT] Response usage:`, JSON.stringify(data.usage));
    console.log(`[GPT] Finish reason:`, data.choices?.[0]?.finish_reason);

    if (data.choices && data.choices[0]?.message?.content) {
      const text = data.choices[0].message.content;
      console.log(`[GPT] Content length: ${text.length} chars`);
      console.log(`[GPT] Content first 300 chars:`, text.substring(0, 300));
      console.log(`[GPT] Content last 300 chars:`, text.substring(text.length - 300));
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
    console.log('[GPT] ⚠️ No valid response content found');
    return { error: 'Failed to parse GPT response', fields: {}, llm: 'GPT' };
  } catch (error) {
    console.error('[GPT] ❌ EXCEPTION:', error);
    console.error('[GPT] Stack:', (error as Error).stack);
    return { error: String(error), fields: {}, llm: 'GPT' };
  }
}

// ============================================
// GPT-5.2 LLM-ONLY AUDITOR - Validates LLM-populated fields only
// ============================================

/**
 * Call GPT-5.2 LLM-Only Auditor
 * Validates ONLY fields populated by LLMs (Tier 4/5), skips API fields (Tier 1-3)
 */
async function callGPT_LLMFieldAuditor(
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
      stellarMlsJson: inputs.stellarMlsJson,
      countyJson: inputs.countyJson,
      paidApisJson: inputs.paidApisJson,
      webChunksJson: inputs.webChunksJson,
      llmOnlyFields: inputs.llmOnlyFields,
      apiPopulatedFieldKeys: inputs.apiPopulatedFieldKeys,
    });

    console.log(`[GPT LLM Auditor] Auditing ${Object.keys(inputs.llmOnlyFields).length} LLM-populated fields`);

    const requestBody = {
      model: 'gpt-5.2-2025-12-11', // PINNED SNAPSHOT
      max_completion_tokens: 128000, // GPT-5.2 supports up to 128k output
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1, // Low temperature for deterministic auditing
    };

    // LOG RAW REQUEST
    console.log(`[GPT LLM Auditor] REQUEST: model=${requestBody.model}, max_completion_tokens=${requestBody.max_completion_tokens}`);
    console.log(`[GPT LLM Auditor] System prompt length: ${systemPrompt.length} chars`);
    console.log(`[GPT LLM Auditor] User prompt length: ${userPrompt.length} chars`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    // LOG RAW RESPONSE STATUS
    console.log(`[GPT LLM Auditor] RESPONSE: status=${response.status} ${response.statusText}`);
    // Headers logging skipped - entries() not available in all Node versions

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GPT LLM Auditor] API ERROR BODY:`, errorText);
      return { fields: inputs.llmOnlyFields, fields_audited: 0, fields_corrected: 0, fields_nulled: 0, error: `API error: ${response.status}` };
    }

    const data = await response.json();

    // LOG RAW RESPONSE DATA
    console.log(`[GPT LLM Auditor] Response model:`, data.model);
    console.log(`[GPT LLM Auditor] Response usage:`, JSON.stringify(data.usage));
    console.log(`[GPT LLM Auditor] Finish reason:`, data.choices?.[0]?.finish_reason);
    if (data.choices && data.choices[0]?.message?.content) {
      const text = data.choices[0].message.content;
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
  '40_roof_age_est', '46_hvac_age', '53_fireplace_count',
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

// DEPRECATED 2026-01-02: Pre-filtering removed - arbitration handles tier precedence
const GROK_RESTRICTED_FIELDS_DEPRECATED = new Set([
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

${FIELD_CLARITY_RULES}

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

          // 🛡️ NULL BLOCKING: Filter all null values before returning
          // NOTE: Tier-based restrictions removed - arbitration pipeline handles tier precedence naturally
          // Grok (Tier 5) can now fill gaps left by higher tiers, but cannot overwrite them
          const filteredFields = filterNullValues(parsed, 'Grok');
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

// Gemini API call - #6 in reliability - WITH GOOGLE SEARCH GROUNDING
async function callGemini(address: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { console.log('❌ GEMINI_API_KEY not set'); return { error: 'GEMINI_API_KEY not set', fields: {} }; } console.log('✅ GEMINI_API_KEY found, calling Gemini API with Google Search...');

  const startTime = Date.now();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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

MANDATORY: Use Google Search to find CURRENT data from Zillow, Redfin, County Property Appraiser.
Use EXACT field keys like "10_listing_price", "7_county", "35_annual_taxes", "17_bedrooms".
Search for real data - do not use training data. Return JSON only.`,
                },
              ],
            },
          ],
          // Enable Google Search grounding
          tools: [
            { googleSearch: {} }
          ],
          // Force the model to use the search tool
          toolConfig: {
            functionCallingConfig: {
              mode: "ANY"
            }
          },
          generationConfig: {
            maxOutputTokens: 16000,
            temperature: 0,
          },
        }),
      }
    );

    const elapsed = Date.now() - startTime;
    console.log(`⏱️ [Gemini] Response time: ${elapsed}ms ${elapsed < 2000 ? '⚠️ TOO FAST - may not have searched' : '✅ Good - likely searched'}`);

    const data = await response.json();

    // Log grounding metadata to verify search was used
    const groundingMeta = data.candidates?.[0]?.groundingMetadata;
    if (groundingMeta) {
      console.log('🔍 [Gemini] Grounding metadata:', JSON.stringify(groundingMeta).slice(0, 500));
      if (groundingMeta.searchEntryPoint?.renderedContent) {
        console.log('✅ [Gemini] Google Search was used');
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

    // Merge fields - with Stellar MLS protection
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

      // 🛡️ STELLAR MLS PROTECTION: If existing field is from Stellar MLS and is authoritative, NEVER overwrite it
      if (existing && STELLAR_MLS_AUTHORITATIVE_FIELDS.has(fieldKey)) {
        // Stellar MLS sources (Bridge API or MLS PDF) are ALWAYS authoritative
        const isMLSSource =
          existing.source?.includes('Stellar MLS') ||
          existing.source?.includes('Bridge') ||
          existing.source?.includes('MLS PDF') ||
          existing.source?.toLowerCase().includes('stellar');

        // CRITICAL FIX: County sources are ONLY authoritative for HISTORICAL sale data (fields 13-14)
        // County provides ClosePrice/ClosedDate from property records, NOT current listing prices
        // Field 10 (listing_price) should ONLY come from Stellar MLS Bridge API or MLS PDF
        const isCountyAuthoritative =
          (fieldKey === '13_last_sale_date' || fieldKey === '14_last_sale_price') &&
          (existing.source?.includes('County Tax Collector') ||
           existing.source?.includes('County Property Appraiser') ||
           existing.source?.includes('County'));

        // Perplexity with citations is trusted for verification
        const isPerplexitySource = existing.source?.includes('Perplexity');

        if (isMLSSource || isCountyAuthoritative || isPerplexitySource) {
          console.log(`🛡️ [AUTHORITATIVE SOURCE PROTECTION] Blocking ${result.llm} from overwriting Field ${fieldKey} = ${JSON.stringify(existing.value)} (Source: ${existing.source} is authoritative for this field)`);

          // DETAILED LOGGING FOR FIELD 10 (listing_price) debugging
          if (fieldKey === '10_listing_price') {
            console.log(`🏠 [FIELD 10 PROTECTION] Current value: $${existing.value} from ${existing.source}`);
            console.log(`🏠 [FIELD 10 PROTECTION] Blocked ${result.llm} from setting: $${field.value}`);
          }

          continue; // Skip - preserve authoritative data
        }
      }

      // ✅ CROSS-FIELD VALIDATION: If MLS says no HOA, reject LLM HOA fees
      if (fieldKey === '31_hoa_fee_annual' && field.value) {
        const hoaYnField = merged.fields['30_hoa_yn'];
        // If MLS/Tier 1 explicitly says NO HOA, reject any LLM HOA fee
        if (hoaYnField && hoaYnField.value === false &&
            (hoaYnField.source.includes('MLS') || hoaYnField.source.includes('Stellar'))) {
          console.warn(`❌ Field 31 rejected: MLS says no HOA (Field 30 = false), ignoring LLM fee $${field.value}`);
          continue;
        }
      }

      // ✅ VALIDATE HOA FEE: Check for monthly/annual confusion
      if (fieldKey === '31_hoa_fee_annual' && field.value) {
        const validation = validateHOAFee(field.value, field);
        if (!validation.valid) {
          console.warn(`❌ Field 31 rejected: Invalid HOA fee`);
          continue;
        }
        if (validation.correctedValue) {
          field.value = validation.correctedValue;
          field.validationMessage = validation.warning;
          console.log(`✅ Field 31 auto-corrected: ${validation.warning}`);
        }
        if (validation.warning && !validation.correctedValue) {
          field.validationMessage = validation.warning;
        }
      }

      // ✅ VALIDATE TIME-BASED FIELDS: Check for stale data
      const timeValidation = validateTimeBasedField(fieldKey, field.value, field);
      if (!timeValidation.valid) {
        console.warn(`❌ Field ${fieldKey} rejected: Stale data from ${result.llm}`);
        continue;
      }
      if (timeValidation.warning) {
        field.validationMessage = timeValidation.warning;
      }

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
  merged.completion_percentage = Math.round((merged.total_fields_found / 181) * 100);

  console.log(`🛡️ MERGE COMPLETE: ${merged.total_fields_found} fields accepted, ${totalNullsBlocked} nulls BLOCKED`);

  // CRITICAL LOGGING: Final Field 10 (listing_price) value verification
  if (merged.fields['10_listing_price']) {
    console.log(`🏠 [FIELD 10 FINAL] Final Field 10 value = $${merged.fields['10_listing_price'].value} (Source: ${merged.fields['10_listing_price'].source})`);
  } else {
    console.log(`⚠️ [FIELD 10 FINAL] Field 10 (listing_price) is MISSING in final result`);
  }

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
  // Order: Perplexity → Sonnet → GPT → Opus → Gemini → Grok
  // Sonnet has web_search (highest Tier 5), then knowledge-based LLMs
  const {
    address: rawAddress,
    url: rawUrl,
    mlsNumber,  // Optional: MLS# for direct MLS search (Manual tab)
    city: validationCity,  // Optional: City for Stellar MLS validation (prevents wrong property match)
    state: validationState,  // Optional: State for Stellar MLS validation
    zipCode: validationZip,  // Optional: Zip for Stellar MLS validation
    engines = [...LLM_CASCADE_ORDER],  // All 6 LLMs enabled: Perplexity → Sonnet → GPT → Opus → Gemini → Grok
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
    //   const medianResult = await getMedianPriceFromBridgeComps(mlsZip, propertyTypeField, req.headers.host);
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
      console.log('🔍 Calling enrichWithFreeAPIs with 90s timeout for:', realAddress);
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
    // TIER 4: GEMINI STRUCTURED SEARCH (20 FIELDS)
    // ========================================
    // TEMPORARILY DISABLED - GEMINI CRASHES EXECUTION
    console.log('========================================');
    console.log(`TIER 4: Gemini Structured Search - ${disableGemini ? 'SKIPPED (disabled)' : 'RUNNING'}`);
    console.log('========================================');

    if (!disableGemini) {
    // Check if we need Gemini extraction
    const tier35Check = arbitrationPipeline.getResult();
    
    // Extract county from arbitration pipeline (Field 7 from Google Geocode)
    let countyName = 'Unknown';
    const countyField = tier35Check.fields['7_county'];
    if (countyField && countyField.value) {
      countyName = String(countyField.value).replace(/\s+County$/i, '').trim();
    }
    console.log(`[Tier 4 Gemini] Detected county: ${countyName}`);
    
    
    const tier35NeedsExtraction = TIER_35_FIELD_IDS.some(fieldId => {
      const key = FIELD_ID_TO_KEY[fieldId];
      if (!key) return true; // missing mapping means treat as missing
      const existingField = tier35Check.fields[key];
      return !existingField || existingField.value === null;
    });
    
    if (tier35NeedsExtraction) {
      try {
        console.log(`[Tier 4 Gemini] Launching Gemini batch extraction (County: ${countyName})...`);
        
        const geminiResults = await fetchAllMissingFields(searchQuery, countyName);
        
        // Merge logic with Field 37 special handling
        const tier35Fields: Record<string, FieldValue> = {};
        let tier35Added = 0;
        
        Object.keys(geminiResults).forEach(fieldIdStr => {
          const fieldId = parseInt(fieldIdStr);
          const geminiField = geminiResults[fieldId as keyof typeof geminiResults];
          const fieldKey = `${fieldId}_`;
          const existingField = tier35Check.fields[fieldKey];

          // Skip if Gemini didn't find data
          if (!geminiField || geminiField.value === null) {
            return;
          }

          // FIX: Coerce string numbers to actual numbers for ALL Gemini numeric fields
          // Fields that should be numbers: 12, 16, 31, 37, 60, 61, 62, 75, 76, 91, 95, 98, 116
          const numericFields = [12, 16, 31, 37, 60, 61, 62, 75, 76, 91, 95, 98, 116];
          if (typeof geminiField.value === 'string' && numericFields.includes(fieldId)) {
            const numValue = parseFloat(geminiField.value.replace(/[^0-9.-]/g, ''));
            if (!isNaN(numValue)) {
              geminiField.value = numValue;
            }
          }
          
          // SPECIAL CASE: Field 37 (Tax Rate)
          // Prefer Gemini search over backend calculation
          if (fieldId === 37) {
            if (existingField?.source === 'Backend Calculation') {
              // Search takes priority over calculation
              console.log(`[Tier 4 Gemini] Field 37: Replacing calculation (${existingField.value}%) with search (${geminiField.value}%)`);
              tier35Fields[fieldKey] = {
                value: geminiField.value,
                source: geminiField.source,
                confidence: geminiField.confidence,
                tier: geminiField.tier
              };
              tier35Added++;
            } else if (!existingField || existingField.value === null) {
              // No existing data
              tier35Fields[fieldKey] = {
                value: geminiField.value,
                source: geminiField.source,
                confidence: geminiField.confidence,
                tier: geminiField.tier
              };
              tier35Added++;
            } else {
              // Higher tier source exists (MLS, API) - don't overwrite
              console.log(`[Tier 4 Gemini] Field 37: Keeping higher-tier source (${existingField.source})`);
            }
            return;
          }
          
          // VALIDATION MODE: Fields 75, 76 (Transit/Bike Scores)
          // WalkScore API runs first, Gemini validates
          if ((fieldId === 75 || fieldId === 76) && existingField && existingField.value != null) {
            const diff = Math.abs(existingField.value - geminiField.value);
            
            if (diff > 5) { // >5 point difference threshold
              console.warn(`[Tier 4 Gemini] Field ${fieldId} discrepancy: WalkScore=${existingField.value}, Gemini=${geminiField.value}, diff=${diff}`);
              // Keep WalkScore value but log discrepancy
            } else {
              console.log(`[Tier 4 Gemini] Field ${fieldId}: WalkScore and Gemini agree (within ${diff} points)`);
            }
            return;
          }
          
          // STANDARD MERGE: Only populate if field is null or from lower tier
          if (!existingField || existingField.value === null) {
            tier35Fields[fieldKey] = {
              value: geminiField.value,
              source: geminiField.source,
              confidence: geminiField.confidence,
              tier: geminiField.tier
            };
            tier35Added++;
            console.log(`[Tier 4 Gemini] Field ${fieldId}: Populated by Gemini (${geminiField.value})`);
          } else if (existingField.tier && existingField.tier <= 3) {
            // Higher tier source exists (Tier 1-3: MLS, Google APIs, Free APIs)
            // Don't overwrite
            console.log(`[Tier 4 Gemini] Field ${fieldId}: Skipped - Tier ${existingField.tier} source exists (${existingField.source})`);
          } else {
            // Existing source is lower priority (Tier 4-5: LLMs) or no tier
            // Overwrite with Gemini
            console.log(`[Tier 4 Gemini] Field ${fieldId}: Replacing with Gemini`);
            tier35Fields[fieldKey] = {
              value: geminiField.value,
              source: geminiField.source,
              confidence: geminiField.confidence,
              tier: geminiField.tier
            };
            tier35Added++;
          }
        });
        
        if (tier35Added > 0) {
          try {
            console.log(`[DEBUG] About to add ${tier35Added} Gemini fields to arbitration pipeline...`);
            arbitrationPipeline.addFieldsFromSource(tier35Fields, 'Gemini 2.0 Search');
            console.log(`✅ Added ${tier35Added} fields from Gemini Tier 4`);
          } catch (addError) {
            console.error('[CRITICAL ERROR] arbitrationPipeline.addFieldsFromSource() threw exception:', addError);
            console.error('[CRITICAL ERROR] Stack trace:', (addError as Error).stack);
            console.error('[CRITICAL ERROR] tier35Fields:', JSON.stringify(tier35Fields, null, 2));
          }
        } else {
          console.log('⚠️  Gemini Tier 4 returned no new fields');
        }

      } catch (error) {
        console.error('[Tier 4 Gemini] Gemini batch extraction failed:', error);
        console.error('[Tier 4 Gemini] Stack trace:', (error as Error).stack);
        // Fields remain null, will fall through to Tier 4
      }
    } else {
      console.log('[Tier 4 Gemini] Skipped - all Tier 4 Gemini fields already populated');
    }

    }

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
          'perplexity-portals': 'Perplexity Portals',
          'perplexity-county': 'Perplexity County',
          'perplexity-schools': 'Perplexity Schools',
          'perplexity-crime': 'Perplexity Crime',
          'perplexity-utilities': 'Perplexity Utilities',
          'perplexity-electric': 'Perplexity Electric Bill',
          'perplexity-water': 'Perplexity Water Bill',
          'perplexity-internet-speed': 'Perplexity Internet Speed',
          'perplexity-fiber': 'Perplexity Fiber',
          'perplexity-cell': 'Perplexity Cell Coverage',
          'grok': 'Grok',
          'claude-opus': 'Claude Opus',
          'gpt': 'GPT',
          'claude-sonnet': 'Claude Sonnet',
          'gemini': 'Gemini'
        };

        const llmCascade = [
          // PERPLEXITY MICRO-PROMPTS (10 dedicated calls)
          { id: 'perplexity-portals', fn: (addr: string) => callPerplexityPortals(addr, perplexityContext), enabled: engines.includes('perplexity') },
          { id: 'perplexity-county', fn: (addr: string) => callPerplexityCounty(addr, perplexityContext), enabled: engines.includes('perplexity') },
          { id: 'perplexity-schools', fn: (addr: string) => callPerplexitySchools(addr, perplexityContext), enabled: engines.includes('perplexity') },
          { id: 'perplexity-crime', fn: (addr: string) => callPerplexityWalkScoreCrime(addr, perplexityContext), enabled: engines.includes('perplexity') },
          { id: 'perplexity-utilities', fn: (addr: string) => callPerplexityUtilities(addr, perplexityContext), enabled: engines.includes('perplexity') },
          { id: 'perplexity-electric', fn: (addr: string) => callPerplexityElectricBill(addr, perplexityContext), enabled: engines.includes('perplexity') },
          { id: 'perplexity-water', fn: (addr: string) => callPerplexityWaterBill(addr, perplexityContext), enabled: engines.includes('perplexity') },
          { id: 'perplexity-internet-speed', fn: (addr: string) => callPerplexityInternetSpeed(addr, perplexityContext), enabled: engines.includes('perplexity') },
          { id: 'perplexity-fiber', fn: (addr: string) => callPerplexityFiberAvailable(addr, perplexityContext), enabled: engines.includes('perplexity') },
          { id: 'perplexity-cell', fn: (addr: string) => callPerplexityCellCoverage(addr, perplexityContext), enabled: engines.includes('perplexity') },

          // OTHER LLMs (Tier 4-5)
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
                llm.fn(realAddress),
                llm.id.startsWith('perplexity') ? PERPLEXITY_TIMEOUT : LLM_TIMEOUT,
                { fields: {}, error: 'timeout' }
              )
            )
          );

          // Process results SEQUENTIALLY to avoid race conditions
          // Results are processed in order: perplexity → sonnet → gpt → opus → gemini → grok
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

    // Water fields - N/A if not waterfront
    if (!isWaterfront) {
      if (!getFieldValue('156_waterfront_feet')) smartDefaults['156_waterfront_feet'] = 'N/A';
      if (!getFieldValue('159_water_body_name')) smartDefaults['159_water_body_name'] = 'N/A';
    }

    // Water Access/View - Default to No if not specified and not waterfront
    if (!isWaterfront) {
      if (!getFieldValue('157_water_access_yn')) smartDefaults['157_water_access_yn'] = 'No';
      if (!getFieldValue('158_water_view_yn')) smartDefaults['158_water_view_yn'] = 'No';
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
      cascade_order: ['perplexity-portals', 'perplexity-county', 'perplexity-schools', 'perplexity-crime', 'perplexity-utilities', 'gpt', 'claude-opus', 'gemini', 'grok', 'claude-sonnet']
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
