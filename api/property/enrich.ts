/**
 * CLUES Property Search - Data Enrichment APIs
 * Free APIs: WalkScore, FEMA, Google Maps, AirNow
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 1) return {};

    return {
      '65_walk_score': {
        value: `${data.walkscore} - ${data.description}`,
        source: 'WalkScore',
        confidence: 'High'
      },
      '66_transit_score': {
        value: data.transit?.score ? `${data.transit.score} - ${data.transit.description}` : null,
        source: 'WalkScore',
        confidence: 'High'
      },
      '67_bike_score': {
        value: data.bike?.score ? `${data.bike.score} - ${data.bike.description}` : null,
        source: 'WalkScore',
        confidence: 'High'
      },
      '70_walkability_description': {
        value: data.description,
        source: 'WalkScore',
        confidence: 'High'
      }
    };
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

    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const zone = data.features[0].attributes;
      const floodZone = zone.FLD_ZONE || 'Unknown';
      const isHighRisk = ['A', 'AE', 'AH', 'AO', 'V', 'VE'].some(z => floodZone.startsWith(z));

      return {
        '100_flood_zone': {
          value: `FEMA Zone ${floodZone}`,
          source: 'FEMA NFHL',
          confidence: 'High'
        },
        '101_flood_risk_level': {
          value: isHighRisk ? 'High Risk (Special Flood Hazard Area)' : 'Minimal Risk',
          source: 'FEMA NFHL',
          confidence: 'High'
        }
      };
    }

    return {
      '100_flood_zone': {
        value: 'Zone X (Minimal Risk)',
        source: 'FEMA NFHL',
        confidence: 'Medium'
      },
      '101_flood_risk_level': {
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

  // Define places to search for
  const placeTypes = [
    { type: 'grocery_or_supermarket', field: '73_distance_grocery_miles', name: 'Grocery' },
    { type: 'hospital', field: '74_distance_hospital_miles', name: 'Hospital' },
    { type: 'airport', field: '75_distance_airport_miles', name: 'Airport' },
    { type: 'park', field: '76_distance_park_miles', name: 'Park' },
  ];

  for (const place of placeTypes) {
    try {
      // Find nearest place
      const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin}&rankby=distance&type=${place.type}&key=${apiKey}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (searchData.results && searchData.results.length > 0) {
        const nearest = searchData.results[0];
        const destLat = nearest.geometry.location.lat;
        const destLon = nearest.geometry.location.lng;

        // Get distance
        const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destLat},${destLon}&units=imperial&key=${apiKey}`;
        const distRes = await fetch(distUrl);
        const distData = await distRes.json();

        if (distData.rows?.[0]?.elements?.[0]?.distance) {
          const meters = distData.rows[0].elements[0].distance.value;
          const miles = (meters / 1609.34).toFixed(1);

          fields[place.field] = {
            value: parseFloat(miles),
            source: 'Google Maps',
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

// Google Geocode for lat/lon
async function geocodeAddress(address: string): Promise<{ lat: number; lon: number; county: string } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;

      // Find county from address components
      let county = '';
      for (const component of result.address_components) {
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
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.length > 0) {
      const aqi = data[0];
      return {
        '99_air_quality_index_current': {
          value: `${aqi.AQI} - ${aqi.Category.Name}`,
          source: 'AirNow',
          confidence: 'High'
        }
      };
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
    const response = await fetch(url);
    const data = await response.json();

    if (data.rows?.[0]?.elements?.[0]?.duration_in_traffic) {
      const duration = data.rows[0].elements[0].duration_in_traffic.text;
      return {
        '71_commute_time_city_center': {
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

  const { address, lat, lon } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address required' });
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

        result.fields['28_county'] = {
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

    // Call all enrichment APIs in parallel
    const [walkScore, floodZone, distances, airQuality, commuteTime] = await Promise.all([
      getWalkScore(latitude, longitude, address),
      getFloodZone(latitude, longitude),
      getDistances(latitude, longitude),
      getAirQuality(latitude, longitude),
      getCommuteTime(latitude, longitude, city)
    ]);

    // Merge all results
    if (Object.keys(walkScore).length > 0) {
      Object.assign(result.fields, walkScore);
      result.sources_used.push('WalkScore');
    }

    if (Object.keys(floodZone).length > 0) {
      Object.assign(result.fields, floodZone);
      result.sources_used.push('FEMA NFHL');
    }

    if (Object.keys(distances).length > 0) {
      Object.assign(result.fields, distances);
      result.sources_used.push('Google Places/Distance Matrix');
    }

    if (Object.keys(airQuality).length > 0) {
      Object.assign(result.fields, airQuality);
      result.sources_used.push('AirNow');
    }

    if (Object.keys(commuteTime).length > 0) {
      Object.assign(result.fields, commuteTime);
      result.sources_used.push('Google Distance Matrix');
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
