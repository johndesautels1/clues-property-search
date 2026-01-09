/**
 * OLIVIA MATHEMATICAL ANALYSIS ENGINE
 *
 * This module contains the mathematical scoring algorithms and validation logic
 * that forces Claude Desktop to perform honest calculations with proofs across
 * all 181 fields when comparing properties.
 *
 * CRITICAL: No hallucinations allowed - every score must have mathematical proof.
 */

import type { OliviaEnhancedPropertyInput } from '@/types/olivia-enhanced';

// ============================================================================
// PROGRESSIVE ANALYSIS - FIELD LEVEL GROUPINGS
// ============================================================================

/**
 * 4-LEVEL PROGRESSIVE ANALYSIS SYSTEM
 * Splits 181 fields into 3 sequential analysis passes + 1 final aggregation
 * Each level processes ~56 fields to stay within Claude Opus 32K token limit
 */

export const FIELD_LEVELS = {
  // LEVEL 1: Critical Decision Fields (1-56) - 56 fields
  // Most important for investment decision
  LEVEL_1: {
    name: 'Critical Decision Fields',
    fieldRange: [1, 56] as const,
    groups: [
      'Address & Identity',
      'Pricing & Value',
      'Property Basics',
      'HOA & Taxes',
      'Structure & Systems',
      'Interior Features',
      'Exterior Features' // partial - fields 54-56
    ],
    description: 'Core property attributes, pricing, structure, and critical costs'
  },

  // LEVEL 2: Important Context Fields (57-112) - 56 fields
  // Important for complete analysis
  LEVEL_2: {
    name: 'Important Context Fields',
    fieldRange: [57, 112] as const,
    groups: [
      'Exterior Features', // rest - fields 57-58
      'Permits & Renovations',
      'Assigned Schools',
      'Location Scores',
      'Distances & Amenities',
      'Safety & Crime',
      'Market & Investment Data',
      'Utilities & Connectivity' // partial - fields 104-112
    ],
    description: 'Schools, location quality, market data, and utilities'
  },

  // LEVEL 3: Remaining Fields (113-181) - 69 fields
  // Complete the picture
  LEVEL_3: {
    name: 'Remaining Fields',
    fieldRange: [113, 181] as const,
    groups: [
      'Utilities & Connectivity', // rest - fields 113-116
      'Environment & Risk',
      'Additional Features',
      'Parking Details',
      'Building Details',
      'Legal & Compliance',
      'Waterfront',
      'Leasing & Rentals',
      'Community & Features',
      'Market Performance' // fields 169-181
    ],
    description: 'Environmental risks, legal, waterfront, leasing, and additional features'
  }
} as const;

export type AnalysisLevel = 1 | 2 | 3;

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
  3: 4,  // new_construction_yn
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
  'Market Performance': 6,  // NEW Section W - fields 169-181
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

You are Olivia, CLUES™ Chief Property Intelligence Officer. You are analyzing 3 competing properties across ALL 181 data fields.

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
    // REPEAT FOR ALL 181 FIELDS
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
[3] New Construction: ${p.new_construction_yn || 'N/A'}
[4] Listing Status: ${p.listing_status || 'N/A'}
[5] Listing Date: ${p.listing_date || 'N/A'}
[6] Neighborhood: ${p.neighborhood || 'N/A'}
[7] County: ${p.county || 'N/A'}
[8] ZIP Code: ${p.zip_code || 'N/A'}
[9] Parcel ID: ${p.parcel_id || 'N/A'}

**GROUP 2: Pricing & Value** (CRITICAL WEIGHT 10)
[10] Listing Price: $${p.listing_price?.toLocaleString() || 'N/A'}
[11] Price Per Sq Ft: $${p.price_per_sqft?.toLocaleString() || 'N/A'}
[12] Market Value Estimate: $${p.market_value_estimate?.toLocaleString() || 'N/A'}
[13] Last Sale Date: ${p.last_sale_date || 'N/A'}
[14] Last Sale Price: $${p.last_sale_price?.toLocaleString() || 'N/A'}
[15] Assessed Value: $${p.assessed_value?.toLocaleString() || 'N/A'}
[16] Redfin Estimate: $${p.redfin_estimate?.toLocaleString() || 'N/A'}

**GROUP 3: Property Basics** (CRITICAL WEIGHT 9-10)
[17] Bedrooms: ${p.bedrooms || 'N/A'}
[18] Full Bathrooms: ${p.full_bathrooms || 'N/A'}
[19] Half Bathrooms: ${p.half_bathrooms || 'N/A'}
[20] Total Bathrooms: ${p.total_bathrooms || 'N/A'}
[21] Living Sq Ft: ${p.living_sqft?.toLocaleString() || 'N/A'}
[22] Total Sq Ft Under Roof: ${p.total_sqft_under_roof?.toLocaleString() || 'N/A'}
[23] Lot Size (Sq Ft): ${p.lot_size_sqft?.toLocaleString() || 'N/A'}
[24] Lot Size (Acres): ${p.lot_size_acres || 'N/A'}
[25] Year Built: ${p.year_built || 'N/A'}
[26] Property Type: ${p.property_type || 'N/A'}
[27] Stories: ${p.stories || 'N/A'}
[28] Garage Spaces: ${p.garage_spaces || 'N/A'}
[29] Parking Total: ${p.parking_total || 'N/A'}

**GROUP 4: HOA & Taxes** (CRITICAL WEIGHT 8-9)
[30] HOA: ${p.hoa_yn ? 'Yes' : 'No'}
[31] HOA Fee (Annual): $${p.hoa_fee_annual?.toLocaleString() || 'N/A'}
[32] HOA Name: ${p.hoa_name || 'N/A'}
[33] HOA Includes: ${p.hoa_includes || 'N/A'}
[34] Ownership Type: ${p.ownership_type || 'N/A'}
[35] Annual Taxes: $${p.annual_taxes?.toLocaleString() || 'N/A'}
[36] Tax Year: ${p.tax_year || 'N/A'}
[37] Property Tax Rate: ${p.property_tax_rate || 'N/A'}
[38] Tax Exemptions: ${p.tax_exemptions || 'N/A'}

**GROUP 5: Structure & Systems** (WEIGHT 6-7)
[39] Roof Type: ${p.roof_type || 'N/A'}
[40] Roof Age (Est): ${p.roof_age_est || 'N/A'}
[41] Exterior Material: ${p.exterior_material || 'N/A'}
[42] Foundation: ${p.foundation || 'N/A'}
[43] Water Heater Type: ${p.water_heater_type || 'N/A'}
[44] Garage Type: ${p.garage_type || 'N/A'}
[45] HVAC Type: ${p.hvac_type || 'N/A'}
[46] HVAC Age: ${p.hvac_age || 'N/A'}
[47] Laundry Type: ${p.laundry_type || 'N/A'}
[48] Interior Condition: ${p.interior_condition || 'N/A'}

**GROUP 6: Interior Features** (WEIGHT 3-5)
[49] Flooring Type: ${p.flooring_type || 'N/A'}
[50] Kitchen Features: ${p.kitchen_features || 'N/A'}
[51] Appliances Included: ${Array.isArray(p.appliances_included) ? p.appliances_included.join(', ') : p.appliances_included || 'N/A'}
[52] Fireplace: ${p.fireplace_yn ? 'Yes' : 'No'}
[53] Primary BR Location: ${p.primary_br_location || 'N/A'}

**GROUP 7: Exterior Features** (WEIGHT 3-5)
[54] Pool: ${p.pool_yn ? 'Yes' : 'No'}
[55] Pool Type: ${Array.isArray(p.pool_type) ? p.pool_type.join(', ') : p.pool_type || 'N/A'}
[56] Deck/Patio: ${p.deck_patio || 'N/A'}
[57] Fence: ${p.fence || 'N/A'}
[58] Landscaping: ${p.landscaping || 'N/A'}

**GROUP 8: Permits & Renovations** (WEIGHT 5-8)
[59] Recent Renovations: ${p.recent_renovations || 'N/A'}
[60] Permit History - Roof: ${p.permit_history_roof || 'N/A'}
[61] Permit History - HVAC: ${p.permit_history_hvac || 'N/A'}
[62] Permit History - Other: ${p.permit_history_other || 'N/A'}

**GROUP 9: Assigned Schools** (CRITICAL WEIGHT 9-10)
[63] School District: ${p.school_district || 'N/A'}
[64] Elevation (feet): ${p.elevation_feet || 'N/A'}
[65] Elementary School: ${p.elementary_school || 'N/A'}
[66] Elementary Rating: ${p.elementary_rating || 'N/A'}
[67] Elementary Distance (mi): ${p.elementary_distance_mi || 'N/A'}
[68] Middle School: ${p.middle_school || 'N/A'}
[69] Middle Rating: ${p.middle_rating || 'N/A'}
[70] Middle Distance (mi): ${p.middle_distance_mi || 'N/A'}
[71] High School: ${p.high_school || 'N/A'}
[72] High Rating: ${p.high_rating || 'N/A'}
[73] High Distance (mi): ${p.high_distance_mi || 'N/A'}

**GROUP 10: Location Scores** (CRITICAL WEIGHT 9)
[74] Walk Score: ${p.walk_score || 'N/A'}
[75] Transit Score: ${p.transit_score || 'N/A'}
[76] Bike Score: ${p.bike_score || 'N/A'}
[77] Safety: ${p.safety_score || 'N/A'}
[78] Noise Level: ${p.noise_level || 'N/A'}
[79] Traffic Level: ${p.traffic_level || 'N/A'}
[80] Walkability Description: ${p.walkability_description || 'N/A'}
[81] Public Transit Access: ${p.public_transit_access || 'N/A'}
[82] Commute to City Center: ${p.commute_to_city_center || 'N/A'}

**GROUP 11: Distances & Amenities** (WEIGHT 5-8)
[83] Distance to Grocery (mi): ${p.distance_grocery_mi || 'N/A'}
[84] Distance to Hospital (mi): ${p.distance_hospital_mi || 'N/A'}
[85] Distance to Airport (mi): ${p.distance_airport_mi || 'N/A'}
[86] Distance to Park (mi): ${p.distance_park_mi || 'N/A'}
[87] Distance to Beach (mi): ${p.distance_beach_mi || 'N/A'}

**GROUP 12: Safety & Crime** (CRITICAL WEIGHT 10)
[88] Violent Crime Index: ${p.violent_crime_index || 'N/A'}
[89] Property Crime Index: ${p.property_crime_index || 'N/A'}
[90] Neighborhood Safety Rating: ${p.neighborhood_safety_rating || 'N/A'}

**GROUP 13: Market & Investment** (CRITICAL WEIGHT 9-10)
[91] Median Home Price (Neighborhood): $${p.median_home_price_neighborhood?.toLocaleString() || 'N/A'}
[92] Price Per Sq Ft (Recent Avg): $${p.price_per_sqft_recent_avg?.toLocaleString() || 'N/A'}
[93] Price to Rent Ratio: ${p.price_to_rent_ratio || 'N/A'}
[94] Price vs Median %: ${p.price_vs_median_percent || 'N/A'}
[95] Days on Market (Avg): ${p.days_on_market_avg || 'N/A'}
[96] Inventory Surplus: ${p.inventory_surplus || 'N/A'}
[97] Insurance Estimate (Annual): $${p.insurance_est_annual?.toLocaleString() || 'N/A'}
[98] Rental Estimate (Monthly): $${p.rental_estimate_monthly?.toLocaleString() || 'N/A'}
[99] Rental Yield (Est): ${p.rental_yield_est || 'N/A'}%
[100] Vacancy Rate (Neighborhood): ${p.vacancy_rate_neighborhood || 'N/A'}
[101] Cap Rate (Est): ${p.cap_rate_est || 'N/A'}
[102] Financing Terms: ${p.financing_terms || 'N/A'}
[103] Comparable Sales: ${p.comparable_sales || 'N/A'}

**GROUP 14: Utilities & Connectivity** (WEIGHT 3-7)
[104] Electric Provider: ${p.electric_provider || 'N/A'}
[105] Avg Electric Bill: ${p.avg_electric_bill || 'N/A'}
[106] Water Provider: ${p.water_provider || 'N/A'}
[107] Avg Water Bill: ${p.avg_water_bill || 'N/A'}
[108] Sewer Provider: ${p.sewer_provider || 'N/A'}
[109] Natural Gas: ${p.natural_gas || 'N/A'}
[110] Trash Provider: ${p.trash_provider || 'N/A'}
[111] Internet Providers (Top 3): ${p.internet_providers_top3 || 'N/A'}
[112] Max Internet Speed: ${p.max_internet_speed || 'N/A'}
[113] Fiber Available: ${p.fiber_available || 'N/A'}
[114] Cable TV Provider: ${p.cable_tv_provider || 'N/A'}
[115] Cell Coverage Quality: ${p.cell_coverage_quality || 'N/A'}
[116] Emergency Services Distance: ${p.emergency_services_distance || 'N/A'}

**GROUP 15: Environment & Risk** (CRITICAL WEIGHT 10)
[117] Flood Zone: ${p.flood_zone || 'N/A'}
[118] Air Quality Grade: ${p.air_quality_grade || 'N/A'}
[119] Flood Zone: ${p.flood_zone || 'N/A'}
[120] Hurricane Risk: ${p.hurricane_risk || 'N/A'}
[121] Earthquake Risk: ${p.earthquake_risk || 'N/A'}
[122] Wildfire Risk: ${p.wildfire_risk || 'N/A'}
[123] Earthquake Risk: ${p.earthquake_risk || 'N/A'}
[124] Hurricane Risk: ${p.hurricane_risk || 'N/A'}
[125] Tornado Risk: ${p.tornado_risk || 'N/A'}
[126] Radon Risk: ${p.radon_risk || 'N/A'}
[127] Superfund Site Nearby: ${p.superfund_site_nearby || 'N/A'}
[128] Sea Level Rise Risk: ${p.sea_level_rise_risk || 'N/A'}
[129] Noise Level (dB Est): ${p.noise_level_db_est || 'N/A'}
[130] Solar Potential: ${p.solar_potential || 'N/A'}

**GROUP 16: Additional Features** (WEIGHT 3-5)
[131] View Type: ${p.view_type || 'N/A'}
[132] Lot Features: ${p.lot_features || 'N/A'}
[133] EV Charging: ${p.ev_charging || 'N/A'}
[134] Smart Home Features: ${p.smart_home_features || 'N/A'}
[135] Accessibility Modifications: ${p.accessibility_modifications || 'N/A'}
[136] Pet Policy: ${p.pet_policy || 'N/A'}
[137] Age Restrictions: ${p.age_restrictions || 'N/A'}
[138] Special Assessments: ${p.special_assessments || 'N/A'}

**GROUP 17: Parking Details** (WEIGHT 3-6)
[139] Carport Y/N: ${p.carport_yn ? 'Yes' : 'No'}
[140] Carport Spaces: ${p.carport_spaces || 'N/A'}
[141] Garage Attached Y/N: ${p.garage_attached_yn ? 'Yes' : 'No'}
[142] Parking Features: ${Array.isArray(p.parking_features) ? p.parking_features.join(', ') : p.parking_features || 'N/A'}
[143] Assigned Parking Spaces: ${p.assigned_parking_spaces || 'N/A'}

**GROUP 18: Building Details** (WEIGHT 3-5)
[144] Floor Number: ${p.floor_number || 'N/A'}
[145] Building Total Floors: ${p.building_total_floors || 'N/A'}
[146] Building Name/Number: ${p.building_name_number || 'N/A'}
[147] Building Elevator Y/N: ${p.building_elevator_yn ? 'Yes' : 'No'}
[148] Floors in Unit: ${p.floors_in_unit || 'N/A'}

**GROUP 19: Legal & Compliance** (WEIGHT 4-7)
[149] Subdivision Name: ${p.subdivision_name || 'N/A'}
[150] Legal Description: ${p.legal_description || 'N/A'}
[151] Homestead Exemption: ${p.homestead_yn ? 'Yes' : 'No'}
[152] CDD Y/N: ${p.cdd_yn ? 'Yes' : 'No'}
[153] Annual CDD Fee: $${p.annual_cdd_fee?.toLocaleString() || 'N/A'}
[154] Front Exposure: ${p.front_exposure || 'N/A'}

**GROUP 20: Waterfront** (WEIGHT 4-7)
[155] Water Frontage Y/N: ${p.water_frontage_yn ? 'Yes' : 'No'}
[156] Waterfront Feet: ${p.waterfront_feet || 'N/A'}
[157] Water Access Y/N: ${p.water_access_yn ? 'Yes' : 'No'}
[158] Water View Y/N: ${p.water_view_yn ? 'Yes' : 'No'}
[159] Water Body Name: ${p.water_body_name || 'N/A'}

**GROUP 21: Leasing & Rentals** (WEIGHT 4-8)
[160] Can Be Leased Y/N: ${p.can_be_leased_yn ? 'Yes' : 'No'}
[161] Minimum Lease Period: ${p.minimum_lease_period || 'N/A'}
[162] Lease Restrictions Y/N: ${p.lease_restrictions_yn ? 'Yes' : 'No'}
[163] Pet Size Limit: ${p.pet_size_limit || 'N/A'}
[164] Max Pet Weight (lbs): ${p.max_pet_weight || 'N/A'}
[165] Association Approval Req: ${p.association_approval_yn ? 'Yes' : 'No'}

**GROUP 22: Features** (WEIGHT 4)
[166] Community Features: ${Array.isArray(p.community_features) ? p.community_features.join(', ') : p.community_features || 'N/A'}
[167] Interior Features: ${Array.isArray(p.interior_features) ? p.interior_features.join(', ') : p.interior_features || 'N/A'}
[168] Exterior Features: ${Array.isArray(p.exterior_features) ? p.exterior_features.join(', ') : p.exterior_features || 'N/A'}

**SMART Score: ${p.smartScore}/100**
**Data Completeness: ${p.dataCompleteness}%**

`).join('\n\n---\n\n')}

## YOUR TASK:

1. Analyze ALL 181 fields across all 3 properties
2. Calculate mathematical scores for each field using the appropriate methodology
3. Show your calculation work for every score
4. Weight each field by importance (1-10 scale provided)
5. Aggregate scores by section (23 sections)
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
- PROVE WINNER - Winner must have highest weighted aggregate score across all 181 fields

Begin your mathematical analysis now. Return valid JSON only.
`;
}

// ============================================================================
// PROGRESSIVE ANALYSIS - LEVEL-BASED PROMPTS
// ============================================================================

/**
 * Helper: Filter property fields by field number range
 */
function filterPropertyFields(property: OliviaEnhancedPropertyInput, startField: number, endField: number): string {
  const fieldMap: Record<number, { key: keyof OliviaEnhancedPropertyInput; label: string }> = {
    1: { key: 'full_address', label: 'Full Address' },
    2: { key: 'mls_primary', label: 'MLS Primary' },
    3: { key: 'new_construction_yn', label: 'New Construction' },
    4: { key: 'listing_status', label: 'Listing Status' },
    5: { key: 'listing_date', label: 'Listing Date' },
    6: { key: 'neighborhood', label: 'Neighborhood' },
    7: { key: 'county', label: 'County' },
    8: { key: 'zip_code', label: 'ZIP Code' },
    9: { key: 'parcel_id', label: 'Parcel ID' },
    10: { key: 'listing_price', label: 'Listing Price' },
    11: { key: 'price_per_sqft', label: 'Price Per Sq Ft' },
    12: { key: 'market_value_estimate', label: 'Market Value Estimate' },
    13: { key: 'last_sale_date', label: 'Last Sale Date' },
    14: { key: 'last_sale_price', label: 'Last Sale Price' },
    15: { key: 'assessed_value', label: 'Assessed Value' },
    16: { key: 'redfin_estimate', label: 'Redfin Estimate' },
    17: { key: 'bedrooms', label: 'Bedrooms' },
    18: { key: 'full_bathrooms', label: 'Full Bathrooms' },
    19: { key: 'half_bathrooms', label: 'Half Bathrooms' },
    20: { key: 'total_bathrooms', label: 'Total Bathrooms' },
    21: { key: 'living_sqft', label: 'Living Sq Ft' },
    22: { key: 'total_sqft_under_roof', label: 'Total Sq Ft Under Roof' },
    23: { key: 'lot_size_sqft', label: 'Lot Size (Sq Ft)' },
    24: { key: 'lot_size_acres', label: 'Lot Size (Acres)' },
    25: { key: 'year_built', label: 'Year Built' },
    26: { key: 'property_type', label: 'Property Type' },
    27: { key: 'stories', label: 'Stories' },
    28: { key: 'garage_spaces', label: 'Garage Spaces' },
    29: { key: 'parking_total', label: 'Parking Total' },
    30: { key: 'hoa_yn', label: 'HOA' },
    31: { key: 'hoa_fee_annual', label: 'HOA Fee (Annual)' },
    32: { key: 'hoa_name', label: 'HOA Name' },
    33: { key: 'hoa_includes', label: 'HOA Includes' },
    34: { key: 'ownership_type', label: 'Ownership Type' },
    35: { key: 'annual_taxes', label: 'Annual Taxes' },
    36: { key: 'tax_year', label: 'Tax Year' },
    37: { key: 'property_tax_rate', label: 'Property Tax Rate' },
    38: { key: 'tax_exemptions', label: 'Tax Exemptions' },
    39: { key: 'roof_type', label: 'Roof Type' },
    40: { key: 'roof_age_est', label: 'Roof Age (Est)' },
    41: { key: 'exterior_material', label: 'Exterior Material' },
    42: { key: 'foundation', label: 'Foundation' },
    43: { key: 'water_heater_type', label: 'Water Heater Type' },
    44: { key: 'garage_type', label: 'Garage Type' },
    45: { key: 'hvac_type', label: 'HVAC Type' },
    46: { key: 'hvac_age', label: 'HVAC Age' },
    47: { key: 'laundry_type', label: 'Laundry Type' },
    48: { key: 'interior_condition', label: 'Interior Condition' },
    49: { key: 'flooring_type', label: 'Flooring Type' },
    50: { key: 'kitchen_features', label: 'Kitchen Features' },
    51: { key: 'appliances_included', label: 'Appliances Included' },
    52: { key: 'fireplace_yn', label: 'Fireplace' },
    53: { key: 'primary_br_location', label: 'Primary BR Location' },
    54: { key: 'pool_yn', label: 'Pool' },
    55: { key: 'pool_type', label: 'Pool Type' },
    56: { key: 'deck_patio', label: 'Deck/Patio' },
    57: { key: 'fence', label: 'Fence' },
    58: { key: 'landscaping', label: 'Landscaping' },
    59: { key: 'recent_renovations', label: 'Recent Renovations' },
    60: { key: 'permit_history_roof', label: 'Permit History - Roof' },
    61: { key: 'permit_history_hvac', label: 'Permit History - HVAC' },
    62: { key: 'permit_history_other', label: 'Permit History - Other' },
    63: { key: 'school_district', label: 'School District' },
    64: { key: 'elevation_feet', label: 'Elevation (feet)' },
    65: { key: 'elementary_school', label: 'Elementary School' },
    66: { key: 'elementary_rating', label: 'Elementary Rating' },
    67: { key: 'elementary_distance_mi', label: 'Elementary Distance (mi)' },
    68: { key: 'middle_school', label: 'Middle School' },
    69: { key: 'middle_rating', label: 'Middle Rating' },
    70: { key: 'middle_distance_mi', label: 'Middle Distance (mi)' },
    71: { key: 'high_school', label: 'High School' },
    72: { key: 'high_rating', label: 'High Rating' },
    73: { key: 'high_distance_mi', label: 'High Distance (mi)' },
    74: { key: 'walk_score', label: 'Walk Score' },
    75: { key: 'transit_score', label: 'Transit Score' },
    76: { key: 'bike_score', label: 'Bike Score' },
    77: { key: 'safety_score', label: 'Safety' },
    78: { key: 'noise_level', label: 'Noise Level' },
    79: { key: 'traffic_level', label: 'Traffic Level' },
    80: { key: 'walkability_description', label: 'Walkability Description' },
    81: { key: 'public_transit_access', label: 'Public Transit Access' },
    82: { key: 'commute_to_city_center', label: 'Commute to City Center' },
    83: { key: 'distance_grocery_mi', label: 'Distance to Grocery (mi)' },
    84: { key: 'distance_hospital_mi', label: 'Distance to Hospital (mi)' },
    85: { key: 'distance_airport_mi', label: 'Distance to Airport (mi)' },
    86: { key: 'distance_park_mi', label: 'Distance to Park (mi)' },
    87: { key: 'distance_beach_mi', label: 'Distance to Beach (mi)' },
    88: { key: 'violent_crime_index', label: 'Violent Crime Index' },
    89: { key: 'property_crime_index', label: 'Property Crime Index' },
    90: { key: 'neighborhood_safety_rating', label: 'Neighborhood Safety Rating' },
    91: { key: 'median_home_price_neighborhood', label: 'Median Home Price (Neighborhood)' },
    92: { key: 'price_per_sqft_recent_avg', label: 'Price Per Sq Ft (Recent Avg)' },
    93: { key: 'price_to_rent_ratio', label: 'Price to Rent Ratio' },
    94: { key: 'price_vs_median_percent', label: 'Price vs Median %' },
    95: { key: 'days_on_market_avg', label: 'Days on Market (Avg)' },
    96: { key: 'inventory_surplus', label: 'Inventory Surplus' },
    97: { key: 'insurance_est_annual', label: 'Insurance Estimate (Annual)' },
    98: { key: 'rental_estimate_monthly', label: 'Rental Estimate (Monthly)' },
    99: { key: 'rental_yield_est', label: 'Rental Yield (Est)' },
    100: { key: 'vacancy_rate_neighborhood', label: 'Vacancy Rate (Neighborhood)' },
    101: { key: 'cap_rate_est', label: 'Cap Rate (Est)' },
    102: { key: 'financing_terms', label: 'Financing Terms' },
    103: { key: 'comparable_sales', label: 'Comparable Sales' },
    104: { key: 'electric_provider', label: 'Electric Provider' },
    105: { key: 'avg_electric_bill', label: 'Avg Electric Bill' },
    106: { key: 'water_provider', label: 'Water Provider' },
    107: { key: 'avg_water_bill', label: 'Avg Water Bill' },
    108: { key: 'sewer_provider', label: 'Sewer Provider' },
    109: { key: 'natural_gas', label: 'Natural Gas' },
    110: { key: 'trash_provider', label: 'Trash Provider' },
    111: { key: 'internet_providers_top3', label: 'Internet Providers (Top 3)' },
    112: { key: 'max_internet_speed', label: 'Max Internet Speed' },
    113: { key: 'fiber_available', label: 'Fiber Available' },
    114: { key: 'cable_tv_provider', label: 'Cable TV Provider' },
    115: { key: 'cell_coverage_quality', label: 'Cell Coverage Quality' },
    116: { key: 'emergency_services_distance', label: 'Emergency Services Distance' },
    117: { key: 'air_quality_index', label: 'Air Quality Index' },
    118: { key: 'air_quality_grade', label: 'Air Quality Grade' },
    119: { key: 'flood_zone', label: 'Flood Zone' },
    120: { key: 'flood_risk_level', label: 'Flood Risk Level' },
    121: { key: 'climate_risk', label: 'Climate Risk' },
    122: { key: 'wildfire_risk', label: 'Wildfire Risk' },
    123: { key: 'earthquake_risk', label: 'Earthquake Risk' },
    124: { key: 'hurricane_risk', label: 'Hurricane Risk' },
    125: { key: 'tornado_risk', label: 'Tornado Risk' },
    126: { key: 'radon_risk', label: 'Radon Risk' },
    127: { key: 'superfund_site_nearby', label: 'Superfund Site Nearby' },
    128: { key: 'sea_level_rise_risk', label: 'Sea Level Rise Risk' },
    129: { key: 'noise_level_db_est', label: 'Noise Level (dB Est)' },
    130: { key: 'solar_potential', label: 'Solar Potential' },
    131: { key: 'view_type', label: 'View Type' },
    132: { key: 'lot_features', label: 'Lot Features' },
    133: { key: 'ev_charging', label: 'EV Charging' },
    134: { key: 'smart_home_features', label: 'Smart Home Features' },
    135: { key: 'accessibility_modifications', label: 'Accessibility Modifications' },
    136: { key: 'pet_policy', label: 'Pet Policy' },
    137: { key: 'age_restrictions', label: 'Age Restrictions' },
    138: { key: 'special_assessments', label: 'Special Assessments' },
    139: { key: 'carport_yn', label: 'Carport Y/N' },
    140: { key: 'carport_spaces', label: 'Carport Spaces' },
    141: { key: 'garage_attached_yn', label: 'Garage Attached Y/N' },
    142: { key: 'parking_features', label: 'Parking Features' },
    143: { key: 'assigned_parking_spaces', label: 'Assigned Parking Spaces' },
    144: { key: 'floor_number', label: 'Floor Number' },
    145: { key: 'building_total_floors', label: 'Building Total Floors' },
    146: { key: 'building_name_number', label: 'Building Name/Number' },
    147: { key: 'building_elevator_yn', label: 'Building Elevator Y/N' },
    148: { key: 'floors_in_unit', label: 'Floors in Unit' },
    149: { key: 'subdivision_name', label: 'Subdivision Name' },
    150: { key: 'legal_description', label: 'Legal Description' },
    151: { key: 'homestead_yn', label: 'Homestead Exemption' },
    152: { key: 'cdd_yn', label: 'CDD Y/N' },
    153: { key: 'annual_cdd_fee', label: 'Annual CDD Fee' },
    154: { key: 'front_exposure', label: 'Front Exposure' },
    155: { key: 'water_frontage_yn', label: 'Water Frontage Y/N' },
    156: { key: 'waterfront_feet', label: 'Waterfront Feet' },
    157: { key: 'water_access_yn', label: 'Water Access Y/N' },
    158: { key: 'water_view_yn', label: 'Water View Y/N' },
    159: { key: 'water_body_name', label: 'Water Body Name' },
    160: { key: 'can_be_leased_yn', label: 'Can Be Leased Y/N' },
    161: { key: 'minimum_lease_period', label: 'Minimum Lease Period' },
    162: { key: 'lease_restrictions_yn', label: 'Lease Restrictions Y/N' },
    163: { key: 'pet_size_limit', label: 'Pet Size Limit' },
    164: { key: 'max_pet_weight', label: 'Max Pet Weight (lbs)' },
    165: { key: 'association_approval_yn', label: 'Association Approval Req' },
    166: { key: 'community_features', label: 'Community Features' },
    167: { key: 'interior_features', label: 'Interior Features' },
    168: { key: 'exterior_features', label: 'Exterior Features' }
  };

  let output = '';
  for (let fieldNum = startField; fieldNum <= endField; fieldNum++) {
    const fieldDef = fieldMap[fieldNum];
    if (!fieldDef) continue;

    const value = property[fieldDef.key];
    const displayValue = value !== undefined && value !== null
      ? (typeof value === 'number' ? value.toLocaleString() :
         Array.isArray(value) ? value.join(', ') :
         typeof value === 'boolean' ? (value ? 'Yes' : 'No') :
         String(value))
      : 'N/A';

    output += `[${fieldNum}] ${fieldDef.label}: ${displayValue}\n`;
  }

  return output;
}

/**
 * Build prompt for Level 1, 2, or 3 analysis
 * Each level analyzes ~56 fields with FULL mathematical proofs
 */
export function buildLevelPrompt(
  properties: OliviaEnhancedPropertyInput[],
  level: AnalysisLevel
): string {
  if (properties.length !== 3) {
    throw new Error('Progressive analysis requires exactly 3 properties');
  }

  const levelConfig = level === 1 ? FIELD_LEVELS.LEVEL_1 :
                      level === 2 ? FIELD_LEVELS.LEVEL_2 :
                      FIELD_LEVELS.LEVEL_3;

  const [startField, endField] = levelConfig.fieldRange;
  const fieldCount = endField - startField + 1;

  return `
# OLIVIA PROGRESSIVE ANALYSIS - LEVEL ${level} of 3

You are Olivia, CLUES™ Chief Property Intelligence Officer. You are analyzing 3 properties.

**THIS IS LEVEL ${level}: ${levelConfig.name}**
**Fields ${startField}-${endField} (${fieldCount} fields)**
**Focus:** ${levelConfig.description}

## CRITICAL RULES:

1. **MATHEMATICAL PROOF REQUIRED**: Every conclusion MUST have numerical proof
2. **NO HALLUCINATIONS**: If you don't have data, say "Data unavailable" - DO NOT guess
3. **SHOW YOUR WORK**: Every score must show the calculation formula
4. **COMPARATIVE ANALYSIS**: All 3 properties compared field-by-field
5. **WEIGHTED SCORING**: Use appropriate methodology for each field type

## SCORING METHODOLOGIES:

### A. Lower is Better (taxes, HOA, crime)
Formula: score = 100 - ((value - min) / (max - min)) * 100
Example: Taxes $5k, $8k, $12k → Scores: 100, 57, 0

### B. Higher is Better (sqft, bedrooms, scores)
Formula: score = ((value - min) / (max - min)) * 100
Example: Sqft 1500, 2000, 2500 → Scores: 0, 50, 100

### C. Closer to Ideal (year built)
Formula: Gaussian around ideal (2010 ±10 years)

### D. Binary (has pool, permits)
Formula: Yes = 100, No = 0

### E. Risk Assessment (flood, hurricane)
Formula: None=100, Low=85, Moderate=60, High=35, Severe=10

### F. Quality Tier (school ratings)
Formula: A+=100, A=95, B+=87, B=83, C=73, D=63, F=50

### G. Financial ROI (cap rate, yield)
Formula: (actual / benchmark) * 100, capped at 100

## RESPONSE FORMAT (STRICT JSON):

Return ONLY this JSON structure:

\`\`\`json
{
  "level": ${level},
  "fieldRange": [${startField}, ${endField}],
  "fieldComparisons": [
    {
      "fieldNumber": ${startField},
      "fieldName": "field_name",
      "property1": { "value": "...", "score": 95, "calculation": "100 - ((value-min)/(max-min))*100 = 95" },
      "property2": { "value": "...", "score": 78, "calculation": "..." },
      "property3": { "value": "...", "score": 65, "calculation": "..." },
      "winner": 1,
      "reasoning": "Property 1 wins because..."
    }
    // REPEAT FOR ALL ${fieldCount} FIELDS (${startField}-${endField})
  ]
}
\`\`\`

## PROPERTIES TO ANALYZE:

${properties.map((p, i) => `
### PROPERTY ${i + 1}: ${p.full_address}

${filterPropertyFields(p, startField, endField)}

**SMART Score: ${p.smartScore}/100**
**Data Completeness: ${p.dataCompleteness}%**
`).join('\n---\n')}

## YOUR TASK:

1. Analyze fields ${startField}-${endField} across all 3 properties
2. Calculate mathematical scores using appropriate methodology
3. Show calculation work for EVERY score
4. Declare winner for each field with proof
5. Return valid JSON matching structure above

**REMEMBER:** NO HALLUCINATIONS. Only use provided data. Show all calculations.

Begin Level ${level} analysis now. Return valid JSON only.
`;
}

/**
 * Build Level 4 aggregation prompt
 * Combines results from Levels 1-3 into final analysis
 */
export function buildAggregationPrompt(
  properties: OliviaEnhancedPropertyInput[],
  level1Results: any,
  level2Results: any,
  level3Results: any
): string {
  if (properties.length !== 3) {
    throw new Error('Aggregation requires exactly 3 properties');
  }

  // Combine all field comparisons
  const allFieldComparisons = [
    ...(level1Results.fieldComparisons || []),
    ...(level2Results.fieldComparisons || []),
    ...(level3Results.fieldComparisons || [])
  ];

  // Create concise summary of field results (property-level averages)
  const calculatePropertyAverage = (propNum: number) => {
    const scores = allFieldComparisons
      .map((fc: any) => fc[`property${propNum}`]?.score)
      .filter((s: any) => s !== undefined && !isNaN(s));
    return scores.length > 0
      ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1)
      : 'N/A';
  };

  return `
# OLIVIA FINAL AGGREGATION - LEVEL 4 of 4

You are Olivia, CLUES™ Chief Property Intelligence Officer.

**THIS IS THE FINAL AGGREGATION LEVEL**

You have received detailed mathematical analysis for ALL 181 fields across 3 properties.

## YOUR INPUT DATA:

**Level 1 Results:** ${level1Results.fieldComparisons?.length || 0} fields analyzed (Critical Decision Fields)
**Level 2 Results:** ${level2Results.fieldComparisons?.length || 0} fields analyzed (Important Context Fields)
**Level 3 Results:** ${level3Results.fieldComparisons?.length || 0} fields analyzed (Remaining Fields)
**Total Fields:** ${allFieldComparisons.length} complete field comparisons

## PROPERTIES:

${properties.map((p, i) => `
**Property ${i + 1}:** ${p.full_address}
- Listing Price: $${p.listing_price?.toLocaleString() || 'N/A'}
- ${p.bedrooms} bed, ${p.total_bathrooms} bath, ${p.living_sqft?.toLocaleString() || 'N/A'} sqft
- SMART Score: ${p.smartScore}/100
- Average Field Score: ${calculatePropertyAverage(i + 1)}/100
`).join('\n')}

## FIELD ANALYSIS SUMMARY:

I have analyzed ALL 181 fields with complete mathematical proofs.

**Property 1 Average:** ${calculatePropertyAverage(1)}/100 across ${allFieldComparisons.length} fields
**Property 2 Average:** ${calculatePropertyAverage(2)}/100 across ${allFieldComparisons.length} fields
**Property 3 Average:** ${calculatePropertyAverage(3)}/100 across ${allFieldComparisons.length} fields

**NOTE:** You do NOT need to return fieldComparisons in your response - I already have all 181 complete field analyses from Levels 1-3. Your job is ONLY to aggregate them into sections and provide final recommendations.

## YOUR TASK:

Using the complete field analysis above, calculate:

1. **23 Section Scores** - Aggregate field scores by section with weighted averages
2. **Overall Investment Grades** - A+ to F for each property
3. **Winner Declaration** - Determine mathematical winner across all 181 fields
4. **Buyer-Specific Recommendations** - Investor, Family, Retiree, Vacation, First-Time
5. **Key Findings** - 8-12 findings with mathematical proof
6. **Executive Summary** - Final recommendation with confidence level

## SECTION GROUPS (23 sections):

1. Address & Identity (Fields 1-9)
2. Pricing & Value (Fields 10-16)
3. Property Basics (Fields 17-29)
4. HOA & Taxes (Fields 30-38)
5. Structure & Systems (Fields 39-48)
6. Interior Features (Fields 49-53)
7. Exterior Features (Fields 54-58)
8. Permits & Renovations (Fields 59-62)
9. Assigned Schools (Fields 63-73)
10. Location Scores (Fields 74-82)
11. Distances & Amenities (Fields 83-87)
12. Safety & Crime (Fields 88-90)
13. Market & Investment (Fields 91-103)
14. Utilities & Connectivity (Fields 104-116)
15. Environment & Risk (Fields 117-130)
16. Additional Features (Fields 131-138)
17. Parking Details (Fields 139-143)
18. Building Details (Fields 144-148)
19. Legal & Compliance (Fields 149-154)
20. Waterfront (Fields 155-159)
21. Leasing & Rentals (Fields 160-165)
22. Community & Features (Fields 166-168)

## SECTION WEIGHTS (1-10):

- **Weight 10 (Critical):** Pricing & Value, Property Basics, Schools, Safety, Market & Investment, Environment & Risk
- **Weight 9 (High):** HOA & Taxes, Location Scores, Structure & Systems
- **Weight 6-8 (Moderate):** Permits, Utilities, Legal, Waterfront
- **Weight 1-5 (Low):** Features, Parking, Building, Leasing

## RESPONSE FORMAT (STRICT JSON):

\`\`\`json
{
  "investmentGrade": {
    "overallGrade": "A+",
    "overallScore": 92.5,
    "confidence": 95,
    "valueScore": 88,
    "locationScore": 94,
    "conditionScore": 91,
    "investmentScore": 93,
    "riskScore": 15,
    "summary": "Exceptional investment opportunity with strong fundamentals across all categories."
  },
  "sectionAnalysis": [
    {
      "sectionId": "pricing-value",
      "sectionName": "Pricing & Value",
      "sectionNumber": 2,
      "grade": "A",
      "score": 88.5,
      "confidence": 95,
      "keyFindings": [
        "Property 1 offers best price per sqft at $245",
        "Property 3 overpriced by 18% vs market comparables",
        "All properties show positive appreciation potential"
      ],
      "strengths": [
        "Property 1: Exceptional value proposition",
        "Property 2: Competitive pricing for prime location"
      ],
      "concerns": [
        "Property 3: High price/sqft ratio may limit buyer pool",
        "Property 2: Limited price appreciation in past 12 months"
      ],
      "visualData": {
        "type": "bar",
        "data": {
          "labels": ["Property 1", "Property 2", "Property 3"],
          "values": [92.5, 78.3, 65.1],
          "metric": "Price/Value Score"
        }
      },
      "fieldsAnalyzed": [10, 11, 12, 13, 14, 15, 16],
      "fieldCount": 7,
      "fieldsWithData": 7,
      "completeness": 100
    }
    // REPEAT FOR ALL 22 SECTIONS
  ],
  "propertyRankings": [
    {
      "rank": 1,
      "propertyId": "property-1-id",
      "overallScore": 92.5,
      "grade": "A+",
      "pros": [
        "Best price per square foot",
        "Superior school district ratings",
        "Low property tax burden"
      ],
      "cons": [
        "Older HVAC system needs replacement soon",
        "Smaller lot size compared to Property 3"
      ]
    },
    {
      "rank": 2,
      "propertyId": "property-2-id",
      "overallScore": 87.3,
      "grade": "B+",
      "pros": ["Prime location", "Modern appliances"],
      "cons": ["Higher HOA fees", "Limited parking"]
    },
    {
      "rank": 3,
      "propertyId": "property-3-id",
      "overallScore": 81.2,
      "grade": "B",
      "pros": ["Largest lot size", "Recent renovations"],
      "cons": ["Overpriced for area", "Higher annual taxes"]
    }
  ],
  "keyFindings": [
    {
      "category": "strength",
      "title": "Property 1 Offers Superior Investment Returns",
      "description": "Property 1 demonstrates a 35% better cap rate and stronger cash flow potential compared to alternatives.",
      "impact": "high",
      "fields": [91, 92, 101, 102]
    },
    {
      "category": "concern",
      "title": "Property 3 Pricing Risk",
      "description": "Property 3 is priced 18% above market comparables, creating downward price pressure risk.",
      "impact": "high",
      "fields": [10, 11, 93, 94]
    },
    {
      "category": "opportunity",
      "title": "Strong School District Advantage",
      "description": "All three properties benefit from top-rated school district, supporting long-term value.",
      "impact": "medium",
      "fields": [63, 64, 65, 66, 67]
    }
    // 6-8 total findings
  ],
  "verbalAnalysis": {
    "executiveSummary": "After analyzing all 168 data points across these three properties, I've identified Property 1 as the clear winner with an A+ investment grade. It offers exceptional value at $245 per square foot, superior school ratings, and the lowest total cost of ownership. While Property 3 has attractive features like a larger lot, it's overpriced by 18% relative to market comparables. Property 2 occupies the middle ground with a prime location but higher HOA fees. My recommendation is Property 1 for investors seeking strong returns and families prioritizing value and schools.",
    "propertyAnalysis": [
      {
        "propertyId": "property-1-id",
        "verbalSummary": "Property 1 stands out as the most compelling investment opportunity. With a price of just $245 per square foot, it's 22% below market average while offering superior fundamentals. The school district ranks in the top 10% statewide, and the neighborhood shows consistent 5% annual appreciation. The main consideration is the HVAC system age, which will require replacement within 3 years at an estimated cost of $8,000.",
        "topStrengths": [
          "Exceptional price-to-value ratio",
          "Top-tier school district",
          "Strong historical appreciation",
          "Low property taxes"
        ],
        "topConcerns": [
          "HVAC system nearing end of life",
          "Smaller lot size than Property 3"
        ]
      },
      {
        "propertyId": "property-2-id",
        "verbalSummary": "Property 2 offers a solid middle-ground option with its prime downtown location and modern updates. However, the $425 monthly HOA fee significantly impacts cash flow for investors. For families prioritizing walkability and urban amenities, this could be the right choice despite the premium pricing.",
        "topStrengths": [
          "Prime urban location",
          "Modern appliances and finishes",
          "Low maintenance exterior"
        ],
        "topConcerns": [
          "High HOA fees reduce investor returns",
          "Limited parking availability",
          "Slower appreciation than suburban areas"
        ]
      },
      {
        "propertyId": "property-3-id",
        "verbalSummary": "Property 3 boasts the largest lot and recent kitchen renovations, but the pricing presents a significant concern. At $315 per square foot, it's 18% above comparable sales in the area. Unless the seller is willing to negotiate, this property carries meaningful downside risk.",
        "topStrengths": [
          "Largest lot size at 0.35 acres",
          "Recently renovated kitchen ($45K value)",
          "Excellent curb appeal"
        ],
        "topConcerns": [
          "Overpriced relative to comps",
          "Highest annual property taxes",
          "May struggle to sell if market softens"
        ]
      }
    ],
    "comparisonInsights": "The three properties represent distinct value propositions: Property 1 is the value leader with strong fundamentals, Property 2 trades premium pricing for location convenience, and Property 3 offers space and upgrades at a questionable price point. The gap between Property 1's A+ grade (92.5) and Property 3's B grade (81.2) is significant at 11.3 points, driven primarily by pricing efficiency and total cost of ownership differences.",
    "topRecommendation": {
      "propertyId": "property-1-id",
      "reasoning": "Property 1 delivers the optimal combination of value, quality schools, and investment fundamentals. While it requires an HVAC upgrade in the near term, the $8,000 cost is more than offset by the $65,000 savings versus Property 3's asking price. For both investors and families, this property offers the highest probability of satisfaction and financial success.",
      "confidence": 92
    }
  },
  "decisionRecommendations": [
    {
      "buyerProfile": "investor",
      "recommendation": {
        "action": "highly-recommend",
        "reasoning": "Property 1 offers 8.2% cap rate and $1,850 monthly cash flow, significantly outperforming alternatives.",
        "confidence": 95
      },
      "keyConsiderations": [
        "Budget for HVAC replacement in year 2-3",
        "Strong rental demand in school district",
        "Low property tax burden enhances ROI"
      ],
      "financialAnalysis": {
        "upfrontCosts": 92000,
        "monthlyCosts": 2150,
        "expectedROI": 14.5,
        "breakEvenYears": 4.2
      },
      "immediateActions": [
        "Schedule professional HVAC inspection",
        "Request seller credit for system replacement",
        "Verify rental comps in neighborhood"
      ],
      "dueDiligenceChecklist": [
        "Review HOA bylaws on rental restrictions",
        "Confirm school district boundaries",
        "Inspect foundation and roof condition"
      ]
    }
    // Add for: family, retiree, vacation, first-time
  ]
}
\`\`\`

## CRITICAL REQUIREMENTS:

1. **sectionAnalysis** - ALL 23 sections with complete structure (sectionId, sectionNumber, grade, score, confidence, keyFindings, strengths, concerns, visualData, fieldsAnalyzed, fieldCount, fieldsWithData, completeness)
2. **investmentGrade** - Single aggregate grade (NOT per-property), with component scores
3. **propertyRankings** - Rank all 3 properties (1st, 2nd, 3rd) with pros/cons
4. **keyFindings** - 6-8 findings with category, title, description, impact, field numbers
5. **verbalAnalysis** - Complete executive summary and per-property analysis
6. **decisionRecommendations** - For all 5 buyer types (investor, family, retiree, vacation, first-time)
7. **visualData.type** - Use: bar, donut, gauge, radar, heatmap, or line (choose best for each section)
8. **Calculations** - Show mathematical proof for scores (aggregate from individual field scores)
9. DO NOT include fieldComparisons in your response (I will add them automatically)
10. Return ONLY valid JSON matching the structure above

Begin final aggregation now. Return valid JSON only.
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
    // Should have all 181 fields
    if (response.fieldComparisons.length < 181) {
      warnings.push(`Only ${response.fieldComparisons.length} fields analyzed, expected 181`);
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

  if (!response.sectionAnalysis || !Array.isArray(response.sectionAnalysis)) {
    errors.push('Missing or invalid sectionAnalysis array');
  } else {
    if (response.sectionAnalysis.length < 22) {
      warnings.push(`Only ${response.sectionAnalysis.length} sections analyzed, expected 22`);
    }

    response.sectionAnalysis.forEach((section: any, idx: number) => {
      // Validate required fields for each section
      if (!section.sectionId) {
        errors.push(`Section ${idx + 1} missing sectionId`);
      }
      if (!section.sectionName) {
        errors.push(`Section ${idx + 1} missing sectionName`);
      }
      if (!section.grade) {
        errors.push(`Section "${section.sectionName}" missing grade`);
      }
      if (section.score === undefined || section.score === null) {
        errors.push(`Section "${section.sectionName}" missing score`);
      }
      if (!section.visualData || !section.visualData.type) {
        errors.push(`Section "${section.sectionName}" missing visualData`);
      }
      if (!section.strengths || section.strengths.length === 0) {
        warnings.push(`Section "${section.sectionName}" has no strengths listed`);
      }
      if (!section.concerns || section.concerns.length === 0) {
        warnings.push(`Section "${section.sectionName}" has no concerns listed`);
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

  let result: { scores: number[]; proof: string };

  switch (method) {
    case 'lower_is_better':
      result = scoreLowerIsBetter(values);
      break;
    case 'higher_is_better':
      result = scoreHigherIsBetter(values);
      break;
    case 'closer_to_ideal':
      result = scoreCloserToIdeal(values, 2010, 10);
      break;
    case 'binary_yes_no':
      result = scoreBinary(values as boolean[]);
      break;
    case 'risk_assessment':
      result = scoreRiskAssessment(values as string[]);
      break;
    case 'quality_tier':
      result = scoreQualityTier(values as string[]);
      break;
    case 'location_desirability':
      result = scoreLocationDesirability(values);
      break;
    case 'financial_roi':
      result = scoreFinancialROI(values, 8);
      break;
    default:
      return { score: 50, proof: 'Unknown method' };
  }

  // Return the first score (for the main property being scored)
  return {
    score: result.scores[0],
    proof: result.proof
  };
}
