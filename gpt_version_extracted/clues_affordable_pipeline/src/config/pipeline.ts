/**
 * Pipeline tunables.
 * Keep defaults conservative for cost + reliability.
 */
export const PIPELINE = {
  // Batch size of fields per LLM call (181 fields => ~6 calls at 30; ~5 calls at 35)
  BATCH_SIZE: 35,

  // How many Tavily search results to request per query
  TAVILY_MAX_RESULTS: 6,

  // Tavily search depth: keep explicitly "basic" unless you truly need "advanced"
  TAVILY_SEARCH_DEPTH: "basic" as const,

  // Use Tavily /extract on top sources (costs credits; increases accuracy)
  USE_EXTRACT: true,

  // Hard cap for content sent into LLM per batch (chars, not tokens)
  MAX_INPUT_CHARS: Number(process.env.PIPELINE_MAX_INPUT_CHARS ?? 18000),

  // Cache TTL for Tavily results (seconds)
  TAVILY_CACHE_TTL_SECONDS: Number(process.env.PIPELINE_TAVILY_CACHE_TTL_SECONDS ?? 86400),
} as const;
