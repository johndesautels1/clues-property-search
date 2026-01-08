/**
 * Unified LLM Configuration
 * Single source of truth for LLM cascade order and names
 * Used across AddProperty, Dashboard, API, and all components
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
 * 2. Gemini - Google Search grounding
 * 3. GPT - Web evidence mode
 * 4. Claude Sonnet - Web search beta
 * 5. Grok - X/Twitter real-time data
 * 6. Claude Opus - Deep reasoning (LAST)
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

// Display names for UI
export const LLM_DISPLAY_NAMES: Record<LLMEngine, string> = {
  'perplexity': 'Perplexity Sonar Reasoning Pro',
  'grok': 'Grok 4.1 Fast',
  'claude-opus': 'Claude Opus 4.5',
  'gpt': 'GPT-5.2 Pro',
  'claude-sonnet': 'Claude Sonnet 4.5',
  'gemini': 'Gemini 3 Pro Preview',
};

// API key environment variables
export const LLM_ENV_VARS: Record<LLMEngine, string> = {
  'perplexity': 'PERPLEXITY_API_KEY',
  'grok': 'XAI_API_KEY', // CORRECT - Vercel uses XAI_API_KEY not GROK_API_KEY
  'claude-opus': 'ANTHROPIC_API_KEY',
  'gpt': 'OPENAI_API_KEY',
  'claude-sonnet': 'ANTHROPIC_API_KEY',
  'gemini': 'GEMINI_API_KEY',
};

// Validation: ensure all arrays have same length
if (Object.keys(LLM_DISPLAY_NAMES).length !== LLM_CASCADE_ORDER.length) {
  throw new Error('LLM_DISPLAY_NAMES must have entries for all LLMs in LLM_CASCADE_ORDER');
}
