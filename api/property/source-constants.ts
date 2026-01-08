/**
 * Data Source Name Constants
 * SINGLE SOURCE OF TRUTH for source names across the application
 *
 * Used in:
 * - API responses (source_breakdown)
 * - Arbitration pipeline (addFieldsFromSource)
 * - Frontend progress tracking (data-sources.ts)
 * - Field source attribution
 */

export const STELLAR_MLS_SOURCE = 'Stellar MLS';
export const FBI_CRIME_SOURCE = 'FBI Crime';
export const TAVILY_SOURCE = 'Tavily';

// Tier 3 Sources
export const TIER_3_SOURCES = [
  'SchoolDigger',
  FBI_CRIME_SOURCE,
  'WalkScore',
  'FEMA Flood',
  'AirNow',
  'HowLoud',
  'Weather',
  'U.S. Census',
  TAVILY_SOURCE,
] as const;
