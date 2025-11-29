/**
 * Category Section Wrapper
 * Lazy-loaded container for each A-P category
 * Glassmorphic styling per ANALYTICS_DASHBOARD_SPEC.md
 */

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ReactNode } from 'react';

export interface CategorySectionProps {
  id: string;
  title: string;
  fieldCount: number;
  icon: ReactNode;
  color: string;
  children: ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function CategorySection({
  id,
  title,
  fieldCount,
  icon,
  color,
  children,
  isExpanded = true,
  onToggle,
}: CategorySectionProps) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.section
      ref={ref}
      id={`category-${id}`}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      {/* Category Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 rounded-2xl mb-4 transition-all"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${color}30`,
        }}
      >
        <div className="flex items-center gap-4">
          {/* Category Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <span style={{ color }}>{icon}</span>
          </div>

          {/* Title and subtitle */}
          <div className="text-left">
            <h3 className="font-orbitron font-bold text-lg text-white flex items-center gap-2">
              <span
                className="text-sm font-mono px-2 py-0.5 rounded"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {id}
              </span>
              {title}
            </h3>
            <p className="text-sm text-gray-400">
              <span style={{ color }}>{fieldCount} fields</span>
            </p>
          </div>
        </div>

        {/* Expand/collapse indicator */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" style={{ color }} />
          ) : (
            <ChevronDown className="w-5 h-5" style={{ color }} />
          )}
        </div>
      </button>

      {/* Charts container - lazy loaded */}
      {isExpanded && inView && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          {children}
        </motion.div>
      )}
    </motion.section>
  );
}
