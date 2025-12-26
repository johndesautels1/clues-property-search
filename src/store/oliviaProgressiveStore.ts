/**
 * Olivia Analysis State Store
 *
 * Manages state for the 4-level progressive analysis system.
 * Tracks completion status, results, and current progress for each level.
 */

import { create } from 'zustand';
import type { LevelResult, FinalAggregationResult } from '@/api/olivia-progressive-levels';
import type { OliviaEnhancedPropertyInput } from '@/types/olivia-enhanced';

export interface ProgressState {
  message: string;
  current: number;
  total: number;
}

export interface OliviaProgressiveState {
  // Properties being analyzed
  properties: OliviaEnhancedPropertyInput[];

  // Level completion status
  level1Complete: boolean;
  level2Complete: boolean;
  level3Complete: boolean;
  level4Complete: boolean;

  // Level results
  level1Results: LevelResult | null;
  level2Results: LevelResult | null;
  level3Results: LevelResult | null;
  finalResults: FinalAggregationResult | null;

  // Current state
  currentLevel: 0 | 1 | 2 | 3 | 4; // 0 = not started
  isRunning: boolean;
  progress: ProgressState | null;
  error: string | null;

  // Quality scores (from hallucination scorer)
  level1Quality: number | null; // 0-100
  level2Quality: number | null;
  level3Quality: number | null;
  overallQuality: number | null;

  // Actions
  setProperties: (properties: OliviaEnhancedPropertyInput[]) => void;
  startLevel: (level: 1 | 2 | 3 | 4) => void;
  setProgress: (progress: ProgressState) => void;
  completeLevel1: (results: LevelResult, quality: number) => void;
  completeLevel2: (results: LevelResult, quality: number) => void;
  completeLevel3: (results: LevelResult, quality: number) => void;
  completeLevel4: (results: FinalAggregationResult) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const initialState = {
  properties: [],
  level1Complete: false,
  level2Complete: false,
  level3Complete: false,
  level4Complete: false,
  level1Results: null,
  level2Results: null,
  level3Results: null,
  finalResults: null,
  currentLevel: 0 as 0 | 1 | 2 | 3 | 4,
  isRunning: false,
  progress: null,
  error: null,
  level1Quality: null,
  level2Quality: null,
  level3Quality: null,
  overallQuality: null,
};

export const useOliviaProgressiveStore = create<OliviaProgressiveState>((set) => ({
  ...initialState,

  setProperties: (properties) => set({ properties }),

  startLevel: (level) =>
    set({
      currentLevel: level,
      isRunning: true,
      progress: { message: `Starting Level ${level}...`, current: 0, total: level === 4 ? 1 : 56 },
      error: null,
    }),

  setProgress: (progress) => set({ progress }),

  completeLevel1: (results, quality) =>
    set({
      level1Complete: true,
      level1Results: results,
      level1Quality: quality,
      currentLevel: 0,
      isRunning: false,
      progress: null,
    }),

  completeLevel2: (results, quality) =>
    set({
      level2Complete: true,
      level2Results: results,
      level2Quality: quality,
      currentLevel: 0,
      isRunning: false,
      progress: null,
    }),

  completeLevel3: (results, quality) =>
    set({
      level3Complete: true,
      level3Results: results,
      level3Quality: quality,
      currentLevel: 0,
      isRunning: false,
      progress: null,
    }),

  completeLevel4: (results) =>
    set((state) => {
      // Calculate overall quality from levels 1-3
      const qualities = [state.level1Quality, state.level2Quality, state.level3Quality].filter(
        (q) => q !== null
      ) as number[];
      const overallQuality = qualities.length > 0 ? qualities.reduce((a, b) => a + b, 0) / qualities.length : null;

      return {
        level4Complete: true,
        finalResults: results,
        overallQuality,
        currentLevel: 0,
        isRunning: false,
        progress: null,
      };
    }),

  setError: (error) =>
    set({
      error,
      isRunning: false,
      currentLevel: 0,
      progress: null,
    }),

  reset: () => set(initialState),
}));
