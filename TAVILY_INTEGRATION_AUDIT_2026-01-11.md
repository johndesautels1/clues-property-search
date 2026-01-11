# Tavily Integration Audit - Field 169-174 Repurposing
**Date:** 2026-01-11
**Status:** 🔴 **2 CRITICAL BUGS FOUND**

---

## Executive Summary

Audited all files touched by the Field 169-174 repurposing (portal views → market metrics). Found **2 critical bugs** in Perplexity prompts that would cause LLMs to search for the WRONG data.

**✅ Phase 1-7 Complete:** All schema, API, and documentation files updated correctly
**❌ BUGS FOUND:** Perplexity prompts still reference old field names/descriptions

---

## Field Repurposing Recap

**OLD (Portal Views - Blocked by scrapers):**
- 169: `zillow_views` - Zillow listing views
- 170: `redfin_views` - Redfin listing views
- 171: `homes_views` - Homes.com listing views
- 172: `realtor_views` - Realtor.com listing views
- 173: `total_views` - Sum of all views (calculated)
- 174: `saves_favorites` - Saves/favorites count

**NEW (Market Metrics - Tavily searchable):**
- 169: `months_of_inventory` - Housing supply (buyer's/seller's market)
- 170: `new_listings_30d` - New listings last 30 days
- 171: `homes_sold_30d` - Sales velocity last 30 days
- 172: `median_dom_zip` - Median days on market (ZIP)
- 173: `price_reduced_percent` - % of listings with price reductions
- 174: `homes_under_contract` - Pending sales count

---

## Files Audited - Status

### ✅ **Phase 1-7 Files (ALL CORRECT)**

| File | Status | Notes |
|------|--------|-------|
| `src/types/fields-schema.ts` | ✅ | Source of truth - correct |
| `src/types/property.ts` | ✅ | MarketPerformanceData interface - correct |
| `src/lib/field-normalizer.ts` | ✅ | All 6 field mappings updated |
| `api/property/tavily-field-config.ts` | ✅ | All 13 field configs updated |
| `api/property/tavily-field-database-mapping.ts` | ✅ | All database paths updated |
| `src/pages/PropertyDetail.tsx` | ✅ | FIELD_KEY_TO_ID_MAP updated |
| `api/property/search.ts` | ✅ | Field lists updated (8 locations) |
| `api/property/tavily-search.ts` | ✅ | Old code removed, comment added |
| `src/lib/calculate-derived-fields.ts` | ✅ | calculateTotalViews() removed |
| `api/property/smart-score-llm-consensus.ts` | ✅ | Field 174 reference updated |
| `FIELD_MAPPING_COMPREHENSIVE.md` | ✅ | Documentation updated |
| `SECTION_W_SCORING_RULES.md` | ✅ | Scoring rules updated |
| `src/config/gemini-prompts.ts` | ✅ | Fixed in Phase 7 |
| `api/property/llm-constants.ts` | ✅ | Fixed in Phase 7 |

### 🔴 **NEW FILES WITH BUGS**

| File | Status | Bug Count | Severity |
|------|--------|-----------|----------|
| `api/property/perplexity-prompts.ts` | ❌ | 3 locations | CRITICAL |
| `api/property/retry-llm.ts` | ❌ | 2 locations | HIGH |

---

## 🐛 BUG #1: perplexity-prompts.ts - Prompt F Descriptions

**Location:** Lines 400-404

**Problem:** Prompt F still describes old portal view fields

```typescript
// CURRENT (WRONG):
MARKET ACTIVITY (if property is actively listed - return null if not found):
zillow_views (number of views on Zillow listing page)
redfin_views (number of views on Redfin listing page)
homes_views (number of views on Homes.com listing page)
realtor_views (number of views on Realtor.com listing page)
saves_favorites (total saves or favorites across all portals)
```

**Impact:**
- Perplexity LLM will search for "Zillow views" instead of "months of inventory"
- Will return null because views are blocked by scrapers
- User gets no market metrics data

**Fix:**
```typescript
// CORRECT:
MARKET PERFORMANCE METRICS (search market data sites, NOT listing portals):
months_of_inventory (months of housing supply in ZIP/city: <3mo = seller's market, 3-6mo = balanced, >6mo = buyer's market)
new_listings_30d (new listings in ZIP/city in last 30 days - supply indicator)
homes_sold_30d (homes sold in ZIP/city in last 30 days - demand indicator)
median_dom_zip (median days on market for ZIP/city - velocity indicator)
price_reduced_percent (percentage of active listings with price reductions - market pressure indicator)
homes_under_contract (homes currently pending in ZIP/city - competition indicator)
```

---

## 🐛 BUG #2: perplexity-prompts.ts - Example Output

**Location:** Lines 425-429

**Problem:** Example output shows old field names

```typescript
// CURRENT (WRONG):
{
  "zillow_views": 1250,
  "redfin_views": 890,
  "homes_views": null,
  "realtor_views": 450,
  "saves_favorites": 45
}
```

**Impact:**
- Perplexity sees example with old field names
- Will try to return `zillow_views` instead of `months_of_inventory`
- Field mapping won't convert it correctly

**Fix:**
```typescript
// CORRECT:
{
  "months_of_inventory": 4.2,
  "new_listings_30d": 156,
  "homes_sold_30d": 142,
  "median_dom_zip": 28,
  "price_reduced_percent": 18.5,
  "homes_under_contract": 89
}
```

---

## 🐛 BUG #3: perplexity-prompts.ts - Field Mapping

**Location:** Lines 545-549

**Problem:** PERPLEXITY_FIELD_MAPPING still maps old field names to old IDs

```typescript
// CURRENT (WRONG):
'zillow_views': '169_zillow_views',
'redfin_views': '170_redfin_views',
'homes_views': '171_homes_views',
'realtor_views': '172_realtor_views',
'saves_favorites': '174_saves_favorites',
```

**Impact:**
- Even if Perplexity returns correct data with old keys, mapping fails
- Maps to non-existent field IDs (169_zillow_views doesn't exist anymore)
- Data gets lost in translation

**Fix:**
```typescript
// CORRECT:
'months_of_inventory': '169_months_of_inventory',
'new_listings_30d': '170_new_listings_30d',
'homes_sold_30d': '171_homes_sold_30d',
'median_dom_zip': '172_median_dom_zip',
'price_reduced_percent': '173_price_reduced_percent',
'homes_under_contract': '174_homes_under_contract',
```

---

## 🐛 BUG #4: retry-llm.ts - Field Descriptions

**Location:** Lines 1483-1484

**Problem:** Wrong/duplicate field descriptions

```typescript
// CURRENT (WRONG):
- 169_months_of_inventory: Months of housing inventory in ZIP/city
- 171_homes_sold_30d: Number of Redfin views  // ← WRONG!
- 171_homes_sold_30d: Homes sold in last 30 days  // ← DUPLICATE LINE NUMBER
- 172_median_dom_zip: Median days on market (ZIP)
- 174_homes_under_contract: Homes currently under contract
```

**Impact:**
- Line 1483 describes field 171 as "Number of Redfin views" (OLD)
- Missing descriptions for fields 170, 173
- Confuses LLM about what data to search for

**Fix:**
```typescript
// CORRECT:
- 169_months_of_inventory: Months of housing inventory in ZIP/city
- 170_new_listings_30d: New listings in last 30 days
- 171_homes_sold_30d: Homes sold in last 30 days
- 172_median_dom_zip: Median days on market (ZIP)
- 173_price_reduced_percent: Percentage of listings with price reductions
- 174_homes_under_contract: Homes currently under contract
```

---

## Why These Bugs Are Critical

### **Data Flow:**
1. User searches property
2. `search.ts` calls Perplexity with prompt from `perplexity-prompts.ts`
3. Prompt tells Perplexity: "Search for zillow_views"
4. Perplexity searches Zillow.com for view counts
5. Zillow blocks scraper → returns null
6. User gets NO market metrics (all 6 fields empty)

### **Correct Flow (After Fix):**
1. User searches property
2. `search.ts` calls Perplexity with FIXED prompt
3. Prompt tells Perplexity: "Search for months_of_inventory"
4. Perplexity searches market data sites (Movoto, Estately, etc.)
5. Returns actual market metrics
6. User gets 6 valuable market performance fields ✅

---

## Tavily Integration Status

### ✅ **Tavily Side - All Correct**
- `tavily-field-config.ts`: All 13 field configs have correct search queries
- `tavily-field-database-mapping.ts`: All paths point to new field keys
- `tavily-search.ts`: Old view extraction code removed
- Tavily will search for CORRECT data (inventory, not views)

### ❌ **Perplexity Side - Broken**
- `perplexity-prompts.ts`: Still tells LLM to search for views
- `retry-llm.ts`: Wrong field descriptions
- When Perplexity Prompt F runs, it searches for WRONG data

---

## Cross-Entry Point Safety

**Tested:** All entry points for Tavily contamination:

| Entry Point | Uses Tavily? | Uses Perplexity? | Status |
|-------------|--------------|------------------|--------|
| Property Search | ✅ Yes | ✅ Yes | ❌ Perplexity broken |
| Add Property (Address) | ✅ Yes | ✅ Yes | ❌ Perplexity broken |
| Add Property (PDF) | ✅ Yes | ✅ Yes | ❌ Perplexity broken |
| PropertyDetail Retry Tavily | ✅ Yes | ❌ No | ✅ Safe (Tavily correct) |
| PropertyDetail Retry LLM | ❌ No | ✅ Yes | ❌ Perplexity broken |

**Summary:**
- Tavily searches work correctly (correct field configs)
- Perplexity searches broken (wrong prompts)
- Only affects Perplexity Prompt F (Property Features & Market Activity)

---

## Fixes Required

### 1. **perplexity-prompts.ts - Lines 400-404**
Replace old portal view descriptions with new market metrics descriptions

### 2. **perplexity-prompts.ts - Lines 425-429**
Replace example output with new field names/values

### 3. **perplexity-prompts.ts - Lines 545-549**
Update PERPLEXITY_FIELD_MAPPING with new field keys

### 4. **retry-llm.ts - Lines 1483-1486**
Fix field 171 description, add missing fields 170 & 173

---

## Testing Plan

After fixes:

1. **Perplexity Prompt F Test:**
   - Search property with Address mode
   - Check Vercel logs for Perplexity Prompt F
   - Verify: Searches for "months of inventory" NOT "Zillow views"
   - Verify: Fields 169-174 populate with market metrics

2. **Tavily Test:**
   - Same property search
   - Click "Retry with Tavily" on field 169
   - Verify: Tavily searches market data sites (not portals)

3. **Retry LLM Test:**
   - Search property with partial data
   - Click "Retry with LLM" on empty field 171
   - Verify: LLM searches for "homes sold" not "Redfin views"

---

**Document Status:** READY FOR FIXES
**Next Step:** Fix 4 bugs in 2 files (perplexity-prompts.ts, retry-llm.ts)
