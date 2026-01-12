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
  'north': ['n', 'n.', 'north'],
  'south': ['s', 's.', 'south'],
  'east': ['e', 'e.', 'east'],
  'west': ['w', 'w.', 'west'],
  'florida': ['fl', 'fla', 'fla.', 'florida'],
  'california': ['ca', 'calif', 'calif.', 'california'],
  'texas': ['tx', 'tex', 'tex.', 'texas'],
  'new york': ['ny', 'n.y.', 'new york'],
};

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
      if (fieldKey?.includes('neighborhood')) {
        if (isSubstringRelationship(str1, str2)) return true;
      }

      // For county names, be lenient but only if normalized match
      if (fieldKey?.includes('county')) {
        if (isSubstringRelationship(str1, str2)) return true;
      }

      // For addresses, check if one is subset of the other
      if (fieldKey?.includes('address') || fieldKey?.includes('street')) {
        if (isSubstringRelationship(str1, str2)) return true;
      }
    }
  }

  // Boolean comparison
  if (typeof value1 === 'boolean' || typeof value2 === 'boolean') {
    // Convert to boolean and compare
    const bool1 = Boolean(value1);
    const bool2 = Boolean(value2);
    return bool1 === bool2;
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

  // Fields that should use semantic comparison
  const semanticFields = [
    'neighborhood',
    'county',
    'city',
    'state',
    'address',
    'street',
    'subdivision',
    'school',
    'district',
    'zone',
    'description',
    'name',
    'owner',
    'builder',
    'developer',
    'association',
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
  if (key.includes('neighborhood') || key.includes('description') || key.includes('name')) {
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
