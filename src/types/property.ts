/**
 * CLUES Property Dashboard - Type Definitions
 * Complete 181-field property schema with confidence tracking
 * Updated: 2025-11-30 - Added 30 Stellar MLS fields (139-168)
 * Updated: 2025-01-05 - Added 13 Market Performance fields (169-181)
 */

// Confidence levels for data quality
export type ConfidenceLevel = 'High' | 'Medium-High' | 'Medium' | 'Low';

// Generic field with metadata
export interface DataField<T> {
  value: T | null;
  confidence: ConfidenceLevel;
  notes: string;
  sources: string[];
  lastUpdated?: string;
  updatedBy?: string;
  // NEW: LLM source tracking
  llmSources?: string[]; // Which LLMs provided this field (e.g., ['grok', 'perplexity'])
  hasConflict?: boolean; // True if multiple LLMs disagreed on this value
  conflictValues?: Array<{ source: string; value: any }>; // Conflicting values from different LLMs
  // NEW: Validation and arbitration metadata from API
  validationStatus?: 'passed' | 'failed' | 'warning' | 'valid' | 'single_source_warning';
  validationMessage?: string; // Human-readable description of validation issue
}

// Address & Identity (Fields 1-9) + Pricing (Fields 10-11) per fields-schema.ts
export interface AddressData {
  fullAddress: DataField<string>;        // #1 full_address
  mlsPrimary: DataField<string>;         // #2 mls_primary
  newConstructionYN: DataField<boolean>;  // #3 new_construction_yn
  listingStatus: DataField<string>;      // #4 listing_status
  listingDate: DataField<string>;        // #5 listing_date
  listingPrice: DataField<number>;       // #10 listing_price
  pricePerSqft: DataField<number>;       // #11 price_per_sqft
  streetAddress: DataField<string>;      // Derived from #1
  city: DataField<string>;               // Derived from #1
  state: DataField<string>;              // Derived from #1
  zipCode: DataField<string>;            // #8 zip_code
  county: DataField<string>;             // #7 county
  latitude: DataField<number>;           // Coordinates
  longitude: DataField<number>;          // Coordinates
  neighborhoodName: DataField<string>;   // #6 neighborhood
  primaryPhotoUrl?: DataField<string>;   // #169 property_photo_url (from Stellar MLS Media) - OPTIONAL
  photoGallery?: DataField<string[]>;    // #170 property_photos (all listing photos) - OPTIONAL
}

// Pricing & Value (12-16) + Property Basics (17-29) + HOA & Taxes (30-38) per fields-schema.ts
export interface PropertyDetails {
  bedrooms: DataField<number>;           // #17 bedrooms
  fullBathrooms: DataField<number>;      // #18 full_bathrooms
  halfBathrooms: DataField<number>;      // #19 half_bathrooms
  totalBathrooms: DataField<number>;     // #20 total_bathrooms
  livingSqft: DataField<number>;         // #21 living_sqft
  totalSqftUnderRoof: DataField<number>; // #22 total_sqft_under_roof
  lotSizeSqft: DataField<number>;        // #23 lot_size_sqft
  lotSizeAcres: DataField<number>;       // #24 lot_size_acres
  yearBuilt: DataField<number>;          // #25 year_built
  propertyType: DataField<string>;       // #26 property_type
  stories: DataField<number>;            // #27 stories
  garageSpaces: DataField<number>;       // #28 garage_spaces
  parkingTotal: DataField<string>;       // #29 parking_total
  hoaYn: DataField<boolean>;             // #30 hoa_yn
  hoaFeeAnnual: DataField<number>;       // #31 hoa_fee_annual
  hoaName: DataField<string>;            // #32 hoa_name
  hoaIncludes: DataField<string>;        // #33 hoa_includes
  annualTaxes: DataField<number>;        // #35 annual_taxes
  taxYear: DataField<number>;            // #36 tax_year
  assessedValue: DataField<number>;      // #15 assessed_value
  marketValueEstimate: DataField<number>; // #12 market_value_estimate
  lastSaleDate: DataField<string>;       // #13 last_sale_date
  lastSalePrice: DataField<number>;      // #14 last_sale_price
  ownershipType: DataField<string>;      // #34 ownership_type
  parcelId: DataField<string>;           // #9 parcel_id
}

// Structure & Systems (39-48) + Interior (49-53) + Exterior (54-58) + Permits (59-62) per fields-schema.ts
export interface StructuralDetails {
  roofType: DataField<string>;           // #39 roof_type
  roofAgeEst: DataField<string>;         // #40 roof_age_est
  exteriorMaterial: DataField<string>;   // #41 exterior_material
  foundation: DataField<string>;         // #42 foundation
  hvacType: DataField<string>;           // #45 hvac_type
  hvacAge: DataField<string>;            // #46 hvac_age
  waterHeaterType: DataField<string>;    // #43 water_heater_type
  garageType: DataField<string>;         // #44 garage_type
  flooringType: DataField<string>;       // #49 flooring_type
  kitchenFeatures: DataField<string>;    // #50 kitchen_features
  appliancesIncluded: DataField<string[]>; // #51 appliances_included
  laundryType: DataField<string>;        // #47 laundry_type
  fireplaceYn: DataField<boolean>;       // #52 fireplace_yn
  primaryBrLocation: DataField<string>;     // #53 primary_br_location (primary bedroom location)
  poolYn: DataField<boolean>;            // #54 pool_yn
  poolType: DataField<string>;           // #55 pool_type
  deckPatio: DataField<string>;          // #56 deck_patio
  fence: DataField<string>;              // #57 fence
  landscaping: DataField<string>;        // #58 landscaping
  recentRenovations: DataField<string>;  // #59 recent_renovations
  permitHistoryRoof: DataField<string>;  // #60 permit_history_roof
  permitHistoryHvac: DataField<string>;  // #61 permit_history_hvac
  permitHistoryPoolAdditions: DataField<string>; // #62 permit_history_other
  interiorCondition: DataField<string>;  // #48 interior_condition
}

// Location & Schools (63-90) per fields-schema.ts
export interface LocationData {
  assignedElementary: DataField<string>; // #65 elementary_school
  elementaryRating: DataField<string>;   // #66 elementary_rating
  elementaryDistanceMiles: DataField<number>; // #67 elementary_distance_mi
  assignedMiddle: DataField<string>;     // #68 middle_school
  middleRating: DataField<string>;       // #69 middle_rating
  middleDistanceMiles: DataField<number>; // #70 middle_distance_mi
  assignedHigh: DataField<string>;       // #71 high_school
  highRating: DataField<string>;         // #72 high_rating
  highDistanceMiles: DataField<number>;  // #73 high_distance_mi
  schoolDistrictName: DataField<string>; // #63 school_district
  elevationFeet: DataField<number>;      // #64 elevation_feet
  walkScore: DataField<number>;          // #74 walk_score
  transitScore: DataField<number>;       // #75 transit_score
  bikeScore: DataField<number>;          // #76 bike_score
  safetyScore: DataField<number>;        // #77 safety_score
  distanceGroceryMiles: DataField<number>; // #83 distance_grocery_mi
  distanceHospitalMiles: DataField<number>; // #84 distance_hospital_mi
  distanceAirportMiles: DataField<number>; // #85 distance_airport_mi
  distanceParkMiles: DataField<number>;  // #86 distance_park_mi
  distanceBeachMiles: DataField<number>; // #87 distance_beach_mi
  crimeIndexViolent: DataField<string>;  // #88 violent_crime_index
  crimeIndexProperty: DataField<string>; // #89 property_crime_index
  neighborhoodSafetyRating: DataField<string>; // #90 neighborhood_safety_rating
  noiseLevel: DataField<string>;         // #78 noise_level
  trafficLevel: DataField<string>;       // #79 traffic_level
  walkabilityDescription: DataField<string>; // #80 walkability_description
  commuteTimeCityCenter: DataField<string>; // #82 commute_to_city_center
  publicTransitAccess: DataField<string>; // #81 public_transit_access
}

// Financial Data (35-38, 91-103, 138) per fields-schema.ts
export interface FinancialData {
  annualPropertyTax: DataField<number>;  // #35 annual_taxes (duplicate reference)
  taxExemptions: DataField<string>;      // #38 tax_exemptions
  propertyTaxRate: DataField<number>;    // #37 property_tax_rate
  recentTaxPaymentHistory: DataField<string>; // Custom field (not in schema)
  medianHomePriceNeighborhood: DataField<number>; // #91 median_home_price_neighborhood
  pricePerSqftRecentAvg: DataField<number>; // #92 price_per_sqft_recent_avg
  avms: DataField<number>;     // #16 redfin_estimate
  // AVM Subfields (16a-16f) - Individual AVM Sources
  zestimate: DataField<number>;               // #16a Zillow Zestimate
  redfinEstimate: DataField<number>;          // #16b Redfin Estimate
  firstAmericanAvm: DataField<number>;        // #16c First American AVM (Homes.com)
  quantariumAvm: DataField<number>;           // #16d Quantarium AVM (Homes.com)
  iceAvm: DataField<number>;                  // #16e ICE AVM (Homes.com)
  collateralAnalyticsAvm: DataField<number>;  // #16f Collateral Analytics (Homes.com)
  priceToRentRatio: DataField<number>;   // #93 price_to_rent_ratio
  priceVsMedianPercent: DataField<number>; // #94 price_vs_median_percent
  daysOnMarketAvg: DataField<number>;    // #95 days_on_market_avg
  inventorySurplus: DataField<string>;   // #96 inventory_surplus
  rentalEstimateMonthly: DataField<number>; // #98 rental_estimate_monthly
  rentalYieldEst: DataField<number>;     // #99 rental_yield_est
  vacancyRateNeighborhood: DataField<number>; // #100 vacancy_rate_neighborhood
  capRateEst: DataField<number>;         // #101 cap_rate_est
  insuranceEstAnnual: DataField<number>; // #97 insurance_est_annual
  financingTerms: DataField<string>;     // #102 financing_terms
  comparableSalesLast3: DataField<string[]>; // #103 comparable_sales
  specialAssessments: DataField<string>; // #138 special_assessments
}

// Utilities & Environment (104-137) per fields-schema.ts
export interface UtilitiesData {
  electricProvider: DataField<string>;   // #104 electric_provider
  waterProvider: DataField<string>;      // #106 water_provider
  sewerProvider: DataField<string>;      // #108 sewer_provider
  naturalGas: DataField<boolean>;        // #109 natural_gas
  trashProvider: DataField<string>;      // #110 trash_provider
  internetProvidersTop3: DataField<string[]>; // #111 internet_providers_top3
  maxInternetSpeed: DataField<string>;   // #112 max_internet_speed
  fiberAvailable: DataField<boolean>;    // #113 fiber_available
  cableTvProvider: DataField<string>;    // #114 cable_tv_provider
  avgElectricBill: DataField<string>;    // #105 avg_electric_bill
  avgWaterBill: DataField<string>;       // #107 avg_water_bill
  cellCoverageQuality: DataField<string>; // #115 cell_coverage_quality
  emergencyServicesDistance: DataField<string>; // #116 emergency_services_distance
  airQualityIndexCurrent: DataField<string>; // #117 air_quality_index
  airQualityGrade: DataField<string>;    // #118 air_quality_grade
  floodZone: DataField<string>;          // #119 flood_zone
  floodRiskLevel: DataField<string>;     // #120 flood_risk_level
  climateRiskWildfireFlood: DataField<string>; // #121 climate_risk
  wildfireRisk: DataField<string>;       // #122 wildfire_risk
  earthquakeRisk: DataField<string>;     // #123 earthquake_risk
  hurricaneRisk: DataField<string>;      // #124 hurricane_risk
  tornadoRisk: DataField<string>;        // #125 tornado_risk
  radonRisk: DataField<string>;          // #126 radon_risk
  superfundNearby: DataField<boolean>;   // #127 superfund_site_nearby
  seaLevelRiseRisk: DataField<string>;   // #128 sea_level_rise_risk
  noiseLevelDbEst: DataField<string>;    // #129 noise_level_db_est
  solarPotential: DataField<string>;     // #130 solar_potential
  evChargingYn: DataField<boolean>;      // #133 ev_charging
  smartHomeFeatures: DataField<string>;  // #134 smart_home_features
  accessibilityMods: DataField<string>;  // #135 accessibility_modifications
  viewType: DataField<string>;           // #131 view_type
  lotFeatures: DataField<string>;        // #132 lot_features
  petPolicy: DataField<string>;          // #136 pet_policy
  ageRestrictions: DataField<string>;    // #137 age_restrictions
  notesConfidenceSummary: DataField<string>; // Custom field (not in schema)
}

// ================================================================
// Stellar MLS Data (Fields 139-168) - Added 2025-11-30
// ================================================================

// Stellar MLS - Parking (139-143) per fields-schema.ts
export interface StellarMLSParkingData {
  carportYn: DataField<boolean>;           // #139 carport_yn
  carportSpaces: DataField<number>;        // #140 carport_spaces
  garageAttachedYn: DataField<boolean>;    // #141 garage_attached_yn
  parkingFeatures: DataField<string[]>;    // #142 parking_features
  assignedParkingSpaces: DataField<number>; // #143 assigned_parking_spaces
}

// Stellar MLS - Building (144-148) per fields-schema.ts
export interface StellarMLSBuildingData {
  floorNumber: DataField<number>;          // #144 floor_number
  buildingTotalFloors: DataField<number>;  // #145 building_total_floors
  buildingNameNumber: DataField<string>;   // #146 building_name_number
  buildingElevatorYn: DataField<boolean>;  // #147 building_elevator_yn
  floorsInUnit: DataField<number>;         // #148 floors_in_unit
}

// Stellar MLS - Legal & Tax (149-154) per fields-schema.ts
export interface StellarMLSLegalData {
  subdivisionName: DataField<string>;      // #149 subdivision_name
  legalDescription: DataField<string>;     // #150 legal_description
  homesteadYn: DataField<boolean>;         // #151 homestead_yn
  cddYn: DataField<boolean>;               // #152 cdd_yn
  annualCddFee: DataField<number>;         // #153 annual_cdd_fee
  frontExposure: DataField<string>;        // #154 front_exposure
}

// Stellar MLS - Waterfront (155-159) per fields-schema.ts
export interface StellarMLSWaterfrontData {
  waterFrontageYn: DataField<boolean>;     // #155 water_frontage_yn
  waterfrontFeet: DataField<number>;       // #156 waterfront_feet
  waterAccessYn: DataField<boolean>;       // #157 water_access_yn
  waterViewYn: DataField<boolean>;         // #158 water_view_yn
  waterBodyName: DataField<string>;        // #159 water_body_name
}

// Stellar MLS - Leasing & Pets (160-165) per fields-schema.ts
export interface StellarMLSLeasingData {
  canBeLeasedYn: DataField<boolean>;       // #160 can_be_leased_yn
  minimumLeasePeriod: DataField<string>;   // #161 minimum_lease_period
  leaseRestrictionsYn: DataField<boolean>; // #162 lease_restrictions_yn
  petSizeLimit: DataField<string>;         // #163 pet_size_limit
  maxPetWeight: DataField<number>;         // #164 max_pet_weight
  associationApprovalYn: DataField<boolean>; // #165 association_approval_yn
}

// Stellar MLS - Features (166-168) per fields-schema.ts
export interface StellarMLSFeaturesData {
  communityFeatures: DataField<string[]>;  // #166 community_features
  interiorFeatures: DataField<string[]>;   // #167 interior_features
  exteriorFeatures: DataField<string[]>;   // #168 exterior_features
}

// Combined Stellar MLS Data interface
export interface StellarMLSData {
  parking: StellarMLSParkingData;
  building: StellarMLSBuildingData;
  legal: StellarMLSLegalData;
  waterfront: StellarMLSWaterfrontData;
  leasing: StellarMLSLeasingData;
  features: StellarMLSFeaturesData;
}

// ================================================================
// Market Performance Data (Fields 169-181) - Added 2025-01-05
// ================================================================

// Market Performance - Market Metrics (169-174) per fields-schema.ts
// Market Performance - Market Analysis (175-181) per fields-schema.ts
export interface MarketPerformanceData {
  monthsOfInventory: DataField<number>;     // #169 months_of_inventory
  newListings30d: DataField<number>;        // #170 new_listings_30d
  homesSold30d: DataField<number>;          // #171 homes_sold_30d
  medianDomZip: DataField<number>;          // #172 median_dom_zip
  priceReducedPercent: DataField<number>;   // #173 price_reduced_percent
  homesUnderContract: DataField<number>;    // #174 homes_under_contract
  marketType: DataField<string>;            // #175 market_type (buyer's/seller's/balanced)
  avgSaleToListPercent: DataField<number>;  // #176 avg_sale_to_list_percent
  avgDaysToPending: DataField<number>;      // #177 avg_days_to_pending
  multipleOffersLikelihood: DataField<string>; // #178 multiple_offers_likelihood
  appreciationPercent: DataField<number>;   // #179 appreciation_percent
  priceTrend: DataField<string>;            // #180 price_trend (increasing/decreasing/stable)
  rentZestimate: DataField<number>;         // #181 rent_zestimate
}

// Complete Property with all 181 fields
export interface Property {
  id: string;
  createdAt: string;
  updatedAt: string;
  address: AddressData;
  details: PropertyDetails;
  structural: StructuralDetails;
  location: LocationData;
  financial: FinancialData;
  utilities: UtilitiesData;
  // NEW: Stellar MLS fields (139-168) - Added 2025-11-30
  stellarMLS?: StellarMLSData;
  // NEW: Market Performance fields (169-181) - Added 2025-01-05
  marketPerformance?: MarketPerformanceData;

  // Computed scores
  smartScore?: number;
  dataCompleteness?: number; // Percentage (0-100)
  totalFieldsFound?: number; // Actual count of populated fields (0-181)
  aiConfidence?: number;

  // Images and media
  images?: string[];
  virtualTourUrl?: string;

  // MLS Listing Remarks - METADATA (NOT numbered fields)
  publicRemarks?: string;           // Full original remarks from MLS
  publicRemarksExtracted?: string;  // Remarks with parsed data removed (show to user)

  // Source tracking
  llmSources?: {
    claude?: boolean;
    gpt?: boolean;
    grok?: boolean;
    gemini?: boolean;
  };

  // Extended MLS Data (not part of 168-field schema)
  extendedMLS?: Record<string, any>;
}

// Simplified property card for lists
export interface PropertyCard {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  pricePerSqft: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt: number;
  smartScore?: number; // Only calculated during 3-property comparison
  dataCompleteness: number;
  thumbnail?: string;
  listingStatus: string;
  daysOnMarket?: number; // DOM from Stellar MLS - undefined if not available
  cumulativeDaysOnMarket?: number; // CDOM from Stellar MLS
  lastViewedAt?: string; // ISO 8601 timestamp when property was last viewed
  viewCount?: number; // Total views counter
  viewHistory?: string[]; // Array of ISO timestamps for "last 7 days" calculations
  savedByUsers?: string[]; // Array of user IDs who saved this property
  saveCount?: number; // Total number of saves
}

// API Response types
export interface PropertySearchResponse {
  properties: PropertyCard[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PropertyDetailResponse {
  property: Property;
  comparables?: PropertyCard[];
  marketAnalysis?: {
    priceVsMarket: number;
    appreciation1Year: number;
    appreciation5Year: number;
  };
}

// Filter options
export interface PropertyFilters {
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  maxBaths?: number;
  minSqft?: number;
  maxSqft?: number;
  propertyTypes?: string[];
  cities?: string[];
  listingStatus?: string[];
}

// Sort options
export type PropertySortField =
  | 'price'
  | 'pricePerSqft'
  | 'sqft'
  | 'bedrooms'
  | 'smartScore'
  | 'daysOnMarket'
  | 'yearBuilt';

export type SortDirection = 'asc' | 'desc';

export interface PropertySort {
  field: PropertySortField;
  direction: SortDirection;
}
