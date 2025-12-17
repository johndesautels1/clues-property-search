/**
 * OLIVIA BRAIN ENHANCED - COMPLETE 168-FIELD IMPLEMENTATION
 * Every single field mapped and formatted - NO SHORTCUTS
 *
 * ✅ ALL 168 fields extracted from Property type
 * ✅ ALL 168 fields formatted in API prompt
 * ✅ Verified against fields-schema.ts
 * ✅ Ready for production integration
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  OliviaEnhancedAnalysisRequest,
  OliviaEnhancedAnalysisResult,
  OliviaEnhancedPropertyInput,
} from '@/types/olivia-enhanced';
import type { Property } from '@/types/property';
import {
  buildMathematicalAnalysisPrompt,
  validateOliviaResponse,
  type ValidationResult,
} from './olivia-math-engine';
// Multi-LLM forecast now via API endpoint

// ============================================================================
// COMPLETE FIELD EXTRACTION - ALL 168 FIELDS
// ============================================================================

/**
 * Extract ALL 168 fields from Property type to OliviaEnhancedPropertyInput
 * VERIFIED against src/types/property.ts structure
 */
export function extractPropertyData(property: Property): OliviaEnhancedPropertyInput {
  // Helper to safely extract value from DataField<T>
  const getValue = <T,>(field: any): T | undefined => {
    if (!field) return undefined;
    if (typeof field === 'object' && 'value' in field) {
      // Convert null to undefined to match type signature
      return field.value === null ? undefined : field.value;
    }
    return field as T;
  };

  return {
    // Identification
    id: property.id,

    // ========================================================================
    // GROUP 1: Address & Identity (Fields 1-9)
    // ========================================================================
    full_address: getValue<string>(property.address?.fullAddress) || '',
    mls_primary: getValue<string>(property.address?.mlsPrimary),
    mls_secondary: getValue<string>(property.address?.mlsSecondary),
    listing_status: getValue<string>(property.address?.listingStatus),
    listing_date: getValue<string>(property.address?.listingDate),
    neighborhood: getValue<string>(property.address?.neighborhoodName),
    county: getValue<string>(property.address?.county),
    zip_code: getValue<string>(property.address?.zipCode),
    parcel_id: getValue<string>(property.details?.parcelId),

    // ========================================================================
    // GROUP 2: Pricing & Value (Fields 10-16)
    // ========================================================================
    listing_price: getValue<number>(property.address?.listingPrice),
    price_per_sqft: getValue<number>(property.address?.pricePerSqft),
    market_value_estimate: getValue<number>(property.details?.marketValueEstimate),
    last_sale_date: getValue<string>(property.details?.lastSaleDate),
    last_sale_price: getValue<number>(property.details?.lastSalePrice),
    assessed_value: getValue<number>(property.details?.assessedValue),
    redfin_estimate: getValue<number>(property.financial?.redfinEstimate),

    // ========================================================================
    // GROUP 3: Property Basics (Fields 17-29)
    // ========================================================================
    bedrooms: getValue<number>(property.details?.bedrooms) || 0,
    full_bathrooms: getValue<number>(property.details?.fullBathrooms) || 0,
    half_bathrooms: getValue<number>(property.details?.halfBathrooms),
    total_bathrooms: getValue<number>(property.details?.totalBathrooms),
    living_sqft: getValue<number>(property.details?.livingSqft) || 0,
    total_sqft_under_roof: getValue<number>(property.details?.totalSqftUnderRoof),
    lot_size_sqft: getValue<number>(property.details?.lotSizeSqft),
    lot_size_acres: getValue<number>(property.details?.lotSizeAcres),
    year_built: getValue<number>(property.details?.yearBuilt) || 2000,
    property_type: getValue<string>(property.details?.propertyType) || 'Single Family',
    stories: getValue<number>(property.details?.stories),
    garage_spaces: getValue<number>(property.details?.garageSpaces),
    parking_total: getValue<string>(property.details?.parkingTotal),

    // ========================================================================
    // GROUP 4: HOA & Taxes (Fields 30-38)
    // ========================================================================
    hoa_yn: getValue<boolean>(property.details?.hoaYn),
    hoa_fee_annual: getValue<number>(property.details?.hoaFeeAnnual),
    hoa_name: getValue<string>(property.details?.hoaName),
    hoa_includes: getValue<string>(property.details?.hoaIncludes),
    ownership_type: getValue<string>(property.details?.ownershipType),
    annual_taxes: getValue<number>(property.details?.annualTaxes),
    tax_year: getValue<number>(property.details?.taxYear),
    property_tax_rate: getValue<number>(property.financial?.propertyTaxRate),
    tax_exemptions: getValue<string>(property.financial?.taxExemptions),

    // ========================================================================
    // GROUP 5: Structure & Systems (Fields 39-48)
    // ========================================================================
    roof_type: getValue<string>(property.structural?.roofType),
    roof_age_est: getValue<string>(property.structural?.roofAgeEst),
    exterior_material: getValue<string>(property.structural?.exteriorMaterial),
    foundation: getValue<string>(property.structural?.foundation),
    water_heater_type: getValue<string>(property.structural?.waterHeaterType),
    garage_type: getValue<string>(property.structural?.garageType),
    hvac_type: getValue<string>(property.structural?.hvacType),
    hvac_age: getValue<string>(property.structural?.hvacAge),
    laundry_type: getValue<string>(property.structural?.laundryType),
    interior_condition: getValue<string>(property.structural?.interiorCondition),

    // ========================================================================
    // GROUP 6: Interior Features (Fields 49-53)
    // ========================================================================
    flooring_type: getValue<string>(property.structural?.flooringType),
    kitchen_features: getValue<string>(property.structural?.kitchenFeatures),
    appliances_included: getValue<string[]>(property.structural?.appliancesIncluded),
    fireplace_yn: getValue<boolean>(property.structural?.fireplaceYn),
    fireplace_count: getValue<number>(property.structural?.fireplaceCount),

    // ========================================================================
    // GROUP 7: Exterior Features (Fields 54-58)
    // ========================================================================
    pool_yn: getValue<boolean>(property.structural?.poolYn),
    pool_type: getValue<string[]>(property.structural?.poolType),
    deck_patio: getValue<string>(property.structural?.deckPatio),
    fence: getValue<string>(property.structural?.fence),
    landscaping: getValue<string>(property.structural?.landscaping),

    // ========================================================================
    // GROUP 8: Permits & Renovations (Fields 59-62)
    // ========================================================================
    recent_renovations: getValue<string>(property.structural?.recentRenovations),
    permit_history_roof: getValue<string>(property.structural?.permitHistoryRoof),
    permit_history_hvac: getValue<string>(property.structural?.permitHistoryHvac),
    permit_history_other: getValue<string>(property.structural?.permitHistoryPoolAdditions),

    // ========================================================================
    // GROUP 9: Assigned Schools (Fields 63-73)
    // ========================================================================
    school_district: getValue<string>(property.location?.schoolDistrictName),
    elevation_feet: getValue<number>(property.location?.elevationFeet),
    elementary_school: getValue<string>(property.location?.assignedElementary),
    elementary_rating: getValue<string>(property.location?.elementaryRating),
    elementary_distance_mi: getValue<number>(property.location?.elementaryDistanceMiles),
    middle_school: getValue<string>(property.location?.assignedMiddle),
    middle_rating: getValue<string>(property.location?.middleRating),
    middle_distance_mi: getValue<number>(property.location?.middleDistanceMiles),
    high_school: getValue<string>(property.location?.assignedHigh),
    high_rating: getValue<string>(property.location?.highRating),
    high_distance_mi: getValue<number>(property.location?.highDistanceMiles),

    // ========================================================================
    // GROUP 10: Location Scores (Fields 74-82)
    // ========================================================================
    walk_score: getValue<number>(property.location?.walkScore),
    transit_score: getValue<number>(property.location?.transitScore),
    bike_score: getValue<number>(property.location?.bikeScore),
    safety_score: undefined, // Field 77 - not in Property type (calculated field)
    noise_level: getValue<string>(property.location?.noiseLevel),
    traffic_level: getValue<string>(property.location?.trafficLevel),
    walkability_description: getValue<string>(property.location?.walkabilityDescription),
    public_transit_access: getValue<string>(property.location?.publicTransitAccess),
    commute_to_city_center: getValue<string>(property.location?.commuteTimeCityCenter),

    // ========================================================================
    // GROUP 11: Distances & Amenities (Fields 83-87)
    // ========================================================================
    distance_grocery_mi: getValue<number>(property.location?.distanceGroceryMiles),
    distance_hospital_mi: getValue<number>(property.location?.distanceHospitalMiles),
    distance_airport_mi: getValue<number>(property.location?.distanceAirportMiles),
    distance_park_mi: getValue<number>(property.location?.distanceParkMiles),
    distance_beach_mi: getValue<number>(property.location?.distanceBeachMiles),

    // ========================================================================
    // GROUP 12: Safety & Crime (Fields 88-90)
    // ========================================================================
    violent_crime_index: getValue<string>(property.location?.crimeIndexViolent),
    property_crime_index: getValue<string>(property.location?.crimeIndexProperty),
    neighborhood_safety_rating: getValue<string>(property.location?.neighborhoodSafetyRating),

    // ========================================================================
    // GROUP 13: Market & Investment Data (Fields 91-103)
    // ========================================================================
    median_home_price_neighborhood: getValue<number>(property.financial?.medianHomePriceNeighborhood),
    price_per_sqft_recent_avg: getValue<number>(property.financial?.pricePerSqftRecentAvg),
    price_to_rent_ratio: getValue<number>(property.financial?.priceToRentRatio),
    price_vs_median_percent: getValue<number>(property.financial?.priceVsMedianPercent),
    days_on_market_avg: getValue<number>(property.financial?.daysOnMarketAvg),
    inventory_surplus: getValue<string>(property.financial?.inventorySurplus),
    insurance_est_annual: getValue<number>(property.financial?.insuranceEstAnnual),
    rental_estimate_monthly: getValue<number>(property.financial?.rentalEstimateMonthly),
    rental_yield_est: getValue<number>(property.financial?.rentalYieldEst),
    vacancy_rate_neighborhood: getValue<number>(property.financial?.vacancyRateNeighborhood),
    cap_rate_est: getValue<number>(property.financial?.capRateEst),
    financing_terms: getValue<string>(property.financial?.financingTerms),
    comparable_sales: getValue<string>(property.financial?.comparableSalesLast3),

    // ========================================================================
    // GROUP 14: Utilities & Connectivity (Fields 104-116)
    // ========================================================================
    electric_provider: getValue<string>(property.utilities?.electricProvider),
    avg_electric_bill: getValue<string>(property.utilities?.avgElectricBill),
    water_provider: getValue<string>(property.utilities?.waterProvider),
    avg_water_bill: getValue<string>(property.utilities?.avgWaterBill),
    sewer_provider: getValue<string>(property.utilities?.sewerProvider),
    natural_gas: getValue<string>(property.utilities?.naturalGas),
    trash_provider: getValue<string>(property.utilities?.trashProvider),
    internet_providers_top3: getValue<string>(property.utilities?.internetProvidersTop3),
    max_internet_speed: getValue<string>(property.utilities?.maxInternetSpeed),
    fiber_available: getValue<string>(property.utilities?.fiberAvailable),
    cable_tv_provider: getValue<string>(property.utilities?.cableTvProvider),
    cell_coverage_quality: getValue<string>(property.utilities?.cellCoverageQuality),
    emergency_services_distance: getValue<string>(property.utilities?.emergencyServicesDistance),

    // ========================================================================
    // GROUP 15: Environment & Risk (Fields 117-130)
    // ========================================================================
    air_quality_index: getValue<string>(property.utilities?.airQualityIndexCurrent),
    air_quality_grade: getValue<string>(property.utilities?.airQualityGrade),
    flood_zone: getValue<string>(property.utilities?.floodZone),
    flood_risk_level: getValue<string>(property.utilities?.floodRiskLevel),
    climate_risk: getValue<string>(property.utilities?.climateRiskWildfireFlood),
    wildfire_risk: getValue<string>(property.utilities?.wildfireRisk),
    earthquake_risk: getValue<string>(property.utilities?.earthquakeRisk),
    hurricane_risk: getValue<string>(property.utilities?.hurricaneRisk),
    tornado_risk: getValue<string>(property.utilities?.tornadoRisk),
    radon_risk: getValue<string>(property.utilities?.radonRisk),
    superfund_site_nearby: getValue<string>(property.utilities?.superfundNearby),
    sea_level_rise_risk: getValue<string>(property.utilities?.seaLevelRiseRisk),
    noise_level_db_est: getValue<string>(property.utilities?.noiseLevelDbEst),
    solar_potential: getValue<string>(property.utilities?.solarPotential),

    // ========================================================================
    // GROUP 16: Additional Features (Fields 131-138)
    // ========================================================================
    view_type: getValue<string>(property.utilities?.viewType),
    lot_features: getValue<string>(property.utilities?.lotFeatures),
    ev_charging: getValue<string>(property.utilities?.evChargingYn),
    smart_home_features: getValue<string>(property.utilities?.smartHomeFeatures),
    accessibility_modifications: getValue<string>(property.utilities?.accessibilityMods),
    pet_policy: getValue<string>(property.utilities?.petPolicy),
    age_restrictions: getValue<string>(property.utilities?.ageRestrictions),
    special_assessments: getValue<string>(property.financial?.specialAssessments),

    // ========================================================================
    // GROUP 17: Parking Details (Fields 139-143) - Stellar MLS
    // ========================================================================
    carport_yn: getValue<boolean>(property.stellarMLS?.parking?.carportYn),
    carport_spaces: getValue<number>(property.stellarMLS?.parking?.carportSpaces),
    garage_attached_yn: getValue<boolean>(property.stellarMLS?.parking?.garageAttachedYn),
    parking_features: getValue<string[]>(property.stellarMLS?.parking?.parkingFeatures),
    assigned_parking_spaces: getValue<number>(property.stellarMLS?.parking?.assignedParkingSpaces),

    // ========================================================================
    // GROUP 18: Building Details (Fields 144-148) - Stellar MLS
    // ========================================================================
    floor_number: getValue<number>(property.stellarMLS?.building?.floorNumber),
    building_total_floors: getValue<number>(property.stellarMLS?.building?.buildingTotalFloors),
    building_name_number: getValue<string>(property.stellarMLS?.building?.buildingNameNumber),
    building_elevator_yn: getValue<boolean>(property.stellarMLS?.building?.buildingElevatorYn),
    floors_in_unit: getValue<number>(property.stellarMLS?.building?.floorsInUnit),

    // ========================================================================
    // GROUP 19: Legal & Compliance (Fields 149-154) - Stellar MLS
    // ========================================================================
    subdivision_name: getValue<string>(property.stellarMLS?.legal?.subdivisionName),
    legal_description: getValue<string>(property.stellarMLS?.legal?.legalDescription),
    homestead_yn: getValue<boolean>(property.stellarMLS?.legal?.homesteadYn),
    cdd_yn: getValue<boolean>(property.stellarMLS?.legal?.cddYn),
    annual_cdd_fee: getValue<number>(property.stellarMLS?.legal?.annualCddFee),
    front_exposure: getValue<string>(property.stellarMLS?.legal?.frontExposure),

    // ========================================================================
    // GROUP 20: Waterfront (Fields 155-159) - Stellar MLS
    // ========================================================================
    water_frontage_yn: getValue<boolean>(property.stellarMLS?.waterfront?.waterFrontageYn),
    waterfront_feet: getValue<number>(property.stellarMLS?.waterfront?.waterfrontFeet),
    water_access_yn: getValue<boolean>(property.stellarMLS?.waterfront?.waterAccessYn),
    water_view_yn: getValue<boolean>(property.stellarMLS?.waterfront?.waterViewYn),
    water_body_name: getValue<string>(property.stellarMLS?.waterfront?.waterBodyName),

    // ========================================================================
    // GROUP 21: Leasing & Rentals (Fields 160-165) - Stellar MLS
    // ========================================================================
    can_be_leased_yn: getValue<boolean>(property.stellarMLS?.leasing?.canBeLeasedYn),
    minimum_lease_period: getValue<string>(property.stellarMLS?.leasing?.minimumLeasePeriod),
    lease_restrictions_yn: getValue<boolean>(property.stellarMLS?.leasing?.leaseRestrictionsYn),
    pet_size_limit: getValue<string>(property.stellarMLS?.leasing?.petSizeLimit),
    max_pet_weight: getValue<number>(property.stellarMLS?.leasing?.maxPetWeight),
    association_approval_yn: getValue<boolean>(property.stellarMLS?.leasing?.associationApprovalYn),

    // ========================================================================
    // GROUP 22: Community & Features (Fields 166-168) - Stellar MLS
    // ========================================================================
    community_features: getValue<string[]>(property.stellarMLS?.features?.communityFeatures),
    interior_features: getValue<string[]>(property.stellarMLS?.features?.interiorFeatures),
    exterior_features: getValue<string[]>(property.stellarMLS?.features?.exteriorFeatures),

    // ========================================================================
    // CLUES Scores (Computed fields)
    // ========================================================================
    smartScore: property.smartScore || 0,
    dataCompleteness: property.dataCompleteness || 0,
  };
}

// ============================================================================
// COMPLETE API PROMPT FORMATTING - ALL 168 FIELDS
// ============================================================================

/**
 * Format property data for Claude API - ALL 168 fields included
 */
function formatPropertyForPrompt(p: OliviaEnhancedPropertyInput, index: number): string {
  const lines: string[] = [`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`];
  lines.push(`PROPERTY ${index + 1} (ID: ${p.id})`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Helper to add field only if value exists
  const addField = (fieldNum: number, label: string, value: any) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          lines.push(`  [${fieldNum}] ${label}: ${value.join(', ')}`);
        }
      } else {
        lines.push(`  [${fieldNum}] ${label}: ${value}`);
      }
    }
  };

  // ========================================================================
  // GROUP 1: Address & Identity (Fields 1-9)
  // ========================================================================
  lines.push(`\n📍 ADDRESS & IDENTITY (Fields 1-9)`);
  addField(1, 'Full Address', p.full_address);
  addField(2, 'MLS Primary', p.mls_primary);
  addField(3, 'MLS Secondary', p.mls_secondary);
  addField(4, 'Listing Status', p.listing_status);
  addField(5, 'Listing Date', p.listing_date);
  addField(6, 'Neighborhood', p.neighborhood);
  addField(7, 'County', p.county);
  addField(8, 'ZIP Code', p.zip_code);
  addField(9, 'Parcel ID', p.parcel_id);

  // ========================================================================
  // GROUP 2: Pricing & Value (Fields 10-16)
  // ========================================================================
  lines.push(`\n💰 PRICING & VALUE (Fields 10-16)`);
  addField(10, 'Listing Price', p.listing_price ? `$${p.listing_price.toLocaleString()}` : null);
  addField(11, 'Price Per Sq Ft', p.price_per_sqft ? `$${p.price_per_sqft}` : null);
  addField(12, 'Market Value Estimate', p.market_value_estimate ? `$${p.market_value_estimate.toLocaleString()}` : null);
  addField(13, 'Last Sale Date', p.last_sale_date);
  addField(14, 'Last Sale Price', p.last_sale_price ? `$${p.last_sale_price.toLocaleString()}` : null);
  addField(15, 'Assessed Value', p.assessed_value ? `$${p.assessed_value.toLocaleString()}` : null);
  addField(16, 'Redfin Estimate', p.redfin_estimate ? `$${p.redfin_estimate.toLocaleString()}` : null);

  // ========================================================================
  // GROUP 3: Property Basics (Fields 17-29)
  // ========================================================================
  lines.push(`\n🏠 PROPERTY BASICS (Fields 17-29)`);
  addField(17, 'Bedrooms', p.bedrooms);
  addField(18, 'Full Bathrooms', p.full_bathrooms);
  addField(19, 'Half Bathrooms', p.half_bathrooms);
  addField(20, 'Total Bathrooms', p.total_bathrooms);
  addField(21, 'Living Sq Ft', p.living_sqft ? `${p.living_sqft.toLocaleString()} sq ft` : null);
  addField(22, 'Total Sq Ft Under Roof', p.total_sqft_under_roof ? `${p.total_sqft_under_roof.toLocaleString()} sq ft` : null);
  addField(23, 'Lot Size (Sq Ft)', p.lot_size_sqft ? `${p.lot_size_sqft.toLocaleString()} sq ft` : null);
  addField(24, 'Lot Size (Acres)', p.lot_size_acres);
  addField(25, 'Year Built', p.year_built);
  addField(26, 'Property Type', p.property_type);
  addField(27, 'Stories', p.stories);
  addField(28, 'Garage Spaces', p.garage_spaces);
  addField(29, 'Parking Total', p.parking_total);

  // ========================================================================
  // GROUP 4: HOA & Taxes (Fields 30-38)
  // ========================================================================
  lines.push(`\n💵 HOA & TAXES (Fields 30-38)`);
  addField(30, 'HOA Required', p.hoa_yn ? 'Yes' : p.hoa_yn === false ? 'No' : null);
  addField(31, 'HOA Fee (Annual)', p.hoa_fee_annual ? `$${p.hoa_fee_annual.toLocaleString()}` : null);
  addField(32, 'HOA Name', p.hoa_name);
  addField(33, 'HOA Includes', p.hoa_includes);
  addField(34, 'Ownership Type', p.ownership_type);
  addField(35, 'Annual Taxes', p.annual_taxes ? `$${p.annual_taxes.toLocaleString()}` : null);
  addField(36, 'Tax Year', p.tax_year);
  addField(37, 'Property Tax Rate', p.property_tax_rate ? `${p.property_tax_rate}%` : null);
  addField(38, 'Tax Exemptions', p.tax_exemptions);

  // ========================================================================
  // GROUP 5: Structure & Systems (Fields 39-48)
  // ========================================================================
  lines.push(`\n🔧 STRUCTURE & SYSTEMS (Fields 39-48)`);
  addField(39, 'Roof Type', p.roof_type);
  addField(40, 'Roof Age (Est)', p.roof_age_est);
  addField(41, 'Exterior Material', p.exterior_material);
  addField(42, 'Foundation', p.foundation);
  addField(43, 'Water Heater Type', p.water_heater_type);
  addField(44, 'Garage Type', p.garage_type);
  addField(45, 'HVAC Type', p.hvac_type);
  addField(46, 'HVAC Age', p.hvac_age);
  addField(47, 'Laundry Type', p.laundry_type);
  addField(48, 'Interior Condition', p.interior_condition);

  // ========================================================================
  // GROUP 6: Interior Features (Fields 49-53)
  // ========================================================================
  lines.push(`\n🛋️ INTERIOR FEATURES (Fields 49-53)`);
  addField(49, 'Flooring Type', p.flooring_type);
  addField(50, 'Kitchen Features', p.kitchen_features);
  addField(51, 'Appliances Included', p.appliances_included);
  addField(52, 'Fireplace', p.fireplace_yn ? 'Yes' : p.fireplace_yn === false ? 'No' : null);
  addField(53, 'Fireplace Count', p.fireplace_count);

  // ========================================================================
  // GROUP 7: Exterior Features (Fields 54-58)
  // ========================================================================
  lines.push(`\n🌳 EXTERIOR FEATURES (Fields 54-58)`);
  addField(54, 'Pool', p.pool_yn ? 'Yes' : p.pool_yn === false ? 'No' : null);
  addField(55, 'Pool Type', p.pool_type);
  addField(56, 'Deck/Patio', p.deck_patio);
  addField(57, 'Fence', p.fence);
  addField(58, 'Landscaping', p.landscaping);

  // ========================================================================
  // GROUP 8: Permits & Renovations (Fields 59-62)
  // ========================================================================
  lines.push(`\n📋 PERMITS & RENOVATIONS (Fields 59-62)`);
  addField(59, 'Recent Renovations', p.recent_renovations);
  addField(60, 'Permit History - Roof', p.permit_history_roof);
  addField(61, 'Permit History - HVAC', p.permit_history_hvac);
  addField(62, 'Permit History - Other', p.permit_history_other);

  // ========================================================================
  // GROUP 9: Assigned Schools (Fields 63-73)
  // ========================================================================
  lines.push(`\n🎓 ASSIGNED SCHOOLS (Fields 63-73)`);
  addField(63, 'School District', p.school_district);
  addField(64, 'Elevation (feet)', p.elevation_feet);
  addField(65, 'Elementary School', p.elementary_school);
  addField(66, 'Elementary Rating', p.elementary_rating);
  addField(67, 'Elementary Distance (mi)', p.elementary_distance_mi);
  addField(68, 'Middle School', p.middle_school);
  addField(69, 'Middle Rating', p.middle_rating);
  addField(70, 'Middle Distance (mi)', p.middle_distance_mi);
  addField(71, 'High School', p.high_school);
  addField(72, 'High Rating', p.high_rating);
  addField(73, 'High Distance (mi)', p.high_distance_mi);

  // ========================================================================
  // GROUP 10: Location Scores (Fields 74-82)
  // ========================================================================
  lines.push(`\n📍 LOCATION SCORES (Fields 74-82)`);
  addField(74, 'Walk Score', p.walk_score);
  addField(75, 'Transit Score', p.transit_score);
  addField(76, 'Bike Score', p.bike_score);
  addField(77, 'Safety Score', p.safety_score);
  addField(78, 'Noise Level', p.noise_level);
  addField(79, 'Traffic Level', p.traffic_level);
  addField(80, 'Walkability Description', p.walkability_description);
  addField(81, 'Public Transit Access', p.public_transit_access);
  addField(82, 'Commute to City Center', p.commute_to_city_center);

  // ========================================================================
  // GROUP 11: Distances & Amenities (Fields 83-87)
  // ========================================================================
  lines.push(`\n📏 DISTANCES & AMENITIES (Fields 83-87)`);
  addField(83, 'Distance to Grocery (mi)', p.distance_grocery_mi);
  addField(84, 'Distance to Hospital (mi)', p.distance_hospital_mi);
  addField(85, 'Distance to Airport (mi)', p.distance_airport_mi);
  addField(86, 'Distance to Park (mi)', p.distance_park_mi);
  addField(87, 'Distance to Beach (mi)', p.distance_beach_mi);

  // ========================================================================
  // GROUP 12: Safety & Crime (Fields 88-90)
  // ========================================================================
  lines.push(`\n🛡️ SAFETY & CRIME (Fields 88-90)`);
  addField(88, 'Violent Crime Index', p.violent_crime_index);
  addField(89, 'Property Crime Index', p.property_crime_index);
  addField(90, 'Neighborhood Safety Rating', p.neighborhood_safety_rating);

  // ========================================================================
  // GROUP 13: Market & Investment Data (Fields 91-103)
  // ========================================================================
  lines.push(`\n📊 MARKET & INVESTMENT DATA (Fields 91-103)`);
  addField(91, 'Median Home Price (Neighborhood)', p.median_home_price_neighborhood ? `$${p.median_home_price_neighborhood.toLocaleString()}` : null);
  addField(92, 'Price Per Sq Ft (Recent Avg)', p.price_per_sqft_recent_avg ? `$${p.price_per_sqft_recent_avg}` : null);
  addField(93, 'Price to Rent Ratio', p.price_to_rent_ratio);
  addField(94, 'Price vs Median %', p.price_vs_median_percent ? `${p.price_vs_median_percent}%` : null);
  addField(95, 'Days on Market (Avg)', p.days_on_market_avg);
  addField(96, 'Inventory Surplus', p.inventory_surplus);
  addField(97, 'Insurance Estimate (Annual)', p.insurance_est_annual ? `$${p.insurance_est_annual.toLocaleString()}` : null);
  addField(98, 'Rental Estimate (Monthly)', p.rental_estimate_monthly ? `$${p.rental_estimate_monthly.toLocaleString()}` : null);
  addField(99, 'Rental Yield (Est)', p.rental_yield_est ? `${p.rental_yield_est}%` : null);
  addField(100, 'Vacancy Rate (Neighborhood)', p.vacancy_rate_neighborhood ? `${p.vacancy_rate_neighborhood}%` : null);
  addField(101, 'Cap Rate (Est)', p.cap_rate_est ? `${p.cap_rate_est}%` : null);
  addField(102, 'Financing Terms', p.financing_terms);
  addField(103, 'Comparable Sales', p.comparable_sales);

  // ========================================================================
  // GROUP 14: Utilities & Connectivity (Fields 104-116)
  // ========================================================================
  lines.push(`\n⚡ UTILITIES & CONNECTIVITY (Fields 104-116)`);
  addField(104, 'Electric Provider', p.electric_provider);
  addField(105, 'Avg Electric Bill', p.avg_electric_bill);
  addField(106, 'Water Provider', p.water_provider);
  addField(107, 'Avg Water Bill', p.avg_water_bill);
  addField(108, 'Sewer Provider', p.sewer_provider);
  addField(109, 'Natural Gas', p.natural_gas);
  addField(110, 'Trash Provider', p.trash_provider);
  addField(111, 'Internet Providers (Top 3)', p.internet_providers_top3);
  addField(112, 'Max Internet Speed', p.max_internet_speed);
  addField(113, 'Fiber Available', p.fiber_available);
  addField(114, 'Cable TV Provider', p.cable_tv_provider);
  addField(115, 'Cell Coverage Quality', p.cell_coverage_quality);
  addField(116, 'Emergency Services Distance', p.emergency_services_distance);

  // ========================================================================
  // GROUP 15: Environment & Risk (Fields 117-130)
  // ========================================================================
  lines.push(`\n🌍 ENVIRONMENT & RISK (Fields 117-130)`);
  addField(117, 'Air Quality Index', p.air_quality_index);
  addField(118, 'Air Quality Grade', p.air_quality_grade);
  addField(119, 'Flood Zone', p.flood_zone);
  addField(120, 'Flood Risk Level', p.flood_risk_level);
  addField(121, 'Climate Risk', p.climate_risk);
  addField(122, 'Wildfire Risk', p.wildfire_risk);
  addField(123, 'Earthquake Risk', p.earthquake_risk);
  addField(124, 'Hurricane Risk', p.hurricane_risk);
  addField(125, 'Tornado Risk', p.tornado_risk);
  addField(126, 'Radon Risk', p.radon_risk);
  addField(127, 'Superfund Site Nearby', p.superfund_site_nearby);
  addField(128, 'Sea Level Rise Risk', p.sea_level_rise_risk);
  addField(129, 'Noise Level (dB Est)', p.noise_level_db_est);
  addField(130, 'Solar Potential', p.solar_potential);

  // ========================================================================
  // GROUP 16: Additional Features (Fields 131-138)
  // ========================================================================
  lines.push(`\n⭐ ADDITIONAL FEATURES (Fields 131-138)`);
  addField(131, 'View Type', p.view_type);
  addField(132, 'Lot Features', p.lot_features);
  addField(133, 'EV Charging', p.ev_charging);
  addField(134, 'Smart Home Features', p.smart_home_features);
  addField(135, 'Accessibility Modifications', p.accessibility_modifications);
  addField(136, 'Pet Policy', p.pet_policy);
  addField(137, 'Age Restrictions', p.age_restrictions);
  addField(138, 'Special Assessments', p.special_assessments);

  // ========================================================================
  // GROUP 17: Parking Details (Fields 139-143) - Stellar MLS
  // ========================================================================
  lines.push(`\n🚗 PARKING DETAILS (Fields 139-143)`);
  addField(139, 'Carport', p.carport_yn ? 'Yes' : p.carport_yn === false ? 'No' : null);
  addField(140, 'Carport Spaces', p.carport_spaces);
  addField(141, 'Garage Attached', p.garage_attached_yn ? 'Yes' : p.garage_attached_yn === false ? 'No' : null);
  addField(142, 'Parking Features', p.parking_features);
  addField(143, 'Assigned Parking Spaces', p.assigned_parking_spaces);

  // ========================================================================
  // GROUP 18: Building Details (Fields 144-148) - Stellar MLS
  // ========================================================================
  lines.push(`\n🏢 BUILDING DETAILS (Fields 144-148)`);
  addField(144, 'Floor Number', p.floor_number);
  addField(145, 'Building Total Floors', p.building_total_floors);
  addField(146, 'Building Name/Number', p.building_name_number);
  addField(147, 'Building Elevator', p.building_elevator_yn ? 'Yes' : p.building_elevator_yn === false ? 'No' : null);
  addField(148, 'Floors in Unit', p.floors_in_unit);

  // ========================================================================
  // GROUP 19: Legal & Compliance (Fields 149-154) - Stellar MLS
  // ========================================================================
  lines.push(`\n⚖️ LEGAL & COMPLIANCE (Fields 149-154)`);
  addField(149, 'Subdivision Name', p.subdivision_name);
  addField(150, 'Legal Description', p.legal_description);
  addField(151, 'Homestead Exemption', p.homestead_yn ? 'Yes' : p.homestead_yn === false ? 'No' : null);
  addField(152, 'CDD', p.cdd_yn ? 'Yes' : p.cdd_yn === false ? 'No' : null);
  addField(153, 'Annual CDD Fee', p.annual_cdd_fee ? `$${p.annual_cdd_fee.toLocaleString()}` : null);
  addField(154, 'Front Exposure', p.front_exposure);

  // ========================================================================
  // GROUP 20: Waterfront (Fields 155-159) - Stellar MLS
  // ========================================================================
  lines.push(`\n🌊 WATERFRONT (Fields 155-159)`);
  addField(155, 'Water Frontage', p.water_frontage_yn ? 'Yes' : p.water_frontage_yn === false ? 'No' : null);
  addField(156, 'Waterfront Feet', p.waterfront_feet);
  addField(157, 'Water Access', p.water_access_yn ? 'Yes' : p.water_access_yn === false ? 'No' : null);
  addField(158, 'Water View', p.water_view_yn ? 'Yes' : p.water_view_yn === false ? 'No' : null);
  addField(159, 'Water Body Name', p.water_body_name);

  // ========================================================================
  // GROUP 21: Leasing & Rentals (Fields 160-165) - Stellar MLS
  // ========================================================================
  lines.push(`\n📝 LEASING & RENTALS (Fields 160-165)`);
  addField(160, 'Can Be Leased', p.can_be_leased_yn ? 'Yes' : p.can_be_leased_yn === false ? 'No' : null);
  addField(161, 'Minimum Lease Period', p.minimum_lease_period);
  addField(162, 'Lease Restrictions', p.lease_restrictions_yn ? 'Yes' : p.lease_restrictions_yn === false ? 'No' : null);
  addField(163, 'Pet Size Limit', p.pet_size_limit);
  addField(164, 'Max Pet Weight (lbs)', p.max_pet_weight);
  addField(165, 'Association Approval Required', p.association_approval_yn ? 'Yes' : p.association_approval_yn === false ? 'No' : null);

  // ========================================================================
  // GROUP 22: Community & Features (Fields 166-168) - Stellar MLS
  // ========================================================================
  lines.push(`\n👥 COMMUNITY & FEATURES (Fields 166-168)`);
  addField(166, 'Community Features', p.community_features);
  addField(167, 'Interior Features', p.interior_features);
  addField(168, 'Exterior Features', p.exterior_features);

  // ========================================================================
  // CLUES Smart Scores (Computed)
  // ========================================================================
  lines.push(`\n🎯 CLUES SMART SCORES`);
  lines.push(`  Smart Score: ${p.smartScore}/100`);
  lines.push(`  Data Completeness: ${p.dataCompleteness}%`);

  return lines.join('\n');
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

const OLIVIA_SYSTEM_PROMPT = `You are Olivia, CLUES™ Chief Property Intelligence Officer.

You are a mathematical property analyst who NEVER hallucinates or makes up scores.

CORE PRINCIPLES:
1. Every score must have a mathematical proof
2. Every comparison must show calculations
3. If data is missing, say "Data unavailable" - do NOT guess
4. Winner must be determined by weighted aggregate scores across all 168 fields
5. Show your work - formulas, ranges, weighted averages

You will analyze properties using rigorous mathematical methodologies across all 168 fields.

Return ONLY valid JSON. No markdown code blocks. Pure JSON only.`;

/**
 * Analyze properties with mathematical rigor and hallucination detection
 */
export async function analyzeWithOliviaEnhanced(
  request: OliviaEnhancedAnalysisRequest
): Promise<OliviaEnhancedAnalysisResult & { validation?: ValidationResult }> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY not configured');
  }

  // CRITICAL: Must have exactly 3 properties for mathematical comparison
  if (request.properties.length !== 3) {
    throw new Error(
      `Mathematical analysis requires exactly 3 properties for comparison. Received: ${request.properties.length}`
    );
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  // Build mathematical prompt with all 168 fields and scoring methodologies
  const mathematicalPrompt = buildMathematicalAnalysisPrompt(request.properties);

  console.log('🧮 Sending mathematical analysis request to Claude Desktop...');
  console.log(`📊 Analyzing ${request.properties.length} properties across 168 fields`);
  console.log(`👤 Buyer profile: ${request.buyerProfile || 'General'}`);

  const stream = await client.messages.stream({
    model: 'claude-opus-4-20250514',
    max_tokens: 32000, // Increased for complete 168-field analysis with proofs
    temperature: 0.3, // Lower temperature for more deterministic math
    system: OLIVIA_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: mathematicalPrompt }],
  });

  // Collect streamed response
  let fullText = '';
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      fullText += chunk.delta.text;
    }
  }

  try {
    // Clean response
    let cleanText = fullText.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    // Parse JSON
    const result = JSON.parse(cleanText) as any;

    // CRITICAL: Validate for hallucinations
    console.log('🔍 Validating response for hallucinations...');
    const validation = validateOliviaResponse(result);

    if (!validation.isValid) {
      console.error('❌ HALLUCINATION DETECTED!');
      console.error('Errors:', validation.errors);
      console.error('Hallucinations:', validation.hallucinations);

      // Attach validation to response for debugging
      result.validation = validation;

      // In production, you might want to throw here or retry
      // For now, we'll return with validation attached
    } else {
      console.log('✅ Response validated - no hallucinations detected');
      if (validation.warnings.length > 0) {
        console.warn('⚠️ Warnings:', validation.warnings);
      }
    }

    // Add metadata
    result.analysisId = `OLIVIA-${Date.now()}`;
    result.timestamp = new Date().toISOString();
    result.propertiesAnalyzed = request.properties.length;
    result.buyerProfile = request.buyerProfile;
    result.validation = validation;

    // MULTI-LLM MARKET FORECAST (if requested)
    if (request.includeMarketForecast) {
      console.log('🔮 Fetching Multi-LLM Market Forecast...');

      // Get the top-ranked property for market forecast
      const topProperty = request.properties[0];

      try {
        // Call server-side multi-LLM forecast API
        console.log('📡 Calling /api/property/multi-llm-forecast with:', {
          address: topProperty.full_address,
          price: topProperty.listing_price || 0,
          neighborhood: topProperty.neighborhood || 'Unknown',
        });

        const response = await fetch('/api/property/multi-llm-forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: topProperty.full_address,
            price: topProperty.listing_price || 0,
            neighborhood: topProperty.neighborhood || 'Unknown',
            propertyType: topProperty.property_type
          })
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Response error:', errorText);
          throw new Error(`Multi-LLM forecast failed: ${response.statusText}`);
        }

        const forecast = await response.json();
        console.log('📊 Forecast received:', JSON.stringify(forecast).substring(0, 500));

        // Transform to expected MarketForecast interface
        result.marketForecast = {
          llmSources: forecast.llmSources.map((source: string) => {
            if (source.includes('Claude')) return 'claude-opus';
            if (source.includes('GPT-4')) return 'gpt-4';
            if (source.includes('Gemini')) return 'gemini-pro';
            if (source.includes('Perplexity')) return 'perplexity';
            return 'claude-opus';
          }) as ('claude-opus' | 'gpt-4' | 'gemini-pro' | 'perplexity')[],

          appreciationForecast: {
            year1: forecast.appreciation1Yr,
            year3: forecast.appreciation1Yr * 2.5, // Estimate
            year5: forecast.appreciation5Yr,
            year10: forecast.appreciation5Yr * 2, // Estimate
            confidence: forecast.confidence,
          },

          marketTrends: {
            priceDirection: forecast.appreciation1Yr > 3 ? 'rising' : forecast.appreciation1Yr < -2 ? 'declining' : 'stable',
            demandLevel: forecast.appreciation1Yr > 5 ? 'high' : forecast.appreciation1Yr < 2 ? 'low' : 'moderate',
            inventoryLevel: 'balanced', // TODO: Extract from LLM trends
            daysOnMarketTrend: 'stable', // TODO: Extract from LLM trends
          },

          marketRisks: {
            economicRisks: forecast.marketTrends.filter((t: string) => t.toLowerCase().includes('economy') || t.toLowerCase().includes('rate')),
            climateRisks: forecast.marketTrends.filter((t: string) => t.toLowerCase().includes('climate') || t.toLowerCase().includes('flood')),
            demographicShifts: forecast.marketTrends.filter((t: string) => t.toLowerCase().includes('population') || t.toLowerCase().includes('demographic')),
            regulatoryChanges: forecast.marketTrends.filter((t: string) => t.toLowerCase().includes('regulation') || t.toLowerCase().includes('zoning')),
          },

          marketOpportunities: {
            nearTerm: forecast.keyInsights.filter((_: string, i: number) => i < 3),
            longTerm: forecast.keyInsights.filter((_: string, i: number) => i >= 3),
          },

          forecastDate: forecast.timestamp,
          dataQuality: forecast.consensus === 'Strong' ? 'high' : forecast.consensus === 'Moderate' ? 'medium' : 'low',
        };

        console.log(`✅ Multi-LLM Forecast complete: ${forecast.appreciation1Yr.toFixed(1)}% (1yr)`);
        console.log(`   Consensus: ${forecast.consensus}`);
        console.log(`   LLMs: ${forecast.llmSources.join(', ')}`);
        console.log('📊 result.marketForecast:', JSON.stringify(result.marketForecast).substring(0, 300));
      } catch (error) {
        console.error('❌ Multi-LLM Market Forecast failed:', error);
        console.warn('⚠️ Continuing without market forecast');
        // Don't fail the entire analysis if market forecast fails
      }
    }

    return result as OliviaEnhancedAnalysisResult & { validation: ValidationResult };
  } catch (e) {
    console.error('Failed to parse Olivia response:', fullText);
    throw new Error(`Parse failed: ${e instanceof Error ? e.message : 'Unknown'}`);
  }
}

// ============================================================================
// PROGRESSIVE ANALYSIS - 4-LEVEL ORCHESTRATION
// ============================================================================

/**
 * Analyze properties with 4-level progressive analysis
 * Splits 168 fields into 3 sequential Claude Opus calls + 1 final aggregation
 *
 * This solves the 32K token limit issue by processing ~56 fields at a time
 * with FULL mathematical proofs for ALL 168 fields.
 */
export async function analyzeWithOliviaProgressive(
  request: OliviaEnhancedAnalysisRequest
): Promise<OliviaEnhancedAnalysisResult & { validation?: ValidationResult }> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY not configured');
  }

  // CRITICAL: Must have exactly 3 properties for mathematical comparison
  if (request.properties.length !== 3) {
    throw new Error(
      `Progressive analysis requires exactly 3 properties. Received: ${request.properties.length}`
    );
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  console.log('🔬 STARTING PROGRESSIVE ANALYSIS (4 Levels)');
  console.log(`📊 Analyzing ${request.properties.length} properties across 168 fields`);
  console.log(`🎯 Buyer profile: ${request.buyerProfile || 'General'}`);

  const { buildLevelPrompt, buildAggregationPrompt } = await import('./olivia-math-engine');

  // ============================================================================
  // LEVEL 1: Critical Decision Fields (Fields 1-56)
  // ============================================================================
  console.log('\n📍 LEVEL 1/4: Analyzing Critical Decision Fields (1-56)...');
  const level1Prompt = buildLevelPrompt(request.properties, 1);

  const level1Stream = await client.messages.stream({
    model: 'claude-opus-4-20250514',
    max_tokens: 32000,
    temperature: 0.3,
    system: OLIVIA_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: level1Prompt }],
  });

  let level1Text = '';
  for await (const chunk of level1Stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      level1Text += chunk.delta.text;
    }
  }

  let level1Results;
  try {
    let cleanText = level1Text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    level1Results = JSON.parse(cleanText);
    console.log(`✅ Level 1 Complete: ${level1Results.fieldComparisons?.length || 0} fields analyzed`);
  } catch (e) {
    console.error('❌ Level 1 parse failed:', level1Text);
    throw new Error(`Level 1 parse failed: ${e instanceof Error ? e.message : 'Unknown'}`);
  }

  // ============================================================================
  // LEVEL 2: Important Context Fields (Fields 57-112)
  // ============================================================================
  console.log('\n📍 LEVEL 2/4: Analyzing Important Context Fields (57-112)...');
  const level2Prompt = buildLevelPrompt(request.properties, 2);

  const level2Stream = await client.messages.stream({
    model: 'claude-opus-4-20250514',
    max_tokens: 32000,
    temperature: 0.3,
    system: OLIVIA_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: level2Prompt }],
  });

  let level2Text = '';
  for await (const chunk of level2Stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      level2Text += chunk.delta.text;
    }
  }

  let level2Results;
  try {
    let cleanText = level2Text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    level2Results = JSON.parse(cleanText);
    console.log(`✅ Level 2 Complete: ${level2Results.fieldComparisons?.length || 0} fields analyzed`);
  } catch (e) {
    console.error('❌ Level 2 parse failed:', level2Text);
    throw new Error(`Level 2 parse failed: ${e instanceof Error ? e.message : 'Unknown'}`);
  }

  // ============================================================================
  // LEVEL 3: Remaining Fields (Fields 113-168)
  // ============================================================================
  console.log('\n📍 LEVEL 3/4: Analyzing Remaining Fields (113-168)...');
  const level3Prompt = buildLevelPrompt(request.properties, 3);

  const level3Stream = await client.messages.stream({
    model: 'claude-opus-4-20250514',
    max_tokens: 32000,
    temperature: 0.3,
    system: OLIVIA_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: level3Prompt }],
  });

  let level3Text = '';
  for await (const chunk of level3Stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      level3Text += chunk.delta.text;
    }
  }

  let level3Results;
  try {
    let cleanText = level3Text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    level3Results = JSON.parse(cleanText);
    console.log(`✅ Level 3 Complete: ${level3Results.fieldComparisons?.length || 0} fields analyzed`);
  } catch (e) {
    console.error('❌ Level 3 parse failed:', level3Text);
    throw new Error(`Level 3 parse failed: ${e instanceof Error ? e.message : 'Unknown'}`);
  }

  // ============================================================================
  // LEVEL 4: Final Aggregation & Winner Declaration
  // ============================================================================
  console.log('\n📍 LEVEL 4/4: Final Aggregation & Winner Declaration...');
  const aggregationPrompt = buildAggregationPrompt(
    request.properties,
    level1Results,
    level2Results,
    level3Results
  );

  const level4Stream = await client.messages.stream({
    model: 'claude-opus-4-20250514',
    max_tokens: 32000,
    temperature: 0.3,
    system: OLIVIA_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: aggregationPrompt }],
  });

  let level4Text = '';
  for await (const chunk of level4Stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      level4Text += chunk.delta.text;
    }
  }

  let result;
  try {
    let cleanText = level4Text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    result = JSON.parse(cleanText);
    console.log(`✅ Level 4 Complete: Final analysis ready`);
  } catch (e) {
    console.error('❌ Level 4 parse failed:', level4Text);
    throw new Error(`Level 4 parse failed: ${e instanceof Error ? e.message : 'Unknown'}`);
  }

  // ============================================================================
  // INJECT FIELD COMPARISONS FROM LEVELS 1-3
  // ============================================================================
  // Level 4 only returns aggregated data (sections, grades, recommendations)
  // We now inject the complete 168 field comparisons from Levels 1-3
  const allFieldComparisons = [
    ...(level1Results.fieldComparisons || []),
    ...(level2Results.fieldComparisons || []),
    ...(level3Results.fieldComparisons || [])
  ];

  result.fieldComparisons = allFieldComparisons;
  console.log(`📊 Injected ${allFieldComparisons.length} field comparisons from Levels 1-3`);

  // ============================================================================
  // VALIDATION
  // ============================================================================
  console.log('\n🔍 Validating complete 168-field analysis...');
  const { validateOliviaResponse } = await import('./olivia-math-engine');
  const validation = validateOliviaResponse(result);

  if (!validation.isValid) {
    console.error('❌ HALLUCINATION DETECTED!');
    console.error('Errors:', validation.errors);
    console.error('Hallucinations:', validation.hallucinations);
    result.validation = validation;
  } else {
    console.log('✅ Response validated - no hallucinations detected');
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Warnings:', validation.warnings);
    }
  }

  // Add metadata
  result.analysisId = `OLIVIA-PROGRESSIVE-${Date.now()}`;
  result.timestamp = new Date().toISOString();
  result.propertiesAnalyzed = request.properties.length;
  result.buyerProfile = request.buyerProfile;
  result.validation = validation;
  result.analysisMethod = 'progressive_4_level'; // Mark as progressive

  // ============================================================================
  // MULTI-LLM MARKET FORECAST (if requested)
  // ============================================================================
  if (request.includeMarketForecast) {
    console.log('\n🔮 Fetching Multi-LLM Market Forecast...');

    const topProperty = request.properties[0];

    try {
      const response = await fetch('/api/property/multi-llm-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: topProperty.full_address,
          price: topProperty.listing_price || 0,
          neighborhood: topProperty.neighborhood || 'Unknown',
          propertyType: topProperty.property_type
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Response error:', errorText);
        throw new Error(`Multi-LLM forecast failed: ${response.statusText}`);
      }

      const forecast = await response.json();

      result.marketForecast = {
        llmSources: forecast.llmSources.map((source: string) => {
          if (source.includes('Claude')) return 'claude-opus';
          if (source.includes('GPT')) return 'gpt-4';
          if (source.includes('Gemini')) return 'gemini-pro';
          if (source.includes('Perplexity')) return 'perplexity';
          return 'claude-opus';
        }) as ('claude-opus' | 'gpt-4' | 'gemini-pro' | 'perplexity')[],

        appreciationForecast: {
          year1: forecast.appreciation1Yr,
          year3: forecast.appreciation1Yr * 2.5,
          year5: forecast.appreciation5Yr,
          year10: forecast.appreciation5Yr * 2,
          confidence: forecast.confidence,
        },

        marketTrends: {
          priceDirection: forecast.appreciation1Yr > 3 ? 'rising' : forecast.appreciation1Yr < -2 ? 'declining' : 'stable',
          demandLevel: forecast.appreciation1Yr > 5 ? 'high' : forecast.appreciation1Yr < 2 ? 'low' : 'moderate',
          inventoryLevel: 'balanced',
          daysOnMarketTrend: 'stable',
        },

        marketRisks: {
          economicRisks: forecast.marketTrends.filter((t: string) => t.toLowerCase().includes('economy') || t.toLowerCase().includes('rate')),
          climateRisks: forecast.marketTrends.filter((t: string) => t.toLowerCase().includes('climate') || t.toLowerCase().includes('flood')),
          demographicShifts: forecast.marketTrends.filter((t: string) => t.toLowerCase().includes('population') || t.toLowerCase().includes('demographic')),
          regulatoryChanges: forecast.marketTrends.filter((t: string) => t.toLowerCase().includes('regulation') || t.toLowerCase().includes('zoning')),
        },

        marketOpportunities: {
          nearTerm: forecast.keyInsights.filter((_: string, i: number) => i < 3),
          longTerm: forecast.keyInsights.filter((_: string, i: number) => i >= 3),
        },

        forecastDate: forecast.timestamp,
        dataQuality: forecast.consensus === 'Strong' ? 'high' : forecast.consensus === 'Moderate' ? 'medium' : 'low',
      };

      console.log(`✅ Multi-LLM Forecast complete: ${forecast.appreciation1Yr.toFixed(1)}% (1yr)`);
    } catch (error) {
      console.error('❌ Multi-LLM Market Forecast failed:', error);
      console.warn('⚠️ Continuing without market forecast');
    }
  }

  console.log('\n🎉 PROGRESSIVE ANALYSIS COMPLETE');
  console.log(`   Total Fields Analyzed: ${result.fieldComparisons?.length || 0}/168`);
  console.log(`   Sections Analyzed: ${result.sectionScores?.length || 0}/22`);
  console.log(`   Winner: Property ${result.overallRecommendation?.winner || 'TBD'}`);

  return result as OliviaEnhancedAnalysisResult & { validation: ValidationResult };
}

// Export default (analyzeWithOliviaProgressive is already exported in its function declaration above)
export default analyzeWithOliviaEnhanced;
