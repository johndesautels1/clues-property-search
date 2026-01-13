# 181-FIELD TOLERANCE FIX AUDIT
**Complete Field-by-Field Analysis**

**Conversation ID:** `CLUES-181-AUDIT-20260113`
**Date:** 2026-01-13
**Purpose:** Document EXACTLY what tolerance fix each field needs in each file

---

## FILE LEGEND

| Code | File | Purpose |
|------|------|---------|
| A | `src/types/fields-schema.ts` | Field definitions |
| B | `src/lib/field-normalizer.ts` | API mapping |
| C | `api/property/search.ts` | Search API |
| D | `src/pages/PropertyDetail.tsx` | Display UI |
| E | `api/property/arbitration.ts` | Conflict resolution |
| F | `api/property/parse-mls-pdf.ts` | PDF parsing |
| G | `src/types/property.ts` | TypeScript interface |
| H | `src/llm/validation/cmaSchemas.ts` | Zod validation |
| I | `src/pages/AddProperty.tsx` | Add property input |
| J | `src/components/property/PropertySearchForm.tsx` | Search form |
| K | `src/lib/semantic-compare.ts` | **TOLERANCE RULES** |

---

## TOLERANCE RULE CATEGORIES

| Category | Rule Type | Example | Files Affected |
|----------|-----------|---------|----------------|
| **Cat 1: Boolean Y/N** | Normalize "Yes"="Y"=true | Field 3, 30, 52, etc. | K (semantic-compare.ts) |
| **Cat 2: Address Abbrev** | "Rd"="Road", "St"="Street" | Field 1, 6, 7 | K (semantic-compare.ts) |
| **Cat 3: Risk Synonyms** | "Low"="Minimal"="Minor" | Field 88-90, 120-128 | K (semantic-compare.ts) |
| **Cat 4: Property Type** | "SFR"="Single Family" | Field 26 | K (semantic-compare.ts) |
| **Cat 5: Rating Format** | "8/10"="8" | Field 66, 69, 72 | K (semantic-compare.ts) |
| **Cat 6: Time/Duration** | "10 years"="10 yrs"="10" | Field 40, 46, 82, 161 | K (semantic-compare.ts) |
| **Cat 7: Currency** | "$150"="150" | Field 105, 107, 138 | K (semantic-compare.ts) |
| **Cat 8: List/Array** | Order-insensitive ["A","B"]=["B","A"] | Field 50, 51, 103, 111 | K (semantic-compare.ts) |
| **Cat 9: Speed Units** | "1 Gbps"="1000 Mbps" | Field 112 | K (semantic-compare.ts) |
| **Cat 10: Market Type** | "Buyer's"="Buyers Market" | Field 96, 175 | K (semantic-compare.ts) |
| **Cat 11: Direction** | "South"="S"="Southern" | Field 154 | K (semantic-compare.ts) |

---

## COMPLETE 181-FIELD TOLERANCE FIX TABLE

### GROUP 1: Address & Identity (1-9)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 1 | full_address | text | 2 | ✅ FIXED | NO | K:42-76, K:269-298 | Already has address abbrev + substring matching |
| 2 | mls_primary | text | - | ✅ OK | NO | - | Exact match required (IDs) |
| 3 | new_construction_yn | boolean | 1 | ⚠️ PARTIAL | YES | K:82-116, K:286-293 | Add to boolean Y/N detection (line 287: add 'new_construction') |
| 4 | listing_status | select | - | ✅ FIXED | NO | K:235-238 | Already has case-insensitive status matching |
| 5 | listing_date | date | - | ✅ OK | NO | - | Date comparison OK |
| 6 | neighborhood | text | 2 | ✅ FIXED | NO | K:228-230, K:382 | Already has substring + suffix removal |
| 7 | county | text | 2 | ✅ FIXED | NO | K:92-94, K:233-235, K:382 | Already has "County" suffix removal |
| 8 | zip_code | text | - | ✅ OK | NO | - | Exact match required |
| 9 | parcel_id | text | - | ✅ OK | NO | - | Exact match required |

### GROUP 2: Pricing & Value (10-16)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 10 | listing_price | currency | - | ✅ OK | NO | - | Numeric tolerance 1% (line 179-180) |
| 11 | price_per_sqft | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 12 | market_value_estimate | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 13 | last_sale_date | date | - | ⚠️ NEEDS CHECK | YES | K | Add date format normalization (MM/DD/YYYY vs YYYY-MM-DD) |
| 14 | last_sale_price | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 15 | assessed_value | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 16 | avms | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 16a | zestimate | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 16b | redfin_estimate | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 16c | first_american_avm | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 16d | quantarium_avm | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 16e | ice_avm | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 16f | collateral_analytics_avm | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |

### GROUP 3: Property Basics (17-29)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 17 | bedrooms | number | - | ✅ OK | NO | - | Numeric exact match |
| 18 | full_bathrooms | number | - | ✅ OK | NO | - | Numeric exact match |
| 19 | half_bathrooms | number | - | ✅ OK | NO | - | Numeric exact match |
| 20 | total_bathrooms | number | - | ✅ OK | NO | - | Numeric exact match |
| 21 | living_sqft | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 22 | total_sqft_under_roof | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 23 | lot_size_sqft | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 24 | lot_size_acres | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 25 | year_built | number | - | ✅ OK | NO | - | Numeric exact match |
| 26 | property_type | text | 4 | ✅ FIXED | NO | K:98-103, K:228-233 | Already has property type synonyms |
| 27 | stories | number | - | ✅ OK | NO | - | Numeric exact match |
| 28 | garage_spaces | number | - | ✅ OK | NO | - | Numeric exact match |
| 29 | parking_total | text | - | ❌ NEEDS FIX | YES | K | Add "2 Car"="2", "Two"="2" normalization |

### GROUP 4: HOA & Taxes (30-38)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 30 | hoa_yn | boolean | 1 | ✅ FIXED | NO | K:82-83, K:286-293 | Already has boolean normalization |
| 31 | association_fee | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 31A | hoa_fee_monthly | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 31B | hoa_fee_annual | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 31C | condo_fee_monthly | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 31D | condo_fee_annual | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 31E | fee_frequency_primary | text | - | ❌ NEEDS FIX | YES | K | Add "Monthly"="Per Month"="mo" normalization |
| 31F | fee_raw_notes | text | - | ✅ OK | NO | - | Free text, no normalization needed |
| 32 | hoa_name | text | 2 | ✅ FIXED | NO | K:280, K:387 | Already has "name" pattern in semantic fields |
| 33 | hoa_includes | text | 8 | ❌ NEEDS FIX | YES | K | Add list comparison (comma/semicolon, order-insensitive) |
| 34 | ownership_type | select | - | ❌ NEEDS FIX | YES | K | Add "Fee Simple"="Freehold", "Condo"="Condominium" |
| 35 | annual_taxes | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 36 | tax_year | number | - | ✅ OK | NO | - | Numeric exact match |
| 37 | property_tax_rate | percentage | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 38 | tax_exemptions | text | - | ❌ NEEDS FIX | YES | K | Add "Homestead"="Homestead Exemption"="HX" |

### GROUP 5: Structure & Systems (39-48)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 39 | roof_type | select | - | ❌ NEEDS FIX | YES | K | Add "Shingle"="Asphalt Shingle"="Comp Shingle" |
| 40 | roof_age_est | text | 6 | ❌ NEEDS FIX | YES | K | Add time normalization: "10 years"="10 yrs"="10" |
| 41 | exterior_material | text | - | ❌ NEEDS FIX | YES | K | Add "Stucco"="Stucco/Plaster", "Vinyl"="Vinyl Siding" |
| 42 | foundation | select | - | ❌ NEEDS FIX | YES | K | Add "Slab"="Concrete Slab"="Slab on Grade" |
| 43 | water_heater_type | text | - | ❌ NEEDS FIX | YES | K | Add "Electric"="Electric Tank"="Electric Water Heater" |
| 44 | garage_type | text | - | ❌ NEEDS FIX | YES | K | Add "Attached"="Attached Garage"="Attached 2-Car" |
| 45 | hvac_type | text | - | ❌ NEEDS FIX | YES | K | Add "Central"="Central A/C"="Central Air" |
| 46 | hvac_age | text | 6 | ❌ NEEDS FIX | YES | K | Add time normalization: "5 years"="5 yrs"="5" |
| 47 | laundry_type | text | - | ❌ NEEDS FIX | YES | K | Add "In Unit"="Inside"="In Home" |
| 48 | interior_condition | text | 3 | ⚠️ PARTIAL | YES | K:296-301 | Expand risk synonyms to include condition: "Good"="Average" |

### GROUP 6: Interior Features (49-53)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 49 | flooring_type | text | - | ❌ NEEDS FIX | YES | K | Add "Tile"="Ceramic Tile"="Porcelain Tile" |
| 50 | kitchen_features | text | 8 | ❌ NEEDS FIX | YES | K | Add list comparison (order-insensitive) |
| 51 | appliances_included | multiselect | 8 | ❌ NEEDS FIX | YES | K | Add list comparison (order-insensitive) |
| 52 | fireplace_yn | boolean | 1 | ✅ FIXED | NO | K:82-83, K:286-293 | Already has boolean normalization |
| 53 | primary_br_location | select | - | ❌ NEEDS FIX | YES | K | Add "Main"="Main Floor"="First Floor" |

### GROUP 7: Exterior Features (54-58)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 54 | pool_yn | boolean | 1 | ✅ FIXED | NO | K:82-83, K:286-293 | Already has boolean normalization |
| 55 | pool_type | multiselect | - | ❌ NEEDS FIX | YES | K | Add "In-Ground"="Inground"="In Ground" |
| 56 | deck_patio | text | 8 | ❌ NEEDS FIX | YES | K | Add list comparison |
| 57 | fence | text | - | ❌ NEEDS FIX | YES | K | Add "Wood"="Wood Fence"="Wooden" |
| 58 | landscaping | text | - | ❌ NEEDS FIX | YES | K | Add "Professional"="Mature"="Well-Maintained" |

### GROUP 8: Permits & Renovations (59-62)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 59 | recent_renovations | text | - | ✅ OK | NO | K:280, K:387 | Already has "description" pattern |
| 60 | permit_history_roof | text | - | ❌ NEEDS FIX | YES | K | Add date format normalization |
| 61 | permit_history_hvac | text | - | ❌ NEEDS FIX | YES | K | Add date format normalization |
| 62 | permit_history_other | text | - | ❌ NEEDS FIX | YES | K | Add date format normalization |

### GROUP 9: Schools (63-73)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 63 | school_district | text | 2 | ✅ FIXED | NO | K:278, K:383 | Already has "district" pattern |
| 64 | elevation_feet | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 65 | elementary_school | text | 2 | ✅ FIXED | NO | K:278, K:383, K:349-352 | Already has "school" pattern + substring |
| 66 | elementary_rating | text | 5 | ❌ NEEDS FIX | YES | K | Add rating format: "8/10"="8"="8 out of 10" |
| 67 | elementary_distance_mi | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 68 | middle_school | text | 2 | ✅ FIXED | NO | K:278, K:383, K:349-352 | Already has "school" pattern + substring |
| 69 | middle_rating | text | 5 | ❌ NEEDS FIX | YES | K | Add rating format: "7/10"="7" |
| 70 | middle_distance_mi | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 71 | high_school | text | 2 | ✅ FIXED | NO | K:278, K:383, K:349-352 | Already has "school" pattern + substring |
| 72 | high_rating | text | 5 | ❌ NEEDS FIX | YES | K | Add rating format: "6/10"="6" |
| 73 | high_distance_mi | number | - | ✅ OK | NO | - | Numeric tolerance 1% |

### GROUP 10: Location Scores (74-82)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 74 | walk_score | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 75 | transit_score | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 76 | bike_score | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 77 | safety_score | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 78 | noise_level | text | 3 | ✅ FIXED | NO | K:296-301 | Already has risk/level normalization |
| 79 | traffic_level | text | 3 | ✅ FIXED | NO | K:296-301 | Already has risk/level normalization |
| 80 | walkability_description | text | - | ✅ OK | NO | K:280, K:387 | Already has "description" pattern |
| 81 | public_transit_access | text | - | ❌ NEEDS FIX | YES | K | Add "Limited"="Minimal"="Some" |
| 82 | commute_to_city_center | text | 6 | ❌ NEEDS FIX | YES | K | Add time normalization: "25 min"="25 minutes"="25" |

### GROUP 11: Distances (83-87)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 83 | distance_grocery_mi | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 84 | distance_hospital_mi | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 85 | distance_airport_mi | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 86 | distance_park_mi | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 87 | distance_beach_mi | number | - | ✅ OK | NO | - | Numeric tolerance 1% |

### GROUP 12: Safety & Crime (88-90)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 88 | violent_crime_index | text | 3 | ✅ FIXED | NO | K:89-93, K:296-301 | Already has risk normalization |
| 89 | property_crime_index | text | 3 | ✅ FIXED | NO | K:89-93, K:296-301 | Already has risk normalization |
| 90 | neighborhood_safety_rating | text | 3 | ❌ NEEDS FIX | YES | K | Add "A"="Safe"="Good", "B"="Moderate" |

### GROUP 13: Market & Investment (91-103)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 91 | median_home_price_neighborhood | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 92 | price_per_sqft_recent_avg | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 93 | price_to_rent_ratio | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 94 | price_vs_median_percent | percentage | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 95 | days_on_market_avg | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 96 | inventory_surplus | text | 10 | ❌ NEEDS FIX | YES | K | Add "Low"="Seller's Market", "High"="Buyer's Market" |
| 97 | insurance_est_annual | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 98 | rental_estimate_monthly | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 99 | rental_yield_est | percentage | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 100 | vacancy_rate_neighborhood | percentage | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 101 | cap_rate_est | percentage | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 102 | financing_terms | text | - | ❌ NEEDS FIX | YES | K | Add text normalization for common terms |
| 103 | comparable_sales | text | 8 | ❌ NEEDS FIX | YES | K | Add list comparison |

### GROUP 14: Utilities (104-116)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 104 | electric_provider | text | 2 | ✅ OK | NO | K:280, K:387 | Already has "provider" pattern |
| 105 | avg_electric_bill | text | 7 | ❌ NEEDS FIX | YES | K | Add currency normalization: "$150"="150" |
| 106 | water_provider | text | 2 | ✅ OK | NO | K:280, K:387 | Already has "provider" pattern |
| 107 | avg_water_bill | text | 7 | ❌ NEEDS FIX | YES | K | Add currency normalization: "$50"="50" |
| 108 | sewer_provider | text | 2 | ✅ OK | NO | K:280, K:387 | Already has "provider" pattern |
| 109 | natural_gas | text | 1 | ❌ NEEDS FIX | YES | K | Add boolean: "Yes"="Available"="Connected" |
| 110 | trash_provider | text | 2 | ✅ OK | NO | K:280, K:387 | Already has "provider" pattern |
| 111 | internet_providers_top3 | text | 8 | ❌ NEEDS FIX | YES | K | Add list comparison |
| 112 | max_internet_speed | text | 9 | ❌ NEEDS FIX | YES | K | Add speed normalization: "1 Gbps"="1000 Mbps" |
| 113 | fiber_available | text | 1 | ✅ FIXED | NO | K:82-83, K:287 | Already has "available" pattern |
| 114 | cable_tv_provider | text | 2 | ✅ OK | NO | K:280, K:387 | Already has "provider" pattern |
| 115 | cell_coverage_quality | text | 3 | ❌ NEEDS FIX | YES | K | Add "Good"="4 bars"="Excellent" |
| 116 | emergency_services_distance | text | 6 | ❌ NEEDS FIX | YES | K | Add distance normalization: "2 mi"="2 miles" |

### GROUP 15: Environment & Risk (117-130)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 117 | air_quality_index | text | - | ✅ OK | NO | - | Numeric if number |
| 118 | air_quality_grade | text | 3 | ❌ NEEDS FIX | YES | K | Add grade mapping: "A"="Good", "B"="Moderate" |
| 119 | flood_zone | text | - | ✅ OK | NO | K:280, K:383 | Already has "zone" pattern |
| 120 | flood_risk_level | text | 3 | ✅ FIXED | NO | K:89-93, K:296-301 | Already has risk normalization |
| 121 | climate_risk | text | 3 | ✅ FIXED | NO | K:89-93, K:296-301 | Already has risk normalization |
| 122 | wildfire_risk | text | 3 | ✅ FIXED | NO | K:89-93, K:296-301 | Already has risk normalization |
| 123 | earthquake_risk | text | 3 | ✅ FIXED | NO | K:89-93, K:296-301 | Already has risk normalization |
| 124 | hurricane_risk | text | 3 | ✅ FIXED | NO | K:89-93, K:296-301 | Already has risk normalization |
| 125 | tornado_risk | text | 3 | ✅ FIXED | NO | K:89-93, K:296-301 | Already has risk normalization |
| 126 | radon_risk | text | 3 | ✅ FIXED | NO | K:89-93, K:296-301 | Already has risk normalization |
| 127 | superfund_site_nearby | text | 1 | ❌ NEEDS FIX | YES | K | Add boolean: "No"="None"="Not Nearby"=false |
| 128 | sea_level_rise_risk | text | 3 | ✅ FIXED | NO | K:89-93, K:296-301 + toFixed(1) fix | Already has risk normalization |
| 129 | noise_level_db_est | text | - | ❌ NEEDS FIX | YES | K | Add unit normalization: "45 dB"="45" |
| 130 | solar_potential | text | 3 | ✅ FIXED | NO | K:89-93, K:296-301 | Already has risk/potential normalization |

### GROUP 16: Additional Features (131-138)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 131 | view_type | text | - | ❌ NEEDS FIX | YES | K | Add "Pool"="Pool View", "Water"="Water View" |
| 132 | lot_features | text | 8 | ❌ NEEDS FIX | YES | K | Add list comparison |
| 133 | ev_charging | text | 1 | ❌ NEEDS FIX | YES | K | Add boolean: "Yes"="Available"="Installed" |
| 134 | smart_home_features | text | 8 | ❌ NEEDS FIX | YES | K | Add list comparison |
| 135 | accessibility_modifications | text | - | ❌ NEEDS FIX | YES | K | Add "None"="N/A"="Not Applicable" |
| 136 | pet_policy | text | - | ❌ NEEDS FIX | YES | K | Add "Allowed"="Yes"="Permitted" |
| 137 | age_restrictions | text | - | ❌ NEEDS FIX | YES | K | Add "None"="No"="No Restrictions" |
| 138 | special_assessments | text | 7 | ❌ NEEDS FIX | YES | K | Add currency: "None"="$0"="0" |

### GROUP 17: Parking (139-143)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 139 | carport_yn | boolean | 1 | ✅ FIXED | NO | K:82-83, K:286-293 | Already has boolean normalization |
| 140 | carport_spaces | number | - | ✅ OK | NO | - | Numeric exact match |
| 141 | garage_attached_yn | boolean | 1 | ✅ FIXED | NO | K:82-83, K:287, K:390 | Already has "attached" + boolean |
| 142 | parking_features | multiselect | 8 | ❌ NEEDS FIX | YES | K | Add list comparison |
| 143 | assigned_parking_spaces | number | - | ✅ OK | NO | - | Numeric exact match |

### GROUP 18: Building (144-148)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 144 | floor_number | number | - | ✅ OK | NO | - | Numeric exact match |
| 145 | building_total_floors | number | - | ✅ OK | NO | - | Numeric exact match |
| 146 | building_name_number | text | 2 | ✅ OK | NO | K:280, K:387 | Already has "name" pattern |
| 147 | building_elevator_yn | boolean | 1 | ✅ FIXED | NO | K:82-83, K:287, K:390 | Already has "elevator" + boolean |
| 148 | floors_in_unit | number | - | ✅ OK | NO | - | Numeric exact match |

### GROUP 19: Legal (149-154)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 149 | subdivision_name | text | 2 | ✅ FIXED | NO | K:276, K:382 | Already has "subdivision" pattern |
| 150 | legal_description | text | - | ✅ OK | NO | K:299-300 | Already set to strict mode |
| 151 | homestead_yn | boolean | 1 | ✅ FIXED | NO | K:82-83, K:287 | Already has "homestead" + boolean |
| 152 | cdd_yn | boolean | 1 | ❌ NEEDS FIX | YES | K | Add to boolean Y/N detection (line 287: add 'cdd') |
| 153 | annual_cdd_fee | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 154 | front_exposure | select | 11 | ❌ NEEDS FIX | YES | K | Add direction normalization: "South"="S"="Southern" |

### GROUP 20: Waterfront (155-159)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 155 | water_frontage_yn | boolean | 1 | ❌ NEEDS FIX | YES | K | Add to boolean Y/N detection |
| 156 | waterfront_feet | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 157 | water_access_yn | boolean | 1 | ❌ NEEDS FIX | YES | K | Add to boolean Y/N detection |
| 158 | water_view_yn | boolean | 1 | ❌ NEEDS FIX | YES | K | Add to boolean Y/N detection |
| 159 | water_body_name | text | 2 | ✅ OK | NO | K:280, K:387 | Already has "name" pattern |

### GROUP 21: Leasing (160-165)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 160 | can_be_leased_yn | boolean | 1 | ❌ NEEDS FIX | YES | K | Add to boolean Y/N detection |
| 161 | minimum_lease_period | text | 6 | ❌ NEEDS FIX | YES | K | Add time: "6 months"="6 mo"="6-month" |
| 162 | lease_restrictions_yn | boolean | 1 | ❌ NEEDS FIX | YES | K | Add to boolean Y/N detection |
| 163 | pet_size_limit | text | - | ❌ NEEDS FIX | YES | K | Add "Large"="No Limit"="Any Size" |
| 164 | max_pet_weight | number | - | ✅ OK | NO | - | Numeric exact match |
| 165 | association_approval_yn | boolean | 1 | ❌ NEEDS FIX | YES | K | Add to boolean Y/N detection |

### GROUP 22: Features (166-168)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 166 | community_features | multiselect | 8 | ❌ NEEDS FIX | YES | K | Add list comparison |
| 167 | interior_features | multiselect | 8 | ❌ NEEDS FIX | YES | K | Add list comparison |
| 167C | furnished_yn | boolean | 1 | ❌ NEEDS FIX | YES | K | Add to boolean Y/N detection (ORPHAN - check schema) |
| 168 | exterior_features | multiselect | 8 | ❌ NEEDS FIX | YES | K | Add list comparison |

### GROUP 23: Market Performance (169-181)

| # | Key | Type | Cat | Current Status | Fix Needed? | Fix Location | Specific Fix |
|---|-----|------|-----|----------------|-------------|--------------|--------------|
| 169 | months_of_inventory | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 170 | new_listings_30d | number | - | ✅ OK | NO | - | Numeric exact match |
| 171 | homes_sold_30d | number | - | ✅ OK | NO | - | Numeric exact match |
| 172 | median_dom_zip | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 173 | price_reduced_percent | percentage | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 174 | homes_under_contract | number | - | ✅ OK | NO | - | Numeric exact match |
| 175 | market_type | text | 10 | ❌ NEEDS FIX | YES | K | Add market type: "Buyer's"="Buyers Market" |
| 176 | avg_sale_to_list_percent | percentage | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 177 | avg_days_to_pending | number | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 178 | multiple_offers_likelihood | text | - | ❌ NEEDS FIX | YES | K | Add "High"="Likely"="Probable" |
| 179 | appreciation_percent | percentage | - | ✅ OK | NO | - | Numeric tolerance 1% |
| 180 | price_trend | text | - | ❌ NEEDS FIX | YES | K | Add "Increasing"="Up"="Rising", "Decreasing"="Down" |
| 181 | rent_zestimate | currency | - | ✅ OK | NO | - | Numeric tolerance 1% |

---

## SUMMARY STATISTICS

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ FIXED/OK | 102 | 56% |
| ❌ NEEDS FIX | 79 | 44% |
| **TOTAL** | **181** | **100%** |

### Fixes Needed by Category:

| Category | Count | Fields |
|----------|-------|--------|
| **Cat 1: Boolean Y/N** | 15 | 3, 152, 155, 157, 158, 160, 162, 165, 167C, 109, 113, 127, 133, 136, 137 |
| **Cat 2: Address Abbrev** | 0 | Already fixed |
| **Cat 3: Risk Synonyms** | 2 | 90, 118 |
| **Cat 4: Property Type** | 0 | Already fixed |
| **Cat 5: Rating Format** | 3 | 66, 69, 72 |
| **Cat 6: Time/Duration** | 6 | 40, 46, 82, 116, 161, 60-62 |
| **Cat 7: Currency** | 4 | 105, 107, 138, 129 |
| **Cat 8: List/Array** | 12 | 33, 50, 51, 56, 103, 111, 132, 134, 142, 166, 167, 168 |
| **Cat 9: Speed Units** | 1 | 112 |
| **Cat 10: Market Type** | 2 | 96, 175 |
| **Cat 11: Direction** | 1 | 154 |
| **Other Synonyms** | 33 | Various text fields needing specific synonym maps |

---

## NEXT ACTIONS

1. **Add missing Boolean Y/N fields** to line 287 in semantic-compare.ts
2. **Create rating normalization function** for fields 66, 69, 72
3. **Create time normalization function** for fields 40, 46, 82, 116, 161
4. **Create currency normalization function** for fields 105, 107, 138
5. **Create list comparison function** for multiselect fields
6. **Create speed normalization function** for field 112
7. **Expand synonym maps** for remaining text fields

**File to modify:** `src/lib/semantic-compare.ts`
