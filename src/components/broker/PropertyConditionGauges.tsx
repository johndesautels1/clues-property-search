/**
 * Property Condition Gauges
 *
 * Circular gauges showing condition scores:
 * Roof, HVAC, Kitchen, Overall
 */

import { motion } from 'framer-motion';
import { Wrench, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Condition {
  roof: number;
  hvac: number;
  kitchen: number;
  overall: number;
}

interface Property {
  id: string | number;
  address: string;
  condition?: Condition;
  yearBuilt?: number;
  [key: string]: any;
}

interface PropertyConditionGaugesProps {
  properties: Property[];
  selectedId?: string | number | 'all';
}

function shortAddress(address: string): string {
  return address.split(',')[0] || address;
}

function getCondition(p: Property): Condition {
  if (p.condition) return p.condition;

  // Generate defaults based on year built
  const age = new Date().getFullYear() - (p.yearBuilt || 2000);
  const baseScore = Math.max(50, 100 - age * 1.5);

  return {
    roof: Math.round(baseScore + Math.random() * 10 - 5),
    hvac: Math.round(baseScore + Math.random() * 10 - 5),
    kitchen: Math.round(baseScore + Math.random() * 10 - 5),
    overall: Math.round(baseScore),
  };
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#10B981'; // Green
  if (score >= 75) return '#00D9FF'; // Cyan
  if (score >= 60) return '#F59E0B'; // Amber
  return '#EF4444'; // Red
}

function CircularGauge({ value, label, size = 80 }: { value: number; label: string; size?: number }) {
  const color = getScoreColor(value);
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold text-lg" style={{ color }}>{value}</span>
        </div>
      </div>
      <span className="text-gray-400 text-xs mt-1">{label}</span>
    </div>
  );
}

function PropertyConditionCard({ property, index }: { property: Property; index: number }) {
  const condition = getCondition(property);
  const overallColor = getScoreColor(condition.overall);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white font-semibold truncate" title={property.address}>
            {shortAddress(property.address)}
          </p>
          <p className="text-gray-500 text-xs">Built {property.yearBuilt || 'N/A'}</p>
        </div>
        <div
          className="flex items-center gap-1 px-3 py-1 rounded-full"
          style={{ backgroundColor: `${overallColor}20`, color: overallColor }}
        >
          {condition.overall >= 80 ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span className="text-sm font-semibold">{condition.overall}%</span>
        </div>
      </div>

      {/* Gauges */}
      <div className="flex justify-around">
        <CircularGauge value={condition.roof} label="Roof" />
        <CircularGauge value={condition.hvac} label="HVAC" />
        <CircularGauge value={condition.kitchen} label="Kitchen" />
      </div>

      {/* Status bar */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Overall Condition</span>
          <span style={{ color: overallColor }}>
            {condition.overall >= 90 ? 'Excellent' :
             condition.overall >= 75 ? 'Good' :
             condition.overall >= 60 ? 'Fair' : 'Needs Work'}
          </span>
        </div>
        <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: overallColor }}
            initial={{ width: 0 }}
            animate={{ width: `${condition.overall}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function PropertyConditionGauges({ properties, selectedId = 'all' }: PropertyConditionGaugesProps) {
  const displayProperties = selectedId === 'all'
    ? properties
    : properties.filter(p => p.id === selectedId);

  if (displayProperties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No condition data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Wrench className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-semibold">Property Condition</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayProperties.map((property, index) => (
          <PropertyConditionCard key={property.id} property={property} index={index} />
        ))}
      </div>
    </div>
  );
}
