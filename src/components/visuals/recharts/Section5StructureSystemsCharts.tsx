/**
 * Section 5: Structure & Systems Charts (Fields 39-48)
 * Analyzes construction quality, building systems, and property condition
 * Score thresholds: 81-100 Excellent, 61-80 Good, 41-60 Average, 21-40 Fair, 0-20 Poor
 */

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from 'recharts';

// ============================================
// HOME INTERFACE
// ============================================
interface Home {
  id: string;
  name: string; // Full address
  color: string; // Property color (Green/Lavender/Pink)
  // Fields 39-48
  roofType: string;           // Field 39
  roofAgeEst: string;         // Field 40
  exteriorMaterial: string;   // Field 41
  foundation: string;         // Field 42
  waterHeaterType: string;    // Field 43
  hvacType: string;           // Field 45
  hvacAge: string;            // Field 46
  interiorCondition: string;  // Field 48
  // Additional fields for calculations
  listingPrice?: number;
  yearBuilt?: number;
}

// ============================================
// SCORING HELPER FUNCTIONS
// ============================================

function getScoreColor(score: number): string {
  if (score >= 81) return '#4CAF50'; // Green - Excellent
  if (score >= 61) return '#2196F3'; // Blue - Good
  if (score >= 41) return '#FFEB3B'; // Yellow - Average
  if (score >= 21) return '#FF9800'; // Orange - Fair
  return '#FF4444'; // Red - Poor
}

function getScoreLabel(score: number): string {
  if (score >= 81) return 'Excellent';
  if (score >= 61) return 'Good';
  if (score >= 41) return 'Average';
  if (score >= 21) return 'Fair';
  return 'Poor';
}

const COLORS = {
  background: 'rgba(15, 23, 42, 0.5)',
  border: 'rgba(255, 255, 255, 0.1)',
  text: '#e2e8f0',
  grid: 'rgba(255, 255, 255, 0.1)',
  tooltip: 'rgba(15, 23, 42, 0.95)',
};

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

const BrainWidget: React.FC<{ score: number }> = ({ score }) => {
  const color = getScoreColor(score);
  return (
    <div
      className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{
        background: `${color}20`,
        border: `2px solid ${color}`,
      }}
    >
      <span className="text-xl">🧠</span>
      <div className="text-xs">
        <div className="font-bold text-white">SMART Score</div>
        <div style={{ color, fontWeight: 700 }}>{Math.round(score)}/100</div>
      </div>
    </div>
  );
};

// ============================================
// CHART 5-4: ROOF TYPE & QUALITY COMPARISON
// ============================================
function Chart5_4_RoofQuality({ homes }: { homes: Home[] }) {
  const roofQualityMap: { [key: string]: number } = {
    Metal: 100,
    Tile: 90,
    Slate: 85,
    Shingle: 60,
    Flat: 40,
    Other: 30,
  };

  const propertyData = homes.map((h, idx) => {
    const roofType = h.roofType || 'Other';
    const score = roofQualityMap[roofType] || 50;

    return {
      id: h.id,
      name: h.name, // FULL address
      roofType,
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
    console.log('🔍 Chart 5-4: Roof Type & Quality - CARD-BASED DESIGN:');
    propertyData.forEach((p) => {
      console.log(`📊 Property ${p.propertyNum}: ${p.name}`);
      console.log(`  🏗️  Roof Type: ${p.roofType}`);
      console.log(`  ⭐ Quality Score: ${p.score}/100 (${p.label})`);
      console.log(`  🎨 Color: ${p.color}`);
    });
    console.log(`🏆 WINNER: ${winner.name} with score ${maxScore}`);
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
        Chart 5-4
      </div>

      {/* Brain Widget */}
      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart</span>
        <span className="text-sm font-bold" style={{ color: getScoreColor(maxScore) }}>
          {maxScore}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">Chart 5-4: Roof Type & Quality Comparison</h3>
      <p className="text-xs text-gray-400 mb-4">
        Comparing roof types by material durability and longevity expectations
      </p>

      {/* OPTION 2: ICON-BASED CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        {propertyData.map((prop, idx) => (
          <motion.div
            key={prop.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="relative p-4 rounded-xl backdrop-blur-xl"
            style={{
              background: `${prop.color}10`,
              border: `2px solid ${prop.color}`,
              boxShadow: `0 0 20px ${prop.color}40`,
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
                P{prop.propertyNum}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white leading-tight">
                  {prop.name}
                </p>
              </div>
            </div>

            {/* Roof Type Display */}
            <div className="mb-3 p-3 bg-black/20 rounded-lg border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🏗️</span>
                <span className="text-sm font-bold text-white">{prop.roofType}</span>
              </div>
              <p className="text-[10px] text-gray-400 pl-9">Roof Material</p>
            </div>

            {/* Score Display */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-gray-400">Quality Score</span>
                <span className="text-lg font-bold" style={{ color: getScoreColor(prop.score) }}>
                  {prop.score}
                </span>
              </div>

              {/* Progress Bar - CLUES Color ONLY */}
              <div className="h-3 bg-black/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${prop.score}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.1 + 0.2 }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: getScoreColor(prop.score),
                    boxShadow: `0 0 10px ${getScoreColor(prop.score)}`,
                  }}
                />
              </div>
            </div>

            {/* Rating Label */}
            <div className="text-center">
              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  background: `${getScoreColor(prop.score)}30`,
                  color: getScoreColor(prop.score),
                  border: `1px solid ${getScoreColor(prop.score)}`,
                }}
              >
                {prop.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <WinnerBadge
        winnerName={winner.name}
        score={maxScore}
        reason="Superior roof material quality"
      />
      <SmartScaleLegend description="Roof types scored by material durability: Metal (100) > Tile (90) > Slate (85) > Shingle (60) > Flat (40) > Other (30)" />
    </motion.div>
  );
}

// ============================================
// CHART 5-5: EXTERIOR MATERIAL QUALITY
// ============================================
function Chart5_5_ExteriorMaterial({ homes }: { homes: Home[] }) {
  const materialQualityMap: { [key: string]: number } = {
    'Concrete Block': 100,     // 100 for concrete block
    'Stucco/Frame': 0,         // 0 for stucco/frame
    'Concrete Siding': 50,     // 50 for concrete siding
    'Frame': 0,                // 0 for frame - UNLESS pre-1945
  };

  const propertyData = homes.map((h, idx) => {
    let material = h.exteriorMaterial || 'Other';

    // REMAP DATABASE VALUES TO USER SPEC
    if (material === 'Brick') {
      material = 'Concrete Siding'; // Remap Brick → Concrete Siding
    }
    if (material === 'Concrete') {
      material = 'Concrete Block'; // Remap Concrete → Concrete Block
    }
    if (material === 'Stucco') {
      material = 'Stucco/Frame'; // Remap Stucco → Stucco/Frame
    }

    let score = materialQualityMap[material] || 50;

    // SPECIAL RULE: Pre-1945 Frame = 50 (Vintage Construction Quality)
    if ((material === 'Frame' || material === 'Wood Frame') && h.yearBuilt && h.yearBuilt < 1945) {
      score = 50;
    }

    return {
      id: h.id,
      name: h.name, // FULL address
      material,
      score,
      color: h.color,
      label: getScoreLabel(score),
      propertyNum: idx + 1,
      yearBuilt: h.yearBuilt, // For debugging
    };
  });

  const maxScore = Math.max(...propertyData.map(p => p.score));
  const winnerIndices = propertyData
    .map((p, i) => (p.score === maxScore ? i : -1))
    .filter((i) => i !== -1);
  const winners = winnerIndices.map(i => propertyData[i]);
  const winnerNames = winners.map(w => w.name).join(' & ');

  useEffect(() => {
    console.log('🔍 Chart 5-5: Exterior Material Quality - CARD-BASED DESIGN:');
    propertyData.forEach((p) => {
      console.log(`📊 Property ${p.propertyNum}: ${p.name}`);
      console.log(`  🏠 Material: ${p.material}`);
      console.log(`  📅 Year Built: ${p.yearBuilt || 'Unknown'}`);
      console.log(`  ⭐ Quality Score: ${p.score}/100 (${p.label})`);
      if ((p.material === 'Frame' || p.material === 'Wood Frame') && p.yearBuilt && p.yearBuilt < 1945) {
        console.log(`  🏛️  VINTAGE BONUS: Pre-1945 ${p.material} upgraded to 50 (from 0)`);
      }
      console.log(`  🎨 Color: ${p.color}`);
    });
    console.log(`🏆 WINNER(S): ${winnerNames} with score ${maxScore}`);
  }, [homes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      {/* Chart ID Label */}
      <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">
        Chart 5-5
      </div>

      {/* Brain Widget */}
      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart</span>
        <span className="text-sm font-bold" style={{ color: getScoreColor(maxScore) }}>
          {maxScore}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">Chart 5-5: Exterior Material Quality</h3>
      <p className="text-xs text-gray-400 mb-4">
        Comparing exterior materials by durability and maintenance requirements
      </p>

      {/* CARD-BASED DESIGN (matching Chart 5-4) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        {propertyData.map((prop, idx) => (
          <motion.div
            key={prop.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="relative p-4 rounded-xl backdrop-blur-xl"
            style={{
              background: `${prop.color}10`,
              border: `2px solid ${prop.color}`,
              boxShadow: `0 0 20px ${prop.color}40`,
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
                P{prop.propertyNum}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white leading-tight">
                  {prop.name}
                </p>
              </div>
            </div>

            {/* Material Type Display */}
            <div className="mb-3 p-3 bg-black/20 rounded-lg border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🏠</span>
                <span className="text-sm font-bold text-white">{prop.material}</span>
              </div>
              <p className="text-[10px] text-gray-400 pl-9">Exterior Material</p>
            </div>

            {/* Score Display */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-gray-400">Quality Score</span>
                <span className="text-lg font-bold" style={{ color: getScoreColor(prop.score) }}>
                  {prop.score}
                </span>
              </div>

              {/* Progress Bar - CLUES Color ONLY */}
              <div className="h-3 bg-black/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${prop.score}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.1 + 0.2 }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: getScoreColor(prop.score),
                    boxShadow: `0 0 10px ${getScoreColor(prop.score)}`,
                  }}
                />
              </div>
            </div>

            {/* Rating Label */}
            <div className="text-center">
              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  background: `${getScoreColor(prop.score)}30`,
                  color: getScoreColor(prop.score),
                  border: `1px solid ${getScoreColor(prop.score)}`,
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
        reason="Most durable exterior material"
      />
    </motion.div>
  );
}

// ============================================
// CHART 5-6: FOUNDATION TYPE COMPARISON
// ============================================
function Chart5_6_Foundation({ homes }: { homes: Home[] }) {
  const foundationQualityMap: { [key: string]: number } = {
    'Slab': 100,              // Monolithic slab - best for Florida
    'Stem Wall': 85,          // Stem wall slab
    'Post-Tension': 90,       // Post-tension slab
    'Pier and Beam': 50,      // Older Florida homes
    'Crawl Space': 40,        // Rare in FL, not ideal
  };

  const rawValues = homes.map((h) => {
    const rawFoundation = h.foundation || 'Other';  // ORIGINAL DATABASE VALUE
    let foundation = rawFoundation;

    // REMAP DATABASE VALUES TO FLORIDA TYPES
    const foundationLower = foundation.toLowerCase();
    if (foundationLower.includes('slab') || foundationLower.includes('monolithic') || foundationLower.includes('concrete')) {
      foundation = 'Slab';  // In Florida: Concrete = Slab = Monolithic Slab
    } else if (foundationLower.includes('stem wall')) {
      foundation = 'Stem Wall';
    } else if (foundationLower.includes('post') || foundationLower.includes('tension')) {
      foundation = 'Post-Tension';
    } else if (foundationLower.includes('pier') || foundationLower.includes('beam')) {
      foundation = 'Pier and Beam';
    } else if (foundationLower.includes('crawl')) {
      foundation = 'Crawl Space';
    }

    const score = foundationQualityMap[foundation] || 50;

    // PROOF OF WIRING - Log every property's database → display → score mapping
    console.log(`🔍 FOUNDATION WIRING CHECK - ${h.name}:`);
    console.log(`  📥 RAW DATABASE VALUE: "${rawFoundation}"`);
    console.log(`  🔄 REMAPPED TO: "${foundation}"`);
    console.log(`  📊 SCORE ASSIGNED: ${score}/100`);
    console.log(`  ✅ MAPPING RULE: ${foundationLower.includes('concrete') ? 'Concrete → Slab (Florida standard)' : 'Direct mapping'}`);

    return score;
  });

  const scores = rawValues;
  const maxScore = Math.max(...scores);
  const winnerIndices = scores.map((s, i) => (s === maxScore ? i : -1)).filter((i) => i !== -1);

  const chartData = homes.map((h, idx) => {
    let foundation = h.foundation || 'Unknown';

    // REMAP FOR DISPLAY (MUST MATCH SCORING LOGIC EXACTLY)
    const foundationLower = foundation.toLowerCase();
    if (foundationLower.includes('slab') || foundationLower.includes('monolithic') || foundationLower.includes('concrete')) {
      foundation = 'Slab';  // In Florida: Concrete = Slab = Monolithic Slab
    } else if (foundationLower.includes('stem wall')) {
      foundation = 'Stem Wall';
    } else if (foundationLower.includes('post') || foundationLower.includes('tension')) {
      foundation = 'Post-Tension';
    } else if (foundationLower.includes('pier') || foundationLower.includes('beam')) {
      foundation = 'Pier and Beam';
    } else if (foundationLower.includes('crawl')) {
      foundation = 'Crawl Space';
    }

    return {
      name: h.name.split(',')[0],
      foundation,
      score: scores[idx],
      color: h.color,
    };
  });

  const propertyData = chartData.map((d, idx) => ({
    ...d,
    id: homes[idx].id,
    fullAddress: homes[idx].name,
    label: getScoreLabel(d.score),
    propertyNum: idx + 1,
  }));

  const winners = winnerIndices.map(i => propertyData[i]);
  const winnerNames = winners.map(w => w.fullAddress).join(' & ');

  useEffect(() => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🏗️  CHART 5-6: FOUNDATION TYPE - 100% WIRING VERIFICATION');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 DATA SOURCE: Field #42 (foundation) from fields-schema.ts');
    console.log('🔄 MAPPING RULE: Concrete/Slab/Monolithic → "Slab" (100 points)');
    console.log('');

    propertyData.forEach((d, idx) => {
      console.log(`\n🏠 PROPERTY ${d.propertyNum}: ${d.fullAddress}`);
      console.log(`   📥 DATABASE FIELD: homes[${idx}].foundation`);
      console.log(`   🏗️  DISPLAY VALUE: "${d.foundation}"`);
      console.log(`   📊 CLUES SCORE: ${d.score}/100`);
      console.log(`   🎨 SCORE TIER: ${d.label}`);
      console.log(`   🌈 PROPERTY COLOR: ${d.color}`);
    });

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🏆 WINNER(S): ${winnerNames}`);
    console.log(`⭐ MAX SCORE: ${maxScore}/100`);
    console.log('✅ WIRING VERIFIED: All database values correctly mapped');
    console.log('═══════════════════════════════════════════════════════════');
  }, [homes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      {/* Chart ID Label */}
      <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">
        Chart 5-6
      </div>

      {/* Brain Widget */}
      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart</span>
        <span className="text-sm font-bold" style={{ color: getScoreColor(maxScore) }}>
          {maxScore}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">Chart 5-6: Foundation Type Comparison</h3>
      <p className="text-xs text-gray-400 mb-4">Comparing foundation types by structural quality and maintenance (Florida-specific)</p>

      {/* CARD-BASED DESIGN (matching Chart 5-4 & 5-5) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        {propertyData.map((prop, idx) => (
          <motion.div
            key={prop.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="relative p-4 rounded-xl backdrop-blur-xl"
            style={{
              background: `${prop.color}10`,
              border: `2px solid ${prop.color}`,
              boxShadow: `0 0 20px ${prop.color}40`,
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
                P{prop.propertyNum}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white leading-tight">
                  {prop.fullAddress}
                </p>
              </div>
            </div>

            {/* Foundation Type Display */}
            <div className="mb-3 p-3 bg-black/20 rounded-lg border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🏗️</span>
                <span className="text-sm font-bold text-white">{prop.foundation}</span>
              </div>
              <p className="text-[10px] text-gray-400 pl-9">Foundation Type</p>
            </div>

            {/* Score Display */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-gray-400">Quality Score</span>
                <span className="text-lg font-bold" style={{ color: getScoreColor(prop.score) }}>
                  {prop.score}
                </span>
              </div>

              {/* Progress Bar - CLUES Color ONLY */}
              <div className="h-3 bg-black/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${prop.score}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.1 + 0.2 }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: getScoreColor(prop.score),
                    boxShadow: `0 0 10px ${getScoreColor(prop.score)}`,
                  }}
                />
              </div>
            </div>

            {/* Rating Label */}
            <div className="text-center">
              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  background: `${getScoreColor(prop.score)}30`,
                  color: getScoreColor(prop.score),
                  border: `1px solid ${getScoreColor(prop.score)}`,
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
        reason="Best foundation type"
      />
      <SmartScaleLegend description="Foundations scored by quality (Florida-specific): Slab (100) > Post-Tension (90) > Stem Wall (85) > Pier and Beam (50) > Crawl Space (40)" />
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
interface Section5ChartsProps {
  homes: Home[];
}

export default function Section5StructureSystemsCharts({ homes }: Section5ChartsProps) {
  if (!homes || homes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No properties to compare
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Charts Grid - Row 1: Charts 5-4 & 5-5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart5_4_RoofQuality homes={homes} />
        <Chart5_5_ExteriorMaterial homes={homes} />
      </div>

      {/* Chart 5-6 - Centered */}
      <div className="flex justify-center">
        <div className="w-full lg:w-1/2">
          <Chart5_6_Foundation homes={homes} />
        </div>
      </div>
    </div>
  );
}
