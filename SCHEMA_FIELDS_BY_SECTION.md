# SCHEMA FIELDS BY SECTION
# Complete Field Reference for Chart Generation
**Source:** src/types/fields-schema.ts
**Total Fields:** 168 (138 original + 30 Stellar MLS)
**Total Sections:** 22

---

## SECTION 1: ADDRESS & IDENTITY
**Fields:** 1-9 (9 fields)
**Chart Numbers:** 1-1 to 1-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 1 | full_address | Full Address | text | ✅ YES | - |
| 2 | mls_primary | MLS Primary | text | No | - |
| 3 | mls_secondary | MLS Secondary | text | No | - |
| 4 | listing_status | Listing Status | select | No | Active, Pending, Sold, Off-Market |
| 5 | listing_date | Listing Date | date | No | - |
| 6 | neighborhood | Neighborhood | text | No | - |
| 7 | county | County | text | No | - |
| 8 | zip_code | ZIP Code | text | No | - |
| 9 | parcel_id | Parcel ID | text | No | - |

**Chart Ideas:**
- Listing status distribution
- Days on market by neighborhood
- MLS coverage comparison
- Geographic location heatmap

---

## SECTION 2: PRICING & VALUE
**Fields:** 10-16 (7 fields)
**Chart Numbers:** 2-1 to 2-X

| Field # | Key | Label | Type | Required | Calculated | Options |
|---------|-----|-------|------|----------|------------|---------|
| 10 | listing_price | Listing Price | currency | No | No | - |
| 11 | price_per_sqft | Price Per Sq Ft | currency | No | ✅ YES | - |
| 12 | market_value_estimate | Market Value Estimate | currency | No | No | - |
| 13 | last_sale_date | Last Sale Date | date | No | No | - |
| 14 | last_sale_price | Last Sale Price | currency | No | No | - |
| 15 | assessed_value | Assessed Value | currency | No | No | - |
| 16 | redfin_estimate | Redfin Estimate | currency | No | No | - |

**Chart Ideas:**
- Listing price comparison (bar chart)
- Price per sqft analysis
- Value estimates comparison (listing vs market vs assessed vs Redfin)
- Price appreciation (last sale vs current)
- Price vs market value gap
- Valuation consensus (how close are all estimates)

---

## SECTION 3: PROPERTY BASICS ✅ COMPLETE
**Fields:** 17-29 (13 fields)
**Chart Numbers:** 3-1 to 3-10 (10 charts complete)

| Field # | Key | Label | Type | Required | Calculated | Options |
|---------|-----|-------|------|----------|------------|---------|
| 17 | bedrooms | Bedrooms | number | ✅ YES | No | - |
| 18 | full_bathrooms | Full Bathrooms | number | ✅ YES | No | - |
| 19 | half_bathrooms | Half Bathrooms | number | No | No | - |
| 20 | total_bathrooms | Total Bathrooms | number | No | ✅ YES | - |
| 21 | living_sqft | Living Sq Ft | number | ✅ YES | No | - |
| 22 | total_sqft_under_roof | Total Sq Ft Under Roof | number | No | No | - |
| 23 | lot_size_sqft | Lot Size (Sq Ft) | number | No | No | - |
| 24 | lot_size_acres | Lot Size (Acres) | number | No | ✅ YES | - |
| 25 | year_built | Year Built | number | ✅ YES | No | - |
| 26 | property_type | Property Type | select | ✅ YES | No | Single Family, Condo, Townhouse, Multi-Family, Land, Commercial |
| 27 | stories | Stories | number | No | No | - |
| 28 | garage_spaces | Garage Spaces | number | No | No | - |
| 29 | parking_total | Parking Total | text | No | No | - |

**Status:** ✅ 10 charts complete (3-1 through 3-10)

---

## SECTION 4: HOA & TAXES
**Fields:** 30-38 (9 fields)
**Chart Numbers:** 4-1 to 4-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 30 | hoa_yn | HOA | boolean | No | - |
| 31 | hoa_fee_annual | HOA Fee (Annual) | currency | No | - |
| 32 | hoa_name | HOA Name | text | No | - |
| 33 | hoa_includes | HOA Includes | text | No | - |
| 34 | ownership_type | Ownership Type | select | No | Fee Simple, Leasehold, Condo, Co-op |
| 35 | annual_taxes | Annual Taxes | currency | No | - |
| 36 | tax_year | Tax Year | number | No | - |
| 37 | property_tax_rate | Property Tax Rate | percentage | No | - |
| 38 | tax_exemptions | Tax Exemptions | text | No | - |

**Chart Ideas:**
- HOA fee comparison (bar chart)
- Annual taxes comparison (bar chart)
- Total housing cost (taxes + HOA stacked bar)
- Tax rate comparison
- HOA vs non-HOA properties
- Tax burden analysis (taxes as % of home value)
- Ownership type distribution (pie chart)
- Cost per month breakdown (taxes + HOA)

---

## SECTION 5: STRUCTURE & SYSTEMS
**Fields:** 39-48 (10 fields)
**Chart Numbers:** 5-1 to 5-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 39 | roof_type | Roof Type | select | No | Shingle, Tile, Metal, Flat, Other |
| 40 | roof_age_est | Roof Age (Est) | text | No | - |
| 41 | exterior_material | Exterior Material | select | No | Block/Stucco, Brick, Wood, Vinyl Siding, Fiber Cement, Other |
| 42 | foundation | Foundation | select | No | Slab, Crawl Space, Basement, Pier/Beam |
| 43 | water_heater_type | Water Heater Type | text | No | - |
| 44 | garage_type | Garage Type | text | No | - |
| 45 | hvac_type | HVAC Type | text | No | - |
| 46 | hvac_age | HVAC Age | text | No | - |
| 47 | laundry_type | Laundry Type | text | No | - |
| 48 | interior_condition | Interior Condition | select | No | Excellent, Good, Fair, Needs Work, Renovated |

**Chart Ideas:**
- Roof type distribution (pie chart)
- Exterior material comparison (bar chart)
- Foundation type comparison
- Interior condition scoring
- System age analysis (HVAC, roof)
- Construction quality score (composite of materials + condition)

---

## SECTION 6: INTERIOR FEATURES
**Fields:** 49-53 (5 fields)
**Chart Numbers:** 6-1 to 6-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 49 | flooring_type | Flooring Type | text | No | - |
| 50 | kitchen_features | Kitchen Features | text | No | - |
| 51 | appliances_included | Appliances Included | multiselect | No | Refrigerator, Dishwasher, Range/Oven, Microwave, Washer, Dryer, Disposal |
| 52 | fireplace_yn | Fireplace | boolean | No | - |
| 53 | fireplace_count | Fireplace Count | number | No | - |

**Chart Ideas:**
- Appliances included count (bar chart)
- Fireplace comparison
- Kitchen features comparison
- Interior amenities score (composite)
- Flooring type distribution

---

## SECTION 7: EXTERIOR FEATURES
**Fields:** 54-58 (5 fields)
**Chart Numbers:** 7-1 to 7-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 54 | pool_yn | Pool | boolean | No | - |
| 55 | pool_type | Pool Type | multiselect | No | N/A, In-ground, Above-ground, In-ground Heated, Community |
| 56 | deck_patio | Deck/Patio | text | No | - |
| 57 | fence | Fence | text | No | - |
| 58 | landscaping | Landscaping | text | No | - |

**Chart Ideas:**
- Pool presence comparison
- Pool type analysis
- Outdoor amenities score
- Fence/landscaping comparison
- Outdoor living space quality

---

## SECTION 8: PERMITS & RENOVATIONS
**Fields:** 59-62 (4 fields)
**Chart Numbers:** 8-1 to 8-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 59 | recent_renovations | Recent Renovations | text | No | - |
| 60 | permit_history_roof | Permit History - Roof | text | No | - |
| 61 | permit_history_hvac | Permit History - HVAC | text | No | - |
| 62 | permit_history_other | Permit History - Other | text | No | - |

**Chart Ideas:**
- Renovation recency analysis
- Permit history completeness
- Renovation quality score
- System upgrade tracking

---

## SECTION 9: ASSIGNED SCHOOLS
**Fields:** 63-73 (11 fields)
**Chart Numbers:** 9-1 to 9-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 63 | school_district | School District | text | No | - |
| 64 | elevation_feet | Elevation (feet) | number | No | - |
| 65 | elementary_school | Elementary School | text | No | - |
| 66 | elementary_rating | Elementary Rating | text | No | - |
| 67 | elementary_distance_mi | Elementary Distance (mi) | number | No | - |
| 68 | middle_school | Middle School | text | No | - |
| 69 | middle_rating | Middle Rating | text | No | - |
| 70 | middle_distance_mi | Middle Distance (mi) | number | No | - |
| 71 | high_school | High School | text | No | - |
| 72 | high_rating | High Rating | text | No | - |
| 73 | high_distance_mi | High Distance (mi) | number | No | - |

**Chart Ideas:**
- School ratings comparison (radar chart)
- Distance to schools (grouped bar)
- Overall school quality score
- School district comparison
- Elevation comparison

---

## SECTION 10: LOCATION SCORES
**Fields:** 74-82 (9 fields)
**Chart Numbers:** 10-1 to 10-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 74 | walk_score | Walk Score | number | No | - |
| 75 | transit_score | Transit Score | number | No | - |
| 76 | bike_score | Bike Score | number | No | - |
| 77 | safety_score | Safety | number | No | - |
| 78 | noise_level | Noise Level | text | No | - |
| 79 | traffic_level | Traffic Level | text | No | - |
| 80 | walkability_description | Walkability Description | text | No | - |
| 81 | public_transit_access | Public Transit Access | text | No | - |
| 82 | commute_to_city_center | Commute to City Center | text | No | - |

**Chart Ideas:**
- Location score radar (walk/transit/bike/safety)
- Walkability comparison (bar chart)
- Transportation accessibility composite
- Quality of life score
- Noise/traffic analysis

---

## SECTION 11: DISTANCES & AMENITIES
**Fields:** 83-87 (5 fields)
**Chart Numbers:** 11-1 to 11-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 83 | distance_grocery_mi | Distance to Grocery (mi) | number | No | - |
| 84 | distance_hospital_mi | Distance to Hospital (mi) | number | No | - |
| 85 | distance_airport_mi | Distance to Airport (mi) | number | No | - |
| 86 | distance_park_mi | Distance to Park (mi) | number | No | - |
| 87 | distance_beach_mi | Distance to Beach (mi) | number | No | - |

**Chart Ideas:**
- Distance comparison (grouped bar chart)
- Convenience score (lower distances = better)
- Amenity proximity radar
- Lifestyle accessibility score

---

## SECTION 12: SAFETY & CRIME
**Fields:** 88-90 (3 fields)
**Chart Numbers:** 12-1 to 12-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 88 | violent_crime_index | Violent Crime Index | text | No | - |
| 89 | property_crime_index | Property Crime Index | text | No | - |
| 90 | neighborhood_safety_rating | Neighborhood Safety Rating | text | No | - |

**Chart Ideas:**
- Crime index comparison (grouped bar)
- Safety rating comparison
- Overall safety score
- Crime vs safety rating correlation

---

## SECTION 13: MARKET & INVESTMENT DATA
**Fields:** 91-103 (13 fields)
**Chart Numbers:** 13-1 to 13-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 91 | median_home_price_neighborhood | Median Home Price (Neighborhood) | currency | No | - |
| 92 | price_per_sqft_recent_avg | Price Per Sq Ft (Recent Avg) | currency | No | - |
| 93 | price_to_rent_ratio | Price to Rent Ratio | number | No | - |
| 94 | price_vs_median_percent | Price vs Median % | percentage | No | - |
| 95 | days_on_market_avg | Days on Market (Avg) | number | No | - |
| 96 | inventory_surplus | Inventory Surplus | text | No | - |
| 97 | insurance_est_annual | Insurance Estimate (Annual) | currency | No | - |
| 98 | rental_estimate_monthly | Rental Estimate (Monthly) | currency | No | - |
| 99 | rental_yield_est | Rental Yield (Est) | percentage | No | - |
| 100 | vacancy_rate_neighborhood | Vacancy Rate (Neighborhood) | percentage | No | - |
| 101 | cap_rate_est | Cap Rate (Est) | percentage | No | - |
| 102 | financing_terms | Financing Terms | text | No | - |
| 103 | comparable_sales | Comparable Sales | text | No | - |

**Chart Ideas:**
- Investment metrics comparison (cap rate, rental yield)
- Price vs median analysis
- Rental income potential
- Market competitiveness (days on market)
- Total cost of ownership (insurance + taxes + HOA)
- Investment ROI comparison

---

## SECTION 14: UTILITIES & CONNECTIVITY
**Fields:** 104-116 (13 fields)
**Chart Numbers:** 14-1 to 14-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 104 | electric_provider | Electric Provider | text | No | - |
| 105 | avg_electric_bill | Avg Electric Bill | text | No | - |
| 106 | water_provider | Water Provider | text | No | - |
| 107 | avg_water_bill | Avg Water Bill | text | No | - |
| 108 | sewer_provider | Sewer Provider | text | No | - |
| 109 | natural_gas | Natural Gas | text | No | - |
| 110 | trash_provider | Trash Provider | text | No | - |
| 111 | internet_providers_top3 | Internet Providers (Top 3) | text | No | - |
| 112 | max_internet_speed | Max Internet Speed | text | No | - |
| 113 | fiber_available | Fiber Available | text | No | - |
| 114 | cable_tv_provider | Cable TV Provider | text | No | - |
| 115 | cell_coverage_quality | Cell Coverage Quality | text | No | - |
| 116 | emergency_services_distance | Emergency Services Distance | text | No | - |

**Chart Ideas:**
- Utility costs comparison (electric + water stacked bar)
- Internet speed comparison
- Connectivity quality score
- Total monthly utility costs
- Service provider coverage

---

## SECTION 15: ENVIRONMENT & RISK
**Fields:** 117-130 (14 fields)
**Chart Numbers:** 15-1 to 15-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 117 | air_quality_index | Air Quality Index | text | No | - |
| 118 | air_quality_grade | Air Quality Grade | text | No | - |
| 119 | flood_zone | Flood Zone | text | No | - |
| 120 | flood_risk_level | Flood Risk Level | text | No | - |
| 121 | climate_risk | Climate Risk | text | No | - |
| 122 | wildfire_risk | Wildfire Risk | text | No | - |
| 123 | earthquake_risk | Earthquake Risk | text | No | - |
| 124 | hurricane_risk | Hurricane Risk | text | No | - |
| 125 | tornado_risk | Tornado Risk | text | No | - |
| 126 | radon_risk | Radon Risk | text | No | - |
| 127 | superfund_site_nearby | Superfund Site Nearby | text | No | - |
| 128 | sea_level_rise_risk | Sea Level Rise Risk | text | No | - |
| 129 | noise_level_db_est | Noise Level (dB Est) | text | No | - |
| 130 | solar_potential | Solar Potential | text | No | - |

**Chart Ideas:**
- Environmental risk radar (flood/fire/earthquake/hurricane/tornado)
- Air quality comparison
- Climate risk composite score
- Natural disaster risk heatmap
- Overall environmental score
- Solar potential comparison

---

## SECTION 16: ADDITIONAL FEATURES
**Fields:** 131-138 (8 fields)
**Chart Numbers:** 16-1 to 16-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 131 | view_type | View Type | text | No | - |
| 132 | lot_features | Lot Features | text | No | - |
| 133 | ev_charging | EV Charging | text | No | - |
| 134 | smart_home_features | Smart Home Features | text | No | - |
| 135 | accessibility_modifications | Accessibility Modifications | text | No | - |
| 136 | pet_policy | Pet Policy | text | No | - |
| 137 | age_restrictions | Age Restrictions | text | No | - |
| 138 | special_assessments | Special Assessments | text | No | - |

**Chart Ideas:**
- View type comparison
- Smart home features score
- EV charging availability
- Accessibility features
- Special features composite score

---

## SECTION 17: STELLAR MLS - PARKING & GARAGE
**Fields:** 139-143 (5 fields)
**Chart Numbers:** 17-1 to 17-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 139 | carport_yn | Carport Y/N | boolean | No | - |
| 140 | carport_spaces | Carport Spaces | number | No | - |
| 141 | garage_attached_yn | Garage Attached Y/N | boolean | No | - |
| 142 | parking_features | Parking Features | multiselect | No | Assigned Parking, Covered Parking, Ground Level, Guest Parking, Garage Door Opener, Circular Driveway, Driveway, On Street, Off Street |
| 143 | assigned_parking_spaces | Assigned Parking Spaces | number | No | - |

**Chart Ideas:**
- Total parking capacity (garage + carport + assigned)
- Parking features comparison
- Covered vs uncovered parking
- Parking convenience score

---

## SECTION 18: STELLAR MLS - BUILDING INFO
**Fields:** 144-148 (5 fields)
**Chart Numbers:** 18-1 to 18-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 144 | floor_number | Floor Number | number | No | - |
| 145 | building_total_floors | Building Total Floors | number | No | - |
| 146 | building_name_number | Building Name/Number | text | No | - |
| 147 | building_elevator_yn | Building Elevator Y/N | boolean | No | - |
| 148 | floors_in_unit | Floors in Unit | number | No | - |

**Chart Ideas:**
- Floor level comparison
- Elevator availability
- Building size comparison
- Unit floor count
- Building amenities score

---

## SECTION 19: STELLAR MLS - LEGAL & TAX
**Fields:** 149-154 (6 fields)
**Chart Numbers:** 19-1 to 19-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 149 | subdivision_name | Subdivision Name | text | No | - |
| 150 | legal_description | Legal Description | text | No | - |
| 151 | homestead_yn | Homestead Exemption | boolean | No | - |
| 152 | cdd_yn | CDD Y/N | boolean | No | - |
| 153 | annual_cdd_fee | Annual CDD Fee | currency | No | - |
| 154 | front_exposure | Front Exposure | select | No | North, South, East, West, Northeast, Northwest, Southeast, Southwest |

**Chart Ideas:**
- Homestead exemption comparison
- CDD fee analysis
- Front exposure comparison
- Total special fees (CDD + special assessments)
- Sun exposure quality (south-facing preferred)

---

## SECTION 20: STELLAR MLS - WATERFRONT
**Fields:** 155-159 (5 fields)
**Chart Numbers:** 20-1 to 20-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 155 | water_frontage_yn | Water Frontage Y/N | boolean | No | - |
| 156 | waterfront_feet | Waterfront Feet | number | No | - |
| 157 | water_access_yn | Water Access Y/N | boolean | No | - |
| 158 | water_view_yn | Water View Y/N | boolean | No | - |
| 159 | water_body_name | Water Body Name | text | No | - |

**Chart Ideas:**
- Waterfront presence comparison
- Waterfront footage comparison
- Water amenities score (frontage + access + view)
- Water body type comparison

---

## SECTION 21: STELLAR MLS - LEASING & PETS
**Fields:** 160-165 (6 fields)
**Chart Numbers:** 21-1 to 21-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 160 | can_be_leased_yn | Can Be Leased Y/N | boolean | No | - |
| 161 | minimum_lease_period | Minimum Lease Period | text | No | - |
| 162 | lease_restrictions_yn | Lease Restrictions Y/N | boolean | No | - |
| 163 | pet_size_limit | Pet Size Limit | text | No | - |
| 164 | max_pet_weight | Max Pet Weight (lbs) | number | No | - |
| 165 | association_approval_yn | Association Approval Req | boolean | No | - |

**Chart Ideas:**
- Leasing flexibility comparison
- Pet policy comparison
- Rental investment suitability score
- Restrictions analysis

---

## SECTION 22: STELLAR MLS - FEATURES & FLOOD
**Fields:** 166-168 (3 fields)
**Chart Numbers:** 22-1 to 22-X

| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| 166 | community_features | Community Features | multiselect | No | Pool, Clubhouse, Tennis Courts, Golf, Fitness Center, Gated, Sidewalks, Playground, Dog Park, Marina, Beach Access |
| 167 | interior_features | Interior Features | multiselect | No | Cathedral Ceiling(s), Walk-In Closet(s), Primary Bedroom Main Floor, Open Floor Plan, Crown Molding, Skylight(s), Wet Bar, Built-in Features |
| 168 | exterior_features | Exterior Features | multiselect | No | Balcony, Outdoor Shower, Sidewalk, Sliding Doors, Hurricane Shutters, Sprinkler System, Outdoor Kitchen, Private Dock |

**Chart Ideas:**
- Community amenities count (bar chart)
- Interior features count
- Exterior features count
- Total premium features score
- Feature categories comparison (community vs interior vs exterior)

---

# USAGE INSTRUCTIONS FOR AI MODELS

When generating charts for a section, use this document to:

1. **Identify exact field names and types** - Use the `key` column for property names
2. **Understand data types** - Know if field is number, text, boolean, currency, etc.
3. **See available options** - For select/multiselect fields, use only the listed options
4. **Plan scoring logic** - Numbers can use scoreHigherIsBetter/scoreLowerIsBetter
5. **Design appropriate charts** - Match chart types to data types
6. **Create realistic sample data** - Use appropriate ranges and values

## Example Usage:

**For Section 4 (HOA & Taxes):**
- Field 30 (hoa_yn) is boolean → Use for filtering or comparison
- Field 31 (hoa_fee_annual) is currency → Use scoreLowerIsBetter (lower fees = better)
- Field 35 (annual_taxes) is currency → Use scoreLowerIsBetter (lower taxes = better)
- Field 37 (property_tax_rate) is percentage → Use scoreLowerIsBetter (lower rate = better)
- Field 34 (ownership_type) is select → Use for distribution/categorization

**Sample Data Structure:**
```typescript
interface Home {
  id: string;
  name: string;
  hoaYn: boolean;              // Field 30
  hoaFeeAnnual: number;        // Field 31
  hoaName: string;             // Field 32
  hoaIncludes: string;         // Field 33
  ownershipType: string;       // Field 34 - use one of: Fee Simple, Leasehold, Condo, Co-op
  annualTaxes: number;         // Field 35
  taxYear: number;             // Field 36
  propertyTaxRate: number;     // Field 37 (store as decimal, e.g., 1.8 for 1.8%)
  taxExemptions: string;       // Field 38
  color: string;               // Property color
}
```

---

**END OF SCHEMA FIELDS BY SECTION**

**Version:** 1.0
**Last Updated:** 2025-12-09
**Source File:** src/types/fields-schema.ts
