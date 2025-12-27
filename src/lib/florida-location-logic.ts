/**
 * Florida Location Logic - Beach vs Inland Zip Code Differentiation
 *
 * Used by SMART Score system to apply location-specific scoring adjustments.
 * Beach areas prioritize waterfront, hurricane protection, flood zones.
 * Inland areas prioritize schools, crime, commute times.
 *
 * @module florida-location-logic
 * @version 1.0.0
 * @date 2025-12-27
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type LocationType = 'beach' | 'inland';

export interface LocationInfo {
  zipCode: string;
  locationType: LocationType;
  region: string;
  county: string;
}

// =============================================================================
// FLORIDA BEACH ZIP CODES (Coastal High-Value Areas)
// =============================================================================

/**
 * Beach zip codes - Properties within 0-3 miles of beach
 * Characteristics: Higher prices, waterfront premiums, hurricane/flood concerns
 */
export const FLORIDA_BEACH_ZIPS: readonly string[] = [
  // SOUTHWEST FLORIDA - SARASOTA/SIESTA KEY/LONGBOAT KEY
  '34235', // Siesta Key
  '34236', // Osprey Beach
  '34217', // Bradenton Beach
  '34228', // Longboat Key
  '34242', // Sarasota Beach Areas
  '34209', // Anna Maria Island
  '34216', // Anna Maria

  // ST. PETE/CLEARWATER/TREASURE ISLAND
  '33706', // St. Pete Beach
  '33767', // Clearwater Beach
  '33785', // Indian Rocks Beach
  '33774', // Largo Beach Areas
  '33770', // Seminole Beach Areas
  '33786', // Belleair Beach
  '33708', // St. Petersburg Waterfront
  '33715', // Madeira Beach
  '33708', // Treasure Island

  // MIAMI BEACH/SOUTH BEACH
  '33139', // South Beach
  '33140', // Miami Beach North
  '33141', // Miami Beach Mid
  '33154', // Bal Harbour
  '33109', // Fisher Island
  '33160', // Sunny Isles Beach
  '33179', // Aventura Waterfront

  // NORTHEAST FLORIDA - ST. AUGUSTINE/PONTE VEDRA
  '32034', // Ponte Vedra Beach
  '32080', // St. Augustine Beach
  '32082', // Ponte Vedra
  '32084', // St. Augustine Beaches

  // DAYTONA BEACH AREA
  '32176', // Ormond Beach
  '32174', // Ormond-by-the-Sea
  '32169', // New Smyrna Beach
  '32118', // Daytona Beach
  '32127', // Port Orange Beach

  // SOUTHEAST FLORIDA - HOLLYWOOD/DANIA/HALLANDALE
  '33004', // Dania Beach
  '33019', // Hollywood Beach
  '33009', // Hallandale Beach
  '33308', // Fort Lauderdale Beach
  '33062', // Pompano Beach

  // NORTHWEST FLORIDA - PANHANDLE/DESTIN/30A
  '32561', // Gulf Breeze
  '32459', // Destin
  '32550', // Fort Walton Beach
  '32461', // Miramar Beach
  '32413', // Panama City Beach
  '32408', // Panama City Waterfront

  // NAPLES/MARCO ISLAND
  '34102', // Naples Beach/Old Naples
  '34108', // Naples Park Shore
  '34110', // Naples North Beach
  '34145', // Marco Island
  '34134', // Bonita Beach

  // PALM BEACH/DELRAY BEACH
  '33480', // Palm Beach
  '33483', // Delray Beach
  '33462', // Ocean Ridge
  '33435', // Boynton Beach Oceanfront

  // SPACE COAST - COCOA BEACH/MELBOURNE BEACH
  '32931', // Cocoa Beach
  '32937', // Satellite Beach
  '32951', // Indian Harbour Beach
  '32963', // Vero Beach

  // TAMPA BAY BEACHES
  '33760', // Clearwater
  '33755', // Clearwater Beach Area

  // FLORIDA KEYS
  '33040', // Key Largo
  '33036', // Islamorada
  '33050', // Marathon
  '33040', // Key West
  '33051', // Key Colony Beach
] as const;

// =============================================================================
// FLORIDA INLAND ZIP CODES (Non-Beachfront)
// =============================================================================

/**
 * Inland zip codes - Properties >5 miles from beach
 * Characteristics: Lower prices, school/crime focus, less flood/hurricane concern
 */
export const FLORIDA_INLAND_ZIPS: readonly string[] = [
  // TAMPA INLAND
  '33606', // South Tampa (Hyde Park)
  '33609', // Bayshore/Palma Ceia
  '33611', // MacDill Area
  '33618', // Carrollwood
  '33629', // Westshore
  '33614', // Town 'n' Country
  '33615', // Westchase
  '33625', // New Tampa
  '33647', // USF Area

  // ORLANDO METRO
  '32801', // Downtown Orlando
  '32803', // Lake Eola/Thornton Park
  '32804', // College Park
  '32806', // Azalea Park
  '32807', // Pine Hills
  '32808', // Metro West
  '32810', // Pine Hills North
  '32812', // East Orlando
  '32819', // Dr. Phillips
  '32835', // Windermere

  // FORT LAUDERDALE INLAND
  '33301', // Downtown Fort Lauderdale
  '33311', // Lauderdale Lakes
  '33312', // Plantation
  '33321', // Plantation North
  '33313', // Sunrise
  '33351', // Sunrise East

  // MIAMI INLAND
  '33101', // Downtown Miami
  '33125', // West Miami
  '33126', // Miami International Airport
  '33127', // Allapattah
  '33130', // Coconut Grove Inland
  '33133', // Coral Gables
  '33134', // Coral Gables West
  '33143', // South Miami
  '33155', // Kendall
  '33156', // Pinecrest
  '33165', // West Kendall
  '33175', // Fontainebleau
  '33186', // Kendall West

  // SEMINOLE COUNTY (ORLANDO SUBURBS)
  '32789', // Winter Park
  '32792', // Winter Park North
  '32765', // Oviedo
  '32779', // Longwood
  '32746', // Lake Mary
  '32714', // Altamonte Springs

  // BROWARD COUNTY INLAND
  '33324', // Plantation West
  '33326', // Weston
  '33328', // Southwest Ranches
  '33330', // Davie
  '33331', // Weston North

  // PALM BEACH COUNTY INLAND
  '33401', // West Palm Beach
  '33409', // West Palm Beach West
  '33411', // Royal Palm Beach
  '33414', // Wellington
  '33458', // Jupiter Inland
  '33478', // Jupiter Farms

  // JACKSONVILLE INLAND
  '32202', // Downtown Jacksonville
  '32210', // Riverside
  '32244', // Mandarin
  '32256', // Baymeadows
  '32257', // Deerwood

  // SARASOTA/BRADENTON INLAND
  '34231', // Sarasota Inland
  '34232', // Sarasota South Inland
  '34233', // Lakewood Ranch
  '34240', // Sarasota East
  '34243', // Lakewood Ranch North

  // NAPLES INLAND
  '34103', // Naples North Inland
  '34104', // Naples East
  '34105', // Naples Vineyards
  '34113', // Naples North Naples

  // TALLAHASSEE (STATE CAPITAL - NO BEACHES)
  '32301', // Downtown Tallahassee
  '32303', // Northeast Tallahassee
  '32308', // Eastside
  '32309', // Midtown
  '32312', // Killearn

  // GAINESVILLE (UNIVERSITY TOWN - NO BEACHES)
  '32601', // Downtown Gainesville
  '32605', // University of Florida
  '32606', // Northwest Gainesville
  '32607', // Southwest Gainesville
  '32608', // Newberry Road Area
] as const;

// =============================================================================
// COUNTY MAPPINGS (For reference and validation)
// =============================================================================

export const FLORIDA_COUNTIES = {
  // Tier 1 - Premium Counties
  tier1: {
    'St. Johns': { score: 100, regions: ['Ponte Vedra', 'St. Augustine'] },
    'Collier': { score: 100, regions: ['Naples', 'Marco Island'] },
    'Monroe': { score: 100, regions: ['Key West', 'Florida Keys'] },
    'Martin': { score: 95, regions: ['Stuart', 'Jensen Beach'] },
    'Palm Beach': { score: 100, regions: ['Palm Beach', 'Wellington', 'Boca Raton'] },
  },

  // Tier 2 - Desirable Counties
  tier2: {
    'Sarasota': { score: 88, regions: ['Sarasota', 'Siesta Key', 'Longboat Key'] },
    'Pinellas': { score: 85, regions: ['St. Pete', 'Clearwater', 'Treasure Island'] },
    'Lee': { score: 82, regions: ['Fort Myers', 'Sanibel', 'Captiva'] },
    'Broward': { score: 80, regions: ['Fort Lauderdale', 'Hollywood', 'Pompano'] },
    'Manatee': { score: 80, regions: ['Bradenton', 'Anna Maria'] },
  },

  // Tier 3 - Good Counties
  tier3: {
    'Orange': { score: 72, regions: ['Orlando', 'Winter Park'] },
    'Hillsborough': { score: 70, regions: ['Tampa', 'Brandon'] },
    'Seminole': { score: 95, regions: ['Altamonte', 'Oviedo', 'Lake Mary'] },
    'Volusia': { score: 68, regions: ['Daytona', 'Ormond Beach'] },
    'Duval': { score: 68, regions: ['Jacksonville'] },
  },
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Determine if a zip code is in a beach area
 *
 * @param zipCode - 5-digit zip code (string or number)
 * @returns true if beach area, false if inland or unknown
 */
export function isBeachZipCode(zipCode: string | number): boolean {
  const zip = String(zipCode).trim().slice(0, 5);
  return FLORIDA_BEACH_ZIPS.includes(zip);
}

/**
 * Determine if a zip code is in an inland area
 *
 * @param zipCode - 5-digit zip code (string or number)
 * @returns true if inland area, false if beach or unknown
 */
export function isInlandZipCode(zipCode: string | number): boolean {
  const zip = String(zipCode).trim().slice(0, 5);
  return FLORIDA_INLAND_ZIPS.includes(zip);
}

/**
 * Get the location type for a given zip code
 * Default to 'inland' if zip not found in either list
 *
 * @param zipCode - 5-digit zip code (string or number)
 * @returns 'beach' or 'inland'
 */
export function getLocationType(zipCode: string | number): LocationType {
  const zip = String(zipCode).trim().slice(0, 5);

  if (FLORIDA_BEACH_ZIPS.includes(zip)) {
    return 'beach';
  }

  // Default to inland if not in beach list
  // This is conservative - inland scoring is less aggressive
  return 'inland';
}

/**
 * Get detailed location information for a zip code
 *
 * @param zipCode - 5-digit zip code (string or number)
 * @returns LocationInfo object with type, region, county
 */
export function getLocationInfo(zipCode: string | number): LocationInfo {
  const zip = String(zipCode).trim().slice(0, 5);
  const locationType = getLocationType(zip);

  // Attempt to identify region and county
  // This is a simplified version - full implementation would use a lookup table
  let region = 'Unknown';
  let county = 'Unknown';

  // Sarasota area
  if (['34235', '34236', '34217', '34228', '34242'].includes(zip)) {
    region = 'Sarasota/Siesta Key';
    county = 'Sarasota';
  }
  // St. Pete/Clearwater
  else if (['33706', '33767', '33785', '33774', '33770'].includes(zip)) {
    region = 'St. Pete/Clearwater';
    county = 'Pinellas';
  }
  // Miami Beach
  else if (['33139', '33140', '33141', '33154', '33109'].includes(zip)) {
    region = 'Miami Beach';
    county = 'Miami-Dade';
  }
  // Tampa Inland
  else if (['33606', '33609', '33611', '33618'].includes(zip)) {
    region = 'Tampa';
    county = 'Hillsborough';
  }
  // Orlando
  else if (['32801', '32803', '32804', '32806'].includes(zip)) {
    region = 'Orlando';
    county = 'Orange';
  }

  return {
    zipCode: zip,
    locationType,
    region,
    county,
  };
}

/**
 * Check if a zip code is valid Florida zip
 * Florida zips: 32000-34999
 *
 * @param zipCode - 5-digit zip code (string or number)
 * @returns true if valid FL zip format
 */
export function isValidFloridaZip(zipCode: string | number): boolean {
  const zip = String(zipCode).trim().slice(0, 5);

  // Must be 5 digits
  if (!/^\d{5}$/.test(zip)) {
    return false;
  }

  const zipNum = parseInt(zip, 10);

  // Florida zip range: 32000-34999
  return zipNum >= 32000 && zipNum <= 34999;
}

/**
 * Get scoring multiplier based on location type
 * Used for fields where beach/inland makes a difference
 *
 * @param zipCode - 5-digit zip code
 * @param field - Field name (e.g., 'pool', 'school', 'flood')
 * @returns Multiplier to apply to base score
 */
export function getLocationMultiplier(
  zipCode: string | number,
  field: 'pool' | 'waterfront' | 'flood' | 'hurricane' | 'school' | 'walkScore' | 'beach'
): number {
  const locationType = getLocationType(zipCode);

  const multipliers: Record<typeof field, { beach: number; inland: number }> = {
    pool: { beach: 1.2, inland: 1.0 },           // Pools more critical in beach areas
    waterfront: { beach: 1.5, inland: 0.8 },     // Waterfront premium in beach areas
    flood: { beach: 1.3, inland: 1.0 },          // Flood risk more critical for beach
    hurricane: { beach: 1.3, inland: 1.0 },      // Hurricane risk more critical for beach
    school: { beach: 0.9, inland: 1.2 },         // Schools more critical inland (families vs retirees)
    walkScore: { beach: 0.8, inland: 1.1 },      // Walkability more critical inland
    beach: { beach: 1.5, inland: 0.5 },          // Distance to beach obviously more critical for beach!
  };

  return multipliers[field][locationType];
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  FLORIDA_BEACH_ZIPS,
  FLORIDA_INLAND_ZIPS,
  FLORIDA_COUNTIES,
  isBeachZipCode,
  isInlandZipCode,
  getLocationType,
  getLocationInfo,
  isValidFloridaZip,
  getLocationMultiplier,
};
