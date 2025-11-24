/**
 * Florida County Property Appraiser Scrapers
 * Counties: Pinellas, Hillsborough, Manatee, Polk, Pasco, Hernando
 *
 * These scrape REAL data from official county websites - NO FAKE DATA
 */

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

interface CountyData {
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
  permit_history?: any[];
}

// ============================================
// PINELLAS COUNTY - pcpao.org
// ============================================
export async function scrapePinellas(address: string): Promise<Record<string, any>> {
  try {
    // Pinellas uses a search API
    const searchUrl = `https://www.pcpao.org/api/search?address=${encodeURIComponent(address)}`;
    const searchRes = await fetch(searchUrl, { headers: HEADERS });

    if (!searchRes.ok) {
      // Try alternative: direct parcel lookup page scrape
      console.log('Pinellas API failed, trying web scrape...');
      return await scrapePinellasWeb(address);
    }

    const searchData = await searchRes.json();
    if (!searchData.results || searchData.results.length === 0) {
      return {};
    }

    const parcelId = searchData.results[0].parcel_id;

    // Get full parcel details
    const detailUrl = `https://www.pcpao.org/api/parcel/${parcelId}`;
    const detailRes = await fetch(detailUrl, { headers: HEADERS });
    const data = await detailRes.json();

    return mapPinellasData(data);
  } catch (e) {
    console.error('Pinellas scrape error:', e);
    return await scrapePinellasWeb(address);
  }
}

async function scrapePinellasWeb(address: string): Promise<Record<string, any>> {
  try {
    // Scrape the web search page
    const searchUrl = `https://www.pcpao.org/general_search.php?searchtype=Address&searchterm=${encodeURIComponent(address)}`;
    const res = await fetch(searchUrl, { headers: HEADERS });
    const html = await res.text();

    // Extract parcel link
    const parcelMatch = html.match(/parcel\.php\?parcel=(\d+)/);
    if (!parcelMatch) return {};

    const parcelId = parcelMatch[1];

    // Get parcel detail page
    const detailUrl = `https://www.pcpao.org/parcel.php?parcel=${parcelId}`;
    const detailRes = await fetch(detailUrl, { headers: HEADERS });
    const detailHtml = await detailRes.text();

    return extractFromPinellasHtml(detailHtml, parcelId);
  } catch (e) {
    console.error('Pinellas web scrape error:', e);
    return {};
  }
}

function extractFromPinellasHtml(html: string, parcelId: string): Record<string, any> {
  const fields: Record<string, any> = {};

  fields['6_parcel_id'] = { value: parcelId, source: 'Pinellas County Property Appraiser', confidence: 'High' };

  // Extract assessed value
  const assessedMatch = html.match(/Assessed Value[:\s]*\$?([\d,]+)/i);
  if (assessedMatch) {
    fields['31_assessed_value'] = {
      value: parseInt(assessedMatch[1].replace(/,/g, '')),
      source: 'Pinellas County Property Appraiser',
      confidence: 'High'
    };
  }

  // Extract market value
  const marketMatch = html.match(/Market Value[:\s]*\$?([\d,]+)/i);
  if (marketMatch) {
    fields['9_market_value_estimate'] = {
      value: parseInt(marketMatch[1].replace(/,/g, '')),
      source: 'Pinellas County Property Appraiser',
      confidence: 'High'
    };
  }

  // Extract year built
  const yearMatch = html.match(/Year Built[:\s]*(\d{4})/i);
  if (yearMatch) {
    fields['20_year_built'] = {
      value: parseInt(yearMatch[1]),
      source: 'Pinellas County Property Appraiser',
      confidence: 'High'
    };
  }

  // Extract living area
  const sqftMatch = html.match(/Living Area[:\s]*([\d,]+)/i) || html.match(/Heated Area[:\s]*([\d,]+)/i);
  if (sqftMatch) {
    fields['16_living_sqft'] = {
      value: parseInt(sqftMatch[1].replace(/,/g, '')),
      source: 'Pinellas County Property Appraiser',
      confidence: 'High'
    };
  }

  // Extract bedrooms
  const bedMatch = html.match(/Bedrooms[:\s]*(\d+)/i);
  if (bedMatch) {
    fields['12_bedrooms'] = {
      value: parseInt(bedMatch[1]),
      source: 'Pinellas County Property Appraiser',
      confidence: 'High'
    };
  }

  // Extract bathrooms
  const bathMatch = html.match(/Bathrooms[:\s]*([\d.]+)/i);
  if (bathMatch) {
    fields['15_total_bathrooms'] = {
      value: parseFloat(bathMatch[1]),
      source: 'Pinellas County Property Appraiser',
      confidence: 'High'
    };
  }

  // Extract pool
  const poolMatch = html.match(/Pool[:\s]*(Yes|No|Y|N)/i);
  if (poolMatch) {
    fields['47_pool_yn'] = {
      value: poolMatch[1].toLowerCase().startsWith('y'),
      source: 'Pinellas County Property Appraiser',
      confidence: 'High'
    };
  }

  // Extract roof type
  const roofMatch = html.match(/Roof[:\s]*([A-Za-z\s]+?)(?:<|,|\n)/i);
  if (roofMatch) {
    fields['36_roof_type'] = {
      value: roofMatch[1].trim(),
      source: 'Pinellas County Property Appraiser',
      confidence: 'High'
    };
  }

  // Extract exterior
  const exteriorMatch = html.match(/Exterior Wall[:\s]*([A-Za-z\s]+?)(?:<|,|\n)/i);
  if (exteriorMatch) {
    fields['38_exterior_material'] = {
      value: exteriorMatch[1].trim(),
      source: 'Pinellas County Property Appraiser',
      confidence: 'High'
    };
  }

  return fields;
}

function mapPinellasData(data: any): Record<string, any> {
  const fields: Record<string, any> = {};

  if (data.parcel_id) fields['6_parcel_id'] = { value: data.parcel_id, source: 'Pinellas County Property Appraiser', confidence: 'High' };
  if (data.assessed_value) fields['31_assessed_value'] = { value: data.assessed_value, source: 'Pinellas County Property Appraiser', confidence: 'High' };
  if (data.market_value) fields['9_market_value_estimate'] = { value: data.market_value, source: 'Pinellas County Property Appraiser', confidence: 'High' };
  if (data.year_built) fields['20_year_built'] = { value: data.year_built, source: 'Pinellas County Property Appraiser', confidence: 'High' };
  if (data.living_sqft) fields['16_living_sqft'] = { value: data.living_sqft, source: 'Pinellas County Property Appraiser', confidence: 'High' };
  if (data.bedrooms) fields['12_bedrooms'] = { value: data.bedrooms, source: 'Pinellas County Property Appraiser', confidence: 'High' };
  if (data.bathrooms) fields['15_total_bathrooms'] = { value: data.bathrooms, source: 'Pinellas County Property Appraiser', confidence: 'High' };

  return fields;
}

// ============================================
// HILLSBOROUGH COUNTY - hcpafl.org
// ============================================
export async function scrapeHillsborough(address: string): Promise<Record<string, any>> {
  try {
    // Hillsborough County Property Appraiser search
    const searchUrl = `https://www.hcpafl.org/CamaDisplay.aspx?searchtype=address&searchterm=${encodeURIComponent(address)}`;
    const res = await fetch(searchUrl, { headers: HEADERS });
    const html = await res.text();

    return extractFromHillsboroughHtml(html);
  } catch (e) {
    console.error('Hillsborough scrape error:', e);
    return {};
  }
}

function extractFromHillsboroughHtml(html: string): Record<string, any> {
  const fields: Record<string, any> = {};

  // Extract folio/parcel number
  const folioMatch = html.match(/Folio[:\s#]*([A-Z0-9-]+)/i);
  if (folioMatch) {
    fields['6_parcel_id'] = { value: folioMatch[1], source: 'Hillsborough County Property Appraiser', confidence: 'High' };
  }

  // Extract assessed value
  const assessedMatch = html.match(/Assessed Value[:\s]*\$?([\d,]+)/i);
  if (assessedMatch) {
    fields['31_assessed_value'] = { value: parseInt(assessedMatch[1].replace(/,/g, '')), source: 'Hillsborough County Property Appraiser', confidence: 'High' };
  }

  // Extract market value
  const marketMatch = html.match(/(?:Just|Market) Value[:\s]*\$?([\d,]+)/i);
  if (marketMatch) {
    fields['9_market_value_estimate'] = { value: parseInt(marketMatch[1].replace(/,/g, '')), source: 'Hillsborough County Property Appraiser', confidence: 'High' };
  }

  // Extract year built
  const yearMatch = html.match(/Year Built[:\s]*(\d{4})/i);
  if (yearMatch) {
    fields['20_year_built'] = { value: parseInt(yearMatch[1]), source: 'Hillsborough County Property Appraiser', confidence: 'High' };
  }

  // Extract living area
  const sqftMatch = html.match(/(?:Living|Heated) (?:Area|Sqft)[:\s]*([\d,]+)/i);
  if (sqftMatch) {
    fields['16_living_sqft'] = { value: parseInt(sqftMatch[1].replace(/,/g, '')), source: 'Hillsborough County Property Appraiser', confidence: 'High' };
  }

  // Extract bedrooms
  const bedMatch = html.match(/Bedrooms[:\s]*(\d+)/i);
  if (bedMatch) {
    fields['12_bedrooms'] = { value: parseInt(bedMatch[1]), source: 'Hillsborough County Property Appraiser', confidence: 'High' };
  }

  // Extract bathrooms
  const bathMatch = html.match(/Bath(?:room)?s?[:\s]*([\d.]+)/i);
  if (bathMatch) {
    fields['15_total_bathrooms'] = { value: parseFloat(bathMatch[1]), source: 'Hillsborough County Property Appraiser', confidence: 'High' };
  }

  return fields;
}

// ============================================
// MANATEE COUNTY - manateepao.com
// ============================================
export async function scrapeManatee(address: string): Promise<Record<string, any>> {
  try {
    const searchUrl = `https://www.manateepao.com/search/?searchtype=address&searchterm=${encodeURIComponent(address)}`;
    const res = await fetch(searchUrl, { headers: HEADERS });
    const html = await res.text();

    return extractFromManateeHtml(html);
  } catch (e) {
    console.error('Manatee scrape error:', e);
    return {};
  }
}

function extractFromManateeHtml(html: string): Record<string, any> {
  const fields: Record<string, any> = {};
  const source = 'Manatee County Property Appraiser';

  const parcelMatch = html.match(/Parcel[:\s#]*([A-Z0-9-]+)/i);
  if (parcelMatch) fields['6_parcel_id'] = { value: parcelMatch[1], source, confidence: 'High' };

  const assessedMatch = html.match(/Assessed Value[:\s]*\$?([\d,]+)/i);
  if (assessedMatch) fields['31_assessed_value'] = { value: parseInt(assessedMatch[1].replace(/,/g, '')), source, confidence: 'High' };

  const yearMatch = html.match(/Year Built[:\s]*(\d{4})/i);
  if (yearMatch) fields['20_year_built'] = { value: parseInt(yearMatch[1]), source, confidence: 'High' };

  const sqftMatch = html.match(/(?:Living|Heated) Area[:\s]*([\d,]+)/i);
  if (sqftMatch) fields['16_living_sqft'] = { value: parseInt(sqftMatch[1].replace(/,/g, '')), source, confidence: 'High' };

  return fields;
}

// ============================================
// POLK COUNTY - polkpa.org
// ============================================
export async function scrapePolk(address: string): Promise<Record<string, any>> {
  try {
    const searchUrl = `https://www.polkpa.org/CamaDisplay.aspx?searchType=address&searchTerm=${encodeURIComponent(address)}`;
    const res = await fetch(searchUrl, { headers: HEADERS });
    const html = await res.text();

    return extractFromPolkHtml(html);
  } catch (e) {
    console.error('Polk scrape error:', e);
    return {};
  }
}

function extractFromPolkHtml(html: string): Record<string, any> {
  const fields: Record<string, any> = {};
  const source = 'Polk County Property Appraiser';

  const parcelMatch = html.match(/Parcel[:\s#]*([A-Z0-9-]+)/i);
  if (parcelMatch) fields['6_parcel_id'] = { value: parcelMatch[1], source, confidence: 'High' };

  const assessedMatch = html.match(/Assessed Value[:\s]*\$?([\d,]+)/i);
  if (assessedMatch) fields['31_assessed_value'] = { value: parseInt(assessedMatch[1].replace(/,/g, '')), source, confidence: 'High' };

  const marketMatch = html.match(/(?:Just|Market) Value[:\s]*\$?([\d,]+)/i);
  if (marketMatch) fields['9_market_value_estimate'] = { value: parseInt(marketMatch[1].replace(/,/g, '')), source, confidence: 'High' };

  const yearMatch = html.match(/Year Built[:\s]*(\d{4})/i);
  if (yearMatch) fields['20_year_built'] = { value: parseInt(yearMatch[1]), source, confidence: 'High' };

  const sqftMatch = html.match(/(?:Living|Heated) Area[:\s]*([\d,]+)/i);
  if (sqftMatch) fields['16_living_sqft'] = { value: parseInt(sqftMatch[1].replace(/,/g, '')), source, confidence: 'High' };

  const bedMatch = html.match(/Bedrooms[:\s]*(\d+)/i);
  if (bedMatch) fields['12_bedrooms'] = { value: parseInt(bedMatch[1]), source, confidence: 'High' };

  const bathMatch = html.match(/Bath(?:room)?s?[:\s]*([\d.]+)/i);
  if (bathMatch) fields['15_total_bathrooms'] = { value: parseFloat(bathMatch[1]), source, confidence: 'High' };

  return fields;
}

// ============================================
// PASCO COUNTY - pascopa.com
// ============================================
export async function scrapePasco(address: string): Promise<Record<string, any>> {
  try {
    const searchUrl = `https://www.pascopa.com/search.aspx?searchType=address&searchValue=${encodeURIComponent(address)}`;
    const res = await fetch(searchUrl, { headers: HEADERS });
    const html = await res.text();

    return extractFromPascoHtml(html);
  } catch (e) {
    console.error('Pasco scrape error:', e);
    return {};
  }
}

function extractFromPascoHtml(html: string): Record<string, any> {
  const fields: Record<string, any> = {};
  const source = 'Pasco County Property Appraiser';

  const parcelMatch = html.match(/Parcel[:\s#]*([A-Z0-9-]+)/i);
  if (parcelMatch) fields['6_parcel_id'] = { value: parcelMatch[1], source, confidence: 'High' };

  const assessedMatch = html.match(/Assessed Value[:\s]*\$?([\d,]+)/i);
  if (assessedMatch) fields['31_assessed_value'] = { value: parseInt(assessedMatch[1].replace(/,/g, '')), source, confidence: 'High' };

  const yearMatch = html.match(/Year Built[:\s]*(\d{4})/i);
  if (yearMatch) fields['20_year_built'] = { value: parseInt(yearMatch[1]), source, confidence: 'High' };

  const sqftMatch = html.match(/(?:Living|Heated) Area[:\s]*([\d,]+)/i);
  if (sqftMatch) fields['16_living_sqft'] = { value: parseInt(sqftMatch[1].replace(/,/g, '')), source, confidence: 'High' };

  return fields;
}

// ============================================
// HERNANDO COUNTY - hernandopa-fl.us
// ============================================
export async function scrapeHernando(address: string): Promise<Record<string, any>> {
  try {
    const searchUrl = `https://www.hernandopa-fl.us/pt/search/commonsearch.aspx?mode=address&searchterm=${encodeURIComponent(address)}`;
    const res = await fetch(searchUrl, { headers: HEADERS });
    const html = await res.text();

    return extractFromHernandoHtml(html);
  } catch (e) {
    console.error('Hernando scrape error:', e);
    return {};
  }
}

function extractFromHernandoHtml(html: string): Record<string, any> {
  const fields: Record<string, any> = {};
  const source = 'Hernando County Property Appraiser';

  const parcelMatch = html.match(/Parcel[:\s#]*([A-Z0-9-]+)/i);
  if (parcelMatch) fields['6_parcel_id'] = { value: parcelMatch[1], source, confidence: 'High' };

  const assessedMatch = html.match(/Assessed Value[:\s]*\$?([\d,]+)/i);
  if (assessedMatch) fields['31_assessed_value'] = { value: parseInt(assessedMatch[1].replace(/,/g, '')), source, confidence: 'High' };

  const yearMatch = html.match(/Year Built[:\s]*(\d{4})/i);
  if (yearMatch) fields['20_year_built'] = { value: parseInt(yearMatch[1]), source, confidence: 'High' };

  const sqftMatch = html.match(/(?:Living|Heated) Area[:\s]*([\d,]+)/i);
  if (sqftMatch) fields['16_living_sqft'] = { value: parseInt(sqftMatch[1].replace(/,/g, '')), source, confidence: 'High' };

  return fields;
}

// ============================================
// MAIN FUNCTION - Routes to correct county
// ============================================
export async function scrapeFloridaCounty(address: string, county: string): Promise<Record<string, any>> {
  const countyLower = county.toLowerCase().replace(' county', '').trim();

  console.log(`Scraping ${countyLower} county property appraiser...`);

  switch (countyLower) {
    case 'pinellas':
      return await scrapePinellas(address);
    case 'hillsborough':
      return await scrapeHillsborough(address);
    case 'manatee':
      return await scrapeManatee(address);
    case 'polk':
      return await scrapePolk(address);
    case 'pasco':
      return await scrapePasco(address);
    case 'hernando':
      return await scrapeHernando(address);
    default:
      console.log(`County "${county}" not supported for scraping`);
      return {};
  }
}
