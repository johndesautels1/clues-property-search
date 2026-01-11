# Property Search Contamination Audit
**Date:** 2026-01-11
**Status:** 🔴 **3 BUGS FOUND - FIXES NEEDED**

---

## Executive Summary

Audited ALL property search/add entry points for data contamination bugs. Found **3 missing `clearProperty()` calls** that could cause old property data to bleed into new searches.

**✅ SAFE:** Retry buttons correctly use additive merge
**❌ BUGS:** 3 entry points missing clearProperty() calls

---

## All Entry Points Mapped

### 1. **Property Search Page** (`SearchProperty.tsx`)
- **Function:** Main search by address
- **Line:** 126 - `addProperty(newProperty, fullProperty)`
- **Status:** ❌ **MISSING clearProperty()**
- **Risk:** Medium - could contaminate if same address searched twice

### 2. **Add Property Page** - 5 Modes (`AddProperty.tsx`)

#### Mode A: Manual Entry (MLS Number)
- **Function:** `handleManualSubmit()`
- **Lines:** 392-398
- **Status:** ✅ **FIXED** (clearProperty on line 395)
- **Risk:** None

#### Mode B: Property Search (Address)
- **Function:** `handleScrape()` - SUCCESS PATH
- **Lines:** 575-577
- **Status:** ✅ **FIXED** (clearProperty on line 577)
- **Risk:** None

#### Mode C: Property Search (Address) - ERROR PATH
- **Function:** `handleScrape()` - ERROR HANDLER
- **Lines:** 629-631
- **Status:** ❌ **MISSING clearProperty()**
- **Risk:** HIGH - error path uses cached fields, could merge with old data

#### Mode D: PDF Upload
- **Function:** `handlePdfImport()`
- **Lines:** 1418
- **Status:** ❌ **MISSING clearProperty()**
- **Risk:** HIGH - PDF + enrichment could merge with previous property

#### Mode E: URL/Text Paste
- **Function:** `handleScrape()` (same as Mode B)
- **Status:** ✅ **FIXED** (same code path as address search)
- **Risk:** None

### 3. **PropertyDetail Page** - Retry Buttons
- **Functions:** `handleRetryField()`, `handleTavilyField()`
- **Lines:** 967, 1049
- **Call:** `updateFullProperty(id, updated)`
- **Status:** ✅ **CORRECT - SHOULD NOT CLEAR**
- **Why:** Retry buttons ADD missing fields to existing property (enrichment)
- **Risk:** None - additive merge is INTENDED behavior

---

## Bugs Found

### 🐛 BUG #1: SearchProperty.tsx - Line 126
**Location:** `src/pages/SearchProperty.tsx:126`

**Problem:**
```typescript
// MISSING clearProperty() before addProperty()
addProperty(newProperty, fullProperty);
```

**Fix Needed:**
```typescript
clearProperty(propertyId);  // ← ADD THIS
addProperty(newProperty, fullProperty);
```

**Impact:** If user searches same address twice from Search page, old data merges with new

---

### 🐛 BUG #2: AddProperty.tsx Error Handler - Line 631
**Location:** `src/pages/AddProperty.tsx:631`

**Problem:**
```typescript
// ERROR PATH: Uses accumulated fields from cache
const fullPropertyData = convertApiResponseToFullProperty(fields, scrapedProperty.id, {}, []);
setSaveStatus('saving');
addProperty(scrapedProperty, fullPropertyData);  // ← NO clearProperty()
```

**Fix Needed:**
```typescript
const fullPropertyData = convertApiResponseToFullProperty(fields, scrapedProperty.id, {}, []);
setSaveStatus('saving');
clearProperty(scrapedProperty.id);  // ← ADD THIS
addProperty(scrapedProperty, fullPropertyData);
```

**Impact:** When API errors but cached data exists, old property data merges with cached data

---

### 🐛 BUG #3: AddProperty.tsx PDF Import - Line 1418
**Location:** `src/pages/AddProperty.tsx:1418`

**Problem:**
```typescript
// Add to store with PDF data first
addProperty(propertyCard, fullProperty);  // ← NO clearProperty()
setLastAddedId(propertyId);

// Then enrichment call adds MORE data via existingFields parameter
// This could merge with old property if same address uploaded twice
```

**Fix Needed:**
```typescript
// Add to store with PDF data first
clearProperty(propertyId);  // ← ADD THIS
addProperty(propertyCard, fullProperty);
setLastAddedId(propertyId);
```

**Impact:**
- If user uploads PDF for same property twice, data merges
- Enrichment call passes `existingFields: pdfParsedFields` which could trigger merge

---

## Cross-Contamination Risk Matrix

| Source → Target | Search Page | Add Property | PDF Upload | Retry Button |
|-----------------|-------------|--------------|------------|--------------|
| **Search Page** | ❌ HIGH | ✅ Safe | ✅ Safe | ✅ Safe |
| **Add Property** | ✅ Safe | ❌ MEDIUM | ✅ Safe | ✅ Safe |
| **PDF Upload** | ✅ Safe | ✅ Safe | ❌ HIGH | ✅ Safe |
| **Retry Button** | ✅ Safe | ✅ Safe | ✅ Safe | ✅ CORRECT |

**Legend:**
- ❌ HIGH = Can contaminate if same property searched twice
- ❌ MEDIUM = Can contaminate in error scenarios
- ✅ Safe = Different IDs prevent cross-contamination
- ✅ CORRECT = Intentional merge behavior (enrichment)

---

## Why Retry Buttons Are Safe

**CRITICAL:** Retry buttons should NOT call `clearProperty()`!

**Reason:** Retry buttons are for **ENRICHMENT** - adding missing fields to an existing property:

```typescript
// PropertyDetail.tsx line 967
updateFullProperty(id, updated);  // ✅ CORRECT - Uses additive merge

// This calls propertyStore.ts updateFullProperty():
if (existing) {
  const merged = mergeProperties(existing, property);  // ✅ INTENDED
  newFullProperties.set(id, merged);
}
```

**User Flow:**
1. User searches property → Gets 120/181 fields
2. User clicks "Retry with LLM" on empty field → LLM finds missing data
3. `updateFullProperty()` **merges** new field with existing 120 fields
4. Result: 121/181 fields

If we added `clearProperty()` here, it would **ERASE** all 120 existing fields! ❌

---

## Import Statement Status

All files that need `clearProperty()` already import it:

```typescript
// SearchProperty.tsx line 22
const { addProperty } = usePropertyStore();  // ❌ MISSING clearProperty

// AddProperty.tsx line 71
const { addProperty, addProperties, clearProperty } = usePropertyStore();  // ✅ HAS IT
```

**Fix:** Add `clearProperty` to SearchProperty.tsx imports

---

## Saved Properties Safety

**Question:** Will `clearProperty()` erase saved properties?

**Answer:** NO - `clearProperty()` only affects localStorage/Zustand store:

```typescript
clearProperty: (id) => set((state) => {
  const newFullProperties = new Map(state.fullProperties);
  newFullProperties.delete(id);  // ← Only removes from Map
  return {
    properties: state.properties.filter((p) => p.id !== id),
    fullProperties: newFullProperties,
  };
}),
```

**What it does:**
- Removes property from in-memory store (Zustand + localStorage)
- Does NOT touch database (no database yet - all local)
- Only clears the SPECIFIC property ID being searched

**Safety:** Existing saved properties with DIFFERENT IDs are untouched ✅

---

## Fixes Required

1. **SearchProperty.tsx**
   - Add `clearProperty` to import
   - Call `clearProperty(propertyId)` before `addProperty()`

2. **AddProperty.tsx - Error Handler**
   - Call `clearProperty(scrapedProperty.id)` before `addProperty()`

3. **AddProperty.tsx - PDF Import**
   - Call `clearProperty(propertyId)` before `addProperty()`

---

## Testing Plan

After fixes, test these scenarios:

1. **Double Search Same Address**
   - Search Property A from Search page
   - Search Property A again
   - Verify: No old fields in new result

2. **PDF Re-Upload**
   - Upload PDF for Property A
   - Upload PDF for Property A again (different data)
   - Verify: No old PDF data in new result

3. **Error Recovery**
   - Trigger API error with cached fields
   - Verify: Cached data doesn't merge with old property

4. **Retry Buttons Still Work**
   - Search property (partial data)
   - Click "Retry with LLM"
   - Verify: New fields MERGE with existing (not replaced)

5. **Cross-Mode Safety**
   - Search Property A via Search page
   - Upload PDF for Property B
   - Verify: No Property A data in Property B

---

**Document Status:** READY FOR FIXES
**Next Step:** Implement 3 `clearProperty()` calls
