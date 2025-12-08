# COMPLETE FIX PLAN - CLUES Property Dashboard

**Created:** 2025-11-30
**Purpose:** Step-by-step guide to fix all 1,300+ errors
**Start New Conversation With This File**

---

## MASTER DIRECTORY REFERENCE

```
D:\Clues_Quantum_Property_Dashboard\
├── src/                          # MAIN FRONTEND SOURCE
│   ├── types/
│   │   ├── fields-schema.ts      # SOURCE OF TRUTH - 168 fields
│   │   └── property.ts           # TypeScript interfaces (130 wrong comments)
│   ├── lib/
│   │   ├── field-normalizer.ts   # OK - matches schema
│   │   └── field-mapping.ts      # 88 ERRORS - needs fixing
│   ├── pages/
│   │   ├── AddProperty.tsx       # 73 ERRORS + missing PDF enrich buttons
│   │   └── PropertyDetail.tsx    # 167 missing fieldKey props
│   └── store/
│       └── propertyStore.ts      # Merge logic - needs review
├── api/property/                 # BACKEND API
│   ├── parse-mls-pdf.ts          # OK for MLS, missing Zillow/Redfin/Realtor
│   ├── search-stream.ts          # 133 ERRORS - main LLM endpoint
│   ├── search.ts                 # 6 ERRORS
│   ├── retry-llm.ts              # 133 ERRORS
│   ├── free-apis.ts              # 13 ERRORS
│   ├── enrich.ts                 # 9 ERRORS
│   ├── stellar-mls.ts            # 36 ERRORS + STUB (not functional)
│   └── arbitration.ts            # Merge logic - needs review
├── app/                          # DUPLICATE CODEBASE - DELETE OR MERGE
│   ├── src/                      # 631 errors in this directory
│   └── api/
├── scripts/
│   ├── master-audit.cjs          # Audit main codebase
│   ├── audit-app-dir.cjs         # Audit app/ directory
│   └── audit-comments.cjs        # Audit property.ts comments
├── AUDIT_FAILURES.md             # Full audit report
├── FIX_PLAN.md                   # THIS FILE
└── README.md                     # Updated with truth
```

---

## DATA FLOW - HOW IT SHOULD WORK

```
USER ACTION                         PRIORITY    DATA SOURCE
─────────────────────────────────────────────────────────────
1. Upload Stellar MLS PDF    →      TIER 1      parse-mls-pdf.ts
   (Most reliable - official MLS data)
                                       ↓
2. Click "Enrich with APIs"  →      TIER 2      free-apis.ts
   - Google Geocode                             (Walk Score, FEMA, etc.)
   - Walk Score
   - FEMA Flood
   - SchoolDigger
   - AirNow
   - HowLoud
   - Crime Grade
                                       ↓
3. Click "Enrich with LLMs"  →      TIER 3      search-stream.ts
   - Perplexity (best)                          (LLM cascade)
   - Grok
   - Claude Opus
   - GPT-4
   - Claude Sonnet
   - Gemini
                                       ↓
4. Manual overrides          →      TIER 4      User input
                                       ↓
5. Store merged data         →      FINAL       propertyStore.ts
   - All 168 fields populated
   - Each field tracks source
   - Conflicts marked yellow
```

---

## PHASE 1: DELETE DUPLICATE CODEBASE

**Time Estimate:** 5 minutes
**Risk:** Low (app/ is not the production code)

### Step 1.1: Verify which codebase is used
```bash
# Check package.json for entry point
cat package.json | grep -A5 "scripts"
```

### Step 1.2: Delete app/ directory
```bash
# After confirming src/ is the main codebase
rm -rf app/
```

### Step 1.3: Update any imports
Search for any imports from `app/` and remove them.

---

## PHASE 2: FIX ALL FIELD NUMBER MISMATCHES (1,122 errors)

**Time Estimate:** 2-3 hours
**Risk:** High - must be done carefully

### The Correct Field Numbers (from fields-schema.ts)

```
FIELD KEY                    WRONG #    CORRECT #
─────────────────────────────────────────────────
full_address                 -          1
mls_primary                  -          2
mls_secondary                -          3
listing_status               -          4
listing_date                 -          5
neighborhood                 27         6
county                       28         7
zip_code                     -          8
parcel_id                    6          9
listing_price                7          10
price_per_sqft               8          11
market_value_estimate        9          12
last_sale_date               10         13
last_sale_price              11         14
assessed_value               31         15
redfin_estimate              -          16
bedrooms                     12         17
full_bathrooms               13         18
half_bathrooms               14         19
total_bathrooms              15         20
living_sqft                  16         21
total_sqft_under_roof        17         22
lot_size_sqft                18         23
lot_size_acres               19         24
year_built                   20         25
property_type                21         26
stories                      22         27
garage_spaces                23         28
parking_total                24         29
hoa_yn                       25         30
hoa_fee_annual               26         31
hoa_name                     -          32
hoa_includes                 -          33
ownership_type               27         34
annual_taxes                 29         35
tax_year                     30         36
property_tax_rate            33         37
tax_exemptions               32         38
roof_type                    36         39
roof_age_est                 37         40
exterior_material            38         41
foundation                   39         42
water_heater_type            -          43
garage_type                  -          44
hvac_type                    40         45
hvac_age                     41         46
laundry_type                 -          47
interior_condition           46         48
flooring_type                42         49
kitchen_features             43         50
appliances_included          44         51
fireplace_yn                 45         52
fireplace_count              -          53
pool_yn                      47         54
pool_type                    48         55
deck_patio                   49         56
fence                        50         57
landscaping                  51         58
recent_renovations           52         59
permit_history_roof          53         60
permit_history_hvac          54         61
permit_history_other         55         62
school_district              64         63
elevation_feet               103        64
elementary_school            -          65
elementary_rating            57         66
elementary_distance          -          67
middle_school                -          68
middle_rating                60         69
middle_distance              -          70
high_school                  -          71
high_rating                  63         72
high_distance                -          73
walk_score                   65         74
transit_score                66         75
bike_score                   67         76
noise_level                  68         78
traffic_level                69         79
walkability_description      70         80
public_transit_access        72         81
commute_time                 -          82
distance_grocery             -          83
distance_hospital            -          84
distance_airport             -          85
distance_park                -          86
distance_beach               -          87
crime_index_violent          -          88
crime_index_property         -          89
neighborhood_safety_rating   80         90
median_home_price            81         91
price_per_sqft_avg           82         92
price_to_rent_ratio          -          93
price_vs_median              -          94
days_on_market_avg           83         95
inventory_surplus            84         96
insurance_est_annual         89         97
rental_estimate_monthly      85         98
rental_yield_est             86         99
vacancy_rate                 87         100
cap_rate_est                 88         101
financing_terms              90         102
comparable_sales             91         103
electric_provider            92         104
avg_electric_bill            -          105
water_provider               93         106
avg_water_bill               -          107
sewer_provider               94         108
natural_gas                  95         109
trash_provider               -          110
internet_providers           -          111
max_internet_speed           97         112
fiber_available              -          113
cable_tv_provider            98         114
cell_coverage                -          115
emergency_services           -          116
air_quality_index            99         117
air_quality_grade            -          118
flood_zone                   100        119
flood_risk_level             101        120
climate_risk                 102        121
wildfire_risk                -          122
earthquake_risk              -          123
hurricane_risk               -          124
tornado_risk                 -          125
radon_risk                   -          126
superfund_nearby             -          127
sea_level_rise               -          128
noise_level_db               103        129
solar_potential              104        130
view_type                    -          131
lot_features                 -          132
ev_charging                  -          133
smart_home_features          106        134
accessibility_mods           -          135
pet_policy                   108        136
age_restrictions             109        137
special_assessments          35         138
carport_yn                   -          139
carport_spaces               -          140
garage_attached_yn           -          141
parking_features             -          142
assigned_parking             -          143
floor_number                 -          144
building_floors              -          145
building_name                -          146
elevator_yn                  -          147
floors_in_unit               -          148
subdivision_name             -          149
legal_description            -          150
homestead_yn                 -          151
cdd_yn                       -          152
cdd_fee                      -          153
front_exposure               -          154
water_frontage_yn            -          155
waterfront_feet              -          156
water_access_yn              -          157
water_view_yn                -          158
water_body_name              -          159
can_be_leased_yn             -          160
min_lease_period             -          161
lease_restrictions_yn        -          162
pet_size_limit               -          163
max_pet_weight               -          164
association_approval_yn      -          165
community_features           -          166
interior_features            -          167
exterior_features            -          168
```

### Step 2.1: Fix api/property/search-stream.ts (133 errors)

**File:** `api/property/search-stream.ts`
**Lines:** 55-231 (FLAT_TO_NUMBERED_FIELD_MAP)

Replace the entire FLAT_TO_NUMBERED_FIELD_MAP with correct numbers:

```typescript
const FLAT_TO_NUMBERED_FIELD_MAP: Record<string, string> = {
  // Address & Identity (1-9)
  'full_address': '1_full_address',
  'address': '1_full_address',
  'mls_primary': '2_mls_primary',
  'mls_number': '2_mls_primary',
  'mls_secondary': '3_mls_secondary',
  'listing_status': '4_listing_status',
  'status': '4_listing_status',
  'listing_date': '5_listing_date',
  'neighborhood': '6_neighborhood',
  'neighborhood_name': '6_neighborhood',
  'county': '7_county',
  'zip_code': '8_zip_code',
  'zip': '8_zip_code',
  'parcel_id': '9_parcel_id',
  'parcel': '9_parcel_id',

  // Pricing & Value (10-16)
  'listing_price': '10_listing_price',
  'price': '10_listing_price',
  'list_price': '10_listing_price',
  'price_per_sqft': '11_price_per_sqft',
  'price_per_sq_ft': '11_price_per_sqft',
  'market_value_estimate': '12_market_value_estimate',
  'market_value': '12_market_value_estimate',
  'estimated_value': '12_market_value_estimate',
  'zestimate': '12_market_value_estimate',
  'last_sale_date': '13_last_sale_date',
  'sale_date': '13_last_sale_date',
  'last_sale_price': '14_last_sale_price',
  'sale_price': '14_last_sale_price',
  'assessed_value': '15_assessed_value',
  'redfin_estimate': '16_redfin_estimate',

  // Property Basics (17-29)
  'bedrooms': '17_bedrooms',
  'beds': '17_bedrooms',
  'full_bathrooms': '18_full_bathrooms',
  'full_baths': '18_full_bathrooms',
  'half_bathrooms': '19_half_bathrooms',
  'half_baths': '19_half_bathrooms',
  'total_bathrooms': '20_total_bathrooms',
  'bathrooms': '20_total_bathrooms',
  'baths': '20_total_bathrooms',
  'living_sqft': '21_living_sqft',
  'living_sq_ft': '21_living_sqft',
  'sqft': '21_living_sqft',
  'square_feet': '21_living_sqft',
  'total_sqft_under_roof': '22_total_sqft_under_roof',
  'lot_size_sqft': '23_lot_size_sqft',
  'lot_size_sq_ft': '23_lot_size_sqft',
  'lot_sqft': '23_lot_size_sqft',
  'lot_size_acres': '24_lot_size_acres',
  'lot_acres': '24_lot_size_acres',
  'year_built': '25_year_built',
  'built': '25_year_built',
  'property_type': '26_property_type',
  'type': '26_property_type',
  'stories': '27_stories',
  'floors': '27_stories',
  'garage_spaces': '28_garage_spaces',
  'garage': '28_garage_spaces',
  'parking_total': '29_parking_total',
  'parking': '29_parking_total',

  // HOA & Taxes (30-38)
  'hoa_yn': '30_hoa_yn',
  'hoa': '30_hoa_yn',
  'has_hoa': '30_hoa_yn',
  'hoa_fee_annual': '31_hoa_fee_annual',
  'hoa_fee': '31_hoa_fee_annual',
  'hoa_name': '32_hoa_name',
  'hoa_includes': '33_hoa_includes',
  'ownership_type': '34_ownership_type',
  'annual_taxes': '35_annual_taxes',
  'taxes': '35_annual_taxes',
  'property_taxes': '35_annual_taxes',
  'tax_year': '36_tax_year',
  'property_tax_rate': '37_property_tax_rate',
  'tax_rate': '37_property_tax_rate',
  'tax_exemptions': '38_tax_exemptions',

  // Structure (39-48)
  'roof_type': '39_roof_type',
  'roof': '39_roof_type',
  'roof_age_est': '40_roof_age_est',
  'roof_age': '40_roof_age_est',
  'exterior_material': '41_exterior_material',
  'exterior': '41_exterior_material',
  'foundation': '42_foundation',
  'water_heater_type': '43_water_heater_type',
  'garage_type': '44_garage_type',
  'hvac_type': '45_hvac_type',
  'hvac': '45_hvac_type',
  'hvac_age': '46_hvac_age',
  'laundry_type': '47_laundry_type',
  'interior_condition': '48_interior_condition',

  // Interior (49-53)
  'flooring_type': '49_flooring_type',
  'flooring': '49_flooring_type',
  'kitchen_features': '50_kitchen_features',
  'kitchen': '50_kitchen_features',
  'appliances_included': '51_appliances_included',
  'appliances': '51_appliances_included',
  'fireplace_yn': '52_fireplace_yn',
  'fireplace': '52_fireplace_yn',
  'has_fireplace': '52_fireplace_yn',
  'fireplace_count': '53_fireplace_count',

  // Exterior (54-58)
  'pool_yn': '54_pool_yn',
  'pool': '54_pool_yn',
  'has_pool': '54_pool_yn',
  'pool_type': '55_pool_type',
  'deck_patio': '56_deck_patio',
  'patio': '56_deck_patio',
  'fence': '57_fence',
  'landscaping': '58_landscaping',

  // Permits (59-62)
  'recent_renovations': '59_recent_renovations',
  'renovations': '59_recent_renovations',
  'permit_history_roof': '60_permit_history_roof',
  'permit_history_hvac': '61_permit_history_hvac',
  'permit_history_other': '62_permit_history_other',

  // Schools (63-73)
  'school_district': '63_school_district',
  'elevation_feet': '64_elevation_feet',
  'elevation': '64_elevation_feet',
  'elementary_school': '65_elementary_school',
  'assigned_elementary': '65_elementary_school',
  'elementary_rating': '66_elementary_rating',
  'elementary_school_rating': '66_elementary_rating',
  'elementary_distance': '67_elementary_distance',
  'middle_school': '68_middle_school',
  'assigned_middle': '68_middle_school',
  'middle_rating': '69_middle_rating',
  'middle_school_rating': '69_middle_rating',
  'middle_distance': '70_middle_distance',
  'high_school': '71_high_school',
  'assigned_high': '71_high_school',
  'high_rating': '72_high_rating',
  'high_school_rating': '72_high_rating',
  'high_distance': '73_high_distance',

  // Scores (74-82)
  'walk_score': '74_walk_score',
  'walkscore': '74_walk_score',
  'transit_score': '75_transit_score',
  'bike_score': '76_bike_score',
  'noise_level': '78_noise_level',
  'traffic_level': '79_traffic_level',
  'walkability_description': '80_walkability_description',
  'public_transit_access': '81_public_transit_access',
  'commute_time': '82_commute_time',

  // Distances (83-87)
  'distance_grocery': '83_distance_grocery',
  'distance_hospital': '84_distance_hospital',
  'distance_airport': '85_distance_airport',
  'distance_park': '86_distance_park',
  'distance_beach': '87_distance_beach',

  // Safety (88-90)
  'crime_index_violent': '88_crime_index_violent',
  'crime_index_property': '89_crime_index_property',
  'neighborhood_safety_rating': '90_neighborhood_safety_rating',

  // Market (91-103)
  'median_home_price_neighborhood': '91_median_home_price_neighborhood',
  'median_home_price': '91_median_home_price_neighborhood',
  'price_per_sqft_recent_avg': '92_price_per_sqft_recent_avg',
  'price_to_rent_ratio': '93_price_to_rent_ratio',
  'price_vs_median_percent': '94_price_vs_median_percent',
  'days_on_market_avg': '95_days_on_market_avg',
  'days_on_market': '95_days_on_market_avg',
  'inventory_surplus': '96_inventory_surplus',
  'insurance_est_annual': '97_insurance_est_annual',
  'insurance_estimate': '97_insurance_est_annual',
  'rental_estimate_monthly': '98_rental_estimate_monthly',
  'rent_estimate': '98_rental_estimate_monthly',
  'rental_yield_est': '99_rental_yield_est',
  'rental_yield': '99_rental_yield_est',
  'vacancy_rate_neighborhood': '100_vacancy_rate_neighborhood',
  'cap_rate_est': '101_cap_rate_est',
  'cap_rate': '101_cap_rate_est',
  'financing_terms': '102_financing_terms',
  'comparable_sales': '103_comparable_sales',

  // Utilities (104-116)
  'electric_provider': '104_electric_provider',
  'avg_electric_bill': '105_avg_electric_bill',
  'water_provider': '106_water_provider',
  'avg_water_bill': '107_avg_water_bill',
  'sewer_provider': '108_sewer_provider',
  'natural_gas': '109_natural_gas',
  'trash_provider': '110_trash_provider',
  'internet_providers': '111_internet_providers_top3',
  'max_internet_speed': '112_max_internet_speed',
  'fiber_available': '113_fiber_available',
  'cable_tv_provider': '114_cable_tv_provider',
  'cell_coverage_quality': '115_cell_coverage_quality',
  'emergency_services_distance': '116_emergency_services_distance',

  // Environment (117-130)
  'air_quality_index': '117_air_quality_index_current',
  'aqi': '117_air_quality_index_current',
  'air_quality_grade': '118_air_quality_grade',
  'flood_zone': '119_flood_zone',
  'flood_zone_code': '119_flood_zone',
  'flood_risk_level': '120_flood_risk_level',
  'flood_risk': '120_flood_risk_level',
  'climate_risk_summary': '121_climate_risk_wildefire_flood',
  'wildfire_risk': '122_wildfire_risk',
  'earthquake_risk': '123_earthquake_risk',
  'hurricane_risk': '124_hurricane_risk',
  'tornado_risk': '125_tornado_risk',
  'radon_risk': '126_radon_risk',
  'superfund_nearby': '127_superfund_nearby',
  'sea_level_rise_risk': '128_sea_level_rise_risk',
  'noise_level_db_est': '129_noise_level_db_est',
  'solar_potential': '130_solar_potential',

  // Additional (131-138)
  'view_type': '131_view_type',
  'lot_features': '132_lot_features',
  'ev_charging_yn': '133_ev_charging_yn',
  'smart_home_features': '134_smart_home_features',
  'accessibility_modifications': '135_accessibility_modifications',
  'pet_policy': '136_pet_policy',
  'age_restrictions': '137_age_restrictions',
  'special_assessments': '138_special_assessments',
};
```

### Step 2.2: Fix api/property/retry-llm.ts (133 errors)
Same mapping as search-stream.ts - copy the corrected FLAT_TO_NUMBERED_FIELD_MAP.

### Step 2.3: Fix src/lib/field-mapping.ts (88 errors)
Update all field numbers to match schema.

### Step 2.4: Fix src/pages/AddProperty.tsx (73 errors)
Update all field number references.

### Step 2.5: Fix api/property/stellar-mls.ts (36 errors)
Update field numbers AND remove "stub" - implement actual integration or remove file.

### Step 2.6: Fix api/property/free-apis.ts (13 errors)
Update field numbers for API return values.

### Step 2.7: Fix api/property/enrich.ts (9 errors)
Update field numbers.

### Step 2.8: Fix api/property/search.ts (6 errors)
Update field numbers.

### Step 2.9: Verify all fixes
```bash
node scripts/master-audit.cjs
# Should show: TOTAL FIELD NUMBER ERRORS: 0
```

---

## PHASE 3: FIX PROPERTY.TS COMMENTS (130 errors)

**File:** `src/types/property.ts`
**Time Estimate:** 30 minutes

Update all field number comments to match fields-schema.ts.

Example fix:
```typescript
// BEFORE:
listingPrice: DataField<number>;       // #6  ← WRONG

// AFTER:
listingPrice: DataField<number>;       // #10 ← CORRECT
```

### Verification:
```bash
node scripts/audit-comments.cjs
# Should show: TOTAL WRONG COMMENTS: 0
```

---

## PHASE 4: ADD MISSING 3RD PARTY FIELD MAPPINGS

**File:** `api/property/parse-mls-pdf.ts`
**Time Estimate:** 2 hours

### Step 4.1: Add ZILLOW_FIELD_MAPPING

```typescript
const ZILLOW_FIELD_MAPPING: Record<string, string> = {
  'Zestimate': '12_market_value_estimate',
  'Rent Zestimate': '98_rental_estimate_monthly',
  'Price': '10_listing_price',
  'Beds': '17_bedrooms',
  'Baths': '20_total_bathrooms',
  'Sq Ft': '21_living_sqft',
  'Lot Size': '23_lot_size_sqft',
  'Year Built': '25_year_built',
  'Property Type': '26_property_type',
  'Parking': '29_parking_total',
  'HOA': '31_hoa_fee_annual',
  'Price/sqft': '11_price_per_sqft',
  // ... add all Zillow field names
};
```

### Step 4.2: Add REDFIN_FIELD_MAPPING

```typescript
const REDFIN_FIELD_MAPPING: Record<string, string> = {
  'Redfin Estimate': '16_redfin_estimate',
  'List Price': '10_listing_price',
  'Beds': '17_bedrooms',
  'Baths': '20_total_bathrooms',
  'Sq Ft': '21_living_sqft',
  // ... add all Redfin field names
};
```

### Step 4.3: Add REALTOR_FIELD_MAPPING

```typescript
const REALTOR_FIELD_MAPPING: Record<string, string> = {
  'List Price': '10_listing_price',
  'Bedrooms': '17_bedrooms',
  'Bathrooms': '20_total_bathrooms',
  'Living Area': '21_living_sqft',
  // ... add all Realtor.com field names
};
```

### Step 4.4: Update mapFieldsToSchema() to use correct mapping

```typescript
function mapFieldsToSchema(rawFields: Record<string, any>) {
  const sourceType = detectSourceType(rawFields);

  // Select correct mapping based on source
  const mapping = sourceType === 'stellar_mls' ? MLS_FIELD_MAPPING
                : sourceType === 'zillow' ? ZILLOW_FIELD_MAPPING
                : sourceType === 'redfin' ? REDFIN_FIELD_MAPPING
                : sourceType === 'realtor' ? REALTOR_FIELD_MAPPING
                : MLS_FIELD_MAPPING; // fallback

  // ... rest of mapping logic
}
```

---

## PHASE 5: ADD MISSING fieldKey PROPS (167 missing)

**File:** `src/pages/PropertyDetail.tsx`
**Time Estimate:** 1-2 hours

Every DataField component needs a fieldKey prop for retry buttons to work.

### Example fix:

```typescript
// BEFORE:
<DataField
  label="Listing Price"
  value={fullProperty.address.listingPrice.value}
  format="currency"
/>

// AFTER:
<DataField
  label="Listing Price"
  value={fullProperty.address.listingPrice.value}
  format="currency"
  fieldKey="10_listing_price"
  onRetry={handleRetryField}
/>
```

### Add fieldKey to ALL 168 DataField components.

---

## PHASE 6: ADD PDF ENRICH BUTTONS

**File:** `src/pages/AddProperty.tsx`
**Lines:** 1485-1597 (PDF section)
**Time Estimate:** 30 minutes

### Step 6.1: Add state for PDF enrichment

```typescript
const [pdfEnrichWithAI, setPdfEnrichWithAI] = useState(false);
const [pdfSelectedEngine, setPdfSelectedEngine] = useState('Auto');
```

### Step 6.2: Add enrich checkbox after PDF parse success

```typescript
{pdfParseStatus === 'complete' && (
  <>
    {/* AI Enrichment Option */}
    <div className="flex items-center gap-3 mb-4">
      <input
        type="checkbox"
        id="pdf-enrich-ai"
        checked={pdfEnrichWithAI}
        onChange={(e) => setPdfEnrichWithAI(e.target.checked)}
        className="w-5 h-5"
      />
      <label htmlFor="pdf-enrich-ai" className="text-sm">
        Enrich with APIs & LLMs after import
      </label>
    </div>

    {pdfEnrichWithAI && (
      <div className="mb-4">
        {/* LLM selector - same as CSV section */}
      </div>
    )}

    <button onClick={handlePdfImport}>
      Import {Object.keys(pdfParsedFields).length} Fields
      {pdfEnrichWithAI && ' + Enrich'}
    </button>
  </>
)}
```

### Step 6.3: Update handlePdfImport to call enrichment

```typescript
const handlePdfImport = async () => {
  // ... existing import logic ...

  if (pdfEnrichWithAI) {
    // After saving, call the enrich API
    const address = fullProperty.address.fullAddress.value;
    const existingFields = propertyToFlatFields(fullProperty);

    const response = await fetch('/api/property/search-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        engines: getEngines(),
        existingFields, // Pass PDF data for merging
        skipApis: false,
      }),
    });

    // ... merge enriched data ...
  }
};
```

---

## PHASE 7: FIX DATA STACKING

**Files:**
- `src/store/propertyStore.ts`
- `api/property/arbitration.ts`

**Time Estimate:** 1 hour

### Step 7.1: Ensure mergeProperties() is additive

The current implementation looks correct but verify:
1. New data fills gaps (empty fields)
2. Higher tier sources can override lower tier
3. Conflicts are tracked with hasConflict flag
4. No data is ever deleted

### Step 7.2: Ensure frontend passes existingFields

Already fixed in this session - verify it works:
- PropertyDetail.tsx now sends existingFields
- AddProperty.tsx needs same fix for PDF flow

---

## PHASE 8: VERIFICATION

### Step 8.1: Run all audit scripts
```bash
cd D:\Clues_Quantum_Property_Dashboard

# Field number audit
node scripts/master-audit.cjs
# Expected: TOTAL FIELD NUMBER ERRORS: 0

# Comment audit
node scripts/audit-comments.cjs
# Expected: TOTAL WRONG COMMENTS: 0

# TypeScript compilation
npx tsc --noEmit
# Expected: No errors
```

### Step 8.2: Manual testing

1. **PDF Upload Flow:**
   - Upload a Stellar MLS PDF
   - Verify all fields display correctly in PropertyDetail
   - Check console for correct field numbers

2. **API Enrichment Flow:**
   - Click "Enrich with APIs" on PropertyDetail
   - Verify Walk Score, Flood Zone, etc. populate
   - Verify existing PDF data is NOT overwritten

3. **LLM Enrichment Flow:**
   - Click "Enrich with LLMs"
   - Verify LLM data fills gaps
   - Verify source tracking works

4. **Retry Flow:**
   - Click retry button on empty field
   - Verify field updates with LLM data

---

## PHASE 9: REMOVE/FIX STUB CODE

### Step 9.1: Stellar MLS API

**File:** `api/property/stellar-mls.ts`

Either:
- Implement actual Stellar MLS API (requires eKey)
- OR remove the file and all references

### Step 9.2: Web Scrapers

Decide whether to:
- Build actual scrapers for Zillow/Redfin/Realtor
- OR rely entirely on LLMs with web search (Perplexity/Grok)
- OR use a scraping API service

---

## CONVERSATION STARTER

Copy this to start a new conversation:

```
I need to fix the CLUES Property Dashboard codebase.

READ THESE FILES FIRST:
- D:\Clues_Quantum_Property_Dashboard\FIX_PLAN.md (this plan)
- D:\Clues_Quantum_Property_Dashboard\AUDIT_FAILURES.md (full audit)
- D:\Clues_Quantum_Property_Dashboard\README.md (current state)

THE PROBLEM:
- 1,122 field number mismatches across 16 files
- 130 wrong comments in property.ts
- 167 missing fieldKey props
- 4 missing 3rd party mappings
- 2 missing UI buttons
- Duplicate codebase (app/ vs src/)

THE SOURCE OF TRUTH:
- src/types/fields-schema.ts contains the correct 168 field numbers
- All other files must match this

DATA FLOW:
1. Stellar MLS PDF upload (TIER 1 - most reliable)
2. API enrichment (TIER 2 - Walk Score, FEMA, etc.)
3. LLM enrichment (TIER 3 - fills gaps)
4. Data stacks additively, never overwrites higher tier

START WITH:
Phase 1: Delete app/ directory (duplicate codebase)
Phase 2: Fix field numbers in api/property/search-stream.ts (133 errors)

Show me the exact changes needed for Phase 1 and 2.
```

---

## ESTIMATED TOTAL TIME

| Phase | Time |
|-------|------|
| 1. Delete duplicate codebase | 5 min |
| 2. Fix field numbers (1,122) | 2-3 hours |
| 3. Fix comments (130) | 30 min |
| 4. Add 3rd party mappings | 2 hours |
| 5. Add fieldKey props (167) | 1-2 hours |
| 6. Add PDF enrich buttons | 30 min |
| 7. Fix data stacking | 1 hour |
| 8. Verification | 30 min |
| 9. Remove stubs | 30 min |
| **TOTAL** | **8-10 hours** |

---

**This plan is complete. Start a new conversation with the CONVERSATION STARTER section above.**
