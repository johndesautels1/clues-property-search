# CLUES Property Dashboard - Field 16/53 Handoff

**Date:** 2026-01-04
**Conversation ID:** CLUES-2026-0104-AUDIT-FIX-001
**Commits:** 688ad96, e07c05e

---

## COMPLETED WORK

### Commit 688ad96: 10 Critical Bug Fixes
1. ✅ Gemini garbage data filtering
2. ✅ Fiber availability 'Yes'/'No' fix
3. ✅ Transit variable busNearData fix
4. ✅ Field key construction using FIELD_ID_TO_KEY
5. ✅ Utility field numbers (104-110)
6. ✅ Arbitration tier bugs (tier 4 & 5)
7. ✅ Contradictory prompt instructions
8. ✅ JSON.parse try-catch wrappers
9. ✅ Cascade order completeness (15 LLMs)

### Commit e07c05e: Field Mapping Fixes
1. ✅ Field 16: `redfin_estimate` → `avms` (renamed in 21 files)
2. ✅ Field 53: `fireplace_count` → `primary_br_location` (renamed in 21 files)
3. ✅ Added fields 169-181 to field-normalizer.ts
4. ✅ Verification script passes with 0 errors

---

## REMAINING WORK - FIELD 16 AVM SUBFIELDS

### What Still Needs Implementation:

Field 16 is now named `avms` but the **actual AVM averaging logic** is NOT implemented yet.

The schema (fields-schema.ts) defines these subfields:
```
16a: field_16a_zestimate - Zillow Zestimate
16b: field_16b_redfin_estimate - Redfin Estimate
16c: field_16c_first_american_avm - First American AVM (Homes.com)
16d: field_16d_quantarium_avm - Quantarium AVM (Homes.com)
16e: field_16e_ice_avm - ICE AVM (Homes.com)
16f: field_16f_collateral_analytics_avm - Collateral Analytics (Homes.com)
```

### Implementation Required:

1. **Add subfield entries to field-normalizer.ts**:
```typescript
{ fieldNumber: '16a', apiKey: '16a_zestimate', group: 'financial', propName: 'zestimate', type: 'number' },
{ fieldNumber: '16b', apiKey: '16b_redfin_estimate', group: 'financial', propName: 'redfinEstimate', type: 'number' },
{ fieldNumber: '16c', apiKey: '16c_first_american_avm', group: 'financial', propName: 'firstAmericanAvm', type: 'number' },
{ fieldNumber: '16d', apiKey: '16d_quantarium_avm', group: 'financial', propName: 'quantariumAvm', type: 'number' },
{ fieldNumber: '16e', apiKey: '16e_ice_avm', group: 'financial', propName: 'iceAvm', type: 'number' },
{ fieldNumber: '16f', apiKey: '16f_collateral_analytics_avm', group: 'financial', propName: 'collateralAnalyticsAvm', type: 'number' },
```

2. **Create calculation function in calculate-derived-fields.ts**:
```typescript
function calculateAverageAvm(data: PropertyData): number | null {
  const avms = [
    data['16a_zestimate'],
    data['16b_redfin_estimate'],
    data['16c_first_american_avm'],
    data['16d_quantarium_avm'],
    data['16e_ice_avm'],
    data['16f_collateral_analytics_avm'],
  ].filter(v => v !== null && v !== undefined && typeof v === 'number');

  if (avms.length === 0) return null;
  return Math.round(avms.reduce((a, b) => a + b, 0) / avms.length);
}
```

3. **Update UI to display all 6 AVM sources + average**

4. **Update property.ts types** to include subfields in financial section

---

## THE 7 CONTROLLING FILES - STATUS

| File | Status |
|------|--------|
| src/types/fields-schema.ts | ✅ SOURCE OF TRUTH - 181 fields |
| api/property/search.ts | ✅ Fixed |
| api/property/arbitration.ts | ✅ Fixed |
| src/lib/field-normalizer.ts | ✅ Fixed (needs subfields) |
| api/property/parse-mls-pdf.ts | ✅ Fixed |
| src/services/valuation/geminiBatchWorker.ts | ✅ Fixed |
| src/services/valuation/geminiConfig.ts | ⚠️ Check field references |

---

## NEXT CONVERSATION COMMANDS

1. Read this handoff: `D:/Clues_Quantum_Property_Dashboard/HANDOFF_FIELD_16_53_FIXES_2026-01-04.md`
2. Implement AVM subfields (16a-16f)
3. Create averaging calculation
4. Update UI to display all AVMs
5. Run verification: `npx ts-node scripts/verify-field-mapping.ts`
6. Test property search

---

**END OF HANDOFF**
