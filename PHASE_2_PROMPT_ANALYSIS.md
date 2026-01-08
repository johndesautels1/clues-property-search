# 🔍 PHASE 2: LLM PROMPT FIELD COVERAGE ANALYSIS
**Date:** 2026-01-08
**Purpose:** Audit which fields are requested in each LLM prompt

---

## 📊 EXECUTIVE SUMMARY

After auditing all LLM prompts, I discovered that **most fields the user mentioned are ALREADY in the prompts**. This analysis documents the current state and identifies the few remaining gaps.

---

## ✅ FIELDS ALREADY IN ALL LLM PROMPTS

### **AVMs (Fields 16a-16f) - ✅ COMPLETE**
**Status:** Already requested in ALL LLM prompts (Perplexity, Gemini, GPT, Claude Sonnet, Grok)

**Evidence:**
- **Perplexity Prompt A** (lines 56-62): Requests all 6 AVMs individually
- **Gemini** (lines 64-70): Requests all 6 AVMs with site-specific searches
- **GPT** (lines 3253-3261): Mandatory search queries for all AVMs
- **Claude Sonnet** (lines 3490-3497): Lists all 7 AVM fields
- **Grok** (lines 3101-3110): Lists all 7 AVM fields in output schema

**Sample from Perplexity Prompt A:**
```
SPECIFIC AVM VALUES (search each source individually):
zestimate (Zillow's Zestimate - search site:zillow.com for this address)
redfin_estimate (Redfin Estimate - search site:redfin.com for this address)
first_american_avm (First American AVM if available)
quantarium_avm (Quantarium AVM if available)
ice_avm (ICE/Intercontinental Exchange AVM if available)
collateral_analytics_avm (Collateral Analytics AVM if available)
```

---

### **Utilities (Fields 104, 106, 109) - ✅ COMPLETE**
**Status:** Already requested in ALL LLM prompts

**Evidence:**
- **Perplexity Prompt D** (lines 237-242): Electric, water, gas providers
- **Gemini** (lines 117-122): All utility fields in output schema
- **GPT** (lines 3274-3279): Mandatory utility searches
- **Claude Sonnet** (lines 3517-3521): Utility provider fields
- **Grok** (lines 3139-3143): Utility fields in output schema

**Sample from Perplexity Prompt D:**
```
electric_utility_provider_name
water_utility_provider_name
natural_gas_provider_name_or_none
```

---

### **Market Data (Fields 91, 92, 95) - ✅ COMPLETE**
**Status:** Already requested in ALL LLM prompts

**Evidence:**
- **Perplexity Prompt A** (lines 78-82): Neighborhood market stats
- **Gemini** (lines 110-113): Market fields in output schema
- **GPT** (lines 3264-3268): Market statistics searches
- **Claude Sonnet** (lines 3500-3502): Market & pricing fields
- **Grok** (lines 3132-3135): Market stats in output schema

---

### **Portal Views (Fields 169-172, 174) - ✅ COMPLETE**
**Status:** Already requested in ALL LLM prompts

**Evidence:**
- **Gemini** (lines 125-129): Portal views in output schema
- **GPT** (lines 3294-3298): Market activity searches
- **Claude Sonnet** (lines 3529-3534): Market activity fields
- **Grok** (lines 3146-3150): Portal views in output schema

**Note:** Perplexity does NOT request portal views (these require active listing access, not web search)

---

## ⚠️ FIELDS MISSING FROM SOME LLM PROMPTS

### **Permits & Renovations (Fields 59-62) - PARTIAL**
**Status:** ✅ In Perplexity, ❌ Missing from Gemini/GPT/Claude Sonnet/Grok

**Current Coverage:**
- **Perplexity Prompt A** ✅ - Line 77: `recent_renovations_or_upgrades`
- **Perplexity Prompt B** ✅ - Lines 131-133: `permit_history_roof`, `permit_history_hvac`, `permit_history_other`
- **Gemini** ❌ - NOT in "34 high-velocity fields" list
- **GPT** ❌ - NOT in mandatory search queries
- **Claude Sonnet** ❌ - NOT in field list
- **Grok** ❌ - NOT in output schema

**Gap:** Fields 59-62 are requested by Perplexity (Tier 4 priority), but NOT by the other web-search LLMs that fire after it. If Perplexity fails to find these fields, the other LLMs won't search for them either.

**Recommendation:** Add fields 59-62 to the "34 high-velocity fields" list in Gemini, GPT, Claude Sonnet, and Grok prompts.

---

### **Property Features (Fields 133-135, 138) - MISSING**
**Status:** ❌ NOT in ANY LLM prompts

**Missing Fields:**
- **133_security_features**: Home security system details
- **134_smart_home_features**: Smart home technology (Nest, Alexa, etc.)
- **135_view**: Property view description (water, mountain, city, etc.)
- **138_guest_parking**: Guest/visitor parking availability

**Current Coverage:**
- **Perplexity** ❌ - NOT requested
- **Gemini** ❌ - NOT in field list
- **GPT** ❌ - NOT in searches
- **Claude Sonnet** ❌ - NOT in field list
- **Grok** ❌ - NOT in schema

**Gap:** These fields are NOT in the "34 high-velocity fields" list and are NOT requested by any LLM. They can only be populated from Bridge MLS API.

**Recommendation:** Add fields 133-135, 138 to all LLM prompts if the user wants LLMs to search for these.

---

## 📋 34 HIGH-VELOCITY FIELDS (Current List)

The current "34 high-velocity fields" list includes:
1. **AVMs (7 fields):** 12, 16a, 16b, 16c, 16d, 16e, 16f ✅
2. **Market Stats (9 fields):** 91, 92, 95, 96, 175, 176, 177, 178, 180 ✅
3. **Rental/Investment (3 fields):** 97, 98, 181 ✅
4. **Utilities (8 fields):** 104, 105, 106, 107, 110, 111, 114 (note: 109 is missing but 110 is included) ✅
5. **Location (2 fields):** 81, 82 ✅
6. **Portal Views (5 fields):** 169, 170, 171, 172, 174 ✅

**Total:** 34 fields ✅

**Missing from "34 high-velocity" list:**
- **109_natural_gas**: Gas provider (currently 110_trash_provider is in the list instead)
- **59-62**: Permits/renovations (4 fields)
- **133-135, 138**: Property features (4 fields)

---

## 🎯 PHASE 2 RECOMMENDATIONS

### **Option A: No Changes Needed**
If the user's concern was about AVMs, utilities, market data, and portal views - these are ALREADY in all prompts. No changes needed.

### **Option B: Add Missing Fields to Expand Coverage**
If the user wants comprehensive coverage, add these fields to all LLM prompts:

1. **Add to all LLMs (Gemini, GPT, Sonnet, Grok):**
   - Fields 59-62 (permits/renovations)
   - Fields 133-135, 138 (property features)

2. **Fix field number discrepancy:**
   - Current list has "110_trash_provider"
   - Should also include "109_natural_gas" (already in Perplexity Prompt D)

### **Option C: Verify with User**
Ask user to clarify which specific fields they want added, since most are already present.

---

## 🔍 DETAILED FIELD AUDIT BY LLM

| Field # | Name | Perplexity | Gemini | GPT | Sonnet | Grok |
|---------|------|------------|--------|-----|--------|------|
| **12** | market_value_estimate | ✅ A | ✅ | ✅ | ✅ | ✅ |
| **16a** | zestimate | ✅ A | ✅ | ✅ | ✅ | ✅ |
| **16b** | redfin_estimate | ✅ A | ✅ | ✅ | ✅ | ✅ |
| **16c** | first_american_avm | ✅ A | ✅ | ✅ | ✅ | ✅ |
| **16d** | quantarium_avm | ✅ A | ✅ | ✅ | ✅ | ✅ |
| **16e** | ice_avm | ✅ A | ✅ | ✅ | ✅ | ✅ |
| **16f** | collateral_analytics_avm | ✅ A | ✅ | ✅ | ✅ | ✅ |
| **59** | recent_renovations | ✅ A | ❌ | ❌ | ❌ | ❌ |
| **60** | permit_history_roof | ✅ B | ❌ | ❌ | ❌ | ❌ |
| **61** | permit_history_hvac | ✅ B | ❌ | ❌ | ❌ | ❌ |
| **62** | permit_history_other | ✅ B | ❌ | ❌ | ❌ | ❌ |
| **81** | public_transit_access | ✅ C | ✅ | ✅ | ✅ | ✅ |
| **82** | commute_to_city_center | ✅ C | ✅ | ✅ | ✅ | ✅ |
| **91** | median_home_price_neighborhood | ✅ A | ✅ | ✅ | ✅ | ✅ |
| **92** | price_per_sqft_recent_avg | ✅ A | ✅ | ✅ | ✅ | ✅ |
| **95** | days_on_market_avg | ✅ A | ✅ | ✅ | ✅ | ✅ |
| **96** | inventory_surplus | ❌ | ✅ | ✅ | ✅ | ✅ |
| **97** | insurance_est_annual | ❌ | ✅ | ✅ | ✅ | ✅ |
| **98** | rental_estimate_monthly | ✅ A | ✅ | ✅ | ✅ | ✅ |
| **103** | comparable_sales | ✅ A,E | ✅ | ✅ | ✅ | ✅ |
| **104** | electric_provider | ✅ D | ✅ | ✅ | ✅ | ✅ |
| **105** | avg_electric_bill | ✅ D | ✅ | ✅ | ✅ | ✅ |
| **106** | water_provider | ✅ D | ✅ | ✅ | ✅ | ✅ |
| **107** | avg_water_bill | ✅ D | ✅ | ✅ | ✅ | ✅ |
| **109** | natural_gas | ✅ D | ❌ | ✅ | ❌ | ❌ |
| **110** | trash_provider | ✅ D | ✅ | ✅ | ✅ | ✅ |
| **111** | internet_providers_top3 | ✅ D | ✅ | ✅ | ✅ | ✅ |
| **114** | cable_tv_provider | ✅ D | ✅ | ✅ | ✅ | ✅ |
| **133** | security_features | ❌ | ❌ | ❌ | ❌ | ❌ |
| **134** | smart_home_features | ❌ | ❌ | ❌ | ❌ | ❌ |
| **135** | view | ❌ | ❌ | ❌ | ❌ | ❌ |
| **138** | guest_parking | ❌ | ❌ | ❌ | ❌ | ❌ |
| **169** | zillow_views | ❌ | ✅ | ✅ | ✅ | ✅ |
| **170** | redfin_views | ❌ | ✅ | ✅ | ✅ | ✅ |
| **171** | homes_views | ❌ | ✅ | ✅ | ✅ | ✅ |
| **172** | realtor_views | ❌ | ✅ | ✅ | ✅ | ✅ |
| **174** | saves_favorites | ❌ | ✅ | ✅ | ✅ | ✅ |
| **175** | market_type | ❌ | ✅ | ✅ | ✅ | ✅ |
| **176** | avg_sale_to_list_percent | ❌ | ✅ | ✅ | ✅ | ✅ |
| **177** | avg_days_to_pending | ❌ | ✅ | ✅ | ✅ | ✅ |
| **178** | multiple_offers_likelihood | ❌ | ✅ | ✅ | ✅ | ✅ |
| **180** | price_trend | ❌ | ✅ | ✅ | ✅ | ✅ |
| **181** | rent_zestimate | ✅ A | ✅ | ✅ | ✅ | ✅ |

**Legend:**
- ✅ = Field is requested in that LLM's prompt
- ❌ = Field is NOT requested
- A, B, C, D, E = Perplexity Prompt letter

---

## 📝 CONCLUSION

**User's Original Concern:** "AVMs (16a-16f) are not requested in any llm prompts"

**Reality:** AVMs ARE requested in ALL LLM prompts (Perplexity, Gemini, GPT, Claude Sonnet, Grok)

**Actual Gaps Found:**
1. Fields 59-62 (permits/renovations) - Only in Perplexity, not in other LLMs
2. Fields 133-135, 138 (features) - Not in any LLM prompts
3. Field 109 (natural_gas) - In Perplexity/GPT, but not in Gemini/Sonnet/Grok

**Next Steps:** Await user clarification on whether to:
- Consider Phase 2 complete (most fields already present)
- Add the 8 missing fields (59-62, 133-135, 138, 109) to all LLMs
- Other changes

---

**Report Generated:** 2026-01-08
**Files Audited:**
- `api/property/perplexity-prompts.ts`
- `src/config/gemini-prompts.ts`
- `api/property/search.ts` (GPT, Claude Sonnet, Grok, Claude Opus prompts)
