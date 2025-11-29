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
import { getIndexColor, PROPERTY_COLORS, getPropertyColor } from '../chartColors';

interface CategoryDProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

function getVal<T>(field: { value: T | null } | undefined): T | null {
  return field?.value ?? null;
}

// D-1: Cost Donut - Show total annual costs per property with P1/P2/P3 colors
function CostDonut({ properties }: CategoryDProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const propertyData = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const tax = getVal(p.details?.annualTaxes) || getVal(p.financial?.annualPropertyTax) || 0;
    const hoa = getVal(p.details?.hoaFeeAnnual) || 0;
    const insurance = getVal(p.financial?.insuranceEstAnnual) || 0;
    const total = tax + hoa + insurance;
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;

    return {
      id: p.id,
      label: `P${idx + 1}: ${address.slice(0, 12)}`,
      total,
      tax,
      hoa,
      insurance,
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  const grandTotal = propertyData.reduce((sum, p) => sum + p.total, 0) || 1;

  const data = {
    labels: propertyData.map(p => p.label),
    datasets: [{
      data: propertyData.map(p => p.total),
      backgroundColor: propertyData.map(p => p.color.rgba(0.8)),
      borderColor: propertyData.map(p => p.color.hex),
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
        labels: {
          color: '#E5E7EB',
          boxWidth: 12,
          padding: 8,
          font: { size: 10, weight: 'bold' as const },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.9)',
        titleFont: { weight: 'bold' as const },
        bodyFont: { weight: 'bold' as const },
        callbacks: {
          label: (ctx: any) => {
            const prop = propertyData[ctx.dataIndex];
            return [
              `Total: $${prop.total.toLocaleString()}/yr`,
              `Tax: $${prop.tax.toLocaleString()}`,
              `HOA: $${prop.hoa.toLocaleString()}`,
              `Insurance: $${prop.insurance.toLocaleString()}`,
            ];
          },
        },
      },
    },
  };

  return (
    <GlassChart
      title="Annual Cost Comparison"
      description={`Tax/HOA/Insurance for ${propertyData.length} properties`}
      chartId="D-cost-donut"
      color={PROPERTY_COLORS.P1.hex}
      webAugmented
      webSource="County tax assessor"
    >
      <div className="relative h-full">
        {propertyData.length > 0 ? (
          <>
            <Doughnut data={data} options={options} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]">${(grandTotal/1000).toFixed(0)}K</div>
                <div className="text-xs text-gray-300 font-medium drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">Combined/yr</div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-300 font-medium text-sm drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
            No cost data available
          </div>
        )}
      </div>
    </GlassChart>
  );
}

// D-2: HOA Heatmap - Show first 3 properties with P1/P2/P3 colors
function HOAHeatmap({ properties }: CategoryDProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const hoaData = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;
    return {
      id: p.id,
      address: address.slice(0, 15),
      hoa: getVal(p.details?.hoaFeeAnnual) || 0,
      hasHOA: getVal(p.details?.hoaYn) || (getVal(p.details?.hoaFeeAnnual) || 0) > 0,
      color: propColor,
      propertyNum: idx + 1,
    };
  });

  const maxHOA = Math.max(...hoaData.map(d => d.hoa), 1);

  return (
    <GlassChart
      title="HOA Fee Comparison"
      description={`Annual fees for ${hoaData.length} properties`}
      chartId="D-hoa-heatmap"
      color={PROPERTY_COLORS.P2.hex}
    >
      <div className="h-full flex flex-col justify-center space-y-3 px-2">
        {hoaData.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex justify-between text-xs mb-1">
              <span
                className="font-bold truncate max-w-[140px] drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                style={{ color: d.color.hex }}
              >
                P{d.propertyNum}: {d.address}
              </span>
              <span
                className="font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                style={{ color: d.color.hex }}
              >
                {d.hoa > 0 ? `$${d.hoa.toLocaleString()}/yr` : 'No HOA'}
              </span>
            </div>
            <div className="h-4 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: d.hasHOA ? `${(d.hoa / maxHOA) * 100}%` : '0%' }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${d.color.rgba(0.4)}, ${d.color.hex})`,
                  boxShadow: `0 0 8px ${d.color.rgba(0.5)}`,
                }}
              />
            </div>
          </motion.div>
        ))}

        {hoaData.length === 0 && (
          <div className="text-gray-300 font-medium text-sm text-center drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
            No HOA data available
          </div>
        )}

        {/* Legend */}
        <div className="flex justify-center gap-4 pt-2 border-t border-white/10">
          {hoaData.map((d) => (
            <div key={d.id} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: d.color.hex, boxShadow: `0 0 6px ${d.color.hex}` }}
              />
              <span className="text-xs text-gray-300 font-medium">P{d.propertyNum}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassChart>
  );
}

// D-3: Tax Scatter - Show first 3 properties with P1/P2/P3 colors
function TaxScatter({ properties }: CategoryDProps) {
  // Take first 3 properties for comparison
  const comparisonProperties = properties.slice(0, 3);

  const points = comparisonProperties.map((p, idx) => {
    const propColor = getPropertyColor(idx);
    const taxRate = getVal(p.financial?.propertyTaxRate) || 0;
    const assessed = getVal(p.details?.assessedValue) || 0;
    const address = getVal(p.address?.streetAddress) || `Property ${idx + 1}`;
    return {
      id: p.id,
      x: assessed / 1000000,
      y: taxRate,
      color: propColor,
      propertyNum: idx + 1,
      address: address.slice(0, 15),
    };
  }).filter(p => p.x > 0);

  // Create separate dataset for each property for distinct colors
  const data = {
    datasets: points.map((point) => ({
      label: `P${point.propertyNum}: ${point.address}`,
      data: [{ x: point.x, y: point.y }],
      backgroundColor: point.color.rgba(0.7),
      borderColor: point.color.hex,
      borderWidth: 2,
      pointRadius: 12,
      pointHoverRadius: 16,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: 'Assessed Value ($M)', color: '#E5E7EB', font: { weight: 'bold' as const } },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#E5E7EB', font: { weight: 'bold' as const } },
      },
      y: {
        title: { display: true, text: 'Tax Rate %', color: '#E5E7EB', font: { weight: 'bold' as const } },
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#E5E7EB', font: { weight: 'bold' as const }, callback: (v: number | string) => `${v}%` },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: '#E5E7EB',
          boxWidth: 12,
          padding: 10,
          font: { size: 10, weight: 'bold' as const },
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.9)',
        titleFont: { weight: 'bold' as const },
        bodyFont: { weight: 'bold' as const },
        callbacks: {
          label: (ctx: any) => `Assessed: $${(ctx.raw.x * 1000000).toLocaleString()}, Rate: ${ctx.raw.y}%`,
        },
      },
    },
  };

  return (
    <GlassChart
      title="Tax Rate vs Value"
      description={`Comparing ${points.length} properties`}
      chartId="D-tax-scatter"
      color={PROPERTY_COLORS.P3.hex}
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
