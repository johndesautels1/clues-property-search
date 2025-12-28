/**
 * County Data Client
 * Aggregates county property appraiser + tax collector data
 * Used by CMA schema orchestrator as "countyJson" input
 */

import { scrapePinellas } from '../../api/property/florida-counties';

export interface CountyDataResult {
  parcel_id?: string;
  owner_name?: string;
  assessed_value?: number;
  market_value?: number;
  annual_taxes?: number;
  tax_year?: number;
  year_built?: number;
  living_sqft?: number;
  lot_size_sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  pool?: boolean;
  roof_type?: string;
  exterior_material?: string;
  foundation?: string;
  hvac?: string;
  last_sale_date?: string;
  last_sale_price?: number;
  legal_description?: string;
  zoning?: string;
  homestead_yn?: boolean;
  cdd_yn?: boolean;
  annual_cdd_fee?: number;
  subdivision_name?: string;
  [key: string]: any; // Allow additional county-specific fields
}

/**
 * Fetch county data (property appraiser + tax collector)
 *
 * @param address - Full property address
 * @param county - County name (optional, helps route to correct scraper)
 * @returns Aggregated county data as JSON object
 */
export async function fetchCountyData(
  address: string,
  county?: string
): Promise<CountyDataResult> {
  console.log('[County Client] Fetching data for:', address, 'County:', county || 'auto-detect');

  try {
    // Determine which county scraper to use
    const countyLower = (county || '').toLowerCase();

    let countyFields: Record<string, any> = {};

    // Route to appropriate county scraper
    if (countyLower.includes('pinellas')) {
      console.log('[County Client] Using Pinellas County scraper');
      countyFields = await scrapePinellas(address);
    }
    // TODO: Add other county scrapers as they become available:
    // else if (countyLower.includes('hillsborough')) {
    //   countyFields = await scrapeHillsborough(address);
    // }
    // else if (countyLower.includes('manatee')) {
    //   countyFields = await scrapeManatee(address);
    // }
    else {
      console.log('[County Client] No specific scraper for county, trying Pinellas as fallback');
      countyFields = await scrapePinellas(address);
    }

    // Transform field-based format to flat object for orchestrator
    const result: CountyDataResult = {};

    for (const [key, field] of Object.entries(countyFields)) {
      // Extract field number and name from keys like "6_parcel_id", "31_assessed_value"
      const match = key.match(/^\d+_(.+)$/);
      if (match) {
        const fieldName = match[1];
        result[fieldName] = (field as any)?.value;
      } else {
        result[key] = (field as any)?.value ?? field;
      }
    }

    console.log('[County Client] Fields fetched:', Object.keys(result).length);
    return result;

  } catch (error) {
    console.error('[County Client] Error fetching county data:', error);
    return {}; // Return empty object on error, don't crash
  }
}

/**
 * Get county name from address using geocoding
 * Helper function to auto-detect county for routing
 */
export async function getCountyFromAddress(address: string): Promise<string | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results?.[0]?.address_components) {
      const countyComponent = data.results[0].address_components.find((c: any) =>
        c.types.includes('administrative_area_level_2')
      );
      return countyComponent?.long_name || null;
    }

    return null;
  } catch (error) {
    console.error('[County Client] Error geocoding address:', error);
    return null;
  }
}
