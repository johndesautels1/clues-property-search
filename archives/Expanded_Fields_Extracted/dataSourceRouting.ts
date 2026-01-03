/**
 * OLIVIA CMA - Data Source Routing Rules
 * John E. Desautels & Associates
 * 
 * This file defines HOW to obtain each field
 * NO actual API calls - just routing rules
 */

import { DataSource, ScrapingMethod } from './fieldSchema';

// ============================================
// DATA SOURCE CONFIGURATIONS
// ============================================

export interface DataSourceConfig {
  id: DataSource;
  name: string;
  type: 'API' | 'WEB_SEARCH' | 'CALCULATION' | 'SCRAPE';
  baseUrl?: string;
  requiresAuth: boolean;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  cost: 'FREE' | 'CHEAP' | 'MODERATE' | 'EXPENSIVE';
  reliability: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
}

export const dataSourceConfigs: Record<DataSource, DataSourceConfig> = {
  STELLAR_MLS: {
    id: 'STELLAR_MLS',
    name: 'Stellar MLS (RETS/API)',
    type: 'API',
    baseUrl: 'https://api.stellarmls.com',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 100, requestsPerDay: 10000 },
    cost: 'MODERATE',
    reliability: 'HIGH',
    notes: 'Primary source for FL MLS data - 60+ fields per listing'
  },
  ZILLOW_WEBSEARCH: {
    id: 'ZILLOW_WEBSEARCH',
    name: 'Zillow (via Claude Sonnet web_search)',
    type: 'WEB_SEARCH',
    requiresAuth: false,
    cost: 'CHEAP',
    reliability: 'MEDIUM',
    notes: 'Good for Zestimate, basic data. Login wall limits some fields.'
  },
  REDFIN_WEBSEARCH: {
    id: 'REDFIN_WEBSEARCH',
    name: 'Redfin (via Claude Sonnet web_search)',
    type: 'WEB_SEARCH',
    requiresAuth: false,
    cost: 'CHEAP',
    reliability: 'HIGH',
    notes: 'Excellent market data, comparables, trends. Year Renovated unique here.'
  },
  REALTOR_WEBSEARCH: {
    id: 'REALTOR_WEBSEARCH',
    name: 'Realtor.com (via Claude Sonnet web_search)',
    type: 'WEB_SEARCH',
    requiresAuth: false,
    cost: 'CHEAP',
    reliability: 'MEDIUM',
    notes: 'Good for tax assessments, listings data'
  },
  HOMES_WEBSEARCH: {
    id: 'HOMES_WEBSEARCH',
    name: 'Homes.com (via Claude Sonnet web_search)',
    type: 'WEB_SEARCH',
    requiresAuth: false,
    cost: 'CHEAP',
    reliability: 'HIGH',
    notes: 'Best for AVMs (Quantarium, First American, ICE, Collateral Analytics), neighborhood data'
  },
  TRULIA_WEBSEARCH: {
    id: 'TRULIA_WEBSEARCH',
    name: 'Trulia (via Claude Sonnet web_search)',
    type: 'WEB_SEARCH',
    requiresAuth: false,
    cost: 'CHEAP',
    reliability: 'MEDIUM',
    notes: 'Good for neighborhood sentiment scores, historical data'
  },
  GREATSCHOOLS_API: {
    id: 'GREATSCHOOLS_API',
    name: 'GreatSchools API',
    type: 'API',
    baseUrl: 'https://api.greatschools.org',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 60, requestsPerDay: 5000 },
    cost: 'FREE',
    reliability: 'HIGH',
    notes: 'Official school ratings 1-10 scale'
  },
  WALKSCORE_API: {
    id: 'WALKSCORE_API',
    name: 'Walk Score API',
    type: 'API',
    baseUrl: 'https://api.walkscore.com',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerDay: 5000 },
    cost: 'MODERATE',
    reliability: 'HIGH',
    notes: '$250/mo for commercial use - Walk/Bike/Transit scores'
  },
  FIRSTSTREET_API: {
    id: 'FIRSTSTREET_API',
    name: 'First Street Foundation API',
    type: 'API',
    baseUrl: 'https://api.firststreet.org',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 60, requestsPerDay: 10000 },
    cost: 'FREE',
    reliability: 'HIGH',
    notes: 'Free tier available - Flood/Fire/Heat/Wind factors'
  },
  GOOGLE_PLACES_API: {
    id: 'GOOGLE_PLACES_API',
    name: 'Google Places API',
    type: 'API',
    baseUrl: 'https://maps.googleapis.com/maps/api/place',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 100, requestsPerDay: 50000 },
    cost: 'CHEAP',
    reliability: 'HIGH',
    notes: 'Pay-per-use - POIs, amenities, distances'
  },
  GOOGLE_GEOCODE_API: {
    id: 'GOOGLE_GEOCODE_API',
    name: 'Google Geocode API',
    type: 'API',
    baseUrl: 'https://maps.googleapis.com/maps/api/geocode',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 100, requestsPerDay: 50000 },
    cost: 'CHEAP',
    reliability: 'HIGH',
    notes: 'Address validation and lat/long coordinates'
  },
  FEMA_API: {
    id: 'FEMA_API',
    name: 'FEMA Flood Map Service',
    type: 'API',
    baseUrl: 'https://msc.fema.gov/api',
    requiresAuth: false,
    cost: 'FREE',
    reliability: 'HIGH',
    notes: 'Official flood zone designations'
  },
  CENSUS_API: {
    id: 'CENSUS_API',
    name: 'U.S. Census API',
    type: 'API',
    baseUrl: 'https://api.census.gov/data',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 500, requestsPerDay: 500000 },
    cost: 'FREE',
    reliability: 'HIGH',
    notes: 'Demographics, income, education data'
  },
  FBI_CRIME_API: {
    id: 'FBI_CRIME_API',
    name: 'FBI Crime Data API',
    type: 'API',
    baseUrl: 'https://api.usa.gov/crime',
    requiresAuth: false,
    cost: 'FREE',
    reliability: 'HIGH',
    notes: 'UCR crime statistics by jurisdiction'
  },
  USGS_API: {
    id: 'USGS_API',
    name: 'USGS Elevation API',
    type: 'API',
    baseUrl: 'https://nationalmap.gov/epqs',
    requiresAuth: false,
    cost: 'FREE',
    reliability: 'HIGH',
    notes: 'Ground elevation data'
  },
  BROADBAND_API: {
    id: 'BROADBAND_API',
    name: 'FCC Broadband Map API',
    type: 'API',
    baseUrl: 'https://broadbandmap.fcc.gov/api',
    requiresAuth: false,
    cost: 'FREE',
    reliability: 'HIGH',
    notes: 'Internet provider coverage and speeds'
  },
  TAVILY: {
    id: 'TAVILY',
    name: 'Tavily Search API',
    type: 'WEB_SEARCH',
    baseUrl: 'https://api.tavily.com',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 60, requestsPerDay: 1000 },
    cost: 'CHEAP',
    reliability: 'MEDIUM',
    notes: 'Fallback web research - good for obscure data points'
  },
  CALCULATION: {
    id: 'CALCULATION',
    name: 'Internal Calculation',
    type: 'CALCULATION',
    requiresAuth: false,
    cost: 'FREE',
    reliability: 'HIGH',
    notes: 'Derived from other fields - no external call needed'
  },
  COUNTY_RECORDS: {
    id: 'COUNTY_RECORDS',
    name: 'County Property Appraiser',
    type: 'SCRAPE',
    requiresAuth: false,
    cost: 'FREE',
    reliability: 'HIGH',
    notes: 'County-specific websites - Pinellas (pcpao.gov), Hillsborough (hcpafl.org), etc.'
  }
};

// ============================================
// ROUTING RULES
// ============================================

export interface RoutingRule {
  fieldId: string;
  primaryRoute: RouteConfig;
  fallbackRoutes: RouteConfig[];
  validationRules?: ValidationRule[];
  transformations?: TransformConfig[];
}

export interface RouteConfig {
  source: DataSource;
  method: ScrapingMethod;
  searchQuery?: string;  // Template for web_search
  apiEndpoint?: string;  // For direct API calls
  parseRules?: ParseRule[];
  timeout?: number;  // ms
}

export interface ParseRule {
  selector?: string;  // CSS selector for HTML
  jsonPath?: string;  // JSONPath for API responses
  regex?: string;     // Regex pattern
  extractType: 'text' | 'number' | 'boolean' | 'date' | 'currency' | 'percentage';
}

export interface ValidationRule {
  type: 'range' | 'required' | 'format' | 'enum';
  params?: Record<string, unknown>;
  errorMessage: string;
}

export interface TransformConfig {
  type: 'round' | 'currency' | 'percentage' | 'date' | 'boolean' | 'uppercase' | 'lowercase';
  params?: Record<string, unknown>;
}

// ============================================
// WEB SEARCH QUERY TEMPLATES
// ============================================

export const webSearchTemplates = {
  // Zillow queries
  ZILLOW_ZESTIMATE: '{address} zillow zestimate value',
  ZILLOW_VIEWS: '{address} zillow listing views saves',
  ZILLOW_RENT_ZESTIMATE: '{address} zillow rent zestimate',
  
  // Redfin queries
  REDFIN_ESTIMATE: '{address} redfin estimate value',
  REDFIN_YEAR_RENOVATED: '{address} redfin year renovated updated',
  REDFIN_MARKET_DATA: '{address} redfin market insights competition',
  REDFIN_COMPARABLES: '{address} redfin comparable sales nearby',
  REDFIN_ELECTRIC: '{address} redfin monthly electric utilities',
  REDFIN_SOLAR: '{address} redfin solar savings potential',
  
  // Homes.com queries
  HOMES_AVMs: '{address} homes.com home value estimate',
  HOMES_NEIGHBORHOOD: '{address} homes.com neighborhood median price',
  HOMES_TAX_HISTORY: '{address} homes.com tax history assessment',
  HOMES_SOUND_SCORE: '{address} homes.com sound score noise',
  HOMES_CRIME: '{address} homes.com crime score safety',
  
  // Trulia queries
  TRULIA_NEIGHBORHOOD: '{address} trulia neighborhood what locals say',
  TRULIA_ZIP_MEDIAN: '{address} trulia zip code median price',
  
  // Realtor.com queries
  REALTOR_TAX_ASSESSMENT: '{address} realtor.com tax assessment land improvement',
  REALTOR_VIEWS: '{address} realtor.com listing views',
  
  // Generic property search
  BROKER_MLS_DATA: '{mlsNumber} MLS listing florida',
  PROPERTY_GENERAL: '{address} property details bedrooms bathrooms',
  
  // County records
  COUNTY_PERMITS: '{address} {county} county building permits',
  COUNTY_TAX: '{address} {county} county property appraiser tax',
  
  // Tavily fallbacks
  TAVILY_GENERAL: '{address} property information {fieldName}'
};

// ============================================
// FIELD-SPECIFIC ROUTING RULES
// ============================================

export const routingRules: Partial<Record<string, RoutingRule>> = {
  // === PRICING & VALUE ===
  zestimate: {
    fieldId: 'zestimate',
    primaryRoute: {
      source: 'ZILLOW_WEBSEARCH',
      method: 'WEB_SEARCH_PARSE',
      searchQuery: webSearchTemplates.ZILLOW_ZESTIMATE,
      parseRules: [{
        regex: '\\$([\\d,]+)',
        extractType: 'currency'
      }],
      timeout: 10000
    },
    fallbackRoutes: [{
      source: 'TAVILY',
      method: 'WEB_SEARCH_PARSE',
      searchQuery: '{address} zillow zestimate home value',
      timeout: 15000
    }],
    validationRules: [{
      type: 'range',
      params: { min: 10000, max: 100000000 },
      errorMessage: 'Zestimate must be between $10,000 and $100,000,000'
    }],
    transformations: [{
      type: 'currency',
      params: { decimals: 0 }
    }]
  },
  
  redfinEstimate: {
    fieldId: 'redfinEstimate',
    primaryRoute: {
      source: 'REDFIN_WEBSEARCH',
      method: 'WEB_SEARCH_PARSE',
      searchQuery: webSearchTemplates.REDFIN_ESTIMATE,
      parseRules: [{
        regex: '\\$([\\d,]+)',
        extractType: 'currency'
      }],
      timeout: 10000
    },
    fallbackRoutes: [{
      source: 'TAVILY',
      method: 'WEB_SEARCH_PARSE',
      timeout: 15000
    }],
    validationRules: [{
      type: 'range',
      params: { min: 10000, max: 100000000 },
      errorMessage: 'Redfin estimate must be between $10,000 and $100,000,000'
    }]
  },
  
  // === MARKET DATA ===
  marketType: {
    fieldId: 'marketType',
    primaryRoute: {
      source: 'REDFIN_WEBSEARCH',
      method: 'WEB_SEARCH_PARSE',
      searchQuery: webSearchTemplates.REDFIN_MARKET_DATA,
      parseRules: [{
        regex: '(buyer|seller|balanced)\\s*market',
        extractType: 'text'
      }],
      timeout: 10000
    },
    fallbackRoutes: [{
      source: 'TAVILY',
      method: 'WEB_SEARCH_PARSE',
      timeout: 15000
    }],
    validationRules: [{
      type: 'enum',
      params: { values: ['Buyer', 'Seller', 'Balanced'] },
      errorMessage: 'Market type must be Buyer, Seller, or Balanced'
    }],
    transformations: [{
      type: 'uppercase'
    }]
  },
  
  // === SCHOOLS ===
  elementaryRating: {
    fieldId: 'elementaryRating',
    primaryRoute: {
      source: 'GREATSCHOOLS_API',
      method: 'DIRECT_API',
      apiEndpoint: '/nearby-schools?lat={lat}&lon={lon}&level=elementary',
      parseRules: [{
        jsonPath: '$.schools[0].rating',
        extractType: 'number'
      }],
      timeout: 5000
    },
    fallbackRoutes: [{
      source: 'ZILLOW_WEBSEARCH',
      method: 'WEB_SEARCH_PARSE',
      searchQuery: '{address} elementary school rating greatschools',
      timeout: 10000
    }],
    validationRules: [{
      type: 'range',
      params: { min: 1, max: 10 },
      errorMessage: 'School rating must be between 1 and 10'
    }]
  },
  
  // === ENVIRONMENTAL RISK ===
  floodFactor: {
    fieldId: 'floodFactor',
    primaryRoute: {
      source: 'FIRSTSTREET_API',
      method: 'DIRECT_API',
      apiEndpoint: '/flood/property?address={address}',
      parseRules: [{
        jsonPath: '$.floodFactor',
        extractType: 'number'
      }],
      timeout: 5000
    },
    fallbackRoutes: [{
      source: 'REDFIN_WEBSEARCH',
      method: 'WEB_SEARCH_PARSE',
      searchQuery: '{address} redfin flood factor risk',
      timeout: 10000
    }, {
      source: 'TAVILY',
      method: 'WEB_SEARCH_PARSE',
      timeout: 15000
    }],
    validationRules: [{
      type: 'range',
      params: { min: 1, max: 10 },
      errorMessage: 'Flood factor must be between 1 and 10'
    }]
  },
  
  floodZone: {
    fieldId: 'floodZone',
    primaryRoute: {
      source: 'FEMA_API',
      method: 'DIRECT_API',
      apiEndpoint: '/flood-zone?lat={lat}&lon={lon}',
      parseRules: [{
        jsonPath: '$.zone',
        extractType: 'text'
      }],
      timeout: 5000
    },
    fallbackRoutes: [{
      source: 'STELLAR_MLS',
      method: 'DIRECT_API',
      timeout: 5000
    }],
    validationRules: [{
      type: 'enum',
      params: { values: ['A', 'AE', 'AH', 'AO', 'V', 'VE', 'X', 'X500', 'D'] },
      errorMessage: 'Invalid FEMA flood zone designation'
    }]
  },
  
  // === LOCATION SCORES ===
  walkScore: {
    fieldId: 'walkScore',
    primaryRoute: {
      source: 'WALKSCORE_API',
      method: 'DIRECT_API',
      apiEndpoint: '/score?lat={lat}&lon={lon}&address={address}',
      parseRules: [{
        jsonPath: '$.walkscore',
        extractType: 'number'
      }],
      timeout: 5000
    },
    fallbackRoutes: [{
      source: 'REDFIN_WEBSEARCH',
      method: 'WEB_SEARCH_PARSE',
      searchQuery: '{address} walk score walkability',
      timeout: 10000
    }],
    validationRules: [{
      type: 'range',
      params: { min: 0, max: 100 },
      errorMessage: 'Walk Score must be between 0 and 100'
    }]
  },
  
  // === DEMOGRAPHICS ===
  avgHouseholdIncome: {
    fieldId: 'avgHouseholdIncome',
    primaryRoute: {
      source: 'CENSUS_API',
      method: 'DIRECT_API',
      apiEndpoint: '/acs/acs5?get=B19013_001E&for=tract:{tract}&in=state:{state}&in=county:{county}',
      parseRules: [{
        jsonPath: '$[1][0]',
        extractType: 'currency'
      }],
      timeout: 5000
    },
    fallbackRoutes: [{
      source: 'HOMES_WEBSEARCH',
      method: 'WEB_SEARCH_PARSE',
      searchQuery: '{address} homes.com neighborhood household income',
      timeout: 10000
    }],
    transformations: [{
      type: 'currency',
      params: { decimals: 0 }
    }]
  },
  
  // === CRIME ===
  violentCrimeRate: {
    fieldId: 'violentCrimeRate',
    primaryRoute: {
      source: 'FBI_CRIME_API',
      method: 'DIRECT_API',
      apiEndpoint: '/summarized/agency/{ori}/offenses?from=2023&to=2023',
      parseRules: [{
        jsonPath: '$.results[?(@.offense=="violent-crime")].actual',
        extractType: 'number'
      }],
      timeout: 5000
    },
    fallbackRoutes: [{
      source: 'TAVILY',
      method: 'WEB_SEARCH_PARSE',
      searchQuery: '{city} {state} violent crime rate per capita',
      timeout: 15000
    }]
  }
};

// ============================================
// CALCULATION FORMULAS
// ============================================

export interface CalculationFormula {
  fieldId: string;
  formula: string;
  dependencies: string[];
  description: string;
}

export const calculationFormulas: CalculationFormula[] = [
  {
    fieldId: 'pricePerSqft',
    formula: 'listPrice / livingAreaSqft',
    dependencies: ['listPrice', 'livingAreaSqft'],
    description: 'Price per square foot of living area'
  },
  {
    fieldId: 'averageAvm',
    formula: '(zestimate + redfinEstimate + quantariumAvm + firstAmericanAvm + iceAvm + collateralAnalyticsAvm) / 6',
    dependencies: ['zestimate', 'redfinEstimate', 'quantariumAvm', 'firstAmericanAvm', 'iceAvm', 'collateralAnalyticsAvm'],
    description: 'Average of 6 automated valuation models'
  },
  {
    fieldId: 'avmVsListPrice',
    formula: '((averageAvm - listPrice) / listPrice) * 100',
    dependencies: ['averageAvm', 'listPrice'],
    description: 'Percentage difference between average AVM and list price'
  },
  {
    fieldId: 'priceChangeAmount',
    formula: 'listPrice - originalListPrice',
    dependencies: ['listPrice', 'originalListPrice'],
    description: 'Dollar amount of price change since original listing'
  },
  {
    fieldId: 'priceChangePercent',
    formula: '((listPrice - originalListPrice) / originalListPrice) * 100',
    dependencies: ['listPrice', 'originalListPrice'],
    description: 'Percentage price change since original listing'
  },
  {
    fieldId: 'monthlyTaxEstimate',
    formula: 'currentYearTax / 12',
    dependencies: ['currentYearTax'],
    description: 'Estimated monthly property tax payment'
  },
  {
    fieldId: 'taxYoyChange',
    formula: '((tax2024 - tax2023) / tax2023) * 100',
    dependencies: ['tax2024', 'tax2023'],
    description: 'Year-over-year tax change percentage'
  },
  {
    fieldId: 'taxAsPercentOfValue',
    formula: '(currentYearTax / listPrice) * 100',
    dependencies: ['currentYearTax', 'listPrice'],
    description: 'Effective tax rate as percentage of list price'
  },
  {
    fieldId: 'lotSizeAcres',
    formula: 'lotSizeSqft / 43560',
    dependencies: ['lotSizeSqft'],
    description: 'Lot size converted from square feet to acres'
  },
  {
    fieldId: 'averageSchoolRating',
    formula: '(elementaryRating + middleRating + highRating) / 3',
    dependencies: ['elementaryRating', 'middleRating', 'highRating'],
    description: 'Average rating across all 3 assigned schools'
  },
  {
    fieldId: 'totalViews',
    formula: 'viewsZillow + viewsRealtor + viewsRedfin + viewsHomes',
    dependencies: ['viewsZillow', 'viewsRealtor', 'viewsRedfin', 'viewsHomes'],
    description: 'Total views across all 4 major platforms'
  },
  {
    fieldId: 'percentAboveBelowMedian',
    formula: '((listPrice - neighborhoodMedianPrice) / neighborhoodMedianPrice) * 100',
    dependencies: ['listPrice', 'neighborhoodMedianPrice'],
    description: 'Percentage above or below neighborhood median price'
  },
  {
    fieldId: 'lastSalePricePerSqft',
    formula: 'lastSalePrice / livingAreaSqft',
    dependencies: ['lastSalePrice', 'livingAreaSqft'],
    description: 'Last sale price per square foot'
  },
  {
    fieldId: 'appreciationSinceLastSale',
    formula: 'listPrice - lastSalePrice',
    dependencies: ['listPrice', 'lastSalePrice'],
    description: 'Dollar appreciation since last sale'
  },
  {
    fieldId: 'appreciationSinceLastSalePercent',
    formula: '((listPrice - lastSalePrice) / lastSalePrice) * 100',
    dependencies: ['listPrice', 'lastSalePrice'],
    description: 'Percentage appreciation since last sale'
  },
  {
    fieldId: 'estimatedTotalMonthlyUtilities',
    formula: 'monthlyElectricEstimate * 1.5',
    dependencies: ['monthlyElectricEstimate'],
    description: 'Estimated total utilities (electric + water/sewer estimate)'
  }
];

// ============================================
// COMPARISON LOGIC
// ============================================

export type ComparisonResult = 'BETTER' | 'SAME' | 'WORSE' | 'N/A';

export interface ComparisonConfig {
  fieldId: string;
  comparisonType: 'HIGHER_BETTER' | 'LOWER_BETTER' | 'BOOLEAN_TRUE_BETTER' | 'BOOLEAN_FALSE_BETTER' | 'NO_COMPARISON';
  tolerancePercent?: number;  // For "SAME" determination
  customComparator?: string;  // Function name for complex comparisons
}

export const comparisonConfigs: Partial<Record<string, ComparisonConfig>> = {
  // Price - LOWER is better for buyers
  listPrice: { fieldId: 'listPrice', comparisonType: 'LOWER_BETTER', tolerancePercent: 2 },
  pricePerSqft: { fieldId: 'pricePerSqft', comparisonType: 'LOWER_BETTER', tolerancePercent: 5 },
  
  // Value vs AVM - NEGATIVE means underpriced (better)
  avmVsListPrice: { fieldId: 'avmVsListPrice', comparisonType: 'HIGHER_BETTER', tolerancePercent: 3 },
  
  // Specs - HIGHER is better
  bedrooms: { fieldId: 'bedrooms', comparisonType: 'HIGHER_BETTER', tolerancePercent: 0 },
  bathroomsFull: { fieldId: 'bathroomsFull', comparisonType: 'HIGHER_BETTER', tolerancePercent: 0 },
  livingAreaSqft: { fieldId: 'livingAreaSqft', comparisonType: 'HIGHER_BETTER', tolerancePercent: 5 },
  lotSizeSqft: { fieldId: 'lotSizeSqft', comparisonType: 'HIGHER_BETTER', tolerancePercent: 10 },
  yearBuilt: { fieldId: 'yearBuilt', comparisonType: 'HIGHER_BETTER', tolerancePercent: 5 },
  
  // Market - Lower DOM is better
  daysOnMarket: { fieldId: 'daysOnMarket', comparisonType: 'LOWER_BETTER', tolerancePercent: 20 },
  
  // Taxes/HOA - LOWER is better
  hoaFee: { fieldId: 'hoaFee', comparisonType: 'LOWER_BETTER', tolerancePercent: 10 },
  currentYearTax: { fieldId: 'currentYearTax', comparisonType: 'LOWER_BETTER', tolerancePercent: 10 },
  
  // Scores - HIGHER is better
  walkScore: { fieldId: 'walkScore', comparisonType: 'HIGHER_BETTER', tolerancePercent: 5 },
  bikeScore: { fieldId: 'bikeScore', comparisonType: 'HIGHER_BETTER', tolerancePercent: 5 },
  transitScore: { fieldId: 'transitScore', comparisonType: 'HIGHER_BETTER', tolerancePercent: 5 },
  elementaryRating: { fieldId: 'elementaryRating', comparisonType: 'HIGHER_BETTER', tolerancePercent: 0 },
  middleRating: { fieldId: 'middleRating', comparisonType: 'HIGHER_BETTER', tolerancePercent: 0 },
  highRating: { fieldId: 'highRating', comparisonType: 'HIGHER_BETTER', tolerancePercent: 0 },
  averageSchoolRating: { fieldId: 'averageSchoolRating', comparisonType: 'HIGHER_BETTER', tolerancePercent: 5 },
  
  // Risk factors - LOWER is better
  floodFactor: { fieldId: 'floodFactor', comparisonType: 'LOWER_BETTER', tolerancePercent: 0 },
  fireFactor: { fieldId: 'fireFactor', comparisonType: 'LOWER_BETTER', tolerancePercent: 0 },
  heatFactor: { fieldId: 'heatFactor', comparisonType: 'LOWER_BETTER', tolerancePercent: 0 },
  windFactor: { fieldId: 'windFactor', comparisonType: 'LOWER_BETTER', tolerancePercent: 0 },
  crimeScore: { fieldId: 'crimeScore', comparisonType: 'LOWER_BETTER', tolerancePercent: 10 },
  
  // Distances - LOWER is better (closer is better)
  distanceToBeach: { fieldId: 'distanceToBeach', comparisonType: 'LOWER_BETTER', tolerancePercent: 10 },
  distanceToDowntown: { fieldId: 'distanceToDowntown', comparisonType: 'LOWER_BETTER', tolerancePercent: 10 },
  distanceToAirport: { fieldId: 'distanceToAirport', comparisonType: 'LOWER_BETTER', tolerancePercent: 15 },
  distanceToGrocery: { fieldId: 'distanceToGrocery', comparisonType: 'LOWER_BETTER', tolerancePercent: 20 },
  
  // Amenities - HIGHER count is better
  restaurantCount1Mi: { fieldId: 'restaurantCount1Mi', comparisonType: 'HIGHER_BETTER', tolerancePercent: 15 },
  parkCount1Mi: { fieldId: 'parkCount1Mi', comparisonType: 'HIGHER_BETTER', tolerancePercent: 20 },
  
  // Booleans - Having feature is better
  pool: { fieldId: 'pool', comparisonType: 'BOOLEAN_TRUE_BETTER' },
  waterfront: { fieldId: 'waterfront', comparisonType: 'BOOLEAN_TRUE_BETTER' },
  waterView: { fieldId: 'waterView', comparisonType: 'BOOLEAN_TRUE_BETTER' },
  impactWindows: { fieldId: 'impactWindows', comparisonType: 'BOOLEAN_TRUE_BETTER' },
  solarPanels: { fieldId: 'solarPanels', comparisonType: 'BOOLEAN_TRUE_BETTER' },
  generator: { fieldId: 'generator', comparisonType: 'BOOLEAN_TRUE_BETTER' },
  dock: { fieldId: 'dock', comparisonType: 'BOOLEAN_TRUE_BETTER' },
  gatedCommunity: { fieldId: 'gatedCommunity', comparisonType: 'BOOLEAN_TRUE_BETTER' },
  
  // Investment metrics
  appreciationSinceLastSalePercent: { fieldId: 'appreciationSinceLastSalePercent', comparisonType: 'HIGHER_BETTER', tolerancePercent: 10 },
  totalViews: { fieldId: 'totalViews', comparisonType: 'HIGHER_BETTER', tolerancePercent: 20 },
  
  // Utilities - LOWER cost is better
  monthlyElectricEstimate: { fieldId: 'monthlyElectricEstimate', comparisonType: 'LOWER_BETTER', tolerancePercent: 15 },
  
  // Connectivity - HIGHER is better
  maxInternetSpeed: { fieldId: 'maxInternetSpeed', comparisonType: 'HIGHER_BETTER', tolerancePercent: 20 },
  internetProvidersCount: { fieldId: 'internetProvidersCount', comparisonType: 'HIGHER_BETTER', tolerancePercent: 0 },
  
  // Parking - HIGHER is better
  garageSpaces: { fieldId: 'garageSpaces', comparisonType: 'HIGHER_BETTER', tolerancePercent: 0 },
  parkingTotalSpaces: { fieldId: 'parkingTotalSpaces', comparisonType: 'HIGHER_BETTER', tolerancePercent: 0 },
  
  // Waterfront - HIGHER feet is better
  waterfrontFeet: { fieldId: 'waterfrontFeet', comparisonType: 'HIGHER_BETTER', tolerancePercent: 10 },
  
  // Elevation - HIGHER is better in FL (flood)
  elevationAboveSeaLevel: { fieldId: 'elevationAboveSeaLevel', comparisonType: 'HIGHER_BETTER', tolerancePercent: 20 }
};

// ============================================
// EXPORT SUMMARY
// ============================================

export function getRoutingRule(fieldId: string): RoutingRule | undefined {
  return routingRules[fieldId];
}

export function getCalculationFormula(fieldId: string): CalculationFormula | undefined {
  return calculationFormulas.find(f => f.fieldId === fieldId);
}

export function getComparisonConfig(fieldId: string): ComparisonConfig | undefined {
  return comparisonConfigs[fieldId];
}

export function getDataSourceConfig(source: DataSource): DataSourceConfig {
  return dataSourceConfigs[source];
}
