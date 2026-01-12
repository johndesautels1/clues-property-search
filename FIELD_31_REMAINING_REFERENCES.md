# 🔍 FIELD 31 REMAINING REFERENCES ANALYSIS

**Date**: 2026-01-12
**Total References Found**: 26 locations across 13 files

---

## 📊 CATEGORIZATION

### ✅ INTENTIONAL (Backward Compatibility) - 8 references

**These should KEEP the old name for backward compatibility:**

1. **search.ts:310** - Back-compat alias in FIELD_TYPES
   ```typescript
   '31_hoa_fee_annual': 'currency', 'hoa_fee_annual': 'currency',
   ```
   ✅ **KEEP** - Allows old API responses to work

2. **retry-llm.ts:188** - Already fixed with alias
   ```typescript
   '31_association_fee': 'currency', 'hoa_fee_annual': 'currency',
   ```
   ✅ **KEEP** - Already has canonical name first

3. **field-normalizer.ts:70** - Intentional alias mapping
   ```typescript
   "31_hoa_fee_annual": "31_association_fee",
   ```
   ✅ **KEEP** - This IS the backward compatibility mechanism

4-8. **field-map-flat-to-numbered.ts** - Legacy name mappings
   ```typescript
   'hoa_fee_annual': '31_hoa_fee_annual',
   'hoa_fee': '31_hoa_fee_annual',
   'hoa_fee_monthly': '31_hoa_fee_annual',
   ```
   ✅ **KEEP** - Needed for CSV import backward compatibility

---

### 📝 COMMENTS/DOCUMENTATION - 7 references

**These are in comments or documentation strings:**

9-10. **search.ts** - In LLM prompt comments
11. **field-normalizer.ts** - Comment explaining fix
12. **AddProperty.tsx** - Comment explaining backward compatibility

✅ **KEEP** - Documentation is helpful

---

### ⚠️ NEEDS REVIEW - 11 references

**These may need updating:**

#### HIGH PRIORITY (User-Facing)

**13. PropertyDetail.tsx:line ~2100** - Field ID for retry button
```typescript
{renderDataField("HOA Fee (Annual)", ..., "31_hoa_fee_annual")}
```
❌ **SHOULD FIX** - UI should use canonical field ID

**14. stellar-mls.ts** - MLS API field mapping
```typescript
'AssociationFee': '31_hoa_fee_annual',
```
❌ **SHOULD FIX** - Source data should map to canonical name

**15. perplexity-prompts.ts** - Perplexity field mapping
```typescript
'hoa_fee_annual': '31_hoa_fee_annual',
```
❌ **SHOULD FIX** - LLM should return canonical name

#### MEDIUM PRIORITY (Internal Types)

**16. calculate-derived-fields.ts** - TypeScript interface
```typescript
field_31_hoa_fee_annual?: number;
```
⚠️ **CONSIDER FIXING** - Internal type definition

**17. field-mapping.ts** - CSV header definition
```typescript
apiKey: '31_hoa_fee_annual'
```
⚠️ **CONSIDER FIXING** - CSV export uses this

**18. cmaSchemas.ts** - Zod validation schema
```typescript
'31_hoa_fee_annual': currencyField(0, 100000),
```
⚠️ **CONSIDER FIXING** - Validation should use canonical

**19. geminiZodSchemas.ts** - Gemini validation
```typescript
'31_hoa_fee_annual': currencyNumber.pipe(...)
```
⚠️ **CONSIDER FIXING** - Validation should use canonical

**20. field-normalizer.ts:line ~417** - Perplexity translation
```typescript
'hoa_taxes_hoa_fee_monthly': '31_hoa_fee_annual',
```
⚠️ **CONSIDER FIXING** - Should translate to canonical

#### LOW PRIORITY (Tests/Dev)

**21. parse-mls-pdf.ts** - Conditional logic
```typescript
if (schemaKey === '31_hoa_fee_annual') {
```
⚠️ **CONSIDER FIXING** - PDF parser should use canonical

**22-23. test-csv-validator.ts** - Test file
**24-25. tests/shared-modules.test.ts** - Unit tests
⚠️ **UPDATE TESTS** - Should test both old and new names

---

## 🔧 RECOMMENDED FIXES

### Priority 1: USER-FACING (MUST FIX)

#### 1. PropertyDetail.tsx - Retry Button Field ID
**Current**:
```typescript
{renderDataField("HOA Fee (Annual)", fullProperty.details.hoaFeeAnnual, "currency", undefined, "31_hoa_fee_annual")}
```

**Should be**:
```typescript
{renderDataField("HOA Fee (Annual)", fullProperty.details.hoaFeeAnnual, "currency", undefined, "31_association_fee")}
```

**Impact**: Retry buttons use field ID to identify which field to retry

---

#### 2. stellar-mls.ts - MLS API Mapping
**Current**:
```typescript
'AssociationFee': '31_hoa_fee_annual',
```

**Should be**:
```typescript
'AssociationFee': '31_association_fee',
```

**Impact**: Raw MLS data gets mapped with old field name, then normalized later

---

#### 3. perplexity-prompts.ts - LLM Response Mapping
**Current**:
```typescript
'hoa_fee_annual': '31_hoa_fee_annual',
```

**Should be**:
```typescript
'hoa_fee_annual': '31_association_fee',
```

**Impact**: Perplexity responses use old field name, then normalized later

---

### Priority 2: INTERNAL CONSISTENCY (SHOULD FIX)

#### 4. cmaSchemas.ts - LLM Validation
Add both field names to schema:
```typescript
'31_association_fee': currencyField(0, 100000),
'31_hoa_fee_annual': currencyField(0, 100000), // Backward compat
```

#### 5. geminiZodSchemas.ts - Gemini Validation
Add both field names to schema

#### 6. field-mapping.ts - CSV Export
Update apiKey to canonical name

#### 7. calculate-derived-fields.ts - TypeScript Interface
Update field name in interface

---

### Priority 3: TESTS (OPTIONAL)

#### 8. Update test files
- test-csv-validator.ts
- tests/shared-modules.test.ts

Add tests for both old and new field names

---

## 📊 SUMMARY

| Category | Count | Action |
|----------|-------|--------|
| Backward Compat (Keep) | 8 | ✅ No changes needed |
| Comments/Docs (Keep) | 7 | ✅ No changes needed |
| User-Facing (Must Fix) | 3 | ❌ **Fix immediately** |
| Internal (Should Fix) | 5 | ⚠️ Fix for consistency |
| Tests (Optional) | 3 | ⚠️ Update tests |

**Total to Keep**: 15 references (intentional)
**Total to Fix**: 11 references (8 recommended)

---

## 🎯 RECOMMENDATION

**Fix the 3 HIGH PRIORITY items** to ensure:
1. UI retry buttons work with correct field ID
2. MLS data uses canonical field name from source
3. LLM responses use canonical field name

**The backward-compatibility mechanisms are working correctly** - we have:
- Alias mapping in field-normalizer.ts
- Back-compat in FIELD_TYPES
- Legacy name support in flat-to-numbered maps

This means old data/APIs will continue to work while new data uses the canonical name.

---

**End of Analysis**
