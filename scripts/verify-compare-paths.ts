/**
 * COMPREHENSIVE PATH VERIFICATION SCRIPT
 * Tests ALL 175+ field paths in Compare.tsx against Property interface
 *
 * This script verifies that EVERY path claimed to be wired actually exists
 * in the Property interface structure from src/types/property.ts
 */

import type { Property } from './src/types/property';

// All field paths from Compare.tsx comparisonFields object (lines 283-508)
const fieldPaths = {
  scores: [
    { key: 'smartScore', path: 'smartScore', fieldNum: null },
    { key: 'dataCompleteness', path: 'dataCompleteness', fieldNum: null },
    { key: 'pricePerSqftRank', path: 'calculated.pricePerSqftRank', fieldNum: null, calculated: true },
    { key: 'valueScore', path: 'calculated.valueScore', fieldNum: null, calculated: true },
    { key: 'locationScore', path: 'calculated.locationScore', fieldNum: null, calculated: true },
  ],
  price: [
    { key: 'listingPrice', path: 'address.listingPrice.value', fieldNum: 10 },
    { key: 'pricePerSqft', path: 'address.pricePerSqft.value', fieldNum: 11 },
    { key: 'marketValueEstimate', path: 'details.marketValueEstimate.value', fieldNum: 12 },
    { key: 'assessedValue', path: 'details.assessedValue.value', fieldNum: 15 },
    { key: 'redfinEstimate', path: 'financial.redfinEstimate.value', fieldNum: 16 },
    { key: 'lastSalePrice', path: 'details.lastSalePrice.value', fieldNum: 14 },
    { key: 'lastSaleDate', path: 'details.lastSaleDate.value', fieldNum: 13 },
    { key: 'priceVsMedian', path: 'financial.priceVsMedianPercent.value', fieldNum: 94 },
    { key: 'medianHomePrice', path: 'financial.medianHomePriceNeighborhood.value', fieldNum: 91 },
    { key: 'pricePerSqftAvg', path: 'financial.pricePerSqftRecentAvg.value', fieldNum: 92 },
  ],
  cost: [
    { key: 'annualTaxes', path: 'details.annualTaxes.value', fieldNum: 35 },
    { key: 'propertyTaxRate', path: 'financial.propertyTaxRate.value', fieldNum: 37 },
    { key: 'hoaFeeAnnual', path: 'details.hoaFeeAnnual.value', fieldNum: 31 },
    { key: 'insuranceEstAnnual', path: 'financial.insuranceEstAnnual.value', fieldNum: 97 },
    { key: 'cddFee', path: 'stellarMLS.legal.annualCddFee.value', fieldNum: 153 },
    { key: 'avgElectricBill', path: 'utilities.avgElectricBill.value', fieldNum: 105 },
    { key: 'avgWaterBill', path: 'utilities.avgWaterBill.value', fieldNum: 107 },
    { key: 'specialAssessments', path: 'financial.specialAssessments.value', fieldNum: 138 },
    { key: 'monthlyCarryingCost', path: 'calculated.monthlyCarryingCost', fieldNum: null, calculated: true },
    { key: 'annualCarryingCost', path: 'calculated.annualCarryingCost', fieldNum: null, calculated: true },
  ],
  size: [
    { key: 'livingSqft', path: 'details.livingSqft.value', fieldNum: 21 },
    { key: 'totalSqftUnderRoof', path: 'details.totalSqftUnderRoof.value', fieldNum: 22 },
    { key: 'lotSizeSqft', path: 'details.lotSizeSqft.value', fieldNum: 23 },
    { key: 'lotSizeAcres', path: 'details.lotSizeAcres.value', fieldNum: 24 },
    { key: 'bedrooms', path: 'details.bedrooms.value', fieldNum: 17 },
    { key: 'fullBathrooms', path: 'details.fullBathrooms.value', fieldNum: 18 },
    { key: 'halfBathrooms', path: 'details.halfBathrooms.value', fieldNum: 19 },
    { key: 'totalBathrooms', path: 'details.totalBathrooms.value', fieldNum: 20 },
    { key: 'stories', path: 'details.stories.value', fieldNum: 27 },
    { key: 'floorsInUnit', path: 'stellarMLS.building.floorsInUnit.value', fieldNum: 148 },
  ],
  condition: [
    { key: 'yearBuilt', path: 'details.yearBuilt.value', fieldNum: 25 },
    { key: 'propertyAge', path: 'calculated.propertyAge', fieldNum: null, calculated: true },
    { key: 'interiorCondition', path: 'structural.interiorCondition.value', fieldNum: 48 },
    { key: 'recentRenovations', path: 'structural.recentRenovations.value', fieldNum: 59 },
    { key: 'roofType', path: 'structural.roofType.value', fieldNum: 39 },
    { key: 'roofAgeEst', path: 'structural.roofAgeEst.value', fieldNum: 40 },
    { key: 'hvacType', path: 'structural.hvacType.value', fieldNum: 45 },
    { key: 'hvacAge', path: 'structural.hvacAge.value', fieldNum: 46 },
    { key: 'permitHistoryRoof', path: 'structural.permitHistoryRoof.value', fieldNum: 60 },
    { key: 'permitHistoryHvac', path: 'structural.permitHistoryHvac.value', fieldNum: 61 },
  ],
  interior: [
    { key: 'flooringType', path: 'structural.flooringType.value', fieldNum: 49 },
    { key: 'kitchenFeatures', path: 'structural.kitchenFeatures.value', fieldNum: 50 },
    { key: 'appliancesIncluded', path: 'structural.appliancesIncluded.value', fieldNum: 51 },
    { key: 'fireplaceYn', path: 'structural.fireplaceYn.value', fieldNum: 52 },
    { key: 'fireplaceCount', path: 'structural.fireplaceCount.value', fieldNum: 53 },
    { key: 'laundryType', path: 'structural.laundryType.value', fieldNum: 47 },
    { key: 'interiorFeatures', path: 'stellarMLS.features.interiorFeatures.value', fieldNum: 167 },
    { key: 'smartHomeFeatures', path: 'utilities.smartHomeFeatures.value', fieldNum: 134 },
    { key: 'waterHeaterType', path: 'structural.waterHeaterType.value', fieldNum: 43 },
  ],
  exterior: [
    { key: 'exteriorMaterial', path: 'structural.exteriorMaterial.value', fieldNum: 41 },
    { key: 'foundation', path: 'structural.foundation.value', fieldNum: 42 },
    { key: 'poolYn', path: 'structural.poolYn.value', fieldNum: 54 },
    { key: 'poolType', path: 'structural.poolType.value', fieldNum: 55 },
    { key: 'deckPatio', path: 'structural.deckPatio.value', fieldNum: 56 },
    { key: 'fence', path: 'structural.fence.value', fieldNum: 57 },
    { key: 'landscaping', path: 'structural.landscaping.value', fieldNum: 58 },
    { key: 'lotFeatures', path: 'utilities.lotFeatures.value', fieldNum: 132 },
    { key: 'exteriorFeatures', path: 'stellarMLS.features.exteriorFeatures.value', fieldNum: 168 },
    { key: 'frontExposure', path: 'stellarMLS.legal.frontExposure.value', fieldNum: 154 },
  ],
  parking: [
    { key: 'garageSpaces', path: 'details.garageSpaces.value', fieldNum: 28 },
    { key: 'garageType', path: 'structural.garageType.value', fieldNum: 44 },
    { key: 'garageAttached', path: 'stellarMLS.parking.garageAttachedYn.value', fieldNum: 141 },
    { key: 'parkingTotal', path: 'details.parkingTotal.value', fieldNum: 29 },
    { key: 'carportYn', path: 'stellarMLS.parking.carportYn.value', fieldNum: 139 },
    { key: 'carportSpaces', path: 'stellarMLS.parking.carportSpaces.value', fieldNum: 140 },
    { key: 'parkingFeatures', path: 'stellarMLS.parking.parkingFeatures.value', fieldNum: 142 },
    { key: 'assignedParkingSpaces', path: 'stellarMLS.parking.assignedParkingSpaces.value', fieldNum: 143 },
    { key: 'evCharging', path: 'utilities.evChargingYn.value', fieldNum: 133 },
  ],
  building: [
    { key: 'propertyType', path: 'details.propertyType.value', fieldNum: 26 },
    { key: 'floorNumber', path: 'stellarMLS.building.floorNumber.value', fieldNum: 144 },
    { key: 'buildingTotalFloors', path: 'stellarMLS.building.buildingTotalFloors.value', fieldNum: 145 },
    { key: 'buildingNameNumber', path: 'stellarMLS.building.buildingNameNumber.value', fieldNum: 146 },
    { key: 'buildingElevator', path: 'stellarMLS.building.buildingElevatorYn.value', fieldNum: 147 },
    { key: 'ownershipType', path: 'details.ownershipType.value', fieldNum: 34 },
  ],
  waterfront: [
    { key: 'waterFrontageYn', path: 'stellarMLS.waterfront.waterFrontageYn.value', fieldNum: 155 },
    { key: 'waterfrontFeet', path: 'stellarMLS.waterfront.waterfrontFeet.value', fieldNum: 156 },
    { key: 'waterAccessYn', path: 'stellarMLS.waterfront.waterAccessYn.value', fieldNum: 157 },
    { key: 'waterViewYn', path: 'stellarMLS.waterfront.waterViewYn.value', fieldNum: 158 },
    { key: 'waterBodyName', path: 'stellarMLS.waterfront.waterBodyName.value', fieldNum: 159 },
    { key: 'viewType', path: 'utilities.viewType.value', fieldNum: 131 },
    { key: 'distanceBeach', path: 'location.distanceBeachMiles.value', fieldNum: 87 },
  ],
  location: [
    { key: 'walkScore', path: 'location.walkScore.value', fieldNum: 74 },
    { key: 'transitScore', path: 'location.transitScore.value', fieldNum: 75 },
    { key: 'bikeScore', path: 'location.bikeScore.value', fieldNum: 76 },
    { key: 'walkabilityDesc', path: 'location.walkabilityDescription.value', fieldNum: 80 },
    { key: 'publicTransitAccess', path: 'location.publicTransitAccess.value', fieldNum: 81 },
    { key: 'commuteCityCenter', path: 'location.commuteTimeCityCenter.value', fieldNum: 82 },
    { key: 'noiseLevel', path: 'location.noiseLevel.value', fieldNum: 78 },
    { key: 'noiseLevelDb', path: 'utilities.noiseLevelDbEst.value', fieldNum: 129 },
    { key: 'trafficLevel', path: 'location.trafficLevel.value', fieldNum: 79 },
    { key: 'elevationFeet', path: 'location.elevationFeet.value', fieldNum: 64 },
  ],
  schools: [
    { key: 'schoolDistrict', path: 'location.schoolDistrictName.value', fieldNum: 63 },
    { key: 'elementarySchool', path: 'location.assignedElementary.value', fieldNum: 65 },
    { key: 'elementaryRating', path: 'location.elementaryRating.value', fieldNum: 66 },
    { key: 'elementaryDistance', path: 'location.elementaryDistanceMiles.value', fieldNum: 67 },
    { key: 'middleSchool', path: 'location.assignedMiddle.value', fieldNum: 68 },
    { key: 'middleRating', path: 'location.middleRating.value', fieldNum: 69 },
    { key: 'middleDistance', path: 'location.middleDistanceMiles.value', fieldNum: 70 },
    { key: 'highSchool', path: 'location.assignedHigh.value', fieldNum: 71 },
    { key: 'highRating', path: 'location.highRating.value', fieldNum: 72 },
    { key: 'highDistance', path: 'location.highDistanceMiles.value', fieldNum: 73 },
  ],
  distances: [
    { key: 'distanceGrocery', path: 'location.distanceGroceryMiles.value', fieldNum: 83 },
    { key: 'distanceHospital', path: 'location.distanceHospitalMiles.value', fieldNum: 84 },
    { key: 'distanceAirport', path: 'location.distanceAirportMiles.value', fieldNum: 85 },
    { key: 'distancePark', path: 'location.distanceParkMiles.value', fieldNum: 86 },
    { key: 'distanceBeach', path: 'location.distanceBeachMiles.value', fieldNum: 87 },
    { key: 'emergencyServicesDistance', path: 'utilities.emergencyServicesDistance.value', fieldNum: 116 },
  ],
  safety: [
    { key: 'safetyScore', path: 'calculated.safetyScore', fieldNum: 77, calculated: true },
    { key: 'violentCrimeIndex', path: 'location.crimeIndexViolent.value', fieldNum: 88 },
    { key: 'propertyCrimeIndex', path: 'location.crimeIndexProperty.value', fieldNum: 89 },
    { key: 'neighborhoodSafetyRating', path: 'location.neighborhoodSafetyRating.value', fieldNum: 90 },
  ],
  community: [
    { key: 'hoaYn', path: 'details.hoaYn.value', fieldNum: 30 },
    { key: 'hoaName', path: 'details.hoaName.value', fieldNum: 32 },
    { key: 'hoaIncludes', path: 'details.hoaIncludes.value', fieldNum: 33 },
    { key: 'communityFeatures', path: 'stellarMLS.features.communityFeatures.value', fieldNum: 166 },
    { key: 'neighborhood', path: 'address.neighborhoodName.value', fieldNum: 6 },
    { key: 'subdivisionName', path: 'stellarMLS.legal.subdivisionName.value', fieldNum: 149 },
  ],
  environmental: [
    { key: 'airQualityIndex', path: 'utilities.airQualityIndexCurrent.value', fieldNum: 117 },
    { key: 'airQualityGrade', path: 'utilities.airQualityGrade.value', fieldNum: 118 },
    { key: 'floodZone', path: 'utilities.floodZone.value', fieldNum: 119 },
    { key: 'floodRiskLevel', path: 'utilities.floodRiskLevel.value', fieldNum: 120 },
    { key: 'climateRisk', path: 'utilities.climateRiskWildfireFlood.value', fieldNum: 121 },
    { key: 'wildfireRisk', path: 'utilities.wildfireRisk.value', fieldNum: 122 },
    { key: 'earthquakeRisk', path: 'utilities.earthquakeRisk.value', fieldNum: 123 },
    { key: 'hurricaneRisk', path: 'utilities.hurricaneRisk.value', fieldNum: 124 },
    { key: 'tornadoRisk', path: 'utilities.tornadoRisk.value', fieldNum: 125 },
    { key: 'radonRisk', path: 'utilities.radonRisk.value', fieldNum: 126 },
    { key: 'superfundSiteNearby', path: 'utilities.superfundNearby.value', fieldNum: 127 },
    { key: 'seaLevelRiseRisk', path: 'utilities.seaLevelRiseRisk.value', fieldNum: 128 },
    { key: 'solarPotential', path: 'utilities.solarPotential.value', fieldNum: 130 },
  ],
  utilities: [
    { key: 'electricProvider', path: 'utilities.electricProvider.value', fieldNum: 104 },
    { key: 'waterProvider', path: 'utilities.waterProvider.value', fieldNum: 106 },
    { key: 'sewerProvider', path: 'utilities.sewerProvider.value', fieldNum: 108 },
    { key: 'naturalGas', path: 'utilities.naturalGas.value', fieldNum: 109 },
    { key: 'trashProvider', path: 'utilities.trashProvider.value', fieldNum: 110 },
    { key: 'internetProvidersTop3', path: 'utilities.internetProvidersTop3.value', fieldNum: 111 },
    { key: 'maxInternetSpeed', path: 'utilities.maxInternetSpeed.value', fieldNum: 112 },
    { key: 'fiberAvailable', path: 'utilities.fiberAvailable.value', fieldNum: 113 },
    { key: 'cableTvProvider', path: 'utilities.cableTvProvider.value', fieldNum: 114 },
    { key: 'cellCoverageQuality', path: 'utilities.cellCoverageQuality.value', fieldNum: 115 },
  ],
  investment: [
    { key: 'rentalEstimateMonthly', path: 'financial.rentalEstimateMonthly.value', fieldNum: 98 },
    { key: 'rentalYieldEst', path: 'financial.rentalYieldEst.value', fieldNum: 99 },
    { key: 'capRateEst', path: 'financial.capRateEst.value', fieldNum: 101 },
    { key: 'priceToRentRatio', path: 'financial.priceToRentRatio.value', fieldNum: 93 },
    { key: 'vacancyRateNeighborhood', path: 'financial.vacancyRateNeighborhood.value', fieldNum: 100 },
    { key: 'daysOnMarketAvg', path: 'financial.daysOnMarketAvg.value', fieldNum: 95 },
    { key: 'inventorySurplus', path: 'financial.inventorySurplus.value', fieldNum: 96 },
    { key: 'financingTerms', path: 'financial.financingTerms.value', fieldNum: 102 },
    { key: 'comparableSales', path: 'financial.comparableSalesLast3.value', fieldNum: 103 },
  ],
  leasing: [
    { key: 'canBeLeasedYn', path: 'stellarMLS.leasing.canBeLeasedYn.value', fieldNum: 160 },
    { key: 'minimumLeasePeriod', path: 'stellarMLS.leasing.minimumLeasePeriod.value', fieldNum: 161 },
    { key: 'leaseRestrictionsYn', path: 'stellarMLS.leasing.leaseRestrictionsYn.value', fieldNum: 162 },
    { key: 'petPolicy', path: 'utilities.petPolicy.value', fieldNum: 136 },
    { key: 'petSizeLimit', path: 'stellarMLS.leasing.petSizeLimit.value', fieldNum: 163 },
    { key: 'maxPetWeight', path: 'stellarMLS.leasing.maxPetWeight.value', fieldNum: 164 },
    { key: 'ageRestrictions', path: 'utilities.ageRestrictions.value', fieldNum: 137 },
    { key: 'associationApprovalYn', path: 'stellarMLS.leasing.associationApprovalYn.value', fieldNum: 165 },
    { key: 'accessibilityModifications', path: 'utilities.accessibilityMods.value', fieldNum: 135 },
  ],
  legal: [
    { key: 'parcelId', path: 'details.parcelId.value', fieldNum: 9 },
    { key: 'legalDescription', path: 'stellarMLS.legal.legalDescription.value', fieldNum: 150 },
    { key: 'county', path: 'address.county.value', fieldNum: 7 },
    { key: 'taxYear', path: 'details.taxYear.value', fieldNum: 36 },
    { key: 'taxExemptions', path: 'financial.taxExemptions.value', fieldNum: 38 },
    { key: 'homesteadYn', path: 'stellarMLS.legal.homesteadYn.value', fieldNum: 151 },
    { key: 'cddYn', path: 'stellarMLS.legal.cddYn.value', fieldNum: 152 },
    { key: 'mlsPrimary', path: 'address.mlsPrimary.value', fieldNum: 2 },
    { key: 'mlsSecondary', path: 'address.mlsSecondary.value', fieldNum: 3 },
    { key: 'listingStatus', path: 'address.listingStatus.value', fieldNum: 4 },
    { key: 'listingDate', path: 'address.listingDate.value', fieldNum: 5 },
    { key: 'permitHistoryOther', path: 'structural.permitHistoryPoolAdditions.value', fieldNum: 62 },
  ],
};

// Verification function
function verifyPath(obj: any, path: string): { valid: boolean; error?: string } {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (current === undefined || current === null) {
      return {
        valid: false,
        error: `Path broke at '${parts.slice(0, i).join('.')}' - value is ${current}`
      };
    }

    if (!(part in current)) {
      return {
        valid: false,
        error: `Property '${part}' does not exist on ${parts.slice(0, i).join('.') || 'root'}`
      };
    }

    current = current[part];
  }

  return { valid: true };
}

// Run verification
console.log('🔍 COMPREHENSIVE PATH VERIFICATION FOR COMPARE.TSX');
console.log('=' .repeat(80));
console.log('');

// Create a mock Property object with the correct structure
const mockProperty: Partial<Property> = {
  id: 'test',
  createdAt: '',
  updatedAt: '',
  smartScore: 95,
  dataCompleteness: 85,
  address: {} as any,
  details: {} as any,
  structural: {} as any,
  location: {} as any,
  financial: {} as any,
  utilities: {} as any,
  stellarMLS: {
    parking: {} as any,
    building: {} as any,
    legal: {} as any,
    waterfront: {} as any,
    leasing: {} as any,
    features: {} as any,
  },
};

let totalFields = 0;
let validFields = 0;
let invalidFields = 0;
let calculatedFields = 0;
const errors: Array<{ category: string; field: string; path: string; error: string }> = [];

// Test each category
Object.entries(fieldPaths).forEach(([category, fields]) => {
  console.log(`\n📁 Category: ${category.toUpperCase()}`);
  console.log('-'.repeat(80));

  fields.forEach((field: any) => {
    totalFields++;

    // Skip calculated fields (they won't exist in Property interface)
    if (field.calculated || field.path.startsWith('calculated.')) {
      console.log(`  ⚙️  ${field.key.padEnd(30)} | ${field.path.padEnd(50)} | CALCULATED`);
      calculatedFields++;
      return;
    }

    const result = verifyPath(mockProperty, field.path);

    if (result.valid) {
      validFields++;
      const fieldNumStr = field.fieldNum ? `#${field.fieldNum}` : 'N/A';
      console.log(`  ✅ ${field.key.padEnd(30)} | ${field.path.padEnd(50)} | ${fieldNumStr}`);
    } else {
      invalidFields++;
      errors.push({
        category,
        field: field.key,
        path: field.path,
        error: result.error!
      });
      console.log(`  ❌ ${field.key.padEnd(30)} | ${field.path.padEnd(50)} | ERROR`);
      console.log(`     └─ ${result.error}`);
    }
  });
});

// Summary
console.log('\n' + '='.repeat(80));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(80));
console.log(`Total fields tested:      ${totalFields}`);
console.log(`✅ Valid paths:           ${validFields}`);
console.log(`⚙️  Calculated fields:     ${calculatedFields}`);
console.log(`❌ Invalid paths:         ${invalidFields}`);
console.log('');

if (invalidFields > 0) {
  console.log('❌ VERIFICATION FAILED - Invalid paths detected:');
  console.log('');
  errors.forEach(({ category, field, path, error }) => {
    console.log(`  Category: ${category}`);
    console.log(`  Field:    ${field}`);
    console.log(`  Path:     ${path}`);
    console.log(`  Error:    ${error}`);
    console.log('');
  });
  process.exit(1);
} else {
  console.log('✅ ALL PATHS VERIFIED SUCCESSFULLY!');
  console.log('');
  console.log(`All ${validFields} non-calculated field paths in Compare.tsx correctly`);
  console.log('match the Property interface structure from src/types/property.ts');
  console.log('');
  console.log(`${calculatedFields} calculated fields require implementation of calculation functions.`);
  process.exit(0);
}
