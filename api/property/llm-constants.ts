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
  'perplexity',      // Web search - BEST for verification
  'grok',            // Web search - Real-time data
  'claude-opus',     // Knowledge - Most reliable reasoning
  'gpt',             // Knowledge - Comprehensive data
  'claude-sonnet',   // Knowledge - Fast fallback
  'gemini',          // Knowledge - Last resort
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
