/**
 * Category 21: Advanced Visuals (25 Charts Total)
 * Combines DeepSeek D3.js charts (5) + Claude Recharts (10) + future expansions
 *
 * Charts:
 * DEEPSEEK D3.js (Charts 1-2):
 * 1. Market Radar - Multi-dimensional property comparison
 * 2. Value Momentum - Price progression visualization
 *
 * CLAUDE RECHARTS (Charts 6-15):
 * 6. Listing Price Comparison
 * 7. $/Sq Ft Leaderboard
 * 8. List Price vs Market Value
 * 9. Value Score (0-100)
 * 10. Price Components
 * 11. Comparative Radar
 * 12. Value Gauges
 * 13. Appreciation Since Last Sale
 * 14. Overall Value Score
 * 15. Value Pyramid
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChartProperty } from '@/lib/visualsDataMapper';
import { usePropertyStore } from '@/store/propertyStore';
import { mapPropertiesToChart } from '@/lib/visualsDataMapper';
import HOATaxesCharts from './recharts/HOATaxesCharts';

interface Category21Props {
  properties: ChartProperty[];
}

// Map ChartProperty to HOATaxesCharts Home interface
// VERIFIED AGAINST SCHEMA: Fields 30-38 (HOA & Taxes)
function mapToHOATaxesHomes(properties: ChartProperty[]) {
  return properties.map((p, idx) => ({
    id: p.id,
    name: p.address || 'Unknown Address',
    color: ['#22c55e', '#8b5cf6', '#ec4899'][idx] || '#22c55e',  // Green, Lavender, Pink
    // Fields 30-38: HOA & Taxes
    hoaYN: p.hoaYn || false,                     // Field 30: hoa_yn
    hoaFeeAnnual: p.hoaFeeAnnual || 0,          // Field 31: hoa_fee_annual
    hoaName: p.hoaName || '',                    // Field 32: hoa_name
    hoaIncludes: p.hoaIncludes || '',            // Field 33: hoa_includes (missing from interface)
    ownershipType: p.ownershipType || 'Fee Simple', // Field 34: ownership_type (missing from interface)
    annualTaxes: p.annualTaxes || 0,            // Field 35: annual_taxes
    taxYear: p.taxYear || new Date().getFullYear(), // Field 36: tax_year (missing from interface)
    propertyTaxRate: p.propertyTaxRate || 0,    // Field 37: property_tax_rate
    taxExemptions: p.taxExemptions || '',        // Field 38: tax_exemptions
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
    bathrooms: 3.5,
    fullBathrooms: 3,
    halfBathrooms: 1,
    livingSqft: 2698,
    totalSqftUnderRoof: 2698,
    lotSizeSqft: 7200,
    lotSizeAcres: 0.17,
    marketValueEstimate: 2800000, // Field 12: market_value_estimate
    redfinEstimate: 2850000,      // Field 16: redfin_estimate
    lastSalePrice: 2500000,
    lastSaleDate: '2020-01-01',
    assessedValue: 2700000,
    yearBuilt: 2015,
    propertyType: 'Single Family',
    stories: 2,
    garageSpaces: 2,              // Field 28: garage_spaces
    parkingTotal: '2 Car Garage', // Field 29: parking_total
    hoaFeeAnnual: 0,
    annualTaxes: 35000,
    // Section 4: HOA & Taxes (Fields 30-38)
    hoaYn: false,
    hoaName: 'None',
    hoaIncludes: 'None',
    ownershipType: 'Fee Simple',
    taxYear: 2024,
    propertyTaxRate: 0.88,
    taxExemptions: 'Homestead Exemption',
  } as ChartProperty,
  {
    id: 'sample-2',
    address: '1947 Oakwood Avenue',
    city: 'Clearwater',
    state: 'FL',
    zip: '33764',
    listingPrice: 2695000,
    bedrooms: 4,
    bathrooms: 3,
    fullBathrooms: 3,
    halfBathrooms: 0,
    livingSqft: 2728,
    totalSqftUnderRoof: 2728,
    lotSizeSqft: 8100,
    lotSizeAcres: 0.19,
    marketValueEstimate: 2650000, // Field 12: market_value_estimate
    redfinEstimate: 2700000,      // Field 16: redfin_estimate
    lastSalePrice: 2400000,
    lastSaleDate: '2021-01-01',
    assessedValue: 2600000,
    yearBuilt: 2016,
    propertyType: 'Single Family',
    stories: 2,
    garageSpaces: 2,              // Field 28: garage_spaces
    parkingTotal: '2 Car Garage', // Field 29: parking_total
    hoaFeeAnnual: 1200,
    annualTaxes: 33000,
    // Section 4: HOA & Taxes (Fields 30-38)
    hoaYn: true,
    hoaName: 'Oakwood Estates HOA',
    hoaIncludes: 'Common area maintenance, landscaping, pool',
    ownershipType: 'Condo',
    taxYear: 2024,
    propertyTaxRate: 0.85,
    taxExemptions: '',
  } as ChartProperty,
  {
    id: 'sample-3',
    address: '725 Live Oak Street',
    city: 'Clearwater',
    state: 'FL',
    zip: '33764',
    listingPrice: 2549000,
    bedrooms: 3,
    bathrooms: 3,
    fullBathrooms: 3,
    halfBathrooms: 0,
    livingSqft: 2795,
    totalSqftUnderRoof: 2795,
    lotSizeSqft: 9500,
    lotSizeAcres: 0.22,
    marketValueEstimate: 2600000, // Field 12: market_value_estimate
    redfinEstimate: 2550000,      // Field 16: redfin_estimate
    lastSalePrice: 2200000,
    lastSaleDate: '2019-01-01',
    assessedValue: 2500000,
    yearBuilt: 2014,
    propertyType: 'Single Family',
    stories: 1,
    garageSpaces: 3,              // Field 28: garage_spaces
    parkingTotal: '3 Car Garage', // Field 29: parking_total
    hoaFeeAnnual: 600,
    annualTaxes: 31000,
    // Section 4: HOA & Taxes (Fields 30-38)
    hoaYn: true,
    hoaName: 'Live Oak Community Association',
    hoaIncludes: 'Security, common area landscaping',
    ownershipType: 'Fee Simple',
    taxYear: 2024,
    propertyTaxRate: 0.82,
    taxExemptions: 'Homestead Exemption',
  } as ChartProperty,
];

export default function Category21_AdvancedVisuals({ properties }: Category21Props) {
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

  console.log('Category21 DEBUG:', {
    availablePropertiesCount: availableProperties.length,
    selectedProperties,
    selectedChartPropertiesCount: selectedChartProperties.length
  });

  return (
    <div className="space-y-8">
      {/* Header Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30"
      >
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
        <span className="text-sm font-medium text-cyan-300">DeepSeek Advanced Visualizations</span>
      </motion.div>

      {/* Section 4: HOA & Taxes Charts (Fields 30-38) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30"
      >
        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
        <span className="text-sm font-medium text-orange-300">Section 4: HOA & Taxes Analysis (Fields 30-38)</span>
      </motion.div>

      {/* HOA & Taxes Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="mt-6"
      >
        {selectedChartProperties.length > 0 ? (
          <HOATaxesCharts homes={mapToHOATaxesHomes(selectedChartProperties)} />
        ) : (
          <div className="text-center py-12 text-gray-400">
            Please select at least one property from the dropdowns above
          </div>
        )}
      </motion.div>
    </div>
  );
}
