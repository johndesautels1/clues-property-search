/**
 * Risk Dashboard
 *
 * Radar charts and risk visualization for environmental & crime risks
 * Shows flood, hurricane, sea level, wildfire, earthquake, tornado risks
 * Plus crime statistics breakdown
 */

import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';
import {
  AlertTriangle,
  Waves,
  Wind,
  Flame,
  Mountain,
  CloudLightning,
  Shield,
  ShieldAlert,
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

interface Property {
  id: string | number;
  address: string;
  floodRisk: number;
  hurricaneRisk: number;
  seaLevelRisk: number;
  wildfireRisk: number;
  earthquakeRisk: number;
  tornadoRisk: number;
  safetyScore: number;
  violentCrime: string;
  propertyCrime: string;
  [key: string]: any;
}

interface RiskDashboardProps {
  properties: Property[];
  title?: string;
}

// Risk color based on value (1-10 scale)
function getRiskColor(value: number): string {
  if (value >= 7) return '#EF4444'; // Red - high risk
  if (value >= 4) return '#F59E0B'; // Amber - moderate risk
  return '#10B981'; // Green - low risk
}

// Safety score color (0-100 scale, higher is better)
function getSafetyColor(score: number): string {
  if (score >= 80) return '#10B981'; // Green - safe
  if (score >= 60) return '#F59E0B'; // Amber - moderate
  return '#EF4444'; // Red - unsafe
}

// Calculate average for array of numbers
function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Count crime levels
function countCrimeLevels(properties: Property[], field: 'violentCrime' | 'propertyCrime'): { low: number; mod: number; high: number } {
  const counts = { low: 0, mod: 0, high: 0 };
  properties.forEach(p => {
    const level = (p[field] || '').toUpperCase();
    if (level === 'LOW') counts.low++;
    else if (level === 'MOD' || level === 'MODERATE') counts.mod++;
    else if (level === 'HIGH') counts.high++;
  });
  return counts;
}

// Individual property risk card
function PropertyRiskCard({ property, index }: { property: Property; index: number }) {
  const risks = [
    { label: 'Flood', value: property.floodRisk, icon: Waves },
    { label: 'Hurricane', value: property.hurricaneRisk, icon: Wind },
    { label: 'Sea Level', value: property.seaLevelRisk, icon: Waves },
    { label: 'Wildfire', value: property.wildfireRisk, icon: Flame },
    { label: 'Earthquake', value: property.earthquakeRisk, icon: Mountain },
    { label: 'Tornado', value: property.tornadoRisk, icon: CloudLightning },
  ];

  const shortAddr = property.address.split(',')[0] || property.address;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-white font-semibold truncate flex-1" title={property.address}>
          {shortAddr}
        </p>
        <div
          className="px-2 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: `${getSafetyColor(property.safetyScore)}20`,
            color: getSafetyColor(property.safetyScore),
          }}
        >
          Safety: {property.safetyScore}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {risks.map(risk => (
          <div key={risk.label} className="text-center">
            <div
              className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center mb-1"
              style={{ backgroundColor: `${getRiskColor(risk.value)}20` }}
            >
              <risk.icon className="w-4 h-4" style={{ color: getRiskColor(risk.value) }} />
            </div>
            <p className="text-gray-500 text-xs">{risk.label}</p>
            <p className="font-semibold text-sm" style={{ color: getRiskColor(risk.value) }}>
              {risk.value}/10
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs">
        <span className="text-gray-500">
          Violent Crime: <span className={property.violentCrime === 'LOW' ? 'text-green-400' : property.violentCrime === 'HIGH' ? 'text-red-400' : 'text-yellow-400'}>{property.violentCrime}</span>
        </span>
        <span className="text-gray-500">
          Property Crime: <span className={property.propertyCrime === 'LOW' ? 'text-green-400' : property.propertyCrime === 'HIGH' ? 'text-red-400' : 'text-yellow-400'}>{property.propertyCrime}</span>
        </span>
      </div>
    </motion.div>
  );
}

export default function RiskDashboard({ properties, title = "Risk Analysis" }: RiskDashboardProps) {
  if (!properties || properties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No properties to analyze</p>
      </div>
    );
  }

  // Calculate portfolio averages
  const avgRisks = {
    flood: avg(properties.map(p => p.floodRisk || 0)),
    hurricane: avg(properties.map(p => p.hurricaneRisk || 0)),
    seaLevel: avg(properties.map(p => p.seaLevelRisk || 0)),
    wildfire: avg(properties.map(p => p.wildfireRisk || 0)),
    earthquake: avg(properties.map(p => p.earthquakeRisk || 0)),
    tornado: avg(properties.map(p => p.tornadoRisk || 0)),
  };

  const avgSafety = avg(properties.map(p => p.safetyScore || 0));
  const violentCounts = countCrimeLevels(properties, 'violentCrime');
  const propertyCounts = countCrimeLevels(properties, 'propertyCrime');

  // Radar chart data for environmental risks
  const radarData = {
    labels: ['Flood', 'Hurricane', 'Sea Level', 'Wildfire', 'Earthquake', 'Tornado'],
    datasets: [
      {
        label: 'Portfolio Avg Risk',
        data: [
          avgRisks.flood,
          avgRisks.hurricane,
          avgRisks.seaLevel,
          avgRisks.wildfire,
          avgRisks.earthquake,
          avgRisks.tornado,
        ],
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: '#EF4444',
        borderWidth: 2,
        pointBackgroundColor: '#EF4444',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#EF4444',
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        pointLabels: {
          color: '#9CA3AF',
          font: { size: 11 },
        },
        ticks: {
          color: '#6B7280',
          backdropColor: 'transparent',
          stepSize: 2,
        },
        suggestedMin: 0,
        suggestedMax: 10,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#9CA3AF',
      },
    },
  };

  // Bar chart for crime distribution
  const crimeBarData = {
    labels: ['Low', 'Moderate', 'High'],
    datasets: [
      {
        label: 'Violent Crime',
        data: [violentCounts.low, violentCounts.mod, violentCounts.high],
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderRadius: 4,
      },
      {
        label: 'Property Crime',
        data: [propertyCounts.low, propertyCounts.mod, propertyCounts.high],
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderRadius: 4,
      },
    ],
  };

  const crimeBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#9CA3AF' },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#9CA3AF', stepSize: 1 },
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: { color: '#9CA3AF' },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-red-400" />
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <span className="text-gray-500 text-sm">({properties.length} properties)</span>
      </div>

      {/* Portfolio Summary Cards - WITH PROPERTY REFERENCES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Safety Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${getSafetyColor(avgSafety)}20` }}>
              <Shield className="w-5 h-5" style={{ color: getSafetyColor(avgSafety) }} />
            </div>
            <span className="text-gray-400 text-sm">Avg Safety Score</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: getSafetyColor(avgSafety) }}>
            {avgSafety.toFixed(0)}/100
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {avgSafety >= 80 ? 'Low Risk Portfolio' : avgSafety >= 60 ? 'Moderate Risk' : 'High Risk Portfolio'}
          </p>
          {/* PROPERTY REFERENCE */}
          <div className="mt-3 pt-2 border-t border-white/10">
            <p className="text-cyan-400 text-xs font-medium">
              Analyzing: {properties.length === 1
                ? (properties[0].address.split(',')[0] || properties[0].address)
                : `${properties.length} properties`}
            </p>
          </div>
        </motion.div>

        {/* Highest Environmental Risk */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-red-500/20">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-gray-400 text-sm">Highest Risk Factor</span>
          </div>
          {(() => {
            const maxRisk = Math.max(...Object.values(avgRisks));
            const maxKey = Object.entries(avgRisks).find(([, v]) => v === maxRisk)?.[0] || 'N/A';
            // Find property with highest risk in this category
            const riskField = maxKey === 'flood' ? 'floodRisk' :
                             maxKey === 'hurricane' ? 'hurricaneRisk' :
                             maxKey === 'seaLevel' ? 'seaLevelRisk' :
                             maxKey === 'wildfire' ? 'wildfireRisk' :
                             maxKey === 'earthquake' ? 'earthquakeRisk' : 'tornadoRisk';
            const highestRiskProp = [...properties].sort((a, b) => (b[riskField] || 0) - (a[riskField] || 0))[0];
            return (
              <>
                <p className="text-3xl font-bold text-red-400">{maxRisk.toFixed(1)}/10</p>
                <p className="text-gray-500 text-xs mt-1 capitalize">{maxKey} Risk</p>
                {/* PROPERTY REFERENCE */}
                <div className="mt-3 pt-2 border-t border-white/10">
                  <p className="text-amber-400 text-xs">
                    Highest: {highestRiskProp.address.split(',')[0]} ({highestRiskProp[riskField]}/10)
                  </p>
                </div>
              </>
            );
          })()}
        </motion.div>

        {/* Crime Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-gray-400 text-sm">Low Crime Areas</span>
          </div>
          <p className="text-3xl font-bold text-green-400">
            {violentCounts.low}/{properties.length}
          </p>
          <p className="text-gray-500 text-xs mt-1">Properties in low violent crime areas</p>
          {/* PROPERTY REFERENCE */}
          {(() => {
            const lowCrimeProps = properties.filter(p => (p.violentCrime || '').toUpperCase() === 'LOW');
            return lowCrimeProps.length > 0 ? (
              <div className="mt-3 pt-2 border-t border-white/10">
                <p className="text-green-400 text-xs truncate" title={lowCrimeProps.map(p => p.address.split(',')[0]).join(', ')}>
                  {lowCrimeProps.length <= 2
                    ? lowCrimeProps.map(p => p.address.split(',')[0]).join(', ')
                    : `${lowCrimeProps[0].address.split(',')[0]} +${lowCrimeProps.length - 1} more`}
                </p>
              </div>
            ) : null;
          })()}
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Environmental Risk Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <p className="text-white font-semibold mb-4">Environmental Risk Profile</p>
          <div className="h-64">
            <Radar data={radarData} options={radarOptions} />
          </div>
        </motion.div>

        {/* REDESIGNED Crime Index Chart - with proper axes, sources, property reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-white font-semibold">Crime Index by Property</p>
            <div className="text-right">
              <p className="text-gray-400 text-xs">Data as of {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Explanation of crime index */}
          <div className="mb-4 p-2 rounded-lg bg-white/5">
            <p className="text-cyan-300 text-xs">
              <strong>Crime Index Scale:</strong> 0 = Safest (no crime), 100 = National Average, 200+ = High Crime
            </p>
          </div>

          {/* Property-based crime bars */}
          <div className="space-y-3">
            {properties.map((prop, i) => {
              // Convert LOW/MOD/HIGH to crime index scores
              const violentLevel = (prop.violentCrime || '').toUpperCase();
              const propertyLevel = (prop.propertyCrime || '').toUpperCase();
              const violentScore = violentLevel === 'LOW' ? 35 : violentLevel === 'MOD' || violentLevel === 'MODERATE' ? 100 : 165;
              const propertyScore = propertyLevel === 'LOW' ? 40 : propertyLevel === 'MOD' || propertyLevel === 'MODERATE' ? 100 : 160;
              const avgScore = Math.round((violentScore + propertyScore) / 2);
              const shortAddr = prop.address.split(',')[0] || prop.address;

              return (
                <div key={prop.id} className="p-3 rounded-lg bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-medium truncate flex-1" title={prop.address}>{shortAddr}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      avgScore < 60 ? 'bg-green-500/20 text-green-400' :
                      avgScore < 120 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      Index: {avgScore}
                    </span>
                  </div>

                  {/* Crime index bar */}
                  <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
                    {/* Scale markers */}
                    <div className="absolute inset-0 flex">
                      <div className="w-1/4 border-r border-gray-600" title="Safe Zone" />
                      <div className="w-1/4 border-r border-gray-600" title="Below Average" />
                      <div className="w-1/4 border-r border-gray-600" title="Average" />
                      <div className="w-1/4" title="High Crime" />
                    </div>
                    {/* Violent crime marker */}
                    <div
                      className="absolute h-full bg-red-500/80 transition-all duration-500"
                      style={{ width: `${Math.min(violentScore / 2, 100)}%` }}
                      title={`Violent Crime: ${violentScore}`}
                    />
                    {/* Property crime overlay */}
                    <div
                      className="absolute h-full bg-amber-500/50 transition-all duration-500"
                      style={{ width: `${Math.min(propertyScore / 2, 100)}%` }}
                      title={`Property Crime: ${propertyScore}`}
                    />
                  </div>

                  {/* Scale labels */}
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                    <span>150</span>
                    <span>200</span>
                  </div>

                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-gray-500">
                      Violent: <span className={violentLevel === 'LOW' ? 'text-green-400' : violentLevel === 'HIGH' ? 'text-red-400' : 'text-yellow-400'}>{violentLevel || 'N/A'}</span>
                    </span>
                    <span className="text-gray-500">
                      Property: <span className={propertyLevel === 'LOW' ? 'text-green-400' : propertyLevel === 'HIGH' ? 'text-red-400' : 'text-yellow-400'}>{propertyLevel || 'N/A'}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500/80" />
              <span className="text-gray-400 text-xs">Violent Crime</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-500/50" />
              <span className="text-gray-400 text-xs">Property Crime</span>
            </div>
          </div>

          {/* Data source footer */}
          <div className="mt-3 pt-2 border-t border-white/10">
            <p className="text-gray-600 text-xs text-center">
              <strong className="text-gray-500">Data Sources:</strong> FBI Uniform Crime Reporting (UCR), Local Police Dept Statistics, NeighborhoodScout Crime Data
            </p>
          </div>
        </motion.div>
      </div>

      {/* Individual Property Risk Cards */}
      <div>
        <p className="text-gray-400 text-sm mb-3">Property Risk Breakdown</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property, index) => (
            <PropertyRiskCard key={property.id} property={property} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
