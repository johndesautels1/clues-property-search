/**
 * CLUES Property Free APIs - Reliable third-party data sources
 * These are called BEFORE LLMs because they provide accurate, non-hallucinated data
 */

import { safeFetch } from '../../src/lib/safe-json-parse.js';
import { FBI_CRIME_SOURCE } from './source-constants.js';

export interface ApiField {
  value: string | number | boolean | object | null;
  source: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export interface ApiResult {
  success: boolean;
  source: string;
  fields: Record<string, ApiField>;
  error?: string;
}

// Helper to set field only if value exists
function setField(
  fields: Record<string, ApiField>,
  key: string,
  value: any,
  source: string,
  confidence: 'High' | 'Medium' | 'Low' = 'High'
): void {
  if ((typeof value === 'number' ? !isNaN(value) : true) && value !== null && value !== undefined && value !== '') {
    fields[key] = { value, source, confidence };
  }
}

// ============================================
// GOOGLE GEOCODE API
// ============================================
export async function callGoogleGeocode(address: string): Promise<ApiResult & { lat?: number; lon?: number; county?: string; zip?: string }> {
  const fields: Record<string, ApiField> = {};
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return { success: false, source: 'Google Geocode', fields, error: 'GOOGLE_MAPS_API_KEY not configured' };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const fetchResult = await safeFetch<any>(url, undefined, 'Google-Geocode');

    if (!fetchResult.success || !fetchResult.data) {
      return { success: false, source: 'Google Geocode', fields, error: fetchResult.error || 'Fetch failed' };
    }

    const data = fetchResult.data;

    if (data.status !== 'OK' || !data.results?.[0]) {
      return { success: false, source: 'Google Geocode', fields, error: `Geocode status: ${data.status}` };
    }

    const result = data.results[0];
    const geometry = result.geometry;

    let county = '';
    let neighborhood = '';
    let zip = '';
    let city = '';
    let state = '';

    for (const component of result.address_components) {
      if (component.types.includes('administrative_area_level_2')) {
        county = component.long_name;
      }
      if (component.types.includes('neighborhood') || component.types.includes('sublocality')) {
        neighborhood = component.long_name;
      }
      if (component.types.includes('postal_code')) {
        zip = component.long_name;
      }
      if (component.types.includes('locality')) {
        city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        state = component.short_name;
      }
    }

    // Field numbers aligned with fields-schema.ts (SOURCE OF TRUTH)
    setField(fields, '7_county', county, 'Google Geocode');
    setField(fields, '6_neighborhood', neighborhood, 'Google Geocode');
    setField(fields, '1_full_address', result.formatted_address, 'Google Geocode');
    setField(fields, '8_zip_code', zip, 'Google Geocode');

    if (geometry?.location) {
      setField(fields, 'coordinates', { lat: geometry.location.lat, lon: geometry.location.lng }, 'Google Geocode');
    }

    return {
      success: true,
      source: 'Google Geocode',
      fields,
      lat: geometry?.location?.lat,
      lon: geometry?.location?.lng,
      county,
      zip
    };

  } catch (error) {
    return { success: false, source: 'Google Geocode', fields, error: String(error) };
  }
}

// ============================================
// GOOGLE PLACES API - Nearby Amenities
// ============================================
export async function callGooglePlaces(lat: number, lon: number): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return { success: false, source: 'Google Places', fields, error: 'GOOGLE_MAPS_API_KEY not configured' };
  }

  const origin = `${lat},${lon}`;

  // Field numbers aligned with fields-schema.ts (SOURCE OF TRUTH) - Distances & Amenities (83-87)
  const placeTypes = [
    { type: 'supermarket', field: '83_distance_grocery_mi', name: 'Grocery' },
    { type: 'hospital', field: '84_distance_hospital_mi', name: 'Hospital' },
    { type: 'airport', field: '85_distance_airport_mi', name: 'Airport' },
    { type: 'park', field: '86_distance_park_mi', name: 'Park' },
    { type: 'beach', field: '87_distance_beach_mi', name: 'Beach' },
  ];

  try {
    for (const place of placeTypes) {
      try {
        const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin}&rankby=distance&type=${place.type}&key=${apiKey}`;
        const searchResult = await safeFetch<any>(searchUrl, undefined, `Google-Places-${place.name}`);

        if (!searchResult.success || !searchResult.data?.results?.length) continue;

        const nearest = searchResult.data.results[0];
        const destLat = nearest.geometry?.location?.lat;
        const destLon = nearest.geometry?.location?.lng;

        if (!destLat || !destLon) continue;

        const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destLat},${destLon}&units=imperial&key=${apiKey}`;
        const distResult = await safeFetch<any>(distUrl, undefined, `Google-Distance-${place.name}`);

        if (distResult.success && distResult.data?.rows?.[0]?.elements?.[0]?.distance) {
          const meters = distResult.data.rows[0].elements[0].distance.value;
          const miles = parseFloat((meters / 1609.34).toFixed(1));
          setField(fields, place.field, miles, 'Google Places');
        }
      } catch (e) {
        console.error(`Error getting ${place.name} distance:`, e);
      }
    }

    return { success: Object.keys(fields).length > 0, source: 'Google Places', fields };

  } catch (error) {
    return { success: false, source: 'Google Places', fields, error: String(error) };
  }
}

// ============================================
// WALKSCORE API
// ============================================
export async function callWalkScore(lat: number, lon: number, address: string): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};
  const apiKey = process.env.WALKSCORE_API_KEY;

  if (!apiKey) {
    return { success: false, source: 'WalkScore', fields, error: 'WALKSCORE_API_KEY not configured' };
  }

  try {
    const url = `https://api.walkscore.com/score?format=json&address=${encodeURIComponent(address)}&lat=${lat}&lon=${lon}&wsapikey=${apiKey}&transit=1&bike=1`;
    const fetchResult = await safeFetch<any>(url, undefined, 'WalkScore');

    if (!fetchResult.success || !fetchResult.data) {
      return { success: false, source: 'WalkScore', fields, error: fetchResult.error || 'Fetch failed' };
    }

    const data = fetchResult.data;

    if (data.status !== 1) {
      return { success: false, source: 'WalkScore', fields, error: `WalkScore status: ${data.status}` };
    }

    // Field numbers aligned with fields-schema.ts (SOURCE OF TRUTH) - Location Scores (74-82)
    setField(fields, '74_walk_score', data.walkscore, 'WalkScore');
    setField(fields, '80_walkability_description', data.description, 'WalkScore');

    if (data.transit?.score) {
      setField(fields, '75_transit_score', data.transit.score, 'WalkScore');
    }
    if (data.bike?.score) {
      setField(fields, '76_bike_score', data.bike.score, 'WalkScore');
    }

    return { success: true, source: 'WalkScore', fields };

  } catch (error) {
    return { success: false, source: 'WalkScore', fields, error: String(error) };
  }
}

// ============================================
// FEMA FLOOD ZONE API (Free Government Data)
// ============================================
export async function callFemaFlood(lat: number, lon: number): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};

  try {
    const url = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?where=1%3D1&geometry=${lon}%2C${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE%2CZONE_SUBTY%2CSFHA_TF&returnGeometry=false&f=json`;
    const fetchResult = await safeFetch<any>(url, undefined, 'FEMA-Flood');

    if (!fetchResult.success || !fetchResult.data) {
      return { success: false, source: 'FEMA NFHL', fields, error: fetchResult.error || 'Fetch failed' };
    }

    const data = fetchResult.data;

    if (Array.isArray(data.features) && data.features.length > 0 && data.features[0]?.attributes) {
      const zone = data.features[0].attributes;
      const floodZone = zone.FLD_ZONE || 'Unknown';
      const isHighRisk = ['A', 'AE', 'AH', 'AO', 'V', 'VE'].some(z => floodZone.startsWith(z));

      // Field numbers aligned with fields-schema.ts (SOURCE OF TRUTH) - Environment & Risk (117-130)
      setField(fields, '119_flood_zone', `FEMA Zone ${floodZone}`, 'FEMA NFHL');
      setField(fields, '120_flood_risk_level', isHighRisk ? 'High Risk (Special Flood Hazard Area)' : 'Minimal Risk', 'FEMA NFHL');

      // Note: No separate flood_insurance_required field in 168-field schema
    } else {
      setField(fields, '119_flood_zone', 'Zone X (Minimal Risk)', 'FEMA NFHL', 'Medium');
      setField(fields, '120_flood_risk_level', 'Minimal', 'FEMA NFHL', 'Medium');
    }

    return { success: true, source: 'FEMA NFHL', fields };

  } catch (error) {
    return { success: false, source: 'FEMA NFHL', fields, error: String(error) };
  }
}

// ============================================
// AIRNOW API (Free Government Data)
// ============================================
export async function callAirNow(lat: number, lon: number): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};
  const apiKey = process.env.AIRNOW_API_KEY;

  if (!apiKey) {
    return { success: false, source: 'AirNow', fields, error: 'AIRNOW_API_KEY not configured' };
  }

  try {
    const url = `https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${lat}&longitude=${lon}&distance=25&API_KEY=${apiKey}`;
    const fetchResult = await safeFetch<any[]>(url, undefined, 'AirNow');

    if (!fetchResult.success || !fetchResult.data) {
      return { success: false, source: 'AirNow', fields, error: fetchResult.error || 'Fetch failed' };
    }

    const data = fetchResult.data;

    if (Array.isArray(data) && data.length > 0 && data[0]) {
      const aqi = data[0].AQI;
      const category = data[0].Category?.Name || '';
      // Field numbers aligned with fields-schema.ts (SOURCE OF TRUTH) - Environment & Risk (117-130)
      setField(fields, '117_air_quality_index', aqi, 'AirNow');
      setField(fields, '118_air_quality_grade', category, 'AirNow');
    }

    return { success: Object.keys(fields).length > 0, source: 'AirNow', fields };

  } catch (error) {
    return { success: false, source: 'AirNow', fields, error: String(error) };
  }
}

// ============================================
// SCHOOLDIGGER API
// ============================================
export async function callSchoolDigger(lat: number, lon: number): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};
  const apiKey = process.env.SCHOOLDIGGER_API_KEY;
  const appId = process.env.SCHOOLDIGGER_APP_ID;

  if (!apiKey || !appId) {
    return { success: false, source: 'SchoolDigger', fields, error: 'SCHOOLDIGGER credentials not configured' };
  }

  try {
    // Search for nearby schools
    const url = `https://api.schooldigger.com/v2.0/schools?st=FL&lat=${lat}&lng=${lon}&distanceMiles=5&perPage=20&appID=${appId}&appKey=${apiKey}`;
    const fetchResult = await safeFetch<any>(url, undefined, 'SchoolDigger');

    if (!fetchResult.success || !fetchResult.data) {
      return { success: false, source: 'SchoolDigger', fields, error: fetchResult.error || 'Fetch failed' };
    }

    const data = fetchResult.data;
    const schools = Array.isArray(data.schoolList) ? data.schoolList : [];

    // FIX #7: Single-pass school categorization instead of 3 separate .find() calls
    // Previously: 3 separate array scans O(3n), Now: single pass O(n)
    let elementary: any = null;
    let middle: any = null;
    let high: any = null;
    let schoolDistrict: string | null = null;

    for (const school of schools) {
      // Capture first district we find (for fallback)
      if (!schoolDistrict && school.schoolDistrict) {
        schoolDistrict = school.schoolDistrict;
      }

      // Categorize by school level
      if (!elementary && (school.schoolLevel === 'Elementary' || school.lowGrade === 'K')) {
        elementary = school;
      } else if (!middle && (school.schoolLevel === 'Middle' || school.lowGrade === '6')) {
        middle = school;
      } else if (!high && (school.schoolLevel === 'High' || school.lowGrade === '9')) {
        high = school;
      }

      // Early exit if we found all three
      if (elementary && middle && high) break;
    }

    // Field numbers aligned with fields-schema.ts (SOURCE OF TRUTH) - Assigned Schools (63-73)
    if (elementary) {
      setField(fields, '65_elementary_school', elementary.schoolName, 'SchoolDigger');
      setField(fields, '66_elementary_rating', elementary.rankHistory?.[0]?.rank || elementary.schoolDiggerRank, 'SchoolDigger');
      setField(fields, '67_elementary_distance_mi', elementary.distance, 'SchoolDigger');
    }

    if (middle) {
      setField(fields, '68_middle_school', middle.schoolName, 'SchoolDigger');
      setField(fields, '69_middle_rating', middle.rankHistory?.[0]?.rank || middle.schoolDiggerRank, 'SchoolDigger');
      setField(fields, '70_middle_distance_mi', middle.distance, 'SchoolDigger');
    }

    if (high) {
      setField(fields, '71_high_school', high.schoolName, 'SchoolDigger');
      setField(fields, '72_high_rating', high.rankHistory?.[0]?.rank || high.schoolDiggerRank, 'SchoolDigger');
      setField(fields, '73_high_distance_mi', high.distance, 'SchoolDigger');
    }

    // FIX #13: School district with proper fallback - use captured district or explicit default
    // Note: No school_rating_avg field in 168-field schema
    // School district is field 63
    const district = elementary?.schoolDistrict || middle?.schoolDistrict || high?.schoolDistrict || schoolDistrict;
    if (district) {
      setField(fields, '63_school_district', district, 'SchoolDigger');
    }

    return { success: Object.keys(fields).length > 0, source: 'SchoolDigger', fields };

  } catch (error) {
    return { success: false, source: 'SchoolDigger', fields, error: String(error) };
  }
}

// ============================================
// AIRDNA API - Short-term Rental Data
// ============================================
export async function callAirDNA(lat: number, lon: number, address: string): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};
  const apiKey = process.env.AIRDNA_API_KEY;

  if (!apiKey) {
    return { success: false, source: 'AirDNA', fields, error: 'AIRDNA_API_KEY not configured' };
  }

  try {
    // AirDNA Market endpoint
    const url = `https://api.airdna.co/v1/market/search?access_token=${apiKey}&lat=${lat}&lng=${lon}&radius=1`;
    const fetchResult = await safeFetch<any>(url, undefined, 'AirDNA');

    if (!fetchResult.success || !fetchResult.data) {
      return { success: false, source: 'AirDNA', fields, error: fetchResult.error || 'Fetch failed' };
    }

    const data = fetchResult.data;
    const market = data.market_data || data;

    // STR market data - Note: These fields don't exist in the 168-field schema
    // Mapping to closest market/investment fields (91-103)
    setField(fields, '98_rental_estimate_monthly', market.adr ? Math.round(market.adr * 30) : null, 'AirDNA');
    setField(fields, '99_rental_yield_est', market.occupancy, 'AirDNA');
    // Note: STR-specific fields not in 168-field schema - storing as generic rental data

    return { success: Object.keys(fields).length > 0, source: 'AirDNA', fields };

  } catch (error) {
    return { success: false, source: 'AirDNA', fields, error: String(error) };
  }
}

// ============================================
// HOWLOUD API - Noise Levels
// ============================================
export async function callHowLoud(lat: number, lon: number): Promise<ApiResult> {
  const apiKey = process.env.HOWLOUD_API_KEY;

  if (!apiKey) {
    return { success: false, source: 'HowLoud', fields: {}, error: 'HOWLOUD_API_KEY not configured' };
  }

  const fields: Record<string, ApiField> = {};

  try {
    // HowLoud API v2 endpoint - uses x-api-key header
    const url = `https://api.howloud.com/v2/score?lat=${lat}&lng=${lon}`;
    const fetchResult = await safeFetch<any>(url, {
      headers: {
        'x-api-key': apiKey
      }
    }, 'HowLoud');

    if (!fetchResult.success || !fetchResult.data) {
      return { success: false, source: 'HowLoud', fields, error: fetchResult.error || 'Fetch failed' };
    }

    const data = fetchResult.data;

    // v2 API returns result as an array
    const result = Array.isArray(data.result) ? data.result[0] : (data.result || data);

    // Field numbers aligned with fields-schema.ts (SOURCE OF TRUTH)
    // Field 78 = noise_level, Field 129 = noise_level_db_est
    if (result.score !== undefined) {
      setField(fields, '129_noise_level_db_est', result.score, 'HowLoud');
      setField(fields, '78_noise_level', result.scoretext || (result.score > 70 ? 'Quiet' : result.score > 50 ? 'Moderate' : 'Noisy'), 'HowLoud');
    }

    // Traffic noise → Field 79 traffic_level
    if (result.traffic !== undefined) {
      setField(fields, '79_traffic_level', result.traffic > 70 ? 'Low' : result.traffic > 50 ? 'Moderate' : 'High', 'HowLoud');
    }

    // If still no fields, try alternate field names
    if (Object.keys(fields).length === 0 && data.soundscore !== undefined) {
      setField(fields, '129_noise_level_db_est', data.soundscore, 'HowLoud');
    }

    return { success: Object.keys(fields).length > 0, source: 'HowLoud', fields, error: Object.keys(fields).length === 0 ? `No score in response: ${JSON.stringify(data).slice(0, 200)}` : undefined };

  } catch (error) {
    return { success: false, source: 'HowLoud', fields, error: String(error) };
  }
}

// ============================================
// ============================================
// FCC MOBILE BROADBAND API (Free Government Data)
// ============================================
export async function callBroadbandNow(lat: number, lon: number, address: string): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};

  try {
    // FCC VizMo API - Mobile Broadband data
    const url = `http://vizmo.fcc.gov/api/carrier.json?lat=${lat}&lon=${lon}`;
    const fetchResult = await safeFetch<any>(url, undefined, 'FCC-Broadband');

    if (!fetchResult.success || !fetchResult.data) {
      return { success: false, source: 'FCC Broadband', fields, error: fetchResult.error || 'Fetch failed' };
    }

    const data = fetchResult.data;

    // Extract carrier data with proper typing
    interface CarrierData {
      name: string;
      download_speed?: number;
      lte_coverage?: boolean;
      [key: string]: any;
    }
    const carriers: CarrierData[] = [];
    if (data.att) carriers.push({ name: "AT&T", ...data.att });
    if (data.verizon) carriers.push({ name: "Verizon", ...data.verizon });
    if (data.tmobile) carriers.push({ name: "T-Mobile", ...data.tmobile });
    if (data.sprint) carriers.push({ name: "Sprint", ...data.sprint });

    if (carriers.length > 0) {
      // Find best coverage
      const bestCarrier = carriers.reduce((best, c) =>
        (c.download_speed || 0) > (best.download_speed || 0) ? c : best
      , carriers[0]);

      // Field numbers aligned with fields-schema.ts (SOURCE OF TRUTH) - Utilities & Connectivity (104-116)
      setField(fields, '115_cell_coverage_quality', `${bestCarrier.name} - ${bestCarrier.download_speed} Mbps`, 'FCC VizMo');
      setField(fields, '112_max_internet_speed', `${bestCarrier.download_speed} Mbps`, 'FCC VizMo');

      // Check for LTE/5G coverage
      const has4G = carriers.some(c => c.lte_coverage);
      setField(fields, '113_fiber_available', has4G ? 'LTE Available' : 'No LTE', 'FCC VizMo');
    }

    return { success: Object.keys(fields).length > 0, source: 'FCC VizMo', fields };

  } catch (error) {
    return { success: false, source: 'FCC Broadband', fields, error: String(error) };
  }
}

// ============================================
// FBI CRIME DATA API (Free Government Data)
// ============================================
export async function callCrimeGrade(lat: number, lon: number, address: string): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};
  const apiKey = process.env.FBI_CRIME_API_KEY;

  if (!apiKey) {
    return { success: false, source: FBI_CRIME_SOURCE, fields, error: 'FBI_CRIME_API_KEY not configured' };
  }

  try {
    const stateMatch = address.match(/,\s*([A-Z]{2})\s*\d{5}?/i) || address.match(/,\s*([A-Z]{2})\s*$/i);
    if (!stateMatch) {
      return { success: false, source: FBI_CRIME_SOURCE, fields, error: 'Could not extract state' };
    }

    const stateCode = stateMatch[1].toUpperCase();
    // Use 2022 data (most complete available) with MM-YYYY format
    const url = `https://api.usa.gov/crime/fbi/cde/summarized/state/${stateCode}/violent-crime?from=01-2022&to=12-2022&API_KEY=${apiKey}`;

    const fetchResult = await safeFetch<any>(url, undefined, 'FBI-Crime');

    if (!fetchResult.success || !fetchResult.data) {
      return { success: false, source: FBI_CRIME_SOURCE, fields, error: fetchResult.error || 'Fetch failed' };
    }

    const data = fetchResult.data;

    // FBI API returns keys like "Florida Offenses", "United States Offenses" (not "FL")
    const stateOffensesKey = 'Florida Offenses';
    const usOffensesKey = 'United States Offenses';

    if (data.offenses?.rates?.[stateOffensesKey]) {
      const stateRates = data.offenses.rates[stateOffensesKey];
      const usRates = data.offenses.rates[usOffensesKey];

      // Calculate annual average from monthly rates
      const monthlyRates = Object.values(stateRates).filter((v): v is number => typeof v === 'number');
      if (monthlyRates.length > 0) {
        // Sum monthly rates for annual rate (rates are per 100k per month)
        const annualRate = Math.round(monthlyRates.reduce((a, b) => a + b, 0));
        // Field numbers aligned with fields-schema.ts (SOURCE OF TRUTH) - Safety & Crime (88-90)
        setField(fields, '88_violent_crime_index', annualRate.toString(), FBI_CRIME_SOURCE);

        // Grade based on annual violent crime rate per 100k → Field 90 neighborhood_safety_rating
        let grade = 'A';
        if (annualRate > 500) grade = 'F';
        else if (annualRate > 400) grade = 'D';
        else if (annualRate > 300) grade = 'C';
        else if (annualRate > 200) grade = 'B';

        setField(fields, '90_neighborhood_safety_rating', grade, FBI_CRIME_SOURCE);

        // Compare to US average
        if (usRates) {
          const usMonthlyRates = Object.values(usRates).filter((v): v is number => typeof v === 'number');
          const usAnnualRate = Math.round(usMonthlyRates.reduce((a, b) => a + b, 0));
          const vsNational = Math.round((annualRate / usAnnualRate - 1) * 100);
          // Note: No direct field for crime_vs_national_percent in 168-field schema
        }
      }
    }

    return { success: Object.keys(fields).length > 0, source: FBI_CRIME_SOURCE, fields };

  } catch (error) {
    return { success: false, source: FBI_CRIME_SOURCE, fields, error: String(error) };
  }
}

// ============================================
// WEATHER API - Supports OpenWeatherMap or Weather.com
// ============================================
export async function callWeather(lat: number, lon: number): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};
  const owmKey = process.env.OPENWEATHERMAP_API_KEY;
  const weatherComKey = process.env.WEATHER_API_KEY;

  // Try OpenWeatherMap first if key exists
  if (owmKey) {
    try {
      const owmUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${owmKey}&units=imperial`;
      const owmResult = await safeFetch<any>(owmUrl, undefined, 'OpenWeatherMap');

      if (owmResult.success && owmResult.data) {
        const data = owmResult.data;

        // Note: Weather data is supplementary - not in 168-field schema
        // Storing as metadata only - not mapped to numbered fields
        if (data.main) {
          setField(fields, 'current_temperature', Math.round(data.main.temp), 'OpenWeatherMap');
          setField(fields, 'humidity', data.main.humidity, 'OpenWeatherMap');
        }
        if (data.weather?.[0]) {
          setField(fields, 'weather_description', data.weather[0].description, 'OpenWeatherMap');
        }

        return { success: Object.keys(fields).length > 0, source: 'OpenWeatherMap', fields };
      }
    } catch (e) {
      // OpenWeatherMap failed, try next option
    }
  }

  // Try Weather.com if key exists
  if (weatherComKey) {
    try {
      const url = `https://api.weather.com/v3/wx/conditions/current?geocode=${lat},${lon}&language=en-US&format=json&apiKey=${weatherComKey}`;
      const fetchResult = await safeFetch<any>(url, undefined, 'Weather.com');

      if (fetchResult.success && fetchResult.data) {
        const data = fetchResult.data;
        // Note: Weather data is supplementary - not in 168-field schema
        setField(fields, 'current_temperature', data.temperature, 'Weather.com');
        setField(fields, 'humidity', data.relativeHumidity, 'Weather.com');
        return { success: Object.keys(fields).length > 0, source: 'Weather.com', fields };
      }
    } catch (e) {
      // Weather.com failed, try free fallback
    }
  }

  // Fallback to free Open-Meteo (no API key needed)
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=America%2FNew_York`;
    const fetchResult = await safeFetch<any>(url, undefined, 'Open-Meteo');

    if (fetchResult.success && fetchResult.data) {
      const data = fetchResult.data;

      // Note: Weather data is supplementary - not in 168-field schema
      if (data.current_weather) {
        setField(fields, 'current_temperature', data.current_weather.temperature, 'Open-Meteo');
      }

      if (data.daily?.temperature_2m_max && data.daily?.temperature_2m_min) {
        const avgHigh = data.daily.temperature_2m_max.reduce((a: number, b: number) => a + b, 0) / data.daily.temperature_2m_max.length;
        const avgLow = data.daily.temperature_2m_min.reduce((a: number, b: number) => a + b, 0) / data.daily.temperature_2m_min.length;

        setField(fields, 'avg_high_temp', Math.round(avgHigh), 'Open-Meteo');
        setField(fields, 'avg_low_temp', Math.round(avgLow), 'Open-Meteo');
      }

      return { success: Object.keys(fields).length > 0, source: 'Open-Meteo', fields };
    }
  } catch (e) {}

  return { success: false, source: 'Weather', fields, error: 'No weather API keys configured or all failed' };
}

// ============================================
// HUD FAIR MARKET RENT API (Free Government Data)
// Register for free token at: https://www.huduser.gov/hudapi/public/register
// ============================================
export async function callHudFairMarketRent(zip: string): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};
  const apiKey = process.env.HUD_API_KEY;

  if (!apiKey) {
    return { success: false, source: 'HUD FMR', fields, error: 'HUD_API_KEY not configured' };
  }

  try {
    // HUD FMR API - get Fair Market Rent by ZIP code
    const url = `https://www.huduser.gov/hudapi/public/fmr/data/${zip}`;
    const fetchResult = await safeFetch<any>(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }, 'HUD-FMR');

    if (!fetchResult.success || !fetchResult.data) {
      return { success: false, source: 'HUD FMR', fields, error: fetchResult.error || 'Fetch failed' };
    }

    const data = fetchResult.data;

    // FIX #18: Simplified HUD fallback chain using nullish coalescing
    // Previously: Complex nested fallback chain that was hard to read/maintain
    // Now: Clear nullish coalescing with explicit structure
    const fmrData = data?.data?.basicdata ?? data?.basicdata ?? data ?? null;

    // Extract rent by bedroom count - map to rental_estimate_monthly (field 98)
    // Note: FMR data is supplementary - not all fields in 168-field schema
    if (fmrData) {
      // FIX #18: Use nullish coalescing for cleaner fallbacks
      const twoBedroomRent = fmrData['Two-Bedroom'] ?? fmrData.two_bedroom ?? null;
      if (twoBedroomRent) {
        setField(fields, '98_rental_estimate_monthly', twoBedroomRent, 'HUD FMR');
      }

      // Store other FMR data as metadata (not numbered fields)
      // Using nullish coalescing for each field
      setField(fields, 'fmr_efficiency', fmrData.Efficiency ?? fmrData.efficiency, 'HUD FMR');
      setField(fields, 'fmr_1br', fmrData['One-Bedroom'] ?? fmrData.one_bedroom, 'HUD FMR');
      setField(fields, 'fmr_2br', twoBedroomRent, 'HUD FMR');
      setField(fields, 'fmr_3br', fmrData['Three-Bedroom'] ?? fmrData.three_bedroom, 'HUD FMR');
      setField(fields, 'fmr_4br', fmrData['Four-Bedroom'] ?? fmrData.four_bedroom, 'HUD FMR');
    }

    return { success: Object.keys(fields).length > 0, source: 'HUD FMR', fields };

  } catch (error) {
    return { success: false, source: 'HUD FMR', fields, error: String(error) };
  }
}

// ============================================
// NOAA CLIMATE DATA API - Environmental Risk
// ============================================
export async function callNOAAClimate(lat: number, lon: number, zip: string, county: string): Promise<ApiResult> {
  const apiToken = process.env.NOAA_API_TOKEN || 'LsycRMDcPOllKnOJZLkiyMocmHmtGSQL';
  const fields: Record<string, ApiField> = {};

  try {
    // Get recent 5 years of climate data for risk assessment
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // NOAA Climate Data Online API v2
    const url = `https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&locationid=ZIP:${zip}&startdate=${startDate}&enddate=${endDate}&limit=1000`;

    const fetchResult = await safeFetch<any>(url, {
      headers: {
        'token': apiToken
      }
    }, 'NOAA-Climate');

    if (!fetchResult.success || !fetchResult.data) {
      return { success: false, source: 'NOAA Climate', fields, error: fetchResult.error || 'Fetch failed' };
    }

    const data = fetchResult.data;

    // Analyze climate data for risk assessment
    if (data.results && Array.isArray(data.results)) {
      const results = data.results;

      // Count extreme weather events
      const extremeEvents = results.filter((r: any) =>
        r.datatype === 'PRCP' && parseFloat(r.value) > 50 || // Heavy precipitation
        r.datatype === 'TMAX' && parseFloat(r.value) > 100 || // Extreme heat
        r.datatype === 'TMIN' && parseFloat(r.value) < 0      // Extreme cold
      );

      // Calculate climate risk score (0-100, higher = more risk)
      const riskScore = Math.min(100, Math.round((extremeEvents.length / results.length) * 100));

      let riskLevel = 'Low';
      if (riskScore > 75) riskLevel = 'Very High';
      else if (riskScore > 50) riskLevel = 'High';
      else if (riskScore > 25) riskLevel = 'Moderate';

      // Field 121: climate_risk
      setField(fields, '121_climate_risk', `${riskLevel} (Score: ${riskScore}/100)`, 'NOAA Climate', 'High');
    }

    return { success: Object.keys(fields).length > 0, source: 'NOAA Climate', fields };

  } catch (error) {
    return { success: false, source: 'NOAA Climate', fields, error: String(error) };
  }
}

// ============================================
// NOAA STORM EVENTS API - Hurricane/Tornado Risk
// ============================================
export async function callNOAAStormEvents(county: string, state: string = 'FL'): Promise<ApiResult> {
  const apiToken = process.env.NOAA_API_TOKEN || 'LsycRMDcPOllKnOJZLkiyMocmHmtGSQL';
  const fields: Record<string, ApiField> = {};

  try {
    // Get last 10 years of storm data
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Query storm events by county
    const url = `https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&locationid=FIPS:12&startdate=${startDate}&enddate=${endDate}&datatypeid=AWND,WSF2&limit=1000`;

    const fetchResult = await safeFetch<any>(url, {
      headers: {
        'token': apiToken
      }
    }, 'NOAA-Storm');

    if (!fetchResult.success || !fetchResult.data) {
      return { success: false, source: 'NOAA Storm Events', fields, error: fetchResult.error || 'Fetch failed' };
    }

    const data = fetchResult.data;

    if (data.results && Array.isArray(data.results)) {
      const results = data.results;

      // Analyze wind data for hurricane/tornado risk
      const highWindEvents = results.filter((r: any) =>
        r.datatype === 'WSF2' && parseFloat(r.value) > 50 // Wind gusts > 50 mph
      );

      const hurricaneRiskScore = Math.min(100, Math.round((highWindEvents.length / 10) * 10));
      const tornadoRiskScore = Math.min(100, Math.round((highWindEvents.length / 20) * 10));

      // Florida-specific: High hurricane risk, low tornado risk
      let hurricaneRisk = 'Moderate';
      if (hurricaneRiskScore > 70 || state === 'FL') hurricaneRisk = 'High';
      else if (hurricaneRiskScore > 40) hurricaneRisk = 'Moderate';
      else hurricaneRisk = 'Low';

      let tornadoRisk = 'Low';
      if (tornadoRiskScore > 50) tornadoRisk = 'High';
      else if (tornadoRiskScore > 25) tornadoRisk = 'Moderate';

      // Field 124: hurricane_risk
      setField(fields, '124_hurricane_risk', hurricaneRisk, 'NOAA Storm Events', 'High');

      // Field 125: tornado_risk
      setField(fields, '125_tornado_risk', tornadoRisk, 'NOAA Storm Events', 'Medium');
    }

    return { success: Object.keys(fields).length > 0, source: 'NOAA Storm Events', fields };

  } catch (error) {
    return { success: false, source: 'NOAA Storm Events', fields, error: String(error) };
  }
}

// ============================================
// NOAA SEA LEVEL API - Sea Level Rise Risk
// ============================================
export async function callNOAASeaLevel(lat: number, lon: number): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};

  try {
    // Find nearest NOAA tide station (Florida has many coastal stations)
    // For Tampa Bay area: Station 8726520 (St. Petersburg)
    // For general use: This is a simplified implementation

    // Florida coastal stations by region
    const floridaStations: Record<string, { id: string; name: string; lat: number; lon: number }> = {
      'tampa_bay': { id: '8726520', name: 'St. Petersburg', lat: 27.76, lon: -82.63 },
      'clearwater': { id: '8726724', name: 'Clearwater Beach', lat: 27.98, lon: -82.83 },
      'naples': { id: '8725110', name: 'Naples', lat: 26.13, lon: -81.81 },
      'miami': { id: '8723170', name: 'Miami Beach', lat: 25.77, lon: -80.13 },
      'key_west': { id: '8724580', name: 'Key West', lat: 24.55, lon: -81.81 },
    };

    // Find nearest station (simplified - using Tampa Bay as default for FL properties)
    const station = floridaStations.tampa_bay;

    // NOAA Tides & Currents API - Get water level trends
    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${station.id}&product=water_level&datum=MLLW&time_zone=lst_ldt&units=english&format=json&range=720`;

    const fetchResult = await safeFetch<any>(url, undefined, 'NOAA-SeaLevel');

    if (!fetchResult.success || !fetchResult.data) {
      return { success: false, source: 'NOAA Sea Level', fields, error: fetchResult.error || 'Fetch failed' };
    }

    const data = fetchResult.data;

    // Analyze sea level trends
    if (data.data && Array.isArray(data.data)) {
      // For Florida coastal properties, sea level rise is a known risk
      // NOAA data shows 3-4mm/year rise in Tampa Bay
      const distanceToCoast = Math.sqrt(Math.pow(lat - station.lat, 2) + Math.pow(lon - station.lon, 2)) * 69; // miles

      let seaLevelRisk = 'Low';
      if (distanceToCoast < 5) seaLevelRisk = 'High';
      else if (distanceToCoast < 15) seaLevelRisk = 'Moderate';
      else if (distanceToCoast < 30) seaLevelRisk = 'Low';
      else seaLevelRisk = 'Minimal';

      // Field 128: sea_level_rise_risk
      setField(fields, '128_sea_level_rise_risk', `${seaLevelRisk} (${Math.round(distanceToCoast)} mi from coast)`, 'NOAA Sea Level', 'Medium');
    }

    return { success: Object.keys(fields).length > 0, source: 'NOAA Sea Level', fields };

  } catch (error) {
    return { success: false, source: 'NOAA Sea Level', fields, error: String(error) };
  }
}

// ============================================
// USGS ELEVATION API - Property Elevation
// ============================================
export async function callUSGSElevation(lat: number, lon: number): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};

  try {
    // USGS National Map Elevation Point Query Service
    const url = `https://epqs.nationalmap.gov/v1/json?x=${lon}&y=${lat}&units=Feet&output=json`;

    const fetchResult = await safeFetch<any>(url, undefined, 'USGS-Elevation');

    if (!fetchResult.success || !fetchResult.data) {
      return { success: false, source: 'USGS Elevation', fields, error: fetchResult.error || 'Fetch failed' };
    }

    const data = fetchResult.data;

    // Extract elevation (value field)
    if (data.value !== undefined && data.value !== null) {
      const elevation = Math.round(data.value);

      // Only set if > 0 (0 means water or no data)
      if (elevation > 0) {
        // Field 64: elevation_feet
        setField(fields, '64_elevation_feet', elevation, 'USGS Elevation', 'High');
      }
    }

    return { success: Object.keys(fields).length > 0, source: 'USGS Elevation', fields };

  } catch (error) {
    return { success: false, source: 'USGS Elevation', fields, error: String(error) };
  }
}

// ============================================
// USGS EARTHQUAKE API - Seismic Risk
// ============================================
export async function callUSGSEarthquake(lat: number, lon: number): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};

  try {
    // Query last 30 years of earthquakes within 100km radius
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Create bounding box (roughly 100km radius)
    const latBuffer = 0.9; // ~100km
    const lonBuffer = 1.2; // ~100km (adjusted for latitude)

    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startDate}&endtime=${endDate}&minlatitude=${lat - latBuffer}&maxlatitude=${lat + latBuffer}&minlongitude=${lon - lonBuffer}&maxlongitude=${lon + lonBuffer}&minmagnitude=2.0`;

    const fetchResult = await safeFetch<any>(url, undefined, 'USGS-Earthquake');

    if (!fetchResult.success || !fetchResult.data) {
      return { success: false, source: 'USGS Earthquake', fields, error: fetchResult.error || 'Fetch failed' };
    }

    const data = fetchResult.data;

    // Analyze earthquake history
    if (data.features && Array.isArray(data.features)) {
      const earthquakes = data.features;
      const count = earthquakes.length;

      // Florida has VERY low seismic activity
      let riskLevel = 'Minimal';
      if (count > 10) riskLevel = 'Moderate';
      else if (count > 5) riskLevel = 'Low';
      else if (count > 0) riskLevel = 'Very Low';

      // Field 123: earthquake_risk
      setField(fields, '123_earthquake_risk', `${riskLevel} (${count} events in 30 years)`, 'USGS Earthquake', 'High');
    }

    return { success: Object.keys(fields).length > 0, source: 'USGS Earthquake', fields };

  } catch (error) {
    return { success: false, source: 'USGS Earthquake', fields, error: String(error) };
  }
}

// ============================================
// EPA FRS API - Superfund & Hazardous Sites
// ============================================
export async function callEPAFRS(lat: number, lon: number): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};

  try {
    // EPA Facility Registry Service - search within 5 mile radius
    // Filter for Superfund (SEMS) sites
    const url = `https://frs-public.epa.gov/ords/frs_public2/frs_rest_services.get_facilities?latitude83=${lat}&longitude83=${lon}&search_radius=5&pgm_sys_acrnm=SEMS&output=JSON`;

    const fetchResult = await safeFetch<any>(url, undefined, 'EPA-FRS');

    if (!fetchResult.success || !fetchResult.data) {
      return { success: false, source: 'EPA FRS', fields, error: fetchResult.error || 'Fetch failed' };
    }

    const data = fetchResult.data;

    // Parse facilities
    if (data.Results && data.Results.FRSFacility) {
      const facilities = Array.isArray(data.Results.FRSFacility)
        ? data.Results.FRSFacility
        : [data.Results.FRSFacility];

      // Since we filtered by pgm_sys_acrnm=SEMS in the query, all results are Superfund sites
      if (facilities.length > 0) {
        // Calculate distance to nearest site
        const facilitiesWithDistance = facilities.map((f: any) => {
          const facilityLat = parseFloat(f.Latitude83);
          const facilityLon = parseFloat(f.Longitude83);

          // Haversine distance calculation
          const R = 3959; // Earth's radius in miles
          const dLat = (facilityLat - lat) * Math.PI / 180;
          const dLon = (facilityLon - lon) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat * Math.PI / 180) * Math.cos(facilityLat * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;

          return { ...f, calculatedDistance: distance };
        });

        // Sort by distance
        facilitiesWithDistance.sort((a, b) => a.calculatedDistance - b.calculatedDistance);

        const nearestSite = facilitiesWithDistance[0];
        const facilityName = nearestSite.FacilityName || 'Unknown';
        const distance = nearestSite.calculatedDistance.toFixed(1);

        // Field 127: superfund_site_nearby
        setField(fields, '127_superfund_site_nearby', `Yes - ${facilityName} (${distance} mi)`, 'EPA FRS', 'High');
      } else {
        // No Superfund sites within 5 miles
        setField(fields, '127_superfund_site_nearby', 'No sites within 5 miles', 'EPA FRS', 'High');
      }
    } else {
      // No results object means no sites found
      setField(fields, '127_superfund_site_nearby', 'No sites within 5 miles', 'EPA FRS', 'High');
    }

    return { success: Object.keys(fields).length > 0, source: 'EPA FRS', fields };

  } catch (error) {
    return { success: false, source: 'EPA FRS', fields, error: String(error) };
  }
}

// ============================================
// EPA RADON - County-Based Risk Assessment
// ============================================
export async function getRadonRisk(county: string, state: string = 'FL'): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};

  try {
    // EPA Radon Zone Map (static data by county)
    // Zone 1 = High, Zone 2 = Moderate, Zone 3 = Low

    // Florida counties are predominantly Zone 3 (Low Risk)
    // Source: EPA Map of Radon Zones
    const FLORIDA_RADON_ZONES: Record<string, string> = {
      // All Florida counties are Zone 3 (Low) per EPA
      'Pinellas': 'Zone 3 (Low)',
      'Hillsborough': 'Zone 3 (Low)',
      'Pasco': 'Zone 3 (Low)',
      'Polk': 'Zone 3 (Low)',
      'Manatee': 'Zone 3 (Low)',
      'Sarasota': 'Zone 3 (Low)',
      'Miami-Dade': 'Zone 3 (Low)',
      'Broward': 'Zone 3 (Low)',
      'Palm Beach': 'Zone 3 (Low)',
      'Orange': 'Zone 3 (Low)',
      'Duval': 'Zone 3 (Low)',
      // Default for all FL counties
      'DEFAULT': 'Zone 3 (Low)'
    };

    const radonZone = FLORIDA_RADON_ZONES[county] || FLORIDA_RADON_ZONES['DEFAULT'];

    // Field 126: radon_risk
    setField(fields, '126_radon_risk', radonZone, 'EPA Radon', 'High');

    return { success: true, source: 'EPA Radon', fields };

  } catch (error) {
    return { success: false, source: 'EPA Radon', fields, error: String(error) };
  }
}

// ============================================
// REDFIN API - Property Details & Estimates
// ============================================
export async function callRedfinProperty(address: string): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};

  try {
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'redfin5.p.rapidapi.com';

    if (!RAPIDAPI_KEY) {
      console.log('[Redfin] API key not configured, skipping');
      return { success: false, source: 'Redfin', fields };
    }

    const headers = {
      'x-rapidapi-host': RAPIDAPI_HOST,
      'x-rapidapi-key': RAPIDAPI_KEY
    };

    // Step 1: Get Redfin property URL from autocomplete
    const autocompleteUrl = `https://${RAPIDAPI_HOST}/auto-complete?query=${encodeURIComponent(address)}`;
    const autocompleteResult = await safeFetch<any>(autocompleteUrl, { headers }, 'Redfin-Autocomplete');

    if (!autocompleteResult.success || !autocompleteResult.data) {
      console.log('[Redfin] Autocomplete failed:', autocompleteResult.error);
      return { success: false, source: 'Redfin', fields };
    }

    // Get the property URL from autocomplete response
    const exactMatch = autocompleteResult.data.payload?.exactMatch;
    const redfinUrl = exactMatch?.url;

    if (!redfinUrl) {
      console.log('[Redfin] No property URL found in autocomplete');
      return { success: false, source: 'Redfin', fields };
    }

    console.log('[Redfin] Found property URL:', redfinUrl);

    // Step 2: Get comprehensive property details
    const detailsUrl = `https://${RAPIDAPI_HOST}/properties/get-info?url=${encodeURIComponent(redfinUrl)}`;
    const detailsResult = await safeFetch<any>(detailsUrl, { headers }, 'Redfin-Details');

    if (!detailsResult.success || !detailsResult.data) {
      console.log('[Redfin] Property details failed:', detailsResult.error);
      return { success: false, source: 'Redfin', fields };
    }

    const addressInfo = detailsResult.data.aboveTheFold?.addressSectionInfo;

    if (addressInfo) {
      // Field 16: Redfin Estimate (AVM)
      if (addressInfo.avmInfo?.predictedValue) {
        setField(fields, '16_redfin_estimate', Math.round(addressInfo.avmInfo.predictedValue), 'Redfin', 'High');
      }

      // Field 14: Last Sale Price
      if (addressInfo.latestPriceInfo?.amount) {
        setField(fields, '14_last_sale_price', addressInfo.latestPriceInfo.amount, 'Redfin', 'High');
      }

      // Field 13: Last Sale Date
      if (addressInfo.soldDate) {
        const soldDate = new Date(addressInfo.soldDate);
        setField(fields, '13_last_sale_date', soldDate.toISOString().split('T')[0], 'Redfin', 'High');
      }

      // Field 17: Bedrooms
      if (addressInfo.beds) {
        setField(fields, '17_bedrooms', addressInfo.beds, 'Redfin', 'High');
      }

      // Field 18: Total Bathrooms
      if (addressInfo.baths) {
        setField(fields, '18_total_bathrooms', addressInfo.baths, 'Redfin', 'High');
      }

      // Field 21: Living Square Feet
      if (addressInfo.sqFt?.value) {
        setField(fields, '21_living_sqft', addressInfo.sqFt.value, 'Redfin', 'High');
      }

      // Field 23: Lot Size (Square Feet)
      if (addressInfo.lotSize) {
        setField(fields, '23_lot_size_sqft', addressInfo.lotSize, 'Redfin', 'High');
      }

      // Field 25: Year Built
      if (addressInfo.yearBuilt) {
        setField(fields, '25_year_built', addressInfo.yearBuilt, 'Redfin', 'High');
      }

      // Field 34: Parcel ID (APN)
      if (addressInfo.apn) {
        setField(fields, '34_parcel_id', addressInfo.apn, 'Redfin', 'High');
      }

      // Field 11: Price Per Square Foot
      if (addressInfo.pricePerSqFt) {
        setField(fields, '11_price_per_sqft', addressInfo.pricePerSqFt, 'Redfin', 'High');
      }
    }

    // Step 3: Get WalkScore data from Redfin
    const walkScoreUrl = `https://${RAPIDAPI_HOST}/properties/get-walk-score?url=${encodeURIComponent(redfinUrl)}`;
    const walkScoreResult = await safeFetch<any>(walkScoreUrl, { headers }, 'Redfin-WalkScore');

    if (walkScoreResult.success && walkScoreResult.data) {
      // Field 61: Walk Score
      if (walkScoreResult.data.walkScore?.value) {
        setField(fields, '61_walk_score', walkScoreResult.data.walkScore.value, 'Redfin', 'High');
      }

      // Field 62: Transit Score
      if (walkScoreResult.data.transitScore?.value) {
        setField(fields, '62_transit_score', walkScoreResult.data.transitScore.value, 'Redfin', 'High');
      }

      // Field 63: Bike Score
      if (walkScoreResult.data.bikeScore?.value) {
        setField(fields, '63_bike_score', walkScoreResult.data.bikeScore.value, 'Redfin', 'High');
      }
    }

    console.log(`[Redfin] Successfully extracted ${Object.keys(fields).length} fields`);
    return { success: Object.keys(fields).length > 0, source: 'Redfin', fields };

  } catch (error) {
    console.error('[Redfin] Error:', error);
    return { success: false, source: 'Redfin', fields, error: String(error) };
  }
}
