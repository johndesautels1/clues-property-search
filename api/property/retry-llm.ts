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

// Helper to extract JSON from markdown code blocks or raw text (uses shared module)
function extractJSON(text: string): string | null {
  const result = extractAndParseJson<Record<string, any>>(text, 'RETRY-LLM');
  if (result.success && result.data) {
    return JSON.stringify(result.data);
  }
  return null;
}

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
