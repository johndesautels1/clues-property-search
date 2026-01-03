# CLUES Property Dashboard - Complete 110-Field Reference

**IMPORTANT: When providing property data via CSV or API, ALWAYS use the exact API Key format shown below.**

---

## Field Format Requirements

When uploading CSV data or providing property information, use this exact format:

```
API Key: {number}_{snake_case_name}
Example: 7_listing_price
```

Each field should have a value. Use `null` or leave empty for unknown values.

---

## Complete Field List (110 Fields)

### GROUP A: Address & Identity (Fields 1-6)

| # | API Key | CSV Header | Label | Type | Example Value |
|---|---------|------------|-------|------|---------------|
| 1 | `1_full_address` | Full Address | Full Address | string | "280 41st Ave, St Pete Beach, FL 33706" |
| 2 | `2_mls_primary` | MLS Primary | MLS # (Primary) | string | "TB8437491" |
| 3 | `3_mls_secondary` | MLS Secondary | MLS # (Secondary) | string | "" |
| 4 | `4_listing_status` | Listing Status | Listing Status | string | "Active" / "Pending" / "Sold" / "Off-Market" |
| 5 | `5_listing_date` | Listing Date | Listing Date | date | "2024-01-15" |
| 6 | `6_parcel_id` | Parcel ID | Parcel ID | string | "31-31-16-00000-230-0200" |

### GROUP B: Pricing (Fields 7-11)

| # | API Key | CSV Header | Label | Type | Example Value |
|---|---------|------------|-------|------|---------------|
| 7 | `7_listing_price` | Listing Price | Listing Price | number | 549000 |
| 8 | `8_price_per_sqft` | Price Per SqFt | Price per Sq Ft | number | 385 |
| 9 | `9_market_value_estimate` | Market Value Estimate | Market Value Estimate | number | 525000 |
| 10 | `10_last_sale_date` | Last Sale Date | Last Sale Date | date | "2019-06-15" |
| 11 | `11_last_sale_price` | Last Sale Price | Last Sale Price | number | 375000 |

### GROUP C: Property Basics (Fields 12-24)

| # | API Key | CSV Header | Label | Type | Example Value |
|---|---------|------------|-------|------|---------------|
| 12 | `12_bedrooms` | Bedrooms | Bedrooms | number | 3 |
| 13 | `13_full_bathrooms` | Full Bathrooms | Full Bathrooms | number | 2 |
| 14 | `14_half_bathrooms` | Half Bathrooms | Half Bathrooms | number | 0 |
| 15 | `15_total_bathrooms` | Total Bathrooms | Total Bathrooms | number | 2.0 |
| 16 | `16_living_sqft` | Living SqFt | Living Sq Ft | number | 1426 |
| 17 | `17_total_sqft_under_roof` | Total SqFt Under Roof | Total Sq Ft Under Roof | number | 1650 |
| 18 | `18_lot_size_sqft` | Lot Size SqFt | Lot Size (Sq Ft) | number | 7200 |
| 19 | `19_lot_size_acres` | Lot Size Acres | Lot Size (Acres) | number | 0.165 |
| 20 | `20_year_built` | Year Built | Year Built | number | 1958 |
| 21 | `21_property_type` | Property Type | Property Type | string | "Single Family" / "Condo" / "Townhouse" |
| 22 | `22_stories` | Stories | Stories | number | 1 |
| 23 | `23_garage_spaces` | Garage Spaces | Garage Spaces | number | 2 |
| 24 | `24_parking_total` | Parking Total | Parking Description | string | "2 car garage + driveway" |

### GROUP D: HOA & Ownership (Fields 25-28)

| # | API Key | CSV Header | Label | Type | Example Value |
|---|---------|------------|-------|------|---------------|
| 25 | `25_hoa_yn` | HOA Y/N | HOA? | boolean | true / false |
| 26 | `26_hoa_fee_annual` | HOA Fee Annual | HOA Fee (Annual) | number | 1200 |
| 27 | `27_ownership_type` | Ownership Type | Ownership Type | string | "Fee Simple" / "Leasehold" |
| 28 | `28_county` | County | County | string | "Pinellas" |

### GROUP E: Taxes & Assessments (Fields 29-35)

| # | API Key | CSV Header | Label | Type | Example Value |
|---|---------|------------|-------|------|---------------|
| 29 | `29_annual_taxes` | Annual Taxes | Annual Property Taxes | number | 5832 |
| 30 | `30_tax_year` | Tax Year | Tax Year | number | 2024 |
| 31 | `31_assessed_value` | Assessed Value | Assessed Value | number | 420000 |
| 32 | `32_tax_exemptions` | Tax Exemptions | Tax Exemptions | string | "Homestead exemption" |
| 33 | `33_property_tax_rate` | Property Tax Rate | Property Tax Rate | number | 1.39 |
| 34 | `34_recent_tax_history` | Recent Tax History | Recent Tax History | string | "Increased 3% from 2023" |
| 35 | `35_special_assessments` | Special Assessments | Special Assessments | string | "None" |

### GROUP F: Structure & Systems (Fields 36-41)

| # | API Key | CSV Header | Label | Type | Example Value |
|---|---------|------------|-------|------|---------------|
| 36 | `36_roof_type` | Roof Type | Roof Type | string | "Shingle" / "Tile" / "Metal" |
| 37 | `37_roof_age_est` | Roof Age Est | Roof Age (Est.) | string | "~10 years (2014 permit)" |
| 38 | `38_exterior_material` | Exterior Material | Exterior Material | string | "Block/Stucco" |
| 39 | `39_foundation` | Foundation | Foundation | string | "Slab" / "Crawl Space" |
| 40 | `40_hvac_type` | HVAC Type | HVAC Type | string | "Central Air/Heat" |
| 41 | `41_hvac_age` | HVAC Age | HVAC Age (Est.) | string | "~8 years" |

### GROUP G: Interior Features (Fields 42-46)

| # | API Key | CSV Header | Label | Type | Example Value |
|---|---------|------------|-------|------|---------------|
| 42 | `42_flooring_type` | Flooring Type | Flooring Type | string | "Tile, Laminate, Carpet" |
| 43 | `43_kitchen_features` | Kitchen Features | Kitchen Features | string | "Granite counters, SS appliances" |
| 44 | `44_appliances_included` | Appliances Included | Appliances Included | array | ["Refrigerator", "Dishwasher", "Range"] |
| 45 | `45_fireplace_yn` | Fireplace Y/N | Fireplace? | boolean | false |
| 46 | `46_interior_condition` | Interior Condition | Interior Condition | string | "Good" / "Excellent" / "Fair" |

### GROUP H: Exterior Features (Fields 47-51)

| # | API Key | CSV Header | Label | Type | Example Value |
|---|---------|------------|-------|------|---------------|
| 47 | `47_pool_yn` | Pool Y/N | Pool? | boolean | true |
| 48 | `48_pool_type` | Pool Type | Pool Type | string | "In-ground" / "Above-ground" |
| 49 | `49_deck_patio` | Deck Patio | Deck/Patio | string | "Screened lanai" |
| 50 | `50_fence` | Fence | Fence | string | "Privacy fence" |
| 51 | `51_landscaping` | Landscaping | Landscaping | string | "Mature tropical landscaping" |

### GROUP I: Permits & Renovations (Fields 52-55)

| # | API Key | CSV Header | Label | Type | Example Value |
|---|---------|------------|-------|------|---------------|
| 52 | `52_recent_renovations` | Recent Renovations | Recent Renovations | string | "Kitchen remodel 2022" |
| 53 | `53_permit_history_roof` | Permit History Roof | Permit History - Roof | string | "Roof permit 2014" |
| 54 | `54_permit_history_hvac` | Permit History HVAC | Permit History - HVAC | string | "HVAC permit 2016" |
| 55 | `55_permit_history_other` | Permit History Other | Permit History - Other | string | "Electrical 2018, Plumbing 2020" |

### GROUP J: Schools (Fields 56-64)

| # | API Key | CSV Header | Label | Type | Example Value |
|---|---------|------------|-------|------|---------------|
| 56 | `56_assigned_elementary` | Assigned Elementary | Assigned Elementary | string | "Azalea Elementary" |
| 57 | `57_elementary_rating` | Elementary Rating | Elementary Rating | string | "8/10" |
| 58 | `58_elementary_distance_miles` | Elementary Distance Miles | Elementary Distance (mi) | number | 0.8 |
| 59 | `59_assigned_middle` | Assigned Middle | Assigned Middle | string | "Azalea Middle" |
| 60 | `60_middle_rating` | Middle Rating | Middle Rating | string | "7/10" |
| 61 | `61_middle_distance_miles` | Middle Distance Miles | Middle Distance (mi) | number | 1.2 |
| 62 | `62_assigned_high` | Assigned High | Assigned High | string | "St Pete High School" |
| 63 | `63_high_rating` | High Rating | High Rating | string | "9/10" |
| 64 | `64_high_distance_miles` | High Distance Miles | High Distance (mi) | number | 2.5 |

### GROUP K: Location Scores (Fields 65-72)

| # | API Key | CSV Header | Label | Type | Example Value |
|---|---------|------------|-------|------|---------------|
| 65 | `65_walk_score` | Walk Score | Walk Score | string | "72" |
| 66 | `66_transit_score` | Transit Score | Transit Score | string | "35" |
| 67 | `67_bike_score` | Bike Score | Bike Score | string | "65" |
| 68 | `68_noise_level` | Noise Level | Noise Level | string | "Moderate" |
| 69 | `69_traffic_level` | Traffic Level | Traffic Level | string | "Low" |
| 70 | `70_walkability_description` | Walkability Description | Walkability Description | string | "Somewhat Walkable" |
| 71 | `71_commute_time_city_center` | Commute Time City Center | Commute to City Center | string | "~25 min to Tampa" |
| 72 | `72_public_transit_access` | Public Transit Access | Public Transit Access | string | "Bus stop 0.3 miles" |

### GROUP L: Distances & Amenities (Fields 73-77)

| # | API Key | CSV Header | Label | Type | Example Value |
|---|---------|------------|-------|------|---------------|
| 73 | `73_distance_grocery_miles` | Distance Grocery Miles | Distance to Grocery (mi) | number | 0.5 |
| 74 | `74_distance_hospital_miles` | Distance Hospital Miles | Distance to Hospital (mi) | number | 3.2 |
| 75 | `75_distance_airport_miles` | Distance Airport Miles | Distance to Airport (mi) | number | 12.5 |
| 76 | `76_distance_park_miles` | Distance Park Miles | Distance to Park (mi) | number | 0.2 |
| 77 | `77_distance_beach_miles` | Distance Beach Miles | Distance to Beach (mi) | number | 0.1 |

### GROUP M: Safety & Crime (Fields 78-80)

| # | API Key | CSV Header | Label | Type | Example Value |
|---|---------|------------|-------|------|---------------|
| 78 | `78_crime_index_violent` | Crime Index Violent | Violent Crime Index | string | "Low (12)" |
| 79 | `79_crime_index_property` | Crime Index Property | Property Crime Index | string | "Moderate (45)" |
| 80 | `80_neighborhood_safety_rating` | Neighborhood Safety Rating | Neighborhood Safety Rating | string | "A-" |

### GROUP N: Market & Investment (Fields 81-91)

| # | API Key | CSV Header | Label | Type | Example Value |
|---|---------|------------|-------|------|---------------|
| 81 | `81_median_home_price_neighborhood` | Median Home Price Neighborhood | Median Home Price (Area) | number | 485000 |
| 82 | `82_price_per_sqft_recent_avg` | Price Per SqFt Recent Avg | Avg $/SqFt (Recent Sales) | number | 375 |
| 83 | `83_days_on_market_avg` | Days On Market Avg | Avg Days on Market (Area) | number | 45 |
| 84 | `84_inventory_surplus` | Inventory Surplus | Inventory Surplus | string | "Balanced" |
| 85 | `85_rental_estimate_monthly` | Rental Estimate Monthly | Rental Estimate (Monthly) | number | 2800 |
| 86 | `86_rental_yield_est` | Rental Yield Est | Rental Yield Est. (%) | number | 6.1 |
| 87 | `87_vacancy_rate_neighborhood` | Vacancy Rate Neighborhood | Vacancy Rate (Area %) | number | 4.2 |
| 88 | `88_cap_rate_est` | Cap Rate Est | Cap Rate Est. (%) | number | 5.5 |
| 89 | `89_insurance_est_annual` | Insurance Est Annual | Insurance Est. (Annual) | number | 3500 |
| 90 | `90_financing_terms` | Financing Terms | Financing Terms | string | "Conventional, FHA eligible" |
| 91 | `91_comparable_sales` | Comparable Sales | Comparable Sales | string | "123 Beach Ave sold $540k, 456 Gulf Blvd sold $560k" |

### GROUP O: Utilities (Fields 92-98)

| # | API Key | CSV Header | Label | Type | Example Value |
|---|---------|------------|-------|------|---------------|
| 92 | `92_electric_provider` | Electric Provider | Electric Provider | string | "Duke Energy" |
| 93 | `93_water_provider` | Water Provider | Water Provider | string | "City of St Pete Beach" |
| 94 | `94_sewer_provider` | Sewer Provider | Sewer Provider | string | "City of St Pete Beach" |
| 95 | `95_natural_gas` | Natural Gas | Natural Gas | string | "Not Available" |
| 96 | `96_internet_providers_top3` | Internet Providers Top 3 | Internet Providers | array | ["Spectrum", "AT&T", "T-Mobile Home"] |
| 97 | `97_max_internet_speed` | Max Internet Speed | Max Internet Speed | string | "1 Gbps fiber" |
| 98 | `98_cable_tv_provider` | Cable TV Provider | Cable TV Provider | string | "Spectrum" |

### GROUP P: Environment & Risk (Fields 99-104)

| # | API Key | CSV Header | Label | Type | Example Value |
|---|---------|------------|-------|------|---------------|
| 99 | `99_air_quality_index_current` | Air Quality Index Current | Air Quality Index | string | "42 (Good)" |
| 100 | `100_flood_zone` | Flood Zone | FEMA Flood Zone | string | "Zone AE" |
| 101 | `101_flood_risk_level` | Flood Risk Level | Flood Risk Level | string | "High" |
| 102 | `102_climate_risk_summary` | Climate Risk Summary | Climate Risk Summary | string | "Hurricane risk extreme, flood risk high" |
| 103 | `103_noise_level_db_est` | Noise Level dB Est | Noise Level (dB Est.) | string | "45 dB" |
| 104 | `104_solar_potential` | Solar Potential | Solar Potential | string | "Excellent" |

### GROUP Q: Additional Features (Fields 105-110)

| # | API Key | CSV Header | Label | Type | Example Value |
|---|---------|------------|-------|------|---------------|
| 105 | `105_ev_charging_yn` | EV Charging Y/N | EV Charging | string | "Not installed" |
| 106 | `106_smart_home_features` | Smart Home Features | Smart Home Features | string | "Nest thermostat, Ring doorbell" |
| 107 | `107_accessibility_mods` | Accessibility Mods | Accessibility Modifications | string | "None" |
| 108 | `108_pet_policy` | Pet Policy | Pet Policy | string | "Pets allowed" |
| 109 | `109_age_restrictions` | Age Restrictions | Age Restrictions | string | "None" |
| 110 | `110_notes_confidence_summary` | Notes Confidence Summary | Notes & Confidence Summary | string | "Data verified from MLS and county records" |

---

## CSV Example Format

```csv
1_full_address,7_listing_price,12_bedrooms,13_full_bathrooms,16_living_sqft,20_year_built,100_flood_zone,85_rental_estimate_monthly
"280 41st Ave, St Pete Beach, FL 33706",549000,3,2,1426,1958,"Zone AE",2800
"456 Beach Blvd, Clearwater, FL 33767",425000,2,2,1200,1985,"Zone X",2200
```

---

## JSON API Response Format

When the API returns data, it should follow this structure:

```json
{
  "fields": {
    "1_full_address": { "value": "280 41st Ave, St Pete Beach, FL 33706", "confidence": "High", "source": "MLS" },
    "7_listing_price": { "value": 549000, "confidence": "High", "source": "MLS" },
    "12_bedrooms": { "value": 3, "confidence": "High", "source": "MLS" },
    "100_flood_zone": { "value": "Zone AE", "confidence": "Medium", "source": "FEMA" }
  },
  "total_fields_found": 85,
  "completion_percentage": 77
}
```

---

## Questions for Each Field (Use when prompting LLM for data)

Copy these questions to ask an LLM to fill in property data:

```
For the property at [ADDRESS], please provide:

1. What is the full address including street, city, state, and ZIP?
2. What is the MLS listing number?
3. Is there a secondary MLS number?
4. What is the current listing status (Active/Pending/Sold)?
5. When was the property listed?
6. What is the parcel ID / APN number?
7. What is the listing price?
8. What is the price per square foot?
9. What is the estimated market value?
10. When was the property last sold?
11. What was the last sale price?
12. How many bedrooms?
13. How many full bathrooms?
14. How many half bathrooms?
15. What is the total bathroom count?
16. What is the living area square footage?
17. What is the total square footage under roof?
18. What is the lot size in square feet?
19. What is the lot size in acres?
20. What year was the property built?
21. What is the property type (Single Family/Condo/etc)?
22. How many stories?
23. How many garage spaces?
24. What is the parking situation?
25. Is there an HOA?
26. What is the annual HOA fee?
27. What is the ownership type?
28. What county is it in?
29. What are the annual property taxes?
30. What tax year is this for?
31. What is the assessed value?
32. Are there any tax exemptions?
33. What is the property tax rate?
34. What is the recent tax payment history?
35. Are there any special assessments?
36. What type of roof?
37. How old is the roof?
38. What is the exterior material?
39. What type of foundation?
40. What type of HVAC system?
41. How old is the HVAC?
42. What flooring types are in the home?
43. What kitchen features are there?
44. What appliances are included?
45. Is there a fireplace?
46. What is the interior condition?
47. Is there a pool?
48. What type of pool?
49. Is there a deck or patio?
50. Is there a fence?
51. What is the landscaping like?
52. Any recent renovations?
53. Any roof permits on record?
54. Any HVAC permits on record?
55. Any other permits on record?
56. What elementary school is assigned?
57. What is the elementary school rating?
58. How far is the elementary school?
59. What middle school is assigned?
60. What is the middle school rating?
61. How far is the middle school?
62. What high school is assigned?
63. What is the high school rating?
64. How far is the high school?
65. What is the Walk Score?
66. What is the Transit Score?
67. What is the Bike Score?
68. What is the noise level?
69. What is the traffic level?
70. Describe the walkability.
71. What is the commute time to the city center?
72. What public transit is nearby?
73. How far to the nearest grocery store?
74. How far to the nearest hospital?
75. How far to the airport?
76. How far to the nearest park?
77. How far to the beach?
78. What is the violent crime index?
79. What is the property crime index?
80. What is the neighborhood safety rating?
81. What is the median home price in the area?
82. What is the average price per sqft for recent sales?
83. What is the average days on market in the area?
84. Is there inventory surplus or shortage?
85. What is the estimated monthly rent?
86. What is the estimated rental yield?
87. What is the vacancy rate in the neighborhood?
88. What is the estimated cap rate?
89. What is the estimated annual insurance cost?
90. What financing terms are typical?
91. What are comparable recent sales?
92. Who is the electric provider?
93. Who is the water provider?
94. Who is the sewer provider?
95. Is natural gas available?
96. What internet providers service the area?
97. What is the max internet speed available?
98. Who is the cable TV provider?
99. What is the current air quality index?
100. What FEMA flood zone is the property in?
101. What is the flood risk level?
102. Summarize the climate risks.
103. What is the estimated noise level in decibels?
104. What is the solar potential?
105. Is there EV charging?
106. Any smart home features?
107. Any accessibility modifications?
108. What is the pet policy?
109. Are there age restrictions?
110. Any additional notes or confidence summary?
```

---

## Confidence Levels

- **High**: Verified from official sources (MLS, County Records, FEMA)
- **Medium**: From reliable third-party sources (Zillow, Redfin, WalkScore)
- **Low**: Estimated or AI-generated data
- **Unverified**: Not confirmed

---

*Last Updated: Generated by CLUES Property Dashboard*
