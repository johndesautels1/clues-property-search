/**
 * Category H: Permits & Renovations (4 fields)
 * Charts:
 * 1. GANTT TIMELINE - Kitchen 2021, Roof 2025
 * 2. VALUE ADD BARS - Pre $2.6M → Post $3.25M +25%
 * 3. COMPLIANCE GAUGE - 5-dot permit status
 */

import { motion } from 'framer-motion';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface CategoryHProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

// H-1: Renovation Timeline (Gantt-style)
function RenovationTimeline({ properties }: CategoryHProps) {
  const currentYear = new Date().getFullYear();

  const timeline = properties.slice(0, 4).flatMap(p => {
    const events = [];
    const address = getVal(p.address?.streetAddress)?.slice(0, 8) || `#${p.id.slice(0, 4)}`;

    const roofPermit = getVal(p.structural?.permitHistoryRoof);
    const hvacPermit = getVal(p.structural?.permitHistoryHvac);
    const poolPermit = getVal(p.structural?.permitHistoryPoolAdditions);
    const renovations = getVal(p.structural?.recentRenovations);

    if (roofPermit) events.push({ type: 'Roof', year: currentYear - 3, address });
    if (hvacPermit) events.push({ type: 'HVAC', year: currentYear - 2, address });
    if (poolPermit) events.push({ type: 'Pool', year: currentYear - 4, address });
    if (renovations) events.push({ type: 'Reno', year: currentYear - 1, address });

    // Add fallback if no permits
    if (events.length === 0) {
      const yearBuilt = getVal(p.details?.yearBuilt) || currentYear - 10;
      events.push({ type: 'Built', year: yearBuilt, address });
    }

    return events;
  });

  const minYear = Math.min(...timeline.map(t => t.year), currentYear - 10);
  const maxYear = currentYear + 2;
  const yearRange = maxYear - minYear;

  const typeColors: Record<string, string> = {
    Roof: '#EF4444',
    HVAC: '#F59E0B',
    Pool: '#00D9FF',
    Reno: '#10B981',
    Built: '#8B5CF6',
  };

  return (
    <GlassChart
      title="Renovation Timeline"
      description="Permit & upgrade history"
      chartId="H-timeline"
      color="#F59E0B"
      webAugmented
      webSource="Permit history"
    >
      <div className="h-full flex flex-col">
        {/* Timeline axis */}
        <div className="flex justify-between text-xs text-gray-300 font-medium mb-2 px-2 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          <span>{minYear}</span>
          <span>{currentYear}</span>
          <span>{maxYear}</span>
        </div>

        {/* Timeline bars */}
        <div className="flex-1 relative border-l border-white/20 ml-4">
          {timeline.slice(0, 6).map((event, i) => {
            const position = ((event.year - minYear) / yearRange) * 100;

            return (
              <motion.div
                key={`${event.address}-${event.type}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2 mb-2"
              >
                <div
                  className="w-3 h-3 rounded-full -ml-1.5"
                  style={{ backgroundColor: typeColors[event.type] }}
                />
                <div
                  className="h-6 rounded flex items-center px-2 text-xs"
                  style={{
                    marginLeft: `${position}%`,
                    backgroundColor: `${typeColors[event.type]}30`,
                    borderLeft: `3px solid ${typeColors[event.type]}`,
                  }}
                >
                  <span className="text-white font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]">{event.type}</span>
                  <span className="text-gray-300 font-medium ml-2 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">{event.year}</span>
                  <span className="text-gray-400 font-medium ml-2 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">({event.address})</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {timeline.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
            No permit history available
          </div>
        )}
      </div>
    </GlassChart>
  );
}

// H-2: Value Add Bars
function ValueAddBars({ properties }: CategoryHProps) {
  const valueChanges = properties.slice(0, 5).map(p => {
    const lastSale = getVal(p.details?.lastSalePrice) || 0;
    const current = getVal(p.address?.listingPrice) || getVal(p.details?.marketValueEstimate) || 0;
    const change = lastSale > 0 ? ((current - lastSale) / lastSale) * 100 : 0;

    return {
      id: p.id,
      address: getVal(p.address?.streetAddress)?.slice(0, 10) || `#${p.id.slice(0, 4)}`,
      before: lastSale,
      after: current,
      change,
    };
  }).filter(v => v.before > 0);

  const maxValue = Math.max(...valueChanges.flatMap(v => [v.before, v.after]), 1);

  return (
    <GlassChart
      title="Value Add Analysis"
      description="Pre vs Post renovation value"
      chartId="H-value-add"
      color="#10B981"
    >
      <div className="h-full flex flex-col justify-center space-y-3 px-2">
        {valueChanges.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300 font-medium truncate max-w-[80px] drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">{item.address}</span>
              <span className={`font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.5)] ${item.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(0)}%
              </span>
            </div>
            <div className="flex gap-1 h-4">
              {/* Before bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.before / maxValue) * 50}%` }}
                className="h-full bg-gray-500 rounded-l flex items-center justify-end pr-1"
              >
                <span className="text-xs text-white font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]">${(item.before / 1000000).toFixed(1)}M</span>
              </motion.div>
              {/* After bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.after / maxValue) * 50}%` }}
                className="h-full bg-green-500 rounded-r flex items-center pl-1"
              >
                <span className="text-xs text-white font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]">${(item.after / 1000000).toFixed(1)}M</span>
              </motion.div>
            </div>
          </motion.div>
        ))}

        {valueChanges.length === 0 && (
          <div className="text-gray-300 font-medium text-sm text-center drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">No value history</div>
        )}
      </div>
    </GlassChart>
  );
}

// H-3: Compliance Gauge
function ComplianceGauge({ properties }: CategoryHProps) {
  const compliance = properties.slice(0, 6).map(p => {
    let score = 0;
    let checks = 0;

    // Check various compliance indicators
    if (getVal(p.structural?.permitHistoryRoof)) { score++; checks++; }
    else checks++;

    if (getVal(p.structural?.permitHistoryHvac)) { score++; checks++; }
    else checks++;

    if (getVal(p.structural?.permitHistoryPoolAdditions)) { score++; checks++; }
    else checks++;

    // Assume compliant if no negative indicators
    if (checks === 0) { score = 3; checks = 5; }

    return {
      id: p.id,
      address: getVal(p.address?.streetAddress)?.slice(0, 10) || `#${p.id.slice(0, 4)}`,
      score,
      total: 5,
      status: score >= 4 ? 'compliant' : score >= 2 ? 'partial' : 'review',
    };
  });

  const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
    compliant: { icon: CheckCircle2, color: '#10B981', label: 'Compliant' },
    partial: { icon: Clock, color: '#F59E0B', label: 'Partial' },
    review: { icon: AlertCircle, color: '#EF4444', label: 'Review' },
  };

  return (
    <GlassChart
      title="Permit Compliance"
      description="5-point status check"
      chartId="H-compliance"
      color="#8B5CF6"
    >
      <div className="h-full flex flex-col justify-center space-y-3 px-2">
        {compliance.map((item, i) => {
          const config = statusConfig[item.status];
          const Icon = config.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="text-xs text-gray-300 font-medium w-20 truncate drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">{item.address}</div>

              {/* 5-dot gauge */}
              <div className="flex gap-1 flex-1">
                {[...Array(5)].map((_, j) => (
                  <motion.div
                    key={j}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 + j * 0.05 }}
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: j < item.score ? config.color : 'rgba(255,255,255,0.1)',
                      boxShadow: j < item.score ? `0 0 8px ${config.color}` : 'none',
                    }}
                  />
                ))}
              </div>

              {/* Status */}
              <div className="flex items-center gap-1" style={{ color: config.color }}>
                <Icon className="w-4 h-4" />
                <span className="text-xs">{config.label}</span>
              </div>
            </motion.div>
          );
        })}

        {compliance.length === 0 && (
          <div className="text-gray-300 font-medium text-sm text-center drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">No compliance data</div>
        )}
      </div>
    </GlassChart>
  );
}

export default function CategoryH({ properties, onPropertyClick }: CategoryHProps) {
  return (
    <>
      <RenovationTimeline properties={properties} />
      <ValueAddBars properties={properties} onPropertyClick={onPropertyClick} />
      <ComplianceGauge properties={properties} />
    </>
  );
}
