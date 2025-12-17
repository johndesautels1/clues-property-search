/**
 * Hallucination Probability Scorer
 *
 * Instead of binary pass/fail, this scores the quality/reliability of LLM calculations
 * on a 0-100 scale. The issue isn't "hallucinations" (making up data), it's
 * "lazy responses" (skipping the mathematical work we asked for).
 */

export type CalculationConfidence = 'VERIFIED' | 'HIGH' | 'MODERATE' | 'LOW' | 'NONE';

export interface CalculationQuality {
  score: number; // 0-100
  confidence: CalculationConfidence;
  reason: string;
  color: string; // For UI display
}

export interface FieldQualityAnalysis {
  fieldNumber: number;
  fieldName: string;
  qualityScore: number; // 0-100 average across all 3 properties
  property1: CalculationQuality;
  property2: CalculationQuality;
  property3: CalculationQuality;
  isReliable: boolean; // true if avgScore >= 75
}

/**
 * Score the quality of a single calculation string
 *
 * @param calculation - The calculation string from the LLM
 * @returns Quality score (0-100) with confidence level
 */
export function scoreCalculationQuality(calculation: string | undefined | null): CalculationQuality {
  // NONE (0%) - No calculation provided
  if (!calculation || calculation.trim() === '' || calculation.toLowerCase() === 'n/a') {
    return {
      score: 0,
      confidence: 'NONE',
      reason: 'No calculation provided',
      color: '#ef4444' // red
    };
  }

  const calc = calculation.toLowerCase();

  // VERIFIED (100%) - Has complete formula with actual numbers and operations
  // Example: "100 - ((450000-450000)/(650000-450000))*100 = 100"
  const hasEquals = calc.includes('=');
  const hasNumbers = /\d+/.test(calc);
  const hasOperations = /[+\-*/()]/.test(calc);
  const hasMultipleNumbers = (calc.match(/\d+/g) || []).length >= 3;

  if (hasEquals && hasNumbers && hasOperations && hasMultipleNumbers) {
    return {
      score: 100,
      confidence: 'VERIFIED',
      reason: 'Complete formula with numbers and operations',
      color: '#22c55e' // green
    };
  }

  // HIGH (75%) - Has formula structure with some numbers
  // Example: "score = (value - min) / (max - min) * 100 = 85"
  if (hasEquals && hasNumbers && hasOperations) {
    return {
      score: 75,
      confidence: 'HIGH',
      reason: 'Formula present with some calculations',
      color: '#84cc16' // lime
    };
  }

  // MODERATE (50%) - References methodology or shows some math
  // Example: "Weighted average of fields 10-16"
  const mentionsMath =
    calc.includes('average') ||
    calc.includes('weighted') ||
    calc.includes('score') ||
    calc.includes('formula') ||
    calc.includes('calculate') ||
    calc.includes('sum') ||
    calc.includes('total');

  if (mentionsMath && hasNumbers) {
    return {
      score: 50,
      confidence: 'MODERATE',
      reason: 'Methodology referenced with some numbers',
      color: '#eab308' // yellow
    };
  }

  // LOW (25%) - Generic text, no real proof
  // Example: "Property 1 has better value"
  if (calc.length > 10) {
    return {
      score: 25,
      confidence: 'LOW',
      reason: 'Generic explanation without mathematical proof',
      color: '#f97316' // orange
    };
  }

  // NONE (0%) - Placeholder or meaningless
  return {
    score: 0,
    confidence: 'NONE',
    reason: 'Invalid or placeholder text',
    color: '#ef4444' // red
  };
}

/**
 * Analyze the quality of all calculations for a single field comparison
 *
 * @param fieldComparison - The field comparison object from LLM
 * @returns Quality analysis with per-property scores
 */
export function analyzeFieldQuality(fieldComparison: any): FieldQualityAnalysis {
  const p1Quality = scoreCalculationQuality(fieldComparison.property1?.calculation);
  const p2Quality = scoreCalculationQuality(fieldComparison.property2?.calculation);
  const p3Quality = scoreCalculationQuality(fieldComparison.property3?.calculation);

  const avgScore = (p1Quality.score + p2Quality.score + p3Quality.score) / 3;

  return {
    fieldNumber: fieldComparison.fieldNumber,
    fieldName: fieldComparison.fieldName,
    qualityScore: avgScore,
    property1: p1Quality,
    property2: p2Quality,
    property3: p3Quality,
    isReliable: avgScore >= 75
  };
}

/**
 * Analyze quality across all field comparisons
 *
 * @param fieldComparisons - Array of field comparisons from LLM
 * @returns Summary statistics and detailed quality analysis
 */
export function analyzeOverallQuality(fieldComparisons: any[]) {
  const analyses = fieldComparisons.map(fc => analyzeFieldQuality(fc));

  const totalScore = analyses.reduce((sum, a) => sum + a.qualityScore, 0);
  const avgQuality = totalScore / analyses.length;

  const reliableCount = analyses.filter(a => a.isReliable).length;
  const unreliableCount = analyses.length - reliableCount;

  const confidenceCounts = {
    VERIFIED: 0,
    HIGH: 0,
    MODERATE: 0,
    LOW: 0,
    NONE: 0
  };

  // Count confidence levels across all properties
  analyses.forEach(a => {
    confidenceCounts[a.property1.confidence]++;
    confidenceCounts[a.property2.confidence]++;
    confidenceCounts[a.property3.confidence]++;
  });

  return {
    totalFields: analyses.length,
    avgQuality,
    reliableCount,
    unreliableCount,
    reliablePercent: (reliableCount / analyses.length) * 100,
    confidenceCounts,
    analyses,
    overallConfidence:
      avgQuality >= 90 ? 'VERIFIED' :
      avgQuality >= 75 ? 'HIGH' :
      avgQuality >= 50 ? 'MODERATE' :
      avgQuality >= 25 ? 'LOW' : 'NONE'
  };
}

/**
 * Get display-friendly label for confidence level
 */
export function getConfidenceLabel(confidence: CalculationConfidence): string {
  switch (confidence) {
    case 'VERIFIED': return '✓ VERIFIED';
    case 'HIGH': return '✓ HIGH QUALITY';
    case 'MODERATE': return '⚠️ MODERATE';
    case 'LOW': return '⚠️ LOW QUALITY';
    case 'NONE': return '❌ NO CALCULATION';
  }
}

/**
 * Get probability that a field analysis contains hallucinations/lazy responses
 *
 * @param qualityScore - Quality score (0-100)
 * @returns Hallucination probability (0-100)
 */
export function getHallucinationProbability(qualityScore: number): number {
  // Inverse of quality score
  // 100 quality = 0% hallucination
  // 0 quality = 100% hallucination
  return 100 - qualityScore;
}
