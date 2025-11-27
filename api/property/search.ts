/**
 * CLUES Property Search API (Non-Streaming Version)
 * 
 * DATA SOURCE ORDER (Most Reliable First):
 * Tier 1: Stellar MLS (when eKey obtained - future)
 * Tier 2: Google APIs (Geocode, Places)
 * Tier 3: Paid/Free APIs (WalkScore, SchoolDigger, AirNow, HowLoud, Weather, Crime, FEMA)
 * Tier 4: LLMs (Perplexity, Grok, Claude Opus, GPT, Claude Sonnet, Gemini)
 *
 * REMOVED (2025-11-27):
 * - Scrapers (Zillow, Redfin, Realtor) - blocked by anti-bot
 * - AirDNA - not wired
 * - Broadband - not wired
 * - HUD - geo-blocked outside US (disabled for now)
 *
 * RULES:
 * - Never store null values
 * - Most reliable source wins on conflicts
 * - Yellow warning for conflicts
 * - LLMs only fill gaps, never overwrite reliable data
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeFloridaCounty } from './florida-counties';
import { LLM_CASCADE_ORDER } from './llm-constants';
import { createArbitrationPipeline, type FieldValue, type ArbitrationResult } from './arbitration';


// ============================================
// SEMANTIC VALUE COMPARISON
// Returns true if values are semantically equal (not a real conflict)
// ============================================
function valuesAreSemanticallySame(val1: any, val2: any): boolean {
  // Handle null/undefined
  if (val1 === null || val1 === undefined || val2 === null || val2 === undefined) {
    return val1 === val2;
  }

  // Convert to strings for comparison
  const str1 = String(val1).trim().toLowerCase();
  const str2 = String(val2).trim().toLowerCase();

  // Exact match after normalization
  if (str1 === str2) return true;

  // One contains the other (e.g., "Yes" vs "Yes - with details")
  if (str1.includes(str2) || str2.includes(str1)) return true;

  // Strip common suffixes/variations for comparison
  const normalize = (s: string) => s
    .replace(/\s*-\s*.*$/, '')  // Remove " - anything"
    .replace(/\s*\(.*\)$/, '')   // Remove "(anything)"
    .replace(/[,;].*$/, '')      // Remove after comma/semicolon
    .trim();

  if (normalize(str1) === normalize(str2)) return true;

  // Handle numeric comparisons with tolerance
  const num1 = parseFloat(str1.replace(/[^0-9.-]/g, ''));
  const num2 = parseFloat(str2.replace(/[^0-9.-]/g, ''));
  if (!isNaN(num1) && !isNaN(num2)) {
    // Numbers within 1% are considered same
    const diff = Math.abs(num1 - num2);
    const avg = (Math.abs(num1) + Math.abs(num2)) / 2;
    if (avg > 0 && diff / avg < 0.01) return true;
  }

  return false;
}

// ============================================
// CONVERT FLAT 110-FIELD TO NESTED STRUCTURE
// Maps API field keys to nested PropertyDetail format
// ============================================
function convertFlatToNestedStructure(flatFields: Record<string, any>): any {
  const fieldPathMap: Record<string, [string, string]> = {
    // Address & Identity
    '1_full_address': ['address', 'fullAddress'],
    '2_mls_primary': ['address', 'mlsPrimary'],
    '3_mls_secondary': ['address', 'mlsSecondary'],
    '4_listing_status': ['address', 'listingStatus'],
    '5_listing_date': ['address', 'listingDate'],
    '6_parcel_id': ['details', 'parcelId'],
    // Pricing
    '7_listing_price': ['address', 'listingPrice'],
    '8_price_per_sqft': ['address', 'pricePerSqft'],
    '9_market_value_estimate': ['details', 'marketValueEstimate'],
    '10_last_sale_date': ['details', 'lastSaleDate'],
    '11_last_sale_price': ['details', 'lastSalePrice'],
    // Property Basics
    '12_bedrooms': ['details', 'bedrooms'],
    '13_full_bathrooms': ['details', 'fullBathrooms'],
    '14_half_bathrooms': ['details', 'halfBathrooms'],
    '15_total_bathrooms': ['details', 'totalBathrooms'],
    '16_living_sqft': ['details', 'livingSqft'],
    '17_total_sqft_under_roof': ['details', 'totalSqftUnderRoof'],
    '18_lot_size_sqft': ['details', 'lotSizeSqft'],
    '19_lot_size_acres': ['details', 'lotSizeAcres'],
    '20_year_built': ['details', 'yearBuilt'],
    '21_property_type': ['details', 'propertyType'],
    '22_stories': ['details', 'stories'],
    '23_garage_spaces': ['details', 'garageSpaces'],
    '24_parking_total': ['details', 'parkingTotal'],
    // HOA & Ownership
    '25_hoa_yn': ['details', 'hoaYn'],
    '26_hoa_fee_annual': ['details', 'hoaFeeAnnual'],
    '27_ownership_type': ['details', 'ownershipType'],
    '28_county': ['address', 'county'],
    // Taxes
    '29_annual_taxes': ['details', 'annualTaxes'],
    '30_tax_year': ['details', 'taxYear'],
    '31_assessed_value': ['details', 'assessedValue'],
    '32_tax_exemptions': ['financial', 'taxExemptions'],
    '33_property_tax_rate': ['financial', 'propertyTaxRate'],
    '34_recent_tax_history': ['financial', 'recentTaxHistory'],
    '35_special_assessments': ['financial', 'specialAssessments'],
    // Structure & Systems
    '36_roof_type': ['structural', 'roofType'],
    '37_roof_age_est': ['structural', 'roofAgeEst'],
    '38_exterior_material': ['structural', 'exteriorMaterial'],
    '39_foundation': ['structural', 'foundation'],
    '40_hvac_type': ['structural', 'hvacType'],
    '41_hvac_age': ['structural', 'hvacAge'],
    '42_flooring_type': ['structural', 'flooringType'],
    '43_kitchen_features': ['structural', 'kitchenFeatures'],
    '44_appliances_included': ['structural', 'appliancesIncluded'],
    '45_fireplace_yn': ['structural', 'fireplaceYn'],
    '46_interior_condition': ['structural', 'interiorCondition'],
    '47_pool_yn': ['structural', 'poolYn'],
    '48_pool_type': ['structural', 'poolType'],
    '49_deck_patio': ['structural', 'deckPatio'],
    '50_fence': ['structural', 'fence'],
    '51_landscaping': ['structural', 'landscaping'],
    '52_recent_renovations': ['structural', 'recentRenovations'],
    '53_permit_history_roof': ['structural', 'permitHistoryRoof'],
    '54_permit_history_hvac': ['structural', 'permitHistoryHvac'],
    '55_permit_history_other': ['structural', 'permitHistoryPoolAdditions'],
    // Schools
    '56_assigned_elementary': ['location', 'assignedElementary'],
    '57_elementary_rating': ['location', 'elementaryRating'],
    '58_elementary_distance_miles': ['location', 'elementaryDistanceMiles'],
    '59_assigned_middle': ['location', 'assignedMiddle'],
    '60_middle_rating': ['location', 'middleRating'],
    '61_middle_distance_miles': ['location', 'middleDistanceMiles'],
    '62_assigned_high': ['location', 'assignedHigh'],
    '63_high_rating': ['location', 'highRating'],
    '64_high_distance_miles': ['location', 'highDistanceMiles'],
    // Location Scores
    '65_walk_score': ['location', 'walkScore'],
    '66_transit_score': ['location', 'transitScore'],
    '67_bike_score': ['location', 'bikeScore'],
    '68_noise_level': ['location', 'noiseLevel'],
    '69_traffic_level': ['location', 'trafficLevel'],
    '70_walkability_description': ['location', 'walkabilityDescription'],
    '71_commute_time_city_center': ['location', 'commuteTimeCityCenter'],
    '72_public_transit_access': ['location', 'publicTransitAccess'],
    // Distances
    '73_distance_grocery_miles': ['location', 'distanceGroceryMiles'],
    '74_distance_hospital_miles': ['location', 'distanceHospitalMiles'],
    '75_distance_airport_miles': ['location', 'distanceAirportMiles'],
    '76_distance_park_miles': ['location', 'distanceParkMiles'],
    '77_distance_beach_miles': ['location', 'distanceBeachMiles'],
    // Safety & Crime
    '78_crime_index_violent': ['location', 'crimeIndexViolent'],
    '79_crime_index_property': ['location', 'crimeIndexProperty'],
    '80_neighborhood_safety_rating': ['location', 'neighborhoodSafetyRating'],
    // Market & Investment
    '81_median_home_price_neighborhood': ['financial', 'medianHomePriceNeighborhood'],
    '82_price_per_sqft_recent_avg': ['financial', 'pricePerSqftRecentAvg'],
    '83_days_on_market_avg': ['financial', 'daysOnMarketAvg'],
    '84_inventory_surplus': ['financial', 'inventorySurplus'],
    '85_rental_estimate_monthly': ['financial', 'rentalEstimateMonthly'],
    '86_rental_yield_est': ['financial', 'rentalYieldEst'],
    '87_vacancy_rate_neighborhood': ['financial', 'vacancyRateNeighborhood'],
    '88_cap_rate_est': ['financial', 'capRateEst'],
    '89_insurance_est_annual': ['financial', 'insuranceEstAnnual'],
    '90_financing_terms': ['financial', 'financingTerms'],
    '91_comparable_sales': ['financial', 'comparableSalesLast3'],
    // Utilities
    '92_electric_provider': ['utilities', 'electricProvider'],
    '93_water_provider': ['utilities', 'waterProvider'],
    '94_sewer_provider': ['utilities', 'sewerProvider'],
    '95_natural_gas': ['utilities', 'naturalGas'],
    '96_internet_providers_top3': ['utilities', 'internetProvidersTop3'],
    '97_max_internet_speed': ['utilities', 'maxInternetSpeed'],
    '98_cable_tv_provider': ['utilities', 'cableTvProvider'],
    // Environment & Risk
    '99_air_quality_index_current': ['utilities', 'airQualityIndexCurrent'],
    '100_flood_zone': ['utilities', 'floodZone'],
    '101_flood_risk_level': ['utilities', 'floodRiskLevel'],
    '102_climate_risk_summary': ['utilities', 'climateRiskWildfireFlood'],
    '103_noise_level_db_est': ['utilities', 'noiseLevelDbEst'],
    '104_solar_potential': ['utilities', 'solarPotential'],
    // Additional Features
    '105_ev_charging_yn': ['utilities', 'evChargingYn'],
    '106_smart_home_features': ['utilities', 'smartHomeFeatures'],
    '107_accessibility_mods': ['utilities', 'accessibilityMods'],
    '108_pet_policy': ['utilities', 'petPolicy'],
    '109_age_restrictions': ['utilities', 'ageRestrictions'],
    '110_notes_confidence_summary': ['utilities', 'notesConfidenceSummary'],
  };

  const nested: Record<string, any> = {
    address: {},
    details: {},
    structural: {},
    location: {},
    financial: {},
    utilities: {},
  };

  for (const [flatKey, fieldData] of Object.entries(flatFields)) {
    const path = fieldPathMap[flatKey];
    if (path && nested[path[0]]) {
      nested[path[0]][path[1]] = fieldData;
    }
  }

  return nested;
}

// ============================================
// SCRAPERS REMOVED (2025-11-27)
// Zillow/Redfin/Realtor blocked by anti-bot
// Use MLS API when eKey is obtained
// ============================================

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

// BroadbandNow REMOVED (2025-11-27) - Scraper was blocked and not wired
// Internet provider data now comes from LLM cascade (fields 96-98)

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
      const conditions: string[] = [];
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
  console.log('getDistances: Starting for coords', lat, lon);

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
      console.log(`getDistances: ${place.name} status=${searchData.status} results=${searchData.results?.length || 0}`);

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

  console.log(`getDistances: Returning ${Object.keys(fields).length} distance fields:`, Object.keys(fields));
  return fields;
}

// Google Places - School distances
async function getSchoolDistances(lat: number, lon: number): Promise<Record<string, any>> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return {};

  const origin = `${lat},${lon}`;
  const fields: Record<string, any> = {};

  const schoolTypes = [
    { type: 'primary_school', field: '58_elementary_distance_miles', name: 'Elementary School' },
    { type: 'secondary_school', field: '61_middle_distance_miles', name: 'Middle School' },
    { type: 'school', keyword: 'high school', field: '64_high_distance_miles', name: 'High School' },
  ];

  for (const school of schoolTypes) {
    try {
      let searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin}&rankby=distance&type=${school.type}&key=${apiKey}`;
      if (school.keyword) {
        searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin}&rankby=distance&keyword=${encodeURIComponent(school.keyword)}&key=${apiKey}`;
      }

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

          fields[school.field] = {
            value: parseFloat(miles),
            source: 'Google Places',
            confidence: 'High',
            details: nearest.name
          };
        }
      }
    } catch (e) {
      console.error(`Error getting ${school.name} distance:`, e);
    }
  }

  return fields;
}

// FREE Crime Data - Uses FBI UCR data via community-crime-map or similar free sources
async function getCrimeData(lat: number, lon: number, address: string): Promise<Record<string, any>> {
  const fields: Record<string, any> = {};

  try {
    // Try CrimeGrade.org scrape (free)
    const zipMatch = address.match(/\b(\d{5})\b/);
    if (zipMatch) {
      const zip = zipMatch[1];
      const crimeUrl = `https://crimegrade.org/safest-places-in-${zip}/`;

      const res = await fetch(crimeUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });

      if (res.ok) {
        const html = await res.text();

        // Extract overall crime grade
        const gradeMatch = html.match(/Overall Crime Grade[^A-F]*([A-F][+-]?)/i) ||
                          html.match(/crime grade[^A-F]*([A-F][+-]?)/i);
        if (gradeMatch) {
          fields['80_neighborhood_safety_rating'] = {
            value: `Grade ${gradeMatch[1]}`,
            source: 'CrimeGrade.org',
            confidence: 'Medium'
          };
        }

        // Extract violent crime grade
        const violentMatch = html.match(/Violent Crime[^A-F]*([A-F][+-]?)/i);
        if (violentMatch) {
          fields['78_crime_index_violent'] = {
            value: `Grade ${violentMatch[1]}`,
            source: 'CrimeGrade.org',
            confidence: 'Medium'
          };
        }

        // Extract property crime grade
        const propertyMatch = html.match(/Property Crime[^A-F]*([A-F][+-]?)/i);
        if (propertyMatch) {
          fields['79_crime_index_property'] = {
            value: `Grade ${propertyMatch[1]}`,
            source: 'CrimeGrade.org',
            confidence: 'Medium'
          };
        }
      }
    }

    // If CrimeGrade didn't work, try AreaVibes (also free)
    if (Object.keys(fields).length === 0) {
      const cityMatch = address.match(/,\s*([^,]+),\s*[A-Z]{2}/i);
      if (cityMatch) {
        const city = cityMatch[1].trim().toLowerCase().replace(/\s+/g, '-');
        const state = address.match(/,\s*([A-Z]{2})\s*\d{5}/i)?.[1]?.toLowerCase();

        if (city && state) {
          const areaVibesUrl = `https://www.areavibes.com/${city}-${state}/crime/`;
          const res = await fetch(areaVibesUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            }
          });

          if (res.ok) {
            const html = await res.text();

            // Extract livability score
            const scoreMatch = html.match(/Crime[^0-9]*(\d+)/i);
            if (scoreMatch) {
              const score = parseInt(scoreMatch[1]);
              let rating = 'Poor';
              if (score >= 80) rating = 'Excellent';
              else if (score >= 60) rating = 'Good';
              else if (score >= 40) rating = 'Fair';

              fields['80_neighborhood_safety_rating'] = {
                value: `${rating} (Score: ${score}/100)`,
                source: 'AreaVibes',
                confidence: 'Medium'
              };
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Crime data error:', e);
  }

  return fields;
}

// Google Places - Public transit access
async function getTransitAccess(lat: number, lon: number): Promise<Record<string, any>> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return {};

  const origin = `${lat},${lon}`;
  const fields: Record<string, any> = {};

  try {
    // Search for transit stations nearby
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin}&radius=1609&type=transit_station&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (searchData.results && searchData.results.length > 0) {
      const stations = searchData.results.slice(0, 3).map((s: any) => s.name);
      fields['72_public_transit_access'] = {
        value: `Yes - ${searchData.results.length} stations within 1 mile: ${stations.join(', ')}`,
        source: 'Google Places',
        confidence: 'High'
      };
    } else {
      // Check for bus stops
      const busUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${origin}&radius=805&type=bus_station&key=${apiKey}`;
      const busRes = await fetch(busUrl);
      const busData = await busRes.json();

      if (busData.results && busData.results.length > 0) {
        fields['72_public_transit_access'] = {
          value: `Limited - ${busData.results.length} bus stops within 0.5 miles`,
          source: 'Google Places',
          confidence: 'Medium'
        };
      } else {
        fields['72_public_transit_access'] = {
          value: 'No public transit within 1 mile',
          source: 'Google Places',
          confidence: 'High'
        };
      }
    }
  } catch (e) {
    console.error('Transit access error:', e);
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
  const [walkScore, floodZone, airQuality, noiseData, climateData, distances, commuteTime, schoolDistances, transitAccess, crimeData] = await Promise.all([
    getWalkScore(geo.lat, geo.lon, address),
    getFloodZone(geo.lat, geo.lon),
    getAirQuality(geo.lat, geo.lon),
    getNoiseData(geo.lat, geo.lon),
    getClimateData(geo.lat, geo.lon),
    getDistances(geo.lat, geo.lon),
    getCommuteTime(geo.lat, geo.lon, geo.county),
    getSchoolDistances(geo.lat, geo.lon),
    getTransitAccess(geo.lat, geo.lon),
    getCrimeData(geo.lat, geo.lon, address)
  ]);

  Object.assign(fields, walkScore, floodZone, airQuality, noiseData, climateData, distances, commuteTime, schoolDistances, transitAccess, crimeData);

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

  const prompt = `You have REAL-TIME WEB SEARCH. Use it to find VERIFIED property data for this address: ${address}

CRITICAL INSTRUCTIONS - ANTI-HALLUCINATION:
1. You MUST use web search to find real data from actual websites
2. NEVER make up or estimate values - if you can't find it, say "Not found"
3. Include the exact source URL for each field you find
4. Cross-verify important values (price, sqft) across multiple sources
5. Only return data you actually found via web search

Search these sources IN THIS ORDER:
- Zillow.com, Redfin.com, Realtor.com (for listing data, MLS numbers, prices)
- County property appraiser website for the specific county (for tax data, parcel IDs, assessed values)
- GreatSchools.org (for school assignments and ratings)
- FEMA NFHL (for flood zones)
- Public tax collector records
- Recent sales comps from MLS or Zillow

I need ALL of these fields. Return ONLY what you can verify from real sources with actual URLs:

PROPERTY BASICS:
- 1_full_address: full street address
- 2_mls_primary: MLS listing number
- 4_listing_status: For Sale, Sold, Pending, Off Market
- 5_listing_date: when listed
- 6_parcel_id: county parcel/folio number
- 7_listing_price: current or last list price
- 10_last_sale_date: date of last sale
- 11_last_sale_price: price of last sale
- 12_bedrooms: number of bedrooms
- 13_full_bathrooms: full baths
- 14_half_bathrooms: half baths
- 16_living_sqft: heated/living square feet
- 18_lot_size_sqft: lot size in sqft
- 20_year_built: year constructed
- 21_property_type: Single Family, Condo, Townhouse, etc
- 22_stories: number of stories
- 23_garage_spaces: garage capacity
- 25_hoa_yn: true/false if HOA exists
- 26_hoa_fee_annual: annual HOA fee

TAXES & VALUE:
- 9_market_value_estimate: Zestimate or similar
- 29_annual_taxes: annual property tax amount
- 31_assessed_value: county assessed value
- 32_tax_exemptions: Homestead or other exemptions
- 33_property_tax_rate: mill rate

STRUCTURE:
- 36_roof_type: tile, shingle, metal, etc
- 37_roof_age_est: estimated roof age or year installed
- 38_exterior_material: stucco, brick, siding
- 39_foundation: slab, crawl space, basement
- 40_hvac_type: central, split, window
- 41_hvac_age: estimated HVAC age
- 45_fireplace_yn: true/false
- 47_pool_yn: true/false
- 48_pool_type: in-ground, above-ground, screened

SCHOOLS (from GreatSchools.org):
- 56_assigned_elementary: school name
- 57_elementary_rating: rating out of 10
- 59_assigned_middle: school name
- 60_middle_rating: rating out of 10
- 62_assigned_high: school name
- 63_high_rating: rating out of 10

MARKET DATA:
- 81_median_home_price_neighborhood: median price in area
- 82_price_per_sqft_recent_avg: average $/sqft in area
- 83_days_on_market_avg: average DOM in area
- 85_rental_estimate_monthly: estimated monthly rent
- 86_rental_yield_est: estimated rental yield %
- 91_comparable_sales: 2-3 recent nearby sales with prices

CRIME (from NeighborhoodScout, CrimeGrade, or similar):
- 78_crime_index_violent: violent crime rating
- 79_crime_index_property: property crime rating
- 80_neighborhood_safety_rating: overall safety grade

UTILITIES:
- 92_electric_provider: electric company name
- 93_water_provider: water company name
- 96_internet_providers_top3: top internet providers

Return as JSON format with SOURCE URLS:
{
  "field_name": {"value": "actual value", "source": "Website Name - https://actual-url.com/page"}
}

CRITICAL RULES:
- Only include fields with REAL verified data from actual web searches
- If you cannot find data for a field, DO NOT include it in the response
- NEVER make up, estimate, or guess values
- Include the actual URL you found the data on
- If a source doesn't have a field, skip it rather than guessing
- For missing fields, it's better to return fewer fields with high confidence than more fields with made-up data`;

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

    if (!response.ok) {
      console.error('Perplexity API error:', response.status, data);
      return {};
    }

    console.log('Perplexity response received:', JSON.stringify(data).substring(0, 500));

    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      console.log('Perplexity content:', text.substring(0, 500));

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
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
        } catch (parseError) {
          console.error('Failed to parse Perplexity JSON:', parseError);
          console.error('Raw text:', text);
        }
      } else {
        console.log('No JSON found in Perplexity response');
      }
    } else {
      console.log('No content in Perplexity response');
    }
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

// ============================================
// LLM-SPECIFIC PROMPTS - Tailored to each model's capabilities
// ============================================

// CRITICAL: Exact field key format for reliable mapping
const EXACT_FIELD_KEYS = `
EXACT FIELD KEYS - You MUST use these EXACT keys (number_fieldname format):
1_full_address, 2_mls_primary, 3_mls_secondary, 4_listing_status, 5_listing_date, 6_parcel_id,
7_listing_price, 8_price_per_sqft, 9_market_value_estimate, 10_last_sale_date, 11_last_sale_price,
12_bedrooms, 13_full_bathrooms, 14_half_bathrooms, 15_total_bathrooms, 16_living_sqft,
17_total_sqft_under_roof, 18_lot_size_sqft, 19_lot_size_acres, 20_year_built, 21_property_type,
22_stories, 23_garage_spaces, 24_parking_total, 25_hoa_yn, 26_hoa_fee_annual, 27_ownership_type,
28_county, 29_annual_taxes, 30_tax_year, 31_assessed_value, 32_tax_exemptions, 33_property_tax_rate,
34_recent_tax_history, 35_special_assessments, 36_roof_type, 37_roof_age_est, 38_exterior_material,
39_foundation, 40_hvac_type, 41_hvac_age, 42_flooring_type, 43_kitchen_features, 44_appliances_included,
45_fireplace_yn, 46_interior_condition, 47_pool_yn, 48_pool_type, 49_deck_patio, 50_fence,
51_landscaping, 52_recent_renovations, 53_permit_history_roof, 54_permit_history_hvac, 55_permit_history_other,
56_assigned_elementary, 57_elementary_rating, 58_elementary_distance_miles, 59_assigned_middle,
60_middle_rating, 61_middle_distance_miles, 62_assigned_high, 63_high_rating, 64_high_distance_miles,
65_walk_score, 66_transit_score, 67_bike_score, 68_noise_level, 69_traffic_level,
70_walkability_description, 71_commute_time_city_center, 72_public_transit_access,
73_distance_grocery_miles, 74_distance_hospital_miles, 75_distance_airport_miles,
76_distance_park_miles, 77_distance_beach_miles, 78_crime_index_violent, 79_crime_index_property,
80_neighborhood_safety_rating, 81_median_home_price_neighborhood, 82_price_per_sqft_recent_avg,
83_days_on_market_avg, 84_inventory_surplus, 85_rental_estimate_monthly, 86_rental_yield_est,
87_vacancy_rate_neighborhood, 88_cap_rate_est, 89_insurance_est_annual, 90_financing_terms,
91_comparable_sales, 92_electric_provider, 93_water_provider, 94_sewer_provider, 95_natural_gas,
96_internet_providers_top3, 97_max_internet_speed, 98_cable_tv_provider, 99_air_quality_index_current,
100_flood_zone, 101_flood_risk_level, 102_climate_risk_summary, 103_noise_level_db_est, 104_solar_potential,
105_ev_charging_yn, 106_smart_home_features, 107_accessibility_mods, 108_pet_policy,
109_age_restrictions, 110_notes_confidence_summary`;

// BASE JSON RESPONSE FORMAT (shared)
const JSON_RESPONSE_FORMAT = `
${EXACT_FIELD_KEYS}

RESPONSE FORMAT - Return ONLY valid JSON with EXACT field keys above:
{
  "fields": {
    "7_listing_price": { "value": 450000, "source": "Zillow.com", "confidence": "High" },
    "28_county": { "value": "Pinellas County", "source": "Geographic knowledge", "confidence": "High" },
    "29_annual_taxes": { "value": 5234.50, "source": "County Property Appraiser", "confidence": "High" },
    "31_assessed_value": { "value": null, "source": "Not found", "confidence": "Unverified" }
  },
  "sources_searched": ["Zillow", "County Property Appraiser", "Training data"],
  "fields_found": 45,
  "fields_missing": ["2_mls_primary", "3_mls_secondary"],
  "note": "Found 45 of 110 fields"
}

CRITICAL: Use EXACT field key format: [number]_[field_name] (e.g., "7_listing_price", "28_county")
DO NOT use variations like "listing_price", "listingPrice", "7. listing_price", or "field_7"`;

// ============================================
// GROK PROMPT - HAS WEB SEARCH - Use it!
// ============================================
const PROMPT_GROK = `You are GROK, a real estate data extraction expert with LIVE WEB SEARCH capabilities.

YOUR MISSION: Extract ALL 110 property data fields for the given address. You HAVE web access - USE IT AGGRESSIVELY.

${FIELD_GROUPS}

CRITICAL INSTRUCTIONS FOR GROK:
1. SEARCH THE WEB for this property - check Zillow, Redfin, Realtor.com, county property appraiser sites
2. For Florida properties, search "[County] Property Appraiser" for tax data, assessed values, parcel IDs
3. Search for MLS listings, recent sales, tax records - THIS IS YOUR STRENGTH
4. For each field, cite your SOURCE (URL or site name)
5. If you find conflicting data, report BOTH values with sources

PRIORITY FIELDS TO FIND VIA WEB SEARCH:
- Listing price, MLS number, days on market (Zillow/Redfin/Realtor)
- Tax value, assessed value, annual taxes, parcel ID (County Property Appraiser)
- Recent sales history, last sale price/date
- School assignments and ratings (GreatSchools, Zillow)
- HOA fees, HOA name
- Flood zone (FEMA flood maps)

DO NOT HALLUCINATE - If you can't find it, return null with confidence "Unverified"
DO cite your sources for every field you populate

${JSON_RESPONSE_FORMAT}`;

// ============================================
// PERPLEXITY PROMPT - HAS WEB SEARCH - Research focused
// ============================================
const PROMPT_PERPLEXITY = `You are a real estate research expert with LIVE WEB SEARCH capabilities.

YOUR MISSION: Research and extract ALL 110 property data fields. You have web access - search thoroughly and cite sources.

${FIELD_GROUPS}

CRITICAL INSTRUCTIONS FOR PERPLEXITY:
1. SEARCH multiple real estate sites: Zillow, Redfin, Realtor.com, Trulia, Homes.com
2. SEARCH county records: "[County Name] Property Appraiser" for tax data, ownership, parcel info
3. SEARCH for recent comparable sales in the neighborhood
4. SEARCH for school ratings, walk scores, crime statistics
5. For EVERY field you populate, include the SOURCE URL or site name

HIGH-VALUE SEARCHES TO PERFORM:
- "[Address] Zillow" - listing details, Zestimate, tax history
- "[Address] Redfin" - listing, estimate, neighborhood data
- "[County] Property Appraiser [Address]" - official tax records, assessed value, parcel ID
- "[Address] sold" - recent sale history
- "Schools near [Address]" - assigned schools and ratings
- "[ZIP code] flood zone" - FEMA flood data
- "[Neighborhood] median home price" - market comparisons

CONFIDENCE LEVELS:
- High: Found on official county site or multiple listing sites agree
- Medium: Found on one real estate site
- Low: Estimated or extrapolated
- Unverified: Could not find - return null

${JSON_RESPONSE_FORMAT}`;

// ============================================
// CLAUDE OPUS PROMPT - NO WEB - Highest reasoning, use training data
// ============================================
const PROMPT_CLAUDE_OPUS = `You are Claude Opus, the most capable AI assistant, helping extract property data. You do NOT have web access.

YOUR MISSION: Extract as many of the 110 property fields as possible using your training knowledge.

${FIELD_GROUPS}

WHAT YOU CAN PROVIDE (from training data):
1. GEOGRAPHIC KNOWLEDGE:
   - County names for any US address
   - Typical utility providers by region (Duke Energy for Tampa Bay, etc.)
   - School district names for well-known areas
   - General flood zone classifications for coastal/inland areas

2. REGIONAL NORMS:
   - Typical property tax rates by county
   - Common HOA fee ranges for property types
   - Average insurance costs by region
   - Typical construction materials for the region

3. DERIVED/CALCULATED VALUES:
   - If given sqft, can estimate price per sqft from regional averages
   - Can estimate lot size in acres from sqft
   - Can provide typical ranges for cap rates, rental yields

WHAT YOU CANNOT PROVIDE (require live data):
- Current listing prices, MLS numbers
- Actual assessed values, specific tax amounts
- Current owner names, recent sale dates/prices
- Live walk scores, current crime statistics

For fields requiring live data, return: { "value": null, "source": "Requires live data", "confidence": "Unverified" }

Be HONEST about uncertainty. It's better to return null than to guess.

${JSON_RESPONSE_FORMAT}`;

// ============================================
// GPT-4 PROMPT - NO WEB - Strong reasoning
// ============================================
const PROMPT_GPT = `You are GPT-4, a real estate data extraction assistant. You do NOT have web access.

YOUR MISSION: Extract property data fields using your training knowledge (cutoff: early 2024).

${FIELD_GROUPS}

EXTRACTION STRATEGY:
1. START with geographic/regional knowledge you're confident about
2. For Florida properties, you likely know:
   - County boundaries and names
   - Major utility providers (Duke Energy, TECO, Tampa Bay Water)
   - School district structures
   - General flood zone patterns (coastal vs inland)

3. PROVIDE estimates only when you can explain your reasoning:
   - "Based on Tampa Bay area averages..."
   - "Typical for Pinellas County residential..."

4. ALWAYS distinguish between:
   - KNOWN: From training data with high confidence
   - ESTIMATED: Reasonable inference from similar properties
   - UNKNOWN: Requires live data - return null

DO NOT INVENT:
- Specific prices, MLS numbers, parcel IDs
- Exact tax amounts or assessed values
- Owner names or sale dates
- Current listing status

${JSON_RESPONSE_FORMAT}`;

// ============================================
// CLAUDE SONNET PROMPT - NO WEB - Fast, efficient
// ============================================
const PROMPT_CLAUDE_SONNET = `You are Claude Sonnet, a fast and efficient property data extractor. No web access.

TASK: Extract property fields from training knowledge. Be quick but accurate.

${FIELD_GROUPS}

QUICK EXTRACTION RULES:
1. Geographic data (county, region): Usually can provide
2. Utility providers: Often know major providers by state/region
3. School districts: Know structure, not specific assignments
4. Tax rates: Know typical ranges by state
5. Property-specific data (prices, MLS, owners): Return null

CONFIDENCE GUIDE:
- High: Geographic facts, major utility providers
- Medium: Regional estimates, typical ranges
- Unverified: Anything property-specific

Keep responses focused. Don't over-explain.

${JSON_RESPONSE_FORMAT}`;

// ============================================
// COPILOT PROMPT - NO WEB - Structured output focus
// ============================================
const PROMPT_COPILOT = `You are an AI assistant helping extract structured property data. No web access.

TASK: Return a structured JSON with property fields from training knowledge.

${FIELD_GROUPS}

FOCUS ON:
1. Correctly structured JSON output
2. Proper field keys matching the schema
3. Appropriate null values for unknown data
4. Clear source attribution

PROVIDE:
- Geographic data you're confident about
- Regional utility/service provider names
- General area characteristics

RETURN NULL FOR:
- Specific prices, values, taxes
- MLS numbers, parcel IDs
- Owner information
- Current market data

${JSON_RESPONSE_FORMAT}`;

// ============================================
// GEMINI PROMPT - NO WEB - Knowledge focused
// ============================================
const PROMPT_GEMINI = `You are Gemini, a knowledgeable AI helping extract property data. No web access.

TASK: Extract property data fields using your training knowledge.

${FIELD_GROUPS}

EXTRACTION APPROACH:
1. Provide what you know from training data
2. Be clear about confidence levels
3. Return null for property-specific data requiring live lookups
4. Focus on geographic, regional, and structural knowledge

LIKELY CAN PROVIDE:
- County identification
- Regional utility providers
- General school district info
- Typical construction/architectural styles
- Climate and environmental generalities

CANNOT PROVIDE (return null):
- Current listing data
- Specific tax amounts
- Recent sales data
- Current owner info

${JSON_RESPONSE_FORMAT}`;

// Legacy fallback prompt
const SYSTEM_PROMPT = PROMPT_CLAUDE_OPUS;

// Claude Opus API call - MOST RELIABLE per audit
async function callClaudeOpus(address: string): Promise<any> {
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
        model: 'claude-opus-4-5-20251101',
        max_tokens: 8000,
        system: PROMPT_CLAUDE_OPUS,
        messages: [
          {
            role: 'user',
            content: `Extract all 110 property data fields for this address: ${address}

Use your training knowledge to provide geographic, regional, and structural data. Return null for fields requiring live data.`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.content && data.content[0]?.text) {
      const text = data.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return { ...JSON.parse(jsonMatch[0]), llm: 'Claude Opus' };
      }
    }
    return { error: 'Failed to parse Claude Opus response', fields: {}, llm: 'Claude Opus' };
  } catch (error) {
    return { error: String(error), fields: {}, llm: 'Claude Opus' };
  }
}

// Claude Sonnet API call - 4th in reliability per audit
async function callClaudeSonnet(address: string): Promise<any> {
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
        system: PROMPT_CLAUDE_SONNET,
        messages: [
          {
            role: 'user',
            content: `Extract property data fields for: ${address}

Quick extraction from training knowledge. Return null for property-specific data.`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.content && data.content[0]?.text) {
      const text = data.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return { ...JSON.parse(jsonMatch[0]), llm: 'Claude Sonnet' };
      }
    }
    return { error: 'Failed to parse Claude Sonnet response', fields: {}, llm: 'Claude Sonnet' };
  } catch (error) {
    return { error: String(error), fields: {}, llm: 'Claude Sonnet' };
  }
}

// GitHub Copilot API call - 5th in reliability per audit
async function callCopilot(address: string): Promise<any> {
  // Copilot uses Azure OpenAI or GitHub's API
  const apiKey = process.env.GITHUB_COPILOT_API_KEY || process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;

  if (!apiKey) return { error: 'COPILOT/AZURE API key not set', fields: {} };

  try {
    // If using Azure OpenAI endpoint
    const url = endpoint
      ? `${endpoint}/openai/deployments/gpt-4/chat/completions?api-version=2024-02-15-preview`
      : 'https://api.githubcopilot.com/chat/completions'; // GitHub Copilot API

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (endpoint) {
      headers['api-key'] = apiKey;
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'gpt-4',
        max_tokens: 8000,
        messages: [
          { role: 'system', content: PROMPT_COPILOT },
          {
            role: 'user',
            content: `Extract property data fields for: ${address}

Return structured JSON with proper field keys. Use null for unknown data.`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.choices && data.choices[0]?.message?.content) {
      const text = data.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return { ...JSON.parse(jsonMatch[0]), llm: 'Copilot' };
      }
    }
    return { error: 'Failed to parse Copilot response', fields: {}, llm: 'Copilot' };
  } catch (error) {
    return { error: String(error), fields: {}, llm: 'Copilot' };
  }
}

// OpenAI GPT API call - #2 in reliability
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
          { role: 'system', content: PROMPT_GPT },
          {
            role: 'user',
            content: `Extract all 110 property data fields for this address: ${address}

Use your training knowledge. Return JSON with EXACT field keys (e.g., "7_listing_price", "28_county"). Return null for fields requiring live data.`,
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

// Grok API call (xAI) - #2 in reliability, HAS WEB SEARCH
async function callGrok(address: string): Promise<any> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) { console.log('❌ XAI_API_KEY not set'); return { error: 'XAI_API_KEY not set', fields: {} }; } console.log('✅ XAI_API_KEY found, calling Grok API...');

  // Grok-specific prompt with web search emphasis
  const grokSystemPrompt = `${PROMPT_GROK}

${EXACT_FIELD_KEYS}

CRITICAL: Use EXACT field keys like "7_listing_price", "28_county", "29_annual_taxes"
SEARCH THE WEB AGGRESSIVELY for: listing prices, tax values, assessed values, MLS numbers, school ratings
CITE YOUR SOURCES for every field you populate`;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-2-latest', // Use grok-4 for better tool calling, grok-beta for cost savings
        max_tokens: 8000,
        temperature: 0.1, // Low temperature for factual consistency
        messages: [
          { role: 'system', content: grokSystemPrompt },
          {
            role: 'user',
            content: `Use your web search tools to find REAL property data for this address: ${address}

Search Zillow, Redfin, Realtor.com, county records, and other public sources. Return ONLY verified data you found from actual web searches. Include source URLs in your response.`,
          },
        ],
      }),
    });

    const data = await response.json();
    console.log('Grok response:', JSON.stringify(data).substring(0, 500));

    if (data.choices && data.choices[0]?.message?.content) {
      const text = data.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return { ...JSON.parse(jsonMatch[0]), llm: 'Grok' };
      }
    }
    return { error: 'Failed to parse Grok response', fields: {}, llm: 'Grok' };
  } catch (error) {
    console.error('Grok error:', error);
    return { error: String(error), fields: {}, llm: 'Grok' };
  }
}

// Gemini API call - #6 in reliability
async function callGemini(address: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { console.log('❌ GEMINI_API_KEY not set'); return { error: 'GEMINI_API_KEY not set', fields: {} }; } console.log('✅ GEMINI_API_KEY found, calling Gemini API...');

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
                  text: `${PROMPT_GEMINI}

Extract property data fields for this address: ${address}

Use EXACT field keys like "7_listing_price", "28_county", "29_annual_taxes".
Return null for property-specific data you don't have. Return JSON only.`,
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
      } else if (existing && !valuesAreSemanticallySame(existing.value, field.value) && newConfidence === existingConfidence) {
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
  merged.sources = Array.from(new Set(merged.sources));
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

  // CASCADE STRATEGY: Try all 6 LLMs in RELIABILITY order
  // Order: Perplexity → Grok → Claude Opus → GPT → Claude Sonnet → Gemini
  // Web-search LLMs first (verify real data), then knowledge-based LLMs
  const {
    address,
    url,
    engines = [...LLM_CASCADE_ORDER],
    skipLLMs = false,
    useCascade = true // Enable cascade mode by default
  } = req.body;

  if (!address && !url) {
    return res.status(400).json({ error: 'Address or URL required' });
  }

  const searchQuery = address || `property at URL: ${url}`;

  try {
    console.log('=== STARTING PROPERTY SEARCH (with Arbitration Pipeline) ===');
    console.log('Address:', searchQuery);

    // Initialize arbitration pipeline with LLM quorum threshold of 2
    const arbitrationPipeline = createArbitrationPipeline(2);
    const llmResponses: any[] = [];

    // ========================================
    // TIER 2 & 3: FREE APIs (Google, WalkScore, FEMA, etc.)
    // ========================================
    console.log('Step 1: Enriching with free APIs...');
    try {
      const enrichedData = await enrichWithFreeAPIs(searchQuery);
      if (Object.keys(enrichedData).length > 0) {
        // Separate Google fields from other API fields for proper tier assignment
        const googleFields: Record<string, FieldValue> = {};
        const apiFields: Record<string, FieldValue> = {};

        for (const [key, value] of Object.entries(enrichedData)) {
          const fieldData = value as any;
          const source = fieldData?.source || 'Unknown';
          const tier = source.includes('Google') ? 2 : 3;
          const fieldValue: FieldValue = {
            value: fieldData?.value !== undefined ? fieldData.value : fieldData,
            source: source,
            confidence: fieldData?.confidence || 'High',
            tier: tier as 1 | 2 | 3 | 4
          };

          // Route to appropriate tier based on source
          if (source.includes('Google')) {
            googleFields[key] = fieldValue;
          } else {
            apiFields[key] = fieldValue;
          }
        }

        // Add Google fields as Tier 2
        if (Object.keys(googleFields).length > 0) {
          const googleAdded = arbitrationPipeline.addFieldsFromSource(googleFields, 'Google Maps');
          console.log(`Added ${googleAdded} fields from Google Maps (Tier 2)`);
        }

        // Add other API fields as Tier 3
        if (Object.keys(apiFields).length > 0) {
          // Group by source for proper tracking
          const sourceGroups: Record<string, Record<string, FieldValue>> = {};
          for (const [key, field] of Object.entries(apiFields)) {
            const src = field.source;
            if (!sourceGroups[src]) sourceGroups[src] = {};
            sourceGroups[src][key] = field;
          }

          for (const [source, fields] of Object.entries(sourceGroups)) {
            const added = arbitrationPipeline.addFieldsFromSource(fields, source);
            console.log(`Added ${added} fields from ${source} (Tier 3)`);
          }
        }
      }
    } catch (e) {
      console.error('Free APIs enrichment failed:', e);
    }

    // ========================================
    // TIER 4: LLM CASCADE
    // ========================================
    if (!skipLLMs) {
      const intermediateResult = arbitrationPipeline.getResult();
      const currentFieldCount = Object.keys(intermediateResult.fields).length;

      // Only call LLMs if we have gaps
      if (currentFieldCount < 110) {
        console.log(`\nStep 2: LLM Cascade (${currentFieldCount}/110 fields filled)...`);

        const llmSourceNames: Record<string, string> = {
          'perplexity': 'Perplexity',
          'grok': 'Grok',
          'claude-opus': 'Claude Opus',
          'gpt': 'GPT',
          'claude-sonnet': 'Claude Sonnet',
          'gemini': 'Gemini'
        };

        const llmCascade = [
          { id: 'perplexity', fn: callPerplexity, enabled: engines.includes('perplexity') },
          { id: 'grok', fn: callGrok, enabled: engines.includes('grok') },
          { id: 'claude-opus', fn: callClaudeOpus, enabled: engines.includes('claude-opus') },
          { id: 'gpt', fn: callGPT, enabled: engines.includes('gpt') },
          { id: 'claude-sonnet', fn: callClaudeSonnet, enabled: engines.includes('claude-sonnet') },
          { id: 'gemini', fn: callGemini, enabled: engines.includes('gemini') },
        ];

        for (const llm of llmCascade) {
          if (!llm.enabled) continue;

          console.log(`\n=== Calling ${llm.id.toUpperCase()} ===`);

          try {
            const llmData = await llm.fn(searchQuery);
            const llmFields = llmData.fields || llmData;

            if (llmFields && Object.keys(llmFields).length > 0) {
              // Convert to FieldValue format for arbitration
              const formattedFields: Record<string, FieldValue> = {};
              for (const [key, value] of Object.entries(llmFields)) {
                const fieldData = value as any;
                const fieldValue = fieldData?.value !== undefined ? fieldData.value : value;

                // Skip null/empty responses
                if (fieldValue === null || fieldValue === undefined || fieldValue === '' || fieldValue === 'Not available') {
                  continue;
                }

                formattedFields[key] = {
                  value: fieldValue,
                  source: llmSourceNames[llm.id],
                  confidence: fieldData?.confidence || 'Medium',
                  tier: 4 as const
                };
              }

              const newFields = arbitrationPipeline.addFieldsFromSource(formattedFields, llmSourceNames[llm.id]);

              llmResponses.push({
                llm: llm.id,
                fields_found: newFields,
                success: true
              });

              console.log(`✅ ${llm.id}: ${Object.keys(llmFields).length} returned, ${newFields} new fields added`);

              // Check if we've filled enough gaps
              const updatedResult = arbitrationPipeline.getResult();
              if (useCascade && Object.keys(updatedResult.fields).length >= 110) {
                console.log(`🎯 100% completion reached! Stopping cascade at ${llm.id}`);
                break;
              }
            } else {
              llmResponses.push({
                llm: llm.id,
                fields_found: 0,
                success: false,
                error: 'No fields returned'
              });
            }
          } catch (e) {
            console.error(`❌ ${llm.id} failed:`, e);
            llmResponses.push({
              llm: llm.id,
              fields_found: 0,
              success: false,
              error: String(e)
            });
          }
        }
      } else {
        console.log('Skipping LLMs - sufficient data from reliable sources');
      }
    }

    // ========================================
    // GET FINAL ARBITRATION RESULT
    // ========================================
    const arbitrationResult = arbitrationPipeline.getResult();
    const totalFields = Object.keys(arbitrationResult.fields).length;
    const completionPercentage = Math.round((totalFields / 110) * 100);

    // Build source breakdown from arbitration result
    const sourceBreakdown: Record<string, number> = {};
    for (const [_, field] of Object.entries(arbitrationResult.fields)) {
      const source = field.source || 'Unknown';
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
    }

    // Convert arbitration fields to frontend DataField format
    const convertedFields: Record<string, any> = {};
    for (const [key, field] of Object.entries(arbitrationResult.fields)) {
      let parsedValue = field.value;

      // Parse dates if they look like date strings
      if (typeof parsedValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(parsedValue)) {
        try {
          parsedValue = new Date(parsedValue).toISOString();
        } catch {}
      } else if (typeof parsedValue === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}/.test(parsedValue)) {
        try {
          const [m, d, y] = parsedValue.split('/');
          parsedValue = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`).toISOString();
        } catch {}
      }

      // Use validationStatus from the FieldValue (set by arbitration pipeline)
      // or derive from singleSourceWarnings if not set
      const hasConflict = arbitrationResult.conflicts.some(c => c.field === key);
      const hasSingleSourceWarning = arbitrationResult.singleSourceWarnings.some(w => w.field === key);

      // Prefer field's own validation status (set by arbitration pipeline)
      // Fall back to recalculating from arrays for backwards compatibility
      const validationStatus = field.validationStatus || 
        (hasSingleSourceWarning ? 'warning' : 'passed');
      const validationMessage = field.validationMessage || 
        (hasSingleSourceWarning ? 'Single LLM source - verify independently' : undefined);

      convertedFields[key] = {
        value: parsedValue,
        confidence: field.confidence || 'Medium',
        notes: '',
        sources: [field.source],
        llmSources: field.llmSources,
        hasConflict: hasConflict,
        conflictValues: arbitrationResult.conflicts.find(c => c.field === key)?.values || [],
        validationStatus,
        validationMessage
      };
    }

    // Transform flat fields to nested structure for PropertyDetail & other pages
    const nestedFields = convertFlatToNestedStructure(convertedFields);

    // Build sources list from unique sources in result
    const sources = Array.from(new Set(
      Object.values(arbitrationResult.fields).map(f => f.source)
    ));

    return res.status(200).json({
      success: true,
      address: searchQuery,
      fields: convertedFields,
      nestedFields: nestedFields,
      total_fields_found: totalFields,
      completion_percentage: completionPercentage,
      sources: sources,
      source_breakdown: sourceBreakdown,
      conflicts: arbitrationResult.conflicts,
      validation_failures: arbitrationResult.validationFailures,
      llm_quorum_fields: arbitrationResult.llmQuorumFields,
      single_source_warnings: arbitrationResult.singleSourceWarnings,
      llm_responses: llmResponses,
      strategy: 'arbitration_pipeline',
      cascade_order: ['perplexity', 'grok', 'claude-opus', 'gpt', 'claude-sonnet', 'gemini']
    });
  } catch (error) {
    console.error('=== SEARCH ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', (error as Error).stack);
    return res.status(500).json({
      error: 'Failed to search property',
      details: String(error),
      message: (error as Error).message,
    });
  }
}

