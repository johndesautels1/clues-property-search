# ACTUAL LINE-BY-LINE AUDIT - NO SPIN
**Date:** 2026-01-14
**Method:** Grep every field in every file, document exact line numbers
**No assumptions. No "should work". Only proven facts.**

---

## FIELD 3: new_construction_yn

| File | Line | Actual Code | Status |
|------|------|-------------|--------|
| **K1** semantic-compare.ts | 591 | `key.includes('new_construction')` | ✅ FOUND in boolean detection |
| **K2** semantic-compare.ts | 591 | `key.includes('new_construction')` | ✅ FOUND in boolean detection |
| **I** AddProperty.tsx | 848 | `normalizeBooleanValue(row['3_new_construction_yn'])` | ✅ USES normalization |
| **H** cmaSchemas.ts | 118 | `'3_new_construction_yn': z.boolean().optional()` | ✅ BOOLEAN type |
| **G** property.ts | 32 | `newConstructionYN: DataField<boolean>` | ✅ BOOLEAN type |
| **C** search.ts | 289 | `'3_new_construction_yn': 'boolean'` | ✅ BOOLEAN type |
| **D** PropertyDetail.tsx | 2052 | `value ? 'Yes' : 'No'` | ⚠️ Displays as text but value is boolean |
| **E** arbitration.ts | N/A | Uses K2 for comparison | ✅ Uses K2 tolerance |
| **B** field-normalizer.ts | 118 | `type: 'boolean'` | ✅ BOOLEAN type |
| **F** parse-mls-pdf.ts | 466 | `'New Construction': 'new_construction_yn'` | ✅ Has mapping |

**VERIFIED:** Field 3 is handled correctly across all files.

---

