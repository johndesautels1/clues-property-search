# CLUES Affordable Web+LLM Pipeline (OpenAI + Tavily) 🚀🏡

This folder is a **drop-in scaffold** for a Vercel + TypeScript project to fill a large real-estate field schema (e.g., **181 fields**) across **1–3 properties**, with **web data provided by Tavily** and **extraction/normalization handled by an OpenAI model** using **Structured Outputs** (strict JSON).

## Why this exists (the “continuity” summary)
You said:
- You *need* real-time web info (for property analytics), but
- **OpenAI web search tool + GPT‑5.2** is too expensive for your pipeline, and
- You already have **Tavily Tier 3** as your web layer.

So this design:
1) Uses **Tavily** for search/extract (you control credits & depth),
2) Uses a **cheap, pinned OpenAI model** for deterministic JSON extraction,
3) Batches fields to avoid token blow-ups on 181-field responses,
4) Enforces **no hallucinations** by requiring sources + allowing `null` with reason.

## Default model strategy (cost-first)
- Primary model: `gpt-4o-mini-2024-07-18` (cheap, fast)
- Escalation model (only if needed): `gpt-4.1-mini-2025-04-14` (better instruction/tooling)

You can change these in `src/config/models.ts`.

## What you get
- A serverless endpoint: `POST /api/analyze`
- A pipeline runner that:
  - splits your schema into batches
  - builds Tavily queries
  - fetches snippets (and optional extracts)
  - asks the LLM to produce strict JSON for each batch
  - merges into one final response

## Quick start
1) Copy this folder into your repo (or copy only `src/` + `api/`).
2) Add env vars (see `.env.example`).
3) `npm i`
4) `npm run dev`
5) Call the endpoint with JSON (example below).

### Example request
```json
{
  "properties": [
    {"id":"A","address":"280 N Julia Circle, St Pete Beach, FL 33706"},
    {"id":"B","address":"..."},
    {"id":"C","address":"..."}
  ],
  "schemaPath": "src/schema/fields.example.json",
  "options": {
    "maxBatches": 8,
    "tavilySearchDepth": "basic",
    "tavilyMaxResults": 6,
    "useExtract": true
  }
}
```

### Example response shape
```json
{
  "meta": {...},
  "fields": [
    {
      "key": "living_sqft",
      "label": "Living Area (SqFt)",
      "values": {
        "A": {"value": 1680, "unit":"sqft", "status":"found", "confidence":"high", "sources":[...], "notes":""},
        "B": {...},
        "C": {...}
      }
    }
  ]
}
```

## Notes for production
- Add caching (KV/Redis) for Tavily + LLM responses to reduce repeated costs.
- Keep `tavilySearchDepth` explicitly `basic` unless you really need `advanced`.
- Tune `BATCH_SIZE` and extract limits in `src/config/pipeline.ts`.

