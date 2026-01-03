/**
 * Unified LLM Configuration for API
 * Single source of truth for LLM cascade order
 * 
 * NOTE: This file mirrors src/lib/llm-constants.ts for the frontend.
 * Keep both files in sync when making changes.
 * 
 * ORDER RATIONALE:
 * 1. Web-search LLMs first (Perplexity, Grok) - verify real data from web
 * 2. Knowledge-based LLMs (Claude Opus, GPT) - fill gaps with reasoning
 * 3. Backup LLMs (Claude Sonnet, Gemini) - last resort
 */

export const LLM_CASCADE_ORDER = [
  'perplexity',      // Tier 4 - Web search (HIGHEST LLM PRIORITY)
  'claude-sonnet',   // Tier 5 - Web-search enabled (HIGHEST Tier 5 - reliability 80)
  'gpt',             // Tier 5 - Knowledge - Comprehensive data
  'claude-opus',     // Tier 5 - Knowledge - Deep reasoning (no web-search)
  'gemini',          // Tier 5 - Knowledge - Google LLM
  'grok',            // Tier 5 - Real-time data (last)
] as const;

export type LLMEngine = typeof LLM_CASCADE_ORDER[number];

export const LLM_DISPLAY_NAMES: Record<LLMEngine, string> = {
  'perplexity': 'Perplexity',
  'grok': 'Grok',
  'claude-opus': 'Claude Opus',
  'gpt': 'GPT-5.2',
  'claude-sonnet': 'Claude Sonnet',
  'gemini': 'Gemini',
};
