# Field Issues Analysis & Resolution Plan
**Date:** December 6, 2025
**Issue Reporter:** User (Real Estate Broker)
**Analyst:** Claude Code (Sonnet 4.5)

---

## COMPREHENSIVE FIELD AUDIT TABLE

| # | Field Name | Field # | Current Path in Compare.tsx | Issue Description | Root Cause | Current Data Source | Recommended Solution | Priority |
|---|------------|---------|----------------------------|-------------------|------------|---------------------|---------------------|----------|
| 1 | **Property Age** | Calculated | `calculated.propertyAge` | Marked as "Missing Data" - not calculating | Missing calculation function | None (flagged as calculated) | **IMPLEMENT:** `2025 - yearBuilt` calculation in Compare.tsx | **HIGH** |
| 2 | **Recent Renovations** | 59 | `structural.recentRenovations.value` | ✅ Path appears correct | Need to verify data source populating correctly | LLMs (Perplexity, Grok), Stellar MLS | **VERIFY:** Check if Stellar MLS PDF extraction working for field 59 | MEDIUM |
| 3 | **Permit History - Roof** | 60 | `structural.permitHistoryRoof.value` | Limited/no data | Not available in most APIs | LLMs only (web search) | **NEW SOURCE NEEDED:** Local government permit databases via API (BuildingConnected, PermitPlace) | **HIGH** |
| 4 | **Permit History - HVAC** | 61 | `structural.permitHistoryHvac.value` | Limited/no data | Not available in most APIs | LLMs only (web search) | **NEW SOURCE NEEDED:** Local government permit databases via API | **HIGH** |
| 5 | **Smart Home Features** | 134 | `utilities.smartHomeFeatures.value` | ✅ Path appears correct | Need to verify data | LLMs, Stellar MLS | **VERIFY:** Check Stellar MLS extraction + LLM prompts | MEDIUM |
| 6 | **Landscaping** | 58 | `structural.landscaping.value` | 🔴 **SHOWING WRONG DATA** - flood zone info appearing | **DATA CONTAMINATION** - LLMs or normalization mixing fields | LLMs (Perplexity, Grok) | **URGENT FIX:** Check field normalizer mapping + LLM prompts for field 58 vs 119/132 | **CRITICAL** |
| 7 | **Lot Features** | 132 | `utilities.lotFeatures.value` | Possibly duplicating landscaping data | May be confused with field 58 | LLMs, Stellar MLS | **FIX:** Verify field normalizer separates 58 (landscaping) from 132 (lot features like "corner lot", "cul-de-sac") | HIGH |
| 8 | **Flood Zone** | 119 | `utilities.floodZone.value` | Data leaking into landscaping field | Field confusion in normalization | FEMA NFHL API | **FIX:** Verify field normalizer keeps 119 separate from 58 | **CRITICAL** |
| 9 | **EV Charging** | 133 | `utilities.evChargingYn.value` | Need verification | Unknown if working | LLMs, Stellar MLS | **VERIFY:** Test with known EV charging properties | MEDIUM |
| 10 | **Waterfront Feet** | 156 | `stellarMLS.waterfront.waterfrontFeet.value` | 🔴 **SHOWING "No" WHEN STELLAR MLS SAYS YES** | Not extracting from Stellar MLS correctly | Stellar MLS PDF | **URGENT FIX:** Check Stellar MLS PDF parser for WaterFrontage field extraction | **CRITICAL** |
| 11 | **Water Access** | 157 | `stellarMLS.waterfront.waterAccessYn.value` | 🔴 **SHOWING "No" WHEN STELLAR MLS SAYS YES** | Not extracting from Stellar MLS correctly | Stellar MLS PDF | **URGENT FIX:** Check Stellar MLS PDF parser for WaterAccess field extraction | **CRITICAL** |
| 12 | **Noise Level (dB Est)** | 129 | `utilities.noiseLevelDbEst.value` | 🔴 **ALL PROPERTIES SHOW SAME VALUE (0 or static)** | Static/default value or API not working | HowLoud API | **FIX:** Check if HowLoud API returning actual data or if field normalization using wrong source | **HIGH** |
| 13 | **School Names** | 65, 68, 71 | `location.assignedElementary.value`, etc. | 🔴 **SHOWING NUMBERS INSTEAD OF NAMES** | Normalization swapping name/rating fields | SchoolDigger API | **URGENT FIX:** Field normalizer mapping field 65→name, 66→rating (currently reversed) | **CRITICAL** |
| 14 | **School Ratings** | 66, 69, 72 | `location.elementaryRating.value`, etc. | May be showing names instead of ratings | Normalization swapping name/rating fields | SchoolDigger API | **URGENT FIX:** Same as above - verify field 66 maps to rating, not name | **CRITICAL** |
| 15 | **Property Crime Index** | 89 | `location.crimeIndexProperty.value` | Unknown if data available | FBI Crime API may not provide this breakdown | FBI Crime API | **CHECK:** Does FBI API return violent vs property crime separately? If not, **NEW SOURCE NEEDED** (SpotCrime, CrimeReports.com) | HIGH |
| 16 | **Inventory Surplus** | 96 | `financial.inventorySurplus.value` | No data source | Not calculated | None - needs calculation | **NEW CALCULATION NEEDED:** Query MLS for active listings count vs historical avg in area | HIGH |
| 17 | **Permit History - Other** | 62 | `structural.permitHistoryPoolAdditions.value` | Limited/no data | Not available in most APIs | LLMs only (web search) | **NEW SOURCE NEEDED:** Local government permit databases | HIGH |

---

## CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION

### 🔴 ISSUE 1: Field Contamination - Landscaping Showing Flood Data
**Severity:** CRITICAL
**Fields Affected:** 58 (landscaping), 119 (flood_zone), 132 (lot_features)

**Problem:**
- Landscaping field (58) showing flood zone information
- Suggests field normalizer is mapping LLM responses incorrectly

**Investigation Required:**
1. Check `src/lib/field-normalizer.ts` for Perplexity/Grok mappings
2. Verify LLM prompts in `api/property/search.ts` clearly distinguish between:
   - Field 58: "Describe landscaping quality (professional, basic, minimal, native plants, etc.)"
   - Field 119: "FEMA flood zone designation (X, A, AE, VE, etc.)"
   - Field 132: "Lot features (corner lot, cul-de-sac, wooded, flat, sloped, etc.)"

**Likely Root Cause:**
- LLMs returning combined responses like "Property has professional landscaping, located in flood zone X"
- Field normalizer mapping entire response to field 58 instead of splitting

**Fix Required:**
- Update field normalizer to use stricter keyword matching
- Add validation to reject flood-related terms from landscaping field
- May need separate LLM calls for environmental vs exterior features

---

### 🔴 ISSUE 2: School Names Showing as Numbers
**Severity:** CRITICAL
**Fields Affected:** 65/66 (elementary), 68/69 (middle), 71/72 (high)

**Problem:**
- School NAME fields showing rating numbers (e.g., "9" instead of "Plant High School")
- School RATING fields may show names

**Root Cause:**
- Field normalizer swapping SchoolDigger API response mapping
- Field 65 should map to school name, field 66 to rating
- Currently reversed

**Fix Required:**
```typescript
// CURRENT (WRONG):
'65_elementary_school': response.rating,  // ❌
'66_elementary_rating': response.name,    // ❌

// CORRECT:
'65_elementary_school': response.name,    // ✅
'66_elementary_rating': response.rating,  // ✅
```

**Files to Check:**
- `src/lib/field-normalizer.ts` (Perplexity translation)
- `api/property/free-apis.ts` (SchoolDigger API integration)

---

### 🔴 ISSUE 3: Waterfront Fields Not Extracting from Stellar MLS
**Severity:** CRITICAL
**Fields Affected:** 156 (waterfront_feet), 157 (water_access_yn)

**Problem:**
- User verifies properties ARE waterfront in Stellar MLS
- App shows "No" for waterfront access
- Stellar MLS PDF should be Tier 1 source (highest priority)

**Investigation Required:**
1. Check `api/property/parse-mls-pdf.ts` for waterfront field extraction
2. Verify PDF parser looking for correct field names in Stellar MLS PDF:
   - "WaterFrontage" or "Water Frontage"
   - "WaterAccess" or "Water Access"
   - "Waterfront Feet" or "Water Frontage Linear Feet"

**Likely Issues:**
- PDF field names don't match what parser expects
- Parser not checking Stellar MLS "Waterfront" section
- Case sensitivity in field matching

**Fix Required:**
- Add debug logging to PDF parser showing exact field names found
- Update parser to check multiple name variations
- Ensure waterfront section of PDF being read

---

### 🔴 ISSUE 4: Noise Level Static/Zero Values
**Severity:** HIGH
**Fields Affected:** 129 (noise_level_db_est)

**Problem:**
- All properties showing same noise level (0 or same static value)
- Suggests HowLoud API not returning data or field not mapped

**Investigation Required:**
1. Check `api/property/free-apis.ts` - HowLoud API integration
2. Verify API key working
3. Check if HowLoud API response being parsed correctly
4. Confirm field 129 mapped to HowLoud response

**Possible Causes:**
- HowLoud API not responding (check error logs)
- API returning data but wrong field being mapped
- Default value of 0 being set when API fails

**Fix Required:**
- Test HowLoud API call directly with sample addresses
- Add error logging to see if API failing
- Verify field normalizer maps HowLoud response to field 129

---

## FIELDS NEEDING NEW DATA SOURCES

### 1. Permit History (Fields 60, 61, 62)
**Current Source:** LLMs only (unreliable)
**Recommended New Source:**
- **BuildingConnected API** (https://buildingconnected.com)
- **PermitPlace** (https://permitplace.com)
- **Local government permit portals** (varies by county)

**Implementation:**
- Research if Hillsborough/Pinellas counties have permit APIs
- Alternative: Web scraping county permit search pages
- Fallback: Keep LLM-based extraction as Tier 5

**Data Needed:**
- Permit type (roof, HVAC, pool, addition, etc.)
- Permit date
- Permit status (approved, completed, pending)
- Contractor information (optional)

---

### 2. Property Crime Index (Field 89)
**Current Source:** FBI Crime API (may not separate violent vs property)
**Recommended New Source:**
- **SpotCrime API** (https://spotcrime.com/api)
- **CrimeReports.com API**
- **Zillow Crime Data** (if available)

**Implementation:**
- Test if FBI API returns `violent_crime` and `property_crime` separately
- If not, integrate SpotCrime or CrimeReports
- Map to 0-100 index scale

---

### 3. Inventory Surplus (Field 96)
**Current Source:** None (needs calculation)
**Recommended Calculation:**
```
Inventory Surplus = (Current Active Listings in Area / 12-Month Average Active Listings) - 1

Examples:
- 150 current listings / 100 avg = 50% surplus (buyer's market)
- 75 current listings / 100 avg = -25% surplus (seller's market)
```

**Data Source:**
- Stellar MLS API (query active listings by zip/neighborhood)
- Calculate 12-month rolling average
- Update weekly or monthly

**Implementation:**
- Add calculation in `api/property/search.ts`
- Cache neighborhood averages to reduce API calls
- Return as percentage (-50% to +100%)

---

## VERIFICATION CHECKLIST

### Fields to Verify Working Correctly:
- [ ] Property Age - Implement calculation
- [ ] Recent Renovations - Check data sources
- [ ] Smart Home Features - Verify extraction
- [ ] EV Charging - Test with known properties
- [ ] Lot Features - Ensure distinct from landscaping

### Critical Bugs to Fix:
- [ ] **Landscaping contamination** - Fix field normalizer
- [ ] **School names/ratings swapped** - Fix API mapping
- [ ] **Waterfront fields not extracting** - Fix PDF parser
- [ ] **Noise level static values** - Fix HowLoud integration
- [ ] **Property crime data** - Verify FBI API or add new source

### New Sources to Research:
- [ ] Permit history APIs (BuildingConnected, local gov)
- [ ] Property crime APIs (SpotCrime)
- [ ] Inventory surplus calculation (MLS query)

---

## RECOMMENDED ACTION PLAN (Priority Order)

### PHASE 1: Critical Data Quality Fixes (Do First)
1. **Fix school name/rating swap** (30 min) - Fields 65-72
2. **Fix waterfront extraction from Stellar MLS PDF** (1 hour) - Fields 156-157
3. **Fix landscaping field contamination** (1 hour) - Field 58
4. **Fix noise level static values** (30 min) - Field 129

### PHASE 2: Implement Missing Calculations (Quick Wins)
1. **Property Age calculation** (15 min) - `2025 - yearBuilt`
2. **Inventory Surplus calculation** (2 hours) - MLS query + calculation

### PHASE 3: New Data Source Integration (Longer Term)
1. **Research permit history APIs** (2 hours research + 4 hours integration)
2. **Property crime data source** (1 hour research + 2 hours integration)
3. **Permit history implementation** (4-6 hours)

---

## FILES TO INVESTIGATE/MODIFY

### For Field Contamination Issues:
- `src/lib/field-normalizer.ts` - Perplexity/Grok translation
- `api/property/search.ts` - LLM prompts and field extraction
- `src/lib/field-map-flat-to-numbered.ts` - Backend translation

### For Stellar MLS Waterfront Issue:
- `api/property/parse-mls-pdf.ts` - PDF parser
- Test with actual waterfront property PDFs

### For School Name/Rating Swap:
- `api/property/free-apis.ts` - SchoolDigger integration
- `src/lib/field-normalizer.ts` - Field mapping

### For Noise Level Issue:
- `api/property/free-apis.ts` - HowLoud API integration
- `src/lib/field-normalizer.ts` - Field 129 mapping

---

## TESTING RECOMMENDATIONS

### Test Properties Needed:
1. **Waterfront property** - To test fields 156-157 extraction
2. **Properties with permits** - To verify permit history (60-62)
3. **Properties with known noise levels** - To test field 129
4. **Properties in different school zones** - To verify name/rating fix

### Verification Steps:
1. Add property via Stellar MLS PDF upload
2. Check PropertyDetail page for each problem field
3. Compare to actual Stellar MLS data
4. Verify values make sense and aren't contaminated

---

## SIGN-OFF

**Analysis Completed By:** Claude Code (Sonnet 4.5)
**Date:** December 6, 2025
**Status:** Ready for implementation - prioritized by severity

**Next Steps:**
1. User approval of action plan
2. Begin Phase 1 critical fixes
3. Test with real properties
4. Commit fixes to GitHub
5. Deploy to Vercel
6. Verify in production
