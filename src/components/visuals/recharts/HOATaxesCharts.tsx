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
const WinnerBadge: React.FC<{ winnerName: string; score: number }> = ({
  winnerName,
  score,
}) => {
  const color = getColorFromScore(score);
  return (
    <div className="mt-3 flex items-center justify-center gap-2 text-xs">
      <span className="text-yellow-400 text-lg">🏆</span>
      <span className="font-bold text-white">Winner:</span>
      <span className="font-bold" style={{ color }}>
        {winnerName}
      </span>
      <span className="text-gray-400">
        (Score: {Math.round(score)})
      </span>
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
      {winner && <WinnerBadge winnerName={winner.name} score={winner.score} />}
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
  const chartData = homes.map((home) => ({
    name: home.name,
    'Tax Rate': home.propertyTaxRate,
    score: scoreTaxRate(home.propertyTaxRate),
    fill: getColorFromScore(scoreTaxRate(home.propertyTaxRate)),
  }));

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
        </BarChart>
      </ResponsiveContainer>
      {winner && <WinnerBadge winnerName={winner.name} score={winner.score} />}
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
    fill: getColorFromScore(scoreTrueCostIndex(home, homes)),
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
        Bubble size = total annual cost
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 50, bottom: 70, left: 65 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="x"
            name="Annual Taxes"
            stroke="#666"
            tick={{ fill: '#ffffff', fontSize: 8 }}
            label={{
              value: 'Annual Taxes →',
              position: 'bottom',
              fill: '#ffffff',
              fontWeight: 'bold',
              offset: 0,
            }}
          />
          <YAxis
            dataKey="y"
            name="HOA"
            stroke="#666"
            tick={{ fill: '#ffffff', fontSize: 8 }}
            label={{
              value: '↑ HOA',
              angle: -90,
              position: 'insideLeft',
              fill: '#ffffff',
              fontWeight: 'bold',
            }}
          />
          <ZAxis dataKey="z" range={[200, 800]} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={chartData}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.7} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      {winner && <WinnerBadge winnerName={winner.name} score={winner.score} />}
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
    fill: getColorFromScore(scoreOwnershipType(home.ownershipType)),
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
        </BarChart>
      </ResponsiveContainer>
      {winner && <WinnerBadge winnerName={winner.name} score={winner.Score} />}
      <SmartScaleLegend
        title="Ownership Type Score"
        description="Fee Simple=100. Condo=75. Leasehold/Co-op=50. Affects mortgage & control."
      />
    </div>
  );
};

// ============================================
// CHART 4-5: COST DISTRIBUTION DONUT (PIE WITH INNER RADIUS)
// ============================================
const Chart45_CostDistributionDonut: React.FC<{ homes: Home[] }> = ({ homes }) => {
  const totalTax = homes.reduce((sum, h) => sum + h.annualTaxes, 0);
  const totalHOA = homes.reduce((sum, h) => sum + h.hoaFeeAnnual, 0);
  const totalCost = totalTax + totalHOA;

  const chartData = [
    { name: 'Taxes', value: totalTax, fill: '#2196F3' },
    { name: 'HOA', value: totalHOA, fill: '#4CAF50' },
  ];

  useEffect(() => {
    console.log('🔍 Chart 4-5 - Cost Distribution Donut');
    console.log(
      `  🧠 Taxes: ${formatCurrency(totalTax)} (${((totalTax / totalCost) * 100).toFixed(1)}%)`
    );
    console.log(
      `  🧠 HOA: ${formatCurrency(totalHOA)} (${((totalHOA / totalCost) * 100).toFixed(1)}%)`
    );
    console.log(`  🧠 Total Portfolio: ${formatCurrency(totalCost)}`);
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <BrainWidget score={100} label="SMART Score: Portfolio" />
      <div className="text-lg font-semibold text-white mb-1">
        Chart 4-5: Cost Distribution: Taxes vs HOA
      </div>
      <div className="text-sm text-gray-400 mt-3 mb-4">What % of total is each?</div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            label={(entry) =>
              `${entry.name} ${((entry.value / totalCost) * 100).toFixed(1)}%`
            }
            labelLine={false}
            labelStyle={{ fill: '#ffffff' }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center text-white font-bold mt-2">
        Portfolio Total: {formatCurrency(totalCost)}
      </div>
      <SmartScaleLegend
        title="Portfolio Composition"
        description="Pie shows Taxes vs HOA % of total portfolio spending across all 3 homes."
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
    fill: getColorFromScore(scoreTrueCostIndex(home, homes)),
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
        </BarChart>
      </ResponsiveContainer>
      {winner && <WinnerBadge winnerName={winner.name} score={winner.Score} />}
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
    Monthly: (home.annualTaxes + home.hoaFeeAnnual) / 12,
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
        Chart 4-7: Monthly vs Annual Cost
      </div>
      <div className="text-sm text-gray-400 mt-3 mb-4">
        Simplified monthly breakdown
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
          <YAxis stroke="#666" tick={{ fill: '#ffffff', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#ffffff' }} iconType="rect" />
          <Bar dataKey="Monthly" fill="#FF9800" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Annual" fill="#2196F3" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {winner && <WinnerBadge winnerName={winner.name} score={winner.score} />}
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
        Multi-factor ownership profile
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
      {winner && <WinnerBadge winnerName={winner.name} score={winner.avgScore} />}
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
        <Chart43_HOAVsTaxBurden homes={homes} />
        <Chart44_OwnershipTypeScore homes={homes} />
        <Chart45_CostDistributionDonut homes={homes} />
        <Chart46_TrueCostOwnershipIndex homes={homes} />
        <Chart47_MonthlyVsAnnualCost homes={homes} />
        <Chart48_FinancialEfficiencyRadar homes={homes} />
      </div>
    </div>
  );
};

export default HOATaxesCharts;
