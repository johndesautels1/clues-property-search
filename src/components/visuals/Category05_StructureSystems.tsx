/**
 * Category 05: Structure & Systems
 * Fields 39-48: Roof, Exterior, Foundation, HVAC, Water Heater, Interior Condition
 *
 * ✅ ChartsReadme.md Requirements:
 * - Uses only 3 selected properties from dropdown
 * - Property-specific colors (Green, Lavender, Pink)
 * - CLUES-Smart scoring system
 * - Enhanced tooltips with addresses
 * - Field numbers in titles
 * - Proper units and labels
 *
 * UNIFIED NUMBERING: All charts numbered 5-1 through 5-6
 */

import type { ChartProperty } from '@/lib/visualsDataMapper';
import Section5PerplexityCharts from './recharts/Section5PerplexityCharts';
import Section5StructureSystemsCharts from './recharts/Section5StructureSystemsCharts';

interface CategoryProps {
  properties: ChartProperty[];
}

// Map ChartProperty to Section5 Home interface
// VERIFIED AGAINST SCHEMA: Fields 39-48 (Structure & Systems)
function mapToSection5Homes(properties: ChartProperty[]) {
  return properties.map((p, idx) => ({
    id: p.id,
    name: p.address || 'Unknown Address',
    color: ['#22c55e', '#8b5cf6', '#ec4899'][idx] || '#22c55e',  // Green, Lavender, Pink
    // Fields 39-48: Structure & Systems
    roofType: p.roofType || '',                   // Field 39: roof_type
    roofAgeEst: p.roofAge || '',                  // Field 40: roof_age_est
    exteriorMaterial: p.exteriorMaterial || '',   // Field 41: exterior_material
    foundation: p.foundation || '',               // Field 42: foundation
    waterHeaterType: p.waterHeaterType || '',     // Field 43: water_heater_type
    garageType: p.garageSpaces ? `Attached ${p.garageSpaces}-Car` : 'None', // Field 44: garage_type (approximation)
    hvacType: p.hvacType || '',                   // Field 45: hvac_type
    hvacAge: p.hvacAge || '',                     // Field 46: hvac_age
    laundryType: p.laundryType || '',             // Field 47: laundry_type
    interiorCondition: p.interiorCondition || '', // Field 48: interior_condition
    // Additional fields for calculations
    listingPrice: p.listingPrice,
    yearBuilt: p.yearBuilt,
    // Additional fields for Perplexity charts
    poolYn: p.poolYn,
    poolType: p.poolType,
    electricProvider: p.electricProvider,
    waterProvider: p.waterProvider,
    kitchenFeatures: p.kitchenFeatures,
    flooringType: p.flooringType,
    landscaping: p.landscaping,
    fullBathrooms: p.fullBathrooms,
  }));
}

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

  const mappedHomes = mapToSection5Homes(compareProps);

  return (
    <div className="space-y-12">
      {/* Section Title Banner */}
      <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-xl border border-white/10 rounded-xl">
        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
        <span className="text-base font-bold text-white">
          Section 5: Structure & Systems - Complete Analysis
        </span>
        <div className="ml-auto text-xs text-gray-300">
          6 Charts • {mappedHomes.length} {mappedHomes.length === 1 ? 'Property' : 'Properties'}
        </div>
      </div>

      {/* Charts 5-1 to 5-3: Systems Overview & Replacement */}
      <Section5PerplexityCharts homes={mappedHomes} />

      {/* Charts 5-4 to 5-6: Material Quality & Condition */}
      <Section5StructureSystemsCharts homes={mappedHomes} />

      {/* Chart Guide */}
      <div className="mt-8 p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-white/10 rounded-xl">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <span className="text-lg">📋</span>
          Chart Guide: Structure & Systems (6 Charts)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-300">
          <div>
            <p className="font-semibold text-cyan-300 mb-2">Charts 5-1 to 5-3: Systems Overview</p>
            <ul className="space-y-1 text-[11px]">
              <li><strong>5-1:</strong> Systems Health Radar (7-8 axes)</li>
              <li><strong>5-2:</strong> Replacement Horizon Timeline</li>
              <li><strong>5-3:</strong> Exterior Condition Breakdown</li>
            </ul>
            <p className="mt-2 text-cyan-200 text-[10px]">
              Focus: Overall health + replacement timing
            </p>
          </div>
          <div>
            <p className="font-semibold text-orange-300 mb-2">Charts 5-4 to 5-6: Quality Analysis</p>
            <ul className="space-y-1 text-[11px]">
              <li><strong>5-4:</strong> Roof Type & Quality</li>
              <li><strong>5-5:</strong> Exterior Material Quality</li>
              <li><strong>5-6:</strong> Foundation Comparison</li>
            </ul>
            <p className="mt-2 text-orange-200 text-[10px]">
              Focus: Material durability + structural ratings
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-yellow-200 text-xs">
            ⚡ All 6 charts analyze Fields 39-48 (Structure & Systems) with different analytical perspectives. Use them together for comprehensive property evaluation.
          </p>
        </div>
      </div>
    </div>
  );
}
