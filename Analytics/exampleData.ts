/**
 * Example Property Data for Testing
 * 
 * This file contains 3 fully populated Property objects you can use
 * to test the PropertyComparisonAnalytics component immediately.
 */

import type { Property } from './types';

export const PROPERTY_1: Property = {
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

export const PROPERTY_2: Property = {
  id: '2',
  address: '129 Gulf Way, St Pete Beach, FL 33706',
  price: 3200000,
  sqft: 3200,
  bedrooms: 3,
  bathrooms: 3,
  lotSize: 4800,
  yearBuilt: 2018,
  
  listPrice: 3200000,
  marketEstimate: 2950000,
  redfinEstimate: 2900000,
  assessedValue: 1850000,
  
  appreciation5yr: 89.5,
  capRate: 3.8,
  rentalYield: 2.9,
  priceToRent: 20,
  propertyTax: 13200,
  insurance: 3800,
  insuranceBase: 1900,
  insuranceFlood: 1600,
  insuranceWind: 300,
  hoaFees: 150,
  utilities: 385,
  utilitiesElectric: 200,
  utilitiesWater: 80,
  utilitiesInternet: 105,
  maintenance: 400,
  rentalIncome: 7800,
  
  pricingHistory: {
    salePriceDate: '2019 Sale',
    salePrice: 1690000,
    assessmentDate: '2024 Assessment',
    assessmentPrice: 1850000,
    currentListPrice: 3200000,
    marketEstimatePrice: 2950000
  },
  
  roiProjection: {
    today: 3200000,
    year1: 3520000,
    year2: 3840000,
    year3: 4160000,
    year4: 4320000,
    year5: 4450000,
    year7: 5100000,
    year10: 6000000
  },
  
  walkScore: 52,
  transitScore: 38,
  bikeScore: 45,
  
  commute: {
    cityCenter: 82,
    elementary: 95,
    transitHub: 90,
    emergency: 88
  },
  
  safetyScore: 72,
  violentCrime: 'MOD',
  propertyCrime: 'LOW',
  
  floodRisk: 7,
  hurricaneRisk: 6,
  seaLevelRisk: 5,
  wildfireRisk: 2,
  earthquakeRisk: 1,
  tornadoRisk: 2,
  airQualityRisk: 3,
  radonRisk: 2,
  
  airQuality: 87,
  solarPotential: 82,
  waterQuality: 93,
  foundationStability: 92,
  
  investmentScore: {
    financialHealth: 78,
    locationValue: 85,
    propertyCondition: 82,
    riskProfile: 68,
    marketPosition: 80,
    growthPotential: 75
  },
  
  pricePerSqft: 1000,
  daysOnMarket: 5,
  neighborhoodMedianPrice: 1200000,
  marketVelocityDays: 5,
  
  neighborhoodPulse: {
    year2020: 820000,
    year2021: 920000,
    year2022: 1050000,
    year2023: 1150000,
    year2024: 1200000,
    year2025: 1200000
  },
  
  livingSpace: 3200,
  garageStorage: 350,
  coveredAreas: 4800,
  
  roomDistribution: {
    bedrooms: 32,
    bathrooms: 30,
    livingAreas: 25,
    storage: 13
  },
  
  schools: {
    elementaryDistance: 92,
    middleDistance: 40,
    highDistance: 38,
    districtRating: 75
  },
  
  condition: {
    roof: 85,
    hvac: 88,
    kitchen: 90,
    overall: 88
  },
  
  features: {
    pool: 100,
    deck: 90,
    smartHome: 80,
    fireplace: 0,
    evCharging: 80,
    beachAccess: 100
  },
  
  locationExcellence: {
    beachAccess: 100,
    schoolProximity: 88,
    transitAccess: 68,
    safety: 72,
    walkability: 52,
    commute: 82
  }
};

export const PROPERTY_3: Property = {
  id: '3',
  address: '145 Gulf Way, St Pete Beach, FL 33706',
  price: 3400000,
  sqft: 3600,
  bedrooms: 4,
  bathrooms: 4,
  lotSize: 5200,
  yearBuilt: 2020,
  
  listPrice: 3400000,
  marketEstimate: 3150000,
  redfinEstimate: 3100000,
  assessedValue: 2000000,
  
  appreciation5yr: 65.0,
  capRate: 4.2,
  rentalYield: 3.1,
  priceToRent: 18,
  propertyTax: 14000,
  insurance: 3900,
  insuranceBase: 2000,
  insuranceFlood: 1600,
  insuranceWind: 300,
  hoaFees: 125,
  utilities: 395,
  utilitiesElectric: 210,
  utilitiesWater: 80,
  utilitiesInternet: 105,
  maintenance: 410,
  rentalIncome: 8200,
  
  pricingHistory: {
    salePriceDate: '2020 Sale',
    salePrice: 2060000,
    assessmentDate: '2024 Assessment',
    assessmentPrice: 2000000,
    currentListPrice: 3400000,
    marketEstimatePrice: 3150000
  },
  
  roiProjection: {
    today: 3400000,
    year1: 3740000,
    year2: 4080000,
    year3: 4420000,
    year4: 4590000,
    year5: 4730000,
    year7: 5440000,
    year10: 6500000
  },
  
  walkScore: 48,
  transitScore: 40,
  bikeScore: 50,
  
  commute: {
    cityCenter: 86,
    elementary: 97,
    transitHub: 93,
    emergency: 90
  },
  
  safetyScore: 75,
  violentCrime: 'LOW',
  propertyCrime: 'LOW',
  
  floodRisk: 6,
  hurricaneRisk: 5,
  seaLevelRisk: 5,
  wildfireRisk: 1,
  earthquakeRisk: 1,
  tornadoRisk: 2,
  airQualityRisk: 2,
  radonRisk: 1,
  
  airQuality: 88,
  solarPotential: 90,
  waterQuality: 95,
  foundationStability: 95,
  
  investmentScore: {
    financialHealth: 85,
    locationValue: 90,
    propertyCondition: 92,
    riskProfile: 72,
    marketPosition: 88,
    growthPotential: 82
  },
  
  pricePerSqft: 944.44,
  daysOnMarket: 3,
  neighborhoodMedianPrice: 1280000,
  marketVelocityDays: 3,
  
  neighborhoodPulse: {
    year2020: 880000,
    year2021: 980000,
    year2022: 1120000,
    year2023: 1220000,
    year2024: 1280000,
    year2025: 1280000
  },
  
  livingSpace: 3600,
  garageStorage: 400,
  coveredAreas: 5200,
  
  roomDistribution: {
    bedrooms: 33,
    bathrooms: 30,
    livingAreas: 24,
    storage: 13
  },
  
  schools: {
    elementaryDistance: 95,
    middleDistance: 38,
    highDistance: 36,
    districtRating: 78
  },
  
  condition: {
    roof: 95,
    hvac: 95,
    kitchen: 98,
    overall: 95
  },
  
  features: {
    pool: 100,
    deck: 100,
    smartHome: 90,
    fireplace: 100,
    evCharging: 100,
    beachAccess: 100
  },
  
  locationExcellence: {
    beachAccess: 100,
    schoolProximity: 92,
    transitAccess: 70,
    safety: 75,
    walkability: 48,
    commute: 86
  }
};

// Export all 3 as a tuple for direct use
export const TEST_PROPERTIES: [Property, Property, Property] = [
  PROPERTY_1,
  PROPERTY_2,
  PROPERTY_3
];
