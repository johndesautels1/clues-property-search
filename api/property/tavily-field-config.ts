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
      // Property-specific rates (HIGHEST PRIORITY - if available)
      'site:zillow.com "{address}" mortgage rates calculator',
      'site:redfin.com "{address}" financing',

      // State-specific rates (HIGH PRIORITY)
      '{state} mortgage rates 2025 2026',
      'site:bankrate.com {state} mortgage rates',
      '{state} housing finance agency rates',

      // Investment property rates (MEDIUM PRIORITY)
      'investment property mortgage rates {state} 2025',
      '{state} investor loan rates',

      // National sources with year (FALLBACK)
      'site:mortgagenewsdaily.com rates january 2026',
      'site:nerdwallet.com mortgage rates 2026',
      'site:freddiemac.com PMMS 2025 2026',
      'mortgage rates today 2026'
    ],
    prioritySources: ['zillow.com', 'redfin.com', 'bankrate.com', 'mortgagenewsdaily.com', 'nerdwallet.com', 'freddiemac.com', 'housing finance'],
    extractionPatterns: {
      regexPatterns: [
        /30.*?year.*?([\d\.]+)%/i,                    // 30-year fixed rate
        /15.*?year.*?([\d\.]+)%/i,                    // 15-year fixed rate
        /FHA.*?([\d\.]+)%/i,                          // FHA rate
        /VA.*?([\d\.]+)%/i,                           // VA rate
        /APR[:\s]*([\d\.]+)%/i,                       // APR
        /jumbo.*?([\d\.]+)%/i,                        // Jumbo loans
        /investment.*?property.*?([\d\.]+)%/i,        // Investment properties
        /down payment[:\s]*([\d\.]+)%/i,              // Down payment %
        /([\d\.]+)\s*points/i                         // Points/fees
      ],
      textMarkers: ['30-year fixed', '15-year fixed', 'FHA', 'VA', 'mortgage rates', 'APR', 'investment property', 'jumbo', 'down payment', 'housing finance agency', 'first-time buyer']
    },
    expectedSuccessRate: 0.95,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Prioritizes property-specific → state-specific → national rates. Includes investment property rates and state housing finance agency programs for investors.'
  },

  103: {
    fieldId: 103,
    label: 'Comparable Sales',
    category: 'market',
    searchQueries: [
      // Major MLS/aggregator sites (HIGHEST PRIORITY)
      'site:realtor.com "{address}" sold',
      'site:redfin.com "{address}" "similar homes" sold',
      'site:homes.com "{address}" sold homes',

      // Existing working sources
      'site:movoto.com "{address}" comparables',
      'site:estately.com "{address}" "sold homes"',
      'site:homedisclosure.com "{address}"',

      // Year-specific queries
      '"{address}" sold homes 2024 2025 2026',
      'recently sold homes near "{address}" 2025',

      // ZIP-level fallback
      '{zip} recently sold homes comparable',
      'sold homes {zip} 2025 2026'
    ],
    prioritySources: ['realtor.com', 'redfin.com', 'homes.com', 'movoto.com', 'estately.com', 'homedisclosure.com'],
    extractionPatterns: {
      jsonLdPaths: ['offers', 'soldPrice', 'salePrice'],
      regexPatterns: [
        /Sold[:\s]*\$?([\d,]+)/i,                           // Sold price
        /Sale Price[:\s]*\$?([\d,]+)/i,                     // Sale price
        /(\d+)\s*bd/i,                                       // Bedrooms
        /(\d+\.?\d*)\s*ba/i,                                // Bathrooms
        /([\d,]+)\s*sq\s*ft/i,                              // Square feet
        /Sold[:\s]*([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,    // Sale date
        /\$?([\d,]+)\s*\/\s*sq\s*ft/i,                     // Price per sqft
        /([\d\.]+)\s*miles?\s*away/i,                       // Distance
        /Closed[:\s]*\$?([\d,]+)/i,                         // Closed price variant
        /list.*\$?([\d,]+).*sold.*\$?([\d,]+)/i            // List vs sold price
      ],
      textMarkers: ['Comparable Sales', 'Similar Homes Sold', 'sold', 'sale price', 'recently sold', 'closed', 'sold date', 'price per sqft']
    },
    expectedSuccessRate: 0.90,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Extract up to 5 comps within last 6 months. Prioritizes MLS sources (Realtor.com, Redfin) with year-specific and ZIP-level fallbacks.'
  },

  // ======================
  // UTILITIES & CONNECTIVITY
  // ======================

  104: {
    fieldId: 104,
    label: 'Electric Provider',
    category: 'utilities',
    searchQueries: [
      // Address-specific (HIGHEST PRIORITY)
      'site:inmyarea.com "{address}" electric provider',
      '"{address}" electric utility',

      // ZIP-level (HIGH PRIORITY)
      'site:inmyarea.com "{zip}" electric',
      'site:electricrate.com "{zip}"',
      'site:chooseenergy.com "{zip}" electric providers',

      // City-level
      'site:openinframap.org "{city}"',
      '"{city}, {state}" electric utility company',

      // State-level fallback
      '"{state}" electric utility map "{city}"'
    ],
    prioritySources: ['inmyarea.com', 'electricrate.com', 'chooseenergy.com', 'openinframap.org'],
    extractionPatterns: {
      regexPatterns: [
        /Electric[:\s]*([A-Z][^\n]+)/i,                    // Electric provider name
        /Provider[:\s]*([A-Z][^\n]+)/i,                    // Provider name
        /Utility[:\s]*([A-Z][^\n]+)/i,                     // Utility company name
        /Served by[:\s]*([A-Z][^\n]+)/i,                   // "Served by Duke Energy"
        /(Duke Energy|FPL|Florida Power & Light|ComEd|PG&E|Pacific Gas & Electric|ConEd|Consolidated Edison|PSE&G|Entergy|AEP|American Electric Power|Southern Company|Xcel Energy|Dominion Energy|National Grid|Exelon|PPL|FirstEnergy|Ameren|Eversource|CenterPoint Energy|NRG Energy|Comed|PECO|Georgia Power|Alabama Power|Mississippi Power|Gulf Power|SCE|Southern California Edison|SDG&E|San Diego Gas & Electric|Tampa Electric|TECO|Duke Energy Florida|Duke Energy Carolinas|Progress Energy|DTE Energy|Consumers Energy|WE Energies|Alliant Energy|MidAmerican Energy|Avista|Idaho Power|PacifiCorp|NV Energy|APS|Arizona Public Service|Salt River Project|SRP|LADWP|SMUD|Austin Energy|CPS Energy)/i,  // Major utility names
        /Power Company[:\s]*([A-Z][^\n]+)/i                // Power company name
      ],
      textMarkers: ['Electric Provider', 'utility company', 'power company', 'served by', 'electricity provider', 'electric utility']
    },
    expectedSuccessRate: 0.97,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Address-level lookup provides exact provider. Major utility name recognition for accurate extraction. ZIP codes may have multiple providers in deregulated markets.'
  },

  105: {
    fieldId: 105,
    label: 'Avg Electric Bill',
    category: 'utilities',
    searchQueries: [
      // Address-specific (HIGHEST PRIORITY)
      'site:zillow.com "{address}" utility costs',
      'site:redfin.com "{address}" electric bill',
      '"{address}" average electric bill',

      // ZIP-level with year (HIGH PRIORITY)
      'site:eia.gov "{zip}" electricity price 2025 2026',
      'site:inmyarea.com "{zip}" electric cost 2025',
      '"{zip}" average electric bill 2025',

      // State-level seasonal (MEDIUM PRIORITY)
      '{state} average electric bill summer 2025',
      'site:eia.gov "{state}" residential electricity price 2025',

      // City-level fallback
      'site:numbeo.com "{city}, {state}" utilities 2025'
    ],
    prioritySources: ['zillow.com', 'redfin.com', 'eia.gov', 'inmyarea.com', 'numbeo.com'],
    extractionPatterns: {
      regexPatterns: [
        /\$?([\d,]+)\s*\/?\s*mo(nth)?/i,
        /electric.*?\$?([\d,]+)/i,
        /([\d,]+)\s*kWh/i,
        /summer.*?\$?([\d,]+)/i,
        /winter.*?\$?([\d,]+)/i,
        /average.*?bill.*?\$?([\d,]+)/i
      ],
      textMarkers: ['monthly', 'electric', 'electricity', 'utilities', 'kWh', 'summer', 'winter', 'average bill', 'residential']
    },
    expectedSuccessRate: 0.90,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Prioritizes property-specific → ZIP → state → city. Includes seasonal variation (critical for AC-heavy states). EIA.gov provides authoritative government data.'
  },

  106: {
    fieldId: 106,
    label: 'Water Provider',
    category: 'utilities',
    searchQueries: [
      // Address-specific (HIGHEST PRIORITY)
      'site:inmyarea.com "{address}" water provider',
      '"{address}" water utility',

      // ZIP-level (HIGH PRIORITY)
      'site:inmyarea.com "{zip}" water utility',
      '"{zip}" water department',

      // City/state-level fallback
      '"{city}, {state}" water department',
      '{state} water association "{city}" service area',
      '"{city}" municipal water utility'
    ],
    prioritySources: ['inmyarea.com', 'city-data.com', 'state water associations'],
    extractionPatterns: {
      regexPatterns: [
        /Water[:\s]*([A-Z][^\n]+)/i,
        /Provider[:\s]*([A-Z][^\n]+)/i,
        /Utility[:\s]*([A-Z][^\n]+)/i,
        /(Miami-Dade Water|LADWP|Los Angeles Water|NYC Water|Chicago Water|Houston Water|Phoenix Water|Philadelphia Water|San Antonio Water|San Diego Water|Dallas Water|San Jose Water|Austin Water|Jacksonville Water|Fort Worth Water|Columbus Water|Charlotte Water|Indianapolis Water|Seattle Public Utilities|Denver Water|Washington DC Water|Boston Water|Nashville Water|Oklahoma City Water|Portland Water|Las Vegas Valley Water|Memphis Water|Louisville Water|Baltimore Water|Milwaukee Water|Albuquerque Water|Tucson Water|Fresno Water|Sacramento Water|Mesa Water|Kansas City Water|Atlanta Water|Colorado Springs|Raleigh Water|Omaha Water|Minneapolis Water|Cleveland Water|Wichita Water|Arlington Water|Tampa Water|Orlando Water|St. Louis Water|Pittsburgh Water|Cincinnati Water|Anchorage Water|Henderson Water|Greensboro Water|Plano Water|Newark Water|Lincoln Water|Buffalo Water|Jersey City Water|Chula Vista Water|Fort Wayne Water|St. Petersburg Water)/i
      ],
      textMarkers: ['Water Provider', 'water utility', 'water department', 'municipal water', 'served by', 'water district']
    },
    expectedSuccessRate: 0.98,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Address-level lookup provides exact provider. Major water utility name recognition for 50+ metro areas. Municipal water often requires city/county website data.'
  },

  107: {
    fieldId: 107,
    label: 'Avg Water Bill',
    category: 'utilities',
    searchQueries: [
      // Address-specific (HIGHEST PRIORITY)
      'site:zillow.com "{address}" water bill',
      'site:redfin.com "{address}" water costs',
      '"{address}" water bill estimate',

      // ZIP-level with year (HIGH PRIORITY)
      '"{zip}" average water bill 2025',
      'site:valuepenguin.com "{zip}" water bill',

      // City-level with rate schedules
      '"{city}, {state}" water rates residential 2025',
      '{city} water department rate schedule 2025',

      // State-level fallback
      '{state} water board rates 2025',
      'site:numbeo.com "{city}" utilities water 2025'
    ],
    prioritySources: ['zillow.com', 'redfin.com', 'valuepenguin.com', 'city water departments', 'state water boards', 'numbeo.com'],
    extractionPatterns: {
      regexPatterns: [
        /\$?([\d,]+)\s*\/?\s*mo(nth)?/i,
        /water.*?\$?([\d,]+)/i,
        /([\d,]+)\s*gallons?/i,
        /tier.*?\$?([\d,]+)/i,
        /rate.*?\$?([\d\.]+)\s*per/i,
        /average.*?water.*?\$?([\d,]+)/i
      ],
      textMarkers: ['monthly', 'water', 'water bill', 'gallons', 'tier', 'rate schedule', 'residential rates', 'average water']
    },
    expectedSuccessRate: 0.88,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Prioritizes property-specific → ZIP → city rate schedules → state. Includes tiered pricing and gallons/month for conservation markets. Year-specific queries ensure current rates.'
  },

  108: {
    fieldId: 108,
    label: 'Sewer Provider',
    category: 'utilities',
    searchQueries: [
      // Address-specific (HIGHEST PRIORITY)
      'site:inmyarea.com "{address}" sewer',
      '"{address}" sewer utility',
      '"{address}" septic system',

      // ZIP-level (HIGH PRIORITY)
      'site:inmyarea.com "{zip}" sewer',
      '"{zip}" wastewater district',

      // City-level fallback
      '"{city}, {state}" sewer utility',
      '"{city}" wastewater department'
    ],
    prioritySources: ['inmyarea.com', 'city wastewater departments', 'county sanitation districts'],
    extractionPatterns: {
      regexPatterns: [
        /Sewer[:\s]*([A-Z][^\n]+)/i,
        /Wastewater[:\s]*([A-Z][^\n]+)/i,
        /Septic[:\s]*(Yes|No|System)/i,
        /Municipal sewer/i,
        /(Sanitation District|Wastewater Authority|Sewer District)/i
      ],
      textMarkers: ['Sewer Provider', 'wastewater', 'septic', 'municipal sewer', 'sanitation district', 'sewer district', 'wastewater authority']
    },
    expectedSuccessRate: 0.95,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Address-level critical for septic vs municipal sewer determination. Major sanitation districts recognized. Septic systems common in rural/suburban areas.'
  },

  109: {
    fieldId: 109,
    label: 'Natural Gas',
    category: 'utilities',
    searchQueries: [
      // Address-specific (HIGHEST PRIORITY)
      'site:inmyarea.com "{address}" natural gas',
      '"{address}" gas available',
      '"{address}" all-electric',

      // ZIP-level (HIGH PRIORITY)
      'site:inmyarea.com "{zip}" natural gas',
      '"{zip}" gas utility provider',

      // City/state-level fallback
      'site:openinframap.org "{city}" gas',
      '"{city}, {state}" gas utility company',
      '{state} gas association "{city}" service area'
    ],
    prioritySources: ['inmyarea.com', 'openinframap.org', 'state gas associations'],
    extractionPatterns: {
      regexPatterns: [
        /Gas[:\s]*([A-Z][^\n]+)/i,
        /Natural Gas[:\s]*([A-Z][^\n]+)/i,
        /(All-electric|No gas available|Gas not available)/i,
        /(Propane|LP Gas|Liquefied Petroleum)/i,
        /(National Grid|Con Edison|SoCalGas|Southern California Gas|PG&E|Pacific Gas|Peoples Gas|Nicor Gas|NiSource|Southwest Gas|Atmos Energy|Centerpoint Energy|Columbia Gas|Dominion Energy|DTE Energy|Enbridge|Spire Energy|PECO Energy|NW Natural|Xcel Energy|Sempra Energy)/i,
        /Gas Available[:\s]*(Yes|No)/i
      ],
      textMarkers: ['Natural Gas', 'gas provider', 'gas utility', 'all-electric', 'propane', 'LP gas', 'gas available', 'no gas infrastructure']
    },
    expectedSuccessRate: 0.93,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Address-level critical for gas vs all-electric vs propane determination. Major gas utility name recognition for 20+ providers. Rural areas may use propane instead of natural gas pipeline.'
  },

  110: {
    fieldId: 110,
    label: 'Trash Provider',
    category: 'utilities',
    searchQueries: [
      // Address-specific (HIGHEST PRIORITY - HOA vs municipal)
      '"{address}" trash service',
      '"{address}" HOA trash included',
      'site:inmyarea.com "{address}" waste',

      // ZIP-level (HIGH PRIORITY)
      'site:inmyarea.com "{zip}" trash',
      '"{zip}" garbage collection provider',

      // City-level fallback
      '"{city}, {state}" waste management garbage collection',
      '"{city}" sanitation department',
      '{city} {state} recycling trash pickup'
    ],
    prioritySources: ['inmyarea.com', 'city sanitation departments', 'county waste management'],
    extractionPatterns: {
      regexPatterns: [
        /Trash[:\s]*([A-Z][^\n]+)/i,
        /Waste[:\s]*([A-Z][^\n]+)/i,
        /(Waste Management|Republic Services|Advanced Disposal|GFL Environmental|Waste Connections|Casella Waste|Rumpke|Groot|Recology)/i,
        /(Included in HOA|Municipal service|City provides)/i,
        /Recycling[:\s]*([A-Z][^\n]+)/i
      ],
      textMarkers: ['Trash Provider', 'waste management', 'garbage', 'sanitation', 'included in HOA', 'municipal service', 'recycling', 'private hauler']
    },
    expectedSuccessRate: 0.85,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Address-level critical for HOA-included vs municipal vs private hauler. Major waste company name recognition. Municipal service often included in property taxes.'
  },

  111: {
    fieldId: 111,
    label: 'Internet Providers (Top 3)',
    category: 'utilities',
    searchQueries: [
      // Address-specific (HIGHEST PRIORITY - varies by street)
      'site:broadbandnow.com "{address}" providers',
      '"{address}" internet providers available 2025',

      // ZIP-level (HIGH PRIORITY)
      'site:broadbandmap.fcc.gov "{zip}" 2025',
      'site:broadbandnow.com "{zip}" internet 2025',
      'site:highspeedinternet.com "{zip}" providers 2025',
      'site:inmyarea.com "{zip}" internet',

      // City-level fallback
      '"{city}, {state}" internet service providers 2025',
      '{city} {state} ISP availability 2026'
    ],
    prioritySources: ['broadbandmap.fcc.gov', 'broadbandnow.com', 'highspeedinternet.com', 'inmyarea.com'],
    extractionPatterns: {
      regexPatterns: [
        /([\d,]+)\s*Mbps/i,
        /Fiber|Cable|DSL|Fixed Wireless|Satellite/i,
        /(Xfinity|Comcast|Spectrum|Charter|Cox|Verizon Fios|AT&T Fiber|AT&T Internet|CenturyLink|Frontier|Optimum|Altice|Mediacom|Windstream|EarthLink|HughesNet|Viasat|Starlink|Google Fiber|WOW|RCN|Astound|Kinetic)/i,
        /Provider[:\s]*([A-Z][^\n]+)/i
      ],
      textMarkers: ['provider', 'Fiber', 'Cable', 'DSL', 'Mbps', 'internet', 'ISP', 'available', 'fixed wireless', 'satellite']
    },
    expectedSuccessRate: 0.95,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Address-level critical as ISP availability varies by street. FCC Broadband Map most authoritative. Major ISP name recognition for 25+ providers. Year-specific queries capture expanding coverage.'
  },

  112: {
    fieldId: 112,
    label: 'Max Internet Speed',
    category: 'utilities',
    searchQueries: [
      // Address-specific (HIGHEST PRIORITY - fiber varies by street)
      'site:broadbandnow.com "{address}" speeds',
      '"{address}" max internet speed available',

      // ZIP-level (HIGH PRIORITY)
      'site:broadbandmap.fcc.gov "{zip}" 2025',
      'site:broadbandnow.com "{zip}" fastest 2025',
      'site:highspeedinternet.com "{zip}" max speed',
      '"{zip}" gigabit internet available 2025',

      // City-level with year
      'site:speedtest.net/performance "{city}" 2025',
      '"{city}, {state}" fastest internet 2026',
      '{city} {state} fiber speed 2025'
    ],
    prioritySources: ['broadbandmap.fcc.gov', 'broadbandnow.com', 'speedtest.net', 'highspeedinternet.com'],
    extractionPatterns: {
      regexPatterns: [
        /([\d,]+)\s*Mbps/i,
        /(\d+\.?\d*)\s*Gbps/i,
        /download[:\s]*([\d,]+)\s*Mbps/i,
        /upload[:\s]*([\d,]+)\s*Mbps/i,
        /max.*?([\d,]+)\s*Mbps/i,
        /fastest.*?([\d,]+)\s*Mbps/i,
        /(Gigabit|1 Gig|2 Gig|5 Gig|10 Gig)/i
      ],
      textMarkers: ['max speed', 'fastest', 'Mbps', 'Gbps', 'download', 'upload', 'gigabit', 'fiber speed', 'max available']
    },
    expectedSuccessRate: 0.93,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Address-level critical as fiber/gigabit speeds vary by street. Includes upload speed extraction (important for remote work). Year-specific queries capture rapid fiber expansion. Gbps vs Mbps pattern matching.'
  },

  113: {
    fieldId: 113,
    label: 'Fiber Available',
    category: 'utilities',
    searchQueries: [
      // Address-specific (HIGHEST PRIORITY - fiber varies by street!)
      'site:broadbandnow.com "{address}" fiber',
      '"{address}" fiber optic available',
      '"{address}" FTTH 2025',

      // ZIP-level (HIGH PRIORITY)
      'site:broadbandmap.fcc.gov "{zip}" fiber 2025',
      'site:broadbandnow.com "{zip}" fiber 2025',
      'site:highspeedinternet.com "{zip}" fiber',
      '"{zip}" fiber internet 2026',

      // City-level with planned deployments
      'site:openinframap.org "{city}" fiber',
      '"{city}, {state}" fiber expansion 2025',
      '{city} {state} fiber coming soon 2026'
    ],
    prioritySources: ['broadbandmap.fcc.gov', 'broadbandnow.com', 'openinframap.org', 'highspeedinternet.com'],
    extractionPatterns: {
      regexPatterns: [
        /Fiber|FTTH/i,
        /Yes|No|Available|Not Available/i,
        /(AT&T Fiber|Verizon Fios|Google Fiber|Frontier FiberOptic|CenturyLink Fiber|Ziply Fiber|Quantum Fiber)/i,
        /(Coming Soon|Planned|Under Construction|Expected 202\d)/i,
        /Fiber Available[:\s]*(Yes|No)/i
      ],
      textMarkers: ['Fiber', 'FTTH', 'fiber optic', 'available', 'coming soon', 'planned', 'fiber expansion', 'AT&T Fiber', 'Verizon Fios', 'Google Fiber']
    },
    expectedSuccessRate: 0.99,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'FTTH = Fiber to the Home. Address-level critical as fiber availability varies by street even within same ZIP. Major fiber provider name recognition. Includes "coming soon" detection for planned fiber deployments (important for investors).'
  },

  114: {
    fieldId: 114,
    label: 'Cable TV Provider',
    category: 'utilities',
    searchQueries: [
      // Address-specific (HIGHEST PRIORITY)
      'site:inmyarea.com "{address}" cable TV',
      '"{address}" TV service available',

      // ZIP-level (HIGH PRIORITY)
      'site:highspeedinternet.com "{zip}" cable TV 2025',
      'site:inmyarea.com "{zip}" cable',
      '"{zip}" streaming services available 2025',

      // City-level fallback
      '"{city}, {state}" cable television provider',
      '{city} {state} streaming TV services 2025',
      '{city} cord cutting options 2025'
    ],
    prioritySources: ['highspeedinternet.com', 'inmyarea.com', 'streaming service availability'],
    extractionPatterns: {
      regexPatterns: [
        /Cable.*?([A-Z][^\n]+)/i,
        /(Xfinity|Spectrum|Cox|Optimum|Altice|Mediacom|Suddenlink|WOW|RCN)/i,
        /(YouTube TV|Hulu Live|FuboTV|Sling TV|DirecTV Stream)/i,
        /Streaming[:\s]*(Available|Yes|No)/i,
        /Cable Available[:\s]*(Yes|No)/i
      ],
      textMarkers: ['Cable TV', 'cable provider', 'television', 'streaming', 'YouTube TV', 'Hulu Live', 'cord cutting', 'TV service']
    },
    expectedSuccessRate: 0.80,
    confidenceThreshold: 'medium',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Cable TV market declining - includes streaming service alternatives (YouTube TV, Hulu Live). Address-level for exact cable provider. Major cable provider name recognition. Many investors prefer streaming-only markets.'
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
      // Address-specific (HIGHEST PRIORITY)
      '"{address}" nearest fire station distance',
      '"{address}" nearest hospital distance',
      '"{address}" emergency services map',
      'distance from "{address}" to fire station',

      // ZIP-level (HIGH PRIORITY)
      'site:city-data.com "{zip}" "fire station"',
      '"{zip}" emergency services locations',

      // City-level with service types
      '"{city}, {state}" fire station locations map',
      '"{city}, {state}" hospital emergency room locations',
      '"{city}, {state}" police station map',
      '{city} {state} 911 response time'
    ],
    prioritySources: ['city-data.com', 'Google Maps distance', 'city emergency services websites', '911 response data'],
    extractionPatterns: {
      regexPatterns: [
        /([\d\.]+)\s*mi(les?)?/i,
        /fire|hospital|police/i,
        /Fire Station[:\s]*([\d\.]+)\s*mi/i,
        /Hospital[:\s]*([\d\.]+)\s*mi/i,
        /Police[:\s]*([\d\.]+)\s*mi/i,
        /(\d+)\s*minutes?\s*response/i,
        /nearest.*?([\d\.]+)\s*mi/i,
        /distance.*?([\d\.]+)\s*mi/i
      ],
      textMarkers: ['fire station', 'hospital', 'police', 'distance', 'miles', 'nearest', 'emergency services', 'response time', 'minutes']
    },
    expectedSuccessRate: 0.60,
    confidenceThreshold: 'medium',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'ADDRESS CRITICAL for accurate distances. Web scraping limited - Google Places API recommended as primary source (this should be fallback only). Includes response time extraction. Difficult to scrape reliably but improved with address-specific distance queries.'
  },

  // ======================
  // PROPERTY FEATURES
  // ======================

  131: {
    fieldId: 131,
    label: 'View Type',
    category: 'features',
    searchQueries: [
      // MLS listing sites (HIGHEST PRIORITY - explicit mentions)
      'site:movoto.com "{address}"',
      'site:estately.com "{address}"',
      'site:homes.com "{address}"',
      'site:realtor.com "{address}"',

      // General listing description fallback
      '"{address}" listing description view',
      '"{address}" property features view',

      // County/GIS data for natural features proximity
      '"{address}" near water ocean lake',
      '"{address}" elevation view mountains'
    ],
    prioritySources: ['movoto.com', 'estately.com', 'homes.com', 'realtor.com', 'county GIS'],
    extractionPatterns: {
      regexPatterns: [
        /water view|ocean view|lake view|bay view|river view|mountain view|city view|skyline view|golf course view|park view|garden view|scenic view|panoramic view|valley view|canyon view|hill view/i,
        /view of (water|ocean|lake|bay|river|mountain|city|golf course|park|valley)/i,
        /overlook(s|ing)?\s+(water|ocean|lake|mountains?|city)/i
      ],
      textMarkers: ['view', 'water', 'ocean', 'mountain', 'city', 'golf course', 'panoramic', 'scenic', 'overlook', 'vista']
    },
    expectedSuccessRate: 0.55,
    confidenceThreshold: 'medium',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'LISTING-DEPENDENT - only extract explicit mentions in listing text, do NOT infer from photos. Fallback to general listing descriptions for view mentions. County GIS for natural feature proximity.'
  },

  132: {
    fieldId: 132,
    label: 'Lot Features',
    category: 'features',
    searchQueries: [
      // MLS listing sites (HIGHEST PRIORITY - explicit mentions)
      'site:movoto.com "{address}"',
      'site:estately.com "{address}"',
      'site:realtor.com "{address}"',
      'site:homes.com "{address}"',

      // County parcel/plat data for lot characteristics
      '"{address}" county parcel lot shape',
      '"{address}" plat map corner lot cul-de-sac',

      // General listing description
      '"{address}" lot features yard',
      '"{address}" property description outdoor'
    ],
    prioritySources: ['movoto.com', 'estately.com', 'realtor.com', 'homes.com', 'county GIS', 'county plat maps'],
    extractionPatterns: {
      regexPatterns: [
        /corner lot|cul-de-sac|fenced yard|pool|landscaped|mature trees|flat lot|sloped lot|waterfront|acreage|oversized lot|pie-shaped lot|level lot|wooded lot|cleared lot|private lot|backs to (greenbelt|park|woods)/i,
        /([\d\.]+)\s*acre/i,
        /([\d,]+)\s*sq\s*ft\s*lot/i,
        /lot size[:\s]*([\d,]+)\s*sq\s*ft/i,
        /backs to (greenbelt|park|trees|woods|open space)/i
      ],
      textMarkers: ['lot', 'corner', 'cul-de-sac', 'fenced', 'pool', 'landscaped', 'waterfront', 'level', 'wooded', 'cleared', 'backs to']
    },
    expectedSuccessRate: 0.65,
    confidenceThreshold: 'medium',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'LISTING-DEPENDENT - only extract explicit mentions in listing text. County GIS/plat maps can identify corner lots and cul-de-sac locations. Includes backing to greenbelt/park detection (valuable for privacy/views).'
  },

  133: {
    fieldId: 133,
    label: 'EV Charging',
    category: 'features',
    searchQueries: [
      // PlugShare - THE authoritative EV charging database (ZIP-level PRIORITY)
      'site:plugshare.com "{zip}"',
      'site:plugshare.com "{city}, {state}"',

      // Additional authoritative sources (ZIP-level)
      'site:chargehub.com "{zip}"',
      'site:openchargemap.org "{zip}"',
      'site:afdc.energy.gov "{zip}" charging stations',

      // City-level fallback
      'site:chargehub.com "{city}"',
      'site:openchargemap.org "{city}"'
    ],
    prioritySources: ['plugshare.com', 'chargehub.com', 'openchargemap.org', 'afdc.energy.gov'],
    extractionPatterns: {
      regexPatterns: [
        /Level 2|DC Fast|Tesla Supercharger|Level 1/i,
        /ChargePoint|Electrify America|EVgo|Tesla|Blink|SemaConnect|Flo|Greenlots/i,
        /([\d\.]+)\s*mi(les?)?/i,
        /([\d]+)\s*kW/i,
        /(\d+)\s*chargers?/i
      ],
      textMarkers: ['charging station', 'Level 2', 'DC Fast', 'Tesla', 'ChargePoint', 'kW', 'Supercharger', 'Electrify America', 'EVgo']
    },
    expectedSuccessRate: 0.93,
    confidenceThreshold: 'high',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'PlugShare is THE authoritative EV charging database. ZIP-level for better proximity accuracy. Added AFDC (Alternative Fuels Data Center) government source. Includes kW output and charger count extraction.'
  },

  134: {
    fieldId: 134,
    label: 'Smart Home Features',
    category: 'features',
    searchQueries: [
      // MLS listing sites (explicit mentions)
      'site:movoto.com "{address}"',
      'site:realtor.com "{address}"',
      'site:estately.com "{address}"',
      'site:homes.com "{address}"',

      // General listing description (fallback for smart features)
      '"{address}" listing smart home features',
      '"{address}" property features technology',
      '"{address}" listing description automation'
    ],
    prioritySources: ['movoto.com', 'realtor.com', 'estately.com', 'homes.com'],
    extractionPatterns: {
      regexPatterns: [
        /smart thermostat|Nest|Ecobee|Honeywell Home|smart locks|Ring doorbell|smart lighting|home automation|Alexa|Google Home|smart blinds|security system|smart sprinklers|smart garage|video doorbell/i,
        /Ring|Nest|Ecobee|August|Schlage Encode|Lutron|Philips Hue|Arlo|SimpliSafe|ADT|Vivint/i,
        /smart home|home automation|connected home|smart security/i,
        /voice control|Alexa enabled|Google Assistant|HomeKit/i
      ],
      textMarkers: ['smart', 'Nest', 'Ring', 'Alexa', 'Google Home', 'automation', 'video doorbell', 'smart lock', 'smart thermostat', 'connected']
    },
    expectedSuccessRate: 0.40,
    confidenceThreshold: 'medium',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'LISTING-DEPENDENT - smart features rarely listed in older properties, expect higher success in new construction. Includes major brand recognition (Ring, Nest, Ecobee, etc.). Fallback to general listing descriptions for smart home mentions.'
  },

  135: {
    fieldId: 135,
    label: 'Accessibility Modifications',
    category: 'features',
    searchQueries: [
      // Rental sites (more likely to list accessibility)
      'site:apartments.com "{address}"',
      'site:rent.com "{address}"',

      // MLS sites with accessibility queries
      'site:realtor.com "{address}" accessible',
      'site:movoto.com "{address}"',
      'site:homes.com "{address}"',

      // General listing description
      '"{address}" accessible features ADA',
      '"{address}" listing wheelchair accessible'
    ],
    prioritySources: ['apartments.com', 'rent.com', 'realtor.com', 'movoto.com', 'homes.com'],
    extractionPatterns: {
      regexPatterns: [
        /wheelchair accessible|ADA compliant|single-story|no stairs|grab bars|roll-in shower|wide doorways|ramp|elevator access|handicap accessible|first-floor master|accessible bathroom|accessible kitchen/i,
        /step-free entry|barrier-free|universal design|accessible entrance/i,
        /32.*?inch.*?door|36.*?inch.*?door/i
      ],
      textMarkers: ['wheelchair', 'ADA', 'accessible', 'grab bars', 'ramp', 'elevator', 'single-story', 'no stairs', 'barrier-free', 'universal design']
    },
    expectedSuccessRate: 0.45,
    confidenceThreshold: 'medium',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'LISTING-DEPENDENT - rentals more likely to list accessibility features. Includes ADA compliance detection, door width measurements (32"/36"), and universal design patterns. Fallback to general listing descriptions.'
  },

  136: {
    fieldId: 136,
    label: 'Pet Policy',
    category: 'features',
    searchQueries: [
      // Rental sites (PRIORITY - most comprehensive pet policies)
      'site:apartments.com "{address}"',
      'site:zumper.com "{address}"',
      'site:rent.com "{address}"',
      'site:zillow.com/rental "{address}"',

      // Additional rental aggregators
      'site:apartmentguide.com "{address}"',
      'site:rentals.com "{address}"'
    ],
    prioritySources: ['apartments.com', 'zumper.com', 'rent.com', 'zillow.com/rental', 'apartmentguide.com'],
    extractionPatterns: {
      regexPatterns: [
        /pets allowed|dogs allowed|cats allowed|no pets|pet deposit|pet rent|pet fee|pet-friendly|large dogs|small dogs|breed restrictions/i,
        /\$?([\d,]+)\s*pet deposit/i,
        /\$?([\d,]+)\/mo.*?pet/i,
        /(\d+)\s*pet maximum|max.*?(\d+)\s*pets?/i
      ],
      textMarkers: ['pets', 'dogs', 'cats', 'pet policy', 'pet deposit', 'pet rent', 'pet-friendly', 'breed restrictions', 'weight limit']
    },
    expectedSuccessRate: 0.92,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'RENTAL-SPECIFIC - for sale properties return "N/A - property is for sale". Includes breed restrictions, weight limits, and pet count maximums for comprehensive policy extraction.'
  },

  137: {
    fieldId: 137,
    label: 'Age Restrictions',
    category: 'features',
    searchQueries: [
      // 55Places.com - THE specialist (HIGHEST PRIORITY)
      'site:55places.com "{community}"',
      'site:55places.com "{zip}"',

      // MLS sites with age restriction queries
      'site:realtor.com "{address}" "55+"',
      'site:realtor.com "{community}" age restricted',

      // HOA and community searches
      '"{community}" HOA age restriction',
      '"{address}" senior community 55+',
      '"{zip}" active adult community'
    ],
    prioritySources: ['55places.com', 'realtor.com'],
    extractionPatterns: {
      regexPatterns: [
        /55\+|62\+|age restricted|age restriction|active adult/i,
        /at least one resident.*?(\d+)/i,
        /minimum age.*?(\d+)/i
      ],
      textMarkers: ['55+', '62+', 'age restricted', 'senior community', 'active adult', 'age qualification', 'minimum age']
    },
    expectedSuccessRate: 0.83,
    confidenceThreshold: 'high',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: '55Places.com is THE specialist for age-restricted communities. Includes "active adult" terminology and minimum age extraction (55+ vs 62+). ZIP-level fallback for community identification.'
  },

  138: {
    fieldId: 138,
    label: 'Special Assessments',
    category: 'features',
    searchQueries: [
      // HOA databases (limited public disclosure)
      'site:hoadata.org "{community}"',
      'site:hoadata.org "{zip}"',
      'site:propertyshark.com "{address}" assessment',

      // MLS listing disclosures (sometimes disclosed)
      'site:realtor.com "{address}" special assessment',
      'site:homes.com "{address}" HOA assessment',

      // Community and HOA searches
      '"{community}" HOA special assessment',
      '"{community}" special assessment 2025 2026',
      '"{zip}" HOA assessment news'
    ],
    prioritySources: ['hoadata.org', 'propertyshark.com', 'realtor.com', 'HOA disclosure documents'],
    extractionPatterns: {
      regexPatterns: [
        /HOA.*?\$?([\d,]+)/i,
        /special assessment.*?\$?([\d,]+)/i,
        /\$?([\d,]+)\/mo.*?HOA/i,
        /one-time.*?assessment.*?\$?([\d,]+)/i,
        /pending.*?assessment/i
      ],
      textMarkers: ['HOA fee', 'special assessment', 'assessment', 'HOA', 'one-time assessment', 'pending assessment', 'approved assessment', 'condo fees']
    },
    expectedSuccessRate: 0.40,
    confidenceThreshold: 'low',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Special assessments often NOT publicly disclosed - contact HOA directly for verification. MLS listings sometimes disclose pending/recent assessments. Includes year-specific queries (2025/2026) for recent assessment news. One-time vs recurring assessment detection.'
  },

  // ==========================================
  // MARKET PERFORMANCE (Fields 169-181)
  // Repurposed 2026-01-11: Fields 169-174 changed from view counts to market metrics
  // ==========================================

  169: {
    fieldId: 169,
    label: 'Months of Inventory',
    category: 'performance',
    searchQueries: [
      'site:movoto.com "{city}, {state}" months inventory',
      'site:estately.com "{city}" market supply',
      'site:homes.com "{city}" inventory months',
      'site:rockethomes.com "{city}" months supply',
      'site:realtor.com/local/{zip}',
      'site:realtor.com/realestateandhomes-search/{city}_{state}/overview',
      'site:redfin.com/news/data-center/{state}',
      'site:noradarealestate.com "{city}" months inventory',
      '"{city}, {state}" months of inventory supply 2026'
    ],
    prioritySources: ['movoto.com', 'estately.com', 'homes.com', 'rockethomes.com', 'realtor.com', 'redfin.com', 'noradarealestate.com'],
    extractionPatterns: {
      regexPatterns: [
        /([\d\.]+)\s*months?\s+of\s+(inventory|supply)/i,
        /inventory[:\s]*([\d\.]+)\s*months?/i,
        /supply[:\s]*([\d\.]+)\s*months?/i
      ],
      textMarkers: ['months of inventory', 'months of supply', 'inventory level', 'months supply']
    },
    expectedSuccessRate: 0.85,
    confidenceThreshold: 'high',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: '<3 months = Seller\'s Market, 3-6 = Balanced, >6 = Buyer\'s Market. CRITICAL market health indicator.'
  },

  170: {
    fieldId: 170,
    label: 'New Listings (30d)',
    category: 'performance',
    searchQueries: [
      'site:movoto.com "{city}, {state}" new listings',
      'site:estately.com "{city}" recently listed',
      'site:homes.com "{city}" new homes for sale',
      'site:realtor.com/local/{zip}',
      'site:redfin.com/news/data-center/{state} "{city}"',
      '"{city}, {state}" new listings last 30 days 2026'
    ],
    prioritySources: ['movoto.com', 'estately.com', 'homes.com', 'realtor.com', 'redfin.com'],
    extractionPatterns: {
      regexPatterns: [
        /([\d,]+)\s*new\s+listings?/i,
        /recently\s+listed[:\s]*([\d,]+)/i,
        /([\d,]+)\s*homes?\s+listed/i
      ],
      textMarkers: ['new listings', 'recently listed', 'newly listed', 'fresh inventory']
    },
    expectedSuccessRate: 0.80,
    confidenceThreshold: 'medium',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'Count of new listings in last 30 days. Rising = increasing supply.'
  },

  171: {
    fieldId: 171,
    label: 'Homes Sold (30d)',
    category: 'performance',
    searchQueries: [
      'site:movoto.com "{city}, {state}" recently sold',
      'site:estately.com "{city}" sold homes',
      'site:realtor.com/local/{zip}',
      'site:redfin.com/news/data-center/{state} "{city}"',
      'site:rockethomes.com "{city}" closed sales',
      '"{city}, {state}" homes sold last 30 days 2026'
    ],
    prioritySources: ['movoto.com', 'estately.com', 'realtor.com', 'redfin.com', 'rockethomes.com'],
    extractionPatterns: {
      regexPatterns: [
        /([\d,]+)\s*(homes?|properties)\s+sold/i,
        /closed\s+sales?[:\s]*([\d,]+)/i,
        /sold[:\s]*([\d,]+)\s*homes?/i
      ],
      textMarkers: ['homes sold', 'recently sold', 'closed sales', 'properties sold']
    },
    expectedSuccessRate: 0.80,
    confidenceThreshold: 'medium',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'Count of homes sold in last 30 days. Rising = strong demand.'
  },

  172: {
    fieldId: 172,
    label: 'Median DOM (ZIP)',
    category: 'performance',
    searchQueries: [
      'site:movoto.com "{city}, {state}" days on market',
      'site:realtor.com/local/{zip}',
      'site:redfin.com/zipcode/{zip}',
      'site:redfin.com/news/data-center/{state} "{city}"',
      'site:homes.com "{city}" median days market',
      '"{city}, {state}" median days on market 2026'
    ],
    prioritySources: ['movoto.com', 'realtor.com', 'redfin.com', 'homes.com'],
    extractionPatterns: {
      regexPatterns: [
        /median\s+days?\s+on\s+market[:\s]*([\d]+)/i,
        /days?\s+on\s+market[:\s]*([\d]+)/i,
        /([\d]+)\s*days?\s+to\s+sell/i
      ],
      textMarkers: ['median days on market', 'days on market', 'DOM', 'days to sell']
    },
    expectedSuccessRate: 0.75,
    confidenceThreshold: 'medium',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'ZIP-level median days on market. <20 days = hot market, >60 days = slow market.'
  },

  173: {
    fieldId: 173,
    label: 'Price Reduced %',
    category: 'performance',
    searchQueries: [
      'site:realtor.com/local/{zip}',
      'site:redfin.com/zipcode/{zip}',
      'site:redfin.com/news/data-center/{state} "{city}"',
      'site:movoto.com "{city}" price reduced',
      '"{city}, {state}" price reductions percentage 2026'
    ],
    prioritySources: ['realtor.com', 'redfin.com', 'movoto.com'],
    extractionPatterns: {
      regexPatterns: [
        /([\d\.]+)%.*?price\s+redu/i,
        /price\s+redu.*?([\d\.]+)%/i,
        /([\d\.]+)%.*?listings.*?reduced/i
      ],
      textMarkers: ['price reduced', 'price reductions', 'price cuts', 'reduced price']
    },
    expectedSuccessRate: 0.70,
    confidenceThreshold: 'medium',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'Percentage of active listings with price reductions. High % = overpriced market or cooling demand.'
  },

  174: {
    fieldId: 174,
    label: 'Homes Under Contract',
    category: 'performance',
    searchQueries: [
      'site:realtor.com/local/{zip}',
      'site:redfin.com/zipcode/{zip}',
      'site:redfin.com/news/data-center/{state} "{city}"',
      'site:movoto.com "{city}" pending sales',
      '"{city}, {state}" homes under contract 2026'
    ],
    prioritySources: ['realtor.com', 'redfin.com', 'movoto.com'],
    extractionPatterns: {
      regexPatterns: [
        /([\d,]+)\s*under\s+contract/i,
        /([\d,]+)\s*pending/i,
        /contract[:\s]*([\d,]+)/i
      ],
      textMarkers: ['under contract', 'pending', 'pending sales', 'accepted offers']
    },
    expectedSuccessRate: 0.75,
    confidenceThreshold: 'medium',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'Count of homes with accepted offers. High count = competitive market.'
  },

  175: {
    fieldId: 175,
    label: 'Market Type',
    category: 'performance',
    searchQueries: [
      'site:movoto.com "{city}, {state}" buyer seller market',
      'site:realtor.com/local/{zip}',
      'site:redfin.com/zipcode/{zip}',
      'site:redfin.com/news/data-center/{state} "{city}"',
      'site:noradarealestate.com "{city}" market analysis',
      '"{city}, {state}" buyer market OR seller market 2026'
    ],
    prioritySources: ['movoto.com', 'realtor.com', 'redfin.com', 'noradarealestate.com'],
    extractionPatterns: {
      regexPatterns: [
        /buyer'?s market|seller'?s market|balanced market|neutral market/i,
        /market\s+(favors|advantages)\s+(buyers|sellers)/i,
        /months?\s+of\s+supply[:\s]*([\d\.]+)/i
      ],
      textMarkers: ['Buyer\'s Market', 'Seller\'s Market', 'Balanced Market', 'months of supply', 'market conditions']
    },
    expectedSuccessRate: 0.90,
    confidenceThreshold: 'high',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'Market classification. Months of supply indicator: <3 = Seller\'s, 3-6 = Balanced, >6 = Buyer\'s.'
  },

  176: {
    fieldId: 176,
    label: 'Avg Sale-to-List %',
    category: 'performance',
    searchQueries: [
      'site:movoto.com "{city}" sale to list',
      'site:realtor.com/local/{zip}',
      'site:redfin.com/zipcode/{zip}',
      'site:redfin.com/news/data-center/{state} "{city}"',
      'site:homes.com "{city}" sale to list ratio',
      '"{city}, {state}" sale to list percentage 2026'
    ],
    prioritySources: ['movoto.com', 'realtor.com', 'redfin.com', 'homes.com'],
    extractionPatterns: {
      regexPatterns: [
        /sale-to-list.*?([\d\.]+)%/i,
        /sold.*?([\d\.]+)%.*?(asking|list)/i,
        /([\d\.]+)%.*?of.*?(asking|list)/i
      ],
      textMarkers: ['Sale-to-List', 'sold above asking', 'sold below asking', 'asking price']
    },
    expectedSuccessRate: 0.85,
    confidenceThreshold: 'high',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: '>100% = bidding wars (Seller\'s Market), <100% = negotiations (Buyer\'s Market).'
  },

  177: {
    fieldId: 177,
    label: 'Avg Days to Pending',
    category: 'performance',
    searchQueries: [
      'site:movoto.com "{city}" days to pending',
      'site:realtor.com/local/{zip}',
      'site:redfin.com/zipcode/{zip}',
      'site:redfin.com/news/data-center/{state} "{city}"',
      '"{city}, {state}" average days pending 2026'
    ],
    prioritySources: ['movoto.com', 'realtor.com', 'redfin.com'],
    extractionPatterns: {
      regexPatterns: [
        /([\d]+)\s*days?\s+to\s+pending/i,
        /pending\s+in\s+([\d]+)\s*days?/i,
        /avg\s+days\s+to\s+contract[:\s]*([\d]+)/i
      ],
      textMarkers: ['days to pending', 'pending in', 'days to contract']
    },
    expectedSuccessRate: 0.75,
    confidenceThreshold: 'medium',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'Average days from listing to pending. <10 = very competitive, >30 = slower market.'
  },

  178: {
    fieldId: 178,
    label: 'Multiple Offers Likelihood',
    category: 'performance',
    searchQueries: [
      'site:movoto.com "{city}" multiple offers',
      'site:realtor.com/local/{zip}',
      'site:redfin.com/zipcode/{zip}',
      '"{city}, {state}" bidding wars 2026'
    ],
    prioritySources: ['movoto.com', 'realtor.com', 'redfin.com'],
    extractionPatterns: {
      regexPatterns: [
        /multiple\s+offers?/i,
        /bidding\s+wars?/i,
        /competitive\s+offers?/i
      ],
      textMarkers: ['multiple offers', 'bidding wars', 'competitive offers']
    },
    expectedSuccessRate: 0.60,
    confidenceThreshold: 'medium',
    dataLevel: 'zip',
    fallbackToLLM: true,
    requiresFields: [175, 176, 177],
    notes: 'LLM infers from: Market Type (175), Sale-to-List % (176), Days to Pending (177). Direct mentions rare.'
  },

  179: {
    fieldId: 179,
    label: 'Appreciation %',
    category: 'performance',
    searchQueries: [
      'site:movoto.com "{city}" appreciation',
      'site:realtor.com/local/{zip}',
      'site:redfin.com/news/data-center/{state} "{city}"',
      'site:homes.com "{city}" home value trends',
      'site:neighborhoodscout.com "{city}" appreciation',
      '"{city}, {state}" home appreciation 2026'
    ],
    prioritySources: ['movoto.com', 'realtor.com', 'redfin.com', 'homes.com', 'neighborhoodscout.com'],
    extractionPatterns: {
      regexPatterns: [
        /([\d\.]+)%\s*appreciation/i,
        /appreciated\s+([\d\.]+)%/i,
        /([\d\.]+)%\s*year\s+over\s+year/i
      ],
      textMarkers: ['appreciation', 'YoY', 'year over year', 'home value increase']
    },
    expectedSuccessRate: 0.85,
    confidenceThreshold: 'high',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'Year-over-year appreciation percentage. Calculated field option: (Current Price - Last Sale Price) / Last Sale Price.'
  },

  180: {
    fieldId: 180,
    label: 'Price Trend',
    category: 'performance',
    searchQueries: [
      'site:movoto.com "{city}" price trends',
      'site:realtor.com/local/{zip}',
      'site:redfin.com/news/data-center/{state} "{city}"',
      'site:homes.com "{city}" market trends',
      'site:neighborhoodscout.com "{city}" trends',
      '"{city}, {state}" home prices rising falling 2026'
    ],
    prioritySources: ['movoto.com', 'realtor.com', 'redfin.com', 'homes.com', 'neighborhoodscout.com'],
    extractionPatterns: {
      regexPatterns: [
        /falling|declining|dropping|decreasing/i,
        /stable|flat|unchanged|steady/i,
        /rising|increasing|growing|climbing|appreciating/i,
        /([+-]?[\d\.]+)%\s*(YoY|year|annual)/i
      ],
      textMarkers: ['price trend', 'home values', 'appreciation', 'YoY', 'falling', 'rising', 'stable']
    },
    expectedSuccessRate: 0.90,
    confidenceThreshold: 'high',
    dataLevel: 'zip',
    fallbackToLLM: true,
    notes: 'LLM classifies as Falling/Stable/Rising. <-2% YoY = Falling, -2% to +2% = Stable, >+2% = Rising.'
  },

  181: {
    fieldId: 181,
    label: 'Rent Zestimate',
    category: 'performance',
    searchQueries: [
      'site:zillow.com "{address}" rent zestimate',
      'site:zillow.com "{address}" rental',
      'site:rentometer.com "{address}"',
      'site:zumper.com "{city}" rental rates',
      '"{address}" rental estimate 2026'
    ],
    prioritySources: ['zillow.com', 'rentometer.com', 'zumper.com'],
    extractionPatterns: {
      regexPatterns: [
        /rent\s+zestimate[:\s]*\$?([\d,]+)/i,
        /rental\s+estimate[:\s]*\$?([\d,]+)/i,
        /\$?([\d,]+)\/mo/i
      ],
      textMarkers: ['Rent Zestimate', 'rental estimate', 'rental value', '/mo']
    },
    expectedSuccessRate: 0.80,
    confidenceThreshold: 'medium',
    dataLevel: 'address',
    fallbackToLLM: true,
    notes: 'Property-specific rental estimate from Zillow. Used for Field 99 (Rental Yield) calculation.'
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
