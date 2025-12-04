# Property Photos Implementation Guide
**Difficulty:** ⭐⭐ Easy (2/5)
**Time Estimate:** 2-4 hours
**Current Status:** ✅ UI already supports photos, just need data source

---

## 🎯 CURRENT STATE

**Good news:** Your PropertyCard component already has photo support built in!

```typescript
// src/components/property/PropertyCard.tsx lines 73-83
{property.thumbnail ? (
  <img src={property.thumbnail} alt={property.address} ... />
) : (
  <div>... MapPin icon placeholder ...</div>
)}
```

**What's missing:** The `thumbnail` field is currently empty for all properties

**Schema status:** ✅ Already in `PropertyCard` interface (line 311 in property.ts)

---

## 📊 IMPLEMENTATION OPTIONS

### Option 1: Perplexity/Grok Image Extraction (RECOMMENDED)
**Cost:** Free (uses existing LLM calls)
**Quality:** High (real listing photos)
**Difficulty:** Easy

**How it works:**
1. Perplexity/Grok already scrapes MLS listing URLs
2. Extract the first image URL from their response
3. Store in `thumbnail` field

**Pros:**
- No additional API calls needed
- Real listing photos from MLS/Zillow/Redfin
- Already works with your existing search flow

**Cons:**
- Depends on LLMs finding listing pages
- Image URLs might expire (can cache locally)

---

### Option 2: Google Street View API (BACKUP)
**Cost:** $7 per 1,000 requests (first 28,000 free per month)
**Quality:** Medium (street view, not listing photo)
**Difficulty:** Easy

**How it works:**
1. Use property address to get Google Street View image
2. Store URL in `thumbnail` field

**Pros:**
- Always available (even for off-market properties)
- Consistent quality
- No expiration issues

**Cons:**
- Not the actual listing photo (just street view)
- Costs money after free tier
- Might show outdated street view

---

### Option 3: Manual Upload (ADMIN FEATURE)
**Cost:** Free
**Quality:** Perfect (user uploads exact photo)
**Difficulty:** Medium

**How it works:**
1. Add "Upload Photo" button to PropertyDetail page
2. Upload to cloud storage (Cloudinary, AWS S3, etc.)
3. Store URL in property

**Pros:**
- Complete control over images
- No API dependencies
- Can add multiple photos

**Cons:**
- Manual work required
- Need cloud storage setup
- Not scalable for bulk imports

---

## 🚀 IMPLEMENTATION PLAN (Option 1 - Recommended)

### Step 1: Modify LLM Response Parser
**File:** `api/property/search.ts` (or wherever you process Perplexity/Grok responses)

**Add image extraction logic:**
```typescript
// After LLM returns property data
function extractImageFromLLMResponse(llmResponse: string): string | null {
  // Option A: Extract from markdown image syntax
  const mdImageRegex = /!\[.*?\]\((https?:\/\/.*?\.(?:jpg|jpeg|png|webp).*?)\)/i;
  const mdMatch = llmResponse.match(mdImageRegex);
  if (mdMatch) return mdMatch[1];

  // Option B: Extract from HTML img tags
  const htmlImageRegex = /<img[^>]+src="(https?:\/\/.*?\.(?:jpg|jpeg|png|webp).*?)"/i;
  const htmlMatch = llmResponse.match(htmlImageRegex);
  if (htmlMatch) return htmlMatch[1];

  // Option C: Find any image URL in text
  const urlRegex = /(https?:\/\/.*?\.(?:jpg|jpeg|png|webp)(?:\?[^\s]*)?)/i;
  const urlMatch = llmResponse.match(urlRegex);
  if (urlMatch) return urlMatch[1];

  return null;
}

// In your search response handler:
const thumbnail = extractImageFromLLMResponse(perplexityResponse) ||
                 extractImageFromLLMResponse(grokResponse) ||
                 null;

// Add to fields object:
fields['property_photo_url'] = {
  value: thumbnail,
  source: 'LLM',
  confidence: thumbnail ? 'Medium' : 'Low'
};
```

---

### Step 2: Add Image Field to Schema
**File:** `src/types/fields-schema.ts`

**Add new field (Field 169 - or use existing field if one exists):**
```typescript
{
  fieldNumber: 169,
  apiKey: 'property_photo_url',
  group: 'address',
  propName: 'photoUrl',
  type: 'string',
  label: 'Property Photo',
  category: 'Address & Identity',
  description: 'Primary listing photo URL'
}
```

---

### Step 3: Update Property Type
**File:** `src/types/property.ts`

**Add to AddressData interface:**
```typescript
export interface AddressData {
  // ... existing fields ...
  photoUrl: DataField<string>;  // NEW
}
```

---

### Step 4: Update Field Normalizer
**File:** `src/lib/field-normalizer.ts`

**Add mapping:**
```typescript
{ fieldNumber: 169, apiKey: 'property_photo_url', group: 'address', propName: 'photoUrl', type: 'string' },
```

**Add to PropertyCard creation** (find where you create PropertyCard objects):
```typescript
const propertyCard: PropertyCard = {
  // ... existing fields ...
  thumbnail: fullProperty.address.photoUrl?.value || undefined,
};
```

---

### Step 5: Test Image Extraction

**Test prompt for Perplexity:**
```
Find property details for 2834 Chancery Ln, Clearwater, FL 33759.
Include the MLS listing page URL and the main property photo URL.
```

**Expected response:**
```
MLS Listing: https://www.stellarmls.com/...
Photo: https://images.stellarmls.com/property/T8405500/main.jpg
...property details...
```

---

## 🔧 ALTERNATIVE: Google Street View (Backup)

If LLM image extraction doesn't work reliably, use Google Street View:

### Step 1: Get API Key
1. Go to https://console.cloud.google.com/
2. Enable "Street View Static API"
3. Create API key

### Step 2: Add to API
**File:** `api/property/search.ts`

```typescript
async function getGoogleStreetViewImage(address: string): Promise<string> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const encodedAddress = encodeURIComponent(address);

  // Street View Static API URL
  const url = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&key=${apiKey}`;

  return url;  // This URL can be used directly in <img src="...">
}

// Usage:
const thumbnail = await getGoogleStreetViewImage(property.address);
```

**Cost:** $7 per 1,000 images (first 28,000 free/month = ~1,000/day free)

---

## 📸 ADVANCED: Multiple Photos (Future Enhancement)

For full photo galleries:

### Option 1: Store Array of URLs
```typescript
export interface AddressData {
  photoUrl: DataField<string>;  // Primary photo
  photoGallery: DataField<string[]>;  // All photos
}
```

### Option 2: Dedicated Photo Service
Use Cloudinary or AWS S3:
1. Upload photos via admin panel
2. Store URLs in database
3. Display in PropertyDetail page with carousel

---

## 🧪 TESTING CHECKLIST

- [ ] LLM extracts image URL from listing pages
- [ ] Image URL is stored in `fullProperty.address.photoUrl`
- [ ] PropertyCard displays image (or fallback icon if missing)
- [ ] Images load correctly (no CORS errors)
- [ ] Broken image URLs fallback to MapPin icon
- [ ] Images are properly sized (600x400 or responsive)

---

## 🚨 COMMON ISSUES & FIXES

### Issue 1: CORS Errors
**Problem:** Browser blocks images from MLS/Zillow servers
**Fix:**
```typescript
// Proxy images through your server
const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
```

**Create proxy endpoint:**
```typescript
// api/proxy-image.ts
export default async function handler(req, res) {
  const { url } = req.query;
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  res.setHeader('Content-Type', response.headers.get('content-type'));
  res.send(Buffer.from(buffer));
}
```

---

### Issue 2: Images Expire
**Problem:** MLS image URLs become invalid after 24-48 hours
**Fix:** Download and store images locally
```typescript
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

async function cacheImage(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();

  const filename = `${uuidv4()}.jpg`;
  const localPath = `public/property-photos/${filename}`;

  await fs.writeFile(localPath, Buffer.from(buffer));

  return `/property-photos/${filename}`;  // Serve from your domain
}
```

---

### Issue 3: Low-Quality Images
**Problem:** LLM returns thumbnails instead of full-size images
**Fix:** Filter by image dimensions
```typescript
function extractLargestImage(llmResponse: string): string | null {
  const imageUrls = llmResponse.match(/(https?:\/\/.*?\.(?:jpg|jpeg|png)(?:\?[^\s]*)?)/gi) || [];

  // Prioritize URLs with size indicators
  const largeImages = imageUrls.filter(url =>
    url.includes('1200') || url.includes('1024') || url.includes('large') || url.includes('main')
  );

  return largeImages[0] || imageUrls[0] || null;
}
```

---

## 💰 COST ANALYSIS

### Option 1: LLM Image Extraction
- **Cost:** $0 (uses existing Perplexity/Grok calls)
- **Success Rate:** 70-85% (depends on LLM finding listing pages)
- **Best for:** Bulk property searches

### Option 2: Google Street View
- **Cost:** $0.007 per image (after 28,000 free/month)
- **Success Rate:** 99%+ (always available)
- **Best for:** Fallback when LLM fails

### Option 3: Image Caching (Local Storage)
- **Cost:** ~$0.10/GB/month (AWS S3) or ~$25/month (Cloudinary free tier)
- **Success Rate:** 100% (once cached)
- **Best for:** Long-term reliability

---

## 🎯 RECOMMENDED APPROACH

**Hybrid Strategy:**
1. ✅ **Try LLM extraction first** (free, high-quality listing photos)
2. ⚠️ **Fallback to Google Street View** (if LLM fails, costs $)
3. 📦 **Cache images locally** (for frequently viewed properties)

**Implementation Priority:**
1. **Week 1:** Add LLM image extraction (2-4 hours)
2. **Week 2:** Add Google Street View fallback (1-2 hours)
3. **Week 3:** Implement image caching (2-3 hours)

---

## 📝 SAMPLE CODE (Complete Implementation)

```typescript
// api/property/search.ts

import fetch from 'node-fetch';

// Extract image from LLM response
function extractImageUrl(llmResponse: string): string | null {
  const patterns = [
    /!\[.*?\]\((https?:\/\/.*?\.(?:jpg|jpeg|png|webp).*?)\)/i,  // Markdown
    /<img[^>]+src="(https?:\/\/.*?\.(?:jpg|jpeg|png|webp).*?)"/i,  // HTML
    /(https?:\/\/.*?\.(?:jpg|jpeg|png|webp)(?:\?[^\s]*)?)/i  // Plain URL
  ];

  for (const pattern of patterns) {
    const match = llmResponse.match(pattern);
    if (match) {
      // Filter out tiny thumbnails/icons
      const url = match[1];
      if (url.includes('icon') || url.includes('logo') || url.includes('16x16')) {
        continue;
      }
      return url;
    }
  }

  return null;
}

// Google Street View fallback
async function getStreetViewImage(address: string): Promise<string> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return '';

  const url = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodeURIComponent(address)}&key=${apiKey}`;

  return url;
}

// Main search function
export async function searchProperty(address: string) {
  // 1. Get LLM responses (existing code)
  const perplexityData = await callPerplexity(address);
  const grokData = await callGrok(address);

  // 2. Extract property image
  let thumbnail = extractImageUrl(perplexityData.raw_response) ||
                 extractImageUrl(grokData.raw_response);

  // 3. Fallback to Google Street View if no image found
  if (!thumbnail) {
    console.log('[SEARCH] No listing photo found, using Street View');
    thumbnail = await getStreetViewImage(address);
  }

  // 4. Return with thumbnail
  return {
    ...fields,
    property_photo_url: {
      value: thumbnail,
      source: thumbnail?.includes('googleapis.com') ? 'Google Street View' : 'LLM',
      confidence: thumbnail ? 'Medium' : 'Low'
    }
  };
}
```

---

## ✅ SUMMARY

**Difficulty:** ⭐⭐ Easy (infrastructure already in place!)
**Time:** 2-4 hours
**Cost:** $0 initially (LLM extraction), then $7/1000 images if using Google Street View fallback

**What you need to do:**
1. Add image URL extraction logic to your LLM response parser
2. Map extracted URL to `thumbnail` field in PropertyCard
3. (Optional) Add Google Street View fallback
4. (Optional) Add image caching for reliability

**Expected Result:**
- Property cards show actual listing photos (or street view)
- Fallback to MapPin icon if image fails to load
- No UI changes needed (already built!)

Want me to implement Option 1 (LLM image extraction) now? It's the quickest and cheapest approach.
