/**
 * Perplexity Consolidated Prompts (A-E)
 *
 * Recommended by Perplexity for optimal performance:
 * - 1 shared system prompt
 * - 5 consolidated task prompts (down from 10)
 * - Natural language field names (normalizer handles field IDs)
 * - Coherent source sets per prompt
 */

// ============================================================================
// SHARED SYSTEM PROMPT - Used for all Perplexity calls
// ============================================================================
export const PERPLEXITY_SYSTEM_PROMPT = `You are a real estate data analyst using LIVE WEB SEARCH.
Use only reputable, primary sources relevant to the task (listing portals, county .gov sites, official school data, WalkScore, crime data providers, utilities, broadband providers, carrier maps).
Extract only explicitly stated values or simple calculations based on explicit values.
Keep web searches and pages consulted to the minimum needed for reliable answers.
Never guess, infer, or summarize beyond the sources.
If you are not at least 90% confident for a field, omit it or use null as specified.
Respond in valid JSON only, with the exact keys requested in the user message.`;

// ============================================================================
// API Configuration
// ============================================================================
export const PERPLEXITY_CONFIG = {
  model: 'sonar-reasoning-pro',
  temperature: 0.2,
  max_tokens: 2500,
  web_search_options: {
    search_context_size: 'medium'
  }
};

// ============================================================================
// PROMPT A: Listing Portals & Neighborhood Pricing
// Fields: listing_price, market_value, AVMs, bedrooms, bathrooms, sqft,
//         property_type, garage, HOA, pool, renovations, neighborhood stats,
//         rental estimate, financing, comps
// ============================================================================
export function buildPromptA(address: string, city: string, county: string): string {
  return `You are a retrieval-only real estate research agent with LIVE WEB SEARCH.
Property address: "${address}"
City: ${city}
County: ${county}

Goal: Using only major residential listing portals (Redfin, Zillow, Realtor.com, Trulia, Homes.com), extract the following if explicitly available for this specific property or its immediate area:

listing_price
market_value_estimate
automated_valuation_models (list of AVMs with name and value)
bedrooms
full_bathrooms
half_bathrooms
living_sqft
property_type
garage_spaces
hoa_present
hoa_fee_annual
hoa_name
hoa_includes
garage_type
pool_present
pool_type
recent_renovations_or_upgrades (short text from listing if mentioned)
neighborhood_median_price
neighborhood_avg_price_per_sqft
neighborhood_price_to_rent_ratio
property_price_vs_neighborhood_median_percent
neighborhood_avg_days_on_market
rental_estimate_monthly
common_financing_terms_or_incentives
notable_comparable_sales (short list with address, date, price, beds, baths, sqft if available)

Rules:
- Use only Redfin, Zillow, Realtor.com, Trulia, and Homes.com for property-level and neighborhood market stats.
- Prefer Redfin > Zillow > Realtor.com when values conflict.
- For neighborhood metrics, use portal "market stats" or similar pages for the neighborhood or ZIP.
- If listing_price and rental_estimate_monthly are both available, compute price_to_rent_ratio = listing_price / (rental_estimate_monthly * 12).
- Include a field only if you are ≥90% confident; otherwise omit it.
- For each returned field, include: value, source_name, source_url.

Output JSON only, no commentary. Example shape:
{
  "listing_price": { "value": 500000, "source_name": "Redfin", "source_url": "https://..." },
  "bedrooms": { "value": 3, "source_name": "Zillow", "source_url": "https://..." },
  "neighborhood_median_price": { "value": 520000, "source_name": "Redfin", "source_url": "https://..." }
}`;
}

// ============================================================================
// PROMPT B: County / Public Records
// Fields: parcel_id, sale history, assessed value, taxes, permits,
//         subdivision, legal description, exemptions, CDD
// ============================================================================
export function buildPromptB(address: string, county: string, parcelId?: string): string {
  return `You are a retrieval-only county records research agent with LIVE WEB SEARCH.
Property address: "${address}"
County: ${county}
Parcel ID (if known): ${parcelId || 'Unknown'}

Goal: Using only official county and municipal government sites (.gov or official county domains such as property appraiser, tax collector, recorder, or building/permit portals), extract:

parcel_id
last_sale_date
last_sale_price
assessed_value_current_year
annual_property_taxes
tax_year_of_record
effective_property_tax_rate_percent
property_tax_exemptions (list)
permit_history_roof (summarize permits for roof)
permit_history_hvac
permit_history_other
subdivision_or_platted_name
legal_description
homestead_exemption_present
community_development_district_present
community_development_district_annual_fee

Rules:
- Use only official county/municipal sources (.gov or official property appraiser / tax collector / permit portals).
- Do not use listing portals (Zillow/Redfin) for any of these fields.
- You may compute effective_property_tax_rate_percent as (annual_property_taxes ÷ assessed_value_current_year) × 100 if both values are explicitly provided.
- Include a field only if you are ≥90% confident; otherwise omit it.
- For each returned field, include: value, source_name, source_url.

Output JSON only with those keys as needed, no commentary.`;
}

// ============================================================================
// PROMPT C: Schools, Walkability, Crime & Neighborhood Safety
// Fields: school district, elementary/middle/high schools with ratings,
//         walk/transit/bike scores, noise, traffic, crime indices
// ============================================================================
export function buildPromptC(address: string, city: string, county: string): string {
  return `You are a retrieval-only neighborhood quality research agent with LIVE WEB SEARCH.
Property address: "${address}"
City: ${city}
County: ${county}

Goal: Using only the specified authoritative sources, extract:

school_district_name
elementary_school_name
elementary_school_rating_1_to_10
elementary_school_distance_miles
middle_school_name
middle_school_rating_1_to_10
middle_school_distance_miles
high_school_name
high_school_rating_1_to_10
high_school_distance_miles
walk_score
transit_score
bike_score
walkability_description_short
noise_level_description_short
traffic_level_description_short
violent_crime_index
property_crime_index
neighborhood_safety_rating_description

Rules for schools:
- Use only GreatSchools.org and official school district sites.
- For ratings, use only numeric 1–10 values clearly shown on GreatSchools profiles.
- Distances in miles only if explicitly shown by GreatSchools.
- Do not infer attendance boundaries; only report what sources explicitly state.

Rules for walkability & noise:
- Use WalkScore.com for walk_score, transit_score, bike_score, and walkability_description_short.
- Use HowLoud.com or similar specialized noise sources for noise and traffic descriptions when available.

Rules for crime and safety:
- Use NeighborhoodScout, CrimeGrade, or official police/crime portals.
- Do not compute your own indices; report only explicit indices or ratings and label them clearly.

General rules:
- Include a field only if you are ≥90% confident.
- For each returned field: value, source_name, source_url.

Output JSON only, no commentary.`;
}

// ============================================================================
// PROMPT D: Utilities & Recurring Bills
// Fields: electric/water/sewer/gas/trash providers, monthly bills,
//         internet providers, speeds, fiber, cell coverage
// ============================================================================
export interface PromptDContext {
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  hasPool?: boolean;
  sqft?: number | string;
  floors?: number | string;
  yearBuilt?: number | string;
}

export function buildPromptD(ctx: PromptDContext): string {
  return `You are a retrieval-only utilities and connectivity research agent with LIVE WEB SEARCH.
Property address: "${ctx.address}"
City: ${ctx.city}
State: ${ctx.state}
ZIP: ${ctx.zip}
Bedrooms: ${ctx.bedrooms || 'Unknown'}
Bathrooms: ${ctx.bathrooms || 'Unknown'}
Has pool: ${ctx.hasPool ? 'Yes' : 'No'}
Square footage: ${ctx.sqft || 'Unknown'}
Floors/stories: ${ctx.floors || 'Unknown'}
Year built: ${ctx.yearBuilt || 'Unknown'}

Goal: Using local utility, municipal, and reputable rate/availability sources, extract:

electric_utility_provider_name
typical_avg_monthly_electric_bill_usd
water_utility_provider_name
typical_avg_monthly_water_bill_usd
sewer_provider_name
natural_gas_provider_name_or_none
trash_or_solid_waste_provider_name
main_internet_providers_top3 (list of provider names)
max_advertised_wired_download_speed_mbps
fiber_internet_available_boolean
cable_tv_provider_name
cell_coverage_quality_rating (Excellent / Good / Fair / Poor)

Rules for bills (electric and water):
- Prefer address- or city-specific data from local utilities or official/regional rate studies.
- Start from Tampa Bay / Florida typical bills when local data is not available, then adjust slightly based on size, bathrooms, floors, year built, and pool presence.
- Always return a single best estimate for typical_avg_monthly_electric_bill_usd and typical_avg_monthly_water_bill_usd, not a range.
- Never extrapolate from other states; stay within Tampa Bay / Florida benchmarks where regional context is required.

Rules for internet and fiber:
- Use BroadbandNow, FCC National Broadband Map, or provider availability checkers.
- max_advertised_wired_download_speed_mbps should be the highest clearly advertised residential wired speed (fiber, cable, DSL, fixed wireless).
- fiber_internet_available_boolean is true only if at least one provider explicitly shows fiber at the address or clearly within the same ZIP/city coverage.

Rules for cell coverage:
- Use carrier coverage maps (Verizon, AT&T, T-Mobile) or reputable aggregators (OpenSignal, RootMetrics).
- Map coverage to:
  - "Excellent" = 5G from 2+ carriers.
  - "Good" = strong 4G LTE from all major carriers.
  - "Fair" or "Poor" only if clearly indicated.
- If address-level data is unclear but the city/ZIP is a typical Tampa Bay metro area with strong coverage, default to at least "Good".

General rules:
- For each field, include: value, source_name (or description of benchmark level), source_url if applicable, and a short notes string where helpful.
- If a specific provider type truly does not exist (e.g., natural gas), set value to null and briefly explain in notes.

Output JSON only, no commentary.`;
}

// ============================================================================
// PROMPT E: Comparable Sales & Financing Terms (Optional)
// Fields: notable_comparable_sales, financing terms/concessions
// ============================================================================
export function buildPromptE(address: string, city: string): string {
  return `You are a retrieval-only real estate comps and financing research agent with LIVE WEB SEARCH.
Property address: "${address}"
City: ${city}

Goal: Using listing portals and local market data sources, return:

notable_comparable_sales (list of nearby similar sales with address, sale_date, sale_price, beds, baths, sqft, distance_miles)
typical_financing_terms_or_concessions_for_area (short description: e.g., common down payment ranges, buydown incentives, seller credits, if explicitly mentioned in sources)

Rules:
- Use listing portals (Redfin, Zillow, Realtor.com) and local market/stat sites.
- Include only explicitly described comps; do not invent.
- For each comp, include source_name and source_url.

Output JSON only.`;
}

// ============================================================================
// Field Name → Field ID Mapping
// Used by normalizer to map Perplexity's natural language keys to our schema
// ============================================================================
export const PERPLEXITY_FIELD_MAPPING: Record<string, string> = {
  // Prompt A - Listing Portals
  'listing_price': '10_listing_price',
  'market_value_estimate': '12_market_value_estimate',
  'automated_valuation_models': '16_avms',
  'bedrooms': '17_bedrooms',
  'full_bathrooms': '18_full_bathrooms',
  'half_bathrooms': '19_half_bathrooms',
  'living_sqft': '21_living_sqft',
  'property_type': '26_property_type',
  'garage_spaces': '28_garage_spaces',
  'hoa_present': '30_hoa_yn',
  'hoa_fee_annual': '31_hoa_fee_annual',
  'hoa_name': '32_hoa_name',
  'hoa_includes': '33_hoa_includes',
  'garage_type': '44_garage_type',
  'pool_present': '54_pool_yn',
  'pool_type': '55_pool_type',
  'recent_renovations_or_upgrades': '59_recent_renovations',
  'neighborhood_median_price': '91_median_home_price_neighborhood',
  'neighborhood_avg_price_per_sqft': '92_price_per_sqft_recent_avg',
  'neighborhood_price_to_rent_ratio': '93_price_to_rent_ratio',
  'property_price_vs_neighborhood_median_percent': '94_price_vs_median_percent',
  'neighborhood_avg_days_on_market': '95_days_on_market_avg',
  'rental_estimate_monthly': '98_rental_estimate_monthly',
  'common_financing_terms_or_incentives': '102_financing_terms',
  'notable_comparable_sales': '103_comparable_sales',

  // Prompt B - County Records
  'parcel_id': '9_parcel_id',
  'last_sale_date': '13_last_sale_date',
  'last_sale_price': '14_last_sale_price',
  'assessed_value_current_year': '15_assessed_value',
  'annual_property_taxes': '35_annual_taxes',
  'tax_year_of_record': '36_tax_year',
  'effective_property_tax_rate_percent': '37_property_tax_rate',
  'property_tax_exemptions': '38_tax_exemptions',
  'permit_history_roof': '60_permit_history_roof',
  'permit_history_hvac': '61_permit_history_hvac',
  'permit_history_other': '62_permit_history_other',
  'subdivision_or_platted_name': '149_subdivision_name',
  'legal_description': '150_legal_description',
  'homestead_exemption_present': '151_homestead_yn',
  'community_development_district_present': '152_cdd_yn',
  'community_development_district_annual_fee': '153_annual_cdd_fee',

  // Prompt C - Schools, Walkability, Crime
  'school_district_name': '63_school_district',
  'elementary_school_name': '65_elementary_school',
  'elementary_school_rating_1_to_10': '66_elementary_rating',
  'elementary_school_distance_miles': '67_elementary_distance_mi',
  'middle_school_name': '68_middle_school',
  'middle_school_rating_1_to_10': '69_middle_rating',
  'middle_school_distance_miles': '70_middle_distance_mi',
  'high_school_name': '71_high_school',
  'high_school_rating_1_to_10': '72_high_rating',
  'high_school_distance_miles': '73_high_distance_mi',
  'walk_score': '74_walk_score',
  'transit_score': '75_transit_score',
  'bike_score': '76_bike_score',
  'walkability_description_short': '80_walkability_description',
  'noise_level_description_short': '78_noise_level',
  'traffic_level_description_short': '79_traffic_level',
  'violent_crime_index': '88_violent_crime_index',
  'property_crime_index': '89_property_crime_index',
  'neighborhood_safety_rating_description': '90_neighborhood_safety_rating',

  // Prompt D - Utilities
  'electric_utility_provider_name': '104_electric_provider',
  'typical_avg_monthly_electric_bill_usd': '105_avg_electric_bill',
  'water_utility_provider_name': '106_water_provider',
  'typical_avg_monthly_water_bill_usd': '107_avg_water_bill',
  'sewer_provider_name': '108_sewer_provider',
  'natural_gas_provider_name_or_none': '109_natural_gas',
  'trash_or_solid_waste_provider_name': '110_trash_provider',
  'main_internet_providers_top3': '111_internet_providers_top3',
  'max_advertised_wired_download_speed_mbps': '112_max_internet_speed',
  'fiber_internet_available_boolean': '113_fiber_available',
  'cable_tv_provider_name': '114_cable_tv_provider',
  'cell_coverage_quality_rating': '115_cell_coverage_quality',

  // Prompt E - Comps (same as A, already mapped above)
  'typical_financing_terms_or_concessions_for_area': '102_financing_terms',

  // Additional field aliases that Perplexity sometimes returns
  'property_address': '1_full_address',
  'address': '1_full_address',
  'full_address': '1_full_address',
  'city': null, // Metadata - ignore (already part of address)
  'state': null, // Metadata - ignore
  'zip': null, // Metadata - ignore
  'zip_code': '8_zip_code',
  'comparable_sales_notes': '103_comparable_sales',
  'financing_notes': '102_financing_terms',

  // Metadata fields - explicitly map to null to suppress warnings
  'status': null,
  'reason': null,
  'notes': null,
  'search_date': null,
  'data_limitations': null,
  'data_confidence': null,
  'source': null,
  'sources': null,
  'source_url': null,
  'source_urls': null,
  'query': null,
  'timestamp': null,
  'error': null,
  'message': null,
};

/**
 * Maps Perplexity response fields to our internal field IDs
 * - Fields mapped to null are metadata and will be silently skipped
 * - Unknown fields will log a warning for future mapping
 */
export function mapPerplexityFieldsToSchema(perplexityResponse: Record<string, any>): Record<string, any> {
  const mapped: Record<string, any> = {};

  for (const [naturalKey, fieldData] of Object.entries(perplexityResponse)) {
    // Check if key exists in mapping (including null mappings)
    if (naturalKey in PERPLEXITY_FIELD_MAPPING) {
      const schemaFieldId = PERPLEXITY_FIELD_MAPPING[naturalKey];
      // Skip null mappings (metadata fields) - don't add to output
      if (schemaFieldId !== null) {
        mapped[schemaFieldId] = fieldData;
      }
      // Null mappings are silently skipped (no warning)
    } else {
      // Unknown field - log warning for future mapping
      console.warn(`[Perplexity Mapper] Unknown field: ${naturalKey}`);
      // Don't add unknown fields to output to keep data clean
    }
  }

  return mapped;
}
