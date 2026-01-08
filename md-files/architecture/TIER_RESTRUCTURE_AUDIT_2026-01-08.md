# TIER STRUCTURE AUDIT - 2026-01-08

## PURPOSE
Complete audit of all tier structure references in codebase for restructuring:
- Move Free APIs from Tier 3 to Tier 2 (after Google APIs)
- Make Tavily standalone Tier 3
- LLMs remain Tier 4-5

---

## FILES REQUIRING CHANGES

### TIER 1: CRITICAL FILES (Define tier structure)

| File | Lines | Type | Current Code | Change Needed |
|------|-------|------|--------------|---------------|
| `api/property/llm-constants.ts` | 8-24 | Comment + Const | Tier 4/5 labels on LLMs | Update comments only |
| `api/property/arbitration.ts` | 6-19 | Comment | Tier hierarchy definition | **REWRITE** tier descriptions |
| `api/property/arbitration.ts` | 29-59 | Const | `DATA_TIERS` config object | **ADD** Tavily tier, update tier numbers |
| `api/property/search.ts` | 5-9 | Comment | Tier 1-5 descriptions | **REWRITE** tier descriptions |
| `api/property/search.ts` | 55-57 | Const | Timeout constants by tier | **ADD** `TAVILY_TIMEOUT` |

### TIER 2: LLM PROMPT FILES (Contain cascade position language)

| File | Lines | Type | Current Code | Change Needed |
|------|-------|------|--------------|---------------|
| `api/property/perplexity-prompts.ts` | 14-25 | Prompt | "FIRST LLM in search chain" | No change (still first LLM) |
| `api/property/search.ts` | 3093 | Prompt | Grok: "3rd LLM in search chain" | Verify position accurate |
| `api/property/search.ts` | 3163-3164 | Prompt | Opus: "6th and FINAL LLM" | No change |
| `api/property/search.ts` | 3225-3227 | Prompt | GPT: "3rd LLM in search chain" | Verify position accurate |
| `api/property/search.ts` | 3471-3472 | Prompt | Sonnet: "4th LLM in search chain" | Verify position accurate |
| `api/property/retry-llm.ts` | 599-657 | Prompt | Perplexity system prompt | No change |
| `api/property/retry-llm.ts` | 760-820 | Prompt | Grok system prompt | Verify position accurate |
| `api/property/retry-llm.ts` | 1064-1153 | Prompt | GPT system prompt | Verify position accurate |
| `api/property/retry-llm.ts` | 1240 | Prompt | Sonnet: "5th LLM" reference | **FIX** - should be 4th |

### TIER 3: FIRING ORDER/CASCADE FILES

| File | Lines | Type | Current Code | Change Needed |
|------|-------|------|--------------|---------------|
| `api/property/retry-llm.ts` | 13-19 | Comment | LLM cascade order | Update comment |
| `api/property/retry-llm.ts` | 1500-1508 | Const | `engineFunctions` mapping | No change (LLM order unchanged) |
| `api/property/multi-llm-forecast.ts` | 1-16 | Comment | 6 LLM calling sequence | Update if needed |
| `api/property/multi-llm-forecast.ts` | 1234-1248 | Code | Perplexity sequential, others parallel | No change |
| `api/property/smart-score-llm-consensus.ts` | 1-13 | Comment | 2-tier voting model | No change |
| `api/property/smart-score-llm-consensus.ts` | 736-882 | Code | Consensus voting logic | No change |

### TIER 4: DATA SOURCE FILES

| File | Lines | Type | Current Code | Change Needed |
|------|-------|------|--------------|---------------|
| `api/property/free-apis.ts` | 3 | Comment | "called BEFORE LLMs" | **UPDATE** to reference Tier 2 |
| `api/property/free-apis.ts` | 87, 125, 255-275, 305, 350, 415, 675, 772 | Comments | "Field numbers aligned" | No change |
| `src/lib/bridge-field-mapper.ts` | 182-195 | Code | `source = 'Stellar MLS'` | No change |

### TIER 5: SUPPORTING FILES (May need updates)

| File | Lines | Type | Current Code | Change Needed |
|------|-------|------|--------------|---------------|
| `src/lib/field-normalizer.ts` | 1017-1048 | Const | `DATA_QUALITY_RANGES` | Review if tier-dependent |
| `api/property/arbitration.ts` | 128-152 | Const | Confidence source lists | **ADD** Tavily to HIGH_CONFIDENCE |

---

## DETAILED CHANGES REQUIRED

### 1. arbitration.ts - Lines 6-19 (REWRITE)

**CURRENT:**
```
* Tier Hierarchy (Higher tier ALWAYS wins):
*   Tier 1: Stellar MLS (Primary source - when eKey obtained)
*   Tier 2: Google APIs (Geocode, Places, Distance Matrix)
*   Tier 3: Paid/Free APIs (WalkScore, SchoolDigger, FEMA, AirNow, HowLoud, Weather, FBI Crime)
*   Tier 4: Web-Search LLMs (Perplexity → Gemini → GPT → Grok)
*   Tier 5: Claude LLMs (Sonnet → Opus) - Sonnet has web search, Opus is pure reasoning (LAST)
```

**NEW:**
```
* Tier Hierarchy (Higher tier ALWAYS wins):
*   Tier 1: Stellar MLS (Primary source - Bridge Interactive API)
*   Tier 2: APIs (Google APIs first, then Free APIs: WalkScore, SchoolDigger, FEMA, etc.)
*   Tier 3: Tavily Web Search (Targeted searches for AVMs, WalkScore, Schools, Crime)
*   Tier 4: Web-Search LLMs (Perplexity → Gemini → GPT → Sonnet → Grok)
*   Tier 5: Claude Opus (Deep reasoning, NO web search - LAST)
```

### 2. arbitration.ts - Lines 29-59 (ADD TAVILY)

**ADD after line 48:**
```typescript
'tavily': { tier: 3, name: 'Tavily Web Search', priority: 1, reliability: 85 },
```

**UPDATE existing tiers:**
- Move all free API entries from tier: 3 to tier: 2

### 3. search.ts - Lines 5-9 (REWRITE)

**CURRENT:**
```
* Tier 1: Stellar MLS (when eKey obtained - future)
* Tier 2: Google APIs (Geocode, Places)
* Tier 3: Paid/Free APIs (WalkScore, SchoolDigger, AirNow, HowLoud, Weather, Crime, FEMA, Census)
* Tier 4: Web-Search LLMs (Perplexity → Gemini → GPT → Grok)
* Tier 5: Claude LLMs (Sonnet → Opus) - Opus is LAST (no web search)
```

**NEW:**
```
* Tier 1: Stellar MLS (Bridge Interactive API)
* Tier 2: APIs (Google APIs first, then Free APIs: WalkScore, SchoolDigger, FEMA, etc.)
* Tier 3: Tavily Web Search (Targeted searches for AVMs, WalkScore, Schools, Crime)
* Tier 4: Web-Search LLMs (Perplexity → Gemini → GPT → Sonnet → Grok)
* Tier 5: Claude Opus (Deep reasoning, NO web search - LAST)
```

### 4. search.ts - Lines 55-57 (ADD TIMEOUT)

**ADD:**
```typescript
const TAVILY_TIMEOUT = 15000; // 15s for Tavily web searches (Tier 3)
```

### 5. arbitration.ts - Lines 128-139 (ADD TAVILY)

**ADD to HIGH_CONFIDENCE_SOURCES:**
```typescript
'tavily',
```

### 6. free-apis.ts - Line 3 (UPDATE COMMENT)

**CURRENT:**
```
// These are called BEFORE LLMs because they provide accurate, non-hallucinated data
```

**NEW:**
```
// TIER 2 APIs: Called after Google APIs, before Tavily. Provide accurate, non-hallucinated data
```

---

## NEW TAVILY IMPLEMENTATION REQUIRED

### Location: `api/property/search.ts` (new section)

**Add new Tier 3 Tavily section with these searches:**
1. `"[address] Zillow Zestimate home value"` → 16a_zestimate
2. `"[address] Redfin estimate"` → 16b_redfin_estimate
3. `"[address] Walk Score Transit Score Bike Score"` → 74, 75, 76
4. `"[address] elementary middle high school GreatSchools rating"` → 66, 69, 72
5. `"[address] crime rate statistics"` → 88, 89
6. `"[address] Zillow Rent Zestimate rental estimate"` → 98, 181

---

## FIRING ORDER SUMMARY

### CURRENT:
```
Tier 1: Bridge MLS
    ↓
Tier 2: Google APIs
    ↓
Tier 3: Free APIs (WalkScore, FEMA, etc.)
    ↓
Tier 4: Perplexity → Gemini → GPT → Sonnet → Grok
    ↓
Tier 5: Claude Opus
```

### NEW:
```
Tier 1: Bridge MLS
    ↓
Tier 2: Google APIs → Free APIs (sequential within tier)
    ↓
Tier 3: Tavily (6 parallel targeted searches)
    ↓
Tier 4: Perplexity → Gemini → GPT → Sonnet → Grok
    ↓
Tier 5: Claude Opus
```

---

## VERIFICATION CHECKLIST

- [ ] arbitration.ts tier comments updated
- [ ] arbitration.ts DATA_TIERS updated
- [ ] arbitration.ts HIGH_CONFIDENCE_SOURCES includes tavily
- [ ] search.ts tier comments updated
- [ ] search.ts TAVILY_TIMEOUT added
- [ ] search.ts Tavily Tier 3 function implemented
- [ ] free-apis.ts comment updated
- [ ] All LLM prompts verified for correct position numbers
- [ ] TypeScript compilation passes
- [ ] Test search to verify no regression

---

## AGENT AUDIT CERTIFICATION

**Agent 1 (ac82247):** Audited search.ts, retry-llm.ts, arbitration.ts, free-apis.ts
**Agent 2 (ac5b209):** Audited llm-constants.ts, perplexity-prompts.ts, field-normalizer.ts, bridge-field-mapper.ts, multi-llm-forecast.ts, smart-score-llm-consensus.ts

All files read line-by-line. No fabrication.
