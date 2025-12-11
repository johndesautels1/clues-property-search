import { useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

// ============================================
// HOME INTERFACE
// ============================================
interface Home {
  id: string;
  name: string; // Full address
  color: string; // Property color (Green/Lavender/Pink)
  // Fields 30-38
  hoaYN: boolean;
  hoaFeeAnnual: number;
  hoaName: string;
  hoaIncludes: string;
  ownershipType: string;
  annualTaxes: number;
  taxYear: number;
  propertyTaxRate: number;
  taxExemptions: string;
}

// ============================================
// SCORING FUNCTIONS (PRESERVED FROM HTML)
// ============================================

// HOA Scoring (different for Condo vs Single Family)
function scoreHOA(hoaFee: number, ownershipType: string): number {
  if (ownershipType === 'Fee Simple') {
    // Single family: 0-250 excellent, 251-500 good, etc.
    if (hoaFee <= 250) return 100;
    if (hoaFee <= 500) return 80;
    if (hoaFee <= 750) return 60;
    if (hoaFee <= 1000) return 40;
    return 20;
  } else {
    // Condo: 0-250 excellent, 251-500 good, 501-750 average, 751-1000 fair, >1000 poor
    if (hoaFee <= 250) return 100;
    if (hoaFee <= 500) return 85;
    if (hoaFee <= 750) return 70;
    if (hoaFee <= 1000) return 50;
    return 20;
  }
}

// Tax Rate Scoring (lower = better)
function scoreTaxRate(rate: number): number {
  if (rate <= 0.65) return 100;
  if (rate <= 0.77) return 85;
  if (rate <= 0.88) return 70;
  if (rate <= 1.0) return 50;
  return 20;
}

// Ownership Type Scoring
function scoreOwnershipType(type: string): number {
  const scores: Record<string, number> = {
    'Fee Simple': 100,
    'Condo': 75,
    'Leasehold': 50,
    'Co-op': 50,
  };
  return scores[type] || 0;
}

// True Cost of Ownership Index
function scoreTrueCostIndex(home: Home, allHomes: Home[]): number {
  const totalCost = home.annualTaxes + home.hoaFeeAnnual;
  const allCosts = allHomes.map((h) => h.annualTaxes + h.hoaFeeAnnual);
  const maxCost = Math.max(...allCosts);
  const minCost = Math.min(...allCosts);

  // Reverse score: lower cost = higher score
  if (maxCost === minCost) return 50;
  return ((maxCost - totalCost) / (maxCost - minCost)) * 100;
}

// Color from score (0-100) - 5-tier scale
function getColorFromScore(score: number): string {
  if (score >= 81) return '#4CAF50'; // Green - Excellent
  if (score >= 61) return '#2196F3'; // Blue - Good
  if (score >= 41) return '#FFEB3B'; // Yellow - Average
  if (score >= 21) return '#FF9800'; // Orange - Fair
  return '#FF4444'; // Red - Poor
}

// Label from score
function getScoreLabel(score: number): string {
  if (score >= 81) return 'Excellent';
  if (score >= 61) return 'Good';
  if (score >= 41) return 'Average';
  if (score >= 21) return 'Fair';
  return 'Poor';
}

// Format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

// ============================================
// SMART SCALE LEGEND COMPONENT
// ============================================
const SmartScaleLegend: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => {
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
      <p className="text-xs text-gray-400 mt-2">
        {description}
      </p>
    </div>
  );
};

// ============================================
// BRAIN WIDGET COMPONENT
// ============================================
const BrainWidget: React.FC<{ score: number; label?: string }> = ({
  score,
  label = 'SMART Score',
}) => {
  const color = getColorFromScore(score);
  return (
    <div className="absolute top-4 right-4 flex flex-col items-center">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center opacity-80"
        style={{ backgroundColor: color }}
      >
        <span className="text-sm">🧠</span>
      </div>
      <div className="text-[0.5rem] font-bold text-white mt-1 text-center whitespace-nowrap">
        {label}: {Math.round(score)}
      </div>
    </div>
  );
};

// ============================================
// WINNER BADGE COMPONENT
// ============================================
const WinnerBadge: React.FC<{ winnerName: string; score: number; reason: string }> = ({
  winnerName,
  score,
  reason,
}) => {
  const color = getColorFromScore(score);
  return (
    <div className="mt-4 flex justify-center">
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-xl"
        style={{
          background: `${color}20`,
          border: `2px solid ${color}`
        }}
      >
        <span className="text-2xl">🏆</span>
        <div>
          <div className="text-sm font-bold text-white">
            Winner: {winnerName}
          </div>
          <div className="text-xs text-gray-300">
            CLUES-Smart Score: <span style={{ color, fontWeight: 700 }}>
              {Math.round(score)}/100
            </span> ({getScoreLabel(score)}) - {reason}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CUSTOM TOOLTIP (WHITE TEXT)
// ============================================
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 border border-white/20 rounded-lg p-3 shadow-xl">
        <p className="font-bold text-white mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-white text-sm">
            <span style={{ color: entry.color }}>{entry.name}:</span>{' '}
            {typeof entry.value === 'number'
              ? entry.value.toLocaleString()
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ============================================
// CHART 4-1: ANNUAL COST BREAKDOWN (STACKED HORIZONTAL BAR)
// ============================================
const Chart41_AnnualCostBreakdown: React.FC<{ homes: Home[] }> = ({ homes }) => {
  const chartData = homes.map((home) => ({
    name: home.name,
    Taxes: home.annualTaxes,
    HOA: home.hoaFeeAnnual,
    total: home.annualTaxes + home.hoaFeeAnnual,
    score: scoreTrueCostIndex(home, homes),
  }));

  // Find winner (highest score)
  const maxScore = Math.max(...chartData.map((d) => d.score));
  const winner = chartData.find((d) => d.score === maxScore);

  useEffect(() => {
    console.log('🔍 Chart 4-1 - Annual Cost Breakdown');
    chartData.forEach((d) => {
      console.log(
        `  🧠 ${d.name}: Total=${formatCurrency(d.total)}, Score=${Math.round(d.score)}`
      );
    });
    console.log(`  🏆 Winner: ${winner?.name} (Score: ${Math.round(maxScore)})`);
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <BrainWidget score={maxScore} />
      <div className="text-lg font-semibold text-white mb-1">
        Chart 4-1: Annual Cost Breakdown
      </div>
      <div className="text-sm text-gray-400 mt-3 mb-4">
        Taxes + HOA per home (stacked)
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 80, bottom: 20, left: 140 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis type="number" stroke="#666" tick={{ fill: '#ffffff' }} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#666"
            tick={{ fill: '#ffffff', fontWeight: 'bold', fontSize: 12 }}
            width={130}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: '#ffffff' }}
            iconType="rect"
          />
          <Bar dataKey="Taxes" stackId="a" fill="#2196F3" radius={[0, 4, 4, 0]} />
          <Bar dataKey="HOA" stackId="a" fill="#4CAF50" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {winner && <WinnerBadge winnerName={winner.name} score={winner.score} reason="Lowest total annual cost" />}
      <SmartScaleLegend
        title="Annual Cost Breakdown Score"
        description="Lower total cost (Taxes + HOA) = Higher score. Best value home scores highest."
      />
    </div>
  );
};

// ============================================
// CHART 4-2: TAX RATE COMPARISON (VERTICAL BAR)
// ============================================
const Chart42_TaxRateComparison: React.FC<{ homes: Home[] }> = ({ homes }) => {
  // RELATIVE SCORING: lowest tax rate = 100, highest = 0
  const rates = homes.map(h => h.propertyTaxRate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);

  const chartData = homes.map((home) => {
    // Reverse score: lower rate = higher score
    const relativeScore = maxRate === minRate ? 50 : ((maxRate - home.propertyTaxRate) / (maxRate - minRate)) * 100;
    // Apply 5-tier thresholds
    let score: number;
    if (relativeScore >= 75) score = 100;
    else if (relativeScore >= 50) score = 75;
    else if (relativeScore >= 25) score = 50;
    else score = 25;

    return {
      name: home.name,
      'Tax Rate': home.propertyTaxRate,
      score: score,
      fill: home.color,
    };
  });

  // Find winner (highest score)
  const maxScore = Math.max(...chartData.map((d) => d.score));
  const winner = chartData.find((d) => d.score === maxScore);

  useEffect(() => {
    console.log('🔍 Chart 4-2 - Tax Rate Comparison');
    chartData.forEach((d) => {
      console.log(
        `  🧠 ${d.name}: Rate=${d['Tax Rate'].toFixed(2)}%, Score=${Math.round(d.score)}`
      );
    });
    console.log(`  🏆 Winner: ${winner?.name} (Score: ${Math.round(maxScore)})`);
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <BrainWidget score={maxScore} />
      <div className="text-lg font-semibold text-white mb-1">
        Chart 4-2: Tax Rate Comparison
      </div>
      <div className="text-sm text-gray-400 mt-3 mb-4">Lower = Better value</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, bottom: 80, left: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="name"
            stroke="#666"
            tick={{ fill: '#ffffff', fontWeight: 'bold', fontSize: 12 }}
            angle={0}
            textAnchor="middle"
            height={70}
          />
          <YAxis stroke="#666" tick={{ fill: '#ffffff', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Tax Rate" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
          <Legend wrapperStyle={{ color: '#ffffff' }} />
        </BarChart>
      </ResponsiveContainer>
      {winner && <WinnerBadge winnerName={winner.name} score={winner.score} reason="Lowest property tax rate" />}
      <SmartScaleLegend
        title="Tax Rate Score"
        description="Lower tax rate = Higher score. Efficient tax jurisdictions score 81-100 (green)."
      />
    </div>
  );
};

// ============================================
// CHART 4-3: HOA VS TAX BURDEN (BUBBLE/SCATTER)
// ============================================
const Chart43_HOAVsTaxBurden: React.FC<{ homes: Home[] }> = ({ homes }) => {
  const chartData = homes.map((home) => ({
    name: home.name,
    x: home.annualTaxes,
    y: home.hoaFeeAnnual,
    z: home.annualTaxes + home.hoaFeeAnnual,
    score: scoreTrueCostIndex(home, homes),
    fill: home.color, // Use property color for consistency
  }));

  // Find winner (highest score)
  const maxScore = Math.max(...chartData.map((d) => d.score));
  const winner = chartData.find((d) => d.score === maxScore);

  useEffect(() => {
    console.log('🔍 Chart 4-3 - HOA vs Tax Burden');
    chartData.forEach((d) => {
      console.log(
        `  🧠 ${d.name}: Taxes=${formatCurrency(d.x)}, HOA=${formatCurrency(d.y)}, Total=${formatCurrency(d.z)}, Score=${Math.round(d.score)}`
      );
    });
    console.log(`  🏆 Winner: ${winner?.name} (Score: ${Math.round(maxScore)})`);
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <BrainWidget score={maxScore} />
      <div className="text-lg font-semibold text-white mb-1">
        Chart 4-3: HOA vs Tax Burden
      </div>
      <div className="text-sm text-gray-400 mt-3 mb-4">
        X-axis = Annual Property Taxes • Y-axis = Annual HOA Fees • Bubble Size = Total Cost
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 50, bottom: 80, left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="x"
            name="Annual Taxes"
            type="number"
            stroke="#666"
            tick={{ fill: '#ffffff', fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value)}
            label={{
              value: 'Annual Property Taxes ($)',
              position: 'bottom',
              fill: '#ffffff',
              fontWeight: 'bold',
              offset: 10,
            }}
          />
          <YAxis
            dataKey="y"
            name="HOA Annual Fee"
            type="number"
            domain={[0, 36000]}
            ticks={[0, 6000, 12000, 18000, 24000, 30000, 36000]}
            stroke="#666"
            tick={{ fill: '#ffffff', fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value)}
            label={{
              value: 'Annual HOA Fees ($)',
              angle: -90,
              position: 'insideLeft',
              fill: '#ffffff',
              fontSize: 11,
              offset: -10,
            }}
          />
          <ZAxis dataKey="z" range={[400, 1200]} name="Total Cost" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#ffffff' }} />
          <Scatter data={chartData}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.7} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      {winner && <WinnerBadge winnerName={winner.name} score={winner.score} reason="Lowest combined HOA and tax burden" />}
      <SmartScaleLegend
        title="True Cost Index"
        description="Lowest total annual cost scores 100 (green). Higher cost scores lower (red)."
      />
    </div>
  );
};

// ============================================
// CHART 4-4: OWNERSHIP TYPE SCORE (VERTICAL BAR)
// ============================================
const Chart44_OwnershipTypeScore: React.FC<{ homes: Home[] }> = ({ homes }) => {
  const chartData = homes.map((home) => ({
    name: home.name,
    Score: scoreOwnershipType(home.ownershipType),
    ownershipType: home.ownershipType,
    fill: home.color,
  }));

  // Find winner (highest score)
  const maxScore = Math.max(...chartData.map((d) => d.Score));
  const winner = chartData.find((d) => d.Score === maxScore);

  useEffect(() => {
    console.log('🔍 Chart 4-4 - Ownership Type Score');
    chartData.forEach((d) => {
      console.log(
        `  🧠 ${d.name}: Type=${d.ownershipType}, Score=${Math.round(d.Score)}`
      );
    });
    console.log(`  🏆 Winner: ${winner?.name} (Score: ${Math.round(maxScore)})`);
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <BrainWidget score={maxScore} />
      <div className="text-lg font-semibold text-white mb-1">
        Chart 4-4: Ownership Type Score
      </div>
      <div className="text-sm text-gray-400 mt-3 mb-4">Fee Simple scores highest</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, bottom: 90, left: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="name"
            stroke="#666"
            tick={{ fill: '#ffffff', fontWeight: 'bold', fontSize: 12 }}
            angle={0}
            textAnchor="middle"
            height={80}
          />
          <YAxis stroke="#666" tick={{ fill: '#ffffff', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Score" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
          <Legend wrapperStyle={{ color: '#ffffff' }} />
        </BarChart>
      </ResponsiveContainer>
      {winner && <WinnerBadge winnerName={winner.name} score={winner.Score} reason="Best ownership type (Fee Simple)" />}
      <SmartScaleLegend
        title="Ownership Type Score"
        description="Fee Simple=100. Condo=75. Leasehold/Co-op=50. Affects mortgage & control."
      />
    </div>
  );
};

// ============================================
// CHART 4-4: COST DISTRIBUTION - 3 SEPARATE DONUTS
// ============================================
const Chart45_CostDistributionDonut: React.FC<{ homes: Home[] }> = ({ homes }) => {
  // Calculate scores for each property based on total cost
  const scoresData = homes.map((home) => ({
    ...home,
    totalCost: home.annualTaxes + home.hoaFeeAnnual,
    score: scoreTrueCostIndex(home, homes),
  }));

  // Find winner (highest score = lowest cost)
  const maxScore = Math.max(...scoresData.map((d) => d.score));
  const winner = scoresData.find((d) => d.score === maxScore);

  useEffect(() => {
    console.log('🔍 Chart 4-4 - Cost Distribution: Taxes vs HOA (3 properties)');
    scoresData.forEach((home) => {
      console.log(
        `  🧠 ${home.name}: Taxes=${formatCurrency(home.annualTaxes)} (${((home.annualTaxes / home.totalCost) * 100).toFixed(1)}%), HOA=${formatCurrency(home.hoaFeeAnnual)} (${((home.hoaFeeAnnual / home.totalCost) * 100).toFixed(1)}%), Score=${Math.round(home.score)}`
      );
    });
    console.log(`  🏆 Winner: ${winner?.name} (Score: ${Math.round(maxScore)})`);
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-2">
      <BrainWidget score={maxScore} />
      <div className="text-lg font-semibold text-white mb-1">
        Chart 4-4: Cost Distribution: Taxes vs HOA
      </div>
      <div className="text-sm text-gray-400 mt-3 mb-4">What % of total cost is each?</div>

      {/* Property Legend */}
      <div className="flex justify-center gap-4 mb-4">
        {homes.map((home) => (
          <div key={home.id} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: home.color }}
            ></div>
            <span className="text-xs text-gray-300">{home.name}</span>
          </div>
        ))}
      </div>

      {/* Cost Color Legend */}
      <div className="flex justify-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#2196F3' }}></div>
          <span className="text-xs text-gray-300">Taxes (Blue)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4CAF50' }}></div>
          <span className="text-xs text-gray-300">HOA (Green)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scoresData.map((home) => {
          const chartData = [
            { name: 'Taxes', value: home.annualTaxes, fill: '#2196F3' },
            { name: 'HOA', value: home.hoaFeeAnnual, fill: '#4CAF50' },
          ];

          return (
            <div key={home.id} className="flex flex-col items-center">
              <div
                className="text-sm font-bold mb-2 px-3 py-1 rounded"
                style={{
                  color: home.color,
                  border: `2px solid ${home.color}`,
                  background: `${home.color}15`
                }}
              >
                {home.name}
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart margin={{ left: 15 }}>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    label={(entry) =>
                      `${entry.name}\n${((entry.value / home.totalCost) * 100).toFixed(1)}%`
                    }
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center text-white font-bold text-sm mt-2">
                Total: {formatCurrency(home.totalCost)}
              </div>
              <div className="text-center text-gray-400 text-xs mt-1">
                Taxes: {formatCurrency(home.annualTaxes)} | HOA: {formatCurrency(home.hoaFeeAnnual)}
              </div>
            </div>
          );
        })}
      </div>

      {winner && <WinnerBadge winnerName={winner.name} score={winner.score} reason="Lowest total annual cost" />}
      <SmartScaleLegend
        title="Cost Distribution per Property"
        description="Each donut shows the percentage breakdown of Taxes (Blue) vs HOA (Green) for that property. Property borders match property colors. Lower total cost = higher score."
      />
    </div>
  );
};

// ============================================
// CHART 4-6: TRUE COST OF OWNERSHIP INDEX (VERTICAL BAR)
// ============================================
const Chart46_TrueCostOwnershipIndex: React.FC<{ homes: Home[] }> = ({ homes }) => {
  const chartData = homes.map((home) => ({
    name: home.name,
    Score: scoreTrueCostIndex(home, homes),
    totalCost: home.annualTaxes + home.hoaFeeAnnual,
    fill: home.color,
  }));

  // Find winner (highest score)
  const maxScore = Math.max(...chartData.map((d) => d.Score));
  const winner = chartData.find((d) => d.Score === maxScore);

  useEffect(() => {
    console.log('🔍 Chart 4-6 - True Cost of Ownership Index');
    chartData.forEach((d) => {
      console.log(
        `  🧠 ${d.name}: Total Cost=${formatCurrency(d.totalCost)}, Score=${Math.round(d.Score)}`
      );
    });
    console.log(`  🏆 Winner: ${winner?.name} (Score: ${Math.round(maxScore)})`);
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <BrainWidget score={maxScore} />
      <div className="text-lg font-semibold text-white mb-1">
        Chart 4-6: True Cost of Ownership Index
      </div>
      <div className="text-sm text-gray-400 mt-3 mb-4">
        Lower total cost = higher score
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, bottom: 90, left: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="name"
            stroke="#666"
            tick={{ fill: '#ffffff', fontWeight: 'bold', fontSize: 12 }}
            angle={0}
            textAnchor="middle"
            height={80}
          />
          <YAxis stroke="#666" tick={{ fill: '#ffffff', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Score" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
          <Legend wrapperStyle={{ color: '#ffffff' }} />
        </BarChart>
      </ResponsiveContainer>
      {winner && <WinnerBadge winnerName={winner.name} score={winner.Score} reason="Lowest total annual ownership cost" />}
      <SmartScaleLegend
        title="True Cost of Ownership Index"
        description="Combined metric: lower (Taxes + HOA) annual burden = higher score (81-100)."
      />
    </div>
  );
};

// ============================================
// CHART 4-7: MONTHLY VS ANNUAL COST (GROUPED VERTICAL BARS)
// ============================================
const Chart47_MonthlyVsAnnualCost: React.FC<{ homes: Home[] }> = ({ homes }) => {
  const chartData = homes.map((home) => ({
    name: home.name,
    Monthly: Math.round((home.annualTaxes + home.hoaFeeAnnual) / 12),
    Annual: home.annualTaxes + home.hoaFeeAnnual,
    score: scoreTrueCostIndex(home, homes),
  }));

  // Find winner (highest score)
  const maxScore = Math.max(...chartData.map((d) => d.score));
  const winner = chartData.find((d) => d.score === maxScore);

  useEffect(() => {
    console.log('🔍 Chart 4-7 - Monthly vs Annual Cost');
    chartData.forEach((d) => {
      console.log(
        `  🧠 ${d.name}: Monthly=${formatCurrency(d.Monthly)}, Annual=${formatCurrency(d.Annual)}, Score=${Math.round(d.score)}`
      );
    });
    console.log(`  🏆 Winner: ${winner?.name} (Score: ${Math.round(maxScore)})`);
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <BrainWidget score={maxScore} />
      <div className="text-lg font-semibold text-white mb-1">
        Chart 4-5: Monthly vs Annual Cost
      </div>
      <div className="text-sm text-gray-400 mt-3 mb-4">
        Total ownership cost (Taxes + HOA) shown monthly vs annually
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, bottom: 80, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="name"
            stroke="#666"
            tick={{ fill: '#ffffff', fontWeight: 'bold', fontSize: 12 }}
            angle={0}
            textAnchor="middle"
            height={70}
          />
          <YAxis
            stroke="#666"
            tick={{ fill: '#ffffff', fontSize: 12 }}
            tickFormatter={(value) => `$${Math.round(value).toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#ffffff' }} iconType="rect" />
          <Bar dataKey="Monthly" fill="#FF9800" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Annual" fill="#2196F3" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {winner && <WinnerBadge winnerName={winner.name} score={winner.score} reason="Lowest monthly and annual costs" />}
      <SmartScaleLegend
        title="Monthly vs Annual View"
        description="Monthly = annual cost ÷ 12. Visualizes monthly cash flow impact of ownership."
      />
    </div>
  );
};

// ============================================
// CHART 4-8: FINANCIAL EFFICIENCY RADAR (4-DIMENSIONAL)
// ============================================
const Chart48_FinancialEfficiencyRadar: React.FC<{ homes: Home[] }> = ({ homes }) => {
  const radarData = [
    {
      metric: 'HOA Score',
      ...Object.fromEntries(
        homes.map((home) => [
          home.name,
          scoreHOA(home.hoaFeeAnnual, home.ownershipType),
        ])
      ),
    },
    {
      metric: 'Tax Rate',
      ...Object.fromEntries(
        homes.map((home) => [home.name, scoreTaxRate(home.propertyTaxRate)])
      ),
    },
    {
      metric: 'Ownership',
      ...Object.fromEntries(
        homes.map((home) => [home.name, scoreOwnershipType(home.ownershipType)])
      ),
    },
    {
      metric: 'Cost Index',
      ...Object.fromEntries(
        homes.map((home) => [home.name, scoreTrueCostIndex(home, homes)])
      ),
    },
  ];

  // Calculate average radar score for each home
  const avgScores = homes.map((home) => {
    const scores = [
      scoreHOA(home.hoaFeeAnnual, home.ownershipType),
      scoreTaxRate(home.propertyTaxRate),
      scoreOwnershipType(home.ownershipType),
      scoreTrueCostIndex(home, homes),
    ];
    return {
      name: home.name,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      color: home.color,
    };
  });

  // Find winner (highest avg score)
  const maxScore = Math.max(...avgScores.map((d) => d.avgScore));
  const winner = avgScores.find((d) => d.avgScore === maxScore);

  useEffect(() => {
    console.log('🔍 Chart 4-8 - Financial Efficiency Radar');
    avgScores.forEach((d) => {
      console.log(`  🧠 ${d.name}: Avg Score=${Math.round(d.avgScore)}`);
    });
    console.log(`  🏆 Winner: ${winner?.name} (Score: ${Math.round(maxScore)})`);
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <BrainWidget score={maxScore} />
      <div className="text-lg font-semibold text-white mb-1">
        Chart 4-8: Financial Efficiency Radar
      </div>
      <div className="text-sm text-gray-400 mt-3 mb-4">
        Compares: (1) Annual HOA fees, (2) Property tax %, (3) Deed type (Fee Simple vs Condo), (4) Total annual cost (Taxes+HOA). Larger area = better value.
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#333" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: '#ffffff', fontWeight: 'bold', fontSize: 9 }}
          />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#666' }} />
          <Tooltip content={<CustomTooltip />} />
          {homes.map((home, index) => (
            <Radar
              key={home.id}
              name={home.name}
              dataKey={home.name}
              stroke={home.color}
              fill={home.color}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          ))}
          <Legend wrapperStyle={{ color: '#ffffff' }} />
        </RadarChart>
      </ResponsiveContainer>
      {winner && <WinnerBadge winnerName={winner.name} score={winner.avgScore} reason="Best overall financial efficiency across all factors" />}
      <SmartScaleLegend
        title="Financial Efficiency Profile"
        description="4-factor radar: HOA Score + Tax Rate + Ownership Type + Cost Index. Fuller shape = better overall."
      />
    </div>
  );
};

// ============================================
// MAIN COMPONENT - ALL 8 CHARTS
// ============================================
const HOATaxesCharts: React.FC<{ homes: Home[] }> = ({ homes }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Section 4: HOA & Taxes
        </h2>
        <p className="text-gray-400">
          Compare taxes, HOA costs, and true ownership structure
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart41_AnnualCostBreakdown homes={homes} />
        <Chart42_TaxRateComparison homes={homes} />
      </div>

      {/* Centered Chart 4-3 */}
      <div className="flex justify-center">
        <div className="w-full lg:w-1/2">
          <Chart43_HOAVsTaxBurden homes={homes} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart45_CostDistributionDonut homes={homes} />
        <Chart47_MonthlyVsAnnualCost homes={homes} />
        <Chart46_TrueCostOwnershipIndex homes={homes} />
      </div>
    </div>
  );
};

export default HOATaxesCharts;
