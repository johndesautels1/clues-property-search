/**
 * CLUES Property Search - Retry with LLM Endpoint
 * Simple JSON endpoint for single-field LLM retry from PropertyDetail page
 *
 * This is a NON-STREAMING endpoint that returns JSON directly.
 * Used by the "Retry with LLM" button on individual fields.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { LLM_CASCADE_ORDER } from './llm-constants.js';
import {
  FLAT_TO_NUMBERED_FIELD_MAP,
  mapFlatFieldsToNumbered as sharedMapFlatFieldsToNumbered,
  isMonthlyHoaFeeKey,
  convertMonthlyHoaToAnnual
} from '../../src/lib/field-map-flat-to-numbered.js';
import {
  safeJsonParse,
  extractAndParseJson,
  sanitizeAddress,
  isValidAddress
} from '../../src/lib/safe-json-parse.js';
// Inline JSON data to avoid Vercel import issues with `with { type: 'json' }` syntax
// UPDATED 2026-01-09: 47 high-velocity fields for LLM field completion
const missingFieldsList = {
  missing_field_keys: [
    "12_market_value_estimate", "16a_zestimate", "16b_redfin_estimate",
    "16c_first_american_avm", "16d_quantarium_avm", "16e_ice_avm", "16f_collateral_analytics_avm",
    "40_roof_age_est", "46_hvac_age",
    "59_recent_renovations", "60_permit_history_roof", "61_permit_history_hvac", "62_permit_history_other",
    "81_public_transit_access", "82_commute_to_city_center",
    "91_median_home_price_neighborhood", "92_price_per_sqft_recent_avg", "95_days_on_market_avg",
    "96_inventory_surplus", "97_insurance_est_annual", "98_rental_estimate_monthly",
    "103_comparable_sales", "104_electric_provider", "105_avg_electric_bill",
    "106_water_provider", "107_avg_water_bill", "109_natural_gas", "110_trash_provider",
    "111_internet_providers_top3", "114_cable_tv_provider",
    "133_ev_charging", "134_smart_home_features", "135_accessibility_modifications", "138_special_assessments",
    "169_months_of_inventory", "170_new_listings_30d", "171_homes_sold_30d", "172_median_dom_zip",
    "173_price_reduced_percent", "174_homes_under_contract", "175_market_type", "176_avg_sale_to_list_percent",
    "177_avg_days_to_pending", "178_multiple_offers_likelihood", "179_appreciation_percent", "180_price_trend", "181_rent_zestimate"
  ]
};
const missingFieldsRules = {
  field_rules: {
    // AVMs & Market Values (12_market_value_estimate is backend-calculated from highest-tier verified AVM)
    "12_market_value_estimate": { type: "number", definition: "DO NOT RETURN - Backend calculates from highest-tier verified AVM source." },
    "16a_zestimate": { type: "number", definition: "Zillow's Zestimate value in USD. Search 'site:zillow.com [address]'." },
    "16b_redfin_estimate": { type: "number", definition: "Redfin's estimate value in USD. Search 'site:redfin.com [address]'." },
    "16c_first_american_avm": { type: "number", definition: "First American AVM value in USD. Search real estate portals, lender sites, and property reports that may display this value." },
    "16d_quantarium_avm": { type: "number", definition: "Quantarium AVM value in USD. Search real estate portals and property valuation sites that may display this value." },
    "16e_ice_avm": { type: "number", definition: "ICE (Intercontinental Exchange) AVM value in USD. Search mortgage/lending sites and property reports that may display this value." },
    "16f_collateral_analytics_avm": { type: "number", definition: "Collateral Analytics AVM value in USD. Search real estate portals and valuation reports that may display this value." },

    // Transit & Location
    "81_public_transit_access": { type: "string", definition: "Description of public transit options (bus routes, train stations) within 1 mile of property." },
    "82_commute_to_city_center": { type: "string", definition: "Estimated commute time to nearest major city center by car during rush hour." },

    // Market Statistics
    "91_median_home_price_neighborhood": { type: "number", definition: "Median home sale price in the neighborhood/ZIP code in USD. Search '[ZIP] median home price 2024 2025'." },
    "92_price_per_sqft_recent_avg": { type: "number", definition: "Average price per square foot for recent sales in the area in USD." },
    "95_days_on_market_avg": { type: "number", definition: "Average days on market for listings in this ZIP/neighborhood." },
    "96_inventory_surplus": { type: "string", definition: "Market inventory status: 'Buyer's Market' (>6 months inventory), 'Seller's Market' (<3 months), or 'Balanced' (3-6 months)." },
    "97_insurance_est_annual": { type: "number", definition: "Estimated annual homeowners insurance cost in USD for this property type and location." },
    "98_rental_estimate_monthly": { type: "number", definition: "Estimated monthly rent in USD. Search 'site:zillow.com [address] rent' or 'site:rentometer.com [ZIP]'." },

    // Comparable Sales
    "103_comparable_sales": { type: "array", definition: "Array of 3-5 recent comparable sales within 1 mile. Each comp: {address, sale_price, sale_date, sqft, beds, baths}." },

    // Utilities
    "104_electric_provider": { type: "string", definition: "Primary electric utility company serving this address (e.g., 'Duke Energy', 'Florida Power & Light')." },
    "105_avg_electric_bill": { type: "number", definition: "Average monthly electric bill in USD for this property size in this area." },
    "106_water_provider": { type: "string", definition: "Primary water utility company or municipality providing water service." },
    "107_avg_water_bill": { type: "number", definition: "Average MONTHLY water/sewer bill in USD. IMPORTANT: Many FL utilities bill bi-monthly - if you find bi-monthly data, DIVIDE BY 2 to get monthly. Typical FL monthly water bill is $40-80." },
    "110_trash_provider": { type: "string", definition: "Trash/solid waste collection provider (often same as city/county)." },
    "111_internet_providers_top3": { type: "array", definition: "Top 3 internet providers available at this address with max speeds. Example: ['Spectrum (400 Mbps)', 'AT&T Fiber (1 Gbps)', 'T-Mobile 5G']." },
    "114_cable_tv_provider": { type: "string", definition: "Primary cable TV provider available at this address." },

    // Market Performance Metrics (Fields 169-181) - Updated 2026-01-11
    "169_months_of_inventory": { type: "number", definition: "Months of housing inventory in the ZIP/city. <3 = Seller's Market, 3-6 = Balanced, >6 = Buyer's Market." },
    "170_new_listings_30d": { type: "number", definition: "Number of new listings in the ZIP/city in the last 30 days. Rising count indicates increasing supply." },
    "171_homes_sold_30d": { type: "number", definition: "Number of homes sold in the ZIP/city in the last 30 days. Rising count indicates strong demand." },
    "172_median_dom_zip": { type: "number", definition: "Median days on market for homes in this ZIP code. <20 = hot market, >60 = slow market." },
    "173_price_reduced_percent": { type: "number", definition: "Percentage of active listings with price reductions in this ZIP. High % indicates overpriced market or cooling demand." },
    "174_homes_under_contract": { type: "number", definition: "Number of homes currently under contract (pending) in the ZIP. High count indicates competitive market." },
    "175_market_type": { type: "string", definition: "Market classification: 'Buyer's Market', 'Balanced Market', or 'Seller's Market' based on months of supply." },
    "176_avg_sale_to_list_percent": { type: "number", definition: "Average sale price as percentage of list price (e.g., 102 = homes selling 2% above asking). >100% = bidding wars." },
    "177_avg_days_to_pending": { type: "number", definition: "Average days from listing to pending status in ZIP. <10 = very competitive, >30 = slower market." },
    "178_multiple_offers_likelihood": { type: "string", definition: "Likelihood of multiple offers: 'High', 'Medium', or 'Low'. Infer from Market Type, Sale-to-List %, Days to Pending." },
    "179_appreciation_percent": { type: "number", definition: "Year-over-year home appreciation percentage in ZIP (e.g., 5.2 = 5.2% YoY growth)." },
    "180_price_trend": { type: "string", definition: "Price trend: 'Falling' (<-2% YoY), 'Stable' (-2% to +2%), or 'Rising' (>+2% YoY)." },
    "181_rent_zestimate": { type: "number", definition: "Zillow Rent Zestimate for this property in USD/month. Search 'site:zillow.com [address] rent zestimate'." },

    // Structure & Systems (ADDED 2026-01-08)
    "40_roof_age_est": { type: "string", definition: "Estimated roof age (e.g., '5-10 years', 'New 2020'). Extract from permits or calculate from year built." },
    "46_hvac_age": { type: "string", definition: "HVAC system age (e.g., '3 years', 'Replaced 2022'). Extract from permits or calculate from year built." },

    // Permits & Renovations (ADDED 2026-01-08)
    "59_recent_renovations": { type: "string", definition: "Recent renovations or upgrades (e.g., 'Kitchen remodel 2023, New flooring 2024'). Search listing portals." },
    "60_permit_history_roof": { type: "string", definition: "Roof permit history from county building department (e.g., 'Roof replacement 2019'). Search '[ADDRESS] [COUNTY] building permits roof'." },
    "61_permit_history_hvac": { type: "string", definition: "HVAC permit history from county building department (e.g., 'AC unit replacement 2021'). Search '[ADDRESS] [COUNTY] building permits HVAC'." },
    "62_permit_history_other": { type: "string", definition: "Other significant permit history (additions, pool, electrical, plumbing). Search '[ADDRESS] [COUNTY] building permits'." },

    // Utilities (ADDED 2026-01-08)
    "109_natural_gas": { type: "string", definition: "Natural gas provider name or 'None' if all-electric. Search '[CITY] [STATE] natural gas provider'." },

    // Property Features (ADDED 2026-01-08) - CORRECTED per fields-schema.ts SOURCE OF TRUTH
    "133_ev_charging": { type: "string", definition: "EV charging availability (e.g., 'Tesla charger installed', '240V outlet in garage', 'None'). Search listing portals." },
    "134_smart_home_features": { type: "string", definition: "Smart home technology (e.g., 'Nest thermostat, Alexa integration, smart locks'). Search listing portals." },
    "135_accessibility_modifications": { type: "string", definition: "Accessibility features (e.g., 'Wheelchair ramp, grab bars, wide doorways, ADA compliant'). Search listing portals." },
    "138_special_assessments": { type: "string", definition: "Special assessments or pending HOA assessments (e.g., 'Roof assessment $5000', 'Road paving assessment'). Search listing portals and HOA docs." },

    // Legacy fields (kept for backward compatibility)
    "120_flood_risk_level": { type: "string", definition: "FEMA flood zone designation or flood risk category." },
    "124_hurricane_risk": { type: "string", definition: "Hurricane risk level or evacuation zone." },
    "35_annual_taxes": { type: "number", definition: "Most recent annual property tax amount in USD from county records." }
  }
};
import { GEMINI_FIELD_COMPLETER_SYSTEM, buildGeminiFieldCompleterUserPrompt } from '../../src/config/gemini-prompts.js';

// Vercel serverless config
export const config = {
  maxDuration: 300, // 5 minutes - reduced timeouts leave buffer for processing
};

// Timeout wrapper for LLM calls - prevents hanging
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}

const LLM_TIMEOUT = 60000; // 60s (1 min) - REDUCED from 180s on 2026-01-08
const PERPLEXITY_TIMEOUT = 45000; // 45s for Perplexity
const TAVILY_TIMEOUT = 30000; // 30s for Tavily web searches

// ============================================
// COMPLETE TYPE MAP - ALL 181 FIELDS from fields-schema.ts
// Maps EVERY field key to its expected type for validation and coercion
// 362 total entries (181 numbered + 181 unnumbered key variants)
// ============================================
type FieldType = 'text' | 'number' | 'boolean' | 'currency' | 'percentage' | 'date' | 'select' | 'multiselect';
const FIELD_TYPE_MAP: Record<string, FieldType> = {
  // GROUP 1: Address & Identity (Fields 1-9)
  '1_full_address': 'text', 'full_address': 'text',
  '2_mls_primary': 'text', 'mls_primary': 'text',
  '3_new_construction_yn': 'boolean', 'new_construction_yn': 'boolean',
  '4_listing_status': 'select', 'listing_status': 'select',
  '5_listing_date': 'date', 'listing_date': 'date',
  '6_neighborhood': 'text', 'neighborhood': 'text',
  '7_county': 'text', 'county': 'text',
  '8_zip_code': 'text', 'zip_code': 'text',
  '9_parcel_id': 'text', 'parcel_id': 'text',

  // GROUP 2: Pricing & Value (Fields 10-16)
  '10_listing_price': 'currency', 'listing_price': 'currency',
  '11_price_per_sqft': 'currency', 'price_per_sqft': 'currency',
  '12_market_value_estimate': 'currency', 'market_value_estimate': 'currency',
  '13_last_sale_date': 'date', 'last_sale_date': 'date',
  '14_last_sale_price': 'currency', 'last_sale_price': 'currency',
  '15_assessed_value': 'currency', 'assessed_value': 'currency',
  '16_avms': 'currency', 'avms': 'currency',
  // AVM Subfields (16a-16f) - Individual AVM sources
  '16a_zestimate': 'currency', 'zestimate': 'currency',
  '16b_redfin_estimate': 'currency', 'redfin_estimate': 'currency',
  '16c_first_american_avm': 'currency', 'first_american_avm': 'currency',
  '16d_quantarium_avm': 'currency', 'quantarium_avm': 'currency',
  '16e_ice_avm': 'currency', 'ice_avm': 'currency',
  '16f_collateral_analytics_avm': 'currency', 'collateral_analytics_avm': 'currency',

  // GROUP 3: Property Basics (Fields 17-29)
  '17_bedrooms': 'number', 'bedrooms': 'number',
  '18_full_bathrooms': 'number', 'full_bathrooms': 'number',
  '19_half_bathrooms': 'number', 'half_bathrooms': 'number',
  '20_total_bathrooms': 'number', 'total_bathrooms': 'number',
  '21_living_sqft': 'number', 'living_sqft': 'number',
  '22_total_sqft_under_roof': 'number', 'total_sqft_under_roof': 'number',
  '23_lot_size_sqft': 'number', 'lot_size_sqft': 'number',
  '24_lot_size_acres': 'number', 'lot_size_acres': 'number',
  '25_year_built': 'number', 'year_built': 'number',
  '26_property_type': 'select', 'property_type': 'select',
  '27_stories': 'number', 'stories': 'number',
  '28_garage_spaces': 'number', 'garage_spaces': 'number',
  '29_parking_total': 'text', 'parking_total': 'text',

  // GROUP 4: HOA & Taxes (Fields 30-38)
  '30_hoa_yn': 'boolean', 'hoa_yn': 'boolean',
  '31_association_fee': 'currency', 'association_fee': 'currency', 'hoa_fee_annual': 'currency', // FIXED 2026-01-12: Canonical name
  '32_hoa_name': 'text', 'hoa_name': 'text',
  '33_hoa_includes': 'text', 'hoa_includes': 'text',
  '34_ownership_type': 'select', 'ownership_type': 'select',
  '35_annual_taxes': 'currency', 'annual_taxes': 'currency',
  '36_tax_year': 'number', 'tax_year': 'number',
  '37_property_tax_rate': 'percentage', 'property_tax_rate': 'percentage', 'property_tax_rate_percent': 'percentage',
  '38_tax_exemptions': 'text', 'tax_exemptions': 'text',

  // GROUP 5: Structure & Systems (Fields 39-48)
  '39_roof_type': 'select', 'roof_type': 'select',
  '40_roof_age_est': 'text', 'roof_age_est': 'text',
  '41_exterior_material': 'select', 'exterior_material': 'select',
  '42_foundation': 'select', 'foundation': 'select',
  '43_water_heater_type': 'text', 'water_heater_type': 'text',
  '44_garage_type': 'text', 'garage_type': 'text',
  '45_hvac_type': 'text', 'hvac_type': 'text',
  '46_hvac_age': 'text', 'hvac_age': 'text',
  '47_laundry_type': 'text', 'laundry_type': 'text',
  '48_interior_condition': 'select', 'interior_condition': 'select',

  // GROUP 6: Interior Features (Fields 49-53)
  '49_flooring_type': 'text', 'flooring_type': 'text',
  '50_kitchen_features': 'text', 'kitchen_features': 'text',
  '51_appliances_included': 'multiselect', 'appliances_included': 'multiselect',
  '52_fireplace_yn': 'boolean', 'fireplace_yn': 'boolean',
  // FIXED 2026-01-08: Field 53 is Primary BR Location (select), NOT fireplace count (number)
  '53_primary_br_location': 'select', 'primary_br_location': 'select',

  // GROUP 7: Exterior Features (Fields 54-58)
  '54_pool_yn': 'boolean', 'pool_yn': 'boolean',
  '55_pool_type': 'select', 'pool_type': 'select',
  '56_deck_patio': 'text', 'deck_patio': 'text',
  '57_fence': 'text', 'fence': 'text',
  '58_landscaping': 'text', 'landscaping': 'text',

  // GROUP 8: Permits & Renovations (Fields 59-62)
  '59_recent_renovations': 'text', 'recent_renovations': 'text',
  '60_permit_history_roof': 'text', 'permit_history_roof': 'text',
  '61_permit_history_hvac': 'text', 'permit_history_hvac': 'text',
  '62_permit_history_other': 'text', 'permit_history_other': 'text',

  // GROUP 9: Assigned Schools (Fields 63-73)
  '63_school_district': 'text', 'school_district': 'text',
  '64_elevation_feet': 'number', 'elevation_feet': 'number',
  '65_elementary_school': 'text', 'elementary_school': 'text',
  '66_elementary_rating': 'text', 'elementary_rating': 'text',
  '67_elementary_distance_mi': 'number', 'elementary_distance_mi': 'number',
  '68_middle_school': 'text', 'middle_school': 'text',
  '69_middle_rating': 'text', 'middle_rating': 'text',
  '70_middle_distance_mi': 'number', 'middle_distance_mi': 'number',
  '71_high_school': 'text', 'high_school': 'text',
  '72_high_rating': 'text', 'high_rating': 'text',
  '73_high_distance_mi': 'number', 'high_distance_mi': 'number',

  // GROUP 10: Location Scores (Fields 74-82)
  '74_walk_score': 'number', 'walk_score': 'number',
  '75_transit_score': 'number', 'transit_score': 'number',
  '76_bike_score': 'number', 'bike_score': 'number',
  '77_safety_score': 'number', 'safety_score': 'number',
  '78_noise_level': 'text', 'noise_level': 'text',
  '79_traffic_level': 'text', 'traffic_level': 'text',
  '80_walkability_description': 'text', 'walkability_description': 'text',
  '81_public_transit_access': 'text', 'public_transit_access': 'text',
  '82_commute_to_city_center': 'text', 'commute_to_city_center': 'text',

  // GROUP 11: Distances & Amenities (Fields 83-87)
  '83_distance_grocery_mi': 'number', 'distance_grocery_mi': 'number',
  '84_distance_hospital_mi': 'number', 'distance_hospital_mi': 'number',
  '85_distance_airport_mi': 'number', 'distance_airport_mi': 'number',
  '86_distance_park_mi': 'number', 'distance_park_mi': 'number',
  '87_distance_beach_mi': 'number', 'distance_beach_mi': 'number',

  // GROUP 12: Safety & Crime (Fields 88-90)
  '88_violent_crime_index': 'text', 'violent_crime_index': 'text',
  '89_property_crime_index': 'text', 'property_crime_index': 'text',
  '90_neighborhood_safety_rating': 'text', 'neighborhood_safety_rating': 'text',

  // GROUP 13: Market & Investment Data (Fields 91-103)
  '91_median_home_price_neighborhood': 'currency', 'median_home_price_neighborhood': 'currency',
  '92_price_per_sqft_recent_avg': 'currency', 'price_per_sqft_recent_avg': 'currency',
  '93_price_to_rent_ratio': 'number', 'price_to_rent_ratio': 'number',
  '94_price_vs_median_percent': 'percentage', 'price_vs_median_percent': 'percentage',
  '95_days_on_market_avg': 'number', 'days_on_market_avg': 'number', 'avg_days_on_market': 'number',
  '96_inventory_surplus': 'text', 'inventory_surplus': 'text',
  '97_insurance_est_annual': 'currency', 'insurance_est_annual': 'currency', 'insurance_estimate_annual': 'currency',
  '98_rental_estimate_monthly': 'currency', 'rental_estimate_monthly': 'currency',
  '99_rental_yield_est': 'percentage', 'rental_yield_est': 'percentage',
  '100_vacancy_rate_neighborhood': 'percentage', 'vacancy_rate_neighborhood': 'percentage',
  '101_cap_rate_est': 'percentage', 'cap_rate_est': 'percentage',
  '102_financing_terms': 'text', 'financing_terms': 'text',
  '103_comparable_sales': 'text', 'comparable_sales': 'text',

  // GROUP 14: Utilities & Connectivity (Fields 104-116)
  '104_electric_provider': 'text', 'electric_provider': 'text',
  '105_avg_electric_bill': 'text', 'avg_electric_bill': 'text',
  '106_water_provider': 'text', 'water_provider': 'text',
  '107_avg_water_bill': 'text', 'avg_water_bill': 'text',
  '108_sewer_provider': 'text', 'sewer_provider': 'text',
  '109_natural_gas': 'text', 'natural_gas': 'text',
  '110_trash_provider': 'text', 'trash_provider': 'text',
  '111_internet_providers_top3': 'text', 'internet_providers_top3': 'text',
  '112_max_internet_speed': 'text', 'max_internet_speed': 'text',
  '113_fiber_available': 'text', 'fiber_available': 'text',
  '114_cable_tv_provider': 'text', 'cable_tv_provider': 'text',
  '115_cell_coverage_quality': 'text', 'cell_coverage_quality': 'text',
  '116_emergency_services_distance': 'text', 'emergency_services_distance': 'text',

  // GROUP 15: Environment & Risk (Fields 117-130)
  '117_air_quality_index': 'text', 'air_quality_index': 'text',
  '118_air_quality_grade': 'text', 'air_quality_grade': 'text',
  '119_flood_zone': 'text', 'flood_zone': 'text',
  '120_flood_risk_level': 'text', 'flood_risk_level': 'text',
  '121_climate_risk': 'text', 'climate_risk': 'text',
  '122_wildfire_risk': 'text', 'wildfire_risk': 'text',
  '123_earthquake_risk': 'text', 'earthquake_risk': 'text',
  '124_hurricane_risk': 'text', 'hurricane_risk': 'text',
  '125_tornado_risk': 'text', 'tornado_risk': 'text',
  '126_radon_risk': 'text', 'radon_risk': 'text',
  '127_superfund_site_nearby': 'text', 'superfund_site_nearby': 'text',
  '128_sea_level_rise_risk': 'text', 'sea_level_rise_risk': 'text',
  '129_noise_level_db_est': 'text', 'noise_level_db_est': 'text',
  '130_solar_potential': 'text', 'solar_potential': 'text',

  // GROUP 16: Additional Features (Fields 131-138)
  '131_view_type': 'text', 'view_type': 'text',
  '132_lot_features': 'text', 'lot_features': 'text',
  '133_ev_charging': 'text', 'ev_charging': 'text',
  '134_smart_home_features': 'text', 'smart_home_features': 'text',
  '135_accessibility_modifications': 'text', 'accessibility_modifications': 'text',
  '136_pet_policy': 'text', 'pet_policy': 'text',
  '137_age_restrictions': 'text', 'age_restrictions': 'text',
  '138_special_assessments': 'text', 'special_assessments': 'text',

  // GROUP 17: Stellar MLS - Parking & Garage (Fields 139-143)
  '139_carport_yn': 'boolean', 'carport_yn': 'boolean',
  '140_carport_spaces': 'number', 'carport_spaces': 'number',
  '141_garage_attached_yn': 'boolean', 'garage_attached_yn': 'boolean',
  '142_parking_features': 'multiselect', 'parking_features': 'multiselect',
  '143_assigned_parking_spaces': 'number', 'assigned_parking_spaces': 'number',

  // GROUP 18: Stellar MLS - Building Info (Fields 144-148)
  '144_floor_number': 'number', 'floor_number': 'number',
  '145_building_total_floors': 'number', 'building_total_floors': 'number',
  '146_building_name_number': 'text', 'building_name_number': 'text',
  '147_building_elevator_yn': 'boolean', 'building_elevator_yn': 'boolean',
  '148_floors_in_unit': 'number', 'floors_in_unit': 'number',

  // GROUP 19: Stellar MLS - Legal & Tax (Fields 149-154)
  '149_subdivision_name': 'text', 'subdivision_name': 'text',
  '150_legal_description': 'text', 'legal_description': 'text',
  '151_homestead_yn': 'boolean', 'homestead_yn': 'boolean',
  '152_cdd_yn': 'boolean', 'cdd_yn': 'boolean',
  '153_annual_cdd_fee': 'currency', 'annual_cdd_fee': 'currency',
  '154_front_exposure': 'select', 'front_exposure': 'select',

  // GROUP 20: Stellar MLS - Waterfront (Fields 155-159)
  '155_water_frontage_yn': 'boolean', 'water_frontage_yn': 'boolean',
  '156_waterfront_feet': 'number', 'waterfront_feet': 'number',
  '157_water_access_yn': 'boolean', 'water_access_yn': 'boolean',
  '158_water_view_yn': 'boolean', 'water_view_yn': 'boolean',
  '159_water_body_name': 'text', 'water_body_name': 'text',

  // GROUP 21: Stellar MLS - Leasing & Pets (Fields 160-165)
  '160_can_be_leased_yn': 'boolean', 'can_be_leased_yn': 'boolean',
  '161_minimum_lease_period': 'text', 'minimum_lease_period': 'text',
  '162_lease_restrictions_yn': 'boolean', 'lease_restrictions_yn': 'boolean',
  '163_pet_size_limit': 'text', 'pet_size_limit': 'text',
  '164_max_pet_weight': 'number', 'max_pet_weight': 'number',
  '165_association_approval_yn': 'boolean', 'association_approval_yn': 'boolean',

  // GROUP 22: Stellar MLS - Features & Flood (Fields 166-168)
  '166_community_features': 'multiselect', 'community_features': 'multiselect',
  '167_interior_features': 'multiselect', 'interior_features': 'multiselect',
  '168_exterior_features': 'multiselect', 'exterior_features': 'multiselect',

  // GROUP 23: Market Performance (Fields 169-181) - Updated 2026-01-11
  '169_months_of_inventory': 'number', 'months_of_inventory': 'number',
  '170_new_listings_30d': 'number', 'new_listings_30d': 'number',
  '171_homes_sold_30d': 'number', 'homes_sold_30d': 'number',
  '172_median_dom_zip': 'number', 'median_dom_zip': 'number',
  '173_price_reduced_percent': 'percentage', 'price_reduced_percent': 'percentage',
  '174_homes_under_contract': 'number', 'homes_under_contract': 'number',
  '175_market_type': 'select', 'market_type': 'select',
  '176_avg_sale_to_list_percent': 'percentage', 'avg_sale_to_list_percent': 'percentage',
  '177_avg_days_to_pending': 'number', 'avg_days_to_pending': 'number',
  '178_multiple_offers_likelihood': 'select', 'multiple_offers_likelihood': 'select',
  '179_appreciation_percent': 'percentage', 'appreciation_percent': 'percentage',
  '180_price_trend': 'select', 'price_trend': 'select',
  '181_rent_zestimate': 'currency', 'rent_zestimate': 'currency',
};

// ============================================
// TYPE COERCION FUNCTION - Validates and coerces LLM values
// Ensures values match expected types from the 181-field schema
// ============================================

/**
 * CRITICAL: Detect if a value is actually a field key that was hallucinated
 * LLMs sometimes return our field keys as values (e.g., "98_rental_estimate" instead of a number)
 * Pattern: digits followed by underscore followed by snake_case text
 */
function isHallucinatedFieldKey(value: any): boolean {
  if (typeof value !== 'string') return false;
  // Match patterns like "12_market_value_estimate", "98_rental_estimate", "33_hoa_includes"
  const fieldKeyPattern = /^\d{1,3}_[a-z][a-z0-9_]+$/i;
  if (fieldKeyPattern.test(value)) {
    console.warn(`[RETRY-LLM] 🚫 HALLUCINATION DETECTED: "${value}" looks like a field key, not a value`);
    return true;
  }
  return false;
}

// ============================================
// FILTER NULL VALUES - UNIFIED FIELD VALIDATION
// Copied from search.ts to ensure UNIFORM rules across codebase
// ============================================
function filterNullValues(parsed: any, llmName: string): Record<string, any> {
  const fields: Record<string, any> = {};
  let nullsBlocked = 0;
  let fieldsAccepted = 0;
  let typesCoerced = 0;

  // Handle case where parsed has a 'fields' property
  const dataToProcess = parsed.fields || parsed;

  for (const [key, val] of Object.entries(dataToProcess)) {
    // Skip metadata fields (echoed input or response metadata)
    if (['llm', 'error', 'sources_searched', 'fields_found', 'fields_missing', 'note', 'status', 'message', 'success', 'citations', 'city', 'state', 'address', 'zip', 'county', 'search_metadata', 'queries', 'sources_cited', 'queries_performed'].includes(key)) {
      continue;
    }

    // BLOCK 1: Skip if val is directly null/undefined
    if (val === null || val === undefined) {
      nullsBlocked++;
      continue;
    }

    // Extract the actual value (handle both {value: x} objects and direct values)
    let rawValue: any;
    let source: string = llmName;
    let confidence: string = 'Medium';

    if (typeof val === 'object' && val !== null) {
      rawValue = (val as any).value;
      source = (val as any).source || llmName;
      confidence = (val as any).confidence || 'Medium';
    } else {
      rawValue = val;
    }

    // BLOCK 2: Skip null-like values
    if (rawValue === null || rawValue === undefined || rawValue === '' ||
        rawValue === 'null' || rawValue === 'N/A' || rawValue === 'Not found' ||
        rawValue === 'Unknown' || rawValue === 'not available' ||
        (typeof rawValue === 'string' && rawValue.toLowerCase() === 'none')) {
      nullsBlocked++;
      continue;
    }

    // TYPE COERCION: Validate and coerce value to expected type
    const originalValue = rawValue;
    let coercedValue = coerceValue(key, rawValue);

    // If coercion returned null, the value was invalid for expected type
    if (coercedValue === null) {
      nullsBlocked++;
      continue;
    }

    // UTILITY BILL NORMALIZATION: Convert bi-monthly to monthly
    const utilityNormalized = normalizeUtilityBillToMonthly(key, coercedValue);
    if (utilityNormalized) {
      coercedValue = utilityNormalized.value;
    }

    // Track if type was coerced
    if (coercedValue !== originalValue) {
      typesCoerced++;
    }

    // BLOCK 3: Skip NaN numbers
    if (typeof coercedValue === 'number' && isNaN(coercedValue)) {
      nullsBlocked++;
      continue;
    }

    // ACCEPT: Valid, type-coerced value
    fields[key] = {
      value: coercedValue,
      source: source,
      confidence: confidence
    };
    fieldsAccepted++;
  }

  console.log(`🛡️ ${llmName}: ${fieldsAccepted} fields ACCEPTED, ${nullsBlocked} nulls BLOCKED, ${typesCoerced} types COERCED`);
  return fields;
}

function coerceValue(key: string, value: any): any {
  // CRITICAL: Reject hallucinated field keys as values
  if (isHallucinatedFieldKey(value)) {
    console.warn(`[RETRY-LLM] 🚫 REJECTED: Field "${key}" had hallucinated value "${value}"`);
    return null;
  }

  const expectedType = FIELD_TYPE_MAP[key];

  // If no type mapping (unknown field), return as-is
  if (!expectedType) {
    console.log(`[RETRY-LLM] ⚠️ UNKNOWN FIELD: ${key} not in 181-field schema`);
    return value;
  }

  // TEXT, SELECT, MULTISELECT types - pass through as strings
  if (expectedType === 'text' || expectedType === 'select' || expectedType === 'multiselect') {
    if (typeof value === 'string') return value.trim();
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  }

  // NUMBER, CURRENCY, PERCENTAGE types - must be numeric
  if (expectedType === 'number' || expectedType === 'currency' || expectedType === 'percentage') {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[$,€£%\s]/g, '').trim();

      // Handle ranges like "1.7-2.0" or "100-150" - take the midpoint
      const rangeMatch = cleaned.match(/^(\d+\.?\d*)\s*[-–—to]+\s*(\d+\.?\d*)$/i);
      if (rangeMatch) {
        const low = parseFloat(rangeMatch[1]);
        const high = parseFloat(rangeMatch[2]);
        if (!isNaN(low) && !isNaN(high)) {
          const midpoint = (low + high) / 2;
          console.log(`[RETRY-LLM] 🔄 TYPE COERCED RANGE: ${key} "${value}" → ${midpoint}`);
          return midpoint;
        }
      }

      // Handle "approximately X" or "~X" or "about X"
      const approxMatch = cleaned.match(/^(?:approximately|approx|about|~|≈)\s*(\d+\.?\d*)$/i);
      if (approxMatch) {
        const num = parseFloat(approxMatch[1]);
        if (!isNaN(num)) {
          console.log(`[RETRY-LLM] 🔄 TYPE COERCED APPROX: ${key} "${value}" → ${num}`);
          return num;
        }
      }

      const num = parseFloat(cleaned);
      if (!isNaN(num)) {
        console.log(`[RETRY-LLM] 🔄 TYPE COERCED: ${key} "${value}" → ${num}`);
        return num;
      }
    }
    return null;
  }

  // BOOLEAN type
  if (expectedType === 'boolean') {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      if (['true', 'yes', 'y', '1', 'on'].includes(lower)) return true;
      if (['false', 'no', 'n', '0', 'off', 'none'].includes(lower)) return false;
    }
    if (typeof value === 'number') return value !== 0;
    return null;
  }

  // DATE type - keep as string but validate
  if (expectedType === 'date') {
    if (typeof value === 'string' && value.trim()) return value.trim();
    return null;
  }

  return value;
}

/**
 * UTILITY BILL NORMALIZATION
 * Many FL utilities bill bi-monthly - detect and convert to monthly
 * Typical FL monthly ranges: Water $40-80, Electric $100-200
 */
function normalizeUtilityBillToMonthly(fieldKey: string, value: any): { value: number; wasNormalized: boolean } | null {
  // Parse string values like "$919" or "919" to numbers
  let numericValue: number;
  if (typeof value === 'number') {
    numericValue = value;
  } else if (typeof value === 'string') {
    // Remove $ signs, commas, and whitespace
    const cleaned = value.replace(/[$,\s]/g, '').trim();
    numericValue = parseFloat(cleaned);
  } else {
    return null;
  }

  if (isNaN(numericValue) || numericValue <= 0) {
    return null;
  }

  // Field 107: Water bill - FL utilities bill BI-MONTHLY (every 2 months)
  // Typical bi-monthly is $80-200, so monthly should be $40-100
  // If value > 120, assume it's bi-monthly and divide by 2
  if (fieldKey === '107_avg_water_bill' || fieldKey === 'avg_water_bill') {
    if (numericValue > 120) {
      const monthly = Math.round(numericValue / 2);
      console.log(`[RETRY-LLM] 🔄 WATER BILL: $${numericValue} bi-monthly → $${monthly}/month`);
      return { value: monthly, wasNormalized: true };
    }
    return { value: numericValue, wasNormalized: false };
  }

  // NOTE: Electric bill normalization removed per user request - only water bills are normalized

  return null;
}

/**
 * Wrapper for shared mapFlatFieldsToNumbered that also handles HOA fee conversion
 */
function mapFlatFieldsToNumbered(fields: Record<string, any>): Record<string, any> {
  // First, handle HOA monthly→annual conversion before mapping
  const convertedFields: Record<string, any> = {};
  
  for (const [key, fieldData] of Object.entries(fields)) {
    if (isMonthlyHoaFeeKey(key)) {
      // Convert monthly HOA to annual
      const rawValue = fieldData?.value !== undefined ? fieldData.value : fieldData;
      const annualValue = convertMonthlyHoaToAnnual(rawValue);
      if (annualValue !== null) {
        convertedFields['hoa_fee_annual'] = {
          value: annualValue,
          source: fieldData?.source || 'LLM',
          confidence: fieldData?.confidence || 'Medium',
        };
        console.log(`[RETRY-LLM] Converted monthly HOA fee $${rawValue} to annual $${annualValue}`);
      }
    } else {
      convertedFields[key] = fieldData;
    }
  }
  
  // Now use the shared mapping function
  return sharedMapFlatFieldsToNumbered(convertedFields, 'RETRY-LLM');
}

// Helper to extract and parse JSON from markdown code blocks or raw text
// Returns parsed object directly (not a string) to avoid double-parsing
function extractAndParseJSON(text: string): { success: boolean; data: Record<string, any> | null; error?: string } {
  const result = extractAndParseJson<Record<string, any>>(text, 'RETRY-LLM');
  return {
    success: result.success,
    data: result.data,
    error: result.error
  };
}

// ============================================
// PERPLEXITY FIELD COMPLETER PROMPT (Sonar Deep Research Mode)
// NOTE: Perplexity has BUILT-IN web search - NO tools/tool_choice needed
// Search behavior is controlled via the prompt itself
// ============================================
const PERPLEXITY_FIELD_COMPLETER_SYSTEM = `You are the CLUES Field Completer (Perplexity Sonar Deep Research Mode).
Your MISSION is to populate 47 specific real estate data fields for a single property address.

🔴 FIRING ORDER: You fire AFTER Tier 3 data sources have already run:
- Tavily Web Search: Targeted searches for AVMs, market data, permits, portal views
- Free APIs: SchoolDigger, FBI Crime, WalkScore, FEMA, AirNow, Census, Weather
You ONLY search for fields that Tier 3 did NOT find. Focus on fields that require deep web research.

### HARD RULES (EVIDENCE FIREWALL)
1. MANDATORY WEB SEARCH: You MUST perform thorough web research for EVERY request. Execute at least 4 distinct searches covering:
   - "site:zillow.com [Address]" (for 16a_zestimate and 181_rent_zestimate)
   - "site:redfin.com [Address]" (for 16b_redfin_estimate)
   - "[Address] utility providers and average bills"
   - "[City/ZIP] median home price and market trends 2026"
2. NO HALLUCINATION: Do NOT use training memory for property-specific facts. Use only verified search results from 2025-2026.
3. SPECIFIC AVM SEARCH STRATEGY (search for EACH AVM individually):
   - 16a_zestimate: Search "site:zillow.com [ADDRESS]" to find Zillow's Zestimate
   - 16b_redfin_estimate: Search "site:redfin.com [ADDRESS]" to find Redfin Estimate
   - 16c_first_american_avm: Search for First American AVM if available
   - 16d_quantarium_avm: Search for Quantarium AVM if available
   - 16e_ice_avm: Search for ICE/Intercontinental Exchange AVM if available
   - 16f_collateral_analytics_avm: Search for Collateral Analytics AVM if available
   - 181_rent_zestimate: Search "site:zillow.com [ADDRESS] rent" for Zillow Rent Zestimate
   - DO NOT return 12_market_value_estimate - backend calculates from individual AVMs
   - If a specific AVM is behind a paywall, return null for that field.
4. JSON ONLY: Return ONLY the raw JSON object. No conversational text.

### OUTPUT SCHEMA (DO NOT include 12_market_value_estimate - backend calculates)
{
  "address": "{{address}}",
  "data_fields": {
    "16a_zestimate": <number|null>,
    "16b_redfin_estimate": <number|null>,
    "16c_first_american_avm": <number|null>,
    "16d_quantarium_avm": <number|null>,
    "16e_ice_avm": <number|null>,
    "16f_collateral_analytics_avm": <number|null>,
    "81_public_transit_access": <string|null>,
    "82_commute_to_city_center": <string|null>,
    "91_median_home_price_neighborhood": <number|null>,
    "92_price_per_sqft_recent_avg": <number|null>,
    "95_days_on_market_avg": <number|null>,
    "96_inventory_surplus": <string|null>,
    "97_insurance_est_annual": <number|null>,
    "98_rental_estimate_monthly": <number|null>,
    "103_comparable_sales": <array|null>,
    "104_electric_provider": <string|null>,
    "105_avg_electric_bill": <number|null>,
    "106_water_provider": <string|null>,
    "107_avg_water_bill": <number|null>,
    "110_trash_provider": <string|null>,
    "111_internet_providers_top3": <array|null>,
    "114_cable_tv_provider": <string|null>,
    "169_months_of_inventory": <number|null>,
    "170_new_listings_30d": <number|null>,
    "171_homes_sold_30d": <number|null>,
    "172_median_dom_zip": <number|null>,
    "173_price_reduced_percent": <number|null>,
    "174_homes_under_contract": <number|null>,
    "175_market_type": <string|null>,
    "176_avg_sale_to_list_percent": <number|null>,
    "177_avg_days_to_pending": <number|null>,
    "178_multiple_offers_likelihood": <string|null>,
    "179_appreciation_percent": <number|null>,
    "180_price_trend": <string|null>,
    "181_rent_zestimate": <number|null>
  },
  "search_metadata": {
    "queries": [],
    "sources_cited": []
  }
}`;

const PERPLEXITY_FIELD_COMPLETER_USER = (address: string, city?: string, zip?: string) => `PROPERTY ADDRESS: ${address}

LOCATION CONTEXT: ${city || 'Unknown'}, ${zip || 'Unknown'}

EXECUTE THESE WEB SEARCHES:
1. "${address} Zillow listing and Zestimate"
2. "${address} Redfin Estimate and market data"
3. "${address} utility providers and average bills"
4. "${city || 'Tampa'} ${zip || ''} median home price and market trends 2026"

Return JSON matching the schema in your instructions.`;

async function callPerplexity(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  console.log('[PERPLEXITY] API key present:', !!apiKey, 'length:', apiKey?.length || 0);
  if (!apiKey) {
    // Log all env var keys to debug
    const envKeys = Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY'));
    console.log('[PERPLEXITY] Available env vars with API/KEY:', envKeys);
    return { error: 'API key not set', fields: {} };
  }

  // Extract city/zip from address for context
  const addressParts = address.split(',').map(s => s.trim());
  const city = addressParts.length > 1 ? addressParts[1] : undefined;
  const zipMatch = address.match(/\b(\d{5})\b/);
  const zip = zipMatch ? zipMatch[1] : undefined;

  try {
    // NOTE: Perplexity has BUILT-IN web search - NO tools/tool_choice needed
    // Search behavior is controlled via the prompt itself
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'sonar-reasoning-pro',
        messages: [
          { role: 'system', content: PERPLEXITY_FIELD_COMPLETER_SYSTEM },
          { role: 'user', content: PERPLEXITY_FIELD_COMPLETER_USER(address, city, zip) }
        ],
        temperature: 0.2,
        max_tokens: 32000,
      }),
    });

    const data = await response.json();
    console.log('[PERPLEXITY] Status:', response.status);

    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      console.log('[PERPLEXITY] Response length:', text.length, 'chars');

      // Use unified JSON extraction
      const parseResult = extractAndParseJSON(text);
      console.log('[PERPLEXITY] Parse result:', parseResult.success ? `${Object.keys(parseResult.data || {}).length} keys` : parseResult.error);

      if (parseResult.success && parseResult.data) {
        const parsed = parseResult.data;
        const fields: Record<string, any> = {};
        const flattenObject = (obj: any, prefix = '') => {
          for (const [key, value] of Object.entries(obj)) {
            if (value !== null && value !== undefined && value !== '' && value !== 'N/A') {
              if (typeof value === 'object' && !Array.isArray(value)) {
                flattenObject(value, prefix + key + '_');
              } else {
                // TYPE COERCION: Validate and coerce value to expected type
                let coerced = coerceValue(prefix + key, value);
                if (coerced !== null) {
                  // UTILITY BILL NORMALIZATION: Convert bi-monthly to monthly
                  const utilityNormalized = normalizeUtilityBillToMonthly(prefix + key, coerced);
                  if (utilityNormalized) coerced = utilityNormalized.value;
                  fields[prefix + key] = { value: coerced, source: 'Perplexity', confidence: 'Medium' };
                }
              }
            }
          }
        };
        flattenObject(parsed);
        console.log('[PERPLEXITY] Fields found:', Object.keys(fields).length);
        return { fields };
      } else {
        console.log('[PERPLEXITY] JSON extraction failed:', parseResult.error);
        return { error: `JSON extraction failed: ${parseResult.error}`, fields: {} };
      }
    } else if (data.error) {
      console.log('[PERPLEXITY] API Error:', JSON.stringify(data.error));
      return { error: `API Error: ${data.error?.message || JSON.stringify(data.error)}`, fields: {} };
    }
    return { error: 'No content in response', fields: {} };
  } catch (error) {
    console.log('[PERPLEXITY] Exception:', String(error));
    return { error: String(error), fields: {} };
  }
}

// ============================================
// GROK FIELD COMPLETER PROMPT (Grok 4 - Final Stage)
// ============================================
const GROK_RETRY_SYSTEM_PROMPT = `🚨 OUTPUT JSON ONLY 🚨
Your entire response MUST be a single, valid JSON object.
No explanations, no markdown, no introductory text, no closing remarks, no mentions of searching, tools, models, or process.
NEVER say "I searched", "using tools", "I'll search", or anything similar.
If you cannot find data for a field, set it to null.

You are the CLUES Field Completer (Final Stage - Grok 4).
Your MISSION is to populate the 47 specific real estate data fields for the single property address provided.
🟠 FIRING ORDER: You are the 5th and final LLM in the chain (after Perplexity → Gemini → GPT-4o → Claude Sonnet).
PRIOR DATA SOURCES (already executed BEFORE you):
- Tier 3: Tavily Web Search, SchoolDigger, FBI Crime, WalkScore, FEMA, AirNow, Census, Weather
- Tier 4 LLMs: Perplexity, Gemini, GPT-4o, Claude Sonnet

You ONLY fill fields that prior sources left as null or incomplete. Use your built-in web search and browse tools for real-time 2025-2026 data.

### HARD RULES (EVIDENCE FIREWALL)
1. Use web_search and browse_page tools to gather verifiable real-time data. Perform at least 4 distinct searches/browses.
2. NO HALLUCINATION: Do NOT use training data or memory for property-specific facts. Rely exclusively on tool results.
   - 134_smart_home_features: ONLY return if explicitly mentioned in listing (e.g., "Nest thermostat", "Ring doorbell"). Return null if not found. NEVER guess "Smart thermostat" or "security system".
   - 133_ev_charging: ONLY return if explicitly mentioned in listing. Return null if not found.
   - 135_accessibility_modifications: ONLY return if explicitly mentioned in listing. Return null if not found.
   - MARKET DATA (169-181): ONLY return if found from Redfin, Realtor.com, or Zillow market data pages. Return null if not verifiable.
     * 170_new_listings_30d: Max 500 for a single ZIP. If you see >1000, return null (bad data).
     * 171_homes_sold_30d: Max 300 for a single ZIP. If you see >500, return null (bad data).
     * 172_median_dom_zip: Should be 5-120 days. If outside this range, return null.
     * 174_homes_under_contract: Max 200 for a single ZIP. If higher, return null.
3. SPECIFIC AVM SEARCH STRATEGY (use targeted searches/browses):
   - 16a_zestimate: Search/browse "site:zillow.com [ADDRESS]" → extract current Zestimate
   - 16b_redfin_estimate: Search/browse "site:redfin.com [ADDRESS]" → extract current Redfin Estimate
   - 16c–16f (First American, Quantarium, ICE, Collateral Analytics): Search specifically for each AVM if publicly available
   - 181_rent_zestimate: Browse Zillow page and look for Rent Zestimate
   - DO NOT return 12_market_value_estimate - backend calculates from individual AVMs
   - If behind paywall or not found → null
4. MANDATORY TOOL USES (minimum):
   - web_search or browse_page for "site:zillow.com [ADDRESS]"
   - web_search or browse_page for "site:redfin.com [ADDRESS]"
   - web_search for "[ADDRESS] utility providers and average monthly bills"
   - web_search for "[City, State ZIP] median home price 2026" OR "[City, State] housing market trends 2026"

### 47 HIGH-VELOCITY FIELDS TO POPULATE
AVMs: 12, 16a-16f, 181
Market: 91, 92, 95, 96, 175-178, 180
Rental: 98
Insurance: 97
Utilities: 104-107, 109, 110, 111, 114
Location: 81, 82
Comparables: 103
Market Performance: 169-181
Structure: 40, 46
Permits: 59-62
Features: 133-135, 138

### OUTPUT SCHEMA (EXACTLY THIS STRUCTURE - DO NOT include 12_market_value_estimate)
{
  "address": "{{address}}",
  "data_fields": {
    "16a_zestimate": <number|null>,
    "16b_redfin_estimate": <number|null>,
    "16c_first_american_avm": <number|null>,
    "16d_quantarium_avm": <number|null>,
    "16e_ice_avm": <number|null>,
    "16f_collateral_analytics_avm": <number|null>,
    "40_roof_age_est": <string|null>,
    "46_hvac_age": <string|null>,
    "59_recent_renovations": <string|null>,
    "60_permit_history_roof": <string|null>,
    "61_permit_history_hvac": <string|null>,
    "62_permit_history_other": <string|null>,
    "81_public_transit_access": <string|null>,
    "82_commute_to_city_center": <string|null>,
    "91_median_home_price_neighborhood": <number|null>,
    "92_price_per_sqft_recent_avg": <number|null>,
    "95_days_on_market_avg": <number|null>,
    "96_inventory_surplus": <string|null>,
    "97_insurance_est_annual": <number|null>,
    "98_rental_estimate_monthly": <number|null>,
    "103_comparable_sales": <array|null>,
    "104_electric_provider": <string|null>,
    "105_avg_electric_bill": <number|null>,
    "106_water_provider": <string|null>,
    "107_avg_water_bill": <number|null>,
    "109_natural_gas": <string|null>,
    "110_trash_provider": <string|null>,
    "111_internet_providers_top3": <array|null>,
    "114_cable_tv_provider": <string|null>,
    "133_ev_charging": <string|null>,
    "134_smart_home_features": <string|null>,
    "135_accessibility_modifications": <string|null>,
    "138_special_assessments": <string|null>,
    "169_months_of_inventory": <number|null>,
    "170_new_listings_30d": <number|null>,
    "171_homes_sold_30d": <number|null>,
    "172_median_dom_zip": <number|null>,
    "173_price_reduced_percent": <number|null>,
    "174_homes_under_contract": <number|null>,
    "175_market_type": <string|null>,
    "176_avg_sale_to_list_percent": <number|null>,
    "177_avg_days_to_pending": <number|null>,
    "178_multiple_offers_likelihood": <string|null>,
    "179_appreciation_percent": <number|null>,
    "180_price_trend": <string|null>,
    "181_rent_zestimate": <number|null>
  },
  "search_metadata": {
    "queries_performed": ["query1", "query2", ...],
    "sources_cited": ["url1", "url2", ...]
  }
}

USER QUERY:
Extract and populate the 47 real estate data fields for: {{FULL_ADDRESS}}
Use web search and browse tools only for missing fields. Return ONLY the JSON.`;

const GROK_RETRY_USER_PROMPT = (address: string) => `Extract and populate the 47 real estate data fields for: ${address}

Use web search and browse tools only for missing fields. Return ONLY the JSON.`;

// Tavily search helper for Grok tool calls
async function callTavilySearch(query: string, numResults: number = 5): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.log('❌ [Tavily] TAVILY_API_KEY not set');
    return 'Search unavailable - API key not configured';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TAVILY_TIMEOUT);

  try {
    console.log(`🔍 [Tavily] Searching: "${query}"`);
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic',
        max_results: Math.min(numResults, 10),
        include_answer: true,
        include_raw_content: false
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`❌ [Tavily] HTTP ${response.status}`);
      return `Search failed with status ${response.status}`;
    }

    const data = await response.json();
    console.log(`✅ [Tavily] Got ${data.results?.length || 0} results`);

    let formatted = data.answer ? `Summary: ${data.answer}\n\n` : '';
    if (data.results && data.results.length > 0) {
      formatted += 'Sources:\n';
      data.results.forEach((r: any, i: number) => {
        formatted += `${i + 1}. ${r.title}: ${r.content?.substring(0, 300) || 'No content'}\n`;
      });
    }
    return formatted || 'No results found';
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as any).name === 'AbortError') {
      console.error('❌ [Tavily] Request timed out after 30s');
      return 'Search timed out after 30 seconds';
    }
    console.error('❌ [Tavily] Error:', error);
    return `Search error: ${String(error)}`;
  }
}

async function callGrok(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.XAI_API_KEY;
  console.log('[GROK] API key present:', !!apiKey, 'length:', apiKey?.length || 0);
  if (!apiKey) {
    return { error: 'API key not set', fields: {} };
  }

  const messages: any[] = [
    { role: 'system', content: GROK_RETRY_SYSTEM_PROMPT },
    { role: 'user', content: GROK_RETRY_USER_PROMPT(address) }
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT);

  try {
    // First call - Grok may request tool calls
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4', // Grok 4.0 for field completion
        max_tokens: 32000,
        temperature: 0,  // MUST BE 0 to prevent hallucinations
        messages: messages,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    let data = await response.json();
    console.log('[GROK] Status:', response.status);

    // Check if Grok wants to use tools
    const assistantMessage = data.choices?.[0]?.message;
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`🔧 [GROK] Requesting ${assistantMessage.tool_calls.length} tool calls`);

      // Add assistant message with tool calls to conversation
      messages.push(assistantMessage);

      // Execute each tool call via Tavily (limit to 3 to avoid timeout)
      const toolCalls = assistantMessage.tool_calls.slice(0, 3);
      for (const toolCall of toolCalls) {
        if (toolCall.function?.name === 'web_search') {
          // CRASH FIX: Wrap JSON.parse in try-catch for tool call arguments
          let args: any = {};
          try {
            args = JSON.parse(toolCall.function.arguments || '{}');
          } catch (parseError) {
            console.error('[GROK] Failed to parse tool call arguments:', parseError);
            continue; // Skip this tool call
          }
          const searchResult = await callTavilySearch(args.query, args.num_results || 5);

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: searchResult
          });
        }
      }

      // Second call - Grok processes tool results
      console.log('🔄 [GROK] Sending tool results back...');
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), LLM_TIMEOUT);

      const response2 = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'grok-4', // Grok 4.0 for field completion
          max_tokens: 32000,
          temperature: 0.1,
          messages: messages,
        }),
        signal: controller2.signal,
      });
      clearTimeout(timeoutId2);

      data = await response2.json();
      console.log('[GROK] Final response received');
    }

    // Parse the final response
    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      console.log('[GROK] Response length:', text.length, 'chars');

      const parseResult = extractAndParseJSON(text);
      console.log('[GROK] Parse result:', parseResult.success ? `${Object.keys(parseResult.data || {}).length} keys` : parseResult.error);

      if (parseResult.success && parseResult.data) {
        const parsed = parseResult.data;
        // Grok may return { data_fields: {...} } or { fields: {...} } or flat fields
        const fieldsToProcess = parsed.data_fields || parsed.fields || parsed;
        console.log(`[GROK] Parsed structure: ${parsed.data_fields ? 'data_fields' : parsed.fields ? 'fields' : 'flat'}, keys: ${Object.keys(fieldsToProcess).length}`);
        // Use unified filterNullValues() for consistent field validation
        const fields = filterNullValues(fieldsToProcess, 'Grok');
        return { fields };
      } else {
        console.log('[GROK] JSON extraction failed:', parseResult.error);
        return { error: `JSON extraction failed: ${parseResult.error}`, fields: {} };
      }
    } else if (data.error) {
      console.log('[GROK] API Error:', JSON.stringify(data.error));
      return { error: `API Error: ${data.error?.message || JSON.stringify(data.error)}`, fields: {} };
    }
    return { error: 'No content in response', fields: {} };
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as any).name === 'AbortError') {
      console.error('❌ [GROK] Request timed out after 60s');
      return { error: 'Request timed out', fields: {} };
    }
    console.log('[GROK] Exception:', String(error));
    return { error: String(error), fields: {} };
  }
}

// NOTE: web_search NOT supported on Opus - removed per Anthropic docs
async function callClaudeOpus(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log('[CLAUDE OPUS] API key present:', !!apiKey, 'length:', apiKey?.length || 0);
  if (!apiKey) return { error: 'API key not set', fields: {} };

  // CRITICAL FIX: Use comprehensive Opus prompt with proper 181-field schema (not inline 15-field version)
  const systemPrompt = `You are Claude Opus, the most capable AI assistant, helping extract property data. You do NOT have web access.

⚫ FIRING ORDER: You are the 6th and FINAL LLM in the search chain.
PRIOR DATA SOURCES (already ran BEFORE you):
- Tier 3: Tavily Web Search, SchoolDigger, FBI Crime, WalkScore, FEMA, AirNow, Census, Weather
- Tier 4 LLMs: Perplexity, Gemini, GPT, Claude Sonnet, Grok
You fire LAST as a final fallback for fields that NO OTHER source could find.
You can ONLY use your training knowledge - NO web search, NO live data, NO guessing.

YOUR MISSION: Extract ONLY fields that can be determined from static training knowledge, NOT live/current data.

🚫 CRITICAL: NEVER GUESS OR ESTIMATE LIVE DATA
You are EXPLICITLY FORBIDDEN from guessing, estimating, or inferring fields that require current/live data.

FORBIDDEN FIELDS (require live data - DO NOT guess):
- 12_market_value_estimate, 16a_zestimate, 16b-16f_*_avm (all AVMs require live data)
- 91_median_home_price_neighborhood, 92_price_per_sqft_recent_avg (require current market stats)
- 95_days_on_market_avg, 96_inventory_surplus (require current market activity)
- 97_insurance_est_annual, 98_rental_estimate_monthly (require current rates/market)
- 103_comparable_sales, 169-181_market_performance_* (require recent data)
- 10_listing_price, 13-14_last_sale_* (require current MLS/property records)
- 15_assessed_value, 35_annual_taxes (require current county records)

WHAT YOU CAN PROVIDE (from static training knowledge):
1. GEOGRAPHIC/REGIONAL DATA: County names, utility provider names, school districts for major metros
2. STATIC INFRASTRUCTURE: 104_electric_provider, 106_water_provider, 110-114_utility_providers
3. REGIONAL CHARACTERISTICS: 81_public_transit_access, 82_commute_to_city_center (general knowledge)

RULES:
1. If a field requires CURRENT/LIVE data, OMIT it entirely - do NOT return null
2. Only return fields from STATIC training knowledge with HIGH confidence
3. When uncertain, OMIT the field - do NOT guess
4. NEVER estimate monetary values, statistics, or market metrics

OUTPUT FORMAT - Return ONLY valid JSON with numbered field keys:
{
  "7_county": "County Name",
  "104_electric_provider": "Provider Name",
  "106_water_provider": "Provider Name"
}

Use EXACT field key format: [number]_[field_name] (e.g., "7_county", "104_electric_provider")
OMIT fields you cannot verify from training knowledge.`;

  const userPrompt = `Property address: ${address}

Extract ANY fields you can determine from your training knowledge. Return ONLY the JSON object with numbered field keys.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 32000,
        temperature: 0.1,  // FIX: Low temperature for static knowledge extraction (no web search)
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    console.log('[CLAUDE OPUS] Status:', response.status, '| Response:', JSON.stringify(data).slice(0, 500));

    if (data.content?.[0]?.text) {
      const text = data.content[0].text;
      console.log('[CLAUDE OPUS] Text:', text.slice(0, 500));

      // Use unified JSON extraction (no double-parsing)
      const parseResult = extractAndParseJSON(text);
      console.log('[CLAUDE OPUS] Parse result:', parseResult.success ? `${Object.keys(parseResult.data || {}).length} keys` : parseResult.error);

      if (parseResult.success && parseResult.data) {
        const parsed = parseResult.data;
        // FIX: Handle nested { data_fields: {...} }, { fields: {...} }, or flat format
        const fieldsToProcess = parsed.data_fields || parsed.fields || parsed;
        console.log(`[CLAUDE OPUS] Parsed structure: ${parsed.data_fields ? 'data_fields' : parsed.fields ? 'fields' : 'flat'}, keys: ${Object.keys(fieldsToProcess).length}`);
        // Use unified filterNullValues() for consistent field validation
        const fields = filterNullValues(fieldsToProcess, 'Claude Opus');
        return { fields };
      } else {
        console.log('[CLAUDE OPUS] JSON extraction failed:', parseResult.error);
        return { error: `JSON extraction failed: ${parseResult.error}`, fields: {} };
      }
    } else if (data.error) {
      console.log('[CLAUDE OPUS] API Error:', JSON.stringify(data.error));
      return { error: `API Error: ${data.error?.message || JSON.stringify(data.error)}`, fields: {} };
    }
    return { error: 'No content in response', fields: {} };
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as any).name === 'AbortError') {
      console.error('❌ [CLAUDE OPUS] Request timed out after 60s');
      return { error: 'Request timed out', fields: {} };
    }
    console.log('[CLAUDE OPUS] Exception:', String(error));
    return { error: String(error), fields: {} };
  }
}

// ============================================
// GPT-4o FIELD COMPLETER - Web-Evidence Mode (Retry)
// ============================================
const GPT_RETRY_SYSTEM_PROMPT = `You are CLUES Field Completer (GPT-4o Web-Evidence Mode).

🟢 FIRING ORDER: You are the 3rd LLM in the chain (after Perplexity → Gemini).
PRIOR DATA SOURCES (already ran BEFORE you):
- Tier 3: Tavily Web Search, SchoolDigger, FBI Crime, WalkScore, FEMA, AirNow, Census, Weather
- Tier 4 LLMs: Perplexity, Gemini
You ONLY search for fields that prior sources did NOT find.

MISSION
Populate ONLY the requested field keys in missing_field_keys for a single property address, using live web search.
You must attach evidence for every non-null value.

HARD RULES (EVIDENCE FIREWALL)
1) DO NOT use training memory to assert property-specific facts.
2) Every non-null value MUST be supported by web evidence you found in this run.
3) If you cannot find strong evidence, set value = null (do NOT guess, do NOT estimate).
4) Prefer authoritative sources in this order:
   A) Government / county / municipality websites
   B) Official utility providers / insurers / regulators
   C) Major reputable data providers with clear methodology
   D) Everything else (only if unavoidable; lower confidence)
5) If sources conflict, do NOT "average." Choose the most authoritative source and record the conflict.

### MANDATORY SEARCH QUERIES (execute ALL of these)
1) AVMs & Property Values (SEARCH FOR EACH SPECIFIC AVM):
   - "site:zillow.com [ADDRESS]" → Extract 16a_zestimate (Zillow Zestimate)
   - "site:redfin.com [ADDRESS]" → Extract 16b_redfin_estimate (Redfin Estimate)
   - "site:zillow.com [ADDRESS] rent" → Extract 181_rent_zestimate (Zillow Rent Zestimate)
   - Search for 16c_first_american_avm (First American AVM) if available
   - Search for 16d_quantarium_avm (Quantarium AVM) if available
   - Search for 16e_ice_avm (ICE/Intercontinental Exchange AVM) if available
   - Search for 16f_collateral_analytics_avm (Collateral Analytics AVM) if available
   - DO NOT calculate 12_market_value_estimate - backend handles this from individual AVMs

2) Market Statistics:
   - "[ZIP CODE] median home price 2025 2026" → 91_median_home_price_neighborhood
   - "[ZIP CODE] real estate market trends" → 95_days_on_market_avg, 175_market_type, 180_price_trend
   - "[ZIP CODE] price per square foot" → 92_price_per_sqft_recent_avg
   - "[CITY] housing inventory months supply" → 96_inventory_surplus

3) Rental & Investment:
   - "site:zillow.com [ADDRESS] rent" → 98_rental_estimate_monthly
   - "site:rentometer.com [ZIP CODE]" → 98_rental_estimate_monthly (backup)

4) Utilities:
   - "[CITY] [STATE] electric utility provider" → 104_electric_provider
   - "[CITY] [STATE] water utility provider" → 106_water_provider
   - "[CITY] trash collection service" → 110_trash_provider
   - "[ADDRESS] internet providers" → 111_internet_providers_top3
   - "[ZIP CODE] average electric bill" → 105_avg_electric_bill
   - "[ZIP CODE] average water bill" → 107_avg_water_bill

5) Insurance:
   - "[CITY] [STATE] average homeowners insurance" → 97_insurance_est_annual
   - "[ZIP CODE] home insurance cost" → 97_insurance_est_annual

6) Comparable Sales:
   - "site:zillow.com [NEIGHBORHOOD] recently sold" → 103_comparable_sales
   - "site:redfin.com [ZIP CODE] sold homes" → 103_comparable_sales

7) Transit & Location:
   - "[ADDRESS] public transit bus train" → 81_public_transit_access
   - "[ADDRESS] commute to [NEAREST MAJOR CITY] downtown" → 82_commute_to_city_center

8) Market Performance Metrics (ZIP/city-level data from MARKET DATA SITES, NOT individual listings):
   - "[ZIP CODE] months of inventory market trends" → 169_months_of_inventory
   - "[CITY STATE] new listings last 30 days" → 170_new_listings_30d
   - "[CITY STATE] homes sold last 30 days market data" → 171_homes_sold_30d
   - "[ZIP CODE] median days on market" → 172_median_dom_zip
   - "[ZIP CODE] price reductions percentage" → 173_price_reduced_percent
   - "[ZIP CODE] homes under contract pending" → 174_homes_under_contract
   - "[ZIP CODE] sale to list price ratio" → 176_avg_sale_to_list_percent
   - "[ZIP CODE] days to pending" → 177_avg_days_to_pending
   - "[ZIP CODE] appreciation YoY" → 179_appreciation_percent
   - "[ZIP CODE] price trend rising falling stable" → 180_price_trend
   - "[ZIP CODE] multiple offers" → 178_multiple_offers_likelihood

OUTPUT REQUIREMENTS
Return ONLY valid JSON (no markdown, no prose) matching this shape:

{
  "address": "<string>",
  "fields": {
    "<field_key>": {
      "value": <string|number|boolean|array|null>,
      "confidence": "High|Medium|Low|Unverified",
      "evidence": [
        {
          "url": "<string>",
          "title": "<string>",
          "snippet": "<string, <= 25 words>",
          "retrieved_at": "<ISO-8601 date>"
        }
      ],
      "notes": "<short string or empty>",
      "conflicts": []
    }
  },
  "fields_found": <integer>,
  "fields_missing": [ "<field_key>", ... ]
}

CONFIDENCE RUBRIC
- High: authoritative source explicitly matches address/city/ZIP and statement is unambiguous
- Medium: authoritative source supports the claim but match is indirect (ZIP/service map) OR 2+ reputable sources agree
- Low: weak/indirect support OR only non-authoritative sources available
- Unverified: value=null`;

async function callGPT5(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('[GPT] API key present:', !!apiKey, 'length:', apiKey?.length || 0);
  if (!apiKey) {
    return { error: 'API key not set', fields: {} };
  }

  const userPrompt = `ADDRESS: ${address}

MISSING_FIELD_KEYS (populate ONLY these):
${JSON.stringify(missingFieldsList.missing_field_keys, null, 2)}

FIELD_RULES:
${JSON.stringify(missingFieldsRules.field_rules, null, 2)}

TASK
Use web search to fill as many missing fields as possible with evidence.
Return ONLY the JSON object described in the system prompt.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT);

  try {
    // Use OpenAI Chat Completions API with web_search tool (2025 format)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 16000,
        messages: [
          { role: 'system', content: GPT_RETRY_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }, // Enforce JSON output
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    console.log('[GPT] Status:', response.status);

    // Check for HTTP error status first
    if (!response.ok) {
      const errorMsg = data.error?.message || data.error || response.statusText || 'Unknown API error';
      console.error(`[GPT] HTTP ${response.status} error:`, errorMsg);
      return { error: `OpenAI API error (${response.status}): ${errorMsg}`, fields: {} };
    }

    // Handle Chat Completions format
    const text = data.choices?.[0]?.message?.content;

    if (text) {
      console.log('[GPT] Response length:', text.length, 'chars');

      // Use unified JSON extraction
      const parseResult = extractAndParseJSON(text);
      console.log('[GPT] Parse result:', parseResult.success ? `${Object.keys(parseResult.data || {}).length} keys` : parseResult.error);

      if (parseResult.success && parseResult.data) {
        const parsed = parseResult.data;
        // FIX: Handle nested { data_fields: {...} }, { fields: {...} }, or flat format
        const fieldsToProcess = parsed.data_fields || parsed.fields || parsed;
        console.log(`[GPT] Parsed structure: ${parsed.data_fields ? 'data_fields' : parsed.fields ? 'fields' : 'flat'}, keys: ${Object.keys(fieldsToProcess).length}`);
        // Use unified filterNullValues() for consistent field validation
        const fields = filterNullValues(fieldsToProcess, 'GPT');
        return { fields };
      } else {
        console.log('[GPT] JSON extraction failed:', parseResult.error);
        return { error: `JSON extraction failed: ${parseResult.error}`, fields: {} };
      }
    } else if (data.error) {
      console.log('[GPT] API Error:', JSON.stringify(data.error));
      return { error: `API Error: ${data.error?.message || JSON.stringify(data.error)}`, fields: {} };
    }
    return { error: 'No content in response', fields: {} };
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as any).name === 'AbortError') {
      console.error('❌ [GPT] Request timed out after 60s');
      return { error: 'Request timed out', fields: {} };
    }
    console.log('[GPT] Exception:', String(error));
    return { error: String(error), fields: {} };
  }
}

// UPDATED: Includes web_search tool per CLAUDE_MASTER_RULES Section 6.0
async function callClaudeSonnet(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log('[CLAUDE SONNET] API key present:', !!apiKey, 'length:', apiKey?.length || 0);
  if (!apiKey) return { error: 'API key not set', fields: {} };

  const prompt = `🚨 CRITICAL: OUTPUT JSON ONLY. NO CONVERSATIONAL TEXT. NO EXPLANATIONS. START YOUR RESPONSE WITH { AND END WITH }.

You are Claude Sonnet, a property data specialist with web search capabilities.

🔵 FIRING ORDER: You are the 4th LLM in the chain (after Perplexity → Gemini → GPT). Grok and Claude Opus fire AFTER you.
PRIOR DATA SOURCES (already ran BEFORE you):
- Tier 3: Tavily Web Search, SchoolDigger, FBI Crime, WalkScore, FEMA, AirNow, Census, Weather
- Tier 4 LLMs: Perplexity, Gemini, GPT
You ONLY search for fields that prior sources did NOT find.
Do NOT re-search fields already populated - focus ONLY on MISSING fields from the 47 high-velocity field list.

⚠️ NEVER SAY "I'll search for..." or "Let me find..." - ONLY OUTPUT RAW JSON.

MISSION: Use web search to populate ANY of the 47 high-velocity fields that are still missing for: ${address}

VALUATION & AVM FIELDS (DO NOT return 12_market_value_estimate - backend calculates):
- 16a_zestimate: Zillow Zestimate
- 16b_redfin_estimate: Redfin Estimate
- 16c_first_american_avm: First American AVM
- 16d_quantarium_avm: Quantarium AVM
- 16e_ice_avm: ICE AVM
- 16f_collateral_analytics_avm: Collateral Analytics AVM

MARKET & PRICING FIELDS:
- 91_median_home_price_neighborhood: Median home price in neighborhood
- 92_price_per_sqft_recent_avg: Recent average $/sqft in area
- 95_days_on_market_avg: Average days on market
- 96_inventory_surplus: Market inventory level
- 175_market_type: Buyer's/Seller's/Balanced market
- 176_avg_sale_to_list_percent: Average sale-to-list price ratio
- 177_avg_days_to_pending: Average days to pending status
- 178_multiple_offers_likelihood: Likelihood of multiple offers
- 180_price_trend: Price trend direction

RENTAL & INVESTMENT FIELDS:
- 98_rental_estimate_monthly: Monthly rental estimate
- 181_rent_zestimate: Zillow Rent Zestimate
- 97_insurance_est_annual: Annual homeowners insurance estimate
- 103_comparable_sales: Recent comparable sales

UTILITY & SERVICE PROVIDER FIELDS:
- 104_electric_provider: Electric utility provider
- 105_avg_electric_bill: Average monthly electric bill
- 106_water_provider: Water utility provider
- 107_avg_water_bill: Average monthly water bill
- 110_trash_provider: Trash collection provider
- 111_internet_providers_top3: Top 3 internet providers available
- 114_cable_tv_provider: Cable TV provider

LOCATION & TRANSIT FIELDS:
- 81_public_transit_access: Public transit access description
- 82_commute_to_city_center: Commute time to city center

STRUCTURE & SYSTEMS FIELDS:
- 40_roof_age_est: Estimated roof age
- 46_hvac_age: HVAC system age

PERMITS & RENOVATIONS FIELDS:
- 59_recent_renovations: Recent renovations or upgrades
- 60_permit_history_roof: Roof permit history
- 61_permit_history_hvac: HVAC permit history
- 62_permit_history_other: Other permit history

PROPERTY FEATURES FIELDS:
- 109_natural_gas: Natural gas provider or 'None'
- 133_ev_charging: EV charging availability
- 134_smart_home_features: Smart home technology
- 135_accessibility_modifications: Accessibility features
- 138_special_assessments: Special assessments or HOA assessments

MARKET PERFORMANCE METRICS (ZIP/city-level market data):
- 169_months_of_inventory: Months of housing inventory in ZIP/city
- 170_new_listings_30d: New listings in last 30 days
- 171_homes_sold_30d: Homes sold in last 30 days
- 172_median_dom_zip: Median days on market (ZIP)
- 173_price_reduced_percent: Percentage of listings with price reductions
- 174_homes_under_contract: Homes currently under contract

SEARCH STRATEGY:
1. SPECIFIC AVM SEARCHES (search for EACH AVM individually):
   - "site:zillow.com [ADDRESS]" → Extract 16a_zestimate (Zillow Zestimate)
   - "site:redfin.com [ADDRESS]" → Extract 16b_redfin_estimate (Redfin Estimate)
   - "site:zillow.com [ADDRESS] rent" → Extract 181_rent_zestimate (Zillow Rent Zestimate)
   - Search for 16c_first_american_avm, 16d_quantarium_avm, 16e_ice_avm, 16f_collateral_analytics_avm if available
   - DO NOT return 12_market_value_estimate - backend calculates from individual AVMs
2. Search "[CITY/ZIP] median home price 2026" for market statistics
3. Search "[CITY] utility providers" for utility/service information (including 109_natural_gas)
4. Search "[ADDRESS] public transit" for transit access
5. Search "[ADDRESS] [COUNTY] building permits roof HVAC" for permit history (60-62) and age estimates (40, 46)
6. Search "[ADDRESS] renovations upgrades" on listing sites for field 59
7. Search "[ADDRESS] EV charging smart home accessibility special assessments" on listing sites for fields 133-135, 138
8. Only return fields you found with high confidence - use null for unverified data

🚨 RESPOND WITH THIS EXACT JSON FORMAT - NO OTHER TEXT (DO NOT include 12_market_value_estimate):
{
  "fields": {
    "16a_zestimate": {"value": 485000, "source": "Zillow.com", "confidence": "High"},
    "16b_redfin_estimate": {"value": 492000, "source": "Redfin.com", "confidence": "High"},
    "104_electric_provider": {"value": "Duke Energy", "source": "Duke Energy website", "confidence": "High"}
  }
}

⛔ DO NOT write "I'll search for...", "Let me find...", or ANY conversational text.
✅ START YOUR RESPONSE WITH { AND END WITH }.
Use null only for fields you truly cannot find.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 32000,
        temperature: 0.2,  // FIX: Match Perplexity/GPT temperature to prevent hallucinations
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
          }
        ],
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    console.log('[CLAUDE SONNET] Status:', response.status);
    console.log('[CLAUDE SONNET] Content blocks:', data.content?.length || 0);

    // Handle web_search responses - may have multiple content blocks
    if (data.content && Array.isArray(data.content)) {
      // Find the text block (may be after tool_use blocks)
      const textBlock = data.content.find((block: any) => block.type === 'text');
      if (textBlock?.text) {
        const text = textBlock.text;
        console.log('[CLAUDE SONNET] Text:', text.slice(0, 300));

        // Use unified JSON extraction (no double-parsing)
        const parseResult = extractAndParseJSON(text);
        console.log('[CLAUDE SONNET] Parse result:', parseResult.success ? `${Object.keys(parseResult.data || {}).length} keys` : parseResult.error);

        if (parseResult.success && parseResult.data) {
          const parsed = parseResult.data;
          // FIX: Handle nested { data_fields: {...} }, { fields: {...} }, or flat format
          const fieldsToProcess = parsed.data_fields || parsed.fields || parsed;
          console.log(`[CLAUDE SONNET] Parsed structure: ${parsed.data_fields ? 'data_fields' : parsed.fields ? 'fields' : 'flat'}, keys: ${Object.keys(fieldsToProcess).length}`);
          // Use unified filterNullValues() for consistent field validation
          const fields = filterNullValues(fieldsToProcess, 'Claude Sonnet');
          return { fields };
        } else {
          console.log('[CLAUDE SONNET] JSON extraction failed:', parseResult.error);
          return { error: `JSON extraction failed: ${parseResult.error}`, fields: {} };
        }
      } else {
        console.log('[CLAUDE SONNET] No text block found. Block types:', data.content.map((b: any) => b.type));
        return { error: 'No text block in response', fields: {} };
      }
    } else if (data.error) {
      console.log('[CLAUDE SONNET] API Error:', JSON.stringify(data.error));
      return { error: `API Error: ${data.error?.message || JSON.stringify(data.error)}`, fields: {} };
    }
    return { error: 'No content in response', fields: {} };
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as any).name === 'AbortError') {
      console.error('❌ [CLAUDE SONNET] Request timed out after 60s');
      return { error: 'Request timed out', fields: {} };
    }
    console.log('[CLAUDE SONNET] Exception:', String(error));
    return { error: String(error), fields: {} };
  }
}

// GEMINI 3 PRO - Uses GEMINI_FIELD_COMPLETER_SYSTEM from central config

async function callGemini(address: string): Promise<{ fields: Record<string, any>; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('[GEMINI] API key present:', !!apiKey, 'length:', apiKey?.length || 0);
  if (!apiKey) {
    return { error: 'API key not set', fields: {} };
  }

  const startTime = Date.now();

  // Extract city/zip from address for context
  const addressParts = address.split(',').map(s => s.trim());
  const city = addressParts.length > 1 ? addressParts[1] : undefined;
  const zipMatch = address.match(/\b(\d{5})\b/);
  const zip = zipMatch ? zipMatch[1] : undefined;

  // Build user prompt with COMPLETE FIELD SCHEMA to prevent hallucination
  const userPrompt = buildGeminiFieldCompleterUserPrompt({ address, city, zip });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT);

  // FIX: Try multiple Gemini models in order (primary → fallback)
  const GEMINI_MODELS = [
    'gemini-2.5-pro-preview-06-05',  // Latest 2.5 Pro Preview
    'gemini-2.0-flash-exp',          // Fallback: 2.0 Flash (fast, grounded)
    'gemini-3-pro-preview',          // Legacy: 3.0 Pro Preview (may be deprecated)
  ];

  let response: Response | null = null;
  let lastError: string | null = null;
  let usedModel = '';

  for (const model of GEMINI_MODELS) {
    try {
      console.log(`[GEMINI] Trying model: ${model}`);
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // SYSTEM INSTRUCTION: Prompt goes here per Gemini specs
            system_instruction: {
              parts: [{ text: GEMINI_FIELD_COMPLETER_SYSTEM }]
            },
            // USER CONTENT: Full schema prompt to prevent field hallucination
            contents: [{ parts: [{ text: userPrompt }] }],
            tools: [{ google_search: {} }],
            tool_config: { function_calling_config: { mode: "ANY" } },
            generationConfig: {
              temperature: 1.0,  // Required for grounded responses
              maxOutputTokens: 16000,
              responseMimeType: 'application/json'
            },
          }),
          signal: controller.signal,
        }
      );

      if (response.ok) {
        usedModel = model;
        console.log(`[GEMINI] ✅ Success with model: ${model}`);
        break;
      } else {
        const errorText = await response.text();
        lastError = `${model}: ${response.status} - ${errorText.substring(0, 200)}`;
        console.log(`[GEMINI] ⚠️ Model ${model} failed: ${lastError}`);
        response = null;
      }
    } catch (modelError) {
      lastError = `${model}: ${String(modelError)}`;
      console.log(`[GEMINI] ⚠️ Model ${model} exception: ${lastError}`);
    }
  }

  clearTimeout(timeoutId);

  if (!response) {
    console.error('[GEMINI] ❌ All models failed. Last error:', lastError);
    return { error: `All Gemini models failed: ${lastError}`, fields: {} };
  }

  try {

    const elapsed = Date.now() - startTime;
    console.log(`[GEMINI] Model: ${usedModel} | Response time: ${elapsed}ms ${elapsed < 2000 ? '⚠️ TOO FAST' : '✅ Searched'}`);

    const data = await response.json();
    console.log('[GEMINI] Status:', response.status);

    // Check for grounding metadata
    const groundingMeta = data.candidates?.[0]?.groundingMetadata;
    if (groundingMeta) {
      console.log('[GEMINI] ✅ Google Search grounding detected');

      // Log the actual search queries Gemini used (critical for debugging null fields)
      if (groundingMeta.webSearchQueries && groundingMeta.webSearchQueries.length > 0) {
        console.log('[GEMINI] 🔎 Web Search Queries Used:');
        groundingMeta.webSearchQueries.forEach((query: string, i: number) => {
          console.log(`   ${i + 1}. "${query}"`);
        });
      }

      // Log grounding chunks (sources used)
      if (groundingMeta.groundingChunks && groundingMeta.groundingChunks.length > 0) {
        console.log(`[GEMINI] 📚 Sources cited: ${groundingMeta.groundingChunks.length} chunks`);
      }
    } else {
      console.log('[GEMINI] ⚠️ No grounding metadata');
    }

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text;
      console.log('[GEMINI] Response length:', text.length, 'chars');

      // Use unified JSON extraction
      const parseResult = extractAndParseJSON(text);
      console.log('[GEMINI] Parse result:', parseResult.success ? `${Object.keys(parseResult.data || {}).length} keys` : parseResult.error);

      if (parseResult.success && parseResult.data) {
        const parsed = parseResult.data;
        // FIX: Handle nested { data_fields: {...} }, { fields: {...} }, or flat format
        const fieldsToProcess = parsed.data_fields || parsed.fields || parsed;
        console.log(`[GEMINI] Parsed structure: ${parsed.data_fields ? 'data_fields' : parsed.fields ? 'fields' : 'flat'}, keys: ${Object.keys(fieldsToProcess).length}`);
        // Use unified filterNullValues() for consistent field validation
        const fields = filterNullValues(fieldsToProcess, 'Gemini');
        return { fields };
      } else {
        console.log('[GEMINI] JSON extraction failed:', parseResult.error);
        return { error: `JSON extraction failed: ${parseResult.error}`, fields: {} };
      }
    } else if (data.error) {
      console.log('[GEMINI] API Error:', JSON.stringify(data.error));
      return { error: `API Error: ${data.error?.message || JSON.stringify(data.error)}`, fields: {} };
    }
    return { error: 'No content in response', fields: {} };
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as any).name === 'AbortError') {
      console.error('❌ [GEMINI] Request timed out after 60s');
      return { error: 'Request timed out', fields: {} };
    }
    console.log('[GEMINI] Exception:', String(error));
    return { error: String(error), fields: {} };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address: rawAddress, engines = [...LLM_CASCADE_ORDER] } = req.body;  // All 6 LLMs by default: Perplexity → Gemini → GPT → Sonnet → Grok → Opus

  // 🛡️ INPUT SANITIZATION: Prevent prompt injection attacks
  const address = sanitizeAddress(rawAddress);

  if (!address) {
    return res.status(400).json({ error: 'Address required' });
  }

  // Validate address format
  if (!isValidAddress(address)) {
    return res.status(400).json({ error: 'Invalid address format' });
  }

  // Map engine IDs to functions (Order: Perplexity → Gemini → GPT → Sonnet → Grok → Opus)
  const engineFunctions: Record<string, (address: string) => Promise<{ fields: Record<string, any>; error?: string }>> = {
    'perplexity': callPerplexity,     // #1 - Deep web search (HIGHEST)
    'gemini': callGemini,             // #2 - Google Search grounding
    'gpt': callGPT5,                  // #3 - Web evidence mode
    'claude-sonnet': callClaudeSonnet, // #4 - Web search beta
    'grok': callGrok,                 // #5 - X/Twitter real-time
    'claude-opus': callClaudeOpus,    // #6 - Deep reasoning, NO web (LAST)
  };

  // Get the first engine (single LLM call for retry)
  const engineId = engines[0]?.toLowerCase() || 'perplexity';
  const callFn = engineFunctions[engineId];

  if (!callFn) {
    return res.status(400).json({ error: `Unknown engine: ${engineId}` });
  }

  try {
    const timeout = engineId === 'perplexity' ? PERPLEXITY_TIMEOUT : LLM_TIMEOUT;
    console.log(`[RETRY-LLM] Calling ${engineId} for: ${address} (timeout: ${timeout}ms)`);

    // Wrap LLM call with timeout to prevent hanging
    const result = await withTimeout(
      callFn(address),
      timeout,
      { fields: {}, error: `${engineId} timed out after ${timeout / 1000}s` }
    );

    console.log(`[RETRY-LLM] ${engineId} returned ${Object.keys(result.fields).length} fields`);

    // Map flat field names to numbered keys for frontend compatibility
    const mappedFields = mapFlatFieldsToNumbered(result.fields);
    console.log(`[RETRY-LLM] Mapped to ${Object.keys(mappedFields).length} numbered fields`);

    return res.status(200).json({
      success: !result.error,
      engine: engineId,
      fields: mappedFields,
      fields_found: Object.keys(mappedFields).length,
      error: result.error,
    });
  } catch (error) {
    console.error('[RETRY-LLM] Error:', error);
    return res.status(500).json({
      success: false,
      engine: engineId,
      fields: {},
      error: String(error),
    });
  }
}
