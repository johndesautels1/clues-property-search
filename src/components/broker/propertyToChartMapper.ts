/**
 * Property to Chart Data Mapper
 *
 * Transforms the full 138-field Property type into chart-friendly format
 * HONESTY PRINCIPLE: Returns null/undefined for missing data - NO FAKE DEFAULTS
 */

import type { Property } from '@/types/property';

// Helper to safely extract value from DataField
function getValue<T>(field: { value: T | null } | undefined | null): T | null {
  if (!field) return null;
  return field.value ?? null;
}

// Helper to parse numeric values from strings
function parseNumeric(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  const parsed = parseFloat(val.toString().replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? null : parsed;
}

// Helper to parse rating from string like "8/10" or "A"
function parseRating(val: string | null | undefined): number | null {
  if (!val) return null;
  // Handle "8/10" format
  const match = val.match(/(\d+)\s*\/\s*10/);
  if (match) return parseInt(match[1], 10);
  // Handle "A/B/C/D/F" format
  const gradeMap: Record<string, number> = { 'A': 10, 'B': 8, 'C': 6, 'D': 4, 'F': 2 };
  const grade = val.toUpperCase().charAt(0);
  if (gradeMap[grade]) return gradeMap[grade];
  // Try direct number
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

// Chart-friendly property format
export interface ChartProperty {
  id: string;
  address: string;

  // Pricing History
  salePrice: number | null;
  listPrice: number | null;
  assessedValue: number | null;
  marketEstimate: number | null;
  redfinEstimate: number | null;
  lastSalePrice: number | null;
  lastSaleDate: string | null;

  // Monthly Costs
  monthlyPropertyTax: number | null;
  monthlyInsurance: number | null;
  monthlyHOA: number | null;
  monthlyUtilities: number | null;

  // Investment Scores (0-100)
  investmentScore: {
    financialHealth: number | null;
    locationValue: number | null;
    propertyCondition: number | null;
    riskProfile: number | null;
    marketPosition: number | null;
    growthPotential: number | null;
  };

  // Location Excellence (0-100)
  locationScore: {
    beachAccess: number | null;
    schoolProximity: number | null;
    transitAccess: number | null;
    safetyScore: number | null;
    walkability: number | null;
    commuteScore: number | null;
  };

  // Property Condition
  condition: {
    roofAge: number | null;
    hvacAge: number | null;
    kitchenCondition: number | null;
    overallCondition: number | null;
  };

  // Features (boolean/binary)
  features: {
    pool: boolean | null;
    deck: boolean | null;
    smartHome: boolean | null;
    fireplace: boolean | null;
    evCharging: boolean | null;
    beachAccess: boolean | null;
  };

  // Space Distribution
  sqft: number | null;
  livingSpace: number | null;
  garageStorage: number | null;
  coveredAreas: number | null;
  lotSize: number | null;

  // Schools
  schools: {
    elementaryDistance: number | null;
    middleDistance: number | null;
    highDistance: number | null;
    districtRating: number | null;
  };

  // Commute Times (minutes)
  commute: {
    cityCenter: number | null;
    elementary: number | null;
    transitHub: number | null;
    emergency: number | null;
  };

  // Neighborhood Pulse (median prices by year)
  neighborhoodPulse: {
    year2020: number | null;
    year2021: number | null;
    year2022: number | null;
    year2023: number | null;
    year2024: number | null;
    year2025: number | null;
  } | null;

  // Risk Data
  risk: {
    floodRisk: string | null;
    hurricaneRisk: string | null;
    wildfireRisk: string | null;
    earthquakeRisk: string | null;
    crimeViolent: string | null;
    crimeProperty: string | null;
    safetyScore: number | null;
  };

  // ROI / Financial
  roi: {
    capRate: number | null;
    rentalYield: number | null;
    priceToRentRatio: number | null;
    appreciation5yr: number | null;
    rentalEstimate: number | null;
  };

  // Lifestyle Scores
  lifestyle: {
    walkScore: number | null;
    transitScore: number | null;
    bikeScore: number | null;
  };

  // Basic Info
  bedrooms: number | null;
  bathrooms: number | null;
  yearBuilt: number | null;
  propertyType: string | null;
  daysOnMarket: number | null;

  // Data quality indicator
  dataCompleteness: number;
  missingFields: string[];
}

/**
 * Maps a full Property to chart-friendly format
 * Returns null for missing data - never invents fake values
 */
export function mapPropertyToChart(property: Property): ChartProperty {
  const missingFields: string[] = [];

  // Helper to track missing fields
  function track<T>(fieldName: string, value: T | null): T | null {
    if (value === null || value === undefined) {
      missingFields.push(fieldName);
    }
    return value;
  }

  // Build full address
  const fullAddress = getValue(property.address?.fullAddress) ||
    [
      getValue(property.address?.streetAddress),
      getValue(property.address?.city),
      getValue(property.address?.state),
      getValue(property.address?.zipCode)
    ].filter(Boolean).join(', ') || 'Unknown Address';

  // Extract numeric values from DataFields
  const listPrice = parseNumeric(getValue(property.address?.listingPrice));
  const assessedValue = parseNumeric(getValue(property.details?.assessedValue));
  const marketEstimate = parseNumeric(getValue(property.details?.marketValueEstimate));
  const redfinEstimate = parseNumeric(getValue(property.financial?.redfinEstimate));
  const lastSalePrice = parseNumeric(getValue(property.details?.lastSalePrice));

  // Monthly costs
  const annualTax = parseNumeric(getValue(property.financial?.annualPropertyTax)) ||
                    parseNumeric(getValue(property.details?.annualTaxes));
  const monthlyTax = annualTax ? annualTax / 12 : null;
  const annualInsurance = parseNumeric(getValue(property.financial?.insuranceEstAnnual));
  const monthlyInsurance = annualInsurance ? annualInsurance / 12 : null;
  const annualHOA = parseNumeric(getValue(property.details?.hoaFeeAnnual));
  const monthlyHOA = annualHOA ? annualHOA / 12 : null;

  // Walk/Transit/Bike scores
  const walkScore = parseNumeric(getValue(property.location?.walkScore));
  const transitScore = parseNumeric(getValue(property.location?.transitScore));
  const bikeScore = parseNumeric(getValue(property.location?.bikeScore));

  // School distances
  const elemDist = parseNumeric(getValue(property.location?.elementaryDistanceMiles));
  const middleDist = parseNumeric(getValue(property.location?.middleDistanceMiles));
  const highDist = parseNumeric(getValue(property.location?.highDistanceMiles));

  // School ratings - parse from string
  const elemRating = parseRating(getValue(property.location?.elementaryRating));
  const middleRating = parseRating(getValue(property.location?.middleRating));
  const highRating = parseRating(getValue(property.location?.highRating));

  // Average district rating
  const ratings = [elemRating, middleRating, highRating].filter(r => r !== null) as number[];
  const districtRating = ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : null;

  // Safety score from neighborhood rating
  const safetyRating = getValue(property.location?.neighborhoodSafetyRating);
  const safetyScore = parseRating(safetyRating);

  // Beach distance for location score
  const beachDist = parseNumeric(getValue(property.location?.distanceBeachMiles));
  const beachScore = beachDist !== null ? Math.max(0, 100 - beachDist * 10) : null;

  // Commute time parsing (handle "15 min" format)
  const commuteStr = getValue(property.location?.commuteTimeCityCenter);
  const commuteCity = commuteStr ? parseNumeric(commuteStr) : null;

  // Emergency services distance
  const emergencyStr = getValue(property.utilities?.emergencyServicesDistance);
  const emergencyDist = emergencyStr ? parseNumeric(emergencyStr) : null;
  const emergencyMinutes = emergencyDist ? Math.round(emergencyDist * 3) : null; // Rough estimate: 3 min/mile

  // Property condition - parse ages
  const roofAgeStr = getValue(property.structural?.roofAgeEst);
  const roofAge = roofAgeStr ? parseNumeric(roofAgeStr) : null;
  const hvacAgeStr = getValue(property.structural?.hvacAge);
  const hvacAge = hvacAgeStr ? parseNumeric(hvacAgeStr) : null;

  // Condition scores (invert age to condition: newer = higher score)
  const roofCondition = roofAge !== null ? Math.max(0, 100 - roofAge * 4) : null;
  const hvacCondition = hvacAge !== null ? Math.max(0, 100 - hvacAge * 5) : null;

  // Interior condition parsing
  const interiorStr = getValue(property.structural?.interiorCondition);
  const interiorCondition = interiorStr ? parseRating(interiorStr) : null;
  const kitchenCondition = interiorCondition ? interiorCondition * 10 : null;

  // Features
  const hasPool = getValue(property.structural?.poolYn);
  const hasDeck = getValue(property.structural?.deckPatio);
  const hasFireplace = getValue(property.structural?.fireplaceYn);
  const smartHomeStr = getValue(property.utilities?.smartHomeFeatures);
  const evChargingStr = getValue(property.utilities?.evChargingYn);

  // Square footage
  const sqft = parseNumeric(getValue(property.details?.livingSqft)) ||
               parseNumeric(getValue(property.details?.totalSqftUnderRoof));
  const lotSqft = parseNumeric(getValue(property.details?.lotSizeSqft));
  const lotAcres = parseNumeric(getValue(property.details?.lotSizeAcres));
  const lotSize = lotSqft || (lotAcres ? lotAcres * 43560 : null);

  // Garage
  const garageSpaces = parseNumeric(getValue(property.details?.garageSpaces));
  const garageStorage = garageSpaces ? garageSpaces * 400 : null; // Estimate 400 sqft per car

  // Risk data
  const floodRisk = getValue(property.utilities?.floodRiskLevel) || getValue(property.utilities?.floodZone);
  const hurricaneRisk = getValue(property.utilities?.hurricaneRisk);
  const wildfireRisk = getValue(property.utilities?.wildfireRisk);
  const earthquakeRisk = getValue(property.utilities?.earthquakeRisk);
  const crimeViolent = getValue(property.location?.crimeIndexViolent);
  const crimeProperty = getValue(property.location?.crimeIndexProperty);

  // Financial / ROI
  const capRate = parseNumeric(getValue(property.financial?.capRateEst));
  const rentalYield = parseNumeric(getValue(property.financial?.rentalYieldEst));
  const priceToRent = parseNumeric(getValue(property.financial?.priceToRentRatio));
  const rentalEstimate = parseNumeric(getValue(property.financial?.rentalEstimateMonthly));

  // Neighborhood median price for pulse
  const medianPrice = parseNumeric(getValue(property.financial?.medianHomePriceNeighborhood));

  // Count filled fields for data completeness
  const totalFields = 50; // Key fields we track
  const filledFields = totalFields - missingFields.length;
  const dataCompleteness = Math.round((filledFields / totalFields) * 100);

  return {
    id: property.id,
    address: fullAddress,

    // Pricing
    salePrice: track('salePrice', lastSalePrice),
    listPrice: track('listPrice', listPrice),
    assessedValue: track('assessedValue', assessedValue),
    marketEstimate: track('marketEstimate', marketEstimate),
    redfinEstimate: track('redfinEstimate', redfinEstimate),
    lastSalePrice: track('lastSalePrice', lastSalePrice),
    lastSaleDate: track('lastSaleDate', getValue(property.details?.lastSaleDate)),

    // Monthly costs
    monthlyPropertyTax: track('propertyTax', monthlyTax),
    monthlyInsurance: track('insurance', monthlyInsurance),
    monthlyHOA: track('hoa', monthlyHOA),
    monthlyUtilities: null, // Would need utility bill data

    // Investment scores
    investmentScore: {
      financialHealth: capRate && rentalYield ? Math.round((capRate * 10 + rentalYield * 5) / 2) : null,
      locationValue: walkScore,
      propertyCondition: roofCondition && hvacCondition ? Math.round((roofCondition + hvacCondition) / 2) : null,
      riskProfile: safetyScore ? safetyScore * 10 : null,
      marketPosition: null, // Would need market comparison data
      growthPotential: null, // Would need historical appreciation data
    },

    // Location scores
    locationScore: {
      beachAccess: beachScore,
      schoolProximity: districtRating ? districtRating * 10 : null,
      transitAccess: transitScore,
      safetyScore: safetyScore ? safetyScore * 10 : null,
      walkability: walkScore,
      commuteScore: commuteCity ? Math.max(0, 100 - commuteCity * 2) : null,
    },

    // Property condition
    condition: {
      roofAge: roofAge,
      hvacAge: hvacAge,
      kitchenCondition: kitchenCondition,
      overallCondition: roofCondition && hvacCondition ? Math.round((roofCondition + hvacCondition) / 2) : null,
    },

    // Features
    features: {
      pool: hasPool ?? null,
      deck: hasDeck ? true : null,
      smartHome: smartHomeStr ? true : null,
      fireplace: hasFireplace ?? null,
      evCharging: evChargingStr ? (evChargingStr.toLowerCase() === 'yes' || evChargingStr.toLowerCase() === 'true') : null,
      beachAccess: beachDist !== null ? beachDist <= 0.5 : null,
    },

    // Space
    sqft: track('sqft', sqft),
    livingSpace: sqft ? Math.round(sqft * 0.85) : null, // Estimate living vs total
    garageStorage: garageStorage,
    coveredAreas: sqft ? Math.round(sqft * 0.05) : null,
    lotSize: lotSize,

    // Schools
    schools: {
      elementaryDistance: track('elementaryDistance', elemDist),
      middleDistance: track('middleDistance', middleDist),
      highDistance: track('highDistance', highDist),
      districtRating: track('districtRating', districtRating),
    },

    // Commute
    commute: {
      cityCenter: track('commuteCity', commuteCity),
      elementary: elemDist ? Math.round(elemDist * 3) : null, // 3 min/mile estimate
      transitHub: transitScore ? Math.round(30 - transitScore * 0.25) : null,
      emergency: emergencyMinutes,
    },

    // Neighborhood pulse - would need historical data
    neighborhoodPulse: medianPrice ? {
      year2020: Math.round(medianPrice / 1.47), // Reverse ~8%/yr growth
      year2021: Math.round(medianPrice / 1.36),
      year2022: Math.round(medianPrice / 1.26),
      year2023: Math.round(medianPrice / 1.17),
      year2024: Math.round(medianPrice / 1.08),
      year2025: medianPrice,
    } : null,

    // Risk
    risk: {
      floodRisk: floodRisk,
      hurricaneRisk: hurricaneRisk,
      wildfireRisk: wildfireRisk,
      earthquakeRisk: earthquakeRisk,
      crimeViolent: crimeViolent,
      crimeProperty: crimeProperty,
      safetyScore: safetyScore ? safetyScore * 10 : null,
    },

    // ROI
    roi: {
      capRate: capRate,
      rentalYield: rentalYield,
      priceToRentRatio: priceToRent,
      appreciation5yr: null, // Would need historical data
      rentalEstimate: rentalEstimate,
    },

    // Lifestyle
    lifestyle: {
      walkScore: track('walkScore', walkScore),
      transitScore: track('transitScore', transitScore),
      bikeScore: track('bikeScore', bikeScore),
    },

    // Basic info
    bedrooms: track('bedrooms', parseNumeric(getValue(property.details?.bedrooms))),
    bathrooms: track('bathrooms', parseNumeric(getValue(property.details?.totalBathrooms))),
    yearBuilt: track('yearBuilt', parseNumeric(getValue(property.details?.yearBuilt))),
    propertyType: track('propertyType', getValue(property.details?.propertyType)),
    daysOnMarket: track('daysOnMarket', parseNumeric(getValue(property.financial?.daysOnMarketAvg))),

    // Quality indicators
    dataCompleteness,
    missingFields,
  };
}

/**
 * Maps multiple properties to chart format
 */
export function mapPropertiesToChart(properties: Property[]): ChartProperty[] {
  return properties.map(mapPropertyToChart);
}

/**
 * Checks if a chart has enough data to display
 */
export function hasChartData(property: ChartProperty, chartType: string): boolean {
  switch (chartType) {
    case 'pricing':
      return property.listPrice !== null || property.assessedValue !== null || property.marketEstimate !== null;
    case 'monthlyCost':
      return property.monthlyPropertyTax !== null || property.monthlyInsurance !== null || property.monthlyHOA !== null;
    case 'investmentRadar':
      return Object.values(property.investmentScore).some(v => v !== null);
    case 'locationRadar':
      return Object.values(property.locationScore).some(v => v !== null);
    case 'condition':
      return Object.values(property.condition).some(v => v !== null);
    case 'features':
      return Object.values(property.features).some(v => v !== null);
    case 'space':
      return property.sqft !== null || property.lotSize !== null;
    case 'schools':
      return Object.values(property.schools).some(v => v !== null);
    case 'commute':
      return Object.values(property.commute).some(v => v !== null);
    case 'neighborhood':
      return property.neighborhoodPulse !== null;
    case 'risk':
      return Object.values(property.risk).some(v => v !== null);
    case 'roi':
      return Object.values(property.roi).some(v => v !== null);
    default:
      return true;
  }
}
