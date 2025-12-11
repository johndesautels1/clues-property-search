/**
 * Category 06: Interior Features
 * Fields 49-53: Flooring, Kitchen, Appliances, Fireplace
 */

import type { ChartProperty } from '@/lib/visualsDataMapper';
import Section6InteriorFeaturesCharts from './recharts/Section6InteriorFeaturesCharts';
import InteriorConditionChart from './recharts/Section6InteriorChart';

interface CategoryProps {
  properties: ChartProperty[];
}

// Map ChartProperty to Section6 Home interface (for new charts)
// VERIFIED AGAINST SCHEMA: Fields 49-53, 167 (Interior Features)
function mapToSection6Homes(properties: ChartProperty[]) {
  return properties.map((p, idx) => ({
    id: p.id,
    name: p.address || 'Unknown Address',
    color: ['#22c55e', '#8b5cf6', '#ec4899'][idx] || '#22c55e',  // Green, Lavender, Pink
    // Fields 49-53: Interior Features (using camelCase)
    flooringType: p.flooringType || '',              // Field 49
    kitchenFeatures: p.kitchenFeatures || '',        // Field 50
    appliancesIncluded: p.appliancesIncluded || [],  // Field 51
    fireplaceYn: p.fireplaceYn || false,             // Field 52
    fireplaceCount: p.fireplaceCount || 0,           // Field 53
    // Field 167: Architectural Features
    interiorFeatures: p.interiorFeatures || [],      // Field 167
  }));
}

// Map ChartProperty to old Interior Condition chart interface
function mapToOldChartHomes(properties: ChartProperty[]) {
  return properties.map((p, idx) => ({
    id: p.id,
    name: p.address || 'Unknown Address',
    color: ['#22c55e', '#8b5cf6', '#ec4899'][idx] || '#22c55e',
    interiorCondition: p.interiorCondition || '',
    kitchenFeatures: p.kitchenFeatures,
    flooringType: p.flooringType,
    fullBathrooms: p.fullBathrooms,
    yearBuilt: p.yearBuilt,
  }));
}

export default function Category06_InteriorFeatures({ properties }: CategoryProps) {
  // Limit to 3 selected properties
  const compareProps = properties.slice(0, 3);

  if (compareProps.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Please select at least one property to compare
      </div>
    );
  }

  const mappedHomes = mapToSection6Homes(compareProps);
  const oldChartHomes = mapToOldChartHomes(compareProps);

  return (
    <div className="space-y-12">
      {/* Section Title Banner */}
      <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-xl border border-white/10 rounded-xl">
        <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse" />
        <span className="text-base font-bold text-white">
          Section 6: Interior Features - 5 Charts
        </span>
        <div className="ml-auto text-xs text-gray-300">
          {mappedHomes.length} {mappedHomes.length === 1 ? 'Property' : 'Properties'} Selected
        </div>
      </div>

      {/* OLD Interior Condition Chart (FIRST) */}
      <InteriorConditionChart homes={oldChartHomes} />

      {/* NEW Section 6 Interior Features Charts (10 charts) */}
      <Section6InteriorFeaturesCharts homes={mappedHomes} />
    </div>
  );
}
