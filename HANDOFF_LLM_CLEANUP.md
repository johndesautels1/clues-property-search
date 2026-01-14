# CLUES Property Dashboard - LLM Cleanup Handoff

**Created:** 2026-01-05
**Conversation ID:** LLM-CLEANUP-001
**Status:** Ready for new conversation

---

## COMPLETED IN THIS SESSION

### Build Fixes (CRITICAL - DO NOT REVERT)
1. **Commit `772fc29`** - Fixed TypeScript build errors for AVM sub-fields (16a-16f)
   - `src/types/fields-schema.ts` - Changed `num: number` to `num: number | string`
   - `src/components/SMARTScoreDiagnostic.tsx` - Fixed type annotation

2. **Commit `2723787`** - ~~Fixed Vercel runtime error~~ **REVERTED - THIS WAS WRONG**
   - Added `with { type: 'json' }` to all JSON imports - **CAUSED 500 ERRORS**
   - **Fixed in commit `0ebd16b`** - Inlined JSON data instead
   - ES2025 import attributes are NOT supported in Vercel's Node.js runtime

3. **Commit `a898ef7`** - Added 4 missing tabs to Compare.tsx (Advanced Market Analysis)
   - Renamed 21 tabs to match 23 schema groups
   - Added: Permits & Renovations, Additional Features, Features, Market Performance

### LLM Prompt Standardization (DONE)
- All 4 LLMs now have Olivia CMA prompts with full 181-field schema breakdown
- All 4 LLMs now have 34 high-velocity field definitions
- Perplexity Field Completer prompt added

---

## TASKS FOR NEW CONVERSATION

### Task 1: Clean Up Claude Opus/Sonnet Prompts & Version Naming

**Current State - NEEDS AUDIT:**
```
Files to check:
- api/property/multi-llm-forecast.ts (main LLM prompts file)
- api/property/search.ts (search endpoint)
- api/property/retry-llm.ts (retry endpoint)
- src/llm/orchestrator.ts (orchestrator)
- src/services/llmClient.ts (LLM client)
```

**Model Versions Already Standardized:**
| LLM | Model ID | Status |
|-----|----------|--------|
| GPT | `gpt-4o-2025-12-11` | DONE |
| Gemini | `gemini-3-pro` | DONE |
| Grok | `grok-4-1-fast-reasoning` | DONE |
| Perplexity | `sonar-pro` | DONE |
| Claude Opus | `claude-opus-4-5-20251101` | NEEDS VERIFICATION |
| Claude Sonnet | ??? | NEEDS VERIFICATION |

**Questions to Answer:**
1. What Claude model versions are currently in the codebase?
2. Are there any outdated Claude model references?
3. Do Claude prompts match the same structure as other LLMs?

### Task 2: Establish Exact LLM Firing Order

**Current Architecture (needs verification):**

```
PROPERTY SEARCH FLOW:
┌─────────────────────────────────────────────────────────────────┐
│ 1. User enters address                                          │
├─────────────────────────────────────────────────────────────────┤
│ 2. TIER 1: Google Places API (geocoding, photos)                │
│ 3. TIER 2: Stellar MLS API (listing data)                       │
│ 4. TIER 3: County Property Appraiser (tax/deed)                 │
│ 5. TIER 4: Free APIs (parallel)                                 │
│    - FEMA, NOAA, USGS, EPA, FBI Crime, Google Solar, etc.       │
├─────────────────────────────────────────────────────────────────┤
│ 6. TIER 5: LLM Web Search (34 missing fields)                   │
│    - Perplexity sonar-pro (primary)                   │
│    - Grok grok-4-1-fast-reasoning (fallback)                    │
│    - Gemini gemini-3-pro (fallback)                             │
│    - GPT gpt-4o (fallback)                                 │
├─────────────────────────────────────────────────────────────────┤
│ 7. TIER 6: Claude Opus (schema normalization, NO web search)    │
└─────────────────────────────────────────────────────────────────┘

ASK OLIVIA FLOW (After property loaded):
┌─────────────────────────────────────────────────────────────────┐
│ User clicks "Ask Olivia" for CMA analysis                       │
├─────────────────────────────────────────────────────────────────┤
│ All 4 LLMs called in parallel for Olivia CMA:                   │
│ - GPT-4o (Olivia CMA prompt)                                   │
│ - Gemini 3 Pro (Olivia CMA prompt)                              │
│ - Grok 4.1 (Olivia CMA prompt)                                  │
│ - Perplexity (Olivia CMA prompt)                                │
├─────────────────────────────────────────────────────────────────┤
│ Results aggregated → Consensus report generated                 │
└─────────────────────────────────────────────────────────────────┘
```

**Files Defining LLM Order:**
- `api/property/search.ts` - Main search flow
- `api/property/multi-llm-forecast.ts` - Olivia CMA parallel calls
- `src/llm/orchestrator.ts` - Two-stage workflow

### Task 3: Reset All API & LLM Timeouts

**Current Timeout Table (NEEDS VERIFICATION/UPDATE):**

| API/LLM | Current Timeout | Recommended | Notes |
|---------|----------------|-------------|-------|
| Google Places | ? | 10s | Fast, rarely fails |
| Stellar MLS | ? | 30s | Can be slow |
| County APIs | ? | 30s | Often slow/unreliable |
| FEMA | ? | 15s | Usually fast |
| NOAA | ? | 15s | Usually fast |
| FBI Crime | ? | 15s | Usually fast |
| Perplexity | ? | 45s | Deep research takes time |
| Grok | ? | 30s | Fast reasoning |
| Gemini | ? | 30s | With Google Search |
| GPT | ? | 30s | Standard |
| Claude Opus | ? | 60s | Schema normalization |

**Vercel Function Limits:**
- Pro plan: 60s max per function
- Need to ensure no single call exceeds 55s (buffer)

**Files to Update:**
```
api/property/search.ts - export const config = { maxDuration: 60 }
api/property/retry-llm.ts - export const config = { maxDuration: 60 }
api/property/multi-llm-forecast.ts - timeouts for each LLM
src/services/llmClient.ts - default timeout
src/llm/orchestrator.ts - micro-prompt timeouts
```

---

## KEY FILES REFERENCE

### LLM Configuration Files
```
D:\Clues_Quantum_Property_Dashboard\
├── api/property/
│   ├── multi-llm-forecast.ts    # All 4 LLM Olivia CMA prompts
│   ├── search.ts                # Main search endpoint (4500+ lines)
│   └── retry-llm.ts             # Single field retry endpoint
├── src/config/
│   ├── gemini-prompts.ts        # Gemini Field Completer + Olivia CMA
│   ├── clues_missing_fields_list.json  # 34 high-velocity fields
│   └── clues_missing_fields_rules.json # Field extraction rules
├── src/llm/
│   ├── orchestrator.ts          # Two-stage LLM workflow
│   └── prompts/
│       ├── microPromptLibrary.ts # WalkScore, Crime, Climate, POI prompts
│       └── coreSchemaPrompt.ts   # Claude schema normalizer prompt
└── src/services/
    └── llmClient.ts             # LLM client abstraction
```

### Schema Files
```
src/types/fields-schema.ts       # SOURCE OF TRUTH - 181 fields
src/lib/field-normalizer.ts      # Field normalization
```

---

## 34 HIGH-VELOCITY FIELDS (Web-Searched Daily)

These are the fields that require live web search via LLMs:

```
AVMs (7 fields):
- 12_market_value_estimate
- 16a_zestimate, 16b_redfin_estimate, 16c_first_american_avm
- 16d_quantarium_avm, 16e_ice_avm, 16f_collateral_analytics_avm

Portal Views (5 fields):
- 169_zillow_views, 170_redfin_views, 171_homes_views
- 172_realtor_views, 174_saves_favorites

Market Indicators (9 fields):
- 91_median_home_price_neighborhood, 92_price_per_sqft_recent_avg
- 95_days_on_market_avg, 96_inventory_surplus
- 175_market_type, 176_avg_sale_to_list_percent
- 177_avg_days_to_pending, 178_multiple_offers_likelihood, 180_price_trend

Rental Estimates (2 fields):
- 98_rental_estimate_monthly, 181_rent_zestimate

Utilities (8 fields):
- 104_electric_provider, 105_avg_electric_bill
- 106_water_provider, 107_avg_water_bill
- 110_trash_provider, 111_internet_providers_top3, 114_cable_tv_provider

Location (2 fields):
- 81_public_transit_access, 82_commute_to_city_center

Insurance (1 field):
- 97_insurance_est_annual
```

---

## PROMPT TO START NEW CONVERSATION

```
I'm continuing work on the CLUES Property Dashboard. Please read the handoff file:

D:\Clues_Quantum_Property_Dashboard\HANDOFF_LLM_CLEANUP.md

Tasks to complete:
1. Audit and clean up Claude Opus/Sonnet model versions and prompts
2. Document the exact LLM firing order in the codebase
3. Reset all API and LLM timeouts with proper values

Start by reading these files to understand current state:
- api/property/multi-llm-forecast.ts
- api/property/search.ts
- src/services/llmClient.ts
- src/llm/orchestrator.ts
```

---

## NOTES

- Build is now passing (commits 772fc29, 2723787)
- ~~All JSON imports have `with { type: 'json' }` attribute~~ **WRONG - Reverted. JSON data inlined instead.**
- 181-field schema is stable - DO NOT modify field numbers
- Compare.tsx now has 25 tabs matching all schema groups
