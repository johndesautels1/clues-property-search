/**
 * Calculation Engine for Derived Fields
 * All mathematical field calculations happen here (not in LLMs)
 * Pattern: Null-safe math, return NULL if inputs missing
 */

export interface PropertyData {
  // Input fields for calculations
  field_10_listing_price?: number;
  field_15_assessed_value?: number;
  field_18_full_bathrooms?: number;
  field_19_half_bathrooms?: number;
  field_21_living_sqft?: number;
  field_28_garage_spaces?: number;
  field_31_hoa_fee_annual?: number;
  field_35_annual_taxes?: number;
  field_52_fireplace_yn?: string;
  field_91_median_home_price?: number;
  field_97_insurance_annual?: number;
  field_98_rental_estimate_monthly?: number;
  field_140_carport_spaces?: number;
  field_143_assigned_parking?: number;

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
 * Field 11: Price Per Square Foot
 * Formula: listing_price / living_sqft
 */
export function calculatePricePerSqft(data: PropertyData): CalculationResult | null {
  if (!data.field_10_listing_price || !data.field_21_living_sqft || data.field_21_living_sqft === 0) {
    return null;
  }

  const value = Math.round((data.field_10_listing_price / data.field_21_living_sqft) * 100) / 100;

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
  if (data.field_18_full_bathrooms === undefined && data.field_19_half_bathrooms === undefined) {
    return null;
  }

  const full = data.field_18_full_bathrooms || 0;
  const half = data.field_19_half_bathrooms || 0;
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
  const garage = data.field_28_garage_spaces || 0;
  const carport = data.field_140_carport_spaces || 0;
  const assigned = data.field_143_assigned_parking || 0;

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
  if (!data.field_35_annual_taxes || !data.field_15_assessed_value || data.field_15_assessed_value === 0) {
    return null;
  }

  const value = Math.round(((data.field_35_annual_taxes / data.field_15_assessed_value) * 100) * 100) / 100;

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
  if (!data.permit_roof_year) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const age = currentYear - data.permit_roof_year;

  return {
    value: `${age} years (installed ${data.permit_roof_year})`,
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
  if (!data.permit_hvac_year) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const age = currentYear - data.permit_hvac_year;

  return {
    value: `${age} years (installed ${data.permit_hvac_year})`,
    source: 'Backend Calculation (from permits)',
    confidence: 'High',
    calculation_method: `${currentYear} - permit_year`
  };
}

/**
 * Field 53: Fireplace Count
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
 * Field 93: Price to Rent Ratio
 * Formula: listing_price / (rental_estimate * 12)
 */
export function calculatePriceToRentRatio(data: PropertyData): CalculationResult | null {
  if (!data.field_10_listing_price || !data.field_98_rental_estimate_monthly || data.field_98_rental_estimate_monthly === 0) {
    return null;
  }

  const value = Math.round((data.field_10_listing_price / (data.field_98_rental_estimate_monthly * 12)) * 100) / 100;

  return {
    value,
    source: 'Backend Calculation',
    confidence: 'Medium',
    calculation_method: 'listing_price / (monthly_rent * 12)',
    missing_inputs: !data.field_98_rental_estimate_monthly ? ['rental_estimate'] : []
  };
}

/**
 * Field 94: Price vs Median %
 * Formula: ((listing_price - median_price) / median_price) * 100
 */
export function calculatePriceVsMedian(data: PropertyData): CalculationResult | null {
  if (!data.field_10_listing_price || !data.field_91_median_home_price || data.field_91_median_home_price === 0) {
    return null;
  }

  const value = Math.round((((data.field_10_listing_price - data.field_91_median_home_price) / data.field_91_median_home_price) * 100) * 100) / 100;

  return {
    value,
    source: 'Backend Calculation',
    confidence: 'Medium',
    calculation_method: '((listing_price - median) / median) * 100',
    missing_inputs: !data.field_91_median_home_price ? ['median_home_price'] : []
  };
}

/**
 * Field 99: Rental Yield (Est)
 * Formula: (rental_estimate * 12) / listing_price * 100
 */
export function calculateRentalYield(data: PropertyData): CalculationResult | null {
  if (!data.field_10_listing_price || !data.field_98_rental_estimate_monthly || data.field_10_listing_price === 0) {
    return null;
  }

  const value = Math.round(((data.field_98_rental_estimate_monthly * 12) / data.field_10_listing_price * 100) * 100) / 100;

  return {
    value,
    source: 'Backend Calculation',
    confidence: 'Medium',
    calculation_method: '(monthly_rent * 12) / listing_price * 100',
    missing_inputs: !data.field_98_rental_estimate_monthly ? ['rental_estimate'] : []
  };
}

/**
 * Field 101: Cap Rate (Est)
 * Formula: ((annual_rent - expenses) / listing_price) * 100
 * Expenses = annual_taxes + insurance + hoa_fee + (0.01 * listing_price) [maintenance estimate]
 */
export function calculateCapRate(data: PropertyData): CalculationResult | null {
  if (!data.field_10_listing_price || !data.field_98_rental_estimate_monthly || data.field_10_listing_price === 0) {
    return null;
  }

  const annualRent = data.field_98_rental_estimate_monthly * 12;

  // Calculate expenses
  const taxes = data.field_35_annual_taxes || 0;
  const insurance = data.field_97_insurance_annual || 0;
  const hoa = data.field_31_hoa_fee_annual || 0;
  const maintenanceEstimate = data.field_10_listing_price * 0.01; // 1% of property value

  const totalExpenses = taxes + insurance + hoa + maintenanceEstimate;
  const noi = annualRent - totalExpenses; // Net Operating Income

  const value = Math.round((noi / data.field_10_listing_price * 100) * 100) / 100;

  return {
    value,
    source: 'Backend Calculation',
    confidence: 'Medium',
    calculation_method: '((annual_rent - expenses) / listing_price) * 100',
    missing_inputs: [
      ...(!data.field_35_annual_taxes ? ['annual_taxes'] : []),
      ...(!data.field_97_insurance_annual ? ['insurance_estimate'] : [])
    ]
  };
}

/**
 * Calculate all derived fields at once
 */
export function calculateAllDerivedFields(data: PropertyData): Record<string, CalculationResult | null> {
  return {
    '11_price_per_sqft': calculatePricePerSqft(data),
    '20_total_bathrooms': calculateTotalBathrooms(data),
    '29_parking_total': calculateParkingTotal(data),
    '37_property_tax_rate': calculatePropertyTaxRate(data),
    '40_roof_age_est': calculateRoofAge(data),
    '46_hvac_age': calculateHVACAge(data),
    '53_fireplace_count': calculateFireplaceCount(data),
    '93_price_to_rent_ratio': calculatePriceToRentRatio(data),
    '94_price_vs_median_percent': calculatePriceVsMedian(data),
    '99_rental_yield_est': calculateRentalYield(data),
    '101_cap_rate_est': calculateCapRate(data)
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
