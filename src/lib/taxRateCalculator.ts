/**
 * Smart Tax Rate Calculator
 *
 * Calculates property tax rates using a multi-source validation system:
 * 1. Uses API-provided rates when available from trusted sources (Tier 1-5)
 * 2. Validates Tier 6 sources only if they agree within 0.2% of each other
 * 3. Falls back to city-based rate inference when one property in the city has a known rate
 * 4. Calculates rate from annualTaxes / assessedValue when both are available
 */

export interface PropertyTaxData {
  id: string;
  city: string;
  annualTaxes?: number;
  assessedValue?: number;
  propertyTaxRate?: number;
  dataSourceTier?: number; // 1-6 scale: 1=best (STELLAR), 6=least trusted
  dataSource?: string;
}

interface TaxRateResult {
  rate: number;
  source: 'api' | 'calculated' | 'city-inferred' | 'default';
  confidence: 'high' | 'medium' | 'low';
  details: string;
}

/**
 * Calculate tax rate from annual taxes and assessed value
 */
function calculateTaxRate(annualTaxes: number, assessedValue: number): number {
  if (!annualTaxes || !assessedValue || assessedValue === 0) return 0;
  return (annualTaxes / assessedValue) * 100;
}

/**
 * Validate if two rates are within acceptable tolerance (0.2%)
 */
function ratesAgree(rate1: number, rate2: number, tolerance = 0.2): boolean {
  return Math.abs(rate1 - rate2) <= tolerance;
}

/**
 * Get the average of an array of numbers
 */
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Determine if a data source tier is trusted (Tier 1-5)
 */
function isTrustedTier(tier?: number): boolean {
  return tier !== undefined && tier >= 1 && tier <= 5;
}

/**
 * Smart tax rate calculation for a single property
 */
export function calculatePropertyTaxRate(
  property: PropertyTaxData,
  allProperties: PropertyTaxData[]
): TaxRateResult {
  console.log(`\n🧮 Tax Rate Calculation for ${property.city} (ID: ${property.id})`);

  // STEP 1: Check if API provided a rate from a trusted source (Tier 1-5)
  if (property.propertyTaxRate && isTrustedTier(property.dataSourceTier)) {
    console.log(`  ✅ Using API rate from ${property.dataSource} (Tier ${property.dataSourceTier}): ${property.propertyTaxRate.toFixed(2)}%`);
    return {
      rate: property.propertyTaxRate,
      source: 'api',
      confidence: 'high',
      details: `From ${property.dataSource || 'API'} (Tier ${property.dataSourceTier})`
    };
  }

  // STEP 2: If we have annualTaxes and assessedValue, calculate the rate
  if (property.annualTaxes && property.assessedValue) {
    const calculatedRate = calculateTaxRate(property.annualTaxes, property.assessedValue);
    if (calculatedRate > 0) {
      console.log(`  ✅ Calculated from taxes/assessed: ${calculatedRate.toFixed(2)}%`);

      // If API rate is Tier 6, validate it against calculated rate
      if (property.propertyTaxRate && property.dataSourceTier === 6) {
        if (ratesAgree(property.propertyTaxRate, calculatedRate)) {
          const avgRate = average([property.propertyTaxRate, calculatedRate]);
          console.log(`  🤝 Tier 6 API rate agrees with calculated - using average: ${avgRate.toFixed(2)}%`);
          return {
            rate: avgRate,
            source: 'calculated',
            confidence: 'high',
            details: 'Averaged Tier 6 API with calculated rate (agreement within 0.2%)'
          };
        } else {
          console.log(`  ⚠️ Tier 6 API rate (${property.propertyTaxRate.toFixed(2)}%) disagrees with calculated - using calculated`);
        }
      }

      return {
        rate: calculatedRate,
        source: 'calculated',
        confidence: 'high',
        details: `Calculated from $${property.annualTaxes.toLocaleString()} taxes / $${property.assessedValue.toLocaleString()} assessed value`
      };
    }
  }

  // STEP 3: Check if any other property in the same city has a known rate
  const cityProperties = allProperties.filter(p =>
    p.city.toLowerCase() === property.city.toLowerCase() &&
    p.id !== property.id
  );

  const cityRates: number[] = [];

  for (const cityProp of cityProperties) {
    // Check trusted API rates
    if (cityProp.propertyTaxRate && isTrustedTier(cityProp.dataSourceTier)) {
      cityRates.push(cityProp.propertyTaxRate);
      console.log(`  📍 Found ${cityProp.dataSource} rate from city property: ${cityProp.propertyTaxRate.toFixed(2)}%`);
    }
    // Check calculated rates
    else if (cityProp.annualTaxes && cityProp.assessedValue) {
      const calcRate = calculateTaxRate(cityProp.annualTaxes, cityProp.assessedValue);
      if (calcRate > 0) {
        cityRates.push(calcRate);
        console.log(`  📍 Calculated rate from city property: ${calcRate.toFixed(2)}%`);
      }
    }
  }

  if (cityRates.length > 0) {
    const inferredRate = average(cityRates);
    console.log(`  ✅ Inferred from ${cityRates.length} city ${cityRates.length === 1 ? 'property' : 'properties'}: ${inferredRate.toFixed(2)}%`);
    return {
      rate: inferredRate,
      source: 'city-inferred',
      confidence: cityRates.length >= 2 ? 'high' : 'medium',
      details: `Inferred from ${cityRates.length} ${cityRates.length === 1 ? 'property' : 'properties'} in ${property.city}`
    };
  }

  // STEP 4: Use Tier 6 API rate if available (last resort)
  if (property.propertyTaxRate && property.dataSourceTier === 6) {
    console.log(`  ⚠️ Using Tier 6 API rate as last resort: ${property.propertyTaxRate.toFixed(2)}%`);
    return {
      rate: property.propertyTaxRate,
      source: 'api',
      confidence: 'low',
      details: `From ${property.dataSource || 'API'} (Tier 6, unvalidated)`
    };
  }

  // STEP 5: Default fallback
  console.log(`  ❌ No tax rate data available - using 0%`);
  return {
    rate: 0,
    source: 'default',
    confidence: 'low',
    details: 'No tax rate data available'
  };
}

/**
 * Batch process tax rates for multiple properties
 */
export function calculateAllTaxRates(properties: PropertyTaxData[]): Map<string, TaxRateResult> {
  console.log('\n🧮 Smart Tax Rate Calculator - Processing batch of properties');
  console.log('═'.repeat(70));

  const results = new Map<string, TaxRateResult>();

  for (const property of properties) {
    const result = calculatePropertyTaxRate(property, properties);
    results.set(property.id, result);
  }

  console.log('═'.repeat(70));
  console.log('✅ Tax rate calculation complete\n');

  return results;
}

/**
 * Validate multiple Tier 6 sources and return averaged rate if they agree
 */
export function validateTier6Sources(
  rates: Array<{ rate: number; source: string }>,
  tolerance = 0.2
): { valid: boolean; averageRate?: number } {
  if (rates.length < 2) {
    return { valid: false };
  }

  // Check if all rates agree within tolerance
  const firstRate = rates[0].rate;
  const allAgree = rates.every(r => ratesAgree(firstRate, r.rate, tolerance));

  if (allAgree) {
    const avgRate = average(rates.map(r => r.rate));
    console.log(`  ✅ ${rates.length} Tier 6 sources agree within ${tolerance}% - using average: ${avgRate.toFixed(2)}%`);
    return { valid: true, averageRate: avgRate };
  }

  console.log(`  ❌ Tier 6 sources disagree - rates: ${rates.map(r => r.rate.toFixed(2)).join('%, ')}%`);
  return { valid: false };
}
