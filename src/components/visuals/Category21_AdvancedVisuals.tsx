/**
 * Category 21: Advanced Visuals (DeepSeek Charts)
 * 5 sophisticated D3.js visualizations for property comparison
 *
 * Charts:
 * 1. Market Radar - Multi-dimensional property comparison
 * 2. Value Momentum - Price progression visualization
 * 3. Price Topography - Value density contour mapping
 * 4. Time Series - Historical price timeline
 * 5. Comparative Analysis Matrix - Side-by-side property comparison
 */

import { motion } from 'framer-motion';
import { ChartProperty } from '@/lib/visualsDataMapper';
import MarketRadarChart from './deepseek/MarketRadarChart';
import ValueMomentumChart from './deepseek/ValueMomentumChart';
import PriceTopographyChart from './deepseek/PriceTopographyChart';
import TimeSeriesChart from './deepseek/TimeSeriesChart';
import ComparativeAnalysisMatrix from './deepseek/ComparativeAnalysisMatrix';

interface Category21Props {
  properties: ChartProperty[];
}

export default function Category21_AdvancedVisuals({ properties }: Category21Props) {
  return (
    <div className="space-y-8">
      {/* Header Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30"
      >
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
        <span className="text-sm font-medium text-cyan-300">DeepSeek Advanced Visualizations</span>
      </motion.div>

      {/* Chart 1: Market Radar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1">Multi-Dimensional Market Position</h3>
          <p className="text-sm text-gray-400">Radar chart comparing properties across 6 key metrics</p>
        </div>
        <div className="flex justify-center">
          <MarketRadarChart properties={properties} />
        </div>
      </motion.div>

      {/* Chart 2: Value Momentum */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1">Value Momentum & Trends</h3>
          <p className="text-sm text-gray-400">Price progression from last sale to current listing</p>
        </div>
        <div className="flex justify-center">
          <ValueMomentumChart properties={properties} />
        </div>
      </motion.div>

      {/* Chart 3: Price Topography */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1">Value Density Topography</h3>
          <p className="text-sm text-gray-400">Contour visualization of property value distributions</p>
        </div>
        <div className="flex justify-center">
          <PriceTopographyChart properties={properties} />
        </div>
      </motion.div>

      {/* Chart 4: Time Series */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1">Price Evolution Timeline</h3>
          <p className="text-sm text-gray-400">Historical price changes over time</p>
        </div>
        <div className="flex justify-center">
          <TimeSeriesChart properties={properties} />
        </div>
      </motion.div>

      {/* Chart 5: Comparative Analysis Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1">Comparative Analysis Matrix</h3>
          <p className="text-sm text-gray-400">Side-by-side property comparison grid with percentage differences</p>
        </div>
        <div className="flex justify-center">
          <ComparativeAnalysisMatrix properties={properties} />
        </div>
      </motion.div>

      {/* Info Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20"
      >
        <p className="text-sm text-purple-200">
          <span className="font-semibold">Note:</span> These advanced visualizations use D3.js for sophisticated
          data representations. They provide alternative perspectives to the standard Recharts visualizations
          above for side-by-side comparison.
        </p>
      </motion.div>
    </div>
  );
}
