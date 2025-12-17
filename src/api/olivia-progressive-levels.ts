/**
 * OLIVIA PROGRESSIVE ANALYSIS - 4 INDEPENDENT LEVELS
 *
 * Instead of one massive 10+ minute call, we split into 4 separate callable functions.
 * Each completes in 1-2 minutes and returns immediately.
 * User sees results progressively and controls pacing.
 *
 * NO MORE TIMEOUTS!
 */

import Anthropic from '@anthropic-ai/sdk';
import type { OliviaEnhancedPropertyInput } from '@/types/olivia-enhanced';
import { buildLevelPrompt, buildAggregationPrompt } from './olivia-math-engine';

const OLIVIA_SYSTEM_PROMPT = `You are Olivia, CLUES™ Chief Property Intelligence Officer.

You are the world's leading property investment analyst with expertise in:
- Mathematical scoring and comparative analysis
- Real estate valuation and market trends
- Risk assessment and buyer profiling

CRITICAL RULES:
1. NEVER hallucinate or guess - only use provided data
2. ALWAYS show mathematical calculations with formulas
3. ALWAYS provide numerical proof for every score
4. Be honest about data quality and limitations
5. Return ONLY valid JSON (no markdown, no explanation)`;

export interface ProgressCallback {
  (message: string, current?: number, total?: number): void;
}

export interface LevelResult {
  level: number;
  fieldRange: [number, number];
  fieldComparisons: any[];
  timestamp: string;
  tokensUsed?: number;
}

export interface FinalAggregationResult {
  investmentGrade: any;
  sectionScores: any[];
  overallRecommendation: any;
  keyFindings: any[];
  buyerSpecificRecommendations: any;
  fieldComparisons?: any[]; // Will be injected
}

/**
 * LEVEL 1: Analyze Critical Decision Fields (1-56)
 *
 * These are the most important fields for investment decisions:
 * - Address, pricing, property basics
 * - HOA & taxes
 * - Structure & systems
 * - Interior/exterior features
 *
 * @param properties - Exactly 3 properties to compare
 * @param onProgress - Optional callback for progress updates
 * @returns 56 field comparisons with full mathematical proofs
 */
export async function analyzeLevelOne(
  properties: OliviaEnhancedPropertyInput[],
  onProgress?: ProgressCallback
): Promise<LevelResult> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY not configured');
  }

  if (properties.length !== 3) {
    throw new Error(`Level 1 requires exactly 3 properties. Received: ${properties.length}`);
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  console.log('📍 LEVEL 1/4: Starting Critical Decision Fields analysis (1-56)...');
  onProgress?.('Building Level 1 prompt...', 0, 56);

  const prompt = buildLevelPrompt(properties, 1);

  onProgress?.('Calling Claude Opus 4.5...', 5, 56);

  const stream = await client.messages.stream({
    model: 'claude-opus-4-20250514',
    max_tokens: 32000,
    temperature: 0.3,
    system: OLIVIA_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  let responseText = '';
  let fieldCount = 0;

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      responseText += chunk.delta.text;

      // Count fields as they appear in stream (rough estimate)
      const matches = responseText.match(/"fieldNumber":/g);
      const newCount = matches ? matches.length : 0;
      if (newCount > fieldCount) {
        fieldCount = newCount;
        onProgress?.(`Analyzing fields...`, fieldCount, 56);
      }
    }
  }

  onProgress?.('Parsing response...', 56, 56);

  // Parse response
  let cleanText = responseText.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  }

  const result = JSON.parse(cleanText);

  console.log(`✅ Level 1 Complete: ${result.fieldComparisons?.length || 0} fields analyzed`);

  return {
    level: 1,
    fieldRange: [1, 56],
    fieldComparisons: result.fieldComparisons || [],
    timestamp: new Date().toISOString()
  };
}

/**
 * LEVEL 2: Analyze Important Context Fields (57-112)
 *
 * Important but not critical fields:
 * - Permits & renovations
 * - Schools
 * - Location scores & distances
 * - Safety & crime
 * - Market & investment data
 * - Utilities
 *
 * @param properties - Exactly 3 properties to compare
 * @param onProgress - Optional callback for progress updates
 * @returns 56 field comparisons with full mathematical proofs
 */
export async function analyzeLevelTwo(
  properties: OliviaEnhancedPropertyInput[],
  onProgress?: ProgressCallback
): Promise<LevelResult> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY not configured');
  }

  if (properties.length !== 3) {
    throw new Error(`Level 2 requires exactly 3 properties. Received: ${properties.length}`);
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  console.log('📍 LEVEL 2/4: Starting Important Context Fields analysis (57-112)...');
  onProgress?.('Building Level 2 prompt...', 0, 56);

  const prompt = buildLevelPrompt(properties, 2);

  onProgress?.('Calling Claude Opus 4.5...', 5, 56);

  const stream = await client.messages.stream({
    model: 'claude-opus-4-20250514',
    max_tokens: 32000,
    temperature: 0.3,
    system: OLIVIA_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  let responseText = '';
  let fieldCount = 0;

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      responseText += chunk.delta.text;

      const matches = responseText.match(/"fieldNumber":/g);
      const newCount = matches ? matches.length : 0;
      if (newCount > fieldCount) {
        fieldCount = newCount;
        onProgress?.(`Analyzing fields...`, fieldCount, 56);
      }
    }
  }

  onProgress?.('Parsing response...', 56, 56);

  let cleanText = responseText.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  }

  const result = JSON.parse(cleanText);

  console.log(`✅ Level 2 Complete: ${result.fieldComparisons?.length || 0} fields analyzed`);

  return {
    level: 2,
    fieldRange: [57, 112],
    fieldComparisons: result.fieldComparisons || [],
    timestamp: new Date().toISOString()
  };
}

/**
 * LEVEL 3: Analyze Remaining Fields (113-168)
 *
 * Complete the analysis:
 * - Environment & risk
 * - Parking & building details
 * - Legal & compliance
 * - Waterfront
 * - Leasing & rentals
 * - Community features
 *
 * @param properties - Exactly 3 properties to compare
 * @param onProgress - Optional callback for progress updates
 * @returns 56 field comparisons with full mathematical proofs
 */
export async function analyzeLevelThree(
  properties: OliviaEnhancedPropertyInput[],
  onProgress?: ProgressCallback
): Promise<LevelResult> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY not configured');
  }

  if (properties.length !== 3) {
    throw new Error(`Level 3 requires exactly 3 properties. Received: ${properties.length}`);
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  console.log('📍 LEVEL 3/4: Starting Remaining Fields analysis (113-168)...');
  onProgress?.('Building Level 3 prompt...', 0, 56);

  const prompt = buildLevelPrompt(properties, 3);

  onProgress?.('Calling Claude Opus 4.5...', 5, 56);

  const stream = await client.messages.stream({
    model: 'claude-opus-4-20250514',
    max_tokens: 32000,
    temperature: 0.3,
    system: OLIVIA_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  let responseText = '';
  let fieldCount = 0;

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      responseText += chunk.delta.text;

      const matches = responseText.match(/"fieldNumber":/g);
      const newCount = matches ? matches.length : 0;
      if (newCount > fieldCount) {
        fieldCount = newCount;
        onProgress?.(`Analyzing fields...`, fieldCount, 56);
      }
    }
  }

  onProgress?.('Parsing response...', 56, 56);

  let cleanText = responseText.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  }

  const result = JSON.parse(cleanText);

  console.log(`✅ Level 3 Complete: ${result.fieldComparisons?.length || 0} fields analyzed`);

  return {
    level: 3,
    fieldRange: [113, 168],
    fieldComparisons: result.fieldComparisons || [],
    timestamp: new Date().toISOString()
  };
}

/**
 * LEVEL 4: Generate Executive Summary & Final Recommendations
 *
 * Aggregates results from Levels 1-3 into:
 * - 22 section scores
 * - Investment grades (A+ to F)
 * - Winner declaration
 * - Buyer-specific recommendations
 * - Key findings
 *
 * @param properties - The 3 properties that were analyzed
 * @param level1 - Results from Level 1
 * @param level2 - Results from Level 2
 * @param level3 - Results from Level 3
 * @param onProgress - Optional callback for progress updates
 * @returns Final aggregated analysis (fieldComparisons will be injected separately)
 */
export async function generateExecutiveSummary(
  properties: OliviaEnhancedPropertyInput[],
  level1: LevelResult,
  level2: LevelResult,
  level3: LevelResult,
  onProgress?: ProgressCallback
): Promise<FinalAggregationResult> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY not configured');
  }

  if (properties.length !== 3) {
    throw new Error(`Level 4 requires exactly 3 properties. Received: ${properties.length}`);
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  console.log('📍 LEVEL 4/4: Generating Executive Summary & Final Recommendations...');
  onProgress?.('Building aggregation prompt...', 0, 1);

  const prompt = buildAggregationPrompt(properties, level1, level2, level3);

  onProgress?.('Calling Claude Opus 4.5 for final aggregation...', 0, 1);

  const stream = await client.messages.stream({
    model: 'claude-opus-4-20250514',
    max_tokens: 32000,
    temperature: 0.3,
    system: OLIVIA_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  let responseText = '';

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      responseText += chunk.delta.text;
    }
  }

  onProgress?.('Parsing final results...', 1, 1);

  let cleanText = responseText.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  }

  const result = JSON.parse(cleanText);

  console.log(`✅ Level 4 Complete: Executive summary generated`);

  return result as FinalAggregationResult;
}
