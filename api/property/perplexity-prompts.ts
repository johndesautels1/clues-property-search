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

🔴 FIRING ORDER: You are the FIRST LLM in the search chain (Tier 4).
PRIOR DATA SOURCES (Tier 3 - already ran BEFORE you):
- Tavily Web Search: Targeted searches for AVMs, market data, permits, portal views
- Free APIs: SchoolDigger, FBI Crime, WalkScore, FEMA, AirNow, Census, Weather

Your results will be processed BEFORE other LLMs (Gemini, GPT, Sonnet, Grok, Claude Opus).
Focus on fields that require DEEP web research beyond what Tier 3 already found.

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
  max_tokens: 32000,  // Standardized across all LLMs
  web_search_options: {
    search_context_size: 'medium'
  }
};

// ============================================================================
// PROMPT A: Listing Portals & Neighborhood Pricing
// Fields: listing_price, market_value, SPECIFIC AVMs (16a-16f), bedrooms, bathrooms, sqft,
//         property_type, garage, HOA, pool, renovations, neighborhood stats,
//         rental estimate, rent_zestimate, financing, comps
// ============================================================================
export function buildPromptA(address: string, city: string, county: string): string {
  return `You are a retrieval-only real estate research agent with LIVE WEB SEARCH.
Property address: "${address}"
City: ${city}
County: ${county}

Goal: Using only major residential listing portals (Redfin, Zillow, Realtor.com, Trulia, Homes.com), extract the following if explicitly available for this specific property or its immediate area:

listing_price

SPECIFIC AVM VALUES (search each source individually - DO NOT calculate averages, backend handles that):
zestimate (Zillow's Zestimate - search site:zillow.com for this address)
redfin_estimate (Redfin Estimate - search site:redfin.com for this address)
first_american_avm (First American AVM if available)
quantarium_avm (Quantarium AVM if available)
ice_avm (ICE/Intercontinental Exchange AVM if available)
collateral_analytics_avm (Collateral Analytics AVM if available)

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
rent_zestimate (Zillow's Rent Zestimate - search site:zillow.com for rental estimate)
common_financing_terms_or_incentives
notable_comparable_sales (short list with address, date, price, beds, baths, sqft if available)

Rules:
- Use only Redfin, Zillow, Realtor.com, Trulia, and Homes.com for property-level and neighborhood market stats.
- Prefer Redfin > Zillow > Realtor.com when values conflict.
- For AVMs: Search site:zillow.com for Zestimate, site:redfin.com for Redfin Estimate. Report each AVM separately.
- DO NOT calculate market_value_estimate - the backend will calculate this from the individual AVMs you provide.
- For neighborhood metrics, use portal "market stats" or similar pages for the neighborhood or ZIP.
- If listing_price and rental_estimate_monthly are both available, compute price_to_rent_ratio = listing_price / (rental_estimate_monthly * 12).
- Include a field only if you are ≥90% confident; otherwise omit it.
- IMPORTANT: Return FLAT values only, NOT nested objects. No source_name, source_url, or notes.

CRITICAL OUTPUT REQUIREMENTS:
- You MUST return ONLY valid JSON - no explanations, no commentary, no markdown
- If you cannot find data for a field, omit it or use null - DO NOT explain why
- If you cannot find ANY data, return an empty object: {}
- NEVER respond with explanatory text - JSON ONLY

Output format example:
{
  "listing_price": 500000,
  "zestimate": 485000,
  "redfin_estimate": 492000,
  "bedrooms": 3,
  "neighborhood_median_price": 520000,
  "rent_zestimate": 2400
}

Return valid JSON only, nothing else.`;
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
- IMPORTANT: Return FLAT values only, NOT nested objects.

CRITICAL OUTPUT REQUIREMENTS:
- You MUST return ONLY valid JSON - no explanations, no commentary, no markdown
- If you cannot find data for a field, omit it or use null - DO NOT explain why
- If you cannot find ANY data, return an empty object: {}
- NEVER respond with explanatory text - JSON ONLY

Output format example:
{
  "parcel_id": "29-30-16-12345-678-0900",
  "last_sale_date": "2020-05-15",
  "last_sale_price": 425000,
  "assessed_value_current_year": 450000,
  "annual_property_taxes": 6750,
  "permit_history_roof": "Roof replacement permit 2018-03-12"
}

Return valid JSON only, nothing else.`;
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
- IMPORTANT: Return FLAT values only, NOT nested objects.

CRITICAL OUTPUT REQUIREMENTS:
- You MUST return ONLY valid JSON - no explanations, no commentary, no markdown
- If you cannot find data for a field, use null - DO NOT explain why
- If you cannot find ANY data, return an empty object: {}
- NEVER respond with explanatory text - JSON ONLY

Output format example:
{
  "school_district_name": "Pinellas County Schools",
  "elementary_school_name": "Gulf Beaches Elementary",
  "elementary_school_rating_1_to_10": 8,
  "walk_score": 42,
  "transit_score": null,
  "violent_crime_index": null,
  "neighborhood_safety_rating_description": "Above Average"
}

Return valid JSON only, nothing else.`;
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

UTILITY PROVIDERS:
electric_utility_provider_name
typical_avg_monthly_electric_bill_usd
water_utility_provider_name
typical_avg_monthly_water_bill_usd
sewer_provider_name
natural_gas_provider_name_or_none
trash_or_solid_waste_provider_name

INTERNET & CONNECTIVITY:
main_internet_providers_top3 (list of provider names)
max_advertised_wired_download_speed_mbps
fiber_internet_available_boolean
cable_tv_provider_name
cell_coverage_quality_rating (Excellent / Good / Fair / Poor)

STRUCTURE AGES (search county permit records or listing history):
roof_age_estimated_years (estimated roof age in years - search for roof permits, replacement dates, or listing mentions)
hvac_age_estimated_years (estimated HVAC system age in years - search for HVAC permits, replacement dates, or listing mentions)

Rules for bills (electric and water):
- Prefer address- or city-specific data from local utilities or official/regional rate studies.
- Start from Tampa Bay / Florida typical bills when local data is not available, then adjust slightly based on size, bathrooms, floors, year built, and pool presence.
- Always return a single best estimate for typical_avg_monthly_electric_bill_usd and typical_avg_monthly_water_bill_usd, not a range.
- Never extrapolate from other states; stay within Tampa Bay / Florida benchmarks where regional context is required.
- IMPORTANT for water bills: Many Florida utilities bill bi-monthly (every 2 months). If you find bi-monthly water bill data, DIVIDE BY 2 to get the monthly amount. Typical FL monthly water bill is $40-80.

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
- IMPORTANT: Return FLAT values only, NOT nested objects. No source_name, source_url, or notes.
- If a specific provider type truly does not exist (e.g., natural gas), set value to null.

CRITICAL OUTPUT REQUIREMENTS:
- You MUST return ONLY valid JSON - no explanations, no commentary, no markdown
- If you cannot find data for a field, use null - DO NOT explain why
- If you cannot find ANY data, return an empty object: {}
- NEVER respond with explanatory text - JSON ONLY

Output format example:
{
  "electric_utility_provider_name": "Duke Energy",
  "typical_avg_monthly_electric_bill_usd": 165,
  "water_utility_provider_name": "City of St. Petersburg",
  "typical_avg_monthly_water_bill_usd": 55,
  "max_advertised_wired_download_speed_mbps": 1000,
  "fiber_internet_available_boolean": true,
  "cell_coverage_quality_rating": "Excellent"
}

Return valid JSON only, nothing else.`;
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
- IMPORTANT: Return FLAT values only, NOT nested objects.

CRITICAL OUTPUT REQUIREMENTS:
- You MUST return ONLY valid JSON - no explanations, no commentary, no markdown
- If you cannot find data, return empty object: {}
- NEVER respond with explanatory text - JSON ONLY

Output format example:
{
  "notable_comparable_sales": [
    {"address": "123 Beach Dr", "sale_date": "2025-11-15", "sale_price": 495000, "beds": 3, "baths": 2, "sqft": 1850, "distance_miles": 0.2}
  ],
  "typical_financing_terms_or_concessions_for_area": "3% seller credits common, 5-10% down payment typical"
}

Return valid JSON only, nothing else.`;
}

// ============================================================================
// PROMPT F: Property Features & Market Activity (ADDED 2026-01-08)
// Fields: EV charging, smart home, accessibility, special assessments,
//         portal views (Zillow, Redfin, Homes.com, Realtor.com), saves/favorites
// ============================================================================
export function buildPromptF(address: string, city: string): string {
  return `You are a retrieval-only property features and market activity research agent with LIVE WEB SEARCH.
Property address: "${address}"
City: ${city}

Goal: Using listing portals (Zillow, Redfin, Realtor.com, Homes.com, Trulia), extract:

PROPERTY FEATURES (from listing descriptions):
ev_charging (EV charging capability: e.g., "Tesla charger installed", "240V outlet in garage", "None", null if unknown)
smart_home_features (smart home technology: e.g., "Nest thermostat, smart locks, Ring doorbell", null if none mentioned)
accessibility_modifications (accessibility features: e.g., "Wheelchair ramp, grab bars, wide doorways", null if none mentioned)
special_assessments (any special assessments or pending HOA assessments: e.g., "Roof assessment $5,000 due 2026", null if none)

MARKET PERFORMANCE METRICS (search market data sites like Movoto, Estately, Redfin Market Data):
months_of_inventory (months of housing supply in ZIP/city: <3mo = seller's market, 3-6mo = balanced, >6mo = buyer's market)
new_listings_30d (new listings in ZIP/city in last 30 days - supply indicator)
homes_sold_30d (homes sold in ZIP/city in last 30 days - demand indicator)
median_dom_zip (median days on market for ZIP/city - velocity indicator)
price_reduced_percent (percentage of active listings with price reductions - market pressure indicator)
homes_under_contract (homes currently pending in ZIP/city - competition indicator)

Rules:
- Search market data sites: Movoto, Estately, Redfin Market Data, Homes.com market stats
- For market metrics: Search ZIP-level or city-level data (not individual property)
- For features: Extract from property description or features list
- Include a field only if you are ≥90% confident; otherwise use null
- IMPORTANT: Return FLAT values only, NOT nested objects

CRITICAL OUTPUT REQUIREMENTS:
- You MUST return ONLY valid JSON - no explanations, no commentary, no markdown
- If you cannot find data for a field, use null - DO NOT explain why
- If you cannot find ANY data, return an empty object: {}
- NEVER respond with explanatory text - JSON ONLY

Output format example:
{
  "ev_charging": "240V outlet in garage",
  "smart_home_features": "Nest thermostat, Ring doorbell",
  "accessibility_modifications": null,
  "special_assessments": null,
  "months_of_inventory": 4.2,
  "new_listings_30d": 156,
  "homes_sold_30d": 142,
  "median_dom_zip": 28,
  "price_reduced_percent": 18.5,
  "homes_under_contract": 89
}

Return valid JSON only, nothing else.`;
}

// ============================================================================
// Field Name → Field ID Mapping
// Used by normalizer to map Perplexity's natural language keys to our schema
// ============================================================================
export const PERPLEXITY_FIELD_MAPPING: Record<string, string | null> = {
  // Prompt A - Listing Portals
  'listing_price': '10_listing_price',
  'market_value_estimate': '12_market_value_estimate',
  'automated_valuation_models': '16_avms', // Legacy - keep for backwards compat

  // SPECIFIC AVM FIELDS (16a-16f) - Added 2026-01-08
  'zestimate': '16a_zestimate',
  'redfin_estimate': '16b_redfin_estimate',
  'first_american_avm': '16c_first_american_avm',
  'quantarium_avm': '16d_quantarium_avm',
  'ice_avm': '16e_ice_avm',
  'collateral_analytics_avm': '16f_collateral_analytics_avm',
  'rent_zestimate': '181_rent_zestimate',

  'bedrooms': '17_bedrooms',
  'full_bathrooms': '18_full_bathrooms',
  'half_bathrooms': '19_half_bathrooms',
  'living_sqft': '21_living_sqft',
  'property_type': '26_property_type',
  'garage_spaces': '28_garage_spaces',
  'hoa_present': '30_hoa_yn',
  'hoa_fee_annual': '31_association_fee', // FIXED 2026-01-12: Map to canonical field name
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
  'violent_crime_rate_per_1000_residents': '88_violent_crime_index',
  'property_crime_index': '89_property_crime_index',
  'property_crime_rate_per_1000_residents': '89_property_crime_index',
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

  // Prompt D - Structure Ages (ADDED 2026-01-08)
  'roof_age_estimated_years': '40_roof_age_est',
  'roof_age_est': '40_roof_age_est',
  'roof_age': '40_roof_age_est',
  'hvac_age_estimated_years': '46_hvac_age',
  'hvac_age_est': '46_hvac_age',
  'hvac_age': '46_hvac_age',

  // Prompt F - Property Features & Market Activity (UPDATED 2026-01-11: Fields 169-174 repurposed)
  'ev_charging': '133_ev_charging',
  'smart_home_features': '134_smart_home_features',
  'accessibility_modifications': '135_accessibility_modifications',
  'special_assessments': '138_special_assessments',
  'months_of_inventory': '169_months_of_inventory',
  'new_listings_30d': '170_new_listings_30d',
  'homes_sold_30d': '171_homes_sold_30d',
  'median_dom_zip': '172_median_dom_zip',
  'price_reduced_percent': '173_price_reduced_percent',
  'homes_under_contract': '174_homes_under_contract',

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
  'note': null, // Singular version
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
  'data_confidence_notes': null,

  // Subject property echo fields - Perplexity sometimes echoes input data
  'subject_property_address': null, // Already captured in 1_full_address
  'subject_property_beds': '17_bedrooms',
  'subject_property_baths': '20_total_bathrooms',
  'subject_property_sqft': '21_living_sqft',
  'subject_property_year_built': '25_year_built',
  'subject_property_lot_size_acres': '24_lot_size_acres',
  'subject_property_county': '7_county',
  // Short aliases (Perplexity sometimes omits 'subject_' prefix)
  'property_beds': '17_bedrooms',
  'property_baths': '20_total_bathrooms',
  'property_sqft': '21_living_sqft',
  'property_year_built': '25_year_built',

  // Additional field aliases Perplexity returns (discovered 2026-01-06)
  'current_listing_price': '10_listing_price',
  'current_listing_status': '4_listing_status',
  'current_beds_baths_sqft': null, // Metadata - individual fields already mapped
  'mls_id': '2_mls_primary',
  'comparable_sales_note': '103_comparable_sales', // Singular variant
  'financing_note': '102_financing_terms', // Singular variant
  'data_quality_notes': null, // Metadata about response quality - skip

  // Waterfront fields (155-159) - Aliases for LLM responses
  // Note: Web search rarely finds these, but map them if returned
  'water_frontage_yn': '155_water_frontage_yn',
  'water_frontage': '155_water_frontage_yn',
  'waterfront_yn': '155_water_frontage_yn',
  'waterfront': '155_water_frontage_yn',
  'on_water': '155_water_frontage_yn',
  'is_waterfront': '155_water_frontage_yn',
  'waterfront_property': '155_water_frontage_yn',
  'waterfront_feet': '156_waterfront_feet',
  'water_feet': '156_waterfront_feet',
  'water_frontage_feet': '156_waterfront_feet',
  'frontage_feet': '156_waterfront_feet',
  'water_access_yn': '157_water_access_yn',
  'water_access': '157_water_access_yn',
  'has_water_access': '157_water_access_yn',
  'water_view_yn': '158_water_view_yn',
  'water_view': '158_water_view_yn',
  'has_water_view': '158_water_view_yn',
  'water_body_name': '159_water_body_name',
  'water_body': '159_water_body_name',
  'body_of_water': '159_water_body_name',
  'waterbody': '159_water_body_name',
  'water_name': '159_water_body_name',
};

/**
 * Flatten nested Perplexity response objects
 * Perplexity may return: { field: { value: X, source_name: Y, ... } }
 * We need to extract just the value: { field: X }
 */
function flattenPerplexityResponse(response: Record<string, any>): Record<string, any> {
  const flattened: Record<string, any> = {};

  for (const [key, val] of Object.entries(response)) {
    if (val === null || val === undefined) {
      continue;
    }

    // If it's an object with a 'value' property, extract the value
    if (typeof val === 'object' && !Array.isArray(val) && 'value' in val) {
      flattened[key] = val.value;
      // Log source info for debugging
      if (val.source_name || val.source_url) {
        console.log(`📝 [Perplexity] ${key}: "${val.value}" (source: ${val.source_name || val.source_url || 'N/A'})`);
      }
    } else {
      // Use value as-is
      flattened[key] = val;
    }
  }

  return flattened;
}

/**
 * Maps Perplexity response fields to our internal field IDs
 * - Fields mapped to null are metadata and will be silently skipped
 * - Unknown fields will log a warning for future mapping
 */
export function mapPerplexityFieldsToSchema(perplexityResponse: Record<string, any>): Record<string, any> {
  // First flatten any nested objects with 'value' property
  const flatResponse = flattenPerplexityResponse(perplexityResponse);

  const mapped: Record<string, any> = {};

  for (const [naturalKey, fieldData] of Object.entries(flatResponse)) {
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
