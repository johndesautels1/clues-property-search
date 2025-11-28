/**
 * ROI Timeline Charts
 *
 * Line charts showing projected appreciation over time
 * Displays individual property ROI projections and portfolio totals
 */

import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface ROIProjection {
  today: number;
  year1: number;
  year2: number;
  year3: number;
  year4: number;
  year5: number;
  year7: number;
  year10: number;
}

interface Property {
  id: string | number;
  address: string;
  listPrice: number;
  appreciation5yr: number;
  roiProjection?: ROIProjection;
  [key: string]: any;
}

interface ROITimelineProps {
  properties: Property[];
  title?: string;
}

// Generate ROI projection if not provided
function generateROI(listPrice: number, appreciationRate: number): ROIProjection {
  const rate = 1 + (appreciationRate / 100);
  return {
    today: listPrice,
    year1: listPrice * rate,
    year2: listPrice * Math.pow(rate, 2),
    year3: listPrice * Math.pow(rate, 3),
    year4: listPrice * Math.pow(rate, 4),
    year5: listPrice * Math.pow(rate, 5),
    year7: listPrice * Math.pow(rate, 7),
    year10: listPrice * Math.pow(rate, 10),
  };
}

// Format currency
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

// Chart colors
const COLORS = [
  { bg: 'rgba(0, 217, 255, 0.1)', border: '#00D9FF' },
  { bg: 'rgba(16, 185, 129, 0.1)', border: '#10B981' },
  { bg: 'rgba(139, 92, 246, 0.1)', border: '#8B5CF6' },
  { bg: 'rgba(245, 158, 11, 0.1)', border: '#F59E0B' },
  { bg: 'rgba(239, 68, 68, 0.1)', border: '#EF4444' },
];

export default function ROITimeline({ properties, title = "ROI Projections" }: ROITimelineProps) {
  if (!properties || properties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No properties to analyze</p>
      </div>
    );
  }

  // Generate ROI data for each property
  const propertyROIs = properties.map(p => ({
    ...p,
    roi: p.roiProjection || generateROI(p.listPrice, p.appreciation5yr || 5),
  }));

  // Calculate portfolio totals
  const portfolioROI: ROIProjection = {
    today: propertyROIs.reduce((sum, p) => sum + p.roi.today, 0),
    year1: propertyROIs.reduce((sum, p) => sum + p.roi.year1, 0),
    year2: propertyROIs.reduce((sum, p) => sum + p.roi.year2, 0),
    year3: propertyROIs.reduce((sum, p) => sum + p.roi.year3, 0),
    year4: propertyROIs.reduce((sum, p) => sum + p.roi.year4, 0),
    year5: propertyROIs.reduce((sum, p) => sum + p.roi.year5, 0),
    year7: propertyROIs.reduce((sum, p) => sum + p.roi.year7, 0),
    year10: propertyROIs.reduce((sum, p) => sum + p.roi.year10, 0),
  };

  const timeLabels = ['Today', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 7', 'Year 10'];

  // Individual properties line chart data
  const individualChartData = {
    labels: timeLabels,
    datasets: propertyROIs.map((p, i) => {
      const color = COLORS[i % COLORS.length];
      const shortAddr = p.address.split(',')[0] || p.address;
      return {
        label: shortAddr,
        data: [
          p.roi.today,
          p.roi.year1,
          p.roi.year2,
          p.roi.year3,
          p.roi.year4,
          p.roi.year5,
          p.roi.year7,
          p.roi.year10,
        ],
        fill: false,
        borderColor: color.border,
        backgroundColor: color.bg,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    }),
  };

  // Portfolio total line chart data
  const portfolioChartData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Portfolio Value',
        data: [
          portfolioROI.today,
          portfolioROI.year1,
          portfolioROI.year2,
          portfolioROI.year3,
          portfolioROI.year4,
          portfolioROI.year5,
          portfolioROI.year7,
          portfolioROI.year10,
        ],
        fill: true,
        borderColor: '#00D9FF',
        backgroundColor: 'rgba(0, 217, 255, 0.1)',
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: '#00D9FF',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#9CA3AF' },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#9CA3AF',
          callback: (value: number | string) => formatCurrency(Number(value)),
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: { color: '#9CA3AF', usePointStyle: true },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#9CA3AF',
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${formatCurrency(context.raw)}`,
        },
      },
    },
  };

  // Calculate growth metrics
  const totalGrowth5yr = ((portfolioROI.year5 - portfolioROI.today) / portfolioROI.today) * 100;
  const totalGrowth10yr = ((portfolioROI.year10 - portfolioROI.today) / portfolioROI.today) * 100;
  const avgAppreciation = propertyROIs.reduce((sum, p) => sum + (p.appreciation5yr || 0), 0) / propertyROIs.length;

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <span className="text-gray-500 text-sm">({properties.length} properties)</span>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            <span className="text-gray-400 text-xs">Current Value</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(portfolioROI.today)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-green-400" />
            <span className="text-gray-400 text-xs">5-Year Value</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(portfolioROI.year5)}</p>
          <p className="text-xs text-gray-500 mt-1">+{totalGrowth5yr.toFixed(1)}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-gray-400 text-xs">10-Year Value</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">{formatCurrency(portfolioROI.year10)}</p>
          <p className="text-xs text-gray-500 mt-1">+{totalGrowth10yr.toFixed(1)}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span className="text-gray-400 text-xs">Avg Annual Growth</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{avgAppreciation.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">Per year</p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Total Chart */}
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
          <p className="text-white font-semibold mb-4">Portfolio Growth Projection</p>
          <div className="h-72">
            <Line data={portfolioChartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Individual Properties Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <p className="text-white font-semibold mb-4">Individual Property Projections</p>
          <div className="h-72">
            <Line data={individualChartData} options={chartOptions} />
          </div>
        </motion.div>
      </div>

      {/* Property ROI Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="rounded-2xl p-6"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <p className="text-white font-semibold mb-4">Property Value Breakdown</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 font-medium py-3 px-2">Property</th>
                <th className="text-right text-gray-400 font-medium py-3 px-2">Today</th>
                <th className="text-right text-gray-400 font-medium py-3 px-2">Year 5</th>
                <th className="text-right text-gray-400 font-medium py-3 px-2">Year 10</th>
                <th className="text-right text-gray-400 font-medium py-3 px-2">Growth Rate</th>
              </tr>
            </thead>
            <tbody>
              {propertyROIs.map((p, i) => {
                const shortAddr = p.address.split(',')[0] || p.address;
                const growth = ((p.roi.year10 - p.roi.today) / p.roi.today) * 100;
                return (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length].border }}
                        />
                        <span className="text-white truncate" title={p.address}>{shortAddr}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-2 text-gray-300">{formatCurrency(p.roi.today)}</td>
                    <td className="text-right py-3 px-2 text-green-400">{formatCurrency(p.roi.year5)}</td>
                    <td className="text-right py-3 px-2 text-purple-400">{formatCurrency(p.roi.year10)}</td>
                    <td className="text-right py-3 px-2 text-amber-400">+{growth.toFixed(1)}%</td>
                  </tr>
                );
              })}
              <tr className="bg-white/5">
                <td className="py-3 px-2 text-white font-semibold">Portfolio Total</td>
                <td className="text-right py-3 px-2 text-white font-semibold">{formatCurrency(portfolioROI.today)}</td>
                <td className="text-right py-3 px-2 text-green-400 font-semibold">{formatCurrency(portfolioROI.year5)}</td>
                <td className="text-right py-3 px-2 text-purple-400 font-semibold">{formatCurrency(portfolioROI.year10)}</td>
                <td className="text-right py-3 px-2 text-amber-400 font-semibold">+{totalGrowth10yr.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
