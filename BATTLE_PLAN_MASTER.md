# 🎯 COMPREHENSIVE BATTLE PLAN - FIELD MAPPING & DATA SOURCE FIXES

**Scope:** Fix all mapping errors, integrate Tavily across all files, expand LLM coverage for missing fields

---

## 📋 PART 1: CRITICAL FIELD MAPPING ERRORS

### Error #1: Field 11 - Price Per Sqft (Rental Bug)

| File Location | Current Code | Required Fix | Status |
|---------------|--------------|--------------|--------|
| api/property/search.ts | Calculates for ALL properties including rentals | Add rental detection before calculation | 🔴 BROKEN |
| src/lib/calculate-derived-fields.ts | May have calculation logic | Add rental check | 🔴 CHECK |

**Fix Logic:**
```typescript
// Detect rentals before calculating
const isRental =
  fields['10_listing_price']?.value < 10000 ||
  (fields['4_listing_status']?.value || '').toLowerCase().includes('rent') ||
  (fields['property_description']?.value || '').toLowerCase().match(/\$\d+[,/]?\s*(per\s*)?month|\brent\b/);

if (!isRental && fields['10_listing_price'] && fields['21_living_sqft']) {
  // Calculate price per sqft
}
```

---

### Error #2: Field 20 - Total Bathrooms (Using Integer Instead of Decimal)

| # | File Location | Current Code | Required Fix | Status |
|---|---------------|--------------|--------------|--------|
| 1 | src/lib/bridge-field-mapper.ts:259 | property.BathroomsTotalInteger | property.BathroomsTotalDecimal | 🔴 PRIMARY |
| 2 | src/types/fields-schema.ts | Documentation only | Update description | 📝 DOCS |
| 3 | src/lib/field-normalizer.ts | May have validation | Ensure accepts decimals | ⚠️ CHECK |
| 4 | src/lib/calculate-derived-fields.ts | May use Field 20 | No change needed | ✅ AUTO |
| 5 | api/property/search.ts | May reference Field 20 | No change needed | ✅ AUTO |
| 6 | api/property/arbitration.ts | Arbitration logic | Handles automatically | ✅ AUTO |
| 7 | src/pages/PropertyDetail.tsx | Display logic | No change needed | ✅ AUTO |
| 8 | Test files (if any) | Mock data | Update test fixtures | ⚠️ CHECK |

**Fix:**
```typescript
// File: src/lib/bridge-field-mapper.ts line 259
// BEFORE:
addField('20_total_bathrooms', property.BathroomsTotalInteger);

// AFTER:
addField('20_total_bathrooms', property.BathroomsTotalDecimal);
```

---

### Error #3: Field 53 - Primary BR Location (Maps to Fireplace Count!)

| # | File Location | Current Code | Required Fix | Status |
|---|---------------|--------------|--------------|--------|
| 1 | src/lib/bridge-field-mapper.ts:501 | addField('53_primary_br_location', property.FireplacesTotal) | addField('53_primary_br_location', property.MasterBedroomLevel) | 🔴 CRITICAL |
| 2 | src/types/fields-schema.ts | Field definition | Update description if needed | 📝 DOCS |
| 3 | src/lib/field-normalizer.ts | Normalization rules | Update to expect text (Main/Upper/Lower) | ⚠️ CHECK |
| 4 | api/property/perplexity-prompts.ts | LLM prompt | Update to ask for bedroom location | 🔴 ADD |
| 5 | api/property/search.ts | Field mapping | Verify receives correct data | ✅ AUTO |
| 6 | api/property/arbitration.ts | Arbitration | Verify type (text not number) | ⚠️ CHECK |
| 7 | src/pages/PropertyDetail.tsx | Display | Update label if shows "Fireplaces" | 🔴 FIX |
| 8 | LLM prompts (Gemini, GPT, etc.) | May request this field | Update all LLM calls | 🔴 ADD |

**Fix:**
```typescript
// File: src/lib/bridge-field-mapper.ts line ~501
// BEFORE:
addField('53_primary_br_location', property.FireplacesTotal);

// AFTER:
addField('53_primary_br_location', property.MasterBedroomLevel);
```

---

### Error #4: Field 165 - Association Approval (Maps to BuyerFinancingYN)

| # | File Location | Current Code | Required Fix | Status |
|---|---------------|--------------|--------------|--------|
| 1 | src/lib/bridge-field-mapper.ts:992 | addField('165_association_approval_yn', property.BuyerFinancingYN) | Find correct Bridge field (likely AssociationApprovalRequired or similar) | 🔴 RESEARCH |
| 2 | src/types/fields-schema.ts | Field definition | Verify correct meaning | 📝 CHECK |
| 3 | src/lib/field-normalizer.ts | May normalize this field | Update if needed | ⚠️ CHECK |
| 4 | api/property/perplexity-prompts.ts | LLM prompts | Add request for HOA approval requirements | 🔴 ADD |
| 5 | Bridge API documentation | Research correct field | Identify: AssociationApproval, HOAApprovalRequired, etc. | 🔴 RESEARCH |
| 6 | api/property/search.ts | Verify receives data | Auto-updates | ✅ AUTO |
| 7 | api/property/arbitration.ts | Arbitration | Auto-handles | ✅ AUTO |
| 8 | src/pages/PropertyDetail.tsx | Display | Verify label correct | ⚠️ CHECK |

**Fix (requires research):**
```typescript
// File: src/lib/bridge-field-mapper.ts line ~992
// BEFORE:
addField('165_association_approval_yn', property.BuyerFinancingYN);

// AFTER (need to find correct Bridge field):
addField('165_association_approval_yn', property.AssociationApprovalRequired); // VERIFY FIELD NAME
```

---

## 📋 PART 2: PUBLIC REMARKS PARSING

### Current Implementation

**YES - You already have PublicRemarks parsing in bridge-field-mapper.ts:**

```typescript
// Lines 456-469: Interior Condition Parsing
function parseInteriorConditionFromRemarks(remarks: string): string | undefined {
  // Checks for: Excellent, Good, Average, Fair, Poor
  // Based on keywords: pristine, renovated, needs work, etc.
  return condition; // 'Excellent' | 'Good' | 'Average' | 'Fair' | 'Poor'
}

// Field 48 uses this:
let interiorCondition = property.PropertyCondition;
if (!interiorCondition && property.PublicRemarks) {
  interiorCondition = parseInteriorConditionFromRemarks(property.PublicRemarks);
}
```

### Extracted Data Removed

```typescript
// Lines 1084-1112: Cleaning PublicRemarks
// Removes sentences that were extracted for:
// - Field 134: Smart home features
// - Field 135: Accessibility modifications
// - Field 138: Special assessments

const cleanedRemarks = rebuiltRemarks.trim();
```

### Storage

```typescript
return {
  publicRemarks: originalRemarks,           // Full original
  publicRemarksExtracted: cleanedRemarks,   // Cleaned version
};
```

✅ **This is already implemented!**

---

### UI Display Location (Your Request)

**You want PublicRemarks displayed at bottom of Section 23 (Market Performance).**

**File:** src/pages/PropertyDetail.tsx

**Add After Section 23:**
```typescript
{/* Section 23: Market Performance (Fields 169-181) */}
{renderSection('W', 'Market Performance', [169, 170, 171, ...])}

{/* NEW: PublicRemarks Display */}
{property.publicRemarksExtracted && (
  <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
    <h3 className="text-lg font-semibold text-gray-900 mb-3">
      Property Description
    </h3>
    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
      {property.publicRemarksExtracted}
    </p>
    <p className="text-xs text-gray-500 mt-2">
      Source: MLS Listing Remarks
    </p>
  </div>
)}
```

---

## 📋 PART 3: TAVILY INTEGRATION ACROSS ALL FILES

**The 8 Core Files Requiring Updates:**

| # | File | Purpose | Tavily Changes Needed |
|---|------|---------|----------------------|
| 1 | api/property/search.ts | Main search orchestration | Add Tavily as Tier 2.5 |
| 2 | api/property/search-stream.ts | Streaming version | Add Tavily as Tier 2.5 |
| 3 | api/property/search-by-mls.ts | MLS number search | Add Tavily as Tier 2.5 |
| 4 | api/property/perplexity-prompts.ts | Perplexity prompt builder | Add fields to prompts |
| 5 | src/lib/field-normalizer.ts | Field validation/normalization | Add Tavily as recognized source |
| 6 | api/property/arbitration.ts | Source arbitration | Add Tavily to source hierarchy |
| 7 | api/property/source-constants.ts | Source definitions | Add TAVILY_SOURCE constant |
| 8 | api/property/llm-constants.ts | LLM configuration | Add Tavily to cascade |

---

## 📋 PART 4: COMPREHENSIVE FIELD-BY-FIELD ACTION PLAN ✅ COMPLETED 2026-01-08

### Fields Needing Tavily + LLM Cascade Integration (ALL 23 FIELDS NOW IN ALL LLM PROMPTS)

| Field | Field Name | Current Sources | Add Tavily | Add to Perplexity | Add to LLMs | Priority |
|-------|------------|-----------------|------------|-------------------|-------------|----------|
| 16a | zestimate | None | ✅ YES | ✅ YES | ✅ Gemini, GPT, Sonnet, Grok | 🔥 HIGH |
| 16b | redfin_estimate | None | ✅ YES | ✅ YES | ✅ Gemini, GPT, Sonnet, Grok | 🔥 HIGH |
| 40 | roof_age_est | Bridge (rare) | ✅ YES | ✅ YES | ✅ Gemini, GPT, Sonnet, Grok | 🟡 MEDIUM |
| 46 | hvac_age | Bridge (rare) | ✅ YES | ✅ YES | ✅ Gemini, GPT, Sonnet, Grok | 🟡 MEDIUM |
| 59 | recent_renovations | Bridge/parsed | ✅ YES | ✅ YES | ✅ Gemini, GPT, Sonnet, Grok | 🟡 MEDIUM |
| 60 | permit_history_roof | Bridge (rare) | ✅ YES | ✅ YES | ✅ Gemini, GPT, Sonnet, Grok | 🟡 MEDIUM |
| 61 | permit_history_hvac | Bridge (rare) | ✅ YES | ✅ YES | ✅ Gemini, GPT, Sonnet, Grok | 🟡 MEDIUM |
| 62 | permit_history_other | Bridge (rare) | ✅ YES | ✅ YES | ✅ Gemini, GPT, Sonnet, Grok | 🟡 MEDIUM |
| 91 | median_home_price | Perplexity only | ✅ YES | ✅ Improve | ✅ Gemini, GPT, Sonnet, Grok | 🔥 HIGH |
| 92 | price_per_sqft_avg | Perplexity only | ✅ YES | ✅ Improve | ✅ Gemini, GPT, Sonnet, Grok | 🔥 HIGH |
| 95 | days_on_market_avg | Perplexity only | ✅ YES | ✅ Add specific prompt | ✅ Gemini, GPT, Sonnet, Grok | 🔥 HIGH |
| 104 | electric_provider | Bridge/Perplexity | ✅ YES | ✅ YES | ✅ All 5 LLMs | 🟡 MEDIUM |
| 106 | water_provider | Bridge/Perplexity | ✅ YES | ✅ YES | ✅ All 5 LLMs | 🟡 MEDIUM |
| 109 | natural_gas | Bridge/Perplexity | ✅ YES | ✅ YES | ✅ All 5 LLMs | 🟡 MEDIUM |
| 133 | ev_charging | Bridge/LLM | ✅ YES | ✅ YES | ✅ Gemini, GPT, Sonnet, Grok | 🟢 LOW |
| 134 | smart_home | Bridge/parsed | ✅ YES | ✅ YES | ✅ Gemini, GPT, Sonnet, Grok | 🟢 LOW |
| 135 | accessibility | Bridge/parsed | ✅ YES | ✅ YES | ✅ Gemini, GPT, Sonnet, Grok | 🟢 LOW |
| 138 | special_assessments | Bridge/parsed | ✅ YES | ✅ YES | ✅ Gemini, GPT, Sonnet, Grok | 🟡 MEDIUM |
| 169 | zillow_views | Perplexity only | ✅ YES | ✅ YES | ✅ Gemini, GPT, Sonnet, Grok | 🟢 LOW |
| 170 | redfin_views | Perplexity only | ✅ YES | ✅ YES | ✅ Gemini, GPT, Sonnet, Grok | 🟢 LOW |
| 171 | homes_views | Perplexity only | ✅ YES | ✅ YES | ✅ Gemini, GPT, Sonnet, Grok | 🟢 LOW |
| 172 | realtor_views | Perplexity only | ✅ YES | ✅ YES | ✅ Gemini, GPT, Sonnet, Grok | 🟢 LOW |
| 174 | saves_favorites | Perplexity only | ✅ YES | ✅ YES | ✅ Gemini, GPT, Sonnet, Grok | 🟢 LOW |

**Note:** Opus excluded from web search fields (no web access)

---

## 📋 PART 5: IMPLEMENTATION PHASES

### PHASE 1: Critical Fixes (DO FIRST) - 1 Hour

| Task | Files | Lines Changed | Verification |
|------|-------|---------------|--------------|
| Fix Field 11 (rental bug) | search.ts or calculate-derived-fields.ts | ~10 lines | Test with rental property |
| Fix Field 20 (decimal baths) | bridge-field-mapper.ts | 1 line | Check 2.5 bath property |
| Fix Field 53 (bedroom location) | bridge-field-mapper.ts | 1 line | Check displays floor not fireplace count |
| Fix Field 165 (HOA approval) | bridge-field-mapper.ts | 1 line + research | Verify correct Bridge field |
| Fix GPT API error | LLM call file | 1 line | GPT runs without error |
| Reduce Perplexity timeout | search.ts | 1 line | No more function timeouts |

---

### PHASE 2: Tavily Integration - 3 Hours

| Task | Files | Complexity | Verification |
|------|-------|------------|--------------|
| Create tavily-search.ts | New file | Medium | Import works, no errors |
| Add Tavily to source-constants.ts | 1 file | Low | TAVILY_SOURCE constant exists |
| Add Tavily to arbitration.ts | 1 file | Low | Tavily recognized in hierarchy |
| Add Tavily calls to search.ts | 1 file | High | Tier 2.5 runs, fields populated |
| Add Tavily calls to search-stream.ts | 1 file | High | Streaming version works |
| Add Tavily calls to search-by-mls.ts | 1 file | Medium | MLS search includes Tavily |
| Update field-normalizer.ts | 1 file | Low | Tavily as valid source |
| Update llm-constants.ts | 1 file | Low | Tavily in cascade config |

---

### PHASE 3: Perplexity Prompt Updates - 2 Hours

| Prompt | Fields to Add | File | Verification |
|--------|---------------|------|--------------|
| Prompt A | 16a, 16b (AVMs), 91, 92 (market data) | perplexity-prompts.ts | Fields returned in response |
| Prompt B | None | - | - |
| Prompt C | None | - | - |
| Prompt D | 40, 46 (ages), 104, 106, 109 (utilities) | perplexity-prompts.ts | Fields returned |
| Prompt E | 59, 60, 61, 62 (permits/reno) | perplexity-prompts.ts | Fields returned |
| New Prompt F | 133, 134, 135, 138 (features/assessments), 169-172, 174 (views) | perplexity-prompts.ts | Create new prompt |

---

### PHASE 4: LLM Cascade Expansion - 2 Hours ✅ COMPLETED 2026-01-08

| LLM | Fields to Add | File Location | Verification | Status |
|-----|---------------|---------------|--------------|--------|
| Gemini | All 23 fields (47 total) | src/config/gemini-prompts.ts | Returns field data | ✅ DONE |
| GPT | All 23 fields (47 total) | api/property/retry-llm.ts | Returns field data | ✅ DONE |
| Claude Sonnet | All 23 fields + permits/features | api/property/retry-llm.ts | Returns field data | ✅ DONE |
| Grok | All 23 fields (47 total) | api/property/retry-llm.ts | Returns field data | ✅ DONE |
| Claude Opus | Exclude web-search fields | api/property/retry-llm.ts | Only non-web fields | ✅ DONE |

**CRITICAL FIX APPLIED:** Corrected field name mismatches per fields-schema.ts SOURCE OF TRUTH:
- Field 133: `security_features` → `ev_charging`
- Field 135: `view` → `accessibility_modifications`
- Field 138: `guest_parking` → `special_assessments`

Files updated: gemini-prompts.ts, retry-llm.ts, search.ts

---

### PHASE 5: UI Update (PublicRemarks Display) - 30 Minutes

| Task | File | Change | Verification |
|------|------|--------|--------------|
| Add PublicRemarks section | PropertyDetail.tsx | Add after Section 23 | Remarks display at bottom |
| Style remarks box | CSS/Tailwind | Background, padding, border | Looks good |
| Show source attribution | Component | "Source: MLS Listing Remarks" | Attribution visible |

---

## 📋 PART 6: VERIFICATION TABLE (Proof of Fixes)

### Field 53 Fix Verification

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Read bridge-field-mapper.ts:501 | Shows FireplacesTotal (BEFORE) | ❌ |
| 2 | Change to MasterBedroomLevel | Line reads property.MasterBedroomLevel | ⏳ |
| 3 | Search property with upstairs master | Field 53 = "Upper" or "Second Floor" | ⏳ |
| 4 | Check PropertyDetail.tsx | Shows bedroom location, not fireplace count | ⏳ |
| 5 | Update field-normalizer.ts | Accepts text values (Main/Upper/Lower) | ⏳ |
| 6 | Update Perplexity prompts | Asks for "primary bedroom floor/level" | ⏳ |
| 7 | Update LLM prompts (4 LLMs) | Asks for bedroom location | ⏳ |
| 8 | Test with 5 properties | All show correct bedroom location | ⏳ |

### Field 165 Fix Verification

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Research Bridge MLS docs | Find correct field name | ⏳ |
| 2 | Test Bridge API response | Field exists in response | ⏳ |
| 3 | Update bridge-field-mapper.ts:992 | Maps to correct field | ⏳ |
| 4 | Search condo property | Field 165 = true/false for HOA approval | ⏳ |
| 5 | Check PropertyDetail.tsx | Shows "HOA Approval Required" label | ⏳ |
| 6 | Update Perplexity/LLM prompts | Asks for association approval rules | ⏳ |
| 7 | Test with 5 condo properties | Correct approval status shown | ⏳ |
| 8 | Verify arbitration logic | Handles boolean field correctly | ⏳ |

### Tavily Integration Verification

| Search Type | Test Query | Expected Fields Populated | Status |
|-------------|------------|---------------------------|--------|
| AVMs | "123 Main St" | 16a (Zestimate), 16b (Redfin) | ⏳ |
| Roof Age | "123 Main St roof" | 40 (roof_age_est) | ⏳ |
| HVAC Age | "123 Main St HVAC" | 46 (hvac_age) | ⏳ |
| Utilities | "Miami FL electric provider" | 104, 106, 109 (utility providers) | ⏳ |
| Market Data | "33706 median home price" | 91, 92, 95 (market stats) | ⏳ |
| Portal Views | "123 Main St Zillow views" | 169-172, 174 (views/saves) | ⏳ |
| Renovations | "123 Main St renovations" | 59 (recent_renovations) | ⏳ |
| Permits | "123 Main St permits" | 60, 61, 62 (permit history) | ⏳ |

---

## 📋 PART 7: UPDATED SEARCH TIMELINE (With Tavily)

### TIER 1: Bridge MLS (~2-10s)
### TIER 2: Google APIs (parallel) (~15s)
### TIER 2.5: TAVILY (NEW - sequential) (~30s) (6 searches × 5s each)
### TIER 3: Free APIs (parallel) (~15s)
### TIER 4: Perplexity (sequential) (~109s) (actual)
### TIER 5: LLM Cascade (parallel) (~180s)

**TOTAL:** ~351s ❌ OVER BUDGET

### OPTIMIZATION NEEDED:
- Run some Tavily searches in parallel
- Reduce Perplexity timeout to 45s
- Reduce LLM timeout to 120s

### OPTIMIZED:

```
TIER 1: Bridge MLS                    ~2s
TIER 2: Google APIs                   ~15s
TIER 2.5: Tavily (parallel)          ~15s (6 searches parallel)
TIER 3: Free APIs                     ~15s
TIER 4: Perplexity (5× 45s timeout)  ~109s (actual)
TIER 5: LLMs (parallel, 120s timeout) ~120s
────────────────────────────────────────────
TOTAL:                                ~276s ✅ FITS with 24s buffer
```

---

## 📋 PART 8: PRIORITY RANKING

### DO IMMEDIATELY (Next 2 Hours)

1. ✅ Fix Field 11 (rental bug) - CRITICAL
2. ✅ Fix Field 20 (decimal bathrooms) - EASY WIN
3. ✅ Fix Field 53 (bedroom location) - CRITICAL
4. ✅ Fix GPT API error - BLOCKING
5. ✅ Reduce Perplexity timeout to 45s - PREVENTS TIMEOUTS

### DO TODAY (Next 4 Hours)

6. ✅ Create tavily-search.ts client
7. ✅ Integrate Tavily into search.ts (Tier 2.5)
8. ✅ Add AVMs (16a, 16b) to Perplexity Prompt A
9. ✅ Add utilities (104, 106, 109) to Perplexity Prompt D
10. ✅ Add market data (91, 92, 95) to Perplexity/Tavily

### DO THIS WEEK

11. ✅ Research & fix Field 165 (HOA approval)
12. ✅ Add Tavily to remaining search files
13. ✅ Expand all LLM prompts with new fields
14. ✅ Add PublicRemarks UI section
15. ✅ Test all changes with 10+ properties

---

**Ready to proceed? Which phase should I start coding first?**
