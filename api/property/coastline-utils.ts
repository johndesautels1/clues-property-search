/**
 * COASTLINE UTILITIES - Single Source of Truth for Florida Coastline Distance Calculations
 *
 * This file contains:
 * 1. The authoritative Florida coastline points array (60 points)
 * 2. Haversine distance calculation function
 * 3. Google Places beach distance validation
 *
 * IMPORTANT: This is the ONLY place coastline points should be defined.
 * search.ts and free-apis.ts should import from here.
 */

// Comprehensive Florida coastline points (Gulf, Atlantic, Keys, Tampa Bay, etc.)
// 60 total points covering all major coastal areas
export const FLORIDA_COASTLINE_POINTS = [
  // Gulf Coast - Panhandle (West to East)
  { lat: 30.3935, lon: -87.2169 }, // Pensacola Beach
  { lat: 30.3960, lon: -86.4958 }, // Destin
  { lat: 30.1588, lon: -85.6557 }, // Panama City Beach
  { lat: 29.9074, lon: -84.9808 }, // St. George Island
  { lat: 29.6516, lon: -84.3483 }, // Shell Point

  // Gulf Coast - Big Bend
  { lat: 29.1348, lon: -83.0353 }, // Cedar Key
  { lat: 28.8206, lon: -82.7579 }, // Crystal River
  { lat: 28.5383, lon: -82.6465 }, // Homosassa

  // Gulf Coast - Tampa Bay Area
  { lat: 28.3922, lon: -82.7381 }, // Weeki Wachee
  { lat: 28.2181, lon: -82.7709 }, // Bayport
  { lat: 28.1070, lon: -82.7376 }, // Hudson Beach
  { lat: 28.0156, lon: -82.7523 }, // New Port Richey
  { lat: 27.9506, lon: -82.4572 }, // Tampa Bay
  { lat: 27.8483, lon: -82.7618 }, // Clearwater Beach
  { lat: 27.7949, lon: -82.8401 }, // Madeira Beach / Treasure Island
  { lat: 27.7676, lon: -82.6403 }, // St. Pete Beach
  { lat: 27.6648, lon: -82.7282 }, // Pass-a-Grille

  // Gulf Coast - Central West
  { lat: 27.4989, lon: -82.5748 }, // Anna Maria Island
  { lat: 27.4706, lon: -82.7034 }, // Bradenton Beach
  { lat: 27.3364, lon: -82.5307 }, // Sarasota / Lido Key
  { lat: 27.2052, lon: -82.4543 }, // Siesta Key
  { lat: 27.0339, lon: -82.4515 }, // Venice Beach
  { lat: 26.9342, lon: -82.2810 }, // Fort Myers Beach
  { lat: 26.5629, lon: -82.0231 }, // Sanibel Island
  { lat: 26.4619, lon: -81.9480 }, // Captiva Island

  // Gulf Coast - Southwest
  { lat: 26.3856, lon: -81.8073 }, // Bonita Beach
  { lat: 26.1420, lon: -81.7948 }, // Naples
  { lat: 25.9399, lon: -81.7081 }, // Marco Island
  { lat: 25.8615, lon: -81.3792 }, // Everglades City

  // Florida Keys - Upper & Middle
  { lat: 25.5516, lon: -80.3997 }, // Key Largo
  { lat: 25.1372, lon: -80.6137 }, // Islamorada
  { lat: 24.7210, lon: -81.1060 }, // Marathon
  { lat: 24.5557, lon: -81.7782 }, // Key West

  // Atlantic Coast - Southeast
  { lat: 25.7617, lon: -80.1918 }, // Miami Beach
  { lat: 25.8736, lon: -80.1239 }, // Sunny Isles Beach
  { lat: 26.1224, lon: -80.0993 }, // Hollywood Beach
  { lat: 26.1420, lon: -80.0989 }, // Dania Beach
  { lat: 26.1224, lon: -80.1043 }, // Fort Lauderdale Beach
  { lat: 26.2159, lon: -80.0978 }, // Pompano Beach
  { lat: 26.3683, lon: -80.0832 }, // Boca Raton Beach
  { lat: 26.7056, lon: -80.0364 }, // Palm Beach
  { lat: 26.9478, lon: -80.0503 }, // Jupiter Beach

  // Atlantic Coast - Treasure Coast
  { lat: 27.2046, lon: -80.1937 }, // Stuart Beach
  { lat: 27.4667, lon: -80.3256 }, // Fort Pierce Beach
  { lat: 27.6648, lon: -80.3675 }, // Vero Beach
  { lat: 27.8106, lon: -80.4773 }, // Sebastian Inlet

  // Atlantic Coast - Space Coast
  { lat: 28.0837, lon: -80.6081 }, // Melbourne Beach
  { lat: 28.3922, lon: -80.6077 }, // Cocoa Beach
  { lat: 28.4158, lon: -80.6098 }, // Cape Canaveral
  { lat: 28.9931, lon: -80.8270 }, // New Smyrna Beach
  { lat: 29.2283, lon: -81.0226 }, // Daytona Beach
  { lat: 29.6684, lon: -81.2081 }, // Flagler Beach

  // Atlantic Coast - Northeast
  { lat: 29.9510, lon: -81.3124 }, // Marineland
  { lat: 30.2672, lon: -81.3993 }, // St. Augustine Beach
  { lat: 30.3322, lon: -81.3928 }, // Vilano Beach
  { lat: 30.4213, lon: -81.4313 }, // Ponte Vedra Beach
  { lat: 30.6954, lon: -81.5074 }, // Jacksonville Beach
  { lat: 30.7335, lon: -81.4421 }, // Atlantic Beach
  { lat: 30.6727, lon: -81.4651 }, // Neptune Beach
  { lat: 30.5427, lon: -81.4446 }, // Fernandina Beach
];

/**
 * Calculate straight-line distance to nearest coastline point using Haversine formula
 * @param propLat Property latitude
 * @param propLon Property longitude
 * @returns Distance in miles to nearest coastline point
 */
export function calculateCoastlineDistance(propLat: number, propLon: number): number {
  let minDistance = Infinity;

  for (const point of FLORIDA_COASTLINE_POINTS) {
    const R = 3959; // Earth radius in miles
    const dLat = (point.lat - propLat) * Math.PI / 180;
    const dLon = (point.lon - propLon) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(propLat * Math.PI / 180) * Math.cos(point.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
}

/**
 * Validation threshold for Google Places beach distance vs coastline calculation
 * If Google says X miles but coastline calc says Y miles, and |X - Y| > THRESHOLD,
 * then Google's result is likely a false positive (pool, beach club, restaurant, etc.)
 */
export const BEACH_DISTANCE_VALIDATION_THRESHOLD = 3; // miles

/**
 * Validate Google Places beach distance against coastline calculation
 * Returns the most accurate distance based on consensus
 *
 * @param googleDistance Distance from Google Places (may be to a "beach" that's not ocean)
 * @param lat Property latitude
 * @param lon Property longitude
 * @returns Object with validated distance, source, and whether Google was rejected
 */
export function validateBeachDistance(
  googleDistance: number | undefined,
  lat: number,
  lon: number
): { distance: number; source: string; googleRejected: boolean; reason?: string } {
  const coastlineDistance = calculateCoastlineDistance(lat, lon);

  // If no Google result, use coastline calculation
  if (googleDistance === undefined || googleDistance === null || isNaN(googleDistance)) {
    console.log(`[COASTLINE] No Google beach distance, using coastline calc: ${coastlineDistance.toFixed(1)} mi`);
    return {
      distance: coastlineDistance,
      source: 'Coastline Calculation',
      googleRejected: false,
      reason: 'Google Places unavailable'
    };
  }

  // Calculate the difference
  const difference = Math.abs(googleDistance - coastlineDistance);

  // If difference is within threshold, trust Google (more specific)
  if (difference <= BEACH_DISTANCE_VALIDATION_THRESHOLD) {
    console.log(`[COASTLINE] ✅ Google beach distance validated: ${googleDistance.toFixed(1)} mi (coastline: ${coastlineDistance.toFixed(1)} mi, diff: ${difference.toFixed(1)} mi)`);
    return {
      distance: googleDistance,
      source: 'Google Places',
      googleRejected: false
    };
  }

  // If Google says property is CLOSER to beach than coastline calc suggests,
  // Google probably found a pool, beach club, or restaurant - REJECT
  if (googleDistance < coastlineDistance) {
    console.warn(`[COASTLINE] ⚠️ REJECTING Google beach distance: ${googleDistance.toFixed(1)} mi (coastline calc: ${coastlineDistance.toFixed(1)} mi)`);
    console.warn(`[COASTLINE] → Google likely found a pool/beach club/restaurant, not actual coastline`);
    return {
      distance: coastlineDistance,
      source: 'Coastline Calculation (Google Rejected)',
      googleRejected: true,
      reason: `Google found "${googleDistance.toFixed(1)} mi" but coastline is ${coastlineDistance.toFixed(1)} mi away - likely false positive`
    };
  }

  // If Google says property is FARTHER than coastline calc, Google might have found
  // a more distant named beach - use the closer coastline distance
  console.warn(`[COASTLINE] ⚠️ Google beach farther than coastline: ${googleDistance.toFixed(1)} mi vs ${coastlineDistance.toFixed(1)} mi - using closer coastline`);
  return {
    distance: coastlineDistance,
    source: 'Coastline Calculation',
    googleRejected: true,
    reason: `Google found distant beach (${googleDistance.toFixed(1)} mi), coastline is closer (${coastlineDistance.toFixed(1)} mi)`
  };
}

/**
 * Determine sea level rise risk based on distance to coast
 * Florida-specific thresholds based on NOAA data
 */
export function getSeaLevelRiskFromDistance(distanceToCoast: number): {
  risk: 'High' | 'Moderate' | 'Low' | 'Minimal';
  description: string;
} {
  if (distanceToCoast < 5) {
    return { risk: 'High', description: `${Math.round(distanceToCoast)} mi from coast - significant long-term risk` };
  } else if (distanceToCoast < 15) {
    return { risk: 'Moderate', description: `${Math.round(distanceToCoast)} mi from coast - consider 30-year outlook` };
  } else if (distanceToCoast < 30) {
    return { risk: 'Low', description: `${Math.round(distanceToCoast)} mi from coast - minimal concern` };
  } else {
    return { risk: 'Minimal', description: `${Math.round(distanceToCoast)} mi from coast - inland property` };
  }
}
