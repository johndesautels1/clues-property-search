/**
 * API ENDPOINT: Fetch Single Field with Tavily
 *
 * Called when user clicks "🔍 Fetch with Tavily" button on PropertyDetail page
 *
 * POST /api/property/fetch-tavily-field
 * Body: { fieldId, address, city, state, zip, propertyId, propertyData }
 *
 * IMPORTANT: This endpoint is ISOLATED from the main cascade
 * Does NOT interfere with search.ts, retry-llm.ts, or existing cascade logic
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchFieldWithTavily, batchFetchFieldsWithTavily, type PropertyContext, type TavilyFieldResult } from './tavily-field-fetcher';
import { getTavilyFieldConfig } from './tavily-field-config';

// No max duration needed - individual field fetches are fast (30s max)
export const config = {
  maxDuration: 60  // 1 minute max for safety
};

interface RequestBody {
  fieldId?: number;
  fieldIds?: number[];  // For batch requests
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  propertyId?: string;
  propertyData?: Record<string, any>;  // For calculated fields
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body: RequestBody = req.body;

    // Validate required fields
    if (!body.address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    if (!body.fieldId && (!body.fieldIds || body.fieldIds.length === 0)) {
      return res.status(400).json({ error: 'Either fieldId or fieldIds is required' });
    }

    // Build property context
    const context: PropertyContext = {
      address: body.address,
      city: body.city,
      state: body.state,
      zip: body.zip,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      sqft: body.sqft,
      propertyData: body.propertyData
    };

    // Handle batch vs single field request
    let results: TavilyFieldResult | TavilyFieldResult[];

    if (body.fieldIds && body.fieldIds.length > 0) {
      // Batch request
      console.log(`[Tavily Field API] Batch fetching ${body.fieldIds.length} fields for ${body.address}`);
      results = await batchFetchFieldsWithTavily(body.fieldIds, context);

    } else if (body.fieldId) {
      // Single field request
      console.log(`[Tavily Field API] Fetching field ${body.fieldId} for ${body.address}`);
      results = await fetchFieldWithTavily(body.fieldId, context);

    } else {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Optionally update database if propertyId provided
    if (body.propertyId && !Array.isArray(results)) {
      await updatePropertyField(body.propertyId, results.fieldId, results.value);
    } else if (body.propertyId && Array.isArray(results)) {
      await batchUpdatePropertyFields(body.propertyId, results);
    }

    // Return results
    return res.status(200).json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Tavily Field API] Error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Update single field in database
 *
 * IMPORTANT: This uses the existing updatePropertyField helper
 * Does NOT create new database logic - reuses existing infrastructure
 */
async function updatePropertyField(
  propertyId: string,
  fieldId: number,
  value: any
): Promise<void> {
  try {
    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const config = getTavilyFieldConfig(fieldId);
    if (!config) {
      console.warn(`[Tavily Field API] No config found for field ${fieldId}`);
      return;
    }

    // Map field ID to database column
    // This should match field-normalizer.ts mappings
    const fieldKey = `field_${fieldId}`;

    const { error } = await supabase
      .from('properties')
      .update({
        [fieldKey]: value,
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId);

    if (error) {
      console.error(`[Tavily Field API] Database update error for field ${fieldId}:`, error);
      throw error;
    }

    console.log(`[Tavily Field API] Updated field ${fieldId} (${config.label}) for property ${propertyId}`);

  } catch (error) {
    console.error('[Tavily Field API] updatePropertyField error:', error);
    // Don't throw - allow API to return results even if DB update fails
  }
}

/**
 * Batch update multiple fields in database
 */
async function batchUpdatePropertyFields(
  propertyId: string,
  results: TavilyFieldResult[]
): Promise<void> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build update object
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    results.forEach(result => {
      if (result.value !== null && result.value !== undefined) {
        updates[`field_${result.fieldId}`] = result.value;
      }
    });

    const { error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', propertyId);

    if (error) {
      console.error('[Tavily Field API] Batch database update error:', error);
      throw error;
    }

    console.log(`[Tavily Field API] Batch updated ${results.length} fields for property ${propertyId}`);

  } catch (error) {
    console.error('[Tavily Field API] batchUpdatePropertyFields error:', error);
    // Don't throw - allow API to return results even if DB update fails
  }
}
