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
 * NOTE: This category now includes BOTH:
 * - Original charts (5-1 to 5-8) - Standard structure & systems analysis
 * - Advanced charts (5-9 to 5-11) - Deep-dive multi-dimensional analysis
 */

import type { ChartProperty } from '@/lib/visualsDataMapper';
import Section5StructureSystemsCharts from './recharts/Section5StructureSystemsCharts';
import Section5AdvancedCharts from './recharts/Section5AdvancedCharts';

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
          {mappedHomes.length} {mappedHomes.length === 1 ? 'Property' : 'Properties'} Selected
        </div>
      </div>

      {/* ORIGINAL CHARTS (5-1 to 5-8) */}
      <div>
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-xl">
          <span className="text-sm font-semibold text-orange-300">
            📊 Original Charts (5-1 to 5-8) - Standard Structure & Systems Analysis
          </span>
        </div>
        <Section5StructureSystemsCharts homes={mappedHomes} />
      </div>

      {/* DIVIDER */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/20"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-900 px-4 py-2 text-gray-400 rounded-full border border-white/10">
            Advanced Deep-Dive Analysis
          </span>
        </div>
      </div>

      {/* ADVANCED CHARTS (5-9 to 5-11) */}
      <div>
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-purple-500/10 border-l-4 border-purple-500 rounded-r-xl">
          <span className="text-sm font-semibold text-purple-300">
            🔬 Advanced Charts (5-9 to 5-11) - Multi-Dimensional Risk Analysis
          </span>
        </div>
        <Section5AdvancedCharts homes={mappedHomes} />
      </div>

      {/* Comparison Note */}
      <div className="mt-8 p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-white/10 rounded-xl">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <span className="text-lg">💡</span>
          Chart Comparison Guide
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
          <div>
            <p className="font-semibold text-orange-300 mb-2">Original Charts (5-1 to 5-8):</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Roof Type & Quality</li>
              <li>System Age Analysis</li>
              <li>Exterior Material Quality</li>
              <li>Foundation Comparison</li>
              <li>Interior Condition</li>
              <li>Water Heater Efficiency</li>
              <li>Overall Structure Radar</li>
              <li>Composite Quality Score</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-purple-300 mb-2">Advanced Charts (5-9 to 5-11):</p>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Big Ticket Risk Timeline:</strong> Capital expense horizon</li>
              <li><strong>Shell vs Cosmetics:</strong> Structure vs interior tradeoffs</li>
              <li><strong>Daily Convenience:</strong> Garage & laundry usability</li>
            </ul>
            <p className="mt-3 text-yellow-200">
              ⚡ These provide complementary perspectives on the same data with different analytical frameworks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
