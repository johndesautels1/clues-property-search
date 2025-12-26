/**
 * SMART Score Display - Usage Example
 *
 * This file demonstrates how to use the SMARTScoreDisplay component
 * with sample data and integration with the SMART Score calculator.
 */

import { SMARTScoreDisplay } from './SMARTScoreDisplay';
import { calculateSmartScore } from '@/lib/smart-score-calculator';
import type { Property } from '@/types/property';

// ================================================================
// EXAMPLE 1: Basic Usage with Mock Data
// ================================================================

export function SMARTScoreExample1() {
  // Mock SMART Score result
  const mockResult = {
    finalScore: 82.5,
    sectionBreakdown: [
      {
        sectionId: 'B',
        sectionName: 'Pricing & Value',
        sectionWeight: 20,
        sectionAverage: 85.3,
        weightedContribution: 17.06,
        fieldsPopulated: 4,
        fieldsTotal: 5,
        fieldScores: [
          {
            fieldId: 11,
            fieldName: 'Price per Sqft',
            rawValue: 280,
            normalizedScore: 75,
            confidence: 'High' as const
          },
          {
            fieldId: 12,
            fieldName: 'Market Value Estimate',
            rawValue: 450000,
            normalizedScore: 90,
            confidence: 'Medium-High' as const
          },
        ]
      },
      {
        sectionId: 'I',
        sectionName: 'Assigned Schools',
        sectionWeight: 15,
        sectionAverage: 88.0,
        weightedContribution: 13.2,
        fieldsPopulated: 6,
        fieldsTotal: 8,
        fieldScores: [
          {
            fieldId: 66,
            fieldName: 'Elementary Rating',
            rawValue: 9,
            normalizedScore: 90,
            confidence: 'High' as const
          },
        ]
      },
      // ... more sections
    ],
    confidenceLevel: 'High' as const,
    dataCompleteness: 78,
    scoreableFieldsPopulated: 109,
    scoreableFieldsTotal: 140,
    calculationTimestamp: new Date().toISOString(),
    weightsUsed: { B: 20, I: 15, C: 18, O: 12 },
    weightsSource: 'industry-standard',
    version: 'v2' as const
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 to-black min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 font-orbitron">
          SMART Score Display - Example 1
        </h1>

        <SMARTScoreDisplay
          smartScore={mockResult.finalScore}
          sectionBreakdown={mockResult.sectionBreakdown}
          dataCompleteness={mockResult.dataCompleteness}
          confidenceLevel={mockResult.confidenceLevel}
        />
      </div>
    </div>
  );
}

// ================================================================
// EXAMPLE 2: Integration with Real Calculator
// ================================================================

interface SMARTScoreIntegrationProps {
  property: Property;
}

export function SMARTScoreIntegration({ property }: SMARTScoreIntegrationProps) {
  // Define section weights (you can load these from a config file)
  const sectionWeights = {
    A: 3,   // Address & Identity
    B: 20,  // Pricing & Value
    C: 18,  // Property Basics
    D: 8,   // HOA & Taxes
    E: 7,   // Structure & Systems
    F: 4,   // Interior Features
    G: 5,   // Exterior Features
    H: 3,   // Permits & Renovations
    I: 15,  // Assigned Schools
    J: 6,   // Location Scores
    K: 3,   // Distances & Amenities
    L: 5,   // Safety & Crime
    M: 8,   // Market & Investment
    N: 2,   // Utilities & Connectivity
    O: 12,  // Environment & Risk
    P: 2,   // Additional Features
    Q: 2,   // Parking
    R: 1,   // Building
    S: 2,   // Legal
    T: 4,   // Waterfront
    U: 1,   // Leasing
    V: 1    // Features
  };

  // Calculate SMART Score
  const scoreResult = calculateSmartScore(property, sectionWeights, 'industry-standard');

  return (
    <div className="space-y-6">
      {/* Property Header */}
      <div className="glass-card p-6 border border-white/10 rounded-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">
          {property.address.streetAddress.value}
        </h2>
        <p className="text-gray-400">
          {property.address.city.value}, {property.address.state.value} {property.address.zipCode.value}
        </p>
      </div>

      {/* SMART Score Display */}
      <SMARTScoreDisplay
        smartScore={scoreResult.finalScore}
        sectionBreakdown={scoreResult.sectionBreakdown}
        dataCompleteness={scoreResult.dataCompleteness}
        confidenceLevel={scoreResult.confidenceLevel}
      />

      {/* Additional Context */}
      <div className="glass-card p-6 border border-white/10 rounded-2xl">
        <h3 className="text-lg font-semibold text-white mb-4">Score Metadata</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Calculated</div>
            <div className="text-white font-medium">
              {new Date(scoreResult.calculationTimestamp).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Weights Source</div>
            <div className="text-white font-medium capitalize">
              {scoreResult.weightsSource}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Version</div>
            <div className="text-white font-medium">{scoreResult.version}</div>
          </div>
          <div>
            <div className="text-gray-400">Fields Scored</div>
            <div className="text-white font-medium">
              {scoreResult.scoreableFieldsPopulated}/{scoreResult.scoreableFieldsTotal}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// EXAMPLE 3: Comparison View (Multiple Properties)
// ================================================================

interface ComparisonViewProps {
  properties: Property[];
}

export function SMARTScoreComparison({ properties }: ComparisonViewProps) {
  const weights = { /* your weights */ };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white font-orbitron">
        Property Comparison - SMART Scores
      </h1>

      {properties.map((property) => {
        const scoreResult = calculateSmartScore(property, weights as any, 'industry-standard');

        return (
          <div key={property.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {property.address.streetAddress.value}
              </h2>
              <div className="text-2xl font-bold text-quantum-cyan">
                {scoreResult.finalScore.toFixed(1)}
              </div>
            </div>

            <SMARTScoreDisplay
              smartScore={scoreResult.finalScore}
              sectionBreakdown={scoreResult.sectionBreakdown}
              dataCompleteness={scoreResult.dataCompleteness}
              confidenceLevel={scoreResult.confidenceLevel}
            />
          </div>
        );
      })}
    </div>
  );
}

// ================================================================
// EXAMPLE 4: Embedded in Property Detail Page
// ================================================================

export function PropertyDetailWithSMARTScore({ property }: { property: Property }) {
  const weights = { /* your weights */ };
  const scoreResult = calculateSmartScore(property, weights as any, 'industry-standard');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Property Details */}
      <div className="lg:col-span-1 space-y-6">
        {/* Property info, photos, etc. */}
      </div>

      {/* Right Column: SMART Score */}
      <div className="lg:col-span-2">
        <SMARTScoreDisplay
          smartScore={scoreResult.finalScore}
          sectionBreakdown={scoreResult.sectionBreakdown}
          dataCompleteness={scoreResult.dataCompleteness}
          confidenceLevel={scoreResult.confidenceLevel}
        />
      </div>
    </div>
  );
}
