/**
 * CLUES Property Dashboard - ONE SOURCE OF TRUTH SCHEMA
 * Created: 2025-11-27
 * Updated: 2025-11-30 - Added 30 Stellar MLS fields (139-168)
 *
 * THIS IS THE ONLY FILE WHERE FIELDS ARE DEFINED.
 * All 168 fields (138 original + 30 Stellar MLS).
 *
 * DO NOT define fields anywhere else.
 * DO NOT duplicate this data.
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
  calculated?: boolean;
}

/**
 * THE MASTER FIELD LIST - 138 FIELDS
 * Extracted directly from the user's UI document.
 * Every field has: num, key, label, group, type, required
 */
export const ALL_FIELDS: readonly FieldDefinition[] = [
  // ================================================================
  // GROUP 1: Address & Identity (Fields 1-9)
  // ================================================================
  { num: 1,  key: 'full_address',     label: 'Full Address',     group: 'Address & Identity', type: 'text',   required: true },
  { num: 2,  key: 'mls_primary',      label: 'MLS Primary',      group: 'Address & Identity', type: 'text',   required: false },
  { num: 3,  key: 'mls_secondary',    label: 'MLS Secondary',    group: 'Address & Identity', type: 'text',   required: false },
  { num: 4,  key: 'listing_status',   label: 'Listing Status',   group: 'Address & Identity', type: 'select', required: false, options: ['Active', 'Pending', 'Sold', 'Off-Market'] },
  { num: 5,  key: 'listing_date',     label: 'Listing Date',     group: 'Address & Identity', type: 'date',   required: false },
  { num: 6,  key: 'neighborhood',     label: 'Neighborhood',     group: 'Address & Identity', type: 'text',   required: false },
  { num: 7,  key: 'county',           label: 'County',           group: 'Address & Identity', type: 'text',   required: false },
  { num: 8,  key: 'zip_code',         label: 'ZIP Code',         group: 'Address & Identity', type: 'text',   required: false },
  { num: 9,  key: 'parcel_id',        label: 'Parcel ID',        group: 'Address & Identity', type: 'text',   required: false },

  // ================================================================
  // GROUP 2: Pricing & Value (Fields 10-16)
  // ================================================================
  { num: 10, key: 'listing_price',         label: 'Listing Price',         group: 'Pricing & Value', type: 'currency', required: false },
  { num: 11, key: 'price_per_sqft',        label: 'Price Per Sq Ft',       group: 'Pricing & Value', type: 'currency', required: false, calculated: true },
  { num: 12, key: 'market_value_estimate', label: 'Market Value Estimate', group: 'Pricing & Value', type: 'currency', required: false },
  { num: 13, key: 'last_sale_date',        label: 'Last Sale Date',        group: 'Pricing & Value', type: 'date',     required: false },
  { num: 14, key: 'last_sale_price',       label: 'Last Sale Price',       group: 'Pricing & Value', type: 'currency', required: false },
  { num: 15, key: 'assessed_value',        label: 'Assessed Value',        group: 'Pricing & Value', type: 'currency', required: false },
  { num: 16, key: 'redfin_estimate',       label: 'Market Value Est. (AI)',       group: 'Pricing & Value', type: 'currency', required: false },

  // ================================================================
  // GROUP 3: Property Basics (Fields 17-29)
  // ================================================================
  { num: 17, key: 'bedrooms',              label: 'Bedrooms',              group: 'Property Basics', type: 'number', required: true },
  { num: 18, key: 'full_bathrooms',        label: 'Full Bathrooms',        group: 'Property Basics', type: 'number', required: true },
  { num: 19, key: 'half_bathrooms',        label: 'Half Bathrooms',        group: 'Property Basics', type: 'number', required: false },
  { num: 20, key: 'total_bathrooms',       label: 'Total Bathrooms',       group: 'Property Basics', type: 'number', required: false, calculated: true },
  { num: 21, key: 'living_sqft',           label: 'Living Sq Ft',          group: 'Property Basics', type: 'number', required: true },
  { num: 22, key: 'total_sqft_under_roof', label: 'Total Sq Ft Under Roof', group: 'Property Basics', type: 'number', required: false },
  { num: 23, key: 'lot_size_sqft',         label: 'Lot Size (Sq Ft)',      group: 'Property Basics', type: 'number', required: false },
  { num: 24, key: 'lot_size_acres',        label: 'Lot Size (Acres)',      group: 'Property Basics', type: 'number', required: false, calculated: true },
  { num: 25, key: 'year_built',            label: 'Year Built',            group: 'Property Basics', type: 'number', required: true },
  { num: 26, key: 'property_type',         label: 'Property Type',         group: 'Property Basics', type: 'select', required: true, options: ['Single Family', 'Condo', 'Townhouse', 'Multi-Family', 'Land', 'Commercial'] },
  { num: 27, key: 'stories',               label: 'Stories',               group: 'Property Basics', type: 'number', required: false },
  { num: 28, key: 'garage_spaces',         label: 'Garage Spaces',         group: 'Property Basics', type: 'number', required: false },
  { num: 29, key: 'parking_total',         label: 'Parking Total',         group: 'Property Basics', type: 'text',   required: false },

  // ================================================================
  // GROUP 4: HOA & Taxes (Fields 30-38)
  // ================================================================
  { num: 30, key: 'hoa_yn',            label: 'HOA',               group: 'HOA & Taxes', type: 'boolean',  required: false },
  { num: 31, key: 'hoa_fee_annual',    label: 'HOA Fee (Annual)',  group: 'HOA & Taxes', type: 'currency', required: false },
  { num: 32, key: 'hoa_name',          label: 'HOA Name',          group: 'HOA & Taxes', type: 'text',     required: false },
  { num: 33, key: 'hoa_includes',      label: 'HOA Includes',      group: 'HOA & Taxes', type: 'text',     required: false },
  { num: 34, key: 'ownership_type',    label: 'Ownership Type',    group: 'HOA & Taxes', type: 'select',   required: false, options: ['Fee Simple', 'Leasehold', 'Condo', 'Co-op'] },
  { num: 35, key: 'annual_taxes',      label: 'Annual Taxes',      group: 'HOA & Taxes', type: 'currency', required: false },
  { num: 36, key: 'tax_year',          label: 'Tax Year',          group: 'HOA & Taxes', type: 'number',   required: false },
  { num: 37, key: 'property_tax_rate', label: 'Property Tax Rate', group: 'HOA & Taxes', type: 'percentage', required: false },
  { num: 38, key: 'tax_exemptions',    label: 'Tax Exemptions',    group: 'HOA & Taxes', type: 'text',     required: false },

  // ================================================================
  // GROUP 5: Structure & Systems (Fields 39-48)
  // ================================================================
  { num: 39, key: 'roof_type',          label: 'Roof Type',          group: 'Structure & Systems', type: 'select', required: false, options: ['Shingle', 'Tile', 'Metal', 'Flat', 'Other'] },
  { num: 40, key: 'roof_age_est',       label: 'Roof Age (Est)',     group: 'Structure & Systems', type: 'text',   required: false },
  { num: 41, key: 'exterior_material',  label: 'Exterior Material',  group: 'Structure & Systems', type: 'select', required: false, options: ['Block/Stucco', 'Brick', 'Wood', 'Vinyl Siding', 'Fiber Cement', 'Other'] },
  { num: 42, key: 'foundation',         label: 'Foundation',         group: 'Structure & Systems', type: 'select', required: false, options: ['Slab', 'Crawl Space', 'Basement', 'Pier/Beam'] },
  { num: 43, key: 'water_heater_type',  label: 'Water Heater Type',  group: 'Structure & Systems', type: 'text',   required: false },
  { num: 44, key: 'garage_type',        label: 'Garage Type',        group: 'Structure & Systems', type: 'text',   required: false },
  { num: 45, key: 'hvac_type',          label: 'HVAC Type',          group: 'Structure & Systems', type: 'text',   required: false },
  { num: 46, key: 'hvac_age',           label: 'HVAC Age',           group: 'Structure & Systems', type: 'text',   required: false },
  { num: 47, key: 'laundry_type',       label: 'Laundry Type',       group: 'Structure & Systems', type: 'text',   required: false },
  { num: 48, key: 'interior_condition', label: 'Interior Condition', group: 'Structure & Systems', type: 'select', required: false, options: ['Excellent', 'Good', 'Fair', 'Needs Work', 'Renovated'] },

  // ================================================================
  // GROUP 6: Interior Features (Fields 49-53)
  // ================================================================
  { num: 49, key: 'flooring_type',       label: 'Flooring Type',       group: 'Interior Features', type: 'text',        required: false },
  { num: 50, key: 'kitchen_features',    label: 'Kitchen Features',    group: 'Interior Features', type: 'text',        required: false },
  { num: 51, key: 'appliances_included', label: 'Appliances Included', group: 'Interior Features', type: 'multiselect', required: false, options: ['Refrigerator', 'Dishwasher', 'Range/Oven', 'Microwave', 'Washer', 'Dryer', 'Disposal'] },
  { num: 52, key: 'fireplace_yn',        label: 'Fireplace',           group: 'Interior Features', type: 'boolean',     required: false },
  { num: 53, key: 'fireplace_count',     label: 'Fireplace Count',     group: 'Interior Features', type: 'number',      required: false },

  // ================================================================
  // GROUP 7: Exterior Features (Fields 54-58)
  // ================================================================
  { num: 54, key: 'pool_yn',      label: 'Pool',        group: 'Exterior Features', type: 'boolean', required: false },
  { num: 55, key: 'pool_type',    label: 'Pool Type',   group: 'Exterior Features', type: 'multiselect',  required: false, options: ['N/A', 'In-ground', 'Above-ground', 'In-ground Heated', 'Community'] },
  { num: 56, key: 'deck_patio',   label: 'Deck/Patio',  group: 'Exterior Features', type: 'text',    required: false },
  { num: 57, key: 'fence',        label: 'Fence',       group: 'Exterior Features', type: 'text',    required: false },
  { num: 58, key: 'landscaping',  label: 'Landscaping', group: 'Exterior Features', type: 'text',    required: false },

  // ================================================================
  // GROUP 8: Permits & Renovations (Fields 59-62)
  // ================================================================
  { num: 59, key: 'recent_renovations',     label: 'Recent Renovations',      group: 'Permits & Renovations', type: 'text', required: false },
  { num: 60, key: 'permit_history_roof',    label: 'Permit History - Roof',   group: 'Permits & Renovations', type: 'text', required: false },
  { num: 61, key: 'permit_history_hvac',    label: 'Permit History - HVAC',   group: 'Permits & Renovations', type: 'text', required: false },
  { num: 62, key: 'permit_history_other',   label: 'Permit History - Other',  group: 'Permits & Renovations', type: 'text', required: false },

  // ================================================================
  // GROUP 9: Assigned Schools (Fields 63-73)
  // ================================================================
  { num: 63, key: 'school_district',          label: 'School District',          group: 'Assigned Schools', type: 'text',   required: false },
  { num: 64, key: 'elevation_feet',           label: 'Elevation (feet)',         group: 'Assigned Schools', type: 'number', required: false },
  { num: 65, key: 'elementary_school',        label: 'Elementary School',        group: 'Assigned Schools', type: 'text',   required: false },
  { num: 66, key: 'elementary_rating',        label: 'Elementary Rating',        group: 'Assigned Schools', type: 'text',   required: false },
  { num: 67, key: 'elementary_distance_mi',   label: 'Elementary Distance (mi)', group: 'Assigned Schools', type: 'number', required: false },
  { num: 68, key: 'middle_school',            label: 'Middle School',            group: 'Assigned Schools', type: 'text',   required: false },
  { num: 69, key: 'middle_rating',            label: 'Middle Rating',            group: 'Assigned Schools', type: 'text',   required: false },
  { num: 70, key: 'middle_distance_mi',       label: 'Middle Distance (mi)',     group: 'Assigned Schools', type: 'number', required: false },
  { num: 71, key: 'high_school',              label: 'High School',              group: 'Assigned Schools', type: 'text',   required: false },
  { num: 72, key: 'high_rating',              label: 'High Rating',              group: 'Assigned Schools', type: 'text',   required: false },
  { num: 73, key: 'high_distance_mi',         label: 'High Distance (mi)',       group: 'Assigned Schools', type: 'number', required: false },

  // ================================================================
  // GROUP 10: Location Scores (Fields 74-82)
  // ================================================================
  { num: 74, key: 'walk_score',              label: 'Walk Score',              group: 'Location Scores', type: 'number', required: false },
  { num: 75, key: 'transit_score',           label: 'Transit Score',           group: 'Location Scores', type: 'number', required: false },
  { num: 76, key: 'bike_score',              label: 'Bike Score',              group: 'Location Scores', type: 'number', required: false },
  { num: 77, key: 'safety_score',            label: 'Safety',                  group: 'Location Scores', type: 'number', required: false },
  { num: 78, key: 'noise_level',             label: 'Noise Level',             group: 'Location Scores', type: 'text',   required: false },
  { num: 79, key: 'traffic_level',           label: 'Traffic Level',           group: 'Location Scores', type: 'text',   required: false },
  { num: 80, key: 'walkability_description', label: 'Walkability Description', group: 'Location Scores', type: 'text',   required: false },
  { num: 81, key: 'public_transit_access',   label: 'Public Transit Access',   group: 'Location Scores', type: 'text',   required: false },
  { num: 82, key: 'commute_to_city_center',  label: 'Commute to City Center',  group: 'Location Scores', type: 'text',   required: false },

  // ================================================================
  // GROUP 11: Distances & Amenities (Fields 83-87)
  // ================================================================
  { num: 83, key: 'distance_grocery_mi',   label: 'Distance to Grocery (mi)',  group: 'Distances & Amenities', type: 'number', required: false },
  { num: 84, key: 'distance_hospital_mi',  label: 'Distance to Hospital (mi)', group: 'Distances & Amenities', type: 'number', required: false },
  { num: 85, key: 'distance_airport_mi',   label: 'Distance to Airport (mi)',  group: 'Distances & Amenities', type: 'number', required: false },
  { num: 86, key: 'distance_park_mi',      label: 'Distance to Park (mi)',     group: 'Distances & Amenities', type: 'number', required: false },
  { num: 87, key: 'distance_beach_mi',     label: 'Distance to Beach (mi)',    group: 'Distances & Amenities', type: 'number', required: false },

  // ================================================================
  // GROUP 12: Safety & Crime (Fields 88-90)
  // ================================================================
  { num: 88, key: 'violent_crime_index',        label: 'Violent Crime Index',        group: 'Safety & Crime', type: 'text', required: false },
  { num: 89, key: 'property_crime_index',       label: 'Property Crime Index',       group: 'Safety & Crime', type: 'text', required: false },
  { num: 90, key: 'neighborhood_safety_rating', label: 'Neighborhood Safety Rating', group: 'Safety & Crime', type: 'text', required: false },

  // ================================================================
  // GROUP 13: Market & Investment Data (Fields 91-103)
  // ================================================================
  { num: 91,  key: 'median_home_price_neighborhood', label: 'Median Home Price (Neighborhood)', group: 'Market & Investment Data', type: 'currency',   required: false },
  { num: 92,  key: 'price_per_sqft_recent_avg',      label: 'Price Per Sq Ft (Recent Avg)',     group: 'Market & Investment Data', type: 'currency',   required: false },
  { num: 93,  key: 'price_to_rent_ratio',            label: 'Price to Rent Ratio',              group: 'Market & Investment Data', type: 'number',     required: false },
  { num: 94,  key: 'price_vs_median_percent',        label: 'Price vs Median %',                group: 'Market & Investment Data', type: 'percentage', required: false },
  { num: 95,  key: 'days_on_market_avg',             label: 'Days on Market (Avg)',             group: 'Market & Investment Data', type: 'number',     required: false },
  { num: 96,  key: 'inventory_surplus',              label: 'Inventory Surplus',                group: 'Market & Investment Data', type: 'text',       required: false },
  { num: 97,  key: 'insurance_est_annual',           label: 'Insurance Estimate (Annual)',      group: 'Market & Investment Data', type: 'currency',   required: false },
  { num: 98,  key: 'rental_estimate_monthly',        label: 'Rental Estimate (Monthly)',        group: 'Market & Investment Data', type: 'currency',   required: false },
  { num: 99,  key: 'rental_yield_est',               label: 'Rental Yield (Est)',               group: 'Market & Investment Data', type: 'percentage', required: false },
  { num: 100, key: 'vacancy_rate_neighborhood',      label: 'Vacancy Rate (Neighborhood)',      group: 'Market & Investment Data', type: 'percentage', required: false },
  { num: 101, key: 'cap_rate_est',                   label: 'Cap Rate (Est)',                   group: 'Market & Investment Data', type: 'percentage', required: false },
  { num: 102, key: 'financing_terms',                label: 'Financing Terms',                  group: 'Market & Investment Data', type: 'text',       required: false },
  { num: 103, key: 'comparable_sales',               label: 'Comparable Sales',                 group: 'Market & Investment Data', type: 'text',       required: false },

  // ================================================================
  // GROUP 14: Utilities & Connectivity (Fields 104-116)
  // ================================================================
  { num: 104, key: 'electric_provider',          label: 'Electric Provider',          group: 'Utilities & Connectivity', type: 'text', required: false },
  { num: 105, key: 'avg_electric_bill',          label: 'Avg Electric Bill',          group: 'Utilities & Connectivity', type: 'text', required: false },
  { num: 106, key: 'water_provider',             label: 'Water Provider',             group: 'Utilities & Connectivity', type: 'text', required: false },
  { num: 107, key: 'avg_water_bill',             label: 'Avg Water Bill',             group: 'Utilities & Connectivity', type: 'text', required: false },
  { num: 108, key: 'sewer_provider',             label: 'Sewer Provider',             group: 'Utilities & Connectivity', type: 'text', required: false },
  { num: 109, key: 'natural_gas',                label: 'Natural Gas',                group: 'Utilities & Connectivity', type: 'text', required: false },
  { num: 110, key: 'trash_provider',             label: 'Trash Provider',             group: 'Utilities & Connectivity', type: 'text', required: false },
  { num: 111, key: 'internet_providers_top3',    label: 'Internet Providers (Top 3)', group: 'Utilities & Connectivity', type: 'text', required: false },
  { num: 112, key: 'max_internet_speed',         label: 'Max Internet Speed',         group: 'Utilities & Connectivity', type: 'text', required: false },
  { num: 113, key: 'fiber_available',            label: 'Fiber Available',            group: 'Utilities & Connectivity', type: 'text', required: false },
  { num: 114, key: 'cable_tv_provider',          label: 'Cable TV Provider',          group: 'Utilities & Connectivity', type: 'text', required: false },
  { num: 115, key: 'cell_coverage_quality',      label: 'Cell Coverage Quality',      group: 'Utilities & Connectivity', type: 'text', required: false },
  { num: 116, key: 'emergency_services_distance', label: 'Emergency Services Distance', group: 'Utilities & Connectivity', type: 'text', required: false },

  // ================================================================
  // GROUP 15: Environment & Risk (Fields 117-130)
  // ================================================================
  { num: 117, key: 'air_quality_index',    label: 'Air Quality Index',    group: 'Environment & Risk', type: 'text', required: false },
  { num: 118, key: 'air_quality_grade',    label: 'Air Quality Grade',    group: 'Environment & Risk', type: 'text', required: false },
  { num: 119, key: 'flood_zone',           label: 'Flood Zone',           group: 'Environment & Risk', type: 'text', required: false },
  { num: 120, key: 'flood_risk_level',     label: 'Flood Risk Level',     group: 'Environment & Risk', type: 'text', required: false },
  { num: 121, key: 'climate_risk',         label: 'Climate Risk',         group: 'Environment & Risk', type: 'text', required: false },
  { num: 122, key: 'wildfire_risk',        label: 'Wildfire Risk',        group: 'Environment & Risk', type: 'text', required: false },
  { num: 123, key: 'earthquake_risk',      label: 'Earthquake Risk',      group: 'Environment & Risk', type: 'text', required: false },
  { num: 124, key: 'hurricane_risk',       label: 'Hurricane Risk',       group: 'Environment & Risk', type: 'text', required: false },
  { num: 125, key: 'tornado_risk',         label: 'Tornado Risk',         group: 'Environment & Risk', type: 'text', required: false },
  { num: 126, key: 'radon_risk',           label: 'Radon Risk',           group: 'Environment & Risk', type: 'text', required: false },
  { num: 127, key: 'superfund_site_nearby', label: 'Superfund Site Nearby', group: 'Environment & Risk', type: 'text', required: false },
  { num: 128, key: 'sea_level_rise_risk',  label: 'Sea Level Rise Risk',  group: 'Environment & Risk', type: 'text', required: false },
  { num: 129, key: 'noise_level_db_est',   label: 'Noise Level (dB Est)', group: 'Environment & Risk', type: 'text', required: false },
  { num: 130, key: 'solar_potential',      label: 'Solar Potential',      group: 'Environment & Risk', type: 'text', required: false },

  // ================================================================
  // GROUP 16: Additional Features (Fields 131-138)
  // ================================================================
  { num: 131, key: 'view_type',                label: 'View Type',                group: 'Additional Features', type: 'text', required: false },
  { num: 132, key: 'lot_features',             label: 'Lot Features',             group: 'Additional Features', type: 'text', required: false },
  { num: 133, key: 'ev_charging',              label: 'EV Charging',              group: 'Additional Features', type: 'text', required: false },
  { num: 134, key: 'smart_home_features',      label: 'Smart Home Features',      group: 'Additional Features', type: 'text', required: false },
  { num: 135, key: 'accessibility_modifications', label: 'Accessibility Modifications', group: 'Additional Features', type: 'text', required: false },
  { num: 136, key: 'pet_policy',               label: 'Pet Policy',               group: 'Additional Features', type: 'text', required: false },
  { num: 137, key: 'age_restrictions',         label: 'Age Restrictions',         group: 'Additional Features', type: 'text', required: false },
  { num: 138, key: 'special_assessments',      label: 'Special Assessments',      group: 'Additional Features', type: 'text', required: false },

  // ================================================================
  // GROUP 17: Stellar MLS - Parking & Garage (Fields 139-143)
  // Added: 2025-11-30 for Stellar MLS integration
  // ================================================================
  { num: 139, key: 'carport_yn',           label: 'Carport Y/N',           group: 'Parking Details', type: 'boolean', required: false },
  { num: 140, key: 'carport_spaces',       label: 'Carport Spaces',        group: 'Parking Details', type: 'number',  required: false },
  { num: 141, key: 'garage_attached_yn',   label: 'Garage Attached Y/N',   group: 'Parking Details', type: 'boolean', required: false },
  { num: 142, key: 'parking_features',     label: 'Parking Features',      group: 'Parking Details', type: 'multiselect', required: false, options: ['Assigned Parking', 'Covered Parking', 'Ground Level', 'Guest Parking', 'Garage Door Opener', 'Circular Driveway', 'Driveway', 'On Street', 'Off Street'] },
  { num: 143, key: 'assigned_parking_spaces', label: 'Assigned Parking Spaces', group: 'Parking Details', type: 'number', required: false },

  // ================================================================
  // GROUP 18: Stellar MLS - Building Info (Fields 144-148)
  // ================================================================
  { num: 144, key: 'floor_number',          label: 'Floor Number',          group: 'Building Details', type: 'number', required: false },
  { num: 145, key: 'building_total_floors', label: 'Building Total Floors', group: 'Building Details', type: 'number', required: false },
  { num: 146, key: 'building_name_number',  label: 'Building Name/Number',  group: 'Building Details', type: 'text',   required: false },
  { num: 147, key: 'building_elevator_yn',  label: 'Building Elevator Y/N', group: 'Building Details', type: 'boolean', required: false },
  { num: 148, key: 'floors_in_unit',        label: 'Floors in Unit',        group: 'Building Details', type: 'number', required: false },

  // ================================================================
  // GROUP 19: Stellar MLS - Legal & Tax (Fields 149-154)
  // ================================================================
  { num: 149, key: 'subdivision_name',      label: 'Subdivision Name',      group: 'Legal & Compliance', type: 'text',    required: false },
  { num: 150, key: 'legal_description',     label: 'Legal Description',     group: 'Legal & Compliance', type: 'text',    required: false },
  { num: 151, key: 'homestead_yn',          label: 'Homestead Exemption',   group: 'Legal & Compliance', type: 'boolean', required: false },
  { num: 152, key: 'cdd_yn',                label: 'CDD Y/N',               group: 'Legal & Compliance', type: 'boolean', required: false },
  { num: 153, key: 'annual_cdd_fee',        label: 'Annual CDD Fee',        group: 'Legal & Compliance', type: 'currency', required: false },
  { num: 154, key: 'front_exposure',        label: 'Front Exposure',        group: 'Legal & Compliance', type: 'select',  required: false, options: ['North', 'South', 'East', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest'] },

  // ================================================================
  // GROUP 20: Stellar MLS - Waterfront (Fields 155-159)
  // ================================================================
  { num: 155, key: 'water_frontage_yn',     label: 'Water Frontage Y/N',    group: 'Waterfront', type: 'boolean', required: false },
  { num: 156, key: 'waterfront_feet',       label: 'Waterfront Feet',       group: 'Waterfront', type: 'number',  required: false },
  { num: 157, key: 'water_access_yn',       label: 'Water Access Y/N',      group: 'Waterfront', type: 'boolean', required: false },
  { num: 158, key: 'water_view_yn',         label: 'Water View Y/N',        group: 'Waterfront', type: 'boolean', required: false },
  { num: 159, key: 'water_body_name',       label: 'Water Body Name',       group: 'Waterfront', type: 'text',    required: false },

  // ================================================================
  // GROUP 21: Stellar MLS - Leasing & Pets (Fields 160-165)
  // ================================================================
  { num: 160, key: 'can_be_leased_yn',        label: 'Can Be Leased Y/N',        group: 'Leasing & Rentals', type: 'boolean', required: false },
  { num: 161, key: 'minimum_lease_period',    label: 'Minimum Lease Period',     group: 'Leasing & Rentals', type: 'text',    required: false },
  { num: 162, key: 'lease_restrictions_yn',   label: 'Lease Restrictions Y/N',   group: 'Leasing & Rentals', type: 'boolean', required: false },
  { num: 163, key: 'pet_size_limit',          label: 'Pet Size Limit',           group: 'Leasing & Rentals', type: 'text',    required: false },
  { num: 164, key: 'max_pet_weight',          label: 'Max Pet Weight (lbs)',     group: 'Leasing & Rentals', type: 'number',  required: false },
  { num: 165, key: 'association_approval_yn', label: 'Association Approval Req', group: 'Leasing & Rentals', type: 'boolean', required: false },

  // ================================================================
  // GROUP 22: Stellar MLS - Features & Flood (Fields 166-168)
  // ================================================================
  { num: 166, key: 'community_features',    label: 'Community Features',    group: 'Community & Features', type: 'multiselect', required: false, options: ['Pool', 'Clubhouse', 'Tennis Courts', 'Golf', 'Fitness Center', 'Gated', 'Sidewalks', 'Playground', 'Dog Park', 'Marina', 'Beach Access'] },
  { num: 167, key: 'interior_features',     label: 'Interior Features',     group: 'Community & Features', type: 'multiselect', required: false, options: ['Cathedral Ceiling(s)', 'Walk-In Closet(s)', 'Primary Bedroom Main Floor', 'Open Floor Plan', 'Crown Molding', 'Skylight(s)', 'Wet Bar', 'Built-in Features'] },
  { num: 168, key: 'exterior_features',     label: 'Exterior Features',     group: 'Community & Features', type: 'multiselect', required: false, options: ['Balcony', 'Outdoor Shower', 'Sidewalk', 'Sliding Doors', 'Hurricane Shutters', 'Sprinkler System', 'Outdoor Kitchen', 'Private Dock'] },
] as const;

// ================================================================
// DERIVED DATA - AUTO-GENERATED FROM ALL_FIELDS
// ================================================================

/**
 * Map of field key (with number prefix) to field definition
 * Example: "10_listing_price" -> { num: 10, key: 'listing_price', ... }
 */
export const FIELD_MAP = new Map<string, FieldDefinition>(
  ALL_FIELDS.map(f => [`${f.num}_${f.key}`, f])
);

/**
 * Map of field number to field definition
 * Example: 10 -> { num: 10, key: 'listing_price', ... }
 */
export const FIELD_BY_NUMBER = new Map<number, FieldDefinition>(
  ALL_FIELDS.map(f => [f.num, f])
);

/**
 * Map of field key (without number) to field definition
 * Example: "listing_price" -> { num: 10, key: 'listing_price', ... }
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
 * Get field by full key (with number prefix like "10_listing_price")
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
  'Redfin',
  'Perplexity',
  'Grok',
  'Claude Opus',
  'GPT',
  'Claude Sonnet',
  'Gemini',
  'Other',
] as const;

export type DataSource = typeof DATA_SOURCES[number];

// ================================================================
// COMPATIBLE EXPORTS FOR PropertySearchForm.tsx
// These transform ALL_FIELDS into the format expected by the UI
// ================================================================

/**
 * UI-compatible field definition interface
 * Maps to PropertySearchForm expectations
 */
export interface UIFieldDefinition {
  id: number;
  key: string;
  label: string;
  group: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | 'currency' | 'percentage';
  options?: string[];
  required: boolean;
  placeholder?: string;
  helpText?: string;
  autoPopulateSources?: DataSource[];
}

/**
 * UI_FIELD_DEFINITIONS - UI-compatible format
 * Transforms ALL_FIELDS (138) into format PropertySearchForm expects
 */
export const UI_FIELD_DEFINITIONS: UIFieldDefinition[] = ALL_FIELDS.map(f => ({
  id: f.num,
  key: f.key,
  label: f.label,
  group: f.group,
  type: f.type,
  options: f.options,
  required: f.required,
  placeholder: f.placeholder,
  helpText: f.helpText,
}));

/**
 * UI Field Groups with field ID arrays
 * Groups for the 138-field schema
 */
export const UI_FIELD_GROUPS = [
  { id: 'A', name: 'Address & Identity', fields: [1, 2, 3, 4, 5, 6, 7, 8, 9], color: 'cyan' },
  { id: 'B', name: 'Pricing & Value', fields: [10, 11, 12, 13, 14, 15, 16], color: 'green' },
  { id: 'C', name: 'Property Basics', fields: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], color: 'blue' },
  { id: 'D', name: 'HOA & Taxes', fields: [30, 31, 32, 33, 34, 35, 36, 37, 38], color: 'purple' },
  { id: 'E', name: 'Structure & Systems', fields: [39, 40, 41, 42, 43, 44, 45, 46, 47, 48], color: 'orange' },
  { id: 'F', name: 'Interior Features', fields: [49, 50, 51, 52, 53], color: 'pink' },
  { id: 'G', name: 'Exterior Features', fields: [54, 55, 56, 57, 58], color: 'teal' },
  { id: 'H', name: 'Permits & Renovations', fields: [59, 60, 61, 62], color: 'indigo' },
  { id: 'I', name: 'Assigned Schools', fields: [63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73], color: 'cyan' },
  { id: 'J', name: 'Location Scores', fields: [74, 75, 76, 77, 78, 79, 80, 81, 82], color: 'green' },
  { id: 'K', name: 'Distances & Amenities', fields: [83, 84, 85, 86, 87], color: 'blue' },
  { id: 'L', name: 'Safety & Crime', fields: [88, 89, 90], color: 'red' },
  { id: 'M', name: 'Market & Investment Data', fields: [91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103], color: 'green' },
  { id: 'N', name: 'Utilities & Connectivity', fields: [104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116], color: 'yellow' },
  { id: 'O', name: 'Environment & Risk', fields: [117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130], color: 'orange' },
  { id: 'P', name: 'Additional Features', fields: [131, 132, 133, 134, 135, 136, 137, 138], color: 'purple' },
  // NEW: Stellar MLS Groups (139-168)
  { id: 'Q', name: 'Parking', fields: [139, 140, 141, 142, 143], color: 'slate' },
  { id: 'R', name: 'Building', fields: [144, 145, 146, 147, 148], color: 'zinc' },
  { id: 'S', name: 'Legal', fields: [149, 150, 151, 152, 153, 154], color: 'stone' },
  { id: 'T', name: 'Waterfront', fields: [155, 156, 157, 158, 159], color: 'sky' },
  { id: 'U', name: 'Leasing', fields: [160, 161, 162, 163, 164, 165], color: 'amber' },
  { id: 'V', name: 'Features', fields: [166, 167, 168], color: 'emerald' },
];

// Source-based color coding for data reliability
// GREEN: Perplexity/Grok with citations, paid APIs, official sources
// YELLOW: Claude Opus/Sonnet - needs verification
// RED: GPT, Gemini, Other - may be hallucinated
export const getSourceColor = (source: DataSource): { bg: string; text: string; label: string } => {
  const trusted: DataSource[] = ['Perplexity', 'Grok', 'Stellar MLS', 'County Assessor', 'County Tax Collector', 'County Clerk', 'County Permits', 'Google Geocode', 'Google Places', 'Google Maps', 'WalkScore', 'SchoolDigger', 'GreatSchools', 'Niche', 'NeighborhoodScout', 'FBI Crime', 'FEMA', 'First Street', 'AirNow', 'IQAir', 'HowLoud', 'Weather', 'RentCafe', 'Zumper', 'Census', 'Redfin'];
  const caution: DataSource[] = ['Claude Opus', 'Claude Sonnet', 'Manual Entry'];
  if (trusted.includes(source)) return { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Verified' };
  if (caution.includes(source)) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Review' };
  return { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Unverified' };
};
