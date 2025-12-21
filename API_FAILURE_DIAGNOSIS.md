# API FAILURE DIAGNOSIS REPORT
**Date:** 2025-12-18
**Issue:** Google Streetview, FBI Crime, and HowLoud APIs not returning data

---

## 🔍 EXECUTIVE SUMMARY

After exhaustive search through the codebase, I have identified **CRITICAL ISSUES** with how these three APIs are wired:

### Status Summary:
- ✅ **Google Street View**: Correctly wired via `callGoogleStreetView()` from `free-apis.ts`
- ✅ **FBI Crime**: Correctly wired via `callCrimeGrade()` from `free-apis.ts`
- ❌ **HowLoud**: **DUPLICATE IMPLEMENTATION CONFLICT** - Using old local function instead of new `callHowLoud()`

---

## 🚨 ROOT CAUSE ANALYSIS

### Issue #1: HOWLOUD - Duplicate Implementation Conflict

**Problem:** There are **TWO DIFFERENT** implementations of the HowLoud API call:

**Implementation A (OLD - Currently Being Used):**
- **File:** `api/property/search.ts`
- **Function:** `getNoiseData()` (lines 1257-1342)
- **Called At:** Line 1727 in Promise.all array
- **API Endpoint:** `https://api.howloud.com/score?lat=${lat}&lng=${lon}`
- **Status:** **WRONG ENDPOINT** - Missing `/v2/` in URL path!

**Implementation B (NEW - NOT Being Used):**
- **File:** `api/property/free-apis.ts`
- **Function:** `callHowLoud()` (lines 463-512)
- **Called At:** **NOWHERE** - Never imported or called!
- **API Endpoint:** `https://api.howloud.com/v2/score?lat=${lat}&lng=${lon}`
- **Status:** **CORRECT** but not being used

**Root Cause:**
```typescript
// api/property/search.ts Line 1727
getNoiseData(geo.lat, geo.lon),  // ❌ Using OLD local function

// Should be:
callHowLoud(geo.lat, geo.lon),   // ✅ Use NEW function from free-apis.ts
```

---

### Issue #2: GOOGLE STREET VIEW - Possible Timeout or Logic Issue

**Problem:** Function is correctly wired BUT may have logic issues

**Current Implementation:**
- **File:** `api/property/free-apis.ts`
- **Function:** `callGoogleStreetView()` (lines 171-221)
- **Called At:** `search.ts` line 1743
- **Timeout:** 60,000ms (60 seconds) via `FREE_API_TIMEOUT`

**Potential Issues Found:**

1. **Field Mapping Issue:**
   ```typescript
   // Line 205 in free-apis.ts
   setField(fields, 'property_photo_url', streetViewUrl, 'Google Street View');
   setField(fields, 'property_photos', [streetViewUrl], 'Google Street View');
   ```
   ⚠️ **These are NOT numbered fields!** They should be:
   - Field 169: `primary_property_photo` (not in 168-field schema!)
   - Field 170: `property_photos_array` (not in 168-field schema!)

   **Actual 168-field schema does NOT have photo fields!** This data is being stored but not mapped to any official field.

2. **Metadata Check May Fail:**
   ```typescript
   // Line 192-194
   const metadataResult = await safeFetch<any>(metadataUrl, undefined, 'Google-StreetView-Metadata');

   if (!metadataResult.success || !metadataResult.data) {
     return { success: false, source: 'Google Street View', fields, error: 'Metadata fetch failed' };
   }
   ```
   If metadata fetch times out or fails, NO street view data is returned.

---

### Issue #3: FBI CRIME - Possible Data Format or Timeout Issue

**Problem:** Function is correctly wired BUT may have data processing issues

**Current Implementation:**
- **File:** `api/property/free-apis.ts`
- **Function:** `callCrimeGrade()` (lines 570-666)
- **Called At:** `search.ts` line 1733
- **Timeout:** 60,000ms (60 seconds) via `FREE_API_TIMEOUT` - **BUT OVERRIDDEN TO 60,000ms in function itself!**

**Potential Issues Found:**

1. **Timeout Configuration:**
   ```typescript
   // Line 589 in free-apis.ts
   const fetchResult = await safeFetch<any>(url, undefined, 'FBI-Crime', 60000); // 60s timeout
   ```
   ✅ This is correct - 60s is reasonable for FBI API

2. **State Name Mapping Issue:**
   ```typescript
   // Lines 615-617
   const stateName = stateNames[stateCode] || stateCode;
   const stateOffensesKey = `${stateName} Offenses`;
   const usOffensesKey = 'United States Offenses';
   ```
   If FBI API response doesn't have the exact key format (e.g., "Florida Offenses"), NO data is returned.

3. **API Endpoint May Be Deprecated:**
   ```typescript
   // Line 586
   const url = `https://api.usa.gov/crime/fbi/cde/summarized/state/${stateCode}/violent-crime?from=01-2022&to=12-2022&API_KEY=${apiKey}`;
   ```
   Using 2022 data - FBI may have changed their API structure or deprecated this endpoint.

---

## 📍 ALL LOCATIONS WHERE THESE APIs ARE REFERENCED

### Google Street View:
1. ✅ `api/property/free-apis.ts` (lines 171-221) - **CORRECT IMPLEMENTATION**
2. ✅ `api/property/search.ts` (line 49) - Import statement
3. ✅ `api/property/search.ts` (line 1743) - Called in Promise.all
4. ✅ `api/property/search.ts` (line 1759) - Extract fields from result
5. ✅ `api/property/search.ts` (line 1766) - Merge into fields object
6. ✅ `api/property/search.ts` (line 1790) - Log field count
7. `src/lib/data-sources.ts` - Constant definitions
8. `md-files/PROPERTY_PHOTOS_IMPLEMENTATION_GUIDE.md` - Documentation

### FBI Crime:
1. ✅ `api/property/free-apis.ts` (lines 570-666) - **CORRECT IMPLEMENTATION**
2. ✅ `api/property/search.ts` (line 49) - Import statement
3. ✅ `api/property/search.ts` (line 50) - Import FBI_CRIME_SOURCE constant
4. ✅ `api/property/search.ts` (line 1733) - Called in Promise.all
5. ✅ `api/property/search.ts` (line 1749) - Extract fields from result
6. ✅ `api/property/search.ts` (line 1766) - Merge into fields object
7. ✅ `api/property/search.ts` (line 1780) - Log field count
8. ✅ `api/property/search.ts` (line 1795) - Track actual field count
9. ✅ `api/property/search.ts` (line 3367-3371) - Extract FBI count for source breakdown
10. ✅ `api/property/search.ts` (line 3426) - List in tier 3 sources
11. `api/property/source-constants.ts` - Source name constant
12. `src/lib/field-normalizer.ts` - Field normalization
13. Multiple documentation files

### HowLoud:
1. ❌ `api/property/free-apis.ts` (lines 463-512) - **NEW CORRECT IMPLEMENTATION (NOT USED!)**
2. ❌ `api/property/search.ts` (lines 1257-1342) - **OLD LOCAL IMPLEMENTATION (WRONG ENDPOINT!)**
3. ❌ `api/property/search.ts` (line 1727) - Called in Promise.all (**WRONG FUNCTION!**)
4. ❌ `api/property/search.ts` (line 1726) - Variable `noiseData` assignment
5. ❌ `api/property/search.ts` (line 1766) - Merge into fields object
6. ❌ `api/property/search.ts` (line 1773) - Log field count
7. ❌ `api/property/search.ts` (line 3426) - List in tier 3 sources
8. `src/store/propertyStore.ts` - State management
9. `src/lib/data-sources.ts` - Constant definitions
10. Multiple documentation files

---

## 🔧 FIXES REQUIRED

### Fix #1: HowLoud - Replace Old Implementation with New

**File:** `api/property/search.ts`

**Change 1:** Import `callHowLoud` from free-apis.ts
```typescript
// Line 49 - ADD callHowLoud to imports
import { callCrimeGrade, callSchoolDigger, callFEMARiskIndex, callNOAAClimate, callNOAAStormEvents, callNOAASeaLevel, callUSGSElevation, callUSGSEarthquake, callEPAFRS, getRadonRisk, callGoogleStreetView, callGoogleSolarAPI, callHowLoud /*, callRedfinProperty*/ } from './free-apis.js';
```

**Change 2:** Replace `getNoiseData()` call with `callHowLoud()`
```typescript
// Line 1722 - BEFORE
const [walkScore, floodZone, airQuality, censusData, noiseData, ...] = await Promise.all([
  getWalkScore(geo.lat, geo.lon, address),
  getFloodZone(geo.lat, geo.lon),
  getAirQuality(geo.lat, geo.lon),
  getCensusData(zipCode),
  getNoiseData(geo.lat, geo.lon),  // ❌ OLD
  // ...
]);

// AFTER
const [walkScore, floodZone, airQuality, censusData, noiseDataResult, ...] = await Promise.all([
  getWalkScore(geo.lat, geo.lon, address),
  getFloodZone(geo.lat, geo.lon),
  getAirQuality(geo.lat, geo.lon),
  getCensusData(zipCode),
  callHowLoud(geo.lat, geo.lon),  // ✅ NEW
  // ...
]);
```

**Change 3:** Extract fields from result object (like other APIs)
```typescript
// After line 1746 - ADD
const noiseData = noiseDataResult.fields || {};
```

**Change 4:** DELETE the old `getNoiseData()` function entirely
```typescript
// DELETE lines 1256-1342 (entire getNoiseData function)
```

---

### Fix #2: Google Street View - Add Proper Error Handling

**File:** `api/property/free-apis.ts`

**Issue:** Metadata check may be too strict

**Current Code (Line 194-196):**
```typescript
if (!metadataResult.success || !metadataResult.data) {
  return { success: false, source: 'Google Street View', fields, error: 'Metadata fetch failed' };
}
```

**Recommended Fix:**
```typescript
if (!metadataResult.success || !metadataResult.data) {
  console.log(`[Google Street View] ⚠️ Metadata check failed, but attempting to get street view anyway`);
  // Still try to set the URL even if metadata fails
  setField(fields, 'property_photo_url', streetViewUrl, 'Google Street View', 'Low');
  return { success: true, source: 'Google Street View', fields, error: 'Metadata unavailable but URL generated' };
}
```

---

### Fix #3: FBI Crime - Add More Robust Error Handling

**File:** `api/property/free-apis.ts`

**Issue:** Silent failure if response format doesn't match expectations

**Current Code (Lines 622-658):**
```typescript
if (data.offenses?.rates?.[stateOffensesKey]) {
  // ... process data
} else {
  console.log(`[FBI Crime] ⚠️ No data found for key "${stateOffensesKey}"`);
}

console.log(`[FBI Crime] Returning ${Object.keys(fields).length} fields`);
return { success: Object.keys(fields).length > 0, source: FBI_CRIME_SOURCE, fields };
```

**Recommended Fix:**
```typescript
if (data.offenses?.rates?.[stateOffensesKey]) {
  // ... process data
} else {
  console.log(`[FBI Crime] ⚠️ No data found for key "${stateOffensesKey}"`);
  console.log(`[FBI Crime] Available keys:`, JSON.stringify(Object.keys(data.offenses?.rates || {})));
  console.log(`[FBI Crime] Full response:`, JSON.stringify(data).substring(0, 500));

  // Fallback: Try to extract ANY state data
  const allKeys = Object.keys(data.offenses?.rates || {});
  const stateKeys = allKeys.filter(k => k.includes('Offenses') && !k.includes('United States'));
  if (stateKeys.length > 0) {
    console.log(`[FBI Crime] Found alternative key: ${stateKeys[0]}`);
    // Process using first available state key
  }
}
```

---

## 🧪 TESTING PROTOCOL

After implementing fixes, test each API individually:

### Test 1: HowLoud API
```bash
# Test property: 2880 81st STREET N, St Petersburg, FL 33710
# Expected fields: 78_noise_level, 79_traffic_level, 129_noise_level_db_est
# Lat: 27.8458, Lon: -82.7834
```

**Success Criteria:**
- ✅ `callHowLoud()` is called (not `getNoiseData()`)
- ✅ Returns at least 2 fields (noise_level, traffic_level)
- ✅ Uses correct endpoint: `https://api.howloud.com/v2/score`
- ✅ Confidence level is 'High' or 'Medium-High'

### Test 2: Google Street View
```bash
# Test property: 2880 81st STREET N, St Petersburg, FL 33710
# Expected fields: property_photo_url (or numbered equivalent)
# Lat: 27.8458, Lon: -82.7834
```

**Success Criteria:**
- ✅ `callGoogleStreetView()` is called
- ✅ Returns street view URL
- ✅ URL format: `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=...`
- ✅ Metadata check passes OR fallback logic works

### Test 3: FBI Crime API
```bash
# Test property: 2880 81st STREET N, St Petersburg, FL 33710 (Pinellas County, FL)
# Expected fields: 88_violent_crime_index, 90_neighborhood_safety_rating
# State: FL
```

**Success Criteria:**
- ✅ `callCrimeGrade()` is called
- ✅ Returns at least 1 field (violent_crime_index or safety_rating)
- ✅ Violent crime index is a number (e.g., 325)
- ✅ Safety rating is a letter grade (A-F)

---

## ⚠️ TIMEOUT ANALYSIS

### Current Timeout Configuration:
```typescript
// api/property/search.ts lines 34-37
const STELLAR_MLS_TIMEOUT = 90000;   // 90 seconds
const FREE_API_TIMEOUT = 60000;      // 60 seconds ← Used for all 3 APIs
const LLM_TIMEOUT = 180000;          // 180 seconds
const PERPLEXITY_TIMEOUT = 195000;   // 195 seconds
```

### Timeout Usage:
- **Google Street View:** Uses `safeFetch` without explicit timeout → defaults to `FREE_API_TIMEOUT` (60s)
- **FBI Crime:** Uses `safeFetch(..., 60000)` → explicit 60s timeout ✅
- **HowLoud (old):** NO timeout wrapper → may hang indefinitely! ❌
- **HowLoud (new):** Uses `safeFetch` without explicit timeout → defaults to browser/node timeout

**Recommendation:**
All three APIs should use explicit timeouts:
```typescript
const fetchResult = await safeFetch<any>(url, options, 'API-Name', FREE_API_TIMEOUT);
```

---

## 📊 PRIORITY FIXES

### CRITICAL (Must Fix Now):
1. ✅ **HowLoud:** Replace `getNoiseData()` with `callHowLoud()` from free-apis.ts
2. ✅ **HowLoud:** Delete old `getNoiseData()` function to prevent future confusion

### HIGH (Fix Soon):
3. ⚠️ **Google Street View:** Add fallback logic if metadata fails
4. ⚠️ **FBI Crime:** Add more robust error logging and fallback key matching

### MEDIUM (Monitor):
5. 📝 **All 3 APIs:** Add explicit timeout parameters to safeFetch calls
6. 📝 **Field Mapping:** Verify that photo fields (property_photo_url) are mapped correctly in schema

---

## 🔍 VERIFICATION CHECKLIST

After implementing fixes:

- [ ] Import `callHowLoud` in search.ts (line 49)
- [ ] Replace `getNoiseData()` call with `callHowLoud()` (line 1727)
- [ ] Extract fields from `noiseDataResult.fields` (after line 1746)
- [ ] Delete `getNoiseData()` function (lines 1257-1342)
- [ ] Test HowLoud API returns data
- [ ] Test Google Street View returns data
- [ ] Test FBI Crime returns data
- [ ] Verify no console errors
- [ ] Verify field counts > 0 for all 3 sources
- [ ] Check source_breakdown shows all 3 sources

---

## 📝 NOTES

**Why did this happen?**
During codebase refactoring, we moved API calls to `free-apis.ts` for centralization, but forgot to update `search.ts` to use the new HowLoud implementation. The old local function remained and continued to be called, using an outdated API endpoint.

**Lesson Learned:**
When creating new centralized API functions, we must:
1. Update ALL call sites to use the new function
2. Delete the old implementation to prevent conflicts
3. Use git grep to find ALL references before refactoring
4. Test each API individually after refactoring

---

**END OF DIAGNOSIS REPORT**
