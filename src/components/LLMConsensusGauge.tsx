/**
 * LLM Consensus Gas Gauge Component
 *
 * Visual gas gauge that shows confidence level based on number of LLM forecasts.
 * - 0 LLMs: Empty tank (gray)
 * - 1 LLM: Almost empty (red) - VERY LOW confidence
 * - 2 LLMs: Low (orange)
 * - 3 LLMs: Moderate (yellow) - Minimum for statistical validity
 * - 4 LLMs: High (lime)
 * - 5 LLMs: Very High (green)
 * - 6 LLMs: Full tank (dark green) - MAXIMUM confidence
 */

import { motion } from 'framer-motion';
import { getGaugeAngle, getConfidenceLabel, type ConsensusAnalysis } from '@/lib/consensus-builder';

interface LLMConsensusGaugeProps {
  consensus: ConsensusAnalysis;
}

export function LLMConsensusGauge({ consensus }: LLMConsensusGaugeProps) {
  const { count, confidenceScore, confidenceColor, confidence, message } = consensus;

  // Calculate needle angle (-90 to +90 degrees)
  const needleAngle = getGaugeAngle(confidenceScore);

  return (
    <div className="consensus-gauge-container">
      {/* Gauge SVG */}
      <div className="gauge-wrapper relative w-full max-w-md mx-auto">
        <svg
          viewBox="0 0 200 130"
          className="w-full h-auto"
        >
          {/* Background arc (red → yellow → green gradient) */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>

            {/* Shadow for needle */}
            <filter id="needleShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Main arc path */}
          <path
            d="M 20,100 A 80,80 0 0,1 180,100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="20"
            strokeLinecap="round"
          />

          {/* Tick marks */}
          {[0, 1, 2, 3, 4, 5, 6].map((tick) => {
            const angle = -90 + (tick / 6) * 180;
            const radians = (angle * Math.PI) / 180;
            const innerRadius = 70;
            const outerRadius = 85;
            const x1 = 100 + innerRadius * Math.cos(radians);
            const y1 = 100 + innerRadius * Math.sin(radians);
            const x2 = 100 + outerRadius * Math.cos(radians);
            const y2 = 100 + outerRadius * Math.sin(radians);

            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#6b7280"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}

          {/* Tick labels */}
          <text x="20" y="108" fontSize="10" fill="#6b7280" textAnchor="middle">
            0
          </text>
          <text x="180" y="108" fontSize="10" fill="#6b7280" textAnchor="middle">
            6
          </text>
          <text x="100" y="28" fontSize="10" fill="#6b7280" textAnchor="middle">
            3
          </text>

          {/* Animated needle */}
          <motion.g
            initial={{ rotate: -90 }}
            animate={{ rotate: needleAngle }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            style={{ transformOrigin: '100px 100px' }}
          >
            {/* Needle shaft */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="30"
              stroke={confidenceColor}
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#needleShadow)"
            />

            {/* Needle tip */}
            <circle
              cx="100"
              cy="30"
              r="4"
              fill={confidenceColor}
              filter="url(#needleShadow)"
            />
          </motion.g>

          {/* Center pivot */}
          <circle cx="100" cy="100" r="8" fill="#374151" />
          <circle cx="100" cy="100" r="5" fill={confidenceColor} />
        </svg>
      </div>

      {/* Info panel */}
      <div className="gauge-info mt-6 text-center space-y-2">
        {/* Main confidence label */}
        <div
          className="confidence-label text-2xl font-bold"
          style={{ color: confidenceColor }}
        >
          {getConfidenceLabel(confidence)}
        </div>

        {/* LLM count */}
        <div className="llm-count text-lg text-gray-600 dark:text-gray-400">
          {count}/6 LLMs Completed
        </div>

        {/* Confidence percentage */}
        <div className="confidence-pct text-3xl font-bold text-gray-900 dark:text-gray-100">
          {confidenceScore}% Reliable
        </div>

        {/* Message */}
        <div className="message text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          {message}
        </div>
      </div>

      {/* Warning banner for low counts */}
      {count < 3 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="warning-banner mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded text-sm"
        >
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
            <div>
              <div className="font-semibold text-yellow-800 dark:text-yellow-200">
                Statistical Validity Warning
              </div>
              <div className="text-yellow-700 dark:text-yellow-300 mt-1">
                Need {3 - count} more forecast{3 - count !== 1 ? 's' : ''} for reliable consensus.
                Single-source forecasts have high risk of bias.
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Warnings list */}
      {consensus.warnings.length > 0 && (
        <div className="warnings-list mt-4 space-y-2">
          {consensus.warnings.map((warning, i) => (
            <div
              key={i}
              className="warning-item p-2 bg-orange-50 dark:bg-orange-900/20 border-l-2 border-orange-400 rounded text-xs text-orange-700 dark:text-orange-300"
            >
              ⚠️ {warning}
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {consensus.recommendations.length > 0 && (
        <div className="recommendations-list mt-4 space-y-2">
          {consensus.recommendations.map((rec, i) => (
            <div
              key={i}
              className="recommendation-item p-2 bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-400 rounded text-xs text-blue-700 dark:text-blue-300"
            >
              💡 {rec}
            </div>
          ))}
        </div>
      )}

      {/* Outliers info */}
      {consensus.outliers.length > 0 && (
        <div className="outliers-section mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
          <div className="font-semibold text-sm text-red-800 dark:text-red-200 mb-2">
            Outliers Excluded from Consensus:
          </div>
          {consensus.outliers.map((outlier, i) => (
            <div key={i} className="outlier-item text-xs text-red-700 dark:text-red-300 ml-4">
              • <strong>{outlier.source}:</strong> {outlier.value.toFixed(1)}%
              ({outlier.reason})
            </div>
          ))}
        </div>
      )}

      {/* Stats detail (if valid consensus) */}
      {consensus.isValid && (
        <div className="stats-detail mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Consensus (1yr):</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {consensus.consensus1Yr.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Range:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {consensus.min1Yr.toFixed(1)}% to {consensus.max1Yr.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Standard Deviation:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              ±{consensus.stdDev1Yr.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Agreement:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {consensus.stdDev1Yr < 1.0
                ? 'Strong'
                : consensus.stdDev1Yr < 2.0
                ? 'Moderate'
                : 'Weak'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
