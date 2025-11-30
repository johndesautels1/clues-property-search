# FIELD MAPPING FIX PLAN

**Created: 2025-11-30**
**Purpose: Complete instructions for fixing the 252 field mapping errors**

---

## START HERE - PROMPT FOR NEW SESSION

Copy and paste this to start a new Claude Code session:

```
I need you to fix the field mapping errors in the CLUES Property Dashboard.

CRITICAL FILES TO READ FIRST:
1. D:\Clues_Quantum_Property_Dashboard\FIELD_MAPPING_TRUTH.md - The source of truth
2. D:\Clues_Quantum_Property_Dashboard\FIELD_MAPPING_FIX_PLAN.md - This fix plan
3. D:\Clues_Quantum_Property_Dashboard\src\types\fields-schema.ts - THE correct field numbers

RUN THIS VERIFICATION FIRST:
npx ts-node scripts/verify-field-mapping.ts

This will show 252 errors. Your job is to fix all 3 files until the script shows 0 errors.

FILES TO FIX (in order):
1. src/lib/field-normalizer.ts - Update FIELD_TO_PROPERTY_MAP
2. api/property/search.ts - Update convertFlatToNestedStructure fieldPathMap
3. api/property/parse-mls-pdf.ts - Update MLS_FIELD_MAPPING

DO NOT claim work is done until verification shows 0 errors.
```

---

## PROJECT DIRECTORY STRUCTURE

```
D:\Clues_Quantum_Property_Dashboard\
├── api/
│   └── property/
│       ├── arbitration.ts
│       ├── autocomplete.ts
│       ├── enrich.ts
│       ├── florida-counties.ts
│       ├── free-apis.ts
│       ├── llm-constants.ts
│       ├── parse-mls-pdf.ts      ← FIX THIS (MLS_FIELD_MAPPING)
│       ├── retry-llm.ts
│       ├── search-stream.ts
│       ├── search.ts             ← FIX THIS (convertFlatToNestedStructure)
│       └── stellar-mls.ts
├── scripts/
│   └── verify-field-mapping.ts   ← VERIFICATION SCRIPT
├── src/
│   ├── components/
│   ├── lib/
│   │   ├── field-mapping.ts
│   │   └── field-normalizer.ts   ← FIX THIS (FIELD_TO_PROPERTY_MAP)
│   ├── pages/
│   │   ├── AddProperty.tsx
│   │   ├── PropertyDetail.tsx    ← ADD STELLAR MLS SECTIONS
│   │   └── ...
│   ├── store/
│   │   └── propertyStore.ts
│   └── types/
│       ├── fields-schema.ts      ← SOURCE OF TRUTH (DO NOT MODIFY)
│       └── property.ts
├── CLAUDE.md                     ← Instructions for Claude agents
├── FIELD_MAPPING_TRUTH.md        ← Complete field documentation
└── FIELD_MAPPING_FIX_PLAN.md     ← This file
```

---

## THE PROBLEM

There are 4 different field numbering systems in the codebase. Only ONE is correct (`fields-schema.ts`).

### Current State (WRONG):
| Field | fields-schema.ts | field-normalizer.ts | search.ts |
|-------|------------------|---------------------|-----------|
| Listing Price | #10 | #7 | #7 |
| Bedrooms | #17 | #12 | #12 |
| Living SqFt | #21 | #16 | #16 |
| Year Built | #25 | #20 | #20 |
| Annual Taxes | #35 | #29 | #29 |
| Roof Type | #39 | #36 | #36 |

### Target State (CORRECT):
All files must use the `fields-schema.ts` numbering.

---

## FIX 1: src/lib/field-normalizer.ts

### What to change:
The `FIELD_TO_PROPERTY_MAP` array has wrong field numbers.

### Pattern:
```typescript
// BEFORE (WRONG):
{ fieldNumber: 7, apiKey: '7_listing_price', ... }

// AFTER (CORRECT):
{ fieldNumber: 10, apiKey: '10_listing_price', ... }
```

### Complete mapping needed:
```typescript
// Address & Identity (1-9)
{ fieldNumber: 1, apiKey: '1_full_address', group: 'address', propName: 'fullAddress', type: 'string' },
{ fieldNumber: 2, apiKey: '2_mls_primary', group: 'address', propName: 'mlsPrimary', type: 'string' },
{ fieldNumber: 3, apiKey: '3_mls_secondary', group: 'address', propName: 'mlsSecondary', type: 'string' },
{ fieldNumber: 4, apiKey: '4_listing_status', group: 'address', propName: 'listingStatus', type: 'string' },
{ fieldNumber: 5, apiKey: '5_listing_date', group: 'address', propName: 'listingDate', type: 'date' },
{ fieldNumber: 6, apiKey: '6_neighborhood', group: 'address', propName: 'neighborhoodName', type: 'string' },
{ fieldNumber: 7, apiKey: '7_county', group: 'address', propName: 'county', type: 'string' },
{ fieldNumber: 8, apiKey: '8_zip_code', group: 'address', propName: 'zipCode', type: 'string' },
{ fieldNumber: 9, apiKey: '9_parcel_id', group: 'details', propName: 'parcelId', type: 'string' },

// Pricing & Value (10-16)
{ fieldNumber: 10, apiKey: '10_listing_price', group: 'address', propName: 'listingPrice', type: 'number' },
{ fieldNumber: 11, apiKey: '11_price_per_sqft', group: 'address', propName: 'pricePerSqft', type: 'number' },
{ fieldNumber: 12, apiKey: '12_market_value_estimate', group: 'details', propName: 'marketValueEstimate', type: 'number' },
{ fieldNumber: 13, apiKey: '13_last_sale_date', group: 'details', propName: 'lastSaleDate', type: 'date' },
{ fieldNumber: 14, apiKey: '14_last_sale_price', group: 'details', propName: 'lastSalePrice', type: 'number' },
{ fieldNumber: 15, apiKey: '15_assessed_value', group: 'details', propName: 'assessedValue', type: 'number' },
{ fieldNumber: 16, apiKey: '16_redfin_estimate', group: 'financial', propName: 'redfinEstimate', type: 'number' },

// Property Basics (17-29)
{ fieldNumber: 17, apiKey: '17_bedrooms', group: 'details', propName: 'bedrooms', type: 'number' },
{ fieldNumber: 18, apiKey: '18_full_bathrooms', group: 'details', propName: 'fullBathrooms', type: 'number' },
{ fieldNumber: 19, apiKey: '19_half_bathrooms', group: 'details', propName: 'halfBathrooms', type: 'number' },
{ fieldNumber: 20, apiKey: '20_total_bathrooms', group: 'details', propName: 'totalBathrooms', type: 'number' },
{ fieldNumber: 21, apiKey: '21_living_sqft', group: 'details', propName: 'livingSqft', type: 'number' },
{ fieldNumber: 22, apiKey: '22_total_sqft_under_roof', group: 'details', propName: 'totalSqftUnderRoof', type: 'number' },
{ fieldNumber: 23, apiKey: '23_lot_size_sqft', group: 'details', propName: 'lotSizeSqft', type: 'number' },
{ fieldNumber: 24, apiKey: '24_lot_size_acres', group: 'details', propName: 'lotSizeAcres', type: 'number' },
{ fieldNumber: 25, apiKey: '25_year_built', group: 'details', propName: 'yearBuilt', type: 'number' },
{ fieldNumber: 26, apiKey: '26_property_type', group: 'details', propName: 'propertyType', type: 'string' },
{ fieldNumber: 27, apiKey: '27_stories', group: 'details', propName: 'stories', type: 'number' },
{ fieldNumber: 28, apiKey: '28_garage_spaces', group: 'details', propName: 'garageSpaces', type: 'number' },
{ fieldNumber: 29, apiKey: '29_parking_total', group: 'details', propName: 'parkingTotal', type: 'string' },

// HOA & Taxes (30-38)
{ fieldNumber: 30, apiKey: '30_hoa_yn', group: 'details', propName: 'hoaYn', type: 'boolean' },
{ fieldNumber: 31, apiKey: '31_hoa_fee_annual', group: 'details', propName: 'hoaFeeAnnual', type: 'number' },
{ fieldNumber: 32, apiKey: '32_hoa_name', group: 'details', propName: 'hoaName', type: 'string' },
{ fieldNumber: 33, apiKey: '33_hoa_includes', group: 'details', propName: 'hoaIncludes', type: 'string' },
{ fieldNumber: 34, apiKey: '34_ownership_type', group: 'details', propName: 'ownershipType', type: 'string' },
{ fieldNumber: 35, apiKey: '35_annual_taxes', group: 'details', propName: 'annualTaxes', type: 'number' },
{ fieldNumber: 36, apiKey: '36_tax_year', group: 'details', propName: 'taxYear', type: 'number' },
{ fieldNumber: 37, apiKey: '37_property_tax_rate', group: 'financial', propName: 'propertyTaxRate', type: 'number' },
{ fieldNumber: 38, apiKey: '38_tax_exemptions', group: 'financial', propName: 'taxExemptions', type: 'string' },

// Structure & Systems (39-48)
{ fieldNumber: 39, apiKey: '39_roof_type', group: 'structural', propName: 'roofType', type: 'string' },
{ fieldNumber: 40, apiKey: '40_roof_age_est', group: 'structural', propName: 'roofAgeEst', type: 'string' },
{ fieldNumber: 41, apiKey: '41_exterior_material', group: 'structural', propName: 'exteriorMaterial', type: 'string' },
{ fieldNumber: 42, apiKey: '42_foundation', group: 'structural', propName: 'foundation', type: 'string' },
{ fieldNumber: 43, apiKey: '43_water_heater_type', group: 'structural', propName: 'waterHeaterType', type: 'string' },
{ fieldNumber: 44, apiKey: '44_garage_type', group: 'structural', propName: 'garageType', type: 'string' },
{ fieldNumber: 45, apiKey: '45_hvac_type', group: 'structural', propName: 'hvacType', type: 'string' },
{ fieldNumber: 46, apiKey: '46_hvac_age', group: 'structural', propName: 'hvacAge', type: 'string' },
{ fieldNumber: 47, apiKey: '47_laundry_type', group: 'structural', propName: 'laundryType', type: 'string' },
{ fieldNumber: 48, apiKey: '48_interior_condition', group: 'structural', propName: 'interiorCondition', type: 'string' },

// Interior Features (49-53)
{ fieldNumber: 49, apiKey: '49_flooring_type', group: 'structural', propName: 'flooringType', type: 'string' },
{ fieldNumber: 50, apiKey: '50_kitchen_features', group: 'structural', propName: 'kitchenFeatures', type: 'string' },
{ fieldNumber: 51, apiKey: '51_appliances_included', group: 'structural', propName: 'appliancesIncluded', type: 'array' },
{ fieldNumber: 52, apiKey: '52_fireplace_yn', group: 'structural', propName: 'fireplaceYn', type: 'boolean' },
{ fieldNumber: 53, apiKey: '53_fireplace_count', group: 'structural', propName: 'fireplaceCount', type: 'number' },

// Exterior Features (54-58)
{ fieldNumber: 54, apiKey: '54_pool_yn', group: 'structural', propName: 'poolYn', type: 'boolean' },
{ fieldNumber: 55, apiKey: '55_pool_type', group: 'structural', propName: 'poolType', type: 'string' },
{ fieldNumber: 56, apiKey: '56_deck_patio', group: 'structural', propName: 'deckPatio', type: 'string' },
{ fieldNumber: 57, apiKey: '57_fence', group: 'structural', propName: 'fence', type: 'string' },
{ fieldNumber: 58, apiKey: '58_landscaping', group: 'structural', propName: 'landscaping', type: 'string' },

// Permits & Renovations (59-62)
{ fieldNumber: 59, apiKey: '59_recent_renovations', group: 'structural', propName: 'recentRenovations', type: 'string' },
{ fieldNumber: 60, apiKey: '60_permit_history_roof', group: 'structural', propName: 'permitHistoryRoof', type: 'string' },
{ fieldNumber: 61, apiKey: '61_permit_history_hvac', group: 'structural', propName: 'permitHistoryHvac', type: 'string' },
{ fieldNumber: 62, apiKey: '62_permit_history_other', group: 'structural', propName: 'permitHistoryPoolAdditions', type: 'string' },

// Schools (63-73)
{ fieldNumber: 63, apiKey: '63_school_district', group: 'location', propName: 'schoolDistrictName', type: 'string' },
{ fieldNumber: 64, apiKey: '64_elevation_feet', group: 'location', propName: 'elevationFeet', type: 'number' },
{ fieldNumber: 65, apiKey: '65_elementary_school', group: 'location', propName: 'assignedElementary', type: 'string' },
{ fieldNumber: 66, apiKey: '66_elementary_rating', group: 'location', propName: 'elementaryRating', type: 'string' },
{ fieldNumber: 67, apiKey: '67_elementary_distance_mi', group: 'location', propName: 'elementaryDistanceMiles', type: 'number' },
{ fieldNumber: 68, apiKey: '68_middle_school', group: 'location', propName: 'assignedMiddle', type: 'string' },
{ fieldNumber: 69, apiKey: '69_middle_rating', group: 'location', propName: 'middleRating', type: 'string' },
{ fieldNumber: 70, apiKey: '70_middle_distance_mi', group: 'location', propName: 'middleDistanceMiles', type: 'number' },
{ fieldNumber: 71, apiKey: '71_high_school', group: 'location', propName: 'assignedHigh', type: 'string' },
{ fieldNumber: 72, apiKey: '72_high_rating', group: 'location', propName: 'highRating', type: 'string' },
{ fieldNumber: 73, apiKey: '73_high_distance_mi', group: 'location', propName: 'highDistanceMiles', type: 'number' },

// Location Scores (74-82)
{ fieldNumber: 74, apiKey: '74_walk_score', group: 'location', propName: 'walkScore', type: 'number' },
{ fieldNumber: 75, apiKey: '75_transit_score', group: 'location', propName: 'transitScore', type: 'number' },
{ fieldNumber: 76, apiKey: '76_bike_score', group: 'location', propName: 'bikeScore', type: 'number' },
{ fieldNumber: 77, apiKey: '77_safety_score', group: 'location', propName: 'neighborhoodSafetyRating', type: 'string' },
{ fieldNumber: 78, apiKey: '78_noise_level', group: 'location', propName: 'noiseLevel', type: 'string' },
{ fieldNumber: 79, apiKey: '79_traffic_level', group: 'location', propName: 'trafficLevel', type: 'string' },
{ fieldNumber: 80, apiKey: '80_walkability_description', group: 'location', propName: 'walkabilityDescription', type: 'string' },
{ fieldNumber: 81, apiKey: '81_public_transit_access', group: 'location', propName: 'publicTransitAccess', type: 'string' },
{ fieldNumber: 82, apiKey: '82_commute_to_city_center', group: 'location', propName: 'commuteTimeCityCenter', type: 'string' },

// Distances (83-87)
{ fieldNumber: 83, apiKey: '83_distance_grocery_mi', group: 'location', propName: 'distanceGroceryMiles', type: 'number' },
{ fieldNumber: 84, apiKey: '84_distance_hospital_mi', group: 'location', propName: 'distanceHospitalMiles', type: 'number' },
{ fieldNumber: 85, apiKey: '85_distance_airport_mi', group: 'location', propName: 'distanceAirportMiles', type: 'number' },
{ fieldNumber: 86, apiKey: '86_distance_park_mi', group: 'location', propName: 'distanceParkMiles', type: 'number' },
{ fieldNumber: 87, apiKey: '87_distance_beach_mi', group: 'location', propName: 'distanceBeachMiles', type: 'number' },

// Safety & Crime (88-90)
{ fieldNumber: 88, apiKey: '88_violent_crime_index', group: 'location', propName: 'crimeIndexViolent', type: 'string' },
{ fieldNumber: 89, apiKey: '89_property_crime_index', group: 'location', propName: 'crimeIndexProperty', type: 'string' },
{ fieldNumber: 90, apiKey: '90_neighborhood_safety_rating', group: 'location', propName: 'neighborhoodSafetyRating', type: 'string' },

// Market & Investment (91-103)
{ fieldNumber: 91, apiKey: '91_median_home_price_neighborhood', group: 'financial', propName: 'medianHomePriceNeighborhood', type: 'number' },
{ fieldNumber: 92, apiKey: '92_price_per_sqft_recent_avg', group: 'financial', propName: 'pricePerSqftRecentAvg', type: 'number' },
{ fieldNumber: 93, apiKey: '93_price_to_rent_ratio', group: 'financial', propName: 'priceToRentRatio', type: 'number' },
{ fieldNumber: 94, apiKey: '94_price_vs_median_percent', group: 'financial', propName: 'priceVsMedianPercent', type: 'number' },
{ fieldNumber: 95, apiKey: '95_days_on_market_avg', group: 'financial', propName: 'daysOnMarketAvg', type: 'number' },
{ fieldNumber: 96, apiKey: '96_inventory_surplus', group: 'financial', propName: 'inventorySurplus', type: 'string' },
{ fieldNumber: 97, apiKey: '97_insurance_est_annual', group: 'financial', propName: 'insuranceEstAnnual', type: 'number' },
{ fieldNumber: 98, apiKey: '98_rental_estimate_monthly', group: 'financial', propName: 'rentalEstimateMonthly', type: 'number' },
{ fieldNumber: 99, apiKey: '99_rental_yield_est', group: 'financial', propName: 'rentalYieldEst', type: 'number' },
{ fieldNumber: 100, apiKey: '100_vacancy_rate_neighborhood', group: 'financial', propName: 'vacancyRateNeighborhood', type: 'number' },
{ fieldNumber: 101, apiKey: '101_cap_rate_est', group: 'financial', propName: 'capRateEst', type: 'number' },
{ fieldNumber: 102, apiKey: '102_financing_terms', group: 'financial', propName: 'financingTerms', type: 'string' },
{ fieldNumber: 103, apiKey: '103_comparable_sales', group: 'financial', propName: 'comparableSalesLast3', type: 'array' },

// Utilities (104-116)
{ fieldNumber: 104, apiKey: '104_electric_provider', group: 'utilities', propName: 'electricProvider', type: 'string' },
{ fieldNumber: 105, apiKey: '105_avg_electric_bill', group: 'utilities', propName: 'avgElectricBill', type: 'string' },
{ fieldNumber: 106, apiKey: '106_water_provider', group: 'utilities', propName: 'waterProvider', type: 'string' },
{ fieldNumber: 107, apiKey: '107_avg_water_bill', group: 'utilities', propName: 'avgWaterBill', type: 'string' },
{ fieldNumber: 108, apiKey: '108_sewer_provider', group: 'utilities', propName: 'sewerProvider', type: 'string' },
{ fieldNumber: 109, apiKey: '109_natural_gas', group: 'utilities', propName: 'naturalGas', type: 'string' },
{ fieldNumber: 110, apiKey: '110_trash_provider', group: 'utilities', propName: 'trashProvider', type: 'string' },
{ fieldNumber: 111, apiKey: '111_internet_providers_top3', group: 'utilities', propName: 'internetProvidersTop3', type: 'array' },
{ fieldNumber: 112, apiKey: '112_max_internet_speed', group: 'utilities', propName: 'maxInternetSpeed', type: 'string' },
{ fieldNumber: 113, apiKey: '113_fiber_available', group: 'utilities', propName: 'fiberAvailable', type: 'boolean' },
{ fieldNumber: 114, apiKey: '114_cable_tv_provider', group: 'utilities', propName: 'cableTvProvider', type: 'string' },
{ fieldNumber: 115, apiKey: '115_cell_coverage_quality', group: 'utilities', propName: 'cellCoverageQuality', type: 'string' },
{ fieldNumber: 116, apiKey: '116_emergency_services_distance', group: 'utilities', propName: 'emergencyServicesDistance', type: 'string' },

// Environment & Risk (117-130)
{ fieldNumber: 117, apiKey: '117_air_quality_index', group: 'utilities', propName: 'airQualityIndexCurrent', type: 'string' },
{ fieldNumber: 118, apiKey: '118_air_quality_grade', group: 'utilities', propName: 'airQualityGrade', type: 'string' },
{ fieldNumber: 119, apiKey: '119_flood_zone', group: 'utilities', propName: 'floodZone', type: 'string' },
{ fieldNumber: 120, apiKey: '120_flood_risk_level', group: 'utilities', propName: 'floodRiskLevel', type: 'string' },
{ fieldNumber: 121, apiKey: '121_climate_risk', group: 'utilities', propName: 'climateRiskWildfireFlood', type: 'string' },
{ fieldNumber: 122, apiKey: '122_wildfire_risk', group: 'utilities', propName: 'wildfireRisk', type: 'string' },
{ fieldNumber: 123, apiKey: '123_earthquake_risk', group: 'utilities', propName: 'earthquakeRisk', type: 'string' },
{ fieldNumber: 124, apiKey: '124_hurricane_risk', group: 'utilities', propName: 'hurricaneRisk', type: 'string' },
{ fieldNumber: 125, apiKey: '125_tornado_risk', group: 'utilities', propName: 'tornadoRisk', type: 'string' },
{ fieldNumber: 126, apiKey: '126_radon_risk', group: 'utilities', propName: 'radonRisk', type: 'string' },
{ fieldNumber: 127, apiKey: '127_superfund_site_nearby', group: 'utilities', propName: 'superfundNearby', type: 'boolean' },
{ fieldNumber: 128, apiKey: '128_sea_level_rise_risk', group: 'utilities', propName: 'seaLevelRiseRisk', type: 'string' },
{ fieldNumber: 129, apiKey: '129_noise_level_db_est', group: 'utilities', propName: 'noiseLevelDbEst', type: 'string' },
{ fieldNumber: 130, apiKey: '130_solar_potential', group: 'utilities', propName: 'solarPotential', type: 'string' },

// Additional Features (131-138)
{ fieldNumber: 131, apiKey: '131_view_type', group: 'utilities', propName: 'viewType', type: 'string' },
{ fieldNumber: 132, apiKey: '132_lot_features', group: 'utilities', propName: 'lotFeatures', type: 'string' },
{ fieldNumber: 133, apiKey: '133_ev_charging', group: 'utilities', propName: 'evChargingYn', type: 'string' },
{ fieldNumber: 134, apiKey: '134_smart_home_features', group: 'utilities', propName: 'smartHomeFeatures', type: 'string' },
{ fieldNumber: 135, apiKey: '135_accessibility_modifications', group: 'utilities', propName: 'accessibilityMods', type: 'string' },
{ fieldNumber: 136, apiKey: '136_pet_policy', group: 'utilities', propName: 'petPolicy', type: 'string' },
{ fieldNumber: 137, apiKey: '137_age_restrictions', group: 'utilities', propName: 'ageRestrictions', type: 'string' },
{ fieldNumber: 138, apiKey: '138_special_assessments', group: 'financial', propName: 'specialAssessments', type: 'string' },

// Stellar MLS - Parking (139-143)
{ fieldNumber: 139, apiKey: '139_carport_yn', group: 'stellarMLS.parking', propName: 'carportYn', type: 'boolean' },
{ fieldNumber: 140, apiKey: '140_carport_spaces', group: 'stellarMLS.parking', propName: 'carportSpaces', type: 'number' },
{ fieldNumber: 141, apiKey: '141_garage_attached_yn', group: 'stellarMLS.parking', propName: 'garageAttachedYn', type: 'boolean' },
{ fieldNumber: 142, apiKey: '142_parking_features', group: 'stellarMLS.parking', propName: 'parkingFeatures', type: 'array' },
{ fieldNumber: 143, apiKey: '143_assigned_parking_spaces', group: 'stellarMLS.parking', propName: 'assignedParkingSpaces', type: 'number' },

// Stellar MLS - Building (144-148)
{ fieldNumber: 144, apiKey: '144_floor_number', group: 'stellarMLS.building', propName: 'floorNumber', type: 'number' },
{ fieldNumber: 145, apiKey: '145_building_total_floors', group: 'stellarMLS.building', propName: 'buildingTotalFloors', type: 'number' },
{ fieldNumber: 146, apiKey: '146_building_name_number', group: 'stellarMLS.building', propName: 'buildingNameNumber', type: 'string' },
{ fieldNumber: 147, apiKey: '147_building_elevator_yn', group: 'stellarMLS.building', propName: 'buildingElevatorYn', type: 'boolean' },
{ fieldNumber: 148, apiKey: '148_floors_in_unit', group: 'stellarMLS.building', propName: 'floorsInUnit', type: 'number' },

// Stellar MLS - Legal (149-154)
{ fieldNumber: 149, apiKey: '149_subdivision_name', group: 'stellarMLS.legal', propName: 'subdivisionName', type: 'string' },
{ fieldNumber: 150, apiKey: '150_legal_description', group: 'stellarMLS.legal', propName: 'legalDescription', type: 'string' },
{ fieldNumber: 151, apiKey: '151_homestead_yn', group: 'stellarMLS.legal', propName: 'homesteadYn', type: 'boolean' },
{ fieldNumber: 152, apiKey: '152_cdd_yn', group: 'stellarMLS.legal', propName: 'cddYn', type: 'boolean' },
{ fieldNumber: 153, apiKey: '153_annual_cdd_fee', group: 'stellarMLS.legal', propName: 'annualCddFee', type: 'number' },
{ fieldNumber: 154, apiKey: '154_front_exposure', group: 'stellarMLS.legal', propName: 'frontExposure', type: 'string' },

// Stellar MLS - Waterfront (155-159)
{ fieldNumber: 155, apiKey: '155_water_frontage_yn', group: 'stellarMLS.waterfront', propName: 'waterFrontageYn', type: 'boolean' },
{ fieldNumber: 156, apiKey: '156_waterfront_feet', group: 'stellarMLS.waterfront', propName: 'waterfrontFeet', type: 'number' },
{ fieldNumber: 157, apiKey: '157_water_access_yn', group: 'stellarMLS.waterfront', propName: 'waterAccessYn', type: 'boolean' },
{ fieldNumber: 158, apiKey: '158_water_view_yn', group: 'stellarMLS.waterfront', propName: 'waterViewYn', type: 'boolean' },
{ fieldNumber: 159, apiKey: '159_water_body_name', group: 'stellarMLS.waterfront', propName: 'waterBodyName', type: 'string' },

// Stellar MLS - Leasing (160-165)
{ fieldNumber: 160, apiKey: '160_can_be_leased_yn', group: 'stellarMLS.leasing', propName: 'canBeLeasedYn', type: 'boolean' },
{ fieldNumber: 161, apiKey: '161_minimum_lease_period', group: 'stellarMLS.leasing', propName: 'minimumLeasePeriod', type: 'string' },
{ fieldNumber: 162, apiKey: '162_lease_restrictions_yn', group: 'stellarMLS.leasing', propName: 'leaseRestrictionsYn', type: 'boolean' },
{ fieldNumber: 163, apiKey: '163_pet_size_limit', group: 'stellarMLS.leasing', propName: 'petSizeLimit', type: 'string' },
{ fieldNumber: 164, apiKey: '164_max_pet_weight', group: 'stellarMLS.leasing', propName: 'maxPetWeight', type: 'number' },
{ fieldNumber: 165, apiKey: '165_association_approval_yn', group: 'stellarMLS.leasing', propName: 'associationApprovalYn', type: 'boolean' },

// Stellar MLS - Features (166-168)
{ fieldNumber: 166, apiKey: '166_community_features', group: 'stellarMLS.features', propName: 'communityFeatures', type: 'array' },
{ fieldNumber: 167, apiKey: '167_interior_features', group: 'stellarMLS.features', propName: 'interiorFeatures', type: 'array' },
{ fieldNumber: 168, apiKey: '168_exterior_features', group: 'stellarMLS.features', propName: 'exteriorFeatures', type: 'array' },
```

---

## FIX 2: api/property/search.ts

### What to change:
The `convertFlatToNestedStructure` function has a `fieldPathMap` with wrong field numbers.

### Pattern:
```typescript
// BEFORE (WRONG):
'7_listing_price': ['address', 'listingPrice'],

// AFTER (CORRECT):
'10_listing_price': ['address', 'listingPrice'],
```

Use the same field numbers as in Fix 1 above.

---

## FIX 3: api/property/parse-mls-pdf.ts

### What to change:
The `MLS_FIELD_MAPPING` object maps PDF field names to API keys with wrong numbers.

### Pattern:
```typescript
// BEFORE (WRONG):
'List Price': '7_listing_price',
'Beds': '12_bedrooms',

// AFTER (CORRECT):
'List Price': '10_listing_price',
'Beds': '17_bedrooms',
```

### Key mappings to fix:
| PDF Field | WRONG API Key | CORRECT API Key |
|-----------|---------------|-----------------|
| List Price | 7_listing_price | 10_listing_price |
| LP/SqFt | 8_price_per_sqft | 11_price_per_sqft |
| Beds | 12_bedrooms | 17_bedrooms |
| Baths | 15_total_bathrooms | 20_total_bathrooms |
| Heated Area | 16_living_sqft | 21_living_sqft |
| Year Built | 20_year_built | 25_year_built |
| Property Style | 21_property_type | 26_property_type |
| HOA / Comm Assn | 25_hoa_yn | 30_hoa_yn |
| HOA Fee | 26_hoa_fee_annual | 31_hoa_fee_annual |
| Taxes | 29_annual_taxes | 35_annual_taxes |
| Tax Year | 30_tax_year | 36_tax_year |
| Roof | 36_roof_type | 39_roof_type |
| Ext Construction | 38_exterior_material | 41_exterior_material |
| Foundation | 39_foundation | 42_foundation |
| A/C | 40_hvac_type | 45_hvac_type |
| Flooring Covering | 42_flooring_type | 49_flooring_type |
| Appliances Incl | 44_appliances_included | 51_appliances_included |
| Fireplace | 45_fireplace_yn | 52_fireplace_yn |
| Pool | 47_pool_yn | 54_pool_yn |
| Pool Type | 48_pool_type | 55_pool_type |

---

## FIX 4: Add Stellar MLS Sections to PropertyDetail.tsx

### What to add:
The PropertyDetail.tsx page needs new sections for fields 139-168.

Add these sections after the existing ones:
- Stellar MLS - Parking (fields 139-143)
- Stellar MLS - Building (fields 144-148)
- Stellar MLS - Legal (fields 149-154)
- Stellar MLS - Waterfront (fields 155-159)
- Stellar MLS - Leasing (fields 160-165)
- Stellar MLS - Features (fields 166-168)

---

## VERIFICATION

After making ALL changes, run:
```bash
npx ts-node scripts/verify-field-mapping.ts
```

The output MUST show:
```
Total Errors: 0
Total Warnings: 0 (or minimal)
FIELD MAPPING IS SYNCHRONIZED
```

---

## ADDITIONAL BUGS TO FIX

1. **Pool "Community" → "No" bug**: In field-normalizer.ts validateAndCoerce(), the boolean conversion treats "Community" as false. Fix:
```typescript
case 'boolean':
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    // "Community", "Yes", "true", "1" should all be truthy
    coerced = lower === 'true' || lower === 'yes' || lower === '1' ||
              lower === 'community' || lower !== 'no' && lower !== 'false' && lower !== '0' && lower !== 'none';
  }
```

2. **SqFt Display Bug**: In AddProperty.tsx, the sqft value shows "1,345,125" instead of "1,345". Check for string concatenation issues.

3. **ZIP Code Parsing**: The address parsing doesn't handle unit numbers properly:
   - "3200 GULF BLVD, #203, ST PETE BEACH, FL 33706" has 4 parts, not 3
   - Need to handle: street, unit, city, state+zip

---

## COMMIT MESSAGE TEMPLATE

When the fix is complete, use this commit message:
```
fix: Synchronize field mapping across all files (252 errors → 0)

- Updated field-normalizer.ts FIELD_TO_PROPERTY_MAP to match fields-schema.ts
- Updated search.ts convertFlatToNestedStructure to match fields-schema.ts
- Updated parse-mls-pdf.ts MLS_FIELD_MAPPING to use correct field numbers
- Added Stellar MLS sections (139-168) to PropertyDetail.tsx
- Fixed boolean conversion for Pool "Community" values
- Verification script now shows 0 errors

Field number corrections:
- listing_price: #7 → #10
- bedrooms: #12 → #17
- living_sqft: #16 → #21
- year_built: #20 → #25
- annual_taxes: #29 → #35
- roof_type: #36 → #39
```
