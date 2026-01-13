/**
 * CMA Schema Validation Layer
 * Zod schemas for all 181 fields with type constraints, bounds checking, and validation
 *
 * IMPORTANT: This validation layer works AFTER tier arbitration
 * It does NOT affect the firing order or hierarchy - just validates data quality
 *
 * Used by orchestrator to validate LLM responses before feeding into arbitration pipeline
 */

import { z } from 'zod';

// ============================================
// BASE SCHEMAS
// ============================================

/**
 * CMA Field Value Wrapper
 * Every field in the 181-field schema uses this structure
 */
export const CmaFieldValueSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.null()]),
  source_field: z.string().nullable().optional(),
  missing_reason: z.string().nullable().optional(),
});

export type CmaFieldValue = z.infer<typeof CmaFieldValueSchema>;

/**
 * Forbidden words that trigger nullification
 * If any field contains these words, it will be nulled with missing_reason
 */
export const FORBIDDEN_WORDS = [
  'likely',
  'possibly',
  'approximately',
  'about',
  'around',
  'probably',
  'maybe',
  'perhaps',
  'estimated',
  'roughly',
  'appears to be',
  'seems to be',
] as const;

// ============================================
// FIELD-SPECIFIC VALIDATORS
// ============================================

// Text fields (no constraints beyond type)
const textField = () => z.object({
  value: z.string().nullable(),
  source_field: z.string().nullable().optional(),
  missing_reason: z.string().nullable().optional(),
});

// Number fields with optional range constraints
const numberField = (min?: number, max?: number) => z.object({
  value: z.number().min(min ?? -Infinity).max(max ?? Infinity).nullable(),
  source_field: z.string().nullable().optional(),
  missing_reason: z.string().nullable().optional(),
});

// Boolean fields
const booleanField = () => z.object({
  value: z.boolean().nullable(),
  source_field: z.string().nullable().optional(),
  missing_reason: z.string().nullable().optional(),
});

// Date fields (ISO 8601 string or null)
const dateField = () => z.object({
  value: z.string().nullable(),
  source_field: z.string().nullable().optional(),
  missing_reason: z.string().nullable().optional(),
});

// Currency fields (positive numbers only)
const currencyField = (min: number = 0, max?: number) => z.object({
  value: z.number().min(min).max(max ?? Infinity).nullable(),
  source_field: z.string().nullable().optional(),
  missing_reason: z.string().nullable().optional(),
});

// Percentage fields (0-100)
const percentageField = () => z.object({
  value: z.number().min(0).max(100).nullable(),
  source_field: z.string().nullable().optional(),
  missing_reason: z.string().nullable().optional(),
});

// Enum fields (select)
const selectField = (options: [string, ...string[]]) => z.object({
  value: z.enum(options).nullable(),
  source_field: z.string().nullable().optional(),
  missing_reason: z.string().nullable().optional(),
});

// Multiselect fields (array of enum values)
const multiselectField = (options: [string, ...string[]]) => z.object({
  value: z.array(z.enum(options)).nullable(),
  source_field: z.string().nullable().optional(),
  missing_reason: z.string().nullable().optional(),
});

// ============================================
// 181-FIELD CMA SCHEMA
// ============================================

export const CmaSchema = z.object({
  // ================================================================
  // GROUP 1: Address & Identity (Fields 1-9)
  // ================================================================
  '1_full_address': textField(),
  '2_mls_primary': textField(),
  '3_new_construction_yn': z.boolean().optional(),
  '4_listing_status': selectField(['Active', 'Pending', 'Sold', 'Off-Market']),
  '5_listing_date': dateField(),
  '6_neighborhood': textField(),
  '7_county': textField(),
  '8_zip_code': textField(),
  '9_parcel_id': textField(),

  // ================================================================
  // GROUP 2: Pricing & Value (Fields 10-16)
  // ================================================================
  '10_listing_price': currencyField(0),
  '11_price_per_sqft': currencyField(0),
  '12_market_value_estimate': currencyField(0),
  '13_last_sale_date': dateField(),
  '14_last_sale_price': currencyField(0),
  '15_assessed_value': currencyField(0),
  '16_avms': currencyField(0),

  // ================================================================
  // GROUP 3: Property Basics (Fields 17-29)
  // ================================================================
  '17_bedrooms': numberField(0, 20),
  '18_full_bathrooms': numberField(0, 20),
  '19_half_bathrooms': numberField(0, 10),
  '20_total_bathrooms': numberField(0, 30),
  '21_living_sqft': numberField(0, 50000),
  '22_total_sqft_under_roof': numberField(0, 100000),
  '23_lot_size_sqft': numberField(0, 10000000),
  '24_lot_size_acres': numberField(0, 1000),
  '25_year_built': numberField(1700, new Date().getFullYear() + 2),
  '26_property_type': selectField(['Single Family', 'Condo', 'Townhouse', 'Multi-Family', 'Land', 'Commercial']),
  '27_stories': numberField(0, 100),
  '28_garage_spaces': numberField(0, 20),
  '29_parking_total': textField(),

  // ================================================================
  // GROUP 4: HOA & Taxes (Fields 30-38)
  // ================================================================
  '30_hoa_yn': booleanField(),
  '31_hoa_fee_annual': currencyField(0, 100000),
  '32_hoa_name': textField(),
  '33_hoa_includes': textField(),
  '34_ownership_type': selectField(['Fee Simple', 'Leasehold', 'Condo', 'Co-op']),
  '35_annual_taxes': currencyField(0, 1000000),
  '36_tax_year': numberField(1900, new Date().getFullYear() + 1),
  '37_property_tax_rate': percentageField(),
  '38_tax_exemptions': textField(),

  // ================================================================
  // GROUP 5: Structure & Systems (Fields 39-48)
  // ================================================================
  '39_roof_type': selectField(['Shingle', 'Tile', 'Metal', 'Flat', 'Other']),
  '40_roof_age_est': textField(),
  '41_exterior_material': selectField(['Block/Stucco', 'Brick', 'Wood', 'Vinyl Siding', 'Fiber Cement', 'Other']),
  '42_foundation': selectField(['Slab', 'Crawl Space', 'Basement', 'Pier/Beam']),
  '43_water_heater_type': textField(),
  '44_garage_type': textField(),
  '45_hvac_type': textField(),
  '46_hvac_age': textField(),
  '47_laundry_type': textField(),
  '48_interior_condition': selectField(['Excellent', 'Good', 'Fair', 'Needs Work', 'Renovated']),

  // ================================================================
  // GROUP 6: Interior Features (Fields 49-53)
  // ================================================================
  '49_flooring_type': textField(),
  '50_kitchen_features': textField(),
  '51_appliances_included': multiselectField(['Refrigerator', 'Dishwasher', 'Range/Oven', 'Microwave', 'Washer', 'Dryer', 'Disposal']),
  '52_fireplace_yn': booleanField(),
  // FIXED 2026-01-08: Field 53 is Primary BR Location (select), NOT fireplace count (number)
  '53_primary_br_location': selectField(['Main Floor', 'Upper Floor', 'Lower Floor', 'Split', 'Main', 'Upper', 'Lower']),

  // ================================================================
  // GROUP 7: Exterior Features (Fields 54-58)
  // ================================================================
  '54_pool_yn': booleanField(),
  '55_pool_type': multiselectField(['N/A', 'In-ground', 'Above-ground', 'In-ground Heated', 'Community']),
  '56_deck_patio': textField(),
  '57_fence': textField(),
  '58_landscaping': textField(),

  // ================================================================
  // GROUP 8: Permits & Renovations (Fields 59-62)
  // ================================================================
  '59_recent_renovations': textField(),
  '60_permit_history_roof': textField(),
  '61_permit_history_hvac': textField(),
  '62_permit_history_other': textField(),

  // ================================================================
  // GROUP 9: Assigned Schools (Fields 63-73)
  // ================================================================
  '63_school_district': textField(),
  '64_elevation_feet': numberField(-500, 30000),
  '65_elementary_school': textField(),
  '66_elementary_rating': textField(), // Can be "7/10" or "7" or "B+"
  '67_elementary_distance_mi': numberField(0, 100),
  '68_middle_school': textField(),
  '69_middle_rating': textField(),
  '70_middle_distance_mi': numberField(0, 100),
  '71_high_school': textField(),
  '72_high_rating': textField(),
  '73_high_distance_mi': numberField(0, 100),

  // ================================================================
  // GROUP 10: Location Scores (Fields 74-82)
  // ================================================================
  '74_walk_score': numberField(0, 100),
  '75_transit_score': numberField(0, 100),
  '76_bike_score': numberField(0, 100),
  '77_safety_score': numberField(0, 100),
  '78_noise_level': textField(),
  '79_traffic_level': textField(),
  '80_walkability_description': textField(),
  '81_public_transit_access': textField(),
  '82_commute_to_city_center': textField(),

  // ================================================================
  // GROUP 11: Distances & Amenities (Fields 83-87)
  // ================================================================
  '83_distance_grocery_mi': numberField(0, 500),
  '84_distance_hospital_mi': numberField(0, 500),
  '85_distance_airport_mi': numberField(0, 500),
  '86_distance_park_mi': numberField(0, 100),
  '87_distance_beach_mi': numberField(0, 500),

  // ================================================================
  // GROUP 12: Safety & Crime (Fields 88-90)
  // ================================================================
  '88_violent_crime_index': textField(), // Can be numeric or text like "Low" or "15 (below average)"
  '89_property_crime_index': textField(),
  '90_neighborhood_safety_rating': textField(),

  // ================================================================
  // GROUP 13: Market & Investment Data (Fields 91-103)
  // ================================================================
  '91_median_home_price_neighborhood': currencyField(0),
  '92_price_per_sqft_recent_avg': currencyField(0),
  '93_price_to_rent_ratio': numberField(0, 100),
  '94_price_vs_median_percent': percentageField(),
  '95_days_on_market_avg': numberField(0, 3650),
  '96_inventory_surplus': textField(),
  '97_insurance_est_annual': currencyField(0, 100000),
  '98_rental_estimate_monthly': currencyField(0, 100000),
  '99_rental_yield_est': percentageField(),
  '100_vacancy_rate_neighborhood': percentageField(),
  '101_cap_rate_est': percentageField(),
  '102_financing_terms': textField(),
  '103_comparable_sales': textField(),

  // ================================================================
  // GROUP 14: Utilities & Connectivity (Fields 104-116)
  // ================================================================
  '104_electric_provider': textField(),
  '105_avg_electric_bill': textField(),
  '106_water_provider': textField(),
  '107_avg_water_bill': textField(),
  '108_sewer_provider': textField(),
  '109_natural_gas': booleanField(),
  '110_trash_provider': textField(),
  '111_internet_providers_top3': textField(),
  '112_max_internet_speed': textField(),
  '113_fiber_available': textField(),
  '114_cable_tv_provider': textField(),
  '115_cell_coverage_quality': textField(),
  '116_emergency_services_distance': textField(),

  // ================================================================
  // GROUP 15: Environment & Risk (Fields 117-130)
  // ================================================================
  '117_air_quality_index': textField(), // Can be "42" or "42 (Good)"
  '118_air_quality_grade': textField(),
  '119_flood_zone': textField(),
  '120_flood_risk_level': textField(),
  '121_climate_risk': textField(),
  '122_wildfire_risk': textField(),
  '123_earthquake_risk': textField(),
  '124_hurricane_risk': textField(),
  '125_tornado_risk': textField(),
  '126_radon_risk': textField(),
  '127_superfund_site_nearby': textField(),
  '128_sea_level_rise_risk': textField(),
  '129_noise_level_db_est': textField(),
  '130_solar_potential': textField(),

  // ================================================================
  // GROUP 16: Additional Features (Fields 131-138)
  // ================================================================
  '131_view_type': textField(),
  '132_lot_features': textField(),
  '133_ev_charging': booleanField(),
  '134_smart_home_features': textField(),
  '135_accessibility_modifications': textField(),
  '136_pet_policy': textField(),
  '137_age_restrictions': textField(),
  '138_special_assessments': textField(),

  // ================================================================
  // GROUP 17: Stellar MLS - Parking & Garage (Fields 139-143)
  // ================================================================
  '139_carport_yn': booleanField(),
  '140_carport_spaces': numberField(0, 10),
  '141_garage_attached_yn': booleanField(),
  '142_parking_features': multiselectField(['Assigned Parking', 'Covered Parking', 'Ground Level', 'Guest Parking', 'Garage Door Opener', 'Circular Driveway', 'Driveway', 'On Street', 'Off Street']),
  '143_assigned_parking_spaces': numberField(0, 20),

  // ================================================================
  // GROUP 18: Stellar MLS - Building Info (Fields 144-148)
  // ================================================================
  '144_floor_number': numberField(0, 200),
  '145_building_total_floors': numberField(0, 200),
  '146_building_name_number': textField(),
  '147_building_elevator_yn': booleanField(),
  '148_floors_in_unit': numberField(0, 10),

  // ================================================================
  // GROUP 19: Stellar MLS - Legal & Tax (Fields 149-154)
  // ================================================================
  '149_subdivision_name': textField(),
  '150_legal_description': textField(),
  '151_homestead_yn': booleanField(),
  '152_cdd_yn': booleanField(),
  '153_annual_cdd_fee': currencyField(0, 100000),
  '154_front_exposure': selectField(['North', 'South', 'East', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest']),

  // ================================================================
  // GROUP 20: Stellar MLS - Waterfront (Fields 155-159)
  // ================================================================
  '155_water_frontage_yn': booleanField(),
  '156_waterfront_feet': numberField(0, 10000),
  '157_water_access_yn': booleanField(),
  '158_water_view_yn': booleanField(),
  '159_water_body_name': textField(),

  // ================================================================
  // GROUP 21: Stellar MLS - Leasing & Pets (Fields 160-165)
  // ================================================================
  '160_can_be_leased_yn': booleanField(),
  '161_minimum_lease_period': textField(),
  '162_lease_restrictions_yn': booleanField(),
  '163_pet_size_limit': textField(),
  '164_max_pet_weight': numberField(0, 500),
  '165_association_approval_yn': booleanField(),

  // ================================================================
  // GROUP 22: Stellar MLS - Features & Flood (Fields 166-168)
  // ================================================================
  '166_community_features': multiselectField(['Pool', 'Clubhouse', 'Tennis Courts', 'Golf', 'Fitness Center', 'Gated', 'Sidewalks', 'Playground', 'Dog Park', 'Marina', 'Beach Access']),
  '167_interior_features': multiselectField(['Cathedral Ceiling(s)', 'Walk-In Closet(s)', 'Primary Bedroom Main Floor', 'Open Floor Plan', 'Crown Molding', 'Skylight(s)', 'Wet Bar', 'Built-in Features']),
  '168_exterior_features': multiselectField(['Balcony', 'Outdoor Shower', 'Sidewalk', 'Sliding Doors', 'Hurricane Shutters', 'Sprinkler System', 'Outdoor Kitchen', 'Private Dock']),
});

export type CmaSchemaType = z.infer<typeof CmaSchema>;

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Check if a string contains forbidden words
 * Case-insensitive check for "likely", "possibly", "approximately", etc.
 */
export function containsForbiddenWords(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;

  const lowerValue = value.toLowerCase();
  return FORBIDDEN_WORDS.some(word => {
    // Match whole words only (not substrings)
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerValue);
  });
}

/**
 * Validate source_url format
 * Must be a valid HTTP/HTTPS URL
 */
export function isValidSourceUrl(url: string | null | undefined): boolean {
  if (!url) return true; // null/undefined is acceptable

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate and sanitize a single CMA field
 * Applies all validation rules:
 * 1. Check for forbidden words in value
 * 2. Validate source_url format (if present)
 * 3. Nullify field if validation fails
 *
 * @param fieldKey - Field key like "74_walk_score"
 * @param fieldValue - Raw field value from LLM
 * @returns Sanitized field value with validation applied
 */
export function validateField(
  fieldKey: string,
  fieldValue: CmaFieldValue
): CmaFieldValue {
  const result = { ...fieldValue };

  // Check for forbidden words
  if (result.value !== null && typeof result.value === 'string') {
    if (containsForbiddenWords(result.value)) {
      console.warn(`[Validation] Field ${fieldKey} contains forbidden words, nullifying`);
      result.value = null;
      result.missing_reason = 'Contains forbidden estimation language';
      return result;
    }
  }

  // Validate source_url if present
  const sourceUrl = (fieldValue as any).source_url;
  if (sourceUrl && !isValidSourceUrl(sourceUrl)) {
    console.warn(`[Validation] Field ${fieldKey} has invalid source_url: ${sourceUrl}`);
    // Don't nullify the field, just remove the bad URL
    delete (result as any).source_url;
  }

  return result;
}

/**
 * Validate entire CMA schema
 * Applies Zod validation + custom validation rules
 *
 * @param rawSchema - Raw schema object from LLM
 * @returns Validated and sanitized CMA schema
 */
export function validateCmaSchema(rawSchema: unknown): CmaSchemaType {
  console.log('[Validation] Starting CMA schema validation...');

  // Step 1: Zod structural validation
  let validatedSchema: CmaSchemaType;
  try {
    validatedSchema = CmaSchema.parse(rawSchema);
    console.log('[Validation] Zod structural validation passed');
  } catch (error) {
    console.error('[Validation] Zod validation failed:', error);
    throw new Error(`CMA schema validation failed: ${error}`);
  }

  // Step 2: Apply custom validation to each field
  const sanitizedSchema = { ...validatedSchema };
  let forbiddenWordCount = 0;
  let invalidUrlCount = 0;

  for (const [fieldKey, fieldValue] of Object.entries(validatedSchema)) {
    const validated = validateField(fieldKey, fieldValue as CmaFieldValue);

    if (validated.missing_reason?.includes('forbidden')) {
      forbiddenWordCount++;
    }

    sanitizedSchema[fieldKey as keyof CmaSchemaType] = validated as any;
  }

  console.log('[Validation] Custom validation complete:');
  console.log(`  - Fields nullified due to forbidden words: ${forbiddenWordCount}`);
  console.log(`  - Invalid URLs removed: ${invalidUrlCount}`);

  return sanitizedSchema;
}

/**
 * Get missing fields report
 * Lists all fields that are null with their missing_reason
 */
export function getMissingFieldsReport(schema: CmaSchemaType): {
  fieldKey: string;
  reason: string | null;
}[] {
  const missing: { fieldKey: string; reason: string | null }[] = [];

  for (const [fieldKey, fieldValue] of Object.entries(schema)) {
    const field = fieldValue as CmaFieldValue;
    if (field.value === null) {
      missing.push({
        fieldKey,
        reason: field.missing_reason || 'No reason provided',
      });
    }
  }

  return missing;
}

/**
 * Get schema completion percentage
 * Percentage of non-null fields out of 181 total
 */
export function getSchemaCompletion(schema: CmaSchemaType): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = 181;
  let completed = 0;

  for (const fieldValue of Object.values(schema)) {
    const field = fieldValue as CmaFieldValue;
    if (field.value !== null) {
      completed++;
    }
  }

  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
  };
}
