/**
 * Weight Adjuster Component
 * User-adjustable weight sliders for all 23 SMART Score sections
 *
 * Features:
 * - Auto-rebalancing: When one weight changes, others proportionally adjust
 * - Always sums to exactly 100%
 * - Visual feedback showing weight changes
 * - Reset to industry-standard defaults
 * - Persists to localStorage via weightStore
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale, RotateCcw, Save, Info, ChevronDown, ChevronUp,
  MapPin, DollarSign, Home, Receipt, Wrench, Star, TreePine,
  FileCheck, GraduationCap, Navigation, Shield, CloudRain,
  Zap, Car, Building, Waves, FileText, Users, BarChart3,
  AlertTriangle, CheckCircle
} from 'lucide-react';
import { useWeightStore, SECTION_METADATA, DEFAULT_WEIGHTS } from '@/store/weightStore';

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
  'M': BarChart3,        // Market & Investment
  'N': Zap,              // Utilities & Connectivity
  'O': CloudRain,        // Environment & Risk
  'P': Star,             // Additional Features
  'Q': Car,              // Parking
  'R': Building,         // Building
  'S': Scale,            // Legal
  'T': Waves,            // Waterfront
  'U': FileText,         // Leasing
  'V': Users,            // Features
  'W': BarChart3,        // Market Performance
};

// ================================================================
// COLOR UTILITIES
// ================================================================

function getWeightColor(weight: number, maxWeight: number): string {
  const ratio = weight / maxWeight;
  if (ratio >= 0.8) return 'from-quantum-cyan to-quantum-green';
  if (ratio >= 0.5) return 'from-quantum-blue to-quantum-cyan';
  if (ratio >= 0.2) return 'from-quantum-purple to-quantum-blue';
  return 'from-quantum-orange to-quantum-purple';
}

function getCriticalBadgeClass(isCritical: boolean): string {
  return isCritical
    ? 'bg-quantum-cyan/20 text-quantum-cyan border-quantum-cyan/30'
    : 'bg-white/10 text-gray-400 border-white/10';
}

// ================================================================
// MAIN COMPONENT
// ================================================================

interface WeightAdjusterProps {
  compact?: boolean;
  onClose?: () => void;
}

export function WeightAdjuster({ compact = false, onClose }: WeightAdjusterProps) {
  const {
    weights,
    isCustomized,
    weightsSource,
    lastModified,
    setSectionWeight,
    resetToDefaults,
    validateWeights,
    getWeightMetadata
  } = useWeightStore();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showAllSections, setShowAllSections] = useState(false);

  // Get validation status
  const validation = validateWeights();
  const weightMetadata = getWeightMetadata();

  // Calculate total (should always be 100)
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Filter sections - show non-zero or all based on toggle
  const visibleSections = showAllSections
    ? weightMetadata
    : weightMetadata.filter(s => s.weight > 0 || s.isCritical);

  // Sort by weight descending
  const sortedSections = [...visibleSections].sort((a, b) => b.weight - a.weight);

  return (
    <div className={compact ? "space-y-3" : "space-y-6"}>
      {/* ============================================================
          HEADER: Total Weight & Status
      ============================================================ */}
      <div className={compact ? "glass-card p-4 border border-quantum-purple/30 rounded-xl" : "glass-card p-6 border-2 border-quantum-purple/30 rounded-2xl"}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Scale className={compact ? "w-5 h-5 text-quantum-purple" : "w-8 h-8 text-quantum-purple"} />
            <div>
              <h2 className={compact ? "text-lg font-bold text-white font-orbitron" : "text-2xl font-bold text-white font-orbitron"}>
                Section Weights
              </h2>
              <p className="text-sm text-gray-400">
                Adjust importance of each scoring category
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-gray-300 transition-all"
            >
              Close
            </button>
          )}
        </div>

        {/* Status Bar */}
        <div className={compact ? "grid grid-cols-2 gap-3" : "grid grid-cols-4 gap-4"}>
          {/* Total Weight */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Total Weight</div>
            <div className={`text-2xl font-bold ${
              Math.abs(totalWeight - 100) < 0.1 ? 'text-quantum-green' : 'text-quantum-red'
            }`}>
              {totalWeight.toFixed(2)}%
            </div>
          </div>

          {/* Validation Status */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Status</div>
            <div className={`flex items-center gap-2 ${
              validation.valid ? 'text-quantum-green' : 'text-quantum-orange'
            }`}>
              {validation.valid ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <span className="font-semibold">
                {validation.valid ? 'Valid' : `${validation.issues.length} Issues`}
              </span>
            </div>
          </div>

          {/* Source */}
          {!compact && (
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Source</div>
              <div className="text-lg font-semibold text-quantum-cyan capitalize">
                {weightsSource.replace('-', ' ')}
              </div>
            </div>
          )}

          {/* Last Modified */}
          {!compact && (
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Modified</div>
              <div className="text-sm text-gray-300">
                {lastModified ? new Date(lastModified).toLocaleString() : 'Never'}
              </div>
            </div>
          )}
        </div>

        {/* Validation Issues */}
        {!validation.valid && (
          <div className="mt-4 p-3 bg-quantum-orange/10 border border-quantum-orange/30 rounded-lg">
            <div className="text-sm text-quantum-orange font-semibold mb-2">Validation Issues:</div>
            <ul className="text-xs text-gray-300 space-y-1">
              {validation.issues.map((issue, idx) => (
                <li key={idx}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-4 py-2 bg-quantum-purple/20 hover:bg-quantum-purple/30 text-quantum-purple rounded-lg border border-quantum-purple/30 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>

          <button
            onClick={() => setShowAllSections(!showAllSections)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-all"
          >
            {showAllSections ? 'Show Active Only' : 'Show All 23 Sections'}
          </button>
        </div>
      </div>

      {/* ============================================================
          INFO BOX: How Auto-Rebalancing Works
      ============================================================ */}
      <div className={compact ? "glass-card p-3 border border-quantum-cyan/20 rounded-xl bg-gradient-to-br from-quantum-cyan/5 to-transparent" : "glass-card p-4 border border-quantum-cyan/20 rounded-xl bg-gradient-to-br from-quantum-cyan/5 to-transparent"}>
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-quantum-cyan flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <strong className="text-quantum-cyan">Auto-Rebalancing:</strong> When you adjust one section's weight,
            all other sections proportionally adjust to maintain exactly 100% total.
            Critical sections (marked with ⚡) have minimum weight requirements.
          </div>
        </div>
      </div>

      {/* ============================================================
          SECTION WEIGHT SLIDERS
      ============================================================ */}
      <div className={compact ? "glass-card p-4 border border-white/10 rounded-xl" : "glass-card p-6 border border-white/10 rounded-2xl"}>
        <h3 className={compact ? "text-lg font-bold text-white mb-4 flex items-center gap-2" : "text-xl font-bold text-white mb-6 flex items-center gap-2"}>
          <BarChart3 className="w-5 h-5 text-quantum-cyan" />
          Adjust Section Weights
          <span className="text-sm text-gray-400 font-normal ml-2">
            ({sortedSections.length} sections)
          </span>
        </h3>

        <div className="space-y-3">
          {sortedSections.map((section) => {
            const Icon = SECTION_ICONS[section.id] || Star;
            const isExpanded = expandedSections.has(section.id);
            const defaultWeight = DEFAULT_WEIGHTS[section.id] || 0;
            const weightDiff = section.weight - defaultWeight;

            return (
              <div
                key={section.id}
                className="border border-white/10 rounded-xl overflow-hidden bg-white/5"
              >
                {/* Section Header */}
                <div className="flex items-center gap-3 p-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getWeightColor(section.weight, section.maxWeight)} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Section Name & Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">
                        {section.id}. {section.name}
                      </span>
                      {section.isCritical && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getCriticalBadgeClass(section.isCritical)}`}>
                          ⚡ Critical
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      Range: {section.minWeight}% - {section.maxWeight}%
                      {weightDiff !== 0 && (
                        <span className={`ml-2 ${weightDiff > 0 ? 'text-quantum-green' : 'text-quantum-orange'}`}>
                          ({weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(2)}% from default)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Current Weight Display */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-quantum-cyan">
                      {section.weight.toFixed(2)}%
                    </div>
                  </div>

                  {/* Expand Button */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Slider (Expandable) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2 border-t border-white/10 bg-black/20">
                        {/* Weight Slider */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                            <span>{section.minWeight}%</span>
                            <span className="text-quantum-cyan font-semibold">
                              Current: {section.weight.toFixed(2)}%
                            </span>
                            <span>{section.maxWeight}%</span>
                          </div>
                          <input
                            type="range"
                            min={section.minWeight}
                            max={section.maxWeight}
                            step={0.1}
                            value={section.weight}
                            onChange={(e) => setSectionWeight(section.id, parseFloat(e.target.value))}
                            className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer
                              [&::-webkit-slider-thumb]:appearance-none
                              [&::-webkit-slider-thumb]:w-6
                              [&::-webkit-slider-thumb]:h-6
                              [&::-webkit-slider-thumb]:rounded-full
                              [&::-webkit-slider-thumb]:bg-quantum-cyan
                              [&::-webkit-slider-thumb]:cursor-pointer
                              [&::-webkit-slider-thumb]:shadow-lg
                              [&::-webkit-slider-thumb]:shadow-quantum-cyan/30
                              [&::-moz-range-thumb]:w-6
                              [&::-moz-range-thumb]:h-6
                              [&::-moz-range-thumb]:rounded-full
                              [&::-moz-range-thumb]:bg-quantum-cyan
                              [&::-moz-range-thumb]:cursor-pointer
                              [&::-moz-range-thumb]:border-none"
                          />
                        </div>

                        {/* Quick Preset Buttons */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Quick Set:</span>
                          {[section.minWeight, defaultWeight, section.maxWeight / 2, section.maxWeight].filter((v, i, a) => a.indexOf(v) === i && v >= section.minWeight && v <= section.maxWeight).map(preset => (
                            <button
                              key={preset}
                              onClick={() => setSectionWeight(section.id, preset)}
                              className={`px-3 py-1 text-xs rounded-lg transition-all ${
                                Math.abs(section.weight - preset) < 0.1
                                  ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/30'
                                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
                              }`}
                            >
                              {preset.toFixed(1)}%
                            </button>
                          ))}
                          <button
                            onClick={() => setSectionWeight(section.id, defaultWeight)}
                            className="px-3 py-1 text-xs bg-quantum-purple/20 text-quantum-purple rounded-lg hover:bg-quantum-purple/30 transition-all ml-auto"
                          >
                            Reset to Default ({defaultWeight.toFixed(2)}%)
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Collapsed Progress Bar */}
                {!isExpanded && (
                  <div className="px-3 pb-3">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getWeightColor(section.weight, section.maxWeight)}`}
                        style={{ width: `${(section.weight / section.maxWeight) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================
          WEIGHT DISTRIBUTION SUMMARY
      ============================================================ */}
      <div className={compact ? "glass-card p-4 border border-white/10 rounded-xl" : "glass-card p-6 border border-white/10 rounded-2xl"}>
        <h3 className={compact ? "text-lg font-bold text-white mb-4" : "text-xl font-bold text-white mb-6"}>
          Weight Distribution Summary
        </h3>

        {/* Visual Weight Distribution */}
        <div className="h-8 rounded-full overflow-hidden flex bg-white/10 mb-4">
          {sortedSections
            .filter(s => s.weight > 0)
            .map((section, idx) => {
              const colors = [
                'bg-quantum-cyan', 'bg-quantum-purple', 'bg-quantum-green',
                'bg-quantum-blue', 'bg-quantum-orange', 'bg-quantum-pink',
                'bg-cyan-400', 'bg-purple-400', 'bg-green-400'
              ];
              return (
                <div
                  key={section.id}
                  className={`h-full ${colors[idx % colors.length]} relative group cursor-pointer transition-all hover:brightness-125`}
                  style={{ width: `${section.weight}%` }}
                  title={`${section.name}: ${section.weight.toFixed(2)}%`}
                >
                  {section.weight > 5 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/90">
                      {section.id}
                    </span>
                  )}
                </div>
              );
            })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
          {sortedSections
            .filter(s => s.weight > 0)
            .map((section, idx) => {
              const colors = [
                'bg-quantum-cyan', 'bg-quantum-purple', 'bg-quantum-green',
                'bg-quantum-blue', 'bg-quantum-orange', 'bg-quantum-pink',
                'bg-cyan-400', 'bg-purple-400', 'bg-green-400'
              ];
              return (
                <div key={section.id} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${colors[idx % colors.length]}`} />
                  <span className="text-gray-300 truncate">
                    {section.id}: {section.weight.toFixed(1)}%
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default WeightAdjuster;
