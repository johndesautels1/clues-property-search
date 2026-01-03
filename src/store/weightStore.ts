/**
 * CLUES Weight Store - Centralized Section Weight Management
 *
 * Provides user-adjustable weights for all 23 sections (A-W) with:
 * - Auto-rebalancing: When one weight changes, others proportionally adjust
 * - Persistence: Saves to localStorage
 * - Normalization: Always sums to exactly 100%
 * - Default weights: Industry-standard Florida coastal market weights
 *
 * CRITICAL: This is the SINGLE SOURCE OF TRUTH for all weight calculations.
 * All weight consumers MUST use getWeights() from this store.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ================================================================
// TYPE DEFINITIONS
// ================================================================

export interface SectionWeight {
  id: string;                    // 'A', 'B', ... 'W'
  name: string;                  // 'Address & Identity', etc.
  weight: number;                // Percentage (0-100), all must sum to 100
  minWeight: number;             // Minimum allowed (prevents 0 for critical sections)
  maxWeight: number;             // Maximum allowed (prevents one section dominating)
  isCritical: boolean;           // Critical sections have higher minimums
  color: string;                 // For UI display
}

export interface WeightState {
  // Current weights (always sum to 100)
  weights: Record<string, number>;

  // Whether user has customized (vs using defaults)
  isCustomized: boolean;

  // Last modification timestamp
  lastModified: string | null;

  // Source identifier
  weightsSource: 'industry-standard' | 'user-defined' | 'llm-researched';
}

export interface WeightActions {
  // Get all weights as Record<string, number>
  getWeights: () => Record<string, number>;

  // Get single section weight
  getSectionWeight: (sectionId: string) => number;

  // Set single section weight (auto-rebalances others)
  setSectionWeight: (sectionId: string, newWeight: number) => void;

  // Set multiple weights at once (normalizes to 100%)
  setWeights: (weights: Record<string, number>) => void;

  // Reset to industry-standard defaults
  resetToDefaults: () => void;

  // Get weight metadata for UI
  getWeightMetadata: () => SectionWeight[];

  // Validate weights sum to 100
  validateWeights: () => { valid: boolean; sum: number; issues: string[] };
}

// ================================================================
// DEFAULT WEIGHTS - Industry Standard (Florida Coastal Market)
// Normalized to sum to EXACTLY 100.00%
// ================================================================

export const DEFAULT_WEIGHTS: Record<string, number> = {
  'A': 1.88,    // Address & Identity
  'B': 17.43,   // Pricing & Value
  'C': 14.33,   // Property Basics
  'D': 9.43,    // HOA & Taxes
  'E': 6.60,    // Structure & Systems
  'F': 0.94,    // Interior Features
  'G': 1.88,    // Exterior Features
  'H': 0.48,    // Permits & Renovations
  'I': 11.59,   // Schools
  'J': 4.71,    // Location Scores
  'K': 1.88,    // Distances & Amenities
  'L': 3.77,    // Safety & Crime
  'M': 7.54,    // Market & Investment
  'N': 0.48,    // Utilities
  'O': 8.49,    // Environment & Risk
  'P': 0.00,    // Additional Features
  'Q': 0.00,    // Parking
  'R': 0.00,    // Building
  'S': 0.00,    // Legal
  'T': 5.66,    // Waterfront
  'U': 0.00,    // Leasing
  'V': 0.00,    // Features
  'W': 2.91,    // Market Performance (NEW)
};

// Verify default weights sum to 100
const DEFAULT_SUM = Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(DEFAULT_SUM - 100) > 0.01) {
  console.error(`[WeightStore] DEFAULT_WEIGHTS sum to ${DEFAULT_SUM}, expected 100!`);
}

// ================================================================
// SECTION METADATA
// ================================================================

export const SECTION_METADATA: Omit<SectionWeight, 'weight'>[] = [
  { id: 'A', name: 'Address & Identity', minWeight: 0, maxWeight: 10, isCritical: false, color: 'cyan' },
  { id: 'B', name: 'Pricing & Value', minWeight: 5, maxWeight: 30, isCritical: true, color: 'gold' },
  { id: 'C', name: 'Property Basics', minWeight: 5, maxWeight: 25, isCritical: true, color: 'green' },
  { id: 'D', name: 'HOA & Taxes', minWeight: 2, maxWeight: 20, isCritical: true, color: 'cyan' },
  { id: 'E', name: 'Structure & Systems', minWeight: 2, maxWeight: 15, isCritical: true, color: 'blue' },
  { id: 'F', name: 'Interior Features', minWeight: 0, maxWeight: 10, isCritical: false, color: 'purple' },
  { id: 'G', name: 'Exterior Features', minWeight: 0, maxWeight: 10, isCritical: false, color: 'emerald' },
  { id: 'H', name: 'Permits & Renovations', minWeight: 0, maxWeight: 10, isCritical: false, color: 'orange' },
  { id: 'I', name: 'Schools', minWeight: 3, maxWeight: 20, isCritical: true, color: 'purple' },
  { id: 'J', name: 'Location Scores', minWeight: 1, maxWeight: 15, isCritical: true, color: 'teal' },
  { id: 'K', name: 'Distances & Amenities', minWeight: 0, maxWeight: 10, isCritical: false, color: 'pink' },
  { id: 'L', name: 'Safety & Crime', minWeight: 1, maxWeight: 15, isCritical: true, color: 'red' },
  { id: 'M', name: 'Market & Investment', minWeight: 2, maxWeight: 15, isCritical: true, color: 'emerald' },
  { id: 'N', name: 'Utilities', minWeight: 0, maxWeight: 5, isCritical: false, color: 'yellow' },
  { id: 'O', name: 'Environment & Risk', minWeight: 3, maxWeight: 20, isCritical: true, color: 'amber' },
  { id: 'P', name: 'Additional Features', minWeight: 0, maxWeight: 10, isCritical: false, color: 'slate' },
  { id: 'Q', name: 'Parking', minWeight: 0, maxWeight: 10, isCritical: false, color: 'slate' },
  { id: 'R', name: 'Building', minWeight: 0, maxWeight: 10, isCritical: false, color: 'zinc' },
  { id: 'S', name: 'Legal', minWeight: 0, maxWeight: 10, isCritical: false, color: 'stone' },
  { id: 'T', name: 'Waterfront', minWeight: 0, maxWeight: 15, isCritical: false, color: 'sky' },
  { id: 'U', name: 'Leasing', minWeight: 0, maxWeight: 10, isCritical: false, color: 'amber' },
  { id: 'V', name: 'Features', minWeight: 0, maxWeight: 10, isCritical: false, color: 'emerald' },
  { id: 'W', name: 'Market Performance', minWeight: 0, maxWeight: 15, isCritical: false, color: 'rose' },
];

// ================================================================
// REBALANCING ALGORITHM
// ================================================================

/**
 * Rebalance weights when one section changes.
 * Other sections proportionally adjust to maintain 100% total.
 * Respects min/max constraints.
 *
 * Algorithm:
 * 1. Set the target section to its new weight
 * 2. Calculate how much needs to be redistributed
 * 3. Distribute proportionally among other sections
 * 4. Respect min/max constraints
 * 5. Final normalization pass if needed
 */
function rebalanceWeights(
  currentWeights: Record<string, number>,
  changedSection: string,
  newWeight: number
): Record<string, number> {
  const metadata = SECTION_METADATA.find(s => s.id === changedSection);
  if (!metadata) {
    console.error(`[WeightStore] Unknown section: ${changedSection}`);
    return currentWeights;
  }

  // Clamp to min/max
  const clampedWeight = Math.max(metadata.minWeight, Math.min(metadata.maxWeight, newWeight));

  // Calculate the difference that needs to be redistributed
  const oldWeight = currentWeights[changedSection] || 0;
  const difference = oldWeight - clampedWeight; // Positive = weight decreased, distribute to others

  if (Math.abs(difference) < 0.01) {
    return currentWeights; // No significant change
  }

  // Get other sections that can absorb the change
  const otherSections = SECTION_METADATA.filter(s => s.id !== changedSection);
  const totalOtherWeight = otherSections.reduce(
    (sum, s) => sum + (currentWeights[s.id] || 0),
    0
  );

  // Create new weights object
  const newWeights: Record<string, number> = { ...currentWeights };
  newWeights[changedSection] = clampedWeight;

  if (totalOtherWeight <= 0) {
    // Edge case: All other weights are 0, can't redistribute
    return normalizeWeights(newWeights);
  }

  // Redistribute proportionally
  let remainingDifference = difference;

  for (const section of otherSections) {
    const sectionMeta = SECTION_METADATA.find(s => s.id === section.id)!;
    const currentSectionWeight = currentWeights[section.id] || 0;
    const proportion = currentSectionWeight / totalOtherWeight;

    // Calculate this section's share of the redistribution
    let adjustment = difference * proportion;
    let proposedWeight = currentSectionWeight + adjustment;

    // Clamp to constraints
    proposedWeight = Math.max(sectionMeta.minWeight, Math.min(sectionMeta.maxWeight, proposedWeight));

    // Track actual adjustment made
    const actualAdjustment = proposedWeight - currentSectionWeight;
    remainingDifference -= actualAdjustment;

    newWeights[section.id] = proposedWeight;
  }

  // Final normalization to ensure exactly 100%
  return normalizeWeights(newWeights);
}

/**
 * Normalize weights to sum to exactly 100%
 */
function normalizeWeights(weights: Record<string, number>): Record<string, number> {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);

  if (sum <= 0) {
    console.error('[WeightStore] Cannot normalize: sum is 0 or negative');
    return DEFAULT_WEIGHTS;
  }

  const factor = 100 / sum;
  const normalized: Record<string, number> = {};

  for (const [key, value] of Object.entries(weights)) {
    normalized[key] = Math.round(value * factor * 100) / 100; // 2 decimal places
  }

  // Fix rounding errors - adjust largest weight to make sum exactly 100
  const normalizedSum = Object.values(normalized).reduce((a, b) => a + b, 0);
  const roundingError = 100 - normalizedSum;

  if (Math.abs(roundingError) > 0.001) {
    // Find the largest weight and adjust it
    const largestKey = Object.entries(normalized).reduce(
      (max, [key, val]) => val > (normalized[max] || 0) ? key : max,
      'B'
    );
    normalized[largestKey] = Math.round((normalized[largestKey] + roundingError) * 100) / 100;
  }

  return normalized;
}

// ================================================================
// ZUSTAND STORE
// ================================================================

export const useWeightStore = create<WeightState & WeightActions>()(
  persist(
    (set, get) => ({
      // Initial state
      weights: { ...DEFAULT_WEIGHTS },
      isCustomized: false,
      lastModified: null,
      weightsSource: 'industry-standard',

      // Get all weights
      getWeights: () => get().weights,

      // Get single section weight
      getSectionWeight: (sectionId: string) => get().weights[sectionId] || 0,

      // Set single section weight with auto-rebalancing
      setSectionWeight: (sectionId: string, newWeight: number) => {
        const currentWeights = get().weights;
        const rebalanced = rebalanceWeights(currentWeights, sectionId, newWeight);

        set({
          weights: rebalanced,
          isCustomized: true,
          lastModified: new Date().toISOString(),
          weightsSource: 'user-defined',
        });

        console.log(`[WeightStore] Section ${sectionId} set to ${newWeight}%, rebalanced:`, rebalanced);
      },

      // Set multiple weights at once
      setWeights: (weights: Record<string, number>) => {
        const normalized = normalizeWeights(weights);

        set({
          weights: normalized,
          isCustomized: true,
          lastModified: new Date().toISOString(),
          weightsSource: 'user-defined',
        });

        console.log('[WeightStore] Weights updated:', normalized);
      },

      // Reset to defaults
      resetToDefaults: () => {
        set({
          weights: { ...DEFAULT_WEIGHTS },
          isCustomized: false,
          lastModified: new Date().toISOString(),
          weightsSource: 'industry-standard',
        });

        console.log('[WeightStore] Reset to industry-standard defaults');
      },

      // Get metadata for UI
      getWeightMetadata: () => {
        const currentWeights = get().weights;
        return SECTION_METADATA.map(meta => ({
          ...meta,
          weight: currentWeights[meta.id] || 0,
        }));
      },

      // Validate weights
      validateWeights: () => {
        const weights = get().weights;
        const sum = Object.values(weights).reduce((a, b) => a + b, 0);
        const issues: string[] = [];

        // Check sum
        if (Math.abs(sum - 100) > 0.1) {
          issues.push(`Weights sum to ${sum.toFixed(2)}%, expected 100%`);
        }

        // Check constraints
        for (const meta of SECTION_METADATA) {
          const weight = weights[meta.id] || 0;
          if (weight < meta.minWeight) {
            issues.push(`Section ${meta.id} (${meta.name}) below minimum: ${weight}% < ${meta.minWeight}%`);
          }
          if (weight > meta.maxWeight) {
            issues.push(`Section ${meta.id} (${meta.name}) above maximum: ${weight}% > ${meta.maxWeight}%`);
          }
        }

        return {
          valid: issues.length === 0,
          sum,
          issues,
        };
      },
    }),
    {
      name: 'clues-section-weights',
      version: 1,
    }
  )
);

// ================================================================
// CONVENIENCE EXPORTS
// ================================================================

/**
 * Get current weights (non-reactive, for use outside React)
 */
export function getCurrentWeights(): Record<string, number> {
  return useWeightStore.getState().weights;
}

/**
 * Get weights source identifier
 */
export function getWeightsSource(): string {
  return useWeightStore.getState().weightsSource;
}

/**
 * Check if using custom weights
 */
export function isUsingCustomWeights(): boolean {
  return useWeightStore.getState().isCustomized;
}
