# CLUES Property Dashboard - Handoff Document
## Date: 2026-01-14
## Conversation ID: ba1ef5a6-62c1-48e8-b39f-e32c19710d61

---

## PROJECT OVERVIEW

**Repository:** https://github.com/johndesautels1/clues-property-search
**Local Path:** D:\Clues_Quantum_Property_Dashboard
**Stack:** React + TypeScript + Vite frontend, Vercel serverless API functions
**Purpose:** Real estate property dashboard with 181-field schema, multi-tier data enrichment

---

## DATA ENRICHMENT CASCADE (Current Architecture)

| Tier | Source | Description |
|------|--------|-------------|
| **Tier 1** | Bridge Interactive API | Primary MLS data source (Stellar MLS) |
| **Tier 2** | Free APIs | FBI Crime, FCC Broadband, Census, ATTOM, etc. |
| **Tier 3** | Tavily Web Search | Scrapes Zillow, Redfin, county sites (46 parallel searches) |
| **Tier 4** | LLM Cascade | Perplexity → GPT → Claude Sonnet → Grok |
| **Tier 5** | Claude Opus | Final fallback |

**Known Tier 3 Problem:** Tavily fires 46 parallel web searches with 45-second timeouts, consuming Vercel's 300-second limit before LLMs can run.

---

## TEST PROPERTY FOR ALL DEBUGGING

```
Address: 8635 Boca Ciega Drive, St Pete Beach, FL 33706
Type: Waterfront residential (1000 ft from coast)
Year Built: 1951
MLS: Active listing in Bridge/Stellar MLS
Special Features: Bay/Harbor Front, Gulf/Ocean, Intracoastal Waterway access
```

---

## CRITICAL BUG TABLE (27 Issues Identified)

### Category 1: Bridge Field Mapping Failures (9 issues)

| # | Field | Issue | Expected Behavior |
|---|-------|-------|-------------------|
| 6 | Kitchen Features | Always blank | Bridge fields available + parseable from public remarks |
| 7 | Deck/Patio/Fence/Landscaping | All blank | Available in Bridge Stellar AND in public remarks |
| 19 | View Type | Blank | Bridge supplies this for waterfront property |
| 20 | Lot Features | Blank | Bridge supplies this for waterfront property |
| 21 | Garage Attached | Shows "Not available" | Parking Features subfield shows "Attached Garage" - wrong field mapping |
| 22 | Water Frontage | "Not available" | Extended Data has correct values |
| 23 | Waterfront Feet | "Not available" | Extended Data has correct values |
| 24 | Water Access | "Not available" | Extended Data has correct values |
| 25 | Water View | "Not available" | Extended Data has correct values |
| 26 | Water Body Name | "Not available" | Waterfront Features shows: Bay/Harbor Front, Waterfront, Gulf/Ocean, Intracoastal Waterway |

**Root Cause:** Extended Data section displays correct waterfront features, but individual fields are not being populated from the same data source.

### Category 2: Buttons Not Working (3 issues)

| # | Button | Issue | File Location |
|---|--------|-------|---------------|
| 5 | Gemini Retry Button | Fires multiple times but NEVER returns data | `src/pages/PropertyDetail.tsx` |
| 12 | Fetch with Tavily Button | Does not return data, period | `src/pages/PropertyDetail.tsx` |
| 13 | Search with Gemini Button | Does not return data, period | `src/pages/PropertyDetail.tsx` |

**Recent Fix Applied (may not be complete):**
- Separated loading states: `isTavilyRetrying` and `isGeminiRetrying` (previously shared `isRetrying`)
- Fixed API URL pattern to use `${import.meta.env.VITE_API_URL}` prefix

**Files to investigate:**
- `src/pages/PropertyDetail.tsx` - Button handlers `handleTavilyField` and `handleGeminiField`
- `api/property/fetch-tavily-field.ts` - Tavily single-field endpoint
- `api/property/fetch-gemini-field.ts` - Gemini single-field endpoint

### Category 3: False/Lying Data (4 issues)

| # | Field | Shows | Truth | Investigation Needed |
|---|-------|-------|-------|---------------------|
| 1 | Sea Level | "6.1 miles from the coast" | House is 1000 ft from coast | Is this distance-to-coast or elevation-above-sea-level? If elevation (~6ft), text label is wrong |
| 3 | Tax Exemptions | "Homestead, Senior" | FALSE - no senior exemption | Which LLM/Tavily returned this? |
| 10 | Distance to Beach/Grocery | Fake distances | Wrong values | Possible geocode mismatch - using identical address from different location? |
| 18 | Natural Gas | Shows natural gas at property | No record found | Where did this false data originate? |

### Category 4: Missing Explanations/Calculations (3 issues)

| # | Field | Issue |
|---|-------|-------|
| 14 | Price to Rent Ratio | Not explained, calculation makes no sense |
| 15 | Price vs Median | No explanation of what it is or how calculated |
| 16 | Mortgage Rates | Shows 6.75% but web shows 6.03% - where is data source? |

### Category 5: Public Remarks Parsing Needed (4 issues)

| # | Field | Issue | Solution |
|---|-------|-------|----------|
| 4 | Interior Condition | Shows "Good to Excellent" via "Age-Based Estimate" for 1951 home | Should parse Bridge public remarks for keywords: remodeled, like new, move in ready, stunning, renovated |
| 6 | Kitchen Features | Blank | Parse from public remarks |
| 7 | Deck/Patio/Fence/Landscaping | Blank | Parse from public remarks |
| 8 | Permits vs Kitchen | Permits shows "kitchen completely renovated in 2025" | Should populate Kitchen field |

**Proposed Logic for Interior Condition:**
1. If home < 10 years old → "Excellent" (new construction)
2. Else parse public remarks for keywords → map to condition rating
3. Else fallback to age-based estimate WITH low confidence warning

### Category 6: External API Issues (2 issues)

| # | API | Issue | Files Affected |
|---|-----|-------|----------------|
| 9 | Transit/Safety/Noise APIs | Return "No data" | Need investigation |
| 11 | FBI Crime API | HTTP 503 errors, needs timeout doubled | **24 FILES** - see list below |

**FBI Timeout Files (all need timeout increased):**
```
api/property/enrichment-free-apis.ts
api/property/fbi-crime.ts
(+ 22 other files - search for "fbi" or crime API references)
```

### Category 7: UI/Display Issues (3 issues)

| # | Field | Issue |
|---|-------|-------|
| 2 | Full Address | Shows "DATA CONFLICT" but API data matches display exactly - false positive |
| 17 | Comparable Sales | Shows no actual comps, just ambiguous "395000" on right side |
| 27 | Market Performance | Shows which LLMs contributed but only final value - user wants mini-fields showing each LLM's specific response |

---

## KEY FILES TO UNDERSTAND

### Field Schema (SOURCE OF TRUTH)
```
src/types/fields-schema.ts - DO NOT MODIFY - all other files must match this
```

### Property Detail Page (Main UI)
```
src/pages/PropertyDetail.tsx - Central display, Tavily/Gemini button handlers
```

### Data Mappers
```
src/lib/field-normalizer.ts - Must match fields-schema.ts
src/lib/visualsDataMapper.ts - Maps data to visual components
src/components/broker/propertyToChartMapper.ts - Chart data mapping
```

### API Endpoints
```
api/property/search.ts - Main search endpoint
api/property/tavily-search.ts - Tier 3 Tavily (46 parallel searches at line 2115)
api/property/fetch-tavily-field.ts - Single field Tavily fetch
api/property/fetch-gemini-field.ts - Single field Gemini fetch
api/property/smart-score-llm-consensus.ts - LLM consensus scoring
api/property/enrichment-free-apis.ts - Tier 2 free APIs
```

### Recent TypeScript Fixes
```
api/property/smart-score-llm-consensus.ts - Fixed null type errors (lines 86-100)
src/components/perplexity/categories/CategoryG.tsx - Boolean handling
src/components/property/PropertyCardUnified.tsx - Boolean comparison
src/lib/visualsDataMapper.ts - evChargingYn type mismatch
```

---

## TAVILY PARALLEL SEARCH PROBLEM (CRITICAL)

**Location:** `api/property/tavily-search.ts` line 2115

**Current Code:**
```typescript
const [avmFields, paywallAvmFields, marketFields, utilityFields, utilityBillFields, permitFields, ageFields, featureFields, marketPerfFields, homesteadFields, taxFields, walkabilityFields, financialFields, emergencyFields] = await Promise.all([
  searchAVMs(address), // 2 searches
  searchPaywallAVMs(address), // 4 searches (line 227)
  searchMarketStats(city, zip), // 3 searches (line 344)
  searchUtilities(city, state), // 4 searches (line 619)
  searchUtilityBills(city, state, zip), // 4 searches
  searchPermits(address, county), // 2 searches
  searchAgeAndRenovations(address, county), // 3 searches (line 850)
  searchPropertyFeatures(address, city), // 5 searches (line 986)
  searchMarketPerformance(city, state, zip), // 6 searches (line 1213)
  searchHomesteadAndCDD(address, county), // 3 searches (line 1357)
  searchTaxData(address, county), // 3 searches (line 1557)
  searchWalkability(address, city, state), // 3 searches (line 1860)
  searchFinancialData(city, state, zip), // 3 searches (line 1941)
  searchEmergencyServices(address, city, state), // 1 search
]);
```

**Total: ~46 parallel Tavily web searches**
**Each has 45-second timeout**
**Result: Consumes entire Vercel 300-second limit before LLMs can run**

---

## ENVIRONMENT VARIABLES (Already configured in Vercel)

DO NOT ask about these - they are set:
- `TAVILY_API_KEY`
- `GEMINI_API_KEY`
- `ANTHROPIC_API_KEY`
- `BRIDGE_API_TOKEN`
- `BRIDGE_API_ID`
- `VITE_API_URL`

---

## RECENT COMMITS

```
2c66e79 - Fix TypeScript null type errors in smart-score-llm-consensus.ts
31d81c8 - (previous commits with boolean field fixes)
```

---

## USER FRUSTRATION POINTS (IMPORTANT CONTEXT)

1. **"The app is in worse shape now than 2 weeks ago"**
2. **Tavily and Gemini buttons are "worthless and simply do not return data period end of story"**
3. **"If you are not going to fix this once and for all let me know right now"**
4. **Do NOT ask about environment variables - they are configured**
5. **It's "Bridge" MLS, not "Stellar" MLS (Bridge is the API provider for Stellar MLS data)**
6. **The app has NEVER used Supabase - don't mention it**

---

## PRIORITY ORDER FOR FIXES

### HIGH PRIORITY (User explicitly frustrated about these)
1. **Fix Tavily button** - Must return data for single field fetches
2. **Fix Gemini button** - Must return data for single field fetches
3. **Fix Bridge field mapping** - Waterfront fields, Kitchen, Garage, View Type, Lot Features

### MEDIUM PRIORITY
4. **Public remarks parsing** - Extract condition, features, renovations from remarks
5. **FBI API timeout** - Double timeout across 24 files
6. **Tavily parallelism** - Reduce to allow LLMs to run within 300s

### LOWER PRIORITY
7. **UI explanations** - Price to Rent Ratio, Price vs Median, Mortgage Rates source
8. **Market Performance mini-fields** - Show each LLM's individual response
9. **False positive conflict detection** - Address field showing conflict when identical

---

## FIELD MAPPING TRUTH DOCUMENT

Always read this first before any field work:
```
D:\Clues_Quantum_Property_Dashboard\FIELD_MAPPING_TRUTH.md
```

---

## STARTING PROMPT FOR NEW CONVERSATION

```
I'm continuing work on the CLUES Property Dashboard. Please read the handoff document at:
D:\Clues_Quantum_Property_Dashboard\HANDOFF_2026-01-14_PROPERTY_DETAILS_BUGS.md

This contains 27 identified bugs with a test property (8635 Boca Ciega Drive, St Pete Beach, FL 33706).

Priority tasks:
1. Fix Tavily single-field fetch button (doesn't return data)
2. Fix Gemini single-field fetch button (doesn't return data)
3. Fix Bridge field mapping for waterfront fields

Start by reading PropertyDetail.tsx to understand the button handlers.
```

---

## CONVERSATION TRANSCRIPT LOCATION

Full previous conversation available at:
```
C:\Users\broke\.claude\projects\C--Users-broke\ba1ef5a6-62c1-48e8-b39f-e32c19710d61.jsonl
```

---

## END OF HANDOFF DOCUMENT
