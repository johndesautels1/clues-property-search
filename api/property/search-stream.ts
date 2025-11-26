/**
 * CLUES Property Search API - SSE Streaming Version
 * Real-time progress updates via Server-Sent Events
 * Mobile-optimized, no database/user type changes
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import all the existing functions from search.ts
// We'll refactor to share code, but for now duplicate the core logic

const SCRAPER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// SSE helper to send events
function sendEvent(res: VercelResponse, event: string, data: any) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function addressToRealtorUrl(address: string): string {
  const parts = address.split(',').map(p => p.trim());
  if (parts.length < 3) return '';
  const street = parts[0].replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const city = parts[1].replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const stateZip = parts[2].trim().split(' ');
  const state = stateZip[0];
  const zip = stateZip[1] || '';
  return `https://www.realtor.com/realestateandhomes-detail/${street}_${city}_${state}_${zip}`;
}

function extractNextData(html: string): any {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[1]);
    return data?.props?.pageProps?.initialReduxState || data?.props?.pageProps;
  } catch (e) {
    return null;
  }
}

async function scrapeRealtorData(address: string): Promise<Record<string, any>> {
  const directUrl = addressToRealtorUrl(address);
  if (!directUrl) return {};

  try {
    const response = await fetch(directUrl, { headers: SCRAPER_HEADERS });
    if (!response.ok) return {};

    const html = await response.text();
    const data = extractNextData(html);
    if (!data) return {};

    const property = data?.propertyDetails?.listingDetail || data?.property || data;
    const listing = property?.listing || property;
    const location = property?.location || property?.address || {};
    const description = property?.description || {};
    const taxHistory = property?.tax_history || [];
    const priceHistory = property?.price_history || [];

    const fields: Record<string, any> = {};

    const addr = location.address || location;
    if (addr?.line) {
      fields['1_full_address'] = {
        value: `${addr.line}, ${addr.city}, ${addr.state_code} ${addr.postal_code}`,
        source: 'Realtor.com',
        confidence: 'High'
      };
    }

    fields['2_mls_primary'] = { value: listing?.mls?.id || property?.mls_id, source: 'Realtor.com', confidence: 'High' };
    fields['4_listing_status'] = { value: property?.status || listing?.status, source: 'Realtor.com', confidence: 'High' };
    fields['5_listing_date'] = { value: listing?.list_date || property?.list_date, source: 'Realtor.com', confidence: 'High' };
    fields['6_parcel_id'] = { value: property?.property_id, source: 'Realtor.com', confidence: 'High' };

    const price = listing?.list_price || property?.list_price || property?.price;
    const sqft = description?.sqft || property?.sqft || property?.building_size?.size;
    fields['7_listing_price'] = { value: price, source: 'Realtor.com', confidence: 'High' };
    fields['8_price_per_sqft'] = { value: (price && sqft) ? Math.round(price / sqft) : null, source: 'Calculated', confidence: 'High' };

    if (priceHistory?.length > 0) {
      const lastSale = priceHistory.find((h: any) => h.event_name === 'Sold');
      if (lastSale) {
        fields['10_last_sale_date'] = { value: lastSale.date, source: 'Realtor.com', confidence: 'High' };
        fields['11_last_sale_price'] = { value: lastSale.price, source: 'Realtor.com', confidence: 'High' };
      }
    }

    fields['12_bedrooms'] = { value: description?.beds || property?.beds, source: 'Realtor.com', confidence: 'High' };
    fields['13_full_bathrooms'] = { value: description?.baths_full || property?.baths_full, source: 'Realtor.com', confidence: 'High' };
    fields['14_half_bathrooms'] = { value: description?.baths_half || property?.baths_half || 0, source: 'Realtor.com', confidence: 'High' };

    const fullBaths = description?.baths_full || property?.baths_full || 0;
    const halfBaths = description?.baths_half || property?.baths_half || 0;
    fields['15_total_bathrooms'] = { value: fullBaths + (halfBaths * 0.5), source: 'Calculated', confidence: 'High' };

    fields['16_living_sqft'] = { value: sqft, source: 'Realtor.com', confidence: 'High' };
    fields['18_lot_size_sqft'] = { value: description?.lot_sqft || property?.lot_sqft, source: 'Realtor.com', confidence: 'High' };

    const lotSqft = description?.lot_sqft || property?.lot_sqft;
    fields['19_lot_size_acres'] = { value: lotSqft ? (lotSqft / 43560).toFixed(2) : null, source: 'Calculated', confidence: 'High' };

    fields['20_year_built'] = { value: description?.year_built || property?.year_built, source: 'Realtor.com', confidence: 'High' };
    fields['21_property_type'] = { value: description?.type || property?.prop_type || property?.type, source: 'Realtor.com', confidence: 'High' };
    fields['22_stories'] = { value: description?.stories || property?.stories, source: 'Realtor.com', confidence: 'Medium' };
    fields['23_garage_spaces'] = { value: description?.garage || property?.garage, source: 'Realtor.com', confidence: 'Medium' };

    const hoa = property?.hoa || listing?.hoa;
    fields['25_hoa_yn'] = { value: hoa ? true : false, source: 'Realtor.com', confidence: 'Medium' };
    if (hoa?.fee) {
      fields['26_hoa_fee_annual'] = { value: hoa.fee * 12, source: 'Realtor.com', confidence: 'Medium' };
    }

    fields['28_county'] = { value: location?.county?.name || location?.address?.county, source: 'Realtor.com', confidence: 'High' };

    if (taxHistory?.length > 0) {
      const latestTax = taxHistory[0];
      fields['29_annual_taxes'] = { value: latestTax?.tax, source: 'Realtor.com', confidence: 'High' };
      fields['30_tax_year'] = { value: latestTax?.year, source: 'Realtor.com', confidence: 'High' };
      fields['31_assessed_value'] = { value: latestTax?.assessment?.total, source: 'Realtor.com', confidence: 'High' };
    }

    return Object.fromEntries(
      Object.entries(fields).filter(([_, v]) => v.value !== null && v.value !== undefined)
    );
  } catch (e) {
    console.error('Realtor scrape error:', e);
    return {};
  }
}

async function geocodeAddress(address: string): Promise<{ lat: number; lon: number; county: string } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results?.[0]) {
      const result = data.results[0];
      let county = '';
      for (const component of result.address_components) {
        if (component.types.includes('administrative_area_level_2')) {
          county = component.long_name;
          break;
        }
      }
      return { lat: result.geometry.location.lat, lon: result.geometry.location.lng, county };
    }
  } catch (e) {
    console.error('Geocode error:', e);
  }
  return null;
}

async function getWalkScore(lat: number, lon: number, address: string): Promise<Record<string, any>> {
  const apiKey = process.env.WALKSCORE_API_KEY;
  if (!apiKey) return {};

  try {
    const url = `https://api.walkscore.com/score?format=json&address=${encodeURIComponent(address)}&lat=${lat}&lon=${lon}&wsapikey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status !== 1) return {};

    return {
      '65_walk_score': { value: `${data.walkscore} - ${data.description}`, source: 'WalkScore', confidence: 'High' },
      '66_transit_score': { value: data.transit?.score ? `${data.transit.score} - ${data.transit.description}` : null, source: 'WalkScore', confidence: 'High' },
      '67_bike_score': { value: data.bike?.score ? `${data.bike.score} - ${data.bike.description}` : null, source: 'WalkScore', confidence: 'High' },
      '70_walkability_description': { value: data.description, source: 'WalkScore', confidence: 'High' }
    };
  } catch (e) {
    return {};
  }
}

async function getFloodZone(lat: number, lon: number): Promise<Record<string, any>> {
  try {
    const url = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?where=1%3D1&geometry=${lon}%2C${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE%2CZONE_SUBTY%2CSFHA_TF&returnGeometry=false&f=json`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.features?.[0]) {
      const zone = data.features[0].attributes;
      const floodZone = zone.FLD_ZONE || 'Unknown';
      const isHighRisk = ['A', 'AE', 'AH', 'AO', 'V', 'VE'].some(z => floodZone.startsWith(z));
      return {
        '100_flood_zone': { value: `FEMA Zone ${floodZone}`, source: 'FEMA NFHL', confidence: 'High' },
        '101_flood_risk_level': { value: isHighRisk ? 'High Risk (Special Flood Hazard Area)' : 'Minimal Risk', source: 'FEMA NFHL', confidence: 'High' }
      };
    }
    return {
      '100_flood_zone': { value: 'Zone X (Minimal Risk)', source: 'FEMA NFHL', confidence: 'Medium' },
      '101_flood_risk_level': { value: 'Minimal', source: 'FEMA NFHL', confidence: 'Medium' }
    };
  } catch (e) {
    return {};
  }
}

async function getAirQuality(lat: number, lon: number): Promise<Record<string, any>> {
  const apiKey = process.env.AIRNOW_API_KEY;
  if (!apiKey) return {};

  try {
    const url = `https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${lat}&longitude=${lon}&distance=25&API_KEY=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data?.[0]) {
      return {
        '99_air_quality_index_current': { value: `${data[0].AQI} - ${data[0].Category.Name}`, source: 'AirNow', confidence: 'High' }
      };
    }
  } catch (e) {}
  return {};
}

async function getDistances(lat: number, lon: number): Promise<Record<string, any>> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return {};

  const origin = `${lat},${lon}`;
  const fields: Record<string, any> = {};

  const placeTypes = [
    { type: 'supermarket', field: '73_distance_grocery_miles', name: 'Grocery' },
    { type: 'hospital', field: '74_distance_hospital_miles', name: 'Hospital' },
    { type: 'airport', field: '75_distance_airport_miles', name: 'Airport' },
    { type: 'park', field: '76_distance_park_miles', name: 'Park' },
    { type: 'beach', field: '77_distance_beach_miles', name: 'Beach' },
  ];

  for (const place of placeTypes) {
    try {
      const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin}&rankby=distance&type=${place.type}&key=${apiKey}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (searchData.results && searchData.results.length > 0) {
        const nearest = searchData.results[0];
        const destLat = nearest.geometry.location.lat;
        const destLon = nearest.geometry.location.lng;

        const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destLat},${destLon}&units=imperial&key=${apiKey}`;
        const distRes = await fetch(distUrl);
        const distData = await distRes.json();

        if (distData.rows?.[0]?.elements?.[0]?.distance) {
          const meters = distData.rows[0].elements[0].distance.value;
          const miles = (meters / 1609.34).toFixed(1);

          fields[place.field] = {
            value: parseFloat(miles),
            source: 'Google Places',
            confidence: 'High',
            details: nearest.name
          };
        }
      }
    } catch (e) {
      console.error(`Error getting ${place.name} distance:`, e);
    }
  }

  return fields;
}

// LLM call functions (simplified versions)
async function callPerplexity(address: string): Promise<any> {
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
          { role: 'system', content: 'You are a real estate data researcher. Return JSON with property data fields.' },
          { role: 'user', content: `Find property data for: ${address}. Return as JSON with fields like "7_listing_price", "28_county", etc.` }
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
        return { fields: parsed.fields || parsed, llm: 'Perplexity' };
      }
    }
    return { error: 'Failed to parse response', fields: {}, llm: 'Perplexity' };
  } catch (error) {
    return { error: String(error), fields: {}, llm: 'Perplexity' };
  }
}

async function callGrok(address: string): Promise<any> {
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
          { role: 'system', content: 'You are a real estate data researcher with web search. Return JSON.' },
          { role: 'user', content: `Search for property data: ${address}. Return JSON with fields.` }
        ],
      }),
    });

    const data = await response.json();
    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { fields: parsed.fields || parsed, llm: 'Grok' };
      }
    }
    return { error: 'Failed to parse response', fields: {}, llm: 'Grok' };
  } catch (error) {
    return { error: String(error), fields: {}, llm: 'Grok' };
  }
}

async function callClaudeOpus(address: string): Promise<any> {
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
        messages: [{ role: 'user', content: `Extract property data for: ${address}. Return JSON.` }],
      }),
    });

    const data = await response.json();
    if (data.content?.[0]?.text) {
      const text = data.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { fields: parsed.fields || parsed, llm: 'Claude Opus' };
      }
    }
    return { error: 'Failed to parse response', fields: {}, llm: 'Claude Opus' };
  } catch (error) {
    return { error: String(error), fields: {}, llm: 'Claude Opus' };
  }
}

async function callGPT(address: string): Promise<any> {
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
          { role: 'system', content: 'Extract property data and return JSON.' },
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
        return { fields: parsed.fields || parsed, llm: 'GPT' };
      }
    }
    return { error: 'Failed to parse response', fields: {}, llm: 'GPT' };
  } catch (error) {
    return { error: String(error), fields: {}, llm: 'GPT' };
  }
}

async function callClaudeSonnet(address: string): Promise<any> {
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
        messages: [{ role: 'user', content: `Extract property data for: ${address}. Return JSON.` }],
      }),
    });

    const data = await response.json();
    if (data.content?.[0]?.text) {
      const text = data.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { fields: parsed.fields || parsed, llm: 'Claude Sonnet' };
      }
    }
    return { error: 'Failed to parse response', fields: {}, llm: 'Claude Sonnet' };
  } catch (error) {
    return { error: String(error), fields: {}, llm: 'Claude Sonnet' };
  }
}

async function callGemini(address: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { error: 'API key not set', fields: {} };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Extract property data for: ${address}. Return JSON.` }] }],
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
        return { fields: parsed.fields || parsed, llm: 'Gemini' };
      }
    }
    return { error: 'Failed to parse response', fields: {}, llm: 'Gemini' };
  } catch (error) {
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

  const { address, engines = ['perplexity', 'grok', 'claude-opus', 'gpt', 'claude-sonnet', 'gemini'], skipLLMs = false } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address required' });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  let allFields: Record<string, any> = {};
  const llmResponses: any[] = [];

  try {
    // STEP 1: Realtor.com Scraper
    sendEvent(res, 'progress', { source: 'realtor', status: 'searching', message: 'Scraping Realtor.com...' });

    try {
      const realtorData = await scrapeRealtorData(address);
      const fieldsFound = Object.keys(realtorData).length;
      Object.assign(allFields, realtorData);
      sendEvent(res, 'progress', { source: 'realtor', status: 'complete', fieldsFound, message: `Found ${fieldsFound} fields` });
    } catch (e) {
      sendEvent(res, 'progress', { source: 'realtor', status: 'error', fieldsFound: 0, error: String(e) });
    }

    // STEP 2: Google Geocode
    sendEvent(res, 'progress', { source: 'google-geocode', status: 'searching', message: 'Geocoding address...' });

    const geo = await geocodeAddress(address);
    if (geo) {
      allFields['28_county'] = { value: geo.county, source: 'Google Maps', confidence: 'High' };
      sendEvent(res, 'progress', { source: 'google-geocode', status: 'complete', fieldsFound: 1 });

      // STEP 3: Free APIs in parallel-ish (but send events sequentially)

      // WalkScore
      sendEvent(res, 'progress', { source: 'walkscore', status: 'searching', message: 'Getting WalkScore...' });
      try {
        const walkData = await getWalkScore(geo.lat, geo.lon, address);
        const walkFields = Object.keys(walkData).length;
        Object.assign(allFields, walkData);
        sendEvent(res, 'progress', { source: 'walkscore', status: 'complete', fieldsFound: walkFields });
      } catch (e) {
        sendEvent(res, 'progress', { source: 'walkscore', status: 'error', fieldsFound: 0 });
      }

      // FEMA Flood
      sendEvent(res, 'progress', { source: 'fema', status: 'searching', message: 'Checking flood zones...' });
      try {
        const floodData = await getFloodZone(geo.lat, geo.lon);
        const floodFields = Object.keys(floodData).length;
        Object.assign(allFields, floodData);
        sendEvent(res, 'progress', { source: 'fema', status: 'complete', fieldsFound: floodFields });
      } catch (e) {
        sendEvent(res, 'progress', { source: 'fema', status: 'error', fieldsFound: 0 });
      }

      // AirNow
      sendEvent(res, 'progress', { source: 'airnow', status: 'searching', message: 'Getting air quality...' });
      try {
        const airData = await getAirQuality(geo.lat, geo.lon);
        const airFields = Object.keys(airData).length;
        Object.assign(allFields, airData);
        sendEvent(res, 'progress', { source: 'airnow', status: 'complete', fieldsFound: airFields });
      } catch (e) {
        sendEvent(res, 'progress', { source: 'airnow', status: 'error', fieldsFound: 0 });
      }

      // Google Places distances
      sendEvent(res, 'progress', { source: 'google-places', status: 'searching', message: 'Finding nearby amenities...' });
      try {
        const distData = await getDistances(geo.lat, geo.lon);
        const distFields = Object.keys(distData).length;
        Object.assign(allFields, distData);
        sendEvent(res, 'progress', { source: 'google-places', status: 'complete', fieldsFound: distFields });
      } catch (e) {
        sendEvent(res, 'progress', { source: 'google-places', status: 'error', fieldsFound: 0 });
      }

    } else {
      sendEvent(res, 'progress', { source: 'google-geocode', status: 'error', fieldsFound: 0, error: 'Could not geocode address' });
      // Skip location-dependent APIs
      sendEvent(res, 'progress', { source: 'walkscore', status: 'skipped', fieldsFound: 0 });
      sendEvent(res, 'progress', { source: 'fema', status: 'skipped', fieldsFound: 0 });
      sendEvent(res, 'progress', { source: 'airnow', status: 'skipped', fieldsFound: 0 });
      sendEvent(res, 'progress', { source: 'google-places', status: 'skipped', fieldsFound: 0 });
    }

    // Mark remaining free APIs as skipped for now (not implemented in streaming yet)
    sendEvent(res, 'progress', { source: 'howloud', status: 'skipped', fieldsFound: 0 });
    sendEvent(res, 'progress', { source: 'weather', status: 'skipped', fieldsFound: 0 });
    sendEvent(res, 'progress', { source: 'crime', status: 'skipped', fieldsFound: 0 });
    sendEvent(res, 'progress', { source: 'broadband', status: 'skipped', fieldsFound: 0 });

    // STEP 4: LLM Cascade
    if (!skipLLMs) {
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
          const result = await llm.fn(address);
          const fields = result.fields || {};
          const fieldsFound = Object.keys(fields).length;

          if (fieldsFound > 0) {
            // Merge fields (don't overwrite existing)
            for (const [key, value] of Object.entries(fields)) {
              if (!allFields[key]) {
                const val = (value as any)?.value !== undefined ? (value as any).value : value;
                if (val !== null && val !== undefined && val !== '') {
                  allFields[key] = typeof value === 'object' ? { ...value, source: `${(value as any).source || llm.id} (via ${llm.id})` } : { value: val, source: llm.id, confidence: 'Medium' };
                }
              }
            }
          }

          llmResponses.push({ llm: llm.id, fields_found: fieldsFound, success: !result.error });
          sendEvent(res, 'progress', {
            source: llm.id,
            status: result.error ? 'error' : 'complete',
            fieldsFound,
            error: result.error
          });

          // Check if we hit 100% completion
          const currentFields = Object.keys(allFields).filter(k => {
            const f = allFields[k];
            const v = f?.value !== undefined ? f.value : f;
            return v !== null && v !== undefined && v !== '';
          }).length;

          if (currentFields >= 110) {
            // Skip remaining LLMs
            break;
          }
        } catch (e) {
          sendEvent(res, 'progress', { source: llm.id, status: 'error', fieldsFound: 0, error: String(e) });
          llmResponses.push({ llm: llm.id, fields_found: 0, success: false, error: String(e) });
        }
      }
    } else {
      // Mark all LLMs as skipped
      ['perplexity', 'grok', 'claude-opus', 'gpt', 'claude-sonnet', 'gemini'].forEach(id => {
        sendEvent(res, 'progress', { source: id, status: 'skipped', fieldsFound: 0 });
      });
    }

    // Calculate final stats
    const totalFields = Object.keys(allFields).filter(k => {
      const f = allFields[k];
      const v = f?.value !== undefined ? f.value : f;
      return v !== null && v !== undefined && v !== '';
    }).length;

    const completionPercentage = Math.round((totalFields / 110) * 100);

    // Send final complete event with all data
    sendEvent(res, 'complete', {
      success: true,
      address,
      fields: allFields,
      total_fields_found: totalFields,
      completion_percentage: completionPercentage,
      llm_responses: llmResponses
    });

  } catch (error) {
    sendEvent(res, 'error', { error: String(error) });
  }

  res.end();
}
