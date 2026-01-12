# 🔍 HANDOFF: 181-Field Schema Line-by-Line Audit
**Date**: 2026-01-12
**Mission**: Audit every field in the 181-field schema for correctness, sources, validation, and data flow
**Previous Session**: Fixed tier hierarchy unification + timeout issues + GPT-4o error handling

---

## 📋 MISSION STATEMENT

Go through all 181 fields in the property schema **ONE BY ONE** and verify:
1. ✅ **Field Definition**: Number, key, display name, description match across all files
2. ✅ **Data Sources**: Which APIs/LLMs provide this field (Tier 1-5)
3. ✅ **Validation Rules**: Type, format, required status, constraints
4. ✅ **UI Display**: Correct rendering in PropertyDetail.tsx
5. ✅ **Field Mapping**: Matches between frontend/backend field paths
6. ✅ **Missing Sources**: Identify fields with NO data sources
7. ✅ **Conflicts**: Fields where multiple sources disagree

---

## 🗂️ KEY FILES FOR AUDIT

### **1. Schema Definition (SOURCE OF TRUTH)**
**File**: `src/types/fields-schema.ts`
**Purpose**: Defines all 181 fields with metadata
**Critical**: This is the MASTER definition - all other files must match

### **2. Backend Field Normalizer**
**File**: `src/lib/field-normalizer.ts`
**Purpose**: Maps API responses to numbered fields (1-181)
**Check**: Verify field numbers match fields-schema.ts

### **3. Frontend Field Mapping**
**File**: `src/pages/PropertyDetail.tsx` (lines 779-950)
**Purpose**: Maps numbered fields to property object paths
**Check**: Verify paths like `['details', 'bedrooms']` are correct

### **4. API Data Sources**
**Files**:
- `api/property/search.ts` - Main search with Stellar MLS + Free APIs
- `api/property/free-apis.ts` - Google, WalkScore, FEMA, Census, etc.
- `api/property/multi-llm-forecast.ts` - Perplexity, Gemini, GPT, Claude, Grok
- `api/property/retry-llm.ts` - Individual LLM retry handlers
- `api/property/tavily-search.ts` - Tavily web search

### **5. Validation Schemas**
**File**: `src/llm/validation/cmaSchemas.ts`
**Purpose**: Zod validation schemas for LLM responses
**Check**: Ensure all 181 fields have validation rules

---

## 🏗️ PROJECT ARCHITECTURE

### **Tier Hierarchy (Fixed 2026-01-12)**
```
TIER 1: Stellar MLS (highest authority)
  └─ 65 fields from Bridge MLS API
  └─ Backend calculations (derived fields)

TIER 2: All APIs (Google, WalkScore, FEMA, Census, NOAA, USGS, EPA, etc.)
  └─ 54 fields from free APIs
  └─ Timeout: 60s (INCREASED from 30s on 2026-01-12)

TIER 3: Tavily Web Search
  └─ Targeted searches for specific fields
  └─ Timeout: 30s

TIER 4: Web-Search LLMs (Perplexity, Gemini, GPT-4o, Claude Sonnet, Grok)
  └─ Web evidence mode for missing fields
  └─ Timeout: 60s (Perplexity: 45s)

TIER 5: Claude Opus (NO web search)
  └─ Deep reasoning for complex fields
  └─ Timeout: 60s

TIER 6: Manual Entry (frontend only)
  └─ User edits via UI
```

### **Arbitration Rules**
- Lower tiers can ONLY fill empty fields
- Lower tiers CANNOT overwrite higher tiers
- Conflicts = SAME tier sources disagree
- Recent fix: Frontend tier hierarchy NOW matches backend (3 files updated)

---

## 📊 181-FIELD SCHEMA STRUCTURE

### **HIGH-VELOCITY FIELDS (1-47)** - Most Critical
**Group 1: Address & Identity (1-9)**
- 1_full_address, 2_mls_primary, 3_new_construction_yn, 4_listing_status, 5_listing_date, 6_neighborhood, 7_county, 8_zip_code, 9_parcel_id

**Group 2: Pricing & Value (10-16)**
- 10_listing_price, 11_price_per_sqft, 12_market_value_estimate, 13_last_sale_date, 14_last_sale_price, 15_assessed_value, 16_avms
- **Subfields**: 16a_zestimate, 16b_redfin_estimate, 16c_first_american_avm, 16d_quantarium_avm, 16e_ice_avm, 16f_collateral_analytics_avm

**Group 3: Property Basics (17-29)**
- 17_bedrooms, 18_full_bathrooms, 19_half_bathrooms, 20_total_bathrooms, 21_living_sqft, 22_total_sqft_under_roof, 23_lot_size_sqft, 24_lot_size_acres, 25_year_built, 26_property_type, 27_stories, 28_garage_spaces, 29_parking_total

**Group 4: HOA & Taxes (30-38)**
- 30_hoa_yn, 31_hoa_fee_annual, 32_hoa_name, 33_hoa_includes, 34_ownership_type, 35_annual_taxes, 36_tax_year, 37_property_tax_rate, 38_tax_exemptions

**Group 5: Structure & Systems (39-48)**
- 39_roof_type, 40_roof_age_est, 41_exterior_material, 42_foundation, 43_water_heater_type, 44_garage_type, 45_hvac_type, 46_hvac_age, 47_laundry_type, 48_interior_condition

### **STANDARD FIELDS (49-181)** - Important but Lower Priority
**Group 6: Interior Features (49-53)**
**Group 7: Exterior Features (54-58)**
**Group 8: Permits & Renovations (59-62)**
**Group 9: Assigned Schools (63-73)**
**Group 10: Crime & Safety (74-80)**
**Group 11: Transportation & Access (81-84)**
**Group 12: Demographics (85-90)**
**Group 13: Market Metrics (91-102)**
**Group 14: Utilities & Services (103-114)**
**Group 15: Environmental (115-131)**
**Group 16: Zoning & Land Use (132-143)**
**Group 17: Investment Metrics (144-158)**
**Group 18: Neighborhood Trends (159-174)**
**Group 19: Additional Market Data (175-181)**

---

## 🔧 AUDIT METHODOLOGY

### **Step-by-Step Process for Each Field**

#### **1. Read Field Definition from fields-schema.ts**
```bash
grep -A 10 "id: '[FIELD_KEY]'" src/types/fields-schema.ts
```

#### **2. Verify Field Number Consistency**
Check these files have matching field numbers:
- `src/lib/field-normalizer.ts` - Backend mapping
- `src/pages/PropertyDetail.tsx` - Frontend paths
- `api/property/search.ts` - Comments/docs

#### **3. Identify Data Sources**
Search for field key across all API files:
```bash
grep -r "[FIELD_KEY]" api/property/*.ts
grep -r "[FIELD_KEY]" src/lib/normalizations/*.ts
```

#### **4. Check Validation Rules**
```bash
grep "[FIELD_KEY]" src/llm/validation/cmaSchemas.ts
```

#### **5. Verify UI Rendering**
Check PropertyDetail.tsx for field path mapping:
```typescript
'[FIELD_NUMBER]_[FIELD_KEY]': ['section', 'propertyName']
```

#### **6. Test Data Flow**
- Does Stellar MLS provide this? (Tier 1)
- Do APIs provide this? (Tier 2)
- Does Tavily search for this? (Tier 3)
- Do LLMs populate this? (Tier 4-5)

#### **7. Document Issues**
For each field, note:
- ❌ Missing data sources
- ❌ Incorrect field numbers
- ❌ Wrong validation rules
- ❌ Broken UI paths
- ❌ No LLM prompts for this field

---

## 🚨 KNOWN ISSUES FROM PREVIOUS SESSION

### **✅ FIXED Issues (2026-01-12)**
1. ✅ **Tier Hierarchy Mismatch** - Frontend tier assignments NOW match backend
2. ✅ **54 Lost API Fields** - FREE_API_TIMEOUT increased from 30s to 60s
3. ✅ **GPT-4o Error Handling** - Now shows actual error messages instead of "Error calling GPT API"

### **⚠️ UNRESOLVED Issues (May Affect Audit)**
1. ⚠️ **User Still Seeing "No Data" for APIs** - User hasn't deployed updated code yet
2. ⚠️ **Field Mapping Bugs** - Per CLAUDE.md, field mapping has recurring issues:
   - Field 10 = listing_price (NOT field 7)
   - Field 17 = bedrooms (NOT field 12)
   - Field 21 = living_sqft (NOT field 16)
   - Field 35 = annual_taxes (NOT field 29)

---

## 📁 PROJECT STRUCTURE

```
D:\Clues_Quantum_Property_Dashboard\
│
├── api/
│   └── property/
│       ├── search.ts                    # Main search endpoint (Stellar MLS + APIs)
│       ├── free-apis.ts                 # Tier 2 APIs (Google, WalkScore, etc.)
│       ├── multi-llm-forecast.ts        # Tier 4-5 LLMs (parallel execution)
│       ├── retry-llm.ts                 # Individual LLM retry (GPT, Gemini, etc.)
│       ├── tavily-search.ts             # Tier 3 web search
│       ├── parse-mls-pdf.ts             # MLS PDF parser (Stellar Bridge)
│       └── arbitration.ts               # Backend tier hierarchy (SOURCE OF TRUTH)
│
├── src/
│   ├── types/
│   │   └── fields-schema.ts             # 181-field schema definition (MASTER)
│   │
│   ├── lib/
│   │   ├── field-normalizer.ts          # Maps API → numbered fields
│   │   ├── arbitration.ts               # Frontend tier hierarchy (FIXED 2026-01-12)
│   │   ├── data-sources.ts              # UI progress display (FIXED 2026-01-12)
│   │   └── normalizations/
│   │       ├── high-value-sections.ts   # High-priority field mappings
│   │       └── remaining-sections.ts    # Standard field mappings
│   │
│   ├── llm/validation/
│   │   └── cmaSchemas.ts                # Zod validation for LLM responses
│   │
│   ├── store/
│   │   └── propertyStore.ts             # SOURCE_TIERS (FIXED 2026-01-12)
│   │
│   └── pages/
│       └── PropertyDetail.tsx           # Field rendering + retry buttons
│
├── scripts/
│   └── verify-field-mapping.ts          # Field mapping verification script
│
└── md-files/
    ├── FIELD_MAPPING_TRUTH.md           # Field mapping documentation
    ├── TIER_UNIFICATION_FIX_2026-01-12.md
    └── TIMEOUT_FIX_2026-01-12.md
```

---

## 🎯 AUDIT GOALS

### **Primary Objectives**
1. ✅ Verify all 181 fields have correct numbers across all files
2. ✅ Identify fields with NO data sources (dead fields)
3. ✅ Confirm all high-velocity fields (1-47) have multiple sources
4. ✅ Check validation rules exist for all fields
5. ✅ Verify UI paths are correct for rendering

### **Secondary Objectives**
6. ✅ Document which APIs provide which fields
7. ✅ Identify fields where LLMs should search but don't
8. ✅ Find fields where prompts are missing/incomplete
9. ✅ Check for duplicate field definitions
10. ✅ Verify field display names match between files

---

## 🔍 VERIFICATION COMMANDS

### **Run Field Mapping Verification Script**
```bash
cd "D:\Clues_Quantum_Property_Dashboard"
npx ts-node scripts/verify-field-mapping.ts
```

### **Search for Specific Field**
```bash
# Find field definition
grep -A 5 "id: '17_bedrooms'" src/types/fields-schema.ts

# Find all references
grep -r "17_bedrooms" api/ src/

# Check field number consistency
grep "field 17" api/property/*.ts src/lib/*.ts
grep "'17_" src/pages/PropertyDetail.tsx
```

### **Count Fields in Each File**
```bash
# Count in schema
grep "id: '[0-9]" src/types/fields-schema.ts | wc -l

# Count in field-normalizer
grep "field [0-9]" src/lib/field-normalizer.ts | wc -l

# Count in PropertyDetail paths
grep "'[0-9]*_" src/pages/PropertyDetail.tsx | wc -l
```

---

## 🚀 STARTING THE AUDIT

### **Recommended Approach**

**Option A: Sequential Audit (Slow but Thorough)**
- Start with field 1_full_address
- Work through all 181 fields in order
- Document issues as you go
- Create fix list at the end

**Option B: Priority Audit (Fast, High-Impact)**
1. Audit high-velocity fields (1-47) first
2. Check fields with known issues (10, 17, 21, 35)
3. Scan remaining fields (48-181) for obvious errors
4. Deep-dive problem areas

**Option C: Source-Based Audit (Efficient)**
1. Audit Stellar MLS fields (Tier 1) - ~65 fields
2. Audit API-provided fields (Tier 2) - ~54 fields
3. Audit LLM-searchable fields (Tier 4-5) - ~60 fields
4. Identify orphan fields with NO sources

### **Suggested First Actions**
1. Read `FIELD_MAPPING_TRUTH.md` to understand known issues
2. Run `npx ts-node scripts/verify-field-mapping.ts`
3. Review console output for mismatches
4. Start with high-velocity Group 2 (Pricing & Value) since CLAUDE.md mentions field 10, 17, 21, 35 issues

---

## 📝 OUTPUT FORMAT

For each field audited, document:

```markdown
### Field [NUMBER]_[KEY]

**Definition**: [Display name from fields-schema.ts]
**Type**: [string/number/boolean/Date]
**Group**: [1-19]
**Priority**: [High-Velocity / Standard]

**Data Sources**:
- ✅ Tier 1 (Stellar MLS): [Yes/No] - [Source location]
- ✅ Tier 2 (APIs): [API names] - [Source location]
- ✅ Tier 3 (Tavily): [Yes/No] - [Source location]
- ✅ Tier 4-5 (LLMs): [LLM names] - [Source location]

**Validation**: ✅ Present in cmaSchemas.ts | ❌ Missing

**UI Path**: `['section', 'propertyName']` - ✅ Correct | ❌ Wrong

**Issues**:
- ❌ [Describe any problems found]

**Fix Required**: [Yes/No] - [Description of fix]

---
```

---

## 🛠️ TOOLS FOR AUDIT

### **VS Code Extensions Recommended**
- Multi-File Search (Ctrl+Shift+F)
- GitLens (for file history)
- Better Comments (for issue tracking)

### **Terminal Commands**
```bash
# Quick field search
grep -rn "FIELD_KEY" api/ src/

# Check field count per file
wc -l src/types/fields-schema.ts
wc -l src/lib/field-normalizer.ts

# Find TODO comments in code
grep -r "TODO" api/ src/
grep -r "FIXME" api/ src/
grep -r "BUG" api/ src/
```

---

## 💡 TIPS FOR NEW CLAUDE SESSION

1. **ALWAYS read this handoff document first**
2. **ALWAYS check CLAUDE.md for project-specific rules**
3. **ALWAYS read FIELD_MAPPING_TRUTH.md before any field work**
4. **DO NOT change fields-schema.ts** - it's the SOURCE OF TRUTH
5. **DO verify verification script before manual checks**
6. **DO use TodoWrite tool to track audit progress**
7. **DO commit fixes incrementally (not one giant commit)**
8. **DO test PropertyDetail display after fixes**

---

## 🔗 RELATED DOCUMENTS

- `FIELD_MAPPING_TRUTH.md` - Field mapping rules and known issues
- `TIER_UNIFICATION_FIX_2026-01-12.md` - Recent tier hierarchy fix
- `TIMEOUT_FIX_2026-01-12.md` - Recent timeout fix
- `CLAUDE.md` - Project instructions and token management

---

## 📊 CURRENT STATUS

**Codebase State**: ✅ All tier hierarchy fixes committed and pushed to GitHub
**Last Commit**: `1cb2ba9` - Fix GPT-4o retry error handling
**Branch**: `main`
**Remote**: https://github.com/johndesautels1/clues-property-search.git

**Recent Fixes (2026-01-12)**:
- ✅ 3 files updated: propertyStore.ts, arbitration.ts, data-sources.ts
- ✅ FREE_API_TIMEOUT: 30s → 60s
- ✅ GPT-4o error handling: Shows actual error messages
- ✅ 4 commits pushed to GitHub

**Ready for Audit**: ✅ Yes - All prerequisite fixes complete

---

## 🎬 HANDOFF PROMPT FOR NEW SESSION

Copy/paste this prompt when starting the new conversation:

```
I need to audit all 181 fields in the CLUES Property Dashboard schema line by line.

Please read the handoff document at:
D:\Clues_Quantum_Property_Dashboard\HANDOFF_181_FIELD_AUDIT_2026-01-12.md

Then read the project instructions at:
D:\Clues_Quantum_Property_Dashboard\CLAUDE.md

And read the field mapping truth document at:
D:\Clues_Quantum_Property_Dashboard\FIELD_MAPPING_TRUTH.md

After reading all three documents, let's start the audit using Option B: Priority Audit approach. Focus on:
1. High-velocity fields (1-47) first
2. Known problematic fields: 10, 17, 21, 35
3. Fields with missing data sources

For each field, verify:
- Field number consistency across all files
- Data sources (which APIs/LLMs provide it)
- Validation rules exist
- UI path mapping is correct
- No orphaned fields

Use the TodoWrite tool to track progress through all 181 fields.

Let's begin!
```

---

**END OF HANDOFF DOCUMENT**
