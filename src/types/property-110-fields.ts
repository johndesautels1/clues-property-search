/**
 * CLUES Property Dashboard - Complete 110-Field Property Schema
 * With confidence tracking, provenance, and multi-LLM merge support
 */

// Confidence levels for field data
export type ConfidenceLevel = 'High' | 'Medium-High' | 'Medium' | 'Low';

// LLM sources that can provide data
export type LLMSource = 'Claude' | 'GPT' | 'Gemini' | 'Grok' | 'Manual' | 'API';

// Field with full provenance tracking
export interface TrackedField<T = string | number | boolean | null> {
  value: T;
  confidence: ConfidenceLevel;
  notes: string;
  sources: string[];
  lastUpdated: string; // ISO-8601
  updatedBy: LLMSource;
  conflictingValues?: Array<{
    value: T;
    source: LLMSource;
    confidence: ConfidenceLevel;
  }>;
}

// Helper to create empty tracked field
export function createEmptyField<T>(defaultValue: T): TrackedField<T> {
  return {
    value: defaultValue,
    confidence: 'Low',
    notes: 'Not yet collected',
    sources: [],
    lastUpdated: new Date().toISOString().split('T')[0],
    updatedBy: 'Manual',
  };
}

// =================================================================
// PHASE 1: CORE PROPERTY DATA (Fields 1-30)
// =================================================================
export interface CorePropertyData {
  // Identification
  fullAddress: TrackedField<string>;           // 1
  streetNumber: TrackedField<string>;          // 2
  streetName: TrackedField<string>;            // 3
  unitNumber: TrackedField<string | null>;     // 4
  city: TrackedField<string>;                  // 5
  state: TrackedField<string>;                 // 6
  zipCode: TrackedField<string>;               // 7
  zipPlus4: TrackedField<string | null>;       // 8
  county: TrackedField<string>;                // 9
  parcelId: TrackedField<string>;              // 10

  // Listing Info
  mlsPrimary: TrackedField<string | null>;     // 11
  mlsSecondary: TrackedField<string | null>;   // 12
  listingStatus: TrackedField<'Active' | 'Pending' | 'Sold' | 'Off-Market'>; // 13
  listingDate: TrackedField<string | null>;    // 14
  daysOnMarket: TrackedField<number>;          // 15

  // Pricing
  listingPrice: TrackedField<number>;          // 16
  pricePerSqft: TrackedField<number>;          // 17
  originalPrice: TrackedField<number | null>;  // 18
  priceReductions: TrackedField<number>;       // 19
  zestimate: TrackedField<number | null>;      // 20
  refdinEstimate: TrackedField<number | null>; // 21

  // Basic Details
  propertyType: TrackedField<string>;          // 22
  bedrooms: TrackedField<number>;              // 23
  bathroomsFull: TrackedField<number>;         // 24
  bathroomsHalf: TrackedField<number>;         // 25
  totalBathrooms: TrackedField<number>;        // 26
  livingAreaSqft: TrackedField<number>;        // 27
  lotSizeSqft: TrackedField<number>;           // 28
  lotSizeAcres: TrackedField<number>;          // 29
  yearBuilt: TrackedField<number>;             // 30
}

// =================================================================
// PHASE 2: STRUCTURAL DETAILS (Fields 31-50)
// =================================================================
export interface StructuralDetails {
  stories: TrackedField<number>;               // 31
  foundationType: TrackedField<string>;        // 32
  constructionMaterial: TrackedField<string>;  // 33
  roofType: TrackedField<string>;              // 34
  roofAge: TrackedField<number | null>;        // 35
  hvacType: TrackedField<string>;              // 36
  hvacAge: TrackedField<number | null>;        // 37
  waterHeaterType: TrackedField<string>;       // 38
  garageType: TrackedField<string>;            // 39
  garageSpaces: TrackedField<number>;          // 40
  parkingSpaces: TrackedField<number>;         // 41
  pool: TrackedField<boolean>;                 // 42
  poolType: TrackedField<string | null>;       // 43
  spa: TrackedField<boolean>;                  // 44
  deck: TrackedField<boolean>;                 // 45
  patio: TrackedField<boolean>;                // 46
  fence: TrackedField<boolean>;                // 47
  fenceType: TrackedField<string | null>;      // 48
  sprinklerSystem: TrackedField<boolean>;      // 49
  solarPanels: TrackedField<boolean>;          // 50
}

// =================================================================
// PHASE 3: LOCATION & PROXIMITY (Fields 51-75)
// =================================================================
export interface LocationProximity {
  // Schools
  elementarySchool: TrackedField<string>;      // 51
  elementaryRating: TrackedField<number>;      // 52
  middleSchool: TrackedField<string>;          // 53
  middleRating: TrackedField<number>;          // 54
  highSchool: TrackedField<string>;            // 55
  highRating: TrackedField<number>;            // 56

  // Walkability & Transit
  walkScore: TrackedField<number>;             // 57
  transitScore: TrackedField<number>;          // 58
  bikeScore: TrackedField<number>;             // 59

  // Distances
  distGrocery: TrackedField<number>;           // 60 (miles)
  nearestGroceryName: TrackedField<string>;    // 61
  distHospital: TrackedField<number>;          // 62
  nearestHospitalName: TrackedField<string>;   // 63
  distAirport: TrackedField<number>;           // 64
  nearestAirportCode: TrackedField<string>;    // 65
  distDowntown: TrackedField<number>;          // 66
  distBeach: TrackedField<number | null>;      // 67
  distPark: TrackedField<number>;              // 68
  nearestParkName: TrackedField<string>;       // 69

  // Safety & Environment
  crimeIndex: TrackedField<number>;            // 70 (1-100, 100=safest)
  crimeGrade: TrackedField<string>;            // 71 (A-F)
  noiseLevel: TrackedField<string>;            // 72 (Low/Medium/High)
  airQualityIndex: TrackedField<number>;       // 73
  floodZone: TrackedField<string>;             // 74
  floodRisk: TrackedField<string>;             // 75 (Minimal/Low/Moderate/High)
}

// =================================================================
// PHASE 4: FINANCIAL DATA (Fields 76-90)
// =================================================================
export interface FinancialData {
  // Taxes
  annualTaxes: TrackedField<number>;           // 76
  taxAssessedValue: TrackedField<number>;      // 77
  taxAssessmentYear: TrackedField<number>;     // 78
  homesteadExemption: TrackedField<boolean>;   // 79

  // HOA
  hoaFeeMonthly: TrackedField<number | null>;  // 80
  hoaFeeAnnual: TrackedField<number | null>;   // 81
  hoaName: TrackedField<string | null>;        // 82

  // Insurance Estimates
  insuranceEstimate: TrackedField<number>;     // 83
  floodInsuranceReq: TrackedField<boolean>;    // 84

  // Rental Analysis
  rentEstimate: TrackedField<number>;          // 85
  rentZillow: TrackedField<number | null>;     // 86
  rentZumper: TrackedField<number | null>;     // 87
  rentCafe: TrackedField<number | null>;       // 88
  grossRentalYield: TrackedField<number>;      // 89 (percentage)
  capRateEstimate: TrackedField<number>;       // 90 (percentage)
}

// =================================================================
// PHASE 5: UTILITIES & TECHNOLOGY (Fields 91-105)
// =================================================================
export interface UtilitiesTechnology {
  // Electric & Gas
  electricProvider: TrackedField<string>;      // 91
  avgElectricBill: TrackedField<number | null>; // 92
  gasProvider: TrackedField<string | null>;    // 93
  avgGasBill: TrackedField<number | null>;     // 94

  // Water & Sewer
  waterProvider: TrackedField<string>;         // 95
  avgWaterBill: TrackedField<number | null>;   // 96
  sewerType: TrackedField<'Public' | 'Septic'>; // 97

  // Internet
  internetProviders: TrackedField<string>;     // 98 (comma-separated)
  maxInternetSpeed: TrackedField<string>;      // 99
  fiberAvailable: TrackedField<boolean>;       // 100

  // Smart Home
  smartHomeFeatures: TrackedField<string>;     // 101 (comma-separated)
  evChargerInstalled: TrackedField<boolean>;   // 102
  evChargerNearby: TrackedField<boolean>;      // 103

  // Environmental
  solarPotential: TrackedField<string>;        // 104 (Poor/Fair/Good/Excellent)
  energyEfficiencyRating: TrackedField<string | null>; // 105
}

// =================================================================
// PHASE 6: ADDITIONAL FIELDS (Fields 106-110)
// =================================================================
export interface AdditionalFields {
  virtualTourUrl: TrackedField<string | null>; // 106
  listingAgentName: TrackedField<string>;      // 107
  listingAgentPhone: TrackedField<string | null>; // 108
  listingBrokerage: TrackedField<string>;      // 109
  lastSaleDate: TrackedField<string | null>;   // 110
}

// =================================================================
// COMPLETE 110-FIELD PROPERTY PROFILE
// =================================================================
export interface Property110Fields {
  // Unique ID for this property record
  id: string;

  // All 110 fields organized by category
  core: CorePropertyData;           // Fields 1-30
  structural: StructuralDetails;    // Fields 31-50
  location: LocationProximity;      // Fields 51-75
  financial: FinancialData;         // Fields 76-90
  utilities: UtilitiesTechnology;   // Fields 91-105
  additional: AdditionalFields;     // Fields 106-110

  // Metadata
  completionStats: {
    fieldsCompleted: number;
    fieldsHighConfidence: number;
    fieldsMediumConfidence: number;
    fieldsLowConfidence: number;
    fieldsMissing: number;
    completionPercentage: number;
  };

  // LLM Processing Info
  llmProcessing: {
    primaryLLM: LLMSource;
    contributingLLMs: LLMSource[];
    firstProcessed: string;
    lastUpdated: string;
    conflictCount: number;
  };

  // SMART Score (calculated)
  smartScore: number;
}

// =================================================================
// MULTI-LLM MERGE CONFIGURATION
// =================================================================
export interface MergeConfig {
  // Never overwrite fields with these confidence levels
  protectConfidenceLevels: ConfidenceLevel[];

  // Priority order for LLM sources (higher index = higher priority)
  llmPriority: LLMSource[];

  // Fields that require human review when conflicting
  humanReviewFields: string[];
}

export const DEFAULT_MERGE_CONFIG: MergeConfig = {
  protectConfidenceLevels: ['High', 'Medium-High'],
  llmPriority: ['Manual', 'Claude', 'GPT', 'Gemini', 'Grok', 'API'],
  humanReviewFields: [
    'listingPrice',
    'listingStatus',
    'bedrooms',
    'bathroomsFull',
    'livingAreaSqft',
    'yearBuilt',
    'annualTaxes',
    'rentEstimate',
  ],
};

// =================================================================
// BATCH PROCESSING TYPES
// =================================================================
export interface BatchAddressInput {
  addresses: string[];
  llmMode: 'Auto' | 'Claude' | 'GPT' | 'Gemini' | 'Grok' | 'Hybrid';
  priority: 'Speed' | 'Accuracy' | 'Balanced';
}

export interface BatchProcessingStatus {
  totalAddresses: number;
  completed: number;
  inProgress: number;
  failed: number;
  results: Map<string, Property110Fields>;
  errors: Map<string, string>;
  startTime: string;
  estimatedCompletion: string;
}

// =================================================================
// FIELD DEFINITIONS FOR UI
// =================================================================
export const FIELD_CATEGORIES = {
  core: {
    name: 'Core Property Data',
    fields: 30,
    phase: 1,
    timeEstimate: '4-6 minutes',
    targetCompletion: '95%',
  },
  structural: {
    name: 'Structural Details',
    fields: 20,
    phase: 2,
    timeEstimate: '4-6 minutes',
    targetCompletion: '80%',
  },
  location: {
    name: 'Location & Proximity',
    fields: 25,
    phase: 3,
    timeEstimate: '6-8 minutes',
    targetCompletion: '92%',
  },
  financial: {
    name: 'Financial Data',
    fields: 15,
    phase: 4,
    timeEstimate: '4-6 minutes',
    targetCompletion: '85%',
  },
  utilities: {
    name: 'Utilities & Technology',
    fields: 15,
    phase: 5,
    timeEstimate: '4 minutes',
    targetCompletion: '95%',
  },
  additional: {
    name: 'Additional Fields',
    fields: 5,
    phase: 6,
    timeEstimate: '3-5 minutes',
    targetCompletion: '90%',
  },
} as const;

// Data sources by phase
export const DATA_SOURCES = {
  phase1: [
    { name: 'Zillow', url: 'zillow.com', fields: ['price', 'beds', 'baths', 'sqft', 'zestimate'] },
    { name: 'Redfin', url: 'redfin.com', fields: ['climate', 'permits', 'schools'] },
    { name: 'Realtor.com', url: 'realtor.com', fields: ['listing', 'history'] },
    { name: 'County Appraiser', fields: ['tax', 'parcel', 'legal'] },
  ],
  phase2: [
    { name: 'Google Street View', fields: ['exterior', 'roof', 'garage'] },
    { name: 'Google Earth', fields: ['pool', 'deck', 'lot'] },
    { name: 'Permit Records', fields: ['roof_age', 'hvac_age', 'renovations'] },
  ],
  phase3: [
    { name: 'GreatSchools.org', fields: ['schools', 'ratings'] },
    { name: 'WalkScore.com', fields: ['walk', 'transit', 'bike'] },
    { name: 'Google Maps', fields: ['distances', 'proximity'] },
    { name: 'NeighborhoodScout', fields: ['crime'] },
  ],
  phase4: [
    { name: 'County Tax Collector', fields: ['taxes', 'exemptions'] },
    { name: 'Zillow Rental Manager', fields: ['rent_estimate'] },
    { name: 'Zumper', fields: ['rent_data'] },
    { name: 'RentCafe', fields: ['rent_data'] },
  ],
  phase5: [
    { name: 'BroadbandNow.com', fields: ['internet', 'speed'] },
    { name: 'FEMA MSC', fields: ['flood_zone'] },
    { name: 'IQAir.com', fields: ['air_quality'] },
    { name: 'PlugShare', fields: ['ev_chargers'] },
  ],
} as const;
