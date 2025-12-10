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

import type { ChartProperty } from '@/lib/visualsDataMapper';
import PropertyBasicsCharts from './recharts/PropertyBasicsCharts';
import PropertyBasicsAdvancedCharts from './recharts/PropertyBasicsAdvancedCharts';

interface CategoryProps {
  properties: ChartProperty[];
}

// Map ChartProperty to PropertyBasicsCharts Home interface
// VERIFIED AGAINST SCHEMA: Fields 17-29
function mapToPropertyBasicsHomes(properties: ChartProperty[]) {
  const currentYear = new Date().getFullYear();

  return properties.map((p, idx) => ({
    id: p.id,
    name: p.address || 'Unknown Address',
    listingPrice: p.listingPrice || 0,
    pricePerSqFt: p.pricePerSqft || 0,
    marketValue: p.marketValueEstimate || 0,
    lastSaleDate: p.lastSaleDate || 'N/A',
    lastSalePrice: p.lastSalePrice || 0,
    assessedValue: p.assessedValue || 0,
    redfinEstimate: p.redfinEstimate || p.marketValueEstimate || 0,
    yearBuilt: p.yearBuilt || currentYear,
    bedrooms: p.bedrooms || 0,
    fullBathrooms: p.fullBathrooms || 0,  // Field 18: full_bathrooms from DB
    halfBathrooms: p.halfBaths || 0,  // Field 19: half_bathrooms from DB
    totalBathrooms: p.bathrooms || 0,  // Field 20: total_bathrooms from DB
    livingSqft: p.livingSqft || 0,
    totalSqftUnderRoof: p.totalSqft || p.livingSqft || 0,  // FIXED: totalSqft not totalSqftUnderRoof
    lotSizeSqft: p.lotSizeSqft || 0,
    lotSizeAcres: p.lotSizeAcres || (p.lotSizeSqft ? Math.round((p.lotSizeSqft / 43560) * 100) / 100 : 0),
    propertyType: p.propertyType || 'Unknown',
    stories: p.stories || 1,
    garageSpaces: p.garageSpaces || 0,
    parkingTotal: p.parkingTotal || `${p.garageSpaces || 0} Car Garage`,  // Use real parkingTotal from DB, fallback to derived
    color: ['#22c55e', '#8b5cf6', '#ec4899'][idx] || '#22c55e',
  }));
}

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

  return (
    <div className="space-y-6">
      {/* Property Basics Charts - Section 3 */}
      <PropertyBasicsCharts homes={mapToPropertyBasicsHomes(compareProps)} />

      {/* Advanced Property Basics Visualizations */}
      <PropertyBasicsAdvancedCharts homes={mapToPropertyBasicsHomes(compareProps)} />
    </div>
  );
}
