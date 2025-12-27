# CLUES Property Dashboard - Session Handoff
**Date:** December 27, 2025
**Session ID:** CLUES-FIXES-2025-12-27-SESSION-2
**Repository:** github.com/johndesautels1/clues-property-search
**Branch:** main
**Last Commit:** 2074778

---

## TOKEN USAGE WARNING
Current: 152,525 / 200,000 (76%)
**Action Required:** Start new conversation after this handoff

---

## SESSION SUMMARY - FIXES COMPLETED

### 1. ✅ Bug #1 & #2 FIXED (Commit: 5cc3083)
- **Section Weights Normalized:** 103% → 100.00% in Compare.tsx
- **Fake Score Calculator Removed:** Deleted from SearchProperty.tsx lines 115-146
- **PropertyCard.smartScore:** Made optional, displays "N/A" until 2-tier calculation

### 2. ✅ Bug #3 FIXED (Commit: deedb01)
- **All Fake Calculations Removed:**
  - field-normalizer.ts:862 - Deleted: `smartScore = min(100, fieldsPopulated + 20)`
  - PropertyDetail.tsx - Handle undefined smartScore
  - Compare.tsx - Use calculated scores, not card scores

### 3. ✅ Bug #4 FIXED (Commit: d01c1ef)
- **Walk/Transit/Bike Score Parsing:**
  - Added regex: `/^(\d+)/` to extract numbers from strings
  - "77 - Very Walkable" → 77
  - Applied to normalizeWalkScore, normalizeTransitScore, normalizeBikeScore

### 4. ✅ DOM/CDOM & Price Per Sqft FIXED (Commit: 8dc040c)
- **DOM/CDOM Swap:** Fixed display order in PropertyCardUnified.tsx
- **Price Per Sqft:** Auto-calculates from price/sqft when field 11 missing
  - SearchProperty.tsx lines 68-73
  - AddProperty.tsx lines 866-870, 920-924

### 5. ✅ CRITICAL: Stellar MLS Filtering FIXED (Commit: 2074778)
- **ROOT CAUSE:** MLS queries returned prior/closed listings instead of current/active
- **bridge-api-client.ts:**
  - Line 399-401: DEFAULT status filter to "Active"
  - Line 418: Sort by `ListingContractDate desc` (newest first)
- **PropertyDetail.tsx:**
  - Line 1223: ALWAYS show listingPrice (removed Closed logic)
  - Line 1065: Removed duplicate city/state/zip

---

## REMAINING BUGS (FROM ORIGINAL HANDOFF)

### Bug #5: Beach/Inland Logic NOT Applied ⚠️ HIGH PRIORITY
**Status:** NOT STARTED
**File Created:** `src/lib/florida-location-logic.ts` (182 zip codes) ✅
**Problem:** 138 normalizers don't use beach/inland thresholds yet

**What Needs to Happen:**
1. Audit all normalizers in `src/lib/normalizations/*.ts`
2. Import `getLocationType()` from florida-location-logic.ts
3. Update each normalizer to apply different thresholds:
   - **Example (Field 11 - Price Per Sqft):**
     - Beach: <$200=100, <$350=80, <$450=60, ≥$700=10
     - Inland: <$150=100, <$250=88, <$320=72, ≥$600=10

**Estimated Scope:** 2-3 hours, systematic update of 138 normalizers

---

## CRITICAL FILE MAPPING REFERENCE

### SOURCE OF TRUTH FILES (DO NOT CHANGE)
```
src/types/fields-schema.ts         - 168 field definitions
src/lib/field-normalizer.ts        - Field mapping to Property object
FIELD_MAPPING_TRUTH.md              - Field mapping documentation
```

### FIELD MAPPING (MUST MATCH fields-schema.ts)
```
Field 4  = listing_status          (address.listingStatus)
Field 10 = listing_price            (address.listingPrice) ← CURRENT LISTING
Field 11 = price_per_sqft           (address.pricePerSqft)
Field 14 = last_sale_price          (details.lastSalePrice) ← PRIOR SALE
Field 17 = bedrooms                 (details.bedrooms)
Field 21 = living_sqft              (details.livingSqft)
Field 35 = annual_taxes             (details.annualTaxes)
Field 74 = walk_score               (location.walkScore)
Field 75 = transit_score            (location.transitScore)
Field 76 = bike_score               (location.bikeScore)
```

### DATA FLOW
```
1. Stellar MLS (SOURCE OF TRUTH)
   ├─ api/property/bridge-mls.ts
   ├─ src/lib/bridge-api-client.ts ← FILTERS: Active status, newest date
   └─ src/lib/bridge-field-mapper.ts

2. Field Normalization
   ├─ src/lib/field-normalizer.ts
   └─ src/lib/normalizations/*.ts ← 138 normalizers

3. Display Components
   ├─ src/components/property/PropertyCardUnified.tsx
   ├─ src/pages/PropertyDetail.tsx
   └─ src/pages/Compare.tsx
```

---

## SMART SCORE SYSTEM (2-TIER)

**TIER 1 - Client-Side Calculation:**
- File: `src/lib/smart-score-calculator.ts`
- Uses: 138 field normalizers from `src/lib/normalizations/*.ts`
- Process: Each field normalized 0-100 using industry formulas
- Grouped: 22 sections (A-V) with weights summing to 100%
- Output: Objective formula-based score

**TIER 2 - LLM Consensus:**
- File: `api/property/smart-score-llm-consensus.ts`
- Process: 3 LLMs vote (Perplexity, Claude Opus, GPT-4.5)
- Prompt: `SMART_SCORE_LLM_PROMPT_MASTER.md`
- Logic: If agree (±3 points) → median, else → median of 3
- Output: Subjective expert consensus

**Grand Unified Arbitration:**
- File: `src/lib/smart-score-unifier.ts`
- Divergence ≤5: Average 50/50
- Divergence 6-15: 55% client / 45% LLM
- Divergence >15: 60% client / 40% LLM
- **This final score is THE SMART Score**

---

## KNOWN ISSUES & TESTING NEEDED

### MUST TEST IMMEDIATELY:
1. **259 Robin Dr, Sarasota FL** - Verify shows:
   - Price: $8,900,000 (not $5,995,000)
   - Status: "Active" (not "Closed")
   - MLS#: Current number (not prior)
   - Address: No duplicate city/state/zip

2. **Other Properties** - Check for prior listing contamination
3. **Walk Scores** - Verify "77 - Very Walkable" parses to 77
4. **Price Per Sqft** - Verify auto-calculation when field 11 missing

### POTENTIAL ISSUES:
- PropertyCardUnified may need smartScore undefined handling in other places
- DOM/CDOM color coding function may need undefined check
- Field 14 (lastSalePrice) should NEVER appear in listing price displays

---

## DIRECTORY STRUCTURE

```
D:\Clues_Quantum_Property_Dashboard\
├── api/
│   └── property/
│       ├── bridge-mls.ts              ← Stellar MLS endpoint
│       ├── search.ts                  ← Main search orchestrator
│       └── smart-score-llm-consensus.ts
├── src/
│   ├── components/
│   │   └── property/
│   │       └── PropertyCardUnified.tsx ← Property card display
│   ├── lib/
│   │   ├── bridge-api-client.ts       ← CRITICAL: MLS query builder
│   │   ├── field-normalizer.ts        ← Field mapping logic
│   │   ├── florida-location-logic.ts  ← Beach/inland zip codes
│   │   ├── smart-score-calculator.ts  ← TIER 1 scoring
│   │   ├── smart-score-unifier.ts     ← Final arbitration
│   │   └── normalizations/            ← 138 field normalizers
│   │       ├── high-value-sections.ts
│   │       ├── medium-value-sections.ts
│   │       └── low-value-sections.ts
│   ├── pages/
│   │   ├── AddProperty.tsx
│   │   ├── Compare.tsx
│   │   ├── PropertyDetail.tsx         ← Detail page display
│   │   └── SearchProperty.tsx
│   └── types/
│       ├── fields-schema.ts           ← SOURCE OF TRUTH (168 fields)
│       └── property.ts                ← TypeScript interfaces
├── FIELD_MAPPING_TRUTH.md             ← Field mapping docs
├── SMART_SCORE_IMPLEMENTATION_COMPLETE.md
└── HANDOFF_2025-12-27_SESSION.md      ← Previous session
```

---

## COMMITS THIS SESSION

| Commit | Description |
|--------|-------------|
| 5cc3083 | Fix Bug #1 & #2: Section weights, fake score calculator |
| deedb01 | Fix Bug #3: Remove all fake calculations |
| d01c1ef | Fix Bug #4: Parse Walk/Transit/Bike Score strings |
| 8dc040c | Fix DOM/CDOM swap and price per sqft |
| 2074778 | CRITICAL: Filter Stellar MLS for Active listings |

---

## START NEXT SESSION WITH THIS PROMPT

```
CONTEXT: Continuing CLUES Property Dashboard development.

CRITICAL REMINDERS:
1. API keys configured in Vercel - DO NOT ask about them
2. All code changes MUST go to GitHub (git add, commit, push)
3. Read D:\Clues_Quantum_Property_Dashboard\HANDOFF_2025-12-27_SESSION_2.md

COMPLETED THIS SESSION:
✅ Bug #1: Section weights normalized to 100%
✅ Bug #2: Fake score calculator removed
✅ Bug #3: All fake calculations removed
✅ Bug #4: Walk/Transit/Bike Score parsing fixed
✅ DOM/CDOM display fixed
✅ Price per sqft auto-calculation added
✅ CRITICAL: Stellar MLS filtering for Active listings only

REMAINING PRIORITY BUGS:
1. Bug #5: Beach/inland logic NOT applied to 138 normalizers (HIGH PRIORITY)
   - File exists: florida-location-logic.ts
   - Need to update all normalizers in src/lib/normalizations/*.ts

TESTING REQUIRED:
- Verify 259 Robin Dr Sarasota shows correct data:
  - Price: $8,900,000 (not $5,995,000)
  - Status: "Active" (not "Closed")
  - MLS#: Current (not prior)

REPOSITORY: github.com/johndesautels1/clues-property-search
BRANCH: main
LAST COMMIT: 2074778

START HERE:
1. Test 259 Robin Dr to verify fixes worked
2. Continue with Bug #5 if user confirms, OR
3. Address any new issues user reports
```

---

## CRITICAL RULES TO FOLLOW

### Data Integrity:
1. **NEVER mix prior sale data with current listing data**
2. Field 10 (listing_price) = CURRENT listing price
3. Field 14 (last_sale_price) = PRIOR sale price
4. Field 4 (listing_status) must be "Active" for current listings
5. Stellar MLS is SOURCE OF TRUTH - always filter Active, sort by newest date

### Field Mapping:
1. `src/types/fields-schema.ts` = SOURCE OF TRUTH
2. All field numbers in other files MUST match fields-schema.ts
3. NEVER change field numbers without updating everywhere
4. Run verification: `npx ts-node scripts/verify-field-mapping.ts`

### Smart Scoring:
1. NEVER calculate scores before 3-property comparison
2. Use 2-tier system: Client-side + LLM consensus
3. Grand Unified Arbitration combines both tiers
4. Display "N/A" until calculation completes

### Git Workflow:
1. Commit after EVERY significant fix
2. Use descriptive commit messages
3. ALWAYS push to GitHub
4. Include "🤖 Generated with Claude Code" in commits

---

## FILES MODIFIED THIS SESSION

```
src/types/property.ts                          - smartScore made optional
src/pages/SearchProperty.tsx                   - Removed fake calculator, added price/sqft logic
src/pages/AddProperty.tsx                      - Added price/sqft auto-calculation
src/pages/Compare.tsx                          - Normalized section weights, fixed analytics
src/pages/PropertyDetail.tsx                   - Removed Closed logic, duplicate address
src/pages/PropertyDetailOld.tsx                - Handle undefined smartScore
src/components/property/PropertyCardUnified.tsx - Fixed DOM/CDOM swap, N/A display
src/lib/field-normalizer.ts                    - Removed fake smartScore calculation
src/lib/normalizations/medium-value-sections.ts - Walk/Transit/Bike Score parsing
src/lib/bridge-api-client.ts                   - DEFAULT Active filter, date sorting
```

---

## CONVERSATION ID
**CLUES-FIXES-2025-12-27-SESSION-2**

Save this handoff document. Start next session by reading it first.
