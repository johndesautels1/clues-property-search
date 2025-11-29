/**
 * Category D: HOA & Taxes (9 fields)
 * Charts:
 * 1. COST DONUT - Taxes 45% / HOA 25% / Other 30%
 * 2. HOA HEATMAP - Red→Green by annual fee
 * 3. TAX SCATTER - Tax Rate vs Assessed Value
 */

import { motion } from 'framer-motion';
import { Doughnut, Scatter } from 'react-chartjs-2';
import GlassChart from '../GlassChart';
import type { Property } from '@/types/property';

interface CategoryDProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

// D-1: Cost Donut
function CostDonut({ properties }: CategoryDProps) {
  let totalTax = 0, totalHOA = 0, totalInsurance = 0;
  properties.forEach(p => {
    totalTax += getVal(p.details?.annualTaxes) || getVal(p.financial?.annualPropertyTax) || 0;
    totalHOA += getVal(p.details?.hoaFeeAnnual) || 0;
    totalInsurance += getVal(p.financial?.insuranceEstAnnual) || 0;
  });

  const total = totalTax + totalHOA + totalInsurance || 1;

  const data = {
    labels: ['Property Tax', 'HOA Fees', 'Insurance'],
    datasets: [{
      data: [totalTax, totalHOA, totalInsurance],
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(139, 92, 246, 0.8)',
      ],
      borderColor: ['#EF4444', '#F59E0B', '#8B5CF6'],
      borderWidth: 2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: { color: '#9CA3AF', boxWidth: 12, padding: 8, font: { size: 10 } },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        callbacks: {
          label: (ctx: any) => `${ctx.label}: $${ctx.raw.toLocaleString()} (${Math.round(ctx.raw/total*100)}%)`,
        },
      },
    },
  };

  return (
    <GlassChart
      title="Annual Cost Breakdown"
      description="Tax / HOA / Insurance split"
      chartId="D-cost-donut"
      color="#EF4444"
      webAugmented
      webSource="County tax assessor"
    >
      <div className="relative h-full">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]">${(total/1000).toFixed(0)}K</div>
            <div className="text-xs text-gray-300 font-medium drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">Total/yr</div>
          </div>
        </div>
      </div>
    </GlassChart>
  );
}

// D-2: HOA Heatmap
function HOAHeatmap({ properties }: CategoryDProps) {
  const hoaData = properties.map(p => ({
    id: p.id,
    address: getVal(p.address?.streetAddress)?.slice(0, 12) || `#${p.id.slice(0, 4)}`,
    hoa: getVal(p.details?.hoaFeeAnnual) || 0,
    hasHOA: getVal(p.details?.hoaYn) || false,
  })).slice(0, 8);

  const maxHOA = Math.max(...hoaData.map(d => d.hoa), 1);

  return (
    <GlassChart
      title="HOA Fee Heatmap"
      description="Annual fees by property"
      chartId="D-hoa-heatmap"
      color="#F59E0B"
    >
      <div className="h-full flex flex-col justify-center">
        <div className="grid grid-cols-4 gap-2">
          {hoaData.map((d, i) => {
            const intensity = d.hoa / maxHOA;
            const hue = 120 - intensity * 120; // Green to Red

            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="p-2 rounded-lg text-center cursor-pointer hover:scale-105 transition-transform"
                style={{
                  backgroundColor: d.hasHOA ? `hsla(${hue}, 70%, 40%, 0.6)` : 'rgba(255,255,255,0.05)',
                }}
              >
                <div className="text-xs text-gray-300 truncate">{d.address}</div>
                <div className="text-sm font-bold text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]">
                  {d.hoa > 0 ? `$${(d.hoa/1000).toFixed(1)}K` : 'No HOA'}
                </div>
              </motion.div>
            );
          })}
        </div>

        {hoaData.length === 0 && (
          <div className="text-gray-300 font-medium text-sm text-center drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">No HOA data available</div>
        )}
      </div>
    </GlassChart>
  );
}

// D-3: Tax Scatter
function TaxScatter({ properties }: CategoryDProps) {
  const points = properties.map(p => {
    const taxRate = getVal(p.financial?.propertyTaxRate) || 0;
    const assessed = getVal(p.details?.assessedValue) || 0;
    return { id: p.id, x: assessed / 1000000, y: taxRate };
  }).filter(p => p.x > 0);

  const data = {
    datasets: [{
      label: 'Properties',
      data: points.map(p => ({ x: p.x, y: p.y })),
      backgroundColor: 'rgba(139, 92, 246, 0.6)',
      borderColor: '#8B5CF6',
      borderWidth: 2,
      pointRadius: 8,
      pointHoverRadius: 12,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: 'Assessed Value ($M)', color: '#9CA3AF' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#9CA3AF' },
      },
      y: {
        title: { display: true, text: 'Tax Rate %', color: '#9CA3AF' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#9CA3AF', callback: (v: number | string) => `${v}%` },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(0,0,0,0.8)' },
    },
  };

  return (
    <GlassChart
      title="Tax Rate vs Value"
      description="Property tax analysis"
      chartId="D-tax-scatter"
      color="#8B5CF6"
    >
      {points.length > 0 ? (
        <Scatter data={data} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          No tax data available
        </div>
      )}
    </GlassChart>
  );
}

export default function CategoryD({ properties, onPropertyClick }: CategoryDProps) {
  return (
    <>
      <CostDonut properties={properties} />
      <HOAHeatmap properties={properties} onPropertyClick={onPropertyClick} />
      <TaxScatter properties={properties} />
    </>
  );
}
