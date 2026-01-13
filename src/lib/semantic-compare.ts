/**
 * Semantic Value Comparison Utility
 *
 * Intelligently compares property field values to determine if they represent
 * the SAME data (semantic match) vs actual CONFLICTS.
 *
 * Purpose: Prevent false conflicts from:
 * - Substring relationships ("Pasadena" in "PASADENA GOLF CLUB ESTATES")
 * - County suffix variations ("Pinellas" vs "Pinellas County")
 * - Abbreviations ("St." vs "Saint", "FL" vs "Florida")
 * - Case differences ("pasadena" vs "PASADENA")
 * - Number formatting ("$1,234" vs "1234")
 *
 * While still catching TRUE conflicts:
 * - Different counties ("Pinellas" vs "Hillsborough")
 * - Different cities ("Tampa" vs "St. Petersburg")
 * - Meaningfully different values
 */

export interface SemanticCompareOptions {
  /** Field key (used to apply field-specific rules) */
  fieldKey?: string;
  /** Strictness level: 'loose' | 'normal' | 'strict' */
  strictness?: 'loose' | 'normal' | 'strict';
}

/**
 * Normalize a string for comparison
 */
function normalizeString(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation except word chars and spaces
    .replace(/\s+/g, ' ')      // Collapse multiple spaces
    .trim();
}

/**
 * Common abbreviation mappings
 */
const ABBREV_MAP: Record<string, string[]> = {
  'saint': ['st', 'st.', 'saint'],
  'street': ['st', 'st.', 'street', 'str'],
  'avenue': ['ave', 'ave.', 'avenue', 'av'],
  'boulevard': ['blvd', 'blvd.', 'boulevard'],
  'drive': ['dr', 'dr.', 'drive'],
  'road': ['rd', 'rd.', 'road'],
  'north': ['n', 'n.', 'north', 'northern'],
  'south': ['s', 's.', 'south', 'southern'],
  'east': ['e', 'e.', 'east', 'eastern'],
  'west': ['w', 'w.', 'west', 'western'],
  'northeast': ['ne', 'n.e.', 'northeast'],
  'northwest': ['nw', 'n.w.', 'northwest'],
  'southeast': ['se', 's.e.', 'southeast'],
  'southwest': ['sw', 's.w.', 'southwest'],
  'florida': ['fl', 'fla', 'fla.', 'florida'],
  'california': ['ca', 'calif', 'calif.', 'california'],
  'texas': ['tx', 'tex', 'tex.', 'texas'],
  'new york': ['ny', 'n.y.', 'new york'],
  'lane': ['ln', 'ln.', 'lane'],
  'place': ['pl', 'pl.', 'place'],
  'court': ['ct', 'ct.', 'court'],
  'circle': ['cir', 'cir.', 'circle'],
  'terrace': ['ter', 'ter.', 'terrace'],
  'parkway': ['pkwy', 'pkwy.', 'parkway'],
  'highway': ['hwy', 'hwy.', 'highway'],
  'apartment': ['apt', 'apt.', 'apartment'],
  'suite': ['ste', 'ste.', 'suite'],
  'unit': ['unit', 'un', '#'],
  'way': ['way', 'wy'],
  'trail': ['trail', 'trl', 'tr'],
  'point': ['point', 'pt', 'pt.'],
  'crossing': ['crossing', 'xing'],
  'square': ['square', 'sq', 'sq.'],
};

/**
 * Boolean Y/N synonyms - all normalize to true/false
 * CRITICAL: Prevents "Yes" vs "Y" from flagging as conflict
 */
const BOOLEAN_TRUE_VALUES = ['yes', 'y', 'true', '1', 'on', 'enabled', 'available'];
const BOOLEAN_FALSE_VALUES = ['no', 'n', 'false', '0', 'off', 'disabled', 'none', 'n/a', 'na', 'not nearby', 'not applicable'];

/**
 * Risk level synonyms - all normalize to low/medium/high
 * CRITICAL: Prevents "Low" vs "Minimal" from flagging as conflict
 */
const RISK_SYNONYMS: Record<string, string[]> = {
  'low': ['low', 'minimal', 'minor', 'negligible', 'very low', 'none', 'safe'],
  'medium': ['medium', 'moderate', 'average', 'typical', 'normal'],
  'high': ['high', 'elevated', 'significant', 'major', 'substantial', 'severe'],
};

/**
 * Property type synonyms
 */
const PROPERTY_TYPE_SYNONYMS: Record<string, string[]> = {
  'single family': ['single family', 'sfr', 'single-family', 'single family residence', 'detached', 'single-family home'],
  'townhouse': ['townhouse', 'townhome', 'th', 'town house', 'town home'],
  'condo': ['condo', 'condominium', 'condo/co-op', 'condo unit'],
  'multi-family': ['multi-family', 'multifamily', 'multi family', 'duplex', 'triplex', 'fourplex'],
};

/**
 * Market type synonyms
 */
const MARKET_TYPE_SYNONYMS: Record<string, string[]> = {
  "buyer's market": ["buyer's market", "buyers market", "buyer's", "buyers", "buyer market"],
  "seller's market": ["seller's market", "sellers market", "seller's", "sellers", "seller market"],
  'balanced': ['balanced', 'neutral', 'even', 'balanced market'],
};

/**
 * Direction synonyms
 */
const DIRECTION_SYNONYMS: Record<string, string[]> = {
  'north': ['north', 'n', 'n.', 'northern'],
  'south': ['south', 's', 's.', 'southern'],
  'east': ['east', 'e', 'e.', 'eastern'],
  'west': ['west', 'w', 'w.', 'western'],
  'northeast': ['northeast', 'ne', 'n.e.', 'north-east'],
  'northwest': ['northwest', 'nw', 'n.w.', 'north-west'],
  'southeast': ['southeast', 'se', 's.e.', 'south-east'],
  'southwest': ['southwest', 'sw', 's.w.', 'south-west'],
};

/**
 * Ownership type synonyms (Field 34)
 */
const OWNERSHIP_TYPE_SYNONYMS: Record<string, string[]> = {
  'fee simple': ['fee simple', 'freehold', 'fee', 'owned', 'full ownership'],
  'condominium': ['condominium', 'condo', 'condo unit', 'condos'],
  'leasehold': ['leasehold', 'leased', 'land lease'],
  'co-op': ['co-op', 'cooperative', 'co op', 'coop'],
};

/**
 * Roof type synonyms (Field 39)
 */
const ROOF_TYPE_SYNONYMS: Record<string, string[]> = {
  'asphalt shingle': ['asphalt shingle', 'shingle', 'comp shingle', 'composition shingle', 'asphalt'],
  'tile': ['tile', 'clay tile', 'concrete tile', 'spanish tile'],
  'metal': ['metal', 'metal roof', 'steel', 'aluminum'],
  'flat': ['flat', 'flat roof', 'membrane'],
};

/**
 * Foundation synonyms (Field 42)
 */
const FOUNDATION_SYNONYMS: Record<string, string[]> = {
  'slab': ['slab', 'concrete slab', 'slab on grade', 'monolithic slab'],
  'crawl space': ['crawl space', 'crawlspace', 'crawl'],
  'basement': ['basement', 'full basement', 'partial basement'],
  'pier and beam': ['pier and beam', 'pier & beam', 'pier', 'post and beam'],
};

/**
 * HVAC type synonyms (Field 45)
 */
const HVAC_TYPE_SYNONYMS: Record<string, string[]> = {
  'central air': ['central air', 'central a/c', 'central', 'central heating and cooling', 'forced air'],
  'heat pump': ['heat pump', 'hp', 'electric heat pump'],
  'window units': ['window units', 'window ac', 'window unit', 'wall units'],
  'ductless': ['ductless', 'mini split', 'mini-split', 'ductless mini split'],
};

/**
 * Flooring type synonyms (Field 49)
 */
const FLOORING_TYPE_SYNONYMS: Record<string, string[]> = {
  'tile': ['tile', 'ceramic tile', 'porcelain tile', 'tiled'],
  'hardwood': ['hardwood', 'wood', 'wood flooring', 'oak', 'maple'],
  'laminate': ['laminate', 'engineered wood', 'laminate flooring'],
  'carpet': ['carpet', 'carpeting', 'wall-to-wall carpet'],
  'vinyl': ['vinyl', 'lvp', 'luxury vinyl', 'vinyl plank'],
};

/**
 * Grade/Quality level synonyms (Fields 90, 115, 118)
 */
const GRADE_SYNONYMS: Record<string, string[]> = {
  'a': ['a', 'excellent', 'great', 'outstanding', 'safe', 'very good'],
  'b': ['b', 'good', 'above average', 'moderate', 'decent'],
  'c': ['c', 'average', 'fair', 'adequate', 'ok'],
  'd': ['d', 'below average', 'poor', 'limited'],
  'f': ['f', 'failing', 'very poor', 'unsafe'],
};

/**
 * Access/Availability synonyms (Fields 81, 115)
 */
const ACCESS_SYNONYMS: Record<string, string[]> = {
  'excellent': ['excellent', '5 bars', 'great', 'very good', 'outstanding'],
  'good': ['good', '4 bars', 'above average', 'decent'],
  'moderate': ['moderate', '3 bars', 'average', 'fair', 'some', 'limited'],
  'poor': ['poor', '2 bars', '1 bar', 'minimal', 'very limited'],
  'none': ['none', 'no service', 'unavailable', 'not available'],
};

/**
 * Likelihood/Trend synonyms (Fields 178, 180)
 */
const LIKELIHOOD_SYNONYMS: Record<string, string[]> = {
  'high': ['high', 'likely', 'probable', 'very likely', 'strong'],
  'medium': ['medium', 'moderate', 'possible', 'average', 'fair'],
  'low': ['low', 'unlikely', 'rare', 'uncommon'],
};

/**
 * Trend direction synonyms (Field 180)
 */
const TREND_SYNONYMS: Record<string, string[]> = {
  'increasing': ['increasing', 'up', 'rising', 'upward', 'climbing', 'growing'],
  'decreasing': ['decreasing', 'down', 'declining', 'downward', 'falling', 'dropping'],
  'stable': ['stable', 'flat', 'steady', 'unchanged', 'level'],
};

/**
 * Normalize boolean-like values to actual boolean
 */
function normalizeBooleanValue(value: any): boolean | null {
  if (typeof value === 'boolean') return value;
  if (value == null) return null;

  const str = String(value).toLowerCase().trim();
  if (BOOLEAN_TRUE_VALUES.includes(str)) return true;
  if (BOOLEAN_FALSE_VALUES.includes(str)) return false;
  return null;
}

/**
 * Normalize risk level to canonical form (low/medium/high)
 */
function normalizeRiskLevel(value: string): string {
  const lower = value.toLowerCase().trim();
  for (const [canonical, synonyms] of Object.entries(RISK_SYNONYMS)) {
    if (synonyms.some(syn => lower.includes(syn))) {
      return canonical;
    }
  }
  return lower;
}

/**
 * Normalize property type to canonical form
 */
function normalizePropertyType(value: string): string {
  const lower = value.toLowerCase().trim();
  for (const [canonical, synonyms] of Object.entries(PROPERTY_TYPE_SYNONYMS)) {
    if (synonyms.some(syn => lower === syn || lower.includes(syn))) {
      return canonical;
    }
  }
  return lower;
}

/**
 * Normalize market type to canonical form (Fields 96, 175)
 */
function normalizeMarketType(value: string): string {
  const lower = value.toLowerCase().trim();
  for (const [canonical, synonyms] of Object.entries(MARKET_TYPE_SYNONYMS)) {
    if (synonyms.some(syn => lower.includes(syn))) {
      return canonical;
    }
  }
  return lower;
}

/**
 * Normalize direction to canonical form (Field 154)
 */
function normalizeDirection(value: string): string {
  const lower = value.toLowerCase().trim();
  for (const [canonical, synonyms] of Object.entries(DIRECTION_SYNONYMS)) {
    if (synonyms.includes(lower)) {
      return canonical;
    }
  }
  return lower;
}

/**
 * Generic synonym normalizer
 */
function normalizeSynonym(value: string, synonymMap: Record<string, string[]>): string {
  const lower = value.toLowerCase().trim();
  for (const [canonical, synonyms] of Object.entries(synonymMap)) {
    if (synonyms.some(syn => lower === syn || lower.includes(syn))) {
      return canonical;
    }
  }
  return lower;
}

/**
 * Normalize rating format: "8/10" → "8", "8 out of 10" → "8"
 * CRITICAL: Prevents "8/10" vs "8" from flagging as conflict
 */
function normalizeRating(value: string): string {
  const str = value.trim();

  // Extract number from "8/10" format
  const slashMatch = str.match(/^(\d+(?:\.\d+)?)\s*\/\s*\d+$/);
  if (slashMatch) return slashMatch[1];

  // Extract number from "8 out of 10" format
  const outOfMatch = str.match(/^(\d+(?:\.\d+)?)\s+out\s+of\s+\d+$/i);
  if (outOfMatch) return outOfMatch[1];

  // Return as-is if already just a number
  return str;
}

/**
 * Normalize time/duration: "10 years" → "10", "25 min" → "25", "6 months" → "6"
 * CRITICAL: Prevents "10 years" vs "10 yrs" vs "10" from flagging as conflict
 */
function normalizeTimeDuration(value: string): string {
  const str = value.toLowerCase().trim();

  // Extract number and normalize unit
  // Matches: "10 years", "10 yrs", "10 yr", "10y", "10"
  const timeMatch = str.match(/^(\d+(?:\.\d+)?)\s*(years?|yrs?|y|months?|mos?|mo|weeks?|wks?|wk|w|days?|d|hours?|hrs?|hr|h|minutes?|mins?|min|m|seconds?|secs?|sec|s|mi|miles?|miles|mile)?$/i);

  if (timeMatch) {
    const number = timeMatch[1];
    const unit = timeMatch[2] || '';

    // Normalize common unit variations
    if (unit.match(/^(years?|yrs?|y)$/i)) return `${number} years`;
    if (unit.match(/^(months?|mos?|mo)$/i)) return `${number} months`;
    if (unit.match(/^(weeks?|wks?|wk|w)$/i)) return `${number} weeks`;
    if (unit.match(/^(days?|d)$/i)) return `${number} days`;
    if (unit.match(/^(hours?|hrs?|hr|h)$/i)) return `${number} hours`;
    if (unit.match(/^(minutes?|mins?|min|m)$/i)) return `${number} min`;
    if (unit.match(/^(mi|miles?|mile)$/i)) return `${number} mi`;

    // No unit or unknown unit - return just the number
    return number;
  }

  // Return as-is if no match
  return str;
}

/**
 * Normalize currency/numeric with units: "$150" → "150", "45 dB" → "45"
 * CRITICAL: Prevents "$150" vs "150" or "45 dB" vs "45" from flagging as conflict
 */
function normalizeCurrencyOrUnit(value: string): string {
  const str = value.trim();

  // Handle "None", "N/A", "$0" → "0"
  if (str.toLowerCase().match(/^(none|n\/a|na|not applicable)$/)) return '0';

  // Extract number from currency format: "$150", "$150.00", "150", "150.00"
  const currencyMatch = str.match(/^\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*$/);
  if (currencyMatch) {
    // Remove commas from number (e.g., "$1,234" → "1234")
    return currencyMatch[1].replace(/,/g, '');
  }

  // Extract number from unit format: "45 dB", "45dB", "45"
  const unitMatch = str.match(/^(\d+(?:\.\d+)?)\s*[a-zA-Z]*$/);
  if (unitMatch) return unitMatch[1];

  // Return as-is if no match
  return str;
}

/**
 * Normalize list/array values: split by comma/semicolon, trim, sort
 * CRITICAL: Prevents "A, B, C" vs "B, A, C" from flagging as conflict (order-insensitive)
 * Also handles "A; B; C" and mixed separators
 */
function normalizeListValue(value: string): string[] {
  // Split by comma or semicolon, trim each item, remove empty items
  const items = value
    .split(/[,;]+/)
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .map(item => normalizeString(item)); // Normalize each item for case/punctuation

  // Sort alphabetically for order-insensitive comparison
  return items.sort();
}

/**
 * Compare two list values (order-insensitive)
 */
function areListsEqual(list1: string[], list2: string[]): boolean {
  if (list1.length !== list2.length) return false;

  // Lists are already sorted, so we can compare element by element
  return list1.every((item, index) => item === list2[index]);
}

/**
 * Normalize internet speed to Mbps: "1 Gbps" → "1000", "500 Mbps" → "500"
 * CRITICAL: Prevents "1 Gbps" vs "1000 Mbps" from flagging as conflict
 */
function normalizeInternetSpeed(value: string): string {
  const str = value.toLowerCase().trim();

  // Match patterns like "1 Gbps", "1Gbps", "1000 Mbps", "1000Mbps"
  const speedMatch = str.match(/^(\d+(?:\.\d+)?)\s*(gbps|mbps|gb\/s|mb\/s)?$/i);

  if (speedMatch) {
    const number = parseFloat(speedMatch[1]);
    const unit = (speedMatch[2] || 'mbps').toLowerCase();

    // Convert Gbps to Mbps
    if (unit.includes('gb')) {
      return String(number * 1000);
    }

    // Already in Mbps
    return String(number);
  }

  // Return as-is if no match
  return str;
}

/**
 * Expand abbreviations in a string
 */
function expandAbbreviations(value: string): string {
  let expanded = value.toLowerCase();

  for (const [full, abbrevs] of Object.entries(ABBREV_MAP)) {
    for (const abbrev of abbrevs) {
      const pattern = new RegExp(`\\b${abbrev.replace('.', '\\.')}\\b`, 'gi');
      expanded = expanded.replace(pattern, full);
    }
  }

  return expanded;
}

/**
 * Remove common suffixes that don't change meaning
 */
function removeCommonSuffixes(value: string, fieldKey?: string): string {
  let cleaned = value;

  // County suffix (only for county fields)
  if (fieldKey?.includes('county')) {
    cleaned = cleaned.replace(/\s+county$/i, '');
  }

  // Section/Subdivision suffixes (for neighborhood fields)
  if (fieldKey?.includes('neighborhood')) {
    cleaned = cleaned
      .replace(/\s+sec(tion)?\s+\d+$/i, '')
      .replace(/\s+phase\s+\d+$/i, '')
      .replace(/\s+subdivision$/i, '')
      .replace(/\s+estates$/i, '');
  }

  return cleaned;
}

/**
 * Check if one value is a substring or superset of another
 */
function isSubstringRelationship(val1: string, val2: string): boolean {
  const norm1 = normalizeString(val1);
  const norm2 = normalizeString(val2);

  // Check if one is a substring of the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return true;
  }

  // Check if one is a word subset of the other
  const words1 = new Set(norm1.split(' '));
  const words2 = new Set(norm2.split(' '));

  // If all words from smaller set are in larger set
  const smaller = words1.size < words2.size ? words1 : words2;
  const larger = words1.size < words2.size ? words2 : words1;

  const matchingWords = Array.from(smaller).filter(w => larger.has(w));

  // If 75%+ of words match, consider it a substring relationship
  return matchingWords.length / smaller.size >= 0.75;
}

/**
 * Compare two numbers with tolerance
 */
function areNumbersSemanticallyEqual(val1: any, val2: any, tolerance: number = 0.01): boolean {
  const num1 = typeof val1 === 'number' ? val1 : parseFloat(String(val1).replace(/[^\d.-]/g, ''));
  const num2 = typeof val2 === 'number' ? val2 : parseFloat(String(val2).replace(/[^\d.-]/g, ''));

  if (isNaN(num1) || isNaN(num2)) return false;

  // For percentages and small numbers, use absolute tolerance
  if (Math.abs(num1) < 10 || Math.abs(num2) < 10) {
    return Math.abs(num1 - num2) <= tolerance;
  }

  // For larger numbers, use relative tolerance
  const relativeDiff = Math.abs(num1 - num2) / Math.max(Math.abs(num1), Math.abs(num2));
  return relativeDiff <= tolerance;
}

/**
 * Main semantic comparison function
 * Returns true if values are semantically the same (NOT a conflict)
 * Returns false if values are truly different (IS a conflict)
 */
export function areValuesSemanticallyEqual(
  value1: any,
  value2: any,
  options: SemanticCompareOptions = {}
): boolean {
  const { fieldKey, strictness = 'normal' } = options;

  // Exact match - no conflict
  if (value1 === value2) return true;
  if (JSON.stringify(value1) === JSON.stringify(value2)) return true;

  // Null/undefined handling
  if (value1 == null || value2 == null) {
    return value1 == value2; // Both null/undefined = match
  }

  // Type mismatch but both are falsy - consider equal
  if (!value1 && !value2) return true;

  // Number comparison
  if (typeof value1 === 'number' || typeof value2 === 'number') {
    const tolerance = strictness === 'loose' ? 0.05 : strictness === 'strict' ? 0.001 : 0.01;
    return areNumbersSemanticallyEqual(value1, value2, tolerance);
  }

  // Array comparison
  if (Array.isArray(value1) && Array.isArray(value2)) {
    const key = fieldKey?.toLowerCase() || '';

    // List fields - order-insensitive comparison
    // Fields: 33, 50, 51, 56, 103, 111, 132, 134, 142, 166, 167, 168
    if (key.includes('hoa_includes') || key.includes('kitchen_features') ||
        key.includes('appliances_included') || key.includes('deck_patio') ||
        key.includes('comparable_sales') || key.includes('internet_providers') ||
        key.includes('lot_features') || key.includes('smart_home_features') ||
        key.includes('parking_features') || key.includes('community_features') ||
        key.includes('interior_features') || key.includes('exterior_features') ||
        key.includes('_features') || key.includes('includes')) {
      // Order-insensitive comparison: normalize and sort
      const normalized1 = value1.map(v => normalizeString(String(v))).sort();
      const normalized2 = value2.map(v => normalizeString(String(v))).sort();
      if (normalized1.length !== normalized2.length) return false;
      return normalized1.every((v, i) => v === normalized2[i]);
    }

    // Default: order-sensitive comparison
    if (value1.length !== value2.length) return false;
    return value1.every((v, i) => areValuesSemanticallyEqual(v, value2[i], options));
  }

  // Object comparison (non-array)
  if (typeof value1 === 'object' && typeof value2 === 'object') {
    const keys1 = Object.keys(value1).sort();
    const keys2 = Object.keys(value2).sort();
    if (JSON.stringify(keys1) !== JSON.stringify(keys2)) return false;
    return keys1.every(key => areValuesSemanticallyEqual(value1[key], value2[key], options));
  }

  // String comparison (most common case)
  if (typeof value1 === 'string' || typeof value2 === 'string') {
    const str1 = String(value1);
    const str2 = String(value2);

    // Empty string handling
    if (!str1.trim() && !str2.trim()) return true;

    // Case-insensitive exact match
    if (str1.toLowerCase() === str2.toLowerCase()) return true;

    // FIELD-SPECIFIC NORMALIZATION BEFORE GENERAL COMPARISON
    const key = fieldKey?.toLowerCase() || '';

    // Boolean Y/N fields - normalize to boolean and compare
    // Fields: 3, 30, 52, 54, 109, 113, 127, 133, 139, 141, 147, 151, 152, 155, 157, 158, 160, 162, 165, 167C
    if (key.includes('_yn') || key.includes('homestead') || key.includes('available') ||
        key.includes('new_construction') || key.includes('cdd') || key.includes('superfund') ||
        key.includes('nearby') || key.includes('natural_gas') || key.includes('ev_charging')) {
      const bool1 = normalizeBooleanValue(str1);
      const bool2 = normalizeBooleanValue(str2);
      if (bool1 !== null && bool2 !== null) {
        return bool1 === bool2;
      }
    }

    // Risk level fields - normalize to canonical form
    if (key.includes('risk') || key.includes('crime') || key.includes('safety') ||
        key.includes('quality') || key.includes('level') || key.includes('potential')) {
      const risk1 = normalizeRiskLevel(str1);
      const risk2 = normalizeRiskLevel(str2);
      if (risk1 === risk2) return true;
    }

    // Property type field - normalize to canonical form
    if (key.includes('property_type') || key === '26_property_type') {
      const type1 = normalizePropertyType(str1);
      const type2 = normalizePropertyType(str2);
      if (type1 === type2) return true;
    }

    // Rating fields - normalize "8/10" = "8" = "8 out of 10"
    if (key.includes('rating') || key.includes('_rating')) {
      const rating1 = normalizeRating(str1);
      const rating2 = normalizeRating(str2);
      if (rating1 === rating2) return true;
    }

    // Time/Duration fields - normalize "10 years" = "10 yrs" = "10", "25 min" = "25 minutes"
    if (key.includes('age') || key.includes('_age') || key.includes('commute') ||
        key.includes('distance') || key.includes('lease_period') || key.includes('period')) {
      const time1 = normalizeTimeDuration(str1);
      const time2 = normalizeTimeDuration(str2);
      if (time1 === time2) return true;
    }

    // Currency/Unit fields - normalize "$150" = "150", "45 dB" = "45", "None" = "$0"
    if (key.includes('bill') || key.includes('_bill') || key.includes('assessment') ||
        key.includes('noise_level_db') || key.includes('db_est')) {
      const curr1 = normalizeCurrencyOrUnit(str1);
      const curr2 = normalizeCurrencyOrUnit(str2);
      if (curr1 === curr2) return true;
    }

    // List/Array fields - order-insensitive comparison for comma/semicolon-separated lists
    // Fields: 33, 50, 51, 56, 103, 111, 132, 134, 142, 166, 167, 168
    if (key.includes('hoa_includes') || key.includes('kitchen_features') ||
        key.includes('appliances_included') || key.includes('deck_patio') ||
        key.includes('comparable_sales') || key.includes('internet_providers') ||
        key.includes('lot_features') || key.includes('smart_home_features') ||
        key.includes('parking_features') || key.includes('community_features') ||
        key.includes('interior_features') || key.includes('exterior_features') ||
        key.includes('_features') || key.includes('includes')) {
      // Check if values contain list separators (comma or semicolon)
      if (str1.includes(',') || str1.includes(';') || str2.includes(',') || str2.includes(';')) {
        const list1 = normalizeListValue(str1);
        const list2 = normalizeListValue(str2);
        if (areListsEqual(list1, list2)) return true;
      }
    }

    // Internet speed field - normalize "1 Gbps" = "1000 Mbps"
    // Field 112: max_internet_speed
    if (key.includes('internet_speed') || key.includes('max_internet') || key === '112_max_internet_speed') {
      const speed1 = normalizeInternetSpeed(str1);
      const speed2 = normalizeInternetSpeed(str2);
      if (speed1 === speed2) return true;
    }

    // Market type fields - normalize "Buyer's Market" = "Buyers Market"
    // Fields: 96 (inventory_surplus), 175 (market_type)
    if (key.includes('market') || key.includes('inventory') || key.includes('surplus')) {
      const market1 = normalizeMarketType(str1);
      const market2 = normalizeMarketType(str2);
      if (market1 === market2) return true;
    }

    // Direction fields - normalize "South" = "S" = "Southern"
    // Field 154: front_exposure
    if (key.includes('exposure') || key.includes('direction') || key.includes('facing')) {
      const dir1 = normalizeDirection(str1);
      const dir2 = normalizeDirection(str2);
      if (dir1 === dir2) return true;
    }

    // Ownership type - Field 34
    if (key.includes('ownership_type') || key === '34_ownership_type') {
      const own1 = normalizeSynonym(str1, OWNERSHIP_TYPE_SYNONYMS);
      const own2 = normalizeSynonym(str2, OWNERSHIP_TYPE_SYNONYMS);
      if (own1 === own2) return true;
    }

    // Roof type - Field 39
    if (key.includes('roof_type') || key === '39_roof_type') {
      const roof1 = normalizeSynonym(str1, ROOF_TYPE_SYNONYMS);
      const roof2 = normalizeSynonym(str2, ROOF_TYPE_SYNONYMS);
      if (roof1 === roof2) return true;
    }

    // Foundation - Field 42
    if (key.includes('foundation') || key === '42_foundation') {
      const found1 = normalizeSynonym(str1, FOUNDATION_SYNONYMS);
      const found2 = normalizeSynonym(str2, FOUNDATION_SYNONYMS);
      if (found1 === found2) return true;
    }

    // HVAC type - Field 45
    if (key.includes('hvac_type') || key === '45_hvac_type') {
      const hvac1 = normalizeSynonym(str1, HVAC_TYPE_SYNONYMS);
      const hvac2 = normalizeSynonym(str2, HVAC_TYPE_SYNONYMS);
      if (hvac1 === hvac2) return true;
    }

    // Flooring type - Field 49
    if (key.includes('flooring_type') || key === '49_flooring_type') {
      const floor1 = normalizeSynonym(str1, FLOORING_TYPE_SYNONYMS);
      const floor2 = normalizeSynonym(str2, FLOORING_TYPE_SYNONYMS);
      if (floor1 === floor2) return true;
    }

    // Grade/Quality fields - Fields 90, 115, 118
    if (key.includes('grade') || key.includes('safety_rating') || key.includes('air_quality_grade') ||
        key.includes('cell_coverage')) {
      const grade1 = normalizeSynonym(str1, GRADE_SYNONYMS);
      const grade2 = normalizeSynonym(str2, GRADE_SYNONYMS);
      if (grade1 === grade2) return true;
    }

    // Access/Availability fields - Fields 81, 115
    if (key.includes('transit_access') || key.includes('public_transit') || key.includes('coverage')) {
      const access1 = normalizeSynonym(str1, ACCESS_SYNONYMS);
      const access2 = normalizeSynonym(str2, ACCESS_SYNONYMS);
      if (access1 === access2) return true;
    }

    // Likelihood fields - Field 178
    if (key.includes('likelihood') || key.includes('offers_likelihood')) {
      const like1 = normalizeSynonym(str1, LIKELIHOOD_SYNONYMS);
      const like2 = normalizeSynonym(str2, LIKELIHOOD_SYNONYMS);
      if (like1 === like2) return true;
    }

    // Trend fields - Field 180
    if (key.includes('trend') || key.includes('price_trend')) {
      const trend1 = normalizeSynonym(str1, TREND_SYNONYMS);
      const trend2 = normalizeSynonym(str2, TREND_SYNONYMS);
      if (trend1 === trend2) return true;
    }

    // Listing status - case insensitive comparison
    if (key.includes('listing_status') || key.includes('status')) {
      if (str1.toLowerCase().trim() === str2.toLowerCase().trim()) return true;
    }

    // Normalize and compare
    let norm1 = normalizeString(str1);
    let norm2 = normalizeString(str2);

    // Apply field-specific suffix removal
    norm1 = removeCommonSuffixes(norm1, fieldKey);
    norm2 = removeCommonSuffixes(norm2, fieldKey);

    // After normalization, check exact match
    if (norm1 === norm2) return true;

    // Expand abbreviations and compare
    const exp1 = expandAbbreviations(norm1);
    const exp2 = expandAbbreviations(norm2);

    if (exp1 === exp2) return true;

    // Check substring relationships (only for 'loose' or 'normal' strictness)
    if (strictness !== 'strict') {
      // For neighborhoods, be more lenient (longer names often include shorter ones)
      if (key.includes('neighborhood')) {
        if (isSubstringRelationship(str1, str2)) return true;
      }

      // For county names, be lenient but only if normalized match
      if (key.includes('county')) {
        if (isSubstringRelationship(str1, str2)) return true;
      }

      // For addresses, check if one is subset of the other
      if (key.includes('address') || key.includes('street') || key.includes('full_address')) {
        if (isSubstringRelationship(str1, str2)) return true;
      }

      // For school names, be lenient
      if (key.includes('school')) {
        if (isSubstringRelationship(str1, str2)) return true;
      }
    }
  }

  // Boolean comparison - use smart normalization
  if (typeof value1 === 'boolean' || typeof value2 === 'boolean') {
    const bool1 = normalizeBooleanValue(value1);
    const bool2 = normalizeBooleanValue(value2);
    // If both normalize to valid booleans, compare them
    if (bool1 !== null && bool2 !== null) {
      return bool1 === bool2;
    }
    // Fallback to basic boolean coercion
    return Boolean(value1) === Boolean(value2);
  }

  // If we get here, values are truly different
  return false;
}

/**
 * Field-specific comparison rules
 * Returns true if semantic comparison should be used, false for strict comparison
 */
export function shouldUseSemanticComparison(fieldKey: string): boolean {
  const key = fieldKey.toLowerCase();

  // Fields that should use semantic comparison (expanded list)
  const semanticFields = [
    // Address & Location
    'neighborhood', 'county', 'city', 'state', 'address', 'street', 'subdivision',
    'full_address', 'zip', 'exposure',
    // Schools
    'school', 'district', 'elementary', 'middle', 'high',
    // Descriptions & Names
    'description', 'name', 'owner', 'builder', 'developer', 'association',
    'provider', 'body', 'features',
    // Boolean Y/N fields (need normalization)
    '_yn', 'homestead', 'available', 'attached', 'elevator',
    // Risk & Quality fields (need synonym matching)
    'risk', 'crime', 'safety', 'quality', 'level', 'potential', 'condition',
    'grade', 'rating',
    // Property characteristics
    'property_type', 'type', 'material', 'foundation', 'roof', 'hvac',
    'flooring', 'landscaping', 'fence', 'pool', 'laundry',
    // Market & Status
    'status', 'market', 'trend', 'surplus', 'likelihood',
    // Misc text fields that vary
    'includes', 'exemptions', 'restrictions', 'policy', 'period',
  ];

  // Check if field key contains any semantic field pattern
  return semanticFields.some(pattern => key.includes(pattern));
}

/**
 * Get strictness level based on field type
 */
export function getFieldStrictness(fieldKey: string): 'loose' | 'normal' | 'strict' {
  const key = fieldKey.toLowerCase();

  // Loose: Neighborhoods, descriptions (expect variations)
  if (key.includes('neighborhood') || key.includes('description') || key.includes('name') || key.includes('address') || key.includes('street')) {
    return 'loose';
  }

  // Strict: IDs, codes, legal descriptions (must match exactly)
  if (key.includes('_id') || key.includes('code') || key.includes('number') || key.includes('legal')) {
    return 'strict';
  }

  // Normal: Everything else
  return 'normal';
}

/**
 * Convenience function: Check if two values represent a TRUE conflict
 * Returns true if there IS a real conflict (values are different)
 * Returns false if NOT a conflict (values are semantically the same)
 */
export function hasRealConflict(
  value1: any,
  value2: any,
  fieldKey?: string
): boolean {
  // If field should use semantic comparison, use it
  if (fieldKey && shouldUseSemanticComparison(fieldKey)) {
    const strictness = getFieldStrictness(fieldKey);
    return !areValuesSemanticallyEqual(value1, value2, { fieldKey, strictness });
  }

  // Otherwise, use exact comparison
  return JSON.stringify(value1) !== JSON.stringify(value2);
}
