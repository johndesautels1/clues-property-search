/**
 * CLUES Property Dashboard - Compare Properties Page
 */

import { motion } from 'framer-motion';
import { Plus, X, Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function Compare() {
  return (
    <motion.div
      className="px-4 py-6 md:px-8 md:py-10 max-w-7xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="mb-8">
        <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-gradient-quantum mb-2">
          Compare Properties
        </h1>
        <p className="text-gray-400">
          Side-by-side 138-field comparison
        </p>
      </div>

      {/* Property Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((slot) => (
          <div
            key={slot}
            className="glass-card p-6 border-2 border-dashed border-white/10 hover:border-quantum-cyan/30 transition-colors cursor-pointer"
          >
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Plus className="w-8 h-8 text-gray-500 mb-2" />
              <p className="text-gray-400 text-sm">Add Property {slot}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Table Preview */}
      <div className="glass-5d p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-6">
          <Scale className="w-5 h-5 text-quantum-cyan" />
          <h2 className="font-semibold text-white">Comparison Matrix</h2>
        </div>

        <div className="text-center text-gray-500 py-12">
          Select 2-3 properties to compare all 138 fields
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 text-sm text-gray-400 border-t border-white/10 pt-4 mt-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-quantum-green" />
            <span>Better</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="w-4 h-4 text-gray-500" />
            <span>Equal</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-quantum-red" />
            <span>Worse</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
