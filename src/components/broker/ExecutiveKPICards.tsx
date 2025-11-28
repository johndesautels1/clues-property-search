/**
 * Executive Overview KPI Cards
 *
 * Glassmorphic KPI tiles for broker dashboard top strip
 * Shows portfolio value, performance metrics, and risk summary
 */

import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  Shield,
  AlertTriangle,
  Home,
  BarChart3,
} from 'lucide-react';

interface KPIs {
  portfolioValue: {
    listPrice: number;
    marketEstimate: number;
    redfinEstimate: number;
    assessedValue: number;
  };
  performance: {
    appreciation5yr: number;
    capRate: number;
    rentalYield: number;
    pricePerSqft: number;
    daysOnMarket: number;
  };
  risk: {
    safetyScore: number;
    floodRisk: Record<string, number>;
    hurricaneRisk: Record<string, number>;
    [key: string]: any;
  };
  lifestyle: {
    walkScore: number;
    transitScore: number;
    bikeScore: number;
  };
  inventory: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    priceBands: {
      under2M: number;
      '2to3M': number;
      '3to4M': number;
      over4M: number;
    };
  };
  count: number;
}

interface ExecutiveKPICardsProps {
  kpis: KPIs;
}

// Format currency
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

// Format percentage
function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Glassmorphic card component
function GlassCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  delay = 0,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Gradient accent */}
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{
          background: `linear-gradient(90deg, ${color}, transparent)`,
        }}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-white text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className="p-3 rounded-xl"
          style={{
            background: `${color}20`,
          }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}

// Mini stat for secondary metrics
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-white text-sm font-semibold">{value}</p>
    </div>
  );
}

export default function ExecutiveKPICards({ kpis }: ExecutiveKPICardsProps) {
  const { portfolioValue, performance, risk, lifestyle, inventory } = kpis;

  // Calculate average risk score
  const avgRisk = (
    (Object.keys(risk.floodRisk).reduce((sum, k) => sum + Number(k) * risk.floodRisk[k], 0) / Math.max(1, Object.values(risk.floodRisk).reduce((a, b) => a + b, 0))) +
    (Object.keys(risk.hurricaneRisk).reduce((sum, k) => sum + Number(k) * risk.hurricaneRisk[k], 0) / Math.max(1, Object.values(risk.hurricaneRisk).reduce((a, b) => a + b, 0)))
  ) / 2;

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-white">Executive Overview</h2>
        <span className="text-gray-500 text-sm">({inventory.total} properties)</span>
      </div>

      {/* Portfolio Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard
          title="Total List Price"
          value={formatCurrency(portfolioValue.listPrice)}
          subtitle="Portfolio asking price"
          icon={DollarSign}
          color="#00D9FF"
          delay={0}
        />
        <GlassCard
          title="Market Estimate"
          value={formatCurrency(portfolioValue.marketEstimate)}
          subtitle="Combined market value"
          icon={TrendingUp}
          color="#10B981"
          delay={0.1}
        />
        <GlassCard
          title="Redfin Estimate"
          value={formatCurrency(portfolioValue.redfinEstimate)}
          subtitle="Redfin valuation"
          icon={Home}
          color="#8B5CF6"
          delay={0.2}
        />
        <GlassCard
          title="Assessed Value"
          value={formatCurrency(portfolioValue.assessedValue)}
          subtitle="Tax assessment total"
          icon={DollarSign}
          color="#F59E0B"
          delay={0.3}
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <GlassCard
          title="Avg Appreciation"
          value={formatPercent(performance.appreciation5yr)}
          subtitle="5-year average"
          icon={TrendingUp}
          color="#10B981"
          delay={0.4}
        />
        <GlassCard
          title="Avg Cap Rate"
          value={formatPercent(performance.capRate)}
          subtitle="Return on investment"
          icon={Percent}
          color="#00D9FF"
          delay={0.5}
        />
        <GlassCard
          title="Avg Rental Yield"
          value={formatPercent(performance.rentalYield)}
          subtitle="Annual rental return"
          icon={Percent}
          color="#8B5CF6"
          delay={0.6}
        />
        <GlassCard
          title="Avg $/Sqft"
          value={`$${performance.pricePerSqft.toFixed(0)}`}
          subtitle="Price per square foot"
          icon={Home}
          color="#F59E0B"
          delay={0.7}
        />
        <GlassCard
          title="Avg Days on Market"
          value={`${performance.daysOnMarket.toFixed(0)}`}
          subtitle="Market velocity"
          icon={Clock}
          color="#EF4444"
          delay={0.8}
        />
      </div>

      {/* Risk & Lifestyle Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risk Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-transparent" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Risk Profile</p>
              <p className="text-gray-500 text-xs">Average safety: {risk.safetyScore.toFixed(0)}/100</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <MiniStat label="Flood" value={`${avgRisk.toFixed(1)}/10`} />
            <MiniStat label="Hurricane" value={`${avgRisk.toFixed(1)}/10`} />
            <MiniStat label="Sea Level" value={`${avgRisk.toFixed(1)}/10`} />
            <MiniStat label="Overall" value={risk.safetyScore >= 80 ? 'LOW' : risk.safetyScore >= 60 ? 'MOD' : 'HIGH'} />
          </div>
        </motion.div>

        {/* Lifestyle Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-transparent" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-green-500/20">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Lifestyle Scores</p>
              <p className="text-gray-500 text-xs">Average accessibility metrics</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <MiniStat label="Walk Score" value={`${lifestyle.walkScore.toFixed(0)}`} />
            <MiniStat label="Transit" value={`${lifestyle.transitScore.toFixed(0)}`} />
            <MiniStat label="Bike" value={`${lifestyle.bikeScore.toFixed(0)}`} />
          </div>
        </motion.div>
      </div>

      {/* Inventory Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.1 }}
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-transparent" />
        <p className="text-white font-semibold mb-4">Inventory by Price Band</p>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-xl bg-white/5">
            <p className="text-2xl font-bold text-cyan-400">{inventory.priceBands.under2M}</p>
            <p className="text-gray-500 text-xs">Under $2M</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/5">
            <p className="text-2xl font-bold text-green-400">{inventory.priceBands['2to3M']}</p>
            <p className="text-gray-500 text-xs">$2M - $3M</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/5">
            <p className="text-2xl font-bold text-purple-400">{inventory.priceBands['3to4M']}</p>
            <p className="text-gray-500 text-xs">$3M - $4M</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/5">
            <p className="text-2xl font-bold text-amber-400">{inventory.priceBands.over4M}</p>
            <p className="text-gray-500 text-xs">Over $4M</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
