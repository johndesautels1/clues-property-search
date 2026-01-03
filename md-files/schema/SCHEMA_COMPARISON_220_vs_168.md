# Schema Comparison: New 220-Field Schema vs Current 168-Field Schema

## Summary
- Current schema: 168 fields (1-168)
- New schema proposes: 220 fields
- **Truly new fields: ~52**
- Many are duplicates with different names

---

## CATEGORY 1: ADDRESS & IDENTITY

### Current (1-9)
| # | Our Key | Our Label |
|---|---------|-----------|
| 1 | full_address | Full Address |
| 2 | mls_primary | MLS Primary |
| 3 | mls_secondary | MLS Secondary |
| 4 | listing_status | Listing Status |
| 5 | listing_date | Listing Date |
| 6 | neighborhood | Neighborhood |
| 7 | county | County |
| 8 | zip_code | ZIP Code |
| 9 | parcel_id | Parcel ID |

### New Schema (10 fields)
| New ID | New Label | MATCH? | Our Field # |
|--------|-----------|--------|-------------|
| address | Address | DUPLICATE | 1 |
| city | City | **NEW** | - |
| zipCode | Zip Code | DUPLICATE | 8 |
| subdivision | Subdivision | **NEW** | - |
| neighborhoodName | Neighborhood | DUPLICATE | 6 |
| propertyType | Property Type | DUPLICATE | 26 (moved) |
| mlsNumber | MLS Number | DUPLICATE | 2 |
| mlsStatus | MLS Status | DUPLICATE | 4 |
| county | County | DUPLICATE | 7 |
| parcelNumber | Parcel Number | DUPLICATE | 9 |

### NEW FIELDS TO ADD:
| Proposed # | Key | Label | Display After |
|------------|-----|-------|---------------|
| 169 | city | City | 1 |
| 170 | subdivision | Subdivision | 6 |

---

## CATEGORY 2: PRICING & VALUE

### Current (10-16)
| # | Our Key | Our Label |
|---|---------|-----------|
| 10 | listing_price | Listing Price |
| 11 | price_per_sqft | Price Per Sq Ft |
| 12 | market_value_estimate | Market Value Estimate |
| 13 | last_sale_date | Last Sale Date |
| 14 | last_sale_price | Last Sale Price |
| 15 | assessed_value | Assessed Value |
| 16 | redfin_estimate | Redfin Estimate |

### New Schema (14 fields)
| New ID | New Label | MATCH? | Our Field # |
|--------|-----------|--------|-------------|
| listPrice | List Price | DUPLICATE | 10 |
| pricePerSqft | Price/Sq Ft | DUPLICATE | 11 |
| zestimate | Zestimate | **NEW** | - |
| redfinEstimate | Redfin Estimate | DUPLICATE | 16 |
| quantariumAvm | Quantarium AVM | **NEW** | - |
| firstAmericanAvm | First American AVM | **NEW** | - |
| iceAvm | ICE AVM | **NEW** | - |
| collateralAnalyticsAvm | Collateral Analytics | **NEW** | - |
| averageAvm | Average AVM | **NEW** (calc) | - |
| avmVsListPrice | AVM vs List % | **NEW** (calc) | - |
| originalListPrice | Original List | **NEW** | - |
| priceChangeAmount | Price Change $ | **NEW** (calc) | - |
| priceChangePercent | Price Change % | **NEW** (calc) | - |
| numberOfPriceChanges | # Price Changes | **NEW** | - |

### NEW FIELDS TO ADD:
| Proposed # | Key | Label | Display After | Calculated? |
|------------|-----|-------|---------------|-------------|
| 171 | zestimate | Zestimate | 12 | No |
| 172 | quantarium_avm | Quantarium AVM | 171 | No |
| 173 | first_american_avm | First American AVM | 172 | No |
| 174 | ice_avm | ICE AVM | 173 | No |
| 175 | collateral_analytics_avm | Collateral Analytics AVM | 174 | No |
| 176 | average_avm | Average AVM | 175 | YES |
| 177 | avm_vs_list_percent | AVM vs List % | 176 | YES |
| 178 | original_list_price | Original List Price | 10 | No |
| 179 | price_change_amount | Price Change $ | 178 | YES |
| 180 | price_change_percent | Price Change % | 179 | YES |
| 181 | num_price_changes | # Price Changes | 180 | No |

---

## CATEGORY 3: PROPERTY BASICS

### Current (17-29)
| # | Our Key | Our Label |
|---|---------|-----------|
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

### New Schema Analysis
| New ID | MATCH? | Our Field # |
|--------|--------|-------------|
| bedrooms | DUPLICATE | 17 |
| bathroomsFull | DUPLICATE | 18 |
| bathroomsHalf | DUPLICATE | 19 |
| livingAreaSqft | DUPLICATE | 21 |
| lotSizeSqft | DUPLICATE | 23 |
| lotSizeAcres | DUPLICATE | 24 |
| buildingAreaSqft | DUPLICATE | 22 |
| yearBuilt | DUPLICATE | 25 |
| yearRenovated | **NEW** | - |
| stories | DUPLICATE | 27 |
| daysOnMarket | **NEW** | - |
| cumulativeDaysOnMarket | **NEW** | - |

### NEW FIELDS TO ADD:
| Proposed # | Key | Label | Display After |
|------------|-----|-------|---------------|
| 182 | year_renovated | Year Renovated | 25 |
| 183 | days_on_market | Days on Market | 5 |
| 184 | cumulative_dom | Cumulative Days on Market | 183 |

---

## CATEGORY 4: HOA & TAXES

### Current (30-38)
| # | Our Key | Our Label |
|---|---------|-----------|
| 30 | hoa_yn | HOA |
| 31 | hoa_fee_annual | HOA Fee (Annual) |
| 32 | hoa_name | HOA Name |
| 33 | hoa_includes | HOA Includes |
| 34 | ownership_type | Ownership Type |
| 35 | annual_taxes | Annual Taxes |
| 36 | tax_year | Tax Year |
| 37 | property_tax_rate | Property Tax Rate |
| 38 | tax_exemptions | Tax Exemptions |

### New Schema - NEW FIELDS:
| New ID | Label | Notes |
|--------|-------|-------|
| cddFee | CDD Fee | FL-specific |
| specialAssessments | Special Assessments | |
| taxAssessmentLand | Land Assessment | |
| taxAssessmentImprovement | Improvement Assessment | |
| homesteadExemption | Homestead Exemption | boolean |
| tax2025 | 2025 Tax | |
| tax2024 | 2024 Tax | |
| tax2023 | 2023 Tax | |
| tax2022 | 2022 Tax | |
| taxYoyChange | Tax YoY % | calc |
| fiveYearTaxTrend | 5-Year Tax Trend | calc |
| taxAsPercentOfValue | Tax % of Value | calc |
| hoaRestrictions | HOA Restrictions | |

### NEW FIELDS TO ADD:
| Proposed # | Key | Label | Display After | Calculated? |
|------------|-----|-------|---------------|-------------|
| 185 | cdd_fee | CDD Fee | 31 | No |
| 186 | special_assessments | Special Assessments | 185 | No |
| 187 | tax_assessment_land | Tax Assessment (Land) | 15 | No |
| 188 | tax_assessment_improvement | Tax Assessment (Improvement) | 187 | No |
| 189 | homestead_exemption | Homestead Exemption | 38 | No |
| 190 | tax_2025 | 2025 Tax | 35 | No |
| 191 | tax_2024 | 2024 Tax | 190 | No |
| 192 | tax_2023 | 2023 Tax | 191 | No |
| 193 | tax_2022 | 2022 Tax | 192 | No |
| 194 | tax_yoy_change | Tax YoY Change % | 193 | YES |
| 195 | five_year_tax_trend | 5-Year Tax Trend | 194 | YES |
| 196 | tax_as_percent_of_value | Tax as % of Value | 195 | YES |
| 197 | hoa_restrictions | HOA Restrictions | 33 | No |

---

## CATEGORY 5: STRUCTURE & SYSTEMS

### Current (39-48) - Mostly covered
### NEW FIELDS:
| Proposed # | Key | Label | Display After |
|------------|-----|-------|---------------|
| 198 | impact_windows | Impact Windows | 41 |
| 199 | hurricane_shutters | Hurricane Shutters | 198 |
| 200 | electrical_panel | Electrical Panel | 45 |
| 201 | plumbing_type | Plumbing Type | 200 |
| 202 | construction_quality | Construction Quality | 41 |
| 203 | window_type | Window Type | 198 |

---

## CATEGORY 6: INTERIOR FEATURES

### Current (49-53) - Mostly covered
### NEW FIELDS:
| Proposed # | Key | Label | Display After |
|------------|-----|-------|---------------|
| 204 | primary_bedroom_location | Primary BR Location | 49 |
| 205 | walk_in_closet | Walk-in Closet | 204 |
| 206 | pantry | Pantry | 50 |
| 207 | cathedral_ceiling | Cathedral Ceiling | 206 |
| 208 | ceiling_fans | Ceiling Fans | 207 |
| 209 | smart_home_features | Smart Home Features | 51 |

---

## CATEGORY 7: EXTERIOR FEATURES

### Current (54-58) - Mostly covered
### NEW FIELDS:
| Proposed # | Key | Label | Display After |
|------------|-----|-------|---------------|
| 210 | screened_area | Screened Area | 56 |
| 211 | outdoor_kitchen | Outdoor Kitchen | 210 |
| 212 | sprinkler_system | Sprinkler System | 58 |
| 213 | direction_faces | Direction Faces | 212 |

---

## MARKET & INVESTMENT - NEW FIELDS

| Proposed # | Key | Label | Display After | Calculated? |
|------------|-----|-------|---------------|-------------|
| 214 | views_zillow | Zillow Views | 103 | No |
| 215 | views_redfin | Redfin Views | 214 | No |
| 216 | views_homes | Homes.com Views | 215 | No |
| 217 | views_realtor | Realtor.com Views | 216 | No |
| 218 | total_views | Total Views | 217 | YES |
| 219 | saves_favorites | Saves/Favorites | 218 | No |
| 220 | market_type | Market Type | 95 | No |
| 221 | avg_sale_to_list_percent | Avg Sale/List % | 220 | No |
| 222 | avg_days_to_pending | Avg Days to Pending | 221 | No |
| 223 | multiple_offers_likelihood | Multiple Offers | 222 | No |
| 224 | last_sale_price_per_sqft | Last Sale $/Sqft | 14 | YES |
| 225 | appreciation_since_last_sale | Appreciation $ | 224 | YES |
| 226 | appreciation_percent | Appreciation % | 225 | YES |
| 227 | years_since_last_sale | Years Since Sale | 226 | YES |
| 228 | price_trend | Price Trend | 227 | No |
| 229 | rent_zestimate | Rent Zestimate | 98 | No |

---

## ENVIRONMENT & RISK - NEW FIELDS

| Proposed # | Key | Label | Display After | Source |
|------------|-----|-------|---------------|--------|
| 230 | flood_factor | Flood Factor (1-10) | 117 | FirstStreet |
| 231 | fire_factor | Fire Factor (1-10) | 230 | FirstStreet |
| 232 | heat_factor | Heat Factor (1-10) | 231 | FirstStreet |
| 233 | wind_factor | Wind Factor (1-10) | 232 | FirstStreet |
| 234 | air_quality_factor | Air Quality (1-10) | 233 | FirstStreet |
| 235 | hurricane_damage_history | Hurricane History | 234 | Web Search |
| 236 | sinkhole_risk | Sinkhole Risk | 235 | Web Search |

---

## UTILITIES & CONNECTIVITY - NEW FIELDS

| Proposed # | Key | Label | Display After | Source |
|------------|-----|-------|---------------|--------|
| 237 | monthly_electric_estimate | Monthly Electric Est | 105 | Redfin |
| 238 | solar_savings_potential | Solar Savings | 237 | Redfin |
| 239 | sun_exposure_june | Sun Exposure (June hrs) | 238 | Redfin |
| 240 | internet_providers_count | # Internet Providers | 111 | FCC* |
| 241 | max_internet_speed_mbps | Max Internet Speed | 240 | FCC* |
| 242 | est_total_monthly_utilities | Total Monthly Utils | 107 | CALC |

*FCC Attribution Required - See FCC_ATTRIBUTION_REQUIREMENTS.md

---

## COMMUNITY & FEATURES - NEW FIELDS (Trulia)

| Proposed # | Key | Label | Display After | Source |
|------------|-----|-------|---------------|--------|
| 243 | safe_walk_alone_night | Safe Walk Alone Night % | 90 | Trulia |
| 244 | police_response_time | Police Response Time | 243 | Web Search |
| 245 | dog_friendly_percent | Dog Friendly % | 166 | Trulia |
| 246 | walkable_restaurants_percent | Walkable Restaurants % | 245 | Trulia |
| 247 | well_lit_streets_percent | Well-Lit Streets % | 246 | Trulia |
| 248 | quiet_percent | Quiet % | 247 | Trulia |
| 249 | sidewalks_percent | Sidewalks % | 248 | Trulia |

---

## WATERFRONT - NEW FIELDS

| Proposed # | Key | Label | Display After |
|------------|-----|-------|---------------|
| 250 | seawall | Seawall | 159 |
| 251 | boat_lift | Boat Lift | 250 |
| 252 | gulf_access | Gulf Access | 251 |

---

## BUILDING INFO (Condos) - NEW FIELDS

| Proposed # | Key | Label | Display After |
|------------|-----|-------|---------------|
| 253 | building_name | Building Name | 144 |
| 254 | total_units_in_building | Total Units | 253 |
| 255 | building_amenities | Building Amenities | 254 |

---

## LEASING & PETS - Enhancements

| Proposed # | Key | Label | Display After |
|------------|-----|-------|---------------|
| 256 | min_lease_length | Min Lease Length | 161 |
| 257 | max_leases_per_year | Max Leases/Year | 256 |

---

## SUMMARY: NEW FIELDS TO ADD

| Range | Count | Category |
|-------|-------|----------|
| 169-170 | 2 | Address (city, subdivision) |
| 171-181 | 11 | Pricing/AVMs |
| 182-184 | 3 | Property Basics (year renovated, DOM) |
| 185-197 | 13 | HOA & Taxes |
| 198-203 | 6 | Structure & Systems |
| 204-209 | 6 | Interior Features |
| 210-213 | 4 | Exterior Features |
| 214-229 | 16 | Market & Investment |
| 230-236 | 7 | Environment & Risk |
| 237-242 | 6 | Utilities |
| 243-249 | 7 | Community/Safety |
| 250-257 | 8 | Waterfront/Building/Leasing |

**TOTAL NEW FIELDS: 89 (Fields 169-257)**

---

## CALCULATED FIELDS (Need Formulas)

| # | Key | Formula |
|---|-----|---------|
| 176 | average_avm | (171+172+173+174+175+16) / count_non_null |
| 177 | avm_vs_list_percent | ((176 - 10) / 10) * 100 |
| 179 | price_change_amount | 10 - 178 |
| 180 | price_change_percent | ((10 - 178) / 178) * 100 |
| 194 | tax_yoy_change | ((191 - 192) / 192) * 100 |
| 195 | five_year_tax_trend | regression_slope(190,191,192,193,tax_2021) |
| 196 | tax_as_percent_of_value | (35 / 10) * 100 |
| 218 | total_views | 214 + 215 + 216 + 217 |
| 224 | last_sale_price_per_sqft | 14 / 21 |
| 225 | appreciation_since_last_sale | 10 - 14 |
| 226 | appreciation_percent | ((10 - 14) / 14) * 100 |
| 227 | years_since_last_sale | current_year - year(13) |
| 242 | est_total_monthly_utilities | 237 * 1.5 |

---

*Document created: 2026-01-03*
*For implementation discussion - NOT final*
