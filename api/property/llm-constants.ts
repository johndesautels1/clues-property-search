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
