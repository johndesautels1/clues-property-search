/**
 * CLUES SMART Score - TIER 3 Grand Unified Consensus
 *
 * Arbitrates between client-side calculation (TIER 1) and LLM consensus (TIER 2)
 * to produce the final SMART Score displayed to users.
 *
 * @module smart-score-unifier
 * @version 1.0.0
 * @date 2025-12-27
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface Tier1Score {
  property1: number;
  property2: number;
  property3: number;
  method: 'client-side';
  timestamp: string;
}

export interface Tier2Score {
  property1: number;
  property2: number;
  property3: number;
  method: 'llm-consensus';
  consensusMethod: 'agreement' | 'tiebreaker';
  timestamp: string;
}

export interface UnifiedScore {
  property1: number;
  property2: number;
  property3: number;
  arbitrationMethod: 'average' | 'weighted' | 'client-only' | 'llm-only';
  tier1Scores: number[];
  tier2Scores: number[];
  weights: {
    clientSide: number;
    llmConsensus: number;
  };
  divergence: {
    property1: number;
    property2: number;
    property3: number;
    maxDivergence: number;
  };
  confidence: 'high' | 'medium' | 'low';
  timestamp: string;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Thresholds for arbitration logic
 */
const ARBITRATION_CONFIG = {
  // If scores differ by <= this, they "agree" (use simple average)
  AGREEMENT_THRESHOLD: 5,

  // If scores differ by > this, flag as low confidence
  DIVERGENCE_WARNING: 15,

  // Weights when scores disagree moderately (6-15 points apart)
  MODERATE_DISAGREEMENT_WEIGHTS: {
    clientSide: 0.55, // Favor client-side slightly (objective formulas)
    llmConsensus: 0.45,
  },

  // Weights when scores disagree significantly (>15 points apart)
  HIGH_DISAGREEMENT_WEIGHTS: {
    clientSide: 0.60, // Favor client-side more (prevent LLM hallucination)
    llmConsensus: 0.40,
  },

  // If LLM consensus used tiebreaker, trust it slightly less
  TIEBREAKER_PENALTY: 0.05, // Reduce LLM weight by 5%
};

// =============================================================================
// CORE ARBITRATION LOGIC
// =============================================================================

/**
 * Calculate divergence between two scores
 */
function calculateDivergence(score1: number, score2: number): number {
  return Math.abs(score1 - score2);
}

/**
 * Determine confidence level based on divergence
 */
function determineConfidence(maxDivergence: number): 'high' | 'medium' | 'low' {
  if (maxDivergence <= ARBITRATION_CONFIG.AGREEMENT_THRESHOLD) {
    return 'high';
  } else if (maxDivergence <= ARBITRATION_CONFIG.DIVERGENCE_WARNING) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Arbitrate between client-side and LLM consensus scores for a single property
 */
function arbitratePropertyScore(
  clientScore: number,
  llmScore: number,
  llmUsedTiebreaker: boolean
): {
  finalScore: number;
  method: 'average' | 'weighted';
  weights: { clientSide: number; llmConsensus: number };
} {
  const divergence = calculateDivergence(clientScore, llmScore);

  // CASE 1: Scores agree (within 5 points) - Simple average
  if (divergence <= ARBITRATION_CONFIG.AGREEMENT_THRESHOLD) {
    return {
      finalScore: (clientScore + llmScore) / 2,
      method: 'average',
      weights: {
        clientSide: 0.5,
        llmConsensus: 0.5,
      },
    };
  }

  // CASE 2: Moderate disagreement (6-15 points) - Weighted average
  if (divergence <= ARBITRATION_CONFIG.DIVERGENCE_WARNING) {
    let weights: { clientSide: number; llmConsensus: number } = { ...ARBITRATION_CONFIG.MODERATE_DISAGREEMENT_WEIGHTS };

    // If LLM used tiebreaker, trust it slightly less
    if (llmUsedTiebreaker) {
      weights = {
        clientSide: weights.clientSide + ARBITRATION_CONFIG.TIEBREAKER_PENALTY,
        llmConsensus: weights.llmConsensus - ARBITRATION_CONFIG.TIEBREAKER_PENALTY,
      };
    }

    const finalScore = clientScore * weights.clientSide + llmScore * weights.llmConsensus;

    return {
      finalScore: Math.round(finalScore * 10) / 10, // Round to 1 decimal
      method: 'weighted',
      weights,
    };
  }

  // CASE 3: High disagreement (>15 points) - Favor client-side heavily
  let weights: { clientSide: number; llmConsensus: number } = { ...ARBITRATION_CONFIG.HIGH_DISAGREEMENT_WEIGHTS };

  // If LLM used tiebreaker, trust it even less
  if (llmUsedTiebreaker) {
    weights = {
      clientSide: weights.clientSide + ARBITRATION_CONFIG.TIEBREAKER_PENALTY * 2,
      llmConsensus: weights.llmConsensus - ARBITRATION_CONFIG.TIEBREAKER_PENALTY * 2,
    };
  }

  const finalScore = clientScore * weights.clientSide + llmScore * weights.llmConsensus;

  console.warn(
    `[SMART Score Unifier] HIGH DIVERGENCE: Client=${clientScore}, LLM=${llmScore}, Diff=${divergence}`
  );

  return {
    finalScore: Math.round(finalScore * 10) / 10,
    method: 'weighted',
    weights,
  };
}

/**
 * Main unified consensus calculation
 */
export function calculateUnifiedConsensus(tier1: Tier1Score, tier2: Tier2Score): UnifiedScore {
  const llmUsedTiebreaker = tier2.consensusMethod === 'tiebreaker';

  // Arbitrate for each property
  const property1Result = arbitratePropertyScore(tier1.property1, tier2.property1, llmUsedTiebreaker);
  const property2Result = arbitratePropertyScore(tier1.property2, tier2.property2, llmUsedTiebreaker);
  const property3Result = arbitratePropertyScore(tier1.property3, tier2.property3, llmUsedTiebreaker);

  // Calculate divergence metrics
  const divergences = {
    property1: calculateDivergence(tier1.property1, tier2.property1),
    property2: calculateDivergence(tier1.property2, tier2.property2),
    property3: calculateDivergence(tier1.property3, tier2.property3),
  };

  const maxDivergence = Math.max(divergences.property1, divergences.property2, divergences.property3);

  // Determine overall arbitration method
  // Use the most conservative method across all 3 properties
  const methods = [property1Result.method, property2Result.method, property3Result.method];
  const arbitrationMethod = methods.includes('weighted') ? 'weighted' : 'average';

  // Average the weights across all properties (for reporting)
  const avgWeights = {
    clientSide:
      (property1Result.weights.clientSide +
        property2Result.weights.clientSide +
        property3Result.weights.clientSide) /
      3,
    llmConsensus:
      (property1Result.weights.llmConsensus +
        property2Result.weights.llmConsensus +
        property3Result.weights.llmConsensus) /
      3,
  };

  return {
    property1: property1Result.finalScore,
    property2: property2Result.finalScore,
    property3: property3Result.finalScore,
    arbitrationMethod,
    tier1Scores: [tier1.property1, tier1.property2, tier1.property3],
    tier2Scores: [tier2.property1, tier2.property2, tier2.property3],
    weights: avgWeights,
    divergence: {
      property1: divergences.property1,
      property2: divergences.property2,
      property3: divergences.property3,
      maxDivergence,
    },
    confidence: determineConfidence(maxDivergence),
    timestamp: new Date().toISOString(),
  };
}

// =============================================================================
// FALLBACK STRATEGIES
// =============================================================================

/**
 * Use only client-side scores (if LLM fails)
 */
export function useClientSideOnly(tier1: Tier1Score): UnifiedScore {
  console.warn('[SMART Score Unifier] ⚠️ Using client-side scores only (LLM unavailable)');

  return {
    property1: tier1.property1,
    property2: tier1.property2,
    property3: tier1.property3,
    arbitrationMethod: 'client-only',
    tier1Scores: [tier1.property1, tier1.property2, tier1.property3],
    tier2Scores: [0, 0, 0],
    weights: {
      clientSide: 1.0,
      llmConsensus: 0.0,
    },
    divergence: {
      property1: 0,
      property2: 0,
      property3: 0,
      maxDivergence: 0,
    },
    confidence: 'medium', // Reduced confidence without LLM validation
    timestamp: new Date().toISOString(),
  };
}

/**
 * Use only LLM scores (if client-side calculation fails - unlikely)
 */
export function useLLMOnly(tier2: Tier2Score): UnifiedScore {
  console.warn('[SMART Score Unifier] ⚠️ Using LLM scores only (client-side unavailable)');

  return {
    property1: tier2.property1,
    property2: tier2.property2,
    property3: tier2.property3,
    arbitrationMethod: 'llm-only',
    tier1Scores: [0, 0, 0],
    tier2Scores: [tier2.property1, tier2.property2, tier2.property3],
    weights: {
      clientSide: 0.0,
      llmConsensus: 1.0,
    },
    divergence: {
      property1: 0,
      property2: 0,
      property3: 0,
      maxDivergence: 0,
    },
    confidence: tier2.consensusMethod === 'agreement' ? 'medium' : 'low', // Lower confidence without client validation
    timestamp: new Date().toISOString(),
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format unified score for display
 */
export function formatUnifiedScore(score: number): string {
  return score.toFixed(1);
}

/**
 * Get confidence color for UI
 */
export function getConfidenceColor(confidence: 'high' | 'medium' | 'low'): string {
  const colors = {
    high: 'text-green-400',
    medium: 'text-amber-400',
    low: 'text-red-400',
  };

  return colors[confidence];
}

/**
 * Get confidence label for UI
 */
export function getConfidenceLabel(confidence: 'high' | 'medium' | 'low'): string {
  const labels = {
    high: 'High Confidence',
    medium: 'Medium Confidence',
    low: 'Low Confidence - Review Manually',
  };

  return labels[confidence];
}

/**
 * Generate explanation for arbitration method
 */
export function explainArbitration(unified: UnifiedScore): string {
  const { arbitrationMethod, divergence, confidence } = unified;

  if (arbitrationMethod === 'average') {
    return `Client-side and LLM consensus scores are in close agreement (within ${divergence.maxDivergence.toFixed(
      1
    )} points). Final score is the average of both methods.`;
  }

  if (arbitrationMethod === 'weighted') {
    return `Client-side and LLM consensus scores diverged by ${divergence.maxDivergence.toFixed(
      1
    )} points. Final score uses weighted average favoring objective client-side calculations (${(
      unified.weights.clientSide * 100
    ).toFixed(0)}% client, ${(unified.weights.llmConsensus * 100).toFixed(0)}% LLM).`;
  }

  if (arbitrationMethod === 'client-only') {
    return `LLM consensus unavailable. Score based solely on client-side industry-standard calculations.`;
  }

  if (arbitrationMethod === 'llm-only') {
    return `Client-side calculation unavailable. Score based solely on LLM consensus with ${confidence} confidence.`;
  }

  return 'Unknown arbitration method';
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  calculateUnifiedConsensus,
  useClientSideOnly,
  useLLMOnly,
  formatUnifiedScore,
  getConfidenceColor,
  getConfidenceLabel,
  explainArbitration,
  ARBITRATION_CONFIG,
};
