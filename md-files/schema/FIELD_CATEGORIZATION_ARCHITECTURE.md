# Field Categorization Architecture
## Based on Perplexity's "Truth Control" Pattern

---

## CATEGORY 1: BACKEND-ONLY (LLM Forbidden) - 78 Fields

**Rule:** LLM MUST return "null" for these. Backend is sole writer.

### Group A: Direct API Sources (19 fields)
| Field | Name | Backend Source | Status |
|-------|------|----------------|--------|
| 7 | County | Google Geocode API | ✅ Working |
| 64 | Elevation | USGS Elevation API | ✅ Working |
| 66 | Elementary Rating | SchoolDigger API | ⚠️ Inconsistent - needs fallback to GreatSchools |
| 69 | Middle Rating | SchoolDigger API | ⚠️ Inconsistent - needs fallback to GreatSchools |
| 72 | High Rating | SchoolDigger API | ⚠️ Inconsistent - needs fallback to GreatSchools |
| 74 | Walk Score | WalkScore API | ✅ Working |
| 75 | Transit Score | WalkScore API | ⚠️ Inconsistent - return NULL if not in API response |
| 76 | Bike Score | WalkScore API | ⚠️ Inconsistent - return NULL if not in API response |
| 78 | Noise Level | HowLoud API | ✅ Working |
| 79 | Traffic Level | HowLoud API | ✅ Working |
| 117 | Air Quality Index | AirNow API | ✅ Working |
| 119 | Flood Zone | FEMA NFHL API | ✅ Working |
| 120 | Flood Risk Level | FEMA NFHL API | ✅ Working |
| 123 | Earthquake Risk | USGS Earthquake API | ✅ Working |
| 126 | Radon Risk | EPA Radon API | ✅ Working |
| 127 | Superfund Site Nearby | EPA FRS API | ✅ Working |
| 129 | Noise Level (dB) | HowLoud API | ✅ Working |
| 88 | Violent Crime Index | FBI Crime API | ✅ Working |
| 90 | Neighborhood Safety Rating | FBI Crime API (derived) | ✅ Working |

### Group B: Calculated Fields (Backend Math) - 16 fields
| Field | Name | Formula | Inputs Required |
|-------|------|---------|------------------|
| 11 | Price Per Sq Ft | `listing_price / living_sqft` | Fields 10, 21 |
| 20 | Total Bathrooms | `full_bathrooms + (half_bathrooms * 0.5)` | Fields 18, 19 |
| 29 | Parking Total | `garage_spaces + carport_spaces + assigned_parking` | Fields 28, 140, 143 |
| 37 | Property Tax Rate | `(annual_taxes / assessed_value) * 100` | Fields 35, 15 |
| 93 | Price to Rent Ratio | `listing_price / (rental_estimate * 12)` | Fields 10, 98 |
| 99 | Rental Yield (Est) | `(rental_estimate * 12) / listing_price * 100` | Fields 98, 10 |
| 101 | Cap Rate (Est) | `((rental_estimate * 12 - expenses) / listing_price) * 100` | Fields 98, 10, 35, 97, 31 |
| 40 | Roof Age (Est) | `current_year - roof_install_year` | From permits (Field 60) or NULL |
| 46 | HVAC Age | `current_year - hvac_install_year` | From permits (Field 61) or NULL |
| 53 | Fireplace Count | Count from MLS features array | Field 52 must = "Yes", then count |
| 67 | Elementary Distance | Google Distance Matrix | Fields 65 (school name) + address |
| 70 | Middle Distance | Google Distance Matrix | Fields 68 (school name) + address |
| 73 | High Distance | Google Distance Matrix | Fields 71 (school name) + address |
| 83-87 | Distance to Amenities (5 fields) | Google Places + Distance Matrix | Address + amenity type |
| 116 | Emergency Services Distance | Google Distance Matrix | Address + "fire station" + "hospital" |

### Group C: Dedicated Scrapers (Backend-Owned) - 13 fields
| Field | Name | Scraper Source | Implementation Status |
|-------|------|----------------|----------------------|
| 60 | Permit History - Roof | Realtor.com (JS-rendered) + Pinellas County ePermits | 🔧 Needs headless browser |
| 61 | Permit History - HVAC | Realtor.com (JS-rendered) + Pinellas County ePermits | 🔧 Needs headless browser |
| 62 | Permit History - Other | Realtor.com (JS-rendered) + Pinellas County ePermits | 🔧 Needs headless browser |
| 91 | Median Home Price (Neighborhood) | Zillow/Realtor Market Data API or Scraper | 🔧 Needs implementation |
| 92 | Price Per Sq Ft (Recent Avg) | Zillow/Realtor Market Data API or Scraper | 🔧 Needs implementation |
| 94 | Price vs Median % | Calculated: `((listing_price - median_price) / median_price) * 100` | Depends on Field 91 |
| 95 | Days on Market (Avg) | Zillow/Realtor Market Data or MLS Stats | 🔧 Needs implementation |
| 98 | Rental Estimate (Monthly) | Zillow Rent Zestimate API or Scraper | 🔧 Needs implementation |
| 100 | Vacancy Rate (Neighborhood) | U.S. Census API | ✅ Working |
| 103 | Comparable Sales | Zillow/Realtor "Recently Sold" scraper | 🔧 Needs implementation |
| 38 | Tax Exemptions | County Property Appraiser scraper | 🔧 Needs implementation |
| 138 | Special Assessments | MLS PublicRemarks extraction or County records | 🔧 Needs implementation |
| 150 | Legal Description | County Property Appraiser | 🔧 Needs implementation |

### Group D: Not Applicable (Return NULL) - 30 fields
| Field | Name | Why NULL | Rule |
|-------|------|----------|------|
| 77 | Safety Score | No standardized API source | Always NULL |
| 82 | Commute to City Center | "City center" undefined per metro | Always NULL or use Google Distance to Downtown |
| 96 | Inventory Surplus | No public API source | Always NULL |
| 102 | Financing Terms | Property-specific, not public | Always NULL |
| 104-115 | Utility Providers & Costs (12 fields) | No reliable APIs for provider IDs or accurate costs | Always NULL (see alternative below) |
| 134 | Smart Home Features | Not in MLS, not verifiable | Always NULL unless explicitly in MLS features array |
| 137 | Age Restrictions | Not in MLS for single-family | Always NULL unless in HOA docs |
| 140 | Carport Spaces | Not in MLS | NULL if MLS doesn't provide |
| 143 | Assigned Parking Spaces | Not in MLS for single-family | NULL if MLS doesn't provide |
| 144-148 | Building Details (5 fields) | Single-family homes don't have these | NULL for property_type = "Single Family" |
| 151 | Homestead Exemption | Not in MLS | NULL (or scrape from County) |
| 152-153 | CDD Y/N, CDD Fee | Not in MLS | NULL (or scrape from County) |
| 156 | Waterfront Feet | Rarely in MLS | NULL unless MLS provides |
| 161-165 | Lease/Pet Details (5 fields) | Not in MLS for listings | NULL unless in MLS remarks |

---

## CATEGORY 2: BACKEND-CALCULATED (LLM Receives Inputs) - 12 Fields

**Rule:** Backend calculates, LLM receives result as `numericInputs`, can optionally verbalize.

| Field | Name | Calculation | Input Fields | LLM Role |
|-------|------|-------------|--------------|----------|
| 11 | Price Per Sq Ft | `field_10 / field_21` | 10, 21 | None (already in MLS) |
| 20 | Total Bathrooms | `field_18 + (field_19 * 0.5)` | 18, 19 | None |
| 37 | Property Tax Rate | `(field_35 / field_15) * 100` | 35, 15 | None |
| 93 | Price to Rent Ratio | `field_10 / (field_98 * 12)` | 10, 98 | Can explain if asked |
| 99 | Rental Yield | `(field_98 * 12) / field_10 * 100` | 98, 10 | Can explain if asked |
| 101 | Cap Rate | Complex formula with expenses | 98, 10, 35, 97, 31 | Can explain assumptions |
| 94 | Price vs Median % | `((field_10 - field_91) / field_91) * 100` | 10, 91 | None |
| 67, 70, 73 | School Distances (3) | Google Distance Matrix results | School addresses | None |
| 83-87 | Amenity Distances (5) | Google Distance Matrix results | Amenity locations | None |

---

## CATEGORY 3: LLM-ALLOWED (Evidence-Based Extraction) - 78 Fields

**Rule:** LLM may fill ONLY if explicit evidence provided in `fieldCandidates`.

### Group A: Stellar MLS Fields (Already Reliable) - 63 fields
These come from Bridge MLS and are already high-confidence. LLM should NOT touch these.

**Fields 1-168 that have source="Stellar MLS" are locked.**

### Group B: Descriptive/Interpretive Fields (Evidence Required) - 15 fields

| Field | Name | Evidence Source | Extraction Pattern | Fallback |
|-------|------|-----------------|-------------------|----------|
| 44 | Garage Type | MLS PublicRemarks + Features | Regex: `(attached|detached|built-in|carport).*garage` | NULL if not found |
| 53 | Fireplace Count | MLS Features array | Count if field_52 = "Yes", else 0 | NULL if ambiguous |
| 59 | Recent Renovations | MLS PublicRemarks | Regex: `(renovated|remodeled|updated|new).*(\d{4})` | NULL if no dates |
| 118 | Air Quality Grade | MLS PublicRemarks or general area data | Extract if mentioned | NULL |
| 121 | Climate Risk | MLS PublicRemarks or NOAA data | Extract score if mentioned | NULL |
| 122 | Wildfire Risk | MLS PublicRemarks or FEMA | Extract if mentioned | NULL |
| 124 | Hurricane Risk | MLS PublicRemarks or NOAA | Extract if mentioned | "High" for FL coastal |
| 125 | Tornado Risk | MLS PublicRemarks or NOAA | Extract if mentioned | NULL |
| 128 | Sea Level Rise Risk | MLS PublicRemarks or NOAA | Extract if mentioned | Calculate from distance to coast |
| 130 | Solar Potential | Weather API (cloud cover) or Google Solar | Already from API | NULL |
| 131 | View Type | MLS PublicRemarks + Features | Extract: `(water|golf|lake|ocean|pool|garden|city).*view` | NULL |
| 132 | Lot Features | MLS Features array | Join array values | NULL |
| 135 | Accessibility Modifications | MLS PublicRemarks | Regex: `(wheelchair|ramp|accessible|ada|wide doorway)` | NULL |
| 136 | Pet Policy | MLS PublicRemarks or HOA docs | Regex: `pets?\s+(allowed|welcome|ok|friendly|no|not allowed)` | NULL |
| 163-164 | Pet Size/Weight Limits | MLS PublicRemarks | Regex: `(\d+)\s*(lb|lbs|pound).*pet` or `(small|medium|large).*pet` | NULL |

---

## IMPLEMENTATION PRIORITY

### Phase 1: Lock Down Backend-Only Fields (Week 1)
1. ✅ **Mark 78 fields as `backend_only: true`**
2. ✅ **Update LLM prompt:** "Return 'null' for all backend_only fields"
3. ✅ **Add validation:** Reject any LLM response that fills backend_only fields

### Phase 2: Build Calculation Engine (Week 1)
1. Create `calculate-derived-fields.ts`:
   - Functions for all 12 calculated fields
   - Null-safe math (return NULL if inputs missing)
   - Log which inputs were missing

### Phase 3: Build Evidence Extraction Engine (Week 2)
1. Create `extract-evidence.ts`:
   - Regex patterns for garage, fireplace, renovations, pets, etc.
   - Extract sentence fragments containing keywords
   - Return `fieldCandidates` object

### Phase 4: Build Permit Scraper (Week 2-3)
1. Research Realtor.com permit API (reverse engineer)
2. If no API, implement headless browser (Browserless.io)
3. Add Pinellas County ePermits scraper
4. Classify permits into fields 60-62

### Phase 5: Restructure LLM Contract (Week 3)
1. New prompt structure with `backend_only` flags
2. Pass `fieldCandidates` instead of full MLS text
3. Pass `numericInputs` for calculated fields
4. Strict schema enforcement

### Phase 6: Add Validator Pass (Week 4)
1. Second LLM call to validate first pass
2. Flag fields where value not in evidence
3. Programmatically null-out flagged fields

---

## FIELD CATEGORIZATION SUMMARY

| Category | Count | LLM Role | Backend Role |
|----------|-------|----------|--------------|
| **Backend-Only** | 78 | Return "null" | Sole writer |
| **Calculated** | 12 | Receive result | Calculate |
| **LLM Evidence-Based** | 15 | Extract from snippets | Provide evidence |
| **Stellar MLS (Locked)** | 63 | Never touch | Already filled |
| **TOTAL** | 168 | Minimal | Maximal |

---

## EXPECTED OUTCOMES

### Before (Current State):
- 60+ fields with hallucinations or NULL
- Inconsistent data quality
- No source tracking
- LLM "fills gaps" with guesses

### After (New Architecture):
- 78 fields guaranteed accurate (backend-only)
- 12 fields mathematically correct (calculations)
- 15 fields evidence-based only (no fabrication)
- 63 fields from MLS (already reliable)
- **Expected improvement:** 95%+ accuracy, 60%+ fewer NULLs

---

## NEXT STEPS

1. **Immediate:** Create field categorization enum in TypeScript
2. **Week 1:** Implement calculation engine
3. **Week 2:** Implement evidence extraction
4. **Week 3:** Implement permit scraper
5. **Week 4:** Restructure LLM prompts
6. **Week 5:** Add validator pass
7. **Week 6:** Test on 100 properties, measure improvement
