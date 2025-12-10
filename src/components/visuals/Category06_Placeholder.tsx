/**
 * Category 06: Interior Features
 * Fields: Kitchen, Bathrooms, Flooring, Interior Condition
 */

import type { ChartProperty } from '@/lib/visualsDataMapper';
import InteriorConditionChart from './recharts/Section6InteriorChart';

interface CategoryProps {
  properties: ChartProperty[];
}

// Map ChartProperty to Section6 Home interface
function mapToSection6Homes(properties: ChartProperty[]) {
  return properties.map((p, idx) => ({
    id: p.id,
    name: p.address || 'Unknown Address',
    color: ['#22c55e', '#8b5cf6', '#ec4899'][idx] || '#22c55e',  // Green, Lavender, Pink
    // Interior fields
    interiorCondition: p.interiorCondition || '',
    kitchenFeatures: p.kitchenFeatures,
    flooringType: p.flooringType,
    fullBathrooms: p.fullBathrooms,
    yearBuilt: p.yearBuilt,
  }));
}

export default function Category06({ properties }: CategoryProps) {
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

  return (
    <div className="space-y-12">
      {/* Section Title Banner */}
      <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/10 rounded-xl">
        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
        <span className="text-base font-bold text-white">
          Section 6: Interior Features
        </span>
        <div className="ml-auto text-xs text-gray-300">
          {mappedHomes.length} {mappedHomes.length === 1 ? 'Property' : 'Properties'} Selected
        </div>
      </div>

      {/* Interior Condition Chart */}
      <InteriorConditionChart homes={mappedHomes} />

      {/* Footer Note */}
      <div className="mt-6 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
        <p className="text-xs text-gray-400">
          <strong className="text-white">Interior Condition Scoring:</strong> Each component (Kitchen, Baths, Living, Flooring)
          is scored 0-100 based on condition ratings. Higher scores indicate better condition and more recent updates.
          The Overall score reflects the general interior condition rating from the property listing.
        </p>
      </div>
    </div>
  );
}
