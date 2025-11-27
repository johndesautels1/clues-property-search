/**
 * CLUES Property Dashboard - Complete 110-Field Schema
 * Organized in 18 logical groups with source tracking
 * Sources visible to admin only, hidden from user
 */

// All possible data sources (aligned with unified data-sources.ts manifest)
// REMOVED (2025-11-27): Zillow, Redfin, Realtor.com (scrapers blocked), BroadbandNow (not wired)
export const DATA_SOURCES = [
  'Manual Entry',
  'Stellar MLS',
  'County Assessor',
  'County Tax Collector',
  'County Clerk',
  'County Permits',
  'USPS',
  'Google Geocode',
  'Google Places',
  'Google Maps',
  'Google Street View',
  'Google Earth',
  'Google Sunroof',
  'WalkScore',
  'SchoolDigger',
  'GreatSchools',
  'Niche',
  'NeighborhoodScout',
  'FBI Crime',
  'FEMA',
  'First Street',
  'IQAir',
  'AirNow',
  'HowLoud',
  'Weather',
  'Duke Energy',
  'TECO',
  'City Utility',
  'RentCafe',
  'Zumper',
  'Census',
  'HOA Records',
  'Listing Photos',
  'Local Logic',
  'Transit Maps',
  'Perplexity',
  'Grok',
  'Claude Opus',
  'GPT',
  'Claude Sonnet',
  'Gemini',
  'Other',
] as const;

export type DataSource = typeof DATA_SOURCES[number];

// Confidence levels
export type ConfidenceLevel = 'High' | 'Medium' | 'Low' | 'Unverified';

// Single field with source tracking
export interface TrackedField<T = string> {
  value: T;
  source: DataSource;
  confidence: ConfidenceLevel;
  lastUpdated: string; // ISO date
  notes?: string;
}

// Helper to create empty field
export function createField<T>(defaultValue: T, source: DataSource = 'Manual Entry'): TrackedField<T> {
  return {
    value: defaultValue,
    source,
    confidence: 'Unverified',
    lastUpdated: new Date().toISOString(),
  };
}

// ================================================================
// GROUP A: Address & Identity (Fields 1-6)
// ================================================================
export interface AddressIdentity {
  fullAddress: TrackedField<string>;           // 1
  mlsPrimary: TrackedField<string>;            // 2
  mlsSecondary: TrackedField<string>;          // 3
  listingStatus: TrackedField<'Active' | 'Pending' | 'Sold' | 'Off-Market' | ''>; // 4
  listingDate: TrackedField<string>;           // 5
  parcelId: TrackedField<string>;              // 6
}

// ================================================================
// GROUP B: Pricing (Fields 7-11)
// ================================================================
export interface Pricing {
  listingPrice: TrackedField<number>;          // 7
  pricePerSqft: TrackedField<number>;          // 8
  marketValueEstimate: TrackedField<number>;   // 9
  lastSaleDate: TrackedField<string>;          // 10
  lastSalePrice: TrackedField<number>;         // 11
}

// ================================================================
// GROUP C: Property Basics (Fields 12-24)
// ================================================================
export interface PropertyBasics {
  bedrooms: TrackedField<number>;              // 12
  fullBathrooms: TrackedField<number>;         // 13
  halfBathrooms: TrackedField<number>;         // 14
  totalBathrooms: TrackedField<number>;        // 15 (calculated)
  livingSqft: TrackedField<number>;            // 16
  totalSqftUnderRoof: TrackedField<number>;    // 17
  lotSizeSqft: TrackedField<number>;           // 18
  lotSizeAcres: TrackedField<number>;          // 19 (calculated)
  yearBuilt: TrackedField<number>;             // 20
  propertyType: TrackedField<string>;          // 21
  stories: TrackedField<number>;               // 22
  garageSpaces: TrackedField<number>;          // 23
  parkingTotal: TrackedField<string>;          // 24
}

// ================================================================
// GROUP D: HOA & Ownership (Fields 25-28)
// ================================================================
export interface HoaOwnership {
  hoaYn: TrackedField<boolean>;                // 25
  hoaFeeAnnual: TrackedField<number>;          // 26
  ownershipType: TrackedField<string>;         // 27
  county: TrackedField<string>;                // 28
}

// ================================================================
// GROUP E: Taxes & Assessments (Fields 29-35)
// ================================================================
export interface TaxesAssessments {
  annualTaxes: TrackedField<number>;           // 29
  taxYear: TrackedField<number>;               // 30
  assessedValue: TrackedField<number>;         // 31
  taxExemptions: TrackedField<string>;         // 32
  propertyTaxRate: TrackedField<number>;       // 33 (percentage)
  recentTaxHistory: TrackedField<string>;      // 34
  specialAssessments: TrackedField<string>;    // 35
}

// ================================================================
// GROUP F: Structure & Systems (Fields 36-41)
// ================================================================
export interface StructureSystems {
  roofType: TrackedField<string>;              // 36
  roofAgeEst: TrackedField<string>;            // 37
  exteriorMaterial: TrackedField<string>;      // 38
  foundation: TrackedField<string>;            // 39
  hvacType: TrackedField<string>;              // 40
  hvacAge: TrackedField<string>;               // 41
}

// ================================================================
// GROUP G: Interior Features (Fields 42-46)
// ================================================================
export interface InteriorFeatures {
  flooringType: TrackedField<string>;          // 42
  kitchenFeatures: TrackedField<string>;       // 43
  appliancesIncluded: TrackedField<string[]>;  // 44
  fireplaceYn: TrackedField<boolean>;          // 45
  interiorCondition: TrackedField<string>;     // 46
}

// ================================================================
// GROUP H: Exterior Features (Fields 47-51)
// ================================================================
export interface ExteriorFeatures {
  poolYn: TrackedField<boolean>;               // 47
  poolType: TrackedField<string>;              // 48
  deckPatio: TrackedField<string>;             // 49
  fence: TrackedField<string>;                 // 50
  landscaping: TrackedField<string>;           // 51
}

// ================================================================
// GROUP I: Permits & Renovations (Fields 52-55)
// ================================================================
export interface PermitsRenovations {
  recentRenovations: TrackedField<string>;     // 52
  permitHistoryRoof: TrackedField<string>;     // 53
  permitHistoryHvac: TrackedField<string>;     // 54
  permitHistoryOther: TrackedField<string>;    // 55
}

// ================================================================
// GROUP J: Schools (Fields 56-64)
// ================================================================
export interface Schools {
  assignedElementary: TrackedField<string>;    // 56
  elementaryRating: TrackedField<string>;      // 57
  elementaryDistanceMiles: TrackedField<number>; // 58
  assignedMiddle: TrackedField<string>;        // 59
  middleRating: TrackedField<string>;          // 60
  middleDistanceMiles: TrackedField<number>;   // 61
  assignedHigh: TrackedField<string>;          // 62
  highRating: TrackedField<string>;            // 63
  highDistanceMiles: TrackedField<number>;     // 64
}

// ================================================================
// GROUP K: Location Scores (Fields 65-72)
// ================================================================
export interface LocationScores {
  walkScore: TrackedField<string>;             // 65
  transitScore: TrackedField<string>;          // 66
  bikeScore: TrackedField<string>;             // 67
  noiseLevel: TrackedField<string>;            // 68
  trafficLevel: TrackedField<string>;          // 69
  walkabilityDescription: TrackedField<string>; // 70
  commuteTimeCityCenter: TrackedField<string>; // 71
  publicTransitAccess: TrackedField<string>;   // 72
}

// ================================================================
// GROUP L: Distances & Amenities (Fields 73-77)
// ================================================================
export interface DistancesAmenities {
  distanceGroceryMiles: TrackedField<number>;  // 73
  distanceHospitalMiles: TrackedField<number>; // 74
  distanceAirportMiles: TrackedField<number>;  // 75
  distanceParkMiles: TrackedField<number>;     // 76
  distanceBeachMiles: TrackedField<number>;    // 77
}

// ================================================================
// GROUP M: Safety & Crime (Fields 78-80)
// ================================================================
export interface SafetyCrime {
  crimeIndexViolent: TrackedField<string>;     // 78
  crimeIndexProperty: TrackedField<string>;    // 79
  neighborhoodSafetyRating: TrackedField<string>; // 80
}

// ================================================================
// GROUP N: Market & Investment (Fields 81-91)
// ================================================================
export interface MarketInvestment {
  medianHomePriceNeighborhood: TrackedField<number>; // 81
  pricePerSqftRecentAvg: TrackedField<number>; // 82
  daysOnMarketAvg: TrackedField<number>;       // 83
  inventorySurplus: TrackedField<string>;      // 84
  rentalEstimateMonthly: TrackedField<number>; // 85
  rentalYieldEst: TrackedField<number>;        // 86 (percentage)
  vacancyRateNeighborhood: TrackedField<number>; // 87 (percentage)
  capRateEst: TrackedField<number>;            // 88 (percentage)
  insuranceEstAnnual: TrackedField<number>;    // 89
  financingTerms: TrackedField<string>;        // 90
  comparableSales: TrackedField<string>;       // 91
}

// ================================================================
// GROUP O: Utilities (Fields 92-98)
// ================================================================
export interface Utilities {
  electricProvider: TrackedField<string>;      // 92
  waterProvider: TrackedField<string>;         // 93
  sewerProvider: TrackedField<string>;         // 94
  naturalGas: TrackedField<string>;            // 95
  internetProvidersTop3: TrackedField<string[]>; // 96
  maxInternetSpeed: TrackedField<string>;      // 97
  cableTvProvider: TrackedField<string>;       // 98
}

// ================================================================
// GROUP P: Environment & Risk (Fields 99-104)
// ================================================================
export interface EnvironmentRisk {
  airQualityIndexCurrent: TrackedField<string>; // 99
  floodZone: TrackedField<string>;             // 100
  floodRiskLevel: TrackedField<string>;        // 101
  climateRiskSummary: TrackedField<string>;    // 102
  noiseLevelDbEst: TrackedField<string>;       // 103
  solarPotential: TrackedField<string>;        // 104
}

// ================================================================
// GROUP Q: Additional Features (Fields 105-110)
// ================================================================
export interface AdditionalFeatures {
  evChargingYn: TrackedField<string>;          // 105
  smartHomeFeatures: TrackedField<string>;     // 106
  accessibilityMods: TrackedField<string>;     // 107
  petPolicy: TrackedField<string>;             // 108
  ageRestrictions: TrackedField<string>;       // 109
  notesConfidenceSummary: TrackedField<string>; // 110
}

// ================================================================
// COMPLETE 110-FIELD PROPERTY
// ================================================================
export interface Property110 {
  id: string;

  // All 18 groups
  addressIdentity: AddressIdentity;        // 1-6
  pricing: Pricing;                        // 7-11
  propertyBasics: PropertyBasics;          // 12-24
  hoaOwnership: HoaOwnership;              // 25-28
  taxesAssessments: TaxesAssessments;      // 29-35
  structureSystems: StructureSystems;      // 36-41
  interiorFeatures: InteriorFeatures;      // 42-46
  exteriorFeatures: ExteriorFeatures;      // 47-51
  permitsRenovations: PermitsRenovations;  // 52-55
  schools: Schools;                        // 56-64
  locationScores: LocationScores;          // 65-72
  distancesAmenities: DistancesAmenities;  // 73-77
  safetyCrime: SafetyCrime;                // 78-80
  marketInvestment: MarketInvestment;      // 81-91
  utilities: Utilities;                    // 92-98
  environmentRisk: EnvironmentRisk;        // 99-104
  additionalFeatures: AdditionalFeatures;  // 105-110

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string; // user ID
  smartScore: number;
  dataCompleteness: number; // percentage
}

// ================================================================
// FIELD DEFINITIONS FOR UI RENDERING
// ================================================================
export interface FieldDefinition {
  id: number;
  key: string;
  label: string;
  group: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | 'currency' | 'percentage';
  options?: string[];
  required: boolean;
  placeholder?: string;
  helpText?: string;
  autoPopulateSources?: DataSource[];
}

export const FIELD_DEFINITIONS: FieldDefinition[] = [
  // GROUP A: Address & Identity (1-6)
  { id: 1, key: 'addressIdentity.fullAddress', label: 'Full Address', group: 'Address & Identity', type: 'text', required: true, placeholder: '123 Main St, City, FL 33701' },
  { id: 2, key: 'addressIdentity.mlsPrimary', label: 'MLS # (Primary)', group: 'Address & Identity', type: 'text', required: false, placeholder: 'TB8437491', autoPopulateSources: ['Stellar MLS'] },
  { id: 3, key: 'addressIdentity.mlsSecondary', label: 'MLS # (Secondary)', group: 'Address & Identity', type: 'text', required: false },
  { id: 4, key: 'addressIdentity.listingStatus', label: 'Listing Status', group: 'Address & Identity', type: 'select', options: ['Active', 'Pending', 'Sold', 'Off-Market'], required: false, autoPopulateSources: ['Stellar MLS'] },
  { id: 5, key: 'addressIdentity.listingDate', label: 'Listing Date', group: 'Address & Identity', type: 'date', required: false },
  { id: 6, key: 'addressIdentity.parcelId', label: 'Parcel ID', group: 'Address & Identity', type: 'text', required: false, autoPopulateSources: ['County Assessor'] },

  // GROUP B: Pricing (7-11)
  { id: 7, key: 'pricing.listingPrice', label: 'Listing Price', group: 'Pricing', type: 'currency', required: false, autoPopulateSources: ['Stellar MLS'] },
  { id: 8, key: 'pricing.pricePerSqft', label: 'Price per Sq Ft', group: 'Pricing', type: 'currency', required: false, helpText: 'Auto-calculated from price/sqft' },
  { id: 9, key: 'pricing.marketValueEstimate', label: 'Market Value Estimate', group: 'Pricing', type: 'currency', required: false, autoPopulateSources: ['County Assessor', 'Perplexity'] },
  { id: 10, key: 'pricing.lastSaleDate', label: 'Last Sale Date', group: 'Pricing', type: 'date', required: false, autoPopulateSources: ['County Clerk', 'Stellar MLS'] },
  { id: 11, key: 'pricing.lastSalePrice', label: 'Last Sale Price', group: 'Pricing', type: 'currency', required: false, autoPopulateSources: ['County Clerk', 'Stellar MLS'] },

  // GROUP C: Property Basics (12-24)
  { id: 12, key: 'propertyBasics.bedrooms', label: 'Bedrooms', group: 'Property Basics', type: 'number', required: true, autoPopulateSources: ['Stellar MLS', 'County Assessor'] },
  { id: 13, key: 'propertyBasics.fullBathrooms', label: 'Full Bathrooms', group: 'Property Basics', type: 'number', required: true, autoPopulateSources: ['Stellar MLS', 'County Assessor'] },
  { id: 14, key: 'propertyBasics.halfBathrooms', label: 'Half Bathrooms', group: 'Property Basics', type: 'number', required: true, autoPopulateSources: ['Stellar MLS', 'County Assessor'] },
  { id: 15, key: 'propertyBasics.totalBathrooms', label: 'Total Bathrooms', group: 'Property Basics', type: 'number', required: false, helpText: 'Calculated: full + (half × 0.5)' },
  { id: 16, key: 'propertyBasics.livingSqft', label: 'Living Sq Ft', group: 'Property Basics', type: 'number', required: true, autoPopulateSources: ['Stellar MLS', 'County Assessor'] },
  { id: 17, key: 'propertyBasics.totalSqftUnderRoof', label: 'Total Sq Ft Under Roof', group: 'Property Basics', type: 'number', required: false },
  { id: 18, key: 'propertyBasics.lotSizeSqft', label: 'Lot Size (Sq Ft)', group: 'Property Basics', type: 'number', required: false, autoPopulateSources: ['County Assessor', 'Stellar MLS'] },
  { id: 19, key: 'propertyBasics.lotSizeAcres', label: 'Lot Size (Acres)', group: 'Property Basics', type: 'number', required: false, helpText: 'Calculated from sq ft' },
  { id: 20, key: 'propertyBasics.yearBuilt', label: 'Year Built', group: 'Property Basics', type: 'number', required: true, autoPopulateSources: ['County Assessor', 'Stellar MLS'] },
  { id: 21, key: 'propertyBasics.propertyType', label: 'Property Type', group: 'Property Basics', type: 'select', options: ['Single Family', 'Condo', 'Townhouse', 'Multi-Family', 'Land', 'Commercial'], required: true },
  { id: 22, key: 'propertyBasics.stories', label: 'Stories', group: 'Property Basics', type: 'number', required: false, autoPopulateSources: ['Stellar MLS'] },
  { id: 23, key: 'propertyBasics.garageSpaces', label: 'Garage Spaces', group: 'Property Basics', type: 'number', required: false },
  { id: 24, key: 'propertyBasics.parkingTotal', label: 'Parking Description', group: 'Property Basics', type: 'text', required: false, placeholder: '2 car garage + driveway' },

  // GROUP D: HOA & Ownership (25-28)
  { id: 25, key: 'hoaOwnership.hoaYn', label: 'HOA?', group: 'HOA & Ownership', type: 'boolean', required: true },
  { id: 26, key: 'hoaOwnership.hoaFeeAnnual', label: 'HOA Fee (Annual)', group: 'HOA & Ownership', type: 'currency', required: false },
  { id: 27, key: 'hoaOwnership.ownershipType', label: 'Ownership Type', group: 'HOA & Ownership', type: 'select', options: ['Fee Simple', 'Leasehold', 'Condo', 'Co-op'], required: false },
  { id: 28, key: 'hoaOwnership.county', label: 'County', group: 'HOA & Ownership', type: 'text', required: false, autoPopulateSources: ['County Assessor', 'Google Maps'] },

  // GROUP E: Taxes & Assessments (29-35)
  { id: 29, key: 'taxesAssessments.annualTaxes', label: 'Annual Property Taxes', group: 'Taxes & Assessments', type: 'currency', required: false, autoPopulateSources: ['County Tax Collector'] },
  { id: 30, key: 'taxesAssessments.taxYear', label: 'Tax Year', group: 'Taxes & Assessments', type: 'number', required: false },
  { id: 31, key: 'taxesAssessments.assessedValue', label: 'Assessed Value', group: 'Taxes & Assessments', type: 'currency', required: false, autoPopulateSources: ['County Assessor'] },
  { id: 32, key: 'taxesAssessments.taxExemptions', label: 'Tax Exemptions', group: 'Taxes & Assessments', type: 'text', required: false, placeholder: 'Homestead exemption' },
  { id: 33, key: 'taxesAssessments.propertyTaxRate', label: 'Property Tax Rate', group: 'Taxes & Assessments', type: 'percentage', required: false },
  { id: 34, key: 'taxesAssessments.recentTaxHistory', label: 'Recent Tax History', group: 'Taxes & Assessments', type: 'text', required: false },
  { id: 35, key: 'taxesAssessments.specialAssessments', label: 'Special Assessments', group: 'Taxes & Assessments', type: 'text', required: false, placeholder: 'None' },

  // GROUP F: Structure & Systems (36-41)
  { id: 36, key: 'structureSystems.roofType', label: 'Roof Type', group: 'Structure & Systems', type: 'select', options: ['Shingle', 'Tile', 'Metal', 'Flat', 'Other'], required: false },
  { id: 37, key: 'structureSystems.roofAgeEst', label: 'Roof Age (Est.)', group: 'Structure & Systems', type: 'text', required: false, placeholder: '~10 years (2014 permit)', autoPopulateSources: ['County Permits'] },
  { id: 38, key: 'structureSystems.exteriorMaterial', label: 'Exterior Material', group: 'Structure & Systems', type: 'select', options: ['Block/Stucco', 'Brick', 'Wood', 'Vinyl Siding', 'Fiber Cement', 'Other'], required: false },
  { id: 39, key: 'structureSystems.foundation', label: 'Foundation', group: 'Structure & Systems', type: 'select', options: ['Slab', 'Crawl Space', 'Basement', 'Pier/Beam'], required: false },
  { id: 40, key: 'structureSystems.hvacType', label: 'HVAC Type', group: 'Structure & Systems', type: 'text', required: false, placeholder: 'Central Air/Heat' },
  { id: 41, key: 'structureSystems.hvacAge', label: 'HVAC Age (Est.)', group: 'Structure & Systems', type: 'text', required: false, autoPopulateSources: ['County Permits'] },

  // GROUP G: Interior Features (42-46)
  { id: 42, key: 'interiorFeatures.flooringType', label: 'Flooring Type', group: 'Interior Features', type: 'text', required: false, placeholder: 'Tile, Laminate, Carpet' },
  { id: 43, key: 'interiorFeatures.kitchenFeatures', label: 'Kitchen Features', group: 'Interior Features', type: 'text', required: false, placeholder: 'Granite counters, SS appliances' },
  { id: 44, key: 'interiorFeatures.appliancesIncluded', label: 'Appliances Included', group: 'Interior Features', type: 'multiselect', options: ['Refrigerator', 'Dishwasher', 'Range/Oven', 'Microwave', 'Washer', 'Dryer', 'Disposal'], required: false },
  { id: 45, key: 'interiorFeatures.fireplaceYn', label: 'Fireplace?', group: 'Interior Features', type: 'boolean', required: false },
  { id: 46, key: 'interiorFeatures.interiorCondition', label: 'Interior Condition', group: 'Interior Features', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Needs Work', 'Renovated'], required: false },

  // GROUP H: Exterior Features (47-51)
  { id: 47, key: 'exteriorFeatures.poolYn', label: 'Pool?', group: 'Exterior Features', type: 'boolean', required: false },
  { id: 48, key: 'exteriorFeatures.poolType', label: 'Pool Type', group: 'Exterior Features', type: 'select', options: ['N/A', 'In-ground', 'Above-ground', 'In-ground Heated', 'Community'], required: false },
  { id: 49, key: 'exteriorFeatures.deckPatio', label: 'Deck/Patio', group: 'Exterior Features', type: 'text', required: false, placeholder: 'Screened lanai, covered patio' },
  { id: 50, key: 'exteriorFeatures.fence', label: 'Fence', group: 'Exterior Features', type: 'text', required: false, placeholder: 'Privacy fence, chain link' },
  { id: 51, key: 'exteriorFeatures.landscaping', label: 'Landscaping', group: 'Exterior Features', type: 'text', required: false },

  // GROUP I: Permits & Renovations (52-55)
  { id: 52, key: 'permitsRenovations.recentRenovations', label: 'Recent Renovations', group: 'Permits & Renovations', type: 'text', required: false },
  { id: 53, key: 'permitsRenovations.permitHistoryRoof', label: 'Permit History - Roof', group: 'Permits & Renovations', type: 'text', required: false, autoPopulateSources: ['County Permits'] },
  { id: 54, key: 'permitsRenovations.permitHistoryHvac', label: 'Permit History - HVAC', group: 'Permits & Renovations', type: 'text', required: false, autoPopulateSources: ['County Permits'] },
  { id: 55, key: 'permitsRenovations.permitHistoryOther', label: 'Permit History - Other', group: 'Permits & Renovations', type: 'text', required: false, autoPopulateSources: ['County Permits'] },

  // GROUP J: Schools (56-64)
  { id: 56, key: 'schools.assignedElementary', label: 'Assigned Elementary', group: 'Schools', type: 'text', required: false, autoPopulateSources: ['SchoolDigger', 'GreatSchools'] },
  { id: 57, key: 'schools.elementaryRating', label: 'Elementary Rating', group: 'Schools', type: 'text', required: false, placeholder: '8/10', autoPopulateSources: ['GreatSchools', 'Niche'] },
  { id: 58, key: 'schools.elementaryDistanceMiles', label: 'Elementary Distance (mi)', group: 'Schools', type: 'number', required: false, autoPopulateSources: ['Google Maps'] },
  { id: 59, key: 'schools.assignedMiddle', label: 'Assigned Middle', group: 'Schools', type: 'text', required: false },
  { id: 60, key: 'schools.middleRating', label: 'Middle Rating', group: 'Schools', type: 'text', required: false },
  { id: 61, key: 'schools.middleDistanceMiles', label: 'Middle Distance (mi)', group: 'Schools', type: 'number', required: false },
  { id: 62, key: 'schools.assignedHigh', label: 'Assigned High', group: 'Schools', type: 'text', required: false },
  { id: 63, key: 'schools.highRating', label: 'High Rating', group: 'Schools', type: 'text', required: false },
  { id: 64, key: 'schools.highDistanceMiles', label: 'High Distance (mi)', group: 'Schools', type: 'number', required: false },

  // GROUP K: Location Scores (65-72)
  { id: 65, key: 'locationScores.walkScore', label: 'Walk Score', group: 'Location Scores', type: 'text', required: false, autoPopulateSources: ['WalkScore'] },
  { id: 66, key: 'locationScores.transitScore', label: 'Transit Score', group: 'Location Scores', type: 'text', required: false, autoPopulateSources: ['WalkScore'] },
  { id: 67, key: 'locationScores.bikeScore', label: 'Bike Score', group: 'Location Scores', type: 'text', required: false, autoPopulateSources: ['WalkScore'] },
  { id: 68, key: 'locationScores.noiseLevel', label: 'Noise Level', group: 'Location Scores', type: 'select', options: ['Quiet', 'Moderate', 'Busy', 'Noisy'], required: false },
  { id: 69, key: 'locationScores.trafficLevel', label: 'Traffic Level', group: 'Location Scores', type: 'select', options: ['Low', 'Medium', 'High'], required: false },
  { id: 70, key: 'locationScores.walkabilityDescription', label: 'Walkability Description', group: 'Location Scores', type: 'text', required: false },
  { id: 71, key: 'locationScores.commuteTimeCityCenter', label: 'Commute to City Center', group: 'Location Scores', type: 'text', required: false, placeholder: '~25 min to Tampa', autoPopulateSources: ['Google Maps'] },
  { id: 72, key: 'locationScores.publicTransitAccess', label: 'Public Transit Access', group: 'Location Scores', type: 'text', required: false },

  // GROUP L: Distances & Amenities (73-77)
  { id: 73, key: 'distancesAmenities.distanceGroceryMiles', label: 'Distance to Grocery (mi)', group: 'Distances & Amenities', type: 'number', required: false, autoPopulateSources: ['Google Maps'] },
  { id: 74, key: 'distancesAmenities.distanceHospitalMiles', label: 'Distance to Hospital (mi)', group: 'Distances & Amenities', type: 'number', required: false, autoPopulateSources: ['Google Maps'] },
  { id: 75, key: 'distancesAmenities.distanceAirportMiles', label: 'Distance to Airport (mi)', group: 'Distances & Amenities', type: 'number', required: false, autoPopulateSources: ['Google Maps'] },
  { id: 76, key: 'distancesAmenities.distanceParkMiles', label: 'Distance to Park (mi)', group: 'Distances & Amenities', type: 'number', required: false, autoPopulateSources: ['Google Maps'] },
  { id: 77, key: 'distancesAmenities.distanceBeachMiles', label: 'Distance to Beach (mi)', group: 'Distances & Amenities', type: 'number', required: false, autoPopulateSources: ['Google Maps'] },

  // GROUP M: Safety & Crime (78-80)
  { id: 78, key: 'safetyCrime.crimeIndexViolent', label: 'Violent Crime Index', group: 'Safety & Crime', type: 'text', required: false, autoPopulateSources: ['FBI Crime', 'NeighborhoodScout'] },
  { id: 79, key: 'safetyCrime.crimeIndexProperty', label: 'Property Crime Index', group: 'Safety & Crime', type: 'text', required: false, autoPopulateSources: ['FBI Crime', 'NeighborhoodScout'] },
  { id: 80, key: 'safetyCrime.neighborhoodSafetyRating', label: 'Neighborhood Safety Rating', group: 'Safety & Crime', type: 'text', required: false, autoPopulateSources: ['NeighborhoodScout'] },

  // GROUP N: Market & Investment (81-91)
  { id: 81, key: 'marketInvestment.medianHomePriceNeighborhood', label: 'Median Home Price (Area)', group: 'Market & Investment', type: 'currency', required: false, autoPopulateSources: ['Perplexity', 'Grok'] },
  { id: 82, key: 'marketInvestment.pricePerSqftRecentAvg', label: 'Avg $/SqFt (Recent Sales)', group: 'Market & Investment', type: 'currency', required: false },
  { id: 83, key: 'marketInvestment.daysOnMarketAvg', label: 'Avg Days on Market (Area)', group: 'Market & Investment', type: 'number', required: false },
  { id: 84, key: 'marketInvestment.inventorySurplus', label: 'Inventory Surplus', group: 'Market & Investment', type: 'text', required: false },
  { id: 85, key: 'marketInvestment.rentalEstimateMonthly', label: 'Rental Estimate (Monthly)', group: 'Market & Investment', type: 'currency', required: false, autoPopulateSources: ['RentCafe', 'Zumper', 'Perplexity'] },
  { id: 86, key: 'marketInvestment.rentalYieldEst', label: 'Rental Yield Est. (%)', group: 'Market & Investment', type: 'percentage', required: false, helpText: 'Calculated: (rent×12)/price' },
  { id: 87, key: 'marketInvestment.vacancyRateNeighborhood', label: 'Vacancy Rate (Area %)', group: 'Market & Investment', type: 'percentage', required: false, autoPopulateSources: ['Census'] },
  { id: 88, key: 'marketInvestment.capRateEst', label: 'Cap Rate Est. (%)', group: 'Market & Investment', type: 'percentage', required: false },
  { id: 89, key: 'marketInvestment.insuranceEstAnnual', label: 'Insurance Est. (Annual)', group: 'Market & Investment', type: 'currency', required: false },
  { id: 90, key: 'marketInvestment.financingTerms', label: 'Financing Terms', group: 'Market & Investment', type: 'text', required: false },
  { id: 91, key: 'marketInvestment.comparableSales', label: 'Comparable Sales', group: 'Market & Investment', type: 'text', required: false },

  // GROUP O: Utilities (92-98)
  { id: 92, key: 'utilities.electricProvider', label: 'Electric Provider', group: 'Utilities', type: 'text', required: false, autoPopulateSources: ['Duke Energy', 'TECO', 'City Utility'] },
  { id: 93, key: 'utilities.waterProvider', label: 'Water Provider', group: 'Utilities', type: 'text', required: false },
  { id: 94, key: 'utilities.sewerProvider', label: 'Sewer Provider', group: 'Utilities', type: 'text', required: false },
  { id: 95, key: 'utilities.naturalGas', label: 'Natural Gas', group: 'Utilities', type: 'text', required: false, placeholder: 'Available / Not Available' },
  { id: 96, key: 'utilities.internetProvidersTop3', label: 'Internet Providers', group: 'Utilities', type: 'multiselect', options: ['Spectrum', 'AT&T', 'Frontier', 'Xfinity', 'T-Mobile Home', 'Starlink'], required: false, autoPopulateSources: ['Perplexity', 'Grok'] },
  { id: 97, key: 'utilities.maxInternetSpeed', label: 'Max Internet Speed', group: 'Utilities', type: 'text', required: false, placeholder: '1 Gbps fiber' },
  { id: 98, key: 'utilities.cableTvProvider', label: 'Cable TV Provider', group: 'Utilities', type: 'text', required: false },

  // GROUP P: Environment & Risk (99-104)
  { id: 99, key: 'environmentRisk.airQualityIndexCurrent', label: 'Air Quality Index', group: 'Environment & Risk', type: 'text', required: false, autoPopulateSources: ['IQAir', 'AirNow'] },
  { id: 100, key: 'environmentRisk.floodZone', label: 'FEMA Flood Zone', group: 'Environment & Risk', type: 'select', options: ['Zone X (Minimal)', 'Zone A', 'Zone AE', 'Zone V', 'Zone VE'], required: false, autoPopulateSources: ['FEMA'] },
  { id: 101, key: 'environmentRisk.floodRiskLevel', label: 'Flood Risk Level', group: 'Environment & Risk', type: 'select', options: ['Minimal', 'Low', 'Moderate', 'High', 'Extreme'], required: false, autoPopulateSources: ['First Street', 'FEMA'] },
  { id: 102, key: 'environmentRisk.climateRiskSummary', label: 'Climate Risk Summary', group: 'Environment & Risk', type: 'text', required: false, autoPopulateSources: ['First Street'] },
  { id: 103, key: 'environmentRisk.noiseLevelDbEst', label: 'Noise Level (dB Est.)', group: 'Environment & Risk', type: 'text', required: false },
  { id: 104, key: 'environmentRisk.solarPotential', label: 'Solar Potential', group: 'Environment & Risk', type: 'select', options: ['Poor', 'Fair', 'Good', 'Excellent'], required: false, autoPopulateSources: ['Google Sunroof'] },

  // GROUP Q: Additional Features (105-110)
  { id: 105, key: 'additionalFeatures.evChargingYn', label: 'EV Charging', group: 'Additional Features', type: 'text', required: false, placeholder: 'Installed / Not installed' },
  { id: 106, key: 'additionalFeatures.smartHomeFeatures', label: 'Smart Home Features', group: 'Additional Features', type: 'text', required: false },
  { id: 107, key: 'additionalFeatures.accessibilityMods', label: 'Accessibility Modifications', group: 'Additional Features', type: 'text', required: false },
  { id: 108, key: 'additionalFeatures.petPolicy', label: 'Pet Policy', group: 'Additional Features', type: 'text', required: false, placeholder: 'Pets allowed' },
  { id: 109, key: 'additionalFeatures.ageRestrictions', label: 'Age Restrictions', group: 'Additional Features', type: 'text', required: false, placeholder: 'None / 55+' },
  { id: 110, key: 'additionalFeatures.notesConfidenceSummary', label: 'Notes & Confidence Summary', group: 'Additional Features', type: 'text', required: false },
];

// Group definitions for UI sections
export const FIELD_GROUPS = [
  { id: 'A', name: 'Address & Identity', fields: [1, 2, 3, 4, 5, 6], color: 'cyan' },
  { id: 'B', name: 'Pricing', fields: [7, 8, 9, 10, 11], color: 'green' },
  { id: 'C', name: 'Property Basics', fields: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], color: 'blue' },
  { id: 'D', name: 'HOA & Ownership', fields: [25, 26, 27, 28], color: 'purple' },
  { id: 'E', name: 'Taxes & Assessments', fields: [29, 30, 31, 32, 33, 34, 35], color: 'yellow' },
  { id: 'F', name: 'Structure & Systems', fields: [36, 37, 38, 39, 40, 41], color: 'orange' },
  { id: 'G', name: 'Interior Features', fields: [42, 43, 44, 45, 46], color: 'pink' },
  { id: 'H', name: 'Exterior Features', fields: [47, 48, 49, 50, 51], color: 'teal' },
  { id: 'I', name: 'Permits & Renovations', fields: [52, 53, 54, 55], color: 'indigo' },
  { id: 'J', name: 'Schools', fields: [56, 57, 58, 59, 60, 61, 62, 63, 64], color: 'cyan' },
  { id: 'K', name: 'Location Scores', fields: [65, 66, 67, 68, 69, 70, 71, 72], color: 'green' },
  { id: 'L', name: 'Distances & Amenities', fields: [73, 74, 75, 76, 77], color: 'blue' },
  { id: 'M', name: 'Safety & Crime', fields: [78, 79, 80], color: 'red' },
  { id: 'N', name: 'Market & Investment', fields: [81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91], color: 'green' },
  { id: 'O', name: 'Utilities', fields: [92, 93, 94, 95, 96, 97, 98], color: 'yellow' },
  { id: 'P', name: 'Environment & Risk', fields: [99, 100, 101, 102, 103, 104], color: 'orange' },
  { id: 'Q', name: 'Additional Features', fields: [105, 106, 107, 108, 109, 110], color: 'purple' },
];
