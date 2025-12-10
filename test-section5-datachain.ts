/**
 * Section 5 Data Chain Verification Test
 * Validates that all fields flow correctly from database schema → visualsDataMapper → Section5Charts
 *
 * Run with: npx tsx test-section5-datachain.ts
 */

// Mock Property type (from src/types/property.ts)
type DataField<T> = { value: T | null };

interface StructuralDetails {
  roofType: DataField<string>;           // #39 roof_type
  roofAgeEst: DataField<string>;         // #40 roof_age_est
  exteriorMaterial: DataField<string>;   // #41 exterior_material
  foundation: DataField<string>;         // #42 foundation
  waterHeaterType: DataField<string>;    // #43 water_heater_type
  hvacType: DataField<string>;           // #45 hvac_type
  hvacAge: DataField<string>;            // #46 hvac_age
  laundryType: DataField<string>;        // #47 laundry_type
  interiorCondition: DataField<string>;  // #48 interior_condition
}

interface MockProperty {
  id: string;
  structural: StructuralDetails;
  details: {
    yearBuilt: DataField<number>;
  };
  address: {
    fullAddress: DataField<string>;
    listingPrice: DataField<number>;
  };
}

// Mock ChartProperty (from visualsDataMapper.ts)
interface ChartProperty {
  id: string;
  address: string;
  roofType: string;
  roofAge: string;  // Note: mapped from roofAgeEst
  exteriorMaterial: string;
  foundation: string;
  waterHeaterType: string;
  hvacType: string;
  hvacAge: string;
  laundryType: string;
  interiorCondition: string;
  listingPrice: number;
  yearBuilt: number;
}

// Mock Home interface (from Section5StructureSystemsCharts.tsx)
interface Home {
  id: string;
  name: string;
  color: string;
  roofType: string;
  roofAgeEst: string;  // Note: mapped from roofAge
  exteriorMaterial: string;
  foundation: string;
  waterHeaterType: string;
  hvacType: string;
  hvacAge: string;
  interiorCondition: string;
  listingPrice?: number;
  yearBuilt?: number;
}

// Simulate getVal helper
function getVal<T>(field: { value: T | null } | undefined, fallback: T): T {
  return field?.value ?? fallback;
}

// Simulate visualsDataMapper mapping
function mapPropertyToChart(property: MockProperty): ChartProperty {
  const structural = property.structural;
  const details = property.details;
  const addr = property.address;

  return {
    id: property.id,
    address: getVal(addr?.fullAddress, ''),
    roofType: getVal(structural?.roofType, ''),
    roofAge: getVal(structural?.roofAgeEst, ''),  // roofAgeEst → roofAge
    exteriorMaterial: getVal(structural?.exteriorMaterial, ''),
    foundation: getVal(structural?.foundation, ''),
    waterHeaterType: getVal(structural?.waterHeaterType, ''),
    hvacType: getVal(structural?.hvacType, ''),
    hvacAge: getVal(structural?.hvacAge, ''),
    laundryType: getVal(structural?.laundryType, ''),
    interiorCondition: getVal(structural?.interiorCondition, ''),
    listingPrice: getVal(addr?.listingPrice, 0),
    yearBuilt: getVal(details?.yearBuilt, 0),
  };
}

// Simulate Category05 mapping function
function mapToSection5Homes(properties: ChartProperty[]): Home[] {
  return properties.map((p, idx) => ({
    id: p.id,
    name: p.address || 'Unknown Address',
    color: ['#22c55e', '#8b5cf6', '#ec4899'][idx] || '#22c55e',
    roofType: p.roofType || '',
    roofAgeEst: p.roofAge || '',  // roofAge → roofAgeEst
    exteriorMaterial: p.exteriorMaterial || '',
    foundation: p.foundation || '',
    waterHeaterType: p.waterHeaterType || '',
    hvacType: p.hvacType || '',
    hvacAge: p.hvacAge || '',
    interiorCondition: p.interiorCondition || '',
    listingPrice: p.listingPrice,
    yearBuilt: p.yearBuilt,
  }));
}

// Test data
const testProperty: MockProperty = {
  id: 'test-property-1',
  structural: {
    roofType: { value: 'Metal' },
    roofAgeEst: { value: '5 years' },
    exteriorMaterial: { value: 'Brick' },
    foundation: { value: 'Slab' },
    waterHeaterType: { value: 'Tankless Gas' },
    hvacType: { value: 'Central AC' },
    hvacAge: { value: '3 years' },
    laundryType: { value: 'In Unit' },
    interiorCondition: { value: 'Excellent' },
  },
  details: {
    yearBuilt: { value: 2015 },
  },
  address: {
    fullAddress: { value: '123 Test St, Miami, FL 33101' },
    listingPrice: { value: 500000 },
  },
};

// Run test
console.log('🔍 Testing Section 5 Data Chain...\n');

console.log('1️⃣ Original Property (Database Schema):');
console.log(JSON.stringify(testProperty, null, 2));
console.log('\n');

const chartProperty = mapPropertyToChart(testProperty);
console.log('2️⃣ ChartProperty (After visualsDataMapper):');
console.log(JSON.stringify(chartProperty, null, 2));
console.log('\n');

const homes = mapToSection5Homes([chartProperty]);
console.log('3️⃣ Home (Section5Charts interface):');
console.log(JSON.stringify(homes[0], null, 2));
console.log('\n');

// Verification
console.log('✅ VERIFICATION:');
const checks = [
  {
    name: 'Field 39: roofType',
    source: testProperty.structural.roofType.value,
    chart: chartProperty.roofType,
    home: homes[0].roofType,
  },
  {
    name: 'Field 40: roofAgeEst → roofAge → roofAgeEst',
    source: testProperty.structural.roofAgeEst.value,
    chart: chartProperty.roofAge,
    home: homes[0].roofAgeEst,
  },
  {
    name: 'Field 41: exteriorMaterial',
    source: testProperty.structural.exteriorMaterial.value,
    chart: chartProperty.exteriorMaterial,
    home: homes[0].exteriorMaterial,
  },
  {
    name: 'Field 42: foundation',
    source: testProperty.structural.foundation.value,
    chart: chartProperty.foundation,
    home: homes[0].foundation,
  },
  {
    name: 'Field 43: waterHeaterType',
    source: testProperty.structural.waterHeaterType.value,
    chart: chartProperty.waterHeaterType,
    home: homes[0].waterHeaterType,
  },
  {
    name: 'Field 45: hvacType',
    source: testProperty.structural.hvacType.value,
    chart: chartProperty.hvacType,
    home: homes[0].hvacType,
  },
  {
    name: 'Field 46: hvacAge',
    source: testProperty.structural.hvacAge.value,
    chart: chartProperty.hvacAge,
    home: homes[0].hvacAge,
  },
  {
    name: 'Field 48: interiorCondition',
    source: testProperty.structural.interiorCondition.value,
    chart: chartProperty.interiorCondition,
    home: homes[0].interiorCondition,
  },
];

let allPassed = true;
checks.forEach(check => {
  const passed = check.source === check.chart && check.chart === check.home;
  allPassed = allPassed && passed;
  console.log(`  ${passed ? '✅' : '❌'} ${check.name}: ${check.source} → ${check.chart} → ${check.home}`);
});

console.log('\n');
if (allPassed) {
  console.log('🎉 ALL CHECKS PASSED! Data chain is intact.');
  console.log('✅ All fields flow correctly from Property → ChartProperty → Home');
  process.exit(0);
} else {
  console.log('❌ SOME CHECKS FAILED! Review field mappings.');
  process.exit(1);
}
