# 🎯 BATTLE PLAN: 181-Field Schema Audit

**Session Date**: 2026-01-12
**Mission**: Line-by-line audit of all 181 property fields
**Status**: Ready to start new session

---

## 📋 QUICK START

### **Step 1: Read These Documents (in order)**
1. `HANDOFF_181_FIELD_AUDIT_2026-01-12.md` - Full context and methodology
2. `CLAUDE.md` - Project instructions (token management, field mapping rules)
3. `FIELD_MAPPING_TRUTH.md` - Known field mapping issues

### **Step 2: Run Verification Script**
```bash
cd "D:\Clues_Quantum_Property_Dashboard"
npx ts-node scripts/verify-field-mapping.ts
```

### **Step 3: Start Priority Audit**
Focus on:
- ✅ High-velocity fields (1-47)
- ✅ Known problem fields (10, 17, 21, 35)
- ✅ Fields with missing data sources

---

## 🔥 PRIORITY FIELDS TO AUDIT FIRST

### **Group 2: Pricing & Value (10-16) - HIGHEST PRIORITY**
Known issues from CLAUDE.md:
- Field 10: listing_price (was incorrectly field 7)
- Fields 16a-16f: AVM subfields (Zestimate, Redfin, etc.)

### **Group 3: Property Basics (17-29) - HIGH PRIORITY**
Known issues from CLAUDE.md:
- Field 17: bedrooms (was incorrectly field 12)
- Field 21: living_sqft (was incorrectly field 16)

### **Group 4: HOA & Taxes (30-38) - HIGH PRIORITY**
Known issues from CLAUDE.md:
- Field 35: annual_taxes (was incorrectly field 29)

---

## 📁 KEY FILES (Quick Reference)

| File | Purpose | Line Count |
|------|---------|------------|
| `src/types/fields-schema.ts` | MASTER schema (SOURCE OF TRUTH) | ~3000 |
| `src/lib/field-normalizer.ts` | Backend field mapping | ~2500 |
| `src/pages/PropertyDetail.tsx` | Frontend field paths (lines 779-950) | ~2000 |
| `api/property/search.ts` | Main search + MLS | ~5500 |
| `api/property/free-apis.ts` | Tier 2 APIs | ~1200 |
| `api/property/multi-llm-forecast.ts` | Tier 4-5 LLMs | ~2000 |

---

## 🚨 RECENT FIXES (Don't Re-Fix These)

✅ **2026-01-12 Session Fixes**:
1. Tier hierarchy unified across 3 files (propertyStore.ts, arbitration.ts, data-sources.ts)
2. FREE_API_TIMEOUT: 30s → 60s (APIs need 42s to complete)
3. GPT-4o retry error handling now shows actual error messages
4. All changes committed to GitHub (commits: b4e207d, 1cb2ba9, 13d3b1a)

---

## 🎯 AUDIT CHECKLIST (Per Field)

For each of 181 fields, verify:
- [ ] Field number matches across all files
- [ ] Data sources identified (Tiers 1-5)
- [ ] Validation rules exist in cmaSchemas.ts
- [ ] UI path correct in PropertyDetail.tsx
- [ ] LLM prompts include this field
- [ ] No orphaned/dead fields

---

## 📊 PROGRESS TRACKING

Use TodoWrite tool to track progress:
```
- Audit Group 1: Address & Identity (1-9) - 9 fields
- Audit Group 2: Pricing & Value (10-16) - 13 fields (includes 16a-16f)
- Audit Group 3: Property Basics (17-29) - 13 fields
- Audit Group 4: HOA & Taxes (30-38) - 9 fields
... (continue for all 19 groups)
```

---

## 🔗 HANDOFF PROMPT (Copy/Paste to Start New Session)

```
I need to audit all 181 fields in the CLUES Property Dashboard schema line by line.

Please read these documents in order:
1. D:\Clues_Quantum_Property_Dashboard\HANDOFF_181_FIELD_AUDIT_2026-01-12.md
2. D:\Clues_Quantum_Property_Dashboard\CLAUDE.md
3. D:\Clues_Quantum_Property_Dashboard\FIELD_MAPPING_TRUTH.md

After reading, start the Priority Audit (Option B):
- Focus on high-velocity fields (1-47)
- Check known problem fields: 10, 17, 21, 35
- Identify fields with missing data sources

Use TodoWrite to track progress through all 181 fields.

Let's begin with Group 2 (Pricing & Value) since it has known issues.
```

---

**Ready to start new session! 🚀**
