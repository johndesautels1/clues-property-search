# COMPLETE API INVENTORY - CLUES Property Dashboard
**Generated:** 2025-12-31
**Purpose:** Comprehensive audit of ALL integrated APIs in codebase

---

## TIER 1: STELLAR MLS (1 API)

| # | API Name | Status | Env Variable | Fields Populated | File |
|---|----------|--------|--------------|------------------|------|
| 1 | **Bridge Interactive MLS API** | ✅ ACTIVE | `BRIDGE_API_KEY`, `BRIDGE_API_USERNAME`, `BRIDGE_API_PASSWORD` | ~85 fields (2-5, 10, 13-34, 44, 59-62, 104-168) | `api/property/bridge-mls.ts` |

---

## TIER 2: GOOGLE APIS (4 APIs)

| # | API Name | Status | Env Variable | Fields Populated | Called In |
|---|----------|--------|--------------|------------------|-----------|
| 2 | **Google Geocoding API** | ✅ ACTIVE | `GOOGLE_MAPS_API_KEY` | 1, 6, 7, 8 (address, neighborhood, county, zip) | `enrichWithFreeAPIs()` |
| 3 | **Google Places API** | ✅ ACTIVE | `GOOGLE_MAPS_API_KEY` | 74-87 (WalkScore, distances to POIs) | `enrichWithFreeAPIs()` |
| 4 | **Google Street View API** | ✅ ACTIVE | `GOOGLE_MAPS_API_KEY` | Property front photo (fallback if MLS has none) | `callGoogleStreetView()` |
| 5 | **Google Solar API** | ✅ ACTIVE | `GOOGLE_MAPS_API_KEY` | 131 (solar_potential_kwh_year) | `callGoogleSolarAPI()` |

---

## TIER 3: FREE/PAID THIRD-PARTY APIS (17 APIs)

### Active & Working (15 APIs)

| # | API Name | Status | Env Variable | Fields Populated | Called In |
|---|----------|--------|--------------|------------------|-----------|
| 6 | **WalkScore API** | ✅ ACTIVE | `WALKSCORE_API_KEY` | 74, 75, 76 (walk/transit/bike scores) | `getWalkScore()` |
| 7 | **FEMA Flood Zones** | ✅ ACTIVE | None (public) | 119 (flood_zone) | `getFloodZone()` |
| 8 | **AirNow API** | ✅ ACTIVE | `AIRNOW_API_KEY` | 117 (air_quality_index) | `getAirQuality()` |
| 9 | **SchoolDigger API** | ✅ ACTIVE | `SCHOOLDIGGER_API_KEY`, `SCHOOLDIGGER_APP_ID` | 63, 65-73 (school district, names, ratings, distances) | `callSchoolDigger()` |
| 10 | **HowLoud Noise API** | ✅ ACTIVE | `HOWLOUD_API_KEY` | 129 (noise_score) | `callHowLoud()` |
| 11 | **FBI Crime Data API** | ✅ ACTIVE | `FBI_CRIME_API_KEY` | 88, 89, 90 (violent/property crime, safety rating) | `callCrimeGrade()` |
| 12 | **OpenWeatherMap / Weather.com** | ✅ ACTIVE | `OPENWEATHERMAP_API_KEY` or `WEATHER_API_KEY` | 121 (current_weather_summary) | `callWeather()` |
| 13 | **U.S. Census API** | ✅ ACTIVE | `CENSUS_API_KEY` | 100 (vacancy_rate) | `getCensusData()` |
| 14 | **FEMA Risk Index** | ✅ ACTIVE | None (public) | 118-119 (natural_hazard_risk, flood_zone_detail) | `callFEMARiskIndex()` |
| 15 | **NOAA Climate Data** | ✅ ACTIVE | None (public) | 120-126 (climate risks, hurricane risk, sea level rise) | `callNOAAClimate()` |
| 16 | **NOAA Storm Events** | ✅ ACTIVE | None (public) | Storm history (hurricanes, tornadoes) | `callNOAAStormEvents()` |
| 17 | **NOAA Sea Level Rise** | ✅ ACTIVE | None (public) | Sea level change predictions | `callNOAASeaLevel()` |
| 18 | **USGS Elevation API** | ✅ ACTIVE | None (public) | 64 (elevation_feet) | `callUSGSElevation()` |
| 19 | **USGS Earthquake API** | ✅ ACTIVE | None (public) | 123 (earthquake_risk_score) | `callUSGSEarthquake()` |
| 20 | **EPA FRS (Superfund Sites)** | ✅ ACTIVE | None (public) | 127 (superfund_proximity_mi) | `callEPAFRS()` |
| 21 | **EPA Radon Data** | ✅ ACTIVE | None (public) | 128 (radon_zone) | `getRadonRisk()` |

### Disabled / Not Working (2 APIs)

| # | API Name | Status | Env Variable | Reason Disabled | File |
|---|----------|--------|--------------|----------------|------|
| 22 | **Redfin Property API** | ❌ DISABLED | `RAPIDAPI_KEY`, `RAPIDAPI_HOST` | RapidAPI scraper blocked/returns dummy data | `callRedfinProperty()` (commented out) |
| 23 | **HUD Fair Market Rent** | ❌ DISABLED | `HUD_API_KEY` | Geo-blocked outside US / not reliable | `callHudFairMarketRent()` (not called) |
| 24 | **AirDNA** | ❌ NOT WIRED | `AIRDNA_API_KEY` | Function exists but never called | `callAirDNA()` (not called) |
| 25 | **BroadbandNow** | ❌ NOT WIRED | None | Function exists but never called | `callBroadbandNow()` (not called) |

---

## TIER 4-5: LLM CASCADE (6 LLMs)

| # | LLM Name | Status | Env Variable | Model | Web Search? | Tier | Timeout |
|---|----------|--------|--------------|-------|-------------|------|---------|
| 26 | **Perplexity** | ✅ ACTIVE | `PERPLEXITY_API_KEY` | `sonar-pro` | ✅ YES | 4 | 225s |
| 27 | **Grok (xAI)** | ✅ ACTIVE | `XAI_API_KEY` | `grok-4` | ✅ YES | 5 | 210s |
| 28 | **Claude Opus** | ✅ ACTIVE | `ANTHROPIC_API_KEY` | `claude-opus-4` | ❌ NO | 5 | 210s |
| 29 | **GPT (OpenAI)** | ✅ ACTIVE | `OPENAI_API_KEY` | `gpt-5.2` | ❌ NO | 5 | 210s |
| 30 | **Claude Sonnet** | ✅ ACTIVE | `ANTHROPIC_API_KEY` | `claude-sonnet-4.5` | ❌ NO | 5 | 210s |
| 31 | **Gemini (Google)** | ✅ ACTIVE | `GOOGLE_GENERATIVE_AI_API_KEY` | `gemini-pro` | ❌ NO | 5 | 210s |

---

## SUMMARY

**Total APIs Integrated:** 31 APIs (1 MLS + 4 Google + 17 Free/Paid + 6 LLMs + 3 disabled/not wired)

**Active & Working:** 27 APIs
- 1 MLS API (Stellar via Bridge)
- 4 Google APIs (Geocode, Places, Street View, Solar)
- 15 Free/Paid APIs (WalkScore, SchoolDigger, FBI Crime, NOAA, USGS, EPA, etc.)
- 6 LLMs (Perplexity, Grok, Claude Opus, GPT, Claude Sonnet, Gemini)
- 1 Backend Calculation Engine (11 derived fields)

**Disabled/Not Working:** 4 APIs
- Redfin (blocked by anti-bot)
- HUD (geo-blocked)
- AirDNA (not wired)
- BroadbandNow (not wired)

---

## EXECUTION ORDER (search.ts)

**Step 1:** Bridge MLS (Tier 1)
**Step 2:** All 21 Free/Paid APIs in parallel (Tier 2-3)
**Step 3:** 6 LLMs in parallel, processed sequentially (Tier 4-5)
**Step 4:** Backend calculations (Tier 1)
**Step 5:** Arbitration & final result

---

## WHY SCHOOLDIGGER FIELDS 66, 69, 72 MAY BE NULL

**SchoolDigger IS active and IS being called.**

**Possible reasons for NULL ratings:**

1. **API returned schools without ratings**
   - `elementary.rankHistory?.[0]?.rank || elementary.schoolDiggerRank` may be undefined
   - School exists but has no ranking data in SchoolDigger's database

2. **No schools found within 5-mile radius**
   - API search radius: `distanceMiles=5`
   - Property may be in rural/beach area with no nearby schools

3. **API rate limit or error**
   - Check Vercel logs for SchoolDigger API errors
   - May need higher tier plan for consistent data

4. **School level mismatch**
   - Logic filters by `school.schoolLevel === 'Elementary'` etc.
   - Schools may not have correct level tags in API response

**Next Steps to Debug:**
1. Check Vercel logs for SchoolDigger API response for Property 3
2. Verify `SCHOOLDIGGER_API_KEY` and `SCHOOLDIGGER_APP_ID` are set in Vercel
3. Check if API is returning schools but missing rating fields
4. Consider fallback to GreatSchools API if SchoolDigger has gaps
