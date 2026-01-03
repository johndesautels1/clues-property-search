/**
 * Unified LLM Configuration
 * Single source of truth for LLM cascade order and names
 * Used across AddProperty, Dashboard, API, and all components
 */

// Official cascade order by reliability (tested and verified)
// 1. Web-search LLMs first (real data verification)
// 2. Knowledge-based LLMs (fill gaps with reasoning)
// 3. Backup LLMs (last resort)
export const LLM_CASCADE_ORDER = [
  'perplexity',      // Tier 4 - Web search (HIGHEST LLM PRIORITY)
  'claude-sonnet',   // Tier 5 - Web-search enabled (HIGHEST Tier 5 - reliability 80)
  'gpt',             // Tier 5 - Knowledge - Comprehensive data
  'claude-opus',     // Tier 5 - Knowledge - Deep reasoning (no web-search)
  'gemini',          // Tier 5 - Knowledge - Google LLM
  'grok',            // Tier 5 - Real-time data (last)
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
