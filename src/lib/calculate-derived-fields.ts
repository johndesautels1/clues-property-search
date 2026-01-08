/**
 * Calculation Engine for Derived Fields
 * All mathematical field calculations happen here (not in LLMs)
 * Pattern: Null-safe math, return NULL if inputs missing
 */

export interface PropertyData {
  // Input fields for calculations
  field_10_listing_price?: number;
  field_15_assessed_value?: number;
  field_16a_zestimate?: number;
  field_16b_redfin_estimate?: number;
  field_16c_first_american_avm?: number;
  field_16d_quantarium_avm?: number;
  field_16e_ice_avm?: number;
  field_16f_collateral_analytics_avm?: number;
  field_18_full_bathrooms?: number;
  field_19_half_bathrooms?: number;
  field_21_living_sqft?: number;
  field_23_lot_size_sqft?: number;
  field_26_property_type?: string;
  field_28_garage_spaces?: number;
  field_31_hoa_fee_annual?: number;
  field_33_hoa_includes?: string;
  field_35_annual_taxes?: number;
  field_52_fireplace_yn?: string;
  field_54_pool_yn?: string;
  field_91_median_home_price_neighborhood?: number;
  field_97_insurance_annual?: number;
  field_98_rental_estimate_monthly?: number;
  field_140_carport_spaces?: number;
  field_143_assigned_parking?: number;
  field_169_zillow_views?: number;
  field_170_redfin_views?: number;
  field_171_homes_views?: number;
  field_172_realtor_views?: number;

  // Permit data for age calculations
  permit_roof_year?: number;
  permit_hvac_year?: number;

  // School addresses for distance calculations
  elementary_school_address?: string;
  middle_school_address?: string;
  high_school_address?: string;

  // Property address for distance calculations
  property_address?: string;
  property_lat?: number;
  property_lng?: number;
}

export interface CalculationResult {
  value: any;
  source: string;
  confidence: 'High' | 'Medium' | 'Low';
  calculation_method?: string;
  missing_inputs?: string[];
}

/**
 * Helper: Parse numeric value from string or number
 * Handles formats like: 1250000, "1250000", "$1,250,000", "1,250,000.00"
 */
function parseNumericValue(value: any): number {
  if (typeof value === 'number') {
    return value;
  }
  if (value === null || value === undefined || value === '') {
    return NaN;
  }
  // Remove all non-numeric characters except decimal point and minus sign
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned);
}

/**
 * Field 11: Price Per Square Foot
 * Formula: listing_price / living_sqft
 * FIXED 2026-01-08: Exclude rental properties (monthly rent makes no sense as $/sqft)
 */
export function calculatePricePerSqft(data: PropertyData): CalculationResult | null {
  // Parse inputs - handle both numbers and strings (e.g., "1250000" or "$1,250,000")
  const listingPrice = parseNumericValue(data.field_10_listing_price);
  const livingSqft = parseNumericValue(data.field_21_living_sqft);

  console.log('[calculatePricePerSqft] Inputs:', {
    raw_listing_price: data.field_10_listing_price,
    raw_living_sqft: data.field_21_living_sqft,
    parsed_listing_price: listingPrice,
    parsed_living_sqft: livingSqft
  });

  if (isNaN(listingPrice) || isNaN(livingSqft) || livingSqft === 0) {
    console.log('[calculatePricePerSqft] ❌ FAILED - Missing or invalid inputs');
    return null;
  }

  // RENTAL DETECTION: If listing price < $10,000, it's likely monthly rent, not sale price
  // Example: $2,700 rent / 595 sqft = $5/sqft is MEANINGLESS for rentals
  if (listingPrice < 10000) {
    console.log('[calculatePricePerSqft] ⚠️ SKIPPED - Detected rental property (price < $10k)');
    return null;
  }

  const value = Math.round((listingPrice / livingSqft) * 100) / 100;

  console.log('[calculatePricePerSqft] ✅ SUCCESS - Calculated:', value);

  return {
    value,
    source: 'Backend Calculation',
    confidence: 'High',
    calculation_method: 'listing_price / living_sqft'
  };
}

/**
 * Field 20: Total Bathrooms
 * Formula: full_bathrooms + (half_bathrooms * 0.5)
 */
export function calculateTotalBathrooms(data: PropertyData): CalculationResult | null {
  const fullRaw = parseNumericValue(data.field_18_full_bathrooms);
  const halfRaw = parseNumericValue(data.field_19_half_bathrooms);

  // If both are NaN, we have no data
  if (isNaN(fullRaw) && isNaN(halfRaw)) {
    return null;
  }

  const full = isNaN(fullRaw) ? 0 : fullRaw;
  const half = isNaN(halfRaw) ? 0 : halfRaw;
  const value = full + (half * 0.5);

  return {
    value,
    source: 'Backend Calculation',
    confidence: 'High',
    calculation_method: 'full_bathrooms + (half_bathrooms * 0.5)'
  };
}

/**
 * Field 29: Parking Total
 * Formula: garage_spaces + carport_spaces + assigned_parking
 */
export function calculateParkingTotal(data: PropertyData): CalculationResult | null {
  const garageRaw = parseNumericValue(data.field_28_garage_spaces);
  const carportRaw = parseNumericValue(data.field_140_carport_spaces);
  const assignedRaw = parseNumericValue(data.field_143_assigned_parking);

  const garage = isNaN(garageRaw) ? 0 : garageRaw;
  const carport = isNaN(carportRaw) ? 0 : carportRaw;
  const assigned = isNaN(assignedRaw) ? 0 : assignedRaw;

  if (garage === 0 && carport === 0 && assigned === 0) {
    return null;
  }

  const value = garage + carport + assigned;

  return {
    value,
    source: 'Backend Calculation',
    confidence: 'High',
    calculation_method: 'garage + carport + assigned'
  };
}

/**
 * Field 37: Property Tax Rate (%)
 * Formula: (annual_taxes / assessed_value) * 100
 */
export function calculatePropertyTaxRate(data: PropertyData): CalculationResult | null {
  const annualTaxes = parseNumericValue(data.field_35_annual_taxes);
  const assessedValue = parseNumericValue(data.field_15_assessed_value);

  if (isNaN(annualTaxes) || isNaN(assessedValue) || assessedValue === 0) {
    return null;
  }

  const value = Math.round(((annualTaxes / assessedValue) * 100) * 100) / 100;

  return {
    value,
    source: 'Backend Calculation',
    confidence: 'High',
    calculation_method: '(annual_taxes / assessed_value) * 100'
  };
}

/**
 * Field 40: Roof Age (Estimated)
 * Formula: current_year - roof_install_year
 */
export function calculateRoofAge(data: PropertyData): CalculationResult | null {
  const roofYear = parseNumericValue(data.permit_roof_year);

  if (isNaN(roofYear)) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const age = currentYear - roofYear;

  return {
    value: `${age} years (installed ${roofYear})`,
    source: 'Backend Calculation (from permits)',
    confidence: 'High',
    calculation_method: `${currentYear} - permit_year`
  };
}

/**
 * Field 46: HVAC Age
 * Formula: current_year - hvac_install_year
 */
export function calculateHVACAge(data: PropertyData): CalculationResult | null {
  const hvacYear = parseNumericValue(data.permit_hvac_year);

  if (isNaN(hvacYear)) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const age = currentYear - hvacYear;

  return {
    value: `${age} years (installed ${hvacYear})`,
    source: 'Backend Calculation (from permits)',
    confidence: 'High',
    calculation_method: `${currentYear} - permit_year`
  };
}

/**
 * Field 53: Primary BR Location
 * Logic: If fireplace_yn = "Yes", count = 1 (unless MLS provides exact count)
 */
export function calculateFireplaceCount(data: PropertyData, mlsFireplaceCount?: number): CalculationResult | null {
  if (data.field_52_fireplace_yn === 'No') {
    return {
      value: 0,
      source: 'Backend Logic',
      confidence: 'High',
      calculation_method: 'fireplace_yn = No'
    };
  }

  if (mlsFireplaceCount !== undefined) {
    return {
      value: mlsFireplaceCount,
      source: 'Stellar MLS',
      confidence: 'High'
    };
  }

  if (data.field_52_fireplace_yn === 'Yes') {
    return {
      value: 1,
      source: 'Backend Logic (estimated)',
      confidence: 'Medium',
      calculation_method: 'fireplace_yn = Yes, count assumed 1'
    };
  }

  return null;
}

/**
 * Field 101: Cap Rate (Est)
 * Formula: ((annual_rent - expenses) / listing_price) * 100
 * Expenses = annual_taxes + insurance + hoa_fee + (0.01 * listing_price) [maintenance estimate]
 */
export function calculateCapRate(data: PropertyData): CalculationResult | null {
  const listingPrice = parseNumericValue(data.field_10_listing_price);
  const rentalMonthly = parseNumericValue(data.field_98_rental_estimate_monthly);

  if (isNaN(listingPrice) || isNaN(rentalMonthly) || listingPrice === 0) {
    return null;
  }

  const annualRent = rentalMonthly * 12;

  // Calculate expenses - use 0 if not available
  const taxesRaw = parseNumericValue(data.field_35_annual_taxes);
  const insuranceRaw = parseNumericValue(data.field_97_insurance_annual);
  const hoaRaw = parseNumericValue(data.field_31_hoa_fee_annual);

  const taxes = isNaN(taxesRaw) ? 0 : taxesRaw;
  const insurance = isNaN(insuranceRaw) ? 0 : insuranceRaw;
  const hoa = isNaN(hoaRaw) ? 0 : hoaRaw;
  const maintenanceEstimate = listingPrice * 0.01; // 1% of property value

  const totalExpenses = taxes + insurance + hoa + maintenanceEstimate;
  const noi = annualRent - totalExpenses; // Net Operating Income

  const value = Math.round((noi / listingPrice * 100) * 100) / 100;

  return {
    value,
    source: 'Backend Calculation',
    confidence: 'Medium',
    calculation_method: '((annual_rent - expenses) / listing_price) * 100',
    missing_inputs: [
      ...(isNaN(taxesRaw) ? ['annual_taxes'] : []),
      ...(isNaN(insuranceRaw) ? ['insurance_estimate'] : [])
    ]
  };
}

/**
 * Field 93: Price to Rent Ratio
 * Formula: listing_price / (monthly_rent * 12)
 */
export function calculatePriceToRentRatio(data: PropertyData): CalculationResult | null {
  const listingPrice = parseNumericValue(data.field_10_listing_price);
  const rentalMonthly = parseNumericValue(data.field_98_rental_estimate_monthly);

  if (isNaN(listingPrice) || isNaN(rentalMonthly) || rentalMonthly === 0) {
    return null;
  }

  const annualRent = rentalMonthly * 12;
  const ratio = listingPrice / annualRent;
  const value = Math.round(ratio * 100) / 100;

  return {
    value,
    source: 'Backend Calculation',
    confidence: 'High',
    calculation_method: 'listing_price / (monthly_rent * 12)'
  };
}

/**
 * Field 94: Price vs Median Percent
 * Formula: ((listing_price - median_price) / median_price) * 100
 */
export function calculatePriceVsMedian(data: PropertyData): CalculationResult | null {
  const listingPrice = parseNumericValue(data.field_10_listing_price);
  const medianPrice = parseNumericValue(data.field_91_median_home_price_neighborhood);

  if (isNaN(listingPrice) || isNaN(medianPrice) || medianPrice === 0) {
    return null;
  }

  const percentDiff = ((listingPrice - medianPrice) / medianPrice) * 100;
  const value = Math.round(percentDiff * 100) / 100;

  return {
    value,
    source: 'Backend Calculation',
    confidence: 'High',
    calculation_method: '((listing_price - median_price) / median_price) * 100'
  };
}

/**
 * Field 99: Rental Yield Estimate (%)
 * Formula: (annual_rent / listing_price) * 100
 */
export function calculateRentalYield(data: PropertyData): CalculationResult | null {
  const rentalMonthly = parseNumericValue(data.field_98_rental_estimate_monthly);
  const listingPrice = parseNumericValue(data.field_10_listing_price);

  if (isNaN(rentalMonthly) || isNaN(listingPrice) || listingPrice === 0) {
    return null;
  }

  const annualRent = rentalMonthly * 12;
  const yield_pct = (annualRent / listingPrice) * 100;
  const value = Math.round(yield_pct * 100) / 100;

  return {
    value,
    source: 'Backend Calculation',
    confidence: 'High',
    calculation_method: '(annual_rent / listing_price) * 100'
  };
}

/**
 * Field 107: Average Water Bill (Monthly)
 * Formula based on Tampa Bay area water rates (City of Tampa rates, Oct 2025)
 *
 * Indoor usage: 60 gallons/person/day * 30.4 days
 * Outdoor usage (single-family only): Based on UF irrigation formula
 * Rates: Tiered pricing per CCF (100 cubic feet = 748 gallons)
 */
export function calculateWaterBill(data: PropertyData): CalculationResult | null {
  const livingSqft = parseNumericValue(data.field_21_living_sqft);
  const lotSizeSqft = parseNumericValue(data.field_23_lot_size_sqft);
  const propertyType = data.field_26_property_type || '';
  const hoaIncludes = data.field_33_hoa_includes || '';
  const poolYn = data.field_54_pool_yn || '';

  console.log('[calculateWaterBill] Inputs:', {
    living_sqft: livingSqft,
    lot_size_sqft: lotSizeSqft,
    property_type: propertyType,
    hoa_includes: hoaIncludes,
    pool_yn: poolYn
  });

  // Check if water is included in HOA
  if (hoaIncludes.toLowerCase().includes('water')) {
    console.log('[calculateWaterBill] ✅ Water included in HOA');
    return {
      value: '$0 (Included in HOA)',
      source: 'Backend Calculation',
      confidence: 'High',
      calculation_method: 'HOA includes water'
    };
  }

  // Need at least living_sqft to estimate occupants
  if (isNaN(livingSqft) || livingSqft <= 0) {
    console.log('[calculateWaterBill] ❌ FAILED - Missing living_sqft');
    return null;
  }

  // Determine if condo/townhouse (no irrigation) or single-family (has irrigation)
  const propertyTypeLower = propertyType.toLowerCase();
  const isCondoOrTownhouse = propertyTypeLower.includes('condo') ||
                              propertyTypeLower.includes('townhouse') ||
                              propertyTypeLower.includes('multi');

  // Estimate number of occupants based on home size (heuristic: sqft / 800)
  const numOccupants = Math.max(1, Math.round(livingSqft / 800));

  // Indoor usage: 60 gallons/person/day * 30.4 days/month
  const indoorGallons = numOccupants * 60 * 30.4;

  // Outdoor usage (single-family with yard only)
  let outdoorGallons = 0;
  if (!isCondoOrTownhouse && !isNaN(lotSizeSqft) && lotSizeSqft > 0) {
    // Yard size estimate: lot size minus building footprint (assume 1 story = living sqft)
    const estimatedYardSqft = Math.max(0, lotSizeSqft - (livingSqft * 0.4));

    if (estimatedYardSqft > 0) {
      // UF irrigation formula: gallons = 0.62337 * sqft * depth_inches / efficiency
      // depth_per_cycle = 0.5 inches, efficiency = 0.5, cycles_per_month = 4
      const gallonsPerCycle = 0.62337 * estimatedYardSqft * 0.5 / 0.5;
      outdoorGallons = gallonsPerCycle * 4;
    }
  }

  const totalGallons = indoorGallons + outdoorGallons;
  const ccf = totalGallons / 748; // Convert gallons to CCF (100 cubic feet)

  // Tampa rate structure (inside city, 5/8" meter)
  // Base charges: $8 water + $8 wastewater = $16
  const baseCharge = 16;

  // Water usage tiers (single-family, inside city)
  const tiers = [
    { limit: 5, rate: 3.55 },
    { limit: 8, rate: 4.14 },
    { limit: 13, rate: 6.96 },
    { limit: 20, rate: 9.28 },
    { limit: Infinity, rate: 10.71 }
  ];

  // Condo tiers are per-unit, but we assume 1 unit
  const condoTiers = [
    { limit: 2, rate: 3.55 },
    { limit: 4, rate: 4.14 },
    { limit: 6, rate: 6.96 },
    { limit: 9, rate: 9.28 },
    { limit: Infinity, rate: 10.71 }
  ];

  const activeTiers = isCondoOrTownhouse ? condoTiers : tiers;

  // Calculate tiered water cost
  let waterCost = 0;
  let remainingCcf = ccf;
  let prevLimit = 0;

  for (const tier of activeTiers) {
    const tierCcf = Math.min(remainingCcf, Math.max(0, tier.limit - prevLimit));
    waterCost += tierCcf * tier.rate;
    remainingCcf -= tierCcf;
    prevLimit = tier.limit;
    if (remainingCcf <= 0) break;
  }

  // Wastewater: flat rate per CCF
  const wastewaterRate = 5.79;
  const wastewaterCost = ccf * wastewaterRate;

  // Pool adds approximately $15-25/month
  let poolSurcharge = 0;
  if (poolYn.toLowerCase() === 'yes' || poolYn.toLowerCase() === 'true') {
    poolSurcharge = 20;
  }

  const totalBill = Math.round(baseCharge + waterCost + wastewaterCost + poolSurcharge);

  console.log('[calculateWaterBill] ✅ SUCCESS:', {
    occupants: numOccupants,
    indoor_gallons: Math.round(indoorGallons),
    outdoor_gallons: Math.round(outdoorGallons),
    total_ccf: ccf.toFixed(2),
    water_cost: waterCost.toFixed(2),
    wastewater_cost: wastewaterCost.toFixed(2),
    pool_surcharge: poolSurcharge,
    total_bill: totalBill
  });

  return {
    value: `$${totalBill}`,
    source: 'Backend Calculation (Tampa Rates)',
    confidence: 'Medium',
    calculation_method: `${numOccupants} occupants, ${Math.round(totalGallons)} gal/mo, ${ccf.toFixed(1)} CCF, Tampa tiered rates`
  };
}

/**
 * Field 55: Pool Type
 * Logic: If pool_yn = "No", return "N/A"
 */
export function calculatePoolType(data: PropertyData): CalculationResult | null {
  const poolYn = data.field_54_pool_yn;

  // Check for "No" or "false" as strings (boolean false would be stringified by the time it gets here)
  if (poolYn === 'No' || poolYn === 'false' || String(poolYn).toLowerCase() === 'false') {
    return {
      value: 'N/A',
      source: 'Backend Logic',
      confidence: 'High',
      calculation_method: 'pool_yn = No'
    };
  }

  return null; // Don't set if pool exists (let MLS/LLM provide type)
}

/**
 * Field 16: AVMs Average
 * Formula: Average of all available AVMs (16a-16f)
 */
export function calculateAVMsAverage(data: PropertyData): CalculationResult | null {
  const avms = [
    parseNumericValue(data.field_16a_zestimate),
    parseNumericValue(data.field_16b_redfin_estimate),
    parseNumericValue(data.field_16c_first_american_avm),
    parseNumericValue(data.field_16d_quantarium_avm),
    parseNumericValue(data.field_16e_ice_avm),
    parseNumericValue(data.field_16f_collateral_analytics_avm)
  ].filter(val => !isNaN(val));

  if (avms.length === 0) {
    return null;
  }

  const sum = avms.reduce((acc, val) => acc + val, 0);
  const average = sum / avms.length;
  const value = Math.round(average);

  return {
    value,
    source: 'Backend Calculation',
    confidence: 'High',
    calculation_method: `Average of ${avms.length} AVMs`
  };
}

/**
 * Field 173: Total Views
 * Formula: Sum of all portal views (169-172)
 */
export function calculateTotalViews(data: PropertyData): CalculationResult | null {
  const views = [
    parseNumericValue(data.field_169_zillow_views),
    parseNumericValue(data.field_170_redfin_views),
    parseNumericValue(data.field_171_homes_views),
    parseNumericValue(data.field_172_realtor_views)
  ].filter(val => !isNaN(val));

  if (views.length === 0) {
    return null;
  }

  const total = views.reduce((acc, val) => acc + val, 0);

  return {
    value: total,
    source: 'Backend Calculation',
    confidence: 'High',
    calculation_method: `Sum of ${views.length} portal views`
  };
}

/**
 * Calculate all derived fields at once
 */
export function calculateAllDerivedFields(data: PropertyData): Record<string, CalculationResult | null> {
  return {
    '11_price_per_sqft': calculatePricePerSqft(data),
    '16_avms': calculateAVMsAverage(data),
    '20_total_bathrooms': calculateTotalBathrooms(data),
    '29_parking_total': calculateParkingTotal(data),
    '37_property_tax_rate': calculatePropertyTaxRate(data),
    '40_roof_age_est': calculateRoofAge(data),
    '46_hvac_age': calculateHVACAge(data),
    // REMOVED 2026-01-08: Field 53 is Primary BR Location from MasterBedroomLevel, NOT calculated
    // '53_primary_br_location': calculateFireplaceCount(data), // WRONG - removed
    '55_pool_type': calculatePoolType(data),
    '93_price_to_rent_ratio': calculatePriceToRentRatio(data),
    '94_price_vs_median_percent': calculatePriceVsMedian(data),
    '99_rental_yield_est': calculateRentalYield(data),
    '101_cap_rate_est': calculateCapRate(data),
    '107_avg_water_bill': calculateWaterBill(data),
    '173_total_views': calculateTotalViews(data)
  };
}

/**
 * Example usage:
 *
 * const propertyData: PropertyData = {
 *   field_10_listing_price: 1250000,
 *   field_21_living_sqft: 1992,
 *   field_18_full_bathrooms: 2,
 *   field_19_half_bathrooms: 1,
 *   field_35_annual_taxes: 7426,
 *   field_15_assessed_value: 1100000,
 *   field_98_rental_estimate_monthly: 3800,
 *   field_91_median_home_price: 715000
 * };
 *
 * const results = calculateAllDerivedFields(propertyData);
 * // Returns:
 * // {
 * //   '11_price_per_sqft': { value: 627.51, source: 'Backend Calculation', confidence: 'High' },
 * //   '20_total_bathrooms': { value: 2.5, source: 'Backend Calculation', confidence: 'High' },
 * //   '93_price_to_rent_ratio': { value: 27.41, source: 'Backend Calculation', confidence: 'Medium' },
 * //   ...
 * // }
 */
