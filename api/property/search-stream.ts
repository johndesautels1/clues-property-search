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
          { role: 'system', content: 'You are a real estate data researcher. Search the web for accurate property data. Return JSON with numbered field keys like "7_listing_price", "12_bedrooms", etc. Only include data you can verify from real sources.' },
          { role: 'user', content: `Find accurate property data for: ${address}. Return JSON with verified data only.` }
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
        for (const [key, value] of Object.entries(parsed.fields || parsed)) {
          if (value !== null && value !== undefined && value !== '') {
            fields[key] = {
              value: (value as any)?.value !== undefined ? (value as any).value : value,
              source: 'Perplexity (Web Search)',
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

async function callGrok(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) return { error: 'API key not set', fields: {} };

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-2-latest',
        max_tokens: 8000,
        temperature: 0.1,
        messages: [
          { role: 'system', content: 'You are a real estate researcher with web search. Return JSON with property data using numbered keys like "7_listing_price". Only include verified data.' },
          { role: 'user', content: `Search for property data: ${address}. Return JSON.` }
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
          if (value !== null && value !== undefined && value !== '') {
            fields[key] = {
              value: (value as any)?.value !== undefined ? (value as any).value : value,
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
        messages: [{ role: 'user', content: `Extract any property data you know for: ${address}. Return JSON with numbered keys like "7_listing_price". Only include data you're confident about.` }],
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
          if (value !== null && value !== undefined && value !== '') {
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
          { role: 'system', content: 'Extract property data and return JSON with numbered keys. Only include confident data.' },
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
          if (value !== null && value !== undefined && value !== '') {
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
        messages: [{ role: 'user', content: `Extract property data for: ${address}. Return JSON with numbered keys.` }],
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
          if (value !== null && value !== undefined && value !== '') {
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

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Extract property data for: ${address}. Return JSON with numbered keys.` }] }],
          generationConfig: { maxOutputTokens: 8000 },
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
        for (const [key, value] of Object.entries(parsed.fields || parsed)) {
          if (value !== null && value !== undefined && value !== '') {
            fields[key] = {
              value: (value as any)?.value !== undefined ? (value as any).value : value,
              source: 'Gemini',
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

    try {
      const geoResult = await callGoogleGeocode(searchAddress);
      const { newFields, conflicts } = mergeFields(allFields, geoResult.fields, 4);
      conflicts.forEach(c => allConflicts.push({ field: c.field, values: [c.existing, c.new] }));

      lat = geoResult.lat;
      lon = geoResult.lon;
      const county = geoResult.county || '';

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
      }

    } else {
      // Skip location-dependent APIs
      ['google-places', 'walkscore', 'fema', 'schooldigger', 'airdna', 'airnow', 'howloud', 'weather', 'broadband', 'crime'].forEach(src => {
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
