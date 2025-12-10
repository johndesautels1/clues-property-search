/**
 * Section 6: Interior Features Visualizations (Fields 49-53)
 * Interior features comparison charts for flooring, kitchen, appliances, and fireplaces.
 * Score thresholds: 81-100 Excellent, 61-80 Good, 41-60 Average, 21-40 Fair, 0-20 Poor
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ScatterChart, Scatter, ComposedChart, ResponsiveContainer, Label } from 'recharts';

// Property data interface - Fields 49-53
interface Home {
  id?: string;
  name: string;
  flooringType: string;          // Field 49
  kitchenFeatures: string;       // Field 50
  appliancesIncluded: string[];  // Field 51
  fireplaceYn: boolean;          // Field 52
  fireplaceCount: number;        // Field 53
  color: string;
}

// Scoring helper functions
function scoreHigherIsBetter(values: number[]): number[] {
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max === min) {
    return values.map(() => 100);
  }
  return values.map(v => Math.round(((v - min) / (max - min)) * 100));
}
function scoreLowerIsBetter(values: number[]): number[] {
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max === min) {
    return values.map(() => 100);
  }
  return values.map(v => Math.round(((max - v) / (max - min)) * 100));
}
function getScoreColor(score: number): string {
  if (score >= 81) return '#4CAF50'; // Excellent (Green)
  if (score >= 61) return '#2196F3'; // Good (Blue)
  if (score >= 41) return '#FFEB3B'; // Average (Yellow)
  if (score >= 21) return '#FF9800'; // Fair (Orange)
  return '#FF4444';                 // Poor (Red)
}
function getScoreLabel(score: number): string {
  if (score >= 81) return 'Excellent';
  if (score >= 61) return 'Good';
  if (score >= 41) return 'Average';
  if (score >= 21) return 'Fair';
  return 'Poor';
}

// Color constants
const COLORS = {
  background: 'rgba(15, 23, 42, 0.5)',
  border: 'rgba(255, 255, 255, 0.1)',
  text: '#e2e8f0',
  grid: 'rgba(255, 255, 255, 0.1)',
  tooltip: 'rgba(15, 23, 42, 0.95)',
};

// Helper to compute composite interior raw score
function getInteriorScore(home: Home): number {
  // Flooring value (0-10) - Field 49
  const flooring = home.flooringType.toLowerCase();
  let floorValue;
  if (flooring.includes('hardwood')) floorValue = 10;
  else if (flooring.includes('tile')) floorValue = 8;
  else if (flooring.includes('laminate')) floorValue = 6;
  else if (flooring.includes('carpet')) floorValue = 4;
  else floorValue = 6; // default average for unknown types
  // Kitchen features values (0-10 each) - Field 50
  const features = home.kitchenFeatures.toLowerCase();
  let appliancesScore = 0, finishesScore = 0, layoutScore = 0;
  if (features.includes('stainless') || features.includes('high-end') || features.includes('gourmet')) appliancesScore = 10;
  else if (features.includes('basic')) appliancesScore = 4;
  else appliancesScore = 5;
  if (features.includes('granite') || features.includes('quartz') || features.includes('marble')) finishesScore = 10;
  else finishesScore = 5;
  if (features.includes('island') || features.includes('open') || features.includes('pantry')) layoutScore = 10;
  else layoutScore = 5;
  const kitchenValue = (appliancesScore + finishesScore + layoutScore) / 3;
  // Appliances count (0-6 possible) - Field 51
  const appliancesValue = home.appliancesIncluded.length;
  // Fireplace value (0 if none, +5 for first fireplace, +2 for each additional) - Fields 52-53
  let fireplaceValue = 0;
  if (home.fireplaceYn) {
    fireplaceValue = 5;
    if (home.fireplaceCount > 1) {
      fireplaceValue += 2 * (home.fireplaceCount - 1);
    }
  }
  // Total composite raw score
  return floorValue + kitchenValue + appliancesValue + fireplaceValue;
}

// ============================================
// REUSABLE COMPONENTS
// ============================================

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: COLORS.tooltip,
          border: `1px solid ${COLORS.border}`,
          borderRadius: '8px',
          padding: '12px',
        }}
      >
        <p style={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '4px' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: '#ffffff', fontSize: '14px', margin: '2px 0' }}>
            <span style={{ color: entry.color }}>{entry.name}:</span>{' '}
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const WinnerBadge: React.FC<{ winnerName: string; score: number; reason: string }> = ({
  winnerName,
  score,
  reason,
}) => {
  const color = getScoreColor(score);
  return (
    <div className="mt-4 flex justify-center">
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-xl"
        style={{
          background: `${color}20`,
          border: `2px solid ${color}`,
        }}
      >
        <span className="text-2xl">🏆</span>
        <div>
          <div className="text-sm font-bold text-white">Winner: {winnerName}</div>
          <div className="text-xs text-gray-300">
            CLUES-Smart Score:{' '}
            <span style={{ color, fontWeight: 700 }}>
              {Math.round(score)}/100
            </span>{' '}
            ({getScoreLabel(score)}) - {reason}
          </div>
        </div>
      </div>
    </div>
  );
};

const SmartScaleLegend: React.FC<{ description: string }> = ({ description }) => {
  return (
    <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-purple-400">
      <p className="text-xs font-bold text-purple-300 mb-2">CLUES-Smart Score Scale:</p>
      <div className="grid grid-cols-5 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: '#4CAF50' }}></div>
          <span className="text-gray-300">81-100: Excellent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: '#2196F3' }}></div>
          <span className="text-gray-300">61-80: Good</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: '#FFEB3B' }}></div>
          <span className="text-gray-300">41-60: Average</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: '#FF9800' }}></div>
          <span className="text-gray-300">21-40: Fair</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: '#FF4444' }}></div>
          <span className="text-gray-300">0-20: Poor</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">{description}</p>
    </div>
  );
};

// ============================================
// CHART 6-1: Flooring Type Comparison (Property Cards)
// ============================================
function Chart6_1_FlooringTypeDistribution({ homes }: { homes: Home[] }) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Flooring scoring map based on material quality
  const getFlooringScore = (flooringType: string): number => {
    const flooring = flooringType.toLowerCase();
    // 81-100 (Green/Excellent): Terrazzo, Marble, Exotic, Hardwood
    if (flooring.includes('terrazzo') || flooring.includes('terazzo')) return 95;
    if (flooring.includes('marble')) return 95;
    if (flooring.includes('exotic')) return 90;
    if (flooring.includes('hardwood') || flooring.includes('hard wood')) return 85;
    // 61-80 (Blue/Good): Vinyl laminate
    if (flooring.includes('vinyl') && flooring.includes('laminate')) return 70;
    if (flooring.includes('vinyl')) return 70;
    // 41-60 (Yellow/Average): Ceramic Tile
    if (flooring.includes('ceramic') || flooring.includes('tile')) return 50;
    // 21-40 (Orange/Fair): Carpet
    if (flooring.includes('carpet')) return 30;
    // 0-20 (Red/Poor): Wood laminate
    if (flooring.includes('laminate') && flooring.includes('wood')) return 15;
    if (flooring.includes('laminate')) return 15;
    // Default for unknown types
    return 50;
  };

  const propertyData = homes.map((h, idx) => {
    const score = getFlooringScore(h.flooringType);
    return {
      id: h.id,
      name: h.name,
      flooringType: h.flooringType || 'Unknown',
      score,
      color: h.color,
      label: getScoreLabel(score),
      propertyNum: idx + 1,
    };
  });

  const maxScore = Math.max(...propertyData.map(p => p.score));
  const winnerIndices = propertyData
    .map((p, i) => (p.score === maxScore ? i : -1))
    .filter((i) => i !== -1);
  const winner = propertyData[winnerIndices[0]];

  useEffect(() => {
    console.log('🔍 Chart 6-1: Flooring Type Comparison - CARD-BASED DESIGN:');
    propertyData.forEach((p) => {
      console.log(`📊 Property ${p.propertyNum}: ${p.name}`);
      console.log(`  🏗️  Flooring Type: ${p.flooringType}`);
      console.log(`  ⭐ Quality Score: ${p.score}/100 (${p.label})`);
      console.log(`  🎨 Color: ${p.color}`);
    });
    console.log(`🏆 WINNER: ${winner.name} with score ${maxScore}`);
  }, [homes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      {/* Chart ID Label */}
      <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">
        Chart 6-1
      </div>

      {/* Brain Widget */}
      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart</span>
        <span className="text-sm font-bold" style={{ color: getScoreColor(maxScore) }}>
          {maxScore}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">Chart 6-1: Flooring Type Comparison (Field 49)</h3>
      <p className="text-xs text-gray-400 mb-4">
        Comparing flooring material quality across properties
      </p>

      {/* PROPERTY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        {propertyData.map((prop, idx) => (
          <motion.div
            key={prop.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: hoveredCard === prop.id ? 1.05 : 1
            }}
            transition={{ delay: idx * 0.1, duration: 0.3 }}
            onMouseEnter={() => setHoveredCard(prop.id || null)}
            onMouseLeave={() => setHoveredCard(null)}
            className="relative p-4 rounded-xl backdrop-blur-xl cursor-pointer"
            style={{
              background: `${prop.color}10`,
              border: `2px solid ${prop.color}`,
              boxShadow: hoveredCard === prop.id
                ? `0 0 40px ${prop.color}80`
                : `0 0 20px ${prop.color}40`,
            }}
          >
            {/* Winner Crown */}
            {prop.score === maxScore && (
              <div className="absolute -top-2 -right-2 text-2xl">🏆</div>
            )}

            {/* Property Header */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  background: prop.color,
                  color: '#000',
                }}
              >
                {prop.propertyNum}
              </div>
              <div className="flex-1 min-w-0">
                <motion.div
                  className="text-sm font-semibold text-white"
                  animate={{
                    height: hoveredCard === prop.id ? 'auto' : '1.25rem'
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {hoveredCard === prop.id ? (
                    <div className="leading-tight">{prop.name}</div>
                  ) : (
                    <div className="truncate">{prop.name.split(',')[0]}</div>
                  )}
                </motion.div>
                <div className="text-xs text-gray-300 mt-0.5">
                  Property {prop.propertyNum}
                </div>
              </div>
            </div>

            {/* Flooring Type */}
            <div className="mb-3">
              <div className="text-[10px] text-gray-400 mb-1">Flooring Type</div>
              <div className="text-sm font-bold text-white">{prop.flooringType}</div>
            </div>

            {/* Score Badge */}
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-gray-400">Quality Score</div>
              <div
                className="px-3 py-1.5 rounded-full text-sm font-bold"
                style={{
                  background: `${getScoreColor(prop.score)}20`,
                  border: `2px solid ${getScoreColor(prop.score)}`,
                  color: getScoreColor(prop.score),
                }}
              >
                {prop.score}
              </div>
            </div>

            {/* Score Label */}
            <div className="mt-2 text-center">
              <div
                className="inline-block px-2 py-1 rounded text-[10px] font-semibold"
                style={{
                  background: `${getScoreColor(prop.score)}15`,
                  color: getScoreColor(prop.score),
                }}
              >
                {prop.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <WinnerBadge
        winnerName={winner.name.split(',')[0]}
        score={maxScore}
        reason="Superior flooring material quality"
      />

      <SmartScaleLegend description="Flooring scores: Terrazzo/Marble/Exotic/Hardwood (81-100 Green), Vinyl Laminate (61-80 Blue), Ceramic Tile (41-60 Yellow), Carpet (21-40 Orange), Wood Laminate (0-20 Red)" />
    </motion.div>
  );
}

// ============================================
// CHART 6-2: Appliance Velocity (Radial Gauges)
// ============================================
function Chart6_2_ApplianceCounts({ homes }: { homes: Home[] }) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Appliance tier scoring based on count and types
  const getApplianceTier = (appliances: string[]): { tier: number; color: string; label: string; score: number } => {
    const count = appliances.length;
    const hasCore = appliances.some(a => a.toLowerCase().includes('refrigerator') || a.toLowerCase().includes('fridge'));
    const hasStove = appliances.some(a => a.toLowerCase().includes('range') || a.toLowerCase().includes('oven') || a.toLowerCase().includes('stove'));
    const hasMicrowave = appliances.some(a => a.toLowerCase().includes('microwave'));
    const hasDishwasher = appliances.some(a => a.toLowerCase().includes('dishwasher'));

    // Tier scoring based purely on count first
    if (count === 0) return { tier: 0, color: '#FF4444', label: 'No Appliances', score: 0 };
    if (count >= 5) return { tier: 4, color: '#4CAF50', label: 'Premium (5+)', score: 100 };
    if (count === 4) return { tier: 3, color: '#2196F3', label: 'Enhanced (4)', score: 75 };
    if (count === 3) return { tier: 2, color: '#FFEB3B', label: 'Standard (3)', score: 50 };
    if (count <= 2) return { tier: 1, color: '#FF9800', label: 'Basic (1-2)', score: 25 };

    // Fallback
    return { tier: 1, color: '#FF9800', label: 'Basic', score: 25 };
  };

  const propertyData = homes.map((h, idx) => {
    const tierData = getApplianceTier(h.appliancesIncluded);
    return {
      id: h.id,
      name: h.name,
      count: h.appliancesIncluded.length,
      appliances: h.appliancesIncluded,
      ...tierData,
      propertyColor: h.color,
      propertyNum: idx + 1,
    };
  });

  const maxScore = Math.max(...propertyData.map(p => p.score));
  const winnerIndices = propertyData
    .map((p, i) => (p.score === maxScore ? i : -1))
    .filter((i) => i !== -1);
  const winner = propertyData[winnerIndices[0]];

  useEffect(() => {
    console.log('🔍 Chart 6-2: Appliance Velocity (Radial Gauges) - TIER SCORING:');
    propertyData.forEach((p) => {
      console.log(`📊 Property ${p.propertyNum}: ${p.name}`);
      console.log(`  Appliances: ${p.count} (${p.appliances.join(', ')})`);
      console.log(`  Tier: ${p.tier} (${p.label}) - Score: ${p.score}/100`);
    });
    console.log(`🏆 WINNER: ${winner.name} with score ${maxScore}`);
  }, [homes]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      {/* Chart ID Label */}
      <div className="absolute -top-3 left-3 text-xs font-mono text-gray-400">
        Chart 6-2
      </div>

      {/* Brain Widget */}
      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Smart</span>
        <span className="text-base font-bold" style={{ color: getScoreColor(maxScore) }}>
          {maxScore}
        </span>
      </div>

      <h3 className="text-xl font-semibold text-white mb-6">Chart 6-2: Appliance Count Scoring</h3>

      {/* VELOCITY GAUGE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
        {propertyData.map((prop, idx) => (
          <motion.div
            key={prop.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: hoveredCard === prop.id ? 1.05 : 1
            }}
            transition={{ delay: idx * 0.15, duration: 0.3 }}
            onMouseEnter={() => setHoveredCard(prop.id || null)}
            onMouseLeave={() => setHoveredCard(null)}
            className="relative p-6 rounded-xl backdrop-blur-xl cursor-pointer"
            style={{
              background: `${prop.propertyColor}10`,
              border: `2px solid ${prop.propertyColor}`,
              boxShadow: hoveredCard === prop.id
                ? `0 0 40px ${prop.propertyColor}80`
                : `0 0 20px ${prop.propertyColor}40`,
            }}
          >
            {/* Winner Crown */}
            {prop.score === maxScore && (
              <div className="absolute -top-3 -right-3 text-3xl">🏆</div>
            )}

            {/* Property Header */}
            <div className="text-center mb-4">
              <motion.div
                className="text-sm font-semibold text-white"
                animate={{
                  height: hoveredCard === prop.id ? 'auto' : '2rem'
                }}
                transition={{ duration: 0.3 }}
              >
                {hoveredCard === prop.id ? (
                  <div className="leading-tight">{prop.name}</div>
                ) : (
                  <div className="truncate">{prop.name.split(',')[0]}</div>
                )}
              </motion.div>
              <div className="text-xs text-gray-300 mt-1 font-medium">
                {prop.count} Appliance{prop.count !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Half-Circle Speedometer Gauge */}
            <div className="relative" style={{ height: '180px' }}>
              <svg viewBox="0 0 200 120" className="w-full">
                {/* Gradient definitions - Progressive halo from red to tier color */}
                <defs>
                  <linearGradient id={`haloGradient-${prop.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF4444" />
                    {prop.tier >= 1 && <stop offset="25%" stopColor="#FF9800" />}
                    {prop.tier >= 2 && <stop offset="50%" stopColor="#FFEB3B" />}
                    {prop.tier >= 3 && <stop offset="75%" stopColor="#2196F3" />}
                    {prop.tier >= 4 && <stop offset="100%" stopColor="#4CAF50" />}
                  </linearGradient>
                </defs>

                {/* Background arc (dark gray) */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#2a2a2a"
                  strokeWidth="20"
                  strokeLinecap="round"
                />

                {/* Progressive halo arc - stops at property's tier */}
                {prop.tier > 0 && (
                  <path
                    d={
                      prop.tier === 1
                        ? "M 20 100 A 80 80 0 0 1 60 38"
                        : prop.tier === 2
                        ? "M 20 100 A 80 80 0 0 1 100 20"
                        : prop.tier === 3
                        ? "M 20 100 A 80 80 0 0 1 140 38"
                        : "M 20 100 A 80 80 0 0 1 180 100"
                    }
                    fill="none"
                    stroke={`url(#haloGradient-${prop.id})`}
                    strokeWidth="24"
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }}
                  />
                )}

                {/* Center score display */}
                <text
                  x="100"
                  y="85"
                  textAnchor="middle"
                  fontSize="36"
                  fontWeight="bold"
                  fill={prop.color}
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                >
                  {prop.score}
                </text>
                <text
                  x="100"
                  y="108"
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="600"
                  fill="#e0e0e0"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                >
                  {prop.label}
                </text>
              </svg>
            </div>

            {/* Appliance List */}
            <div className="mt-4">
              <div className="text-xs text-gray-400 mb-2 font-medium">Included Appliances:</div>
              <div className="flex flex-wrap gap-1.5">
                {prop.appliances.length > 0 ? (
                  prop.appliances.map((app, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-xs rounded-full bg-white/10 text-gray-200 font-medium"
                    >
                      {app}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400 italic">None listed</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <WinnerBadge
        winnerName={winner.name.split(',')[0]}
        score={maxScore}
        reason="Premium appliance package"
      />

      <SmartScaleLegend description="Appliance tiers: Red (0), Orange (1-2 basic), Yellow (3 standard), Blue (4 enhanced), Green (5+ premium with extras like RO system)" />
    </motion.div>
  );
}

// ============================================
// CHART 6-3: Fireplace Presence & Count (Stacked Bar)
// ============================================
function Chart6_3_FireplaceComparison({ homes }: { homes: Home[] }) {
  // 1. CALCULATE RAW VALUES
  const rawValues = homes.map(h => h.fireplaceCount);
  // 2. CALCULATE CLUES-SMART SCORES
  const scores = scoreHigherIsBetter(rawValues);
  // 3. FIND WINNER
  const maxScore = Math.max(...scores);
  const winnerIndices = scores.map((s, i) => s === maxScore ? i : -1).filter(i => i !== -1);
  // 4. PREPARE CHART DATA (hasFireplace = 1 if yes, extraFireplaces = count-1 if more than one)
  const chartData = homes.map(h => ({
    name: h.name.split(',')[0],
    hasFireplace: h.fireplaceYn ? 1 : 0,
    extraFireplaces: h.fireplaceYn && h.fireplaceCount > 1 ? h.fireplaceCount - 1 : 0
  }));
  // 5. CONSOLE LOGGING
  useEffect(() => {
    console.log('🔍 Chart 6-3: Fireplace Presence & Count - SMART SCORING:');
    chartData.forEach((d, idx) => {
      console.log(`📊 ${d.name}:`);
      console.log('  Fireplaces count:', rawValues[idx]);
      console.log(`  🧠 SMART SCORE: ${scores[idx]}/100 (${getScoreLabel(scores[idx])})`);
    });
    console.log(`🏆 WINNER: ${winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')} with score ${maxScore}`);
  }, [homes]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      {/* Chart ID Label */}
      <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">
        Chart 6-3
      </div>

      {/* Brain Widget */}
      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart</span>
        <span className="text-sm font-bold" style={{ color: getScoreColor(maxScore) }}>
          {maxScore}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">Chart 6-3: Fireplace Presence & Count</h3>
      <p className="text-xs text-gray-400 mb-4">Which homes have fireplaces and how many</p>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData}>
          <CartesianGrid stroke={COLORS.grid} />
          <XAxis dataKey="name" tick={{ fill: COLORS.text, fontSize: 12, fontWeight: 600 }} />
          <YAxis allowDecimals={false} tick={{ fill: COLORS.text, fontSize: 12, fontWeight: 600 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.tooltip,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: '#ffffff'
            }}
            labelStyle={{ color: '#ffffff' }}
            itemStyle={{ color: '#ffffff' }}
            formatter={(value, name) => [`${value}`, name === 'hasFireplace' ? 'Has Fireplace' : 'Additional']}
          />
          <Legend wrapperStyle={{ color: '#ffffff', fontSize: '10px' }} />
          <Bar dataKey="hasFireplace" stackId="a" name="Has Fireplace" fill="#F59E0B" />
          <Bar dataKey="extraFireplaces" stackId="a" name="Additional Fireplaces" fill="#EF4444" />
        </BarChart>
      </ResponsiveContainer>

      <WinnerBadge
        winnerName={winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')}
        score={maxScore}
        reason="Most fireplaces present"
      />

      <SmartScaleLegend description="Homes with a fireplace (especially multiple fireplaces) score higher, while homes with none score lowest." />
    </motion.div>
  );
}

// ============================================
// CHART 6-4: Kitchen Features Scoring (Radar)
// ============================================
function Chart6_4_KitchenFeatures({ homes }: { homes: Home[] }) {
  // 1. CALCULATE RAW VALUES (aggregate kitchen feature score)
  const rawValues = homes.map(h => {
    // Sum category scores for each kitchen (appliances + finishes + layout)
    const features = h.kitchenFeatures.toLowerCase();
    let appScore = 0, finScore = 0, layScore = 0;
    if (features.includes('stainless') || features.includes('high-end') || features.includes('gourmet')) appScore = 10;
    else if (features.includes('basic')) appScore = 4;
    else appScore = 5;
    if (features.includes('granite') || features.includes('quartz') || features.includes('marble')) finScore = 10;
    else finScore = 5;
    if (features.includes('island') || features.includes('open') || features.includes('pantry')) layScore = 10;
    else layScore = 5;
    return appScore + finScore + layScore;
  });
  // 2. CALCULATE CLUES-SMART SCORES
  const scores = scoreHigherIsBetter(rawValues);
  // 3. FIND WINNER
  const maxScore = Math.max(...scores);
  const winnerIndices = scores.map((s, i) => s === maxScore ? i : -1).filter(i => i !== -1);
  // 4. PREPARE CHART DATA (radar categories for Appliances, Finishes, Layout)
  const radarData = [
    { feature: 'Appliances' },
    { feature: 'Finishes' },
    { feature: 'Layout' }
  ];
  homes.forEach(h => {
    const features = h.kitchenFeatures.toLowerCase();
    radarData[0][h.name] = features.includes('stainless') || features.includes('high-end') || features.includes('gourmet') ? 10
                            : (features.includes('basic') ? 4 : 5);
    radarData[1][h.name] = features.includes('granite') || features.includes('quartz') || features.includes('marble') ? 10 : 5;
    radarData[2][h.name] = features.includes('island') || features.includes('open') || features.includes('pantry') ? 10 : 5;
  });
  // 5. CONSOLE LOGGING
  useEffect(() => {
    console.log('🔍 Chart 6-4: Kitchen Features Scoring - SMART SCORING:');
    homes.forEach((h, idx) => {
      console.log(`📊 ${h.name.split(',')[0]}:`);
      console.log('  Raw kitchen score:', rawValues[idx]);
      console.log(`  🧠 SMART SCORE: ${scores[idx]}/100 (${getScoreLabel(scores[idx])})`);
    });
    console.log(`🏆 WINNER: ${winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')} with score ${maxScore}`);
  }, [homes]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      {/* Chart ID Label */}
      <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">
        Chart 6-4
      </div>

      {/* Brain Widget */}
      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart</span>
        <span className="text-sm font-bold" style={{ color: getScoreColor(maxScore) }}>
          {maxScore}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">Chart 6-4: Kitchen Features Scoring</h3>
      <p className="text-xs text-gray-400 mb-4">Quality of kitchen appliances, finishes, and layout</p>

      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={radarData}>
          <PolarGrid stroke={COLORS.grid} />
          <PolarAngleAxis dataKey="feature" tick={{ fill: COLORS.text, fontSize: 12, fontWeight: 600 }} />
          <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: COLORS.text, fontSize: 10 }} axisLine={false} tickCount={6} />
          {homes.map(h => (
            <Radar key={h.name} name={h.name.split(',')[0]} dataKey={h.name} stroke={h.color} fill={h.color} fillOpacity={0.2} />
          ))}
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.tooltip,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: '#ffffff'
            }}
            labelStyle={{ color: '#ffffff' }}
            itemStyle={{ color: '#ffffff' }}
          />
          <Legend wrapperStyle={{ color: '#ffffff', fontSize: '12px' }} />
        </RadarChart>
      </ResponsiveContainer>

      <WinnerBadge
        winnerName={winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')}
        score={maxScore}
        reason="Best overall kitchen features"
      />

      <SmartScaleLegend description="Kitchens with luxury finishes, modern appliances, and open layouts achieve higher scores." />
    </motion.div>
  );
}

// ============================================
// CHART 6-5: Composite Interior Score (Bar)
// ============================================
function Chart6_5_InteriorScore({ homes }: { homes: Home[] }) {
  // 1. CALCULATE RAW VALUES (composite interior scores)
  const rawValues = homes.map(h => getInteriorScore(h));
  // 2. CALCULATE CLUES-SMART SCORES
  const scores = scoreHigherIsBetter(rawValues);
  // 3. FIND WINNER
  const maxScore = Math.max(...scores);
  const winnerIndices = scores.map((s, i) => s === maxScore ? i : -1).filter(i => i !== -1);
  // 4. PREPARE CHART DATA
  const chartData = homes.map((h, idx) => ({
    name: h.name.split(',')[0],
    score: scores[idx]
  }));
  // 5. CONSOLE LOGGING
  useEffect(() => {
    console.log('🔍 Chart 6-5: Composite Interior Score - SMART SCORING:');
    homes.forEach((h, idx) => {
      console.log(`📊 ${h.name.split(',')[0]}:`);
      console.log('  Raw interior score:', rawValues[idx].toFixed(1));
      console.log(`  🧠 SMART SCORE: ${scores[idx]}/100 (${getScoreLabel(scores[idx])})`);
    });
    console.log(`🏆 WINNER: ${winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')} with score ${maxScore}`);
  }, [homes]);
  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      {/* BRAIN WIDGET */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg"
           style={{ background: `${getScoreColor(maxScore)}20`, border: `2px solid ${getScoreColor(maxScore)}` }}>
        <span className="text-xl">🧠</span>
        <div className="text-xs">
          <div className="font-bold text-white">SMART Score</div>
          <div style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>
            {maxScore}/100
          </div>
        </div>
      </div>
      {/* TITLE */}
      <h3 className="text-lg font-semibold text-white mb-2">Chart 6-5: Composite Interior Score</h3>
      <p className="text-xs text-gray-400 mb-4">Overall interior features score (0-100)</p>
      {/* CHART */}
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData}>
          <CartesianGrid stroke={COLORS.grid} />
          <XAxis dataKey="name" tick={{ fill: COLORS.text, fontSize: 12, fontWeight: 600 }} />
          <YAxis domain={[0, 100]} tick={{ fill: COLORS.text, fontSize: 12, fontWeight: 600 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.tooltip,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: '#ffffff'
            }}
            labelStyle={{ color: '#ffffff' }}
            itemStyle={{ color: '#ffffff' }}
            formatter={(value) => [`${value}/100`, 'Interior Score']}
          />
          <Bar dataKey="score" barSize={30}>
            {chartData.map((entry, index) => (
              <Cell key={`score-${index}`} fill={homes[index].color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* WINNER BADGE */}
      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl"
             style={{ background: `${getScoreColor(maxScore)}20`, border: `2px solid ${getScoreColor(maxScore)}` }}>
          <span className="text-2xl">🏆</span>
          <div>
            <div className="text-sm font-bold text-white">
              Winner: {winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')}
            </div>
            <div className="text-xs text-gray-300">
              CLUES-Smart Score: <span style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>
                {maxScore}/100
              </span> ({getScoreLabel(maxScore)}) – Best overall interior
            </div>
          </div>
        </div>
      </div>
      {/* SMART SCALE LEGEND */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-purple-400">
        <p className="text-xs font-bold text-purple-300 mb-2">CLUES-Smart Score Scale:</p>
        <div className="grid grid-cols-5 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#4CAF50' }}></div>
            <span className="text-gray-300">81-100: Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#2196F3' }}></div>
            <span className="text-gray-300">61-80: Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FFEB3B' }}></div>
            <span className="text-gray-300">41-60: Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF9800' }}></div>
            <span className="text-gray-300">21-40: Fair</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF4444' }}></div>
            <span className="text-gray-300">0-20: Poor</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Combined interior score reflecting all features (flooring, kitchen, appliances, fireplace).
        </p>
      </div>
    </div>
  );
}

// ============================================
// CHART 6-6: Appliance Richness vs Score (Scatter)
// ============================================
function Chart6_6_AppliancesVsScore({ homes }: { homes: Home[] }) {
  // 1. CALCULATE RAW VALUES
  const appliancesCounts = homes.map(h => h.appliancesIncluded.length);
  const interiorScores = homes.map(h => getInteriorScore(h));
  // 2. CALCULATE CLUES-SMART SCORES (reuse interior scores for y-axis)
  const scores = scoreHigherIsBetter(interiorScores);
  // 3. FIND WINNER
  const maxScore = Math.max(...scores);
  const winnerIndices = scores.map((s, i) => s === maxScore ? i : -1).filter(i => i !== -1);
  // 4. PREPARE CHART DATA (x = appliances count, y = interior score)
  // We will plot each property as a separate Scatter series for color differentiation
  // 5. CONSOLE LOGGING
  useEffect(() => {
    console.log('🔍 Chart 6-6: Appliance Richness vs Interior Score - SMART SCORING:');
    homes.forEach((h, idx) => {
      console.log(`📊 ${h.name.split(',')[0]}:`);
      console.log('  Appliances count:', appliancesCounts[idx]);
      console.log('  Interior score:', scores[idx]);
    });
    console.log(`🏆 WINNER: ${winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')} with interior score ${maxScore}`);
  }, [homes]);
  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      {/* BRAIN WIDGET */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg"
           style={{ background: `${getScoreColor(maxScore)}20`, border: `2px solid ${getScoreColor(maxScore)}` }}>
        <span className="text-xl">🧠</span>
        <div className="text-xs">
          <div className="font-bold text-white">SMART Score</div>
          <div style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>
            {maxScore}/100
          </div>
        </div>
      </div>
      {/* TITLE */}
      <h3 className="text-lg font-semibold text-white mb-2">Chart 6-6: Appliance Richness vs Interior Score</h3>
      <p className="text-xs text-gray-400 mb-4">Appliances included vs. overall interior score</p>
      {/* CHART */}
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart>
          <CartesianGrid stroke={COLORS.grid} />
          <XAxis type="number" dataKey="x" name="Appliances" domain={[0, 'dataMax + 1']}
                 tick={{ fill: COLORS.text, fontSize: 12, fontWeight: 600 }}>
            <Label value="Number of Appliances" position="insideBottom" offset={-5} fill={COLORS.text} />
          </XAxis>
          <YAxis type="number" dataKey="y" name="Interior Score" domain={[0, 100]}
                 tick={{ fill: COLORS.text, fontSize: 12, fontWeight: 600 }}>
            <Label value="Interior Score" angle={-90} position="insideLeft" fill={COLORS.text} style={{ textAnchor: 'middle' }} />
          </YAxis>
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.tooltip,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: '#ffffff'
            }}
            labelStyle={{ color: '#ffffff' }}
            itemStyle={{ color: '#ffffff' }}
            formatter={(value, name) => [`${value}${name === 'Appliances' ? '' : '/100'}`, name]}
          />
          <Legend wrapperStyle={{ color: '#ffffff', fontSize: '12px' }} />
          {homes.map((h, idx) => (
            <Scatter key={`scatter-${idx}`} name={h.name.split(',')[0]} data={[{ x: appliancesCounts[idx], y: scores[idx] }]} fill={h.color} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      {/* WINNER BADGE */}
      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl"
             style={{ background: `${getScoreColor(maxScore)}20`, border: `2px solid ${getScoreColor(maxScore)}` }}>
          <span className="text-2xl">🏆</span>
          <div>
            <div className="text-sm font-bold text-white">
              Winner: {winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')}
            </div>
            <div className="text-xs text-gray-300">
              CLUES-Smart Score: <span style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>
                {maxScore}/100
              </span> ({getScoreLabel(maxScore)}) – Highest interior score overall
            </div>
          </div>
        </div>
      </div>
      {/* SMART SCALE LEGEND */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-purple-400">
        <p className="text-xs font-bold text-purple-300 mb-2">CLUES-Smart Score Scale:</p>
        <div className="grid grid-cols-5 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#4CAF50' }}></div>
            <span className="text-gray-300">81-100: Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#2196F3' }}></div>
            <span className="text-gray-300">61-80: Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FFEB3B' }}></div>
            <span className="text-gray-300">41-60: Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF9800' }}></div>
            <span className="text-gray-300">21-40: Fair</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF4444' }}></div>
            <span className="text-gray-300">0-20: Poor</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          More included appliances often coincide with a higher interior score, as shown by the upward trend.
        </p>
      </div>
    </div>
  );
}

// ============================================
// CHART 6-7: Interior Score Contribution (Waterfall)
// ============================================
function Chart6_7_InteriorContribution({ homes }: { homes: Home[] }) {
  // 1. CALCULATE RAW VALUES
  const rawValues = homes.map(h => getInteriorScore(h));
  // 2. CALCULATE CLUES-SMART SCORES
  const scores = scoreHigherIsBetter(rawValues);
  // 3. FIND WINNER
  const maxScore = Math.max(...scores);
  const winnerIndices = scores.map((s, i) => s === maxScore ? i : -1).filter(i => i !== -1);
  const winnerIndex = winnerIndices[0] ?? 0;
  // 4. PREPARE CHART DATA (waterfall for top property)
  const winnerHome = homes[winnerIndex];
  // Compute contributions for floor, kitchen, appliances (fireplace omitted per chart focus)
  const flooring = winnerHome.flooringType.toLowerCase();
  let floorVal;
  if (flooring.includes('hardwood')) floorVal = 10;
  else if (flooring.includes('tile')) floorVal = 8;
  else if (flooring.includes('laminate')) floorVal = 6;
  else if (flooring.includes('carpet')) floorVal = 4;
  else floorVal = 6;
  const features = winnerHome.kitchenFeatures.toLowerCase();
  let appScore = 0, finScore = 0, layScore = 0;
  if (features.includes('stainless') || features.includes('high-end') || features.includes('gourmet')) appScore = 10;
  else if (features.includes('basic')) appScore = 4;
  else appScore = 5;
  if (features.includes('granite') || features.includes('quartz') || features.includes('marble')) finScore = 10;
  else finScore = 5;
  if (features.includes('island') || features.includes('open') || features.includes('pantry')) layScore = 10;
  else layScore = 5;
  const kitchenVal = (appScore + finScore + layScore) / 3;
  const appliancesVal = winnerHome.appliancesIncluded.length;
  // Waterfall data: each entry has cumulative offset and value
  const data = [
    { name: 'Flooring', cumulative: 0, value: floorVal },
    { name: 'Kitchen', cumulative: floorVal, value: kitchenVal },
    { name: 'Appliances', cumulative: floorVal + kitchenVal, value: appliancesVal }
  ];
  // 5. CONSOLE LOGGING
  useEffect(() => {
    console.log('🔍 Chart 6-7: Interior Score Contribution (Waterfall) - SMART SCORING:');
    console.log(`🏆 Top Property: ${winnerHome.name.split(',')[0]} (score ${scores[winnerIndex]})`);
    console.log('  Flooring contribution:', floorVal.toFixed(1));
    console.log('  Kitchen contribution:', kitchenVal.toFixed(1));
    console.log('  Appliances contribution:', appliancesVal.toFixed(1));
  }, [homes]);
  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      {/* BRAIN WIDGET */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg"
           style={{ background: `${getScoreColor(maxScore)}20`, border: `2px solid ${getScoreColor(maxScore)}` }}>
        <span className="text-xl">🧠</span>
        <div className="text-xs">
          <div className="font-bold text-white">SMART Score</div>
          <div style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>
            {maxScore}/100
          </div>
        </div>
      </div>
      {/* TITLE */}
      <h3 className="text-lg font-semibold text-white mb-2">Chart 6-7: Interior Score Contribution</h3>
      <p className="text-xs text-gray-400 mb-4">How key features contribute to the top interior score</p>
      {/* CHART */}
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data}>
          <CartesianGrid stroke={COLORS.grid} />
          <XAxis dataKey="name" tick={{ fill: COLORS.text, fontSize: 12, fontWeight: 600 }} />
          <YAxis tick={{ fill: COLORS.text, fontSize: 12, fontWeight: 600 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.tooltip,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: '#ffffff'
            }}
            labelStyle={{ color: '#ffffff' }}
            itemStyle={{ color: '#ffffff' }}
            formatter={(value) => [value.toFixed(1), 'Points']}
          />
          {/* Invisible bar for offset */}
          <Bar dataKey="cumulative" stackId="a" fill="transparent" />
          {/* Visible bar segments */}
          <Bar dataKey="value" stackId="a">
            {data.map((entry, index) => {
              const segmentColors = ['#3B82F6', '#8B5CF6', '#F59E0B'];
              return <Cell key={`cell-${index}`} fill={segmentColors[index] || '#ccc'} />;
            })}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
      {/* WINNER BADGE */}
      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl"
             style={{ background: `${getScoreColor(maxScore)}20`, border: `2px solid ${getScoreColor(maxScore)}` }}>
          <span className="text-2xl">🏆</span>
          <div>
            <div className="text-sm font-bold text-white">
              Winner: {homes[winnerIndex].name.split(',')[0]}
            </div>
            <div className="text-xs text-gray-300">
              CLUES-Smart Score: <span style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>
                {scores[winnerIndex]}/100
              </span> ({getScoreLabel(scores[winnerIndex])}) – Strongest interior features overall
            </div>
          </div>
        </div>
      </div>
      {/* SMART SCALE LEGEND */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-purple-400">
        <p className="text-xs font-bold text-purple-300 mb-2">CLUES-Smart Score Scale:</p>
        <div className="grid grid-cols-5 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#4CAF50' }}></div>
            <span className="text-gray-300">81-100: Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#2196F3' }}></div>
            <span className="text-gray-300">61-80: Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FFEB3B' }}></div>
            <span className="text-gray-300">41-60: Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF9800' }}></div>
            <span className="text-gray-300">21-40: Fair</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF4444' }}></div>
            <span className="text-gray-300">0-20: Poor</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          The top home's interior score is built from flooring, kitchen, and appliance points (waterfall breakdown).
        </p>
      </div>
    </div>
  );
}

// ============================================
// CHART 6-8: Fireplace Presence Heatmap (Color Scale Bar)
// ============================================
function Chart6_8_FireplaceHeatmap({ homes }: { homes: Home[] }) {
  // 1. CALCULATE RAW VALUES
  const rawValues = homes.map(h => h.fireplaceCount);
  // 2. CALCULATE CLUES-SMART SCORES
  const scores = scoreHigherIsBetter(rawValues);
  // 3. FIND WINNER
  const maxScore = Math.max(...scores);
  const winnerIndices = scores.map((s, i) => s === maxScore ? i : -1).filter(i => i !== -1);
  // 4. PREPARE CHART DATA
  const chartData = homes.map(h => ({
    name: h.name.split(',')[0],
    count: h.fireplaceCount
  }));
  // Color scale: 0 -> gray, 1 -> orange, 2+ -> red
  const getBarColor = (count: number) => {
    if (count >= 2) return '#EF4444';
    if (count === 1) return '#F97316';
    return '#4B5563';
  };
  // 5. CONSOLE LOGGING
  useEffect(() => {
    console.log('🔍 Chart 6-8: Fireplace Presence Heatmap - SMART SCORING:');
    chartData.forEach((d, idx) => {
      console.log(`📊 ${d.name}:`);
      console.log('  Fireplace count:', d.count);
      console.log(`  🧠 SMART SCORE: ${scores[idx]}/100 (${getScoreLabel(scores[idx])})`);
    });
    console.log(`🏆 WINNER: ${winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')} with score ${maxScore}`);
  }, [homes]);
  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      {/* BRAIN WIDGET */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg"
           style={{ background: `${getScoreColor(maxScore)}20`, border: `2px solid ${getScoreColor(maxScore)}` }}>
        <span className="text-xl">🧠</span>
        <div className="text-xs">
          <div className="font-bold text-white">SMART Score</div>
          <div style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>
            {maxScore}/100
          </div>
        </div>
      </div>
      {/* TITLE */}
      <h3 className="text-lg font-semibold text-white mb-2">Chart 6-8: Fireplace Presence Heatmap</h3>
      <p className="text-xs text-gray-400 mb-4">Fireplace count indicated by bar color intensity</p>
      {/* CHART */}
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData}>
          <CartesianGrid stroke={COLORS.grid} />
          <XAxis dataKey="name" tick={{ fill: COLORS.text, fontSize: 12, fontWeight: 600 }} />
          <YAxis allowDecimals={false} tick={{ fill: COLORS.text, fontSize: 12, fontWeight: 600 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.tooltip,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: '#ffffff'
            }}
            labelStyle={{ color: '#ffffff' }}
            itemStyle={{ color: '#ffffff' }}
            formatter={(value) => [`${value}`, 'Fireplaces']}
          />
          <Bar dataKey="count" barSize={30}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.count)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* WINNER BADGE */}
      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl"
             style={{ background: `${getScoreColor(maxScore)}20`, border: `2px solid ${getScoreColor(maxScore)}` }}>
          <span className="text-2xl">🏆</span>
          <div>
            <div className="text-sm font-bold text-white">
              Winner: {winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')}
            </div>
            <div className="text-xs text-gray-300">
              CLUES-Smart Score: <span style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>
                {maxScore}/100
              </span> ({getScoreLabel(maxScore)}) – Warmest interior (more fireplaces)
            </div>
          </div>
        </div>
      </div>
      {/* SMART SCALE LEGEND */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-purple-400">
        <p className="text-xs font-bold text-purple-300 mb-2">CLUES-Smart Score Scale:</p>
        <div className="grid grid-cols-5 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#4CAF50' }}></div>
            <span className="text-gray-300">81-100: Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#2196F3' }}></div>
            <span className="text-gray-300">61-80: Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FFEB3B' }}></div>
            <span className="text-gray-300">41-60: Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF9800' }}></div>
            <span className="text-gray-300">21-40: Fair</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF4444' }}></div>
            <span className="text-gray-300">0-20: Poor</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Bar color indicates fireplace count (gray for 0, orange for 1, red for 2+).
        </p>
      </div>
    </div>
  );
}

// ============================================
// CHART 6-9: Appliance Combination Popularity (Pie)
// ============================================
function Chart6_9_ApplianceCombos({ homes }: { homes: Home[] }) {
  // 1. CALCULATE RAW VALUES (combination frequency per property)
  const comboMap: Record<string, number> = {};
  const comboByHome: string[] = [];
  homes.forEach(h => {
    const combo = h.appliancesIncluded.slice().sort().join(', ');
    comboByHome.push(combo);
    comboMap[combo] = (comboMap[combo] || 0) + 1;
  });
  const rawValues = homes.map((h, i) => comboMap[comboByHome[i]]);
  // 2. CALCULATE CLUES-SMART SCORES
  const scores = scoreHigherIsBetter(rawValues);
  // 3. FIND WINNER
  const maxScore = Math.max(...scores);
  const winnerIndices = scores.map((s, i) => s === maxScore ? i : -1).filter(i => i !== -1);
  // 4. PREPARE CHART DATA
  const chartData = Object.entries(comboMap).map(([combo, count]) => ({ combo, count }));
  // Determine slice colors: common combo = teal, unique combo = that property's color
  let pieColors: string[] = chartData.map(entry => {
    if (entry.count > 1) return '#2DD4BF';
    const homeIndex = homes.findIndex(h => h.appliancesIncluded.slice().sort().join(', ') === entry.combo);
    return homeIndex !== -1 ? homes[homeIndex].color : '#EC4899';
  });
  // 5. CONSOLE LOGGING
  useEffect(() => {
    console.log('🔍 Chart 6-9: Appliance Combination Popularity - SMART SCORING:');
    chartData.forEach(entry => {
      console.log(`📊 Combo "${entry.combo}" - ${entry.count} home(s)`);
    });
    homes.forEach((h, idx) => {
      console.log(`🏠 ${h.name.split(',')[0]} combo: "${comboByHome[idx]}" (score ${scores[idx]})`);
    });
    console.log(`🏆 WINNER: ${winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')} with score ${maxScore}`);
  }, [homes]);
  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      {/* BRAIN WIDGET */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg"
           style={{ background: `${getScoreColor(maxScore)}20`, border: `2px solid ${getScoreColor(maxScore)}` }}>
        <span className="text-xl">🧠</span>
        <div className="text-xs">
          <div className="font-bold text-white">SMART Score</div>
          <div style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>
            {maxScore}/100
          </div>
        </div>
      </div>
      {/* TITLE */}
      <h3 className="text-lg font-semibold text-white mb-2">Chart 6-9: Appliance Combination Popularity</h3>
      <p className="text-xs text-gray-400 mb-4">Most common appliance packages among the homes</p>
      {/* CHART */}
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={chartData} dataKey="count" nameKey="combo" cx="50%" cy="50%" outerRadius={80}>
            {chartData.map((entry, index) => (
              <Cell key={`combo-${index}`} fill={pieColors[index % pieColors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.tooltip,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: '#ffffff'
            }}
            labelStyle={{ color: '#ffffff' }}
            itemStyle={{ color: '#ffffff' }}
            formatter={(value) => [`${value} home(s)`, 'Combination']}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* WINNER BADGE */}
      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl"
             style={{ background: `${getScoreColor(maxScore)}20`, border: `2px solid ${getScoreColor(maxScore)}` }}>
          <span className="text-2xl">🏆</span>
          <div>
            <div className="text-sm font-bold text-white">
              Winner: {winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')}
            </div>
            <div className="text-xs text-gray-300">
              CLUES-Smart Score: <span style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>
                {maxScore}/100
              </span> ({getScoreLabel(maxScore)}) – Most popular appliance set
            </div>
          </div>
        </div>
      </div>
      {/* SMART SCALE LEGEND */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-purple-400">
        <p className="text-xs font-bold text-purple-300 mb-2">CLUES-Smart Score Scale:</p>
        <div className="grid grid-cols-5 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#4CAF50' }}></div>
            <span className="text-gray-300">81-100: Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#2196F3' }}></div>
            <span className="text-gray-300">61-80: Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FFEB3B' }}></div>
            <span className="text-gray-300">41-60: Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF9800' }}></div>
            <span className="text-gray-300">21-40: Fair</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF4444' }}></div>
            <span className="text-gray-300">0-20: Poor</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Larger pie slices mean more properties share that appliance combination.
        </p>
      </div>
    </div>
  );
}

// ============================================
// CHART 6-10: Interior Features Smart Rank (List)
// ============================================
function Chart6_10_InteriorRank({ homes }: { homes: Home[] }) {
  // 1. CALCULATE RAW VALUES
  const rawValues = homes.map(h => getInteriorScore(h));
  // 2. CALCULATE CLUES-SMART SCORES
  const scores = scoreHigherIsBetter(rawValues);
  // 3. FIND WINNER
  const maxScore = Math.max(...scores);
  const winnerIndices = scores.map((s, i) => s === maxScore ? i : -1).filter(i => i !== -1);
  // 4. PREPARE RANK LIST DATA (sorted by score)
  const ranking = homes.map((h, idx) => ({
    name: h.name.split(',')[0],
    score: scores[idx]
  })).sort((a, b) => b.score - a.score);
  // 5. CONSOLE LOGGING
  useEffect(() => {
    console.log('🔍 Chart 6-10: Interior Features Smart Rank - SMART SCORING:');
    ranking.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.name}: ${item.score}/100 (${getScoreLabel(item.score)})`);
    });
    console.log(`🏆 WINNER: ${winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')} with score ${maxScore}`);
  }, [homes]);
  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      {/* BRAIN WIDGET */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg"
           style={{ background: `${getScoreColor(maxScore)}20`, border: `2px solid ${getScoreColor(maxScore)}` }}>
        <span className="text-xl">🧠</span>
        <div className="text-xs">
          <div className="font-bold text-white">SMART Score</div>
          <div style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>
            {maxScore}/100
          </div>
        </div>
      </div>
      {/* TITLE */}
      <h3 className="text-lg font-semibold text-white mb-2">Chart 6-10: Interior Features Smart Rank</h3>
      <p className="text-xs text-gray-400 mb-4">Overall interior feature ranking of the homes</p>
      {/* RANK LIST */}
      <div>
        {ranking.map((item, idx) => {
          const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
          return (
            <div key={item.name} className="flex items-center justify-between py-2 border-b border-white/10 last:border-b-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">{rankIcon}</span>
                <span className="text-sm font-medium text-white">{item.name}</span>
              </div>
              <div className="flex items-center">
                <span className="px-2 py-1 rounded-full"
                      style={{ background: `${getScoreColor(item.score)}20`, color: getScoreColor(item.score), fontWeight: 700 }}>
                  {item.score}
                </span>
                <span className="ml-1 text-xs text-gray-300">/100 {getScoreLabel(item.score)}</span>
              </div>
            </div>
          );
        })}
      </div>
      {/* WINNER BADGE */}
      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl"
             style={{ background: `${getScoreColor(maxScore)}20`, border: `2px solid ${getScoreColor(maxScore)}` }}>
          <span className="text-2xl">🏆</span>
          <div>
            <div className="text-sm font-bold text-white">
              Winner: {winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')}
            </div>
            <div className="text-xs text-gray-300">
              CLUES-Smart Score: <span style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>
                {maxScore}/100
              </span> ({getScoreLabel(maxScore)}) – Top interior features overall
            </div>
          </div>
        </div>
      </div>
      {/* SMART SCALE LEGEND */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-purple-400">
        <p className="text-xs font-bold text-purple-300 mb-2">CLUES-Smart Score Scale:</p>
        <div className="grid grid-cols-5 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#4CAF50' }}></div>
            <span className="text-gray-300">81-100: Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#2196F3' }}></div>
            <span className="text-gray-300">61-80: Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FFEB3B' }}></div>
            <span className="text-gray-300">41-60: Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF9800' }}></div>
            <span className="text-gray-300">21-40: Fair</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF4444' }}></div>
            <span className="text-gray-300">0-20: Poor</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Final ranking of properties by interior quality, from best (1st) to worst (3rd).
        </p>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT: Section6_InteriorFeaturesCharts
// ============================================
interface Section6ChartsProps {
  homes: Home[];
}
export default function Section6_InteriorFeaturesCharts({ homes }: Section6ChartsProps) {
  if (!homes || !homes.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        No properties to compare
      </div>
    );
  }
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: homes[0].color }} />
        <span className="text-sm font-medium" style={{ color: homes[0].color }}>
          Interior Features Comparison with CLUES-Smart Scoring
        </span>
      </div>
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart6_1_FlooringTypeDistribution homes={homes} />
        <Chart6_2_ApplianceCounts homes={homes} />
        <Chart6_3_FireplaceComparison homes={homes} />
        <Chart6_4_KitchenFeatures homes={homes} />
        <Chart6_5_InteriorScore homes={homes} />
        <Chart6_6_AppliancesVsScore homes={homes} />
        <Chart6_7_InteriorContribution homes={homes} />
        <Chart6_8_FireplaceHeatmap homes={homes} />
        <Chart6_9_ApplianceCombos homes={homes} />
        <Chart6_10_InteriorRank homes={homes} />
      </div>
      {/* Footer Note */}
      <div className="mt-6 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
        <p className="text-xs text-gray-400">
          <strong className="text-white">CLUES-Smart Scoring:</strong> Each chart applies the CLUES model to compare interior features, scoring 0-100 where higher is better.
        </p>
      </div>
    </div>
  );
}
