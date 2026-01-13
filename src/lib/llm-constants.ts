/**
 * Unified LLM Configuration
 * Single source of truth for LLM cascade order and names
 * Used across AddProperty, Dashboard, API, and all components
 *
 * FULL TIER STRUCTURE (Updated 2026-01-08):
 * Tier 1: Stellar MLS (Bridge Interactive API)
 * Tier 2: APIs (Google APIs first, then Free APIs)
 * Tier 3: Tavily Web Search (targeted AVM, school, crime searches)
 * Tier 4: Web-Search LLMs (#1-4 below)
 * Tier 5: Claude Opus (deep reasoning, NO web search)
 *
 * LLM CASCADE ORDER (Tier 4-5):
 * 1. Perplexity - Deep web search (HIGHEST PRIORITY)
 * 2. GPT - Web evidence mode
 * 3. Claude Sonnet - Web search beta
 * 4. Grok - X/Twitter real-time data
 * 5. Claude Opus - Deep reasoning (LAST)
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

// Display names for UI (includes Gemini for button display)
export const LLM_DISPLAY_NAMES: Record<AllLLMEngines, string> = {
  'perplexity': 'Perplexity Sonar Reasoning Pro',
  'gpt': 'GPT-4o',
  'claude-sonnet': 'Claude Sonnet 4.5',
  'grok': 'Grok 4.1 Fast',
  'claude-opus': 'Claude Opus 4.5',
  'gemini': 'Gemini 3 Pro Preview',  // Available via on-demand button only
};

// API key environment variables (includes Gemini for button use)
export const LLM_ENV_VARS: Record<AllLLMEngines, string> = {
  'perplexity': 'PERPLEXITY_API_KEY',
  'gpt': 'OPENAI_API_KEY',
  'claude-sonnet': 'ANTHROPIC_API_KEY',
  'grok': 'XAI_API_KEY', // CORRECT - Vercel uses XAI_API_KEY not GROK_API_KEY
  'claude-opus': 'ANTHROPIC_API_KEY',
  'gemini': 'GEMINI_API_KEY',  // Available via on-demand button only
};
