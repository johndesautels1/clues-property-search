/**
 * CLUES Property Dashboard - Unified Field Normalizer
 *
 * SINGLE SOURCE OF TRUTH for mapping flat 168-field API keys to the nested Property interface.
 * This MUST be the only place where field→path mapping is defined.
 * Updated: 2025-11-30 - Added 30 Stellar MLS fields (139-168)
 *
 * API returns: { "7_listing_price": { value: 450000, source: "Zillow" } }
 * Property type expects: property.address.listingPrice.value = 450000
 */

import type { Property, DataField, ConfidenceLevel } from '@/types/property';

export interface FlatFieldData {
  value: any;
  source?: string;
  confidence?: 'High' | 'Medium' | 'Low' | 'Unverified';
  llmSources?: string[];
  validationStatus?: 'passed' | 'failed' | 'warning' | 'valid' | 'single_source_warning';
  validationMessage?: string;
}

type GroupName = 'address' | 'details' | 'structural' | 'location' | 'financial' | 'utilities' | 'stellarMLS.parking' | 'stellarMLS.building' | 'stellarMLS.legal' | 'stellarMLS.waterfront' | 'stellarMLS.leasing' | 'stellarMLS.features';

interface FieldPathMapping {
  fieldNumber: number;
  apiKey: string;
  group: GroupName;
  propName: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'any';
  validation?: (val: any) => boolean;
}

/**
 * Complete 168-field mapping to Property interface structure
 * UPDATED: 2025-11-30 - Corrected ALL field numbers to match fields-schema.ts
 * group = the top-level object in Property (address, details, structural, location, financial, utilities, stellarMLS.*)
 * propName = the property name within that group
 */
export const FIELD_TO_PROPERTY_MAP: FieldPathMapping[] = [
  // ========== GROUP 1: Address & Identity (Fields 1-9) ==========
  { fieldNumber: 1, apiKey: '1_full_address', group: 'address', propName: 'fullAddress', type: 'string' },
  { fieldNumber: 2, apiKey: '2_mls_primary', group: 'address', propName: 'mlsPrimary', type: 'string' },
  { fieldNumber: 3, apiKey: '3_mls_secondary', group: 'address', propName: 'mlsSecondary', type: 'string' },
  { fieldNumber: 4, apiKey: '4_listing_status', group: 'address', propName: 'listingStatus', type: 'string' },
  { fieldNumber: 5, apiKey: '5_listing_date', group: 'address', propName: 'listingDate', type: 'date' },
  { fieldNumber: 6, apiKey: '6_neighborhood', group: 'address', propName: 'neighborhoodName', type: 'string' },
  { fieldNumber: 7, apiKey: '7_county', group: 'address', propName: 'county', type: 'string' },
  { fieldNumber: 8, apiKey: '8_zip_code', group: 'address', propName: 'zipCode', type: 'string' },
  { fieldNumber: 9, apiKey: '9_parcel_id', group: 'details', propName: 'parcelId', type: 'string' },

  // ========== GROUP 2: Pricing & Value (Fields 10-16) ==========
  { fieldNumber: 10, apiKey: '10_listing_price', group: 'address', propName: 'listingPrice', type: 'number', validation: (v) => v > 0 && v < 1000000000 },
  { fieldNumber: 11, apiKey: '11_price_per_sqft', group: 'address', propName: 'pricePerSqft', type: 'number', validation: (v) => v > 0 && v < 50000 },
  { fieldNumber: 12, apiKey: '12_market_value_estimate', group: 'details', propName: 'marketValueEstimate', type: 'number', validation: (v) => v > 0 && v < 1000000000 },
  { fieldNumber: 13, apiKey: '13_last_sale_date', group: 'details', propName: 'lastSaleDate', type: 'date' },
  { fieldNumber: 14, apiKey: '14_last_sale_price', group: 'details', propName: 'lastSalePrice', type: 'number', validation: (v) => v > 0 && v < 1000000000 },
  { fieldNumber: 15, apiKey: '15_assessed_value', group: 'details', propName: 'assessedValue', type: 'number', validation: (v) => v > 0 && v < 1000000000 },
  { fieldNumber: 16, apiKey: '16_redfin_estimate', group: 'financial', propName: 'redfinEstimate', type: 'number' },

  // ========== GROUP 3: Property Basics (Fields 17-29) ==========
  { fieldNumber: 17, apiKey: '17_bedrooms', group: 'details', propName: 'bedrooms', type: 'number', validation: (v) => v >= 0 && v <= 50 },
  { fieldNumber: 18, apiKey: '18_full_bathrooms', group: 'details', propName: 'fullBathrooms', type: 'number', validation: (v) => v >= 0 && v <= 30 },
  { fieldNumber: 19, apiKey: '19_half_bathrooms', group: 'details', propName: 'halfBathrooms', type: 'number', validation: (v) => v >= 0 && v <= 20 },
  { fieldNumber: 20, apiKey: '20_total_bathrooms', group: 'details', propName: 'totalBathrooms', type: 'number', validation: (v) => v >= 0 && v <= 50 },
  { fieldNumber: 21, apiKey: '21_living_sqft', group: 'details', propName: 'livingSqft', type: 'number', validation: (v) => v > 0 && v < 100000 },
  { fieldNumber: 22, apiKey: '22_total_sqft_under_roof', group: 'details', propName: 'totalSqftUnderRoof', type: 'number', validation: (v) => v > 0 && v < 150000 },
  { fieldNumber: 23, apiKey: '23_lot_size_sqft', group: 'details', propName: 'lotSizeSqft', type: 'number', validation: (v) => v > 0 },
  { fieldNumber: 24, apiKey: '24_lot_size_acres', group: 'details', propName: 'lotSizeAcres', type: 'number', validation: (v) => v > 0 },
  { fieldNumber: 25, apiKey: '25_year_built', group: 'details', propName: 'yearBuilt', type: 'number', validation: (v) => v >= 1700 && v <= new Date().getFullYear() + 2 },
  { fieldNumber: 26, apiKey: '26_property_type', group: 'details', propName: 'propertyType', type: 'string' },
  { fieldNumber: 27, apiKey: '27_stories', group: 'details', propName: 'stories', type: 'number', validation: (v) => v >= 1 && v <= 100 },
  { fieldNumber: 28, apiKey: '28_garage_spaces', group: 'details', propName: 'garageSpaces', type: 'number', validation: (v) => v >= 0 && v <= 20 },
  { fieldNumber: 29, apiKey: '29_parking_total', group: 'details', propName: 'parkingTotal', type: 'string' },

  // ========== GROUP 4: HOA & Taxes (Fields 30-38) ==========
  { fieldNumber: 30, apiKey: '30_hoa_yn', group: 'details', propName: 'hoaYn', type: 'boolean' },
  { fieldNumber: 31, apiKey: '31_hoa_fee_annual', group: 'details', propName: 'hoaFeeAnnual', type: 'number', validation: (v) => v >= 0 && v < 500000 },
  { fieldNumber: 32, apiKey: '32_hoa_name', group: 'details', propName: 'hoaName', type: 'string' },
  { fieldNumber: 33, apiKey: '33_hoa_includes', group: 'details', propName: 'hoaIncludes', type: 'string' },
  { fieldNumber: 34, apiKey: '34_ownership_type', group: 'details', propName: 'ownershipType', type: 'string' },
  { fieldNumber: 35, apiKey: '35_annual_taxes', group: 'details', propName: 'annualTaxes', type: 'number', validation: (v) => v >= 0 && v < 200000 },
  { fieldNumber: 36, apiKey: '36_tax_year', group: 'details', propName: 'taxYear', type: 'number', validation: (v) => v >= 1900 && v <= new Date().getFullYear() + 1 },
  { fieldNumber: 37, apiKey: '37_property_tax_rate', group: 'financial', propName: 'propertyTaxRate', type: 'number' },
  { fieldNumber: 38, apiKey: '38_tax_exemptions', group: 'financial', propName: 'taxExemptions', type: 'string' },

  // ========== GROUP 5: Structure & Systems (Fields 39-48) ==========
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

  // ========== GROUP 6: Interior Features (Fields 49-53) ==========
  { fieldNumber: 49, apiKey: '49_flooring_type', group: 'structural', propName: 'flooringType', type: 'string' },
  { fieldNumber: 50, apiKey: '50_kitchen_features', group: 'structural', propName: 'kitchenFeatures', type: 'string' },
  { fieldNumber: 51, apiKey: '51_appliances_included', group: 'structural', propName: 'appliancesIncluded', type: 'array' },
  { fieldNumber: 52, apiKey: '52_fireplace_yn', group: 'structural', propName: 'fireplaceYn', type: 'boolean' },
  { fieldNumber: 53, apiKey: '53_fireplace_count', group: 'structural', propName: 'fireplaceCount', type: 'number' },

  // ========== GROUP 7: Exterior Features (Fields 54-58) ==========
  { fieldNumber: 54, apiKey: '54_pool_yn', group: 'structural', propName: 'poolYn', type: 'boolean' },
  { fieldNumber: 55, apiKey: '55_pool_type', group: 'structural', propName: 'poolType', type: 'string' },
  { fieldNumber: 56, apiKey: '56_deck_patio', group: 'structural', propName: 'deckPatio', type: 'string' },
  { fieldNumber: 57, apiKey: '57_fence', group: 'structural', propName: 'fence', type: 'string' },
  { fieldNumber: 58, apiKey: '58_landscaping', group: 'structural', propName: 'landscaping', type: 'string' },

  // ========== GROUP 8: Permits & Renovations (Fields 59-62) ==========
  { fieldNumber: 59, apiKey: '59_recent_renovations', group: 'structural', propName: 'recentRenovations', type: 'string' },
  { fieldNumber: 60, apiKey: '60_permit_history_roof', group: 'structural', propName: 'permitHistoryRoof', type: 'string' },
  { fieldNumber: 61, apiKey: '61_permit_history_hvac', group: 'structural', propName: 'permitHistoryHvac', type: 'string' },
  { fieldNumber: 62, apiKey: '62_permit_history_other', group: 'structural', propName: 'permitHistoryPoolAdditions', type: 'string' },

  // ========== GROUP 9: Schools (Fields 63-73) ==========
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

  // ========== GROUP 10: Location Scores (Fields 74-82) ==========
  { fieldNumber: 74, apiKey: '74_walk_score', group: 'location', propName: 'walkScore', type: 'any' },
  { fieldNumber: 75, apiKey: '75_transit_score', group: 'location', propName: 'transitScore', type: 'any' },
  { fieldNumber: 76, apiKey: '76_bike_score', group: 'location', propName: 'bikeScore', type: 'any' },
  { fieldNumber: 77, apiKey: '77_safety_score', group: 'location', propName: 'neighborhoodSafetyRating', type: 'string' },
  { fieldNumber: 78, apiKey: '78_noise_level', group: 'location', propName: 'noiseLevel', type: 'string' },
  { fieldNumber: 79, apiKey: '79_traffic_level', group: 'location', propName: 'trafficLevel', type: 'string' },
  { fieldNumber: 80, apiKey: '80_walkability_description', group: 'location', propName: 'walkabilityDescription', type: 'string' },
  { fieldNumber: 81, apiKey: '81_public_transit_access', group: 'location', propName: 'publicTransitAccess', type: 'string' },
  { fieldNumber: 82, apiKey: '82_commute_to_city_center', group: 'location', propName: 'commuteTimeCityCenter', type: 'string' },

  // ========== GROUP 11: Distances (Fields 83-87) ==========
  { fieldNumber: 83, apiKey: '83_distance_grocery_mi', group: 'location', propName: 'distanceGroceryMiles', type: 'number' },
  { fieldNumber: 84, apiKey: '84_distance_hospital_mi', group: 'location', propName: 'distanceHospitalMiles', type: 'number' },
  { fieldNumber: 85, apiKey: '85_distance_airport_mi', group: 'location', propName: 'distanceAirportMiles', type: 'number' },
  { fieldNumber: 86, apiKey: '86_distance_park_mi', group: 'location', propName: 'distanceParkMiles', type: 'number' },
  { fieldNumber: 87, apiKey: '87_distance_beach_mi', group: 'location', propName: 'distanceBeachMiles', type: 'number' },

  // ========== GROUP 12: Safety & Crime (Fields 88-90) ==========
  { fieldNumber: 88, apiKey: '88_violent_crime_index', group: 'location', propName: 'crimeIndexViolent', type: 'string' },
  { fieldNumber: 89, apiKey: '89_property_crime_index', group: 'location', propName: 'crimeIndexProperty', type: 'string' },
  { fieldNumber: 90, apiKey: '90_neighborhood_safety_rating', group: 'location', propName: 'neighborhoodSafetyRating', type: 'string' },

  // ========== GROUP 13: Market & Investment (Fields 91-103) ==========
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

  // ========== GROUP 14: Utilities (Fields 104-116) ==========
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

  // ========== GROUP 15: Environment & Risk (Fields 117-130) ==========
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

  // ========== GROUP 16: Additional Features (Fields 131-138) ==========
  { fieldNumber: 131, apiKey: '131_view_type', group: 'utilities', propName: 'viewType', type: 'string' },
  { fieldNumber: 132, apiKey: '132_lot_features', group: 'utilities', propName: 'lotFeatures', type: 'string' },
  { fieldNumber: 133, apiKey: '133_ev_charging', group: 'utilities', propName: 'evChargingYn', type: 'string' },
  { fieldNumber: 134, apiKey: '134_smart_home_features', group: 'utilities', propName: 'smartHomeFeatures', type: 'string' },
  { fieldNumber: 135, apiKey: '135_accessibility_modifications', group: 'utilities', propName: 'accessibilityMods', type: 'string' },
  { fieldNumber: 136, apiKey: '136_pet_policy', group: 'utilities', propName: 'petPolicy', type: 'string' },
  { fieldNumber: 137, apiKey: '137_age_restrictions', group: 'utilities', propName: 'ageRestrictions', type: 'string' },
  { fieldNumber: 138, apiKey: '138_special_assessments', group: 'financial', propName: 'specialAssessments', type: 'string' },

  // ========== GROUP 17: Stellar MLS - Parking (Fields 139-143) ==========
  { fieldNumber: 139, apiKey: '139_carport_yn', group: 'stellarMLS.parking', propName: 'carportYn', type: 'boolean' },
  { fieldNumber: 140, apiKey: '140_carport_spaces', group: 'stellarMLS.parking', propName: 'carportSpaces', type: 'number', validation: (v) => v >= 0 && v <= 20 },
  { fieldNumber: 141, apiKey: '141_garage_attached_yn', group: 'stellarMLS.parking', propName: 'garageAttachedYn', type: 'boolean' },
  { fieldNumber: 142, apiKey: '142_parking_features', group: 'stellarMLS.parking', propName: 'parkingFeatures', type: 'array' },
  { fieldNumber: 143, apiKey: '143_assigned_parking_spaces', group: 'stellarMLS.parking', propName: 'assignedParkingSpaces', type: 'number', validation: (v) => v >= 0 && v <= 20 },

  // ========== GROUP 18: Stellar MLS - Building (Fields 144-148) ==========
  { fieldNumber: 144, apiKey: '144_floor_number', group: 'stellarMLS.building', propName: 'floorNumber', type: 'number', validation: (v) => v >= 0 && v <= 200 },
  { fieldNumber: 145, apiKey: '145_building_total_floors', group: 'stellarMLS.building', propName: 'buildingTotalFloors', type: 'number', validation: (v) => v >= 1 && v <= 200 },
  { fieldNumber: 146, apiKey: '146_building_name_number', group: 'stellarMLS.building', propName: 'buildingNameNumber', type: 'string' },
  { fieldNumber: 147, apiKey: '147_building_elevator_yn', group: 'stellarMLS.building', propName: 'buildingElevatorYn', type: 'boolean' },
  { fieldNumber: 148, apiKey: '148_floors_in_unit', group: 'stellarMLS.building', propName: 'floorsInUnit', type: 'number', validation: (v) => v >= 1 && v <= 10 },

  // ========== GROUP 19: Stellar MLS - Legal (Fields 149-154) ==========
  { fieldNumber: 149, apiKey: '149_subdivision_name', group: 'stellarMLS.legal', propName: 'subdivisionName', type: 'string' },
  { fieldNumber: 150, apiKey: '150_legal_description', group: 'stellarMLS.legal', propName: 'legalDescription', type: 'string' },
  { fieldNumber: 151, apiKey: '151_homestead_yn', group: 'stellarMLS.legal', propName: 'homesteadYn', type: 'boolean' },
  { fieldNumber: 152, apiKey: '152_cdd_yn', group: 'stellarMLS.legal', propName: 'cddYn', type: 'boolean' },
  { fieldNumber: 153, apiKey: '153_annual_cdd_fee', group: 'stellarMLS.legal', propName: 'annualCddFee', type: 'number', validation: (v) => v >= 0 && v < 50000 },
  { fieldNumber: 154, apiKey: '154_front_exposure', group: 'stellarMLS.legal', propName: 'frontExposure', type: 'string' },

  // ========== GROUP 20: Stellar MLS - Waterfront (Fields 155-159) ==========
  { fieldNumber: 155, apiKey: '155_water_frontage_yn', group: 'stellarMLS.waterfront', propName: 'waterFrontageYn', type: 'boolean' },
  { fieldNumber: 156, apiKey: '156_waterfront_feet', group: 'stellarMLS.waterfront', propName: 'waterfrontFeet', type: 'number', validation: (v) => v >= 0 && v < 10000 },
  { fieldNumber: 157, apiKey: '157_water_access_yn', group: 'stellarMLS.waterfront', propName: 'waterAccessYn', type: 'boolean' },
  { fieldNumber: 158, apiKey: '158_water_view_yn', group: 'stellarMLS.waterfront', propName: 'waterViewYn', type: 'boolean' },
  { fieldNumber: 159, apiKey: '159_water_body_name', group: 'stellarMLS.waterfront', propName: 'waterBodyName', type: 'string' },

  // ========== GROUP 21: Stellar MLS - Leasing (Fields 160-165) ==========
  { fieldNumber: 160, apiKey: '160_can_be_leased_yn', group: 'stellarMLS.leasing', propName: 'canBeLeasedYn', type: 'boolean' },
  { fieldNumber: 161, apiKey: '161_minimum_lease_period', group: 'stellarMLS.leasing', propName: 'minimumLeasePeriod', type: 'string' },
  { fieldNumber: 162, apiKey: '162_lease_restrictions_yn', group: 'stellarMLS.leasing', propName: 'leaseRestrictionsYn', type: 'boolean' },
  { fieldNumber: 163, apiKey: '163_pet_size_limit', group: 'stellarMLS.leasing', propName: 'petSizeLimit', type: 'string' },
  { fieldNumber: 164, apiKey: '164_max_pet_weight', group: 'stellarMLS.leasing', propName: 'maxPetWeight', type: 'number', validation: (v) => v >= 0 && v <= 500 },
  { fieldNumber: 165, apiKey: '165_association_approval_yn', group: 'stellarMLS.leasing', propName: 'associationApprovalYn', type: 'boolean' },

  // ========== GROUP 22: Stellar MLS - Features (Fields 166-168) ==========
  { fieldNumber: 166, apiKey: '166_community_features', group: 'stellarMLS.features', propName: 'communityFeatures', type: 'array' },
  { fieldNumber: 167, apiKey: '167_interior_features', group: 'stellarMLS.features', propName: 'interiorFeatures', type: 'array' },
  { fieldNumber: 168, apiKey: '168_exterior_features', group: 'stellarMLS.features', propName: 'exteriorFeatures', type: 'array' },
];

const apiKeyToMappingMap = new Map<string, FieldPathMapping>();
FIELD_TO_PROPERTY_MAP.forEach(mapping => {
  apiKeyToMappingMap.set(mapping.apiKey, mapping);
});

const fieldNumberToMappingMap = new Map<number, FieldPathMapping>();
FIELD_TO_PROPERTY_MAP.forEach(mapping => {
  fieldNumberToMappingMap.set(mapping.fieldNumber, mapping);
});

/**
 * Create a properly typed DataField from raw API data
 */
function createDataField<T>(
  value: T | null,
  confidence: ConfidenceLevel = 'Medium',
  source: string = 'Unknown',
  llmSources: string[] = [],
  hasConflict: boolean = false,
  conflictValues: Array<{ source: string; value: any }> = [],
  validationStatus?: 'passed' | 'failed' | 'warning' | 'valid' | 'single_source_warning',
  validationMessage?: string
): DataField<T> {
  return {
    value,
    confidence,
    notes: source,
    sources: [source],
    llmSources,
    hasConflict,
    conflictValues,
    lastUpdated: new Date().toISOString(),
    validationStatus,
    validationMessage,
  };
}

/**
 * Map API confidence strings to our ConfidenceLevel type
 */
function mapConfidence(apiConf?: string): ConfidenceLevel {
  if (!apiConf) return 'Medium';
  const lower = apiConf.toLowerCase();
  if (lower === 'high' || lower === 'verified') return 'High';
  if (lower === 'medium-high') return 'Medium-High';
  if (lower === 'medium') return 'Medium';
  return 'Low';
}

/**
 * Validate and coerce value based on expected type
 */
function validateAndCoerce(value: any, mapping: FieldPathMapping): { valid: boolean; coerced: any } {
  if (value === null || value === undefined || value === '') {
    return { valid: false, coerced: null };
  }

  let coerced = value;

  switch (mapping.type) {
    case 'number':
      if (typeof value === 'string') {
        coerced = parseFloat(value.replace(/[$,]/g, ''));
      } else if (typeof value !== 'number') {
        coerced = parseFloat(String(value));
      }
      if (isNaN(coerced)) return { valid: false, coerced: null };
      if (mapping.validation && !mapping.validation(coerced)) {
        console.warn(`Validation failed for ${mapping.apiKey}: ${coerced} out of range`);
        return { valid: false, coerced: null };
      }
      break;

    case 'boolean':
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        coerced = lower === 'true' || lower === 'yes' || lower === '1';
      } else {
        coerced = Boolean(value);
      }
      break;

    case 'array':
      if (typeof value === 'string') {
        coerced = value.split(',').map(s => s.trim()).filter(Boolean);
      } else if (!Array.isArray(value)) {
        coerced = [String(value)];
      }
      break;

    case 'date':
    case 'string':
    default:
      coerced = String(value);
      break;
  }

  return { valid: true, coerced };
}

/**
 * Normalize flat API fields to nested Property structure
 * 
 * @param flatFields - API response with flat 138-field keys like { "10_listing_price": { value: 450000, source: "Zillow" } }
 * @param propertyId - Unique ID for this property
 * @param fieldSources - Optional map of field key to LLM sources that provided it
 * @param conflicts - Optional array of field conflicts between LLMs
 * @returns Properly structured Property object matching the TypeScript interface
 */
export function normalizeToProperty(
  flatFields: Record<string, FlatFieldData>,
  propertyId: string,
  fieldSources: Record<string, string[]> = {},
  conflicts: Array<{ field: string; values: Array<{ source: string; value: any }> }> = []
): Property {
  const now = new Date().toISOString();

  const emptyDataField = <T>(defaultValue: T | null = null): DataField<T> => ({
    value: defaultValue,
    confidence: 'Low',
    notes: '',
    sources: [],
    llmSources: [],
    hasConflict: false,
    conflictValues: [],
  });

  const property: Property = {
    id: propertyId,
    createdAt: now,
    updatedAt: now,
    address: {
      fullAddress: emptyDataField(),
      mlsPrimary: emptyDataField(),
      mlsSecondary: emptyDataField(),
      listingStatus: emptyDataField(),
      listingDate: emptyDataField(),
      listingPrice: emptyDataField(),
      pricePerSqft: emptyDataField(),
      streetAddress: emptyDataField(),
      city: emptyDataField(),
      state: emptyDataField(),
      zipCode: emptyDataField(),
      county: emptyDataField(),
      latitude: emptyDataField(),
      longitude: emptyDataField(),
      neighborhoodName: emptyDataField(),
    },
    details: {
      bedrooms: emptyDataField(),
      fullBathrooms: emptyDataField(),
      halfBathrooms: emptyDataField(),
      totalBathrooms: emptyDataField(),
      livingSqft: emptyDataField(),
      totalSqftUnderRoof: emptyDataField(),
      lotSizeSqft: emptyDataField(),
      lotSizeAcres: emptyDataField(),
      yearBuilt: emptyDataField(),
      propertyType: emptyDataField(),
      stories: emptyDataField(),
      garageSpaces: emptyDataField(),
      parkingTotal: emptyDataField(),
      hoaYn: emptyDataField(),
      hoaFeeAnnual: emptyDataField(),
      hoaName: emptyDataField(),
      hoaIncludes: emptyDataField(),
      annualTaxes: emptyDataField(),
      taxYear: emptyDataField(),
      assessedValue: emptyDataField(),
      marketValueEstimate: emptyDataField(),
      lastSaleDate: emptyDataField(),
      lastSalePrice: emptyDataField(),
      ownershipType: emptyDataField(),
      parcelId: emptyDataField(),
    },
    structural: {
      roofType: emptyDataField(),
      roofAgeEst: emptyDataField(),
      exteriorMaterial: emptyDataField(),
      foundation: emptyDataField(),
      hvacType: emptyDataField(),
      hvacAge: emptyDataField(),
      waterHeaterType: emptyDataField(),
      garageType: emptyDataField(),
      flooringType: emptyDataField(),
      kitchenFeatures: emptyDataField(),
      appliancesIncluded: emptyDataField(),
      laundryType: emptyDataField(),
      fireplaceYn: emptyDataField(),
      fireplaceCount: emptyDataField(),
      poolYn: emptyDataField(),
      poolType: emptyDataField(),
      deckPatio: emptyDataField(),
      fence: emptyDataField(),
      landscaping: emptyDataField(),
      recentRenovations: emptyDataField(),
      permitHistoryRoof: emptyDataField(),
      permitHistoryHvac: emptyDataField(),
      permitHistoryPoolAdditions: emptyDataField(),
      interiorCondition: emptyDataField(),
    },
    location: {
      assignedElementary: emptyDataField(),
      elementaryRating: emptyDataField(),
      elementaryDistanceMiles: emptyDataField(),
      assignedMiddle: emptyDataField(),
      middleRating: emptyDataField(),
      middleDistanceMiles: emptyDataField(),
      assignedHigh: emptyDataField(),
      highRating: emptyDataField(),
      highDistanceMiles: emptyDataField(),
      schoolDistrictName: emptyDataField(),
      elevationFeet: emptyDataField(),
      walkScore: emptyDataField(),
      transitScore: emptyDataField(),
      bikeScore: emptyDataField(),
      distanceGroceryMiles: emptyDataField(),
      distanceHospitalMiles: emptyDataField(),
      distanceAirportMiles: emptyDataField(),
      distanceParkMiles: emptyDataField(),
      distanceBeachMiles: emptyDataField(),
      crimeIndexViolent: emptyDataField(),
      crimeIndexProperty: emptyDataField(),
      neighborhoodSafetyRating: emptyDataField(),
      noiseLevel: emptyDataField(),
      trafficLevel: emptyDataField(),
      walkabilityDescription: emptyDataField(),
      commuteTimeCityCenter: emptyDataField(),
      publicTransitAccess: emptyDataField(),
    },
    financial: {
      annualPropertyTax: emptyDataField(),
      taxExemptions: emptyDataField(),
      propertyTaxRate: emptyDataField(),
      recentTaxPaymentHistory: emptyDataField(),
      medianHomePriceNeighborhood: emptyDataField(),
      pricePerSqftRecentAvg: emptyDataField(),
      redfinEstimate: emptyDataField(),
      priceToRentRatio: emptyDataField(),
      priceVsMedianPercent: emptyDataField(),
      daysOnMarketAvg: emptyDataField(),
      inventorySurplus: emptyDataField(),
      rentalEstimateMonthly: emptyDataField(),
      rentalYieldEst: emptyDataField(),
      vacancyRateNeighborhood: emptyDataField(),
      capRateEst: emptyDataField(),
      insuranceEstAnnual: emptyDataField(),
      financingTerms: emptyDataField(),
      comparableSalesLast3: emptyDataField(),
      specialAssessments: emptyDataField(),
    },
    utilities: {
      electricProvider: emptyDataField(),
      waterProvider: emptyDataField(),
      sewerProvider: emptyDataField(),
      naturalGas: emptyDataField(),
      trashProvider: emptyDataField(),
      internetProvidersTop3: emptyDataField(),
      maxInternetSpeed: emptyDataField(),
      fiberAvailable: emptyDataField(),
      cableTvProvider: emptyDataField(),
      avgElectricBill: emptyDataField(),
      avgWaterBill: emptyDataField(),
      cellCoverageQuality: emptyDataField(),
      emergencyServicesDistance: emptyDataField(),
      airQualityIndexCurrent: emptyDataField(),
      airQualityGrade: emptyDataField(),
      floodZone: emptyDataField(),
      floodRiskLevel: emptyDataField(),
      climateRiskWildfireFlood: emptyDataField(),
      wildfireRisk: emptyDataField(),
      earthquakeRisk: emptyDataField(),
      hurricaneRisk: emptyDataField(),
      tornadoRisk: emptyDataField(),
      radonRisk: emptyDataField(),
      superfundNearby: emptyDataField(),
      seaLevelRiseRisk: emptyDataField(),
      noiseLevelDbEst: emptyDataField(),
      solarPotential: emptyDataField(),
      evChargingYn: emptyDataField(),
      smartHomeFeatures: emptyDataField(),
      accessibilityMods: emptyDataField(),
      viewType: emptyDataField(),
      lotFeatures: emptyDataField(),
      petPolicy: emptyDataField(),
      ageRestrictions: emptyDataField(),
      notesConfidenceSummary: emptyDataField(),
    },
    // NEW: Stellar MLS fields (139-168) - Added 2025-11-30
    stellarMLS: {
      parking: {
        carportYn: emptyDataField(),
        carportSpaces: emptyDataField(),
        garageAttachedYn: emptyDataField(),
        parkingFeatures: emptyDataField(),
        assignedParkingSpaces: emptyDataField(),
      },
      building: {
        floorNumber: emptyDataField(),
        buildingTotalFloors: emptyDataField(),
        buildingNameNumber: emptyDataField(),
        buildingElevatorYn: emptyDataField(),
        floorsInUnit: emptyDataField(),
      },
      legal: {
        subdivisionName: emptyDataField(),
        legalDescription: emptyDataField(),
        homesteadYn: emptyDataField(),
        cddYn: emptyDataField(),
        annualCddFee: emptyDataField(),
        frontExposure: emptyDataField(),
      },
      waterfront: {
        waterFrontageYn: emptyDataField(),
        waterfrontFeet: emptyDataField(),
        waterAccessYn: emptyDataField(),
        waterViewYn: emptyDataField(),
        waterBodyName: emptyDataField(),
      },
      leasing: {
        canBeLeasedYn: emptyDataField(),
        minimumLeasePeriod: emptyDataField(),
        leaseRestrictionsYn: emptyDataField(),
        petSizeLimit: emptyDataField(),
        maxPetWeight: emptyDataField(),
        associationApprovalYn: emptyDataField(),
      },
      features: {
        communityFeatures: emptyDataField(),
        interiorFeatures: emptyDataField(),
        exteriorFeatures: emptyDataField(),
      },
    },
  };

  let fieldsPopulated = 0;

  for (const [apiKey, fieldData] of Object.entries(flatFields)) {
    if (!fieldData) continue;

    const mapping = apiKeyToMappingMap.get(apiKey);
    if (!mapping) {
      continue;
    }

    const rawValue = fieldData.value !== undefined ? fieldData.value : fieldData;
    const { valid, coerced } = validateAndCoerce(rawValue, mapping);

    if (!valid) {
      continue;
    }

    const source = fieldData.source || 'Unknown';
    const confidence = mapConfidence(fieldData.confidence);
    const llmSources = fieldSources[apiKey] || fieldData.llmSources || [];

    const conflict = conflicts.find(c => c.field === apiKey);
    const hasConflict = !!conflict;
    const conflictValues = conflict?.values || [];

    const dataField = createDataField(
      coerced,
      confidence,
      source,
      llmSources,
      hasConflict,
      conflictValues,
      fieldData.validationStatus,
      fieldData.validationMessage
    );

    // Handle nested paths like 'stellarMLS.parking'
    if (mapping.group.startsWith('stellarMLS.')) {
      const subGroup = mapping.group.split('.')[1] as keyof typeof property.stellarMLS;
      if (property.stellarMLS && property.stellarMLS[subGroup]) {
        const target = property.stellarMLS[subGroup] as Record<string, DataField<any>>;
        if (mapping.propName in target) {
          target[mapping.propName] = dataField;
          fieldsPopulated++;
        }
      }
    } else {
      const group = property[mapping.group as keyof Property] as unknown as Record<string, DataField<any>>;
      if (group && mapping.propName in group) {
        group[mapping.propName] = dataField;
        fieldsPopulated++;
      }
    }
  }

  if (flatFields['1_full_address']?.value) {
    const fullAddr = String(flatFields['1_full_address'].value);
    const parts = fullAddr.split(',').map(s => s.trim());
    if (parts[0]) {
      property.address.streetAddress = createDataField(parts[0], 'High', 'Parsed from full address');
    }
    if (parts[1]) {
      property.address.city = createDataField(parts[1], 'High', 'Parsed from full address');
    }
    if (parts[2]) {
      const stateMatch = parts[2].match(/([A-Z]{2})/);
      const zipMatch = parts[2].match(/(\d{5})/);
      if (stateMatch) {
        property.address.state = createDataField(stateMatch[1], 'High', 'Parsed from full address');
      }
      if (zipMatch) {
        property.address.zipCode = createDataField(zipMatch[1], 'High', 'Parsed from full address');
      }
    }
  }

  if (flatFields['coordinates']?.value) {
    const coords = flatFields['coordinates'].value;
    if (coords.lat) {
      property.address.latitude = createDataField(coords.lat, 'High', 'Geocoded');
    }
    if (coords.lon || coords.lng) {
      property.address.longitude = createDataField(coords.lon || coords.lng, 'High', 'Geocoded');
    }
  }

  property.dataCompleteness = Math.round((fieldsPopulated / 168) * 100);
  property.smartScore = Math.min(100, fieldsPopulated + 20);

  return property;
}

/**
 * Get the mapping info for a field by its API key
 */
export function getFieldMapping(apiKey: string): FieldPathMapping | undefined {
  return apiKeyToMappingMap.get(apiKey);
}

/**
 * Get the mapping info for a field by its number
 */
export function getFieldMappingByNumber(fieldNumber: number): FieldPathMapping | undefined {
  return fieldNumberToMappingMap.get(fieldNumber);
}

/**
 * Get all API keys as a flat array
 */
export function getAllApiKeys(): string[] {
  return FIELD_TO_PROPERTY_MAP.map(m => m.apiKey);
}

/**
 * Data quality range definitions for Dashboard display
 * Each range corresponds to a field group in the 168-field schema
 */
export const DATA_QUALITY_RANGES = [
  { label: 'Core Fields (1-38)', min: 1, max: 38, colorClass: 'text-quantum-green' },
  { label: 'Structural (39-62)', min: 39, max: 62, colorClass: 'text-quantum-cyan' },
  { label: 'Location (63-90)', min: 63, max: 90, colorClass: 'text-quantum-blue' },
  { label: 'Financial (91-116)', min: 91, max: 116, colorClass: 'text-quantum-purple' },
  { label: 'Environment (117-138)', min: 117, max: 138, colorClass: 'text-quantum-gold' },
  { label: 'Stellar MLS (139-168)', min: 139, max: 168, colorClass: 'text-quantum-cyan' },
] as const;

/**
 * Get fields within a specific number range
 */
export function getFieldsInRange(minField: number, maxField: number): FieldPathMapping[] {
  return FIELD_TO_PROPERTY_MAP.filter(
    mapping => mapping.fieldNumber >= minField && mapping.fieldNumber <= maxField
  );
}

/**
 * Check if a DataField has a populated (non-null, non-empty) value
 */
function isFieldPopulated(field: DataField<any> | undefined): boolean {
  if (!field) return false;
  const val = field.value;
  if (val === null || val === undefined) return false;
  if (typeof val === 'string' && val.trim() === '') return false;
  if (Array.isArray(val) && val.length === 0) return false;
  return true;
}

/**
 * Compute data quality percentage for a specific field range within a single property
 */
export function computeRangeQuality(
  property: Property,
  minField: number,
  maxField: number
): number {
  const fieldsInRange = getFieldsInRange(minField, maxField);
  if (fieldsInRange.length === 0) return 0;

  let populatedCount = 0;

  for (const mapping of fieldsInRange) {
    const group = property[mapping.group as keyof Property];
    if (group && typeof group === 'object') {
      const field = (group as Record<string, any>)[mapping.propName];
      if (isFieldPopulated(field)) {
        populatedCount++;
      }
    }
  }

  return Math.round((populatedCount / fieldsInRange.length) * 100);
}

export interface DataQualityMetrics {
  label: string;
  percentage: number;
  colorClass: string;
  populatedFields: number;
  totalFields: number;
}

/**
 * Compute data quality metrics for all ranges across all properties
 * Returns averaged percentages when multiple properties exist
 */
export function computeDataQualityByRange(properties: Property[]): DataQualityMetrics[] {
  if (properties.length === 0) {
    return DATA_QUALITY_RANGES.map(range => ({
      label: range.label,
      percentage: 0,
      colorClass: range.colorClass,
      populatedFields: 0,
      totalFields: getFieldsInRange(range.min, range.max).length,
    }));
  }

  return DATA_QUALITY_RANGES.map(range => {
    const totalFields = getFieldsInRange(range.min, range.max).length;
    let totalPopulated = 0;

    for (const property of properties) {
      const rangeQuality = computeRangeQuality(property, range.min, range.max);
      totalPopulated += Math.round((rangeQuality / 100) * totalFields);
    }

    const avgPopulated = Math.round(totalPopulated / properties.length);
    const percentage = totalFields > 0 ? Math.round((avgPopulated / totalFields) * 100) : 0;

    return {
      label: range.label,
      percentage,
      colorClass: range.colorClass,
      populatedFields: avgPopulated,
      totalFields,
    };
  });
}

/**
 * REVERSE FUNCTION: Convert a Property object back to flat field format
 * Used when calling the search API with existing data to enable additive merging.
 *
 * @param property - The full Property object to flatten
 * @returns Record<string, FlatFieldData> - Flat fields keyed by apiKey (e.g., "10_listing_price")
 */
export function propertyToFlatFields(property: Property): Record<string, FlatFieldData> {
  const flatFields: Record<string, FlatFieldData> = {};

  for (const mapping of FIELD_TO_PROPERTY_MAP) {
    const { apiKey, group, propName } = mapping;

    // Handle nested stellarMLS groups (e.g., "stellarMLS.parking")
    let groupObj: any;
    if (group.startsWith('stellarMLS.')) {
      const subGroup = group.split('.')[1] as keyof NonNullable<Property['stellarMLS']>;
      groupObj = property.stellarMLS?.[subGroup];
    } else {
      groupObj = property[group as keyof Property];
    }

    if (!groupObj || typeof groupObj !== 'object') continue;

    const field = groupObj[propName] as DataField<any> | undefined;
    if (!field) continue;

    // Only include fields with actual values
    const val = field.value;
    if (val === null || val === undefined || val === '') continue;
    if (typeof val === 'string' && val.trim() === '') continue;
    if (Array.isArray(val) && val.length === 0) continue;

    flatFields[apiKey] = {
      value: field.value,
      source: field.sources?.[0] || 'Unknown',
      confidence: (field.confidence as 'High' | 'Medium' | 'Low' | 'Unverified') || 'Medium',
      llmSources: field.llmSources,
    };
  }

  return flatFields;
}
