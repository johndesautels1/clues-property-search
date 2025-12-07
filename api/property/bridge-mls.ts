/**
 * Bridge Interactive MLS API Endpoint
 * Fetches property data from Bridge Interactive RESO Web API
 * Maps to CLUES 168-field schema
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createBridgeAPIClient, type BridgePropertySearchParams } from '../../src/lib/bridge-api-client.js';
import { mapBridgePropertyToSchema, extractExtendedMLSData } from '../../src/lib/bridge-field-mapper.js';
import { STELLAR_MLS_SOURCE } from './source-constants.js';

// Vercel serverless config
export const config = {
  maxDuration: 180, // 3 minutes - must exceed STELLAR_MLS_TIMEOUT (90s) in search.ts to prevent premature kills
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('========================================');
    console.log('[Bridge MLS API] ENDPOINT CALLED');
    console.log('========================================');

    // Get search parameters from request
    const params: BridgePropertySearchParams = req.method === 'POST' ? req.body : req.query;

    console.log('[Bridge MLS API] Search params:', params);

    // Validate required parameters
    if (!params.address && !params.mlsNumber && !params.zipCode && !params.city) {
      console.log('[Bridge MLS API] ERROR: No search parameters provided');
      return res.status(400).json({
        success: false,
        error: 'At least one search parameter required: address, mlsNumber, zipCode, or city',
      });
    }

    // Create Bridge API client
    console.log('[Bridge MLS API] Creating Bridge API client...');
    const client = createBridgeAPIClient();
    console.log('[Bridge MLS API] Client created successfully');

    // Search for properties
    let response;
    if (params.mlsNumber) {
      console.log('[Bridge MLS API] Searching by MLS number:', params.mlsNumber);
      const property = await client.getPropertyByMLS(params.mlsNumber);
      response = property ? { value: [property], '@odata.count': 1, '@odata.context': '' } : { value: [], '@odata.count': 0, '@odata.context': '' };
    } else if (params.address) {
      console.log('[Bridge MLS API] Searching by address:', params.address);
      const property = await client.getPropertyByAddress(params.address, params.city, params.state, params.zipCode);
      response = property ? { value: [property], '@odata.count': 1, '@odata.context': '' } : { value: [], '@odata.count': 0, '@odata.context': '' };
    } else {
      console.log('[Bridge MLS API] Searching with filters');
      response = await client.searchProperties(params);
    }

    if (!response || response.value.length === 0) {
      console.log('[Bridge MLS API] No properties found');
      return res.status(404).json({
        success: false,
        error: 'No properties found matching search criteria',
        results: [],
        totalCount: 0,
      });
    }

    console.log(`[Bridge MLS API] Found ${response.value.length} properties`);

    // Fetch Media separately for each property if Media is empty
    for (const property of response.value) {
      if (!property.Media || property.Media.length === 0) {
        const listingKey = property.ListingKey || property.ListingId;
        if (listingKey) {
          console.log(`[Bridge MLS] Property has no Media, fetching separately for ListingKey: ${listingKey}`);
          try {
            const media = await client.getPropertyMedia(listingKey);
            if (media && media.length > 0) {
              property.Media = media;
              console.log(`[Bridge MLS] ✅ Fetched ${media.length} photos separately`);
            }
          } catch (error) {
            console.log(`[Bridge MLS] Failed to fetch Media separately:`, error);
          }
        }
      }
    }

    // Map properties to CLUES schema
    const mappedProperties = response.value.map(property => {
      const mapped = mapBridgePropertyToSchema(property);

      // Extract extended MLS data (not part of 168-field schema)
      const extendedData = extractExtendedMLSData(property);
      const extendedFieldCount = Object.keys(extendedData).length;

      // Log unmapped data warning
      if (mapped.unmappedCount > 0) {
        console.log(`⚠️ [Bridge MLS] ${mapped.unmappedCount} fields from MLS not mapped to schema`);
        console.log(`✅ [Bridge MLS] ${mapped.mappedCount} fields successfully mapped`);
      }
      if (extendedFieldCount > 0) {
        console.log(`✅ [Bridge MLS] ${extendedFieldCount} extended fields extracted`);
      }

      // Add extended data to fields as special field (not numbered)
      const fieldsWithExtended = {
        ...mapped.fields,
        '_extendedMLSData': {
          value: extendedData,
          source: 'Stellar MLS',
          confidence: 'High' as const,
        },
      };

      return {
        fields: fieldsWithExtended,
        mappedCount: mapped.mappedCount,
        unmappedCount: mapped.unmappedCount,
        publicRemarks: mapped.publicRemarks,
        publicRemarksExtracted: mapped.publicRemarksExtracted,
      };
    });

    // If single result, return as primary property
    if (mappedProperties.length === 1) {
      return res.status(200).json({
        success: true,
        fields: mappedProperties[0].fields,
        mappedFieldCount: mappedProperties[0].mappedCount,
        unmappedFieldCount: mappedProperties[0].unmappedCount,
        publicRemarks: mappedProperties[0].publicRemarks,
        publicRemarksExtracted: mappedProperties[0].publicRemarksExtracted,
        source: STELLAR_MLS_SOURCE,
        sourceType: 'bridge_mls',
        totalResults: 1,
      });
    }

    // Multiple results
    return res.status(200).json({
      success: true,
      results: mappedProperties,
      totalCount: response['@odata.count'] || response.value.length,
      source: STELLAR_MLS_SOURCE,
      sourceType: 'bridge_mls',
    });

  } catch (error) {
    console.error('[Bridge MLS API] Error:', error);

    // Check for authentication errors
    if (error instanceof Error && error.message.includes('Authentication failed')) {
      return res.status(401).json({
        success: false,
        error: 'Bridge API authentication failed. Check your credentials.',
        details: error.message,
      });
    }

    // Check for API errors
    if (error instanceof Error && error.message.includes('Property search failed')) {
      return res.status(502).json({
        success: false,
        error: 'Bridge API search failed',
        details: error.message,
      });
    }

    // Generic error
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch property data from Bridge Interactive',
    });
  }
}
