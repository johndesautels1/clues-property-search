/**
 * Gemini 2.0 Flash Tier 4 - Structured Field Extraction
 *
 * Three specialist batches run in parallel:
 * - Batch 1: Public records (county sites)
 * - Batch 2: Market data (WalkScore, Redfin, ZIP trends)
 * - Batch 3: Portal data (Zillow, Redfin, Realtor)
 *
 * Uses Zod schemas converted to Gemini JSON format for type safety and validation.
 *
 * IMPORTANT: Derived/Calculated Fields
 * - Some fields like Field 11 (Price Per Sq Ft) are calculated from other fields
 * - Derived fields use the FINAL ARBITRATED VALUES from the arbitration pipeline
 * - They do NOT use raw Gemini batch outputs directly
 * - Example: Field 11 = Field 12 (market value) ÷ Field 21 (living sqft)
 *   If Gemini returns Field 12 = averaged estimate, derived field uses that averaged value
 * - No double-averaging occurs because derived calculation happens AFTER arbitration
 */

import {
  Batch1Schema,
  Batch2Schema,
  Batch3Schema,
  zodToGeminiSchema
} from './geminiZodSchemas.js';
import { buildCountySearchInstructions } from './countyPortals.js';

// ============================================================================
// BATCH 1: PUBLIC RECORD AUDITOR (County Records)
// ============================================================================
// Fields: 37, 38, 60, 61, 62, 151, 152, 153

/**
 * Generate Batch 1 instructions with county-specific portal URLs
 */
export function getBatch1Instructions(county: string): string {
  const portalInstructions = buildCountySearchInstructions(county);

  return `
You are a Florida Public Records Specialist.

TASK: Search County Appraiser and Building Department portals for the provided address.

MANDATORY TOOL: Use 'google_search' to find data from these official sites:

${portalInstructions}

FIELD EXTRACTION RULES:
- Field 37 (Tax Rate): Calculate as (Annual Taxes / Assessed Value). Express as percentage.
- Field 38 (Exemptions): Look for active exemptions (e.g., "Homestead", "Senior", "Veteran").
- Field 60 (Roof Permit): Find the YEAR of most recent "Finaled" or "Approved" ROOF permit.
- Field 61 (HVAC Permit): Find the YEAR of most recent "Finaled" HVAC/AC replacement permit.
- Field 62 (Other Permit): Find the YEAR of most recent major permit (pool, additions, fence, electrical, plumbing, structural).
- Field 151 (Homestead): Check if "Homestead Exemption" is currently active (Yes/No).
- Field 152 (CDD Exists): Search tax bill for "Non-Ad Valorem" or "CDD" line items (Yes/No).
- Field 153 (CDD Fee): If CDD exists, extract the annual dollar amount.

HALLUCINATION GUARD:
- If no explicit permit year is found, OMIT that field from JSON response.
- If tax data is unavailable, OMIT tax rate field.
- Never guess or estimate. Only return data explicitly shown on government sites.
- If county website is down or inaccessible, OMIT all fields from this batch (do NOT use non-government sources as fallback)

OUTPUT FORMAT:
- Return ONLY fields where you found explicit values on government websites
- OMIT any field you could not find (do NOT include with null value)
- CRITICAL JSON TYPE REQUIREMENT: Return ALL numeric values as JSON numbers (NOT strings)
  * CORRECT: {"37_tax_rate": 1.85, "153_cdd_fee_annual": 500}
  * WRONG: {"37_tax_rate": "1.85", "153_cdd_fee_annual": "500"}
- Example: If you only found Field 37 and Field 60, return: {"37_tax_rate": 1.85, "60_roof_permit_year": "2021"}
- If county portals are inaccessible, return: {} (empty object - all fields will fall through to Tier 4)
`;
}

// Generate schema from Zod
export const BATCH_1_SCHEMA = zodToGeminiSchema(Batch1Schema);

// ============================================================================
// BATCH 2: NEIGHBORHOOD ANALYST (Market Trends & Scores)
// ============================================================================
// Fields: 75, 76, 91, 95, 116, 159

export const BATCH_2_INSTRUCTIONS = `
You are a Real Estate Market Data Analyst.

TASK: Extract neighborhood-level metrics for the provided address.

MANDATORY TOOL: Use 'google_search' to find data from:
- WalkScore.com (transit and bike scores)
- Redfin.com (ZIP-level market data)
- Google Maps (emergency room location)
- Geographic databases (water bodies)

FIELD EXTRACTION RULES:
- Field 75 (Transit Score): Extract the exact Transit Score (0-100) from WalkScore.
- Field 76 (Bike Score): Extract the exact Bike Score (0-100) from WalkScore.
- Field 91 (Median Home Price): Find the median sale price for the property's ZIP code (Redfin or Realtor.com).
- Field 95 (Days on Market): Find the average/median days on market for the ZIP code.
- Field 116 (Emergency Distance): Find driving distance in miles to nearest emergency room (use Google Maps).
- Field 159 (Water Body Name): Identify the name of the nearest major body of water (bay, lake, gulf, ocean).

HALLUCINATION GUARD:
- Use ZIP-level data only (not city-wide or county-wide).
- If WalkScore doesn't show Transit or Bike scores, OMIT those fields.
- If no market data for ZIP code, OMIT those fields.
- For water bodies, only return if within 10 miles, otherwise OMIT.

OUTPUT FORMAT:
- Return ONLY fields where you found explicit values
- OMIT any field you could not find (do NOT include with null value)
- CRITICAL JSON TYPE REQUIREMENT: Return ALL numeric values as JSON numbers (NOT strings)
  * CORRECT: {"75_transit_score": 52, "91_median_home_price_neighborhood": 425000}
  * WRONG: {"75_transit_score": "52", "91_median_home_price_neighborhood": "425000"}
- Example: If you only found Fields 75 and 91, return: {"75_transit_score": 52, "91_median_home_price_neighborhood": 425000}
`;

// Generate schema from Zod
export const BATCH_2_SCHEMA = zodToGeminiSchema(Batch2Schema);

// ============================================================================
// BATCH 3: PORTAL SPECIALIST (Listing Details)
// ============================================================================
// Fields: 12, 16, 31, 33, 98, 131

export const BATCH_3_INSTRUCTIONS = `
You are a Real Estate Listing Portal Specialist.

TASK: Extract property-specific estimates and details from listing portals.

MANDATORY TOOL: Use 'google_search' to find data from:
- Zillow.com (Zestimate, Rent Zestimate)
- Redfin.com (Redfin Estimate)
- Realtor.com (listing details)
- Homes.com (listing details)

FIELD EXTRACTION RULES:

Field 12 (Market Value):
- Find the home value estimate from these 4 sources:
  1. Zillow.com - Look for "Zestimate" on the property page (look for "Total Price" badge nearby)
  2. Realtor.com - Look for home value estimate (grouped under "RealEstimate" umbrella)
  3. Homes.com - Look for home value estimate (powered by CoStar data; usually in "Estimates" tab)
  4. Redfin.com - Look for "Redfin Estimate" (found in "Property Value" or "Public Facts" section)

EXTRACTION RULES:
- Extract ONE value from each source that has an estimate available
- If source says "Estimate Not Available" or estimate is missing → skip that source, do NOT count it
- IMPORTANT: Averaging existing values is NOT estimation or guessing - it's mathematical synthesis

CALCULATION LOGIC:
- If you find values from 1 source only → return that single value
- If you find values from 2 or more sources → calculate AVERAGE = (Sum of found values) ÷ (Count of found values)
- Example 1: Zillow=$500k, Redfin=$520k, Realtor=$510k, Homes=unavailable → AVERAGE = (500000+520000+510000)÷3 = 510000
- Example 2: Zillow=$500k, Redfin=unavailable, Realtor=unavailable, Homes=unavailable → return 500000 (single source)
- Example 3: All sources unavailable → OMIT field entirely

VALIDATION:
- DO NOT add values together without dividing
- DO NOT use list price or tax assessed value
- Return as integer (e.g., 500000 not $500,000)

Field 16 (Redfin Estimate): Extract the exact "Redfin Estimate" value (not the average).
- Field 31 (HOA Fee Annual): Find the annual HOA fee. If monthly is shown, multiply by 12.
- Field 33 (HOA Includes): List exactly what HOA covers (e.g., "Pool, Trash, Landscaping").

Field 98 (Rental Estimate):
- Find the monthly rental estimate from these 4 sources:
  1. Zillow.com - Look for "Rent Zestimate®" (look for "Total Price" badge nearby)
  2. Redfin.com - Look for "Redfin Rental Estimate" (found in "Property Value" or "Public Facts" section)
  3. Realtor.com - Look for "RealEstimate™ (Rent)" (grouped under "RealEstimate" umbrella)
  4. Homes.com - Look for "Estimated Monthly Rent" (powered by CoStar data; usually in "Estimates" tab)

EXTRACTION RULES:
- Extract ONE value from each source that has a rental estimate available
- If source says "Estimate Not Available" or rental estimate is missing → skip that source, do NOT count it
- IMPORTANT: Averaging existing values is NOT estimation or guessing - it's mathematical synthesis

CALCULATION LOGIC:
- If you find values from 1 source only → return that single value
- If you find values from 2 or more sources → calculate AVERAGE = (Sum of found values) ÷ (Count of found values)
- Example 1: Zillow=$2,500/mo, Redfin=$2,600/mo, Realtor=$2,550/mo, Homes=unavailable → AVERAGE = (2500+2600+2550)÷3 = 2550
- Example 2: Zillow=$2,500/mo, Redfin=unavailable, Realtor=unavailable, Homes=unavailable → return 2500 (single source)
- Example 3: All sources unavailable → OMIT field entirely

VALIDATION:
- DO NOT add values together without dividing
- Return as integer (e.g., 2500 not $2,500)

Field 131 (View Type):
1. Search the "Public Facts," "Key Features," or "Interior Features" sections
2. Map to exactly one: [Water, Golf, Park, City, None]
3. Priority: Water > Golf > Park > City
4. Strict Mapping Rules:
   - If portal explicitly lists "View: Water" or "Waterfront" → return "Water"
   - If portal explicitly lists "View: Golf" or "Golf Course" → return "Golf"
   - If portal explicitly lists "View: Park" → return "Park"
   - If portal explicitly lists "View: City" or "Downtown" → return "City"
   - If portal explicitly lists "View: None" or "No View" → return "None"
   - If vague descriptions like "Great View" or "Stunning Vista" without specific feature → OMIT field entirely
   - If View category is missing from data table → OMIT field entirely

HALLUCINATION GUARD:
- Only use labeled estimates (Zestimate, Redfin Estimate, etc.). DO NOT use list price or tax assessment.
- If a portal says "Estimate Not Available", OMIT that field entirely from JSON response.
- For ranges (e.g., "$1.1M - $1.3M"), use the midpoint.
- Never infer or estimate values not explicitly shown.

OUTPUT FORMAT:
- Return ONLY fields where you found explicit values
- OMIT any field you could not find (do NOT include with null value)
- CRITICAL JSON TYPE REQUIREMENT: Return ALL numeric values as JSON numbers (NOT strings)
  * CORRECT: {"12_market_value_estimate": 500000, "31_hoa_fee_annual": 3600}
  * WRONG: {"12_market_value_estimate": "500000", "31_hoa_fee_annual": "3600"}
- Example: If you only found Field 12 and Field 31, return: {"12_market_value_estimate": 500000, "31_hoa_fee_annual": 3600}
`;

// Generate schema from Zod
export const BATCH_3_SCHEMA = zodToGeminiSchema(Batch3Schema);

// ============================================================================
// FIELD METADATA (For reference)
// ============================================================================

export const TIER_35_FIELDS = {
  // Batch 1: Public Records
  37: "Tax Rate",
  38: "Exemptions",
  60: "Roof Permit Year",
  61: "HVAC Permit Year",
  62: "Other Permit Year",
  151: "Homestead Status",
  152: "CDD Exists",
  153: "CDD Fee",

  // Batch 2: Neighborhood
  75: "Transit Score",
  76: "Bike Score",
  91: "Median Home Price (ZIP)",
  95: "Days on Market (ZIP)",
  116: "Emergency Room Distance",
  159: "Water Body Name",

  // Batch 3: Portals
  12: "Market Value Estimate",
  16: "Redfin Estimate",
  31: "HOA Fee Annual",
  33: "HOA Includes",
  98: "Rental Estimate",
  131: "View Type"
};

export const TIER_35_FIELD_IDS = Object.keys(TIER_35_FIELDS).map(Number);

// Backwards-compatible aliases (Tier 4 naming)
export const TIER_4_GEMINI_FIELDS = TIER_35_FIELDS;
export const TIER_4_GEMINI_FIELD_IDS = TIER_35_FIELD_IDS;
