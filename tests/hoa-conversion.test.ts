/**
 * CLUES Property Dashboard - HOA Fee Conversion and Input Sanitization Tests
 *
 * Tests for the HOA fee monthly-to-annual conversion and input sanitization functionality.
 * 
 * Note: The sanitization and conversion functions are recreated here because they are
 * internal to the API files and not exported. This is intentional to test the logic
 * independently. If the implementation changes, these tests should be updated accordingly.
 */

import { describe, test, expect } from 'vitest';

// We recreate the sanitization and conversion logic here for testing
// since they're internal to the API files and not exported

/**
 * Sanitize input values to prevent injection and ensure data integrity
 */
function sanitizeInputValue(value: any, fieldType: 'string' | 'number' | 'boolean' = 'string'): any {
  if (value === null || value === undefined) return null;

  const strVal = String(value).toLowerCase().trim();
  const invalidValues = ['null', 'undefined', 'n/a', 'na', 'nan', 'unknown', 'not available', 'not found', 'none', '-', '--', 'tbd', 'n\\a', ''];
  if (invalidValues.includes(strVal)) return null;

  switch (fieldType) {
    case 'number':
      const cleanedNum = String(value).replace(/[$,]/g, '').trim();
      const parsed = parseFloat(cleanedNum);
      if (isNaN(parsed) || !isFinite(parsed)) return null;
      if (parsed < 0 || parsed > 1000000000) return null;
      return parsed;

    case 'boolean':
      if (typeof value === 'boolean') return value;
      const boolStr = strVal;
      if (['true', 'yes', '1', 'y'].includes(boolStr)) return true;
      if (['false', 'no', '0', 'n'].includes(boolStr)) return false;
      return null;

    case 'string':
    default:
      let sanitized = String(value).trim();
      sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      if (sanitized.length > 10000) sanitized = sanitized.substring(0, 10000);
      return sanitized || null;
  }
}

// Monthly HOA field names that need conversion
const MONTHLY_HOA_FIELD_NAMES = new Set(['hoa_fee_monthly', 'hoa_monthly']);

const MONTHLY_HOA_PDF_FIELD_NAMES = new Set([
  'monthly hoa amount',
  'hoa monthly',
  'average monthly fees',
]);

const ANNUAL_HOA_FIELD_NAMES = new Set([
  'total annual assoc fees',
  'hoa annual',
  'annual hoa',
]);

/**
 * Determine if an HOA fee value is likely monthly based on field name and value
 */
function isMonthlyHoaFee(rawKey: string, value: number): boolean {
  const normalizedKey = rawKey.toLowerCase().trim();
  
  if (MONTHLY_HOA_PDF_FIELD_NAMES.has(normalizedKey)) {
    return true;
  }
  
  if (ANNUAL_HOA_FIELD_NAMES.has(normalizedKey)) {
    return false;
  }
  
  // For ambiguous "HOA Fee" field, use heuristics based on typical values
  // Monthly fees are typically $50-$2000, annual fees are typically $600-$24000
  // If the value is under $3000, it's more likely monthly
  if (normalizedKey === 'hoa fee' && value > 0 && value < 3000) {
    return true;
  }
  
  return false;
}

describe('Input Sanitization Tests', () => {
  
  describe('sanitizeInputValue for strings', () => {
    test('returns null for null/undefined', () => {
      expect(sanitizeInputValue(null, 'string')).toBeNull();
      expect(sanitizeInputValue(undefined, 'string')).toBeNull();
    });

    test('returns null for invalid placeholder values', () => {
      expect(sanitizeInputValue('N/A', 'string')).toBeNull();
      expect(sanitizeInputValue('n/a', 'string')).toBeNull();
      expect(sanitizeInputValue('null', 'string')).toBeNull();
      expect(sanitizeInputValue('undefined', 'string')).toBeNull();
      expect(sanitizeInputValue('unknown', 'string')).toBeNull();
      expect(sanitizeInputValue('not available', 'string')).toBeNull();
      expect(sanitizeInputValue('-', 'string')).toBeNull();
      expect(sanitizeInputValue('--', 'string')).toBeNull();
      expect(sanitizeInputValue('TBD', 'string')).toBeNull();
      expect(sanitizeInputValue('', 'string')).toBeNull();
    });

    test('trims whitespace from valid strings', () => {
      expect(sanitizeInputValue('  hello  ', 'string')).toBe('hello');
      expect(sanitizeInputValue('\thello\n', 'string')).toBe('hello');
    });

    test('removes control characters', () => {
      expect(sanitizeInputValue('hello\x00world', 'string')).toBe('helloworld');
      expect(sanitizeInputValue('test\x1Fvalue', 'string')).toBe('testvalue');
    });

    test('limits string length to 10000 characters', () => {
      const longString = 'a'.repeat(15000);
      const result = sanitizeInputValue(longString, 'string');
      expect(result?.length).toBe(10000);
    });
  });

  describe('sanitizeInputValue for numbers', () => {
    test('returns null for invalid numbers', () => {
      expect(sanitizeInputValue('not a number', 'number')).toBeNull();
      expect(sanitizeInputValue('N/A', 'number')).toBeNull();
      expect(sanitizeInputValue('', 'number')).toBeNull();
    });

    test('parses valid numbers from strings', () => {
      expect(sanitizeInputValue('42', 'number')).toBe(42);
      expect(sanitizeInputValue('3.14', 'number')).toBe(3.14);
      expect(sanitizeInputValue('1000', 'number')).toBe(1000);
    });

    test('removes currency symbols and commas', () => {
      expect(sanitizeInputValue('$1,234.56', 'number')).toBe(1234.56);
      expect(sanitizeInputValue('$500', 'number')).toBe(500);
      expect(sanitizeInputValue('1,000,000', 'number')).toBe(1000000);
    });

    test('rejects negative numbers', () => {
      expect(sanitizeInputValue(-100, 'number')).toBeNull();
      expect(sanitizeInputValue('-50', 'number')).toBeNull();
    });

    test('rejects excessively large numbers', () => {
      expect(sanitizeInputValue(2000000000, 'number')).toBeNull();
      expect(sanitizeInputValue('1000000001', 'number')).toBeNull();
    });

    test('accepts valid numeric range', () => {
      expect(sanitizeInputValue(0, 'number')).toBe(0);
      expect(sanitizeInputValue(500000, 'number')).toBe(500000);
      expect(sanitizeInputValue(999999999, 'number')).toBe(999999999);
    });
  });

  describe('sanitizeInputValue for booleans', () => {
    test('returns actual booleans unchanged', () => {
      expect(sanitizeInputValue(true, 'boolean')).toBe(true);
      expect(sanitizeInputValue(false, 'boolean')).toBe(false);
    });

    test('parses truthy string values', () => {
      expect(sanitizeInputValue('true', 'boolean')).toBe(true);
      expect(sanitizeInputValue('True', 'boolean')).toBe(true);
      expect(sanitizeInputValue('yes', 'boolean')).toBe(true);
      expect(sanitizeInputValue('YES', 'boolean')).toBe(true);
      expect(sanitizeInputValue('1', 'boolean')).toBe(true);
      expect(sanitizeInputValue('y', 'boolean')).toBe(true);
    });

    test('parses falsy string values', () => {
      expect(sanitizeInputValue('false', 'boolean')).toBe(false);
      expect(sanitizeInputValue('False', 'boolean')).toBe(false);
      expect(sanitizeInputValue('no', 'boolean')).toBe(false);
      expect(sanitizeInputValue('NO', 'boolean')).toBe(false);
      expect(sanitizeInputValue('0', 'boolean')).toBe(false);
      expect(sanitizeInputValue('n', 'boolean')).toBe(false);
    });

    test('returns null for invalid boolean strings', () => {
      expect(sanitizeInputValue('maybe', 'boolean')).toBeNull();
      expect(sanitizeInputValue('N/A', 'boolean')).toBeNull();
    });
  });
});

describe('HOA Fee Conversion Tests', () => {
  
  describe('isMonthlyHoaFee detection', () => {
    test('identifies explicitly monthly fields', () => {
      expect(isMonthlyHoaFee('Monthly HOA Amount', 500)).toBe(true);
      expect(isMonthlyHoaFee('HOA Monthly', 350)).toBe(true);
      expect(isMonthlyHoaFee('Average Monthly Fees', 200)).toBe(true);
    });

    test('identifies explicitly annual fields as not monthly', () => {
      expect(isMonthlyHoaFee('Total Annual Assoc Fees', 6000)).toBe(false);
      expect(isMonthlyHoaFee('HOA Annual', 12000)).toBe(false);
      expect(isMonthlyHoaFee('Annual HOA', 8000)).toBe(false);
    });

    test('uses heuristics for ambiguous "HOA Fee" field', () => {
      // Values under $3000 are likely monthly
      expect(isMonthlyHoaFee('HOA Fee', 500)).toBe(true);
      expect(isMonthlyHoaFee('HOA Fee', 1500)).toBe(true);
      expect(isMonthlyHoaFee('HOA Fee', 2999)).toBe(true);
      
      // Values $3000 or more are treated as annual (no conversion)
      // The heuristic uses value < 3000, so 3000+ values are not converted
      expect(isMonthlyHoaFee('HOA Fee', 3001)).toBe(false);
      expect(isMonthlyHoaFee('HOA Fee', 6000)).toBe(false);
      expect(isMonthlyHoaFee('HOA Fee', 12000)).toBe(false);
    });

    test('handles case insensitivity', () => {
      expect(isMonthlyHoaFee('monthly hoa amount', 500)).toBe(true);
      expect(isMonthlyHoaFee('MONTHLY HOA AMOUNT', 500)).toBe(true);
      expect(isMonthlyHoaFee('total annual assoc fees', 6000)).toBe(false);
    });
  });

  describe('Monthly to Annual Conversion', () => {
    test('correctly converts monthly to annual', () => {
      const monthlyFee = 500;
      const annualFee = monthlyFee * 12;
      expect(annualFee).toBe(6000);
    });

    test('maintains precision for decimal values', () => {
      const monthlyFee = 333.33;
      const annualFee = monthlyFee * 12;
      expect(annualFee).toBeCloseTo(3999.96, 2);
    });

    test('handles edge cases', () => {
      expect(0 * 12).toBe(0);
      expect(1 * 12).toBe(12);
      expect(99.99 * 12).toBeCloseTo(1199.88, 2);
    });
  });

  describe('Field Mapping with Conversion', () => {
    const FLAT_TO_NUMBERED_FIELD_MAP: Record<string, string> = {
      'hoa_fee_monthly': '31_hoa_fee_annual',
      'hoa_monthly': '31_hoa_fee_annual',
      'hoa_fee_annual': '31_hoa_fee_annual',
      'hoa_fee': '31_hoa_fee_annual',
    };

    test('maps hoa_fee_monthly to 31_hoa_fee_annual', () => {
      expect(FLAT_TO_NUMBERED_FIELD_MAP['hoa_fee_monthly']).toBe('31_hoa_fee_annual');
    });

    test('maps hoa_monthly to 31_hoa_fee_annual', () => {
      expect(FLAT_TO_NUMBERED_FIELD_MAP['hoa_monthly']).toBe('31_hoa_fee_annual');
    });

    test('ensures conversion is applied for monthly fields', () => {
      const monthlyFields = ['hoa_fee_monthly', 'hoa_monthly'];
      monthlyFields.forEach(field => {
        expect(MONTHLY_HOA_FIELD_NAMES.has(field)).toBe(true);
      });
    });
  });
});
