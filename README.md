# CLUES Property Dashboard

168-Field Real Estate Intelligence Platform built for the CLUES Quantum Master App.

---

## CRITICAL: Instructions for Claude Code / AI Assistants

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

## CURRENT FIX NEEDED: Data Stacking / Accumulation

### The Problem

When a property is added via different sources (MLS PDF upload, address search, LLM enrichment), **data gets lost** instead of accumulated. Each source should ADD to existing data, not replace it.

### Expected Behavior

1. User uploads MLS PDF → Gets ~60 fields from PDF
2. User clicks "Enrich with APIs" → Should ADD Walk Score, Flood Zone, Distances, etc.
3. User clicks "Retry with LLM" → Should ADD missing fields without losing existing data
4. Final result: All data from all sources combined (168 fields max)

### Current Bug

- PDF upload works and saves data
- But calling additional APIs or LLMs may overwrite or fail to merge properly
- Need to ensure data STACKS, not REPLACES

### Files to Check

1. `src/store/propertyStore.ts` - How properties are stored/updated
2. `api/property/search.ts` - The `mergeFields()` function and arbitration logic
3. `api/property/arbitration.ts` - Field conflict resolution
4. `src/pages/AddProperty.tsx` - How PDF data is saved and merged

### Fix Requirements

1. **Additive merging**: New data sources ADD fields, never remove existing ones
2. **Source tracking**: Each field keeps track of which source provided it
3. **Conflict resolution**: When same field from multiple sources, use tier priority:
   - Tier 1: MLS (highest trust)
   - Tier 2: County Records, FEMA
   - Tier 3: Google, WalkScore, HowLoud, AirNow
   - Tier 4: LLMs (lowest trust, gap-fill only)
4. **Never lose data**: Once a field has a value, it should persist unless explicitly overwritten by higher-tier source

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

### CRITICAL: Field Mapping Verification

Before any field mapping changes, run:
```bash
npx ts-node scripts/verify-field-mapping.ts
```

This verifies these 3 files match `fields-schema.ts`:
- `src/lib/field-normalizer.ts`
- `api/property/search.ts`
- `api/property/parse-mls-pdf.ts`

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

## API Endpoints

### `/api/property/search`
- **Input**: Address string
- **Process**: Geocode → Call all APIs in parallel → Merge → Return
- **APIs Called**: Google Maps, WalkScore, FEMA, AirNow, HowLoud, Weather, Google Places
- **LLMs Called**: Perplexity, Claude, GPT, Grok (as needed for gaps)

### `/api/property/parse-mls-pdf`
- **Input**: Base64 PDF data
- **Process**: Send to Claude Vision → Extract fields → Map to schema
- **Output**: Parsed fields with `source: "Stellar MLS PDF"`

### `/api/property/retry-llm`
- **Input**: Property address, specific field to retry, LLM to use
- **Process**: Call specified LLM for just that field
- **Output**: Single field value with source

---

## File Reference

### Core Schema Files
- `src/types/fields-schema.ts` - **SOURCE OF TRUTH** for 168 fields
- `src/types/property.ts` - TypeScript interfaces for Property objects

### Mapping Files (must match fields-schema.ts)
- `src/lib/field-normalizer.ts` - Converts API responses to Property objects
- `api/property/search.ts` - `fieldPathMap` for nested structure
- `api/property/parse-mls-pdf.ts` - MLS field name to number mapping

### Store
- `src/store/propertyStore.ts` - Zustand store with localStorage

### UI
- `src/pages/PropertyDetail.tsx` - Displays all 168 fields
- `src/pages/AddProperty.tsx` - Add property (address, PDF, manual)

### Verification
- `scripts/verify-field-mapping.ts` - Checks all mappings match schema

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Verify field mappings
npx ts-node scripts/verify-field-mapping.ts

# Build for production
npm run build
```

---

## Recent Fixes (November 2025)

### Field Mapping Corrections (2025-11-30)
- Fixed ALL 168 field numbers across 3 mapping files
- Key corrections:
  - Field 10 = listing_price (was 7)
  - Field 17 = bedrooms (was 12)
  - Field 21 = living_sqft (was 16)
  - Field 35 = annual_taxes (was 29)
- Fixed API helper functions (WalkScore, FEMA, AirNow, HowLoud, etc.)
- Verification script now shows 0 errors

### PropertyCard Header Fix (2025-11-30)
- Fixed header showing $0, 0 beds, 0 baths
- Updated AddProperty.tsx to use correct field numbers

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

### PROPERTY COLORS (comparison)
| Property | Color | Hex |
|----------|-------|-----|
| P1 | Emerald | `#10B981` |
| P2 | Cyan | `#00D9FF` |
| P3 | Fuchsia | `#E879F9` |

---

## License

MIT - John E. Desautels & Associates
