import React from 'react';
import {
  BarChart,
  Bar,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  LineChart,
  Line,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ReferenceLine,
} from 'recharts';

// Types
interface Home {
  id: string;
  name: string;
  listingPrice: number;
  pricePerSqFt: number;
  marketValue: number;
  lastSaleDate: string;
  lastSalePrice: number;
  assessedValue: number;
  redfinEstimate: number;
}

// Sample Data (preview only) – in the real app, charts should receive real homes via props
const sampleHomes: Home[] = [
  {
    id: '1',
    name: '1821 Hillcrest',
    listingPrice: 2849000,
    pricePerSqFt: 1056,
    marketValue: 2800000,
    lastSaleDate: '01/01/2020',
    lastSalePrice: 2500000,
    assessedValue: 2700000,
    redfinEstimate: 2850000,
  },
  {
    id: '2',
    name: '1947 Oakwood',
    listingPrice: 2695000,
    pricePerSqFt: 988,
    marketValue: 2650000,
    lastSaleDate: '01/01/2021',
    lastSalePrice: 2400000,
    assessedValue: 2600000,
    redfinEstimate: 2700000,
  },
  {
    id: '3',
    name: '725 Live Oak',
    listingPrice: 2549000,
    pricePerSqFt: 912,
    marketValue: 2600000,
    lastSaleDate: '01/01/2019',
    lastSalePrice: 2200000,
    assessedValue: 2500000,
    redfinEstimate: 2550000,
  },
];

// Color system
const COLORS = {
  bg: '#0f172a',
  card: '#1e293b',
  border: '#334155',
  text: '#f9fafb',
  muted: '#94a3b8',
  // Property identity colors (must not overlap score scale colors)
  property1: '#14b8a6', // teal
  property2: '#8b5cf6', // violet
  property3: '#ec4899', // pink
  // 0–100 score scale bands
  scoreRed: '#ef4444', // 0–20
  scoreOrange: '#f97316', // 21–40
  scoreYellow: '#eab308', // 41–60
  scoreBlue: '#3b82f6', // 61–80
  scoreGreen: '#22c55e', // 81–100
};

const PROPERTY_COLORS = [COLORS.property1, COLORS.property2, COLORS.property3];

// Tooltip styles (high-contrast on dark background)
const tooltipContentStyle: React.CSSProperties = {
  backgroundColor: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
};

const tooltipLabelStyle: React.CSSProperties = {
  color: COLORS.text,
  fontSize: 12,
};

const tooltipItemStyle: React.CSSProperties = {
  color: COLORS.text,
  fontSize: 11,
};

const boldTooltipLabelStyle: React.CSSProperties = {
  ...tooltipLabelStyle,
  fontWeight: 700,
};

const boldTooltipItemStyle: React.CSSProperties = {
  ...tooltipItemStyle,
  fontWeight: 700,
};

// Utility helpers
function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`;
}

function formatCurrencyShort(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return formatCurrency(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function scoreToBandColor(score: number): string {
  if (score <= 20) return COLORS.scoreRed;
  if (score <= 40) return COLORS.scoreOrange;
  if (score <= 60) return COLORS.scoreYellow;
  if (score <= 80) return COLORS.scoreBlue;
  return COLORS.scoreGreen;
}

function scoreLowerIsBetter(values: number[]): number[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 50);
  return values.map((v) => ((max - v) / (max - min)) * 100);
}

function scoreHigherIsBetter(values: number[]): number[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 50);
  return values.map((v) => ((v - min) / (max - min)) * 100);
}

// Equity percent: we want 0 ~ 50 (neutral), negative bad, positive good
function scoreEquityPercent(equityPercents: number[]): number[] {
  if (!equityPercents.length) return [];
  return equityPercents.map((eq) => {
    if (eq <= -10) return 5; // very overpriced
    if (eq >= 20) return 95; // very undervalued
    if (eq < 0) {
      // -10..0 → 5..50
      return 5 + ((eq + 10) / 10) * (50 - 5);
    }
    // 0..20 → 50..95
    return 50 + (eq / 20) * (95 - 50);
  });
}

function getNiceDomain(values: number[]): [number, number] {
  if (!values.length) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const padding = Math.abs(min) * 0.1 || 1;
    return [min - padding, max + padding];
  }
  const range = max - min;
  const padding = range * 0.15;
  const rawMin = min - padding;
  const rawMax = max + padding;
  const magnitude = Math.pow(10, Math.floor(Math.log10(range || 1)));
  const niceMin = Math.floor(rawMin / magnitude) * magnitude;
  const niceMax = Math.ceil(rawMax / magnitude) * magnitude;
  return [niceMin, niceMax];
}

function findBestIndex(scores: number[]): { bestIndex: number; secondBestIndex: number | null } {
  if (!scores.length) return { bestIndex: -1, secondBestIndex: null };
  const indexed = scores.map((s, i) => ({ s, i })).sort((a, b) => b.s - a.s);
  const bestIndex = indexed[0].i;
  const secondBestIndex = indexed[1] ? indexed[1].i : null;
  return { bestIndex, secondBestIndex };
}

// Legends
function PropertyLegend({ homes }: { homes: Home[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px]">
      <span style={{ color: COLORS.muted }}>Properties:</span>
      {homes.map((h, i) => (
        <div key={h.id} className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: PROPERTY_COLORS[i] || COLORS.muted }}
          />
          <span style={{ color: COLORS.muted }}>{h.name}</span>
        </div>
      ))}
    </div>
  );
}

function ScoreLegend() {
  const bands = [
    { label: '0–20', text: 'Poor', color: COLORS.scoreRed },
    { label: '21–40', text: 'Fair', color: COLORS.scoreOrange },
    { label: '41–60', text: 'Average', color: COLORS.scoreYellow },
    { label: '61–80', text: 'Good', color: COLORS.scoreBlue },
    { label: '81–100', text: 'Excellent', color: COLORS.scoreGreen },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px] mt-1">
      {bands.map((b) => (
        <div key={b.label} className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: b.color }} />
          <span style={{ color: COLORS.muted }}>
            {b.label} <span className="font-semibold">{b.text}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function LegendsRow({ homes }: { homes: Home[] }) {
  return (
    <div className="mt-3 flex flex-col gap-1">
      <PropertyLegend homes={homes} />
      <ScoreLegend />
    </div>
  );
}

function SmartScoreBadge({ value }: { value: number }) {
  const score = Math.max(0, Math.min(100, value));
  const color = scoreToBandColor(score);

  return (
    <div
      className="flex items-center gap-1 px-2 py-[2px] rounded-full shadow-sm text-[10px]"
      style={{
        backgroundColor: COLORS.card,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <span role="img" aria-label="Smart score" className="text-[11px]">
        🧠
      </span>
      <span
        className="uppercase tracking-[0.08em]"
        style={{ color: COLORS.muted }}
      >
        Smart
      </span>
      <span className="font-semibold" style={{ color }}>
        {score.toFixed(0)}
      </span>
    </div>
  );
}

// Card Components
function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-xl p-5 ${className}`}
      style={{
        backgroundColor: COLORS.card,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      {children}
    </div>
  );
}

function CardTitle({
  title,
  right,
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between mb-4 pb-2"
      style={{ borderBottom: `1px solid ${COLORS.border}` }}
    >
      <h3
        className="font-semibold text-base"
        style={{ color: COLORS.scoreBlue }}
      >
        {title}
      </h3>
      {right}
    </div>
  );
}

// Chart 1: Listing Price Comparison (lower is better for affordability)
function PriceSpectrumChart({ homes }: { homes: Home[] }) {
  const data = homes.map((h, index) => ({
    name: h.name,
    listingPrice: h.listingPrice,
    index,
  }));

  const values = data.map((d) => d.listingPrice);
  if (!values.length) return null;

  const scores = scoreLowerIsBetter(values);
  const { bestIndex, secondBestIndex } = findBestIndex(scores);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || Math.abs(min) || 1;
  const padding = range * 0.05;
  const domainMin = min - padding;
  const domainMax = max + padding;

  const bestHome = homes[bestIndex];
  const secondHome =
    secondBestIndex !== null && secondBestIndex >= 0 ? homes[secondBestIndex] : bestHome;

  const priceDelta = secondHome.listingPrice - bestHome.listingPrice;
  const bestScore = scores[bestIndex];

  return (
    <>
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
          <XAxis
            dataKey="name"
            tick={{ fill: COLORS.muted, fontSize: 10 }}
            angle={-15}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            domain={[domainMin, domainMax]}
            tick={{ fill: COLORS.muted, fontSize: 10 }}
            tickFormatter={(v) => formatCurrencyShort(v)}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Listing price']}
            contentStyle={tooltipContentStyle}
            labelStyle={boldTooltipLabelStyle}
            itemStyle={boldTooltipItemStyle}
          />
          <Bar dataKey="listingPrice" radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="listingPrice"
              position="top"
              formatter={(value: number) => formatCurrencyShort(value as number)}
              style={{ fill: COLORS.text, fontSize: 10, fontWeight: 700 }}
            />
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={PROPERTY_COLORS[entry.index] || COLORS.muted}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px]">
        <span style={{ color: COLORS.scoreGreen }}>✅ Best:</span>{' '}
        <span style={{ color: COLORS.text, fontWeight: 700 }}>{bestHome.name}</span>{' '}
        <span style={{ color: COLORS.muted }}>
          (Score{' '}
          <span style={{ color: scoreToBandColor(bestScore) }}>{bestScore.toFixed(0)}</span>
          {secondHome && secondHome.id !== bestHome.id && priceDelta > 0
            ? ` · ${formatCurrency(priceDelta)} cheaper than the next home`
            : ''}
          )
        </span>
      </p>
    </>
  );
}

// Chart 2: $/Sq Ft Leaderboard (lower is better)
function PricePerSqFtChart({ homes }: { homes: Home[] }) {
  const data = homes.map((h, index) => ({
    name: h.name,
    pricePerSqFt: h.pricePerSqFt,
    index,
  }));

  const values = data.map((d) => d.pricePerSqFt);
  if (!values.length) return null;

  const scores = scoreLowerIsBetter(values);
  const { bestIndex, secondBestIndex } = findBestIndex(scores);
  const [domainMin, domainMax] = getNiceDomain(values);

  const bestHome = homes[bestIndex];
  const secondHome =
    secondBestIndex !== null && secondBestIndex >= 0 ? homes[secondBestIndex] : bestHome;
  const deltaPerSqFt = secondHome.pricePerSqFt - bestHome.pricePerSqFt;
  const bestScore = scores[bestIndex];

  // Sort data for display: best (lowest $/sqft) at top
  const sortedData = [...data].sort((a, b) => a.pricePerSqFt - b.pricePerSqFt);

  return (
    <>
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
          <XAxis
            type="number"
            domain={[domainMin, domainMax]}
            tick={{ fill: COLORS.muted, fontSize: 10 }}
            tickFormatter={(v) => `$${v.toLocaleString()}/sqft`}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: COLORS.muted, fontSize: 10 }}
            width={70}
          />
          <Tooltip
            formatter={(value: number) => [`$${value.toLocaleString()}/sqft`, 'Price per Sq Ft']}
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
          />
          <Bar dataKey="pricePerSqFt" radius={[0, 4, 4, 0]}>
            <LabelList
              dataKey="pricePerSqFt"
              position="right"
              formatter={(value: number) => `$${(value as number).toLocaleString()}/sqft`}
              style={{ fill: COLORS.text, fontSize: 10, fontWeight: 700 }}
            />
            {sortedData.map((entry) => (
              <Cell
                key={entry.name}
                fill={PROPERTY_COLORS[entry.index] || COLORS.muted}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px]">
        <span style={{ color: COLORS.scoreGreen }}>✅ Best:</span>{' '}
        <span style={{ color: COLORS.text }}>{bestHome.name}</span>{' '}
        <span style={{ color: COLORS.muted }}>
          (Score{' '}
          <span style={{ color: scoreToBandColor(bestScore) }}>{bestScore.toFixed(0)}</span>
          {secondHome && secondHome.id !== bestHome.id && deltaPerSqFt > 0
            ? ` · $${deltaPerSqFt.toLocaleString()}/sqft cheaper than the next home`
            : ''}
          )
        </span>
      </p>
    </>
  );
}

// Chart 3: Value Alignment (Equity % vs fair value)
function ValueAlignmentChart({ homes }: { homes: Home[] }) {
  const data = homes.map((h, index) => {
    const fairValue = (h.marketValue + h.redfinEstimate) / 2;
    const equityPercent = ((fairValue - h.listingPrice) / h.listingPrice) * 100;
    return {
      name: h.name,
      equityPercent,
      index,
    };
  });

  const equityValues = data.map((d) => d.equityPercent);
  if (!equityValues.length) return null;

  const scores = scoreEquityPercent(equityValues);
  const { bestIndex, secondBestIndex } = findBestIndex(scores);
  const bestHome = homes[bestIndex];
  const secondHome =
    secondBestIndex !== null && secondBestIndex >= 0 ? homes[secondBestIndex] : bestHome;

  const bestEquity = equityValues[bestIndex];
  const secondEquity =
    secondBestIndex !== null && secondBestIndex >= 0
      ? equityValues[secondBestIndex]
      : bestEquity;
  const equityDelta = bestEquity - secondEquity;

  const bestScore = scores[bestIndex];

  const minEq = Math.min(...equityValues);
  const maxEq = Math.max(...equityValues);
  const absMax = Math.max(Math.abs(minEq), Math.abs(maxEq), 1);

  // Diverging around 0
  const domain: [number, number] = [-absMax, absMax];

  return (
    <>
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
          <XAxis
            type="number"
            domain={domain}
            tick={{ fill: COLORS.muted, fontSize: 10 }}
            tickFormatter={(v) => formatPercent(v)}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: COLORS.muted, fontSize: 10 }}
            width={80}
          />
          <ReferenceLine x={0} stroke={COLORS.border} />
          <Tooltip
            formatter={(value: number) => [formatPercent(value), 'Equity vs fair value']}
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
          />
          <Bar dataKey="equityPercent" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={PROPERTY_COLORS[entry.index] || COLORS.muted}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px]">
        <span style={{ color: COLORS.scoreGreen }}>✅ Best:</span>{' '}
        <span style={{ color: COLORS.text }}>{bestHome.name}</span>{' '}
        <span style={{ color: COLORS.muted }}>
          (Equity {formatPercent(bestEquity)}; Score{' '}
          <span style={{ color: scoreToBandColor(bestScore) }}>{bestScore.toFixed(0)}</span>
          {secondHome && secondHome.id !== bestHome.id
            ? ` · ${equityDelta >= 0 ? '+' : ''}${formatPercent(equityDelta)} vs next`
            : ''}
          )
        </span>
      </p>
    </>
  );
}

// Chart 4: Equity Score Bars (0–100)
function EquityScoreChart({ homes }: { homes: Home[] }) {
  const data = homes.map((h, index) => {
    const fairValue = (h.marketValue + h.redfinEstimate) / 2;
    const equityPercent = ((fairValue - h.listingPrice) / h.listingPrice) * 100;
    return {
      name: h.name,
      index,
      equityPercent,
    };
  });

  const equityValues = data.map((d) => d.equityPercent);
  if (!equityValues.length) return null;

  const scores = scoreEquityPercent(equityValues);
  const { bestIndex, secondBestIndex } = findBestIndex(scores);
  const bestHome = homes[bestIndex];
  const bestScore = scores[bestIndex];
  const secondScore =
    secondBestIndex !== null && secondBestIndex >= 0 ? scores[secondBestIndex] : bestScore;
  const scoreDelta = bestScore - secondScore;

  const chartData = data.map((d, i) => ({
    ...d,
    score: scores[i],
  }));

  return (
    <>
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: COLORS.muted, fontSize: 10 }}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: COLORS.muted, fontSize: 10 }}
              width={80}
            />
            <Tooltip
              formatter={(value: number) => [`${(value as number).toFixed(0)}/100`, 'Equity score']}
              contentStyle={tooltipContentStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={PROPERTY_COLORS[entry.index] || COLORS.muted}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px]">
        <span style={{ color: COLORS.scoreGreen }}>✅ Best:</span>{' '}
        <span style={{ color: COLORS.text }}>{bestHome.name}</span>{' '}
        <span style={{ color: COLORS.muted }}>
          (Equity score{' '}
          <span style={{ color: scoreToBandColor(bestScore) }}>{bestScore.toFixed(0)}</span>
          {scoreDelta > 0 ? ` · +${scoreDelta.toFixed(1)} pts vs next` : ''})
        </span>
      </p>
    </>
  );
}

// Chart 5: Price Components (Listing vs Redfin vs Market vs Assessed)
function PriceComponentsChart({ homes }: { homes: Home[] }) {
  return (
    <div className="space-y-4">
      {homes.map((h, index) => {
        const values = [
          { label: 'Listing', value: h.listingPrice },
          { label: 'Redfin', value: h.redfinEstimate },
          { label: 'Market', value: h.marketValue },
          { label: 'Assessed', value: h.assessedValue },
        ];
        const max = Math.max(...values.map((v) => v.value));

        return (
          <div key={h.id}>
            <p className="text-xs font-medium mb-1" style={{ color: COLORS.muted }}>
              {h.name}
            </p>
            <div className="flex gap-1 h-6 rounded overflow-hidden">
              {values.map((v) => (
                <div
                  key={v.label}
                  className="relative group transition-all duration-300"
                  style={{
                    backgroundColor: COLORS.border,
                    width: `${(v.value / max) * 100}%`,
                  }}
                  title={`${v.label}: ${formatCurrency(v.value)}`}
                >
                  <span
                    className="absolute inset-0 flex items-center justify-center text-[10px] font-medium"
                    style={{ color: COLORS.text }}
                  >
                    {v.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <p className="text-[11px] mt-1" style={{ color: COLORS.muted }}>
        This view shows how each pricing reference (Listing, Redfin, Market, Assessed) compares for every
        home.
      </p>
    </div>
  );
}

// Chart 6: Comparative Radar (normalized scores 0–100)
function RadarChartComponent({ homes }: { homes: Home[] }) {
  // Base metrics
  const listingPrices = homes.map((h) => h.listingPrice);
  const pricePerSqFt = homes.map((h) => h.pricePerSqFt);
  const fairValues = homes.map((h) => (h.marketValue + h.redfinEstimate) / 2);
  const equityPercents = homes.map(
    (h, i) => ((fairValues[i] - h.listingPrice) / h.listingPrice) * 100,
  );

  const listingScores = scoreLowerIsBetter(listingPrices);
  const sqftScores = scoreLowerIsBetter(pricePerSqFt);
  const equityScores = scoreEquityPercent(equityPercents);

  const radarData = [
    {
      metric: 'Listing Price Score',
      ...Object.fromEntries(homes.map((h, i) => [h.name, listingScores[i]])),
    },
    {
      metric: '$/SqFt Score',
      ...Object.fromEntries(homes.map((h, i) => [h.name, sqftScores[i]])),
    },
    {
      metric: 'Equity Score',
      ...Object.fromEntries(homes.map((h, i) => [h.name, equityScores[i]])),
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={radarData} outerRadius="70%">
        <PolarGrid stroke={COLORS.border} />
        <PolarAngleAxis dataKey="metric" tick={{ fill: COLORS.muted, fontSize: 10 }} />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fill: COLORS.muted, fontSize: 8 }}
        />
        {homes.map((home, i) => (
          <Radar
            key={home.id}
            name={home.name}
            dataKey={home.name}
            stroke={PROPERTY_COLORS[i] || COLORS.muted}
            fill={PROPERTY_COLORS[i] || COLORS.muted}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
        <Legend
          wrapperStyle={{ fontSize: '10px', color: COLORS.muted }}
          formatter={(value: string) => <span style={{ color: COLORS.muted }}>{value}</span>}
        />
        <Tooltip
          contentStyle={tooltipContentStyle}
          labelStyle={tooltipLabelStyle}
          itemStyle={tooltipItemStyle}
          formatter={(value: number) => [`${(value as number).toFixed(0)}/100`, 'Score']}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// Chart 7: Equity Gauges (per home, 0–100 score)
function EquityGaugeChart({ homes }: { homes: Home[] }) {
  const fairValues = homes.map((h) => (h.marketValue + h.redfinEstimate) / 2);
  const equityPercents = homes.map(
    (h, i) => ((fairValues[i] - h.listingPrice) / h.listingPrice) * 100,
  );
  const scores = scoreEquityPercent(equityPercents);
  const { bestIndex, secondBestIndex } = findBestIndex(scores);

  const bestHome = homes[bestIndex];
  const bestScore = scores[bestIndex];
  const secondScore =
    secondBestIndex !== null && secondBestIndex >= 0 ? scores[secondBestIndex] : bestScore;
  const scoreDelta = bestScore - secondScore;

  return (
    <>
      <div className="relative flex justify-around items-center py-4">
        {homes.map((h, i) => {
          const score = scores[i] || 0;
          const arcLength = Math.max(0, Math.min(100, score)) * 2.51; // ~251 circumference units
          const color = scoreToBandColor(score);

          return (
            <div key={h.id} className="flex flex-col items-center">
              <div className="relative w-20 h-20">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full"
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={COLORS.border}
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${arcLength} 251`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-semibold" style={{ color: COLORS.muted }}>
                    Score
                  </span>
                  <span className="text-sm font-bold" style={{ color }}>
                    {score.toFixed(0)}
                  </span>
                </div>
              </div>
              <p className="text-xs mt-2" style={{ color: COLORS.muted }}>
                {h.name.split(' ')[1]}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-1 text-[11px]">
        <span style={{ color: COLORS.scoreGreen }}>✅ Best equity:</span>{' '}
        <span style={{ color: COLORS.text }}>{bestHome.name}</span>{' '}
        <span style={{ color: COLORS.muted }}>
          (Score{' '}
          <span style={{ color: scoreToBandColor(bestScore) }}>{bestScore.toFixed(0)}</span>
          {scoreDelta > 0 ? ` · +${scoreDelta.toFixed(1)} pts vs next` : ''})
        </span>
      </p>
    </>
  );
}

// Chart 8: Appreciation Since Last Sale
function AppreciationChart({ homes }: { homes: Home[] }) {
  const data = homes.map((h, index) => {
    const appreciation = ((h.listingPrice - h.lastSalePrice) / h.lastSalePrice) * 100;
    return {
      name: h.name,
      appreciation,
      index,
    };
  });

  const values = data.map((d) => d.appreciation);
  if (!values.length) return null;

  const scores = scoreHigherIsBetter(values);
  const { bestIndex, secondBestIndex } = findBestIndex(scores);
  const bestHome = homes[bestIndex];
  const bestAppreciation = values[bestIndex];
  const secondAppreciation =
    secondBestIndex !== null && secondBestIndex >= 0 ? values[secondBestIndex] : bestAppreciation;
  const appreciationDelta = bestAppreciation - secondAppreciation;
  const bestScore = scores[bestIndex];

  const minApp = Math.min(...values);
  const maxApp = Math.max(...values);
  const [domainMin, domainMax] = getNiceDomain([minApp, maxApp]);

  return (
    <>
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
          <XAxis
            dataKey="name"
            tick={{ fill: COLORS.muted, fontSize: 10 }}
          />
          <YAxis
            domain={[domainMin, domainMax]}
            tick={{ fill: COLORS.muted, fontSize: 10 }}
            tickFormatter={(v) => formatPercent(v)}
          />
          <Tooltip
            formatter={(value: number) => [formatPercent(value), 'Appreciation since last sale']}
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
          />
          <Bar dataKey="appreciation" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={PROPERTY_COLORS[entry.index] || COLORS.muted}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px]">
        <span style={{ color: COLORS.scoreGreen }}>✅ Best appreciation:</span>{' '}
        <span style={{ color: COLORS.text }}>{bestHome.name}</span>{' '}
        <span style={{ color: COLORS.muted }}>
          ({formatPercent(bestAppreciation)}; Score{' '}
          <span style={{ color: scoreToBandColor(bestScore) }}>{bestScore.toFixed(0)}</span>
          {appreciationDelta > 0
            ? ` · ${appreciationDelta >= 0 ? '+' : ''}${formatPercent(appreciationDelta)} vs next`
            : ''}
          )
        </span>
      </p>
    </>
  );
}

// Chart 9: Overall Value Score (0–100)
function OverallScoreChart({ homes }: { homes: Home[] }) {
  const listingPrices = homes.map((h) => h.listingPrice);
  const sqftPrices = homes.map((h) => h.pricePerSqFt);
  const fairValues = homes.map((h) => (h.marketValue + h.redfinEstimate) / 2);
  const equityPercents = homes.map(
    (h, i) => ((fairValues[i] - h.listingPrice) / h.listingPrice) * 100,
  );
  const appreciations = homes.map(
    (h) => ((h.listingPrice - h.lastSalePrice) / h.lastSalePrice) * 100,
  );

  const listingScores = scoreLowerIsBetter(listingPrices);
  const sqftScores = scoreLowerIsBetter(sqftPrices);
  const equityScores = scoreEquityPercent(equityPercents);
  const appreciationScores = scoreHigherIsBetter(appreciations);

  const scores = homes.map((_, i) => {
    const components = [
      listingScores[i],
      sqftScores[i],
      equityScores[i],
      appreciationScores[i],
    ];
    const valid = components.filter((s) => Number.isFinite(s));
    const avg = valid.length ? valid.reduce((sum, s) => sum + s, 0) / valid.length : 0;
    return avg;
  });

  const { bestIndex, secondBestIndex } = findBestIndex(scores);
  const bestHome = homes[bestIndex];
  const bestScore = scores[bestIndex];
  const secondScore =
    secondBestIndex !== null && secondBestIndex >= 0 ? scores[secondBestIndex] : bestScore;
  const scoreDelta = bestScore - secondScore;

  const data = homes.map((h, index) => ({
    name: h.name,
    index,
    score: scores[index],
  }));

  return (
    <>
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: COLORS.muted, fontSize: 10 }}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: COLORS.muted, fontSize: 10 }}
              width={80}
            />
            <Tooltip
              formatter={(value: number) => [`${(value as number).toFixed(0)}/100`, 'Overall score']}
              contentStyle={tooltipContentStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={PROPERTY_COLORS[entry.index] || COLORS.muted}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px]">
        <span style={{ color: COLORS.scoreGreen }}>✅ Overall best:</span>{' '}
        <span style={{ color: COLORS.text }}>{bestHome.name}</span>{' '}
        <span style={{ color: COLORS.muted }}>
          (Overall score{' '}
          <span style={{ color: scoreToBandColor(bestScore) }}>{bestScore.toFixed(0)}</span>
          {scoreDelta > 0 ? ` · +${scoreDelta.toFixed(1)} pts vs next` : ''})
        </span>
      </p>
    </>
  );
}

// Chart 10: Value Pyramid – Assessed → Market → Listing
function ValuePyramidChart({ homes }: { homes: Home[] }) {
  const data = homes.map((h) => ({
    name: h.name.split(' ')[1],
    assessed: h.assessedValue,
    marketDelta: Math.max(0, h.marketValue - h.assessedValue),
    listingDelta: Math.max(0, h.listingPrice - h.marketValue),
  }));

  const allValues = [
    ...data.map((d) => d.assessed),
    ...data.map((d) => d.assessed + d.marketDelta + d.listingDelta),
  ];
  const [domainMin, domainMax] = getNiceDomain(allValues);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
        <XAxis
          type="number"
          domain={[domainMin, domainMax]}
          tick={{ fill: COLORS.muted, fontSize: 10 }}
          tickFormatter={(v) => formatCurrencyShort(v)}
        />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fill: COLORS.muted, fontSize: 10 }}
          width={80}
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), 'Value']}
          contentStyle={tooltipContentStyle}
          labelStyle={tooltipLabelStyle}
          itemStyle={tooltipItemStyle}
        />
        <Legend wrapperStyle={{ fontSize: '10px', color: COLORS.muted }} />
        <Bar dataKey="assessed" stackId="a" fill={COLORS.scoreRed} name="Assessed" />
        <Bar dataKey="marketDelta" stackId="a" fill={COLORS.scoreYellow} name="Market Δ" />
        <Bar
          dataKey="listingDelta"
          stackId="a"
          fill={COLORS.scoreBlue}
          name="Listing Δ"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Main App Component (preview wrapper)
export default function RealEstateDashboard() {
  const homes = sampleHomes; // In real integration, pass real homes into these charts

  const listingPrices = homes.map((h) => h.listingPrice);
  const listingScores = scoreLowerIsBetter(listingPrices);
  const { bestIndex: bestListingIndex } = findBestIndex(listingScores);
  const bestListingScore =
    bestListingIndex >= 0 ? listingScores[bestListingIndex] : 0;

  const sqftPrices = homes.map((h) => h.pricePerSqFt);
  const sqftScores = scoreLowerIsBetter(sqftPrices);
  const { bestIndex: bestSqftIndex } = findBestIndex(sqftScores);
  const bestSqftScore = bestSqftIndex >= 0 ? sqftScores[bestSqftIndex] : 0;

  const fairValues = homes.map((h) => (h.marketValue + h.redfinEstimate) / 2);
  const equityPercents = homes.map(
    (h, i) => ((fairValues[i] - h.listingPrice) / h.listingPrice) * 100,
  );
  const equityScores = scoreEquityPercent(equityPercents);
  const { bestIndex: bestEquityIndex } = findBestIndex(equityScores);
  const bestEquityScore =
    bestEquityIndex >= 0 ? equityScores[bestEquityIndex] : 0;

  const appreciations = homes.map(
    (h) => ((h.listingPrice - h.lastSalePrice) / h.lastSalePrice) * 100,
  );
  const appreciationScores = scoreHigherIsBetter(appreciations);
  const { bestIndex: bestAppIndex } = findBestIndex(appreciationScores);
  const bestAppScore = bestAppIndex >= 0 ? appreciationScores[bestAppIndex] : 0;

  const overallScores = homes.map((_, i) => {
    const components = [
      listingScores[i],
      sqftScores[i],
      equityScores[i],
      appreciationScores[i],
    ];
    const valid = components.filter((s) => Number.isFinite(s));
    const avg = valid.length
      ? valid.reduce((sum, s) => sum + s, 0) / valid.length
      : 0;
    return avg;
  });
  const { bestIndex: bestOverallIndex } = findBestIndex(overallScores);
  const bestOverallScore =
    bestOverallIndex >= 0 ? overallScores[bestOverallIndex] : 0;

  return

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-1" style={{ color: COLORS.text }}>
          Real Estate Comparison Dashboard
        </h1>
        <p className="text-sm mb-6" style={{ color: COLORS.muted }}>
          Comparing 3 properties across 10 visualization types (all charts wired for any 3 homes)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardTitle
              title="1. Listing Price Comparison"
              right={<SmartScoreBadge value={bestListingScore} />}
            />
            <PriceSpectrumChart homes={homes} />
            <LegendsRow homes={homes} />
          </Card>

          <Card>
            <CardTitle
              title="2. $/Sq Ft Leaderboard"
              right={<SmartScoreBadge value={bestSqftScore} />}
            />
            <PricePerSqFtChart homes={homes} />
            <LegendsRow homes={homes} />
          </Card>

          <Card>
            <CardTitle
              title="3. Value Alignment (Equity %)"
              right={<SmartScoreBadge value={bestEquityScore} />}
            />
            <ValueAlignmentChart homes={homes} />
            <LegendsRow homes={homes} />
          </Card>

          <Card>
            <CardTitle
              title="4. Equity Score (0–100)"
              right={<SmartScoreBadge value={bestEquityScore} />}
            />
            <EquityScoreChart homes={homes} />
            <LegendsRow homes={homes} />
          </Card>

          <Card className="md:col-span-2">
            <CardTitle title="5. Price Components" />
            <PriceComponentsChart homes={homes} />
            <LegendsRow homes={homes} />
          </Card>

          <Card className="md:col-span-2">
            <CardTitle title="6. Comparative Radar (Scores)" />
            <RadarChartComponent homes={homes} />
            <LegendsRow homes={homes} />
          </Card>

          <Card>
            <CardTitle
              title="7. Equity Gauges"
              right={<SmartScoreBadge value={bestEquityScore} />}
            />
            <EquityGaugeChart homes={homes} />
            <LegendsRow homes={homes} />
          </Card>

          <Card className="md:col-span-2">
            <CardTitle
              title="8. Appreciation Since Last Sale"
              right={<SmartScoreBadge value={bestAppScore} />}
            />
            <AppreciationChart homes={homes} />
            <LegendsRow homes={homes} />
          </Card>

          <Card>
            <CardTitle
              title="9. Overall Value Score"
              right={<SmartScoreBadge value={bestOverallScore} />}
            />
            <OverallScoreChart homes={homes} />
            <LegendsRow homes={homes} />
          </Card>

          <Card className="lg:col-span-3">
            <CardTitle title="10. Value Pyramid" />
            <ValuePyramidChart homes={homes} />
        