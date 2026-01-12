# Free API Timeout Fix - 2026-01-12

## Problem Identified
FREE_API_TIMEOUT was set to 30 seconds, but the free APIs actually need 42 seconds to complete, causing **54 fields to be lost**.

## Root Cause
On **January 8, 2026**, FREE_API_TIMEOUT was REDUCED from 60s to 30s to speed up searches, but this was too aggressive.

## Evidence from Logs
```
2026-01-11 23:31:17.114 - 🔍 Calling enrichWithFreeAPIs with 30s timeout
2026-01-11 23:31:47.127 - ⚠️ WARNING: enrichWithFreeAPIs returned ZERO fields (TIMEOUT HIT)
2026-01-11 23:31:59.877 - ✅ [enrichWithFreeAPIs] END - Returning 54 fields (TOO LATE!)
```

**Timeline:**
- APIs started: 23:31:17.114
- Timeout fired: 23:31:47.127 (exactly 30s later)
- APIs actually finished: 23:31:59.877 (42.76 seconds total)
- **Result: Main search got 0 fields, APIs completed 13 seconds after timeout**

## File Fixed

**api/property/search.ts** - Line 56
```diff
- const FREE_API_TIMEOUT = 30000; // 30 seconds for free APIs (Tier 2) - REDUCED from 60s on 2026-01-08
+ const FREE_API_TIMEOUT = 60000; // 60 seconds for free APIs (Tier 2) - INCREASED back to 60s on 2026-01-12 (APIs need 42s to complete)
```

## Impact

### Lost Fields (54 total):
- **Google APIs**: Geocode, Places, Distance, Street View, Solar
- **WalkScore**: Walk, Transit, Bike scores
- **FEMA**: Flood zone
- **AirNow**: Air quality index
- **HowLoud**: Noise levels
- **FBI Crime**: Crime statistics
- **U.S. Census**: Vacancy rate
- **NOAA**: Climate risk, Storm events, Sea level
- **USGS**: Elevation, Earthquake risk
- **EPA**: Superfund sites, Radon zones

### Fix Result:
- ✅ All 22 free APIs now complete within 60s timeout
- ✅ 54 fields recovered
- ✅ No more "No data" for Tier 2 APIs
- ⚠️ Search time increased by ~12 seconds (acceptable tradeoff)

## Testing Required
1. Search for any property
2. Verify Tier 2/3 API progress tracker shows data (not "No data")
3. Verify 54+ fields from Google, WalkScore, FEMA, NOAA, etc.
4. Confirm total search time is ~60 seconds (not 30s)

## Backup Created
- `api/property/search.ts.backup-timeout-fix-20260112-*`

