# 🎯 FIELD 169-181 REPURPOSING - COMPLETE MASTER PLAN
**Created**: 2026-01-11
**Strategy**: Option B - Repurpose fields 169-174 to collect Tavily-researchable market data
**Execution Mode**: SAFE MODE - Phase by phase with approvals
**Total Files**: 20 files requiring modification
**Estimated Time**: 3.5 hours across 7 phases

---

## 📊 FIELD REPURPOSING SUMMARY

### **Fields 169-174: OLD → NEW Definitions**

| Field # | OLD Definition (Unavailable) | NEW Definition (Tavily-Researchable) | Data Type |
|---------|----------------------------|-------------------------------------|-----------|
| **169** | ~~zillow_views~~ (number) | **months_of_inventory** | number |
| **170** | ~~redfin_views~~ (number) | **new_listings_30d** | number |
| **171** | ~~homes_views~~ (number) | **homes_sold_30d** | number |
| **172** | ~~realtor_views~~ (number) | **median_dom_zip** | number |
| **173** | ~~total_views~~ (calculated) | **price_reduced_percent** | percentage |
| **174** | ~~saves_favorites~~ (number) | **homes_under_contract** | number |

### **Fields 175-181: KEEP Definitions, ADD Tavily Configs**

| Field # | Current Definition | Action Required |
|---------|-------------------|-----------------|
| **175** | market_type (select) | ✅ Create Tavily config |
| **176** | avg_sale_to_list_percent (percentage) | ✅ Create Tavily config |
| **177** | avg_days_to_pending (number) | ✅ Create Tavily config |
| **178** | multiple_offers_likelihood (select) | ✅ LLM inference logic |
| **179** | appreciation_percent (percentage) | ✅ Create Tavily config |
| **180** | price_trend (select) | ✅ Create Tavily config |
| **181** | rent_zestimate (currency) | ✅ Create Tavily config |

---

## 📋 COMPLETE FILE MODIFICATION MANIFEST

### **PHASE 1: Schema Foundation** (3 files)

#### **1.1 - fields-schema.ts**
**File**: `D:\Clues_Quantum_Property_Dashboard\src\types\fields-schema.ts`
**Lines**: 317-329 (Market Performance section)
**Action**: Replace 6 field definitions (169-174)

**BEFORE** (Lines 317-322):
```typescript
{ num: 169, key: 'zillow_views',                label: 'Zillow Views',              group: 'Market Performance', type: 'number',     required: false },
{ num: 170, key: 'redfin_views',                label: 'Redfin Views',              group: 'Market Performance', type: 'number',     required: false },
{ num: 171, key: 'homes_views',                 label: 'Homes.com Views',           group: 'Market Performance', type: 'number',     required: false },
{ num: 172, key: 'realtor_views',               label: 'Realtor.com Views',         group: 'Market Performance', type: 'number',     required: false },
{ num: 173, key: 'total_views',                 label: 'Total Views',               group: 'Market Performance', type: 'number',     required: false, calculated: true },
{ num: 174, key: 'saves_favorites',             label: 'Saves/Favorites',           group: 'Market Performance', type: 'number',     required: false },
```

**AFTER**:
```typescript
{ num: 169, key: 'months_of_inventory',         label: 'Months of Inventory',       group: 'Market Performance', type: 'number',     required: false },
{ num: 170, key: 'new_listings_30d',            label: 'New Listings (30d)',        group: 'Market Performance', type: 'number',     required: false },
{ num: 171, key: 'homes_sold_30d',              label: 'Homes Sold (30d)',          group: 'Market Performance', type: 'number',     required: false },
{ num: 172, key: 'median_dom_zip',              label: 'Median DOM (ZIP)',          group: 'Market Performance', type: 'number',     required: false },
{ num: 173, key: 'price_reduced_percent',       label: 'Price Reduced %',           group: 'Market Performance', type: 'percentage', required: false },
{ num: 174, key: 'homes_under_contract',        label: 'Homes Under Contract',      group: 'Market Performance', type: 'number',     required: false },
```

---

#### **1.2 - property.ts**
**File**: `D:\Clues_Quantum_Property_Dashboard\src\types\property.ts`
**Lines**: 275-287 (MarketPerformanceData interface)
**Action**: Rename 6 property names (169-174)

**BEFORE** (Lines 275-280):
```typescript
export interface MarketPerformanceData {
  zillowViews: DataField<number>;           // #169 zillow_views
  redfinViews: DataField<number>;           // #170 redfin_views
  homesViews: DataField<number>;            // #171 homes_views
  realtorViews: DataField<number>;          // #172 realtor_views
  totalViews: DataField<number>;            // #173 total_views
  savesFavorites: DataField<number>;        // #174 saves_favorites
```

**AFTER**:
```typescript
export interface MarketPerformanceData {
  monthsOfInventory: DataField<number>;     // #169 months_of_inventory
  newListings30d: DataField<number>;        // #170 new_listings_30d
  homesSold30d: DataField<number>;          // #171 homes_sold_30d
  medianDomZip: DataField<number>;          // #172 median_dom_zip
  priceReducedPercent: DataField<number>;   // #173 price_reduced_percent
  homesUnderContract: DataField<number>;    // #174 homes_under_contract
```

---

#### **1.3 - field-normalizer.ts**
**File**: `D:\Clues_Quantum_Property_Dashboard\src\lib\field-normalizer.ts`
**Lines**: 267-272 (Market Performance field mappings)
**Action**: Update 6 field mappings (169-174)

**BEFORE** (Lines 267-272):
```typescript
{ fieldNumber: 169, apiKey: '169_zillow_views', group: 'marketPerformance', propName: 'zillowViews', type: 'number' },
{ fieldNumber: 170, apiKey: '170_redfin_views', group: 'marketPerformance', propName: 'redfinViews', type: 'number' },
{ fieldNumber: 171, apiKey: '171_homes_views', group: 'marketPerformance', propName: 'homesViews', type: 'number' },
{ fieldNumber: 172, apiKey: '172_realtor_views', group: 'marketPerformance', propName: 'realtorViews', type: 'number' },
{ fieldNumber: 173, apiKey: '173_total_views', group: 'marketPerformance', propName: 'totalViews', type: 'number' },
{ fieldNumber: 174, apiKey: '174_saves_favorites', group: 'marketPerformance', propName: 'savesFavorites', type: 'number' },
```

**AFTER**:
```typescript
{ fieldNumber: 169, apiKey: '169_months_of_inventory', group: 'marketPerformance', propName: 'monthsOfInventory', type: 'number' },
{ fieldNumber: 170, apiKey: '170_new_listings_30d', group: 'marketPerformance', propName: 'newListings30d', type: 'number' },
{ fieldNumber: 171, apiKey: '171_homes_sold_30d', group: 'marketPerformance', propName: 'homesSold30d', type: 'number' },
{ fieldNumber: 172, apiKey: '172_median_dom_zip', group: 'marketPerformance', propName: 'medianDomZip', type: 'number' },
{ fieldNumber: 173, apiKey: '173_price_reduced_percent', group: 'marketPerformance', propName: 'priceReducedPercent', type: 'number' },
{ fieldNumber: 174, apiKey: '174_homes_under_contract', group: 'marketPerformance', propName: 'homesUnderContract', type: 'number' },
```

---

### **PHASE 2: Tavily Configurations** (2 files)

#### **2.1 - tavily-field-config.ts**
**File**: `D:\Clues_Quantum_Property_Dashboard\api\property\tavily-field-config.ts`
**Action**: ADD 13 new field configurations (169-181)
**Location**: After Field 138 configuration (around line 1500)

**COMPLETE TAVILY CONFIGS TO ADD**:

```typescript
// ======================
// MARKET PERFORMANCE (Fields 169-181)
// ======================

169: {
  fieldId: 169,
  label: 'Months of Inventory',
  category: 'performance',
  searchQueries: [
    // Smaller, scraper-friendly sources FIRST
    'site:movoto.com "{city}, {state}" months inventory',
    'site:estately.com "{city}" market report',
    'site:homes.com "{city}, {state}" market trends',
    'site:rockethomes.com "{city}" months supply',

    // Realtor.com market data (public reports)
    'site:realtor.com/local/{zip}',
    'site:realtor.com/realestateandhomes-search/{city}_{state}/overview',

    // Redfin Data Center (public stats)
    'site:redfin.com/news/data-center/{state}',

    // Additional sources
    'site:noradarealestate.com "{city}" months inventory',
    '"{city}, {state}" months of inventory supply 2026'
  ],
  prioritySources: ['movoto.com', 'estately.com', 'homes.com', 'rockethomes.com', 'realtor.com', 'redfin.com', 'noradarealestate.com'],
  extractionPatterns: {
    regexPatterns: [
      /([\d\.]+)\s*months?\s+of\s+(inventory|supply)/i,
      /inventory[:\s]*([\d\.]+)\s*months?/i,
      /supply[:\s]*([\d\.]+)\s*months?/i
    ],
    textMarkers: ['months of inventory', 'months of supply', 'inventory level', 'months supply']
  },
  expectedSuccessRate: 0.85,
  confidenceThreshold: 'high',
  dataLevel: 'zip',
  fallbackToLLM: true,
  notes: '<3 months = Seller\'s Market, 3-6 = Balanced, >6 = Buyer\'s Market. CRITICAL market health indicator.'
},

170: {
  fieldId: 170,
  label: 'New Listings (30d)',
  category: 'performance',
  searchQueries: [
    'site:movoto.com "{city}, {state}" new listings',
    'site:estately.com "{city}" recently listed',
    'site:homes.com "{city}" new homes for sale',
    'site:realtor.com/local/{zip}',
    'site:redfin.com/news/data-center/{state} "{city}"',
    '"{city}, {state}" new listings last 30 days 2026'
  ],
  prioritySources: ['movoto.com', 'estately.com', 'homes.com', 'realtor.com', 'redfin.com'],
  extractionPatterns: {
    regexPatterns: [
      /([\d,]+)\s*new\s+listings?/i,
      /recently\s+listed[:\s]*([\d,]+)/i,
      /([\d,]+)\s*homes?\s+listed/i
    ],
    textMarkers: ['new listings', 'recently listed', 'newly listed', 'fresh inventory']
  },
  expectedSuccessRate: 0.80,
  confidenceThreshold: 'medium',
  dataLevel: 'zip',
  fallbackToLLM: true,
  notes: 'Count of new listings in last 30 days. Rising = increasing supply.'
},

171: {
  fieldId: 171,
  label: 'Homes Sold (30d)',
  category: 'performance',
  searchQueries: [
    'site:movoto.com "{city}, {state}" recently sold',
    'site:estately.com "{city}" sold homes',
    'site:realtor.com/local/{zip}',
    'site:redfin.com/news/data-center/{state} "{city}"',
    'site:rockethomes.com "{city}" closed sales',
    '"{city}, {state}" homes sold last 30 days 2026'
  ],
  prioritySources: ['movoto.com', 'estately.com', 'realtor.com', 'redfin.com', 'rockethomes.com'],
  extractionPatterns: {
    regexPatterns: [
      /([\d,]+)\s*(homes?|properties)\s+sold/i,
      /closed\s+sales?[:\s]*([\d,]+)/i,
      /sold[:\s]*([\d,]+)\s*homes?/i
    ],
    textMarkers: ['homes sold', 'recently sold', 'closed sales', 'properties sold']
  },
  expectedSuccessRate: 0.80,
  confidenceThreshold: 'medium',
  dataLevel: 'zip',
  fallbackToLLM: true,
  notes: 'Count of homes sold in last 30 days. Rising = strong demand.'
},

172: {
  fieldId: 172,
  label: 'Median DOM (ZIP)',
  category: 'performance',
  searchQueries: [
    'site:movoto.com "{city}, {state}" days on market',
    'site:realtor.com/local/{zip}',
    'site:redfin.com/zipcode/{zip}',
    'site:redfin.com/news/data-center/{state} "{city}"',
    'site:homes.com "{city}" median days market',
    '"{city}, {state}" median days on market 2026'
  ],
  prioritySources: ['movoto.com', 'realtor.com', 'redfin.com', 'homes.com'],
  extractionPatterns: {
    regexPatterns: [
      /median\s+days?\s+on\s+market[:\s]*([\d]+)/i,
      /days?\s+on\s+market[:\s]*([\d]+)/i,
      /([\d]+)\s*days?\s+to\s+sell/i
    ],
    textMarkers: ['median days on market', 'days on market', 'DOM', 'days to sell']
  },
  expectedSuccessRate: 0.75,
  confidenceThreshold: 'medium',
  dataLevel: 'zip',
  fallbackToLLM: true,
  notes: 'ZIP-level median days on market. <20 days = hot market, >60 days = slow market.'
},

173: {
  fieldId: 173,
  label: 'Price Reduced %',
  category: 'performance',
  searchQueries: [
    'site:realtor.com/local/{zip}',
    'site:redfin.com/zipcode/{zip}',
    'site:redfin.com/news/data-center/{state} "{city}"',
    'site:movoto.com "{city}" price reduced',
    '"{city}, {state}" price reductions percentage 2026'
  ],
  prioritySources: ['realtor.com', 'redfin.com', 'movoto.com'],
  extractionPatterns: {
    regexPatterns: [
      /([\d\.]+)%.*?price\s+redu/i,
      /price\s+redu.*?([\d\.]+)%/i,
      /([\d\.]+)%.*?listings.*?reduced/i
    ],
    textMarkers: ['price reduced', 'price reductions', 'price cuts', 'reduced price']
  },
  expectedSuccessRate: 0.70,
  confidenceThreshold: 'medium',
  dataLevel: 'zip',
  fallbackToLLM: true,
  notes: 'Percentage of active listings with price reductions. High % = overpriced market or cooling demand.'
},

174: {
  fieldId: 174,
  label: 'Homes Under Contract',
  category: 'performance',
  searchQueries: [
    'site:realtor.com/local/{zip}',
    'site:redfin.com/zipcode/{zip}',
    'site:redfin.com/news/data-center/{state} "{city}"',
    'site:movoto.com "{city}" pending sales',
    '"{city}, {state}" homes under contract 2026'
  ],
  prioritySources: ['realtor.com', 'redfin.com', 'movoto.com'],
  extractionPatterns: {
    regexPatterns: [
      /([\d,]+)\s*under\s+contract/i,
      /([\d,]+)\s*pending/i,
      /contract[:\s]*([\d,]+)/i
    ],
    textMarkers: ['under contract', 'pending', 'pending sales', 'accepted offers']
  },
  expectedSuccessRate: 0.75,
  confidenceThreshold: 'medium',
  dataLevel: 'zip',
  fallbackToLLM: true,
  notes: 'Count of homes with accepted offers. High count = competitive market.'
},

175: {
  fieldId: 175,
  label: 'Market Type',
  category: 'performance',
  searchQueries: [
    'site:movoto.com "{city}, {state}" buyer seller market',
    'site:realtor.com/local/{zip}',
    'site:redfin.com/zipcode/{zip}',
    'site:redfin.com/news/data-center/{state} "{city}"',
    'site:noradarealestate.com "{city}" market analysis',
    '"{city}, {state}" buyer market OR seller market 2026'
  ],
  prioritySources: ['movoto.com', 'realtor.com', 'redfin.com', 'noradarealestate.com'],
  extractionPatterns: {
    regexPatterns: [
      /buyer'?s market|seller'?s market|balanced market|neutral market/i,
      /market\s+(favors|advantages)\s+(buyers|sellers)/i,
      /months?\s+of\s+supply[:\s]*([\d\.]+)/i
    ],
    textMarkers: ['Buyer\'s Market', 'Seller\'s Market', 'Balanced Market', 'months of supply', 'market conditions']
  },
  expectedSuccessRate: 0.90,
  confidenceThreshold: 'high',
  dataLevel: 'zip',
  fallbackToLLM: true,
  notes: 'Market classification. Months of supply indicator: <3 = Seller\'s, 3-6 = Balanced, >6 = Buyer\'s.'
},

176: {
  fieldId: 176,
  label: 'Avg Sale-to-List %',
  category: 'performance',
  searchQueries: [
    'site:movoto.com "{city}" sale to list',
    'site:realtor.com/local/{zip}',
    'site:redfin.com/zipcode/{zip}',
    'site:redfin.com/news/data-center/{state} "{city}"',
    'site:homes.com "{city}" sale to list ratio',
    '"{city}, {state}" sale to list percentage 2026'
  ],
  prioritySources: ['movoto.com', 'realtor.com', 'redfin.com', 'homes.com'],
  extractionPatterns: {
    regexPatterns: [
      /sale-to-list.*?([\d\.]+)%/i,
      /sold.*?([\d\.]+)%.*?(asking|list)/i,
      /([\d\.]+)%.*?of.*?(asking|list)/i
    ],
    textMarkers: ['Sale-to-List', 'sold above asking', 'sold below asking', 'asking price']
  },
  expectedSuccessRate: 0.85,
  confidenceThreshold: 'high',
  dataLevel: 'zip',
  fallbackToLLM: true,
  notes: '>100% = bidding wars (Seller\'s Market), <100% = negotiations (Buyer\'s Market).'
},

177: {
  fieldId: 177,
  label: 'Avg Days to Pending',
  category: 'performance',
  searchQueries: [
    'site:movoto.com "{city}" days to pending',
    'site:realtor.com/local/{zip}',
    'site:redfin.com/zipcode/{zip}',
    'site:redfin.com/news/data-center/{state} "{city}"',
    '"{city}, {state}" average days pending 2026'
  ],
  prioritySources: ['movoto.com', 'realtor.com', 'redfin.com'],
  extractionPatterns: {
    regexPatterns: [
      /([\d]+)\s*days?\s+to\s+pending/i,
      /pending\s+in\s+([\d]+)\s*days?/i,
      /avg\s+days\s+to\s+contract[:\s]*([\d]+)/i
    ],
    textMarkers: ['days to pending', 'pending in', 'days to contract']
  },
  expectedSuccessRate: 0.75,
  confidenceThreshold: 'medium',
  dataLevel: 'zip',
  fallbackToLLM: true,
  notes: 'Average days from listing to pending. <10 = very competitive, >30 = slower market.'
},

178: {
  fieldId: 178,
  label: 'Multiple Offers Likelihood',
  category: 'performance',
  searchQueries: [
    'site:movoto.com "{city}" multiple offers',
    'site:realtor.com/local/{zip}',
    'site:redfin.com/zipcode/{zip}',
    '"{city}, {state}" bidding wars 2026'
  ],
  prioritySources: ['movoto.com', 'realtor.com', 'redfin.com'],
  extractionPatterns: {
    regexPatterns: [
      /multiple\s+offers?/i,
      /bidding\s+wars?/i,
      /competitive\s+offers?/i
    ],
    textMarkers: ['multiple offers', 'bidding wars', 'competitive offers']
  },
  expectedSuccessRate: 0.60,
  confidenceThreshold: 'medium',
  dataLevel: 'zip',
  fallbackToLLM: true,
  requiresFields: [175, 176, 177],
  notes: 'LLM infers from: Market Type (175), Sale-to-List % (176), Days to Pending (177). Direct mentions rare.'
},

179: {
  fieldId: 179,
  label: 'Appreciation %',
  category: 'performance',
  searchQueries: [
    'site:movoto.com "{city}" appreciation',
    'site:realtor.com/local/{zip}',
    'site:redfin.com/news/data-center/{state} "{city}"',
    'site:homes.com "{city}" home value trends',
    'site:neighborhoodscout.com "{city}" appreciation',
    '"{city}, {state}" home appreciation 2026'
  ],
  prioritySources: ['movoto.com', 'realtor.com', 'redfin.com', 'homes.com', 'neighborhoodscout.com'],
  extractionPatterns: {
    regexPatterns: [
      /([\d\.]+)%\s*appreciation/i,
      /appreciated\s+([\d\.]+)%/i,
      /([\d\.]+)%\s*year\s+over\s+year/i
    ],
    textMarkers: ['appreciation', 'YoY', 'year over year', 'home value increase']
  },
  expectedSuccessRate: 0.85,
  confidenceThreshold: 'high',
  dataLevel: 'zip',
  fallbackToLLM: true,
  notes: 'Year-over-year appreciation percentage. Calculated field option: (Current Price - Last Sale Price) / Last Sale Price.'
},

180: {
  fieldId: 180,
  label: 'Price Trend',
  category: 'performance',
  searchQueries: [
    'site:movoto.com "{city}" price trends',
    'site:realtor.com/local/{zip}',
    'site:redfin.com/news/data-center/{state} "{city}"',
    'site:homes.com "{city}" market trends',
    'site:neighborhoodscout.com "{city}" trends',
    '"{city}, {state}" home prices rising falling 2026'
  ],
  prioritySources: ['movoto.com', 'realtor.com', 'redfin.com', 'homes.com', 'neighborhoodscout.com'],
  extractionPatterns: {
    regexPatterns: [
      /falling|declining|dropping|decreasing/i,
      /stable|flat|unchanged|steady/i,
      /rising|increasing|growing|climbing|appreciating/i,
      /([+-]?[\d\.]+)%\s*(YoY|year|annual)/i
    ],
    textMarkers: ['price trend', 'home values', 'appreciation', 'YoY', 'falling', 'rising', 'stable']
  },
  expectedSuccessRate: 0.90,
  confidenceThreshold: 'high',
  dataLevel: 'zip',
  fallbackToLLM: true,
  notes: 'LLM classifies as Falling/Stable/Rising. <-2% YoY = Falling, -2% to +2% = Stable, >+2% = Rising.'
},

181: {
  fieldId: 181,
  label: 'Rent Zestimate',
  category: 'performance',
  searchQueries: [
    'site:zillow.com "{address}" rent zestimate',
    'site:zillow.com "{address}" rental',
    'site:rentometer.com "{address}"',
    'site:zumper.com "{city}" rental rates',
    '"{address}" rental estimate 2026'
  ],
  prioritySources: ['zillow.com', 'rentometer.com', 'zumper.com'],
  extractionPatterns: {
    regexPatterns: [
      /rent\s+zestimate[:\s]*\$?([\d,]+)/i,
      /rental\s+estimate[:\s]*\$?([\d,]+)/i,
      /\$?([\d,]+)\/mo/i
    ],
    textMarkers: ['Rent Zestimate', 'rental estimate', 'rental value', '/mo']
  },
  expectedSuccessRate: 0.80,
  confidenceThreshold: 'medium',
  dataLevel: 'address',
  fallbackToLLM: true,
  notes: 'Estimated monthly rental value. Zillow Rent Zestimate is primary source.'
},
```

---

#### **2.2 - tavily-field-database-mapping.ts**
**File**: `D:\Clues_Quantum_Property_Dashboard\api\property\tavily-field-database-mapping.ts`
**Lines**: 360-389 (Market Performance section)
**Action**: Update 13 field mappings (169-181)

**BEFORE** (Lines 360-389):
```typescript
170: {
  fieldId: 170,
  fieldKey: '170_market_trend_direction',
  path: ['financial', 'marketTrendDirection'],  // WRONG!
  label: 'Market Trend Direction'
},
171: {
  fieldId: 171,
  fieldKey: '171_sale_to_list_ratio',
  path: ['financial', 'saleToListRatio'],  // WRONG!
  label: 'Sale-to-List Ratio'
},
174: {
  fieldId: 174,
  fieldKey: '174_inventory_level',
  path: ['financial', 'inventoryLevel'],  // WRONG!
  label: 'Inventory Level'
},
177: {
  fieldId: 177,
  fieldKey: '177_price_momentum',
  path: ['financial', 'priceMomentum3Mo'],  // WRONG!
  label: 'Price Momentum (3 mo)'
},
178: {
  fieldId: 178,
  fieldKey: '178_buyer_vs_seller_market',
  path: ['financial', 'buyerVsSellerMarket'],  // WRONG!
  label: 'Buyer vs Seller Market Indicator'
}
```

**AFTER** (Complete Market Performance section):
```typescript
// Market Performance Fields (169-181)
169: {
  fieldId: 169,
  fieldKey: '169_months_of_inventory',
  path: ['marketPerformance', 'monthsOfInventory'],
  label: 'Months of Inventory'
},
170: {
  fieldId: 170,
  fieldKey: '170_new_listings_30d',
  path: ['marketPerformance', 'newListings30d'],
  label: 'New Listings (30d)'
},
171: {
  fieldId: 171,
  fieldKey: '171_homes_sold_30d',
  path: ['marketPerformance', 'homesSold30d'],
  label: 'Homes Sold (30d)'
},
172: {
  fieldId: 172,
  fieldKey: '172_median_dom_zip',
  path: ['marketPerformance', 'medianDomZip'],
  label: 'Median DOM (ZIP)'
},
173: {
  fieldId: 173,
  fieldKey: '173_price_reduced_percent',
  path: ['marketPerformance', 'priceReducedPercent'],
  label: 'Price Reduced %'
},
174: {
  fieldId: 174,
  fieldKey: '174_homes_under_contract',
  path: ['marketPerformance', 'homesUnderContract'],
  label: 'Homes Under Contract'
},
175: {
  fieldId: 175,
  fieldKey: '175_market_type',
  path: ['marketPerformance', 'marketType'],
  label: 'Market Type'
},
176: {
  fieldId: 176,
  fieldKey: '176_avg_sale_to_list_percent',
  path: ['marketPerformance', 'avgSaleToListPercent'],
  label: 'Avg Sale-to-List %'
},
177: {
  fieldId: 177,
  fieldKey: '177_avg_days_to_pending',
  path: ['marketPerformance', 'avgDaysToPending'],
  label: 'Avg Days to Pending'
},
178: {
  fieldId: 178,
  fieldKey: '178_multiple_offers_likelihood',
  path: ['marketPerformance', 'multipleOffersLikelihood'],
  label: 'Multiple Offers Likelihood'
},
179: {
  fieldId: 179,
  fieldKey: '179_appreciation_percent',
  path: ['marketPerformance', 'appreciationPercent'],
  label: 'Appreciation %'
},
180: {
  fieldId: 180,
  fieldKey: '180_price_trend',
  path: ['marketPerformance', 'priceTrend'],
  label: 'Price Trend'
},
181: {
  fieldId: 181,
  fieldKey: '181_rent_zestimate',
  path: ['marketPerformance', 'rentZestimate'],
  label: 'Rent Zestimate'
},
```

---

### **PHASE 3: Critical Bug Fix** (1 file)

#### **3.1 - PropertyDetail.tsx**
**File**: `D:\Clues_Quantum_Property_Dashboard\src\pages\PropertyDetail.tsx`
**Lines**: 114-118 (FIELD_KEY_TO_ID_MAP)
**Action**: Fix 5 wrong field key mappings + Add missing mappings

**BEFORE** (Lines 114-118):
```typescript
const FIELD_KEY_TO_ID_MAP: Record<string, number> = {
  '170_market_trend_direction': 170,      // WRONG KEY!
  '171_sale_to_list_ratio': 171,          // WRONG KEY!
  '174_inventory_level': 174,             // WRONG KEY!
  '177_price_momentum': 177,              // WRONG KEY!
  '178_buyer_vs_seller_market': 178,      // WRONG KEY!
};
```

**AFTER**:
```typescript
const FIELD_KEY_TO_ID_MAP: Record<string, number> = {
  '169_months_of_inventory': 169,
  '170_new_listings_30d': 170,
  '171_homes_sold_30d': 171,
  '172_median_dom_zip': 172,
  '173_price_reduced_percent': 173,
  '174_homes_under_contract': 174,
  '175_market_type': 175,
  '176_avg_sale_to_list_percent': 176,
  '177_avg_days_to_pending': 177,
  '178_multiple_offers_likelihood': 178,
  '179_appreciation_percent': 179,
  '180_price_trend': 180,
  '181_rent_zestimate': 181,
};
```

**ALSO UPDATE** (Lines 2370-2389): renderDataField labels to match new field names

---

### **PHASE 4: API Integration** (4 files)

#### **4.1 - search.ts**
**File**: `D:\Clues_Quantum_Property_Dashboard\api\property\search.ts`
**Lines**: 140-193, 495-507, 5691-5694
**Action**: Update field rules, type map, missing fields list, getFieldValue calls

#### **4.2 - retry-llm.ts**
**File**: `D:\Clues_Quantum_Property_Dashboard\api\property\retry-llm.ts`
**Lines**: 38-90
**Action**: Update field rules to match search.ts

#### **4.3 - tavily-search.ts**
**File**: `D:\Clues_Quantum_Property_Dashboard\api\property\tavily-search.ts`
**Lines**: 406-418
**Action**: Remove view count extraction logic (no longer valid)

#### **4.4 - llm-constants.ts**
**File**: `D:\Clues_Quantum_Property_Dashboard\api\property\llm-constants.ts`
**Lines**: 70-75
**Action**: Update Tavily field list from view counts to new fields

---

### **PHASE 5: Analytics & Calculated Fields** (3 files)

#### **5.1 - calculate-derived-fields.ts**
**File**: `D:\Clues_Quantum_Property_Dashboard\src\lib\calculate-derived-fields.ts`
**Lines**: 571-616
**Action**: REWRITE Field 173 calculation (was total_views, now price_reduced_percent)

**BEFORE**:
```typescript
/**
 * Field 173: Total Views
 * Formula: Sum of all portal views (169-172)
 */
const calculateTotalViews = (data: PropertyData): number | null => {
  const views = [
    parseNumericValue(data.field_169_zillow_views),
    parseNumericValue(data.field_170_redfin_views),
    parseNumericValue(data.field_171_homes_views),
    parseNumericValue(data.field_172_realtor_views)
  ].filter((v): v is number => v !== null);

  return views.length > 0 ? views.reduce((sum, v) => sum + v, 0) : null;
};
```

**AFTER**:
```typescript
/**
 * Field 173: Price Reduced Percent
 * NO LONGER CALCULATED - Fetched via Tavily
 * This field is now populated by web scraping market data
 */
// Delete calculation function - field 173 is now Tavily-populated, not calculated
```

#### **5.2 - smart-score-llm-consensus.ts**
**File**: `D:\Clues_Quantum_Property_Dashboard\api\property\smart-score-llm-consensus.ts`
**Line**: 468
**Action**: Update Field 174 reference

**BEFORE**:
```typescript
3. FRICTION IDENTIFICATION: If Field 174 (Saves) is high but Field 95 (Days on Market) is also high, identify this as a "Price-to-Condition Mismatch."
```

**AFTER**:
```typescript
3. FRICTION IDENTIFICATION: If Field 174 (Homes Under Contract) is high but Field 172 (Median DOM) is also high, identify this as a "Market Velocity Mismatch."
```

#### **5.3 - gemini-prompts.ts**
**File**: `D:\Clues_Quantum_Property_Dashboard\src\config\gemini-prompts.ts`
**Lines**: 47-57, 166-176
**Action**: Update field references in prompts

---

### **PHASE 6: Documentation** (10 files)

#### **6.1-6.10 - All .md files**
- `TAVILY_IMPROVEMENT_ACTION_ITEMS.md`
- `FIELD_MAPPING_TRUTH.md`
- `MASTER_API_LLM_SCHEMA.md`
- `md-files/architecture/BATTLE_PLAN_COMPREHENSIVE.md`
- `md-files/architecture/SMART_SCORE_ARCHITECTURE.md`
- `md-files/architecture/SMART_SCORE_AUDIT.md`
- `md-files/architecture/SMART_SCORE_ENGINE_ARCHITECTURE.md`
- `md-files/architecture/SMART_SCORE_IMPLEMENTATION_COMPLETE.md`
- `md-files/architecture/SMART_SCORE_IMPLEMENTATION_GUIDE.md`
- `assets/visuals/comparison-analytics/Section1/README.md`

**Action**: Update all field 169-181 references to new definitions

---

### **PHASE 7: Final Verification**

#### **7.1 - Run Verification Script**
```bash
npx ts-node scripts/verify-field-mapping.ts
```

#### **7.2 - Build Test**
```bash
npm run build
```

#### **7.3 - Manual Verification Checklist**
- [ ] fields-schema.ts updated (6 fields)
- [ ] property.ts updated (6 property names)
- [ ] field-normalizer.ts updated (6 mappings)
- [ ] tavily-field-config.ts updated (13 new configs)
- [ ] tavily-field-database-mapping.ts updated (13 paths)
- [ ] PropertyDetail.tsx FIELD_KEY_TO_ID_MAP fixed
- [ ] search.ts updated (field rules)
- [ ] retry-llm.ts updated (field rules)
- [ ] tavily-search.ts updated (removed view logic)
- [ ] llm-constants.ts updated (Tavily list)
- [ ] calculate-derived-fields.ts updated (Field 173 calculation removed)
- [ ] smart-score-llm-consensus.ts updated (Field 174 reference)
- [ ] gemini-prompts.ts updated (prompts)
- [ ] All 10 .md files updated
- [ ] npm run build succeeds
- [ ] All TypeScript errors resolved

---

## 🚨 RECOVERY PROTOCOL (If Compression Happens)

### **Step 1: Check Git Status**
```bash
git log --oneline -10
# See which phases were completed
```

### **Step 2: Read This Master Plan**
```bash
# This file: FIELD_169_181_REPURPOSE_MASTER_PLAN.md
# Contains ALL details needed to continue
```

### **Step 3: Identify Last Completed Phase**
- Phase 1 commit present? → Continue to Phase 2
- Phase 2 commit present? → Continue to Phase 3
- etc.

### **Step 4: Execute Remaining Phases**
- Each phase is self-contained with exact code changes listed above
- Copy-paste from this master plan
- Commit after each phase

---

## ✅ VERIFICATION COMMANDS

### **After Each Phase**:
```bash
# Check syntax
npm run build

# Check git status
git status

# Review changes
git diff
```

### **Final Verification**:
```bash
# Run field mapping verification
npx ts-node scripts/verify-field-mapping.ts

# Build entire app
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

---

## 📊 PROGRESS TRACKING

### **Phases Completed**:
- [ ] Phase 1: Schema Foundation (3 files)
- [ ] Phase 2: Tavily Configurations (2 files)
- [ ] Phase 3: Critical Bug Fix (1 file)
- [ ] Phase 4: API Integration (4 files)
- [ ] Phase 5: Analytics & Calculated Fields (3 files)
- [ ] Phase 6: Documentation (10 files)
- [ ] Phase 7: Final Verification

### **Git Commits Expected**:
1. `Phase 1: Repurpose fields 169-174 schema definitions`
2. `Phase 2: Create Tavily configs for fields 169-181`
3. `Phase 3: Fix critical FIELD_KEY_TO_ID_MAP bug`
4. `Phase 4: Update API integrations for repurposed fields`
5. `Phase 5: Update analytics for repurposed fields`
6. `Phase 6: Update documentation for fields 169-181`
7. `Complete fields 169-181 repurposing - all 20 files updated`

---

## 🎯 NEXT STEPS

**AWAITING USER APPROVAL TO PROCEED WITH PHASE 1**

User should review this master plan and approve Phase 1 execution.

**Created**: 2026-01-11
**Last Updated**: 2026-01-11
