/**
 * Section 6: Interior Features Visualizations (Fields 49-53)
 * Interior features comparison charts for flooring, kitchen, appliances, and fireplaces.
 * Score thresholds: 81-100 Excellent, 61-80 Good, 41-60 Average, 21-40 Fair, 0-20 Poor
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ScatterChart, Scatter, ComposedChart, ResponsiveContainer, Label } from 'recharts';

// Property data interface - Fields 49-53, 167
interface Home {
  id?: string;
  name: string;
  flooringType: string;          // Field 49
  kitchenFeatures: string;       // Field 50
  appliancesIncluded: string[];  // Field 51
  fireplaceYn: boolean;          // Field 52
  fireplaceCount: number;        // Field 53
  interiorFeatures: string[];    // Field 167 - Architectural Features
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
// CHART 6-2: Flooring Type Comparison (Property Cards)
// ============================================
function Chart6_2_FlooringTypeDistribution({ homes }: { homes: Home[] }) {
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
  const winners = winnerIndices.map(i => propertyData[i]);
  const winnerNames = winners.map(w => w.name.split(',')[0]).join(' & ');

  useEffect(() => {
    console.log('🔍 Chart 6-2: Flooring Type Comparison - CARD-BASED DESIGN:');
    propertyData.forEach((p) => {
      console.log(`📊 Property ${p.propertyNum}: ${p.name}`);
      console.log(`  🏗️  Flooring Type: ${p.flooringType}`);
      console.log(`  ⭐ Quality Score: ${p.score}/100 (${p.label})`);
      console.log(`  🎨 Color: ${p.color}`);
    });
    console.log(`🏆 WINNER(S): ${winnerNames} with score ${maxScore}`);
  }, [homes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      {/* Chart ID Label */}
      <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">
        Chart 6-2
      </div>

      {/* Brain Widget */}
      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart</span>
        <span className="text-sm font-bold" style={{ color: getScoreColor(maxScore) }}>
          {maxScore}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">Chart 6-2: Flooring Type Comparison (Field 49)</h3>
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
        winnerName={winnerNames}
        score={maxScore}
        reason="Superior flooring material quality"
      />

      <SmartScaleLegend description="Flooring Quality Methodology: Scores assigned based on material durability (lifespan), maintenance requirements, and luxury market appeal. Terrazzo/Marble (95 - 50+ year lifespan, premium luxury), Exotic/Hardwood (85-90 - premium natural materials with 30-50 year lifespan), Vinyl Laminate (70 - durable modern flooring with easy maintenance), Ceramic Tile (50 - standard quality, 20-30 year lifespan), Carpet (30 - higher maintenance, 10-15 year lifespan), Wood Laminate (15 - lower durability, 10-15 year lifespan)." />
    </motion.div>
  );
}

// ============================================
// CHART 6-3: Appliance Velocity (Radial Gauges)
// ============================================
function Chart6_3_ApplianceCounts({ homes }: { homes: Home[] }) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Define 8 standard appliances to track
  const standardAppliances = [
    { key: 'refrigerator', label: 'Refrigerator', keywords: ['refrigerator', 'fridge'] },
    { key: 'range', label: 'Range/Stove', keywords: ['range', 'stove', 'oven', 'cooktop'] },
    { key: 'microwave', label: 'Microwave', keywords: ['microwave'] },
    { key: 'dishwasher', label: 'Dishwasher', keywords: ['dishwasher'] },
    { key: 'washer', label: 'Washer', keywords: ['washer', 'washing machine'] },
    { key: 'dryer', label: 'Dryer', keywords: ['dryer'] },
    { key: 'disposal', label: 'Garbage Disposal', keywords: ['disposal', 'garbage disposal'] },
    { key: 'extra', label: 'Extra (Wine Cooler/Ice Maker)', keywords: ['wine', 'ice maker', 'trash compactor', 'water filter'] }
  ];

  // Appliance scoring based on count (CLUES 0-100)
  const getApplianceScore = (count: number): number => {
    return Math.round((count / 8) * 100); // Linear 0-100 based on 8 appliances
  };

  const propertyData = homes.map((h, idx) => {
    // Detect which of the 8 standard appliances this property has
    const detected: Record<string, boolean> = {};
    standardAppliances.forEach(app => {
      detected[app.key] = h.appliancesIncluded.some(a =>
        app.keywords.some(keyword => a.toLowerCase().includes(keyword))
      );
    });

    const count = Object.values(detected).filter(Boolean).length;
    const score = getApplianceScore(count);

    return {
      id: h.id,
      name: h.name,
      count,
      detectedAppliances: detected,
      allAppliances: h.appliancesIncluded,
      score,
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
    console.log('🔍 Chart 6-3: Appliance Count Scoring - CLUES-SMART SCORING:');
    propertyData.forEach((p) => {
      console.log(`📊 Property ${p.propertyNum}: ${p.name.split(',')[0]}`);
      console.log(`  Detected appliances: ${p.count}/8`);
      console.log(`  🧠 SMART SCORE: ${p.score}/100 (${getScoreLabel(p.score)})`);
      console.log('  Has:', standardAppliances.filter(a => p.detectedAppliances[a.key]).map(a => a.label).join(', '));
    });
    console.log(`🏆 WINNER: ${winner.name.split(',')[0]} with score ${maxScore}`);
  }, [homes]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      {/* Chart ID Label */}
      <div className="absolute -top-3 left-3 text-xs font-mono text-gray-400">
        Chart 6-3
      </div>

      {/* Brain Widget */}
      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Smart</span>
        <span className="text-base font-bold" style={{ color: getScoreColor(maxScore) }}>
          {maxScore}
        </span>
      </div>

      <h3 className="text-xl font-semibold text-white mb-6">Chart 6-3: Appliance Count Scoring</h3>

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
                {/* Gradient definitions - Progressive halo using CLUES-Smart score colors */}
                <defs>
                  <linearGradient id={`haloGradient-${prop.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF4444" />  {/* 0-20: Red */}
                    {prop.score > 20 && <stop offset="25%" stopColor="#FF9800" />}  {/* 21-40: Orange */}
                    {prop.score > 40 && <stop offset="50%" stopColor="#FFEB3B" />}  {/* 41-60: Yellow */}
                    {prop.score > 60 && <stop offset="75%" stopColor="#2196F3" />}  {/* 61-80: Blue */}
                    {prop.score > 80 && <stop offset="100%" stopColor="#4CAF50" />}  {/* 81-100: Green */}
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

                {/* Progressive halo arc - based on CLUES score percentage */}
                {prop.score > 0 && (
                  <path
                    d={
                      prop.score <= 20
                        ? "M 20 100 A 80 80 0 0 1 60 38"    // Red zone (0-20)
                        : prop.score <= 40
                        ? "M 20 100 A 80 80 0 0 1 100 20"   // Orange zone (21-40)
                        : prop.score <= 60
                        ? "M 20 100 A 80 80 0 0 1 140 38"   // Yellow zone (41-60)
                        : prop.score <= 80
                        ? "M 20 100 A 80 80 0 0 1 170 70"   // Blue zone (61-80)
                        : "M 20 100 A 80 80 0 0 1 180 100"  // Green zone (81-100)
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
                  fill={prop.propertyColor}
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
                  {getScoreLabel(prop.score)}
                </text>
              </svg>
            </div>

          </motion.div>
        ))}
      </div>

      {/* 8-Feature Breakdown Table */}
      <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
        <h4 className="text-sm font-semibold text-white mb-3">8 Standard Appliances Breakdown</h4>
        <div className="grid grid-cols-1 gap-2">
          {standardAppliances.map((appliance, idx) => (
            <div key={appliance.key} className="flex items-center gap-3 text-xs">
              <div className="w-48 text-gray-300 font-medium">{idx + 1}. {appliance.label}</div>
              <div className="flex gap-4">
                {propertyData.map((prop) => (
                  <div
                    key={prop.id}
                    className="flex items-center gap-1.5 w-24"
                    style={{ color: prop.propertyColor }}
                  >
                    {prop.detectedAppliances[appliance.key] ? (
                      <>
                        <span className="text-green-400">✓</span>
                        <span className="text-[10px] font-medium truncate">{prop.name.split(',')[0]}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-600">✗</span>
                        <span className="text-[10px] text-gray-600 truncate">{prop.name.split(',')[0]}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <WinnerBadge
        winnerName={winner.name.split(',')[0]}
        score={maxScore}
        reason="Most comprehensive appliance package"
      />

      <SmartScaleLegend description="CLUES-Smart scoring: 0-20 (Red/Poor), 21-40 (Orange/Fair), 41-60 (Yellow/Average), 61-80 (Blue/Good), 81-100 (Green/Excellent). Score based on count of 8 standard appliances detected." />
    </motion.div>
  );
}

// ============================================
// CHART 6-4: Kitchen Features Scoring (Radar)
// ============================================
function Chart6_4_KitchenFeatures({ homes }: { homes: Home[] }) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // LUXURY FEATURE DETECTION
  const detectLuxuryAppliances = (text: string) => {
    const lower = text.toLowerCase();
    return {
      wolfViking: lower.includes('wolf') || lower.includes('viking'),
      subZero: lower.includes('sub-zero') || lower.includes('sub zero') || lower.includes('subzero'),
      restaurantHood: (lower.includes('restaurant') || lower.includes('commercial')) && lower.includes('hood'),
      inductionGas: lower.includes('induction') || (lower.includes('gas') && lower.includes('cooktop')),
      miele: lower.includes('miele')
    };
  };

  const detectLuxuryFinishes = (text: string) => {
    const lower = text.toLowerCase();
    return {
      solidSurface: lower.includes('quartz') || lower.includes('granite') || lower.includes('marble') || lower.includes('solid surface'),
      pantry: lower.includes('pantry') || lower.includes('butler'),
      quietClose: lower.includes('soft close') || lower.includes('soft-close') || lower.includes('quiet close') || lower.includes('quiet-close'),
      solidCabinets: (lower.includes('solid wood') || lower.includes('custom')) && lower.includes('cabinet'),
      builtIns: lower.includes('built-in') || lower.includes('builtin') || lower.includes('built in')
    };
  };

  const detectLayout = (text: string): { type: string; multiplier: number; color: string } => {
    const lower = text.toLowerCase();
    if (lower.includes('island') && lower.includes('open')) return { type: 'Open with Island', multiplier: 1.0, color: '#4CAF50' };
    if (lower.includes('open')) return { type: 'Open Layout', multiplier: 0.90, color: '#2196F3' };
    if (lower.includes('rectangular')) return { type: 'Rectangular', multiplier: 0.75, color: '#FFEB3B' };
    if (lower.includes('galley')) return { type: 'Galley', multiplier: 0.60, color: '#FF9800' };
    return { type: 'Small/Closed', multiplier: 0.40, color: '#FF4444' };
  };

  // CALCULATE PROPERTY DATA WITH CLUES SCORING
  const propertyData = homes.map(h => {
    const appliances = detectLuxuryAppliances(h.kitchenFeatures);
    const finishes = detectLuxuryFinishes(h.kitchenFeatures);
    const layout = detectLayout(h.kitchenFeatures);

    const applianceCount = Object.values(appliances).filter(Boolean).length;
    const finishCount = Object.values(finishes).filter(Boolean).length;
    const totalFeatures = applianceCount + finishCount;

    const baseScore = totalFeatures * 10; // 0-100
    const finalScore = Math.round(baseScore * layout.multiplier);

    return {
      id: h.id,
      name: h.name,
      color: h.color,
      rawText: h.kitchenFeatures,
      appliances,
      finishes,
      layout,
      applianceCount,
      finishCount,
      totalFeatures,
      baseScore,
      finalScore
    };
  });

  // FIND WINNER
  const maxScore = Math.max(...propertyData.map(p => p.finalScore));
  const winnerIndices = propertyData.map((p, i) => p.finalScore === maxScore ? i : -1).filter(i => i !== -1);

  // DATA WIRING PROOF - CONSOLE LOGGING
  useEffect(() => {
    console.log('🔍 Chart 6-4: Kitchen Features - LUXURY SCORING (DATA WIRING PROOF):');
    console.log('═══════════════════════════════════════════════════════════════');

    // CRITICAL: Show raw data first
    console.log('\n📋 RAW KITCHEN FEATURES DATA FROM SCHEMA:');
    homes.forEach((h, idx) => {
      console.log(`${idx + 1}. ${h.name.split(',')[0]}:`);
      console.log(`   kitchenFeatures: "${h.kitchenFeatures}"`);
      console.log(`   Length: ${h.kitchenFeatures.length} chars`);
      console.log(`   Is Empty: ${!h.kitchenFeatures || h.kitchenFeatures.trim().length === 0}`);
    });

    console.log('\n🔬 DETECTION RESULTS:');
    propertyData.forEach((p) => {
      console.log(`\n📊 ${p.name.split(',')[0]}:`);
      console.log('  ✅ Detected Luxury Appliances:', p.appliances);
      console.log('     Count:', p.applianceCount, '/ 5');
      console.log('  ✅ Detected Luxury Finishes:', p.finishes);
      console.log('     Count:', p.finishCount, '/ 5');
      console.log('  ✅ Layout:', p.layout.type, `(×${p.layout.multiplier})`);
      console.log(`  📐 Base Score: ${p.baseScore}/100 (${p.totalFeatures} features × 10)`);
      console.log(`  🧠 FINAL SMART SCORE: ${p.finalScore}/100 (${getScoreLabel(p.finalScore)})`);
    });
    console.log(`\n🏆 WINNER: ${winnerIndices.map(i => propertyData[i].name.split(',')[0]).join(' & ')} with score ${maxScore}`);

    // ALERT if all properties have sparse data
    const allSparse = propertyData.every(p => p.totalFeatures <= 1);
    if (allSparse) {
      console.warn('⚠️ WARNING: All properties have minimal kitchen feature data!');
      console.warn('   The kitchenFeatures field appears to be empty or contains very basic descriptions.');
      console.warn('   For accurate luxury scoring, please populate detailed kitchen descriptions including:');
      console.warn('   - Specific appliance brands (Wolf, Viking, Sub-Zero, Miele, etc.)');
      console.warn('   - Layout details (Open with Island, Galley, etc.)');
      console.warn('   - Finish details (Quartz counters, Soft-close drawers, Butler pantry, etc.)');
    }
    console.log('═══════════════════════════════════════════════════════════════\n');
  }, [homes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      {/* Chart ID Label */}
      <div className="absolute -top-3 left-3 text-xs font-mono text-gray-400">
        Chart 6-4
      </div>

      {/* Brain Widget */}
      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Smart</span>
        <span className="text-base font-bold" style={{ color: getScoreColor(maxScore) }}>
          {maxScore}
        </span>
      </div>

      <h3 className="text-xl font-semibold text-white mb-2">Chart 6-4: Luxury Kitchen Features</h3>
      <p className="text-xs text-gray-400 mb-6">Premium appliances, finishes, and layout scoring</p>

      {/* Property Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            {/* Property Name */}
            <motion.div
              className="text-sm font-semibold text-white mb-3"
              animate={{ height: hoveredCard === prop.id ? 'auto' : '1.25rem' }}
              transition={{ duration: 0.3 }}
            >
              {hoveredCard === prop.id ? (
                <div className="leading-tight">{prop.name}</div>
              ) : (
                <div className="truncate">{prop.name.split(',')[0]}</div>
              )}
            </motion.div>

            {/* Final Score Badge */}
            <div className="flex items-center justify-center mb-4">
              <div className="px-4 py-2 rounded-lg" style={{
                background: `${getScoreColor(prop.finalScore)}20`,
                border: `2px solid ${getScoreColor(prop.finalScore)}`
              }}>
                <div className="text-2xl font-bold" style={{ color: getScoreColor(prop.finalScore) }}>
                  {prop.finalScore}
                </div>
                <div className="text-[10px] text-gray-400 text-center">/ 100</div>
              </div>
            </div>

            {/* Feature Breakdown */}
            <div className="space-y-3">
              {/* Luxury Appliances */}
              <div>
                <div className="text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                  <span>Luxury Appliances</span>
                  <span className="text-[10px] text-gray-400">{prop.applianceCount}/5</span>
                </div>
                {prop.applianceCount > 0 ? (
                  <div className="space-y-1">
                    {Object.entries({
                      wolfViking: 'Wolf/Viking Stove',
                      subZero: 'Sub-Zero Fridge',
                      restaurantHood: 'Restaurant Hood',
                      inductionGas: 'Induction/Gas Cooktop',
                      miele: 'Miele Dishwasher'
                    })
                      .filter(([key]) => prop.appliances[key as keyof typeof prop.appliances])
                      .map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2 text-xs">
                          <span className="text-green-400">✓</span>
                          <span className="text-orange-400 font-medium">{label}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 italic">No luxury appliances detected</div>
                )}
              </div>

              {/* Luxury Finishes */}
              <div>
                <div className="text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                  <span>Luxury Finishes</span>
                  <span className="text-[10px] text-gray-400">{prop.finishCount}/5</span>
                </div>
                {prop.finishCount > 0 ? (
                  <div className="space-y-1">
                    {Object.entries({
                      solidSurface: 'Solid Surface Counters',
                      pantry: 'Pantry',
                      quietClose: 'Quiet-Close Drawers',
                      solidCabinets: 'Solid Wood Cabinets',
                      builtIns: 'Built-in Features'
                    })
                      .filter(([key]) => prop.finishes[key as keyof typeof prop.finishes])
                      .map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2 text-xs">
                          <span className="text-green-400">✓</span>
                          <span className="text-orange-400 font-medium">{label}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 italic">No luxury finishes detected</div>
                )}
              </div>

              {/* Layout */}
              <div className="pt-2 border-t border-white/10">
                <div className="text-xs font-semibold text-gray-300 mb-1">Layout</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-200">{prop.layout.type}</span>
                  <span className="text-xs font-medium" style={{ color: prop.layout.color }}>
                    ×{prop.layout.multiplier}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <WinnerBadge
        winnerName={winnerIndices.map(i => propertyData[i].name.split(',')[0]).join(' & ')}
        score={maxScore}
        reason="Best overall luxury kitchen features"
      />

      <SmartScaleLegend description="CLUES scoring: (Feature Count × 10) × Layout Multiplier. Open Island kitchens with luxury appliances and finishes achieve highest scores." />
    </motion.div>
  );
}

// ============================================
// CHART 6-5: Architectural Features (Property Cards)
// ============================================
function Chart6_5_ArchitecturalFeatures({ homes }: { homes: Home[] }) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Feature labels for Field 167
  const featureLabels: Record<string, string> = {
    'Cathedral Ceiling(s)': 'Cathedral Ceiling(s)',
    'Walk-In Closet(s)': 'Walk-In Closet(s)',
    'Primary Bedroom Main Floor': 'Primary Bedroom Main Floor',
    'Open Floor Plan': 'Open Floor Plan',
    'Crown Molding': 'Crown Molding',
    'Skylight(s)': 'Skylight(s)',
    'Wet Bar': 'Wet Bar',
    'Built-in Features': 'Built-in Features'
  };

  // Detect architectural features for each property
  const propertyData = homes.map(home => {
    const features = home.interiorFeatures || [];

    // Detect which features are present
    const detectedFeatures: Record<string, boolean> = {
      'Cathedral Ceiling(s)': features.includes('Cathedral Ceiling(s)'),
      'Walk-In Closet(s)': features.includes('Walk-In Closet(s)'),
      'Primary Bedroom Main Floor': features.includes('Primary Bedroom Main Floor'),
      'Open Floor Plan': features.includes('Open Floor Plan'),
      'Crown Molding': features.includes('Crown Molding'),
      'Skylight(s)': features.includes('Skylight(s)'),
      'Wet Bar': features.includes('Wet Bar'),
      'Built-in Features': features.includes('Built-in Features')
    };

    const featureCount = Object.values(detectedFeatures).filter(Boolean).length;
    const score = Math.round((featureCount / 8) * 100); // CLUES 0-100 scoring

    return {
      id: home.id || home.name,
      name: home.name,
      color: home.color,
      features: detectedFeatures,
      featureCount,
      score
    };
  });

  // Find winner
  const maxScore = Math.max(...propertyData.map(p => p.score));
  const winnerIndices = propertyData.map((p, i) => p.score === maxScore ? i : -1).filter(i => i !== -1);

  // Console logging for data wiring proof
  useEffect(() => {
    console.log('🔍 Chart 6-5: Architectural Features - SMART SCORING (Field 167):');
    propertyData.forEach((prop) => {
      console.log(`📊 ${prop.name.split(',')[0]}:`);
      console.log(`  Raw interiorFeatures array:`, homes.find(h => h.name === prop.name)?.interiorFeatures);
      console.log(`  Feature count: ${prop.featureCount}/8`);
      console.log(`  🧠 SMART SCORE: ${prop.score}/100 (${getScoreLabel(prop.score)})`);
      console.log('  Detected features:', Object.entries(prop.features).filter(([_, val]) => val).map(([key]) => key));
    });
    console.log(`🏆 WINNER: ${winnerIndices.map(i => propertyData[i].name.split(',')[0]).join(' & ')} with score ${maxScore}`);
  }, [homes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      {/* Chart ID Label */}
      <div className="absolute -top-3 left-3 text-xs font-mono text-gray-400">
        Chart 6-5
      </div>

      {/* Brain Widget */}
      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Smart</span>
        <span className="text-base font-bold" style={{ color: getScoreColor(maxScore) }}>
          {maxScore}
        </span>
      </div>

      <h3 className="text-xl font-semibold text-white mb-2">Chart 6-5: Architectural Features</h3>
      <p className="text-xs text-gray-400 mb-6">Premium design elements and layout features from Field 167</p>

      {/* Property Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {propertyData.map((prop) => (
          <motion.div
            key={prop.id}
            animate={{ scale: hoveredCard === prop.id ? 1.05 : 1 }}
            onMouseEnter={() => setHoveredCard(prop.id)}
            onMouseLeave={() => setHoveredCard(null)}
            className="relative p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer"
            style={{
              borderColor: prop.color,
              background: `linear-gradient(135deg, ${prop.color}15 0%, ${prop.color}05 100%)`,
              boxShadow: hoveredCard === prop.id
                ? `0 0 40px ${prop.color}80`
                : `0 0 20px ${prop.color}40`,
            }}
          >
            {/* Property Name */}
            <div className="mb-3">
              <div
                className="text-sm font-bold transition-all duration-300"
                style={{
                  color: prop.color,
                  fontSize: hoveredCard === prop.id ? '15px' : '14px'
                }}
              >
                {hoveredCard === prop.id ? prop.name : prop.name.split(',')[0]}
              </div>
            </div>

            {/* Circular Progress Indicator */}
            <div className="flex items-center justify-center mb-4">
              <svg viewBox="0 0 120 120" className="w-28 h-28">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="10"
                />

                {/* Progress arc - colored by CLUES-Smart score */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={getScoreColor(prop.score)}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(prop.featureCount / 8) * 314} 314`}
                  transform="rotate(-90 60 60)"
                  style={{
                    filter: `drop-shadow(0 0 8px ${getScoreColor(prop.score)}80)`,
                    transition: 'stroke-dasharray 0.6s ease'
                  }}
                />

                {/* Center text */}
                <text
                  x="60"
                  y="55"
                  textAnchor="middle"
                  fill={prop.color}
                  fontSize="28"
                  fontWeight="bold"
                >
                  {prop.featureCount}
                </text>
                <text
                  x="60"
                  y="72"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.7)"
                  fontSize="14"
                  fontWeight="600"
                >
                  / 8
                </text>
              </svg>
            </div>

            {/* Score Display */}
            <div className="text-center mb-3">
              <div className="text-lg font-bold" style={{ color: getScoreColor(prop.score) }}>
                {prop.score}/100
              </div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                {getScoreLabel(prop.score)}
              </div>
            </div>

            {/* Detected Features List */}
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {prop.featureCount > 0 ? (
                Object.entries(featureLabels)
                  .filter(([key]) => prop.features[key])
                  .map(([key, label]) => (
                    <div key={key} className="flex items-start gap-2 text-xs">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span className="text-orange-400 font-medium leading-tight">{label}</span>
                    </div>
                  ))
              ) : (
                <div className="text-xs text-gray-500 italic text-center py-2">
                  No architectural features detected
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <WinnerBadge
        winnerName={winnerIndices.map(i => propertyData[i].name.split(',')[0]).join(' & ')}
        score={maxScore}
        reason="Most premium architectural features"
      />

      <SmartScaleLegend description="8 Interior Architectural Features: (1) Cathedral Ceiling(s), (2) Walk-In Closet(s), (3) Primary Bedroom Main Floor, (4) Open Floor Plan, (5) Crown Molding, (6) Skylight(s), (7) Wet Bar, (8) Built-in Features. CLUES-Smart scoring: Each feature adds 12.5 points. 0-20 (Red/Poor), 21-40 (Orange/Fair), 41-60 (Yellow/Average), 61-80 (Blue/Good), 81-100 (Green/Excellent)." />
    </motion.div>
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
        <Chart6_2_FlooringTypeDistribution homes={homes} />
        <Chart6_3_ApplianceCounts homes={homes} />
        <Chart6_4_KitchenFeatures homes={homes} />
        <Chart6_5_ArchitecturalFeatures homes={homes} />
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
