/**
 * Section 5: Structure & Systems Charts (Fields 39-48)
 * Analyzes construction quality, building systems, and property condition
 * Score thresholds: 81-100 Excellent, 61-80 Good, 41-60 Average, 21-40 Fair, 0-20 Poor
 */

import { useEffect } from 'react';
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
// CHART 5-1: ROOF TYPE & QUALITY COMPARISON
// ============================================
function Chart5_1_RoofQuality({ homes }: { homes: Home[] }) {
  const roofQualityMap: { [key: string]: number } = {
    Metal: 100,
    Tile: 90,
    Slate: 85,
    Shingle: 60,
    Flat: 40,
    Other: 30,
  };

  const rawValues = homes.map((h) => {
    const roofType = h.roofType || 'Other';
    return roofQualityMap[roofType] || 50;
  });

  const scores = rawValues; // Already 0-100
  const maxScore = Math.max(...scores);
  const winnerIndices = scores.map((s, i) => (s === maxScore ? i : -1)).filter((i) => i !== -1);

  const chartData = homes.map((h, idx) => ({
    name: h.name.split(',')[0],
    roofType: h.roofType || 'Unknown',
    score: scores[idx],
    color: h.color,
  }));

  useEffect(() => {
    console.log('🔍 Chart 5-1: Roof Type & Quality - SMART SCORING:');
    chartData.forEach((d) => {
      console.log(`📊 ${d.name}:`);
      console.log('  Roof Type:', d.roofType);
      console.log(`  🧠 SMART SCORE: ${d.score}/100 (${getScoreLabel(d.score)})`);
    });
    console.log(
      `🏆 WINNER: ${winnerIndices.map((i) => homes[i].name.split(',')[0]).join(' & ')} with score ${maxScore}`
    );
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <BrainWidget score={maxScore} />
      <h3 className="text-lg font-semibold text-white mb-2">Chart 5-1: Roof Type & Quality Comparison</h3>
      <p className="text-xs text-gray-400 mb-4">
        Comparing roof types by material durability and longevity expectations
      </p>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis dataKey="name" tick={{ fill: COLORS.text }} fontSize={12} fontWeight={600} />
          <YAxis
            tick={{ fill: COLORS.text }}
            domain={[0, 100]}
            label={{ value: 'Quality Score', angle: -90, position: 'insideLeft', fill: COLORS.text }}
          />
          <Tooltip content={<CustomTooltip />} />
          {homes.map((h, idx) => (
            <Bar
              key={idx}
              dataKey="score"
              fill={h.color}
              name={`${h.name.split(',')[0]} (${chartData[idx].roofType})`}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <WinnerBadge
        winnerName={winnerIndices.map((i) => homes[i].name.split(',')[0]).join(' & ')}
        score={maxScore}
        reason="Superior roof material quality"
      />
      <SmartScaleLegend description="Roof types scored by material durability: Metal (100) > Tile (90) > Slate (85) > Shingle (60) > Flat (40) > Other (30)" />
    </div>
  );
}

// ============================================
// CHART 5-2: SYSTEM AGE ANALYSIS
// ============================================
function Chart5_2_SystemAge({ homes }: { homes: Home[] }) {
  const extractAge = (ageStr: string): number => {
    if (!ageStr) return 15;
    const match = ageStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 15;
  };

  const roofAges = homes.map((h) => extractAge(h.roofAgeEst));
  const hvacAges = homes.map((h) => extractAge(h.hvacAge));
  const avgAges = roofAges.map((r, i) => (r + hvacAges[i]) / 2);

  // Lower age = better score
  const maxAge = Math.max(...avgAges);
  const minAge = Math.min(...avgAges);
  const scores = avgAges.map((age) =>
    maxAge === minAge ? 50 : Math.round(((maxAge - age) / (maxAge - minAge)) * 100)
  );

  const maxScore = Math.max(...scores);
  const winnerIndices = scores.map((s, i) => (s === maxScore ? i : -1)).filter((i) => i !== -1);

  const chartData = homes.map((h, idx) => ({
    name: h.name.split(',')[0],
    roofAge: roofAges[idx],
    hvacAge: hvacAges[idx],
    avgAge: avgAges[idx],
    score: scores[idx],
    color: h.color,
  }));

  useEffect(() => {
    console.log('🔍 Chart 5-2: System Age Analysis - SMART SCORING:');
    chartData.forEach((d) => {
      console.log(`📊 ${d.name}:`);
      console.log('  Roof Age:', d.roofAge, 'years');
      console.log('  HVAC Age:', d.hvacAge, 'years');
      console.log('  Average Age:', d.avgAge.toFixed(1), 'years');
      console.log(`  🧠 SMART SCORE: ${d.score}/100 (${getScoreLabel(d.score)})`);
    });
    console.log(
      `🏆 WINNER: ${winnerIndices.map((i) => homes[i].name.split(',')[0]).join(' & ')} with score ${maxScore}`
    );
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <BrainWidget score={maxScore} />
      <h3 className="text-lg font-semibold text-white mb-2">Chart 5-2: System Age Analysis</h3>
      <p className="text-xs text-gray-400 mb-4">Comparing roof and HVAC age (newer systems score higher)</p>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis dataKey="name" tick={{ fill: COLORS.text }} fontSize={12} fontWeight={600} />
          <YAxis
            yAxisId="left"
            tick={{ fill: COLORS.text }}
            label={{ value: 'Age (Years)', angle: -90, position: 'insideLeft', fill: COLORS.text }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: COLORS.text }}
            domain={[0, 100]}
            label={{ value: 'Score', angle: 90, position: 'insideRight', fill: COLORS.text }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#ffffff' }} />
          {homes.map((h, idx) => (
            <>
              <Bar
                key={`roof-${idx}`}
                yAxisId="left"
                dataKey="roofAge"
                fill={h.color}
                opacity={0.7}
                name={`${h.name.split(',')[0]} Roof`}
              />
              <Bar
                key={`hvac-${idx}`}
                yAxisId="left"
                dataKey="hvacAge"
                fill={h.color}
                opacity={0.4}
                name={`${h.name.split(',')[0]} HVAC`}
              />
            </>
          ))}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="score"
            stroke="#FFD700"
            strokeWidth={3}
            name="Smart Score"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <WinnerBadge
        winnerName={winnerIndices.map((i) => homes[i].name.split(',')[0]).join(' & ')}
        score={maxScore}
        reason="Newest major systems"
      />
      <SmartScaleLegend description="Score based on average system age (roof + HVAC). Lower age = higher score. Newer systems reduce maintenance costs and increase reliability." />
    </div>
  );
}

// ============================================
// CHART 5-3: EXTERIOR MATERIAL QUALITY
// ============================================
function Chart5_3_ExteriorMaterial({ homes }: { homes: Home[] }) {
  const materialQualityMap: { [key: string]: number } = {
    Brick: 95,
    'Block/Stucco': 85,
    'Fiber Cement': 80,
    Stone: 90,
    'Vinyl Siding': 55,
    Wood: 50,
    Other: 40,
  };

  const rawValues = homes.map((h) => {
    const material = h.exteriorMaterial || 'Other';
    return materialQualityMap[material] || 50;
  });

  const scores = rawValues;
  const maxScore = Math.max(...scores);
  const winnerIndices = scores.map((s, i) => (s === maxScore ? i : -1)).filter((i) => i !== -1);

  const chartData = homes.map((h, idx) => ({
    name: h.name.split(',')[0],
    material: h.exteriorMaterial || 'Unknown',
    score: scores[idx],
    color: h.color,
  }));

  useEffect(() => {
    console.log('🔍 Chart 5-3: Exterior Material Quality - SMART SCORING:');
    chartData.forEach((d) => {
      console.log(`📊 ${d.name}:`);
      console.log('  Material:', d.material);
      console.log(`  🧠 SMART SCORE: ${d.score}/100 (${getScoreLabel(d.score)})`);
    });
    console.log(
      `🏆 WINNER: ${winnerIndices.map((i) => homes[i].name.split(',')[0]).join(' & ')} with score ${maxScore}`
    );
  }, [homes]);

  const pieData = chartData.map((d) => ({
    name: `${d.name} - ${d.material}`,
    value: d.score,
    fill: d.color,
  }));

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <BrainWidget score={maxScore} />
      <h3 className="text-lg font-semibold text-white mb-2">Chart 5-3: Exterior Material Quality</h3>
      <p className="text-xs text-gray-400 mb-4">
        Comparing exterior materials by durability and maintenance requirements
      </p>

      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <WinnerBadge
        winnerName={winnerIndices.map((i) => homes[i].name.split(',')[0]).join(' & ')}
        score={maxScore}
        reason="Most durable exterior material"
      />
      <SmartScaleLegend description="Materials scored by durability: Brick (95) > Stone (90) > Block/Stucco (85) > Fiber Cement (80) > Vinyl (55) > Wood (50)" />
    </div>
  );
}

// ============================================
// CHART 5-4: FOUNDATION TYPE COMPARISON
// ============================================
function Chart5_4_Foundation({ homes }: { homes: Home[] }) {
  const foundationQualityMap: { [key: string]: number } = {
    Basement: 90,
    Slab: 85,
    'Crawl Space': 65,
    'Pier/Beam': 60,
    Other: 40,
  };

  const rawValues = homes.map((h) => {
    const foundation = h.foundation || 'Other';
    return foundationQualityMap[foundation] || 50;
  });

  const scores = rawValues;
  const maxScore = Math.max(...scores);
  const winnerIndices = scores.map((s, i) => (s === maxScore ? i : -1)).filter((i) => i !== -1);

  const chartData = homes.map((h, idx) => ({
    name: h.name.split(',')[0],
    foundation: h.foundation || 'Unknown',
    score: scores[idx],
    color: h.color,
  }));

  useEffect(() => {
    console.log('🔍 Chart 5-4: Foundation Type Comparison - SMART SCORING:');
    chartData.forEach((d) => {
      console.log(`📊 ${d.name}:`);
      console.log('  Foundation:', d.foundation);
      console.log(`  🧠 SMART SCORE: ${d.score}/100 (${getScoreLabel(d.score)})`);
    });
    console.log(
      `🏆 WINNER: ${winnerIndices.map((i) => homes[i].name.split(',')[0]).join(' & ')} with score ${maxScore}`
    );
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <BrainWidget score={maxScore} />
      <h3 className="text-lg font-semibold text-white mb-2">Chart 5-4: Foundation Type Comparison</h3>
      <p className="text-xs text-gray-400 mb-4">Comparing foundation types by structural quality and maintenance</p>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: COLORS.text }} />
          <YAxis type="category" dataKey="name" tick={{ fill: COLORS.text }} fontSize={12} fontWeight={600} />
          <Tooltip content={<CustomTooltip />} />
          {homes.map((h, idx) => (
            <Bar
              key={idx}
              dataKey="score"
              fill={h.color}
              name={`${h.name.split(',')[0]} (${chartData[idx].foundation})`}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <WinnerBadge
        winnerName={winnerIndices.map((i) => homes[i].name.split(',')[0]).join(' & ')}
        score={maxScore}
        reason="Best foundation type"
      />
      <SmartScaleLegend description="Foundations scored by quality: Basement (90) > Slab (85) > Crawl Space (65) > Pier/Beam (60)" />
    </div>
  );
}

// ============================================
// CHART 5-5: INTERIOR CONDITION SCORING
// ============================================
function Chart5_5_InteriorCondition({ homes }: { homes: Home[] }) {
  const conditionQualityMap: { [key: string]: number } = {
    Excellent: 100,
    Renovated: 95,
    Good: 75,
    Fair: 50,
    'Needs Work': 25,
  };

  const rawValues = homes.map((h) => {
    const condition = h.interiorCondition || 'Fair';
    return conditionQualityMap[condition] || 50;
  });

  const scores = rawValues;
  const maxScore = Math.max(...scores);
  const winnerIndices = scores.map((s, i) => (s === maxScore ? i : -1)).filter((i) => i !== -1);

  const chartData = homes.map((h, idx) => ({
    name: h.name.split(',')[0],
    condition: h.interiorCondition || 'Unknown',
    score: scores[idx],
    color: h.color,
  }));

  useEffect(() => {
    console.log('🔍 Chart 5-5: Interior Condition Scoring - SMART SCORING:');
    chartData.forEach((d) => {
      console.log(`📊 ${d.name}:`);
      console.log('  Condition:', d.condition);
      console.log(`  🧠 SMART SCORE: ${d.score}/100 (${getScoreLabel(d.score)})`);
    });
    console.log(
      `🏆 WINNER: ${winnerIndices.map((i) => homes[i].name.split(',')[0]).join(' & ')} with score ${maxScore}`
    );
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <BrainWidget score={maxScore} />
      <h3 className="text-lg font-semibold text-white mb-2">Chart 5-5: Interior Condition Scoring</h3>
      <p className="text-xs text-gray-400 mb-4">Comparing interior condition ratings for move-in readiness</p>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis dataKey="name" tick={{ fill: COLORS.text }} fontSize={12} fontWeight={600} />
          <YAxis
            tick={{ fill: COLORS.text }}
            domain={[0, 100]}
            label={{ value: 'Condition Score', angle: -90, position: 'insideLeft', fill: COLORS.text }}
          />
          <Tooltip content={<CustomTooltip />} />
          {homes.map((h, idx) => (
            <Bar
              key={idx}
              dataKey="score"
              fill={h.color}
              name={`${h.name.split(',')[0]} (${chartData[idx].condition})`}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <WinnerBadge
        winnerName={winnerIndices.map((i) => homes[i].name.split(',')[0]).join(' & ')}
        score={maxScore}
        reason="Best interior condition"
      />
      <SmartScaleLegend description="Condition ratings: Excellent (100) > Renovated (95) > Good (75) > Fair (50) > Needs Work (25)" />
    </div>
  );
}

// ============================================
// CHART 5-6: WATER HEATER EFFICIENCY COMPARISON
// ============================================
function Chart5_6_WaterHeater({ homes }: { homes: Home[] }) {
  const heaterEfficiencyMap: { [key: string]: number } = {
    'Tankless Gas': 95,
    'Tankless Electric': 90,
    Solar: 100,
    'Heat Pump': 85,
    'Electric Tank': 55,
    'Gas Tank': 60,
    Other: 40,
  };

  const rawValues = homes.map((h) => {
    const heaterType = h.waterHeaterType || 'Other';
    let score = 40;
    Object.keys(heaterEfficiencyMap).forEach((key) => {
      if (heaterType.toLowerCase().includes(key.toLowerCase())) {
        score = heaterEfficiencyMap[key];
      }
    });
    return score;
  });

  const scores = rawValues;
  const maxScore = Math.max(...scores);
  const winnerIndices = scores.map((s, i) => (s === maxScore ? i : -1)).filter((i) => i !== -1);

  const chartData = homes.map((h, idx) => ({
    name: h.name.split(',')[0],
    heaterType: h.waterHeaterType || 'Unknown',
    score: scores[idx],
    color: h.color,
  }));

  useEffect(() => {
    console.log('🔍 Chart 5-6: Water Heater Efficiency - SMART SCORING:');
    chartData.forEach((d) => {
      console.log(`📊 ${d.name}:`);
      console.log('  Water Heater:', d.heaterType);
      console.log(`  🧠 SMART SCORE: ${d.score}/100 (${getScoreLabel(d.score)})`);
    });
    console.log(
      `🏆 WINNER: ${winnerIndices.map((i) => homes[i].name.split(',')[0]).join(' & ')} with score ${maxScore}`
    );
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <BrainWidget score={maxScore} />
      <h3 className="text-lg font-semibold text-white mb-2">Chart 5-6: Water Heater Efficiency</h3>
      <p className="text-xs text-gray-400 mb-4">
        Comparing water heater types by energy efficiency and operating cost
      </p>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis dataKey="name" tick={{ fill: COLORS.text }} fontSize={12} fontWeight={600} />
          <YAxis
            tick={{ fill: COLORS.text }}
            domain={[0, 100]}
            label={{ value: 'Efficiency Score', angle: -90, position: 'insideLeft', fill: COLORS.text }}
          />
          <Tooltip content={<CustomTooltip />} />
          {homes.map((h, idx) => (
            <Bar
              key={idx}
              dataKey="score"
              fill={h.color}
              name={`${h.name.split(',')[0]} (${chartData[idx].heaterType})`}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <WinnerBadge
        winnerName={winnerIndices.map((i) => homes[i].name.split(',')[0]).join(' & ')}
        score={maxScore}
        reason="Most efficient water heating"
      />
      <SmartScaleLegend description="Efficiency ranking: Solar (100) > Tankless Gas (95) > Tankless Electric (90) > Heat Pump (85) > Gas Tank (60) > Electric Tank (55)" />
    </div>
  );
}

// ============================================
// CHART 5-7: OVERALL STRUCTURE QUALITY RADAR
// ============================================
function Chart5_7_StructureRadar({ homes }: { homes: Home[] }) {
  const roofQualityMap: { [key: string]: number } = {
    Metal: 100,
    Tile: 90,
    Slate: 85,
    Shingle: 60,
    Flat: 40,
    Other: 30,
  };

  const materialQualityMap: { [key: string]: number } = {
    Brick: 95,
    'Block/Stucco': 85,
    'Fiber Cement': 80,
    Stone: 90,
    'Vinyl Siding': 55,
    Wood: 50,
    Other: 40,
  };

  const foundationQualityMap: { [key: string]: number } = {
    Basement: 90,
    Slab: 85,
    'Crawl Space': 65,
    'Pier/Beam': 60,
    Other: 40,
  };

  const conditionQualityMap: { [key: string]: number } = {
    Excellent: 100,
    Renovated: 95,
    Good: 75,
    Fair: 50,
    'Needs Work': 25,
  };

  const extractAge = (ageStr: string): number => {
    if (!ageStr) return 15;
    const match = ageStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 15;
  };

  const radarData = homes.map((h, idx) => {
    const roofAge = extractAge(h.roofAgeEst);
    const hvacAge = extractAge(h.hvacAge);
    const avgAge = (roofAge + hvacAge) / 2;
    const systemAgeScore = Math.max(0, 100 - avgAge * 5);

    return {
      property: h.name.split(',')[0],
      roofQuality: roofQualityMap[h.roofType || 'Other'] || 50,
      exteriorQuality: materialQualityMap[h.exteriorMaterial || 'Other'] || 50,
      foundationQuality: foundationQualityMap[h.foundation || 'Other'] || 50,
      interiorCondition: conditionQualityMap[h.interiorCondition || 'Fair'] || 50,
      systemAge: Math.round(systemAgeScore),
      color: h.color,
    };
  });

  const compositeScores = radarData.map((d) =>
    Math.round((d.roofQuality + d.exteriorQuality + d.foundationQuality + d.interiorCondition + d.systemAge) / 5)
  );

  const maxScore = Math.max(...compositeScores);
  const winnerIndices = compositeScores.map((s, i) => (s === maxScore ? i : -1)).filter((i) => i !== -1);

  useEffect(() => {
    console.log('🔍 Chart 5-7: Overall Structure Quality Radar - SMART SCORING:');
    radarData.forEach((d, idx) => {
      console.log(`📊 ${d.property}:`);
      console.log('  Roof Quality:', d.roofQuality);
      console.log('  Exterior Quality:', d.exteriorQuality);
      console.log('  Foundation Quality:', d.foundationQuality);
      console.log('  Interior Condition:', d.interiorCondition);
      console.log('  System Age Score:', d.systemAge);
      console.log(`  🧠 COMPOSITE SMART SCORE: ${compositeScores[idx]}/100 (${getScoreLabel(compositeScores[idx])})`);
    });
    console.log(
      `🏆 WINNER: ${winnerIndices.map((i) => homes[i].name.split(',')[0]).join(' & ')} with score ${maxScore}`
    );
  }, [homes]);

  const radarChartData = [
    {
      subject: 'Roof Quality',
      ...Object.fromEntries(radarData.map((d, i) => [`property${i}`, d.roofQuality])),
    },
    {
      subject: 'Exterior',
      ...Object.fromEntries(radarData.map((d, i) => [`property${i}`, d.exteriorQuality])),
    },
    {
      subject: 'Foundation',
      ...Object.fromEntries(radarData.map((d, i) => [`property${i}`, d.foundationQuality])),
    },
    {
      subject: 'Interior',
      ...Object.fromEntries(radarData.map((d, i) => [`property${i}`, d.interiorCondition])),
    },
    {
      subject: 'System Age',
      ...Object.fromEntries(radarData.map((d, i) => [`property${i}`, d.systemAge])),
    },
  ];

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <BrainWidget score={maxScore} />
      <h3 className="text-lg font-semibold text-white mb-2">Chart 5-7: Overall Structure Quality Radar</h3>
      <p className="text-xs text-gray-400 mb-4">Multi-dimensional comparison of all structural quality factors</p>

      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={radarChartData}>
          <PolarGrid stroke={COLORS.grid} />
          <PolarAngleAxis dataKey="subject" tick={{ fill: COLORS.text, fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: COLORS.text }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#ffffff' }} />
          {radarData.map((d, idx) => (
            <Radar
              key={idx}
              name={d.property}
              dataKey={`property${idx}`}
              stroke={d.color}
              fill={d.color}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>

      <WinnerBadge
        winnerName={winnerIndices.map((i) => homes[i].name.split(',')[0]).join(' & ')}
        score={maxScore}
        reason="Best overall structure quality"
      />
      <SmartScaleLegend description="Composite score averaging 5 dimensions: roof quality, exterior material, foundation type, interior condition, and system age." />
    </div>
  );
}

// ============================================
// CHART 5-8: CONSTRUCTION QUALITY COMPOSITE SCORE
// ============================================
function Chart5_8_CompositeScore({ homes }: { homes: Home[] }) {
  const roofQualityMap: { [key: string]: number } = {
    Metal: 100,
    Tile: 90,
    Slate: 85,
    Shingle: 60,
    Flat: 40,
    Other: 30,
  };

  const materialQualityMap: { [key: string]: number } = {
    Brick: 95,
    'Block/Stucco': 85,
    'Fiber Cement': 80,
    Stone: 90,
    'Vinyl Siding': 55,
    Wood: 50,
    Other: 40,
  };

  const foundationQualityMap: { [key: string]: number } = {
    Basement: 90,
    Slab: 85,
    'Crawl Space': 65,
    'Pier/Beam': 60,
    Other: 40,
  };

  const conditionQualityMap: { [key: string]: number } = {
    Excellent: 100,
    Renovated: 95,
    Good: 75,
    Fair: 50,
    'Needs Work': 25,
  };

  const heaterEfficiencyMap: { [key: string]: number } = {
    'Tankless Gas': 95,
    'Tankless Electric': 90,
    Solar: 100,
    'Heat Pump': 85,
    'Electric Tank': 55,
    'Gas Tank': 60,
    Other: 40,
  };

  const extractAge = (ageStr: string): number => {
    if (!ageStr) return 15;
    const match = ageStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 15;
  };

  const compositeScores = homes.map((h) => {
    const roofQuality = roofQualityMap[h.roofType || 'Other'] || 50;
    const exteriorQuality = materialQualityMap[h.exteriorMaterial || 'Other'] || 50;
    const foundationQuality = foundationQualityMap[h.foundation || 'Other'] || 50;
    const interiorQuality = conditionQualityMap[h.interiorCondition || 'Fair'] || 50;

    let heaterEfficiency = 40;
    const heaterType = h.waterHeaterType || 'Other';
    Object.keys(heaterEfficiencyMap).forEach((key) => {
      if (heaterType.toLowerCase().includes(key.toLowerCase())) {
        heaterEfficiency = heaterEfficiencyMap[key];
      }
    });

    const roofAge = extractAge(h.roofAgeEst);
    const hvacAge = extractAge(h.hvacAge);
    const avgAge = (roofAge + hvacAge) / 2;
    const systemAgeScore = Math.max(0, 100 - avgAge * 5);

    return Math.round(
      roofQuality * 0.15 +
        exteriorQuality * 0.15 +
        foundationQuality * 0.1 +
        interiorQuality * 0.25 +
        heaterEfficiency * 0.15 +
        systemAgeScore * 0.2
    );
  });

  const maxScore = Math.max(...compositeScores);
  const winnerIndices = compositeScores.map((s, i) => (s === maxScore ? i : -1)).filter((i) => i !== -1);

  const chartData = homes.map((h, idx) => ({
    name: h.name.split(',')[0],
    score: compositeScores[idx],
    color: h.color,
  }));

  useEffect(() => {
    console.log('🔍 Chart 5-8: Construction Quality Composite Score - SMART SCORING:');
    chartData.forEach((d) => {
      console.log(`📊 ${d.name}:`);
      console.log(`  🧠 FINAL COMPOSITE SMART SCORE: ${d.score}/100 (${getScoreLabel(d.score)})`);
    });
    console.log(
      `🏆 WINNER: ${winnerIndices.map((i) => homes[i].name.split(',')[0]).join(' & ')} with score ${maxScore}`
    );
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <BrainWidget score={maxScore} />
      <h3 className="text-lg font-semibold text-white mb-2">Chart 5-8: Construction Quality Composite Score</h3>
      <p className="text-xs text-gray-400 mb-4">
        Final comprehensive score combining all structure & systems factors
      </p>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis dataKey="name" tick={{ fill: COLORS.text }} fontSize={12} fontWeight={600} />
          <YAxis
            tick={{ fill: COLORS.text }}
            domain={[0, 100]}
            label={{ value: 'Composite Score', angle: -90, position: 'insideLeft', fill: COLORS.text }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="score" fill="#8884d8" stroke="#8884d8" fillOpacity={0.3} />
          {homes.map((h, idx) => (
            <Bar key={idx} dataKey="score" fill={h.color} name={h.name.split(',')[0]} />
          ))}
        </ComposedChart>
      </ResponsiveContainer>

      <WinnerBadge
        winnerName={winnerIndices.map((i) => homes[i].name.split(',')[0]).join(' & ')}
        score={maxScore}
        reason="Highest overall construction quality"
      />
      <SmartScaleLegend description="Weighted composite score: Roof (15%) + Exterior (15%) + Foundation (10%) + Interior Condition (25%) + Water Heater Efficiency (15%) + System Age (20%)" />
    </div>
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
      {/* Hero Section */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
        <span className="text-sm font-medium text-orange-300">
          Structure & Systems Comparison with CLUES-Smart Scoring
        </span>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart5_1_RoofQuality homes={homes} />
        <Chart5_2_SystemAge homes={homes} />
        <Chart5_3_ExteriorMaterial homes={homes} />
        <Chart5_4_Foundation homes={homes} />
        <Chart5_5_InteriorCondition homes={homes} />
        <Chart5_6_WaterHeater homes={homes} />
      </div>

      {/* Full-width advanced charts */}
      <div className="space-y-6">
        <Chart5_7_StructureRadar homes={homes} />
        <Chart5_8_CompositeScore homes={homes} />
      </div>

      {/* Footer Note */}
      <div className="mt-6 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
        <p className="text-xs text-gray-400">
          <strong className="text-white">CLUES-Smart Scoring:</strong> Each metric scores 0-100 comparing properties
          on structural quality, system efficiency, and condition. Higher scores indicate superior construction quality,
          newer systems, better materials, and lower future maintenance costs. The composite score provides a holistic
          view of overall property structure and systems quality across all dimensions.
        </p>
      </div>
    </div>
  );
}
