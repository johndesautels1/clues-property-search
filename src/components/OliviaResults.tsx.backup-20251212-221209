/**
 * Olivia AI Results Component
 * Displays property analysis results from Olivia
 */

import { motion } from 'framer-motion';
import { 
  X, Sparkles, MessageCircle, Trophy, 
  ThumbsUp, ThumbsDown, Award
} from 'lucide-react';
import type { OliviaAnalysisResult } from '@/api/olivia';

interface OliviaResultsProps {
  result: OliviaAnalysisResult;
  properties: Array<{ id: string; address: string; city: string }>;
  onClose: () => void;
}

export function OliviaResults({ result, properties, onClose }: OliviaResultsProps) {
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
          label: '#1 Pick'
        };
      case 2:
        return {
          bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
          icon: <Award className="w-4 h-4" />,
          label: '#2'
        };
      case 3:
        return {
          bg: 'bg-gradient-to-r from-amber-700 to-amber-800',
          icon: <Award className="w-4 h-4" />,
          label: '#3'
        };
      default:
        return {
          bg: 'bg-gray-600',
          icon: null,
          label: `#${rank}`
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-card border border-quantum-purple/30 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-quantum-purple/20 to-quantum-cyan/20 px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-quantum-purple/30 rounded-xl">
              <Sparkles className="w-5 h-5 text-quantum-purple" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Olivia's Analysis</h3>
              <p className="text-xs text-gray-400">AI-Powered Property Comparison</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Verbal Script - Olivia's Voice */}
        <div className="bg-quantum-purple/10 border border-quantum-purple/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-quantum-purple/20 rounded-lg flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-quantum-purple" />
            </div>
            <div>
              <p className="text-sm text-gray-300 italic leading-relaxed">
                "{result.verbalScript}"
              </p>
              <p className="text-xs text-quantum-purple mt-2">— Olivia, CLUES™ AI Advisor</p>
            </div>
          </div>
        </div>

        {/* Top Recommendation Card */}
        <div className="bg-gradient-to-r from-quantum-green/20 to-quantum-cyan/20 border border-quantum-green/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-quantum-green" />
            <span className="text-sm font-medium text-quantum-green">Olivia's Top Pick</span>
          </div>
          <h4 className="text-lg font-semibold text-white mb-1">
            {getPropertyAddress(result.rankings[0]?.propertyId || '')}
          </h4>
          <p className="text-sm text-gray-300">{result.summary}</p>
        </div>

        {/* Rankings List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Full Rankings
          </h4>
          
          {result.rankings
            .sort((a, b) => a.rank - b.rank)
            .map((ranking) => {
              const badge = getRankBadge(ranking.rank);
              
              return (
                <motion.div
                  key={ranking.propertyId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: ranking.rank * 0.1 }}
                  className={`bg-white/5 border rounded-xl p-4 ${
                    ranking.rank === 1 
                      ? 'border-quantum-green/30' 
                      : 'border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`${badge.bg} px-2 py-1 rounded-lg text-white text-xs font-bold flex items-center gap-1`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                      <div>
                        <h5 className="font-medium text-white text-sm">
                          {getPropertyAddress(ranking.propertyId)}
                        </h5>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-quantum-cyan">
                        {ranking.score}
                      </div>
                      <div className="text-xs text-gray-500">Olivia Score</div>
                    </div>
                  </div>

                  {/* Pros and Cons */}
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-quantum-green mb-2">
                        <ThumbsUp className="w-3 h-3" />
                        <span>Pros</span>
                      </div>
                      <ul className="space-y-1">
                        {ranking.pros.map((pro, i) => (
                          <li key={i} className="text-xs text-gray-300 flex items-start gap-1">
                            <span className="text-quantum-green">+</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs text-quantum-red mb-2">
                        <ThumbsDown className="w-3 h-3" />
                        <span>Cons</span>
                      </div>
                      <ul className="space-y-1">
                        {ranking.cons.map((con, i) => (
                          <li key={i} className="text-xs text-gray-300 flex items-start gap-1">
                            <span className="text-quantum-red">−</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-white/10">
          <p className="text-xs text-gray-500">
            Analysis powered by CLUES™ AI • Results based on provided property data
          </p>
        </div>
      </div>
    </motion.div>
  );
}