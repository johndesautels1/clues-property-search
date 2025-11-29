/**
 * Glass Chart Wrapper
 * Glassmorphic container for all chart types
 * Per ANALYTICS_DASHBOARD_SPEC.md 5D design
 */

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Info } from 'lucide-react';

interface GlassChartProps {
  title: string;
  description?: string;
  chartId: string;
  color?: string;
  height?: string;
  children: ReactNode;
  webAugmented?: boolean;
  webSource?: string;
}

export default function GlassChart({
  title,
  description,
  chartId,
  color = '#00D9FF',
  height = 'h-64',
  children,
  webAugmented = false,
  webSource,
}: GlassChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.3 }}
      className="relative group"
    >
      {/* Glassmorphic card */}
      <div
        className="p-4 rounded-2xl h-full"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="text-white font-bold text-sm drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {title}
            </h4>
            {description && (
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            )}
          </div>

          {/* Web augmentation badge */}
          {webAugmented && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
              style={{ backgroundColor: `${color}20`, color }}
              title={webSource || 'Web augmented data'}
            >
              <Info className="w-3 h-3" />
              <span>web</span>
            </div>
          )}
        </div>

        {/* Chart content */}
        <div className={`${height} relative`}>{children}</div>

        {/* Chart ID for cross-filtering */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-600 font-mono">
          {chartId}
        </div>
      </div>

      {/* Hover glow effect */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          boxShadow: `0 0 40px ${color}20`,
        }}
      />
    </motion.div>
  );
}
