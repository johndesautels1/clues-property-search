/**
 * CLUES Property Dashboard - MLS PDF Parser API
 * Extracts property data from Stellar MLS CustomerFull PDF sheets
 * Uses Claude to parse PDF content and map to 168-field schema
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  isMonthlyHoaFeeKey,
  convertMonthlyHoaToAnnual
} from '../../src/lib/field-map-flat-to-numbered.js';
import {
  safeJsonParse,
  extractAndParseJson
} from '../../src/lib/safe-json-parse.js';

// Vercel serverless config
export const config = {
  maxDuration: 120, // 2 minutes for PDF parsing
};

// Fields that contain monthly HOA values (need conversion to annual)
const MONTHLY_HOA_FIELDS = new Set([
  'Monthly HOA Amount',
  'HOA Monthly',
  'Average Monthly Fees',
  'HOA Fee', // Often monthly in MLS sheets
]);

// Fields that are already annual
const ANNUAL_HOA_FIELDS = new Set([
  'HOA Annual',
  'Total Annual Assoc Fees',
]);

// MLS field mapping: Maps Stellar MLS field names to our numbered schema
// UPDATED: 2025-11-30 - Corrected ALL field numbers to match fields-schema.ts
const MLS_FIELD_MAPPING: Record<string, string> = {
  // ================================================================
  // GROUP 1: ADDRESS & IDENTITY (Fields 1-9)
  // ================================================================
  'Address': '1_full_address',
  'Full Address': '1_full_address',
  'Property Address': '1_full_address',
  'MLS#': '2_mls_primary',
  'MLS Number': '2_mls_primary',
  'MLS': '2_mls_primary',
  'Listing ID': '2_mls_primary',
  'Status': '4_listing_status',
  'Listing Status': '4_listing_status',
  'List Date': '5_listing_date',
  'Original List Date': '5_listing_date',
  'Recent': '5_listing_date',
  'Recent:': '5_listing_date',
  'Neighborhood': '6_neighborhood',
  'Subdiv/Condo': '6_neighborhood',  // Stellar MLS uses "Subdiv/Condo" for neighborhood
  'County': '7_county',
  'Zip': '8_zip_code',
  'Zip Code': '8_zip_code',
  'ZIP': '8_zip_code',
  'Postal Code': '8_zip_code',
  'Tax ID': '9_parcel_id',
  'Parcel ID': '9_parcel_id',
  'Parcel Number': '9_parcel_id',
  'Alt Key/Folio #': '9_parcel_id',

  // ================================================================
  // GROUP 2: PRICING & VALUE (Fields 10-16)
  // ================================================================
  'List Price': '10_listing_price',
  'Listing Price': '10_listing_price',
  'Current Price': '10_listing_price',
  'Price': '10_listing_price',
  'LP/SqFt': '11_price_per_sqft',
  'Price/SqFt': '11_price_per_sqft',
  '$/SqFt': '11_price_per_sqft',
  'Zestimate': '12_market_value_estimate',
  'Estimated Value': '12_market_value_estimate',
  'Last Sale Date': '13_last_sale_date',
  'Prior Sale Date': '13_last_sale_date',
  'Sold Date': '13_last_sale_date',
  'Previous Sale Date': '13_last_sale_date',
  'Last Sale Price': '14_last_sale_price',
  'Prior Sale Price': '14_last_sale_price',
  'Sold Price': '14_last_sale_price',
  'Previous Sale Price': '14_last_sale_price',
  'Assessed Value': '15_assessed_value',
  'Tax Assessed Value': '15_assessed_value',

  // ================================================================
  // GROUP 3: PROPERTY BASICS (Fields 17-29)
  // ================================================================
  'Beds': '17_bedrooms',
  'Bedrooms': '17_bedrooms',
  'BR': '17_bedrooms',
  'Bedrooms Total': '17_bedrooms',
  'Full Baths': '18_full_bathrooms',
  'Full Bathrooms': '18_full_bathrooms',
  'Half Baths': '19_half_bathrooms',
  'Half Bathrooms': '19_half_bathrooms',
  'Baths': '20_total_bathrooms',
  'Total Baths': '20_total_bathrooms',
  'Bathrooms Total': '20_total_bathrooms',
  'Heated Area': '21_living_sqft',
  'Living Area': '21_living_sqft',
  'Living SqFt': '21_living_sqft',
  'Heated SqFt': '21_living_sqft',
  'Interior SqFt': '21_living_sqft',
  'Total Area': '22_total_sqft_under_roof',
  'Total SqFt': '22_total_sqft_under_roof',
  'Lot Size': '23_lot_size_sqft',
  'Lot SqFt': '23_lot_size_sqft',
  'Lot Size Acres': '24_lot_size_acres',
  'Lot Acres': '24_lot_size_acres',
  'Total Acreage': '24_lot_size_acres',
  'Year Built': '25_year_built',
  'Built': '25_year_built',
  'Property Style': '26_property_type',
  'Property Type': '26_property_type',
  'Type': '26_property_type',
  'Property Sub Type': '26_property_type',
  'Stories': '27_stories',
  'Floors in Unit/Home': '27_stories',
  'Floors In Unit': '27_stories',
  'Garage': '28_garage_spaces',
  'Garage Spaces': '28_garage_spaces',
  'Spcs': '28_garage_spaces',
  'Parking Spaces': '29_parking_total',
  'Total Parking': '29_parking_total',

  // ================================================================
  // GROUP 4: HOA & TAXES (Fields 30-38)
  // ================================================================
  'HOA / Comm Assn': '30_hoa_yn',
  'HOA': '30_hoa_yn',
  'HOA Y/N': '30_hoa_yn',
  'HOA Fee': '31_hoa_fee_annual',
  'Monthly HOA Amount': '31_hoa_fee_annual',
  'HOA Monthly': '31_hoa_fee_annual',
  'HOA Annual': '31_hoa_fee_annual',
  'Total Annual Assoc Fees': '31_hoa_fee_annual',
  'Average Monthly Fees': '31_hoa_fee_annual',
  'HOA Name': '32_hoa_name',
  'Association Name': '32_hoa_name',
  'Master Assn/Name': '32_hoa_name',
  'Fee Includes': '33_hoa_includes',
  'HOA Includes': '33_hoa_includes',
  'Association Fee Includes': '33_hoa_includes',
  'Ownership': '34_ownership_type',
  'Taxes': '35_annual_taxes',
  'Annual Taxes': '35_annual_taxes',
  'Tax Amount': '35_annual_taxes',
  'Tax Year': '36_tax_year',
  'Tax Rate': '37_property_tax_rate',
  'Property Tax Rate': '37_property_tax_rate',
  'Mill Rate': '37_property_tax_rate',
  'Tax Exemptions': '38_tax_exemptions',
  'Exemptions': '38_tax_exemptions',
  'Tax Exempt': '38_tax_exemptions',
  'Other Exemptions': '38_tax_exemptions',
  'HOA Pmt Sched': 'hoa_payment_schedule',

  // ================================================================
  // GROUP 5: STRUCTURE & SYSTEMS (Fields 39-48)
  // ================================================================
  'Roof': '39_roof_type',
  'Roof Type': '39_roof_type',
  'Roofing': '39_roof_type',
  'Roof Year': '40_roof_age_est',
  'Roof Age': '40_roof_age_est',
  'Year Roof': '40_roof_age_est',
  'Ext Construction': '41_exterior_material',
  'Exterior': '41_exterior_material',
  'Exterior Material': '41_exterior_material',
  'Construction': '41_exterior_material',
  'Foundation': '42_foundation',
  'Foundation Type': '42_foundation',
  'Water Heater': '43_water_heater_type',
  'Water Heater Type': '43_water_heater_type',
  'Hot Water': '43_water_heater_type',
  'Garage Type': '44_garage_type',
  'Garage Description': '44_garage_type',
  'Garage Style': '44_garage_type',
  'Garage Dim': '44_garage_type',
  'A/C': '45_hvac_type',
  'Heat/Fuel': '45_hvac_type',
  'HVAC': '45_hvac_type',
  'Heating': '45_hvac_type',
  'Cooling': '45_hvac_type',
  'HVAC Age': '46_hvac_age',
  'A/C Age': '46_hvac_age',
  'Year A/C': '46_hvac_age',
  'Year HVAC': '46_hvac_age',
  'AC Year': '46_hvac_age',
  'Laundry Features': '47_laundry_type',
  'Interior Condition': '48_interior_condition',
  'Condition': '48_interior_condition',
  'Property Cond': '48_interior_condition',

  // ================================================================
  // GROUP 6: INTERIOR FEATURES (Fields 49-53)
  // ================================================================
  'Flooring Covering': '49_flooring_type',
  'Flooring': '49_flooring_type',
  'Floor': '49_flooring_type',
  'Kitchen': '50_kitchen_features',
  'Kitchen Features': '50_kitchen_features',
  'Appliances Incl': '51_appliances_included',
  'Appliances': '51_appliances_included',
  'Appliances Included': '51_appliances_included',
  'Fireplace': '52_fireplace_yn',
  'Fireplace Y/N': '52_fireplace_yn',

  'Fireplace Count': '53_fireplace_count',
  '# of Fireplaces': '53_fireplace_count',
  'Fireplaces': '53_fireplace_count',
  'Number of Fireplaces': '53_fireplace_count',
  // ================================================================
  // GROUP 7: EXTERIOR FEATURES (Fields 54-58)
  // ================================================================
  // NOTE: 'Pool' is handled by special logic below (lines 550+) to support combinations
  // 'Pool': '54_pool_yn',  // ❌ REMOVED: Causes "Community" string → boolean conversion bug
  'Pool Y/N': '54_pool_yn',
  'Pool Type': '55_pool_type',
  'Pool Features': '55_pool_type',

  'Deck': '56_deck_patio',
  'Patio': '56_deck_patio',
  'Deck/Patio': '56_deck_patio',
  'Patio And Porch': '56_deck_patio',
  'Fence': '57_fence',
  'Fencing': '57_fence',
  'Fence Type': '57_fence',
  'Fence Description': '57_fence',
  'Landscaping': '58_landscaping',
  'Landscape': '58_landscaping',
  'Yard': '58_landscaping',
  'Yard Description': '58_landscaping',
  // ================================================================
  // GROUP 9: SCHOOLS (Fields 63-73)
  // ================================================================
  'School District': '63_school_district',
  'District': '63_school_district',
  'Elevation': '64_elevation_feet',
  'Elevation Feet': '64_elevation_feet',
  'Ground Elevation': '64_elevation_feet',
  'Site Elevation': '64_elevation_feet',
  'Elementary School': '65_elementary_school',
  'Elementary': '65_elementary_school',
  'Elementary Rating': '66_elementary_rating',
  'Elementary School Rating': '66_elementary_rating',
  'Elementary Distance': '67_elementary_distance_mi',
  'Elementary School Distance': '67_elementary_distance_mi',
  'Middle School': '68_middle_school',
  'Middle': '68_middle_school',
  'Middle Rating': '69_middle_rating',
  'Middle School Rating': '69_middle_rating',
  'Middle Distance': '70_middle_distance_mi',
  'Middle School Distance': '70_middle_distance_mi',
  'High School': '71_high_school',
  'High': '71_high_school',

  'High Rating': '72_high_rating',
  'High School Rating': '72_high_rating',
  'High Distance': '73_high_distance_mi',
  'High School Distance': '73_high_distance_mi',
  // ================================================================
  // GROUP 13: MARKET & INVESTMENT (Fields 91-103)
  // ================================================================
  'ADOM': '95_days_on_market_avg',
  'CDOM': '95_days_on_market_avg',
  'Days on Market': '95_days_on_market_avg',
  'DOM': '95_days_on_market_avg',

  // ================================================================
  // GROUP 15: ENVIRONMENT & RISK (Fields 117-130)
  // ================================================================
  'Flood Zone': '119_flood_zone',
  'Flood Zone Code': '119_flood_zone',
  'Flood Zone Date': 'flood_zone_date',
  'Flood Zone Panel': 'flood_zone_panel',

  // ================================================================
  // LOCATION (parsed separately)
  // ================================================================
  'City': 'city',
  'State': 'state',
  'Subdiv': '149_subdivision_name',
  'Subdivision': '149_subdivision_name',
  'Subdivision Name': '149_subdivision_name',
  'SE/TP/RG': 'section_township_range',
  'Zoning': 'zoning',
  'Future Land Use': 'future_land_use',

  // ================================================================
  // STELLAR MLS - PARKING (Fields 139-143)
  // ================================================================
  'Carport': '139_carport_yn',
  'Carport Y/N': '139_carport_yn',
  'Carport Spcs': '140_carport_spaces',
  'Carport Spaces': '140_carport_spaces',
  'Attch': '141_garage_attached_yn',
  'Garage Attached': '141_garage_attached_yn',
  'Attached Garage': '141_garage_attached_yn',
  'Garage/Parking Features': '142_parking_features',
  'Parking Features': '142_parking_features',
  'Assigned Spcs': '143_assigned_parking_spaces',
  'Assigned Parking': '143_assigned_parking_spaces',

  // ================================================================
  // STELLAR MLS - BUILDING (Fields 144-148)
  // ================================================================
  'Floor #': '144_floor_number',
  'Floor Number': '144_floor_number',
  'Unit Floor': '144_floor_number',
  'Total # of Floors': '145_building_total_floors',
  'Building Floors': '145_building_total_floors',
  'Total Floors': '145_building_total_floors',
  'Bldg Name/#': '146_building_name_number',
  'Building Name': '146_building_name_number',
  'Building Number': '146_building_name_number',
  'Building Elevator Y/N': '147_building_elevator_yn',
  'Elevator': '147_building_elevator_yn',
  'Elevator Y/N': '147_building_elevator_yn',
  // NOTE: "Floors in Unit/Home" now maps to 27_stories (line 122), not 148_floors_in_unit

  // ================================================================
  // STELLAR MLS - LEGAL (Fields 149-154)
  // ================================================================
  'Legal Desc': '150_legal_description',
  'Legal Description': '150_legal_description',
  'Legal': '150_legal_description',
  'Homestead': '151_homestead_yn',
  'Homestead Y/N': '151_homestead_yn',
  'CDD': '152_cdd_yn',
  'CDD Y/N': '152_cdd_yn',
  'Annual CDD Fee': '153_annual_cdd_fee',
  'CDD Fee': '153_annual_cdd_fee',
  'Annual CDD': '153_annual_cdd_fee',
  'Front Exposure': '154_front_exposure',
  'Exposure': '154_front_exposure',
  'Direction Faces': '154_front_exposure',

  // ================================================================
  // STELLAR MLS - WATERFRONT (Fields 155-159)
  // ================================================================
  'Water Frontage': '155_water_frontage_yn',
  'Waterfront': '155_water_frontage_yn',
  'Waterfront Y/N': '155_water_frontage_yn',
  'Water Front': '155_water_frontage_yn',
  'Waterfrontage': '155_water_frontage_yn',
  'On Water': '155_water_frontage_yn',
  'Waterfront Ft': '156_waterfront_feet',
  'Waterfront Feet': '156_waterfront_feet',
  'Water Feet': '156_waterfront_feet',
  'Frontage Feet': '156_waterfront_feet',
  'Water Frontage Ft': '156_waterfront_feet',
  'Water Frontage Feet': '156_waterfront_feet',
  'Waterfront Linear Feet': '156_waterfront_feet',
  'Linear Water Feet': '156_waterfront_feet',
  'Water Access': '157_water_access_yn',
  'Water Access Y/N': '157_water_access_yn',
  'WaterAccess': '157_water_access_yn',
  'Access to Water': '157_water_access_yn',
  'Water View': '158_water_view_yn',
  'Water View Y/N': '158_water_view_yn',
  'WaterView': '158_water_view_yn',
  'View of Water': '158_water_view_yn',
  'Water Name': '159_water_body_name',
  'Water Body': '159_water_body_name',
  'Body of Water': '159_water_body_name',
  'Water Body Name': '159_water_body_name',
  'Waterbody': '159_water_body_name',
  'Water Extras': 'water_extras',
  'Addtl Water Info': 'additional_water_info',

  // ================================================================
  // STELLAR MLS - LEASING (Fields 160-165)
  // ================================================================
  'Can Property be Leased': '160_can_be_leased_yn',
  'Can Be Leased': '160_can_be_leased_yn',
  'Lease': '160_can_be_leased_yn',
  'Lease Allowed': '160_can_be_leased_yn',
  'Minimum Lease Period': '161_minimum_lease_period',
  'Minimum Lease': '161_minimum_lease_period',
  'Min Lease': '161_minimum_lease_period',
  'Lease Period': '161_minimum_lease_period',
  'Lease Restrictions': '162_lease_restrictions_yn',
  'Pet Size': '163_pet_size_limit',
  'Pet Limit': '163_pet_size_limit',
  '# of Pets': '163_pet_size_limit',
  'Max Pet Wt': '164_max_pet_weight',
  'Max Pet Weight': '164_max_pet_weight',
  'Pet Weight': '164_max_pet_weight',
  'Pet Restrictions': 'pet_restrictions',
  'Association Approval Required': '165_association_approval_yn',
  'Association Approval': '165_association_approval_yn',
  'HOA Approval': '165_association_approval_yn',
  'Approval Process': 'approval_process',
  'Years of Ownership Prior to Leasing Required': 'years_ownership_before_lease',

  // ================================================================
  // STELLAR MLS - FEATURES (Fields 166-168)
  // ================================================================
  'Community Features': '166_community_features',
  'Community Amenities': '166_community_features',
  'Interior Feat': '167_interior_features',
  'Interior Features': '167_interior_features',
  'Interior': '167_interior_features',
  'Ext Features': '168_exterior_features',
  'Exterior Features': '168_exterior_features',
  'Patio And Porch Features': 'patio_porch_features',
  'View': '131_view_type',
  'Lot Features': '132_lot_features',
  'Lot Description': '132_lot_features',
  'Site Features': '132_lot_features',
  'Lot Dimensions': '132_lot_features',
  'EV Charging': '133_ev_charging',
  'Electric Vehicle Charging': '133_ev_charging',
  'EV': '133_ev_charging',
  'EV Ready': '133_ev_charging',
  'Smart Home': '134_smart_home_features',
  'Smart Home Features': '134_smart_home_features',
  'Home Automation': '134_smart_home_features',
  'Smart Features': '134_smart_home_features',

  // ================================================================
  // ADDITIONAL UNMAPPED FIELDS
  // ================================================================
  'New Construction': 'new_construction_yn',
  'Proj Comp Date': 'project_completion_date',
  'Property Condition': 'property_condition',
  'Home Warranty Y/N': 'home_warranty_yn',
  'Permit Number': 'permit_number',
  'Utilities': 'utilities',
  'Water': 'water_source',
  'Sewer': 'sewer_type',
  'Security Feat': 'security_features',
  'Window Features': 'window_features',
  'Furnishings': 'furnishings',
  'Accessibility Features': '135_accessibility_modifications',
  'Road Surface Type': 'road_surface',
  'Road Responsibility': 'road_responsibility',
  'Special Sale': 'special_sale_type',
  'Pets': '136_pet_policy',
  'Max Times per Yr': 'max_lease_times_per_year',
  'Property Description': 'property_description',
  'Architectural Style': 'architectural_style',
  'Property Attached Y/N': 'property_attached_yn',
  'Spa and Features': 'spa_features',
  'Vegetation': 'vegetation',
  'Barn Features': 'barn_features',
  'Horse Amenities': 'horse_amenities',
  '# of Stalls': 'number_of_stalls',
  '# Paddocks/Pastures': 'number_paddocks_pastures',
  'Green Energy Generation': 'green_energy_generation',
  'Green Energy Generation Y/N': 'green_energy_generation_yn',
  'Affidavit': 'affidavit',
  'Expire/Renewal Date': 'expire_renewal_date',
  'FCHR Website Y/N': 'fchr_website_yn',
  'Condo Fee': 'condo_fee',
  'Monthly Condo Fee': 'condo_fee_monthly',
  'Master Assn Ph': 'master_assn_phone',
  'Other Fee': 'other_fee',
  'Housing for Older Per': 'housing_for_older_persons',
  'Additional Rooms': 'additional_rooms',
  'Room Type': 'room_type',
  'Approx Dim': 'approximate_dimensions',
  'Closet Type': 'closet_type',
  'Features': 'room_features',
  'Other Structures': 'other_structures',
  'Other Equipment': 'other_equipment',
  'Pool Dimensions': 'pool_dimensions',
  'Farm Type': 'farm_type',
  '# of Wells': 'number_of_wells',
  '# of Septics': 'number_of_septics',
};

// Helper to normalize field names for matching
function normalizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Detect source type based on extracted field names
function detectSourceType(rawFields: Record<string, any>): 'stellar_mls' | 'zillow' | 'realtor' | 'redfin' | 'unknown' {
  const fieldNames = Object.keys(rawFields).map(k => k.toLowerCase());
  const fieldNamesJoined = fieldNames.join(' ');

  // Stellar MLS indicators (from CustomerFull PDF)
  const stellarMLSIndicators = [
    'subdiv', 'adom', 'cdom', 'bldg name', 'floor #', 'ext construction',
    'heated area', 'total annual assoc fees', 'hoa / comm assn',
    'legal desc', 'se/tp/rg', 'tax id', 'homestead', 'cdd',
    'flooring covering', 'interior feat', 'ext features', 'appliances incl'
  ];

  // Zillow indicators
  const zillowIndicators = [
    'zestimate', 'rent zestimate', 'zillow home id', 'zillow url',
    'zillow estimate', 'home value', 'property taxes'
  ];

  // Realtor.com indicators
  const realtorIndicators = [
    'realtor listing id', 'realtor.com', 'property history',
    'listing courtesy', 'mls information'
  ];

  // Redfin indicators
  const redfinIndicators = [
    'redfin estimate', 'redfin listing', 'hot home', 'redfin'
  ];

  // Count matches
  let stellarCount = stellarMLSIndicators.filter(ind => fieldNamesJoined.includes(ind)).length;
  let zillowCount = zillowIndicators.filter(ind => fieldNamesJoined.includes(ind)).length;
  let realtorCount = realtorIndicators.filter(ind => fieldNamesJoined.includes(ind)).length;
  let redfinCount = redfinIndicators.filter(ind => fieldNamesJoined.includes(ind)).length;

  // Return highest match (Stellar MLS is most likely for PDF uploads)
  if (stellarCount >= 3) return 'stellar_mls';
  if (zillowCount >= 2) return 'zillow';
  if (realtorCount >= 2) return 'realtor';
  if (redfinCount >= 2) return 'redfin';

  // Default to stellar_mls for PDF uploads since that's the primary use case
  return 'stellar_mls';
}

// Map raw extracted fields to our schema
function mapFieldsToSchema(rawFields: Record<string, any>): { fields: Record<string, any>; sourceType: string; mappedCount: number; unmappedCount: number } {
  const mappedFields: Record<string, any> = {};
  let mappedCount = 0;
  let unmappedCount = 0;

  // Detect source type
  const sourceType = detectSourceType(rawFields);
  const sourceName = sourceType === 'stellar_mls' ? 'Stellar MLS PDF' :
                     sourceType === 'zillow' ? 'Zillow' :
                     sourceType === 'realtor' ? 'Realtor.com' :
                     sourceType === 'redfin' ? 'Redfin' : 'MLS PDF';

  // ================================================================
  // PRE-PROCESSING: Handle compound fields before mapping
  // ================================================================

  // Handle "Baths" field formatted as "2/0" (full/half)
  if (rawFields['Baths'] && typeof rawFields['Baths'] === 'string' && rawFields['Baths'].includes('/')) {
    const bathParts = rawFields['Baths'].split('/');
    const fullBaths = parseInt(bathParts[0]?.trim() || '0');
    const halfBaths = parseInt(bathParts[1]?.trim() || '0');
    if (!isNaN(fullBaths) && !rawFields['Full Baths']) {
      rawFields['Full Baths'] = fullBaths;
      console.log(`[PDF PARSER] Split Baths "${rawFields['Baths']}" → Full: ${fullBaths}, Half: ${halfBaths}`);
    }
    if (!isNaN(halfBaths) && !rawFields['Half Baths']) {
      rawFields['Half Baths'] = halfBaths;
    }
  }

  // Handle Pool field - supports combinations like "Private + Community"
  // Field 55 is now multiselect, can contain: "In-ground, Community"
  if (rawFields['Pool']) {
    const poolValue = String(rawFields['Pool']).trim().toLowerCase();
    const poolTypes: string[] = [];

    // Check for community pool
    if (poolValue.includes('community')) {
      poolTypes.push('Community');
    }

    // Check for private pool types (order matters for specificity)
    if (poolValue.includes('in-ground') && poolValue.includes('heated')) {
      poolTypes.push('In-ground Heated');
    } else if (poolValue.includes('in-ground') || poolValue.includes('inground')) {
      poolTypes.push('In-ground');
    } else if (poolValue.includes('above-ground') || poolValue.includes('aboveground')) {
      poolTypes.push('Above-ground');
    } else if (poolValue.includes('private') && !poolTypes.includes('In-ground') && !poolTypes.includes('Above-ground')) {
      // Generic "Private" without specific type - default to in-ground
      poolTypes.push('In-ground');
    }

    // Set fields based on what we found
    if (poolTypes.length > 0) {
      rawFields['Pool Y/N'] = 'Yes';
      // Use existing Pool Type if already set, otherwise set from our detection
      if (!rawFields['Pool Type']) {
        rawFields['Pool Type'] = poolTypes.join(', ');
        console.log(`[PDF PARSER] Pool "${rawFields['Pool']}" → Pool Y/N: Yes, Pool Type: ${rawFields['Pool Type']}`);
      }
    } else if (poolValue === 'yes') {
      // Generic "Yes" with no type specified
      rawFields['Pool Y/N'] = 'Yes';
      console.log(`[PDF PARSER] Pool "Yes" → Pool Y/N: Yes`);
    }
  }

  // Also check Community Features for pool (in case Pool field wasn't explicit)
  if (rawFields['Community Features']) {
    const communityFeats = String(rawFields['Community Features']).toLowerCase();
    if (communityFeats.includes('pool')) {
      // Community has pool amenity
      if (!rawFields['Pool Y/N'] || rawFields['Pool Y/N'] === 'No') {
        rawFields['Pool Y/N'] = 'Yes';
        rawFields['Pool Type'] = 'Community';
        console.log(`[PDF PARSER] Community Features includes Pool → Pool Y/N: Yes, Pool Type: Community`);
      } else if (rawFields['Pool Type'] && !rawFields['Pool Type'].toLowerCase().includes('community')) {
        // Has private pool already, add community
        rawFields['Pool Type'] = rawFields['Pool Type'] + ', Community';
        console.log(`[PDF PARSER] Community Features includes Pool → Added Community to Pool Type: ${rawFields['Pool Type']}`);
      }
    }
  }

  // Handle "Recent:" field (listing date with status like "11/22/2025 : NEW")
  if (rawFields['Recent:'] || rawFields['Recent']) {
    const recentValue = String(rawFields['Recent:'] || rawFields['Recent']);
    // Extract just the date part if it has " : " separator
    const datePart = recentValue.split(':')[0]?.trim();
    if (datePart && !rawFields['List Date']) {
      rawFields['List Date'] = datePart;
      console.log(`[PDF PARSER] Recent "${recentValue}" → List Date: ${datePart}`);
    }
  }

  // Handle "Floors in Unit/Home" text numbers (e.g., "One" → 1)
  if (rawFields['Floors in Unit/Home']) {
    const textNumber = String(rawFields['Floors in Unit/Home']).trim().toLowerCase();
    const numberMap: Record<string, number> = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };
    if (numberMap[textNumber] !== undefined && !rawFields['Stories']) {
      rawFields['Stories'] = numberMap[textNumber];
      console.log(`[PDF PARSER] Floors in Unit/Home "${rawFields['Floors in Unit/Home']}" → Stories: ${numberMap[textNumber]}`);
    }
  }

  // Extract ZIP code from Address if not provided separately
  if (!rawFields['Zip'] && !rawFields['ZIP'] && !rawFields['Zip Code'] && rawFields['Address']) {
    const zipMatch = String(rawFields['Address']).match(/(\d{5})(?:-\d{4})?/);
    if (zipMatch) {
      rawFields['Zip'] = zipMatch[1];
      console.log(`[PDF PARSER] Extracted ZIP "${zipMatch[1]}" from Address`);
    }
  }

  // Handle "Assigned Spcs" for parking total
  if (rawFields['Assigned Spcs'] && !rawFields['Parking Total']) {
    rawFields['Parking Total'] = rawFields['Assigned Spcs'];
    console.log(`[PDF PARSER] Assigned Spcs "${rawFields['Assigned Spcs']}" → Parking Total`);
  }

  // ================================================================
  // FIELD MAPPING: Map raw fields to numbered schema
  // ================================================================

  for (const [rawKey, value] of Object.entries(rawFields)) {
    // Skip null/empty values
    if (value === null || value === undefined || value === '' || value === 'N/A' || value === 'n/a') {
      continue;
    }

    // Try exact match first
    let schemaKey = MLS_FIELD_MAPPING[rawKey];

    // Try case-insensitive match
    if (!schemaKey) {
      for (const [mlsKey, sKey] of Object.entries(MLS_FIELD_MAPPING)) {
        if (normalizeFieldName(mlsKey) === normalizeFieldName(rawKey)) {
          schemaKey = sKey;
          break;
        }
      }
    }

    // If we found a mapping, add to result
    if (schemaKey) {
      let finalValue = value;
      
      // Handle HOA fee conversion: monthly → annual
      if (schemaKey === '31_hoa_fee_annual') {
        // Check if this is a monthly field that needs conversion
        if (MONTHLY_HOA_FIELDS.has(rawKey)) {
          const annualValue = convertMonthlyHoaToAnnual(value);
          if (annualValue !== null) {
            finalValue = annualValue;
            console.log(`[PDF PARSER] Converted monthly HOA $${value} to annual $${annualValue}`);
          }
        }
        // If it's already annual (e.g., 'HOA Annual', 'Total Annual Assoc Fees'), keep as is
      }
      
      mappedFields[schemaKey] = {
        value: finalValue,
        source: sourceName,
        confidence: 'High',
      };
      mappedCount++;
    } else {
      // Keep unmapped fields with original key (might be useful)
      const cleanKey = rawKey.toLowerCase().replace(/\s+/g, '_');
      mappedFields[cleanKey] = {
        value: value,
        source: sourceName,
        confidence: 'Medium',
      };
      unmappedCount++;
    }
  }

  return { fields: mappedFields, sourceType, mappedCount, unmappedCount };
}

// Parse PDF using Claude's vision capability
// Model options:
// - claude-opus-4-20250514: Highest accuracy, slower, more expensive (~4x Sonnet cost)
// - claude-sonnet-4-20250514: Fast, good accuracy, cost-effective
async function parsePdfWithClaude(pdfBase64: string, useOpus: boolean = true): Promise<Record<string, any>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  // Use Opus by default for maximum accuracy (user is not worried about cost)
  // Can be overridden with:
  // 1. Function parameter: useOpus=false
  // 2. Environment variable: PDF_PARSER_MODEL=sonnet
  const envModel = process.env.PDF_PARSER_MODEL?.toLowerCase();
  const shouldUseOpus = envModel === 'sonnet' ? false : (envModel === 'opus' ? true : useOpus);

  const model = shouldUseOpus ? 'claude-opus-4-20250514' : 'claude-sonnet-4-20250514';
  console.log(`[PDF PARSER] Using model: ${model} (Opus=${shouldUseOpus})`);

  const prompt = `You are a Stellar MLS data extraction expert. Extract EVERY SINGLE field and value from this Stellar MLS CustomerFull PDF sheet.

CRITICAL INSTRUCTIONS:
1. **Extract ALL fields** - Do not limit to the examples below. Include EVERY field you see in the PDF.
2. **Use EXACT field names** as they appear in the Stellar MLS PDF (including special characters, spaces, and punctuation).
3. **Include blank/empty fields** - If a field exists but has no value, include it with empty string or null.
4. **Preserve exact values** - Do not convert or interpret values:
   - Pool: "Community" → keep as "Community" (not "Yes")
   - Baths: "2/0" → keep as "2/0" (do not convert to number)
   - Garage: "No" → keep as "No"

**Special Field Handling:**

For **"Baths"** field formatted as "X/Y" (e.g., "2/0"):
- Extract as "Baths": "2/0"
- ALSO extract separately as:
  - "Full Baths": 2 (number before slash)
  - "Half Baths": 0 (number after slash)

For **"Recent:"** field (shows listing date like "11/22/2025 : NEW"):
- Extract as "Recent": "11/22/2025 : NEW"

For **"Floors in Unit/Home"** field (e.g., "One"):
- Extract the EXACT text value as written: "Floors in Unit/Home": "One"

For **"Assigned Spcs"** field (parking spaces):
- Extract as: "Assigned Spcs": 2

For **"Subdiv/Condo"** field (may be blank):
- Extract as: "Subdiv/Condo": "" (or the actual value if present)

For **WATERFRONT fields** (CRITICAL - DO NOT MISS THESE):
- Look for "Water Frontage", "Waterfront", "Water Front" fields → Extract as "Water Frontage": "Yes" or "No"
- Look for "Waterfront Ft", "Waterfront Feet", "Water Frontage Feet" → Extract as "Waterfront Ft": 100 (number value)
- Look for "Water Access", "WaterAccess" → Extract as "Water Access": "Yes" or "No"
- Look for "Water View", "WaterView" → Extract as "Water View": "Yes" or "No"
- Look for "Water Name", "Water Body", "Body of Water" → Extract as "Water Name": "Tampa Bay" (text value)
- These fields may appear in different sections - check Land/Site section, Property Details section, or any "Waterfront" section

**Sections to Extract From:**
- Header section (MLS#, Address, County, Status, List Price, Subdiv, Beds, Baths, Year Built, Property Style, Pool, ADOM, CDOM, etc.)
- Land, Site, and Tax Information (Legal Desc, Tax ID, Taxes, Homestead, CDD, Flood Zone, Floor #, Total # of Floors, Bldg Name/#, Floors in Unit/Home, etc.)
- Interior Information (A/C, Heat/Fuel, Flooring Covering, Laundry Features, Fireplace, Interior Feat, Appliances Incl, etc.)
- Exterior Information (Ext Construction, Roof, Foundation, Ext Features, Pool Features, etc.)
- Community Information (Community Features, Fee Includes, HOA Fee, Monthly HOA Amount, Pet Size, Max Pet Wt, Lease Restrictions, etc.)
- Green Features (Green Energy Generation Y/N, etc.)
- Property Description (the long marketing text at the top)
- ANY other sections or fields present

**Extract fields even if they appear to be blank or "N/A" in the PDF.**

Return a JSON object with EVERY field found, using the exact field names from the PDF.

Example output format:
{
  "MLS#": "TB8449505",
  "Address": "3200 GULF BLVD, #203, ST PETE BEACH, FL 33706",
  "County": "Pinellas",
  "Status": "Active",
  "Subdiv": "MARINA BAY OF ST PETERSBURG BEACH",
  "List Price": 1285000,
  "Beds": 3,
  "Baths": "2/0",
  "Year Built": 1982,
  "Property Style": "Condominium",
  "Pool": "Community",
  "ADOM": 8,
  "CDOM": 8,
  "Heated Area": 1345,
  "Total Area": 1345,
  "LP/SqFt": 955.39,
  "Carport": "Yes",
  "Carport Spcs": 2,
  "Garage/Parking Features": "Assigned Parking, Covered Parking, Ground Level, Guest Parking",
  "Assigned Spcs": 2,
  "Total Annual Assoc Fees": 13764.00,
  "Tax ID": "07-32-16-55250-100-2030",
  "Taxes": 11220,
  "Tax Year": 2024,
  "Homestead": "Yes",
  "CDD": "No",
  "Front Exposure": "South",
  "Floor #": 3,
  "Total # of Floors": 4,
  "Bldg Name/#": "100",
  "Floors in Unit/Home": "One",
  "Water Frontage": "No",
  "Waterfront Ft": 0,
  "Water Access": "No",
  "Water View": "No",
  "A/C": "Central Air",
  "Heat/Fuel": "Central",
  "Flooring Covering": "Luxury Vinyl, Tile, Wood",
  "Fireplace": "No",
  "Ext Construction": "Block, Stucco",
  "Roof": "Built-Up",
  "Foundation": "Stilt/On Piling",
  "Interior Feat": "Cathedral Ceiling(s), Primary Bedroom Main Floor, Walk-In Closet(s)",
  "Appliances Incl": "Dishwasher, Dryer, Range, Refrigerator, Washer",
  "Ext Features": "Balcony, Outdoor Shower, Sidewalk, Sliding Doors",
  "Community Features": "Association Recreation - Owned, Buyer Approval Required, Deed Restrictions, Golf Carts OK, Pool, Sidewalk",
  "Fee Includes": "Community Pool, Escrow Reserves Fund, Maintenance Exterior, Maintenance Grounds, Pool Maintenance, Sewer, Trash, Water",
  "HOA / Comm Assn": "Yes",
  "HOA Fee": 1147,
  "Monthly HOA Amount": 1147,
  "Pet Size": "Small (16-35 Lbs.)",
  "Max Pet Wt": 35,
  "Can Property be Leased": "Yes",
  "Building Elevator Y/N": "No",
  "Association Approval Required": "Yes",
  "Lease Restrictions": "Yes",
  "Minimum Lease Period": "3 Months",
  "Flood Zone": "AE",
  "Legal Desc": "MARINA BAY OF ST PETERSBURG BEACH CONDO BLDG 100, UNIT 203"
}

Return ONLY the JSON object, no markdown or explanation.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: pdfBase64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[PDF PARSER] Claude API error:', response.status, errorData);
      throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('[PDF PARSER] Claude response received');

    if (data.content?.[0]?.text) {
      const text = data.content[0].text;

      // Try to extract JSON from response
      let jsonStr = text;

      // Remove markdown code blocks if present
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      // Use safe JSON parsing with extraction
      const parseResult = extractAndParseJson<Record<string, any>>(jsonStr, 'PDF PARSER');
      if (parseResult.success && parseResult.data) {
        console.log('[PDF PARSER] Extracted', Object.keys(parseResult.data).length, 'raw fields');
        return parseResult.data;
      }
    }

    throw new Error('Failed to parse Claude response');
  } catch (error) {
    console.error('[PDF PARSER] Error:', error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pdfBase64, filename } = req.body;

  if (!pdfBase64) {
    return res.status(400).json({ error: 'PDF data required' });
  }

  console.log('[PDF PARSER] Processing:', filename || 'unnamed.pdf');

  try {
    // Parse PDF with Claude (Opus 4 by default, with Sonnet fallback on timeout)
    let rawFields: Record<string, any>;

    try {
      console.log('[PDF PARSER] Attempting with Claude Opus 4 (max accuracy)...');
      rawFields = await parsePdfWithClaude(pdfBase64, true); // useOpus=true
    } catch (opusError: any) {
      // If Opus times out or fails, automatically fall back to faster Sonnet
      console.warn('[PDF PARSER] Opus failed, falling back to Sonnet:', opusError.message);
      console.log('[PDF PARSER] Retrying with Claude Sonnet 4 (faster)...');
      rawFields = await parsePdfWithClaude(pdfBase64, false); // useOpus=false
    }

    // Map to our schema with source detection
    const { fields: mappedFields, sourceType, mappedCount, unmappedCount } = mapFieldsToSchema(rawFields);

    const sourceName = sourceType === 'stellar_mls' ? 'Stellar MLS PDF' :
                       sourceType === 'zillow' ? 'Zillow' :
                       sourceType === 'realtor' ? 'Realtor.com' :
                       sourceType === 'redfin' ? 'Redfin' : 'MLS PDF';

    console.log(`[PDF PARSER] Source detected: ${sourceName}`);
    console.log(`[PDF PARSER] Mapped ${mappedCount} fields, ${unmappedCount} unmapped`);

    return res.status(200).json({
      success: true,
      fields: mappedFields,
      rawFieldCount: Object.keys(rawFields).length,
      mappedFieldCount: mappedCount,
      unmappedFieldCount: unmappedCount,
      sourceType: sourceType,
      source: sourceName,
    });
  } catch (error) {
    console.error('[PDF PARSER] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse PDF',
      fields: {},
      sourceType: 'unknown',
      source: 'Unknown',
    });
  }
}
