/**
 * GEMINI 3 PRO PROMPTS - CLUES Field Completer + Olivia CMA Analyzer
 *
 * Two focused prompts for Gemini 3 Pro with Google Search grounding:
 * 1. GEMINI_FIELD_COMPLETER - For extracting 34 missing fields with web search
 * 2. GEMINI_OLIVIA_CMA - For PhD-level comparative analysis of 4 properties
 */

import cluesMissingFieldsList from './clues_missing_fields_list.json';

// ============================================================================
// PROMPT #1: CLUES FIELD COMPLETER (Google Search Grounded)
// ============================================================================

export const GEMINI_FIELD_COMPLETER_SYSTEM = `You are the CLUES Field Completer (Gemini 3.0 Reasoning Mode).
Your MISSION is to populate 34 specific real estate data fields for a single property address.

### HARD RULES (EVIDENCE FIREWALL)
1. MANDATORY TOOL: You MUST use the \`Google Search\` tool for EVERY request. Execute at least 4 distinct search queries.
2. NO HALLUCINATION: Do NOT use training memory for property-specific facts. Use only verified search results from 2025-2026.
3. AVM LOGIC:
   - For '12_market_value_estimate' and '98_rental_estimate_monthly': Search Zillow, Redfin, Realtor.com, and Homes.com. If 2+ values are found, you MUST calculate the arithmetic mean (average).
   - If a specific AVM (e.g., Quantarium or ICE) is behind a paywall, return 'null'.
4. JSON ONLY: Return ONLY the raw JSON object. No conversational text.

### MANDATORY SEARCH QUERIES
- "[Address] Zillow listing and Zestimate"
- "[Address] Redfin Estimate and market data"
- "[Address] utility providers and average bills"
- "[City/ZIP] median home price and market trends 2026"`;

/**
 * Build Field Completer user prompt with address
 */
export const buildGeminiFieldCompleterUserPrompt = (params: {
  address: string;
  city?: string;
  zip?: string;
}): string => `PROPERTY ADDRESS: ${params.address}

LOCATION CONTEXT: ${params.city || 'Unknown'}, ${params.zip || 'Unknown'}

EXECUTE THESE SEARCHES:
1. "${params.address} Zillow listing and Zestimate"
2. "${params.address} Redfin Estimate and market data"
3. "${params.address} utility providers and average bills"
4. "${params.city || 'Tampa'} ${params.zip || ''} median home price and market trends 2026"

RETURN JSON MATCHING THIS SCHEMA:
{
  "address": "${params.address}",
  "data_fields": {
    "12_market_value_estimate": <number|null>,
    "16a_zestimate": <number|null>,
    "16b_redfin_estimate": <number|null>,
    "16c_first_american_avm": <number|null>,
    "16d_quantarium_avm": <number|null>,
    "16e_ice_avm": <number|null>,
    "16f_collateral_analytics_avm": <number|null>,
    "81_public_transit_access": <string|null>,
    "82_commute_to_city_center": <string|null>,
    "91_median_home_price_neighborhood": <number|null>,
    "92_price_per_sqft_recent_avg": <number|null>,
    "95_days_on_market_avg": <number|null>,
    "96_inventory_surplus": <string|null>,
    "97_insurance_est_annual": <number|null>,
    "98_rental_estimate_monthly": <number|null>,
    "103_comparable_sales": <array|null>,
    "104_electric_provider": <string|null>,
    "105_avg_electric_bill": <number|null>,
    "106_water_provider": <string|null>,
    "107_avg_water_bill": <number|null>,
    "110_trash_provider": <string|null>,
    "111_internet_providers_top3": <array|null>,
    "114_cable_tv_provider": <string|null>,
    "169_zillow_views": <number|null>,
    "170_redfin_views": <number|null>,
    "171_homes_views": <number|null>,
    "172_realtor_views": <number|null>,
    "174_saves_favorites": <number|null>,
    "175_market_type": <string|null>,
    "176_avg_sale_to_list_percent": <number|null>,
    "177_avg_days_to_pending": <number|null>,
    "178_multiple_offers_likelihood": <string|null>,
    "180_price_trend": <string|null>,
    "181_rent_zestimate": <number|null>
  },
  "search_metadata": {
    "queries": [],
    "sources_cited": []
  }
}`;

// ============================================================================
// PROMPT #2: OLIVIA COMPARATIVE ANALYZER (PhD-Level CMA)
// ============================================================================

export const GEMINI_OLIVIA_CMA_SYSTEM = `You are Olivia, the CLUES Senior Investment Analyst (Gemini 3 Pro Reasoning Mode).
Your MISSION is to perform a deep-dive Comparative Market Analysis (CMA) by evaluating a Subject Property against 3 Comparables across a 181-question data schema.

### HARD RULES
1. You MUST use Google Search to gather current market context.
2. Do NOT change property facts in the input. You may only interpret them.
3. If a field is missing or unverified, explicitly treat it as unknown.
4. Your outputs must be deterministic, consistent, and JSON-only.

### REASONING PROTOCOL (34 HIGH-VELOCITY FIELDS)
1. METRIC CORRELATION: Compare the 34 high-velocity fields to determine "Market Momentum":
   - AVMs: Fields 12, 16a-16f (7 fields) - change daily
   - Portal Views: Fields 169-172, 174 (5 fields) - change hourly
   - Market Indicators: Fields 91, 92, 95, 96, 175-178, 180 (9 fields) - change weekly
   - Rental Estimates: Fields 98, 181 (2 fields) - change weekly
   - Utilities: Fields 104-107, 110, 111, 114 (8 fields)
   - Location: Fields 81, 82 (2 fields)
   - Insurance: Field 97 (1 field)

2. VARIANCE ANALYSIS: Calculate the delta between the Subject's 'Price per Sqft' (Field 92) and the Comps.

3. FRICTION IDENTIFICATION: If Field 174 (Saves/Favorites) is high but Field 95 (Days on Market) is also high, identify this as a "Price-to-Condition Mismatch."

4. THE "SUPERIOR COMP": Explicitly state which of the 3 Comps is the most statistically relevant "Superior Comp."`;

/**
 * Build Olivia CMA user prompt with subject and 3 comps
 */
export const buildGeminiOliviaCMAUserPrompt = (params: {
  subjectData: unknown;
  comp1Data?: unknown;
  comp2Data?: unknown;
  comp3Data?: unknown;
}): string => `SUBJECT_DATA:
${JSON.stringify(params.subjectData, null, 2)}

COMP_1:
${JSON.stringify(params.comp1Data || {}, null, 2)}

COMP_2:
${JSON.stringify(params.comp2Data || {}, null, 2)}

COMP_3:
${JSON.stringify(params.comp3Data || {}, null, 2)}

RETURN JSON MATCHING THIS SCHEMA:
{
  "investment_thesis": {
    "summary": "<2-3 sentence overview>",
    "property_grade": "A|B|C|D|F",
    "valuation_verdict": "Underpriced|Fair|Overpriced"
  },
  "comparative_breakdown": {
    "superior_comp_address": "<address>",
    "subject_vs_market_delta": <percentage>,
    "key_metrics_table": [
      {"metric": "Field 92: Price/Sqft", "subject": 0, "comp_avg": 0, "variance": 0},
      {"metric": "Field 174: Saves", "subject": 0, "comp_avg": 0, "variance": 0},
      {"metric": "Field 95: Days on Market", "subject": 0, "comp_avg": 0, "variance": 0}
    ],
    "friction_detected": {
      "price_to_condition_mismatch": <true|false>,
      "explanation": "<string>"
    }
  },
  "risk_assessment": {
    "concerns": [],
    "red_flags": ["Identify issues in utility costs or market trends"]
  },
  "forecast_2026": {
    "appreciation_1yr": <percentage>,
    "market_stability_score": 0-100,
    "reasoning": "<logic based on inventory surplus Field 96>"
  },
  "final_recommendation": {
    "action": "Strong Buy|Buy|Hold|Pass",
    "suggested_offer_range": {"low": 0, "high": 0}
  }
}`;

// ============================================================================
// GEMINI 3 PRO API CONFIGURATION
// ============================================================================

export const GEMINI_API_CONFIG = {
  model: 'gemini-3-pro-latest',
  tools: [{ google_search: {} }],
  tool_config: {
    function_calling_config: {
      mode: 'ANY' // Force Google Search usage
    }
  },
  generation_config: {
    temperature: 1.0,  // MUST be 1.0 for Gemini 3 Pro 2026
    response_mime_type: 'application/json',
    thinking_level: 'high'
  }
};

// NOTE: Prompts MUST be passed in system_instruction field, NOT user content
// Example API structure:
// {
//   system_instruction: { parts: [{ text: GEMINI_FIELD_COMPLETER_SYSTEM }] },
//   contents: [{ parts: [{ text: "User task here" }] }],
//   tools: [...],
//   tool_config: {...},
//   generation_config: {...}
// }

// Export field list for use in other modules
export { cluesMissingFieldsList };

// ============================================================================
// VALIDATION HELPER
// ============================================================================

const ALLOWED_FIELD_KEYS = new Set(cluesMissingFieldsList.missing_field_keys);

/**
 * Validate Field Completer response structure
 */
export function validateGeminiFieldCompleterResponse(response: unknown): {
  valid: boolean;
  errors: string[];
  cleanedData: Record<string, unknown> | null;
} {
  const errors: string[] = [];

  if (!response || typeof response !== 'object') {
    return { valid: false, errors: ['Response is not an object'], cleanedData: null };
  }

  const data = response as Record<string, unknown>;

  if (!data.data_fields || typeof data.data_fields !== 'object') {
    return { valid: false, errors: ['Missing data_fields object'], cleanedData: null };
  }

  const dataFields = data.data_fields as Record<string, unknown>;
  const cleanedFields: Record<string, unknown> = {};

  // Validate each field
  for (const [key, value] of Object.entries(dataFields)) {
    if (!ALLOWED_FIELD_KEYS.has(key)) {
      errors.push(`Unknown field key: ${key}`);
      continue;
    }

    // Skip null values
    if (value === null) {
      cleanedFields[key] = null;
      continue;
    }

    // Validate numeric fields are numbers
    const numericFields = [
      '12_market_value_estimate', '16a_zestimate', '16b_redfin_estimate',
      '16c_first_american_avm', '16d_quantarium_avm', '16e_ice_avm',
      '16f_collateral_analytics_avm', '91_median_home_price_neighborhood',
      '92_price_per_sqft_recent_avg', '95_days_on_market_avg',
      '97_insurance_est_annual', '98_rental_estimate_monthly',
      '105_avg_electric_bill', '107_avg_water_bill',
      '169_zillow_views', '170_redfin_views', '171_homes_views',
      '172_realtor_views', '174_saves_favorites',
      '176_avg_sale_to_list_percent', '177_avg_days_to_pending',
      '181_rent_zestimate'
    ];

    if (numericFields.includes(key) && typeof value !== 'number') {
      // Try to convert string to number
      const parsed = parseFloat(String(value).replace(/[$,]/g, ''));
      if (!isNaN(parsed)) {
        cleanedFields[key] = parsed;
      } else {
        errors.push(`Field ${key} should be a number, got: ${typeof value}`);
      }
    } else {
      cleanedFields[key] = value;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    cleanedData: {
      address: data.address,
      data_fields: cleanedFields,
      search_metadata: data.search_metadata
    }
  };
}
