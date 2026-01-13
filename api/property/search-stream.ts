/**
 * SSE Streaming wrapper for search.ts
 * Provides real-time progress updates by wrapping the working search.ts endpoint
 *
 * This endpoint wraps the fully-functional search.ts to provide Server-Sent Events (SSE)
 * for real-time progress tracking while maintaining 100% identical data sources.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 300, // 5 minutes
};

// SSE helper
function sendEvent(res: VercelResponse, event: string, data: any) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Convert GET query params to POST body format for search.ts compatibility
  if (req.method === 'GET' && req.query) {
    const { address, engines, skipLLMs } = req.query;
    req.method = 'POST';
    req.body = {
      address: address as string,
      engines: engines ? (engines as string).split(',') : [],
      skipLLMs: skipLLMs === 'true'
    };
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    console.log('[search-stream] Wrapping search.ts with SSE progress events');

    // Send initial progress for all data sources
    const allSources = [
      // Tier 1: MLS
      'stellar-mls',
      // Tier 2: Google APIs
      'google-geocode',
      'google-places',
      'google-distance',
      // Tier 3: Free APIs + Tavily
      'tavily',  // ADDED 2026-01-08 - Tier 3 Tavily web search
      'redfin',
      'walkscore',
      'fema',
      'airnow',
      'census',
      'howloud',
      'weather',
      'crime',
      'schooldigger',
      'noaa-climate',
      'noaa-storm',
      'noaa-sealevel',
      'usgs-elevation',
      'usgs-earthquake',
      'epa-frs',
      'epa-radon',
      // Tier 4: Web-Search LLMs (Gemini removed from auto-cascade 2026-01-13)
      'perplexity',
      'gpt',
      'claude-sonnet',
      'grok',
      // Tier 5: Claude Opus (no web search)
      'claude-opus'
    ];

    allSources.forEach(source => {
      sendEvent(res, 'progress', {
        source,
        status: 'searching',
        message: 'Querying...',
        fieldsFound: 0,
        newUniqueFields: 0,
        totalFieldsSoFar: 0
      });
    });

    // Call the WORKING search.ts endpoint internally
    const searchModule = await import('./search.js');
    const searchHandler = searchModule.default;

    // Create a mock response object that forwards SSE events to real response
    let searchResult: any = null;
    const mockRes = {
      status: (code: number) => mockRes,
      json: (data: any) => {
        searchResult = data;
        return mockRes;
      },
      setHeader: (name: string, value: string) => mockRes,
      getHeader: (name: string) => {
        // Make search.ts think we're in SSE mode
        if (name === 'Content-Type') return 'text/event-stream';
        return undefined;
      },
      // Forward write() calls to real response (for SSE progress events)
      write: (chunk: any) => {
        res.write(chunk);
      }
    } as any;

    // Call search.ts handler - it will send SSE events via mockRes.write()
    await searchHandler(req, mockRes);

    if (!searchResult || !searchResult.success) {
      throw new Error(searchResult?.error || 'Search failed');
    }

    console.log('[search-stream] search.ts returned:', searchResult.total_fields_found, 'fields');

    // Note: Real-time progress events already sent by search.ts via SSE
    // No need to replay source_breakdown here

    // Send final complete event with all aggregated data
    sendEvent(res, 'complete', {
      success: true,
      address: searchResult.address,
      fields: searchResult.fields,
      total_fields_found: searchResult.total_fields_found,
      completion_percentage: searchResult.completion_percentage,
      source_breakdown: searchResult.source_breakdown,
      conflicts: searchResult.conflicts || [],
      validation_failures: searchResult.validation_failures || [],
      llm_quorum_fields: searchResult.llm_quorum_fields || [],
      single_source_warnings: searchResult.single_source_warnings || [],
      llm_responses: searchResult.llm_responses || []
    });

    console.log('[search-stream] SSE stream completed successfully');
    res.end();

  } catch (error) {
    console.error('[search-stream] Error:', error);
    sendEvent(res, 'error', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
    res.end();
  }
}
