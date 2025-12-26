/**
 * SMART Score Display Component
 * Comprehensive visualization of property quality scores with 22-section breakdown
 *
 * Features:
 * - Final SMART Score with color gradient (0-100)
 * - All 22 section scores with detailed breakdown
 * - Data completeness percentage visualization
 * - Confidence level indicators
 * - Field contribution details for each section
 * - Interactive expandable sections
 * - Recharts visualizations (radar, bar, pie charts)
 * - Lucide icons for section identification
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, Info, AlertCircle, CheckCircle,
  TrendingUp, Award, Target, BarChart3, PieChart, Activity,
  MapPin, DollarSign, Home, Receipt, Wrench, Star, TreePine,
  FileCheck, GraduationCap, Navigation, Shield, CloudRain,
  Zap, Car, Building, Scale, Waves, FileText, Users
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer
} from 'recharts';
import type { SectionScore, FieldScore } from '@/lib/smart-score-calculator';
import type { ConfidenceLevel } from '@/types/property';

// ================================================================
// TYPE DEFINITIONS
// ================================================================

interface SMARTScoreDisplayProps {
  smartScore: number;                    // Final score 0-100
  sectionBreakdown: SectionScore[];      // All 22 sections
  dataCompleteness: number;              // Percentage 0-100
  confidenceLevel: ConfidenceLevel;      // Overall confidence
  compact?: boolean;                     // Enable compact view for narrow cards
}

// ================================================================
// SECTION ICONS MAPPING
// ================================================================

const SECTION_ICONS: Record<string, any> = {
  'A': MapPin,           // Address & Identity
  'B': DollarSign,       // Pricing & Value
  'C': Home,             // Property Basics
  'D': Receipt,          // HOA & Taxes
  'E': Wrench,           // Structure & Systems
  'F': Home,             // Interior Features
  'G': TreePine,         // Exterior Features
  'H': FileCheck,        // Permits & Renovations
  'I': GraduationCap,    // Assigned Schools
  'J': Navigation,       // Location Scores
  'K': MapPin,           // Distances & Amenities
  'L': Shield,           // Safety & Crime
  'M': TrendingUp,       // Market & Investment
  'N': Zap,              // Utilities & Connectivity
  'O': CloudRain,        // Environment & Risk
  'P': Star,             // Additional Features
  'Q': Car,              // Parking
  'R': Building,         // Building
  'S': Scale,            // Legal
  'T': Waves,            // Waterfront
  'U': FileText,         // Leasing
  'V': Users,            // Features
};

// ================================================================
// COLOR UTILITIES
// ================================================================

// Get color based on score (0-100)
function getScoreColor(score: number): string {
  if (score >= 90) return 'text-quantum-green';
  if (score >= 80) return 'text-quantum-cyan';
  if (score >= 70) return 'text-quantum-blue';
  if (score >= 60) return 'text-quantum-purple';
  if (score >= 50) return 'text-quantum-orange';
  return 'text-quantum-red';
}

// Get background gradient based on score
function getScoreBg(score: number): string {
  if (score >= 90) return 'from-quantum-green/20 to-quantum-green/5';
  if (score >= 80) return 'from-quantum-cyan/20 to-quantum-cyan/5';
  if (score >= 70) return 'from-quantum-blue/20 to-quantum-blue/5';
  if (score >= 60) return 'from-quantum-purple/20 to-quantum-purple/5';
  if (score >= 50) return 'from-quantum-orange/20 to-quantum-orange/5';
  return 'from-quantum-red/20 to-quantum-red/5';
}

// Get letter grade from score
function getLetterGrade(score: number): string {
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
}

// Get confidence badge color
function getConfidenceColor(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'High': return 'bg-quantum-green/20 text-quantum-green border-quantum-green/30';
    case 'Medium-High': return 'bg-quantum-cyan/20 text-quantum-cyan border-quantum-cyan/30';
    case 'Medium': return 'bg-quantum-orange/20 text-quantum-orange border-quantum-orange/30';
    case 'Low': return 'bg-quantum-red/20 text-quantum-red border-quantum-red/30';
  }
}

// Get confidence badge class (for compact view)
function getConfidenceBadgeClass(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'High': return 'bg-quantum-green/20 text-quantum-green border-quantum-green/30';
    case 'Medium-High': return 'bg-quantum-cyan/20 text-quantum-cyan border-quantum-cyan/30';
    case 'Medium': return 'bg-quantum-orange/20 text-quantum-orange border-quantum-orange/30';
    case 'Low': return 'bg-quantum-red/20 text-quantum-red border-quantum-red/30';
  }
}

// Get score assessment text
function getScoreAssessment(score: number): string {
  if (score >= 90) return 'Exceptional Property';
  if (score >= 80) return 'Excellent Choice';
  if (score >= 70) return 'Good Value';
  if (score >= 60) return 'Fair Option';
  if (score >= 50) return 'Below Average';
  return 'Needs Improvement';
}

// Chart colors
const CHART_COLORS = [
  '#00FFF0', // quantum-cyan
  '#9D4EDD', // quantum-purple
  '#06FFA5', // quantum-green
  '#4CC9F0', // quantum-blue
  '#FF6B35', // quantum-orange
  '#F72585', // quantum-pink
];

// ================================================================
// MAIN COMPONENT
// ================================================================

export function SMARTScoreDisplay({
  smartScore,
  sectionBreakdown,
  dataCompleteness,
  confidenceLevel,
  compact = false
}: SMARTScoreDisplayProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'radar' | 'bar' | 'list'>('radar');

  const letterGrade = getLetterGrade(smartScore);

  // Prepare data for radar chart (top 6 sections by weight)
  const radarData = sectionBreakdown
    .sort((a, b) => b.sectionWeight - a.sectionWeight)
    .slice(0, 6)
    .map(section => ({
      section: section.sectionId,
      score: section.sectionAverage,
      weight: section.sectionWeight,
      fullMark: 100
    }));

  // Prepare data for bar chart (all sections)
  const barData = sectionBreakdown.map(section => ({
    name: section.sectionId,
    score: section.sectionAverage,
    weight: section.sectionWeight,
    contribution: section.weightedContribution
  }));

  // Prepare data for pie chart (section weight distribution)
  const pieData = sectionBreakdown
    .filter(s => s.sectionWeight > 0)
    .sort((a, b) => b.sectionWeight - a.sectionWeight)
    .slice(0, 8)
    .map(section => ({
      name: section.sectionName,
      value: section.sectionWeight
    }));

  return (
    <div className={compact ? "space-y-3 max-h-[800px] overflow-y-auto pr-2" : "space-y-6"}>
      {/* ============================================================
          HEADER: FINAL SMART SCORE
      ============================================================ */}
      <div className={compact ? "glass-card p-4 border border-quantum-cyan/30 rounded-xl" : "glass-card p-8 border-2 border-quantum-cyan/30 rounded-2xl"}>
        <div className={compact ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>
          {/* Main Score Display */}
          <div className={compact ? "" : "lg:col-span-2"}>
            {!compact && (
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-8 h-8 text-quantum-cyan" />
                <div>
                  <h2 className="text-2xl font-bold text-white font-orbitron">
                    SMART Score
                  </h2>
                  <p className="text-sm text-gray-400">
                    Strategic Multi-criteria Assessment Rating for Tampa properties
                  </p>
                </div>
              </div>
            )}

            <div className={compact ? `p-3 rounded-lg bg-gradient-to-br ${getScoreBg(smartScore)} border border-white/10` : `p-6 rounded-xl bg-gradient-to-br ${getScoreBg(smartScore)} border border-white/10`}>
              <div className={compact ? "flex items-center justify-between" : "flex items-end gap-6"}>
                {/* Score Number */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="flex items-baseline"
                >
                  <span className={compact ? `text-3xl font-bold ${getScoreColor(smartScore)}` : `text-7xl font-bold ${getScoreColor(smartScore)}`}>
                    {smartScore.toFixed(1)}
                  </span>
                  <span className={compact ? "text-lg text-gray-400 ml-1" : "text-3xl text-gray-400 ml-2"}>/100</span>
                </motion.div>

                {/* Letter Grade */}
                <div className={compact ? "" : "flex-1"}>
                  <div className={compact ? `inline-block px-3 py-1 rounded-lg bg-gradient-to-r ${getScoreBg(smartScore)} border ${getScoreColor(smartScore).replace('text-', 'border-')}` : `inline-block px-6 py-3 rounded-xl bg-gradient-to-r ${getScoreBg(smartScore)} border-2 ${getScoreColor(smartScore).replace('text-', 'border-')}`}>
                    {!compact && <div className="text-sm text-gray-400">Grade</div>}
                    <div className={compact ? `text-2xl font-bold ${getScoreColor(smartScore)}` : `text-4xl font-bold ${getScoreColor(smartScore)}`}>
                      {letterGrade}
                    </div>
                  </div>
                </div>

                {/* Score Interpretation */}
                {!compact && (
                  <div className="flex-1">
                    <div className="text-sm text-gray-400 mb-2">Assessment</div>
                    <div className="text-lg font-semibold text-white">
                      {smartScore >= 90 && 'Exceptional Property'}
                      {smartScore >= 80 && smartScore < 90 && 'Excellent Choice'}
                      {smartScore >= 70 && smartScore < 80 && 'Good Value'}
                      {smartScore >= 60 && smartScore < 70 && 'Fair Option'}
                      {smartScore >= 50 && smartScore < 60 && 'Below Average'}
                      {smartScore < 50 && 'Needs Improvement'}
                    </div>
                  </div>
                )}
              </div>
              {compact && (
                <div className="text-xs text-gray-400 mt-1">{getScoreAssessment(smartScore)}</div>
              )}
            </div>
          </div>

          {/* Data Quality Metrics */}
          <div className={compact ? "flex items-center gap-2 text-xs" : "space-y-4"}>
            {compact ? (
              <>
                <span className="text-gray-400">Data: {dataCompleteness.toFixed(0)}%</span>
                <span className="text-gray-600">•</span>
                <span className={`px-2 py-1 rounded-full border ${getConfidenceBadgeClass(confidenceLevel)}`}>
                  {confidenceLevel}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400">{sectionBreakdown.length} sections</span>
              </>
            ) : (
              <>
                {/* Data Completeness */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Data Completeness
                    </span>
                    <span className={`text-lg font-bold ${getScoreColor(dataCompleteness)}`}>
                      {dataCompleteness}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dataCompleteness}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className={`h-full bg-gradient-to-r ${getScoreBg(dataCompleteness).replace('/20', '').replace('/5', '')}`}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {sectionBreakdown.reduce((sum, s) => sum + s.fieldsPopulated, 0)} of{' '}
                    {sectionBreakdown.reduce((sum, s) => sum + s.fieldsTotal, 0)} scoreable fields populated
                  </p>
                </div>

                {/* Confidence Level */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Confidence Level
                    </span>
                  </div>
                  <div className={`px-3 py-2 rounded-lg border text-center font-semibold ${getConfidenceColor(confidenceLevel)}`}>
                    {confidenceLevel}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Based on data sources, field validation, and LLM consensus
                  </p>
                </div>

                {/* Section Count */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Sections Analyzed</span>
                    <span className="text-2xl font-bold text-quantum-cyan">
                      {sectionBreakdown.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Comprehensive 22-category evaluation
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
          VISUALIZATION CONTROLS & CHARTS
      ============================================================ */}
      <div className={compact ? "glass-card p-3 border border-white/10 rounded-xl" : "glass-card p-6 border border-white/10 rounded-2xl"}>
        {/* View Mode Selector */}
        <div className={compact ? "flex flex-col gap-2 mb-3" : "flex items-center justify-between mb-6"}>
          <h3 className={compact ? "text-sm font-bold text-white flex items-center gap-1" : "text-xl font-bold text-white flex items-center gap-2"}>
            <BarChart3 className={compact ? "w-4 h-4 text-quantum-purple" : "w-6 h-6 text-quantum-purple"} />
            {compact ? "Performance" : "Section Performance Overview"}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('radar')}
              className={compact ? `px-2 py-1 rounded text-[10px] font-medium transition-all ${
                viewMode === 'radar'
                  ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }` : `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'radar'
                  ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Radar
            </button>
            <button
              onClick={() => setViewMode('bar')}
              className={compact ? `px-2 py-1 rounded text-[10px] font-medium transition-all ${
                viewMode === 'bar'
                  ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }` : `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'bar'
                  ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {compact ? "Bar" : "Bar Chart"}
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={compact ? `px-2 py-1 rounded text-[10px] font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }` : `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Chart Display */}
        <div className={compact ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>
          {/* Main Chart */}
          <div className={compact ? "" : "lg:col-span-2"}>
            {viewMode === 'radar' && (
              <ResponsiveContainer width="100%" height={compact ? 200 : 400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#ffffff20" />
                  <PolarAngleAxis
                    dataKey="section"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#00FFF0"
                    fill="#00FFF0"
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #ffffff20',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}

            {viewMode === 'bar' && (
              <ResponsiveContainer width="100%" height={compact ? 200 : 400}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #ffffff20',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="score" fill="#00FFF0" name="Section Score" />
                  <Bar dataKey="contribution" fill="#9D4EDD" name="Weighted Contribution" />
                </BarChart>
              </ResponsiveContainer>
            )}

            {viewMode === 'list' && (
              <div className={compact ? "h-[200px] overflow-y-auto pr-1 space-y-1" : "h-[400px] overflow-y-auto pr-2 space-y-2"}>
                {sectionBreakdown
                  .sort((a, b) => b.weightedContribution - a.weightedContribution)
                  .map((section, idx) => {
                    const Icon = SECTION_ICONS[section.sectionId] || Star;
                    return (
                      <div
                        key={section.sectionId}
                        className={compact ? "flex items-center gap-2 p-1.5 bg-white/5 rounded hover:bg-white/10 transition-all" : "flex items-center gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"}
                      >
                        <div className={compact ? "w-5 h-5 rounded bg-gradient-to-br from-quantum-cyan/20 to-quantum-purple/20 flex items-center justify-center flex-shrink-0" : "w-8 h-8 rounded-lg bg-gradient-to-br from-quantum-cyan/20 to-quantum-purple/20 flex items-center justify-center flex-shrink-0"}>
                          <Icon className={compact ? "w-3 h-3 text-quantum-cyan" : "w-4 h-4 text-quantum-cyan"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={compact ? "flex items-center gap-1 mb-0.5" : "flex items-center gap-2 mb-1"}>
                            <span className={compact ? "text-[10px] font-medium text-white truncate" : "text-sm font-medium text-white truncate"}>
                              {section.sectionName}
                            </span>
                            <span className={compact ? "text-[9px] text-gray-500" : "text-xs text-gray-500"}>
                              ({section.sectionWeight}%)
                            </span>
                          </div>
                          <div className={compact ? "h-1 bg-white/10 rounded-full overflow-hidden" : "h-1.5 bg-white/10 rounded-full overflow-hidden"}>
                            <div
                              className="h-full bg-gradient-to-r from-quantum-cyan to-quantum-purple"
                              style={{ width: `${section.sectionAverage}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={compact ? `text-xs font-bold ${getScoreColor(section.sectionAverage)}` : `text-lg font-bold ${getScoreColor(section.sectionAverage)}`}>
                            {section.sectionAverage.toFixed(1)}
                          </div>
                          <div className={compact ? "text-[9px] text-gray-500" : "text-xs text-gray-500"}>
                            +{section.weightedContribution.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Weight Distribution Pie Chart */}
          <div>
            <h4 className={compact ? "text-[10px] font-semibold text-gray-400 mb-2 flex items-center gap-1" : "text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2"}>
              <PieChart className={compact ? "w-3 h-3" : "w-4 h-4"} />
              {compact ? "Weights" : "Section Weight Distribution"}
            </h4>
            <ResponsiveContainer width="100%" height={compact ? 150 : 350}>
              <RechartsPie>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={compact ? false : ({ name, percent }) => `${name.charAt(0)}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={compact ? 50 : 80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #ffffff20',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ============================================================
          DETAILED SECTION BREAKDOWN (22 Sections)
      ============================================================ */}
      <div className={compact ? "glass-card p-3 border border-white/10 rounded-xl" : "glass-card p-6 border border-white/10 rounded-2xl"}>
        {!compact && (
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-quantum-purple" />
              Section-by-Section Breakdown
            </h3>
            <span className="text-sm text-gray-400">
              Click any section to view field details
            </span>
          </div>
        )}
        {compact && (
          <div className="mb-2">
            <h3 className="text-sm font-bold text-white">22 Sections</h3>
          </div>
        )}

        <div className={compact ? "space-y-1" : "space-y-3"}>
          {sectionBreakdown
            .sort((a, b) => b.weightedContribution - a.weightedContribution)
            .map((section) => {
              const Icon = SECTION_ICONS[section.sectionId] || Star;
              const isExpanded = expandedSection === section.sectionId;

              return (
                <div key={section.sectionId} className={compact ? "border border-white/10 rounded-lg overflow-hidden" : "border border-white/10 rounded-xl overflow-hidden"}>
                  {/* Section Header (Clickable) */}
                  <button
                    onClick={() => setExpandedSection(isExpanded ? null : section.sectionId)}
                    className={compact ? "w-full flex items-center gap-2 p-2 bg-white/5 hover:bg-white/10 transition-all" : "w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 transition-all"}
                  >
                    {/* Icon */}
                    <div className={compact ? `w-6 h-6 rounded-lg bg-gradient-to-br ${getScoreBg(section.sectionAverage)} flex items-center justify-center flex-shrink-0` : `w-12 h-12 rounded-xl bg-gradient-to-br ${getScoreBg(section.sectionAverage)} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={compact ? "w-3 h-3 text-white" : "w-6 h-6 text-white"} />
                    </div>

                    {/* Section Info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className={compact ? "flex items-center gap-1 mb-0.5" : "flex items-center gap-3 mb-1"}>
                        <span className={compact ? "text-xs font-medium text-white truncate" : "text-lg font-semibold text-white"}>
                          {section.sectionId}. {section.sectionName}
                        </span>
                        <span className={compact ? "text-[10px] px-1 py-0.5 bg-quantum-cyan/20 text-quantum-cyan rounded flex-shrink-0" : "text-xs px-2 py-1 bg-quantum-cyan/20 text-quantum-cyan rounded"}>
                          {section.sectionWeight}% weight
                        </span>
                      </div>
                      <div className={compact ? "flex items-center gap-1 text-[10px] text-gray-400" : "flex items-center gap-4 text-sm text-gray-400"}>
                        <span>{section.fieldsPopulated}/{section.fieldsTotal} fields</span>
                        <span>•</span>
                        <span>{((section.fieldsPopulated / section.fieldsTotal) * 100).toFixed(0)}% complete</span>
                        <span>•</span>
                        <span className="text-quantum-cyan">+{section.weightedContribution.toFixed(1)} contribution</span>
                      </div>
                    </div>

                    {/* Score Display */}
                    <div className={compact ? "flex items-center gap-1 flex-shrink-0" : "flex items-center gap-4 flex-shrink-0"}>
                      {/* Progress Bar */}
                      <div className={compact ? "w-16" : "w-32"}>
                        <div className={compact ? "h-1.5 bg-white/10 rounded-full overflow-hidden" : "h-3 bg-white/10 rounded-full overflow-hidden"}>
                          <div
                            className="h-full bg-gradient-to-r from-quantum-cyan to-quantum-purple"
                            style={{ width: `${section.sectionAverage}%` }}
                          />
                        </div>
                      </div>

                      {/* Score Number */}
                      <div className={compact ? `text-sm font-bold ${getScoreColor(section.sectionAverage)} w-8 text-right` : `text-2xl font-bold ${getScoreColor(section.sectionAverage)} w-16 text-right`}>
                        {section.sectionAverage.toFixed(compact ? 0 : 1)}
                      </div>

                      {/* Expand Icon */}
                      {isExpanded ? (
                        <ChevronDown className={compact ? "w-3 h-3 text-gray-400" : "w-5 h-5 text-gray-400"} />
                      ) : (
                        <ChevronRight className={compact ? "w-3 h-3 text-gray-400" : "w-5 h-5 text-gray-400"} />
                      )}
                    </div>
                  </button>

                  {/* Field Details (Expandable) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className={compact ? "p-2 bg-black/20 border-t border-white/10" : "p-6 bg-black/20 border-t border-white/10"}>
                          <h4 className={compact ? "text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1" : "text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2"}>
                            <Info className={compact ? "w-3 h-3" : "w-4 h-4"} />
                            Field Contributions
                          </h4>

                          <div className={compact ? "grid grid-cols-1 gap-1" : "grid grid-cols-1 md:grid-cols-2 gap-3"}>
                            {section.fieldScores.map((field) => (
                              <div
                                key={field.fieldId}
                                className={compact ? `p-1.5 rounded border ${
                                  field.rawValue !== null && field.rawValue !== undefined && field.rawValue !== ''
                                    ? 'bg-white/5 border-white/10'
                                    : 'bg-black/20 border-white/5 opacity-50'
                                }` : `p-3 rounded-lg border ${
                                  field.rawValue !== null && field.rawValue !== undefined && field.rawValue !== ''
                                    ? 'bg-white/5 border-white/10'
                                    : 'bg-black/20 border-white/5 opacity-50'
                                }`}
                              >
                                <div className={compact ? "flex items-start justify-between mb-1 gap-2" : "flex items-start justify-between mb-2"}>
                                  <div className="flex-1 min-w-0">
                                    <div className={compact ? "text-[10px] font-medium text-white mb-0.5" : "text-sm font-medium text-white mb-1"}>
                                      Field #{field.fieldId}: {field.fieldName}
                                    </div>
                                    {field.rawValue !== null && field.rawValue !== undefined && field.rawValue !== '' ? (
                                      <div className={compact ? "text-[9px] text-gray-400 truncate" : "text-xs text-gray-400 truncate"}>
                                        Value: {String(field.rawValue)}
                                      </div>
                                    ) : (
                                      <div className={compact ? "text-[9px] text-gray-500 italic" : "text-xs text-gray-500 italic"}>No data</div>
                                    )}
                                  </div>

                                  <div className="text-right flex-shrink-0">
                                    <div className={compact ? `text-xs font-bold ${getScoreColor(field.normalizedScore)}` : `text-lg font-bold ${getScoreColor(field.normalizedScore)}`}>
                                      {field.normalizedScore.toFixed(0)}
                                    </div>
                                    {field.rawValue !== null && field.rawValue !== undefined && field.rawValue !== '' && (
                                      <div className={compact ? `text-[9px] px-1 py-0.5 rounded ${getConfidenceColor(field.confidence)}` : `text-xs px-2 py-0.5 rounded ${getConfidenceColor(field.confidence)}`}>
                                        {field.confidence}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Score Bar */}
                                {field.rawValue !== null && field.rawValue !== undefined && field.rawValue !== '' && (
                                  <div className={compact ? "h-1 bg-white/10 rounded-full overflow-hidden" : "h-1.5 bg-white/10 rounded-full overflow-hidden"}>
                                    <div
                                      className={`h-full ${
                                        field.normalizedScore >= 80
                                          ? 'bg-quantum-green'
                                          : field.normalizedScore >= 60
                                          ? 'bg-quantum-cyan'
                                          : 'bg-quantum-orange'
                                      }`}
                                      style={{ width: `${field.normalizedScore}%` }}
                                    />
                                  </div>
                                )}

                                {/* Notes */}
                                {field.notes && (
                                  <p className={compact ? "text-[9px] text-gray-500 mt-1 italic" : "text-xs text-gray-500 mt-2 italic"}>{field.notes}</p>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Section Summary Stats */}
                          <div className={compact ? "mt-2 p-2 bg-white/5 rounded border border-white/10" : "mt-6 p-4 bg-white/5 rounded-lg border border-white/10"}>
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className={compact ? "text-sm font-bold text-quantum-cyan" : "text-2xl font-bold text-quantum-cyan"}>
                                  {section.sectionAverage.toFixed(1)}
                                </div>
                                <div className={compact ? "text-[9px] text-gray-400 mt-0.5" : "text-xs text-gray-400 mt-1"}>Average Score</div>
                              </div>
                              <div>
                                <div className={compact ? "text-sm font-bold text-quantum-purple" : "text-2xl font-bold text-quantum-purple"}>
                                  {section.weightedContribution.toFixed(1)}
                                </div>
                                <div className={compact ? "text-[9px] text-gray-400 mt-0.5" : "text-xs text-gray-400 mt-1"}>Contribution</div>
                              </div>
                              <div>
                                <div className={compact ? "text-sm font-bold text-quantum-green" : "text-2xl font-bold text-quantum-green"}>
                                  {((section.fieldsPopulated / section.fieldsTotal) * 100).toFixed(0)}%
                                </div>
                                <div className={compact ? "text-[9px] text-gray-400 mt-0.5" : "text-xs text-gray-400 mt-1"}>Completeness</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
        </div>
      </div>

      {/* ============================================================
          METHODOLOGY & EXPLANATION
      ============================================================ */}
      <div className={compact ? "glass-card p-3 border border-quantum-purple/30 rounded-xl bg-gradient-to-br from-quantum-purple/10 to-transparent" : "glass-card p-6 border border-quantum-purple/30 rounded-2xl bg-gradient-to-br from-quantum-purple/10 to-transparent"}>
        <div className={compact ? "flex items-center gap-1 mb-2" : "flex items-center gap-3 mb-4"}>
          <Info className={compact ? "w-4 h-4 text-quantum-purple" : "w-6 h-6 text-quantum-purple"} />
          <h3 className={compact ? "text-sm font-bold text-white" : "text-xl font-bold text-white"}>How SMART Score Works</h3>
        </div>

        <div className={compact ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
          <div>
            <h4 className={compact ? "text-[10px] font-semibold text-quantum-cyan mb-1" : "text-sm font-semibold text-quantum-cyan mb-3"}>Calculation Method</h4>
            <ul className={compact ? "space-y-1 text-[9px] text-gray-300" : "space-y-2 text-sm text-gray-300"}>
              <li className={compact ? "flex items-start gap-1" : "flex items-start gap-2"}>
                <CheckCircle className={compact ? "w-2 h-2 text-quantum-cyan mt-0.5 flex-shrink-0" : "w-4 h-4 text-quantum-cyan mt-0.5 flex-shrink-0"} />
                <span>Each field is normalized to a 0-100 score based on quality metrics</span>
              </li>
              <li className={compact ? "flex items-start gap-1" : "flex items-start gap-2"}>
                <CheckCircle className={compact ? "w-2 h-2 text-quantum-cyan mt-0.5 flex-shrink-0" : "w-4 h-4 text-quantum-cyan mt-0.5 flex-shrink-0"} />
                <span>Section scores are averaged across populated fields only</span>
              </li>
              <li className={compact ? "flex items-start gap-1" : "flex items-start gap-2"}>
                <CheckCircle className={compact ? "w-2 h-2 text-quantum-cyan mt-0.5 flex-shrink-0" : "w-4 h-4 text-quantum-cyan mt-0.5 flex-shrink-0"} />
                <span>Each section is weighted by importance (e.g., Pricing: 20%, Schools: 15%)</span>
              </li>
              <li className={compact ? "flex items-start gap-1" : "flex items-start gap-2"}>
                <CheckCircle className={compact ? "w-2 h-2 text-quantum-cyan mt-0.5 flex-shrink-0" : "w-4 h-4 text-quantum-cyan mt-0.5 flex-shrink-0"} />
                <span>Final score is sum of all weighted contributions</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={compact ? "text-[10px] font-semibold text-quantum-cyan mb-1" : "text-sm font-semibold text-quantum-cyan mb-3"}>What the Score Means</h4>
            <div className={compact ? "space-y-1" : "space-y-2"}>
              <div className={compact ? "flex items-center justify-between p-1 bg-quantum-green/10 rounded" : "flex items-center justify-between p-2 bg-quantum-green/10 rounded"}>
                <span className={compact ? "text-[9px] text-gray-300" : "text-sm text-gray-300"}>90-100:</span>
                <span className={compact ? "text-[9px] font-semibold text-quantum-green" : "text-sm font-semibold text-quantum-green"}>Exceptional</span>
              </div>
              <div className={compact ? "flex items-center justify-between p-1 bg-quantum-cyan/10 rounded" : "flex items-center justify-between p-2 bg-quantum-cyan/10 rounded"}>
                <span className={compact ? "text-[9px] text-gray-300" : "text-sm text-gray-300"}>80-89:</span>
                <span className={compact ? "text-[9px] font-semibold text-quantum-cyan" : "text-sm font-semibold text-quantum-cyan"}>Excellent</span>
              </div>
              <div className={compact ? "flex items-center justify-between p-1 bg-quantum-blue/10 rounded" : "flex items-center justify-between p-2 bg-quantum-blue/10 rounded"}>
                <span className={compact ? "text-[9px] text-gray-300" : "text-sm text-gray-300"}>70-79:</span>
                <span className={compact ? "text-[9px] font-semibold text-quantum-blue" : "text-sm font-semibold text-quantum-blue"}>Good</span>
              </div>
              <div className={compact ? "flex items-center justify-between p-1 bg-quantum-purple/10 rounded" : "flex items-center justify-between p-2 bg-quantum-purple/10 rounded"}>
                <span className={compact ? "text-[9px] text-gray-300" : "text-sm text-gray-300"}>60-69:</span>
                <span className={compact ? "text-[9px] font-semibold text-quantum-purple" : "text-sm font-semibold text-quantum-purple"}>Fair</span>
              </div>
              <div className={compact ? "flex items-center justify-between p-1 bg-quantum-orange/10 rounded" : "flex items-center justify-between p-2 bg-quantum-orange/10 rounded"}>
                <span className={compact ? "text-[9px] text-gray-300" : "text-sm text-gray-300"}>Below 60:</span>
                <span className={compact ? "text-[9px] font-semibold text-quantum-orange" : "text-sm font-semibold text-quantum-orange"}>Needs Review</span>
              </div>
            </div>
          </div>
        </div>

        <div className={compact ? "mt-2 p-2 bg-quantum-cyan/10 border border-quantum-cyan/20 rounded" : "mt-6 p-4 bg-quantum-cyan/10 border border-quantum-cyan/20 rounded-lg"}>
          <p className={compact ? "text-[9px] text-gray-300" : "text-sm text-gray-300"}>
            <strong className="text-quantum-cyan">Note:</strong> SMART Scores are calculated using
            industry-standard weights validated by 2-LLM consensus (Claude Opus + Perplexity).
            Scores reflect property quality relative to Florida coastal markets and may not
            directly correlate with market price.
          </p>
        </div>
      </div>
    </div>
  );
}
