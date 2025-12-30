# Bridge MLS Field Mapping Checklist
**Goal:** Map 26+ unmapped Bridge MLS fields to existing schema fields

---

## PRIORITY 1: UTILITIES (High Impact - Stop All Hallucinations)

### ✅ Field 104: Electric Provider
- **Status:** ✅ COMPLETE (mapped + protected + tested)
- **Bridge MLS Field:** `property.Electric`
- **Data Type:** String
- **Before:** 100% hallucinated by Claude Opus
- **After:** Verified - Shows "Stellar MLS" source
- **Code Changes:**
  - `src/lib/bridge-field-mapper.ts` line 293-295 ✅
  - `api/property/search.ts` STELLAR_MLS_AUTHORITATIVE_FIELDS ✅
- **Test Result:** ✅ Working (Indian Rocks Beach property)

### ✅ Field 106: Water Provider
- **Status:** ✅ COMPLETE (mapped + protected + tested)
- **Bridge MLS Field:** `property.Water` (array)
- **Data Type:** String array → join with ', '
- **Before:** 100% hallucinated by Claude Opus
- **After:** Protected - Returns NULL when MLS has no data (blocks hallucinations)
- **Code Changes:**
  - `src/lib/bridge-field-mapper.ts` line 297-300 ✅
  - `api/property/search.ts` STELLAR_MLS_AUTHORITATIVE_FIELDS ✅
- **Test Result:** ✅ Protection working (prevented Opus hallucination)

### ✅ Field 108: Sewer Provider
- **Status:** ✅ COMPLETE (mapped + protected + tested)
- **Bridge MLS Field:** `property.Sewer` (array)
- **Data Type:** String array → join with ', '
- **Before:** 100% hallucinated by Claude Opus
- **After:** Verified - Shows "Public Sewer" from Stellar MLS
- **Code Changes:**
  - `src/lib/bridge-field-mapper.ts` line 302-305 ✅
  - `api/property/search.ts` STELLAR_MLS_AUTHORITATIVE_FIELDS ✅
- **Test Result:** ✅ Working (Indian Rocks Beach property)

### ✅ Field 109: Natural Gas
- **Status:** ✅ COMPLETE (mapped + protected + tested)
- **Bridge MLS Field:** `property.Gas`
- **Data Type:** String
- **Before:** 100% hallucinated by Claude Opus
- **After:** Verified - Shows "Stellar MLS" source
- **Code Changes:**
  - `src/lib/bridge-field-mapper.ts` line 307-309 ✅
  - `api/property/search.ts` STELLAR_MLS_AUTHORITATIVE_FIELDS ✅
- **Test Result:** ✅ Working (Indian Rocks Beach property)

**Priority 1 Impact:** 4 fields, 100% hallucinated → 90%+ accurate OR honest NULL ✅ COMPLETE

---

## PRIORITY 2: GARAGE & STRUCTURE (Medium Impact)

### ⏳ Field 44: Garage Type
- **Status:** ⏸️ PENDING (after utilities tested)
- **Bridge MLS Field:** `property.AttachedGarageYN` (fallback if GarageType NULL)
- **Data Type:** Boolean → "Attached" or "Detached"
- **Current State:** 75% NULL, 25% hallucinated by Gemini
- **Expected After:** 80%+ accurate
- **Code Change:** `src/lib/bridge-field-mapper.ts` line ~170
- **Logic:** If GarageType exists use it, else infer from AttachedGarageYN

### ⏳ Field 27: Stories
- **Status:** ⏸️ PENDING (after garage tested)
- **Bridge MLS Field:** `property.ArchitecturalStyle` (array) or `property.Levels`
- **Data Type:** String array → extract number
- **Current State:** 50% NULL
- **Expected After:** 80%+ filled
- **Code Change:** `src/lib/bridge-field-mapper.ts` line ~110
- **Logic:** Extract from "One Story", "Two Story" keywords or use Levels field

**Priority 2 Impact:** 2 fields, reduce NULL/hallucinated by 60%+

---

## PRIORITY 3: ENHANCED FEATURES (Low Impact - Nice to Have)

### ⏳ Field 132: Lot Features (Enhanced)
- **Status:** ⏸️ PENDING
- **Bridge MLS Field:** `property.Topography`, `property.Vegetation`
- **Data Type:** Arrays
- **Current State:** Partial data from LotFeatures
- **Expected After:** Richer descriptions
- **Code Change:** Append to existing lot features

### ⏳ Field 138: Special Assessments
- **Status:** ⏸️ PENDING
- **Bridge MLS Field:** `property.SpecialListingConditions`
- **Data Type:** Array
- **Current State:** 75% NULL
- **Expected After:** 50% NULL (better detection)
- **Code Change:** Extract assessment-related conditions

**Priority 3 Impact:** 2 fields, minor improvement in completeness

---

## PRIORITY 4: WATERFRONT ENHANCEMENTS (Low Impact - Niche)

### ⏳ Field 156: Waterfront Feet (Alternative Source)
- **Status:** ⏸️ PENDING
- **Bridge MLS Field:** `property.CanalFrontage`
- **Data Type:** Number
- **Current State:** 100% NULL
- **Expected After:** 20% filled (waterfront properties only)
- **Code Change:** Use as fallback if WaterfrontFeet NULL

### ⏳ Enhanced Waterfront Data (Not in current schema)
- **Bridge Fields Available:**
  - `property.DockType`
  - `property.NavigableWaterYN`
  - `property.BoatLiftCapacity`
  - `property.BridgeClearance`
- **Note:** These don't map to existing fields but could enhance waterfront section

**Priority 4 Impact:** 1 field, very low impact (waterfront properties only)

---

## TESTING PROTOCOL (For Each Field)

1. ✅ **Make code change** - Add mapping in bridge-field-mapper.ts
2. ✅ **Commit change** - Git commit with field number in message
3. ✅ **Deploy to Vercel** - Push to trigger deployment
4. ✅ **Test with 1 property** - Search a property and check field
5. ✅ **Verify in logs** - Check Vercel logs for Bridge MLS data
6. ✅ **Compare before/after** - Document improvement
7. ✅ **Update checklist** - Mark as completed
8. ➡️ **Move to next field**

---

## OVERALL PROGRESS TRACKER

| Priority | Fields Total | Fields Mapped | Fields Pending | % Complete |
|----------|-------------|---------------|----------------|------------|
| P1 (Utilities) | 4 | **4** ✅ | 0 | **100%** ✅ |
| P2 (Structure) | 2 | 0 | 2 | 0% |
| P3 (Features) | 2 | 0 | 2 | 0% |
| P4 (Waterfront) | 1 | 0 | 1 | 0% |
| **TOTAL** | **9** | **4** | **5** | **44%** |

**Target Completion:** Map all Priority 1 & 2 fields (6 total)
**Expected Impact:** 15-20 fewer NULL/hallucinated fields

---

## NOTES & DISCOVERIES

- [ ] Need to check if Bridge MLS returns these fields consistently
- [ ] Need to verify data quality vs LLM hallucinations
- [ ] May need to add some fields to STELLAR_MLS_AUTHORITATIVE_FIELDS
- [ ] Document which fields Bridge has data for vs returns NULL

---

**Last Updated:** 2025-12-30 (Priority 1 COMPLETE - all utility fields mapped, protected, tested)
**Next Action:** Map Priority 2 - Field 44 (Garage Type) and Field 27 (Stories)
