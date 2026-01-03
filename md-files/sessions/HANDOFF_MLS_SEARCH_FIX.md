# MLS Search Manual Tab - Handoff Document
**Date:** December 29, 2025
**Session Duration:** ~5.5 hours
**Status:** BROKEN - Requires immediate fix

---

## 🔴 CRITICAL ISSUE

**User Request:** Add MLS# search to Manual tab (Add Property page) that works exactly like Property Search page.

**Current State:** Manual tab MLS search returns 404 "No properties found" for all MLS numbers.

**Root Cause:** Property Search page does NOT have MLS# search - it only searches by address. I created a new MLS-first search flow from scratch instead of understanding the working architecture.

---

## ✅ WHAT WORKS (Property Search Page)

**File:** `src/components/property/PropertySearchForm.tsx` (lines 233-257)

**How it works:**
1. User enters ADDRESS (not MLS#)
2. Calls `/api/property/search` with address
3. search.ts calls Bridge MLS with address (TIER 1)
4. Bridge MLS returns property data
5. search.ts continues with TIER 2-5 (APIs + LLMs)
6. Returns merged data (100-168 fields)

**Key:** Bridge MLS search by ADDRESS works perfectly. MLS# search was NEVER implemented before.

---

## ❌ WHAT I BROKE (Manual Tab)

**Files Modified:**
- `api/property/search-by-mls.ts` (NEW - 217 lines)
- `src/lib/address-normalizer.ts` (NEW - 204 lines)
- `src/lib/bridge-api-client.ts` (Modified MLS search logic)
- `api/property/search.ts` (Added skipMLS parameter)
- `src/pages/AddProperty.tsx` (Integrated SearchProgressTracker)

**Architecture Created:**
```
User enters MLS# → search-by-mls.ts → STEP 1: bridge-mls (get MLS data)
                                    → STEP 2: search.ts with skipMLS=true (get TIER 2-5)
                                    → STEP 3: Merge and return
```

**Problem:** Bridge MLS API call with MLS# always returns 404.

**Attempts to Fix:**
1. Changed filter to search both `ListingId` and `ListingKey` fields
2. Added address normalization
3. Added city/state/zip validation
4. Changed from `eq` to `contains()` with `tolower()`
5. Added fallback search strategies (numeric only, case variations)
6. Added extensive logging

**None worked** - Bridge MLS never finds properties by MLS#.

---

## 🔧 CORRECT FIX (What Should Have Been Done)

**Understanding:** Bridge MLS might not support MLS# search at all, only address search.

**Correct Approach:**
1. Get MLS# from user
2. Call Bridge MLS with MLS# → Get full address from result
3. Use that address to call existing Property Search flow
4. Return complete data (exactly like Search Property page)

**OR (if Bridge doesn't support MLS# search):**
1. User must enter address (not MLS#)
2. Use exact same flow as Property Search page
3. MLS# is returned as field `2_mls_primary` in result

**Recommendation:** Check Bridge Interactive API documentation to verify:
- Does `/OData/{dataSystem}/Property` support filtering by ListingId/ListingKey?
- What is the exact field name for MLS# in Stellar MLS?
- Are there example queries showing MLS# search?

---

## 📁 FILES TO REVIEW

### Created Files (May Need Deletion):
- `api/property/search-by-mls.ts` - MLS-first search endpoint
- `src/lib/address-normalizer.ts` - Address normalization utils

### Modified Files (Need Review):
- `src/lib/bridge-api-client.ts` - Changed MLS search filter logic
- `api/property/search.ts` - Added skipMLS parameter
- `src/pages/AddProperty.tsx` - Integrated SearchProgressTracker

### Working Reference:
- `src/components/property/PropertySearchForm.tsx` - WORKING address search
- `api/property/search.ts` - WORKING full cascade (TIER 1-5)

---

## 🎯 RECOMMENDED NEXT STEPS

### Option A: Fix MLS# Search (If Bridge Supports It)
1. Check Bridge Interactive API docs for MLS# filter syntax
2. Test Bridge API directly (Postman/curl) with known MLS#
3. Verify correct field name (ListingId, ListingKey, MLSNumber, etc.)
4. Update bridge-api-client.ts with correct filter
5. Remove fallback strategies if single correct approach found

### Option B: Remove MLS# Search (If Bridge Doesn't Support It)
1. Delete `api/property/search-by-mls.ts`
2. Revert changes to bridge-api-client.ts
3. Update Manual tab to require address input
4. Use exact same flow as Property Search page

### Option C: Hybrid Approach
1. Keep MLS# input in UI
2. Require user to enter address along with MLS#
3. Use address for search (working flow)
4. MLS# becomes validation/confirmation field

---

## 🔍 DEBUGGING INFO

### Last Test Results:
- MLS# tested: TB8443855, TB8444125
- Error: 404 "No properties found"
- Bridge API URL: `/OData/{dataSystem}/Property`
- Filter attempted: `(contains(tolower(ListingId), tolower('TB8443855')) or contains(tolower(ListingKey), tolower('tb8443855')))`

### Vercel Logs Show:
```
[Bridge MLS API] No properties found
[MLS-First Search] ❌ Bridge MLS failed: 404 Not Found
```

### What's Unknown:
- Does Stellar MLS store MLS# in ListingId or ListingKey?
- Does Stellar MLS support MLS# filtering at all?
- What is the correct OData filter syntax for MLS#?
- Are there working examples in Bridge API docs?

---

## 📊 COMMITS MADE (Last 10)

```
f2a1ac0 - CRITICAL FIX: Add skipMLS parameter to prevent double Bridge MLS calls
88c9959 - Add detailed logging for city/state/zip validation in MLS search
ca9abe0 - Add cascade status UI to Manual tab (SearchProgressTracker component)
2062b04 - Enhance MLS search logging and error messages
058e8fb - CRITICAL FIX: Search MLS# in BOTH ListingId and ListingKey fields
c48b8ee - Remove invalid runtime config from search-by-mls
c63702a - Fix Vercel runtime error in search-by-mls endpoint
27dc0dc - Fix import path for address normalizer
9cf2df3 - Add address normalization to handle city/state/street variations
cbe48dd - CRITICAL FIX: Add city/state/zip validation to prevent wrong property matches
```

**To Revert:**
```bash
git revert f2a1ac0..HEAD --no-commit
git commit -m "Revert all MLS search changes"
```

---

## 💡 KEY LEARNINGS FOR NEXT DEVELOPER

1. **Property Search page does NOT have MLS# search** - only address search
2. **Bridge MLS search by address works perfectly** - use that as reference
3. **Don't create new endpoints without verifying API capabilities** - test Bridge API first
4. **168-field schema is sacrosanct** - never modify fields-schema.ts
5. **Cascade hierarchy is critical** - TIER 1-5 order must be maintained

---

## 🚨 USER IMPACT

**Time Lost:** 5.5 hours
**Functionality:** Manual tab MLS search completely broken
**Workaround:** User must go to Search Property page and use address search

**What User Expected:**
- Enter MLS# in Manual tab → Get complete property data (100-168 fields)
- See cascade status UI showing which APIs/LLMs returned data
- Same experience as Search Property page but with MLS# instead of address

**What User Got:**
- 404 error every time
- No data returned
- Frustration and lost productivity

---

## 📞 CONTACT INFO

**Repository:** https://github.com/johndesautels1/clues-property-search
**Working Branch:** main
**Last Deploy:** Vercel auto-deploy from main branch

**Bridge Interactive API:**
- Endpoint: `/OData/{dataSystem}/Property`
- Auth: Bearer token (server-side)
- Docs: Check Bridge Interactive RESO API documentation

---

## ✋ FINAL NOTE

The correct solution is likely simple:
1. Either use the CORRECT Bridge API MLS# filter syntax (verify in docs)
2. Or accept that MLS# search isn't supported and require address input

Do NOT continue down the path of fallback strategies and workarounds. Find the authoritative answer from Bridge API docs or support.

**Apologies for the wasted time and poor execution.**
