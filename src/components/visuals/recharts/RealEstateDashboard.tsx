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
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';

/**
 * REAL ESTATE COMPARISON DASHBOARD
 * ================================
 *
 * USAGE:
 *   import RealEstateDashboard from './RealEstateDashboard';
 *   <RealEstateDashboard homes={yourHomesArray} />
 *
 * REQUIRED DATA STRUCTURE (Home interface):
 *   {
 *     id: string,              // Unique identifier
 *     name: string,            // Display name (e.g., "1821 Hillcrest")
 *     listingPrice: number,    // Current asking price
 *     pricePerSqFt: number,    // Price per square foot
 *     marketValue: number,     // Market value from Zillow/Redfin/etc
 *     lastSaleDate: string,    // Date of last sale
 *     lastSalePrice: number,   // Price at last sale
 *     assessedValue: number,   // Tax assessed value
 *     redfinEstimate: number,  // Redfin estimate (used in Price Components)
 *   }
 *
 * CHARTS INCLUDED (5 total):
 *   1. Listing Price Comparison - vertical bars, lower is better
 *   2. $/Sq Ft Leaderboard - horizontal bars, lower is better
 *   3. List Price vs Market Value - dual bars with color-coded pricing
 *   4. Property Age Gauges - circular gauge per property (newness score)
 *   5. Appreciation Since Last Sale - vertical bars
 *
 * COLOR SYSTEM:
 *   Property 1: Teal (#14b8a6)
 *   Property 2: Violet (#8b5cf6)
 *   Property 3: Pink (#ec4899)
 *
 *   Score Bands (0-100):
 *     0-20: Red (Poor)
 *     21-40: Orange (Fair)
 *     41-60: Yellow (Average)
 *     61-80: Blue (Good)
 *     81+: Green (Excellent)
 */

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
  yearBuilt: number; // Field 25: year_built
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
    yearBuilt: 2015,
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
    yearBuilt: 2016,
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
    yearBuilt: 2014,
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
const tooltipContentStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  color: '#f9fafb',
  padding: '8px 12px',
};

const tooltipWrapperStyle = {
  outline: 'none',
};

const tooltipLabelStyle = {
  color: '#f9fafb',
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 4,
};

const tooltipItemStyle = {
  color: '#f9fafb',
  fontSize: 11,
  padding: 0,
};

const boldTooltipLabelStyle = {
  ...tooltipLabelStyle,
  fontWeight: 700,
};

const boldTooltipItemStyle = {
  ...tooltipItemStyle,
  fontWeight: 700,
};

// Utility helpers
function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

function formatCurrencyShort(value: number) {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return formatCurrency(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function scoreToBandColor(score: number) {
  if (score <= 20) return COLORS.scoreRed;
  if (score <= 40) return COLORS.scoreOrange;
  if (score <= 60) return COLORS.scoreYellow;
  if (score <= 80) return COLORS.scoreBlue;
  return COLORS.scoreGreen;
}

/**
 * CLUES-Smart 5-Tier Scoring System
 * Maps values to 5-tier scale: 0 (Red), 25 (Orange), 50 (Yellow), 75 (Blue), 100 (Green)
 * For affordability metrics (lower is better): cheapest = 100, most expensive = 0
 */
function scoreLowerIsBetter(values: number[]) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 50); // All equal = Yellow/Average

  // Map to 5-tier scale based on percentile position
  return values.map((v) => {
    const percentile = (max - v) / (max - min); // 0 = worst (most expensive), 1 = best (cheapest)

    // 5-TIER MAPPING:
    // 0-20% = 0 pts (Red/Poor)
    // 20-40% = 25 pts (Orange/Below Average)
    // 40-60% = 50 pts (Yellow/Average)
    // 60-80% = 75 pts (Blue/Good)
    // 80-100% = 100 pts (Green/Excellent)

    if (percentile <= 0.2) return 0;
    if (percentile <= 0.4) return 25;
    if (percentile <= 0.6) return 50;
    if (percentile <= 0.8) return 75;
    return 100;
  });
}

/**
 * For value metrics (higher is better): highest value = 100, lowest = 0
 */
function scoreHigherIsBetter(values: number[]) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 50);

  return values.map((v) => {
    const percentile = (v - min) / (max - min); // 0 = worst (lowest value), 1 = best (highest)

    if (percentile <= 0.2) return 0;
    if (percentile <= 0.4) return 25;
    if (percentile <= 0.6) return 50;
    if (percentile <= 0.8) return 75;
    return 100;
  });
}

function getNiceDomain(values: number[]) {
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

function findBestIndex(scores: number[]) {
  if (!scores.length) return { bestIndex: -1, secondBestIndex: null };
  const indexed = scores.map((s, i) => ({ s, i })).sort((a, b) => b.s - a.s);
  const bestIndex = indexed[0].i;
  const secondBestIndex = indexed[1] ? indexed[1].i : null;
  return { bestIndex, secondBestIndex };
}

// Legends
function PropertyLegend({ homes }: { homes: Home[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
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
    { label: '81+', text: 'Excellent', color: COLORS.scoreGreen },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
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
      className="flex items-center gap-1 px-2 py-0.5 rounded-full shadow-sm text-xs"
      style={{
        backgroundColor: COLORS.card,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <span role="img" aria-label="Smart score" className="text-sm">
        🧠
      </span>
      <span
        className="uppercase tracking-wide"
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

function CardTitle({ title, right }: { title: string; right?: React.ReactNode }) {
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

  // VERIFICATION: Log data and scoring
  console.log('\n📊 Chart 2-3: Listing Price Comparison - Data Verification');
  homes.forEach((h, idx) => {
    console.log(`  Property ${idx + 1}: ${h.name}`);
    console.log(`    Field 10 (listing_price): $${h.listingPrice.toLocaleString()}`);
  });

  const scores = scoreLowerIsBetter(values);
  console.log('\n🧠 Smart Score Calculation (5-Tier System):');
  scores.forEach((score, idx) => {
    console.log(`  ${homes[idx].name}: ${score}/100`);
  });

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
              formatter={(value) => [formatCurrency(value as number), 'Listing price']}
              wrapperStyle={tooltipWrapperStyle}
              contentStyle={tooltipContentStyle}
              labelStyle={boldTooltipLabelStyle}
              itemStyle={boldTooltipItemStyle}
            />
            <Bar dataKey="listingPrice" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="listingPrice"
                position="top"
                formatter={(value: number) => formatCurrencyShort(value)}
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
      <p className="mt-2 text-xs">
        <span style={{ color: COLORS.scoreGreen }}>✅ Best:</span>{' '}
        <span style={{ color: COLORS.text, fontWeight: 700 }}>{bestHome.name}</span>{' '}
        <span style={{ color: COLORS.muted }}>
          {secondHome && secondHome.id !== bestHome.id && priceDelta > 0
            ? `(${formatCurrency(priceDelta)} cheaper than the next home)`
            : ''}
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

  // VERIFICATION: Log data and scoring
  console.log('\n📊 Chart 2-4: $/Sq Ft Leaderboard - Data Verification');
  homes.forEach((h, idx) => {
    console.log(`  Property ${idx + 1}: ${h.name}`);
    console.log(`    Field 11 (price_per_sqft): $${h.pricePerSqFt.toFixed(2)}/sqft`);
  });

  const scores = scoreLowerIsBetter(values);
  console.log('\n🧠 Smart Score Calculation (5-Tier System):');
  scores.forEach((score, idx) => {
    console.log(`  ${homes[idx].name}: ${score}/100`);
  });

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
              formatter={(value) => [`$${(value as number).toLocaleString()}/sqft`, 'Price per Sq Ft']}
              wrapperStyle={tooltipWrapperStyle}
              contentStyle={tooltipContentStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
            />
            <Bar dataKey="pricePerSqFt" radius={[0, 4, 4, 0]}>
              <LabelList
                dataKey="pricePerSqFt"
                position="right"
                formatter={(value: number) => `$${value.toLocaleString()}/sqft`}
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
      <p className="mt-2 text-xs">
        <span style={{ color: COLORS.scoreGreen }}>✅ Best:</span>{' '}
        <span style={{ color: COLORS.text }}>{bestHome.name}</span>{' '}
        <span style={{ color: COLORS.muted }}>
          {secondHome && secondHome.id !== bestHome.id && deltaPerSqFt > 0
            ? `($${deltaPerSqFt.toLocaleString()}/sqft less expensive than the next home)`
            : ''}
        </span>
      </p>
    </>
  );
}

// Chart 3: List Price vs Market Value (simple comparison)
function ListVsMarketChart({ homes }: { homes: Home[] }) {
  // VERIFICATION: Log data
  console.log('\n📊 Chart 2-5: List Price vs Market Value - Data Verification');
  homes.forEach((h, idx) => {
    console.log(`  Property ${idx + 1}: ${h.name}`);
    console.log(`    Field 10 (listing_price): $${h.listingPrice.toLocaleString()}`);
    console.log(`    Field 12 (market_value_estimate): $${h.marketValue.toLocaleString()}`);
    const percentDiff = ((h.listingPrice - h.marketValue) / h.marketValue) * 100;
    console.log(`    % Difference: ${percentDiff.toFixed(2)}%`);
  });

  // Calculate how much list price is over/under market value
  const getListingColor = (listPrice: number, marketValue: number) => {
    const percentOver = ((listPrice - marketValue) / marketValue) * 100;
    if (percentOver >= 20) return COLORS.scoreRed;      // 20%+ over market
    if (percentOver >= 10) return COLORS.scoreOrange;   // 10-20% over market
    if (percentOver >= 0) return COLORS.scoreYellow;    // 0-10% over market
    if (percentOver >= -10) return COLORS.scoreBlue;    // 0-10% under market
    return COLORS.scoreGreen;                            // 10%+ under market
  };

  const data = homes.map((h, index) => {
    const percentDiff = ((h.listingPrice - h.marketValue) / h.marketValue) * 100;
    return {
      name: h.name,
      listingPrice: h.listingPrice,
      marketValue: h.marketValue,
      percentDiff,
      listingColor: getListingColor(h.listingPrice, h.marketValue),
      index,
    };
  });

  // Calculate Smart Scores (lower % diff = better)
  const percentDiffs = data.map(d => d.percentDiff);
  const scores = scoreLowerIsBetter(percentDiffs);
  console.log('\n🧠 Smart Score Calculation (5-Tier System):');
  scores.forEach((score, idx) => {
    console.log(`  ${homes[idx].name}: ${score}/100 (${percentDiffs[idx].toFixed(2)}% ${percentDiffs[idx] > 0 ? 'over' : 'under'} market)`);
  });

  const allValues = [...data.map(d => d.listingPrice), ...data.map(d => d.marketValue)];
  const [domainMin, domainMax] = getNiceDomain(allValues);

  // Find best deal (most under market)
  const sortedByDeal = [...data].sort((a, b) => a.percentDiff - b.percentDiff);
  const bestDeal = sortedByDeal[0];

  // Custom tick component to color each property name
  const CustomXAxisTick = ({ x, y, payload }: any) => {
    const index = data.findIndex(d => d.name === payload.value);
    const color = PROPERTY_COLORS[index] || COLORS.muted;
    // Shorten name to first part of address (before comma)
    const shortName = payload.value.split(',')[0];
    return (
      <text x={x} y={y + 10} textAnchor="middle" fill={color} fontSize={8} fontWeight={600}>
        {shortName}
      </text>
    );
  };

  return (
    <>
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis
              dataKey="name"
              tick={<CustomXAxisTick />}
              interval={0}
            />
            <YAxis
              domain={[domainMin, domainMax]}
              tick={{ fill: COLORS.muted, fontSize: 10 }}
              tickFormatter={(v) => formatCurrencyShort(v)}
            />
            <Tooltip
              formatter={(value, name) => [formatCurrency(value as number), name]}
              wrapperStyle={tooltipWrapperStyle}
              contentStyle={tooltipContentStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
            />
            <Bar dataKey="marketValue" name="Market Value" fill={COLORS.muted} radius={[4, 4, 0, 0]} />
            <Bar dataKey="listingPrice" name="List Price" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.listingColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: COLORS.muted }}>
        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.muted }} />
        <span>Market Value</span>
      </div>
      <p className="mt-2 text-xs">
        <span style={{ color: COLORS.scoreGreen }}>✅ Best deal:</span>{' '}
        <span style={{ color: COLORS.text }}>{bestDeal.name}</span>{' '}
        <span style={{ color: COLORS.muted }}>
          ({bestDeal.percentDiff >= 0 ? '+' : ''}{bestDeal.percentDiff.toFixed(1)}% vs market)
        </span>
      </p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs" style={{ color: COLORS.muted }}>
        <span>List vs Market:</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.scoreRed }} />20%+ over</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.scoreOrange }} />10-20% over</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.scoreYellow }} />0-10% over</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.scoreBlue }} />0-10% under</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.scoreGreen }} />10%+ under</span>
      </div>
    </>
  );
}



// Chart 6: Property Age Gauges (per home, 0–100 newness score)
// VERIFIED AGAINST SCHEMA: Field 25 (year_built)
// ECONOMIC USEFUL LIFE: 50 years for residential structures
function PropertyAgeGaugeChart({ homes }: { homes: Home[] }) {
  // VERIFICATION: Log incoming data from 168-field schema
  console.log('🔍 Chart 2-6: Property Age Gauges - Data Verification:');

  const currentYear = new Date().getFullYear();
  const ECONOMIC_USEFUL_LIFE = 50; // Years

  const data = homes.map((h, index) => {
    const yearBuilt = h.yearBuilt || currentYear;
    const age = currentYear - yearBuilt;
    const usefulLifeConsumed = (age / ECONOMIC_USEFUL_LIFE) * 100; // Percentage of useful life used

    console.log(`\n📊 Property ${index + 1}: ${h.name}`);
    console.log(`  Field 25 (year_built): ${yearBuilt}`);
    console.log(`  Calculated Age: ${age} years old`);
    console.log(`  Useful Life Consumed: ${usefulLifeConsumed.toFixed(1)}% of ${ECONOMIC_USEFUL_LIFE} years`);

    return {
      home: h,
      yearBuilt,
      age,
      usefulLifeConsumed,
      index,
    };
  });

  const usefulLifePercentages = data.map(d => d.usefulLifeConsumed);

  // 5-TIER CLUES-Smart Scoring: LOWER % of useful life consumed = BETTER score
  console.log('\n🧠 Chart 2-6: Smart Score Calculation (5-Tier System):');
  console.log('  Economic Useful Life: 50 years');
  console.log('  Scoring Method: Based on % of useful life consumed');
  console.log('  Lower % consumed (newer) = Higher score (Green)');
  console.log('  Higher % consumed (older) = Lower score (Red)');

  // Calculate scores based on percentage of useful life consumed (lower = better)
  const scores = usefulLifePercentages.map((pct) => {
    // Direct scoring: 0% consumed = 100 score, 100% consumed = 0 score
    const rawScore = Math.max(0, Math.min(100, 100 - pct));

    // Map to 5-tier bands for consistency with other charts
    if (rawScore >= 80) return 100; // 0-20% consumed = Green (Excellent)
    if (rawScore >= 60) return 75;  // 20-40% consumed = Blue (Good)
    if (rawScore >= 40) return 50;  // 40-60% consumed = Yellow (Average)
    if (rawScore >= 20) return 25;  // 60-80% consumed = Orange (Below Average)
    return 0;                        // 80-100% consumed = Red (Poor)
  });

  // Log scoring details
  data.forEach((d, idx) => {
    const rawScore = 100 - d.usefulLifeConsumed;
    console.log(`\n📊 Property ${idx + 1}: ${d.home.name}`);
    console.log(`  Year Built: ${d.yearBuilt}`);
    console.log(`  Age: ${d.age} years (${d.usefulLifeConsumed.toFixed(1)}% of ${ECONOMIC_USEFUL_LIFE}-year life)`);
    console.log(`  Raw Score: ${rawScore.toFixed(1)}/100`);
    console.log(`  🎯 5-Tier Smart Score: ${scores[idx]}/100`);

    const scoreColor = scores[idx] >= 80 ? 'Green (Excellent)' :
                       scores[idx] >= 60 ? 'Blue (Good)' :
                       scores[idx] >= 40 ? 'Yellow (Average)' :
                       scores[idx] >= 20 ? 'Orange (Below Average)' : 'Red (Poor)';
    console.log(`  Color Band: ${scoreColor}`);
  });

  const { bestIndex, secondBestIndex } = findBestIndex(scores);

  const bestData = data[bestIndex];
  const bestScore = scores[bestIndex];
  const secondScore =
    secondBestIndex !== null && secondBestIndex >= 0 ? scores[secondBestIndex] : bestScore;
  const scoreDelta = bestScore - secondScore;

  console.log(`\n🏆 Winner: ${bestData.home.name} - Built ${bestData.yearBuilt} (${bestData.age} years old, ${bestData.usefulLifeConsumed.toFixed(1)}% of useful life consumed) - Score: ${bestScore}/100`);

  return (
    <>
      <div className="relative flex justify-around items-center py-4">
        {data.map((d, i) => {
          const score = scores[i] || 0;
          const arcLength = Math.max(0, Math.min(100, score)) * 2.51; // ~251 circumference units
          const color = scoreToBandColor(score);

          return (
            <div key={d.home.id} className="flex flex-col items-center">
              <div className="relative w-20 h-20">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full"
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={COLORS.border}
                    strokeWidth="8"
                  />
                  {/* Score arc - 5-tier color */}
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
                  <span className="text-xs font-semibold" style={{ color: COLORS.muted }}>
                    Score
                  </span>
                  <span className="text-sm font-bold" style={{ color }}>
                    {score.toFixed(0)}
                  </span>
                </div>
              </div>
              <p className="text-xs mt-2 font-semibold" style={{ color: COLORS.text }}>
                {d.home.name.split(',')[0].split(' ').slice(-2).join(' ')}
              </p>
              <p className="text-xs" style={{ color: COLORS.muted }}>
                Built {d.yearBuilt}
              </p>
              <p className="text-xs" style={{ color: COLORS.muted }}>
                ({d.age} yrs / {d.usefulLifeConsumed.toFixed(0)}%)
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-1 text-xs">
        <span style={{ color: COLORS.scoreGreen }}>✅ Newest property:</span>{' '}
        <span style={{ color: COLORS.text }}>{bestData.home.name}</span>{' '}
        <span style={{ color: COLORS.muted }}>
          (Built {bestData.yearBuilt}, {bestData.age} years old, {bestData.usefulLifeConsumed.toFixed(1)}% of 50-year useful life; Score{' '}
          <span style={{ color: scoreToBandColor(bestScore) }}>{bestScore.toFixed(0)}</span>
          {scoreDelta > 0 ? ` · +${scoreDelta.toFixed(1)} pts vs next` : ''})
        </span>
      </p>
    </>
  );
}

// Chart 7: Appreciation Since Last Sale
// VERIFIED AGAINST SCHEMA: Field 10 (listing_price), Field 13 (last_sale_date), Field 14 (last_sale_price)
function AppreciationChart({ homes }: { homes: Home[] }) {
  // VERIFICATION: Log incoming data from 168-field schema
  console.log('🔍 Chart 2-7: Appreciation Since Last Sale - Data Verification:');
  homes.slice(0, 3).forEach((home, idx) => {
    console.log(`\n📊 Property ${idx + 1}: ${home.name}`);
    console.log(`  Field 10 (listing_price): $${home.listingPrice?.toLocaleString() || 'N/A'}`);
    console.log(`  Field 13 (last_sale_date): ${home.lastSaleDate || 'N/A'}`);
    console.log(`  Field 14 (last_sale_price): $${home.lastSalePrice?.toLocaleString() || 'N/A'}`);
  });

  const data = homes.map((h, index) => {
    const appreciation = ((h.listingPrice - h.lastSalePrice) / h.lastSalePrice) * 100;
    const dollarAppreciation = h.listingPrice - h.lastSalePrice;
    return {
      name: h.name,
      appreciation,
      dollarAppreciation,
      lastSaleDate: h.lastSaleDate || 'N/A',
      lastSalePrice: h.lastSalePrice,
      listingPrice: h.listingPrice,
      index,
    };
  });

  const values = data.map((d) => d.appreciation);
  if (!values.length) return null;

  // 5-TIER CLUES-Smart Scoring for Appreciation (higher is better)
  console.log('\n🧠 Chart 2-7: Smart Score Calculation (5-Tier System):');
  const scores = scoreHigherIsBetter(values);

  // Log scoring details
  data.forEach((d, idx) => {
    console.log(`\n📊 Property ${idx + 1}: ${d.name}`);
    console.log(`  Appreciation: ${d.appreciation.toFixed(2)}%`);
    console.log(`  Dollar Value: $${d.dollarAppreciation.toLocaleString()}`);
    console.log(`  🎯 Smart Score: ${scores[idx].toFixed(1)}/100`);
  });

  const { bestIndex, secondBestIndex } = findBestIndex(scores);
  const bestHome = homes[bestIndex];
  const bestAppreciation = values[bestIndex];
  const secondAppreciation =
    secondBestIndex !== null && secondBestIndex >= 0 ? values[secondBestIndex] : bestAppreciation;
  const appreciationDelta = bestAppreciation - secondAppreciation;
  const bestScore = scores[bestIndex];

  console.log(`\n🏆 Winner: ${bestHome.name} - Score: ${bestScore.toFixed(1)}/100`);

  const minApp = Math.min(...values);
  const maxApp = Math.max(...values);
  const [domainMin, domainMax] = getNiceDomain([minApp, maxApp]);

  // Custom X-axis tick to show name + last sale date
  const CustomXAxisTick = ({ x, y, payload }: any) => {
    const entry = data.find(d => d.name === payload.value);
    const color = entry ? PROPERTY_COLORS[entry.index] || COLORS.muted : COLORS.muted;
    const shortName = payload.value.split(',')[0];
    const saleDate = entry?.lastSaleDate || 'N/A';

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={8} textAnchor="middle" fill={color} fontSize={10} fontWeight={600}>
          {shortName}
        </text>
        <text x={0} y={0} dy={20} textAnchor="middle" fill={COLORS.muted} fontSize={8}>
          ({saleDate})
        </text>
      </g>
    );
  };

  return (
    <>
      <div className="relative">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} strokeOpacity={0.3} />
            <XAxis
              dataKey="name"
              tick={<CustomXAxisTick />}
              height={50}
              stroke={COLORS.muted}
            />
            <YAxis
              domain={[domainMin, domainMax]}
              tick={{ fill: COLORS.text, fontSize: 11 }}
              tickFormatter={(v) => formatPercent(v)}
              stroke={COLORS.muted}
            />
            <Tooltip
              formatter={(value, name, props) => {
                const dollarValue = props.payload.dollarAppreciation;
                return [
                  `${formatPercent(value as number)} (${formatCurrency(dollarValue)})`,
                  'Appreciation'
                ];
              }}
              labelFormatter={(label) => {
                const entry = data.find(d => d.name === label);
                return entry ? `${entry.name} - Last Sale: ${entry.lastSaleDate}` : label;
              }}
              wrapperStyle={tooltipWrapperStyle}
              contentStyle={tooltipContentStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
            />
            <Bar dataKey="appreciation" radius={[4, 4, 0, 0]} stroke={COLORS.border} strokeWidth={1}>
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={PROPERTY_COLORS[entry.index] || COLORS.muted}
                  fillOpacity={0.9}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs">
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



// Main App Component - accepts homes prop or uses sample data for preview
export default function RealEstateDashboard({ homes = sampleHomes }: { homes?: Home[] }) {
  // All charts are fully wired - just pass any array of 3 Home objects

  const listingPrices = homes.map((h) => h.listingPrice);
  const listingScores = scoreLowerIsBetter(listingPrices);
  const { bestIndex: bestListingIndex } = findBestIndex(listingScores);
  const bestListingScore =
    bestListingIndex >= 0 ? listingScores[bestListingIndex] : 0;

  const sqftPrices = homes.map((h) => h.pricePerSqFt);
  const sqftScores = scoreLowerIsBetter(sqftPrices);
  const { bestIndex: bestSqftIndex } = findBestIndex(sqftScores);
  const bestSqftScore = bestSqftIndex >= 0 ? sqftScores[bestSqftIndex] : 0;

  // List vs Market: negative percentDiff = under market = better deal
  const listVsMarketPercents = homes.map(
    (h) => ((h.listingPrice - h.marketValue) / h.marketValue) * 100,
  );
  // Lower (more negative) is better, so we use scoreLowerIsBetter
  const equityScores = scoreLowerIsBetter(listVsMarketPercents);
  const { bestIndex: bestEquityIndex } = findBestIndex(equityScores);
  const bestEquityScore =
    bestEquityIndex >= 0 ? equityScores[bestEquityIndex] : 0;

  const appreciations = homes.map(
    (h) => ((h.listingPrice - h.lastSalePrice) / h.lastSalePrice) * 100,
  );
  const appreciationScores = scoreHigherIsBetter(appreciations);
  const { bestIndex: bestAppIndex } = findBestIndex(appreciationScores);
  const bestAppScore = bestAppIndex >= 0 ? appreciationScores[bestAppIndex] : 0;

  // Property Age scores (based on economic useful life of 50 years)
  const currentYear = new Date().getFullYear();
  const ECONOMIC_USEFUL_LIFE = 50;
  const ageScores = homes.map((h) => {
    const age = currentYear - (h.yearBuilt || currentYear);
    const usefulLifeConsumed = (age / ECONOMIC_USEFUL_LIFE) * 100;
    const rawScore = Math.max(0, Math.min(100, 100 - usefulLifeConsumed));

    // Map to 5-tier bands
    if (rawScore >= 80) return 100; // 0-20% consumed = Green
    if (rawScore >= 60) return 75;  // 20-40% consumed = Blue
    if (rawScore >= 40) return 50;  // 40-60% consumed = Yellow
    if (rawScore >= 20) return 25;  // 60-80% consumed = Orange
    return 0;                        // 80-100% consumed = Red
  });
  const { bestIndex: bestAgeIndex } = findBestIndex(ageScores);
  const bestAgeScore = bestAgeIndex >= 0 ? ageScores[bestAgeIndex] : 0;

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
            <div className="relative">
              <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">Chart 2-3</div>
              <CardTitle
                title="Listing Price Comparison"
                right={<SmartScoreBadge value={bestListingScore} />}
              />
            </div>
            <PriceSpectrumChart homes={homes} />
            <LegendsRow homes={homes} />
          </Card>

          <Card>
            <div className="relative">
              <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">Chart 2-4</div>
              <CardTitle
                title="$/Sq Ft Leaderboard"
                right={<SmartScoreBadge value={bestSqftScore} />}
              />
            </div>
            <PricePerSqFtChart homes={homes} />
            <LegendsRow homes={homes} />
          </Card>

          <Card>
            <div className="relative">
              <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">Chart 2-5</div>
              <CardTitle
                title="List Price vs Market Value"
                right={<SmartScoreBadge value={bestEquityScore} />}
              />
            </div>
            <ListVsMarketChart homes={homes} />
          </Card>



          <Card>
            <div className="relative">
              <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">Chart 2-6</div>
              <CardTitle
                title="Property Age Gauges"
                right={<SmartScoreBadge value={bestAgeScore} />}
              />
            </div>
            <PropertyAgeGaugeChart homes={homes} />
            <LegendsRow homes={homes} />
          </Card>

          <Card className="md:col-span-2">
            <div className="relative">
              <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">Chart 2-7</div>
              <CardTitle
                title="Appreciation Since Last Sale"
                right={<SmartScoreBadge value={bestAppScore} />}
              />
            </div>
            <AppreciationChart homes={homes} />
            <LegendsRow homes={homes} />
          </Card>


        </div>
      </div>
    </div>
  );
}
