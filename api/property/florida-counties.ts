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
// ZIP CODE TO COUNTY MAPPING
// ============================================
const COUNTY_ZIPS: Record<string, string[]> = {
  'pinellas': ['33701', '33702', '33703', '33704', '33705', '33706', '33707', '33708', '33709', '33710', '33711', '33713', '33714', '33715', '33716', '33755', '33756', '33759', '33760', '33761', '33762', '33763', '33764', '33765', '33767', '33770', '33771', '33772', '33773', '33774', '33776', '33777', '33778', '33781', '33782', '33785', '33786'],
  'hillsborough': ['33503', '33508', '33510', '33511', '33527', '33534', '33547', '33556', '33563', '33565', '33566', '33567', '33569', '33570', '33572', '33573', '33578', '33579', '33584', '33592', '33594', '33596', '33598', '33601', '33602', '33603', '33604', '33605', '33606', '33607', '33609', '33610', '33611', '33612', '33613', '33614', '33615', '33616', '33617', '33618', '33619', '33620', '33621', '33624', '33625', '33626', '33629', '33634', '33635', '33637', '33647'],
  'manatee': ['34201', '34202', '34203', '34205', '34207', '34208', '34209', '34210', '34211', '34212', '34215', '34216', '34217', '34218', '34219', '34220', '34221', '34222', '34243', '34250', '34251'],
  'polk': ['33801', '33803', '33805', '33809', '33810', '33811', '33812', '33813', '33815', '33823', '33825', '33827', '33830', '33837', '33838', '33839', '33840', '33841', '33843', '33844', '33849', '33850', '33853', '33859', '33860', '33868', '33880', '33881', '33884', '33896', '33897', '33898'],
  'pasco': ['33523', '33525', '33540', '33541', '33542', '33543', '33544', '33545', '33559', '34610', '34637', '34638', '34639', '34652', '34653', '34654', '34655', '34667', '34668', '34669', '34690', '34691'],
  'hernando': ['34601', '34602', '34604', '34606', '34607', '34608', '34609', '34613', '34614']
};

export function detectCountyFromZip(address: string): string | null {
  const zipMatch = address.match(/\b(\d{5})\b/);
  if (!zipMatch) return null;

  const zip = zipMatch[1];
  for (const [county, zips] of Object.entries(COUNTY_ZIPS)) {
    if (zips.includes(zip)) {
      return county;
    }
  }
  return null;
}

// ============================================
// TAX COLLECTOR SCRAPERS (fields 32-35)
// ============================================

// Tax Collector URLs
const TAX_URLS: Record<string, string> = {
  'pinellas': 'https://www.tax.pinellas.gov/taxsearch/',
  'hillsborough': 'https://hillsborough.county-taxes.com/public/search/property_tax',
  'manatee': 'https://www.taxcollector.com/taxes/',
  'polk': 'https://www.polktaxes.com/taxes/',
  'pasco': 'https://www.pascotaxes.com/taxes/',
  'hernando': 'https://www.hernandotax.us/taxes/'
};

async function scrapeTaxCollector(address: string, county: string, parcelId?: string): Promise<Record<string, any>> {
  const countyLower = county.toLowerCase().replace(' county', '').trim();
  const source = `${county} Tax Collector`;
  const fields: Record<string, any> = {};

  try {
    let searchUrl = '';

    // Route to correct tax collector site
    switch (countyLower) {
      case 'pinellas':
        searchUrl = `https://www.tax.pinellas.gov/taxsearch/search.asp?searchtype=address&searchterm=${encodeURIComponent(address)}`;
        break;
      case 'hillsborough':
        searchUrl = `https://hillsborough.county-taxes.com/public/search/property_tax?search=${encodeURIComponent(address)}`;
        break;
      case 'pasco':
        searchUrl = `https://www.pascotaxes.com/records-search/?address=${encodeURIComponent(address)}`;
        break;
      case 'manatee':
        searchUrl = `https://www.taxcollector.com/taxes/search?address=${encodeURIComponent(address)}`;
        break;
      case 'polk':
        searchUrl = `https://www.polktaxes.com/taxes/search?address=${encodeURIComponent(address)}`;
        break;
      case 'hernando':
        searchUrl = `https://www.hernandotax.us/taxes/search?address=${encodeURIComponent(address)}`;
        break;
      default:
        return {};
    }

    const res = await fetch(searchUrl, { headers: HEADERS });
    if (!res.ok) return {};

    const html = await res.text();

    // Extract tax exemptions (homestead, etc.)
    const exemptionPatterns = [
      /Homestead[:\s]*(Yes|No|Exempt|\$[\d,]+)/i,
      /Exemptions?[:\s]*([^<\n]+)/i,
      /Tax Exemption[:\s]*([^<\n]+)/i
    ];
    for (const pattern of exemptionPatterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].trim() !== '') {
        fields['32_tax_exemptions'] = { value: match[1].trim(), source, confidence: 'High' };
        break;
      }
    }

    // Extract mill rate / tax rate
    const ratePatterns = [
      /Mill(?:age)? Rate[:\s]*([\d.]+)/i,
      /Tax Rate[:\s]*([\d.]+%?)/i,
      /Rate[:\s]*([\d.]+)\s*mills/i
    ];
    for (const pattern of ratePatterns) {
      const match = html.match(pattern);
      if (match) {
        fields['33_property_tax_rate'] = { value: match[1], source, confidence: 'High' };
        break;
      }
    }

    // Extract tax history (look for table rows with years/amounts)
    const historyMatches = Array.from(html.matchAll(/(\d{4})[^$]*\$?([\d,]+\.?\d*)/g));
    const taxHistory: string[] = [];
    for (const match of historyMatches) {
      const year = parseInt(match[1]);
      if (year >= 2019 && year <= 2025) {
        taxHistory.push(`${match[1]}: $${match[2]}`);
      }
    }
    if (taxHistory.length > 0) {
      fields['34_recent_tax_history'] = { value: taxHistory.slice(0, 5).join(', '), source, confidence: 'High' };
    }

    // Extract special assessments (CDD, etc.)
    const assessmentPatterns = [
      /(?:Special|Non.?Ad.?Valorem) Assessment[s]?[:\s]*\$?([\d,]+)/i,
      /CDD[:\s]*\$?([\d,]+)/i,
      /Assessment[:\s]*\$?([\d,]+)/i
    ];
    for (const pattern of assessmentPatterns) {
      const match = html.match(pattern);
      if (match) {
        fields['35_special_assessments'] = { value: `$${match[1]}`, source, confidence: 'High' };
        break;
      }
    }

    return fields;
  } catch (e) {
    console.error(`${county} Tax Collector scrape error:`, e);
    return {};
  }
}

// ============================================
// PERMIT SCRAPERS (fields 40, 46, 59-62)
// Most Florida counties use Accela for permits
// ============================================

const PERMIT_URLS: Record<string, string> = {
  'pinellas': 'https://aca-prod.accela.com/pinellas/',
  'hillsborough': 'https://aca-prod.accela.com/hcfl/',
  'manatee': 'https://aca-prod.accela.com/manatee/',
  'polk': 'https://aca-prod.accela.com/POLKCO/',
  'pasco': 'https://aca-prod.accela.com/pasco/',
  'hernando': 'https://aca-prod.accela.com/hernando/'
};

async function scrapePermits(address: string, county: string): Promise<Record<string, any>> {
  const countyLower = county.toLowerCase().replace(' county', '').trim();
  const source = `${county} Building Department`;
  const fields: Record<string, any> = {};

  const baseUrl = PERMIT_URLS[countyLower];
  if (!baseUrl) return {};

  try {
    // Search for permits by address
    const searchUrl = `${baseUrl}Cap/CapHome.aspx?module=Building&TabName=Building&SearchType=Address&Address=${encodeURIComponent(address)}`;
    const res = await fetch(searchUrl, { headers: HEADERS });
    if (!res.ok) return {};

    const html = await res.text();

    // Look for roof permits
    const roofPermits: string[] = [];
    const roofMatches = Array.from(html.matchAll(/(?:Roof|Re-?roof)[^<]*?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4})/gi));
    for (const match of roofMatches) {
      roofPermits.push(match[0]);
    }
    if (roofPermits.length > 0) {
      fields['60_permit_history_roof'] = { value: roofPermits.slice(0, 3).join('; '), source, confidence: 'High' };

      // Calculate roof age from most recent permit
      const yearMatch = roofPermits[0].match(/(\d{4})/);
      if (yearMatch) {
        const roofYear = parseInt(yearMatch[1]);
        const age = new Date().getFullYear() - roofYear;
        fields['40_roof_age_est'] = { value: `${age} years (permit ${roofYear})`, source, confidence: 'High' };
      }
    }

    // Look for HVAC permits
    const hvacPermits: string[] = [];
    const hvacMatches = Array.from(html.matchAll(/(?:HVAC|A\/C|Air Condition|Heat|Mechanical)[^<]*?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4})/gi));
    for (const match of hvacMatches) {
      hvacPermits.push(match[0]);
    }
    if (hvacPermits.length > 0) {
      fields['61_permit_history_hvac'] = { value: hvacPermits.slice(0, 3).join('; '), source, confidence: 'High' };

      // Calculate HVAC age
      const yearMatch = hvacPermits[0].match(/(\d{4})/);
      if (yearMatch) {
        const hvacYear = parseInt(yearMatch[1]);
        const age = new Date().getFullYear() - hvacYear;
        fields['46_hvac_age'] = { value: `${age} years (permit ${hvacYear})`, source, confidence: 'High' };
      }
    }

    // Look for other permits (electrical, plumbing, additions)
    const otherPermits: string[] = [];
    const otherMatches = Array.from(html.matchAll(/(?:Electric|Plumb|Addition|Remodel|Renovat|Pool|Fence|Solar)[^<]*?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4})/gi));
    for (const match of otherMatches) {
      otherPermits.push(match[0]);
    }
    if (otherPermits.length > 0) {
      fields['62_permit_history_other'] = { value: otherPermits.slice(0, 5).join('; '), source, confidence: 'High' };
    }

    // Recent renovations summary
    const allPermits = [...roofPermits, ...hvacPermits, ...otherPermits];
    const recentPermits = allPermits.filter(p => {
      const yearMatch = p.match(/(\d{4})/);
      return yearMatch && parseInt(yearMatch[1]) >= 2019;
    });
    if (recentPermits.length > 0) {
      fields['59_recent_renovations'] = { value: `${recentPermits.length} permits since 2019`, source, confidence: 'Medium' };
    }

    return fields;
  } catch (e) {
    console.error(`${county} Permits scrape error:`, e);
    return {};
  }
}

// ============================================
// MAIN FUNCTION - Routes to correct county
// ============================================
export async function scrapeFloridaCounty(address: string, county: string): Promise<Record<string, any>> {
  let countyLower = county.toLowerCase().replace(' county', '').trim();

  // If county not provided, try to detect from ZIP
  if (!countyLower || countyLower === '') {
    const detected = detectCountyFromZip(address);
    if (detected) {
      countyLower = detected;
      console.log(`Detected county from ZIP: ${countyLower}`);
    }
  }

  console.log(`Scraping ${countyLower} county data...`);

  let allFields: Record<string, any> = {};

  // 1. Property Appraiser data
  let appraiserData: Record<string, any> = {};
  switch (countyLower) {
    case 'pinellas':
      appraiserData = await scrapePinellas(address);
      break;
    case 'hillsborough':
      appraiserData = await scrapeHillsborough(address);
      break;
    case 'manatee':
      appraiserData = await scrapeManatee(address);
      break;
    case 'polk':
      appraiserData = await scrapePolk(address);
      break;
    case 'pasco':
      appraiserData = await scrapePasco(address);
      break;
    case 'hernando':
      appraiserData = await scrapeHernando(address);
      break;
    default:
      console.log(`County "${county}" not supported for scraping`);
  }
  Object.assign(allFields, appraiserData);

  // 2. Tax Collector data (fields 32-35)
  const taxData = await scrapeTaxCollector(address, countyLower);
  Object.assign(allFields, taxData);

  // 3. Permit data (fields 37, 41, 52-55)
  const permitData = await scrapePermits(address, countyLower);
  Object.assign(allFields, permitData);

  console.log(`Found ${Object.keys(allFields).length} fields from ${countyLower} county sources`);
  return allFields;
}
