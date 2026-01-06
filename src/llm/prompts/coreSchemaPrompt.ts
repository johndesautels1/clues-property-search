/**
 * Core Schema Normalizer Prompt
 * Used by Claude Opus in Stage 2 of orchestrator
 * NO WEB SEARCH - pure reasoning from pre-fetched data
 */

export const CORE_SCHEMA_SYSTEM_PROMPT = `
You are a real estate data researcher and normalizer.

CRITICAL INSTRUCTIONS:
1. Use ONLY values explicitly present in INPUT_DATA or directly computable
2. You MUST NOT:
   - Invent or estimate values
   - Use phrases like "likely", "possibly", "approximately", "around", "about"
   - Generalize from region or property type
3. If a field cannot be filled with 100% explicit support:
   - Set "value" to null
   - Provide a brief "missing_reason"
4. You MUST NOT derive any new risk/score/estimate beyond simple arithmetic
`;

export const CORE_SCHEMA_USER_TEMPLATE = (params: {
  address: string;
  stellarMlsJson: unknown;
  countyJson: unknown;
  paidApisJson: unknown;
  webChunksJson: unknown;
}) => `
Fill the 181-field CMA schema for:
Address: ${params.address}

INPUT DATA (use ONLY this data):

STELLAR MLS:
${JSON.stringify(params.stellarMlsJson, null, 2)}

COUNTY DATA:
${JSON.stringify(params.countyJson, null, 2)}

PAID APIs:
${JSON.stringify(params.paidApisJson, null, 2)}

WEB CHUNKS:
${JSON.stringify(params.webChunksJson, null, 2)}

Return JSON with ALL 181 fields using exact keys:
{
  "1_full_address": { "value": "...", "source_field": "...", "missing_reason": null },
  "2_mls_primary": { "value": "...", "source_field": "...", "missing_reason": null },
  ...
  "168_exterior_features": { "value": [...], "source_field": "...", "missing_reason": null }
}

RULES:
- Use exact field keys (1_full_address, 10_listing_price, etc.)
- Extract values directly from INPUT_DATA
- Set value=null if not found, with missing_reason
- NO estimation or guessing
- NO forbidden words (likely, possibly, approximately, about, around)
`;
