/**
 * Visuals Data Mapper
 * Converts CLUES Property (168-field DataField<T> structure) → Chart-ready format
 *
 * NEVER modifies the source Property schema
 * Extracts .value from DataField<T> for chart consumption
 */

import type { Property } from '@/types/property';
import { calculateAllTaxRates, type PropertyTaxData } from './taxRateCalculator';

// Helper to safely extract value from DataField
function getVal<T>(field: { value: T | null } | undefined, fallback: T): T {
  return field?.value ?? fallback;
}

/**
 * Determine data source tier for tax data reliability
 * Tier 1 (Best) = STELLAR MLS
 * Tier 2 = Attom, CoreLogic
 * Tier 3 = Zillow, Redfin
 * Tier 4 = County Records
 * Tier 5 = Other APIs
 * Tier 6 (Lowest) = LLM-generated (Grok, Perplexity, etc.)
 */
function getDataSourceTier(sources: string[] | undefined, llmSources: string[] | undefined): number {
  if (!sources || sources.length === 0) {
    // If only LLM sources, it's Tier 6
    if (llmSources && llmSources.length > 0) return 6;
    return 5; // Unknown source
  }

  const sourceStr = sources.join(',').toLowerCase();

  // Tier 1: STELLAR MLS
  if (sourceStr.includes('stellar') || sourceStr.includes('mls')) return 1;

  // Tier 2: Premium data providers
  if (sourceStr.includes('attom') || sourceStr.includes('corelogic')) return 2;

  // Tier 3: Consumer real estate sites
  if (sourceStr.includes('zillow') || sourceStr.includes('redfin')) return 3;

  // Tier 4: County records
  if (sourceStr.includes('county') || sourceStr.includes('public record')) return 4;

  // Tier 5: Other APIs
  if (!llmSources || llmSources.length === 0) return 5;

  // Tier 6: LLM-generated
  return 6;
}

// Chart-ready property format (flat structure for charts)
export interface ChartProperty {
  id: string;

  // Address & Identity
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  neighborhood: string;
  mlsNumber: string;
  listingStatus: string;
  listingDate: string;

  // Pricing & Value
  listingPrice: number;
  pricePerSqft: number;
  marketValueEstimate: number;
  redfinEstimate: number;
  assessedValue: number;
  lastSalePrice: number;
  lastSaleDate: string;

  // Property Basics
  bedrooms: number;
  fullBathrooms: number;
  bathrooms: number;
  halfBaths: number;
  livingSqft: number;
  totalSqft: number;
  lotSizeSqft: number;
  lotSizeAcres: number;
  yearBuilt: number;
  propertyType: string;
  stories: number;
  garageSpaces: number;
  parkingTotal: string;

  // HOA & Taxes
  hoaYn: boolean;
  hoaFeeAnnual: number;
  hoaName: string;
  hoaIncludes: string;
  ownershipType: string;
  annualTaxes: number;
  taxYear: number;
  propertyTaxRate: number;
  taxExemptions: string;

  // Structure & Systems
  roofType: string;
  roofAge: string;
  hvacType: string;
  hvacAge: string;
  exteriorMaterial: string;
  foundation: string;
  waterHeaterType: string;
  laundryType: string;
  interiorCondition: string;

  // Interior Features
  flooringType: string;
  kitchenFeatures: string;
  appliancesIncluded: string[];
  fireplaceYn: boolean;
  fireplaceCount: number;

  // Exterior Features
  poolYn: boolean;
  poolType: string;
  deckPatio: string;
  fence: string;
  landscaping: string;

  // Permits & Renovations
  recentRenovations: string;
  permitHistoryRoof: string;
  permitHistoryHvac: string;

  // Schools
  assignedElementary: string;
  elementaryRating: string;
  elementaryDistance: number;
  assignedMiddle: string;
  middleRating: string;
  middleDistance: number;
  assignedHigh: string;
  highRating: string;
  highDistance: number;
  schoolDistrict: string;

  // Location Scores
  walkScore: number;
  transitScore: number;
  bikeScore: number;
  noiseLevel: string;
  trafficLevel: string;
  walkabilityDescription: string;

  // Distances & Amenities
  distanceGrocery: number;
  distanceHospital: number;
  distanceAirport: number;
  distancePark: number;
  distanceBeach: number;

  // Safety & Crime
  violentCrimeIndex: string;
  propertyCrimeIndex: string;
  neighborhoodSafetyRating: string;

  // Market & Investment
  medianHomePriceNeighborhood: number;
  pricePerSqftRecentAvg: number;
  priceToRentRatio: number;
  rentalEstimateMonthly: number;
  rentalYieldEst: number;
  capRateEst: number;
  insuranceEstAnnual: number;
  daysOnMarketAvg: number;

  // Utilities & Connectivity
  electricProvider: string;
  waterProvider: string;
  sewerProvider: string;
  internetProvidersTop3: string[];
  maxInternetSpeed: string;
  fiberAvailable: boolean;
  avgElectricBill: string;
  avgWaterBill: string;

  // Environment & Risk
  airQualityIndex: string;
  airQualityGrade: string;
  floodZone: string;
  floodRiskLevel: string;
  hurricaneRisk: string;
  earthquakeRisk: string;
  wildfireRisk: string;
  seaLevelRiseRisk: string;

  // Additional Features
  solarPotential: string;
  evCharging: string;
  smartHomeFeatures: string;
  viewType: string;
  lotFeatures: string;
  petPolicy: string;

  // Stellar MLS - Parking
  carportYn: boolean;
  carportSpaces: number;
  garageAttachedYn: boolean;
  parkingFeatures: string[];

  // Stellar MLS - Building
  floorNumber: number;
  buildingTotalFloors: number;
  buildingElevatorYn: boolean;

  // Stellar MLS - Legal & Tax
  subdivisionName: string;
  homesteadYn: boolean;
  cddYn: boolean;
  annualCddFee: number;

  // Stellar MLS - Waterfront
  waterFrontageYn: boolean;
  waterfrontFeet: number;
  waterAccessYn: boolean;
  waterViewYn: boolean;
  waterBodyName: string;

  // Stellar MLS - Leasing
  canBeLeasedYn: boolean;
  minimumLeasePeriod: string;
  petSizeLimit: string;

  // Stellar MLS - Features
  communityFeatures: string[];
  interiorFeatures: string[];
  exteriorFeatures: string[];

  // Computed scores
  smartScore: number;
  dataCompleteness: number;

  // Data source metadata
  dataSourceTier?: number; // 1-6 scale for tax data reliability
  dataSource?: string;

  // Display
  thumbnail?: string;
}

/**
 * Main mapper function: Property → ChartProperty
 * Safely extracts all .value fields from DataField<T> structure
 */
export function mapPropertyToChart(property: Property): ChartProperty {
  const addr = property.address;
  const details = property.details;
  const structural = property.structural;
  const location = property.location;
  const financial = property.financial;
  const utilities = property.utilities;
  const stellarMLS = property.stellarMLS;

  return {
    id: property.id,

    // Address & Identity
    address: getVal(addr?.fullAddress, ''),
    city: getVal(addr?.city, ''),
    state: getVal(addr?.state, ''),
    zip: getVal(addr?.zipCode, ''),
    county: getVal(addr?.county, ''),
    neighborhood: getVal(addr?.neighborhoodName, ''),
    mlsNumber: getVal(addr?.mlsPrimary, ''),
    listingStatus: getVal(addr?.listingStatus, 'Active'),
    listingDate: getVal(addr?.listingDate, ''),

    // Pricing & Value
    listingPrice: getVal(addr?.listingPrice, 0),
    pricePerSqft: getVal(addr?.pricePerSqft, 0),
    marketValueEstimate: getVal(details?.marketValueEstimate, 0),
    redfinEstimate: getVal(financial?.redfinEstimate, 0),
    assessedValue: getVal(details?.assessedValue, 0),
    lastSalePrice: getVal(details?.lastSalePrice, 0),
    lastSaleDate: getVal(details?.lastSaleDate, ''),

    // Property Basics
    bedrooms: getVal(details?.bedrooms, 0),
    fullBathrooms: getVal(details?.fullBathrooms, 0),
    bathrooms: getVal(details?.totalBathrooms, 0),
    halfBaths: getVal(details?.halfBathrooms, 0),
    livingSqft: getVal(details?.livingSqft, 0),
    totalSqft: getVal(details?.totalSqftUnderRoof, 0),
    lotSizeSqft: getVal(details?.lotSizeSqft, 0),
    lotSizeAcres: getVal(details?.lotSizeAcres, 0),
    yearBuilt: getVal(details?.yearBuilt, 0),
    propertyType: getVal(details?.propertyType, 'Unknown'),
    stories: getVal(details?.stories, 1),
    garageSpaces: getVal(details?.garageSpaces, 0),
    parkingTotal: getVal(details?.parkingTotal, ''),

    // HOA & Taxes
    hoaYn: getVal(details?.hoaYn, false),
    hoaFeeAnnual: getVal(details?.hoaFeeAnnual, 0),
    hoaName: getVal(details?.hoaName, ''),
    hoaIncludes: getVal(details?.hoaIncludes, ''),
    ownershipType: getVal(details?.ownershipType, ''),
    annualTaxes: getVal(details?.annualTaxes, 0),
    taxYear: getVal(details?.taxYear, new Date().getFullYear()),
    propertyTaxRate: getVal(financial?.propertyTaxRate, 0),
    taxExemptions: getVal(financial?.taxExemptions, ''),

    // Structure & Systems
    roofType: getVal(structural?.roofType, ''),
    roofAge: getVal(structural?.roofAgeEst, ''),
    hvacType: getVal(structural?.hvacType, ''),
    hvacAge: getVal(structural?.hvacAge, ''),
    exteriorMaterial: getVal(structural?.exteriorMaterial, ''),
    foundation: getVal(structural?.foundation, ''),
    waterHeaterType: getVal(structural?.waterHeaterType, ''),
    laundryType: getVal(structural?.laundryType, ''),
    interiorCondition: getVal(structural?.interiorCondition, ''),

    // Interior Features
    flooringType: getVal(structural?.flooringType, ''),
    kitchenFeatures: getVal(structural?.kitchenFeatures, ''),
    appliancesIncluded: getVal(structural?.appliancesIncluded, []),
    fireplaceYn: getVal(structural?.fireplaceYn, false),
    fireplaceCount: getVal(structural?.fireplaceCount, 0),

    // Exterior Features
    poolYn: getVal(structural?.poolYn, false),
    poolType: getVal(structural?.poolType, ''),
    deckPatio: getVal(structural?.deckPatio, ''),
    fence: getVal(structural?.fence, ''),
    landscaping: getVal(structural?.landscaping, ''),

    // Permits & Renovations
    recentRenovations: getVal(structural?.recentRenovations, ''),
    permitHistoryRoof: getVal(structural?.permitHistoryRoof, ''),
    permitHistoryHvac: getVal(structural?.permitHistoryHvac, ''),

    // Schools
    assignedElementary: getVal(location?.assignedElementary, ''),
    elementaryRating: getVal(location?.elementaryRating, ''),
    elementaryDistance: getVal(location?.elementaryDistanceMiles, 0),
    assignedMiddle: getVal(location?.assignedMiddle, ''),
    middleRating: getVal(location?.middleRating, ''),
    middleDistance: getVal(location?.middleDistanceMiles, 0),
    assignedHigh: getVal(location?.assignedHigh, ''),
    highRating: getVal(location?.highRating, ''),
    highDistance: getVal(location?.highDistanceMiles, 0),
    schoolDistrict: getVal(location?.schoolDistrictName, ''),

    // Location Scores
    walkScore: getVal(location?.walkScore, 0),
    transitScore: getVal(location?.transitScore, 0),
    bikeScore: getVal(location?.bikeScore, 0),
    noiseLevel: getVal(location?.noiseLevel, ''),
    trafficLevel: getVal(location?.trafficLevel, ''),
    walkabilityDescription: getVal(location?.walkabilityDescription, ''),

    // Distances & Amenities
    distanceGrocery: getVal(location?.distanceGroceryMiles, 0),
    distanceHospital: getVal(location?.distanceHospitalMiles, 0),
    distanceAirport: getVal(location?.distanceAirportMiles, 0),
    distancePark: getVal(location?.distanceParkMiles, 0),
    distanceBeach: getVal(location?.distanceBeachMiles, 0),

    // Safety & Crime
    violentCrimeIndex: getVal(location?.crimeIndexViolent, ''),
    propertyCrimeIndex: getVal(location?.crimeIndexProperty, ''),
    neighborhoodSafetyRating: getVal(location?.neighborhoodSafetyRating, ''),

    // Market & Investment
    medianHomePriceNeighborhood: getVal(financial?.medianHomePriceNeighborhood, 0),
    pricePerSqftRecentAvg: getVal(financial?.pricePerSqftRecentAvg, 0),
    priceToRentRatio: getVal(financial?.priceToRentRatio, 0),
    rentalEstimateMonthly: getVal(financial?.rentalEstimateMonthly, 0),
    rentalYieldEst: getVal(financial?.rentalYieldEst, 0),
    capRateEst: getVal(financial?.capRateEst, 0),
    insuranceEstAnnual: getVal(financial?.insuranceEstAnnual, 0),
    daysOnMarketAvg: getVal(financial?.daysOnMarketAvg, 0),

    // Utilities & Connectivity
    electricProvider: getVal(utilities?.electricProvider, ''),
    waterProvider: getVal(utilities?.waterProvider, ''),
    sewerProvider: getVal(utilities?.sewerProvider, ''),
    internetProvidersTop3: getVal(utilities?.internetProvidersTop3, []),
    maxInternetSpeed: getVal(utilities?.maxInternetSpeed, ''),
    fiberAvailable: getVal(utilities?.fiberAvailable, false),
    avgElectricBill: getVal(utilities?.avgElectricBill, ''),
    avgWaterBill: getVal(utilities?.avgWaterBill, ''),

    // Environment & Risk
    airQualityIndex: getVal(utilities?.airQualityIndexCurrent, ''),
    airQualityGrade: getVal(utilities?.airQualityGrade, ''),
    floodZone: getVal(utilities?.floodZone, ''),
    floodRiskLevel: getVal(utilities?.floodRiskLevel, ''),
    hurricaneRisk: getVal(utilities?.hurricaneRisk, ''),
    earthquakeRisk: getVal(utilities?.earthquakeRisk, ''),
    wildfireRisk: getVal(utilities?.wildfireRisk, ''),
    seaLevelRiseRisk: getVal(utilities?.seaLevelRiseRisk, ''),

    // Additional Features
    solarPotential: getVal(utilities?.solarPotential, ''),
    evCharging: getVal(utilities?.evChargingYn, ''),
    smartHomeFeatures: getVal(utilities?.smartHomeFeatures, ''),
    viewType: getVal(utilities?.viewType, ''),
    lotFeatures: getVal(utilities?.lotFeatures, ''),
    petPolicy: getVal(utilities?.petPolicy, ''),

    // Stellar MLS - Parking
    carportYn: getVal(stellarMLS?.parking?.carportYn, false),
    carportSpaces: getVal(stellarMLS?.parking?.carportSpaces, 0),
    garageAttachedYn: getVal(stellarMLS?.parking?.garageAttachedYn, false),
    parkingFeatures: getVal(stellarMLS?.parking?.parkingFeatures, []),

    // Stellar MLS - Building
    floorNumber: getVal(stellarMLS?.building?.floorNumber, 0),
    buildingTotalFloors: getVal(stellarMLS?.building?.buildingTotalFloors, 0),
    buildingElevatorYn: getVal(stellarMLS?.building?.buildingElevatorYn, false),

    // Stellar MLS - Legal & Tax
    subdivisionName: getVal(stellarMLS?.legal?.subdivisionName, ''),
    homesteadYn: getVal(stellarMLS?.legal?.homesteadYn, false),
    cddYn: getVal(stellarMLS?.legal?.cddYn, false),
    annualCddFee: getVal(stellarMLS?.legal?.annualCddFee, 0),

    // Stellar MLS - Waterfront
    waterFrontageYn: getVal(stellarMLS?.waterfront?.waterFrontageYn, false),
    waterfrontFeet: getVal(stellarMLS?.waterfront?.waterfrontFeet, 0),
    waterAccessYn: getVal(stellarMLS?.waterfront?.waterAccessYn, false),
    waterViewYn: getVal(stellarMLS?.waterfront?.waterViewYn, false),
    waterBodyName: getVal(stellarMLS?.waterfront?.waterBodyName, ''),

    // Stellar MLS - Leasing
    canBeLeasedYn: getVal(stellarMLS?.leasing?.canBeLeasedYn, false),
    minimumLeasePeriod: getVal(stellarMLS?.leasing?.minimumLeasePeriod, ''),
    petSizeLimit: getVal(stellarMLS?.leasing?.petSizeLimit, ''),

    // Stellar MLS - Features
    communityFeatures: getVal(stellarMLS?.features?.communityFeatures, []),
    interiorFeatures: getVal(stellarMLS?.features?.interiorFeatures, []),
    exteriorFeatures: getVal(stellarMLS?.features?.exteriorFeatures, []),

    // Computed scores
    smartScore: property.smartScore ?? 0,
    dataCompleteness: property.dataCompleteness ?? 0,

    // Data source metadata (for tax rate reliability)
    dataSourceTier: getDataSourceTier(
      financial?.propertyTaxRate?.sources,
      financial?.propertyTaxRate?.llmSources
    ),
    dataSource: financial?.propertyTaxRate?.sources?.[0] || 'Unknown',

    // Display
    thumbnail: property.images?.[0] ?? getVal(addr?.primaryPhotoUrl, undefined),
  };
}

/**
 * Batch mapper: Convert array of Properties → array of ChartProperties
 * Includes smart tax rate calculation using city-based inference
 */
export function mapPropertiesToChart(properties: Property[]): ChartProperty[] {
  // First, do basic mapping
  const chartProperties = properties.map(mapPropertyToChart);

  // Prepare data for smart tax rate calculation
  const taxData: PropertyTaxData[] = chartProperties.map(prop => ({
    id: prop.id,
    city: prop.city,
    annualTaxes: prop.annualTaxes,
    assessedValue: prop.assessedValue,
    propertyTaxRate: prop.propertyTaxRate,
    dataSourceTier: prop.dataSourceTier,
    dataSource: prop.dataSource
  }));

  // Calculate smart tax rates for all properties
  const taxRateResults = calculateAllTaxRates(taxData);

  // Update chart properties with calculated tax rates
  chartProperties.forEach(prop => {
    const result = taxRateResults.get(prop.id);
    if (result) {
      prop.propertyTaxRate = result.rate;
    }
  });

  return chartProperties;
}
