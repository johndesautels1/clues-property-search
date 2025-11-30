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

// MLS field mapping: Maps common MLS field names to our numbered schema
const MLS_FIELD_MAPPING: Record<string, string> = {
  // Address & Identity
  'Address': '1_full_address',
  'Full Address': '1_full_address',
  'Property Address': '1_full_address',
  'MLS#': '2_mls_primary',
  'MLS Number': '2_mls_primary',
  'Listing ID': '2_mls_primary',
  'Status': '4_listing_status',
  'Listing Status': '4_listing_status',
  'List Date': '5_listing_date',
  'Original List Date': '5_listing_date',
  'List Price': '7_listing_price',
  'Listing Price': '7_listing_price',
  'Current Price': '7_listing_price',
  'Price': '7_listing_price',
  'Price/SqFt': '8_price_per_sqft',
  '$/SqFt': '8_price_per_sqft',

  // Property Details
  'Bedrooms': '12_bedrooms',
  'Beds': '12_bedrooms',
  'BR': '12_bedrooms',
  'Bedrooms Total': '12_bedrooms',
  'Full Baths': '13_full_bathrooms',
  'Full Bathrooms': '13_full_bathrooms',
  'Half Baths': '14_half_bathrooms',
  'Half Bathrooms': '14_half_bathrooms',
  'Total Baths': '15_total_bathrooms',
  'Bathrooms Total': '15_total_bathrooms',
  'Baths': '15_total_bathrooms',
  'Living Area': '16_living_sqft',
  'Living SqFt': '16_living_sqft',
  'Heated SqFt': '16_living_sqft',
  'Interior SqFt': '16_living_sqft',
  'Total SqFt': '17_total_sqft_under_roof',
  'Total Area': '17_total_sqft_under_roof',
  'Lot Size': '18_lot_size_sqft',
  'Lot SqFt': '18_lot_size_sqft',
  'Lot Acres': '19_lot_size_acres',
  'Lot Size Acres': '19_lot_size_acres',
  'Year Built': '20_year_built',
  'Built': '20_year_built',
  'Property Type': '21_property_type',
  'Type': '21_property_type',
  'Property Sub Type': '21_property_type',
  'Stories': '22_stories',
  'Floors': '22_stories',
  'Garage Spaces': '23_garage_spaces',
  'Garage': '23_garage_spaces',
  'Parking Spaces': '24_parking_total',
  'Total Parking': '24_parking_total',

  // HOA & Fees
  'HOA': '25_hoa_yn',
  'HOA Y/N': '25_hoa_yn',
  'HOA Fee': '26_hoa_fee_annual',
  'HOA Monthly': '26_hoa_fee_annual',
  'HOA Annual': '26_hoa_fee_annual',
  'HOA Name': '70_hoa_name',
  'Association Name': '70_hoa_name',
  'HOA Includes': '71_hoa_includes',
  'Association Fee Includes': '71_hoa_includes',

  // Tax & Assessment
  'County': '28_county',
  'Taxes': '29_annual_taxes',
  'Annual Taxes': '29_annual_taxes',
  'Tax Amount': '29_annual_taxes',
  'Tax Year': '30_tax_year',
  'Assessed Value': '31_assessed_value',
  'Tax Assessed Value': '31_assessed_value',
  'Parcel ID': '6_parcel_id',
  'Parcel Number': '6_parcel_id',
  'Tax ID': '6_parcel_id',

  // Structural
  'Roof': '36_roof_type',
  'Roof Type': '36_roof_type',
  'Roofing': '36_roof_type',
  'Exterior': '38_exterior_material',
  'Exterior Material': '38_exterior_material',
  'Ext Construction': '38_exterior_material',
  'Construction': '38_exterior_material',
  'Foundation': '39_foundation',
  'Foundation Type': '39_foundation',
  'HVAC': '40_hvac_type',
  'Heating': '40_hvac_type',
  'Cooling': '40_hvac_type',
  'Flooring': '42_flooring_type',
  'Floor': '42_flooring_type',
  'Kitchen': '43_kitchen_features',
  'Kitchen Features': '43_kitchen_features',
  'Appliances': '44_appliances_included',
  'Appliances Included': '44_appliances_included',
  'Fireplace': '45_fireplace_yn',
  'Fireplace Y/N': '45_fireplace_yn',
  'Pool': '47_pool_yn',
  'Pool Y/N': '47_pool_yn',
  'Pool Type': '48_pool_type',
  'Pool Features': '48_pool_type',

  // Schools
  'Elementary School': '56_assigned_elementary',
  'Elementary': '56_assigned_elementary',
  'Middle School': '59_assigned_middle',
  'Middle': '59_assigned_middle',
  'High School': '62_assigned_high',
  'High': '62_assigned_high',
  'School District': '65_school_district',
  'District': '65_school_district',

  // Location
  'City': 'city',
  'State': 'state',
  'Zip': 'zip_code',
  'Zip Code': 'zip_code',
  'ZIP': 'zip_code',
  'Postal Code': 'zip_code',
  'Neighborhood': '27_neighborhood',
  'Subdivision': '149_subdivision_name',
  'Subdivision Name': '149_subdivision_name',

  // Stellar MLS Specific Fields (139-168)
  'Carport': '139_carport_yn',
  'Carport Y/N': '139_carport_yn',
  'Carport Spaces': '140_carport_spaces',
  'Garage Attached': '141_garage_attached_yn',
  'Attached Garage': '141_garage_attached_yn',
  'Parking Features': '142_parking_features',
  'Assigned Parking': '143_assigned_parking_spaces',
  'Floor Number': '144_floor_number',
  'Floor': '144_floor_number',
  'Unit Floor': '144_floor_number',
  'Building Floors': '145_building_total_floors',
  'Total Floors': '145_building_total_floors',
  'Building Name': '146_building_name_number',
  'Building Number': '146_building_name_number',
  'Elevator': '147_building_elevator_yn',
  'Elevator Y/N': '147_building_elevator_yn',
  'Floors In Unit': '148_floors_in_unit',
  'Legal Description': '150_legal_description',
  'Legal': '150_legal_description',
  'Homestead': '151_homestead_yn',
  'Homestead Y/N': '151_homestead_yn',
  'CDD': '152_cdd_yn',
  'CDD Y/N': '152_cdd_yn',
  'CDD Fee': '153_annual_cdd_fee',
  'Annual CDD': '153_annual_cdd_fee',
  'Front Exposure': '154_front_exposure',
  'Exposure': '154_front_exposure',
  'Direction Faces': '154_front_exposure',
  'Waterfront': '155_water_frontage_yn',
  'Waterfront Y/N': '155_water_frontage_yn',
  'Water Frontage': '155_water_frontage_yn',
  'Waterfront Feet': '156_waterfront_feet',
  'Water Feet': '156_waterfront_feet',
  'Frontage Feet': '156_waterfront_feet',
  'Water Access': '157_water_access_yn',
  'Water Access Y/N': '157_water_access_yn',
  'Water View': '158_water_view_yn',
  'Water View Y/N': '158_water_view_yn',
  'Water Body': '159_water_body_name',
  'Water Name': '159_water_body_name',
  'Body of Water': '159_water_body_name',
  'Lease': '160_can_be_leased_yn',
  'Can Be Leased': '160_can_be_leased_yn',
  'Lease Allowed': '160_can_be_leased_yn',
  'Minimum Lease': '161_minimum_lease_period',
  'Min Lease': '161_minimum_lease_period',
  'Lease Period': '161_minimum_lease_period',
  'Lease Restrictions': '162_lease_restrictions_yn',
  'Pet Size': '163_pet_size_limit',
  'Pet Limit': '163_pet_size_limit',
  'Max Pet Weight': '164_max_pet_weight',
  'Pet Weight': '164_max_pet_weight',
  'Association Approval': '165_association_approval_yn',
  'HOA Approval': '165_association_approval_yn',
  'Community Features': '166_community_features',
  'Community Amenities': '166_community_features',
  'Interior Features': '167_interior_features',
  'Interior': '167_interior_features',
  'Exterior Features': '168_exterior_features',

  // Financial
  'Days on Market': '83_days_on_market_avg',
  'DOM': '83_days_on_market_avg',
  'CDOM': '83_days_on_market_avg',
  'Zestimate': '9_market_value_estimate',
  'Estimated Value': '9_market_value_estimate',
};

// Helper to normalize field names for matching
function normalizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Map raw extracted fields to our schema
function mapFieldsToSchema(rawFields: Record<string, any>): Record<string, any> {
  const mappedFields: Record<string, any> = {};

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
        source: 'MLS PDF',
        confidence: 'High',
      };
    } else {
      // Keep unmapped fields with original key (might be useful)
      const cleanKey = rawKey.toLowerCase().replace(/\s+/g, '_');
      mappedFields[cleanKey] = {
        value: value,
        source: 'MLS PDF',
        confidence: 'Medium',
      };
    }
  }

  return mappedFields;
}

// Parse PDF using Claude's vision capability
async function parsePdfWithClaude(pdfBase64: string): Promise<Record<string, any>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const prompt = `You are a real estate data extraction expert. I'm providing you with a Stellar MLS property data sheet PDF.

Please extract ALL property information from this PDF into a JSON object. Extract every field you can find, including:

1. **Address & Identity**: Full address, MLS number, listing status, list date, list price
2. **Property Details**: Bedrooms, bathrooms (full/half), living sqft, lot size, year built, property type, stories
3. **HOA & Fees**: HOA y/n, HOA fee (monthly/annual), HOA name, what HOA includes
4. **Tax Info**: Annual taxes, tax year, assessed value, parcel ID, county
5. **Structural**: Roof type, exterior material, construction, foundation, HVAC, flooring, kitchen features, appliances, fireplace, pool
6. **Schools**: Elementary, middle, high school names and ratings
7. **Location**: City, state, zip, neighborhood, subdivision
8. **Parking**: Carport y/n, carport spaces, garage attached, garage spaces, parking features
9. **Building (for condos)**: Floor number, building total floors, building name, elevator y/n, floors in unit
10. **Legal**: Legal description, homestead y/n, CDD y/n, CDD fee
11. **Waterfront**: Waterfront y/n, waterfront feet, water access, water view, water body name
12. **Leasing**: Can be leased, minimum lease period, lease restrictions, pet policy, max pet weight, association approval required
13. **Features**: Community features, interior features, exterior features, view type

Return ONLY a valid JSON object with field names as keys and extracted values. Use the exact field names from the PDF when possible.

Example format:
{
  "Address": "3200 Gulf Blvd #203",
  "City": "St Pete Beach",
  "State": "FL",
  "Zip": "33706",
  "MLS#": "TB123456",
  "List Price": 549000,
  "Bedrooms": 2,
  "Full Baths": 2,
  "Living Area": 1426,
  "Year Built": 1971,
  "Waterfront": "Yes",
  ...
}

Return ONLY the JSON object, no markdown formatting or explanation.`;

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

    // Map to our schema
    const mappedFields = mapFieldsToSchema(rawFields);

    console.log('[PDF PARSER] Mapped', Object.keys(mappedFields).length, 'fields to schema');

    return res.status(200).json({
      success: true,
      fields: mappedFields,
      rawFieldCount: Object.keys(rawFields).length,
      mappedFieldCount: Object.keys(mappedFields).length,
      source: 'MLS PDF',
    });
  } catch (error) {
    console.error('[PDF PARSER] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse PDF',
      fields: {},
    });
  }
}
