/**
 * TypeScript Interfaces for Property Comparison Analytics
 * 
 * Defines the complete data structure needed for all 32 visualizations
 */

export interface Property {
  // Basic Info
  id: string;
  address: string;
  price: number;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  lotSize: number;
  yearBuilt: number;

  // Valuation (Chart 1, 24)
  listPrice: number;
  marketEstimate: number;
  redfinEstimate: number;
  assessedValue: number;

  // Financial (Charts 2, 3a-c, 4, 15, 16, 18, 19, 29)
  appreciation5yr: number; // Percentage (e.g., 102.7 for 102.7%)
  capRate: number; // Percentage
  rentalYield: number; // Percentage
  priceToRent: number; // Ratio
  propertyTax: number; // Annual
  insurance: number; // Annual total
  insuranceBase: number; // Base premium
  insuranceFlood: number; // Flood insurance
  insuranceWind: number; // Wind/Hurricane insurance
  hoaFees: number; // Monthly
  utilities: number; // Monthly total
  utilitiesElectric: number;
  utilitiesWater: number;
  utilitiesInternet: number;
  maintenance: number; // Monthly
  rentalIncome: number; // Monthly
  
  // Historical Pricing (Chart 18)
  pricingHistory: {
    salePriceDate: string; // e.g., "2018 Sale"
    salePrice: number;
    assessmentDate: string;
    assessmentPrice: number;
    currentListPrice: number;
    marketEstimatePrice: number;
  };

  // ROI Projections (Charts 19, 25)
  roiProjection: {
    today: number;
    year1: number;
    year2: number;
    year3: number;
    year4: number;
    year5: number;
    year7: number;
    year10: number;
  };

  // Location Scores (Charts 5, 13, 14, 22, 28)
  walkScore: number; // 0-100
  transitScore: number; // 0-100
  bikeScore: number; // 0-100
  
  // Commute (Chart 14)
  commute: {
    cityCenter: number; // Minutes or proximity score 0-100
    elementary: number; // Distance proximity score 0-100
    transitHub: number; // Distance proximity score 0-100
    emergency: number; // Distance proximity score 0-100
  };

  // Safety (Chart 6)
  safetyScore: number; // 0-100
  violentCrime: 'LOW' | 'MOD' | 'HIGH';
  propertyCrime: 'LOW' | 'MOD' | 'HIGH';

  // Climate Risks (Chart 5, 26)
  floodRisk: number; // 0-10 scale
  hurricaneRisk: number; // 0-10 scale
  seaLevelRisk: number; // 0-10 scale
  wildfireRisk: number; // 0-10 scale
  earthquakeRisk: number; // 0-10 scale
  tornadoRisk: number; // 0-10 scale
  airQualityRisk: number; // 0-10 scale
  radonRisk: number; // 0-10 scale

  // Environmental Quality (Chart 9)
  airQuality: number; // 0-100 score (or AQI number)
  solarPotential: number; // 0-100
  waterQuality: number; // 0-100
  foundationStability: number; // 0-100

  // Investment Scores (Charts 7, 23)
  investmentScore: {
    financialHealth: number; // 0-100
    locationValue: number; // 0-100
    propertyCondition: number; // 0-100
    riskProfile: number; // 0-100
    marketPosition: number; // 0-100
    growthPotential: number; // 0-100
  };

  // Market Data (Charts 8, 13, 17, 27)
  pricePerSqft: number;
  daysOnMarket: number;
  neighborhoodMedianPrice: number;
  marketVelocityDays: number; // Days on market (for gauge)

  // Neighborhood Pulse (Chart 13)
  neighborhoodPulse: {
    year2020: number;
    year2021: number;
    year2022: number;
    year2023: number;
    year2024: number;
    year2025: number;
  };

  // Property Details (Charts 10, 11, 20, 21, 30)
  livingSpace: number; // Sq ft
  garageStorage: number; // Sq ft
  coveredAreas: number; // Sq ft
  
  // Room distribution percentages (Chart 11)
  roomDistribution: {
    bedrooms: number; // Percentage
    bathrooms: number; // Percentage
    livingAreas: number; // Percentage
    storage: number; // Percentage
  };

  // Schools (Chart 12)
  schools: {
    elementaryDistance: number; // Proximity score 0-100
    middleDistance: number; // Proximity score 0-100
    highDistance: number; // Proximity score 0-100
    districtRating: number; // 0-100
  };

  // Property Condition (Chart 20)
  condition: {
    roof: number; // Age/condition score 0-100
    hvac: number; // Age/condition score 0-100
    kitchen: number; // Renovation score 0-100
    overall: number; // Overall condition 0-100
  };

  // Luxury Features (Charts 21, 30)
  features: {
    pool: number; // 0-100 (0 = none, 100 = premium)
    deck: number; // 0-100
    smartHome: number; // 0-100
    fireplace: number; // 0-100
    evCharging: number; // 0-100
    beachAccess: number; // 0-100
  };

  // Location Excellence (Chart 22, 28)
  locationExcellence: {
    beachAccess: number; // 0-100
    schoolProximity: number; // 0-100
    transitAccess: number; // 0-100
    safety: number; // 0-100
    walkability: number; // 0-100
    commute: number; // 0-100
  };
}

export interface PropertyComparisonProps {
  properties: [Property, Property, Property]; // Exactly 3 properties
  onClose: () => void;
}

export type ViewType = 'all' | 'financial' | 'location' | 'risk' | 'amenities';

// Example property data structure
export const EXAMPLE_PROPERTY: Property = {
  id: '1',
  address: '2003 Gulf Way, St Pete Beach, FL 33706',
  price: 3750000,
  sqft: 3428,
  bedrooms: 4,
  bathrooms: 3,
  lotSize: 5663,
  yearBuilt: 2015,
  
  listPrice: 3750000,
  marketEstimate: 3333254,
  redfinEstimate: 3200000,
  assessedValue: 2100000,
  
  appreciation5yr: 102.7,
  capRate: 3.5,
  rentalYield: 2.7,
  priceToRent: 22,
  propertyTax: 15400,
  insurance: 4200,
  insuranceBase: 2100,
  insuranceFlood: 1800,
  insuranceWind: 300,
  hoaFees: 100,
  utilities: 405,
  utilitiesElectric: 220,
  utilitiesWater: 85,
  utilitiesInternet: 100,
  maintenance: 425,
  rentalIncome: 8500,
  
  pricingHistory: {
    salePriceDate: '2018 Sale',
    salePrice: 1850000,
    assessmentDate: '2024 Assessment',
    assessmentPrice: 2100000,
    currentListPrice: 3750000,
    marketEstimatePrice: 3333254
  },
  
  roiProjection: {
    today: 3750000,
    year1: 4125000,
    year2: 4500000,
    year3: 4875000,
    year4: 5050000,
    year5: 5200000,
    year7: 5950000,
    year10: 7100000
  },
  
  walkScore: 50,
  transitScore: 35,
  bikeScore: 48,
  
  commute: {
    cityCenter: 84,
    elementary: 99,
    transitHub: 95,
    emergency: 92
  },
  
  safetyScore: 70,
  violentCrime: 'MOD',
  propertyCrime: 'MOD',
  
  floodRisk: 8,
  hurricaneRisk: 6,
  seaLevelRisk: 6,
  wildfireRisk: 2,
  earthquakeRisk: 1,
  tornadoRisk: 2,
  airQualityRisk: 3,
  radonRisk: 2,
  
  airQuality: 85,
  solarPotential: 85,
  waterQuality: 95,
  foundationStability: 90,
  
  investmentScore: {
    financialHealth: 82,
    locationValue: 88,
    propertyCondition: 78,
    riskProfile: 65,
    marketPosition: 85,
    growthPotential: 79
  },
  
  pricePerSqft: 1093.75,
  daysOnMarket: 2,
  neighborhoodMedianPrice: 1250000,
  marketVelocityDays: 2,
  
  neighborhoodPulse: {
    year2020: 850000,
    year2021: 950000,
    year2022: 1100000,
    year2023: 1200000,
    year2024: 1250000,
    year2025: 1250000
  },
  
  livingSpace: 3428,
  garageStorage: 372,
  coveredAreas: 5663,
  
  roomDistribution: {
    bedrooms: 35,
    bathrooms: 28,
    livingAreas: 22,
    storage: 15
  },
  
  schools: {
    elementaryDistance: 98,
    middleDistance: 35,
    highDistance: 35,
    districtRating: 75
  },
  
  condition: {
    roof: 80,
    hvac: 85,
    kitchen: 95,
    overall: 85
  },
  
  features: {
    pool: 100,
    deck: 95,
    smartHome: 75,
    fireplace: 80,
    evCharging: 100,
    beachAccess: 100
  },
  
  locationExcellence: {
    beachAccess: 100,
    schoolProximity: 90,
    transitAccess: 65,
    safety: 70,
    walkability: 50,
    commute: 84
  }
};
