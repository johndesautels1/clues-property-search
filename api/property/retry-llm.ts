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
// Updated: 2025-11-30 - Added Stellar MLS fields (139-168)
const FLAT_TO_NUMBERED_FIELD_MAP: Record<string, string> = {
  'full_address': '1_full_address', 'address': '1_full_address',
  'mls_primary': '2_mls_primary', 'mls_number': '2_mls_primary',
  'mls_secondary': '3_mls_secondary',
  'listing_status': '4_listing_status', 'status': '4_listing_status',
  'listing_date': '5_listing_date',
  'parcel_id': '6_parcel_id', 'parcel': '6_parcel_id',
  'listing_price': '7_listing_price', 'price': '7_listing_price', 'list_price': '7_listing_price',
  'price_per_sqft': '8_price_per_sqft', 'price_per_sq_ft': '8_price_per_sqft',
  'market_value_estimate': '9_market_value_estimate', 'market_value': '9_market_value_estimate', 'estimated_value': '9_market_value_estimate',
  'last_sale_date': '10_last_sale_date', 'sale_date': '10_last_sale_date',
  'last_sale_price': '11_last_sale_price', 'sale_price': '11_last_sale_price',
  'bedrooms': '12_bedrooms', 'beds': '12_bedrooms',
  'full_bathrooms': '13_full_bathrooms', 'full_baths': '13_full_bathrooms',
  'half_bathrooms': '14_half_bathrooms', 'half_baths': '14_half_bathrooms',
  'total_bathrooms': '15_total_bathrooms', 'bathrooms': '15_total_bathrooms', 'baths': '15_total_bathrooms',
  'living_sqft': '16_living_sqft', 'living_sq_ft': '16_living_sqft', 'sqft': '16_living_sqft', 'square_feet': '16_living_sqft',
  'total_sqft_under_roof': '17_total_sqft_under_roof',
  'lot_size_sqft': '18_lot_size_sqft', 'lot_size_sq_ft': '18_lot_size_sqft', 'lot_sqft': '18_lot_size_sqft',
  'lot_size_acres': '19_lot_size_acres', 'lot_acres': '19_lot_size_acres',
  'year_built': '20_year_built', 'built': '20_year_built',
  'property_type': '21_property_type', 'type': '21_property_type',
  'stories': '22_stories', 'floors': '22_stories',
  'garage_spaces': '23_garage_spaces', 'garage': '23_garage_spaces',
  'parking_total': '24_parking_total', 'parking': '24_parking_total',
  'hoa_yn': '25_hoa_yn', 'hoa': '25_hoa_yn', 'has_hoa': '25_hoa_yn',
  'hoa_fee_annual': '26_hoa_fee_annual', 'hoa_fee': '26_hoa_fee_annual', 'hoa_fee_monthly': '26_hoa_fee_annual',
  'ownership_type': '27_ownership_type',
  'county': '28_county',
  'annual_taxes': '29_annual_taxes', 'taxes': '29_annual_taxes', 'property_taxes': '29_annual_taxes',
  'tax_year': '30_tax_year',
  'assessed_value': '31_assessed_value',
  'tax_exemptions': '32_tax_exemptions',
  'property_tax_rate': '33_property_tax_rate', 'property_tax_rate_percent': '33_property_tax_rate', 'tax_rate': '33_property_tax_rate',
  'recent_tax_history': '34_recent_tax_history',
  'special_assessments': '35_special_assessments',
  'roof_type': '36_roof_type', 'roof': '36_roof_type',
  'roof_age_est': '37_roof_age_est', 'roof_age': '37_roof_age_est',
  'exterior_material': '38_exterior_material', 'exterior': '38_exterior_material',
  'foundation': '39_foundation',
  'hvac_type': '40_hvac_type', 'hvac': '40_hvac_type',
  'hvac_age': '41_hvac_age',
  'flooring_type': '42_flooring_type', 'flooring': '42_flooring_type',
  'kitchen_features': '43_kitchen_features', 'kitchen': '43_kitchen_features',
  'appliances_included': '44_appliances_included', 'appliances': '44_appliances_included',
  'fireplace_yn': '45_fireplace_yn', 'fireplace': '45_fireplace_yn', 'has_fireplace': '45_fireplace_yn',
  'interior_condition': '46_interior_condition',
  'pool_yn': '47_pool_yn', 'pool': '47_pool_yn', 'has_pool': '47_pool_yn',
  'pool_type': '48_pool_type',
  'deck_patio': '49_deck_patio', 'patio': '49_deck_patio',
  'fence': '50_fence',
  'landscaping': '51_landscaping',
  'recent_renovations': '52_recent_renovations', 'renovations': '52_recent_renovations',
  'assigned_elementary': '56_assigned_elementary', 'elementary_school': '56_assigned_elementary', 'elementary_school_name': '56_assigned_elementary',
  'elementary_rating': '57_elementary_rating', 'elementary_school_rating': '57_elementary_rating',
  'assigned_middle': '59_assigned_middle', 'middle_school': '59_assigned_middle', 'middle_school_name': '59_assigned_middle',
  'middle_rating': '60_middle_rating', 'middle_school_rating': '60_middle_rating',
  'assigned_high': '62_assigned_high', 'high_school': '62_assigned_high', 'high_school_name': '62_assigned_high',
  'high_rating': '63_high_rating', 'high_school_rating': '63_high_rating',
  'school_district': '64_school_district',
  'walk_score': '65_walk_score', 'walkscore': '65_walk_score',
  'transit_score': '66_transit_score',
  'bike_score': '67_bike_score',
  'noise_level': '68_noise_level',
  'traffic_level': '69_traffic_level',
  'walkability_description': '70_walkability_description',
  'median_home_price_neighborhood': '81_median_home_price_neighborhood', 'median_home_price': '81_median_home_price_neighborhood',
  'avg_days_on_market': '83_days_on_market_avg', 'days_on_market': '83_days_on_market_avg',
  'rental_estimate_monthly': '85_rental_estimate_monthly', 'rent_estimate': '85_rental_estimate_monthly', 'rental_estimate': '85_rental_estimate_monthly',
  'rental_yield_est': '86_rental_yield_est', 'rental_yield': '86_rental_yield_est',
  'cap_rate_est': '88_cap_rate_est', 'cap_rate': '88_cap_rate_est',
  'insurance_estimate_annual': '89_insurance_est_annual', 'insurance_estimate': '89_insurance_est_annual', 'insurance_est_annual': '89_insurance_est_annual',
  'electric_provider': '92_electric_provider',
  'water_provider': '93_water_provider',
  'sewer_provider': '94_sewer_provider',
  'natural_gas': '95_natural_gas',
  'internet_providers': '96_internet_providers_top',
  'air_quality_index': '99_air_quality_index_current', 'aqi': '99_air_quality_index_current',
  'flood_zone': '100_flood_zone', 'flood_zone_code': '100_flood_zone',
  'flood_risk_level': '101_flood_risk_level', 'flood_risk': '101_flood_risk_level',
  'climate_risk_summary': '102_climate_risk_summary', 'hurricane_risk': '102_climate_risk_summary',
  'elevation_feet': '103_elevation_feet', 'elevation': '103_elevation_feet',
  'neighborhood': '27_neighborhood', 'neighborhood_name': '27_neighborhood',
  'city': 'city', 'state': 'state', 'zip_code': 'zip_code', 'zip': 'zip_code',
  'latitude': 'latitude', 'lat': 'latitude',
  'longitude': 'longitude', 'lng': 'longitude', 'lon': 'longitude',
  'zestimate': '9_market_value_estimate', 'redfin_estimate': '9_market_value_estimate',

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
