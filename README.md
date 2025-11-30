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
