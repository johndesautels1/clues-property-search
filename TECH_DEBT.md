# 🔧 Technical Debt & Code Quality Issues

**Last Audit:** January 6, 2026
**Auditor:** Claude Sonnet 4.5 + Gemini CLI
**Project:** CLUES Quantum Property Dashboard

---

## ⚠️ CRITICAL ISSUES (Fix Before Production)

### 1. 🔴 **DUPLICATE ARBITRATION FILES** - HIGH PRIORITY

**Status:** ❌ **UNFIXED** (Deferred - too risky during analytics development)

**Files:**
- `api/property/arbitration.ts` (621 lines)
- `src/lib/arbitration.ts` (621 lines - EXACT DUPLICATE)

**Problem:**
- Both files contain identical code for the entire tiered arbitration system
- Changes to one file must be manually replicated to the other
- DRY (Don't Repeat Yourself) violation guarantees eventual divergence
- Critical system component (handles MLS vs LLM vs API precedence)

**Impact:**
- 🔴 **HIGH RISK:** Bugs introduced when one file is updated but not the other
- 🔴 **MAINTENANCE NIGHTMARE:** Schema changes require 2x work
- 🔴 **GUARANTEED DIVERGENCE:** Files will drift apart over time

**Fix Required:**
1. Consolidate into ONE authoritative file (recommend keeping `api/property/arbitration.ts`)
2. Delete `src/lib/arbitration.ts`
3. Update ALL imports throughout codebase to reference single file
4. Add ESLint rule to prevent future duplication

**Why Not Fixed Yet:**
- Too risky during active comparison analytics development
- Could break entire data pipeline if imports fail
- Section 3 and Section 4 visuals depend on this heavily
- **Fix after analytics stabilize and are fully tested**

**Estimated Effort:** 2-3 hours (careful refactor + testing)

---

### 2. 🔴 **FIELD_TYPE_MAP SCHEMA DUPLICATION** - HIGH PRIORITY

**Status:** ❌ **UNFIXED** (Deferred - too risky during analytics development)

**Files Containing Duplicate Schema:**
- `api/property/search.ts` (lines 102-396) - 295 lines
- `src/lib/field-normalizer.ts` (references schema)
- `api/property/retry-llm.ts` (likely contains similar mapping)

**Problem:**
- The 181-field schema type map is duplicated across 3+ files
- Adding/changing a field requires updating multiple locations
- Inconsistency between files causes type coercion errors
- No single source of truth for field types

**Impact:**
- 🔴 **SCHEMA DRIFT:** Different files have different type expectations
- 🔴 **BROKEN VALIDATION:** Currency fields become strings, booleans become numbers
- 🔴 **CALCULATION ERRORS:** Section 4 charts break if HOA/tax data types mismatch

**Fix Required:**
1. Create `api/property/field-schema-types.ts` as single source of truth
2. Export `FIELD_TYPE_MAP` from this central file
3. Update all 3+ files to import from central schema
4. Add schema sync validation test

**Why Not Fixed Yet:**
- Extremely risky - type coercion affects entire data pipeline
- Section 4 Chart 4-4 (property donuts) relies on numeric HOA/tax values
- Section 4 Chart 4-2 (relative tax scoring) needs correct numeric types
- **Fix after all comparison visuals are stable**

**Estimated Effort:** 4-6 hours (consolidation + regression testing)

---

### 3. ✅ **TIER 5 HALLUCINATION DETECTION BUG** - HIGH PRIORITY

**Status:** ✅ **FIXED** (January 6, 2026)

**Files Fixed:**
- `api/property/arbitration.ts:499`
- `src/lib/arbitration.ts:491` (duplicate file)

**Problem (Before Fix):**
```typescript
// ❌ OLD CODE (only checked Tier 4)
if (field.tier === 4) {
  // Flag single-source hallucinations
}
```

**Issue:**
- Only checked Tier 4 LLMs (Perplexity, Gemini, GPT, Grok)
- Ignored Tier 5 LLMs (Claude Sonnet, Claude Opus)
- Claude Opus hallucinations went undetected

**Fix Applied:**
```typescript
// ✅ NEW CODE (checks Tier 4 AND Tier 5)
if (field.tier >= 4) {
  // Flag single-source hallucinations from ALL LLMs
}
```

**Impact:**
- ✅ Now properly flags Claude Opus/Sonnet single-source warnings
- ✅ Improves data quality validation
- ✅ Zero risk to existing analytics (validation only, no data changes)

**Changed:** 1 line in 2 files (due to duplication)

---

## 🟡 MEDIUM PRIORITY ISSUES

### 4. 🟡 **TYPE COERCION LOGIC DUPLICATION**

**Files:**
- `api/property/search.ts:415-487` - `coerceValue()` function
- `src/lib/field-normalizer.ts:488-560` - `validateAndCoerce()` function

**Problem:**
- Two different functions doing similar type coercion
- Inconsistent behavior between API and frontend
- DRY violation

**Fix:**
- Consolidate into single `coerceFieldValue()` utility
- Import from shared location

**Priority:** Medium (fix during next refactor cycle)

---

### 5. 🟡 **HARDCODED FLORIDA COASTLINE POINTS**

**File:** `api/property/search.ts` (exact location TBD - file too large to audit fully)

**Problem:**
- `getDistances()` function uses hardcoded array of Florida coastline coordinates
- Not configurable for other states/regions
- Inaccurate approximation

**Fix:**
- Use geocoding API to calculate actual coast distances
- Or make coastline points configurable by region
- Or use external coastline dataset

**Priority:** Medium (currently only affects distance_beach_mi field)

---

### 6. 🟡 **MANUAL SYNC REQUIREMENT (llm-constants.ts)**

**Files:**
- `api/property/llm-constants.ts` (36 lines)
- `src/lib/llm-constants.ts` (mirror)

**Problem:**
- Two files define LLM cascade order
- Comments say "Keep both files in sync"
- Manual sync required when changing LLM order

**Fix:**
- Consolidate into single file in shared location
- Export from one, import in both API and frontend

**Priority:** Medium (low churn on this file)

---

## 🟢 LOW PRIORITY ISSUES

### 7. 🟢 **HARDCODED 2026 YEAR REFERENCES**

**Files:**
- `api/property/search.ts:8,11`
- Comments referencing "Updated 2026-01-05"
- LLM prompts asking for "2026 forecasts"

**Problem:**
- Documentation and prompts hardcode current year
- Will become stale in 2027

**Fix:**
- Use `new Date().getFullYear()` for dynamic year
- Or update comments annually

**Priority:** Low (cosmetic/documentation only)

---

### 8. 🟢 **DATA_QUALITY_RANGES HARDCODED FIELD NUMBERS**

**File:** `src/lib/field-normalizer.ts:1013-1043`

**Problem:**
```typescript
const DATA_QUALITY_RANGES = [
  { label: 'Section B: Pricing & Value', min: 11, max: 16, ... },
  // ... hardcoded field number ranges
];
```

**Issue:**
- If field schema reorders fields, ranges break
- Should be dynamically calculated from schema

**Fix:**
- Generate ranges from field-schema.ts definitions
- Or accept that schema is stable and document it

**Priority:** Low (schema is very stable)

---

## ❌ FALSE POSITIVES (Gemini Errors - Do NOT Fix)

### ❌ Fallthrough Logic (arbitration.ts:365-428)
**Status:** ✅ **WORKING AS DESIGNED**
**Reason:** Intentional deduplication when same-tier sources return identical values

### ❌ Same-Tier Conflict Resolution
**Status:** ✅ **WORKING AS DESIGNED**
**Reason:** Tiers 1-3 intentionally keep first reliable value (no LLM voting needed)

### ❌ Boolean Validation Rejecting Pool Strings
**Status:** ✅ **CORRECT VALIDATION**
**Reason:** Prevents "Community", "Private", "In-ground" from becoming booleans
**File:** `src/lib/field-normalizer.ts:514`

### ❌ api/property/cma.ts Errors
**Status:** 🤖 **GEMINI HALLUCINATION**
**Reason:** File does not exist in codebase - Gemini made it up

---

## 📊 SUMMARY STATISTICS

| **Category** | **Total Issues** | **Fixed** | **Deferred** | **False Positives** |
|-------------|------------------|-----------|--------------|---------------------|
| **Critical (High)** | 3 | 1 ✅ | 2 ⚠️ | 0 |
| **Medium** | 3 | 0 | 3 ⚠️ | 0 |
| **Low** | 2 | 0 | 2 ⚠️ | 0 |
| **False Positives** | 4 | - | - | 4 ❌ |
| **TOTAL REAL ISSUES** | **8** | **1** | **7** | **4** |

---

## 🎯 RECOMMENDED FIX ORDER

**PHASE 1 (COMPLETED):**
- ✅ Fix Tier 5 hallucination detection bug (DONE - Jan 6, 2026)

**PHASE 2 (After Analytics Stabilize):**
1. 🔴 Consolidate duplicate arbitration files
2. 🔴 Consolidate FIELD_TYPE_MAP schema duplication
3. 🟡 Consolidate type coercion logic

**PHASE 3 (Next Sprint):**
4. 🟡 Make coastline detection configurable
5. 🟡 Consolidate llm-constants files

**PHASE 4 (Backlog):**
6. 🟢 Update 2026 references to dynamic year
7. 🟢 Consider dynamic DATA_QUALITY_RANGES

---

## 🔒 SAFETY NOTES

**Why We Deferred Critical Fixes:**
- Arbitration system is CORE to entire data pipeline
- Type coercion affects all 181 fields across all charts
- Section 3 and Section 4 comparison visuals took weeks to build
- Fixing during active development risks breaking working analytics
- **Better to document and fix during dedicated refactor sprint**

**When to Fix Deferred Issues:**
- ✅ After Section 3 and Section 4 analytics are fully tested
- ✅ After user acceptance testing is complete
- ✅ During a dedicated "code quality sprint"
- ✅ With full regression testing suite in place

---

## 📝 NOTES FOR FUTURE DEVELOPERS

1. **Before touching arbitration.ts:**
   - Remember there are TWO identical copies
   - Changes must be made to BOTH files until consolidation
   - Test thoroughly - this is the heart of the data system

2. **Before adding/changing field types:**
   - Update FIELD_TYPE_MAP in ALL locations:
     - `api/property/search.ts`
     - `src/lib/field-normalizer.ts`
     - Any other files with schema definitions
   - Consider consolidating first (Issue #2)

3. **LLM Cascade Changes:**
   - Update BOTH llm-constants.ts files
   - Keep tier assignments consistent

---

**Generated by:** Claude Sonnet 4.5 + Gemini CLI Code Audit
**Date:** January 6, 2026
**Next Review:** After comparison analytics stabilization
