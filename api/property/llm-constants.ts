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
 * 2. GPT - Web evidence mode (web-search enabled)
 * 3. Claude Sonnet - Web search beta (fills gaps)
 * 4. Grok - X/Twitter real-time data (web-search enabled)
 * 5. Claude Opus - Deep reasoning (NO web search - LAST)
 *
 * NOTE: Gemini removed from auto-cascade (2026-01-13) - available via on-demand button only
 */

export const LLM_CASCADE_ORDER = [
  'perplexity',      // #1 - Tier 4 - Deep web search (HIGHEST LLM PRIORITY)
  'gpt',             // #2 - Tier 4 - Web evidence mode
  'claude-sonnet',   // #3 - Tier 4 - Web search beta (fills gaps)
  'grok',            // #4 - Tier 4 - X/Twitter real-time data
  'claude-opus',     // #5 - Tier 5 - Deep reasoning, NO web search (LAST)
  // NOTE: 'gemini' removed from auto-cascade (2026-01-13) - available via on-demand button
] as const;

export type LLMEngine = typeof LLM_CASCADE_ORDER[number];

// All available LLMs (including Gemini for on-demand button use)
export type AllLLMEngines = LLMEngine | 'gemini';

export const LLM_DISPLAY_NAMES: Record<AllLLMEngines, string> = {
  'perplexity': 'Perplexity Sonar Reasoning Pro',
  'gpt': 'GPT-4o',
  'claude-sonnet': 'Claude Sonnet 4.5',
  'grok': 'Grok 4.1 Fast',
  'claude-opus': 'Claude Opus 4.5',
  'gemini': 'Gemini 3 Pro Preview',  // Available via on-demand button only
};

// Tavily Configuration (Tier 3)
export const TAVILY_CONFIG = {
  name: 'Tavily',
  tier: 3,
  timeout: 45000, // 45 seconds - INCREASED from 30s on 2026-01-13 for fields 169-174
  reliability: 85, // 85% reliability score
  description: 'Targeted web searches for AVMs, market data, permits, tax data, market performance',
  fields: [
    // Tax fields (NEW 2026-01-13)
    '15_assessed_value',
    '35_annual_taxes',
    '38_tax_exemptions',
    // AVM fields
    '16a_zestimate',
    '16b_redfin_estimate',
    '16c_first_american_avm',
    '16d_quantarium_avm',
    '16e_ice_avm',
    '16f_collateral_analytics_avm',
    // Age/Permit fields
    '40_roof_age_est',
    '46_hvac_age',
    '59_recent_renovations',
    '60_permit_history_roof',
    '61_permit_history_hvac',
    '62_permit_history_other',
    // Market stats
    '91_median_home_price_neighborhood',
    '92_price_per_sqft_recent_avg',
    '95_days_on_market_avg',
    // Utilities
    '104_electric_provider',
    '106_water_provider',
    '109_natural_gas',
    // Features
    '133_ev_charging',
    '134_smart_home_features',
    '135_accessibility_modifications',
    '138_special_assessments',
    // Homestead/CDD
    '151_homestead_yn',
    '152_cdd_yn',
    '153_annual_cdd_fee',
    // Market Performance (169-174)
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
  4: { name: 'Web-Search LLMs', source: 'Perplexity, GPT, Sonnet, Grok' },
  5: { name: 'Claude Opus', source: 'Deep reasoning, no web search' },
  // Gemini: On-demand via button (removed from auto-cascade 2026-01-13)
} as const;
