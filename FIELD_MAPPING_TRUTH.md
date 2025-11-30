# FIELD MAPPING TRUTH DOCUMENT

**CRITICAL: READ THIS BEFORE ANY FIELD MAPPING WORK**

Created: 2025-11-30
Purpose: Permanent record of field numbering to prevent repeated mapping failures

---

## THE PROBLEM

There are **4 DIFFERENT FIELD NUMBERING SYSTEMS** in this codebase that MUST be synchronized:

1. `src/types/fields-schema.ts` - THE SOURCE OF TRUTH (138 original + 30 Stellar MLS = 168 fields)
2. `src/lib/field-normalizer.ts` - Property normalization (WRONG - uses different numbers)
3. `api/property/search.ts` - API response mapping (WRONG - uses different numbers)
4. `src/pages/PropertyDetail.tsx` - Display mapping (follows fields-schema.ts)
5. `api/property/parse-mls-pdf.ts` - PDF parsing (WRONG - uses field-normalizer numbers)

---

## THE CORRECT FIELD NUMBERING (from fields-schema.ts)

### Group 1: Address & Identity (1-9)
| # | Key | Label |
|---|-----|-------|
| 1 | full_address | Full Address |
| 2 | mls_primary | MLS Primary |
| 3 | mls_secondary | MLS Secondary |
| 4 | listing_status | Listing Status |
| 5 | listing_date | Listing Date |
| 6 | neighborhood | Neighborhood |
| 7 | county | County |
| 8 | zip_code | ZIP Code |
| 9 | parcel_id | Parcel ID |

### Group 2: Pricing & Value (10-16)
| # | Key | Label |
|---|-----|-------|
| 10 | listing_price | Listing Price |
| 11 | price_per_sqft | Price Per Sq Ft |
| 12 | market_value_estimate | Market Value Estimate |
| 13 | last_sale_date | Last Sale Date |
| 14 | last_sale_price | Last Sale Price |
| 15 | assessed_value | Assessed Value |
| 16 | redfin_estimate | Redfin Estimate |

### Group 3: Property Basics (17-29)
| # | Key | Label |
|---|-----|-------|
| 17 | bedrooms | Bedrooms |
| 18 | full_bathrooms | Full Bathrooms |
| 19 | half_bathrooms | Half Bathrooms |
| 20 | total_bathrooms | Total Bathrooms |
| 21 | living_sqft | Living Sq Ft |
| 22 | total_sqft_under_roof | Total Sq Ft Under Roof |
| 23 | lot_size_sqft | Lot Size (Sq Ft) |
| 24 | lot_size_acres | Lot Size (Acres) |
| 25 | year_built | Year Built |
| 26 | property_type | Property Type |
| 27 | stories | Stories |
| 28 | garage_spaces | Garage Spaces |
| 29 | parking_total | Parking Total |

### Group 4: HOA & Taxes (30-38)
| # | Key | Label |
|---|-----|-------|
| 30 | hoa_yn | HOA |
| 31 | hoa_fee_annual | HOA Fee (Annual) |
| 32 | hoa_name | HOA Name |
| 33 | hoa_includes | HOA Includes |
| 34 | ownership_type | Ownership Type |
| 35 | annual_taxes | Annual Taxes |
| 36 | tax_year | Tax Year |
| 37 | property_tax_rate | Property Tax Rate |
| 38 | tax_exemptions | Tax Exemptions |

### Group 5: Structure & Systems (39-48)
| # | Key | Label |
|---|-----|-------|
| 39 | roof_type | Roof Type |
| 40 | roof_age_est | Roof Age (Est) |
| 41 | exterior_material | Exterior Material |
| 42 | foundation | Foundation |
| 43 | water_heater_type | Water Heater Type |
| 44 | garage_type | Garage Type |
| 45 | hvac_type | HVAC Type |
| 46 | hvac_age | HVAC Age |
| 47 | laundry_type | Laundry Type |
| 48 | interior_condition | Interior Condition |

### Group 6: Interior Features (49-53)
| # | Key | Label |
|---|-----|-------|
| 49 | flooring_type | Flooring Type |
| 50 | kitchen_features | Kitchen Features |
| 51 | appliances_included | Appliances Included |
| 52 | fireplace_yn | Fireplace |
| 53 | fireplace_count | Fireplace Count |

### Group 7: Exterior Features (54-58)
| # | Key | Label |
|---|-----|-------|
| 54 | pool_yn | Pool |
| 55 | pool_type | Pool Type |
| 56 | deck_patio | Deck/Patio |
| 57 | fence | Fence |
| 58 | landscaping | Landscaping |

### Group 8: Permits & Renovations (59-62)
| # | Key | Label |
|---|-----|-------|
| 59 | recent_renovations | Recent Renovations |
| 60 | permit_history_roof | Permit History (Roof) |
| 61 | permit_history_hvac | Permit History (HVAC) |
| 62 | permit_history_other | Permit History (Other) |

### Group 9: Schools (63-73)
| # | Key | Label |
|---|-----|-------|
| 63 | school_district | School District |
| 64 | elevation_feet | Elevation (feet) |
| 65 | elementary_school | Elementary School |
| 66 | elementary_rating | Elementary Rating |
| 67 | elementary_distance_mi | Elementary Distance (mi) |
| 68 | middle_school | Middle School |
| 69 | middle_rating | Middle Rating |
| 70 | middle_distance_mi | Middle Distance (mi) |
| 71 | high_school | High School |
| 72 | high_rating | High Rating |
| 73 | high_distance_mi | High Distance (mi) |

### Group 10: Location Scores (74-82)
| # | Key | Label |
|---|-----|-------|
| 74 | walk_score | Walk Score |
| 75 | transit_score | Transit Score |
| 76 | bike_score | Bike Score |
| 77 | safety_score | Safety Score |
| 78 | noise_level | Noise Level |
| 79 | traffic_level | Traffic Level |
| 80 | walkability_description | Walkability Description |
| 81 | public_transit_access | Public Transit Access |
| 82 | commute_to_city_center | Commute to City Center |

### Group 11: Distances (83-87)
| # | Key | Label |
|---|-----|-------|
| 83 | distance_grocery_mi | Distance to Grocery (mi) |
| 84 | distance_hospital_mi | Distance to Hospital (mi) |
| 85 | distance_airport_mi | Distance to Airport (mi) |
| 86 | distance_park_mi | Distance to Park (mi) |
| 87 | distance_beach_mi | Distance to Beach (mi) |

### Group 12: Safety & Crime (88-90)
| # | Key | Label |
|---|-----|-------|
| 88 | violent_crime_index | Violent Crime Index |
| 89 | property_crime_index | Property Crime Index |
| 90 | neighborhood_safety_rating | Neighborhood Safety Rating |

### Group 13: Market & Investment (91-103)
| # | Key | Label |
|---|-----|-------|
| 91 | median_home_price_neighborhood | Median Home Price (Neighborhood) |
| 92 | price_per_sqft_recent_avg | Price/SqFt (Recent Avg) |
| 93 | price_to_rent_ratio | Price to Rent Ratio |
| 94 | price_vs_median_percent | Price vs Median % |
| 95 | days_on_market_avg | Days on Market (Avg) |
| 96 | inventory_surplus | Inventory Surplus |
| 97 | insurance_est_annual | Insurance Est (Annual) |
| 98 | rental_estimate_monthly | Rental Estimate (Monthly) |
| 99 | rental_yield_est | Rental Yield (Est) |
| 100 | vacancy_rate_neighborhood | Vacancy Rate (Neighborhood) |
| 101 | cap_rate_est | Cap Rate (Est) |
| 102 | financing_terms | Financing Terms |
| 103 | comparable_sales | Comparable Sales |

### Group 14: Utilities (104-116)
| # | Key | Label |
|---|-----|-------|
| 104 | electric_provider | Electric Provider |
| 105 | avg_electric_bill | Avg Electric Bill |
| 106 | water_provider | Water Provider |
| 107 | avg_water_bill | Avg Water Bill |
| 108 | sewer_provider | Sewer Provider |
| 109 | natural_gas | Natural Gas |
| 110 | trash_provider | Trash Provider |
| 111 | internet_providers_top3 | Internet Providers (Top 3) |
| 112 | max_internet_speed | Max Internet Speed |
| 113 | fiber_available | Fiber Available |
| 114 | cable_tv_provider | Cable TV Provider |
| 115 | cell_coverage_quality | Cell Coverage Quality |
| 116 | emergency_services_distance | Emergency Services Distance |

### Group 15: Environment & Risk (117-130)
| # | Key | Label |
|---|-----|-------|
| 117 | air_quality_index | Air Quality Index |
| 118 | air_quality_grade | Air Quality Grade |
| 119 | flood_zone | Flood Zone |
| 120 | flood_risk_level | Flood Risk Level |
| 121 | climate_risk | Climate Risk |
| 122 | wildfire_risk | Wildfire Risk |
| 123 | earthquake_risk | Earthquake Risk |
| 124 | hurricane_risk | Hurricane Risk |
| 125 | tornado_risk | Tornado Risk |
| 126 | radon_risk | Radon Risk |
| 127 | superfund_site_nearby | Superfund Site Nearby |
| 128 | sea_level_rise_risk | Sea Level Rise Risk |
| 129 | noise_level_db_est | Noise Level (dB Est) |
| 130 | solar_potential | Solar Potential |

### Group 16: Additional Features (131-138)
| # | Key | Label |
|---|-----|-------|
| 131 | view_type | View Type |
| 132 | lot_features | Lot Features |
| 133 | ev_charging | EV Charging |
| 134 | smart_home_features | Smart Home Features |
| 135 | accessibility_modifications | Accessibility Modifications |
| 136 | pet_policy | Pet Policy |
| 137 | age_restrictions | Age Restrictions |
| 138 | special_assessments | Special Assessments |

### Group 17: Stellar MLS - Parking (139-143)
| # | Key | Label |
|---|-----|-------|
| 139 | carport_yn | Carport Y/N |
| 140 | carport_spaces | Carport Spaces |
| 141 | garage_attached_yn | Garage Attached Y/N |
| 142 | parking_features | Parking Features |
| 143 | assigned_parking_spaces | Assigned Parking Spaces |

### Group 18: Stellar MLS - Building (144-148)
| # | Key | Label |
|---|-----|-------|
| 144 | floor_number | Floor Number |
| 145 | building_total_floors | Building Total Floors |
| 146 | building_name_number | Building Name/Number |
| 147 | building_elevator_yn | Building Elevator Y/N |
| 148 | floors_in_unit | Floors in Unit |

### Group 19: Stellar MLS - Legal (149-154)
| # | Key | Label |
|---|-----|-------|
| 149 | subdivision_name | Subdivision Name |
| 150 | legal_description | Legal Description |
| 151 | homestead_yn | Homestead Y/N |
| 152 | cdd_yn | CDD Y/N |
| 153 | annual_cdd_fee | Annual CDD Fee |
| 154 | front_exposure | Front Exposure |

### Group 20: Stellar MLS - Waterfront (155-159)
| # | Key | Label |
|---|-----|-------|
| 155 | water_frontage_yn | Water Frontage Y/N |
| 156 | waterfront_feet | Waterfront Feet |
| 157 | water_access_yn | Water Access Y/N |
| 158 | water_view_yn | Water View Y/N |
| 159 | water_body_name | Water Body Name |

### Group 21: Stellar MLS - Leasing (160-165)
| # | Key | Label |
|---|-----|-------|
| 160 | can_be_leased_yn | Can Be Leased Y/N |
| 161 | minimum_lease_period | Minimum Lease Period |
| 162 | lease_restrictions_yn | Lease Restrictions Y/N |
| 163 | pet_size_limit | Pet Size Limit |
| 164 | max_pet_weight | Max Pet Weight |
| 165 | association_approval_yn | Association Approval Y/N |

### Group 22: Stellar MLS - Features (166-168)
| # | Key | Label |
|---|-----|-------|
| 166 | community_features | Community Features |
| 167 | interior_features | Interior Features |
| 168 | exterior_features | Exterior Features |

---

## FILES THAT MUST BE SYNCHRONIZED

### 1. src/types/fields-schema.ts ✅ SOURCE OF TRUTH
- Defines ALL_FIELDS array with correct numbering
- DO NOT CHANGE THIS FILE

### 2. src/lib/field-normalizer.ts ❌ NEEDS UPDATE
- Current: Uses wrong field numbers (e.g., field 7 = listing_price, should be county)
- MUST update FIELD_TO_PROPERTY_MAP to match fields-schema.ts
- API key format: `{num}_{key}` (e.g., "10_listing_price", "17_bedrooms")

### 3. api/property/search.ts ❌ NEEDS UPDATE
- Current: Uses wrong field numbers in convertFlatToNestedStructure()
- MUST update fieldPathMap to match fields-schema.ts
- API key format: `{num}_{key}` (e.g., "10_listing_price", "17_bedrooms")

### 4. src/pages/PropertyDetail.tsx ✅ FOLLOWS fields-schema.ts
- Uses correct field numbers in paths mapping
- Display categories match fields-schema.ts groups
- NEEDS: Add Stellar MLS sections (139-168)

### 5. api/property/parse-mls-pdf.ts ❌ NEEDS UPDATE
- Current: Uses field-normalizer.ts numbers (wrong)
- MUST update MLS_FIELD_MAPPING to use correct numbers
- Example: 'List Price' should map to '10_listing_price' not '7_listing_price'

---

## VERIFICATION CHECKLIST

Before claiming ANY field mapping work is "done", verify:

- [ ] Run: `npm run verify-fields` (verification script)
- [ ] Test: Manual address search populates PropertyDetail correctly
- [ ] Test: PDF upload populates PropertyDetail correctly
- [ ] Test: Field numbers in console.log match fields-schema.ts
- [ ] Check: No "Not available" for fields that have data

---

## KNOWN ISSUES TO FIX

1. **Sq Ft Display Bug**: Shows "1,345,125" instead of "1,345"
2. **Pool "Community" → "No"**: Boolean conversion treats "Community" as false
3. **ZIP Code Missing**: Not parsed from address correctly
4. **Baths "2/0" Format**: Not split into full_bathrooms/half_bathrooms
5. **HOA Fee Monthly vs Annual**: $1,147 monthly shown as annual
6. **Stellar MLS Not Displayed**: Fields 139-168 have no UI sections

---

## API KEY FORMAT

All API field keys MUST follow this format:
```
{field_number}_{field_key}
```

Examples:
- `10_listing_price` (NOT `7_listing_price`)
- `17_bedrooms` (NOT `12_bedrooms`)
- `21_living_sqft` (NOT `16_living_sqft`)
- `35_annual_taxes` (NOT `29_annual_taxes`)

---

## PROPERTY OBJECT STRUCTURE

The Property interface has these top-level groups:
- `address` - AddressData
- `details` - PropertyDetails
- `structural` - StructuralDetails
- `location` - LocationData
- `financial` - FinancialData
- `utilities` - UtilitiesData
- `stellarMLS` - StellarMLSData (with sub-groups: parking, building, legal, waterfront, leasing, features)

---

## MAPPING FROM fields-schema.ts GROUPS TO Property INTERFACE

| fields-schema.ts Group | Property Interface Path |
|------------------------|-------------------------|
| Address & Identity | address.* |
| Pricing & Value | address.listingPrice, address.pricePerSqft, details.* |
| Property Basics | details.* |
| HOA & Taxes | details.*, financial.* |
| Structure & Systems | structural.* |
| Interior Features | structural.* |
| Exterior Features | structural.* |
| Permits & Renovations | structural.* |
| Schools | location.* |
| Location Scores | location.* |
| Distances | location.* |
| Safety & Crime | location.* |
| Market & Investment | financial.* |
| Utilities | utilities.* |
| Environment & Risk | utilities.* |
| Additional Features | utilities.* |
| Stellar MLS - Parking | stellarMLS.parking.* |
| Stellar MLS - Building | stellarMLS.building.* |
| Stellar MLS - Legal | stellarMLS.legal.* |
| Stellar MLS - Waterfront | stellarMLS.waterfront.* |
| Stellar MLS - Leasing | stellarMLS.leasing.* |
| Stellar MLS - Features | stellarMLS.features.* |

---

**REMEMBER: fields-schema.ts is THE SOURCE OF TRUTH. All other files MUST match its numbering.**
