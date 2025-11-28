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

  const systemPrompt = `You are Grok, built by xAI, with access to advanced tools for web searching, browsing pages, and verifying real-time data. Your primary goal is accuracy—do not hallucinate, guess, or use outdated internal knowledge. Always use your tools to fetch and cross-verify data from multiple reliable sources. Prioritize official sources like county property appraisers, MLS listings via aggregators (Zillow, Redfin, Realtor.com), and government sites.

CRITICAL RULES:
- ONLY include fields you can verify. OMIT any field you cannot determine.
- Do NOT include null, N/A, "unknown", or empty values - simply leave those fields out.
- Return JSON ONLY, no markdown, no backticks, no explanation.
- Use numeric types for monetary values (no $ or commas).

Return a JSON object with this EXACT nested structure (include only fields with verified data):

{
  "address_identity": {
    "full_address": "<string>",
    "city": "<string>",
    "state": "<string>",
    "zip_code": "<string>",
    "county": "<string>",
    "neighborhood": "<string>",
    "parcel_id": "<string>",
    "mls_primary": "<string>"
  },
  "pricing_value": {
    "listing_status": "<Active|Pending|Closed|OffMarket>",
    "listing_price": <number>,
    "price_per_sq_ft": <number>,
    "listing_date": "<YYYY-MM-DD>",
    "market_value_estimate": <number>,
    "last_sale_date": "<YYYY-MM-DD>",
    "last_sale_price": <number>,
    "assessed_value": <number>,
    "zestimate": <number>
  },
  "property_basics": {
    "property_type": "<Single Family|Condo|Townhouse|Multi-Family>",
    "bedrooms": <number>,
    "full_bathrooms": <number>,
    "half_bathrooms": <number>,
    "total_bathrooms": <number>,
    "living_sq_ft": <number>,
    "lot_size_sq_ft": <number>,
    "year_built": <number>,
    "stories": <number>,
    "garage_spaces": <number>
  },
  "hoa_taxes": {
    "hoa": <true|false>,
    "hoa_fee_annual": <number>,
    "annual_taxes": <number>,
    "tax_year": <number>
  },
  "structure_systems": {
    "roof_type": "<string>",
    "exterior_material": "<string>",
    "foundation": "<string>",
    "hvac_type": "<string>"
  },
  "exterior_features": {
    "pool": <true|false>,
    "pool_type": "<string>",
    "waterfront": "<string>",
    "view": "<string>"
  },
  "schools_scores": {
    "school_district": "<string>",
    "elementary_school_name": "<string>",
    "elementary_school_rating": <number>,
    "walk_score": <number>,
    "transit_score": <number>,
    "bike_score": <number>
  },
  "market_investment": {
    "median_home_price_neighborhood": <number>,
    "avg_days_on_market": <number>,
    "insurance_estimate_annual": <number>,
    "rental_estimate_monthly": <number>
  },
  "environment_risk": {
    "flood_zone_code": "<string>",
    "flood_risk_level": "<Low|Moderate|High>",
    "hurricane_risk": "<Low|Moderate|High>",
    "elevation_feet": <number>
  }
}`;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4',
        max_tokens: 8000,
        temperature: 0.1,
        search_parameters: { mode: 'auto' },  // Enable live web search
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Search and verify property data for: ${address}. Cross-reference multiple sources. Return JSON only.` }
        ],
      }),
    });

    const data = await response.json();

    console.log('[GROK] Status:', response.status);
    console.log('[GROK] Full response:', JSON.stringify(data).slice(0, 1000));

    if (data.error) {
      console.log('[GROK] API Error:', data.error);
      return { error: `Grok API error: ${JSON.stringify(data.error)}`, fields: {} };
    }

    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      console.log('[GROK] Content (first 500 chars):', text.slice(0, 500));

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const fields: Record<string, any> = {};

          // Flatten nested structure into fields (same as Perplexity)
          const flattenObject = (obj: any, prefix = '') => {
            for (const [key, value] of Object.entries(obj)) {
              const strVal = String(value).toLowerCase().trim();
              const isBadValue = strVal === '' || strVal === 'null' || strVal === 'undefined' || strVal === 'n/a' || strVal === 'na' || strVal === 'nan' || strVal === 'unknown' || strVal === 'not available' || strVal === 'not found' || strVal === 'none' || strVal === '-' || strVal === '--' || strVal === 'tbd' || (typeof value === 'number' && isNaN(value));
              if (!isBadValue) {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                  flattenObject(value, prefix + key + '_');
                } else {
                  fields[prefix + key] = {
                    value: value,
                    source: 'Grok (Web Search)',
                    confidence: 'Medium'
                  };
                }
              }
            }
          };
          flattenObject(parsed);

          console.log('[GROK] Fields found:', Object.keys(fields).length);
          return { fields };
        } catch (parseError) {
          console.log('[GROK] JSON parse error:', parseError);
          return { error: `JSON parse error: ${parseError}`, fields: {} };
        }
      } else {
        return { error: `No JSON. Preview: ${text.slice(0, 200)}`, fields: {} };
      }
    } else {
      return { error: `No content. Keys: ${Object.keys(data.choices?.[0]?.message || {}).join(",")}`, fields: {} };
    }
  } catch (error) {
    return { error: String(error), fields: {} };
  }
}

async function callClaudeOpus(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: 'API key not set', fields: {} };

  const prompt = `You are a real estate data assistant. Based on your knowledge, provide property data estimates for this address: ${address}

CRITICAL: Return JSON with this EXACT nested structure. Only include fields you have reasonable confidence about. OMIT any field you cannot estimate. Use numeric types for numbers (no $ or commas).

{
  "address_identity": {
    "full_address": "<string>",
    "city": "<string>",
    "state": "<string>",
    "zip_code": "<string>",
    "county": "<string>",
    "neighborhood": "<string>"
  },
  "pricing_value": {
    "market_value_estimate": <number>,
    "assessed_value": <number>
  },
  "property_basics": {
    "property_type": "<Single Family|Condo|Townhouse|Multi-Family>",
    "bedrooms": <number>,
    "total_bathrooms": <number>,
    "living_sq_ft": <number>,
    "year_built": <number>
  },
  "hoa_taxes": {
    "annual_taxes": <number>,
    "property_tax_rate_percent": <number>
  },
  "schools_scores": {
    "school_district": "<string>",
    "walk_score": <number>
  },
  "market_investment": {
    "median_home_price_neighborhood": <number>,
    "avg_days_on_market": <number>,
    "insurance_estimate_annual": <number>,
    "rental_estimate_monthly": <number>
  },
  "environment_risk": {
    "flood_risk_level": "<Low|Moderate|High>",
    "hurricane_risk": "<Low|Moderate|High>"
  }
}

Return ONLY the JSON object, no explanation.`;

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
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    console.log('[CLAUDE OPUS 4.5] Status:', response.status, '| Response:', JSON.stringify(data).slice(0, 500));

    if (data.content?.[0]?.text) {
      const text = data.content[0].text;
      console.log('[CLAUDE OPUS 4.5] Text:', text.slice(0, 500));
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const fields: Record<string, any> = {};

        // Flatten nested structure into fields (same as Perplexity)
        const flattenObject = (obj: any, prefix = '') => {
          for (const [key, value] of Object.entries(obj)) {
            const strVal = String(value).toLowerCase().trim();
            const isBadValue = strVal === '' || strVal === 'null' || strVal === 'undefined' || strVal === 'n/a' || strVal === 'na' || strVal === 'nan' || strVal === 'unknown' || strVal === 'not available' || strVal === 'not found' || strVal === 'none' || strVal === '-' || strVal === '--' || strVal === 'tbd' || (typeof value === 'number' && isNaN(value));
            if (!isBadValue) {
              if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                flattenObject(value, prefix + key + '_');
              } else {
                fields[prefix + key] = {
                  value: value,
                  source: 'Claude Opus 4.5',
                  confidence: 'Medium'
                };
              }
            }
          }
        };
        flattenObject(parsed);

        console.log('[CLAUDE OPUS 4.5] Fields found:', Object.keys(fields).length);
        return { fields };
      }
    }
    return { error: 'Failed to parse response', fields: {} };
  } catch (error) {
    console.log('[CLAUDE OPUS 4.5] Error:', String(error));
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

  const systemPrompt = `***SYSTEM INSTRUCTION: ACT AS GRAND MASTER REAL ESTATE ANALYST***

**ROLE:**
You are the world's leading Real Estate Forensic Data Analyst and Investment Strategist, specializing in the Florida Gulf Coast luxury market. You have access to real-time listing data, county property appraiser records, FEMA flood maps, and investment modeling tools.

**OBJECTIVE:**
Analyze the property at: ${address}
Provide comprehensive property data with verified information from authoritative sources.

**YOUR MISSION:**
1. **VERIFY DATA:** Use county property appraiser methodology to verify Year Built, HOA Fees, and construction details.
2. **FILL GAPS:** If exact unit data is unavailable, use building-specific averages.
3. **CALCULATE METRICS:** Generate investment numbers (Cap Rate, Cash-on-Cash) based on 20% down payment and current Florida coastal insurance rates.

**CRITICAL DATA POINTS:**
* **Building Identity:** Confirm the building name and get accurate amenities.
* **HOA Fee:** Verify monthly/annual HOA for this unit type.
* **Insurance:** Estimate annual hazard + flood insurance for waterfront properties.
* **Rental Yield:** Estimate monthly rental income for long-term vs. seasonal rental.

**CRITICAL RULES:**
- ONLY include fields you can verify or reasonably estimate. OMIT any field you cannot determine.
- Do NOT include null, N/A, "unknown", or empty values - simply leave those fields out.
- Return JSON ONLY, no markdown, no backticks, no explanation.

**REQUIRED OUTPUT FORMAT:**
Return a JSON object with this EXACT nested structure. Only include fields you have data for:

{
  "address_identity": {
    "full_address": "<string>",
    "city": "<string>",
    "state": "<string>",
    "zip": "<string>",
    "county": "<string>",
    "neighborhood": "<string>"
  },
  "pricing_value": {
    "listing_status": "<Active|Pending|Closed|OffMarket>",
    "listing_price": <number>,
    "estimated_market_value": <number>,
    "price_per_sqft": <number>,
    "zestimate": <number>,
    "redfin_estimate": <number>
  },
  "property_basics": {
    "property_type": "<Single Family|Condo|Townhouse|Multi-Family>",
    "bedrooms": <number>,
    "bathrooms": <number>,
    "sqft": <number>,
    "lot_size_sqft": <number>,
    "year_built": <number>,
    "stories": <number>
  },
  "building_construction": {
    "building_name": "<string>",
    "construction_type": "<string>",
    "roof_type": "<string>",
    "exterior_material": "<string>",
    "foundation": "<string>",
    "parking_type": "<string>",
    "garage_spaces": <number>
  },
  "tax_financial": {
    "tax_annual": <number>,
    "tax_year": <number>,
    "hoa_monthly": <number>,
    "hoa_includes": "<string>",
    "cdd_fee": <number>,
    "special_assessments": "<string>"
  },
  "risk_environmental": {
    "flood_zone": "<string>",
    "flood_risk": "<Low|Medium|High>",
    "hurricane_risk": "<Low|Medium|High>",
    "sinkhole_risk": "<Low|Medium|High>",
    "elevation_ft": <number>
  },
  "investment_metrics": {
    "est_insurance_annual": <number>,
    "est_monthly_rent_longterm": <number>,
    "est_monthly_rent_seasonal": <number>,
    "cap_rate_percent": <number>,
    "gross_rent_multiplier": <number>,
    "cash_on_cash_return": <number>,
    "monthly_cash_flow": <number>
  },
  "features_amenities": {
    "pool": "<string>",
    "waterfront": "<string>",
    "water_access": "<string>",
    "view": "<string>",
    "amenities": "<string>",
    "appliances": "<string>",
    "flooring": "<string>",
    "cooling": "<string>",
    "heating": "<string>"
  }
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { maxOutputTokens: 8000, temperature: 0.1 },
        }),
      }
    );

    const data = await response.json();
    console.log('[GEMINI] Status:', response.status);
    console.log('[GEMINI] Response keys:', Object.keys(data));

    if (data.error) {
      console.log('[GEMINI] API Error:', JSON.stringify(data.error));
      return { error: `Gemini API error: ${JSON.stringify(data.error)}`, fields: {} };
    }

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text;
      console.log('[GEMINI] Text (first 500 chars):', text.slice(0, 500));

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const fields: Record<string, any> = {};

          // Flatten nested structure into fields with category_fieldname format
          // This matches the format used by Perplexity, Grok, and Opus
          const flattenObject = (obj: any, prefix = '') => {
            for (const [key, value] of Object.entries(obj)) {
              if (value === null || value === undefined) continue;

              if (typeof value === 'object' && !Array.isArray(value)) {
                flattenObject(value, prefix + key + '_');
              } else {
                const strVal = String(value).toLowerCase().trim();
                const isBadValue = strVal === '' || strVal === 'null' || strVal === 'undefined' ||
                  strVal === 'n/a' || strVal === 'na' || strVal === 'nan' || strVal === 'unknown' ||
                  strVal === 'not available' || strVal === 'not found' || strVal === 'none' ||
                  strVal === '-' || strVal === '--' || strVal === 'tbd' ||
                  (typeof value === 'number' && isNaN(value));

                if (!isBadValue) {
                  fields[prefix + key] = {
                    value: value,
                    source: 'Gemini (Real Estate Analyst)',
                    confidence: 'Medium'
                  };
                }
              }
            }
          };

          flattenObject(parsed);
          console.log('[GEMINI] Fields found:', Object.keys(fields).length);
          return { fields };
        } catch (parseError) {
          console.log('[GEMINI] JSON parse error:', parseError);
          return { error: `JSON parse error: ${parseError}`, fields: {} };
        }
      } else {
        console.log('[GEMINI] No JSON found in response');
        return { error: `No JSON found. Preview: ${text.slice(0, 200)}`, fields: {} };
      }
    } else {
      console.log('[GEMINI] No candidates in response:', JSON.stringify(data).slice(0, 500));
      return { error: 'No response content from Gemini', fields: {} };
    }
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

    const API_TIMEOUT = 8000; // 8s per API call
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
            error: data.error
          });
        } else {
          sendEvent(res, 'progress', { source, status: 'error', fieldsFound: 0, error: 'Failed' });
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
                error: data.error
              });
            } else {
              sendEvent(res, 'progress', { source: llm.id, status: 'error', fieldsFound: 0, newUniqueFields: 0, error: 'Failed' });
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
