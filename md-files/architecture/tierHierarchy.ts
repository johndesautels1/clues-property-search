/**
 * ══════════════════════════════════════════════════════════════════════════════
 * OLIVIA CMA - Data Source Tier Hierarchy & Firing Order
 * John E. Desautels & Associates
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * 5-TIER HIERARCHY (Lower number = Higher authority)
 * ──────────────────────────────────────────────────
 * TIER 1: Stellar MLS + Government websites (AUTHORITATIVE - NEVER overwritten)
 * TIER 2: Google APIs (Geocode, Places, Distance, Street View)
 * TIER 3: Other Paid/Free APIs (WalkScore → EPA Radon)
 * TIER 4: Primary LLM Web Search (Perplexity + Gemini)
 * TIER 5: Secondary LLM Web Search (Grok, Claude Opus, GPT-4o, Claude Sonnet)
 * 
 * CRITICAL RULE: Lower tier CANNOT overwrite data filled by upper tier
 * 
 * LLM MASTER FIRING ORDER
 * ──────────────────────────────────────────────────
 * 1. PERPLEXITY    (Tier 4) - Fires first
 * 2. GROK          (Tier 5)
 * 3. CLAUDE OPUS   (Tier 5)
 * 4. GPT-4o       (Tier 5)
 * 5. CLAUDE SONNET (Tier 5) - Tier 5 cleanup (catches missed fields)
 * 6. GEMINI        (Tier 4) - ABSOLUTE LAST - verification pass (can upgrade Tier 5 data)
 * 
 * ALL LLMs MUST:
 * - Use web_search tool (no knowledge-only responses)
 * - Cite source URL for every data point
 * - Return "DATA NOT FOUND" if search yields no result - NEVER fabricate
 * - Follow anti-hallucination rules strictly
 * 
 * ══════════════════════════════════════════════════════════════════════════════
 */

// ============================================
// TIER DEFINITIONS
// ============================================

// ============================================
// TIER 1: AUTHORITATIVE (MLS + Government)
// ============================================
export const TIER_1_AUTHORITATIVE = {
  tier: 1,
  name: 'Authoritative Sources (MLS + Government)',
  canBeOverwritten: false,  // NEVER overwritten by lower tiers
  sources: [
    'STELLAR_MLS',
    'COUNTY_RECORDS',      // County Property Appraiser
    'GOVT_PERMITS',        // County permit records
    'GOVT_TAX_COLLECTOR',  // Tax collector websites
  ]
} as const;

// ============================================
// TIER 2: GOOGLE APIs
// ============================================
export const TIER_2_GOOGLE_APIS = {
  tier: 2,
  name: 'Google APIs',
  canBeOverwritten: false,  // Only TIER_1 can overwrite
  sources: [
    'GOOGLE_GEOCODE_API',
    'GOOGLE_PLACES_API',
    'GOOGLE_DISTANCE_API',
    'GOOGLE_STREETVIEW_API',
  ]
} as const;

// ============================================
// TIER 3: OTHER PAID/FREE APIs
// ============================================
export const TIER_3_OTHER_APIS = {
  tier: 3,
  name: 'Paid/Free APIs',
  canBeOverwritten: false,  // Only TIER_1 and TIER_2 can overwrite
  sources: [
    'WALKSCORE_API',
    'SCHOOLDIGGER_API',
    'FEMA_FLOOD_API',
    'AIRNOW_API',
    'HOWLOUD_API',
    'WEATHER_API',
    'FBI_CRIME_API',
    'INTERNAL_CALCULATION',
    'CENSUS_API',
    'NOAA_CLIMATE_API',
    'NOAA_STORM_API',
    'NOAA_SEALEVEL_API',
    'USGS_ELEVATION_API',
    'USGS_EARTHQUAKE_API',
    'EPA_FRS_API',
    'EPA_RADON_API',
  ]
} as const;

// ============================================
// TIER 4: PERPLEXITY + GEMINI (Primary LLM Web Search)
// NOTE: Perplexity fires FIRST, Gemini fires ABSOLUTE LAST (verification pass)
// ============================================
export const TIER_4_PRIMARY_LLM = {
  tier: 4,
  name: 'Primary LLM Web Search (Perplexity + Gemini)',
  canBeOverwritten: false,  // Only TIER_1, TIER_2, TIER_3 can overwrite
  sources: [
    'PERPLEXITY',
    'GEMINI',
  ]
} as const;

// ============================================
// TIER 5: OTHER LLMs (Secondary - cannot overwrite Tier 4)
// ============================================
export const TIER_5_SECONDARY_LLM = {
  tier: 5,
  name: 'Secondary LLM Web Search',
  canBeOverwritten: false,  // Only TIER_1-4 can overwrite
  sources: [
    'GROK',
    'CLAUDE_OPUS',
    'GPT_5_2',
    'CLAUDE_SONNET',
  ]
} as const;

// ============================================
// MASTER FIRING ORDER (ALL LLMs)
// This is the EXACT sequence in which LLMs are called
// Gemini is LAST as final verification pass (can overwrite Tier 5)
// ============================================
export const LLM_FIRING_ORDER = [
  'PERPLEXITY',    // 1st - Tier 4 primary
  'GROK',          // 2nd - Tier 5
  'CLAUDE_OPUS',   // 3rd - Tier 5
  'GPT_5_2',       // 4th - Tier 5
  'CLAUDE_SONNET', // 5th - Tier 5 cleanup (catches Tier 5 misses)
  'GEMINI',        // 6th - ABSOLUTE LAST - Tier 4 verification pass (can upgrade Tier 5 data)
] as const;

// ============================================
// SOURCE TO TIER MAPPING
// ============================================

export type DataSourceId = 
  | typeof TIER_1_AUTHORITATIVE.sources[number]
  | typeof TIER_2_GOOGLE_APIS.sources[number]
  | typeof TIER_3_OTHER_APIS.sources[number]
  | typeof TIER_4_PRIMARY_LLM.sources[number]
  | typeof TIER_5_SECONDARY_LLM.sources[number];

export function getSourceTier(sourceId: string): number {
  if (TIER_1_AUTHORITATIVE.sources.includes(sourceId as any)) return 1;
  if (TIER_2_GOOGLE_APIS.sources.includes(sourceId as any)) return 2;
  if (TIER_3_OTHER_APIS.sources.includes(sourceId as any)) return 3;
  if (TIER_4_PRIMARY_LLM.sources.includes(sourceId as any)) return 4;
  if (TIER_5_SECONDARY_LLM.sources.includes(sourceId as any)) return 5;
  return 999; // Unknown source
}

// ============================================
// ANTI-OVERWRITE ENFORCEMENT
// ============================================

export interface FieldValue {
  value: any;
  sourceTier: number;
  sourceId: string;
  timestamp: string;
  confidence: 'VERIFIED' | 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * CRITICAL: Determines if a new value can overwrite existing value
 * RULE: Lower tier (higher number) CANNOT overwrite higher tier (lower number)
 */
export function canOverwrite(
  existingValue: FieldValue | null,
  newSourceId: string
): boolean {
  // If no existing value, always allow
  if (!existingValue || existingValue.value === null || existingValue.value === undefined) {
    return true;
  }
  
  const existingTier = existingValue.sourceTier;
  const newTier = getSourceTier(newSourceId);
  
  // RULE: Only same tier or higher priority (lower number) can overwrite
  return newTier <= existingTier;
}

/**
 * Attempts to set a field value, respecting tier hierarchy
 * Returns true if value was set, false if blocked by higher-tier data
 */
export function setFieldValue(
  fieldStore: Record<string, FieldValue>,
  fieldId: string,
  value: any,
  sourceId: string,
  confidence: FieldValue['confidence'] = 'MEDIUM'
): boolean {
  const existing = fieldStore[fieldId] || null;
  
  if (!canOverwrite(existing, sourceId)) {
    // Log blocked attempt for debugging
    console.log(`[BLOCKED] ${sourceId} (Tier ${getSourceTier(sourceId)}) cannot overwrite ${fieldId} from ${existing?.sourceId} (Tier ${existing?.sourceTier})`);
    return false;
  }
  
  fieldStore[fieldId] = {
    value,
    sourceTier: getSourceTier(sourceId),
    sourceId,
    timestamp: new Date().toISOString(),
    confidence
  };
  
  return true;
}

// ============================================
// LLM FIRING ORDER CONTROLLER
// ============================================

export interface LLMFireConfig {
  llmId: typeof LLM_FIRING_ORDER[number];
  searchQuery: string;
  targetFields: string[];
  antiHallucinationRules: AntiHallucinationRule[];
}

export interface AntiHallucinationRule {
  rule: string;
  enforcement: 'STRICT' | 'WARN';
}

export const ANTI_HALLUCINATION_RULES: AntiHallucinationRule[] = [
  { rule: 'MUST use web_search tool - no knowledge-only responses', enforcement: 'STRICT' },
  { rule: 'MUST cite source URL for every data point', enforcement: 'STRICT' },
  { rule: 'Return "DATA NOT FOUND" if search yields no result - NEVER fabricate', enforcement: 'STRICT' },
  { rule: 'Do not extrapolate or estimate - only return explicit values found', enforcement: 'STRICT' },
  { rule: 'Cross-reference minimum 2 sources for CRITICAL fields', enforcement: 'STRICT' },
  { rule: 'Flag confidence level: VERIFIED (2+ sources match) / HIGH (1 authoritative) / MEDIUM (1 source) / LOW (partial match)', enforcement: 'STRICT' },
  { rule: 'Never round or approximate numbers - use exact values from source', enforcement: 'STRICT' },
  { rule: 'Include retrieval timestamp with all data', enforcement: 'WARN' },
];

/**
 * Determines which fields still need data after upper tiers have fired
 */
export function getUnfilledFields(
  fieldStore: Record<string, FieldValue>,
  allFieldIds: string[]
): string[] {
  return allFieldIds.filter(fieldId => {
    const existing = fieldStore[fieldId];
    return !existing || existing.value === null || existing.value === undefined || existing.value === 'DATA NOT FOUND';
  });
}

/**
 * Generates LLM firing queue based on remaining unfilled fields
 * Uses MASTER FIRING ORDER: Perplexity → Grok → Claude Opus → GPT-4o → Claude Sonnet → Gemini
 */
export function generateLLMFiringQueue(
  fieldStore: Record<string, FieldValue>,
  allFieldIds: string[],
  propertyAddress: string,
  mlsNumber?: string
): LLMFireConfig[] {
  const unfilledFields = getUnfilledFields(fieldStore, allFieldIds);
  
  if (unfilledFields.length === 0) {
    return []; // All fields filled by Tier 1-3
  }
  
  const queue: LLMFireConfig[] = [];
  
  // Use MASTER FIRING ORDER - Gemini fires LAST as verification pass
  for (const llmId of LLM_FIRING_ORDER) {
    queue.push({
      llmId: llmId as any,
      searchQuery: mlsNumber 
        ? `${mlsNumber} MLS listing property details`
        : `${propertyAddress} property listing details`,
      targetFields: [...unfilledFields], // Each LLM tries all unfilled
      antiHallucinationRules: ANTI_HALLUCINATION_RULES
    });
  }
  
  return queue;
}

// ============================================
// WEB SEARCH TEMPLATES FOR LLMs
// ============================================

export const LLM_SEARCH_TEMPLATES = {
  // Primary property search - broker sites first
  BROKER_MLS: '{mlsNumber} MLS listing',
  BROKER_ADDRESS: '"{address}" listing florida broker',
  BROKER_EXPANDED: '"{address}" MLS {county} county real estate',
  
  // Specific portal searches (fallback after broker)
  HOMES_COM: '"{address}" site:homes.com',
  REDFIN: '"{address}" site:redfin.com',
  ZILLOW: '"{address}" site:zillow.com',
  REALTOR: '"{address}" site:realtor.com',
  TRULIA: '"{address}" site:trulia.com',
  
  // Field-specific searches
  TAX_HISTORY: '"{address}" property tax history {county} county',
  PERMITS: '"{address}" building permits {county}',
  FLOOD_ZONE: '"{address}" FEMA flood zone',
  SCHOOL_RATINGS: '"{address}" assigned schools greatschools rating',
  HOA: '"{address}" HOA fees monthly',
  ZESTIMATE: '"{address}" zillow zestimate home value',
  REDFIN_ESTIMATE: '"{address}" redfin estimate',
  MARKET_DATA: '"{address}" days on market listing history',
  CRIME: '"{address}" neighborhood crime rate safety',
};

// ============================================
// FIELD-TO-SOURCE PRIORITY MAPPING
// ============================================

export const FIELD_SOURCE_PRIORITY: Record<string, string[]> = {
  // Address fields - MLS first, then geocode
  address: ['STELLAR_MLS', 'GOOGLE_GEOCODE_API', 'PERPLEXITY'],
  city: ['STELLAR_MLS', 'GOOGLE_GEOCODE_API', 'PERPLEXITY'],
  zipCode: ['STELLAR_MLS', 'GOOGLE_GEOCODE_API', 'PERPLEXITY'],
  county: ['STELLAR_MLS', 'GOOGLE_GEOCODE_API', 'PERPLEXITY'],
  
  // Pricing - MLS, then LLMs scrape portals
  listPrice: ['STELLAR_MLS', 'PERPLEXITY', 'GROK', 'CLAUDE_SONNET'],
  pricePerSqft: ['INTERNAL_CALCULATION'],
  zestimate: ['PERPLEXITY', 'GROK', 'CLAUDE_OPUS', 'CLAUDE_SONNET'],
  redfinEstimate: ['PERPLEXITY', 'GROK', 'CLAUDE_OPUS', 'CLAUDE_SONNET'],
  
  // Property basics - MLS first
  bedrooms: ['STELLAR_MLS', 'PERPLEXITY', 'CLAUDE_SONNET'],
  bathroomsFull: ['STELLAR_MLS', 'PERPLEXITY', 'CLAUDE_SONNET'],
  livingAreaSqft: ['STELLAR_MLS', 'PERPLEXITY', 'CLAUDE_SONNET'],
  lotSizeSqft: ['STELLAR_MLS', 'COUNTY_RECORDS', 'PERPLEXITY'],
  yearBuilt: ['STELLAR_MLS', 'COUNTY_RECORDS', 'PERPLEXITY'],
  
  // Taxes - County first, then scrape
  currentYearTax: ['COUNTY_RECORDS', 'STELLAR_MLS', 'PERPLEXITY', 'CLAUDE_SONNET'],
  taxAssessmentTotal: ['COUNTY_RECORDS', 'PERPLEXITY', 'CLAUDE_SONNET'],
  
  // Schools - API first
  elementaryRating: ['SCHOOLDIGGER_API', 'PERPLEXITY', 'CLAUDE_SONNET'],
  middleRating: ['SCHOOLDIGGER_API', 'PERPLEXITY', 'CLAUDE_SONNET'],
  highRating: ['SCHOOLDIGGER_API', 'PERPLEXITY', 'CLAUDE_SONNET'],
  
  // Location scores - APIs
  walkScore: ['WALKSCORE_API', 'PERPLEXITY', 'CLAUDE_SONNET'],
  bikeScore: ['WALKSCORE_API', 'PERPLEXITY', 'CLAUDE_SONNET'],
  transitScore: ['WALKSCORE_API', 'PERPLEXITY', 'CLAUDE_SONNET'],
  
  // Distances - Google APIs
  distanceToBeach: ['GOOGLE_DISTANCE_API', 'GOOGLE_PLACES_API', 'PERPLEXITY'],
  distanceToDowntown: ['GOOGLE_DISTANCE_API', 'PERPLEXITY'],
  distanceToAirport: ['GOOGLE_DISTANCE_API', 'PERPLEXITY'],
  
  // Environmental - APIs first
  floodFactor: ['FEMA_FLOOD_API', 'PERPLEXITY', 'CLAUDE_SONNET'],
  floodZone: ['FEMA_FLOOD_API', 'STELLAR_MLS', 'PERPLEXITY'],
  elevationAboveSeaLevel: ['USGS_ELEVATION_API', 'PERPLEXITY'],
  airQualityFactor: ['AIRNOW_API', 'PERPLEXITY'],
  
  // Crime - FBI API first
  crimeScore: ['FBI_CRIME_API', 'PERPLEXITY', 'CLAUDE_SONNET'],
  violentCrimeRate: ['FBI_CRIME_API', 'PERPLEXITY'],
  propertyCrimeRate: ['FBI_CRIME_API', 'PERPLEXITY'],
  
  // Demographics - Census API
  avgHouseholdIncome: ['CENSUS_API', 'PERPLEXITY', 'CLAUDE_SONNET'],
  medianAge: ['CENSUS_API', 'PERPLEXITY'],
  percentCollegeGrads: ['CENSUS_API', 'PERPLEXITY'],
  
  // Market data - LLMs scrape
  viewsZillow: ['PERPLEXITY', 'GROK', 'CLAUDE_SONNET'],
  viewsRedfin: ['PERPLEXITY', 'GROK', 'CLAUDE_SONNET'],
  marketType: ['PERPLEXITY', 'GROK', 'CLAUDE_SONNET'],
  daysOnMarket: ['STELLAR_MLS', 'PERPLEXITY', 'CLAUDE_SONNET'],
  
  // Permits - County records
  permitHistory: ['COUNTY_RECORDS', 'GOVT_PERMITS', 'PERPLEXITY'],
  openPermits: ['COUNTY_RECORDS', 'GOVT_PERMITS', 'PERPLEXITY'],
};

// ============================================
// EXECUTION CONTROLLER
// ============================================

export interface ExecutionPlan {
  tier1Calls: { source: string; fields: string[] }[];  // Stellar MLS + Govt
  tier2Calls: { source: string; fields: string[] }[];  // Google APIs
  tier3Calls: { source: string; fields: string[] }[];  // Other APIs
  tier4And5Queue: LLMFireConfig[];                     // All LLMs in firing order
}

/**
 * Generates complete execution plan for fetching all property data
 * Respects 5-tier hierarchy with master LLM firing order
 */
export function generateExecutionPlan(
  allFieldIds: string[],
  propertyAddress: string,
  mlsNumber?: string
): ExecutionPlan {
  const tier1Calls: { source: string; fields: string[] }[] = [];
  const tier2Calls: { source: string; fields: string[] }[] = [];
  const tier3Calls: { source: string; fields: string[] }[] = [];
  
  // Group fields by their primary source
  const sourceToFields: Record<string, string[]> = {};
  
  for (const fieldId of allFieldIds) {
    const priorities = FIELD_SOURCE_PRIORITY[fieldId] || ['CLAUDE_SONNET'];
    const primarySource = priorities[0];
    
    if (!sourceToFields[primarySource]) {
      sourceToFields[primarySource] = [];
    }
    sourceToFields[primarySource].push(fieldId);
  }
  
  // Separate into tiers
  for (const [source, fields] of Object.entries(sourceToFields)) {
    const tier = getSourceTier(source);
    if (tier === 1) {
      tier1Calls.push({ source, fields });
    } else if (tier === 2) {
      tier2Calls.push({ source, fields });
    } else if (tier === 3) {
      tier3Calls.push({ source, fields });
    }
    // Tier 4 & 5 handled via LLM queue after API tiers complete
  }
  
  return {
    tier1Calls,
    tier2Calls,
    tier3Calls,
    tier4And5Queue: [] // Populated after Tier 1-3 complete
  };
}

// ============================================
// EXPORTS
// ============================================

export const TIERS = {
  TIER_1: TIER_1_AUTHORITATIVE,
  TIER_2: TIER_2_GOOGLE_APIS,
  TIER_3: TIER_3_OTHER_APIS,
  TIER_4: TIER_4_PRIMARY_LLM,
  TIER_5: TIER_5_SECONDARY_LLM,
  LLM_FIRING_ORDER
};
