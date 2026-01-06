# CLUES Property Dashboard - LLM Architecture Documentation

**Created:** 2026-01-05
**Conversation ID:** CLUES-2026-0105-LLM-CLEANUP
**Last Updated:** 2026-01-06

---

## Model Version Table

| # | LLM | Model ID | Web Search | Tier | Reliability |
|---|-----|----------|------------|------|-------------|
| 1 | **Perplexity** | `sonar-pro` | ✅ Built-in | 4 | 90% |
| 2 | **Gemini** | `gemini-3-pro-preview` | ✅ Google Search grounding | 4 | 85% |
| 3 | **GPT** | `gpt-5.2-pro` | ✅ Web evidence mode | 4 | 80% |
| 4 | **Grok** | `grok-4-1-fast-reasoning` | ✅ X/Twitter data | 4 | 75% |
| 5 | **Claude Sonnet** | `claude-sonnet-4-5-20250929` | ✅ Beta (web-search-2025-03-05) | 5 | 70% |
| 6 | **Claude Opus** | `claude-opus-4-5-20251101` | ❌ No (pure reasoning) | 5 | 65% |

---

## LLM Cascade Order (Updated 2026-01-06)

**NEW ORDER: Perplexity → Gemini → GPT → Grok → Sonnet → Opus**

```
┌─────────────────────────────────────────────────────────────────────┐
│ LLM_CASCADE_ORDER (Web-search first → Pure reasoning last)         │
├─────────────────────────────────────────────────────────────────────┤
│ #1. PERPLEXITY     (Tier 4) - Deep web search (HIGHEST PRIORITY)   │
│ #2. GEMINI         (Tier 4) - Google Search grounding              │
│ #3. GPT            (Tier 4) - Web evidence mode                    │
│ #4. GROK           (Tier 4) - X/Twitter real-time data             │
│ #5. CLAUDE SONNET  (Tier 5) - Web search beta (fills gaps)         │
│ #6. CLAUDE OPUS    (Tier 5) - Deep reasoning, NO web search (LAST) │
└─────────────────────────────────────────────────────────────────────┘
```

**Rationale:**
- Web-search LLMs (1-4) are Tier 4 - they verify real data from the web
- Claude Sonnet (#5) is Tier 5 - has web search beta but lower reliability
- Claude Opus (#6) is Tier 5 LAST - no web search, pure reasoning only

---

## Complete Data Source Tier Hierarchy

```
TIER 1: Stellar MLS (via Bridge API)
   └── Authoritative listing data when eKey obtained

TIER 2: Google APIs
   ├── Geocode (address verification)
   └── Places (photos, POIs, schools)

TIER 3: Paid/Free APIs (parallel execution)
   ├── WalkScore API
   ├── SchoolDigger / GreatSchools
   ├── AirNow (air quality)
   ├── HowLoud (noise levels)
   ├── FEMA Risk Index
   ├── NOAA (climate, storms, sea level)
   ├── USGS (elevation, earthquakes)
   ├── EPA FRS (environmental)
   ├── FBI Crime Stats
   ├── U.S. Census (vacancy rate)
   ├── Google Solar API
   └── Google Street View

TIER 4: Web-Search LLMs (cascade order)
   ├── #1 Perplexity - sonar-pro
   ├── #2 Gemini - gemini-3-pro-preview (Google Search grounding)
   ├── #3 GPT - gpt-5.2-pro (Web evidence mode)
   └── #4 Grok - grok-4-1-fast-reasoning (X/Twitter)

TIER 5: Claude LLMs
   ├── #5 Claude Sonnet - web search beta (fills gaps)
   └── #6 Claude Opus - deep reasoning, NO web search (LAST)
```

---

## Timeout Configuration (Updated 2026-01-06)

### Vercel Function Limits (maxDuration)
| File | maxDuration | Purpose |
|------|-------------|---------|
| search.ts | 300s (5 min) | Main property search |
| search-stream.ts | 300s (5 min) | Streaming search |
| search-by-mls.ts | 300s (5 min) | MLS search |
| multi-llm-forecast.ts | 300s (5 min) | 6-LLM Olivia CMA |
| **retry-llm.ts** | **300s (5 min)** | Single field retry (Perplexity needs 180s) |
| parse-mls-pdf.ts | 120s (2 min) | PDF parsing |
| census.ts | 60s | Census API |
| bridge-mls.ts | 30s | Bridge MLS direct |
| broker-dashboard.ts | 30s | Broker dashboard |

### LLM Timeout Constants (Updated 2026-01-06)
| Constant | search.ts | retry-llm.ts | Notes |
|----------|-----------|--------------|-------|
| **LLM_TIMEOUT** | 60000 (60s) | 60000 (60s) | All non-Perplexity LLMs |
| **PERPLEXITY_TIMEOUT** | 180000 (180s) | 180000 (180s) | Perplexity deep web search |

### Free API Timeouts (free-apis.ts)
| API | Timeout | Notes |
|-----|---------|-------|
| FEMA-Flood | 60s | Flood zone data |
| FEMA-Risk | 10s | Risk index (fast endpoint) |
| GreatSchools | 15s | School ratings |
| NOAA-Climate | 60s | Climate data |
| NOAA-Storm | 60s | Storm events |
| NOAA-SeaLevel | 60s | Sea level rise data |
| USGS-Elevation | 60s | Elevation data |
| USGS-Earthquake | 60s | Earthquake risk |
| EPA-FRS | 60s | Environmental facilities |

---

## File Reference: Where Each LLM is Configured

### LLM Constants (SOURCE OF TRUTH)
**File:** `api/property/llm-constants.ts`
- LLM_CASCADE_ORDER array
- LLM_DISPLAY_NAMES mapping

**File:** `src/lib/llm-constants.ts` (Frontend mirror - KEEP IN SYNC)
- Same constants for frontend components

### Arbitration System
**File:** `api/property/arbitration.ts`
- DATA_TIERS with tier and reliability scores
- Tier 4: Perplexity, Gemini, GPT, Grok
- Tier 5: Claude Sonnet, Claude Opus

### Primary Search Flow
**File:** `api/property/search.ts`
- Main property search endpoint
- LLM cascade array at lines 5285-5290
- Timeout constants at lines 37-38

### Retry Single Field
**File:** `api/property/retry-llm.ts`
- Single field retry from PropertyDetail
- Engine mapping at lines 1170-1177
- Timeout constants at lines 39-40

### Multi-LLM Forecast (Olivia CMA)
**File:** `api/property/multi-llm-forecast.ts`
- 6 LLMs called in parallel (lines 856-863)
- Sources array (line 868)

### LLM Client (Orchestrator)
**File:** `src/services/llmClient.ts`
- Perplexity: sonar-pro
- Claude Opus: claude-opus-4-5-20251101

### Two-Stage Orchestrator
**File:** `src/llm/orchestrator.ts`
- Stage 1: Parallel micro-prompts (Perplexity with web search)
- Stage 2: Core schema normalizer (Claude Opus without web)

---

## 34 High-Velocity Fields (Web-Searched Daily)

These fields change frequently and require live web search via LLMs:

### AVMs (7 fields)
- `12_market_value_estimate`
- `16a_zestimate`, `16b_redfin_estimate`, `16c_first_american_avm`
- `16d_quantarium_avm`, `16e_ice_avm`, `16f_collateral_analytics_avm`

### Portal Views (5 fields)
- `169_zillow_views`, `170_redfin_views`, `171_homes_views`
- `172_realtor_views`, `174_saves_favorites`

### Market Indicators (9 fields)
- `91_median_home_price_neighborhood`, `92_price_per_sqft_recent_avg`
- `95_days_on_market_avg`, `96_inventory_surplus`
- `175_market_type`, `176_avg_sale_to_list_percent`
- `177_avg_days_to_pending`, `178_multiple_offers_likelihood`, `180_price_trend`

### Rental Estimates (2 fields)
- `98_rental_estimate_monthly`, `181_rent_zestimate`

### Utilities (8 fields)
- `104_electric_provider`, `105_avg_electric_bill`
- `106_water_provider`, `107_avg_water_bill`
- `110_trash_provider`, `111_internet_providers_top3`, `114_cable_tv_provider`

### Location (2 fields)
- `81_public_transit_access`, `82_commute_to_city_center`

### Insurance (1 field)
- `97_insurance_est_annual`

---

## Claude-Specific Configuration

### Claude Sonnet 4.5 (Web Search Enabled)
```typescript
// retry-llm.ts and multi-llm-forecast.ts
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'web-search-2025-03-05',  // Required for web search
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-5-20250929',
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    // ...
  }),
});
```

### Claude Opus 4.5 (No Web Search)
```typescript
// llmClient.ts, retry-llm.ts, multi-llm-forecast.ts
// NOTE: web_search NOT supported on Opus - removed per Anthropic docs
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-opus-4-5-20251101',
    // NO tools, NO betas - pure reasoning
  }),
});
```

---

## Environment Variables Required

```bash
ANTHROPIC_API_KEY=sk-ant-...     # Claude Sonnet & Opus
OPENAI_API_KEY=sk-...            # GPT-5.2
GEMINI_API_KEY=...               # Gemini 3 Pro
PERPLEXITY_API_KEY=pplx-...      # Perplexity Sonar
XAI_API_KEY=...                  # Grok (xAI) - NOT GROK_API_KEY!
```

---

## Quick Reference: LLM Function Locations

| Function | File | Line | Model |
|----------|------|------|-------|
| `callPerplexityForecast` | multi-llm-forecast.ts | 456 | sonar-pro |
| `callGeminiForecast` | multi-llm-forecast.ts | 610 | gemini-3-pro-preview |
| `callGPT5Forecast` | multi-llm-forecast.ts | 354 | gpt-5.2-pro |
| `callGrokForecast` | multi-llm-forecast.ts | 705 | grok-4-1-fast-reasoning |
| `callClaudeForecast` | multi-llm-forecast.ts | 244 | claude-sonnet-4-5-20250929 |
| `callClaudeOpusForecast` | multi-llm-forecast.ts | 304 | claude-opus-4-5-20251101 |
| `callClaudeOpus` | llmClient.ts | 90 | claude-opus-4-5-20251101 |
| `callPerplexity` | llmClient.ts | 24 | sonar-pro |

---

## Change Log

| Date | Change | Files Modified |
|------|--------|----------------|
| 2026-01-06 | **LLM CASCADE REORDER**: Perplexity→Gemini→GPT→Grok→Sonnet→Opus | 8 files |
| 2026-01-06 | **TIMEOUT UPDATE**: LLM=60s, Perplexity=180s | search.ts, retry-llm.ts |
| 2026-01-06 | **TIER UPDATE**: Gemini/GPT/Grok moved to Tier 4 | arbitration.ts |
| 2026-01-06 | **retry-llm.ts maxDuration**: Increased to 300s for Perplexity | retry-llm.ts |
| 2026-01-05 | Initial LLM documentation created | LLM_DOCUMENTATION.md |

---

## Files Modified in This Update

1. `api/property/search.ts` - Timeouts, cascade order, comments
2. `api/property/retry-llm.ts` - Timeouts, maxDuration, engine mapping
3. `api/property/llm-constants.ts` - LLM_CASCADE_ORDER
4. `src/lib/llm-constants.ts` - LLM_CASCADE_ORDER (frontend)
5. `api/property/multi-llm-forecast.ts` - Promise order, sources array
6. `api/property/arbitration.ts` - DATA_TIERS, tier assignments, comments
7. `LLM_DOCUMENTATION.md` - This file

---

## COMPLETE TIMEOUT TABLE

| File | Constant/Setting | Value | Purpose |
|------|------------------|-------|---------|
| search.ts | `maxDuration` | 300s | Vercel function limit |
| search.ts | `STELLAR_MLS_TIMEOUT` | 30s | Bridge MLS API |
| search.ts | `FREE_API_TIMEOUT` | 90s | All free APIs |
| search.ts | `LLM_TIMEOUT` | **60s** | Non-Perplexity LLMs |
| search.ts | `PERPLEXITY_TIMEOUT` | **180s** | Perplexity deep search |
| retry-llm.ts | `maxDuration` | 300s | Vercel function limit |
| retry-llm.ts | `LLM_TIMEOUT` | **60s** | Non-Perplexity LLMs |
| retry-llm.ts | `PERPLEXITY_TIMEOUT` | **180s** | Perplexity deep search |
| multi-llm-forecast.ts | `maxDuration` | 300s | 6 parallel LLM calls |
| free-apis.ts | FEMA-Flood | 60s | Flood zone |
| free-apis.ts | FEMA-Risk | 10s | Risk index |
| free-apis.ts | GreatSchools | 15s | School ratings |
| free-apis.ts | NOAA-Climate | 60s | Climate data |
| free-apis.ts | NOAA-Storm | 60s | Storm events |
| free-apis.ts | USGS-Elevation | 60s | Elevation |
| free-apis.ts | USGS-Earthquake | 60s | Earthquake risk |
| free-apis.ts | EPA-FRS | 60s | Environmental |
