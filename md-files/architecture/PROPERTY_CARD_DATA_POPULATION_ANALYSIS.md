# Property Card Data Population & Timeout Analysis

**Date:** 2025-12-06
**Issue:** Property cards in Compare page often don't populate price and other data. Field 22 (Total Sq Ft Under Roof) not appearing.

---

## 1. PROPERTY CARD DATA STRUCTURE

### PropertyCard Interface (`src/types/property.ts:303`)
```typescript
export interface PropertyCard {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;              // ← OFTEN MISSING
  pricePerSqft: number;       // ← OFTEN MISSING
  bedrooms: number;           // ← OFTEN MISSING
  bathrooms: number;          // ← OFTEN MISSING
  sqft: number;               // ← OFTEN MISSING
  yearBuilt: number;
  smartScore: number;
  dataCompleteness: number;
  thumbnail?: string;
  listingStatus: string;
  daysOnMarket: number;
  lastViewedAt?: string;
}
```

**KEY FINDING:** PropertyCard is a **SIMPLIFIED SUMMARY** of the full Property object. It only contains 15 fields for displaying property lists/cards.

---

## 2. HOW PROPERTY CARDS ARE CREATED

### Pattern Found in `AddProperty.tsx`

#### Example 1: CSV Import (Line 1413)
```typescript
const propertyCard: PropertyCard = {
  id: propertyId,
  address,
  city,
  state,
  zip,
  price,                    // From CSV
  pricePerSqft: sqft && price ? Math.round(price / sqft) : 0,
  bedrooms,                 // From CSV
  bathrooms,                // From CSV
  sqft,                     // From CSV
  yearBuilt,
  smartScore: Math.floor(Math.random() * 20) + 75,
  dataCompleteness,
  listingStatus: listingStatus as 'Active' | 'Pending' | 'Sold',
  daysOnMarket: 0,
};
```

#### Example 2: MLS PDF Parser (Line 1636)
```typescript
const propertyCard: PropertyCard = {
  id: propertyId,
  address: unit ? `${street}, ${unit}` : street || fullAddress,
  city: city,
  state: state,
  zip: zip,
  price: price,             // Extracted from PDF
  pricePerSqft: pricePerSqft,
  bedrooms: bedrooms,       // Extracted from PDF
  bathrooms: bathrooms,     // Extracted from PDF
  sqft: sqft,               // Extracted from PDF
  yearBuilt: yearBuilt,
  smartScore: 85,
  dataCompleteness: Math.round((Object.keys(pdfParsedFields).length / 168) * 100),
  listingStatus: listingStatus,
  daysOnMarket: daysOnMarket,
};
```

**CRITICAL ISSUE IDENTIFIED:**
PropertyCard is created **IMMEDIATELY** when property is added, using only the data available at that moment:
- From CSV: Uses CSV column values
- From PDF: Uses PDF parser output
- From API enrichment: **PropertyCard is created BEFORE API enrichment runs**

---

## 3. THE PROPERTY CARD POPULATION PROBLEM

### Root Cause Analysis

#### Current Flow:
```
1. User adds property (CSV, PDF, or manual)
   ↓
2. PropertyCard created with initial data (often missing price/beds/sqft)
   ↓
3. PropertyCard saved to store
   ↓
4. API enrichment starts (takes 30-300 seconds)
   ↓
5. Full Property object updated with enriched data
   ↓
6. PropertyCard is NEVER UPDATED ❌
```

#### Evidence from `AddProperty.tsx:1413-1443`:
```typescript
// Line 1413: Create PropertyCard IMMEDIATELY
const propertyCard: PropertyCard = {
  id: propertyId,
  address,
  city,
  state,
  zip,
  price,                    // ← May be 0 or undefined
  pricePerSqft: sqft && price ? Math.round(price / sqft) : 0,
  bedrooms,                 // ← May be 0 or undefined
  bathrooms,                // ← May be 0 or undefined
  sqft,                     // ← May be 0 or undefined
  yearBuilt,
  smartScore: Math.floor(Math.random() * 20) + 75,
  dataCompleteness,
  listingStatus: listingStatus as 'Active' | 'Pending' | 'Sold',
  daysOnMarket: 0,
};

// Line 1442: Add to store BEFORE enrichment
addProperties(propertyCards, fullProperties);

// API enrichment happens AFTER this point
// PropertyCard is never updated with enriched data!
```

---

## 4. FIELD 22 (TOTAL SQ FT UNDER ROOF) ISSUE

### Field 22 IS Being Mapped from Stellar MLS ✅

#### Mapping Chain Verified:
1. **Stellar MLS API** returns: `BuildingAreaTotal` (number)
2. **Bridge Field Mapper** (`src/lib/bridge-field-mapper.ts:93`):
   ```typescript
   addField('22_total_sqft_under_roof', property.BuildingAreaTotal);
   ```
3. **Field Normalizer** (`src/lib/field-normalizer.ts:72`):
   ```typescript
   { fieldNumber: 22, apiKey: '22_total_sqft_under_roof',
     group: 'details', propName: 'totalSqftUnderRoof',
     type: 'number', validation: (v) => v > 0 && v < 150000 }
   ```
4. **Property Type** (`src/types/property.ts:55`):
   ```typescript
   totalSqftUnderRoof: DataField<number>; // #22
   ```

### Why Field 22 Might Not Appear:

1. **NOT IN PROPERTY CARD:**
   - PropertyCard interface only has `sqft` (field 21 - Living Sqft)
   - Field 22 (Total Sqft Under Roof) is ONLY in the full Property object
   - PropertyCard displays `property.sqft`, not `property.details.totalSqftUnderRoof`

2. **Stellar MLS May Not Provide It:**
   - If `BuildingAreaTotal` is null/undefined in MLS data, field 22 won't populate
   - Need to verify actual Stellar MLS response data

3. **Validation Failure:**
   - Field 22 validator requires: `v > 0 && v < 150000`
   - If value is 0 or > 150,000, it's rejected

---

## 5. TIMEOUT CONFIGURATION

### API Timeouts (`api/property/search.ts:29-40`)
```typescript
export const config = {
  maxDuration: 300, // 5 minutes (Vercel Pro)
};

const LLM_TIMEOUT = 180000;        // 180 seconds (3 minutes) per LLM
const STELLAR_MLS_TIMEOUT = 90000; // 90 seconds (1.5 minutes) for Stellar MLS

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}
```

### Current Timeout Settings:
- **Total API timeout:** 300 seconds (5 minutes)
- **Stellar MLS timeout:** 90 seconds
- **Per-LLM timeout:** 180 seconds (3 minutes)
- **Total LLM cascade:** 180s × 6 LLMs = **18 minutes maximum** ❌

**TIMEOUT ISSUE:**
If LLM cascade runs sequentially, it could theoretically take 18 minutes, but Vercel's 300-second limit kills it after 5 minutes.

---

## 6. THE REAL PROBLEM: TWO SEPARATE ISSUES

### Issue #1: Property Card Data Not Updating ⚠️

**Problem:**
- PropertyCard is created with initial data (often empty/zero values)
- API enrichment populates the full Property object
- PropertyCard is NEVER UPDATED with enriched data

**Why This Happens:**
```typescript
// AddProperty.tsx: Line 1442
addProperties(propertyCards, fullProperties);
// ↑ PropertyCard frozen at this moment

// API enrichment runs AFTER:
const enrichedFields = await fetchPropertyData(fullAddress);
fullProperty = mergePropertyData(fullProperty, enrichedFields, propertyId);
// ↑ Only updates fullProperty, NOT propertyCard
```

**Evidence from Compare Page:**
```typescript
// Compare.tsx:529 - PropertyCard is used directly
const selectedProperty = properties.find(p => p.id === selectedId);

// Line 567: Displays PropertyCard.price
<span className="text-white ml-1">${selectedProperty.price.toLocaleString()}</span>

// Line 575: Displays PropertyCard.bedrooms
<span className="text-white ml-1">{selectedProperty.bedrooms}</span>

// Line 579: Displays PropertyCard.sqft
<span className="text-white ml-1">{selectedProperty.sqft.toLocaleString()}</span>
```

### Issue #2: Field 22 Not in PropertyCard ℹ️

**Problem:**
- Field 22 (Total Sq Ft Under Roof) is correctly mapped from Stellar MLS
- BUT it's stored in `property.details.totalSqftUnderRoof` (full Property only)
- PropertyCard only has `sqft` (field 21 - Living Sqft)
- Compare page ONLY uses PropertyCard data, not full Property

---

## 7. SOLUTIONS

### Solution #1: Update PropertyCard After Enrichment ✅ RECOMMENDED

Add a function to refresh PropertyCard from the full Property object:

```typescript
// In propertyStore.ts
function refreshPropertyCard(fullProperty: Property): PropertyCard {
  return {
    id: fullProperty.id,
    address: fullProperty.address.fullAddress.value || '',
    city: fullProperty.address.city.value || '',
    state: fullProperty.address.state.value || '',
    zip: fullProperty.address.zipCode.value || '',
    price: fullProperty.address.listingPrice.value || 0,
    pricePerSqft: fullProperty.address.pricePerSqft.value || 0,
    bedrooms: fullProperty.details.bedrooms.value || 0,
    bathrooms: fullProperty.details.totalBathrooms.value || 0,
    sqft: fullProperty.details.livingSqft.value || 0,
    yearBuilt: fullProperty.details.yearBuilt.value || 0,
    smartScore: 85, // Calculate from data completeness
    dataCompleteness: calculateCompleteness(fullProperty),
    thumbnail: fullProperty.address.primaryPhotoUrl?.value,
    listingStatus: fullProperty.address.listingStatus.value || 'Active',
    daysOnMarket: 0,
  };
}

// Call after enrichment:
addProperty(propertyCard, fullProperty);
// After API enrichment completes:
const updatedCard = refreshPropertyCard(enrichedProperty);
updatePropertyCard(propertyId, updatedCard);
```

### Solution #2: Add Field 22 to PropertyCard (Optional)

If you want to display Total Sq Ft Under Roof on property cards:

```typescript
// src/types/property.ts
export interface PropertyCard {
  // ... existing fields ...
  sqft: number;               // Field 21 - Living Sqft
  totalSqftUnderRoof?: number; // Field 22 - Total Sqft Under Roof (NEW)
  // ... rest of fields ...
}
```

### Solution #3: Fix Timeout Issues

#### Option A: Parallel LLM Execution (FASTEST)
```typescript
// Run all LLMs in parallel instead of sequential cascade
const llmResults = await Promise.all([
  withTimeout(callPerplexity(...), 45000, {}),
  withTimeout(callGrok(...), 180000, {}),
  withTimeout(callClaudeOpus(...), 180000, {}),
  // ... etc
]);
```

**Result:** All 6 LLMs complete in ~180 seconds max (instead of 1080 seconds)

#### Option B: Reduce Per-LLM Timeout
```typescript
const LLM_TIMEOUT = 60000; // 60 seconds instead of 180
```

**Trade-off:** Faster responses, but Perplexity/Grok may timeout during web searches

#### Option C: Progressive Updates (BEST UX)
```typescript
// Update PropertyCard as each data source completes
onDataSourceComplete(sourceName, fields) {
  const updatedCard = refreshPropertyCard(currentProperty);
  updatePropertyCard(propertyId, updatedCard);
  // User sees card update in real-time
}
```

---

## 8. RECOMMENDED IMPLEMENTATION PLAN

### Phase 1: Immediate Fix (Property Card Updates)
1. ✅ Add `refreshPropertyCard()` function to propertyStore.ts
2. ✅ Add `updatePropertyCard()` action to store
3. ✅ Call `updatePropertyCard()` after API enrichment completes
4. ✅ Call `updatePropertyCard()` after each major data source (progressive updates)

### Phase 2: Field 22 Display (If Needed)
1. Add `totalSqftUnderRoof?` to PropertyCard interface
2. Update `refreshPropertyCard()` to include field 22
3. Update Compare.tsx to display both Living Sqft and Total Sqft

### Phase 3: Timeout Optimization
1. Implement parallel LLM execution
2. Add progressive PropertyCard updates
3. Reduce LLM timeout to 90 seconds (from 180)
4. Add real-time progress feedback in UI

---

## 9. VERIFICATION STEPS

### Test #1: Property Card Population
1. Add a property via CSV (with missing price/beds/sqft)
2. Wait for API enrichment to complete
3. Verify PropertyCard updates with enriched data
4. Check Compare page - cards should show populated data

### Test #2: Field 22 (Total Sq Ft Under Roof)
1. Add a property that has Stellar MLS data
2. Check full Property object: `property.details.totalSqftUnderRoof`
3. Verify value is present and correct
4. If displaying on cards: verify PropertyCard shows totalSqftUnderRoof

### Test #3: Timeout Handling
1. Add a property and monitor API calls
2. Verify Stellar MLS completes within 90 seconds
3. Verify each LLM completes within timeout
4. Verify total enrichment < 5 minutes
5. Check for timeout errors in console

---

## 10. CURRENT TIMEOUT RISKS

### Risk Analysis:
- **Stellar MLS:** 90s timeout ✅ Safe (typically completes in 10-30s)
- **Free APIs:** No timeout set ⚠️ Could hang indefinitely
- **LLM Cascade:** 180s × 6 = 1080s ❌ Exceeds Vercel 300s limit
- **Total API timeout:** 300s ⚠️ May not be enough for full cascade

### Recommended Timeouts:
```typescript
const STELLAR_MLS_TIMEOUT = 60000;   // 60 seconds (1 minute)
const FREE_API_TIMEOUT = 30000;      // 30 seconds
const LLM_TIMEOUT = 90000;           // 90 seconds (1.5 minutes)
const TOTAL_TIMEOUT = 240000;        // 240 seconds (4 minutes)
```

---

## 11. SUMMARY

### Root Causes Identified:
1. **PropertyCard created before enrichment** - never updated after API data arrives
2. **Field 22 not in PropertyCard** - only in full Property object
3. **LLM timeouts too long** - sequential cascade could take 18 minutes
4. **No progressive updates** - user sees stale data until ALL APIs complete

### Critical Fixes Needed:
1. ✅ **HIGH PRIORITY:** Update PropertyCard after enrichment completes
2. ✅ **HIGH PRIORITY:** Add progressive PropertyCard updates
3. ⚠️ **MEDIUM PRIORITY:** Optimize LLM execution (parallel vs sequential)
4. ℹ️ **LOW PRIORITY:** Add field 22 to PropertyCard (if needed for display)

### Impact:
- **Before Fix:** Property cards show initial data (often zeros), never update
- **After Fix:** Property cards update in real-time as data sources complete
- **User Experience:** Dramatic improvement - see data populate live instead of stale cards
