/**
 * MLS-First Search Endpoint - MANUAL TAB ONLY
 *
 * Two-step process for MLS number searches:
 * 1. Call Stellar MLS (Bridge API) with MLS # to get full property data + address
 * 2. Use returned address to fire full hierarchy (TIER 2-5) via existing search endpoint
 *
 * ISOLATION: This endpoint is ONLY used by AddProperty.tsx Manual tab
 * - Does NOT affect Search Property page (uses /api/property/search)
 * - Does NOT affect other Add Property tabs (PDF, Address tabs use /api/property/search)
 * - Maintains exact same hierarchy order as search.ts
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { normalizeCity, normalizeState, normalizeZip } from '../../src/lib/address-normalizer.js';

// Vercel serverless config - MLS-first two-step search
export const config = {
  maxDuration: 300, // 5 minutes - same as search.ts
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method POST required' });
  }

  try {
    const { mls, engines } = req.body;

    if (!mls) {
      return res.status(400).json({
        error: 'MLS number required',
        success: false
      });
    }

    console.log('========================================');
    console.log('[MLS-First Search] ENDPOINT CALLED');
    console.log('========================================');
    console.log('[MLS-First Search] MLS Number:', JSON.stringify(mls));
    console.log('[MLS-First Search] MLS Type:', typeof mls);
    console.log('[MLS-First Search] MLS Length:', mls?.length);
    console.log('[MLS-First Search] Engines:', engines || 'Auto (all 6 LLMs)');

    // ========================================
    // STEP 1: Call Bridge MLS API with MLS #
    // ========================================
    console.log('');
    console.log('[MLS-First Search] STEP 1: Fetching data from Stellar MLS (Bridge API)...');

    const bridgeUrl = `${req.headers.host?.includes('localhost') ? 'http://localhost:3000' : 'https://' + req.headers.host}/api/property/bridge-mls`;

    const bridgeResponse = await fetch(bridgeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mlsNumber: mls })
    });

    if (!bridgeResponse.ok) {
      const errorText = await bridgeResponse.text();
      console.log('[MLS-First Search] ❌ Bridge MLS failed:', bridgeResponse.status, bridgeResponse.statusText);
      console.log('[MLS-First Search] ❌ Error response:', errorText);

      // Return error if MLS not found
      if (bridgeResponse.status === 404) {
        return res.status(404).json({
          error: `MLS number "${mls}" not found in Stellar MLS database. Searched in both ListingId and ListingKey fields.`,
          success: false,
          total_fields_found: 0,
          fields: {},
          field_sources: {},
          data_sources: [],
          debug: {
            mlsNumber: mls,
            searchedFields: ['ListingId', 'ListingKey']
          }
        });
      }

      throw new Error(`Bridge MLS API error: ${bridgeResponse.status} - ${errorText}`);
    }

    const bridgeData = await bridgeResponse.json();
    console.log('[MLS-First Search] ✅ Bridge MLS returned', bridgeData.mappedFieldCount || 0, 'fields');

    // Extract full address AND city/state/zip from Bridge response for validation
    const fullAddress = bridgeData.fields?.['1_full_address']?.value;
    const rawCity = bridgeData.fields?.['1_full_address']?.value?.split(',')[1]?.trim(); // Parse from full address
    const stateZip = bridgeData.fields?.['1_full_address']?.value?.split(',')[2]?.trim() || '';
    const rawState = stateZip.match(/([A-Z]{2})/)?.[1];
    const rawZip = bridgeData.fields?.['8_zip_code']?.value;

    // NORMALIZE address components to handle variations
    // - City: "St. Petersburg" vs "Saint Petersburg"
    // - State: "FL" vs "Fl" vs "Florida"
    // - Zip: "33706-1234" vs "33706"
    const city = normalizeCity(rawCity);
    const state = normalizeState(rawState);
    const zipCode = normalizeZip(rawZip);

    console.log('[MLS-First Search] 📍 Raw components:', { rawCity, rawState, rawZip });
    console.log('[MLS-First Search] 📍 Normalized components:', { fullAddress, city, state, zipCode });

    if (!fullAddress) {
      console.log('[MLS-First Search] ⚠️ WARNING: No full_address in Bridge response, proceeding with MLS data only');

      // Return just Bridge MLS data if no address found
      return res.status(200).json({
        success: true,
        total_fields_found: bridgeData.mappedFieldCount || 0,
        fields: bridgeData.fields || {},
        field_sources: { 'Stellar MLS': bridgeData.mappedFieldCount || 0 },
        data_sources: ['Stellar MLS'],
        conflicts: [],
        warning: 'Only MLS data available - no address found for additional enrichment'
      });
    }

    console.log('[MLS-First Search] 📍 Extracted full address:', fullAddress);

    // ========================================
    // STEP 2: Call existing search endpoint with address
    // This fires TIER 2-5 in exact same hierarchy order
    // ========================================
    console.log('');
    console.log('[MLS-First Search] STEP 2: Firing TIER 2-5 with full address...');
    console.log('[MLS-First Search] Calling /api/property/search with address:', fullAddress);

    const searchUrl = `${req.headers.host?.includes('localhost') ? 'http://localhost:3000' : 'https://' + req.headers.host}/api/property/search`;

    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: fullAddress,
        city: city, // CRITICAL: Pass city for validation
        state: state, // CRITICAL: Pass state for validation
        zipCode: zipCode, // CRITICAL: Pass zip for validation
        engines: engines || ['perplexity', 'claude-sonnet', 'gpt', 'claude-opus', 'gemini', 'grok'], // Default to all 6 LLMs (Sonnet first for web_search)
        skipLLMs: false,
        skipMLS: true, // CRITICAL: Skip TIER 1 (Stellar MLS) - already fetched in STEP 1
        skipApis: false // Run TIER 2-3 (Google APIs, WalkScore, SchoolDigger, FEMA, etc.)
      })
    });

    if (!searchResponse.ok) {
      console.log('[MLS-First Search] ⚠️ Search endpoint failed:', searchResponse.status);
      console.log('[MLS-First Search] Returning MLS data only');

      // Return just Bridge MLS data if search fails
      return res.status(200).json({
        success: true,
        total_fields_found: bridgeData.mappedFieldCount || 0,
        fields: bridgeData.fields || {},
        field_sources: { 'Stellar MLS': bridgeData.mappedFieldCount || 0 },
        data_sources: ['Stellar MLS'],
        conflicts: [],
        warning: 'Additional APIs failed - returning MLS data only'
      });
    }

    const searchData = await searchResponse.json();
    console.log('[MLS-First Search] ✅ Search endpoint returned', searchData.total_fields_found || 0, 'fields');

    // ========================================
    // STEP 3: Merge Bridge MLS data with search data
    // Bridge MLS (TIER 1) has highest authority, so it overwrites conflicts
    // ========================================
    console.log('');
    console.log('[MLS-First Search] STEP 3: Merging data...');

    const mergedFields = {
      ...searchData.fields, // TIER 2-5 fields first
      ...bridgeData.fields,  // TIER 1 (Bridge MLS) overwrites conflicts
    };

    const mergedSources = {
      ...searchData.field_sources,
      'Stellar MLS': bridgeData.mappedFieldCount || 0,
    };

    const mergedDataSources = [
      'Stellar MLS',
      ...(searchData.data_sources || []).filter((s: string) => s !== 'Stellar MLS')
    ];

    const totalFields = Object.keys(mergedFields).filter(k => !k.startsWith('_')).length; // Exclude metadata fields

    console.log('[MLS-First Search] ✅ COMPLETE');
    console.log('[MLS-First Search] Total fields:', totalFields);
    console.log('[MLS-First Search] Data sources:', mergedDataSources.join(', '));
    console.log('========================================');

    // Return merged response in same format as search.ts
    return res.status(200).json({
      success: true,
      total_fields_found: totalFields,
      fields: mergedFields,
      field_sources: mergedSources,
      data_sources: mergedDataSources,
      conflicts: searchData.conflicts || [],
    });

  } catch (error) {
    console.error('[MLS-First Search] ERROR:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false,
      total_fields_found: 0,
      fields: {},
      field_sources: {},
      data_sources: []
    });
  }
}
