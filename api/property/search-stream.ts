/**
 * CLUES Property Search API - SSE Streaming Version
 * Real-time progress updates via Server-Sent Events
 *
 * DATA SOURCE ORDER (Most Reliable First):
 * Tier 1: Scrapers (Realtor.com, Zillow, Redfin)
 * Tier 2: Google APIs (Geocode, Places)
 * Tier 3: Free Reliable APIs (WalkScore, FEMA, SchoolDigger, AirDNA)
 * Tier 4: Other Free APIs (AirNow, HowLoud, Weather, Broadband, Crime)
 * Tier 5: LLMs (Perplexity, Grok, Claude, GPT, Gemini) - LAST RESORT
 *
 * RULES:
 * - Never store null values
 * - Most reliable source wins on conflicts
 * - Yellow warning for conflicts
 * - LLMs only fill gaps, never overwrite reliable data
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeZillow, scrapeRedfin, scrapeRealtor, type ScrapedField } from './scrapers';
import {
  callGoogleGeocode,
  callGooglePlaces,
  callWalkScore,
  callFemaFlood,
  callAirNow,
  callSchoolDigger,
  callAirDNA,
  callHowLoud,
  callBroadbandNow,
  callCrimeGrade,
  callWeather,
  type ApiField
} from './free-apis';
import { getFloridaLocalCrime } from './florida-crime-scraper';
import { callHudFairMarketRent } from './free-apis';

// Field type for storing values
interface FieldValue {
  value: any;
  source: string;
  confidence: 'High' | 'Medium' | 'Low';
}

// SSE helper to send events
function sendEvent(res: VercelResponse, event: string, data: any) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// Merge fields with reliability ordering - NEVER overwrite with less reliable source
function mergeFields(
  target: Record<string, FieldValue>,
  source: Record<string, FieldValue | ScrapedField | ApiField>,
  sourceReliability: number
): { newFields: number; conflicts: Array<{ field: string; existing: any; new: any }> } {
  let newFields = 0;
  const conflicts: Array<{ field: string; existing: any; new: any }> = [];

  for (const [key, field] of Object.entries(source)) {
    // Skip null/undefined/empty values - CRITICAL
    if (field.value === null || field.value === undefined || field.value === '') {
      continue;
    }

    if (!target[key]) {
      // Field doesn't exist - add it
      target[key] = {
        value: field.value,
        source: field.source,
        confidence: field.confidence as 'High' | 'Medium' | 'Low'
      };
      newFields++;
    } else {
      // Field exists - check for conflict
      const existingValue = JSON.stringify(target[key].value);
      const newValue = JSON.stringify(field.value);

      if (existingValue !== newValue) {
        // Conflict detected
        conflicts.push({
          field: key,
          existing: { value: target[key].value, source: target[key].source },
          new: { value: field.value, source: field.source }
        });
        // Don't overwrite - keep more reliable source
      }
    }
  }

  return { newFields, conflicts };
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
        model: 'llama-3.1-sonar-large-128k-online',
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
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) return { error: 'API key not set', fields: {} };

  const systemPrompt = `You are Grok, built by xAI, with access to advanced tools for web searching, browsing pages, and verifying real-time data. Your primary goal is accuracy—do not hallucinate, guess, or use outdated internal knowledge. Always use your tools to fetch and cross-verify data from multiple reliable sources. If data is unavailable or conflicting, note it explicitly. Prioritize official sources like county property appraisers, MLS listings via aggregators (Zillow, Redfin, Realtor.com), and government sites. Resolve conflicts by selecting the most consistent/recent value.

CRITICAL RULES:
- ONLY include fields you can verify. OMIT any field you cannot determine.
- Do NOT include null, N/A, "unknown", or empty values - simply leave those fields out.
- Return JSON ONLY, no markdown, no backticks, no explanation.
- Use numeric types for monetary values (no $ or commas).

For the property provided, retrieve and return as many of these fields as possible with accurate, verified data:

ADDRESS & IDENTITY:
- full_address, mls_primary, listing_status, listing_date, neighborhood, county, zip_code, parcel_id

PRICING & VALUE:
- listing_price, price_per_sqft, market_value_estimate, last_sale_date, last_sale_price, assessed_value, redfin_estimate, zestimate

PROPERTY BASICS:
- bedrooms, full_bathrooms, half_bathrooms, total_bathrooms, living_sqft, lot_size_sqft, year_built, property_type, stories, garage_spaces, parking_total

HOA & TAXES:
- hoa (true/false), hoa_fee_annual, hoa_fee_monthly, hoa_name, hoa_includes, annual_taxes, tax_year

STRUCTURE & SYSTEMS:
- roof_type, exterior_material, foundation, hvac_type, water_heater_type, laundry_type

INTERIOR FEATURES:
- flooring_type, kitchen_features, appliances_included, fireplace (true/false)

EXTERIOR FEATURES:
- pool (true/false), pool_type, deck_patio, waterfront, view

SCHOOLS:
- school_district, elementary_school_name, elementary_school_rating, middle_school_name, high_school_name

LOCATION SCORES:
- walk_score, transit_score, bike_score, walkability_description

MARKET & INVESTMENT:
- median_home_price_neighborhood, avg_days_on_market, insurance_estimate_annual, rental_estimate_monthly, cap_rate_percent

ENVIRONMENT & RISK:
- air_quality_index, flood_zone, flood_risk_level, hurricane_risk, elevation_feet

UTILITIES:
- electric_provider, water_provider, internet_providers, fiber_available (true/false)

Return a flat JSON object with these field names. Only include fields with verified data.`;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4-fast',
        max_tokens: 8000,
        temperature: 0.1,
        // Enable Live Search for real-time web data
        tools: [{ type: 'web_search' }],
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Search and verify property data for: ${address}. Cross-reference multiple sources. Return JSON only.` }
        ],
      }),
    });

    const data = await response.json();

    // Log Grok response for debugging
    console.log('[GROK] Status:', response.status, '| Citations:', data.citations?.length || 0, '| Error:', data.error || 'none');
    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const fields: Record<string, any> = {};
        for (const [key, value] of Object.entries(parsed)) {
          const strVal = String(value).toLowerCase().trim();
          const isBadValue = strVal === '' || strVal === 'null' || strVal === 'undefined' || strVal === 'n/a' || strVal === 'na' || strVal === 'nan' || strVal === 'unknown' || strVal === 'not available' || strVal === 'not found' || strVal === 'none' || strVal === '-' || strVal === '--' || strVal === 'tbd' || strVal === 'n\a' || (typeof value === 'number' && isNaN(value));
          if (!isBadValue) {
            fields[key] = {
              value: value,
              source: 'Grok (Web Search)',
              confidence: 'Medium'
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

async function callClaudeOpus(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: 'API key not set', fields: {} };

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
        messages: [{ role: 'user', content: `Extract VERIFIED property data for: ${address}. Return ONLY a JSON object. STRICT RULES: 1) Only include fields with REAL, VERIFIED values from actual data sources. 2) If you cannot find a specific data point, DO NOT include that field at all - no nulls, no "N/A", no "NaN", no "unknown", no estimates, no placeholders. 3) An empty {} is better than fake data. 4) Never guess or estimate values.` }],
      }),
    });

    const data = await response.json();
    if (data.content?.[0]?.text) {
      const text = data.content[0].text;
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
              source: 'Claude Opus',
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

async function callGPT(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { error: 'API key not set', fields: {} };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 8000,
        messages: [
          { role: 'system', content: 'Extract VERIFIED property data. Return ONLY a JSON object. STRICT RULES: 1) Only include fields with REAL, VERIFIED values. 2) If you cannot find a data point, DO NOT include that field - no nulls, no "N/A", no "NaN", no "unknown". 3) An empty {} is better than fake data. 4) Never guess.' },
          { role: 'user', content: `Property: ${address}` }
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
        for (const [key, value] of Object.entries(parsed.fields || parsed)) {
          const strVal = String(value).toLowerCase().trim();
          const isBadValue = strVal === '' || strVal === 'null' || strVal === 'undefined' || strVal === 'n/a' || strVal === 'na' || strVal === 'nan' || strVal === 'unknown' || strVal === 'not available' || strVal === 'not found' || strVal === 'none' || strVal === '-' || strVal === '--' || strVal === 'tbd' || strVal === 'n\a' || (typeof value === 'number' && isNaN(value));
          if (!isBadValue) {
            fields[key] = {
              value: (value as any)?.value !== undefined ? (value as any).value : value,
              source: 'GPT-4o',
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

async function callClaudeSonnet(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: 'API key not set', fields: {} };

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
        max_tokens: 8000,
        messages: [{ role: 'user', content: `Extract VERIFIED property data for: ${address}. Return ONLY a JSON object. STRICT RULES: 1) Only include fields with REAL, VERIFIED values. 2) If you cannot find a data point, DO NOT include that field - no nulls, no "N/A", no "NaN", no estimates. 3) An empty {} is better than fake data.` }],
      }),
    });

    const data = await response.json();
    if (data.content?.[0]?.text) {
      const text = data.content[0].text;
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
Return ONLY a valid JSON object. Include only fields with verified/estimated data:

{
  "7_listing_price": <number>,
  "8_estimated_market_value": <number>,
  "9_price_per_sqft": <number>,
  "10_zestimate": <number>,
  "12_bedrooms": <number>,
  "13_bathrooms": <number>,
  "14_sqft": <number>,
  "15_lot_size_sqft": <number>,
  "16_year_built": <number>,
  "17_property_type": "<string>",
  "18_building_name": "<string>",
  "19_stories": <number>,
  "20_construction": "<string>",
  "21_roof_type": "<string>",
  "22_exterior_material": "<string>",
  "23_foundation": "<string>",
  "30_tax_annual": <number>,
  "31_tax_year": <number>,
  "32_hoa_monthly": <number>,
  "33_hoa_includes": "<string>",
  "40_flood_zone": "<string>",
  "41_flood_risk": "<'Low' | 'Medium' | 'High'>",
  "42_hurricane_risk": "<'Low' | 'Medium' | 'High'>",
  "50_est_insurance_annual": <number>,
  "51_est_monthly_rent_longterm": <number>,
  "52_est_monthly_rent_seasonal": <number>,
  "53_cap_rate_percent": <number>,
  "54_gross_rent_multiplier": <number>,
  "60_pool": "<string>",
  "61_parking": "<string>",
  "62_waterfront": "<string>",
  "63_view": "<string>",
  "64_amenities": "<string>"
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
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
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const fields: Record<string, any> = {};
        for (const [key, value] of Object.entries(parsed)) {
          const strVal = String(value).toLowerCase().trim();
          const isBadValue = strVal === '' || strVal === 'null' || strVal === 'undefined' || strVal === 'n/a' || strVal === 'na' || strVal === 'nan' || strVal === 'unknown' || strVal === 'not available' || strVal === 'not found' || strVal === 'none' || strVal === '-' || strVal === '--' || strVal === 'tbd' || strVal === 'n\a' || (typeof value === 'number' && isNaN(value));
          if (!isBadValue) {
            fields[key] = {
              value: value,
              source: 'Gemini (Real Estate Analyst)',
              confidence: 'Medium'
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

  const {
    address,
    url,
    engines = ['perplexity', 'grok', 'claude-opus', 'gpt', 'claude-sonnet', 'gemini'],
    skipLLMs = false
  } = req.body;

  if (!address && !url) {
    return res.status(400).json({ error: 'Address or URL required' });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const allFields: Record<string, FieldValue> = {};
  const allConflicts: Array<{ field: string; values: Array<{ source: string; value: any }> }> = [];
  const llmResponses: any[] = [];

  // Extract ZPID if Zillow URL provided
  const zpid = url ? extractZpidFromUrl(url) : undefined;
  const searchAddress = address || url;

  try {
    // ========================================
    // TIER 1: WEB SCRAPERS (Most Reliable)
    // ========================================

    // 1a. Realtor.com
    sendEvent(res, 'progress', { source: 'realtor', status: 'searching', message: 'Scraping Realtor.com...' });
    try {
      const realtorResult = await scrapeRealtor(searchAddress);
      const { newFields, conflicts } = mergeFields(allFields, realtorResult.fields, 1);
      conflicts.forEach(c => allConflicts.push({ field: c.field, values: [c.existing, c.new] }));
      sendEvent(res, 'progress', {
        source: 'realtor',
        status: realtorResult.success ? 'complete' : 'error',
        fieldsFound: newFields,
        addressVerified: realtorResult.addressVerified,
        error: realtorResult.error
      });
    } catch (e) {
      sendEvent(res, 'progress', { source: 'realtor', status: 'error', fieldsFound: 0, error: String(e) });
    }

    // 1b. Zillow
    sendEvent(res, 'progress', { source: 'zillow', status: 'searching', message: 'Scraping Zillow...' });
    try {
      const zillowResult = await scrapeZillow(searchAddress, zpid);
      const { newFields, conflicts } = mergeFields(allFields, zillowResult.fields, 2);
      conflicts.forEach(c => allConflicts.push({ field: c.field, values: [c.existing, c.new] }));
      sendEvent(res, 'progress', {
        source: 'zillow',
        status: zillowResult.success ? 'complete' : 'error',
        fieldsFound: newFields,
        addressVerified: zillowResult.addressVerified,
        error: zillowResult.error
      });
    } catch (e) {
      sendEvent(res, 'progress', { source: 'zillow', status: 'error', fieldsFound: 0, error: String(e) });
    }

    // 1c. Redfin
    sendEvent(res, 'progress', { source: 'redfin', status: 'searching', message: 'Scraping Redfin...' });
    try {
      const redfinResult = await scrapeRedfin(searchAddress);
      const { newFields, conflicts } = mergeFields(allFields, redfinResult.fields, 3);
      conflicts.forEach(c => allConflicts.push({ field: c.field, values: [c.existing, c.new] }));
      sendEvent(res, 'progress', {
        source: 'redfin',
        status: redfinResult.success ? 'complete' : 'error',
        fieldsFound: newFields,
        addressVerified: redfinResult.addressVerified,
        error: redfinResult.error
      });
    } catch (e) {
      sendEvent(res, 'progress', { source: 'redfin', status: 'error', fieldsFound: 0, error: String(e) });
    }

    // ========================================
    // TIER 2: GOOGLE APIS
    // ========================================

    sendEvent(res, 'progress', { source: 'google-geocode', status: 'searching', message: 'Geocoding address...' });
    let lat: number | undefined;
    let lon: number | undefined;
    let county = '';
    let zip = '';

    try {
      const geoResult = await callGoogleGeocode(searchAddress);
      const { newFields, conflicts } = mergeFields(allFields, geoResult.fields, 4);
      conflicts.forEach(c => allConflicts.push({ field: c.field, values: [c.existing, c.new] }));

      lat = geoResult.lat;
      lon = geoResult.lon;
      county = geoResult.county || '';
      zip = geoResult.zip || '';

      sendEvent(res, 'progress', {
        source: 'google-geocode',
        status: geoResult.success ? 'complete' : 'error',
        fieldsFound: newFields,
        error: geoResult.error
      });
    } catch (e) {
      sendEvent(res, 'progress', { source: 'google-geocode', status: 'error', fieldsFound: 0, error: String(e) });
    }

    // Location-dependent APIs
    if (lat && lon) {
      // Google Places
      sendEvent(res, 'progress', { source: 'google-places', status: 'searching', message: 'Finding nearby amenities...' });
      try {
        const placesResult = await callGooglePlaces(lat, lon);
        const { newFields } = mergeFields(allFields, placesResult.fields, 5);
        sendEvent(res, 'progress', {
          source: 'google-places',
          status: placesResult.success ? 'complete' : 'error',
          fieldsFound: newFields,
          error: placesResult.error
        });
      } catch (e) {
        sendEvent(res, 'progress', { source: 'google-places', status: 'error', fieldsFound: 0, error: String(e) });
      }

      // ========================================
      // TIER 3: RELIABLE FREE APIS
      // ========================================

      // WalkScore
      sendEvent(res, 'progress', { source: 'walkscore', status: 'searching', message: 'Getting WalkScore...' });
      try {
        const walkResult = await callWalkScore(lat, lon, searchAddress);
        const { newFields } = mergeFields(allFields, walkResult.fields, 6);
        sendEvent(res, 'progress', {
          source: 'walkscore',
          status: walkResult.success ? 'complete' : 'error',
          fieldsFound: newFields,
          error: walkResult.error
        });
      } catch (e) {
        sendEvent(res, 'progress', { source: 'walkscore', status: 'error', fieldsFound: 0, error: String(e) });
      }

      // FEMA Flood
      sendEvent(res, 'progress', { source: 'fema', status: 'searching', message: 'Checking flood zones...' });
      try {
        const femaResult = await callFemaFlood(lat, lon);
        const { newFields } = mergeFields(allFields, femaResult.fields, 7);
        sendEvent(res, 'progress', {
          source: 'fema',
          status: femaResult.success ? 'complete' : 'error',
          fieldsFound: newFields,
          error: femaResult.error
        });
      } catch (e) {
        sendEvent(res, 'progress', { source: 'fema', status: 'error', fieldsFound: 0, error: String(e) });
      }

      // SchoolDigger
      sendEvent(res, 'progress', { source: 'schooldigger', status: 'searching', message: 'Getting school data...' });
      try {
        const schoolResult = await callSchoolDigger(lat, lon);
        const { newFields } = mergeFields(allFields, schoolResult.fields, 8);
        sendEvent(res, 'progress', {
          source: 'schooldigger',
          status: schoolResult.success ? 'complete' : 'error',
          fieldsFound: newFields,
          error: schoolResult.error
        });
      } catch (e) {
        sendEvent(res, 'progress', { source: 'schooldigger', status: 'error', fieldsFound: 0, error: String(e) });
      }

      // AirDNA
      sendEvent(res, 'progress', { source: 'airdna', status: 'searching', message: 'Getting rental data...' });
      try {
        const airdnaResult = await callAirDNA(lat, lon, searchAddress);
        const { newFields } = mergeFields(allFields, airdnaResult.fields, 9);
        sendEvent(res, 'progress', {
          source: 'airdna',
          status: airdnaResult.success ? 'complete' : 'error',
          fieldsFound: newFields,
          error: airdnaResult.error
        });
      } catch (e) {
        sendEvent(res, 'progress', { source: 'airdna', status: 'error', fieldsFound: 0, error: String(e) });
      }

      // ========================================
      // TIER 4: OTHER FREE APIS
      // ========================================

      // AirNow
      sendEvent(res, 'progress', { source: 'airnow', status: 'searching', message: 'Getting air quality...' });
      try {
        const airResult = await callAirNow(lat, lon);
        const { newFields } = mergeFields(allFields, airResult.fields, 10);
        sendEvent(res, 'progress', {
          source: 'airnow',
          status: airResult.success ? 'complete' : 'error',
          fieldsFound: newFields,
          error: airResult.error
        });
      } catch (e) {
        sendEvent(res, 'progress', { source: 'airnow', status: 'error', fieldsFound: 0, error: String(e) });
      }

      // HowLoud
      sendEvent(res, 'progress', { source: 'howloud', status: 'searching', message: 'Checking noise levels...' });
      try {
        const noiseResult = await callHowLoud(lat, lon);
        const { newFields } = mergeFields(allFields, noiseResult.fields, 11);
        sendEvent(res, 'progress', {
          source: 'howloud',
          status: noiseResult.success ? 'complete' : 'error',
          fieldsFound: newFields,
          error: noiseResult.error
        });
      } catch (e) {
        sendEvent(res, 'progress', { source: 'howloud', status: 'error', fieldsFound: 0, error: String(e) });
      }

      // Weather
      sendEvent(res, 'progress', { source: 'weather', status: 'searching', message: 'Getting weather data...' });
      try {
        const weatherResult = await callWeather(lat, lon);
        const { newFields } = mergeFields(allFields, weatherResult.fields, 12);
        sendEvent(res, 'progress', {
          source: 'weather',
          status: weatherResult.success ? 'complete' : 'error',
          fieldsFound: newFields,
          error: weatherResult.error
        });
      } catch (e) {
        sendEvent(res, 'progress', { source: 'weather', status: 'error', fieldsFound: 0, error: String(e) });
      }

      // Broadband
      sendEvent(res, 'progress', { source: 'broadband', status: 'searching', message: 'Checking internet availability...' });
      try {
        const bbResult = await callBroadbandNow(lat, lon, searchAddress);
        const { newFields } = mergeFields(allFields, bbResult.fields, 13);
        sendEvent(res, 'progress', {
          source: 'broadband',
          status: bbResult.success ? 'complete' : 'error',
          fieldsFound: newFields,
          error: bbResult.error
        });
      } catch (e) {
        sendEvent(res, 'progress', { source: 'broadband', status: 'error', fieldsFound: 0, error: String(e) });
      }

      // Crime - Try local Florida data first, then FBI fallback
      sendEvent(res, 'progress', { source: 'crime', status: 'searching', message: 'Getting local crime data...' });
      try {
        // Try local Florida county crime scraper first
        let crimeResult = await getFloridaLocalCrime(lat, lon, county);
        
        // If local fails, fall back to FBI state-level data
        if (!crimeResult.success || Object.keys(crimeResult.fields).length === 0) {
          sendEvent(res, 'progress', { source: 'crime', status: 'searching', message: 'Falling back to FBI data...' });
          crimeResult = await callCrimeGrade(lat, lon, searchAddress);
        }
        
        const { newFields } = mergeFields(allFields, crimeResult.fields, 14);
        sendEvent(res, 'progress', {
          source: 'crime',
          status: crimeResult.success ? 'complete' : 'error',
          fieldsFound: newFields,
          error: crimeResult.error
        });
      } catch (e) {
        sendEvent(res, 'progress', { source: 'crime', status: 'error', fieldsFound: 0, error: String(e) });
      }

      // HUD Fair Market Rent (requires ZIP code from geocode)
      sendEvent(res, 'progress', { source: 'hud-fmr', status: 'searching', message: 'Getting fair market rent data...' });
      try {
        const hudResult = await callHudFairMarketRent(zip);
        const { newFields } = mergeFields(allFields, hudResult.fields, 15);
        sendEvent(res, 'progress', {
          source: 'hud-fmr',
          status: hudResult.success ? 'complete' : 'error',
          fieldsFound: newFields,
          error: hudResult.error
        });
      } catch (e) {
        sendEvent(res, 'progress', { source: 'hud-fmr', status: 'error', fieldsFound: 0, error: String(e) });
      }


    } else {
      // Skip location-dependent APIs
      ['google-places', 'walkscore', 'fema', 'schooldigger', 'airdna', 'airnow', 'howloud', 'weather', 'broadband', 'crime', 'hud-fmr'].forEach(src => {
        sendEvent(res, 'progress', { source: src, status: 'skipped', fieldsFound: 0, error: 'No coordinates available' });
      });
    }

    // ========================================
    // TIER 5: LLMs (Last Resort - Fill Gaps Only)
    // ========================================
    if (!skipLLMs) {
      const currentFieldCount = Object.keys(allFields).length;

      // Only call LLMs if we have gaps
      if (currentFieldCount < 110) {
        const llmCascade = [
          { id: 'perplexity', fn: callPerplexity, enabled: engines.includes('perplexity') },
          { id: 'grok', fn: callGrok, enabled: engines.includes('grok') },
          { id: 'claude-opus', fn: callClaudeOpus, enabled: engines.includes('claude-opus') },
          { id: 'gpt', fn: callGPT, enabled: engines.includes('gpt') },
          { id: 'claude-sonnet', fn: callClaudeSonnet, enabled: engines.includes('claude-sonnet') },
          { id: 'gemini', fn: callGemini, enabled: engines.includes('gemini') },
        ];

        for (const llm of llmCascade) {
          if (!llm.enabled) {
            sendEvent(res, 'progress', { source: llm.id, status: 'skipped', fieldsFound: 0 });
            continue;
          }

          sendEvent(res, 'progress', { source: llm.id, status: 'searching', message: `Querying ${llm.id}...` });

          try {
            const result = await llm.fn(searchAddress);
            const { newFields } = mergeFields(allFields, result.fields, 100 + llmCascade.indexOf(llm));

            llmResponses.push({ llm: llm.id, fields_found: newFields, success: !result.error });
            sendEvent(res, 'progress', {
              source: llm.id,
              status: result.error ? 'error' : 'complete',
              fieldsFound: newFields,
              error: result.error
            });

            // Check if we've filled enough gaps
            if (Object.keys(allFields).length >= 110) {
              break;
            }
          } catch (e) {
            sendEvent(res, 'progress', { source: llm.id, status: 'error', fieldsFound: 0, error: String(e) });
            llmResponses.push({ llm: llm.id, fields_found: 0, success: false, error: String(e) });
          }
        }
      } else {
        // Skip all LLMs - we have enough data
        ['perplexity', 'grok', 'claude-opus', 'gpt', 'claude-sonnet', 'gemini'].forEach(id => {
          sendEvent(res, 'progress', { source: id, status: 'skipped', fieldsFound: 0, message: 'Sufficient data from reliable sources' });
        });
      }
    } else {
      // Mark all LLMs as skipped
      ['perplexity', 'grok', 'claude-opus', 'gpt', 'claude-sonnet', 'gemini'].forEach(id => {
        sendEvent(res, 'progress', { source: id, status: 'skipped', fieldsFound: 0 });
      });
    }

    // Calculate final stats
    const totalFields = Object.keys(allFields).length;
    const completionPercentage = Math.round((totalFields / 110) * 100);

    // Send final complete event with all data
    sendEvent(res, 'complete', {
      success: true,
      address: searchAddress,
      fields: allFields,
      total_fields_found: totalFields,
      completion_percentage: completionPercentage,
      llm_responses: llmResponses,
      conflicts: allConflicts
    });

  } catch (error) {
    sendEvent(res, 'error', { error: String(error) });
  }

  res.end();
}
