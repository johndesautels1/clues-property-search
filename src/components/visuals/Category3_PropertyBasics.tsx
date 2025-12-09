/**
 * Category 3: Property Basics (Fields 17-29)
 * 7 Charts comparing bedroom, bathroom, living space, lot size, efficiency, age, parking
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChartProperty } from '@/lib/visualsDataMapper';
import { usePropertyStore } from '@/store/propertyStore';
import { mapPropertiesToChart } from '@/lib/visualsDataMapper';
import PropertyComparisonSelector from './PropertyComparisonSelector';
import PropertyBasicsCharts from './recharts/PropertyBasicsCharts';

interface Category3Props {
  properties: ChartProperty[];
}

// Map ChartProperty to PropertyBasicsCharts Home interface
// VERIFIED AGAINST SCHEMA: Fields 17-29
function mapToPropertyBasicsHomes(properties: ChartProperty[]) {
  const currentYear = new Date().getFullYear();

  return properties.map((p) => ({
    id: p.id,
    name: p.address || 'Unknown Address',
    bedrooms: p.bedrooms || 0,                                    // Field 17: bedrooms
    fullBathrooms: p.fullBathrooms || 0,                          // Field 18: full_bathrooms
    halfBathrooms: p.halfBathrooms || 0,                          // Field 19: half_bathrooms
    totalBathrooms: p.bathrooms || 0,                             // Field 20: total_bathrooms
    livingSqft: p.livingSqft || 0,                                // Field 21: living_sqft
    totalSqftUnderRoof: p.totalSqftUnderRoof || p.livingSqft || 0, // Field 22: total_sqft_under_roof
    lotSizeSqft: p.lotSizeSqft || 0,                              // Field 23: lot_size_sqft
    lotSizeAcres: p.lotSizeAcres || (p.lotSizeSqft ? Math.round((p.lotSizeSqft / 43560) * 100) / 100 : 0), // Field 24: lot_size_acres (calculated if not present)
    yearBuilt: p.yearBuilt || currentYear,                        // Field 25: year_built
    propertyType: p.propertyType || 'Unknown',                    // Field 26: property_type
    stories: p.stories || 1,                                      // Field 27: stories
    garageSpaces: p.garageSpaces || 0,                            // Field 28: garage_spaces
    parkingTotal: p.parkingTotal || 'N/A',                        // Field 29: parking_total
    listingPrice: p.listingPrice || 0,                            // Field 10 (for $/sqft calculations)
    color: '#22c55e', // Will be set based on index
  }));
}

// Sample properties for testing (using correct schema field names)
const SAMPLE_PROPERTIES: ChartProperty[] = [
  {
    id: 'sample-1',
    address: '1821 Hillcrest Drive',
    city: 'Clearwater',
    state: 'FL',
    zip: '33764',
    listingPrice: 2849000,
    bedrooms: 4,
    fullBathrooms: 3,
    halfBathrooms: 1,
    bathrooms: 3.5,
    livingSqft: 2698,
    totalSqftUnderRoof: 2698,
    lotSizeSqft: 7200,
    lotSizeAcres: 0.17,
    yearBuilt: 2015,
    propertyType: 'Single Family',
    stories: 2,
    garageSpaces: 2,
    parkingTotal: '2 Car Garage',
    marketValueEstimate: 2800000,
    assessedValue: 2700000,
    annualTaxes: 35000,
    hoaFeeAnnual: 0,
  } as ChartProperty,
  {
    id: 'sample-2',
    address: '1947 Oakwood Avenue',
    city: 'Clearwater',
    state: 'FL',
    zip: '33764',
    listingPrice: 2695000,
    bedrooms: 4,
    fullBathrooms: 3,
    halfBathrooms: 0,
    bathrooms: 3,
    livingSqft: 2728,
    totalSqftUnderRoof: 2728,
    lotSizeSqft: 8100,
    lotSizeAcres: 0.19,
    yearBuilt: 2016,
    propertyType: 'Single Family',
    stories: 2,
    garageSpaces: 2,
    parkingTotal: '2 Car Garage',
    marketValueEstimate: 2650000,
    assessedValue: 2600000,
    annualTaxes: 33000,
    hoaFeeAnnual: 0,
  } as ChartProperty,
  {
    id: 'sample-3',
    address: '725 Live Oak Street',
    city: 'Clearwater',
    state: 'FL',
    zip: '33764',
    listingPrice: 2549000,
    bedrooms: 3,
    fullBathrooms: 3,
    halfBathrooms: 0,
    bathrooms: 3,
    livingSqft: 2795,
    totalSqftUnderRoof: 2795,
    lotSizeSqft: 9500,
    lotSizeAcres: 0.22,
    yearBuilt: 2014,
    propertyType: 'Single Family',
    stories: 1,
    garageSpaces: 3,
    parkingTotal: '3 Car Garage',
    marketValueEstimate: 2600000,
    assessedValue: 2500000,
    annualTaxes: 31000,
    hoaFeeAnnual: 0,
  } as ChartProperty,
];

export default function Category3_PropertyBasics({ properties }: Category3Props) {
  const { fullProperties } = usePropertyStore();

  // State for 3 selected properties to compare
  const [selectedProperties, setSelectedProperties] = useState<[string | null, string | null, string | null]>([null, null, null]);

  // Convert all properties from store
  const allProperties = Array.from(fullProperties.values());
  const allChartProperties = mapPropertiesToChart(allProperties);

  // Use sample data if no real properties exist
  const availableProperties = allChartProperties.length > 0 ? allChartProperties : SAMPLE_PROPERTIES;

  // Auto-select first 3 properties if none selected and properties exist
  useEffect(() => {
    if (availableProperties.length >= 3 && !selectedProperties[0] && !selectedProperties[1] && !selectedProperties[2]) {
      setSelectedProperties([
        availableProperties[0].id,
        availableProperties[1].id,
        availableProperties[2].id,
      ]);
    } else if (availableProperties.length === 2 && !selectedProperties[0] && !selectedProperties[1]) {
      setSelectedProperties([availableProperties[0].id, availableProperties[1].id, null]);
    } else if (availableProperties.length === 1 && !selectedProperties[0]) {
      setSelectedProperties([availableProperties[0].id, null, null]);
    }
  }, [availableProperties.length]);

  // Handle property selection change
  const handlePropertySelect = (index: 0 | 1 | 2, propertyId: string | null) => {
    const newSelected = [...selectedProperties] as [string | null, string | null, string | null];
    newSelected[index] = propertyId;
    setSelectedProperties(newSelected);
  };

  // Get only the selected properties for charts
  const selectedChartProperties = availableProperties.filter(p =>
    selectedProperties.includes(p.id)
  );

  // Assign property colors (matching Category 21 pattern)
  const PROPERTY_COLORS = ['#22c55e', '#8b5cf6', '#ec4899']; // Green, Lavender, Pink
  const mappedHomes = mapToPropertyBasicsHomes(selectedChartProperties).map((home, idx) => ({
    ...home,
    color: PROPERTY_COLORS[idx] || '#22c55e'
  }));

  return (
    <div className="space-y-8">
      {/* Property Comparison Selector - 3 dropdown fields - ALWAYS VISIBLE */}
      <PropertyComparisonSelector
        properties={availableProperties}
        selectedProperties={selectedProperties}
        onPropertySelect={handlePropertySelect}
      />

      {/* Header Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-green-500/20 border border-blue-500/30"
      >
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        <span className="text-sm font-medium text-blue-300">Category 3: Property Basics (Fields 17-29)</span>
      </motion.div>

      {/* Charts */}
      {selectedChartProperties.length > 0 ? (
        <PropertyBasicsCharts homes={mappedHomes} />
      ) : (
        <div className="text-center py-12 text-gray-400">
          Please select at least one property from the dropdowns above
        </div>
      )}
    </div>
  );
}
