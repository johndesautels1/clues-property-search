# CLUES Property Dashboard - Master API & LLM Cascade Schema

**Generated:** 2025-01-05
**Source Files:** search.ts, free-apis.ts, llm-constants.ts, bridge-api-client.ts

---

## EXECUTION FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TIER 1: STELLAR MLS (Bridge API)                     │
│                         Timeout: 30,000ms (30 seconds)                       │
│                         Priority: HIGHEST - Authoritative Source             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Source: Bridge Interactive API (Stellar MLS RESO Web API)                   │
│  Base URL: https://api.bridgedataoutput.com/api/v2                          │
│  Fields: 1-168 (Core MLS data)                                              │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TIER 2: GOOGLE APIS (Geocode, Places)                     │
│                         Timeout: 90,000ms (90 seconds)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Google Geocode API     → Fields 1, 6, 7, 8 + coordinates                │
│  2. Google Places API      → Nearby amenities, distances                    │
│  3. Google Street View     → Property images                                │
│  4. Google Solar API       → Field 130 (solar_potential)                    │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TIER 3: FREE/PAID APIs (14 Sources)                     │
│                         Timeout: 90,000ms (90 seconds)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  See FREE API TABLE below for complete list                                 │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              TIER 4: PERPLEXITY MICRO-PROMPTS (10 Parallel Calls)            │
│                       Timeout: 225,000ms (3.75 minutes)                      │
│                       Model: sonar / sonar-pro (web search)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  All 10 calls fire IN PARALLEL, processed sequentially after completion     │
│  See PERPLEXITY MICRO-PROMPTS TABLE below                                   │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TIER 5: OTHER LLMs (5 Models in Parallel)                 │
│                       Timeout: 210,000ms (3.5 minutes)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  All 5 LLMs fire IN PARALLEL, processed sequentially after completion       │
│  Order: Grok → GPT → Claude Opus → Gemini → Claude Sonnet                   │
│  See LLM CASCADE TABLE below                                                │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ARBITRATION PIPELINE                                 │
│                    Source Priority: Tier 1 > Tier 2 > ... > Tier 5          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## TIMEOUT CONFIGURATION

| Constant | Value | Description |
|----------|-------|-------------|
| `STELLAR_MLS_TIMEOUT` | 30,000ms (30s) | Bridge API / Stellar MLS (Tier 1) |
| `FREE_API_TIMEOUT` | 90,000ms (90s) | Google, WalkScore, FEMA, etc (Tier 2 & 3) |
| `LLM_TIMEOUT` | 210,000ms (3.5min) | Claude, GPT, Gemini, Grok (Tier 5) |
| `PERPLEXITY_TIMEOUT` | 225,000ms (3.75min) | Perplexity web search (Tier 4) |

---

## TIER 1: STELLAR MLS (Bridge API)

| Property | Value |
|----------|-------|
| **Provider** | Bridge Interactive |
| **Data Source** | Stellar MLS (Florida) |
| **API Standard** | RESO Web API |
| **Base URL** | `https://api.bridgedataoutput.com/api/v2` |
| **Timeout** | 30,000ms |
| **Fields Provided** | 1-168 (Core property data) |
| **Priority** | HIGHEST - Authoritative, never overwritten |

---

## TIER 2 & 3: FREE/PAID APIs (18 Sources)

| # | API Name | Function | Fields Populated | Timeout |
|---|----------|----------|------------------|---------|
| 1 | **Google Geocode** | `callGoogleGeocode()` | 1, 6, 7, 8, coordinates | 90s |
| 2 | **Google Places** | `callGooglePlaces()` | 83-87 (distances) | 90s |
| 3 | **Google Street View** | `callGoogleStreetView()` | Property images | 90s |
| 4 | **Google Solar API** | `callGoogleSolarAPI()` | 130 (solar_potential) | 90s |
| 5 | **WalkScore** | `callWalkScore()` | 74, 75, 76, 80 | 90s |
| 6 | **FEMA Flood** | `callFemaFlood()` | 119, 120 | 60s |
| 7 | **AirNow** | `callAirNow()` | 117, 118 | 90s |
| 8 | **SchoolDigger** | `callSchoolDigger()` | 63, 65-73 | 90s |
| 9 | **GreatSchools** | `callGreatSchools()` | 66, 69, 72 (ratings) | 90s |
| 10 | **HowLoud** | `callHowLoud()` | 78, 129 | 90s |
| 11 | **CrimeGrade** | `callCrimeGrade()` | 77, 88, 89, 90 | 90s |
| 12 | **Weather API** | `callWeather()` | Climate data | 90s |
| 13 | **HUD Fair Market Rent** | `callHudFairMarketRent()` | 98 (rental_estimate) | 90s |
| 14 | **FEMA Risk Index** | `callFEMARiskIndex()` | 121-125 (risk scores) | 90s |
| 15 | **NOAA Climate** | `callNOAAClimate()` | Climate risk data | 90s |
| 16 | **NOAA Storm Events** | `callNOAAStormEvents()` | Storm history | 90s |
| 17 | **NOAA Sea Level** | `callNOAASeaLevel()` | 128 (sea_level_rise) | 90s |
| 18 | **USGS Elevation** | `callUSGSElevation()` | 64 (elevation_feet) | 90s |
| 19 | **USGS Earthquake** | `callUSGSEarthquake()` | 123 (earthquake_risk) | 90s |
| 20 | **EPA FRS** | `callEPAFRS()` | 127 (superfund_nearby) | 90s |
| 21 | **Radon Risk** | `getRadonRisk()` | 126 (radon_risk) | 90s |
| 22 | **Redfin Property** | `callRedfinProperty()` | 16b (redfin_estimate) | 90s |
| 23 | **BroadbandNow** | `callBroadbandNow()` | 111-113 (internet) | 90s |
| 24 | **AirDNA** | `callAirDNA()` | STR rental data | 90s |
| 25 | **Census API** | `getCensusData()` | 100 (vacancy_rate) | 90s |

---

## TIER 4: PERPLEXITY MICRO-PROMPTS (10 Parallel Calls)

**Timeout:** 225,000ms (3.75 minutes)
**Web Search:** YES - Real-time web search capability
**Execution:** All 10 fire IN PARALLEL, processed sequentially after

| Order | Prompt ID | Function | Model | Fields Target |
|-------|-----------|----------|-------|---------------|
| 1 | `perplexity-portals` | `callPerplexityPortals()` | `sonar` | 10, 12, 16a-f, 17-21, 26, 28, 30-33, 44, 54-55, 59, 91-95, 98, 102-103 |
| 2 | `perplexity-county` | `callPerplexityCounty()` | `sonar` | 7, 9, 15, 35-36, 149-150 |
| 3 | `perplexity-schools` | `callPerplexitySchools()` | `sonar` | 63, 65-73 |
| 4 | `perplexity-crime` | `callPerplexityWalkScoreCrime()` | `sonar` | 74-77, 88-90 |
| 5 | `perplexity-utilities` | `callPerplexityUtilities()` | `sonar` | 104-110 |
| 6 | `perplexity-electric` | `callPerplexityElectricBill()` | `sonar-pro` | 104, 105 |
| 7 | `perplexity-water` | `callPerplexityWaterBill()` | `sonar` | 106, 107 |
| 8 | `perplexity-internet-speed` | `callPerplexityInternetSpeed()` | `sonar` | 111, 112 |
| 9 | `perplexity-fiber` | `callPerplexityFiberAvailable()` | `sonar` | 113 |
| 10 | `perplexity-cell` | `callPerplexityCellCoverage()` | `sonar` | 115 |

---

## TIER 5: OTHER LLMs (5 Models in Parallel)

**Timeout:** 210,000ms (3.5 minutes)
**Execution:** All 5 fire IN PARALLEL, processed sequentially after (order below)

| Processing Order | LLM ID | Display Name | Exact Model ID | Web Search | Provider |
|------------------|--------|--------------|----------------|------------|----------|
| 1 | `grok` | Grok | `grok-4` | YES (real-time X/Twitter) | xAI |
| 2 | `gpt` | GPT-5.2 | `gpt-5.2-2025-12-11` | NO (knowledge cutoff) | OpenAI |
| 3 | `claude-opus` | Claude Opus | `claude-opus-4-5-20251101` | NO (knowledge only) | Anthropic |
| 4 | `gemini` | Gemini | `gemini-2.0-flash` | YES (Google Search grounding) | Google |
| 5 | `claude-sonnet` | Claude Sonnet | `claude-sonnet-4-5-20250929` | YES (`web_search` tool) | Anthropic |

---

## LLM CASCADE ORDER (from llm-constants.ts)

```typescript
export const LLM_CASCADE_ORDER = [
  'perplexity',      // Tier 4 - Web search (HIGHEST LLM PRIORITY)
  'grok',            // Tier 5 - Web search + real-time data (2nd priority)
  'gpt',             // Tier 5 - Knowledge - Comprehensive data
  'claude-opus',     // Tier 5 - Knowledge - Deep reasoning
  'gemini',          // Tier 5 - Knowledge with search grounding
  'claude-sonnet',   // Tier 5 - LAST - fills in MISSING fields only
] as const;
```

---

## WEB SEARCH CAPABILITIES BY MODEL

| Model | Web Search | Method | Notes |
|-------|------------|--------|-------|
| **Perplexity (sonar/sonar-pro)** | YES | Built-in | Real-time web search, citations |
| **Grok (grok-4)** | YES | Built-in | Real-time X/Twitter + web |
| **GPT-5.2** | NO | N/A | Knowledge cutoff only |
| **Claude Opus** | NO | N/A | Knowledge cutoff only (web_search NOT supported) |
| **Gemini 2.0 Flash** | YES | `googleSearch` grounding | Google Search integration |
| **Claude Sonnet** | YES | `web_search_20250305` tool | Anthropic web search tool |

---

## FULL FIRING SEQUENCE

```
TIME 0ms     │ TIER 1: Bridge/Stellar MLS call starts
             │
TIME 30s     │ TIER 1: Timeout (or earlier if response received)
             │
TIME 30s     │ TIER 2 & 3: All Free APIs start (parallel)
             │   ├── Google Geocode
             │   ├── Google Places
             │   ├── WalkScore
             │   ├── FEMA Flood
             │   ├── AirNow
             │   ├── SchoolDigger
             │   ├── CrimeGrade
             │   ├── USGS Elevation
             │   ├── Census API
             │   └── ... (18+ APIs)
             │
TIME 120s    │ TIER 2 & 3: Timeout (90s after start)
             │
TIME 120s    │ TIER 4 & 5: ALL LLMs start IN PARALLEL
             │   ├── Perplexity (10 micro-prompts) ─────┐
             │   │   ├── perplexity-portals            │
             │   │   ├── perplexity-county             │
             │   │   ├── perplexity-schools            │
             │   │   ├── perplexity-crime              │
             │   │   ├── perplexity-utilities          │ 225s timeout
             │   │   ├── perplexity-electric           │
             │   │   ├── perplexity-water              │
             │   │   ├── perplexity-internet-speed     │
             │   │   ├── perplexity-fiber              │
             │   │   └── perplexity-cell ──────────────┘
             │   │
             │   └── Other LLMs ───────────────────────┐
             │       ├── grok                          │
             │       ├── gpt                           │ 210s timeout
             │       ├── claude-opus                   │
             │       ├── gemini                        │
             │       └── claude-sonnet ────────────────┘
             │
TIME 345s    │ TIER 4: Perplexity timeout (225s)
TIME 330s    │ TIER 5: Other LLMs timeout (210s)
             │
TIME 345s    │ ARBITRATION: Process all results
             │   Priority: Tier 1 > Tier 2 > Tier 3 > Tier 4 > Tier 5
             │
TIME ~350s   │ RESPONSE: Return unified property object (181 fields)
```

---

## ARBITRATION PRIORITY

| Tier | Source | Priority | Can Overwrite |
|------|--------|----------|---------------|
| 1 | Stellar MLS (Bridge) | HIGHEST | Nothing - Authoritative |
| 2 | Google APIs | High | Tier 3, 4, 5 |
| 3 | Free APIs | Medium | Tier 4, 5 |
| 4 | Perplexity | Low-Medium | Tier 5 only |
| 5 | Other LLMs | LOWEST | Nothing |

**Rule:** Lower tier sources CANNOT overwrite higher tier data for the same field.

---

## ENVIRONMENT VARIABLES REQUIRED

```bash
# TIER 1: Stellar MLS
BRIDGE_API_KEY=xxx
BRIDGE_API_BASE_URL=https://api.bridgedataoutput.com/api/v2

# TIER 2: Google APIs
GOOGLE_MAPS_API_KEY=xxx

# TIER 3: Free APIs
WALKSCORE_API_KEY=xxx
AIRNOW_API_KEY=xxx
CENSUS_API_KEY=xxx
SCHOOLDIGGER_API_KEY=xxx
GREATSCHOOLS_API_KEY=xxx

# TIER 4: Perplexity
PERPLEXITY_API_KEY=xxx
PERPLEXITY_MODEL=sonar-pro  # Optional, defaults to sonar-pro

# TIER 5: LLMs
ANTHROPIC_API_KEY=xxx       # Claude Opus & Sonnet
OPENAI_API_KEY=xxx          # GPT-5.2
GOOGLE_AI_API_KEY=xxx       # Gemini
XAI_API_KEY=xxx             # Grok
```

---

## RESPONSE FORMAT

```json
{
  "success": true,
  "address": "123 Main St, Tampa, FL 33601",
  "fields": { ... },           // 181 flat fields
  "nestedFields": { ... },     // Nested structure for UI
  "total_fields_found": 142,
  "completion_percentage": 78,
  "sources": ["Stellar MLS", "Google Geocode", "Perplexity", ...],
  "source_breakdown": {
    "Stellar MLS": 45,
    "Google Geocode": 5,
    "WalkScore": 4,
    "Perplexity Portals": 12,
    "GPT": 8,
    ...
  },
  "conflicts": [...],
  "llm_responses": [...]
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-01-05
