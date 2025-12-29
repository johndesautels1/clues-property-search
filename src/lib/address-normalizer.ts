/**
 * Address Normalization Utilities
 * Handles variations in city names, state names, and street addresses
 * Ensures consistent matching across Bridge MLS API calls
 */

// State name to 2-letter code mapping
const STATE_CODES: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC'
};

// Street direction abbreviations
const DIRECTION_ABBREV: Record<string, string> = {
  'north': 'N', 'n': 'N', 'n.': 'N',
  'south': 'S', 's': 'S', 's.': 'S',
  'east': 'E', 'e': 'E', 'e.': 'E',
  'west': 'W', 'w': 'W', 'w.': 'W',
  'northeast': 'NE', 'ne': 'NE', 'n.e.': 'NE',
  'northwest': 'NW', 'nw': 'NW', 'n.w.': 'NW',
  'southeast': 'SE', 'se': 'SE', 's.e.': 'SE',
  'southwest': 'SW', 'sw': 'SW', 's.w.': 'SW'
};

// Street type abbreviations
const STREET_TYPE_ABBREV: Record<string, string> = {
  'street': 'St', 'st': 'St', 'st.': 'St',
  'avenue': 'Ave', 'ave': 'Ave', 'ave.': 'Ave', 'av': 'Ave',
  'boulevard': 'Blvd', 'blvd': 'Blvd', 'blvd.': 'Blvd',
  'drive': 'Dr', 'dr': 'Dr', 'dr.': 'Dr',
  'road': 'Rd', 'rd': 'Rd', 'rd.': 'Rd',
  'lane': 'Ln', 'ln': 'Ln', 'ln.': 'Ln',
  'court': 'Ct', 'ct': 'Ct', 'ct.': 'Ct',
  'circle': 'Cir', 'cir': 'Cir', 'cir.': 'Cir',
  'place': 'Pl', 'pl': 'Pl', 'pl.': 'Pl',
  'terrace': 'Ter', 'ter': 'Ter', 'ter.': 'Ter',
  'way': 'Way', 'parkway': 'Pkwy', 'pkwy': 'Pkwy',
  'highway': 'Hwy', 'hwy': 'Hwy'
};

/**
 * Normalize state name to uppercase 2-letter code
 * Examples: "Florida" → "FL", "fl" → "FL", "Fl" → "FL"
 */
export function normalizeState(state: string | undefined): string | undefined {
  if (!state) return undefined;

  const cleaned = state.trim().toLowerCase();

  // Already a 2-letter code
  if (cleaned.length === 2 && /^[a-z]{2}$/.test(cleaned)) {
    return cleaned.toUpperCase();
  }

  // Full state name
  return STATE_CODES[cleaned] || state.toUpperCase();
}

/**
 * Normalize city name
 * - Remove extra spaces
 * - Standardize "St." vs "Saint" variations
 * - Capitalize properly
 */
export function normalizeCity(city: string | undefined): string | undefined {
  if (!city) return undefined;

  let normalized = city.trim();

  // Standardize "St." to "Saint" for matching
  // Bridge MLS likely stores as "Saint Petersburg" not "St. Petersburg"
  normalized = normalized.replace(/\bSt\.\s+/gi, 'Saint ');
  normalized = normalized.replace(/\bSt\s+/gi, 'Saint ');

  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized;
}

/**
 * Normalize street address
 * - Standardize direction abbreviations (E. → E, East → E)
 * - Standardize street type abbreviations (Street → St, Avenue → Ave)
 * - Remove extra spaces
 * - Handle variations: "100 E. Broad St" vs "100 East Broad Street"
 */
export function normalizeStreetAddress(address: string | undefined): string | undefined {
  if (!address) return undefined;

  let normalized = address.trim();

  // Split into parts (number and street name)
  const parts = normalized.split(/\s+/);

  // Process each part
  const processedParts = parts.map((part, index) => {
    const lowerPart = part.toLowerCase().replace(/\./g, ''); // Remove periods

    // Check if it's a direction abbreviation
    if (DIRECTION_ABBREV[lowerPart]) {
      return DIRECTION_ABBREV[lowerPart];
    }

    // Check if it's a street type abbreviation
    if (STREET_TYPE_ABBREV[lowerPart]) {
      return STREET_TYPE_ABBREV[lowerPart];
    }

    // Keep original if not a known abbreviation
    return part;
  });

  return processedParts.join(' ');
}

/**
 * Normalize ZIP code
 * - Remove dashes and spaces
 * - Ensure 5 digits
 */
export function normalizeZip(zip: string | undefined): string | undefined {
  if (!zip) return undefined;

  // Remove dashes and spaces, keep only first 5 digits
  const cleaned = zip.replace(/[-\s]/g, '');
  return cleaned.slice(0, 5);
}

/**
 * Normalize full address string
 * Combines street, city, state, zip normalization
 */
export function normalizeFullAddress(address: string | undefined): string | undefined {
  if (!address) return undefined;

  // Parse address components
  const parts = address.split(',').map(p => p.trim());

  if (parts.length === 0) return address;

  // Normalize street (first part)
  const street = normalizeStreetAddress(parts[0]);

  // Normalize city (second part if exists)
  const city = parts.length > 1 ? normalizeCity(parts[1]) : undefined;

  // Normalize state and zip (third part if exists)
  let state: string | undefined;
  let zip: string | undefined;

  if (parts.length > 2) {
    const stateZipPart = parts[2];
    const stateMatch = stateZipPart.match(/([A-Za-z\s]+)/);
    const zipMatch = stateZipPart.match(/(\d{5})/);

    state = stateMatch ? normalizeState(stateMatch[1].trim()) : undefined;
    zip = zipMatch ? normalizeZip(zipMatch[1]) : undefined;
  }

  // Reconstruct normalized address
  const normalized = [street, city, state && zip ? `${state} ${zip}` : state || zip]
    .filter(Boolean)
    .join(', ');

  return normalized;
}

/**
 * Normalize address components for Bridge MLS validation
 * Returns normalized street, city, state, zip
 */
export interface NormalizedAddressComponents {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export function normalizeAddressComponents(
  street: string | undefined,
  city: string | undefined,
  state: string | undefined,
  zip: string | undefined
): NormalizedAddressComponents {
  return {
    street: normalizeStreetAddress(street),
    city: normalizeCity(city),
    state: normalizeState(state),
    zip: normalizeZip(zip)
  };
}
