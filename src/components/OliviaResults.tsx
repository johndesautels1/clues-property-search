/**
 * Olivia AI Results Component - PREMIUM EDITION
 * Enhanced with methodology transparency, timeline analysis, and CLUES™ branding
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, MessageCircle, Trophy,
  ThumbsUp, ThumbsDown, Award, ChevronDown,
  Brain, Calculator, TrendingUp, AlertTriangle,
  Check, Calendar, Target, Mail, Video,
  Phone, FileText, ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import type { OliviaAnalysisResult } from '@/api/olivia';

interface OliviaResultsProps {
  result: OliviaAnalysisResult;
  properties: Array<{ id: string; address: string; city: string }>;
  onClose: () => void;
}

export function OliviaResults({ result, properties, onClose }: OliviaResultsProps) {
  const [showMethodology, setShowMethodology] = useState(false);

  // Find property details by ID
  const getPropertyAddress = (propertyId: string) => {
    const prop = properties.find(p => p.id === propertyId);
    return prop ? `${prop.address}, ${prop.city}` : 'Unknown Property';
  };

  // Get rank badge styling
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: 'bg-gradient-to-r from-yellow-500 to-amber-500',
          icon: <Trophy className="w-4 h-4" />,
          label: '#1 Pick',
          glow: 'shadow-lg shadow-yellow-500/50'
        };
      case 2:
        return {
          bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
          icon: <Award className="w-4 h-4" />,
          label: '#2',
          glow: 'shadow-md shadow-gray-400/30'
        };
      case 3:
        return {
          bg: 'bg-gradient-to-r from-amber-700 to-amber-800',
          icon: <Award className="w-4 h-4" />,
          label: '#3',
          glow: 'shadow-md shadow-amber-700/30'
        };
      default:
        return {
          bg: 'bg-gray-600',
          icon: null,
          label: `#${rank}`,
          glow: ''
        };
    }
  };

  // Check for enhanced data (backward compatible)
  const hasMethodology = result.methodology && result.methodology.variablesConsidered;
  const hasTimeline = result.timeline && result.timeline.shortTerm;
  const hasActionItems = result.actionItems && result.actionItems.immediate;
  const confidenceLevel = result.methodology?.confidenceLevel || 85;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-card border border-quantum-purple/30 rounded-2xl overflow-hidden shadow-2xl"
    >
      {/* Enhanced Header with CLUES™ Branding */}
      <div className="relative bg-gradient-to-r from-quantum-purple/20 via-quantum-cyan/20 to-quantum-purple/20 px-6 py-5 border-b border-white/10">
        {/* Animated background effect */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-grid-quantum" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* CLUES™ Logo */}
            <motion.img
              src="/clues-icon.svg"
              className="w-12 h-12 filter drop-shadow-glow-cyan"
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", duration: 0.8 }}
            />
            <div>
              <h3 className="font-orbitron text-xl font-bold text-gradient-quantum">
                Olivia's AI Analysis
              </h3>
              <p className="text-xs text-quantum-cyan flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                CLUES™ Advanced Property Intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:rotate-90"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Confidence Score Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="flex items-center justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-quantum-cyan to-quantum-purple rounded-full blur-xl opacity-50" />
            <div className="relative bg-gradient-to-r from-quantum-cyan/20 to-quantum-purple/20 border-2 border-quantum-cyan/50 rounded-full px-6 py-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient-quantum">
                  {confidenceLevel}%
                </div>
                <div className="text-xs text-gray-400">Confidence Score</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Verbal Script - Olivia's Voice */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden bg-gradient-to-br from-quantum-purple/10 to-quantum-cyan/10 border border-quantum-purple/30 rounded-xl p-5"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-quantum-purple/10 rounded-full blur-3xl" />
          <div className="relative flex items-start gap-3">
            <div className="p-3 bg-quantum-purple/20 rounded-xl flex-shrink-0 shadow-lg shadow-quantum-purple/20">
              <MessageCircle className="w-5 h-5 text-quantum-purple" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-200 italic leading-relaxed mb-3">
                "{result.verbalScript}"
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-quantum-purple to-quantum-cyan flex items-center justify-center text-xs font-bold">
                  O
                </div>
                <p className="text-xs font-medium text-quantum-purple">
                  Olivia • CLUES™ AI Advisor
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Top Recommendation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-quantum-green/5 via-quantum-cyan/5 to-transparent" />
          <div className="relative glass-5d p-6 border-2 border-quantum-green/40 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="w-8 h-8 text-quantum-green drop-shadow-glow-green" />
              <span className="text-sm font-semibold text-quantum-green uppercase tracking-wider">
                Olivia's Top Pick
              </span>
            </div>
            <h4 className="text-2xl font-bold text-white mb-2">
              {getPropertyAddress(result.rankings[0]?.propertyId || '')}
            </h4>
            <p className="text-base text-gray-300 leading-relaxed mb-4">
              {result.summary}
            </p>

            {/* Confidence Meter */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400 font-medium">Recommendation Strength</span>
                <span className="text-quantum-cyan font-bold">
                  {confidenceLevel}% Confidence
                </span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidenceLevel}%` }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-quantum-green via-quantum-cyan to-quantum-purple shadow-lg"
                  style={{
                    boxShadow: '0 0 10px rgba(0, 255, 136, 0.5)'
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Methodology Section (Optional - Enhanced Data) */}
        {hasMethodology && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card border border-white/10 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setShowMethodology(!showMethodology)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-quantum-purple" />
                <h5 className="font-semibold text-white">
                  How Olivia Analyzed These Properties
                </h5>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                  showMethodology ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {showMethodology && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-white/10"
                >
                  <div className="p-5 space-y-4">
                    {/* Variables Considered */}
                    <div>
                      <h6 className="text-xs font-semibold text-quantum-cyan mb-3 uppercase tracking-wider">
                        Variables Considered
                      </h6>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {result.methodology.variablesConsidered.map((variable, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 + (i * 0.05) }}
                            className="bg-white/5 p-3 rounded-lg border border-white/10 hover:border-quantum-cyan/30 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-300 font-medium">
                                {variable.name}
                              </span>
                              <span className="text-xs font-bold text-quantum-cyan bg-quantum-cyan/10 px-2 py-0.5 rounded">
                                {variable.weight}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {variable.description}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Scoring Formula */}
                    <div className="bg-gradient-to-r from-quantum-purple/10 to-quantum-cyan/10 border border-quantum-purple/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator className="w-4 h-4 text-quantum-purple" />
                        <p className="text-xs font-semibold text-quantum-purple uppercase tracking-wider">
                          Scoring Formula
                        </p>
                      </div>
                      <code className="text-sm text-white font-mono block bg-black/20 p-3 rounded border border-white/10">
                        {result.methodology.scoringEquation}
                      </code>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Timeline Analysis (Optional - Enhanced Data) */}
        {hasTimeline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid md:grid-cols-2 gap-4"
          >
            {/* Short-Term */}
            <div className="glass-card p-5 border-l-4 border-quantum-green rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-quantum-green/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-quantum-green" />
                </div>
                <div>
                  <h5 className="text-base font-semibold text-quantum-green">
                    Short-Term Outlook
                  </h5>
                  <p className="text-xs text-gray-400">
                    {result.timeline.shortTerm.timeframe}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-medium">
                    Immediate Benefits
                  </p>
                  <div className="space-y-1.5">
                    {result.timeline.shortTerm.pros.map((pro, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-200">
                        <Check className="w-4 h-4 text-quantum-green flex-shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-2 font-medium">
                    Considerations
                  </p>
                  <div className="space-y-1.5">
                    {result.timeline.shortTerm.considerations.map((con, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-400">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{con}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Long-Term */}
            <div className="glass-card p-5 border-l-4 border-quantum-purple rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-quantum-purple/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-quantum-purple" />
                </div>
                <div>
                  <h5 className="text-base font-semibold text-quantum-purple">
                    Long-Term Potential
                  </h5>
                  <p className="text-xs text-gray-400">
                    {result.timeline.longTerm.timeframe}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-medium">
                    Growth Opportunities
                  </p>
                  <div className="space-y-1.5">
                    {result.timeline.longTerm.pros.map((pro, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-200">
                        <TrendingUp className="w-4 h-4 text-quantum-purple flex-shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-2 font-medium">
                    Risk Factors
                  </p>
                  <div className="space-y-1.5">
                    {result.timeline.longTerm.considerations.map((con, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-400">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{con}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Full Rankings List */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Complete Rankings
          </h4>

          {result.rankings
            .sort((a, b) => a.rank - b.rank)
            .map((ranking, index) => {
              const badge = getRankBadge(ranking.rank);

              return (
                <motion.div
                  key={ranking.propertyId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + (index * 0.1) }}
                  className={`glass-card p-5 rounded-xl ${
                    ranking.rank === 1
                      ? 'border-2 border-quantum-green/40 shadow-lg shadow-quantum-green/10'
                      : 'border border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`${badge.bg} ${badge.glow} px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                      <div>
                        <h5 className="font-semibold text-white text-sm">
                          {getPropertyAddress(ranking.propertyId)}
                        </h5>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gradient-quantum">
                        {ranking.score}
                      </div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                  </div>

                  {/* Score Bar */}
                  <div className="mb-4">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${ranking.score}%` }}
                        transition={{ duration: 1, delay: 0.8 + (index * 0.1) }}
                        className="h-full bg-gradient-to-r from-quantum-cyan to-quantum-purple"
                      />
                    </div>
                  </div>

                  {/* Pros and Cons Grid */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-quantum-green/5 border border-quantum-green/20 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-xs text-quantum-green mb-2 font-semibold">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Strengths</span>
                      </div>
                      <ul className="space-y-1.5">
                        {ranking.pros.map((pro, i) => (
                          <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                            <span className="text-quantum-green font-bold">+</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-quantum-red/5 border border-quantum-red/20 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-xs text-quantum-red mb-2 font-semibold">
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>Considerations</span>
                      </div>
                      <ul className="space-y-1.5">
                        {ranking.cons.map((con, i) => (
                          <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                            <span className="text-quantum-red font-bold">−</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </div>

        {/* Action Items & Next Steps (Optional - Enhanced Data) */}
        {hasActionItems && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-card p-5 bg-gradient-to-br from-quantum-cyan/5 via-transparent to-quantum-purple/5 border border-quantum-cyan/20 rounded-xl"
          >
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-quantum-cyan" />
              Your Next Steps
            </h4>

            <div className="grid md:grid-cols-2 gap-5 mb-5">
              {/* Immediate Actions */}
              <div>
                <h5 className="text-sm font-semibold text-quantum-cyan mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-quantum-cyan/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-quantum-cyan">1</span>
                  </div>
                  Immediate Actions
                </h5>
                <ul className="space-y-2">
                  {result.actionItems.immediate.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <ArrowRight className="w-4 h-4 text-quantum-cyan flex-shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Follow-Up Steps */}
              <div>
                <h5 className="text-sm font-semibold text-quantum-purple mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-quantum-purple/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-quantum-purple">2</span>
                  </div>
                  Follow-Up Steps
                </h5>
                <ul className="space-y-2">
                  {result.actionItems.nextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <ArrowRight className="w-4 h-4 text-quantum-purple flex-shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Resources */}
            {result.actionItems.resources && result.actionItems.resources.length > 0 && (
              <div className="border-t border-white/10 pt-4">
                <h5 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                  Recommended Resources
                </h5>
                <div className="grid gap-2">
                  {result.actionItems.resources.map((resource, i) => (
                    <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/10 hover:border-quantum-cyan/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-quantum-cyan" />
                        <span className="text-sm font-medium text-white">{resource.title}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 ml-6">{resource.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Premium CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-quantum-cyan/10 via-quantum-purple/10 to-quantum-pink/10" />
          <div className="relative glass-5d p-6 border-2 border-quantum-cyan/30 rounded-xl shadow-lg shadow-quantum-cyan/10">
            <h4 className="text-xl font-bold text-white mb-2">Ready to Move Forward?</h4>
            <p className="text-sm text-gray-300 mb-5">
              Schedule a personalized consultation with our CLUES™ certified property experts to explore this opportunity in depth.
            </p>

            <div className="grid sm:grid-cols-3 gap-3">
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-quantum-cyan to-quantum-blue text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-quantum-cyan/30 transition-all duration-300 hover:-translate-y-0.5">
                <Phone className="w-4 h-4" />
                Schedule Call
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-quantum-purple to-quantum-pink text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-quantum-purple/30 transition-all duration-300 hover:-translate-y-0.5">
                <Mail className="w-4 h-4" />
                Email Report
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-all duration-300 hover:-translate-y-0.5">
                <Video className="w-4 h-4" />
                Watch Tour
              </button>
            </div>
          </div>
        </motion.div>

        {/* CLUES™ Branding Footer */}
        <div className="text-center py-4 border-t border-white/10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/clues-icon.svg" className="w-6 h-6" alt="CLUES" />
            <span className="text-sm font-orbitron font-bold text-gradient-quantum">
              CLUES™ Property Intelligence System
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Analysis powered by Claude AI • Comprehensive Location Utility & Evaluation System
          </p>
          <p className="text-xs text-gray-600 mt-1">
            © 2025 CLUES™ • Results based on provided property data
          </p>
        </div>
      </div>
    </motion.div>
  );
}
