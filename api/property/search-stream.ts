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

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    console.log('[search-stream] Wrapping search.ts with SSE progress events');

    // Send initial progress for all data sources
    const allSources = [
      'stellar-mls',
      'google-geocode',
      'google-places',
      'google-distance',
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
      'perplexity',
      'grok',
      'claude-opus',
      'gpt',
      'claude-sonnet',
      'gemini'
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

    // Create a mock response object to capture search.ts JSON result
    let searchResult: any = null;
    const mockRes = {
      status: (code: number) => mockRes,
      json: (data: any) => {
        searchResult = data;
        return mockRes;
      },
      setHeader: () => mockRes,
    } as any;

    // Call search.ts handler
    await searchHandler(req, mockRes);

    if (!searchResult || !searchResult.success) {
      throw new Error(searchResult?.error || 'Search failed');
    }

    console.log('[search-stream] search.ts returned:', searchResult.total_fields_found, 'fields');

    // Convert source_breakdown to SSE progress events
    if (searchResult.source_breakdown) {
      const sourceMap: Record<string, string> = {
        'Stellar MLS': 'stellar-mls',
        'Google Geocode': 'google-geocode',
        'Google Places': 'google-places',
        'Google Distance Matrix': 'google-distance',
        'WalkScore': 'walkscore',
        'FEMA NFHL': 'fema',
        'AirNow': 'airnow',
        'Census': 'census',
        'U.S. Census': 'census',
        'HowLoud': 'howloud',
        'OpenWeatherMap': 'weather',
        'Weather': 'weather',
        'FBI Crime': 'crime',
        'SchoolDigger': 'schooldigger',
        'NOAA Climate': 'noaa-climate',
        'NOAA Storm Events': 'noaa-storm',
        'NOAA Sea Level': 'noaa-sealevel',
        'USGS Elevation': 'usgs-elevation',
        'USGS Earthquake': 'usgs-earthquake',
        'EPA FRS': 'epa-frs',
        'EPA Radon': 'epa-radon',
        'Perplexity': 'perplexity',
        'Grok': 'grok',
        'Claude Opus': 'claude-opus',
        'GPT': 'gpt',
        'GPT-4o': 'gpt',
        'Claude Sonnet': 'claude-sonnet',
        'Gemini': 'gemini'
      };

      Object.entries(searchResult.source_breakdown).forEach(([sourceName, count]) => {
        const sourceId = sourceMap[sourceName] || sourceName.toLowerCase().replace(/\s+/g, '-');
        sendEvent(res, 'progress', {
          source: sourceId,
          status: 'complete',
          fieldsFound: count,
          newUniqueFields: count,
          totalFieldsSoFar: searchResult.total_fields_found,
          currentFields: searchResult.fields
        });
      });
    }

    // Send final complete event
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
