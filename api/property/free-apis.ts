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

    setField(fields, '28_county', county, 'Google Maps');
    setField(fields, '27_neighborhood', neighborhood, 'Google Maps');
    // Note: city/state/zip are parsed from 1_full_address when needed (no separate fields in 110-field schema)
    setField(fields, '1_full_address', result.formatted_address, 'Google Maps');

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

  const placeTypes = [
    { type: 'supermarket', field: '73_distance_grocery_miles', name: 'Grocery' },
    { type: 'hospital', field: '72_distance_hospital_miles', name: 'Hospital' },
    { type: 'airport', field: '71_distance_airport_miles', name: 'Airport' },
    { type: 'park', field: '69_distance_park_miles', name: 'Park' },
    { type: 'restaurant', field: '68_distance_restaurants_miles', name: 'Restaurant' },
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

    setField(fields, '65_walk_score', data.walkscore, 'WalkScore');
    setField(fields, '70_walkability_description', data.description, 'WalkScore');

    if (data.transit?.score) {
      setField(fields, '66_transit_score', data.transit.score, 'WalkScore');
    }
    if (data.bike?.score) {
      setField(fields, '67_bike_score', data.bike.score, 'WalkScore');
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

      setField(fields, '100_flood_zone', `FEMA Zone ${floodZone}`, 'FEMA NFHL');
      setField(fields, '101_flood_risk_level', isHighRisk ? 'High Risk (Special Flood Hazard Area)' : 'Minimal Risk', 'FEMA NFHL');

      // Estimate flood insurance requirement
      if (isHighRisk) {
        setField(fields, '102_flood_insurance_required', true, 'FEMA NFHL');
      }
    } else {
      setField(fields, '100_flood_zone', 'Zone X (Minimal Risk)', 'FEMA NFHL', 'Medium');
      setField(fields, '101_flood_risk_level', 'Minimal', 'FEMA NFHL', 'Medium');
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
      setField(fields, '99_air_quality_index_current', aqi, 'AirNow');
      setField(fields, '98_air_quality_category', category, 'AirNow');
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

    if (elementary) {
      setField(fields, '56_assigned_elementary', elementary.schoolName, 'SchoolDigger');
      setField(fields, '57_elementary_rating', elementary.rankHistory?.[0]?.rank || elementary.schoolDiggerRank, 'SchoolDigger');
      setField(fields, '58_elementary_distance_miles', elementary.distance, 'SchoolDigger');
    }

    if (middle) {
      setField(fields, '59_assigned_middle', middle.schoolName, 'SchoolDigger');
      setField(fields, '60_middle_rating', middle.rankHistory?.[0]?.rank || middle.schoolDiggerRank, 'SchoolDigger');
      setField(fields, '61_middle_distance_miles', middle.distance, 'SchoolDigger');
    }

    if (high) {
      setField(fields, '62_assigned_high', high.schoolName, 'SchoolDigger');
      setField(fields, '63_high_rating', high.rankHistory?.[0]?.rank || high.schoolDiggerRank, 'SchoolDigger');
      setField(fields, '64_high_distance_miles', high.distance, 'SchoolDigger');
    }

    // Calculate average school rating
    const ratings = [elementary?.schoolDiggerRank, middle?.schoolDiggerRank, high?.schoolDiggerRank].filter(Boolean);
    if (ratings.length > 0) {
      const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      setField(fields, '55_school_rating_avg', Math.round(avgRating * 10) / 10, 'SchoolDigger');
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

    // STR market data
    setField(fields, '76_str_avg_daily_rate', market.adr, 'AirDNA');
    setField(fields, '77_str_occupancy_rate', market.occupancy, 'AirDNA');
    setField(fields, '78_str_annual_revenue_estimate', market.revenue, 'AirDNA');
    setField(fields, '79_str_active_listings_nearby', market.total_active_listings, 'AirDNA');

    // Property-specific estimate if available
    if (market.property_estimate) {
      setField(fields, '80_str_revenue_potential', market.property_estimate.revenue, 'AirDNA');
    }

    return { success: Object.keys(fields).length > 0, source: 'AirDNA', fields };

  } catch (error) {
    return { success: false, source: 'AirDNA', fields, error: String(error) };
  }
}

// ============================================
// HOWLOUD API - Noise Levels
// ============================================
export async function callHowLoud(lat: number, lon: number): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};

  try {
    // HowLoud API endpoint
    const url = `https://api.howloud.com/score?lat=${lat}&lng=${lon}`;
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, source: 'HowLoud', fields, error: `HTTP ${response.status}` };
    }

    const data = await response.json();

    if (data.score !== undefined) {
      setField(fields, '96_noise_score', data.score, 'HowLoud');
      setField(fields, '97_noise_category', data.category || (data.score > 70 ? 'Noisy' : data.score > 50 ? 'Moderate' : 'Quiet'), 'HowLoud');
    }

    // Traffic noise
    if (data.traffic_score !== undefined) {
      setField(fields, '94_traffic_noise', data.traffic_score, 'HowLoud');
    }

    // Airport noise
    if (data.airport_score !== undefined) {
      setField(fields, '95_airport_noise', data.airport_score, 'HowLoud');
    }

    return { success: Object.keys(fields).length > 0, source: 'HowLoud', fields };

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

      setField(fields, '103_mobile_broadband_best_carrier', bestCarrier.name, 'FCC VizMo');
      setField(fields, '104_mobile_broadband_download_mbps', bestCarrier.download_speed, 'FCC VizMo');
      setField(fields, '105_mobile_carriers_available', carriers.length, 'FCC VizMo');

      // Check for LTE/5G coverage
      const has4G = carriers.some(c => c.lte_coverage);
      setField(fields, '106_4g_lte_available', has4G, 'FCC VizMo');
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
    const currentYear = new Date().getFullYear() - 1;
    const url = 'https://api.usa.gov/crime/fbi/cde/summarized/state/' + stateCode + '/violent-crime?from=' + (currentYear - 1) + '&to=' + currentYear + '&API_KEY=' + apiKey;

    const response = await fetch(url);
    if (!response.ok) {
      return { success: false, source: 'FBI UCR', fields, error: 'HTTP ' + response.status };
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const latest = data.results[data.results.length - 1];

      if (latest.actual && latest.population) {
        const crimeRate = Math.round((latest.actual / latest.population) * 100000);
        setField(fields, '90_violent_crime_rate_per_100k', crimeRate, 'FBI UCR');

        let grade = 'A';
        if (crimeRate > 600) grade = 'F';
        else if (crimeRate > 450) grade = 'D';
        else if (crimeRate > 300) grade = 'C';
        else if (crimeRate > 150) grade = 'B';

        setField(fields, '91_crime_grade', grade, 'FBI UCR');
        setField(fields, '92_crime_data_year', currentYear, 'FBI UCR');
      }
    }

    return { success: Object.keys(fields).length > 0, source: 'FBI UCR', fields };

  } catch (error) {
    return { success: false, source: 'FBI Crime Data', fields, error: String(error) };
  }
}

// ============================================
// WEATHER.COM API
// ============================================
export async function callWeather(lat: number, lon: number): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};
  const apiKey = process.env.WEATHER_API_KEY;

  if (!apiKey) {
    // Try free alternative - Open-Meteo
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=America%2FNew_York`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();

        if (data.current_weather) {
          setField(fields, '118_current_temperature', data.current_weather.temperature, 'Open-Meteo');
        }

        // Calculate averages from daily data
        if (data.daily) {
          const avgHigh = data.daily.temperature_2m_max.reduce((a: number, b: number) => a + b, 0) / data.daily.temperature_2m_max.length;
          const avgLow = data.daily.temperature_2m_min.reduce((a: number, b: number) => a + b, 0) / data.daily.temperature_2m_min.length;
          const totalPrecip = data.daily.precipitation_sum.reduce((a: number, b: number) => a + b, 0);

          setField(fields, '119_avg_high_temp', Math.round(avgHigh), 'Open-Meteo');
          setField(fields, '120_avg_low_temp', Math.round(avgLow), 'Open-Meteo');
          setField(fields, '121_precipitation_7day_mm', Math.round(totalPrecip), 'Open-Meteo');
        }

        return { success: Object.keys(fields).length > 0, source: 'Open-Meteo', fields };
      }
    } catch (e) {}

    return { success: false, source: 'Weather', fields, error: 'WEATHER_API_KEY not configured' };
  }

  try {
    // Weather.com API
    const url = `https://api.weather.com/v3/wx/conditions/current?geocode=${lat},${lon}&language=en-US&format=json&apiKey=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, source: 'Weather.com', fields, error: `HTTP ${response.status}` };
    }

    const data = await response.json();

    setField(fields, '118_current_temperature', data.temperature, 'Weather.com');
    setField(fields, '122_humidity', data.relativeHumidity, 'Weather.com');

    return { success: Object.keys(fields).length > 0, source: 'Weather.com', fields };

  } catch (error) {
    return { success: false, source: 'Weather.com', fields, error: String(error) };
  }
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

    // Extract rent by bedroom count
    if (fmrData) {
      setField(fields, '111_fmr_efficiency', fmrData.Efficiency || fmrData.efficiency, 'HUD FMR');
      setField(fields, '112_fmr_1br', fmrData['One-Bedroom'] || fmrData.one_bedroom, 'HUD FMR');
      setField(fields, '113_fmr_2br', fmrData['Two-Bedroom'] || fmrData.two_bedroom, 'HUD FMR');
      setField(fields, '114_fmr_3br', fmrData['Three-Bedroom'] || fmrData.three_bedroom, 'HUD FMR');
      setField(fields, '115_fmr_4br', fmrData['Four-Bedroom'] || fmrData.four_bedroom, 'HUD FMR');
      setField(fields, '116_fmr_year', fmrData.year, 'HUD FMR');

      // Get metro/county info if available
      const metroName = data.data?.metroarea || data.data?.county_name;
      if (metroName) {
        setField(fields, '117_fmr_area_name', metroName, 'HUD FMR');
      }
    }

    return { success: Object.keys(fields).length > 0, source: 'HUD FMR', fields };

  } catch (error) {
    return { success: false, source: 'HUD FMR', fields, error: String(error) };
  }
}
