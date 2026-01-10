/**
 * TAVILY FIELD CONFIGURATION
 * Single source of truth for field-specific Tavily retrieval
 *
 * Each field has:
 * - Prioritized sources (try in order)
 * - Search query templates
 * - Extraction patterns (regex, JSON-LD paths, text markers)
 * - Expected success rate
 * - Confidence thresholds
 *
 * IMPORTANT: This file is ISOLATED from the main cascade
 * Changes here do NOT affect search.ts, retry-llm.ts, or cascade logic
 */

export interface TavilyFieldConfig {
  fieldId: number | string;  // Allow string for AVM subfields like '16a', '16b', etc.
  label: string;
  category: 'avm' | 'permits' | 'environment' | 'market' | 'utilities' | 'features' | 'performance';

  // Search configuration
  searchQueries: string[];  // {address}, {city}, {state}, {zip} will be replaced
  prioritySources: string[]; // Try in order

  // Extraction patterns
  extractionPatterns: {
    jsonLdPaths?: string[];      // Paths to search in JSON-LD schema
    regexPatterns?: RegExp[];    // Regex to match values
    textMarkers?: string[];      // Text labels to find nearby
  };

  // Metadata
  expectedSuccessRate: number;  // 0.0 to 1.0
  confidenceThreshold: 'low' | 'medium' | 'high';
  dataLevel: 'address' | 'zip' | 'city' | 'state' | 'national';

  // Special handling
  requiresFields?: number[];    // Other fields needed first
  calculationOnly?: boolean;    // Don't query Tavily, just calculate
  fallbackToLLM?: boolean;      // If Tavily fails, auto-trigger LLM cascade

  notes?: string;
}

/**
 * TAVILY FIELD CONFIGURATIONS
 * 55 fields organized by category
 * FIX ERROR #3: Allow both number and string keys for AVM subfields (16a-16f)
 */
export const TAVILY_FIELD_CONFIGS: Record<number | string, TavilyFieldConfig> = {

  // ======================
  // PROPERTY VALUE & AVMs
  // ======================

  12: {
    fieldId: 12,
    label: 'Market Value Estimate',
    category: 'avm',
    searchQueries: [
      'site:movoto.com "{address}"',
      'site:estately.com "{address}"',
      'site:homesnap.com "{address}"',
      'site:redfin.com "{address}"',
      'site:realtor.com "{address}"'
    ],
    prioritySources: ['movoto.com', 'estately.com', 'homesnap.com', 'redfin.com', 'realtor.com'],
    extractionPatterns: {
      jsonLdPaths: ['offers.price', 'price', 'priceRange'],
      regexPatterns: [/\$[\d,]+/g, /Estimated Value[:\s]*\$?([\d,]+)/i],
      textMarkers: ['Estimated Value', 'Home Value', 'Market Value', 'Redfin Estimate']
    },
    expectedSuccessRate: 0.90,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true
  },

  16: {
    fieldId: 16,
    label: 'AVMs (Average)',
    category: 'avm',
    searchQueries: [],
    prioritySources: [],
    extractionPatterns: {},
    expectedSuccessRate: 0.95,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    requiresFields: [16, 16, 16, 16, 16, 16], // 16a-16f
    calculationOnly: true,
    notes: 'Calculate average of Fields 16a-16f (require min 2 AVMs)'
  },

  '16a': {
    fieldId: 16,
    label: 'Zillow Zestimate',
    category: 'avm',
    searchQueries: [
      'site:homedisclosure.com "{address}" zestimate',
      'site:propertyshark.com "{address}" zillow',
      '"{address}" zestimate -site:zillow.com'
    ],
    prioritySources: ['homedisclosure.com', 'propertyshark.com'],
    extractionPatterns: {
      regexPatterns: [/Zestimate[:\s]*\$?([\d,]+)/i, /Zillow[:\s]*\$?([\d,]+)/i],
      textMarkers: ['Zestimate', 'Zillow Estimate']
    },
    expectedSuccessRate: 0.15,
    confidenceThreshold: 'low',
    dataLevel: 'address',
    notes: 'Zillow blocks direct access - very low success probability'
  },

  '16b': {
    fieldId: 16,
    label: 'Redfin Estimate',
    category: 'avm',
    searchQueries: [
      'site:redfin.com "{address}"',
      'site:homesnap.com "{address}" redfin'
    ],
    prioritySources: ['redfin.com', 'homesnap.com'],
    extractionPatterns: {
      jsonLdPaths: ['offers.price', 'price'],
      regexPatterns: [/Redfin Estimate[:\s]*\$?([\d,]+)/i],
      textMarkers: ['Redfin Estimate']
    },
    expectedSuccessRate: 0.85,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true
  },

  '16c': {
    fieldId: 16,
    label: 'First American AVM',
    category: 'avm',
    searchQueries: [
      'site:homedisclosure.com "{address}"',
      'site:propertyshark.com "{address}" "first american"',
      'site:attomdata.com "{address}"'
    ],
    prioritySources: ['homedisclosure.com', 'propertyshark.com', 'attomdata.com'],
    extractionPatterns: {
      regexPatterns: [/First American[:\s]*\$?([\d,]+)/i],
      textMarkers: ['First American', 'First American AVM']
    },
    expectedSuccessRate: 0.50,
    confidenceThreshold: 'medium',
    dataLevel: 'address',
    fallbackToLLM: true
  },

  '16d': {
    fieldId: 16,
    label: 'Quantarium AVM',
    category: 'avm',
    searchQueries: [
      'site:homedisclosure.com "{address}"',
      'site:propertyshark.com "{address}" quantarium',
      '"{address}" "quantarium" AVM'
    ],
    prioritySources: ['homedisclosure.com', 'propertyshark.com'],
    extractionPatterns: {
      regexPatterns: [/Quantarium[:\s]*\$?([\d,]+)/i],
      textMarkers: ['Quantarium', 'Quantarium AVM']
    },
    expectedSuccessRate: 0.50,
    confidenceThreshold: 'medium',
    dataLevel: 'address',
    fallbackToLLM: true
  },

  '16e': {
    fieldId: 16,
    label: 'ICE AVM',
    category: 'avm',
    searchQueries: [
      'site:homedisclosure.com "{address}" ICE',
      '"{address}" "ICE AVM" OR "Intercontinental Exchange"'
    ],
    prioritySources: ['homedisclosure.com'],
    extractionPatterns: {
      regexPatterns: [/ICE[:\s]*\$?([\d,]+)/i],
      textMarkers: ['ICE', 'ICE AVM', 'Intercontinental Exchange']
    },
    expectedSuccessRate: 0.10,
    confidenceThreshold: 'low',
    dataLevel: 'address',
    notes: 'ICE AVMs require paid subscription - rarely publicly available'
  },

  '16f': {
    fieldId: 16,
    label: 'Collateral Analytics AVM',
    category: 'avm',
    searchQueries: [
      'site:homedisclosure.com "{address}"',
      'site:propertyshark.com "{address}" "collateral analytics"',
      '"{address}" "collateral analytics" AVM'
    ],
    prioritySources: ['homedisclosure.com', 'propertyshark.com'],
    extractionPatterns: {
      regexPatterns: [/Collateral Analytics[:\s]*\$?([\d,]+)/i],
      textMarkers: ['Collateral Analytics', 'CA AVM']
    },
    expectedSuccessRate: 0.50,
    confidenceThreshold: 'medium',
    dataLevel: 'address',
    fallbackToLLM: true
  },

  // ======================
  // PROPERTY CONDITION & PERMITS
  // ======================

  40: {
    fieldId: 40,
    label: 'Roof Age (Est)',
    category: 'permits',
    searchQueries: [
      'site:buildzoom.com "{address}"',
      'site:permitsearch.com "{address}" roof',
      'site:homefacts.com "{address}"',
      '"{city} {state}" building permits open data roof "{address}"'
    ],
    prioritySources: ['buildzoom.com', 'permitsearch.com', 'homefacts.com'],
    extractionPatterns: {
      regexPatterns: [
        /roof|roofing|re-roof|shingle|roof replacement/i,
        /(\d{4})-(\d{2})-(\d{2})/,  // Date pattern YYYY-MM-DD
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/  // Date pattern MM/DD/YYYY
      ],
      textMarkers: ['roof', 'roofing', 'shingle', 'permit date']
    },
    expectedSuccessRate: 0.75,
    confidenceThreshold: 'medium',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Calculate age as 2026 - most recent roof permit year'
  },

  46: {
    fieldId: 46,
    label: 'HVAC Age',
    category: 'permits',
    searchQueries: [
      'site:buildzoom.com "{address}"',
      'site:permitsearch.com "{address}" HVAC OR furnace OR "air conditioning"',
      'site:homefacts.com "{address}"',
      '"{city} {state}" building permits open data HVAC "{address}"'
    ],
    prioritySources: ['buildzoom.com', 'permitsearch.com', 'homefacts.com'],
    extractionPatterns: {
      regexPatterns: [
        /HVAC|furnace|air conditioning|AC|heat pump|air handler|condenser/i,
        /(\d{4})-(\d{2})-(\d{2})/,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/
      ],
      textMarkers: ['HVAC', 'furnace', 'air conditioning', 'permit date']
    },
    expectedSuccessRate: 0.70,
    confidenceThreshold: 'medium',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Calculate age as 2026 - most recent HVAC permit year'
  },

  59: {
    fieldId: 59,
    label: 'Recent Renovations',
    category: 'permits',
    searchQueries: [
      'site:buildzoom.com "{address}"',
      'site:permitsearch.com "{address}"',
      '"{city} {state}" building permits open data "{address}"',
      'site:homefacts.com "{address}" permits'
    ],
    prioritySources: ['buildzoom.com', 'permitsearch.com', 'homefacts.com'],
    extractionPatterns: {
      regexPatterns: [
        /(202[1-6])/,  // Years 2021-2026
        /(\d{4})-(\d{2})-(\d{2})/,
        /electrical|plumbing|structural|roof|pool|remodel|addition|solar/i
      ],
      textMarkers: ['permit', 'renovation', 'remodel', 'construction']
    },
    expectedSuccessRate: 0.80,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Extract all permits from 2021-2026'
  },

  60: {
    fieldId: 60,
    label: 'Permit History - Roof',
    category: 'permits',
    searchQueries: [
      'site:buildzoom.com "{address}" roof',
      'site:permitsearch.com "{address}" roof',
      '"{city} {state}" building permits roof "{address}"'
    ],
    prioritySources: ['buildzoom.com', 'permitsearch.com'],
    extractionPatterns: {
      regexPatterns: [/roof|roofing|re-roof|shingle/i],
      textMarkers: ['roof', 'roofing', 'contractor', 'permit number']
    },
    expectedSuccessRate: 0.75,
    confidenceThreshold: 'medium',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'All roof permits regardless of date'
  },

  61: {
    fieldId: 61,
    label: 'Permit History - HVAC',
    category: 'permits',
    searchQueries: [
      'site:buildzoom.com "{address}" HVAC OR furnace OR AC',
      'site:permitsearch.com "{address}" HVAC',
      '"{city} {state}" building permits HVAC "{address}"'
    ],
    prioritySources: ['buildzoom.com', 'permitsearch.com'],
    extractionPatterns: {
      regexPatterns: [/HVAC|furnace|air conditioning|AC|heat pump|air handler/i],
      textMarkers: ['HVAC', 'furnace', 'contractor', 'permit number']
    },
    expectedSuccessRate: 0.75,
    confidenceThreshold: 'medium',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'All HVAC permits regardless of date'
  },

  62: {
    fieldId: 62,
    label: 'Permit History - Other',
    category: 'permits',
    searchQueries: [
      'site:buildzoom.com "{address}"',
      'site:permitsearch.com "{address}"',
      '"{city} {state}" building permits "{address}"'
    ],
    prioritySources: ['buildzoom.com', 'permitsearch.com'],
    extractionPatterns: {
      regexPatterns: [/electrical|plumbing|structural|pool|fence|deck|solar|garage/i],
      textMarkers: ['permit', 'electrical', 'plumbing', 'pool', 'solar']
    },
    expectedSuccessRate: 0.80,
    confidenceThreshold: 'medium',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'All non-roof, non-HVAC permits'
  },

  // ======================
  // ENVIRONMENT & WALKABILITY
  // ======================

  78: {
    fieldId: 78,
    label: 'Noise Level',
    category: 'environment',
    searchQueries: [
      'site:howloud.com "{address}"',
      'site:numbeo.com "{city}" pollution',
      'site:numbeo.com "{city}" noise index'
    ],
    prioritySources: ['howloud.com', 'numbeo.com'],
    extractionPatterns: {
      jsonLdPaths: ['soundscore', 'noiseLevel'],
      regexPatterns: [
        /Soundscore[:\s]*([\d]+)/i,
        /Noise[:\s]*([\d\.]+)/i,
        /(\d+)\/100/
      ],
      textMarkers: ['Soundscore', 'Noise Level', 'Traffic noise', 'Airport noise']
    },
    expectedSuccessRate: 0.85,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'HowLoud is address-specific (0-100, 100=quietest), Numbeo is city-level'
  },

  79: {
    fieldId: 79,
    label: 'Traffic Level',
    category: 'environment',
    searchQueries: [
      'site:numbeo.com "{city}" traffic',
      'site:numbeo.com "{city}, {state}" "traffic index"',
      'site:livingcost.org "{city}" traffic',
      'site:city-data.com "{city}" commute'
    ],
    prioritySources: ['numbeo.com', 'livingcost.org', 'city-data.com'],
    extractionPatterns: {
      regexPatterns: [
        /Traffic Index[:\s]*([\d\.]+)/i,
        /commute[:\s]*([\d]+)\s*min/i
      ],
      textMarkers: ['Traffic Index', 'commute time', 'traffic congestion']
    },
    expectedSuccessRate: 0.80,
    confidenceThreshold: 'medium',
    dataLevel: 'city',
    fallbackToLLM: true,
    notes: 'City-level data. Scale: 0-100 low, 100-150 moderate, 150-200 high, 200+ very high'
  },

  80: {
    fieldId: 80,
    label: 'Walkability Description',
    category: 'environment',
    searchQueries: [
      'site:walkscore.com "{address}"',
      'site:walkscore.com "{city}, {state}"',
      'site:redfin.com "{address}" walk score'
    ],
    prioritySources: ['walkscore.com', 'redfin.com'],
    extractionPatterns: {
      jsonLdPaths: ['walkScore', 'bikeScore'],
      regexPatterns: [
        /Walk Score[:\s]*([\d]+)/i,
        /Bike Score[:\s]*([\d]+)/i,
        /(\d+)\s*out of 100/i
      ],
      textMarkers: ['Walk Score', 'Bike Score', 'Walker\'s Paradise', 'Very Walkable']
    },
    expectedSuccessRate: 0.90,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Scale: 90-100 Walker\'s Paradise, 70-89 Very Walkable, 50-69 Somewhat Walkable, 25-49 Car-Dependent'
  },

  81: {
    fieldId: 81,
    label: 'Public Transit Access',
    category: 'environment',
    searchQueries: [
      'site:walkscore.com "{address}"',
      'site:walkscore.com "{city}, {state}" transit',
      'site:moovit.com "{city}"'
    ],
    prioritySources: ['walkscore.com', 'moovit.com'],
    extractionPatterns: {
      jsonLdPaths: ['transitScore'],
      regexPatterns: [
        /Transit Score[:\s]*([\d]+)/i,
        /(\d+)\s*out of 100/i
      ],
      textMarkers: ['Transit Score', 'Excellent Transit', 'Good Transit', 'bus', 'rail', 'metro']
    },
    expectedSuccessRate: 0.90,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Scale: 90-100 Excellent, 70-89 Excellent, 50-69 Good, 25-49 Some, 0-24 Minimal'
  },

  82: {
    fieldId: 82,
    label: 'Commute to City Center',
    category: 'environment',
    searchQueries: [
      'site:numbeo.com "{city}" "commute"',
      'site:walkscore.com "{address}" commute',
      'site:city-data.com "{city}" commute time'
    ],
    prioritySources: ['numbeo.com', 'walkscore.com', 'city-data.com'],
    extractionPatterns: {
      regexPatterns: [
        /commute[:\s]*([\d]+)\s*min/i,
        /([\d]+)\s*minutes/i
      ],
      textMarkers: ['commute', 'minutes', 'city center', 'downtown']
    },
    expectedSuccessRate: 0.75,
    confidenceThreshold: 'medium',
    dataLevel: 'city',
    fallbackToLLM: true,
    notes: 'City-level average. For precise commute, use Google Maps API'
  },

  // ======================
  // MARKET DATA
  // ======================

  91: {
    fieldId: 91,
    label: 'Median Home Price (Neighborhood)',
    category: 'market',
    searchQueries: [
      'site:realtor.com/realestateandhomes-search/{zip}',
      'site:redfin.com/zipcode/{zip}',
      'site:redfin.com "{city}" "median sale price"',
      'site:city-data.com "{zip}"',
      'site:neighborhoodscout.com "{zip}"'
    ],
    prioritySources: ['realtor.com', 'redfin.com', 'city-data.com', 'neighborhoodscout.com'],
    extractionPatterns: {
      jsonLdPaths: ['price', 'medianPrice', 'median'],
      regexPatterns: [
        /Median.*?Price[:\s]*\$?([\d,]+)/i,
        /Median Home Price[:\s]*\$?([\d,]+)/i
      ],
      textMarkers: ['Median Sale Price', 'Median Home Price', 'Median List Price']
    },
    expectedSuccessRate: 0.85,
    confidenceThreshold: 'high',
    dataLevel: 'zip',
    fallbackToLLM: true
  },

  92: {
    fieldId: 92,
    label: 'Price Per Sq Ft (Recent Avg)',
    category: 'market',
    searchQueries: [
      'site:redfin.com "{zip}" "price per sq ft"',
      'site:redfin.com/zipcode/{zip}',
      'site:movoto.com "{city}" "price per square foot"',
      'site:realtor.com "{zip}" market'
    ],
    prioritySources: ['redfin.com', 'movoto.com', 'realtor.com'],
    extractionPatterns: {
      jsonLdPaths: ['pricePerSquareFoot', 'pricePerSqft'],
      regexPatterns: [
        /\$?([\d,]+)\/sq\s*ft/i,
        /\$?([\d,]+)\s*per\s*sq/i,
        /Price\/Sq\s*Ft[:\s]*\$?([\d,]+)/i
      ],
      textMarkers: ['Price/Sq Ft', '$/sqft', 'per square foot']
    },
    expectedSuccessRate: 0.90,
    confidenceThreshold: 'high',
    dataLevel: 'zip',
    fallbackToLLM: true
  },

  93: {
    fieldId: 93,
    label: 'Price to Rent Ratio',
    category: 'market',
    searchQueries: [
      'site:numbeo.com "{city}" "price to rent ratio"',
      'site:numbeo.com "{city}, {state}" property',
      'site:livingcost.org "{city}" rent',
      'site:city-data.com "{city}" housing'
    ],
    prioritySources: ['numbeo.com', 'livingcost.org', 'city-data.com'],
    extractionPatterns: {
      regexPatterns: [
        /Price to Rent Ratio[:\s]*([\d\.]+)/i,
        /Price\/Rent[:\s]*([\d\.]+)/i
      ],
      textMarkers: ['Price to Rent Ratio', 'Price/Rent']
    },
    expectedSuccessRate: 0.80,
    confidenceThreshold: 'medium',
    dataLevel: 'city',
    requiresFields: [91, 98],
    notes: 'Can calculate: Field 91 ÷ (Field 98 × 12)'
  },

  94: {
    fieldId: 94,
    label: 'Price vs Median %',
    category: 'market',
    searchQueries: [],
    prioritySources: [],
    extractionPatterns: {},
    expectedSuccessRate: 0.95,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    requiresFields: [12, 91],
    calculationOnly: true,
    notes: 'Calculate: (Field 12 ÷ Field 91) × 100'
  },

  95: {
    fieldId: 95,
    label: 'Days on Market (Avg)',
    category: 'market',
    searchQueries: [
      'site:redfin.com/zipcode/{zip}',
      'site:redfin.com "{city}" "days on market"',
      'site:altosresearch.com "{zip}"',
      'site:homelight.com "{city}" "days on market"',
      'site:rockethomes.com "{city}"'
    ],
    prioritySources: ['redfin.com', 'altosresearch.com', 'homelight.com', 'rockethomes.com'],
    extractionPatterns: {
      jsonLdPaths: ['daysOnMarket', 'dom'],
      regexPatterns: [
        /Days on Market[:\s]*([\d]+)/i,
        /DOM[:\s]*([\d]+)/i,
        /Median DOM[:\s]*([\d]+)/i
      ],
      textMarkers: ['Days on Market', 'DOM', 'Median DOM']
    },
    expectedSuccessRate: 0.75,
    confidenceThreshold: 'medium',
    dataLevel: 'zip',
    fallbackToLLM: true
  },

  96: {
    fieldId: 96,
    label: 'Inventory Surplus',
    category: 'market',
    searchQueries: [
      'site:altosresearch.com "{zip}"',
      'site:redfin.com "{city}" inventory',
      'site:realtor.com "{city}" "market trends" inventory',
      'site:rockethomes.com "{city}" inventory'
    ],
    prioritySources: ['altosresearch.com', 'redfin.com', 'realtor.com', 'rockethomes.com'],
    extractionPatterns: {
      regexPatterns: [
        /Months of Supply[:\s]*([\d\.]+)/i,
        /([\d\.]+)\s*months?\s*supply/i,
        /inventory[:\s]*([\d,]+)/i
      ],
      textMarkers: ['Months of Supply', 'inventory', 'active listings']
    },
    expectedSuccessRate: 0.75,
    confidenceThreshold: 'medium',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: '<4 months=Seller\'s market, 4-6=Balanced, >6=Buyer\'s market'
  },

  97: {
    fieldId: 97,
    label: 'Insurance Estimate (Annual)',
    category: 'market',
    searchQueries: [
      'site:policygenius.com "{city}" homeowners insurance',
      'site:valuepenguin.com "{city}" home insurance',
      'site:smartfinancial.com "{state}" home insurance average',
      '"{state}" average homeowners insurance cost 2025 2026',
      'average home insurance cost {zip}',
      '{zip} flood zone insurance cost',
      '"{city}" {state} homeowners insurance rates 2026'
    ],
    prioritySources: ['policygenius.com', 'valuepenguin.com', 'smartfinancial.com'],
    extractionPatterns: {
      regexPatterns: [
        /\$?([\d,]+)\s*\/?\s*year/i,
        /annual.*?\$?([\d,]+)/i,
        /average.*?\$?([\d,]+)/i,
        /flood.*?\$?([\d,]+)/i
      ],
      textMarkers: ['annual premium', 'average cost', 'homeowners insurance', 'flood zone', 'flood insurance']
    },
    expectedSuccessRate: 0.80,
    confidenceThreshold: 'medium',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'Zip-level granularity for flood zone accuracy (critical for Florida coastal properties)'
  },

  98: {
    fieldId: 98,
    label: 'Rental Estimate (Monthly)',
    category: 'market',
    searchQueries: [
      'site:zillow.com "{address}" rent zestimate',
      'site:redfin.com "{address}" rental estimate',
      'site:zumper.com/rent-research/{city}-{state}',
      'site:zumper.com "{zip}" rent',
      'site:apartments.com "{city}" rent prices',
      'site:rentcafe.com "{city}" rent',
      '"{zip}" rent median 2025 2026',
      '"{city}" {state} average rent prices'
    ],
    prioritySources: ['zillow.com', 'redfin.com', 'zumper.com', 'apartments.com', 'rentcafe.com'],
    extractionPatterns: {
      regexPatterns: [
        /rent\s*zestimate.*?\$?([\d,]+)/i,
        /rental\s*estimate.*?\$?([\d,]+)/i,
        /\$?([\d,]+)\s*\/?\s*mo/i,
        /\$?([\d,]+)\s*per\s*month/i,
        /(\d)BR.*?\$?([\d,]+)/i,
        /Median.*?\$?([\d,]+)/i,
        /\$?([\d,]+)\s*-\s*\$?([\d,]+)\s*\/mo/i
      ],
      textMarkers: ['rent zestimate', 'rental estimate', 'median rent', '1BR', '2BR', '3BR', '4BR', 'per month', 'monthly rent']
    },
    expectedSuccessRate: 0.90,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Property-specific estimates (Zillow, Redfin) prioritized over zip/city averages. AVOID rentometer.com (Cloudflare blocking)'
  },

  99: {
    fieldId: 99,
    label: 'Rental Yield (Est)',
    category: 'market',
    searchQueries: [],
    prioritySources: [],
    extractionPatterns: {
      regexPatterns: [],
      textMarkers: []
    },
    expectedSuccessRate: 1.0,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    calculationOnly: true,
    requiresFields: [10, 98],
    fallbackToLLM: false,
    notes: 'CALCULATION ONLY: (Field 98 monthly rent × 12 ÷ Field 10 listing price) × 100. Property-specific yield more accurate than city averages. Calculated in field-calculations.ts and calculate-derived-fields.ts. Good yields: 5-8% (strong), 3-5% (moderate), <3% (weak).'
  },

  100: {
    fieldId: 100,
    label: 'Vacancy Rate (Neighborhood)',
    category: 'market',
    searchQueries: [
      'site:realtor.com "{city}" {state} market trends vacancy 2025',
      'site:redfin.com "{city}" housing supply vacancy rate',
      'site:neighborhoodscout.com "{zip}" vacancy rate',
      'site:city-data.com "{zip}" rental vacancy',
      '"{zip}" housing vacancy rate 2024 2025',
      '"{city}" {state} rental vacancy rate 2025',
      'site:census.gov "{zip}" housing vacancy',
      'site:data.census.gov "{zip}" vacant housing units'
    ],
    prioritySources: ['realtor.com', 'redfin.com', 'neighborhoodscout.com', 'city-data.com', 'census.gov'],
    extractionPatterns: {
      regexPatterns: [
        /vacancy[:\s]*([\d\.]+)%/i,
        /([\d\.]+)%\s*vacancy/i,
        /rental\s*vacancy.*?([\d\.]+)%/i,
        /homeowner\s*vacancy.*?([\d\.]+)%/i,
        /housing\s*vacancy.*?([\d\.]+)%/i,
        /vacant.*?([\d\.]+)%/i
      ],
      textMarkers: ['vacancy rate', 'rental vacancy', 'housing vacancy', 'homeowner vacancy', 'vacant units', 'vacancy percent']
    },
    expectedSuccessRate: 0.85,
    confidenceThreshold: 'medium',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'Prioritizes current market data (Realtor.com, Redfin) over outdated census. Census.gov as last fallback (data can be 1-5 years old). Rental vacancy more relevant than homeowner vacancy for investors.'
  },

  101: {
    fieldId: 101,
    label: 'Cap Rate (Est)',
    category: 'market',
    searchQueries: [],
    prioritySources: [],
    extractionPatterns: {},
    expectedSuccessRate: 0.90,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    requiresFields: [12, 98, 35],
    calculationOnly: true,
    notes: 'Calculate: ((Field 98 × 12) × 0.6) ÷ Field 12 × 100. Factor 0.6 = ~40% expense ratio'
  },

  102: {
    fieldId: 102,
    label: 'Financing Terms',
    category: 'market',
    searchQueries: [
      'site:bankrate.com mortgage rates',
      'site:nerdwallet.com mortgage rates today',
      'site:freddiemac.com PMMS',
      'site:mortgagenewsdaily.com rates'
    ],
    prioritySources: ['bankrate.com', 'nerdwallet.com', 'freddiemac.com', 'mortgagenewsdaily.com'],
    extractionPatterns: {
      regexPatterns: [
        /30.*?year.*?([\d\.]+)%/i,
        /15.*?year.*?([\d\.]+)%/i,
        /FHA.*?([\d\.]+)%/i,
        /VA.*?([\d\.]+)%/i
      ],
      textMarkers: ['30-year fixed', '15-year fixed', 'FHA', 'VA', 'mortgage rates']
    },
    expectedSuccessRate: 0.95,
    confidenceThreshold: 'high',
    dataLevel: 'national',
    fallbackToLLM: true,
    notes: 'National average rates - not location-specific'
  },

  103: {
    fieldId: 103,
    label: 'Comparable Sales',
    category: 'market',
    searchQueries: [
      'site:movoto.com "{address}" sold',
      'site:movoto.com "{address}" comparables',
      'site:estately.com "{address}" "sold homes"',
      'site:redfin.com "{address}" "similar homes" sold',
      'site:homedisclosure.com "{address}"'
    ],
    prioritySources: ['movoto.com', 'estately.com', 'redfin.com', 'homedisclosure.com'],
    extractionPatterns: {
      jsonLdPaths: ['offers', 'soldPrice', 'salePrice'],
      regexPatterns: [
        /Sold[:\s]*\$?([\d,]+)/i,
        /Sale Price[:\s]*\$?([\d,]+)/i,
        /(\d+)\s*bd/i,  // bedrooms
        /(\d+\.?\d*)\s*ba/i,  // bathrooms
        /([\d,]+)\s*sq\s*ft/i
      ],
      textMarkers: ['Comparable Sales', 'Similar Homes Sold', 'sold', 'sale price']
    },
    expectedSuccessRate: 0.85,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Extract up to 5 comps within last 6 months'
  },

  // ======================
  // UTILITIES & CONNECTIVITY
  // ======================

  104: {
    fieldId: 104,
    label: 'Electric Provider',
    category: 'utilities',
    searchQueries: [
      'site:inmyarea.com "{zip}" electric',
      'site:electricrate.com "{zip}"',
      'site:openinframap.org "{city}"',
      '"{city}, {state}" electric utility company'
    ],
    prioritySources: ['inmyarea.com', 'electricrate.com', 'openinframap.org'],
    extractionPatterns: {
      regexPatterns: [
        /Electric[:\s]*([A-Z][^\n]+)/i,
        /Provider[:\s]*([A-Z][^\n]+)/i
      ],
      textMarkers: ['Electric Provider', 'utility company', 'power company']
    },
    expectedSuccessRate: 0.95,
    confidenceThreshold: 'high',
    dataLevel: 'zip',
    fallbackToLLM: true
  },

  105: {
    fieldId: 105,
    label: 'Avg Electric Bill',
    category: 'utilities',
    searchQueries: [
      'site:numbeo.com "{city}" utilities',
      'site:numbeo.com "{city}, {state}" "cost of living"',
      'site:eia.gov "{state}" electricity price',
      'site:inmyarea.com "{zip}" electric cost'
    ],
    prioritySources: ['numbeo.com', 'eia.gov', 'inmyarea.com'],
    extractionPatterns: {
      regexPatterns: [
        /\$?([\d,]+)\s*\/?\s*mo/i,
        /electric.*?\$?([\d,]+)/i
      ],
      textMarkers: ['monthly', 'electric', 'electricity', 'utilities']
    },
    expectedSuccessRate: 0.80,
    confidenceThreshold: 'medium',
    dataLevel: 'city',
    fallbackToLLM: true,
    notes: 'Numbeo basis: 85m² apartment'
  },

  106: {
    fieldId: 106,
    label: 'Water Provider',
    category: 'utilities',
    searchQueries: [
      'site:inmyarea.com "{zip}" water utility',
      '"{city}, {state}" water department',
      '"{city}" municipal water utility'
    ],
    prioritySources: ['inmyarea.com'],
    extractionPatterns: {
      regexPatterns: [
        /Water[:\s]*([A-Z][^\n]+)/i,
        /Provider[:\s]*([A-Z][^\n]+)/i
      ],
      textMarkers: ['Water Provider', 'water utility', 'water department']
    },
    expectedSuccessRate: 0.85,
    confidenceThreshold: 'medium',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'Municipal water often not in aggregators - may need city website'
  },

  107: {
    fieldId: 107,
    label: 'Avg Water Bill',
    category: 'utilities',
    searchQueries: [
      'site:numbeo.com "{city}" utilities water',
      'site:valuepenguin.com "{state}" water bill',
      '"{city}" water rates residential'
    ],
    prioritySources: ['numbeo.com', 'valuepenguin.com'],
    extractionPatterns: {
      regexPatterns: [
        /\$?([\d,]+)\s*\/?\s*mo/i,
        /water.*?\$?([\d,]+)/i
      ],
      textMarkers: ['monthly', 'water', 'water bill']
    },
    expectedSuccessRate: 0.75,
    confidenceThreshold: 'medium',
    dataLevel: 'city',
    fallbackToLLM: true
  },

  108: {
    fieldId: 108,
    label: 'Sewer Provider',
    category: 'utilities',
    searchQueries: [
      'site:inmyarea.com "{zip}" sewer',
      '"{city}, {state}" sewer utility',
      '"{city}" wastewater department'
    ],
    prioritySources: ['inmyarea.com'],
    extractionPatterns: {
      regexPatterns: [
        /Sewer[:\s]*([A-Z][^\n]+)/i,
        /Wastewater[:\s]*([A-Z][^\n]+)/i
      ],
      textMarkers: ['Sewer Provider', 'wastewater', 'septic']
    },
    expectedSuccessRate: 0.80,
    confidenceThreshold: 'medium',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'May be septic system instead of municipal sewer'
  },

  109: {
    fieldId: 109,
    label: 'Natural Gas',
    category: 'utilities',
    searchQueries: [
      'site:inmyarea.com "{zip}" natural gas',
      'site:openinframap.org "{city}" gas',
      '"{city}, {state}" gas utility company'
    ],
    prioritySources: ['inmyarea.com', 'openinframap.org'],
    extractionPatterns: {
      regexPatterns: [
        /Gas[:\s]*([A-Z][^\n]+)/i,
        /Natural Gas[:\s]*([A-Z][^\n]+)/i
      ],
      textMarkers: ['Natural Gas', 'gas provider', 'gas utility']
    },
    expectedSuccessRate: 0.90,
    confidenceThreshold: 'high',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'Some areas all-electric with no gas infrastructure'
  },

  110: {
    fieldId: 110,
    label: 'Trash Provider',
    category: 'utilities',
    searchQueries: [
      'site:inmyarea.com "{zip}" trash',
      '"{city}, {state}" waste management garbage collection',
      '"{city}" sanitation department'
    ],
    prioritySources: ['inmyarea.com'],
    extractionPatterns: {
      regexPatterns: [
        /Trash[:\s]*([A-Z][^\n]+)/i,
        /Waste[:\s]*([A-Z][^\n]+)/i
      ],
      textMarkers: ['Trash Provider', 'waste management', 'garbage', 'sanitation']
    },
    expectedSuccessRate: 0.75,
    confidenceThreshold: 'medium',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'May be municipal (included in taxes) or private hauler'
  },

  111: {
    fieldId: 111,
    label: 'Internet Providers (Top 3)',
    category: 'utilities',
    searchQueries: [
      'site:broadbandmap.fcc.gov "{zip}"',
      'site:broadbandnow.com "{zip}"',
      'site:highspeedinternet.com "{zip}"',
      'site:inmyarea.com "{zip}" internet'
    ],
    prioritySources: ['broadbandmap.fcc.gov', 'broadbandnow.com', 'highspeedinternet.com'],
    extractionPatterns: {
      regexPatterns: [
        /([\d,]+)\s*Mbps/i,
        /Fiber|Cable|DSL|Fixed Wireless|Satellite/i
      ],
      textMarkers: ['provider', 'Fiber', 'Cable', 'DSL', 'Mbps', 'internet']
    },
    expectedSuccessRate: 0.98,
    confidenceThreshold: 'high',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'FCC Broadband Map is most authoritative'
  },

  112: {
    fieldId: 112,
    label: 'Max Internet Speed',
    category: 'utilities',
    searchQueries: [
      'site:broadbandmap.fcc.gov "{zip}"',
      'site:broadbandnow.com "{zip}" fastest',
      'site:speedtest.net/performance "{city}"',
      'site:highspeedinternet.com "{zip}"'
    ],
    prioritySources: ['broadbandmap.fcc.gov', 'broadbandnow.com', 'speedtest.net'],
    extractionPatterns: {
      regexPatterns: [
        /([\d,]+)\s*Mbps/i,
        /(\d+)\s*Gbps/i
      ],
      textMarkers: ['max speed', 'fastest', 'Mbps', 'Gbps']
    },
    expectedSuccessRate: 0.92,
    confidenceThreshold: 'high',
    dataLevel: 'zip',
    fallbackToLLM: true
  },

  113: {
    fieldId: 113,
    label: 'Fiber Available',
    category: 'utilities',
    searchQueries: [
      'site:broadbandmap.fcc.gov "{zip}" fiber',
      'site:broadbandnow.com "{zip}" fiber',
      'site:openinframap.org "{city}" fiber',
      'site:highspeedinternet.com "{zip}" fiber'
    ],
    prioritySources: ['broadbandmap.fcc.gov', 'broadbandnow.com', 'openinframap.org'],
    extractionPatterns: {
      regexPatterns: [
        /Fiber|FTTH/i,
        /Yes|No|Available|Not Available/i
      ],
      textMarkers: ['Fiber', 'FTTH', 'fiber optic', 'available']
    },
    expectedSuccessRate: 0.98,
    confidenceThreshold: 'high',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'FTTH = Fiber to the Home'
  },

  114: {
    fieldId: 114,
    label: 'Cable TV Provider',
    category: 'utilities',
    searchQueries: [
      'site:highspeedinternet.com "{zip}" cable TV',
      'site:inmyarea.com "{zip}" cable',
      '"{city}, {state}" cable television provider'
    ],
    prioritySources: ['highspeedinternet.com', 'inmyarea.com'],
    extractionPatterns: {
      regexPatterns: [
        /Cable.*?([A-Z][^\n]+)/i
      ],
      textMarkers: ['Cable TV', 'cable provider', 'television']
    },
    expectedSuccessRate: 0.70,
    confidenceThreshold: 'medium',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'Cable TV declining - may only have streaming'
  },

  115: {
    fieldId: 115,
    label: 'Cell Coverage Quality',
    category: 'utilities',
    searchQueries: [
      'site:cellmapper.net "{zip}"',
      'site:cellmapper.net "{city}, {state}"',
      'site:opensignal.com "{city}"',
      'site:nperf.com "{city}" coverage',
      'site:coveragecritic.com "{zip}"',
      'site:rootmetrics.com "{city}" coverage',
      '"{city}" {state} Verizon coverage map',
      '"{city}" {state} AT&T coverage map',
      '"{zip}" cell tower locations'
    ],
    prioritySources: ['cellmapper.net', 'opensignal.com', 'nperf.com', 'rootmetrics.com'],
    extractionPatterns: {
      regexPatterns: [
        /Verizon|AT&T|T-Mobile|Sprint/i,
        /Excellent|Good|Fair|Poor/i,
        /5G|LTE|4G/i,
        /([\d\.]+)\s*Mbps/i,
        /([\d]+)%\s*coverage/i,
        /([\d]+)\s*bars/i,
        /([\d]+)\s*towers?/i
      ],
      textMarkers: ['Verizon', 'AT&T', 'T-Mobile', 'coverage', '5G', 'LTE', 'signal strength', 'Mbps', 'download speed', 'tower', 'bars']
    },
    expectedSuccessRate: 0.85,
    confidenceThreshold: 'medium',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'CellMapper is crowdsourced; RootMetrics provides professional carrier testing data; carrier-specific maps for detailed coverage'
  },

  116: {
    fieldId: 116,
    label: 'Emergency Services Distance',
    category: 'utilities',
    searchQueries: [
      'site:city-data.com "{zip}" "fire station"',
      '"{city}, {state}" fire station locations',
      '"{city}, {state}" hospital locations',
      '"{zip}" emergency services'
    ],
    prioritySources: ['city-data.com'],
    extractionPatterns: {
      regexPatterns: [
        /([\d\.]+)\s*mi/i,
        /fire|hospital|police/i
      ],
      textMarkers: ['fire station', 'hospital', 'police', 'distance', 'miles']
    },
    expectedSuccessRate: 0.40,
    confidenceThreshold: 'low',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'Difficult to scrape reliably - recommend mapping API for precision'
  },

  // ======================
  // PROPERTY FEATURES
  // ======================

  131: {
    fieldId: 131,
    label: 'View Type',
    category: 'features',
    searchQueries: [
      'site:movoto.com "{address}"',
      'site:estately.com "{address}"',
      'site:homes.com "{address}"',
      'site:realtor.com "{address}"'
    ],
    prioritySources: ['movoto.com', 'estately.com', 'homes.com', 'realtor.com'],
    extractionPatterns: {
      regexPatterns: [
        /water view|ocean view|lake view|bay view|river view|mountain view|city view|skyline view|golf course view|park view|garden view/i
      ],
      textMarkers: ['view', 'water', 'ocean', 'mountain', 'city', 'golf course']
    },
    expectedSuccessRate: 0.40,
    confidenceThreshold: 'medium',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'LISTING-DEPENDENT - only extract explicit mentions, do NOT infer from photos'
  },

  132: {
    fieldId: 132,
    label: 'Lot Features',
    category: 'features',
    searchQueries: [
      'site:movoto.com "{address}"',
      'site:estately.com "{address}"',
      'site:realtor.com "{address}"',
      'site:homes.com "{address}"'
    ],
    prioritySources: ['movoto.com', 'estately.com', 'realtor.com', 'homes.com'],
    extractionPatterns: {
      regexPatterns: [
        /corner lot|cul-de-sac|fenced yard|pool|landscaped|mature trees|flat lot|sloped lot|waterfront|acreage|oversized lot|pie-shaped lot/i,
        /([\d\.]+)\s*acre/i,
        /([\d,]+)\s*sq\s*ft\s*lot/i
      ],
      textMarkers: ['lot', 'corner', 'cul-de-sac', 'fenced', 'pool', 'landscaped', 'waterfront']
    },
    expectedSuccessRate: 0.50,
    confidenceThreshold: 'medium',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'LISTING-DEPENDENT - only extract explicit mentions'
  },

  133: {
    fieldId: 133,
    label: 'EV Charging',
    category: 'features',
    searchQueries: [
      'site:plugshare.com "{city}, {state}"',
      'site:plugshare.com "{zip}"',
      'site:chargehub.com "{city}"',
      'site:openchargemap.org "{city}"'
    ],
    prioritySources: ['plugshare.com', 'chargehub.com', 'openchargemap.org'],
    extractionPatterns: {
      regexPatterns: [
        /Level 2|DC Fast|Tesla Supercharger/i,
        /ChargePoint|Electrify America|EVgo|Tesla/i,
        /([\d\.]+)\s*mi/i
      ],
      textMarkers: ['charging station', 'Level 2', 'DC Fast', 'Tesla', 'ChargePoint']
    },
    expectedSuccessRate: 0.90,
    confidenceThreshold: 'high',
    dataLevel: 'city',
    fallbackToLLM: true,
    notes: 'PlugShare is THE authoritative EV charging database'
  },

  134: {
    fieldId: 134,
    label: 'Smart Home Features',
    category: 'features',
    searchQueries: [
      'site:movoto.com "{address}"',
      'site:realtor.com "{address}"',
      'site:estately.com "{address}"'
    ],
    prioritySources: ['movoto.com', 'realtor.com', 'estately.com'],
    extractionPatterns: {
      regexPatterns: [
        /smart thermostat|Nest|Ecobee|smart locks|Ring doorbell|smart lighting|home automation|Alexa|Google Home|smart blinds|security system|smart sprinklers/i
      ],
      textMarkers: ['smart', 'Nest', 'Ring', 'Alexa', 'Google Home', 'automation']
    },
    expectedSuccessRate: 0.25,
    confidenceThreshold: 'low',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'LISTING-DEPENDENT - smart features rarely listed, expect low success'
  },

  135: {
    fieldId: 135,
    label: 'Accessibility Modifications',
    category: 'features',
    searchQueries: [
      'site:apartments.com "{address}"',
      'site:rent.com "{address}"',
      'site:realtor.com "{address}" accessible',
      'site:movoto.com "{address}"'
    ],
    prioritySources: ['apartments.com', 'rent.com', 'realtor.com'],
    extractionPatterns: {
      regexPatterns: [
        /wheelchair accessible|ADA compliant|single-story|no stairs|grab bars|roll-in shower|wide doorways|ramp|elevator access|handicap accessible|first-floor master/i
      ],
      textMarkers: ['wheelchair', 'ADA', 'accessible', 'grab bars', 'ramp', 'elevator']
    },
    expectedSuccessRate: 0.30,
    confidenceThreshold: 'medium',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'LISTING-DEPENDENT - rentals more likely to list accessibility features'
  },

  136: {
    fieldId: 136,
    label: 'Pet Policy',
    category: 'features',
    searchQueries: [
      'site:apartments.com "{address}"',
      'site:zumper.com "{address}"',
      'site:rent.com "{address}"',
      'site:zillow.com/rental "{address}"'
    ],
    prioritySources: ['apartments.com', 'zumper.com', 'rent.com'],
    extractionPatterns: {
      regexPatterns: [
        /pets allowed|dogs allowed|cats allowed|no pets|pet deposit|pet rent/i,
        /\$?([\d,]+)\s*pet deposit/i,
        /\$?([\d,]+)\/mo.*?pet/i
      ],
      textMarkers: ['pets', 'dogs', 'cats', 'pet policy', 'pet deposit', 'pet rent']
    },
    expectedSuccessRate: 0.90,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'RENTAL-SPECIFIC - for sale properties return "N/A - property is for sale"'
  },

  137: {
    fieldId: 137,
    label: 'Age Restrictions',
    category: 'features',
    searchQueries: [
      'site:55places.com "{community}"',
      'site:55places.com "{zip}"',
      'site:realtor.com "{address}" "55+"',
      'site:realtor.com "{community}" age restricted',
      '"{community}" HOA age restriction'
    ],
    prioritySources: ['55places.com', 'realtor.com'],
    extractionPatterns: {
      regexPatterns: [
        /55\+|62\+|age restricted|age restriction/i,
        /at least one resident.*?(\d+)/i
      ],
      textMarkers: ['55+', '62+', 'age restricted', 'senior community']
    },
    expectedSuccessRate: 0.80,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: '55Places.com is THE specialist for age-restricted communities'
  },

  138: {
    fieldId: 138,
    label: 'Special Assessments',
    category: 'features',
    searchQueries: [
      'site:hoadata.org "{community}"',
      'site:hoadata.org "{zip}"',
      'site:propertyshark.com "{address}" assessment',
      '"{community}" HOA special assessment'
    ],
    prioritySources: ['hoadata.org', 'propertyshark.com'],
    extractionPatterns: {
      regexPatterns: [
        /HOA.*?\$?([\d,]+)/i,
        /special assessment.*?\$?([\d,]+)/i,
        /\$?([\d,]+)\/mo.*?HOA/i
      ],
      textMarkers: ['HOA fee', 'special assessment', 'assessment', 'HOA']
    },
    expectedSuccessRate: 0.30,
    confidenceThreshold: 'low',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Special assessments often NOT publicly disclosed - contact HOA directly'
  },

  // ======================
  // MARKET PERFORMANCE
  // ======================

  170: {
    fieldId: 170,
    label: 'Market Trend Direction',
    category: 'performance',
    searchQueries: [
      'site:redfin.com/zipcode/{zip}',
      'site:redfin.com "{city}" "market trends"',
      'site:realtor.com "{zip}" trends',
      'site:rockethomes.com "{city}" market'
    ],
    prioritySources: ['redfin.com', 'realtor.com', 'rockethomes.com'],
    extractionPatterns: {
      jsonLdPaths: ['priceChange', 'trendDirection'],
      regexPatterns: [
        /([+-]?[\d\.]+)%\s*(YoY|year|annual)/i,
        /up|down|flat|rising|falling/i
      ],
      textMarkers: ['YoY', 'year over year', 'trend', 'price change']
    },
    expectedSuccessRate: 0.85,
    confidenceThreshold: 'high',
    dataLevel: 'zip',
    fallbackToLLM: true
  },

  171: {
    fieldId: 171,
    label: 'Sale-to-List Ratio',
    category: 'performance',
    searchQueries: [
      'site:redfin.com/zipcode/{zip}',
      'site:redfin.com "{city}" "sale to list"',
      'site:altosresearch.com "{zip}"',
      'site:homelight.com "{city}" "sale to list"'
    ],
    prioritySources: ['redfin.com', 'altosresearch.com', 'homelight.com'],
    extractionPatterns: {
      regexPatterns: [
        /([\d\.]+)%.*?(sale|list)/i,
        /sold.*?([\d\.]+)%.*?asking/i
      ],
      textMarkers: ['Sale-to-List', 'sold above asking', 'sold below asking']
    },
    expectedSuccessRate: 0.80,
    confidenceThreshold: 'medium',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: '>100%=homes selling above asking, <100%=below asking'
  },

  174: {
    fieldId: 174,
    label: 'Inventory Level',
    category: 'performance',
    searchQueries: [
      'site:altosresearch.com "{zip}"',
      'site:redfin.com/zipcode/{zip} inventory',
      'site:realtor.com "{city}" inventory',
      'site:rockethomes.com "{city}" inventory'
    ],
    prioritySources: ['altosresearch.com', 'redfin.com', 'realtor.com'],
    extractionPatterns: {
      regexPatterns: [
        /([\d,]+)\s*active listings/i,
        /inventory[:\s]*([\d,]+)/i
      ],
      textMarkers: ['active listings', 'inventory', 'homes for sale']
    },
    expectedSuccessRate: 0.75,
    confidenceThreshold: 'medium',
    dataLevel: 'zip',
    fallbackToLLM: true
  },

  177: {
    fieldId: 177,
    label: 'Price Momentum (3 mo)',
    category: 'performance',
    searchQueries: [
      'site:redfin.com/zipcode/{zip}',
      'site:redfin.com "{city}" "price" "3 month"',
      'site:altosresearch.com "{zip}"',
      'site:neighborhoodscout.com "{zip}" appreciation'
    ],
    prioritySources: ['redfin.com', 'altosresearch.com', 'neighborhoodscout.com'],
    extractionPatterns: {
      regexPatterns: [
        /([+-]?[\d\.]+)%.*?(3.*?month|quarter)/i
      ],
      textMarkers: ['3-month', 'quarterly', 'price change', 'momentum']
    },
    expectedSuccessRate: 0.70,
    confidenceThreshold: 'medium',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'Short-term momentum - distinguish from YoY trend (Field 170)'
  },

  178: {
    fieldId: 178,
    label: 'Buyer vs Seller Market Indicator',
    category: 'performance',
    searchQueries: [
      'site:realtor.com "{city}" "buyer" OR "seller" market',
      'site:redfin.com/zipcode/{zip}',
      'site:rockethomes.com "{city}" market',
      'site:homelight.com "{city}" market conditions'
    ],
    prioritySources: ['realtor.com', 'redfin.com', 'rockethomes.com'],
    extractionPatterns: {
      regexPatterns: [
        /buyer'?s market|seller'?s market|balanced market/i
      ],
      textMarkers: ['Buyer\'s Market', 'Seller\'s Market', 'Balanced Market']
    },
    expectedSuccessRate: 0.85,
    confidenceThreshold: 'high',
    dataLevel: 'zip',
    requiresFields: [96, 171, 95],
    fallbackToLLM: true,
    notes: 'Can derive from: Months Supply (96), Sale-to-List (171), DOM (95)'
  },

  181: {
    fieldId: 181,
    label: 'Market Volatility Score',
    category: 'performance',
    searchQueries: [],
    prioritySources: [],
    extractionPatterns: {},
    expectedSuccessRate: 0.95,
    confidenceThreshold: 'high',
    dataLevel: 'zip',
    requiresFields: [170, 171, 174, 177, 178],
    calculationOnly: true,
    notes: 'Aggregate of Fields 170-180. Scale 0-100 (higher=more volatile)'
  }
};

/**
 * Helper: Get all field IDs that can be fetched with Tavily (non-calculated)
 */
export const TAVILY_FETCHABLE_FIELDS = Object.values(TAVILY_FIELD_CONFIGS)
  .filter(config => !config.calculationOnly)
  .map(config => config.fieldId);

/**
 * Helper: Get all calculated field IDs (no Tavily query needed)
 */
export const CALCULATED_FIELDS = Object.values(TAVILY_FIELD_CONFIGS)
  .filter(config => config.calculationOnly)
  .map(config => config.fieldId);

/**
 * Helper: Get field config by ID
 * FIX ERROR #4: Accept both number and string IDs for AVM subfields
 */
export function getTavilyFieldConfig(fieldId: number | string): TavilyFieldConfig | undefined {
  return TAVILY_FIELD_CONFIGS[fieldId];
}

/**
 * Helper: Check if field can be fetched with Tavily
 * FIX ERROR #4: Accept both number and string IDs for AVM subfields
 */
export function isTavilyFetchable(fieldId: number | string): boolean {
  const config = TAVILY_FIELD_CONFIGS[fieldId];
  return config !== undefined && !config.calculationOnly;
}

/**
 * Helper: Get fields by category
 */
export function getFieldsByCategory(category: TavilyFieldConfig['category']): TavilyFieldConfig[] {
  return Object.values(TAVILY_FIELD_CONFIGS).filter(config => config.category === category);
}
