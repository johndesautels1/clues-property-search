/**
 * CLUES Broker Dashboard API
 *
 * POST endpoint that accepts filters + properties array
 * Returns aggregated KPIs and filtered data for glassmorphic dashboard
 *
 * Request body:
 * {
 *   "filters": { "region": "...", "minPrice": ..., "maxPrice": ..., "propertyTypes": [...] },
 *   "properties": [ { ...property objects with exact CSV field names... } ]
 * }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 30,
};

interface Property {
  id: string | number;
  address: string;
  price: number;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  lotSize: number;
  yearBuilt: number;
  listPrice: number;
  marketEstimate: number;
  redfinEstimate: number;
  assessedValue: number;
  appreciation5yr: number;
  capRate: number;
  rentalYield: number;
  priceToRent: number;
  propertyTax: number;
  insurance: number;
  insuranceBase: number;
  insuranceFlood: number;
  insuranceWind: number;
  hoaFees: number;
  utilities: number;
  utilitiesElectric: number;
  utilitiesWater: number;
  utilitiesInternet: number;
  maintenance: number;
  rentalIncome: number;
  pricePerSqft: number;
  daysOnMarket: number;
  neighborhoodMedianPrice: number;
  marketVelocityDays: number;
  safetyScore: number;
  violentCrime: string;
  propertyCrime: string;
  floodRisk: number;
  hurricaneRisk: number;
  seaLevelRisk: number;
  wildfireRisk: number;
  earthquakeRisk: number;
  tornadoRisk: number;
  airQualityRisk: number;
  radonRisk: number;
  walkScore: number;
  transitScore: number;
  bikeScore: number;
  propertyType?: string;
  ownershipType?: string;
  listingStatus?: string;
  [key: string]: any; // Allow additional fields
}

interface Filters {
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyTypes?: string[];
  minBedrooms?: number;
  maxBedrooms?: number;
}

interface RequestBody {
  filters?: Filters;
  properties: Property[];
}

// Helper functions for aggregation
function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return sum(arr) / arr.length;
}

function distribution(arr: (string | number)[]): Record<string, number> {
  const dist: Record<string, number> = {};
  arr.forEach(val => {
    const key = String(val);
    dist[key] = (dist[key] || 0) + 1;
  });
  return dist;
}

// Filter properties based on criteria
function filterProperties(properties: Property[], filters: Filters): Property[] {
  return properties.filter(p => {
    if (filters.minPrice && p.listPrice < filters.minPrice) return false;
    if (filters.maxPrice && p.listPrice > filters.maxPrice) return false;
    if (filters.minBedrooms && p.bedrooms < filters.minBedrooms) return false;
    if (filters.maxBedrooms && p.bedrooms > filters.maxBedrooms) return false;
    if (filters.propertyTypes && filters.propertyTypes.length > 0) {
      if (!filters.propertyTypes.includes(p.propertyType || '')) return false;
    }
    if (filters.region) {
      if (!p.address.toLowerCase().includes(filters.region.toLowerCase())) return false;
    }
    return true;
  });
}

// Calculate all KPIs
function calculateKPIs(properties: Property[]) {
  if (properties.length === 0) {
    return {
      portfolioValue: { listPrice: 0, marketEstimate: 0, redfinEstimate: 0, assessedValue: 0 },
      performance: { appreciation5yr: 0, capRate: 0, rentalYield: 0, pricePerSqft: 0, daysOnMarket: 0 },
      risk: { safetyScore: 0, floodRisk: {}, hurricaneRisk: {}, seaLevelRisk: {}, wildfireRisk: {}, earthquakeRisk: {}, tornadoRisk: {} },
      count: 0
    };
  }

  return {
    portfolioValue: {
      listPrice: sum(properties.map(p => p.listPrice || 0)),
      marketEstimate: sum(properties.map(p => p.marketEstimate || 0)),
      redfinEstimate: sum(properties.map(p => p.redfinEstimate || 0)),
      assessedValue: sum(properties.map(p => p.assessedValue || 0)),
    },
    performance: {
      appreciation5yr: avg(properties.map(p => p.appreciation5yr || 0)),
      capRate: avg(properties.map(p => p.capRate || 0)),
      rentalYield: avg(properties.map(p => p.rentalYield || 0)),
      pricePerSqft: avg(properties.map(p => p.pricePerSqft || 0)),
      daysOnMarket: avg(properties.map(p => p.daysOnMarket || 0)),
    },
    risk: {
      safetyScore: avg(properties.map(p => p.safetyScore || 0)),
      floodRisk: distribution(properties.map(p => p.floodRisk)),
      hurricaneRisk: distribution(properties.map(p => p.hurricaneRisk)),
      seaLevelRisk: distribution(properties.map(p => p.seaLevelRisk)),
      wildfireRisk: distribution(properties.map(p => p.wildfireRisk)),
      earthquakeRisk: distribution(properties.map(p => p.earthquakeRisk)),
      tornadoRisk: distribution(properties.map(p => p.tornadoRisk)),
      violentCrime: distribution(properties.map(p => p.violentCrime)),
      propertyCrime: distribution(properties.map(p => p.propertyCrime)),
    },
    lifestyle: {
      walkScore: avg(properties.map(p => p.walkScore || 0)),
      transitScore: avg(properties.map(p => p.transitScore || 0)),
      bikeScore: avg(properties.map(p => p.bikeScore || 0)),
    },
    inventory: {
      total: properties.length,
      byType: distribution(properties.map(p => p.propertyType || 'Unknown')),
      byStatus: distribution(properties.map(p => p.listingStatus || 'Unknown')),
      priceBands: {
        under2M: properties.filter(p => p.listPrice < 2000000).length,
        '2to3M': properties.filter(p => p.listPrice >= 2000000 && p.listPrice < 3000000).length,
        '3to4M': properties.filter(p => p.listPrice >= 3000000 && p.listPrice < 4000000).length,
        over4M: properties.filter(p => p.listPrice >= 4000000).length,
      }
    },
    count: properties.length,
  };
}

// Calculate rankings for "best" cards
function calculateRankings(properties: Property[]) {
  if (properties.length === 0) return { bestCashflow: null, bestAppreciation: null, bestLifestyle: null, bestLowRisk: null };

  const sorted = {
    cashflow: [...properties].sort((a, b) => (b.capRate || 0) - (a.capRate || 0)),
    appreciation: [...properties].sort((a, b) => (b.appreciation5yr || 0) - (a.appreciation5yr || 0)),
    lifestyle: [...properties].sort((a, b) => ((b.walkScore || 0) + (b.transitScore || 0) + (b.bikeScore || 0)) - ((a.walkScore || 0) + (a.transitScore || 0) + (a.bikeScore || 0))),
    lowRisk: [...properties].sort((a, b) => {
      const aRisk = (a.floodRisk || 0) + (a.hurricaneRisk || 0) + (a.seaLevelRisk || 0);
      const bRisk = (b.floodRisk || 0) + (b.hurricaneRisk || 0) + (b.seaLevelRisk || 0);
      return aRisk - bRisk; // Lower is better
    }),
  };

  return {
    bestCashflow: sorted.cashflow[0] || null,
    bestAppreciation: sorted.appreciation[0] || null,
    bestLifestyle: sorted.lifestyle[0] || null,
    bestLowRisk: sorted.lowRisk[0] || null,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body: RequestBody = req.body;

    if (!body.properties || !Array.isArray(body.properties)) {
      return res.status(400).json({ error: 'Missing or invalid "properties" array in request body' });
    }

    const filters = body.filters || {};
    const allProperties = body.properties;
    const filteredProperties = filterProperties(allProperties, filters);

    const kpis = calculateKPIs(filteredProperties);
    const rankings = calculateRankings(filteredProperties);

    return res.status(200).json({
      success: true,
      filters: filters,
      kpis: kpis,
      rankings: rankings,
      properties: filteredProperties, // Return filtered properties for charts
      totalUnfiltered: allProperties.length,
      totalFiltered: filteredProperties.length,
    });

  } catch (error) {
    console.error('[BROKER-DASHBOARD] Error:', error);
    return res.status(500).json({
      success: false,
      error: String(error),
    });
  }
}
