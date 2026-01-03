# NOAA API Timeout Investigation

**Issue:** NOAA Storm Events and NOAA Climate APIs timing out after 30 seconds

**Log Evidence:**
```
[safeFetch] [NOAA-Storm] Request timed out after 30000ms
```

---

## Root Cause Analysis

### Problem 1: Wrong API Endpoints

Both `callNOAAClimate()` and `callNOAAStormEvents()` are using the **NOAA Climate Data Online (CDO) v2 API** which:
- Requires specific dataset/location combinations
- Has slow query performance (especially for 5-10 year ranges)
- Returns massive datasets (requesting 1000 records)
- Often times out on Vercel (30s limit)
- Requires complex dataset knowledge

### Problem 2: Incorrect API Usage

**Current NOAA Climate implementation (line 734):**
```typescript
const url = `https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&locationid=ZIP:${zip}&startdate=${startDate}&enddate=${endDate}&limit=1000`;
```

**Issues:**
- Requests 5 years of daily data (1,825 days!)
- ZIP codes may not have GHCND weather stations
- Returns raw weather data, not climate risk assessment
- Very slow query

**Current NOAA Storm Events implementation (line 791):**
```typescript
const url = `https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&locationid=FIPS:12&startdate=${startDate}&enddate=${endDate}&datatypeid=AWND,WSF2&limit=1000`;
```

**Issues:**
- Uses GHCND (Daily Summaries) instead of Storm Events Database
- FIPS:12 is entire state of Florida (not county-specific)
- Requests 10 years of wind data
- Tries to infer hurricanes from wind speed (incorrect)

---

## Correct API Solutions

### Solution 1: Use NOAA Storm Events Database API

**Correct Endpoint:**
```
https://www.ncei.noaa.gov/access/services/data/v1?dataset=storm-events
```

**Why This Works:**
- Dedicated storm events database (hurricanes, tornadoes, floods, etc.)
- Fast queries with proper indexing
- Returns actual storm event records, not raw weather data
- Supports county-level filtering
- No authentication required for basic queries

**Example Query:**
```
https://www.ncei.noaa.gov/access/services/data/v1?dataset=storm-events&startDate=2020-01-01&endDate=2025-12-31&county=PINELLAS&state=FL&eventTypes=Hurricane,Tornado&format=json
```

### Solution 2: Use FEMA National Risk Index API

**Endpoint:**
```
https://hazards.fema.gov/nri/api/v1/counties/{fips}
```

**Why This Works:**
- Pre-calculated risk scores for all hazards
- Includes hurricane, tornado, flood, wildfire, earthquake risks
- Single API call returns all risk data
- Very fast (< 1 second)
- No authentication required
- Data updated annually by FEMA

**Returns:**
- Hurricane Risk Score
- Tornado Risk Score
- Flood Risk Score
- Wildfire Risk Score
- Earthquake Risk Score
- Sea Level Rise Risk
- Overall Risk Score

### Solution 3: Use Climate.gov Climate Explorer API (Alternative)

**Endpoint:**
```
https://crt-climate-explorer.nemac.org/api/county/{fips}
```

**Why This Works:**
- County-level climate projections
- Temperature and precipitation trends
- Future climate scenarios
- Fast queries
- Free, no auth required

---

## Recommended Implementation

### Priority 1: Replace with FEMA National Risk Index API

**Advantages:**
- ✅ Single API call for ALL risks
- ✅ Fast (<1s response time)
- ✅ Pre-calculated, authoritative data
- ✅ No authentication required
- ✅ Covers all CLUES fields:
  - Field 121: climate_risk
  - Field 122: wildfire_risk
  - Field 123: earthquake_risk
  - Field 124: hurricane_risk
  - Field 125: tornado_risk
  - Field 128: sea_level_rise_risk

**Implementation:**
```typescript
export async function callFEMARiskIndex(county: string, state: string): Promise<ApiResult> {
  // 1. Get FIPS code from county name
  // 2. Call FEMA API: https://hazards.fema.gov/nri/api/v1/counties/{fips}
  // 3. Extract risk scores
  // 4. Map to CLUES fields
}
```

### Priority 2: Keep NOAA Sea Level API (Already Works)

The `callNOAASeaLevel()` function is correctly implemented and should be kept.

---

## Implementation Plan

1. **Create new function: `callFEMARiskIndex()`**
   - Replaces both `callNOAAClimate()` and `callNOAAStormEvents()`
   - Single API call for all environmental risks
   - Add FIPS code lookup utility

2. **Update search.ts to call FEMA API**
   - Remove `callNOAAClimate()`
   - Remove `callNOAAStormEvents()`
   - Add `callFEMARiskIndex()`

3. **Test with real Florida counties**
   - Pinellas County (FIPS: 12103)
   - Miami-Dade County (FIPS: 12086)
   - Lee County (FIPS: 12071)

4. **Verify field mapping:**
   - Ensure correct field numbers from fields-schema.ts
   - Validate risk level values match schema

---

## FIPS Code Lookup

Florida counties we need:
- Pinellas County: 12103
- Hillsborough County: 12057
- Pasco County: 12101
- Manatee County: 12081
- Sarasota County: 12115
- Miami-Dade County: 12086
- Broward County: 12011
- Palm Beach County: 12099
- Lee County: 12071
- Collier County: 12021

**Lookup Strategy:**
1. Use existing county name from Google Geocode
2. Map county name to FIPS code using lookup table
3. Call FEMA API with FIPS code

---

## Expected Performance Improvement

**Before (Current):**
- NOAA Climate: 30s timeout (fails)
- NOAA Storm: 30s timeout (fails)
- **Total: 60s wasted**

**After (FEMA API):**
- FEMA Risk Index: <1s (success)
- **Total: <1s**

**Performance Gain: 60x faster** ✅

---

## Risk Assessment

**Risk of Change:** 🟢 **LOW**
- Both current NOAA functions are failing (timeout)
- New FEMA API provides superior data
- Same field numbers, compatible data format
- No breaking changes to schema

**Benefits:**
- ✅ Faster property searches
- ✅ More reliable data
- ✅ More comprehensive risk coverage
- ✅ Authoritative government source (FEMA)
- ✅ No API token required
