# CRITICAL HANDOFF: Schema Expansion Session 2026-01-03

**Conversation ID:** CLUES-220-MERGE-2026-01-03
**Status:** IN PROGRESS - PAUSED FOR SCORING RULES DEFINITION
**Priority:** CRITICAL - Do not proceed without reading this entire document

---

## SESSION SUMMARY

This session planned the expansion of the CLUES Property Dashboard schema from 168 to 181 fields, adding Section 23 (Market Performance). Implementation was PAUSED to define scoring rules first to protect the Olivia AI consensus system.

---

## CRITICAL ARCHITECTURE UNDERSTANDING

### The 3-Tier SMART Score Consensus System:
```
TIER 1: Client-Side (src/lib/smart-score-calculator.ts)
    ↓
TIER 2: LLM Consensus (Perplexity + Claude Opus, GPT tiebreaker)
    ↓
TIER 3: Grand Unified (src/lib/smart-score-unifier.ts)
    ↓
→ Ask Olivia Executive CMA Report
```

**RISK:** Adding fields without scoring rules breaks Olivia's entire analysis pipeline.

---

## APPROVED CHANGES (User Confirmed)

### 1. FIELD 16 MODIFICATION (AVMs)
```
BEFORE: { num: 16, key: 'redfin_estimate', label: 'Redfin Estimate' }
AFTER:  { num: 16, key: 'avms', label: 'AVMs (Average)' }
```

**Sub-fields (stored, NO new numbers):**
| Key | Label | Source |
|-----|-------|--------|
| field_16a_zestimate | Zillow Zestimate | Zillow |
| field_16b_redfin_estimate | Redfin Estimate | Redfin |
| field_16c_first_american_avm | First American AVM | Homes.com |
| field_16d_quantarium_avm | Quantarium AVM | Homes.com |
| field_16e_ice_avm | ICE AVM | Homes.com |
| field_16f_collateral_analytics_avm | Collateral Analytics | Homes.com |

**Field 16 value** = Average of all non-null sub-fields

### 2. FIELD 53 REPURPOSE
```
BEFORE: { num: 53, key: 'fireplace_count', label: 'Fireplace Count' }
AFTER:  { num: 53, key: 'primary_br_location', label: 'Primary BR Location' }
```
**MLS Source:** `MasterBedroomLevel`

### 3. SUB-FIELDS UNDER FIELD 50
| Key | Label | MLS Source |
|-----|-------|------------|
| field_50a_pantry | Pantry | InteriorFeatures |
| field_50b_walk_in_closet | Walk-in Closet | InteriorFeatures |

### 4. NEW SECTION 23 - MARKET PERFORMANCE (Group W)
| # | Key | Label | Type | Source |
|---|-----|-------|------|--------|
| 169 | zillow_views | Zillow Views | number | Zillow |
| 170 | redfin_views | Redfin Views | number | Redfin |
| 171 | homes_views | Homes.com Views | number | Homes.com |
| 172 | realtor_views | Realtor.com Views | number | Realtor.com |
| 173 | total_views | Total Views | number | CALCULATED |
| 174 | saves_favorites | Saves/Favorites | number | Portal |
| 175 | market_type | Market Type | select | Redfin |
| 176 | avg_sale_to_list_percent | Avg Sale-to-List % | percentage | Redfin |
| 177 | avg_days_to_pending | Avg Days to Pending | number | Redfin |
| 178 | multiple_offers_likelihood | Multiple Offers | select | Redfin |
| 179 | appreciation_percent | Appreciation % | percentage | CALCULATED |
| 180 | price_trend | Price Trend | select | Redfin |
| 181 | rent_zestimate | Rent Zestimate | currency | Zillow |

---

## REJECTED CHANGES (User Explicitly Declined)

- ~~169-181 HOA & Taxes additions~~ - NOT NEEDED
- ~~182-187 Structure & Systems additions~~ - Can scrape from public remarks
- ~~Interior Features additions~~ - Already have or not needed (except pantry/walk-in closet)
- ~~Exterior Features additions~~ - Already covered
- ~~City field~~ - Already have as full_address
- ~~Subdivision field~~ - Already have as neighborhood

---

## BLOCKING ISSUE: SCORING RULES NEEDED

Before implementing fields 169-181, we MUST define:

### Section W Weight
Current weights sum to ~103% (BUG noted in architecture doc)
**Question:** What weight should Section W (Market Performance) have?
- Reference: Pricing=18.5%, Schools=12.3%, Safety=4%, Market&Investment=8%

### Per-Field Scoring Rules
| Field | Normalization Type | Comparison | Notes |
|-------|-------------------|------------|-------|
| 169 zillow_views | HIGHER_BETTER | Relative | More views = more interest |
| 170 redfin_views | HIGHER_BETTER | Relative | |
| 171 homes_views | HIGHER_BETTER | Relative | |
| 172 realtor_views | HIGHER_BETTER | Relative | |
| 173 total_views | HIGHER_BETTER | Relative | Sum of 169-172 |
| 174 saves_favorites | HIGHER_BETTER | Relative | More saves = desirable |
| 175 market_type | ENUM_RANK | Seller>Balanced>Buyer | For buyers, buyer's market better? |
| 176 avg_sale_to_list | CONTEXT | TBD | High = seller's market |
| 177 avg_days_to_pending | LOWER_BETTER | Relative | Faster = hotter market |
| 178 multiple_offers | ENUM_RANK | TBD | Depends on buyer/seller perspective |
| 179 appreciation_percent | HIGHER_BETTER | Relative | |
| 180 price_trend | ENUM_RANK | Rising>Stable>Falling | Context dependent |
| 181 rent_zestimate | CONTEXT | TBD | Investment metric |

**USER MUST DEFINE:** Final scoring rules before implementation.

---

## FILES TO MODIFY (14 total)

### Schema & Data Files (7 - THE CRITICAL 7):
1. `src/types/fields-schema.ts` - SOURCE OF TRUTH
2. `src/lib/field-normalizer.ts`
3. `src/lib/bridge-field-mapper.ts`
4. `api/property/search.ts`
5. `api/property/parse-mls-pdf.ts`
6. `api/property/arbitration.ts`
7. `src/lib/calculate-derived-fields.ts`

### Scoring & Section Files (7 additional):
8. `src/types/olivia-enhanced.ts` - SECTION_METADATA, "22→23"
9. `src/api/olivia-math-engine.ts` - SECTION_WEIGHTS, validation
10. `src/components/SMARTScoreDisplay.tsx` - SECTION_ICONS, "22→23" text
11. `src/pages/Compare.tsx` - INDUSTRY_WEIGHTS
12. `src/pages/PropertyDetail.tsx` - Section 23 rendering
13. `src/api/olivia.ts` - System prompt "22→23"
14. `src/lib/smart-score-calculator.ts` - SCOREABLE_FIELDS

### Normalization Files:
15. `src/lib/normalizations/remaining-sections.ts` - Add Section W normalizers

---

## FCC ATTRIBUTION REQUIREMENT

Created: `D:\Clues_Quantum_Property_Dashboard\FCC_ATTRIBUTION_REQUIREMENTS.md`

Any field using FCC Broadband data MUST display:
"This product uses FCC APIs and/or Data but is not endorsed or certified by the FCC."

---

## FOLDER CLEANUP COMPLETED

Root directory reduced from 136 files to 18 files.
All MD files organized into:
- md-files/sessions/
- md-files/schema/
- md-files/api/
- md-files/olivia/
- md-files/charts/
- md-files/architecture/
- md-files/legal/
- md-files/archive/

Visual folders consolidated into: assets/visuals/

---

## NEXT STEPS (In Order)

1. **USER ACTION:** Define scoring rules for fields 169-181
2. **USER ACTION:** Assign Section W weight (suggest 5-8% based on Market & Investment = 8%)
3. **CLAUDE ACTION:** Add normalization functions to remaining-sections.ts
4. **CLAUDE ACTION:** Implement field changes in all 14 files
5. **CLAUDE ACTION:** Run verification: `npx ts-node scripts/verify-field-mapping.ts`
6. **CLAUDE ACTION:** Run build: `npm run build`
7. **TEST:** Verify Section 23 displays in PropertyDetail
8. **TEST:** Verify SMART Score calculates for Section W

---

## CRITICAL WARNINGS

1. **DO NOT** change field numbers 1-168 (except renaming 16, 53)
2. **DO NOT** add fields without scoring rules
3. **DO NOT** modify normalization logic without understanding 3-tier consensus
4. **DO NOT** forget to update LLM prompts when adding new fields
5. **ALWAYS** run verify-field-mapping.ts after changes

---

## KEY FILES TO READ BEFORE CONTINUING

1. `md-files/architecture/SMART_SCORE_ARCHITECTURE.md` - Canonical scoring reference
2. `src/lib/smart-score-calculator.ts` - Client-side scoring implementation
3. `src/lib/normalizations/remaining-sections.ts` - Where to add new normalizers
4. `src/types/fields-schema.ts` - SOURCE OF TRUTH for field definitions

---

## CONVERSATION COMPACTION NOTES

When this conversation compacts, the following MUST be preserved:
1. Field 16 → avms with 16a-16f sub-fields
2. Field 53 → primary_br_location (repurposed)
3. Section 23 = Market Performance (Group W) with fields 169-181
4. 3-tier consensus architecture (Client + LLM + Unified)
5. 14 files must be synchronized
6. Scoring rules MUST be defined before implementation

---

**Document Created:** 2026-01-03
**Document Updated:** 2026-01-03 (Implementation Complete)
**Session Status:** COMPLETED - All changes implemented and build verified
**Final Field Count:** 181 fields, 23 sections (A-W)
