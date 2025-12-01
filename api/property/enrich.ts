/**
 * CLUES Property Search - Data Enrichment APIs
 * Free APIs: WalkScore, FEMA, Google Maps, AirNow
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sanitizeAddress, isValidAddress, safeFetch } from '../../src/lib/safe-json-parse.js';

interface EnrichmentResult {
  fields: Record<string, any>;
  sources_used: string[];
  errors: string[];
}

// WalkScore API (free tier: 5,000/day)
async function getWalkScore(lat: number, lon: number, address: string): Promise<Record<string, any>> {
  const apiKey = process.env.WALKSCORE_API_KEY;
  if (!apiKey) return {};

  try {
    const url = `https://api.walkscore.com/score?format=json&address=${encodeURIComponent(address)}&lat=${lat}&lon=${lon}&wsapikey=${apiKey}`;
    const result = await safeFetch<any>(url, undefined, 'WalkScore');

    if (!result.success || !result.data) return {};
    const data = result.data;

    if (data.status !== 1) return {};

    // Null-safe access to all score properties
    const walkScore = data.walkscore;
    const walkDesc = data.description;
    const transitScore = data.transit?.score;
    const transitDesc = data.transit?.description;
    const bikeScore = data.bike?.score;
    const bikeDesc = data.bike?.description;

    // Only include fields with valid data
    const fields: Record<string, any> = {};

    // Field numbers aligned with fields-schema.ts (SOURCE OF TRUTH) - Location Scores (74-82)
    if (walkScore !== undefined && walkDesc) {
      fields['74_walk_score'] = {
        value: `${walkScore} - ${walkDesc}`,
        source: 'WalkScore',
        confidence: 'High'
      };
    }

    if (transitScore !== undefined && transitDesc) {
      fields['75_transit_score'] = {
        value: `${transitScore} - ${transitDesc}`,
        source: 'WalkScore',
        confidence: 'High'
      };
    }

    if (bikeScore !== undefined && bikeDesc) {
      fields['76_bike_score'] = {
        value: `${bikeScore} - ${bikeDesc}`,
        source: 'WalkScore',
        confidence: 'High'
      };
    }

    if (walkDesc) {
      fields['80_walkability_description'] = {
        value: walkDesc,
        source: 'WalkScore',
        confidence: 'High'
      };
    }

    return fields;
  } catch (e) {
    console.error('WalkScore error:', e);
    return {};
  }
}

// FEMA Flood Zone API (completely free)
async function getFloodZone(lat: number, lon: number): Promise<Record<string, any>> {
  try {
    // FEMA National Flood Hazard Layer API
    const url = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?where=1%3D1&geometry=${lon}%2C${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE%2CZONE_SUBTY%2CSFHA_TF&returnGeometry=false&f=json`;

    const result = await safeFetch<any>(url, undefined, 'FEMA');

    if (!result.success || !result.data) return {};
    const data = result.data;

    if (Array.isArray(data.features) && data.features.length > 0) {
      const zone = data.features[0]?.attributes;
      if (!zone) return {};

      const floodZone = zone.FLD_ZONE || 'Unknown';
      const isHighRisk = ['A', 'AE', 'AH', 'AO', 'V', 'VE'].some(z => floodZone.startsWith(z));

      // Field numbers aligned with fields-schema.ts (SOURCE OF TRUTH) - Environment & Risk (117-130)
      return {
        '119_flood_zone': {
          value: `FEMA Zone ${floodZone}`,
          source: 'FEMA NFHL',
          confidence: 'High'
        },
        '120_flood_risk_level': {
          value: isHighRisk ? 'High Risk (Special Flood Hazard Area)' : 'Minimal Risk',
          source: 'FEMA NFHL',
          confidence: 'High'
        }
      };
    }

    return {
      '119_flood_zone': {
        value: 'Zone X (Minimal Risk)',
        source: 'FEMA NFHL',
        confidence: 'Medium'
      },
      '120_flood_risk_level': {
        value: 'Minimal',
        source: 'FEMA NFHL',
        confidence: 'Medium'
      }
    };
  } catch (e) {
    console.error('FEMA error:', e);
    return {};
  }
}

// Google Maps Distance Matrix
async function getDistances(lat: number, lon: number): Promise<Record<string, any>> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return {};

  const origin = `${lat},${lon}`;
  const fields: Record<string, any> = {};

  // Field numbers aligned with fields-schema.ts (SOURCE OF TRUTH) - Distances & Amenities (83-87)
  const placeTypes = [
    { type: 'grocery_or_supermarket', field: '83_distance_grocery_mi', name: 'Grocery' },
    { type: 'hospital', field: '84_distance_hospital_mi', name: 'Hospital' },
    { type: 'airport', field: '85_distance_airport_mi', name: 'Airport' },
    { type: 'park', field: '86_distance_park_mi', name: 'Park' },
  ];

  for (const place of placeTypes) {
    try {
      // Find nearest place
      const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin}&rankby=distance&type=${place.type}&key=${apiKey}`;
      const searchResult = await safeFetch<any>(searchUrl, undefined, `Google-${place.name}`);

      if (!searchResult.success || !searchResult.data?.results?.length) continue;
      const searchData = searchResult.data;

      const nearest = searchData.results[0];
      const destLat = nearest.geometry?.location?.lat;
      const destLon = nearest.geometry?.location?.lng;

      if (!destLat || !destLon) continue;

      // Get distance
      const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destLat},${destLon}&units=imperial&key=${apiKey}`;
      const distResult = await safeFetch<any>(distUrl, undefined, `Google-Distance-${place.name}`);

      if (distResult.success && distResult.data?.rows?.[0]?.elements?.[0]?.distance) {
        const meters = distResult.data.rows[0].elements[0].distance.value;
        const miles = (meters / 1609.34).toFixed(1);

        fields[place.field] = {
          value: parseFloat(miles),
          source: 'Google Maps',
          confidence: 'High',
          details: nearest.name
        };
      }
    } catch (e) {
      console.error(`Error getting ${place.name} distance:`, e);
    }
  }

  return fields;
}

// Google Geocode for lat/lon
async function geocodeAddress(address: string): Promise<{ lat: number; lon: number; county: string } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const fetchResult = await safeFetch<any>(url, undefined, 'Google-Geocode');

    if (!fetchResult.success || !fetchResult.data) return null;
    const data = fetchResult.data;

    if (data.results && data.results.length > 0) {
      const geoResult = data.results[0];
      const location = geoResult.geometry?.location;

      if (!location) return null;

      // Find county from address components
      let county = '';
      for (const component of geoResult.address_components || []) {
        if (component.types.includes('administrative_area_level_2')) {
          county = component.long_name;
          break;
        }
      }

      return {
        lat: location.lat,
        lon: location.lng,
        county
      };
    }
  } catch (e) {
    console.error('Geocode error:', e);
  }

  return null;
}

// AirNow API (free with key)
async function getAirQuality(lat: number, lon: number): Promise<Record<string, any>> {
  const apiKey = process.env.AIRNOW_API_KEY;
  if (!apiKey) return {};

  try {
    const url = `https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${lat}&longitude=${lon}&distance=25&API_KEY=${apiKey}`;
    const result = await safeFetch<any[]>(url, undefined, 'AirNow');

    if (!result.success || !result.data) return {};
    const data = result.data;

    // Field numbers aligned with fields-schema.ts (SOURCE OF TRUTH) - Environment & Risk (117-130)
    if (Array.isArray(data) && data.length > 0) {
      const aqi = data[0];
      // Null-safe access to AQI and Category
      const aqiValue = aqi?.AQI;
      const categoryName = aqi?.Category?.Name;

      if (aqiValue !== undefined && categoryName) {
        return {
          '117_air_quality_index': {
            value: `${aqiValue} - ${categoryName}`,
            source: 'AirNow',
            confidence: 'High'
          }
        };
      }
    }
  } catch (e) {
    console.error('AirNow error:', e);
  }

  return {};
}

// Commute time to downtown (using Google)
async function getCommuteTime(lat: number, lon: number, city: string): Promise<Record<string, any>> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return {};

  // Map cities to their downtown coordinates
  const downtowns: Record<string, string> = {
    'tampa': '27.9506,-82.4572',
    'st pete': '27.7676,-82.6403',
    'st petersburg': '27.7676,-82.6403',
    'clearwater': '27.9659,-82.8001',
    'orlando': '28.5383,-81.3792',
    'miami': '25.7617,-80.1918',
    'jacksonville': '30.3322,-81.6557',
  };

  const cityLower = city.toLowerCase();
  let downtown = downtowns['tampa']; // Default to Tampa

  for (const [name, coords] of Object.entries(downtowns)) {
    if (cityLower.includes(name)) {
      downtown = coords;
      break;
    }
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lon}&destinations=${downtown}&departure_time=now&key=${apiKey}`;
    const result = await safeFetch<any>(url, undefined, 'Google-Commute');

    if (!result.success || !result.data) return {};

    // Field numbers aligned with fields-schema.ts (SOURCE OF TRUTH) - Location Scores (74-82)
    if (result.data.rows?.[0]?.elements?.[0]?.duration_in_traffic) {
      const duration = result.data.rows[0].elements[0].duration_in_traffic.text;
      return {
        '82_commute_to_city_center': {
          value: duration,
          source: 'Google Maps',
          confidence: 'High'
        }
      };
    }
  } catch (e) {
    console.error('Commute time error:', e);
  }

  return {};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address: rawAddress, lat, lon } = req.body;

  // 🛡️ INPUT SANITIZATION: Prevent prompt injection attacks
  const address = sanitizeAddress(rawAddress);

  if (!address) {
    return res.status(400).json({ error: 'Address required' });
  }

  // Validate address format
  if (!isValidAddress(address)) {
    return res.status(400).json({ error: 'Invalid address format' });
  }

  // Validate lat/lon if provided (must be numbers in valid range)
  if (lat !== undefined && (typeof lat !== 'number' || lat < -90 || lat > 90)) {
    return res.status(400).json({ error: 'Invalid latitude' });
  }
  if (lon !== undefined && (typeof lon !== 'number' || lon < -180 || lon > 180)) {
    return res.status(400).json({ error: 'Invalid longitude' });
  }

  const result: EnrichmentResult = {
    fields: {},
    sources_used: [],
    errors: []
  };

  try {
    // Get coordinates if not provided
    let latitude = lat;
    let longitude = lon;
    let county = '';

    if (!latitude || !longitude) {
      const geo = await geocodeAddress(address);
      if (geo) {
        latitude = geo.lat;
        longitude = geo.lon;
        county = geo.county;

        // Field 7 = county per fields-schema.ts
        result.fields['7_county'] = {
          value: county,
          source: 'Google Maps',
          confidence: 'High'
        };
        result.sources_used.push('Google Geocoding');
      } else {
        result.errors.push('Could not geocode address');
        return res.status(200).json(result);
      }
    }

    // Parse city from address for commute calculation
    const addressParts = address.split(',');
    const city = addressParts[1]?.trim() || 'Tampa';

    // Call all enrichment APIs in parallel with Promise.allSettled
    // This ensures one failed API doesn't crash all others
    const apiResults = await Promise.allSettled([
      getWalkScore(latitude, longitude, address),
      getFloodZone(latitude, longitude),
      getDistances(latitude, longitude),
      getAirQuality(latitude, longitude),
      getCommuteTime(latitude, longitude, city)
    ]);

    // Process results with proper error handling
    const [walkScoreResult, floodZoneResult, distancesResult, airQualityResult, commuteTimeResult] = apiResults;

    // WalkScore
    if (walkScoreResult.status === 'fulfilled' && Object.keys(walkScoreResult.value).length > 0) {
      Object.assign(result.fields, walkScoreResult.value);
      result.sources_used.push('WalkScore');
    } else if (walkScoreResult.status === 'rejected') {
      result.errors.push(`WalkScore: ${String(walkScoreResult.reason)}`);
    }

    // FEMA Flood Zone
    if (floodZoneResult.status === 'fulfilled' && Object.keys(floodZoneResult.value).length > 0) {
      Object.assign(result.fields, floodZoneResult.value);
      result.sources_used.push('FEMA NFHL');
    } else if (floodZoneResult.status === 'rejected') {
      result.errors.push(`FEMA: ${String(floodZoneResult.reason)}`);
    }

    // Google Distances
    if (distancesResult.status === 'fulfilled' && Object.keys(distancesResult.value).length > 0) {
      Object.assign(result.fields, distancesResult.value);
      result.sources_used.push('Google Places/Distance Matrix');
    } else if (distancesResult.status === 'rejected') {
      result.errors.push(`Google Distances: ${String(distancesResult.reason)}`);
    }

    // AirNow
    if (airQualityResult.status === 'fulfilled' && Object.keys(airQualityResult.value).length > 0) {
      Object.assign(result.fields, airQualityResult.value);
      result.sources_used.push('AirNow');
    } else if (airQualityResult.status === 'rejected') {
      result.errors.push(`AirNow: ${String(airQualityResult.reason)}`);
    }

    // Commute Time
    if (commuteTimeResult.status === 'fulfilled' && Object.keys(commuteTimeResult.value).length > 0) {
      Object.assign(result.fields, commuteTimeResult.value);
      result.sources_used.push('Google Distance Matrix');
    } else if (commuteTimeResult.status === 'rejected') {
      result.errors.push(`Commute Time: ${String(commuteTimeResult.reason)}`);
    }

    // Add coordinates to response
    result.fields['coordinates'] = {
      value: { lat: latitude, lon: longitude },
      source: 'Google Maps',
      confidence: 'High'
    };

    return res.status(200).json({
      success: true,
      ...result,
      fields_found: Object.keys(result.fields).length
    });

  } catch (error) {
    console.error('Enrichment error:', error);
    return res.status(500).json({
      error: 'Enrichment failed',
      details: String(error)
    });
  }
}
