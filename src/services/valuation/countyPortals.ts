/**
 * Florida County Portal URLs
 *
 * Direct links to Property Appraiser and Building Department portals
 * for faster, more accurate Gemini search results.
 *
 * Organized by major metro areas in Florida.
 */

export interface CountyPortalInfo {
  propertyAppraiser: string;
  buildingDept?: string;
  permitSearch?: string;
  taxSearch?: string;
  notes?: string;
}

export const FLORIDA_COUNTY_PORTALS: Record<string, CountyPortalInfo> = {

  // ============================================================================
  // TAMPA BAY METRO
  // ============================================================================

  'Hillsborough': {
    propertyAppraiser: 'https://hcpafl.org',
    buildingDept: 'https://www.hillsboroughcounty.org/en/residents/property-owners-and-tenants/building-permits',
    permitSearch: 'https://aca3.accela.com/hillsborough',
    taxSearch: 'https://hcpafl.org/property-search',
    notes: 'Accela system for permits'
  },

  'Pinellas': {
    propertyAppraiser: 'https://www.pcpao.org',
    buildingDept: 'https://www.pinellascounty.org/building',
    permitSearch: 'https://aca-prod.accela.com/pinellas',
    taxSearch: 'https://www.pcpao.org/PropertySearch',
    notes: 'Accela system for permits'
  },

  'Pasco': {
    propertyAppraiser: 'https://pascopa.com',
    buildingDept: 'https://www.pascocountyfl.net/199/Building-Services',
    permitSearch: 'https://aca.pascocountyfl.net/CitizenAccess',
    taxSearch: 'https://pascopa.com/search',
    notes: 'Accela system for permits'
  },

  'Polk': {
    propertyAppraiser: 'https://www.polkpa.org',
    buildingDept: 'https://www.polk.county-pa.com/building',
    permitSearch: 'https://aca-prod.accela.com/polk',
    taxSearch: 'https://www.polkpa.org/propertysearch',
    notes: 'Accela system for permits'
  },

  // ============================================================================
  // ORLANDO METRO
  // ============================================================================

  'Orange': {
    propertyAppraiser: 'https://www.ocpafl.org',
    buildingDept: 'https://www.orangecountyfl.net/PlanningDevelopment/BuildingDivision',
    permitSearch: 'https://ocfl.net/development-engineering/building/permit-search',
    taxSearch: 'https://www.ocpafl.org/searches/ParcelSearch.aspx',
    notes: 'One of the largest counties in FL'
  },

  'Seminole': {
    propertyAppraiser: 'https://www.scpafl.org',
    buildingDept: 'https://www.seminolecountyfl.gov/departments-services/community-development/building-construction',
    permitSearch: 'https://aca-prod.accela.com/seminole',
    taxSearch: 'https://www.scpafl.org/services/property-search',
    notes: 'Accela system for permits'
  },

  'Osceola': {
    propertyAppraiser: 'https://www.osceolapa.org',
    buildingDept: 'https://www.osceola.org/agencies/community-development/building-division',
    permitSearch: 'https://aca-prod.accela.com/osceola',
    taxSearch: 'https://www.osceolapa.org/property-search',
    notes: 'Rapidly growing county'
  },

  'Lake': {
    propertyAppraiser: 'https://www.lakecopropappr.com',
    buildingDept: 'https://www.lakecountyfl.gov/departments/public_works/building_services',
    permitSearch: 'https://aca-prod.accela.com/lake',
    taxSearch: 'https://www.lakecopropappr.com/search',
    notes: 'North of Orlando'
  },

  // ============================================================================
  // JACKSONVILLE METRO
  // ============================================================================

  'Duval': {
    propertyAppraiser: 'https://paopropertysearch.coj.net',
    buildingDept: 'https://www.coj.net/departments/planning-and-development/building-inspection',
    permitSearch: 'https://aca-prod.accela.com/jacksonville',
    taxSearch: 'https://paopropertysearch.coj.net/PropertySearch',
    notes: 'Jacksonville consolidated government'
  },

  'St. Johns': {
    propertyAppraiser: 'https://www.sjcpa.us',
    buildingDept: 'https://www.sjcfl.us/BuildingSafety',
    permitSearch: 'https://aca-prod.accela.com/stjohns',
    taxSearch: 'https://www.sjcpa.us/property-search',
    notes: 'Fast-growing county'
  },

  // ============================================================================
  // MIAMI METRO
  // ============================================================================

  'Miami-Dade': {
    propertyAppraiser: 'https://www.miamidade.gov/pa',
    buildingDept: 'https://www.miamidade.gov/building',
    permitSearch: 'https://www.miamidade.gov/permits',
    taxSearch: 'https://www.miamidade.gov/Apps/PA/propertysearch',
    notes: 'Largest metro in FL'
  },

  'Broward': {
    propertyAppraiser: 'https://web.bcpa.net',
    buildingDept: 'https://www.broward.org/Building',
    permitSearch: 'https://aca-prod.accela.com/broward',
    taxSearch: 'https://web.bcpa.net/bcpaclient/Default.aspx',
    notes: 'Fort Lauderdale area'
  },

  'Palm Beach': {
    propertyAppraiser: 'https://www.pbcgov.org/papa',
    buildingDept: 'https://discover.pbcgov.org/building',
    permitSearch: 'https://aca-prod.accela.com/palmbeach',
    taxSearch: 'https://www.pbcgov.org/papa/Asps/PropertySearch/PropertySearch.aspx',
    notes: 'West Palm Beach area'
  },

  // ============================================================================
  // SOUTHWEST FLORIDA
  // ============================================================================

  'Lee': {
    propertyAppraiser: 'https://www.leepa.org',
    buildingDept: 'https://www.leegov.com/dcd/building',
    permitSearch: 'https://aca-prod.accela.com/lee',
    taxSearch: 'https://www.leepa.org/search',
    notes: 'Fort Myers, Cape Coral area'
  },

  'Collier': {
    propertyAppraiser: 'https://www.collierappraiser.com',
    buildingDept: 'https://www.colliercountyfl.gov/your-government/divisions-a-e/building-development-services',
    permitSearch: 'https://aca-prod.accela.com/collier',
    taxSearch: 'https://www.collierappraiser.com/search',
    notes: 'Naples area'
  },

  'Charlotte': {
    propertyAppraiser: 'https://www.ccappraiser.com',
    buildingDept: 'https://www.charlottecountyfl.gov/building',
    permitSearch: 'https://aca-prod.accela.com/charlotte',
    taxSearch: 'https://www.ccappraiser.com/search',
    notes: 'Punta Gorda area'
  },

  'Sarasota': {
    propertyAppraiser: 'https://www.sc-pa.com',
    buildingDept: 'https://www.scgov.net/government/building-services',
    permitSearch: 'https://aca-prod.accela.com/sarasota',
    taxSearch: 'https://www.sc-pa.com/search',
    notes: 'High-value coastal properties'
  },

  'Manatee': {
    propertyAppraiser: 'https://www.manateepao.com',
    buildingDept: 'https://www.mymanatee.org/departments/public_safety/building_safety',
    permitSearch: 'https://aca-prod.accela.com/manatee',
    taxSearch: 'https://www.manateepao.com/search',
    notes: 'Bradenton area'
  },

  // ============================================================================
  // SPACE COAST
  // ============================================================================

  'Brevard': {
    propertyAppraiser: 'https://www.bcpao.us',
    buildingDept: 'https://www.brevardfl.gov/PropertyAppraisalandPlanning/Divisions/BuildingDivision',
    permitSearch: 'https://aca-prod.accela.com/brevard',
    taxSearch: 'https://www.bcpao.us/propertysearch',
    notes: 'Melbourne, Cocoa Beach area'
  },

  'Volusia': {
    propertyAppraiser: 'https://www.vcpa.vcgov.org',
    buildingDept: 'https://www.volusia.org/services/growth-and-resource-management/building-services',
    permitSearch: 'https://aca-prod.accela.com/volusia',
    taxSearch: 'https://www.vcpa.vcgov.org/search',
    notes: 'Daytona Beach area'
  },

  // ============================================================================
  // NORTHWEST FLORIDA
  // ============================================================================

  'Escambia': {
    propertyAppraiser: 'https://www.escpa.org',
    buildingDept: 'https://myescambia.com/our-services/building-services',
    permitSearch: 'https://aca-prod.accela.com/escambia',
    taxSearch: 'https://www.escpa.org/search',
    notes: 'Pensacola area'
  },

  'Okaloosa': {
    propertyAppraiser: 'https://www.okaloosapa.com',
    buildingDept: 'https://www.co.okaloosa.fl.us/growth-management/building-inspections',
    permitSearch: 'https://aca-prod.accela.com/okaloosa',
    taxSearch: 'https://www.okaloosapa.com/search',
    notes: 'Fort Walton Beach, Destin area'
  },

  'Bay': {
    propertyAppraiser: 'https://www.baytaxcollector.com/propertyappraiser',
    buildingDept: 'https://www.baycountyfl.gov/263/Building-Services',
    permitSearch: 'https://aca-prod.accela.com/bay',
    taxSearch: 'https://qpublic.schneidercorp.com/Application.aspx?AppID=950',
    notes: 'Panama City area'
  }
};

/**
 * Get county portal URLs for a given county name
 */
export function getCountyPortals(countyName: string): CountyPortalInfo | null {
  // Normalize county name (remove "County" suffix, trim, title case)
  const normalized = countyName
    .replace(/\s+County$/i, '')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return FLORIDA_COUNTY_PORTALS[normalized] || null;
}

/**
 * Build enhanced search instructions with direct portal URLs
 */
export function buildCountySearchInstructions(countyName: string): string {
  const portals = getCountyPortals(countyName);

  if (!portals) {
    return `Search ${countyName} County, Florida government websites for property and permit data.`;
  }

  let instructions = `Search the following official ${countyName} County websites:\n\n`;

  instructions += `1. Property Appraiser: ${portals.propertyAppraiser}\n`;

  if (portals.taxSearch) {
    instructions += `   Tax Search: ${portals.taxSearch}\n`;
  }

  if (portals.buildingDept) {
    instructions += `2. Building Department: ${portals.buildingDept}\n`;
  }

  if (portals.permitSearch) {
    instructions += `   Permit Search: ${portals.permitSearch}\n`;
  }

  if (portals.notes) {
    instructions += `\nNote: ${portals.notes}\n`;
  }

  return instructions.trim();
}

/**
 * Get list of all supported counties
 */
export function getSupportedCounties(): string[] {
  return Object.keys(FLORIDA_COUNTY_PORTALS).sort();
}

/**
 * Check if county is supported
 */
export function isCountySupported(countyName: string): boolean {
  return getCountyPortals(countyName) !== null;
}
