/**
 * CLUES Property Dashboard - Automated Field Calculations
 *
 * This module automatically calculates derived fields from existing property data.
 * Calculations run after LLM enrichment to fill data gaps with high-confidence values.
 *
 * Coverage Areas: Pinellas, Hillsborough, Manatee, Polk, Pasco, Hernando Counties (FL)
 */

import type { Property as FullProperty } from '@/types/property';

/**
 * Calculate investment and financial metrics from existing data
 */
export function calculateDerivedFinancialFields(property: FullProperty): Partial<FullProperty> {
  const derived: any = { financial: {}, details: {}, address: {} };

  const listingPrice = property.address?.listingPrice?.value;
  const rentalMonthly = property.financial?.rentalEstimateMonthly?.value;
  const medianPrice = property.financial?.medianHomePriceNeighborhood?.value;
  const annualTaxes = property.details?.annualTaxes?.value;
  const insurance = property.financial?.insuranceEstAnnual?.value;
  const hoaFee = property.details?.hoaFeeAnnual?.value;
  const livingSqft = property.details?.livingSqft?.value;

  // Field 11: Price Per Sq Ft (if not already present or low confidence)
  if (listingPrice && livingSqft && (!property.address?.pricePerSqft?.value || property.address?.pricePerSqft?.confidence === 'Low')) {
    const pricePerSqft = listingPrice / livingSqft;
    derived.address.pricePerSqft = {
      value: Math.round(pricePerSqft),
      confidence: 'High',
      notes: 'Auto-calculated: Listing Price ÷ Living Sq Ft',
      sources: ['Auto-Calculated'],
      llmSources: ['Auto-Calculated'],
      validationStatus: 'valid'
    };
  }

  // Field 20: Total Bathrooms (if not already present)
  const fullBaths = property.details?.fullBathrooms?.value;
  const halfBaths = property.details?.halfBathrooms?.value;
  if ((fullBaths || halfBaths) && !property.details?.totalBathrooms?.value) {
    const totalBaths = (fullBaths || 0) + ((halfBaths || 0) * 0.5);
    derived.details.totalBathrooms = {
      value: totalBaths,
      confidence: 'High',
      notes: 'Auto-calculated: Full Baths + (Half Baths × 0.5)',
      sources: ['Auto-Calculated'],
      llmSources: ['Auto-Calculated'],
      validationStatus: 'valid'
    };
  }

  // Field 24: Lot Size (Acres) - if sqft is available
  const lotSizeSqft = property.details?.lotSizeSqft?.value;
  if (lotSizeSqft && !property.details?.lotSizeAcres?.value) {
    const acres = lotSizeSqft / 43560; // 1 acre = 43,560 square feet
    derived.details.lotSizeAcres = {
      value: parseFloat(acres.toFixed(2)),
      confidence: 'High',
      notes: 'Auto-calculated: Lot Size Sq Ft ÷ 43,560. Standard acre conversion.',
      sources: ['Auto-Calculated'],
      llmSources: ['Auto-Calculated'],
      validationStatus: 'valid'
    };
  }

  // Field 93: Price to Rent Ratio
  if (listingPrice && rentalMonthly) {
    const priceToRent = listingPrice / (rentalMonthly * 12);
    derived.financial.priceToRentRatio = {
      value: priceToRent.toFixed(2),
      confidence: 'High',
      notes: 'Auto-calculated: Listing Price ÷ (Monthly Rent × 12). Lower is better for investors (15-20 = excellent, 21-30 = good, >30 = poor rental market)',
      sources: ['Auto-Calculated'],
      llmSources: ['Auto-Calculated'],
      validationStatus: 'valid'
    };
  }

  // Field 94: Price vs Median %
  if (listingPrice && medianPrice) {
    const variance = ((listingPrice - medianPrice) / medianPrice) * 100;
    derived.financial.priceVsMedianPercent = {
      value: variance.toFixed(2),
      confidence: 'High',
      notes: `Auto-calculated: ((Listing - Median) ÷ Median) × 100. This property is ${variance > 0 ? variance.toFixed(1) + '% ABOVE' : Math.abs(variance).toFixed(1) + '% BELOW'} neighborhood median`,
      sources: ['Auto-Calculated'],
      llmSources: ['Auto-Calculated'],
      validationStatus: 'valid'
    };
  }

  // Field 99: Rental Yield (Est)
  if (listingPrice && rentalMonthly) {
    const yieldPct = ((rentalMonthly * 12) / listingPrice) * 100;
    derived.financial.rentalYieldEst = {
      value: parseFloat(yieldPct.toFixed(2)),
      confidence: 'High',
      notes: 'Auto-calculated: (Annual Rent ÷ Listing Price) × 100. Good rental yields: 5-8% (strong), 3-5% (moderate), <3% (weak)',
      sources: ['Auto-Calculated'],
      llmSources: ['Auto-Calculated'],
      validationStatus: 'valid'
    };
  }

  // Field 101: Cap Rate (Est)
  if (listingPrice && rentalMonthly) {
    const annualRent = rentalMonthly * 12;

    // Estimate operating expenses (common rule: 50% of rent, or itemize if we have data)
    const operatingExpenses =
      (annualTaxes || 0) +
      (insurance || 0) +
      (hoaFee || 0) +
      (listingPrice * 0.01); // 1% maintenance estimate (standard assumption)

    const noi = annualRent - operatingExpenses; // Net Operating Income
    const capRate = (noi / listingPrice) * 100;

    const expenseBreakdown = [
      annualTaxes ? `Taxes: $${annualTaxes.toLocaleString()}` : null,
      insurance ? `Insurance: $${insurance.toLocaleString()}` : null,
      hoaFee ? `HOA: $${hoaFee.toLocaleString()}` : null,
      `Maintenance (1%): $${(listingPrice * 0.01).toLocaleString()}`
    ].filter(Boolean).join(', ');

    derived.financial.capRateEst = {
      value: parseFloat(capRate.toFixed(2)),
      confidence: 'Medium',
      notes: `Auto-calculated: (Annual Rent $${annualRent.toLocaleString()} - Operating Expenses $${operatingExpenses.toLocaleString()}) ÷ Price. Expenses: ${expenseBreakdown}. Good cap rates: 8-12% (excellent), 5-8% (good), <5% (appreciation play)`,
      sources: ['Auto-Calculated'],
      llmSources: ['Auto-Calculated'],
      validationStatus: 'valid'
    };
  }

  // Field 16: Average AVM - Calculate from individual AVM subfields (16a-16f)
  const avmSources = [
    { name: 'Zillow Zestimate', value: property.financial?.zestimate?.value },
    { name: 'Redfin Estimate', value: property.financial?.redfinEstimate?.value },
    { name: 'First American', value: property.financial?.firstAmericanAvm?.value },
    { name: 'Quantarium', value: property.financial?.quantariumAvm?.value },
    { name: 'ICE', value: property.financial?.iceAvm?.value },
    { name: 'Collateral Analytics', value: property.financial?.collateralAnalyticsAvm?.value },
  ].filter(s => s.value !== null && s.value !== undefined && typeof s.value === 'number' && s.value > 0);

  if (avmSources.length > 0 && !property.financial?.avms?.value) {
    const sum = avmSources.reduce((a, b) => a + (b.value as number), 0);
    const avgAvm = Math.round(sum / avmSources.length);
    const sourceNames = avmSources.map(s => s.name).join(', ');

    derived.financial.avms = {
      value: avgAvm,
      confidence: avmSources.length >= 3 ? 'High' : 'Medium',
      notes: `Auto-calculated: Average of ${avmSources.length} AVM sources (${sourceNames}). Individual values: ${avmSources.map(s => `${s.name}: ${(s.value as number).toLocaleString()}`).join(', ')}`,
      sources: ['Auto-Calculated'],
      llmSources: ['Auto-Calculated'],
      validationStatus: 'valid'
    };
  }

  return derived;
}

/**
 * Apply Florida-specific regional defaults for environmental risk fields
 * Covers: Pinellas, Hillsborough, Manatee, Polk, Pasco, Hernando Counties
 */
export function applyFloridaDefaults(property: FullProperty): Partial<FullProperty> {
  const defaults: any = { utilities: {}, structural: {} };

  // Field 122: Wildfire Risk - All coverage counties have minimal wildfire risk
  if (!property.utilities?.wildfireRisk?.value) {
    defaults.utilities.wildfireRisk = {
      value: 'Very Low',
      confidence: 'High',
      notes: 'Florida regional default - minimal wildfire risk in Pinellas, Hillsborough, Manatee, Polk, Pasco, Hernando counties',
      sources: ['Regional Default - FL'],
      llmSources: ['Regional Default - FL'],
      validationStatus: 'valid'
    };
  }

  // Field 123: Earthquake Risk - Florida has no significant seismic activity
  if (!property.utilities?.earthquakeRisk?.value) {
    defaults.utilities.earthquakeRisk = {
      value: 'Negligible',
      confidence: 'High',
      notes: 'Florida regional default - no seismic activity in state',
      sources: ['Regional Default - FL'],
      llmSources: ['Regional Default - FL'],
      validationStatus: 'valid'
    };
  }

  // Field 124: Hurricane Risk - All coverage counties are high-risk coastal/near-coastal
  if (!property.utilities?.hurricaneRisk?.value) {
    defaults.utilities.hurricaneRisk = {
      value: 'High',
      confidence: 'High',
      notes: 'Florida regional default - all coverage counties (Pinellas, Hillsborough, Manatee, Polk, Pasco, Hernando) have high hurricane exposure due to Gulf Coast location',
      sources: ['Regional Default - FL'],
      llmSources: ['Regional Default - FL'],
      validationStatus: 'valid'
    };
  }

  // Field 42: Foundation - 90%+ of Florida homes have slab foundations (no basements)
  if (!property.structural?.foundation?.value) {
    defaults.structural.foundation = {
      value: 'Slab',
      confidence: 'Medium',
      notes: 'Florida regional default - 90%+ of homes have slab foundations (high water table prevents basements)',
      sources: ['Regional Default - FL'],
      llmSources: ['Regional Default - FL'],
      validationStatus: 'valid'
    };
  }

  return defaults;
}

/**
 * Apply property-type-specific defaults for Single Family Homes
 */
export function applySingleFamilyDefaults(property: FullProperty): Partial<FullProperty> {
  const propertyType = property.details?.propertyType?.value?.toLowerCase() || '';

  if (propertyType.includes('single family') || propertyType.includes('single-family')) {
    const defaults: any = { stellarMLS: { building: {} } };

    // Field 144: Floor Number - Not applicable to single family homes
    if (!property.stellarMLS?.building?.floorNumber?.value) {
      defaults.stellarMLS.building.floorNumber = {
        value: 'N/A',
        confidence: 'High',
        notes: 'Property type default - single-family homes do not have floor numbers',
        sources: ['Property Type Default'],
        llmSources: ['Property Type Default'],
        validationStatus: 'valid'
      };
    }

    // Field 145: Building Total Floors - Use stories count if available, otherwise N/A
    if (!property.stellarMLS?.building?.buildingTotalFloors?.value) {
      const stories = property.details?.stories?.value;
      defaults.stellarMLS.building.buildingTotalFloors = {
        value: stories || 'N/A',
        confidence: stories ? 'High' : 'Medium',
        notes: stories
          ? 'Property type default - using stories count for single-family home'
          : 'Property type default - single-family homes typically 1-2 stories',
        sources: ['Property Type Default'],
        llmSources: ['Property Type Default'],
        validationStatus: 'valid'
      };
    }

    // Field 147: Building Elevator - Single family homes don't have elevators
    if (!property.stellarMLS?.building?.buildingElevatorYn?.value) {
      defaults.stellarMLS.building.buildingElevatorYn = {
        value: 'No',
        confidence: 'High',
        notes: 'Property type default - single-family homes do not have building elevators',
        sources: ['Property Type Default'],
        llmSources: ['Property Type Default'],
        validationStatus: 'valid'
      };
    }

    // Field 148: Floors in Unit - Use stories count
    if (!property.stellarMLS?.building?.floorsInUnit?.value) {
      const stories = property.details?.stories?.value;
      defaults.stellarMLS.building.floorsInUnit = {
        value: stories || 1,
        confidence: stories ? 'High' : 'Medium',
        notes: stories
          ? 'Property type default - using stories count for single-family home'
          : 'Property type default - assuming 1-story single-family home',
        sources: ['Property Type Default'],
        llmSources: ['Property Type Default'],
        validationStatus: 'valid'
      };
    }

    return defaults;
  }

  return {};
}

/**
 * Apply property age-based inferences for structural components
 */
export function applyAgeBasedDefaults(property: FullProperty): Partial<FullProperty> {
  const defaults: any = { structural: {} };
  const yearBuilt = property.details?.yearBuilt?.value;
  const currentYear = new Date().getFullYear();

  if (!yearBuilt) return defaults;

  const propertyAge = currentYear - yearBuilt;

  // Field 40: Roof Age (Est) - if no permit data available
  const roofPermit = property.structural?.permitHistoryRoof?.value;
  if (!property.structural?.roofAgeEst?.value && !roofPermit) {
    // Florida roofs typically last 15-25 years (shingle) or 40+ (metal/tile)
    // Assume replacement if > 20 years old, otherwise use building age
    const estimatedRoofAge = propertyAge > 20 ? '15-20 years (estimated replacement)' : `${propertyAge} years (original)`;

    defaults.structural.roofAgeEst = {
      value: estimatedRoofAge,
      confidence: 'Low',
      notes: `Estimated based on building age (${yearBuilt}). Florida roofs typically need replacement every 15-25 years. Verify with inspection or permit records.`,
      sources: ['Age-Based Estimate'],
      llmSources: ['Age-Based Estimate'],
      validationStatus: 'warning'
    };
  }

  // Field 46: HVAC Age - if no permit data available
  const hvacPermit = property.structural?.permitHistoryHvac?.value;
  if (!property.structural?.hvacAge?.value && !hvacPermit) {
    // Florida HVAC systems typically last 10-15 years
    const estimatedHvacAge = propertyAge > 15 ? '8-12 years (estimated replacement)' : `${propertyAge} years (original)`;

    defaults.structural.hvacAge = {
      value: estimatedHvacAge,
      confidence: 'Low',
      notes: `Estimated based on building age (${yearBuilt}). Florida HVAC systems typically need replacement every 10-15 years due to heavy use. Verify with inspection or permit records.`,
      sources: ['Age-Based Estimate'],
      llmSources: ['Age-Based Estimate'],
      validationStatus: 'warning'
    };
  }

  // Field 48: Interior Condition - rough estimate based on age and renovation data
  if (!property.structural?.interiorCondition?.value) {
    const hasRenovations = property.structural?.recentRenovations?.value;

    let condition = 'Fair';
    let conditionNote = '';

    if (hasRenovations) {
      condition = 'Good to Excellent';
      conditionNote = 'Property has documented renovations';
    } else if (propertyAge < 10) {
      condition = 'Excellent';
      conditionNote = 'Recently built property';
    } else if (propertyAge < 30) {
      condition = 'Good';
      conditionNote = 'Mid-age property, likely original condition';
    } else {
      condition = 'Fair to Good';
      conditionNote = 'Older property - may have original fixtures/finishes, verify with inspection';
    }

    defaults.structural.interiorCondition = {
      value: condition,
      confidence: 'Low',
      notes: `Estimated based on building age (${yearBuilt}, ${propertyAge} years old). ${conditionNote}. Actual condition varies - verify with photos and inspection.`,
      sources: ['Age-Based Estimate'],
      llmSources: ['Age-Based Estimate'],
      validationStatus: 'warning'
    };
  }

  return defaults;
}

/**
 * Normalize bi-monthly utility bills to monthly
 * Field 107: Water bill - FL utilities bill bi-monthly (every 2 months)
 * If value > 120, assume it's bi-monthly and divide by 2
 */
function normalizeWaterBill(property: FullProperty): Partial<FullProperty> {
  const defaults: any = { utilities: {} };

  const waterBillField = property.utilities?.avgWaterBill;
  if (!waterBillField?.value) return defaults;

  let rawValue = waterBillField.value;
  let numericValue: number;

  // Parse string values like "$857" or "857" to numbers
  if (typeof rawValue === 'number') {
    numericValue = rawValue;
  } else if (typeof rawValue === 'string') {
    const cleaned = rawValue.replace(/[$,\s]/g, '').trim();
    numericValue = parseFloat(cleaned);
  } else {
    return defaults;
  }

  if (isNaN(numericValue) || numericValue <= 0) return defaults;

  // FL water bills: if > 120, assume bi-monthly and divide by 2
  // Typical monthly water bill is $40-80
  if (numericValue > 120) {
    const monthly = Math.round(numericValue / 2);
    console.log(`[FIELD-CALC] 🔄 WATER BILL: $${numericValue} bi-monthly → $${monthly}/month`);

    defaults.utilities.avgWaterBill = {
      value: `$${monthly}`,
      confidence: waterBillField.confidence || 'Medium',
      notes: `Normalized from bi-monthly $${numericValue} to monthly $${monthly}`,
      sources: waterBillField.sources || ['Normalized'],
      llmSources: waterBillField.llmSources || [],
      validationStatus: 'valid'
    };
  }

  return defaults;
}

/**
 * MASTER FUNCTION: Apply all automated calculations and defaults
 * This runs after LLM enrichment to fill data gaps
 */
export function enrichWithCalculatedFields(property: FullProperty): FullProperty {
  console.log('[FIELD-CALC] Running automated field calculations...');

  // Run all calculation modules
  const financial = calculateDerivedFinancialFields(property);
  const floridaDefaults = applyFloridaDefaults(property);
  const propertyTypeDefaults = applySingleFamilyDefaults(property);
  const ageDefaults = applyAgeBasedDefaults(property);
  const waterBillNormalized = normalizeWaterBill(property);

  // Deep merge - preserve existing values, only fill gaps
  const enriched: FullProperty = {
    ...property,
    address: { ...property.address, ...financial.address },
    details: { ...property.details, ...financial.details },
    financial: { ...property.financial, ...financial.financial },
    utilities: { ...property.utilities, ...floridaDefaults.utilities, ...waterBillNormalized.utilities },
    structural: { ...property.structural, ...floridaDefaults.structural, ...ageDefaults.structural },
    stellarMLS: property.stellarMLS ? {
      ...property.stellarMLS,
      building: property.stellarMLS.building ? {
        ...property.stellarMLS.building,
        ...(propertyTypeDefaults.stellarMLS?.building || {})
      } : (propertyTypeDefaults.stellarMLS?.building || property.stellarMLS.building)
    } : property.stellarMLS
  };

  // Count how many fields were auto-calculated
  const calculatedFields = [
    ...Object.keys(financial.address || {}),
    ...Object.keys(financial.details || {}),
    ...Object.keys(financial.financial || {}),
    ...Object.keys(floridaDefaults.utilities || {}),
    ...Object.keys(floridaDefaults.structural || {}),
    ...Object.keys(propertyTypeDefaults.stellarMLS?.building || {}),
    ...Object.keys(ageDefaults.structural || {}),
    ...Object.keys(waterBillNormalized.utilities || {})
  ];

  console.log(`[FIELD-CALC] ✅ Auto-calculated ${calculatedFields.length} fields:`, calculatedFields);

  return enriched;
}

/**
 * Helper: Check if a field value was auto-calculated
 */
export function isCalculatedField(fieldData: any): boolean {
  if (!fieldData || !fieldData.sources) return false;

  const calculatedSources = [
    'Auto-Calculated',
    'Regional Default - FL',
    'Property Type Default',
    'Age-Based Estimate'
  ];

  return fieldData.sources.some((source: string) =>
    calculatedSources.includes(source)
  );
}

/**
 * Helper: Get calculation badge label for UI
 */
export function getCalculationBadge(fieldData: any): string | null {
  if (!fieldData || !fieldData.sources) return null;

  if (fieldData.sources.includes('Auto-Calculated')) return 'Calculated';
  if (fieldData.sources.includes('Regional Default - FL')) return 'FL Default';
  if (fieldData.sources.includes('Property Type Default')) return 'Type Default';
  if (fieldData.sources.includes('Age-Based Estimate')) return 'Estimated';

  return null;
}
