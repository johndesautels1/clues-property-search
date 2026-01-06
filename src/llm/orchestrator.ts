/**
 * Two-Stage LLM Workflow Orchestrator
 *
 * Stage 1: Parallel micro-prompts (Perplexity with web search)
 *   - WalkScore, Crime, Climate, POI Distances
 *   - REMOVED: Schools (Google Places API), Utilities (search.ts), ISP (search.ts)
 *
 * Stage 2: Core schema normalizer (Claude Opus without web)
 *   - Receives all data (Stellar MLS, County, Paid APIs, Web Chunks)
 *   - Fills 181-field CMA schema with NO hallucination
 *
 * CRITICAL: This orchestrator RESPECTS the existing tier arbitration system
 * - Perplexity micro-prompts → Tier 4
 * - Claude Opus normalizer → Tier 5
 * - All fields pass through arbitrateField() for tier-based precedence
 */

import { callLlm } from '../services/llmClient.js';
import {
  WALK_SCORE_SYSTEM_PROMPT,
  WALK_SCORE_USER_TEMPLATE,
  // SCHOOLS - REMOVED (Google Places API handles schools)
  CRIME_SYSTEM_PROMPT,
  CRIME_USER_TEMPLATE,
  CLIMATE_SYSTEM_PROMPT,
  CLIMATE_USER_TEMPLATE,
  // UTILITIES - REMOVED (Redundant with search.ts utility searches)
  // ISP - REMOVED (Redundant with search.ts ISP searches)
  POI_DISTANCES_SYSTEM_PROMPT,
  POI_DISTANCES_USER_TEMPLATE,
} from './prompts/microPromptLibrary.js';
import {
  CORE_SCHEMA_SYSTEM_PROMPT,
  CORE_SCHEMA_USER_TEMPLATE,
} from './prompts/coreSchemaPrompt.js';
import { validateCmaSchema, CmaSchemaType } from './validation/cmaSchemas.js';

// ============================================
// MICRO-PROMPT EXECUTION
// ============================================

interface WebChunks {
  walkScore?: Record<string, any>;
  // schools - REMOVED (Google Places API handles schools)
  crime?: Record<string, any>;
  climate?: Record<string, any>;
  // utilities - REMOVED (Redundant with search.ts)
  // isp - REMOVED (Redundant with search.ts)
  poiDistances?: Record<string, any>;
}

/**
 * Get WalkScore data via Perplexity micro-prompt
 * Fields: 74-76 (walk_score, transit_score, bike_score)
 */
async function getWalkScoreChunk(address: string): Promise<Record<string, any>> {
  try {
    console.log('[Orchestrator] Calling WalkScore micro-prompt...');
    const result = await callLlm(
      {
        system: WALK_SCORE_SYSTEM_PROMPT,
        user: WALK_SCORE_USER_TEMPLATE(address),
        temperature: 0.1,
      },
      { useWebSearch: true } // Perplexity
    );
    console.log('[Orchestrator] WalkScore returned fields:', Object.keys(result || {}).length);
    return result || {};
  } catch (error) {
    console.error('[Orchestrator] WalkScore micro-prompt failed:', error);
    return {};
  }
}

// getSchoolsChunk - REMOVED (Google Places API handles schools)

/**
 * Get Crime data via Perplexity micro-prompt
 * Fields: 88-90 (violent_crime_index, property_crime_index, neighborhood_safety_rating)
 */
async function getCrimeChunk(address: string): Promise<Record<string, any>> {
  try {
    console.log('[Orchestrator] Calling Crime micro-prompt...');
    const result = await callLlm(
      {
        system: CRIME_SYSTEM_PROMPT,
        user: CRIME_USER_TEMPLATE(address),
        temperature: 0.1,
      },
      { useWebSearch: true } // Perplexity
    );
    console.log('[Orchestrator] Crime returned fields:', Object.keys(result || {}).length);
    return result || {};
  } catch (error) {
    console.error('[Orchestrator] Crime micro-prompt failed:', error);
    return {};
  }
}

/**
 * Get Climate/Environment data via Perplexity micro-prompt
 * Fields: 117-130 (air_quality, flood_zone, climate/wildfire/earthquake/hurricane/tornado/radon/sea level/solar risks)
 */
async function getClimateChunk(address: string): Promise<Record<string, any>> {
  try {
    console.log('[Orchestrator] Calling Climate micro-prompt...');
    const result = await callLlm(
      {
        system: CLIMATE_SYSTEM_PROMPT,
        user: CLIMATE_USER_TEMPLATE(address),
        temperature: 0.1,
      },
      { useWebSearch: true } // Perplexity
    );
    console.log('[Orchestrator] Climate returned fields:', Object.keys(result || {}).length);
    return result || {};
  } catch (error) {
    console.error('[Orchestrator] Climate micro-prompt failed:', error);
    return {};
  }
}

// getUtilitiesChunk - REMOVED (Redundant with search.ts utility searches)

// getIspChunk - REMOVED (Redundant with search.ts ISP searches)

/**
 * Get POI Distances data via Perplexity micro-prompt
 * Fields: 83-87 (distance to grocery, hospital, airport, park, beach)
 * Supplements Google Places API
 */
async function getPoiDistancesChunk(address: string): Promise<Record<string, any>> {
  try {
    console.log('[Orchestrator] Calling POI Distances micro-prompt...');
    const result = await callLlm(
      {
        system: POI_DISTANCES_SYSTEM_PROMPT,
        user: POI_DISTANCES_USER_TEMPLATE(address),
        temperature: 0.1,
      },
      { useWebSearch: true } // Perplexity
    );
    console.log('[Orchestrator] POI Distances returned fields:', Object.keys(result || {}).length);
    return result || {};
  } catch (error) {
    console.error('[Orchestrator] POI Distances micro-prompt failed:', error);
    return {};
  }
}

// ============================================
// MAIN ORCHESTRATOR
// ============================================

export interface BuildCmaSchemaInputs {
  address: string;
  stellarMlsJson: unknown;
  countyJson: unknown;
  paidApisJson: unknown;
}

/**
 * Build complete 181-field CMA schema using two-stage LLM workflow
 *
 * IMPORTANT: This function returns RAW data that must be passed through
 * the existing arbitration pipeline (createArbitrationPipeline) to enforce
 * tier-based precedence rules.
 *
 * @param inputs - Data from existing sources (Stellar MLS, County, Paid APIs)
 * @returns 181-field CMA schema ready for arbitration
 */
export async function buildCmaSchema(inputs: BuildCmaSchemaInputs): Promise<CmaSchemaType> {
  const { address, stellarMlsJson, countyJson, paidApisJson } = inputs;

  console.log('[Orchestrator] Starting two-stage LLM workflow...');
  console.log(`[Orchestrator] Address: ${address}`);

  // ================================================================
  // STAGE 1: Run all micro-prompts in parallel (Perplexity)
  // NOTE: Schools, Utilities, ISP removed (handled by Google/search.ts)
  // ================================================================
  console.log('[Orchestrator] STAGE 1: Running 4 micro-prompts in parallel...');

  const [walkScore, crime, climate, poiDistances] = await Promise.all([
    getWalkScoreChunk(address),
    // getSchoolsChunk - REMOVED (Google Places API handles schools)
    getCrimeChunk(address),
    getClimateChunk(address),
    // getUtilitiesChunk - REMOVED (Redundant with search.ts)
    // getIspChunk - REMOVED (Redundant with search.ts)
    getPoiDistancesChunk(address),
  ]);

  const webChunks: WebChunks = {
    walkScore,
    // schools - REMOVED (Google Places API handles schools)
    crime,
    climate,
    // utilities - REMOVED (Redundant with search.ts)
    // isp - REMOVED (Redundant with search.ts)
    poiDistances,
  };

  console.log('[Orchestrator] STAGE 1 complete. Web chunks retrieved:');
  console.log(`  - WalkScore: ${Object.keys(walkScore).length} fields`);
  console.log(`  - Crime: ${Object.keys(crime).length} fields`);
  console.log(`  - Climate: ${Object.keys(climate).length} fields`);
  console.log(`  - POI Distances: ${Object.keys(poiDistances).length} fields`);

  // ================================================================
  // STAGE 2: Call core schema normalizer (Claude Opus)
  // ================================================================
  console.log('[Orchestrator] STAGE 2: Calling core schema normalizer (Claude Opus)...');

  const system = CORE_SCHEMA_SYSTEM_PROMPT;
  const user = CORE_SCHEMA_USER_TEMPLATE({
    address,
    stellarMlsJson,
    countyJson,
    paidApisJson,
    webChunksJson: webChunks,
  });

  const rawSchema = await callLlm(
    {
      system,
      user,
      temperature: 0.1,
      maxTokens: 8000,
    },
    { useWebSearch: false } // Claude Opus (no web search)
  );

  console.log('[Orchestrator] STAGE 2 complete. Raw schema received.');

  // ================================================================
  // VALIDATION: Apply Zod schemas + forbidden word detection
  // ================================================================
  console.log('[Orchestrator] Applying validation layer (Zod + forbidden words)...');

  const validatedSchema = validateCmaSchema(rawSchema);

  console.log('[Orchestrator] Validation complete. Schema ready for arbitration.');
  console.log('[Orchestrator] ⚠️  IMPORTANT: This schema MUST be passed through createArbitrationPipeline() to enforce tier-based precedence!');

  return validatedSchema;
}

/**
 * Helper function to merge web chunks into single source object
 * Used when feeding Perplexity results into arbitration pipeline
 */
export function flattenWebChunks(webChunks: WebChunks): Record<string, any> {
  const flattened: Record<string, any> = {};

  for (const chunk of Object.values(webChunks)) {
    if (chunk) {
      Object.assign(flattened, chunk);
    }
  }

  return flattened;
}
