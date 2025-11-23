/**
 * CLUES Property Dashboard - Type Definitions
 * Complete 110-field property schema with confidence tracking
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
}

// Core Address Fields (1-10)
export interface AddressData {
  fullAddress: DataField<string>;        // #1
  mlsPrimary: DataField<string>;         // #2
  mlsSecondary: DataField<string>;       // #3
  listingStatus: DataField<string>;      // #4
  listingDate: DataField<string>;        // #5
  listingPrice: DataField<number>;       // #6
  pricePerSqft: DataField<number>;       // #7
  streetAddress: DataField<string>;
  city: DataField<string>;
  state: DataField<string>;
  zipCode: DataField<string>;
  county: DataField<string>;
  latitude: DataField<number>;
  longitude: DataField<number>;
}

// Property Details (8-30)
export interface PropertyDetails {
  bedrooms: DataField<number>;           // #8
  fullBathrooms: DataField<number>;      // #9
  halfBathrooms: DataField<number>;      // #10
  totalBathrooms: DataField<number>;     // #11
  livingSqft: DataField<number>;         // #12
  totalSqftUnderRoof: DataField<number>; // #13
  lotSizeSqft: DataField<number>;        // #14
  lotSizeAcres: DataField<number>;       // #15
  yearBuilt: DataField<number>;          // #16
  propertyType: DataField<string>;       // #17
  stories: DataField<number>;            // #18
  garageSpaces: DataField<number>;       // #19
  parkingTotal: DataField<string>;       // #20
  hoaYn: DataField<boolean>;             // #21
  hoaFeeAnnual: DataField<number>;       // #22
  annualTaxes: DataField<number>;        // #23
  taxYear: DataField<number>;            // #24
  assessedValue: DataField<number>;      // #25
  marketValueEstimate: DataField<number>; // #26
  lastSaleDate: DataField<string>;       // #27
  lastSalePrice: DataField<number>;      // #28
  ownershipType: DataField<string>;      // #29
  parcelId: DataField<string>;           // #30
}

// Structural Details (31-50)
export interface StructuralDetails {
  roofType: DataField<string>;           // #31
  roofAgeEst: DataField<string>;         // #32
  exteriorMaterial: DataField<string>;   // #33
  foundation: DataField<string>;         // #34
  hvacType: DataField<string>;           // #35
  hvacAge: DataField<string>;            // #36
  flooringType: DataField<string>;       // #37
  kitchenFeatures: DataField<string>;    // #38
  appliancesIncluded: DataField<string[]>; // #39
  fireplaceYn: DataField<boolean>;       // #40
  poolYn: DataField<boolean>;            // #41
  poolType: DataField<string>;           // #42
  deckPatio: DataField<string>;          // #43
  fence: DataField<string>;              // #44
  landscaping: DataField<string>;        // #45
  recentRenovations: DataField<string>;  // #46
  permitHistoryRoof: DataField<string>;  // #47
  permitHistoryHvac: DataField<string>;  // #48
  permitHistoryPoolAdditions: DataField<string>; // #49
  interiorCondition: DataField<string>;  // #50
}

// Location & Schools (51-75)
export interface LocationData {
  assignedElementary: DataField<string>; // #51
  elementaryRating: DataField<string>;   // #52
  elementaryDistanceMiles: DataField<number>; // #53
  assignedMiddle: DataField<string>;     // #54
  middleRating: DataField<string>;       // #55
  middleDistanceMiles: DataField<number>; // #56
  assignedHigh: DataField<string>;       // #57
  highRating: DataField<string>;         // #58
  highDistanceMiles: DataField<number>;  // #59
  walkScore: DataField<number>;          // #60
  transitScore: DataField<number>;       // #61
  bikeScore: DataField<number>;          // #62
  distanceGroceryMiles: DataField<number>; // #63
  distanceHospitalMiles: DataField<number>; // #64
  distanceAirportMiles: DataField<number>; // #65
  distanceParkMiles: DataField<number>;  // #66
  distanceBeachMiles: DataField<number>; // #67
  crimeIndexViolent: DataField<string>;  // #68
  crimeIndexProperty: DataField<string>; // #69
  neighborhoodSafetyRating: DataField<string>; // #70
  noiseLevel: DataField<string>;         // #71
  trafficLevel: DataField<string>;       // #72
  walkabilityDescription: DataField<string>; // #73
  commuteTimeCityCenter: DataField<string>; // #74
  publicTransitAccess: DataField<string>; // #75
}

// Financial Data (76-90)
export interface FinancialData {
  annualPropertyTax: DataField<number>;  // #76
  taxExemptions: DataField<string>;      // #77
  propertyTaxRate: DataField<number>;    // #78
  recentTaxPaymentHistory: DataField<string>; // #79
  medianHomePriceNeighborhood: DataField<number>; // #80
  pricePerSqftRecentAvg: DataField<number>; // #81
  daysOnMarketAvg: DataField<number>;    // #82
  inventorySurplus: DataField<string>;   // #83
  rentalEstimateMonthly: DataField<number>; // #84
  rentalYieldEst: DataField<number>;     // #85
  vacancyRateNeighborhood: DataField<number>; // #86
  capRateEst: DataField<number>;         // #87
  insuranceEstAnnual: DataField<number>; // #88
  financingTerms: DataField<string>;     // #89
  comparableSalesLast3: DataField<string[]>; // #90
}

// Utilities & Environment (91-110)
export interface UtilitiesData {
  electricProvider: DataField<string>;   // #91
  waterProvider: DataField<string>;      // #92
  sewerProvider: DataField<string>;      // #93
  naturalGas: DataField<string>;         // #94
  internetProvidersTop3: DataField<string[]>; // #95
  maxInternetSpeed: DataField<string>;   // #96
  cableTvProvider: DataField<string>;    // #97
  airQualityIndexCurrent: DataField<string>; // #98
  floodZone: DataField<string>;          // #99
  floodRiskLevel: DataField<string>;     // #100
  climateRiskWildfireFlood: DataField<string>; // #101
  noiseLevelDbEst: DataField<string>;    // #102
  solarPotential: DataField<string>;     // #103
  evChargingYn: DataField<string>;       // #104
  smartHomeFeatures: DataField<string>;  // #105
  accessibilityMods: DataField<string>;  // #106
  petPolicy: DataField<string>;          // #107
  ageRestrictions: DataField<string>;    // #108
  specialAssessments: DataField<string>; // #109
  notesConfidenceSummary: DataField<string>; // #110
}

// Complete Property with all 110 fields
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

  // Computed scores
  smartScore?: number;
  dataCompleteness?: number;
  aiConfidence?: number;

  // Images and media
  images?: string[];
  virtualTourUrl?: string;

  // Source tracking
  llmSources?: {
    claude?: boolean;
    gpt?: boolean;
    grok?: boolean;
    gemini?: boolean;
  };
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
  smartScore: number;
  dataCompleteness: number;
  thumbnail?: string;
  listingStatus: string;
  daysOnMarket: number;
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
