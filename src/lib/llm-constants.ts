/**
 * Unified LLM Configuration
 * Single source of truth for LLM cascade order and names
 * Used across AddProperty, Dashboard, API, and all components
 */

// Official cascade order by reliability (Updated 2026-01-05)
// 1. Web-search LLMs first (real data verification)
// 2. Claude Sonnet (web search beta - fills gaps)
// 3. Claude Opus last (NO web search - pure reasoning)
export const LLM_CASCADE_ORDER = [
  'perplexity',      // #1 - Tier 4 - Deep web search (HIGHEST LLM PRIORITY)
  'gemini',          // #2 - Tier 4 - Google Search grounding
  'gpt',             // #3 - Tier 4 - Web evidence mode
  'grok',            // #4 - Tier 4 - X/Twitter real-time data
  'claude-sonnet',   // #5 - Tier 5 - Web search beta (fills gaps)
  'claude-opus',     // #6 - Tier 5 - Deep reasoning, NO web search (LAST)
] as const;

export type LLMEngine = typeof LLM_CASCADE_ORDER[number];

// Display names for UI
export const LLM_DISPLAY_NAMES: Record<LLMEngine, string> = {
  'perplexity': 'Perplexity',
  'grok': 'Grok',
  'claude-opus': 'Claude Opus',
  'gpt': 'GPT-5.2',
  'claude-sonnet': 'Claude Sonnet',
  'gemini': 'Gemini',
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
