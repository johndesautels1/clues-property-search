/**
 * Category 03: Property Basics
 * Fields 17-29: Beds, Baths, Sqft, Lot Size, Year Built, Type, Stories, Garage
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
  BarChart, Bar, ScatterChart, Scatter, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DualLegend } from './ChartLegends';
import { PROPERTY_COLORS_ARRAY, formatCurrency, truncateAddress } from './visualConstants';

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

export default function Category03_PropertyBasics({ properties }: CategoryProps) {
  // Limit to 3 selected properties
  const compareProps = properties.slice(0, 3);

  if (compareProps.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Please select at least one property to compare
      </div>
    );
  }

  // 3.1 - Living Space Comparison
  const spaceData = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 20),
    fullAddress: p.address,
    sqft: p.livingSqft,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    color: PROPERTY_COLORS_ARRAY[idx],
  }));

  // 3.2 - Bedroom/Bathroom Comparison
  const bedBathData = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 15),
    fullAddress: p.address,
    beds: p.bedrooms,
    baths: p.bathrooms,
    color: PROPERTY_COLORS_ARRAY[idx],
  }));

  // 3.3 - Lot Size vs Building Size
  const lotVsBuilding = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 15),
    fullAddress: p.address,
    lotSize: p.lotSizeSqft,
    buildingSize: p.livingSqft,
    color: PROPERTY_COLORS_ARRAY[idx],
  }));

  // 3.4 - Space Efficiency (Building/Lot Ratio)
  const spaceEfficiency = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 20),
    fullAddress: p.address,
    ratio: p.lotSizeSqft > 0 ? (p.livingSqft / p.lotSizeSqft * 100) : 0,
    lotSize: p.lotSizeSqft,
    buildingSize: p.livingSqft,
    color: PROPERTY_COLORS_ARRAY[idx],
  }));

  // 3.5 - Property Age & Type
  const propertyAge = compareProps.map((p, idx) => {
    const currentYear = new Date().getFullYear();
    const age = p.yearBuilt > 0 ? currentYear - p.yearBuilt : 0;
    return {
      name: truncateAddress(p.address, 20),
      fullAddress: p.address,
      yearBuilt: p.yearBuilt || 0,
      age: age,
      type: p.propertyType || 'Unknown',
      color: PROPERTY_COLORS_ARRAY[idx],
    };
  });

  return (
    <div className="space-y-6">
      {/* Chart 3.1 - Living Space Scatter */}
      <ChartCard title="Field 21 - Living Space Comparison">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="bedrooms"
              name="Bedrooms"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              label={{ value: 'Bedrooms', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
            />
            <YAxis
              dataKey="sqft"
              name="Living Sqft"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(val) => `${(val/1000).toFixed(1)}k`}
              label={{ value: 'Living Sqft', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                      <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                      <p className="text-white text-xs">Living Sqft: <span className="font-bold">{data.sqft.toLocaleString()}</span></p>
                      <p className="text-white text-xs">Bedrooms: <span className="font-bold">{data.bedrooms}</span></p>
                      <p className="text-white text-xs">Bathrooms: <span className="font-bold">{data.bathrooms}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {spaceData.map((entry, index) => (
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

      {/* Chart 3.2 - Bedroom/Bathroom Comparison */}
      <ChartCard title="Fields 17-20 - Bedroom & Bathroom Comparison">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bedBathData}>
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
              label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                      <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                      <p className="text-white text-xs">Bedrooms: <span className="font-bold">{data.beds}</span></p>
                      <p className="text-white text-xs">Bathrooms: <span className="font-bold">{data.baths}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ color: '#fff', paddingTop: '10px' }} />
            <Bar dataKey="beds" name="Bedrooms" radius={[8, 8, 0, 0]}>
              {bedBathData.map((entry, index) => (
                <Cell key={`beds-${index}`} fill={entry.color} />
              ))}
            </Bar>
            <Bar dataKey="baths" name="Bathrooms" radius={[8, 8, 0, 0]}>
              {bedBathData.map((entry, index) => (
                <Cell key={`baths-${index}`} fill={entry.color} fillOpacity={0.6} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <DualLegend properties={compareProps} />
      </ChartCard>

      {/* Chart 3.3 - Lot Size vs Building Size */}
      <ChartCard title="Fields 21-23 - Lot Size vs Building Size">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={lotVsBuilding}>
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
              tickFormatter={(val) => `${(val/1000).toFixed(0)}k`}
              label={{ value: 'Square Feet', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                      <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                      <p className="text-white text-xs">Lot Size: <span className="font-bold">{data.lotSize.toLocaleString()} sqft</span></p>
                      <p className="text-white text-xs">Building Size: <span className="font-bold">{data.buildingSize.toLocaleString()} sqft</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ color: '#fff', paddingTop: '10px' }} />
            <Bar dataKey="lotSize" name="Lot Size (sqft)" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            <Bar dataKey="buildingSize" name="Building Size (sqft)" fill="#00D9FF" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <DualLegend properties={compareProps} />
      </ChartCard>

      {/* Chart 3.4 - Space Efficiency Ratios */}
      <ChartCard title="Fields 21-23 - Space Efficiency (Building/Lot Ratio)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={spaceEfficiency}>
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
              label={{ value: 'Efficiency (%)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                      <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                      <p className="text-white text-xs">Building: <span className="font-bold">{data.buildingSize.toLocaleString()} sqft</span></p>
                      <p className="text-white text-xs">Lot: <span className="font-bold">{data.lotSize.toLocaleString()} sqft</span></p>
                      <p className="text-white text-xs">Efficiency: <span className="font-bold">{data.ratio.toFixed(1)}%</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="ratio" radius={[8, 8, 0, 0]}>
              {spaceEfficiency.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <DualLegend properties={compareProps} />
      </ChartCard>

      {/* Chart 3.5 - Property Age & Type */}
      <ChartCard title="Fields 24-26 - Property Age & Type">
        <div className="h-full flex items-center">
          <div className="w-full space-y-4">
            {propertyAge.map((prop, idx) => (
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
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">Year Built:</span>
                    <span className="text-white font-bold ml-2">{prop.yearBuilt || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Age:</span>
                    <span className="text-white font-bold ml-2">{prop.age > 0 ? `${prop.age} years` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white font-bold ml-2">{prop.type}</span>
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
