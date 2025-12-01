/**
 * CLUES Property Dashboard - Safe JSON Parser & LLM Response Utilities
 * 
 * SHARED MODULE - Used by:
 * - api/property/search-stream.ts
 * - api/property/retry-llm.ts
 * - api/property/search.ts
 * - Any other LLM response handlers
 * 
 * Provides:
 * - Safe JSON parsing with error handling
 * - Type coercion for LLM-derived property data
 * - Input sanitization for user-provided addresses
 * 
 * CREATED: 2025-12-01 per 5-Agent Deep Audit recommendations
 */

/**
 * Parse result type - always returns defined structure
 */
export interface SafeParseResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
}

/**
 * Safely parse JSON with error handling
 * Returns a typed result instead of throwing
 * 
 * @param jsonString - String to parse
 * @param context - Optional context for error logging
 * @returns SafeParseResult with success flag and data/error
 */
export function safeJsonParse<T = unknown>(
  jsonString: string,
  context?: string
): SafeParseResult<T> {
  if (!jsonString || typeof jsonString !== 'string') {
    return {
      success: false,
      data: null,
      error: 'Invalid input: expected non-empty string',
    };
  }

  try {
    const data = JSON.parse(jsonString) as T;
    return {
      success: true,
      data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parse error';
    console.error(`[safeJsonParse]${context ? ` [${context}]` : ''} Failed to parse JSON:`, errorMessage);
    console.error(`[safeJsonParse] Input (first 500 chars):`, jsonString.substring(0, 500));
    
    return {
      success: false,
      data: null,
      error: errorMessage,
    };
  }
}

/**
 * Extract JSON from LLM response text that may contain markdown or extra content
 * Handles common patterns: ```json blocks, plain JSON, mixed content
 * 
 * @param text - Raw LLM response text
 * @param context - Optional context for error logging
 * @returns SafeParseResult with extracted and parsed JSON
 */
export function extractAndParseJson<T = unknown>(
  text: string,
  context?: string
): SafeParseResult<T> {
  if (!text || typeof text !== 'string') {
    return {
      success: false,
      data: null,
      error: 'Invalid input: expected non-empty string',
    };
  }

  let jsonStr = text.trim();

  // Try to extract JSON from markdown code blocks
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  // Try to find JSON object in text
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  return safeJsonParse<T>(jsonStr, context);
}

/**
 * Type coercion for LLM-derived property values
 * Converts string numbers to numbers, normalizes booleans, etc.
 */
export interface CoercionOptions {
  /** Convert strings like "yes"/"no" to boolean */
  normalizeBoolean?: boolean;
  /** Remove currency symbols and commas from numbers */
  cleanNumericStrings?: boolean;
  /** Trim whitespace from strings */
  trimStrings?: boolean;
}

const DEFAULT_COERCION_OPTIONS: CoercionOptions = {
  normalizeBoolean: true,
  cleanNumericStrings: true,
  trimStrings: true,
};

/**
 * Coerce a value to number if possible
 */
export function coerceToNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  
  if (typeof value === 'string') {
    // Remove currency symbols, commas, and whitespace
    const cleaned = value.replace(/[$,\s]/g, '').trim();
    if (cleaned === '' || cleaned === 'N/A' || cleaned === 'n/a') {
      return null;
    }
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  
  return null;
}

/**
 * Coerce a value to boolean
 * Handles: true/false, yes/no, 1/0, "true"/"false", etc.
 */
export function coerceToBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    
    if (['true', 'yes', 'y', '1', 'on'].includes(lower)) {
      return true;
    }
    if (['false', 'no', 'n', '0', 'off'].includes(lower)) {
      return false;
    }
    
    // Handle N/A as null (unknown)
    if (lower === 'n/a' || lower === 'unknown' || lower === '') {
      return null;
    }
  }
  
  return null;
}

/**
 * Coerce a value to string
 */
export function coerceToString(value: unknown, trim = true): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  const str = String(value);
  const result = trim ? str.trim() : str;
  
  // Treat empty or N/A as null
  if (result === '' || result.toLowerCase() === 'n/a') {
    return null;
  }
  
  return result;
}

/**
 * Coerce a value to array
 * Handles: comma-separated strings, arrays, single values
 */
export function coerceToArray(value: unknown): string[] {
  if (value === null || value === undefined || value === '') {
    return [];
  }
  
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(Boolean);
  }
  
  if (typeof value === 'string') {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }
  
  return [String(value)];
}

/**
 * Field type definitions for coercion
 */
export type FieldValueType = 'string' | 'number' | 'boolean' | 'array' | 'date' | 'currency' | 'percentage';

/**
 * Coerce a field value based on expected type
 * 
 * @param value - Raw value from LLM
 * @param expectedType - Expected field type
 * @param options - Coercion options
 * @returns Coerced value or null if invalid
 */
export function coerceFieldValue(
  value: unknown,
  expectedType: FieldValueType,
  options: CoercionOptions = DEFAULT_COERCION_OPTIONS
): unknown {
  switch (expectedType) {
    case 'number':
    case 'currency':
    case 'percentage':
      return coerceToNumber(value);
      
    case 'boolean':
      return coerceToBoolean(value);
      
    case 'array':
      return coerceToArray(value);
      
    case 'date':
    case 'string':
    default:
      return coerceToString(value, options.trimStrings);
  }
}

/**
 * Input sanitization for address parameters
 * Prevents prompt injection and normalizes input
 * 
 * @param address - Raw user-provided address
 * @returns Sanitized address string
 */
export function sanitizeAddress(address: string | undefined | null): string {
  if (!address || typeof address !== 'string') {
    return '';
  }
  
  let sanitized = address;
  
  // Remove control characters (but preserve newlines/tabs for parsing)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Remove potential prompt injection markers
  // Common patterns: "ignore previous instructions", "system:", etc.
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+(instructions?|prompts?)/gi,
    /forget\s+(all\s+)?previous/gi,
    /system\s*:/gi,
    /assistant\s*:/gi,
    /user\s*:/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /<<SYS>>/gi,
    /<\/SYS>>/gi,
  ];
  
  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // Enforce reasonable length limit (addresses shouldn't be longer than 500 chars)
  const MAX_ADDRESS_LENGTH = 500;
  if (sanitized.length > MAX_ADDRESS_LENGTH) {
    sanitized = sanitized.substring(0, MAX_ADDRESS_LENGTH);
  }
  
  return sanitized;
}

/**
 * Validate that an address looks reasonable
 * 
 * @param address - Address to validate
 * @returns true if address appears valid
 */
export function isValidAddress(address: string): boolean {
  if (!address || address.length < 5) {
    return false;
  }
  
  // Should contain at least some alphanumeric characters
  if (!/[a-zA-Z0-9]/.test(address)) {
    return false;
  }
  
  // Should not be all special characters
  if (/^[^a-zA-Z0-9]+$/.test(address)) {
    return false;
  }
  
  return true;
}

/**
 * Safely access nested object properties with optional chaining
 * Returns defaultValue if any part of the path is null/undefined
 * 
 * @param obj - Object to access
 * @param path - Dot-separated path (e.g., "data.choices.0.message.content")
 * @param defaultValue - Default value if path doesn't exist
 */
export function safeGet<T = unknown>(
  obj: unknown,
  path: string,
  defaultValue: T | null = null
): T | null {
  if (obj === null || obj === undefined) {
    return defaultValue;
  }
  
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    
    if (typeof current !== 'object') {
      return defaultValue;
    }
    
    current = (current as Record<string, unknown>)[key];
  }
  
  return (current === undefined ? defaultValue : current) as T | null;
}

/**
 * Create a standardized LLM response error object
 */
export interface LLMResponseError {
  source: string;
  error: string;
  timestamp: string;
  rawResponse?: string;
}

export function createLLMError(
  source: string,
  error: string,
  rawResponse?: string
): LLMResponseError {
  return {
    source,
    error,
    timestamp: new Date().toISOString(),
    rawResponse: rawResponse?.substring(0, 1000), // Truncate for logging
  };
}
