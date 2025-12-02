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
import { TOTAL_FIELDS } from '../../src/types/fields-schema.js';

// Vercel serverless config - Pro plan allows 60s
export const config = {
  maxDuration: 55, // 55s with buffer for response
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
  isValidAddress,
  safeGet
} from '../../src/lib/safe-json-parse.js';

// Use shared field mapping from field-map-flat-to-numbered.ts
// HOA monthly→annual conversion and field mapping are handled in the shared module

/**
 * Wrapper for shared mapFlatFieldsToNumbered that also handles HOA fee conversion
 */
function mapFlatFieldsToNumbered(fields: Record<string, any>, source: string): Record<string, any> {
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
          source: fieldData?.source || source,
          confidence: fieldData?.confidence || 'Medium',
        };
        console.log(`[${source}] Converted monthly HOA fee $${rawValue} to annual $${annualValue}`);
      }
    } else {
      convertedFields[key] = fieldData;
    }
  }
  
  // Now use the shared mapping function
  return sharedMapFlatFieldsToNumbered(convertedFields, source);
}

// Helper to count only non-null, non-empty fields
function countValidFields(fields: Record<string, any>): number {
  return Object.values(fields).filter(field => {
    if (!field) return false;
    const value = field.value !== undefined ? field.value : field;
    // Exclude null, undefined, empty string, "N/A", "Unknown", etc.
    if (value === null || value === undefined || value === '') return false;
    const strVal = String(value).toLowerCase().trim();
    return strVal !== 'n/a' && strVal !== 'na' && strVal !== 'unknown' && strVal !== 'not available' && strVal !== 'none';
  }).length;
}

// SSE helper to send events
function sendEvent(res: VercelResponse, event: string, data: any) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// LLM Call Functions
async function callPerplexity(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  console.log('[SEARCH-STREAM][PERPLEXITY] API key present:', !!apiKey, 'length:', apiKey?.length || 0);
  if (!apiKey) {
    const envKeys = Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY'));
    console.log('[SEARCH-STREAM][PERPLEXITY] Available API/KEY env vars:', envKeys);
    return { error: 'API key not set', fields: {} };
  }

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
      const parseResult = extractAndParseJson<Record<string, any>>(text, 'PERPLEXITY');
      if (parseResult.success && parseResult.data) {
        const parsed = parseResult.data;
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
      const parseResult = extractAndParseJson<Record<string, any>>(text, 'GROK');
      if (parseResult.success && parseResult.data) {
        const parsed = parseResult.data;
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
      // Use safe JSON parsing with extraction
      const parseResult = extractAndParseJson<Record<string, any>>(text, 'CLAUDE OPUS');

      if (parseResult.success && parseResult.data) {
        const parsed = parseResult.data;
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
      const parseResult = extractAndParseJson<Record<string, any>>(text, 'GPT');
      if (parseResult.success && parseResult.data) {
        const parsed = parseResult.data;
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
      const parseResult = extractAndParseJson<Record<string, any>>(text, 'CLAUDE SONNET');
      if (parseResult.success && parseResult.data) {
        const parsed = parseResult.data;
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
      const parseResult = extractAndParseJson<Record<string, any>>(text, 'GEMINI');
      if (parseResult.success && parseResult.data) {
        const parsed = parseResult.data;
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
    address: rawAddress,
    url,
    engines = ['perplexity', 'grok', 'claude-opus', 'gpt', 'claude-sonnet', 'gemini'],  // All 6 LLMs in parallel
    skipLLMs = false,
    existingFields = {},  // Previously accumulated fields from prior LLM calls
    skipApis = false,  // Skip free APIs if we already have their data
  } = req.body;

  // Sanitize address input to prevent prompt injection and normalize
  const address = sanitizeAddress(rawAddress);

  if (!address && !url) {
    return res.status(400).json({ error: 'Address or URL required' });
  }

  // Validate address looks reasonable
  if (address && !isValidAddress(address)) {
    return res.status(400).json({ error: 'Invalid address format' });
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

    const API_TIMEOUT = 25000; // 25s per API call (HowLoud can be slow)
    const LLM_TIMEOUT = 52000; // 52s per LLM call (Claude Opus/Sonnet need extra time)
    const startTime = Date.now();
    const DEADLINE = 54000; // 54s hard deadline (Vercel set to 55s)

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
    // SPECIAL CASE: URL mode - Run Perplexity first to extract address
    // ========================================
    let extractedAddress = searchAddress;
    let perplexityAlreadyRan = false;

    if (url && !skipLLMs && engines.includes('perplexity')) {
      console.log('[URL MODE] Running Perplexity first to extract address from URL');
      sendEvent(res, 'progress', { source: 'perplexity', status: 'searching', message: 'Extracting address from URL...' });
      perplexityAlreadyRan = true;

      try {
        const perplexityResult = await withTimeout(
          callPerplexity(url),
          LLM_TIMEOUT,
          { fields: {}, error: 'timeout' }
        );

        const perplexityFields = perplexityResult.fields || perplexityResult;
        const rawFieldCount = Object.keys(perplexityFields || {}).length;
        const newFields = arbitrationPipeline.addFieldsFromSource(perplexityFields || {}, 'Perplexity');

        // Extract the address from Perplexity's response
        const fullAddressField = perplexityFields['1_full_address']?.value || perplexityFields['address_identity_full_address']?.value;
        if (fullAddressField) {
          extractedAddress = fullAddressField;
          console.log(`[URL MODE] Perplexity extracted address: ${extractedAddress}`);
        }

        sendEvent(res, 'progress', {
          source: 'perplexity',
          status: perplexityResult.error ? 'error' : 'complete',
          fieldsFound: rawFieldCount,
          newUniqueFields: newFields,
          totalFieldsSoFar: arbitrationPipeline.getFieldCount(),
          currentFields: arbitrationPipeline.getResult().fields,
          error: perplexityResult.error
        });
      } catch (e) {
        console.error('[URL MODE] Perplexity error:', e);
        sendEvent(res, 'progress', { source: 'perplexity', status: 'error', fieldsFound: 0, error: String(e) });
      }
    }

    // ========================================
    // TIER 2: GOOGLE GEOCODE (must run first for lat/lon)
    // Skip if we already have API data from previous session
    // Uses extracted address from Perplexity in URL mode
    // ========================================
    let lat: number | undefined;
    let lon: number | undefined;

    if (!skipApis) {
      sendEvent(res, 'progress', { source: 'google-geocode', status: 'searching', message: 'Geocoding address...' });

      try {
        const geoResult = await withTimeout(
          callGoogleGeocode(extractedAddress),
          API_TIMEOUT,
          { ...createFallback('Google Geocode'), lat: undefined, lon: undefined, county: '', zip: '' }
        );
        const newFields = arbitrationPipeline.addFieldsFromSource(geoResult.fields, 'Google Geocode');
        lat = geoResult.lat;
        lon = geoResult.lon;

        // DEBUG: Log geocode results to investigate why free APIs aren't running
        console.log(`[GEOCODE] Address: "${extractedAddress}" → lat: ${lat}, lon: ${lon}, success: ${geoResult.success}`);

        sendEvent(res, 'progress', {
          source: 'google-geocode',
          status: geoResult.success ? 'complete' : 'error',
          fieldsFound: newFields,
          totalFieldsSoFar: arbitrationPipeline.getFieldCount(),
          currentFields: arbitrationPipeline.getResult().fields,  // 🔥 FIX: Send accumulated fields
          error: geoResult.error,
          message: lat && lon ? `Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}` : 'No coordinates'
        });
      } catch (e) {
        console.log(`[GEOCODE] Error:`, e);
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
    console.log(`[FREE APIs] skipApis=${skipApis}, lat=${lat}, lon=${lon}, hasTime()=${hasTime()}`);

    if (!skipApis && lat && lon && hasTime()) {
      console.log(`[FREE APIs] ✅ Running all free APIs (WalkScore, Crime, HowLoud, etc.)`);
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
            currentFields: arbitrationPipeline.getResult().fields,  // 🔥 FIX: Send accumulated fields
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
        // Skip Perplexity if it already ran in URL mode
        const enabledLlms = [
          { id: 'perplexity', fn: callPerplexity, name: 'Perplexity', enabled: engines.includes('perplexity') && !perplexityAlreadyRan },
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
          } else if (id === 'perplexity' && perplexityAlreadyRan) {
            sendEvent(res, 'progress', { source: id, status: 'skipped', fieldsFound: 0, message: 'Already ran for URL extraction' });
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

          // Process results SEQUENTIALLY to ensure consistent ordering
          console.log(`\n=== Processing ${llmResults.length} LLM results in sequence ===`);

          for (let idx = 0; idx < llmResults.length; idx++) {
            const result = llmResults[idx];
            const llm = enabledLlms[idx];
            const processingOrder = idx + 1;

            console.log(`[${processingOrder}/${llmResults.length}] Processing ${llm.id}...`);

            if (result.status === 'fulfilled') {
              const data = result.value;
              // Handle both formats: Perplexity returns fields directly, others return { fields: ... }
              const llmFields = data.fields || data;
              const rawFieldCount = Object.keys(llmFields || {}).length;
              const newUniqueFields = arbitrationPipeline.addFieldsFromSource(llmFields || {}, llm.name);

              llmResponses.push({
                llm: llm.id,
                fields_found: rawFieldCount,
                new_unique_fields: newUniqueFields,
                success: !data.error
              });

              console.log(`✅ [${processingOrder}] ${llm.id}: ${rawFieldCount} returned, ${newUniqueFields} new unique (total: ${arbitrationPipeline.getFieldCount()})`);

              // 🔥 FIX: Send current accumulated fields so frontend can save incrementally
              const currentAccumulatedFields = arbitrationPipeline.getResult().fields;

              sendEvent(res, 'progress', {
                source: llm.id,
                status: data.error ? 'error' : 'complete',
                fieldsFound: rawFieldCount,
                newUniqueFields: newUniqueFields,
                totalFieldsSoFar: arbitrationPipeline.getFieldCount(),
                currentFields: currentAccumulatedFields,  // Send ALL accumulated fields so far
                error: data.error
              });
            } else {
              console.error(`❌ [${processingOrder}] ${llm.id} promise rejected:`, result.reason);
              sendEvent(res, 'progress', { source: llm.id, status: 'error', fieldsFound: 0, newUniqueFields: 0, totalFieldsSoFar: arbitrationPipeline.getFieldCount(), error: 'Failed' });
              llmResponses.push({ llm: llm.id, fields_found: 0, new_unique_fields: 0, success: false });
            }
          }

          console.log(`=== LLM processing complete. Total fields: ${arbitrationPipeline.getFieldCount()} ===\n`);
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
    const totalFields = countValidFields(arbitrationResult.fields);  // Only count non-null/non-empty
    const completionPercentage = Math.round((totalFields / TOTAL_FIELDS) * 100);

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
      const partialFields = countValidFields(partialResult.fields);  // Only count non-null/non-empty

      if (partialFields > 0) {
        // Send partial data with error flag so frontend knows it's incomplete
        sendEvent(res, 'complete', {
          success: false,
          partial: true,
          error: String(error),
          address: searchAddress,
          fields: partialResult.fields,
          total_fields_found: partialFields,
          completion_percentage: Math.round((partialFields / TOTAL_FIELDS) * 100),
          llm_responses: llmResponses,
          conflicts: partialResult.conflicts,
          validation_failures: partialResult.validationFailures,
          llm_quorum_fields: partialResult.llmQuorumFields,
          single_source_warnings: partialResult.singleSourceWarnings
        });
      } else {
        // Send well-formed error event with consistent structure
        sendEvent(res, 'error', { 
          error: String(error),
          timestamp: new Date().toISOString(),
          address: searchAddress,
        });
      }
    } catch (innerError) {
      // Final fallback - ensure error event is always sent
      console.error('[STREAMING] Error in error handler:', innerError);
      try {
        sendEvent(res, 'error', { 
          error: String(error),
          innerError: String(innerError),
          timestamp: new Date().toISOString(),
        });
      } catch (writeError) {
        // Stream may be closed, just log
        console.error('[STREAMING] Failed to write error event:', writeError);
      }
    }
  } finally {
    // Always ensure stream is properly closed
    try {
      res.end();
    } catch (endError) {
      console.error('[STREAMING] Error ending response:', endError);
    }
  }
}
