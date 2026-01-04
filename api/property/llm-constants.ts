/**
 * Unified LLM Configuration for API
 * Single source of truth for LLM cascade order
 * 
 * NOTE: This file mirrors src/lib/llm-constants.ts for the frontend.
 * Keep both files in sync when making changes.
 * 
 * ORDER RATIONALE:
 * 1. Web-search LLMs first (Perplexity, Grok) - verify real data from web
 * 2. Knowledge-based LLMs (GPT, Claude Opus, Gemini) - fill gaps
 * 3. Claude Sonnet last - fills remaining gaps
 */

export const LLM_CASCADE_ORDER = [
  'perplexity',      // Tier 4 - Web search (HIGHEST LLM PRIORITY)
  'grok',            // Tier 5 - Web search + real-time data (2nd priority)
  'gpt',             // Tier 5 - Knowledge - Comprehensive data
  'claude-opus',     // Tier 5 - Knowledge - Deep reasoning
  'gemini',          // Tier 5 - Knowledge with search grounding
  'claude-sonnet',   // Tier 5 - LAST - fills in MISSING fields only
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
