# TAVILY COMPLETE UNIFIED AUDIT & FIX PLAN
## All Tavily Integration Points Across Entire Codebase

**Date:** 2026-01-10
**Auditor:** Claude Sonnet 4.5
**Scope:** COMPLETE audit of all Tavily usage in Clues Quantum Property Dashboard

---

## EXECUTIVE SUMMARY

### Three Tavily Systems Found:

| System | Purpose | Location | Fields Covered | When Called | Status |
|--------|---------|----------|----------------|-------------|--------|
| **TIER 3 Auto Search** | Automatic web search in property cascade | `api/property/tavily-search.ts` | ~16 fields (AVMs, market, utilities, permits, homestead, portal views) | AUTOMATIC during every property search | 🟡 PARTIAL - Florida-only utils, portal views don't work |
| **Retry with Tavily (55 Fields)** | Manual per-field fetch via UI button | `api/property/tavily-field-config.ts` + `fetch-tavily-field.ts` | 55 fields (comprehensive) | MANUAL via "Fetch with Tavily" button | 🟡 75% IMPLEMENTED - needs fixes |
| **LLM Tool Calls** | Grok/GPT web search during reasoning | `api/property/search.ts` `callTavilySearch()` | Dynamic (any query LLM wants) | DYNAMIC when LLM needs web data | ✅ WORKING - but not prompted to use often |

---

## PART 1: TIER 3 AUTOMATIC TAVILY SEARCH

### What It Is:
**Function:** `runTavilyTier3()` in `tavily-search.ts`
**Called By:** `api/property/search.ts` line ~5314
**Timing:** TIER 3 of cascade (after Bridge MLS, Geocode APIs, before LLM cascade)
**Timeout:** 30s total for all TIER 3 searches

### Fields Fetched (16 total):

| Field ID | Field Name | Function | Search Query | Status |
|----------|------------|----------|--------------|--------|
| **16a** | Zestimate | `searchAVMs()` | `site:zillow.com "{address}" Zestimate home value` | 🔴 Domain-restricted, low success |
| **16b** | Redfin Estimate | `searchAVMs()` | `site:redfin.com "{address}" estimate home value` | 🟡 Works sometimes |
| **91** | Median Home Price | `searchMarketStats()` | `"{city}" {zip} median home price average days on market 2026` | 🟡 Generic query, city-level |
| **92** | Price Per Sq Ft | `searchMarketStats()` | Same as 91 | 🟡 Regex may miss formats |
| **95** | Days on Market (Avg) | `searchMarketStats()` | Same as 91 | 🟡 May match wrong data |
| **104** | Electric Provider | `searchUtilities()` | `"{city}" {state} electric utility provider water utility natural gas` | 🔴 FLORIDA-ONLY regex |
| **106** | Water Provider | `searchUtilities()` | Same as 104 | 🔴 FLORIDA-ONLY regex |
| **109** | Natural Gas | `searchUtilities()` | Same as 104 | 🔴 FLORIDA-ONLY regex |
| **60** | Permit History - Roof | `searchPermits()` | `"{address}" {county} county building permits roof HVAC renovation` | 🔴 Returns generic "Permit found" |
| **61** | Permit History - HVAC | `searchPermits()` | Same as 60 | 🔴 Returns generic "Permit found" |
| **169** | Zillow Views | `searchPortalViews()` | `"{address}" views saves favorites Zillow Redfin` | 🔴 DATA NOT PUBLIC |
| **170** | Redfin Views | `searchPortalViews()` | Same as 169 | 🔴 DATA NOT PUBLIC |
| **171** | Homes.com Views | `searchPortalViews()` | Same as 169 | 🔴 DATA NOT PUBLIC |
| **172** | Realtor.com Views | `searchPortalViews()` | Same as 169 | 🔴 DATA NOT PUBLIC |
| **174** | Saves/Favorites | `searchPortalViews()` | Same as 169 | 🔴 DATA NOT PUBLIC |
| **151** | Homestead Exemption Y/N | `searchHomesteadAndCDD()` | `"{address}" homestead exemption site:{countyPAO}` OR fallback | 🟡 Good approach, county coverage varies |
| **152** | CDD Y/N | `searchHomesteadAndCDD()` | Same as 151 | 🟡 Good approach |
| **153** | Annual CDD Fee | `searchHomesteadAndCDD()` | Same as 151 | 🟡 Good approach |

### TIER 3 Critical Issues:

**Issue T3-1: Florida-Only Utility Patterns** 🔴
```typescript
// Lines 206-237 in tavily-search.ts
if (r.content.match(/Duke Energy|TECO|Tampa Electric|FPL|Florida Power/i))
```
**Problem:** Hardcoded Florida utility names. Fails for properties in other states.
**Impact:** HIGH - Fields 104, 106, 109 fail outside Florida

**Fix:**
```typescript
// Replace hardcoded names with generic extraction
const match = r.content.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Electric|Power|Energy|Utility)/i);
```

---

**Issue T3-2: Portal Views Data Not Publicly Available** 🔴
```typescript
// Lines 278-313 - searchPortalViews()
```
**Problem:** Zillow, Redfin, etc. do NOT publish view counts publicly. This data requires authentication.
**Impact:** CRITICAL - Wasting 5 fields and API calls on impossible queries

**Fix:** Remove portal views searches entirely OR document as "unavailable via web scraping"

---

**Issue T3-3: Permit History Returns Generic Text** 🔴
```typescript
// Lines 255-269
fields['60_permit_history_roof'] = {
  value: 'Permit found - see county records',  // ❌ USELESS
  ...
};
```
**Problem:** Returns "Permit found" instead of actual permit details (date, contractor, cost, etc.)
**Impact:** MEDIUM - Field populated but data is useless

**Fix:** Extract permit dates, calculate ages, or use BuildFax API

---

**Issue T3-4: Parallel Execution** ✅ Actually OK Here
```typescript
// Line 464
const [avmFields, marketFields, ...] = await Promise.all([...]);
```
**Note:** For TIER 3 auto-search, parallel is CORRECT - want speed. Only "Retry with Tavily" needs sequential.

---

### TIER 3 Success Rate (Current):
- **Working:** Fields 91, 92, 95, 151, 152, 153 (~6 fields, 37%)
- **Partial:** Fields 16a, 16b (~2 fields, 13%)
- **Broken:** Fields 104, 106, 109 (FL-only), 60-61 (generic), 169-174 (impossible) (~8 fields, 50%)

**Overall TIER 3:** Returns ~6-8 usable fields out of 16 attempted (37-50%)

---

## PART 2: "RETRY WITH TAVILY" - 55 FIELD SYSTEM

### What It Is:
**UI Button:** "🔍 Fetch with Tavily (Targeted Web Search)" in PropertyDetail.tsx
**API Endpoint:** `/api/property/fetch-tavily-field`
**Configuration:** `tavily-field-config.ts` (55 field configs)
**Database Mapping:** `tavily-field-database-mapping.ts` (49 mapped + 6 subfields missing)
**Fetcher Logic:** `tavily-field-fetcher.ts`

### When Used:
**Manual only** - User clicks button next to empty/low-confidence field in UI

### Fields Covered:
See **TAVILY_55_FIELDS_AUDIT_COMPLETE.md** for detailed field-by-field breakdown.

**Summary:**
- 7 AVM fields (12, 16, 16a-16f)
- 6 Permit/condition fields (40, 46, 59-62)
- 5 Environment/walkability fields (78-82)
- 13 Market data fields (91-103)
- 13 Utility/connectivity fields (104-116)
- 8 Property feature fields (131-138)
- 5 Market performance fields (170, 171, 174, 177, 178)
- **MISSING:** Field 181 (Market Volatility Score) configured but not in UI map

### Critical Issues (Detailed in 55-field audit):

**Issue R55-1: Parallel Query Execution** 🔴
Should be sequential (try query 1, then 2, then 3...), currently all queries fire at once

**Issue R55-2: AVM Subfields Missing DB Paths** 🔴
Fields 16a-16f can be fetched but cannot be saved to database

**Issue R55-3: JSON-LD Extraction Won't Work** 🔴
Code looks for `<script type="application/ld+json">` but Tavily returns plain text

**Issue R55-4: No LLM Fallback** ⚠️
Config says `fallbackToLLM: true` but not implemented in fetcher

**Issue R55-5: No Rate Limiting** 🔴
Could make hundreds of Tavily calls in short time, exhaust quota

---

## PART 3: LLM TOOL CALLS (Grok & GPT-5)

### What It Is:
**Function:** `callTavilySearch(query, numResults)` in `search.ts` line 4425
**Available To:** Grok (line 4530), GPT-5 (line 4067)
**NOT Available To:** Claude Opus, Claude Sonnet, Gemini, Perplexity

### How It Works:
1. LLM determines it needs web data during reasoning
2. LLM calls `tavily_search` function with custom query
3. System executes Tavily search
4. Results formatted as text and returned to LLM
5. LLM uses results to answer original question

### Example Flow:
```
User: "What is the median home price in Miami Beach?"
↓
Grok reasoning: "I need current market data for Miami Beach"
↓
Grok calls: tavily_search("Miami Beach median home price 2026")
↓
Tavily returns: [{title: "Redfin Miami Beach", content: "Median: $750,000..."}]
↓
System formats: "1. Redfin Miami Beach: Median: $750,000..."
↓
Grok responds: "The median home price in Miami Beach is $750,000..."
```

### Current Implementation:
```typescript
// search.ts:4425-4469
async function callTavilySearch(query: string, numResults: number = 5): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    body: JSON.stringify({
      api_key: apiKey,
      query: query,
      search_depth: 'basic',
      max_results: Math.min(numResults, 10),
      include_answer: true,  // ✅ Good - includes Tavily's AI summary
      include_raw_content: false  // ✅ Good - just summaries, not full HTML
    }),
    signal: controller.signal,
  });

  const data = await response.json();

  // Format results for LLM
  let formatted = data.answer ? `Summary: ${data.answer}\n\n` : '';
  if (data.results && data.results.length > 0) {
    formatted += 'Sources:\n';
    data.results.forEach((r: any, i: number) => {
      formatted += `${i + 1}. ${r.title}: ${r.content?.substring(0, 300) || 'No content'}\n`;
    });
  }
  return formatted || 'No results found';
}
```

### Issues with LLM Tool Calls:

**Issue LLM-1: Not Prompted to Use Tavily** ⚠️
**Problem:** LLMs have the tool but aren't explicitly told to use it for missing fields

**Current Prompt (approximate):**
```
You are extracting property data for {address}.
Extract these fields: [list of 50+ fields]
You have access to web search via tavily_search tool.
Return JSON with field values.
```

**Better Prompt:**
```
CRITICAL: For these fields, you MUST use tavily_search if data not in MLS:
- AVMs (16a-16f)
- Market statistics (91, 92, 95)
- Utility providers (104, 106, 109)
- Permit history (60, 61)

If a field is empty after MLS parsing, call tavily_search with a specific query for that field.
```

**Impact:** MEDIUM - LLMs answer from training data instead of searching

---

**Issue LLM-2: Returns Unstructured Text** ⚠️
**Problem:** LLM receives formatted text, must parse it to extract values

**Current:** LLM gets:
```
Summary: The median home price in Miami Beach is $750,000 as of 2026.

Sources:
1. Redfin Miami Beach: Median sale price increased 5% to $750,000...
2. Zillow Miami Beach: Homes sell for median of $745,000...
```

LLM must then extract "$750,000" and determine it's reliable.

**Better:** Return structured data:
```json
{
  "answer": "The median home price in Miami Beach is $750,000",
  "sources": [
    {"site": "Redfin", "value": "$750,000", "confidence": "high"},
    {"site": "Zillow", "value": "$745,000", "confidence": "high"}
  ]
}
```

**Impact:** LOW - LLMs are good at parsing text, but structured data would be more reliable

---

**Issue LLM-3: No Field-Specific Tools** ⚠️
**Problem:** LLMs have generic `tavily_search`, not specialized tools like `get_zestimate`, `get_median_price`

**Current:**
```json
{
  "name": "tavily_search",
  "description": "Search the web for information",
  "parameters": {
    "query": "string",
    "num_results": "number"
  }
}
```

**Better:**
```json
{
  "name": "get_zestimate",
  "description": "Get Zillow Zestimate for a specific address",
  "parameters": {
    "address": "string"
  }
},
{
  "name": "get_median_price",
  "description": "Get median home price for a ZIP code or city",
  "parameters": {
    "zip": "string"
  }
}
```

**Impact:** MEDIUM - Field-specific tools would increase usage frequency and success rate

---

## UNIFIED ISSUES & RECOMMENDATIONS

### Issue Matrix:

| Issue ID | Description | Affects | Severity | Effort to Fix |
|----------|-------------|---------|----------|---------------|
| **T3-1** | Florida-only utility patterns | TIER 3: Fields 104, 106, 109 | 🔴 HIGH | 30 mins |
| **T3-2** | Portal views data not public | TIER 3: Fields 169-174 | 🔴 CRITICAL | 15 mins (remove) |
| **T3-3** | Permit history generic text | TIER 3: Fields 60, 61 | 🔴 HIGH | 2 hours (parse dates) |
| **R55-1** | Parallel query execution | Retry 55: All fields | 🔴 CRITICAL | 1 hour |
| **R55-2** | AVM subfields no DB paths | Retry 55: Fields 16a-16f | 🔴 HIGH | 30 mins |
| **R55-3** | JSON-LD extraction fails | Retry 55: All fields | 🔴 HIGH | 30 mins (remove) |
| **R55-4** | No LLM fallback | Retry 55: 30+ fields | ⚠️ MEDIUM | 2 hours |
| **R55-5** | No rate limiting | Retry 55: All fields | 🔴 HIGH | 1 hour |
| **LLM-1** | Not prompted to use tool | LLM tools: All fields | ⚠️ MEDIUM | 1 hour (prompt update) |
| **LLM-2** | Unstructured text return | LLM tools: All fields | ⚠️ LOW | 2 hours (refactor) |
| **LLM-3** | No field-specific tools | LLM tools: All fields | ⚠️ MEDIUM | 4 hours (new tools) |

---

## COMPREHENSIVE FIX PLAN

### PHASE 1: CRITICAL FIXES (6 hours)

**Priority 1.1: Fix TIER 3 - Remove/Fix Broken Searches** (1 hour)
- [ ] **T3-2:** Remove portal views searches (169-174) - data not public
- [ ] **T3-1:** Fix utility provider extraction to work nationwide (not just FL)
- [ ] **T3-3:** Improve permit extraction to return dates, not "Permit found"
- [ ] Test TIER 3 with non-Florida property

**Priority 1.2: Fix Retry 55 - Query Execution** (1 hour)
- [ ] **R55-1:** Change parallel to sequential in `tavily-field-fetcher.ts:157-162`
  ```typescript
  // BEFORE (parallel):
  const searchPromises = queries.map(q => executeSingleTavilyQuery(q));
  const results = await Promise.allSettled(searchPromises);

  // AFTER (sequential):
  for (const query of queries) {
    const result = await executeSingleTavilyQuery(query);
    if (result?.results?.length > 0) {
      return [result]; // Stop on first success
    }
  }
  ```
- [ ] Test that queries execute one at a time

**Priority 1.3: Fix Retry 55 - Database Paths** (30 mins)
- [ ] **R55-2:** Add AVM subfield paths to `tavily-field-database-mapping.ts`:
  ```typescript
  '16a': { path: ['financial', 'zestimate'], fieldKey: '16a_zestimate', ... },
  '16b': { path: ['financial', 'redfinEstimate'], fieldKey: '16b_redfin_estimate', ... },
  '16c': { path: ['financial', 'firstAmericanAvm'], ... },
  '16d': { path: ['financial', 'quantariumAvm'], ... },
  '16e': { path: ['financial', 'iceAvm'], ... },
  '16f': { path: ['financial', 'collateralAnalyticsAvm'], ... },
  ```
- [ ] Update FIELD_KEY_TO_ID_MAP in PropertyDetail.tsx
- [ ] Verify database schema has these paths

**Priority 1.4: Fix Retry 55 - Remove JSON-LD** (30 mins)
- [ ] **R55-3:** Comment out JSON-LD extraction in `tavily-field-fetcher.ts:242-253`
- [ ] Rely on regex + text marker extraction only
- [ ] Update expected success rates in config

**Priority 1.5: Add Rate Limiting** (1 hour)
- [ ] **R55-5:** Implement simple rate limiter:
  ```typescript
  class TavilyRateLimiter {
    private queue: Promise<any>[] = [];
    private readonly maxPerSecond = 10;

    async throttle<T>(fn: () => Promise<T>): Promise<T> {
      // Wait if too many requests in last second
      const now = Date.now();
      this.queue = this.queue.filter(p => now - p.startTime < 1000);

      if (this.queue.length >= this.maxPerSecond) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return fn();
    }
  }
  ```
- [ ] Test rate limiting works

**Priority 1.6: Update LLM Prompts** (1 hour)
- [ ] **LLM-1:** Update Grok/GPT prompts to mandate Tavily use for specific fields
- [ ] Add field-specific search instructions
- [ ] Test that LLMs actually use the tool more often

---

### PHASE 2: IMPROVE SUCCESS RATES (6 hours)

**Priority 2.1: Implement LLM Fallback for Retry 55** (2 hours)
- [ ] **R55-4:** When extraction fails, call Claude/GPT with raw Tavily results
- [ ] Use field-specific prompts from config
- [ ] Only call LLM if `fallbackToLLM: true`

**Priority 2.2: Add Cascading Queries** (2 hours)
- [ ] If narrow query fails, try broader
- [ ] Example: `site:movoto.com "{address}"` → `"{address}" home value estimate`
- [ ] Test improves success rates

**Priority 2.3: Improve Extraction Patterns** (2 hours)
- [ ] Handle "$500k", "$1.2M" formats (not just "$500,000")
- [ ] Add value normalization layer
- [ ] Test with real Tavily responses

---

### PHASE 3: ADVANCED IMPROVEMENTS (8 hours)

**Priority 3.1: Field-Specific LLM Tools** (4 hours)
- [ ] **LLM-3:** Create `get_zestimate`, `get_median_price`, etc.
- [ ] Each tool internally calls Tavily with optimized query
- [ ] Returns structured data to LLM

**Priority 3.2: Add Success Rate Tracking** (2 hours)
- [ ] Log every Tavily call: field, query, found/not found
- [ ] Calculate success rates per field
- [ ] Dashboard to show which fields/queries work best

**Priority 3.3: Comprehensive Testing** (2 hours)
- [ ] Test TIER 3 with 10 properties (5 FL, 5 other states)
- [ ] Test Retry 55 with 20 different fields
- [ ] Test LLM tool calls with various queries
- [ ] Document actual success rates

---

## EXPECTED RESULTS AFTER ALL FIXES

### TIER 3 Auto Search:
**Before:** 6-8 usable fields / 16 attempted (37-50%)
**After:** 11-13 usable fields / 14 attempted (79-93%)
- Removed 2 impossible fields (portal views)
- Fixed 3 FL-only fields (utilities)
- Improved 2 permit fields

### Retry with Tavily (55 Fields):
**Before:** ~40-50% success (parallel queries, no fallback, extraction issues)
**After:** ~65-75% success (sequential queries, LLM fallback, better extraction)
- Sequential queries: +10% (stop wasting calls)
- LLM fallback: +10% (rescue failed extractions)
- Better patterns: +5% (handle more formats)

### LLM Tool Calls:
**Before:** Rarely used (not prompted)
**After:** Used proactively for missing fields
- Better prompts: 3x more tool usage
- Field-specific tools: 2x higher success rate

---

## TESTING CHECKLIST

### TIER 3 Tests:
- [ ] Property in Florida → utilities extracted correctly
- [ ] Property in California → utilities extracted correctly
- [ ] Property in New York → utilities extracted correctly
- [ ] Portal views removed (no longer attempted)
- [ ] Permit history returns dates, not "Permit found"
- [ ] Homestead/CDD works for FL counties

### Retry 55 Tests:
- [ ] Click "Fetch with Tavily" on field 91 (Median Price) → finds value
- [ ] Click on field 16a (Zestimate) → finds value AND saves to database
- [ ] Click on field 104 (Electric Provider) in non-FL state → finds value
- [ ] Verify queries execute sequentially (not parallel)
- [ ] Verify LLM fallback triggers when extraction fails
- [ ] Rate limiter prevents >10 requests/second

### LLM Tool Call Tests:
- [ ] Grok search uses Tavily for missing AVMs
- [ ] GPT-5 search uses Tavily for missing market data
- [ ] Prompts explicitly instruct tool use
- [ ] Results formatted correctly for LLM parsing

---

## DEPLOYMENT PLAN

### Week 1: Critical Fixes
- Days 1-2: Phase 1 fixes (6 hours)
- Day 3: Test Phase 1
- Day 4: Deploy to staging
- Day 5: Monitor, fix bugs

### Week 2: Improvements
- Days 1-3: Phase 2 fixes (6 hours)
- Day 4: Test Phase 2
- Day 5: Deploy to staging

### Week 3: Advanced + Production
- Days 1-4: Phase 3 (8 hours)
- Day 5: Full regression testing
- Weekend: Deploy to production

---

## SUCCESS METRICS

### Measure Before & After:

| Metric | Current (Before) | Target (After) | Measurement |
|--------|------------------|----------------|-------------|
| TIER 3 Success Rate | 37-50% | 79-93% | Fields returned / fields attempted |
| Retry 55 Success Rate | 40-50% | 65-75% | Fields found / fields fetched |
| LLM Tool Usage Frequency | Low (~5% of searches) | Medium (~30% of searches) | Tool calls / total LLM calls |
| Tavily API Cost per Property | High (wasted calls) | Low (efficient) | Total API calls / property |
| User Satisfaction | Unknown | High | "Fetch with Tavily" success rate |

---

## FINAL RECOMMENDATIONS

### DO THIS NOW (Highest ROI):
1. ✅ Remove portal views searches from TIER 3 (wasting 5 fields)
2. ✅ Fix utilities to work nationwide (not just FL)
3. ✅ Change Retry 55 queries to sequential (stop wasting API calls)
4. ✅ Add AVM subfield database paths (enable saving 6 fields)
5. ✅ Add rate limiting (prevent API exhaustion)

**Time:** ~4 hours
**Impact:** IMMEDIATE - stop wasting API calls, enable 6 more fields, work nationwide

### DO THIS NEXT (Medium ROI):
6. ✅ Remove JSON-LD extraction (doesn't work anyway)
7. ✅ Update LLM prompts to mandate Tavily use
8. ✅ Implement LLM fallback for failed extractions
9. ✅ Test with real properties outside Florida

**Time:** ~6 hours
**Impact:** HIGH - increase success rates by 20-30%

### DO THIS LATER (Lower ROI but valuable):
10. ⚠️ Create field-specific LLM tools
11. ⚠️ Add success rate tracking dashboard
12. ⚠️ Implement cascading query fallbacks
13. ⚠️ Comprehensive testing suite

**Time:** ~8 hours
**Impact:** LONG-TERM - continuous improvement, better monitoring

---

## CONCLUSION

**Current State:**
- ✅ Good structure - 3 Tavily systems implemented
- ⚠️ Execution issues - parallel queries, FL-only, missing DB paths
- 🔴 Wasted effort - portal views impossible, no LLM fallback

**After Fixes:**
- ✅ TIER 3 returns 80-90% of attempted fields
- ✅ Retry 55 succeeds 65-75% of time
- ✅ LLMs proactively search web for missing fields
- ✅ Works nationwide, not just Florida
- ✅ Efficient API usage (sequential, rate-limited)

**Time to Production-Ready:** 10-14 hours total work

**Recommendation:** Prioritize Phase 1 (critical fixes) this week. The ~4 hours investment will immediately:
- Stop wasting API calls on impossible queries
- Enable 6 more AVM fields
- Fix nationwide compatibility
- Prevent API exhaustion

This will unblock the system and allow gradual improvements in Phase 2-3.

---

**Audit Complete - Ready to Execute**
