/**
 * Executive Overview - 12 KPI Cards
 * Glassmorphic design with neon pulses
 * Per ANALYTICS_DASHBOARD_SPEC.md
 */

import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Shield,
  Building2,
  BarChart3,
  LineChart,
  MapPin,
  AlertTriangle,
  Target,
  Database,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import type { Property } from '@/types/property';

interface ExecutiveOverviewProps {
  properties: Property[];
}

interface KPICard {
  id: string;
  label: string;
  value: string | number;
  subtext?: string;
  icon: typeof DollarSign;
  color: string;
  pulse?: boolean;
}

// Helper to safely get numeric value from DataField
function getFieldValue<T>(field: { value: T | null } | undefined | null): T | null {
  if (!field) return null;
  return field.value;
}

// Calculate KPIs from properties
function calculateKPIs(properties: Property[]): KPICard[] {
  if (properties.length === 0) {
    return getDefaultKPIs();
  }

  // Calculate Portfolio Value
  let totalValue = 0;
  let priceCount = 0;
  properties.forEach(p => {
    const price = getFieldValue(p.address?.listingPrice) || getFieldValue(p.details?.marketValueEstimate);
    if (price) {
      totalValue += price;
      priceCount++;
    }
  });

  // Calculate Avg Cap Rate
  let totalCapRate = 0;
  let capCount = 0;
  properties.forEach(p => {
    const cap = getFieldValue(p.financial?.capRateEst);
    if (cap) {
      totalCapRate += cap;
      capCount++;
    }
  });
  const avgCapRate = capCount > 0 ? (totalCapRate / capCount).toFixed(1) : '—';

  // Calculate Safety Avg
  let safetyTotal = 0;
  let safetyCount = 0;
  properties.forEach(p => {
    const rating = getFieldValue(p.location?.neighborhoodSafetyRating);
    if (rating) {
      const score = rating === 'EXCELLENT' ? 95 : rating === 'GOOD' ? 80 : rating === 'FAIR' ? 60 : 40;
      safetyTotal += score;
      safetyCount++;
    }
  });
  const avgSafety = safetyCount > 0 ? Math.round(safetyTotal / safetyCount) : 75;

  // Calculate Avg Price/Sqft
  let totalPricePerSqft = 0;
  let ppsCount = 0;
  properties.forEach(p => {
    const pps = getFieldValue(p.address?.pricePerSqft);
    if (pps) {
      totalPricePerSqft += pps;
      ppsCount++;
    }
  });
  const avgPricePerSqft = ppsCount > 0 ? Math.round(totalPricePerSqft / ppsCount) : 0;

  // Calculate Avg Walk Score
  let totalWalkScore = 0;
  let walkCount = 0;
  properties.forEach(p => {
    const walk = getFieldValue(p.location?.walkScore);
    if (walk) {
      totalWalkScore += walk;
      walkCount++;
    }
  });
  const avgWalkScore = walkCount > 0 ? Math.round(totalWalkScore / walkCount) : 0;

  // Calculate Properties at Risk (flood/hurricane)
  let atRisk = 0;
  properties.forEach(p => {
    const floodRisk = getFieldValue(p.utilities?.floodRiskLevel);
    const hurricaneRisk = getFieldValue(p.utilities?.hurricaneRisk);
    if (floodRisk === 'HIGH' || hurricaneRisk === 'HIGH') {
      atRisk++;
    }
  });

  // Calculate Data Completeness
  let totalCompleteness = 0;
  properties.forEach(p => {
    totalCompleteness += p.dataCompleteness || 0;
  });
  const avgCompleteness = properties.length > 0 ? Math.round(totalCompleteness / properties.length) : 0;

  // Calculate fields with web augmentation
  let webAugmented = 0;
  properties.forEach(p => {
    // Count fields that have sources from web APIs
    if (getFieldValue(p.location?.walkScore)) webAugmented++;
    if (getFieldValue(p.financial?.redfinEstimate)) webAugmented++;
    if (getFieldValue(p.utilities?.floodZone)) webAugmented++;
  });

  return [
    {
      id: 'portfolio-value',
      label: 'Portfolio Value',
      value: totalValue > 0 ? `$${(totalValue / 1000000).toFixed(1)}M` : '$0',
      subtext: `${priceCount} properties`,
      icon: DollarSign,
      color: '#10B981',
      pulse: true,
    },
    {
      id: 'avg-cap-rate',
      label: 'Avg Cap Rate',
      value: `${avgCapRate}%`,
      subtext: 'annualized',
      icon: TrendingUp,
      color: '#00D9FF',
    },
    {
      id: 'safety-avg',
      label: 'Safety Avg',
      value: avgSafety,
      subtext: '/100',
      icon: Shield,
      color: '#8B5CF6',
    },
    {
      id: 'total-properties',
      label: 'Total Properties',
      value: properties.length,
      subtext: 'in portfolio',
      icon: Building2,
      color: '#F59E0B',
    },
    {
      id: 'avg-price-sqft',
      label: 'Avg Price/Sqft',
      value: avgPricePerSqft > 0 ? `$${avgPricePerSqft}` : '—',
      subtext: 'portfolio avg',
      icon: BarChart3,
      color: '#EF4444',
    },
    {
      id: 'avg-appreciation',
      label: 'Avg Appreciation',
      value: '—', // Field not yet in schema - will show when marketAnalysis data available
      subtext: '5yr projected',
      icon: LineChart,
      color: '#10B981',
    },
    {
      id: 'avg-walk-score',
      label: 'Avg Walk Score',
      value: avgWalkScore > 0 ? avgWalkScore : '—',
      subtext: '/100',
      icon: MapPin,
      color: '#00D9FF',
    },
    {
      id: 'at-risk',
      label: 'Properties at Risk',
      value: atRisk,
      subtext: 'flood/hurricane',
      icon: AlertTriangle,
      color: atRisk > 0 ? '#EF4444' : '#10B981',
    },
    {
      id: 'avg-roi',
      label: 'Avg ROI Projection',
      value: '—', // Field not yet in schema - will show when marketAnalysis data available
      subtext: '10yr horizon',
      icon: Target,
      color: '#8B5CF6',
    },
    {
      id: 'data-completeness',
      label: 'Data Completeness',
      value: `${avgCompleteness}%`,
      subtext: 'avg across fields',
      icon: Database,
      color: '#F59E0B',
    },
    {
      id: 'web-augmented',
      label: 'Web Augmented',
      value: webAugmented,
      subtext: 'fields enriched',
      icon: Globe,
      color: '#00D9FF',
    },
    {
      id: 'confidence',
      label: 'Confidence Score',
      value: (() => {
        // Use dataCompleteness or aiConfidence from Property root
        let totalConfidence = 0;
        let count = 0;
        properties.forEach(p => {
          const aiConf = p.aiConfidence;
          const completeness = p.dataCompleteness;
          if (aiConf && aiConf > 0) {
            totalConfidence += aiConf;
            count++;
          } else if (completeness && completeness > 0) {
            totalConfidence += completeness;
            count++;
          }
        });
        return count > 0 ? `${(totalConfidence / count).toFixed(1)}%` : '—';
      })(),
      subtext: 'data quality',
      icon: CheckCircle2,
      color: '#10B981',
      pulse: true,
    },
  ];
}

function getDefaultKPIs(): KPICard[] {
  return [
    { id: 'portfolio-value', label: 'Portfolio Value', value: '$0', icon: DollarSign, color: '#10B981', pulse: true },
    { id: 'avg-cap-rate', label: 'Avg Cap Rate', value: '—', icon: TrendingUp, color: '#00D9FF' },
    { id: 'safety-avg', label: 'Safety Avg', value: '—', icon: Shield, color: '#8B5CF6' },
    { id: 'total-properties', label: 'Total Properties', value: 0, icon: Building2, color: '#F59E0B' },
    { id: 'avg-price-sqft', label: 'Avg Price/Sqft', value: '—', icon: BarChart3, color: '#EF4444' },
    { id: 'avg-appreciation', label: 'Avg Appreciation', value: '—', icon: LineChart, color: '#10B981' },
    { id: 'avg-walk-score', label: 'Avg Walk Score', value: '—', icon: MapPin, color: '#00D9FF' },
    { id: 'at-risk', label: 'Properties at Risk', value: 0, icon: AlertTriangle, color: '#10B981' },
    { id: 'avg-roi', label: 'Avg ROI Projection', value: '—', icon: Target, color: '#8B5CF6' },
    { id: 'data-completeness', label: 'Data Completeness', value: '—', icon: Database, color: '#F59E0B' },
    { id: 'web-augmented', label: 'Web Augmented', value: 0, icon: Globe, color: '#00D9FF' },
    { id: 'confidence', label: 'Confidence Score', value: '—', icon: CheckCircle2, color: '#10B981', pulse: true },
  ];
}

export default function ExecutiveOverview({ properties }: ExecutiveOverviewProps) {
  const kpis = calculateKPIs(properties);

  return (
    <section className="mb-8">
      <h2 className="text-xl font-orbitron font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-quantum-cyan animate-pulse" />
        Executive Overview
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;

          return (
            <motion.div
              key={kpi.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative group"
            >
              {/* Glassmorphic card */}
              <div
                className="p-4 rounded-2xl h-full"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: kpi.pulse
                    ? `0 0 20px ${kpi.color}40, 0 8px 32px rgba(31, 38, 135, 0.37)`
                    : '0 8px 32px rgba(31, 38, 135, 0.37)',
                }}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${kpi.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>

                {/* Value */}
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: kpi.color }}
                  >
                    {kpi.value}
                  </span>
                  {kpi.subtext && (
                    <span className="text-xs text-gray-300 font-medium drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">{kpi.subtext}</span>
                  )}
                </div>

                {/* Label */}
                <p className="text-sm text-gray-400 mt-1">{kpi.label}</p>

                {/* Pulse effect for highlighted cards */}
                {kpi.pulse && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      border: `1px solid ${kpi.color}`,
                      opacity: 0,
                    }}
                    animate={{
                      opacity: [0, 0.5, 0],
                      scale: [1, 1.02, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
              </div>

              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  boxShadow: `0 0 30px ${kpi.color}30`,
                }}
              />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
