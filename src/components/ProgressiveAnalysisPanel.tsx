/**
 * Olivia Analysis Panel
 *
 * User-controlled 4-level analysis system with real-time progress.
 * Each level completes independently - NO MORE TIMEOUTS!
 *
 * User Flow:
 * 1. Click "Start Level 1" → See 56 fields analyzed with progress
 * 2. Review results, click "Continue to Level 2"
 * 3. See next 56 fields, click "Continue to Level 3"
 * 4. See final 56 fields, click "Generate Executive Summary"
 * 5. Get complete analysis with winner, grades, recommendations
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle, Clock, AlertTriangle, TrendingUp, Award } from 'lucide-react';
import { useOliviaProgressiveStore } from '@/store/oliviaProgressiveStore';
import {
  analyzeLevelOne,
  analyzeLevelTwo,
  analyzeLevelThree,
  generateExecutiveSummary,
  type ProgressCallback
} from '@/api/olivia-progressive-levels';
import { analyzeOverallQuality, analyzeFieldQuality, getConfidenceLabel } from '@/lib/hallucination-scorer';
import type { OliviaEnhancedPropertyInput, OliviaEnhancedAnalysisResult } from '@/types/olivia-enhanced';

interface ProgressiveAnalysisPanelProps {
  properties: OliviaEnhancedPropertyInput[];
  onComplete?: (results: OliviaEnhancedAnalysisResult) => void;
}

export function ProgressiveAnalysisPanel({ properties, onComplete }: ProgressiveAnalysisPanelProps) {
  const {
    currentLevel,
    isRunning,
    progress,
    error,
    level1Complete,
    level2Complete,
    level3Complete,
    level4Complete,
    level1Results,
    level2Results,
    level3Results,
    finalResults,
    level1Quality,
    level2Quality,
    level3Quality,
    overallQuality,
    startLevel,
    setProgress,
    completeLevel1,
    completeLevel2,
    completeLevel3,
    completeLevel4,
    setError,
    reset,
  } = useOliviaProgressiveStore();

  // Run Level 1
  const runLevel1 = async () => {
    try {
      startLevel(1);

      const progressCallback: ProgressCallback = (message, current, total) => {
        setProgress({ message, current: current || 0, total: total || 56 });
      };

      const results = await analyzeLevelOne(properties, progressCallback);

      // Analyze quality
      const qualityAnalysis = analyzeOverallQuality(results.fieldComparisons);

      completeLevel1(results, qualityAnalysis.avgQuality);
    } catch (err) {
      console.error('Level 1 error:', err);
      setError(err instanceof Error ? err.message : 'Level 1 analysis failed');
    }
  };

  // Run Level 2
  const runLevel2 = async () => {
    try {
      startLevel(2);

      const progressCallback: ProgressCallback = (message, current, total) => {
        setProgress({ message, current: current || 0, total: total || 56 });
      };

      const results = await analyzeLevelTwo(properties, progressCallback);

      // Analyze quality
      const qualityAnalysis = analyzeOverallQuality(results.fieldComparisons);

      completeLevel2(results, qualityAnalysis.avgQuality);
    } catch (err) {
      console.error('Level 2 error:', err);
      setError(err instanceof Error ? err.message : 'Level 2 analysis failed');
    }
  };

  // Run Level 3
  const runLevel3 = async () => {
    try {
      startLevel(3);

      const progressCallback: ProgressCallback = (message, current, total) => {
        setProgress({ message, current: current || 0, total: total || 56 });
      };

      const results = await analyzeLevelThree(properties, progressCallback);

      // Analyze quality
      const qualityAnalysis = analyzeOverallQuality(results.fieldComparisons);

      completeLevel3(results, qualityAnalysis.avgQuality);
    } catch (err) {
      console.error('Level 3 error:', err);
      setError(err instanceof Error ? err.message : 'Level 3 analysis failed');
    }
  };

  // Run Level 4 (Executive Summary)
  const runLevel4 = async () => {
    if (!level1Results || !level2Results || !level3Results) {
      setError('Must complete Levels 1-3 first');
      return;
    }

    try {
      startLevel(4);

      const progressCallback: ProgressCallback = (message) => {
        setProgress({ message, current: 0, total: 1 });
      };

      const results = await generateExecutiveSummary(
        properties,
        level1Results,
        level2Results,
        level3Results,
        progressCallback
      );

      // Inject all field comparisons from levels 1-3
      const allFieldComparisons = [
        ...(level1Results.fieldComparisons || []),
        ...(level2Results.fieldComparisons || []),
        ...(level3Results.fieldComparisons || []),
      ];

      // NO TRANSFORMATION NEEDED! Level 4 now returns data in correct format
      // Just build the final result with proper structure
      const finalResult: OliviaEnhancedAnalysisResult = {
        analysisId: `progressive-${Date.now()}`,
        timestamp: new Date().toISOString(),
        propertiesAnalyzed: properties.length,

        // These come directly from Level 4 in correct format
        investmentGrade: results.investmentGrade,
        sectionAnalysis: results.sectionAnalysis || [],
        propertyRankings: results.propertyRankings || [],
        keyFindings: results.keyFindings || [],
        verbalAnalysis: results.verbalAnalysis,
        decisionRecommendations: results.decisionRecommendations || [],

        // Placeholder for multi-LLM forecast (future feature)
        marketForecast: {
          llmSources: [],
          appreciationForecast: { year1: 0, year3: 0, year5: 0, year10: 0, confidence: 0 },
          marketTrends: { priceDirection: 'stable', demandLevel: 'moderate', inventoryLevel: 'balanced', daysOnMarketTrend: 'stable' },
          marketRisks: { economicRisks: [], climateRisks: [], demographicShifts: [], regulatoryChanges: [] },
          marketOpportunities: { nearTerm: [], longTerm: [] },
          forecastDate: new Date().toISOString(),
          dataQuality: 'medium'
        },

        // UI scaffolding
        heygenConfig: {
          avatarId: 'olivia-default',
          videoUrl: undefined,
          isLive: false,
          timedPopups: []
        },
        qaState: {
          conversationHistory: [],
          suggestedQuestions: [
            'What are the key differences between these properties?',
            'Which property offers the best value?',
            'What are the main risks I should be aware of?'
          ],
          activeTopics: []
        },
        callToAction: {
          primaryAction: results.verbalAnalysis?.topRecommendation?.reasoning || 'Review the analysis and make an informed decision',
          secondaryActions: ['Request more information', 'Compare with saved properties'],
          nextSteps: [
            'Review the detailed section analysis',
            'Check the investment grade ratings',
            'Examine key findings and recommendations'
          ]
        }
      };

      console.log('✅ Olivia Analysis Complete!');
      console.log('📊 All Field Comparisons (Levels 1-3):', allFieldComparisons.length, 'fields');
      console.log('📈 Section Analysis:', finalResult.sectionAnalysis.length, 'sections');
      console.log('🏆 Investment Grade:', finalResult.investmentGrade);
      console.log('🏅 Property Rankings:', finalResult.propertyRankings.length, 'properties');
      console.log('💡 Key Findings:', finalResult.keyFindings.length, 'findings');
      console.log('🎙️ Verbal Analysis Generated:', !!finalResult.verbalAnalysis);
      console.log('📋 Full Result Structure:', finalResult);

      completeLevel4(results);

      // Notify parent with final result
      if (onComplete) {
        onComplete(finalResult);
      }
    } catch (err) {
      console.error('Level 4 error:', err);
      setError(err instanceof Error ? err.message : 'Executive summary generation failed');
    }
  };

  // Quality badge component
  const QualityBadge = ({ score }: { score: number | null }) => {
    if (score === null) return null;

    const getColor = (s: number) => {
      if (s >= 90) return 'bg-green-100 text-green-800 border-green-300';
      if (s >= 75) return 'bg-lime-100 text-lime-800 border-lime-300';
      if (s >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      if (s >= 25) return 'bg-orange-100 text-orange-800 border-orange-300';
      return 'bg-red-100 text-red-800 border-red-300';
    };

    const getLabel = (s: number) => {
      if (s >= 90) return '✓ VERIFIED';
      if (s >= 75) return '✓ HIGH QUALITY';
      if (s >= 50) return '⚠️ MODERATE';
      if (s >= 25) return '⚠️ LOW QUALITY';
      return '❌ POOR QUALITY';
    };

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-semibold ${getColor(score)}`}>
        <span>{getLabel(score)}</span>
        <span>({score.toFixed(0)}%)</span>
      </div>
    );
  };

  return (
    <div className="progressive-analysis-panel space-y-6">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Olivia Analysis
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              User-controlled 4-level analysis • No timeouts • Real progress
            </p>
          </div>
        </div>

        {/* Reset button */}
        {(level1Complete || level2Complete || level3Complete || level4Complete) && !isRunning && (
          <button
            onClick={reset}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Reset & Start Over
          </button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="error-banner p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-800 dark:text-red-200">Analysis Error</div>
              <div className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========== LEVEL 1 ========== */}
      <div className="level-card border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="level-header flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`level-number w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
              level1Complete
                ? 'bg-green-500 text-white'
                : currentLevel === 1
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {level1Complete ? <CheckCircle className="w-6 h-6" /> : '1'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Level 1: Critical Decision Fields
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Fields 1-56 • Address, Pricing, Property Basics, HOA/Taxes, Structure
              </p>
            </div>
          </div>

          {level1Quality !== null && <QualityBadge score={level1Quality} />}
        </div>

        {/* Level 1 Button */}
        {!level1Complete && currentLevel !== 1 && (
          <button
            onClick={runLevel1}
            disabled={isRunning}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
          >
            Start Level 1 Analysis
          </button>
        )}

        {/* Level 1 Progress */}
        {currentLevel === 1 && progress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="progress-section space-y-3"
          >
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Clock className="w-4 h-4 animate-spin" />
              <span>{progress.message}</span>
            </div>

            {/* Real progress bar */}
            <div className="progress-bar-container">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <motion.div
                  className="h-full bg-blue-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                <span>{progress.current} of {progress.total} fields</span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Level 1 Results */}
        {level1Complete && level1Results && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="results-section mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800"
          >
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200 font-semibold mb-2">
              <CheckCircle className="w-5 h-5" />
              <span>Level 1 Complete!</span>
            </div>
            <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <div>✓ {level1Results.fieldComparisons.length} fields analyzed with mathematical proofs</div>
              <div>✓ Quality Score: {level1Quality?.toFixed(0)}% ({level1Quality && level1Quality >= 75 ? 'Reliable' : 'Needs Review'})</div>
              <div>✓ Ready to proceed to Level 2</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ========== LEVEL 2 ========== */}
      <div className={`level-card border-2 rounded-lg p-6 ${
        level1Complete
          ? 'border-gray-200 dark:border-gray-700'
          : 'border-gray-100 dark:border-gray-800 opacity-50'
      }`}>
        <div className="level-header flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`level-number w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
              level2Complete
                ? 'bg-green-500 text-white'
                : currentLevel === 2
                ? 'bg-blue-500 text-white'
                : level1Complete
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
            }`}>
              {level2Complete ? <CheckCircle className="w-6 h-6" /> : '2'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Level 2: Important Context Fields
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Fields 57-112 • Schools, Location, Safety, Market Data, Utilities
              </p>
            </div>
          </div>

          {level2Quality !== null && <QualityBadge score={level2Quality} />}
        </div>

        {/* Level 2 Button */}
        {level1Complete && !level2Complete && currentLevel !== 2 && (
          <button
            onClick={runLevel2}
            disabled={isRunning}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
          >
            Continue to Level 2
          </button>
        )}

        {!level1Complete && (
          <div className="text-sm text-gray-500 dark:text-gray-500 italic">
            Complete Level 1 first
          </div>
        )}

        {/* Level 2 Progress */}
        {currentLevel === 2 && progress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="progress-section space-y-3"
          >
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Clock className="w-4 h-4 animate-spin" />
              <span>{progress.message}</span>
            </div>

            <div className="progress-bar-container">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <motion.div
                  className="h-full bg-blue-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                <span>{progress.current} of {progress.total} fields</span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Level 2 Results */}
        {level2Complete && level2Results && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="results-section mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800"
          >
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200 font-semibold mb-2">
              <CheckCircle className="w-5 h-5" />
              <span>Level 2 Complete!</span>
            </div>
            <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <div>✓ {level2Results.fieldComparisons.length} fields analyzed with mathematical proofs</div>
              <div>✓ Quality Score: {level2Quality?.toFixed(0)}% ({level2Quality && level2Quality >= 75 ? 'Reliable' : 'Needs Review'})</div>
              <div>✓ Total so far: {(level1Results?.fieldComparisons.length || 0) + level2Results.fieldComparisons.length}/168 fields</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ========== LEVEL 3 ========== */}
      <div className={`level-card border-2 rounded-lg p-6 ${
        level2Complete
          ? 'border-gray-200 dark:border-gray-700'
          : 'border-gray-100 dark:border-gray-800 opacity-50'
      }`}>
        <div className="level-header flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`level-number w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
              level3Complete
                ? 'bg-green-500 text-white'
                : currentLevel === 3
                ? 'bg-blue-500 text-white'
                : level2Complete
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
            }`}>
              {level3Complete ? <CheckCircle className="w-6 h-6" /> : '3'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Level 3: Remaining Fields
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Fields 113-168 • Environment, Legal, Waterfront, Leasing, Features
              </p>
            </div>
          </div>

          {level3Quality !== null && <QualityBadge score={level3Quality} />}
        </div>

        {/* Level 3 Button */}
        {level2Complete && !level3Complete && currentLevel !== 3 && (
          <button
            onClick={runLevel3}
            disabled={isRunning}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
          >
            Continue to Level 3
          </button>
        )}

        {!level2Complete && (
          <div className="text-sm text-gray-500 dark:text-gray-500 italic">
            Complete Levels 1-2 first
          </div>
        )}

        {/* Level 3 Progress */}
        {currentLevel === 3 && progress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="progress-section space-y-3"
          >
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Clock className="w-4 h-4 animate-spin" />
              <span>{progress.message}</span>
            </div>

            <div className="progress-bar-container">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <motion.div
                  className="h-full bg-blue-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                <span>{progress.current} of {progress.total} fields</span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Level 3 Results */}
        {level3Complete && level3Results && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="results-section mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800"
          >
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200 font-semibold mb-2">
              <CheckCircle className="w-5 h-5" />
              <span>Level 3 Complete!</span>
            </div>
            <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <div>✓ {level3Results.fieldComparisons.length} fields analyzed with mathematical proofs</div>
              <div>✓ Quality Score: {level3Quality?.toFixed(0)}% ({level3Quality && level3Quality >= 75 ? 'Reliable' : 'Needs Review'})</div>
              <div>✓ ALL 168 fields complete! Ready for executive summary.</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ========== LEVEL 4 (Executive Summary) ========== */}
      <div className={`level-card border-2 rounded-lg p-6 ${
        level3Complete
          ? 'border-purple-200 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/10'
          : 'border-gray-100 dark:border-gray-800 opacity-50'
      }`}>
        <div className="level-header flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`level-number w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
              level4Complete
                ? 'bg-purple-600 text-white'
                : currentLevel === 4
                ? 'bg-purple-500 text-white'
                : level3Complete
                ? 'bg-purple-200 dark:bg-purple-700 text-purple-800 dark:text-purple-200'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
            }`}>
              {level4Complete ? <Award className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Level 4: Executive Summary & Winner
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Final aggregation • Investment grades • Recommendations
              </p>
            </div>
          </div>

          {overallQuality !== null && <QualityBadge score={overallQuality} />}
        </div>

        {/* Level 4 Button */}
        {level3Complete && !level4Complete && currentLevel !== 4 && (
          <button
            onClick={runLevel4}
            disabled={isRunning}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Award className="w-5 h-5" />
            Generate Executive Summary
          </button>
        )}

        {!level3Complete && (
          <div className="text-sm text-gray-500 dark:text-gray-500 italic">
            Complete Levels 1-3 first
          </div>
        )}

        {/* Level 4 Progress */}
        {currentLevel === 4 && progress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="progress-section space-y-3"
          >
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Clock className="w-4 h-4 animate-spin" />
              <span>{progress.message}</span>
            </div>
          </motion.div>
        )}

        {/* Level 4 Results */}
        {level4Complete && finalResults && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="results-section mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800"
          >
            <div className="flex items-center gap-2 text-purple-800 dark:text-purple-200 font-semibold mb-3">
              <Award className="w-5 h-5" />
              <span>Analysis Complete!</span>
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300 space-y-2">
              <div>✓ All 168 fields analyzed across 3 properties</div>
              <div>✓ 22 section scores calculated</div>
              <div>✓ Investment grades assigned</div>
              <div>✓ Top recommendation: {finalResults.verbalAnalysis?.topRecommendation?.propertyId || 'See full results'}</div>
              <div>✓ Overall Quality: {overallQuality?.toFixed(0)}%</div>
            </div>

            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-700">
              <div className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Recommendation:
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {finalResults.verbalAnalysis?.topRecommendation?.reasoning || 'See full executive report below'}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
