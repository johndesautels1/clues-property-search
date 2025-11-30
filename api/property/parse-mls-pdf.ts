/**
 * CLUES Property Dashboard - MLS PDF Parser API
 * Extracts property data from Stellar MLS CustomerFull PDF sheets
 * Uses Claude to parse PDF content and map to 168-field schema
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel serverless config
export const config = {
  maxDuration: 120, // 2 minutes for PDF parsing
};

// MLS field mapping: Maps Stellar MLS field names to our numbered schema
// Updated based on actual CustomerFull PDF field names
const MLS_FIELD_MAPPING: Record<string, string> = {
  // ================================================================
  // ADDRESS & IDENTITY (from PDF header)
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
  'List Price': '7_listing_price',
  'Listing Price': '7_listing_price',
  'Current Price': '7_listing_price',
  'Price': '7_listing_price',
  'LP/SqFt': '8_price_per_sqft',  // Stellar MLS uses LP/SqFt
  'Price/SqFt': '8_price_per_sqft',
  '$/SqFt': '8_price_per_sqft',

  // ================================================================
  // PROPERTY DETAILS (from PDF)
  // ================================================================
  'Beds': '12_bedrooms',  // Stellar MLS uses "Beds"
  'Bedrooms': '12_bedrooms',
  'BR': '12_bedrooms',
  'Bedrooms Total': '12_bedrooms',
  'Baths': '15_total_bathrooms',  // Stellar MLS uses "Baths: 2/0" format
  'Full Baths': '13_full_bathrooms',
  'Full Bathrooms': '13_full_bathrooms',
  'Half Baths': '14_half_bathrooms',
  'Half Bathrooms': '14_half_bathrooms',
  'Total Baths': '15_total_bathrooms',
  'Bathrooms Total': '15_total_bathrooms',
  'Heated Area': '16_living_sqft',  // Stellar MLS uses "Heated Area"
  'Living Area': '16_living_sqft',
  'Living SqFt': '16_living_sqft',
  'Heated SqFt': '16_living_sqft',
  'Interior SqFt': '16_living_sqft',
  'Total Area': '17_total_sqft_under_roof',  // Stellar MLS uses "Total Area"
  'Total SqFt': '17_total_sqft_under_roof',
  'Lot Size': '18_lot_size_sqft',  // Stellar MLS has "Lot Size: 52,018 SqFt"
  'Lot SqFt': '18_lot_size_sqft',
  'Lot Size Acres': '19_lot_size_acres',  // Stellar MLS uses "Lot Size Acres"
  'Lot Acres': '19_lot_size_acres',
  'Total Acreage': '19_lot_size_acres',  // Stellar MLS also has "Total Acreage"
  'Year Built': '20_year_built',
  'Built': '20_year_built',
  'Property Style': '21_property_type',  // Stellar MLS uses "Property Style"
  'Property Type': '21_property_type',
  'Type': '21_property_type',
  'Property Sub Type': '21_property_type',
  'Stories': '22_stories',
  'Floors in Unit/Home': '148_floors_in_unit',  // Stellar MLS specific
  'Floors In Unit': '148_floors_in_unit',
  'Garage': '23_garage_spaces',
  'Garage Spaces': '23_garage_spaces',
  'Spcs': '23_garage_spaces',  // Stellar MLS uses "Spcs" for spaces
  'Parking Spaces': '24_parking_total',
  'Total Parking': '24_parking_total',
  'Assigned Spcs': '143_assigned_parking_spaces',  // Stellar MLS uses "Assigned Spcs"

  // ================================================================
  // HOA & FEES (Stellar MLS specific)
  // ================================================================
  'HOA / Comm Assn': '25_hoa_yn',  // Stellar MLS uses "HOA / Comm Assn"
  'HOA': '25_hoa_yn',
  'HOA Y/N': '25_hoa_yn',
  'HOA Fee': '26_hoa_fee_annual',
  'Monthly HOA Amount': '26_hoa_fee_annual',  // Stellar MLS uses "Monthly HOA Amount"
  'HOA Monthly': '26_hoa_fee_annual',
  'HOA Annual': '26_hoa_fee_annual',
  'Total Annual Assoc Fees': '26_hoa_fee_annual',  // Stellar MLS uses this
  'Average Monthly Fees': '26_hoa_fee_monthly',  // Stellar MLS monthly fee
  'HOA Name': '70_hoa_name',
  'Association Name': '70_hoa_name',
  'Master Assn/Name': '70_hoa_name',  // Stellar MLS format
  'Fee Includes': '71_hoa_includes',  // Stellar MLS uses "Fee Includes"
  'HOA Includes': '71_hoa_includes',
  'Association Fee Includes': '71_hoa_includes',
  'HOA Pmt Sched': 'hoa_payment_schedule',  // Stellar MLS specific

  // ================================================================
  // TAX & ASSESSMENT (Stellar MLS specific)
  // ================================================================
  'County': '28_county',
  'Taxes': '29_annual_taxes',  // Stellar MLS uses "Taxes: $11,220"
  'Annual Taxes': '29_annual_taxes',
  'Tax Amount': '29_annual_taxes',
  'Tax Year': '30_tax_year',
  'Assessed Value': '31_assessed_value',
  'Tax Assessed Value': '31_assessed_value',
  'Tax ID': '6_parcel_id',  // Stellar MLS uses "Tax ID"
  'Parcel ID': '6_parcel_id',
  'Parcel Number': '6_parcel_id',
  'Alt Key/Folio #': '6_parcel_id_alt',  // Stellar MLS alternate key

  // ================================================================
  // STRUCTURAL (Stellar MLS specific field names)
  // ================================================================
  'Roof': '36_roof_type',
  'Roof Type': '36_roof_type',
  'Roofing': '36_roof_type',
  'Ext Construction': '38_exterior_material',  // Stellar MLS uses "Ext Construction"
  'Exterior': '38_exterior_material',
  'Exterior Material': '38_exterior_material',
  'Construction': '38_exterior_material',
  'Foundation': '39_foundation',
  'Foundation Type': '39_foundation',
  'A/C': '40_hvac_type',  // Stellar MLS uses "A/C" for cooling
  'Heat/Fuel': '40_hvac_heating',  // Stellar MLS uses "Heat/Fuel"
  'HVAC': '40_hvac_type',
  'Heating': '40_hvac_heating',
  'Cooling': '40_hvac_type',
  'Flooring Covering': '42_flooring_type',  // Stellar MLS uses "Flooring Covering"
  'Flooring': '42_flooring_type',
  'Floor': '42_flooring_type',
  'Kitchen': '43_kitchen_features',
  'Kitchen Features': '43_kitchen_features',
  'Appliances Incl': '44_appliances_included',  // Stellar MLS uses "Appliances Incl"
  'Appliances': '44_appliances_included',
  'Appliances Included': '44_appliances_included',
  'Laundry Features': '44_laundry_features',  // Stellar MLS specific
  'Fireplace': '45_fireplace_yn',
  'Fireplace Y/N': '45_fireplace_yn',
  'Pool': '47_pool_yn',
  'Pool Y/N': '47_pool_yn',
  'Pool Type': '48_pool_type',
  'Pool Features': '48_pool_type',

  // ================================================================
  // SCHOOLS
  // ================================================================
  'Elementary School': '56_assigned_elementary',
  'Elementary': '56_assigned_elementary',
  'Middle School': '59_assigned_middle',
  'Middle': '59_assigned_middle',
  'High School': '62_assigned_high',
  'High': '62_assigned_high',
  'School District': '65_school_district',
  'District': '65_school_district',

  // ================================================================
  // LOCATION (Stellar MLS specific)
  // ================================================================
  'City': 'city',
  'State': 'state',
  'Zip': 'zip_code',
  'Zip Code': 'zip_code',
  'ZIP': 'zip_code',
  'Postal Code': 'zip_code',
  'Neighborhood': '27_neighborhood',
  'Subdiv': '149_subdivision_name',  // Stellar MLS uses "Subdiv"
  'Subdivision': '149_subdivision_name',
  'Subdivision Name': '149_subdivision_name',
  'SE/TP/RG': 'section_township_range',  // Stellar MLS specific
  'Zoning': 'zoning',
  'Future Land Use': 'future_land_use',

  // ================================================================
  // STELLAR MLS - PARKING (139-143)
  // ================================================================
  'Carport': '139_carport_yn',  // Stellar MLS uses "Carport: Yes"
  'Carport Y/N': '139_carport_yn',
  'Carport Spcs': '140_carport_spaces',  // Stellar MLS uses "Spcs" not "Spaces"
  'Carport Spaces': '140_carport_spaces',
  'Attch': '141_garage_attached_yn',  // Stellar MLS uses "Attch" for attached
  'Garage Attached': '141_garage_attached_yn',
  'Attached Garage': '141_garage_attached_yn',
  'Garage/Parking Features': '142_parking_features',  // Stellar MLS format
  'Parking Features': '142_parking_features',
  'Assigned Parking': '143_assigned_parking_spaces',

  // ================================================================
  // STELLAR MLS - BUILDING (144-148)
  // ================================================================
  'Floor #': '144_floor_number',  // Stellar MLS uses "Floor #"
  'Floor Number': '144_floor_number',
  'Unit Floor': '144_floor_number',
  'Total # of Floors': '145_building_total_floors',  // Stellar MLS format
  'Building Floors': '145_building_total_floors',
  'Total Floors': '145_building_total_floors',
  'Bldg Name/#': '146_building_name_number',  // Stellar MLS uses "Bldg Name/#"
  'Building Name': '146_building_name_number',
  'Building Number': '146_building_name_number',
  'Building Elevator Y/N': '147_building_elevator_yn',  // Stellar MLS format
  'Elevator': '147_building_elevator_yn',
  'Elevator Y/N': '147_building_elevator_yn',
  'Floors in Unit/Home': '148_floors_in_unit',

  // ================================================================
  // STELLAR MLS - LEGAL & TAX (149-154)
  // ================================================================
  'Legal Desc': '150_legal_description',  // Stellar MLS uses "Legal Desc"
  'Legal Description': '150_legal_description',
  'Legal': '150_legal_description',
  'Homestead': '151_homestead_yn',
  'Homestead Y/N': '151_homestead_yn',
  'CDD': '152_cdd_yn',
  'CDD Y/N': '152_cdd_yn',
  'Annual CDD Fee': '153_annual_cdd_fee',  // Stellar MLS format
  'CDD Fee': '153_annual_cdd_fee',
  'Annual CDD': '153_annual_cdd_fee',
  'Front Exposure': '154_front_exposure',
  'Exposure': '154_front_exposure',
  'Direction Faces': '154_front_exposure',

  // ================================================================
  // STELLAR MLS - WATERFRONT (155-159)
  // ================================================================
  'Water Frontage': '155_water_frontage_yn',  // Stellar MLS uses "Water Frontage:No"
  'Waterfront': '155_water_frontage_yn',
  'Waterfront Y/N': '155_water_frontage_yn',
  'Waterfront Ft': '156_waterfront_feet',  // Stellar MLS uses "Waterfront Ft"
  'Waterfront Feet': '156_waterfront_feet',
  'Water Feet': '156_waterfront_feet',
  'Frontage Feet': '156_waterfront_feet',
  'Water Access': '157_water_access_yn',
  'Water Access Y/N': '157_water_access_yn',
  'Water View': '158_water_view_yn',
  'Water View Y/N': '158_water_view_yn',
  'Water Name': '159_water_body_name',  // Stellar MLS uses "Water Name"
  'Water Body': '159_water_body_name',
  'Body of Water': '159_water_body_name',
  'Water Extras': 'water_extras',  // Stellar MLS specific
  'Addtl Water Info': 'additional_water_info',  // Stellar MLS specific

  // ================================================================
  // STELLAR MLS - LEASING & PETS (160-165)
  // ================================================================
  'Can Property be Leased': '160_can_be_leased_yn',  // Stellar MLS format
  'Can Be Leased': '160_can_be_leased_yn',
  'Lease': '160_can_be_leased_yn',
  'Lease Allowed': '160_can_be_leased_yn',
  'Minimum Lease Period': '161_minimum_lease_period',  // Stellar MLS format
  'Minimum Lease': '161_minimum_lease_period',
  'Min Lease': '161_minimum_lease_period',
  'Lease Period': '161_minimum_lease_period',
  'Lease Restrictions': '162_lease_restrictions_yn',
  'Pet Size': '163_pet_size_limit',  // Stellar MLS uses "Pet Size"
  'Pet Limit': '163_pet_size_limit',
  '# of Pets': '163_number_of_pets',  // Stellar MLS specific
  'Max Pet Wt': '164_max_pet_weight',  // Stellar MLS uses "Max Pet Wt"
  'Max Pet Weight': '164_max_pet_weight',
  'Pet Weight': '164_max_pet_weight',
  'Pet Restrictions': 'pet_restrictions',  // Stellar MLS specific
  'Association Approval Required': '165_association_approval_yn',  // Stellar MLS format
  'Association Approval': '165_association_approval_yn',
  'HOA Approval': '165_association_approval_yn',
  'Approval Process': 'approval_process',  // Stellar MLS specific
  'Years of Ownership Prior to Leasing Required': 'years_ownership_before_lease',  // Stellar MLS

  // ================================================================
  // STELLAR MLS - FEATURES (166-168)
  // ================================================================
  'Community Features': '166_community_features',
  'Community Amenities': '166_community_features',
  'Interior Feat': '167_interior_features',  // Stellar MLS uses "Interior Feat"
  'Interior Features': '167_interior_features',
  'Interior': '167_interior_features',
  'Ext Features': '168_exterior_features',  // Stellar MLS uses "Ext Features"
  'Exterior Features': '168_exterior_features',
  'Patio And Porch Features': 'patio_porch_features',  // Stellar MLS specific
  'View': 'view_type',  // Stellar MLS specific

  // ================================================================
  // FINANCIAL / DAYS ON MARKET
  // ================================================================
  'ADOM': '83_days_on_market_avg',  // Stellar MLS uses "ADOM"
  'CDOM': '83_days_on_market_cumulative',  // Stellar MLS uses "CDOM"
  'Days on Market': '83_days_on_market_avg',
  'DOM': '83_days_on_market_avg',
  'Zestimate': '9_market_value_estimate',
  'Estimated Value': '9_market_value_estimate',

  // ================================================================
  // STELLAR MLS - ADDITIONAL FIELDS
  // ================================================================
  'Ownership': 'ownership_type',  // Stellar MLS has "Ownership: Fee Simple"
  'New Construction': 'new_construction_yn',
  'Property Condition': 'property_condition',
  'Home Warranty Y/N': 'home_warranty_yn',
  'Flood Zone': '99_flood_zone',  // Map to our schema
  'Flood Zone Code': '99_flood_zone',
  'Flood Zone Date': 'flood_zone_date',
  'Flood Zone Panel': 'flood_zone_panel',
  'Utilities': 'utilities',
  'Water': 'water_source',
  'Sewer': 'sewer_type',
  'Security Feat': 'security_features',
  'Window Features': 'window_features',
  'Furnishings': 'furnishings',
  'Accessibility Features': 'accessibility_features',
  'Road Surface Type': 'road_surface',
  'Special Sale': 'special_sale_type',
  'Pets': 'pets_allowed',
  'Max Times per Yr': 'max_lease_times_per_year',
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
      mappedFields[schemaKey] = {
        value: value,
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
async function parsePdfWithClaude(pdfBase64: string): Promise<Record<string, any>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const prompt = `You are a Stellar MLS data extraction expert. Extract ALL property data from this Stellar MLS CustomerFull PDF sheet.

CRITICAL: Use the EXACT field names as they appear in the Stellar MLS PDF. Here are the standard Stellar MLS field names to look for:

**Header Section:**
- MLS# (e.g., "TB8449505")
- Address (full street address from header)
- County, Status, List Price
- Subdiv (subdivision name)
- Beds, Baths (format: "2/0" for full/half)
- Year Built, Property Style, Pool
- ADOM, CDOM (days on market)
- Pets, Minimum Lease Period
- Garage, Attch (attached), Spcs (spaces), Carport, Carport Spcs
- Garage/Parking Features, Assigned Spcs
- LP/SqFt, Heated Area, Total Area
- Flood Zone Code, Total Annual Assoc Fees, Average Monthly Fees

**Land, Site, and Tax Information:**
- Legal Desc, SE/TP/RG, Zoning
- Tax ID, Taxes, Tax Year
- Homestead, CDD, Annual CDD Fee
- Front Exposure, Lot Size Acres, Lot Size
- Water Frontage, Waterfront Ft, Water Access, Water View, Water Name
- Floor #, Total # of Floors, Bldg Name/#, Floors in Unit/Home
- Flood Zone, Flood Zone Date, Flood Zone Panel

**Interior Information:**
- A/C, Heat/Fuel, Flooring Covering
- Laundry Features, Fireplace, Furnishings
- Utilities, Water, Sewer
- Interior Feat, Appliances Incl

**Exterior Information:**
- Ext Construction, Roof, Foundation
- Ext Features, Pool, Pool Features
- Road Surface Type

**Community Information:**
- Community Features, Fee Includes
- HOA / Comm Assn, HOA Fee, HOA Pmt Sched
- Monthly HOA Amount
- Pet Size, Max Pet Wt, # of Pets
- Can Property be Leased, Building Elevator Y/N
- Association Approval Required, Lease Restrictions
- Minimum Lease Period

Extract EVERY field you can find. Return a JSON object using the EXACT field names from the PDF.

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
        model: 'claude-sonnet-4-20250514',
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

      // Find JSON object in text
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('[PDF PARSER] Extracted', Object.keys(parsed).length, 'raw fields');
        return parsed;
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
    // Parse PDF with Claude
    const rawFields = await parsePdfWithClaude(pdfBase64);

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
