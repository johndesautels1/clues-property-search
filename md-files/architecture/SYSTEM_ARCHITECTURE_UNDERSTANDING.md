# CLUES Property Dashboard - Complete System Architecture
**Date:** 2025-12-30
**Purpose:** Prove I understand the entire codebase before making changes

---

## Executive Summary

**Main File:** `api/property/search.ts` (4,664 lines)
**Architecture:** 4-Tier Data Cascade + Arbitration Pipeline
**Total Data Sources:** 30+ (1 MLS API + ~15 Free APIs + 6 LLMs + 8+ other sources)
**Field Count:** 168 fields (complete property schema)

---

## TIER SYSTEM (Data Source Hierarchy)

### TIER 1: Stellar MLS via Bridge API
**Priority:** Highest (most reliable)
**Source:** Bridge Interactive MLS API
**Status:** ✅ ACTIVE
**Coverage:** ~85 fields mapped
**Protection:** `STELLAR_MLS_AUTHORITATIVE_FIELDS` (67 fields protected)
**File:** `src/lib/bridge-field-mapper.ts`

**Protected Fields Include:**
- Core listing data (MLS #, price, status, dates)
- Exact measurements (bed/bath, sqft, lot, year built, garage)
- HOA data
- Tax data (critical - LLMs hallucinate old values)
- Utility providers (Fields 104-109) - JUST ADDED
- Structure details (Field 44 garage type, Field 27 stories)
- Permit history (Fields 60-62) - JUST ADDED
- Parking (Fields 139-143)
- Building (Fields 144-148)
- Legal (Fields 149-154)
- Waterfront (Fields 155-159)
- Leasing (Fields 160-165)
- Features (Fields 166-168)

### TIER 2: Google APIs
**Priority:** High
**APIs:**
- Google Geocoding (address validation, lat/lng)
- Google Places (nearby locations)
- Google Street View (property images)
- Google Solar API (solar potential)

### TIER 3: Free/Paid Third-Party APIs (~15 sources)
**Priority:** Medium
**APIs Active:**
- **SchoolDigger** - School ratings (Fields 66, 69, 72)
- **FBI Crime API** - Crime data (Fields 88-89)
- **WalkScore** - Walk/Transit/Bike scores (Fields 74-76)
- **FEMA Flood** - Flood zones (Field 119)
- **AirNow** - Air quality (Field 117)
- **HowLoud** - Noise levels (Field 129)
- **Weather API** - Current climate (Field 121)
- **U.S. Census** - Vacancy rate (Field 100)
- **USGS Elevation** - Elevation data (Field 64)
- **USGS Earthquake** - Earthquake risk (Field 123)
- **EPA FRS** - Superfund sites (Field 127)
- **NOAA APIs** - Climate/storm/sea level data

**APIs Removed:**
- Zillow/Redfin scrapers (blocked by anti-bot)
- AirDNA (not wired)
- Broadband (not wired)
- HUD (geo-blocked)

### TIER 4: LLM CASCADE (6 models in parallel)
**Priority:** Lowest (gap-filling only)
**Execution:** All 6 run in PARALLEL, then results processed SEQUENTIALLY

**LLM Order (processing priority):**
1. **Perplexity** (Tier 4) - Has web search, most reliable LLM
2. **Grok** (Tier 5) - Has web search
3. **Claude Opus** (Tier 5) - No web, training data only
4. **GPT-5.2** (Tier 5) - No web, training data only
5. **Claude Sonnet** (Tier 5) - No web, training data only
6. **Gemini** (Tier 5) - No web, training data only

---

## ARBITRATION PIPELINE (How Conflicts Are Resolved)

**File:** `api/property/arbitration.ts`
**Function:** `createArbitrationPipeline()`

### How It Works

**Step 1:** Sources add fields with metadata
```typescript
{
  value: 1250000,
  source: "Stellar MLS",
  confidence: "High",
  tier: 1
}
```

**Step 2:** Arbitration rules on conflict:
1. **Lower tier always wins** (Tier 1 > Tier 2 > Tier 3 > Tier 4 > Tier 5)
2. **Same tier:** Higher confidence wins
3. **Same tier + confidence:** First value wins

**Step 3:** Protection layer prevents overwrites
- `STELLAR_MLS_AUTHORITATIVE_FIELDS` - 67 fields locked to Tier 1-3 sources
- `GROK_RESTRICTED_FIELDS` - 50+ fields Grok can't touch
- `filterNullValues()` - All LLMs blocked from returning null

**Step 4:** Result includes:
- Final value per field
- Source attribution
- Confidence level
- Conflict warnings (yellow flag if sources disagreed)

---

## LLM PROMPT ARCHITECTURE

### 1. PERPLEXITY (Lines 2045-2194)

**Model:** `sonar-pro`
**Capabilities:** LIVE WEB SEARCH
**Timeout:** 225 seconds (longest - needs time for deep search)

**System Message:**
```
You are a real estate data researcher with REAL-TIME WEB SEARCH capabilities.
NEVER fabricate URLs, values, or data - only return what you actually find
If you cannot find data for a field, DO NOT include that field - omit it
NEVER return null values - omit unfound fields entirely
```

**User Prompt Includes:**
- 168 field definitions (FIELD_GROUPS_PERPLEXITY)
- Specific search patterns:
  - "${address} Zillow"
  - "[County] Property Appraiser ${address}"
  - "${address} GreatSchools"
  - "${address} WalkScore"
  - etc. (~30 search patterns)
- Domain-specific rules:
  - WalkScore: Only from WalkScore.com, no guessing
  - Schools: Only from GreatSchools.org or official sites
  - Crime: Only from NeighborhoodScout, CrimeGrade, police portals
  - Utilities: Only from official utility websites
  - POI Distances: Only from Google Maps (explicit display)
- JSON response format with source + source_url required

**Key Rules:**
- Retrieval-only (no guessing/estimating)
- Must cite source + URL for every field
- Omit fields if not found (never null)
- Prioritize official sources

### 2. GROK (Lines 3721-3789)

**Model:** `grok-4.1-fast-reasoning`
**Capabilities:** LIVE WEB SEARCH
**Timeout:** 210 seconds
**Max Tokens:** 16,000

**System Prompt (PROMPT_GROK):**
```
⚠️ CRITICAL ATTESTATION REQUIREMENT ⚠️
YOU ARE COMMANDED TO 100% ATTEST THAT THE INFORMATION PROVIDED IS:
1. ACCURATE - No fabricated, guessed, or estimated data
2. TRUTHFUL - Only return data you ACTUALLY FOUND via web search RIGHT NOW
3. VERIFIED - From reputable 3rd party sources
4. SOURCED - Include exact URL or site name
5. CROSS-VERIFIED - When possible, verify from 2+ sources
```

**Priority Fields for Grok:**
- 16_redfin_estimate - Search Redfin.com RIGHT NOW
- Other high-value missing fields

**Protection Applied:**
- `GROK_RESTRICTED_FIELDS` - Cannot touch 50+ Stellar MLS fields
- Blocked from: MLS data (2-5, 10, 13-14), Property basics (17-29), HOA (30-34), Stellar exclusives (139-168)

### 3. CLAUDE OPUS (Lines 3173-3222)

**Model:** `claude-opus-4`
**Capabilities:** NO WEB - Training data only (cutoff April 2024)
**Timeout:** 210 seconds

**Prompt:**
```
You are Claude Opus, the most capable AI assistant.
You do NOT have web access.
Extract as many of 168 fields as possible using training knowledge.
Be HONEST about uncertainty. Better to return null than guess.
```

**Use Case:** Fill gaps with general knowledge (property types, standard practices, etc.)

### 4. GPT-5.2 (Lines 3337-3458)

**Model:** `gpt-5.2` (via OpenAI)
**Capabilities:** NO WEB - Training data (cutoff early 2024)
**Timeout:** 210 seconds

**Prompt:**
```
You are GPT-5.2, a real estate data extraction assistant.
You do NOT have web access.
Extract property data using your training knowledge.
```

**Special Mode:** Also has `GPT_ORCHESTRATOR` mode for merging pre-fetched data blobs

### 5. CLAUDE SONNET (Lines 3223-3336)

**Model:** `claude-sonnet-4.5`
**Capabilities:** NO WEB - Training data only
**Timeout:** 210 seconds

**Prompt:** Similar to Opus but more concise responses

### 6. GEMINI (Lines 3792-3860)

**Model:** `gemini-3-pro-preview`
**Capabilities:** NO WEB - Training data only
**Timeout:** 210 seconds

**Prompt:**
```
You are Gemini, a knowledgeable AI helping extract property data.
No web access.
Extract fields using training knowledge.
```

---

## NULL VALUE PROTECTION

**Function:** `filterNullValues()` (applied to ALL LLMs)
**Location:** Called before adding fields to arbitration

**Blocks:**
- `null`
- `undefined`
- `""`
- `"Not available"`
- `"N/A"`
- `"Unknown"`

**Why:** Prevents LLMs from "filling" fields with non-data

---

## CURRENT KNOWN ISSUES (From User's Test Data)

### Section H: Permits & Renovations (0/4 fields = 0%)
- **Field 59:** Recent Renovations → NULL (no extraction logic)
- **Field 60-62:** Permit History → NULL or hallucinated "2018" dates
- **Status:** Fields 60-62 JUST PROTECTED (added to STELLAR_MLS_AUTHORITATIVE_FIELDS)
- **Next Step:** Need BuildFax API or Accela scraper for real permit data

### Section M: Market & Investment (2/12 fields = 17%)
- **Fields 91-96, 98-99, 101:** All NULL
- **Root Cause:**
  - Fields 93, 94, 99, 101 should be backend calculations (NOT in LLM!)
  - Fields 91, 92, 95, 97, 98 need APIs (Zillow, insurance, etc.)
- **Solution:** Already have calculation functions in `calculate-derived-fields.ts`, just not integrated

### Section Q: Parking (1/5 fields = 20%)
- **Fields 140-143:** NULL
- **Likely Fix:** Already in Bridge MLS extended data, just need to map

### Section S: Legal (1/4 fields = 25%)
- **Fields 151-153:** NULL
- **Likely Fix:** Check if Bridge has these, or scrape county

### Section I: School Ratings (5/8 = 63%)
- **Fields 66, 69, 72:** School ratings NULL
- **Solution:** SchoolDigger API integration needed

---

## WHAT I UNDERSTAND ABOUT THE SYSTEM

✅ **Data Flow:**
1. Bridge MLS called first (Tier 1)
2. Google APIs called (Tier 2)
3. Free APIs called in parallel (Tier 3)
4. LLMs called in parallel, processed sequentially (Tier 4-5)
5. Arbitration merges all sources
6. Protection prevents downstream sources from overwriting upstream

✅ **Protection Mechanisms:**
1. `STELLAR_MLS_AUTHORITATIVE_FIELDS` - 67 fields locked
2. `GROK_RESTRICTED_FIELDS` - Grok can't touch MLS fields
3. `filterNullValues()` - LLMs can't return null
4. Tier system - Lower tier always wins conflicts

✅ **LLM Roles:**
- **Perplexity:** Web search for missing fields (highest priority LLM)
- **Grok:** Web search for gaps (restricted from MLS fields)
- **Opus/GPT/Sonnet/Gemini:** Training data fallback (no web)

✅ **Where Field 59 Fits:**
- Currently NO extraction logic for Field 59 (not in bridge-field-mapper.ts)
- Should extract from Bridge MLS PublicRemarks
- Should be added to STELLAR_MLS_AUTHORITATIVE_FIELDS
- LLMs currently can fill it (but we want to prevent hallucination)

✅ **What Gemini's Instructions Mean:**
- Gemini wants me to add calculation rules to LLM prompts
- But Perplexity's approach says calculations should be backend-only
- Current system ALREADY has protection mechanisms in place
- Adding Gemini's rules would let LLMs do math (BAD per Perplexity)

✅ **Why I Need to Be Careful:**
- System has 4,664 lines of carefully orchestrated logic
- Multiple protection layers already exist
- Changes must not break arbitration pipeline
- Must not violate tier system
- Must not let LLMs bypass protection

---

## MY PLAN FOR FIELD 59 (Now That I Understand The System)

### What I Will Do

**1. Add Extraction Logic to Bridge Field Mapper** (`src/lib/bridge-field-mapper.ts`)
- Extract from `property.PublicRemarks` using regex
- Extract from `property.InteriorFeatures` as fallback
- Mark source as "Stellar MLS - PublicRemarks" (Tier 1)
- Set confidence to "Medium" (evidence-based but text extraction)

**2. Add Field 59 to Protection** (`api/property/search.ts`)
- Add `'59_recent_renovations'` to `STELLAR_MLS_AUTHORITATIVE_FIELDS`
- This prevents Grok/Opus/GPT/Sonnet/Gemini from overwriting with hallucinations
- Perplexity can still fill if Bridge returns NULL (Tier 4 vs Tier 1, but only if Tier 1 absent)

**3. Will NOT Do (Gemini's Approach):**
- ❌ Add calculation formulas to LLM prompts
- ❌ Let LLMs do age calculations
- ❌ Hardcode ZIP median data in prompts
- **Why:** Violates Perplexity's backend-first architecture and current system protection

### What I Will NOT Touch

❌ Arbitration pipeline logic
❌ Tier system
❌ Existing LLM prompts (Perplexity, Grok, etc.)
❌ Protection mechanisms
❌ 168-field schema
❌ Any other fields (staying focused on Field 59 only)

---

## READY TO PROCEED?

I now understand:
- ✅ Your system has 6 LLMs with detailed prompts
- ✅ You have ~25+ APIs being called
- ✅ You have a 4-tier arbitration system
- ✅ You have multiple protection layers
- ✅ Field 59 needs extraction logic in Tier 1 (Bridge mapper)
- ✅ Field 59 needs protection to prevent LLM hallucination
- ✅ I should NOT add Gemini's calculation rules to LLM prompts

**Can I proceed with implementing Field 59 extraction now?**

Or do you want me to demonstrate understanding of another part of the system first?
