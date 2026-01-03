# Chart 2-3 (Listing Price Comparison) - Data Flow & Smart Score Verification

## ✅ VERIFIED: Fully Wired to 168-Field Schema

### Data Flow Chain:

1. **SOURCE OF TRUTH** → `src/types/fields-schema.ts`
   - Field 10: `listing_price` (currency)
   - Field 11: `price_per_sqft` (currency)
   - Field 12: `market_value_estimate` (currency)
   - Field 13: `last_sale_date` (date)
   - Field 14: `last_sale_price` (currency)
   - Field 15: `assessed_value` (currency)

2. **PROPERTY STORE** → `src/store/propertyStore.ts`
   - Stores Property objects with 168 DataField<T> structure

3. **DATA MAPPER** → `src/lib/visualsDataMapper.ts`
   - Line 231: `listingPrice: getVal(addr?.listingPrice, 0)` (Field 10)
   - Line 232: `pricePerSqft: getVal(addr?.pricePerSqft, 0)` (Field 11)
   - Line 233: `marketValueEstimate: getVal(details?.marketValueEstimate, 0)` (Field 12)
   - Line 237: `lastSaleDate: getVal(details?.lastSaleDate, '')` (Field 13)
   - Line 236: `lastSalePrice: getVal(details?.lastSalePrice, 0)` (Field 14)
   - Line 235: `assessedValue: getVal(details?.assessedValue, 0)` (Field 15)

4. **CATEGORY21 MAPPER** → `src/components/visuals/Category21_AdvancedVisuals.tsx` (Lines 37-51)
   ```typescript
   function mapToRealEstateHomes(properties: ChartProperty[]) {
     return properties.map((p) => ({
       id: p.id,
       name: p.address || 'Unknown Address',
       listingPrice: p.listingPrice || 0,                      // Field 10
       pricePerSqFt: p.pricePerSqft || 0,                     // Field 11
       marketValue: p.marketValueEstimate || 0,                // Field 12
       lastSaleDate: p.lastSaleDate || 'N/A',                 // Field 13
       lastSalePrice: p.lastSalePrice || 0,                   // Field 14
       assessedValue: p.assessedValue || 0,                   // Field 15
       redfinEstimate: p.redfinEstimate || p.marketValueEstimate || 0,
     }));
   }
   ```

5. **CHART COMPONENT** → `src/components/visuals/recharts/RealEstateDashboard.tsx`
   - Line 386: `listingPrice: h.listingPrice` (uses Field 10 data)

### Smart Score Methodology (5-Tier System):

**Chart Purpose:** Compare listing prices to identify the most affordable property

**Metric:** Listing Price (Field 10) - **Lower is Better**

**Scoring Logic:**
```typescript
scoreLowerIsBetter(values) {
  // Cheapest property = 100 pts (Green/Excellent)
  // Most expensive = 0 pts (Red/Poor)
  
  const percentile = (max - value) / (max - min);
  
  // 5-TIER MAPPING:
  if (percentile <= 0.2) return 0;    // Bottom 20% = Red/Poor
  if (percentile <= 0.4) return 25;   // 20-40% = Orange/Below Average  
  if (percentile <= 0.6) return 50;   // 40-60% = Yellow/Average
  if (percentile <= 0.8) return 75;   // 60-80% = Blue/Good
  return 100;                          // Top 20% = Green/Excellent
}
```

**Example:**
- 3 properties: $2.5M, $2.7M, $2.85M
- Cheapest ($2.5M) = 100/100 (Green) - Best affordability
- Middle ($2.7M) = 50/100 (Yellow) - Average
- Most expensive ($2.85M) = 0/100 (Red) - Poor affordability

**Winner Logic:**
- Property with highest score (lowest price) wins
- Badge shows "✅ Best: [Property Name] ($X cheaper than the next home)"

### Console Logging:

The chart logs:
1. **Data Verification:** Shows listing price from Field 10 for each property
2. **Smart Score Calculation:** Shows final score (0-100) for each property

### Field Name Changes Fixed:

❌ **BEFORE** (WRONG):
```typescript
marketValue: p.zillowEstimate || p.redfinEstimate || p.listingPrice || 0
pricePerSqFt: p.listingPrice && p.livingSqft ? p.listingPrice / p.livingSqft : 0
```

✅ **AFTER** (CORRECT):
```typescript
marketValue: p.marketValueEstimate || 0                    // Field 12 (schema)
pricePerSqFt: p.pricePerSqft || 0                         // Field 11 (pre-calculated)
```

### Color Bands:

- **0-20 Red (Poor):** Most expensive property in comparison
- **21-40 Orange (Below Average):** Above-average price
- **41-60 Yellow (Average):** Mid-range price
- **61-80 Blue (Good):** Below-average price (good deal)
- **81-100 Green (Excellent):** Cheapest property (best affordability)

---

**Status:** ✅ FULLY VERIFIED - Chart receives real Field 10 data and scores with CLUES-Smart 5-tier system
