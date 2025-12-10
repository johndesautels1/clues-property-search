/**
 * Property Basics Advanced Visualizations (Fields 17-29)
 * 5 Advanced chart types with FULL CLUES-Smart scoring integration
 * Score thresholds: 81-100 Excellent, 61-80 Good, 41-60 Average, 21-40 Fair, 0-20 Poor
 */

import { useEffect } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';

// Property data interface matching PropertyBasicsCharts
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
  parkingTotal: string | number;
  listingPrice: number;
  color: string;
}

interface PropertyBasicsAdvancedChartsProps {
  homes: Home[];
}

// Theme colors
const COLORS = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.1)',
  text: '#e2e8f0',
  grid: 'rgba(255, 255, 255, 0.1)',
  tooltip: 'rgba(15, 23, 42, 0.95)',
};

// CORRECT Score colors from Section 3 spec (NOT Tailwind colors!)
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

// Scoring function: higher values = better (for bedrooms, sqft, etc.)
function scoreHigherIsBetter(values: number[]): number[] {
  if (!values.length) return [];
  const validValues = values.filter(v => v > 0);
  if (!validValues.length) return values.map(() => 50);

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  if (max === min) return values.map(() => 50);

  return values.map((v) => {
    if (v <= 0) return 0;
    const percentile = (v - min) / (max - min);
    // Map to 0-100 continuous scale
    return Math.round(percentile * 100);
  });
}

// Scoring function: lower values = better (for age, coverage, etc.)
function scoreLowerIsBetter(values: number[]): number[] {
  if (!values.length) return [];
  const validValues = values.filter(v => v >= 0);
  if (!validValues.length) return values.map(() => 50);

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  if (max === min) return values.map(() => 50);

  return values.map((v) => {
    if (v < 0) return 0;
    const percentile = (max - v) / (max - min);
    return Math.round(percentile * 100);
  });
}

// ============================================
// CHART A-1: PROPERTY PROFILE RADAR WITH SMART SCORING
// Multi-dimensional overlay of all key property metrics
// ============================================
function PropertyProfileRadar({ homes }: { homes: Home[] }) {
  const currentYear = new Date().getFullYear();

  // Calculate DYNAMIC max values (not hardcoded!)
  const maxBedrooms = Math.max(...homes.map(h => h.bedrooms), 4);
  const maxBathrooms = Math.max(...homes.map(h => h.totalBathrooms), 4);
  const maxLivingSqft = Math.max(...homes.map(h => h.livingSqft), 3000);
  const maxLotAcres = Math.max(...homes.map(h => h.lotSizeAcres), 0.3);
  const maxGarage = Math.max(...homes.map(h => h.garageSpaces), 3);

  // Calculate scores for each dimension
  const bedroomScores = scoreHigherIsBetter(homes.map(h => h.bedrooms));
  const bathroomScores = scoreHigherIsBetter(homes.map(h => h.totalBathrooms));
  const livingScores = scoreHigherIsBetter(homes.map(h => h.livingSqft));
  const lotScores = scoreHigherIsBetter(homes.map(h => h.lotSizeAcres));
  const garageScores = scoreHigherIsBetter(homes.map(h => h.garageSpaces));

  // Newness: newer = better
  const ages = homes.map(h => currentYear - h.yearBuilt);
  const newnessScores = ages.map(age => Math.max(0, 100 - (age * 2)));

  // Calculate AGGREGATE RADAR SCORE (average of all 6 dimensions)
  const aggregateScores = homes.map((_, idx) => {
    const dimensionScores = [
      bedroomScores[idx],
      bathroomScores[idx],
      livingScores[idx],
      lotScores[idx],
      newnessScores[idx],
      garageScores[idx]
    ];
    return Math.round(dimensionScores.reduce((a, b) => a + b, 0) / 6);
  });

  const maxAggregateScore = Math.max(...aggregateScores);
  const winnerIndices = aggregateScores
    .map((s, i) => (s === maxAggregateScore ? i : -1))
    .filter(i => i !== -1);

  // Radar data structure
  const radarData = [
    {
      metric: 'Bedrooms',
      ...Object.fromEntries(homes.map((h, i) => [`prop${i}`, bedroomScores[i]]))
    },
    {
      metric: 'Bathrooms',
      ...Object.fromEntries(homes.map((h, i) => [`prop${i}`, bathroomScores[i]]))
    },
    {
      metric: 'Living Sqft',
      ...Object.fromEntries(homes.map((h, i) => [`prop${i}`, livingScores[i]]))
    },
    {
      metric: 'Lot Size',
      ...Object.fromEntries(homes.map((h, i) => [`prop${i}`, lotScores[i]]))
    },
    {
      metric: 'Newness',
      ...Object.fromEntries(homes.map((h, i) => [`prop${i}`, newnessScores[i]]))
    },
    {
      metric: 'Garage',
      ...Object.fromEntries(homes.map((h, i) => [`prop${i}`, garageScores[i]]))
    },
  ];

  useEffect(() => {
    console.log('🔍 Chart A-1: Property Profile Radar - SMART SCORING:');
    homes.forEach((h, idx) => {
      console.log(`📊 ${h.name}:`);
      console.log('  Raw values:', {
        bedrooms: h.bedrooms,
        bathrooms: h.totalBathrooms,
        livingSqft: h.livingSqft,
        lotAcres: h.lotSizeAcres,
        age: ages[idx],
        garage: h.garageSpaces,
      });
      console.log('  Dimension scores:', {
        bedrooms: bedroomScores[idx],
        bathrooms: bathroomScores[idx],
        living: livingScores[idx],
        lot: lotScores[idx],
        newness: newnessScores[idx],
        garage: garageScores[idx],
      });
      console.log(`  🧠 AGGREGATE SCORE: ${aggregateScores[idx]}/100 (${getScoreLabel(aggregateScores[idx])})`);
    });
    console.log(`🏆 WINNER: ${winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')} with score ${maxAggregateScore}`);
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      {/* Brain Widget - Top Right */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: `${getScoreColor(maxAggregateScore)}20`,
          border: `2px solid ${getScoreColor(maxAggregateScore)}`
        }}
      >
        <span className="text-xl">🧠</span>
        <div className="text-xs">
          <div className="font-bold text-white">SMART Score</div>
          <div style={{ color: getScoreColor(maxAggregateScore), fontWeight: 700 }}>
            {maxAggregateScore}/100
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-1">Chart 3-8: Property Profile Radar</h3>
      <p className="text-xs text-gray-400 mb-4 mt-3">6-dimensional comparison with aggregate scoring (larger filled area = better overall)</p>

      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={radarData}>
          <PolarGrid stroke={COLORS.grid} />
          <PolarAngleAxis dataKey="metric" stroke={COLORS.text} tick={{ fill: COLORS.text, fontSize: 11 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} stroke={COLORS.grid} tick={{ fill: COLORS.grid, fontSize: 9 }} />
          {homes.map((home, idx) => (
            <Radar
              key={home.id}
              name={home.name.split(',')[0]}
              dataKey={`prop${idx}`}
              stroke={home.color || '#22c55e'}
              fill={home.color || '#22c55e'}
              fillOpacity={0.25}
              strokeWidth={2}
            />
          ))}
          <Legend wrapperStyle={{ color: COLORS.text }} />
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
        </RadarChart>
      </ResponsiveContainer>

      {/* Winner Badge */}
      <div className="mt-4 flex justify-center">
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-xl"
          style={{
            background: `${getScoreColor(maxAggregateScore)}20`,
            border: `2px solid ${getScoreColor(maxAggregateScore)}`
          }}
        >
          <span className="text-2xl">🏆</span>
          <div>
            <div className="text-sm font-bold text-white">
              Winner: {winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')}
            </div>
            <div className="text-xs text-gray-300">
              CLUES-Smart Score: <span style={{ color: getScoreColor(maxAggregateScore), fontWeight: 700 }}>
                {maxAggregateScore}/100
              </span> ({getScoreLabel(maxAggregateScore)}) - Best overall property profile
            </div>
          </div>
        </div>
      </div>

      {/* Smart Scale Legend */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-blue-400">
        <div className="text-xs font-bold text-blue-300 mb-2">CLUES-Smart Score Scale:</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
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
          Aggregate score = average of all 6 dimension scores. Larger radar area indicates stronger overall property features.
        </p>
      </div>
    </div>
  );
}

// ============================================
// CHART A-2: HOME/LOT RATIO BUBBLE WITH VALUE SCORING
// Scatter plot: Lot Size (X) vs Living Space (Y), Bubble Size = Price
// Score based on home coverage percentage (lower = better, more yard space)
// ============================================
function SpaceEfficiencyBubble({ homes }: { homes: Home[] }) {
  // Calculate home/lot ratio as percentage: (living sqft / lot sqft) * 100
  // Lower ratio = more yard space = more desirable (except condos/townhouses)
  const ratios = homes.map(h => {
    if (!h.lotSizeSqft || h.lotSizeSqft <= 0) return 100; // Worst case for invalid data
    return (h.livingSqft / h.lotSizeSqft) * 100;
  });

  const efficiencyScores = scoreLowerIsBetter(ratios);

  const maxScore = Math.max(...efficiencyScores);
  const winnerIndices = efficiencyScores
    .map((s, i) => (s === maxScore ? i : -1))
    .filter(i => i !== -1);

  const bubbleData = homes.map((h, idx) => ({
    name: h.name.split(',')[0],
    lotSqft: h.lotSizeSqft || 0,
    livingSqft: h.livingSqft || 0,
    price: h.listingPrice || 0,
    ratio: ratios[idx],
    score: efficiencyScores[idx],
    color: h.color || '#22c55e',
  }));

  // Dynamic bubble size range based on price variance
  const prices = homes.map(h => h.listingPrice || 0).filter(p => p > 0);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const bubbleRange: [number, number] = prices.length > 0 ? [300, 1000] : [500, 500];

  useEffect(() => {
    console.log('🔍 Chart A-2: Home/Lot Ratio Bubble - SMART SCORING:');
    bubbleData.forEach((d) => {
      console.log(`📊 ${d.name}:`);
      console.log('  Raw values:', {
        lotSqft: d.lotSqft,
        livingSqft: d.livingSqft,
        price: d.price,
      });
      console.log(`  Home/Lot Ratio: ${d.ratio.toFixed(1)}%`);
      console.log(`  🧠 SMART SCORE: ${d.score}/100 (${getScoreLabel(d.score)})`);
    });
    console.log(`🏆 WINNER: ${winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')} with score ${maxScore} (lowest ratio = most yard space)`);
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      {/* Brain Widget - Top Right */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: `${getScoreColor(maxScore)}20`,
          border: `2px solid ${getScoreColor(maxScore)}`
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

      <h3 className="text-lg font-semibold text-white mb-2">Chart 3-9: Home/Lot Ratio Correlation</h3>
      <p className="text-xs text-gray-400 mb-4">Bubble size = price | Scored by home coverage % (lower = better, more yard space)</p>

      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="lotSqft"
            name="Lot Size"
            unit=" sqft"
            stroke={COLORS.text}
            tick={{ fill: COLORS.text, fontSize: 11 }}
            label={{ value: 'Lot Size (sqft)', position: 'insideBottom', offset: -10, fill: COLORS.text }}
          />
          <YAxis
            type="number"
            dataKey="livingSqft"
            name="Living Space"
            unit=" sqft"
            stroke={COLORS.text}
            tick={{ fill: COLORS.text, fontSize: 11 }}
            label={{ value: 'Living Space (sqft)', angle: -90, position: 'insideLeft', fill: COLORS.text }}
          />
          <ZAxis type="number" dataKey="price" range={bubbleRange} name="Price" />
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
            formatter={(value: any, name: string) => {
              if (name === 'Lot Size') return [`${value.toLocaleString()} sqft`, name];
              if (name === 'Living Space') return [`${value.toLocaleString()} sqft`, name];
              if (name === 'Price') return [`$${value.toLocaleString()}`, name];
              return [value, name];
            }}
          />
          {bubbleData.map((entry, index) => (
            <Scatter
              key={index}
              name={entry.name}
              data={[entry]}
              fill={entry.color}
            />
          ))}
          <Legend wrapperStyle={{ color: COLORS.text, paddingTop: '18px' }} />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Winner Badge */}
      <div className="mt-4 flex justify-center">
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-xl"
          style={{
            background: `${getScoreColor(maxScore)}20`,
            border: `2px solid ${getScoreColor(maxScore)}`
          }}
        >
          <span className="text-2xl">🏆</span>
          <div>
            <div className="text-sm font-bold text-white">
              Winner: {winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')}
            </div>
            <div className="text-xs text-gray-300">
              CLUES-Smart Score: <span style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>
                {maxScore}/100
              </span> ({getScoreLabel(maxScore)}) - Lowest home/lot ratio: {ratios[winnerIndices[0]].toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Smart Scale Legend */}
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
          Lower home coverage % = more yard space = higher score. Bubble color shows property. Larger bubbles = higher listing price.
        </p>
      </div>
    </div>
  );
}

// ============================================
// CHART A-3: TOTAL CAPACITY SCORE (Bedrooms + Bathrooms + Garage)
// Donut showing capacity allocation with smart scoring
// ============================================
function TotalCapacityDonut({ homes }: { homes: Home[] }) {
  // Calculate total capacity score: bedrooms + bathrooms + garage (all contribute to property utility)
  const capacities = homes.map(h => h.bedrooms + h.totalBathrooms + h.garageSpaces);
  const capacityScores = scoreHigherIsBetter(capacities);

  const maxScore = Math.max(...capacityScores);
  const winnerIndices = capacityScores
    .map((s, i) => (s === maxScore ? i : -1))
    .filter(i => i !== -1);

  const donutData = homes.map((h, idx) => ({
    name: h.name.split(',')[0],
    totalCapacity: capacities[idx],
    bedrooms: h.bedrooms,
    bathrooms: h.totalBathrooms,
    garage: h.garageSpaces,
    score: capacityScores[idx],
    color: h.color || '#22c55e',
  }));

  const totalCapacity = donutData.reduce((sum, d) => sum + d.totalCapacity, 0);

  useEffect(() => {
    console.log('🔍 Chart A-3: Total Capacity Donut - SMART SCORING:');
    donutData.forEach((d) => {
      console.log(`📊 ${d.name}:`);
      console.log('  Breakdown:', {
        bedrooms: d.bedrooms,
        bathrooms: d.bathrooms,
        garage: d.garage,
        total: d.totalCapacity,
      });
      console.log(`  Portfolio %: ${((d.totalCapacity / totalCapacity) * 100).toFixed(1)}%`);
      console.log(`  🧠 SMART SCORE: ${d.score}/100 (${getScoreLabel(d.score)})`);
    });
    console.log(`🏆 WINNER: ${winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')} with score ${maxScore}`);
  }, [homes]);

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={10}
        fontWeight="bold"
      >
        {`${payload.name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      {/* Brain Widget - Top Right */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: `${getScoreColor(maxScore)}20`,
          border: `2px solid ${getScoreColor(maxScore)}`
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

      <h3 className="text-lg font-semibold text-white mb-2">Chart 3-10: Total Capacity Distribution</h3>
      <p className="text-xs text-gray-400 mb-4">Bedrooms + bathrooms + garage spaces scored by total capacity</p>

      <div className="relative">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={donutData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="totalCapacity"
              label={CustomLabel}
              labelLine={false}
            >
              {donutData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: COLORS.tooltip,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                color: '#ffffff',
              }}
              labelStyle={{ color: '#ffffff' }}
              itemStyle={{ color: '#ffffff' }}
              formatter={(value: any, name: string, props: any) => {
                const data = props.payload;
                return [
                  `${value} total (${data.bedrooms} bed + ${data.bathrooms} bath + ${data.garage} garage) - Score: ${data.score}/100`,
                  data.name,
                ];
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text - positioned absolutely within this relative container */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-3xl font-bold text-white">{totalCapacity}</div>
          <div className="text-xs text-gray-400">Total Capacity</div>
          <div className="text-xs text-gray-400">Units</div>
        </div>
      </div>

      {/* Winner Badge */}
      <div className="mt-4 flex justify-center">
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-xl"
          style={{
            background: `${getScoreColor(maxScore)}20`,
            border: `2px solid ${getScoreColor(maxScore)}`
          }}
        >
          <span className="text-2xl">🏆</span>
          <div>
            <div className="text-sm font-bold text-white">
              Winner: {winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')}
            </div>
            <div className="text-xs text-gray-300">
              CLUES-Smart Score: <span style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>
                {maxScore}/100
              </span> ({getScoreLabel(maxScore)}) - Most total capacity: {capacities[winnerIndices[0]]} units
            </div>
          </div>
        </div>
      </div>

      {/* Smart Scale Legend */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-green-400">
        <p className="text-xs text-gray-300">
          <strong className="text-green-300">Capacity Scoring:</strong> Total bedrooms + bathrooms + garage spaces.
          Higher total = better property capacity. Slice color shows score. Portfolio % shows contribution to total.
        </p>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function PropertyBasicsAdvancedCharts({ homes }: PropertyBasicsAdvancedChartsProps) {
  if (!homes.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        No property data available for advanced visualizations
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
        <span className="text-sm font-medium text-purple-300">Advanced Property Visualizations with CLUES-Smart Scoring</span>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PropertyProfileRadar homes={homes} />
        <SpaceEfficiencyBubble homes={homes} />
      </div>

      {/* Centered chart 3-10 */}
      <div className="flex justify-center mt-6">
        <div className="w-full lg:w-1/2">
          <TotalCapacityDonut homes={homes} />
        </div>
      </div>

      {/* Footer Note with PROPER guidance */}
      <div className="mt-6 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
        <p className="text-xs text-gray-400">
          <span className="text-blue-300 font-semibold">CLUES-Smart Scoring System:</span> All charts use the 5-tier color scale:
          <span style={{ color: '#4CAF50', fontWeight: 700 }}> 81-100 Excellent</span>,
          <span style={{ color: '#2196F3', fontWeight: 700 }}> 61-80 Good</span>,
          <span style={{ color: '#FFEB3B', fontWeight: 700 }}> 41-60 Average</span>,
          <span style={{ color: '#FF9800', fontWeight: 700 }}> 21-40 Fair</span>,
          <span style={{ color: '#FF4444', fontWeight: 700 }}> 0-20 Poor</span>.
          Winner badges show the highest-scoring property for each metric. Brain widgets display the top SMART Score.
        </p>
      </div>
    </div>
  );
}
