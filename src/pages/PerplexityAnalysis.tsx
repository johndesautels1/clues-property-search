/**
 * Perplexity Analysis Page
 * 48 Glassmorphic 5D Charts organized into 16 Categories (A-P)
 *
 * Features:
 * - Executive Overview with 12 KPI cards
 * - 16 collapsible category sections
 * - Lazy-loaded charts on scroll
 * - Cross-filtering on property click
 * - Web augmentation badges
 */

import { useState, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePropertyStore } from '@/store/propertyStore';
import ExecutiveOverview from '@/components/perplexity/ExecutiveOverview';
import CategorySection from '@/components/perplexity/CategorySection';
import PropertyTabs from '@/components/perplexity/PropertyTabs';
import {
  MapPin, DollarSign, Home, Building2, Wrench,
  Sofa, Trees, Hammer, GraduationCap, Navigation,
  Car, Shield, TrendingUp, Zap, CloudRain, Sparkles,
  ChevronDown, Filter, RefreshCw
} from 'lucide-react';

// Lazy load all category components
const CategoryA = lazy(() => import('@/components/perplexity/categories/CategoryA'));
const CategoryB = lazy(() => import('@/components/perplexity/categories/CategoryB'));
const CategoryC = lazy(() => import('@/components/perplexity/categories/CategoryC'));
const CategoryD = lazy(() => import('@/components/perplexity/categories/CategoryD'));
const CategoryE = lazy(() => import('@/components/perplexity/categories/CategoryE'));
const CategoryF = lazy(() => import('@/components/perplexity/categories/CategoryF'));
const CategoryG = lazy(() => import('@/components/perplexity/categories/CategoryG'));
const CategoryH = lazy(() => import('@/components/perplexity/categories/CategoryH'));
const CategoryI = lazy(() => import('@/components/perplexity/categories/CategoryI'));
const CategoryJ = lazy(() => import('@/components/perplexity/categories/CategoryJ'));
const CategoryK = lazy(() => import('@/components/perplexity/categories/CategoryK'));
const CategoryL = lazy(() => import('@/components/perplexity/categories/CategoryL'));
const CategoryM = lazy(() => import('@/components/perplexity/categories/CategoryM'));
const CategoryN = lazy(() => import('@/components/perplexity/categories/CategoryN'));
const CategoryO = lazy(() => import('@/components/perplexity/categories/CategoryO'));
const CategoryP = lazy(() => import('@/components/perplexity/categories/CategoryP'));

// Category definitions with metadata
const categories = [
  { id: 'A', title: 'Address & Identity', icon: MapPin, color: '#00D9FF', fields: 7 },
  { id: 'B', title: 'Pricing & Value', icon: DollarSign, color: '#10B981', fields: 5 },
  { id: 'C', title: 'Property Basics', icon: Home, color: '#8B5CF6', fields: 6 },
  { id: 'D', title: 'HOA & Taxes', icon: Building2, color: '#F59E0B', fields: 7 },
  { id: 'E', title: 'Structure & Systems', icon: Wrench, color: '#EF4444', fields: 15 },
  { id: 'F', title: 'Interior Features', icon: Sofa, color: '#EC4899', fields: 11 },
  { id: 'G', title: 'Exterior Features', icon: Trees, color: '#06B6D4', fields: 9 },
  { id: 'H', title: 'Permits & Renovations', icon: Hammer, color: '#84CC16', fields: 4 },
  { id: 'I', title: 'Assigned Schools', icon: GraduationCap, color: '#A855F7', fields: 9 },
  { id: 'J', title: 'Location Scores', icon: Navigation, color: '#00D9FF', fields: 9 },
  { id: 'K', title: 'Distances & Amenities', icon: Car, color: '#10B981', fields: 5 },
  { id: 'L', title: 'Safety & Crime', icon: Shield, color: '#EF4444', fields: 3 },
  { id: 'M', title: 'Market & Investment', icon: TrendingUp, color: '#F59E0B', fields: 13 },
  { id: 'N', title: 'Utilities & Connectivity', icon: Zap, color: '#8B5CF6', fields: 13 },
  { id: 'O', title: 'Environment & Risk', icon: CloudRain, color: '#06B6D4', fields: 14 },
  { id: 'P', title: 'Additional Features', icon: Sparkles, color: '#EC4899', fields: 8 },
];

// Loading spinner for lazy-loaded categories
function CategoryLoader() {
  return (
    <div className="col-span-3 flex items-center justify-center py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full"
      />
    </div>
  );
}

// Get category component by ID
function getCategoryComponent(id: string) {
  switch (id) {
    case 'A': return CategoryA;
    case 'B': return CategoryB;
    case 'C': return CategoryC;
    case 'D': return CategoryD;
    case 'E': return CategoryE;
    case 'F': return CategoryF;
    case 'G': return CategoryG;
    case 'H': return CategoryH;
    case 'I': return CategoryI;
    case 'J': return CategoryJ;
    case 'K': return CategoryK;
    case 'L': return CategoryL;
    case 'M': return CategoryM;
    case 'N': return CategoryN;
    case 'O': return CategoryO;
    case 'P': return CategoryP;
    default: return null;
  }
}

export default function PerplexityAnalysis() {
  const { fullProperties } = usePropertyStore();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedPropertyTabIndex, setSelectedPropertyTabIndex] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map(c => c.id)) // All expanded by default
  );
  const [showFilters, setShowFilters] = useState(false);

  // Convert Map to array for chart components
  const properties = Array.from(fullProperties.values());

  // Handle property click for cross-filtering
  const handlePropertyClick = useCallback((id: string) => {
    setSelectedPropertyId(prev => prev === id ? null : id);
  }, []);

  // Toggle category expansion
  const toggleCategory = useCallback((id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Expand/collapse all
  const expandAll = useCallback(() => {
    setExpandedCategories(new Set(categories.map(c => c.id)));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedCategories(new Set());
  }, []);

  // Filter properties if one is selected
  const displayProperties = selectedPropertyId
    ? properties.filter(p => p.id === selectedPropertyId)
    : properties;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 px-4 py-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] mb-1">
                Analytics Dashboard
              </h1>
              <p className="text-gray-400 text-sm">
                48 Charts • 16 Categories • {properties.length} Properties
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Filter className="w-5 h-5" />
              </motion.button>

              {/* Expand/Collapse controls */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={expandAll}
                className="px-3 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white text-xs transition-colors"
              >
                Expand All
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={collapseAll}
                className="px-3 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white text-xs transition-colors"
              >
                Collapse All
              </motion.button>
            </div>
          </div>

          {/* Selected property indicator */}
          <AnimatePresence>
            {selectedPropertyId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mb-4"
              >
                <Filter className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 text-sm">
                  Filtering by property: {selectedPropertyId.slice(0, 8)}...
                </span>
                <button
                  onClick={() => setSelectedPropertyId(null)}
                  className="ml-auto text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  Clear filter
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Executive Overview - 12 KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <ExecutiveOverview properties={displayProperties} />
        </motion.div>

        {/* Property Tabs - P1/P2/P3 comparison selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <PropertyTabs
            properties={properties}
            selectedIndex={selectedPropertyTabIndex}
            onSelectProperty={setSelectedPropertyTabIndex}
          />
        </motion.div>

        {/* Category Sections */}
        <div className="space-y-4">
          {categories.map((category, index) => {
            const CategoryComponent = getCategoryComponent(category.id);
            const isExpanded = expandedCategories.has(category.id);
            const Icon = category.icon;

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.03 }}
              >
                <CategorySection
                  id={category.id}
                  title={category.title}
                  icon={<Icon className="w-5 h-5" style={{ color: category.color }} />}
                  color={category.color}
                  fieldCount={category.fields}
                  isExpanded={isExpanded}
                  onToggle={() => toggleCategory(category.id)}
                >
                  <Suspense fallback={<CategoryLoader />}>
                    {CategoryComponent && (
                      <CategoryComponent
                        properties={displayProperties}
                        onPropertyClick={handlePropertyClick}
                      />
                    )}
                  </Suspense>
                </CategorySection>
              </motion.div>
            );
          })}
        </div>

        {/* Footer stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 pt-6 border-t border-white/10 text-center"
        >
          <p className="text-gray-500 text-sm">
            Powered by CLUES Quantum Analysis Engine
          </p>
          <p className="text-gray-600 text-xs mt-1">
            {categories.length} Categories • {categories.length * 3} Charts • ~140 Data Fields
          </p>
        </motion.div>
      </div>
    </div>
  );
}
