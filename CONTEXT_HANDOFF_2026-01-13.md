# CONTEXT HANDOFF - 2026-01-13

## SESSION SUMMARY
Conversation ID: AVM-TAVILY-FIX-2026-01-13

### COMPLETED FIXES THIS SESSION

#### 1. AVM Field Logic Restructure (Commits: 4dd752d, f138104)
**Problem:** LLMs pre-calculated Field 12 (Market Value Estimate) as average of AVMs, leaving Field 16 (AVMs Average) empty.

**Solution:**
- Removed pre-calculation instructions from all LLM prompts
- Field 12 = highest-tier verified AVM source (priority: Zestimate > Redfin > others)
- Field 16 = backend-calculated average of 16a-16f
- Updated 4 files: perplexity-prompts.ts, gemini-prompts.ts, search.ts, retry-llm.ts

**Backend logic added at search.ts:5889-5926:**
```typescript
const avmPriority = [
  { field: '16a_zestimate', source: 'Zillow Zestimate' },
  { field: '16b_redfin_estimate', source: 'Redfin Estimate' },
  // ... 16c-16f
];
// Loop through priority, set Field 12 to first available
```

#### 2. Paywall AVM Encouragement (Commit: f138104)
Changed field definitions for 16c-16f from "behind paywall - return null" to encourage searching public sites.

#### 3. Tavily Fields 169-174 Fix (Commit: b630470)
**Problem:** `searchPortalViews()` was EMPTY after fields were repurposed from portal views to market metrics.

**Solution:**
- Created new `searchMarketPerformance(city, state, zip)` function
- Searches 6 fields in PARALLEL:
  - 169: months_of_inventory
  - 170: new_listings_30d
  - 171: homes_sold_30d
  - 172: median_dom_zip
  - 173: price_reduced_percent
  - 174: homes_under_contract
- Updated `runTavilyTier3()` to call new function
- Increased timeout 30s → 45s

#### 4. Tax Fields Added to Tavily Tier 3 (Commit: 19bf16e)
**Problem:** Tax fields (15, 35, 38) were not searched by Tavily Tier 3.

**Solution:**
- Created new `searchTaxData(address, county)` function
- Florida county property appraiser domain mappings (16 counties)
- Searches 3 fields in PARALLEL:
  - 15: assessed_value
  - 35: annual_taxes
  - 38: tax_exemptions (Homestead, Senior, Veteran, Widow, Disability, SOH)
- Field 37 (property_tax_rate) is backend-calculated from 15+35
- Integrated into `runTavilyTier3()` parallel Promise.all()
- Updated llm-constants.ts field list

---

#### 5. Paywall AVMs Added to Tavily Tier 3 (Commit: 3390c50)
**Problem:** Paywall AVM fields (16c-16f) were not searched by Tavily Tier 3.

**Solution:**
- Created new `searchPaywallAVMs(address)` function
- All 4 searches run in PARALLEL:
  - 16c: first_american_avm
  - 16d: quantarium_avm
  - 16e: ice_avm
  - 16f: collateral_analytics_avm
- Low confidence assigned (typically behind paywalls)
- Integrated into `runTavilyTier3()` parallel Promise.all()

---

#### 6. Age/Permits Added to Tavily Tier 3 (Commit: 50d6016)
**Problem:** Age estimates and renovation fields not searched by Tavily.

**Solution:**
- Created new `searchAgeAndRenovations(address, county)` function
- Fields searched in PARALLEL:
  - 40: roof_age_est (calculates from install year)
  - 46: hvac_age (calculates from install year)
  - 59: recent_renovations (Kitchen, Bathroom, Flooring, etc.)
- Added Field 62: permit_history_other to existing searchPermits()
- Integrated into `runTavilyTier3()` parallel Promise.all()

---

#### 7. Utility Bills Added to Tavily Tier 3 (Commit: 3a4e443)
**Problem:** Utility bill estimates not searched by Tavily.

**Solution:**
- Created new `searchUtilityBills(city, state, zip)` function
- Fields searched in PARALLEL:
  - 105: electric_bill_avg
  - 107: water_bill_avg
  - 108: sewer_bill_avg
  - 110: trash_bill_avg
  - 111: cable_internet_avg
  - 112: total_utilities_avg
  - 113-115: solar panel info (yn, owned/leased, savings)
- Integrated into `runTavilyTier3()` parallel Promise.all()

---

#### 8. Market Stats Expanded in Tavily Tier 3 (Commit: bf5e36d)
**Problem:** Market stats function only handled 3 of 8 fields.

**Solution:**
- Expanded `searchMarketStats(city, zip)` from 3 to 8 fields
- Now runs 3 parallel searches for better coverage
- Fields added:
  - 93: avg_sale_to_list_ratio
  - 94: appreciation_1yr
  - 96: inventory_level
  - 97: sale_price_median
  - 98: list_price_median
- Improved regex patterns with sanity checks

---

#### 9. Property Features Added to Tavily Tier 3 (Commit: bfb9099)
**Problem:** Property feature fields (131-138) not searched by Tavily.

**Solution:**
- Created new `searchPropertyFeatures(address, city)` function
- Fields searched in PARALLEL:
  - 131: pool_yn
  - 132: pool_type
  - 133: ev_charging
  - 134: smart_home_features
  - 135: accessibility_modifications
  - 136: outdoor_kitchen
  - 137: hurricane_shutters
  - 138: special_assessments
- Integrated into `runTavilyTier3()` parallel Promise.all()

---

#### 10. Market Performance Expanded in Tavily Tier 3 (Commit: 22f2950)
**Problem:** Market performance function only handled 6 of 13 fields.

**Solution:**
- Expanded `searchMarketPerformance()` from 6 to 13 fields
- Added 3 additional parallel searches
- New fields:
  - 175: avg_list_price_change
  - 176: buyer_vs_seller_market
  - 177: absorption_rate
  - 178: price_growth_forecast
  - 179: rental_yield_estimate
  - 180: cap_rate_estimate
  - 181: gross_rent_multiplier

---

### ALL TASKS COMPLETED

---

### KEY FILES REFERENCE

| File | Purpose |
|------|---------|
| `api/property/tavily-search.ts` | Tier 3 main search functions |
| `api/property/tavily-field-config.ts` | 55-field config for individual buttons |
| `api/property/fetch-tavily-field.ts` | API endpoint for button fetches |
| `api/property/search.ts` | Main search orchestration, LLM prompts |
| `api/property/retry-llm.ts` | Retry LLM prompts |
| `api/property/perplexity-prompts.ts` | Perplexity-specific prompts |
| `src/config/gemini-prompts.ts` | Gemini-specific prompts |
| `src/lib/calculate-derived-fields.ts` | Backend calculations (Field 16 AVMs average) |

---

### TAVILY TIER 3 SEARCH STRUCTURE

```typescript
// runTavilyTier3() calls these 11 functions in PARALLEL:
searchAVMs(address)                    // 16a, 16b
searchPaywallAVMs(address)             // 16c, 16d, 16e, 16f
searchMarketStats(city, zip)           // 91-98 (8 fields)
searchUtilities(city, state)           // 104, 106, 109
searchUtilityBills(city, state, zip)   // 105, 107-116 (12 fields)
searchPermits(address, county)         // 60, 61, 62
searchAgeAndRenovations(address, county) // 40, 46, 59
searchPropertyFeatures(address, city)  // 131-138 (8 fields)
searchMarketPerformance(city, state, zip) // 169-181 (13 fields)
searchHomesteadAndCDD(address, county) // 151, 152, 153
searchTaxData(address, county)         // 15, 35, 38
```

**Total Fields Now Searched by Tavily Tier 3: ~55 fields**

---

### TIMEOUTS

| Service | Timeout |
|---------|---------|
| Stellar MLS | 15s |
| Free APIs | 60s |
| **Tavily** | **45s** (increased from 30s) |
| LLMs | 60s |
| Perplexity | 45s |

---

### GIT COMMITS THIS SESSION

1. `4dd752d` - fix(AVM): Separate Field 12 from Field 16
2. `f138104` - fix(AVM): Encourage searching for paywall AVMs
3. `b630470` - fix(Tavily): Implement searchMarketPerformance() for 169-174
4. `19bf16e` - fix(Tavily): Add tax fields (15, 35, 38) to Tier 3 search
5. `3390c50` - fix(Tavily): Add paywall AVMs (16c-16f) to Tier 3 search
6. `50d6016` - fix(Tavily): Add age/permits (40, 46, 59, 62) to Tier 3 search
7. `3a4e443` - fix(Tavily): Add utility bills (105, 107-116) to Tier 3 search
8. `bf5e36d` - fix(Tavily): Expand market stats (91-98) in Tier 3 search
9. `bfb9099` - fix(Tavily): Add property features (131-138) to Tier 3 search
10. `22f2950` - fix(Tavily): Expand market performance (175-181) in Tier 3 search

All pushed to main branch.
