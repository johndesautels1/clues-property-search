# CLAUDE HANDOFF — IMPLEMENT EXACTLY (Drop-in Files + Integration Steps) ✅

## 0) Goal
Implement an affordable real-estate data pipeline:
- Web layer: Tavily (Tier 3)
- LLM layer: OpenAI (cheap models)
- Output: deterministic, strict JSON mapped to the user’s schema keys (e.g., 181 fields)
- Runtime: Vercel serverless (Node)

## 1) REQUIRED ENV VARS
Copy `.env.example` → `.env.local` (and set the same in Vercel → Project → Settings → Environment Variables)

- OPENAI_API_KEY=...
- TAVILY_API_KEY=...

Optional:
- PIPELINE_LOG_LEVEL=debug|info|warn|error  (default: info)
- PIPELINE_MAX_INPUT_CHARS=18000           (default: 18000)
- PIPELINE_TAVILY_CACHE_TTL_SECONDS=86400  (default: 86400)

## 2) MODELS (PINNED IDs — do not improvise)
Set in `src/config/models.ts`:

Primary (cheap extraction):
- gpt-4o-mini-2024-07-18

Escalation (only if needed):
- gpt-4.1-mini-2025-04-14

## 3) WHY we are NOT using OpenAI built-in web search by default
Because it adds **tool-call fees** plus search-content token fees.
We already pay Tavily credits and can control depth and domains there.

If user later wants OpenAI web_search tool as a fallback,
add it behind a feature flag and a hard budget.

## 4) FILES
Use the attached files exactly as written:
- api/analyze.ts
- src/pipeline/run.ts
- src/search/tavily.ts
- src/llm/openai.ts
- src/llm/extractFields.ts
- src/schema/fields.ts
- src/schema/resultSchema.ts
- src/config/models.ts
- src/config/pipeline.ts
- src/utils/*

## 5) INTEGRATION STEP
- If your repo already has an API directory: merge `api/analyze.ts`.
- If you use Next.js, move `api/analyze.ts` to `pages/api/analyze.ts` or `app/api/analyze/route.ts` (adapt request parsing).
- Ensure server-side only: OpenAI + Tavily keys must never be exposed to client.

## 6) CONTRACT: OUTPUT MUST BE STRICT
The pipeline returns a `FieldBundle[]` where each bundle has:
- `key`, `label`
- `values` keyed by property id: A/B/C
Each value includes:
- value, unit, status, confidence, sources[], notes

If a field cannot be verified:
- value = null
- status = "not_found"
- confidence = "low"
- notes must explain why

If conflicting sources:
- status = "conflict"
- include 2+ sources and describe conflict

## 7) BATCHING
We DO NOT attempt to fill all 181 fields in one response.
We batch with `BATCH_SIZE` (default 35).
We also separate fields with "needs web" hints if provided by the schema.

## 8) HOW to connect to your existing multi-tier pipeline
- Keep Tier 1/2 (MLS, APIs) upstream
- Send that as `knownData` into the pipeline runner
- The runner only fills fields with missing/low-confidence/conflict

