/**
 * CLUES Property Search API - SSE Streaming Version
 * Real-time progress updates via Server-Sent Events
 *
 * DATA SOURCE ORDER (Most Reliable First):
 * Tier 1: Stellar MLS (when eKey obtained - future)
 * Tier 2: Google APIs (Geocode, Places)
 * Tier 3: Paid/Free APIs (WalkScore, SchoolDigger, AirNow, HowLoud, Weather, Crime, FEMA)
 * Tier 4: LLMs (Perplexity, Grok, Claude Opus, GPT, Claude Sonnet, Gemini)
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

// Vercel serverless config - Pro plan allows 60s
export const config = {
  maxDuration: 60, // Pro plan limit
};

// Timeout wrapper for API calls - prevents hanging
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}
import { LLM_CASCADE_ORDER } from './llm-constants.js';
import {
  callGoogleGeocode,
  callGooglePlaces,
  callWalkScore,
  callFemaFlood,
  callAirNow,
  callSchoolDigger,
  callHowLoud,
  callCrimeGrade,
  callWeather,
  type ApiField
} from './free-apis.js';
import { createArbitrationPipeline, type FieldValue, type ArbitrationResult } from './arbitration.js';

// Map flat LLM field names to numbered field keys (for Grok, Opus, Gemini)
// This ensures their data maps to the frontend's expected format
// CORRECTED: All field numbers now match fields-schema.ts (SOURCE OF TRUTH)
const FLAT_TO_NUMBERED_FIELD_MAP: Record<string, string> = {
  // Address & Identity (1-9)
  'full_address': '1_full_address',
  'address': '1_full_address',
  'mls_primary': '2_mls_primary',
  'mls_number': '2_mls_primary',
  'mls_secondary': '3_mls_secondary',
  'listing_status': '4_listing_status',
  'status': '4_listing_status',
  'listing_date': '5_listing_date',
  'neighborhood': '6_neighborhood',
  'neighborhood_name': '6_neighborhood',
  'county': '7_county',
  'zip_code': '8_zip_code',
  'zip': '8_zip_code',
  'parcel_id': '9_parcel_id',
  'parcel': '9_parcel_id',

  // Pricing & Value (10-16)
  'listing_price': '10_listing_price',
  'price': '10_listing_price',
  'list_price': '10_listing_price',
  'price_per_sqft': '11_price_per_sqft',
  'price_per_sq_ft': '11_price_per_sqft',
  'market_value_estimate': '12_market_value_estimate',
  'market_value': '12_market_value_estimate',
  'estimated_value': '12_market_value_estimate',
  'zestimate': '12_market_value_estimate',
  'last_sale_date': '13_last_sale_date',
  'sale_date': '13_last_sale_date',
  'last_sale_price': '14_last_sale_price',
  'sale_price': '14_last_sale_price',
  'assessed_value': '15_assessed_value',
  'redfin_estimate': '16_redfin_estimate',

  // Property Basics (17-29)
  'bedrooms': '17_bedrooms',
  'beds': '17_bedrooms',
  'full_bathrooms': '18_full_bathrooms',
  'full_baths': '18_full_bathrooms',
  'half_bathrooms': '19_half_bathrooms',
  'half_baths': '19_half_bathrooms',
  'total_bathrooms': '20_total_bathrooms',
  'bathrooms': '20_total_bathrooms',
  'baths': '20_total_bathrooms',
  'living_sqft': '21_living_sqft',
  'living_sq_ft': '21_living_sqft',
  'sqft': '21_living_sqft',
  'square_feet': '21_living_sqft',
  'total_sqft_under_roof': '22_total_sqft_under_roof',
  'lot_size_sqft': '23_lot_size_sqft',
  'lot_size_sq_ft': '23_lot_size_sqft',
  'lot_sqft': '23_lot_size_sqft',
  'lot_size_acres': '24_lot_size_acres',
  'lot_acres': '24_lot_size_acres',
  'year_built': '25_year_built',
  'built': '25_year_built',
  'property_type': '26_property_type',
  'type': '26_property_type',
  'stories': '27_stories',
  'floors': '27_stories',
  'garage_spaces': '28_garage_spaces',
  'garage': '28_garage_spaces',
  'parking_total': '29_parking_total',
  'parking': '29_parking_total',

  // HOA & Taxes (30-38)
  'hoa_yn': '30_hoa_yn',
  'hoa': '30_hoa_yn',
  'has_hoa': '30_hoa_yn',
  'hoa_fee_annual': '31_hoa_fee_annual',
  'hoa_fee': '31_hoa_fee_annual',
  'hoa_fee_monthly': '31_hoa_fee_annual', // Will need conversion
  'hoa_name': '32_hoa_name',
  'hoa_includes': '33_hoa_includes',
  'ownership_type': '34_ownership_type',
  'annual_taxes': '35_annual_taxes',
  'taxes': '35_annual_taxes',
  'property_taxes': '35_annual_taxes',
  'tax_year': '36_tax_year',
  'property_tax_rate': '37_property_tax_rate',
  'property_tax_rate_percent': '37_property_tax_rate',
  'tax_rate': '37_property_tax_rate',
  'tax_exemptions': '38_tax_exemptions',

  // Structure (39-48)
  'roof_type': '39_roof_type',
  'roof': '39_roof_type',
  'roof_age_est': '40_roof_age_est',
  'roof_age': '40_roof_age_est',
  'exterior_material': '41_exterior_material',
  'exterior': '41_exterior_material',
  'foundation': '42_foundation',
  'water_heater_type': '43_water_heater_type',
  'garage_type': '44_garage_type',
  'hvac_type': '45_hvac_type',
  'hvac': '45_hvac_type',
  'hvac_age': '46_hvac_age',
  'laundry_type': '47_laundry_type',
  'interior_condition': '48_interior_condition',

  // Interior (49-53)
  'flooring_type': '49_flooring_type',
  'flooring': '49_flooring_type',
  'kitchen_features': '50_kitchen_features',
  'kitchen': '50_kitchen_features',
  'appliances_included': '51_appliances_included',
  'appliances': '51_appliances_included',
  'fireplace_yn': '52_fireplace_yn',
  'fireplace': '52_fireplace_yn',
  'has_fireplace': '52_fireplace_yn',
  'fireplace_count': '53_fireplace_count',

  // Exterior (54-58)
  'pool_yn': '54_pool_yn',
  'pool': '54_pool_yn',
  'has_pool': '54_pool_yn',
  'pool_type': '55_pool_type',
  'deck_patio': '56_deck_patio',
  'patio': '56_deck_patio',
  'fence': '57_fence',
  'landscaping': '58_landscaping',

  // Permits (59-62)
  'recent_renovations': '59_recent_renovations',
  'renovations': '59_recent_renovations',
  'permit_history_roof': '60_permit_history_roof',
  'permit_history_hvac': '61_permit_history_hvac',
  'permit_history_other': '62_permit_history_other',

  // Schools (63-73)
  'school_district': '63_school_district',
  'elevation_feet': '64_elevation_feet',
  'elevation': '64_elevation_feet',
  'elementary_school': '65_elementary_school',
  'assigned_elementary': '65_elementary_school',
  'elementary_school_name': '65_elementary_school',
  'elementary_rating': '66_elementary_rating',
  'elementary_school_rating': '66_elementary_rating',
  'elementary_distance': '67_elementary_distance_mi',
  'middle_school': '68_middle_school',
  'assigned_middle': '68_middle_school',
  'middle_school_name': '68_middle_school',
  'middle_rating': '69_middle_rating',
  'middle_school_rating': '69_middle_rating',
  'middle_distance': '70_middle_distance_mi',
  'high_school': '71_high_school',
  'assigned_high': '71_high_school',
  'high_school_name': '71_high_school',
  'high_rating': '72_high_rating',
  'high_school_rating': '72_high_rating',
  'high_distance': '73_high_distance_mi',

  // Scores (74-82)
  'walk_score': '74_walk_score',
  'walkscore': '74_walk_score',
  'transit_score': '75_transit_score',
  'bike_score': '76_bike_score',
  'safety_score': '77_safety_score',
  'noise_level': '78_noise_level',
  'traffic_level': '79_traffic_level',
  'walkability_description': '80_walkability_description',
  'public_transit_access': '81_public_transit_access',
  'commute_time': '82_commute_to_city_center',
  'commute_to_city_center': '82_commute_to_city_center',

  // Distances (83-87)
  'distance_grocery': '83_distance_grocery_mi',
  'distance_grocery_mi': '83_distance_grocery_mi',
  'distance_hospital': '84_distance_hospital_mi',
  'distance_hospital_mi': '84_distance_hospital_mi',
  'distance_airport': '85_distance_airport_mi',
  'distance_airport_mi': '85_distance_airport_mi',
  'distance_park': '86_distance_park_mi',
  'distance_park_mi': '86_distance_park_mi',
  'distance_beach': '87_distance_beach_mi',
  'distance_beach_mi': '87_distance_beach_mi',

  // Safety (88-90)
  'crime_index_violent': '88_violent_crime_index',
  'violent_crime_index': '88_violent_crime_index',
  'crime_index_property': '89_property_crime_index',
  'property_crime_index': '89_property_crime_index',
  'neighborhood_safety_rating': '90_neighborhood_safety_rating',

  // Market (91-103)
  'median_home_price_neighborhood': '91_median_home_price_neighborhood',
  'median_home_price': '91_median_home_price_neighborhood',
  'price_per_sqft_recent_avg': '92_price_per_sqft_recent_avg',
  'price_to_rent_ratio': '93_price_to_rent_ratio',
  'price_vs_median_percent': '94_price_vs_median_percent',
  'days_on_market_avg': '95_days_on_market_avg',
  'days_on_market': '95_days_on_market_avg',
  'avg_days_on_market': '95_days_on_market_avg',
  'inventory_surplus': '96_inventory_surplus',
  'insurance_est_annual': '97_insurance_est_annual',
  'insurance_estimate': '97_insurance_est_annual',
  'insurance_estimate_annual': '97_insurance_est_annual',
  'rental_estimate_monthly': '98_rental_estimate_monthly',
  'rent_estimate': '98_rental_estimate_monthly',
  'rental_estimate': '98_rental_estimate_monthly',
  'rental_yield_est': '99_rental_yield_est',
  'rental_yield': '99_rental_yield_est',
  'rental_yield_percent': '99_rental_yield_est',
  'vacancy_rate_neighborhood': '100_vacancy_rate_neighborhood',
  'vacancy_rate': '100_vacancy_rate_neighborhood',
  'cap_rate_est': '101_cap_rate_est',
  'cap_rate': '101_cap_rate_est',
  'cap_rate_est_percent': '101_cap_rate_est',
  'financing_terms': '102_financing_terms',
  'comparable_sales': '103_comparable_sales',

  // Utilities (104-116)
  'electric_provider': '104_electric_provider',
  'avg_electric_bill': '105_avg_electric_bill',
  'water_provider': '106_water_provider',
  'avg_water_bill': '107_avg_water_bill',
  'sewer_provider': '108_sewer_provider',
  'natural_gas': '109_natural_gas',
  'trash_provider': '110_trash_provider',
  'internet_providers': '111_internet_providers_top3',
  'internet_providers_top3': '111_internet_providers_top3',
  'max_internet_speed': '112_max_internet_speed',
  'fiber_available': '113_fiber_available',
  'cable_tv_provider': '114_cable_tv_provider',
  'cell_coverage_quality': '115_cell_coverage_quality',
  'cell_coverage': '115_cell_coverage_quality',
  'emergency_services_distance': '116_emergency_services_distance',

  // Environment (117-130)
  'air_quality_index': '117_air_quality_index',
  'aqi': '117_air_quality_index',
  'air_quality_grade': '118_air_quality_grade',
  'flood_zone': '119_flood_zone',
  'flood_zone_code': '119_flood_zone',
  'flood_risk_level': '120_flood_risk_level',
  'flood_risk': '120_flood_risk_level',
  'climate_risk': '121_climate_risk',
  'climate_risk_summary': '121_climate_risk',
  'wildfire_risk': '122_wildfire_risk',
  'earthquake_risk': '123_earthquake_risk',
  'hurricane_risk': '124_hurricane_risk',
  'tornado_risk': '125_tornado_risk',
  'radon_risk': '126_radon_risk',
  'superfund_nearby': '127_superfund_site_nearby',
  'superfund_site_nearby': '127_superfund_site_nearby',
  'sea_level_rise_risk': '128_sea_level_rise_risk',
  'noise_level_db_est': '129_noise_level_db_est',
  'noise_level_db': '129_noise_level_db_est',
  'solar_potential': '130_solar_potential',

  // Additional (131-138)
  'view_type': '131_view_type',
  'lot_features': '132_lot_features',
  'ev_charging': '133_ev_charging',
  'ev_charging_yn': '133_ev_charging',
  'smart_home_features': '134_smart_home_features',
  'accessibility_modifications': '135_accessibility_modifications',
  'accessibility_mods': '135_accessibility_modifications',
  'pet_policy': '136_pet_policy',
  'age_restrictions': '137_age_restrictions',
  'special_assessments': '138_special_assessments',

  // Location extras (keep for parsing)
  'city': 'city',
  'state': 'state',
  'latitude': 'latitude',
  'lat': 'latitude',
  'longitude': 'longitude',
  'lng': 'longitude',
  'lon': 'longitude',
};

/**
 * Sanitize input values to prevent injection and ensure data integrity
 * @param value - The value to sanitize
 * @param fieldType - The expected type of the field ('string' | 'number' | 'boolean')
 * @returns Sanitized value or null if invalid
 */
function sanitizeInputValue(value: any, fieldType: 'string' | 'number' | 'boolean' = 'string'): any {
  if (value === null || value === undefined) return null;

  // Check for common invalid/placeholder values
  const strVal = String(value).toLowerCase().trim();
  const invalidValues = ['null', 'undefined', 'n/a', 'na', 'nan', 'unknown', 'not available', 'not found', 'none', '-', '--', 'tbd', 'n\\a', ''];
  if (invalidValues.includes(strVal)) return null;

  switch (fieldType) {
    case 'number':
      // Remove currency symbols and commas, then parse
      const cleanedNum = String(value).replace(/[$,]/g, '').trim();
      const parsed = parseFloat(cleanedNum);
      if (isNaN(parsed) || !isFinite(parsed)) return null;
      // Sanity check for unreasonable values
      if (parsed < 0 || parsed > 1000000000) return null;
      return parsed;

    case 'boolean':
      if (typeof value === 'boolean') return value;
      const boolStr = strVal;
      if (['true', 'yes', '1', 'y'].includes(boolStr)) return true;
      if (['false', 'no', '0', 'n'].includes(boolStr)) return false;
      return null;

    case 'string':
    default:
      // Sanitize strings: limit length, remove control characters
      let sanitized = String(value).trim();
      // Remove control characters except newlines and tabs
      sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      // Limit string length to prevent abuse
      if (sanitized.length > 10000) sanitized = sanitized.substring(0, 10000);
      return sanitized || null;
  }
}

// Fields that are known to be monthly and need conversion to annual
const MONTHLY_TO_ANNUAL_FIELDS = new Set(['hoa_fee_monthly', 'hoa_monthly']);

/**
 * Convert flat LLM field names to numbered field keys
 * Only applies to Grok, Opus, Gemini - not Perplexity/Sonnet/GPT
 * Also handles HOA fee monthly-to-annual conversion and input sanitization
 */
function mapFlatFieldsToNumbered(fields: Record<string, any>, source: string): Record<string, any> {
  const mapped: Record<string, any> = {};

  for (const [key, fieldData] of Object.entries(fields)) {
    const lowerKey = key.toLowerCase();
    const numberedKey = FLAT_TO_NUMBERED_FIELD_MAP[lowerKey] || FLAT_TO_NUMBERED_FIELD_MAP[key];

    if (numberedKey) {
      let processedFieldData = { ...fieldData };

      // Handle HOA fee monthly-to-annual conversion
      if (MONTHLY_TO_ANNUAL_FIELDS.has(lowerKey) && numberedKey === '31_hoa_fee_annual') {
        const rawValue = fieldData.value !== undefined ? fieldData.value : fieldData;
        const sanitizedValue = sanitizeInputValue(rawValue, 'number');
        if (sanitizedValue !== null && typeof sanitizedValue === 'number') {
          // Convert monthly to annual by multiplying by 12
          const annualValue = sanitizedValue * 12;
          processedFieldData = {
            value: annualValue,
            source: fieldData.source || source,
            confidence: fieldData.confidence || 'Medium',
            note: `Converted from monthly ($${sanitizedValue}/mo) to annual`
          };
          console.log(`[${source}] Converted HOA fee from monthly ($${sanitizedValue}) to annual ($${annualValue})`);
        }
      }

      mapped[numberedKey] = processedFieldData;
    } else {
      // Keep original key if no mapping found (may still be useful)
      mapped[key] = fieldData;
    }
  }

  console.log(`[${source}] Mapped ${Object.keys(fields).length} flat fields to ${Object.keys(mapped).length} numbered fields`);
  return mapped;
}

// SSE helper to send events
function sendEvent(res: VercelResponse, event: string, data: any) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// LLM Call Functions
async function callPerplexity(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return { error: 'API key not set', fields: {} };

  const systemPrompt = `You are a strict real-estate data extraction engine.
Your only goal is to return a single, normalized JSON object for one residential property, with maximum accuracy and internal consistency.
Use ONLY well-supported facts from the web. If sources conflict, apply these tie-break rules in order: (1) county property appraiser, (2) current MLS listing, (3) major portals (Redfin/Zillow/Realtor), (4) other sources. Prefer the most recent tax year and most recent list data when conflicts exist.

CRITICAL RULES:
- ONLY include fields you can verify with confidence. OMIT any field you cannot verify - do NOT include null, N/A, "unknown", or empty values.
- Do NOT invent or infer values beyond what a professional appraiser or underwriter would accept as factual.
- Return JSON ONLY, no commentary, no markdown, no backticks.

Use this schema (include ONLY fields with verified data):

{
  "meta": {
    "data_completeness_percent": <number 0-100>,
    "fields_returned": <integer>,
    "last_verified_source_name": "<string>"
  },
  "address_identity": {
    "full_address": "<string>",
    "street_address": "<string>",
    "unit_number": "<string>",
    "city": "<string>",
    "state": "<string>",
    "zip_code": "<string>",
    "county": "<string>",
    "neighborhood": "<string>",
    "latitude": <number>,
    "longitude": <number>,
    "parcel_id": "<string>",
    "mls_primary": "<string>"
  },
  "pricing_value": {
    "listing_status": "<'Active' | 'Pending' | 'Closed' | 'OffMarket' | 'Expired'>",
    "listing_price": <number>,
    "price_per_sq_ft": <number>,
    "listing_date": "<YYYY-MM-DD>",
    "market_value_estimate": <number>,
    "last_sale_date": "<YYYY-MM-DD>",
    "last_sale_price": <number>,
    "assessed_value": <number>,
    "assessed_value_year": <integer>,
    "redfin_estimate": <number>,
    "zestimate": <number>
  },
  "property_basics": {
    "property_type": "<'Single Family' | 'Condo' | 'Townhouse' | 'Multi-Family' | 'Vacant Land' | 'Other'>",
    "ownership_type": "<'Condominium' | 'Fee Simple' | 'Co-op' | 'Leasehold'>",
    "bedrooms": <number>,
    "full_bathrooms": <number>,
    "half_bathrooms": <number>,
    "total_bathrooms": <number>,
    "living_sq_ft": <number>,
    "total_sq_ft_under_roof": <number>,
    "lot_size_sq_ft": <number>,
    "lot_size_acres": <number>,
    "year_built": <number>,
    "stories": <number>,
    "floor_number": <number>,
    "garage_spaces": <number>,
    "parking_total": <number>
  },
  "hoa_taxes": {
    "hoa": <true | false>,
    "hoa_fee_annual": <number>,
    "hoa_fee_monthly": <number>,
    "hoa_name": "<string>",
    "hoa_includes": "<string>",
    "annual_taxes": <number>,
    "tax_year": <number>,
    "property_tax_rate_percent": <number>
  },
  "structure_systems": {
    "roof_type": "<string>",
    "exterior_material": "<string>",
    "foundation": "<string>",
    "hvac_type": "<string>",
    "water_heater_type": "<string>",
    "laundry_type": "<string>"
  },
  "interior_features": {
    "flooring_type": "<string>",
    "kitchen_features": "<string>",
    "appliances_included": "<string>",
    "fireplace": <true | false>,
    "fireplace_count": <number>
  },
  "exterior_features": {
    "pool": <true | false>,
    "pool_type": "<string>",
    "deck_patio": "<string>",
    "waterfront": "<string>",
    "view": "<string>"
  },
  "schools_scores": {
    "school_district": "<string>",
    "elementary_school_name": "<string>",
    "elementary_school_rating": <number>,
    "middle_school_name": "<string>",
    "middle_school_rating": <number>,
    "high_school_name": "<string>",
    "high_school_rating": <number>,
    "walk_score": <number>,
    "transit_score": <number>,
    "bike_score": <number>
  },
  "market_investment": {
    "median_home_price_neighborhood": <number>,
    "avg_days_on_market": <number>,
    "insurance_estimate_annual": <number>,
    "rental_estimate_monthly": <number>,
    "rental_yield_percent": <number>,
    "cap_rate_est_percent": <number>
  },
  "utilities_connectivity": {
    "electric_provider": "<string>",
    "water_provider": "<string>",
    "internet_providers": "<string>",
    "fiber_available": <true | false>
  },
  "environment_risk": {
    "air_quality_index": <number>,
    "flood_zone_code": "<string>",
    "flood_risk_level": "<'Low' | 'Moderate' | 'High'>",
    "hurricane_risk": "<'Low' | 'Moderate' | 'High'>",
    "elevation_feet": <number>
  }
}

Rules:
- Use numeric types for all monetary/numeric fields (no $ or commas).
- Ensure internal consistency: total_bathrooms = full_bathrooms + 0.5 * half_bathrooms.
- If MLS and county conflict on bed/bath/sqft, prefer county for structure, MLS for interior.
- OMIT any field you cannot verify. Never use null, N/A, unknown, or empty string.`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Identify and extract all available verified data for the residential property at: ${address}` }
        ],
        temperature: 0.1,
      }),
    });

    const data = await response.json();

    // Log Perplexity response for debugging
    console.log('[PERPLEXITY] Status:', response.status, '| Citations:', data.citations?.length || 0, '| Error:', data.error || 'none');

    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const fields: Record<string, any> = {};

        // Flatten nested structure into fields
        const flattenObject = (obj: any, prefix = '') => {
          for (const [key, value] of Object.entries(obj)) {
            const strVal = String(value).toLowerCase().trim();
          const isBadValue = strVal === '' || strVal === 'null' || strVal === 'undefined' || strVal === 'n/a' || strVal === 'na' || strVal === 'nan' || strVal === 'unknown' || strVal === 'not available' || strVal === 'not found' || strVal === 'none' || strVal === '-' || strVal === '--' || strVal === 'tbd' || strVal === 'n\a' || (typeof value === 'number' && isNaN(value));
          if (!isBadValue) {
              if (typeof value === 'object' && !Array.isArray(value)) {
                flattenObject(value, prefix + key + '_');
              } else {
                fields[prefix + key] = {
                  value: value,
                  source: 'Perplexity (Web Search)',
                  confidence: 'Medium'
                };
              }
            }
          }
        };
        flattenObject(parsed);
        return { fields };
      }
    }
    return { error: 'Failed to parse response', fields: {} };
  } catch (error) {
    return { error: String(error), fields: {} };
  }
}

async function callGrok(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { error: 'API key not set', fields: {} };

  // Simple prompt that returns flat field names (matches working retry-llm.ts)
  const systemPrompt = `You are a real estate data assistant with web search capabilities. Return ONLY a JSON object with property data. Do NOT include null, N/A, or unknown values - simply omit fields you cannot verify. Return JSON only.`;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-3-fast',
        max_tokens: 4000,
        temperature: 0.1,
        search_parameters: { mode: 'auto' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Search and return property data for: ${address}. Return JSON only.` }
        ],
      }),
    });

    const data = await response.json();
    console.log('[GROK] Status:', response.status);

    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const fields: Record<string, any> = {};
        // Flat field parsing - no nested prefix (matches working retry-llm.ts)
        for (const [key, value] of Object.entries(parsed)) {
          if (value !== null && value !== undefined && value !== '' && value !== 'N/A') {
            fields[key] = { value, source: 'Grok', confidence: 'Medium' };
          }
        }
        console.log('[GROK] Fields found:', Object.keys(fields).length);
        // Map flat field names to numbered keys for frontend compatibility
        const mappedFields = mapFlatFieldsToNumbered(fields, 'GROK');
        return { fields: mappedFields };
      }
    }
    return { error: 'Failed to parse response', fields: {} };
  } catch (error) {
    return { error: String(error), fields: {} };
  }
}

async function callClaudeOpus(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: 'API key not set', fields: {} };

  // Simple flat field prompt (matches working retry-llm.ts)
  const prompt = `You are a real estate data assistant. Based on your knowledge, provide property data estimates for this address: ${address}

Return a JSON object with any of these fields you can reasonably estimate based on the location, city, neighborhood patterns, and typical property characteristics for the area:

{
  "property_type": "Single Family | Condo | Townhouse | Multi-Family",
  "city": "city name",
  "state": "FL",
  "county": "county name",
  "neighborhood": "neighborhood name if known",
  "zip_code": "ZIP code",
  "median_home_price_neighborhood": estimated median home price for the area,
  "avg_days_on_market": typical days on market for the area,
  "school_district": "school district name",
  "flood_risk_level": "Low | Moderate | High",
  "hurricane_risk": "Low | Moderate | High",
  "walkability_description": "description of walkability",
  "rental_estimate_monthly": estimated monthly rent for similar properties,
  "insurance_estimate_annual": estimated annual insurance,
  "property_tax_rate_percent": typical tax rate for the area
}

Only include fields you have reasonable confidence about based on the location. Return ONLY the JSON object, no explanation.`;

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
    console.log('[CLAUDE OPUS] Status:', response.status);

    if (data.content?.[0]?.text) {
      const text = data.content[0].text;
      // Extract JSON from markdown code blocks or raw text
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : text.match(/\{[\s\S]*\}/)?.[0];

      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        const fields: Record<string, any> = {};
        // Flat field parsing - no nested prefix (matches working retry-llm.ts)
        for (const [key, value] of Object.entries(parsed.fields || parsed)) {
          const strVal = String(value).toLowerCase().trim();
          const isBadValue = strVal === '' || strVal === 'null' || strVal === 'undefined' || strVal === 'n/a' || strVal === 'na' || strVal === 'unknown' || strVal === 'not available' || strVal === 'none';
          if (!isBadValue) {
            fields[key] = {
              value: (value as any)?.value !== undefined ? (value as any).value : value,
              source: 'Claude Opus',
              confidence: 'Low'
            };
          }
        }
        console.log('[CLAUDE OPUS] Fields found:', Object.keys(fields).length);
        // Map flat field names to numbered keys for frontend compatibility
        const mappedFields = mapFlatFieldsToNumbered(fields, 'CLAUDE OPUS');
        return { fields: mappedFields };
      }
    }
    return { error: 'Failed to parse response', fields: {} };
  } catch (error) {
    console.log('[CLAUDE OPUS] Error:', String(error));
    return { error: String(error), fields: {} };
  }
}

async function callGPT(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { error: 'API key not set', fields: {} };

  const prompt = `You are a real estate data assistant. Based on your knowledge, provide property data estimates for this address: ${address}

Return a JSON object with any of these fields you can reasonably estimate based on the location, city, neighborhood patterns, and typical property characteristics for the area:

{
  "property_type": "Single Family | Condo | Townhouse | Multi-Family",
  "city": "city name",
  "state": "FL",
  "county": "county name",
  "neighborhood": "neighborhood name if known",
  "zip_code": "ZIP code",
  "median_home_price_neighborhood": estimated median home price for the area,
  "avg_days_on_market": typical days on market for the area,
  "school_district": "school district name",
  "flood_risk_level": "Low | Moderate | High",
  "hurricane_risk": "Low | Moderate | High",
  "walkability_description": "description of walkability",
  "rental_estimate_monthly": estimated monthly rent for similar properties,
  "insurance_estimate_annual": estimated annual insurance,
  "property_tax_rate_percent": typical tax rate for the area
}

Only include fields you have reasonable confidence about based on the location. Return ONLY the JSON object, no explanation.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 4000,
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    const data = await response.json();
    console.log('[GPT] Status:', response.status, '| Response:', JSON.stringify(data).slice(0, 500));

    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      console.log('[GPT] Text:', text.slice(0, 500));
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const fields: Record<string, any> = {};
        for (const [key, value] of Object.entries(parsed.fields || parsed)) {
          const strVal = String(value).toLowerCase().trim();
          const isBadValue = strVal === '' || strVal === 'null' || strVal === 'undefined' || strVal === 'n/a' || strVal === 'na' || strVal === 'nan' || strVal === 'unknown' || strVal === 'not available' || strVal === 'not found' || strVal === 'none' || strVal === '-' || strVal === '--' || strVal === 'tbd' || strVal === 'n\a' || (typeof value === 'number' && isNaN(value));
          if (!isBadValue) {
            fields[key] = {
              value: (value as any)?.value !== undefined ? (value as any).value : value,
              source: 'GPT',
              confidence: 'Low'
            };
          }
        }
        console.log('[GPT] Fields found:', Object.keys(fields).length);
        return { fields };
      }
    }
    return { error: 'Failed to parse response', fields: {} };
  } catch (error) {
    console.log('[GPT] Error:', String(error));
    return { error: String(error), fields: {} };
  }
}

async function callClaudeSonnet(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: 'API key not set', fields: {} };

  const prompt = `You are a real estate data assistant. Based on your knowledge, provide property data estimates for this address: ${address}

Return a JSON object with any of these fields you can reasonably estimate based on the location, city, neighborhood patterns, and typical property characteristics for the area:

{
  "property_type": "Single Family | Condo | Townhouse | Multi-Family",
  "city": "city name",
  "state": "FL",
  "county": "county name",
  "neighborhood": "neighborhood name if known",
  "zip_code": "ZIP code",
  "median_home_price_neighborhood": estimated median home price for the area,
  "avg_days_on_market": typical days on market for the area,
  "school_district": "school district name",
  "flood_risk_level": "Low | Moderate | High",
  "hurricane_risk": "Low | Moderate | High",
  "walkability_description": "description of walkability",
  "rental_estimate_monthly": estimated monthly rent for similar properties,
  "insurance_estimate_annual": estimated annual insurance,
  "property_tax_rate_percent": typical tax rate for the area
}

Only include fields you have reasonable confidence about based on the location. Return ONLY the JSON object, no explanation.`;

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
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    console.log('[CLAUDE SONNET] Status:', response.status, '| Response:', JSON.stringify(data).slice(0, 500));

    if (data.content?.[0]?.text) {
      const text = data.content[0].text;
      console.log('[CLAUDE SONNET] Text:', text.slice(0, 500));
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const fields: Record<string, any> = {};
        for (const [key, value] of Object.entries(parsed.fields || parsed)) {
          const strVal = String(value).toLowerCase().trim();
          const isBadValue = strVal === '' || strVal === 'null' || strVal === 'undefined' || strVal === 'n/a' || strVal === 'na' || strVal === 'nan' || strVal === 'unknown' || strVal === 'not available' || strVal === 'not found' || strVal === 'none' || strVal === '-' || strVal === '--' || strVal === 'tbd' || strVal === 'n\a' || (typeof value === 'number' && isNaN(value));
          if (!isBadValue) {
            fields[key] = {
              value: (value as any)?.value !== undefined ? (value as any).value : value,
              source: 'Claude Sonnet',
              confidence: 'Low'
            };
          }
        }
        console.log('[CLAUDE SONNET] Fields found:', Object.keys(fields).length);
        return { fields };
      }
    }
    return { error: 'Failed to parse response', fields: {} };
  } catch (error) {
    console.log('[CLAUDE SONNET] Error:', String(error));
    return { error: String(error), fields: {} };
  }
}

async function callGemini(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { error: 'API key not set', fields: {} };

  // Simple flat field prompt (matches working retry-llm.ts)
  const prompt = `You are a real estate analyst. Return ONLY a JSON object with property data for: ${address}

Include any of these fields you can reasonably estimate:
- property_type, bedrooms, bathrooms, sqft, year_built
- listing_price, market_value_estimate, price_per_sqft
- hoa_monthly, tax_annual, insurance_annual
- flood_zone, flood_risk, hurricane_risk
- rental_estimate_monthly, cap_rate_percent

Do NOT include null, N/A, or unknown values. Return JSON only, no markdown.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 4000, temperature: 0.1 },
        }),
      }
    );

    const data = await response.json();
    console.log('[GEMINI] Status:', response.status);

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const fields: Record<string, any> = {};
        // Flat field parsing - no nested prefix (matches working retry-llm.ts)
        for (const [key, value] of Object.entries(parsed)) {
          if (value !== null && value !== undefined && value !== '' && value !== 'N/A') {
            fields[key] = { value, source: 'Gemini', confidence: 'Medium' };
          }
        }
        console.log('[GEMINI] Fields found:', Object.keys(fields).length);
        // Map flat field names to numbered keys for frontend compatibility
        const mappedFields = mapFlatFieldsToNumbered(fields, 'GEMINI');
        return { fields: mappedFields };
      }
    }
    return { error: 'Failed to parse response', fields: {} };
  } catch (error) {
    console.log('[GEMINI] Error:', String(error));
    return { error: String(error), fields: {} };
  }
}

// Extract Zillow ZPID from URL if provided
function extractZpidFromUrl(url: string): string | undefined {
  const match = url.match(/\/(\d+)_zpid/);
  return match?.[1];
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

  // LLM CASCADE ORDER: Perplexity → Grok → Claude Opus → GPT → Claude Sonnet → Gemini
  // Web-search LLMs first (verify real data), then knowledge-based LLMs
  const {
    address,
    url,
    engines = ['perplexity', 'grok', 'claude-opus', 'gpt', 'claude-sonnet', 'gemini'],  // All 6 LLMs in parallel
    skipLLMs = false,
    existingFields = {},  // Previously accumulated fields from prior LLM calls
    skipApis = false,  // Skip free APIs if we already have their data
  } = req.body;

  if (!address && !url) {
    return res.status(400).json({ error: 'Address or URL required' });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const arbitrationPipeline = createArbitrationPipeline(2);
  const llmResponses: any[] = [];

  // Pre-load existing fields into the pipeline (from previous LLM calls)
  if (existingFields && Object.keys(existingFields).length > 0) {
    console.log(`[ACCUMULATE] Loading ${Object.keys(existingFields).length} existing fields into pipeline`);
    arbitrationPipeline.addFieldsFromSource(existingFields, 'Previous Session');
    sendEvent(res, 'progress', {
      source: 'existing-data',
      status: 'complete',
      fieldsFound: Object.keys(existingFields).length,
      message: 'Loaded existing data'
    });
  }

  // Extract ZPID if Zillow URL provided
  const zpid = url ? extractZpidFromUrl(url) : undefined;
  const searchAddress = address || url;

  try {
    // ========================================
    // OPTIMIZED FOR VERCEL PRO (60s limit)
    // Parallel execution with per-call timeouts
    // ========================================

    const API_TIMEOUT = 30000; // 30s per API call (HowLoud can be slow)
    const LLM_TIMEOUT = 55000; // 55s per LLM call (all run in parallel, within 60s Vercel Pro limit)
    const startTime = Date.now();
    const DEADLINE = 59000; // 59s hard deadline (Vercel Pro allows 60s)

    // Helper to create timeout fallback with correct source
    const createFallback = (source: string) => ({
      fields: {},
      success: false,
      error: 'timeout',
      source
    });

    // Check if we're running out of time
    const hasTime = () => (Date.now() - startTime) < DEADLINE;

    // ========================================
    // TIER 2: GOOGLE GEOCODE (must run first for lat/lon)
    // Skip if we already have API data from previous session
    // ========================================
    let lat: number | undefined;
    let lon: number | undefined;

    if (!skipApis) {
      sendEvent(res, 'progress', { source: 'google-geocode', status: 'searching', message: 'Geocoding address...' });

      try {
        const geoResult = await withTimeout(
          callGoogleGeocode(searchAddress),
          API_TIMEOUT,
          { ...createFallback('Google Geocode'), lat: undefined, lon: undefined, county: '', zip: '' }
        );
        const newFields = arbitrationPipeline.addFieldsFromSource(geoResult.fields, 'Google Geocode');
        lat = geoResult.lat;
        lon = geoResult.lon;
        sendEvent(res, 'progress', {
          source: 'google-geocode',
          status: geoResult.success ? 'complete' : 'error',
          fieldsFound: newFields,
          totalFieldsSoFar: arbitrationPipeline.getFieldCount(),
          error: geoResult.error
        });
      } catch (e) {
        sendEvent(res, 'progress', { source: 'google-geocode', status: 'error', fieldsFound: 0, error: String(e) });
      }
    } else {
      // Skip APIs - mark as skipped
      sendEvent(res, 'progress', { source: 'google-geocode', status: 'skipped', fieldsFound: 0, message: 'Using cached data' });
    }

    // ========================================
    // TIER 2-3: PARALLEL API CALLS (if we have coordinates and time)
    // Skip if we're only adding LLM data to existing session
    // ========================================
    if (!skipApis && lat && lon && hasTime()) {
      const tier23Sources = ['google-places', 'walkscore', 'fema', 'schooldigger', 'airnow', 'howloud', 'weather', 'crime'];
      tier23Sources.forEach(src => {
        sendEvent(res, 'progress', { source: src, status: 'searching', message: 'Fetching...' });
      });

      const apiCalls = [
        { call: callGooglePlaces(lat, lon), source: 'google-places', name: 'Google Places' },
        { call: callWalkScore(lat, lon, searchAddress), source: 'walkscore', name: 'WalkScore' },
        { call: callFemaFlood(lat, lon), source: 'fema', name: 'FEMA' },
        { call: callSchoolDigger(lat, lon), source: 'schooldigger', name: 'SchoolDigger' },
        { call: callAirNow(lat, lon), source: 'airnow', name: 'AirNow' },
        { call: callHowLoud(lat, lon), source: 'howloud', name: 'HowLoud' },
        { call: callWeather(lat, lon), source: 'weather', name: 'Weather' },
        { call: callCrimeGrade(lat, lon, searchAddress), source: 'crime', name: 'FBI Crime' },
      ];

      const results = await Promise.allSettled(
        apiCalls.map(({ call, name }) =>
          withTimeout(call, API_TIMEOUT, createFallback(name))
        )
      );

      results.forEach((result, idx) => {
        const { source, name } = apiCalls[idx];
        if (result.status === 'fulfilled') {
          const data = result.value;
          const newFields = arbitrationPipeline.addFieldsFromSource(data.fields || {}, name);
          sendEvent(res, 'progress', {
            source,
            status: data.success ? 'complete' : 'error',
            fieldsFound: newFields,
            totalFieldsSoFar: arbitrationPipeline.getFieldCount(),
            error: data.error
          });
        } else {
          sendEvent(res, 'progress', { source, status: 'error', fieldsFound: 0, totalFieldsSoFar: arbitrationPipeline.getFieldCount(), error: 'Failed' });
        }
      });

    } else if (skipApis) {
      // Skip all APIs when adding LLM data to existing session
      ['google-places', 'walkscore', 'fema', 'schooldigger', 'airnow', 'howloud', 'weather', 'crime'].forEach(src => {
        sendEvent(res, 'progress', { source: src, status: 'skipped', fieldsFound: 0, message: 'Using cached data' });
      });
    } else if (!lat || !lon) {
      ['google-places', 'walkscore', 'fema', 'schooldigger', 'airnow', 'howloud', 'weather', 'crime'].forEach(src => {
        sendEvent(res, 'progress', { source: src, status: 'skipped', fieldsFound: 0, error: 'No coordinates' });
      });
    } else {
      ['google-places', 'walkscore', 'fema', 'schooldigger', 'airnow', 'howloud', 'weather', 'crime'].forEach(src => {
        sendEvent(res, 'progress', { source: src, status: 'skipped', fieldsFound: 0, error: 'Time limit' });
      });
    }

    // ========================================
    // TIER 4: LLMs - PARALLEL (all selected LLMs)
    // ========================================
    if (!skipLLMs && hasTime()) {
      const intermediateResult = arbitrationPipeline.getResult();
      const currentFieldCount = Object.keys(intermediateResult.fields).length;
      console.log(`[LLM GATE] Current field count before LLMs: ${currentFieldCount}`);

      // ALWAYS call selected LLMs - removed the "skip if 100+ fields" logic
      // LLMs provide valuable additional data even if APIs returned some fields
      if (true) {  // Always run LLMs if enabled and time permits
        // Pro plan: Use ALL selected LLMs
        const enabledLlms = [
          { id: 'perplexity', fn: callPerplexity, name: 'Perplexity', enabled: engines.includes('perplexity') },
          { id: 'grok', fn: callGrok, name: 'Grok', enabled: engines.includes('grok') },
          { id: 'claude-opus', fn: callClaudeOpus, name: 'Claude Opus', enabled: engines.includes('claude-opus') },
          { id: 'gpt', fn: callGPT, name: 'GPT', enabled: engines.includes('gpt') },
          { id: 'claude-sonnet', fn: callClaudeSonnet, name: 'Claude Sonnet', enabled: engines.includes('claude-sonnet') },
          { id: 'gemini', fn: callGemini, name: 'Gemini', enabled: engines.includes('gemini') },
        ].filter(l => l.enabled);

        // Report skipped LLMs
        ['perplexity', 'grok', 'claude-opus', 'gpt', 'claude-sonnet', 'gemini'].forEach(id => {
          if (!engines.includes(id)) {
            sendEvent(res, 'progress', { source: id, status: 'skipped', fieldsFound: 0, message: 'Not enabled' });
          }
        });

        if (enabledLlms.length > 0) {
          enabledLlms.forEach(llm => {
            sendEvent(res, 'progress', { source: llm.id, status: 'searching', message: `Querying ${llm.name}...` });
          });

          const llmResults = await Promise.allSettled(
            enabledLlms.map(llm =>
              withTimeout(llm.fn(searchAddress), LLM_TIMEOUT, { fields: {}, error: 'timeout' })
            )
          );

          llmResults.forEach((result, idx) => {
            const llm = enabledLlms[idx];
            if (result.status === 'fulfilled') {
              const data = result.value;
              // Count raw fields returned by this LLM (before deduplication)
              const rawFieldCount = Object.keys(data.fields || {}).length;
              // Count new unique fields added to the pipeline
              const newUniqueFields = arbitrationPipeline.addFieldsFromSource(data.fields || {}, llm.name);
              llmResponses.push({
                llm: llm.id,
                fields_found: rawFieldCount,  // Actual fields returned by LLM
                new_unique_fields: newUniqueFields,  // Fields not already found
                success: !data.error
              });
              sendEvent(res, 'progress', {
                source: llm.id,
                status: data.error ? 'error' : 'complete',
                fieldsFound: rawFieldCount,  // Show actual fields returned
                newUniqueFields: newUniqueFields,  // Also show new unique count
                totalFieldsSoFar: arbitrationPipeline.getFieldCount(),
                error: data.error
              });
            } else {
              sendEvent(res, 'progress', { source: llm.id, status: 'error', fieldsFound: 0, newUniqueFields: 0, totalFieldsSoFar: arbitrationPipeline.getFieldCount(), error: 'Failed' });
              llmResponses.push({ llm: llm.id, fields_found: 0, new_unique_fields: 0, success: false });
            }
          });
        }
      }
      // Removed "Sufficient data" skip logic - LLMs always run if enabled
    } else if (!hasTime()) {
      ['perplexity', 'grok', 'claude-opus', 'gpt', 'claude-sonnet', 'gemini'].forEach(id => {
        sendEvent(res, 'progress', { source: id, status: 'skipped', fieldsFound: 0, message: 'Time limit' });
      });
    } else {
      ['perplexity', 'grok', 'claude-opus', 'gpt', 'claude-sonnet', 'gemini'].forEach(id => {
        sendEvent(res, 'progress', { source: id, status: 'skipped', fieldsFound: 0 });
      });
    }

    // Get final arbitration result with quorum voting and single-source detection
    const arbitrationResult = arbitrationPipeline.getResult();
    const totalFields = Object.keys(arbitrationResult.fields).length;
    const completionPercentage = Math.round((totalFields / 138) * 100);

    // Send final complete event with all data including arbitration metadata
    sendEvent(res, 'complete', {
      success: true,
      address: searchAddress,
      fields: arbitrationResult.fields,
      total_fields_found: totalFields,
      completion_percentage: completionPercentage,
      llm_responses: llmResponses,
      conflicts: arbitrationResult.conflicts,
      validation_failures: arbitrationResult.validationFailures,
      llm_quorum_fields: arbitrationResult.llmQuorumFields,
      single_source_warnings: arbitrationResult.singleSourceWarnings
    });

  } catch (error) {
    // Even on error/timeout, send whatever data was collected
    try {
      const partialResult = arbitrationPipeline.getResult();
      const partialFields = Object.keys(partialResult.fields).length;

      if (partialFields > 0) {
        // Send partial data with error flag so frontend knows it's incomplete
        sendEvent(res, 'complete', {
          success: false,
          partial: true,
          error: String(error),
          address: searchAddress,
          fields: partialResult.fields,
          total_fields_found: partialFields,
          completion_percentage: Math.round((partialFields / 138) * 100),
          llm_responses: llmResponses,
          conflicts: partialResult.conflicts,
          validation_failures: partialResult.validationFailures,
          llm_quorum_fields: partialResult.llmQuorumFields,
          single_source_warnings: partialResult.singleSourceWarnings
        });
      } else {
        sendEvent(res, 'error', { error: String(error) });
      }
    } catch (e) {
      sendEvent(res, 'error', { error: String(error) });
    }
  }

  res.end();
}
