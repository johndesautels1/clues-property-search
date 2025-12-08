# Stellar MLS Photos - Quick Implementation Guide

## Summary
**You HAVE full Stellar MLS integration via Bridge Interactive API.**
The Bridge API DOES return photo URLs, but they're not currently being extracted/mapped.

**Fix difficulty:** ⭐ Very Easy (30-60 minutes)
**Files to modify:** 4 files
**No database changes needed**

---

## What Bridge Interactive Provides

Bridge Interactive's RESO Web API includes the `Media` resource which contains:
- Photo URLs
- Photo order
- Photo categories (Exterior, Interior, Kitchen, etc.)
- Preferred/primary photo flag

**API Response Format:**
```json
{
  "ListingKey": "12345",
  "ListPrice": 1274000,
  "... other fields ...",
  "Media": [
    {
      "MediaURL": "https://photos.bridgeinteractive.com/...",
      "Order": 1,
      "MediaCategory": "Photograph",
      "ShortDescription": "Front Exterior",
      "PreferredPhotoYN": true
    }
  ]
}
```

---

## Implementation Steps

### Step 1: Add Media field to BridgeProperty interface
**File:** `src/lib/bridge-api-client.ts`

**Find the `export interface BridgeProperty` block and add:**
```typescript
export interface BridgeProperty {
  // ... existing fields ...

  // Media & Photos (ADD THIS)
  Media?: Array<{
    MediaURL?: string;
    Order?: number;
    MediaCategory?: string;
    ShortDescription?: string;
    PreferredPhotoYN?: boolean;
  }>;

  // Or if Bridge returns it as a simple string array:
  PhotoURLs?: string[];  // Fallback if Media not available
  PreferredPhotoURL?: string;  // Direct primary photo URL
}
```

---

### Step 2: Extract photos in bridge-field-mapper.ts
**File:** `src/lib/bridge-field-mapper.ts`

**Add after line 100 (in the mapping function):**
```typescript
// ================================================================
// PHOTOS (NEW - Field 169)
// ================================================================
if (property.Media && Array.isArray(property.Media) && property.Media.length > 0) {
  // Find preferred/primary photo
  const preferredPhoto = property.Media.find(m => m.PreferredPhotoYN === true);
  const primaryPhotoUrl = preferredPhoto?.MediaURL || property.Media[0]?.MediaURL;

  if (primaryPhotoUrl) {
    addField('property_photo_url', primaryPhotoUrl);
  }

  // Optionally store all photo URLs
  const allPhotoUrls = property.Media
    .sort((a, b) => (a.Order || 0) - (b.Order || 0))
    .map(m => m.MediaURL)
    .filter(Boolean);

  if (allPhotoUrls.length > 0) {
    addField('property_photos', allPhotoUrls);
  }
}
// Fallback: Direct photo URL fields
else if (property.PreferredPhotoURL) {
  addField('property_photo_url', property.PreferredPhotoURL);
}
else if (property.PhotoURLs && property.PhotoURLs.length > 0) {
  addField('property_photo_url', property.PhotoURLs[0]);
  addField('property_photos', property.PhotoURLs);
}
```

---

### Step 3: Add photo field to search.ts mapping
**File:** `api/property/search.ts`

**Find the field mapping object (around line 757) and add:**
```typescript
const fieldPaths: Record<string, [string, string] | [string, string, string]> = {
  // ... existing fields ...

  // Photos (NEW - Field 169)
  'property_photo_url': ['address', 'primaryPhotoUrl'],
  'property_photos': ['address', 'photoGallery'],
};
```

---

### Step 4: Add photos to Property type
**File:** `src/types/property.ts`

**Find `export interface AddressData` and add:**
```typescript
export interface AddressData {
  // ... existing fields ...
  primaryPhotoUrl: DataField<string>;     // NEW - Field 169
  photoGallery: DataField<string[]>;      // NEW - Field 170 (optional, for future gallery)
}
```

---

### Step 5: Update field-normalizer.ts mapping
**File:** `src/lib/field-normalizer.ts`

**Add to `FIELD_TO_PROPERTY_MAP` array (around line 40):**
```typescript
{ fieldNumber: 169, apiKey: 'property_photo_url', group: 'address', propName: 'primaryPhotoUrl', type: 'string' },
{ fieldNumber: 170, apiKey: 'property_photos', group: 'address', propName: 'photoGallery', type: 'array' },
```

---

### Step 6: Map photo to PropertyCard thumbnail
**File:** `src/store/propertyStore.ts` (or wherever PropertyCard objects are created)

**Find where you create PropertyCard objects and add:**
```typescript
const propertyCard: PropertyCard = {
  id: property.id,
  address: property.address.fullAddress.value,
  // ... other fields ...
  thumbnail: property.address.primaryPhotoUrl?.value || undefined,  // ADD THIS LINE
};
```

---

## Testing

### Step 1: Search for a property
```
Search: 2834 Chancery Ln, Clearwater, FL 33759
```

### Step 2: Check browser console
Look for log output like:
```
[Bridge MLS API] Found 1 properties
✅ [Bridge MLS] X fields successfully mapped
```

### Step 3: Check if photo field was extracted
Open browser DevTools → Network tab → Find the Bridge API response → Check if `Media` array exists

### Step 4: Verify PropertyCard displays photo
- Property cards should show actual listing photos
- Fallback to MapPin icon if photo missing

---

## Expected API Response (Bridge Interactive)

When you call Bridge Interactive API, you should get back something like:

```json
{
  "success": true,
  "fields": {
    "1_full_address": { "value": "2834 Chancery Ln...", "source": "Stellar MLS" },
    "10_listing_price": { "value": 1274000, "source": "Stellar MLS" },
    ...
    "property_photo_url": { "value": "https://photos.bridgeinteractive.com/...", "source": "Stellar MLS" }
  }
}
```

---

## Troubleshooting

### Issue 1: No Media field in API response
**Check:** Bridge API might require `$expand=Media` in the OData query

**Fix in `src/lib/bridge-api-client.ts`:**
```typescript
const url = `${this.config.baseURL}/Property?$filter=...&$expand=Media`;
```

### Issue 2: Photos not displaying
**Check:** CORS errors in browser console

**Fix:** Photos from Bridge Interactive should have proper CORS headers, but if not, add proxy

### Issue 3: Wrong photo order
**Check:** Make sure you're sorting by `Order` field
```typescript
property.Media.sort((a, b) => (a.Order || 0) - (b.Order || 0))
```

---

## Complete Code Example

Here's the complete photo extraction logic:

```typescript
// In bridge-field-mapper.ts
export function mapBridgePropertyToSchema(property: BridgeProperty): MappedPropertyData {
  const fields: Record<string, MappedField> = {};
  // ... existing mapping code ...

  // ================================================================
  // PHOTOS - Extract from Media resource
  // ================================================================
  if (property.Media && Array.isArray(property.Media) && property.Media.length > 0) {
    console.log(`[Bridge Mapper] Found ${property.Media.length} photos`);

    // Sort by order
    const sortedMedia = property.Media
      .filter(m => m.MediaURL)  // Only photos with URLs
      .sort((a, b) => (a.Order || 999) - (b.Order || 999));

    // Find preferred photo (marked by MLS)
    const preferredPhoto = sortedMedia.find(m => m.PreferredPhotoYN === true);

    // Use preferred photo, or first photo if no preferred
    const primaryPhotoUrl = preferredPhoto?.MediaURL || sortedMedia[0]?.MediaURL;

    if (primaryPhotoUrl) {
      addField('property_photo_url', primaryPhotoUrl, 'High');
      console.log('[Bridge Mapper] ✅ Primary photo URL:', primaryPhotoUrl);
    }

    // Store all photo URLs for future gallery feature
    const allPhotoUrls = sortedMedia.map(m => m.MediaURL).filter(Boolean);
    if (allPhotoUrls.length > 0) {
      addField('property_photos', allPhotoUrls, 'High');
      console.log(`[Bridge Mapper] ✅ Stored ${allPhotoUrls.length} photos in gallery`);
    }
  } else {
    console.log('[Bridge Mapper] ⚠️ No Media found in property data');
  }

  return { fields, rawData: property, mappedCount, unmappedCount };
}
```

---

## Summary

**What you need to do:**
1. ✅ Add `Media` field to `BridgeProperty` interface
2. ✅ Extract photo URL in `bridge-field-mapper.ts`
3. ✅ Add photo field mapping to `search.ts`
4. ✅ Update `AddressData` interface
5. ✅ Map to `PropertyCard.thumbnail`

**Time estimate:** 30-60 minutes
**Difficulty:** ⭐ Very Easy
**Breaking changes:** None
**Database changes:** None

Want me to implement this now?
