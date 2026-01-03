/**
 * OLIVIA CMA - Field Schema
 * 220 Fields Mapped to 22 Categories
 * John E. Desautels & Associates
 * 
 * NO MOCK DATA - Structure only
 */

export type ComparativeValue = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type DataSource = 
  | 'STELLAR_MLS'
  | 'ZILLOW_WEBSEARCH'
  | 'REDFIN_WEBSEARCH'
  | 'REALTOR_WEBSEARCH'
  | 'HOMES_WEBSEARCH'
  | 'TRULIA_WEBSEARCH'
  | 'GREATSCHOOLS_API'
  | 'WALKSCORE_API'
  | 'FIRSTSTREET_API'
  | 'GOOGLE_PLACES_API'
  | 'GOOGLE_GEOCODE_API'
  | 'FEMA_API'
  | 'CENSUS_API'
  | 'FBI_CRIME_API'
  | 'USGS_API'
  | 'BROADBAND_API'
  | 'TAVILY'
  | 'CALCULATION'
  | 'COUNTY_RECORDS';

export type ScrapingMethod = 
  | 'DIRECT_API'
  | 'WEB_SEARCH_PARSE'
  | 'CALCULATION'
  | 'GEOCODE_LOOKUP'
  | 'RADIUS_SEARCH'
  | 'CATEGORY_SEARCH';

export interface FieldDefinition {
  id: string;
  name: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'currency' | 'percentage' | 'array';
  comparativeValue: ComparativeValue;
  primarySource: DataSource;
  fallbackSources: DataSource[];
  scrapingMethod: ScrapingMethod;
  unit?: string;
  notes?: string;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  icon: string;
  fields: FieldDefinition[];
  displayOrder: number;
}

// ============================================
// CATEGORY 1: ADDRESS & IDENTITY
// ============================================
export const addressIdentityFields: FieldDefinition[] = [
  {
    id: 'address',
    name: 'Address',
    dataType: 'string',
    comparativeValue: 'CRITICAL',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH', 'REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Full street address'
  },
  {
    id: 'city',
    name: 'City',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['GOOGLE_GEOCODE_API'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'zipCode',
    name: 'Zip Code',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['GOOGLE_GEOCODE_API'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'subdivision',
    name: 'Subdivision',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'neighborhoodName',
    name: 'Neighborhood Name',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'propertyType',
    name: 'Property Type',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'SFH/Condo/Townhome'
  },
  {
    id: 'mlsNumber',
    name: 'MLS Number',
    dataType: 'string',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: [],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'mlsStatus',
    name: 'MLS Status',
    dataType: 'string',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Active/Pending/Sold'
  },
  {
    id: 'county',
    name: 'County',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['GOOGLE_GEOCODE_API'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'parcelNumber',
    name: 'Parcel Number',
    dataType: 'string',
    comparativeValue: 'LOW',
    primarySource: 'COUNTY_RECORDS',
    fallbackSources: ['STELLAR_MLS'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  }
];

// ============================================
// CATEGORY 2: PRICING & VALUE
// ============================================
export const pricingValueFields: FieldDefinition[] = [
  {
    id: 'listPrice',
    name: 'List Price',
    dataType: 'currency',
    comparativeValue: 'CRITICAL',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH', 'REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Primary comparison metric'
  },
  {
    id: 'pricePerSqft',
    name: 'Price Per Sq Ft',
    dataType: 'currency',
    comparativeValue: 'CRITICAL',
    primarySource: 'CALCULATION',
    fallbackSources: [],
    scrapingMethod: 'CALCULATION',
    notes: 'listPrice / livingAreaSqft'
  },
  {
    id: 'zestimate',
    name: 'Zestimate',
    dataType: 'currency',
    comparativeValue: 'CRITICAL',
    primarySource: 'ZILLOW_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE',
    notes: 'Zillow AVM'
  },
  {
    id: 'redfinEstimate',
    name: 'Redfin Estimate',
    dataType: 'currency',
    comparativeValue: 'CRITICAL',
    primarySource: 'REDFIN_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE',
    notes: 'Redfin AVM'
  },
  {
    id: 'quantariumAvm',
    name: 'Quantarium AVM',
    dataType: 'currency',
    comparativeValue: 'HIGH',
    primarySource: 'HOMES_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'firstAmericanAvm',
    name: 'First American AVM',
    dataType: 'currency',
    comparativeValue: 'HIGH',
    primarySource: 'HOMES_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'iceAvm',
    name: 'ICE AVM',
    dataType: 'currency',
    comparativeValue: 'MEDIUM',
    primarySource: 'HOMES_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'collateralAnalyticsAvm',
    name: 'Collateral Analytics AVM',
    dataType: 'currency',
    comparativeValue: 'MEDIUM',
    primarySource: 'HOMES_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'averageAvm',
    name: 'Average AVM',
    dataType: 'currency',
    comparativeValue: 'CRITICAL',
    primarySource: 'CALCULATION',
    fallbackSources: [],
    scrapingMethod: 'CALCULATION',
    notes: 'Mean of 6 AVMs'
  },
  {
    id: 'avmVsListPrice',
    name: 'AVM vs List Price',
    dataType: 'percentage',
    comparativeValue: 'CRITICAL',
    primarySource: 'CALCULATION',
    fallbackSources: [],
    scrapingMethod: 'CALCULATION',
    notes: '(averageAvm - listPrice) / listPrice'
  },
  {
    id: 'originalListPrice',
    name: 'Original List Price',
    dataType: 'currency',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'priceChangeAmount',
    name: 'Price Change Amount',
    dataType: 'currency',
    comparativeValue: 'HIGH',
    primarySource: 'CALCULATION',
    fallbackSources: [],
    scrapingMethod: 'CALCULATION',
    notes: 'listPrice - originalListPrice'
  },
  {
    id: 'priceChangePercent',
    name: 'Price Change %',
    dataType: 'percentage',
    comparativeValue: 'HIGH',
    primarySource: 'CALCULATION',
    fallbackSources: [],
    scrapingMethod: 'CALCULATION'
  },
  {
    id: 'numberOfPriceChanges',
    name: 'Number of Price Changes',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  }
];

// ============================================
// CATEGORY 3: PROPERTY BASICS
// ============================================
export const propertyBasicsFields: FieldDefinition[] = [
  {
    id: 'bedrooms',
    name: 'Bedrooms',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH', 'REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'bathroomsFull',
    name: 'Bathrooms (Full)',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'bathroomsHalf',
    name: 'Bathrooms (Half)',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'livingAreaSqft',
    name: 'Living Area (Sq Ft)',
    dataType: 'number',
    comparativeValue: 'CRITICAL',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH', 'REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    unit: 'sqft'
  },
  {
    id: 'lotSizeSqft',
    name: 'Lot Size (Sq Ft)',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['COUNTY_RECORDS'],
    scrapingMethod: 'DIRECT_API',
    unit: 'sqft'
  },
  {
    id: 'lotSizeAcres',
    name: 'Lot Size (Acres)',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'CALCULATION',
    fallbackSources: [],
    scrapingMethod: 'CALCULATION',
    notes: 'lotSizeSqft / 43560',
    unit: 'acres'
  },
  {
    id: 'buildingAreaSqft',
    name: 'Building Area (Sq Ft)',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['COUNTY_RECORDS'],
    scrapingMethod: 'DIRECT_API',
    unit: 'sqft'
  },
  {
    id: 'yearBuilt',
    name: 'Year Built',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['COUNTY_RECORDS', 'ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'yearRenovated',
    name: 'Year Renovated',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'REDFIN_WEBSEARCH',
    fallbackSources: ['HOMES_WEBSEARCH', 'TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE',
    notes: 'Only available on Redfin'
  },
  {
    id: 'stories',
    name: 'Stories',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'daysOnMarket',
    name: 'Days on Market',
    dataType: 'number',
    comparativeValue: 'CRITICAL',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH', 'REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Market demand indicator'
  },
  {
    id: 'cumulativeDaysOnMarket',
    name: 'Cumulative Days on Market',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  }
];

// ============================================
// CATEGORY 4: HOA & TAXES
// ============================================
export const hoaTaxesFields: FieldDefinition[] = [
  {
    id: 'hoaFee',
    name: 'HOA Fee',
    dataType: 'currency',
    comparativeValue: 'CRITICAL',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH', 'REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'hoaFrequency',
    name: 'HOA Frequency',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Monthly/Quarterly/Annual'
  },
  {
    id: 'hoaIncludes',
    name: 'HOA Includes',
    dataType: 'array',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'hoaRestrictions',
    name: 'HOA Restrictions',
    dataType: 'array',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'cddFee',
    name: 'CDD Fee',
    dataType: 'currency',
    comparativeValue: 'HIGH',
    primarySource: 'REDFIN_WEBSEARCH',
    fallbackSources: ['STELLAR_MLS', 'TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE',
    notes: 'FL-specific'
  },
  {
    id: 'specialAssessments',
    name: 'Special Assessments',
    dataType: 'currency',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'currentYearTax',
    name: 'Current Year Tax',
    dataType: 'currency',
    comparativeValue: 'CRITICAL',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['COUNTY_RECORDS', 'HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'monthlyTaxEstimate',
    name: 'Monthly Tax Estimate',
    dataType: 'currency',
    comparativeValue: 'CRITICAL',
    primarySource: 'CALCULATION',
    fallbackSources: [],
    scrapingMethod: 'CALCULATION',
    notes: 'currentYearTax / 12'
  },
  {
    id: 'taxAssessmentTotal',
    name: 'Tax Assessment (Total)',
    dataType: 'currency',
    comparativeValue: 'HIGH',
    primarySource: 'HOMES_WEBSEARCH',
    fallbackSources: ['COUNTY_RECORDS', 'TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'taxAssessmentLand',
    name: 'Tax Assessment (Land)',
    dataType: 'currency',
    comparativeValue: 'HIGH',
    primarySource: 'REALTOR_WEBSEARCH',
    fallbackSources: ['COUNTY_RECORDS'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'taxAssessmentImprovement',
    name: 'Tax Assessment (Improvement)',
    dataType: 'currency',
    comparativeValue: 'HIGH',
    primarySource: 'REALTOR_WEBSEARCH',
    fallbackSources: ['COUNTY_RECORDS'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'homesteadExemption',
    name: 'Homestead Exemption',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'REDFIN_WEBSEARCH',
    fallbackSources: ['COUNTY_RECORDS'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'tax2025',
    name: '2025 Tax',
    dataType: 'currency',
    comparativeValue: 'CRITICAL',
    primarySource: 'HOMES_WEBSEARCH',
    fallbackSources: ['COUNTY_RECORDS'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'tax2024',
    name: '2024 Tax',
    dataType: 'currency',
    comparativeValue: 'CRITICAL',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['COUNTY_RECORDS', 'HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'tax2023',
    name: '2023 Tax',
    dataType: 'currency',
    comparativeValue: 'HIGH',
    primarySource: 'HOMES_WEBSEARCH',
    fallbackSources: ['COUNTY_RECORDS'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'tax2022',
    name: '2022 Tax',
    dataType: 'currency',
    comparativeValue: 'MEDIUM',
    primarySource: 'HOMES_WEBSEARCH',
    fallbackSources: ['COUNTY_RECORDS'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'taxYoyChange',
    name: 'Tax YoY Change',
    dataType: 'percentage',
    comparativeValue: 'HIGH',
    primarySource: 'CALCULATION',
    fallbackSources: [],
    scrapingMethod: 'CALCULATION',
    notes: '(tax2024 - tax2023) / tax2023'
  },
  {
    id: 'fiveYearTaxTrend',
    name: '5-Year Tax Trend',
    dataType: 'string',
    comparativeValue: 'HIGH',
    primarySource: 'CALCULATION',
    fallbackSources: [],
    scrapingMethod: 'CALCULATION',
    notes: 'Regression slope analysis'
  },
  {
    id: 'taxAsPercentOfValue',
    name: 'Tax as % of Value',
    dataType: 'percentage',
    comparativeValue: 'CRITICAL',
    primarySource: 'CALCULATION',
    fallbackSources: [],
    scrapingMethod: 'CALCULATION',
    notes: 'currentYearTax / listPrice'
  }
];

// ============================================
// CATEGORY 5: STRUCTURE & SYSTEMS
// ============================================
export const structureSystemsFields: FieldDefinition[] = [
  {
    id: 'foundationType',
    name: 'Foundation Type',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Slab/Crawl/Basement'
  },
  {
    id: 'roofType',
    name: 'Roof Type',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Tile/Shingle/Metal'
  },
  {
    id: 'roofAge',
    name: 'Roof Age',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'REDFIN_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE',
    unit: 'years'
  },
  {
    id: 'exteriorMaterial',
    name: 'Exterior Material',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Block/Stucco/Vinyl'
  },
  {
    id: 'constructionQuality',
    name: 'Construction Quality',
    dataType: 'string',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['COUNTY_RECORDS'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Standard/Custom'
  },
  {
    id: 'condition',
    name: 'Condition',
    dataType: 'string',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Excellent/Good/Fair'
  },
  {
    id: 'acType',
    name: 'A/C Type',
    dataType: 'string',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Central/Window/None'
  },
  {
    id: 'heatingType',
    name: 'Heating Type',
    dataType: 'string',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Central/Baseboard'
  },
  {
    id: 'waterHeaterType',
    name: 'Water Heater Type',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Tank/Tankless'
  },
  {
    id: 'windowType',
    name: 'Window Type',
    dataType: 'string',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'impactWindows',
    name: 'Impact Windows',
    dataType: 'boolean',
    comparativeValue: 'CRITICAL',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'FL insurance critical'
  },
  {
    id: 'hurricaneShutters',
    name: 'Hurricane Shutters',
    dataType: 'boolean',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'FL-specific'
  },
  {
    id: 'electricalPanel',
    name: 'Electrical Panel',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'plumbingType',
    name: 'Plumbing Type',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  }
];

// ============================================
// CATEGORY 6: INTERIOR FEATURES
// ============================================
export const interiorFeaturesFields: FieldDefinition[] = [
  {
    id: 'flooringTypes',
    name: 'Flooring Types',
    dataType: 'array',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Tile/Wood/Carpet'
  },
  {
    id: 'kitchenStyle',
    name: 'Kitchen Style',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Updated/Gourmet'
  },
  {
    id: 'appliancesIncluded',
    name: 'Appliances Included',
    dataType: 'array',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'laundryType',
    name: 'Laundry Type',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'In-unit/Hookup'
  },
  {
    id: 'laundryLocation',
    name: 'Laundry Location',
    dataType: 'string',
    comparativeValue: 'LOW',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'primaryBedroomLocation',
    name: 'Primary Bedroom Location',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Main/Upper'
  },
  {
    id: 'walkInCloset',
    name: 'Walk-in Closet',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'pantry',
    name: 'Pantry',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'cathedralCeiling',
    name: 'Cathedral Ceiling',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'ceilingFans',
    name: 'Ceiling Fans',
    dataType: 'number',
    comparativeValue: 'LOW',
    primarySource: 'STELLAR_MLS',
    fallbackSources: [],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'windowTreatments',
    name: 'Window Treatments',
    dataType: 'string',
    comparativeValue: 'LOW',
    primarySource: 'STELLAR_MLS',
    fallbackSources: [],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'smartHomeFeatures',
    name: 'Smart Home Features',
    dataType: 'array',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'fireplaceCount',
    name: 'Fireplace Count',
    dataType: 'number',
    comparativeValue: 'LOW',
    primarySource: 'STELLAR_MLS',
    fallbackSources: [],
    scrapingMethod: 'DIRECT_API'
  }
];

// ============================================
// CATEGORY 7: EXTERIOR FEATURES
// ============================================
export const exteriorFeaturesFields: FieldDefinition[] = [
  {
    id: 'fencing',
    name: 'Fencing',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Vinyl/Wood/None'
  },
  {
    id: 'balconyDeck',
    name: 'Balcony/Deck',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'patio',
    name: 'Patio',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'screened',
    name: 'Screened Area',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'FL-specific'
  },
  {
    id: 'outdoorKitchen',
    name: 'Outdoor Kitchen',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'sprinklerSystem',
    name: 'Sprinkler System',
    dataType: 'boolean',
    comparativeValue: 'LOW',
    primarySource: 'STELLAR_MLS',
    fallbackSources: [],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'landscaping',
    name: 'Landscaping',
    dataType: 'string',
    comparativeValue: 'LOW',
    primarySource: 'STELLAR_MLS',
    fallbackSources: [],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'directionFaces',
    name: 'Direction Faces',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'REDFIN_WEBSEARCH',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  }
];

// ============================================
// CATEGORY 8: PERMITS & RENOVATIONS
// ============================================
export const permitsRenovationsFields: FieldDefinition[] = [
  {
    id: 'yearRenovatedRepeat',
    name: 'Year Renovated',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'REDFIN_WEBSEARCH',
    fallbackSources: ['HOMES_WEBSEARCH', 'TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'newConstruction',
    name: 'New Construction',
    dataType: 'boolean',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'permitHistory',
    name: 'Permit History',
    dataType: 'array',
    comparativeValue: 'HIGH',
    primarySource: 'COUNTY_RECORDS',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'recentRenovations',
    name: 'Recent Renovations',
    dataType: 'array',
    comparativeValue: 'HIGH',
    primarySource: 'REDFIN_WEBSEARCH',
    fallbackSources: ['STELLAR_MLS'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'openPermits',
    name: 'Open Permits',
    dataType: 'boolean',
    comparativeValue: 'CRITICAL',
    primarySource: 'COUNTY_RECORDS',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  }
];

// ============================================
// CATEGORY 9: ASSIGNED SCHOOLS
// ============================================
export const assignedSchoolsFields: FieldDefinition[] = [
  {
    id: 'elementarySchoolName',
    name: 'Elementary School Name',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'GREATSCHOOLS_API',
    fallbackSources: ['ZILLOW_WEBSEARCH', 'REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'elementaryRating',
    name: 'Elementary Rating',
    dataType: 'number',
    comparativeValue: 'CRITICAL',
    primarySource: 'GREATSCHOOLS_API',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: '1-10 scale'
  },
  {
    id: 'elementaryDistance',
    name: 'Elementary Distance',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'GREATSCHOOLS_API',
    fallbackSources: ['GOOGLE_PLACES_API'],
    scrapingMethod: 'DIRECT_API',
    unit: 'miles'
  },
  {
    id: 'middleSchoolName',
    name: 'Middle School Name',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'GREATSCHOOLS_API',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'middleRating',
    name: 'Middle Rating',
    dataType: 'number',
    comparativeValue: 'CRITICAL',
    primarySource: 'GREATSCHOOLS_API',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: '1-10 scale'
  },
  {
    id: 'middleDistance',
    name: 'Middle Distance',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'GREATSCHOOLS_API',
    fallbackSources: ['GOOGLE_PLACES_API'],
    scrapingMethod: 'DIRECT_API',
    unit: 'miles'
  },
  {
    id: 'highSchoolName',
    name: 'High School Name',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'GREATSCHOOLS_API',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'highRating',
    name: 'High Rating',
    dataType: 'number',
    comparativeValue: 'CRITICAL',
    primarySource: 'GREATSCHOOLS_API',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: '1-10 scale'
  },
  {
    id: 'highDistance',
    name: 'High Distance',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'GREATSCHOOLS_API',
    fallbackSources: ['GOOGLE_PLACES_API'],
    scrapingMethod: 'DIRECT_API',
    unit: 'miles'
  },
  {
    id: 'averageSchoolRating',
    name: 'Average School Rating',
    dataType: 'number',
    comparativeValue: 'CRITICAL',
    primarySource: 'CALCULATION',
    fallbackSources: [],
    scrapingMethod: 'CALCULATION',
    notes: 'Mean of 3 school ratings'
  }
];

// ============================================
// CATEGORY 10: LOCATION SCORES
// ============================================
export const locationScoresFields: FieldDefinition[] = [
  {
    id: 'walkScore',
    name: 'Walk Score',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'WALKSCORE_API',
    fallbackSources: ['REDFIN_WEBSEARCH', 'TAVILY'],
    scrapingMethod: 'DIRECT_API',
    notes: '0-100 scale'
  },
  {
    id: 'bikeScore',
    name: 'Bike Score',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'WALKSCORE_API',
    fallbackSources: ['REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: '0-100 scale'
  },
  {
    id: 'transitScore',
    name: 'Transit Score',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'WALKSCORE_API',
    fallbackSources: ['REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: '0-100 scale'
  },
  {
    id: 'walkScoreDescription',
    name: 'Walk Score Description',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'WALKSCORE_API',
    fallbackSources: ['REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Car-dependent/Somewhat Walkable/Very Walkable/Walker\'s Paradise'
  },
  {
    id: 'soundScore',
    name: 'Sound Score',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'HOMES_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  }
];

// ============================================
// CATEGORY 11: DISTANCES & AMENITIES
// ============================================
export const distancesAmenitiesFields: FieldDefinition[] = [
  {
    id: 'distanceToBeach',
    name: 'Distance to Beach',
    dataType: 'number',
    comparativeValue: 'CRITICAL',
    primarySource: 'GOOGLE_PLACES_API',
    fallbackSources: ['CALCULATION'],
    scrapingMethod: 'GEOCODE_LOOKUP',
    unit: 'miles',
    notes: 'FL priority'
  },
  {
    id: 'distanceToDowntown',
    name: 'Distance to Downtown',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'GOOGLE_PLACES_API',
    fallbackSources: ['CALCULATION'],
    scrapingMethod: 'GEOCODE_LOOKUP',
    unit: 'miles'
  },
  {
    id: 'distanceToAirport',
    name: 'Distance to Airport',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'GOOGLE_PLACES_API',
    fallbackSources: ['CALCULATION'],
    scrapingMethod: 'GEOCODE_LOOKUP',
    unit: 'miles'
  },
  {
    id: 'distanceToInterstate',
    name: 'Distance to Interstate',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'GOOGLE_PLACES_API',
    fallbackSources: ['CALCULATION'],
    scrapingMethod: 'GEOCODE_LOOKUP',
    unit: 'miles'
  },
  {
    id: 'distanceToGrocery',
    name: 'Distance to Grocery',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'GOOGLE_PLACES_API',
    fallbackSources: [],
    scrapingMethod: 'RADIUS_SEARCH',
    unit: 'miles'
  },
  {
    id: 'distanceToHospital',
    name: 'Distance to Hospital',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'GOOGLE_PLACES_API',
    fallbackSources: [],
    scrapingMethod: 'RADIUS_SEARCH',
    unit: 'miles'
  },
  {
    id: 'nearbyPoiCount',
    name: 'Nearby POI Count',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'GOOGLE_PLACES_API',
    fallbackSources: [],
    scrapingMethod: 'RADIUS_SEARCH'
  },
  {
    id: 'restaurantCount1Mi',
    name: 'Restaurants within 1 mile',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'GOOGLE_PLACES_API',
    fallbackSources: [],
    scrapingMethod: 'CATEGORY_SEARCH'
  },
  {
    id: 'parkCount1Mi',
    name: 'Parks within 1 mile',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'GOOGLE_PLACES_API',
    fallbackSources: [],
    scrapingMethod: 'CATEGORY_SEARCH'
  },
  {
    id: 'percentWithinWalkOfPark',
    name: '% Within Walk of Park',
    dataType: 'percentage',
    comparativeValue: 'MEDIUM',
    primarySource: 'HOMES_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  }
];

// ============================================
// CATEGORY 12: SAFETY & CRIME
// ============================================
export const safetyCrimeFields: FieldDefinition[] = [
  {
    id: 'crimeScore',
    name: 'Crime Score',
    dataType: 'number',
    comparativeValue: 'CRITICAL',
    primarySource: 'HOMES_WEBSEARCH',
    fallbackSources: ['FBI_CRIME_API', 'TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'violentCrimeRate',
    name: 'Violent Crime Rate',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'FBI_CRIME_API',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'propertyCrimeRate',
    name: 'Property Crime Rate',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'FBI_CRIME_API',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'safeWalkAloneNight',
    name: 'Safe Walk Alone Night %',
    dataType: 'percentage',
    comparativeValue: 'HIGH',
    primarySource: 'TRULIA_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'policeResponseTime',
    name: 'Police Response Time',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'TAVILY',
    fallbackSources: [],
    scrapingMethod: 'WEB_SEARCH_PARSE',
    unit: 'minutes'
  }
];

// ============================================
// CATEGORY 13: MARKET & INVESTMENT DATA
// ============================================
export const marketInvestmentFields: FieldDefinition[] = [
  {
    id: 'viewsZillow',
    name: 'Views (Zillow)',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'ZILLOW_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'viewsRealtor',
    name: 'Views (Realtor.com)',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'REALTOR_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'viewsRedfin',
    name: 'Views (Redfin)',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'REDFIN_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'viewsHomes',
    name: 'Views (Homes.com)',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'HOMES_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'totalViews',
    name: 'Total Views',
    dataType: 'number',
    comparativeValue: 'CRITICAL',
    primarySource: 'CALCULATION',
    fallbackSources: [],
    scrapingMethod: 'CALCULATION',
    notes: 'Sum of 4 platform views'
  },
  {
    id: 'savesFavorites',
    name: 'Saves/Favorites Total',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'CALCULATION',
    fallbackSources: [],
    scrapingMethod: 'CALCULATION'
  },
  {
    id: 'comparativeSpeedMetric',
    name: 'Comparative Speed Metric',
    dataType: 'string',
    comparativeValue: 'HIGH',
    primarySource: 'ZILLOW_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE',
    notes: 'Sells faster than X%'
  },
  {
    id: 'marketType',
    name: 'Market Type',
    dataType: 'string',
    comparativeValue: 'CRITICAL',
    primarySource: 'REDFIN_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE',
    notes: 'Buyer/Seller/Balanced'
  },
  {
    id: 'avgSaleToListPercent',
    name: 'Avg Sale to List %',
    dataType: 'percentage',
    comparativeValue: 'CRITICAL',
    primarySource: 'REDFIN_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'avgDaysToPending',
    name: 'Avg Days to Pending',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'REDFIN_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'multipleOffersLikelihood',
    name: 'Multiple Offers Likelihood',
    dataType: 'string',
    comparativeValue: 'HIGH',
    primarySource: 'REDFIN_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'neighborhoodMedianPrice',
    name: 'Neighborhood Median Price',
    dataType: 'currency',
    comparativeValue: 'CRITICAL',
    primarySource: 'HOMES_WEBSEARCH',
    fallbackSources: ['REDFIN_WEBSEARCH', 'TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'percentAboveBelowMedian',
    name: '% Above/Below Median',
    dataType: 'percentage',
    comparativeValue: 'CRITICAL',
    primarySource: 'CALCULATION',
    fallbackSources: [],
    scrapingMethod: 'CALCULATION',
    notes: '(listPrice - neighborhoodMedianPrice) / neighborhoodMedianPrice'
  },
  {
    id: 'neighborhoodAvgDom',
    name: 'Neighborhood Avg DOM',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'HOMES_WEBSEARCH',
    fallbackSources: ['REDFIN_WEBSEARCH'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'zipCodeMedianPrice',
    name: 'Zip Code Median Price',
    dataType: 'currency',
    comparativeValue: 'MEDIUM',
    primarySource: 'TRULIA_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'lastSaleDate',
    name: 'Last Sale Date',
    dataType: 'date',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'lastSalePrice',
    name: 'Last Sale Price',
    dataType: 'currency',
    comparativeValue: 'CRITICAL',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'lastSalePricePerSqft',
    name: 'Last Sale Price/Sqft',
    dataType: 'currency',
    comparativeValue: 'HIGH',
    primarySource: 'CALCULATION',
    fallbackSources: [],
    scrapingMethod: 'CALCULATION'
  },
  {
    id: 'appreciationSinceLastSale',
    name: 'Appreciation Since Last Sale ($)',
    dataType: 'currency',
    comparativeValue: 'HIGH',
    primarySource: 'CALCULATION',
    fallbackSources: [],
    scrapingMethod: 'CALCULATION'
  },
  {
    id: 'appreciationSinceLastSalePercent',
    name: 'Appreciation Since Last Sale (%)',
    dataType: 'percentage',
    comparativeValue: 'CRITICAL',
    primarySource: 'CALCULATION',
    fallbackSources: [],
    scrapingMethod: 'CALCULATION'
  },
  {
    id: 'yearsSinceLastSale',
    name: 'Years Since Last Sale',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'CALCULATION',
    fallbackSources: [],
    scrapingMethod: 'CALCULATION'
  },
  {
    id: 'priceTrend',
    name: 'Price Trend',
    dataType: 'string',
    comparativeValue: 'HIGH',
    primarySource: 'HOMES_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE',
    notes: 'Up/Down/Stable'
  },
  {
    id: 'priceToRentRatio',
    name: 'Price to Rent Ratio',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'ZILLOW_WEBSEARCH',
    fallbackSources: ['CALCULATION'],
    scrapingMethod: 'WEB_SEARCH_PARSE',
    notes: 'Investment metric'
  },
  {
    id: 'rentZestimate',
    name: 'Rent Zestimate',
    dataType: 'currency',
    comparativeValue: 'HIGH',
    primarySource: 'ZILLOW_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  }
];

// ============================================
// CATEGORY 14: UTILITIES & CONNECTIVITY
// ============================================
export const utilitiesConnectivityFields: FieldDefinition[] = [
  {
    id: 'monthlyElectricEstimate',
    name: 'Monthly Electric Estimate',
    dataType: 'currency',
    comparativeValue: 'HIGH',
    primarySource: 'REDFIN_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'solarSavingsPotential',
    name: 'Solar Savings Potential',
    dataType: 'currency',
    comparativeValue: 'HIGH',
    primarySource: 'REDFIN_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'sunExposureJune',
    name: 'Sun Exposure (June)',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'REDFIN_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE',
    unit: 'hours'
  },
  {
    id: 'waterSewerType',
    name: 'Water/Sewer Type',
    dataType: 'string',
    comparativeValue: 'LOW',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Public/Well/Septic'
  },
  {
    id: 'gasService',
    name: 'Gas Service',
    dataType: 'boolean',
    comparativeValue: 'LOW',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'internetProvidersCount',
    name: 'Internet Providers Count',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'BROADBAND_API',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'maxInternetSpeed',
    name: 'Max Internet Speed',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'BROADBAND_API',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'DIRECT_API',
    unit: 'Mbps'
  },
  {
    id: 'estimatedTotalMonthlyUtilities',
    name: 'Est Total Monthly Utilities',
    dataType: 'currency',
    comparativeValue: 'HIGH',
    primarySource: 'CALCULATION',
    fallbackSources: [],
    scrapingMethod: 'CALCULATION'
  }
];

// ============================================
// CATEGORY 15: ENVIRONMENT & RISK
// ============================================
export const environmentRiskFields: FieldDefinition[] = [
  {
    id: 'floodFactor',
    name: 'Flood Factor',
    dataType: 'number',
    comparativeValue: 'CRITICAL',
    primarySource: 'FIRSTSTREET_API',
    fallbackSources: ['REDFIN_WEBSEARCH', 'TAVILY'],
    scrapingMethod: 'DIRECT_API',
    notes: '1-10 scale, FL priority'
  },
  {
    id: 'floodZone',
    name: 'Flood Zone',
    dataType: 'string',
    comparativeValue: 'CRITICAL',
    primarySource: 'FEMA_API',
    fallbackSources: ['STELLAR_MLS', 'TAVILY'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Insurance impact'
  },
  {
    id: 'fireFactor',
    name: 'Fire Factor',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'FIRSTSTREET_API',
    fallbackSources: ['REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: '1-10 scale'
  },
  {
    id: 'heatFactor',
    name: 'Heat Factor',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'FIRSTSTREET_API',
    fallbackSources: ['REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: '1-10 scale, FL climate'
  },
  {
    id: 'windFactor',
    name: 'Wind Factor',
    dataType: 'number',
    comparativeValue: 'CRITICAL',
    primarySource: 'FIRSTSTREET_API',
    fallbackSources: ['REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: '1-10 scale, hurricane risk'
  },
  {
    id: 'airQualityFactor',
    name: 'Air Quality Factor',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'FIRSTSTREET_API',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'hurricaneDamageHistory',
    name: 'Hurricane Damage History',
    dataType: 'string',
    comparativeValue: 'HIGH',
    primarySource: 'HOMES_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'elevationAboveSeaLevel',
    name: 'Elevation Above Sea Level',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'USGS_API',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'GEOCODE_LOOKUP',
    unit: 'feet'
  },
  {
    id: 'sinkholeRisk',
    name: 'Sinkhole Risk',
    dataType: 'string',
    comparativeValue: 'HIGH',
    primarySource: 'TAVILY',
    fallbackSources: [],
    scrapingMethod: 'WEB_SEARCH_PARSE',
    notes: 'FL-specific'
  }
];

// ============================================
// CATEGORY 16: ADDITIONAL FEATURES
// ============================================
export const additionalFeaturesFields: FieldDefinition[] = [
  {
    id: 'greenCertified',
    name: 'Green Certified',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'solarPanels',
    name: 'Solar Panels',
    dataType: 'boolean',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'solarOwned',
    name: 'Solar Owned vs Leased',
    dataType: 'string',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['REDFIN_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'generator',
    name: 'Generator',
    dataType: 'boolean',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'FL priority'
  },
  {
    id: 'viewTypes',
    name: 'View Types',
    dataType: 'array',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'comingSoon',
    name: 'Coming Soon',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'elevator',
    name: 'Elevator',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'securitySystem',
    name: 'Security System',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'gatedCommunity',
    name: 'Gated Community',
    dataType: 'boolean',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  }
];

// ============================================
// CATEGORY 17: PARKING & GARAGE
// ============================================
export const parkingGarageFields: FieldDefinition[] = [
  {
    id: 'garageSpaces',
    name: 'Garage Spaces',
    dataType: 'number',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'garageType',
    name: 'Garage Type',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Attached/Detached'
  },
  {
    id: 'parkingTotalSpaces',
    name: 'Parking Total Spaces',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'drivewayType',
    name: 'Driveway Type',
    dataType: 'string',
    comparativeValue: 'LOW',
    primarySource: 'STELLAR_MLS',
    fallbackSources: [],
    scrapingMethod: 'DIRECT_API',
    notes: 'Paved/Gravel'
  },
  {
    id: 'coveredParking',
    name: 'Covered Parking',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'rvParking',
    name: 'RV Parking',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'boatParking',
    name: 'Boat Parking',
    dataType: 'boolean',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'FL priority'
  },
  {
    id: 'storageUnits',
    name: 'Storage Units',
    dataType: 'number',
    comparativeValue: 'LOW',
    primarySource: 'STELLAR_MLS',
    fallbackSources: [],
    scrapingMethod: 'DIRECT_API'
  }
];

// ============================================
// CATEGORY 18: BUILDING INFO
// ============================================
export const buildingInfoFields: FieldDefinition[] = [
  {
    id: 'buildingName',
    name: 'Building Name',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'totalUnitsInBuilding',
    name: 'Total Units in Building',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'floorNumber',
    name: 'Floor Number',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'totalFloors',
    name: 'Total Floors',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'buildingAmenities',
    name: 'Building Amenities',
    dataType: 'array',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  }
];

// ============================================
// CATEGORY 19: LEGAL & TAX
// ============================================
export const legalTaxFields: FieldDefinition[] = [
  {
    id: 'legalDescription',
    name: 'Legal Description',
    dataType: 'string',
    comparativeValue: 'LOW',
    primarySource: 'COUNTY_RECORDS',
    fallbackSources: ['STELLAR_MLS'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'zoning',
    name: 'Zoning',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['COUNTY_RECORDS'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'ownershipType',
    name: 'Ownership Type',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['COUNTY_RECORDS'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Fee Simple/Condo/Co-op'
  },
  {
    id: 'titleStatus',
    name: 'Title Status',
    dataType: 'string',
    comparativeValue: 'HIGH',
    primarySource: 'COUNTY_RECORDS',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  }
];

// ============================================
// CATEGORY 20: WATERFRONT
// ============================================
export const waterfrontFields: FieldDefinition[] = [
  {
    id: 'waterfront',
    name: 'Waterfront',
    dataType: 'boolean',
    comparativeValue: 'CRITICAL',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'waterView',
    name: 'Water View',
    dataType: 'boolean',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'waterfrontFeet',
    name: 'Waterfront Feet',
    dataType: 'number',
    comparativeValue: 'CRITICAL',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    unit: 'feet'
  },
  {
    id: 'waterType',
    name: 'Water Type',
    dataType: 'string',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'Ocean/Bay/Canal/Lake/River'
  },
  {
    id: 'dock',
    name: 'Dock',
    dataType: 'boolean',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'seawall',
    name: 'Seawall',
    dataType: 'boolean',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'boatLift',
    name: 'Boat Lift',
    dataType: 'boolean',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'gulfAccess',
    name: 'Gulf Access',
    dataType: 'boolean',
    comparativeValue: 'CRITICAL',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'FL priority'
  }
];

// ============================================
// CATEGORY 21: LEASING & PETS
// ============================================
export const leasingPetsFields: FieldDefinition[] = [
  {
    id: 'rentalAllowed',
    name: 'Rental Allowed',
    dataType: 'boolean',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'minLeaseLength',
    name: 'Min Lease Length',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    unit: 'months'
  },
  {
    id: 'maxLeasesPerYear',
    name: 'Max Leases Per Year',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'petsAllowed',
    name: 'Pets Allowed',
    dataType: 'boolean',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'petRestrictions',
    name: 'Pet Restrictions',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'maxPets',
    name: 'Max Pets',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'petWeightLimit',
    name: 'Pet Weight Limit',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    unit: 'lbs'
  }
];

// ============================================
// CATEGORY 22: COMMUNITY & FEATURES
// ============================================
export const communityFeaturesFields: FieldDefinition[] = [
  {
    id: 'avgHouseholdIncome',
    name: 'Avg Household Income',
    dataType: 'currency',
    comparativeValue: 'HIGH',
    primarySource: 'CENSUS_API',
    fallbackSources: ['HOMES_WEBSEARCH', 'TAVILY'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'medianAge',
    name: 'Median Age',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'CENSUS_API',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'percentCollegeGrads',
    name: '% College Graduates',
    dataType: 'percentage',
    comparativeValue: 'MEDIUM',
    primarySource: 'CENSUS_API',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'percentRenters',
    name: '% Renters',
    dataType: 'percentage',
    comparativeValue: 'HIGH',
    primarySource: 'CENSUS_API',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'populationDensity',
    name: 'Population Density',
    dataType: 'number',
    comparativeValue: 'MEDIUM',
    primarySource: 'CENSUS_API',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'DIRECT_API',
    unit: 'per sq mi'
  },
  {
    id: 'dogFriendlyPercent',
    name: 'Dog Friendly %',
    dataType: 'percentage',
    comparativeValue: 'MEDIUM',
    primarySource: 'TRULIA_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'walkableRestaurantsPercent',
    name: 'Walkable Restaurants %',
    dataType: 'percentage',
    comparativeValue: 'MEDIUM',
    primarySource: 'TRULIA_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'wellLitStreetsPercent',
    name: 'Well-Lit Streets %',
    dataType: 'percentage',
    comparativeValue: 'MEDIUM',
    primarySource: 'TRULIA_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'quietPercent',
    name: 'Quiet %',
    dataType: 'percentage',
    comparativeValue: 'MEDIUM',
    primarySource: 'TRULIA_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'sidewalksPercent',
    name: 'Sidewalks %',
    dataType: 'percentage',
    comparativeValue: 'MEDIUM',
    primarySource: 'TRULIA_WEBSEARCH',
    fallbackSources: ['TAVILY'],
    scrapingMethod: 'WEB_SEARCH_PARSE'
  },
  {
    id: 'pool',
    name: 'Pool',
    dataType: 'boolean',
    comparativeValue: 'HIGH',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['ZILLOW_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'poolType',
    name: 'Pool Type',
    dataType: 'string',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'In-ground/Above'
  },
  {
    id: 'poolHeated',
    name: 'Pool Heated',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'poolScreen',
    name: 'Pool Screen',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API',
    notes: 'FL-specific'
  },
  {
    id: 'spa',
    name: 'Spa/Hot Tub',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'communityPool',
    name: 'Community Pool',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'communityGym',
    name: 'Community Gym',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'tennisCourtsCommunity',
    name: 'Tennis Courts',
    dataType: 'boolean',
    comparativeValue: 'LOW',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'golfCommunity',
    name: 'Golf Community',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  },
  {
    id: 'clubhouse',
    name: 'Clubhouse',
    dataType: 'boolean',
    comparativeValue: 'MEDIUM',
    primarySource: 'STELLAR_MLS',
    fallbackSources: ['HOMES_WEBSEARCH'],
    scrapingMethod: 'DIRECT_API'
  }
];

// ============================================
// COMPLETE CATEGORY DEFINITIONS
// ============================================
export const allCategories: CategoryDefinition[] = [
  {
    id: 'addressIdentity',
    name: 'Address & Identity',
    icon: '📍',
    fields: addressIdentityFields,
    displayOrder: 1
  },
  {
    id: 'pricingValue',
    name: 'Pricing & Value',
    icon: '💰',
    fields: pricingValueFields,
    displayOrder: 2
  },
  {
    id: 'propertyBasics',
    name: 'Property Basics',
    icon: '🏠',
    fields: propertyBasicsFields,
    displayOrder: 3
  },
  {
    id: 'hoaTaxes',
    name: 'HOA & Taxes',
    icon: '📋',
    fields: hoaTaxesFields,
    displayOrder: 4
  },
  {
    id: 'structureSystems',
    name: 'Structure & Systems',
    icon: '🔧',
    fields: structureSystemsFields,
    displayOrder: 5
  },
  {
    id: 'interiorFeatures',
    name: 'Interior Features',
    icon: '🛋️',
    fields: interiorFeaturesFields,
    displayOrder: 6
  },
  {
    id: 'exteriorFeatures',
    name: 'Exterior Features',
    icon: '🌳',
    fields: exteriorFeaturesFields,
    displayOrder: 7
  },
  {
    id: 'permitsRenovations',
    name: 'Permits & Renovations',
    icon: '🔨',
    fields: permitsRenovationsFields,
    displayOrder: 8
  },
  {
    id: 'assignedSchools',
    name: 'Assigned Schools',
    icon: '🎓',
    fields: assignedSchoolsFields,
    displayOrder: 9
  },
  {
    id: 'locationScores',
    name: 'Location Scores',
    icon: '📊',
    fields: locationScoresFields,
    displayOrder: 10
  },
  {
    id: 'distancesAmenities',
    name: 'Distances & Amenities',
    icon: '📏',
    fields: distancesAmenitiesFields,
    displayOrder: 11
  },
  {
    id: 'safetyCrime',
    name: 'Safety & Crime',
    icon: '🛡️',
    fields: safetyCrimeFields,
    displayOrder: 12
  },
  {
    id: 'marketInvestment',
    name: 'Market & Investment Data',
    icon: '📈',
    fields: marketInvestmentFields,
    displayOrder: 13
  },
  {
    id: 'utilitiesConnectivity',
    name: 'Utilities & Connectivity',
    icon: '⚡',
    fields: utilitiesConnectivityFields,
    displayOrder: 14
  },
  {
    id: 'environmentRisk',
    name: 'Environment & Risk',
    icon: '🌊',
    fields: environmentRiskFields,
    displayOrder: 15
  },
  {
    id: 'additionalFeatures',
    name: 'Additional Features',
    icon: '✨',
    fields: additionalFeaturesFields,
    displayOrder: 16
  },
  {
    id: 'parkingGarage',
    name: 'Parking & Garage',
    icon: '🚗',
    fields: parkingGarageFields,
    displayOrder: 17
  },
  {
    id: 'buildingInfo',
    name: 'Building Info',
    icon: '🏢',
    fields: buildingInfoFields,
    displayOrder: 18
  },
  {
    id: 'legalTax',
    name: 'Legal & Tax',
    icon: '⚖️',
    fields: legalTaxFields,
    displayOrder: 19
  },
  {
    id: 'waterfront',
    name: 'Waterfront',
    icon: '🚤',
    fields: waterfrontFields,
    displayOrder: 20
  },
  {
    id: 'leasingPets',
    name: 'Leasing & Pets',
    icon: '🐕',
    fields: leasingPetsFields,
    displayOrder: 21
  },
  {
    id: 'communityFeatures',
    name: 'Community & Features',
    icon: '🏊',
    fields: communityFeaturesFields,
    displayOrder: 22
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getAllFields(): FieldDefinition[] {
  return allCategories.flatMap(cat => cat.fields);
}

export function getFieldById(fieldId: string): FieldDefinition | undefined {
  return getAllFields().find(f => f.id === fieldId);
}

export function getCategoryById(categoryId: string): CategoryDefinition | undefined {
  return allCategories.find(c => c.id === categoryId);
}

export function getFieldsBySource(source: DataSource): FieldDefinition[] {
  return getAllFields().filter(f => f.primarySource === source);
}

export function getCriticalFields(): FieldDefinition[] {
  return getAllFields().filter(f => f.comparativeValue === 'CRITICAL');
}

export function getFieldCount(): number {
  return getAllFields().length;
}

// Export total count for verification
export const TOTAL_FIELD_COUNT = getAllFields().length;
