# 181-FIELD AUDIT CHECKLIST

**Conversation ID:** `CLUES-181-AUDIT-20260113`
**Last Updated:** 2026-01-13
**Current Position:** Field 2 (mls_primary)
**Status:** IN PROGRESS - Field 1 COMPLETE

---

## CRITICAL INSTRUCTIONS FOR CLAUDE (READ ON EVERY SESSION)

1. **NEVER LIE** - Do not check boxes without verifying actual code
2. **NEVER SKIP** - Audit every single field, every single file
3. **CONTINUE FROM LAST POSITION** - Check "Current Position" above
4. **UPDATE THIS FILE** - Mark fields as you verify them
5. **READ BOTH FILES** - This file AND `FIELD_TOLERANCE_AUDIT.md`

---

## 10 CORE FILES TO AUDIT (UPDATED)

| Code | File Path | Purpose |
|------|-----------|---------|
| A | `src/types/fields-schema.ts` | SOURCE OF TRUTH (181 fields) |
| B | `src/lib/field-normalizer.ts` | Flat-to-Nested mapping |
| C | `api/property/search.ts` | Main search API |
| D | `src/pages/PropertyDetail.tsx` | UI Display |
| E | `api/property/arbitration.ts` | Data arbitration |
| F | `api/property/parse-mls-pdf.ts` | MLS PDF parsing |
| G | `src/types/property.ts` | Property interface |
| H | `src/llm/validation/cmaSchemas.ts` | Validation schemas |
| I | `src/pages/AddProperty.tsx` | Add Property page (input+API flow) |
| J | `src/components/property/PropertySearchForm.tsx` | Search form field mapping |

---

## AUDIT TABLE

Legend:
- `[ ]` = Not audited
- `[X]` = Audited and verified correct
- `[!]` = Audited and NEEDS FIX
- `[~]` = Partial/needs review

| # | Key | A | B | C | D | E | F | G | H | I | J | Status | Notes |
|---|-----|---|---|---|---|---|---|---|---|---|---|--------|-------|
| **GROUP 1: Address & Identity (1-9)** |
| 1 | full_address | [X] | [X] | [X] | [X] | N/A | [X] | [X] | [X] | [X] | [X] | COMPLETE | A:42, B:116, C:287+, D:752+, F:56-58, G:30, H:116, I:358/541/1943, J:153-170 |
| 2 | mls_primary | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 3 | new_construction_yn | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 4 | listing_status | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 5 | listing_date | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 6 | neighborhood | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 7 | county | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 8 | zip_code | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 9 | parcel_id | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 2: Pricing & Value (10-16)** |
| 10 | listing_price | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 11 | price_per_sqft | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 12 | market_value_estimate | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 13 | last_sale_date | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 14 | last_sale_price | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 15 | assessed_value | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 16 | avms | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 16a | zestimate | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 16b | redfin_estimate | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 16c | first_american_avm | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 16d | quantarium_avm | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 16e | ice_avm | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 16f | collateral_analytics_avm | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 3: Property Basics (17-29)** |
| 17 | bedrooms | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 18 | full_bathrooms | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 19 | half_bathrooms | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 20 | total_bathrooms | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 21 | living_sqft | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 22 | total_sqft_under_roof | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 23 | lot_size_sqft | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 24 | lot_size_acres | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 25 | year_built | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 26 | property_type | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 27 | stories | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 28 | garage_spaces | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 29 | parking_total | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 4: HOA & Taxes (30-38)** |
| 30 | hoa_yn | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 31 | association_fee | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 31A | hoa_fee_monthly | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 31B | hoa_fee_annual | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 31C | condo_fee_monthly | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 31D | condo_fee_annual | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 31E | fee_frequency_primary | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 31F | fee_raw_notes | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 32 | hoa_name | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 33 | hoa_includes | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 34 | ownership_type | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 35 | annual_taxes | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 36 | tax_year | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 37 | property_tax_rate | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 38 | tax_exemptions | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 5: Structure & Systems (39-48)** |
| 39 | roof_type | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 40 | roof_age_est | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 41 | exterior_material | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 42 | foundation | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 43 | water_heater_type | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 44 | garage_type | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 45 | hvac_type | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 46 | hvac_age | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 47 | laundry_type | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 48 | interior_condition | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 6: Interior Features (49-53)** |
| 49 | flooring_type | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 50 | kitchen_features | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 51 | appliances_included | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 52 | fireplace_yn | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 53 | primary_br_location | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 7: Exterior Features (54-58)** |
| 54 | pool_yn | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 55 | pool_type | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 56 | deck_patio | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 57 | fence | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 58 | landscaping | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 8: Permits & Renovations (59-62)** |
| 59 | recent_renovations | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 60 | permit_history_roof | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 61 | permit_history_hvac | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 62 | permit_history_other | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 9: Schools (63-73)** |
| 63 | school_district | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 64 | elevation_feet | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 65 | elementary_school | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 66 | elementary_rating | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 67 | elementary_distance_mi | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 68 | middle_school | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 69 | middle_rating | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 70 | middle_distance_mi | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 71 | high_school | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 72 | high_rating | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 73 | high_distance_mi | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 10: Location Scores (74-82)** |
| 74 | walk_score | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 75 | transit_score | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 76 | bike_score | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 77 | safety_score | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 78 | noise_level | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 79 | traffic_level | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 80 | walkability_description | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 81 | public_transit_access | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 82 | commute_to_city_center | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 11: Distances (83-87)** |
| 83 | distance_grocery_mi | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 84 | distance_hospital_mi | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 85 | distance_airport_mi | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 86 | distance_park_mi | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 87 | distance_beach_mi | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 12: Safety & Crime (88-90)** |
| 88 | violent_crime_index | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 89 | property_crime_index | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 90 | neighborhood_safety_rating | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 13: Market & Investment (91-103)** |
| 91 | median_home_price_neighborhood | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 92 | price_per_sqft_recent_avg | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 93 | price_to_rent_ratio | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 94 | price_vs_median_percent | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 95 | days_on_market_avg | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 96 | inventory_surplus | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 97 | insurance_est_annual | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 98 | rental_estimate_monthly | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 99 | rental_yield_est | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 100 | vacancy_rate_neighborhood | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 101 | cap_rate_est | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 102 | financing_terms | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 103 | comparable_sales | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 14: Utilities (104-116)** |
| 104 | electric_provider | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 105 | avg_electric_bill | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 106 | water_provider | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 107 | avg_water_bill | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 108 | sewer_provider | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 109 | natural_gas | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 110 | trash_provider | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 111 | internet_providers_top3 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 112 | max_internet_speed | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 113 | fiber_available | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 114 | cable_tv_provider | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 115 | cell_coverage_quality | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 116 | emergency_services_distance | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 15: Environment & Risk (117-130)** |
| 117 | air_quality_index | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 118 | air_quality_grade | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 119 | flood_zone | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 120 | flood_risk_level | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 121 | climate_risk | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 122 | wildfire_risk | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 123 | earthquake_risk | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 124 | hurricane_risk | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 125 | tornado_risk | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 126 | radon_risk | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 127 | superfund_site_nearby | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 128 | sea_level_rise_risk | [X] | [X] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | FIXED | toFixed(1) commit 37a16af |
| 129 | noise_level_db_est | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 130 | solar_potential | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 16: Additional Features (131-138)** |
| 131 | view_type | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 132 | lot_features | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 133 | ev_charging | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 134 | smart_home_features | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 135 | accessibility_modifications | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 136 | pet_policy | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 137 | age_restrictions | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 138 | special_assessments | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 17: Parking (139-143)** |
| 139 | carport_yn | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 140 | carport_spaces | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 141 | garage_attached_yn | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 142 | parking_features | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 143 | assigned_parking_spaces | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 18: Building (144-148)** |
| 144 | floor_number | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 145 | building_total_floors | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 146 | building_name_number | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 147 | building_elevator_yn | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 148 | floors_in_unit | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 19: Legal (149-154)** |
| 149 | subdivision_name | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 150 | legal_description | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 151 | homestead_yn | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 152 | cdd_yn | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 153 | annual_cdd_fee | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 154 | front_exposure | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 20: Waterfront (155-159)** |
| 155 | water_frontage_yn | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 156 | waterfront_feet | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 157 | water_access_yn | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 158 | water_view_yn | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 159 | water_body_name | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 21: Leasing (160-165)** |
| 160 | can_be_leased_yn | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 161 | minimum_lease_period | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 162 | lease_restrictions_yn | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 163 | pet_size_limit | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 164 | max_pet_weight | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 165 | association_approval_yn | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 22: Features (166-168)** |
| 166 | community_features | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 167 | interior_features | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 167C | furnished_yn | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | ORPHAN? |
| 168 | exterior_features | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| **GROUP 23: Market Performance (169-181)** |
| 169 | months_of_inventory | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 170 | new_listings_30d | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 171 | homes_sold_30d | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 172 | median_dom_zip | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 173 | price_reduced_percent | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 174 | homes_under_contract | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 175 | market_type | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 176 | avg_sale_to_list_percent | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 177 | avg_days_to_pending | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 178 | multiple_offers_likelihood | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 179 | appreciation_percent | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 180 | price_trend | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |
| 181 | rent_zestimate | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PENDING | |

---

## PROGRESS SUMMARY

- **Total Fields:** 181 + subfields
- **Audited:** 2 (Fields 1, 128)
- **Remaining:** 179
- **Current Position:** Field 2
- **Files Per Field:** 10 (added AddProperty.tsx + PropertySearchForm.tsx)

---

## CHANGE LOG

| Date | Field | Action | Commit |
|------|-------|--------|--------|
| 2026-01-13 | 128 | Fixed toFixed(1) | 37a16af |
| 2026-01-13 | 1 | Audited all 10 files - COMPLETE (added AddProperty.tsx, PropertySearchForm.tsx) | PENDING |
| 2026-01-13 | ALL | Discovered 2 additional audit files: AddProperty.tsx, PropertySearchForm.tsx | N/A |
| 2026-01-13 | ALL | Added tolerance rules to semantic-compare.ts (Boolean, Risk, PropertyType) | PENDING |
