/**
 * CSV Validator Test Script
 * Run with: npx tsx scripts/test-csv-validator.ts
 */

import { validateCsvData, validateFieldValue, validateCsvRow } from '../src/lib/csv-validator';

// Test counters
let passed = 0;
let failed = 0;

function test(name: string, fn: () => boolean) {
  try {
    const result = fn();
    if (result) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${name}`);
      failed++;
    }
  } catch (e) {
    console.log(`❌ FAIL: ${name} - ${e}`);
    failed++;
  }
}

console.log('\n========================================');
console.log('CSV VALIDATOR TEST SUITE');
console.log('========================================\n');

// =============================================================================
// TEST 1: Valid listing price
// =============================================================================
test('Valid listing price ($500,000) passes', () => {
  const result = validateFieldValue('10_listing_price', 500000);
  return result.valid === true && result.coercedValue === 500000;
});

// =============================================================================
// TEST 2: Invalid listing price (out of range - too high)
// =============================================================================
test('Invalid listing price ($999 billion) is BLOCKED', () => {
  const result = validateFieldValue('10_listing_price', 999000000000);
  return result.valid === false && result.error?.errorType === 'range';
});

// =============================================================================
// TEST 3: Price string coercion
// =============================================================================
test('Price string "$250,000" coerces to number 250000', () => {
  const result = validateFieldValue('10_listing_price', '$250,000');
  return result.valid === true && result.coercedValue === 250000;
});

// =============================================================================
// TEST 4: Valid bedrooms
// =============================================================================
test('Valid bedrooms (4) passes', () => {
  const result = validateFieldValue('17_bedrooms', 4);
  return result.valid === true && result.coercedValue === 4;
});

// =============================================================================
// TEST 5: Invalid bedrooms (out of range)
// =============================================================================
test('Invalid bedrooms (100) is BLOCKED', () => {
  const result = validateFieldValue('17_bedrooms', 100);
  return result.valid === false && result.error?.errorType === 'range';
});

// =============================================================================
// TEST 6: Valid year built
// =============================================================================
test('Valid year built (2020) passes', () => {
  const result = validateFieldValue('25_year_built', 2020);
  return result.valid === true && result.coercedValue === 2020;
});

// =============================================================================
// TEST 7: Invalid year built (too old)
// =============================================================================
test('Invalid year built (1600) is BLOCKED', () => {
  const result = validateFieldValue('25_year_built', 1600);
  return result.valid === false && result.error?.errorType === 'range';
});

// =============================================================================
// TEST 8: Invalid year built (future)
// =============================================================================
test('Invalid year built (2050) is BLOCKED', () => {
  const result = validateFieldValue('25_year_built', 2050);
  return result.valid === false && result.error?.errorType === 'range';
});

// =============================================================================
// TEST 9: Valid sqft
// =============================================================================
test('Valid living sqft (2500) passes', () => {
  const result = validateFieldValue('21_living_sqft', 2500);
  return result.valid === true && result.coercedValue === 2500;
});

// =============================================================================
// TEST 10: Invalid sqft (too large)
// =============================================================================
test('Invalid living sqft (500,000) is BLOCKED', () => {
  const result = validateFieldValue('21_living_sqft', 500000);
  return result.valid === false && result.error?.errorType === 'range';
});

// =============================================================================
// TEST 11: Boolean coercion
// =============================================================================
test('Boolean "yes" coerces to true', () => {
  const result = validateFieldValue('54_pool_yn', 'yes');
  return result.valid === true && result.coercedValue === true;
});

// =============================================================================
// TEST 12: Boolean coercion (false)
// =============================================================================
test('Boolean "no" coerces to false', () => {
  const result = validateFieldValue('54_pool_yn', 'no');
  return result.valid === true && result.coercedValue === false;
});

// =============================================================================
// TEST 13: Annual taxes valid
// =============================================================================
test('Valid annual taxes ($5,000) passes', () => {
  const result = validateFieldValue('35_annual_taxes', 5000);
  return result.valid === true && result.coercedValue === 5000;
});

// =============================================================================
// TEST 14: Annual taxes invalid (too high)
// =============================================================================
test('Invalid annual taxes ($500,000) is BLOCKED', () => {
  const result = validateFieldValue('35_annual_taxes', 500000);
  return result.valid === false && result.error?.errorType === 'range';
});

// =============================================================================
// TEST 15: HOA fee valid
// =============================================================================
test('Valid HOA fee ($500/month = $6000/year) passes', () => {
  const result = validateFieldValue('31_hoa_fee_annual', 6000);
  return result.valid === true && result.coercedValue === 6000;
});

// =============================================================================
// TEST 16: HOA fee invalid (too high)
// =============================================================================
test('Invalid HOA fee ($600,000/year) is BLOCKED', () => {
  const result = validateFieldValue('31_hoa_fee_annual', 600000);
  return result.valid === false && result.error?.errorType === 'range';
});

// =============================================================================
// TEST 17: Unknown field warning
// =============================================================================
test('Unknown field produces WARNING (not error)', () => {
  const result = validateFieldValue('unknown_field_xyz', 'value');
  return result.valid === true && result.error?.severity === 'warning';
});

// =============================================================================
// TEST 18: Invalid field number
// =============================================================================
test('Invalid field number (999_bad_field) is BLOCKED', () => {
  const result = validateFieldValue('999_bad_field', 'value');
  return result.valid === false && result.error?.errorType === 'unknown_field';
});

// =============================================================================
// TEST 19: Full row validation - valid data
// =============================================================================
test('Full valid CSV row passes validation', () => {
  const row = {
    '1_full_address': '123 Main St, Orlando, FL 32801',
    '10_listing_price': 450000,
    '17_bedrooms': 3,
    '18_full_baths': 2,
    '21_living_sqft': 1800,
    '25_year_built': 2015,
  };
  const result = validateCsvRow(row);
  return result.isValid === true && result.errors.length === 0;
});

// =============================================================================
// TEST 20: Full row validation - invalid data blocked
// =============================================================================
test('CSV row with invalid price is BLOCKED', () => {
  const row = {
    '1_full_address': '123 Main St',
    '10_listing_price': 999999999999, // $999 billion - invalid
    '17_bedrooms': 3,
  };
  const result = validateCsvRow(row);
  return result.isValid === false && result.blockedFields.includes('10_listing_price');
});

// =============================================================================
// TEST 21: Full dataset validation
// =============================================================================
test('Dataset with mixed valid/invalid rows reports correctly', () => {
  const data = [
    { '10_listing_price': 500000, '17_bedrooms': 3 }, // valid
    { '10_listing_price': 999999999999, '17_bedrooms': 3 }, // invalid price
    { '10_listing_price': 300000, '17_bedrooms': 100 }, // invalid bedrooms
  ];
  const result = validateCsvData(data);
  return result.validRows === 1 && result.invalidRows === 2 && result.totalErrors === 2;
});

// =============================================================================
// TEST 22: Type coercion for NaN
// =============================================================================
test('Non-numeric string for price field is BLOCKED', () => {
  const result = validateFieldValue('10_listing_price', 'not-a-number');
  return result.valid === false && result.error?.errorType === 'type';
});

// =============================================================================
// TEST 23: Garage spaces valid
// =============================================================================
test('Valid garage spaces (2) passes', () => {
  const result = validateFieldValue('28_garage_spaces', 2);
  return result.valid === true && result.coercedValue === 2;
});

// =============================================================================
// TEST 24: Garage spaces invalid
// =============================================================================
test('Invalid garage spaces (50) is BLOCKED', () => {
  const result = validateFieldValue('28_garage_spaces', 50);
  return result.valid === false && result.error?.errorType === 'range';
});

// =============================================================================
// TEST 25: Stories valid
// =============================================================================
test('Valid stories (2) passes', () => {
  const result = validateFieldValue('27_stories', 2);
  return result.valid === true && result.coercedValue === 2;
});

// =============================================================================
// TEST 26: Stories invalid
// =============================================================================
test('Invalid stories (150) is BLOCKED', () => {
  const result = validateFieldValue('27_stories', 150);
  return result.valid === false && result.error?.errorType === 'range';
});

// =============================================================================
// NEW TESTS FOR ADDED VALIDATION RULES (22 new fields)
// =============================================================================

// TEST 27: Redfin estimate
test('Valid redfin estimate ($500K) passes', () => {
  const result = validateFieldValue('16_redfin_estimate', 500000);
  return result.valid === true && result.coercedValue === 500000;
});

// TEST 28: Redfin estimate invalid
test('Invalid redfin estimate ($2 billion) is BLOCKED', () => {
  const result = validateFieldValue('16_redfin_estimate', 2000000000);
  return result.valid === false && result.error?.errorType === 'range';
});

// TEST 29: Property tax rate valid
test('Valid property tax rate (2.5%) passes', () => {
  const result = validateFieldValue('37_property_tax_rate', 2.5);
  return result.valid === true && result.coercedValue === 2.5;
});

// TEST 30: Property tax rate invalid
test('Invalid property tax rate (50%) is BLOCKED', () => {
  const result = validateFieldValue('37_property_tax_rate', 50);
  return result.valid === false && result.error?.errorType === 'range';
});

// TEST 31: Fireplace count valid
test('Valid fireplace count (2) passes', () => {
  const result = validateFieldValue('53_fireplace_count', 2);
  return result.valid === true && result.coercedValue === 2;
});

// TEST 32: Fireplace count invalid
test('Invalid fireplace count (100) is BLOCKED', () => {
  const result = validateFieldValue('53_fireplace_count', 100);
  return result.valid === false && result.error?.errorType === 'range';
});

// TEST 33: Elevation feet valid
test('Valid elevation (500 ft) passes', () => {
  const result = validateFieldValue('64_elevation_feet', 500);
  return result.valid === true && result.coercedValue === 500;
});

// TEST 34: Elevation feet invalid
test('Invalid elevation (50000 ft) is BLOCKED', () => {
  const result = validateFieldValue('64_elevation_feet', 50000);
  return result.valid === false && result.error?.errorType === 'range';
});

// TEST 35: School distance valid
test('Valid elementary distance (2.5 mi) passes', () => {
  const result = validateFieldValue('67_elementary_distance_mi', 2.5);
  return result.valid === true && result.coercedValue === 2.5;
});

// TEST 36: School distance invalid
test('Invalid elementary distance (500 mi) is BLOCKED', () => {
  const result = validateFieldValue('67_elementary_distance_mi', 500);
  return result.valid === false && result.error?.errorType === 'range';
});

// TEST 37: Distance to grocery valid
test('Valid grocery distance (1.2 mi) passes', () => {
  const result = validateFieldValue('83_distance_grocery_mi', 1.2);
  return result.valid === true && result.coercedValue === 1.2;
});

// TEST 38: Distance to airport valid (larger range)
test('Valid airport distance (45 mi) passes', () => {
  const result = validateFieldValue('85_distance_airport_mi', 45);
  return result.valid === true && result.coercedValue === 45;
});

// TEST 39: Median home price valid
test('Valid median home price ($450K) passes', () => {
  const result = validateFieldValue('91_median_home_price_neighborhood', 450000);
  return result.valid === true && result.coercedValue === 450000;
});

// TEST 40: Median home price invalid
test('Invalid median home price ($100 million) is BLOCKED', () => {
  const result = validateFieldValue('91_median_home_price_neighborhood', 100000000);
  return result.valid === false && result.error?.errorType === 'range';
});

// TEST 41: Price to rent ratio valid
test('Valid price to rent ratio (20) passes', () => {
  const result = validateFieldValue('93_price_to_rent_ratio', 20);
  return result.valid === true && result.coercedValue === 20;
});

// TEST 42: Price to rent ratio invalid
test('Invalid price to rent ratio (500) is BLOCKED', () => {
  const result = validateFieldValue('93_price_to_rent_ratio', 500);
  return result.valid === false && result.error?.errorType === 'range';
});

// TEST 43: Days on market valid
test('Valid days on market (45) passes', () => {
  const result = validateFieldValue('95_days_on_market_avg', 45);
  return result.valid === true && result.coercedValue === 45;
});

// TEST 44: Days on market invalid
test('Invalid days on market (10000) is BLOCKED', () => {
  const result = validateFieldValue('95_days_on_market_avg', 10000);
  return result.valid === false && result.error?.errorType === 'range';
});

// TEST 45: Insurance estimate valid
test('Valid insurance estimate ($3000/yr) passes', () => {
  const result = validateFieldValue('97_insurance_est_annual', 3000);
  return result.valid === true && result.coercedValue === 3000;
});

// TEST 46: Insurance estimate invalid
test('Invalid insurance estimate ($500K/yr) is BLOCKED', () => {
  const result = validateFieldValue('97_insurance_est_annual', 500000);
  return result.valid === false && result.error?.errorType === 'range';
});

// TEST 47: Rental estimate valid
test('Valid rental estimate ($2500/mo) passes', () => {
  const result = validateFieldValue('98_rental_estimate_monthly', 2500);
  return result.valid === true && result.coercedValue === 2500;
});

// TEST 48: Rental yield valid
test('Valid rental yield (6%) passes', () => {
  const result = validateFieldValue('99_rental_yield_est', 6);
  return result.valid === true && result.coercedValue === 6;
});

// TEST 49: Rental yield invalid
test('Invalid rental yield (100%) is BLOCKED', () => {
  const result = validateFieldValue('99_rental_yield_est', 100);
  return result.valid === false && result.error?.errorType === 'range';
});

// TEST 50: Vacancy rate valid
test('Valid vacancy rate (5%) passes', () => {
  const result = validateFieldValue('100_vacancy_rate_neighborhood', 5);
  return result.valid === true && result.coercedValue === 5;
});

// TEST 51: Vacancy rate invalid
test('Invalid vacancy rate (150%) is BLOCKED', () => {
  const result = validateFieldValue('100_vacancy_rate_neighborhood', 150);
  return result.valid === false && result.error?.errorType === 'range';
});

// TEST 52: Cap rate valid
test('Valid cap rate (8%) passes', () => {
  const result = validateFieldValue('101_cap_rate_est', 8);
  return result.valid === true && result.coercedValue === 8;
});

// TEST 53: Cap rate invalid
test('Invalid cap rate (75%) is BLOCKED', () => {
  const result = validateFieldValue('101_cap_rate_est', 75);
  return result.valid === false && result.error?.errorType === 'range';
});

// =============================================================================
// SUMMARY
// =============================================================================
console.log('\n========================================');
console.log('TEST RESULTS');
console.log('========================================');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total:  ${passed + failed}`);
console.log('========================================\n');

if (failed > 0) {
  console.log('⚠️  SOME TESTS FAILED - Review above for details');
  process.exit(1);
} else {
  console.log('🎉 ALL TESTS PASSED - CSV Validation is working correctly');
  process.exit(0);
}
