/**
 * BATCH 1: First 25 Visualizations from Claude Desktop
 * Adapted for CLUES Property Dashboard with real DataField<T> structure
 *
 * Categories:
 * 1. SMART Scores & Rankings (5 charts)
 * 2. Price & Value Analysis (5 charts)
 * 3. Total Cost of Ownership (5 charts)
 * 4. Size & Space (5 charts)
 * 5. Property Condition & Age (5 charts)
 */

import { motion } from 'framer-motion';
import type { ChartProperty } from '@/lib/visualsDataMapper';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface CategoryProps {
  properties: ChartProperty[];
}

// Glassmorphic card wrapper
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all"
    >
      <h3 className="text-sm font-semibold text-cyan-400 mb-4">{title}</h3>
      <div className="w-full h-80">
        {children}
      </div>
    </motion.div>
  );
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
        <p className="text-cyan-400 font-semibold text-sm">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-white text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const COLORS = ['#d4af37', '#4a9eff', '#b76e79', '#00d9a3', '#ffd93d', '#ff6b9d'];

export default function Category01_AddressIdentity({ properties }: CategoryProps) {

  // ============================================================
  // CATEGORY 1: SMART SCORES & RANKINGS
  // ============================================================

  // 1.1 - Overall SMART Score Radar
  const radarData = properties.slice(0, 3).map(p => ({
    name: p.address.split(',')[0],
    smartScore: p.smartScore || 0,
    dataCompleteness: p.dataCompleteness || 0,
  }));

  // 1.2 - Individual Score Components
  const scoreComponents = properties.slice(0, 3).map(p => ({
    name: p.city,
    smart: p.smartScore || 0,
    completeness: p.dataCompleteness || 0,
  }));

  // 1.3 - SMART Score Grade Distribution
  const gradeData = [
    { grade: 'A (90-100)', count: properties.filter(p => (p.smartScore || 0) >= 90).length },
    { grade: 'B (80-89)', count: properties.filter(p => (p.smartScore || 0) >= 80 && (p.smartScore || 0) < 90).length },
    { grade: 'C (70-79)', count: properties.filter(p => (p.smartScore || 0) >= 70 && (p.smartScore || 0) < 80).length },
    { grade: 'D (60-69)', count: properties.filter(p => (p.smartScore || 0) >= 60 && (p.smartScore || 0) < 70).length },
    { grade: 'F (<60)', count: properties.filter(p => (p.smartScore || 0) < 60).length },
  ];

  // 1.4 - Data Completeness Gauge
  const avgCompleteness = properties.reduce((sum, p) => sum + (p.dataCompleteness || 0), 0) / (properties.length || 1);

  // 1.5 - Property Ranking
  const rankedProperties = [...properties]
    .sort((a, b) => (b.smartScore || 0) - (a.smartScore || 0))
    .slice(0, 10)
    .map((p, i) => ({
      rank: i + 1,
      address: p.address.split(',')[0],
      score: p.smartScore || 0,
    }));

  // ============================================================
  // CATEGORY 2: PRICE & VALUE ANALYSIS
  // ============================================================

  // 2.1 - Asking Price Comparison
  const priceComparison = properties.map(p => ({
    address: p.city,
    price: p.listingPrice,
  }));

  // 2.2 - Price Per Square Foot
  const pricePerSqft = properties.map(p => ({
    address: p.city,
    pricePerSqft: p.pricePerSqft,
    sqft: p.livingSqft,
  }));

  // 2.3 - Valuation Waterfall
  const valuationData = properties.slice(0, 3).map(p => ({
    name: p.city,
    listing: p.listingPrice,
    market: p.marketValueEstimate,
    redfin: p.redfinEstimate,
    assessed: p.assessedValue,
  }));

  // 2.4 - Historical Appreciation
  const appreciationData = properties.map(p => ({
    address: p.city,
    lastSale: p.lastSalePrice,
    current: p.listingPrice,
    appreciation: p.lastSalePrice > 0 ? ((p.listingPrice - p.lastSalePrice) / p.lastSalePrice * 100) : 0,
  }));

  // 2.5 - Value Differential Scatter
  const valueDiff = properties.map(p => ({
    address: p.city,
    listPrice: p.listingPrice,
    marketValue: p.marketValueEstimate,
    diff: p.listingPrice - p.marketValueEstimate,
  }));

  // ============================================================
  // CATEGORY 3: TOTAL COST OF OWNERSHIP
  // ============================================================

  // 3.1 - Annual Carrying Costs
  const carryingCosts = properties.slice(0, 3).map(p => ({
    name: p.city,
    taxes: p.annualTaxes,
    hoa: p.hoaFeeAnnual,
    insurance: p.insuranceEstAnnual,
    total: p.annualTaxes + p.hoaFeeAnnual + p.insuranceEstAnnual,
  }));

  // 3.2 - Cost Components Stacked Bar
  const costComponents = properties.slice(0, 5).map(p => ({
    name: p.city,
    'Property Tax': p.annualTaxes,
    'HOA Fees': p.hoaFeeAnnual,
    'Insurance': p.insuranceEstAnnual,
  }));

  // 3.3 - Monthly vs Annual
  const monthlyVsAnnual = properties.slice(0, 3).map(p => ({
    name: p.city,
    monthly: (p.annualTaxes + p.hoaFeeAnnual + p.insuranceEstAnnual) / 12,
    annual: p.annualTaxes + p.hoaFeeAnnual + p.insuranceEstAnnual,
  }));

  // 3.4 - Carrying Cost %
  const costPercent = properties.map(p => ({
    address: p.city,
    percent: p.listingPrice > 0 ? ((p.annualTaxes + p.hoaFeeAnnual + p.insuranceEstAnnual) / p.listingPrice * 100) : 0,
  }));

  // 3.5 - HOA vs Non-HOA
  const hoaData = [
    { type: 'With HOA', count: properties.filter(p => p.hoaYn).length, avgCost: properties.filter(p => p.hoaYn).reduce((sum, p) => sum + p.hoaFeeAnnual, 0) / (properties.filter(p => p.hoaYn).length || 1) },
    { type: 'No HOA', count: properties.filter(p => !p.hoaYn).length, avgCost: 0 },
  ];

  // ============================================================
  // CATEGORY 4: SIZE & SPACE
  // ============================================================

  // 4.1 - Living Space Bubble
  const spaceData = properties.map(p => ({
    name: p.city,
    sqft: p.livingSqft,
    price: p.listingPrice,
    bedrooms: p.bedrooms,
  }));

  // 4.2 - Bed/Bath Matrix
  const bedBathData = properties.map(p => ({
    beds: p.bedrooms,
    baths: p.bathrooms,
    count: 1,
  })).reduce((acc, item) => {
    const key = `${item.beds}/${item.baths}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const bedBathChart = Object.entries(bedBathData).map(([key, count]) => ({
    name: key,
    count,
  }));

  // 4.3 - Lot Size vs Building
  const lotVsBuilding = properties.map(p => ({
    address: p.city,
    lotSize: p.lotSizeSqft,
    buildingSize: p.livingSqft,
  }));

  // 4.4 - Space Efficiency
  const spaceEfficiency = properties.map(p => ({
    address: p.city,
    ratio: p.lotSizeSqft > 0 ? (p.livingSqft / p.lotSizeSqft * 100) : 0,
  }));

  // 4.5 - Price Per Room
  const pricePerRoom = properties.map(p => ({
    address: p.city,
    pricePerBed: p.bedrooms > 0 ? p.listingPrice / p.bedrooms : 0,
    pricePerBath: p.bathrooms > 0 ? p.listingPrice / p.bathrooms : 0,
  }));

  // ============================================================
  // CATEGORY 5: PROPERTY CONDITION & AGE
  // ============================================================

  // 5.1 - Property Age Timeline
  const ageData = properties.map(p => ({
    address: p.city,
    yearBuilt: p.yearBuilt,
    age: 2025 - p.yearBuilt,
  }));

  // 5.2 - Roof & HVAC Remaining Life
  const systemLife = properties.slice(0, 5).map(p => ({
    name: p.city,
    roofAge: p.roofAge || 'Unknown',
    hvacAge: p.hvacAge || 'Unknown',
  }));

  // 5.3 - Condition Score (using smart score as proxy)
  const conditionGauge = properties.map(p => ({
    address: p.city,
    condition: p.smartScore || 0,
  }));

  // 5.4 - System Age Comparison
  const systemAge = properties.slice(0, 5).map(p => ({
    name: p.city,
    propertyAge: 2025 - p.yearBuilt,
  }));

  // 5.5 - Replacement Timeline (simplified)
  const replacementData = properties.slice(0, 5).map(p => ({
    name: p.city,
    roofType: p.roofType || 'Unknown',
    hvacType: p.hvacType || 'Unknown',
  }));

  return (
    <div className="space-y-8">
      {/* CATEGORY 1: SMART SCORES */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Category 1: SMART Scores & Rankings</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="1.1 - Overall SMART Score Radar">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Radar name="SMART Score" dataKey="smartScore" stroke="#00D9FF" fill="#00D9FF" fillOpacity={0.3} />
                <Radar name="Completeness" dataKey="dataCompleteness" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                <Legend wrapperStyle={{ color: '#fff' }} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="1.2 - Individual Score Components">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreComponents}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar dataKey="smart" fill="#00D9FF" name="SMART Score" />
                <Bar dataKey="completeness" fill="#10B981" name="Data Completeness" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="1.3 - SMART Score Grade Distribution">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="grade" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="1.4 - Data Completeness Gauge">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl font-bold text-cyan-400 mb-4">{avgCompleteness.toFixed(1)}%</div>
                <div className="text-gray-400">Average Data Completeness</div>
                <div className="mt-4 w-64 h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-green-500" style={{ width: `${avgCompleteness}%` }}></div>
                </div>
              </div>
            </div>
          </ChartCard>

          <ChartCard title="1.5 - Property Ranking by SMART Score">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankedProperties} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis type="category" dataKey="address" tick={{ fill: '#9CA3AF', fontSize: 11 }} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" fill="#F59E0B" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* CATEGORY 2: PRICE & VALUE */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Category 2: Price & Value Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="2.1 - Asking Price Comparison">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="address" tick={{ fill: '#9CA3AF', fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} formatter={(val: number) => `$${val.toLocaleString()}`} />
                <Bar dataKey="price" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="2.2 - Price Per Square Foot Analysis">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="sqft" name="Sqft" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis dataKey="pricePerSqft" name="$/Sqft" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Scatter data={pricePerSqft} fill="#00D9FF" />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="2.3 - Valuation Waterfall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valuationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} formatter={(val: number) => `$${val.toLocaleString()}`} />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar dataKey="listing" fill="#d4af37" name="List Price" />
                <Bar dataKey="market" fill="#4a9eff" name="Market Est" />
                <Bar dataKey="redfin" fill="#b76e79" name="Redfin Est" />
                <Bar dataKey="assessed" fill="#00d9a3" name="Assessed" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="2.4 - Historical Appreciation">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={appreciationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="address" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} formatter={(val: number) => `${val.toFixed(1)}%`} />
                <Line type="monotone" dataKey="appreciation" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="2.5 - Value Differential Scatter">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="listPrice" name="List Price" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                <YAxis dataKey="diff" name="Difference" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Scatter data={valueDiff} fill="#EF4444" />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* CATEGORY 3: TOTAL COST */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Category 3: Total Cost of Ownership</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="3.1 - Annual Carrying Costs Breakdown">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carryingCosts}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} formatter={(val: number) => `$${val.toLocaleString()}`} />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar dataKey="taxes" stackId="a" fill="#F59E0B" name="Property Tax" />
                <Bar dataKey="hoa" stackId="a" fill="#8B5CF6" name="HOA Fees" />
                <Bar dataKey="insurance" stackId="a" fill="#EF4444" name="Insurance" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="3.2 - Cost Components Stacked Bar">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costComponents}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} formatter={(val: number) => `$${val.toLocaleString()}`} />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar dataKey="Property Tax" stackId="a" fill="#F59E0B" />
                <Bar dataKey="HOA Fees" stackId="a" fill="#8B5CF6" />
                <Bar dataKey="Insurance" stackId="a" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="3.3 - Monthly vs Annual Cost Comparison">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyVsAnnual}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} formatter={(val: number) => `$${val.toLocaleString()}`} />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar dataKey="monthly" fill="#00D9FF" name="Monthly" />
                <Bar dataKey="annual" fill="#10B981" name="Annual" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="3.4 - Carrying Cost as % of Price">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costPercent}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="address" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} formatter={(val: number) => `${val.toFixed(2)}%`} />
                <Bar dataKey="percent" fill="#EC4899" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="3.5 - HOA vs Non-HOA Cost Analysis">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hoaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="type" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar dataKey="count" fill="#8B5CF6" name="Property Count" />
                <Bar dataKey="avgCost" fill="#F59E0B" name="Avg Annual HOA" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* CATEGORY 4: SIZE & SPACE */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Category 4: Size & Space</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="4.1 - Living Space Comparison Bubble">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="sqft" name="Sqft" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis dataKey="price" name="Price" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Scatter data={spaceData} fill="#00D9FF" />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="4.2 - Bedroom/Bathroom Count Matrix">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bedBathChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="4.3 - Lot Size vs Building Size">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lotVsBuilding}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="address" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar dataKey="lotSize" fill="#8B5CF6" name="Lot Size (sqft)" />
                <Bar dataKey="buildingSize" fill="#00D9FF" name="Building Size (sqft)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="4.4 - Space Efficiency Ratios">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spaceEfficiency}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="address" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} formatter={(val: number) => `${val.toFixed(1)}%`} />
                <Bar dataKey="ratio" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="4.5 - Price Per Room Analysis">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pricePerRoom}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="address" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} formatter={(val: number) => `$${val.toLocaleString()}`} />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar dataKey="pricePerBed" fill="#EC4899" name="Per Bedroom" />
                <Bar dataKey="pricePerBath" fill="#06B6D4" name="Per Bathroom" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* CATEGORY 5: CONDITION & AGE */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Category 5: Property Condition & Age</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="5.1 - Property Age Timeline">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="address" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="age" fill="#EF4444" radius={[8, 8, 0, 0]} name="Property Age (years)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="5.2 - Roof & HVAC Age">
            <div className="overflow-auto h-full">
              <table className="w-full text-white text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-2 text-cyan-400">Property</th>
                    <th className="text-left p-2 text-cyan-400">Roof Age</th>
                    <th className="text-left p-2 text-cyan-400">HVAC Age</th>
                  </tr>
                </thead>
                <tbody>
                  {systemLife.map((item, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="p-2">{item.name}</td>
                      <td className="p-2">{item.roofAge}</td>
                      <td className="p-2">{item.hvacAge}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          <ChartCard title="5.3 - Condition Score (SMART Score Proxy)">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conditionGauge}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="address" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="condition" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="5.4 - System Age Comparison">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={systemAge}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="propertyAge" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="5.5 - System Types Overview">
            <div className="overflow-auto h-full">
              <table className="w-full text-white text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-2 text-cyan-400">Property</th>
                    <th className="text-left p-2 text-cyan-400">Roof Type</th>
                    <th className="text-left p-2 text-cyan-400">HVAC Type</th>
                  </tr>
                </thead>
                <tbody>
                  {replacementData.map((item, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="p-2">{item.name}</td>
                      <td className="p-2">{item.roofType}</td>
                      <td className="p-2">{item.hvacType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
