/**
 * CLUES Property Dashboard - Tiered Arbitration Service (API Version)
 *
 * SINGLE SOURCE OF TRUTH for data source precedence and conflict resolution.
 *
 * Tier Hierarchy (Higher tier ALWAYS wins):
 *   Tier 1: Stellar MLS & Claude PDF Parser (Primary trusted sources - 100% reliability)
 *   Tier 2: Google APIs (Geocode, Places, Distance Matrix - 95% reliability)
 *   Tier 3: Paid/Free APIs (WalkScore, SchoolDigger, FEMA, AirNow, HowLoud, Weather, FBI Crime - 85-95% reliability)
 *   Tier 4: LLM Web Search (Perplexity, Grok, Claude Opus, GPT, Claude Sonnet, Gemini - 50-75% reliability)
 *
 * Key Principles:
 *   - Higher tier data NEVER gets overwritten by lower tier
 *   - Value normalization prevents false conflicts (e.g., "Condo" = "Condominium", "St Pete" = "Saint Pete")
 *   - LLM quorum voting for numeric/text fields when multiple LLMs return same value
 *   - Validation gates for all fields (price range, year range, geo coords, bathroom math)
 *   - Single-source hallucination protection (flag data from only one LLM)
 *   - Full audit trail with sources, confidence, and conflicts
 */

export type DataTier = 1 | 2 | 3 | 4;

export interface TierConfig {
  tier: DataTier;
  name: string;
  description: string;
  reliability: number;
}

export const DATA_TIERS: Record<string, TierConfig> = {
  'stellar-mls': { tier: 1, name: 'Stellar MLS', description: 'Primary MLS data source', reliability: 100 },
  'stellar-mls-pdf': { tier: 1, name: 'Stellar MLS PDF', description: 'Claude PDF parser (trusted)', reliability: 100 },
  'google-geocode': { tier: 2, name: 'Google Geocode', description: 'Address geocoding', reliability: 95 },
  'google-places': { tier: 2, name: 'Google Places', description: 'Nearby amenities', reliability: 95 },
  'google-distance': { tier: 2, name: 'Google Distance Matrix', description: 'Commute times', reliability: 95 },
  'google-maps': { tier: 2, name: 'Google Maps', description: 'Google Maps API', reliability: 95 },
  'walkscore': { tier: 3, name: 'WalkScore', description: 'Walkability scores', reliability: 90 },
  'schooldigger': { tier: 3, name: 'SchoolDigger', description: 'School ratings', reliability: 85 },
  'fema': { tier: 3, name: 'FEMA NFHL', description: 'Flood zones', reliability: 95 },
  'airnow': { tier: 3, name: 'AirNow', description: 'Air quality', reliability: 90 },
  'howloud': { tier: 3, name: 'HowLoud', description: 'Noise levels', reliability: 85 },
  'weather': { tier: 3, name: 'Weather API', description: 'Climate data', reliability: 85 },
  'fbi-crime': { tier: 3, name: 'FBI Crime Stats', description: 'Crime statistics', reliability: 90 },
  'crime': { tier: 3, name: 'FBI Crime Stats', description: 'Crime statistics', reliability: 90 },
  'perplexity': { tier: 4, name: 'Perplexity', description: 'LLM with web search', reliability: 75 },
  'grok': { tier: 4, name: 'Grok/xAI', description: 'LLM with real-time data', reliability: 70 },
  'claude-opus': { tier: 4, name: 'Claude Opus', description: 'High-quality LLM', reliability: 65 },
  'gpt': { tier: 4, name: 'GPT-4', description: 'OpenAI LLM', reliability: 60 },
  'claude-sonnet': { tier: 4, name: 'Claude Sonnet', description: 'Fast LLM fallback', reliability: 55 },
  'gemini': { tier: 4, name: 'Gemini', description: 'Google LLM', reliability: 50 },
};

/**
 * FIX #4 & #5: Pre-built lookup Maps for O(1) source tier and reliability lookups
 * Built once at module load instead of iterating Object.entries on every call
 */
const sourceTierLookup = new Map<string, DataTier>();
const sourceReliabilityLookup = new Map<string, number>();

// Build lookup maps at module initialization
for (const [key, config] of Object.entries(DATA_TIERS)) {
  sourceTierLookup.set(key, config.tier);
  sourceReliabilityLookup.set(key, config.reliability);
}

/**
 * FIX #4 & #5: Memoization cache for dynamic source name lookups
 */
const sourceTierCache = new Map<string, DataTier>();
const sourceReliabilityCache = new Map<string, number>();

/**
 * Default values for arbitration - centralized for consistency
 * FIX #12: Centralized defaults
 */
const ARBITRATION_DEFAULTS = {
  TIER: 4 as DataTier,
  RELIABILITY: 50,
  CONFIDENCE: 'Medium' as const,
  LLM_SOURCES: [] as string[],
} as const;

export interface FieldValue {
  value: any;
  source: string;
  confidence: 'High' | 'Medium' | 'Low';
  tier: DataTier;
  timestamp?: string;
  llmSources?: string[];
  hasConflict?: boolean;
  conflictValues?: Array<{ source: string; value: any }>;
  validationStatus?: 'passed' | 'failed' | 'warning';
  validationMessage?: string;
}

export interface AuditEntry {
  field: string;
  action: 'set' | 'skip' | 'override' | 'conflict' | 'validation_fail';
  source: string;
  tier: DataTier;
  value: any;
  previousValue?: any;
  previousSource?: string;
  reason: string;
  timestamp: string;
}

export interface ArbitrationResult {
  fields: Record<string, FieldValue>;
  conflicts: Array<{ field: string; values: Array<{ source: string; value: any; tier: DataTier }> }>;
  auditTrail: AuditEntry[];
  validationFailures: Array<{ field: string; value: any; reason: string }>;
  llmQuorumFields: Array<{ field: string; value: any; sources: string[]; quorumCount: number }>;
  singleSourceWarnings: Array<{ field: string; source: string }>;
}

/**
 * FIX #4: Optimized getSourceTier with O(1) Map lookup + memoization cache
 * Previously: O(n) iteration through Object.entries on every call
 * Now: O(1) Map lookup with fallback caching for dynamic names
 */
export function getSourceTier(sourceName: string): DataTier {
  // Check memoization cache first
  const cached = sourceTierCache.get(sourceName);
  if (cached !== undefined) return cached;

  const sourceKey = sourceName.toLowerCase().replace(/\s+/g, '-').replace('maps', 'geocode');

  // Try direct Map lookup first (O(1))
  const directLookup = sourceTierLookup.get(sourceKey);
  if (directLookup !== undefined) {
    sourceTierCache.set(sourceName, directLookup);
    return directLookup;
  }

  // Fallback: check for partial matches using pre-built keys
  let tier: DataTier = ARBITRATION_DEFAULTS.TIER;

  for (const key of sourceTierLookup.keys()) {
    if (sourceKey.includes(key) || key.includes(sourceKey)) {
      tier = sourceTierLookup.get(key)!;
      break;
    }
  }

  // Additional pattern matching
  if (tier === ARBITRATION_DEFAULTS.TIER) {
    const lowerName = sourceName.toLowerCase();
    if (lowerName.includes('google')) {
      tier = 2;
    } else if (['perplexity', 'grok', 'claude', 'gpt', 'gemini', 'anthropic', 'openai'].some(
      llm => lowerName.includes(llm)
    )) {
      tier = 4;
    }
  }

  // Cache the result for future lookups
  sourceTierCache.set(sourceName, tier);
  return tier;
}

/**
 * FIX #5: Optimized getSourceReliability with O(1) Map lookup + memoization cache
 * Previously: O(n) iteration through Object.entries on every call
 * Now: O(1) Map lookup with fallback caching for dynamic names
 */
export function getSourceReliability(sourceName: string): number {
  // Check memoization cache first
  const cached = sourceReliabilityCache.get(sourceName);
  if (cached !== undefined) return cached;

  const sourceKey = sourceName.toLowerCase().replace(/\s+/g, '-');

  // Try direct Map lookup first (O(1))
  const directLookup = sourceReliabilityLookup.get(sourceKey);
  if (directLookup !== undefined) {
    sourceReliabilityCache.set(sourceName, directLookup);
    return directLookup;
  }

  // Fallback: check for partial matches using pre-built keys
  for (const key of sourceReliabilityLookup.keys()) {
    if (sourceKey.includes(key) || key.includes(sourceKey)) {
      const reliability = sourceReliabilityLookup.get(key)!;
      sourceReliabilityCache.set(sourceName, reliability);
      return reliability;
    }
  }

  // Cache default and return
  sourceReliabilityCache.set(sourceName, ARBITRATION_DEFAULTS.RELIABILITY);
  return ARBITRATION_DEFAULTS.RELIABILITY;
}

export interface ValidationRule {
  fieldPattern: RegExp;
  validate: (value: any) => { valid: boolean; message?: string };
}

// Updated: 2025-11-30 - Added Stellar MLS field validations (139-168)
export const VALIDATION_RULES: ValidationRule[] = [
  {
    fieldPattern: /price|sale_price|listing_price|market_value|assessed_value|annual_cdd_fee/i,
    validate: (v) => {
      const num = typeof v === 'number' ? v : parseFloat(String(v).replace(/[$,]/g, ''));
      if (isNaN(num)) return { valid: false, message: 'Price must be a number' };
      if (num < 0) return { valid: false, message: 'Price cannot be negative' };
      if (num > 100000000) return { valid: false, message: 'Price too high (>$100M)' };
      return { valid: true };
    }
  },
  {
    fieldPattern: /year_built|tax_year/i,
    validate: (v) => {
      const year = typeof v === 'number' ? v : parseInt(String(v));
      if (isNaN(year)) return { valid: false, message: 'Year must be a number' };
      if (year < 1700) return { valid: false, message: 'Year too old (<1700)' };
      if (year > new Date().getFullYear() + 2) return { valid: false, message: 'Year in future' };
      return { valid: true };
    }
  },
  {
    fieldPattern: /latitude|lat$/i,
    validate: (v) => {
      const num = typeof v === 'number' ? v : parseFloat(String(v));
      if (isNaN(num)) return { valid: false, message: 'Latitude must be a number' };
      if (num < -90 || num > 90) return { valid: false, message: 'Latitude out of range (-90 to 90)' };
      return { valid: true };
    }
  },
  {
    fieldPattern: /longitude|lon$|lng$/i,
    validate: (v) => {
      const num = typeof v === 'number' ? v : parseFloat(String(v));
      if (isNaN(num)) return { valid: false, message: 'Longitude must be a number' };
      if (num < -180 || num > 180) return { valid: false, message: 'Longitude out of range (-180 to 180)' };
      return { valid: true };
    }
  },
  {
    fieldPattern: /bedrooms/i,
    validate: (v) => {
      const num = typeof v === 'number' ? v : parseInt(String(v));
      if (isNaN(num)) return { valid: false, message: 'Bedrooms must be a number' };
      if (num < 0 || num > 50) return { valid: false, message: 'Bedrooms out of range (0-50)' };
      return { valid: true };
    }
  },
  {
    fieldPattern: /bathrooms|full_bath|half_bath/i,
    validate: (v) => {
      const num = typeof v === 'number' ? v : parseFloat(String(v));
      if (isNaN(num)) return { valid: false, message: 'Bathrooms must be a number' };
      if (num < 0 || num > 30) return { valid: false, message: 'Bathrooms out of range (0-30)' };
      return { valid: true };
    }
  },
  {
    fieldPattern: /sqft|square_feet|living_area/i,
    validate: (v) => {
      const num = typeof v === 'number' ? v : parseFloat(String(v).replace(/[,]/g, ''));
      if (isNaN(num)) return { valid: false, message: 'Square footage must be a number' };
      if (num < 100) return { valid: false, message: 'Square footage too small (<100)' };
      if (num > 100000) return { valid: false, message: 'Square footage too large (>100,000)' };
      return { valid: true };
    }
  },
  {
    fieldPattern: /walk_score|transit_score|bike_score/i,
    validate: (v) => {
      const num = typeof v === 'number' ? v : parseInt(String(v));
      if (isNaN(num)) return { valid: false, message: 'Score must be a number' };
      if (num < 0 || num > 100) return { valid: false, message: 'Score out of range (0-100)' };
      return { valid: true };
    }
  },

  // ================================================================
  // STELLAR MLS FIELD VALIDATIONS (139-168) - Added 2025-11-30
  // ================================================================

  // Parking fields (139-143)
  {
    fieldPattern: /carport_spaces|assigned_parking_spaces|garage_spaces/i,
    validate: (v) => {
      const num = typeof v === 'number' ? v : parseInt(String(v));
      if (isNaN(num)) return { valid: false, message: 'Parking spaces must be a number' };
      if (num < 0 || num > 20) return { valid: false, message: 'Parking spaces out of range (0-20)' };
      return { valid: true };
    }
  },

  // Building fields (144-148)
  {
    fieldPattern: /floor_number|floors_in_unit/i,
    validate: (v) => {
      const num = typeof v === 'number' ? v : parseInt(String(v));
      if (isNaN(num)) return { valid: false, message: 'Floor number must be a number' };
      if (num < 0 || num > 200) return { valid: false, message: 'Floor number out of range (0-200)' };
      return { valid: true };
    }
  },
  {
    fieldPattern: /building_total_floors/i,
    validate: (v) => {
      const num = typeof v === 'number' ? v : parseInt(String(v));
      if (isNaN(num)) return { valid: false, message: 'Total floors must be a number' };
      if (num < 1 || num > 200) return { valid: false, message: 'Total floors out of range (1-200)' };
      return { valid: true };
    }
  },

  // Waterfront fields (155-159)
  {
    fieldPattern: /waterfront_feet/i,
    validate: (v) => {
      const num = typeof v === 'number' ? v : parseFloat(String(v));
      if (isNaN(num)) return { valid: false, message: 'Waterfront feet must be a number' };
      if (num < 0 || num > 10000) return { valid: false, message: 'Waterfront feet out of range (0-10,000)' };
      return { valid: true };
    }
  },

  // Leasing fields (160-165)
  {
    fieldPattern: /max_pet_weight/i,
    validate: (v) => {
      const num = typeof v === 'number' ? v : parseFloat(String(v));
      if (isNaN(num)) return { valid: false, message: 'Pet weight must be a number' };
      if (num < 0 || num > 500) return { valid: false, message: 'Pet weight out of range (0-500 lbs)' };
      return { valid: true };
    }
  },

  // Boolean Y/N fields (various Stellar MLS)
  {
    fieldPattern: /carport_yn|garage_attached_yn|building_elevator_yn|homestead_yn|cdd_yn|water_frontage_yn|water_access_yn|water_view_yn|can_be_leased_yn|lease_restrictions_yn|association_approval_yn/i,
    validate: (v) => {
      if (typeof v === 'boolean') return { valid: true };
      const str = String(v).toLowerCase().trim();
      const validBools = ['true', 'false', 'yes', 'no', 'y', 'n', '1', '0'];
      if (!validBools.includes(str)) {
        return { valid: false, message: 'Must be a boolean (Yes/No, True/False)' };
      }
      return { valid: true };
    }
  },
];

/**
 * FIX #6: Pre-build validation rule cache for common field patterns
 * Maps common field key patterns to their rules for O(1) lookup
 * Falls back to regex matching for unknown patterns
 */
const validationRuleCache = new Map<string, ValidationRule | null>();

/**
 * FIX #6: Optimized validateField with caching
 * Previously: O(n) linear scan through all VALIDATION_RULES on every call
 * Now: O(1) cache lookup for previously validated field keys
 */
/**
 * Normalize values to detect trivial variations that shouldn't be flagged as conflicts
 * Examples:
 * - "Condominium" vs "Condo" → both become "condo"
 * - "St Pete Beach" vs "Saint Pete Beach" → both become "st pete beach"
 * - "APT 203" vs "#203" → both become "203"
 * - "Pinellas County" vs "Pinellas" → both become "pinellas"
 * - "Central Air" vs "Central" → both become "central"
 * - "Wood" vs "Hardwood" → both become "wood"
 * - "Active" vs "For Sale" → both become "active"
 * - "Pinellas County Schools" vs "Pinellas County School District" → both become "pinellas schools"
 */
export function normalizeValueForComparison(value: any, fieldKey: string = ''): string {
  if (value === null || value === undefined) return '';

  let str = String(value).toLowerCase().trim();

  // Remove common abbreviation symbols and extra whitespace
  str = str.replace(/[#,\.]/g, '').replace(/\s+/g, ' ');

  // Property type normalizations
  if (fieldKey.includes('property_type') || fieldKey.includes('26_') || fieldKey.includes('ownership')) {
    if (str.includes('condo')) return 'condo';
    if (str.includes('single family')) return 'single-family';
    if (str.includes('townhouse') || str.includes('town home')) return 'townhouse';
  }

  // Address normalizations
  if (fieldKey.includes('address') || fieldKey.includes('1_')) {
    str = str.replace(/\bapt\b/g, '').replace(/\bunit\b/g, '').replace(/\bste\b/g, '');
    str = str.replace(/\bsaint\b/g, 'st').replace(/\bst\./g, 'st');
  }

  // County normalizations
  if (fieldKey.includes('county') || fieldKey.includes('7_')) {
    str = str.replace(/\bcounty\b/g, '');
  }

  // School district normalizations
  if (fieldKey.includes('school') || fieldKey.includes('63_')) {
    str = str.replace(/\bschool district\b/g, 'schools');
    str = str.replace(/\bcounty\b/g, '');
  }

  // HVAC normalizations
  if (fieldKey.includes('hvac') || fieldKey.includes('45_')) {
    str = str.replace(/\bair\b/g, '');
  }

  // Flooring normalizations
  if (fieldKey.includes('flooring') || fieldKey.includes('49_')) {
    str = str.replace(/\bhardwood\b/g, 'wood');
    str = str.replace(/\bluxury vinyl\b/g, 'vinyl');
  }

  // Status normalizations - "Active" and "For Sale" are the same
  if (fieldKey.includes('listing_status') || fieldKey.includes('4_')) {
    if (str.includes('sale') || str.includes('active')) return 'active';
    if (str.includes('pending')) return 'pending';
    if (str.includes('sold')) return 'sold';
  }

  // Price/money normalizations - ignore minor rounding differences
  if (fieldKey.includes('price') || fieldKey.includes('_per_sqft') || fieldKey.includes('11_')) {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      // Round to nearest $10 to ignore $1-2 differences
      return Math.round(num / 10).toString();
    }
  }

  // Address normalization - APT = Apt, ignore ", USA", Saint = St
  if (fieldKey.includes('address') || fieldKey.includes('1_') || fieldKey.includes('city') || fieldKey.includes('neighborhood')) {
    str = str.replace(/,\s*USA$/i, ''); // Remove ", USA"
    str = str.replace(/\bAPT\b/gi, 'Apt'); // APT → Apt
    str = str.replace(/\bApartment\b/gi, 'Apt'); // Apartment → Apt
    str = str.replace(/\bUnit\b/gi, 'Apt'); // Unit → Apt
    str = str.replace(/\bSaint\b/gi, 'St'); // Saint Pete Beach → St Pete Beach
    str = str.replace(/\bSt\.\s*/gi, 'St '); // St. → St (normalize periods)
  }

  // Property type - Residential = Single Family = Single Family Residence = Single Family Home
  if (fieldKey.includes('property_type') || fieldKey.includes('26_') || fieldKey.includes('ownership') || fieldKey.includes('34_')) {
    if (str.includes('condo')) return 'condo';
    if (str.includes('townhouse') || str.includes('townhome')) return 'townhouse';
    if (str.includes('single') || str.includes('residential') || str.includes('sfr')) return 'single family';
    if (str.includes('multi') || str.includes('duplex') || str.includes('triplex')) return 'multi-family';
  }

  // Walkability - semantic equivalence
  if (fieldKey.includes('walkability') || fieldKey.includes('75_')) {
    if (str.includes('moderate') || str.includes('somewhat')) return 'moderate';
    if (str.includes('very walkable') || str.includes('highly')) return 'high';
    if (str.includes('car-dependent') || str.includes('low')) return 'low';
  }

  // Risk levels - High = Very High for practical purposes
  if (fieldKey.includes('risk') || fieldKey.includes('hurricane') || fieldKey.includes('flood')) {
    if (str.includes('very high') || str.includes('high')) return 'high';
    if (str.includes('very low') || str.includes('low')) return 'low';
    if (str.includes('moderate') || str.includes('medium')) return 'moderate';
  }

  // Numeric estimates - round to nearest $100 for estimates (reduces noise)
  if (fieldKey.includes('estimate') || fieldKey.includes('median') || fieldKey.includes('rental') || fieldKey.includes('insurance')) {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      // Round to nearest $100 to ignore minor variations
      return Math.round(num / 100).toString();
    }
  }

  // Air Quality Index - round to nearest 10 to ignore 1-5 point differences
  if (fieldKey.includes('air_quality') || fieldKey.includes('aqi') || fieldKey.includes('101_')) {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      // Round to nearest 10 (27→30, 28→30, 32→30, 35→40, 44→40, 45→50)
      return (Math.round(num / 10) * 10).toString();
    }
  }

  return str.trim();
}

export function validateField(fieldKey: string, value: any): { valid: boolean; message?: string } {
  // Check cache first
  const cachedRule = validationRuleCache.get(fieldKey);
  if (cachedRule !== undefined) {
    // null means no rule matched for this field
    return cachedRule ? cachedRule.validate(value) : { valid: true };
  }

  // Find matching rule and cache it
  for (const rule of VALIDATION_RULES) {
    if (rule.fieldPattern.test(fieldKey)) {
      validationRuleCache.set(fieldKey, rule);
      return rule.validate(value);
    }
  }

  // No rule matched - cache null to avoid re-scanning
  validationRuleCache.set(fieldKey, null);
  return { valid: true };
}

export function arbitrateField(
  existingField: FieldValue | undefined,
  newValue: any,
  newSource: string,
  auditTrail: AuditEntry[],
  fieldKey: string = ''
): { result: FieldValue | null; action: 'set' | 'skip' | 'override' | 'conflict' | 'validation_fail' } {
  const newTier = getSourceTier(newSource);
  const timestamp = new Date().toISOString();

  // Reject null, undefined, empty, NaN, or invalid values
  if (newValue === null || newValue === undefined || newValue === '') {
    return { result: null, action: 'skip' };
  }

  // Reject NaN values (both number NaN and string "NaN")
  const strValue = String(newValue).trim().toLowerCase();
  if (strValue === 'nan' || (typeof newValue === 'number' && isNaN(newValue))) {
    console.warn(`[ARBITRATION] Rejecting NaN value for field ${fieldKey} from ${newSource}`);
    return { result: null, action: 'skip' };
  }

  if (!existingField) {
    const newField: FieldValue = {
      value: newValue,
      source: newSource,
      confidence: newTier <= 2 ? 'High' : newTier === 3 ? 'Medium' : 'Low',
      tier: newTier,
      timestamp,
      llmSources: newTier === 4 ? [newSource] : undefined,
    };

    auditTrail.push({
      field: '',
      action: 'set',
      source: newSource,
      tier: newTier,
      value: newValue,
      reason: 'Field was empty',
      timestamp,
    });

    return { result: newField, action: 'set' };
  }

  // Normalize values for comparison to avoid false conflicts
  // Coerce objects to strings first (fixes Grok's [object Object] bug)
  const safeNewValue = typeof newValue === 'object' && newValue !== null ? JSON.stringify(newValue) : newValue;
  const safeExistingValue = typeof existingField.value === 'object' && existingField.value !== null ? JSON.stringify(existingField.value) : existingField.value;

  const normalizedNew = normalizeValueForComparison(safeNewValue, fieldKey);
  const normalizedExisting = normalizeValueForComparison(safeExistingValue, fieldKey);
  const areValuesEquivalent = normalizedNew === normalizedExisting;

  if (newTier < existingField.tier) {
    const overrideField: FieldValue = {
      value: newValue,
      source: newSource,
      confidence: newTier <= 2 ? 'High' : 'Medium',
      tier: newTier,
      timestamp,
      hasConflict: !areValuesEquivalent,
      conflictValues: !areValuesEquivalent
        ? [{ source: existingField.source, value: existingField.value }]
        : undefined,
    };

    auditTrail.push({
      field: '',
      action: 'override',
      source: newSource,
      tier: newTier,
      value: newValue,
      previousValue: existingField.value,
      previousSource: existingField.source,
      reason: `Higher tier (${newTier}) overrides lower tier (${existingField.tier})`,
      timestamp,
    });

    return { result: overrideField, action: 'override' };
  }

  // Same tier but different values - check if it's a real conflict after normalization
  if (newTier === existingField.tier && !areValuesEquivalent) {
    if (newTier === 4) {
      // LLM conflict - add to conflict list only if this source+value combo doesn't already exist
      const existingConflicts = existingField.conflictValues || [];

      // Check for exact duplicates (same source + normalized value)
      const alreadyExists = existingConflicts.some(
        cv => cv.source === newSource && normalizeValueForComparison(cv.value, fieldKey) === normalizedNew
      );

      // Check for near-duplicates from same source (e.g., Gemini: $665 vs $666)
      const isNearDuplicate = existingConflicts.some(cv => {
        if (cv.source !== newSource) return false; // Different source = not a duplicate

        // Extract numeric values for comparison
        const existingNum = parseFloat(String(cv.value).replace(/[^0-9.-]/g, ''));
        const newNum = parseFloat(String(newValue).replace(/[^0-9.-]/g, ''));

        // If both are numbers, check if within 3% tolerance (handles sqft 1519 vs 1500 = 1.3%)
        if (!isNaN(existingNum) && !isNaN(newNum) && existingNum > 0) {
          const percentDiff = Math.abs(existingNum - newNum) / existingNum;
          if (percentDiff < 0.03) return true; // Within 3% = near-duplicate
        }

        return false;
      });

      // Don't add duplicate or near-duplicate source+value combinations
      if (alreadyExists || isNearDuplicate) {
        return { result: existingField, action: 'skip' };
      }

      const updatedField: FieldValue = {
        ...existingField,
        llmSources: [...(existingField.llmSources || [existingField.source]), newSource],
        hasConflict: true,
        conflictValues: [
          ...(existingField.conflictValues || []),
          { source: newSource, value: newValue }
        ],
      };

      auditTrail.push({
        field: '',
        action: 'conflict',
        source: newSource,
        tier: newTier,
        value: newValue,
        previousValue: existingField.value,
        previousSource: existingField.source,
        reason: 'LLM conflict - added to conflict list',
        timestamp,
      });

      return { result: updatedField, action: 'conflict' };
    }

    auditTrail.push({
      field: '',
      action: 'skip',
      source: newSource,
      tier: newTier,
      value: newValue,
      previousValue: existingField.value,
      previousSource: existingField.source,
      reason: 'Same tier conflict - keeping first value',
      timestamp,
    });

    return { result: existingField, action: 'skip' };
  }

  // Same tier, same value (after normalization) - just add source if LLM
  if (newTier === 4 && existingField.tier === 4) {
    const updatedField: FieldValue = {
      ...existingField,
      llmSources: [...(existingField.llmSources || [existingField.source]), newSource],
    };

    return { result: updatedField, action: 'skip' };
  }

  auditTrail.push({
    field: '',
    action: 'skip',
    source: newSource,
    tier: newTier,
    value: newValue,
    previousValue: existingField.value,
    previousSource: existingField.source,
    reason: `Lower tier (${newTier}) cannot override higher tier (${existingField.tier})`,
    timestamp,
  });

  return { result: null, action: 'skip' };
}

/**
 * FIX #10: Optimized LLM quorum voting with single-pass max finding
 * FIX #16: Validate minQuorum parameter
 * Previously: Two-pass (build counts, then find max via Array.from + loop)
 * Now: Track max during count building for single-pass operation
 */
export function applyLLMQuorumVoting(
  fields: Record<string, FieldValue>,
  minQuorum: number = 2
): { fields: Record<string, FieldValue>; quorumFields: Array<{ field: string; value: any; sources: string[]; quorumCount: number }> } {
  // FIX #16: Validate minQuorum parameter - must be at least 1
  const validMinQuorum = Math.max(1, Math.floor(minQuorum));

  const quorumFields: Array<{ field: string; value: any; sources: string[]; quorumCount: number }> = [];

  for (const [key, field] of Object.entries(fields)) {
    if (field.tier !== 4 || !field.conflictValues || field.conflictValues.length === 0) {
      continue;
    }

    const valueCounts = new Map<string, { count: number; sources: string[]; value: any }>();

    // FIX #10: Track max during count building (single-pass)
    let maxCount = 1;
    let winningEntry: { count: number; sources: string[]; value: any } = {
      count: 1,
      sources: [field.source],
      value: field.value,
    };

    valueCounts.set(JSON.stringify(field.value), winningEntry);

    for (const conflict of field.conflictValues) {
      const valKey = JSON.stringify(conflict.value);
      const existing = valueCounts.get(valKey);
      if (existing) {
        existing.count++;
        existing.sources.push(conflict.source);
        // Update max if this entry is now the winner
        if (existing.count > maxCount) {
          maxCount = existing.count;
          winningEntry = existing;
        }
      } else {
        valueCounts.set(valKey, {
          count: 1,
          sources: [conflict.source],
          value: conflict.value,
        });
      }
    }

    // No need for second pass - we already have the winner
    if (maxCount >= validMinQuorum) {
      fields[key] = {
        ...field,
        value: winningEntry.value,
        confidence: maxCount >= 3 ? 'High' : ARBITRATION_DEFAULTS.CONFIDENCE,
        llmSources: winningEntry.sources,
        hasConflict: valueCounts.size > 1,
      };

      quorumFields.push({
        field: key,
        value: winningEntry.value,
        sources: winningEntry.sources,
        quorumCount: maxCount,
      });
    }
  }

  return { fields, quorumFields };
}

export function detectSingleSourceHallucinations(
  fields: Record<string, FieldValue>
): Array<{ field: string; source: string }> {
  const warnings: Array<{ field: string; source: string }> = [];
  
  for (const [key, field] of Object.entries(fields)) {
    if (field.tier === 4) {
      const sources = field.llmSources || [field.source];
      if (sources.length === 1 && !field.conflictValues?.length) {
        warnings.push({ field: key, source: sources[0] });
      }
    }
  }
  
  return warnings;
}

/**
 * FIX #3 & #16: Optimized createArbitrationPipeline
 * - Uses Map for O(1) conflict lookup instead of .find() (FIX #3)
 * - Validates minLLMQuorum parameter (FIX #16)
 */
export function createArbitrationPipeline(minLLMQuorum: number = 2): {
  addField: (fieldKey: string, value: any, source: string) => void;
  addFieldsFromSource: (sourceFields: Record<string, any>, sourceName: string) => number;
  getFieldCount: () => number;
  getResult: () => ArbitrationResult;
} {
  // FIX #16: Validate minLLMQuorum - must be at least 1
  const validMinQuorum = Math.max(1, Math.floor(minLLMQuorum));

  const fields: Record<string, FieldValue> = {};
  const auditTrail: AuditEntry[] = [];
  const conflicts: ArbitrationResult['conflicts'] = [];
  const validationFailures: ArbitrationResult['validationFailures'] = [];

  // FIX #3: Use Map for O(1) conflict lookup instead of .find() per field
  const conflictIndexMap = new Map<string, number>();

  return {
    addField(fieldKey: string, value: any, source: string) {
      const validation = validateField(fieldKey, value);

      if (!validation.valid) {
        validationFailures.push({
          field: fieldKey,
          value,
          reason: validation.message || 'Validation failed',
        });

        auditTrail.push({
          field: fieldKey,
          action: 'validation_fail',
          source,
          tier: getSourceTier(source),
          value,
          reason: validation.message || 'Validation failed',
          timestamp: new Date().toISOString(),
        });

        return;
      }

      const { result, action } = arbitrateField(fields[fieldKey], value, source, auditTrail, fieldKey);

      if (result) {
        if (auditTrail.length > 0) {
          auditTrail[auditTrail.length - 1].field = fieldKey;
        }
        // Mark field as validation passed since it got through validation gate
        result.validationStatus = 'passed';
        fields[fieldKey] = result;

        if (action === 'conflict' && result.conflictValues) {
          // FIX #3: O(1) Map lookup instead of O(n) .find()
          const existingIndex = conflictIndexMap.get(fieldKey);
          if (existingIndex !== undefined) {
            conflicts[existingIndex].values.push({
              source,
              value,
              tier: getSourceTier(source),
            });
          } else {
            // Store the index for future O(1) lookups
            conflictIndexMap.set(fieldKey, conflicts.length);
            conflicts.push({
              field: fieldKey,
              values: [
                { source: result.source, value: result.value, tier: result.tier },
                { source, value, tier: getSourceTier(source) },
              ],
            });
          }
        }
      }
    },

    addFieldsFromSource(sourceFields: Record<string, any>, sourceName: string): number {
      let addedCount = 0;
      for (const [key, fieldData] of Object.entries(sourceFields)) {
        const value = typeof fieldData === 'object' && fieldData !== null && 'value' in fieldData
          ? fieldData.value
          : fieldData;
        
        if (value === null || value === undefined || value === '') continue;
        
        const strVal = String(value).toLowerCase().trim();
        const isBadValue = strVal === 'null' || strVal === 'undefined' || strVal === 'n/a' || 
          strVal === 'na' || strVal === 'nan' || strVal === 'unknown' || 
          strVal === 'not available' || strVal === 'not found' || strVal === 'none' || 
          strVal === '-' || strVal === '--' || strVal === 'tbd';
        
        if (!isBadValue) {
          this.addField(key, value, sourceName);
          addedCount++;
        }
      }
      return addedCount;
    },

    getFieldCount(): number {
      return Object.keys(fields).length;
    },

    getResult(): ArbitrationResult {
      // Use validated quorum value
      const { fields: votedFields, quorumFields } = applyLLMQuorumVoting(fields, validMinQuorum);
      const singleSourceWarnings = detectSingleSourceHallucinations(votedFields);
      
      // Apply single-source warning status to fields for UI display
      for (const warning of singleSourceWarnings) {
        if (votedFields[warning.field]) {
          votedFields[warning.field].validationStatus = 'warning';
          votedFields[warning.field].validationMessage = `Only one LLM (${warning.source}) provided this data - potential hallucination`;
        }
      }
      
      return {
        fields: votedFields,
        conflicts,
        auditTrail,
        validationFailures,
        llmQuorumFields: quorumFields,
        singleSourceWarnings,
      };
    },
  };
}
