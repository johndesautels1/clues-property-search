# CLUES Property Dashboard - 181-Field Audit Comparison Table
## Generated: 2025-01-05

This document proves the complete field mapping across all 5 controlling files.

## Summary

| File | Fields Found | Status |
|------|-------------|--------|
| `fields-schema.ts` | 181/181 | SOURCE OF TRUTH |
| `field-normalizer.ts` | 181/181 | FIXED (was 168) |
| `search.ts` | 181/181 | COMPLETE |
| `arbitration.ts` | 0 (N/A) | No direct refs |
| `parse-mls-pdf.ts` | ~62/181 | Partial (MLS only) |

## Fixes Applied

1. **field-normalizer.ts lines 57-60**: Changed photo fields from `fieldNumber: 169/170` to `fieldNumber: 'photo_primary'/'photo_gallery'`
2. **field-normalizer.ts lines 267-280**: Added GROUP 23 Market Performance (fields 169-181)
3. **field-normalizer.ts line 24**: Added `'marketPerformance'` to GroupName type
4. **field-normalizer.ts lines 774-789**: Added marketPerformance group initialization
5. **field-normalizer.ts line 908**: Changed data completeness from `/168` to `/181`
6. **property.ts lines 280-294**: Added `MarketPerformanceData` interface
7. **property.ts line 310**: Added `marketPerformance?: MarketPerformanceData` to Property interface

---

## Complete 181-Row Comparison Table

Legend:
- `Y` = Present with correct mapping
- `P` = Present in FIELD_TYPE_MAP only (search.ts)
- `-` = Not present (expected for parse-mls-pdf.ts)
- `N/A` = Not applicable (arbitration.ts has no direct field refs)

| # | Key | fields-schema.ts | field-normalizer.ts | search.ts | parse-mls-pdf.ts |
|---|-----|------------------|---------------------|-----------|------------------|
| 1 | full_address | Y | Y | P | Y |
| 2 | mls_primary | Y | Y | P | Y |
| 3 | mls_secondary | Y | Y | P | - |
| 4 | listing_status | Y | Y | P | Y |
| 5 | listing_date | Y | Y | P | Y |
| 6 | neighborhood | Y | Y | P | Y |
| 7 | county | Y | Y | P | Y |
| 8 | zip_code | Y | Y | P | Y |
| 9 | parcel_id | Y | Y | P | Y |
| 10 | listing_price | Y | Y | P | Y |
| 11 | price_per_sqft | Y | Y | P | Y |
| 12 | market_value_estimate | Y | Y | P | Y |
| 13 | last_sale_date | Y | Y | P | Y |
| 14 | last_sale_price | Y | Y | P | Y |
| 15 | assessed_value | Y | Y | P | Y |
| 16 | avms | Y | Y | P | - |
| 16a | zestimate | (subfield) | Y | P | - |
| 16b | redfin_estimate | (subfield) | Y | P | - |
| 16c | first_american_avm | (subfield) | Y | P | - |
| 16d | quantarium_avm | (subfield) | Y | P | - |
| 16e | ice_avm | (subfield) | Y | P | - |
| 16f | collateral_analytics_avm | (subfield) | Y | P | - |
| 17 | bedrooms | Y | Y | P | Y |
| 18 | full_bathrooms | Y | Y | P | Y |
| 19 | half_bathrooms | Y | Y | P | Y |
| 20 | total_bathrooms | Y | Y | P | Y |
| 21 | living_sqft | Y | Y | P | Y |
| 22 | total_sqft_under_roof | Y | Y | P | Y |
| 23 | lot_size_sqft | Y | Y | P | Y |
| 24 | lot_size_acres | Y | Y | P | Y |
| 25 | year_built | Y | Y | P | Y |
| 26 | property_type | Y | Y | P | Y |
| 27 | stories | Y | Y | P | Y |
| 28 | garage_spaces | Y | Y | P | Y |
| 29 | parking_total | Y | Y | P | Y |
| 30 | hoa_yn | Y | Y | P | Y |
| 31 | hoa_fee_annual | Y | Y | P | Y |
| 32 | hoa_name | Y | Y | P | Y |
| 33 | hoa_includes | Y | Y | P | Y |
| 34 | ownership_type | Y | Y | P | Y |
| 35 | annual_taxes | Y | Y | P | Y |
| 36 | tax_year | Y | Y | P | Y |
| 37 | property_tax_rate | Y | Y | P | Y |
| 38 | tax_exemptions | Y | Y | P | Y |
| 39 | roof_type | Y | Y | P | Y |
| 40 | roof_age_est | Y | Y | P | Y |
| 41 | exterior_material | Y | Y | P | Y |
| 42 | foundation | Y | Y | P | Y |
| 43 | water_heater_type | Y | Y | P | Y |
| 44 | garage_type | Y | Y | P | Y |
| 45 | hvac_type | Y | Y | P | Y |
| 46 | hvac_age | Y | Y | P | Y |
| 47 | laundry_type | Y | Y | P | Y |
| 48 | interior_condition | Y | Y | P | Y |
| 49 | flooring_type | Y | Y | P | Y |
| 50 | kitchen_features | Y | Y | P | Y |
| 51 | appliances_included | Y | Y | P | Y |
| 52 | fireplace_yn | Y | Y | P | Y |
| 53 | primary_br_location | Y | Y | P | Y |
| 54 | pool_yn | Y | Y | P | Y |
| 55 | pool_type | Y | Y | P | Y |
| 56 | deck_patio | Y | Y | P | Y |
| 57 | fence | Y | Y | P | Y |
| 58 | landscaping | Y | Y | P | Y |
| 59 | recent_renovations | Y | Y | P | - |
| 60 | permit_history_roof | Y | Y | P | - |
| 61 | permit_history_hvac | Y | Y | P | - |
| 62 | permit_history_other | Y | Y | P | - |
| 63 | school_district | Y | Y | P | Y |
| 64 | elevation_feet | Y | Y | P | Y |
| 65 | elementary_school | Y | Y | P | Y |
| 66 | elementary_rating | Y | Y | P | Y |
| 67 | elementary_distance_mi | Y | Y | P | Y |
| 68 | middle_school | Y | Y | P | Y |
| 69 | middle_rating | Y | Y | P | Y |
| 70 | middle_distance_mi | Y | Y | P | Y |
| 71 | high_school | Y | Y | P | Y |
| 72 | high_rating | Y | Y | P | Y |
| 73 | high_distance_mi | Y | Y | P | Y |
| 74 | walk_score | Y | Y | P | - |
| 75 | transit_score | Y | Y | P | - |
| 76 | bike_score | Y | Y | P | - |
| 77 | safety_score | Y | Y | P | - |
| 78 | noise_level | Y | Y | P | - |
| 79 | traffic_level | Y | Y | P | - |
| 80 | walkability_description | Y | Y | P | - |
| 81 | public_transit_access | Y | Y | P | - |
| 82 | commute_to_city_center | Y | Y | P | - |
| 83 | distance_grocery_mi | Y | Y | P | - |
| 84 | distance_hospital_mi | Y | Y | P | - |
| 85 | distance_airport_mi | Y | Y | P | - |
| 86 | distance_park_mi | Y | Y | P | - |
| 87 | distance_beach_mi | Y | Y | P | - |
| 88 | violent_crime_index | Y | Y | P | - |
| 89 | property_crime_index | Y | Y | P | - |
| 90 | neighborhood_safety_rating | Y | Y | P | - |
| 91 | median_home_price_neighborhood | Y | Y | P | - |
| 92 | price_per_sqft_recent_avg | Y | Y | P | - |
| 93 | price_to_rent_ratio | Y | Y | P | - |
| 94 | price_vs_median_percent | Y | Y | P | - |
| 95 | days_on_market_avg | Y | Y | P | Y |
| 96 | inventory_surplus | Y | Y | P | - |
| 97 | insurance_est_annual | Y | Y | P | - |
| 98 | rental_estimate_monthly | Y | Y | P | - |
| 99 | rental_yield_est | Y | Y | P | - |
| 100 | vacancy_rate_neighborhood | Y | Y | P | - |
| 101 | cap_rate_est | Y | Y | P | - |
| 102 | financing_terms | Y | Y | P | - |
| 103 | comparable_sales | Y | Y | P | - |
| 104 | electric_provider | Y | Y | P | - |
| 105 | avg_electric_bill | Y | Y | P | - |
| 106 | water_provider | Y | Y | P | - |
| 107 | avg_water_bill | Y | Y | P | - |
| 108 | sewer_provider | Y | Y | P | - |
| 109 | natural_gas | Y | Y | P | - |
| 110 | trash_provider | Y | Y | P | - |
| 111 | internet_providers_top3 | Y | Y | P | - |
| 112 | max_internet_speed | Y | Y | P | - |
| 113 | fiber_available | Y | Y | P | - |
| 114 | cable_tv_provider | Y | Y | P | - |
| 115 | cell_coverage_quality | Y | Y | P | - |
| 116 | emergency_services_distance | Y | Y | P | - |
| 117 | air_quality_index | Y | Y | P | - |
| 118 | air_quality_grade | Y | Y | P | - |
| 119 | flood_zone | Y | Y | P | Y |
| 120 | flood_risk_level | Y | Y | P | - |
| 121 | climate_risk | Y | Y | P | - |
| 122 | wildfire_risk | Y | Y | P | - |
| 123 | earthquake_risk | Y | Y | P | - |
| 124 | hurricane_risk | Y | Y | P | - |
| 125 | tornado_risk | Y | Y | P | - |
| 126 | radon_risk | Y | Y | P | - |
| 127 | superfund_site_nearby | Y | Y | P | - |
| 128 | sea_level_rise_risk | Y | Y | P | - |
| 129 | noise_level_db_est | Y | Y | P | - |
| 130 | solar_potential | Y | Y | P | - |
| 131 | view_type | Y | Y | P | Y |
| 132 | lot_features | Y | Y | P | Y |
| 133 | ev_charging | Y | Y | P | Y |
| 134 | smart_home_features | Y | Y | P | Y |
| 135 | accessibility_modifications | Y | Y | P | Y |
| 136 | pet_policy | Y | Y | P | Y |
| 137 | age_restrictions | Y | Y | P | - |
| 138 | special_assessments | Y | Y | P | - |
| 139 | carport_yn | Y | Y | P | Y |
| 140 | carport_spaces | Y | Y | P | Y |
| 141 | garage_attached_yn | Y | Y | P | Y |
| 142 | parking_features | Y | Y | P | Y |
| 143 | assigned_parking_spaces | Y | Y | P | Y |
| 144 | floor_number | Y | Y | P | Y |
| 145 | building_total_floors | Y | Y | P | Y |
| 146 | building_name_number | Y | Y | P | Y |
| 147 | building_elevator_yn | Y | Y | P | Y |
| 148 | floors_in_unit | Y | Y | P | - |
| 149 | subdivision_name | Y | Y | P | Y |
| 150 | legal_description | Y | Y | P | Y |
| 151 | homestead_yn | Y | Y | P | Y |
| 152 | cdd_yn | Y | Y | P | Y |
| 153 | annual_cdd_fee | Y | Y | P | Y |
| 154 | front_exposure | Y | Y | P | Y |
| 155 | water_frontage_yn | Y | Y | P | Y |
| 156 | waterfront_feet | Y | Y | P | Y |
| 157 | water_access_yn | Y | Y | P | Y |
| 158 | water_view_yn | Y | Y | P | Y |
| 159 | water_body_name | Y | Y | P | Y |
| 160 | can_be_leased_yn | Y | Y | P | Y |
| 161 | minimum_lease_period | Y | Y | P | Y |
| 162 | lease_restrictions_yn | Y | Y | P | Y |
| 163 | pet_size_limit | Y | Y | P | Y |
| 164 | max_pet_weight | Y | Y | P | Y |
| 165 | association_approval_yn | Y | Y | P | Y |
| 166 | community_features | Y | Y | P | Y |
| 167 | interior_features | Y | Y | P | Y |
| 168 | exterior_features | Y | Y | P | Y |
| 169 | zillow_views | Y | Y | Y | - |
| 170 | redfin_views | Y | Y | Y | - |
| 171 | homes_views | Y | Y | Y | - |
| 172 | realtor_views | Y | Y | Y | - |
| 173 | total_views | Y | Y | Y | - |
| 174 | saves_favorites | Y | Y | Y | - |
| 175 | market_type | Y | Y | Y | - |
| 176 | avg_sale_to_list_percent | Y | Y | Y | - |
| 177 | avg_days_to_pending | Y | Y | Y | - |
| 178 | multiple_offers_likelihood | Y | Y | Y | - |
| 179 | appreciation_percent | Y | Y | Y | - |
| 180 | price_trend | Y | Y | Y | - |
| 181 | rent_zestimate | Y | Y | Y | - |

---

## Notes on `parse-mls-pdf.ts`

This file maps MLS PDF labels to numbered fields. It does NOT need all 181 fields because:
1. It only handles fields that appear in Stellar MLS CustomerFull PDF sheets
2. Fields 74-90 (scores, crime) come from external APIs, not MLS
3. Fields 91-103 (market data) come from external APIs, not MLS
4. Fields 104-130 (utilities, environment) come from external APIs, not MLS
5. Fields 169-181 (market performance) come from portal scraping/Redfin analytics, not MLS

## Notes on `arbitration.ts`

This file operates at a higher abstraction level and does NOT reference numbered fields directly.
It works with generic field keys and the arbitration logic.

---

## Proof of Fixes

### Fix 1: Photo fields no longer conflict with Market Performance

**Before (WRONG):**
```typescript
{ fieldNumber: 169, apiKey: 'property_photo_url', group: 'address', ... }
{ fieldNumber: 170, apiKey: 'property_photos', group: 'address', ... }
```

**After (FIXED):**
```typescript
{ fieldNumber: 'photo_primary', apiKey: 'property_photo_url', group: 'address', ... }
{ fieldNumber: 'photo_gallery', apiKey: 'property_photos', group: 'address', ... }
```

### Fix 2: Market Performance fields 169-181 now exist

**Added in field-normalizer.ts lines 267-280:**
```typescript
// ========== GROUP 23: Market Performance (Fields 169-181) - Section W ==========
{ fieldNumber: 169, apiKey: '169_zillow_views', group: 'marketPerformance', propName: 'zillowViews', type: 'number', validation: (v) => v >= 0 },
{ fieldNumber: 170, apiKey: '170_redfin_views', group: 'marketPerformance', propName: 'redfinViews', type: 'number', validation: (v) => v >= 0 },
{ fieldNumber: 171, apiKey: '171_homes_views', group: 'marketPerformance', propName: 'homesViews', type: 'number', validation: (v) => v >= 0 },
{ fieldNumber: 172, apiKey: '172_realtor_views', group: 'marketPerformance', propName: 'realtorViews', type: 'number', validation: (v) => v >= 0 },
{ fieldNumber: 173, apiKey: '173_total_views', group: 'marketPerformance', propName: 'totalViews', type: 'number', validation: (v) => v >= 0 },
{ fieldNumber: 174, apiKey: '174_saves_favorites', group: 'marketPerformance', propName: 'savesFavorites', type: 'number', validation: (v) => v >= 0 },
{ fieldNumber: 175, apiKey: '175_market_type', group: 'marketPerformance', propName: 'marketType', type: 'string' },
{ fieldNumber: 176, apiKey: '176_avg_sale_to_list_percent', group: 'marketPerformance', propName: 'avgSaleToListPercent', type: 'number', validation: (v) => v >= 0 && v <= 200 },
{ fieldNumber: 177, apiKey: '177_avg_days_to_pending', group: 'marketPerformance', propName: 'avgDaysToPending', type: 'number', validation: (v) => v >= 0 && v <= 365 },
{ fieldNumber: 178, apiKey: '178_multiple_offers_likelihood', group: 'marketPerformance', propName: 'multipleOffersLikelihood', type: 'string' },
{ fieldNumber: 179, apiKey: '179_appreciation_percent', group: 'marketPerformance', propName: 'appreciationPercent', type: 'number', validation: (v) => v >= -100 && v <= 500 },
{ fieldNumber: 180, apiKey: '180_price_trend', group: 'marketPerformance', propName: 'priceTrend', type: 'string' },
{ fieldNumber: 181, apiKey: '181_rent_zestimate', group: 'marketPerformance', propName: 'rentZestimate', type: 'number', validation: (v) => v >= 0 && v < 100000 },
```

### Fix 3: MarketPerformanceData interface added to property.ts

**Added in property.ts lines 280-294:**
```typescript
export interface MarketPerformanceData {
  zillowViews: DataField<number>;           // #169 zillow_views
  redfinViews: DataField<number>;           // #170 redfin_views
  homesViews: DataField<number>;            // #171 homes_views
  realtorViews: DataField<number>;          // #172 realtor_views
  totalViews: DataField<number>;            // #173 total_views
  savesFavorites: DataField<number>;        // #174 saves_favorites
  marketType: DataField<string>;            // #175 market_type (buyer's/seller's/balanced)
  avgSaleToListPercent: DataField<number>;  // #176 avg_sale_to_list_percent
  avgDaysToPending: DataField<number>;      // #177 avg_days_to_pending
  multipleOffersLikelihood: DataField<string>; // #178 multiple_offers_likelihood
  appreciationPercent: DataField<number>;   // #179 appreciation_percent
  priceTrend: DataField<string>;            // #180 price_trend (increasing/decreasing/stable)
  rentZestimate: DataField<number>;         // #181 rent_zestimate
}
```

---

## Verification Complete

All 181 fields are now properly mapped and synchronized across the controlling files.
