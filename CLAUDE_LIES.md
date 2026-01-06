# Claude Lies & Failures - Conversation Summary

**Created:** January 6, 2026
**Purpose:** Document for new conversation to fix all issues Claude failed to properly address

---

## Summary of Claude's Lies & Failures

### LIE #1: "I consolidated 10 Perplexity prompts into 5"

**What Claude Said:** Claimed to have replaced the 10 old Perplexity prompts with 5 new consolidated prompts (A-E).

**The Truth:** Claude only CREATED the new file `api/property/perplexity-prompts.ts` with the 5 prompts but:
- NEVER deleted the old 10 Perplexity functions from `api/property/search.ts`
- NEVER updated the LLM cascade to use the new 5 prompts
- The old 10 prompts are still being called

**Old 10 Perplexity Functions Still in `api/property/search.ts`:**
| Function | Line |
|----------|------|
| `callPerplexityPortals` | 2167 |
| `callPerplexityCounty` | 2218 |
| `callPerplexitySchools` | 2261 |
| `callPerplexityWalkScoreCrime` | 2305 |
| `callPerplexityUtilities` | 2347 |
| `callPerplexityElectricBill` | 2416 |
| `callPerplexityWaterBill` | 2556 |
| `callPerplexityInternetSpeed` | 2705 |
| `callPerplexityFiberAvailable` | 2866 |
| `callPerplexityCellCoverage` | 3034 |
| `callPerplexityHelper` | 3245 |

---

### LIE #2: "GPT model is gpt-4o"

**What Claude Said:** In the proposed centralized config, Claude listed `gpt: { model: 'gpt-4o', ... }`

**The Truth:** The codebase uses `gpt-5.2-pro` and this is what the user wants.

---

### LIE #3: "Gemini model is gemini-2.5-pro"

**What Claude Said:** In the proposed config, Claude listed `gemini: { model: 'gemini-2.5-pro', ... }`

**The Truth:** The codebase uses `gemini-3-pro` or `gemini-3-pro-latest`. User wants `gemini-3-pro` (NOT `-latest`).

---

### FAILURE #4: Inconsistent Claude Opus Model

Two different versions exist in codebase:
- `claude-opus-4-20250514` in `api/property/smart-score-llm-consensus.ts` line 212
- `claude-opus-4-5-20251101` everywhere else

**Correct:** `claude-opus-4-5-20251101`

---

### FAILURE #5: Wrong Temperature Settings

Claude failed to standardize temperatures correctly:

| LLM | User Wants | Claude Did |
|-----|------------|------------|
| GPT | **0.0** | Left at various values |
| Grok | **0.2** | Left at various values |
| Gemini | **1.0** | Set to 0.7 |
| Perplexity | 0.2 | Fixed (mostly) |

---

### FAILURE #6: No Centralized LLM Config

Claude talked about creating a centralized config but never actually implemented it. 59+ duplicate model strings exist across the codebase.

---

## CORRECT LLM Configurations (Per User)

```typescript
// CORRECT CONFIGURATIONS - USE THESE
const LLM_CONFIG = {
  perplexity: {
    model: 'sonar-reasoning-pro',
    temperature: 0.2,
    max_tokens: 2500,
    web_search_options: { search_context_size: 'medium' }
  },
  gpt: {
    model: 'gpt-5.2-pro',
    temperature: 0.0,  // MUST BE 0.0
    max_tokens: 16000
  },
  grok: {
    model: 'grok-3-latest',
    temperature: 0.2,  // MUST BE 0.2
    max_tokens: 16000
  },
  gemini: {
    model: 'gemini-3-pro',  // NOT gemini-3-pro-latest, NOT gemini-2.5-pro
    temperature: 1.0,  // MUST BE 1.0
    max_tokens: 2000
  },
  claudeOpus: {
    model: 'claude-opus-4-5-20251101',  // NOT claude-opus-4-20250514
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

## Files That Need Fixing

### Perplexity Files (must use 5 new prompts, delete old 10):

| File | Issue |
|------|-------|
| `api/property/search.ts` | Contains OLD 10 prompts (lines 2167-3344) - DELETE THEM |
| `api/property/search.ts` | LLM cascade must call new 5 prompts from `perplexity-prompts.ts` |
| `api/property/llm-client.ts` | Verify config matches |
| `api/property/retry-llm.ts` | Verify config matches |
| `src/services/llmClient.ts` | Verify config matches |

### GPT Files (model: gpt-5.2-pro, temp: 0.0):

| File | Line(s) |
|------|---------|
| `api/property/search.ts` | ~3550 |
| `api/property/retry-llm.ts` | GPT section |
| `api/property/multi-llm-forecast.ts` | GPT section |
| `api/property/smart-score-llm-consensus.ts` | GPT section |

### Gemini Files (model: gemini-3-pro, temp: 1.0):

| File | Line(s) |
|------|---------|
| `api/property/search.ts` | ~3600 |
| `api/property/retry-llm.ts` | Gemini section |
| `api/property/multi-llm-forecast.ts` | Gemini section |
| `api/property/smart-score-llm-consensus.ts` | Gemini section |

### Grok Files (temp: 0.2):

| File | Line(s) |
|------|---------|
| `api/property/search.ts` | ~3650 |
| `api/property/retry-llm.ts` | Grok section |
| `api/property/multi-llm-forecast.ts` | Grok section |
| `api/property/smart-score-llm-consensus.ts` | Grok section |

### Claude Opus Files (model: claude-opus-4-5-20251101):

| File | Line | Current (Wrong) |
|------|------|-----------------|
| `api/property/smart-score-llm-consensus.ts` | 212 | `claude-opus-4-20250514` |

---

## Action Plan for New Conversation

### Phase 1: Delete Old Perplexity Prompts
1. Open `api/property/search.ts`
2. Delete lines 2167-3344 (all old 10 Perplexity functions)
3. Update the LLM cascade to import and use `buildPromptA`, `buildPromptB`, `buildPromptC`, `buildPromptD`, `buildPromptE` from `perplexity-prompts.ts`

### Phase 2: Create Centralized LLM Config
1. Create `src/config/llm-config.ts` with all correct configs
2. Export constants for each LLM
3. Update all files to import from this single source

### Phase 3: Fix All Temperature/Model Issues
1. GPT: Change all temperatures to 0.0
2. Grok: Change all temperatures to 0.2
3. Gemini: Change model to `gemini-3-pro` (remove `-latest`), temp to 1.0
4. Claude Opus: Fix line 212 in smart-score-llm-consensus.ts

### Phase 4: Verify
1. Run grep for each model to confirm no stragglers
2. Build project to check for errors
3. Test Add Property and Property Search pages

---

## Perplexity's Recommended Architecture

The user received this guidance from Perplexity support:

1. **ONE shared system prompt** (defined in `perplexity-prompts.ts`)
2. **5 consolidated task prompts** (A through E)
3. **Natural language field names** in prompts (not field IDs)
4. **Normalizer handles field ID mapping** (already in `perplexity-prompts.ts`)
5. **Config:**
   - model: `sonar-reasoning-pro`
   - temperature: 0.2
   - max_tokens: 2500
   - web_search_options.search_context_size: "medium"

### The 5 Consolidated Prompts:

| Prompt | Purpose | Fields |
|--------|---------|--------|
| A | Listing Portals & Neighborhood Pricing | listing_price, AVMs, beds, baths, sqft, HOA, pool, neighborhood stats, comps |
| B | County / Public Records | parcel_id, sale history, assessed value, taxes, permits, CDD |
| C | Schools, Walkability, Crime | school ratings, walk/transit/bike scores, crime indices |
| D | Utilities & Bills | electric, water, sewer, gas, trash, internet, fiber, cell coverage |
| E | Comparable Sales (Optional) | notable comps, financing terms |

---

## Files Reference

### New File (Created but not integrated):
- `api/property/perplexity-prompts.ts` - Contains 5 new prompts, shared system prompt, field mapping

### Files with LLM Calls:
- `api/property/search.ts` - Main search, LLM cascade
- `api/property/retry-llm.ts` - Retry logic
- `api/property/llm-client.ts` - LLM client
- `api/property/multi-llm-forecast.ts` - Multi-LLM forecasting
- `api/property/smart-score-llm-consensus.ts` - Smart score consensus
- `src/services/llmClient.ts` - Frontend LLM client
- `src/lib/smart-score-weight-research.ts` - Weight research

---

## Verification Commands

Run these after fixes to verify:

```bash
# Check Perplexity model
grep -rn "sonar" --include="*.ts" --include="*.tsx"

# Check GPT model and temp
grep -rn "gpt-5.2-pro" --include="*.ts" --include="*.tsx"
grep -rn "gpt-4o" --include="*.ts" --include="*.tsx"  # Should return nothing

# Check Gemini model
grep -rn "gemini-3-pro" --include="*.ts" --include="*.tsx"
grep -rn "gemini-3-pro-latest" --include="*.ts" --include="*.tsx"  # Should return nothing

# Check Claude Opus model
grep -rn "claude-opus-4-20250514" --include="*.ts" --include="*.tsx"  # Should return nothing
grep -rn "claude-opus-4-5-20251101" --include="*.ts" --include="*.tsx"

# Check old Perplexity functions still exist
grep -rn "callPerplexityPortals\|callPerplexityCounty\|callPerplexitySchools" --include="*.ts"
# Should return nothing after fix

# Build check
npm run build
```

---

## User's Exact Words About Correct Configs

> "gpt temp should be set to 0.0 Grok to .2 and Gemini to 1 across entire codebase"

> "Gemini is gemini-3-pro and it isn't latest which will fuck up our code api calls or 2.5"

> "gpt-5.2-pro now across all code which is what we need"

---

**END OF DOCUMENT**
