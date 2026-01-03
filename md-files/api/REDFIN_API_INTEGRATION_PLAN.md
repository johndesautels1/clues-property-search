# Redfin API Integration Plan

## ✅ Working Endpoints Verified

### 1. **`auto-complete`** - Address/Location Search
**Purpose:** Convert address string to Redfin property URL
**Input:** Address query string
**Output:** Redfin property URL (e.g., `/NY/Glendale/7017-69th-Pl-11385/home/20877896`)

### 2. **`properties/get-main-info`** - Basic Property Details
**Purpose:** Get core listing information
**Input:** Redfin property URL
**Key Data:**
- Full street address
- Listing ID, Property ID
- Listing agents
- Last updated date
- Marketing remarks

### 3. **`properties/get-info`** - Extended Property Details
**Purpose:** Get comprehensive property data
**Input:** Redfin property URL
**Key Data Available:**
- **AVM (Automated Valuation Model):**
  - `predictedValue`: Redfin Estimate (field 16)
- **Address Info:**
  - `beds`: Bedrooms (field 17)
  - `baths`: Total bathrooms (field 18)
  - `sqFt`: Living square feet (field 21)
  - `lotSize`: Lot size (field 22)
  - `yearBuilt`: Year built (field 25)
- **Price Info:**
  - `latestPriceInfo.amount`: Last sold price (field 14)
  - `priceInfo.amount`: Redfin estimate (field 16)
  - `pricePerSqFt`: Price per sqft
- **Property Details:**
  - `propertyType`: Property type code
  - `soldDate`: Last sold date (field 13)
  - `apn`: Parcel ID (field 34)
  - `fips`: FIPS code
  - `latLong`: Coordinates

### 4. **`properties/get-walk-score`** - WalkScore Data
**Purpose:** Get walkability scores
**Input:** Redfin property URL
**Key Data:**
- `walkScore.value`: Walk score (field 61)
- `transitScore.value`: Transit score (field 62)
- `bikeScore.value`: Bike score (field 63)

### 5. **`properties/list`** - Property Search
**Purpose:** Search for properties in a region
**Input:** Region ID, filters
**Output:** List of properties with URLs

---

## Field Mapping to 168-Field Schema

| Redfin Data | Field # | Field Name | Priority |
|-------------|---------|------------|----------|
| `latestPriceInfo.amount` | 14 | last_sale_price | P1 |
| `priceInfo.amount` (AVM) | 16 | redfin_estimate | P1 |
| `beds` | 17 | bedrooms | P1 |
| `baths` | 18 | total_bathrooms | P1 |
| `sqFt.value` | 21 | living_sqft | P1 |
| `lotSize` | 22 | lot_sqft | P1 |
| `yearBuilt` | 25 | year_built | P1 |
| `apn` | 34 | parcel_id | P1 |
| `walkScore.value` | 61 | walk_score | P1 |
| `transitScore.value` | 62 | transit_score | P1 |
| `bikeScore.value` | 63 | bike_score | P1 |

---

## Integration Strategy

### Tier Assignment: **Tier 2 (High Priority)**
- **Rationale:** Redfin is authoritative for property estimates and walkability
- **Reliability:** 90-95%
- **Position:** Below Stellar MLS (Tier 1), Above Free APIs (Tier 3)

### API Call Flow:
1. **Address Input** → `auto-complete` → Get Redfin URL
2. **Redfin URL** → `properties/get-info` → Extract all property data
3. **Redfin URL** → `properties/get-walk-score` → Get walk/transit/bike scores

### Implementation:
1. Add `callRedfinProperty()` to `api/property/free-apis.ts`
2. Wire into `api/property/search.ts` orchestration
3. Add to `api/property/arbitration.ts` as Tier 2 source
4. Add to `src/lib/data-sources.ts` for progress tracking
5. Add to `api/property/search-stream.ts` for SSE updates

---

## Next Steps:
1. ✅ Test endpoints - COMPLETE
2. ⏳ Create Redfin integration function
3. ⏳ Wire into search pipeline
4. ⏳ Add to arbitration/data sources
5. ⏳ Test and commit
