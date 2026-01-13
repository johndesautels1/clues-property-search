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

const TAVILY_TIMEOUT = 45000; // 45 seconds - INCREASED from 30s on 2026-01-13 for fields 169-174

export const TAVILY_CONFIG = {
  baseUrl: 'https://api.tavily.com/search',
  timeout: 45000, // 45 seconds - INCREASED from 30s on 2026-01-13 for fields 169-174
  maxResults: 5,
  searchDepth: 'basic' as const,
};

/**
 * Florida Utility Fallbacks
 * Used ONLY when Tavily/LLM search fails to find utility providers
 * AND the property is located in Florida
 */
export const FL_UTILITY_FALLBACKS: Record<string, Record<string, string>> = {
  // Electric providers by region/city
  electric: {
    tampa: 'TECO (Tampa Electric)',
    'st petersburg': 'Duke Energy',
    'st. petersburg': 'Duke Energy',
    clearwater: 'Duke Energy',
    orlando: 'Duke Energy',
    miami: 'FPL (Florida Power & Light)',
    'fort lauderdale': 'FPL (Florida Power & Light)',
    jacksonville: 'JEA (Jacksonville Electric Authority)',
    tallahassee: 'Tallahassee Utilities',
    gainesville: 'Gainesville Regional Utilities',
    default: 'FPL (Florida Power & Light)', // Most common statewide
  },

  // Water providers by region/city
  water: {
    tampa: 'Tampa Water Department',
    'st petersburg': 'City of St. Petersburg Water',
    'st. petersburg': 'City of St. Petersburg Water',
    clearwater: 'City of Clearwater Water',
    orlando: 'Orlando Utilities Commission',
    miami: 'Miami-Dade Water',
    'fort lauderdale': 'City of Fort Lauderdale Water',
    jacksonville: 'JEA (Jacksonville Water)',
    default: 'City Water Department',
  },

  // Natural gas providers
  gas: {
    tampa: 'TECO Peoples Gas',
    'st petersburg': 'TECO Peoples Gas',
    'st. petersburg': 'TECO Peoples Gas',
    clearwater: 'TECO Peoples Gas',
    orlando: 'Peoples Gas (Orlando)',
    miami: 'Florida City Gas',
    'fort lauderdale': 'Florida City Gas',
    default: 'Peoples Gas',
  },

  // Sewer providers
  sewer: {
    tampa: 'Tampa Wastewater',
    'st petersburg': 'City of St. Petersburg Wastewater',
    'st. petersburg': 'City of St. Petersburg Wastewater',
    clearwater: 'City of Clearwater Sewer',
    default: 'City Sewer Department',
  },

  // Trash/waste providers
  trash: {
    tampa: 'City of Tampa Solid Waste',
    'st petersburg': 'City of St. Petersburg Sanitation',
    'st. petersburg': 'City of St. Petersburg Sanitation',
    clearwater: 'City of Clearwater Solid Waste',
    default: 'City Waste Management',
  },
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

  // Create AbortController for 30s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TAVILY_TIMEOUT);

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
    if ((error as any).name === 'AbortError') {
      console.log(`⚠️ [Tavily] Timeout after 30s for: "${query}"`);
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
 * STRATEGY: Try Tavily search with GENERIC patterns first
 * FALLBACK: If no results AND state is FL, use hardcoded Florida defaults
 */
export async function searchUtilities(city: string, state: string): Promise<Record<string, any>> {
  const fields: Record<string, any> = {};

  const result = await tavilySearch(
    `"${city}" ${state} electric utility provider water utility natural gas`,
    { numResults: 5 }
  );

  // STEP 1: Extract utility providers using GENERIC regex patterns (not FL-specific)
  for (const r of result.results) {
    // Electric provider - GENERIC pattern (any Electric/Power/Energy company)
    if (!fields['104_electric_provider']) {
      const electricMatch = r.content.match(/([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+(?:Electric|Power|Energy)/i);
      if (electricMatch) {
        const provider = electricMatch[0].trim();
        fields['104_electric_provider'] = {
          value: provider,
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found electric provider: ${provider}`);
      }
    }

    // Water provider - GENERIC pattern (any Water/Utilities department)
    if (!fields['106_water_provider']) {
      const waterMatch = r.content.match(/((?:City of |Town of )?[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+(?:Water|Utilities|Public Works)/i);
      if (waterMatch) {
        const provider = waterMatch[0].trim();
        fields['106_water_provider'] = {
          value: provider,
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found water provider: ${provider}`);
      }
    }

    // Natural gas provider - GENERIC pattern (any Gas company)
    if (!fields['109_natural_gas']) {
      const gasMatch = r.content.match(/([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+(?:Gas|Natural Gas)/i);
      if (gasMatch) {
        const provider = gasMatch[0].trim();
        fields['109_natural_gas'] = {
          value: provider,
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found gas provider: ${provider}`);
      }
    }
  }

  // STEP 2: FALLBACK - If no results found AND state is Florida, use FL defaults
  if (state.toUpperCase() === 'FL') {
    const cityLower = city.toLowerCase().trim();

    // Electric provider fallback
    if (!fields['104_electric_provider']) {
      const electricFallback = FL_UTILITY_FALLBACKS.electric[cityLower] || FL_UTILITY_FALLBACKS.electric.default;
      fields['104_electric_provider'] = {
        value: electricFallback,
        source: 'Fallback (FL Default)',
        confidence: 'Low',
      };
      console.log(`⚠️ [Tavily] Using FL electric fallback for ${city}: ${electricFallback}`);
    }

    // Water provider fallback
    if (!fields['106_water_provider']) {
      const waterFallback = FL_UTILITY_FALLBACKS.water[cityLower] || FL_UTILITY_FALLBACKS.water.default;
      fields['106_water_provider'] = {
        value: waterFallback,
        source: 'Fallback (FL Default)',
        confidence: 'Low',
      };
      console.log(`⚠️ [Tavily] Using FL water fallback for ${city}: ${waterFallback}`);
    }

    // Natural gas fallback
    if (!fields['109_natural_gas']) {
      const gasFallback = FL_UTILITY_FALLBACKS.gas[cityLower] || FL_UTILITY_FALLBACKS.gas.default;
      fields['109_natural_gas'] = {
        value: gasFallback,
        source: 'Fallback (FL Default)',
        confidence: 'Low',
      };
      console.log(`⚠️ [Tavily] Using FL gas fallback for ${city}: ${gasFallback}`);
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
 * Search for Market Performance Metrics (Fields 169-174)
 * REPURPOSED 2026-01-13: Changed from portal views to market metrics
 *
 * Fields searched:
 * - 169: months_of_inventory
 * - 170: new_listings_30d
 * - 171: homes_sold_30d
 * - 172: median_dom_zip
 * - 173: price_reduced_percent
 * - 174: homes_under_contract
 */
export async function searchMarketPerformance(city: string, state: string, zip: string): Promise<Record<string, any>> {
  const fields: Record<string, any> = {};

  console.log(`🔍 [Tavily] Searching market performance metrics for ${city}, ${state} ${zip}`);

  // Run all 6 field searches in PARALLEL for speed
  const [inventoryResult, newListingsResult, soldResult, domResult, priceReducedResult, contractResult] = await Promise.all([
    // Field 169: Months of Inventory
    tavilySearch(
      `"${city}, ${state}" months of inventory housing supply 2026`,
      { numResults: 5 }
    ),
    // Field 170: New Listings (30d)
    tavilySearch(
      `"${city}, ${state}" new listings last 30 days 2026`,
      { numResults: 5 }
    ),
    // Field 171: Homes Sold (30d)
    tavilySearch(
      `"${city}, ${state}" homes sold last 30 days closed sales 2026`,
      { numResults: 5 }
    ),
    // Field 172: Median DOM (ZIP)
    tavilySearch(
      `"${city}, ${state}" ${zip} median days on market 2026`,
      { numResults: 5 }
    ),
    // Field 173: Price Reduced %
    tavilySearch(
      `"${city}, ${state}" price reductions percentage listings 2026`,
      { numResults: 5 }
    ),
    // Field 174: Homes Under Contract
    tavilySearch(
      `"${city}, ${state}" homes under contract pending 2026`,
      { numResults: 5 }
    ),
  ]);

  // Extract Field 169: Months of Inventory
  for (const r of inventoryResult.results) {
    const match = r.content.match(/([\d\.]+)\s*months?\s+(?:of\s+)?(?:inventory|supply)/i) ||
                  r.content.match(/inventory[:\s]*([\d\.]+)\s*months?/i);
    if (match && !fields['169_months_of_inventory']) {
      const value = parseFloat(match[1]);
      if (value > 0 && value < 24) { // Sanity check
        fields['169_months_of_inventory'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found months of inventory: ${value}`);
        break;
      }
    }
  }

  // Extract Field 170: New Listings (30d)
  for (const r of newListingsResult.results) {
    const match = r.content.match(/([\d,]+)\s*new\s+listings?/i) ||
                  r.content.match(/recently\s+listed[:\s]*([\d,]+)/i);
    if (match && !fields['170_new_listings_30d']) {
      const value = parseInt(match[1].replace(/,/g, ''));
      if (value > 0 && value < 50000) { // Sanity check
        fields['170_new_listings_30d'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found new listings: ${value}`);
        break;
      }
    }
  }

  // Extract Field 171: Homes Sold (30d)
  for (const r of soldResult.results) {
    const match = r.content.match(/([\d,]+)\s*(?:homes?|properties)\s+sold/i) ||
                  r.content.match(/closed\s+sales?[:\s]*([\d,]+)/i);
    if (match && !fields['171_homes_sold_30d']) {
      const value = parseInt(match[1].replace(/,/g, ''));
      if (value > 0 && value < 50000) { // Sanity check
        fields['171_homes_sold_30d'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found homes sold: ${value}`);
        break;
      }
    }
  }

  // Extract Field 172: Median DOM (ZIP)
  for (const r of domResult.results) {
    const match = r.content.match(/median\s+days?\s+on\s+market[:\s]*([\d]+)/i) ||
                  r.content.match(/days?\s+on\s+market[:\s]*([\d]+)/i) ||
                  r.content.match(/([\d]+)\s*days?\s+(?:on\s+market|to\s+sell)/i);
    if (match && !fields['172_median_dom_zip']) {
      const value = parseInt(match[1]);
      if (value > 0 && value < 365) { // Sanity check
        fields['172_median_dom_zip'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found median DOM: ${value} days`);
        break;
      }
    }
  }

  // Extract Field 173: Price Reduced %
  for (const r of priceReducedResult.results) {
    const match = r.content.match(/([\d\.]+)%.*?price\s+redu/i) ||
                  r.content.match(/price\s+redu.*?([\d\.]+)%/i);
    if (match && !fields['173_price_reduced_percent']) {
      const value = parseFloat(match[1]);
      if (value >= 0 && value <= 100) { // Sanity check
        fields['173_price_reduced_percent'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found price reduced: ${value}%`);
        break;
      }
    }
  }

  // Extract Field 174: Homes Under Contract
  for (const r of contractResult.results) {
    const match = r.content.match(/([\d,]+)\s*(?:homes?)?\s*under\s+contract/i) ||
                  r.content.match(/([\d,]+)\s*pending/i);
    if (match && !fields['174_homes_under_contract']) {
      const value = parseInt(match[1].replace(/,/g, ''));
      if (value > 0 && value < 50000) { // Sanity check
        fields['174_homes_under_contract'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found homes under contract: ${value}`);
        break;
      }
    }
  }

  console.log(`✅ [Tavily] Market performance search returned ${Object.keys(fields).length} fields`);
  return fields;

}

/**
 * @deprecated Use searchMarketPerformance() instead
 * Kept for backwards compatibility - redirects to new function
 */
export async function searchPortalViews(address: string): Promise<Record<string, any>> {
  console.log('⚠️ [Tavily] searchPortalViews() is deprecated - use searchMarketPerformance()');
  // Return empty - caller should use searchMarketPerformance() with city/state/zip params
  return {};
}

/**
 * Search for Homestead Exemption and CDD status from county property appraiser
 * Fields: 151_homestead_yn, 152_cdd_yn, 153_annual_cdd_fee
 */
export async function searchHomesteadAndCDD(address: string, county: string): Promise<Record<string, any>> {
  const fields: Record<string, any> = {};

  // Determine county property appraiser domain
  const countyDomains: Record<string, string> = {
    'pinellas': 'pcpao.gov',
    'hillsborough': 'hcpafl.org',
    'pasco': 'pascopa.com',
    'manatee': 'manateepao.com',
    'sarasota': 'sc-pa.com',
    'polk': 'polkpa.org',
    'orange': 'ocpafl.org',
    'osceola': 'property-appraiser.org',
    'seminole': 'scpafl.org',
    'brevard': 'bcpao.us',
    'volusia': 'vcgov.org',
    'lee': 'leepa.org',
    'collier': 'collierappraiser.com',
    'palm beach': 'pbcgov.org',
    'broward': 'bcpa.net',
    'miami-dade': 'miamidade.gov',
  };

  const countyLower = county.toLowerCase().replace(' county', '').trim();
  const paoDomain = countyDomains[countyLower] || '';

  // Search for homestead exemption status
  const homesteadQuery = paoDomain
    ? `"${address}" homestead exemption site:${paoDomain}`
    : `"${address}" ${county} homestead exemption property appraiser`;

  console.log(`🔍 [Tavily] Searching homestead: "${homesteadQuery}"`);

  const homesteadResult = await tavilySearch(homesteadQuery, {
    numResults: 5,
    includeDomains: paoDomain ? [paoDomain] : undefined
  });

  for (const r of homesteadResult.results) {
    const content = r.content.toLowerCase();

    // Look for homestead exemption indicators
    if (content.match(/homestead.*exempt|exempt.*homestead|\$50,000.*homestead|homestead.*\$50,000/i)) {
      // Has homestead exemption
      if (!fields['151_homestead_yn']) {
        fields['151_homestead_yn'] = {
          value: 'Yes',
          source: 'Tavily (Property Appraiser)',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found homestead exemption: Yes`);
      }
    } else if (content.match(/no.*homestead|homestead.*none|no exemptions|exemptions:?\s*none/i)) {
      // No homestead exemption
      if (!fields['151_homestead_yn']) {
        fields['151_homestead_yn'] = {
          value: 'No',
          source: 'Tavily (Property Appraiser)',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found homestead exemption: No`);
      }
    }

    // Look for CDD indicators
    if (content.match(/community development district|cdd.*\$|cdd.*fee|cdd.*assessment/i)) {
      if (!fields['152_cdd_yn']) {
        fields['152_cdd_yn'] = {
          value: 'Yes',
          source: 'Tavily (Property Appraiser)',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found CDD: Yes`);
      }

      // Try to extract CDD fee amount
      const cddFeeMatch = r.content.match(/cdd.*?\$\s*([\d,]+(?:\.\d{2})?)|(?:cdd|community development).*?(?:fee|assessment).*?\$\s*([\d,]+(?:\.\d{2})?)/i);
      if (cddFeeMatch && !fields['153_annual_cdd_fee']) {
        const feeStr = cddFeeMatch[1] || cddFeeMatch[2];
        const fee = parseFloat(feeStr.replace(/,/g, ''));
        if (fee > 0 && fee < 10000) { // Sanity check
          fields['153_annual_cdd_fee'] = {
            value: fee,
            source: 'Tavily (Property Appraiser)',
            confidence: 'Medium',
          };
          console.log(`✅ [Tavily] Found CDD fee: $${fee}`);
        }
      }
    } else if (content.match(/no cdd|cdd:?\s*n\/a|not in.*cdd/i)) {
      if (!fields['152_cdd_yn']) {
        fields['152_cdd_yn'] = {
          value: 'No',
          source: 'Tavily (Property Appraiser)',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found CDD: No`);
      }
    }
  }

  // If we didn't find homestead info, try a broader search
  if (!fields['151_homestead_yn']) {
    const taxSearchQuery = `"${address}" ${county} property tax exemptions`;
    const taxResult = await tavilySearch(taxSearchQuery, { numResults: 3 });

    for (const r of taxResult.results) {
      if (r.content.match(/homestead.*yes|has homestead|homestead exemption active/i)) {
        fields['151_homestead_yn'] = {
          value: 'Yes',
          source: 'Tavily (Tax Records)',
          confidence: 'Low',
        };
        break;
      } else if (r.content.match(/no homestead|homestead.*no|no exemptions/i)) {
        fields['151_homestead_yn'] = {
          value: 'No',
          source: 'Tavily (Tax Records)',
          confidence: 'Low',
        };
        break;
      }
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
  // UPDATED 2026-01-13: Replaced searchPortalViews with searchMarketPerformance (fields 169-174)
  const [avmFields, marketFields, utilityFields, permitFields, marketPerfFields, homesteadFields] = await Promise.all([
    searchAVMs(address),
    searchMarketStats(city, zip),
    searchUtilities(city, state),
    searchPermits(address, county),
    searchMarketPerformance(city, state, zip), // Fields 169-174: market performance metrics
    searchHomesteadAndCDD(address, county), // Fields 151, 152, 153
  ]);

  // Merge all fields
  Object.assign(allFields, avmFields, marketFields, utilityFields, permitFields, marketPerfFields, homesteadFields);

  console.log(`✅ TIER 3: Tavily returned ${Object.keys(allFields).length} fields`);

  return allFields;
}

export const TAVILY_SOURCE = 'Tavily';
