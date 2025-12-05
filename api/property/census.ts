/**
 * U.S. Census Bureau API Endpoint
 * Fetches housing vacancy rate data from American Community Survey (ACS5)
 * Maps to Field 100: Vacancy Rate (Neighborhood)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel serverless config
export const config = {
  maxDuration: 60, // 1 minute for API calls
};

interface CensusResponse {
  success: boolean;
  fields?: Record<string, any>;
  vacancyRate?: number;
  totalUnits?: number;
  vacantUnits?: number;
  occupiedUnits?: number;
  zipCode?: string;
  year?: number;
  error?: string;
}

/**
 * Fetch vacancy rate data from U.S. Census ACS5 API
 * Uses table B25002 (Occupancy Status) to calculate vacancy rate
 *
 * @param zipCode - ZIP Code to query (will be converted to ZCTA)
 * @param apiKey - U.S. Census API key
 * @returns Vacancy rate as percentage
 */
async function fetchVacancyRate(zipCode: string, apiKey: string): Promise<CensusResponse> {
  try {
    console.log(`[Census API] Fetching vacancy data for ZIP: ${zipCode}`);

    // Use ACS 5-year estimates (most recent complete dataset)
    const year = 2023; // Most recent ACS5 data available

    // B25002: OCCUPANCY STATUS
    // B25002_001E = Total housing units
    // B25002_002E = Occupied housing units
    // B25002_003E = Vacant housing units
    const variables = 'NAME,B25002_001E,B25002_002E,B25002_003E';

    // Query by ZCTA (ZIP Code Tabulation Area)
    // Note: ZCTAs are approximations of ZIP codes used by Census Bureau
    const url = `https://api.census.gov/data/${year}/acs/acs5?get=${variables}&for=zip%20code%20tabulation%20area:${zipCode}&key=${apiKey}`;

    console.log(`[Census API] Requesting: ${url.replace(apiKey, 'REDACTED')}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'CLUES Property Dashboard (contact: admin@clues.com)',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Census API] HTTP ${response.status}: ${errorText}`);
      throw new Error(`Census API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`[Census API] Response:`, JSON.stringify(data, null, 2));

    // Census API returns data in format: [["NAME", "B25002_001E", ...], [actual values...]]
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('Invalid Census API response format');
    }

    const [headers, values] = data;

    // Parse the values
    const totalUnits = parseInt(values[1]) || 0;  // B25002_001E
    const occupiedUnits = parseInt(values[2]) || 0;  // B25002_002E
    const vacantUnits = parseInt(values[3]) || 0;  // B25002_003E
    const locationName = values[0]; // NAME

    console.log(`[Census API] Parsed - Total: ${totalUnits}, Occupied: ${occupiedUnits}, Vacant: ${vacantUnits}`);

    if (totalUnits === 0) {
      throw new Error('No housing units data available for this ZIP code');
    }

    // Calculate vacancy rate as percentage
    const vacancyRate = (vacantUnits / totalUnits) * 100;
    const vacancyRateFormatted = vacancyRate.toFixed(2);

    console.log(`[Census API] ✅ Vacancy Rate: ${vacancyRateFormatted}% (${vacantUnits}/${totalUnits} units vacant)`);

    // Map to Field 100 in CLUES schema
    const fields = {
      '100_vacancy_rate_neighborhood': {
        value: `${vacancyRateFormatted}%`,
        source: 'Census',
        confidence: 'High',
        metadata: {
          totalUnits,
          vacantUnits,
          occupiedUnits,
          year,
          location: locationName,
          zcta: zipCode,
          table: 'ACS5 B25002',
        },
      },
    };

    return {
      success: true,
      fields,
      vacancyRate: parseFloat(vacancyRateFormatted),
      totalUnits,
      vacantUnits,
      occupiedUnits,
      zipCode,
      year,
    };

  } catch (error) {
    console.error('[Census API] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error fetching Census data',
    };
  }
}

/**
 * Main handler for Census API endpoint
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('========================================');
    console.log('[Census API] ENDPOINT CALLED');
    console.log('========================================');

    // Get parameters from request
    const params = req.method === 'POST' ? req.body : req.query;
    const { zipCode, zip } = params;

    // Use either 'zipCode' or 'zip' parameter
    const zipCodeValue = zipCode || zip;

    if (!zipCodeValue) {
      console.log('[Census API] ERROR: No ZIP code provided');
      return res.status(400).json({
        success: false,
        error: 'ZIP code is required',
      });
    }

    // Validate ZIP code format (5 digits)
    const zipCodeStr = String(zipCodeValue).trim();
    if (!/^\d{5}$/.test(zipCodeStr)) {
      console.log('[Census API] ERROR: Invalid ZIP code format:', zipCodeStr);
      return res.status(400).json({
        success: false,
        error: 'ZIP code must be 5 digits',
      });
    }

    // Get Census API key from environment
    const apiKey = process.env.CENSUS_API_KEY;
    if (!apiKey) {
      console.log('[Census API] ERROR: CENSUS_API_KEY not configured');
      return res.status(500).json({
        success: false,
        error: 'Census API key not configured',
      });
    }

    console.log(`[Census API] Fetching data for ZIP: ${zipCodeStr}`);

    // Fetch vacancy rate data
    const result = await fetchVacancyRate(zipCodeStr, apiKey);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error || 'Failed to fetch Census data',
      });
    }

    console.log(`[Census API] ✅ Success - Vacancy Rate: ${result.vacancyRate}%`);

    return res.status(200).json({
      success: true,
      fields: result.fields,
      vacancyRate: result.vacancyRate,
      totalUnits: result.totalUnits,
      vacantUnits: result.vacantUnits,
      occupiedUnits: result.occupiedUnits,
      zipCode: result.zipCode,
      year: result.year,
      source: 'U.S. Census Bureau (ACS5)',
      table: 'B25002 - Occupancy Status',
    });

  } catch (error) {
    console.error('[Census API] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch Census data',
    });
  }
}
