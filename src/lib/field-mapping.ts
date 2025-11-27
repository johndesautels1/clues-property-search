/**
 * CLUES Property Dashboard - Unified Field Mapping
 * Maps API field keys (e.g., "7_listing_price") to frontend keys (e.g., "pricing.listingPrice")
 * This is the SINGLE SOURCE OF TRUTH for field mapping
 */

// API field key format: {number}_{snake_case_name}
// Frontend key format: {group}.{camelCaseName}

export interface FieldMapping {
  fieldNumber: number;
  apiKey: string;           // e.g., "7_listing_price"
  frontendKey: string;      // e.g., "pricing.listingPrice"
  csvHeader: string;        // e.g., "Listing Price" for CSV exports
  label: string;            // Human-readable label
  group: string;            // Group name
  type: 'string' | 'number' | 'boolean' | 'date' | 'array';
}

/**
 * Complete 138-field mapping table
 * This ensures API responses map correctly to frontend state
 */
export const FIELD_MAPPINGS: FieldMapping[] = [
  // GROUP A: Address & Identity (1-6)
  { fieldNumber: 1, apiKey: '1_full_address', frontendKey: 'addressIdentity.fullAddress', csvHeader: 'Full Address', label: 'Full Address', group: 'Address & Identity', type: 'string' },
  { fieldNumber: 2, apiKey: '2_mls_primary', frontendKey: 'addressIdentity.mlsPrimary', csvHeader: 'MLS Primary', label: 'MLS # (Primary)', group: 'Address & Identity', type: 'string' },
  { fieldNumber: 3, apiKey: '3_mls_secondary', frontendKey: 'addressIdentity.mlsSecondary', csvHeader: 'MLS Secondary', label: 'MLS # (Secondary)', group: 'Address & Identity', type: 'string' },
  { fieldNumber: 4, apiKey: '4_listing_status', frontendKey: 'addressIdentity.listingStatus', csvHeader: 'Listing Status', label: 'Listing Status', group: 'Address & Identity', type: 'string' },
  { fieldNumber: 5, apiKey: '5_listing_date', frontendKey: 'addressIdentity.listingDate', csvHeader: 'Listing Date', label: 'Listing Date', group: 'Address & Identity', type: 'date' },
  { fieldNumber: 6, apiKey: '6_parcel_id', frontendKey: 'addressIdentity.parcelId', csvHeader: 'Parcel ID', label: 'Parcel ID', group: 'Address & Identity', type: 'string' },

  // GROUP B: Pricing (7-11)
  { fieldNumber: 7, apiKey: '7_listing_price', frontendKey: 'pricing.listingPrice', csvHeader: 'Listing Price', label: 'Listing Price', group: 'Pricing', type: 'number' },
  { fieldNumber: 8, apiKey: '8_price_per_sqft', frontendKey: 'pricing.pricePerSqft', csvHeader: 'Price Per SqFt', label: 'Price per Sq Ft', group: 'Pricing', type: 'number' },
  { fieldNumber: 9, apiKey: '9_market_value_estimate', frontendKey: 'pricing.marketValueEstimate', csvHeader: 'Market Value Estimate', label: 'Market Value Estimate', group: 'Pricing', type: 'number' },
  { fieldNumber: 10, apiKey: '10_last_sale_date', frontendKey: 'pricing.lastSaleDate', csvHeader: 'Last Sale Date', label: 'Last Sale Date', group: 'Pricing', type: 'date' },
  { fieldNumber: 11, apiKey: '11_last_sale_price', frontendKey: 'pricing.lastSalePrice', csvHeader: 'Last Sale Price', label: 'Last Sale Price', group: 'Pricing', type: 'number' },

  // GROUP C: Property Basics (12-24)
  { fieldNumber: 12, apiKey: '12_bedrooms', frontendKey: 'propertyBasics.bedrooms', csvHeader: 'Bedrooms', label: 'Bedrooms', group: 'Property Basics', type: 'number' },
  { fieldNumber: 13, apiKey: '13_full_bathrooms', frontendKey: 'propertyBasics.fullBathrooms', csvHeader: 'Full Bathrooms', label: 'Full Bathrooms', group: 'Property Basics', type: 'number' },
  { fieldNumber: 14, apiKey: '14_half_bathrooms', frontendKey: 'propertyBasics.halfBathrooms', csvHeader: 'Half Bathrooms', label: 'Half Bathrooms', group: 'Property Basics', type: 'number' },
  { fieldNumber: 15, apiKey: '15_total_bathrooms', frontendKey: 'propertyBasics.totalBathrooms', csvHeader: 'Total Bathrooms', label: 'Total Bathrooms', group: 'Property Basics', type: 'number' },
  { fieldNumber: 16, apiKey: '16_living_sqft', frontendKey: 'propertyBasics.livingSqft', csvHeader: 'Living SqFt', label: 'Living Sq Ft', group: 'Property Basics', type: 'number' },
  { fieldNumber: 17, apiKey: '17_total_sqft_under_roof', frontendKey: 'propertyBasics.totalSqftUnderRoof', csvHeader: 'Total SqFt Under Roof', label: 'Total Sq Ft Under Roof', group: 'Property Basics', type: 'number' },
  { fieldNumber: 18, apiKey: '18_lot_size_sqft', frontendKey: 'propertyBasics.lotSizeSqft', csvHeader: 'Lot Size SqFt', label: 'Lot Size (Sq Ft)', group: 'Property Basics', type: 'number' },
  { fieldNumber: 19, apiKey: '19_lot_size_acres', frontendKey: 'propertyBasics.lotSizeAcres', csvHeader: 'Lot Size Acres', label: 'Lot Size (Acres)', group: 'Property Basics', type: 'number' },
  { fieldNumber: 20, apiKey: '20_year_built', frontendKey: 'propertyBasics.yearBuilt', csvHeader: 'Year Built', label: 'Year Built', group: 'Property Basics', type: 'number' },
  { fieldNumber: 21, apiKey: '21_property_type', frontendKey: 'propertyBasics.propertyType', csvHeader: 'Property Type', label: 'Property Type', group: 'Property Basics', type: 'string' },
  { fieldNumber: 22, apiKey: '22_stories', frontendKey: 'propertyBasics.stories', csvHeader: 'Stories', label: 'Stories', group: 'Property Basics', type: 'number' },
  { fieldNumber: 23, apiKey: '23_garage_spaces', frontendKey: 'propertyBasics.garageSpaces', csvHeader: 'Garage Spaces', label: 'Garage Spaces', group: 'Property Basics', type: 'number' },
  { fieldNumber: 24, apiKey: '24_parking_total', frontendKey: 'propertyBasics.parkingTotal', csvHeader: 'Parking Total', label: 'Parking Description', group: 'Property Basics', type: 'string' },

  // GROUP D: HOA & Ownership (25-28)
  { fieldNumber: 25, apiKey: '25_hoa_yn', frontendKey: 'hoaOwnership.hoaYn', csvHeader: 'HOA Y/N', label: 'HOA?', group: 'HOA & Ownership', type: 'boolean' },
  { fieldNumber: 26, apiKey: '26_hoa_fee_annual', frontendKey: 'hoaOwnership.hoaFeeAnnual', csvHeader: 'HOA Fee Annual', label: 'HOA Fee (Annual)', group: 'HOA & Ownership', type: 'number' },
  { fieldNumber: 27, apiKey: '27_ownership_type', frontendKey: 'hoaOwnership.ownershipType', csvHeader: 'Ownership Type', label: 'Ownership Type', group: 'HOA & Ownership', type: 'string' },
  { fieldNumber: 28, apiKey: '28_county', frontendKey: 'hoaOwnership.county', csvHeader: 'County', label: 'County', group: 'HOA & Ownership', type: 'string' },

  // GROUP E: Taxes & Assessments (29-35)
  { fieldNumber: 29, apiKey: '29_annual_taxes', frontendKey: 'taxesAssessments.annualTaxes', csvHeader: 'Annual Taxes', label: 'Annual Property Taxes', group: 'Taxes & Assessments', type: 'number' },
  { fieldNumber: 30, apiKey: '30_tax_year', frontendKey: 'taxesAssessments.taxYear', csvHeader: 'Tax Year', label: 'Tax Year', group: 'Taxes & Assessments', type: 'number' },
  { fieldNumber: 31, apiKey: '31_assessed_value', frontendKey: 'taxesAssessments.assessedValue', csvHeader: 'Assessed Value', label: 'Assessed Value', group: 'Taxes & Assessments', type: 'number' },
  { fieldNumber: 32, apiKey: '32_tax_exemptions', frontendKey: 'taxesAssessments.taxExemptions', csvHeader: 'Tax Exemptions', label: 'Tax Exemptions', group: 'Taxes & Assessments', type: 'string' },
  { fieldNumber: 33, apiKey: '33_property_tax_rate', frontendKey: 'taxesAssessments.propertyTaxRate', csvHeader: 'Property Tax Rate', label: 'Property Tax Rate', group: 'Taxes & Assessments', type: 'number' },
  { fieldNumber: 34, apiKey: '34_recent_tax_history', frontendKey: 'taxesAssessments.recentTaxHistory', csvHeader: 'Recent Tax History', label: 'Recent Tax History', group: 'Taxes & Assessments', type: 'string' },
  { fieldNumber: 35, apiKey: '35_special_assessments', frontendKey: 'taxesAssessments.specialAssessments', csvHeader: 'Special Assessments', label: 'Special Assessments', group: 'Taxes & Assessments', type: 'string' },

  // GROUP F: Structure & Systems (36-41)
  { fieldNumber: 36, apiKey: '36_roof_type', frontendKey: 'structureSystems.roofType', csvHeader: 'Roof Type', label: 'Roof Type', group: 'Structure & Systems', type: 'string' },
  { fieldNumber: 37, apiKey: '37_roof_age_est', frontendKey: 'structureSystems.roofAgeEst', csvHeader: 'Roof Age Est', label: 'Roof Age (Est.)', group: 'Structure & Systems', type: 'string' },
  { fieldNumber: 38, apiKey: '38_exterior_material', frontendKey: 'structureSystems.exteriorMaterial', csvHeader: 'Exterior Material', label: 'Exterior Material', group: 'Structure & Systems', type: 'string' },
  { fieldNumber: 39, apiKey: '39_foundation', frontendKey: 'structureSystems.foundation', csvHeader: 'Foundation', label: 'Foundation', group: 'Structure & Systems', type: 'string' },
  { fieldNumber: 40, apiKey: '40_hvac_type', frontendKey: 'structureSystems.hvacType', csvHeader: 'HVAC Type', label: 'HVAC Type', group: 'Structure & Systems', type: 'string' },
  { fieldNumber: 41, apiKey: '41_hvac_age', frontendKey: 'structureSystems.hvacAge', csvHeader: 'HVAC Age', label: 'HVAC Age (Est.)', group: 'Structure & Systems', type: 'string' },

  // GROUP G: Interior Features (42-46)
  { fieldNumber: 42, apiKey: '42_flooring_type', frontendKey: 'interiorFeatures.flooringType', csvHeader: 'Flooring Type', label: 'Flooring Type', group: 'Interior Features', type: 'string' },
  { fieldNumber: 43, apiKey: '43_kitchen_features', frontendKey: 'interiorFeatures.kitchenFeatures', csvHeader: 'Kitchen Features', label: 'Kitchen Features', group: 'Interior Features', type: 'string' },
  { fieldNumber: 44, apiKey: '44_appliances_included', frontendKey: 'interiorFeatures.appliancesIncluded', csvHeader: 'Appliances Included', label: 'Appliances Included', group: 'Interior Features', type: 'array' },
  { fieldNumber: 45, apiKey: '45_fireplace_yn', frontendKey: 'interiorFeatures.fireplaceYn', csvHeader: 'Fireplace Y/N', label: 'Fireplace?', group: 'Interior Features', type: 'boolean' },
  { fieldNumber: 46, apiKey: '46_interior_condition', frontendKey: 'interiorFeatures.interiorCondition', csvHeader: 'Interior Condition', label: 'Interior Condition', group: 'Interior Features', type: 'string' },

  // GROUP H: Exterior Features (47-51)
  { fieldNumber: 47, apiKey: '47_pool_yn', frontendKey: 'exteriorFeatures.poolYn', csvHeader: 'Pool Y/N', label: 'Pool?', group: 'Exterior Features', type: 'boolean' },
  { fieldNumber: 48, apiKey: '48_pool_type', frontendKey: 'exteriorFeatures.poolType', csvHeader: 'Pool Type', label: 'Pool Type', group: 'Exterior Features', type: 'string' },
  { fieldNumber: 49, apiKey: '49_deck_patio', frontendKey: 'exteriorFeatures.deckPatio', csvHeader: 'Deck Patio', label: 'Deck/Patio', group: 'Exterior Features', type: 'string' },
  { fieldNumber: 50, apiKey: '50_fence', frontendKey: 'exteriorFeatures.fence', csvHeader: 'Fence', label: 'Fence', group: 'Exterior Features', type: 'string' },
  { fieldNumber: 51, apiKey: '51_landscaping', frontendKey: 'exteriorFeatures.landscaping', csvHeader: 'Landscaping', label: 'Landscaping', group: 'Exterior Features', type: 'string' },

  // GROUP I: Permits & Renovations (52-55)
  { fieldNumber: 52, apiKey: '52_recent_renovations', frontendKey: 'permitsRenovations.recentRenovations', csvHeader: 'Recent Renovations', label: 'Recent Renovations', group: 'Permits & Renovations', type: 'string' },
  { fieldNumber: 53, apiKey: '53_permit_history_roof', frontendKey: 'permitsRenovations.permitHistoryRoof', csvHeader: 'Permit History Roof', label: 'Permit History - Roof', group: 'Permits & Renovations', type: 'string' },
  { fieldNumber: 54, apiKey: '54_permit_history_hvac', frontendKey: 'permitsRenovations.permitHistoryHvac', csvHeader: 'Permit History HVAC', label: 'Permit History - HVAC', group: 'Permits & Renovations', type: 'string' },
  { fieldNumber: 55, apiKey: '55_permit_history_other', frontendKey: 'permitsRenovations.permitHistoryOther', csvHeader: 'Permit History Other', label: 'Permit History - Other', group: 'Permits & Renovations', type: 'string' },

  // GROUP J: Schools (56-64)
  { fieldNumber: 56, apiKey: '56_assigned_elementary', frontendKey: 'schools.assignedElementary', csvHeader: 'Assigned Elementary', label: 'Assigned Elementary', group: 'Schools', type: 'string' },
  { fieldNumber: 57, apiKey: '57_elementary_rating', frontendKey: 'schools.elementaryRating', csvHeader: 'Elementary Rating', label: 'Elementary Rating', group: 'Schools', type: 'string' },
  { fieldNumber: 58, apiKey: '58_elementary_distance_miles', frontendKey: 'schools.elementaryDistanceMiles', csvHeader: 'Elementary Distance Miles', label: 'Elementary Distance (mi)', group: 'Schools', type: 'number' },
  { fieldNumber: 59, apiKey: '59_assigned_middle', frontendKey: 'schools.assignedMiddle', csvHeader: 'Assigned Middle', label: 'Assigned Middle', group: 'Schools', type: 'string' },
  { fieldNumber: 60, apiKey: '60_middle_rating', frontendKey: 'schools.middleRating', csvHeader: 'Middle Rating', label: 'Middle Rating', group: 'Schools', type: 'string' },
  { fieldNumber: 61, apiKey: '61_middle_distance_miles', frontendKey: 'schools.middleDistanceMiles', csvHeader: 'Middle Distance Miles', label: 'Middle Distance (mi)', group: 'Schools', type: 'number' },
  { fieldNumber: 62, apiKey: '62_assigned_high', frontendKey: 'schools.assignedHigh', csvHeader: 'Assigned High', label: 'Assigned High', group: 'Schools', type: 'string' },
  { fieldNumber: 63, apiKey: '63_high_rating', frontendKey: 'schools.highRating', csvHeader: 'High Rating', label: 'High Rating', group: 'Schools', type: 'string' },
  { fieldNumber: 64, apiKey: '64_high_distance_miles', frontendKey: 'schools.highDistanceMiles', csvHeader: 'High Distance Miles', label: 'High Distance (mi)', group: 'Schools', type: 'number' },

  // GROUP K: Location Scores (65-72)
  { fieldNumber: 65, apiKey: '65_walk_score', frontendKey: 'locationScores.walkScore', csvHeader: 'Walk Score', label: 'Walk Score', group: 'Location Scores', type: 'string' },
  { fieldNumber: 66, apiKey: '66_transit_score', frontendKey: 'locationScores.transitScore', csvHeader: 'Transit Score', label: 'Transit Score', group: 'Location Scores', type: 'string' },
  { fieldNumber: 67, apiKey: '67_bike_score', frontendKey: 'locationScores.bikeScore', csvHeader: 'Bike Score', label: 'Bike Score', group: 'Location Scores', type: 'string' },
  { fieldNumber: 68, apiKey: '68_noise_level', frontendKey: 'locationScores.noiseLevel', csvHeader: 'Noise Level', label: 'Noise Level', group: 'Location Scores', type: 'string' },
  { fieldNumber: 69, apiKey: '69_traffic_level', frontendKey: 'locationScores.trafficLevel', csvHeader: 'Traffic Level', label: 'Traffic Level', group: 'Location Scores', type: 'string' },
  { fieldNumber: 70, apiKey: '70_walkability_description', frontendKey: 'locationScores.walkabilityDescription', csvHeader: 'Walkability Description', label: 'Walkability Description', group: 'Location Scores', type: 'string' },
  { fieldNumber: 71, apiKey: '71_commute_time_city_center', frontendKey: 'locationScores.commuteTimeCityCenter', csvHeader: 'Commute Time City Center', label: 'Commute to City Center', group: 'Location Scores', type: 'string' },
  { fieldNumber: 72, apiKey: '72_public_transit_access', frontendKey: 'locationScores.publicTransitAccess', csvHeader: 'Public Transit Access', label: 'Public Transit Access', group: 'Location Scores', type: 'string' },

  // GROUP L: Distances & Amenities (73-77)
  { fieldNumber: 73, apiKey: '73_distance_grocery_miles', frontendKey: 'distancesAmenities.distanceGroceryMiles', csvHeader: 'Distance Grocery Miles', label: 'Distance to Grocery (mi)', group: 'Distances & Amenities', type: 'number' },
  { fieldNumber: 74, apiKey: '74_distance_hospital_miles', frontendKey: 'distancesAmenities.distanceHospitalMiles', csvHeader: 'Distance Hospital Miles', label: 'Distance to Hospital (mi)', group: 'Distances & Amenities', type: 'number' },
  { fieldNumber: 75, apiKey: '75_distance_airport_miles', frontendKey: 'distancesAmenities.distanceAirportMiles', csvHeader: 'Distance Airport Miles', label: 'Distance to Airport (mi)', group: 'Distances & Amenities', type: 'number' },
  { fieldNumber: 76, apiKey: '76_distance_park_miles', frontendKey: 'distancesAmenities.distanceParkMiles', csvHeader: 'Distance Park Miles', label: 'Distance to Park (mi)', group: 'Distances & Amenities', type: 'number' },
  { fieldNumber: 77, apiKey: '77_distance_beach_miles', frontendKey: 'distancesAmenities.distanceBeachMiles', csvHeader: 'Distance Beach Miles', label: 'Distance to Beach (mi)', group: 'Distances & Amenities', type: 'number' },

  // GROUP M: Safety & Crime (78-80)
  { fieldNumber: 78, apiKey: '78_crime_index_violent', frontendKey: 'safetyCrime.crimeIndexViolent', csvHeader: 'Crime Index Violent', label: 'Violent Crime Index', group: 'Safety & Crime', type: 'string' },
  { fieldNumber: 79, apiKey: '79_crime_index_property', frontendKey: 'safetyCrime.crimeIndexProperty', csvHeader: 'Crime Index Property', label: 'Property Crime Index', group: 'Safety & Crime', type: 'string' },
  { fieldNumber: 80, apiKey: '80_neighborhood_safety_rating', frontendKey: 'safetyCrime.neighborhoodSafetyRating', csvHeader: 'Neighborhood Safety Rating', label: 'Neighborhood Safety Rating', group: 'Safety & Crime', type: 'string' },

  // GROUP N: Market & Investment (81-91)
  { fieldNumber: 81, apiKey: '81_median_home_price_neighborhood', frontendKey: 'marketInvestment.medianHomePriceNeighborhood', csvHeader: 'Median Home Price Neighborhood', label: 'Median Home Price (Area)', group: 'Market & Investment', type: 'number' },
  { fieldNumber: 82, apiKey: '82_price_per_sqft_recent_avg', frontendKey: 'marketInvestment.pricePerSqftRecentAvg', csvHeader: 'Price Per SqFt Recent Avg', label: 'Avg $/SqFt (Recent Sales)', group: 'Market & Investment', type: 'number' },
  { fieldNumber: 83, apiKey: '83_days_on_market_avg', frontendKey: 'marketInvestment.daysOnMarketAvg', csvHeader: 'Days On Market Avg', label: 'Avg Days on Market (Area)', group: 'Market & Investment', type: 'number' },
  { fieldNumber: 84, apiKey: '84_inventory_surplus', frontendKey: 'marketInvestment.inventorySurplus', csvHeader: 'Inventory Surplus', label: 'Inventory Surplus', group: 'Market & Investment', type: 'string' },
  { fieldNumber: 85, apiKey: '85_rental_estimate_monthly', frontendKey: 'marketInvestment.rentalEstimateMonthly', csvHeader: 'Rental Estimate Monthly', label: 'Rental Estimate (Monthly)', group: 'Market & Investment', type: 'number' },
  { fieldNumber: 86, apiKey: '86_rental_yield_est', frontendKey: 'marketInvestment.rentalYieldEst', csvHeader: 'Rental Yield Est', label: 'Rental Yield Est. (%)', group: 'Market & Investment', type: 'number' },
  { fieldNumber: 87, apiKey: '87_vacancy_rate_neighborhood', frontendKey: 'marketInvestment.vacancyRateNeighborhood', csvHeader: 'Vacancy Rate Neighborhood', label: 'Vacancy Rate (Area %)', group: 'Market & Investment', type: 'number' },
  { fieldNumber: 88, apiKey: '88_cap_rate_est', frontendKey: 'marketInvestment.capRateEst', csvHeader: 'Cap Rate Est', label: 'Cap Rate Est. (%)', group: 'Market & Investment', type: 'number' },
  { fieldNumber: 89, apiKey: '89_insurance_est_annual', frontendKey: 'marketInvestment.insuranceEstAnnual', csvHeader: 'Insurance Est Annual', label: 'Insurance Est. (Annual)', group: 'Market & Investment', type: 'number' },
  { fieldNumber: 90, apiKey: '90_financing_terms', frontendKey: 'marketInvestment.financingTerms', csvHeader: 'Financing Terms', label: 'Financing Terms', group: 'Market & Investment', type: 'string' },
  { fieldNumber: 91, apiKey: '91_comparable_sales', frontendKey: 'marketInvestment.comparableSales', csvHeader: 'Comparable Sales', label: 'Comparable Sales', group: 'Market & Investment', type: 'string' },

  // GROUP O: Utilities (92-98)
  { fieldNumber: 92, apiKey: '92_electric_provider', frontendKey: 'utilities.electricProvider', csvHeader: 'Electric Provider', label: 'Electric Provider', group: 'Utilities', type: 'string' },
  { fieldNumber: 93, apiKey: '93_water_provider', frontendKey: 'utilities.waterProvider', csvHeader: 'Water Provider', label: 'Water Provider', group: 'Utilities', type: 'string' },
  { fieldNumber: 94, apiKey: '94_sewer_provider', frontendKey: 'utilities.sewerProvider', csvHeader: 'Sewer Provider', label: 'Sewer Provider', group: 'Utilities', type: 'string' },
  { fieldNumber: 95, apiKey: '95_natural_gas', frontendKey: 'utilities.naturalGas', csvHeader: 'Natural Gas', label: 'Natural Gas', group: 'Utilities', type: 'string' },
  { fieldNumber: 96, apiKey: '96_internet_providers_top3', frontendKey: 'utilities.internetProvidersTop3', csvHeader: 'Internet Providers Top 3', label: 'Internet Providers', group: 'Utilities', type: 'array' },
  { fieldNumber: 97, apiKey: '97_max_internet_speed', frontendKey: 'utilities.maxInternetSpeed', csvHeader: 'Max Internet Speed', label: 'Max Internet Speed', group: 'Utilities', type: 'string' },
  { fieldNumber: 98, apiKey: '98_cable_tv_provider', frontendKey: 'utilities.cableTvProvider', csvHeader: 'Cable TV Provider', label: 'Cable TV Provider', group: 'Utilities', type: 'string' },

  // GROUP P: Environment & Risk (99-104)
  { fieldNumber: 99, apiKey: '99_air_quality_index_current', frontendKey: 'environmentRisk.airQualityIndexCurrent', csvHeader: 'Air Quality Index Current', label: 'Air Quality Index', group: 'Environment & Risk', type: 'string' },
  { fieldNumber: 100, apiKey: '100_flood_zone', frontendKey: 'environmentRisk.floodZone', csvHeader: 'Flood Zone', label: 'FEMA Flood Zone', group: 'Environment & Risk', type: 'string' },
  { fieldNumber: 101, apiKey: '101_flood_risk_level', frontendKey: 'environmentRisk.floodRiskLevel', csvHeader: 'Flood Risk Level', label: 'Flood Risk Level', group: 'Environment & Risk', type: 'string' },
  { fieldNumber: 102, apiKey: '102_climate_risk_summary', frontendKey: 'environmentRisk.climateRiskSummary', csvHeader: 'Climate Risk Summary', label: 'Climate Risk Summary', group: 'Environment & Risk', type: 'string' },
  { fieldNumber: 103, apiKey: '103_noise_level_db_est', frontendKey: 'environmentRisk.noiseLevelDbEst', csvHeader: 'Noise Level dB Est', label: 'Noise Level (dB Est.)', group: 'Environment & Risk', type: 'string' },
  { fieldNumber: 104, apiKey: '104_solar_potential', frontendKey: 'environmentRisk.solarPotential', csvHeader: 'Solar Potential', label: 'Solar Potential', group: 'Environment & Risk', type: 'string' },

  // GROUP Q: Additional Features (105-110)
  { fieldNumber: 105, apiKey: '105_ev_charging_yn', frontendKey: 'additionalFeatures.evChargingYn', csvHeader: 'EV Charging Y/N', label: 'EV Charging', group: 'Additional Features', type: 'string' },
  { fieldNumber: 106, apiKey: '106_smart_home_features', frontendKey: 'additionalFeatures.smartHomeFeatures', csvHeader: 'Smart Home Features', label: 'Smart Home Features', group: 'Additional Features', type: 'string' },
  { fieldNumber: 107, apiKey: '107_accessibility_mods', frontendKey: 'additionalFeatures.accessibilityMods', csvHeader: 'Accessibility Mods', label: 'Accessibility Modifications', group: 'Additional Features', type: 'string' },
  { fieldNumber: 108, apiKey: '108_pet_policy', frontendKey: 'additionalFeatures.petPolicy', csvHeader: 'Pet Policy', label: 'Pet Policy', group: 'Additional Features', type: 'string' },
  { fieldNumber: 109, apiKey: '109_age_restrictions', frontendKey: 'additionalFeatures.ageRestrictions', csvHeader: 'Age Restrictions', label: 'Age Restrictions', group: 'Additional Features', type: 'string' },
  { fieldNumber: 110, apiKey: '110_notes_confidence_summary', frontendKey: 'additionalFeatures.notesConfidenceSummary', csvHeader: 'Notes Confidence Summary', label: 'Notes & Confidence Summary', group: 'Additional Features', type: 'string' },
];

// Lookup maps for fast conversion
const apiToFrontendMap = new Map<string, FieldMapping>();
const frontendToApiMap = new Map<string, FieldMapping>();
const fieldNumberToMapping = new Map<number, FieldMapping>();
const csvHeaderToMapping = new Map<string, FieldMapping>();

// Build lookup maps
FIELD_MAPPINGS.forEach(mapping => {
  apiToFrontendMap.set(mapping.apiKey, mapping);
  frontendToApiMap.set(mapping.frontendKey, mapping);
  fieldNumberToMapping.set(mapping.fieldNumber, mapping);
  csvHeaderToMapping.set(mapping.csvHeader.toLowerCase(), mapping);
});

/**
 * Convert API field key to frontend key
 * @example apiKeyToFrontendKey('7_listing_price') => 'pricing.listingPrice'
 */
export function apiKeyToFrontendKey(apiKey: string): string | null {
  const mapping = apiToFrontendMap.get(apiKey);
  return mapping?.frontendKey || null;
}

/**
 * Convert frontend key to API field key
 * @example frontendKeyToApiKey('pricing.listingPrice') => '7_listing_price'
 */
export function frontendKeyToApiKey(frontendKey: string): string | null {
  const mapping = frontendToApiMap.get(frontendKey);
  return mapping?.apiKey || null;
}

/**
 * Get field mapping by field number
 * @example getFieldByNumber(7) => { apiKey: '7_listing_price', ... }
 */
export function getFieldByNumber(fieldNumber: number): FieldMapping | null {
  return fieldNumberToMapping.get(fieldNumber) || null;
}

/**
 * Get field mapping by CSV header (case-insensitive)
 * @example getFieldByCsvHeader('Listing Price') => { apiKey: '7_listing_price', ... }
 */
export function getFieldByCsvHeader(header: string): FieldMapping | null {
  return csvHeaderToMapping.get(header.toLowerCase()) || null;
}

/**
 * Convert entire API response fields object to frontend format
 */
export function convertApiFieldsToFrontend(apiFields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [apiKey, fieldData] of Object.entries(apiFields)) {
    const mapping = apiToFrontendMap.get(apiKey);
    if (mapping) {
      result[mapping.frontendKey] = fieldData;
    }
  }

  return result;
}

/**
 * Convert frontend fields object to API format
 */
export function convertFrontendFieldsToApi(frontendFields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [frontendKey, fieldData] of Object.entries(frontendFields)) {
    const mapping = frontendToApiMap.get(frontendKey);
    if (mapping) {
      result[mapping.apiKey] = fieldData;
    }
  }

  return result;
}

/**
 * Parse CSV row using field mappings
 * Supports both API key format (7_listing_price) and CSV header format (Listing Price)
 */
export function parseCsvRow(row: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [header, value] of Object.entries(row)) {
    // Try exact API key match first
    let mapping = apiToFrontendMap.get(header);

    // Try CSV header match
    if (!mapping) {
      mapping = csvHeaderToMapping.get(header.toLowerCase());
    }

    // Try extracting field number from header (e.g., "1_full_address" or "1 Full Address")
    if (!mapping) {
      const numMatch = header.match(/^(\d+)[_\s]/);
      if (numMatch) {
        mapping = fieldNumberToMapping.get(parseInt(numMatch[1]));
      }
    }

    if (mapping && value !== undefined && value !== '') {
      // Convert value based on type
      let parsedValue: any = value;

      switch (mapping.type) {
        case 'number':
          parsedValue = parseFloat(value.replace(/[^0-9.-]/g, '')) || null;
          break;
        case 'boolean':
          parsedValue = ['true', 'yes', '1', 'y'].includes(value.toLowerCase());
          break;
        case 'array':
          parsedValue = value.split(',').map(s => s.trim()).filter(Boolean);
          break;
      }

      result[mapping.apiKey] = {
        value: parsedValue,
        source: 'CSV Upload',
        confidence: 'High'
      };
    }
  }

  return result;
}

/**
 * Generate CSV headers for export
 */
export function getCsvHeaders(): string[] {
  return FIELD_MAPPINGS.map(m => m.csvHeader);
}

/**
 * Generate API keys for export
 */
export function getApiKeys(): string[] {
  return FIELD_MAPPINGS.map(m => m.apiKey);
}

/**
 * Get all field mappings grouped by category
 */
export function getFieldsByGroup(): Map<string, FieldMapping[]> {
  const groups = new Map<string, FieldMapping[]>();

  FIELD_MAPPINGS.forEach(mapping => {
    const group = groups.get(mapping.group) || [];
    group.push(mapping);
    groups.set(mapping.group, group);
  });

  return groups;
}
