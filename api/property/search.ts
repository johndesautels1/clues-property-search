/**
 * CLUES Property Search API
 * Strategy:
 * 1. First scrape Realtor.com for real property data
 * 2. Then call free APIs (WalkScore, FEMA, Google Maps, AirNow)
 * 3. Finally use LLMs only to fill gaps with web search
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeFloridaCounty } from './florida-counties';

// ============================================
// REALTOR.COM SCRAPER
// ============================================

const SCRAPER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

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

    // Address
    const addr = location.address || location;
    if (addr?.line) {
      fields['1_full_address'] = {
        value: `${addr.line}, ${addr.city}, ${addr.state_code} ${addr.postal_code}`,
        source: 'Realtor.com',
        confidence: 'High'
      };
    }

    // MLS & Status
    fields['2_mls_primary'] = { value: listing?.mls?.id || property?.mls_id, source: 'Realtor.com', confidence: 'High' };
    fields['4_listing_status'] = { value: property?.status || listing?.status, source: 'Realtor.com', confidence: 'High' };
    fields['5_listing_date'] = { value: listing?.list_date || property?.list_date, source: 'Realtor.com', confidence: 'High' };
    fields['6_parcel_id'] = { value: property?.property_id, source: 'Realtor.com', confidence: 'High' };

    // Pricing
    const price = listing?.list_price || property?.list_price || property?.price;
    const sqft = description?.sqft || property?.sqft || property?.building_size?.size;
    fields['7_listing_price'] = { value: price, source: 'Realtor.com', confidence: 'High' };
    fields['8_price_per_sqft'] = { value: (price && sqft) ? Math.round(price / sqft) : null, source: 'Calculated', confidence: 'High' };

    // Last sale from price history
    if (priceHistory?.length > 0) {
      const lastSale = priceHistory.find((h: any) => h.event_name === 'Sold');
      if (lastSale) {
        fields['10_last_sale_date'] = { value: lastSale.date, source: 'Realtor.com', confidence: 'High' };
        fields['11_last_sale_price'] = { value: lastSale.price, source: 'Realtor.com', confidence: 'High' };
      }
    }

    // Property Basics
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

    // HOA
    const hoa = property?.hoa || listing?.hoa;
    fields['25_hoa_yn'] = { value: hoa ? true : false, source: 'Realtor.com', confidence: 'Medium' };
    if (hoa?.fee) {
      fields['26_hoa_fee_annual'] = { value: hoa.fee * 12, source: 'Realtor.com', confidence: 'Medium' };
    }

    // County
    fields['28_county'] = { value: location?.county?.name || location?.address?.county, source: 'Realtor.com', confidence: 'High' };

    // Taxes
    if (taxHistory?.length > 0) {
      const latestTax = taxHistory[0];
      fields['29_annual_taxes'] = { value: latestTax?.tax, source: 'Realtor.com', confidence: 'High' };
      fields['30_tax_year'] = { value: latestTax?.year, source: 'Realtor.com', confidence: 'High' };
      fields['31_assessed_value'] = { value: latestTax?.assessment?.total, source: 'Realtor.com', confidence: 'High' };
    }

    // Filter out null values
    return Object.fromEntries(
      Object.entries(fields).filter(([_, v]) => v.value !== null && v.value !== undefined)
    );
  } catch (e) {
    console.error('Realtor scrape error:', e);
    return {};
  }
}

// ============================================
// FREE API ENRICHMENT
// ============================================

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

// HowLoud API - Noise levels
async function getNoiseData(lat: number, lon: number): Promise<Record<string, any>> {
  const apiKey = process.env.HOWLOUD_API_KEY;
  const clientId = process.env.HOWLOUD_CLIENT_ID;
  if (!apiKey) {
    console.log('HOWLOUD_API_KEY not set');
    return {};
  }

  try {
    // Include client_id if provided
    let url = `https://api.howloud.com/score?lat=${lat}&lng=${lon}&key=${apiKey}`;
    if (clientId) {
      url += `&client_id=${clientId}`;
    }
    const response = await fetch(url);
    const data = await response.json();

    const fields: Record<string, any> = {};

    if (data && data.score !== undefined) {
      // HowLoud score: 0-100 (higher = quieter)
      let noiseLevel = 'High Noise';
      if (data.score >= 80) noiseLevel = 'Very Quiet';
      else if (data.score >= 60) noiseLevel = 'Quiet';
      else if (data.score >= 40) noiseLevel = 'Moderate';
      else if (data.score >= 20) noiseLevel = 'Noisy';

      fields['68_noise_level'] = {
        value: `${noiseLevel} (Score: ${data.score}/100)`,
        source: 'HowLoud',
        confidence: 'High'
      };

      // Traffic noise component if available
      if (data.traffic !== undefined) {
        let trafficLevel = 'Heavy';
        if (data.traffic >= 80) trafficLevel = 'Very Light';
        else if (data.traffic >= 60) trafficLevel = 'Light';
        else if (data.traffic >= 40) trafficLevel = 'Moderate';
        else if (data.traffic >= 20) trafficLevel = 'Heavy';

        fields['69_traffic_level'] = {
          value: `${trafficLevel} (Score: ${data.traffic}/100)`,
          source: 'HowLoud',
          confidence: 'High'
        };
      }

      // Estimated noise in decibels if available
      if (data.decibels !== undefined) {
        fields['103_noise_level_db_est'] = {
          value: `${data.decibels} dB`,
          source: 'HowLoud',
          confidence: 'High'
        };
      }
    }

    return fields;
  } catch (e) {
    console.error('HowLoud error:', e);
    return {};
  }
}

// BroadbandNow Scraper - Internet providers (FREE - no API key)
async function getInternetProviders(address: string): Promise<Record<string, any>> {
  try {
    const searchUrl = `https://broadbandnow.com/search?q=${encodeURIComponent(address)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });

    if (!response.ok) return {};

    const html = await response.text();
    const fields: Record<string, any> = {};

    // Extract provider names
    const providerMatches = html.match(/class="provider-name[^"]*"[^>]*>([^<]+)</g);
    if (providerMatches && providerMatches.length > 0) {
      const providers = providerMatches
        .slice(0, 3)
        .map(m => m.match(/>([^<]+)</)?.[1])
        .filter(Boolean);

      if (providers.length > 0) {
        fields['96_internet_providers_top3'] = {
          value: providers.join(', '),
          source: 'BroadbandNow',
          confidence: 'High'
        };
      }
    }

    // Extract max speed
    const speedMatch = html.match(/(\d+)\s*Mbps/i);
    if (speedMatch) {
      fields['97_max_internet_speed'] = {
        value: `${speedMatch[1]} Mbps`,
        source: 'BroadbandNow',
        confidence: 'High'
      };
    }

    // Extract cable provider
    const cableMatch = html.match(/Cable[^<]*<[^>]*>([^<]+)</i);
    if (cableMatch) {
      fields['98_cable_tv_provider'] = {
        value: cableMatch[1].trim(),
        source: 'BroadbandNow',
        confidence: 'Medium'
      };
    }

    return fields;
  } catch (e) {
    console.error('BroadbandNow scrape error:', e);
    return {};
  }
}

// Weather.com API - Climate data
async function getClimateData(lat: number, lon: number): Promise<Record<string, any>> {
  const apiKey = process.env.WEATHERCOM_API_KEY;
  if (!apiKey) {
    console.log('WEATHERCOM_API_KEY not set');
    return {};
  }

  try {
    // Get current conditions and monthly averages
    const url = `https://api.weather.com/v3/wx/observations/current?geocode=${lat},${lon}&units=e&language=en-US&format=json&apiKey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    const fields: Record<string, any> = {};

    if (data) {
      // Current temperature and conditions
      const conditions = [];
      if (data.temperature) conditions.push(`Current: ${data.temperature}°F`);
      if (data.temperatureFeelsLike) conditions.push(`Feels like: ${data.temperatureFeelsLike}°F`);
      if (data.relativeHumidity) conditions.push(`Humidity: ${data.relativeHumidity}%`);
      if (data.wxPhraseLong) conditions.push(data.wxPhraseLong);

      if (conditions.length > 0) {
        fields['102_climate_risk_summary'] = {
          value: conditions.join(', '),
          source: 'Weather.com',
          confidence: 'High'
        };
      }

      // UV Index for solar potential estimate
      if (data.uvIndex !== undefined) {
        let solarPotential = 'Low';
        if (data.uvIndex >= 6) solarPotential = 'High';
        else if (data.uvIndex >= 3) solarPotential = 'Moderate';

        fields['104_solar_potential'] = {
          value: `${solarPotential} (UV Index: ${data.uvIndex})`,
          source: 'Weather.com',
          confidence: 'Medium'
        };
      }
    }

    return fields;
  } catch (e) {
    console.error('Weather.com error:', e);
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
      // Find nearest place of this type
      const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin}&rankby=distance&type=${place.type}&key=${apiKey}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

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

// Google Distance Matrix - Commute time to downtown
async function getCommuteTime(lat: number, lon: number, county: string): Promise<Record<string, any>> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return {};

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
    const response = await fetch(url);
    const data = await response.json();

    if (data.rows?.[0]?.elements?.[0]?.duration_in_traffic) {
      return {
        '71_commute_time_city_center': {
          value: data.rows[0].elements[0].duration_in_traffic.text,
          source: 'Google Distance Matrix',
          confidence: 'High',
          details: `To ${downtown.name}`
        }
      };
    } else if (data.rows?.[0]?.elements?.[0]?.duration) {
      return {
        '71_commute_time_city_center': {
          value: data.rows[0].elements[0].duration.text,
          source: 'Google Distance Matrix',
          confidence: 'High',
          details: `To ${downtown.name}`
        }
      };
    }
  } catch (e) {
    console.error('Commute time error:', e);
  }

  return {};
}

async function enrichWithFreeAPIs(address: string): Promise<Record<string, any>> {
  const geo = await geocodeAddress(address);
  if (!geo) return {};

  const fields: Record<string, any> = {};
  fields['28_county'] = { value: geo.county, source: 'Google Maps', confidence: 'High' };
  fields['coordinates'] = { value: { lat: geo.lat, lon: geo.lon }, source: 'Google Maps', confidence: 'High' };

  // Call all APIs in parallel
  const [walkScore, floodZone, airQuality, noiseData, climateData, distances, commuteTime] = await Promise.all([
    getWalkScore(geo.lat, geo.lon, address),
    getFloodZone(geo.lat, geo.lon),
    getAirQuality(geo.lat, geo.lon),
    getNoiseData(geo.lat, geo.lon),
    getClimateData(geo.lat, geo.lon),
    getDistances(geo.lat, geo.lon),
    getCommuteTime(geo.lat, geo.lon, geo.county)
  ]);

  Object.assign(fields, walkScore, floodZone, airQuality, noiseData, climateData, distances, commuteTime);

  // Filter out nulls
  return Object.fromEntries(
    Object.entries(fields).filter(([_, v]) => v.value !== null && v.value !== undefined)
  );
}

// ============================================
// PERPLEXITY - HAS REAL WEB SEARCH
// ============================================

async function callPerplexity(address: string): Promise<Record<string, any>> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.log('PERPLEXITY_API_KEY not set');
    return {};
  }

  const prompt = `Search for real property data for: ${address}

Search Zillow, Redfin, Realtor.com, and county property appraiser websites.

Return ONLY data you can actually verify from these sources. For each field include the source website.

I need these fields in JSON format:
{
  "7_listing_price": {"value": number, "source": "website name"},
  "12_bedrooms": {"value": number, "source": "website name"},
  "13_full_bathrooms": {"value": number, "source": "website name"},
  "16_living_sqft": {"value": number, "source": "website name"},
  "18_lot_size_sqft": {"value": number, "source": "website name"},
  "20_year_built": {"value": number, "source": "website name"},
  "21_property_type": {"value": "string", "source": "website name"},
  "29_annual_taxes": {"value": number, "source": "website name"},
  "31_assessed_value": {"value": number, "source": "website name"},
  "56_assigned_elementary": {"value": "school name", "source": "website name"},
  "57_elementary_rating": {"value": "rating", "source": "website name"},
  "59_assigned_middle": {"value": "school name", "source": "website name"},
  "60_middle_rating": {"value": "rating", "source": "website name"},
  "62_assigned_high": {"value": "school name", "source": "website name"},
  "63_high_rating": {"value": "rating", "source": "website name"},
  "81_median_home_price_neighborhood": {"value": number, "source": "website name"},
  "85_rental_estimate_monthly": {"value": number, "source": "website name"}
}

CRITICAL: Only include fields you found REAL data for. Do NOT make up values. Return valid JSON only.`;

  try {
    console.log('Calling Perplexity API...');
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a real estate data researcher. Search the web and return ONLY verified data from real sources. Never make up data.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    console.log('Perplexity response received');

    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Add confidence and format properly
        const fields: Record<string, any> = {};
        for (const [key, val] of Object.entries(parsed)) {
          if (val && typeof val === 'object' && (val as any).value !== null) {
            fields[key] = {
              value: (val as any).value,
              source: `${(val as any).source} (via Perplexity)`,
              confidence: 'High'
            };
          }
        }
        console.log(`Perplexity found ${Object.keys(fields).length} fields`);
        return fields;
      }
    }
    console.log('Failed to parse Perplexity response');
    return {};
  } catch (error) {
    console.error('Perplexity error:', error);
    return {};
  }
}

// ============================================
// LLM CALLS (DISABLED - hallucinate without web access)
// ============================================

// Field definitions for the prompt
const FIELD_GROUPS = `
GROUP A - Address & Identity (1-6):
1. full_address, 2. mls_primary, 3. mls_secondary, 4. listing_status, 5. listing_date, 6. parcel_id

GROUP B - Pricing (7-11):
7. listing_price, 8. price_per_sqft, 9. market_value_estimate, 10. last_sale_date, 11. last_sale_price

GROUP C - Property Basics (12-24):
12. bedrooms, 13. full_bathrooms, 14. half_bathrooms, 15. total_bathrooms, 16. living_sqft,
17. total_sqft_under_roof, 18. lot_size_sqft, 19. lot_size_acres, 20. year_built, 21. property_type,
22. stories, 23. garage_spaces, 24. parking_total

GROUP D - HOA & Ownership (25-28):
25. hoa_yn, 26. hoa_fee_annual, 27. ownership_type, 28. county

GROUP E - Taxes & Assessments (29-35):
29. annual_taxes, 30. tax_year, 31. assessed_value, 32. tax_exemptions, 33. property_tax_rate,
34. recent_tax_history, 35. special_assessments

GROUP F - Structure & Systems (36-41):
36. roof_type, 37. roof_age_est, 38. exterior_material, 39. foundation, 40. hvac_type, 41. hvac_age

GROUP G - Interior Features (42-46):
42. flooring_type, 43. kitchen_features, 44. appliances_included, 45. fireplace_yn, 46. interior_condition

GROUP H - Exterior Features (47-51):
47. pool_yn, 48. pool_type, 49. deck_patio, 50. fence, 51. landscaping

GROUP I - Permits & Renovations (52-55):
52. recent_renovations, 53. permit_history_roof, 54. permit_history_hvac, 55. permit_history_other

GROUP J - Schools (56-64):
56. assigned_elementary, 57. elementary_rating, 58. elementary_distance_miles,
59. assigned_middle, 60. middle_rating, 61. middle_distance_miles,
62. assigned_high, 63. high_rating, 64. high_distance_miles

GROUP K - Location Scores (65-72):
65. walk_score, 66. transit_score, 67. bike_score, 68. noise_level, 69. traffic_level,
70. walkability_description, 71. commute_time_city_center, 72. public_transit_access

GROUP L - Distances & Amenities (73-77):
73. distance_grocery_miles, 74. distance_hospital_miles, 75. distance_airport_miles,
76. distance_park_miles, 77. distance_beach_miles

GROUP M - Safety & Crime (78-80):
78. crime_index_violent, 79. crime_index_property, 80. neighborhood_safety_rating

GROUP N - Market & Investment (81-91):
81. median_home_price_neighborhood, 82. price_per_sqft_recent_avg, 83. days_on_market_avg,
84. inventory_surplus, 85. rental_estimate_monthly, 86. rental_yield_est, 87. vacancy_rate_neighborhood,
88. cap_rate_est, 89. insurance_est_annual, 90. financing_terms, 91. comparable_sales

GROUP O - Utilities (92-98):
92. electric_provider, 93. water_provider, 94. sewer_provider, 95. natural_gas,
96. internet_providers_top3, 97. max_internet_speed, 98. cable_tv_provider

GROUP P - Environment & Risk (99-104):
99. air_quality_index_current, 100. flood_zone, 101. flood_risk_level, 102. climate_risk_summary,
103. noise_level_db_est, 104. solar_potential

GROUP Q - Additional Features (105-110):
105. ev_charging_yn, 106. smart_home_features, 107. accessibility_mods, 108. pet_policy,
109. age_restrictions, 110. notes_confidence_summary
`;

const SYSTEM_PROMPT = `You are a real estate data extraction expert. Given a property address, search the web thoroughly and extract as many of the 110 property data fields as possible.

${FIELD_GROUPS}

INSTRUCTIONS:
1. Search Zillow, Redfin, Realtor.com, Trulia for listing data
2. Search county property appraiser/assessor websites for tax and parcel data
3. Search county permit records for roof, HVAC, renovation history
4. Use GreatSchools.org for school assignments and ratings
5. Use WalkScore.com for walk/transit/bike scores
6. Use FEMA flood maps for flood zone data
7. Search for recent comparable sales in the area
8. Estimate rental values from Zillow, Zumper, RentCafe
9. Look up utility providers for the area
10. Make reasonable inferences where direct data isn't available (mark confidence as "Low")

RESPONSE FORMAT:
Return a JSON object with this structure:
{
  "fields": {
    "1_full_address": { "value": "...", "source": "...", "confidence": "High|Medium|Low" },
    "2_mls_primary": { "value": "...", "source": "Zillow", "confidence": "High" },
    ...for all 110 fields
  },
  "sources_searched": ["Zillow", "County Assessor", ...],
  "fields_found": 67,
  "fields_missing": [list of field numbers not found]
}

For fields you cannot find, set value to null and confidence to "Unverified".
Be thorough - search multiple sources and cross-reference data.`;

// Claude API call
async function callClaude(address: string): Promise<any> {
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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Extract all 110 property data fields for this address: ${address}

Search thoroughly across all available web sources. Return the JSON response with all fields you can find.`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.content && data.content[0]?.text) {
      const text = data.content[0].text;
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return { ...JSON.parse(jsonMatch[0]), llm: 'Claude' };
      }
    }
    return { error: 'Failed to parse Claude response', fields: {}, llm: 'Claude' };
  } catch (error) {
    return { error: String(error), fields: {}, llm: 'Claude' };
  }
}

// OpenAI GPT API call
async function callGPT(address: string): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { error: 'OPENAI_API_KEY not set', fields: {} };

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
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Extract all 110 property data fields for this address: ${address}

Search thoroughly across all available web sources. Return the JSON response with all fields you can find.`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.choices && data.choices[0]?.message?.content) {
      const text = data.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return { ...JSON.parse(jsonMatch[0]), llm: 'GPT' };
      }
    }
    return { error: 'Failed to parse GPT response', fields: {}, llm: 'GPT' };
  } catch (error) {
    return { error: String(error), fields: {}, llm: 'GPT' };
  }
}

// Grok API call (xAI)
async function callGrok(address: string): Promise<any> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) return { error: 'GROK_API_KEY not set', fields: {} };

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        max_tokens: 8000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Extract all 110 property data fields for this address: ${address}

Search thoroughly across all available web sources. Return the JSON response with all fields you can find.`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.choices && data.choices[0]?.message?.content) {
      const text = data.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return { ...JSON.parse(jsonMatch[0]), llm: 'Grok' };
      }
    }
    return { error: 'Failed to parse Grok response', fields: {}, llm: 'Grok' };
  } catch (error) {
    return { error: String(error), fields: {}, llm: 'Grok' };
  }
}

// Gemini API call
async function callGemini(address: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { error: 'GEMINI_API_KEY not set', fields: {} };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
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
                  text: `${SYSTEM_PROMPT}

Extract all 110 property data fields for this address: ${address}

Search thoroughly across all available web sources. Return the JSON response with all fields you can find.`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 8000,
          },
        }),
      }
    );

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return { ...JSON.parse(jsonMatch[0]), llm: 'Gemini' };
      }
    }
    return { error: 'Failed to parse Gemini response', fields: {}, llm: 'Gemini' };
  } catch (error) {
    return { error: String(error), fields: {}, llm: 'Gemini' };
  }
}

// Merge results from multiple LLMs
function mergeResults(results: any[]): any {
  const merged: any = {
    fields: {},
    sources: [],
    llm_responses: [],
    conflicts: [],
  };

  const confidenceOrder = { High: 3, Medium: 2, Low: 1, Unverified: 0 };

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

    // Merge fields - highest confidence wins
    for (const [fieldKey, fieldData] of Object.entries(result.fields || {})) {
      const field = fieldData as any;
      if (!field || field.value === null || field.value === undefined || field.value === '') continue;

      const existing = merged.fields[fieldKey];
      const newConfidence = confidenceOrder[field.confidence as keyof typeof confidenceOrder] || 0;
      const existingConfidence = existing ? confidenceOrder[existing.confidence as keyof typeof confidenceOrder] || 0 : -1;

      if (!existing || newConfidence > existingConfidence) {
        merged.fields[fieldKey] = {
          ...field,
          source: `${field.source} (via ${result.llm})`,
        };
      } else if (existing && existing.value !== field.value && newConfidence === existingConfidence) {
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

  // Dedupe sources
  merged.sources = [...new Set(merged.sources)];
  merged.total_fields_found = Object.keys(merged.fields).length;
  merged.completion_percentage = Math.round((merged.total_fields_found / 110) * 100);

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

  // LLMs turned OFF - they hallucinate without web access
  // Only Perplexity has real web search capability
  const { address, url, engines = [], skipLLMs = true } = req.body;

  if (!address && !url) {
    return res.status(400).json({ error: 'Address or URL required' });
  }

  const searchQuery = address || `property at URL: ${url}`;

  try {
    const sources_used: string[] = [];
    let allFields: Record<string, any> = {};

    // STEP 1: Scrape Realtor.com for real property data (FREE)
    console.log('Step 1: Scraping Realtor.com...');
    const realtorData = await scrapeRealtorData(searchQuery);
    if (Object.keys(realtorData).length > 0) {
      Object.assign(allFields, realtorData);
      sources_used.push('Realtor.com');
      console.log(`Found ${Object.keys(realtorData).length} fields from Realtor.com`);
    }

    // STEP 2: Enrich with free APIs (WalkScore, FEMA, AirNow)
    console.log('Step 2: Enriching with free APIs...');
    const enrichedData = await enrichWithFreeAPIs(searchQuery);
    if (Object.keys(enrichedData).length > 0) {
      // Only add fields not already found
      for (const [key, value] of Object.entries(enrichedData)) {
        if (!allFields[key]) {
          allFields[key] = value;
        }
      }
      if (enrichedData['65_walk_score']) sources_used.push('WalkScore');
      if (enrichedData['100_flood_zone']) sources_used.push('FEMA NFHL');
      if (enrichedData['99_air_quality_index_current']) sources_used.push('AirNow');
      if (enrichedData['28_county']) sources_used.push('Google Maps');
      console.log(`Added ${Object.keys(enrichedData).length} fields from free APIs`);
    }

    // STEP 3: Scrape Florida County Property Appraiser
    const county = allFields['28_county']?.value || '';
    if (county) {
      console.log(`Step 3: Scraping ${county} Property Appraiser...`);
      const countyData = await scrapeFloridaCounty(searchQuery, county);
      if (Object.keys(countyData).length > 0) {
        for (const [key, value] of Object.entries(countyData)) {
          if (!allFields[key]) {
            allFields[key] = value;
          }
        }
        sources_used.push(`${county} Property Appraiser`);
        console.log(`Added ${Object.keys(countyData).length} fields from county appraiser`);
      }
    }

    // STEP 3B: Scrape BroadbandNow for internet providers
    console.log('Step 3B: Scraping BroadbandNow for internet data...');
    const internetData = await getInternetProviders(searchQuery);
    if (Object.keys(internetData).length > 0) {
      Object.assign(allFields, internetData);
      sources_used.push('BroadbandNow');
      console.log(`Added ${Object.keys(internetData).length} fields from BroadbandNow`);
    }

    // STEP 4: Call Perplexity for additional real web data
    console.log('Step 4: Calling Perplexity for real web search...');
    const perplexityData = await callPerplexity(searchQuery);
    if (Object.keys(perplexityData).length > 0) {
      for (const [key, value] of Object.entries(perplexityData)) {
        if (!allFields[key]) {
          allFields[key] = value;
        }
      }
      sources_used.push('Perplexity Web Search');
      console.log(`Added ${Object.keys(perplexityData).length} fields from Perplexity`);
    }

    // STEP 3: Use LLMs to fill remaining gaps (optional, costs money)
    let llmResponses: any[] = [];
    if (!skipLLMs && engines.length > 0) {
      console.log('Step 3: Calling LLMs to fill gaps...');
      const promises: Promise<any>[] = [];

      if (engines.includes('claude')) promises.push(callClaude(searchQuery));
      if (engines.includes('gpt')) promises.push(callGPT(searchQuery));
      if (engines.includes('grok')) promises.push(callGrok(searchQuery));
      if (engines.includes('gemini')) promises.push(callGemini(searchQuery));

      const results = await Promise.all(promises);
      const merged = mergeResults(results);
      llmResponses = merged.llm_responses || [];

      // Only add LLM fields that we don't already have from real sources
      for (const [key, value] of Object.entries(merged.fields || {})) {
        if (!allFields[key]) {
          allFields[key] = value;
        }
      }

      if (merged.sources) {
        sources_used.push(...merged.sources.filter((s: string) => !sources_used.includes(s)));
      }
    }

    const total_fields = Object.keys(allFields).length;
    const completion_percentage = Math.round((total_fields / 110) * 100);

    return res.status(200).json({
      success: true,
      address: searchQuery,
      fields: allFields,
      total_fields_found: total_fields,
      completion_percentage,
      sources: sources_used,
      llm_responses: llmResponses,
      strategy: 'real-data-first',
      note: 'Data sourced from Realtor.com scraping and free APIs. LLMs used only to fill gaps.'
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      error: 'Failed to search property',
      details: String(error),
    });
  }
}
