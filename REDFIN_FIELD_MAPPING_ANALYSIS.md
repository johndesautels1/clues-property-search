# Redfin Field Mapping Analysis

## ✅ SAFE - Field Mapping Strategy

### **Key Finding:**
Redfin API returns **raw field names** (e.g., `beds`, `baths`, `sqFt`), but our integration will **manually map** them to numbered fields using the `setField()` helper (same pattern as ALL other APIs).

---

## Redfin Response Structure → Schema Mapping

### **What Redfin Returns:**
```json
{
  "aboveTheFold": {
    "addressSectionInfo": {
      "beds": 3,
      "baths": 1.5,
      "sqFt": { "value": 1344 },
      "lotSize": 2285,
      "yearBuilt": 1950,
      "apn": "366018",
      "priceInfo": { "amount": 867528 },
      "latestPriceInfo": { "amount": 790000 },
      "soldDate": 1700121600000,
      "avmInfo": { "predictedValue": 867528.14 }
    }
  }
}
```

### **How We Will Map It:**
```typescript
// In callRedfinProperty() function:
const addressInfo = data.aboveTheFold?.addressSectionInfo;

// Manual field mapping using exact field numbers from schema
setField(fields, '16_redfin_estimate', addressInfo.avmInfo?.predictedValue, 'Redfin', 'High');
setField(fields, '14_last_sale_price', addressInfo.latestPriceInfo?.amount, 'Redfin', 'High');
setField(fields, '13_last_sale_date', new Date(addressInfo.soldDate).toISOString().split('T')[0], 'Redfin', 'High');
setField(fields, '17_bedrooms', addressInfo.beds, 'Redfin', 'High');
setField(fields, '18_total_bathrooms', addressInfo.baths, 'Redfin', 'High');
setField(fields, '21_living_sqft', addressInfo.sqFt?.value, 'Redfin', 'High');
setField(fields, '23_lot_size_sqft', addressInfo.lotSize, 'Redfin', 'High');
setField(fields, '25_year_built', addressInfo.yearBuilt, 'Redfin', 'High');
setField(fields, '34_parcel_id', addressInfo.apn, 'Redfin', 'High');
```

---

## Field Normalizer Compatibility

### **Does NOT Need Normalizer:**
- ✅ **Redfin integration directly uses numbered fields** (e.g., `'16_redfin_estimate'`)
- ✅ **Same pattern as Google, WalkScore, USGS, EPA, NOAA** (all use `setField()` with numbered keys)
- ✅ **Normalizer is ONLY for Perplexity LLM responses** (which return grouped field names)

### **Why This is Safe:**
```typescript
// Field normalizer is for THIS:
{
  "pricing_value": {
    "listing_price": 500000,  // ← Needs normalization to "10_listing_price"
    "redfin_estimate": 480000  // ← Needs normalization to "16_redfin_estimate"
  }
}

// But Redfin uses THIS pattern (like all other APIs):
setField(fields, '16_redfin_estimate', 480000, 'Redfin', 'High');
// ↑ Already in correct numbered format, no normalization needed
```

---

## Comparison: Redfin vs Other APIs

| API | Returns Raw Names? | Uses setField()? | Needs Normalizer? |
|-----|-------------------|------------------|-------------------|
| Google Geocode | Yes (`city`, `state`) | ✅ Yes | ❌ No |
| WalkScore | Yes (`walkscore`, `transit`) | ✅ Yes | ❌ No |
| SchoolDigger | Yes (`schoolName`, `rank`) | ✅ Yes | ❌ No |
| USGS Elevation | Yes (`value`) | ✅ Yes | ❌ No |
| EPA FRS | Yes (`facilityName`) | ✅ Yes | ❌ No |
| **Redfin** | **Yes (`beds`, `baths`)** | **✅ Yes** | **❌ No** |
| Perplexity LLM | No (grouped fields) | ❌ No | ✅ YES |

---

## Complete Field Mapping Table

| Redfin Response Path | Field # | Field Name | Schema Type |
|---------------------|---------|------------|-------------|
| `avmInfo.predictedValue` | 16 | redfin_estimate | number |
| `latestPriceInfo.amount` | 14 | last_sale_price | number |
| `soldDate` | 13 | last_sale_date | date |
| `beds` | 17 | bedrooms | number |
| `baths` | 18 | total_bathrooms | number |
| `sqFt.value` | 21 | living_sqft | number |
| `lotSize` | 23 | lot_size_sqft | number |
| `yearBuilt` | 25 | year_built | number |
| `apn` | 34 | parcel_id | text |
| `pricePerSqFt` | 11 | price_per_sqft | number |
| `walkScore.value` | 61 | walk_score | number |
| `transitScore.value` | 62 | transit_score | number |
| `bikeScore.value` | 63 | bike_score | number |

---

## ✅ Safety Guarantees

1. ✅ **Uses exact same `setField()` pattern** as Google, WalkScore, USGS, EPA, NOAA
2. ✅ **Does NOT touch field-normalizer.ts** (only for Perplexity LLM)
3. ✅ **Uses correct numbered field format** from fields-schema.ts
4. ✅ **Returns standard `ApiResult` interface** like all other APIs
5. ✅ **No changes to existing field mapping logic**
6. ✅ **No risk to 168-field schema**

---

## Example Integration Code

```typescript
export async function callRedfinProperty(address: string): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};

  try {
    // Step 1: Get Redfin URL from autocomplete
    const autocompleteUrl = `https://redfin5.p.rapidapi.com/auto-complete?query=${encodeURIComponent(address)}`;
    const autocompleteResult = await safeFetch(autocompleteUrl, {
      headers: {
        'x-rapidapi-host': process.env.RAPIDAPI_HOST!,
        'x-rapidapi-key': process.env.RAPIDAPI_KEY!
      }
    }, 'Redfin-Autocomplete');

    if (!autocompleteResult.success) {
      return { success: false, source: 'Redfin', fields };
    }

    const redfinUrl = autocompleteResult.data.payload?.exactMatch?.url;
    if (!redfinUrl) {
      return { success: false, source: 'Redfin', fields };
    }

    // Step 2: Get property details
    const detailsUrl = `https://redfin5.p.rapidapi.com/properties/get-info?url=${encodeURIComponent(redfinUrl)}`;
    const detailsResult = await safeFetch(detailsUrl, {
      headers: {
        'x-rapidapi-host': process.env.RAPIDAPI_HOST!,
        'x-rapidapi-key': process.env.RAPIDAPI_KEY!
      }
    }, 'Redfin-Details');

    if (!detailsResult.success) {
      return { success: false, source: 'Redfin', fields };
    }

    const addressInfo = detailsResult.data.aboveTheFold?.addressSectionInfo;

    // Map to numbered fields (SAME PATTERN AS ALL OTHER APIs)
    if (addressInfo) {
      setField(fields, '16_redfin_estimate', addressInfo.avmInfo?.predictedValue, 'Redfin', 'High');
      setField(fields, '14_last_sale_price', addressInfo.latestPriceInfo?.amount, 'Redfin', 'High');
      setField(fields, '17_bedrooms', addressInfo.beds, 'Redfin', 'High');
      setField(fields, '18_total_bathrooms', addressInfo.baths, 'Redfin', 'High');
      setField(fields, '21_living_sqft', addressInfo.sqFt?.value, 'Redfin', 'High');
      setField(fields, '23_lot_size_sqft', addressInfo.lotSize, 'Redfin', 'High');
      setField(fields, '25_year_built', addressInfo.yearBuilt, 'Redfin', 'High');
      setField(fields, '34_parcel_id', addressInfo.apn, 'Redfin', 'High');
    }

    return { success: Object.keys(fields).length > 0, source: 'Redfin', fields };

  } catch (error) {
    return { success: false, source: 'Redfin', fields, error: String(error) };
  }
}
```

---

## Conclusion

✅ **SAFE TO INTEGRATE**
- Uses same exact pattern as 7 existing APIs (Google, WalkScore, SchoolDigger, NOAA, USGS, EPA)
- Does NOT need field-normalizer modifications
- Does NOT touch 168-field schema
- Uses correct numbered field format
- Zero risk to existing functionality
