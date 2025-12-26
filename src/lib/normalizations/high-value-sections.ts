/**
 * HIGH-VALUE SECTION NORMALIZATION FUNCTIONS
 *
 * CLUES SMART Score Engine - Normalization Layer
 *
 * This file contains normalization functions for the most impactful sections:
 * - Section B: Pricing & Value (fields 11, 12, 14, 15, 16) - 18% weight
 * - Section C: Property Basics (fields 17, 18, 19, 21, 22, 23, 25, 26, 27, 28) - 15% weight
 * - Section I: Schools (fields 63, 64, 66, 67, 69, 70, 72, 73) - 12% weight
 * - Section M: Market & Investment (fields 91-102) - 8% weight
 *
 * Market Context: Florida Coastal Real Estate
 * - Median home price: ~$425,000 (2024-2025)
 * - Average price/sqft: $280-$400 depending on proximity to water
 * - Strong rental market (tourism + snowbirds)
 * - Hurricane/flood insurance critical cost factor
 *
 * Each function normalizes raw values to 0-100 score
 * Higher score = better property quality/value
 *
 * Created: 2025-12-26
 * Conversation ID: CLUES-SMART-NORM-001
 */

// ================================================================
// TYPE DEFINITIONS
// ================================================================

export interface Property {
  [key: string]: any;
}

export interface NormalizationContext {
  listingPrice?: number;
  livingSqft?: number;
  yearBuilt?: number;
  neighborhood?: string;
  county?: string;
  zipCode?: string;
}

// ================================================================
// SECTION B: PRICING & VALUE (18% WEIGHT)
// Fields: 11, 12, 14, 15, 16
// ================================================================

/**
 * Field 11: Price Per Square Foot (price_per_sqft)
 *
 * Florida Coastal Market Benchmarks (2024-2025):
 * - Beachfront: $400-600+/sqft
 * - Waterfront (canal/bay): $350-450/sqft
 * - Near water (0-2 miles): $280-380/sqft
 * - Inland: $200-280/sqft
 *
 * Scoring Logic: Lower is better (value perspective)
 * We use $320/sqft as the market median for coastal FL
 */
export function normalizeField11(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined || isNaN(value) || value <= 0) {
    return 0;
  }

  const pricePerSqft = Number(value);

  // Florida coastal market median (non-beachfront)
  const marketMedian = 320;

  // Scoring tiers based on FL coastal market research
  // Under $200: Exceptional value (likely inland or needs work)
  // $200-250: Excellent value
  // $250-300: Good value
  // $300-350: Average market price
  // $350-400: Above average (likely waterfront or premium location)
  // $400+: Premium (beachfront, luxury, or overpriced)

  if (pricePerSqft < 150) return 100;  // Incredible value (verify condition)
  if (pricePerSqft < 200) return 95;   // Exceptional value
  if (pricePerSqft < 250) return 88;   // Excellent value
  if (pricePerSqft < 280) return 80;   // Very good value
  if (pricePerSqft < 320) return 72;   // Good value
  if (pricePerSqft < 350) return 60;   // Fair value (at market)
  if (pricePerSqft < 400) return 48;   // Slightly above market
  if (pricePerSqft < 450) return 35;   // Above market
  if (pricePerSqft < 500) return 25;   // Premium pricing
  if (pricePerSqft < 600) return 18;   // Luxury/beachfront expected
  return 10;                            // Very expensive
}

/**
 * Field 12: Market Value Estimate (market_value_estimate)
 *
 * Compares listing price to estimated market value.
 * Source: Typically from Zillow, Redfin, or appraiser
 *
 * Scoring Logic: Listed below estimate = great deal
 * The ratio of (Listing Price / Market Estimate) determines score
 */
export function normalizeField12(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined || isNaN(value) || value <= 0) {
    return 0;
  }

  const marketEstimate = Number(value);
  const listingPrice = context?.listingPrice;

  // If no listing price context, assume fair pricing
  if (!listingPrice || listingPrice <= 0) {
    // High estimate suggests strong property value
    if (marketEstimate >= 600000) return 85;
    if (marketEstimate >= 400000) return 75;
    if (marketEstimate >= 250000) return 65;
    return 50;
  }

  // Calculate price-to-estimate ratio
  const ratio = listingPrice / marketEstimate;

  // Best: Listed significantly below estimate (motivated seller, good deal)
  // Fair: Listed at estimate
  // Poor: Listed above estimate (overpriced or speculative pricing)

  if (ratio <= 0.85) return 100;  // 15%+ below estimate - exceptional deal
  if (ratio <= 0.90) return 92;   // 10-15% below - great deal
  if (ratio <= 0.95) return 82;   // 5-10% below - good deal
  if (ratio <= 0.98) return 72;   // 2-5% below - slight discount
  if (ratio <= 1.00) return 62;   // At estimate - fair pricing
  if (ratio <= 1.02) return 50;   // 0-2% above - acceptable
  if (ratio <= 1.05) return 40;   // 2-5% above - slightly overpriced
  if (ratio <= 1.10) return 28;   // 5-10% above - overpriced
  if (ratio <= 1.15) return 18;   // 10-15% above - significantly overpriced
  return 8;                        // >15% above - very overpriced
}

/**
 * Field 14: Last Sale Price (last_sale_price)
 *
 * Indicates property appreciation history and potential value.
 * Florida market has seen significant appreciation 2020-2024.
 *
 * Scoring Logic:
 * - Moderate appreciation (20-60%) = healthy market activity
 * - Excessive appreciation (>100%) = potential bubble risk
 * - Negative appreciation = value decline (investigate why)
 */
export function normalizeField14(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined || isNaN(value) || value <= 0) {
    return 0;
  }

  const lastSalePrice = Number(value);
  const listingPrice = context?.listingPrice;

  // Without listing price, evaluate based on absolute value
  if (!listingPrice || listingPrice <= 0) {
    // Higher last sale suggests more valuable property
    if (lastSalePrice >= 500000) return 75;
    if (lastSalePrice >= 300000) return 65;
    if (lastSalePrice >= 200000) return 55;
    return 45;
  }

  // Calculate appreciation percentage
  const appreciationPercent = ((listingPrice - lastSalePrice) / lastSalePrice) * 100;

  // Scoring based on appreciation analysis:
  // - Negative: Depreciation is concerning (unless recent purchase at peak)
  // - 0-10%: Minimal appreciation, stable but not exciting
  // - 10-30%: Healthy appreciation
  // - 30-60%: Strong appreciation (FL coastal has seen this 2020-2024)
  // - 60-100%: Very high appreciation (verify not overpriced)
  // - >100%: Excessive (either long-term hold or speculative pricing)

  if (appreciationPercent < -20) return 20;   // Significant depreciation - investigate
  if (appreciationPercent < -10) return 35;   // Moderate depreciation
  if (appreciationPercent < 0) return 45;     // Slight depreciation
  if (appreciationPercent < 10) return 55;    // Minimal growth
  if (appreciationPercent < 20) return 70;    // Moderate growth
  if (appreciationPercent < 35) return 85;    // Healthy appreciation
  if (appreciationPercent < 50) return 95;    // Strong appreciation (FL market)
  if (appreciationPercent < 70) return 90;    // Very strong (verify pricing)
  if (appreciationPercent < 100) return 75;   // High appreciation (caution)
  if (appreciationPercent < 150) return 55;   // Excessive (bubble risk)
  return 35;                                   // Very excessive (overpriced risk)
}

/**
 * Field 15: Assessed Value (assessed_value)
 *
 * County tax assessor's valuation. In Florida:
 * - Assessed value is often lower than market value
 * - Homestead exemption caps assessment increases at 3%/year
 * - Non-homesteaded properties can see 10%/year cap
 *
 * Scoring Logic: Compare to listing price for value assessment
 */
export function normalizeField15(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined || isNaN(value) || value <= 0) {
    return 0;
  }

  const assessedValue = Number(value);
  const listingPrice = context?.listingPrice;

  // Without listing price, evaluate based on assessed value strength
  if (!listingPrice || listingPrice <= 0) {
    // Higher assessed value suggests valuable property
    if (assessedValue >= 400000) return 80;
    if (assessedValue >= 300000) return 70;
    if (assessedValue >= 200000) return 60;
    if (assessedValue >= 150000) return 50;
    return 40;
  }

  // In FL, assessed value is typically 80-95% of market value
  // Calculate listing-to-assessed ratio
  const ratio = listingPrice / assessedValue;

  // Best: Listed at or below assessed (rare, great deal)
  // Good: Listed 10-30% above assessed (normal FL market)
  // Fair: Listed 30-50% above assessed (common post-appreciation)
  // Poor: Listed 50%+ above assessed (overpriced or needs reassessment)

  if (ratio <= 0.95) return 100;  // Listed below assessed - exceptional
  if (ratio <= 1.00) return 95;   // At assessed value
  if (ratio <= 1.10) return 88;   // 10% above - very good
  if (ratio <= 1.20) return 78;   // 20% above - good
  if (ratio <= 1.30) return 68;   // 30% above - fair (normal FL)
  if (ratio <= 1.40) return 55;   // 40% above - slightly high
  if (ratio <= 1.50) return 42;   // 50% above - high
  if (ratio <= 1.75) return 30;   // 75% above - very high
  return 18;                       // >75% above - overpriced
}

/**
 * Field 16: Redfin Estimate (redfin_estimate)
 *
 * Redfin's automated valuation model (AVM) estimate.
 * Generally more accurate than Zillow in Florida markets.
 *
 * Scoring Logic: Listed below Redfin estimate = better deal
 */
export function normalizeField16(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined || isNaN(value) || value <= 0) {
    return 0;
  }

  const redfinEstimate = Number(value);
  const listingPrice = context?.listingPrice;

  // Without listing price, evaluate estimate strength
  if (!listingPrice || listingPrice <= 0) {
    if (redfinEstimate >= 550000) return 82;
    if (redfinEstimate >= 400000) return 72;
    if (redfinEstimate >= 300000) return 62;
    return 50;
  }

  // Calculate listing-to-Redfin ratio
  const ratio = listingPrice / redfinEstimate;

  // Redfin estimates are updated frequently and consider recent sales
  // Scoring similar to market value estimate but slightly different thresholds

  if (ratio <= 0.88) return 100;  // 12%+ below Redfin - exceptional
  if (ratio <= 0.92) return 90;   // 8-12% below - great
  if (ratio <= 0.96) return 80;   // 4-8% below - good
  if (ratio <= 0.99) return 70;   // 1-4% below - slight discount
  if (ratio <= 1.01) return 60;   // At Redfin estimate
  if (ratio <= 1.04) return 48;   // 1-4% above
  if (ratio <= 1.08) return 38;   // 4-8% above
  if (ratio <= 1.12) return 28;   // 8-12% above
  if (ratio <= 1.18) return 18;   // 12-18% above
  return 10;                       // >18% above
}


// ================================================================
// SECTION C: PROPERTY BASICS (15% WEIGHT)
// Fields: 17, 18, 19, 21, 22, 23, 25, 26, 27, 28
// ================================================================

/**
 * Field 17: Bedrooms (bedrooms)
 *
 * Florida Coastal Market Preferences:
 * - 3 BR: Most desirable (families, couples, good resale)
 * - 4 BR: Great for families, vacation rentals
 * - 2 BR: Common for retirees, couples, condos
 * - 5+ BR: Niche market, harder to sell
 * - 1 BR: Very limited buyer pool (investment only)
 *
 * Scoring based on marketability and rental potential
 */
export function normalizeField17(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const bedrooms = Math.floor(Number(value));

  if (isNaN(bedrooms) || bedrooms < 0) {
    return 0;
  }

  // Scoring based on FL coastal market demand and rental yield
  switch (bedrooms) {
    case 0: return 15;   // Studio - very limited market
    case 1: return 35;   // 1 BR - condo/investment only
    case 2: return 70;   // 2 BR - popular with retirees, couples
    case 3: return 100;  // 3 BR - optimal for most buyers
    case 4: return 92;   // 4 BR - great for families, vacation rental
    case 5: return 78;   // 5 BR - large family, vacation home
    case 6: return 65;   // 6 BR - niche market
    case 7: return 52;   // 7 BR - very niche
    default: return bedrooms >= 8 ? 40 : 35; // 8+ BR - luxury/commercial
  }
}

/**
 * Field 18: Full Bathrooms (full_bathrooms)
 *
 * Full bathroom = toilet + sink + shower/tub
 * FL Preferences:
 * - At least 2 full bathrooms preferred
 * - Master ensuite essential for resale
 * - Guest bathroom important for vacation rentals
 */
export function normalizeField18(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const fullBaths = Number(value);

  if (isNaN(fullBaths) || fullBaths < 0) {
    return 0;
  }

  // Scoring based on comfort and marketability
  if (fullBaths < 1) return 10;   // No full bath - major issue
  if (fullBaths === 1) return 50; // 1 full bath - acceptable for small homes
  if (fullBaths === 2) return 85; // 2 full baths - standard for 3BR
  if (fullBaths === 3) return 100; // 3 full baths - excellent
  if (fullBaths === 4) return 95; // 4 full baths - great for large homes
  if (fullBaths === 5) return 88; // 5+ full baths - luxury
  return 80; // 6+ full baths - mansion territory
}

/**
 * Field 19: Half Bathrooms (half_bathrooms)
 *
 * Half bathroom = toilet + sink only (powder room)
 * Adds convenience for guests without major cost
 */
export function normalizeField19(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const halfBaths = Number(value);

  if (isNaN(halfBaths) || halfBaths < 0) {
    return 0;
  }

  // Half baths are a nice-to-have, not critical
  // 0 half baths is fine, 1 is good, 2+ is excellent
  if (halfBaths === 0) return 50; // Common, not penalized
  if (halfBaths === 1) return 85; // Guest powder room - convenient
  if (halfBaths === 2) return 100; // Multiple powder rooms - luxury
  return 90; // 3+ - large home
}

/**
 * Field 21: Living Square Feet (living_sqft)
 *
 * Florida Coastal Market Preferences:
 * - <1,200 sqft: Small condo/efficiency
 * - 1,200-1,800 sqft: Standard condo or small SFH
 * - 1,800-2,400 sqft: Average SFH
 * - 2,400-3,200 sqft: Large family home
 * - 3,200+ sqft: Luxury/estate
 *
 * Scoring considers both livability and cost-effectiveness
 */
export function normalizeField21(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const sqft = Number(value);

  if (isNaN(sqft) || sqft <= 0) {
    return 0;
  }

  // Scoring based on FL coastal SFH market
  if (sqft < 800) return 25;      // Tiny - very limited appeal
  if (sqft < 1000) return 40;     // Small efficiency/condo
  if (sqft < 1200) return 55;     // Small condo
  if (sqft < 1500) return 68;     // Standard condo/small home
  if (sqft < 1800) return 78;     // Average size
  if (sqft < 2100) return 88;     // Good family size
  if (sqft < 2400) return 95;     // Spacious
  if (sqft < 2800) return 100;    // Ideal - spacious but efficient
  if (sqft < 3200) return 95;     // Large
  if (sqft < 3800) return 88;     // Very large
  if (sqft < 4500) return 78;     // Estate size
  if (sqft < 5500) return 68;     // Large estate
  return 55;                       // Mansion (niche market, high costs)
}

/**
 * Field 22: Total Square Feet Under Roof (total_sqft_under_roof)
 *
 * Includes living space + garage + covered areas.
 * In FL, large covered outdoor areas (lanai) are valuable.
 *
 * Compare to living sqft to assess covered outdoor space value.
 */
export function normalizeField22(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const totalSqft = Number(value);
  const livingSqft = context?.livingSqft;

  if (isNaN(totalSqft) || totalSqft <= 0) {
    return 0;
  }

  // If we have living sqft, calculate bonus space ratio
  if (livingSqft && livingSqft > 0) {
    const bonusRatio = (totalSqft - livingSqft) / livingSqft;

    // Bonus space includes garage, lanai, storage
    // 10-30% bonus is typical
    // 30-50% bonus is excellent (large garage, screened lanai)
    // >50% bonus might include detached structures

    if (bonusRatio < 0.05) return 45;  // Very little bonus space
    if (bonusRatio < 0.15) return 60;  // Minimal bonus
    if (bonusRatio < 0.25) return 75;  // Average
    if (bonusRatio < 0.35) return 88;  // Good bonus space
    if (bonusRatio < 0.50) return 100; // Excellent (large garage + lanai)
    return 90;                          // Very large (verify structures)
  }

  // Without living sqft context, score based on total alone
  if (totalSqft < 1200) return 35;
  if (totalSqft < 1800) return 55;
  if (totalSqft < 2400) return 70;
  if (totalSqft < 3200) return 85;
  if (totalSqft < 4000) return 95;
  if (totalSqft < 5000) return 100;
  return 90;
}

/**
 * Field 23: Lot Size Square Feet (lot_size_sqft)
 *
 * Florida Coastal Market Context:
 * - Coastal lots are often smaller and more expensive
 * - Quarter-acre (10,890 sqft) is considered good size
 * - Large lots (0.5+ acres) less common near coast
 * - Tiny lots (<4,000 sqft) common in older FL neighborhoods
 *
 * Scoring considers outdoor space, privacy, and future potential
 */
export function normalizeField23(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const lotSqft = Number(value);

  if (isNaN(lotSqft) || lotSqft <= 0) {
    return 0;
  }

  // Reference: 1 acre = 43,560 sqft
  // Quarter acre = 10,890 sqft
  // Half acre = 21,780 sqft

  if (lotSqft < 3000) return 30;      // Very small lot (zero lot line)
  if (lotSqft < 5000) return 45;      // Small lot
  if (lotSqft < 7000) return 60;      // Below average
  if (lotSqft < 9000) return 72;      // Average FL lot
  if (lotSqft < 11000) return 85;     // Quarter acre - good
  if (lotSqft < 15000) return 95;     // Large lot
  if (lotSqft < 22000) return 100;    // Half acre - excellent
  if (lotSqft < 44000) return 95;     // Half to full acre
  if (lotSqft < 87000) return 88;     // 1-2 acres
  return 80;                           // >2 acres (estate, may need more maintenance)
}

/**
 * Field 25: Year Built (year_built)
 *
 * Florida Building Code History:
 * - Pre-1992: Before Hurricane Andrew code updates
 * - 1992-2001: Post-Andrew improvements
 * - 2002+: Florida Building Code (strongest wind resistance)
 * - 2010+: Updated energy codes
 * - 2020+: Newest codes and materials
 *
 * Scoring uses tiered approach per user preference
 */
export function normalizeField25(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const yearBuilt = Number(value);
  const currentYear = new Date().getFullYear();

  if (isNaN(yearBuilt) || yearBuilt < 1900 || yearBuilt > currentYear + 2) {
    return 0;
  }

  const age = currentYear - yearBuilt;

  // Tiered scoring with FL-specific considerations
  if (age <= 2) return 100;    // Brand new (latest codes, warranty)
  if (age <= 5) return 95;     // Nearly new
  if (age <= 10) return 88;    // Very new
  if (age <= 15) return 80;    // Modern (post-2010 codes)
  if (age <= 20) return 72;    // Recent (post-2005)
  if (age <= 25) return 65;    // Post-2002 FL Building Code
  if (age <= 32) return 55;    // Post-Andrew (1992+)
  if (age <= 40) return 42;    // Pre-Andrew (1984-1992) - check upgrades
  if (age <= 50) return 32;    // 1974-1984
  if (age <= 60) return 25;    // 1964-1974
  if (age <= 80) return 18;    // 1944-1964
  return 12;                    // Pre-1944 (historic value possible)
}

/**
 * Field 26: Property Type (property_type)
 *
 * Florida Market Preferences:
 * - Single Family: Most desirable, highest appreciation
 * - Townhouse: Good value, lower maintenance
 * - Condo: Lower prices, HOA dependency
 * - Multi-family: Investment focus
 * - Land: Speculative, development potential
 */
export function normalizeField26(value: string | null | undefined, context?: NormalizationContext): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const propType = String(value).toLowerCase().trim();

  // Single-family and detached homes most desirable
  if (propType.includes('single') && propType.includes('family')) return 100;
  if (propType.includes('single-family')) return 100;
  if (propType.includes('detached')) return 98;
  if (propType === 'sfr' || propType === 'sfh') return 100;

  // Townhouse variants
  if (propType.includes('townhome')) return 82;
  if (propType.includes('townhouse')) return 82;
  if (propType.includes('row house')) return 78;
  if (propType.includes('attached')) return 75;

  // Condo variants
  if (propType.includes('condo')) return 68;
  if (propType.includes('condominium')) return 68;
  if (propType.includes('cooperative') || propType.includes('co-op')) return 55;
  if (propType.includes('apartment')) return 50;

  // Multi-family
  if (propType.includes('duplex')) return 72;
  if (propType.includes('triplex')) return 68;
  if (propType.includes('quadplex') || propType.includes('fourplex')) return 65;
  if (propType.includes('multi')) return 60;

  // Other types
  if (propType.includes('villa')) return 78;
  if (propType.includes('mobile') || propType.includes('manufactured')) return 40;
  if (propType.includes('modular')) return 55;
  if (propType.includes('land') || propType.includes('lot')) return 35;
  if (propType.includes('commercial')) return 30;

  // Unknown type
  return 50;
}

/**
 * Field 27: Stories (stories)
 *
 * Florida Buyer Preferences:
 * - Single story: Premium for retirees (no stairs, accessibility)
 * - Two story: Popular with families
 * - Three+ stories: Townhouses, less desirable for most
 *
 * Single-story has significant premium in FL (aging population)
 */
export function normalizeField27(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const stories = Number(value);

  if (isNaN(stories) || stories <= 0) {
    return 0;
  }

  // FL market strongly favors single-story (retiree market)
  if (stories === 1) return 100;   // Single story - premium
  if (stories === 1.5) return 90;  // Split-level/partial second floor
  if (stories === 2) return 82;    // Two story - family friendly
  if (stories === 2.5) return 75;  // Two story with bonus
  if (stories === 3) return 60;    // Three story - townhouse
  return 45;                        // 4+ stories - unusual for SFH
}

/**
 * Field 28: Garage Spaces (garage_spaces)
 *
 * Florida Market Context:
 * - Garage essential for hurricane protection (vehicles, storage)
 * - 2-car garage is standard
 * - 3-car garage adds value
 * - No garage is major negative (older homes, condos)
 */
export function normalizeField28(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const spaces = Number(value);

  if (isNaN(spaces) || spaces < 0) {
    return 0;
  }

  // Scoring based on FL market expectations
  if (spaces === 0) return 25;    // No garage - significant drawback
  if (spaces === 1) return 60;    // 1-car garage - minimal
  if (spaces === 2) return 90;    // 2-car garage - standard
  if (spaces === 3) return 100;   // 3-car garage - excellent
  if (spaces === 4) return 95;    // 4-car garage - luxury
  return 88;                       // 5+ car - estate/collector
}


// ================================================================
// SECTION I: SCHOOLS (12% WEIGHT)
// Fields: 63, 64, 66, 67, 69, 70, 72, 73
// ================================================================

/**
 * Field 63: School District (school_district)
 *
 * Florida School District Quality Tiers:
 * - Tier 1: St. Johns, Seminole, Clay, Nassau counties
 * - Tier 2: Sarasota, Brevard, Martin, Collier
 * - Tier 3: Orange, Leon, Volusia
 * - Tier 4: Hillsborough, Duval, Palm Beach
 * - Tier 5: Miami-Dade, Broward, Polk
 *
 * Based on state rankings and GreatSchools data
 */
export function normalizeField63(value: string | null | undefined, context?: NormalizationContext): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const district = String(value).toLowerCase().trim();

  // Tier 1: Top-rated FL districts
  if (district.includes('st. johns') || district.includes('st johns')) return 100;
  if (district.includes('seminole')) return 95;
  if (district.includes('clay')) return 92;
  if (district.includes('nassau')) return 90;

  // Tier 2: Above-average districts
  if (district.includes('sarasota')) return 88;
  if (district.includes('brevard')) return 85;
  if (district.includes('martin')) return 85;
  if (district.includes('collier')) return 82;
  if (district.includes('manatee')) return 80;
  if (district.includes('indian river')) return 80;

  // Tier 3: Average districts
  if (district.includes('orange')) return 70;
  if (district.includes('leon')) return 72;
  if (district.includes('volusia')) return 68;
  if (district.includes('alachua')) return 70;
  if (district.includes('pinellas')) return 68;
  if (district.includes('lee')) return 65;

  // Tier 4: Below-average districts
  if (district.includes('hillsborough')) return 55;
  if (district.includes('duval')) return 52;
  if (district.includes('palm beach')) return 58;
  if (district.includes('pasco')) return 55;
  if (district.includes('escambia')) return 52;

  // Tier 5: Lower-rated districts
  if (district.includes('miami-dade') || district.includes('miami dade')) return 45;
  if (district.includes('broward')) return 48;
  if (district.includes('polk')) return 42;
  if (district.includes('osceola')) return 45;

  // Unknown district - assign average score
  return 55;
}

/**
 * Field 64: Elevation (feet) (elevation_feet)
 *
 * Critical for Florida flood risk assessment:
 * - <5 feet: High flood risk, expensive insurance
 * - 5-10 feet: Moderate risk
 * - 10-20 feet: Lower risk
 * - 20+ feet: Minimal flood risk (rare in coastal FL)
 *
 * Higher elevation = lower flood insurance = higher score
 */
export function normalizeField64(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const elevation = Number(value);

  if (isNaN(elevation)) {
    return 0;
  }

  // FL coastal areas are typically 0-30 feet elevation
  // Higher is much better for insurance and safety

  if (elevation < 0) return 5;     // Below sea level - extreme risk
  if (elevation < 3) return 15;    // Very low - high flood risk
  if (elevation < 5) return 28;    // Low - significant flood risk
  if (elevation < 7) return 42;    // Below average
  if (elevation < 10) return 55;   // Average coastal FL
  if (elevation < 15) return 72;   // Above average
  if (elevation < 20) return 85;   // Good elevation
  if (elevation < 30) return 95;   // Very good
  if (elevation < 50) return 100;  // Excellent (rare coastal)
  return 95;                        // Very high (far from coast likely)
}

/**
 * Field 66: Elementary School Rating (elementary_rating)
 *
 * GreatSchools/SchoolDigger rating (typically 1-10 scale)
 * Elementary ratings heavily influence family buyer decisions.
 *
 * Score conversion: rating * 10 with quality thresholds
 */
export function normalizeField66(value: number | string | null | undefined, context?: NormalizationContext): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  // Handle string values (e.g., "8/10", "A", "B+")
  let rating: number;
  const strValue = String(value).trim();

  // Check for letter grades
  if (/^[A-F][+-]?$/i.test(strValue)) {
    const gradeMap: Record<string, number> = {
      'a+': 10, 'a': 9.5, 'a-': 9,
      'b+': 8.5, 'b': 8, 'b-': 7.5,
      'c+': 7, 'c': 6.5, 'c-': 6,
      'd+': 5.5, 'd': 5, 'd-': 4.5,
      'f': 3
    };
    rating = gradeMap[strValue.toLowerCase()] || 5;
  } else {
    // Try to extract numeric value
    const numMatch = strValue.match(/(\d+\.?\d*)/);
    rating = numMatch ? parseFloat(numMatch[1]) : 0;
  }

  if (isNaN(rating) || rating < 0) {
    return 0;
  }

  // Normalize to 0-10 scale if needed
  if (rating > 10) {
    rating = rating / 10; // Handle 100-point scales
  }

  // Convert to 0-100 with quality emphasis
  if (rating >= 9) return 100;    // A/A+ schools
  if (rating >= 8) return 90;     // Strong B+/A-
  if (rating >= 7) return 78;     // Good B schools
  if (rating >= 6) return 65;     // Average B-/C+
  if (rating >= 5) return 50;     // Below average C
  if (rating >= 4) return 38;     // Poor C-/D+
  if (rating >= 3) return 25;     // Very poor D
  return 15;                       // Failing F
}

/**
 * Field 67: Elementary Distance (miles) (elementary_distance_mi)
 *
 * Closer is better for families with young children.
 * Walking distance (<0.5 mi) is premium.
 */
export function normalizeField67(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const distance = Number(value);

  if (isNaN(distance) || distance < 0) {
    return 0;
  }

  // Elementary schools - walkability matters most
  if (distance <= 0.25) return 100;   // Very close - walking distance
  if (distance <= 0.5) return 95;     // Walking distance
  if (distance <= 1.0) return 85;     // Bikeable
  if (distance <= 2.0) return 72;     // Short drive
  if (distance <= 3.0) return 60;     // Moderate drive
  if (distance <= 5.0) return 48;     // Longer drive
  if (distance <= 7.0) return 35;     // Far
  return 22;                           // Very far
}

/**
 * Field 69: Middle School Rating (middle_rating)
 *
 * Same scoring logic as elementary, slightly less weight
 * in buyer decisions but still important.
 */
export function normalizeField69(value: number | string | null | undefined, context?: NormalizationContext): number {
  // Reuse elementary rating logic
  return normalizeField66(value, context);
}

/**
 * Field 70: Middle School Distance (miles) (middle_distance_mi)
 *
 * Distance less critical than elementary (bus service common)
 * but still a convenience factor.
 */
export function normalizeField70(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const distance = Number(value);

  if (isNaN(distance) || distance < 0) {
    return 0;
  }

  // Middle schools - bus service more common
  if (distance <= 0.5) return 100;    // Very close
  if (distance <= 1.0) return 90;     // Walking/biking distance
  if (distance <= 2.0) return 78;     // Short commute
  if (distance <= 4.0) return 65;     // Moderate distance
  if (distance <= 6.0) return 52;     // Average
  if (distance <= 10.0) return 38;    // Far
  return 25;                           // Very far
}

/**
 * Field 72: High School Rating (high_rating)
 *
 * High school quality significantly impacts property values.
 * Same scoring as elementary/middle.
 */
export function normalizeField72(value: number | string | null | undefined, context?: NormalizationContext): number {
  // Reuse elementary rating logic
  return normalizeField66(value, context);
}

/**
 * Field 73: High School Distance (miles) (high_distance_mi)
 *
 * Students often drive; distance less critical.
 * But proximity still matters for activities and convenience.
 */
export function normalizeField73(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const distance = Number(value);

  if (isNaN(distance) || distance < 0) {
    return 0;
  }

  // High schools - students often drive, distance less critical
  if (distance <= 1.0) return 100;    // Very close
  if (distance <= 2.0) return 88;     // Close
  if (distance <= 4.0) return 75;     // Reasonable
  if (distance <= 6.0) return 62;     // Moderate
  if (distance <= 10.0) return 48;    // Average for FL
  if (distance <= 15.0) return 35;    // Far
  return 22;                           // Very far
}


// ================================================================
// SECTION M: MARKET & INVESTMENT DATA (8% WEIGHT)
// Fields: 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102
// ================================================================

/**
 * Field 91: Median Home Price (Neighborhood) (median_home_price_neighborhood)
 *
 * Indicates neighborhood price tier and market strength.
 * Higher median = more desirable area (generally).
 *
 * FL Coastal Benchmarks:
 * - <$250K: Entry-level/inland
 * - $250-400K: Average coastal
 * - $400-600K: Desirable coastal
 * - $600K-1M: Premium areas
 * - >$1M: Luxury markets
 */
export function normalizeField91(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const medianPrice = Number(value);

  if (isNaN(medianPrice) || medianPrice <= 0) {
    return 0;
  }

  // Score based on market strength indicator
  // Higher median suggests more desirable neighborhood
  if (medianPrice < 200000) return 40;      // Entry-level area
  if (medianPrice < 300000) return 55;      // Below average
  if (medianPrice < 400000) return 68;      // Average FL coastal
  if (medianPrice < 500000) return 78;      // Above average
  if (medianPrice < 650000) return 88;      // Desirable
  if (medianPrice < 850000) return 95;      // Premium
  if (medianPrice < 1200000) return 100;    // Luxury
  if (medianPrice < 2000000) return 95;     // Ultra-luxury
  return 88;                                 // Elite (limited buyer pool)
}

/**
 * Field 92: Price Per Sqft Recent Average (price_per_sqft_recent_avg)
 *
 * Neighborhood's recent $/sqft benchmark.
 * Use this to validate listing price competitiveness.
 */
export function normalizeField92(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const avgPricePerSqft = Number(value);

  if (isNaN(avgPricePerSqft) || avgPricePerSqft <= 0) {
    return 0;
  }

  // Similar to field 11, but this is neighborhood context
  // Higher avg suggests more valuable neighborhood
  if (avgPricePerSqft < 150) return 45;     // Very affordable area
  if (avgPricePerSqft < 200) return 55;     // Affordable
  if (avgPricePerSqft < 250) return 65;     // Below average
  if (avgPricePerSqft < 300) return 75;     // Average FL coastal
  if (avgPricePerSqft < 350) return 85;     // Above average
  if (avgPricePerSqft < 400) return 92;     // Desirable
  if (avgPricePerSqft < 500) return 98;     // Premium
  if (avgPricePerSqft < 650) return 100;    // Luxury
  return 95;                                 // Ultra-premium
}

/**
 * Field 93: Price to Rent Ratio (price_to_rent_ratio)
 *
 * Formula: Purchase Price / (Monthly Rent * 12)
 *
 * Investment Analysis:
 * - <12: Excellent buy vs rent (strong rental yield)
 * - 12-15: Good investment potential
 * - 15-20: Neutral (could go either way)
 * - 20-25: Better to rent in this market
 * - >25: Much better to rent (poor investment)
 *
 * Lower ratio = better for buying/investing
 */
export function normalizeField93(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const priceToRent = Number(value);

  if (isNaN(priceToRent) || priceToRent <= 0) {
    return 0;
  }

  // Lower price-to-rent ratio = better for investors
  if (priceToRent < 10) return 100;   // Exceptional investment value
  if (priceToRent < 12) return 92;    // Excellent
  if (priceToRent < 14) return 82;    // Very good
  if (priceToRent < 16) return 72;    // Good
  if (priceToRent < 18) return 60;    // Fair
  if (priceToRent < 20) return 50;    // Neutral
  if (priceToRent < 23) return 38;    // Weak investment
  if (priceToRent < 26) return 28;    // Poor investment
  if (priceToRent < 30) return 18;    // Very poor
  return 10;                           // Terrible investment value
}

/**
 * Field 94: Price vs Median Percent (price_vs_median_percent)
 *
 * How listing price compares to neighborhood median.
 * - Negative %: Below median (potential value)
 * - 0%: At median
 * - Positive %: Above median (premium or overpriced)
 *
 * Scoring: Below median is better (value opportunity)
 */
export function normalizeField94(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const percentVsMedian = Number(value);

  if (isNaN(percentVsMedian)) {
    return 0;
  }

  // Value is percentage difference from median
  // -20% means 20% below median (good value)
  // +20% means 20% above median (premium/overpriced)

  if (percentVsMedian <= -30) return 100;  // 30%+ below median - exceptional value
  if (percentVsMedian <= -20) return 92;   // 20-30% below
  if (percentVsMedian <= -15) return 85;   // 15-20% below
  if (percentVsMedian <= -10) return 78;   // 10-15% below
  if (percentVsMedian <= -5) return 70;    // 5-10% below
  if (percentVsMedian <= 0) return 62;     // At or slightly below median
  if (percentVsMedian <= 5) return 52;     // 0-5% above median
  if (percentVsMedian <= 10) return 42;    // 5-10% above
  if (percentVsMedian <= 15) return 32;    // 10-15% above
  if (percentVsMedian <= 20) return 22;    // 15-20% above
  if (percentVsMedian <= 30) return 15;    // 20-30% above
  return 8;                                 // >30% above median
}

/**
 * Field 95: Days on Market Average (days_on_market_avg)
 *
 * Market velocity indicator:
 * - <14 days: Hot market (seller's market)
 * - 14-30 days: Active market
 * - 30-60 days: Balanced market
 * - 60-90 days: Slow market (buyer's market)
 * - >90 days: Very slow (price reductions likely)
 *
 * Lower = more liquid market = easier to sell
 */
export function normalizeField95(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const daysOnMarket = Number(value);

  if (isNaN(daysOnMarket) || daysOnMarket < 0) {
    return 0;
  }

  // Lower DOM = healthier market
  if (daysOnMarket < 7) return 100;    // Extremely hot market
  if (daysOnMarket < 14) return 92;    // Very active
  if (daysOnMarket < 21) return 85;    // Active
  if (daysOnMarket < 30) return 78;    // Healthy
  if (daysOnMarket < 45) return 68;    // Normal
  if (daysOnMarket < 60) return 55;    // Slower
  if (daysOnMarket < 90) return 42;    // Slow
  if (daysOnMarket < 120) return 30;   // Very slow
  if (daysOnMarket < 180) return 20;   // Stagnant
  return 10;                            // Dead market
}

/**
 * Field 96: Inventory Surplus (inventory_surplus)
 *
 * Months of inventory in the neighborhood:
 * - <2 months: Seller's market (low inventory)
 * - 2-4 months: Balanced to seller
 * - 4-6 months: Balanced
 * - 6-8 months: Balanced to buyer
 * - >8 months: Buyer's market (high inventory)
 *
 * For buyers: Higher inventory = more negotiating power
 */
export function normalizeField96(value: number | string | null | undefined, context?: NormalizationContext): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  // May be stored as string like "3.5 months" or number
  let months: number;
  const strValue = String(value).trim();
  const numMatch = strValue.match(/(\d+\.?\d*)/);
  months = numMatch ? parseFloat(numMatch[1]) : 0;

  if (isNaN(months) || months < 0) {
    return 0;
  }

  // Lower inventory = seller's market (harder for buyers but faster sales)
  // Balanced (4-6 months) scores highest for stability

  if (months < 1) return 55;       // Very low - extreme seller's market
  if (months < 2) return 65;       // Low - seller's market
  if (months < 3) return 78;       // Lean inventory
  if (months < 4) return 88;       // Balanced-lean
  if (months < 5) return 100;      // Balanced - ideal
  if (months < 6) return 95;       // Balanced-heavy
  if (months < 8) return 80;       // Buyer's market starting
  if (months < 10) return 65;      // Buyer's market
  if (months < 12) return 50;      // Heavy inventory
  return 35;                        // Oversupplied market
}

/**
 * Field 97: Insurance Estimate Annual (insurance_est_annual)
 *
 * CRITICAL for Florida - hurricane/flood insurance crisis.
 *
 * FL Insurance Benchmarks (2024-2025):
 * - <$2,000/yr: Excellent (rare for coastal)
 * - $2,000-4,000: Good
 * - $4,000-6,000: Average coastal
 * - $6,000-10,000: High but common
 * - >$10,000: Very high (flood zone, older roof)
 *
 * Lower = better (huge impact on affordability)
 */
export function normalizeField97(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const annualInsurance = Number(value);

  if (isNaN(annualInsurance) || annualInsurance < 0) {
    return 0;
  }

  // Lower insurance = better score
  if (annualInsurance < 1500) return 100;   // Exceptional (likely inland, new roof)
  if (annualInsurance < 2500) return 92;    // Excellent
  if (annualInsurance < 3500) return 82;    // Very good
  if (annualInsurance < 4500) return 72;    // Good
  if (annualInsurance < 6000) return 62;    // Average FL coastal
  if (annualInsurance < 8000) return 50;    // Above average
  if (annualInsurance < 10000) return 38;   // High
  if (annualInsurance < 15000) return 25;   // Very high
  if (annualInsurance < 20000) return 15;   // Extreme
  return 8;                                  // Uninsurable territory
}

/**
 * Field 98: Rental Estimate Monthly (rental_estimate_monthly)
 *
 * Potential rental income if property is leased.
 * Important for:
 * - Investment properties
 * - Vacation rentals (FL coastal)
 * - Offsetting carrying costs
 *
 * Higher = better income potential
 */
export function normalizeField98(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const monthlyRent = Number(value);

  if (isNaN(monthlyRent) || monthlyRent <= 0) {
    return 0;
  }

  // Higher rental income = better
  // FL coastal rental benchmarks
  if (monthlyRent < 1200) return 30;      // Very low rent potential
  if (monthlyRent < 1600) return 45;      // Below average
  if (monthlyRent < 2000) return 58;      // Average
  if (monthlyRent < 2500) return 70;      // Good
  if (monthlyRent < 3000) return 80;      // Very good
  if (monthlyRent < 3500) return 88;      // Excellent
  if (monthlyRent < 4500) return 95;      // Premium
  if (monthlyRent < 6000) return 100;     // Luxury rental
  return 95;                               // Ultra-luxury (niche market)
}

/**
 * Field 99: Rental Yield Estimate (rental_yield_est)
 *
 * Formula: (Annual Rent / Purchase Price) * 100
 *
 * Investment Analysis:
 * - <4%: Poor yield (appreciation play only)
 * - 4-5%: Below average
 * - 5-6%: Average
 * - 6-8%: Good
 * - 8-10%: Excellent
 * - >10%: Exceptional (verify accuracy)
 *
 * Higher = better investment return
 */
export function normalizeField99(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const yieldPercent = Number(value);

  if (isNaN(yieldPercent) || yieldPercent < 0) {
    return 0;
  }

  // Higher yield = better for investors
  if (yieldPercent < 3) return 25;      // Very poor yield
  if (yieldPercent < 4) return 38;      // Poor
  if (yieldPercent < 5) return 52;      // Below average
  if (yieldPercent < 6) return 65;      // Average
  if (yieldPercent < 7) return 78;      // Good
  if (yieldPercent < 8) return 88;      // Very good
  if (yieldPercent < 10) return 95;     // Excellent
  if (yieldPercent < 12) return 100;    // Exceptional
  return 92;                             // Very high (verify data)
}

/**
 * Field 100: Vacancy Rate Neighborhood (vacancy_rate_neighborhood)
 *
 * Percentage of vacant rental units in area.
 *
 * Rental Market Health:
 * - <3%: Very tight market (high demand)
 * - 3-5%: Healthy market
 * - 5-7%: Balanced
 * - 7-10%: Soft market
 * - >10%: Weak rental market
 *
 * Lower = stronger rental demand = better for investors
 */
export function normalizeField100(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const vacancyRate = Number(value);

  if (isNaN(vacancyRate) || vacancyRate < 0) {
    return 0;
  }

  // Lower vacancy = better
  if (vacancyRate < 2) return 100;     // Extremely tight market
  if (vacancyRate < 3) return 92;      // Very tight
  if (vacancyRate < 4) return 85;      // Tight
  if (vacancyRate < 5) return 78;      // Healthy
  if (vacancyRate < 6) return 68;      // Balanced
  if (vacancyRate < 8) return 55;      // Slightly soft
  if (vacancyRate < 10) return 42;     // Soft market
  if (vacancyRate < 15) return 28;     // Weak market
  return 15;                            // Very weak
}

/**
 * Field 101: Cap Rate Estimate (cap_rate_est)
 *
 * Capitalization Rate = Net Operating Income / Purchase Price
 *
 * Investment Analysis:
 * - <4%: Low return (appreciation focus)
 * - 4-5%: Below average
 * - 5-6%: Average for FL coastal
 * - 6-8%: Good
 * - 8-10%: Very good (verify expenses)
 * - >10%: Excellent (or high risk)
 *
 * Higher = better cash flow return
 */
export function normalizeField101(value: number, context?: NormalizationContext): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const capRate = Number(value);

  if (isNaN(capRate) || capRate < 0) {
    return 0;
  }

  // Higher cap rate = better cash flow
  if (capRate < 3) return 22;       // Very low cap rate
  if (capRate < 4) return 35;       // Low
  if (capRate < 5) return 50;       // Below average
  if (capRate < 6) return 65;       // Average FL coastal
  if (capRate < 7) return 78;       // Good
  if (capRate < 8) return 88;       // Very good
  if (capRate < 10) return 95;      // Excellent
  if (capRate < 12) return 100;     // Exceptional
  return 90;                         // Very high (verify data, may be risky)
}

/**
 * Field 102: Financing Terms (financing_terms)
 *
 * Special financing options available:
 * - Assumable mortgage (huge value in high-rate environment)
 * - Seller financing
 * - FHA/VA eligible
 * - Cash only (often means issues)
 *
 * Better terms = easier financing = higher score
 */
export function normalizeField102(value: string | null | undefined, context?: NormalizationContext): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const terms = String(value).toLowerCase().trim();

  // Assumable mortgage is extremely valuable in 2024-2025 (rates 6-8%)
  if (terms.includes('assumable')) {
    // Check if it's a low-rate assumable
    if (terms.includes('2%') || terms.includes('2.') ||
        terms.includes('3%') || terms.includes('3.')) {
      return 100;  // Assumable sub-4% mortgage is gold
    }
    if (terms.includes('4%') || terms.includes('4.') ||
        terms.includes('5%') || terms.includes('5.')) {
      return 92;   // Assumable 4-5% is excellent
    }
    return 85;     // Any assumable is valuable
  }

  // Seller financing options
  if (terms.includes('seller financ') || terms.includes('owner financ')) {
    return 82;
  }

  // FHA/VA eligibility
  if (terms.includes('fha') && terms.includes('va')) return 75;
  if (terms.includes('va ') || terms.includes(' va')) return 72;
  if (terms.includes('fha')) return 70;

  // USDA rural eligible
  if (terms.includes('usda')) return 68;

  // Conventional only
  if (terms.includes('conventional')) return 55;

  // Cash only (often indicates issues)
  if (terms.includes('cash only')) return 30;
  if (terms.includes('cash')) return 40;

  // As-is or investor only
  if (terms.includes('as-is') || terms.includes('as is')) return 35;
  if (terms.includes('investor')) return 42;

  // Standard/conventional assumed
  return 50;
}


// ================================================================
// EXPORT: FIELD NORMALIZER MAPPING
// ================================================================

export const HIGH_VALUE_NORMALIZERS: Record<number, (value: any, context?: NormalizationContext) => number> = {
  // Section B: Pricing & Value
  11: normalizeField11,
  12: normalizeField12,
  14: normalizeField14,
  15: normalizeField15,
  16: normalizeField16,

  // Section C: Property Basics
  17: normalizeField17,
  18: normalizeField18,
  19: normalizeField19,
  21: normalizeField21,
  22: normalizeField22,
  23: normalizeField23,
  25: normalizeField25,
  26: normalizeField26,
  27: normalizeField27,
  28: normalizeField28,

  // Section I: Schools
  63: normalizeField63,
  64: normalizeField64,
  66: normalizeField66,
  67: normalizeField67,
  69: normalizeField69,
  70: normalizeField70,
  72: normalizeField72,
  73: normalizeField73,

  // Section M: Market & Investment
  91: normalizeField91,
  92: normalizeField92,
  93: normalizeField93,
  94: normalizeField94,
  95: normalizeField95,
  96: normalizeField96,
  97: normalizeField97,
  98: normalizeField98,
  99: normalizeField99,
  100: normalizeField100,
  101: normalizeField101,
  102: normalizeField102,
};

/**
 * Master normalization function
 *
 * Usage:
 * const score = normalizeHighValueField(11, 285, { listingPrice: 450000 });
 */
export function normalizeHighValueField(
  fieldId: number,
  value: any,
  context?: NormalizationContext
): number {
  const normalizer = HIGH_VALUE_NORMALIZERS[fieldId];

  if (!normalizer) {
    // Field not in high-value sections, return 50 if populated
    return value !== null && value !== undefined && value !== '' ? 50 : 0;
  }

  return normalizer(value, context);
}

/**
 * Batch normalize all high-value fields for a property
 */
export function normalizeAllHighValueFields(
  propertyData: Record<string, any>,
  context?: NormalizationContext
): Record<number, number> {
  const scores: Record<number, number> = {};

  for (const fieldId of Object.keys(HIGH_VALUE_NORMALIZERS)) {
    const id = Number(fieldId);
    const value = propertyData[fieldId] ?? propertyData[`${fieldId}_${getFieldKey(id)}`];
    scores[id] = normalizeHighValueField(id, value, context);
  }

  return scores;
}

/**
 * Get field key by ID (helper function)
 */
function getFieldKey(fieldId: number): string {
  const fieldKeyMap: Record<number, string> = {
    11: 'price_per_sqft',
    12: 'market_value_estimate',
    14: 'last_sale_price',
    15: 'assessed_value',
    16: 'redfin_estimate',
    17: 'bedrooms',
    18: 'full_bathrooms',
    19: 'half_bathrooms',
    21: 'living_sqft',
    22: 'total_sqft_under_roof',
    23: 'lot_size_sqft',
    25: 'year_built',
    26: 'property_type',
    27: 'stories',
    28: 'garage_spaces',
    63: 'school_district',
    64: 'elevation_feet',
    66: 'elementary_rating',
    67: 'elementary_distance_mi',
    69: 'middle_rating',
    70: 'middle_distance_mi',
    72: 'high_rating',
    73: 'high_distance_mi',
    91: 'median_home_price_neighborhood',
    92: 'price_per_sqft_recent_avg',
    93: 'price_to_rent_ratio',
    94: 'price_vs_median_percent',
    95: 'days_on_market_avg',
    96: 'inventory_surplus',
    97: 'insurance_est_annual',
    98: 'rental_estimate_monthly',
    99: 'rental_yield_est',
    100: 'vacancy_rate_neighborhood',
    101: 'cap_rate_est',
    102: 'financing_terms',
  };

  return fieldKeyMap[fieldId] || '';
}
