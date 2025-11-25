/**
 * CLUES Property Search - Realtor.com Scraper
 * Extracts real property data from Realtor.com hidden JSON
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
};

// Convert address to Realtor.com URL format
function addressToRealtorUrl(address: string): string {
  // "280 41st Ave, St Pete Beach, FL 33706" -> "280-41st-Ave_St-Pete-Beach_FL_33706"
  const parts = address.split(',').map(p => p.trim());
  if (parts.length < 3) return '';

  const street = parts[0].replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const city = parts[1].replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const stateZip = parts[2].trim().split(' ');
  const state = stateZip[0];
  const zip = stateZip[1] || '';

  return `https://www.realtor.com/realestateandhomes-detail/${street}_${city}_${state}_${zip}`;
}

// Search Realtor.com for property
async function searchRealtorProperty(address: string): Promise<any> {
  // First try to construct direct URL
  const directUrl = addressToRealtorUrl(address);

  if (directUrl) {
    try {
      const response = await fetch(directUrl, { headers: HEADERS });
      if (response.ok) {
        const html = await response.text();
        const data = extractNextData(html);
        if (data) return { url: directUrl, data };
      }
    } catch (e) {
      console.log('Direct URL failed, trying search...');
    }
  }

  // Fallback: Use Realtor.com search API
  const searchQuery = encodeURIComponent(address);
  const searchUrl = `https://www.realtor.com/api/v1/hulk_main_srp?client_id=rdc-x&schema=vesta&query=${searchQuery}`;

  try {
    const response = await fetch(searchUrl, {
      headers: {
        ...HEADERS,
        'Accept': 'application/json',
      }
    });

    if (response.ok) {
      const searchData = await response.json();
      if (searchData.data?.home_search?.results?.[0]) {
        return {
          url: searchUrl,
          data: searchData.data.home_search.results[0],
          fromSearch: true
        };
      }
    }
  } catch (e) {
    console.log('Search API failed:', e);
  }

  return null;
}

// Extract __NEXT_DATA__ JSON from HTML
function extractNextData(html: string): any {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return null;

  try {
    const data = JSON.parse(match[1]);
    return data?.props?.pageProps?.initialReduxState || data?.props?.pageProps;
  } catch (e) {
    console.log('Failed to parse NEXT_DATA:', e);
    return null;
  }
}

// Map Realtor.com data to our 110-field schema
function mapRealtorToFields(data: any, fromSearch: boolean = false): Record<string, any> {
  const fields: Record<string, any> = {};

  // Handle different data structures (direct page vs search results)
  const property = fromSearch ? data : (data?.propertyDetails?.listingDetail || data?.property || data);
  const listing = property?.listing || property;
  const location = property?.location || property?.address || {};
  const description = property?.description || {};
  const taxHistory = property?.tax_history || [];
  const priceHistory = property?.price_history || [];

  // GROUP A: Address & Identity (1-6)
  if (location) {
    const addr = location.address || location;
    fields['1_full_address'] = {
      value: addr?.line ? `${addr.line}, ${addr.city}, ${addr.state_code} ${addr.postal_code}` : null,
      source: 'Realtor.com',
      confidence: 'High'
    };
    fields['6_parcel_id'] = {
      value: property?.property_id || null,
      source: 'Realtor.com',
      confidence: 'High'
    };
  }

  // MLS
  fields['2_mls_primary'] = {
    value: listing?.mls?.id || property?.mls_id || null,
    source: 'Realtor.com',
    confidence: 'High'
  };

  // Listing Status
  fields['4_listing_status'] = {
    value: property?.status || listing?.status || null,
    source: 'Realtor.com',
    confidence: 'High'
  };

  // Listing Date
  fields['5_listing_date'] = {
    value: listing?.list_date || property?.list_date || null,
    source: 'Realtor.com',
    confidence: 'High'
  };

  // GROUP B: Pricing (7-11)
  fields['7_listing_price'] = {
    value: listing?.list_price || property?.list_price || property?.price || null,
    source: 'Realtor.com',
    confidence: 'High'
  };

  const sqft = description?.sqft || property?.sqft || property?.building_size?.size;
  const price = listing?.list_price || property?.list_price || property?.price;
  fields['8_price_per_sqft'] = {
    value: (price && sqft) ? Math.round(price / sqft) : null,
    source: 'Calculated from Realtor.com',
    confidence: 'High'
  };

  // Last sale
  if (priceHistory?.length > 0) {
    const lastSale = priceHistory.find((h: any) => h.event_name === 'Sold') || priceHistory[priceHistory.length - 1];
    if (lastSale) {
      fields['10_last_sale_date'] = {
        value: lastSale.date || null,
        source: 'Realtor.com',
        confidence: 'High'
      };
      fields['11_last_sale_price'] = {
        value: lastSale.price || null,
        source: 'Realtor.com',
        confidence: 'High'
      };
    }
  }

  // GROUP C: Property Basics (12-24)
  fields['12_bedrooms'] = {
    value: description?.beds || property?.beds || null,
    source: 'Realtor.com',
    confidence: 'High'
  };

  fields['13_full_bathrooms'] = {
    value: description?.baths_full || property?.baths_full || null,
    source: 'Realtor.com',
    confidence: 'High'
  };

  fields['14_half_bathrooms'] = {
    value: description?.baths_half || property?.baths_half || 0,
    source: 'Realtor.com',
    confidence: 'High'
  };

  const fullBaths = description?.baths_full || property?.baths_full || 0;
  const halfBaths = description?.baths_half || property?.baths_half || 0;
  fields['15_total_bathrooms'] = {
    value: fullBaths + (halfBaths * 0.5),
    source: 'Calculated from Realtor.com',
    confidence: 'High'
  };

  fields['16_living_sqft'] = {
    value: sqft || null,
    source: 'Realtor.com',
    confidence: 'High'
  };

  fields['18_lot_size_sqft'] = {
    value: description?.lot_sqft || property?.lot_sqft || null,
    source: 'Realtor.com',
    confidence: 'High'
  };

  const lotSqft = description?.lot_sqft || property?.lot_sqft;
  fields['19_lot_size_acres'] = {
    value: lotSqft ? (lotSqft / 43560).toFixed(2) : null,
    source: 'Calculated from Realtor.com',
    confidence: 'High'
  };

  fields['20_year_built'] = {
    value: description?.year_built || property?.year_built || null,
    source: 'Realtor.com',
    confidence: 'High'
  };

  fields['21_property_type'] = {
    value: description?.type || property?.prop_type || property?.type || null,
    source: 'Realtor.com',
    confidence: 'High'
  };

  fields['22_stories'] = {
    value: description?.stories || property?.stories || null,
    source: 'Realtor.com',
    confidence: 'Medium'
  };

  fields['23_garage_spaces'] = {
    value: description?.garage || property?.garage || null,
    source: 'Realtor.com',
    confidence: 'Medium'
  };

  // GROUP D: HOA & Ownership (25-28)
  const hoa = property?.hoa || listing?.hoa;
  fields['25_hoa_yn'] = {
    value: hoa ? true : false,
    source: 'Realtor.com',
    confidence: 'Medium'
  };

  if (hoa?.fee) {
    fields['26_hoa_fee_annual'] = {
      value: hoa.fee * 12, // Convert monthly to annual
      source: 'Realtor.com',
      confidence: 'Medium'
    };
  }

  fields['28_county'] = {
    value: location?.county?.name || location?.address?.county || null,
    source: 'Realtor.com',
    confidence: 'High'
  };

  // GROUP E: Taxes (29-35)
  if (taxHistory?.length > 0) {
    const latestTax = taxHistory[0];
    fields['29_annual_taxes'] = {
      value: latestTax?.tax || null,
      source: 'Realtor.com',
      confidence: 'High'
    };
    fields['30_tax_year'] = {
      value: latestTax?.year || null,
      source: 'Realtor.com',
      confidence: 'High'
    };
    fields['31_assessed_value'] = {
      value: latestTax?.assessment?.total || null,
      source: 'Realtor.com',
      confidence: 'High'
    };
  }

  // GROUP F: Structure (36-41)
  const details = property?.details || description?.details || [];
  const features = property?.features || [];

  // Extract from features/details arrays
  const findFeature = (keywords: string[]): string | null => {
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();
      for (const detail of [...details, ...features]) {
        if (typeof detail === 'string' && detail.toLowerCase().includes(lowerKeyword)) {
          return detail;
        }
        if (detail?.text && detail.text.toLowerCase().includes(lowerKeyword)) {
          return detail.text;
        }
      }
    }
    return null;
  };

  fields['36_roof_type'] = {
    value: findFeature(['roof', 'shingle', 'tile', 'metal']),
    source: 'Realtor.com',
    confidence: 'Medium'
  };

  fields['38_exterior_material'] = {
    value: findFeature(['exterior', 'stucco', 'brick', 'siding', 'block']),
    source: 'Realtor.com',
    confidence: 'Medium'
  };

  fields['40_hvac_type'] = {
    value: findFeature(['hvac', 'cooling', 'heating', 'air', 'central']),
    source: 'Realtor.com',
    confidence: 'Medium'
  };

  // GROUP G: Interior (42-46)
  fields['42_flooring_type'] = {
    value: findFeature(['floor', 'tile', 'hardwood', 'carpet', 'laminate', 'vinyl']),
    source: 'Realtor.com',
    confidence: 'Medium'
  };

  // GROUP H: Exterior (47-51)
  const hasPool = findFeature(['pool', 'swimming']);
  fields['47_pool_yn'] = {
    value: hasPool ? true : false,
    source: 'Realtor.com',
    confidence: 'Medium'
  };

  if (hasPool) {
    fields['48_pool_type'] = {
      value: hasPool,
      source: 'Realtor.com',
      confidence: 'Medium'
    };
  }

  // Photos URL for reference
  const photos = property?.photos || listing?.photos || [];
  if (photos.length > 0) {
    fields['photos'] = {
      value: photos.slice(0, 10).map((p: any) => p.href || p.url || p),
      source: 'Realtor.com',
      confidence: 'High'
    };
  }

  // Agent info
  const agent = listing?.agent || property?.agent || property?.advertisers?.[0];
  if (agent) {
    fields['agent_name'] = {
      value: agent.name || `${agent.first_name} ${agent.last_name}`,
      source: 'Realtor.com',
      confidence: 'High'
    };
    fields['agent_phone'] = {
      value: agent.phone || agent.phones?.[0]?.number,
      source: 'Realtor.com',
      confidence: 'High'
    };
  }

  return fields;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address required' });
  }

  try {
    const result = await searchRealtorProperty(address);

    if (!result) {
      return res.status(404).json({
        error: 'Property not found on Realtor.com',
        address
      });
    }

    const fields = mapRealtorToFields(result.data, result.fromSearch);
    const filledFields = Object.keys(fields).filter(k => fields[k]?.value !== null);

    return res.status(200).json({
      success: true,
      source: 'Realtor.com',
      url: result.url,
      fields,
      fields_found: filledFields.length,
      raw_data: result.data // Include raw for debugging
    });

  } catch (error) {
    console.error('Realtor scrape error:', error);
    return res.status(500).json({
      error: 'Failed to scrape property',
      details: String(error)
    });
  }
}
