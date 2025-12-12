/**
 * Exterior Features Data Mapper
 * Transforms ChartProperty data into format expected by Exterior Features Canvas Charts
 *
 * Maps Fields 54-58 + 168 to chart data structure
 */

import type { ChartProperty } from './visualsDataMapper';

// Exterior Features Quality Scores (0-100 scale)
export interface ExteriorQualityScores {
  curbAppeal: number;      // Calculated from multiple factors
  landscaping: number;     // Field 58 + scoring algorithm
  design: number;          // Calculated from property features
  deck: number;            // Field 56 + scoring algorithm
  pool: number;            // Fields 54-55 + scoring algorithm
  fence: number;           // Field 57 + scoring algorithm
}

// Amenity Features (Binary Yes/No from Field 168)
export interface ExteriorAmenities {
  balcony: boolean;
  outdoorShower: boolean;
  sidewalk: boolean;
  slidingDoors: boolean;
  hurricaneShutters: boolean;
  sprinklerSystem: boolean;
  outdoorKitchen: boolean;
  privateDock: boolean;
}

// Chart-ready data for all 5 charts
export interface ExteriorChartsData {
  // Property metadata
  properties: {
    p1: { name: string; shortName: string; color: string };
    p2: { name: string; shortName: string; color: string };
    p3: { name: string; shortName: string; color: string };
  };

  // Quality scores for Charts 1, 2, 3 (6 features each, 0-100)
  qualityScores: {
    p1: number[]; // [curbAppeal, landscaping, design, deck, pool, fence]
    p2: number[];
    p3: number[];
  };

  // Amenity features for Charts 6, 9 (8 binary features)
  amenities: {
    labels: string[];
    labelsFull: string[];
    p1: number[]; // [1,0,1,1,0,1,1,0] - 1=has, 0=lacks
    p2: number[];
    p3: number[];
  };

  // Calculated metrics
  totalScores: {
    p1: number; // Average of 6 quality scores
    p2: number;
    p3: number;
  };

  amenityCounts: {
    p1: number; // Count of amenities (0-8)
    p2: number;
    p3: number;
  };
}

/**
 * Calculate Pool Score (0-100)
 * Based on pool presence and type
 */
function calculatePoolScore(poolYn: boolean, poolType: string): number {
  if (!poolYn || !poolType || poolType === 'N/A') return 0;

  // Score based on pool type (higher = better)
  const poolScores: Record<string, number> = {
    'In-ground Heated': 100,
    'In-ground': 85,
    'Community': 60,
    'Above-ground': 40
  };

  return poolScores[poolType] || 50;
}

/**
 * Calculate Deck/Patio Score (0-100)
 * Based on deck/patio description quality
 */
function calculateDeckScore(deckPatio: string): number {
  if (!deckPatio || deckPatio.toLowerCase() === 'none') return 0;

  const text = deckPatio.toLowerCase();
  let score = 40; // Base score for having any deck/patio

  // Quality indicators (add points)
  if (text.includes('covered')) score += 15;
  if (text.includes('screened')) score += 15;
  if (text.includes('large') || text.includes('spacious')) score += 10;
  if (text.includes('paver')) score += 10;
  if (text.includes('stone') || text.includes('brick')) score += 10;
  if (text.includes('multi-level') || text.includes('tiered')) score += 10;

  return Math.min(score, 100);
}

/**
 * Calculate Fence Score (0-100)
 * Based on fence type and quality
 */
function calculateFenceScore(fence: string): number {
  if (!fence || fence.toLowerCase() === 'none') return 0;

  const text = fence.toLowerCase();
  let score = 40; // Base score for having a fence

  // Quality indicators
  if (text.includes('privacy')) score += 20;
  if (text.includes('vinyl') || text.includes('composite')) score += 15;
  if (text.includes('wood')) score += 10;
  if (text.includes('chain link')) score -= 10; // Lower quality
  if (text.includes('wrought iron') || text.includes('aluminum')) score += 15;
  if (text.includes('new') || text.includes('recently')) score += 10;

  return Math.max(0, Math.min(score, 100));
}

/**
 * Calculate Landscaping Score (0-100)
 * Based on landscaping description quality
 */
function calculateLandscapingScore(landscaping: string): number {
  if (!landscaping || landscaping.toLowerCase() === 'none') return 20; // Base score

  const text = landscaping.toLowerCase();
  let score = 40; // Base score for having landscaping

  // Quality indicators
  if (text.includes('professional')) score += 20;
  if (text.includes('mature') || text.includes('established')) score += 15;
  if (text.includes('tropical') || text.includes('native')) score += 10;
  if (text.includes('irrigation') || text.includes('sprinkler')) score += 10;
  if (text.includes('palm') || text.includes('tree')) score += 10;
  if (text.includes('maintained') || text.includes('manicured')) score += 15;
  if (text.includes('minimal') || text.includes('basic')) score -= 10;

  return Math.max(20, Math.min(score, 100));
}

/**
 * Calculate Curb Appeal Score (0-100)
 * Composite score based on multiple exterior factors
 */
function calculateCurbAppealScore(property: ChartProperty): number {
  let score = 50; // Base score

  // Year built (newer = better curb appeal)
  const age = new Date().getFullYear() - property.yearBuilt;
  if (age <= 5) score += 15;
  else if (age <= 10) score += 10;
  else if (age <= 20) score += 5;
  else if (age > 50) score -= 10;

  // Exterior material quality
  const exterior = property.exteriorMaterial?.toLowerCase() || '';
  if (exterior.includes('brick')) score += 10;
  else if (exterior.includes('stone')) score += 12;
  else if (exterior.includes('stucco')) score += 8;
  else if (exterior.includes('vinyl')) score += 5;

  // Property type (some have inherently better curb appeal)
  if (property.propertyType?.toLowerCase().includes('single family')) score += 5;

  // Stories (2-story often has better curb appeal)
  if (property.stories === 2) score += 5;

  // Exterior features boost curb appeal
  const extFeatures = property.exteriorFeatures || [];
  if (extFeatures.includes('Balcony')) score += 5;
  if (extFeatures.includes('Outdoor Kitchen')) score += 8;

  return Math.max(0, Math.min(score, 100));
}

/**
 * Calculate Design Score (0-100)
 * Based on architectural quality and property features
 */
function calculateDesignScore(property: ChartProperty): number {
  let score = 50; // Base score

  // Property type quality
  const propType = property.propertyType?.toLowerCase() || '';
  if (propType.includes('single family')) score += 10;
  else if (propType.includes('townhome')) score += 5;

  // Stories (architectural interest)
  if (property.stories === 2) score += 10;
  else if (property.stories >= 3) score += 5;

  // Year built (modern design)
  const age = new Date().getFullYear() - property.yearBuilt;
  if (age <= 5) score += 15;
  else if (age <= 10) score += 10;
  else if (age <= 20) score += 5;

  // Square footage (larger homes often have better design)
  if (property.livingSqft >= 3000) score += 10;
  else if (property.livingSqft >= 2000) score += 5;

  // Lot size (more space for design elements)
  if (property.lotSizeAcres >= 0.5) score += 5;
  else if (property.lotSizeAcres >= 0.25) score += 3;

  // Interior features indicate design quality
  if (property.fireplaceYn) score += 5;

  return Math.max(0, Math.min(score, 100));
}

/**
 * Calculate all 6 exterior quality scores for a property
 */
export function calculateExteriorQualityScores(property: ChartProperty): ExteriorQualityScores {
  return {
    curbAppeal: calculateCurbAppealScore(property),
    landscaping: calculateLandscapingScore(property.landscaping),
    design: calculateDesignScore(property),
    deck: calculateDeckScore(property.deckPatio),
    pool: calculatePoolScore(property.poolYn, property.poolType),
    fence: calculateFenceScore(property.fence)
  };
}

/**
 * Extract binary amenities from Field 168
 */
export function extractExteriorAmenities(exteriorFeatures: string[]): ExteriorAmenities {
  const features = exteriorFeatures || [];

  return {
    balcony: features.includes('Balcony'),
    outdoorShower: features.includes('Outdoor Shower'),
    sidewalk: features.includes('Sidewalk'),
    slidingDoors: features.includes('Sliding Doors'),
    hurricaneShutters: features.includes('Hurricane Shutters'),
    sprinklerSystem: features.includes('Sprinkler System'),
    outdoorKitchen: features.includes('Outdoor Kitchen'),
    privateDock: features.includes('Private Dock')
  };
}

/**
 * Convert property name to short name (first word or street number)
 */
function getShortName(address: string): string {
  if (!address) return 'Property';

  // Try to extract street number + first word
  const parts = address.split(' ');
  if (parts.length >= 2) {
    return parts[0] + ' ' + parts[1]; // e.g., "1821 Hillcrest"
  }

  return parts[0] || 'Property';
}

/**
 * Create empty ChartProperty with minimal data
 */
function createEmptyProperty(index: number): ChartProperty {
  const currentYear = new Date().getFullYear();
  return {
    id: `empty-${index}`,
    address: `Property ${index + 1}`,
    city: '',
    state: '',
    zip: '',
    county: '',
    neighborhood: '',
    mlsNumber: '',
    listingStatus: '',
    listingDate: '',
    listingPrice: 0,
    pricePerSqft: 0,
    marketValueEstimate: 0,
    redfinEstimate: 0,
    assessedValue: 0,
    lastSalePrice: 0,
    lastSaleDate: '',
    bedrooms: 0,
    fullBathrooms: 0,
    bathrooms: 0,
    halfBaths: 0,
    livingSqft: 0,
    totalSqft: 0,
    lotSizeSqft: 0,
    lotSizeAcres: 0,
    yearBuilt: currentYear,
    propertyType: 'Unknown',
    stories: 1,
    garageSpaces: 0,
    parkingTotal: '',
    hoaYn: false,
    hoaFeeAnnual: 0,
    hoaName: '',
    hoaIncludes: '',
    ownershipType: '',
    annualTaxes: 0,
    taxYear: currentYear,
    propertyTaxRate: 0,
    taxExemptions: '',
    roofType: '',
    roofAge: '',
    hvacType: '',
    hvacAge: '',
    exteriorMaterial: '',
    foundation: '',
    waterHeaterType: '',
    laundryType: '',
    interiorCondition: '',
    flooringType: '',
    kitchenFeatures: '',
    appliancesIncluded: [],
    fireplaceYn: false,
    fireplaceCount: 0,
    poolYn: false,
    poolType: '',
    deckPatio: '',
    fence: '',
    landscaping: '',
    recentRenovations: '',
    permitHistoryRoof: '',
    permitHistoryHvac: '',
    assignedElementary: '',
    elementaryRating: '',
    elementaryDistance: 0,
    assignedMiddle: '',
    middleRating: '',
    middleDistance: 0,
    assignedHigh: '',
    highRating: '',
    highDistance: 0,
    schoolDistrict: '',
    walkScore: 0,
    transitScore: 0,
    bikeScore: 0,
    noiseLevel: '',
    trafficLevel: '',
    walkabilityDescription: '',
    distanceGrocery: 0,
    distanceHospital: 0,
    distanceAirport: 0,
    distancePark: 0,
    distanceBeach: 0,
    violentCrimeIndex: '',
    propertyCrimeIndex: '',
    neighborhoodSafetyRating: '',
    medianHomePriceNeighborhood: 0,
    pricePerSqftRecentAvg: 0,
    priceToRentRatio: 0,
    rentalEstimateMonthly: 0,
    rentalYieldEst: 0,
    capRateEst: 0,
    insuranceEstAnnual: 0,
    daysOnMarketAvg: 0,
    electricProvider: '',
    waterProvider: '',
    sewerProvider: '',
    internetProvidersTop3: [],
    maxInternetSpeed: '',
    fiberAvailable: false,
    avgElectricBill: '',
    avgWaterBill: '',
    airQualityIndex: '',
    airQualityGrade: '',
    floodZone: '',
    floodRiskLevel: '',
    hurricaneRisk: '',
    earthquakeRisk: '',
    wildfireRisk: '',
    seaLevelRiseRisk: '',
    solarPotential: '',
    evCharging: '',
    smartHomeFeatures: '',
    viewType: '',
    lotFeatures: '',
    petPolicy: '',
    carportYn: false,
    carportSpaces: 0,
    garageAttachedYn: false,
    parkingFeatures: [],
    floorNumber: 0,
    buildingTotalFloors: 0,
    buildingElevatorYn: false,
    subdivisionName: '',
    homesteadYn: false,
    cddYn: false,
    annualCddFee: 0,
    waterFrontageYn: false,
    waterfrontFeet: 0,
    waterAccessYn: false,
    waterViewYn: false,
    waterBodyName: '',
    canBeLeasedYn: false,
    minimumLeasePeriod: '',
    petSizeLimit: '',
    communityFeatures: [],
    interiorFeatures: [],
    exteriorFeatures: [],
    smartScore: 0,
    dataCompleteness: 0
  };
}

/**
 * Main mapper: Convert up to 3 ChartProperty objects to ExteriorChartsData
 */
export function mapToExteriorChartsData(properties: ChartProperty[]): ExteriorChartsData {
  // Ensure we have exactly 3 properties (pad with empties if needed)
  const props = [...properties];
  while (props.length < 3) {
    props.push(createEmptyProperty(props.length));
  }

  // Take only first 3
  const [p1, p2, p3] = props.slice(0, 3);

  // Property colors (matching existing pattern)
  const colors = ['#22c55e', '#8b5cf6', '#ec4899'];

  // Calculate quality scores
  const scores1 = calculateExteriorQualityScores(p1);
  const scores2 = calculateExteriorQualityScores(p2);
  const scores3 = calculateExteriorQualityScores(p3);

  // Extract amenities
  const amenities1 = extractExteriorAmenities(p1.exteriorFeatures);
  const amenities2 = extractExteriorAmenities(p2.exteriorFeatures);
  const amenities3 = extractExteriorAmenities(p3.exteriorFeatures);

  // Convert to arrays for charts
  const qualityP1 = [scores1.curbAppeal, scores1.landscaping, scores1.design, scores1.deck, scores1.pool, scores1.fence];
  const qualityP2 = [scores2.curbAppeal, scores2.landscaping, scores2.design, scores2.deck, scores2.pool, scores2.fence];
  const qualityP3 = [scores3.curbAppeal, scores3.landscaping, scores3.design, scores3.deck, scores3.pool, scores3.fence];

  const amenitiesP1 = [
    amenities1.balcony ? 1 : 0,
    amenities1.outdoorShower ? 1 : 0,
    amenities1.sidewalk ? 1 : 0,
    amenities1.slidingDoors ? 1 : 0,
    amenities1.hurricaneShutters ? 1 : 0,
    amenities1.sprinklerSystem ? 1 : 0,
    amenities1.outdoorKitchen ? 1 : 0,
    amenities1.privateDock ? 1 : 0
  ];

  const amenitiesP2 = [
    amenities2.balcony ? 1 : 0,
    amenities2.outdoorShower ? 1 : 0,
    amenities2.sidewalk ? 1 : 0,
    amenities2.slidingDoors ? 1 : 0,
    amenities2.hurricaneShutters ? 1 : 0,
    amenities2.sprinklerSystem ? 1 : 0,
    amenities2.outdoorKitchen ? 1 : 0,
    amenities2.privateDock ? 1 : 0
  ];

  const amenitiesP3 = [
    amenities3.balcony ? 1 : 0,
    amenities3.outdoorShower ? 1 : 0,
    amenities3.sidewalk ? 1 : 0,
    amenities3.slidingDoors ? 1 : 0,
    amenities3.hurricaneShutters ? 1 : 0,
    amenities3.sprinklerSystem ? 1 : 0,
    amenities3.outdoorKitchen ? 1 : 0,
    amenities3.privateDock ? 1 : 0
  ];

  return {
    properties: {
      p1: {
        name: p1.address,
        shortName: getShortName(p1.address).toUpperCase(),
        color: colors[0]
      },
      p2: {
        name: p2.address,
        shortName: getShortName(p2.address).toUpperCase(),
        color: colors[1]
      },
      p3: {
        name: p3.address,
        shortName: getShortName(p3.address).toUpperCase(),
        color: colors[2]
      }
    },

    qualityScores: {
      p1: qualityP1,
      p2: qualityP2,
      p3: qualityP3
    },

    amenities: {
      labels: ['BALCONY', 'SHOWER', 'SIDEWALK', 'SLIDING', 'SHUTTERS', 'SPRINKLER', 'KITCHEN', 'DOCK'],
      labelsFull: ['Balcony', 'Outdoor Shower', 'Sidewalk', 'Sliding Doors', 'Hurricane Shutters', 'Sprinkler System', 'Outdoor Kitchen', 'Private Dock'],
      p1: amenitiesP1,
      p2: amenitiesP2,
      p3: amenitiesP3
    },

    totalScores: {
      p1: Math.round(qualityP1.reduce((a, b) => a + b, 0) / 6),
      p2: Math.round(qualityP2.reduce((a, b) => a + b, 0) / 6),
      p3: Math.round(qualityP3.reduce((a, b) => a + b, 0) / 6)
    },

    amenityCounts: {
      p1: amenitiesP1.reduce((a, b) => a + b, 0),
      p2: amenitiesP2.reduce((a, b) => a + b, 0),
      p3: amenitiesP3.reduce((a, b) => a + b, 0)
    }
  };
}
