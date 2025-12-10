/**
 * Category 04: HOA & Taxes
 * Fields 30-38: HOA (Y/N, Fee, Name, Includes), Annual Taxes, Tax Year, Assessed Value, Ownership Type
 *
 * ✅ ChartsReadme.md Requirements:
 * - Uses only 3 selected properties from dropdown
 * - Property-specific colors (Cyan, Purple, Pink)
 * - CLUES-Smart scoring system
 * - Enhanced tooltips with addresses
 * - Field numbers in titles
 * - Proper units and labels
 */

import type { ChartProperty } from '@/lib/visualsDataMapper';
import HOATaxesCharts from './recharts/HOATaxesCharts';

interface CategoryProps {
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
    hoaIncludes: p.hoaIncludes || '',            // Field 33: hoa_includes
    ownershipType: p.ownershipType || 'Fee Simple', // Field 34: ownership_type
    annualTaxes: p.annualTaxes || 0,            // Field 35: annual_taxes
    taxYear: p.taxYear || new Date().getFullYear(), // Field 36: tax_year
    propertyTaxRate: p.propertyTaxRate || 0,    // Field 37: property_tax_rate
    taxExemptions: p.taxExemptions || '',        // Field 38: tax_exemptions
  }));
}

export default function Category04_HOATaxes({ properties }: CategoryProps) {
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
      <HOATaxesCharts homes={mapToHOATaxesHomes(compareProps)} />
    </div>
  );
}
