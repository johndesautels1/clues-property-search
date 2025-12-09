/**
 * Category 3: Property Basics Charts (Fields 17-29)
 *
 * 7 Charts:
 * - Chart 3-1: Bedroom Comparison (Field 17)
 * - Chart 3-2: Bathroom Comparison (Field 20)
 * - Chart 3-3: Living Space Showdown (Field 21)
 * - Chart 3-4: Lot Size Comparison (Fields 23 + 24)
 * - Chart 3-5: Space Efficiency Ratio (Calculated)
 * - Chart 3-6: Property Age (Field 25)
 * - Chart 3-7: Parking Capacity (Field 28)
 */

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Fixed property colors (matching Category 21)
const PROPERTY_COLORS = {
  property1: '#22c55e', // Green
  property2: '#8b5cf6', // Lavender
  property3: '#ec4899', // Pink
};

// Chart colors (dark theme)
const COLORS = {
  grid: '#334155',
  text: '#e2e8f0',
  muted: '#94a3b8',
};

interface Home {
  id: string;
  name: string;
  bedrooms: number;
  fullBathrooms: number;
  halfBathrooms: number;
  totalBathrooms: number;
  livingSqft: number;
  totalSqftUnderRoof: number;
  lotSizeSqft: number;
  lotSizeAcres: number;
  yearBuilt: number;
  propertyType: string;
  stories: number;
  garageSpaces: number;
  parkingTotal: string;
  listingPrice: number;
  color: string;
}

interface PropertyBasicsChartsProps {
  homes: Home[];
}

// ============================================
// 5-TIER CLUES-SMART SCORING SYSTEM
// ============================================

/**
 * Score values where HIGHER is BETTER (bedrooms, sqft, etc.)
 */
function scoreHigherIsBetter(values: number[]): number[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 50); // All equal = Average

  return values.map((v) => {
    const percentile = (v - min) / (max - min);
    if (percentile <= 0.2) return 0;
    if (percentile <= 0.4) return 25;
    if (percentile <= 0.6) return 50;
    if (percentile <= 0.8) return 75;
    return 100;
  });
}

/**
 * Score values where LOWER is BETTER (age, costs, etc.)
 */
function scoreLowerIsBetter(values: number[]): number[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 50); // All equal = Average

  return values.map((v) => {
    const percentile = (max - v) / (max - min);
    if (percentile <= 0.2) return 0;
    if (percentile <= 0.4) return 25;
    if (percentile <= 0.6) return 50;
    if (percentile <= 0.8) return 75;
    return 100;
  });
}

/**
 * Get color for a score
 */
function getScoreColor(score: number): string {
  const scoreColors = {
    0: '#ef4444',   // Red
    25: '#f97316',  // Orange
    50: '#eab308',  // Yellow
    75: '#3b82f6',  // Blue
    100: '#22c55e', // Green
  };
  return scoreColors[score as keyof typeof scoreColors] || '#eab308';
}

/**
 * Get label for a score
 */
function getScoreLabel(score: number): string {
  const labels = {
    0: 'Poor',
    25: 'Below Average',
    50: 'Average',
    75: 'Good',
    100: 'Excellent',
  };
  return labels[score as keyof typeof labels] || 'Average';
}

// ============================================
// FORMATTING FUNCTIONS
// ============================================

const formatNumber = (value: number): string =>
  new Intl.NumberFormat('en-US').format(value);

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatSqFt = (value: number): string => `${formatNumber(value)} sq ft`;

const formatAcres = (value: number): string => `${value.toFixed(2)} ac`;

const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`;

// ============================================
// CHART 3-1: BEDROOM COMPARISON
// ============================================
function BedroomComparison({ homes }: { homes: Home[] }) {
  const values = homes.map((h) => h.bedrooms);
  const scores = scoreHigherIsBetter(values);
  const maxScore = Math.max(...scores);

  const data = homes.map((h, index) => ({
    name: h.name.split(',')[0],
    value: h.bedrooms,
    color: h.color,
    score: scores[index],
    index,
  }));

  useEffect(() => {
    console.log('🔍 Chart 3-1: Bedroom Comparison - Data Verification:');
    console.log('');
    homes.forEach((h, idx) => {
      console.log(`📊 Property ${idx + 1}: ${h.name}`);
      console.log(`  Field 17 (bedrooms): ${h.bedrooms}`);
    });
    console.log('');
    console.log('🧠 Chart 3-1: Smart Score Calculation (5-Tier System):');
    console.log(`Input values: [${values.join(', ')}]`);
    console.log('Scoring function: scoreHigherIsBetter()');
    console.log('');
    homes.forEach((h, idx) => {
      console.log(`Property ${idx + 1}: ${h.name.split(',')[0]}`);
      console.log(`  Bedrooms: ${values[idx]}`);
      console.log(`  🎯 Smart Score: ${scores[idx]}/100 (${getScoreLabel(scores[idx])})`);
      console.log('');
    });
    const winners = homes.filter((_, idx) => scores[idx] === maxScore);
    console.log(`🏆 Winner: ${winners.map((w) => w.name.split(',')[0]).join(' & ')} - Score: ${maxScore}/100`);
    console.log('─'.repeat(80));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">
        Chart 3-1
      </div>

      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart</span>
        <span className="text-sm font-bold" style={{ color: getScoreColor(maxScore) }}>
          {maxScore}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-4">Bedroom Comparison</h3>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="name"
            stroke={COLORS.text}
            fontSize={12}
            fontWeight={600}
            tick={{ fill: COLORS.text }}
          />
          <YAxis
            stroke={COLORS.text}
            fontSize={12}
            fontWeight={600}
            tick={{ fill: COLORS.text }}
            domain={[0, 5]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '12px',
            }}
            labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
            itemStyle={{ color: '#94a3b8' }}
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            formatter={(value) => [`${value} bedrooms`, 'Count']}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-6 mt-4">
        {homes.map((h) => (
          <div key={h.id} className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: h.color }} />
            <span className="text-sm font-semibold text-white">{h.name.split(',')[0]}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================
// CHART 3-2: BATHROOM COMPARISON
// ============================================
function BathroomComparison({ homes }: { homes: Home[] }) {
  const values = homes.map((h) => h.totalBathrooms);
  const scores = scoreHigherIsBetter(values);
  const maxScore = Math.max(...scores);

  const data = homes.map((h, index) => ({
    name: h.name.split(',')[0],
    value: h.totalBathrooms,
    color: h.color,
    score: scores[index],
    index,
  }));

  useEffect(() => {
    console.log('🔍 Chart 3-2: Bathroom Comparison - Data Verification:');
    console.log('');
    homes.forEach((h, idx) => {
      console.log(`📊 Property ${idx + 1}: ${h.name}`);
      console.log(`  Field 20 (total_bathrooms): ${h.totalBathrooms}`);
    });
    console.log('');
    console.log('🧠 Chart 3-2: Smart Score Calculation (5-Tier System):');
    console.log(`Input values: [${values.join(', ')}]`);
    console.log('Scoring function: scoreHigherIsBetter()');
    console.log('');
    homes.forEach((h, idx) => {
      console.log(`Property ${idx + 1}: ${h.name.split(',')[0]}`);
      console.log(`  Total Bathrooms: ${values[idx]}`);
      console.log(`  🎯 Smart Score: ${scores[idx]}/100 (${getScoreLabel(scores[idx])})`);
      console.log('');
    });
    const winners = homes.filter((_, idx) => scores[idx] === maxScore);
    console.log(`🏆 Winner: ${winners.map((w) => w.name.split(',')[0]).join(' & ')} - Score: ${maxScore}/100`);
    console.log('─'.repeat(80));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">
        Chart 3-2
      </div>

      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart</span>
        <span className="text-sm font-bold" style={{ color: getScoreColor(maxScore) }}>
          {maxScore}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-4">Total Bathrooms</h3>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" opacity={0.3} />
          <XAxis type="number" stroke={COLORS.text} fontSize={12} fontWeight={600} tick={{ fill: COLORS.text }} domain={[0, 5]} />
          <YAxis type="category" dataKey="name" stroke={COLORS.text} fontSize={12} fontWeight={600} tick={{ fill: COLORS.text }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '12px',
            }}
            labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
            itemStyle={{ color: '#94a3b8' }}
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            formatter={(value) => [`${value} baths`, 'Count']}
          />
          <Bar dataKey="value" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-6 mt-4">
        {homes.map((h) => (
          <div key={h.id} className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: h.color }} />
            <span className="text-sm font-semibold text-white">{h.name.split(',')[0]}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================
// CHART 3-3: LIVING SPACE SHOWDOWN
// ============================================
function LivingSpaceShowdown({ homes }: { homes: Home[] }) {
  const values = homes.map((h) => h.livingSqft);
  const scores = scoreHigherIsBetter(values);
  const maxScore = Math.max(...scores);

  const data = homes.map((h, index) => ({
    name: h.name.split(',')[0],
    value: h.livingSqft,
    pricePerSqft: h.listingPrice && h.livingSqft ? Math.round(h.listingPrice / h.livingSqft) : 0,
    color: h.color,
    score: scores[index],
    index,
  }));

  useEffect(() => {
    console.log('🔍 Chart 3-3: Living Space Showdown - Data Verification:');
    console.log('');
    homes.forEach((h, idx) => {
      const pricePerSqft = h.listingPrice && h.livingSqft ? Math.round(h.listingPrice / h.livingSqft) : 0;
      console.log(`📊 Property ${idx + 1}: ${h.name}`);
      console.log(`  Field 21 (living_sqft): ${formatNumber(h.livingSqft)}`);
      console.log(`  Calculated $/sqft: ${formatCurrency(pricePerSqft)}`);
    });
    console.log('');
    console.log('🧠 Chart 3-3: Smart Score Calculation (5-Tier System):');
    console.log(`Input values: [${values.join(', ')}]`);
    console.log('Scoring function: scoreHigherIsBetter()');
    console.log('');
    homes.forEach((h, idx) => {
      console.log(`Property ${idx + 1}: ${h.name.split(',')[0]}`);
      console.log(`  Living Sq Ft: ${formatNumber(values[idx])}`);
      console.log(`  🎯 Smart Score: ${scores[idx]}/100 (${getScoreLabel(scores[idx])})`);
      console.log('');
    });
    const winners = homes.filter((_, idx) => scores[idx] === maxScore);
    console.log(`🏆 Winner: ${winners.map((w) => w.name.split(',')[0]).join(' & ')} - Score: ${maxScore}/100`);
    console.log('─'.repeat(80));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">
        Chart 3-3
      </div>

      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart</span>
        <span className="text-sm font-bold" style={{ color: getScoreColor(maxScore) }}>
          {maxScore}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-4">Living Space Comparison</h3>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="name"
            stroke={COLORS.text}
            fontSize={12}
            fontWeight={600}
            tick={{ fill: COLORS.text }}
          />
          <YAxis
            stroke={COLORS.text}
            fontSize={12}
            fontWeight={600}
            tick={{ fill: COLORS.text }}
            tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '12px',
            }}
            labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
            itemStyle={{ color: '#94a3b8' }}
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            formatter={(value, name, props) => {
              const sqft = formatNumber(value as number);
              const pricePerSqft = formatCurrency(props.payload.pricePerSqft);
              return [`${sqft} sq ft (${pricePerSqft}/sqft)`, 'Living Space'];
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-6 mt-4">
        {homes.map((h) => (
          <div key={h.id} className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: h.color }} />
            <span className="text-sm font-semibold text-white">{h.name.split(',')[0]}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================
// CHART 3-4: LOT SIZE COMPARISON
// ============================================
function LotSizeComparison({ homes }: { homes: Home[] }) {
  const values = homes.map((h) => h.lotSizeSqft);
  const scores = scoreHigherIsBetter(values);
  const maxScore = Math.max(...scores);

  const data = homes.map((h, index) => ({
    name: h.name.split(',')[0],
    sqft: h.lotSizeSqft,
    acres: h.lotSizeAcres,
    color: h.color,
    score: scores[index],
    index,
  }));

  useEffect(() => {
    console.log('🔍 Chart 3-4: Lot Size Comparison - Data Verification:');
    console.log('');
    homes.forEach((h, idx) => {
      console.log(`📊 Property ${idx + 1}: ${h.name}`);
      console.log(`  Field 23 (lot_size_sqft): ${formatNumber(h.lotSizeSqft)}`);
      console.log(`  Field 24 (lot_size_acres): ${formatAcres(h.lotSizeAcres)}`);
    });
    console.log('');
    console.log('🧠 Chart 3-4: Smart Score Calculation (5-Tier System):');
    console.log(`Input values: [${values.join(', ')}]`);
    console.log('Scoring function: scoreHigherIsBetter()');
    console.log('');
    homes.forEach((h, idx) => {
      console.log(`Property ${idx + 1}: ${h.name.split(',')[0]}`);
      console.log(`  Lot Size: ${formatNumber(values[idx])} sq ft (${formatAcres(h.lotSizeAcres)})`);
      console.log(`  🎯 Smart Score: ${scores[idx]}/100 (${getScoreLabel(scores[idx])})`);
      console.log('');
    });
    const winners = homes.filter((_, idx) => scores[idx] === maxScore);
    console.log(`🏆 Winner: ${winners.map((w) => w.name.split(',')[0]).join(' & ')} - Score: ${maxScore}/100`);
    console.log('─'.repeat(80));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">
        Chart 3-4
      </div>

      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart</span>
        <span className="text-sm font-bold" style={{ color: getScoreColor(maxScore) }}>
          {maxScore}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-4">Lot Size Comparison</h3>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="name"
            stroke={COLORS.text}
            fontSize={12}
            fontWeight={600}
            tick={{ fill: COLORS.text }}
          />
          <YAxis
            stroke={COLORS.text}
            fontSize={12}
            fontWeight={600}
            tick={{ fill: COLORS.text }}
            tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '12px',
            }}
            labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
            itemStyle={{ color: '#94a3b8' }}
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            formatter={(value, name, props) => {
              const sqft = formatNumber(props.payload.sqft);
              const acres = formatAcres(props.payload.acres);
              return [`${sqft} sq ft (${acres})`, 'Lot Size'];
            }}
          />
          <Bar dataKey="sqft" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-6 mt-4">
        {homes.map((h) => (
          <div key={h.id} className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: h.color }} />
            <span className="text-sm font-semibold text-white">{h.name.split(',')[0]}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================
// CHART 3-5: SPACE EFFICIENCY RATIO
// ============================================
function SpaceEfficiencyRatio({ homes }: { homes: Home[] }) {
  const efficiencyRatios = homes.map((h) =>
    h.livingSqft && h.lotSizeSqft ? h.livingSqft / h.lotSizeSqft : 0
  );
  const scores = scoreHigherIsBetter(efficiencyRatios);
  const maxScore = Math.max(...scores);

  const data = homes.map((h, index) => ({
    name: h.name.split(',')[0],
    ratio: efficiencyRatios[index],
    percent: efficiencyRatios[index] * 100,
    color: h.color,
    score: scores[index],
    index,
  }));

  useEffect(() => {
    console.log('🔍 Chart 3-5: Space Efficiency Ratio - Data Verification:');
    console.log('');
    homes.forEach((h, idx) => {
      const ratio = efficiencyRatios[idx];
      console.log(`📊 Property ${idx + 1}: ${h.name}`);
      console.log(`  Living Sq Ft: ${formatNumber(h.livingSqft)}`);
      console.log(`  Lot Sq Ft: ${formatNumber(h.lotSizeSqft)}`);
      console.log(`  Efficiency Ratio: ${formatPercent(ratio)} (${h.livingSqft} / ${h.lotSizeSqft})`);
    });
    console.log('');
    console.log('🧠 Chart 3-5: Smart Score Calculation (5-Tier System):');
    console.log(`Input values: [${efficiencyRatios.map((r) => formatPercent(r)).join(', ')}]`);
    console.log('Scoring function: scoreHigherIsBetter()');
    console.log('Interpretation: Higher % = more building coverage on lot');
    console.log('');
    homes.forEach((h, idx) => {
      console.log(`Property ${idx + 1}: ${h.name.split(',')[0]}`);
      console.log(`  Efficiency Ratio: ${formatPercent(efficiencyRatios[idx])}`);
      console.log(`  🎯 Smart Score: ${scores[idx]}/100 (${getScoreLabel(scores[idx])})`);
      console.log('');
    });
    const winners = homes.filter((_, idx) => scores[idx] === maxScore);
    console.log(`🏆 Winner: ${winners.map((w) => w.name.split(',')[0]).join(' & ')} - Score: ${maxScore}/100`);
    console.log('─'.repeat(80));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">
        Chart 3-5
      </div>

      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart</span>
        <span className="text-sm font-bold" style={{ color: getScoreColor(maxScore) }}>
          {maxScore}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-4">Space Efficiency (Building Coverage)</h3>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            type="number"
            stroke={COLORS.text}
            fontSize={12}
            fontWeight={600}
            tick={{ fill: COLORS.text }}
            tickFormatter={(value) => `${value.toFixed(1)}%`}
            domain={[0, 50]}
          />
          <YAxis type="category" dataKey="name" stroke={COLORS.text} fontSize={12} fontWeight={600} tick={{ fill: COLORS.text }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '12px',
            }}
            labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
            itemStyle={{ color: '#94a3b8' }}
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Coverage']}
          />
          <Bar dataKey="percent" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-6 mt-4">
        {homes.map((h) => (
          <div key={h.id} className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: h.color }} />
            <span className="text-sm font-semibold text-white">{h.name.split(',')[0]}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================
// CHART 3-6: PROPERTY AGE
// ============================================
function PropertyAgeComparison({ homes }: { homes: Home[] }) {
  const currentYear = new Date().getFullYear();
  const ages = homes.map((h) => currentYear - h.yearBuilt);
  const scores = scoreLowerIsBetter(ages); // Lower age = better
  const maxScore = Math.max(...scores);

  const data = homes.map((h, index) => ({
    name: h.name.split(',')[0],
    yearBuilt: h.yearBuilt,
    age: ages[index],
    color: h.color,
    score: scores[index],
    index,
  }));

  useEffect(() => {
    console.log('🔍 Chart 3-6: Property Age - Data Verification:');
    console.log('');
    homes.forEach((h, idx) => {
      console.log(`📊 Property ${idx + 1}: ${h.name}`);
      console.log(`  Field 25 (year_built): ${h.yearBuilt}`);
      console.log(`  Calculated Age: ${ages[idx]} years`);
    });
    console.log('');
    console.log('🧠 Chart 3-6: Smart Score Calculation (5-Tier System):');
    console.log(`Input values: [${ages.join(', ')}]`);
    console.log('Scoring function: scoreLowerIsBetter() - Newer is better');
    console.log('');
    homes.forEach((h, idx) => {
      console.log(`Property ${idx + 1}: ${h.name.split(',')[0]}`);
      console.log(`  Built: ${h.yearBuilt} (${ages[idx]} years old)`);
      console.log(`  🎯 Smart Score: ${scores[idx]}/100 (${getScoreLabel(scores[idx])})`);
      console.log('');
    });
    const winners = homes.filter((_, idx) => scores[idx] === maxScore);
    console.log(`🏆 Winner: ${winners.map((w) => w.name.split(',')[0]).join(' & ')} - Score: ${maxScore}/100`);
    console.log('─'.repeat(80));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">
        Chart 3-6
      </div>

      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart</span>
        <span className="text-sm font-bold" style={{ color: getScoreColor(maxScore) }}>
          {maxScore}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-4">Property Age</h3>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="name"
            stroke={COLORS.text}
            fontSize={12}
            fontWeight={600}
            tick={{ fill: COLORS.text }}
          />
          <YAxis
            stroke={COLORS.text}
            fontSize={12}
            fontWeight={600}
            tick={{ fill: COLORS.text }}
            domain={[0, 15]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '12px',
            }}
            labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
            itemStyle={{ color: '#94a3b8' }}
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            formatter={(value, name, props) => [
              `Built ${props.payload.yearBuilt} (${value} years old)`,
              'Age',
            ]}
          />
          <Bar dataKey="age" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-6 mt-4">
        {homes.map((h) => (
          <div key={h.id} className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: h.color }} />
            <span className="text-sm font-semibold text-white">{h.name.split(',')[0]}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================
// CHART 3-7: PARKING CAPACITY
// ============================================
function ParkingCapacity({ homes }: { homes: Home[] }) {
  const values = homes.map((h) => h.garageSpaces);
  const scores = scoreHigherIsBetter(values);
  const maxScore = Math.max(...scores);

  const data = homes.map((h, index) => ({
    name: h.name.split(',')[0],
    spaces: h.garageSpaces,
    parkingTotal: h.parkingTotal,
    color: h.color,
    score: scores[index],
    index,
  }));

  useEffect(() => {
    console.log('🔍 Chart 3-7: Parking Capacity - Data Verification:');
    console.log('');
    homes.forEach((h, idx) => {
      console.log(`📊 Property ${idx + 1}: ${h.name}`);
      console.log(`  Field 28 (garage_spaces): ${h.garageSpaces}`);
      console.log(`  Field 29 (parking_total): ${h.parkingTotal}`);
    });
    console.log('');
    console.log('🧠 Chart 3-7: Smart Score Calculation (5-Tier System):');
    console.log(`Input values: [${values.join(', ')}]`);
    console.log('Scoring function: scoreHigherIsBetter()');
    console.log('');
    homes.forEach((h, idx) => {
      console.log(`Property ${idx + 1}: ${h.name.split(',')[0]}`);
      console.log(`  Garage Spaces: ${values[idx]}`);
      console.log(`  🎯 Smart Score: ${scores[idx]}/100 (${getScoreLabel(scores[idx])})`);
      console.log('');
    });
    const winners = homes.filter((_, idx) => scores[idx] === maxScore);
    console.log(`🏆 Winner: ${winners.map((w) => w.name.split(',')[0]).join(' & ')} - Score: ${maxScore}/100`);
    console.log('─'.repeat(80));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">
        Chart 3-7
      </div>

      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart</span>
        <span className="text-sm font-bold" style={{ color: getScoreColor(maxScore) }}>
          {maxScore}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-4">Garage Spaces</h3>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="name"
            stroke={COLORS.text}
            fontSize={12}
            fontWeight={600}
            tick={{ fill: COLORS.text }}
          />
          <YAxis
            stroke={COLORS.text}
            fontSize={12}
            fontWeight={600}
            tick={{ fill: COLORS.text }}
            domain={[0, 4]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '12px',
            }}
            labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
            itemStyle={{ color: '#94a3b8' }}
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            formatter={(value, name, props) => [
              `${value} spaces (${props.payload.parkingTotal})`,
              'Garage',
            ]}
          />
          <Bar dataKey="spaces" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-6 mt-4">
        {homes.map((h) => (
          <div key={h.id} className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: h.color }} />
            <span className="text-sm font-semibold text-white">{h.name.split(',')[0]}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT: PROPERTY BASICS CHARTS
// ============================================
export default function PropertyBasicsCharts({ homes }: PropertyBasicsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BedroomComparison homes={homes} />
      <BathroomComparison homes={homes} />
      <LivingSpaceShowdown homes={homes} />
      <LotSizeComparison homes={homes} />
      <SpaceEfficiencyRatio homes={homes} />
      <PropertyAgeComparison homes={homes} />
      <ParkingCapacity homes={homes} />
    </div>
  );
}
