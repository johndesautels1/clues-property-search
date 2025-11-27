/**
 * CLUES Property Dashboard - ONE SOURCE OF TRUTH SCHEMA
 * Created: 2025-11-27
 * 
 * THIS IS THE ONLY FILE WHERE FIELDS ARE DEFINED.
 * All other files MUST import from here.
 * 
 * DO NOT define fields anywhere else.
 * DO NOT duplicate this data.
 * DO NOT hardcode field numbers in other files.
 */

export type ConfidenceLevel = 'High' | 'Medium-High' | 'Medium' | 'Low' | 'Unverified';
export type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | 'currency' | 'percentage';

export interface FieldDefinition {
  num: number;
  key: string;
  label: string;
  group: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  autoPopulateSources?: string[];
  calculated?: boolean;
}

/**
 * THE MASTER FIELD LIST - 110 FIELDS
 * Every field has: num, key, label, group, type, required
 * All other files derive their data from this array.
 */
export const ALL_FIELDS: readonly FieldDefinition[] = [
  // ================================================================
  // GROUP A: Address & Identity (Fields 1-6)
  // ================================================================
  { num: 1,  key: 'full_address',       label: 'Full Address',        group: 'Address & Identity', type: 'text',    required: true,  placeholder: '123 Main St, City, FL 33701' },
  { num: 2,  key: 'mls_primary',        label: 'MLS # (Primary)',     group: 'Address & Identity', type: 'text',    required: false, autoPopulateSources: ['Stellar MLS'] },
  { num: 3,  key: 'mls_secondary',      label: 'MLS # (Secondary)',   group: 'Address & Identity', type: 'text',    required: false },
  { num: 4,  key: 'listing_status',     label: 'Listing Status',      group: 'Address & Identity', type: 'select',  required: false, options: ['Active', 'Pending', 'Sold', 'Off-Market'] },
  { num: 5,  key: 'listing_date',       label: 'Listing Date',        group: 'Address & Identity', type: 'date',    required: false },
  { num: 6,  key: 'parcel_id',          label: 'Parcel ID',           group: 'Address & Identity', type: 'text',    required: false, autoPopulateSources: ['County Assessor'] },

  // ================================================================
  // GROUP B: Pricing (Fields 7-11)
  // ================================================================
  { num: 7,  key: 'listing_price',         label: 'Listing Price',          group: 'Pricing', type: 'currency', required: false, autoPopulateSources: ['Stellar MLS'] },
  { num: 8,  key: 'price_per_sqft',        label: 'Price per Sq Ft',        group: 'Pricing', type: 'currency', required: false, calculated: true },
  { num: 9,  key: 'market_value_estimate', label: 'Market Value Estimate',  group: 'Pricing', type: 'currency', required: false, autoPopulateSources: ['County Assessor', 'Perplexity'] },
  { num: 10, key: 'last_sale_date',        label: 'Last Sale Date',         group: 'Pricing', type: 'date',     required: false, autoPopulateSources: ['County Clerk'] },
  { num: 11, key: 'last_sale_price',       label: 'Last Sale Price',        group: 'Pricing', type: 'currency', required: false, autoPopulateSources: ['County Clerk'] },

  // ================================================================
  // GROUP C: Property Basics (Fields 12-24)
  // ================================================================
  { num: 12, key: 'bedrooms',              label: 'Bedrooms',               group: 'Property Basics', type: 'number',  required: true,  autoPopulateSources: ['Stellar MLS', 'County Assessor'] },
  { num: 13, key: 'full_bathrooms',        label: 'Full Bathrooms',         group: 'Property Basics', type: 'number',  required: true,  autoPopulateSources: ['Stellar MLS', 'County Assessor'] },
  { num: 14, key: 'half_bathrooms',        label: 'Half Bathrooms',         group: 'Property Basics', type: 'number',  required: true,  autoPopulateSources: ['Stellar MLS', 'County Assessor'] },
  { num: 15, key: 'total_bathrooms',       label: 'Total Bathrooms',        group: 'Property Basics', type: 'number',  required: false, calculated: true, helpText: 'Calculated: full + (half × 0.5)' },
  { num: 16, key: 'living_sqft',           label: 'Living Sq Ft',           group: 'Property Basics', type: 'number',  required: true,  autoPopulateSources: ['Stellar MLS', 'County Assessor'] },
  { num: 17, key: 'total_sqft_under_roof', label: 'Total Sq Ft Under Roof', group: 'Property Basics', type: 'number',  required: false },
  { num: 18, key: 'lot_size_sqft',         label: 'Lot Size (Sq Ft)',       group: 'Property Basics', type: 'number',  required: false, autoPopulateSources: ['County Assessor'] },
  { num: 19, key: 'lot_size_acres',        label: 'Lot Size (Acres)',       group: 'Property Basics', type: 'number',  required: false, calculated: true },
  { num: 20, key: 'year_built',            label: 'Year Built',             group: 'Property Basics', type: 'number',  required: true,  autoPopulateSources: ['County Assessor', 'Stellar MLS'] },
  { num: 21, key: 'property_type',         label: 'Property Type',          group: 'Property Basics', type: 'select',  required: true,  options: ['Single Family', 'Condo', 'Townhouse', 'Multi-Family', 'Land', 'Commercial'] },
  { num: 22, key: 'stories',               label: 'Stories',                group: 'Property Basics', type: 'number',  required: false, autoPopulateSources: ['Stellar MLS'] },
  { num: 23, key: 'garage_spaces',         label: 'Garage Spaces',          group: 'Property Basics', type: 'number',  required: false },
  { num: 24, key: 'parking_total',         label: 'Parking Description',    group: 'Property Basics', type: 'text',    required: false, placeholder: '2 car garage + driveway' },

  // ================================================================
  // GROUP D: HOA & Ownership (Fields 25-28)
  // ================================================================
  { num: 25, key: 'hoa_yn',           label: 'HOA?',            group: 'HOA & Ownership', type: 'boolean',  required: true },
  { num: 26, key: 'hoa_fee_annual',   label: 'HOA Fee (Annual)', group: 'HOA & Ownership', type: 'currency', required: false },
  { num: 27, key: 'ownership_type',   label: 'Ownership Type',  group: 'HOA & Ownership', type: 'select',   required: false, options: ['Fee Simple', 'Leasehold', 'Condo', 'Co-op'] },
  { num: 28, key: 'county',           label: 'County',          group: 'HOA & Ownership', type: 'text',     required: false, autoPopulateSources: ['County Assessor', 'Google Maps'] },

  // ================================================================
  // GROUP E: Taxes & Assessments (Fields 29-35)
  // ================================================================
  { num: 29, key: 'annual_taxes',        label: 'Annual Property Taxes', group: 'Taxes & Assessments', type: 'currency',   required: false, autoPopulateSources: ['County Tax Collector'] },
  { num: 30, key: 'tax_year',            label: 'Tax Year',              group: 'Taxes & Assessments', type: 'number',     required: false },
  { num: 31, key: 'assessed_value',      label: 'Assessed Value',        group: 'Taxes & Assessments', type: 'currency',   required: false, autoPopulateSources: ['County Assessor'] },
  { num: 32, key: 'tax_exemptions',      label: 'Tax Exemptions',        group: 'Taxes & Assessments', type: 'text',       required: false, placeholder: 'Homestead exemption' },
  { num: 33, key: 'property_tax_rate',   label: 'Property Tax Rate',     group: 'Taxes & Assessments', type: 'percentage', required: false },
  { num: 34, key: 'recent_tax_history',  label: 'Recent Tax History',    group: 'Taxes & Assessments', type: 'text',       required: false },
  { num: 35, key: 'special_assessments', label: 'Special Assessments',   group: 'Taxes & Assessments', type: 'text',       required: false, placeholder: 'None' },

  // ================================================================
  // GROUP F: Structure & Systems (Fields 36-41)
  // ================================================================
  { num: 36, key: 'roof_type',          label: 'Roof Type',          group: 'Structure & Systems', type: 'select', required: false, options: ['Shingle', 'Tile', 'Metal', 'Flat', 'Other'] },
  { num: 37, key: 'roof_age_est',       label: 'Roof Age (Est.)',    group: 'Structure & Systems', type: 'text',   required: false, placeholder: '~10 years (2014 permit)', autoPopulateSources: ['County Permits'] },
  { num: 38, key: 'exterior_material',  label: 'Exterior Material',  group: 'Structure & Systems', type: 'select', required: false, options: ['Block/Stucco', 'Brick', 'Wood', 'Vinyl Siding', 'Fiber Cement', 'Other'] },
  { num: 39, key: 'foundation',         label: 'Foundation',         group: 'Structure & Systems', type: 'select', required: false, options: ['Slab', 'Crawl Space', 'Basement', 'Pier/Beam'] },
  { num: 40, key: 'hvac_type',          label: 'HVAC Type',          group: 'Structure & Systems', type: 'text',   required: false, placeholder: 'Central Air/Heat' },
  { num: 41, key: 'hvac_age',           label: 'HVAC Age (Est.)',    group: 'Structure & Systems', type: 'text',   required: false, autoPopulateSources: ['County Permits'] },

  // ================================================================
  // GROUP G: Interior Features (Fields 42-46)
  // ================================================================
  { num: 42, key: 'flooring_type',        label: 'Flooring Type',        group: 'Interior Features', type: 'text',        required: false, placeholder: 'Tile, Laminate, Carpet' },
  { num: 43, key: 'kitchen_features',     label: 'Kitchen Features',     group: 'Interior Features', type: 'text',        required: false, placeholder: 'Granite counters, SS appliances' },
  { num: 44, key: 'appliances_included',  label: 'Appliances Included',  group: 'Interior Features', type: 'multiselect', required: false, options: ['Refrigerator', 'Dishwasher', 'Range/Oven', 'Microwave', 'Washer', 'Dryer', 'Disposal'] },
  { num: 45, key: 'fireplace_yn',         label: 'Fireplace?',           group: 'Interior Features', type: 'boolean',     required: false },
  { num: 46, key: 'interior_condition',   label: 'Interior Condition',   group: 'Interior Features', type: 'select',      required: false, options: ['Excellent', 'Good', 'Fair', 'Needs Work', 'Renovated'] },

  // ================================================================
  // GROUP H: Exterior Features (Fields 47-51)
  // ================================================================
  { num: 47, key: 'pool_yn',       label: 'Pool?',       group: 'Exterior Features', type: 'boolean', required: false },
  { num: 48, key: 'pool_type',     label: 'Pool Type',   group: 'Exterior Features', type: 'select',  required: false, options: ['N/A', 'In-ground', 'Above-ground', 'In-ground Heated', 'Community'] },
  { num: 49, key: 'deck_patio',    label: 'Deck/Patio',  group: 'Exterior Features', type: 'text',    required: false, placeholder: 'Screened lanai, covered patio' },
  { num: 50, key: 'fence',         label: 'Fence',       group: 'Exterior Features', type: 'text',    required: false, placeholder: 'Privacy fence, chain link' },
  { num: 51, key: 'landscaping',   label: 'Landscaping', group: 'Exterior Features', type: 'text',    required: false },

  // ================================================================
  // GROUP I: Permits & Renovations (Fields 52-55)
  // ================================================================
  { num: 52, key: 'recent_renovations',    label: 'Recent Renovations',      group: 'Permits & Renovations', type: 'text', required: false },
  { num: 53, key: 'permit_history_roof',   label: 'Permit History - Roof',   group: 'Permits & Renovations', type: 'text', required: false, autoPopulateSources: ['County Permits'] },
  { num: 54, key: 'permit_history_hvac',   label: 'Permit History - HVAC',   group: 'Permits & Renovations', type: 'text', required: false, autoPopulateSources: ['County Permits'] },
  { num: 55, key: 'permit_history_other',  label: 'Permit History - Other',  group: 'Permits & Renovations', type: 'text', required: false, autoPopulateSources: ['County Permits'] },

  // ================================================================
  // GROUP J: Schools (Fields 56-64)
  // ================================================================
  { num: 56, key: 'assigned_elementary',      label: 'Assigned Elementary',      group: 'Schools', type: 'text',   required: false, autoPopulateSources: ['SchoolDigger', 'GreatSchools'] },
  { num: 57, key: 'elementary_rating',        label: 'Elementary Rating',        group: 'Schools', type: 'text',   required: false, placeholder: '8/10', autoPopulateSources: ['GreatSchools', 'Niche'] },
  { num: 58, key: 'elementary_distance_mi',   label: 'Elementary Distance (mi)', group: 'Schools', type: 'number', required: false, autoPopulateSources: ['Google Maps'] },
  { num: 59, key: 'assigned_middle',          label: 'Assigned Middle',          group: 'Schools', type: 'text',   required: false },
  { num: 60, key: 'middle_rating',            label: 'Middle Rating',            group: 'Schools', type: 'text',   required: false },
  { num: 61, key: 'middle_distance_mi',       label: 'Middle Distance (mi)',     group: 'Schools', type: 'number', required: false },
  { num: 62, key: 'assigned_high',            label: 'Assigned High',            group: 'Schools', type: 'text',   required: false },
  { num: 63, key: 'high_rating',              label: 'High Rating',              group: 'Schools', type: 'text',   required: false },
  { num: 64, key: 'high_distance_mi',         label: 'High Distance (mi)',       group: 'Schools', type: 'number', required: false },

  // ================================================================
  // GROUP K: Location Scores (Fields 65-72)
  // ================================================================
  { num: 65, key: 'walk_score',              label: 'Walk Score',              group: 'Location Scores', type: 'text', required: false, autoPopulateSources: ['WalkScore'] },
  { num: 66, key: 'transit_score',           label: 'Transit Score',           group: 'Location Scores', type: 'text', required: false, autoPopulateSources: ['WalkScore'] },
  { num: 67, key: 'bike_score',              label: 'Bike Score',              group: 'Location Scores', type: 'text', required: false, autoPopulateSources: ['WalkScore'] },
  { num: 68, key: 'noise_level',             label: 'Noise Level',             group: 'Location Scores', type: 'text', required: false, autoPopulateSources: ['HowLoud'] },
  { num: 69, key: 'traffic_level',           label: 'Traffic Level',           group: 'Location Scores', type: 'text', required: false },
  { num: 70, key: 'walkability_description', label: 'Walkability Description', group: 'Location Scores', type: 'text', required: false },
  { num: 71, key: 'commute_time_city',       label: 'Commute Time (City)',     group: 'Location Scores', type: 'text', required: false },
  { num: 72, key: 'public_transit_access',   label: 'Public Transit Access',   group: 'Location Scores', type: 'text', required: false },

  // ================================================================
  // GROUP L: Distances & Amenities (Fields 73-77)
  // ================================================================
  { num: 73, key: 'distance_grocery_mi',   label: 'Distance to Grocery (mi)',  group: 'Distances & Amenities', type: 'number', required: false, autoPopulateSources: ['Google Maps'] },
  { num: 74, key: 'distance_hospital_mi',  label: 'Distance to Hospital (mi)', group: 'Distances & Amenities', type: 'number', required: false, autoPopulateSources: ['Google Maps'] },
  { num: 75, key: 'distance_airport_mi',   label: 'Distance to Airport (mi)',  group: 'Distances & Amenities', type: 'number', required: false, autoPopulateSources: ['Google Maps'] },
  { num: 76, key: 'distance_park_mi',      label: 'Distance to Park (mi)',     group: 'Distances & Amenities', type: 'number', required: false, autoPopulateSources: ['Google Maps'] },
  { num: 77, key: 'distance_beach_mi',     label: 'Distance to Beach (mi)',    group: 'Distances & Amenities', type: 'number', required: false, autoPopulateSources: ['Google Maps'] },

  // ================================================================
  // GROUP M: Safety & Crime (Fields 78-80)
  // ================================================================
  { num: 78, key: 'crime_index_violent',         label: 'Crime Index (Violent)',        group: 'Safety & Crime', type: 'text', required: false, autoPopulateSources: ['FBI Crime', 'NeighborhoodScout'] },
  { num: 79, key: 'crime_index_property',        label: 'Crime Index (Property)',       group: 'Safety & Crime', type: 'text', required: false, autoPopulateSources: ['FBI Crime', 'NeighborhoodScout'] },
  { num: 80, key: 'neighborhood_safety_rating',  label: 'Neighborhood Safety Rating',   group: 'Safety & Crime', type: 'text', required: false },

  // ================================================================
  // GROUP N: Market & Investment (Fields 81-91)
  // ================================================================
  { num: 81, key: 'median_home_price_area',    label: 'Median Home Price (Area)',    group: 'Market & Investment', type: 'currency',   required: false },
  { num: 82, key: 'price_per_sqft_avg',        label: 'Price/SqFt Avg (Area)',       group: 'Market & Investment', type: 'currency',   required: false },
  { num: 83, key: 'days_on_market_avg',        label: 'Days on Market Avg',          group: 'Market & Investment', type: 'number',     required: false },
  { num: 84, key: 'inventory_surplus',         label: 'Inventory Surplus/Deficit',   group: 'Market & Investment', type: 'text',       required: false },
  { num: 85, key: 'rental_estimate_monthly',   label: 'Rental Estimate (Monthly)',   group: 'Market & Investment', type: 'currency',   required: false, autoPopulateSources: ['RentCafe', 'Zumper', 'Perplexity'] },
  { num: 86, key: 'rental_yield_est',          label: 'Rental Yield Est (%)',        group: 'Market & Investment', type: 'percentage', required: false, calculated: true },
  { num: 87, key: 'vacancy_rate_area',         label: 'Vacancy Rate (Area %)',       group: 'Market & Investment', type: 'percentage', required: false },
  { num: 88, key: 'cap_rate_est',              label: 'Cap Rate Est (%)',            group: 'Market & Investment', type: 'percentage', required: false, calculated: true },
  { num: 89, key: 'insurance_est_annual',      label: 'Insurance Est (Annual)',      group: 'Market & Investment', type: 'currency',   required: false },
  { num: 90, key: 'financing_terms',           label: 'Financing Terms',             group: 'Market & Investment', type: 'text',       required: false },
  { num: 91, key: 'comparable_sales',          label: 'Comparable Sales',            group: 'Market & Investment', type: 'text',       required: false },

  // ================================================================
  // GROUP O: Utilities (Fields 92-98)
  // ================================================================
  { num: 92, key: 'electric_provider',     label: 'Electric Provider',    group: 'Utilities', type: 'text', required: false },
  { num: 93, key: 'water_provider',        label: 'Water Provider',       group: 'Utilities', type: 'text', required: false },
  { num: 94, key: 'sewer_provider',        label: 'Sewer Provider',       group: 'Utilities', type: 'text', required: false },
  { num: 95, key: 'natural_gas',           label: 'Natural Gas',          group: 'Utilities', type: 'text', required: false },
  { num: 96, key: 'internet_providers',    label: 'Internet Providers',   group: 'Utilities', type: 'text', required: false },
  { num: 97, key: 'max_internet_speed',    label: 'Max Internet Speed',   group: 'Utilities', type: 'text', required: false },
  { num: 98, key: 'cable_tv_provider',     label: 'Cable TV Provider',    group: 'Utilities', type: 'text', required: false },

  // ================================================================
  // GROUP P: Environment & Risk (Fields 99-104)
  // ================================================================
  { num: 99,  key: 'air_quality_index',    label: 'Air Quality Index',    group: 'Environment & Risk', type: 'text', required: false, autoPopulateSources: ['AirNow', 'IQAir'] },
  { num: 100, key: 'flood_zone',           label: 'Flood Zone',           group: 'Environment & Risk', type: 'text', required: false, autoPopulateSources: ['FEMA'] },
  { num: 101, key: 'flood_risk_level',     label: 'Flood Risk Level',     group: 'Environment & Risk', type: 'text', required: false, autoPopulateSources: ['FEMA', 'First Street'] },
  { num: 102, key: 'climate_risk_summary', label: 'Climate Risk Summary', group: 'Environment & Risk', type: 'text', required: false },
  { num: 103, key: 'noise_level_db_est',   label: 'Noise Level (dB Est)', group: 'Environment & Risk', type: 'text', required: false, autoPopulateSources: ['HowLoud'] },
  { num: 104, key: 'solar_potential',      label: 'Solar Potential',      group: 'Environment & Risk', type: 'text', required: false, autoPopulateSources: ['Google Sunroof'] },

  // ================================================================
  // GROUP Q: Additional Features (Fields 105-110)
  // ================================================================
  { num: 105, key: 'ev_charging_yn',             label: 'EV Charging?',             group: 'Additional Features', type: 'text', required: false },
  { num: 106, key: 'smart_home_features',        label: 'Smart Home Features',      group: 'Additional Features', type: 'text', required: false },
  { num: 107, key: 'accessibility_mods',         label: 'Accessibility Mods',       group: 'Additional Features', type: 'text', required: false },
  { num: 108, key: 'pet_policy',                 label: 'Pet Policy',               group: 'Additional Features', type: 'text', required: false },
  { num: 109, key: 'age_restrictions',           label: 'Age Restrictions',         group: 'Additional Features', type: 'text', required: false },
  { num: 110, key: 'notes_confidence_summary',   label: 'Notes/Confidence Summary', group: 'Additional Features', type: 'text', required: false },
] as const;

// ================================================================
// DERIVED DATA - AUTO-GENERATED FROM ALL_FIELDS
// ================================================================

/**
 * Map of field key (with number prefix) to field definition
 * Example: "7_listing_price" -> { num: 7, key: 'listing_price', ... }
 */
export const FIELD_MAP = new Map<string, FieldDefinition>(
  ALL_FIELDS.map(f => [`${f.num}_${f.key}`, f])
);

/**
 * Map of field number to field definition
 * Example: 7 -> { num: 7, key: 'listing_price', ... }
 */
export const FIELD_BY_NUMBER = new Map<number, FieldDefinition>(
  ALL_FIELDS.map(f => [f.num, f])
);

/**
 * Map of field key (without number) to field definition
 * Example: "listing_price" -> { num: 7, key: 'listing_price', ... }
 */
export const FIELD_BY_KEY = new Map<string, FieldDefinition>(
  ALL_FIELDS.map(f => [f.key, f])
);

/**
 * Comma-separated list of all field keys with number prefixes
 * Used in API prompts
 */
export const EXACT_FIELD_KEYS = ALL_FIELDS.map(f => `${f.num}_${f.key}`).join(', ');

/**
 * Array of all field keys with number prefixes
 */
export const FIELD_KEYS_ARRAY = ALL_FIELDS.map(f => `${f.num}_${f.key}`);

/**
 * Get all unique groups
 */
export const FIELD_GROUPS = [...new Set(ALL_FIELDS.map(f => f.group))];

/**
 * Get fields by group
 */
export function getFieldsByGroup(group: string): readonly FieldDefinition[] {
  return ALL_FIELDS.filter(f => f.group === group);
}

/**
 * Get field by number
 */
export function getFieldByNumber(num: number): FieldDefinition | undefined {
  return FIELD_BY_NUMBER.get(num);
}

/**
 * Get field by key (without number prefix)
 */
export function getFieldByKey(key: string): FieldDefinition | undefined {
  return FIELD_BY_KEY.get(key);
}

/**
 * Get field by full key (with number prefix like "7_listing_price")
 */
export function getFieldByFullKey(fullKey: string): FieldDefinition | undefined {
  return FIELD_MAP.get(fullKey);
}

/**
 * Total field count
 */
export const TOTAL_FIELDS = ALL_FIELDS.length;

/**
 * Data sources (aligned with arbitration tiers)
 */
export const DATA_SOURCES = [
  'Manual Entry',
  'Stellar MLS',
  'County Assessor',
  'County Tax Collector',
  'County Clerk',
  'County Permits',
  'Google Geocode',
  'Google Places',
  'Google Maps',
  'WalkScore',
  'SchoolDigger',
  'GreatSchools',
  'Niche',
  'NeighborhoodScout',
  'FBI Crime',
  'FEMA',
  'First Street',
  'AirNow',
  'IQAir',
  'HowLoud',
  'Weather',
  'RentCafe',
  'Zumper',
  'Census',
  'Perplexity',
  'Grok',
  'Claude Opus',
  'GPT',
  'Claude Sonnet',
  'Gemini',
] as const;

export type DataSource = typeof DATA_SOURCES[number];
