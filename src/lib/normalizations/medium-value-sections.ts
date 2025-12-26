/**
 * SMART Score Normalization Functions - MEDIUM-VALUE Sections
 *
 * Conversation ID: CLUES-MED-NORM-20251226
 *
 * Contains normalization functions for:
 * - Section D: HOA & Taxes (fields 30, 31, 33, 34, 35, 37, 38)
 * - Section E: Structure & Systems (fields 39, 40, 41, 42, 43, 44, 45, 46, 47, 48)
 * - Section J: Location Scores (fields 74, 75, 76, 77, 78, 79, 81, 82)
 * - Section O: Environment & Risk (fields 117-130)
 *
 * Market Context: Florida coastal real estate
 * Each function normalizes raw value to 0-100 score
 *
 * @module normalizations/medium-value-sections
 */

import type { Property } from '../../types/property';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface NormalizationResult {
  score: number;           // 0-100
  confidence: 'High' | 'Medium' | 'Low';
  notes?: string;
}

export type NormalizationFunction = (
  value: any,
  property?: Property
) => NormalizationResult;

// Florida-specific market thresholds
export const FLORIDA_COASTAL_THRESHOLDS = {
  // HOA thresholds (annual)
  hoa: {
    excellent: 0,        // No HOA
    good: 1200,          // <$100/mo
    fair: 2400,          // $100-200/mo
    poor: 4800,          // $200-400/mo
    veryPoor: 7200       // >$600/mo
  },
  // Property tax effective rate thresholds
  taxRate: {
    excellent: 1.0,      // <1%
    good: 1.5,           // 1-1.5%
    fair: 2.0,           // 1.5-2%
    poor: 2.5            // >2.5%
  },
  // Annual taxes (absolute for typical home value)
  taxes: {
    excellent: 3000,
    good: 5000,
    fair: 8000,
    poor: 12000
  },
  // Roof age (years)
  roofAge: {
    new: 3,
    good: 7,
    fair: 12,
    poor: 20
  },
  // HVAC age (years)
  hvacAge: {
    new: 3,
    good: 7,
    fair: 12,
    poor: 15
  }
};

// ============================================================
// SECTION D: HOA & TAXES (Fields 30, 31, 33, 34, 35, 37, 38)
// Section Weight: 10% (Industry Standard)
// ============================================================

/**
 * Field 30: hoa_yn - HOA Presence
 *
 * Scoring Logic:
 * - No HOA = More freedom, no monthly fees = Better for many buyers
 * - Has HOA = Restrictions but may include amenities
 *
 * Florida Context: Many coastal communities require HOA
 */
export function normalizeHoaYn(value: any): NormalizationResult {
  if (value === null || value === undefined) {
    return { score: 0, confidence: 'Low', notes: 'HOA status unknown' };
  }

  const hasHoa = value === true || value === 'Yes' || value === 'Y' || value === 1;

  return {
    score: hasHoa ? 60 : 100,
    confidence: 'High',
    notes: hasHoa ? 'HOA present - check fees and restrictions' : 'No HOA - maximum flexibility'
  };
}

/**
 * Field 31: hoa_fee_annual - Annual HOA Fees
 *
 * Scoring Logic (Florida Coastal):
 * - $0: 100 (No HOA)
 * - <$1,200/yr ($100/mo): 90
 * - $1,200-$2,400 ($100-200/mo): 75
 * - $2,400-$4,800 ($200-400/mo): 60
 * - $4,800-$7,200 ($400-600/mo): 40
 * - >$7,200 ($600+/mo): 20
 *
 * Note: High HOA may include valuable services (insurance, roof, exterior)
 */
export function normalizeHoaFeeAnnual(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'HOA fee unknown' };
  }

  const fee = parseFloat(String(value).replace(/[$,]/g, ''));
  if (isNaN(fee)) {
    return { score: 0, confidence: 'Low', notes: 'Invalid HOA fee format' };
  }

  const { hoa } = FLORIDA_COASTAL_THRESHOLDS;
  let score: number;
  let notes: string;

  if (fee === 0) {
    score = 100;
    notes = 'No HOA fees';
  } else if (fee < hoa.good) {
    score = 90;
    notes = `Low HOA: $${Math.round(fee/12)}/mo`;
  } else if (fee < hoa.fair) {
    score = 75;
    notes = `Moderate HOA: $${Math.round(fee/12)}/mo`;
  } else if (fee < hoa.poor) {
    score = 60;
    notes = `Above average HOA: $${Math.round(fee/12)}/mo`;
  } else if (fee < hoa.veryPoor) {
    score = 40;
    notes = `High HOA: $${Math.round(fee/12)}/mo - verify inclusions`;
  } else {
    score = 20;
    notes = `Very high HOA: $${Math.round(fee/12)}/mo - must justify with inclusions`;
  }

  return { score, confidence: 'High', notes };
}

/**
 * Field 33: hoa_includes - What HOA Fee Covers
 *
 * Scoring Logic:
 * - More inclusions = Higher value justification for HOA fee
 * - Key inclusions: Insurance, Roof, Exterior, Grounds, Pool, Security
 */
export function normalizeHoaIncludes(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'HOA inclusions unknown' };
  }

  const includes = String(value).toLowerCase();
  let score = 50; // Base score for having data
  const foundInclusions: string[] = [];

  // High-value inclusions (each adds significant points)
  const highValueItems = [
    { pattern: /insurance|hazard|flood/i, value: 15, label: 'Insurance' },
    { pattern: /roof|roofing/i, value: 12, label: 'Roof' },
    { pattern: /exterior|paint|stucco/i, value: 10, label: 'Exterior' },
    { pattern: /reserve|reserves/i, value: 8, label: 'Reserves' }
  ];

  // Medium-value inclusions
  const mediumValueItems = [
    { pattern: /pool|swimming/i, value: 6, label: 'Pool' },
    { pattern: /landscap|lawn|grounds/i, value: 5, label: 'Landscaping' },
    { pattern: /security|guard|gated/i, value: 5, label: 'Security' },
    { pattern: /trash|garbage|waste/i, value: 3, label: 'Trash' },
    { pattern: /water|irrigation/i, value: 3, label: 'Water' },
    { pattern: /cable|internet|wifi/i, value: 2, label: 'Cable/Internet' },
    { pattern: /clubhouse|fitness|gym/i, value: 4, label: 'Amenities' }
  ];

  [...highValueItems, ...mediumValueItems].forEach(item => {
    if (item.pattern.test(includes)) {
      score += item.value;
      foundInclusions.push(item.label);
    }
  });

  score = Math.min(100, score);

  return {
    score,
    confidence: foundInclusions.length > 0 ? 'Medium' : 'Low',
    notes: foundInclusions.length > 0
      ? `Includes: ${foundInclusions.join(', ')}`
      : 'Limited HOA inclusions identified'
  };
}

/**
 * Field 34: ownership_type - Ownership Structure
 *
 * Scoring Logic (Florida):
 * - Fee Simple: 100 (Full ownership)
 * - Condo: 80 (Own unit, shared common)
 * - Townhouse/TH: 85 (Own structure)
 * - Co-op: 50 (Share ownership)
 * - Leasehold: 30 (Limited duration)
 */
export function normalizeOwnershipType(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Ownership type unknown' };
  }

  const type = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (type.includes('fee simple') || type.includes('fee-simple')) {
    score = 100;
    notes = 'Fee Simple - full ownership';
  } else if (type.includes('townhouse') || type.includes('townhome') || type.includes('th')) {
    score = 85;
    notes = 'Townhouse ownership';
  } else if (type.includes('condo') || type.includes('condominium')) {
    score = 80;
    notes = 'Condominium - unit ownership';
  } else if (type.includes('co-op') || type.includes('cooperative') || type.includes('coop')) {
    score = 50;
    notes = 'Co-op - board approval required for sale';
  } else if (type.includes('lease') || type.includes('ground lease')) {
    score = 30;
    notes = 'Leasehold - check remaining term';
  } else {
    score = 60;
    notes = `Unknown ownership type: ${value}`;
  }

  return { score, confidence: 'High', notes };
}

/**
 * Field 35: annual_taxes - Annual Property Taxes
 *
 * Scoring Logic:
 * - Calculate effective tax rate if listing price available
 * - Otherwise use absolute thresholds
 *
 * Florida Context:
 * - Homestead exemption can save $500-1000+/yr
 * - Effective rates typically 1.5-2.5%
 */
export function normalizeAnnualTaxes(value: any, property?: Property): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Annual taxes unknown' };
  }

  const taxes = parseFloat(String(value).replace(/[$,]/g, ''));
  if (isNaN(taxes)) {
    return { score: 0, confidence: 'Low', notes: 'Invalid tax format' };
  }

  // Try to calculate effective rate
  const listingPrice = property?.address?.listingPrice?.value;

  if (listingPrice && listingPrice > 0) {
    const effectiveRate = (taxes / listingPrice) * 100;
    const { taxRate } = FLORIDA_COASTAL_THRESHOLDS;

    let score: number;
    let notes: string;

    if (effectiveRate < taxRate.excellent) {
      score = 100;
      notes = `Excellent tax rate: ${effectiveRate.toFixed(2)}%`;
    } else if (effectiveRate < taxRate.good) {
      score = 90;
      notes = `Good tax rate: ${effectiveRate.toFixed(2)}%`;
    } else if (effectiveRate < taxRate.fair) {
      score = 70;
      notes = `Average tax rate: ${effectiveRate.toFixed(2)}%`;
    } else if (effectiveRate < taxRate.poor) {
      score = 50;
      notes = `Above average taxes: ${effectiveRate.toFixed(2)}%`;
    } else {
      score = 30;
      notes = `High tax rate: ${effectiveRate.toFixed(2)}%`;
    }

    return { score, confidence: 'High', notes };
  }

  // Fallback: Use absolute thresholds
  const { taxes: taxThresholds } = FLORIDA_COASTAL_THRESHOLDS;
  let score: number;
  let notes: string;

  if (taxes < taxThresholds.excellent) {
    score = 100;
    notes = `Low taxes: $${taxes.toLocaleString()}/yr`;
  } else if (taxes < taxThresholds.good) {
    score = 85;
    notes = `Good taxes: $${taxes.toLocaleString()}/yr`;
  } else if (taxes < taxThresholds.fair) {
    score = 70;
    notes = `Average taxes: $${taxes.toLocaleString()}/yr`;
  } else if (taxes < taxThresholds.poor) {
    score = 50;
    notes = `Above average taxes: $${taxes.toLocaleString()}/yr`;
  } else {
    score = 30;
    notes = `High taxes: $${taxes.toLocaleString()}/yr`;
  }

  return { score, confidence: 'Medium', notes };
}

/**
 * Field 37: property_tax_rate - Millage/Tax Rate
 *
 * Scoring Logic:
 * - Lower rate = Better
 * - Florida typical: 15-25 mills (1.5-2.5%)
 */
export function normalizePropertyTaxRate(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Tax rate unknown' };
  }

  // Handle both percentage and millage
  let rate = parseFloat(String(value).replace(/[%]/g, ''));
  if (isNaN(rate)) {
    return { score: 0, confidence: 'Low', notes: 'Invalid tax rate format' };
  }

  // Convert millage to percentage if needed (millage > 5 likely mills)
  if (rate > 5) {
    rate = rate / 10; // Convert mills to percentage
  }

  const { taxRate } = FLORIDA_COASTAL_THRESHOLDS;
  let score: number;
  let notes: string;

  if (rate < taxRate.excellent) {
    score = 100;
    notes = `Excellent rate: ${rate.toFixed(2)}%`;
  } else if (rate < taxRate.good) {
    score = 85;
    notes = `Good rate: ${rate.toFixed(2)}%`;
  } else if (rate < taxRate.fair) {
    score = 70;
    notes = `Average rate: ${rate.toFixed(2)}%`;
  } else if (rate < taxRate.poor) {
    score = 50;
    notes = `Above average rate: ${rate.toFixed(2)}%`;
  } else {
    score = 30;
    notes = `High rate: ${rate.toFixed(2)}%`;
  }

  return { score, confidence: 'High', notes };
}

/**
 * Field 38: tax_exemptions - Tax Exemptions Available
 *
 * Scoring Logic:
 * - Homestead exemption = Major savings ($500-1000+/yr)
 * - Senior exemptions = Additional savings
 * - Multiple exemptions = Higher score
 */
export function normalizeTaxExemptions(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 50, confidence: 'Low', notes: 'Tax exemption status unknown' };
  }

  const exemptions = String(value).toLowerCase();
  let score = 50;
  const foundExemptions: string[] = [];

  // Check for various exemptions
  if (exemptions.includes('homestead')) {
    score += 30;
    foundExemptions.push('Homestead');
  }
  if (exemptions.includes('senior') || exemptions.includes('65+') || exemptions.includes('elderly')) {
    score += 15;
    foundExemptions.push('Senior');
  }
  if (exemptions.includes('veteran') || exemptions.includes('military') || exemptions.includes('disabled')) {
    score += 15;
    foundExemptions.push('Veteran/Disabled');
  }
  if (exemptions.includes('widow') || exemptions.includes('widower')) {
    score += 10;
    foundExemptions.push('Widow(er)');
  }
  if (exemptions.includes('none') || exemptions.includes('no exemption')) {
    score = 40;
    foundExemptions.push('None currently');
  }

  score = Math.min(100, score);

  return {
    score,
    confidence: foundExemptions.length > 0 ? 'Medium' : 'Low',
    notes: foundExemptions.length > 0
      ? `Exemptions: ${foundExemptions.join(', ')}`
      : 'Exemption eligibility should be verified'
  };
}

// ============================================================
// SECTION E: STRUCTURE & SYSTEMS (Fields 39-48)
// Section Weight: 7% (Industry Standard)
// ============================================================

/**
 * Field 39: roof_type - Roofing Material
 *
 * Scoring Logic (Florida Coastal):
 * - Tile: 100 (Best for hurricanes, longest life)
 * - Metal: 95 (Excellent durability, wind resistance)
 * - Shingle (Architectural/Dimensional): 80
 * - Shingle (3-tab): 60
 * - Flat/Built-up: 50 (Common but maintenance-heavy)
 */
export function normalizeRoofType(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Roof type unknown' };
  }

  const roofType = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (roofType.includes('tile') || roofType.includes('clay') || roofType.includes('concrete tile')) {
    score = 100;
    notes = 'Tile roof - excellent for FL hurricanes, 50+ year lifespan';
  } else if (roofType.includes('metal') || roofType.includes('standing seam')) {
    score = 95;
    notes = 'Metal roof - excellent wind resistance, 40-70 year lifespan';
  } else if (roofType.includes('slate')) {
    score = 95;
    notes = 'Slate roof - premium material, 100+ year lifespan';
  } else if (roofType.includes('architectural') || roofType.includes('dimensional')) {
    score = 80;
    notes = 'Architectural shingle - 25-30 year lifespan';
  } else if (roofType.includes('shingle') || roofType.includes('asphalt')) {
    score = 60;
    notes = 'Standard shingle - 15-20 year lifespan in FL climate';
  } else if (roofType.includes('flat') || roofType.includes('built-up') || roofType.includes('roll')) {
    score = 50;
    notes = 'Flat roof - requires regular maintenance in FL';
  } else if (roofType.includes('wood') || roofType.includes('shake')) {
    score = 40;
    notes = 'Wood shake - fire/termite concerns in FL';
  } else {
    score = 55;
    notes = `Unknown roof type: ${value}`;
  }

  return { score, confidence: 'High', notes };
}

/**
 * Field 40: roof_age_est - Estimated Roof Age
 *
 * Scoring Logic:
 * - New (0-3 years): 100
 * - Good (4-7 years): 85
 * - Fair (8-12 years): 70
 * - Aging (13-20 years): 45
 * - Old (20+ years): 20
 *
 * Florida Context: Roof replacement = $15,000-40,000+
 * Insurance companies increasingly strict on roofs >15 years
 */
export function normalizeRoofAge(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Roof age unknown - request inspection' };
  }

  // Parse various formats: "5 years", "2019", "5", etc.
  const valueStr = String(value).toLowerCase();
  let age: number;

  if (valueStr.includes('new') || valueStr.includes('replaced')) {
    age = 0;
  } else if (/^\d{4}$/.test(valueStr.trim())) {
    // It's a year
    age = new Date().getFullYear() - parseInt(valueStr);
  } else {
    // Try to extract number
    const match = valueStr.match(/(\d+)/);
    age = match ? parseInt(match[1]) : NaN;
  }

  if (isNaN(age) || age < 0) {
    return { score: 50, confidence: 'Low', notes: 'Could not parse roof age' };
  }

  const { roofAge } = FLORIDA_COASTAL_THRESHOLDS;
  let score: number;
  let notes: string;

  if (age <= roofAge.new) {
    score = 100;
    notes = `New roof (${age} years) - excellent condition expected`;
  } else if (age <= roofAge.good) {
    score = 85;
    notes = `Good roof age (${age} years) - should have 15+ years remaining`;
  } else if (age <= roofAge.fair) {
    score = 70;
    notes = `Moderate roof age (${age} years) - plan for replacement in 10 years`;
  } else if (age <= roofAge.poor) {
    score = 45;
    notes = `Aging roof (${age} years) - may affect insurance, plan for replacement`;
  } else {
    score = 20;
    notes = `Old roof (${age}+ years) - likely needs replacement soon, insurance concerns`;
  }

  return { score, confidence: 'Medium', notes };
}

/**
 * Field 41: exterior_material - Exterior Wall Material
 *
 * Scoring Logic (Florida Coastal):
 * - Block/Stucco: 100 (Hurricane resistant, termite proof)
 * - Brick: 95 (Durable, low maintenance)
 * - Fiber Cement: 85 (Durable, hurricane resistant)
 * - Vinyl Siding: 60 (Common, but can damage in storms)
 * - Wood: 40 (Termite/moisture concerns in FL)
 */
export function normalizeExteriorMaterial(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Exterior material unknown' };
  }

  const material = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (material.includes('block') || material.includes('stucco') || material.includes('cbs') || material.includes('concrete')) {
    score = 100;
    notes = 'Block/Stucco - excellent for FL (hurricane resistant, termite proof)';
  } else if (material.includes('brick')) {
    score = 95;
    notes = 'Brick exterior - durable, low maintenance';
  } else if (material.includes('fiber cement') || material.includes('hardie') || material.includes('cement board')) {
    score = 85;
    notes = 'Fiber cement - durable, hurricane resistant';
  } else if (material.includes('vinyl') || material.includes('siding')) {
    score = 60;
    notes = 'Vinyl siding - may damage in strong storms';
  } else if (material.includes('aluminum')) {
    score = 55;
    notes = 'Aluminum siding - dated, may dent';
  } else if (material.includes('wood') || material.includes('cedar') || material.includes('shake')) {
    score = 40;
    notes = 'Wood exterior - termite and moisture concerns in FL';
  } else {
    score = 60;
    notes = `Unknown exterior: ${value}`;
  }

  return { score, confidence: 'High', notes };
}

/**
 * Field 42: foundation - Foundation Type
 *
 * Scoring Logic (Florida):
 * - Slab: 100 (Standard FL construction, no flood entry points)
 * - Elevated/Pilings: 90 (Required in flood zones, good protection)
 * - Crawl Space: 50 (Moisture/termite concerns in FL)
 * - Basement: 30 (Rare in FL, flood risk)
 */
export function normalizeFoundation(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Foundation type unknown' };
  }

  const foundation = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (foundation.includes('slab') || foundation.includes('concrete slab')) {
    score = 100;
    notes = 'Slab foundation - standard FL construction, excellent';
  } else if (foundation.includes('piling') || foundation.includes('stilt') || foundation.includes('elevated') || foundation.includes('pier')) {
    score = 90;
    notes = 'Elevated/Pilings - excellent flood protection';
  } else if (foundation.includes('crawl') || foundation.includes('crawlspace')) {
    score = 50;
    notes = 'Crawl space - monitor for moisture/termites in FL climate';
  } else if (foundation.includes('basement')) {
    score = 30;
    notes = 'Basement - unusual in FL, verify flood/moisture protection';
  } else {
    score = 60;
    notes = `Unknown foundation: ${value}`;
  }

  return { score, confidence: 'High', notes };
}

/**
 * Field 43: water_heater_type - Water Heater Type
 *
 * Scoring Logic:
 * - Tankless: 100 (Energy efficient, endless hot water)
 * - Solar: 95 (Great for FL sunshine)
 * - Heat Pump: 90 (Energy efficient for FL climate)
 * - Electric Tank: 60 (Standard, higher operating cost)
 * - Gas Tank: 70 (Faster recovery)
 */
export function normalizeWaterHeaterType(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Water heater type unknown' };
  }

  const heater = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (heater.includes('tankless') || heater.includes('on-demand') || heater.includes('instant')) {
    score = 100;
    notes = 'Tankless water heater - energy efficient, endless hot water';
  } else if (heater.includes('solar')) {
    score = 95;
    notes = 'Solar water heater - excellent for FL, low operating cost';
  } else if (heater.includes('heat pump') || heater.includes('hybrid')) {
    score = 90;
    notes = 'Heat pump water heater - energy efficient for FL climate';
  } else if (heater.includes('gas') || heater.includes('propane') || heater.includes('natural gas')) {
    score = 70;
    notes = 'Gas water heater - faster recovery time';
  } else if (heater.includes('electric') || heater.includes('tank')) {
    score = 60;
    notes = 'Electric tank water heater - standard, higher operating cost';
  } else {
    score = 55;
    notes = `Unknown water heater: ${value}`;
  }

  return { score, confidence: 'Medium', notes };
}

/**
 * Field 44: garage_type - Garage Type
 *
 * Scoring Logic:
 * - Attached: 100 (Convenience, climate control)
 * - Detached: 80 (Good, but less convenient)
 * - Carport: 50 (Minimal protection)
 * - None: 30 (No covered parking)
 */
export function normalizeGarageType(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Garage type unknown' };
  }

  const garage = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (garage.includes('attached')) {
    score = 100;
    notes = 'Attached garage - maximum convenience';
  } else if (garage.includes('detached')) {
    score = 80;
    notes = 'Detached garage - good vehicle protection';
  } else if (garage.includes('carport')) {
    score = 50;
    notes = 'Carport - minimal vehicle protection';
  } else if (garage.includes('none') || garage.includes('no garage')) {
    score = 30;
    notes = 'No garage - limited vehicle protection';
  } else {
    score = 60;
    notes = `Garage type: ${value}`;
  }

  return { score, confidence: 'Medium', notes };
}

/**
 * Field 45: hvac_type - HVAC System Type
 *
 * Scoring Logic (Florida - AC is critical):
 * - Central Air (Heat Pump): 100 (Most efficient for FL)
 * - Central Air (Electric): 90
 * - Central Air (Gas): 85 (Gas less common in FL)
 * - Mini-Split/Ductless: 85 (Efficient, zone control)
 * - Window Units: 30 (Inadequate for FL heat)
 */
export function normalizeHvacType(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'HVAC type unknown - critical for FL' };
  }

  const hvac = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (hvac.includes('heat pump') && hvac.includes('central')) {
    score = 100;
    notes = 'Central heat pump - most efficient for FL climate';
  } else if (hvac.includes('central') && (hvac.includes('electric') || hvac.includes('a/c') || hvac.includes('air'))) {
    score = 90;
    notes = 'Central AC/Electric - standard FL system';
  } else if (hvac.includes('central') && hvac.includes('gas')) {
    score = 85;
    notes = 'Central gas HVAC - good heating, standard cooling';
  } else if (hvac.includes('mini') || hvac.includes('split') || hvac.includes('ductless')) {
    score = 85;
    notes = 'Mini-split/Ductless - efficient zone control';
  } else if (hvac.includes('central')) {
    score = 85;
    notes = 'Central HVAC system';
  } else if (hvac.includes('window') || hvac.includes('wall unit') || hvac.includes('ptac')) {
    score = 30;
    notes = 'Window/Wall units - may be inadequate for FL heat';
  } else if (hvac.includes('none')) {
    score = 10;
    notes = 'No HVAC - critical concern for FL';
  } else {
    score = 60;
    notes = `HVAC: ${value}`;
  }

  return { score, confidence: 'Medium', notes };
}

/**
 * Field 46: hvac_age - HVAC System Age
 *
 * Scoring Logic:
 * - New (0-3 years): 100
 * - Good (4-7 years): 85
 * - Fair (8-12 years): 65
 * - Aging (13-15 years): 40
 * - Old (15+ years): 20
 *
 * Florida Context: HVAC replacement = $5,000-15,000
 * Systems work harder in FL, shorter lifespan
 */
export function normalizeHvacAge(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'HVAC age unknown' };
  }

  const valueStr = String(value).toLowerCase();
  let age: number;

  if (valueStr.includes('new') || valueStr.includes('replaced')) {
    age = 0;
  } else if (/^\d{4}$/.test(valueStr.trim())) {
    age = new Date().getFullYear() - parseInt(valueStr);
  } else {
    const match = valueStr.match(/(\d+)/);
    age = match ? parseInt(match[1]) : NaN;
  }

  if (isNaN(age) || age < 0) {
    return { score: 50, confidence: 'Low', notes: 'Could not parse HVAC age' };
  }

  const { hvacAge } = FLORIDA_COASTAL_THRESHOLDS;
  let score: number;
  let notes: string;

  if (age <= hvacAge.new) {
    score = 100;
    notes = `New HVAC (${age} years) - excellent efficiency`;
  } else if (age <= hvacAge.good) {
    score = 85;
    notes = `Good HVAC age (${age} years) - 8+ years remaining`;
  } else if (age <= hvacAge.fair) {
    score = 65;
    notes = `Moderate HVAC age (${age} years) - plan for replacement`;
  } else if (age <= hvacAge.poor) {
    score = 40;
    notes = `Aging HVAC (${age} years) - replacement likely within 3 years`;
  } else {
    score = 20;
    notes = `Old HVAC (${age}+ years) - budget $8,000-15,000 for replacement`;
  }

  return { score, confidence: 'Medium', notes };
}

/**
 * Field 47: laundry_type - Laundry Setup
 *
 * Scoring Logic:
 * - In-unit (washer/dryer): 100
 * - In-unit (hookups only): 85
 * - In-building shared: 50
 * - Community laundry: 30
 * - None: 20
 */
export function normalizeLaundryType(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Laundry type unknown' };
  }

  const laundry = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (laundry.includes('in-unit') || laundry.includes('inside') ||
      (laundry.includes('washer') && laundry.includes('dryer') && !laundry.includes('hookup'))) {
    score = 100;
    notes = 'In-unit washer/dryer included';
  } else if (laundry.includes('hookup') || laundry.includes('hook-up') || laundry.includes('connection')) {
    score = 85;
    notes = 'Washer/dryer hookups - appliances not included';
  } else if (laundry.includes('shared') || laundry.includes('building') || laundry.includes('common')) {
    score = 50;
    notes = 'Shared laundry facilities';
  } else if (laundry.includes('community') || laundry.includes('complex')) {
    score = 30;
    notes = 'Community laundry - less convenient';
  } else if (laundry.includes('none') || laundry.includes('no laundry')) {
    score = 20;
    notes = 'No laundry facilities';
  } else {
    score = 60;
    notes = `Laundry: ${value}`;
  }

  return { score, confidence: 'Medium', notes };
}

/**
 * Field 48: interior_condition - Overall Interior Condition
 *
 * Scoring Logic:
 * - Excellent/New: 100
 * - Renovated/Updated: 95
 * - Good: 80
 * - Fair: 55
 * - Needs Work: 30
 * - Poor: 15
 */
export function normalizeInteriorCondition(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Interior condition unknown' };
  }

  const condition = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (condition.includes('excellent') || condition.includes('new') || condition.includes('pristine')) {
    score = 100;
    notes = 'Excellent/New interior condition';
  } else if (condition.includes('renovated') || condition.includes('updated') || condition.includes('remodel')) {
    score = 95;
    notes = 'Recently renovated/updated';
  } else if (condition.includes('good') || condition.includes('well maintain')) {
    score = 80;
    notes = 'Good interior condition';
  } else if (condition.includes('fair') || condition.includes('average') || condition.includes('dated')) {
    score = 55;
    notes = 'Fair condition - may benefit from updates';
  } else if (condition.includes('needs work') || condition.includes('fixer') || condition.includes('tlc')) {
    score = 30;
    notes = 'Needs work - budget for renovations';
  } else if (condition.includes('poor') || condition.includes('distressed')) {
    score = 15;
    notes = 'Poor condition - significant renovation required';
  } else {
    score = 60;
    notes = `Interior condition: ${value}`;
  }

  return { score, confidence: 'Medium', notes };
}

// ============================================================
// SECTION J: LOCATION SCORES (Fields 74, 75, 76, 77, 78, 79, 81, 82)
// Section Weight: 5% (Industry Standard)
// ============================================================

/**
 * Field 74: walk_score - Walk Score (0-100)
 *
 * Scoring Logic:
 * - Already 0-100, pass through with context
 * - Florida coastal context: Lower walk scores common, car-dependent areas
 */
export function normalizeWalkScore(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Walk Score unknown' };
  }

  const score = Number(value);
  if (isNaN(score)) {
    return { score: 0, confidence: 'Low', notes: 'Invalid Walk Score format' };
  }

  const normalizedScore = Math.min(100, Math.max(0, score));
  let category: string;

  if (normalizedScore >= 90) category = "Walker's Paradise";
  else if (normalizedScore >= 70) category = 'Very Walkable';
  else if (normalizedScore >= 50) category = 'Somewhat Walkable';
  else if (normalizedScore >= 25) category = 'Car-Dependent';
  else category = 'Almost All Errands Require Car';

  return {
    score: normalizedScore,
    confidence: 'High',
    notes: `Walk Score: ${normalizedScore} - ${category}`
  };
}

/**
 * Field 75: transit_score - Transit Score (0-100)
 *
 * Scoring Logic:
 * - Already 0-100, pass through
 * - Florida context: Most areas have limited public transit
 */
export function normalizeTransitScore(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Transit Score unknown' };
  }

  const score = Number(value);
  if (isNaN(score)) {
    return { score: 0, confidence: 'Low', notes: 'Invalid Transit Score format' };
  }

  const normalizedScore = Math.min(100, Math.max(0, score));
  let category: string;

  if (normalizedScore >= 90) category = 'Excellent Transit';
  else if (normalizedScore >= 70) category = 'Excellent Transit';
  else if (normalizedScore >= 50) category = 'Good Transit';
  else if (normalizedScore >= 25) category = 'Some Transit';
  else category = 'Minimal Transit';

  return {
    score: normalizedScore,
    confidence: 'High',
    notes: `Transit Score: ${normalizedScore} - ${category}`
  };
}

/**
 * Field 76: bike_score - Bike Score (0-100)
 *
 * Scoring Logic:
 * - Already 0-100, pass through
 */
export function normalizeBikeScore(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Bike Score unknown' };
  }

  const score = Number(value);
  if (isNaN(score)) {
    return { score: 0, confidence: 'Low', notes: 'Invalid Bike Score format' };
  }

  const normalizedScore = Math.min(100, Math.max(0, score));
  let category: string;

  if (normalizedScore >= 90) category = "Biker's Paradise";
  else if (normalizedScore >= 70) category = 'Very Bikeable';
  else if (normalizedScore >= 50) category = 'Bikeable';
  else category = 'Minimal Bike Infrastructure';

  return {
    score: normalizedScore,
    confidence: 'High',
    notes: `Bike Score: ${normalizedScore} - ${category}`
  };
}

/**
 * Field 77: safety_score - Neighborhood Safety Score
 *
 * Scoring Logic:
 * - Already 0-100 (or convert from other scale)
 */
export function normalizeSafetyScore(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Safety Score unknown' };
  }

  let score = Number(value);
  if (isNaN(score)) {
    // Try parsing text descriptors
    const text = String(value).toLowerCase();
    if (text.includes('excellent') || text.includes('very safe')) score = 95;
    else if (text.includes('good') || text.includes('safe')) score = 80;
    else if (text.includes('average') || text.includes('moderate')) score = 60;
    else if (text.includes('below average') || text.includes('caution')) score = 40;
    else if (text.includes('poor') || text.includes('unsafe')) score = 20;
    else return { score: 50, confidence: 'Low', notes: 'Could not parse safety score' };
  }

  // Handle scales other than 0-100
  if (score <= 10) score = score * 10; // Assume 0-10 scale

  const normalizedScore = Math.min(100, Math.max(0, score));

  return {
    score: normalizedScore,
    confidence: 'Medium',
    notes: normalizedScore >= 70 ? 'Good safety rating' : 'Review crime statistics'
  };
}

/**
 * Field 78: noise_level - Ambient Noise Level
 *
 * Scoring Logic:
 * - Quiet/Low: 100
 * - Moderate: 70
 * - Loud/High: 30
 *
 * Lower noise = Better for most buyers
 */
export function normalizeNoiseLevel(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Noise level unknown' };
  }

  const noise = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (noise.includes('quiet') || noise.includes('low') || noise.includes('peaceful') || noise.includes('silent')) {
    score = 100;
    notes = 'Quiet/peaceful area';
  } else if (noise.includes('moderate') || noise.includes('average') || noise.includes('normal')) {
    score = 70;
    notes = 'Moderate noise levels';
  } else if (noise.includes('busy') || noise.includes('active')) {
    score = 55;
    notes = 'Active/busy area';
  } else if (noise.includes('loud') || noise.includes('high') || noise.includes('noisy')) {
    score = 30;
    notes = 'High noise levels - verify sources';
  } else {
    // Try to parse dB if provided
    const dbMatch = noise.match(/(\d+)\s*db/i);
    if (dbMatch) {
      const db = parseInt(dbMatch[1]);
      if (db < 40) { score = 100; notes = `Very quiet: ${db}dB`; }
      else if (db < 55) { score = 85; notes = `Quiet: ${db}dB`; }
      else if (db < 65) { score = 70; notes = `Moderate: ${db}dB`; }
      else if (db < 75) { score = 50; notes = `Noisy: ${db}dB`; }
      else { score = 25; notes = `Very noisy: ${db}dB`; }
    } else {
      score = 60;
      notes = `Noise level: ${value}`;
    }
  }

  return { score, confidence: 'Medium', notes };
}

/**
 * Field 79: traffic_level - Traffic Congestion Level
 *
 * Scoring Logic:
 * - Light: 100
 * - Moderate: 70
 * - Heavy: 35
 */
export function normalizeTrafficLevel(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Traffic level unknown' };
  }

  const traffic = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (traffic.includes('light') || traffic.includes('low') || traffic.includes('minimal')) {
    score = 100;
    notes = 'Light traffic area';
  } else if (traffic.includes('moderate') || traffic.includes('average') || traffic.includes('normal')) {
    score = 70;
    notes = 'Moderate traffic';
  } else if (traffic.includes('heavy') || traffic.includes('high') || traffic.includes('congested')) {
    score = 35;
    notes = 'Heavy traffic - may impact commute times';
  } else if (traffic.includes('rush hour') || traffic.includes('peak')) {
    score = 55;
    notes = 'Peak hour congestion';
  } else {
    score = 60;
    notes = `Traffic level: ${value}`;
  }

  return { score, confidence: 'Medium', notes };
}

/**
 * Field 81: public_transit_access - Public Transit Access Description
 *
 * Scoring Logic:
 * - Multiple options nearby: 100
 * - Single bus line: 60
 * - Limited/None: 30
 */
export function normalizePublicTransitAccess(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Transit access unknown' };
  }

  const transit = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (transit.includes('rail') || transit.includes('metro') || transit.includes('subway') || transit.includes('trolley')) {
    score = 100;
    notes = 'Rail/Metro access available';
  } else if (transit.includes('multiple') || transit.includes('several') || transit.includes('excellent')) {
    score = 95;
    notes = 'Multiple transit options';
  } else if (transit.includes('bus') && (transit.includes('frequent') || transit.includes('regular'))) {
    score = 75;
    notes = 'Regular bus service available';
  } else if (transit.includes('bus')) {
    score = 60;
    notes = 'Bus service available';
  } else if (transit.includes('limited') || transit.includes('minimal')) {
    score = 35;
    notes = 'Limited transit access';
  } else if (transit.includes('none') || transit.includes('no public')) {
    score = 20;
    notes = 'No public transit access';
  } else {
    score = 50;
    notes = `Transit: ${value}`;
  }

  return { score, confidence: 'Medium', notes };
}

/**
 * Field 82: commute_to_city_center - Commute Time to City Center
 *
 * Scoring Logic:
 * - <15 min: 100
 * - 15-30 min: 85
 * - 30-45 min: 65
 * - 45-60 min: 45
 * - >60 min: 25
 */
export function normalizeCommuteToCityCenter(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Commute time unknown' };
  }

  const commute = String(value).toLowerCase();
  let minutes: number;

  // Parse various formats
  const minMatch = commute.match(/(\d+)\s*min/i);
  const hourMatch = commute.match(/(\d+)\s*(?:hour|hr)/i);

  if (minMatch) {
    minutes = parseInt(minMatch[1]);
    if (hourMatch) {
      minutes += parseInt(hourMatch[1]) * 60;
    }
  } else if (hourMatch) {
    minutes = parseInt(hourMatch[1]) * 60;
  } else {
    // Try plain number
    const num = parseInt(commute);
    if (!isNaN(num)) {
      minutes = num > 5 ? num : num * 60; // Assume hours if <= 5
    } else {
      return { score: 50, confidence: 'Low', notes: 'Could not parse commute time' };
    }
  }

  let score: number;
  let notes: string;

  if (minutes <= 15) {
    score = 100;
    notes = `Excellent commute: ${minutes} minutes to city center`;
  } else if (minutes <= 30) {
    score = 85;
    notes = `Good commute: ${minutes} minutes to city center`;
  } else if (minutes <= 45) {
    score = 65;
    notes = `Moderate commute: ${minutes} minutes to city center`;
  } else if (minutes <= 60) {
    score = 45;
    notes = `Long commute: ${minutes} minutes to city center`;
  } else {
    score = 25;
    notes = `Very long commute: ${minutes}+ minutes to city center`;
  }

  return { score, confidence: 'Medium', notes };
}

// ============================================================
// SECTION O: ENVIRONMENT & RISK (Fields 117-130)
// Section Weight: 9% (Industry Standard)
// CRITICAL FOR FLORIDA COASTAL REAL ESTATE
// ============================================================

/**
 * Field 117: air_quality_index - Air Quality Index (AQI)
 *
 * Scoring Logic (EPA AQI Scale):
 * - 0-50 Good: 100
 * - 51-100 Moderate: 80
 * - 101-150 Unhealthy for Sensitive: 55
 * - 151-200 Unhealthy: 30
 * - 201+ Very Unhealthy/Hazardous: 10
 */
export function normalizeAirQualityIndex(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'AQI unknown' };
  }

  const aqi = Number(value);
  if (isNaN(aqi)) {
    return { score: 50, confidence: 'Low', notes: 'Could not parse AQI' };
  }

  let score: number;
  let notes: string;

  if (aqi <= 50) {
    score = 100;
    notes = `Good air quality (AQI: ${aqi})`;
  } else if (aqi <= 100) {
    score = 80;
    notes = `Moderate air quality (AQI: ${aqi})`;
  } else if (aqi <= 150) {
    score = 55;
    notes = `Unhealthy for sensitive groups (AQI: ${aqi})`;
  } else if (aqi <= 200) {
    score = 30;
    notes = `Unhealthy air quality (AQI: ${aqi})`;
  } else {
    score = 10;
    notes = `Very unhealthy/hazardous (AQI: ${aqi})`;
  }

  return { score, confidence: 'High', notes };
}

/**
 * Field 118: air_quality_grade - Air Quality Letter Grade
 *
 * Scoring Logic:
 * - A: 100
 * - B: 80
 * - C: 60
 * - D: 40
 * - F: 20
 */
export function normalizeAirQualityGrade(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Air quality grade unknown' };
  }

  const grade = String(value).toUpperCase().charAt(0);
  let score: number;
  let notes: string;

  switch (grade) {
    case 'A':
      score = 100;
      notes = 'Excellent air quality (Grade A)';
      break;
    case 'B':
      score = 80;
      notes = 'Good air quality (Grade B)';
      break;
    case 'C':
      score = 60;
      notes = 'Moderate air quality (Grade C)';
      break;
    case 'D':
      score = 40;
      notes = 'Below average air quality (Grade D)';
      break;
    case 'F':
      score = 20;
      notes = 'Poor air quality (Grade F)';
      break;
    default:
      score = 50;
      notes = `Air quality grade: ${value}`;
  }

  return { score, confidence: 'High', notes };
}

/**
 * Field 119: flood_zone - FEMA Flood Zone Designation
 *
 * Scoring Logic (CRITICAL FOR FL):
 * Based on FEMA flood insurance premium implications
 *
 * Zone X/C: 100 (Minimal risk, ~$450/yr insurance)
 * Zone X500: 85 (0.2% annual chance, moderate risk)
 * Zone B: 80 (Moderate risk)
 * Zone A/AE/AO/AH: 30 (High risk, ~$2,500+/yr insurance)
 * Zone V/VE/VH: 10 (Coastal high hazard, ~$5,000+/yr insurance)
 */
export function normalizeFloodZone(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'FLOOD ZONE UNKNOWN - Critical for FL insurance' };
  }

  const zone = String(value).toUpperCase().replace(/\s/g, '');
  let score: number;
  let notes: string;

  // Zone X variations (minimal flood risk)
  if (zone === 'X' || zone === 'C' || zone.includes('X(SHADED)') || zone === 'ZONEX') {
    score = 100;
    notes = 'Zone X - Minimal flood risk (~$450/yr flood insurance)';
  }
  // Zone X500 (500-year flood plain)
  else if (zone.includes('X500') || zone.includes('500')) {
    score = 85;
    notes = 'Zone X500 - 0.2% annual flood chance';
  }
  // Zone B (moderate risk)
  else if (zone === 'B') {
    score = 80;
    notes = 'Zone B - Moderate flood risk';
  }
  // Zone A variations (high risk, 1% annual chance)
  else if (zone.startsWith('A') || zone === 'AE' || zone === 'AO' || zone === 'AH' || zone === 'AR') {
    score = 30;
    notes = `Zone ${zone} - HIGH flood risk (~$2,500+/yr insurance required)`;
  }
  // Zone V variations (coastal high hazard, wave action)
  else if (zone.startsWith('V') || zone === 'VE' || zone === 'VH') {
    score = 10;
    notes = `Zone ${zone} - COASTAL HIGH HAZARD (~$5,000+/yr insurance, wave action risk)`;
  }
  // Zone D (undetermined)
  else if (zone === 'D') {
    score = 50;
    notes = 'Zone D - Undetermined flood risk (request LOMA/LOMR)';
  }
  else {
    score = 50;
    notes = `Unknown flood zone: ${value} - verify with FEMA`;
  }

  return { score, confidence: 'High', notes };
}

/**
 * Field 120: flood_risk_level - Descriptive Flood Risk
 *
 * Scoring Logic:
 * - Minimal/Very Low: 100
 * - Low: 85
 * - Moderate: 55
 * - High: 25
 * - Very High/Extreme: 10
 */
export function normalizeFloodRiskLevel(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Flood risk level unknown' };
  }

  const risk = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (risk.includes('minimal') || risk.includes('very low') || risk.includes('negligible')) {
    score = 100;
    notes = 'Minimal flood risk';
  } else if (risk.includes('low')) {
    score = 85;
    notes = 'Low flood risk';
  } else if (risk.includes('moderate') || risk.includes('medium')) {
    score = 55;
    notes = 'Moderate flood risk - verify insurance costs';
  } else if (risk.includes('high') && !risk.includes('very')) {
    score = 25;
    notes = 'HIGH flood risk - expect elevated insurance';
  } else if (risk.includes('very high') || risk.includes('extreme') || risk.includes('severe')) {
    score = 10;
    notes = 'EXTREME flood risk - major insurance/safety concern';
  } else {
    score = 50;
    notes = `Flood risk: ${value}`;
  }

  return { score, confidence: 'Medium', notes };
}

/**
 * Field 121: climate_risk - Overall Climate Risk Assessment
 *
 * Composite risk considering multiple climate factors
 */
export function normalizeClimateRisk(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Climate risk unknown' };
  }

  const risk = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (risk.includes('minimal') || risk.includes('very low')) {
    score = 100;
    notes = 'Minimal overall climate risk';
  } else if (risk.includes('low')) {
    score = 85;
    notes = 'Low climate risk';
  } else if (risk.includes('moderate') || risk.includes('medium')) {
    score = 60;
    notes = 'Moderate climate risk';
  } else if (risk.includes('high') && !risk.includes('very')) {
    score = 30;
    notes = 'High climate risk - review specific hazards';
  } else if (risk.includes('very high') || risk.includes('extreme') || risk.includes('severe')) {
    score = 15;
    notes = 'Very high climate risk';
  } else {
    // Try to parse numeric score
    const num = parseFloat(risk);
    if (!isNaN(num)) {
      score = Math.max(0, Math.min(100, 100 - num));
      notes = `Climate risk score: ${num}`;
    } else {
      score = 50;
      notes = `Climate risk: ${value}`;
    }
  }

  return { score, confidence: 'Medium', notes };
}

/**
 * Field 122: wildfire_risk - Wildfire Risk Level
 *
 * Florida Context: Generally low except for inland wooded areas
 */
export function normalizeWildfireRisk(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Wildfire risk unknown' };
  }

  const risk = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (risk.includes('minimal') || risk.includes('very low') || risk.includes('none')) {
    score = 100;
    notes = 'Minimal wildfire risk (typical for FL coastal)';
  } else if (risk.includes('low')) {
    score = 90;
    notes = 'Low wildfire risk';
  } else if (risk.includes('moderate') || risk.includes('medium')) {
    score = 65;
    notes = 'Moderate wildfire risk - check defensible space';
  } else if (risk.includes('high') && !risk.includes('very')) {
    score = 35;
    notes = 'High wildfire risk - verify insurance/mitigation';
  } else if (risk.includes('very high') || risk.includes('extreme')) {
    score = 15;
    notes = 'Very high wildfire risk - significant concern';
  } else {
    score = 75; // Default to good for FL
    notes = `Wildfire risk: ${value}`;
  }

  return { score, confidence: 'Medium', notes };
}

/**
 * Field 123: earthquake_risk - Earthquake Risk Level
 *
 * Florida Context: Very low seismic activity
 */
export function normalizeEarthquakeRisk(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    // Florida default: assume very low
    return { score: 95, confidence: 'Medium', notes: 'Earthquake risk: Very low (FL typical)' };
  }

  const risk = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (risk.includes('minimal') || risk.includes('very low') || risk.includes('none') || risk.includes('negligible')) {
    score = 100;
    notes = 'Minimal earthquake risk (typical for FL)';
  } else if (risk.includes('low')) {
    score = 90;
    notes = 'Low earthquake risk';
  } else if (risk.includes('moderate') || risk.includes('medium')) {
    score = 60;
    notes = 'Moderate earthquake risk';
  } else if (risk.includes('high')) {
    score = 30;
    notes = 'High earthquake risk - unusual for FL';
  } else {
    score = 90; // FL default
    notes = `Earthquake risk: ${value}`;
  }

  return { score, confidence: 'High', notes };
}

/**
 * Field 124: hurricane_risk - Hurricane Risk Level
 *
 * CRITICAL FOR FLORIDA COASTAL
 * All coastal FL has some hurricane risk - score relative
 */
export function normalizeHurricaneRisk(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    // Default for FL coastal: assume moderate-high
    return { score: 40, confidence: 'Low', notes: 'Hurricane risk unknown - FL coastal typically moderate-high' };
  }

  const risk = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (risk.includes('minimal') || risk.includes('very low')) {
    score = 100;
    notes = 'Minimal hurricane risk (inland FL)';
  } else if (risk.includes('low')) {
    score = 85;
    notes = 'Low hurricane risk (favorable for FL)';
  } else if (risk.includes('moderate') || risk.includes('medium')) {
    score = 55;
    notes = 'Moderate hurricane risk (typical FL coastal)';
  } else if (risk.includes('high') && !risk.includes('very') && !risk.includes('extreme')) {
    score = 35;
    notes = 'High hurricane risk - verify impact windows/shutters';
  } else if (risk.includes('very high') || risk.includes('extreme')) {
    score = 15;
    notes = 'Very high hurricane risk - critical insurance consideration';
  } else {
    score = 50;
    notes = `Hurricane risk: ${value}`;
  }

  return { score, confidence: 'Medium', notes };
}

/**
 * Field 125: tornado_risk - Tornado Risk Level
 *
 * Florida Context: Florida has notable tornado activity
 */
export function normalizeTornadoRisk(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Tornado risk unknown' };
  }

  const risk = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (risk.includes('minimal') || risk.includes('very low')) {
    score = 100;
    notes = 'Minimal tornado risk';
  } else if (risk.includes('low')) {
    score = 85;
    notes = 'Low tornado risk';
  } else if (risk.includes('moderate') || risk.includes('medium')) {
    score = 60;
    notes = 'Moderate tornado risk (common in FL)';
  } else if (risk.includes('high') && !risk.includes('very')) {
    score = 35;
    notes = 'High tornado risk';
  } else if (risk.includes('very high') || risk.includes('extreme')) {
    score = 15;
    notes = 'Very high tornado risk - consider storm shelter';
  } else {
    score = 65; // FL default
    notes = `Tornado risk: ${value}`;
  }

  return { score, confidence: 'Medium', notes };
}

/**
 * Field 126: radon_risk - Radon Gas Risk Level
 *
 * Florida Context: Generally low but some areas elevated
 */
export function normalizeRadonRisk(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Radon risk unknown - testing recommended' };
  }

  const risk = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (risk.includes('minimal') || risk.includes('very low') || risk.includes('low')) {
    score = 100;
    notes = 'Low radon risk (typical for FL)';
  } else if (risk.includes('moderate') || risk.includes('medium')) {
    score = 65;
    notes = 'Moderate radon risk - testing recommended';
  } else if (risk.includes('high') || risk.includes('elevated')) {
    score = 30;
    notes = 'Elevated radon risk - mitigation may be needed';
  } else {
    score = 80; // FL default is generally low
    notes = `Radon risk: ${value}`;
  }

  return { score, confidence: 'Medium', notes };
}

/**
 * Field 127: superfund_site_nearby - Proximity to Superfund Site
 *
 * Critical environmental contamination consideration
 */
export function normalizeSuperfundSiteNearby(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Superfund site proximity unknown' };
  }

  const status = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (status === 'false' || status === 'no' || status.includes('none') || status.includes('not near')) {
    score = 100;
    notes = 'No Superfund sites nearby';
  } else if (status.includes('miles away') || status.includes('5+')) {
    score = 85;
    notes = 'Superfund site 5+ miles away';
  } else if (status.includes('2-5') || status.includes('few miles')) {
    score = 60;
    notes = 'Superfund site within 2-5 miles';
  } else if (status === 'true' || status === 'yes' || status.includes('near') || status.includes('within')) {
    score = 20;
    notes = 'SUPERFUND SITE NEARBY - investigate contamination status';
  } else if (status.includes('adjacent') || status.includes('immediate')) {
    score = 5;
    notes = 'SUPERFUND SITE ADJACENT - major environmental concern';
  } else {
    score = 50;
    notes = `Superfund status: ${value}`;
  }

  return { score, confidence: 'High', notes };
}

/**
 * Field 128: sea_level_rise_risk - Sea Level Rise Risk
 *
 * CRITICAL FOR FLORIDA COASTAL - Long-term value consideration
 */
export function normalizeSeaLevelRiseRisk(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Sea level rise risk unknown - critical for FL coastal' };
  }

  const risk = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (risk.includes('minimal') || risk.includes('very low') || risk.includes('none')) {
    score = 100;
    notes = 'Minimal sea level rise risk (high elevation)';
  } else if (risk.includes('low')) {
    score = 85;
    notes = 'Low sea level rise risk';
  } else if (risk.includes('moderate') || risk.includes('medium')) {
    score = 55;
    notes = 'Moderate sea level rise risk - consider 30-year outlook';
  } else if (risk.includes('high') && !risk.includes('very')) {
    score = 30;
    notes = 'High sea level rise risk - long-term value concern';
  } else if (risk.includes('very high') || risk.includes('extreme') || risk.includes('critical')) {
    score = 10;
    notes = 'VERY HIGH sea level rise risk - significant long-term concern';
  } else {
    // Try to parse elevation if mentioned
    const elevMatch = risk.match(/(\d+)\s*(?:feet|ft)/i);
    if (elevMatch) {
      const elev = parseInt(elevMatch[1]);
      if (elev >= 15) { score = 100; notes = `High elevation (${elev}ft) - minimal sea level risk`; }
      else if (elev >= 10) { score = 80; notes = `Good elevation (${elev}ft)`; }
      else if (elev >= 6) { score = 55; notes = `Moderate elevation (${elev}ft) - some risk`; }
      else { score = 30; notes = `Low elevation (${elev}ft) - sea level rise concern`; }
    } else {
      score = 50;
      notes = `Sea level rise risk: ${value}`;
    }
  }

  return { score, confidence: 'Medium', notes };
}

/**
 * Field 129: noise_level_db_est - Estimated Noise Level (dB)
 *
 * Scoring based on typical ambient noise levels
 */
export function normalizeNoiseLevelDb(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    return { score: 0, confidence: 'Low', notes: 'Noise level (dB) unknown' };
  }

  const db = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  if (isNaN(db)) {
    return { score: 50, confidence: 'Low', notes: 'Could not parse noise level' };
  }

  let score: number;
  let notes: string;

  if (db < 35) {
    score = 100;
    notes = `Very quiet: ${db}dB (library quiet)`;
  } else if (db < 45) {
    score = 90;
    notes = `Quiet: ${db}dB (residential quiet)`;
  } else if (db < 55) {
    score = 75;
    notes = `Normal: ${db}dB (conversation level)`;
  } else if (db < 65) {
    score = 55;
    notes = `Moderately noisy: ${db}dB`;
  } else if (db < 75) {
    score = 35;
    notes = `Noisy: ${db}dB (near busy road)`;
  } else {
    score = 15;
    notes = `Very noisy: ${db}dB (airport/highway nearby)`;
  }

  return { score, confidence: 'High', notes };
}

/**
 * Field 130: solar_potential - Solar Energy Potential
 *
 * Florida Context: Excellent solar potential statewide
 */
export function normalizeSolarPotential(value: any): NormalizationResult {
  if (value === null || value === undefined || value === '') {
    // Default for FL: assume good solar potential
    return { score: 80, confidence: 'Medium', notes: 'Solar potential: Good (FL typical)' };
  }

  const solar = String(value).toLowerCase();
  let score: number;
  let notes: string;

  if (solar.includes('excellent') || solar.includes('very high') || solar.includes('optimal')) {
    score = 100;
    notes = 'Excellent solar potential';
  } else if (solar.includes('good') || solar.includes('high')) {
    score = 85;
    notes = 'Good solar potential';
  } else if (solar.includes('moderate') || solar.includes('medium') || solar.includes('average')) {
    score = 65;
    notes = 'Moderate solar potential (possible shading)';
  } else if (solar.includes('low') || solar.includes('poor')) {
    score = 40;
    notes = 'Low solar potential (shading concerns)';
  } else if (solar.includes('minimal') || solar.includes('very low')) {
    score = 20;
    notes = 'Minimal solar potential';
  } else {
    // Try to parse kWh or other numeric values
    const kwhMatch = solar.match(/(\d+)\s*kwh/i);
    if (kwhMatch) {
      const kwh = parseInt(kwhMatch[1]);
      score = Math.min(100, Math.round(kwh / 15)); // Rough estimate
      notes = `Solar potential: ${kwh} kWh/year`;
    } else {
      score = 80; // FL default
      notes = `Solar potential: ${value}`;
    }
  }

  return { score, confidence: 'Medium', notes };
}

// ============================================================
// MASTER NORMALIZATION FUNCTION LOOKUP
// ============================================================

/**
 * Maps field IDs to their normalization functions
 */
export const MEDIUM_VALUE_NORMALIZERS: Record<number, NormalizationFunction> = {
  // Section D: HOA & Taxes
  30: normalizeHoaYn,
  31: normalizeHoaFeeAnnual,
  33: normalizeHoaIncludes,
  34: normalizeOwnershipType,
  35: normalizeAnnualTaxes,
  37: normalizePropertyTaxRate,
  38: normalizeTaxExemptions,

  // Section E: Structure & Systems
  39: normalizeRoofType,
  40: normalizeRoofAge,
  41: normalizeExteriorMaterial,
  42: normalizeFoundation,
  43: normalizeWaterHeaterType,
  44: normalizeGarageType,
  45: normalizeHvacType,
  46: normalizeHvacAge,
  47: normalizeLaundryType,
  48: normalizeInteriorCondition,

  // Section J: Location Scores
  74: normalizeWalkScore,
  75: normalizeTransitScore,
  76: normalizeBikeScore,
  77: normalizeSafetyScore,
  78: normalizeNoiseLevel,
  79: normalizeTrafficLevel,
  81: normalizePublicTransitAccess,
  82: normalizeCommuteToCityCenter,

  // Section O: Environment & Risk
  117: normalizeAirQualityIndex,
  118: normalizeAirQualityGrade,
  119: normalizeFloodZone,
  120: normalizeFloodRiskLevel,
  121: normalizeClimateRisk,
  122: normalizeWildfireRisk,
  123: normalizeEarthquakeRisk,
  124: normalizeHurricaneRisk,
  125: normalizeTornadoRisk,
  126: normalizeRadonRisk,
  127: normalizeSuperfundSiteNearby,
  128: normalizeSeaLevelRiseRisk,
  129: normalizeNoiseLevelDb,
  130: normalizeSolarPotential
};

/**
 * Get normalized score for a field
 *
 * @param fieldId - Field number from fields-schema.ts
 * @param value - Raw field value
 * @param property - Optional full property for context-dependent calculations
 * @returns NormalizationResult with score (0-100), confidence, and notes
 */
export function normalizeField(
  fieldId: number,
  value: any,
  property?: Property
): NormalizationResult {
  const normalizer = MEDIUM_VALUE_NORMALIZERS[fieldId];

  if (!normalizer) {
    // Field not in medium-value sections
    return {
      score: value ? 50 : 0,
      confidence: 'Low',
      notes: `No normalizer for field ${fieldId}`
    };
  }

  return normalizer(value, property);
}

/**
 * Batch normalize multiple fields
 */
export function normalizeFields(
  fields: Array<{ fieldId: number; value: any }>,
  property?: Property
): Array<{ fieldId: number; result: NormalizationResult }> {
  return fields.map(({ fieldId, value }) => ({
    fieldId,
    result: normalizeField(fieldId, value, property)
  }));
}
