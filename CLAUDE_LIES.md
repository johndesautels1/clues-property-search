# Claude Issues Tracker - Status Update

**Created:** January 6, 2026
**Last Updated:** January 6, 2026
**Purpose:** Track issues and their resolution status

---

## STATUS SUMMARY

| Issue | Status | Fixed Date |
|-------|--------|------------|
| Perplexity 5 prompts not wired | **FIXED** | 2026-01-06 |
| Claude Opus wrong model | **FIXED** | 2026-01-06 |
| GPT model incorrect | **VERIFY** | - |
| Gemini model incorrect | **VERIFY** | - |
| Temperature settings | **VERIFY** | - |
| Centralized LLM config | **TODO** | - |

---

## FIXED ISSUES

### ISSUE #1: Perplexity 5 Prompts - **FIXED**

**Original Problem:** Claude created `perplexity-prompts.ts` but never wired it into the LLM cascade.

**Current Status:** FIXED

**Evidence:**
- `search.ts` lines 38-47: Imports `buildPromptA` through `buildPromptE` from `perplexity-prompts.ts`
- `search.ts` lines 2176-2268: Wrapper functions `callPerplexityPromptA` through `callPerplexityPromptE`
- `search.ts` lines 4431-4437: LLM cascade uses all 5 prompts:
  ```typescript
  { id: 'perplexity-a', fn: (addr) => callPerplexityPromptA(addr, perplexityContext) },
  { id: 'perplexity-b', fn: (addr) => callPerplexityPromptB(addr, perplexityContext) },
  { id: 'perplexity-c', fn: (addr) => callPerplexityPromptC(addr, perplexityContext) },
  { id: 'perplexity-d', fn: (addr) => callPerplexityPromptD(addr, perplexityContext) },
  { id: 'perplexity-e', fn: (addr) => callPerplexityPromptE(addr, perplexityContext) },
  ```

---

### ISSUE #4: Claude Opus Model - **FIXED**

**Original Problem:** `smart-score-llm-consensus.ts` line 212 had wrong model `claude-opus-4-20250514`

**Current Status:** FIXED

**Evidence:**
- `smart-score-llm-consensus.ts` line 212: `model: 'claude-opus-4-5-20251101'`
- All other files also use correct model `claude-opus-4-5-20251101`

---

## ISSUES TO VERIFY

### ISSUE #2: GPT Model

**Required:** `gpt-5.2-pro` with temperature `0.0`

**Files to check:**
- `api/property/search.ts`
- `api/property/retry-llm.ts`
- `api/property/multi-llm-forecast.ts`
- `api/property/smart-score-llm-consensus.ts`

---

### ISSUE #3: Gemini Model

**Required:** `gemini-3-pro-preview` (NOT `-latest`) with temperature `1.0`

**Files to check:**
- `api/property/search.ts`
- `api/property/retry-llm.ts`
- `api/property/multi-llm-forecast.ts`
- `api/property/smart-score-llm-consensus.ts`

---

### ISSUE #5: Temperature Settings

**Required settings:**
| LLM | Temperature |
|-----|-------------|
| GPT | 0.0 |
| Grok | 0.2 |
| Gemini | 1.0 |
| Perplexity | 0.2 |
| Claude Opus | 0.2 |
| Claude Sonnet | 0.2 |

---

## TODO: Centralized LLM Config

**Status:** Not yet implemented

**Plan:** Create `src/config/llm-config.ts` with single source of truth for all LLM configurations.

```typescript
// CORRECT CONFIGURATIONS - USE THESE
export const LLM_CONFIG = {
  perplexity: {
    model: 'sonar-reasoning-pro',
    temperature: 0.2,
    max_tokens: 2500,
    web_search_options: { search_context_size: 'medium' }
  },
  gpt: {
    model: 'gpt-5.2-pro',
    temperature: 0.0,
    max_tokens: 16000
  },
  grok: {
    model: 'grok-3-latest',
    temperature: 0.2,
    max_tokens: 16000
  },
  gemini: {
    model: 'gemini-3-pro-preview',
    temperature: 1.0,
    max_tokens: 2000
  },
  claudeOpus: {
    model: 'claude-opus-4-5-20251101',
    temperature: 0.2,
    max_tokens: 8000
  },
  claudeSonnet: {
    model: 'claude-sonnet-4-5-20250929',
    temperature: 0.2,
    max_tokens: 8000
  }
};
```

---

## Perplexity Architecture (Reference)

The 5 consolidated prompts per Perplexity support:

| Prompt | Purpose | Fields |
|--------|---------|--------|
| A | Listing Portals & Neighborhood Pricing | listing_price, AVMs, beds, baths, sqft, HOA, pool, neighborhood stats |
| B | County / Public Records | parcel_id, sale history, assessed value, taxes, permits, CDD |
| C | Schools, Walkability, Crime | school ratings, walk/transit/bike scores, crime indices |
| D | Utilities & Bills | electric, water, sewer, gas, trash, internet, fiber, cell coverage |
| E | Comparable Sales (Optional) | notable comps, financing terms |

---

## Verification Commands

```bash
# Check Perplexity prompts are wired
grep -rn "callPerplexityPromptA\|callPerplexityPromptB" api/property/search.ts

# Check Claude Opus model
grep -rn "claude-opus-4-5-20251101" --include="*.ts"

# Check for wrong Claude model (should return nothing in .ts files)
grep -rn "claude-opus-4-20250514" --include="*.ts"

# Build check
npm run build
```

---

**END OF DOCUMENT**
