/**
 * CLUES Property Dashboard - CSV Validation Module
 *
 * Validates CSV data before import to ensure:
 * 1. Field values are within acceptable ranges
 * 2. Data types match expected schema types
 * 3. Required fields are present
 * 4. Field keys map correctly to schema
 *
 * Created: 2025-12-01
 */

import { FIELD_TO_PROPERTY_MAP } from './field-normalizer';
import { ALL_FIELDS, FIELD_BY_KEY } from '@/types/fields-schema';

// =============================================================================
// TYPES
// =============================================================================

export interface ValidationError {
  fieldKey: string;
  fieldNumber: number;
  fieldLabel: string;
  value: any;
  errorType: 'range' | 'type' | 'required' | 'unknown_field' | 'format';
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  validatedData: Record<string, any>;
  blockedFields: string[];
  passedFields: string[];
  summary: {
    totalFields: number;
    validFields: number;
    blockedFields: number;
    warningFields: number;
  };
}

export interface FieldValidationRule {
  fieldNumber: number;
  apiKey: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'any';
  required: boolean;
  validation?: (val: any) => boolean;
  rangeDescription?: string;
}

// =============================================================================
// VALIDATION RULES - Extracted from field-normalizer.ts and fields-schema.ts
// =============================================================================

const VALIDATION_RULES: Map<string, FieldValidationRule> = new Map();

// Build validation rules from FIELD_TO_PROPERTY_MAP
FIELD_TO_PROPERTY_MAP.forEach(mapping => {
  const schemaField = ALL_FIELDS.find(f => f.num === mapping.fieldNumber);

  VALIDATION_RULES.set(mapping.apiKey, {
    fieldNumber: typeof mapping.fieldNumber === "number" ? mapping.fieldNumber : parseInt(mapping.fieldNumber) || 0,
    apiKey: mapping.apiKey,
    type: mapping.type,
    required: schemaField?.required || false,
    validation: mapping.validation,
    rangeDescription: getRangeDescription(typeof mapping.fieldNumber === "number" ? mapping.fieldNumber : 0, mapping.validation),
  });
});

/**
 * Generate human-readable range descriptions for fields with validation
 */
function getRangeDescription(fieldNumber: number, validation?: (val: any) => boolean): string | undefined {
  if (!validation) return undefined;

  const descriptions: Record<number, string> = {
    10: '$0 - $1,000,000,000',
    11: '$0 - $50,000/sqft',
    12: '$0 - $1,000,000,000',
    14: '$0 - $1,000,000,000',
    15: '$0 - $1,000,000,000',
    17: '0 - 50 bedrooms',
    18: '0 - 30 full baths',
    19: '0 - 20 half baths',
    20: '0 - 50 total baths',
    21: '1 - 100,000 sqft',
    22: '1 - 150,000 sqft',
    23: '> 0 sqft',
    24: '> 0 acres',
    25: '1700 - current year + 2',
    27: '1 - 100 stories',
    28: '0 - 20 spaces',
    31: '$0 - $500,000/year',
    35: '$0 - $200,000/year',
    36: '1900 - current year + 1',
    140: '0 - 20 spaces',
    143: '0 - 20 spaces',
    144: '0 - 200',
    145: '1 - 200',
    148: '1 - 10 floors',
    153: '$0 - $50,000',
    156: '0 - 10,000 feet',
    164: '0 - 500 lbs',
  };

  return descriptions[fieldNumber];
}

// =============================================================================
// REQUIRED FIELDS - From fields-schema.ts
// =============================================================================

const REQUIRED_FIELD_NUMBERS = new Set([1, 17, 18, 21, 25, 26]);

// =============================================================================
// CORE VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate a single field value against its schema rules
 */
export function validateFieldValue(
  apiKey: string,
  value: any,
  label?: string
): { valid: boolean; error?: ValidationError; coercedValue: any } {
  const rule = VALIDATION_RULES.get(apiKey);

  // Check if field exists in schema
  if (!rule) {
    // Try to find by extracting field number from key
    const fieldNumMatch = apiKey.match(/^(\d+)_/);
    if (fieldNumMatch) {
      const fieldNum = parseInt(fieldNumMatch[1]);
      if (fieldNum < 1 || fieldNum > 181) {
        return {
          valid: false,
          coercedValue: null,
          error: {
            fieldKey: apiKey,
            fieldNumber: fieldNum,
            fieldLabel: label || apiKey,
            value,
            errorType: 'unknown_field',
            message: `Field number ${fieldNum} is outside valid range (1-181)`,
            severity: 'error',
          },
        };
      }
    }
    // Unknown field - allow but warn
    return {
      valid: true,
      coercedValue: value,
      error: {
        fieldKey: apiKey,
        fieldNumber: 0,
        fieldLabel: label || apiKey,
        value,
        errorType: 'unknown_field',
        message: `Field "${apiKey}" not found in schema - data may not be stored correctly`,
        severity: 'warning',
      },
    };
  }

  const fieldLabel = label || FIELD_BY_KEY.get(rule.apiKey.replace(/^\d+_/, ''))?.label || apiKey;

  // Check required fields
  if (rule.required && (value === null || value === undefined || value === '')) {
    return {
      valid: false,
      coercedValue: null,
      error: {
        fieldKey: apiKey,
        fieldNumber: rule.fieldNumber,
        fieldLabel,
        value,
        errorType: 'required',
        message: `Required field "${fieldLabel}" is missing or empty`,
        severity: 'error',
      },
    };
  }

  // Skip validation for empty non-required fields
  if (value === null || value === undefined || value === '') {
    return { valid: true, coercedValue: null };
  }

  // Type coercion and validation
  let coercedValue = value;

  switch (rule.type) {
    case 'number': {
      // Coerce to number
      if (typeof value === 'string') {
        coercedValue = parseFloat(value.replace(/[$,]/g, ''));
      } else if (typeof value !== 'number') {
        coercedValue = parseFloat(String(value));
      }

      if (isNaN(coercedValue)) {
        return {
          valid: false,
          coercedValue: null,
          error: {
            fieldKey: apiKey,
            fieldNumber: rule.fieldNumber,
            fieldLabel,
            value,
            errorType: 'type',
            message: `"${fieldLabel}" expects a number, got "${value}"`,
            severity: 'error',
          },
        };
      }

      // Range validation
      if (rule.validation && !rule.validation(coercedValue)) {
        return {
          valid: false,
          coercedValue: null,
          error: {
            fieldKey: apiKey,
            fieldNumber: rule.fieldNumber,
            fieldLabel,
            value: coercedValue,
            errorType: 'range',
            message: `"${fieldLabel}" value ${coercedValue} is out of range${rule.rangeDescription ? ` (${rule.rangeDescription})` : ''}`,
            severity: 'error',
          },
        };
      }
      break;
    }

    case 'boolean': {
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        coercedValue = lower === 'true' || lower === 'yes' || lower === '1' || lower === 'y';
      } else {
        coercedValue = Boolean(value);
      }
      break;
    }

    case 'array': {
      if (typeof value === 'string') {
        coercedValue = value.split(',').map(s => s.trim()).filter(Boolean);
      } else if (!Array.isArray(value)) {
        coercedValue = [String(value)];
      }
      break;
    }

    case 'date': {
      // Basic date format validation
      if (typeof value === 'string' && value.trim()) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{1,2}\/\d{1,2}\/\d{4}$|^\d{1,2}-\d{1,2}-\d{4}$/;
        if (!dateRegex.test(value) && isNaN(Date.parse(value))) {
          return {
            valid: true, // Allow but warn
            coercedValue: value,
            error: {
              fieldKey: apiKey,
              fieldNumber: rule.fieldNumber,
              fieldLabel,
              value,
              errorType: 'format',
              message: `"${fieldLabel}" has unusual date format: "${value}"`,
              severity: 'warning',
            },
          };
        }
      }
      coercedValue = String(value);
      break;
    }

    case 'string':
    default:
      coercedValue = String(value);
      break;
  }

  return { valid: true, coercedValue };
}

/**
 * Validate an entire CSV row (single property)
 */
export function validateCsvRow(
  row: Record<string, any>,
  rowIndex: number = 0
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const validatedData: Record<string, any> = {};
  const blockedFields: string[] = [];
  const passedFields: string[] = [];

  // Process each field in the row
  for (const [key, value] of Object.entries(row)) {
    // Skip empty values for non-required fields
    if (value === null || value === undefined || value === '') {
      continue;
    }

    const { valid, error, coercedValue } = validateFieldValue(key, value);

    if (error) {
      if (error.severity === 'error') {
        errors.push({ ...error, message: `Row ${rowIndex + 1}: ${error.message}` });
        blockedFields.push(key);
      } else {
        warnings.push({ ...error, message: `Row ${rowIndex + 1}: ${error.message}` });
        // Warnings still pass data through
        if (coercedValue !== null) {
          validatedData[key] = coercedValue;
          passedFields.push(key);
        }
      }
    } else if (valid && coercedValue !== null) {
      validatedData[key] = coercedValue;
      passedFields.push(key);
    }
  }

  // Check for missing required fields
  for (const fieldNum of REQUIRED_FIELD_NUMBERS) {
    const mapping = FIELD_TO_PROPERTY_MAP.find(m => m.fieldNumber === fieldNum);
    if (mapping) {
      const hasValue = row[mapping.apiKey] !== undefined && row[mapping.apiKey] !== null && row[mapping.apiKey] !== '';
      if (!hasValue) {
        const schemaField = ALL_FIELDS.find(f => f.num === fieldNum);
        warnings.push({
          fieldKey: mapping.apiKey,
          fieldNumber: fieldNum,
          fieldLabel: schemaField?.label || mapping.apiKey,
          value: null,
          errorType: 'required',
          message: `Row ${rowIndex + 1}: Recommended field "${schemaField?.label || mapping.apiKey}" is missing`,
          severity: 'warning',
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    validatedData,
    blockedFields,
    passedFields,
    summary: {
      totalFields: Object.keys(row).filter(k => row[k] !== null && row[k] !== undefined && row[k] !== '').length,
      validFields: passedFields.length,
      blockedFields: blockedFields.length,
      warningFields: warnings.length,
    },
  };
}

/**
 * Validate an entire CSV dataset (multiple properties)
 */
export function validateCsvData(
  data: Record<string, any>[]
): {
  isValid: boolean;
  results: ValidationResult[];
  totalErrors: number;
  totalWarnings: number;
  validRows: number;
  invalidRows: number;
  allValidatedData: Record<string, any>[];
} {
  const results = data.map((row, index) => validateCsvRow(row, index));

  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  const validRows = results.filter(r => r.isValid).length;
  const invalidRows = results.filter(r => !r.isValid).length;
  const allValidatedData = results.map(r => r.validatedData);

  return {
    isValid: totalErrors === 0,
    results,
    totalErrors,
    totalWarnings,
    validRows,
    invalidRows,
    allValidatedData,
  };
}

/**
 * Map a CSV header to its correct schema field key
 * Returns null if the header cannot be mapped
 */
export function mapCsvHeaderToSchemaKey(header: string): string | null {
  // Direct match (e.g., "10_listing_price")
  if (VALIDATION_RULES.has(header)) {
    return header;
  }

  // Try to find by field number prefix
  const fieldNumMatch = header.match(/^(\d+)_/);
  if (fieldNumMatch) {
    const fieldNum = parseInt(fieldNumMatch[1]);
    const mapping = FIELD_TO_PROPERTY_MAP.find(m => m.fieldNumber === fieldNum);
    if (mapping) {
      return mapping.apiKey;
    }
  }

  // Try to find by label match
  const schemaField = ALL_FIELDS.find(f =>
    f.label.toLowerCase() === header.toLowerCase() ||
    f.key.toLowerCase() === header.toLowerCase().replace(/\s+/g, '_')
  );
  if (schemaField) {
    return `${schemaField.num}_${schemaField.key}`;
  }

  return null;
}

/**
 * Normalize CSV headers to schema field keys
 */
export function normalizeCsvHeaders(
  headers: string[]
): {
  mappedHeaders: Map<string, string>;
  unmappedHeaders: string[];
} {
  const mappedHeaders = new Map<string, string>();
  const unmappedHeaders: string[] = [];

  for (const header of headers) {
    const schemaKey = mapCsvHeaderToSchemaKey(header);
    if (schemaKey) {
      mappedHeaders.set(header, schemaKey);
    } else {
      unmappedHeaders.push(header);
    }
  }

  return { mappedHeaders, unmappedHeaders };
}

/**
 * Get validation summary for display
 */
export function getValidationSummary(result: ValidationResult): string {
  const { summary, errors, warnings } = result;

  const lines = [
    `Total fields: ${summary.totalFields}`,
    `Valid fields: ${summary.validFields}`,
    `Blocked fields: ${summary.blockedFields}`,
  ];

  if (errors.length > 0) {
    lines.push(`\nErrors (${errors.length}):`);
    errors.slice(0, 5).forEach(e => lines.push(`  - ${e.message}`));
    if (errors.length > 5) {
      lines.push(`  ... and ${errors.length - 5} more errors`);
    }
  }

  if (warnings.length > 0) {
    lines.push(`\nWarnings (${warnings.length}):`);
    warnings.slice(0, 3).forEach(w => lines.push(`  - ${w.message}`));
    if (warnings.length > 3) {
      lines.push(`  ... and ${warnings.length - 3} more warnings`);
    }
  }

  return lines.join('\n');
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  VALIDATION_RULES,
  REQUIRED_FIELD_NUMBERS,
};
