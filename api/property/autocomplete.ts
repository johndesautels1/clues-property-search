/**
 * CLUES Property Search - Address Autocomplete API
 * Uses Google Places API for address suggestions
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input } = req.query;

  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'Input query required' });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });
  }

  // Target counties in Florida
  const TARGET_COUNTIES = [
    'Pinellas County',
    'Pasco County',
    'Manatee County',
    'Sarasota County',
    'Polk County',
    'Hernando County',
    'Hillsborough County',
    'Citrus County'
  ];

  try {
    // Use location bias for Tampa Bay area (center of target counties)
    // Latitude: 27.9506, Longitude: -82.4572 (Tampa)
    // Radius covers all 8 counties (~100km)
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&types=address&components=country:us&location=27.9506,-82.4572&radius=150000&strictbounds=false&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status === 'OK') {
      // Filter to only include addresses in target Florida counties
      const suggestions = data.predictions
        .filter((p: any) => {
          const desc = p.description || '';
          const secondary = p.structured_formatting?.secondary_text || '';
          const fullText = `${desc} ${secondary}`.toLowerCase();

          // Must be in Florida
          if (!fullText.includes('fl') && !fullText.includes('florida')) {
            return false;
          }

          // Check if in one of the target counties
          return TARGET_COUNTIES.some(county =>
            fullText.toLowerCase().includes(county.toLowerCase().replace(' county', ''))
          );
        })
        .map((p: any) => ({
          description: p.description,
          placeId: p.place_id,
          mainText: p.structured_formatting?.main_text,
          secondaryText: p.structured_formatting?.secondary_text,
        }));

      return res.status(200).json({ suggestions });
    } else {
      return res.status(200).json({ suggestions: [], status: data.status });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch suggestions', details: String(error) });
  }
}
