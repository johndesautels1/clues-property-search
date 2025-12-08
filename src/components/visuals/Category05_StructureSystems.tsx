/**
 * Category 05: Structure & Systems
 * Fields 39-48: Roof, Exterior, Foundation, HVAC, Water Heater, Garage, Laundry, Interior Condition
 *
 * ✅ ChartsReadme.md Requirements:
 * - Uses only 3 selected properties from dropdown
 * - Property-specific colors (Cyan, Purple, Pink)
 * - Dual legend system
 * - Enhanced tooltips with addresses
 * - Field numbers in titles
 * - Proper units and labels
 */

import { motion } from 'framer-motion';
import type { ChartProperty } from '@/lib/visualsDataMapper';
import {
  BarChart, Bar, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DualLegend } from './ChartLegends';
import { PROPERTY_COLORS_ARRAY, truncateAddress } from './visualConstants';

interface CategoryProps {
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

export default function Category05_StructureSystems({ properties }: CategoryProps) {
  // Limit to 3 selected properties
  const compareProps = properties.slice(0, 3);

  if (compareProps.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Please select at least one property to compare
      </div>
    );
  }

  const currentYear = new Date().getFullYear();

  // 5.1 - Property Age Comparison
  const propertyAge = compareProps.map((p, idx) => {
    const age = p.yearBuilt > 0 ? currentYear - p.yearBuilt : 0;
    return {
      name: truncateAddress(p.address, 20),
      fullAddress: p.address,
      age: age,
      yearBuilt: p.yearBuilt || 0,
      color: PROPERTY_COLORS_ARRAY[idx],
    };
  });

  // 5.2 - Roof Age vs Property Age
  const roofComparison = compareProps.map((p, idx) => {
    const propertyAge = p.yearBuilt > 0 ? currentYear - p.yearBuilt : 0;
    const roofAge = parseInt(p.roofAge) || 0;
    return {
      name: truncateAddress(p.address, 15),
      fullAddress: p.address,
      propertyAge: propertyAge,
      roofAge: roofAge,
      roofType: p.roofType || 'Unknown',
      color: PROPERTY_COLORS_ARRAY[idx],
    };
  });

  // 5.3 - HVAC System Age Analysis
  const hvacComparison = compareProps.map((p, idx) => {
    const hvacAge = parseInt(p.hvacAge) || 0;
    return {
      name: truncateAddress(p.address, 15),
      fullAddress: p.address,
      hvacAge: hvacAge,
      hvacType: p.hvacType || 'Unknown',
      color: PROPERTY_COLORS_ARRAY[idx],
    };
  });

  // 5.4 - System Ages Overview
  const systemAges = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 15),
    fullAddress: p.address,
    'Roof': parseInt(p.roofAge) || 0,
    'HVAC': parseInt(p.hvacAge) || 0,
    roofType: p.roofType || 'Unknown',
    hvacType: p.hvacType || 'Unknown',
    color: PROPERTY_COLORS_ARRAY[idx],
  }));

  // 5.5 - Structural Features Comparison
  const structuralFeatures = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 20),
    fullAddress: p.address,
    foundation: p.foundation || 'Unknown',
    exteriorMaterial: p.exteriorMaterial || 'Unknown',
    garageSpaces: p.garageSpaces || 0,
    laundryType: p.laundryType || 'Unknown',
    interiorCondition: p.interiorCondition || 'Unknown',
    waterHeaterType: p.waterHeaterType || 'Unknown',
    color: PROPERTY_COLORS_ARRAY[idx],
  }));

  return (
    <div className="space-y-6">
      {/* Chart 5.1 - Property Age Comparison */}
      <ChartCard title="Field 24 - Property Age Comparison">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={propertyAge}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              label={{ value: 'Age (years)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                      <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                      <p className="text-white text-xs">Year Built: <span className="font-bold">{data.yearBuilt}</span></p>
                      <p className="text-white text-xs">Age: <span className="font-bold">{data.age} years</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="age" radius={[8, 8, 0, 0]}>
              {propertyAge.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <DualLegend properties={compareProps} />
      </ChartCard>

      {/* Chart 5.2 - Roof Age vs Property Age */}
      <ChartCard title="Fields 39-40 - Roof Age vs Property Age">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="propertyAge"
              name="Property Age"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              label={{ value: 'Property Age (years)', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
            />
            <YAxis
              dataKey="roofAge"
              name="Roof Age"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              label={{ value: 'Roof Age (years)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                      <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                      <p className="text-white text-xs">Property Age: <span className="font-bold">{data.propertyAge} years</span></p>
                      <p className="text-white text-xs">Roof Age: <span className="font-bold">{data.roofAge} years</span></p>
                      <p className="text-white text-xs">Roof Type: <span className="font-bold">{data.roofType}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {roofComparison.map((entry, index) => (
              <Scatter
                key={index}
                data={[entry]}
                fill={entry.color}
                name={entry.name}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
        <DualLegend properties={compareProps} />
      </ChartCard>

      {/* Chart 5.3 - HVAC System Age Analysis */}
      <ChartCard title="Fields 43-44 - HVAC System Age Analysis">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hvacComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              label={{ value: 'Age (years)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                      <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                      <p className="text-white text-xs">HVAC Age: <span className="font-bold">{data.hvacAge} years</span></p>
                      <p className="text-white text-xs">HVAC Type: <span className="font-bold">{data.hvacType}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="hvacAge" radius={[8, 8, 0, 0]}>
              {hvacComparison.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <DualLegend properties={compareProps} />
      </ChartCard>

      {/* Chart 5.4 - System Ages Overview */}
      <ChartCard title="Fields 39-45 - System Ages Overview">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={systemAges}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              label={{ value: 'Age (years)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                      <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                      <p className="text-white text-xs">Roof Age: <span className="font-bold">{data['Roof']} years ({data.roofType})</span></p>
                      <p className="text-white text-xs">HVAC Age: <span className="font-bold">{data['HVAC']} years ({data.hvacType})</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ color: '#fff', paddingTop: '10px' }} />
            <Bar dataKey="Roof" fill="#F59E0B" />
            <Bar dataKey="HVAC" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
        <DualLegend properties={compareProps} />
      </ChartCard>

      {/* Chart 5.5 - Structural Features Comparison */}
      <ChartCard title="Fields 41-48 - Structural Features Comparison">
        <div className="h-full flex items-center">
          <div className="w-full space-y-4">
            {structuralFeatures.map((prop, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border"
                style={{
                  borderColor: `${prop.color}40`,
                  backgroundColor: `${prop.color}10`
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: prop.color }}
                  />
                  <span className="text-white font-semibold text-sm">{prop.fullAddress}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400">Foundation:</span>
                    <span className="text-white font-bold ml-2">{prop.foundation}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Exterior:</span>
                    <span className="text-white font-bold ml-2">{prop.exteriorMaterial}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Garage:</span>
                    <span className="text-white font-bold ml-2">{prop.garageSpaces} spaces</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Laundry:</span>
                    <span className="text-white font-bold ml-2">{prop.laundryType}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Water Heater:</span>
                    <span className="text-white font-bold ml-2">{prop.waterHeaterType}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Interior Condition:</span>
                    <span className="text-white font-bold ml-2">{prop.interiorCondition}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DualLegend properties={compareProps} />
      </ChartCard>
    </div>
  );
}
