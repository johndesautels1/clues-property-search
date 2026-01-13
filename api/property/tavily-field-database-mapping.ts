/**
 * TAVILY FIELD DATABASE MAPPING - CORRECTED
 * Maps field IDs to their actual database paths in fullProperty object
 *
 * CRITICAL: This is the CORRECT mapping extracted from PropertyDetail.tsx
 * Database uses NESTED OBJECTS, not flat field_X columns
 */

export interface FieldDatabasePath {
  fieldId: number | string;  // Allow string for subfields like '16a', '16b', etc.
  fieldKey: string;  // Exact key used in PropertyDetail.tsx paths object
  path: [string, string];  // [parentObject, propertyName]
  label: string;
  calculationOnly?: boolean;  // FIX ERROR #7: Mark fields that are calculated, not fetched
}

/**
 * Complete mapping for all 55 Tavily-enabled fields + 6 AVM subfields
 * Source: PropertyDetail.tsx paths object (lines 677-927)
 */
export const TAVILY_FIELD_DATABASE_MAPPING: Record<number | string, FieldDatabasePath> = {
  // Property Value & AVMs
  12: {
    fieldId: 12,
    fieldKey: '12_market_value_estimate',
    path: ['details', 'marketValueEstimate'],
    label: 'Market Value Estimate'
  },

  // Tax & Assessment (ADDED 2026-01-13)
  15: {
    fieldId: 15,
    fieldKey: '15_assessed_value',
    path: ['financial', 'assessedValue'],
    label: 'Assessed Value'
  },

  16: {
    fieldId: 16,
    fieldKey: '16_avms',
    path: ['financial', 'avms'],
    label: 'AVMs (Average)',
    calculationOnly: true  // Calculated from fields 16a-16f
  },

  // AVM Subfields (16a-16f) - Individual AVM Sources
  '16a': {
    fieldId: '16a',
    fieldKey: '16a_zestimate',
    path: ['financial', 'zestimate'],
    label: 'Zillow Zestimate'
  },
  '16b': {
    fieldId: '16b',
    fieldKey: '16b_redfin_estimate',
    path: ['financial', 'redfinEstimate'],
    label: 'Redfin Estimate'
  },
  '16c': {
    fieldId: '16c',
    fieldKey: '16c_first_american_avm',
    path: ['financial', 'firstAmericanAvm'],
    label: 'First American AVM'
  },
  '16d': {
    fieldId: '16d',
    fieldKey: '16d_quantarium_avm',
    path: ['financial', 'quantariumAvm'],
    label: 'Quantarium AVM'
  },
  '16e': {
    fieldId: '16e',
    fieldKey: '16e_ice_avm',
    path: ['financial', 'iceAvm'],
    label: 'ICE AVM'
  },
  '16f': {
    fieldId: '16f',
    fieldKey: '16f_collateral_analytics_avm',
    path: ['financial', 'collateralAnalyticsAvm'],
    label: 'Collateral Analytics AVM'
  },

  // Tax Fields (ADDED 2026-01-13)
  35: {
    fieldId: 35,
    fieldKey: '35_annual_taxes',
    path: ['financial', 'annualTaxes'],
    label: 'Annual Taxes'
  },
  38: {
    fieldId: 38,
    fieldKey: '38_tax_exemptions',
    path: ['financial', 'taxExemptions'],
    label: 'Tax Exemptions'
  },

  // Property Condition & Permits
  40: {
    fieldId: 40,
    fieldKey: '40_roof_age_est',  // NOTE: _est suffix in database!
    path: ['structural', 'roofAgeEst'],
    label: 'Roof Age (Est)'
  },
  46: {
    fieldId: 46,
    fieldKey: '46_hvac_age',
    path: ['structural', 'hvacAge'],
    label: 'HVAC Age'
  },
  59: {
    fieldId: 59,
    fieldKey: '59_recent_renovations',
    path: ['structural', 'recentRenovations'],
    label: 'Recent Renovations'
  },
  60: {
    fieldId: 60,
    fieldKey: '60_permit_history_roof',
    path: ['structural', 'permitHistoryRoof'],
    label: 'Permit History - Roof'
  },
  61: {
    fieldId: 61,
    fieldKey: '61_permit_history_hvac',
    path: ['structural', 'permitHistoryHvac'],
    label: 'Permit History - HVAC'
  },
  62: {
    fieldId: 62,
    fieldKey: '62_permit_history_other',
    path: ['structural', 'permitHistoryPoolAdditions'],
    label: 'Permit History - Other'
  },

  // Environment & Walkability
  78: {
    fieldId: 78,
    fieldKey: '78_noise_level',
    path: ['location', 'noiseLevel'],
    label: 'Noise Level'
  },
  79: {
    fieldId: 79,
    fieldKey: '79_traffic_level',
    path: ['location', 'trafficLevel'],
    label: 'Traffic Level'
  },
  80: {
    fieldId: 80,
    fieldKey: '80_walkability_description',  // NOTE: _description suffix!
    path: ['location', 'walkabilityDescription'],
    label: 'Walkability Description'
  },
  81: {
    fieldId: 81,
    fieldKey: '81_public_transit_access',  // NOTE: _access suffix!
    path: ['location', 'publicTransitAccess'],
    label: 'Public Transit Access'
  },
  82: {
    fieldId: 82,
    fieldKey: '82_commute_to_city_center',
    path: ['location', 'commuteTimeCityCenter'],
    label: 'Commute to City Center'
  },

  // Market Data
  91: {
    fieldId: 91,
    fieldKey: '91_median_home_price_neighborhood',  // NOTE: _neighborhood suffix!
    path: ['financial', 'medianHomePriceNeighborhood'],
    label: 'Median Home Price (Neighborhood)'
  },
  92: {
    fieldId: 92,
    fieldKey: '92_price_per_sqft_recent_avg',  // NOTE: _recent_avg suffix!
    path: ['financial', 'pricePerSqftRecentAvg'],
    label: 'Price Per Sq Ft (Recent Avg)'
  },
  93: {
    fieldId: 93,
    fieldKey: '93_price_to_rent_ratio',
    path: ['financial', 'priceToRentRatio'],
    label: 'Price to Rent Ratio'
  },
  94: {
    fieldId: 94,
    fieldKey: '94_price_vs_median_percent',
    path: ['financial', 'priceVsMedianPercent'],
    label: 'Price vs Median %',
    calculationOnly: true  // Calculated from fields 12 and 91
  },
  95: {
    fieldId: 95,
    fieldKey: '95_days_on_market_avg',  // NOTE: _avg suffix!
    path: ['financial', 'daysOnMarketAvg'],
    label: 'Days on Market (Avg)'
  },
  96: {
    fieldId: 96,
    fieldKey: '96_inventory_surplus',
    path: ['financial', 'inventorySurplus'],
    label: 'Inventory Surplus'
  },
  97: {
    fieldId: 97,
    fieldKey: '97_insurance_est_annual',  // NOTE: _est_annual suffix!
    path: ['financial', 'insuranceEstAnnual'],
    label: 'Insurance Estimate (Annual)'
  },
  98: {
    fieldId: 98,
    fieldKey: '98_rental_estimate_monthly',  // NOTE: _monthly suffix!
    path: ['financial', 'rentalEstimateMonthly'],
    label: 'Rental Estimate (Monthly)'
  },
  99: {
    fieldId: 99,
    fieldKey: '99_rental_yield_est',  // NOTE: _est suffix!
    path: ['financial', 'rentalYieldEst'],
    label: 'Rental Yield (Est)',
    calculationOnly: true  // Calculated from fields 10 and 98
  },
  100: {
    fieldId: 100,
    fieldKey: '100_vacancy_rate_neighborhood',  // NOTE: _neighborhood suffix!
    path: ['financial', 'vacancyRateNeighborhood'],
    label: 'Vacancy Rate (Neighborhood)'
  },
  101: {
    fieldId: 101,
    fieldKey: '101_cap_rate_est',
    path: ['financial', 'capRateEst'],
    label: 'Cap Rate (Est)',
    calculationOnly: true  // Calculated from fields 12, 98, 35
  },
  102: {
    fieldId: 102,
    fieldKey: '102_financing_terms',
    path: ['financial', 'financingTerms'],
    label: 'Financing Terms'
  },
  103: {
    fieldId: 103,
    fieldKey: '103_comparable_sales',
    path: ['financial', 'comparableSalesLast3'],
    label: 'Comparable Sales'
  },

  // Utilities
  104: {
    fieldId: 104,
    fieldKey: '104_electric_provider',
    path: ['utilities', 'electricProvider'],
    label: 'Electric Provider'
  },
  105: {
    fieldId: 105,
    fieldKey: '105_avg_electric_bill',
    path: ['utilities', 'avgElectricBill'],
    label: 'Avg Electric Bill'
  },
  106: {
    fieldId: 106,
    fieldKey: '106_water_provider',
    path: ['utilities', 'waterProvider'],
    label: 'Water Provider'
  },
  107: {
    fieldId: 107,
    fieldKey: '107_avg_water_bill',
    path: ['utilities', 'avgWaterBill'],
    label: 'Avg Water Bill'
  },
  108: {
    fieldId: 108,
    fieldKey: '108_sewer_provider',
    path: ['utilities', 'sewerProvider'],
    label: 'Sewer Provider'
  },
  109: {
    fieldId: 109,
    fieldKey: '109_natural_gas',
    path: ['utilities', 'naturalGas'],
    label: 'Natural Gas'
  },
  110: {
    fieldId: 110,
    fieldKey: '110_trash_provider',
    path: ['utilities', 'trashProvider'],
    label: 'Trash Provider'
  },
  111: {
    fieldId: 111,
    fieldKey: '111_internet_providers_top3',  // NOTE: _top3 suffix!
    path: ['utilities', 'internetProvidersTop3'],
    label: 'Internet Providers (Top 3)'
  },
  112: {
    fieldId: 112,
    fieldKey: '112_max_internet_speed',
    path: ['utilities', 'maxInternetSpeed'],
    label: 'Max Internet Speed'
  },
  113: {
    fieldId: 113,
    fieldKey: '113_fiber_available',
    path: ['utilities', 'fiberAvailable'],
    label: 'Fiber Available'
  },
  114: {
    fieldId: 114,
    fieldKey: '114_cable_tv_provider',
    path: ['utilities', 'cableTvProvider'],
    label: 'Cable TV Provider'
  },
  115: {
    fieldId: 115,
    fieldKey: '115_cell_coverage_quality',  // NOTE: _quality suffix!
    path: ['utilities', 'cellCoverageQuality'],
    label: 'Cell Coverage Quality'
  },
  116: {
    fieldId: 116,
    fieldKey: '116_emergency_services_distance',
    path: ['utilities', 'emergencyServicesDistance'],
    label: 'Emergency Services Distance'
  },

  // Features
  131: {
    fieldId: 131,
    fieldKey: '131_view_type',
    path: ['utilities', 'viewType'],
    label: 'View Type'
  },
  132: {
    fieldId: 132,
    fieldKey: '132_lot_features',
    path: ['utilities', 'lotFeatures'],
    label: 'Lot Features'
  },
  133: {
    fieldId: 133,
    fieldKey: '133_ev_charging',
    path: ['utilities', 'evChargingYn'],
    label: 'EV Charging'
  },
  134: {
    fieldId: 134,
    fieldKey: '134_smart_home_features',
    path: ['utilities', 'smartHomeFeatures'],
    label: 'Smart Home Features'
  },
  135: {
    fieldId: 135,
    fieldKey: '135_accessibility_modifications',  // NOTE: _modifications suffix!
    path: ['utilities', 'accessibilityMods'],
    label: 'Accessibility Modifications'
  },
  136: {
    fieldId: 136,
    fieldKey: '136_pet_policy',
    path: ['utilities', 'petPolicy'],
    label: 'Pet Policy'
  },
  137: {
    fieldId: 137,
    fieldKey: '137_age_restrictions',
    path: ['utilities', 'ageRestrictions'],
    label: 'Age Restrictions'
  },
  138: {
    fieldId: 138,
    fieldKey: '138_special_assessments',
    path: ['utilities', 'specialAssessments'],
    label: 'Special Assessments'
  },

  // ==========================================
  // Homestead & CDD (Fields 151-153) - ADDED 2026-01-13
  // ==========================================
  151: {
    fieldId: 151,
    fieldKey: '151_homestead_yn',
    path: ['financial', 'homesteadYn'],
    label: 'Homestead Y/N'
  },
  152: {
    fieldId: 152,
    fieldKey: '152_cdd_yn',
    path: ['financial', 'cddYn'],
    label: 'CDD Y/N'
  },
  153: {
    fieldId: 153,
    fieldKey: '153_annual_cdd_fee',
    path: ['financial', 'annualCddFee'],
    label: 'Annual CDD Fee'
  },

  // ==========================================
  // Market Performance (Fields 169-181)
  // Repurposed 2026-01-11: Fields 169-174 changed from view counts to market metrics
  // All paths verified against property.ts MarketPerformanceData interface
  // ==========================================
  169: {
    fieldId: 169,
    fieldKey: '169_months_of_inventory',
    path: ['marketPerformance', 'monthsOfInventory'],
    label: 'Months of Inventory'
  },
  170: {
    fieldId: 170,
    fieldKey: '170_new_listings_30d',
    path: ['marketPerformance', 'newListings30d'],
    label: 'New Listings (30d)'
  },
  171: {
    fieldId: 171,
    fieldKey: '171_homes_sold_30d',
    path: ['marketPerformance', 'homesSold30d'],
    label: 'Homes Sold (30d)'
  },
  172: {
    fieldId: 172,
    fieldKey: '172_median_dom_zip',
    path: ['marketPerformance', 'medianDomZip'],
    label: 'Median DOM (ZIP)'
  },
  173: {
    fieldId: 173,
    fieldKey: '173_price_reduced_percent',
    path: ['marketPerformance', 'priceReducedPercent'],
    label: 'Price Reduced %'
  },
  174: {
    fieldId: 174,
    fieldKey: '174_homes_under_contract',
    path: ['marketPerformance', 'homesUnderContract'],
    label: 'Homes Under Contract'
  },
  175: {
    fieldId: 175,
    fieldKey: '175_market_type',
    path: ['marketPerformance', 'marketType'],
    label: 'Market Type'
  },
  176: {
    fieldId: 176,
    fieldKey: '176_avg_sale_to_list_percent',
    path: ['marketPerformance', 'avgSaleToListPercent'],
    label: 'Avg Sale-to-List %'
  },
  177: {
    fieldId: 177,
    fieldKey: '177_avg_days_to_pending',
    path: ['marketPerformance', 'avgDaysToPending'],
    label: 'Avg Days to Pending'
  },
  178: {
    fieldId: 178,
    fieldKey: '178_multiple_offers_likelihood',
    path: ['marketPerformance', 'multipleOffersLikelihood'],
    label: 'Multiple Offers Likelihood'
  },
  179: {
    fieldId: 179,
    fieldKey: '179_appreciation_percent',
    path: ['marketPerformance', 'appreciationPercent'],
    label: 'Appreciation %'
  },
  180: {
    fieldId: 180,
    fieldKey: '180_price_trend',
    path: ['marketPerformance', 'priceTrend'],
    label: 'Price Trend'
  },
  181: {
    fieldId: 181,
    fieldKey: '181_rent_zestimate',
    path: ['marketPerformance', 'rentZestimate'],
    label: 'Rent Zestimate'
  }
};

/**
 * Helper: Get database path for a field ID
 */
export function getFieldDatabasePath(fieldId: number | string): FieldDatabasePath | undefined {
  return TAVILY_FIELD_DATABASE_MAPPING[fieldId];
}

/**
 * Helper: Get field ID from field key
 */
export function getFieldIdFromKey(fieldKey: string): number | string | undefined {
  const entry = Object.values(TAVILY_FIELD_DATABASE_MAPPING).find(
    mapping => mapping.fieldKey === fieldKey
  );
  return entry?.fieldId;
}

/**
 * Helper: Update nested property value
 * Usage: updateNestedProperty(fullProperty, ['details', 'marketValueEstimate'], '$500,000')
 */
export function updateNestedProperty(
  obj: any,
  path: [string, string],
  value: any
): void {
  const [parent, property] = path;

  // Ensure parent object exists
  if (!obj[parent]) {
    obj[parent] = {};
  }

  // Set value with confidence metadata
  obj[parent][property] = {
    value,
    confidence: 'High',
    source: ['tavily'],
    llmSources: []
  };
}

/**
 * Export field key to ID map for PropertyDetail.tsx
 */
export const FIELD_KEY_TO_ID_MAP: Record<string, number> = Object.fromEntries(
  Object.values(TAVILY_FIELD_DATABASE_MAPPING).map(mapping => [mapping.fieldKey, mapping.fieldId])
);
