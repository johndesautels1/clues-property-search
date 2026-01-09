/**
 * TAVILY FIELD FETCHER
 * Core logic for fetching individual fields using Tavily web search
 *
 * IMPORTANT: This file is ISOLATED from the main cascade
 * Does NOT affect search.ts, retry-llm.ts, or any cascade logic
 *
 * Usage:
 *   const result = await fetchFieldWithTavily(111, '123 Main St, Miami, FL 33101');
 *   // Returns internet providers for that address
 */

import { getTavilyFieldConfig, isTavilyFetchable, TAVILY_FIELD_CONFIGS } from './tavily-field-config';

// Tavily API configuration
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_API_URL = 'https://api.tavily.com/search';
const TAVILY_TIMEOUT = 30000; // 30 seconds

export interface TavilyFieldResult {
  fieldId: number;
  fieldLabel: string;
  value: any;  // string, number, array, or object depending on field
  sourceUrl: string | null;
  sourceName: string | null;
  extractionMethod: 'json_ld' | 'regex' | 'text_marker' | 'not_found' | 'calculation' | 'error';
  confidence: 'high' | 'medium' | 'low';
  note?: string;
  timestamp: string;
  raw Data?: any;  // For debugging
}

export interface PropertyContext {
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  propertyData?: Record<string, any>;  // For calculated fields that need other field values
}

/**
 * Main function: Fetch a single field using Tavily
 */
export async function fetchFieldWithTavily(
  fieldId: number,
  context: PropertyContext
): Promise<TavilyFieldResult> {
  const timestamp = new Date().toISOString();

  // Get field configuration
  const config = getTavilyFieldConfig(fieldId);

  if (!config) {
    return {
      fieldId,
      fieldLabel: `Field ${fieldId}`,
      value: null,
      sourceUrl: null,
      sourceName: null,
      extractionMethod: 'error',
      confidence: 'low',
      note: 'No Tavily configuration found for this field',
      timestamp
    };
  }

  // Check if calculation-only field
  if (config.calculationOnly) {
    return handleCalculatedField(fieldId, config.label, context, timestamp);
  }

  // Check if field is fetchable
  if (!isTavilyFetchable(fieldId)) {
    return {
      fieldId,
      fieldLabel: config.label,
      value: null,
      sourceUrl: null,
      sourceName: null,
      extractionMethod: 'error',
      confidence: 'low',
      note: 'Field not configured for Tavily fetching',
      timestamp
    };
  }

  try {
    // Execute Tavily search
    const searchResults = await executeTavilySearch(config, context);

    if (!searchResults || searchResults.length === 0) {
      return {
        fieldId,
        fieldLabel: config.label,
        value: null,
        sourceUrl: null,
        sourceName: null,
        extractionMethod: 'not_found',
        confidence: 'low',
        note: 'No search results returned by Tavily',
        timestamp
      };
    }

    // Extract value from search results
    const extraction = extractValueFromResults(searchResults, config);

    return {
      fieldId,
      fieldLabel: config.label,
      value: extraction.value,
      sourceUrl: extraction.sourceUrl,
      sourceName: extraction.sourceName,
      extractionMethod: extraction.method,
      confidence: extraction.confidence,
      note: extraction.note,
      timestamp,
      rawData: config.category === 'avm' || config.category === 'market' ? searchResults : undefined
    };

  } catch (error) {
    console.error(`[Tavily Field Fetcher] Error fetching field ${fieldId}:`, error);

    return {
      fieldId,
      fieldLabel: config.label,
      value: null,
      sourceUrl: null,
      sourceName: null,
      extractionMethod: 'error',
      confidence: 'low',
      note: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp
    };
  }
}

/**
 * Execute Tavily search with field-specific queries
 */
async function executeTavilySearch(
  config: any,
  context: PropertyContext
): Promise<any[]> {
  if (!TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY not configured');
  }

  // Replace placeholders in search queries
  const queries = config.searchQueries.map((query: string) =>
    replacePlaceholders(query, context)
  );

  // Execute searches in parallel (Tavily supports multiple queries)
  const searchPromises = queries.map((query: string) =>
    executeSingleTavilyQuery(query)
  );

  const results = await Promise.allSettled(searchPromises);

  // Collect successful results
  const successfulResults: any[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      successfulResults.push({
        query: queries[index],
        ...result.value
      });
    }
  });

  return successfulResults;
}

/**
 * Execute single Tavily API query
 */
async function executeSingleTavilyQuery(query: string): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TAVILY_TIMEOUT);

  try {
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: 'basic',  // Use 'advanced' for more thorough search
        include_raw_content: true,
        max_results: 5
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Tavily search timeout');
    }
    throw error;
  }
}

/**
 * Extract value from Tavily search results using field-specific patterns
 */
function extractValueFromResults(
  searchResults: any[],
  config: any
): {
  value: any;
  sourceUrl: string | null;
  sourceName: string | null;
  method: 'json_ld' | 'regex' | 'text_marker' | 'not_found';
  confidence: 'high' | 'medium' | 'low';
  note?: string;
} {
  const { extractionPatterns, prioritySources } = config;

  // Try each search result in order
  for (const result of searchResults) {
    const content = result.raw_content || result.content || '';
    const url = result.url || '';

    // Priority: Try JSON-LD extraction first
    if (extractionPatterns.jsonLdPaths && extractionPatterns.jsonLdPaths.length > 0) {
      const jsonLdValue = extractFromJsonLd(content, extractionPatterns.jsonLdPaths);
      if (jsonLdValue) {
        return {
          value: jsonLdValue,
          sourceUrl: url,
          sourceName: extractDomainFromUrl(url),
          method: 'json_ld',
          confidence: 'high'
        };
      }
    }

    // Try regex extraction
    if (extractionPatterns.regexPatterns && extractionPatterns.regexPatterns.length > 0) {
      const regexValue = extractWithRegex(content, extractionPatterns.regexPatterns);
      if (regexValue) {
        return {
          value: regexValue,
          sourceUrl: url,
          sourceName: extractDomainFromUrl(url),
          method: 'regex',
          confidence: determineConfidence(url, prioritySources)
        };
      }
    }

    // Try text marker extraction
    if (extractionPatterns.textMarkers && extractionPatterns.textMarkers.length > 0) {
      const textValue = extractNearTextMarker(content, extractionPatterns.textMarkers);
      if (textValue) {
        return {
          value: textValue,
          sourceUrl: url,
          sourceName: extractDomainFromUrl(url),
          method: 'text_marker',
          confidence: determineConfidence(url, prioritySources)
        };
      }
    }
  }

  // No value found
  return {
    value: null,
    sourceUrl: null,
    sourceName: null,
    method: 'not_found',
    confidence: 'low',
    note: 'No matching data found in search results'
  };
}

/**
 * Extract value from JSON-LD structured data
 */
function extractFromJsonLd(content: string, paths: string[]): any {
  try {
    // Find JSON-LD script tags
    const jsonLdMatches = content.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);

    if (!jsonLdMatches) return null;

    for (const match of jsonLdMatches) {
      const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');

      try {
        const data = JSON.parse(jsonContent);

        // Try each path
        for (const path of paths) {
          const value = getNestedValue(data, path);
          if (value) return value;
        }
      } catch (e) {
        continue;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Extract value using regex patterns
 */
function extractWithRegex(content: string, patterns: RegExp[]): any {
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      // Return captured group if exists, otherwise full match
      return match[1] || match[0];
    }
  }
  return null;
}

/**
 * Extract value near text markers
 */
function extractNearTextMarker(content: string, markers: string[]): any {
  for (const marker of markers) {
    // Find marker in content (case-insensitive)
    const markerIndex = content.toLowerCase().indexOf(marker.toLowerCase());

    if (markerIndex === -1) continue;

    // Extract text near marker (next 200 characters)
    const snippet = content.substring(markerIndex, markerIndex + 200);

    // Try to find a value pattern (dollar amount, percentage, number)
    const valuePatterns = [
      /\$[\d,]+/,  // Dollar amount
      /[\d\.]+%/,  // Percentage
      /[\d,]+\s*(sq\s*ft|sqft|miles?|mi|years?|yr)/i,  // Number with unit
      /[\d,]+/  // Plain number
    ];

    for (const pattern of valuePatterns) {
      const match = snippet.match(pattern);
      if (match) return match[0];
    }
  }

  return null;
}

/**
 * Handle calculated fields (no Tavily query needed)
 */
function handleCalculatedField(
  fieldId: number,
  label: string,
  context: PropertyContext,
  timestamp: string
): TavilyFieldResult {
  const propertyData = context.propertyData || {};

  try {
    let value: any = null;
    let note: string | undefined;

    switch (fieldId) {
      case 16:  // AVMs Average
        const avms = [
          propertyData['16a'],
          propertyData['16b'],
          propertyData['16c'],
          propertyData['16d'],
          propertyData['16e'],
          propertyData['16f']
        ].filter(v => v && typeof v === 'number');

        if (avms.length >= 2) {
          value = Math.round(avms.reduce((sum, v) => sum + v, 0) / avms.length);
          note = `Average of ${avms.length} AVMs`;
        } else {
          note = 'Insufficient AVMs (require min 2)';
        }
        break;

      case 94:  // Price vs Median %
        const marketValue = propertyData[12];
        const medianPrice = propertyData[91];

        if (marketValue && medianPrice) {
          value = Math.round((marketValue / medianPrice) * 100);
          note = value > 100 ? 'Above median' : 'Below median';
        } else {
          note = 'Requires Fields 12 and 91';
        }
        break;

      case 101:  // Cap Rate (Est)
        const propValue = propertyData[12];
        const monthlyRent = propertyData[98];
        const annualTaxes = propertyData[35];

        if (propValue && monthlyRent) {
          const annualRent = monthlyRent * 12;
          const estimatedExpenses = annualRent * 0.4;  // 40% expense ratio
          const noi = annualRent - estimatedExpenses;
          value = ((noi / propValue) * 100).toFixed(2);
          note = 'Estimated with 40% expense ratio';
        } else {
          note = 'Requires Fields 12 and 98';
        }
        break;

      case 181:  // Market Volatility Score
        // Aggregate Fields 170-180 into volatility score
        const trendChange = Math.abs(parseFloat(propertyData[170]) || 0);
        const momentum = Math.abs(parseFloat(propertyData[177]) || 0);
        const saleToList = Math.abs((parseFloat(propertyData[171]) || 100) - 100);

        value = Math.min(100, Math.round((trendChange * 2) + (momentum * 3) + saleToList));
        note = value > 50 ? 'High volatility' : 'Low volatility';
        break;

      default:
        note = 'Calculation logic not implemented';
    }

    return {
      fieldId,
      fieldLabel: label,
      value,
      sourceUrl: null,
      sourceName: 'Internal Calculation',
      extractionMethod: 'calculation',
      confidence: value !== null ? 'high' : 'low',
      note,
      timestamp
    };

  } catch (error) {
    return {
      fieldId,
      fieldLabel: label,
      value: null,
      sourceUrl: null,
      sourceName: null,
      extractionMethod: 'error',
      confidence: 'low',
      note: `Calculation error: ${error instanceof Error ? error.message : 'Unknown'}`,
      timestamp
    };
  }
}

/**
 * Helper: Replace placeholders in search queries
 */
function replacePlaceholders(query: string, context: PropertyContext): string {
  return query
    .replace(/{address}/g, context.address)
    .replace(/{city}/g, context.city || '')
    .replace(/{state}/g, context.state || '')
    .replace(/{zip}/g, context.zip || '')
    .replace(/{community}/g, extractCommunity(context.address));
}

/**
 * Helper: Extract community name from address (if applicable)
 */
function extractCommunity(address: string): string {
  // Simple extraction - can be enhanced with MLS data
  const parts = address.split(',');
  return parts[0] || '';
}

/**
 * Helper: Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Helper: Extract domain from URL
 */
function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Helper: Determine confidence based on source priority
 */
function determineConfidence(
  url: string,
  prioritySources: string[]
): 'high' | 'medium' | 'low' {
  const domain = extractDomainFromUrl(url);
  const priorityIndex = prioritySources.findIndex(source =>
    domain.includes(source) || source.includes(domain)
  );

  if (priorityIndex === 0 || priorityIndex === 1) return 'high';
  if (priorityIndex === 2 || priorityIndex === 3) return 'medium';
  return 'low';
}

/**
 * Batch fetch multiple fields
 */
export async function batchFetchFieldsWithTavily(
  fieldIds: number[],
  context: PropertyContext
): Promise<TavilyFieldResult[]> {
  const fetchPromises = fieldIds.map(fieldId =>
    fetchFieldWithTavily(fieldId, context)
  );

  return Promise.all(fetchPromises);
}
