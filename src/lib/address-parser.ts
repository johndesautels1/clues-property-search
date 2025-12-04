/**
 * Robust Address Parser for Real Estate Property Search
 *
 * Handles multiple address formats from:
 * - User manual entry (with or without commas)
 * - Zillow, Realtor.com, Redfin scraped data
 * - MLS data feeds
 *
 * Features:
 * - Comma-independent parsing using regex
 * - USPS abbreviation normalization
 * - Directional normalization (E/East, W/West, etc.)
 * - Street type normalization (St/Street, Blvd/Boulevard, etc.)
 * - Unit/Apt handling
 * - ZIP code extraction from any position
 */

export interface ParsedAddress {
  // Raw input
  original: string;

  // Parsed components
  streetNumber?: string;
  streetPreDirectional?: string;  // N, S, E, W, NE, etc.
  streetName?: string;
  streetType?: string;             // St, Ave, Blvd, etc.
  streetPostDirectional?: string;
  unitType?: string;               // Apt, Unit, Suite, etc.
  unitNumber?: string;
  city?: string;
  state?: string;
  zipCode?: string;

  // Normalized versions for matching
  normalized: {
    street: string;           // Full street with normalized abbreviations
    streetShort: string;      // Just number + name (no type/directional)
    city?: string;
    state?: string;
    zipCode?: string;
  };

  // Confidence scores
  confidence: {
    street: 'High' | 'Medium' | 'Low';
    city: 'High' | 'Medium' | 'Low' | 'None';
    zipCode: 'High' | 'Medium' | 'Low' | 'None';
  };
}

/**
 * USPS Standard Street Type Abbreviations
 * Maps common variations to standard abbreviation
 */
const STREET_TYPE_MAPPINGS: Record<string, string> = {
  // Alley
  'alley': 'Aly',
  'aly': 'Aly',

  // Avenue
  'avenue': 'Ave',
  'ave': 'Ave',
  'av': 'Ave',

  // Boulevard
  'boulevard': 'Blvd',
  'blvd': 'Blvd',
  'boul': 'Blvd',
  'boulv': 'Blvd',

  // Circle
  'circle': 'Cir',
  'cir': 'Cir',
  'circl': 'Cir',

  // Court
  'court': 'Ct',
  'ct': 'Ct',

  // Drive
  'drive': 'Dr',
  'dr': 'Dr',
  'driv': 'Dr',
  'drv': 'Dr',

  // Expressway
  'expressway': 'Expy',
  'expy': 'Expy',
  'expr': 'Expy',
  'express': 'Expy',

  // Highway
  'highway': 'Hwy',
  'hwy': 'Hwy',
  'highwy': 'Hwy',
  'hiway': 'Hwy',
  'hiwy': 'Hwy',

  // Lane
  'lane': 'Ln',
  'ln': 'Ln',

  // Parkway
  'parkway': 'Pkwy',
  'pkwy': 'Pkwy',
  'parkwy': 'Pkwy',
  'pky': 'Pkwy',

  // Place
  'place': 'Pl',
  'pl': 'Pl',

  // Road
  'road': 'Rd',
  'rd': 'Rd',

  // Street
  'street': 'St',
  'st': 'St',
  'str': 'St',
  'strt': 'St',

  // Terrace
  'terrace': 'Ter',
  'ter': 'Ter',
  'terr': 'Ter',

  // Trail
  'trail': 'Trl',
  'trl': 'Trl',
  'trails': 'Trl',
  'trls': 'Trl',

  // Way
  'way': 'Way',

  // Common Florida/Beach specific (ONLY as street types at END, not in middle)
  'key': 'Key',
  'keys': 'Keys',
};

/**
 * Directional abbreviations (USPS standard)
 */
const DIRECTIONAL_MAPPINGS: Record<string, string> = {
  'north': 'N',
  'n': 'N',
  'south': 'S',
  's': 'S',
  'east': 'E',
  'e': 'E',
  'west': 'W',
  'w': 'W',
  'northeast': 'NE',
  'ne': 'NE',
  'northwest': 'NW',
  'nw': 'NW',
  'southeast': 'SE',
  'se': 'SE',
  'southwest': 'SW',
  'sw': 'SW',
};

/**
 * Unit type variations
 */
const UNIT_TYPE_MAPPINGS: Record<string, string> = {
  'apartment': 'Apt',
  'apt': 'Apt',
  'unit': 'Unit',
  'suite': 'Ste',
  'ste': 'Ste',
  'building': 'Bldg',
  'bldg': 'Bldg',
  'floor': 'Fl',
  'fl': 'Fl',
  'room': 'Rm',
  'rm': 'Rm',
  '#': '#',
};

/**
 * Normalize street type abbreviation
 */
function normalizeStreetType(type: string): string {
  const normalized = type.toLowerCase().replace(/\./g, '');
  return STREET_TYPE_MAPPINGS[normalized] || type;
}

/**
 * Normalize directional
 */
function normalizeDirectional(dir: string): string {
  const normalized = dir.toLowerCase().replace(/\./g, '');
  return DIRECTIONAL_MAPPINGS[normalized] || dir;
}

/**
 * Parse address using multiple strategies
 */
export function parseAddress(address: string): ParsedAddress {
  const original = address.trim();

  // Initialize result
  const result: ParsedAddress = {
    original,
    normalized: {
      street: '',
      streetShort: '',
    },
    confidence: {
      street: 'Low',
      city: 'None',
      zipCode: 'None',
    },
  };

  // Remove extra whitespace
  const cleaned = address.replace(/\s+/g, ' ').trim();

  // Extract ZIP code from END (5 digits, optionally followed by -4 digits)
  // Use $ anchor or \s to ensure it's near the end, not a street number
  const zipMatch = cleaned.match(/[,\s](\d{5})(?:-\d{4})?\s*$/);
  if (zipMatch) {
    result.zipCode = zipMatch[1];
    result.normalized.zipCode = zipMatch[1];
    result.confidence.zipCode = 'High';
  }

  // Extract state (2 uppercase letters, near end after comma or space)
  // Look for pattern like ", FL" or " FL " near end
  const stateMatch = cleaned.match(/[,\s]([A-Z]{2})\s+\d{5}|[,\s]([A-Z]{2})\s*$/);
  if (stateMatch) {
    result.state = stateMatch[1] || stateMatch[2];
    result.normalized.state = stateMatch[1] || stateMatch[2];
  }

  // Extract unit/apt number (must do before street parsing)
  const unitPatterns = [
    /\b(apartment|apt|unit|suite|ste|bldg|building|floor|fl|room|rm)\s+([a-z0-9-]+)\b/i,
    /#\s*([a-z0-9-]+)\b/i,
  ];

  let unitMatch: RegExpMatchArray | null = null;
  for (const pattern of unitPatterns) {
    unitMatch = cleaned.match(pattern);
    if (unitMatch) {
      result.unitType = unitMatch[1] || '#';
      result.unitNumber = unitMatch[2] || unitMatch[1];
      break;
    }
  }

  // Build string WITHOUT unit/state/zip for street/city parsing
  let workingString = cleaned;

  // Remove unit
  if (unitMatch) {
    workingString = workingString.replace(unitMatch[0], ' ').trim();
  }

  // Remove state
  if (stateMatch) {
    workingString = workingString.replace(new RegExp(`\\b${stateMatch[1]}\\b`), ' ').trim();
  }

  // Remove ZIP
  if (zipMatch) {
    workingString = workingString.replace(zipMatch[0], ' ').trim();
  }

  // Clean up extra spaces
  workingString = workingString.replace(/\s+/g, ' ').trim().replace(/,\s*,/g, ',').replace(/,\s*$/g, '');

  // Now split by comma to separate street, city
  const parts = workingString.split(',').map(p => p.trim()).filter(p => p.length > 0);

  // Strategy 1: Has commas - assume "street, city" or "street, city, extras"
  if (parts.length >= 2) {
    const streetPart = parts[0];
    result.city = parts[1];
    result.normalized.city = parts[1];
    result.confidence.city = 'High';

    // Parse street part
    parseStreetComponent(streetPart, result);
  }
  // Strategy 2: No commas - try to identify city at end (word before state/zip)
  else if (parts.length === 1) {
    const single = parts[0];

    // If we found state/zip, words before them might be city
    // Pattern: "123 Main St Tampa" or "123 Main St Tampa FL"
    const words = single.split(/\s+/);

    // Look for likely city (capitalized words near end, not street types)
    let cityStartIdx = -1;
    for (let i = words.length - 1; i >= 0; i--) {
      const word = words[i].toLowerCase().replace(/\./g, '');
      // If it's a street type or directional, city starts after it
      if (STREET_TYPE_MAPPINGS[word] || DIRECTIONAL_MAPPINGS[word]) {
        cityStartIdx = i + 1;
        break;
      }
      // If first word is likely a street number, city might be at end
      if (i === 0 && /^\d/.test(words[0])) {
        // Heuristic: last 1-3 words might be city (e.g., "Treasure Island", "St Petersburg")
        cityStartIdx = Math.max(2, words.length - 3);
        break;
      }
    }

    if (cityStartIdx > 0 && cityStartIdx < words.length) {
      const cityWords = words.slice(cityStartIdx);
      result.city = cityWords.join(' ');
      result.normalized.city = cityWords.join(' ');
      result.confidence.city = 'Medium';

      // Street is everything before city
      const streetWords = words.slice(0, cityStartIdx);
      parseStreetComponent(streetWords.join(' '), result);
    } else {
      // Can't identify city, entire thing is street
      parseStreetComponent(single, result);
      result.confidence.city = 'None';
    }
  }

  // Build normalized street string
  buildNormalizedStreet(result);

  return result;
}

/**
 * Parse street component into parts
 */
function parseStreetComponent(street: string, result: ParsedAddress): void {
  const words = street.split(/\s+/);

  if (words.length === 0) return;

  let idx = 0;

  // Extract street number (first token that starts with digits)
  if (idx < words.length && /^\d/.test(words[idx])) {
    result.streetNumber = words[idx];
    idx++;
  }

  // Extract pre-directional (N, S, E, W, etc. before street name)
  if (idx < words.length) {
    const normalized = normalizeDirectional(words[idx]);
    if (DIRECTIONAL_MAPPINGS[words[idx].toLowerCase().replace(/\./g, '')]) {
      result.streetPreDirectional = normalized;
      idx++;
    }
  }

  // Extract street name and type - scan from end to find LAST street type
  let streetTypeIdx = -1;
  for (let i = words.length - 1; i >= idx; i--) {
    const word = words[i].toLowerCase().replace(/\./g, '');
    if (STREET_TYPE_MAPPINGS[word]) {
      streetTypeIdx = i;
      break;
    }
  }

  if (streetTypeIdx > idx) {
    // Everything from current idx to streetTypeIdx is street name
    result.streetName = words.slice(idx, streetTypeIdx).join(' ');
    result.streetType = normalizeStreetType(words[streetTypeIdx]);
    idx = streetTypeIdx + 1;
  } else {
    // No street type found - everything remaining is street name
    result.streetName = words.slice(idx).join(' ');
    idx = words.length;
  }

  // Extract post-directional (directional after street type)
  if (idx < words.length) {
    const normalized = normalizeDirectional(words[idx]);
    if (DIRECTIONAL_MAPPINGS[words[idx].toLowerCase().replace(/\./g, '')]) {
      result.streetPostDirectional = normalized;
      idx++;
    }
  }

  // Set street confidence
  if (result.streetNumber && result.streetName) {
    result.confidence.street = 'High';
  } else if (result.streetName) {
    result.confidence.street = 'Medium';
  }
}

/**
 * Build normalized street strings for searching
 */
function buildNormalizedStreet(result: ParsedAddress): void {
  const parts: string[] = [];
  const shortParts: string[] = [];

  if (result.streetNumber) {
    parts.push(result.streetNumber);
    shortParts.push(result.streetNumber);
  }

  if (result.streetPreDirectional) {
    parts.push(result.streetPreDirectional);
  }

  if (result.streetName) {
    parts.push(result.streetName);
    shortParts.push(result.streetName);
  }

  if (result.streetType) {
    parts.push(result.streetType);
  }

  if (result.streetPostDirectional) {
    parts.push(result.streetPostDirectional);
  }

  result.normalized.street = parts.join(' ');
  result.normalized.streetShort = shortParts.join(' ');
}

/**
 * Generate search variations for fuzzy matching
 * Returns multiple address formats to try in order of specificity
 */
export function generateSearchVariations(parsed: ParsedAddress): string[] {
  const variations: string[] = [];

  // Variation 1: Full normalized street
  if (parsed.normalized.street) {
    variations.push(parsed.normalized.street);
  }

  // Variation 2: Street without type suffix
  if (parsed.streetNumber && parsed.streetName) {
    const parts = [parsed.streetNumber];
    if (parsed.streetPreDirectional) parts.push(parsed.streetPreDirectional);
    parts.push(parsed.streetName);
    if (parsed.streetPostDirectional) parts.push(parsed.streetPostDirectional);
    variations.push(parts.join(' '));
  }

  // Variation 3: Street with original type (in case MLS uses full word)
  if (parsed.streetNumber && parsed.streetName && parsed.streetType) {
    // Try full street type name
    const fullType = Object.keys(STREET_TYPE_MAPPINGS).find(
      k => STREET_TYPE_MAPPINGS[k] === parsed.streetType
    );
    if (fullType && fullType !== parsed.streetType?.toLowerCase()) {
      const parts = [parsed.streetNumber];
      if (parsed.streetPreDirectional) parts.push(parsed.streetPreDirectional);
      parts.push(parsed.streetName);
      parts.push(fullType.charAt(0).toUpperCase() + fullType.slice(1)); // Capitalize
      if (parsed.streetPostDirectional) parts.push(parsed.streetPostDirectional);
      variations.push(parts.join(' '));
    }
  }

  // Variation 4: Just number + first word of street name (for very fuzzy matching)
  if (parsed.normalized.streetShort) {
    variations.push(parsed.normalized.streetShort);
  }

  // Remove duplicates
  return Array.from(new Set(variations));
}
