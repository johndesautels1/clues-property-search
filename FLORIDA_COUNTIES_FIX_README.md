# FLORIDA COUNTIES FIX & EXPANSION TRACKER

**Created:** 2026-01-13
**Purpose:** Track all fixes and expansions needed for florida-counties.ts and related files
**CRITICAL:** Read this file upon conversation compression to continue work

---

## COMPLETED FIXES

### Fix 1: Field Mapping Errors (12 fields) - DONE
**Date:** 2026-01-13
**Commit:** 31359ec
**Status:** COMPLETED

All field numbers were wrong in florida-counties.ts. Fixed to match fields-schema.ts:

| Old (Wrong) | New (Correct) | Field Name |
|-------------|---------------|------------|
| 6_parcel_id | 9_parcel_id | Parcel ID |
| 9_market_value_estimate | 12_market_value_estimate | Market Value |
| 12_bedrooms | 17_bedrooms | Bedrooms |
| 15_total_bathrooms | 20_total_bathrooms | Bathrooms |
| 16_living_sqft | 21_living_sqft | Living Sq Ft |
| 20_year_built | 25_year_built | Year Built |
| 31_assessed_value | 15_assessed_value | Assessed Value |
| 32_tax_exemptions | 38_tax_exemptions | Tax Exemptions |
| 33_property_tax_rate | 37_property_tax_rate | Tax Rate |
| 36_roof_type | 39_roof_type | Roof Type |
| 38_exterior_material | 41_exterior_material | Exterior Material |
| 47_pool_yn | 54_pool_yn | Pool Y/N |

### Fix 2: Remove Orphan Field - DONE
**Date:** 2026-01-13
**Status:** COMPLETED

Removed `34_recent_tax_history` extraction - no schema field exists for this.

---

## EXPANSION TASKS (PENDING)

### Task 1: Add Annual Taxes (Field 35) as FALLBACK
**Status:** DONE
**Date Completed:** 2026-01-13
**Priority:** HIGH
**Field:** 35_annual_taxes

**Requirements:**
- ONLY populate if Bridge/Stellar MLS doesn't provide annual taxes
- Extract from Tax Collector websites
- Validate: Must be reasonable ($500 - $50,000 range for Florida)

**Implementation Details:**
- Added annual taxes extraction to scrapeTaxCollector() function
- Patterns detect: Total Tax, Annual Tax, Tax Amount, Tax Due, Tax Bill, Ad Valorem Tax
- Validates range: $500 - $50,000 (Florida typical)
- Smart monthly detection: If amount < $500, assumes monthly and converts to annual
- Tavily buttons already wired (TAVILY_ENABLED_FIELDS, FIELD_KEY_TO_ID_MAP, searchTaxData)

**Files updated:**
- [x] florida-counties.ts - Added extraction in scrapeTaxCollector() (lines 810-837)

---

### Task 2: Add Last Sale Date/Price (Fields 13, 14) as FALLBACK
**Status:** PENDING
**Priority:** MEDIUM
**Fields:** 13_last_sale_date, 14_last_sale_price

**Requirements:**
- ONLY populate if Bridge/Stellar MLS doesn't provide
- Extract from Property Appraiser websites
- Date format: YYYY-MM-DD
- Price validation: $10,000 - $50,000,000 range

**Files to update:**
- [ ] florida-counties.ts - Add extraction in each county scraper
- [ ] Verify fields-schema.ts has these fields
- [ ] Verify field-normalizer.ts mapping
- [ ] Verify PropertyDetail.tsx displays correctly

---

### Task 3: Add Foundation Type (Field 42) - NEW SOURCE
**Status:** DONE
**Date Completed:** 2026-01-13
**Priority:** HIGH
**Field:** 42_foundation

**Requirements:**
- MLS often misses this - florida-counties should be primary fallback
- Values: "Slab", "Crawl Space", "Basement", "Pier/Beam"
- Extract from Property Appraiser building characteristics

**Implementation Details:**
- Added foundation extraction patterns to ALL 6 county scrapers
- Patterns detect: Slab, Crawl Space, Basement, Pier/Beam, Monolithic, Poured, Block, Pile
- Normalizes values to schema options: 'Slab', 'Crawl Space', 'Basement', 'Pier/Beam'

**Files updated:**
- [x] florida-counties.ts - Added extraction in extractFromPinellasHtml, extractFromHillsboroughHtml,
      extractFromManateeHtml, extractFromPolkHtml, extractFromPascoHtml, extractFromHernandoHtml
- [x] PropertyDetail.tsx - Added 42 to TAVILY_ENABLED_FIELDS (line 64)
- [x] PropertyDetail.tsx - Added '42_foundation': 42 to FIELD_KEY_TO_ID_MAP (line 92)
- [x] tavily-search.ts - Added foundation search in searchPropertyFeatures() (lines 1007-1011, 1155-1189)

---

### Task 4: Add Legal Description (Field 150) as FALLBACK
**Status:** DONE
**Date Completed:** 2026-01-13
**Priority:** MEDIUM
**Field:** 150_legal_description

**Requirements:**
- ONLY populate if Bridge/Stellar/LLMs don't provide
- Extract from Property Appraiser legal section
- Can be long text - truncate if > 500 chars

**Implementation Details:**
- Added legal description extraction to ALL 6 county scrapers
- Patterns detect: LOT, BLK, BLOCK, SEC, UNIT, PH, PHASE, SUB, SUBDIVISION, PLAT, PB, PG
- Auto-truncates descriptions > 500 chars
- Only saves if description > 10 chars (to avoid garbage matches)

**Files updated:**
- [x] florida-counties.ts - Added extraction in all 6 county extractors
- [x] PropertyDetail.tsx - Added 150 to TAVILY_ENABLED_FIELDS (line 80)
- [x] PropertyDetail.tsx - Added '150_legal_description': 150 to FIELD_KEY_TO_ID_MAP (line 150)
- [x] tavily-search.ts - Added legal description search in searchHomesteadAndCDD() (lines 1816-1845)

---

### Task 5: Add CDD Fields (152, 153) - CRITICAL
**Status:** DONE
**Date Completed:** 2026-01-13
**Priority:** CRITICAL
**Fields:** 152_cdd_yn, 153_annual_cdd_fee

**Requirements:**
- Bridge rarely provides CDD info - this is essential!
- MUST determine if fee is monthly or annual and CONVERT to annual
- Common CDD patterns:
  - "CDD: $1,200/year" → 153_annual_cdd_fee = 1200
  - "CDD: $100/month" → 153_annual_cdd_fee = 1200 (100 * 12)
  - "CDD included in taxes" → Note this, don't double-count
- Validation: Annual CDD typically $200 - $5,000 in Florida

**CRITICAL CONVERSION LOGIC:**
```javascript
// If monthly detected (< $500 and contains "month" or "mo")
if (fee < 500 && /month|mo\b|\/mo/i.test(context)) {
  annualFee = fee * 12;
} else {
  annualFee = fee; // Already annual
}
```

**Files updated:**
- [x] florida-counties.ts - Added CDD extraction with monthly/annual detection (lines 578-679)
- [x] scrapeTaxCollector() - CDD patterns added in non-ad valorem section
- [x] tavily-search.ts - Fixed searchHomesteadAndCDD() with monthly/annual conversion (lines 1694-1738)
- [x] PropertyDetail.tsx - CDD displays correctly (lines 2509-2510)
- [x] TAVILY_ENABLED_FIELDS - 152, 153 already in array (line 76)
- [x] FIELD_KEY_TO_ID_MAP - 152_cdd_yn, 153_annual_cdd_fee already mapped (lines 141-142)

---

## FILES THAT MUST BE SYNCHRONIZED

When adding any new field extraction, ALL these files must be checked:

### Core Files (MUST UPDATE)
1. **fields-schema.ts** - Source of Truth (DO NOT CHANGE field numbers)
2. **florida-counties.ts** - Extraction logic
3. **field-normalizer.ts** - Field mapping and normalization
4. **search.ts** - Arbitration and LLM prompts
5. **retry-llm.ts** - LLM retry prompts

### UI Files (VERIFY DISPLAY)
6. **PropertyDetail.tsx** - UI display and Tavily button
7. **FIELD_KEY_TO_ID_MAP** in PropertyDetail.tsx
8. **TAVILY_ENABLED_FIELDS** in PropertyDetail.tsx

### Additional Files (CHECK CONSISTENCY)
9. **tavily-search.ts** - Tavily search functions
10. **bridge-field-mapper.ts** - Bridge MLS mapping
11. **stellar-mls.ts** - Stellar MLS mapping
12. **llm-constants.ts** - LLM field constants
13. **perplexity-prompts.ts** - Perplexity field mapping
14. **tavily-field-database-mapping.ts** - Tavily field database

---

## FETCH WITH TAVILY BUTTON WIRING - CRITICAL

**Every new field MUST have the "Fetch with Tavily" button wired in PropertyDetail.tsx!**

### Required Steps for Each New Field:

#### Step 1: Add to TAVILY_ENABLED_FIELDS array (PropertyDetail.tsx ~line 65-79)
```typescript
const TAVILY_ENABLED_FIELDS = new Set([
  // ... existing fields ...
  42,   // foundation - ADD THIS
  150,  // legal_description - ADD THIS
  152,  // cdd_yn - ADD THIS
  153,  // annual_cdd_fee - ADD THIS
]);
```

#### Step 2: Add to FIELD_KEY_TO_ID_MAP (PropertyDetail.tsx ~line 83-160)
```typescript
const FIELD_KEY_TO_ID_MAP: Record<string, number | string> = {
  // ... existing mappings ...
  '42_foundation': 42,
  '150_legal_description': 150,
  '152_cdd_yn': 152,
  '153_annual_cdd_fee': 153,
};
```

#### Step 3: Verify tavily-search.ts has search function for the field
- Field 42 (foundation): May need new searchPropertyFeatures() pattern
- Field 150 (legal_description): searchHomesteadAndCDD() or new function
- Field 152/153 (CDD): searchHomesteadAndCDD() already exists

#### Step 4: Verify tavily-field-database-mapping.ts has entry
Each field needs an entry in the Tavily field database with:
- fieldKey
- searchQuery template
- extractionPatterns

### Tavily Button Wiring Checklist:

| Field # | Field Key | TAVILY_ENABLED_FIELDS | FIELD_KEY_TO_ID_MAP | tavily-search.ts | Status |
|---------|-----------|----------------------|---------------------|------------------|--------|
| 35 | annual_taxes | [x] Already there | [x] Already there | [x] searchTaxData | DONE |
| 42 | foundation | [x] Added | [x] Added | [x] searchPropertyFeatures | DONE |
| 150 | legal_description | [x] Added | [x] Added | [x] searchHomesteadAndCDD | DONE |
| 152 | cdd_yn | [x] Already there | [x] Already there | [x] searchHomesteadAndCDD | DONE |
| 153 | annual_cdd_fee | [x] Already there | [x] Already there | [x] searchHomesteadAndCDD + monthly/annual conversion | DONE |

---

## VERIFICATION CHECKLIST

Before marking any task DONE:

- [ ] Code change made in florida-counties.ts
- [ ] Field number matches fields-schema.ts exactly
- [ ] search.ts has field in arbitration pipeline
- [ ] field-normalizer.ts has correct mapping
- [ ] PropertyDetail.tsx displays the field
- [ ] Build passes: `npm run build`
- [ ] Committed to GitHub with descriptive message
- [ ] This README updated with DONE status

---

## CURRENT FLORIDA COUNTIES EXTRACTION (AFTER FIXES)

| Field # | Field Key | Extraction Source | Status |
|---------|-----------|-------------------|--------|
| 9 | parcel_id | All PA scrapers | WORKING |
| 12 | market_value_estimate | Pinellas, Hillsborough, Polk | WORKING |
| 15 | assessed_value | All PA scrapers | WORKING |
| 17 | bedrooms | Pinellas, Hillsborough, Polk | WORKING |
| 20 | total_bathrooms | Pinellas, Hillsborough, Polk | WORKING |
| 21 | living_sqft | All PA scrapers | WORKING |
| 25 | year_built | All PA scrapers | WORKING |
| 35 | annual_taxes | Tax Collector | NEW 2026-01-13 |
| 37 | property_tax_rate | Tax Collector | WORKING |
| 38 | tax_exemptions | Tax Collector | WORKING |
| 39 | roof_type | Pinellas only | WORKING |
| 40 | roof_age_est | Permits | WORKING |
| 41 | exterior_material | Pinellas only | WORKING |
| 42 | foundation | All PA scrapers | NEW 2026-01-13 |
| 46 | hvac_age | Permits | WORKING |
| 54 | pool_yn | Pinellas only | WORKING |
| 59 | recent_renovations | Permits | WORKING |
| 60 | permit_history_roof | Permits | WORKING |
| 61 | permit_history_hvac | Permits | WORKING |
| 62 | permit_history_other | Permits | WORKING |
| 138 | special_assessments | Tax Collector | WORKING |
| 150 | legal_description | All PA scrapers | NEW 2026-01-13 |
| 151 | homestead_yn | Tax Collector | WORKING |
| 152 | cdd_yn | Tax Collector | NEW 2026-01-13 |
| 153 | annual_cdd_fee | Tax Collector | NEW 2026-01-13 |

**Total: 25 fields currently extracted**

---

## COUNTIES SUPPORTED

| County | Property Appraiser | Tax Collector | Permits |
|--------|-------------------|---------------|---------|
| Pinellas | pcpao.org | tax.pinellas.gov | Accela |
| Hillsborough | hcpafl.org | hillsborough.county-taxes.com | Accela |
| Manatee | manateepao.com | taxcollector.com | Accela |
| Polk | polkpa.org | polktaxes.com | Accela |
| Pasco | pascopa.com | pascotaxes.com | Accela |
| Hernando | hernandopa.us | hernandotax.us | Accela |

---

## NOTES FOR FUTURE SESSIONS

1. **Upon compression:** Read this file first!
2. **Before any field work:** Check fields-schema.ts for correct field number
3. **After any change:** Run `npm run build` to verify
4. **Commit often:** Don't batch too many changes
5. **Update this README:** Mark tasks DONE only after verification
