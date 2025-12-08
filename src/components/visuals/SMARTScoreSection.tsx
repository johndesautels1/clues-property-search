/**
 * SMART Score Overview Section
 * Displayed at TOP of Visuals page, outside category tabs
 * 5 charts showing overall property intelligence scoring
 */

import { motion } from 'framer-motion';
import type { ChartProperty } from '@/lib/visualsDataMapper';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface SMARTScoreSectionProps {
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

export default function SMARTScoreSection({ properties }: SMARTScoreSectionProps) {
  // 1.1 - Overall SMART Score Radar
  const radarData = properties.slice(0, 3).map(p => ({
    name: p.address.split(',')[0] || p.city,
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
      address: p.address.split(',')[0] || p.city,
      score: p.smartScore || 0,
    }));

  return (
    <div className="mb-8">
      <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30">
        <h2 className="text-2xl font-bold text-white mb-2">SMART Score Intelligence</h2>
        <p className="text-gray-400 text-sm">
          Overall property scoring based on 100+ data variables. Master analytics overview.
        </p>
      </div>

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
  );
}
