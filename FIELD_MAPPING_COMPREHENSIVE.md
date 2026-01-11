# 📊 COMPLETE 181-FIELD SOURCE MAPPING TABLE

**Purpose:** Master reference for all field mappings, data sources, and identified issues

**Last Updated:** 2026-01-08

**Legend:**
- 🟢 = Bridge-Stellar provides (should populate)
- 🟢 = Google/Free APIs provide (should populate)
- 🟡 = Perplexity/Tavily/LLMs provide (should populate)
- 🔴 ❌ = MISMATCH/ERROR identified
- 🧮 = Can be calculated from other fields
- 🔵 = Alternative source needed

---

## **GROUP 1: ADDRESS & IDENTITY (Fields 1-9)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 1 | `full_address` | 🟢 Bridge-Stellar | ✅ Working | Constructed from components |
| 2 | `mls_primary` | 🟢 Bridge-Stellar | ✅ Working | ListingId/ListingKey |
| 3 | `mls_secondary` | ❌ NO SOURCE | 🔵 REPURPOSE | **Candidate for NewConstructionYN** |
| 4 | `listing_status` | 🟢 Bridge-Stellar | ✅ Working | StandardStatus |
| 5 | `listing_date` | 🟢 Bridge-Stellar | ✅ Working | ListingContractDate |
| 6 | `neighborhood` | 🟢 Bridge-Stellar | ✅ Working | SubdivisionName |
| 7 | `county` | 🟢 Google Geocode | ✅ Working | From geocoding response |
| 8 | `zip_code` | 🟢 Bridge-Stellar | ✅ Working | PostalCode |
| 9 | `parcel_id` | 🟢 Bridge-Stellar | ✅ Working | ParcelNumber |

---

## **GROUP 2: PRICING & VALUE (Fields 10-16 + subfields)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 10 | `listing_price` | 🟢 Bridge-Stellar | ✅ Working | ListPrice |
| 11 | `price_per_sqft` | 🟢 Bridge-Stellar OR 🧮 Calculated | 🔴 ❌ **RENTAL BUG** | Uses ListPricePerSquareFoot OR calculates (broken for rentals) |
| 12 | `market_value_estimate` | 🟡 Perplexity/LLMs | ✅ LLM fill | Web search required |
| 13 | `last_sale_date` | 🟢 Bridge-Stellar | ✅ Working | CloseDate |
| 14 | `last_sale_price` | 🟢 Bridge-Stellar | ✅ Working | ClosePrice |
| 15 | `assessed_value` | 🟢 Bridge-Stellar | ✅ Working | TaxAssessedValue |
| 16 | `avms` (average) | 🧮 Calculated from 16a-16f | ✅ Calculated | Average of available AVMs |
| 16a | `zestimate` | 🟡 Tavily/Perplexity/LLMs | ⚠️ Add to prompts | NOT CURRENTLY REQUESTED |
| 16b | `redfin_estimate` | 🟡 Tavily/Perplexity/LLMs | ⚠️ Add to prompts | NOT CURRENTLY REQUESTED |
| 16c | `first_american_avm` | 🔵 First American API | ❌ Not wired | Requires paid API |
| 16d | `quantarium_avm` | 🔵 Quantarium API | ❌ Not wired | Requires paid API |
| 16e | `ice_avm` | 🔵 ICE API | ❌ Not wired | Requires paid API |
| 16f | `collateral_analytics_avm` | 🔵 Collateral Analytics API | ❌ Not wired | Requires paid API |

---

## **GROUP 3: PROPERTY BASICS (Fields 17-29)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 17 | `bedrooms` | 🟢 Bridge-Stellar | ✅ Working | BedroomsTotal |
| 18 | `full_bathrooms` | 🟢 Bridge-Stellar | ✅ Working | BathroomsFull |
| 19 | `half_bathrooms` | 🟢 Bridge-Stellar | ✅ Working | BathroomsHalf |
| 20 | `total_bathrooms` | 🟢 Bridge-Stellar | 🔴 ❌ **USES INTEGER** | Should use BathroomsTotalDecimal (more accurate) |
| 21 | `living_sqft` | 🟢 Bridge-Stellar | ✅ Working | LivingArea |
| 22 | `total_sqft_under_roof` | 🟢 Bridge-Stellar | ✅ Working | BuildingAreaTotal |
| 23 | `lot_size_sqft` | 🟢 Bridge-Stellar | ✅ Working | LotSizeSquareFeet |
| 24 | `lot_size_acres` | 🟢 Bridge-Stellar OR 🧮 Calculated | ✅ Working | LotSizeAcres OR Field 23 / 43,560 |
| 25 | `year_built` | 🟢 Bridge-Stellar | ✅ Working | YearBuilt |
| 26 | `property_type` | 🟢 Bridge-Stellar | ✅ Working | ArchitecturalStyle → PropertySubType → PropertyType |
| 27 | `stories` | 🟢 Bridge-Stellar | ⚠️ Complex | 4-tier fallback often fails |
| 28 | `garage_spaces` | 🟢 Bridge-Stellar | ✅ Working | GarageSpaces |
| 29 | `parking_total` | 🟢 Bridge-Stellar | ✅ Working | ParkingTotal |

---

## **GROUP 4: HOA & TAXES (Fields 30-38 + subfields)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 30 | `hoa_yn` | 🟢 Bridge-Stellar | ✅ Working | AssociationYN |
| 31 | `association_fee` | 🧮 Calculated from 31A-31F | ✅ Calculated | Annual total |
| 31A | `hoa_fee_monthly` | 🟢 Bridge-Stellar + 🧮 Normalized | ✅ Working | From AssociationFee + frequency |
| 31B | `hoa_fee_annual` | 🟢 Bridge-Stellar + 🧮 Normalized | ✅ Working | From AssociationFee + frequency |
| 31C | `condo_fee_monthly` | 🟢 Bridge-Stellar + 🧮 Normalized | ✅ Working | From AssociationFee + frequency |
| 31D | `condo_fee_annual` | 🟢 Bridge-Stellar + 🧮 Normalized | ✅ Working | From AssociationFee + frequency |
| 31E | `fee_frequency_primary` | 🟢 Bridge-Stellar | ✅ Working | AssociationFeeFrequency |
| 31F | `fee_raw_notes` | 🟢 Bridge-Stellar | ✅ Working | Audit trail |
| 32 | `hoa_name` | 🟢 Bridge-Stellar | ✅ Working | AssociationName |
| 33 | `hoa_includes` | 🟢 Bridge-Stellar | ✅ Working | AssociationFeeIncludes |
| 34 | `ownership_type` | 🟢 Bridge-Stellar | ✅ Working | Ownership |
| 35 | `annual_taxes` | 🟢 Bridge-Stellar | ✅ Working | TaxAnnualAmount |
| 36 | `tax_year` | 🟢 Bridge-Stellar | ✅ Working | TaxYear |
| 37 | `property_tax_rate` | 🧮 Calculated | ✅ Calculated | Field 35 / Field 15 × 100 |
| 38 | `tax_exemptions` | 🟢 Bridge-Stellar | ✅ Working | HomesteadYN → text |

---

## **GROUP 5: STRUCTURE & SYSTEMS (Fields 39-48)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 39 | `roof_type` | 🟢 Bridge-Stellar | ✅ Working | RoofType → RoofMaterial → Roof |
| 40 | `roof_age_est` | 🟢 Bridge-Stellar OR 🟡 Tavily/LLMs | ⚠️ Add to Tavily | RoofYear OR PermitRoof - **EXPAND SEARCH** |
| 41 | `exterior_material` | 🟢 Bridge-Stellar | ✅ Working | ExteriorConstruction → ConstructionMaterials |
| 42 | `foundation` | 🟢 Bridge-Stellar | ✅ Working | FoundationType → Foundation |
| 43 | `water_heater_type` | 🟢 Bridge-Stellar OR 🟡 LLM | ⚠️ Often null | WaterHeaterType |
| 44 | `garage_type` | 🟢 Bridge-Stellar | ✅ Working | GarageType OR inferred from AttachedGarageYN |
| 45 | `hvac_type` | 🟢 Bridge-Stellar | ✅ Working | Heating + Cooling arrays |
| 46 | `hvac_age` | 🟢 Bridge-Stellar OR 🟡 Tavily/LLMs | ⚠️ Add to Tavily | PermitHVAC - **EXPAND SEARCH** |
| 47 | `laundry_type` | 🟢 Bridge-Stellar | ✅ Working | LaundryFeatures |
| 48 | `interior_condition` | 🟢 Bridge-Stellar OR parsed | ✅ Working | PropertyCondition OR parse PublicRemarks |

---

## **GROUP 6: INTERIOR FEATURES (Fields 49-53)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 49 | `flooring_type` | 🟢 Bridge-Stellar | ✅ Working | Flooring array |
| 50 | `kitchen_features` | 🟢 Bridge-Stellar | ✅ Working | Filtered from InteriorFeatures |
| 51 | `appliances_included` | 🟢 Bridge-Stellar | ✅ Working | Appliances array |
| 52 | `fireplace_yn` | 🟢 Bridge-Stellar | ✅ Working | FireplaceYN |
| 53 | `primary_br_location` | 🟢 Bridge-Stellar | 🔴 ❌ **WRONG MAPPING** | Currently maps to FireplacesTotal, should be MasterBedroomLevel |

---

## **GROUP 7: EXTERIOR FEATURES (Fields 54-58)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 54 | `pool_yn` | 🟢 Bridge-Stellar | ✅ Working | PoolPrivateYN |
| 55 | `pool_type` | 🟢 Bridge-Stellar | ✅ Working | PoolFeatures + SpaFeatures |
| 56 | `deck_patio` | 🟢 Bridge-Stellar | ✅ Working | PatioAndPorchFeatures |
| 57 | `fence` | 🟢 Bridge-Stellar | ✅ Working | Fencing array |
| 58 | `landscaping` | 🟢 Bridge-Stellar | ✅ Working | LotFeatures (flood terms filtered) |

---

## **GROUP 8: PERMITS & RENOVATIONS (Fields 59-62)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 59 | `recent_renovations` | 🟢 Bridge-Stellar OR 🟡 Tavily/LLMs | ⚠️ Add to Tavily | Renovations field OR parse PublicRemarks - **EXPAND SEARCH** |
| 60 | `permit_history_roof` | 🟢 Bridge-Stellar OR 🟡 Tavily/LLMs | ⚠️ Add to Tavily | PermitRoof - **EXPAND SEARCH** |
| 61 | `permit_history_hvac` | 🟢 Bridge-Stellar OR 🟡 Tavily/LLMs | ⚠️ Add to Tavily | PermitHVAC - **EXPAND SEARCH** |
| 62 | `permit_history_other` | 🟢 Bridge-Stellar OR 🟡 Tavily/LLMs | ⚠️ Add to Tavily | PermitAdditions - **EXPAND SEARCH** |

---

## **GROUP 9: ASSIGNED SCHOOLS (Fields 63-73)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 63 | `school_district` | 🟢 Bridge-Stellar OR 🟡 Perplexity | ✅ Working | SchoolDistrict |
| 64 | `elevation_feet` | 🟢 USGS API | ✅ Working | USGS Elevation API |
| 65 | `elementary_school` | 🟢 Bridge-Stellar OR 🟢 Google Places | ✅ Working | ElementarySchool OR nearest |
| 66 | `elementary_rating` | 🟢 SchoolDigger/GreatSchools API | ✅ Working | External school API |
| 67 | `elementary_distance_mi` | 🟢 Google Places + Distance Matrix | ✅ Working | Calculated distance |
| 68 | `middle_school` | 🟢 Bridge-Stellar OR 🟢 Google Places | ✅ Working | MiddleOrJuniorSchool OR nearest |
| 69 | `middle_rating` | 🟢 SchoolDigger/GreatSchools API | ✅ Working | External school API |
| 70 | `middle_distance_mi` | 🟢 Google Places + Distance Matrix | ✅ Working | Calculated distance |
| 71 | `high_school` | 🟢 Bridge-Stellar OR 🟢 Google Places | ✅ Working | HighSchool OR nearest |
| 72 | `high_rating` | 🟢 SchoolDigger/GreatSchools API | ✅ Working | External school API |
| 73 | `high_distance_mi` | 🟢 Google Places + Distance Matrix | ✅ Working | Calculated distance |

---

## **GROUP 10: LOCATION SCORES (Fields 74-82)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 74 | `walk_score` | 🟢 WalkScore API | ✅ Working | WalkScore.com API |
| 75 | `transit_score` | 🟢 WalkScore API | ✅ Working | WalkScore.com API |
| 76 | `bike_score` | 🟢 WalkScore API | ✅ Working | WalkScore.com API |
| 77 | `safety_score` | 🟢 FBI Crime API + 🧮 Calculated | ✅ Working | Crime rate → score |
| 78 | `noise_level` | 🟢 HowLoud API | ✅ Working | Soundscore |
| 79 | `traffic_level` | 🟢 HowLoud API OR 🟡 LLM | ✅ Working | From HowLoud data |
| 80 | `walkability_description` | 🟢 WalkScore API | ✅ Working | From WalkScore response |
| 81 | `public_transit_access` | 🟢 Google Places | ✅ Working | Transit stations within 1mi |
| 82 | `commute_to_city_center` | 🟢 Google Distance Matrix | ✅ Working | Driving time to downtown |

---

## **GROUP 11: DISTANCES & AMENITIES (Fields 83-87)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 83 | `distance_grocery_mi` | 🟢 Google Places | ✅ Working | Nearest supermarket |
| 84 | `distance_hospital_mi` | 🟢 Google Places | ✅ Working | Nearest hospital |
| 85 | `distance_airport_mi` | 🟢 Google Places | ✅ Working | Nearest airport |
| 86 | `distance_park_mi` | 🟢 Google Places | ✅ Working | Nearest park |
| 87 | `distance_beach_mi` | 🟢 Google Places OR 🧮 Coastline calc | ✅ Working | Waterfront properties use coastline calculation |

---

## **GROUP 12: SAFETY & CRIME (Fields 88-90)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 88 | `violent_crime_index` | 🟢 FBI Crime API | ✅ Working | FBI UCR data |
| 89 | `property_crime_index` | 🟢 FBI Crime API | ✅ Working | FBI UCR data |
| 90 | `neighborhood_safety_rating` | 🟢 FBI Crime API + 🧮 Calculated | ✅ Working | Grade from crime rates |

---

## **GROUP 13: MARKET & INVESTMENT DATA (Fields 91-103)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 91 | `median_home_price_neighborhood` | 🟡 Tavily/Perplexity/LLMs | ⚠️ Add sources | Search Zillow/Redfin/Realtor/Trulia/Movoto |
| 92 | `price_per_sqft_recent_avg` | 🟡 Tavily/Perplexity/LLMs | ⚠️ Add sources | Search Zillow/Redfin/Realtor/Trulia/Movoto |
| 93 | `price_to_rent_ratio` | 🧮 Calculated | ✅ Calculated | Field 10 / (Field 98 × 12) |
| 94 | `price_vs_median_percent` | 🧮 Calculated | ✅ Calculated | (Field 10 / Field 91 - 1) × 100 |
| 95 | `days_on_market_avg` | 🟡 Tavily/Perplexity/LLMs | ⚠️ Add explicit prompt | **NEIGHBORHOOD avg**, not individual DOM |
| 96 | `inventory_surplus` | 🟡 Perplexity/LLMs | ✅ LLM fill | Market analysis |
| 97 | `insurance_est_annual` | 🟡 Perplexity/LLMs | ✅ LLM fill | Insurance estimate |
| 98 | `rental_estimate_monthly` | 🟡 Perplexity/LLMs | ✅ LLM fill | Rent Zestimate search |
| 99 | `rental_yield_est` | 🧮 Calculated | ✅ Calculated | (Field 98 × 12) / Field 10 × 100 |
| 100 | `vacancy_rate_neighborhood` | 🟢 U.S. Census API | ✅ Working | ACS 5-year estimates |
| 101 | `cap_rate_est` | 🧮 Calculated | ✅ Calculated | ((Field 98 × 12) - Field 35) / Field 10 × 100 |
| 102 | `financing_terms` | 🟢 Bridge-Stellar | ✅ Working | FinancingAvailable |
| 103 | `comparable_sales` | 🟡 Perplexity/LLMs | ✅ LLM fill | Comp search via web |

---

## **GROUP 14: UTILITIES & CONNECTIVITY (Fields 104-116)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 104 | `electric_provider` | 🟢 Bridge-Stellar OR 🟡 Tavily/LLMs | ⚠️ Expand all LLMs | Electric field OR search - **ADD TO ALL LLMS** |
| 105 | `avg_electric_bill` | 🟡 Perplexity/LLMs | ✅ LLM fill | Utility estimate |
| 106 | `water_provider` | 🟢 Bridge-Stellar OR 🟡 Tavily/LLMs | ⚠️ Expand all LLMs | Water field OR search - **ADD TO ALL LLMS** |
| 107 | `avg_water_bill` | 🟡 Perplexity/LLMs | ✅ LLM fill | Utility estimate |
| 108 | `sewer_provider` | 🟢 Bridge-Stellar | ✅ Working | Sewer field |
| 109 | `natural_gas` | 🟢 Bridge-Stellar OR 🟡 Tavily/LLMs | ⚠️ Expand all LLMs | Gas field OR search - **ADD TO ALL LLMS** |
| 110 | `trash_provider` | 🟡 Perplexity/LLMs | ✅ LLM fill | Municipal service search |
| 111 | `internet_providers_top3` | 🟡 Perplexity/LLMs | ✅ LLM fill | BroadbandNow data via LLM |
| 112 | `max_internet_speed` | 🟡 Perplexity/LLMs | ✅ LLM fill | ISP data search |
| 113 | `fiber_available` | 🟡 Perplexity/LLMs | ✅ LLM fill | Fiber availability search |
| 114 | `cable_tv_provider` | 🟡 Perplexity/LLMs | ✅ LLM fill | Cable provider search |
| 115 | `cell_coverage_quality` | 🟡 Perplexity/LLMs | ✅ LLM fill | Coverage map search |
| 116 | `emergency_services_distance` | 🟢 Google Places | ✅ Working | Fire/police/hospital avg |

---

## **GROUP 15: ENVIRONMENT & RISK (Fields 117-130)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 117 | `air_quality_index` | 🟢 AirNow API | ✅ Working | EPA AirNow real-time |
| 118 | `air_quality_grade` | 🧮 Calculated from 117 | ✅ Calculated | AQI → letter grade |
| 119 | `flood_zone` | 🟢 Bridge-Stellar OR 🟢 FEMA API | ✅ Working | FloodZone OR FEMA NFHL |
| 120 | `flood_risk_level` | 🟢 FEMA API OR 🟡 LLM | ✅ Working | FEMA risk index |
| 121 | `climate_risk` | 🟢 NOAA Climate API | ✅ Working | NOAA climate data |
| 122 | `wildfire_risk` | 🟡 Perplexity/LLMs | ✅ LLM fill | First Street Foundation data |
| 123 | `earthquake_risk` | 🟢 USGS API | ✅ Working | USGS seismic data |
| 124 | `hurricane_risk` | 🟢 NOAA Storm API | ✅ Working | NOAA historical storms |
| 125 | `tornado_risk` | 🟢 NOAA Storm API | ✅ Working | NOAA historical storms |
| 126 | `radon_risk` | 🟢 EPA Radon | ✅ Working | EPA radon zone map |
| 127 | `superfund_site_nearby` | 🟢 EPA FRS API | ✅ Working | EPA Facility Registry |
| 128 | `sea_level_rise_risk` | 🟢 NOAA Sea Level API | ✅ Working | NOAA sea level projections |
| 129 | `noise_level_db_est` | 🧮 Calculated from 78 | ✅ Calculated | HowLoud Soundscore → dB |
| 130 | `solar_potential` | 🟢 Google Solar API | ✅ Working | Google Project Sunroof |

---

## **GROUP 16: ADDITIONAL FEATURES (Fields 131-138)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 131 | `view_type` | 🟢 Bridge-Stellar | ✅ Working | View array |
| 132 | `lot_features` | 🟢 Bridge-Stellar | ✅ Working | LotFeatures + Topography + Vegetation |
| 133 | `ev_charging` | 🟢 Bridge-Stellar OR 🟡 Tavily/LLMs | ⚠️ Add to LLMs | GreenEnergyGeneration OR search |
| 134 | `smart_home_features` | 🟢 Bridge-Stellar OR 🟡 Tavily/LLMs | ⚠️ Add to LLMs | InteriorFeatures OR parse remarks OR search |
| 135 | `accessibility_modifications` | 🟢 Bridge-Stellar OR 🟡 Tavily/LLMs | ⚠️ Add to LLMs | AccessibilityFeatures OR parse remarks OR search |
| 136 | `pet_policy` | 🟢 Bridge-Stellar | ✅ Working | PetsAllowed + PetRestrictions |
| 137 | `age_restrictions` | 🟢 Bridge-Stellar | ✅ Working | HousingForOlderPersonsYN |
| 138 | `special_assessments` | 🟢 Bridge-Stellar OR 🟡 Tavily/LLMs | ⚠️ Add to LLMs | SpecialListingConditions OR parse remarks OR search |

---

## **GROUP 17: STELLAR MLS - PARKING (Fields 139-143)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 139 | `carport_yn` | 🟢 Bridge-Stellar | ✅ Working | CarportYN |
| 140 | `carport_spaces` | 🟢 Bridge-Stellar | ✅ Working | CarportSpaces |
| 141 | `garage_attached_yn` | 🟢 Bridge-Stellar | ✅ Working | AttachedGarageYN |
| 142 | `parking_features` | 🟢 Bridge-Stellar | ✅ Working | ParkingFeatures array |
| 143 | `assigned_parking_spaces` | 🟢 Bridge-Stellar | ✅ Working | AssignedParkingSpaces |

---

## **GROUP 18: STELLAR MLS - BUILDING (Fields 144-148)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 144 | `floor_number` | 🟢 Bridge-Stellar | ✅ Working | UnitFloor |
| 145 | `building_total_floors` | 🟢 Bridge-Stellar | ✅ Working | BuildingFloors |
| 146 | `building_name_number` | 🟢 Bridge-Stellar | ✅ Working | BuildingName OR BuildingNumber |
| 147 | `building_elevator_yn` | 🟢 Bridge-Stellar | ✅ Working | ElevatorYN |
| 148 | `floors_in_unit` | 🟢 Bridge-Stellar | ✅ Working | FloorsInUnit |

---

## **GROUP 19: STELLAR MLS - LEGAL (Fields 149-154)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 149 | `subdivision_name` | 🟢 Bridge-Stellar | ✅ Working | SubdivisionName (duplicate of Field 6) |
| 150 | `legal_description` | 🟢 Bridge-Stellar | ✅ Working | LegalDescription OR TaxLegalDescription |
| 151 | `homestead_yn` | 🟢 Bridge-Stellar | ✅ Working | HomesteadYN |
| 152 | `cdd_yn` | 🟢 Bridge-Stellar | ✅ Working | CDDYN |
| 153 | `annual_cdd_fee` | 🟢 Bridge-Stellar | ✅ Working | CDDAnnualFee |
| 154 | `front_exposure` | 🟢 Bridge-Stellar | ✅ Working | DirectionFaces |

---

## **GROUP 20: STELLAR MLS - WATERFRONT (Fields 155-159)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 155 | `water_frontage_yn` | 🟢 Bridge-Stellar | ✅ Working | WaterfrontYN OR inferred |
| 156 | `waterfront_feet` | 🟢 Bridge-Stellar | ✅ Working | WaterfrontFeet OR CanalFrontage |
| 157 | `water_access_yn` | 🟢 Bridge-Stellar | ✅ Working | WaterAccessYN OR inferred from DockYN |
| 158 | `water_view_yn` | 🟢 Bridge-Stellar | ✅ Working | WaterViewYN |
| 159 | `water_body_name` | 🟢 Bridge-Stellar | ✅ Working | WaterBodyName + dock info |

---

## **GROUP 21: STELLAR MLS - LEASING (Fields 160-165)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 160 | `can_be_leased_yn` | 🟢 Bridge-Stellar | ✅ Working | LeaseConsideredYN |
| 161 | `minimum_lease_period` | 🟢 Bridge-Stellar | ✅ Working | MinimumLeaseType OR LeaseTerm |
| 162 | `lease_restrictions_yn` | 🟢 Bridge-Stellar | ✅ Working | LeaseRestrictionsYN |
| 163 | `pet_size_limit` | 🟢 Bridge-Stellar | ✅ Working | PetSizeLimit |
| 164 | `max_pet_weight` | 🟢 Bridge-Stellar | ✅ Working | MaxPetWeight |
| 165 | `association_approval_yn` | 🟢 Bridge-Stellar | 🔴 ❌ **WRONG MAPPING** | Currently maps to BuyerFinancingYN - need to research correct field |

---

## **GROUP 22: STELLAR MLS - FEATURES (Fields 166-168)**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 166 | `community_features` | 🟢 Bridge-Stellar | ✅ Working | CommunityFeatures array |
| 167 | `interior_features` | 🟢 Bridge-Stellar | ✅ Working | InteriorFeatures + AdditionalRooms |
| 168 | `exterior_features` | 🟢 Bridge-Stellar | ✅ Working | ExteriorFeatures array |

---

## **GROUP 23: MARKET PERFORMANCE (Fields 169-181) - SECTION W**

| # | Field Name | Primary Source | Status | Notes |
|---|------------|---------------|--------|-------|
| 169 | `months_of_inventory` | 🟡 Tavily/Perplexity/LLMs | ✅ Implemented | ZIP/city inventory months - market health indicator |
| 170 | `new_listings_30d` | 🟡 Tavily/Perplexity/LLMs | ✅ Implemented | New listings last 30 days - supply indicator |
| 171 | `homes_sold_30d` | 🟡 Tavily/Perplexity/LLMs | ✅ Implemented | Homes sold last 30 days - demand indicator |
| 172 | `median_dom_zip` | 🟡 Tavily/Perplexity/LLMs | ✅ Implemented | Median days on market (ZIP) - velocity indicator |
| 173 | `price_reduced_percent` | 🟡 Tavily/Perplexity/LLMs | ✅ Implemented | % listings with price reductions - market pressure indicator |
| 174 | `homes_under_contract` | 🟡 Tavily/Perplexity/LLMs | ✅ Implemented | Homes currently pending - competition indicator |
| 175 | `market_type` | 🟡 Perplexity/LLMs | ✅ LLM fill | Hot/Warm/Cool/Cold classification |
| 176 | `avg_sale_to_list_percent` | 🟡 Perplexity/LLMs | ✅ LLM fill | Redfin market data |
| 177 | `avg_days_to_pending` | 🟡 Perplexity/LLMs | ✅ LLM fill | Market timing data |
| 178 | `multiple_offers_likelihood` | 🟡 Perplexity/LLMs | ✅ LLM fill | Market competition analysis |
| 179 | `appreciation_percent` | 🟡 Perplexity/LLMs | ✅ LLM fill | Historical appreciation |
| 180 | `price_trend` | 🟡 Perplexity/LLMs | ✅ LLM fill | Rising/Stable/Declining |
| 181 | `rent_zestimate` | 🟡 Perplexity/LLMs | ✅ LLM fill | Zillow Rent Zestimate search |

---

## 🔴 CRITICAL ERRORS SUMMARY

| Field | Issue | Current Mapping | Correct Mapping | Priority |
|-------|-------|----------------|----------------|----------|
| **11** | Rental bug | Calculates price/sqft for rentals | Add rental detection | 🔥 CRITICAL |
| **20** | Uses integer | `BathroomsTotalInteger` | `BathroomsTotalDecimal` | 🔥 CRITICAL |
| **53** | Wrong field | `FireplacesTotal` (number) | `MasterBedroomLevel` (text) | 🔥 CRITICAL |
| **165** | Wrong field | `BuyerFinancingYN` | Research correct Bridge field | 🟡 HIGH |

---

## 📊 SOURCE COVERAGE STATISTICS

| Source Type | Fields Covered | Notes |
|------------|---------------|-------|
| 🟢 Bridge-Stellar | ~80 fields | Core property data |
| 🟢 Google APIs (Tier 2) | ~25 fields | Geocoding, Places, Distance, Solar |
| 🟢 Free APIs (Tier 2) | ~30 fields | WalkScore, Crime, FEMA, NOAA, EPA, etc. |
| 🟡 Tavily (Tier 3) | ~35 fields | Web search integration |
| 🟡 Perplexity/LLMs (Tier 4-5) | ~35 fields | Deep web search, market data |
| 🧮 Calculated | ~11 fields | Derived from other fields |

---

## ⚠️ FIELDS NEEDING EXPANSION

These fields currently have limited coverage and need Tavily + full LLM cascade:

- **AVMs:** 16a, 16b
- **Ages:** 40, 46
- **Permits:** 59, 60, 61, 62
- **Market Data:** 91, 92, 95
- **Utilities:** 104, 106, 109
- **Features:** 133, 134, 135, 138
- **Portal Views:** 169, 170, 171, 172, 174

**Total:** 23 fields requiring prompt/search expansion
