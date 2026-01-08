/**
 * CLUES Property Dashboard - Unified Field Mapping
 * Maps API field keys (e.g., "10_listing_price") to frontend keys (e.g., "pricing.listingPrice")
 * SYNCHRONIZED WITH: src/types/fields-schema.ts (SOURCE OF TRUTH)
 * Updated: 2025-11-30 - Fixed all 168 field numbers to match fields-schema.ts
 */

// API field key format: {number}_{snake_case_name}
// Frontend key format: {group}.{camelCaseName}

export interface FieldMapping {
  fieldNumber: number;
  apiKey: string;           // e.g., "10_listing_price"
  frontendKey: string;      // e.g., "pricing.listingPrice"
  csvHeader: string;        // e.g., "Listing Price" for CSV exports
  label: string;            // Human-readable label
  group: string;            // Group name
  type: 'string' | 'number' | 'boolean' | 'date' | 'array';
}

/**
 * Complete 168-field mapping table
 * ALIGNED WITH fields-schema.ts (SOURCE OF TRUTH)
 * Fields 1-138: Original fields
 * Fields 139-168: Stellar MLS fields
 */
export const FIELD_MAPPINGS: FieldMapping[] = [
  // ================================================================
  // GROUP 1: Address & Identity (Fields 1-9)
  // ================================================================
  { fieldNumber: 1, apiKey: '1_full_address', frontendKey: 'addressIdentity.fullAddress', csvHeader: 'Full Address', label: 'Full Address', group: 'Address & Identity', type: 'string' },
  { fieldNumber: 2, apiKey: '2_mls_primary', frontendKey: 'addressIdentity.mlsPrimary', csvHeader: 'MLS Primary', label: 'MLS Primary', group: 'Address & Identity', type: 'string' },
  { fieldNumber: 3, apiKey: '3_mls_secondary', frontendKey: 'addressIdentity.mlsSecondary', csvHeader: 'MLS Secondary', label: 'MLS Secondary', group: 'Address & Identity', type: 'string' },
  { fieldNumber: 4, apiKey: '4_listing_status', frontendKey: 'addressIdentity.listingStatus', csvHeader: 'Listing Status', label: 'Listing Status', group: 'Address & Identity', type: 'string' },
  { fieldNumber: 5, apiKey: '5_listing_date', frontendKey: 'addressIdentity.listingDate', csvHeader: 'Listing Date', label: 'Listing Date', group: 'Address & Identity', type: 'date' },
  { fieldNumber: 6, apiKey: '6_neighborhood', frontendKey: 'addressIdentity.neighborhood', csvHeader: 'Neighborhood', label: 'Neighborhood', group: 'Address & Identity', type: 'string' },
  { fieldNumber: 7, apiKey: '7_county', frontendKey: 'addressIdentity.county', csvHeader: 'County', label: 'County', group: 'Address & Identity', type: 'string' },
  { fieldNumber: 8, apiKey: '8_zip_code', frontendKey: 'addressIdentity.zipCode', csvHeader: 'ZIP Code', label: 'ZIP Code', group: 'Address & Identity', type: 'string' },
  { fieldNumber: 9, apiKey: '9_parcel_id', frontendKey: 'addressIdentity.parcelId', csvHeader: 'Parcel ID', label: 'Parcel ID', group: 'Address & Identity', type: 'string' },

  // ================================================================
  // GROUP 2: Pricing & Value (Fields 10-16)
  // ================================================================
  { fieldNumber: 10, apiKey: '10_listing_price', frontendKey: 'pricingValue.listingPrice', csvHeader: 'Listing Price', label: 'Listing Price', group: 'Pricing & Value', type: 'number' },
  { fieldNumber: 11, apiKey: '11_price_per_sqft', frontendKey: 'pricingValue.pricePerSqft', csvHeader: 'Price Per Sq Ft', label: 'Price Per Sq Ft', group: 'Pricing & Value', type: 'number' },
  { fieldNumber: 12, apiKey: '12_market_value_estimate', frontendKey: 'pricingValue.marketValueEstimate', csvHeader: 'Market Value Estimate', label: 'Market Value Estimate', group: 'Pricing & Value', type: 'number' },
  { fieldNumber: 13, apiKey: '13_last_sale_date', frontendKey: 'pricingValue.lastSaleDate', csvHeader: 'Last Sale Date', label: 'Last Sale Date', group: 'Pricing & Value', type: 'date' },
  { fieldNumber: 14, apiKey: '14_last_sale_price', frontendKey: 'pricingValue.lastSalePrice', csvHeader: 'Last Sale Price', label: 'Last Sale Price', group: 'Pricing & Value', type: 'number' },
  { fieldNumber: 15, apiKey: '15_assessed_value', frontendKey: 'pricingValue.assessedValue', csvHeader: 'Assessed Value', label: 'Assessed Value', group: 'Pricing & Value', type: 'number' },
  { fieldNumber: 16, apiKey: '16_avms', frontendKey: 'pricingValue.avms', csvHeader: 'Redfin Estimate', label: 'Redfin Estimate', group: 'Pricing & Value', type: 'number' },

  // ================================================================
  // GROUP 3: Property Basics (Fields 17-29)
  // ================================================================
  { fieldNumber: 17, apiKey: '17_bedrooms', frontendKey: 'propertyBasics.bedrooms', csvHeader: 'Bedrooms', label: 'Bedrooms', group: 'Property Basics', type: 'number' },
  { fieldNumber: 18, apiKey: '18_full_bathrooms', frontendKey: 'propertyBasics.fullBathrooms', csvHeader: 'Full Bathrooms', label: 'Full Bathrooms', group: 'Property Basics', type: 'number' },
  { fieldNumber: 19, apiKey: '19_half_bathrooms', frontendKey: 'propertyBasics.halfBathrooms', csvHeader: 'Half Bathrooms', label: 'Half Bathrooms', group: 'Property Basics', type: 'number' },
  { fieldNumber: 20, apiKey: '20_total_bathrooms', frontendKey: 'propertyBasics.totalBathrooms', csvHeader: 'Total Bathrooms', label: 'Total Bathrooms', group: 'Property Basics', type: 'number' },
  { fieldNumber: 21, apiKey: '21_living_sqft', frontendKey: 'propertyBasics.livingSqft', csvHeader: 'Living Sq Ft', label: 'Living Sq Ft', group: 'Property Basics', type: 'number' },
  { fieldNumber: 22, apiKey: '22_total_sqft_under_roof', frontendKey: 'propertyBasics.totalSqftUnderRoof', csvHeader: 'Total Sq Ft Under Roof', label: 'Total Sq Ft Under Roof', group: 'Property Basics', type: 'number' },
  { fieldNumber: 23, apiKey: '23_lot_size_sqft', frontendKey: 'propertyBasics.lotSizeSqft', csvHeader: 'Lot Size (Sq Ft)', label: 'Lot Size (Sq Ft)', group: 'Property Basics', type: 'number' },
  { fieldNumber: 24, apiKey: '24_lot_size_acres', frontendKey: 'propertyBasics.lotSizeAcres', csvHeader: 'Lot Size (Acres)', label: 'Lot Size (Acres)', group: 'Property Basics', type: 'number' },
  { fieldNumber: 25, apiKey: '25_year_built', frontendKey: 'propertyBasics.yearBuilt', csvHeader: 'Year Built', label: 'Year Built', group: 'Property Basics', type: 'number' },
  { fieldNumber: 26, apiKey: '26_property_type', frontendKey: 'propertyBasics.propertyType', csvHeader: 'Property Type', label: 'Property Type', group: 'Property Basics', type: 'string' },
  { fieldNumber: 27, apiKey: '27_stories', frontendKey: 'propertyBasics.stories', csvHeader: 'Stories', label: 'Stories', group: 'Property Basics', type: 'number' },
  { fieldNumber: 28, apiKey: '28_garage_spaces', frontendKey: 'propertyBasics.garageSpaces', csvHeader: 'Garage Spaces', label: 'Garage Spaces', group: 'Property Basics', type: 'number' },
  { fieldNumber: 29, apiKey: '29_parking_total', frontendKey: 'propertyBasics.parkingTotal', csvHeader: 'Parking Total', label: 'Parking Total', group: 'Property Basics', type: 'string' },

  // ================================================================
  // GROUP 4: HOA & Taxes (Fields 30-38)
  // ================================================================
  { fieldNumber: 30, apiKey: '30_hoa_yn', frontendKey: 'hoaTaxes.hoaYn', csvHeader: 'HOA', label: 'HOA', group: 'HOA & Taxes', type: 'boolean' },
  { fieldNumber: 31, apiKey: '31_hoa_fee_annual', frontendKey: 'hoaTaxes.hoaFeeAnnual', csvHeader: 'HOA Fee (Annual)', label: 'HOA Fee (Annual)', group: 'HOA & Taxes', type: 'number' },
  { fieldNumber: 32, apiKey: '32_hoa_name', frontendKey: 'hoaTaxes.hoaName', csvHeader: 'HOA Name', label: 'HOA Name', group: 'HOA & Taxes', type: 'string' },
  { fieldNumber: 33, apiKey: '33_hoa_includes', frontendKey: 'hoaTaxes.hoaIncludes', csvHeader: 'HOA Includes', label: 'HOA Includes', group: 'HOA & Taxes', type: 'string' },
  { fieldNumber: 34, apiKey: '34_ownership_type', frontendKey: 'hoaTaxes.ownershipType', csvHeader: 'Ownership Type', label: 'Ownership Type', group: 'HOA & Taxes', type: 'string' },
  { fieldNumber: 35, apiKey: '35_annual_taxes', frontendKey: 'hoaTaxes.annualTaxes', csvHeader: 'Annual Taxes', label: 'Annual Taxes', group: 'HOA & Taxes', type: 'number' },
  { fieldNumber: 36, apiKey: '36_tax_year', frontendKey: 'hoaTaxes.taxYear', csvHeader: 'Tax Year', label: 'Tax Year', group: 'HOA & Taxes', type: 'number' },
  { fieldNumber: 37, apiKey: '37_property_tax_rate', frontendKey: 'hoaTaxes.propertyTaxRate', csvHeader: 'Property Tax Rate', label: 'Property Tax Rate', group: 'HOA & Taxes', type: 'number' },
  { fieldNumber: 38, apiKey: '38_tax_exemptions', frontendKey: 'hoaTaxes.taxExemptions', csvHeader: 'Tax Exemptions', label: 'Tax Exemptions', group: 'HOA & Taxes', type: 'string' },

  // ================================================================
  // GROUP 5: Structure & Systems (Fields 39-48)
  // ================================================================
  { fieldNumber: 39, apiKey: '39_roof_type', frontendKey: 'structureSystems.roofType', csvHeader: 'Roof Type', label: 'Roof Type', group: 'Structure & Systems', type: 'string' },
  { fieldNumber: 40, apiKey: '40_roof_age_est', frontendKey: 'structureSystems.roofAgeEst', csvHeader: 'Roof Age (Est)', label: 'Roof Age (Est)', group: 'Structure & Systems', type: 'string' },
  { fieldNumber: 41, apiKey: '41_exterior_material', frontendKey: 'structureSystems.exteriorMaterial', csvHeader: 'Exterior Material', label: 'Exterior Material', group: 'Structure & Systems', type: 'string' },
  { fieldNumber: 42, apiKey: '42_foundation', frontendKey: 'structureSystems.foundation', csvHeader: 'Foundation', label: 'Foundation', group: 'Structure & Systems', type: 'string' },
  { fieldNumber: 43, apiKey: '43_water_heater_type', frontendKey: 'structureSystems.waterHeaterType', csvHeader: 'Water Heater Type', label: 'Water Heater Type', group: 'Structure & Systems', type: 'string' },
  { fieldNumber: 44, apiKey: '44_garage_type', frontendKey: 'structureSystems.garageType', csvHeader: 'Garage Type', label: 'Garage Type', group: 'Structure & Systems', type: 'string' },
  { fieldNumber: 45, apiKey: '45_hvac_type', frontendKey: 'structureSystems.hvacType', csvHeader: 'HVAC Type', label: 'HVAC Type', group: 'Structure & Systems', type: 'string' },
  { fieldNumber: 46, apiKey: '46_hvac_age', frontendKey: 'structureSystems.hvacAge', csvHeader: 'HVAC Age', label: 'HVAC Age', group: 'Structure & Systems', type: 'string' },
  { fieldNumber: 47, apiKey: '47_laundry_type', frontendKey: 'structureSystems.laundryType', csvHeader: 'Laundry Type', label: 'Laundry Type', group: 'Structure & Systems', type: 'string' },
  { fieldNumber: 48, apiKey: '48_interior_condition', frontendKey: 'structureSystems.interiorCondition', csvHeader: 'Interior Condition', label: 'Interior Condition', group: 'Structure & Systems', type: 'string' },

  // ================================================================
  // GROUP 6: Interior Features (Fields 49-53)
  // ================================================================
  { fieldNumber: 49, apiKey: '49_flooring_type', frontendKey: 'interiorFeatures.flooringType', csvHeader: 'Flooring Type', label: 'Flooring Type', group: 'Interior Features', type: 'string' },
  { fieldNumber: 50, apiKey: '50_kitchen_features', frontendKey: 'interiorFeatures.kitchenFeatures', csvHeader: 'Kitchen Features', label: 'Kitchen Features', group: 'Interior Features', type: 'string' },
  { fieldNumber: 51, apiKey: '51_appliances_included', frontendKey: 'interiorFeatures.appliancesIncluded', csvHeader: 'Appliances Included', label: 'Appliances Included', group: 'Interior Features', type: 'array' },
  { fieldNumber: 52, apiKey: '52_fireplace_yn', frontendKey: 'interiorFeatures.fireplaceYn', csvHeader: 'Fireplace', label: 'Fireplace', group: 'Interior Features', type: 'boolean' },
  // FIXED 2026-01-08: Field 53 is Primary BR Location, NOT fireplace count
  { fieldNumber: 53, apiKey: '53_primary_br_location', frontendKey: 'structural.primaryBrLocation', csvHeader: 'Primary BR Location', label: 'Primary BR Location', group: 'Interior Features', type: 'string' },

  // ================================================================
  // GROUP 7: Exterior Features (Fields 54-58)
  // ================================================================
  { fieldNumber: 54, apiKey: '54_pool_yn', frontendKey: 'exteriorFeatures.poolYn', csvHeader: 'Pool', label: 'Pool', group: 'Exterior Features', type: 'boolean' },
  { fieldNumber: 55, apiKey: '55_pool_type', frontendKey: 'exteriorFeatures.poolType', csvHeader: 'Pool Type', label: 'Pool Type', group: 'Exterior Features', type: 'string' },
  { fieldNumber: 56, apiKey: '56_deck_patio', frontendKey: 'exteriorFeatures.deckPatio', csvHeader: 'Deck/Patio', label: 'Deck/Patio', group: 'Exterior Features', type: 'string' },
  { fieldNumber: 57, apiKey: '57_fence', frontendKey: 'exteriorFeatures.fence', csvHeader: 'Fence', label: 'Fence', group: 'Exterior Features', type: 'string' },
  { fieldNumber: 58, apiKey: '58_landscaping', frontendKey: 'exteriorFeatures.landscaping', csvHeader: 'Landscaping', label: 'Landscaping', group: 'Exterior Features', type: 'string' },

  // ================================================================
  // GROUP 8: Permits & Renovations (Fields 59-62)
  // ================================================================
  { fieldNumber: 59, apiKey: '59_recent_renovations', frontendKey: 'permitsRenovations.recentRenovations', csvHeader: 'Recent Renovations', label: 'Recent Renovations', group: 'Permits & Renovations', type: 'string' },
  { fieldNumber: 60, apiKey: '60_permit_history_roof', frontendKey: 'permitsRenovations.permitHistoryRoof', csvHeader: 'Permit History - Roof', label: 'Permit History - Roof', group: 'Permits & Renovations', type: 'string' },
  { fieldNumber: 61, apiKey: '61_permit_history_hvac', frontendKey: 'permitsRenovations.permitHistoryHvac', csvHeader: 'Permit History - HVAC', label: 'Permit History - HVAC', group: 'Permits & Renovations', type: 'string' },
  { fieldNumber: 62, apiKey: '62_permit_history_other', frontendKey: 'permitsRenovations.permitHistoryOther', csvHeader: 'Permit History - Other', label: 'Permit History - Other', group: 'Permits & Renovations', type: 'string' },

  // ================================================================
  // GROUP 9: Assigned Schools (Fields 63-73)
  // ================================================================
  { fieldNumber: 63, apiKey: '63_school_district', frontendKey: 'assignedSchools.schoolDistrict', csvHeader: 'School District', label: 'School District', group: 'Assigned Schools', type: 'string' },
  { fieldNumber: 64, apiKey: '64_elevation_feet', frontendKey: 'assignedSchools.elevationFeet', csvHeader: 'Elevation (feet)', label: 'Elevation (feet)', group: 'Assigned Schools', type: 'number' },
  { fieldNumber: 65, apiKey: '65_elementary_school', frontendKey: 'assignedSchools.elementarySchool', csvHeader: 'Elementary School', label: 'Elementary School', group: 'Assigned Schools', type: 'string' },
  { fieldNumber: 66, apiKey: '66_elementary_rating', frontendKey: 'assignedSchools.elementaryRating', csvHeader: 'Elementary Rating', label: 'Elementary Rating', group: 'Assigned Schools', type: 'string' },
  { fieldNumber: 67, apiKey: '67_elementary_distance_mi', frontendKey: 'assignedSchools.elementaryDistanceMi', csvHeader: 'Elementary Distance (mi)', label: 'Elementary Distance (mi)', group: 'Assigned Schools', type: 'number' },
  { fieldNumber: 68, apiKey: '68_middle_school', frontendKey: 'assignedSchools.middleSchool', csvHeader: 'Middle School', label: 'Middle School', group: 'Assigned Schools', type: 'string' },
  { fieldNumber: 69, apiKey: '69_middle_rating', frontendKey: 'assignedSchools.middleRating', csvHeader: 'Middle Rating', label: 'Middle Rating', group: 'Assigned Schools', type: 'string' },
  { fieldNumber: 70, apiKey: '70_middle_distance_mi', frontendKey: 'assignedSchools.middleDistanceMi', csvHeader: 'Middle Distance (mi)', label: 'Middle Distance (mi)', group: 'Assigned Schools', type: 'number' },
  { fieldNumber: 71, apiKey: '71_high_school', frontendKey: 'assignedSchools.highSchool', csvHeader: 'High School', label: 'High School', group: 'Assigned Schools', type: 'string' },
  { fieldNumber: 72, apiKey: '72_high_rating', frontendKey: 'assignedSchools.highRating', csvHeader: 'High Rating', label: 'High Rating', group: 'Assigned Schools', type: 'string' },
  { fieldNumber: 73, apiKey: '73_high_distance_mi', frontendKey: 'assignedSchools.highDistanceMi', csvHeader: 'High Distance (mi)', label: 'High Distance (mi)', group: 'Assigned Schools', type: 'number' },

  // ================================================================
  // GROUP 10: Location Scores (Fields 74-82)
  // ================================================================
  { fieldNumber: 74, apiKey: '74_walk_score', frontendKey: 'locationScores.walkScore', csvHeader: 'Walk Score', label: 'Walk Score', group: 'Location Scores', type: 'number' },
  { fieldNumber: 75, apiKey: '75_transit_score', frontendKey: 'locationScores.transitScore', csvHeader: 'Transit Score', label: 'Transit Score', group: 'Location Scores', type: 'number' },
  { fieldNumber: 76, apiKey: '76_bike_score', frontendKey: 'locationScores.bikeScore', csvHeader: 'Bike Score', label: 'Bike Score', group: 'Location Scores', type: 'number' },
  { fieldNumber: 77, apiKey: '77_safety_score', frontendKey: 'locationScores.safetyScore', csvHeader: 'Safety', label: 'Safety', group: 'Location Scores', type: 'number' },
  { fieldNumber: 78, apiKey: '78_noise_level', frontendKey: 'locationScores.noiseLevel', csvHeader: 'Noise Level', label: 'Noise Level', group: 'Location Scores', type: 'string' },
  { fieldNumber: 79, apiKey: '79_traffic_level', frontendKey: 'locationScores.trafficLevel', csvHeader: 'Traffic Level', label: 'Traffic Level', group: 'Location Scores', type: 'string' },
  { fieldNumber: 80, apiKey: '80_walkability_description', frontendKey: 'locationScores.walkabilityDescription', csvHeader: 'Walkability Description', label: 'Walkability Description', group: 'Location Scores', type: 'string' },
  { fieldNumber: 81, apiKey: '81_public_transit_access', frontendKey: 'locationScores.publicTransitAccess', csvHeader: 'Public Transit Access', label: 'Public Transit Access', group: 'Location Scores', type: 'string' },
  { fieldNumber: 82, apiKey: '82_commute_to_city_center', frontendKey: 'locationScores.commuteToCityCenter', csvHeader: 'Commute to City Center', label: 'Commute to City Center', group: 'Location Scores', type: 'string' },

  // ================================================================
  // GROUP 11: Distances & Amenities (Fields 83-87)
  // ================================================================
  { fieldNumber: 83, apiKey: '83_distance_grocery_mi', frontendKey: 'distancesAmenities.distanceGroceryMi', csvHeader: 'Distance to Grocery (mi)', label: 'Distance to Grocery (mi)', group: 'Distances & Amenities', type: 'number' },
  { fieldNumber: 84, apiKey: '84_distance_hospital_mi', frontendKey: 'distancesAmenities.distanceHospitalMi', csvHeader: 'Distance to Hospital (mi)', label: 'Distance to Hospital (mi)', group: 'Distances & Amenities', type: 'number' },
  { fieldNumber: 85, apiKey: '85_distance_airport_mi', frontendKey: 'distancesAmenities.distanceAirportMi', csvHeader: 'Distance to Airport (mi)', label: 'Distance to Airport (mi)', group: 'Distances & Amenities', type: 'number' },
  { fieldNumber: 86, apiKey: '86_distance_park_mi', frontendKey: 'distancesAmenities.distanceParkMi', csvHeader: 'Distance to Park (mi)', label: 'Distance to Park (mi)', group: 'Distances & Amenities', type: 'number' },
  { fieldNumber: 87, apiKey: '87_distance_beach_mi', frontendKey: 'distancesAmenities.distanceBeachMi', csvHeader: 'Distance to Beach (mi)', label: 'Distance to Beach (mi)', group: 'Distances & Amenities', type: 'number' },

  // ================================================================
  // GROUP 12: Safety & Crime (Fields 88-90)
  // ================================================================
  { fieldNumber: 88, apiKey: '88_violent_crime_index', frontendKey: 'safetyCrime.violentCrimeIndex', csvHeader: 'Violent Crime Index', label: 'Violent Crime Index', group: 'Safety & Crime', type: 'string' },
  { fieldNumber: 89, apiKey: '89_property_crime_index', frontendKey: 'safetyCrime.propertyCrimeIndex', csvHeader: 'Property Crime Index', label: 'Property Crime Index', group: 'Safety & Crime', type: 'string' },
  { fieldNumber: 90, apiKey: '90_neighborhood_safety_rating', frontendKey: 'safetyCrime.neighborhoodSafetyRating', csvHeader: 'Neighborhood Safety Rating', label: 'Neighborhood Safety Rating', group: 'Safety & Crime', type: 'string' },

  // ================================================================
  // GROUP 13: Market & Investment Data (Fields 91-103)
  // ================================================================
  { fieldNumber: 91, apiKey: '91_median_home_price_neighborhood', frontendKey: 'marketInvestment.medianHomePriceNeighborhood', csvHeader: 'Median Home Price (Neighborhood)', label: 'Median Home Price (Neighborhood)', group: 'Market & Investment Data', type: 'number' },
  { fieldNumber: 92, apiKey: '92_price_per_sqft_recent_avg', frontendKey: 'marketInvestment.pricePerSqftRecentAvg', csvHeader: 'Price Per Sq Ft (Recent Avg)', label: 'Price Per Sq Ft (Recent Avg)', group: 'Market & Investment Data', type: 'number' },
  { fieldNumber: 93, apiKey: '93_price_to_rent_ratio', frontendKey: 'marketInvestment.priceToRentRatio', csvHeader: 'Price to Rent Ratio', label: 'Price to Rent Ratio', group: 'Market & Investment Data', type: 'number' },
  { fieldNumber: 94, apiKey: '94_price_vs_median_percent', frontendKey: 'marketInvestment.priceVsMedianPercent', csvHeader: 'Price vs Median %', label: 'Price vs Median %', group: 'Market & Investment Data', type: 'number' },
  { fieldNumber: 95, apiKey: '95_days_on_market_avg', frontendKey: 'marketInvestment.daysOnMarketAvg', csvHeader: 'Days on Market (Avg)', label: 'Days on Market (Avg)', group: 'Market & Investment Data', type: 'number' },
  { fieldNumber: 96, apiKey: '96_inventory_surplus', frontendKey: 'marketInvestment.inventorySurplus', csvHeader: 'Inventory Surplus', label: 'Inventory Surplus', group: 'Market & Investment Data', type: 'string' },
  { fieldNumber: 97, apiKey: '97_insurance_est_annual', frontendKey: 'marketInvestment.insuranceEstAnnual', csvHeader: 'Insurance Estimate (Annual)', label: 'Insurance Estimate (Annual)', group: 'Market & Investment Data', type: 'number' },
  { fieldNumber: 98, apiKey: '98_rental_estimate_monthly', frontendKey: 'marketInvestment.rentalEstimateMonthly', csvHeader: 'Rental Estimate (Monthly)', label: 'Rental Estimate (Monthly)', group: 'Market & Investment Data', type: 'number' },
  { fieldNumber: 99, apiKey: '99_rental_yield_est', frontendKey: 'marketInvestment.rentalYieldEst', csvHeader: 'Rental Yield (Est)', label: 'Rental Yield (Est)', group: 'Market & Investment Data', type: 'number' },
  { fieldNumber: 100, apiKey: '100_vacancy_rate_neighborhood', frontendKey: 'marketInvestment.vacancyRateNeighborhood', csvHeader: 'Vacancy Rate (Neighborhood)', label: 'Vacancy Rate (Neighborhood)', group: 'Market & Investment Data', type: 'number' },
  { fieldNumber: 101, apiKey: '101_cap_rate_est', frontendKey: 'marketInvestment.capRateEst', csvHeader: 'Cap Rate (Est)', label: 'Cap Rate (Est)', group: 'Market & Investment Data', type: 'number' },
  { fieldNumber: 102, apiKey: '102_financing_terms', frontendKey: 'marketInvestment.financingTerms', csvHeader: 'Financing Terms', label: 'Financing Terms', group: 'Market & Investment Data', type: 'string' },
  { fieldNumber: 103, apiKey: '103_comparable_sales', frontendKey: 'marketInvestment.comparableSales', csvHeader: 'Comparable Sales', label: 'Comparable Sales', group: 'Market & Investment Data', type: 'string' },

  // ================================================================
  // GROUP 14: Utilities & Connectivity (Fields 104-116)
  // ================================================================
  { fieldNumber: 104, apiKey: '104_electric_provider', frontendKey: 'utilitiesConnectivity.electricProvider', csvHeader: 'Electric Provider', label: 'Electric Provider', group: 'Utilities & Connectivity', type: 'string' },
  { fieldNumber: 105, apiKey: '105_avg_electric_bill', frontendKey: 'utilitiesConnectivity.avgElectricBill', csvHeader: 'Avg Electric Bill', label: 'Avg Electric Bill', group: 'Utilities & Connectivity', type: 'string' },
  { fieldNumber: 106, apiKey: '106_water_provider', frontendKey: 'utilitiesConnectivity.waterProvider', csvHeader: 'Water Provider', label: 'Water Provider', group: 'Utilities & Connectivity', type: 'string' },
  { fieldNumber: 107, apiKey: '107_avg_water_bill', frontendKey: 'utilitiesConnectivity.avgWaterBill', csvHeader: 'Avg Water Bill', label: 'Avg Water Bill', group: 'Utilities & Connectivity', type: 'string' },
  { fieldNumber: 108, apiKey: '108_sewer_provider', frontendKey: 'utilitiesConnectivity.sewerProvider', csvHeader: 'Sewer Provider', label: 'Sewer Provider', group: 'Utilities & Connectivity', type: 'string' },
  { fieldNumber: 109, apiKey: '109_natural_gas', frontendKey: 'utilitiesConnectivity.naturalGas', csvHeader: 'Natural Gas', label: 'Natural Gas', group: 'Utilities & Connectivity', type: 'string' },
  { fieldNumber: 110, apiKey: '110_trash_provider', frontendKey: 'utilitiesConnectivity.trashProvider', csvHeader: 'Trash Provider', label: 'Trash Provider', group: 'Utilities & Connectivity', type: 'string' },
  { fieldNumber: 111, apiKey: '111_internet_providers_top3', frontendKey: 'utilitiesConnectivity.internetProvidersTop3', csvHeader: 'Internet Providers (Top 3)', label: 'Internet Providers (Top 3)', group: 'Utilities & Connectivity', type: 'string' },
  { fieldNumber: 112, apiKey: '112_max_internet_speed', frontendKey: 'utilitiesConnectivity.maxInternetSpeed', csvHeader: 'Max Internet Speed', label: 'Max Internet Speed', group: 'Utilities & Connectivity', type: 'string' },
  { fieldNumber: 113, apiKey: '113_fiber_available', frontendKey: 'utilitiesConnectivity.fiberAvailable', csvHeader: 'Fiber Available', label: 'Fiber Available', group: 'Utilities & Connectivity', type: 'string' },
  { fieldNumber: 114, apiKey: '114_cable_tv_provider', frontendKey: 'utilitiesConnectivity.cableTvProvider', csvHeader: 'Cable TV Provider', label: 'Cable TV Provider', group: 'Utilities & Connectivity', type: 'string' },
  { fieldNumber: 115, apiKey: '115_cell_coverage_quality', frontendKey: 'utilitiesConnectivity.cellCoverageQuality', csvHeader: 'Cell Coverage Quality', label: 'Cell Coverage Quality', group: 'Utilities & Connectivity', type: 'string' },
  { fieldNumber: 116, apiKey: '116_emergency_services_distance', frontendKey: 'utilitiesConnectivity.emergencyServicesDistance', csvHeader: 'Emergency Services Distance', label: 'Emergency Services Distance', group: 'Utilities & Connectivity', type: 'string' },

  // ================================================================
  // GROUP 15: Environment & Risk (Fields 117-130)
  // ================================================================
  { fieldNumber: 117, apiKey: '117_air_quality_index', frontendKey: 'environmentRisk.airQualityIndex', csvHeader: 'Air Quality Index', label: 'Air Quality Index', group: 'Environment & Risk', type: 'string' },
  { fieldNumber: 118, apiKey: '118_air_quality_grade', frontendKey: 'environmentRisk.airQualityGrade', csvHeader: 'Air Quality Grade', label: 'Air Quality Grade', group: 'Environment & Risk', type: 'string' },
  { fieldNumber: 119, apiKey: '119_flood_zone', frontendKey: 'environmentRisk.floodZone', csvHeader: 'Flood Zone', label: 'Flood Zone', group: 'Environment & Risk', type: 'string' },
  { fieldNumber: 120, apiKey: '120_flood_risk_level', frontendKey: 'environmentRisk.floodRiskLevel', csvHeader: 'Flood Risk Level', label: 'Flood Risk Level', group: 'Environment & Risk', type: 'string' },
  { fieldNumber: 121, apiKey: '121_climate_risk', frontendKey: 'environmentRisk.climateRisk', csvHeader: 'Climate Risk', label: 'Climate Risk', group: 'Environment & Risk', type: 'string' },
  { fieldNumber: 122, apiKey: '122_wildfire_risk', frontendKey: 'environmentRisk.wildfireRisk', csvHeader: 'Wildfire Risk', label: 'Wildfire Risk', group: 'Environment & Risk', type: 'string' },
  { fieldNumber: 123, apiKey: '123_earthquake_risk', frontendKey: 'environmentRisk.earthquakeRisk', csvHeader: 'Earthquake Risk', label: 'Earthquake Risk', group: 'Environment & Risk', type: 'string' },
  { fieldNumber: 124, apiKey: '124_hurricane_risk', frontendKey: 'environmentRisk.hurricaneRisk', csvHeader: 'Hurricane Risk', label: 'Hurricane Risk', group: 'Environment & Risk', type: 'string' },
  { fieldNumber: 125, apiKey: '125_tornado_risk', frontendKey: 'environmentRisk.tornadoRisk', csvHeader: 'Tornado Risk', label: 'Tornado Risk', group: 'Environment & Risk', type: 'string' },
  { fieldNumber: 126, apiKey: '126_radon_risk', frontendKey: 'environmentRisk.radonRisk', csvHeader: 'Radon Risk', label: 'Radon Risk', group: 'Environment & Risk', type: 'string' },
  { fieldNumber: 127, apiKey: '127_superfund_site_nearby', frontendKey: 'environmentRisk.superfundSiteNearby', csvHeader: 'Superfund Site Nearby', label: 'Superfund Site Nearby', group: 'Environment & Risk', type: 'string' },
  { fieldNumber: 128, apiKey: '128_sea_level_rise_risk', frontendKey: 'environmentRisk.seaLevelRiseRisk', csvHeader: 'Sea Level Rise Risk', label: 'Sea Level Rise Risk', group: 'Environment & Risk', type: 'string' },
  { fieldNumber: 129, apiKey: '129_noise_level_db_est', frontendKey: 'environmentRisk.noiseLevelDbEst', csvHeader: 'Noise Level (dB Est)', label: 'Noise Level (dB Est)', group: 'Environment & Risk', type: 'string' },
  { fieldNumber: 130, apiKey: '130_solar_potential', frontendKey: 'environmentRisk.solarPotential', csvHeader: 'Solar Potential', label: 'Solar Potential', group: 'Environment & Risk', type: 'string' },

  // ================================================================
  // GROUP 16: Additional Features (Fields 131-138)
  // ================================================================
  { fieldNumber: 131, apiKey: '131_view_type', frontendKey: 'additionalFeatures.viewType', csvHeader: 'View Type', label: 'View Type', group: 'Additional Features', type: 'string' },
  { fieldNumber: 132, apiKey: '132_lot_features', frontendKey: 'additionalFeatures.lotFeatures', csvHeader: 'Lot Features', label: 'Lot Features', group: 'Additional Features', type: 'string' },
  { fieldNumber: 133, apiKey: '133_ev_charging', frontendKey: 'additionalFeatures.evCharging', csvHeader: 'EV Charging', label: 'EV Charging', group: 'Additional Features', type: 'string' },
  { fieldNumber: 134, apiKey: '134_smart_home_features', frontendKey: 'additionalFeatures.smartHomeFeatures', csvHeader: 'Smart Home Features', label: 'Smart Home Features', group: 'Additional Features', type: 'string' },
  { fieldNumber: 135, apiKey: '135_accessibility_modifications', frontendKey: 'additionalFeatures.accessibilityModifications', csvHeader: 'Accessibility Modifications', label: 'Accessibility Modifications', group: 'Additional Features', type: 'string' },
  { fieldNumber: 136, apiKey: '136_pet_policy', frontendKey: 'additionalFeatures.petPolicy', csvHeader: 'Pet Policy', label: 'Pet Policy', group: 'Additional Features', type: 'string' },
  { fieldNumber: 137, apiKey: '137_age_restrictions', frontendKey: 'additionalFeatures.ageRestrictions', csvHeader: 'Age Restrictions', label: 'Age Restrictions', group: 'Additional Features', type: 'string' },
  { fieldNumber: 138, apiKey: '138_special_assessments', frontendKey: 'additionalFeatures.specialAssessments', csvHeader: 'Special Assessments', label: 'Special Assessments', group: 'Additional Features', type: 'string' },

  // ================================================================
  // STELLAR MLS FIELDS (139-168)
  // ================================================================

  // GROUP 17: Stellar MLS - Parking (Fields 139-143)
  { fieldNumber: 139, apiKey: '139_carport_yn', frontendKey: 'stellarMLS.parking.carportYn', csvHeader: 'Carport Y/N', label: 'Carport Y/N', group: 'Stellar MLS - Parking', type: 'boolean' },
  { fieldNumber: 140, apiKey: '140_carport_spaces', frontendKey: 'stellarMLS.parking.carportSpaces', csvHeader: 'Carport Spaces', label: 'Carport Spaces', group: 'Stellar MLS - Parking', type: 'number' },
  { fieldNumber: 141, apiKey: '141_garage_attached_yn', frontendKey: 'stellarMLS.parking.garageAttachedYn', csvHeader: 'Garage Attached Y/N', label: 'Garage Attached Y/N', group: 'Stellar MLS - Parking', type: 'boolean' },
  { fieldNumber: 142, apiKey: '142_parking_features', frontendKey: 'stellarMLS.parking.parkingFeatures', csvHeader: 'Parking Features', label: 'Parking Features', group: 'Stellar MLS - Parking', type: 'array' },
  { fieldNumber: 143, apiKey: '143_assigned_parking_spaces', frontendKey: 'stellarMLS.parking.assignedParkingSpaces', csvHeader: 'Assigned Parking Spaces', label: 'Assigned Parking Spaces', group: 'Stellar MLS - Parking', type: 'number' },

  // GROUP 18: Stellar MLS - Building (Fields 144-148)
  { fieldNumber: 144, apiKey: '144_floor_number', frontendKey: 'stellarMLS.building.floorNumber', csvHeader: 'Floor Number', label: 'Floor Number', group: 'Stellar MLS - Building', type: 'number' },
  { fieldNumber: 145, apiKey: '145_building_total_floors', frontendKey: 'stellarMLS.building.buildingTotalFloors', csvHeader: 'Building Total Floors', label: 'Building Total Floors', group: 'Stellar MLS - Building', type: 'number' },
  { fieldNumber: 146, apiKey: '146_building_name_number', frontendKey: 'stellarMLS.building.buildingNameNumber', csvHeader: 'Building Name/Number', label: 'Building Name/Number', group: 'Stellar MLS - Building', type: 'string' },
  { fieldNumber: 147, apiKey: '147_building_elevator_yn', frontendKey: 'stellarMLS.building.buildingElevatorYn', csvHeader: 'Building Elevator Y/N', label: 'Building Elevator Y/N', group: 'Stellar MLS - Building', type: 'boolean' },
  { fieldNumber: 148, apiKey: '148_floors_in_unit', frontendKey: 'stellarMLS.building.floorsInUnit', csvHeader: 'Floors in Unit', label: 'Floors in Unit', group: 'Stellar MLS - Building', type: 'number' },

  // GROUP 19: Stellar MLS - Legal (Fields 149-154)
  { fieldNumber: 149, apiKey: '149_subdivision_name', frontendKey: 'stellarMLS.legal.subdivisionName', csvHeader: 'Subdivision Name', label: 'Subdivision Name', group: 'Stellar MLS - Legal', type: 'string' },
  { fieldNumber: 150, apiKey: '150_legal_description', frontendKey: 'stellarMLS.legal.legalDescription', csvHeader: 'Legal Description', label: 'Legal Description', group: 'Stellar MLS - Legal', type: 'string' },
  { fieldNumber: 151, apiKey: '151_homestead_yn', frontendKey: 'stellarMLS.legal.homesteadYn', csvHeader: 'Homestead Exemption', label: 'Homestead Exemption', group: 'Stellar MLS - Legal', type: 'boolean' },
  { fieldNumber: 152, apiKey: '152_cdd_yn', frontendKey: 'stellarMLS.legal.cddYn', csvHeader: 'CDD Y/N', label: 'CDD Y/N', group: 'Stellar MLS - Legal', type: 'boolean' },
  { fieldNumber: 153, apiKey: '153_annual_cdd_fee', frontendKey: 'stellarMLS.legal.annualCddFee', csvHeader: 'Annual CDD Fee', label: 'Annual CDD Fee', group: 'Stellar MLS - Legal', type: 'number' },
  { fieldNumber: 154, apiKey: '154_front_exposure', frontendKey: 'stellarMLS.legal.frontExposure', csvHeader: 'Front Exposure', label: 'Front Exposure', group: 'Stellar MLS - Legal', type: 'string' },

  // GROUP 20: Stellar MLS - Waterfront (Fields 155-159)
  { fieldNumber: 155, apiKey: '155_water_frontage_yn', frontendKey: 'stellarMLS.waterfront.waterFrontageYn', csvHeader: 'Water Frontage Y/N', label: 'Water Frontage Y/N', group: 'Stellar MLS - Waterfront', type: 'boolean' },
  { fieldNumber: 156, apiKey: '156_waterfront_feet', frontendKey: 'stellarMLS.waterfront.waterfrontFeet', csvHeader: 'Waterfront Feet', label: 'Waterfront Feet', group: 'Stellar MLS - Waterfront', type: 'number' },
  { fieldNumber: 157, apiKey: '157_water_access_yn', frontendKey: 'stellarMLS.waterfront.waterAccessYn', csvHeader: 'Water Access Y/N', label: 'Water Access Y/N', group: 'Stellar MLS - Waterfront', type: 'boolean' },
  { fieldNumber: 158, apiKey: '158_water_view_yn', frontendKey: 'stellarMLS.waterfront.waterViewYn', csvHeader: 'Water View Y/N', label: 'Water View Y/N', group: 'Stellar MLS - Waterfront', type: 'boolean' },
  { fieldNumber: 159, apiKey: '159_water_body_name', frontendKey: 'stellarMLS.waterfront.waterBodyName', csvHeader: 'Water Body Name', label: 'Water Body Name', group: 'Stellar MLS - Waterfront', type: 'string' },

  // GROUP 21: Stellar MLS - Leasing (Fields 160-165)
  { fieldNumber: 160, apiKey: '160_can_be_leased_yn', frontendKey: 'stellarMLS.leasing.canBeLeasedYn', csvHeader: 'Can Be Leased Y/N', label: 'Can Be Leased Y/N', group: 'Stellar MLS - Leasing', type: 'boolean' },
  { fieldNumber: 161, apiKey: '161_minimum_lease_period', frontendKey: 'stellarMLS.leasing.minimumLeasePeriod', csvHeader: 'Minimum Lease Period', label: 'Minimum Lease Period', group: 'Stellar MLS - Leasing', type: 'string' },
  { fieldNumber: 162, apiKey: '162_lease_restrictions_yn', frontendKey: 'stellarMLS.leasing.leaseRestrictionsYn', csvHeader: 'Lease Restrictions Y/N', label: 'Lease Restrictions Y/N', group: 'Stellar MLS - Leasing', type: 'boolean' },
  { fieldNumber: 163, apiKey: '163_pet_size_limit', frontendKey: 'stellarMLS.leasing.petSizeLimit', csvHeader: 'Pet Size Limit', label: 'Pet Size Limit', group: 'Stellar MLS - Leasing', type: 'string' },
  { fieldNumber: 164, apiKey: '164_max_pet_weight', frontendKey: 'stellarMLS.leasing.maxPetWeight', csvHeader: 'Max Pet Weight (lbs)', label: 'Max Pet Weight (lbs)', group: 'Stellar MLS - Leasing', type: 'number' },
  { fieldNumber: 165, apiKey: '165_association_approval_yn', frontendKey: 'stellarMLS.leasing.associationApprovalYn', csvHeader: 'Association Approval Req', label: 'Association Approval Req', group: 'Stellar MLS - Leasing', type: 'boolean' },

  // GROUP 22: Stellar MLS - Features (Fields 166-168)
  { fieldNumber: 166, apiKey: '166_community_features', frontendKey: 'stellarMLS.features.communityFeatures', csvHeader: 'Community Features', label: 'Community Features', group: 'Stellar MLS - Features', type: 'array' },
  { fieldNumber: 167, apiKey: '167_interior_features', frontendKey: 'stellarMLS.features.interiorFeatures', csvHeader: 'Interior Features', label: 'Interior Features', group: 'Stellar MLS - Features', type: 'array' },
  { fieldNumber: 168, apiKey: '168_exterior_features', frontendKey: 'stellarMLS.features.exteriorFeatures', csvHeader: 'Exterior Features', label: 'Exterior Features', group: 'Stellar MLS - Features', type: 'array' },
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
 * @example apiKeyToFrontendKey('10_listing_price') => 'pricingValue.listingPrice'
 */
export function apiKeyToFrontendKey(apiKey: string): string | null {
  const mapping = apiToFrontendMap.get(apiKey);
  return mapping?.frontendKey || null;
}

/**
 * Convert frontend key to API field key
 * @example frontendKeyToApiKey('pricingValue.listingPrice') => '10_listing_price'
 */
export function frontendKeyToApiKey(frontendKey: string): string | null {
  const mapping = frontendToApiMap.get(frontendKey);
  return mapping?.apiKey || null;
}

/**
 * Get field mapping by field number
 * @example getFieldByNumber(10) => { apiKey: '10_listing_price', ... }
 */
export function getFieldByNumber(fieldNumber: number): FieldMapping | null {
  return fieldNumberToMapping.get(fieldNumber) || null;
}

/**
 * Get field mapping by CSV header (case-insensitive)
 * @example getFieldByCsvHeader('Listing Price') => { apiKey: '10_listing_price', ... }
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
 * Supports both API key format (10_listing_price) and CSV header format (Listing Price)
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
