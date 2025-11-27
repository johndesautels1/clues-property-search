/**
 * CLUES Property Dashboard - Schema Integrity Tests
 * 
 * These tests ensure the ONE SOURCE OF TRUTH schema is valid.
 * Run these tests before every deploy.
 */

import { describe, test, expect } from 'vitest';
import { 
  ALL_FIELDS, 
  FIELD_MAP, 
  FIELD_BY_NUMBER, 
  FIELD_BY_KEY,
  TOTAL_FIELDS,
  FIELD_GROUPS,
  getFieldByNumber,
  getFieldByKey,
  getFieldByFullKey
} from '../src/types/fields-schema';

describe('Schema Integrity Tests', () => {
  
  test('Has exactly 110 fields', () => {
    expect(TOTAL_FIELDS).toBe(110);
    expect(ALL_FIELDS.length).toBe(110);
  });

  test('No duplicate field numbers', () => {
    const numbers = ALL_FIELDS.map(f => f.num);
    const uniqueNumbers = new Set(numbers);
    
    if (uniqueNumbers.size !== numbers.length) {
      const duplicates = numbers.filter((num, idx) => numbers.indexOf(num) !== idx);
      throw new Error(`Duplicate field numbers found: ${duplicates.join(', ')}`);
    }
    
    expect(uniqueNumbers.size).toBe(numbers.length);
  });

  test('No duplicate field keys', () => {
    const keys = ALL_FIELDS.map(f => f.key);
    const uniqueKeys = new Set(keys);
    
    if (uniqueKeys.size !== keys.length) {
      const duplicates = keys.filter((key, idx) => keys.indexOf(key) !== idx);
      throw new Error(`Duplicate field keys found: ${duplicates.join(', ')}`);
    }
    
    expect(uniqueKeys.size).toBe(keys.length);
  });

  test('Field numbers are sequential from 1 to 110', () => {
    const numbers = ALL_FIELDS.map(f => f.num).sort((a, b) => a - b);
    
    for (let i = 0; i < numbers.length; i++) {
      expect(numbers[i]).toBe(i + 1);
    }
  });

  test('All fields have required properties', () => {
    ALL_FIELDS.forEach(field => {
      expect(field.num).toBeDefined();
      expect(typeof field.num).toBe('number');
      
      expect(field.key).toBeDefined();
      expect(typeof field.key).toBe('string');
      expect(field.key.length).toBeGreaterThan(0);
      
      expect(field.label).toBeDefined();
      expect(typeof field.label).toBe('string');
      expect(field.label.length).toBeGreaterThan(0);
      
      expect(field.group).toBeDefined();
      expect(typeof field.group).toBe('string');
      expect(field.group.length).toBeGreaterThan(0);
      
      expect(field.type).toBeDefined();
      expect(['text', 'number', 'boolean', 'select', 'multiselect', 'date', 'currency', 'percentage']).toContain(field.type);
      
      expect(typeof field.required).toBe('boolean');
    });
  });

  test('Select fields have options', () => {
    const selectFields = ALL_FIELDS.filter(f => f.type === 'select' || f.type === 'multiselect');
    
    selectFields.forEach(field => {
      expect(field.options).toBeDefined();
      expect(Array.isArray(field.options)).toBe(true);
      expect(field.options!.length).toBeGreaterThan(0);
    });
  });

  test('Field keys use snake_case', () => {
    ALL_FIELDS.forEach(field => {
      expect(field.key).toMatch(/^[a-z][a-z0-9_]*$/);
    });
  });

  test('FIELD_MAP contains all fields', () => {
    expect(FIELD_MAP.size).toBe(110);
    
    ALL_FIELDS.forEach(field => {
      const key = `${field.num}_${field.key}`;
      expect(FIELD_MAP.has(key)).toBe(true);
      expect(FIELD_MAP.get(key)).toEqual(field);
    });
  });

  test('FIELD_BY_NUMBER contains all fields', () => {
    expect(FIELD_BY_NUMBER.size).toBe(110);
    
    ALL_FIELDS.forEach(field => {
      expect(FIELD_BY_NUMBER.has(field.num)).toBe(true);
      expect(FIELD_BY_NUMBER.get(field.num)).toEqual(field);
    });
  });

  test('FIELD_BY_KEY contains all fields', () => {
    expect(FIELD_BY_KEY.size).toBe(110);
    
    ALL_FIELDS.forEach(field => {
      expect(FIELD_BY_KEY.has(field.key)).toBe(true);
      expect(FIELD_BY_KEY.get(field.key)).toEqual(field);
    });
  });

  test('Helper functions work correctly', () => {
    const field7 = getFieldByNumber(7);
    expect(field7).toBeDefined();
    expect(field7?.key).toBe('listing_price');
    
    const fieldByKey = getFieldByKey('listing_price');
    expect(fieldByKey).toBeDefined();
    expect(fieldByKey?.num).toBe(7);
    
    const fieldByFullKey = getFieldByFullKey('7_listing_price');
    expect(fieldByFullKey).toBeDefined();
    expect(fieldByFullKey?.num).toBe(7);
  });

  test('All groups are represented', () => {
    const expectedGroups = [
      'Address & Identity',
      'Pricing',
      'Property Basics',
      'HOA & Ownership',
      'Taxes & Assessments',
      'Structure & Systems',
      'Interior Features',
      'Exterior Features',
      'Permits & Renovations',
      'Schools',
      'Location Scores',
      'Distances & Amenities',
      'Safety & Crime',
      'Market & Investment',
      'Utilities',
      'Environment & Risk',
      'Additional Features'
    ];
    
    expectedGroups.forEach(group => {
      expect(FIELD_GROUPS).toContain(group);
    });
  });

  test('No orphan groups (all groups have fields)', () => {
    FIELD_GROUPS.forEach(group => {
      const fieldsInGroup = ALL_FIELDS.filter(f => f.group === group);
      expect(fieldsInGroup.length).toBeGreaterThan(0);
    });
  });

  test('Specific field mappings are correct (regression test)', () => {
    expect(getFieldByNumber(7)?.key).toBe('listing_price');
    expect(getFieldByNumber(12)?.key).toBe('bedrooms');
    expect(getFieldByNumber(20)?.key).toBe('year_built');
    expect(getFieldByNumber(30)?.key).toBe('tax_year');
    expect(getFieldByNumber(70)?.key).toBe('walkability_description');
    expect(getFieldByNumber(85)?.key).toBe('rental_estimate_monthly');
    expect(getFieldByNumber(100)?.key).toBe('flood_zone');
    expect(getFieldByNumber(110)?.key).toBe('notes_confidence_summary');
  });
});
