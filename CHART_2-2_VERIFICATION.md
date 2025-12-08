# Chart 2-2 (Value Momentum) - Data Flow Verification

## ✅ VERIFIED: Fully Wired to 168-Field Schema

### Data Flow Chain:

1. **SOURCE OF TRUTH** → `src/types/fields-schema.ts`
   - Field 10: `listing_price` (currency)
   - Field 12: `market_value_estimate` (currency)
   - Field 13: `last_sale_date` (date)
   - Field 14: `last_sale_price` (currency)
   - Field 15: `assessed_value` (currency)

2. **PROPERTY STORE** → `src/store/propertyStore.ts`
   - Stores Property objects with 168 DataField<T> structure
   - Example: `property.address.listingPrice.value`

3. **DATA MAPPER** → `src/lib/visualsDataMapper.ts`
   - Converts Property → ChartProperty (flat structure)
   - Line 231: `listingPrice: getVal(addr?.listingPrice, 0)`
   - Line 233: `marketValueEstimate: getVal(details?.marketValueEstimate, 0)`
   - Line 237: `lastSaleDate: getVal(details?.lastSaleDate, '')`
   - Line 236: `lastSalePrice: getVal(details?.lastSalePrice, 0)`
   - Line 235: `assessedValue: getVal(details?.assessedValue, 0)`

4. **CATEGORY21 COMPONENT** → `src/components/visuals/Category21_AdvancedVisuals.tsx`
   - Line 126: `const { fullProperties } = usePropertyStore();`
   - Line 133: `const allChartProperties = mapPropertiesToChart(allProperties);`
   - Line 266: `<ValueMomentumChart properties={selectedChartProperties} />`

5. **CHART COMPONENT** → `src/components/visuals/deepseek/ValueMomentumChart.tsx`
   - Line 54: `const lastSalePrice = property.lastSalePrice;`
   - Line 55: `const assessedValue = property.assessedValue;`
   - Line 56: `const marketEstimate = property.marketValueEstimate;`
   - Line 57: `const listingPrice = property.listingPrice;`
   - Line 53: `const lastSaleDate = property.lastSaleDate || 'Unknown';`

### Smart Score Calculation (5-Tier System):

**Metric 1: Appreciation from Last Sale (50% weight)**
- -20% or worse = 0 pts (Red/Poor)
- -10% = 25 pts (Orange/Below Average)
- 0% = 50 pts (Yellow/Average)
- +10% = 75 pts (Blue/Good)
- +20% or better = 100 pts (Green/Excellent)

**Metric 2: Market Estimate vs Listing (30% weight)**
- Same 5-tier scale based on % difference from 1.0 ratio
- Ratio > 1.0 = underpriced (better)
- Ratio < 1.0 = overpriced (worse)

**Metric 3: Assessed Value vs Listing (20% weight)**
- Same 5-tier scale based on % difference from 1.0 ratio
- Ratio > 1.0 = underpriced (better)
- Ratio < 1.0 = overpriced (worse)

**Final Score:** Weighted average mapped to CLUES-Smart 5-band color system

### Console Logging:

The chart now logs:
1. **Data Verification:** Shows all 5 field values for each property
2. **Smart Score Calculation:** Shows each metric, intermediate scores, and final weighted score

### NO FAKE DATA:

✅ Chart only plots points with REAL data
✅ Uses `if (value)` checks before adding data points
✅ Returns early if no data available
✅ No fallback estimates or fake values

### Field Name Accuracy:

✅ All field names match fields-schema.ts exactly
✅ Snake_case in schema → camelCase in TypeScript
✅ No deprecated fields (e.g., zillowEstimate) used
✅ marketValueEstimate correctly mapped (NOT redfinEstimate)

---

**Status:** ✅ FULLY VERIFIED - Chart receives real data from 168-field schema and calculates with 5-tier CLUES-Smart scoring system
