/**
 * Category 01: Address & Identity
 * Fields 1-9: Full Address, MLS Primary/Secondary, Listing Status, Date, Neighborhood, County, ZIP, Parcel ID
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
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
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

export default function Category01_AddressIdentity({ properties }: CategoryProps) {
  // Limit to 3 selected properties
  const compareProps = properties.slice(0, 3);

  if (compareProps.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Please select at least one property to compare
      </div>
    );
  }

  // 1.1 - Property Location Comparison (City)
  const cityComparison = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 20),
    fullAddress: p.address,
    city: p.city || 'Unknown',
    state: p.state || 'N/A',
    zip: p.zip || 'N/A',
    color: PROPERTY_COLORS_ARRAY[idx],
  }));

  // 1.2 - Listing Status
  const statusComparison = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 20),
    fullAddress: p.address,
    status: p.listingStatus || 'Unknown',
    color: PROPERTY_COLORS_ARRAY[idx],
  }));

  // 1.3 - Neighborhood Comparison
  const neighborhoodComparison = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 20),
    fullAddress: p.address,
    neighborhood: p.neighborhood || 'Not Specified',
    county: p.county || 'N/A',
    color: PROPERTY_COLORS_ARRAY[idx],
  }));

  // 1.4 - MLS Data Completeness
  const mlsComparison = compareProps.map((p, idx) => ({
    name: truncateAddress(p.address, 20),
    fullAddress: p.address,
    hasMLS: p.mlsNumber ? 1 : 0,
    hasListingDate: p.listingDate ? 1 : 0,
    hasStatus: p.listingStatus ? 1 : 0,
    completeness: ((p.mlsNumber ? 1 : 0) + (p.listingDate ? 1 : 0) + (p.listingStatus ? 1 : 0)) / 3 * 100,
    color: PROPERTY_COLORS_ARRAY[idx],
  }));

  // 1.5 - Days on Market (if listing date available)
  const daysOnMarket = compareProps.map((p, idx) => {
    let days = 0;
    if (p.listingDate) {
      const listDate = new Date(p.listingDate);
      const today = new Date();
      days = Math.floor((today.getTime() - listDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    return {
      name: truncateAddress(p.address, 20),
      fullAddress: p.address,
      days: days > 0 ? days : 0,
      listingDate: p.listingDate || 'N/A',
      color: PROPERTY_COLORS_ARRAY[idx],
    };
  });

  return (
    <div className="space-y-6">
      {/* Chart 1.1 - Property Location */}
      <ChartCard title="Fields 1, 6-8 - Property Location & Jurisdiction">
        <div className="h-full flex items-center">
          <div className="w-full space-y-4">
            {cityComparison.map((prop, idx) => (
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
                    <span className="text-gray-400">City:</span>
                    <span className="text-white font-bold ml-2">{prop.city}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">State:</span>
                    <span className="text-white font-bold ml-2">{prop.state}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">ZIP:</span>
                    <span className="text-white font-bold ml-2">{prop.zip}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DualLegend properties={compareProps} />
      </ChartCard>

      {/* Chart 1.2 - Listing Status */}
      <ChartCard title="Field 4 - Listing Status Comparison">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={statusComparison} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis type="category" dataKey="status" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 12 }} domain={[0, compareProps.length]} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                      <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                      <p className="text-white text-xs">Status: <span className="font-bold">{data.status}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="status" radius={[8, 8, 0, 0]}>
              {statusComparison.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <DualLegend properties={compareProps} />
      </ChartCard>

      {/* Chart 1.3 - Neighborhood & County */}
      <ChartCard title="Fields 6-7 - Neighborhood & County">
        <div className="h-full flex items-center">
          <div className="w-full space-y-3">
            {neighborhoodComparison.map((prop, idx) => (
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
                  <span className="text-white font-semibold text-xs">{prop.fullAddress}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">Neighborhood:</span>
                    <span className="text-white font-bold ml-2">{prop.neighborhood}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">County:</span>
                    <span className="text-white font-bold ml-2">{prop.county}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DualLegend properties={compareProps} />
      </ChartCard>

      {/* Chart 1.4 - MLS Data Completeness */}
      <ChartCard title="Fields 2-5 - MLS Data Completeness">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mlsComparison}>
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
                      <p className="text-white text-xs">MLS Number: <span className="font-bold">{data.hasMLS ? 'Yes' : 'No'}</span></p>
                      <p className="text-white text-xs">Listing Date: <span className="font-bold">{data.hasListingDate ? 'Yes' : 'No'}</span></p>
                      <p className="text-white text-xs">Status: <span className="font-bold">{data.hasStatus ? 'Yes' : 'No'}</span></p>
                      <p className="text-white text-xs mt-1">Completeness: <span className="font-bold">{data.completeness.toFixed(0)}%</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="completeness" radius={[8, 8, 0, 0]}>
              {mlsComparison.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <DualLegend properties={compareProps} />
      </ChartCard>

      {/* Chart 1.5 - Days on Market */}
      <ChartCard title="Field 5 - Days on Market Comparison">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={daysOnMarket}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} label={{ value: 'Days on Market', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
                      <p className="text-cyan-400 font-semibold text-xs mb-1">{data.fullAddress}</p>
                      <p className="text-white text-xs">Listed: <span className="font-bold">{data.listingDate}</span></p>
                      <p className="text-white text-xs">Days on Market: <span className="font-bold">{data.days}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="days" radius={[8, 8, 0, 0]}>
              {daysOnMarket.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <DualLegend properties={compareProps} />
      </ChartCard>
    </div>
  );
}
