/**
 * SMART Score Field Mapping Diagnostic Tool
 *
 * Displays all 138 scoreable fields with:
 * - Raw values from property object
 * - Normalized scores (0-100)
 * - Field mapping verification
 * - Issue highlighting (null values, 0 scores, errors)
 * - Section-level statistics
 */

import React, { useState, useMemo } from 'react';
import { Property } from '../types/property';
import { ALL_FIELDS, getFieldByNumber, UI_FIELD_GROUPS } from '../types/fields-schema';
import { ALL_FIELD_NORMALIZERS } from '../lib/normalizations';
import { SCOREABLE_FIELDS } from '../lib/smart-score-calculator';
import { AlertCircle, CheckCircle, XCircle, TrendingDown, Filter } from 'lucide-react';

interface FieldDiagnostic {
  fieldId: number;
  fieldKey: string;
  fieldName: string;
  sectionId: string;
  sectionName: string;
  rawValue: any;
  normalizedScore: number;
  hasNormalizer: boolean;
  isPopulated: boolean;
  hasError: boolean;
  errorMessage?: string;
  propertyPath?: string;
}

interface SectionDiagnostic {
  sectionId: string;
  sectionName: string;
  totalFields: number;
  populatedFields: number;
  averageScore: number;
  zeroScores: number;
  errors: number;
}

interface Props {
  property: Property;
  compact?: boolean;
}

// Map field ID to property path
function getPropertyPath(fieldId: number): string {
  const paths: Record<number, string> = {
    // Section A
    6: 'address.neighborhoodName.value',
    7: 'address.county.value',
    8: 'address.zipCode.value',
    // Section B
    11: 'address.pricePerSqft.value',
    12: 'details.marketValueEstimate.value',
    14: 'details.lastSalePrice.value',
    15: 'details.assessedValue.value',
    16: 'financial.redfinEstimate.value',
    // Section C
    17: 'details.bedrooms.value',
    18: 'details.fullBathrooms.value',
    19: 'details.halfBathrooms.value',
    21: 'details.livingSqft.value',
    22: 'details.totalSqftUnderRoof.value',
    23: 'details.lotSizeSqft.value',
    25: 'details.yearBuilt.value',
    26: 'details.propertyType.value',
    27: 'details.stories.value',
    28: 'details.garageSpaces.value',
    // Section D
    30: 'details.hoaYn.value',
    31: 'details.hoaFeeAnnual.value',
    33: 'details.hoaIncludes.value',
    34: 'details.ownershipType.value',
    35: 'details.annualTaxes.value',
    37: 'financial.propertyTaxRate.value',
    38: 'financial.taxExemptions.value',
    // Section E
    39: 'structural.roofType.value',
    40: 'structural.roofAgeEst.value',
    41: 'structural.exteriorMaterial.value',
    42: 'structural.foundation.value',
    43: 'structural.waterHeaterType.value',
    44: 'structural.garageType.value',
    45: 'structural.hvacType.value',
    46: 'structural.hvacAge.value',
    47: 'structural.laundryType.value',
    48: 'structural.interiorCondition.value',
    // Section F
    49: 'structural.flooringType.value',
    50: 'structural.kitchenFeatures.value',
    51: 'structural.appliancesIncluded.value',
    52: 'structural.fireplaceYn.value',
    // Section G
    54: 'structural.poolYn.value',
    55: 'structural.poolType.value',
    56: 'structural.deckPatio.value',
    57: 'structural.fence.value',
    58: 'structural.landscaping.value',
    // Section H
    59: 'structural.recentRenovations.value',
    60: 'structural.permitHistoryRoof.value',
    61: 'structural.permitHistoryHvac.value',
    62: 'structural.permitHistoryPoolAdditions.value',
    // Section I
    63: 'location.schoolDistrictName.value',
    64: 'location.elevationFeet.value',
    66: 'location.elementaryRating.value',
    67: 'location.elementaryDistanceMiles.value',
    69: 'location.middleRating.value',
    70: 'location.middleDistanceMiles.value',
    72: 'location.highRating.value',
    73: 'location.highDistanceMiles.value',
    // Section J
    74: 'location.walkScore.value',
    75: 'location.transitScore.value',
    76: 'location.bikeScore.value',
    77: 'location.safetyScore.value',
    78: 'location.noiseLevel.value',
    79: 'location.trafficLevel.value',
    81: 'location.publicTransitAccess.value',
    82: 'location.commuteTimeCityCenter.value',
    // Section K
    83: 'location.distanceGroceryMiles.value',
    84: 'location.distanceHospitalMiles.value',
    85: 'location.distanceAirportMiles.value',
    86: 'location.distanceParkMiles.value',
    87: 'location.distanceBeachMiles.value',
    // Section L
    88: 'location.crimeIndexViolent.value',
    89: 'location.crimeIndexProperty.value',
    90: 'location.neighborhoodSafetyRating.value',
    // Section M
    91: 'financial.medianHomePriceNeighborhood.value',
    92: 'financial.pricePerSqftRecentAvg.value',
    93: 'financial.priceToRentRatio.value',
    94: 'financial.priceVsMedianPercent.value',
    95: 'financial.daysOnMarketAvg.value',
    96: 'financial.inventorySurplus.value',
    97: 'financial.insuranceEstAnnual.value',
    98: 'financial.rentalEstimateMonthly.value',
    99: 'financial.rentalYieldEst.value',
    100: 'financial.vacancyRateNeighborhood.value',
    101: 'financial.capRateEst.value',
    102: 'financial.financingTerms.value',
    // Section N
    105: 'utilities.avgElectricBill.value',
    107: 'utilities.avgWaterBill.value',
    109: 'utilities.naturalGas.value',
    111: 'utilities.internetProvidersTop3.value',
    112: 'utilities.maxInternetSpeed.value',
    113: 'utilities.fiberAvailable.value',
    115: 'utilities.cellCoverageQuality.value',
    116: 'utilities.emergencyServicesDistance.value',
    // Section O
    117: 'utilities.airQualityIndexCurrent.value',
    118: 'utilities.airQualityGrade.value',
    119: 'utilities.floodZone.value',
    120: 'utilities.floodRiskLevel.value',
    121: 'utilities.climateRiskWildfireFlood.value',
    122: 'utilities.wildfireRisk.value',
    123: 'utilities.earthquakeRisk.value',
    124: 'utilities.hurricaneRisk.value',
    125: 'utilities.tornadoRisk.value',
    126: 'utilities.radonRisk.value',
    127: 'utilities.superfundNearby.value',
    128: 'utilities.seaLevelRiseRisk.value',
    129: 'utilities.noiseLevelDbEst.value',
    130: 'utilities.solarPotential.value',
    // Section P
    131: 'utilities.viewType.value',
    132: 'utilities.lotFeatures.value',
    133: 'utilities.evChargingYn.value',
    134: 'utilities.smartHomeFeatures.value',
    135: 'utilities.accessibilityMods.value',
    136: 'utilities.petPolicy.value',
    137: 'utilities.ageRestrictions.value',
    138: 'financial.specialAssessments.value',
    // Sections Q-V (Stellar MLS)
    139: 'stellarMLS.parking.carportYn.value',
    140: 'stellarMLS.parking.carportSpaces.value',
    141: 'stellarMLS.parking.garageAttachedYn.value',
    142: 'stellarMLS.parking.parkingFeatures.value',
    143: 'stellarMLS.parking.assignedParkingSpaces.value',
    144: 'stellarMLS.building.floorNumber.value',
    147: 'stellarMLS.building.buildingElevatorYn.value',
    148: 'stellarMLS.building.floorsInUnit.value',
    151: 'stellarMLS.legal.homesteadYn.value',
    152: 'stellarMLS.legal.cddYn.value',
    153: 'stellarMLS.legal.annualCddFee.value',
    154: 'stellarMLS.legal.frontExposure.value',
    155: 'stellarMLS.waterfront.waterFrontageYn.value',
    156: 'stellarMLS.waterfront.waterfrontFeet.value',
    157: 'stellarMLS.waterfront.waterAccessYn.value',
    158: 'stellarMLS.waterfront.waterViewYn.value',
    159: 'stellarMLS.waterfront.waterBodyName.value',
    160: 'stellarMLS.leasing.canBeLeasedYn.value',
    161: 'stellarMLS.leasing.minimumLeasePeriod.value',
    162: 'stellarMLS.leasing.leaseRestrictionsYn.value',
    165: 'stellarMLS.leasing.associationApprovalYn.value',
    166: 'stellarMLS.features.communityFeatures.value',
    167: 'stellarMLS.features.interiorFeatures.value',
    168: 'stellarMLS.features.exteriorFeatures.value',
  };
  return paths[fieldId] || 'UNKNOWN';
}

// Get value from property using path
function getValueByPath(obj: any, path: string): any {
  try {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  } catch {
    return null;
  }
}

export default function SMARTScoreDiagnostic({ property, compact = false }: Props) {
  const [filterMode, setFilterMode] = useState<'all' | 'populated' | 'issues'>('all');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Generate diagnostics for all scoreable fields
  const fieldDiagnostics = useMemo(() => {
    const diagnostics: FieldDiagnostic[] = [];

    SCOREABLE_FIELDS.forEach(fieldId => {
      const fieldDef = getFieldByNumber(fieldId);
      if (!fieldDef) return;

      // Find section from UI_FIELD_GROUPS
      const section = UI_FIELD_GROUPS.find((g: { fields: number[] }) => g.fields.includes(fieldId));
      if (!section) return;

      const propertyPath = getPropertyPath(fieldId);
      const rawValue = getValueByPath(property, propertyPath);
      const isPopulated = rawValue !== null && rawValue !== undefined && rawValue !== '';
      const hasNormalizer = !!ALL_FIELD_NORMALIZERS[fieldId];

      let normalizedScore = 0;
      let hasError = false;
      let errorMessage: string | undefined;

      if (isPopulated && hasNormalizer) {
        try {
          const normalizer = ALL_FIELD_NORMALIZERS[fieldId];
          const result = normalizer(rawValue, property);

          if (typeof result === 'number') {
            normalizedScore = Math.max(0, Math.min(100, result));
          } else if (result && typeof result === 'object' && 'score' in result) {
            normalizedScore = Math.max(0, Math.min(100, result.score));
          } else {
            hasError = true;
            errorMessage = 'Invalid normalizer return type';
          }
        } catch (error) {
          hasError = true;
          errorMessage = error instanceof Error ? error.message : 'Unknown error';
        }
      } else if (isPopulated && !hasNormalizer) {
        hasError = true;
        errorMessage = 'No normalizer defined';
      }

      diagnostics.push({
        fieldId,
        fieldKey: fieldDef.key,
        fieldName: fieldDef.label,
        sectionId: section.id,
        sectionName: section.name,
        rawValue,
        normalizedScore,
        hasNormalizer,
        isPopulated,
        hasError,
        errorMessage,
        propertyPath,
      });
    });

    return diagnostics;
  }, [property]);

  // Generate section diagnostics
  const sectionDiagnostics = useMemo(() => {
    const sections: Record<string, SectionDiagnostic> = {};

    fieldDiagnostics.forEach(field => {
      if (!sections[field.sectionId]) {
        sections[field.sectionId] = {
          sectionId: field.sectionId,
          sectionName: field.sectionName,
          totalFields: 0,
          populatedFields: 0,
          averageScore: 0,
          zeroScores: 0,
          errors: 0,
        };
      }

      const section = sections[field.sectionId];
      section.totalFields++;
      if (field.isPopulated) section.populatedFields++;
      if (field.normalizedScore === 0 && field.isPopulated) section.zeroScores++;
      if (field.hasError) section.errors++;
    });

    // Calculate average scores
    Object.values(sections).forEach(section => {
      const sectionFields = fieldDiagnostics.filter(
        f => f.sectionId === section.sectionId && f.isPopulated
      );
      if (sectionFields.length > 0) {
        section.averageScore =
          sectionFields.reduce((sum, f) => sum + f.normalizedScore, 0) / sectionFields.length;
      }
    });

    return Object.values(sections).sort((a, b) => a.sectionId.localeCompare(b.sectionId));
  }, [fieldDiagnostics]);

  // Filter fields based on mode and section
  const filteredFields = useMemo(() => {
    let fields = fieldDiagnostics;

    if (selectedSection) {
      fields = fields.filter(f => f.sectionId === selectedSection);
    }

    switch (filterMode) {
      case 'populated':
        return fields.filter(f => f.isPopulated);
      case 'issues':
        return fields.filter(f => !f.isPopulated || f.hasError || f.normalizedScore === 0);
      default:
        return fields;
    }
  }, [fieldDiagnostics, filterMode, selectedSection]);

  // Overall statistics
  const totalFields = fieldDiagnostics.length;
  const populatedFields = fieldDiagnostics.filter(f => f.isPopulated).length;
  const totalErrors = fieldDiagnostics.filter(f => f.hasError).length;
  const zeroScores = fieldDiagnostics.filter(f => f.isPopulated && f.normalizedScore === 0).length;
  const avgScore =
    populatedFields > 0
      ? fieldDiagnostics
          .filter(f => f.isPopulated)
          .reduce((sum, f) => sum + f.normalizedScore, 0) / populatedFields
      : 0;

  return (
    <div className={compact ? 'text-xs' : 'text-sm'}>
      {/* Header */}
      <div className="mb-4">
        <h2 className={compact ? 'text-lg font-bold text-white mb-2' : 'text-2xl font-bold text-white mb-3'}>
          Smart Score Breakdown
        </h2>
        <div className="text-gray-400">
          Property: {property.address.fullAddress?.value || 'Unknown'}
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Total Fields</div>
          <div className="text-2xl font-bold text-white">{totalFields}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Populated</div>
          <div className="text-2xl font-bold text-quantum-cyan">{populatedFields}</div>
          <div className="text-xs text-gray-500">{((populatedFields / totalFields) * 100).toFixed(0)}%</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Avg Score</div>
          <div className="text-2xl font-bold text-green-400">{avgScore.toFixed(1)}</div>
          <div className="text-xs text-gray-500">of 100</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Zero Scores</div>
          <div className="text-2xl font-bold text-yellow-400">{zeroScores}</div>
          <div className="text-xs text-gray-500">{populatedFields > 0 ? ((zeroScores / populatedFields) * 100).toFixed(0) : 0}%</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Errors</div>
          <div className="text-2xl font-bold text-red-400">{totalErrors}</div>
          <div className="text-xs text-gray-500">{((totalErrors / totalFields) * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1 rounded ${
            filterMode === 'all' ? 'bg-quantum-cyan text-black' : 'bg-white/10 text-gray-300'
          }`}
        >
          All Fields ({totalFields})
        </button>
        <button
          onClick={() => setFilterMode('populated')}
          className={`px-3 py-1 rounded ${
            filterMode === 'populated' ? 'bg-quantum-cyan text-black' : 'bg-white/10 text-gray-300'
          }`}
        >
          Populated ({populatedFields})
        </button>
        <button
          onClick={() => setFilterMode('issues')}
          className={`px-3 py-1 rounded ${
            filterMode === 'issues' ? 'bg-quantum-cyan text-black' : 'bg-white/10 text-gray-300'
          }`}
        >
          Issues ({zeroScores + totalErrors})
        </button>
      </div>

      {/* Section Summary */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Section Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {sectionDiagnostics.map(section => {
            const hasIssues = section.errors > 0 || section.zeroScores > 0;
            const completion = (section.populatedFields / section.totalFields) * 100;

            return (
              <button
                key={section.sectionId}
                onClick={() => setSelectedSection(selectedSection === section.sectionId ? null : section.sectionId)}
                className={`p-2 rounded text-left transition-all ${
                  selectedSection === section.sectionId
                    ? 'bg-quantum-cyan/20 border-2 border-quantum-cyan'
                    : 'bg-white/5 border-2 border-transparent hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">{section.sectionId}</span>
                  {hasIssues && <AlertCircle className="w-3 h-3 text-yellow-400" />}
                </div>
                <div className="text-[10px] text-gray-400 mb-1">{section.sectionName}</div>
                <div className="text-xs text-gray-300">
                  {section.populatedFields}/{section.totalFields} • {section.averageScore.toFixed(0)}
                </div>
                <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                  <div
                    className="bg-quantum-cyan rounded-full h-1"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
        {selectedSection && (
          <button
            onClick={() => setSelectedSection(null)}
            className="mt-2 text-xs text-quantum-cyan hover:underline"
          >
            Clear section filter
          </button>
        )}
      </div>

      {/* Field Details */}
      <div className="space-y-1 max-h-[600px] overflow-y-auto">
        <div className="grid grid-cols-12 gap-2 px-2 py-1 bg-white/5 rounded text-xs font-semibold text-gray-400 sticky top-0">
          <div className="col-span-1">ID</div>
          <div className="col-span-1">Sec</div>
          <div className="col-span-3">Field Name</div>
          <div className="col-span-3">Raw Value</div>
          <div className="col-span-1 text-center">Score</div>
          <div className="col-span-2">Property Path</div>
          <div className="col-span-1 text-center">Status</div>
        </div>

        {filteredFields.map(field => {
          const scoreColor =
            field.normalizedScore === 0 && field.isPopulated
              ? 'text-yellow-400'
              : field.normalizedScore < 50
              ? 'text-orange-400'
              : field.normalizedScore < 75
              ? 'text-green-400'
              : 'text-quantum-cyan';

          return (
            <div
              key={field.fieldId}
              className={`grid grid-cols-12 gap-2 px-2 py-1 rounded text-xs ${
                field.hasError
                  ? 'bg-red-500/10 border-l-2 border-red-500'
                  : !field.isPopulated
                  ? 'bg-white/5 opacity-50'
                  : field.normalizedScore === 0
                  ? 'bg-yellow-500/10 border-l-2 border-yellow-500'
                  : 'bg-white/5'
              }`}
            >
              <div className="col-span-1 text-gray-400">{field.fieldId}</div>
              <div className="col-span-1 font-bold text-quantum-cyan">{field.sectionId}</div>
              <div className="col-span-3 text-gray-300 truncate" title={field.fieldName}>
                {field.fieldName}
              </div>
              <div className="col-span-3 text-white truncate" title={JSON.stringify(field.rawValue)}>
                {field.isPopulated ? (
                  typeof field.rawValue === 'boolean' ? (
                    field.rawValue ? 'Yes' : 'No'
                  ) : typeof field.rawValue === 'object' ? (
                    <span className="text-gray-400">Object/Array</span>
                  ) : (
                    String(field.rawValue)
                  )
                ) : (
                  <span className="text-gray-500 italic">null</span>
                )}
              </div>
              <div className={`col-span-1 text-center font-bold ${scoreColor}`}>
                {field.isPopulated ? field.normalizedScore.toFixed(0) : '-'}
              </div>
              <div className="col-span-2 text-gray-500 text-[10px] truncate" title={field.propertyPath}>
                {field.propertyPath}
              </div>
              <div className="col-span-1 flex justify-center">
                {field.hasError ? (
                  <div title={field.errorMessage}>
                    <XCircle className="w-4 h-4 text-red-400" />
                  </div>
                ) : field.isPopulated ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-gray-600" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredFields.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No fields match the current filter
        </div>
      )}
    </div>
  );
}
