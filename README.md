# CLUES Property Dashboard

168-Field Real Estate Intelligence Platform built for the CLUES Quantum Master App.

---

# ⚠️ CRITICAL: CODEBASE IS FUNDAMENTALLY BROKEN ⚠️

**Audit Date: 2025-11-30**

## TOTAL ERRORS FOUND: 1,300+

| Category | Count | Severity |
|----------|-------|----------|
| Field Number Mismatches | 1,122 | CRITICAL |
| Wrong Comments in property.ts | 130 | MAJOR |
| Missing fieldKey Props | 167 | CRITICAL |
| Missing 3rd Party Mappings | 4 | CRITICAL |
| Missing UI Buttons | 2 | CRITICAL |
| Stub/Non-functional Code | 2 | CRITICAL |
| Duplicate Codebase | 1 | MAJOR |
| Data Stacking Broken | 1 | CRITICAL |

---

# 📊 5-AGENT DEEP AUDIT RESULTS (2025-12-01)

**OVERALL CODEBASE GRADE: 71% (C)**

This audit was performed by 5 specialized AI agents examining every line of code.

## Agent Scores Summary

| Agent | Area | Score | Grade |
|-------|------|-------|-------|
| 1. Schema-API Matching | Field synchronization | 98% | A |
| 2. Upload Methods | Data mapping coverage | 55% | D |
| 3. Code Quality | Error handling, security | 62% | D |
| 4. Maintainability | Duplication, clarity | 62% | D |
| 5. Style Consistency | Language patterns | 78% | B- |

---

## 🚨 10 CRITICAL ISSUES IDENTIFIED

### CRITICAL BUG #1: HOA Fee Conversion Missing
**Location:** `api/property/search-stream.ts:128`
```typescript
'hoa_fee_monthly': '31_hoa_fee_annual', // Will need conversion
```
**Problem:** Monthly HOA fees are mapped to annual field WITHOUT multiplying by 12.
**Impact:** All HOA fee data is incorrect (showing 1/12 of actual annual cost).
**Status:** ❌ UNFIXED

### CRITICAL BUG #2: JSON.parse Without Try-Catch (5+ locations)
**Locations:**
- `api/property/search-stream.ts:523`
- `api/property/search-stream.ts:587`
- `api/property/retry-llm.ts:303`
- `api/property/retry-llm.ts:356`
- `api/property/retry-llm.ts:486`

**Problem:** JSON.parse() called without error handling - will crash on malformed LLM responses.
**Status:** ❌ UNFIXED

### CRITICAL BUG #3: No Input Sanitization
**Location:** `api/property/search-stream.ts`, `api/property/search.ts`
**Problem:** Address parameter passed directly to LLM prompts without sanitization.
**Risk:** Prompt injection attacks possible.
**Status:** ❌ UNFIXED

### HIGH PRIORITY #4: 500+ Lines Duplicate LLM Code
**Files with duplicated LLM functions:**
- `api/property/search.ts` (~300 lines)
- `api/property/search-stream.ts` (~300 lines)
- `api/property/retry-llm.ts` (~300 lines)

**Problem:** Same LLM call functions (callPerplexity, callGrok, callClaudeOpus, etc.) copied across 3 files.
**Impact:** Bugs must be fixed in 3 places; inconsistencies between implementations.
**Status:** ❌ UNFIXED

### HIGH PRIORITY #5: Streaming Error Handling Incomplete
**Location:** `api/property/search-stream.ts`
**Problem:** SSE errors don't properly close connections; client may hang.
**Status:** ❌ UNFIXED

### MEDIUM #6: Null Check Missing on Nested Access
**Location:** Multiple files
**Problem:** Accessing `data.choices?.[0]?.message?.content` but then using `data.error` without null check.
**Status:** ❌ UNFIXED

### MEDIUM #7: Upload Method Coverage Gaps
| Method | Fields Covered | % of 168 |
|--------|---------------|----------|
| Manual Entry | 50 | 30% |
| CSV Upload | 168 | 100% |
| PDF Upload | 90 | 54% |
| LLM Search | 130 | 77% |

**Problem:** Manual Entry form only covers 50 of 168 fields.
**Status:** ❌ UNFIXED

### MEDIUM #8: FLAT_TO_NUMBERED_FIELD_MAP Duplicated
**Problem:** This mapping object exists in both `search-stream.ts` and `retry-llm.ts` separately.
**Risk:** Maps can drift out of sync.
**Status:** ❌ UNFIXED

### LOW #9: Type Coercion Missing
**Problem:** LLM may return "3" (string) for bedrooms instead of 3 (number).
**Status:** ❌ UNFIXED

### LOW #10: Inconsistent Error Response Format
**Problem:** Some endpoints return `{ error: string }`, others return `{ success: false, message: string }`.
**Status:** ❌ UNFIXED

---

## Agent 1: Schema-API Matching Report

**Score: 98% (A)**

After the field synchronization fix (commit f70ebc4), 1,401 field references now correctly match `fields-schema.ts`.

✅ Verified correct:
- `src/lib/field-normalizer.ts` - 168 field mappings
- `src/lib/field-mapping.ts` - 168 field definitions
- `api/property/search-stream.ts` - 253 field references
- `api/property/retry-llm.ts` - 254 field references
- `api/property/enrich.ts` - 12 field references
- `api/property/search.ts` - 156 field references
- `api/property/parse-mls-pdf.ts` - 168 field mappings
- `src/types/property.ts` - 168 comments
- `api/property/stellar-mls.ts` - 54 field mappings

⚠️ Remaining risk: The `app/` directory (631 errors) was NOT fixed and should be deleted.

---

## Agent 2: Upload Methods Analysis

**Score: 55% (D)**

| Input Method | Files | Field Coverage | Data Quality |
|-------------|-------|----------------|--------------|
| Manual Entry | AddProperty.tsx | 50/168 (30%) | User-dependent |
| CSV Upload | AddProperty.tsx | 168/168 (100%) | File-dependent |
| PDF Upload | parse-mls-pdf.ts | 90/168 (54%) | MLS-dependent |
| URL Search | search-stream.ts | 130/168 (77%) | LLM-dependent |
| Enrich APIs | enrich.ts | 12/168 (7%) | API-dependent |

**Critical Gap:** Manual entry form doesn't cover fields 59-62, 91-103, 117-130, 139-168.

---

## Agent 3: Code Quality Analysis

**Score: 62/100 (D)**

| Category | Score | Issues |
|----------|-------|--------|
| Error Handling | 45/100 | JSON.parse unprotected, SSE errors unhandled |
| Security | 50/100 | No input sanitization for LLM prompts |
| Type Safety | 70/100 | Missing type coercion on LLM responses |
| Null Safety | 65/100 | Optional chaining inconsistent |
| API Design | 75/100 | Inconsistent error response formats |

---

## Agent 4: Maintainability Analysis

**Score: 62% (D)**

| Metric | Value | Assessment |
|--------|-------|------------|
| Code Duplication | 500+ lines | CRITICAL - 3 files with same LLM code |
| Function Length | 100+ lines avg | POOR - Functions too long |
| Comment Quality | 30% | POOR - Many outdated comments |
| Module Cohesion | 60% | FAIR - Some god-objects |
| Coupling | 70% | FAIR - Reasonable dependency structure |

**Duplicated Code Locations:**
1. `search.ts:callPerplexity()` ≈ `search-stream.ts:callPerplexity()` ≈ `retry-llm.ts:callPerplexity()`
2. `search.ts:callGrok()` ≈ `search-stream.ts:callGrok()` ≈ `retry-llm.ts:callGrok()`
3. `search.ts:callClaudeOpus()` ≈ `search-stream.ts:callClaudeOpus()` ≈ `retry-llm.ts:callClaudeOpus()`
4. (Same pattern for: GPT, Gemini functions)

---

## Agent 5: Style Consistency Analysis

**Score: 78% (B-)**

| Pattern | Consistency | Notes |
|---------|-------------|-------|
| Import style | 90% | Mix of default/named imports |
| Error handling | 60% | try-catch vs .catch() inconsistent |
| Async patterns | 85% | Mostly async/await |
| Naming conventions | 80% | Mix of camelCase and snake_case |
| Response formats | 65% | Inconsistent API response shapes |

---

## RECOMMENDED FIX PRIORITY

1. **IMMEDIATE:** Fix HOA fee conversion bug (2 lines of code)
2. **IMMEDIATE:** Wrap all JSON.parse in try-catch (10 locations)
3. **HIGH:** Add input sanitization for LLM prompts
4. **HIGH:** Extract LLM functions to shared module
5. **MEDIUM:** Expand Manual Entry form to 168 fields
6. **MEDIUM:** Standardize error response format
7. **LOW:** Add type coercion to LLM responses

---

## AUDIT METHODOLOGY

Each agent performed:
- Full codebase read (all .ts, .tsx files)
- Pattern matching against fields-schema.ts
- Security vulnerability scanning
- Duplication detection
- Style consistency analysis

**Total lines analyzed:** ~25,000
**Total files examined:** 47
**Audit duration:** 5 parallel agents

---

## THE CORE PROBLEM

The codebase uses TWO DIFFERENT field numbering schemes:

**Schema (fields-schema.ts) - THE TRUTH:**
- 10 = listing_price
- 17 = bedrooms
- 21 = living_sqft
- 35 = annual_taxes

**API/Frontend files - WRONG:**
- 7 = listing_price
- 12 = bedrooms
- 16 = living_sqft
- 29 = annual_taxes

**This means EVERY data flow is broken:**
- ❌ LLM data maps to wrong fields
- ❌ API data maps to wrong fields
- ❌ PropertyDetail displays wrong data
- ❌ Data merging doesn't work
- ❌ The entire application is broken

## FILES WITH FIELD NUMBER ERRORS

### Main Codebase (491 errors):
| File | Errors |
|------|--------|
| api/property/search-stream.ts | 133 |
| api/property/retry-llm.ts | 133 |
| src/lib/field-mapping.ts | 88 |
| src/pages/AddProperty.tsx | 73 |
| api/property/stellar-mls.ts | 36 |
| api/property/free-apis.ts | 13 |
| api/property/enrich.ts | 9 |
| api/property/search.ts | 6 |

### App Directory (631 errors):
| File | Errors |
|------|--------|
| app/src/pages/AddProperty.tsx | 303 |
| app/src/lib/field-mapping.ts | 88 |
| app/src/pages/PropertyDetail.tsx | 83 |
| app/api/property/scrapers.ts | 62 |
| app/api/property/search.ts | 45 |
| app/api/property/scrape-realtor.ts | 28 |
| + more | ... |

## VERIFICATION SCRIPTS

```bash
cd D:\Clues_Quantum_Property_Dashboard

# Run full field audit (shows 491 errors)
node scripts/master-audit.cjs

# Run app directory audit (shows 631 errors)
node scripts/audit-app-dir.cjs

# Run comment audit (shows 130 errors)
node scripts/audit-comments.cjs
```

## FULL AUDIT REPORT

See: `AUDIT_FAILURES.md`

---

## OTHER CRITICAL ISSUES

### 1. Duplicate Codebase
There are TWO codebases that differ:
- `src/` - Main source
- `app/` - Different code

### 2. Missing 3rd Party Field Mappings
| Source | Status |
|--------|--------|
| Zillow | MISSING |
| Redfin | MISSING |
| Realtor | MISSING |
| Trulia | NOT SUPPORTED |

### 3. Stellar MLS API is a STUB
File `api/property/stellar-mls.ts` line 2 says "Stub" - it returns errors, not data.

### 4. No Web Scrapers
URL mode relies entirely on LLM guessing. No actual scrapers exist.

### 5. Missing fieldKey Props (167)
Only 1 of 168 fields has the `fieldKey` prop needed for retry buttons.

### 6. Missing Enrich Buttons
PDF upload has no "Enrich with APIs" button (CSV does).

### 7. Data Stacking Broken
PDF import saves and STOPS. No connection to enrichment.

---

## DO NOT TRUST PREVIOUS CLAIMS

The section below claiming "Field Mapping Corrections" with "0 errors" was **FALSE**.

The verification script only checks 3 files. There are 20+ files with field numbers, and 1,122 of them are wrong.

---

## FIXES REQUIRED

### Priority 1: Fix all 1,122 field number mismatches
Every numbered field in every file must match `fields-schema.ts`.

### Priority 2: Eliminate duplicate codebase
Delete `app/` or merge into `src/`.

### Priority 3: Add missing features
- Zillow/Redfin/Realtor field mappings
- fieldKey props for all 168 fields
- Enrich buttons in PDF UI
- Actual Stellar MLS integration
- Web scrapers

### Priority 4: Fix data stacking
Connect PDF import to enrichment flow.

---

---

# ORIGINAL README (FOR REFERENCE - CONTAINS FALSE CLAIMS)

---

## Instructions for Claude Code / AI Assistants

### ALL API KEYS ARE CONFIGURED IN VERCEL

**DO NOT ask about API keys. They are ALL set up and working in Vercel.**

| Service | Environment Variable | Status |
|---------|---------------------|--------|
| Google Maps | `GOOGLE_MAPS_API_KEY` | **CONFIGURED** |
| WalkScore | `WALKSCORE_API_KEY` | **CONFIGURED** |
| AirNow | `AIRNOW_API_KEY` | **CONFIGURED** |
| HowLoud | `HOWLOUD_API_KEY` | **CONFIGURED** |
| Weather.com | `WEATHERCOM_API_KEY` | **CONFIGURED** |
| FBI Crime | `FBI_CRIME_API_KEY` | **CONFIGURED** |
| SchoolDigger | `SCHOOLDIGGER_APP_ID` + `SCHOOLDIGGER_API_KEY` | **CONFIGURED** |
| Anthropic | `ANTHROPIC_API_KEY` | **CONFIGURED** |
| OpenAI | `OPENAI_API_KEY` | **CONFIGURED** |
| Perplexity | `PERPLEXITY_API_KEY` | **CONFIGURED** |
| Google AI | `GOOGLE_AI_API_KEY` | **CONFIGURED** |
| xAI/Grok | `XAI_API_KEY` | **CONFIGURED** |
| FEMA Flood | (no key needed) | **WORKING** |

---

## 168-Field Schema

The source of truth is: `src/types/fields-schema.ts`

### Field Number Ranges

| Group | Fields | Description |
|-------|--------|-------------|
| 1-9 | Address & Identity | Full address, MLS#, status, parcel ID |
| 10-16 | Pricing & Value | List price, estimates, sale history |
| 17-29 | Property Basics | Beds, baths, sqft, year, type |
| 30-38 | HOA & Taxes | HOA fees, taxes, ownership |
| 39-48 | Structure & Systems | Roof, HVAC, foundation |
| 49-53 | Interior Features | Flooring, kitchen, appliances |
| 54-58 | Exterior Features | Pool, deck, fence |
| 59-62 | Permits & Renovations | Permit history |
| 63-73 | Schools | District, elementary, middle, high |
| 74-82 | Location Scores | Walk/Transit/Bike, noise, safety |
| 83-87 | Distances | Grocery, hospital, airport, beach |
| 88-90 | Safety & Crime | Crime indexes |
| 91-103 | Market & Investment | Cap rate, rental yield, comps |
| 104-116 | Utilities | Electric, water, internet |
| 117-130 | Environment & Risk | Flood, fire, hurricane, radon |
| 131-138 | Additional Features | View, EV charging, pets |
| 139-143 | Stellar MLS Parking | Carport, garage, assigned spaces |
| 144-148 | Stellar MLS Building | Floor#, elevator, unit floors |
| 149-154 | Stellar MLS Legal | Subdivision, homestead, CDD |
| 155-159 | Stellar MLS Waterfront | Water frontage, access, view |
| 160-165 | Stellar MLS Leasing | Lease rules, pet limits |
| 166-168 | Stellar MLS Features | Community, interior, exterior |

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                              │
├─────────────────────────────────────────────────────────────────┤
│  MLS PDF Upload    Address Search    Manual Entry    LLM Retry  │
│       ↓                  ↓                ↓              ↓       │
│  parse-mls-pdf.ts   search.ts      AddProperty.tsx   retry-llm  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     FIELD NORMALIZER                             │
│              src/lib/field-normalizer.ts                         │
│   Converts all sources to unified 168-field schema format       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      ARBITRATION                                 │
│              api/property/arbitration.ts                         │
│   Merges fields from multiple sources, resolves conflicts       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     PROPERTY STORE                               │
│              src/store/propertyStore.ts                          │
│   Zustand store with localStorage persistence                   │
│   - properties: PropertyCard[] (summary for lists)              │
│   - fullProperties: Map<id, Property> (full 168 fields)         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        UI DISPLAY                                │
│              PropertyDetail.tsx, AddProperty.tsx                 │
│   Reads from store and displays all 168 fields                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Reference

### Core Schema Files
- `src/types/fields-schema.ts` - **SOURCE OF TRUTH** for 168 fields
- `src/types/property.ts` - TypeScript interfaces (130 WRONG COMMENTS)

### Mapping Files (MOSTLY BROKEN - don't match fields-schema.ts)
- `src/lib/field-normalizer.ts` - OK, matches schema
- `src/lib/field-mapping.ts` - 88 ERRORS
- `api/property/search.ts` - 6 ERRORS
- `api/property/search-stream.ts` - 133 ERRORS
- `api/property/parse-mls-pdf.ts` - OK for MLS, missing Zillow/Redfin/Realtor

### Store
- `src/store/propertyStore.ts` - Zustand store with localStorage

### UI
- `src/pages/PropertyDetail.tsx` - 167 missing fieldKey props
- `src/pages/AddProperty.tsx` - 73 field errors + missing PDF enrich buttons

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run field audit (WILL SHOW 491+ ERRORS)
node scripts/master-audit.cjs

# Build for production
npm run build
```

---

## CLUES Brand Color System

### INDEX COLORS (5-tier rating scale)
| Score | Color | Hex | Meaning |
|-------|-------|-----|---------|
| 0-20 | RED | `#EF4444` | Bad |
| 21-40 | ORANGE | `#F97316` | Poor |
| 41-60 | YELLOW | `#EAB308` | Neutral |
| 61-80 | BLUE | `#3B82F6` | Good |
| 81-100 | GREEN | `#22C55E` | Excellent |

---

## License

MIT - John E. Desautels & Associates
