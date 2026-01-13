/**
 * Unified LLM Configuration for API
 * Single source of truth for LLM cascade order
 *
 * NOTE: This file mirrors src/lib/llm-constants.ts for the frontend.
 * Keep both files in sync when making changes.
 *
 * FULL TIER STRUCTURE (Updated 2026-01-08):
 * Tier 1: Stellar MLS (Bridge Interactive API)
 * Tier 2: APIs (Google APIs first, then Free APIs)
 * Tier 3: Tavily Web Search (targeted AVM, school, crime searches)
 * Tier 4: Web-Search LLMs (#1-5 below)
 * Tier 5: Claude Opus (deep reasoning, NO web search)
 *
 * LLM CASCADE ORDER (Tier 4-5):
 * 1. Perplexity - Deep web search (HIGHEST PRIORITY)
 * 2. Gemini - Google Search grounding (web-search enabled)
 * 3. GPT - Web evidence mode (web-search enabled)
 * 4. Claude Sonnet - Web search beta (fills gaps)
 * 5. Grok - X/Twitter real-time data (web-search enabled)
 * 6. Claude Opus - Deep reasoning (NO web search - LAST)
 */

export const LLM_CASCADE_ORDER = [
  'perplexity',      // #1 - Tier 4 - Deep web search (HIGHEST LLM PRIORITY)
  'gemini',          // #2 - Tier 4 - Google Search grounding
  'gpt',             // #3 - Tier 4 - Web evidence mode
  'claude-sonnet',   // #4 - Tier 4 - Web search beta (fills gaps)
  'grok',            // #5 - Tier 4 - X/Twitter real-time data
  'claude-opus',     // #6 - Tier 5 - Deep reasoning, NO web search (LAST)
] as const;

export type LLMEngine = typeof LLM_CASCADE_ORDER[number];

export const LLM_DISPLAY_NAMES: Record<LLMEngine, string> = {
  'perplexity': 'Perplexity Sonar Reasoning Pro',
  'grok': 'Grok 4.1 Fast',
  'claude-opus': 'Claude Opus 4.5',
  'gpt': 'GPT-4o',
  'claude-sonnet': 'Claude Sonnet 4.5',
  'gemini': 'Gemini 3 Pro Preview',
};

// Tavily Configuration (Tier 3)
export const TAVILY_CONFIG = {
  name: 'Tavily',
  tier: 3,
  timeout: 45000, // 45 seconds - INCREASED from 30s on 2026-01-13 for fields 169-174
  reliability: 85, // 85% reliability score
  description: 'Targeted web searches for AVMs, market data, permits, market performance (169-174)',
  fields: [
    '16a_zestimate',
    '16b_redfin_estimate',
    '40_roof_age_est',
    '46_hvac_age',
    '59_recent_renovations',
    '60_permit_history_roof',
    '61_permit_history_hvac',
    '62_permit_history_other',
    '91_median_home_price_neighborhood',
    '92_price_per_sqft_recent_avg',
    '95_days_on_market_avg',
    '104_electric_provider',
    '106_water_provider',
    '109_natural_gas',
    '133_ev_charging',
    '134_smart_home_features',
    '135_accessibility_modifications',
    '138_special_assessments',
    '169_months_of_inventory',
    '170_new_listings_30d',
    '171_homes_sold_30d',
    '172_median_dom_zip',
    '173_price_reduced_percent',
    '174_homes_under_contract',
  ],
} as const;

// Full tier structure
export const TIER_STRUCTURE = {
  1: { name: 'Stellar MLS', source: 'Bridge Interactive API' },
  2: { name: 'Google APIs', source: 'Google Places, Geocoding' },
  3: { name: 'Free APIs + Tavily', source: 'SchoolDigger, FBI Crime, WalkScore, FEMA, Tavily' },
  4: { name: 'Web-Search LLMs', source: 'Perplexity, Gemini, GPT, Sonnet, Grok' },
  5: { name: 'Claude Opus', source: 'Deep reasoning, no web search' },
} as const;
