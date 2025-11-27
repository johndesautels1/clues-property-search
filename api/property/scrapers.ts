/**
 * CLUES Property Scrapers - Zillow, Redfin, Realtor.com
 * Reliability-ordered data extraction with address verification
 */

const SCRAPER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
};

export interface ScrapedField {
  value: string | number | boolean | null;
  source: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export interface ScrapeResult {
  success: boolean;
  source: string;
  fields: Record<string, ScrapedField>;
  addressVerified: boolean;
  error?: string;
}

// Normalize address for comparison
function normalizeAddress(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\b(street|st|avenue|ave|boulevard|blvd|road|rd|drive|dr|lane|ln|court|ct|place|pl|way|circle|cir)\b/g, '')
    .replace(/\b(north|n|south|s|east|e|west|w)\b/g, '')
    .trim();
}

// Check if two addresses likely match
function addressesMatch(input: string, scraped: string): boolean {
  const norm1 = normalizeAddress(input);
  const norm2 = normalizeAddress(scraped);

  // Extract street number
  const num1 = norm1.match(/^\d+/)?.[0];
  const num2 = norm2.match(/^\d+/)?.[0];

  if (!num1 || !num2 || num1 !== num2) return false;

  // Check if significant words match
  const words1 = norm1.split(' ').filter(w => w.length > 2);
  const words2 = norm2.split(' ').filter(w => w.length > 2);

  const matchCount = words1.filter(w => words2.includes(w)).length;
  return matchCount >= Math.min(2, words1.length);
}

// Helper to set field only if value exists and is not null/undefined/empty
function setField(
  fields: Record<string, ScrapedField>,
  key: string,
  value: any,
  source: string,
  confidence: 'High' | 'Medium' | 'Low' = 'High'
): void {
  if ((typeof value === 'number' ? !isNaN(value) : true) && value !== null && value !== undefined && value !== '') {
    fields[key] = { value, source, confidence };
  }
}

// ============================================
// ZILLOW SCRAPER
// ============================================
export async function scrapeZillow(address: string, zpid?: string): Promise<ScrapeResult> {
  const fields: Record<string, ScrapedField> = {};

  try {
    let html: string;
    let url: string;

    if (zpid) {
      // Direct ZPID URL
      url = `https://www.zillow.com/homedetails/${zpid}_zpid/`;
      const detailRes = await fetch(url, { headers: SCRAPER_HEADERS });
      if (!detailRes.ok) {
        return { success: false, source: 'Zillow', fields: {}, addressVerified: false, error: `HTTP ${detailRes.status}` };
      }
      html = await detailRes.text();
    } else {
      // Search by address
      const searchUrl = `https://www.zillow.com/homes/${encodeURIComponent(address)}_rb/`;
      const searchRes = await fetch(searchUrl, { headers: SCRAPER_HEADERS });

      if (!searchRes.ok) {
        return { success: false, source: 'Zillow', fields: {}, addressVerified: false, error: `HTTP ${searchRes.status}` };
      }

      html = await searchRes.text();

      // Try to find ZPID from search results
      const zpidMatch = html.match(/"zpid":(\d+)/);
      if (zpidMatch) {
        url = `https://www.zillow.com/homedetails/${zpidMatch[1]}_zpid/`;
        const detailRes = await fetch(url, { headers: SCRAPER_HEADERS });
        if (detailRes.ok) {
          html = await detailRes.text();
        }
      } else {
        url = searchUrl;
      }
    }

    // Extract __NEXT_DATA__ or inline JSON
    let data: any = null;

    // Try NEXT_DATA first
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      try {
        const parsed = JSON.parse(nextDataMatch[1]);
        data = parsed?.props?.pageProps?.componentProps?.gdpClientCache;
        if (data) {
          // Parse the nested JSON string
          const cacheKey = Object.keys(data)[0];
          if (cacheKey) {
            data = JSON.parse(data[cacheKey])?.property;
          }
        }
      } catch (e) {
        console.error('Zillow NEXT_DATA parse error:', e);
      }
    }

    // Try inline preloaded state
    if (!data) {
      const preloadMatch = html.match(/window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?});?\s*<\/script>/);
      if (preloadMatch) {
        try {
          data = JSON.parse(preloadMatch[1])?.searchPage?.searchResults?.listResults?.[0];
        } catch (e) {}
      }
    }

    // Try API response embedded in page
    if (!data) {
      const apiMatch = html.match(/"apiCache":\s*({[\s\S]*?})\s*,\s*"[a-zA-Z]/);
      if (apiMatch) {
        try {
          const apiCache = JSON.parse(apiMatch[1]);
          const cacheKey = Object.keys(apiCache).find(k => k.includes('property'));
          if (cacheKey) {
            data = JSON.parse(apiCache[cacheKey])?.property;
          }
        } catch (e) {}
      }
    }

    if (!data) {
      // Try basic regex extraction as fallback
      const priceMatch = html.match(/\$[\d,]+(?=<\/span>|\s*<)/);
      const bedsMatch = html.match(/(\d+)\s*(?:bed|bd)/i);
      const bathsMatch = html.match(/(\d+(?:\.\d+)?)\s*(?:bath|ba)/i);
      const sqftMatch = html.match(/([\d,]+)\s*(?:sq\s*ft|sqft)/i);

      if (priceMatch) {
        setField(fields, '7_listing_price', parseInt(priceMatch[0].replace(/[$,]/g, '')), 'Zillow');
      }
      if (bedsMatch) setField(fields, '12_bedrooms', parseInt(bedsMatch[1]), 'Zillow');
      if (bathsMatch) setField(fields, '15_total_bathrooms', parseFloat(bathsMatch[1]), 'Zillow');
      if (sqftMatch) setField(fields, '16_living_sqft', parseInt(sqftMatch[1].replace(/,/g, '')), 'Zillow');

      return {
        success: Object.keys(fields).length > 0,
        source: 'Zillow',
        fields,
        addressVerified: false,
        error: 'Partial extraction via regex'
      };
    }

    // Extract from parsed data
    const streetAddr = data.streetAddress || data.address?.streetAddress || '';
    const city = data.city || data.address?.city || '';
    const state = data.state || data.address?.state || '';
    const zipcode = data.zipcode || data.address?.zipcode || '';
    const fullAddr = `${streetAddr}, ${city}, ${state} ${zipcode}`;

    // Verify address matches
    const verified = addressesMatch(address, fullAddr);

    if (streetAddr) setField(fields, '1_full_address', fullAddr, 'Zillow');

    // Pricing
    setField(fields, '7_listing_price', data.price || data.listPrice, 'Zillow');
    setField(fields, '9_market_value_estimate', data.zestimate, 'Zillow (Zestimate)');
    setField(fields, '75_rental_estimate_monthly', data.rentZestimate, 'Zillow (Rent Zestimate)');

    // Basic details
    setField(fields, '12_bedrooms', data.bedrooms || data.beds, 'Zillow');
    setField(fields, '13_full_bathrooms', data.bathrooms || data.baths, 'Zillow');
    setField(fields, '15_total_bathrooms', data.bathrooms || data.baths, 'Zillow');
    setField(fields, '16_living_sqft', data.livingArea || data.sqft, 'Zillow');
    setField(fields, '18_lot_size_sqft', data.lotSize || data.lotAreaValue, 'Zillow');
    setField(fields, '20_year_built', data.yearBuilt, 'Zillow');
    setField(fields, '21_property_type', data.homeType || data.propertyType, 'Zillow');

    // Status
    setField(fields, '4_listing_status', data.homeStatus || data.listingStatus, 'Zillow');
    setField(fields, '5_listing_date', data.datePosted || data.listingDateOnZillow, 'Zillow');

    // Location - latitude/longitude stored if available (no separate city/state/zip in 110-field schema)
    if (data.latitude && data.longitude) {
      setField(fields, '51_latitude', data.latitude, 'Zillow');
      setField(fields, '52_longitude', data.longitude, 'Zillow');
    }

    // Tax info
    setField(fields, '29_annual_taxes', data.propertyTaxRate ? data.price * data.propertyTaxRate / 100 : data.annualTax, 'Zillow');

    // HOA
    if (data.monthlyHoaFee) {
      setField(fields, '25_hoa_yn', true, 'Zillow');
      setField(fields, '26_hoa_fee_annual', data.monthlyHoaFee * 12, 'Zillow');
    }

    // Schools
    if (data.schools && Array.isArray(data.schools)) {
      const elementary = data.schools.find((s: any) => s.level === 'Elementary' || s.grades?.includes('K'));
      const middle = data.schools.find((s: any) => s.level === 'Middle' || s.grades?.includes('6'));
      const high = data.schools.find((s: any) => s.level === 'High' || s.grades?.includes('9'));

      if (elementary) {
        setField(fields, '56_assigned_elementary', elementary.name, 'Zillow');
        setField(fields, '57_elementary_rating', elementary.rating, 'Zillow');
        setField(fields, '58_elementary_distance_miles', elementary.distance, 'Zillow');
      }
      if (middle) {
        setField(fields, '59_assigned_middle', middle.name, 'Zillow');
        setField(fields, '60_middle_rating', middle.rating, 'Zillow');
        setField(fields, '61_middle_distance_miles', middle.distance, 'Zillow');
      }
      if (high) {
        setField(fields, '62_assigned_high', high.name, 'Zillow');
        setField(fields, '63_high_rating', high.rating, 'Zillow');
        setField(fields, '64_high_distance_miles', high.distance, 'Zillow');
      }
    }

    // Price history for last sale
    if (data.priceHistory && Array.isArray(data.priceHistory)) {
      const lastSale = data.priceHistory.find((h: any) => h.event === 'Sold');
      if (lastSale) {
        setField(fields, '10_last_sale_date', lastSale.date, 'Zillow');
        setField(fields, '11_last_sale_price', lastSale.price, 'Zillow');
      }
    }

    // Calculate price per sqft
    const price = fields['7_listing_price']?.value as number;
    const sqft = fields['16_living_sqft']?.value as number;
    if (price && sqft) {
      setField(fields, '8_price_per_sqft', Math.round(price / sqft), 'Calculated');
    }

    // Lot size in acres
    const lotSqft = fields['18_lot_size_sqft']?.value as number;
    if (lotSqft) {
      setField(fields, '19_lot_size_acres', parseFloat((lotSqft / 43560).toFixed(3)), 'Calculated');
    }

    return {
      success: true,
      source: 'Zillow',
      fields,
      addressVerified: verified
    };

  } catch (error) {
    return {
      success: false,
      source: 'Zillow',
      fields,
      addressVerified: false,
      error: String(error)
    };
  }
}

// ============================================
// REDFIN SCRAPER
// ============================================
export async function scrapeRedfin(address: string): Promise<ScrapeResult> {
  const fields: Record<string, ScrapedField> = {};

  try {
    // Step 1: Search for the property
    const searchUrl = `https://www.redfin.com/stingray/do/location-autocomplete?location=${encodeURIComponent(address)}&v=2`;
    const searchRes = await fetch(searchUrl, { headers: SCRAPER_HEADERS });

    if (!searchRes.ok) {
      return { success: false, source: 'Redfin', fields: {}, addressVerified: false, error: `Search HTTP ${searchRes.status}` };
    }

    const searchText = await searchRes.text();
    // Redfin returns {}&&{...} format
    const searchJson = searchText.replace(/^{}&&/, '');
    let searchData: any;

    try {
      searchData = JSON.parse(searchJson);
    } catch (e) {
      return { success: false, source: 'Redfin', fields: {}, addressVerified: false, error: 'Failed to parse search response' };
    }

    // Find exact address match
    const exactMatch = searchData?.payload?.exactMatch;
    const sections = searchData?.payload?.sections || [];
    let propertyUrl: string | null = null;

    if (exactMatch?.url) {
      propertyUrl = exactMatch.url;
    } else {
      // Search through sections for address match
      for (const section of sections) {
        for (const row of section.rows || []) {
          if (row.url && row.type === 'ADDRESS') {
            propertyUrl = row.url;
            break;
          }
        }
        if (propertyUrl) break;
      }
    }

    if (!propertyUrl) {
      return { success: false, source: 'Redfin', fields: {}, addressVerified: false, error: 'Property not found' };
    }

    // Step 2: Fetch property page
    const detailUrl = `https://www.redfin.com${propertyUrl}`;
    const detailRes = await fetch(detailUrl, { headers: SCRAPER_HEADERS });

    if (!detailRes.ok) {
      return { success: false, source: 'Redfin', fields: {}, addressVerified: false, error: `Detail HTTP ${detailRes.status}` };
    }

    const html = await detailRes.text();

    // Extract preloaded data
    let data: any = null;

    const preloadMatch = html.match(/window\.__reactServerState\s*=\s*({[\s\S]*?});?\s*<\/script>/);
    if (preloadMatch) {
      try {
        data = JSON.parse(preloadMatch[1]);
      } catch (e) {}
    }

    // Try alternative patterns
    if (!data) {
      const dataMatch = html.match(/"propertyModel":\s*({[\s\S]*?})\s*,\s*"[a-zA-Z]/);
      if (dataMatch) {
        try {
          data = { propertyModel: JSON.parse(dataMatch[1]) };
        } catch (e) {}
      }
    }

    // Fallback to regex extraction
    const streetAddr = html.match(/<h1[^>]*class="[^"]*streetAddress[^"]*"[^>]*>([^<]+)</)?.[1] || '';
    const cityStateZip = html.match(/<span[^>]*class="[^"]*cityStateZip[^"]*"[^>]*>([^<]+)</)?.[1] || '';

    const priceMatch = html.match(/\$[\d,]+(?=\s*<\/div>|\s*<span)/);
    const bedsMatch = html.match(/(\d+)\s*(?:Beds?|BR)/i);
    const bathsMatch = html.match(/(\d+(?:\.\d+)?)\s*(?:Baths?|BA)/i);
    const sqftMatch = html.match(/([\d,]+)\s*Sq\s*Ft/i);
    const yearMatch = html.match(/Built\s*(?:in\s*)?(\d{4})/i);
    const lotMatch = html.match(/Lot\s*Size[:\s]*([\d,.]+)\s*(sq\s*ft|acres?)/i);

    const fullAddr = streetAddr && cityStateZip ? `${streetAddr}, ${cityStateZip}` : '';
    const verified = fullAddr ? addressesMatch(address, fullAddr) : false;

    if (fullAddr) setField(fields, '1_full_address', fullAddr, 'Redfin');
    if (priceMatch) setField(fields, '7_listing_price', parseInt(priceMatch[0].replace(/[$,]/g, '')), 'Redfin');
    if (bedsMatch) setField(fields, '12_bedrooms', parseInt(bedsMatch[1]), 'Redfin');
    if (bathsMatch) setField(fields, '15_total_bathrooms', parseFloat(bathsMatch[1]), 'Redfin');
    if (sqftMatch) setField(fields, '16_living_sqft', parseInt(sqftMatch[1].replace(/,/g, '')), 'Redfin');
    if (yearMatch) setField(fields, '20_year_built', parseInt(yearMatch[1]), 'Redfin');

    if (lotMatch) {
      const lotValue = parseFloat(lotMatch[1].replace(/,/g, ''));
      const lotUnit = lotMatch[2].toLowerCase();
      if (lotUnit.includes('acre')) {
        setField(fields, '19_lot_size_acres', lotValue, 'Redfin');
        setField(fields, '18_lot_size_sqft', Math.round(lotValue * 43560), 'Calculated');
      } else {
        setField(fields, '18_lot_size_sqft', lotValue, 'Redfin');
        setField(fields, '19_lot_size_acres', parseFloat((lotValue / 43560).toFixed(3)), 'Calculated');
      }
    }

    // Try to get Redfin estimate
    const estimateMatch = html.match(/Redfin\s*Estimate[:\s]*\$?([\d,]+)/i);
    if (estimateMatch) {
      setField(fields, '74_redfin_estimate', parseInt(estimateMatch[1].replace(/,/g, '')), 'Redfin');
    }

    // Calculate price per sqft
    const price = fields['7_listing_price']?.value as number;
    const sqft = fields['16_living_sqft']?.value as number;
    if (price && sqft) {
      setField(fields, '8_price_per_sqft', Math.round(price / sqft), 'Calculated');
    }

    return {
      success: Object.keys(fields).length > 0,
      source: 'Redfin',
      fields,
      addressVerified: verified
    };

  } catch (error) {
    return {
      success: false,
      source: 'Redfin',
      fields,
      addressVerified: false,
      error: String(error)
    };
  }
}

// ============================================
// REALTOR.COM SCRAPER (Fixed)
// ============================================
export async function scrapeRealtor(address: string): Promise<ScrapeResult> {
  const fields: Record<string, ScrapedField> = {};

  try {
    // Step 1: Search for the property using Realtor.com's autocomplete
    const searchUrl = `https://www.realtor.com/api/v1/hulk_main_srp?client_id=rdc-x&schema=vesta&query=${encodeURIComponent(address)}&limit=5`;

    let searchData: any = null;

    // Try autocomplete API first
    try {
      const autocompleteUrl = `https://parser-external.geo.moveaws.com/suggest?input=${encodeURIComponent(address)}&client_id=rdc-home&limit=5&area_types=address`;
      const autocompleteRes = await fetch(autocompleteUrl, { headers: SCRAPER_HEADERS });

      if (autocompleteRes.ok) {
        const autocompleteData = await autocompleteRes.json();
        if (autocompleteData?.autocomplete?.[0]?.mpr_id) {
          // Found property ID, fetch details
          const mprId = autocompleteData.autocomplete[0].mpr_id;
          const detailUrl = `https://www.realtor.com/realestateandhomes-detail/M${mprId}`;
          const detailRes = await fetch(detailUrl, { headers: SCRAPER_HEADERS });

          if (detailRes.ok) {
            const html = await detailRes.text();
            const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);

            if (nextDataMatch) {
              const parsed = JSON.parse(nextDataMatch[1]);
              searchData = parsed?.props?.pageProps?.initialReduxState?.propertyDetails ||
                          parsed?.props?.pageProps?.property ||
                          parsed?.props?.pageProps;
            }
          }
        }
      }
    } catch (e) {
      console.error('Realtor autocomplete error:', e);
    }

    // Fallback: Direct URL construction
    if (!searchData) {
      const parts = address.split(',').map(p => p.trim());
      if (parts.length >= 3) {
        const street = parts[0].replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        const city = parts[1].replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        const stateZipParts = parts[2].trim().split(' ');
        const state = stateZipParts[0];
        const zip = stateZipParts[1] || '';

        // Try the standard URL format
        const directUrl = `https://www.realtor.com/realestateandhomes-detail/${street}_${city}_${state}_${zip}`;
        const directRes = await fetch(directUrl, { headers: SCRAPER_HEADERS });

        if (directRes.ok) {
          const html = await directRes.text();
          const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);

          if (nextDataMatch) {
            const parsed = JSON.parse(nextDataMatch[1]);
            searchData = parsed?.props?.pageProps?.initialReduxState?.propertyDetails ||
                        parsed?.props?.pageProps?.property ||
                        parsed?.props?.pageProps;
          }
        }
      }
    }

    if (!searchData) {
      return { success: false, source: 'Realtor.com', fields: {}, addressVerified: false, error: 'Could not find property' };
    }

    // Extract property data
    const property = searchData?.listingDetail || searchData?.property || searchData;
    const listing = property?.listing || property;
    const location = property?.location || property?.address || {};
    const description = property?.description || {};
    const taxHistory = property?.tax_history || [];
    const priceHistory = property?.price_history || [];

    // Build full address and verify
    const addr = location.address || location;
    const streetAddr = addr?.line || addr?.streetAddress || '';
    const city = addr?.city || '';
    const stateCode = addr?.state_code || addr?.state || '';
    const zipcode = addr?.postal_code || addr?.zipcode || '';
    const fullAddr = streetAddr ? `${streetAddr}, ${city}, ${stateCode} ${zipcode}` : '';

    const verified = fullAddr ? addressesMatch(address, fullAddr) : false;

    if (!verified && fullAddr) {
      console.warn(`Realtor.com address mismatch: searched "${address}", got "${fullAddr}"`);
    }

    // Set fields only if we have values (no separate city/state/zip in 110-field schema - extracted from 1_full_address when needed)
    if (fullAddr) setField(fields, '1_full_address', fullAddr, 'Realtor.com');

    setField(fields, '2_mls_primary', listing?.mls?.id || property?.mls_id, 'Realtor.com');
    setField(fields, '4_listing_status', property?.status || listing?.status, 'Realtor.com');
    setField(fields, '5_listing_date', listing?.list_date || property?.list_date, 'Realtor.com');
    setField(fields, '6_parcel_id', property?.property_id, 'Realtor.com');

    const price = listing?.list_price || property?.list_price || property?.price;
    const sqft = description?.sqft || property?.sqft || property?.building_size?.size;

    setField(fields, '7_listing_price', price, 'Realtor.com');
    setField(fields, '16_living_sqft', sqft, 'Realtor.com');

    if (price && sqft) {
      setField(fields, '8_price_per_sqft', Math.round(price / sqft), 'Calculated');
    }

    // Last sale from price history
    if (priceHistory?.length > 0) {
      const lastSale = priceHistory.find((h: any) => h.event_name === 'Sold');
      if (lastSale) {
        setField(fields, '10_last_sale_date', lastSale.date, 'Realtor.com');
        setField(fields, '11_last_sale_price', lastSale.price, 'Realtor.com');
      }
    }

    setField(fields, '12_bedrooms', description?.beds || property?.beds, 'Realtor.com');
    setField(fields, '13_full_bathrooms', description?.baths_full || property?.baths_full, 'Realtor.com');

    const halfBaths = description?.baths_half || property?.baths_half;
    if (halfBaths) setField(fields, '14_half_bathrooms', halfBaths, 'Realtor.com');

    const fullBaths = description?.baths_full || property?.baths_full || 0;
    const halfBathsNum = halfBaths || 0;
    if (fullBaths || halfBathsNum) {
      setField(fields, '15_total_bathrooms', fullBaths + (halfBathsNum * 0.5), 'Calculated');
    }

    const lotSqft = description?.lot_sqft || property?.lot_sqft;
    setField(fields, '18_lot_size_sqft', lotSqft, 'Realtor.com');
    if (lotSqft) {
      setField(fields, '19_lot_size_acres', parseFloat((lotSqft / 43560).toFixed(3)), 'Calculated');
    }

    setField(fields, '20_year_built', description?.year_built || property?.year_built, 'Realtor.com');
    setField(fields, '21_property_type', description?.type || property?.prop_type || property?.type, 'Realtor.com');
    setField(fields, '22_stories', description?.stories || property?.stories, 'Realtor.com', 'Medium');
    setField(fields, '23_garage_spaces', description?.garage || property?.garage, 'Realtor.com', 'Medium');

    // HOA
    const hoa = property?.hoa || listing?.hoa;
    if (hoa?.fee) {
      setField(fields, '25_hoa_yn', true, 'Realtor.com');
      setField(fields, '26_hoa_fee_annual', hoa.fee * 12, 'Realtor.com');
    }

    setField(fields, '28_county', location?.county?.name || location?.address?.county, 'Realtor.com');

    // Tax history
    if (taxHistory?.length > 0) {
      const latestTax = taxHistory[0];
      setField(fields, '29_annual_taxes', latestTax?.tax, 'Realtor.com');
      setField(fields, '30_tax_year', latestTax?.year, 'Realtor.com');
      setField(fields, '31_assessed_value', latestTax?.assessment?.total, 'Realtor.com');
    }

    // Coordinates
    if (location?.coordinate?.lat && location?.coordinate?.lon) {
      setField(fields, 'coordinates', { lat: location.coordinate.lat, lon: location.coordinate.lon }, 'Realtor.com');
    }

    return {
      success: Object.keys(fields).length > 0,
      source: 'Realtor.com',
      fields,
      addressVerified: verified
    };

  } catch (error) {
    return {
      success: false,
      source: 'Realtor.com',
      fields,
      addressVerified: false,
      error: String(error)
    };
  }
}

// ============================================
// COMBINED SCRAPER - Runs all in parallel
// ============================================
export async function scrapeAllSources(address: string, zillowZpid?: string): Promise<{
  combined: Record<string, ScrapedField>;
  results: ScrapeResult[];
  conflicts: Array<{ field: string; values: Array<{ source: string; value: any }> }>;
}> {
  // Run all scrapers in parallel
  const [zillowResult, redfinResult, realtorResult] = await Promise.all([
    scrapeZillow(address, zillowZpid),
    scrapeRedfin(address),
    scrapeRealtor(address)
  ]);

  const results = [zillowResult, redfinResult, realtorResult];
  const combined: Record<string, ScrapedField> = {};
  const conflicts: Array<{ field: string; values: Array<{ source: string; value: any }> }> = [];

  // Reliability order: Realtor.com > Zillow > Redfin (for most fields)
  // But Zillow Zestimate and Redfin Estimate are unique to each
  const reliabilityOrder = ['Realtor.com', 'Zillow', 'Redfin'];

  // Collect all fields from all sources
  const allFields = new Map<string, Array<{ source: string; value: any; confidence: string }>>();

  for (const result of results) {
    if (!result.success) continue;

    for (const [key, field] of Object.entries(result.fields)) {
      if (!allFields.has(key)) {
        allFields.set(key, []);
      }
      allFields.get(key)!.push({
        source: field.source,
        value: field.value,
        confidence: field.confidence
      });
    }
  }

  // For each field, pick the most reliable source
  for (const [key, values] of Array.from(allFields.entries())) {
    if (values.length === 1) {
      // Only one source, use it
      combined[key] = {
        value: values[0].value,
        source: values[0].source,
        confidence: values[0].confidence as 'High' | 'Medium' | 'Low'
      };
    } else {
      // Multiple sources - check for conflicts
      const uniqueValues = new Set(values.map(v => JSON.stringify(v.value)));

      if (uniqueValues.size > 1) {
        // Conflict detected
        conflicts.push({
          field: key,
          values: values.map(v => ({ source: v.source, value: v.value }))
        });
      }

      // Pick most reliable source
      const sorted = values.sort((a, b) => {
        const aIdx = reliabilityOrder.indexOf(a.source.split(' ')[0]);
        const bIdx = reliabilityOrder.indexOf(b.source.split(' ')[0]);
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
      });

      combined[key] = {
        value: sorted[0].value,
        source: sorted[0].source,
        confidence: sorted[0].confidence as 'High' | 'Medium' | 'Low'
      };
    }
  }

  return { combined, results, conflicts };
}
