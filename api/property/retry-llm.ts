/**
 * CLUES Property Search - Retry with LLM Endpoint
 * Simple JSON endpoint for single-field LLM retry from PropertyDetail page
 *
 * This is a NON-STREAMING endpoint that returns JSON directly.
 * Used by the "Retry with LLM" button on individual fields.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

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

// Map flat LLM field names to numbered field keys (copied from search-stream.ts for isolation)
// CORRECTED: All field numbers now match fields-schema.ts (SOURCE OF TRUTH)
// Updated: 2025-11-30 - Fixed all field numbers + Added Stellar MLS fields (139-168)
const FLAT_TO_NUMBERED_FIELD_MAP: Record<string, string> = {
  // Address & Identity (1-9)
  'full_address': '1_full_address', 'address': '1_full_address',
  'mls_primary': '2_mls_primary', 'mls_number': '2_mls_primary',
  'mls_secondary': '3_mls_secondary',
  'listing_status': '4_listing_status', 'status': '4_listing_status',
  'listing_date': '5_listing_date',
  'neighborhood': '6_neighborhood', 'neighborhood_name': '6_neighborhood',
  'county': '7_county',
  'zip_code': '8_zip_code', 'zip': '8_zip_code',
  'parcel_id': '9_parcel_id', 'parcel': '9_parcel_id',

  // Pricing & Value (10-16)
  'listing_price': '10_listing_price', 'price': '10_listing_price', 'list_price': '10_listing_price',
  'price_per_sqft': '11_price_per_sqft', 'price_per_sq_ft': '11_price_per_sqft',
  'market_value_estimate': '12_market_value_estimate', 'market_value': '12_market_value_estimate', 'estimated_value': '12_market_value_estimate', 'zestimate': '12_market_value_estimate',
  'last_sale_date': '13_last_sale_date', 'sale_date': '13_last_sale_date',
  'last_sale_price': '14_last_sale_price', 'sale_price': '14_last_sale_price',
  'assessed_value': '15_assessed_value',
  'redfin_estimate': '16_redfin_estimate',

  // Property Basics (17-29)
  'bedrooms': '17_bedrooms', 'beds': '17_bedrooms',
  'full_bathrooms': '18_full_bathrooms', 'full_baths': '18_full_bathrooms',
  'half_bathrooms': '19_half_bathrooms', 'half_baths': '19_half_bathrooms',
  'total_bathrooms': '20_total_bathrooms', 'bathrooms': '20_total_bathrooms', 'baths': '20_total_bathrooms',
  'living_sqft': '21_living_sqft', 'living_sq_ft': '21_living_sqft', 'sqft': '21_living_sqft', 'square_feet': '21_living_sqft',
  'total_sqft_under_roof': '22_total_sqft_under_roof',
  'lot_size_sqft': '23_lot_size_sqft', 'lot_size_sq_ft': '23_lot_size_sqft', 'lot_sqft': '23_lot_size_sqft',
  'lot_size_acres': '24_lot_size_acres', 'lot_acres': '24_lot_size_acres',
  'year_built': '25_year_built', 'built': '25_year_built',
  'property_type': '26_property_type', 'type': '26_property_type',
  'stories': '27_stories', 'floors': '27_stories',
  'garage_spaces': '28_garage_spaces', 'garage': '28_garage_spaces',
  'parking_total': '29_parking_total', 'parking': '29_parking_total',

  // HOA & Taxes (30-38)
  'hoa_yn': '30_hoa_yn', 'hoa': '30_hoa_yn', 'has_hoa': '30_hoa_yn',
  'hoa_fee_annual': '31_hoa_fee_annual', 'hoa_fee': '31_hoa_fee_annual', 'hoa_fee_monthly': '31_hoa_fee_annual',
  'hoa_name': '32_hoa_name',
  'hoa_includes': '33_hoa_includes',
  'ownership_type': '34_ownership_type',
  'annual_taxes': '35_annual_taxes', 'taxes': '35_annual_taxes', 'property_taxes': '35_annual_taxes',
  'tax_year': '36_tax_year',
  'property_tax_rate': '37_property_tax_rate', 'property_tax_rate_percent': '37_property_tax_rate', 'tax_rate': '37_property_tax_rate',
  'tax_exemptions': '38_tax_exemptions',

  // Structure (39-48)
  'roof_type': '39_roof_type', 'roof': '39_roof_type',
  'roof_age_est': '40_roof_age_est', 'roof_age': '40_roof_age_est',
  'exterior_material': '41_exterior_material', 'exterior': '41_exterior_material',
  'foundation': '42_foundation',
  'water_heater_type': '43_water_heater_type',
  'garage_type': '44_garage_type',
  'hvac_type': '45_hvac_type', 'hvac': '45_hvac_type',
  'hvac_age': '46_hvac_age',
  'laundry_type': '47_laundry_type',
  'interior_condition': '48_interior_condition',

  // Interior (49-53)
  'flooring_type': '49_flooring_type', 'flooring': '49_flooring_type',
  'kitchen_features': '50_kitchen_features', 'kitchen': '50_kitchen_features',
  'appliances_included': '51_appliances_included', 'appliances': '51_appliances_included',
  'fireplace_yn': '52_fireplace_yn', 'fireplace': '52_fireplace_yn', 'has_fireplace': '52_fireplace_yn',
  'fireplace_count': '53_fireplace_count',

  // Exterior (54-58)
  'pool_yn': '54_pool_yn', 'pool': '54_pool_yn', 'has_pool': '54_pool_yn',
  'pool_type': '55_pool_type',
  'deck_patio': '56_deck_patio', 'patio': '56_deck_patio',
  'fence': '57_fence',
  'landscaping': '58_landscaping',

  // Permits (59-62)
  'recent_renovations': '59_recent_renovations', 'renovations': '59_recent_renovations',
  'permit_history_roof': '60_permit_history_roof',
  'permit_history_hvac': '61_permit_history_hvac',
  'permit_history_other': '62_permit_history_other',

  // Schools (63-73)
  'school_district': '63_school_district',
  'elevation_feet': '64_elevation_feet', 'elevation': '64_elevation_feet',
  'elementary_school': '65_elementary_school', 'assigned_elementary': '65_elementary_school', 'elementary_school_name': '65_elementary_school',
  'elementary_rating': '66_elementary_rating', 'elementary_school_rating': '66_elementary_rating',
  'elementary_distance': '67_elementary_distance_mi',
  'middle_school': '68_middle_school', 'assigned_middle': '68_middle_school', 'middle_school_name': '68_middle_school',
  'middle_rating': '69_middle_rating', 'middle_school_rating': '69_middle_rating',
  'middle_distance': '70_middle_distance_mi',
  'high_school': '71_high_school', 'assigned_high': '71_high_school', 'high_school_name': '71_high_school',
  'high_rating': '72_high_rating', 'high_school_rating': '72_high_rating',
  'high_distance': '73_high_distance_mi',

  // Scores (74-82)
  'walk_score': '74_walk_score', 'walkscore': '74_walk_score',
  'transit_score': '75_transit_score',
  'bike_score': '76_bike_score',
  'safety_score': '77_safety_score',
  'noise_level': '78_noise_level',
  'traffic_level': '79_traffic_level',
  'walkability_description': '80_walkability_description',
  'public_transit_access': '81_public_transit_access',
  'commute_time': '82_commute_to_city_center', 'commute_to_city_center': '82_commute_to_city_center',

  // Distances (83-87)
  'distance_grocery': '83_distance_grocery_mi', 'distance_grocery_mi': '83_distance_grocery_mi',
  'distance_hospital': '84_distance_hospital_mi', 'distance_hospital_mi': '84_distance_hospital_mi',
  'distance_airport': '85_distance_airport_mi', 'distance_airport_mi': '85_distance_airport_mi',
  'distance_park': '86_distance_park_mi', 'distance_park_mi': '86_distance_park_mi',
  'distance_beach': '87_distance_beach_mi', 'distance_beach_mi': '87_distance_beach_mi',

  // Safety (88-90)
  'crime_index_violent': '88_violent_crime_index', 'violent_crime_index': '88_violent_crime_index',
  'crime_index_property': '89_property_crime_index', 'property_crime_index': '89_property_crime_index',
  'neighborhood_safety_rating': '90_neighborhood_safety_rating',

  // Market (91-103)
  'median_home_price_neighborhood': '91_median_home_price_neighborhood', 'median_home_price': '91_median_home_price_neighborhood',
  'price_per_sqft_recent_avg': '92_price_per_sqft_recent_avg',
  'price_to_rent_ratio': '93_price_to_rent_ratio',
  'price_vs_median_percent': '94_price_vs_median_percent',
  'days_on_market_avg': '95_days_on_market_avg', 'days_on_market': '95_days_on_market_avg', 'avg_days_on_market': '95_days_on_market_avg',
  'inventory_surplus': '96_inventory_surplus',
  'insurance_est_annual': '97_insurance_est_annual', 'insurance_estimate': '97_insurance_est_annual', 'insurance_estimate_annual': '97_insurance_est_annual',
  'rental_estimate_monthly': '98_rental_estimate_monthly', 'rent_estimate': '98_rental_estimate_monthly', 'rental_estimate': '98_rental_estimate_monthly',
  'rental_yield_est': '99_rental_yield_est', 'rental_yield': '99_rental_yield_est', 'rental_yield_percent': '99_rental_yield_est',
  'vacancy_rate_neighborhood': '100_vacancy_rate_neighborhood', 'vacancy_rate': '100_vacancy_rate_neighborhood',
  'cap_rate_est': '101_cap_rate_est', 'cap_rate': '101_cap_rate_est', 'cap_rate_est_percent': '101_cap_rate_est',
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
  'internet_providers': '111_internet_providers_top3', 'internet_providers_top3': '111_internet_providers_top3',
  'max_internet_speed': '112_max_internet_speed',
  'fiber_available': '113_fiber_available',
  'cable_tv_provider': '114_cable_tv_provider',
  'cell_coverage_quality': '115_cell_coverage_quality', 'cell_coverage': '115_cell_coverage_quality',
  'emergency_services_distance': '116_emergency_services_distance',

  // Environment (117-130)
  'air_quality_index': '117_air_quality_index', 'aqi': '117_air_quality_index',
  'air_quality_grade': '118_air_quality_grade',
  'flood_zone': '119_flood_zone', 'flood_zone_code': '119_flood_zone',
  'flood_risk_level': '120_flood_risk_level', 'flood_risk': '120_flood_risk_level',
  'climate_risk': '121_climate_risk', 'climate_risk_summary': '121_climate_risk',
  'wildfire_risk': '122_wildfire_risk',
  'earthquake_risk': '123_earthquake_risk',
  'hurricane_risk': '124_hurricane_risk',
  'tornado_risk': '125_tornado_risk',
  'radon_risk': '126_radon_risk',
  'superfund_nearby': '127_superfund_site_nearby', 'superfund_site_nearby': '127_superfund_site_nearby',
  'sea_level_rise_risk': '128_sea_level_rise_risk',
  'noise_level_db_est': '129_noise_level_db_est', 'noise_level_db': '129_noise_level_db_est',
  'solar_potential': '130_solar_potential',

  // Additional (131-138)
  'view_type': '131_view_type',
  'lot_features': '132_lot_features',
  'ev_charging': '133_ev_charging', 'ev_charging_yn': '133_ev_charging',
  'smart_home_features': '134_smart_home_features',
  'accessibility_modifications': '135_accessibility_modifications', 'accessibility_mods': '135_accessibility_modifications',
  'pet_policy': '136_pet_policy',
  'age_restrictions': '137_age_restrictions',
  'special_assessments': '138_special_assessments',

  // Location extras (keep for parsing)
  'city': 'city', 'state': 'state',
  'latitude': 'latitude', 'lat': 'latitude',
  'longitude': 'longitude', 'lng': 'longitude', 'lon': 'longitude',

  // ================================================================
  // STELLAR MLS FIELDS (139-168) - Added 2025-11-30
  // ================================================================

  // Stellar MLS - Parking (139-143)
  'carport_yn': '139_carport_yn', 'carport': '139_carport_yn', 'has_carport': '139_carport_yn',
  'carport_spaces': '140_carport_spaces',
  'garage_attached_yn': '141_garage_attached_yn', 'garage_attached': '141_garage_attached_yn', 'attached_garage': '141_garage_attached_yn',
  'parking_features': '142_parking_features',
  'assigned_parking_spaces': '143_assigned_parking_spaces', 'assigned_parking': '143_assigned_parking_spaces',

  // Stellar MLS - Building (144-148)
  'floor_number': '144_floor_number', 'floor': '144_floor_number', 'unit_floor': '144_floor_number',
  'building_total_floors': '145_building_total_floors', 'total_floors': '145_building_total_floors', 'building_floors': '145_building_total_floors',
  'building_name_number': '146_building_name_number', 'building_name': '146_building_name_number', 'building_number': '146_building_name_number',
  'building_elevator_yn': '147_building_elevator_yn', 'elevator': '147_building_elevator_yn', 'has_elevator': '147_building_elevator_yn',
  'floors_in_unit': '148_floors_in_unit', 'unit_floors': '148_floors_in_unit',

  // Stellar MLS - Legal (149-154)
  'subdivision_name': '149_subdivision_name', 'subdivision': '149_subdivision_name',
  'legal_description': '150_legal_description', 'legal': '150_legal_description',
  'homestead_yn': '151_homestead_yn', 'homestead': '151_homestead_yn', 'homestead_exemption': '151_homestead_yn',
  'cdd_yn': '152_cdd_yn', 'cdd': '152_cdd_yn', 'has_cdd': '152_cdd_yn',
  'annual_cdd_fee': '153_annual_cdd_fee', 'cdd_fee': '153_annual_cdd_fee',
  'front_exposure': '154_front_exposure', 'exposure': '154_front_exposure', 'facing': '154_front_exposure',

  // Stellar MLS - Waterfront (155-159)
  'water_frontage_yn': '155_water_frontage_yn', 'waterfront': '155_water_frontage_yn', 'is_waterfront': '155_water_frontage_yn',
  'waterfront_feet': '156_waterfront_feet', 'water_frontage_feet': '156_waterfront_feet',
  'water_access_yn': '157_water_access_yn', 'water_access': '157_water_access_yn', 'has_water_access': '157_water_access_yn',
  'water_view_yn': '158_water_view_yn', 'water_view': '158_water_view_yn', 'has_water_view': '158_water_view_yn',
  'water_body_name': '159_water_body_name', 'water_name': '159_water_body_name', 'body_of_water': '159_water_body_name',

  // Stellar MLS - Leasing (160-165)
  'can_be_leased_yn': '160_can_be_leased_yn', 'can_lease': '160_can_be_leased_yn', 'leasable': '160_can_be_leased_yn',
  'minimum_lease_period': '161_minimum_lease_period', 'min_lease': '161_minimum_lease_period', 'lease_minimum': '161_minimum_lease_period',
  'lease_restrictions_yn': '162_lease_restrictions_yn', 'lease_restrictions': '162_lease_restrictions_yn',
  'pet_size_limit': '163_pet_size_limit', 'pet_limit': '163_pet_size_limit',
  'max_pet_weight': '164_max_pet_weight', 'pet_weight_limit': '164_max_pet_weight',
  'association_approval_yn': '165_association_approval_yn', 'association_approval': '165_association_approval_yn', 'hoa_approval': '165_association_approval_yn',

  // Stellar MLS - Features (166-168)
  'community_features': '166_community_features', 'community_amenities': '166_community_features',
  'interior_features': '167_interior_features', 'interior_amenities': '167_interior_features',
  'exterior_features': '168_exterior_features', 'exterior_amenities': '168_exterior_features',
};

function mapFlatFieldsToNumbered(fields: Record<string, any>): Record<string, any> {
  const mapped: Record<string, any> = {};
  for (const [key, fieldData] of Object.entries(fields)) {
    const lowerKey = key.toLowerCase();
    const numberedKey = FLAT_TO_NUMBERED_FIELD_MAP[lowerKey] || FLAT_TO_NUMBERED_FIELD_MAP[key] || key;
    mapped[numberedKey] = fieldData;
  }
  return mapped;
}

// Helper to extract JSON from markdown code blocks or raw text
function extractJSON(text: string): string | null {
  // First try to extract from markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  // Fall back to finding raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : null;
}

// LLM Call Functions (copied from search-stream.ts for isolation)
async function callPerplexity(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return { error: 'API key not set', fields: {} };

  const systemPrompt = `You are a real estate data extraction engine. Return ONLY a JSON object with property data for the given address. Include any fields you can verify from the web. Do NOT include null, N/A, or unknown values - simply omit fields you cannot verify. Return JSON only, no markdown.`;

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
          { role: 'user', content: `Extract all available property data for: ${address}` }
        ],
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const fields: Record<string, any> = {};
        const flattenObject = (obj: any, prefix = '') => {
          for (const [key, value] of Object.entries(obj)) {
            if (value !== null && value !== undefined && value !== '' && value !== 'N/A') {
              if (typeof value === 'object' && !Array.isArray(value)) {
                flattenObject(value, prefix + key + '_');
              } else {
                fields[prefix + key] = { value, source: 'Perplexity', confidence: 'Medium' };
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
    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const fields: Record<string, any> = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (value !== null && value !== undefined && value !== '' && value !== 'N/A') {
            fields[key] = { value, source: 'Grok', confidence: 'Medium' };
          }
        }
        return { fields };
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
    console.log('[CLAUDE OPUS] Status:', response.status, '| Response:', JSON.stringify(data).slice(0, 500));

    if (data.content?.[0]?.text) {
      const text = data.content[0].text;
      console.log('[CLAUDE OPUS] Text:', text.slice(0, 500));
      const jsonStr = extractJSON(text);
      console.log('[CLAUDE OPUS] Extracted JSON:', jsonStr?.slice(0, 300) || 'null');
      if (jsonStr) {
        try {
          const parsed = JSON.parse(jsonStr);
          const fields: Record<string, any> = {};
          // Handle both parsed.fields (wrapped) and parsed directly
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
          return { fields };
        } catch (parseError) {
          console.log('[CLAUDE OPUS] JSON.parse error:', String(parseError));
          return { error: `JSON parse error: ${String(parseError)}`, fields: {} };
        }
      }
    } else if (data.error) {
      console.log('[CLAUDE OPUS] API Error:', JSON.stringify(data.error));
      return { error: `API Error: ${data.error?.message || JSON.stringify(data.error)}`, fields: {} };
    }
    return { error: 'Failed to parse response', fields: {} };
  } catch (error) {
    console.log('[CLAUDE OPUS] Exception:', String(error));
    return { error: String(error), fields: {} };
  }
}

async function callGPT(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { error: 'API key not set', fields: {} };

  const prompt = `You are a real estate data assistant. Return a JSON object with property data estimates for: ${address}

Include fields like: property_type, city, state, county, neighborhood, zip_code, median_home_price_neighborhood, school_district, flood_risk_level, hurricane_risk, rental_estimate_monthly, insurance_estimate_annual, property_tax_rate_percent

Only include fields you have reasonable confidence about. Return ONLY the JSON object, no explanation.`;

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
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const fields: Record<string, any> = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (value !== null && value !== undefined && value !== '' && value !== 'N/A') {
            fields[key] = { value, source: 'GPT', confidence: 'Low' };
          }
        }
        return { fields };
      }
    }
    return { error: 'Failed to parse response', fields: {} };
  } catch (error) {
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
    if (data.content?.[0]?.text) {
      const text = data.content[0].text;
      const jsonStr = extractJSON(text);
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        const fields: Record<string, any> = {};
        // Handle both parsed.fields (wrapped) and parsed directly
        for (const [key, value] of Object.entries(parsed.fields || parsed)) {
          const strVal = String(value).toLowerCase().trim();
          const isBadValue = strVal === '' || strVal === 'null' || strVal === 'undefined' || strVal === 'n/a' || strVal === 'na' || strVal === 'unknown' || strVal === 'not available' || strVal === 'none';
          if (!isBadValue) {
            fields[key] = {
              value: (value as any)?.value !== undefined ? (value as any).value : value,
              source: 'Claude Sonnet',
              confidence: 'Low'
            };
          }
        }
        return { fields };
      }
    }
    return { error: 'Failed to parse response', fields: {} };
  } catch (error) {
    return { error: String(error), fields: {} };
  }
}

async function callGemini(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { error: 'API key not set', fields: {} };

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
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const fields: Record<string, any> = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (value !== null && value !== undefined && value !== '' && value !== 'N/A') {
            fields[key] = { value, source: 'Gemini', confidence: 'Medium' };
          }
        }
        return { fields };
      }
    }
    return { error: 'Failed to parse response', fields: {} };
  } catch (error) {
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

  const { address, engines = ['perplexity'] } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address required' });
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
    console.log(`[RETRY-LLM] Calling ${engineId} for: ${address} (timeout: ${LLM_TIMEOUT}ms)`);

    // Wrap LLM call with timeout to prevent hanging
    const result = await withTimeout(
      callFn(address),
      LLM_TIMEOUT,
      { fields: {}, error: `${engineId} timed out after ${LLM_TIMEOUT / 1000}s` }
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
