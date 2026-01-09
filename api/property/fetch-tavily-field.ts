/**
 * API ENDPOINT: Fetch Single Field with Tavily - REBUILT VERSION
 *
 * CRITICAL FIXES:
 * - Uses CORRECT nested database paths (not flat field_X)
 * - Implements sequential query execution (not parallel)
 * - Uses LLM for extraction with user's detailed prompts
 * - Proper error handling and validation
 *
 * POST /api/property/fetch-tavily-field
 * Body: { fieldId, address, city, state, zip, propertyId }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTavilyFieldConfig } from './tavily-field-config.js';
import { getFieldDatabasePath, updateNestedProperty } from './tavily-field-database-mapping.js';

export const config = {
  maxDuration: 60  // 1 minute max
};

interface RequestBody {
  fieldId: number;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  propertyId?: string;
}

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body: RequestBody = req.body;

    // Validate - FIX BUG #5: Allow fieldId 0, check type and bounds
    if (typeof body.fieldId !== 'number' || body.fieldId < 0 || body.fieldId > 200) {
      return res.status(400).json({ error: 'Invalid fieldId (must be 0-200)' });
    }

    if (typeof body.address !== 'string' || body.address.trim().length === 0) {
      return res.status(400).json({ error: 'Valid address required' });
    }

    console.log(`[Tavily Field API] Fetching field ${body.fieldId} for ${body.address}`);

    // Get field configuration
    const fieldConfig = getTavilyFieldConfig(body.fieldId);
    const fieldDbPath = getFieldDatabasePath(body.fieldId);

    if (!fieldConfig) {
      return res.status(400).json({ error: `No configuration found for field ${body.fieldId}` });
    }

    if (!fieldDbPath) {
      return res.status(400).json({ error: `No database mapping found for field ${body.fieldId}` });
    }

    // Check if calculation-only field
    if (fieldConfig.calculationOnly) {
      return res.status(400).json({
        error: `Field ${body.fieldId} is calculation-only - cannot fetch with Tavily`,
        note: fieldConfig.notes
      });
    }

    // STEP 1: Execute Tavily searches SEQUENTIALLY (as user specified)
    const tavilyResults = await executeTavilySearchesSequential(fieldConfig, body);

    if (!tavilyResults || tavilyResults.length === 0) {
      return res.status(200).json({
        success: true,
        results: {
          fieldId: body.fieldId,
          fieldLabel: fieldConfig.label,
          value: null,
          sourceUrl: null,
          sourceName: null,
          extractionMethod: 'not_found',
          confidence: 'low',
          note: 'No search results returned by Tavily',
          timestamp: new Date().toISOString()
        }
      });
    }

    // STEP 2: Use LLM to extract value using user's detailed prompts
    const extractionResult = await extractValueWithLLM(
      tavilyResults,
      fieldConfig,
      body
    );

    // STEP 3: Update database if propertyId provided and value found
    if (body.propertyId && extractionResult.value !== null) {
      await updatePropertyDatabase(
        body.propertyId,
        body.fieldId,
        fieldDbPath,
        extractionResult.value
      );
    }

    return res.status(200).json({
      success: true,
      results: {
        fieldId: body.fieldId,
        fieldLabel: fieldConfig.label,
        ...extractionResult,
        timestamp: new Date().toISOString()
      }
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
 * Execute Tavily searches SEQUENTIALLY (not parallel)
 * Stop at first successful result as user specified
 */
async function executeTavilySearchesSequential(
  fieldConfig: any,
  context: RequestBody
): Promise<TavilySearchResult[]> {
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

  if (!TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY not configured');
  }

  // Replace placeholders in queries
  const queries = fieldConfig.searchQueries.map((q: string) =>
    replacePlaceholders(q, context)
  );

  console.log(`[Tavily] Executing ${queries.length} queries SEQUENTIALLY for field ${fieldConfig.fieldId}`);

  // Execute queries ONE AT A TIME, stop when we get good results
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`[Tavily] Query ${i + 1}/${queries.length}: ${query}`);

    try {
      const results = await callTavilyAPI(query, TAVILY_API_KEY);

      if (results && results.length > 0) {
        console.log(`[Tavily] Query ${i + 1} returned ${results.length} results - stopping`);
        return results;
      }

      console.log(`[Tavily] Query ${i + 1} returned no results - trying next query`);
    } catch (error) {
      console.error(`[Tavily] Query ${i + 1} failed:`, error);
      // Continue to next query
    }
  }

  console.log(`[Tavily] All ${queries.length} queries exhausted - no results`);
  return [];
}

/**
 * Call Tavily API
 */
async function callTavilyAPI(
  query: string,
  apiKey: string
): Promise<TavilySearchResult[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        include_answer: false,
        include_images: false,
        include_raw_content: false,  // We'll use content summaries
        max_results: 5
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];

  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Tavily search timeout');
    }
    throw error;
  }
}

/**
 * Extract value using LLM with user's detailed extraction prompts
 * This is the CORRECT approach - use Claude/GPT to parse Tavily results
 */
async function extractValueWithLLM(
  tavilyResults: TavilySearchResult[],
  fieldConfig: any,
  context: RequestBody
): Promise<{
  value: any;
  sourceUrl: string | null;
  sourceName: string | null;
  extractionMethod: string;
  confidence: string;
  note?: string;
}> {
  // Combine Tavily results into context for LLM
  const searchContext = tavilyResults
    .map((r, i) => `[Source ${i + 1}: ${r.url}]\n${r.content}`)
    .join('\n\n---\n\n');

  // Build LLM prompt using user's detailed extraction rules
  const prompt = buildExtractionPrompt(fieldConfig, context.address, searchContext);

  try {
    // Call Claude/GPT to extract value
    const extractedValue = await callExtractionLLM(prompt);

    if (extractedValue && extractedValue !== 'DATA_NOT_FOUND') {
      return {
        value: extractedValue,
        sourceUrl: tavilyResults[0].url,
        sourceName: extractDomainFromUrl(tavilyResults[0].url),
        extractionMethod: 'llm_extraction',
        confidence: 'high'
      };
    }

    return {
      value: null,
      sourceUrl: null,
      sourceName: null,
      extractionMethod: 'not_found',
      confidence: 'low',
      note: 'LLM could not extract value from search results'
    };

  } catch (error) {
    console.error('[Extraction LLM] Error:', error);
    return {
      value: null,
      sourceUrl: null,
      sourceName: null,
      extractionMethod: 'error',
      confidence: 'low',
      note: `Extraction error: ${error instanceof Error ? error.message : 'Unknown'}`
    };
  }
}

/**
 * Build extraction prompt using user's detailed rules
 */
function buildExtractionPrompt(
  fieldConfig: any,
  address: string,
  searchContext: string
): string {
  return `You are a precise data extraction agent. Extract the value for this field from the search results.

Address: ${address}
Field: ${fieldConfig.label}
Field ID: ${fieldConfig.fieldId}

Search Results:
${searchContext}

Extraction Rules:
- Extract ONLY real, visible data from the search results
- If multiple values appear, take the most credible/recent one
- Normalize units (USD for prices, years for age, etc.)
- If no value found in ANY source, return exactly: DATA_NOT_FOUND
- NEVER guess or estimate - only extract what you see

Output Format:
Return ONLY the extracted value, nothing else. Examples:
- For prices: "$500,000" or "$1,250,000"
- For percentages: "3.5%"
- For text: "Excellent" or "Cable, Fiber"
- For not found: "DATA_NOT_FOUND"

Extract the value now:`;
}

/**
 * Call LLM for extraction (Claude Sonnet or GPT-4o)
 */
async function callExtractionLLM(prompt: string): Promise<string | null> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();

  // FIX ERROR #10 & BUG #4: Validate response structure before accessing
  if (!data || !Array.isArray(data.content) || data.content.length === 0) {
    throw new Error('Invalid Claude API response structure');
  }

  const firstContent = data.content[0];
  if (!firstContent || typeof firstContent.text !== 'string') {
    throw new Error('Claude API response missing text content');
  }

  const extracted = firstContent.text.trim();

  if (extracted.length === 0) {
    throw new Error('Claude API returned empty text');
  }

  return extracted === 'DATA_NOT_FOUND' ? null : extracted;
}

/**
 * Update property database with CORRECT nested path
 */
async function updatePropertyDatabase(
  propertyId: string,
  fieldId: number,
  fieldDbPath: any,
  value: any
): Promise<void> {
  // FIX ERROR #11: Validate environment variables before use
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables not configured');
  }

  // FIX ERROR #12: Validate fieldDbPath before accessing .path
  if (!fieldDbPath || !fieldDbPath.path) {
    throw new Error(`Invalid database path mapping for field ${fieldId}`);
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Get current property data
  const { data: currentProperty, error: fetchError } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  // FIX BUG #3: Handle all Supabase response edge cases
  if (fetchError) {
    throw new Error(`Failed to fetch property: ${fetchError.message}`);
  }

  if (!currentProperty || typeof currentProperty !== 'object') {
    throw new Error(`Property ${propertyId} not found or invalid`);
  }

  // Update nested property - deep clone to avoid mutations
  const updated = JSON.parse(JSON.stringify(currentProperty));

  if (!updated || typeof updated !== 'object') {
    throw new Error(`Failed to clone property data for ${propertyId}`);
  }

  updateNestedProperty(updated, fieldDbPath.path, value);

  // Save back to database
  const { error: updateError } = await supabase
    .from('properties')
    .update({
      ...updated,
      updated_at: new Date().toISOString()
    })
    .eq('id', propertyId);

  if (updateError) {
    throw new Error(`Failed to update property: ${updateError.message}`);
  }

  console.log(`[Database] Updated field ${fieldId} (${fieldDbPath.label}) at path ${fieldDbPath.path.join('.')}`);
}

/**
 * Helpers
 */
function replacePlaceholders(query: string, context: RequestBody): string {
  return query
    .replace(/{address}/g, context.address || '')
    .replace(/{city}/g, context.city || '')
    .replace(/{state}/g, context.state || '')
    .replace(/{zip}/g, context.zip || '');
}

function extractDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}
