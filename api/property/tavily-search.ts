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
 * Search for Paywall AVMs (16c-16f)
 * These are typically behind paywalls but may appear on public sites:
 * - First American AVM
 * - Quantarium AVM
 * - ICE AVM
 * - Collateral Analytics AVM
 * ADDED 2026-01-13: Search real estate portals, lender sites, property reports
 */
export async function searchPaywallAVMs(address: string): Promise<Record<string, any>> {
  const fields: Record<string, any> = {};

  console.log(`🔍 [Tavily] Searching paywall AVMs for ${address}`);

  // Run all 4 searches in PARALLEL
  const [firstAmResult, quantResult, iceResult, collateralResult] = await Promise.all([
    // Field 16c: First American AVM
    tavilySearch(
      `"${address}" "First American" AVM home value estimate`,
      { numResults: 5 }
    ),
    // Field 16d: Quantarium AVM
    tavilySearch(
      `"${address}" "Quantarium" AVM home value estimate`,
      { numResults: 5 }
    ),
    // Field 16e: ICE AVM (Intercontinental Exchange)
    tavilySearch(
      `"${address}" "ICE" AVM "automated valuation" home value`,
      { numResults: 5 }
    ),
    // Field 16f: Collateral Analytics AVM
    tavilySearch(
      `"${address}" "Collateral Analytics" AVM home value estimate`,
      { numResults: 5 }
    ),
  ]);

  // Extract Field 16c: First American AVM
  for (const r of firstAmResult.results) {
    const match = r.content.match(/First American.*?(?:AVM|value|estimate)[:\s]*\$?\s*([\d,]+)/i) ||
                  r.content.match(/\$?\s*([\d,]+).*?First American/i);
    if (match && !fields['16c_first_american_avm']) {
      const value = parseInt(match[1].replace(/,/g, ''));
      if (value > 10000 && value < 50000000) { // Sanity check
        fields['16c_first_american_avm'] = {
          value: value,
          source: 'Tavily (First American)',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found First American AVM: $${value.toLocaleString()}`);
        break;
      }
    }
  }

  // Extract Field 16d: Quantarium AVM
  for (const r of quantResult.results) {
    const match = r.content.match(/Quantarium.*?(?:AVM|value|estimate)[:\s]*\$?\s*([\d,]+)/i) ||
                  r.content.match(/\$?\s*([\d,]+).*?Quantarium/i);
    if (match && !fields['16d_quantarium_avm']) {
      const value = parseInt(match[1].replace(/,/g, ''));
      if (value > 10000 && value < 50000000) { // Sanity check
        fields['16d_quantarium_avm'] = {
          value: value,
          source: 'Tavily (Quantarium)',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found Quantarium AVM: $${value.toLocaleString()}`);
        break;
      }
    }
  }

  // Extract Field 16e: ICE AVM
  for (const r of iceResult.results) {
    const match = r.content.match(/ICE.*?(?:AVM|value|estimate)[:\s]*\$?\s*([\d,]+)/i) ||
                  r.content.match(/\$?\s*([\d,]+).*?ICE.*?AVM/i);
    if (match && !fields['16e_ice_avm']) {
      const value = parseInt(match[1].replace(/,/g, ''));
      if (value > 10000 && value < 50000000) { // Sanity check
        fields['16e_ice_avm'] = {
          value: value,
          source: 'Tavily (ICE)',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found ICE AVM: $${value.toLocaleString()}`);
        break;
      }
    }
  }

  // Extract Field 16f: Collateral Analytics AVM
  for (const r of collateralResult.results) {
    const match = r.content.match(/Collateral Analytics.*?(?:AVM|value|estimate)[:\s]*\$?\s*([\d,]+)/i) ||
                  r.content.match(/\$?\s*([\d,]+).*?Collateral Analytics/i);
    if (match && !fields['16f_collateral_analytics_avm']) {
      const value = parseInt(match[1].replace(/,/g, ''));
      if (value > 10000 && value < 50000000) { // Sanity check
        fields['16f_collateral_analytics_avm'] = {
          value: value,
          source: 'Tavily (Collateral Analytics)',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found Collateral Analytics AVM: $${value.toLocaleString()}`);
        break;
      }
    }
  }

  console.log(`✅ [Tavily] Paywall AVM search returned ${Object.keys(fields).length} fields`);
  return fields;
}

/**
 * Search for Market Statistics (Fields 91-98)
 * - 91: median_home_price_neighborhood
 * - 92: price_per_sqft_recent_avg
 * - 93: avg_sale_to_list_ratio
 * - 94: appreciation_1yr
 * - 95: days_on_market_avg
 * - 96: inventory_level
 * - 97: sale_price_median
 * - 98: list_price_median
 * EXPANDED 2026-01-13: Added fields 93, 94, 96, 97, 98
 */
export async function searchMarketStats(city: string, zip: string): Promise<Record<string, any>> {
  const fields: Record<string, any> = {};

  console.log(`🔍 [Tavily] Searching market stats for ${city} ${zip}`);

  // Run searches in PARALLEL for more comprehensive coverage
  const [basicResult, ratioResult, appreciationResult] = await Promise.all([
    // Fields 91, 92, 95, 97, 98: Basic market stats
    tavilySearch(
      `"${city}" ${zip} median home price sale price list price days on market 2026`,
      { numResults: 5 }
    ),
    // Fields 93, 96: Sale-to-list ratio and inventory
    tavilySearch(
      `"${city}" ${zip} sale to list ratio inventory months supply 2026`,
      { numResults: 5 }
    ),
    // Field 94: Appreciation
    tavilySearch(
      `"${city}" ${zip} home price appreciation year over year change 2026`,
      { numResults: 5 }
    ),
  ]);

  // Extract from basic results
  for (const r of basicResult.results) {
    // Field 91: Median Home Price (neighborhood)
    const medianMatch = r.content.match(/median.*?(?:home|house)?\s*price.*?\$\s*([\d,]+)/i) ||
                        r.content.match(/\$\s*([\d,]+).*?median/i);
    if (medianMatch && !fields['91_median_home_price_neighborhood']) {
      const value = parseInt(medianMatch[1].replace(/,/g, ''));
      if (value > 50000 && value < 10000000) {
        fields['91_median_home_price_neighborhood'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found median home price: $${value.toLocaleString()}`);
      }
    }

    // Field 92: Price per sqft
    const psfMatch = r.content.match(/\$\s*([\d]+)\s*(?:per|\/)\s*(?:sq\.?\s*ft|sqft)/i) ||
                     r.content.match(/([\d]+)\s*(?:per|\/)\s*(?:sq\.?\s*ft|sqft)/i);
    if (psfMatch && !fields['92_price_per_sqft_recent_avg']) {
      const value = parseInt(psfMatch[1]);
      if (value > 50 && value < 2000) {
        fields['92_price_per_sqft_recent_avg'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found price per sqft: $${value}`);
      }
    }

    // Field 95: Days on Market
    const domMatch = r.content.match(/(\d+)\s*(?:days?\s*on\s*market|DOM|average\s*days)/i);
    if (domMatch && !fields['95_days_on_market_avg']) {
      const value = parseInt(domMatch[1]);
      if (value > 0 && value < 365) {
        fields['95_days_on_market_avg'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found days on market: ${value}`);
      }
    }

    // Field 97: Median Sale Price
    const saleMatch = r.content.match(/median\s*sale\s*price.*?\$\s*([\d,]+)/i) ||
                      r.content.match(/sold\s*(?:for)?\s*median.*?\$\s*([\d,]+)/i);
    if (saleMatch && !fields['97_sale_price_median']) {
      const value = parseInt(saleMatch[1].replace(/,/g, ''));
      if (value > 50000 && value < 10000000) {
        fields['97_sale_price_median'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found median sale price: $${value.toLocaleString()}`);
      }
    }

    // Field 98: Median List Price
    const listMatch = r.content.match(/median\s*list\s*price.*?\$\s*([\d,]+)/i) ||
                      r.content.match(/list(?:ed)?\s*(?:for)?\s*median.*?\$\s*([\d,]+)/i);
    if (listMatch && !fields['98_list_price_median']) {
      const value = parseInt(listMatch[1].replace(/,/g, ''));
      if (value > 50000 && value < 10000000) {
        fields['98_list_price_median'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found median list price: $${value.toLocaleString()}`);
      }
    }
  }

  // Extract from ratio/inventory results
  for (const r of ratioResult.results) {
    // Field 93: Sale-to-List Ratio
    const ratioMatch = r.content.match(/sale[- ]to[- ]list.*?([\d.]+)%/i) ||
                       r.content.match(/([\d.]+)%.*?sale[- ]to[- ]list/i) ||
                       r.content.match(/sold\s+(?:for|at).*?([\d.]+)%\s*(?:of)?\s*(?:list|asking)/i);
    if (ratioMatch && !fields['93_avg_sale_to_list_ratio']) {
      const value = parseFloat(ratioMatch[1]);
      if (value > 80 && value < 120) {
        fields['93_avg_sale_to_list_ratio'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found sale-to-list ratio: ${value}%`);
      }
    }

    // Field 96: Inventory Level
    const inventoryMatch = r.content.match(/([\d.]+)\s*months?\s*(?:of)?\s*(?:supply|inventory)/i) ||
                           r.content.match(/inventory.*?([\d.]+)\s*months?/i);
    if (inventoryMatch && !fields['96_inventory_level']) {
      const value = parseFloat(inventoryMatch[1]);
      if (value > 0 && value < 24) {
        fields['96_inventory_level'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found inventory level: ${value} months`);
      }
    }
  }

  // Extract from appreciation results
  for (const r of appreciationResult.results) {
    // Field 94: Appreciation 1yr
    const appreciationMatch = r.content.match(/(?:appreciation|increase|grew|up).*?([\d.]+)%/i) ||
                              r.content.match(/([\d.]+)%.*?(?:year|annual|yoy|y-o-y)/i) ||
                              r.content.match(/prices?\s*(?:rose|increased|up).*?([\d.]+)%/i);
    if (appreciationMatch && !fields['94_appreciation_1yr']) {
      let value = parseFloat(appreciationMatch[1]);
      // Check for negative appreciation (depreciation)
      if (r.content.match(/(?:decrease|decline|down|fell|dropped).*?([\d.]+)%/i)) {
        value = -value;
      }
      if (value > -50 && value < 50) {
        fields['94_appreciation_1yr'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found appreciation: ${value}%`);
      }
    }
  }

  console.log(`✅ [Tavily] Market stats search returned ${Object.keys(fields).length} fields`);
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
 * Search for Utility Bill Estimates (Fields 105, 107-108, 110-116)
 * - 105: electric_bill_avg (monthly average)
 * - 107: water_bill_avg (monthly average)
 * - 108: sewer_bill_avg (monthly average)
 * - 110: trash_bill_avg (monthly average)
 * - 111: cable_internet_avg (monthly average)
 * - 112: total_utilities_avg (monthly total)
 * - 113: solar_panels_yn
 * - 114: solar_owned_leased
 * - 115: solar_monthly_savings
 * - 116: utility_included_in_hoa
 * ADDED 2026-01-13: Utility cost estimates for property analysis
 */
export async function searchUtilityBills(city: string, state: string, zip: string): Promise<Record<string, any>> {
  const fields: Record<string, any> = {};

  console.log(`🔍 [Tavily] Searching utility bill estimates for ${city}, ${state} ${zip}`);

  // Run searches in PARALLEL
  const [electricResult, waterResult, totalResult, solarResult] = await Promise.all([
    // Field 105: Electric bill average
    tavilySearch(
      `"${city}, ${state}" average electric bill monthly cost 2026`,
      { numResults: 5 }
    ),
    // Fields 107, 108, 110: Water, Sewer, Trash bills
    tavilySearch(
      `"${city}, ${state}" average water sewer trash utility bills monthly 2026`,
      { numResults: 5 }
    ),
    // Fields 111, 112: Cable/Internet and Total utilities
    tavilySearch(
      `"${city}, ${state}" average utilities cost monthly internet cable 2026`,
      { numResults: 5 }
    ),
    // Fields 113-116: Solar information
    tavilySearch(
      `"${zip}" solar panels savings lease owned Florida`,
      { numResults: 5 }
    ),
  ]);

  // Extract Field 105: Electric Bill Average
  for (const r of electricResult.results) {
    const match = r.content.match(/(?:average|typical).*electric.*?\$\s*([\d,]+)/i) ||
                  r.content.match(/electric.*?(?:bill|cost).*?\$\s*([\d,]+)/i) ||
                  r.content.match(/\$\s*([\d,]+).*?(?:month|monthly).*electric/i);
    if (match && !fields['105_electric_bill_avg']) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      if (value > 20 && value < 1000) { // Sanity check
        fields['105_electric_bill_avg'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found electric bill avg: $${value}`);
        break;
      }
    }
  }

  // Extract Fields 107, 108, 110: Water, Sewer, Trash
  for (const r of waterResult.results) {
    // Water bill
    const waterMatch = r.content.match(/water.*?(?:bill|cost).*?\$\s*([\d,]+)/i) ||
                       r.content.match(/\$\s*([\d,]+).*?water/i);
    if (waterMatch && !fields['107_water_bill_avg']) {
      const value = parseFloat(waterMatch[1].replace(/,/g, ''));
      if (value > 10 && value < 500) {
        fields['107_water_bill_avg'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found water bill avg: $${value}`);
      }
    }

    // Sewer bill
    const sewerMatch = r.content.match(/sewer.*?(?:bill|cost).*?\$\s*([\d,]+)/i) ||
                       r.content.match(/\$\s*([\d,]+).*?sewer/i);
    if (sewerMatch && !fields['108_sewer_bill_avg']) {
      const value = parseFloat(sewerMatch[1].replace(/,/g, ''));
      if (value > 10 && value < 300) {
        fields['108_sewer_bill_avg'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found sewer bill avg: $${value}`);
      }
    }

    // Trash bill
    const trashMatch = r.content.match(/(?:trash|garbage|waste).*?(?:bill|cost).*?\$\s*([\d,]+)/i) ||
                       r.content.match(/\$\s*([\d,]+).*?(?:trash|garbage)/i);
    if (trashMatch && !fields['110_trash_bill_avg']) {
      const value = parseFloat(trashMatch[1].replace(/,/g, ''));
      if (value > 10 && value < 200) {
        fields['110_trash_bill_avg'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found trash bill avg: $${value}`);
      }
    }
  }

  // Extract Fields 111, 112: Cable/Internet and Total utilities
  for (const r of totalResult.results) {
    // Cable/Internet
    const internetMatch = r.content.match(/(?:internet|cable).*?\$\s*([\d,]+)/i) ||
                          r.content.match(/\$\s*([\d,]+).*?(?:internet|cable)/i);
    if (internetMatch && !fields['111_cable_internet_avg']) {
      const value = parseFloat(internetMatch[1].replace(/,/g, ''));
      if (value > 30 && value < 400) {
        fields['111_cable_internet_avg'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found cable/internet avg: $${value}`);
      }
    }

    // Total utilities
    const totalMatch = r.content.match(/total\s+utilit.*?\$\s*([\d,]+)/i) ||
                       r.content.match(/utilit.*?total.*?\$\s*([\d,]+)/i);
    if (totalMatch && !fields['112_total_utilities_avg']) {
      const value = parseFloat(totalMatch[1].replace(/,/g, ''));
      if (value > 100 && value < 2000) {
        fields['112_total_utilities_avg'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found total utilities avg: $${value}`);
      }
    }
  }

  // Extract Fields 113-116: Solar information
  for (const r of solarResult.results) {
    // Field 113: Solar panels Y/N
    if (!fields['113_solar_panels_yn']) {
      if (r.content.match(/solar\s+panel|has\s+solar|with\s+solar/i)) {
        fields['113_solar_panels_yn'] = {
          value: 'Yes',
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found solar panels: Yes`);
      }
    }

    // Field 114: Solar owned/leased
    if (!fields['114_solar_owned_leased']) {
      if (r.content.match(/solar.*owned|owns?\s+solar/i)) {
        fields['114_solar_owned_leased'] = {
          value: 'Owned',
          source: 'Tavily',
          confidence: 'Low',
        };
      } else if (r.content.match(/solar.*lease|leased\s+solar/i)) {
        fields['114_solar_owned_leased'] = {
          value: 'Leased',
          source: 'Tavily',
          confidence: 'Low',
        };
      }
    }

    // Field 115: Solar monthly savings
    const savingsMatch = r.content.match(/solar.*sav.*?\$\s*([\d,]+)/i) ||
                         r.content.match(/\$\s*([\d,]+).*?sav.*solar/i);
    if (savingsMatch && !fields['115_solar_monthly_savings']) {
      const value = parseFloat(savingsMatch[1].replace(/,/g, ''));
      if (value > 20 && value < 500) {
        fields['115_solar_monthly_savings'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found solar savings: $${value}`);
      }
    }
  }

  console.log(`✅ [Tavily] Utility bills search returned ${Object.keys(fields).length} fields`);
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

    // Field 62: Other permits (electrical, plumbing, structural, etc.)
    if (!fields['62_permit_history_other']) {
      const otherPermitMatch = r.content.match(/(electrical|plumbing|structural|addition|remodel|pool|fence|solar).*permit|permit.*(electrical|plumbing|structural|addition|remodel|pool|fence|solar)/i);
      if (otherPermitMatch) {
        fields['62_permit_history_other'] = {
          value: `${otherPermitMatch[1] || otherPermitMatch[2]} permit found - see county records`,
          source: 'Tavily',
          confidence: 'Low',
        };
      }
    }
  }

  return fields;
}

/**
 * Search for Property Age Estimates and Renovations (Fields 40, 46, 59)
 * - 40: roof_age_est (estimated roof age in years)
 * - 46: hvac_age (estimated HVAC age in years)
 * - 59: recent_renovations (list of recent renovations)
 * ADDED 2026-01-13: Critical for property condition assessment
 */
export async function searchAgeAndRenovations(address: string, county: string): Promise<Record<string, any>> {
  const fields: Record<string, any> = {};

  console.log(`🔍 [Tavily] Searching age estimates and renovations for ${address}`);

  // Run searches in PARALLEL
  const [roofResult, hvacResult, renovationResult] = await Promise.all([
    // Field 40: Roof Age Estimate
    tavilySearch(
      `"${address}" roof age years installed replaced`,
      { numResults: 5 }
    ),
    // Field 46: HVAC Age Estimate
    tavilySearch(
      `"${address}" HVAC "air conditioning" age years installed replaced`,
      { numResults: 5 }
    ),
    // Field 59: Recent Renovations
    tavilySearch(
      `"${address}" renovations remodel updated upgraded kitchen bathroom`,
      { numResults: 5 }
    ),
  ]);

  // Extract Field 40: Roof Age Estimate
  for (const r of roofResult.results) {
    // Try to find year installed/replaced
    const yearMatch = r.content.match(/roof.*(?:installed|replaced|new).*(?:in\s+)?(\d{4})/i) ||
                      r.content.match(/(\d{4}).*(?:roof|shingles?).*(?:installed|replaced|new)/i);
    if (yearMatch && !fields['40_roof_age_est']) {
      const year = parseInt(yearMatch[1]);
      const currentYear = new Date().getFullYear();
      if (year >= 1970 && year <= currentYear) {
        const age = currentYear - year;
        fields['40_roof_age_est'] = {
          value: age,
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found roof age: ${age} years (installed ${year})`);
        break;
      }
    }
    // Try to find age directly stated
    const ageMatch = r.content.match(/roof.*(\d+)\s*(?:year|yr)s?\s*old/i) ||
                     r.content.match(/(\d+)\s*(?:year|yr)s?\s*old.*roof/i);
    if (ageMatch && !fields['40_roof_age_est']) {
      const age = parseInt(ageMatch[1]);
      if (age >= 0 && age <= 50) {
        fields['40_roof_age_est'] = {
          value: age,
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found roof age: ${age} years`);
        break;
      }
    }
  }

  // Extract Field 46: HVAC Age Estimate
  for (const r of hvacResult.results) {
    // Try to find year installed/replaced
    const yearMatch = r.content.match(/(?:HVAC|AC|air condition).*(?:installed|replaced|new).*(?:in\s+)?(\d{4})/i) ||
                      r.content.match(/(\d{4}).*(?:HVAC|AC|air condition).*(?:installed|replaced|new)/i);
    if (yearMatch && !fields['46_hvac_age']) {
      const year = parseInt(yearMatch[1]);
      const currentYear = new Date().getFullYear();
      if (year >= 1980 && year <= currentYear) {
        const age = currentYear - year;
        fields['46_hvac_age'] = {
          value: age,
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found HVAC age: ${age} years (installed ${year})`);
        break;
      }
    }
    // Try to find age directly stated
    const ageMatch = r.content.match(/(?:HVAC|AC|air condition).*(\d+)\s*(?:year|yr)s?\s*old/i) ||
                     r.content.match(/(\d+)\s*(?:year|yr)s?\s*old.*(?:HVAC|AC|air condition)/i);
    if (ageMatch && !fields['46_hvac_age']) {
      const age = parseInt(ageMatch[1]);
      if (age >= 0 && age <= 30) {
        fields['46_hvac_age'] = {
          value: age,
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found HVAC age: ${age} years`);
        break;
      }
    }
  }

  // Extract Field 59: Recent Renovations
  for (const r of renovationResult.results) {
    const renovations: string[] = [];

    if (r.content.match(/(?:new|updated|remodel|renovated).*kitchen/i)) renovations.push('Kitchen');
    if (r.content.match(/(?:new|updated|remodel|renovated).*bathroom/i)) renovations.push('Bathroom');
    if (r.content.match(/(?:new|updated|remodel|renovated).*floor/i)) renovations.push('Flooring');
    if (r.content.match(/(?:new|updated|remodel|renovated).*window/i)) renovations.push('Windows');
    if (r.content.match(/(?:new|updated|remodel|renovated).*(?:appliance|stainless)/i)) renovations.push('Appliances');
    if (r.content.match(/pool.*(?:install|add|new)|(?:new|added).*pool/i)) renovations.push('Pool');
    if (r.content.match(/(?:new|updated).*(?:paint|exterior)/i)) renovations.push('Paint/Exterior');
    if (r.content.match(/(?:addition|expand|extended)/i)) renovations.push('Addition');

    if (renovations.length > 0 && !fields['59_recent_renovations']) {
      fields['59_recent_renovations'] = {
        value: renovations.join(', '),
        source: 'Tavily',
        confidence: 'Low',
      };
      console.log(`✅ [Tavily] Found renovations: ${renovations.join(', ')}`);
      break;
    }
  }

  console.log(`✅ [Tavily] Age/renovation search returned ${Object.keys(fields).length} fields`);
  return fields;
}

/**
 * Search for Property Features (Fields 131-138)
 * - 131: pool_yn (Yes/No)
 * - 132: pool_type (In-ground, Above-ground, etc.)
 * - 133: ev_charging (Yes/No)
 * - 134: smart_home_features (list)
 * - 135: accessibility_modifications (list)
 * - 136: outdoor_kitchen (Yes/No)
 * - 137: hurricane_shutters (Yes/No)
 * - 138: special_assessments (amount or list)
 * ADDED 2026-01-13: Property feature searches for Florida homes
 */
export async function searchPropertyFeatures(address: string, city: string): Promise<Record<string, any>> {
  const fields: Record<string, any> = {};

  console.log(`🔍 [Tavily] Searching property features for ${address}`);

  // Run searches in PARALLEL
  const [poolResult, techResult, outdoorResult, assessmentResult] = await Promise.all([
    // Fields 131, 132: Pool information
    tavilySearch(
      `"${address}" pool swimming pool in-ground above-ground`,
      { numResults: 5 }
    ),
    // Fields 133, 134: Tech features (EV charging, smart home)
    tavilySearch(
      `"${address}" EV charging smart home features thermostat security`,
      { numResults: 5 }
    ),
    // Fields 135, 136, 137: Outdoor/accessibility features
    tavilySearch(
      `"${address}" outdoor kitchen hurricane shutters accessibility wheelchair`,
      { numResults: 5 }
    ),
    // Field 138: Special assessments
    tavilySearch(
      `"${address}" "${city}" special assessment CDD bond`,
      { numResults: 5 }
    ),
  ]);

  // Extract Fields 131, 132: Pool information
  for (const r of poolResult.results) {
    // Field 131: Pool Y/N
    if (!fields['131_pool_yn']) {
      if (r.content.match(/(?:has|with|includes?)\s*(?:a\s+)?pool|pool\s*(?:yes|included)/i) ||
          r.content.match(/swimming\s*pool|heated\s*pool|in[- ]ground\s*pool/i)) {
        fields['131_pool_yn'] = {
          value: 'Yes',
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found pool: Yes`);
      } else if (r.content.match(/no\s*pool|pool:?\s*no|without\s*pool/i)) {
        fields['131_pool_yn'] = {
          value: 'No',
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found pool: No`);
      }
    }

    // Field 132: Pool type
    if (!fields['132_pool_type']) {
      if (r.content.match(/in[- ]ground\s*pool/i)) {
        fields['132_pool_type'] = { value: 'In-ground', source: 'Tavily', confidence: 'Low' };
      } else if (r.content.match(/above[- ]ground\s*pool/i)) {
        fields['132_pool_type'] = { value: 'Above-ground', source: 'Tavily', confidence: 'Low' };
      } else if (r.content.match(/heated\s*pool/i)) {
        fields['132_pool_type'] = { value: 'Heated', source: 'Tavily', confidence: 'Low' };
      } else if (r.content.match(/screened?\s*pool/i)) {
        fields['132_pool_type'] = { value: 'Screened', source: 'Tavily', confidence: 'Low' };
      }
    }
  }

  // Extract Fields 133, 134: Tech features
  for (const r of techResult.results) {
    // Field 133: EV Charging
    if (!fields['133_ev_charging']) {
      if (r.content.match(/EV\s*charg|electric\s*vehicle\s*charg|Tesla\s*charg|Level\s*2\s*charg/i)) {
        fields['133_ev_charging'] = {
          value: 'Yes',
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found EV charging: Yes`);
      }
    }

    // Field 134: Smart home features
    if (!fields['134_smart_home_features']) {
      const smartFeatures: string[] = [];
      if (r.content.match(/smart\s*thermostat|Nest|ecobee/i)) smartFeatures.push('Smart Thermostat');
      if (r.content.match(/smart\s*lock|keyless\s*entry/i)) smartFeatures.push('Smart Lock');
      if (r.content.match(/smart\s*lighting|smart\s*lights/i)) smartFeatures.push('Smart Lighting');
      if (r.content.match(/Ring|video\s*doorbell|security\s*camera/i)) smartFeatures.push('Security System');
      if (r.content.match(/smart\s*home\s*hub|Alexa|Google\s*Home/i)) smartFeatures.push('Smart Hub');

      if (smartFeatures.length > 0) {
        fields['134_smart_home_features'] = {
          value: smartFeatures.join(', '),
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found smart features: ${smartFeatures.join(', ')}`);
      }
    }
  }

  // Extract Fields 135, 136, 137: Outdoor/accessibility features
  for (const r of outdoorResult.results) {
    // Field 135: Accessibility modifications
    if (!fields['135_accessibility_modifications']) {
      const accessFeatures: string[] = [];
      if (r.content.match(/wheelchair\s*accessible|ADA\s*compliant/i)) accessFeatures.push('Wheelchair Accessible');
      if (r.content.match(/grab\s*bar|handicap\s*bath/i)) accessFeatures.push('Grab Bars');
      if (r.content.match(/walk[- ]in\s*shower|roll[- ]in\s*shower/i)) accessFeatures.push('Walk-in Shower');
      if (r.content.match(/ramp|no[- ]step\s*entry/i)) accessFeatures.push('Ramp/No-step Entry');

      if (accessFeatures.length > 0) {
        fields['135_accessibility_modifications'] = {
          value: accessFeatures.join(', '),
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found accessibility: ${accessFeatures.join(', ')}`);
      }
    }

    // Field 136: Outdoor kitchen
    if (!fields['136_outdoor_kitchen']) {
      if (r.content.match(/outdoor\s*kitchen|summer\s*kitchen|built[- ]in\s*grill|outdoor\s*cooking/i)) {
        fields['136_outdoor_kitchen'] = {
          value: 'Yes',
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found outdoor kitchen: Yes`);
      }
    }

    // Field 137: Hurricane shutters
    if (!fields['137_hurricane_shutters']) {
      if (r.content.match(/hurricane\s*shutter|storm\s*shutter|impact\s*window|impact[- ]resistant/i)) {
        fields['137_hurricane_shutters'] = {
          value: 'Yes',
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found hurricane shutters: Yes`);
      }
    }
  }

  // Extract Field 138: Special assessments
  for (const r of assessmentResult.results) {
    if (!fields['138_special_assessments']) {
      const assessmentMatch = r.content.match(/special\s*assessment.*?\$\s*([\d,]+)/i) ||
                              r.content.match(/assessment.*?\$\s*([\d,]+)/i);
      if (assessmentMatch) {
        const value = parseFloat(assessmentMatch[1].replace(/,/g, ''));
        if (value > 0 && value < 100000) {
          fields['138_special_assessments'] = {
            value: `$${value.toLocaleString()}`,
            source: 'Tavily',
            confidence: 'Low',
          };
          console.log(`✅ [Tavily] Found special assessment: $${value.toLocaleString()}`);
        }
      } else if (r.content.match(/no\s*special\s*assessment|assessment[:\s]*none/i)) {
        fields['138_special_assessments'] = {
          value: 'None',
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found special assessment: None`);
      }
    }
  }

  console.log(`✅ [Tavily] Property features search returned ${Object.keys(fields).length} fields`);
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

  // ADDED 2026-01-13: Additional market performance metrics (175-181)
  // Run additional searches in PARALLEL
  const [marketTypeResult, forecastResult, rentalResult] = await Promise.all([
    // Fields 175, 176, 177: Market type indicators
    tavilySearch(
      `"${city}, ${state}" buyer seller market absorption rate list price change 2026`,
      { numResults: 5 }
    ),
    // Field 178: Price growth forecast
    tavilySearch(
      `"${city}, ${state}" home price forecast prediction 2026 2027`,
      { numResults: 5 }
    ),
    // Fields 179, 180, 181: Rental/investment metrics
    tavilySearch(
      `"${city}, ${state}" rental yield cap rate gross rent multiplier investment 2026`,
      { numResults: 5 }
    ),
  ]);

  // Extract Fields 175, 176, 177: Market type indicators
  for (const r of marketTypeResult.results) {
    // Field 175: Avg List Price Change
    const listChangeMatch = r.content.match(/list\s*price.*?([-+]?[\d.]+)%/i) ||
                            r.content.match(/([-+]?[\d.]+)%.*?list\s*price/i);
    if (listChangeMatch && !fields['175_avg_list_price_change']) {
      let value = parseFloat(listChangeMatch[1]);
      if (r.content.match(/decrease|down|fell|dropped/i) && value > 0) {
        value = -value;
      }
      if (value > -50 && value < 50) {
        fields['175_avg_list_price_change'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found list price change: ${value}%`);
      }
    }

    // Field 176: Buyer vs Seller Market
    if (!fields['176_buyer_vs_seller_market']) {
      if (r.content.match(/seller['']?s?\s*market|strong\s*seller|favor.*seller/i)) {
        fields['176_buyer_vs_seller_market'] = {
          value: "Seller's Market",
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found market type: Seller's Market`);
      } else if (r.content.match(/buyer['']?s?\s*market|strong\s*buyer|favor.*buyer/i)) {
        fields['176_buyer_vs_seller_market'] = {
          value: "Buyer's Market",
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found market type: Buyer's Market`);
      } else if (r.content.match(/balanced\s*market|neutral\s*market/i)) {
        fields['176_buyer_vs_seller_market'] = {
          value: 'Balanced Market',
          source: 'Tavily',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found market type: Balanced Market`);
      }
    }

    // Field 177: Absorption Rate
    const absorptionMatch = r.content.match(/absorption\s*rate[:\s]*([\d.]+)%?/i) ||
                            r.content.match(/([\d.]+)%?\s*absorption/i);
    if (absorptionMatch && !fields['177_absorption_rate']) {
      const value = parseFloat(absorptionMatch[1]);
      if (value > 0 && value < 200) {
        fields['177_absorption_rate'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found absorption rate: ${value}%`);
      }
    }
  }

  // Extract Field 178: Price Growth Forecast
  for (const r of forecastResult.results) {
    const forecastMatch = r.content.match(/(?:forecast|predict|expect).*?([-+]?[\d.]+)%/i) ||
                          r.content.match(/([-+]?[\d.]+)%.*?(?:forecast|growth|increase)/i);
    if (forecastMatch && !fields['178_price_growth_forecast']) {
      let value = parseFloat(forecastMatch[1]);
      if (r.content.match(/decline|decrease|fall|drop/i) && value > 0) {
        value = -value;
      }
      if (value > -30 && value < 30) {
        fields['178_price_growth_forecast'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found price forecast: ${value}%`);
      }
    }
  }

  // Extract Fields 179, 180, 181: Rental/investment metrics
  for (const r of rentalResult.results) {
    // Field 179: Rental Yield Estimate
    const yieldMatch = r.content.match(/rental\s*yield[:\s]*([\d.]+)%/i) ||
                       r.content.match(/([\d.]+)%.*?rental\s*yield/i) ||
                       r.content.match(/yield[:\s]*([\d.]+)%/i);
    if (yieldMatch && !fields['179_rental_yield_estimate']) {
      const value = parseFloat(yieldMatch[1]);
      if (value > 0 && value < 20) {
        fields['179_rental_yield_estimate'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found rental yield: ${value}%`);
      }
    }

    // Field 180: Cap Rate Estimate
    const capMatch = r.content.match(/cap\s*rate[:\s]*([\d.]+)%/i) ||
                     r.content.match(/([\d.]+)%.*?cap\s*rate/i);
    if (capMatch && !fields['180_cap_rate_estimate']) {
      const value = parseFloat(capMatch[1]);
      if (value > 0 && value < 15) {
        fields['180_cap_rate_estimate'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found cap rate: ${value}%`);
      }
    }

    // Field 181: Gross Rent Multiplier
    const grmMatch = r.content.match(/gross\s*rent\s*multiplier[:\s]*([\d.]+)/i) ||
                     r.content.match(/GRM[:\s]*([\d.]+)/i) ||
                     r.content.match(/([\d.]+)\s*(?:x|times).*?rent/i);
    if (grmMatch && !fields['181_gross_rent_multiplier']) {
      const value = parseFloat(grmMatch[1]);
      if (value > 5 && value < 50) {
        fields['181_gross_rent_multiplier'] = {
          value: value,
          source: 'Tavily',
          confidence: 'Low',
        };
        console.log(`✅ [Tavily] Found GRM: ${value}`);
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
 * Search for Tax Data from county property appraiser
 * Fields: 15_assessed_value, 35_annual_taxes, 38_tax_exemptions
 * Field 37 (property_tax_rate) is backend-calculated from 15 and 35
 * ADDED 2026-01-13: Critical fields for property tax calculations
 */
export async function searchTaxData(address: string, county: string): Promise<Record<string, any>> {
  const fields: Record<string, any> = {};

  // County property appraiser domains (Florida)
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

  console.log(`🔍 [Tavily] Searching tax data for ${address} in ${county}`);

  // Run searches in PARALLEL
  const [assessedResult, taxResult, exemptionResult] = await Promise.all([
    // Field 15: Assessed Value
    tavilySearch(
      paoDomain
        ? `site:${paoDomain} "${address}" assessed value`
        : `"${address}" ${county} property appraiser assessed value`,
      { numResults: 5, includeDomains: paoDomain ? [paoDomain] : undefined }
    ),
    // Field 35: Annual Taxes
    tavilySearch(
      paoDomain
        ? `site:${paoDomain} "${address}" property taxes annual`
        : `"${address}" ${county} property tax bill annual taxes`,
      { numResults: 5, includeDomains: paoDomain ? [paoDomain] : undefined }
    ),
    // Field 38: Tax Exemptions
    tavilySearch(
      paoDomain
        ? `site:${paoDomain} "${address}" exemptions`
        : `"${address}" ${county} property tax exemptions homestead`,
      { numResults: 5, includeDomains: paoDomain ? [paoDomain] : undefined }
    ),
  ]);

  // Extract Field 15: Assessed Value
  for (const r of assessedResult.results) {
    const match = r.content.match(/assessed\s+value[:\s]*\$?\s*([\d,]+)/i) ||
                  r.content.match(/just\s+value[:\s]*\$?\s*([\d,]+)/i) ||
                  r.content.match(/market\s+value[:\s]*\$?\s*([\d,]+)/i);
    if (match && !fields['15_assessed_value']) {
      const value = parseInt(match[1].replace(/,/g, ''));
      if (value > 10000 && value < 50000000) { // Sanity check
        fields['15_assessed_value'] = {
          value: value,
          source: 'Tavily (Property Appraiser)',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found assessed value: $${value.toLocaleString()}`);
        break;
      }
    }
  }

  // Extract Field 35: Annual Taxes
  for (const r of taxResult.results) {
    const match = r.content.match(/(?:annual|total)\s+tax(?:es)?[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i) ||
                  r.content.match(/property\s+tax(?:es)?[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i) ||
                  r.content.match(/tax\s+(?:amount|bill)[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i);
    if (match && !fields['35_annual_taxes']) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      if (value > 100 && value < 500000) { // Sanity check
        fields['35_annual_taxes'] = {
          value: value,
          source: 'Tavily (Property Appraiser)',
          confidence: 'Medium',
        };
        console.log(`✅ [Tavily] Found annual taxes: $${value.toLocaleString()}`);
        break;
      }
    }
  }

  // Extract Field 38: Tax Exemptions
  for (const r of exemptionResult.results) {
    // Look for exemption types
    const exemptions: string[] = [];
    if (r.content.match(/homestead\s+exempt/i)) exemptions.push('Homestead');
    if (r.content.match(/senior\s+exempt|over\s+65/i)) exemptions.push('Senior');
    if (r.content.match(/veteran\s+exempt|disabled\s+veteran/i)) exemptions.push('Veteran');
    if (r.content.match(/widow(?:er)?\s+exempt/i)) exemptions.push('Widow/Widower');
    if (r.content.match(/disability\s+exempt|disabled\s+exempt/i)) exemptions.push('Disability');
    if (r.content.match(/save\s+our\s+homes|soh/i)) exemptions.push('Save Our Homes');

    if (exemptions.length > 0 && !fields['38_tax_exemptions']) {
      fields['38_tax_exemptions'] = {
        value: exemptions.join(', '),
        source: 'Tavily (Property Appraiser)',
        confidence: 'Medium',
      };
      console.log(`✅ [Tavily] Found tax exemptions: ${exemptions.join(', ')}`);
      break;
    }

    // If no specific exemptions found but "no exemptions" mentioned
    if (r.content.match(/no\s+exemptions?|exemptions?:?\s*none/i) && !fields['38_tax_exemptions']) {
      fields['38_tax_exemptions'] = {
        value: 'None',
        source: 'Tavily (Property Appraiser)',
        confidence: 'Medium',
      };
      console.log(`✅ [Tavily] Found tax exemptions: None`);
      break;
    }
  }

  console.log(`✅ [Tavily] Tax data search returned ${Object.keys(fields).length} fields`);
  return fields;
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
  // UPDATED 2026-01-13: Added searchTaxData for fields 15, 35, 38
  // UPDATED 2026-01-13: Added searchPaywallAVMs for fields 16c-16f
  // UPDATED 2026-01-13: Added searchAgeAndRenovations for fields 40, 46, 59
  // UPDATED 2026-01-13: Added searchUtilityBills for fields 105, 107-108, 110-116
  // UPDATED 2026-01-13: Added searchPropertyFeatures for fields 131-138
  const [avmFields, paywallAvmFields, marketFields, utilityFields, utilityBillFields, permitFields, ageFields, featureFields, marketPerfFields, homesteadFields, taxFields] = await Promise.all([
    searchAVMs(address), // Fields 16a, 16b
    searchPaywallAVMs(address), // Fields 16c, 16d, 16e, 16f
    searchMarketStats(city, zip), // Fields 91-98
    searchUtilities(city, state), // Fields 104, 106, 109
    searchUtilityBills(city, state, zip), // Fields 105, 107-108, 110-116
    searchPermits(address, county), // Fields 60, 61, 62
    searchAgeAndRenovations(address, county), // Fields 40, 46, 59
    searchPropertyFeatures(address, city), // Fields 131-138
    searchMarketPerformance(city, state, zip), // Fields 169-174: market performance metrics
    searchHomesteadAndCDD(address, county), // Fields 151, 152, 153
    searchTaxData(address, county), // Fields 15, 35, 38: assessed value, annual taxes, exemptions
  ]);

  // Merge all fields
  Object.assign(allFields, avmFields, paywallAvmFields, marketFields, utilityFields, utilityBillFields, permitFields, ageFields, featureFields, marketPerfFields, homesteadFields, taxFields);

  console.log(`✅ TIER 3: Tavily returned ${Object.keys(allFields).length} fields`);

  return allFields;
}

export const TAVILY_SOURCE = 'Tavily';
