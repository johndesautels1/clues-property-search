# Tavily Integration Data Flow Diagram

## Overview
Tavily is a Tier 3 data source that executes BEFORE all LLMs (Tier 4-5).
The LLM prompts have been updated to inform them that Tavily already ran.

## Architecture: 5-Tier Search Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SEARCH.TS - Main Orchestrator                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 1: STELLAR MLS (Bridge Interactive API)                                │
│ ─────────────────────────────────────────────                               │
│ • Called first with MLS# or address                                         │
│ • Returns: Property basics, listing data, HOA, taxes                        │
│ • Source: "Stellar MLS"                                                     │
│ • Fields: 1-9, 10, 13-14, 17-29, 30-38, 39-58, 139-168                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 2: GOOGLE APIs                                                         │
│ ─────────────────────                                                       │
│ • Google Geocoding → lat/lon, formatted address                             │
│ • Google Places → POI distances, emergency services                         │
│ • Google Distance Matrix → commute times, transit access                    │
│ • Source: "Google Geocode", "Google Places", "Google Distance Matrix"       │
│ • Fields: 64, 81-87, 116                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 3: FREE APIs + TAVILY WEB SEARCH                                       │
│ ─────────────────────────────────────                                       │
│                                                                             │
│ FREE APIs (Parallel):                                                       │
│ • SchoolDigger → school assignments & ratings (63, 65-73)                   │
│ • FBI Crime → crime indices (88-90)                                         │
│ • WalkScore → walk/transit/bike scores (74-80)                              │
│ • FEMA NFHL → flood zone (119-120)                                          │
│ • AirNow → air quality (117-118)                                            │
│ • HowLoud → noise level (78, 129)                                           │
│ • OpenWeatherMap → climate data (121)                                       │
│ • U.S. Census → demographics                                                │
│                                                                             │
│ TAVILY WEB SEARCH (After Free APIs):                                        │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ tavily-search.ts - runTavilyTier3()                                     │ │
│ │                                                                         │ │
│ │ Executes 5 parallel searches:                                           │ │
│ │                                                                         │ │
│ │ 1. searchAVMs(address)                                                  │ │
│ │    └─ site:zillow.com → 16a_zestimate                                   │ │
│ │    └─ site:redfin.com → 16b_redfin_estimate                             │ │
│ │                                                                         │ │
│ │ 2. searchMarketStats(city, zip)                                         │ │
│ │    └─ median home price → 91_median_home_price_neighborhood             │ │
│ │    └─ price per sqft → 92_price_per_sqft_recent_avg                     │ │
│ │    └─ days on market → 95_days_on_market_avg                            │ │
│ │                                                                         │ │
│ │ 3. searchUtilities(city, state)                                         │ │
│ │    └─ electric provider → 104_electric_provider                         │ │
│ │    └─ water provider → 106_water_provider                               │ │
│ │    └─ natural gas → 109_natural_gas                                     │ │
│ │                                                                         │ │
│ │ 4. searchPermits(address, county)                                       │ │
│ │    └─ roof permits → 60_permit_history_roof                             │ │
│ │    └─ HVAC permits → 61_permit_history_hvac                             │ │
│ │                                                                         │ │
│ │ 5. searchPortalViews(address)                                           │ │
│ │    └─ Zillow views → 169_zillow_views                                   │ │
│ │    └─ Redfin views → 170_redfin_views                                   │ │
│ │    └─ Homes.com views → 171_homes_views                                 │ │
│ │    └─ Realtor.com views → 172_realtor_views                             │ │
│ │    └─ Saves/favorites → 174_saves_favorites                             │ │
│ │                                                                         │ │
│ │ Returns: { field_key: { value, source: "Tavily", confidence } }         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ All Tier 3 fields → arbitrationPipeline.addFieldsFromSource()               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 4: WEB-SEARCH LLMs (6 LLMs in sequence)                                │
│ ───────────────────────────────────────────                                 │
│                                                                             │
│ Each LLM prompt NOW includes:                                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ PRIOR DATA SOURCES (already ran BEFORE you):                            │ │
│ │ - Tier 3: Tavily Web Search, SchoolDigger, FBI Crime, WalkScore, etc.   │ │
│ │ - Tier 4 LLMs: [previous LLMs in chain]                                 │ │
│ │ You ONLY search for fields that prior sources did NOT find.             │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ Cascade Order:                                                              │
│                                                                             │
│ 1. PERPLEXITY (sonar-reasoning-pro)                                         │
│    ├─ Prompt A: Listing portals, AVMs, neighborhood pricing                 │
│    ├─ Prompt B: County records, permits, legal                              │
│    ├─ Prompt C: Schools, walkability, crime                                 │
│    ├─ Prompt D: Utilities, connectivity, structure ages                     │
│    ├─ Prompt E: Comparable sales, financing                                 │
│    └─ Prompt F: EV charging, smart home, views/saves                        │
│                                                                             │
│ 2. GEMINI (gemini-3-pro-preview + Google Search)                            │
│    └─ 47 high-velocity fields with web grounding                            │
│                                                                             │
│ 3. GPT (gpt-4o + web_search tool)                                           │
│    └─ Web-evidence mode with source citations                               │
│                                                                             │
│ 4. CLAUDE SONNET (claude-sonnet-4-5 + web_search)                           │
│    └─ 47 high-velocity fields with web search beta                          │
│                                                                             │
│ 5. GROK (grok-4-1-fast)                                                     │
│    └─ Uses Tavily as web search backend for tool calls                      │
│                                                                             │
│ Each LLM → arbitrationPipeline.addFieldsFromSource()                        │
│ Arbitration: First valid value wins (Tier 1 > Tier 2 > Tier 3 > Tier 4)     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 5: CLAUDE OPUS (Deep Reasoning, NO Web Search)                         │
│ ──────────────────────────────────────────────────                          │
│ • Uses training knowledge ONLY                                              │
│ • Fires LAST as final fallback                                              │
│ • Explicitly forbidden from guessing live data                              │
│ • Good for: static facts, property type determination                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ OUTPUT: arbitrationPipeline.getResult()                                     │
│ ───────────────────────────────────────                                     │
│ {                                                                           │
│   fields: { [fieldKey]: { value, source, confidence } },                    │
│   source_breakdown: { "Stellar MLS": 45, "Tavily": 8, "Perplexity": 12 },  │
│   conflicts: [...],                                                         │
│   total_fields_found: 138                                                   │
│ }                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## How Tavily Does NOT Interfere with LLMs

### 1. Tavily runs BEFORE LLMs
```
Timeline:
  t=0    → Tier 1: MLS
  t=5s   → Tier 2: Google APIs
  t=10s  → Tier 3: Free APIs (parallel)
  t=15s  → Tier 3: TAVILY (after Free APIs)  ← Tavily here
  t=20s  → Tier 4: Perplexity  ← LLMs start here
  t=30s  → Tier 4: Gemini
  t=40s  → Tier 4: GPT
  ...
```

### 2. Arbitration Pipeline Prevents Overwrites
```typescript
// In arbitration.ts:
addFieldsFromSource(fields, sourceName) {
  for (const [key, value] of Object.entries(fields)) {
    if (!this.fields[key]) {  // ONLY add if field is EMPTY
      this.fields[key] = value;
      this.fields[key].source = sourceName;
    }
    // If field already exists, it's SKIPPED (first wins)
  }
}
```

### 3. LLM Prompts Know About Prior Sources
All 6 LLM prompts now include:
```
PRIOR DATA SOURCES (already ran BEFORE you):
- Tier 3: Tavily Web Search, SchoolDigger, FBI Crime, WalkScore, FEMA, etc.
You ONLY search for fields that prior sources did NOT find.
```

This prevents:
- Duplicate web searches for same data
- LLMs wasting tokens on already-found fields
- Conflicting values from multiple sources

### 4. Source Attribution is Preserved
```typescript
// Each Tavily field includes source:
{
  "16a_zestimate": {
    "value": 485000,
    "source": "Tavily (Zillow)",  // Clear attribution
    "confidence": "Medium"
  }
}

// LLM fields use LLM name:
{
  "91_median_home_price_neighborhood": {
    "value": 520000,
    "source": "Perplexity",
    "confidence": "High"
  }
}
```

## Tavily API Call Flow

```
┌──────────────┐     POST https://api.tavily.com/search
│              │     {
│   search.ts  │──────► api_key: TAVILY_API_KEY,
│              │        query: "site:zillow.com '123 Main St' Zestimate",
└──────────────┘        max_results: 5,
       │                search_depth: "basic"
       │              }
       │
       │         ┌──────────────────────────────────────────────┐
       │         │ Tavily API Response:                         │
       │◄────────┤ {                                            │
                 │   results: [                                 │
                 │     { title: "123 Main St - Zillow",         │
                 │       url: "https://zillow.com/...",         │
                 │       content: "Zestimate: $485,000...",     │
                 │       score: 0.95 }                          │
                 │   ],                                         │
                 │   answer: "The Zestimate for this..."        │
                 │ }                                            │
                 └──────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ tavily-search.ts - Value Extraction:                             │
│                                                                  │
│ // Parse Zestimate from content                                  │
│ const match = content.match(/Zestimate[:\s]*\$?([\d,]+)/i);      │
│ if (match) {                                                     │
│   fields['16a_zestimate'] = {                                    │
│     value: parseInt(match[1].replace(/,/g, '')),  // 485000      │
│     source: 'Tavily (Zillow)',                                   │
│     confidence: 'Medium'                                         │
│   };                                                             │
│ }                                                                │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ arbitrationPipeline.addFieldsFromSource(tavilyFields, 'Tavily')  │
│                                                                  │
│ Field added to master collection:                                │
│ this.fields['16a_zestimate'] = {                                 │
│   value: 485000,                                                 │
│   source: 'Tavily (Zillow)',                                     │
│   confidence: 'Medium'                                           │
│ };                                                               │
└──────────────────────────────────────────────────────────────────┘
```

## Files Modified for Tavily Integration

| File | Changes |
|------|---------|
| `api/property/tavily-search.ts` | NEW - Tavily client |
| `api/property/search.ts` | Tier 3 execution + LLM prompt updates |
| `api/property/retry-llm.ts` | All 5 LLM prompts updated |
| `api/property/perplexity-prompts.ts` | System prompt + Prompt F |
| `src/config/gemini-prompts.ts` | Firing order context |
| `api/property/source-constants.ts` | TAVILY_SOURCE constant |
| `api/property/llm-constants.ts` | TAVILY_CONFIG |
| `src/lib/field-normalizer.ts` | VALID_SOURCES array |
| `api/property/search-stream.ts` | SSE source list |
| `api/property/search-by-mls.ts` | Header documentation |

## Field Mappings (Tavily → Schema)

| Tavily Search | Field Key | Description |
|---------------|-----------|-------------|
| searchAVMs | 16a_zestimate | Zillow Zestimate |
| searchAVMs | 16b_redfin_estimate | Redfin Estimate |
| searchMarketStats | 91_median_home_price_neighborhood | Median price |
| searchMarketStats | 92_price_per_sqft_recent_avg | Price/sqft |
| searchMarketStats | 95_days_on_market_avg | DOM |
| searchUtilities | 104_electric_provider | Electric |
| searchUtilities | 106_water_provider | Water |
| searchUtilities | 109_natural_gas | Gas |
| searchPermits | 60_permit_history_roof | Roof permits |
| searchPermits | 61_permit_history_hvac | HVAC permits |
| searchPortalViews | 169_zillow_views | Zillow views |
| searchPortalViews | 170_redfin_views | Redfin views |
| searchPortalViews | 171_homes_views | Homes.com views |
| searchPortalViews | 172_realtor_views | Realtor views |
| searchPortalViews | 174_saves_favorites | Total saves |
