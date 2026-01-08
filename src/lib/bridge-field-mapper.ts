/**
 * Bridge Interactive API to CLUES Schema Field Mapper
 * Maps RESO Web API fields from Bridge Interactive to our 181-field schema
 * SOURCE OF TRUTH: src/types/fields-schema.ts
 *
 * Updated: 2025-01-05
 * - Added Field 31 subfields (31A-31F) for proper fee handling
 * - Integrated fee-normalizer for bidirectional monthly/annual conversion
 * - Condo vs HOA fee detection
 */

import type { BridgeProperty } from './bridge-api-client.js';
import {
  normalizeFeeFrequency,
  annualizeFee,
  monthlyizeFee,
  isCondoLike,
  normalizeSpecialSaleType,
} from './fee-normalizer.js';

export interface MappedField {
  value: any;
  source: string;
  confidence: 'High' | 'Medium-High' | 'Medium' | 'Low';
}

export interface MappedPropertyData {
  fields: Record<string, MappedField>;
  rawData?: BridgeProperty;
  mappedCount: number;
  unmappedCount: number;
  publicRemarks?: string;           // Original full remarks
  publicRemarksExtracted?: string;  // Remarks with extracted data removed
}

/**
 * Convert HOA fee to annual if frequency is provided
 */
function convertToAnnualHOA(fee: number, frequency?: string): number {
  if (!frequency) return fee;

  const freq = frequency.toLowerCase();
  if (freq.includes('month')) return fee * 12;
  if (freq.includes('quarter')) return fee * 4;
  if (freq.includes('week')) return fee * 52;
  if (freq.includes('year') || freq.includes('annual')) return fee;

  // Default to monthly if unclear
  return fee * 12;
}

/**
 * Parse interior condition from PublicRemarks text
 * Returns: 'Excellent' | 'Good' | 'Average' | 'Fair' | 'Poor' | undefined
 * Priority: Excellent > Good > Average > Fair > Poor
 */
function parseInteriorConditionFromRemarks(remarks: string): string | undefined {
  // Normalize the text
  const text = remarks.toLowerCase();

  // Check for 'Excellent' indicators (highest priority after renovated)
  const excellentPatterns = [
    /pristine/i,
    /immaculate/i,
    /impeccable/i,
    /flawless/i,
    /mint condition/i,
    /excellent/i,
    /like new/i,
    /showroom/i,
    /meticulously maintained/i,
    /completely renovated/i,
    /fully renovated/i,
    /total renovation/i,
    /gut renovated/i,
    /brand new interior/i,
    /recently renovated/i,
    /just renovated/i,
    /new construction/i,
    /newly built/i,
    /top of the line/i,
    /highest quality/i,
    /luxury finishes/i,
    /designer finishes/i,
    /custom built/i,
    /stunning/i,
    /breathtaking/i
  ];
  if (excellentPatterns.some(pattern => pattern.test(remarks))) {
    return 'Excellent';
  }

  // Check for 'Poor' indicators (check early to avoid false positives from "good" in "not good")
  const poorPatterns = [
    /poor condition/i,
    /needs significant/i,
    /major repairs needed/i,
    /extensive work/i,
    /tear down/i,
    /uninhabitable/i,
    /condemned/i,
    /fire damage/i,
    /flood damage/i,
    /mold/i,
    /structural issues/i,
    /foundation problems/i,
    /not livable/i
  ];
  if (poorPatterns.some(pattern => pattern.test(remarks))) {
    return 'Poor';
  }

  // Check for 'Fair' indicators (below average but livable)
  const fairPatterns = [
    /fair condition/i,
    /needs work/i,
    /needs repair/i,
    /fixer.*upper/i,
    /handyman.*special/i,
    /as.*is/i,
    /\btlc\b/i,
    /rehab/i,
    /distressed/i,
    /dated interior/i,
    /needs updating/i,
    /cosmetic work needed/i,
    /some updating/i,
    /could use/i,
    /investor special/i,
    /bring your vision/i,
    /make it your own/i
  ];
  if (fairPatterns.some(pattern => pattern.test(remarks))) {
    return 'Fair';
  }

  // Check for 'Good' indicators
  const goodPatterns = [
    /good condition/i,
    /well maintained/i,
    /well kept/i,
    /move.*in.*ready/i,
    /turn.*key/i,
    /great condition/i,
    /nice condition/i,
    /clean and bright/i,
    /spacious/i,
    /updated/i,
    /modern/i,
    /beautiful/i,
    /charming/i,
    /cozy/i,
    /comfortable/i,
    /bright and airy/i
  ];
  if (goodPatterns.some(pattern => pattern.test(remarks))) {
    return 'Good';
  }

  // Check for 'Average' indicators
  const averagePatterns = [
    /average condition/i,
    /solid home/i,
    /functional/i,
    /livable/i,
    /typical/i,
    /standard/i,
    /adequate/i,
    /satisfactory/i
  ];
  if (averagePatterns.some(pattern => pattern.test(remarks))) {
    return 'Average';
  }

  // If no keywords found, return undefined (let other sources determine)
  return undefined;
}

/**
 * Map Bridge Interactive RESO property to CLUES schema
 */
export function mapBridgePropertyToSchema(property: BridgeProperty): MappedPropertyData {
  const fields: Record<string, MappedField> = {};
  let mappedCount = 0;
  let unmappedCount = 0;

  const source = 'Stellar MLS';

  // Helper to add field
  const addField = (key: string, value: any, confidence: 'High' | 'Medium-High' | 'Medium' | 'Low' = 'High') => {
    if (value !== null && value !== undefined && value !== '') {
      fields[key] = { value, source, confidence };
      mappedCount++;
    }
  };

  // ================================================================
  // GROUP 1: Address & Identity (Fields 1-9)
  // ================================================================

  // CRITICAL FIX: Construct full address from components (UnparsedAddress is often incomplete)
  // Example: UnparsedAddress = "12609 130TH STREET" (missing city/state/zip)
  // Need: "12609 130TH STREET, LARGO, FL 33774" for geocoding to work
  const streetAddress = property.UnparsedAddress ||
                       [property.StreetNumber, property.StreetName].filter(Boolean).join(' ');
  const cityStateZip = [
    property.City,
    [property.StateOrProvince, property.PostalCode].filter(Boolean).join(' ')
  ].filter(Boolean).join(', ');

  const fullAddress = [streetAddress, cityStateZip].filter(Boolean).join(', ');
  addField('1_full_address', fullAddress);
  addField('2_mls_primary', property.ListingId || property.ListingKey);
  addField('4_listing_status', property.StandardStatus || property.MlsStatus);
  addField('5_listing_date', property.ListingContractDate || property.OnMarketDate);
  addField('6_neighborhood', property.SubdivisionName);
  addField('7_county', property.County);
  addField('8_zip_code', property.PostalCode);
  addField('9_parcel_id', property.ParcelNumber);

  // ================================================================
  // GROUP 2: Pricing & Value (Fields 10-16)
  // ================================================================
  addField('10_listing_price', property.ListPrice);

  // Field 11: Price per sqft - Use MLS-provided value (LP/SqFt) if available
  // MLS provides this as ListPricePerSquareFoot - it's authoritative!
  // Only fall back to backend calculation if MLS doesn't provide it
  if (property.ListPricePerSquareFoot) {
    addField('11_price_per_sqft', Math.round(property.ListPricePerSquareFoot * 100) / 100);
  }
  // Note: Backend will calculate if this is still missing after all sources

  addField('13_last_sale_date', property.CloseDate);
  addField('14_last_sale_price', property.ClosePrice);

  // Field 15: Assessed Value
  if (property.TaxAssessedValue) {
    addField('15_assessed_value', property.TaxAssessedValue);
  }

  // Field 16: AVMs (Average) - Calculated field, not from MLS
  // AVM Subfields (16a-16f) - Individual AVM Sources
  // NOTE: These come from external APIs, not Bridge MLS:
  // - 16a_zestimate: Zillow API
  // - 16b_redfin_estimate: Redfin API
  // - 16c_first_american_avm: Homes.com
  // - 16d_quantarium_avm: Homes.com
  // - 16e_ice_avm: Homes.com
  // - 16f_collateral_analytics_avm: Homes.com
  // Field 16 (avms) is calculated as average of available AVM sources in field-calculations.ts

  // ================================================================
  // GROUP 3: Property Basics (Fields 17-29)
  // ================================================================
  addField('17_bedrooms', property.BedroomsTotal);
  addField('18_full_bathrooms', property.BathroomsFull);
  addField('19_half_bathrooms', property.BathroomsHalf);
  addField('20_total_bathrooms', property.BathroomsTotalInteger);
  // Round to whole number - sqft should never have decimals
  addField('21_living_sqft', property.LivingArea ? Math.round(property.LivingArea) : undefined);
  addField('22_total_sqft_under_roof', property.BuildingAreaTotal ? Math.round(property.BuildingAreaTotal) : undefined);
  addField('23_lot_size_sqft', property.LotSizeSquareFeet ? Math.round(property.LotSizeSquareFeet) : undefined);
  addField('24_lot_size_acres', property.LotSizeAcres);
  addField('25_year_built', property.YearBuilt);

  // Field 26: Property Style (ArchitecturalStyle from MLS, not PropertyType)
  if (property.ArchitecturalStyle && Array.isArray(property.ArchitecturalStyle) && property.ArchitecturalStyle.length > 0) {
    addField('26_property_type', property.ArchitecturalStyle.join(', '));
  } else if (property.PropertySubType) {
    addField('26_property_type', property.PropertySubType);
  } else if (property.PropertyType) {
    addField('26_property_type', property.PropertyType);
  }

  // Stories - try explicit count, then extract from ArchitecturalStyle, then use Levels
  if (property.Stories || property.StoriesTotal) {
    addField('27_stories', property.Stories || property.StoriesTotal);
  } else if (property.ArchitecturalStyle && Array.isArray(property.ArchitecturalStyle)) {
    const styleText = property.ArchitecturalStyle.join(' ').toLowerCase();
    if (styleText.includes('one story') || styleText.includes('ranch') || styleText.includes('single level')) {
      addField('27_stories', 1, 'Medium');
    } else if (styleText.includes('two story') || styleText.includes('2 story') || styleText.includes('two-story')) {
      addField('27_stories', 2, 'Medium');
    } else if (styleText.includes('three story') || styleText.includes('3 story') || styleText.includes('tri-level')) {
      addField('27_stories', 3, 'Medium');
    }
  } else if (property.Levels) {
    // Convert Levels array (e.g., ["One"], ["Two"]) to numeric value
    const levelsText = Array.isArray(property.Levels) ? property.Levels.join(' ').toLowerCase() : String(property.Levels).toLowerCase();
    const levelMap: Record<string, number> = {
      'one': 1, 'single': 1, 'ground': 1,
      'two': 2, 'double': 2,
      'three': 3, 'tri': 3,
      'four': 4,
      'five': 5
    };
    let stories: number | null = null;
    for (const [text, num] of Object.entries(levelMap)) {
      if (levelsText.includes(text)) {
        stories = num;
        break;
      }
    }
    // Also try direct number parsing
    if (!stories) {
      const numMatch = levelsText.match(/\d+/);
      if (numMatch) stories = parseInt(numMatch[0], 10);
    }
    if (stories) {
      addField('27_stories', stories, 'Medium');
    }
  }

  addField('28_garage_spaces', property.GarageSpaces);
  addField('29_parking_total', property.ParkingTotal);

  // ================================================================
  // GROUP 4: HOA & Taxes (Fields 30-38)
  // ================================================================
  addField('30_hoa_yn', property.AssociationYN);

  // ================================================================
  // FIELD 31 + SUBFIELDS (31A-31F): Association Fee Handling
  // Uses new fee-normalizer for proper monthly/annual conversion
  // ================================================================
  if (property.AssociationFee) {
    const fee = property.AssociationFee;
    const freq = normalizeFeeFrequency(property.AssociationFeeFrequency);
    const calcFreq = freq === 'Unknown' ? 'Monthly' : freq;

    const annual = annualizeFee(fee, calcFreq);
    const monthly = monthlyizeFee(fee, calcFreq);

    // Determine if condo-like property
    const propType = property.PropertySubType || property.PropertyType || '';
    const condoLike = isCondoLike(propType);

    // Set subfields based on property type
    if (condoLike) {
      addField('31D_condo_fee_annual', annual);
      addField('31C_condo_fee_monthly', monthly);
    } else {
      addField('31B_hoa_fee_annual', annual);
      addField('31A_hoa_fee_monthly', monthly);
    }

    // Fee frequency and raw notes
    addField('31E_fee_frequency_primary', freq);
    addField('31F_fee_raw_notes', `Bridge AssociationFee=${fee} | Freq=${property.AssociationFeeFrequency ?? 'null'}`);

    // Canonical Field 31 (annualized total)
    const hoaAnnual = Number(condoLike ? 0 : annual ?? 0);
    const condoAnnual = Number(condoLike ? annual ?? 0 : 0);
    addField('31_association_fee', hoaAnnual + condoAnnual);

    // Bonus rule: if any fee exists, HOA true unless Bridge explicitly false
    if ((hoaAnnual + condoAnnual) > 0 && property.AssociationYN !== false) {
      addField('30_hoa_yn', true);
    }
  }

  addField('32_hoa_name', property.AssociationName);

  // HOA includes (from multiple possible fields)
  if (property.AssociationFeeIncludes && Array.isArray(property.AssociationFeeIncludes)) {
    addField('33_hoa_includes', property.AssociationFeeIncludes.join(', '));
  }

  addField('34_ownership_type', property.Ownership);
  addField('35_annual_taxes', property.TaxAnnualAmount);
  addField('36_tax_year', property.TaxYear);

  // Field 37: Tax Rate - Calculate from taxes and assessed value
  if (property.TaxAnnualAmount && property.TaxAssessedValue && property.TaxAssessedValue > 0) {
    const taxRate = (property.TaxAnnualAmount / property.TaxAssessedValue) * 100;
    addField('37_property_tax_rate', Math.round(taxRate * 100) / 100);
  }

  // Field 38: Tax Exemptions - Convert HomesteadYN to text exemption list
  // If HomesteadYN is true → "Homestead", if false → "None", if undefined → don't add
  if (property.HomesteadYN === true) {
    addField('38_tax_exemptions', 'Homestead');
  } else if (property.HomesteadYN === false) {
    addField('38_tax_exemptions', 'None');
  }

  // ================================================================
  // GROUP 5: Structure & Systems (Fields 39-48)
  // ================================================================

  // Field 39: Roof Type - try multiple field name variations
  const roofValue = property.RoofType || property.RoofMaterial || property.Roof;
  if (roofValue) {
    const roofStr = Array.isArray(roofValue) ? roofValue.join(', ') : String(roofValue);
    addField('39_roof_type', roofStr);
  }

  // Field 40: Calculate roof age from year
  if (property.RoofYear || property.YearRoofInstalled) {
    const roofYear = property.RoofYear ?? property.YearRoofInstalled;
    if (roofYear !== undefined) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - roofYear;
      addField('40_roof_age_est', `${age} years (installed ${roofYear})`);
    }
  } else if (property.PermitRoof) {
    addField('40_roof_age_est', `Recent permit: ${property.PermitRoof}`, 'Medium');
  }

  // Field 41: Exterior Material - try multiple field name variations
  const exteriorValue = property.ExteriorConstruction || property.ConstructionMaterials || property.Exterior;
  if (exteriorValue && Array.isArray(exteriorValue) && exteriorValue.length > 0) {
    addField('41_exterior_material', exteriorValue.join(', '));
  } else if (property.ExteriorFeatures && Array.isArray(property.ExteriorFeatures) && property.ExteriorFeatures.length > 0) {
    addField('41_exterior_material', property.ExteriorFeatures[0]);
  }

  // Field 42: Foundation - try multiple field name variations
  const foundationValue = property.FoundationType || property.Foundation;
  if (foundationValue) {
    const foundationStr = Array.isArray(foundationValue) ? foundationValue.join(', ') : String(foundationValue);
    addField('42_foundation', foundationStr);
  } else if (property.FoundationDetails) {
    addField('42_foundation', property.FoundationDetails);
  }

  addField('43_water_heater_type', property.WaterHeaterType);

  // Garage Type - use explicit type if available, else infer from AttachedGarageYN
  if (property.GarageType) {
    addField('44_garage_type', property.GarageType);
  } else if (property.AttachedGarageYN !== undefined) {
    // Fallback: infer from attached flag
    addField('44_garage_type', property.AttachedGarageYN ? 'Attached' : 'Detached', 'Medium');
  }

  // HVAC - combine heating and cooling
  const hvacParts = [];
  if (property.Heating && Array.isArray(property.Heating)) {
    hvacParts.push(...property.Heating);
  }
  if (property.Cooling && Array.isArray(property.Cooling)) {
    hvacParts.push(...property.Cooling);
  }
  if (hvacParts.length > 0) {
    addField('45_hvac_type', hvacParts.join(', '));
  }

  // Field 46: HVAC Age - use permit data if available
  // Note: Stellar MLS doesn't provide direct HVAC year installed
  if (property.PermitHVAC) {
    addField('46_hvac_age', `Recent permit: ${property.PermitHVAC}`, 'Medium');
  }

  if (property.LaundryFeatures && Array.isArray(property.LaundryFeatures)) {
    addField('47_laundry_type', property.LaundryFeatures.join(', '));
  }

  // Field 48: Interior Condition - Parse from PropertyCondition field or PublicRemarks
  let interiorCondition = property.PropertyCondition;

  if (!interiorCondition && property.PublicRemarks) {
    interiorCondition = parseInteriorConditionFromRemarks(property.PublicRemarks);
  }

  if (interiorCondition) {
    addField('48_interior_condition', interiorCondition, 'Medium');
  }

  // ================================================================
  // GROUP 6: Interior Features (Fields 49-53)
  // ================================================================
  if (property.Flooring && Array.isArray(property.Flooring)) {
    addField('49_flooring_type', property.Flooring.join(', '));
  }

  // Field 50: Kitchen Features - Extract from InteriorFeatures
  // Look for counters, kitchen-specific features, and appliance-related items
  if (property.InteriorFeatures && Array.isArray(property.InteriorFeatures)) {
    const kitchenKeywords = [
      'kitchen', 'granite', 'stainless', 'counter', 'stone', 'quartz', 'marble',
      'solid surface', 'corian', 'butcher block', 'tile counter', 'laminate counter',
      'island', 'breakfast bar', 'pantry', 'eat-in kitchen', 'chef', 'gourmet',
      'cabinet', 'appliance', 'cooktop', 'range', 'oven', 'microwave'
    ];
    const kitchenFeats = property.InteriorFeatures.filter(f => {
      const lower = f.toLowerCase();
      return kitchenKeywords.some(keyword => lower.includes(keyword));
    });
    if (kitchenFeats.length > 0) {
      addField('50_kitchen_features', kitchenFeats.join(', '));
    }
  }

  if (property.Appliances && Array.isArray(property.Appliances)) {
    addField('51_appliances_included', property.Appliances.join(', '));
  }

  addField('52_fireplace_yn', property.FireplaceYN);
  // FIXED 2026-01-08: Field 53 is Primary BR Location, NOT fireplace count
  // MasterBedroomLevel contains values like "Main", "Upper", "Lower"
  addField('53_primary_br_location', property.MasterBedroomLevel);

  // ================================================================
  // GROUP 7: Exterior Features (Fields 54-58)
  // ================================================================
  addField('54_pool_yn', property.PoolPrivateYN);

  // Field 55: Pool Type - Combine pool features with spa features
  const poolAndSpaFeatures: string[] = [];
  if (property.PoolFeatures && Array.isArray(property.PoolFeatures) && property.PoolFeatures.length > 0) {
    poolAndSpaFeatures.push(...property.PoolFeatures);
  }
  // Add Spa/Hot Tub info to pool features (MLS reports these together in amenities)
  if (property.SpaYN === true) {
    poolAndSpaFeatures.push('Spa/Hot Tub');
    if (property.SpaFeatures && Array.isArray(property.SpaFeatures)) {
      poolAndSpaFeatures.push(...property.SpaFeatures.map(f => `Spa: ${f}`));
    }
  }
  if (poolAndSpaFeatures.length > 0) {
    addField('55_pool_type', poolAndSpaFeatures.join(', '));
  }

  if (property.PatioAndPorchFeatures && Array.isArray(property.PatioAndPorchFeatures)) {
    addField('56_deck_patio', property.PatioAndPorchFeatures.join(', '));
  }

  if (property.Fencing && Array.isArray(property.Fencing)) {
    addField('57_fence', property.Fencing.join(', '));
  }

  // Field 58: Landscaping - Filter out flood-related data (goes to Field 119 instead)
  if (property.LotFeatures && Array.isArray(property.LotFeatures)) {
    // Remove flood-related terms from landscaping
    const landscapingFeatures = property.LotFeatures.filter(feature => {
      const lower = feature.toLowerCase();
      return !lower.includes('flood') && !lower.includes('fema');
    });

    if (landscapingFeatures.length > 0) {
      addField('58_landscaping', landscapingFeatures.join(', '));
    }

    // Extract flood-related data to use for Field 119 later
    const floodFeatures = property.LotFeatures.filter(feature => {
      const lower = feature.toLowerCase();
      return lower.includes('flood') || lower.includes('fema');
    });

    // Use flood features for Field 119 if FloodZone not set
    if (floodFeatures.length > 0 && !property.FloodZone) {
      property.FloodZone = floodFeatures.join(', ');
    }
  }

  // ================================================================
  // GROUP 8: Permits & Renovations (Fields 59-62)
  // ================================================================

  // Field 59: Recent Renovations - Extract from multiple sources
  let renovationData: string[] = [];

  // Source 1: Check if Bridge has structured Renovations field
  if (property.Renovations) {
    renovationData.push(property.Renovations);
  }

  // Source 2: Extract from PublicRemarks with multiple patterns
  if (property.PublicRemarks) {
    const remarks = property.PublicRemarks;
    const currentYear = new Date().getFullYear();
    const yearBuilt = property.YearBuilt;

    // Pattern 1: Action word + Area + Year
    const pattern1 = /(renovated|remodeled|updated|new|replaced)\s+([^.!?]*?)(kitchen|bathroom|bath|flooring|floor|roof|hvac|ac|air|appliances|cabinets|countertops|counters|windows|doors|paint)([^.!?]*?)(20(?:1[8-9]|2[0-5]))/gi;
    let matches1 = remarks.matchAll(pattern1);
    for (const match of matches1) {
      const year = parseInt(match[5]);
      // Skip if year matches year built (not a renovation)
      if (yearBuilt && year === yearBuilt) continue;
      // Skip if year is in future
      if (year > currentYear) continue;
      renovationData.push(match[0].trim());
    }

    // Pattern 2: Area + Action word + Year (reverse order)
    const pattern2 = /(kitchen|bathroom|bath|flooring|floor|roof|hvac|ac|air|appliances|cabinets|countertops|counters|windows|doors)([^.!?]*?)(renovated|remodeled|updated|new|replaced|installed)([^.!?]*?)(20(?:1[8-9]|2[0-5]))/gi;
    let matches2 = remarks.matchAll(pattern2);
    for (const match of matches2) {
      const year = parseInt(match[5]);
      if (yearBuilt && year === yearBuilt) continue;
      if (year > currentYear) continue;
      const text = match[0].trim();
      // Avoid duplicates from pattern1
      if (!renovationData.some(r => r.toLowerCase().includes(text.toLowerCase()))) {
        renovationData.push(text);
      }
    }

    // Pattern 3: Year at start (e.g., "2022 kitchen remodel")
    const pattern3 = /(20(?:1[8-9]|2[0-5]))\s+([^.!?]*?)(kitchen|bathroom|flooring|roof|hvac|remodel|renovation|update)/gi;
    let matches3 = remarks.matchAll(pattern3);
    for (const match of matches3) {
      const year = parseInt(match[1]);
      if (yearBuilt && year === yearBuilt) continue;
      if (year > currentYear) continue;
      const text = match[0].trim();
      if (!renovationData.some(r => r.toLowerCase().includes(text.toLowerCase()))) {
        renovationData.push(text);
      }
    }
  }

  // Source 3: Check InteriorFeatures for renovation keywords (fallback only)
  if (renovationData.length === 0 && property.InteriorFeatures && Array.isArray(property.InteriorFeatures)) {
    const renovationKeywords = ['updated', 'renovated', 'remodeled', 'new', 'upgraded', 'modern'];
    const renovatedFeatures = property.InteriorFeatures.filter(feature => {
      const lower = feature.toLowerCase();
      return renovationKeywords.some(kw => lower.includes(kw));
    });

    if (renovatedFeatures.length > 0) {
      renovationData.push(`Updated features: ${renovatedFeatures.join(', ')}`);
    }
  }

  // Add to field if we found renovation data
  if (renovationData.length > 0) {
    // Remove duplicates and limit to first 3 most significant mentions
    const unique = [...new Set(renovationData)].slice(0, 3);
    const confidence = property.Renovations ? 'High' : 'Medium';
    addField('59_recent_renovations', unique.join('; '), confidence);
  }

  // Fields 60-62: Permit History
  addField('60_permit_history_roof', property.PermitRoof);
  addField('61_permit_history_hvac', property.PermitHVAC);
  addField('62_permit_history_other', property.PermitAdditions);

  // Alternative: Extract from remarks if not in structured fields
  if (!property.PermitRoof && property.PublicRemarks) {
    const roofMatch = property.PublicRemarks.match(/roof.*(?:permit|replace|install|new).*(20\d{2})/i);
    if (roofMatch) {
      addField('60_permit_history_roof', `Roof work mentioned: ${roofMatch[0]}`, 'Medium');
    }
  }

  // ================================================================
  // GROUP 9: Schools (Fields 63-73)
  // ================================================================
  addField('63_school_district', property.SchoolDistrict);
  addField('64_elevation_feet', property.Elevation);
  addField('65_elementary_school', property.ElementarySchool);
  addField('68_middle_school', property.MiddleOrJuniorSchool);
  addField('71_high_school', property.HighSchool);

  // ================================================================
  // GROUP 13: Market & Investment (Fields 91-103)
  // ================================================================
  // NOTE: Field 95 is for NEIGHBORHOOD average DOM, not individual listing DOM
  // Individual listing DOM is stored as raw fields (not in 168-schema)

  // Field 102: Financing Terms - Available financing options from MLS
  // Stellar MLS uses "FinancingAvailable" or "Financing" field
  if (property.FinancingAvailable && Array.isArray(property.FinancingAvailable)) {
    addField('102_financing_terms', property.FinancingAvailable.join(', '));
  } else if (property.Financing && Array.isArray(property.Financing)) {
    addField('102_financing_terms', property.Financing.join(', '));
  } else if (property.FinancingProposed && Array.isArray(property.FinancingProposed)) {
    addField('102_financing_terms', property.FinancingProposed.join(', '));
  }

  // ================================================================
  // RAW MLS FIELDS (Not part of 168-schema, used by PropertyCard)
  // ================================================================
  // These are NOT numbered fields - they're raw metadata for PropertyCard
  if (property.DaysOnMarket !== undefined && property.DaysOnMarket !== null) {
    addField('DaysOnMarket', property.DaysOnMarket);
  }
  if (property.CumulativeDaysOnMarket !== undefined && property.CumulativeDaysOnMarket !== null) {
    addField('CumulativeDaysOnMarket', property.CumulativeDaysOnMarket);
  }

  // ================================================================
  // GROUP 15: Environment & Risk (Fields 117-130)
  // ================================================================
  addField('119_flood_zone', property.FloodZone);

  // ================================================================
  // GROUP 14: Utilities & Connectivity (Fields 104-116)
  // ================================================================
  // Map utility provider fields from Bridge MLS
  if (property.Electric) {
    addField('104_electric_provider', property.Electric);
  }

  if (property.Water) {
    const waterProvider = Array.isArray(property.Water) ? property.Water.join(', ') : property.Water;
    addField('106_water_provider', waterProvider);
  }

  if (property.Sewer) {
    const sewerProvider = Array.isArray(property.Sewer) ? property.Sewer.join(', ') : property.Sewer;
    addField('108_sewer_provider', sewerProvider);
  }

  if (property.Gas) {
    addField('109_natural_gas', property.Gas);
  }

  // ================================================================
  // GROUP 16: View & Location (Fields 131-138)
  // ================================================================
  // Field 131: View Type
  if (property.View && Array.isArray(property.View)) {
    addField('131_view_type', property.View.join(', '));
  }

  // Lot Features - combine LotFeatures, Topography, and Vegetation
  const lotFeaturesParts = [];
  if (property.LotFeatures && Array.isArray(property.LotFeatures)) {
    lotFeaturesParts.push(...property.LotFeatures);
  }
  if (property.Topography && Array.isArray(property.Topography)) {
    lotFeaturesParts.push(...property.Topography);
  }
  if (property.Vegetation && Array.isArray(property.Vegetation)) {
    lotFeaturesParts.push(...property.Vegetation);
  }
  if (lotFeaturesParts.length > 0) {
    const uniqueFeatures = [...new Set(lotFeaturesParts)]; // Remove duplicates
    addField('132_lot_features', uniqueFeatures.join(', '));
  }

  // EV Charging
  if (property.GreenEnergyGeneration && Array.isArray(property.GreenEnergyGeneration)) {
    const evFeatures = property.GreenEnergyGeneration.filter(f =>
      f.toLowerCase().includes('electric vehicle') || f.toLowerCase().includes('ev')
    );
    if (evFeatures.length > 0) {
      addField('133_ev_charging', evFeatures.join(', '));
    }
  }

  // ================================================================
  // PARSE PUBLICREMARKS for rare fields (134, 135, 138)
  // Track extracted sentences to remove from display
  // ================================================================
  const extractedSentences: string[] = [];

  // Field 134: Smart Home Features
  let smartHomeFound = false;
  if (property.InteriorFeatures && Array.isArray(property.InteriorFeatures)) {
    const smartFeatures = property.InteriorFeatures.filter(f =>
      f.toLowerCase().includes('smart') || f.toLowerCase().includes('automation')
    );
    if (smartFeatures.length > 0) {
      addField('134_smart_home_features', smartFeatures.join(', '));
      smartHomeFound = true;
    }
  }

  // Fallback: Parse from PublicRemarks if not in structured data
  if (!smartHomeFound && property.PublicRemarks) {
    const smartKeywords = ['smart home', 'nest', 'ring doorbell', 'ring video', 'alexa', 'ecobee', 'smart thermostat', 'home automation', 'smart lock', 'smart lighting'];
    const remarks = property.PublicRemarks;
    const sentences = remarks.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);

    const foundFeatures: string[] = [];
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      smartKeywords.forEach(keyword => {
        if (lowerSentence.includes(keyword)) {
          foundFeatures.push(keyword);
          extractedSentences.push(sentence);
        }
      });
    });

    if (foundFeatures.length > 0) {
      const uniqueFeatures = [...new Set(foundFeatures)];
      addField('134_smart_home_features', uniqueFeatures.join(', '), 'Medium');
    }
  }

  // Field 135: Accessibility Modifications
  // Include elevator for Single Family/Townhouse (luxury or accessibility), NOT for Condo (standard)
  const accessibilityFeatures: string[] = [];

  // Check AccessibilityFeatures array first
  if (property.AccessibilityFeatures && Array.isArray(property.AccessibilityFeatures)) {
    accessibilityFeatures.push(...property.AccessibilityFeatures);
  }

  // Check InteriorFeatures for Elevator - only add for SFH/Townhouse, not Condo
  if (property.InteriorFeatures && Array.isArray(property.InteriorFeatures)) {
    const hasElevator = property.InteriorFeatures.some(f => f.toLowerCase().includes('elevator'));
    if (hasElevator) {
      const propType = (property.PropertyType || property.PropertySubType || '').toLowerCase();
      const isCondo = propType.includes('condo') || propType.includes('apartment') || propType.includes('co-op');
      // SFH/Townhouse with elevator = accessibility or luxury feature
      if (!isCondo) {
        accessibilityFeatures.push('Elevator');
      }
    }
  }

  if (accessibilityFeatures.length > 0) {
    const uniqueFeatures = [...new Set(accessibilityFeatures)];
    addField('135_accessibility_modifications', uniqueFeatures.join(', '));
  }

  // Fallback: Parse from PublicRemarks if no features found
  if (accessibilityFeatures.length === 0 && property.PublicRemarks) {
    const accessKeywords = ['wheelchair', 'accessible', 'ada compliant', 'ada', 'ramp', 'grab bar', 'wide doorway', 'roll-in shower', 'accessible bathroom'];
    const remarks = property.PublicRemarks;
    const sentences = remarks.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);

    const foundFeatures: string[] = [];
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      accessKeywords.forEach(keyword => {
        if (lowerSentence.includes(keyword)) {
          foundFeatures.push(keyword);
          if (!extractedSentences.includes(sentence)) {
            extractedSentences.push(sentence);
          }
        }
      });
    });

    if (foundFeatures.length > 0) {
      const uniqueFeatures = [...new Set(foundFeatures)];
      addField('135_accessibility_modifications', uniqueFeatures.join(', '), 'Medium');
    }
  }

  // Field 138: Special Assessments - Check SpecialListingConditions first, then PublicRemarks
  let foundAssessment = false;

  // First check SpecialListingConditions array from Bridge MLS
  if (property.SpecialListingConditions && Array.isArray(property.SpecialListingConditions)) {
    const assessmentKeywords = ['assessment', 'special fee', 'pending fee', 'capital improvement'];
    const assessmentConditions = property.SpecialListingConditions.filter(condition => {
      const lowerCondition = condition.toLowerCase();
      return assessmentKeywords.some(keyword => lowerCondition.includes(keyword));
    });

    if (assessmentConditions.length > 0) {
      addField('138_special_assessments', assessmentConditions.join('; '), 'High');
      foundAssessment = true;
    }
  }

  // Fallback: Parse from PublicRemarks if not found in SpecialListingConditions
  if (!foundAssessment && property.PublicRemarks) {
    const assessmentKeywords = ['special assessment', 'assessment due', 'pending assessment', 'special fee', 'one-time assessment', 'capital assessment'];
    const remarks = property.PublicRemarks;
    const sentences = remarks.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);

    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      assessmentKeywords.forEach(keyword => {
        if (lowerSentence.includes(keyword) && !foundAssessment) {
          addField('138_special_assessments', sentence, 'Medium');
          if (!extractedSentences.includes(sentence)) {
            extractedSentences.push(sentence);
          }
          foundAssessment = true;
        }
      });
    });
  }

  // Pet policy - combine PetsAllowed array with full PetRestrictions text
  const petPolicyParts: string[] = [];
  if (property.PetsAllowed && Array.isArray(property.PetsAllowed)) {
    petPolicyParts.push(property.PetsAllowed.join(', '));
  }
  if (property.PetRestrictions) {
    petPolicyParts.push(property.PetRestrictions);
  }
  if (petPolicyParts.length > 0) {
    addField('136_pet_policy', petPolicyParts.join(' - '));
  }

  // Field 137: Age Restrictions - Map from HousingForOlderPersonsYN
  if (property.HousingForOlderPersonsYN !== undefined) {
    addField('137_age_restrictions', property.HousingForOlderPersonsYN ? '55+ Community' : 'None');
  } else if (property.SeniorCommunityYN !== undefined) {
    addField('137_age_restrictions', property.SeniorCommunityYN ? '55+ Community' : 'None');
  }

  // ================================================================
  // GROUP 18: Parking Details (Fields 139-143) - Stellar MLS
  // ================================================================
  addField('139_carport_yn', property.CarportYN);
  addField('140_carport_spaces', property.CarportSpaces);
  addField('141_garage_attached_yn', property.AttachedGarageYN);

  if (property.ParkingFeatures && Array.isArray(property.ParkingFeatures)) {
    addField('142_parking_features', property.ParkingFeatures.join(', '));
  }

  addField('143_assigned_parking_spaces', property.AssignedParkingSpaces);

  // ================================================================
  // GROUP 19: Building Details (Fields 144-148)
  // ================================================================
  addField('144_floor_number', property.UnitFloor);
  addField('145_building_total_floors', property.BuildingFloors);
  addField('146_building_name_number', property.BuildingName || property.BuildingNumber);
  addField('147_building_elevator_yn', property.ElevatorYN);
  addField('148_floors_in_unit', property.FloorsInUnit);

  // ================================================================
  // GROUP 20: Legal & Compliance (Fields 149-154)
  // ================================================================
  addField('149_subdivision_name', property.SubdivisionName);
  // Use LegalDescription, fallback to TaxLegalDescription from Bridge MLS
  addField('150_legal_description', property.LegalDescription || property.TaxLegalDescription);

  // Field 151: Homestead Exemption
  if (property.HomesteadYN !== undefined) {
    addField('151_homestead_yn', property.HomesteadYN);
  }

  addField('152_cdd_yn', property.CDDYN);
  addField('153_annual_cdd_fee', property.CDDAnnualFee);
  addField('154_front_exposure', property.DirectionFaces);

  // ================================================================
  // GROUP 21: Waterfront (Fields 155-159)
  // ================================================================
  // Field 155: Waterfront Y/N - also infer from WaterfrontFeatures or DockYN
  if (property.WaterfrontYN !== undefined) {
    addField('155_water_frontage_yn', property.WaterfrontYN);
  } else if (property.WaterfrontFeatures && Array.isArray(property.WaterfrontFeatures) && property.WaterfrontFeatures.length > 0) {
    addField('155_water_frontage_yn', true, 'Medium');
  } else if (property.DockYN === true) {
    // If has dock, it's waterfront
    addField('155_water_frontage_yn', true, 'Medium');
  }

  // Field 156: Waterfront Feet
  if (property.WaterfrontFeet) {
    addField('156_waterfront_feet', property.WaterfrontFeet);
  } else if (property.CanalFrontage) {
    addField('156_waterfront_feet', property.CanalFrontage, 'Medium');
  }

  // Field 157: Water Access Y/N - also true if has dock
  if (property.WaterAccessYN !== undefined) {
    addField('157_water_access_yn', property.WaterAccessYN);
  } else if (property.DockYN === true) {
    addField('157_water_access_yn', true, 'Medium');
  }

  // Field 158: Water View Y/N
  addField('158_water_view_yn', property.WaterViewYN);

  // Field 159: Water Body Name - Include dock info if available
  const waterBodyParts: string[] = [];
  if (property.WaterBodyName) {
    waterBodyParts.push(property.WaterBodyName);
  } else if (property.WaterfrontFeatures && Array.isArray(property.WaterfrontFeatures) && property.WaterfrontFeatures.length > 0) {
    waterBodyParts.push(property.WaterfrontFeatures.join(', '));
  }
  // Add Dock info to water body description
  if (property.DockYN === true) {
    const dockInfo: string[] = ['Dock'];
    if (property.DockType && Array.isArray(property.DockType)) {
      dockInfo.push(...property.DockType);
    }
    if (property.DockDescription) {
      dockInfo.push(property.DockDescription);
    }
    waterBodyParts.push(`(${dockInfo.join(': ')})`);
  }
  if (waterBodyParts.length > 0) {
    addField('159_water_body_name', waterBodyParts.join(' '), waterBodyParts.length > 1 ? 'High' : 'Medium');
  }

  // ================================================================
  // GROUP 22: Leasing (Fields 160-165)
  // ================================================================
  addField('160_can_be_leased_yn', property.LeaseConsideredYN);
  addField('161_minimum_lease_period', property.MinimumLeaseType || property.LeaseTerm);
  addField('162_lease_restrictions_yn', property.LeaseRestrictionsYN);
  addField('163_pet_size_limit', property.PetSizeLimit);
  addField('164_max_pet_weight', property.MaxPetWeight);
  // FIXED 2026-01-08: Field 165 is Association Approval Required, NOT Buyer Financing
  // BuyerFinancingYN was WRONG - AssociationApprovalRequiredYN is correct
  addField('165_association_approval_yn', property.AssociationApprovalRequiredYN);

  // ================================================================
  // GROUP 23: Community & Features (Fields 166-168)
  // ================================================================
  if (property.CommunityFeatures && Array.isArray(property.CommunityFeatures)) {
    addField('166_community_features', property.CommunityFeatures.join(', '));
  }

  // Field 167: Interior Features - Combine InteriorFeatures + AdditionalRooms
  const allInteriorFeatures: string[] = [];

  if (property.InteriorFeatures && Array.isArray(property.InteriorFeatures)) {
    allInteriorFeatures.push(...property.InteriorFeatures);
  }

  // Add AdditionalRooms (Den, In-Law Suite, Office, etc.)
  if (property.AdditionalRooms && Array.isArray(property.AdditionalRooms)) {
    allInteriorFeatures.push(...property.AdditionalRooms);
  }

  if (allInteriorFeatures.length > 0) {
    addField('167_interior_features', allInteriorFeatures.join(', '));
  }

  if (property.ExteriorFeatures && Array.isArray(property.ExteriorFeatures)) {
    addField('168_exterior_features', property.ExteriorFeatures.join(', '));
  }

  // ================================================================
  // Additional metadata
  // ================================================================
  if (property.PublicRemarks || property.Remarks) {
    addField('property_description', property.PublicRemarks || property.Remarks, 'Medium');
  }

  if (property.Latitude && property.Longitude) {
    addField('latitude', property.Latitude, 'High');
    addField('longitude', property.Longitude, 'High');
  }

  // ================================================================
  // PHOTOS - Extract from Media resource (Field 169)
  // ================================================================
  console.log('[Bridge Mapper] 🔍 Checking for Media in property:', {
    hasMedia: !!property.Media,
    isArray: Array.isArray(property.Media),
    length: property.Media?.length || 0,
    mediaType: typeof property.Media
  });

  if (property.Media && Array.isArray(property.Media) && property.Media.length > 0) {
    console.log(`[Bridge Mapper] Found ${property.Media.length} photos for listing`);

    // Sort by order
    const sortedMedia = property.Media
      .filter(m => m.MediaURL)  // Only photos with URLs
      .sort((a, b) => (a.Order || 999) - (b.Order || 999));

    // Find preferred photo (marked by MLS)
    const preferredPhoto = sortedMedia.find(m => m.PreferredPhotoYN === true);

    // Use preferred photo, or first photo if no preferred
    const primaryPhotoUrl = preferredPhoto?.MediaURL || sortedMedia[0]?.MediaURL;

    if (primaryPhotoUrl) {
      addField('property_photo_url', primaryPhotoUrl, 'High');
      console.log('[Bridge Mapper] ✅ Primary photo URL extracted');
    }

    // Store all photo URLs for future gallery feature
    const allPhotoUrls = sortedMedia.map(m => m.MediaURL).filter(Boolean) as string[];
    if (allPhotoUrls.length > 0) {
      addField('property_photos', allPhotoUrls, 'High');
      console.log(`[Bridge Mapper] ✅ Stored ${allPhotoUrls.length} photos in gallery`);
    }
  }

  // ================================================================
  // VIRTUAL TOUR - Extract URL for 3D tours/walkthroughs
  // ================================================================
  // FIX BUG #16: Extract virtual tour URL from MLS data
  // Prefer unbranded version for better UX, fall back to branded
  const virtualTourUrl = property.VirtualTourURLUnbranded || property.VirtualTourURLBranded;
  if (virtualTourUrl) {
    addField('virtual_tour_url', virtualTourUrl, 'High');
    console.log('[Bridge Mapper] ✅ Virtual tour URL extracted:', virtualTourUrl.substring(0, 60) + '...');
  }

  // ================================================================
  // Clean PublicRemarks by removing extracted sentences
  // ================================================================
  let cleanedRemarks = '';
  const originalRemarks = property.PublicRemarks || property.Remarks || '';

  if (originalRemarks && extractedSentences.length > 0) {
    // Split remarks into sentences
    const allSentences = originalRemarks.split(/([.!?]+)/).filter(s => s.trim().length > 0);

    // Rebuild remarks, excluding extracted sentences
    let rebuiltRemarks = '';
    for (let i = 0; i < allSentences.length; i += 2) {
      const sentence = allSentences[i]?.trim() || '';
      const punctuation = allSentences[i + 1] || '';

      // Check if this sentence was extracted
      const wasExtracted = extractedSentences.some(extracted =>
        sentence.toLowerCase().includes(extracted.toLowerCase()) ||
        extracted.toLowerCase().includes(sentence.toLowerCase())
      );

      if (!wasExtracted && sentence.length > 10) {
        rebuiltRemarks += sentence + punctuation + ' ';
      }
    }

    cleanedRemarks = rebuiltRemarks.trim();
    console.log(`[Bridge Mapper] Removed ${extractedSentences.length} extracted sentences from PublicRemarks`);
  } else {
    cleanedRemarks = originalRemarks;
  }

  // Count unmapped fields
  const allPropertyKeys = Object.keys(property);
  unmappedCount = allPropertyKeys.length - mappedCount;

  return {
    fields,
    rawData: property,
    mappedCount,
    unmappedCount,
    publicRemarks: originalRemarks,
    publicRemarksExtracted: cleanedRemarks,
  };
}

/**
 * Map multiple Bridge properties to schema
 */
export function mapBridgePropertiesToSchema(properties: BridgeProperty[]): MappedPropertyData[] {
  return properties.map(property => mapBridgePropertyToSchema(property));
}

/**
 * Extract Extended MLS Data (fields not in 168-schema)
 * Stores ALL available Stellar MLS fields that don't map to numbered fields
 * These can be displayed selectively in UI without affecting the 168-field architecture
 */
export function extractExtendedMLSData(property: BridgeProperty): Record<string, any> {
  const extended: Record<string, any> = {};

  // === WATERFRONT (Priority 1) ===
  if (property.WaterfrontFeatures && Array.isArray(property.WaterfrontFeatures)) {
    extended.waterfrontFeatures = property.WaterfrontFeatures;
  }
  if (property.DockType) extended.dockType = property.DockType;
  if (property.NavigableWaterYN) extended.navigableWaterYN = property.NavigableWaterYN;
  if (property.BoatLiftCapacity) extended.boatLiftCapacity = property.BoatLiftCapacity;
  if (property.BridgeClearance) extended.bridgeClearance = property.BridgeClearance;
  if (property.CanalFrontage) extended.canalFrontage = property.CanalFrontage;
  if (property.IntracoastalAccess) extended.intracoastalAccess = property.IntracoastalAccess;

  // === PRICE HISTORY (Priority 1) ===
  if (property.OriginalListPrice) extended.originalListPrice = property.OriginalListPrice;
  if (property.PreviousListPrice) extended.previousListPrice = property.PreviousListPrice;
  if (property.ListPriceLow) extended.listPriceLow = property.ListPriceLow;
  if (property.CloseTerms) extended.closeTerms = property.CloseTerms;

  // === ARCHITECTURAL STYLE (Priority 1) ===
  if (property.ArchitecturalStyle) {
    extended.architecturalStyle = Array.isArray(property.ArchitecturalStyle)
      ? property.ArchitecturalStyle
      : [property.ArchitecturalStyle];
  }
  if (property.BodyType) extended.bodyType = property.BodyType;
  if (property.Levels) extended.levels = property.Levels;

  // === SHOWING INSTRUCTIONS (Priority 1) ===
  if (property.ShowingInstructions) extended.showingInstructions = property.ShowingInstructions;
  if (property.LockBoxType) extended.lockBoxType = property.LockBoxType;
  if (property.ShowingRequirements) {
    extended.showingRequirements = Array.isArray(property.ShowingRequirements)
      ? property.ShowingRequirements
      : [property.ShowingRequirements];
  }

  // === VIRTUAL TOUR (Priority 1) ===
  if (property.VirtualTourURLUnbranded) extended.virtualTourURL = property.VirtualTourURLUnbranded;
  if (property.VirtualTourURLBranded) extended.virtualTourURLBranded = property.VirtualTourURLBranded;

  // === OCCUPANCY (Priority 1) ===
  if (property.OccupantType) extended.occupantType = property.OccupantType;
  if (property.TenantPays) {
    extended.tenantPays = Array.isArray(property.TenantPays) ? property.TenantPays : [property.TenantPays];
  }
  if (property.OwnerPays) {
    extended.ownerPays = Array.isArray(property.OwnerPays) ? property.OwnerPays : [property.OwnerPays];
  }
  if (property.FurnishedYN) extended.furnishedYN = property.FurnishedYN;

  // === ROOM DETAILS (Priority 1) ===
  if (property.MasterBedroomLevel) extended.masterBedroomLevel = property.MasterBedroomLevel;
  if (property.BedroomMain) extended.bedroomMain = property.BedroomMain;
  if (property.BedroomsPossible) extended.bedroomsPossible = property.BedroomsPossible;
  if (property.DiningRoomType) extended.diningRoomType = property.DiningRoomType;
  if (property.KitchenLevel) extended.kitchenLevel = property.KitchenLevel;
  if (property.LivingRoomType) extended.livingRoomType = property.LivingRoomType;
  if (property.RoomsTotal) extended.roomsTotal = property.RoomsTotal;

  // === LISTING AGENT (Priority 2) ===
  if (property.ListAgentFullName) extended.listingAgentName = property.ListAgentFullName;
  if (property.ListOfficeName) extended.listingOfficeName = property.ListOfficeName;
  if (property.BuyerAgentDesignation) extended.buyerAgentDesignation = property.BuyerAgentDesignation;

  // === UTILITIES DETAILS (Priority 2) ===
  if (property.Sewer) extended.sewerProvider = Array.isArray(property.Sewer) ? property.Sewer.join(', ') : property.Sewer;
  if (property.Water) extended.waterProvider = Array.isArray(property.Water) ? property.Water.join(', ') : property.Water;
  if (property.Electric) extended.electricProvider = property.Electric;
  if (property.Gas) extended.gasProvider = property.Gas;

  // === SPECIAL LISTING CONDITIONS (Priority 2) ===
  if (property.SpecialListingConditions) {
    extended.specialListingConditions = Array.isArray(property.SpecialListingConditions)
      ? property.SpecialListingConditions
      : [property.SpecialListingConditions];
  }
  if (property.Disclosures) {
    extended.disclosures = Array.isArray(property.Disclosures) ? property.Disclosures : [property.Disclosures];
  }

  // === SECOND HOA (Priority 2) ===
  if (property.AssociationFee2) extended.associationFee2 = property.AssociationFee2;
  if (property.AssociationName2) extended.associationName2 = property.AssociationName2;

  // === SPA / HOT TUB (Priority 2) ===
  if (property.SpaYN) extended.spaYN = property.SpaYN;
  if (property.SpaFeatures) {
    extended.spaFeatures = Array.isArray(property.SpaFeatures) ? property.SpaFeatures : [property.SpaFeatures];
  }

  // === NEW CONSTRUCTION (Priority 2) ===
  if (property.NewConstructionYN) extended.newConstructionYN = property.NewConstructionYN;

  // === LOT DETAILS (Priority 2) ===
  if (property.LotSizeDimensions) extended.lotSizeDimensions = property.LotSizeDimensions;
  if (property.LotSizeSource) extended.lotSizeSource = property.LotSizeSource;
  if (property.Topography) {
    extended.topography = Array.isArray(property.Topography) ? property.Topography : [property.Topography];
  }
  if (property.Vegetation) {
    extended.vegetation = Array.isArray(property.Vegetation) ? property.Vegetation : [property.Vegetation];
  }

  // === BASEMENT (Priority 3) ===
  if (property.BasementYN) extended.basementYN = property.BasementYN;
  if (property.BasementFeatures) {
    extended.basementFeatures = Array.isArray(property.BasementFeatures)
      ? property.BasementFeatures
      : [property.BasementFeatures];
  }

  // === WINDOW/DOOR FEATURES (Priority 3) ===
  if (property.WindowFeatures) {
    extended.windowFeatures = Array.isArray(property.WindowFeatures)
      ? property.WindowFeatures
      : [property.WindowFeatures];
  }
  if (property.DoorFeatures) {
    extended.doorFeatures = Array.isArray(property.DoorFeatures)
      ? property.DoorFeatures
      : [property.DoorFeatures];
  }

  // === CEILING FEATURES (Priority 3) ===
  if (property.CeilingFeatures) {
    extended.ceilingFeatures = Array.isArray(property.CeilingFeatures)
      ? property.CeilingFeatures
      : [property.CeilingFeatures];
  }

  // === GARAGE DETAILS (Priority 3) ===
  if (property.AttachedGarageYN) extended.attachedGarageYN = property.AttachedGarageYN;
  if (property.GarageLength) extended.garageLength = property.GarageLength;
  if (property.GarageWidth) extended.garageWidth = property.GarageWidth;

  // === CONSTRUCTION DETAILS (Priority 3) ===
  if (property.YearBuiltDetails) extended.yearBuiltDetails = property.YearBuiltDetails;
  if (property.ConstructionMaterialsSource) extended.constructionMaterialsSource = property.ConstructionMaterialsSource;
  if (property.BuildingAreaSource) extended.buildingAreaSource = property.BuildingAreaSource;

  // === WATER HEATER (Priority 3) ===
  if (property.WaterHeaterFeatures) {
    extended.waterHeaterFeatures = Array.isArray(property.WaterHeaterFeatures)
      ? property.WaterHeaterFeatures
      : [property.WaterHeaterFeatures];
  }

  // === LAUNDRY (Priority 3) ===
  if (property.LaundryLevel) extended.laundryLevel = property.LaundryLevel;

  // === OUTDOOR (Priority 3) ===
  if (property.PatioArea) extended.patioArea = property.PatioArea;
  if (property.PorchFeatures) {
    extended.porchFeatures = Array.isArray(property.PorchFeatures)
      ? property.PorchFeatures
      : [property.PorchFeatures];
  }
  if (property.RoadSurfaceType) extended.roadSurfaceType = property.RoadSurfaceType;
  if (property.RoadResponsibility) extended.roadResponsibility = property.RoadResponsibility;

  // === LAND LEASE (Priority 3) ===
  if (property.LandLeaseYN) extended.landLeaseYN = property.LandLeaseYN;
  if (property.LandLeaseAmount) extended.landLeaseAmount = property.LandLeaseAmount;
  if (property.LandLeaseExpirationDate) extended.landLeaseExpirationDate = property.LandLeaseExpirationDate;

  // === PERMITS (Priority 3) ===
  if (property.PermitElectrical) extended.permitElectrical = property.PermitElectrical;
  if (property.PermitPlumbing) extended.permitPlumbing = property.PermitPlumbing;
  if (property.PermitPool) extended.permitPool = property.PermitPool;
  if (property.PermitStructural) extended.permitStructural = property.PermitStructural;
  if (property.BuildingPermitYN) extended.buildingPermitYN = property.BuildingPermitYN;

  // === SCHOOL DISTRICTS (Priority 3) ===
  if (property.ElementarySchoolDistrict) extended.elementarySchoolDistrict = property.ElementarySchoolDistrict;
  if (property.MiddleSchoolDistrict) extended.middleSchoolDistrict = property.MiddleSchoolDistrict;
  if (property.HighSchoolDistrict) extended.highSchoolDistrict = property.HighSchoolDistrict;
  if (property.SchoolChoice) extended.schoolChoice = property.SchoolChoice;

  // === ZONING (Priority 3) ===
  if (property.Zoning) extended.zoning = property.Zoning;
  if (property.ZoningDescription) extended.zoningDescription = property.ZoningDescription;
  if (property.LandUseZoning) extended.landUseZoning = property.LandUseZoning;

  // === UNIT FEATURES (Priority 3) ===
  if (property.CommonWalls) {
    extended.commonWalls = Array.isArray(property.CommonWalls) ? property.CommonWalls : [property.CommonWalls];
  }
  if (property.UnitTypeType) extended.unitType = property.UnitTypeType;
  if (property.UnitFeatures) {
    extended.unitFeatures = Array.isArray(property.UnitFeatures)
      ? property.UnitFeatures
      : [property.UnitFeatures];
  }

  // === BATHROOM/BEDROOM FEATURES (Priority 3) ===
  if (property.BathroomFeatures) {
    extended.bathroomFeatures = Array.isArray(property.BathroomFeatures)
      ? property.BathroomFeatures
      : [property.BathroomFeatures];
  }
  if (property.BedroomFeatures) {
    extended.bedroomFeatures = Array.isArray(property.BedroomFeatures)
      ? property.BedroomFeatures
      : [property.BedroomFeatures];
  }

  // === RENTAL EQUIPMENT (Priority 3) ===
  if (property.RentalEquipment) {
    extended.rentalEquipment = Array.isArray(property.RentalEquipment)
      ? property.RentalEquipment
      : [property.RentalEquipment];
  }

  // === LEASE TYPE (Priority 3) ===
  if (property.ExistingLeaseType) extended.existingLeaseType = property.ExistingLeaseType;

  // === TAX DETAILS (Priority 3) ===
  if (property.TaxLegalDescription) extended.taxLegalDescription = property.TaxLegalDescription;
  if (property.TaxMapNumber) extended.taxMapNumber = property.TaxMapNumber;
  if (property.TaxBlock) extended.taxBlock = property.TaxBlock;
  if (property.TaxLot) extended.taxLot = property.TaxLot;

  return extended;
}
