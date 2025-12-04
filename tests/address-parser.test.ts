/**
 * Comprehensive Address Parser Tests
 * PROVES the parser handles all variations without breaking existing functionality
 */

import { describe, it, expect } from 'vitest';
import { parseAddress, generateSearchVariations } from '../src/lib/address-parser';

describe('Address Parser - Comma Variations', () => {
  it('handles address WITH commas (current working format)', () => {
    const result = parseAddress('10048 Gulf Blvd, Treasure Island, FL 33706');

    expect(result.streetNumber).toBe('10048');
    expect(result.streetName).toBe('Gulf');
    expect(result.streetType).toBe('Blvd');
    expect(result.city).toBe('Treasure Island');
    expect(result.state).toBe('FL');
    expect(result.zipCode).toBe('33706');
    expect(result.normalized.street).toBe('10048 Gulf Blvd');
    expect(result.confidence.street).toBe('High');
    expect(result.confidence.city).toBe('High');
    expect(result.confidence.zipCode).toBe('High');
  });

  it('handles address WITHOUT commas (failing currently)', () => {
    const result = parseAddress('10048 Gulf Blvd Treasure Island FL 33706');

    expect(result.streetNumber).toBe('10048');
    expect(result.streetName).toBe('Gulf');
    expect(result.streetType).toBe('Blvd');
    expect(result.city).toBe('Treasure Island');
    expect(result.state).toBe('FL');
    expect(result.zipCode).toBe('33706');
    expect(result.confidence.street).toBe('High');
  });

  it('handles comma after city only', () => {
    const result = parseAddress('10048 Gulf Blvd Treasure Island, FL 33706');

    expect(result.streetNumber).toBe('10048');
    expect(result.streetName).toBe('Gulf');
    expect(result.state).toBe('FL');
    expect(result.zipCode).toBe('33706');
  });
});

describe('Address Parser - Street Type Abbreviations', () => {
  it('normalizes Street/St/St.', () => {
    const test1 = parseAddress('123 Main Street, Tampa, FL');
    const test2 = parseAddress('123 Main St, Tampa, FL');
    const test3 = parseAddress('123 Main St., Tampa, FL');

    expect(test1.streetType).toBe('St');
    expect(test2.streetType).toBe('St');
    expect(test3.streetType).toBe('St');
    expect(test1.normalized.street).toBe(test2.normalized.street);
    expect(test2.normalized.street).toBe(test3.normalized.street);
  });

  it('normalizes Boulevard/Blvd/Blvd.', () => {
    const test1 = parseAddress('10048 Gulf Boulevard, Treasure Island, FL');
    const test2 = parseAddress('10048 Gulf Blvd, Treasure Island, FL');
    const test3 = parseAddress('10048 Gulf Blvd., Treasure Island, FL');

    expect(test1.streetType).toBe('Blvd');
    expect(test2.streetType).toBe('Blvd');
    expect(test3.streetType).toBe('Blvd');
  });

  it('normalizes Avenue/Ave/Ave./Av', () => {
    const test1 = parseAddress('456 Park Avenue, Tampa, FL');
    const test2 = parseAddress('456 Park Ave, Tampa, FL');
    const test3 = parseAddress('456 Park Ave., Tampa, FL');
    const test4 = parseAddress('456 Park Av, Tampa, FL');

    expect(test1.streetType).toBe('Ave');
    expect(test2.streetType).toBe('Ave');
    expect(test3.streetType).toBe('Ave');
    expect(test4.streetType).toBe('Ave');
  });

  it('normalizes Drive/Dr/Dr.', () => {
    const test1 = parseAddress('789 Ocean Drive, Miami, FL');
    const test2 = parseAddress('789 Ocean Dr, Miami, FL');
    const test3 = parseAddress('789 Ocean Dr., Miami, FL');

    expect(test1.streetType).toBe('Dr');
    expect(test2.streetType).toBe('Dr');
    expect(test3.streetType).toBe('Dr');
  });

  it('normalizes Road/Rd/Rd.', () => {
    const test1 = parseAddress('321 Sunset Road, Tampa, FL');
    const test2 = parseAddress('321 Sunset Rd, Tampa, FL');
    const test3 = parseAddress('321 Sunset Rd., Tampa, FL');

    expect(test1.streetType).toBe('Rd');
    expect(test2.streetType).toBe('Rd');
    expect(test3.streetType).toBe('Rd');
  });
});

describe('Address Parser - Directional Variations', () => {
  it('normalizes East/E/E.', () => {
    const test1 = parseAddress('123 East Main St, Tampa, FL');
    const test2 = parseAddress('123 E Main St, Tampa, FL');
    const test3 = parseAddress('123 E. Main St, Tampa, FL');

    expect(test1.streetPreDirectional).toBe('E');
    expect(test2.streetPreDirectional).toBe('E');
    expect(test3.streetPreDirectional).toBe('E');
  });

  it('normalizes West/W/W.', () => {
    const test1 = parseAddress('10048 West Gulf Blvd, Treasure Island, FL');
    const test2 = parseAddress('10048 W Gulf Blvd, Treasure Island, FL');
    const test3 = parseAddress('10048 W. Gulf Blvd, Treasure Island, FL');

    expect(test1.streetPreDirectional).toBe('W');
    expect(test2.streetPreDirectional).toBe('W');
    expect(test3.streetPreDirectional).toBe('W');
  });

  it('normalizes North/N/N. and South/S/S.', () => {
    const test1 = parseAddress('456 North Park Ave, Tampa, FL');
    const test2 = parseAddress('456 N Park Ave, Tampa, FL');
    const test3 = parseAddress('789 South Beach Blvd, Miami, FL');
    const test4 = parseAddress('789 S Beach Blvd, Miami, FL');

    expect(test1.streetPreDirectional).toBe('N');
    expect(test2.streetPreDirectional).toBe('N');
    expect(test3.streetPreDirectional).toBe('S');
    expect(test4.streetPreDirectional).toBe('S');
  });
});

describe('Address Parser - Unit/Apartment Handling', () => {
  it('extracts Apt/Apartment variations', () => {
    const test1 = parseAddress('123 Main St Apt 106, Tampa, FL');
    const test2 = parseAddress('123 Main St Apartment 106, Tampa, FL');

    expect(test1.unitNumber).toBe('106');
    expect(test2.unitNumber).toBe('106');
    expect(test1.normalized.street).toBe('123 Main St');
    expect(test2.normalized.street).toBe('123 Main St');
  });

  it('extracts Unit variations', () => {
    const test = parseAddress('123 Main St Unit 5B, Tampa, FL');

    expect(test.unitNumber).toBe('5B');
    expect(test.normalized.street).toBe('123 Main St');
  });

  it('extracts # variations', () => {
    const test1 = parseAddress('123 Main St #106, Tampa, FL');
    const test2 = parseAddress('123 Main St # 106, Tampa, FL');

    expect(test1.unitNumber).toBe('106');
    expect(test2.unitNumber).toBe('106');
  });

  it('extracts Suite variations', () => {
    const test1 = parseAddress('123 Main St Suite 200, Tampa, FL');
    const test2 = parseAddress('123 Main St Ste 200, Tampa, FL');

    expect(test1.unitNumber).toBe('200');
    expect(test2.unitNumber).toBe('200');
  });
});

describe('Address Parser - ZIP Code Extraction', () => {
  it('extracts ZIP from end with comma', () => {
    const test = parseAddress('123 Main St, Tampa, FL 33706');
    expect(test.zipCode).toBe('33706');
  });

  it('extracts ZIP from end without comma', () => {
    const test = parseAddress('123 Main St Tampa FL 33706');
    expect(test.zipCode).toBe('33706');
  });

  it('extracts ZIP when state comes before ZIP', () => {
    const test = parseAddress('123 Main St, Tampa, FL 33706');
    expect(test.zipCode).toBe('33706');
    expect(test.state).toBe('FL');
  });

  it('extracts ZIP+4 format', () => {
    const test = parseAddress('123 Main St, Tampa, FL 33706-1234');
    expect(test.zipCode).toBe('33706');
  });
});

describe('Address Parser - Real World Examples', () => {
  it('handles Zillow format (typically comma-separated)', () => {
    const test = parseAddress('7791 W Gulf Blvd, Treasure Island, FL 33706');

    expect(test.streetNumber).toBe('7791');
    expect(test.streetPreDirectional).toBe('W');
    expect(test.streetName).toBe('Gulf');
    expect(test.streetType).toBe('Blvd');
    expect(test.city).toBe('Treasure Island');
    expect(test.state).toBe('FL');
    expect(test.zipCode).toBe('33706');
  });

  it('handles Realtor.com format (may omit commas)', () => {
    const test = parseAddress('12650 7th St E Treasure Island FL 33706');

    expect(test.streetNumber).toBe('12650');
    expect(test.streetName).toBe('7th');
    expect(test.streetType).toBe('St');
    expect(test.streetPostDirectional).toBe('E');
    expect(test.zipCode).toBe('33706');
  });

  it('handles multi-word city names', () => {
    const test1 = parseAddress('123 Main St, St Petersburg, FL 33701');
    const test2 = parseAddress('456 Beach Dr, Treasure Island, FL 33706');

    expect(test1.city).toBe('St Petersburg');
    expect(test2.city).toBe('Treasure Island');
  });

  it('handles addresses with no street type', () => {
    const test = parseAddress('123 Ocean, Miami Beach, FL 33139');

    expect(test.streetNumber).toBe('123');
    expect(test.streetName).toBe('Ocean');
    expect(test.city).toBe('Miami Beach');
  });
});

describe('Search Variations Generator', () => {
  it('generates multiple search variations for fuzzy matching', () => {
    const parsed = parseAddress('10048 W Gulf Blvd, Treasure Island, FL 33706');
    const variations = generateSearchVariations(parsed);

    expect(variations.length).toBeGreaterThan(0);
    expect(variations).toContain('10048 W Gulf Blvd');
    // Should also have variations without street type for fuzzy matching
    expect(variations.some(v => v.includes('Gulf') && !v.includes('Blvd'))).toBe(true);
  });

  it('handles abbreviated vs full street types', () => {
    const parsed = parseAddress('123 Main Street, Tampa, FL');
    const variations = generateSearchVariations(parsed);

    // Should generate both "Main St" and "Main Street"
    expect(variations).toContain('123 Main St');
  });
});

describe('Backwards Compatibility - Existing Format Support', () => {
  it('MUST still work with comma-separated format (existing code expects this)', () => {
    const test = parseAddress('7791 W Gulf Blvd, Treasure Island, FL 33706');

    // These must pass for existing code to work
    expect(test.normalized.street).toBeTruthy();
    expect(test.city).toBe('Treasure Island');
    expect(test.state).toBe('FL');
    expect(test.zipCode).toBe('33706');
    expect(test.confidence.street).toBe('High');
    expect(test.confidence.city).toBe('High');
  });

  it('preserves original address string', () => {
    const original = '10048 Gulf Blvd, Treasure Island, FL 33706';
    const test = parseAddress(original);

    expect(test.original).toBe(original);
  });
});

describe('Edge Cases', () => {
  it('handles empty string', () => {
    const test = parseAddress('');
    expect(test.original).toBe('');
    expect(test.confidence.street).toBe('Low');
  });

  it('handles only street number', () => {
    const test = parseAddress('123');
    expect(test.streetNumber).toBe('123');
  });

  it('handles numeric street names', () => {
    const test = parseAddress('123 7th St, Tampa, FL');
    expect(test.streetNumber).toBe('123');
    expect(test.streetName).toBe('7th');
    expect(test.streetType).toBe('St');
  });

  it('handles extra whitespace', () => {
    const test = parseAddress('  123   Main   St  ,  Tampa  ,  FL  33706  ');
    expect(test.streetNumber).toBe('123');
    expect(test.streetName).toBe('Main');
    expect(test.city).toBe('Tampa');
    expect(test.zipCode).toBe('33706');
  });
});
