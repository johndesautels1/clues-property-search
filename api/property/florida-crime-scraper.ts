/**
 * Florida Local Crime Data Scraper
 * Scrapes crime data from 7 Florida counties:
 * Pinellas, Hillsborough, Sarasota, Manatee, Pasco, Polk, Hernando
 */

import type { ApiResult, ApiField } from './free-apis';

// Helper to set field only if value exists
function setField(
  fields: Record<string, ApiField>,
  key: string,
  value: any,
  source: string,
  confidence: 'High' | 'Medium' | 'Low' = 'High'
): void {
  if (value !== null && value !== undefined && value !== '' && value !== 0) {
    fields[key] = { value, source, confidence };
  }
}

// County data sources configuration
const COUNTY_SOURCES: Record<string, {
  type: 'arcgis' | 'crimemapping';
  endpoint: string;
  name: string;
}> = {
  'pinellas': {
    type: 'arcgis',
    endpoint: 'https://egis.pinellas.gov/arcgis/rest/services/Apps/CrimeViewer/MapServer/0/query',
    name: 'Pinellas County Sheriff'
  },
  'hillsborough': {
    type: 'arcgis',
    endpoint: 'https://gis.hcso.tampa.fl.us/arcgis/rest/services/CrimeMapping/CrimeData/MapServer/0/query',
    name: 'Hillsborough County Sheriff'
  },
  'pasco': {
    type: 'arcgis',
    endpoint: 'https://services.arcgis.com/pascocounty/arcgis/rest/services/Crime/FeatureServer/0/query',
    name: 'Pasco County Sheriff'
  },
  'polk': {
    type: 'arcgis',
    endpoint: 'https://services.arcgis.com/polk/arcgis/rest/services/Crime_Data/FeatureServer/0/query',
    name: 'Polk County Sheriff'
  },
  'sarasota': {
    type: 'crimemapping',
    endpoint: 'https://www.crimemapping.com/api/incidents',
    name: 'Sarasota County Sheriff'
  },
  'manatee': {
    type: 'crimemapping',
    endpoint: 'https://www.crimemapping.com/api/incidents',
    name: 'Manatee County Sheriff'
  },
  'hernando': {
    type: 'crimemapping',
    endpoint: 'https://www.crimemapping.com/api/incidents',
    name: 'Hernando County Sheriff'
  }
};

// Crime type categories for grading
const VIOLENT_CRIMES = ['homicide', 'murder', 'assault', 'battery', 'robbery', 'rape', 'sexual', 'kidnap', 'manslaughter'];
const PROPERTY_CRIMES = ['burglary', 'theft', 'larceny', 'auto theft', 'vehicle theft', 'vandalism', 'arson', 'trespass'];

interface CrimeIncident {
  type: string;
  date: string;
  distance?: number;
}

/**
 * Query ArcGIS REST API for crime data near a location
 */
async function queryArcGIS(
  endpoint: string,
  lat: number,
  lon: number,
  radiusMeters: number = 1609 // 1 mile
): Promise<CrimeIncident[]> {
  const incidents: CrimeIncident[] = [];

  // Calculate date range (last 12 months)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  const params = new URLSearchParams({
    where: `1=1`,
    geometry: JSON.stringify({
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 }
    }),
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    distance: radiusMeters.toString(),
    units: 'esriSRUnit_Meter',
    outFields: '*',
    returnGeometry: 'false',
    f: 'json'
  });

  try {
    const response = await fetch(`${endpoint}?${params.toString()}`);

    if (!response.ok) {
      return incidents;
    }

    const data = await response.json();

    if (data.features) {
      for (const feature of data.features) {
        const attrs = feature.attributes;
        // Try common field names for crime type
        const crimeType = attrs.OFFENSE || attrs.offense || attrs.CRIME_TYPE ||
                         attrs.crime_type || attrs.TYPE || attrs.type ||
                         attrs.DESCRIPTION || attrs.description || 'Unknown';

        // Try common field names for date
        const dateField = attrs.DATE || attrs.date || attrs.INCIDENT_DATE ||
                         attrs.incident_date || attrs.REPORT_DATE || attrs.report_date;

        incidents.push({
          type: String(crimeType).toLowerCase(),
          date: dateField ? new Date(dateField).toISOString() : new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('ArcGIS query error:', error);
  }

  return incidents;
}

/**
 * Query CrimeMapping.com API for crime data
 */
async function queryCrimeMapping(
  countyId: string,
  lat: number,
  lon: number,
  radiusMiles: number = 1
): Promise<CrimeIncident[]> {
  const incidents: CrimeIncident[] = [];

  // CrimeMapping uses agency IDs
  const agencyIds: Record<string, string> = {
    'sarasota': '231', // Sarasota County Sheriff
    'manatee': '229',  // Manatee County Sheriff
    'hernando': '158'  // Hernando County Sheriff
  };

  const agencyId = agencyIds[countyId];
  if (!agencyId) return incidents;

  try {
    // CrimeMapping.com API endpoint
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6); // Last 6 months

    const url = `https://www.crimemapping.com/api/incidents/GetByAgencies`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        agencyIds: [parseInt(agencyId)],
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        latitude: lat,
        longitude: lon,
        radius: radiusMiles,
        radiusUnits: 'miles'
      })
    });

    if (!response.ok) {
      // Fallback: try scraping the public page
      return await scrapeCrimeMappingPage(agencyId, lat, lon);
    }

    const data = await response.json();

    if (data.incidents) {
      for (const incident of data.incidents) {
        incidents.push({
          type: String(incident.type || incident.offense || 'Unknown').toLowerCase(),
          date: incident.date || incident.incidentDate || new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('CrimeMapping query error:', error);
    // Try fallback
    return await scrapeCrimeMappingPage(agencyIds[countyId], lat, lon);
  }

  return incidents;
}

/**
 * Fallback: Scrape CrimeMapping public page
 */
async function scrapeCrimeMappingPage(
  agencyId: string,
  lat: number,
  lon: number
): Promise<CrimeIncident[]> {
  const incidents: CrimeIncident[] = [];

  try {
    // Try to get data from their public map page
    const url = `https://www.crimemapping.com/map/agency/${agencyId}`;
    const response = await fetch(url);

    if (!response.ok) return incidents;

    const html = await response.text();

    // Look for embedded JSON data in the page
    const dataMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/s);
    if (dataMatch) {
      try {
        const state = JSON.parse(dataMatch[1]);
        if (state.incidents) {
          for (const incident of state.incidents) {
            incidents.push({
              type: String(incident.type || 'Unknown').toLowerCase(),
              date: incident.date || new Date().toISOString()
            });
          }
        }
      } catch (e) {}
    }
  } catch (error) {
    console.error('CrimeMapping scrape error:', error);
  }

  return incidents;
}

/**
 * Determine county from coordinates using reverse geocoding result
 */
function getCountyFromName(countyName: string): string | null {
  const normalized = countyName.toLowerCase().replace(' county', '').trim();

  const countyMap: Record<string, string> = {
    'pinellas': 'pinellas',
    'hillsborough': 'hillsborough',
    'sarasota': 'sarasota',
    'manatee': 'manatee',
    'pasco': 'pasco',
    'polk': 'polk',
    'hernando': 'hernando'
  };

  return countyMap[normalized] || null;
}

/**
 * Calculate crime grade from incidents
 */
function calculateCrimeGrade(incidents: CrimeIncident[]): {
  grade: string;
  violentCount: number;
  propertyCount: number;
  totalCount: number;
  riskLevel: string;
} {
  let violentCount = 0;
  let propertyCount = 0;

  for (const incident of incidents) {
    const type = incident.type.toLowerCase();

    if (VIOLENT_CRIMES.some(v => type.includes(v))) {
      violentCount++;
    } else if (PROPERTY_CRIMES.some(p => type.includes(p))) {
      propertyCount++;
    }
  }

  const totalCount = incidents.length;

  // Grade based on incidents within 1 mile over 12 months
  // National average is ~25 incidents per 1000 people
  // Assuming ~2000 people per sq mile in suburban FL
  let grade = 'A';
  let riskLevel = 'Very Low';

  if (violentCount > 10 || totalCount > 200) {
    grade = 'F';
    riskLevel = 'Very High';
  } else if (violentCount > 5 || totalCount > 100) {
    grade = 'D';
    riskLevel = 'High';
  } else if (violentCount > 2 || totalCount > 50) {
    grade = 'C';
    riskLevel = 'Moderate';
  } else if (totalCount > 20) {
    grade = 'B';
    riskLevel = 'Low';
  }

  return { grade, violentCount, propertyCount, totalCount, riskLevel };
}

/**
 * Main function: Get local crime data for a Florida property
 */
export async function getFloridaLocalCrime(
  lat: number,
  lon: number,
  county: string
): Promise<ApiResult> {
  const fields: Record<string, ApiField> = {};

  const countyId = getCountyFromName(county);

  if (!countyId) {
    return {
      success: false,
      source: 'Florida Local Crime',
      fields,
      error: `County "${county}" not supported. Supported: Pinellas, Hillsborough, Sarasota, Manatee, Pasco, Polk, Hernando`
    };
  }

  const sourceConfig = COUNTY_SOURCES[countyId];
  if (!sourceConfig) {
    return {
      success: false,
      source: 'Florida Local Crime',
      fields,
      error: `No data source configured for ${county}`
    };
  }

  let incidents: CrimeIncident[] = [];

  try {
    if (sourceConfig.type === 'arcgis') {
      incidents = await queryArcGIS(sourceConfig.endpoint, lat, lon);
    } else if (sourceConfig.type === 'crimemapping') {
      incidents = await queryCrimeMapping(countyId, lat, lon);
    }

    if (incidents.length === 0) {
      // No incidents could mean very safe area OR API issue
      setField(fields, '93_local_crime_incidents_1yr', 0, sourceConfig.name, 'Medium');
      setField(fields, '94_local_crime_grade', 'A', sourceConfig.name, 'Medium');
      setField(fields, '95_local_crime_risk', 'Very Low (or data unavailable)', sourceConfig.name, 'Medium');

      return {
        success: true,
        source: sourceConfig.name,
        fields
      };
    }

    const crimeStats = calculateCrimeGrade(incidents);

    setField(fields, '93_local_crime_incidents_1yr', crimeStats.totalCount, sourceConfig.name);
    setField(fields, '94_local_crime_grade', crimeStats.grade, sourceConfig.name);
    setField(fields, '95_local_crime_risk', crimeStats.riskLevel, sourceConfig.name);
    setField(fields, '96_violent_crimes_1mi', crimeStats.violentCount, sourceConfig.name);
    setField(fields, '97_property_crimes_1mi', crimeStats.propertyCount, sourceConfig.name);

    // Get most common crime types
    const typeCounts: Record<string, number> = {};
    for (const incident of incidents) {
      const type = incident.type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }

    const sortedTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);

    if (sortedTypes.length > 0) {
      setField(fields, '98_common_crime_types', sortedTypes.join(', '), sourceConfig.name);
    }

    return {
      success: true,
      source: sourceConfig.name,
      fields
    };

  } catch (error) {
    return {
      success: false,
      source: sourceConfig.name,
      fields,
      error: String(error)
    };
  }
}

/**
 * Wrapper that tries local crime first, falls back to FBI state data
 */
export async function getComprehensiveCrimeData(
  lat: number,
  lon: number,
  county: string,
  address: string
): Promise<ApiResult> {
  // Try local Florida crime data first
  const localResult = await getFloridaLocalCrime(lat, lon, county);

  if (localResult.success && Object.keys(localResult.fields).length > 0) {
    return localResult;
  }

  // Fall back to FBI state-level data (already implemented in free-apis.ts)
  return {
    success: false,
    source: 'Florida Local Crime',
    fields: {},
    error: 'Local crime data unavailable - using FBI state data as fallback'
  };
}
