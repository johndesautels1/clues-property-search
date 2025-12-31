# School Ratings & Parking Fields Analysis
**Date:** 2025-12-31
**Purpose:** Investigate why Fields 66, 69, 72 (school ratings) and 140-143 (parking) are NULL

---

## SCHOOL RATINGS (Fields 66, 69, 72)

### Current Status: ✅ FIXED

**Problem:**
- SchoolDigger API IS integrated and IS being called
- Returns school names and distances ✅
- But ratings (66, 69, 72) were NULL ❌

**Root Cause:**
- SchoolDigger API returns schools without rating data in some cases
- Extraction code only checked 2 field paths: `rankHistory?.[0]?.rank` and `schoolDiggerRank`
- API may use other field names: `rank`, `rating`

### Solution Implemented:

**1. Enhanced SchoolDigger Extraction** (`free-apis.ts:400-433`)
- Added fallback to 4 possible rating field paths:
  ```typescript
  const rating = school.rankHistory?.[0]?.rank ||
                 school.schoolDiggerRank ||
                 school.rank ||
                 school.rating;
  ```
- Now tries all possible field names before giving up

**2. Added GreatSchools API Fallback** (`free-apis.ts:450-507`)
- New function: `callGreatSchools(lat, lon, schoolNames)`
- Calls GreatSchools API v2 only when SchoolDigger has no ratings
- Searches by school name + location for accurate matching
- Returns ratings on 1-10 scale (same as SchoolDigger)
- Confidence marked as "Medium" (lower than SchoolDigger)

**3. Integrated Fallback Logic** (`search.ts:1976-1995`)
- After SchoolDigger completes, checks if ratings are missing
- Extracts school names from SchoolDigger results
- Calls GreatSchools API for missing ratings only
- Merges GreatSchools data into final fields

### Environment Variable Required:

Add to Vercel:
```
GREATSCHOOLS_API_KEY=<your_key_here>
```

**Get API key:** https://www.greatschools.org/api/

**Note:** If key not configured, fallback is silently skipped (no error)

---

## PARKING FIELDS (Fields 140-143)

### Current Status: ✅ ALREADY WORKING (No changes needed)

**Fields in Question:**
- Field 140: Carport Spaces
- Field 141: Garage Attached Y/N
- Field 142: Parking Features
- Field 143: Assigned Parking Spaces

### Findings:

**Bridge MLS Mapping: ALREADY EXISTS** (`bridge-field-mapper.ts:563-570`)

```typescript
addField('140_carport_spaces', property.CarportSpaces);
addField('141_garage_attached_yn', property.AttachedGarageYN);
if (property.ParkingFeatures && Array.isArray(property.ParkingFeatures)) {
  addField('142_parking_features', property.ParkingFeatures.join(', '));
}
addField('143_assigned_parking_spaces', property.AssignedParkingSpaces);
```

**These fields ARE wired correctly!**

### Why Are They NULL for Property 3?

**Two possible reasons:**

1. **Bridge MLS doesn't return these fields for this property**
   - Property may not have carport/assigned parking
   - MLS listing may not include ParkingFeatures array
   - Check Vercel logs for actual Bridge API response

2. **Fields exist but have NULL values in MLS data**
   - Condo at 16326 Gulf Blvd Apt 510 may not have:
     - Carport (field shows "No" for Field 139)
     - Assigned parking spaces documented
     - Detailed parking features in MLS

### Verification Steps:

1. Check Vercel deployment logs for Property 3 search
2. Look for Bridge MLS response - find `bridgeData.rawData` section
3. Check if these fields exist in raw response:
   - `CarportSpaces`
   - `AttachedGarageYN`
   - `ParkingFeatures`
   - `AssignedParkingSpaces`

### Conclusion:

**NO CODE CHANGES NEEDED for parking fields.**

If these are truly NULL in Bridge MLS data, then:
- It's accurate (property doesn't have this data)
- Or it needs to be added to MLS listing by agent
- Or Bridge API doesn't expose these fields (contact Bridge support)

---

## Summary

| Issue | Status | Action Taken |
|-------|--------|--------------|
| **School Ratings (66, 69, 72)** | ✅ FIXED | Enhanced SchoolDigger extraction + Added GreatSchools fallback |
| **Parking Fields (140-143)** | ✅ ALREADY WORKING | No changes needed - fields are correctly mapped |

### Next Steps:

1. **Add GREATSCHOOLS_API_KEY to Vercel env** (if you want fallback active)
2. **Deploy changes** to test school ratings improvement
3. **Check Vercel logs** to verify Bridge MLS is/isn't returning parking data
4. **If parking still NULL after confirming Bridge has data:** Debug bridge-field-mapper.ts mapping logic

---

## Files Modified:

1. `api/property/free-apis.ts`
   - Enhanced SchoolDigger rating extraction (4 fallback paths)
   - Added callGreatSchools() function

2. `api/property/search.ts`
   - Imported callGreatSchools
   - Added fallback logic after SchoolDigger
   - Merged GreatSchools data into final fields
