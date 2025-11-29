/**
 * Investment Score Radar
 *
 * 6-axis radar chart showing:
 * Financial Health, Location Value, Property Condition,
 * Risk Profile, Market Position, Growth Potential
 */

import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { Target, TrendingUp } from 'lucide-react';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface InvestmentScore {
  financialHealth: number;
  locationValue: number;
  propertyCondition: number;
  riskProfile: number;
  marketPosition: number;
  growthPotential: number;
}

interface Property {
  id: string | number;
  address: string;
  investmentScore?: InvestmentScore;
  [key: string]: any;
}

interface InvestmentScoreRadarProps {
  properties: Property[];
  selectedId?: string | number | 'all';
}

function shortAddress(address: string): string {
  return address.split(',')[0] || address;
}

const COLORS = [
  { bg: 'rgba(0, 217, 255, 0.2)', border: '#00D9FF' },
  { bg: 'rgba(16, 185, 129, 0.2)', border: '#10B981' },
  { bg: 'rgba(139, 92, 246, 0.2)', border: '#8B5CF6' },
  { bg: 'rgba(245, 158, 11, 0.2)', border: '#F59E0B' },
  { bg: 'rgba(239, 68, 68, 0.2)', border: '#EF4444' },
];

// Generate default scores if not provided
function getInvestmentScore(p: Property): InvestmentScore {
  if (p.investmentScore) return p.investmentScore;

  // Generate reasonable defaults based on other property data
  return {
    financialHealth: Math.min(100, Math.max(0, (p.capRate || 4) * 20)),
    locationValue: p.walkScore || 70,
    propertyCondition: p.condition?.overall || 80,
    riskProfile: Math.max(0, 100 - ((p.floodRisk || 5) + (p.hurricaneRisk || 5)) * 5),
    marketPosition: Math.min(100, (p.daysOnMarket || 30) < 30 ? 90 : 70),
    growthPotential: Math.min(100, (p.appreciation5yr || 5) * 15),
  };
}

export default function InvestmentScoreRadar({ properties, selectedId = 'all' }: InvestmentScoreRadarProps) {
  const displayProperties = selectedId === 'all'
    ? properties
    : properties.filter(p => p.id === selectedId);

  if (displayProperties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No investment data available</p>
      </div>
    );
  }

  const labels = [
    'Financial Health',
    'Location Value',
    'Property Condition',
    'Risk Profile',
    'Market Position',
    'Growth Potential',
  ];

  const datasets = displayProperties.map((p, i) => {
    const score = getInvestmentScore(p);
    const color = COLORS[i % COLORS.length];

    return {
      label: shortAddress(p.address),
      data: [
        score.financialHealth,
        score.locationValue,
        score.propertyCondition,
        score.riskProfile,
        score.marketPosition,
        score.growthPotential,
      ],
      backgroundColor: color.bg,
      borderColor: color.border,
      borderWidth: 2,
      pointBackgroundColor: color.border,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: color.border,
    };
  });

  const data = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.15)' },
        grid: { color: 'rgba(255, 255, 255, 0.15)' },
        pointLabels: {
          color: '#FFFFFF',
          font: { size: 12, weight: 'bold' as const }
        },
        ticks: {
          color: '#FBBF24', // Bright yellow for scale numbers
          backdropColor: 'rgba(0, 0, 0, 0.5)',
          font: { size: 11, weight: 'bold' as const },
          stepSize: 20,
          showLabelBackdrop: true,
        },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    plugins: {
      legend: {
        display: displayProperties.length > 1,
        labels: { color: '#9CA3AF', usePointStyle: true },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.raw}/100`,
        },
      },
    },
  };

  // Calculate overall scores
  const overallScores = displayProperties.map(p => {
    const score = getInvestmentScore(p);
    return {
      address: shortAddress(p.address),
      overall: Math.round(
        (score.financialHealth + score.locationValue + score.propertyCondition +
         score.riskProfile + score.marketPosition + score.growthPotential) / 6
      ),
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <Target className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-semibold">Investment Score Analysis</h3>
      </div>

      <div className="h-80">
        <Radar data={data} options={options} />
      </div>

      {/* Overall scores */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {overallScores.map((item, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-white/5 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length].border }}
              />
              <span className="text-gray-400 text-sm truncate">{item.address}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className={`w-4 h-4 ${item.overall >= 80 ? 'text-green-400' : item.overall >= 60 ? 'text-yellow-400' : 'text-red-400'}`} />
              <span className={`font-bold ${item.overall >= 80 ? 'text-green-400' : item.overall >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                {item.overall}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
