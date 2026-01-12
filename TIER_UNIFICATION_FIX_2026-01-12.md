# Tier Hierarchy Unification Fix - 2026-01-12

## Problem Identified
Frontend and backend had DIFFERENT tier hierarchies, causing LLM data to create conflicts instead of being properly rejected when retry buttons were clicked.

## Root Cause
On **January 8, 2026**, the backend `api/property/arbitration.ts` was refactored to update the tier structure, but **3 frontend files were never updated**, creating a mismatch.

## Files Fixed

### 1. `src/store/propertyStore.ts` - SOURCE_TIERS
**Changes:**
- ✅ Google Maps, Geocode, Places: **3 → 2**
- ✅ WalkScore, SchoolDigger, FEMA, AirNow, HowLoud, Weather, FBI Crime, Census, NOAA, USGS, EPA: **3 → 2**
- ✅ **ADDED** Tavily at **tier 3**
- ✅ Gemini, GPT, Claude Sonnet, Grok: **5 → 4**
- ✅ Claude Opus remains at **tier 5**
- ✅ Manual remains at **tier 6**

### 2. `src/lib/arbitration.ts` - DATA_TIERS  
**Changes:**
- ✅ walkscore, schooldigger, fema, airnow, howloud, weather, fbi-crime: **3 → 2**
- ✅ **ADDED** tavily at **tier 3**
- ✅ grok: **5 → 4**
- ✅ gemini, gpt, claude-sonnet remain at **tier 4**
- ✅ claude-opus remains at **tier 5**

### 3. `src/lib/data-sources.ts` - DATA_SOURCES array
**Changes:**
- ✅ All free APIs (walkscore, fema, weather, etc.): **3 → 2**
- ✅ **ADDED** Tavily at **tier 3**
- ✅ Grok, Gemini, GPT, Claude Sonnet: **5 → 4**
- ✅ Claude Opus remains at **tier 5**

## Unified Tier Structure (Frontend + Backend)

**Tier 1: Stellar MLS (HIGHEST AUTHORITY)**
- Stellar MLS
- Backend Calculation
- Backend Logic

**Tier 2: ALL APIs**  
- Google (Geocode, Places, Distance, Street View, Solar)
- WalkScore, SchoolDigger, FEMA, AirNow, HowLoud, Weather, FBI Crime
- U.S. Census, NOAA, USGS, EPA, FCC Broadband

**Tier 3: Tavily Web Search**
- Tavily (targeted web searches for AVMs, schools, crime)

**Tier 4: Web-Search LLMs**
- Perplexity (highest LLM priority)
- Gemini  
- GPT-4o
- Claude Sonnet
- Grok

**Tier 5: Claude Opus (LAST)**
- Claude Opus (deep reasoning, NO web search)

**Tier 6: Manual Entry (Frontend only)**
- User-entered data

## Impact

### BEFORE (Buggy Behavior):
- LLM retry buttons used **wrong tier priorities**
- Tier 4 LLMs (like Grok) thought they were Tier 5, allowing them to overwrite Tier 2 APIs
- Created **16 conflicts** between MLS and LLMs that should have been auto-rejected
- Frontend merge logic allowed lower-tier data to contaminate higher-tier data

### AFTER (Correct Behavior):
- **All 3 frontend files match backend arbitration.ts**
- Lower tiers are properly rejected if higher tiers already filled the field
- LLM data can only fill EMPTY fields, not overwrite MLS/API data
- Conflicts only created when SAME tier sources disagree
- Retry buttons now respect correct tier hierarchy

## Testing Required
1. Search for any property
2. Click retry buttons for LLM sources
3. Verify NO conflicts created between MLS (tier 1) and LLMs (tier 4/5)
4. Verify LLMs can ONLY fill empty fields, not overwrite existing tier 1/2 data

## Backups Created
- `src/store/propertyStore.ts.backup-20260112-*`
- `src/lib/arbitration.ts.backup-20260112-*`
- `src/lib/data-sources.ts.backup-20260112-*`

