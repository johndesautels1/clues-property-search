/**
 * CLUES Property Free APIs - Reliable third-party data sources
 * These are called BEFORE LLMs because they provide accurate, non-hallucinated data
 */

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
    const response = await fetch(url);
    const data = await response.json();

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
    setField(fields, '7_county', county, 'Google Maps');
    setField(fields, '6_neighborhood', neighborhood, 'Google Maps');
    setField(fields, '1_full_address', result.formatted_address, 'Google Maps');
    setField(fields, '8_zip_code', zip, 'Google Maps');

    if (geometry?.location) {
      setField(fields, 'coordinates', { lat: geometry.location.lat, lon: geometry.location.lng }, 'Google Maps');
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
            const miles = parseFloat((meters / 1609.34).toFixed(1));
            setField(fields, place.field, miles, 'Google Places');
          }
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
    const response = await fetch(url);
    const data = await response.json();

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
    const response = await fetch(url);
    const data = await response.json();

    if (data.features?.[0]) {
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
    const response = await fetch(url);
    const data = await response.json();

    if (data?.[0]) {
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
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, source: 'SchoolDigger', fields, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    const schools = data.schoolList || [];

    // Find closest elementary, middle, high schools
    const elementary = schools.find((s: any) => s.schoolLevel === 'Elementary' || s.lowGrade === 'K');
    const middle = schools.find((s: any) => s.schoolLevel === 'Middle' || s.lowGrade === '6');
    const high = schools.find((s: any) => s.schoolLevel === 'High' || s.lowGrade === '9');

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

    // Note: No school_rating_avg field in 168-field schema
    // School district is field 63
    if (elementary?.schoolDistrict || middle?.schoolDistrict || high?.schoolDistrict) {
      const district = elementary?.schoolDistrict || middle?.schoolDistrict || high?.schoolDistrict;
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
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, source: 'AirDNA', fields, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
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
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey
      }
    });

    if (!response.ok) {
      return { success: false, source: 'HowLoud', fields, error: `HTTP ${response.status}` };
    }

    const data = await response.json();

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
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, source: 'FCC Broadband', fields, error: `HTTP ${response.status}` };
    }

    const data = await response.json();

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
    return { success: false, source: 'FBI Crime Data', fields, error: 'FBI_CRIME_API_KEY not configured' };
  }

  try {
    const stateMatch = address.match(/,\s*([A-Z]{2})\s*\d{5}?/i) || address.match(/,\s*([A-Z]{2})\s*$/i);
    if (!stateMatch) {
      return { success: false, source: 'FBI Crime Data', fields, error: 'Could not extract state' };
    }

    const stateCode = stateMatch[1].toUpperCase();
    // Use 2022 data (most complete available) with MM-YYYY format
    const url = `https://api.usa.gov/crime/fbi/cde/summarized/state/${stateCode}/violent-crime?from=01-2022&to=12-2022&API_KEY=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      return { success: false, source: 'FBI UCR', fields, error: 'HTTP ' + response.status };
    }

    const data = await response.json();

    // New API format returns monthly rates in offenses.rates[State]
    if (data.offenses?.rates?.[stateCode] || data.offenses?.rates?.Florida) {
      const stateRates = data.offenses.rates[stateCode] || data.offenses.rates.Florida;
      const usRates = data.offenses.rates['United States'];

      // Calculate annual average from monthly rates
      const monthlyRates = Object.values(stateRates).filter((v): v is number => typeof v === 'number');
      if (monthlyRates.length > 0) {
        // Sum monthly rates for annual rate (rates are per 100k per month)
        const annualRate = Math.round(monthlyRates.reduce((a, b) => a + b, 0));
        // Field numbers aligned with fields-schema.ts (SOURCE OF TRUTH) - Safety & Crime (88-90)
        setField(fields, '88_violent_crime_index', annualRate.toString(), 'FBI UCR');

        // Grade based on annual violent crime rate per 100k → Field 90 neighborhood_safety_rating
        let grade = 'A';
        if (annualRate > 500) grade = 'F';
        else if (annualRate > 400) grade = 'D';
        else if (annualRate > 300) grade = 'C';
        else if (annualRate > 200) grade = 'B';

        setField(fields, '90_neighborhood_safety_rating', grade, 'FBI UCR');

        // Compare to US average
        if (usRates) {
          const usMonthlyRates = Object.values(usRates).filter((v): v is number => typeof v === 'number');
          const usAnnualRate = Math.round(usMonthlyRates.reduce((a, b) => a + b, 0));
          const vsNational = Math.round((annualRate / usAnnualRate - 1) * 100);
          // Note: No direct field for crime_vs_national_percent in 168-field schema
        }
      }
    }

    return { success: Object.keys(fields).length > 0, source: 'FBI UCR', fields };

  } catch (error) {
    return { success: false, source: 'FBI Crime Data', fields, error: String(error) };
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
      const owmResponse = await fetch(owmUrl);

      if (owmResponse.ok) {
        const data = await owmResponse.json();

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
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
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
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();

      // Note: Weather data is supplementary - not in 168-field schema
      if (data.current_weather) {
        setField(fields, 'current_temperature', data.current_weather.temperature, 'Open-Meteo');
      }

      if (data.daily) {
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
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return { success: false, source: 'HUD FMR', fields, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    const fmrData = data.data?.basicdata || data.basicdata || data;

    // Extract rent by bedroom count - map to rental_estimate_monthly (field 98)
    // Note: FMR data is supplementary - not all fields in 168-field schema
    if (fmrData) {
      // Use 2BR as representative rental estimate (most common search)
      const twoBedroomRent = fmrData['Two-Bedroom'] || fmrData.two_bedroom;
      if (twoBedroomRent) {
        setField(fields, '98_rental_estimate_monthly', twoBedroomRent, 'HUD FMR');
      }

      // Store other FMR data as metadata (not numbered fields)
      setField(fields, 'fmr_efficiency', fmrData.Efficiency || fmrData.efficiency, 'HUD FMR');
      setField(fields, 'fmr_1br', fmrData['One-Bedroom'] || fmrData.one_bedroom, 'HUD FMR');
      setField(fields, 'fmr_2br', twoBedroomRent, 'HUD FMR');
      setField(fields, 'fmr_3br', fmrData['Three-Bedroom'] || fmrData.three_bedroom, 'HUD FMR');
      setField(fields, 'fmr_4br', fmrData['Four-Bedroom'] || fmrData.four_bedroom, 'HUD FMR');
    }

    return { success: Object.keys(fields).length > 0, source: 'HUD FMR', fields };

  } catch (error) {
    return { success: false, source: 'HUD FMR', fields, error: String(error) };
  }
}
