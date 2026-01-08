/**
 * Tavily Web Search Client
 * Tier 3 data source for targeted property searches
 *
 * Used for:
 * - AVMs (Zestimate, Redfin Estimate)
 * - Market data (median prices, DOM)
 * - Permit history
 * - Property features
 * - Portal views/saves
 */

export const TAVILY_CONFIG = {
  baseUrl: 'https://api.tavily.com/search',
  timeout: 30000, // 30 seconds - INCREASED from 15s on 2026-01-08
  maxResults: 5,
  searchDepth: 'basic' as const,
};

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilyResponse {
  results: TavilySearchResult[];
  query: string;
  answer?: string;
}

/**
 * Execute a Tavily web search
 */
export async function tavilySearch(
  query: string,
  options: {
    numResults?: number;
    includeDomains?: string[];
    excludeDomains?: string[];
    searchDepth?: 'basic' | 'advanced';
  } = {}
): Promise<TavilyResponse> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    console.log('❌ [Tavily] TAVILY_API_KEY not set');
    return { results: [], query };
  }

  // Create AbortController for 10s timeout per API call (30s total budget)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    console.log(`🔍 [Tavily] Searching: "${query}"`);

    const response = await fetch(TAVILY_CONFIG.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: options.numResults || TAVILY_CONFIG.maxResults,
        search_depth: options.searchDepth || TAVILY_CONFIG.searchDepth,
        include_domains: options.includeDomains || [],
        exclude_domains: options.excludeDomains || [],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`❌ [Tavily] HTTP ${response.status}: ${response.statusText}`);
      return { results: [], query };
    }

    const data = await response.json();
    console.log(`✅ [Tavily] Got ${data.results?.length || 0} results for: "${query}"`);

    return {
      results: data.results || [],
      query,
      answer: data.answer,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`⚠️ [Tavily] Timeout after 10s for: "${query}"`);
    } else {
      console.error('❌ [Tavily] Search failed:', error);
    }
    return { results: [], query };
  }
}

/**
 * Search for AVM values (Zestimate, Redfin Estimate)
 */
export async function searchAVMs(address: string): Promise<Record<string, any>> {
  const fields: Record<string, any> = {};

  // Search Zillow for Zestimate
  const zillowResult = await tavilySearch(
    `site:zillow.com "${address}" Zestimate home value`,
    { includeDomains: ['zillow.com'], numResults: 3 }
  );

  // Search Redfin for Redfin Estimate
  const redfinResult = await tavilySearch(
    `site:redfin.com "${address}" estimate home value`,
    { includeDomains: ['redfin.com'], numResults: 3 }
  );

  // Extract values from results
  for (const result of zillowResult.results) {
    const zestimateMatch = result.content.match(/Zestimate[:\s]*\$?([\d,]+)/i);
    if (zestimateMatch) {
      fields['16a_zestimate'] = {
        value: parseInt(zestimateMatch[1].replace(/,/g, '')),
        source: 'Tavily (Zillow)',
        confidence: 'Medium',
      };
      break;
    }
  }

  for (const result of redfinResult.results) {
    const redfinMatch = result.content.match(/(?:Redfin Estimate|Estimate)[:\s]*\$?([\d,]+)/i);
    if (redfinMatch) {
      fields['16b_redfin_estimate'] = {
        value: parseInt(redfinMatch[1].replace(/,/g, '')),
        source: 'Tavily (Redfin)',
        confidence: 'Medium',
      };
      break;
    }
  }

  return fields;
}

/**
 * Search for market statistics
 */
export async function searchMarketStats(city: string, zip: string): Promise<Record<string, any>> {
  const fields: Record<string, any> = {};

  const result = await tavilySearch(
    `"${city}" ${zip} median home price average days on market 2026`,
    { numResults: 5 }
  );

  for (const r of result.results) {
    // Extract median price
    const medianMatch = r.content.match(/median.*?\$?([\d,]+)/i);
    if (medianMatch && !fields['91_median_home_price_neighborhood']) {
      fields['91_median_home_price_neighborhood'] = {
        value: parseInt(medianMatch[1].replace(/,/g, '')),
        source: 'Tavily',
        confidence: 'Medium',
      };
    }

    // Extract price per sqft
    const psfMatch = r.content.match(/\$?([\d]+)\s*(?:per|\/)\s*(?:sq\.?\s*ft|sqft)/i);
    if (psfMatch && !fields['92_price_per_sqft_recent_avg']) {
      fields['92_price_per_sqft_recent_avg'] = {
        value: parseInt(psfMatch[1]),
        source: 'Tavily',
        confidence: 'Medium',
      };
    }

    // Extract DOM
    const domMatch = r.content.match(/(\d+)\s*(?:days?\s*on\s*market|DOM)/i);
    if (domMatch && !fields['95_days_on_market_avg']) {
      fields['95_days_on_market_avg'] = {
        value: parseInt(domMatch[1]),
        source: 'Tavily',
        confidence: 'Medium',
      };
    }
  }

  return fields;
}

/**
 * Search for utility providers
 */
export async function searchUtilities(city: string, state: string): Promise<Record<string, any>> {
  const fields: Record<string, any> = {};

  const result = await tavilySearch(
    `"${city}" ${state} electric utility provider water utility natural gas`,
    { numResults: 5 }
  );

  for (const r of result.results) {
    // Common Florida utilities
    if (r.content.match(/Duke Energy|TECO|Tampa Electric|FPL|Florida Power/i) && !fields['104_electric_provider']) {
      const match = r.content.match(/(Duke Energy|TECO|Tampa Electric|FPL|Florida Power & Light)/i);
      if (match) {
        fields['104_electric_provider'] = {
          value: match[1],
          source: 'Tavily',
          confidence: 'Medium',
        };
      }
    }

    if (r.content.match(/water.*(?:utility|department|provider)/i) && !fields['106_water_provider']) {
      const match = r.content.match(/(\w+\s*(?:Water|Utilities|Public Works))/i);
      if (match) {
        fields['106_water_provider'] = {
          value: match[1],
          source: 'Tavily',
          confidence: 'Medium',
        };
      }
    }

    if (r.content.match(/natural gas|Peoples Gas|TECO Gas/i) && !fields['109_natural_gas']) {
      const match = r.content.match(/(Peoples Gas|TECO (?:Peoples )?Gas|No natural gas)/i);
      if (match) {
        fields['109_natural_gas'] = {
          value: match[1],
          source: 'Tavily',
          confidence: 'Medium',
        };
      }
    }
  }

  return fields;
}

/**
 * Search for permit history
 */
export async function searchPermits(address: string, county: string): Promise<Record<string, any>> {
  const fields: Record<string, any> = {};

  const result = await tavilySearch(
    `"${address}" ${county} county building permits roof HVAC renovation`,
    { numResults: 5 }
  );

  for (const r of result.results) {
    if (r.content.match(/roof.*permit|permit.*roof/i) && !fields['60_permit_history_roof']) {
      fields['60_permit_history_roof'] = {
        value: 'Permit found - see county records',
        source: 'Tavily',
        confidence: 'Low',
      };
    }

    if (r.content.match(/HVAC.*permit|permit.*HVAC|AC.*permit/i) && !fields['61_permit_history_hvac']) {
      fields['61_permit_history_hvac'] = {
        value: 'Permit found - see county records',
        source: 'Tavily',
        confidence: 'Low',
      };
    }
  }

  return fields;
}

/**
 * Search for portal views (Zillow, Redfin, etc.)
 */
export async function searchPortalViews(address: string): Promise<Record<string, any>> {
  const fields: Record<string, any> = {};

  const result = await tavilySearch(
    `"${address}" views saves favorites Zillow Redfin`,
    { includeDomains: ['zillow.com', 'redfin.com', 'realtor.com', 'homes.com'], numResults: 5 }
  );

  for (const r of result.results) {
    const viewsMatch = r.content.match(/(\d+(?:,\d+)?)\s*views/i);
    const savesMatch = r.content.match(/(\d+(?:,\d+)?)\s*(?:saves|favorites)/i);

    if (viewsMatch) {
      const views = parseInt(viewsMatch[1].replace(/,/g, ''));
      if (r.url.includes('zillow') && !fields['169_zillow_views']) {
        fields['169_zillow_views'] = { value: views, source: 'Tavily (Zillow)', confidence: 'Medium' };
      } else if (r.url.includes('redfin') && !fields['170_redfin_views']) {
        fields['170_redfin_views'] = { value: views, source: 'Tavily (Redfin)', confidence: 'Medium' };
      } else if (r.url.includes('homes.com') && !fields['171_homes_views']) {
        fields['171_homes_views'] = { value: views, source: 'Tavily (Homes.com)', confidence: 'Medium' };
      } else if (r.url.includes('realtor') && !fields['172_realtor_views']) {
        fields['172_realtor_views'] = { value: views, source: 'Tavily (Realtor.com)', confidence: 'Medium' };
      }
    }

    if (savesMatch && !fields['174_saves_favorites']) {
      fields['174_saves_favorites'] = {
        value: parseInt(savesMatch[1].replace(/,/g, '')),
        source: 'Tavily',
        confidence: 'Medium',
      };
    }
  }

  return fields;
}

/**
 * Run all Tavily searches for a property (Tier 3)
 */
export async function runTavilyTier3(
  address: string,
  city: string,
  state: string,
  county: string,
  zip: string
): Promise<Record<string, any>> {
  console.log('========================================');
  console.log('TIER 3: TAVILY WEB SEARCH');
  console.log('========================================');

  const allFields: Record<string, any> = {};

  // Run searches in parallel for speed
  const [avmFields, marketFields, utilityFields, permitFields, viewFields] = await Promise.all([
    searchAVMs(address),
    searchMarketStats(city, zip),
    searchUtilities(city, state),
    searchPermits(address, county),
    searchPortalViews(address),
  ]);

  // Merge all fields
  Object.assign(allFields, avmFields, marketFields, utilityFields, permitFields, viewFields);

  console.log(`✅ TIER 3: Tavily returned ${Object.keys(allFields).length} fields`);

  return allFields;
}

export const TAVILY_SOURCE = 'Tavily';
