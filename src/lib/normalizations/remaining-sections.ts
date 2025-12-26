/**
 * CLUES SMART Score Engine - Remaining Sections Normalization Functions
 *
 * This file contains normalization functions for the following sections:
 * - Section A: Address & Identity (fields 6, 7, 8)
 * - Section F: Interior Features (fields 49, 50, 51, 52)
 * - Section G: Exterior Features (fields 54, 55, 56, 57, 58)
 * - Section H: Permits & Renovations (fields 59, 60, 61, 62)
 * - Section K: Distances & Amenities (fields 83, 84, 85, 86, 87)
 * - Section L: Safety & Crime (fields 88, 89, 90)
 * - Section N: Utilities & Connectivity (fields 105, 107, 109, 111, 112, 113, 115, 116)
 * - Section P: Additional Features (fields 131, 132, 133, 134, 135, 136, 137, 138)
 * - Section Q: Parking (fields 139, 140, 141, 142, 143)
 * - Section R: Building (fields 144, 147, 148)
 * - Section S: Legal (fields 151, 152, 153, 154)
 * - Section T: Waterfront (fields 155, 156, 157, 158, 159)
 * - Section U: Leasing (fields 160, 161, 162, 165)
 * - Section V: Features (fields 166, 167, 168)
 *
 * Each function normalizes a raw field value to a 0-100 score.
 * Optimized for Florida coastal market characteristics.
 *
 * @author CLUES Engine
 * @version 1.0.0
 * @date 2025-12-26
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface NormalizationResult {
  score: number;          // 0-100 normalized score
  confidence: 'High' | 'Medium' | 'Low';
  reason?: string;        // Optional explanation for the score
}

export type NormalizationFunction = (value: any) => NormalizationResult;

// =============================================================================
// SECTION A: ADDRESS & IDENTITY (Fields 6, 7, 8)
// Weight: 0% in industry standard (identifiers), but can be scored for prestige
// =============================================================================

/**
 * Field 6: Neighborhood
 * Premium neighborhoods in Florida coastal areas add value.
 * Score based on neighborhood prestige/desirability.
 */
export function normalizeNeighborhood(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 50, confidence: 'Low', reason: 'No neighborhood data' };
  }

  const neighborhood = value.toLowerCase().trim();

  // Florida premium neighborhood keywords (coastal market)
  const premiumKeywords = [
    'beach', 'waterfront', 'bay', 'harbor', 'marina', 'island',
    'gulf', 'ocean', 'coastal', 'shore', 'palm', 'paradise',
    'estates', 'reserve', 'preserve', 'country club', 'golf',
    'lakefront', 'lakeside', 'riverview', 'riverside'
  ];

  const midTierKeywords = [
    'village', 'gardens', 'heights', 'hills', 'grove', 'meadows',
    'park', 'woods', 'forest', 'pines', 'oaks', 'trails'
  ];

  const premiumMatch = premiumKeywords.some(kw => neighborhood.includes(kw));
  const midTierMatch = midTierKeywords.some(kw => neighborhood.includes(kw));

  if (premiumMatch) {
    return { score: 90, confidence: 'Medium', reason: 'Premium FL neighborhood' };
  } else if (midTierMatch) {
    return { score: 70, confidence: 'Medium', reason: 'Mid-tier neighborhood' };
  }

  // Default for unknown neighborhoods
  return { score: 50, confidence: 'Low', reason: 'Neighborhood not recognized' };
}

/**
 * Field 7: County
 * Florida county desirability affects property values.
 * Based on tax rates, services, and market strength.
 */
export function normalizeCounty(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 50, confidence: 'Low', reason: 'No county data' };
  }

  const county = value.toLowerCase().trim().replace(' county', '');

  // Florida county tiers by desirability and property values
  const tier1Counties = ['palm beach', 'collier', 'miami-dade', 'monroe', 'martin'];
  const tier2Counties = ['sarasota', 'pinellas', 'lee', 'broward', 'st. johns', 'manatee'];
  const tier3Counties = ['hillsborough', 'orange', 'duval', 'volusia', 'brevard', 'indian river'];
  const tier4Counties = ['osceola', 'pasco', 'polk', 'seminole', 'lake', 'escambia'];

  if (tier1Counties.some(c => county.includes(c))) {
    return { score: 95, confidence: 'High', reason: 'Premium FL county - high property values' };
  } else if (tier2Counties.some(c => county.includes(c))) {
    return { score: 80, confidence: 'High', reason: 'Desirable FL county' };
  } else if (tier3Counties.some(c => county.includes(c))) {
    return { score: 65, confidence: 'High', reason: 'Good FL county' };
  } else if (tier4Counties.some(c => county.includes(c))) {
    return { score: 50, confidence: 'Medium', reason: 'Average FL county' };
  }

  return { score: 45, confidence: 'Low', reason: 'County not in FL premium list' };
}

/**
 * Field 8: ZIP Code
 * ZIP codes have strong price correlation in Florida.
 * Premium coastal ZIPs vs inland.
 */
export function normalizeZipCode(value: any): NormalizationResult {
  if (!value) {
    return { score: 50, confidence: 'Low', reason: 'No ZIP code' };
  }

  const zip = String(value).trim().slice(0, 5);
  if (!/^\d{5}$/.test(zip)) {
    return { score: 50, confidence: 'Low', reason: 'Invalid ZIP format' };
  }

  const zipNum = parseInt(zip, 10);

  // Florida ZIP code ranges and their desirability
  // Premium coastal areas: 33XXX (Miami-Dade, Broward, Palm Beach coastal)
  // Naples/Marco Island: 341XX
  // Keys: 330XX, 331XX
  // Sarasota/Tampa Bay: 337XX, 338XX

  // Premium coastal ZIPs
  if ((zipNum >= 33101 && zipNum <= 33199) || // Miami Beach, Key Biscayne
      (zipNum >= 33301 && zipNum <= 33399) || // Fort Lauderdale Beach
      (zipNum >= 33401 && zipNum <= 33499) || // Palm Beach
      (zipNum >= 34101 && zipNum <= 34145) || // Naples, Marco Island
      (zipNum >= 33040 && zipNum <= 33052)) { // Florida Keys
    return { score: 92, confidence: 'High', reason: 'Premium FL coastal ZIP' };
  }

  // Good coastal ZIPs
  if ((zipNum >= 33701 && zipNum <= 33799) || // St. Pete Beach, Clearwater
      (zipNum >= 34201 && zipNum <= 34299) || // Bradenton Beach, Anna Maria
      (zipNum >= 32082 && zipNum <= 32092)) { // Ponte Vedra, St. Augustine Beach
    return { score: 78, confidence: 'High', reason: 'Desirable FL coastal ZIP' };
  }

  // Central FL / Orlando area
  if (zipNum >= 32801 && zipNum <= 32899) {
    return { score: 60, confidence: 'Medium', reason: 'Central FL urban ZIP' };
  }

  // Generic Florida ZIP
  if (zipNum >= 32000 && zipNum <= 34999) {
    return { score: 50, confidence: 'Medium', reason: 'Florida ZIP - average market' };
  }

  return { score: 45, confidence: 'Low', reason: 'Non-Florida or unknown ZIP' };
}

// =============================================================================
// SECTION F: INTERIOR FEATURES (Fields 49, 50, 51, 52)
// Weight: 1% in industry standard
// =============================================================================

/**
 * Field 49: Flooring Type
 * Premium flooring adds value. Hardwood/Tile > Laminate > Carpet.
 */
export function normalizeFlooringType(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 50, confidence: 'Low', reason: 'No flooring data' };
  }

  const flooring = value.toLowerCase().trim();

  // Premium flooring types (especially for FL - tile is king)
  if (flooring.includes('marble') || flooring.includes('travertine') ||
      flooring.includes('natural stone') || flooring.includes('porcelain')) {
    return { score: 95, confidence: 'High', reason: 'Premium stone/porcelain flooring' };
  }

  if (flooring.includes('hardwood') || flooring.includes('wood') ||
      flooring.includes('engineered wood')) {
    return { score: 85, confidence: 'High', reason: 'Hardwood flooring' };
  }

  if (flooring.includes('tile') || flooring.includes('ceramic')) {
    return { score: 80, confidence: 'High', reason: 'Tile flooring - ideal for FL' };
  }

  if (flooring.includes('luxury vinyl') || flooring.includes('lvp') ||
      flooring.includes('lvt')) {
    return { score: 70, confidence: 'Medium', reason: 'Luxury vinyl flooring' };
  }

  if (flooring.includes('laminate')) {
    return { score: 55, confidence: 'Medium', reason: 'Laminate flooring' };
  }

  if (flooring.includes('carpet')) {
    return { score: 40, confidence: 'Medium', reason: 'Carpet - not ideal for FL humidity' };
  }

  return { score: 50, confidence: 'Low', reason: 'Unknown flooring type' };
}

/**
 * Field 50: Kitchen Features
 * Updated kitchens with premium features add significant value.
 */
export function normalizeKitchenFeatures(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 40, confidence: 'Low', reason: 'No kitchen features listed' };
  }

  const kitchen = value.toLowerCase().trim();
  let score = 40; // Base score

  // Premium countertops
  if (kitchen.includes('granite') || kitchen.includes('quartz') ||
      kitchen.includes('marble') || kitchen.includes('quartzite')) {
    score += 20;
  }

  // Premium appliances
  if (kitchen.includes('stainless') || kitchen.includes('sub-zero') ||
      kitchen.includes('viking') || kitchen.includes('wolf') ||
      kitchen.includes('thermador') || kitchen.includes('miele')) {
    score += 15;
  }

  // Modern features
  if (kitchen.includes('island') || kitchen.includes('breakfast bar')) {
    score += 10;
  }

  if (kitchen.includes('updated') || kitchen.includes('renovated') ||
      kitchen.includes('remodeled')) {
    score += 10;
  }

  if (kitchen.includes('walk-in pantry') || kitchen.includes('butler')) {
    score += 5;
  }

  const finalScore = Math.min(100, score);
  const confidence: 'High' | 'Medium' | 'Low' = finalScore >= 70 ? 'High' : 'Medium';

  return {
    score: finalScore,
    confidence,
    reason: `Kitchen features score: ${finalScore}`
  };
}

/**
 * Field 51: Appliances Included
 * More included appliances = more move-in ready = higher value.
 */
export function normalizeAppliancesIncluded(value: any): NormalizationResult {
  if (!value) {
    return { score: 30, confidence: 'Low', reason: 'No appliance data' };
  }

  let appliances: string[] = [];

  if (Array.isArray(value)) {
    appliances = value.map(a => String(a).toLowerCase());
  } else if (typeof value === 'string') {
    appliances = value.toLowerCase().split(',').map(a => a.trim());
  }

  if (appliances.length === 0) {
    return { score: 30, confidence: 'Low', reason: 'No appliances listed' };
  }

  const essentialAppliances = ['refrigerator', 'fridge', 'range', 'oven', 'stove',
                               'dishwasher', 'microwave', 'disposal'];
  const bonusAppliances = ['washer', 'dryer', 'wine cooler', 'ice maker',
                           'trash compactor', 'warming drawer'];

  let essentialCount = 0;
  let bonusCount = 0;

  appliances.forEach(app => {
    if (essentialAppliances.some(ea => app.includes(ea))) {
      essentialCount++;
    }
    if (bonusAppliances.some(ba => app.includes(ba))) {
      bonusCount++;
    }
  });

  // Score calculation
  const essentialScore = Math.min(60, essentialCount * 12);
  const bonusScore = Math.min(40, bonusCount * 10);
  const finalScore = Math.min(100, essentialScore + bonusScore);

  return {
    score: finalScore,
    confidence: finalScore >= 50 ? 'High' : 'Medium',
    reason: `${essentialCount} essential, ${bonusCount} bonus appliances`
  };
}

/**
 * Field 52: Fireplace Y/N
 * Fireplace adds ambiance value, though less critical in Florida.
 */
export function normalizeFireplaceYn(value: any): NormalizationResult {
  if (value === null || value === undefined) {
    return { score: 50, confidence: 'Low', reason: 'No fireplace data' };
  }

  const hasFireplace = value === true ||
                       value === 'true' ||
                       value === 'yes' ||
                       value === 'Yes' ||
                       value === 1 ||
                       value === '1';

  if (hasFireplace) {
    // In FL, fireplace is nice-to-have but not essential
    return { score: 70, confidence: 'High', reason: 'Has fireplace - ambiance value' };
  }

  // No fireplace is neutral in Florida (not a penalty)
  return { score: 50, confidence: 'High', reason: 'No fireplace - neutral for FL' };
}

// =============================================================================
// SECTION G: EXTERIOR FEATURES (Fields 54, 55, 56, 57, 58)
// Weight: 2% in industry standard
// =============================================================================

/**
 * Field 54: Pool Y/N
 * Pool is a MAJOR amenity in Florida. Critical for resale.
 */
export function normalizePoolYn(value: any): NormalizationResult {
  if (value === null || value === undefined) {
    return { score: 40, confidence: 'Low', reason: 'No pool data' };
  }

  const hasPool = value === true ||
                  value === 'true' ||
                  value === 'yes' ||
                  value === 'Yes' ||
                  value === 1 ||
                  value === '1';

  if (hasPool) {
    return { score: 100, confidence: 'High', reason: 'Pool - major FL amenity' };
  }

  // No pool in FL is a significant disadvantage for many buyers
  return { score: 35, confidence: 'High', reason: 'No pool - disadvantage in FL market' };
}

/**
 * Field 55: Pool Type
 * Premium pool types add more value.
 */
export function normalizePoolType(value: any): NormalizationResult {
  if (!value || value === 'N/A' || value === 'None') {
    return { score: 30, confidence: 'Medium', reason: 'No pool or N/A' };
  }

  const poolType = typeof value === 'string' ? value.toLowerCase().trim() :
                   Array.isArray(value) ? value.join(' ').toLowerCase() : '';

  // Premium pool features
  if (poolType.includes('heated') || poolType.includes('saltwater') ||
      poolType.includes('infinity') || poolType.includes('resort')) {
    return { score: 100, confidence: 'High', reason: 'Premium pool features' };
  }

  if (poolType.includes('in-ground') || poolType.includes('inground') ||
      poolType.includes('gunite') || poolType.includes('fiberglass')) {
    return { score: 90, confidence: 'High', reason: 'In-ground pool' };
  }

  if (poolType.includes('screen') || poolType.includes('lanai')) {
    return { score: 85, confidence: 'High', reason: 'Screened pool - ideal for FL' };
  }

  if (poolType.includes('community') || poolType.includes('hoa')) {
    return { score: 60, confidence: 'Medium', reason: 'Community pool access' };
  }

  if (poolType.includes('above-ground') || poolType.includes('aboveground')) {
    return { score: 45, confidence: 'Medium', reason: 'Above-ground pool' };
  }

  return { score: 70, confidence: 'Low', reason: 'Pool type unrecognized' };
}

/**
 * Field 56: Deck/Patio
 * Outdoor living space is essential in Florida.
 */
export function normalizeDeckPatio(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 30, confidence: 'Low', reason: 'No deck/patio data' };
  }

  const outdoor = value.toLowerCase().trim();
  let score = 50;

  // Premium outdoor features
  if (outdoor.includes('screened') || outdoor.includes('lanai')) {
    score += 25; // Screened porch is essential in FL (bugs!)
  }

  if (outdoor.includes('covered') || outdoor.includes('roof')) {
    score += 15;
  }

  if (outdoor.includes('paver') || outdoor.includes('travertine') ||
      outdoor.includes('stone')) {
    score += 15;
  }

  if (outdoor.includes('outdoor kitchen') || outdoor.includes('summer kitchen')) {
    score += 20;
  }

  if (outdoor.includes('pergola') || outdoor.includes('gazebo')) {
    score += 10;
  }

  if (outdoor.includes('deck') || outdoor.includes('patio')) {
    score += 10;
  }

  const finalScore = Math.min(100, score);
  return {
    score: finalScore,
    confidence: finalScore >= 60 ? 'High' : 'Medium',
    reason: `Outdoor living score: ${finalScore}`
  };
}

/**
 * Field 57: Fence
 * Fencing adds privacy and pet/child safety.
 */
export function normalizeFence(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 40, confidence: 'Low', reason: 'No fence data' };
  }

  const fence = value.toLowerCase().trim();

  // Premium fencing
  if (fence.includes('privacy') || fence.includes('block') ||
      fence.includes('masonry') || fence.includes('stucco')) {
    return { score: 90, confidence: 'High', reason: 'Premium privacy fence' };
  }

  if (fence.includes('aluminum') || fence.includes('wrought iron') ||
      fence.includes('ornamental')) {
    return { score: 85, confidence: 'High', reason: 'Decorative metal fence' };
  }

  if (fence.includes('vinyl') || fence.includes('pvc')) {
    return { score: 75, confidence: 'High', reason: 'Vinyl fence - low maintenance' };
  }

  if (fence.includes('wood') || fence.includes('cedar')) {
    return { score: 65, confidence: 'Medium', reason: 'Wood fence - needs maintenance in FL' };
  }

  if (fence.includes('chain link') || fence.includes('chainlink')) {
    return { score: 45, confidence: 'Medium', reason: 'Chain link fence - functional only' };
  }

  if (fence.includes('partial') || fence.includes('front only')) {
    return { score: 55, confidence: 'Medium', reason: 'Partial fencing' };
  }

  if (fence.includes('none') || fence.includes('no fence')) {
    return { score: 30, confidence: 'High', reason: 'No fence' };
  }

  return { score: 60, confidence: 'Low', reason: 'Fence type unrecognized' };
}

/**
 * Field 58: Landscaping
 * Professional landscaping adds curb appeal.
 */
export function normalizeLandscaping(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 40, confidence: 'Low', reason: 'No landscaping data' };
  }

  const landscaping = value.toLowerCase().trim();
  let score = 50;

  // Professional/premium landscaping
  if (landscaping.includes('professional') || landscaping.includes('mature') ||
      landscaping.includes('lush') || landscaping.includes('tropical')) {
    score += 25;
  }

  if (landscaping.includes('irrigation') || landscaping.includes('sprinkler')) {
    score += 15;
  }

  if (landscaping.includes('palm') || landscaping.includes('fruit tree') ||
      landscaping.includes('citrus')) {
    score += 10;
  }

  if (landscaping.includes('lighting') || landscaping.includes('landscape light')) {
    score += 10;
  }

  if (landscaping.includes('xeriscaping') || landscaping.includes('drought')) {
    score += 10; // Water-wise landscaping
  }

  if (landscaping.includes('minimal') || landscaping.includes('basic')) {
    score = 45;
  }

  if (landscaping.includes('needs work') || landscaping.includes('overgrown')) {
    score = 25;
  }

  const finalScore = Math.min(100, Math.max(20, score));
  return {
    score: finalScore,
    confidence: finalScore >= 60 ? 'Medium' : 'Low',
    reason: `Landscaping score: ${finalScore}`
  };
}

// =============================================================================
// SECTION H: PERMITS & RENOVATIONS (Fields 59, 60, 61, 62)
// Weight: 0.5% in industry standard
// =============================================================================

/**
 * Field 59: Recent Renovations
 * Recent updates add value and reduce future costs.
 */
export function normalizeRecentRenovations(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 40, confidence: 'Low', reason: 'No renovation data' };
  }

  const renovations = value.toLowerCase().trim();
  let score = 40;

  // Major renovations
  if (renovations.includes('complete') || renovations.includes('full renovation') ||
      renovations.includes('gut renovation')) {
    return { score: 100, confidence: 'High', reason: 'Complete renovation' };
  }

  // High-value renovations
  if (renovations.includes('kitchen')) score += 20;
  if (renovations.includes('bathroom') || renovations.includes('bath')) score += 15;
  if (renovations.includes('roof')) score += 15;
  if (renovations.includes('hvac') || renovations.includes('ac')) score += 10;
  if (renovations.includes('electrical')) score += 10;
  if (renovations.includes('plumbing')) score += 10;
  if (renovations.includes('window')) score += 10;
  if (renovations.includes('flooring') || renovations.includes('floor')) score += 8;
  if (renovations.includes('paint')) score += 5;

  // Check for recency
  const currentYear = new Date().getFullYear();
  const yearMatch = renovations.match(/20[12]\d/);
  if (yearMatch) {
    const renovYear = parseInt(yearMatch[0], 10);
    if (currentYear - renovYear <= 2) score += 10;
    else if (currentYear - renovYear <= 5) score += 5;
  }

  const finalScore = Math.min(100, score);
  return {
    score: finalScore,
    confidence: finalScore >= 60 ? 'High' : 'Medium',
    reason: `Renovation score: ${finalScore}`
  };
}

/**
 * Field 60: Permit History - Roof
 * Permitted roof work = quality and insurability.
 */
export function normalizePermitHistoryRoof(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 50, confidence: 'Low', reason: 'No roof permit data' };
  }

  const permit = value.toLowerCase().trim();
  const currentYear = new Date().getFullYear();

  // Extract year from permit
  const yearMatch = permit.match(/20[012]\d/);

  if (permit.includes('no permit') || permit.includes('none') ||
      permit.includes('not found')) {
    return { score: 40, confidence: 'Medium', reason: 'No roof permit on record' };
  }

  if (yearMatch) {
    const permitYear = parseInt(yearMatch[0], 10);
    const age = currentYear - permitYear;

    if (age <= 5) {
      return { score: 100, confidence: 'High', reason: 'Recent permitted roof (0-5 yrs)' };
    } else if (age <= 10) {
      return { score: 85, confidence: 'High', reason: 'Permitted roof (6-10 yrs)' };
    } else if (age <= 15) {
      return { score: 65, confidence: 'Medium', reason: 'Older permitted roof (11-15 yrs)' };
    } else {
      return { score: 45, confidence: 'Medium', reason: 'Old roof permit (15+ yrs)' };
    }
  }

  if (permit.includes('permit') || permit.includes('approved')) {
    return { score: 70, confidence: 'Low', reason: 'Permit exists but age unknown' };
  }

  return { score: 50, confidence: 'Low', reason: 'Roof permit data unclear' };
}

/**
 * Field 61: Permit History - HVAC
 * Permitted HVAC work indicates system reliability.
 */
export function normalizePermitHistoryHvac(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 50, confidence: 'Low', reason: 'No HVAC permit data' };
  }

  const permit = value.toLowerCase().trim();
  const currentYear = new Date().getFullYear();

  const yearMatch = permit.match(/20[012]\d/);

  if (permit.includes('no permit') || permit.includes('none') ||
      permit.includes('not found')) {
    return { score: 40, confidence: 'Medium', reason: 'No HVAC permit on record' };
  }

  if (yearMatch) {
    const permitYear = parseInt(yearMatch[0], 10);
    const age = currentYear - permitYear;

    if (age <= 5) {
      return { score: 100, confidence: 'High', reason: 'Recent permitted HVAC (0-5 yrs)' };
    } else if (age <= 10) {
      return { score: 80, confidence: 'High', reason: 'Permitted HVAC (6-10 yrs)' };
    } else if (age <= 15) {
      return { score: 55, confidence: 'Medium', reason: 'Older permitted HVAC (11-15 yrs)' };
    } else {
      return { score: 35, confidence: 'Medium', reason: 'Old HVAC permit (15+ yrs) - replacement likely needed' };
    }
  }

  if (permit.includes('permit') || permit.includes('approved')) {
    return { score: 65, confidence: 'Low', reason: 'HVAC permit exists but age unknown' };
  }

  return { score: 50, confidence: 'Low', reason: 'HVAC permit data unclear' };
}

/**
 * Field 62: Permit History - Other
 * Other permitted work (pool, electrical, etc.)
 */
export function normalizePermitHistoryOther(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 50, confidence: 'Low', reason: 'No other permit data' };
  }

  const permit = value.toLowerCase().trim();
  let score = 50;

  // Positive indicators
  if (permit.includes('pool') && permit.includes('permit')) score += 15;
  if (permit.includes('electrical') && permit.includes('permit')) score += 10;
  if (permit.includes('addition') && permit.includes('permit')) score += 15;
  if (permit.includes('remodel') && permit.includes('permit')) score += 10;

  // Negative indicators
  if (permit.includes('violation') || permit.includes('unpermitted')) {
    score -= 25;
  }

  if (permit.includes('open permit') || permit.includes('not closed')) {
    score -= 15;
  }

  const finalScore = Math.min(100, Math.max(20, score));
  return {
    score: finalScore,
    confidence: 'Medium',
    reason: `Other permit score: ${finalScore}`
  };
}

// =============================================================================
// SECTION K: DISTANCES & AMENITIES (Fields 83, 84, 85, 86, 87)
// Weight: 2% in industry standard
// =============================================================================

/**
 * Field 83: Distance to Grocery (miles)
 * Closer = better for daily convenience.
 */
export function normalizeDistanceGrocery(value: any): NormalizationResult {
  const distance = parseFloat(String(value).replace(/[^\d.]/g, ''));

  if (isNaN(distance) || distance < 0) {
    return { score: 50, confidence: 'Low', reason: 'Invalid grocery distance' };
  }

  // Under 1 mile = walkable, excellent
  if (distance <= 0.5) return { score: 100, confidence: 'High', reason: 'Grocery within 0.5 mi' };
  if (distance <= 1) return { score: 95, confidence: 'High', reason: 'Grocery within 1 mi' };
  if (distance <= 2) return { score: 85, confidence: 'High', reason: 'Grocery within 2 mi' };
  if (distance <= 3) return { score: 75, confidence: 'High', reason: 'Grocery within 3 mi' };
  if (distance <= 5) return { score: 60, confidence: 'Medium', reason: 'Grocery within 5 mi' };
  if (distance <= 10) return { score: 40, confidence: 'Medium', reason: 'Grocery within 10 mi' };

  return { score: 25, confidence: 'Medium', reason: 'Grocery over 10 mi - rural area' };
}

/**
 * Field 84: Distance to Hospital (miles)
 * Critical for families and retirees (FL market).
 */
export function normalizeDistanceHospital(value: any): NormalizationResult {
  const distance = parseFloat(String(value).replace(/[^\d.]/g, ''));

  if (isNaN(distance) || distance < 0) {
    return { score: 50, confidence: 'Low', reason: 'Invalid hospital distance' };
  }

  // Hospital access is critical in FL (large retiree population)
  if (distance <= 3) return { score: 100, confidence: 'High', reason: 'Hospital within 3 mi' };
  if (distance <= 5) return { score: 90, confidence: 'High', reason: 'Hospital within 5 mi' };
  if (distance <= 10) return { score: 75, confidence: 'High', reason: 'Hospital within 10 mi' };
  if (distance <= 15) return { score: 60, confidence: 'Medium', reason: 'Hospital within 15 mi' };
  if (distance <= 20) return { score: 45, confidence: 'Medium', reason: 'Hospital within 20 mi' };

  return { score: 25, confidence: 'Medium', reason: 'Hospital over 20 mi - concern for emergencies' };
}

/**
 * Field 85: Distance to Airport (miles)
 * Convenience for travelers, but noise concerns if too close.
 */
export function normalizeDistanceAirport(value: any): NormalizationResult {
  const distance = parseFloat(String(value).replace(/[^\d.]/g, ''));

  if (isNaN(distance) || distance < 0) {
    return { score: 50, confidence: 'Low', reason: 'Invalid airport distance' };
  }

  // Sweet spot: 10-25 miles (convenient but no flight path noise)
  if (distance < 3) return { score: 40, confidence: 'High', reason: 'Too close to airport - noise' };
  if (distance <= 5) return { score: 55, confidence: 'High', reason: 'Near airport - potential noise' };
  if (distance <= 10) return { score: 75, confidence: 'High', reason: 'Airport 5-10 mi - convenient' };
  if (distance <= 20) return { score: 90, confidence: 'High', reason: 'Airport 10-20 mi - ideal' };
  if (distance <= 30) return { score: 80, confidence: 'High', reason: 'Airport 20-30 mi - acceptable' };
  if (distance <= 45) return { score: 60, confidence: 'Medium', reason: 'Airport 30-45 mi' };

  return { score: 40, confidence: 'Medium', reason: 'Airport over 45 mi - inconvenient' };
}

/**
 * Field 86: Distance to Park (miles)
 * Recreation access adds livability.
 */
export function normalizeDistancePark(value: any): NormalizationResult {
  const distance = parseFloat(String(value).replace(/[^\d.]/g, ''));

  if (isNaN(distance) || distance < 0) {
    return { score: 50, confidence: 'Low', reason: 'Invalid park distance' };
  }

  if (distance <= 0.25) return { score: 100, confidence: 'High', reason: 'Park within 0.25 mi' };
  if (distance <= 0.5) return { score: 95, confidence: 'High', reason: 'Park within 0.5 mi' };
  if (distance <= 1) return { score: 85, confidence: 'High', reason: 'Park within 1 mi' };
  if (distance <= 2) return { score: 70, confidence: 'High', reason: 'Park within 2 mi' };
  if (distance <= 3) return { score: 55, confidence: 'Medium', reason: 'Park within 3 mi' };
  if (distance <= 5) return { score: 40, confidence: 'Medium', reason: 'Park within 5 mi' };

  return { score: 30, confidence: 'Medium', reason: 'No park nearby' };
}

/**
 * Field 87: Distance to Beach (miles)
 * CRITICAL for Florida coastal market. Closer = premium.
 */
export function normalizeDistanceBeach(value: any): NormalizationResult {
  const distance = parseFloat(String(value).replace(/[^\d.]/g, ''));

  if (isNaN(distance) || distance < 0) {
    return { score: 50, confidence: 'Low', reason: 'Invalid beach distance' };
  }

  // Beach proximity is a major FL value driver
  if (distance <= 0.5) return { score: 100, confidence: 'High', reason: 'Beachfront/within 0.5 mi' };
  if (distance <= 1) return { score: 95, confidence: 'High', reason: 'Beach within 1 mi' };
  if (distance <= 2) return { score: 85, confidence: 'High', reason: 'Beach within 2 mi' };
  if (distance <= 5) return { score: 75, confidence: 'High', reason: 'Beach within 5 mi' };
  if (distance <= 10) return { score: 60, confidence: 'High', reason: 'Beach within 10 mi' };
  if (distance <= 20) return { score: 45, confidence: 'Medium', reason: 'Beach within 20 mi' };
  if (distance <= 50) return { score: 30, confidence: 'Medium', reason: 'Beach within 50 mi' };

  return { score: 20, confidence: 'Medium', reason: 'Inland - no beach access' };
}

// =============================================================================
// SECTION L: SAFETY & CRIME (Fields 88, 89, 90)
// Weight: 4% in industry standard
// =============================================================================

/**
 * Field 88: Violent Crime Index
 * Lower crime = safer neighborhood = higher value.
 * Index is typically 0-100+ where 100 = national average.
 */
export function normalizeViolentCrimeIndex(value: any): NormalizationResult {
  if (!value) {
    return { score: 50, confidence: 'Low', reason: 'No crime data' };
  }

  // Handle string descriptions
  if (typeof value === 'string') {
    const strValue = value.toLowerCase().trim();

    if (strValue.includes('very low') || strValue.includes('minimal')) {
      return { score: 95, confidence: 'Medium', reason: 'Very low violent crime' };
    }
    if (strValue.includes('low') || strValue.includes('below average')) {
      return { score: 80, confidence: 'Medium', reason: 'Low violent crime' };
    }
    if (strValue.includes('average') || strValue.includes('moderate')) {
      return { score: 55, confidence: 'Medium', reason: 'Average violent crime' };
    }
    if (strValue.includes('above average') || strValue.includes('high')) {
      return { score: 30, confidence: 'Medium', reason: 'Above average violent crime' };
    }
    if (strValue.includes('very high') || strValue.includes('extreme')) {
      return { score: 10, confidence: 'Medium', reason: 'Very high violent crime' };
    }
  }

  // Handle numeric index (100 = national average)
  const index = parseFloat(String(value).replace(/[^\d.]/g, ''));
  if (isNaN(index)) {
    return { score: 50, confidence: 'Low', reason: 'Invalid crime index' };
  }

  // Score inversely: lower index = higher score
  if (index <= 20) return { score: 100, confidence: 'High', reason: 'Crime index very low' };
  if (index <= 40) return { score: 90, confidence: 'High', reason: 'Crime index low' };
  if (index <= 60) return { score: 75, confidence: 'High', reason: 'Crime index below average' };
  if (index <= 80) return { score: 60, confidence: 'High', reason: 'Crime index slightly below average' };
  if (index <= 100) return { score: 50, confidence: 'High', reason: 'Crime index at national average' };
  if (index <= 150) return { score: 35, confidence: 'High', reason: 'Crime index above average' };
  if (index <= 200) return { score: 20, confidence: 'High', reason: 'Crime index high' };

  return { score: 10, confidence: 'High', reason: 'Crime index very high' };
}

/**
 * Field 89: Property Crime Index
 * Similar to violent crime - lower = better.
 */
export function normalizePropertyCrimeIndex(value: any): NormalizationResult {
  if (!value) {
    return { score: 50, confidence: 'Low', reason: 'No property crime data' };
  }

  // Handle string descriptions
  if (typeof value === 'string') {
    const strValue = value.toLowerCase().trim();

    if (strValue.includes('very low') || strValue.includes('minimal')) {
      return { score: 95, confidence: 'Medium', reason: 'Very low property crime' };
    }
    if (strValue.includes('low') || strValue.includes('below average')) {
      return { score: 80, confidence: 'Medium', reason: 'Low property crime' };
    }
    if (strValue.includes('average') || strValue.includes('moderate')) {
      return { score: 55, confidence: 'Medium', reason: 'Average property crime' };
    }
    if (strValue.includes('above average') || strValue.includes('high')) {
      return { score: 30, confidence: 'Medium', reason: 'Above average property crime' };
    }
    if (strValue.includes('very high') || strValue.includes('extreme')) {
      return { score: 10, confidence: 'Medium', reason: 'Very high property crime' };
    }
  }

  const index = parseFloat(String(value).replace(/[^\d.]/g, ''));
  if (isNaN(index)) {
    return { score: 50, confidence: 'Low', reason: 'Invalid property crime index' };
  }

  if (index <= 20) return { score: 100, confidence: 'High', reason: 'Property crime very low' };
  if (index <= 40) return { score: 90, confidence: 'High', reason: 'Property crime low' };
  if (index <= 60) return { score: 75, confidence: 'High', reason: 'Property crime below average' };
  if (index <= 80) return { score: 60, confidence: 'High', reason: 'Property crime slightly below avg' };
  if (index <= 100) return { score: 50, confidence: 'High', reason: 'Property crime at average' };
  if (index <= 150) return { score: 35, confidence: 'High', reason: 'Property crime above average' };
  if (index <= 200) return { score: 20, confidence: 'High', reason: 'Property crime high' };

  return { score: 10, confidence: 'High', reason: 'Property crime very high' };
}

/**
 * Field 90: Neighborhood Safety Rating
 * Overall safety perception (typically 1-10 or A-F scale).
 */
export function normalizeNeighborhoodSafetyRating(value: any): NormalizationResult {
  if (!value) {
    return { score: 50, confidence: 'Low', reason: 'No safety rating' };
  }

  const strValue = String(value).toUpperCase().trim();

  // Handle letter grades
  if (strValue.length <= 2) {
    const gradeMap: Record<string, number> = {
      'A+': 100, 'A': 95, 'A-': 90,
      'B+': 85, 'B': 80, 'B-': 75,
      'C+': 65, 'C': 60, 'C-': 55,
      'D+': 45, 'D': 40, 'D-': 35,
      'F': 20
    };
    if (gradeMap[strValue]) {
      return { score: gradeMap[strValue], confidence: 'High', reason: `Safety grade: ${strValue}` };
    }
  }

  // Handle numeric ratings (1-10)
  const numValue = parseFloat(strValue);
  if (!isNaN(numValue)) {
    if (numValue <= 10) {
      const score = numValue * 10;
      return { score, confidence: 'High', reason: `Safety rating: ${numValue}/10` };
    }
    if (numValue <= 100) {
      return { score: numValue, confidence: 'High', reason: `Safety score: ${numValue}/100` };
    }
  }

  // Handle text descriptions
  const lowerValue = strValue.toLowerCase();
  if (lowerValue.includes('excellent') || lowerValue.includes('very safe')) {
    return { score: 95, confidence: 'Medium', reason: 'Excellent safety rating' };
  }
  if (lowerValue.includes('good') || lowerValue.includes('safe')) {
    return { score: 75, confidence: 'Medium', reason: 'Good safety rating' };
  }
  if (lowerValue.includes('fair') || lowerValue.includes('moderate')) {
    return { score: 55, confidence: 'Medium', reason: 'Fair safety rating' };
  }
  if (lowerValue.includes('poor') || lowerValue.includes('unsafe')) {
    return { score: 30, confidence: 'Medium', reason: 'Poor safety rating' };
  }

  return { score: 50, confidence: 'Low', reason: 'Safety rating format not recognized' };
}

// =============================================================================
// SECTION N: UTILITIES & CONNECTIVITY (Fields 105, 107, 109, 111, 112, 113, 115, 116)
// Weight: 0.5% in industry standard
// =============================================================================

/**
 * Field 105: Average Electric Bill
 * Lower bills = better efficiency or lower rates.
 */
export function normalizeAvgElectricBill(value: any): NormalizationResult {
  if (!value) {
    return { score: 50, confidence: 'Low', reason: 'No electric bill data' };
  }

  // Extract numeric value
  const billAmount = parseFloat(String(value).replace(/[$,]/g, ''));

  if (isNaN(billAmount)) {
    return { score: 50, confidence: 'Low', reason: 'Invalid electric bill format' };
  }

  // FL average is ~$130-150/month; lower is better
  if (billAmount <= 80) return { score: 100, confidence: 'High', reason: 'Very low electric bill' };
  if (billAmount <= 100) return { score: 90, confidence: 'High', reason: 'Low electric bill' };
  if (billAmount <= 130) return { score: 75, confidence: 'High', reason: 'Below average electric bill' };
  if (billAmount <= 160) return { score: 60, confidence: 'High', reason: 'Average electric bill' };
  if (billAmount <= 200) return { score: 45, confidence: 'High', reason: 'Above average electric bill' };
  if (billAmount <= 250) return { score: 30, confidence: 'High', reason: 'High electric bill' };

  return { score: 20, confidence: 'Medium', reason: 'Very high electric bill' };
}

/**
 * Field 107: Average Water Bill
 * Lower bills = better efficiency.
 */
export function normalizeAvgWaterBill(value: any): NormalizationResult {
  if (!value) {
    return { score: 50, confidence: 'Low', reason: 'No water bill data' };
  }

  const billAmount = parseFloat(String(value).replace(/[$,]/g, ''));

  if (isNaN(billAmount)) {
    return { score: 50, confidence: 'Low', reason: 'Invalid water bill format' };
  }

  // FL average is ~$40-60/month
  if (billAmount <= 30) return { score: 100, confidence: 'High', reason: 'Very low water bill' };
  if (billAmount <= 45) return { score: 85, confidence: 'High', reason: 'Low water bill' };
  if (billAmount <= 60) return { score: 70, confidence: 'High', reason: 'Average water bill' };
  if (billAmount <= 80) return { score: 55, confidence: 'High', reason: 'Above average water bill' };
  if (billAmount <= 100) return { score: 40, confidence: 'High', reason: 'High water bill' };

  return { score: 25, confidence: 'Medium', reason: 'Very high water bill' };
}

/**
 * Field 109: Natural Gas Available
 * Gas availability adds flexibility for cooking/heating.
 */
export function normalizeNaturalGas(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 50, confidence: 'Low', reason: 'No natural gas data' };
  }

  const gasValue = value.toLowerCase().trim();

  if (gasValue === 'yes' || gasValue === 'true' || gasValue === 'available' ||
      gasValue.includes('connected') || gasValue.includes('natural gas')) {
    return { score: 80, confidence: 'High', reason: 'Natural gas available' };
  }

  if (gasValue === 'no' || gasValue === 'false' || gasValue.includes('not available') ||
      gasValue.includes('all electric')) {
    // In FL, all-electric is common and not a significant disadvantage
    return { score: 55, confidence: 'High', reason: 'No natural gas - all electric' };
  }

  if (gasValue.includes('propane') || gasValue.includes('tank')) {
    return { score: 60, confidence: 'Medium', reason: 'Propane available' };
  }

  return { score: 50, confidence: 'Low', reason: 'Natural gas status unclear' };
}

/**
 * Field 111: Internet Providers Top 3
 * More providers = more competition = better service/prices.
 */
export function normalizeInternetProviders(value: any): NormalizationResult {
  if (!value) {
    return { score: 40, confidence: 'Low', reason: 'No internet provider data' };
  }

  let providers: string[] = [];

  if (Array.isArray(value)) {
    providers = value.filter(Boolean).map(String);
  } else if (typeof value === 'string') {
    providers = value.split(',').map(s => s.trim()).filter(Boolean);
  }

  const count = providers.length;

  if (count >= 4) return { score: 100, confidence: 'High', reason: '4+ internet providers' };
  if (count === 3) return { score: 85, confidence: 'High', reason: '3 internet providers' };
  if (count === 2) return { score: 70, confidence: 'High', reason: '2 internet providers' };
  if (count === 1) return { score: 50, confidence: 'Medium', reason: '1 internet provider (monopoly)' };

  return { score: 30, confidence: 'Low', reason: 'No internet providers listed' };
}

/**
 * Field 112: Max Internet Speed
 * Higher speed = better for remote work (critical post-COVID).
 */
export function normalizeMaxInternetSpeed(value: any): NormalizationResult {
  if (!value) {
    return { score: 50, confidence: 'Low', reason: 'No internet speed data' };
  }

  const speedStr = String(value).toLowerCase();

  // Extract numeric Mbps value
  const mbpsMatch = speedStr.match(/(\d+)\s*(mbps|mb)/);
  const gbpsMatch = speedStr.match(/(\d+)\s*(gbps|gb)/);

  let speedMbps = 0;

  if (gbpsMatch) {
    speedMbps = parseInt(gbpsMatch[1], 10) * 1000;
  } else if (mbpsMatch) {
    speedMbps = parseInt(mbpsMatch[1], 10);
  } else {
    // Try to parse just a number
    const numMatch = speedStr.match(/\d+/);
    if (numMatch) speedMbps = parseInt(numMatch[0], 10);
  }

  if (speedMbps <= 0) {
    return { score: 50, confidence: 'Low', reason: 'Could not parse internet speed' };
  }

  // Speed tiers
  if (speedMbps >= 1000) return { score: 100, confidence: 'High', reason: 'Gigabit+ internet' };
  if (speedMbps >= 500) return { score: 90, confidence: 'High', reason: '500+ Mbps internet' };
  if (speedMbps >= 300) return { score: 80, confidence: 'High', reason: '300+ Mbps internet' };
  if (speedMbps >= 100) return { score: 65, confidence: 'High', reason: '100+ Mbps internet' };
  if (speedMbps >= 50) return { score: 50, confidence: 'Medium', reason: '50-100 Mbps internet' };
  if (speedMbps >= 25) return { score: 35, confidence: 'Medium', reason: '25-50 Mbps internet' };

  return { score: 20, confidence: 'Medium', reason: 'Slow internet (<25 Mbps)' };
}

/**
 * Field 113: Fiber Available
 * Fiber = future-proof connectivity.
 */
export function normalizeFiberAvailable(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 50, confidence: 'Low', reason: 'No fiber data' };
  }

  // Handle boolean
  if (value === true || value === 'true' || value === 'yes' ||
      value === 'Yes' || value === 1 || value === '1') {
    return { score: 100, confidence: 'High', reason: 'Fiber internet available' };
  }

  // Handle string descriptions
  if (typeof value === 'string') {
    const fiberStr = value.toLowerCase();
    if (fiberStr.includes('available') || fiberStr.includes('yes') ||
        fiberStr.includes('fiber to home') || fiberStr.includes('ftth')) {
      return { score: 100, confidence: 'High', reason: 'Fiber available' };
    }
    if (fiberStr.includes('coming soon') || fiberStr.includes('planned')) {
      return { score: 70, confidence: 'Medium', reason: 'Fiber coming soon' };
    }
    if (fiberStr.includes('not available') || fiberStr.includes('no')) {
      return { score: 35, confidence: 'High', reason: 'No fiber available' };
    }
  }

  return { score: 35, confidence: 'High', reason: 'Fiber not available' };
}

/**
 * Field 115: Cell Coverage Quality
 * Good cell coverage essential for modern life.
 */
export function normalizeCellCoverageQuality(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 50, confidence: 'Low', reason: 'No cell coverage data' };
  }

  const coverage = value.toLowerCase().trim();

  if (coverage.includes('excellent') || coverage.includes('5 bars') ||
      coverage.includes('strong') || coverage === '5') {
    return { score: 100, confidence: 'High', reason: 'Excellent cell coverage' };
  }

  if (coverage.includes('good') || coverage.includes('4 bars') ||
      coverage === '4') {
    return { score: 85, confidence: 'High', reason: 'Good cell coverage' };
  }

  if (coverage.includes('average') || coverage.includes('fair') ||
      coverage.includes('3 bars') || coverage === '3') {
    return { score: 65, confidence: 'Medium', reason: 'Average cell coverage' };
  }

  if (coverage.includes('weak') || coverage.includes('poor') ||
      coverage.includes('2 bars') || coverage === '2') {
    return { score: 40, confidence: 'Medium', reason: 'Weak cell coverage' };
  }

  if (coverage.includes('no signal') || coverage.includes('none') ||
      coverage.includes('1 bar') || coverage === '1') {
    return { score: 15, confidence: 'High', reason: 'Poor/no cell coverage' };
  }

  return { score: 50, confidence: 'Low', reason: 'Cell coverage not recognized' };
}

/**
 * Field 116: Emergency Services Distance
 * Closer = better for safety and insurance rates.
 */
export function normalizeEmergencyServicesDistance(value: any): NormalizationResult {
  if (!value) {
    return { score: 50, confidence: 'Low', reason: 'No emergency services data' };
  }

  // Try to extract numeric distance
  const distanceMatch = String(value).match(/(\d+\.?\d*)\s*(mi|mile|min|minute)?/i);

  if (!distanceMatch) {
    // Handle text descriptions
    const strValue = String(value).toLowerCase();
    if (strValue.includes('very close') || strValue.includes('nearby')) {
      return { score: 90, confidence: 'Medium', reason: 'Emergency services nearby' };
    }
    if (strValue.includes('close') || strValue.includes('reasonable')) {
      return { score: 70, confidence: 'Medium', reason: 'Emergency services reasonably close' };
    }
    if (strValue.includes('far') || strValue.includes('remote')) {
      return { score: 40, confidence: 'Medium', reason: 'Emergency services far' };
    }
    return { score: 50, confidence: 'Low', reason: 'Emergency services distance unclear' };
  }

  const distance = parseFloat(distanceMatch[1]);
  const unit = (distanceMatch[2] || 'mi').toLowerCase();

  // Handle minutes (response time) vs miles
  if (unit.includes('min')) {
    if (distance <= 5) return { score: 100, confidence: 'High', reason: '5 min or less response' };
    if (distance <= 8) return { score: 85, confidence: 'High', reason: '5-8 min response' };
    if (distance <= 12) return { score: 70, confidence: 'High', reason: '8-12 min response' };
    if (distance <= 15) return { score: 55, confidence: 'Medium', reason: '12-15 min response' };
    return { score: 35, confidence: 'Medium', reason: '15+ min response time' };
  }

  // Miles
  if (distance <= 2) return { score: 100, confidence: 'High', reason: 'Emergency services within 2 mi' };
  if (distance <= 5) return { score: 85, confidence: 'High', reason: 'Emergency services within 5 mi' };
  if (distance <= 10) return { score: 65, confidence: 'High', reason: 'Emergency services within 10 mi' };
  if (distance <= 15) return { score: 45, confidence: 'Medium', reason: 'Emergency services 10-15 mi' };

  return { score: 30, confidence: 'Medium', reason: 'Emergency services 15+ mi' };
}

// =============================================================================
// SECTION P: ADDITIONAL FEATURES (Fields 131, 132, 133, 134, 135, 136, 137, 138)
// Weight: 0% in industry standard (nice-to-have)
// =============================================================================

/**
 * Field 131: View Type
 * Water/Golf views command significant premiums in FL.
 */
export function normalizeViewType(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 40, confidence: 'Low', reason: 'No view data' };
  }

  const view = value.toLowerCase().trim();

  // Premium FL views
  if (view.includes('ocean') || view.includes('gulf') || view.includes('beachfront')) {
    return { score: 100, confidence: 'High', reason: 'Ocean/Gulf view - premium FL asset' };
  }

  if (view.includes('bay') || view.includes('harbor') || view.includes('marina')) {
    return { score: 95, confidence: 'High', reason: 'Bay/Harbor view' };
  }

  if (view.includes('water') || view.includes('lake') || view.includes('river') ||
      view.includes('canal') || view.includes('intercoastal')) {
    return { score: 85, confidence: 'High', reason: 'Water view' };
  }

  if (view.includes('golf') || view.includes('fairway')) {
    return { score: 80, confidence: 'High', reason: 'Golf course view' };
  }

  if (view.includes('sunset') || view.includes('sunrise')) {
    return { score: 75, confidence: 'Medium', reason: 'Sunset/Sunrise exposure view' };
  }

  if (view.includes('pool') || view.includes('garden') || view.includes('preserve') ||
      view.includes('conservation') || view.includes('nature')) {
    return { score: 70, confidence: 'High', reason: 'Nature/Preserve view' };
  }

  if (view.includes('city') || view.includes('skyline')) {
    return { score: 65, confidence: 'Medium', reason: 'City/Skyline view' };
  }

  if (view.includes('courtyard') || view.includes('landscape')) {
    return { score: 55, confidence: 'Medium', reason: 'Courtyard/Landscape view' };
  }

  if (view.includes('parking') || view.includes('street') || view.includes('none')) {
    return { score: 30, confidence: 'Medium', reason: 'Parking/Street view' };
  }

  return { score: 50, confidence: 'Low', reason: 'View type not recognized' };
}

/**
 * Field 132: Lot Features
 * Premium lot features add value.
 */
export function normalizeLotFeatures(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 40, confidence: 'Low', reason: 'No lot features data' };
  }

  const lot = value.toLowerCase().trim();
  let score = 40;

  // Premium lot features
  if (lot.includes('corner')) score += 20;
  if (lot.includes('cul-de-sac') || lot.includes('cul de sac')) score += 15;
  if (lot.includes('oversized') || lot.includes('large')) score += 15;
  if (lot.includes('private') || lot.includes('secluded')) score += 12;
  if (lot.includes('wooded') || lot.includes('mature trees')) score += 10;
  if (lot.includes('waterfront') || lot.includes('water view')) score += 25;
  if (lot.includes('golf') || lot.includes('preserve')) score += 15;
  if (lot.includes('fenced')) score += 8;
  if (lot.includes('level') || lot.includes('flat')) score += 5;

  // Negative features
  if (lot.includes('flood zone') || lot.includes('wetland')) score -= 15;
  if (lot.includes('easement')) score -= 10;
  if (lot.includes('power lines') || lot.includes('utility')) score -= 10;

  const finalScore = Math.min(100, Math.max(20, score));
  return {
    score: finalScore,
    confidence: 'Medium',
    reason: `Lot features score: ${finalScore}`
  };
}

/**
 * Field 133: EV Charging
 * Growing importance for future-proofing.
 */
export function normalizeEvCharging(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 50, confidence: 'Low', reason: 'No EV charging data' };
  }

  const ev = value.toLowerCase().trim();

  if (ev === 'yes' || ev === 'true' || ev.includes('installed') ||
      ev.includes('level 2') || ev.includes('240v')) {
    return { score: 90, confidence: 'High', reason: 'EV charging installed' };
  }

  if (ev.includes('pre-wired') || ev.includes('ready') || ev.includes('capable')) {
    return { score: 75, confidence: 'Medium', reason: 'EV charging ready' };
  }

  if (ev.includes('outlet') || ev.includes('120v')) {
    return { score: 60, confidence: 'Medium', reason: 'Basic outlet for EV' };
  }

  if (ev === 'no' || ev === 'false' || ev.includes('not available')) {
    return { score: 40, confidence: 'High', reason: 'No EV charging' };
  }

  return { score: 50, confidence: 'Low', reason: 'EV charging status unclear' };
}

/**
 * Field 134: Smart Home Features
 * Modern amenity for tech-savvy buyers.
 */
export function normalizeSmartHomeFeatures(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 40, confidence: 'Low', reason: 'No smart home data' };
  }

  const smart = value.toLowerCase().trim();
  let score = 40;

  // Smart home features
  if (smart.includes('thermostat') || smart.includes('nest') || smart.includes('ecobee')) {
    score += 15;
  }
  if (smart.includes('security') || smart.includes('camera') || smart.includes('alarm')) {
    score += 15;
  }
  if (smart.includes('lighting') || smart.includes('smart light')) {
    score += 10;
  }
  if (smart.includes('lock') || smart.includes('keyless')) {
    score += 10;
  }
  if (smart.includes('garage') || smart.includes('opener')) {
    score += 5;
  }
  if (smart.includes('speaker') || smart.includes('alexa') ||
      smart.includes('google home') || smart.includes('hub')) {
    score += 10;
  }
  if (smart.includes('doorbell') || smart.includes('ring')) {
    score += 8;
  }
  if (smart.includes('automation') || smart.includes('whole home')) {
    score += 15;
  }

  const finalScore = Math.min(100, score);
  return {
    score: finalScore,
    confidence: finalScore >= 60 ? 'Medium' : 'Low',
    reason: `Smart home score: ${finalScore}`
  };
}

/**
 * Field 135: Accessibility Modifications
 * Important for aging-in-place buyers (large FL market).
 */
export function normalizeAccessibilityModifications(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 50, confidence: 'Low', reason: 'No accessibility data' };
  }

  const access = value.toLowerCase().trim();

  if (access === 'none' || access === 'no' || access === 'n/a') {
    // Neutral - not a penalty unless specifically needed
    return { score: 50, confidence: 'High', reason: 'No accessibility modifications' };
  }

  let score = 50;

  // Accessibility features
  if (access.includes('wheelchair') || access.includes('ada')) score += 25;
  if (access.includes('grab bar') || access.includes('handrail')) score += 10;
  if (access.includes('step-in shower') || access.includes('walk-in shower')) score += 15;
  if (access.includes('ramp')) score += 15;
  if (access.includes('wide door') || access.includes('wide hall')) score += 10;
  if (access.includes('elevator') || access.includes('lift')) score += 20;
  if (access.includes('first floor master') || access.includes('main floor master')) score += 15;
  if (access.includes('single story') || access.includes('one story')) score += 10;

  const finalScore = Math.min(100, score);
  return {
    score: finalScore,
    confidence: 'Medium',
    reason: `Accessibility score: ${finalScore}`
  };
}

/**
 * Field 136: Pet Policy
 * Restrictions can limit buyer pool.
 */
export function normalizePetPolicy(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 60, confidence: 'Low', reason: 'No pet policy data' };
  }

  const pet = value.toLowerCase().trim();

  if (pet.includes('no restrictions') || pet.includes('no limit') ||
      pet.includes('all pets') || pet.includes('pets allowed')) {
    return { score: 100, confidence: 'High', reason: 'No pet restrictions' };
  }

  if (pet.includes('dogs') && pet.includes('cats')) {
    return { score: 85, confidence: 'High', reason: 'Dogs and cats allowed' };
  }

  if (pet.includes('2 pets') || pet.includes('two pets')) {
    return { score: 75, confidence: 'Medium', reason: '2 pets allowed' };
  }

  if (pet.includes('1 pet') || pet.includes('one pet') || pet.includes('small')) {
    return { score: 60, confidence: 'Medium', reason: 'Limited to 1 pet or small pets' };
  }

  if (pet.includes('weight limit') || pet.includes('size limit')) {
    return { score: 55, confidence: 'Medium', reason: 'Pet size/weight restrictions' };
  }

  if (pet.includes('no pets') || pet.includes('pets not allowed') ||
      pet.includes('prohibited')) {
    return { score: 25, confidence: 'High', reason: 'No pets allowed - limits buyer pool' };
  }

  return { score: 60, confidence: 'Low', reason: 'Pet policy unclear' };
}

/**
 * Field 137: Age Restrictions
 * 55+ communities limit buyer pool but appeal to retirees.
 */
export function normalizeAgeRestrictions(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 70, confidence: 'Low', reason: 'No age restriction data' };
  }

  const age = value.toLowerCase().trim();

  if (age === 'none' || age === 'no' || age.includes('no restriction') ||
      age.includes('all ages')) {
    return { score: 80, confidence: 'High', reason: 'No age restrictions - broader market' };
  }

  if (age.includes('55+') || age.includes('55 and over') || age.includes('senior')) {
    // In FL, 55+ communities are common and have strong demand
    return { score: 65, confidence: 'High', reason: '55+ community - limited but strong FL market' };
  }

  if (age.includes('62+') || age.includes('65+')) {
    return { score: 55, confidence: 'High', reason: '62+/65+ community - more restricted' };
  }

  return { score: 70, confidence: 'Low', reason: 'Age restrictions unclear' };
}

/**
 * Field 138: Special Assessments
 * Upcoming costs reduce property value.
 */
export function normalizeSpecialAssessments(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 70, confidence: 'Low', reason: 'No special assessment data' };
  }

  const assess = value.toLowerCase().trim();

  if (assess === 'none' || assess === 'no' || assess === 'n/a' ||
      assess.includes('no special') || assess === '0' || assess === '$0') {
    return { score: 100, confidence: 'High', reason: 'No special assessments' };
  }

  // Try to extract amount
  const amountMatch = assess.match(/\$?([\d,]+)/);
  if (amountMatch) {
    const amount = parseInt(amountMatch[1].replace(/,/g, ''), 10);

    if (amount <= 1000) return { score: 85, confidence: 'High', reason: 'Minor special assessment <$1k' };
    if (amount <= 5000) return { score: 65, confidence: 'High', reason: 'Moderate assessment $1k-$5k' };
    if (amount <= 15000) return { score: 45, confidence: 'High', reason: 'Significant assessment $5k-$15k' };
    if (amount <= 30000) return { score: 30, confidence: 'High', reason: 'Major assessment $15k-$30k' };

    return { score: 15, confidence: 'High', reason: 'Very high special assessment >$30k' };
  }

  if (assess.includes('pending') || assess.includes('possible') || assess.includes('planned')) {
    return { score: 50, confidence: 'Medium', reason: 'Pending/possible special assessment' };
  }

  if (assess.includes('paid') || assess.includes('complete')) {
    return { score: 90, confidence: 'Medium', reason: 'Assessment already paid' };
  }

  return { score: 60, confidence: 'Low', reason: 'Special assessment status unclear' };
}

// =============================================================================
// SECTION Q: PARKING (Fields 139, 140, 141, 142, 143)
// Weight: 0% in industry standard (captured elsewhere)
// =============================================================================

/**
 * Field 139: Carport Y/N
 * Vehicle protection adds value.
 */
export function normalizeCarportYn(value: any): NormalizationResult {
  if (value === null || value === undefined) {
    return { score: 50, confidence: 'Low', reason: 'No carport data' };
  }

  const hasCarport = value === true || value === 'true' ||
                     value === 'yes' || value === 'Yes' ||
                     value === 1 || value === '1';

  if (hasCarport) {
    return { score: 70, confidence: 'High', reason: 'Has carport - vehicle protection' };
  }

  return { score: 50, confidence: 'High', reason: 'No carport' };
}

/**
 * Field 140: Carport Spaces
 * More spaces = better for multi-car households.
 */
export function normalizeCarportSpaces(value: any): NormalizationResult {
  const spaces = parseInt(String(value), 10);

  if (isNaN(spaces) || spaces < 0) {
    return { score: 50, confidence: 'Low', reason: 'Invalid carport spaces' };
  }

  if (spaces === 0) return { score: 45, confidence: 'High', reason: 'No carport spaces' };
  if (spaces === 1) return { score: 65, confidence: 'High', reason: '1 carport space' };
  if (spaces === 2) return { score: 80, confidence: 'High', reason: '2 carport spaces' };
  if (spaces >= 3) return { score: 90, confidence: 'High', reason: '3+ carport spaces' };

  return { score: 50, confidence: 'Low', reason: 'Carport spaces unclear' };
}

/**
 * Field 141: Garage Attached Y/N
 * Attached garage is more convenient than detached.
 */
export function normalizeGarageAttachedYn(value: any): NormalizationResult {
  if (value === null || value === undefined) {
    return { score: 50, confidence: 'Low', reason: 'No garage attachment data' };
  }

  const isAttached = value === true || value === 'true' ||
                     value === 'yes' || value === 'Yes' ||
                     value === 1 || value === '1';

  if (isAttached) {
    return { score: 90, confidence: 'High', reason: 'Attached garage - convenient access' };
  }

  return { score: 60, confidence: 'High', reason: 'Detached garage or no garage' };
}

/**
 * Field 142: Parking Features
 * Premium parking features add value.
 */
export function normalizeParkingFeatures(value: any): NormalizationResult {
  if (!value) {
    return { score: 40, confidence: 'Low', reason: 'No parking features data' };
  }

  let features: string[] = [];
  if (Array.isArray(value)) {
    features = value.map(f => String(f).toLowerCase());
  } else if (typeof value === 'string') {
    features = value.toLowerCase().split(',').map(f => f.trim());
  }

  if (features.length === 0) {
    return { score: 40, confidence: 'Low', reason: 'No parking features' };
  }

  let score = 40;

  // Premium features
  if (features.some(f => f.includes('covered'))) score += 15;
  if (features.some(f => f.includes('garage door opener'))) score += 10;
  if (features.some(f => f.includes('circular'))) score += 10;
  if (features.some(f => f.includes('rv') || f.includes('boat'))) score += 15;
  if (features.some(f => f.includes('guest'))) score += 10;
  if (features.some(f => f.includes('assigned'))) score += 5;
  if (features.some(f => f.includes('paved'))) score += 5;
  if (features.some(f => f.includes('lighted'))) score += 5;

  const finalScore = Math.min(100, score);
  return {
    score: finalScore,
    confidence: 'Medium',
    reason: `Parking features score: ${finalScore}`
  };
}

/**
 * Field 143: Assigned Parking Spaces
 * Important for condos/HOA communities.
 */
export function normalizeAssignedParkingSpaces(value: any): NormalizationResult {
  const spaces = parseInt(String(value), 10);

  if (isNaN(spaces) || spaces < 0) {
    return { score: 50, confidence: 'Low', reason: 'Invalid assigned spaces' };
  }

  if (spaces === 0) return { score: 35, confidence: 'High', reason: 'No assigned parking' };
  if (spaces === 1) return { score: 60, confidence: 'High', reason: '1 assigned space' };
  if (spaces === 2) return { score: 85, confidence: 'High', reason: '2 assigned spaces' };
  if (spaces >= 3) return { score: 100, confidence: 'High', reason: '3+ assigned spaces' };

  return { score: 50, confidence: 'Low', reason: 'Assigned spaces unclear' };
}

// =============================================================================
// SECTION R: BUILDING (Fields 144, 147, 148)
// Weight: 0% in industry standard (condo-specific)
// =============================================================================

/**
 * Field 144: Floor Number
 * Higher floors = better views (for condos).
 */
export function normalizeFloorNumber(value: any): NormalizationResult {
  const floor = parseInt(String(value), 10);

  if (isNaN(floor) || floor < 0) {
    return { score: 50, confidence: 'Low', reason: 'Invalid floor number' };
  }

  // For condos, higher floors generally command premiums
  if (floor === 0 || floor === 1) return { score: 60, confidence: 'High', reason: 'Ground floor' };
  if (floor <= 3) return { score: 70, confidence: 'High', reason: 'Lower floors (2-3)' };
  if (floor <= 5) return { score: 80, confidence: 'High', reason: 'Mid floors (4-5)' };
  if (floor <= 10) return { score: 88, confidence: 'High', reason: 'Upper floors (6-10)' };
  if (floor <= 20) return { score: 95, confidence: 'High', reason: 'High floors (11-20)' };
  if (floor > 20) return { score: 100, confidence: 'High', reason: 'Penthouse level (20+)' };

  return { score: 70, confidence: 'Low', reason: 'Floor number unclear' };
}

/**
 * Field 147: Building Elevator Y/N
 * Essential for upper floors.
 */
export function normalizeBuildingElevatorYn(value: any): NormalizationResult {
  if (value === null || value === undefined) {
    return { score: 60, confidence: 'Low', reason: 'No elevator data' };
  }

  const hasElevator = value === true || value === 'true' ||
                      value === 'yes' || value === 'Yes' ||
                      value === 1 || value === '1';

  if (hasElevator) {
    return { score: 90, confidence: 'High', reason: 'Building has elevator' };
  }

  return { score: 45, confidence: 'High', reason: 'No elevator - walk-up only' };
}

/**
 * Field 148: Floors in Unit
 * Multi-level units offer more space and separation.
 */
export function normalizeFloorsInUnit(value: any): NormalizationResult {
  const floors = parseInt(String(value), 10);

  if (isNaN(floors) || floors < 1) {
    return { score: 60, confidence: 'Low', reason: 'Invalid floors in unit' };
  }

  if (floors === 1) return { score: 60, confidence: 'High', reason: 'Single-level unit' };
  if (floors === 2) return { score: 85, confidence: 'High', reason: '2-story townhome/unit' };
  if (floors === 3) return { score: 90, confidence: 'High', reason: '3-story townhome/unit' };
  if (floors >= 4) return { score: 95, confidence: 'High', reason: '4+ story multi-level unit' };

  return { score: 60, confidence: 'Low', reason: 'Floors in unit unclear' };
}

// =============================================================================
// SECTION S: LEGAL (Fields 151, 152, 153, 154)
// Weight: 0% in industry standard (captured in taxes)
// =============================================================================

/**
 * Field 151: Homestead Y/N
 * Homestead exemption saves on taxes in FL.
 */
export function normalizeHomesteadYn(value: any): NormalizationResult {
  if (value === null || value === undefined) {
    return { score: 50, confidence: 'Low', reason: 'No homestead data' };
  }

  const hasHomestead = value === true || value === 'true' ||
                       value === 'yes' || value === 'Yes' ||
                       value === 1 || value === '1';

  if (hasHomestead) {
    // Homestead exemption in FL saves ~$500-1000+ annually
    return { score: 85, confidence: 'High', reason: 'Homestead exemption - tax savings' };
  }

  return { score: 50, confidence: 'High', reason: 'No homestead exemption' };
}

/**
 * Field 152: CDD Y/N
 * Community Development District = additional annual fees.
 */
export function normalizeCddYn(value: any): NormalizationResult {
  if (value === null || value === undefined) {
    return { score: 70, confidence: 'Low', reason: 'No CDD data' };
  }

  const hasCdd = value === true || value === 'true' ||
                 value === 'yes' || value === 'Yes' ||
                 value === 1 || value === '1';

  if (hasCdd) {
    // CDD is an additional annual cost (typically $1000-3000+)
    return { score: 40, confidence: 'High', reason: 'Has CDD - additional annual fees' };
  }

  return { score: 90, confidence: 'High', reason: 'No CDD fees' };
}

/**
 * Field 153: Annual CDD Fee
 * Lower is better.
 */
export function normalizeAnnualCddFee(value: any): NormalizationResult {
  if (!value || value === 0 || value === '$0' || value === 'None') {
    return { score: 100, confidence: 'High', reason: 'No CDD fee' };
  }

  const fee = parseFloat(String(value).replace(/[$,]/g, ''));

  if (isNaN(fee) || fee < 0) {
    return { score: 60, confidence: 'Low', reason: 'Invalid CDD fee format' };
  }

  // Score inversely - lower fees are better
  if (fee <= 500) return { score: 90, confidence: 'High', reason: 'Low CDD fee (<$500/yr)' };
  if (fee <= 1000) return { score: 75, confidence: 'High', reason: 'Moderate CDD fee ($500-$1k/yr)' };
  if (fee <= 2000) return { score: 55, confidence: 'High', reason: 'Average CDD fee ($1k-$2k/yr)' };
  if (fee <= 3000) return { score: 40, confidence: 'High', reason: 'High CDD fee ($2k-$3k/yr)' };
  if (fee <= 5000) return { score: 25, confidence: 'High', reason: 'Very high CDD fee ($3k-$5k/yr)' };

  return { score: 15, confidence: 'High', reason: 'Extreme CDD fee (>$5k/yr)' };
}

/**
 * Field 154: Front Exposure
 * Affects temperature and energy costs in FL.
 */
export function normalizeFrontExposure(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 50, confidence: 'Low', reason: 'No front exposure data' };
  }

  const exposure = value.toLowerCase().trim();

  // In FL, north-facing is coolest (best for energy)
  if (exposure.includes('north')) {
    return { score: 90, confidence: 'High', reason: 'North facing - coolest in FL' };
  }

  if (exposure.includes('east')) {
    return { score: 80, confidence: 'High', reason: 'East facing - morning sun' };
  }

  if (exposure.includes('south')) {
    return { score: 60, confidence: 'High', reason: 'South facing - more sun exposure' };
  }

  if (exposure.includes('west')) {
    return { score: 50, confidence: 'High', reason: 'West facing - hot afternoon sun in FL' };
  }

  // Combinations
  if (exposure.includes('northeast')) {
    return { score: 85, confidence: 'High', reason: 'Northeast facing - good for FL' };
  }
  if (exposure.includes('northwest')) {
    return { score: 75, confidence: 'High', reason: 'Northwest facing' };
  }
  if (exposure.includes('southeast')) {
    return { score: 65, confidence: 'High', reason: 'Southeast facing' };
  }
  if (exposure.includes('southwest')) {
    return { score: 45, confidence: 'High', reason: 'Southwest facing - hot in FL' };
  }

  return { score: 50, confidence: 'Low', reason: 'Front exposure not recognized' };
}

// =============================================================================
// SECTION T: WATERFRONT (Fields 155, 156, 157, 158, 159)
// Weight: 6% in industry standard (major FL premium)
// =============================================================================

/**
 * Field 155: Water Frontage Y/N
 * Waterfront property commands massive premium in FL.
 */
export function normalizeWaterFrontageYn(value: any): NormalizationResult {
  if (value === null || value === undefined) {
    return { score: 40, confidence: 'Low', reason: 'No waterfront data' };
  }

  const hasWaterfront = value === true || value === 'true' ||
                        value === 'yes' || value === 'Yes' ||
                        value === 1 || value === '1';

  if (hasWaterfront) {
    return { score: 100, confidence: 'High', reason: 'Waterfront - premium FL property' };
  }

  return { score: 30, confidence: 'High', reason: 'Not waterfront' };
}

/**
 * Field 156: Waterfront Feet
 * More waterfront = more value.
 */
export function normalizeWaterfrontFeet(value: any): NormalizationResult {
  const feet = parseFloat(String(value).replace(/[^\d.]/g, ''));

  if (isNaN(feet) || feet < 0) {
    return { score: 30, confidence: 'Low', reason: 'No waterfront feet or invalid' };
  }

  if (feet === 0) return { score: 30, confidence: 'High', reason: 'No waterfront' };
  if (feet <= 50) return { score: 70, confidence: 'High', reason: 'Limited waterfront (<50 ft)' };
  if (feet <= 100) return { score: 85, confidence: 'High', reason: 'Moderate waterfront (50-100 ft)' };
  if (feet <= 200) return { score: 95, confidence: 'High', reason: 'Good waterfront (100-200 ft)' };
  if (feet > 200) return { score: 100, confidence: 'High', reason: 'Extensive waterfront (200+ ft)' };

  return { score: 50, confidence: 'Low', reason: 'Waterfront feet unclear' };
}

/**
 * Field 157: Water Access Y/N
 * Boat access to open water is highly valued.
 */
export function normalizeWaterAccessYn(value: any): NormalizationResult {
  if (value === null || value === undefined) {
    return { score: 50, confidence: 'Low', reason: 'No water access data' };
  }

  const hasAccess = value === true || value === 'true' ||
                    value === 'yes' || value === 'Yes' ||
                    value === 1 || value === '1';

  if (hasAccess) {
    return { score: 95, confidence: 'High', reason: 'Water access - boat to open water' };
  }

  return { score: 40, confidence: 'High', reason: 'No water access' };
}

/**
 * Field 158: Water View Y/N
 * Water view adds value even without frontage.
 */
export function normalizeWaterViewYn(value: any): NormalizationResult {
  if (value === null || value === undefined) {
    return { score: 45, confidence: 'Low', reason: 'No water view data' };
  }

  const hasView = value === true || value === 'true' ||
                  value === 'yes' || value === 'Yes' ||
                  value === 1 || value === '1';

  if (hasView) {
    return { score: 85, confidence: 'High', reason: 'Water view property' };
  }

  return { score: 35, confidence: 'High', reason: 'No water view' };
}

/**
 * Field 159: Water Body Name
 * Type of water affects value (Gulf > Bay > Canal > Pond).
 */
export function normalizeWaterBodyName(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 40, confidence: 'Low', reason: 'No water body data' };
  }

  const water = value.toLowerCase().trim();

  // Premium water bodies
  if (water.includes('gulf') || water.includes('ocean') || water.includes('atlantic')) {
    return { score: 100, confidence: 'High', reason: 'Gulf/Ocean frontage - maximum premium' };
  }

  if (water.includes('bay') || water.includes('tampa bay') || water.includes('biscayne')) {
    return { score: 95, confidence: 'High', reason: 'Bay frontage - high premium' };
  }

  if (water.includes('intercoastal') || water.includes('intracoastal') ||
      water.includes('icw')) {
    return { score: 90, confidence: 'High', reason: 'Intracoastal - great access' };
  }

  if (water.includes('river') || water.includes('inlet')) {
    return { score: 80, confidence: 'High', reason: 'River/Inlet frontage' };
  }

  if (water.includes('lake')) {
    return { score: 75, confidence: 'High', reason: 'Lakefront property' };
  }

  if (water.includes('canal')) {
    return { score: 70, confidence: 'High', reason: 'Canal frontage' };
  }

  if (water.includes('pond') || water.includes('lagoon')) {
    return { score: 55, confidence: 'Medium', reason: 'Pond/Lagoon view' };
  }

  if (water.includes('preserve') || water.includes('wetland')) {
    return { score: 50, confidence: 'Medium', reason: 'Preserve/Wetland view' };
  }

  return { score: 60, confidence: 'Low', reason: 'Water body type not recognized' };
}

// =============================================================================
// SECTION U: LEASING (Fields 160, 161, 162, 165)
// Weight: 0% in industry standard (investor niche)
// =============================================================================

/**
 * Field 160: Can Be Leased Y/N
 * Leasing flexibility important for investors.
 */
export function normalizeCanBeLeasedYn(value: any): NormalizationResult {
  if (value === null || value === undefined) {
    return { score: 60, confidence: 'Low', reason: 'No leasing data' };
  }

  const canLease = value === true || value === 'true' ||
                   value === 'yes' || value === 'Yes' ||
                   value === 1 || value === '1';

  if (canLease) {
    return { score: 90, confidence: 'High', reason: 'Leasing allowed - investment flexibility' };
  }

  return { score: 40, confidence: 'High', reason: 'Leasing not allowed' };
}

/**
 * Field 161: Minimum Lease Period
 * Shorter minimums = more flexibility (but HOA may prefer longer).
 */
export function normalizeMinimumLeasePeriod(value: any): NormalizationResult {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { score: 60, confidence: 'Low', reason: 'No minimum lease data' };
  }

  const lease = value.toLowerCase().trim();

  // No minimum is most flexible
  if (lease.includes('no minimum') || lease.includes('none') ||
      lease === 'n/a' || lease.includes('any')) {
    return { score: 100, confidence: 'High', reason: 'No minimum lease - maximum flexibility' };
  }

  // Short-term allowed
  if (lease.includes('month') || lease.includes('30 day') ||
      lease.includes('weekly') || lease.includes('short-term')) {
    return { score: 90, confidence: 'High', reason: 'Monthly/short-term leases allowed' };
  }

  // 3-month minimum
  if (lease.includes('3 month') || lease.includes('quarterly') ||
      lease.includes('90 day')) {
    return { score: 75, confidence: 'High', reason: '3-month minimum lease' };
  }

  // 6-month minimum
  if (lease.includes('6 month') || lease.includes('180 day')) {
    return { score: 65, confidence: 'High', reason: '6-month minimum lease' };
  }

  // 1-year minimum (most common)
  if (lease.includes('1 year') || lease.includes('12 month') ||
      lease.includes('annual')) {
    return { score: 55, confidence: 'High', reason: '1-year minimum lease' };
  }

  // 2+ year minimum is restrictive
  if (lease.includes('2 year') || lease.includes('24 month')) {
    return { score: 40, confidence: 'High', reason: '2-year minimum lease - restrictive' };
  }

  return { score: 55, confidence: 'Low', reason: 'Lease period not recognized' };
}

/**
 * Field 162: Lease Restrictions Y/N
 * Restrictions limit investor appeal.
 */
export function normalizeLeaseRestrictionsYn(value: any): NormalizationResult {
  if (value === null || value === undefined) {
    return { score: 60, confidence: 'Low', reason: 'No lease restriction data' };
  }

  const hasRestrictions = value === true || value === 'true' ||
                          value === 'yes' || value === 'Yes' ||
                          value === 1 || value === '1';

  if (hasRestrictions) {
    return { score: 40, confidence: 'High', reason: 'Lease restrictions in place' };
  }

  return { score: 85, confidence: 'High', reason: 'No lease restrictions' };
}

/**
 * Field 165: Association Approval Y/N
 * Required approval adds friction to rental process.
 */
export function normalizeAssociationApprovalYn(value: any): NormalizationResult {
  if (value === null || value === undefined) {
    return { score: 65, confidence: 'Low', reason: 'No association approval data' };
  }

  const requiresApproval = value === true || value === 'true' ||
                           value === 'yes' || value === 'Yes' ||
                           value === 1 || value === '1';

  if (requiresApproval) {
    return { score: 45, confidence: 'High', reason: 'Association approval required - delays' };
  }

  return { score: 85, confidence: 'High', reason: 'No association approval needed' };
}

// =============================================================================
// SECTION V: FEATURES (Fields 166, 167, 168)
// Weight: 0% in industry standard (nice-to-have)
// =============================================================================

/**
 * Field 166: Community Features
 * Amenities like pool, gym, clubhouse add value.
 */
export function normalizeCommunityFeatures(value: any): NormalizationResult {
  if (!value) {
    return { score: 40, confidence: 'Low', reason: 'No community features data' };
  }

  let features: string[] = [];
  if (Array.isArray(value)) {
    features = value.map(f => String(f).toLowerCase());
  } else if (typeof value === 'string') {
    features = value.toLowerCase().split(',').map(f => f.trim());
  }

  if (features.length === 0) {
    return { score: 40, confidence: 'Low', reason: 'No community features' };
  }

  let score = 40;

  // Premium community amenities
  if (features.some(f => f.includes('pool') || f.includes('swimming'))) score += 15;
  if (features.some(f => f.includes('clubhouse') || f.includes('community center'))) score += 12;
  if (features.some(f => f.includes('gym') || f.includes('fitness'))) score += 12;
  if (features.some(f => f.includes('tennis') || f.includes('pickleball'))) score += 8;
  if (features.some(f => f.includes('golf'))) score += 15;
  if (features.some(f => f.includes('gated'))) score += 10;
  if (features.some(f => f.includes('marina') || f.includes('boat'))) score += 15;
  if (features.some(f => f.includes('beach'))) score += 12;
  if (features.some(f => f.includes('playground') || f.includes('park'))) score += 5;
  if (features.some(f => f.includes('dog park') || f.includes('pet'))) score += 5;
  if (features.some(f => f.includes('sidewalk') || f.includes('walking trail'))) score += 5;

  const finalScore = Math.min(100, score);
  return {
    score: finalScore,
    confidence: 'High',
    reason: `${features.length} community features`
  };
}

/**
 * Field 167: Interior Features
 * Premium interior finishes add value.
 */
export function normalizeInteriorFeatures(value: any): NormalizationResult {
  if (!value) {
    return { score: 40, confidence: 'Low', reason: 'No interior features data' };
  }

  let features: string[] = [];
  if (Array.isArray(value)) {
    features = value.map(f => String(f).toLowerCase());
  } else if (typeof value === 'string') {
    features = value.toLowerCase().split(',').map(f => f.trim());
  }

  if (features.length === 0) {
    return { score: 40, confidence: 'Low', reason: 'No interior features' };
  }

  let score = 40;

  // Premium interior features
  if (features.some(f => f.includes('cathedral') || f.includes('vaulted'))) score += 12;
  if (features.some(f => f.includes('walk-in closet'))) score += 8;
  if (features.some(f => f.includes('main floor') || f.includes('master main'))) score += 10;
  if (features.some(f => f.includes('open floor'))) score += 8;
  if (features.some(f => f.includes('crown molding'))) score += 5;
  if (features.some(f => f.includes('skylight'))) score += 5;
  if (features.some(f => f.includes('wet bar'))) score += 8;
  if (features.some(f => f.includes('built-in'))) score += 8;
  if (features.some(f => f.includes('wood floor') || f.includes('hardwood'))) score += 10;
  if (features.some(f => f.includes('wine'))) score += 5;
  if (features.some(f => f.includes('tray ceiling'))) score += 5;

  const finalScore = Math.min(100, score);
  return {
    score: finalScore,
    confidence: 'High',
    reason: `${features.length} interior features`
  };
}

/**
 * Field 168: Exterior Features
 * Premium exterior features add outdoor living value.
 */
export function normalizeExteriorFeatures(value: any): NormalizationResult {
  if (!value) {
    return { score: 40, confidence: 'Low', reason: 'No exterior features data' };
  }

  let features: string[] = [];
  if (Array.isArray(value)) {
    features = value.map(f => String(f).toLowerCase());
  } else if (typeof value === 'string') {
    features = value.toLowerCase().split(',').map(f => f.trim());
  }

  if (features.length === 0) {
    return { score: 40, confidence: 'Low', reason: 'No exterior features' };
  }

  let score = 40;

  // Premium exterior features (especially important in FL)
  if (features.some(f => f.includes('outdoor kitchen') || f.includes('summer kitchen'))) score += 15;
  if (features.some(f => f.includes('private dock') || f.includes('dock'))) score += 18;
  if (features.some(f => f.includes('hurricane shutter'))) score += 10;
  if (features.some(f => f.includes('balcony'))) score += 10;
  if (features.some(f => f.includes('sprinkler') || f.includes('irrigation'))) score += 8;
  if (features.some(f => f.includes('outdoor shower'))) score += 5;
  if (features.some(f => f.includes('sliding doors'))) score += 5;
  if (features.some(f => f.includes('screened'))) score += 12;
  if (features.some(f => f.includes('paver'))) score += 8;
  if (features.some(f => f.includes('lighting'))) score += 5;
  if (features.some(f => f.includes('awning') || f.includes('shade'))) score += 5;

  const finalScore = Math.min(100, score);
  return {
    score: finalScore,
    confidence: 'High',
    reason: `${features.length} exterior features`
  };
}

// =============================================================================
// MASTER EXPORT: All Normalization Functions by Field Number
// =============================================================================

export const FIELD_NORMALIZERS: Record<number, NormalizationFunction> = {
  // Section A: Address & Identity
  6: normalizeNeighborhood,
  7: normalizeCounty,
  8: normalizeZipCode,

  // Section F: Interior Features
  49: normalizeFlooringType,
  50: normalizeKitchenFeatures,
  51: normalizeAppliancesIncluded,
  52: normalizeFireplaceYn,

  // Section G: Exterior Features
  54: normalizePoolYn,
  55: normalizePoolType,
  56: normalizeDeckPatio,
  57: normalizeFence,
  58: normalizeLandscaping,

  // Section H: Permits & Renovations
  59: normalizeRecentRenovations,
  60: normalizePermitHistoryRoof,
  61: normalizePermitHistoryHvac,
  62: normalizePermitHistoryOther,

  // Section K: Distances & Amenities
  83: normalizeDistanceGrocery,
  84: normalizeDistanceHospital,
  85: normalizeDistanceAirport,
  86: normalizeDistancePark,
  87: normalizeDistanceBeach,

  // Section L: Safety & Crime
  88: normalizeViolentCrimeIndex,
  89: normalizePropertyCrimeIndex,
  90: normalizeNeighborhoodSafetyRating,

  // Section N: Utilities & Connectivity
  105: normalizeAvgElectricBill,
  107: normalizeAvgWaterBill,
  109: normalizeNaturalGas,
  111: normalizeInternetProviders,
  112: normalizeMaxInternetSpeed,
  113: normalizeFiberAvailable,
  115: normalizeCellCoverageQuality,
  116: normalizeEmergencyServicesDistance,

  // Section P: Additional Features
  131: normalizeViewType,
  132: normalizeLotFeatures,
  133: normalizeEvCharging,
  134: normalizeSmartHomeFeatures,
  135: normalizeAccessibilityModifications,
  136: normalizePetPolicy,
  137: normalizeAgeRestrictions,
  138: normalizeSpecialAssessments,

  // Section Q: Parking
  139: normalizeCarportYn,
  140: normalizeCarportSpaces,
  141: normalizeGarageAttachedYn,
  142: normalizeParkingFeatures,
  143: normalizeAssignedParkingSpaces,

  // Section R: Building
  144: normalizeFloorNumber,
  147: normalizeBuildingElevatorYn,
  148: normalizeFloorsInUnit,

  // Section S: Legal
  151: normalizeHomesteadYn,
  152: normalizeCddYn,
  153: normalizeAnnualCddFee,
  154: normalizeFrontExposure,

  // Section T: Waterfront
  155: normalizeWaterFrontageYn,
  156: normalizeWaterfrontFeet,
  157: normalizeWaterAccessYn,
  158: normalizeWaterViewYn,
  159: normalizeWaterBodyName,

  // Section U: Leasing
  160: normalizeCanBeLeasedYn,
  161: normalizeMinimumLeasePeriod,
  162: normalizeLeaseRestrictionsYn,
  165: normalizeAssociationApprovalYn,

  // Section V: Features
  166: normalizeCommunityFeatures,
  167: normalizeInteriorFeatures,
  168: normalizeExteriorFeatures,
};

/**
 * Normalize a field value to a 0-100 score
 *
 * @param fieldNumber - The field number (1-168)
 * @param value - The raw field value
 * @returns NormalizationResult with score, confidence, and reason
 */
export function normalizeField(fieldNumber: number, value: any): NormalizationResult {
  const normalizer = FIELD_NORMALIZERS[fieldNumber];

  if (!normalizer) {
    return {
      score: 50,
      confidence: 'Low',
      reason: `No normalizer for field ${fieldNumber}`
    };
  }

  return normalizer(value);
}

/**
 * Get all field numbers that have normalizers in this file
 */
export function getSupportedFieldNumbers(): number[] {
  return Object.keys(FIELD_NORMALIZERS).map(Number).sort((a, b) => a - b);
}
