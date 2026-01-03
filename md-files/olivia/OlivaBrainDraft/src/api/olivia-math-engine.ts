/**
 * OLIVIA MATHEMATICAL ANALYSIS ENGINE
 *
 * This module contains the mathematical scoring algorithms and validation logic
 * that forces Claude Desktop to perform honest calculations with proofs across
 * all 168 fields when comparing properties.
 *
 * CRITICAL: No hallucinations allowed - every score must have mathematical proof.
 */

import type { OliviaEnhancedPropertyInput } from '@/types/olivia-enhanced';

// ============================================================================
// FIELD SCORING ALGORITHMS
// ============================================================================

/**
 * Field scoring methodology by data type
 */
export type FieldScoreMethod =
  | 'lower_is_better'    // taxes, HOA, crime
  | 'higher_is_better'   // sqft, bedrooms, scores
  | 'closer_to_ideal'    // year built (not too old, not too new)
  | 'binary_yes_no'      // has_pool, permits_current
  | 'risk_assessment'    // flood, hurricane, earthquake
  | 'quality_tier'       // school ratings, construction quality
  | 'location_desirability' // walkability, transit scores
  | 'financial_roi';     // cap rate, rental yield, appreciation

/**
 * Mathematical proof structure for each field comparison
 */
export interface FieldComparisonProof {
  fieldNumber: number;
  fieldName: string;
  method: FieldScoreMethod;
  property1Value: any;
  property2Value: any;
  property3Value: any;
  property1Score: number; // 0-100
  property2Score: number; // 0-100
  property3Score: number; // 0-100
  winner: 1 | 2 | 3;
  calculation: string; // Mathematical proof
  reasoning: string;
}

/**
 * Section score aggregation
 */
export interface SectionScoreProof {
  sectionName: string;
  fieldCount: number;
  property1Score: number; // Weighted average
  property2Score: number;
  property3Score: number;
  winner: 1 | 2 | 3;
  calculation: string;
  fieldProofs: FieldComparisonProof[];
}

/**
 * Overall investment grade calculation
 */
export interface InvestmentGradeProof {
  property1Grade: string; // A+ to F
  property2Grade: string;
  property3Grade: string;
  property1Score: number; // 0-100
  property2Score: number;
  property3Score: number;
  winner: 1 | 2 | 3;
  sectionBreakdown: SectionScoreProof[];
  calculation: string;
  finalRecommendation: string;
}

// ============================================================================
// FIELD-SPECIFIC SCORING FUNCTIONS
// ============================================================================

/**
 * Score: Lower is Better (taxes, HOA, crime rates)
 * Formula: score = 100 - ((value - min) / (max - min)) * 100
 */
export function scoreLowerIsBetter(values: number[]): { scores: number[]; proof: string } {
  const validValues = values.filter(v => v != null && !isNaN(v));
  if (validValues.length === 0) return { scores: [50, 50, 50], proof: 'No valid data' };

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  const range = max - min;

  if (range === 0) {
    return { scores: [100, 100, 100], proof: 'All values equal' };
  }

  const scores = values.map(v => {
    if (v == null || isNaN(v)) return 0;
    return 100 - ((v - min) / range) * 100;
  });

  const proof = `Range: [${min.toFixed(2)} - ${max.toFixed(2)}]. Scores: ${values.map((v, i) =>
    `P${i+1}: ${v?.toFixed(2) || 'N/A'} → ${scores[i].toFixed(1)}`
  ).join(', ')}`;

  return { scores, proof };
}

/**
 * Score: Higher is Better (sqft, bedrooms, walk score)
 * Formula: score = ((value - min) / (max - min)) * 100
 */
export function scoreHigherIsBetter(values: number[]): { scores: number[]; proof: string } {
  const validValues = values.filter(v => v != null && !isNaN(v));
  if (validValues.length === 0) return { scores: [50, 50, 50], proof: 'No valid data' };

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  const range = max - min;

  if (range === 0) {
    return { scores: [100, 100, 100], proof: 'All values equal' };
  }

  const scores = values.map(v => {
    if (v == null || isNaN(v)) return 0;
    return ((v - min) / range) * 100;
  });

  const proof = `Range: [${min.toFixed(2)} - ${max.toFixed(2)}]. Scores: ${values.map((v, i) =>
    `P${i+1}: ${v?.toFixed(2) || 'N/A'} → ${scores[i].toFixed(1)}`
  ).join(', ')}`;

  return { scores, proof };
}

/**
 * Score: Closer to Ideal (year built - not too old, not too new)
 * Formula: Gaussian distribution around ideal year
 */
export function scoreCloserToIdeal(
  values: number[],
  idealValue: number,
  sigma: number = 10
): { scores: number[]; proof: string } {
  const scores = values.map(v => {
    if (v == null || isNaN(v)) return 0;
    const distance = Math.abs(v - idealValue);
    // Gaussian function: e^(-(distance^2)/(2*sigma^2))
    const score = Math.exp(-(distance * distance) / (2 * sigma * sigma)) * 100;
    return score;
  });

  const proof = `Ideal: ${idealValue} (±${sigma}). Scores: ${values.map((v, i) =>
    `P${i+1}: ${v || 'N/A'} → ${scores[i].toFixed(1)}`
  ).join(', ')}`;

  return { scores, proof };
}

/**
 * Score: Binary Yes/No (has pool, permits current)
 * Formula: Yes = 100, No = 0
 */
export function scoreBinary(values: boolean[]): { scores: number[]; proof: string } {
  const scores = values.map(v => v ? 100 : 0);
  const proof = `Binary scoring: ${values.map((v, i) =>
    `P${i+1}: ${v ? 'Yes' : 'No'} → ${scores[i]}`
  ).join(', ')}`;
  return { scores, proof };
}

/**
 * Score: Risk Assessment (flood, hurricane, earthquake)
 * Formula: Inverse of risk level (Low=100, Moderate=66, High=33, Severe=0)
 */
export function scoreRiskAssessment(values: string[]): { scores: number[]; proof: string } {
  const riskMap: Record<string, number> = {
    'none': 100,
    'low': 85,
    'moderate': 60,
    'high': 35,
    'severe': 10,
    'extreme': 0
  };

  const scores = values.map(v => {
    const normalized = (v || 'moderate').toLowerCase();
    return riskMap[normalized] ?? 50;
  });

  const proof = `Risk levels: ${values.map((v, i) =>
    `P${i+1}: ${v || 'N/A'} → ${scores[i]}`
  ).join(', ')}`;

  return { scores, proof };
}

/**
 * Score: Quality Tier (school ratings A-F)
 * Formula: Letter grade to numeric (A+=100, A=95, B+=87, etc.)
 */
export function scoreQualityTier(values: string[]): { scores: number[]; proof: string } {
  const gradeMap: Record<string, number> = {
    'A+': 100, 'A': 95, 'A-': 90,
    'B+': 87, 'B': 83, 'B-': 80,
    'C+': 77, 'C': 73, 'C-': 70,
    'D+': 67, 'D': 63, 'D-': 60,
    'F': 50
  };

  const scores = values.map(v => {
    const normalized = (v || 'C').toUpperCase().trim();
    return gradeMap[normalized] ?? 70;
  });

  const proof = `Grade mapping: ${values.map((v, i) =>
    `P${i+1}: ${v || 'N/A'} → ${scores[i]}`
  ).join(', ')}`;

  return { scores, proof };
}

/**
 * Score: Location Desirability (walk score, transit score)
 * Formula: Direct scoring 0-100
 */
export function scoreLocationDesirability(values: number[]): { scores: number[]; proof: string } {
  const scores = values.map(v => {
    if (v == null || isNaN(v)) return 50;
    return Math.max(0, Math.min(100, v)); // Clamp to 0-100
  });

  const proof = `Direct scores (0-100): ${values.map((v, i) =>
    `P${i+1}: ${v ?? 'N/A'} → ${scores[i]}`
  ).join(', ')}`;

  return { scores, proof };
}

/**
 * Score: Financial ROI (cap rate, rental yield)
 * Formula: Higher is better with industry benchmarks
 */
export function scoreFinancialROI(values: number[], benchmarkGood: number = 8): { scores: number[]; proof: string } {
  const scores = values.map(v => {
    if (v == null || isNaN(v)) return 0;
    if (v >= benchmarkGood) return 100;
    return (v / benchmarkGood) * 100;
  });

  const proof = `Benchmark: ${benchmarkGood}%. Scores: ${values.map((v, i) =>
    `P${i+1}: ${v?.toFixed(2) || 'N/A'}% → ${scores[i].toFixed(1)}`
  ).join(', ')}`;

  return { scores, proof };
}

// ============================================================================
// FIELD WEIGHT DEFINITIONS
// ============================================================================

/**
 * Field importance weights (1-10 scale)
 * Higher weight = more important in overall score
 */
export const FIELD_WEIGHTS: Record<number, number> = {
  // GROUP 1: Address & Identity (1-9)
  1: 2,  // full_address
  2: 3,  // mls_primary
  3: 4,  // mls_secondary
  4: 2,  // street_address
  5: 2,  // city
  6: 2,  // state
  7: 2,  // zipcode
  8: 2,  // county
  9: 2,  // neighborhood

  // GROUP 2: Pricing & Value (10-16)
  10: 10, // listing_price (CRITICAL)
  11: 8,  // original_price
  12: 7,  // price_sqft
  13: 6,  // estimated_value
  14: 5,  // tax_assessed_value
  15: 4,  // last_sold_price
  16: 3,  // last_sold_date

  // GROUP 3: Property Basics (17-29)
  17: 9,  // bedrooms (CRITICAL)
  18: 9,  // bathrooms (CRITICAL)
  19: 10, // living_sqft (CRITICAL)
  20: 6,  // total_sqft
  21: 7,  // lot_size
  22: 8,  // year_built
  23: 5,  // property_type
  24: 6,  // property_subtype
  25: 4,  // stories
  26: 5,  // garage_spaces
  27: 3,  // parking_total
  28: 3,  // pool
  29: 4,  // waterfront

  // GROUP 4: HOA & Taxes (30-38)
  30: 8,  // hoa_fee (CRITICAL for investors)
  31: 6,  // hoa_fee_frequency
  32: 5,  // hoa_required
  33: 4,  // hoa_name
  34: 4,  // hoa_amenities
  35: 9,  // annual_taxes (CRITICAL)
  36: 5,  // monthly_tax
  37: 5,  // total_monthly_cost
  38: 4,  // tax_year

  // GROUP 5: Structure & Systems (39-48)
  39: 7,  // foundation_type
  40: 6,  // roof_type
  41: 6,  // roof_age
  42: 5,  // exterior_material
  43: 6,  // heating_type
  44: 6,  // cooling_type
  45: 4,  // water_heater_type
  46: 5,  // insulation_quality
  47: 5,  // window_type
  48: 4,  // construction_quality

  // GROUP 6: Interior Features (49-53)
  49: 5,  // flooring_type
  50: 4,  // kitchen_features
  51: 4,  // appliances_included
  52: 3,  // laundry_features
  53: 3,  // fireplace

  // GROUP 7: Exterior Features (54-58)
  54: 5,  // lot_features
  55: 4,  // patio_porch
  56: 4,  // fencing
  57: 3,  // landscaping
  58: 3,  // sprinkler_system

  // GROUP 8: Permits & Renovations (59-62)
  59: 7,  // recent_renovations
  60: 5,  // renovation_year
  61: 8,  // permits_current
  62: 5,  // known_issues

  // GROUP 9: Assigned Schools (63-73)
  63: 9,  // elementary_school (CRITICAL for families)
  64: 8,  // elementary_rating
  65: 3,  // elementary_distance
  66: 9,  // middle_school
  67: 8,  // middle_rating
  68: 3,  // middle_distance
  69: 10, // high_school (CRITICAL for families)
  70: 9,  // high_rating
  71: 3,  // high_distance
  72: 6,  // school_district
  73: 7,  // district_rating

  // GROUP 10: Location Scores (74-82)
  74: 9,  // walk_score (CRITICAL)
  75: 8,  // transit_score
  76: 7,  // bike_score
  77: 5,  // noise_level
  78: 6,  // air_quality_index
  79: 5,  // light_pollution
  80: 5,  // traffic_level
  81: 4,  // park_access_score
  82: 4,  // retail_access_score

  // GROUP 11: Distances & Amenities (83-87)
  83: 8,  // distance_downtown
  84: 7,  // distance_airport
  85: 8,  // distance_beach
  86: 7,  // distance_hospital
  87: 5,  // distance_grocery

  // GROUP 12: Safety & Crime (88-90)
  88: 10, // crime_rate (CRITICAL)
  89: 8,  // safety_score
  90: 7,  // police_response_time

  // GROUP 13: Market & Investment (91-103)
  91: 9,  // days_on_market
  92: 5,  // listing_status
  93: 8,  // price_history_trend
  94: 9,  // rental_estimate (CRITICAL for investors)
  95: 10, // rental_yield (CRITICAL for investors)
  96: 10, // cap_rate_est (CRITICAL for investors)
  97: 9,  // appreciation_1yr
  98: 8,  // appreciation_5yr
  99: 7,  // appreciation_10yr
  100: 6, // market_temperature
  101: 5, // inventory_level
  102: 8, // demand_score
  103: 7, // investment_score

  // GROUP 14: Utilities & Connectivity (104-116)
  104: 6, // utilities_electric
  105: 5, // utilities_gas
  106: 5, // utilities_water
  107: 4, // utilities_sewer
  108: 4, // utilities_trash
  109: 7, // internet_provider
  110: 7, // internet_speed_max
  111: 3, // cable_available
  112: 4, // fiber_available
  113: 3, // satellite_available
  114: 3, // cell_coverage
  115: 4, // smart_home_ready
  116: 3, // ev_charging

  // GROUP 15: Environment & Risk (117-130)
  117: 10, // flood_zone (CRITICAL)
  118: 9,  // flood_risk_score
  119: 9,  // fema_designation
  120: 10, // hurricane_risk (CRITICAL)
  121: 8,  // earthquake_risk
  122: 8,  // wildfire_risk
  123: 7,  // tornado_risk
  124: 6,  // storm_surge_risk
  125: 8,  // sea_level_rise_risk
  126: 6,  // subsidence_risk
  127: 5,  // radon_risk
  128: 4,  // lead_paint_risk
  129: 5,  // asbestos_risk
  130: 7,  // environmental_hazards

  // GROUP 16: Additional Features (131-138)
  131: 4, // view_type
  132: 5, // privacy_level
  133: 4, // guest_house
  134: 3, // workshop_shed
  135: 4, // boat_dock
  136: 3, // tennis_court
  137: 5, // security_system
  138: 4, // gated_community

  // GROUP 17: Parking (Stellar MLS) (139-143)
  139: 6, // parking_features
  140: 5, // garage_type
  141: 5, // carport_spaces
  142: 4, // driveway_type
  143: 3, // parking_restrictions

  // GROUP 18: Building (Stellar MLS) (144-148)
  144: 5, // building_name
  145: 4, // building_features
  146: 4, // unit_count
  147: 5, // floors_in_building
  148: 3, // elevator

  // GROUP 19: Legal (Stellar MLS) (149-154)
  149: 7, // zoning
  150: 5, // legal_description
  151: 4, // parcel_number
  152: 6, // ownership_type
  153: 5, // restrictions
  154: 5, // easements

  // GROUP 20: Waterfront (Stellar MLS) (155-159)
  155: 7, // waterfront_type
  156: 6, // waterfront_feet
  157: 5, // water_access
  158: 4, // dock_type
  159: 4, // seawall

  // GROUP 21: Leasing (Stellar MLS) (160-165)
  160: 8, // lease_restrictions
  161: 6, // rental_restrictions
  162: 5, // min_lease_days
  163: 6, // lease_approval_req
  164: 5, // tenant_occupied
  165: 4, // lease_expiration

  // GROUP 22: Features (Stellar MLS) (166-168)
  166: 4, // community_features
  167: 4, // interior_features
  168: 4, // exterior_features
};

/**
 * Section-level weights (importance of entire section)
 */
export const SECTION_WEIGHTS: Record<string, number> = {
  'Address & Identity': 3,
  'Pricing & Value': 10,
  'Property Basics': 10,
  'HOA & Taxes': 8,
  'Structure & Systems': 7,
  'Interior Features': 5,
  'Exterior Features': 4,
  'Permits & Renovations': 7,
  'Assigned Schools': 9,
  'Location Scores': 9,
  'Distances & Amenities': 7,
  'Safety & Crime': 10,
  'Market & Investment': 10,
  'Utilities & Connectivity': 5,
  'Environment & Risk': 10,
  'Additional Features': 4,
  'Parking': 5,
  'Building': 4,
  'Legal': 6,
  'Waterfront': 5,
  'Leasing': 6,
  'Features': 4,
};

// ============================================================================
// COMPREHENSIVE PROMPT BUILDER
// ============================================================================

/**
 * Build mathematical analysis prompt that forces proofs
 */
export function buildMathematicalAnalysisPrompt(
  properties: OliviaEnhancedPropertyInput[]
): string {
  if (properties.length !== 3) {
    throw new Error('Mathematical analysis requires exactly 3 properties');
  }

  return `
# OLIVIA EXECUTIVE PROPERTY ANALYSIS - MATHEMATICAL PROOF REQUIRED

You are Olivia, CLUES™ Chief Property Intelligence Officer. You are analyzing 3 competing properties across ALL 168 data fields.

## CRITICAL RULES - NO EXCEPTIONS:

1. **MATHEMATICAL PROOF REQUIRED**: Every conclusion MUST have numerical proof
2. **NO HALLUCINATIONS**: If you don't have data, say "Data unavailable" - DO NOT make up scores
3. **SHOW YOUR WORK**: Every score must show the calculation formula used
4. **COMPARATIVE ANALYSIS**: All 3 properties must be compared field-by-field
5. **WEIGHTED SCORING**: Use the provided field weights (1-10 scale)
6. **HONEST WINNER**: Only declare a winner if mathematical proof supports it

## SCORING METHODOLOGIES:

### A. Lower is Better (taxes, HOA, crime)
Formula: score = 100 - ((value - min) / (max - min)) * 100
Example: Property taxes $5k, $8k, $12k → Scores: 100, 57, 0

### B. Higher is Better (sqft, bedrooms, scores)
Formula: score = ((value - min) / (max - min)) * 100
Example: Living sqft 1500, 2000, 2500 → Scores: 0, 50, 100

### C. Closer to Ideal (year built)
Formula: Gaussian around ideal (2010 ±10 years)
Example: Years 1985, 2005, 2015 → Scores: 10, 85, 90

### D. Binary (has pool, permits)
Formula: Yes = 100, No = 0
Example: Pool: No, Yes, No → Scores: 0, 100, 0

### E. Risk Assessment (flood, hurricane)
Formula: None=100, Low=85, Moderate=60, High=35, Severe=10
Example: Flood risk: Low, Moderate, None → Scores: 85, 60, 100

### F. Quality Tier (school ratings)
Formula: A+=100, A=95, B+=87, B=83, C=73, D=63, F=50
Example: Schools: A-, B+, A → Scores: 90, 87, 95

### G. Financial ROI (cap rate, yield)
Formula: (actual / benchmark) * 100, capped at 100
Example: Cap rates 4%, 8%, 12% (benchmark 8%) → Scores: 50, 100, 100

## FIELD WEIGHTS (1-10 importance):

CRITICAL FIELDS (Weight 10):
- Field 10: listing_price
- Field 17: bedrooms
- Field 19: living_sqft
- Field 69: high_school
- Field 88: crime_rate
- Field 95: rental_yield
- Field 96: cap_rate_est
- Field 117: flood_zone
- Field 120: hurricane_risk

HIGH IMPORTANCE (Weight 9):
- Schools (elementary, middle, high)
- Walk score
- Financial metrics
- Days on market

MODERATE IMPORTANCE (Weight 6-8):
- Property condition
- Systems age
- Location amenities

LOW IMPORTANCE (Weight 1-5):
- Aesthetic features
- Minor amenities

## RESPONSE FORMAT (STRICT JSON):

You MUST return valid JSON with this exact structure:

\`\`\`json
{
  "analysisId": "unique-id",
  "investmentGrade": {
    "property1": {
      "grade": "A+",
      "score": 95.3,
      "calculation": "Weighted avg: (10*95 + 9*88 + ...) / total_weights = 95.3"
    },
    "property2": { "grade": "B+", "score": 87.1, "calculation": "..." },
    "property3": { "grade": "A-", "score": 90.2, "calculation": "..." },
    "winner": 1,
    "reasoning": "Property 1 wins with 95.3 vs 90.2 vs 87.1 due to superior..."
  },
  "fieldComparisons": [
    {
      "fieldNumber": 10,
      "fieldName": "listing_price",
      "weight": 10,
      "method": "lower_is_better",
      "property1": { "value": "$450,000", "score": 100, "calculation": "100 - ((450000-450000)/(650000-450000))*100 = 100" },
      "property2": { "value": "$550,000", "score": 50, "calculation": "..." },
      "property3": { "value": "$650,000", "score": 0, "calculation": "..." },
      "winner": 1,
      "reasoning": "Property 1 is $200k less expensive than Property 3"
    }
    // REPEAT FOR ALL 168 FIELDS
  ],
  "sectionScores": [
    {
      "sectionName": "Pricing & Value",
      "sectionWeight": 10,
      "property1": { "score": 92.5, "calculation": "Avg of fields 10-16: (100+85+90+...)/7 = 92.5" },
      "property2": { "score": 78.3, "calculation": "..." },
      "property3": { "score": 65.1, "calculation": "..." },
      "winner": 1,
      "keyFindings": ["Property 1 offers best price/sqft", "Property 3 overpriced by 18%"]
    }
    // REPEAT FOR ALL 22 SECTIONS
  ],
  "overallRecommendation": {
    "winner": 1,
    "winnerScore": 95.3,
    "runnerUp": 3,
    "runnerUpScore": 90.2,
    "scoreGap": 5.1,
    "confidence": "high",
    "reasoning": "Property 1 wins by 5.1 points due to: [list top 5 mathematical reasons]",
    "calculation": "Final scores derived from weighted section averages: P1=(10*92.5 + 9*88 + ...) / 152 = 95.3"
  },
  "keyFindings": [
    {
      "type": "critical_advantage",
      "property": 1,
      "finding": "Property 1 has 35% better cap rate (8.2% vs 6.1% vs 5.8%)",
      "impact": "high",
      "proof": "Field 96: 8.2% vs 6.1% vs 5.8% = 34.4% better than P2"
    }
    // 8-12 findings with mathematical proof
  ],
  "buyerSpecificRecommendations": {
    "investor": {
      "recommendation": 1,
      "score": 96.5,
      "reasoning": "Cap rate 8.2% + rental yield 9.1% + appreciation 4.5%/yr",
      "proof": "ROI score: (8.2/8.0)*30 + (9.1/8.0)*30 + (4.5/3.5)*20 = 96.5"
    },
    "family": {
      "recommendation": 3,
      "score": 93.2,
      "reasoning": "School ratings A+/A/A-, walkability 87, crime rate 0.3",
      "proof": "Family score: schools(95)*40 + safety(92)*30 + space(88)*30 = 93.2"
    }
  }
}
\`\`\`

## PROPERTIES TO ANALYZE:

${properties.map((p, i) => `
### PROPERTY ${i + 1}: ${p.full_address}

**GROUP 1: Address & Identity**
[1] Full Address: ${p.full_address}
[2] MLS Primary: ${p.mls_primary || 'N/A'}
[3] MLS Secondary: ${p.mls_secondary || 'N/A'}
[4] Street Address: ${p.street_address || 'N/A'}
[5] City: ${p.city || 'N/A'}
[6] State: ${p.state || 'N/A'}
[7] Zipcode: ${p.zipcode || 'N/A'}
[8] County: ${p.county || 'N/A'}
[9] Neighborhood: ${p.neighborhood || 'N/A'}

**GROUP 2: Pricing & Value** (CRITICAL WEIGHT 10)
[10] Listing Price: $${p.listing_price?.toLocaleString() || 'N/A'}
[11] Original Price: $${p.original_price?.toLocaleString() || 'N/A'}
[12] Price/Sqft: $${p.price_sqft?.toLocaleString() || 'N/A'}
[13] Estimated Value: $${p.estimated_value?.toLocaleString() || 'N/A'}
[14] Tax Assessed Value: $${p.tax_assessed_value?.toLocaleString() || 'N/A'}
[15] Last Sold Price: $${p.last_sold_price?.toLocaleString() || 'N/A'}
[16] Last Sold Date: ${p.last_sold_date || 'N/A'}

**GROUP 3: Property Basics** (CRITICAL WEIGHT 9-10)
[17] Bedrooms: ${p.bedrooms || 'N/A'}
[18] Bathrooms: ${p.bathrooms || 'N/A'}
[19] Living Sqft: ${p.living_sqft?.toLocaleString() || 'N/A'}
[20] Total Sqft: ${p.total_sqft?.toLocaleString() || 'N/A'}
[21] Lot Size: ${p.lot_size?.toLocaleString() || 'N/A'} sqft
[22] Year Built: ${p.year_built || 'N/A'}
[23] Property Type: ${p.property_type || 'N/A'}
[24] Property Subtype: ${p.property_subtype || 'N/A'}
[25] Stories: ${p.stories || 'N/A'}
[26] Garage Spaces: ${p.garage_spaces || 'N/A'}
[27] Parking Total: ${p.parking_total || 'N/A'}
[28] Pool: ${p.pool ? 'Yes' : 'No'}
[29] Waterfront: ${p.waterfront ? 'Yes' : 'No'}

**GROUP 4: HOA & Taxes** (CRITICAL WEIGHT 8-9)
[30] HOA Fee: $${p.hoa_fee?.toLocaleString() || 'N/A'}
[31] HOA Frequency: ${p.hoa_fee_frequency || 'N/A'}
[32] HOA Required: ${p.hoa_required ? 'Yes' : 'No'}
[33] HOA Name: ${p.hoa_name || 'N/A'}
[34] HOA Amenities: ${Array.isArray(p.hoa_amenities) ? p.hoa_amenities.join(', ') : p.hoa_amenities || 'N/A'}
[35] Annual Taxes: $${p.annual_taxes?.toLocaleString() || 'N/A'}
[36] Monthly Tax: $${p.monthly_tax?.toLocaleString() || 'N/A'}
[37] Total Monthly Cost: $${p.total_monthly_cost?.toLocaleString() || 'N/A'}
[38] Tax Year: ${p.tax_year || 'N/A'}

**GROUP 5: Structure & Systems** (WEIGHT 6-7)
[39] Foundation: ${p.foundation_type || 'N/A'}
[40] Roof Type: ${p.roof_type || 'N/A'}
[41] Roof Age: ${p.roof_age || 'N/A'} years
[42] Exterior Material: ${p.exterior_material || 'N/A'}
[43] Heating Type: ${p.heating_type || 'N/A'}
[44] Cooling Type: ${p.cooling_type || 'N/A'}
[45] Water Heater: ${p.water_heater_type || 'N/A'}
[46] Insulation Quality: ${p.insulation_quality || 'N/A'}
[47] Window Type: ${p.window_type || 'N/A'}
[48] Construction Quality: ${p.construction_quality || 'N/A'}

**GROUP 6: Interior Features** (WEIGHT 3-5)
[49] Flooring: ${p.flooring_type || 'N/A'}
[50] Kitchen Features: ${Array.isArray(p.kitchen_features) ? p.kitchen_features.join(', ') : p.kitchen_features || 'N/A'}
[51] Appliances: ${Array.isArray(p.appliances_included) ? p.appliances_included.join(', ') : p.appliances_included || 'N/A'}
[52] Laundry: ${p.laundry_features || 'N/A'}
[53] Fireplace: ${p.fireplace ? 'Yes' : 'No'}

**GROUP 7: Exterior Features** (WEIGHT 3-5)
[54] Lot Features: ${Array.isArray(p.lot_features) ? p.lot_features.join(', ') : p.lot_features || 'N/A'}
[55] Patio/Porch: ${p.patio_porch || 'N/A'}
[56] Fencing: ${p.fencing || 'N/A'}
[57] Landscaping: ${p.landscaping || 'N/A'}
[58] Sprinkler System: ${p.sprinkler_system ? 'Yes' : 'No'}

**GROUP 8: Permits & Renovations** (WEIGHT 5-8)
[59] Recent Renovations: ${Array.isArray(p.recent_renovations) ? p.recent_renovations.join(', ') : p.recent_renovations || 'N/A'}
[60] Renovation Year: ${p.renovation_year || 'N/A'}
[61] Permits Current: ${p.permits_current ? 'Yes' : 'No'}
[62] Known Issues: ${Array.isArray(p.known_issues) ? p.known_issues.join(', ') : p.known_issues || 'None'}

**GROUP 9: Assigned Schools** (CRITICAL WEIGHT 9-10)
[63] Elementary School: ${p.elementary_school || 'N/A'}
[64] Elementary Rating: ${p.elementary_rating || 'N/A'}
[65] Elementary Distance: ${p.elementary_distance || 'N/A'} miles
[66] Middle School: ${p.middle_school || 'N/A'}
[67] Middle Rating: ${p.middle_rating || 'N/A'}
[68] Middle Distance: ${p.middle_distance || 'N/A'} miles
[69] High School: ${p.high_school || 'N/A'}
[70] High Rating: ${p.high_rating || 'N/A'}
[71] High Distance: ${p.high_distance || 'N/A'} miles
[72] School District: ${p.school_district || 'N/A'}
[73] District Rating: ${p.district_rating || 'N/A'}

**GROUP 10: Location Scores** (CRITICAL WEIGHT 9)
[74] Walk Score: ${p.walk_score || 'N/A'}
[75] Transit Score: ${p.transit_score || 'N/A'}
[76] Bike Score: ${p.bike_score || 'N/A'}
[77] Noise Level: ${p.noise_level || 'N/A'}
[78] Air Quality Index: ${p.air_quality_index || 'N/A'}
[79] Light Pollution: ${p.light_pollution || 'N/A'}
[80] Traffic Level: ${p.traffic_level || 'N/A'}
[81] Park Access Score: ${p.park_access_score || 'N/A'}
[82] Retail Access Score: ${p.retail_access_score || 'N/A'}

**GROUP 11: Distances & Amenities** (WEIGHT 5-8)
[83] Distance to Downtown: ${p.distance_downtown || 'N/A'} miles
[84] Distance to Airport: ${p.distance_airport || 'N/A'} miles
[85] Distance to Beach: ${p.distance_beach || 'N/A'} miles
[86] Distance to Hospital: ${p.distance_hospital || 'N/A'} miles
[87] Distance to Grocery: ${p.distance_grocery || 'N/A'} miles

**GROUP 12: Safety & Crime** (CRITICAL WEIGHT 10)
[88] Crime Rate: ${p.crime_rate || 'N/A'}
[89] Safety Score: ${p.safety_score || 'N/A'}
[90] Police Response Time: ${p.police_response_time || 'N/A'} minutes

**GROUP 13: Market & Investment** (CRITICAL WEIGHT 9-10)
[91] Days on Market: ${p.days_on_market || 'N/A'}
[92] Listing Status: ${p.listing_status || 'N/A'}
[93] Price History Trend: ${p.price_history_trend || 'N/A'}
[94] Rental Estimate: $${p.rental_estimate?.toLocaleString() || 'N/A'}/month
[95] Rental Yield: ${p.rental_yield || 'N/A'}%
[96] Cap Rate Est: ${p.cap_rate_est || 'N/A'}%
[97] Appreciation 1yr: ${p.appreciation_1yr || 'N/A'}%
[98] Appreciation 5yr: ${p.appreciation_5yr || 'N/A'}%
[99] Appreciation 10yr: ${p.appreciation_10yr || 'N/A'}%
[100] Market Temperature: ${p.market_temperature || 'N/A'}
[101] Inventory Level: ${p.inventory_level || 'N/A'}
[102] Demand Score: ${p.demand_score || 'N/A'}
[103] Investment Score: ${p.investment_score || 'N/A'}

**GROUP 14: Utilities & Connectivity** (WEIGHT 3-7)
[104] Electric: ${p.utilities_electric || 'N/A'}
[105] Gas: ${p.utilities_gas || 'N/A'}
[106] Water: ${p.utilities_water || 'N/A'}
[107] Sewer: ${p.utilities_sewer || 'N/A'}
[108] Trash: ${p.utilities_trash || 'N/A'}
[109] Internet Provider: ${p.internet_provider || 'N/A'}
[110] Internet Speed Max: ${p.internet_speed_max || 'N/A'} Mbps
[111] Cable Available: ${p.cable_available ? 'Yes' : 'No'}
[112] Fiber Available: ${p.fiber_available ? 'Yes' : 'No'}
[113] Satellite Available: ${p.satellite_available ? 'Yes' : 'No'}
[114] Cell Coverage: ${p.cell_coverage || 'N/A'}
[115] Smart Home Ready: ${p.smart_home_ready ? 'Yes' : 'No'}
[116] EV Charging: ${p.ev_charging ? 'Yes' : 'No'}

**GROUP 15: Environment & Risk** (CRITICAL WEIGHT 10)
[117] Flood Zone: ${p.flood_zone || 'N/A'}
[118] Flood Risk Score: ${p.flood_risk_score || 'N/A'}
[119] FEMA Designation: ${p.fema_designation || 'N/A'}
[120] Hurricane Risk: ${p.hurricane_risk || 'N/A'}
[121] Earthquake Risk: ${p.earthquake_risk || 'N/A'}
[122] Wildfire Risk: ${p.wildfire_risk || 'N/A'}
[123] Tornado Risk: ${p.tornado_risk || 'N/A'}
[124] Storm Surge Risk: ${p.storm_surge_risk || 'N/A'}
[125] Sea Level Rise Risk: ${p.sea_level_rise_risk || 'N/A'}
[126] Subsidence Risk: ${p.subsidence_risk || 'N/A'}
[127] Radon Risk: ${p.radon_risk || 'N/A'}
[128] Lead Paint Risk: ${p.lead_paint_risk || 'N/A'}
[129] Asbestos Risk: ${p.asbestos_risk || 'N/A'}
[130] Environmental Hazards: ${Array.isArray(p.environmental_hazards) ? p.environmental_hazards.join(', ') : p.environmental_hazards || 'None'}

**GROUP 16: Additional Features** (WEIGHT 3-5)
[131] View Type: ${p.view_type || 'N/A'}
[132] Privacy Level: ${p.privacy_level || 'N/A'}
[133] Guest House: ${p.guest_house ? 'Yes' : 'No'}
[134] Workshop/Shed: ${p.workshop_shed ? 'Yes' : 'No'}
[135] Boat Dock: ${p.boat_dock ? 'Yes' : 'No'}
[136] Tennis Court: ${p.tennis_court ? 'Yes' : 'No'}
[137] Security System: ${p.security_system ? 'Yes' : 'No'}
[138] Gated Community: ${p.gated_community ? 'Yes' : 'No'}

**GROUP 17: Parking** (WEIGHT 3-6)
[139] Parking Features: ${Array.isArray(p.parking_features) ? p.parking_features.join(', ') : p.parking_features || 'N/A'}
[140] Garage Type: ${p.garage_type || 'N/A'}
[141] Carport Spaces: ${p.carport_spaces || 'N/A'}
[142] Driveway Type: ${p.driveway_type || 'N/A'}
[143] Parking Restrictions: ${p.parking_restrictions || 'None'}

**GROUP 18: Building** (WEIGHT 3-5)
[144] Building Name: ${p.building_name || 'N/A'}
[145] Building Features: ${Array.isArray(p.building_features) ? p.building_features.join(', ') : p.building_features || 'N/A'}
[146] Unit Count: ${p.unit_count || 'N/A'}
[147] Floors in Building: ${p.floors_in_building || 'N/A'}
[148] Elevator: ${p.elevator ? 'Yes' : 'No'}

**GROUP 19: Legal** (WEIGHT 4-7)
[149] Zoning: ${p.zoning || 'N/A'}
[150] Legal Description: ${p.legal_description || 'N/A'}
[151] Parcel Number: ${p.parcel_number || 'N/A'}
[152] Ownership Type: ${p.ownership_type || 'N/A'}
[153] Restrictions: ${p.restrictions || 'None'}
[154] Easements: ${p.easements || 'None'}

**GROUP 20: Waterfront** (WEIGHT 4-7)
[155] Waterfront Type: ${p.waterfront_type || 'N/A'}
[156] Waterfront Feet: ${p.waterfront_feet || 'N/A'}
[157] Water Access: ${p.water_access || 'N/A'}
[158] Dock Type: ${p.dock_type || 'N/A'}
[159] Seawall: ${p.seawall ? 'Yes' : 'No'}

**GROUP 21: Leasing** (WEIGHT 4-8)
[160] Lease Restrictions: ${p.lease_restrictions || 'None'}
[161] Rental Restrictions: ${p.rental_restrictions || 'None'}
[162] Min Lease Days: ${p.min_lease_days || 'N/A'}
[163] Lease Approval Required: ${p.lease_approval_req ? 'Yes' : 'No'}
[164] Tenant Occupied: ${p.tenant_occupied ? 'Yes' : 'No'}
[165] Lease Expiration: ${p.lease_expiration || 'N/A'}

**GROUP 22: Features** (WEIGHT 4)
[166] Community Features: ${Array.isArray(p.community_features) ? p.community_features.join(', ') : p.community_features || 'N/A'}
[167] Interior Features: ${Array.isArray(p.interior_features) ? p.interior_features.join(', ') : p.interior_features || 'N/A'}
[168] Exterior Features: ${Array.isArray(p.exterior_features) ? p.exterior_features.join(', ') : p.exterior_features || 'N/A'}

**SMART Score: ${p.smartScore}/100**
**Data Completeness: ${p.dataCompleteness}%**

`).join('\n\n---\n\n')}

## YOUR TASK:

1. Analyze ALL 168 fields across all 3 properties
2. Calculate mathematical scores for each field using the appropriate methodology
3. Show your calculation work for every score
4. Weight each field by importance (1-10 scale provided)
5. Aggregate scores by section (22 sections)
6. Calculate overall investment grades (A+ to F)
7. Declare an honest winner with mathematical proof
8. Provide buyer-specific recommendations (investor, family, retiree, vacation, first-time)
9. List 8-12 key findings with numerical proof
10. Return valid JSON matching the exact structure shown above

## REMEMBER:

- NO HALLUCINATIONS - Only use data provided
- SHOW CALCULATIONS - Every score needs a formula
- BE HONEST - If it's close, say so. If one wins by 20 points, say that too.
- USE WEIGHTS - Critical fields (weight 10) matter 10x more than minor ones (weight 1)
- PROVE WINNER - Winner must have highest weighted aggregate score across all 168 fields

Begin your mathematical analysis now. Return valid JSON only.
`;
}

// ============================================================================
// RESPONSE VALIDATION
// ============================================================================

/**
 * Validate that Claude Desktop actually did the math
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  hallucinations: string[];
}

export function validateOliviaResponse(response: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const hallucinations: string[] = [];

  // Check required structure
  if (!response.investmentGrade) {
    errors.push('Missing investmentGrade object');
  }

  if (!response.fieldComparisons || !Array.isArray(response.fieldComparisons)) {
    errors.push('Missing or invalid fieldComparisons array');
  } else {
    // Should have all 168 fields
    if (response.fieldComparisons.length < 168) {
      warnings.push(`Only ${response.fieldComparisons.length} fields analyzed, expected 168`);
    }

    // Check for hallucinations (missing calculations)
    response.fieldComparisons.forEach((field: any, index: number) => {
      if (!field.calculation || field.calculation === '') {
        hallucinations.push(`Field ${field.fieldNumber} (${field.fieldName}) missing calculation proof`);
      }

      if (!field.property1 || !field.property2 || !field.property3) {
        hallucinations.push(`Field ${field.fieldNumber} missing property data`);
      }

      if (field.property1?.score === undefined || field.property2?.score === undefined || field.property3?.score === undefined) {
        hallucinations.push(`Field ${field.fieldNumber} missing scores`);
      }
    });
  }

  if (!response.sectionScores || !Array.isArray(response.sectionScores)) {
    errors.push('Missing or invalid sectionScores array');
  } else {
    if (response.sectionScores.length < 22) {
      warnings.push(`Only ${response.sectionScores.length} sections analyzed, expected 22`);
    }

    response.sectionScores.forEach((section: any) => {
      if (!section.calculation || section.calculation === '') {
        hallucinations.push(`Section "${section.sectionName}" missing calculation proof`);
      }
    });
  }

  if (!response.overallRecommendation) {
    errors.push('Missing overallRecommendation object');
  } else {
    if (!response.overallRecommendation.calculation || response.overallRecommendation.calculation === '') {
      hallucinations.push('Overall recommendation missing calculation proof');
    }

    if (!response.overallRecommendation.winner) {
      hallucinations.push('No winner declared');
    }
  }

  if (!response.keyFindings || !Array.isArray(response.keyFindings)) {
    warnings.push('Missing key findings array');
  } else {
    response.keyFindings.forEach((finding: any, index: number) => {
      if (!finding.proof || finding.proof === '') {
        hallucinations.push(`Key finding ${index + 1} missing mathematical proof`);
      }
    });
  }

  return {
    isValid: errors.length === 0 && hallucinations.length === 0,
    errors,
    warnings,
    hallucinations,
  };
}

/**
 * Calculate expected score manually for verification
 */
export function calculateExpectedScore(
  fieldValue: any,
  competitorValues: any[],
  method: FieldScoreMethod
): { score: number; proof: string } {
  const values = [fieldValue, ...competitorValues];

  switch (method) {
    case 'lower_is_better':
      return scoreLowerIsBetter(values);
    case 'higher_is_better':
      return scoreHigherIsBetter(values);
    case 'closer_to_ideal':
      return scoreCloserToIdeal(values, 2010, 10);
    case 'binary_yes_no':
      return scoreBinary(values as boolean[]);
    case 'risk_assessment':
      return scoreRiskAssessment(values as string[]);
    case 'quality_tier':
      return scoreQualityTier(values as string[]);
    case 'location_desirability':
      return scoreLocationDesirability(values);
    case 'financial_roi':
      return scoreFinancialROI(values, 8);
    default:
      return { score: 50, proof: 'Unknown method' };
  }
}
