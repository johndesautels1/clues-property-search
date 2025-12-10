/**
 * Section 5: Structure & Systems Visualizations (Fields 39-48)
 * Advanced, multi-dimensional charts focused on big-ticket risk, structure vs cosmetics,
 * daily convenience, value for money, and system balance.
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
  ScatterChart,
  Scatter,
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
// DATA INTERFACE
// ============================================
export interface Home {
  id: string;
  name: string;

  // SECTION 5 FIELDS
  roofType: string;           // Field 39
  roofAgeEst: string;         // Field 40
  exteriorMaterial: string;   // Field 41 (proxy for construction/frame: block, brick, etc.)
  foundation: string;         // Field 42
  waterHeaterType: string;    // Field 43
  garageType: string;         // Field 44
  hvacType: string;           // Field 45
  hvacAge: string;            // Field 46
  laundryType: string;        // Field 47
  interiorCondition: string;  // Field 48

  // SUPPORTING FIELDS
  listingPrice?: number;

  // PROPERTY COLOR (for chart elements)
  color: string;
}

// ============================================
// SCORING HELPERS
// ============================================
function scoreHigherIsBetter(values: number[]): number[] {
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max === min) return values.map(() => 100);
  return values.map(v => Math.round(((v - min) / (max - min)) * 100));
}

function scoreLowerIsBetter(values: number[]): number[] {
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max === min) return values.map(() => 100);
  return values.map(v => Math.round(((max - v) / (max - min)) * 100));
}

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

// Small helper: extract numeric years from strings like "5 years", "10+ yrs"
function extractAgeYears(ageStr: string | undefined | null, fallback = 15): number {
  if (!ageStr) return fallback;
  const match = String(ageStr).match(/(\d+)/);
  const n = match ? parseInt(match[1], 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

// ============================================
// CHART 5-9: BIG TICKET RISK TIMELINE
// Remaining life for roof + HVAC (capex horizon)
// ============================================
function Chart5_9_BigTicketRisk({ homes }: { homes: Home[] }) {
  // Typical lifespans by type
  const roofLifespan: Record<string, number> = {
    Metal: 40,
    Tile: 30,
    Slate: 35,
    Shingle: 20,
    Flat: 15,
    Other: 20,
  };

  const hvacLifespan: Record<string, number> = {
    'Central A/C': 15,
    'Central AC': 15,
    'Ductless Mini-Split': 18,
    'Heat Pump': 15,
    'Window Unit': 10,
    Other: 12,
  };

  const chartData = homes.map((h) => {
    const roofType = h.roofType || 'Other';
    const hvacType = h.hvacType || 'Other';

    const roofYears = extractAgeYears(h.roofAgeEst, 15);
    const hvacYears = extractAgeYears(h.hvacAge, 10);

    const roofLife = roofLifespan[roofType] ?? roofLifespan.Other;
    const hvacLife = hvacLifespan[hvacType] ?? hvacLifespan.Other;

    const roofRemaining = Math.max(0, roofLife - roofYears);
    const hvacRemaining = Math.max(0, hvacLife - hvacYears);

    // Use MIN remaining life as "next major capex" horizon
    const capexHorizon = Math.min(roofRemaining, hvacRemaining);
    return {
      name: h.name.split(',')[0],
      roofRemaining,
      hvacRemaining,
      capexHorizon,
      color: h.color,
      roofType,
      hvacType,
    };
  });

  const capexValues = chartData.map(d => d.capexHorizon);
  const scores = scoreHigherIsBetter(capexValues); // more remaining years = better

  const maxScore = Math.max(...scores);
  const winnerIndices = scores
    .map((s, i) => (s === maxScore ? i : -1))
    .filter(i => i !== -1);

  chartData.forEach((d, idx) => {
    (d as any).score = scores[idx];
  });

  useEffect(() => {
    console.log('🔍 Chart 5-9: Big Ticket Risk Timeline - SMART SCORING:');
    chartData.forEach((d: any) => {
      console.log(`📊 ${d.name}:`);
      console.log('  Roof Type / Remaining:', d.roofType, `${d.roofRemaining} years`);
      console.log('  HVAC Type / Remaining:', d.hvacType, `${d.hvacRemaining} years`);
      console.log('  Capex Horizon (min remaining):', d.capexHorizon, 'years');
      console.log(`  🧠 SMART SCORE: ${d.score}/100 (${getScoreLabel(d.score)})`);
    });
    console.log(`🏆 WINNER: ${winnerIndices.map(i => chartData[i].name).join(' & ')} with score ${maxScore}`);
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      {/* BRAIN WIDGET */}
      <div
        className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: `${getScoreColor(maxScore)}20`,
          border: `2px solid ${getScoreColor(maxScore)}`,
        }}
      >
        <span className="text-xl">🧠</span>
        <div className="text-xs">
          <div className="font-bold text-white">SMART Score</div>
          <div style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>
            {maxScore}/100
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">
        Chart 5-9: Big Ticket Risk Timeline (Roof & HVAC)
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Remaining life for roof and HVAC before major capital expense. Longer horizon = better.
      </p>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis
            dataKey="name"
            tick={{ fill: COLORS.text }}
            fontSize={12}
            fontWeight={600}
          />
          <YAxis
            tick={{ fill: COLORS.text }}
            label={{
              value: 'Remaining Life (Years)',
              angle: -90,
              position: 'insideLeft',
              fill: COLORS.text,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.tooltip,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: '#ffffff',
            }}
            labelStyle={{ color: '#ffffff' }}
            itemStyle={{ color: '#ffffff' }}
          />
          <Legend />
          <Bar dataKey="roofRemaining" name="Roof Remaining (yrs)" stackId="a">
            {chartData.map((d, idx) => (
              <Cell key={idx} fill={d.color} />
            ))}
          </Bar>
          <Bar dataKey="hvacRemaining" name="HVAC Remaining (yrs)" stackId="a">
            {chartData.map((d, idx) => (
              <Cell key={idx} fill={d.color} opacity={0.5} />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="capexHorizon"
            name="Next Big Ticket in (yrs)"
            stroke="#FFD700"
            strokeWidth={3}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* WINNER BADGE */}
      <div className="mt-4 flex justify-center">
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-xl"
          style={{
            background: `${getScoreColor(maxScore)}20`,
            border: `2px solid ${getScoreColor(maxScore)}`,
          }}
        >
          <span className="text-2xl">🏆</span>
          <div>
            <div className="text-sm font-bold text-white">
              Winner: {winnerIndices.map(i => chartData[i].name).join(' & ')}
            </div>
            <div className="text-xs text-gray-300">
              CLUES-Smart Score:{' '}
              <span
                style={{ color: getScoreColor(maxScore), fontWeight: 700 }}
              >
                {maxScore}/100
              </span>{' '}
              ({getScoreLabel(maxScore)}) - Longest runway before major roof/HVAC expense
            </div>
          </div>
        </div>
      </div>

      {/* SMART SCALE */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-purple-400">
        <p className="text-xs font-bold text-purple-300 mb-2">
          CLUES-Smart Score Scale:
        </p>
        <div className="grid grid-cols-5 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#4CAF50' }} />
            <span className="text-gray-300">81-100: Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#2196F3' }} />
            <span className="text-gray-300">61-80: Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FFEB3B' }} />
            <span className="text-gray-300">41-60: Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF9800' }} />
            <span className="text-gray-300">21-40: Fair</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF4444' }} />
            <span className="text-gray-300">0-20: Poor</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Properties with more remaining years before roof or HVAC replacement score higher.
        </p>
      </div>
    </div>
  );
}

// ============================================
// CHART 5-10: SHELL VS COSMETICS (SCATTER)
// Structure (roof/exterior/foundation) vs interior condition
// ============================================
function Chart5_10_ShellVsCosmetics({ homes }: { homes: Home[] }) {
  const roofQuality: Record<string, number> = {
    Metal: 100,
    Tile: 90,
    Slate: 85,
    Shingle: 60,
    Flat: 40,
    Other: 50,
  };

  const materialQuality: Record<string, number> = {
    Brick: 95,
    'Block/Stucco': 85,
    'Fiber Cement': 80,
    Stone: 90,
    'Vinyl Siding': 55,
    Wood: 50,
    Other: 60,
  };

  const foundationQuality: Record<string, number> = {
    Basement: 90,
    Slab: 85,
    'Crawl Space': 65,
    'Pier/Beam': 60,
    Other: 60,
  };

  const interiorQuality: Record<string, number> = {
    Excellent: 100,
    Renovated: 95,
    Good: 75,
    Fair: 50,
    'Needs Work': 25,
  };

  const chartData = homes.map((h) => {
    const shellScore = Math.round(
      (roofQuality[h.roofType] ?? roofQuality.Other) * 0.4 +
      (materialQuality[h.exteriorMaterial] ?? materialQuality.Other) * 0.35 +
      (foundationQuality[h.foundation] ?? foundationQuality.Other) * 0.25
    );

    const cosmeticsScore =
      interiorQuality[h.interiorCondition] ?? interiorQuality.Fair;

    // Composite for CLUES
    const composite = Math.round(shellScore * 0.6 + cosmeticsScore * 0.4);

    return {
      name: h.name.split(',')[0],
      shellScore,
      cosmeticsScore,
      composite,
      color: h.color,
    };
  });

  const composites = chartData.map(d => d.composite);
  const scores = scoreHigherIsBetter(composites);
  const maxScore = Math.max(...scores);
  const winnerIndices = scores
    .map((s, i) => (s === maxScore ? i : -1))
    .filter(i => i !== -1);

  chartData.forEach((d, idx) => {
    (d as any).score = scores[idx];
  });

  useEffect(() => {
    console.log('🔍 Chart 5-10: Shell vs Cosmetics - SMART SCORING:');
    chartData.forEach((d: any) => {
      console.log(`📊 ${d.name}:`);
      console.log('  Shell Score:', d.shellScore);
      console.log('  Cosmetics Score:', d.cosmeticsScore);
      console.log(`  🧠 COMPOSITE SMART SCORE: ${d.score}/100 (${getScoreLabel(d.score)})`);
    });
    console.log(`🏆 WINNER: ${winnerIndices.map(i => chartData[i].name).join(' & ')} with score ${maxScore}`);
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      {/* BRAIN WIDGET */}
      <div
        className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: `${getScoreColor(maxScore)}20`,
          border: `2px solid ${getScoreColor(maxScore)}`,
        }}
      >
        <span className="text-xl">🧠</span>
        <div className="text-xs">
          <div className="font-bold text-white">SMART Score</div>
          <div style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>
            {maxScore}/100
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">
        Chart 5-10: Shell vs Cosmetics (Structure vs Interior)
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Compares structural "bones" (roof, exterior, foundation) against interior finishes/condition.
      </p>

      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart>
          <CartesianGrid stroke={COLORS.grid} />
          <XAxis
            type="number"
            dataKey="shellScore"
            name="Shell Score"
            tick={{ fill: COLORS.text }}
            label={{ value: 'Shell Quality', position: 'insideBottom', fill: COLORS.text }}
          />
          <YAxis
            type="number"
            dataKey="cosmeticsScore"
            name="Cosmetics Score"
            tick={{ fill: COLORS.text }}
            label={{ value: 'Interior Condition', angle: -90, position: 'insideLeft', fill: COLORS.text }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: COLORS.tooltip,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: '#ffffff',
            }}
            labelStyle={{ color: '#ffffff' }}
            itemStyle={{ color: '#ffffff' }}
          />
          <Legend />
          <Scatter data={chartData} name="Properties">
            {chartData.map((d, idx) => (
              <Cell key={idx} fill={d.color} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* WINNER BADGE */}
      <div className="mt-4 flex justify-center">
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-xl"
          style={{
            background: `${getScoreColor(maxScore)}20`,
            border: `2px solid ${getScoreColor(maxScore)}`,
          }}
        >
          <span className="text-2xl">🏆</span>
          <div>
            <div className="text-sm font-bold text-white">
              Winner: {winnerIndices.map(i => chartData[i].name).join(' & ')}
            </div>
            <div className="text-xs text-gray-300">
              CLUES-Smart Score:{' '}
              <span
                style={{ color: getScoreColor(maxScore), fontWeight: 700 }}
              >
                {maxScore}/100
              </span>{' '}
              ({getScoreLabel(maxScore)}) - Best combination of strong shell and attractive interiors
            </div>
          </div>
        </div>
      </div>

      {/* SMART SCALE */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-purple-400">
        <p className="text-xs font-bold text-purple-300 mb-2">
          CLUES-Smart Score Scale:
        </p>
        <div className="grid grid-cols-5 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#4CAF50' }} />
            <span className="text-gray-300">81-100: Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#2196F3' }} />
            <span className="text-gray-300">61-80: Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FFEB3B' }} />
            <span className="text-gray-300">41-60: Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF9800' }} />
            <span className="text-gray-300">21-40: Fair</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF4444' }} />
            <span className="text-gray-300">0-20: Poor</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Highlights "lipstick" houses (high cosmetics, weak shell) vs "tanks" (strong shell, average finishes).
        </p>
      </div>
    </div>
  );
}

// ============================================
// CHART 5-11: GARAGE & LAUNDRY DAILY CONVENIENCE
// Radar chart for daily living friction
// ============================================
function Chart5_11_DailyConvenience({ homes }: { homes: Home[] }) {
  const garageScoreFromType = (s: string): number => {
    const t = (s || '').toLowerCase();
    if (t.includes('attached 3')) return 100;
    if (t.includes('attached 2')) return 95;
    if (t.includes('attached')) return 90;
    if (t.includes('detached')) return 75;
    if (t.includes('carport')) return 60;
    if (t.includes('none') || t === '') return 30;
    return 70;
  };

  const laundryScoreFromType = (s: string): number => {
    const t = (s || '').toLowerCase();
    if (t.includes('inside laundry room')) return 100;
    if (t.includes('inside') && t.includes('closet')) return 90;
    if (t.includes('inside')) return 85;
    if (t.includes('garage')) return 65;
    if (t.includes('hookup')) return 50;
    if (t.includes('none') || t === '') return 30;
    return 70;
  };

  const convenienceData = homes.map((h) => {
    const garage = garageScoreFromType(h.garageType);
    const laundry = laundryScoreFromType(h.laundryType);
    const daily = Math.round(garage * 0.6 + laundry * 0.4);

    return {
      name: h.name.split(',')[0],
      garage,
      laundry,
      daily,
      color: h.color,
    };
  });

  const composite = convenienceData.map(d => d.daily);
  const scores = scoreHigherIsBetter(composite);
  const maxScore = Math.max(...scores);
  const winnerIndices = scores
    .map((s, i) => (s === maxScore ? i : -1))
    .filter(i => i !== -1);

  convenienceData.forEach((d, idx) => {
    (d as any).score = scores[idx];
  });

  useEffect(() => {
    console.log('🔍 Chart 5-11: Daily Convenience (Garage & Laundry) - SMART SCORING:');
    convenienceData.forEach((d: any) => {
      console.log(`📊 ${d.name}:`);
      console.log('  Garage Convenience:', d.garage);
      console.log('  Laundry Convenience:', d.laundry);
      console.log('  Daily Score:', d.daily);
      console.log(`  🧠 SMART SCORE: ${d.score}/100 (${getScoreLabel(d.score)})`);
    });
    console.log(`🏆 WINNER: ${winnerIndices.map(i => convenienceData[i].name).join(' & ')} with score ${maxScore}`);
  }, [homes]);

  // Radar data structure: one row per metric, columns for each property p0, p1, p2...
  const radarData = [
    {
      metric: 'Garage Convenience',
      ...Object.fromEntries(convenienceData.map((d, i) => [`p${i}`, d.garage])),
    },
    {
      metric: 'Laundry Convenience',
      ...Object.fromEntries(convenienceData.map((d, i) => [`p${i}`, d.laundry])),
    },
    {
      metric: 'Overall Daily Convenience',
      ...Object.fromEntries(convenienceData.map((d, i) => [`p${i}`, d.daily])),
    },
  ];

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      {/* BRAIN WIDGET */}
      <div
        className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: `${getScoreColor(maxScore)}20`,
          border: `2px solid ${getScoreColor(maxScore)}`,
        }}
      >
        <span className="text-xl">🧠</span>
        <div className="text-xs">
          <div className="font-bold text-white">SMART Score</div>
          <div style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>
            {maxScore}/100
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">
        Chart 5-11: Daily Convenience (Garage & Laundry)
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Radar view of how easy each home is to live in day-to-day for parking, storage, and laundry.
      </p>

      <ResponsiveContainer width="100%" height={360}>
        <RadarChart data={radarData}>
          <PolarGrid stroke={COLORS.grid} />
          <PolarAngleAxis dataKey="metric" tick={{ fill: COLORS.text, fontSize: 11 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: COLORS.text }} />
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.tooltip,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: '#ffffff',
            }}
            labelStyle={{ color: '#ffffff' }}
            itemStyle={{ color: '#ffffff' }}
          />
          <Legend />
          {convenienceData.map((d, idx) => (
            <Radar
              key={idx}
              name={d.name}
              dataKey={`p${idx}`}
              stroke={d.color}
              fill={d.color}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>

      {/* WINNER BADGE */}
      <div className="mt-4 flex justify-center">
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-xl"
          style={{
            background: `${getScoreColor(maxScore)}20`,
            border: `2px solid ${getScoreColor(maxScore)}`,
          }}
        >
          <span className="text-2xl">🏆</span>
          <div>
            <div className="text-sm font-bold text-white">
              Winner: {winnerIndices.map(i => convenienceData[i].name).join(' & ')}
            </div>
            <div className="text-xs text-gray-300">
              CLUES-Smart Score:{' '}
              <span
                style={{ color: getScoreColor(maxScore), fontWeight: 700 }}
              >
                {maxScore}/100
              </span>{' '}
              ({getScoreLabel(maxScore)}) - Smoothest daily living experience for cars and laundry
            </div>
          </div>
        </div>
      </div>

      {/* SMART SCALE */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-purple-400">
        <p className="text-xs font-bold text-purple-300 mb-2">
          CLUES-Smart Score Scale:
        </p>
        <div className="grid grid-cols-5 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#4CAF50' }} />
            <span className="text-gray-300">81-100: Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#2196F3' }} />
            <span className="text-gray-300">61-80: Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FFEB3B' }} />
            <span className="text-gray-300">41-60: Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF9800' }} />
            <span className="text-gray-300">21-40: Fair</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF4444' }} />
            <span className="text-gray-300">0-20: Poor</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Favors attached garages and true inside laundry over detached/none/hookups.
        </p>
      </div>
    </div>
  );
}

// ============================================
// MAIN SECTION 5 ADVANCED WRAPPER
// ============================================
export interface Section5AdvancedChartsProps {
  homes: Home[];
}

export default function Section5AdvancedCharts({
  homes,
}: Section5AdvancedChartsProps) {
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
      <div className="flex items-center gap-3 px-6 py-4 bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 rounded-xl">
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
        <span className="text-sm font-medium text-purple-300">
          Advanced Structure & Systems Analysis (Charts 5-9 to 5-11)
        </span>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart5_9_BigTicketRisk homes={homes} />
        <Chart5_10_ShellVsCosmetics homes={homes} />
        <Chart5_11_DailyConvenience homes={homes} />
      </div>

      {/* Footer Note */}
      <div className="mt-6 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
        <p className="text-xs text-gray-400">
          <strong className="text-white">Advanced Analytics:</strong> These
          charts provide deeper insights into big-ticket risk timing, shell vs
          cosmetics tradeoffs, and daily convenience factors. Compare with
          charts 5-1 through 5-8 above to see different perspectives on the
          same data.
        </p>
      </div>
    </div>
  );
}
