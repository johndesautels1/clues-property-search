# Chart 2-6: Appreciation Since Last Sale - Verification Document

**Created:** 2025-12-08
**Chart Location:** Category 21 - Advanced Visuals
**Component:** `RealEstateDashboard.tsx` → `AppreciationChart` (lines 765-910)

---

## ✅ SCHEMA FIELD MAPPING VERIFICATION

### Fields Used (from 168-field schema):
| Field # | Field Key | Field Label | Type | Used For |
|---------|-----------|-------------|------|----------|
| **10** | `listing_price` | Listing Price | currency | Current asking price |
| **13** | `last_sale_date` | Last Sale Date | date | X-axis label (when property was last sold) |
| **14** | `last_sale_price` | Last Sale Price | currency | Calculate appreciation from |

### Data Flow Chain:
```
1. fields-schema.ts (SOURCE OF TRUTH)
   ↓ Field 10: listing_price
   ↓ Field 13: last_sale_date
   ↓ Field 14: last_sale_price

2. propertyStore (fullProperties Map)
   ↓ Stores raw property data with schema field names

3. visualsDataMapper.ts → mapPropertiesToChart()
   ↓ Maps to ChartProperty interface
   ↓ listingPrice, lastSaleDate, lastSalePrice

4. Category21_AdvancedVisuals.tsx → mapToRealEstateHomes()
   ↓ Maps ChartProperty → Home interface
   ↓ Line 43: listingPrice: p.listingPrice || 0
   ↓ Line 46: lastSaleDate: p.lastSaleDate || 'N/A'
   ↓ Line 47: lastSalePrice: p.lastSalePrice || 0

5. RealEstateDashboard.tsx → AppreciationChart()
   ✅ RECEIVES: homes array with correct field mappings
   ✅ CALCULATES: appreciation % and dollar value
   ✅ DISPLAYS: Chart with Smart Score
```

---

## 📊 APPRECIATION CALCULATION

### Formula:
```typescript
appreciation = ((listingPrice - lastSalePrice) / lastSalePrice) * 100
dollarAppreciation = listingPrice - lastSalePrice
```

### Example (Sample Property 3: 725 Live Oak Street):
```
Field 10 (listing_price):   $2,549,000
Field 14 (last_sale_price):  $2,200,000
Field 13 (last_sale_date):   '2019-01-01'

Calculation:
appreciation = (($2,549,000 - $2,200,000) / $2,200,000) * 100
             = ($349,000 / $2,200,000) * 100
             = 15.86%

dollarAppreciation = $2,549,000 - $2,200,000 = $349,000
```

---

## 🧠 5-TIER CLUES-SMART SCORING SYSTEM

### Scoring Method: `scoreHigherIsBetter()`
- **Higher appreciation % = Better score**
- Maps values to 5-tier percentile scale

### 5-Tier Percentile Mapping:
```
Percentile Range → Score → Color Band
─────────────────────────────────────
0-20%   (worst)  →   0 → Red (Poor)
20-40%           →  25 → Orange (Below Average)
40-60%           →  50 → Yellow (Average)
60-80%           →  75 → Blue (Good)
80-100% (best)   → 100 → Green (Excellent)
```

### Example Scoring (3 Properties):
```
Property 1: 1821 Hillcrest - 13.96% appreciation
Property 2: 1947 Oakwood   - 12.29% appreciation
Property 3: 725 Live Oak   - 15.86% appreciation (HIGHEST)

Percentile Calculation:
- 725 Live Oak (15.86%) = 100th percentile → Score: 100 (Green/Excellent)
- 1821 Hillcrest (13.96%) = 50th percentile → Score: 50 (Yellow/Average)
- 1947 Oakwood (12.29%) = 0th percentile → Score: 0 (Red/Poor)
```

### Score Bands:
| Score Range | Color | Label | Meaning |
|-------------|-------|-------|---------|
| 0-20 | `#ef4444` (Red) | Poor | Lowest appreciation |
| 21-40 | `#f97316` (Orange) | Below Average | Below median appreciation |
| 41-60 | `#eab308` (Yellow) | Average | Median appreciation |
| 61-80 | `#3b82f6` (Blue) | Good | Above average appreciation |
| 81-100 | `#22c55e` (Green) | Excellent | Highest appreciation |

---

## 🎨 CHART FEATURES

### Visual Elements:
1. **Bar Chart**: Vertical bars showing appreciation %
2. **X-Axis Labels (Two Lines)**:
   - Line 1: Property name (colored by property)
   - Line 2: Last sale date in parentheses (gray)
3. **Y-Axis**: Percentage scale
4. **Smart Score Badge**: Shows best property's score (0-100)
5. **Chart Number Label**: "Chart 2-6" in upper left

### Tooltip on Hover:
```
Label: "1821 Hillcrest Drive - Last Sale: 2020-01-01"
Value: "13.96% ($349,000)"
        ↑          ↑
     percentage  dollar value
```

### Console Logging (for verification):
```javascript
🔍 Chart 2-6: Appreciation Since Last Sale - Data Verification:

📊 Property 1: 1821 Hillcrest Drive
  Field 10 (listing_price): $2,849,000
  Field 13 (last_sale_date): 2020-01-01
  Field 14 (last_sale_price): $2,500,000

🧠 Chart 2-6: Smart Score Calculation (5-Tier System):

📊 Property 1: 1821 Hillcrest Drive
  Appreciation: 13.96%
  Dollar Value: $349,000
  🎯 Smart Score: 50.0/100

🏆 Winner: 725 Live Oak Street - Score: 100.0/100
```

---

## ✅ REAL DATA READINESS CHECKLIST

### Data Flow:
- [x] Chart receives data from `mapToRealEstateHomes()` mapper
- [x] Mapper pulls from `ChartProperty` interface
- [x] `ChartProperty` populated by `visualsDataMapper.ts`
- [x] `visualsDataMapper.ts` reads from `propertyStore`
- [x] `propertyStore` contains full 168-field property data

### Field Mapping:
- [x] Field 10 (`listing_price`) → `home.listingPrice`
- [x] Field 13 (`last_sale_date`) → `home.lastSaleDate`
- [x] Field 14 (`last_sale_price`) → `home.lastSalePrice`

### Calculations:
- [x] Appreciation % calculated correctly: `(listing - lastSale) / lastSale * 100`
- [x] Dollar appreciation calculated: `listing - lastSale`
- [x] Smart Score uses 5-tier `scoreHigherIsBetter()` function

### Display:
- [x] X-axis shows property name + last sale date
- [x] Y-axis shows appreciation percentage
- [x] Tooltip shows percentage AND dollar value
- [x] Smart Score badge displays best score (0-100)
- [x] Chart number "Chart 2-6" labeled
- [x] Colors match 5-tier bands (Red/Orange/Yellow/Blue/Green)

### Verification:
- [x] Console logging shows all field data
- [x] Console logging shows score calculations
- [x] Console logging shows winner determination

---

## 🔧 TECHNICAL IMPLEMENTATION

### Component: `AppreciationChart`
**File:** `src/components/visuals/recharts/RealEstateDashboard.tsx`
**Lines:** 765-910

### Key Code Sections:

#### 1. Data Mapping (Lines 777-789):
```typescript
const data = homes.map((h, index) => {
  const appreciation = ((h.listingPrice - h.lastSalePrice) / h.lastSalePrice) * 100;
  const dollarAppreciation = h.listingPrice - h.lastSalePrice;
  return {
    name: h.name,
    appreciation,
    dollarAppreciation,
    lastSaleDate: h.lastSaleDate || 'N/A',
    lastSalePrice: h.lastSalePrice,
    listingPrice: h.listingPrice,
    index,
  };
});
```

#### 2. 5-Tier Scoring (Line 796):
```typescript
const scores = scoreHigherIsBetter(values);
// Maps to 0, 25, 50, 75, 100 based on percentile
```

#### 3. Custom X-Axis Tick (Lines 820-836):
```typescript
const CustomXAxisTick = ({ x, y, payload }: any) => {
  const entry = data.find(d => d.name === payload.value);
  const color = entry ? PROPERTY_COLORS[entry.index] || COLORS.muted : COLORS.muted;
  const shortName = payload.value.split(',')[0];
  const saleDate = entry?.lastSaleDate || 'N/A';

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={8} textAnchor="middle" fill={color} fontSize={10} fontWeight={600}>
        {shortName}
      </text>
      <text x={0} y={0} dy={20} textAnchor="middle" fill={COLORS.muted} fontSize={8}>
        ({saleDate})
      </text>
    </g>
  );
};
```

#### 4. Enhanced Tooltip (Lines 854-869):
```typescript
<Tooltip
  formatter={(value, name, props) => {
    const dollarValue = props.payload.dollarAppreciation;
    return [
      `${formatPercent(value as number)} (${formatCurrency(dollarValue)})`,
      'Appreciation'
    ];
  }}
  labelFormatter={(label) => {
    const entry = data.find(d => d.name === label);
    return entry ? `${entry.name} - Last Sale: ${entry.lastSaleDate}` : label;
  }}
/>
```

---

## 🎯 SUMMARY

**Chart 2-6: Appreciation Since Last Sale** is now:

1. ✅ **Fully Wired** to receive real property data from the 168-field schema
2. ✅ **Correctly Mapped** using Fields 10, 13, and 14
3. ✅ **5-Tier Scored** using `scoreHigherIsBetter()` for percentile-based ranking
4. ✅ **Verified** with comprehensive console logging
5. ✅ **Enhanced UX** with dollar values in tooltip and dates on X-axis
6. ✅ **Properly Labeled** as "Chart 2-6"

### Smart Score Methodology:
- **Metric:** Appreciation % since last sale
- **Direction:** Higher is better (more appreciation = higher score)
- **Scoring:** 5-tier percentile system (0, 25, 50, 75, 100)
- **Colors:** Red (Poor) → Orange → Yellow (Average) → Blue → Green (Excellent)

The chart will correctly compare any 3+ properties and rank them by appreciation performance using the CLUES-Smart 5-tier color-coded scoring system.
