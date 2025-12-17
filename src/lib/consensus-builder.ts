/**
 * Real-Time Consensus Builder for Multi-LLM Market Forecasts
 *
 * Allows sequential LLM calls with live consensus updates as each forecast returns.
 * Handles outlier detection and confidence scoring transparently.
 */

export type ConsensusConfidence = 'NONE' | 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'MAXIMUM';

export interface ForecastResult {
  source: string;
  appreciation1Yr: number;
  appreciation5Yr: number;
  appreciation10Yr?: number;
  confidence: string;
  marketTrends: string[];
  keyInsights: string[];
  timestamp: string;
}

export interface OutlierInfo {
  source: string;
  value: number;
  deviation: number;
  stdDevCount: number;
  reason: string;
}

export interface ConsensusAnalysis {
  // Count
  count: number;
  isValid: boolean; // true if >= 3 sources

  // Consensus values
  consensus1Yr: number;
  consensus5Yr: number;
  consensus10Yr: number;

  // Statistical measures
  mean1Yr: number;
  stdDev1Yr: number;
  min1Yr: number;
  max1Yr: number;
  range1Yr: number;

  // Confidence
  confidence: ConsensusConfidence;
  confidenceScore: number; // 0-100 for gas gauge
  confidenceColor: string; // For UI

  // Outliers
  outliers: OutlierInfo[];
  inliers: ForecastResult[];

  // Messages
  message: string;
  warnings: string[];
  recommendations: string[];
}

/**
 * Calculate mean of an array
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

/**
 * Detect outliers using standard deviation method
 *
 * @param results - All forecast results
 * @param threshold - Number of std devs to consider outlier (default: 1.5)
 * @returns Separated inliers and outliers
 */
function detectOutliers(results: ForecastResult[], threshold: number = 1.5) {
  if (results.length < 3) {
    // Not enough data for statistical outlier detection
    return { inliers: results, outliers: [] };
  }

  const values1Yr = results.map(r => r.appreciation1Yr);
  const mean1Yr = mean(values1Yr);
  const sd1Yr = stdDev(values1Yr);

  const inliers: ForecastResult[] = [];
  const outliers: OutlierInfo[] = [];

  results.forEach(result => {
    const deviation = Math.abs(result.appreciation1Yr - mean1Yr);
    const stdDevCount = deviation / sd1Yr;

    if (stdDevCount > threshold) {
      // This is an outlier
      outliers.push({
        source: result.source,
        value: result.appreciation1Yr,
        deviation,
        stdDevCount,
        reason: `${stdDevCount.toFixed(1)} std dev from mean (threshold: ${threshold})`
      });
    } else {
      inliers.push(result);
    }
  });

  return { inliers, outliers };
}

/**
 * Determine confidence level based on count and standard deviation
 */
function determineConfidence(count: number, stdDev: number): {
  confidence: ConsensusConfidence;
  score: number;
  color: string;
} {
  // No data
  if (count === 0) {
    return { confidence: 'NONE', score: 0, color: '#6b7280' };
  }

  // 1 source only
  if (count === 1) {
    return { confidence: 'VERY_LOW', score: 16, color: '#ef4444' };
  }

  // 2 sources
  if (count === 2) {
    return { confidence: 'LOW', score: 33, color: '#f97316' };
  }

  // 3+ sources - consider standard deviation
  if (count === 3) {
    if (stdDev < 1.0) return { confidence: 'MODERATE', score: 60, color: '#eab308' };
    return { confidence: 'MODERATE', score: 50, color: '#eab308' };
  }

  if (count === 4) {
    if (stdDev < 0.5) return { confidence: 'HIGH', score: 75, color: '#84cc16' };
    if (stdDev < 1.5) return { confidence: 'HIGH', score: 66, color: '#84cc16' };
    return { confidence: 'MODERATE', score: 55, color: '#eab308' };
  }

  if (count === 5) {
    if (stdDev < 0.5) return { confidence: 'VERY_HIGH', score: 90, color: '#22c55e' };
    if (stdDev < 1.0) return { confidence: 'VERY_HIGH', score: 83, color: '#22c55e' };
    return { confidence: 'HIGH', score: 70, color: '#84cc16' };
  }

  // 6 sources (maximum)
  if (stdDev < 0.3) return { confidence: 'MAXIMUM', score: 100, color: '#166534' };
  if (stdDev < 0.8) return { confidence: 'VERY_HIGH', score: 95, color: '#22c55e' };
  if (stdDev < 1.5) return { confidence: 'HIGH', score: 80, color: '#84cc16' };
  return { confidence: 'MODERATE', score: 65, color: '#eab308' };
}

/**
 * Build consensus from forecast results (can be called with 1+ results)
 *
 * @param results - Array of forecast results (1 or more)
 * @returns Consensus analysis with confidence scoring
 */
export function buildConsensus(results: ForecastResult[]): ConsensusAnalysis {
  const count = results.length;

  // Handle edge cases
  if (count === 0) {
    return {
      count: 0,
      isValid: false,
      consensus1Yr: 0,
      consensus5Yr: 0,
      consensus10Yr: 0,
      mean1Yr: 0,
      stdDev1Yr: 0,
      min1Yr: 0,
      max1Yr: 0,
      range1Yr: 0,
      confidence: 'NONE',
      confidenceScore: 0,
      confidenceColor: '#6b7280',
      outliers: [],
      inliers: [],
      message: 'No forecasts available. Click "Run Forecast" to begin.',
      warnings: [],
      recommendations: ['Run at least 3 forecasts for statistical validity']
    };
  }

  // Single forecast
  if (count === 1) {
    const single = results[0];
    return {
      count: 1,
      isValid: false,
      consensus1Yr: single.appreciation1Yr,
      consensus5Yr: single.appreciation5Yr,
      consensus10Yr: single.appreciation10Yr || 0,
      mean1Yr: single.appreciation1Yr,
      stdDev1Yr: 0,
      min1Yr: single.appreciation1Yr,
      max1Yr: single.appreciation1Yr,
      range1Yr: 0,
      confidence: 'VERY_LOW',
      confidenceScore: 16,
      confidenceColor: '#ef4444',
      outliers: [],
      inliers: results,
      message: `⚠️ Only 1 forecast from ${single.source}. Need 2+ for comparison.`,
      warnings: ['Single source - no consensus possible', 'High risk of bias'],
      recommendations: ['Run at least 2 more forecasts for statistical validity']
    };
  }

  // 2+ forecasts - calculate statistics
  const values1Yr = results.map(r => r.appreciation1Yr);
  const values5Yr = results.map(r => r.appreciation5Yr);
  const mean1Yr = mean(values1Yr);
  const mean5Yr = mean(values5Yr);
  const sd1Yr = stdDev(values1Yr);
  const min1Yr = Math.min(...values1Yr);
  const max1Yr = Math.max(...values1Yr);
  const range1Yr = max1Yr - min1Yr;

  // Detect outliers (only if 3+ forecasts)
  const { inliers, outliers } = count >= 3 ? detectOutliers(results) : { inliers: results, outliers: [] };

  // Recalculate consensus without outliers
  const consensus1Yr = inliers.length > 0 ? mean(inliers.map(r => r.appreciation1Yr)) : mean1Yr;
  const consensus5Yr = inliers.length > 0 ? mean(inliers.map(r => r.appreciation5Yr)) : mean5Yr;

  // Determine confidence
  const { confidence, score, color } = determineConfidence(count, sd1Yr);

  // Generate messages
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (count < 3) {
    warnings.push('Need 3+ forecasts for statistical validity');
    recommendations.push(`Run ${3 - count} more forecast(s) to achieve moderate confidence`);
  }

  if (sd1Yr > 2.0) {
    warnings.push(`High variance (±${sd1Yr.toFixed(1)}%) - forecasts disagree significantly`);
  }

  if (outliers.length > 0) {
    warnings.push(`${outliers.length} outlier(s) excluded from consensus`);
  }

  if (count >= 3 && sd1Yr < 1.0) {
    recommendations.push('Strong agreement detected - consensus is reliable');
  }

  if (count < 6) {
    recommendations.push(`Run ${6 - count} more forecast(s) to maximize confidence`);
  }

  // Generate main message
  let message: string;
  if (count >= 3 && outliers.length === 0) {
    message = `✅ Strong consensus from all ${count} sources`;
  } else if (count >= 3 && outliers.length > 0) {
    message = `✅ Consensus built from ${inliers.length} sources (${outliers.length} outlier excluded)`;
  } else {
    message = `⚠️ Preliminary consensus from ${count} sources (need ${3 - count} more for validity)`;
  }

  return {
    count,
    isValid: count >= 3,
    consensus1Yr,
    consensus5Yr,
    consensus10Yr: 0, // TODO: Calculate if available
    mean1Yr,
    stdDev1Yr: sd1Yr,
    min1Yr,
    max1Yr,
    range1Yr,
    confidence,
    confidenceScore: score,
    confidenceColor: color,
    outliers,
    inliers,
    message,
    warnings,
    recommendations
  };
}

/**
 * Get gauge angle for needle based on confidence score (0-100)
 * Returns angle in degrees (-90 to +90)
 */
export function getGaugeAngle(score: number): number {
  // Map 0-100 to -90 to +90
  return (score / 100) * 180 - 90;
}

/**
 * Get label for confidence level
 */
export function getConfidenceLabel(confidence: ConsensusConfidence): string {
  switch (confidence) {
    case 'NONE': return 'NO DATA';
    case 'VERY_LOW': return 'VERY LOW CONFIDENCE';
    case 'LOW': return 'LOW CONFIDENCE';
    case 'MODERATE': return 'MODERATE CONFIDENCE';
    case 'HIGH': return 'HIGH CONFIDENCE';
    case 'VERY_HIGH': return 'VERY HIGH CONFIDENCE';
    case 'MAXIMUM': return 'MAXIMUM CONFIDENCE';
  }
}
