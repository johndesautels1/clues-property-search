/**
 * Gemini 2.0 Flash Tier 3.5 - Structured Field Extraction
 *
 * Three specialist batches run in parallel:
 * - Batch 1: Public records (county sites)
 * - Batch 2: Market data (WalkScore, Redfin, ZIP trends)
 * - Batch 3: Portal data (Zillow, Redfin, Realtor)
 *
 * Uses Zod schemas converted to Gemini JSON format for type safety and validation.
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
- If no explicit permit year is found, return null for that field.
- If tax data is unavailable, return null for tax rate.
- Never guess or estimate. Only return data explicitly shown on government sites.

OUTPUT: Return JSON with all 8 fields. Use null for any field not found.
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
- If WalkScore doesn't show Transit or Bike scores, return null.
- If no market data for ZIP code, return null.
- For water bodies, only return if within 10 miles.

OUTPUT: Return JSON with all 6 fields. Use null for any field not found.
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
  1. Zillow.com - Look for "Zestimate" on the property page
  2. Realtor.com - Look for home value estimate
  3. Homes.com - Look for home value estimate
  4. Redfin.com - Look for "Redfin Estimate"
- Extract ONE value from each source (if available)
- If only 1 source has a value, return that value
- If 2 or more sources have values, calculate AVERAGE = (Sum of all values) ÷ (Count of values)
- Example: If Zillow=$500k, Redfin=$520k, Realtor=$510k → AVERAGE = (500000+520000+510000)÷3 = 510000
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
- Extract ONE value from each source (if available)
- If only 1 source has a value, return that value
- If 2 or more sources have values, calculate AVERAGE = (Sum of all values) ÷ (Count of values)
- Example: If Zillow=$2,500/mo, Redfin=$2,600/mo, Realtor=$2,550/mo → AVERAGE = (2500+2600+2550)÷3 = 2550
- DO NOT add values together without dividing
- Return as integer (e.g., 2500 not $2,500)

Field 131 (View Type):
1. Search the "Public Facts," "Key Features," or "Interior Features" sections
2. Map to exactly one: [Water, Golf, Park, City, None]
3. Priority: Water > Golf > Park > City
4. Hallucination Guard: If vague adjectives like "Great View" or "Stunning Vista" without a specific feature (Water/Golf/etc.), return "None"
5. Strict Mapping:
   - Return "None" ONLY if portal explicitly lists "View: None"
   - Return null if View category is missing from data table entirely

HALLUCINATION GUARD:
- Only use labeled estimates (Zestimate, Redfin Estimate, etc.). Do NOT use list price or tax assessment.
- If a portal says "Estimate Not Available", return null for that field.
- For ranges (e.g., "$1.1M - $1.3M"), use the midpoint.
- Never infer or estimate values not explicitly shown.

OUTPUT: Return JSON with all 6 fields. Use null for any field not found.
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
