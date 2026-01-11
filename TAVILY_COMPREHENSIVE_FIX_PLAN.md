# TAVILY COMPREHENSIVE FIX PLAN
## Systematic Fixes for ALL Files in Codebase

**Date:** 2026-01-10
**Scope:** Fix EVERY file that uses Tavily across entire codebase
**Approach:** Systematic, respecting source of truth, Florida-only intentional

---

## USER REQUIREMENTS CLARIFIED

### ✅ CONFIRMED REQUIREMENTS:

1. **Florida-Only App:** Hardcoded FL utilities are CORRECT - this is intentional
   - BUT need fallback logic: Try Tavily/LLM first → If fails, fallback to hardcoded

2. **LLM Tool Access:**
   - ❌ **Do NOT** give Tavily to Perplexity (it's doing great with native search)
   - ❌ **Do NOT** give Tavily to Opus (it's the analyst for data already obtained)
   - ✅ **DO** give Tavily to Gemini (currently uses Google Search native)
   - ✅ **DO** give Tavily to Sonnet (currently uses web_search_20250305 native)
   - ✅ Grok already has Tavily ✅
   - ✅ GPT-5 already has Tavily ✅

3. **Portal Views:** User asks "what does remove mean?"
   - **Answer:** Fields 169-174 (Zillow Views, Redfin Views, etc.) search for view counts that portals don't publish
   - **Action:** Remove from TIER 3 auto-search OR mark as "unavailable" with zero API calls

4. **Retry with Tavily Buttons:** Each should fetch ONLY its specific field
   - **Status:** ✅ VERIFIED WORKING CORRECTLY (see RETRY_WITH_TAVILY_55_BUTTONS_AUDIT.md)

5. **AVM Subfields:** Need database paths but "cannot break chain of source of truth"
   - **Action:** Respect `fields-schema.ts` as source of truth, add nested paths under `financial`

6. **Prompt Updates:** ~60 Tavily prompts + numerous LLM prompts
   - **User Concern:** How to accurately and completely update all of them?
   - **Answer:** Systematic approach with checklist (see below)

7. **Comprehensive Fixes:** "You MUST fix ALL files in the code!"
   - **Action:** Complete file inventory and fix checklist

---

## COMPLETE FILE INVENTORY

### Files Using Tavily (11 total):

| # | File Path | Purpose | Tavily Usage | Needs Fix |
|---|-----------|---------|--------------|-----------|
| 1 | `api/property/search.ts` | Main cascade | TIER 3 calls `runTavilyTier3()`, Grok/GPT tool calls | ✅ YES - Add Gemini/Sonnet tools, utility fallback |
| 2 | `api/property/tavily-search.ts` | TIER 3 implementation | Direct Tavily API calls for 16 fields | ✅ YES - Remove portal views, utility fallback |
| 3 | `api/property/fetch-tavily-field.ts` | Single field API endpoint | Sequential queries for 55 fields | ✅ YES - Add AVM subfield support |
| 4 | `api/property/tavily-field-config.ts` | Field configurations | Search queries + extraction patterns for 55 fields | ✅ YES - Update all prompts |
| 5 | `api/property/tavily-field-database-mapping.ts` | Database paths | Maps 49 fields to nested paths | ✅ YES - Add 6 AVM subfields |
| 6 | `api/property/tavily-field-fetcher.ts` | Helper (UNUSED) | Parallel queries | ❌ DELETE - Dead code |
| 7 | `api/property/retry-llm.ts` | LLM retry logic | Tavily tool for Grok | ✅ YES - Add Gemini/Sonnet, utility fallback |
| 8 | `api/property/multi-llm-forecast.ts` | Forecast consensus | Tavily tool for Grok | ✅ YES - Add Gemini/Sonnet, utility fallback |
| 9 | `api/property/smart-score-llm-consensus.ts` | Smart score | Tavily tool for Grok | ✅ YES - Add Gemini/Sonnet, utility fallback |
| 10 | `src/pages/PropertyDetail.tsx` | UI | Button wiring | ✅ YES - Add AVM subfields to maps |
| 11 | `src/types/fields-schema.ts` | Field definitions | **SOURCE OF TRUTH** | ⚠️ READ ONLY - Do not modify |

**Total Files to Fix:** 9 files (excluding dead code and source of truth)

---

## ISSUE #1: LLM TOOL ACCESS

### Current State:
| LLM | Has Tavily? | Tool Type | Status |
|-----|-------------|-----------|--------|
| **Grok** | ✅ YES | Custom `callTavilySearch()` | ✅ Correct |
| **GPT-5** | ✅ YES | Custom `callTavilySearch()` | ✅ Correct |
| **Gemini** | ❌ NO | Native Google Search | 🔴 Should have Tavily |
| **Sonnet** | ❌ NO | Native web_search_20250305 | 🔴 Should have Tavily |
| **Opus** | ❌ NO | None | ✅ Correct - it's the analyst |
| **Perplexity** | ❌ NO | Native web search | ✅ Correct - doing great |

### Fix Required:
Add Tavily tool to Gemini and Sonnet in 4 files:

#### File 1: `api/property/search.ts`
**Lines to modify:**
- ~4598: `callGemini()` - Add tools array with Tavily function
- ~3747: `callClaudeSonnet()` - Replace native web_search with Tavily

**Implementation:**
```typescript
// For Gemini (line ~4624):
tools: [
  { google_search: {} },  // Keep native as fallback
  {
    type: 'function',
    function: {
      name: 'tavily_search',
      description: 'Search the web for current property data using Tavily',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          num_results: { type: 'number', description: 'Max results (1-10)', default: 5 }
        },
        required: ['query']
      }
    }
  }
],

// For Sonnet (line ~3772):
tools: [
  {
    type: 'web_search_20250305',  // Keep native as fallback
    name: 'web_search',
  },
  {
    type: 'custom',
    name: 'tavily_search',
    description: 'Search web for specific property data',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        num_results: { type: 'number', description: 'Max results', default: 5 }
      },
      required: ['query']
    }
  }
]
```

#### File 2: `api/property/retry-llm.ts`
**Lines to modify:** Same pattern as search.ts for Gemini/Sonnet calls

#### File 3: `api/property/multi-llm-forecast.ts`
**Lines to modify:** Same pattern for Gemini/Sonnet calls

#### File 4: `api/property/smart-score-llm-consensus.ts`
**Lines to modify:** Same pattern for Gemini/Sonnet calls

---

## ISSUE #2: UTILITY PROVIDER FALLBACK LOGIC

### Requirement:
"We want Tavily or LLMs to find the right utility providers, but if they don't find them, we need fallback to hardcoded FL data. This needs to be done in ALL codebase files, not just a few."

### Files with Utility Logic (5 total):

| File | Current Logic | Needs Fallback |
|------|---------------|----------------|
| `tavily-search.ts` | ❌ Only hardcoded FL patterns | ✅ YES |
| `search.ts` (TIER 3) | Calls `tavily-search.ts` | ✅ YES (via tavily-search) |
| `retry-llm.ts` | May have utility logic | ✅ Check and add if needed |
| `multi-llm-forecast.ts` | May have utility logic | ✅ Check and add if needed |
| `smart-score-llm-consensus.ts` | May have utility logic | ✅ Check and add if needed |

### Fix Pattern (apply to ALL files):

```typescript
// NEW: Utility provider fallback constants
const FL_UTILITY_FALLBACKS = {
  electric: ['Duke Energy', 'TECO', 'Tampa Electric', 'FPL', 'Florida Power & Light'],
  water: ['Tampa Water', 'City of Tampa Water', 'Pinellas County Water', 'Hillsborough County Water'],
  gas: ['Peoples Gas', 'TECO Peoples Gas', 'No natural gas available'],
  sewer: ['Tampa Sewer', 'City of Tampa Wastewater', 'County Sewer'],
  trash: ['Waste Management', 'City of Tampa Solid Waste', 'County Waste Services']
};

// STEP 1: Try to find via Tavily/LLM
async function searchUtilities(city: string, state: string): Promise<Record<string, any>> {
  const fields: Record<string, any> = {};

  const result = await tavilySearch(
    `"${city}" ${state} electric utility provider water utility natural gas`,
    { numResults: 5 }
  );

  for (const r of result.results) {
    // STEP 1A: Try to extract provider name from results (generic pattern)
    const electricMatch = r.content.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Electric|Power|Energy|Utility)/i);
    if (electricMatch && !fields['104_electric_provider']) {
      fields['104_electric_provider'] = {
        value: electricMatch[1],
        source: 'Tavily (Web Search)',
        confidence: 'Medium',
      };
    }

    const waterMatch = r.content.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Water|Utilities|Public Works)/i);
    if (waterMatch && !fields['106_water_provider']) {
      fields['106_water_provider'] = {
        value: waterMatch[1],
        source: 'Tavily (Web Search)',
        confidence: 'Medium',
      };
    }

    const gasMatch = r.content.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Gas|Natural Gas)/i);
    if (gasMatch && !fields['109_natural_gas']) {
      fields['109_natural_gas'] = {
        value: gasMatch[1],
        source: 'Tavily (Web Search)',
        confidence: 'Medium',
      };
    }
  }

  // STEP 2: FALLBACK to Florida hardcoded data if nothing found AND state is FL
  if (state.toUpperCase() === 'FL' || state.toLowerCase() === 'florida') {
    if (!fields['104_electric_provider']) {
      // Try to infer from city/county
      const cityLower = city.toLowerCase();
      let provider = 'FPL'; // Default
      if (cityLower.includes('tampa') || cityLower.includes('hillsborough')) {
        provider = 'TECO (Tampa Electric)';
      } else if (cityLower.includes('duke')) {
        provider = 'Duke Energy';
      }

      fields['104_electric_provider'] = {
        value: provider,
        source: 'Fallback (FL Default)',
        confidence: 'Low',
        note: 'Web search returned no results, using FL regional default'
      };
    }

    if (!fields['106_water_provider']) {
      fields['106_water_provider'] = {
        value: `City of ${city} Water Department`,
        source: 'Fallback (FL Default)',
        confidence: 'Low',
        note: 'Web search returned no results, using city default'
      };
    }

    if (!fields['109_natural_gas']) {
      const cityLower = city.toLowerCase();
      const provider = (cityLower.includes('tampa') || cityLower.includes('hillsborough'))
        ? 'TECO Peoples Gas'
        : 'Peoples Gas';

      fields['109_natural_gas'] = {
        value: provider,
        source: 'Fallback (FL Default)',
        confidence: 'Low',
        note: 'Web search returned no results, using FL regional default'
      };
    }
  } else {
    // Non-FL state - mark as not found (no fallback)
    if (!fields['104_electric_provider']) {
      fields['104_electric_provider'] = {
        value: null,
        source: 'N/A',
        confidence: 'Low',
        note: 'Web search returned no results, no fallback available for non-FL states'
      };
    }
  }

  return fields;
}
```

**Apply this pattern to:**
- [ ] `api/property/tavily-search.ts:196-240` (searchUtilities function)
- [ ] Any other files with utility logic

---

## ISSUE #3: PORTAL VIEWS (Fields 169-174)

### What "Remove Portal Views" Means:
Portal sites (Zillow, Redfin, Homes.com, Realtor.com) do NOT publish view counts publicly. They require authentication and are shown only to listing agents/owners.

**Current Problem:** TIER 3 searches for this data on every property, wastes 5 API calls, always returns null.

### Options:

**Option A: Complete Removal (Recommended)**
- Remove `searchPortalViews()` function from `tavily-search.ts`
- Remove call from `runTavilyTier3()` (line ~469)
- Remove fields 169-174 from configs
- Document as "unavailable via web scraping"

**Option B: Mark as Unavailable (No API Calls)**
- Keep functions but return immediately with "not available" message
- Don't call Tavily API
- Document why

**Implementation (Option A - Recommended):**
```typescript
// In tavily-search.ts, line ~464:
const [avmFields, marketFields, utilityFields, permitFields, homesteadFields] = await Promise.all([
  searchAVMs(address),
  searchMarketStats(city, zip),
  searchUtilities(city, state),
  searchPermits(address, county),
  // searchPortalViews(address),  // ❌ REMOVED - data not publicly available
  searchHomesteadAndCDD(address, county),
]);

// Remove viewFields from merge (line ~474):
Object.assign(allFields, avmFields, marketFields, utilityFields, permitFields, homesteadFields);
// Removed: viewFields

// DELETE function searchPortalViews() entirely (lines 277-313)

// UPDATE tavily-field-config.ts:
// Remove fields 169-174 OR mark as:
169: { ... notes: 'UNAVAILABLE - Portal view counts not publicly accessible' }
```

---

## ISSUE #4: AVM SUBFIELDS DATABASE PATHS

### Requirement:
"Add AVM subfields to DB but you cannot break the chain of source of truth"

### Source of Truth:
`src/types/fields-schema.ts` - defines ALL field structures

### Current AVM Structure in fields-schema.ts:
```typescript
// Need to read this file to see actual structure
// Likely something like:
financial: {
  avms: {              // Field 16 - Average of all AVMs
    value: number,
    confidence: string,
    source: string[]
  },
  // May or may not have individual AVM fields
}
```

### Fix Steps:
1. **Read `fields-schema.ts` to find AVM structure**
2. **If subfields exist in schema:** Add database paths matching schema
3. **If subfields DON'T exist in schema:** Add to schema first, then database mapping
4. **Respect nesting:** Keep under `financial` object

**Implementation:**
```typescript
// In tavily-field-database-mapping.ts, add:
'16a': {
  fieldId: '16a',
  fieldKey: '16a_zestimate',
  path: ['financial', 'zestimate'],  // Or ['financial', 'avms', 'zillow'] if nested
  label: 'Zillow Zestimate'
},
'16b': {
  fieldId: '16b',
  fieldKey: '16b_redfin_estimate',
  path: ['financial', 'redfinEstimate'],  // Match schema structure
  label: 'Redfin Estimate'
},
// ... 16c-16f
```

**After adding database paths:**
- [ ] Add '16a'-'16f' to TAVILY_ENABLED_FIELDS in PropertyDetail.tsx
- [ ] Add to FIELD_KEY_TO_ID_MAP in PropertyDetail.tsx
- [ ] Test fetching each AVM subfield

---

## SYSTEMATIC PROMPT UPDATE PLAN

### User Concern:
"There are almost 60 Tavily prompts and numerous LLM prompts - how do you accurately and completely do that?"

### Answer: Checklist-Based Systematic Approach

#### Phase 1: Tavily Field Configs (~60 prompts)
**File:** `api/property/tavily-field-config.ts`

**For EACH of 55 fields, verify:**
- [ ] Search queries are specific enough (not too broad)
- [ ] Search queries try multiple sources (2-5 queries per field)
- [ ] Extraction patterns cover common formats
- [ ] Expected success rate is realistic
- [ ] Data level is correct (address/zip/city/state)
- [ ] Notes document known limitations

**Systematic Process:**
1. Create checklist spreadsheet with all 55 fields
2. Go through fields 1-10, verify all 6 points above
3. Go through fields 11-20, verify
4. Repeat until all 55 complete
5. Document any changes in commit message

#### Phase 2: LLM Prompts (6 prompts)
**Files:** `search.ts`, `retry-llm.ts`, `multi-llm-forecast.ts`, `smart-score-llm-consensus.ts`

**For EACH LLM, verify:**
- [ ] Prompt explicitly mentions Tavily tool usage
- [ ] Prompt lists which fields REQUIRE web search
- [ ] Prompt instructs to search if field is missing
- [ ] Tool definition is correct (function schema)
- [ ] Tool result handling works

**LLMs to Update:**
1. Grok (search.ts) - ✅ Has Tavily, verify prompt emphasizes usage
2. GPT-5 (search.ts) - ✅ Has Tavily, verify prompt emphasizes usage
3. Gemini (search.ts) - 🔴 Add Tavily tool + prompt
4. Sonnet (search.ts) - 🔴 Add Tavily tool + prompt
5. Perplexity - ❌ Skip (user said don't add)
6. Opus - ❌ Skip (user said don't add)

**Plus same 4 LLMs in:**
- `retry-llm.ts`
- `multi-llm-forecast.ts`
- `smart-score-llm-consensus.ts`

**Total LLM prompts to update:** 4 LLMs × 4 files = 16 prompts

---

## COMPLETE FIX CHECKLIST

### PHASE 1: Critical Fixes (4-6 hours)

**Task 1.1: Add Tavily to Gemini & Sonnet** (2 hours)
- [ ] File: `api/property/search.ts`
  - [ ] Line ~4624: Add Tavily tool to Gemini
  - [ ] Line ~3772: Add Tavily tool to Sonnet
  - [ ] Add tool call handler for Gemini (similar to Grok/GPT)
  - [ ] Add tool call handler for Sonnet
  - [ ] Update prompts to emphasize tool usage
- [ ] File: `api/property/retry-llm.ts`
  - [ ] Add Tavily to Gemini call
  - [ ] Add Tavily to Sonnet call
- [ ] File: `api/property/multi-llm-forecast.ts`
  - [ ] Add Tavily to Gemini call
  - [ ] Add Tavily to Sonnet call
- [ ] File: `api/property/smart-score-llm-consensus.ts`
  - [ ] Add Tavily to Gemini call
  - [ ] Add Tavily to Sonnet call

**Task 1.2: Add Utility Fallback Logic** (1 hour)
- [ ] File: `api/property/tavily-search.ts`
  - [ ] Lines 196-240: Replace hardcoded FL-only with try-then-fallback
  - [ ] Add FL_UTILITY_FALLBACKS constants at top
  - [ ] Test with FL address (should use Tavily first)
  - [ ] Test with FL address (if Tavily fails, should use fallback)

**Task 1.3: Remove Portal Views** (30 mins)
- [ ] File: `api/property/tavily-search.ts`
  - [ ] Delete `searchPortalViews()` function (lines 277-313)
  - [ ] Remove from `runTavilyTier3()` Promise.all (line ~469)
  - [ ] Remove from Object.assign (line ~474)
- [ ] File: `api/property/tavily-field-config.ts`
  - [ ] Remove fields 169-174 OR mark as unavailable
- [ ] File: `src/pages/PropertyDetail.tsx`
  - [ ] Remove 169-174 from TAVILY_ENABLED_FIELDS if present

**Task 1.4: Add AVM Subfield Support** (1.5 hours)
- [ ] File: `src/types/fields-schema.ts`
  - [ ] READ ONLY: Verify AVM structure
  - [ ] Document actual nesting in comments
- [ ] File: `api/property/tavily-field-database-mapping.ts`
  - [ ] Add '16a' database path (respect schema structure)
  - [ ] Add '16b' database path
  - [ ] Add '16c' database path
  - [ ] Add '16d' database path
  - [ ] Add '16e' database path
  - [ ] Add '16f' database path
- [ ] File: `src/pages/PropertyDetail.tsx`
  - [ ] Add '16a'-'16f' to TAVILY_ENABLED_FIELDS set (line 53)
  - [ ] Add '16a_zestimate': '16a' to FIELD_KEY_TO_ID_MAP (line 61)
  - [ ] Add '16b_redfin_estimate': '16b'
  - [ ] Add '16c_first_american_avm': '16c'
  - [ ] Add '16d_quantarium_avm': '16d'
  - [ ] Add '16e_ice_avm': '16e'
  - [ ] Add '16f_collateral_analytics_avm': '16f'
- [ ] File: `api/property/fetch-tavily-field.ts`
  - [ ] Verify string field IDs ('16a') are handled correctly
  - [ ] Test fetching field 16a (Zestimate)

**Task 1.5: Delete Dead Code** (5 mins)
- [ ] File: `api/property/tavily-field-fetcher.ts`
  - [ ] Delete entire file (not used anywhere)
  - [ ] Or add comment at top: "// UNUSED - Reference implementation only"

---

### PHASE 2: Prompt Updates (4-6 hours)

**Task 2.1: Update Tavily Field Config Prompts** (3 hours)
- [ ] File: `api/property/tavily-field-config.ts`
  - [ ] Fields 12, 16a-16f (AVMs): Verify queries + patterns
  - [ ] Fields 40, 46, 59-62 (Permits): Verify queries + patterns
  - [ ] Fields 78-82 (Environment): Verify queries + patterns
  - [ ] Fields 91-103 (Market): Verify queries + patterns
  - [ ] Fields 104-116 (Utilities): Verify queries + patterns
  - [ ] Fields 131-138 (Features): Verify queries + patterns
  - [ ] Fields 170, 171, 174, 177, 178 (Performance): Verify queries + patterns
  - [ ] Document changes in TAVILY_PROMPT_UPDATES.md

**Task 2.2: Update LLM Prompts** (2 hours)
- [ ] File: `api/property/search.ts`
  - [ ] PROMPT_GPT_5: Add Tavily mandatory fields list
  - [ ] PROMPT_GROK: Add Tavily mandatory fields list
  - [ ] PROMPT_GEMINI: Add Tavily mandatory fields list
  - [ ] PROMPT_CLAUDE_SONNET: Add Tavily mandatory fields list
- [ ] File: `api/property/retry-llm.ts`
  - [ ] Update all 4 LLM prompts
- [ ] File: `api/property/multi-llm-forecast.ts`
  - [ ] Update all 4 LLM prompts
- [ ] File: `api/property/smart-score-llm-consensus.ts`
  - [ ] Update all 4 LLM prompts

**Task 2.3: Verify Prompt Updates** (1 hour)
- [ ] Test Grok uses Tavily more frequently
- [ ] Test GPT-5 uses Tavily more frequently
- [ ] Test Gemini uses Tavily (NEW)
- [ ] Test Sonnet uses Tavily (NEW)
- [ ] Document actual usage rates before/after

---

### PHASE 3: Testing & Validation (2-3 hours)

**Task 3.1: Test TIER 3 Auto Search**
- [ ] Test property in Tampa, FL (utility fallback should work)
- [ ] Verify portal views are NOT searched
- [ ] Verify utilities found via Tavily first
- [ ] Verify fallback to FL defaults if Tavily fails

**Task 3.2: Test Retry with Tavily Buttons**
- [ ] Test field 91 (Median Price) - should fetch ONLY field 91
- [ ] Test field 16a (Zestimate) - should fetch and SAVE to DB
- [ ] Test field 104 (Electric) - should try Tavily, fallback if needed
- [ ] Test 5 random other fields

**Task 3.3: Test LLM Tool Calls**
- [ ] Test Grok searches for missing AVM
- [ ] Test GPT-5 searches for missing market data
- [ ] Test Gemini searches (NEW functionality)
- [ ] Test Sonnet searches (NEW functionality)

**Task 3.4: Regression Testing**
- [ ] Run full cascade on 3 different properties
- [ ] Verify no existing functionality broken
- [ ] Check database updates work correctly
- [ ] Verify UI displays all fields

---

## SUCCESS METRICS

| Metric | Current (Before) | Target (After) | How to Measure |
|--------|------------------|----------------|----------------|
| **LLMs with Tavily** | 2 (Grok, GPT) | 4 (+ Gemini, Sonnet) | Check tool definitions in code |
| **TIER 3 API Waste** | 5 fields on impossible data | 0 | Portal views removed |
| **Utility Success (FL)** | Hardcoded only | Tavily first, fallback if needed | Test with FL property |
| **AVM Subfields** | Cannot be saved | All 6 can be fetched and saved | Test fetching 16a |
| **Prompt Coverage** | Partial | 100% verified | Complete checklist |
| **Dead Code** | 1 unused file | 0 | Delete tavily-field-fetcher.ts |

---

## DEPLOYMENT PLAN

### Week 1: Core Functionality
- Days 1-2: Phase 1 tasks (6 hours)
- Day 3: Test Phase 1
- Day 4-5: Fix bugs, refine

### Week 2: Prompts & Optimization
- Days 1-3: Phase 2 tasks (6 hours)
- Day 4: Test Phase 2
- Day 5: Fix bugs, refine

### Week 3: Testing & Production
- Days 1-2: Phase 3 full testing (3 hours)
- Days 3-4: Bug fixes, edge cases
- Day 5: Deploy to production, monitor

---

## FINAL VERIFICATION

Before marking complete, verify:
- [ ] All 9 files have been modified (excluding dead code and source of truth)
- [ ] All LLM prompts mention Tavily usage
- [ ] All utility code has fallback logic
- [ ] AVM subfields work end-to-end
- [ ] Portal views completely removed
- [ ] Dead code deleted
- [ ] All tests passing
- [ ] Documentation updated

---

**Plan Complete - Ready to Execute**
