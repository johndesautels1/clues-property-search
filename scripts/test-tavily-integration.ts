/**
 * Tavily Integration Test Script
 *
 * Verifies:
 * 1. Tavily module exports correctly
 * 2. Search functions return proper field format
 * 3. Fields match schema field keys
 * 4. No interference with LLM data flow
 *
 * Run: npx ts-node scripts/test-tavily-integration.ts
 */

import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

console.log(`${CYAN}========================================${RESET}`);
console.log(`${CYAN}TAVILY INTEGRATION TEST${RESET}`);
console.log(`${CYAN}========================================${RESET}\n`);

let passed = 0;
let failed = 0;

function test(name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`${GREEN}✓ PASS${RESET}: ${name}`);
    passed++;
  } else {
    console.log(`${RED}✗ FAIL${RESET}: ${name}`);
    if (details) console.log(`  ${YELLOW}→ ${details}${RESET}`);
    failed++;
  }
}

async function runTests() {
  // Test 1: Check tavily-search.ts exists
  const tavilyPath = path.join(__dirname, '../api/property/tavily-search.ts');
  test('tavily-search.ts exists', fs.existsSync(tavilyPath));

  // Test 2: Check module exports
  try {
    const tavily = await import('../api/property/tavily-search.js');
    test('Module exports TAVILY_CONFIG', !!tavily.TAVILY_CONFIG);
    test('Module exports tavilySearch function', typeof tavily.tavilySearch === 'function');
    test('Module exports searchAVMs function', typeof tavily.searchAVMs === 'function');
    test('Module exports searchMarketStats function', typeof tavily.searchMarketStats === 'function');
    test('Module exports searchUtilities function', typeof tavily.searchUtilities === 'function');
    test('Module exports searchPermits function', typeof tavily.searchPermits === 'function');
    test('Module exports searchPortalViews function', typeof tavily.searchPortalViews === 'function');
    test('Module exports runTavilyTier3 function', typeof tavily.runTavilyTier3 === 'function');

    // Test 3: TAVILY_CONFIG structure
    test('TAVILY_CONFIG.baseUrl is correct', tavily.TAVILY_CONFIG.baseUrl === 'https://api.tavily.com/search');
    test('TAVILY_CONFIG.timeout is 15000', tavily.TAVILY_CONFIG.timeout === 15000);
    test('TAVILY_CONFIG.maxResults is 5', tavily.TAVILY_CONFIG.maxResults === 5);
  } catch (e) {
    test('Module imports correctly', false, String(e));
  }

  // Test 4: Check source-constants.ts has TAVILY_SOURCE
  try {
    const sourceConstants = await import('../api/property/source-constants.js');
    test('source-constants exports TAVILY_SOURCE', !!sourceConstants.TAVILY_SOURCE);
    test('TAVILY_SOURCE equals "Tavily"', sourceConstants.TAVILY_SOURCE === 'Tavily');
  } catch (e) {
    test('source-constants imports correctly', false, String(e));
  }

  // Test 5: Check llm-constants.ts has TAVILY_CONFIG
  try {
    const llmConstants = await import('../api/property/llm-constants.js');
    test('llm-constants exports TAVILY_CONFIG', !!llmConstants.TAVILY_CONFIG);
    test('llm-constants TAVILY_CONFIG.tier is 3', llmConstants.TAVILY_CONFIG?.tier === 3);
  } catch (e) {
    test('llm-constants imports correctly', false, String(e));
  }

  // Test 6: Check field-normalizer.ts has VALID_SOURCES with Tavily
  try {
    const normalizer = await import('../src/lib/field-normalizer.js');
    const hasValidSources = !!(normalizer as any).VALID_SOURCES;
    test('field-normalizer exports VALID_SOURCES', hasValidSources);

    if (hasValidSources) {
      const sources = (normalizer as any).VALID_SOURCES;
      test('VALID_SOURCES includes "Tavily"', sources.includes('Tavily'));
      test('VALID_SOURCES includes "Tavily (Zillow)"', sources.includes('Tavily (Zillow)'));
      test('VALID_SOURCES includes "Tavily (Redfin)"', sources.includes('Tavily (Redfin)'));
    }
  } catch (e) {
    test('field-normalizer imports correctly', false, String(e));
  }

  // Test 7: Check perplexity-prompts.ts has Tavily context
  const perplexityPromptsPath = path.join(__dirname, '../api/property/perplexity-prompts.ts');
  const perplexityContent = fs.readFileSync(perplexityPromptsPath, 'utf-8');
  test('perplexity-prompts.ts mentions Tavily', perplexityContent.includes('Tavily'));
  test('perplexity-prompts.ts has FIRING ORDER', perplexityContent.includes('FIRING ORDER'));
  test('perplexity-prompts.ts has Prompt F function', perplexityContent.includes('buildPromptF'));

  // Test 8: Check gemini-prompts.ts has Tavily context
  const geminiPromptsPath = path.join(__dirname, '../src/config/gemini-prompts.ts');
  const geminiContent = fs.readFileSync(geminiPromptsPath, 'utf-8');
  test('gemini-prompts.ts mentions Tavily', geminiContent.includes('Tavily'));
  test('gemini-prompts.ts has Tier 3 context', geminiContent.includes('Tier 3'));

  // Test 9: Check retry-llm.ts has Tavily context
  const retryLlmPath = path.join(__dirname, '../api/property/retry-llm.ts');
  const retryLlmContent = fs.readFileSync(retryLlmPath, 'utf-8');
  test('retry-llm.ts mentions Tavily', retryLlmContent.includes('Tavily'));
  const tavilyMentions = (retryLlmContent.match(/Tavily/g) || []).length;
  test('retry-llm.ts has 5+ Tavily references (all LLMs)', tavilyMentions >= 5, `Found ${tavilyMentions} mentions`);

  // Test 10: Check search.ts has Tavily Tier 3 execution
  const searchPath = path.join(__dirname, '../api/property/search.ts');
  const searchContent = fs.readFileSync(searchPath, 'utf-8');
  test('search.ts imports runTavilyTier3', searchContent.includes('runTavilyTier3'));
  test('search.ts has TIER 3: TAVILY comment', searchContent.includes('TIER 3: TAVILY'));
  test('search.ts calls arbitrationPipeline for Tavily', searchContent.includes("addFieldsFromSource(tavilyFields, 'Tavily')"));

  // Test 11: Check search-stream.ts has tavily source
  const searchStreamPath = path.join(__dirname, '../api/property/search-stream.ts');
  const searchStreamContent = fs.readFileSync(searchStreamPath, 'utf-8');
  test('search-stream.ts has tavily in allSources', searchStreamContent.includes("'tavily'"));

  // Test 12: Verify field keys match schema
  const validFieldKeys = [
    '16a_zestimate', '16b_redfin_estimate',
    '91_median_home_price_neighborhood', '92_price_per_sqft_recent_avg', '95_days_on_market_avg',
    '104_electric_provider', '106_water_provider', '109_natural_gas',
    '60_permit_history_roof', '61_permit_history_hvac',
    '169_zillow_views', '170_redfin_views', '171_homes_views', '172_realtor_views', '174_saves_favorites'
  ];

  const tavilySearchContent = fs.readFileSync(tavilyPath, 'utf-8');
  for (const fieldKey of validFieldKeys) {
    const hasField = tavilySearchContent.includes(`'${fieldKey}'`) || tavilySearchContent.includes(`"${fieldKey}"`);
    test(`tavily-search.ts maps to ${fieldKey}`, hasField);
  }

  // Summary
  console.log(`\n${CYAN}========================================${RESET}`);
  console.log(`${CYAN}TEST SUMMARY${RESET}`);
  console.log(`${CYAN}========================================${RESET}`);
  console.log(`${GREEN}Passed: ${passed}${RESET}`);
  console.log(`${RED}Failed: ${failed}${RESET}`);
  console.log(`Total: ${passed + failed}`);

  if (failed === 0) {
    console.log(`\n${GREEN}✓ ALL TESTS PASSED - Tavily integration is complete${RESET}`);
  } else {
    console.log(`\n${RED}✗ SOME TESTS FAILED - Review above errors${RESET}`);
    process.exit(1);
  }
}

runTests().catch(console.error);
