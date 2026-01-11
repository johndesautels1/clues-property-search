/**
 * Pinned model IDs for stability.
 * Change here ONLY.
 */
export const MODELS = {
  // Cheapest default extraction model (pinned snapshot)
  primary: "gpt-4o-mini-2024-07-18",

  // Escalation model for hard/conflict fields (pinned snapshot)
  fallback: "gpt-4.1-mini-2025-04-14",
} as const;

export type ModelName = typeof MODELS[keyof typeof MODELS];
