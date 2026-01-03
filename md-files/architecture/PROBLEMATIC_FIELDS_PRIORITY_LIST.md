# Problematic Fields Priority List - Property 3 Analysis
**Property:** 16326 Gulf Blvd Apt 510, Redington Beach, FL
**Date:** 2025-12-30
**Source:** User-provided field data

---

## Section Completeness Overview

| Section | Fields | Populated | % | Score | Status |
|---------|--------|-----------|---|-------|--------|
| **M** Market & Investment | 12 | 2 | **17%** | 45 | 🔴 CRITICAL |
| **H** Permits & Renovations | 4 | 0 | **0%** | 0 | 🟡 IN PROGRESS (60-62 protected) |
| **Q** Parking | 5 | 1 | **20%** | 50 | 🔴 HIGH PRIORITY |
| **S** Legal | 4 | 1 | **25%** | 50 | 🔴 HIGH PRIORITY |
| **I** Schools | 8 | 5 | **63%** | 59 | 🟠 MEDIUM (missing ratings) |
| **L** Safety & Crime | 3 | 2 | **67%** | 35 | 🟠 MEDIUM |
| **P** Additional Features | 8 | 3 | **38%** | 65 | 🟠 MEDIUM |

---

## PRIORITY 1: Market & Investment Data (Section M) - 2/12 fields = 17%

### Current State
**Populated (2):**
- Field 102: Financing Terms - "Condos may face stricter lending..." (Score: 75) ✅
- Field 100: Vacancy Rate - 39.05 (Score: 15) ✅

**NULL/Missing (10):**
| Field | Name | Current Value | Source Needed | Priority |
|-------|------|---------------|---------------|----------|
| **91** | Median Home Price (Neighborhood) | null | Zillow/Redfin API or Census | 🔥 CRITICAL |
| **92** | Price Per Sq Ft (Recent Avg) | null | Zillow/Redfin API | 🔥 CRITICAL |
| **93** | Price to Rent Ratio | null | **CALCULATED** (field_10 / field_98 * 12) | 🔥 AUTO |
| **94** | Price vs Median % | null | **CALCULATED** ((field_10 - field_91) / field_91 * 100) | 🔥 AUTO |
| **95** | Days on Market (Avg) | null | Zillow/Redfin API or MLS stats | 🔥 CRITICAL |
| **96** | Inventory Surplus | null | Calculated from field_95 or API | 🟠 MEDIUM |
| **97** | Insurance Estimate (Annual) | null | Insurance API or calculator | 🔥 CRITICAL |
| **98** | Rental Estimate (Monthly) | null | Zillow Rent Zestimate API | 🔥 CRITICAL |
| **99** | Rental Yield (Est) | null | **CALCULATED** (field_98 * 12 / field_10 * 100) | 🔥 AUTO |
| **101** | Cap Rate (Est) | null | **CALCULATED** (see formula below) | 🔥 AUTO |

### Solution Breakdown

#### Fields 93, 94, 99, 101: BACKEND CALCULATIONS (1 hour)
**These should NEVER touch LLM - pure math**

Already have calculation functions in `src/lib/calculate-derived-fields.ts`:
- ✅ `calculatePriceToRentRatio()` - Field 93
- ✅ `calculatePriceVsMedian()` - Field 94
- ✅ `calculateRentalYield()` - Field 99
- ✅ `calculateCapRate()` - Field 101

**Problem:** These aren't being called in the property search pipeline!

**Fix:** Integrate `calculateAllDerivedFields()` into `api/property/search.ts`

#### Field 91: Median Home Price - API NEEDED
**Options:**
1. **Zillow API** (if available)
2. **Redfin API** (public but rate-limited)
3. **Census API** - Already working, but only tract-level
4. **Realtor.com API** (research needed)

#### Field 92: Price Per Sq Ft (Recent Avg) - API NEEDED
**Same sources as Field 91**

#### Field 95: Days on Market (Avg) - API NEEDED
**Options:**
1. **MLS stats** (if Bridge provides neighborhood stats)
2. **Zillow API**
3. **Redfin API**

#### Field 97: Insurance Estimate - API NEEDED
**Options:**
1. **Insurance API** (research needed)
2. **Calculator based on:** Replacement cost, location, age, flood zone
3. **Rule-based estimation** (Florida typical: $1,500-$3,000 for condos)

#### Field 98: Rental Estimate - API NEEDED
**Best Option:**
1. **Zillow Rent Zestimate API** (may require partnership)
2. **Rentometer API** (paid)
3. **Rule-based:** Calculate from comps and cap rate assumptions

---

## PRIORITY 2: Parking Details (Section Q) - 1/5 fields = 20%

### Current State
**Populated (1):**
- Field 139: Carport Y/N - No (Score: 50) ✅

**NULL/Missing (4):**
| Field | Name | Bridge MLS Field | Fix |
|-------|------|-----------------|-----|
| **140** | Carport Spaces | `property.CarportSpaces` | Check if Bridge sends this ✅ |
| **141** | Garage Attached Y/N | `property.AttachedGarageYN` | Already mapped to field 44 logic ✅ |
| **142** | Parking Features | `property.ParkingFeatures` | Check if Bridge sends array ✅ |
| **143** | Assigned Parking Spaces | `property.AssignedSpaces` | Check if Bridge sends this ✅ |

### Solution
**All 4 fields should come from Bridge MLS - likely already in extended data!**

Check `src/lib/bridge-field-mapper.ts` lines for GROUP 23 (Parking fields 139-143).

**Effort:** 10-30 minutes (just verify mapping)

---

## PRIORITY 3: Legal & Compliance (Section S) - 1/4 fields = 25%

### Current State
**Populated (1):**
- Field 154: Front Exposure - West (Score: 50) ✅

**NULL/Missing (3):**
| Field | Name | Bridge MLS Field | County Source | Fix |
|-------|------|-----------------|---------------|-----|
| **151** | Homestead Exemption | `property.HomesteadYN` or `property.TaxExemptions` | Pinellas Property Appraiser | Check Bridge, fallback to county scraper |
| **152** | CDD Y/N | `property.CDDYN` or parse from fees | Tax bill / HOA docs | Check Bridge first |
| **153** | Annual CDD Fee | `property.CDDAnnualFee` | Tax bill | Check Bridge first |

### Solution
**Step 1:** Check if Bridge MLS sends these fields (likely does for 152-153)

**Step 2:** For Field 151, may need Pinellas Property Appraiser scraper

**Effort:** 1-2 hours (if scraper needed)

---

## PRIORITY 4: School Ratings (Section I) - 5/8 fields = 63%

### Current State
**Populated (5):**
- Field 63: School District - Pinellas County Schools ✅
- Field 64: Elevation - 7 feet ✅
- Field 67: Elementary Distance - 2.2 mi ✅
- Field 70: Middle Distance - 4.1 mi ✅
- Field 73: High Distance - 4.1 mi ✅

**NULL/Missing (3):**
| Field | Name | API Source | Fix |
|-------|------|-----------|-----|
| **66** | Elementary Rating | SchoolDigger / GreatSchools API | API integration needed |
| **69** | Middle Rating | SchoolDigger / GreatSchools API | API integration needed |
| **72** | High Rating | SchoolDigger / GreatSchools API | API integration needed |

### Solution
**SchoolDigger API** (recommended by Perplexity):
- Free tier available
- Provides school ratings (1-10 scale)
- National coverage
- Easy integration

**Effort:** 1-2 hours

---

## PRIORITY 5: Recent Renovations (Field 59) - Single field, high value

### Current State
- **Field 59:** Recent Renovations → null

### Solution Options
**Option 1:** Bridge MLS `property.YearBuiltDetails` or `property.Renovations`

**Option 2:** Extract from `property.PublicRemarks` with better regex
```typescript
// Match patterns like "kitchen remodeled in 2022", "updated 2021", etc.
const renovationPattern = /(kitchen|bath|flooring|roof|updated|remodeled|renovated).*?(\d{4})/gi;
```

**Option 3:** Use permit data from BuildFax/Accela (ties to Fields 60-62)

**Effort:** 30 minutes (improve extraction)

---

## PRIORITY 6: Additional Features (Section P) - 3/8 fields = 38%

### NULL Fields
| Field | Name | Source | Fix |
|-------|------|--------|-----|
| **133** | EV Charging | Bridge MLS `property.GreenEnergyGeneration` | Check if mapped ✅ |
| **134** | Smart Home Features | Evidence-based extraction only (Perplexity rule) | Extract from PublicRemarks keywords |
| **135** | Accessibility Modifications | Evidence-based extraction only | Extract from PublicRemarks keywords |
| **137** | Age Restrictions | Bridge MLS `property.AgeRestrictions` or HOA name | Check if "55+" in name ✅ |
| **138** | Special Assessments | Already mapped (Priority 3) ✅ | DONE |

**Effort:** 1 hour (extraction improvements)

---

## PRIORITY 7: Crime Data (Section L) - 2/3 fields = 67%

### NULL Field
| Field | Name | Current | Fix |
|-------|------|---------|-----|
| **89** | Property Crime Index | null | Same API as field 88 (violent crime) |

**Current:** Field 88 shows "Violent Crime Index: 325" ✅

**Fix:** The crime API should return BOTH violent and property crime in same call. Check why property crime is null.

**Effort:** 15 minutes (debug existing API call)

---

## Implementation Priority Order (Tonight)

### Quick Wins (30 mins - 2 hours total)

**1. Enable Backend Calculations (30 mins)**
- Fields 93, 94, 99, 101 - Just call existing functions
- **Impact:** 4 fields fixed instantly

**2. Fix Property Crime Index (15 mins)**
- Field 89 - Already have the API, just extract both values
- **Impact:** 1 field fixed

**3. Verify Bridge MLS Parking Fields (30 mins)**
- Fields 140-143 - Check if already in extended data
- **Impact:** Up to 4 fields fixed

**4. Improve Renovation Extraction (30 mins)**
- Field 59 - Better regex on PublicRemarks
- **Impact:** 1 field fixed (partial)

**Total Quick Wins: 10 fields in 2 hours**

---

### Medium Effort (2-4 hours each)

**5. School Ratings API (2 hours)**
- Fields 66, 69, 72 - SchoolDigger integration
- **Impact:** 3 fields fixed

**6. Legal/Homestead Fields (2 hours)**
- Fields 151-153 - Check Bridge, scrape if needed
- **Impact:** 3 fields fixed

---

### Longer Term (Requires API keys/research)

**7. Market Data APIs (4-8 hours)**
- Fields 91, 92, 95, 97, 98 - Zillow/Redfin/Insurance APIs
- **Impact:** 5 fields fixed

---

## Summary: Fields by Fix Type

| Fix Type | Field Count | Fields | Effort |
|----------|-------------|--------|--------|
| **Backend Calculations** | 4 | 93, 94, 99, 101 | 30 mins |
| **Debug Existing API** | 1 | 89 | 15 mins |
| **Bridge MLS Verification** | 4-7 | 140-143, 151-153 | 30-60 mins |
| **Text Extraction** | 2 | 59, 134-135 | 1 hour |
| **New API - SchoolDigger** | 3 | 66, 69, 72 | 2 hours |
| **New API - Market Data** | 5 | 91, 92, 95, 97, 98 | 4-8 hours |
| **Permit Data** | 3 | 60-62 | IN PROGRESS |

---

## Recommended Tonight's Plan

**Phase 1: Quick Backend Fixes (1 hour)**
1. ✅ Enable derived field calculations (Fields 93, 94, 99, 101)
2. ✅ Fix crime API to return property crime (Field 89)
3. ✅ Verify Bridge MLS parking fields (140-143)

**Phase 2: API Integration (2-3 hours)**
4. SchoolDigger API for ratings (Fields 66, 69, 72)
5. Check Bridge MLS legal fields (151-153)

**Phase 3: Defer to Later**
- Market data APIs (need research/keys)
- Permit scraper (waiting on BuildFax decision)

---

**Which priority do you want to tackle first?**

1. Backend calculations (30 mins, 4 fields) ⚡ EASIEST
2. Bridge MLS parking verification (30 mins, up to 4 fields) ⚡ EASY
3. School ratings API (2 hours, 3 fields) 🔨 MEDIUM
4. Something else?
