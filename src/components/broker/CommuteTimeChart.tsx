/**
 * Commute Time Visualization
 *
 * Bar chart showing commute times to key destinations:
 * City Center, Elementary School, Transit Hub, Emergency Services
 */

import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Clock, Building2, GraduationCap, Train, Siren } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Commute {
  cityCenter: number;
  elementary: number;
  transitHub: number;
  emergency: number;
}

interface Property {
  id: string | number;
  address: string;
  commute?: Commute;
  [key: string]: any;
}

interface CommuteTimeChartProps {
  properties: Property[];
  selectedId?: string | number | 'all';
}

function shortAddress(address: string): string {
  return address.split(',')[0] || address;
}

function getCommuteData(p: Property): Commute {
  if (p.commute) return p.commute;
  // Generate reasonable defaults
  return {
    cityCenter: 20,
    elementary: 5,
    transitHub: 15,
    emergency: 10,
  };
}

function getTimeColor(minutes: number): string {
  if (minutes <= 5) return '#10B981';
  if (minutes <= 15) return '#00D9FF';
  if (minutes <= 30) return '#F59E0B';
  return '#EF4444';
}

const COLORS = ['#00D9FF', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function CommuteTimeChart({ properties, selectedId = 'all' }: CommuteTimeChartProps) {
  const displayProperties = selectedId === 'all'
    ? properties
    : properties.filter(p => p.id === selectedId);

  if (displayProperties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No commute data available</p>
      </div>
    );
  }

  const destinations = ['City Center', 'Elementary', 'Transit Hub', 'Emergency'];

  const data = {
    labels: destinations,
    datasets: displayProperties.map((p, i) => {
      const commute = getCommuteData(p);
      return {
        label: shortAddress(p.address),
        data: [commute.cityCenter, commute.elementary, commute.transitHub, commute.emergency],
        backgroundColor: COLORS[i % COLORS.length],
        borderRadius: 4,
      };
    }),
  };

  const options = {
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
          callback: (value: number | string) => `${value} min`,
        },
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: displayProperties.length > 1,
        labels: { color: '#9CA3AF', usePointStyle: true },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.raw} minutes`,
        },
      },
    },
  };

  // Calculate averages for summary
  const avgCommutes = displayProperties.map(p => {
    const c = getCommuteData(p);
    return {
      address: shortAddress(p.address),
      avg: Math.round((c.cityCenter + c.elementary + c.transitHub + c.emergency) / 4),
      cityCenter: c.cityCenter,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <Clock className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-semibold">Commute Times</h3>
      </div>

      <div className="h-64">
        <Bar data={data} options={options} />
      </div>

      {/* Destination icons legend */}
      <div className="mt-4 flex justify-around border-t border-white/10 pt-4">
        <div className="flex flex-col items-center gap-1">
          <Building2 className="w-5 h-5 text-gray-400" />
          <span className="text-gray-500 text-xs">City Center</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <GraduationCap className="w-5 h-5 text-gray-400" />
          <span className="text-gray-500 text-xs">School</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Train className="w-5 h-5 text-gray-400" />
          <span className="text-gray-500 text-xs">Transit</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Siren className="w-5 h-5 text-gray-400" />
          <span className="text-gray-500 text-xs">Emergency</span>
        </div>
      </div>

      {/* Property commute summary */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {avgCommutes.map((item, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-white/5 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-gray-400 text-sm truncate">{item.address}</span>
            </div>
            <div className="text-right">
              <span className="text-white font-bold">{item.avg}</span>
              <span className="text-gray-500 text-xs ml-1">min avg</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
