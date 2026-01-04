/**
 * Zod Schema Definitions for Tier 4 Gemini Field Extraction
 *
 * Type-safe schemas with validation rules.
 * Auto-converted to Gemini JSON schemas at runtime.
 */

import { z } from 'zod';

// ============================================================================
// HELPER: Coerce currency strings to numbers
// Handles "$450,000", "450000", "450,000.00" etc.
// ============================================================================
const currencyNumber = z.preprocess(
  (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const cleaned = val.replace(/[$,€£\s]/g, '').trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    }
    return null;
  },
  z.number().nullable()
);

// ============================================================================
// BATCH 1: PUBLIC RECORDS (County Data)
// ============================================================================

export const Batch1Schema = z.object({
  '37_tax_rate': currencyNumber.pipe(z.number().min(0.1).max(5.0).nullable())
    .describe('Property tax rate as percentage (e.g., 1.85 for 1.85%)'),

  '38_exemptions': z.string().nullable()
    .describe('Comma-separated list of active tax exemptions'),

  '60_roof_permit': z.string().regex(/^\d{4}$/).nullable()
    .describe('Year of most recent finaled roof permit (e.g., "2021")'),

  '61_hvac_permit': z.string().regex(/^\d{4}$/).nullable()
    .describe('Year of most recent finaled HVAC permit (e.g., "2021")'),

  '62_other_permit': z.string().regex(/^\d{4}$/).nullable()
    .describe('Year of most recent other major permit (pool, additions, fence, electrical, plumbing, structural)'),

  '151_homestead': z.enum(['Yes', 'No']).nullable()
    .describe('Whether homestead exemption is active'),

  '152_cdd_exists': z.enum(['Yes', 'No']).nullable()
    .describe('Whether CDD (Community Development District) fees exist'),

  '153_cdd_fee': currencyNumber.pipe(z.number().min(0).max(50000).nullable())
    .describe('Annual CDD fee amount in dollars')
});

export type Batch1Result = z.infer<typeof Batch1Schema>;

// ============================================================================
// BATCH 2: NEIGHBORHOOD DATA (Market & Scores)
// ============================================================================

export const Batch2Schema = z.object({
  '75_transit_score': currencyNumber.pipe(z.number().min(0).max(100).nullable())
    .describe('WalkScore Transit Score (0-100)'),

  '76_bike_score': currencyNumber.pipe(z.number().min(0).max(100).nullable())
    .describe('WalkScore Bike Score (0-100)'),

  '91_median_price_zip': currencyNumber.pipe(z.number().min(10000).max(10000000).nullable())
    .describe('Median home sale price for ZIP code'),

  '95_days_on_market_avg': currencyNumber.pipe(z.number().min(0).max(365).nullable())
    .describe('Average days on market for ZIP code'),

  '116_emergency_dist': z.string().nullable()
    .describe('Driving distance to nearest emergency room (e.g., "3.5 miles")'),

  '159_water_body_name': z.string().nullable()
    .describe('Name of nearest major body of water (e.g., "Tampa Bay")')
});

export type Batch2Result = z.infer<typeof Batch2Schema>;

// ============================================================================
// BATCH 3: PORTAL DATA (Listing Details)
// ============================================================================

export const Batch3Schema = z.object({
  '12_market_value': currencyNumber.pipe(z.number().min(10000).max(50000000).nullable())
    .describe('Average of Zestimate and Redfin Estimate (or single value if only one available)'),

  '16_avms': currencyNumber.pipe(z.number().min(10000).max(50000000).nullable())
    .describe('Exact Redfin Estimate value'),

  '31_hoa_fee_annual': currencyNumber.pipe(z.number().min(0).max(50000).nullable())
    .describe('Annual HOA fee in dollars'),

  '33_hoa_includes': z.string().nullable()
    .describe('Comma-separated list of what HOA covers'),

  '98_rental_estimate': currencyNumber.pipe(z.number().min(100).max(50000).nullable())
    .describe('Monthly rental estimate'),

  '131_view_type': z.string().nullable()
    .describe('Type of view (Water, Golf, Park, City, Mountain, None, etc.)')
});

export type Batch3Result = z.infer<typeof Batch3Schema>;

// ============================================================================
// ZOD TO GEMINI SCHEMA CONVERTER
// ============================================================================

/**
 * Converts Zod schema to Gemini-compatible JSON schema
 * Supports: string, number, enum, nullable, min/max, regex
 */
export function zodToGeminiSchema(zodSchema: z.ZodObject<any>): any {
  const shape = zodSchema.shape;
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    const zodType = value as any;
    let geminiType: any = { nullable: true };

    // Extract description
    if (zodType._def?.description) {
      geminiType.description = zodType._def.description;
    }

    // Handle nullable wrapper
    let innerType = zodType;
    if (zodType._def?.innerType) {
      innerType = zodType._def.innerType;
    }

    // Determine base type
    const typeName = innerType._def?.typeName;

    if (typeName === 'ZodNumber') {
      geminiType.type = 'number';

      // Extract min/max constraints
      const checks = innerType._def?.checks || [];
      for (const check of checks) {
        if (check.kind === 'min') geminiType.minimum = check.value;
        if (check.kind === 'max') geminiType.maximum = check.value;
      }

    } else if (typeName === 'ZodString') {
      geminiType.type = 'string';

      // Extract regex pattern
      const checks = innerType._def?.checks || [];
      for (const check of checks) {
        if (check.kind === 'regex') {
          geminiType.pattern = check.regex.source;
        }
      }

    } else if (typeName === 'ZodEnum') {
      geminiType.type = 'string';
      geminiType.enum = innerType._def?.values || [];

    } else {
      // Default to string for unknown types
      geminiType.type = 'string';
    }

    properties[key] = geminiType;

    // Mark as required if not optional/nullable
    if (!zodType.isOptional() && !zodType.isNullable()) {
      required.push(key);
    } else {
      // For Gemini, all our fields can be null
      required.push(key);
    }
  }

  return {
    type: 'object',
    properties,
    required
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates Gemini response against Zod schema
 * Returns parsed data or throws validation error
 */
export function validateBatch1(data: unknown): Batch1Result {
  return Batch1Schema.parse(data);
}

export function validateBatch2(data: unknown): Batch2Result {
  return Batch2Schema.parse(data);
}

export function validateBatch3(data: unknown): Batch3Result {
  return Batch3Schema.parse(data);
}

/**
 * Safe parse - returns { success: true, data } or { success: false, error }
 */
export function safeParseBatch1(data: unknown) {
  return Batch1Schema.safeParse(data);
}

export function safeParseBatch2(data: unknown) {
  return Batch2Schema.safeParse(data);
}

export function safeParseBatch3(data: unknown) {
  return Batch3Schema.safeParse(data);
}
