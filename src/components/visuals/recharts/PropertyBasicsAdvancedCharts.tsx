/**
 * Property Basics Advanced Visualizations (Fields 17-29)
 * 5 Advanced chart types: Radar, Bubble, Donut, Stacked Bar, Paired Comparison
 * CLUES 5-tier scoring system: 0, 25, 50, 75, 100
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

// Score colors (for badges and data points)
const SCORE_COLORS = {
  100: '#22c55e', // Green - Excellent
  75: '#3b82f6',  // Blue - Good
  50: '#eab308',  // Yellow - Average
  25: '#f97316',  // Orange - Fair
  0: '#ef4444',   // Red - Poor
};

function getScoreColor(score: number): string {
  if (score >= 100) return SCORE_COLORS[100];
  if (score >= 75) return SCORE_COLORS[75];
  if (score >= 50) return SCORE_COLORS[50];
  if (score >= 25) return SCORE_COLORS[25];
  return SCORE_COLORS[0];
}

function getScoreLabel(score: number): string {
  if (score >= 100) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Average';
  if (score >= 25) return 'Fair';
  return 'Poor';
}

// 5-tier scoring functions
function scoreHigherIsBetter(values: number[]): number[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 50);

  return values.map((v) => {
    const percentile = (v - min) / (max - min);
    if (percentile <= 0.2) return 0;
    if (percentile <= 0.4) return 25;
    if (percentile <= 0.6) return 50;
    if (percentile <= 0.8) return 75;
    return 100;
  });
}

// ============================================
// CHART A-1: PROPERTY PROFILE RADAR
// Multi-dimensional overlay of all key property metrics
// ============================================
function PropertyProfileRadar({ homes }: { homes: Home[] }) {
  const currentYear = new Date().getFullYear();

  // Calculate normalized scores for 6 dimensions
  const radarData = [
    { metric: 'Bedrooms', ...Object.fromEntries(homes.map((h, i) => [`prop${i}`, (h.bedrooms / 6) * 100])) },
    { metric: 'Bathrooms', ...Object.fromEntries(homes.map((h, i) => [`prop${i}`, (h.totalBathrooms / 5) * 100])) },
    { metric: 'Living Sqft', ...Object.fromEntries(homes.map((h, i) => [`prop${i}`, Math.min((h.livingSqft / 4000) * 100, 100)])) },
    { metric: 'Lot Size', ...Object.fromEntries(homes.map((h, i) => [`prop${i}`, Math.min((h.lotSizeAcres / 0.5) * 100, 100)])) },
    { metric: 'Newness', ...Object.fromEntries(homes.map((h, i) => [`prop${i}`, Math.max(0, 100 - ((currentYear - h.yearBuilt) * 2))])) },
    { metric: 'Garage', ...Object.fromEntries(homes.map((h, i) => [`prop${i}`, (h.garageSpaces / 4) * 100])) },
  ];

  useEffect(() => {
    console.log('🔍 Chart A-1: Property Profile Radar - Data Verification:');
    homes.forEach((h) => {
      console.log(`📊 ${h.name}:`, {
        bedrooms: h.bedrooms,
        bathrooms: h.totalBathrooms,
        livingSqft: h.livingSqft,
        lotAcres: h.lotSizeAcres,
        age: currentYear - h.yearBuilt,
        garage: h.garageSpaces,
      });
    });
  }, []);

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-2">Property Profile Radar</h3>
      <p className="text-xs text-gray-400 mb-4">6-dimensional comparison overlay (larger area = better overall)</p>

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
              stroke={home.color}
              fill={home.color}
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
              color: COLORS.text,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Explanation */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-blue-400">
        <p className="text-xs text-gray-300">
          <strong className="text-blue-300">Radar Interpretation:</strong> Each axis represents a normalized property metric (0-100 scale).
          Larger filled areas indicate more comprehensive property features. Compare shapes to see strengths/weaknesses.
        </p>
      </div>
    </div>
  );
}

// ============================================
// CHART A-2: SIZE VS VALUE BUBBLE CHART
// Scatter plot: Lot Size (X) vs Living Space (Y), Bubble Size = Price
// ============================================
function SizeVsValueBubble({ homes }: { homes: Home[] }) {
  const bubbleData = homes.map((h) => ({
    name: h.name.split(',')[0],
    lotSqft: h.lotSizeSqft,
    livingSqft: h.livingSqft,
    price: h.listingPrice,
    color: h.color,
  }));

  useEffect(() => {
    console.log('🔍 Chart A-2: Size vs Value Bubble - Data Verification:');
    bubbleData.forEach((d) => {
      console.log(`📊 ${d.name}:`, {
        lotSqft: d.lotSqft,
        livingSqft: d.livingSqft,
        price: d.price,
      });
    });
  }, []);

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-2">Size vs Value Correlation</h3>
      <p className="text-xs text-gray-400 mb-4">Bubble size = listing price | X-axis = lot size | Y-axis = living space</p>

      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 60 }}>
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
          <ZAxis type="number" dataKey="price" range={[400, 1200]} name="Price" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: COLORS.tooltip,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: COLORS.text,
            }}
            formatter={(value: any, name: string) => {
              if (name === 'Lot Size') return [`${value.toLocaleString()} sqft`, name];
              if (name === 'Living Space') return [`${value.toLocaleString()} sqft`, name];
              if (name === 'Price') return [`$${value.toLocaleString()}`, name];
              return [value, name];
            }}
          />
          <Legend wrapperStyle={{ color: COLORS.text }} />
          {bubbleData.map((entry, index) => (
            <Scatter key={index} name={entry.name} data={[entry]} fill={entry.color} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>

      {/* Explanation */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-purple-400">
        <p className="text-xs text-gray-300">
          <strong className="text-purple-300">Bubble Interpretation:</strong> Upper-right quadrant = large lot + large living space.
          Larger bubbles = higher listing price. Reveals value density (price per square foot trade-offs).
        </p>
      </div>
    </div>
  );
}

// ============================================
// CHART A-3: BEDROOM/BATHROOM DISTRIBUTION DONUT
// Shows combined bedroom + bathroom count distribution
// ============================================
function RoomDistributionDonut({ homes }: { homes: Home[] }) {
  const donutData = homes.map((h) => ({
    name: h.name.split(',')[0],
    totalRooms: h.bedrooms + h.totalBathrooms,
    bedrooms: h.bedrooms,
    bathrooms: h.totalBathrooms,
    color: h.color,
  }));

  const totalRooms = donutData.reduce((sum, d) => sum + d.totalRooms, 0);

  useEffect(() => {
    console.log('🔍 Chart A-3: Room Distribution Donut - Data Verification:');
    donutData.forEach((d) => {
      console.log(`📊 ${d.name}:`, {
        bedrooms: d.bedrooms,
        bathrooms: d.bathrooms,
        total: d.totalRooms,
        percentage: ((d.totalRooms / totalRooms) * 100).toFixed(1) + '%',
      });
    });
  }, []);

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
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
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-2">Room Count Distribution</h3>
      <p className="text-xs text-gray-400 mb-4">Total bedrooms + bathrooms across all properties</p>

      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={donutData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="totalRooms"
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
              color: COLORS.text,
            }}
            formatter={(value: any, name: string, props: any) => {
              const data = props.payload;
              return [
                `${value} rooms (${data.bedrooms} bed + ${data.bathrooms} bath)`,
                data.name,
              ];
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center text overlay */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <div className="text-3xl font-bold text-white">{totalRooms}</div>
        <div className="text-xs text-gray-400">Total Rooms</div>
      </div>

      {/* Explanation */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-green-400">
        <p className="text-xs text-gray-300">
          <strong className="text-green-300">Donut Interpretation:</strong> Shows each property's contribution to total room count in portfolio.
          Larger slice = more bedrooms + bathrooms combined.
        </p>
      </div>
    </div>
  );
}

// ============================================
// CHART A-4: VERTICAL SPACE STACKED BAR
// Stories + Garage Spaces stacked to show vertical/parking capacity
// ============================================
function VerticalSpaceStackedBar({ homes }: { homes: Home[] }) {
  const stackedData = homes.map((h) => ({
    name: h.name.split(',')[0],
    stories: h.stories,
    garageSpaces: h.garageSpaces,
    color: h.color,
  }));

  useEffect(() => {
    console.log('🔍 Chart A-4: Vertical Space Stacked Bar - Data Verification:');
    stackedData.forEach((d) => {
      console.log(`📊 ${d.name}:`, {
        stories: d.stories,
        garageSpaces: d.garageSpaces,
        total: d.stories + d.garageSpaces,
      });
    });
  }, []);

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-2">Vertical & Parking Capacity</h3>
      <p className="text-xs text-gray-400 mb-4">Stories (blue) + Garage Spaces (green) stacked</p>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={stackedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis
            dataKey="name"
            stroke={COLORS.text}
            tick={{ fill: COLORS.text, fontSize: 10 }}
            angle={-15}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke={COLORS.text} tick={{ fill: COLORS.text, fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.tooltip,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: COLORS.text,
            }}
          />
          <Legend wrapperStyle={{ color: COLORS.text }} />
          <Bar dataKey="stories" stackId="a" fill="#3b82f6" name="Stories" />
          <Bar dataKey="garageSpaces" stackId="a" fill="#22c55e" name="Garage Spaces" />
        </BarChart>
      </ResponsiveContainer>

      {/* Explanation */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-orange-400">
        <p className="text-xs text-gray-300">
          <strong className="text-orange-300">Stacked Bar Interpretation:</strong> Taller bars = more vertical living space + parking.
          Blue = stories (living levels), Green = garage bays. Shows total capacity at a glance.
        </p>
      </div>
    </div>
  );
}

// ============================================
// CHART A-5: LOT UTILIZATION PAIRED COMPARISON
// Side-by-side bars: Living Sqft vs Lot Sqft (normalized)
// ============================================
function LotUtilizationPaired({ homes }: { homes: Home[] }) {
  const maxLiving = Math.max(...homes.map((h) => h.livingSqft));
  const maxLot = Math.max(...homes.map((h) => h.lotSizeSqft));

  const pairedData = homes.map((h) => ({
    name: h.name.split(',')[0],
    livingPct: (h.livingSqft / maxLiving) * 100,
    lotPct: (h.lotSizeSqft / maxLot) * 100,
    coverage: ((h.livingSqft / h.lotSizeSqft) * 100).toFixed(1),
    color: h.color,
  }));

  useEffect(() => {
    console.log('🔍 Chart A-5: Lot Utilization Paired - Data Verification:');
    pairedData.forEach((d) => {
      console.log(`📊 ${d.name}:`, {
        livingPct: d.livingPct.toFixed(1) + '%',
        lotPct: d.lotPct.toFixed(1) + '%',
        coverage: d.coverage + '% of lot',
      });
    });
  }, []);

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-2">Lot Utilization Efficiency</h3>
      <p className="text-xs text-gray-400 mb-4">Living space (orange) vs total lot size (blue) - normalized percentages</p>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={pairedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis
            dataKey="name"
            stroke={COLORS.text}
            tick={{ fill: COLORS.text, fontSize: 10 }}
            angle={-15}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke={COLORS.text}
            tick={{ fill: COLORS.text, fontSize: 11 }}
            label={{ value: '% of Maximum', angle: -90, position: 'insideLeft', fill: COLORS.text }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.tooltip,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: COLORS.text,
            }}
            formatter={(value: any, name: string, props: any) => {
              if (name === 'Living Space %') return [`${value.toFixed(1)}% of max living space`, name];
              if (name === 'Lot Size %') return [`${value.toFixed(1)}% of max lot size`, name];
              return [value, name];
            }}
          />
          <Legend wrapperStyle={{ color: COLORS.text }} />
          <Bar dataKey="livingPct" fill="#f97316" name="Living Space %" />
          <Bar dataKey="lotPct" fill="#3b82f6" name="Lot Size %" />
        </BarChart>
      </ResponsiveContainer>

      {/* Explanation */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-pink-400">
        <p className="text-xs text-gray-300">
          <strong className="text-pink-300">Paired Bar Interpretation:</strong> Orange = living space as % of largest home.
          Blue = lot size as % of largest lot. Gap between bars shows yard space potential.
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
        <span className="text-sm font-medium text-purple-300">Advanced Property Visualizations</span>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PropertyProfileRadar homes={homes} />
        <SizeVsValueBubble homes={homes} />
        <RoomDistributionDonut homes={homes} />
        <VerticalSpaceStackedBar homes={homes} />
        <LotUtilizationPaired homes={homes} />
      </div>

      {/* Footer Note */}
      <div className="mt-6 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
        <p className="text-xs text-gray-400 text-center">
          <span className="text-blue-300 font-semibold">Advanced Visualizations:</span> These charts provide multi-dimensional
          insights beyond simple bar comparisons. Use radar for holistic comparison, bubble for correlations, donut for portfolio
          distribution, stacked bars for capacity, and paired bars for efficiency ratios.
        </p>
      </div>
    </div>
  );
}
