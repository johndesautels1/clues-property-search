# CLUES Property Dashboard - Critical Bug Fix Handoff Document

**Date:** 2026-01-04
**Conversation ID:** AUDIT-CASCADE-FIX-20260104
**Status:** AUDIT COMPLETE - FIXES REQUIRED

---

## EXECUTIVE SUMMARY

A comprehensive audit of all 7 property search controlling files was completed. **Over 150 issues identified** including critical bugs causing the "// Required." garbage data and 500 errors in the LLM cascade.

---

## CRITICAL COMMAND: FIELD SCHEMA PROTECTION

### SOURCE OF TRUTH - DO NOT ALTER

The **168 original fields** in `src/types/fields-schema.ts` are the **IMMUTABLE SOURCE OF TRUTH**.

Additionally, **13 fields were added** to expand the schema to **181 total fields**.

**YOU ARE COMMANDED:**
1. **NEVER alter, rename, or renumber the original 168 fields**
2. **NEVER alter, rename, or renumber the 13 additional fields**
3. **All field mappings in other files MUST match fields-schema.ts EXACTLY**
4. **Field numbers are PERMANENT identifiers - they cannot change**

### REQUIRED TASK FOR NEW CONVERSATION

After fixing all errors documented below, you MUST:

1. **Create a UNIFIED FIELD MAP TABLE** containing:
   - Field Number (1-181)
   - Field Key (e.g., `10_listing_price`)
   - Field Name (e.g., "Listing Price")
   - Field Type (text, number, boolean, currency, percentage, date, select, multiselect)
   - Section Letter (A-W)

2. **Compare this table against ALL 7 controlling files:**
   - `src/types/fields-schema.ts` (SOURCE OF TRUTH)
   - `api/property/search.ts`
   - `api/property/arbitration.ts`
   - `src/lib/field-normalizer.ts`
   - `api/property/parse-mls-pdf.ts`
   - `src/services/valuation/geminiBatchWorker.ts`
   - `src/services/valuation/geminiConfig.ts`

3. **Report ANY mismatches** in field numbers, field names, or field keys

4. **Run verification:** `npx ts-node scripts/verify-field-mapping.ts`

---

## THE 7 CONTROLLING FILES

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `src/types/fields-schema.ts` | SOURCE OF TRUTH - 181 field definitions |
| 2 | `api/property/search.ts` | Main search handler, LLM cascade, API calls |
| 3 | `api/property/arbitration.ts` | Field arbitration, tier-based precedence |
| 4 | `src/lib/field-normalizer.ts` | Field key normalization and mapping |
| 5 | `api/property/parse-mls-pdf.ts` | MLS PDF parsing and field extraction |
| 6 | `src/services/valuation/geminiBatchWorker.ts` | Gemini batch extraction worker |
| 7 | `src/services/valuation/geminiConfig.ts` | Gemini configuration and schemas |

---

## CRITICAL BUGS TO FIX (Priority Order)

### 1. GEMINI BATCH RETURNING GARBAGE DATA ("// Required.")

**Files:** `geminiBatchWorker.ts`, `geminiConfig.ts`

**Root Cause:** Google Search grounding + responseSchema conflict

| Line | File | Issue | Fix |
|------|------|-------|-----|
| 116 | geminiBatchWorker.ts | `tools: [{ googleSearch: {} }]` conflicts with `responseSchema` | Either disable grounding OR handle grounding metadata in response parsing |
| 165 | geminiBatchWorker.ts | `responseSchema: schema` combined with grounding causes garbage | See above |
| 184-189 | geminiBatchWorker.ts | Validation fails but returns garbage data anyway | REJECT data when validation fails, return empty object |
| 224 | geminiBatchWorker.ts | Assigns "High" confidence to garbage values | Add garbage detection: reject values matching schema description patterns like "// Required.", "null", placeholder text |
| 191 | geminiBatchWorker.ts | Returns `parsedData` without sanitization | Add filter to remove non-data values before returning |

**Recommended Fix:**
```typescript
// Add garbage value filter before returning
const GARBAGE_PATTERNS = [
  /^\/\//,           // Starts with //
  /Required\.?$/i,   // Ends with "Required"
  /^null$/i,         // Literal "null" string
  /^\s*$/,           // Empty/whitespace only
];

function isGarbageValue(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return GARBAGE_PATTERNS.some(pattern => pattern.test(value));
}

// Filter before returning
const cleanedData = Object.fromEntries(
  Object.entries(parsedData).filter(([_, v]) => !isGarbageValue(v))
);
```

---

### 2. FIBER AVAILABILITY ALWAYS RETURNS 'Yes'

**File:** `api/property/search.ts`
**Line:** 2852

**Bug:**
```typescript
value: hasFiber ? 'Yes' : 'Yes',  // WRONG: Both branches return 'Yes'
```

**Fix:**
```typescript
value: hasFiber ? 'Yes' : 'No',
```

---

### 3. WRONG VARIABLE IN TRANSIT ACCESS

**File:** `api/property/search.ts`
**Line:** 1771

**Bug:**
```typescript
if (busData.results && busData.results.length > 0) {  // WRONG: should be busNearData
```

**Fix:**
```typescript
if (busNearData.results && busNearData.results.length > 0) {
```

---

### 4. INCOMPLETE FIELD KEY CONSTRUCTION

**File:** `api/property/search.ts`
**Line:** 5329

**Bug:**
```typescript
const fieldKey = `${fieldId}_`;  // Creates "37_" instead of "37_property_tax_rate"
```

**Fix:** Must include full field name from schema lookup.

---

### 5. WRONG FIELD NUMBERS IN CLAUDE SONNET PROMPT

**File:** `api/property/search.ts`
**Lines:** 4092-4096

**Bug:** Prompt references fields 98-102 for utilities
**Reality:** Utilities are fields 104-110 per schema

**Fix:** Update PROMPT_CLAUDE_SONNET to use correct field numbers:
- 104_electric_provider (not 98)
- 105_electric_bill_monthly (not 99)
- 106_gas_provider (not 100)
- 107_water_bill_monthly (not 101)
- 108_sewer_provider (not 102)

---

### 6. ARBITRATION TIER BUGS

**File:** `api/property/arbitration.ts`

| Line | Issue | Fix |
|------|-------|-----|
| 308, 331 | Hardcoded `hasCitations: true` defeats confidence system | Pass actual citation status from source |
| 428 | Quorum voting only for tier 4, excludes tier 5 LLMs | Change to `field.tier >= 4` |
| 488 | Hallucination detection only for tier 4 | Change to `field.tier >= 4` |
| 537-539 | Audit trail mutation assumes single entry | Add field key at creation time, not after |

---

### 7. CONTRADICTORY PROMPT INSTRUCTIONS

**File:** `api/property/search.ts`

| Lines | Issue |
|-------|-------|
| 3770 | PROMPT_CLAUDE_OPUS says return `{ "value": null, "source": "Requires live data" }` |
| 3651 | JSON_RESPONSE_FORMAT says "NEVER return fields with null values" |

**Fix:** Make all prompts consistent - OMIT fields when data not found, never return null.

---

### 8. MISSING TRY-CATCH ON JSON.PARSE

**File:** `api/property/search.ts`
**Lines:** 2567, 2704, 2888, 3037, 3050

**Bug:** `JSON.parse()` calls without try-catch will crash on malformed JSON

**Fix:** Wrap all JSON.parse calls:
```typescript
try {
  const parsed = JSON.parse(jsonStr);
} catch (e) {
  console.error('JSON parse error:', e);
  return {};
}
```

---

### 9. TYPE MISMATCH IN SMART DEFAULTS

**File:** `api/property/search.ts`
**Line:** 5791

**Bug:** `smartDefaults: Record<string, any>` passed where `Record<string, FieldValue>` expected

**Fix:** Type the smartDefaults properly:
```typescript
const smartDefaults: Record<string, FieldValue> = {};
// When adding values:
smartDefaults['144_floor_number'] = {
  value: 'N/A (Single Family)',
  source: 'Backend Logic',
  confidence: 'High',
  tier: 1
};
```

---

### 10. INCOMPLETE CASCADE_ORDER IN RESPONSE

**File:** `api/property/search.ts`
**Line:** 5985

**Bug:** Response `cascade_order` is missing 5 Perplexity micro-prompts

**Fix:** Include all 15 LLM endpoints or derive from actual `llmCascade` array.

---

## MEDIUM PRIORITY FIXES

| File | Line | Issue |
|------|------|-------|
| search.ts | 59 | Comment says "336 entries (168 numbered + 168 unnumbered)" but schema has 181 fields |
| search.ts | 2848 vs 2904 | `tampaBayFiberCities` array duplicated with different entries |
| search.ts | 3157 | Model inconsistency: `sonar-pro` vs `sonar` |
| search.ts | 5458 | Prompt says "138 fields" but schema has 181 |
| arbitration.ts | 102 | Unknown sources default to tier 4 (should be tier 5) |
| arbitration.ts | 355 vs 428 | Inconsistent: conflict handling uses `>= 4`, quorum uses `=== 4` |
| geminiBatchWorker.ts | 26 | No validation that GEMINI_API_KEY exists |
| geminiConfig.ts | 70 | Instructions say `60_roof_permit_year`, schema has `60_roof_permit` |

---

## LOW PRIORITY FIXES (Code Quality)

- Multiple `console.log` statements in production code
- Magic numbers/strings should be constants
- Duplicate code patterns should be extracted to functions
- `any` types should be replaced with proper interfaces
- Empty catch blocks should log errors

---

## COMMITS ALREADY MADE THIS SESSION

| Commit | Description |
|--------|-------------|
| c6633b8 | Fixed critical try-catch structure bug (mismatched braces) |
| 2e18ec7 | Fixed Gemini double-nesting bug in LLM cascade |

---

## VERIFICATION CHECKLIST

Before deploying fixes, verify:

- [ ] All 181 fields in fields-schema.ts unchanged
- [ ] Field numbers match across all 7 files
- [ ] `npx ts-node scripts/verify-field-mapping.ts` passes
- [ ] Property search returns data (no 500 errors)
- [ ] No "// Required." garbage in responses
- [ ] All 15 LLMs in cascade complete without crash
- [ ] Gemini batch returns actual data (not schema descriptions)
- [ ] Arbitration correctly handles tier 4 AND tier 5 LLMs

---

## NEXT CONVERSATION COMMANDS

When starting a new conversation to continue this work:

1. **READ THIS FILE FIRST:** `D:/Clues_Quantum_Property_Dashboard/HANDOFF_AUDIT_FIXES_2026-01-04.md`

2. **FIX ALL CRITICAL BUGS** listed above in priority order

3. **CREATE UNIFIED FIELD MAP TABLE** comparing all 7 files

4. **RUN VERIFICATION:** `npx ts-node scripts/verify-field-mapping.ts`

5. **TEST PROPERTY SEARCH** with address: `1700 GULF BOULEVARD, BELLEAIR BEACH, Florida 33786`

6. **COMMIT AND PUSH** all fixes with descriptive commit messages

---

**END OF HANDOFF DOCUMENT**
