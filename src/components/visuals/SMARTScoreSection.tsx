/**
 * SMART Score Overview Section
 * Displayed at TOP of Visuals page, outside category tabs
 * 5 charts showing overall property intelligence scoring
 *
 * ✅ ChartsReadme.md Requirements:
 * - Uses only 3 selected properties from dropdown
 * - Property-specific colors (Cyan, Purple, Pink)
 * - Dual legend system
 * - Score color coding (Red/Orange/Yellow/Blue/Green)
 * - Enhanced tooltips with addresses
 */

import { motion } from 'framer-motion';
import type { ChartProperty } from '@/lib/visualsDataMapper';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { DualLegend } from './ChartLegends';
import { PROPERTY_COLORS_ARRAY, getScoreColor, truncateAddress } from './visualConstants';

interface SMARTScoreSectionProps {
  properties: ChartProperty[];
}

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

export default function SMARTScoreSection({ properties }: SMARTScoreSectionProps) {
  // Limit to 3 selected properties
  const compareProps = properties.slice(0, 3);

  if (compareProps.length === 0) {
    return null;
  }

  // 1.1 - Overall SMART Score Radar
  const radarData = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 20),
    fullAddress: p.address,
    smartScore: p.smartScore || 0,
    dataCompleteness: p.dataCompleteness || 0,
    color: PROPERTY_COLORS_ARRAY[idx],
  }));

  // 1.2 - Individual Score Components
  const scoreComponents = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 15),
    fullAddress: p.address,
    smart: p.smartScore || 0,
    completeness: p.dataCompleteness || 0,
    color: PROPERTY_COLORS_ARRAY[idx],
  }));

  // 1.3 - SMART Score Comparison (with score color coding)
  const scoreComparison = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 20),
    fullAddress: p.address,
    score: p.smartScore || 0,
    color: PROPERTY_COLORS_ARRAY[idx],
    scoreColor: getScoreColor(p.smartScore || 0),
  }));

  // 1.4 - Data Completeness Comparison
  const completenessComparison = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 20),
    fullAddress: p.address,
    completeness: p.dataCompleteness || 0,
    color: PROPERTY_COLORS_ARRAY[idx],
    scoreColor: getScoreColor(p.dataCompleteness || 0),
  }));

  // 1.5 - Property Ranking by SMART Score
  const rankedProperties = [...compareProps]
    .sort((a, b) => (b.smartScore || 0) - (a.smartScore || 0))
    .map((p, i) => ({
      rank: i + 1,
      name: truncateAddress(p.address, 25),
      fullAddress: p.address,
      score: p.smartScore || 0,
      color: i === 0 ? '#10B981' : i === 1 ? '#FDE047' : '#EF4444', // Green/Yellow/Red ranking
    }));

  return (
    <div className="mb-8">
      <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30">
        <h2 className="text-2xl font-bold text-white mb-2">SMART Score Intelligence</h2>
        <p className="text-gray-400 text-sm">
          Comparing {compareProps.length} selected {compareProps.length === 1 ? 'property' : 'properties'} based on 100+ data variables
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1.1 - SMART Score Radar */}
        <ChartCard title="SMART Scores - Overall Property Intelligence Radar">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                        <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                        <p className="text-white text-xs">SMART Score: <span className="font-bold">{data.smartScore}</span></p>
                        <p className="text-white text-xs">Completeness: <span className="font-bold">{data.dataCompleteness}%</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {compareProps.map((p, idx) => (
                <Radar
                  key={idx}
                  name={truncateAddress(p.address, 15)}
                  dataKey="smartScore"
                  stroke={PROPERTY_COLORS_ARRAY[idx]}
                  fill={PROPERTY_COLORS_ARRAY[idx]}
                  fillOpacity={0.3}
                />
              ))}
              <Legend wrapperStyle={{ color: '#fff', paddingTop: '10px' }} />
            </RadarChart>
          </ResponsiveContainer>
          <DualLegend properties={compareProps} showScoreLegend={true} />
        </ChartCard>

        {/* Chart 1.2 - Score Components */}
        <ChartCard title="SMART Scores - Component Breakdown">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreComponents}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} domain={[0, 100]} label={{ value: 'Score', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                        <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                        <p className="text-white text-xs">SMART Score: <span className="font-bold">{data.smart}</span></p>
                        <p className="text-white text-xs">Data Completeness: <span className="font-bold">{data.completeness}%</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ color: '#fff', paddingTop: '10px' }} />
              <Bar dataKey="smart" fill="#00D9FF" name="SMART Score" />
              <Bar dataKey="completeness" fill="#10B981" name="Data Completeness" />
            </BarChart>
          </ResponsiveContainer>
          <DualLegend properties={compareProps} showScoreLegend={true} />
        </ChartCard>

        {/* Chart 1.3 - SMART Score with Grade Colors */}
        <ChartCard title="SMART Scores - Quality Grade Visualization">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} domain={[0, 100]} label={{ value: 'SMART Score', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                        <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                        <p className="text-white text-xs">SMART Score: <span className="font-bold">{data.score}/100</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                {scoreComparison.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.scoreColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <DualLegend properties={compareProps} showScoreLegend={true} />
        </ChartCard>

        {/* Chart 1.4 - Data Completeness */}
        <ChartCard title="Data Completeness - Information Coverage">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={completenessComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} domain={[0, 100]} label={{ value: 'Completeness (%)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                        <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                        <p className="text-white text-xs">Data Completeness: <span className="font-bold">{data.completeness}%</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="completeness" radius={[8, 8, 0, 0]}>
                {completenessComparison.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <DualLegend properties={compareProps} />
        </ChartCard>

        {/* Chart 1.5 - Property Ranking */}
        <ChartCard title="SMART Score Ranking - Best to Worst">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rankedProperties} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 12 }} domain={[0, 100]} label={{ value: 'SMART Score', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} width={150} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                        <p className="text-cyan-400 font-semibold text-xs mb-1">Rank #{data.rank}</p>
                        <p className="text-white text-xs">{data.fullAddress}</p>
                        <p className="text-white text-xs mt-1">SMART Score: <span className="font-bold">{data.score}/100</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                {rankedProperties.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="pt-4 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="text-gray-500 font-semibold uppercase tracking-wide">Ranking:</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10B981' }} />
                <span className="text-gray-300">Best (1st)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#FDE047' }} />
                <span className="text-gray-300">2nd Place</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#EF4444' }} />
                <span className="text-gray-300">3rd Place</span>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
