# Grok Field Restrictions - Prevent Hallucinations

**Problem:** Grok is hallucinating on 75% of fields, polluting high-quality data from Stellar MLS and Perplexity.

**Solution:** Restrict Grok to ONLY populate fields that neither Stellar MLS nor Perplexity handle well.

---

## Tier System (Current)

| Tier | Data Source | Priority | Reliability |
|------|-------------|----------|-------------|
| 1 | **Stellar MLS** | Highest | Authoritative MLS data |
| 2 | **Google APIs** | High | Geocoding, Places |
| 3 | **Free APIs** | Medium | WalkScore, SchoolDigger, FEMA, etc. |
| 4 | **Perplexity** | Lower | Web search for current listings |
| 5 | **Other LLMs** | Lowest | Grok, Claude, GPT, Gemini |

---

## Fields Grok MUST NOT Populate (Stellar MLS Territory)

### GROUP 1: Core Listing Data (Stellar MLS Expertise)
**Stellar MLS is authoritative for these - Grok should NEVER touch:**

```
2_mls_primary            - MLS number (only Stellar has real MLS ID)
3_mls_secondary          - Secondary MLS number
4_listing_status         - Active/Pending/Sold (Stellar knows truth)
5_listing_date           - Original list date (Stellar has exact date)
10_listing_price         - Current asking price (Stellar is authoritative)
13_last_sale_date        - Last sale date (Stellar has MLS history)
14_last_sale_price       - Last sale price (Stellar has MLS history)
```

### GROUP 2: Property Structure (Stellar MLS Expertise)
**Stellar MLS has exact data from MLS listings:**

```
17_bedrooms              - Bedroom count (Stellar has MLS truth)
18_full_bathrooms        - Full bath count
19_half_bathrooms        - Half bath count
21_living_sqft           - Living square footage (Stellar has exact)
22_total_sqft_under_roof - Total sqft under roof
23_lot_size_sqft         - Lot size in sqft
25_year_built            - Year built
26_property_type         - Single family/Condo/etc
27_stories               - Number of stories
28_garage_spaces         - Garage spaces
29_parking_total         - Total parking
```

### GROUP 3: HOA & Property Details (Stellar MLS Expertise)
```
30_hoa_yn                - HOA yes/no (Stellar knows from MLS)
31_hoa_fee_annual        - HOA fee amount (Stellar has exact)
32_hoa_name              - HOA name
33_hoa_includes          - What HOA covers
34_ownership_type        - Fee simple/Condo/etc
```

### GROUP 4: Stellar MLS Exclusive Fields (139-168)
**These are ONLY in Stellar MLS - Grok has NO access:**

```
139_carport_yn
140_carport_spaces
141_garage_attached_yn
142_parking_features
143_assigned_parking_spaces
144_floor_number
145_building_total_floors
146_building_name_number
147_building_elevator_yn
148_floors_in_unit
149_subdivision_name
150_legal_description
151_homestead_yn
152_cdd_yn
153_annual_cdd_fee
154_front_exposure
155_water_frontage_yn
156_waterfront_feet
157_water_access_yn
158_water_view_yn
159_water_body_name
160_can_be_leased_yn
161_minimum_lease_period
162_lease_restrictions_yn
163_pet_size_limit
164_max_pet_weight
165_association_approval_yn
166_community_features
167_interior_features
168_exterior_features
```

---

## Fields Grok MUST NOT Populate (Perplexity Territory)

### GROUP 5: Current Market Data (Perplexity Web Search)
**Perplexity searches Zillow/Redfin/Realtor.com live:**

```
11_price_per_sqft        - Perplexity finds on listing sites
12_market_value_estimate - Zestimate/Redfin Estimate (Perplexity searches)
16_redfin_estimate       - Redfin Estimate (Perplexity has web access)
91_median_home_price_neighborhood - Perplexity searches Zillow neighborhood data
92_price_per_sqft_recent_avg - Perplexity finds recent sales
95_days_on_market_avg    - Perplexity finds on listing sites
98_rental_estimate_monthly - Perplexity searches Rentometer/Zillow
103_comparable_sales     - Perplexity searches recent sales
```

### GROUP 6: Tax & Government Data (Perplexity Web Search)
**Perplexity searches county property appraiser sites:**

```
9_parcel_id              - Perplexity searches county records
15_assessed_value        - Perplexity finds on county appraiser
35_annual_taxes          - Perplexity searches county tax collector
36_tax_year              - Perplexity finds on county records
37_property_tax_rate     - Perplexity calculates from county data
38_tax_exemptions        - Perplexity finds on county records
```

### GROUP 7: Schools (Perplexity Web Search)
**Perplexity searches GreatSchools.org:**

```
63_school_district       - Perplexity searches GreatSchools
65_elementary_school     - Perplexity finds assigned school
66_elementary_rating     - Perplexity gets from GreatSchools
68_middle_school         - Perplexity finds assigned school
69_middle_rating         - Perplexity gets from GreatSchools
71_high_school           - Perplexity finds assigned school
72_high_rating           - Perplexity gets from GreatSchools
```

---

## Fields Grok CAN Populate (Gap Fillers)

**These are fields where neither Stellar MLS nor Perplexity excel:**

### GROUP 8: Utilities & Infrastructure (Regional Knowledge OK)
```
104_electric_provider    - Grok can infer from region (Duke Energy, TECO)
106_water_provider       - Grok can infer from county
108_sewer_provider       - Grok can infer from region
109_natural_gas          - Grok can infer availability
110_trash_provider       - Grok can infer from municipality
111_internet_providers_top3 - Grok can list regional ISPs
114_cable_tv_provider    - Grok can list regional providers
115_cell_coverage_quality - Grok can provide regional info
```

### GROUP 9: Property Features (Inference OK)
```
39_roof_type             - Grok can infer from region/property type
41_exterior_material     - Grok can infer typical materials
42_foundation            - Grok can infer from region
43_water_heater_type     - Grok can estimate typical
45_hvac_type             - Grok can estimate typical for region
49_flooring_type         - Grok can provide typical guesses
52_fireplace_yn          - Grok can guess from property type/region
```

### GROUP 10: Neighborhood Characteristics (General Knowledge OK)
```
78_noise_level           - Grok can provide general area info
79_traffic_level         - Grok can assess from location
80_walkability_description - Grok can describe area
81_public_transit_access - Grok can describe transit options
82_commute_to_city_center - Grok can estimate
```

### GROUP 11: Investment Calculations (Can Estimate)
```
93_price_to_rent_ratio   - Grok can calculate if has other fields
94_price_vs_median_percent - Grok can calculate
99_rental_yield_est      - Grok can estimate
100_vacancy_rate_neighborhood - Grok can provide regional average
101_cap_rate_est         - Grok can calculate
```

---

## Implementation Strategy

### Option 1: Blacklist (Recommended)
Create a constant with field numbers Grok MUST NOT touch:

```typescript
const GROK_RESTRICTED_FIELDS = new Set([
  // Stellar MLS core listing data
  '2_mls_primary', '3_mls_secondary', '4_listing_status', '5_listing_date',
  '10_listing_price', '13_last_sale_date', '14_last_sale_price',

  // Stellar MLS property data
  '17_bedrooms', '18_full_bathrooms', '19_half_bathrooms',
  '21_living_sqft', '22_total_sqft_under_roof', '23_lot_size_sqft',
  '25_year_built', '26_property_type', '27_stories',
  '28_garage_spaces', '29_parking_total',

  // Stellar MLS HOA
  '30_hoa_yn', '31_hoa_fee_annual', '32_hoa_name', '33_hoa_includes', '34_ownership_type',

  // Stellar MLS exclusive fields (139-168)
  '139_carport_yn', '140_carport_spaces', '141_garage_attached_yn',
  '142_parking_features', '143_assigned_parking_spaces',
  '144_floor_number', '145_building_total_floors', '146_building_name_number',
  '147_building_elevator_yn', '148_floors_in_unit',
  '149_subdivision_name', '150_legal_description', '151_homestead_yn',
  '152_cdd_yn', '153_annual_cdd_fee', '154_front_exposure',
  '155_water_frontage_yn', '156_waterfront_feet', '157_water_access_yn',
  '158_water_view_yn', '159_water_body_name',
  '160_can_be_leased_yn', '161_minimum_lease_period', '162_lease_restrictions_yn',
  '163_pet_size_limit', '164_max_pet_weight', '165_association_approval_yn',
  '166_community_features', '167_interior_features', '168_exterior_features',

  // Perplexity web search territory
  '9_parcel_id', '11_price_per_sqft', '12_market_value_estimate',
  '15_assessed_value', '16_redfin_estimate',
  '35_annual_taxes', '36_tax_year', '37_property_tax_rate', '38_tax_exemptions',
  '63_school_district', '65_elementary_school', '66_elementary_rating',
  '68_middle_school', '69_middle_rating', '71_high_school', '72_high_rating',
  '91_median_home_price_neighborhood', '92_price_per_sqft_recent_avg',
  '95_days_on_market_avg', '98_rental_estimate_monthly', '103_comparable_sales'
]);
```

### Option 2: Whitelist (More Restrictive)
Create a constant with ONLY fields Grok CAN touch:

```typescript
const GROK_ALLOWED_FIELDS = new Set([
  // Utilities
  '104_electric_provider', '106_water_provider', '108_sewer_provider',
  '109_natural_gas', '110_trash_provider', '111_internet_providers_top3',
  '114_cable_tv_provider', '115_cell_coverage_quality',

  // Property features (inference)
  '39_roof_type', '41_exterior_material', '42_foundation',
  '43_water_heater_type', '45_hvac_type', '49_flooring_type', '52_fireplace_yn',

  // Neighborhood
  '78_noise_level', '79_traffic_level', '80_walkability_description',
  '81_public_transit_access', '82_commute_to_city_center',

  // Calculations
  '93_price_to_rent_ratio', '94_price_vs_median_percent',
  '99_rental_yield_est', '100_vacancy_rate_neighborhood', '101_cap_rate_est'
]);
```

---

## Recommended: BLACKLIST Approach

**Advantages:**
- Allows Grok to fill gaps we haven't thought of
- Easier to maintain (just protect known good sources)
- Flexible for future fields

**Implementation:**
1. Filter Grok's response BEFORE adding to arbitration pipeline
2. Remove any fields in `GROK_RESTRICTED_FIELDS`
3. Log which fields were blocked
4. Update Grok's prompt to explain restrictions

---

## Expected Results

**Before (Current):**
- Grok returns 80 fields
- 60 fields are hallucinations (75%)
- Pollutes Stellar MLS and Perplexity data

**After (With Restrictions):**
- Grok returns ~25-30 fields (allowed fields only)
- 20-25 fields are useful gap fillers (20-30%)
- CANNOT pollute Stellar MLS or Perplexity data
- Hallucinations are limited to low-priority fields

---

**Next Step:** Implement filtering logic in `callGrok()` function
