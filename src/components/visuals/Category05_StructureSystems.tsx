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
 */

import type { ChartProperty } from '@/lib/visualsDataMapper';
import Section5StructureSystemsCharts from './recharts/Section5StructureSystemsCharts';

interface CategoryProps {
  properties: ChartProperty[];
}

// Map ChartProperty to Section5StructureSystemsCharts Home interface
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
    hvacType: p.hvacType || '',                   // Field 45: hvac_type
    hvacAge: p.hvacAge || '',                     // Field 46: hvac_age
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

  return (
    <div className="space-y-6">
      <Section5StructureSystemsCharts homes={mapToSection5Homes(compareProps)} />
    </div>
  );
}
