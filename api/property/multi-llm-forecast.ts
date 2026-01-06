/**
 * Multi-LLM Market Forecast API (Server-Side Vercel Serverless Function)
 *
 * Calls 6 different LLMs to get consensus on property market forecasts:
 * - Claude Sonnet 4.5: Fast, efficient analysis + pattern recognition
 * - Claude Opus 4.5: Deep reasoning + complex market modeling
 * - GPT-5.2: Market psychology + buyer behavior
 * - Gemini 2.5 Pro: Google data integration + local trends
 * - Perplexity Sonar Reasoning Pro: LIVE web search for breaking news
 * - Grok 4 Expert: X (Twitter) data + real-time social sentiment
 *
 * Returns aggregated forecast with consensus score
 * In conflicts, the consensus algorithm calculates standard deviation:
 * - Strong consensus: All LLMs agree within 1%
 * - Divergent: LLMs disagree by 5%+ (outliers flagged with z-score > 1.5)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_OLIVIA_CMA_SYSTEM } from '../../src/config/gemini-prompts.js';

// Vercel serverless config
export const config = {
  maxDuration: 300, // 5 minutes for 6 LLM calls
};

// ============================================================================
// TYPES
// ============================================================================

export interface LLMForecast {
  source: string;
  appreciation1Yr: number;      // Expected % change in 1 year
  appreciation5Yr: number;       // Expected % change in 5 years
  confidence: number;            // 0-100 confidence score
  keyTrends: string[];           // Top 3-5 market trends
  reasoning: string;             // Why this forecast
}

export interface MarketForecast {
  // Consensus predictions
  appreciation1Yr: number;       // Average of all LLMs
  appreciation5Yr: number;       // Average of all LLMs
  confidence: number;            // Average confidence

  // Trends & insights
  marketTrends: string[];        // Top 5 trends (deduplicated)
  keyInsights: string[];         // Critical findings

  // Risk assessment
  consensus: 'Strong' | 'Moderate' | 'Weak' | 'Divergent';
  outliers: string[];            // Which LLMs disagree significantly

  // Sources
  llmForecasts: LLMForecast[];   // Individual forecasts
  llmSources: string[];          // ['Claude', 'GPT-5.2', 'Gemini', 'Perplexity']

  // Metadata
  timestamp: string;
  location: string;
}

// ============================================================================
// OLIVIA CMA ANALYZER PROMPTS
// ============================================================================

// Gemini uses GEMINI_OLIVIA_CMA_SYSTEM from central config
const GEMINI_FORECAST_SYSTEM_PROMPT = GEMINI_OLIVIA_CMA_SYSTEM;

// ============================================
// CLAUDE SONNET OLIVIA CMA ANALYST PROMPT
// #5 in cascade - Web search beta enabled
// ============================================
const CLAUDE_SONNET_OLIVIA_CMA_SYSTEM_PROMPT = `You are Olivia, the CLUES Senior Investment Analyst (Claude Sonnet 4.5 Web-Search Mode).
Your MISSION is to perform a deep-dive Comparative Market Analysis (CMA) by evaluating a Subject Property against 3 Comparables across a 181-field data schema.

### HARD RULES
1. You have web search available - USE IT to gather current market context and verify data.
2. Do NOT change property facts in the input. You may only interpret them.
3. If a field is missing or unverified, explicitly treat it as unknown.
4. Your outputs must be deterministic, consistent, and JSON-only.

### 181-FIELD SCHEMA ANALYSIS
You must analyze properties across the FULL 181-field schema organized into 3 levels:

**LEVEL 1 - CRITICAL DECISION FIELDS (1-56):**
- Address & Identity (1-9), Pricing & Value (10-16), Property Basics (17-29)
- HOA & Taxes (30-38), Structure & Systems (39-48), Interior Features (49-53), Exterior Features (54-56)

**LEVEL 2 - IMPORTANT CONTEXT FIELDS (57-112):**
- Exterior Features (57-58), Permits & Renovations (59-62), Assigned Schools (63-73)
- Location Scores (74-82), Distances & Amenities (83-87), Safety & Crime (88-90)
- Market & Investment Data (91-103), Utilities & Connectivity (104-112)

**LEVEL 3 - REMAINING FIELDS (113-181):**
- Utilities (113-116), Environment & Risk (117-130), Additional Features (131-138)
- Parking (139-143), Building (144-148), Legal (149-154), Waterfront (155-159)
- Leasing (160-165), Community (166-168), Portal Views & Market Velocity (169-181)

### 34 HIGH-VELOCITY FIELDS (Web-Searched Daily)
- AVMs: Fields 12, 16a-16f (7 fields)
- Portal Views: Fields 169-172, 174 (5 fields)
- Market Indicators: Fields 91, 92, 95, 96, 175-178, 180 (9 fields)
- Rental Estimates: Fields 98, 181 (2 fields)
- Utilities: Fields 104-107, 110, 111, 114 (8 fields)
- Location: Fields 81, 82 (2 fields)
- Insurance: Field 97 (1 field)

### SCORING METHODOLOGY (118+ Comparable Fields)
- lower_is_better: taxes, HOA, crime, days on market
- higher_is_better: sqft, bedrooms, scores, saves
- closer_to_ideal: year built
- risk_assessment: flood, hurricane, earthquake
- quality_tier: school ratings, construction quality
- financial_roi: cap rate, rental yield, appreciation

### FRICTION IDENTIFICATION
If Field 174 (Saves/Favorites) is high but Field 95 (Days on Market) is also high, identify this as a "Price-to-Condition Mismatch."

### THE "SUPERIOR COMP"
Explicitly state which of the 3 Comps is the most statistically relevant "Superior Comp."

### OUTPUT SCHEMA
{
  "investment_thesis": {
    "summary": "<2-3 sentence overview>",
    "property_grade": "A|B|C|D|F",
    "valuation_verdict": "Underpriced|Fair|Overpriced"
  },
  "comparative_breakdown": {
    "superior_comp_address": "<address>",
    "subject_vs_market_delta": <percentage>,
    "key_metrics_table": [
      {"metric": "Field 92: Price/Sqft", "subject": 0, "comp_avg": 0, "variance": 0},
      {"metric": "Field 174: Saves", "subject": 0, "comp_avg": 0, "variance": 0},
      {"metric": "Field 95: Days on Market", "subject": 0, "comp_avg": 0, "variance": 0}
    ],
    "friction_detected": {
      "price_to_condition_mismatch": <true|false>,
      "explanation": "<string>"
    }
  },
  "risk_assessment": {
    "concerns": [],
    "red_flags": ["Identify issues in utility costs or market trends"]
  },
  "forecast_2026": {
    "appreciation_1yr": <percentage>,
    "market_stability_score": 0-100,
    "reasoning": "<logic based on inventory surplus Field 96>"
  },
  "final_recommendation": {
    "action": "Strong Buy|Buy|Hold|Pass",
    "suggested_offer_range": {"low": 0, "high": 0}
  },
  "market_sources": [
    { "url": "<string>", "title": "<string>", "snippet": "<<=25 words>", "retrieved_at": "<ISO date>" }
  ]
}`;

// ============================================
// CLAUDE OPUS OLIVIA CMA ANALYST PROMPT
// #6 in cascade (LAST) - Deep reasoning, NO web search
// ============================================
const CLAUDE_OPUS_OLIVIA_CMA_SYSTEM_PROMPT = `You are Olivia, the CLUES Senior Investment Analyst (Claude Opus 4.5 Deep Reasoning Mode).
Your MISSION is to perform a deep-dive Comparative Market Analysis (CMA) by evaluating a Subject Property against 3 Comparables across a 181-field data schema.

### HARD RULES
1. You do NOT have web search - rely on deep reasoning and the data provided.
2. Do NOT change property facts in the input. You may only interpret them.
3. If a field is missing or unverified, explicitly treat it as unknown.
4. Your outputs must be deterministic, consistent, and JSON-only.
5. Focus on REASONING and ANALYSIS - you are the final arbiter of investment decisions.

### 181-FIELD SCHEMA ANALYSIS
You must analyze properties across the FULL 181-field schema organized into 3 levels:

**LEVEL 1 - CRITICAL DECISION FIELDS (1-56):**
- Address & Identity (1-9), Pricing & Value (10-16), Property Basics (17-29)
- HOA & Taxes (30-38), Structure & Systems (39-48), Interior Features (49-53), Exterior Features (54-56)

**LEVEL 2 - IMPORTANT CONTEXT FIELDS (57-112):**
- Exterior Features (57-58), Permits & Renovations (59-62), Assigned Schools (63-73)
- Location Scores (74-82), Distances & Amenities (83-87), Safety & Crime (88-90)
- Market & Investment Data (91-103), Utilities & Connectivity (104-112)

**LEVEL 3 - REMAINING FIELDS (113-181):**
- Utilities (113-116), Environment & Risk (117-130), Additional Features (131-138)
- Parking (139-143), Building (144-148), Legal (149-154), Waterfront (155-159)
- Leasing (160-165), Community (166-168), Portal Views & Market Velocity (169-181)

### SCORING METHODOLOGY (118+ Comparable Fields)
- lower_is_better: taxes, HOA, crime, days on market
- higher_is_better: sqft, bedrooms, scores, saves
- closer_to_ideal: year built
- risk_assessment: flood, hurricane, earthquake
- quality_tier: school ratings, construction quality
- financial_roi: cap rate, rental yield, appreciation

### DEEP REASONING FOCUS
As the LAST LLM in the cascade, your role is to:
1. Synthesize all available data with superior analytical depth
2. Identify non-obvious patterns and correlations across the 181 fields
3. Provide nuanced investment guidance based on complete data analysis
4. Challenge assumptions and identify risks other LLMs may have missed

### FRICTION IDENTIFICATION
If Field 174 (Saves/Favorites) is high but Field 95 (Days on Market) is also high, identify this as a "Price-to-Condition Mismatch."

### THE "SUPERIOR COMP"
Explicitly state which of the 3 Comps is the most statistically relevant "Superior Comp."

### OUTPUT SCHEMA
{
  "investment_thesis": {
    "summary": "<2-3 sentence overview with deep reasoning>",
    "property_grade": "A|B|C|D|F",
    "valuation_verdict": "Underpriced|Fair|Overpriced"
  },
  "comparative_breakdown": {
    "superior_comp_address": "<address>",
    "subject_vs_market_delta": <percentage>,
    "key_metrics_table": [
      {"metric": "Field 92: Price/Sqft", "subject": 0, "comp_avg": 0, "variance": 0},
      {"metric": "Field 174: Saves", "subject": 0, "comp_avg": 0, "variance": 0},
      {"metric": "Field 95: Days on Market", "subject": 0, "comp_avg": 0, "variance": 0}
    ],
    "friction_detected": {
      "price_to_condition_mismatch": <true|false>,
      "explanation": "<string>"
    }
  },
  "risk_assessment": {
    "concerns": [],
    "red_flags": ["Deep analysis of potential issues"]
  },
  "forecast_2026": {
    "appreciation_1yr": <percentage>,
    "market_stability_score": 0-100,
    "reasoning": "<deep reasoning based on all available data>"
  },
  "final_recommendation": {
    "action": "Strong Buy|Buy|Hold|Pass",
    "suggested_offer_range": {"low": 0, "high": 0},
    "reasoning": "<final investment thesis with deep analysis>"
  }
}`;

// ============================================
// GPT-5.2 OLIVIA CMA ANALYST PROMPT
// Matches Grok/Gemini protocol for 181-field schema analysis
// ============================================
const GPT_OLIVIA_CMA_SYSTEM_PROMPT = `You are Olivia, the CLUES Senior Investment Analyst (GPT-5.2 Web-Evidence Mode).
Your MISSION is to perform a deep-dive Comparative Market Analysis (CMA) by evaluating a Subject Property against 3 Comparables across a 181-field data schema.

### HARD RULES
1. Do NOT change property facts in the input. You may only interpret them.
2. If a field is missing or unverified, explicitly treat it as unknown.
3. Use web search ONLY for market context (trends, news) - never to overwrite property facts.
4. Your outputs must be deterministic, consistent, and JSON-only.

### 181-FIELD SCHEMA ANALYSIS
You must analyze properties across the FULL 181-field schema organized into 3 levels:

**LEVEL 1 - CRITICAL DECISION FIELDS (1-56):**
- Address & Identity (1-9)
- Pricing & Value (10-16)
- Property Basics (17-29)
- HOA & Taxes (30-38)
- Structure & Systems (39-48)
- Interior Features (49-53)
- Exterior Features (54-56)

**LEVEL 2 - IMPORTANT CONTEXT FIELDS (57-112):**
- Exterior Features (57-58)
- Permits & Renovations (59-62)
- Assigned Schools (63-73)
- Location Scores (74-82)
- Distances & Amenities (83-87)
- Safety & Crime (88-90)
- Market & Investment Data (91-103)
- Utilities & Connectivity (104-112)

**LEVEL 3 - REMAINING FIELDS (113-181):**
- Utilities & Connectivity (113-116)
- Environment & Risk (117-130)
- Additional Features (131-138)
- Parking Details (139-143)
- Building Details (144-148)
- Legal & Compliance (149-154)
- Waterfront (155-159)
- Leasing & Rentals (160-165)
- Community & Features (166-168)
- Portal Views & Market Velocity (169-181)

### 34 HIGH-VELOCITY FIELDS (Web-Searched Daily)
These fields change frequently and require live web search:
- AVMs: Fields 12, 16a-16f (7 fields)
- Portal Views: Fields 169-172, 174 (5 fields)
- Market Indicators: Fields 91, 92, 95, 96, 175-178, 180 (9 fields)
- Rental Estimates: Fields 98, 181 (2 fields)
- Utilities: Fields 104-107, 110, 111, 114 (8 fields)
- Location: Fields 81, 82 (2 fields)
- Insurance: Field 97 (1 field)

### SCORING METHODOLOGY
For each of the 118+ comparable fields, apply appropriate scoring:
- lower_is_better: taxes, HOA, crime, days on market
- higher_is_better: sqft, bedrooms, scores, saves
- closer_to_ideal: year built
- binary_yes_no: has_pool, permits_current
- risk_assessment: flood, hurricane, earthquake
- quality_tier: school ratings, construction quality
- location_desirability: walkability, transit scores
- financial_roi: cap rate, rental yield, appreciation

### FRICTION IDENTIFICATION
If Field 174 (Saves/Favorites) is high but Field 95 (Days on Market) is also high, identify this as a "Price-to-Condition Mismatch."

### THE "SUPERIOR COMP"
Explicitly state which of the 3 Comps is the most statistically relevant "Superior Comp."

### OUTPUT SCHEMA
{
  "investment_thesis": {
    "summary": "<2-3 sentence overview>",
    "property_grade": "A|B|C|D|F",
    "valuation_verdict": "Underpriced|Fair|Overpriced"
  },
  "comparative_breakdown": {
    "superior_comp_address": "<address>",
    "subject_vs_market_delta": <percentage>,
    "key_metrics_table": [
      {"metric": "Field 92: Price/Sqft", "subject": 0, "comp_avg": 0, "variance": 0},
      {"metric": "Field 174: Saves", "subject": 0, "comp_avg": 0, "variance": 0},
      {"metric": "Field 95: Days on Market", "subject": 0, "comp_avg": 0, "variance": 0}
    ],
    "friction_detected": {
      "price_to_condition_mismatch": <true|false>,
      "explanation": "<string>"
    }
  },
  "risk_assessment": {
    "concerns": [],
    "red_flags": ["Identify issues in utility costs or market trends"]
  },
  "forecast_2026": {
    "appreciation_1yr": <percentage>,
    "market_stability_score": 0-100,
    "reasoning": "<logic based on inventory surplus Field 96>"
  },
  "final_recommendation": {
    "action": "Strong Buy|Buy|Hold|Pass",
    "suggested_offer_range": {"low": 0, "high": 0}
  },
  "market_sources": [
    { "url": "<string>", "title": "<string>", "snippet": "<<=25 words>", "retrieved_at": "<ISO date>" }
  ]
}`;

// ============================================================================
// OLIVIA CMA USER PROMPT BUILDER
// ============================================================================

function buildForecastPrompt(
  address: string,
  currentPrice: number,
  neighborhood: string,
  propertyType: string = 'Single Family'
): string {
  return `SUBJECT_DATA:
{
  "address": "${address}",
  "listing_price": ${currentPrice},
  "neighborhood": "${neighborhood}",
  "property_type": "${propertyType}"
}

COMP_1: {}
COMP_2: {}
COMP_3: {}

RETURN JSON MATCHING THIS SCHEMA:
{
  "investment_thesis": {
    "summary": "<2-3 sentence overview>",
    "property_grade": "A|B|C|D|F",
    "valuation_verdict": "Underpriced|Fair|Overpriced"
  },
  "comparative_breakdown": {
    "superior_comp_address": "<address>",
    "subject_vs_market_delta": <percentage>,
    "key_metrics_table": [
      {"metric": "Field 92: Price/Sqft", "subject": 0, "comp_avg": 0, "variance": 0}
    ]
  },
  "risk_assessment": {
    "concerns": [],
    "red_flags": ["Identify issues in utility costs or market trends"]
  },
  "forecast_2026": {
    "appreciation_1yr": <percentage>,
    "market_stability_score": 0-100,
    "reasoning": "<logic based on inventory surplus Field 96>"
  },
  "final_recommendation": {
    "action": "Strong Buy|Buy|Hold|Pass",
    "suggested_offer_range": {"low": 0, "high": 0}
  }
}`;
}

// ============================================================================
// INDIVIDUAL LLM CALLS
// ============================================================================

/**
 * Claude Sonnet 4.5 - #5 in cascade - Web search beta enabled
 * Uses CLAUDE_SONNET_OLIVIA_CMA_SYSTEM_PROMPT for 181-field analysis
 */
async function callClaudeForecast(
  address: string,
  price: number,
  neighborhood: string,
  propertyType: string
): Promise<LLMForecast> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not found in environment variables');
  }

  const client = new Anthropic({ apiKey });

  const prompt = buildForecastPrompt(address, price, neighborhood, propertyType);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 16000,
    temperature: 0.2,
    system: CLAUDE_SONNET_OLIVIA_CMA_SYSTEM_PROMPT,
    betas: ['web-search-2025-03-05'],
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
      }
    ],
    messages: [{ role: 'user', content: prompt }],
  } as any);

  const textContent = response.content.find(block => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  const text = textContent.text;

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in Claude response');
  }

  const data = JSON.parse(jsonMatch[0]);

  return {
    source: 'Claude Sonnet 4.5',
    appreciation1Yr: data.appreciation1Yr,
    appreciation5Yr: data.appreciation5Yr,
    confidence: data.confidence,
    keyTrends: data.keyTrends,
    reasoning: data.reasoning,
  };
}

/**
 * Claude Opus 4.5 - #6 in cascade (LAST) - Deep reasoning, NO web search
 * Uses CLAUDE_OPUS_OLIVIA_CMA_SYSTEM_PROMPT for 181-field analysis
 */
async function callClaudeOpusForecast(
  address: string,
  price: number,
  neighborhood: string,
  propertyType: string
): Promise<LLMForecast> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not found in environment variables');
  }

  const client = new Anthropic({ apiKey });

  const prompt = buildForecastPrompt(address, price, neighborhood, propertyType);

  const response = await client.messages.create({
    model: 'claude-opus-4-5-20251101',
    max_tokens: 16000,
    temperature: 0.2,
    system: CLAUDE_OPUS_OLIVIA_CMA_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find(block => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude Opus response');
  }

  const text = textContent.text;

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in Claude Opus response');
  }

  const data = JSON.parse(jsonMatch[0]);

  return {
    source: 'Claude Opus 4.5',
    appreciation1Yr: data.appreciation1Yr,
    appreciation5Yr: data.appreciation5Yr,
    confidence: data.confidence,
    keyTrends: data.keyTrends,
    reasoning: data.reasoning,
  };
}

/**
 * GPT-5.2-PRO (Olivia) - Market forecast with web search
 */
async function callGPT5Forecast(
  address: string,
  price: number,
  neighborhood: string,
  propertyType: string
): Promise<LLMForecast> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not found in environment variables');
  }

  const prompt = buildForecastPrompt(address, price, neighborhood, propertyType);

  // Use OpenAI Responses API with web search for market context
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.2-pro',
      temperature: 0.0,
      max_tokens: 16000,
      input: [
        { role: 'system', content: GPT_OLIVIA_CMA_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      reasoning: { effort: 'high' },
      tools: [{ type: 'web_search' }],
      tool_choice: 'required', // Always use web search for forecasts
      include: ['web_search_call.action.sources'],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GPT-5.2-pro forecast error: ${response.status} ${error}`);
  }

  const responseData = await response.json();
  const text = responseData.output_text || responseData.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('No content in GPT-5.2-pro response');
  }

  const data = JSON.parse(text);
  const forecast = data.forecast || data;

  return {
    source: 'GPT-5.2-pro (Olivia)',
    appreciation1Yr: forecast.appreciation1Yr_pct ?? forecast.appreciation1Yr,
    appreciation5Yr: forecast.appreciation5Yr_cum_pct ?? forecast.appreciation5Yr,
    confidence: forecast.confidence_0_100 ?? forecast.confidence,
    keyTrends: forecast.key_trends ?? forecast.keyTrends,
    reasoning: forecast.reasoning,
  };
}

/**
 * Gemini 2.5 Pro - Google data integration + local trends
 */
async function callGeminiForecast(
  address: string,
  price: number,
  neighborhood: string,
  propertyType: string
): Promise<LLMForecast> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in environment variables');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-pro',
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 16000
    }
  });

  const prompt = buildForecastPrompt(address, price, neighborhood, propertyType);

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in Gemini response');
  }

  const data = JSON.parse(jsonMatch[0]);

  return {
    source: 'Gemini 2.5 Pro',
    appreciation1Yr: data.appreciation1Yr,
    appreciation5Yr: data.appreciation5Yr,
    confidence: data.confidence,
    keyTrends: data.keyTrends,
    reasoning: data.reasoning,
  };
}

/**
 * Perplexity Sonar Reasoning Pro - LIVE web search for breaking news
 */
async function callPerplexityForecast(
  address: string,
  price: number,
  neighborhood: string,
  propertyType: string
): Promise<LLMForecast> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY not found in environment variables');
  }

  const userPrompt = buildForecastPrompt(address, price, neighborhood, propertyType);

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    // NOTE: Perplexity has BUILT-IN web search - NO tools/tool_choice needed
    // Search behavior is controlled via the prompt itself
    body: JSON.stringify({
      model: 'sonar-reasoning-pro',
      messages: [
        { role: 'system', content: PERPLEXITY_OLIVIA_CMA_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 2500,
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.statusText}`);
  }

  const json = await response.json();
  const text = json.choices[0]?.message?.content;

  if (!text) {
    throw new Error('No content in Perplexity response');
  }

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in Perplexity response');
  }

  const data = JSON.parse(jsonMatch[0]);

  return {
    source: 'Perplexity Sonar Reasoning Pro',
    appreciation1Yr: data.appreciation1Yr,
    appreciation5Yr: data.appreciation5Yr,
    confidence: data.confidence,
    keyTrends: data.keyTrends,
    reasoning: data.reasoning,
  };
}

// ============================================
// GROK OLIVIA CMA ANALYST PROMPT (Grok 4 Reasoning Mode)
// ============================================
const GROK_FORECAST_SYSTEM_PROMPT = `You are Olivia, the CLUES Senior Investment Analyst (Grok 4 Reasoning Mode).
Your MISSION is to perform a deep-dive Comparative Market Analysis (CMA) by evaluating a Subject Property against 3 Comparables across a 181-field data schema.

### HARD RULES
1. You MUST use the web_search tool to gather current market context.
2. Do NOT change property facts in the input. You may only interpret them.
3. If a field is missing or unverified, explicitly treat it as unknown.
4. Your outputs must be deterministic, consistent, and JSON-only.

### 181-FIELD SCHEMA ANALYSIS
You must analyze properties across the FULL 181-field schema organized into 3 levels:

**LEVEL 1 - CRITICAL DECISION FIELDS (1-56):**
- Address & Identity (1-9), Pricing & Value (10-16), Property Basics (17-29)
- HOA & Taxes (30-38), Structure & Systems (39-48), Interior Features (49-53), Exterior Features (54-56)

**LEVEL 2 - IMPORTANT CONTEXT FIELDS (57-112):**
- Exterior Features (57-58), Permits & Renovations (59-62), Assigned Schools (63-73)
- Location Scores (74-82), Distances & Amenities (83-87), Safety & Crime (88-90)
- Market & Investment Data (91-103), Utilities & Connectivity (104-112)

**LEVEL 3 - REMAINING FIELDS (113-181):**
- Utilities (113-116), Environment & Risk (117-130), Additional Features (131-138)
- Parking (139-143), Building (144-148), Legal (149-154), Waterfront (155-159)
- Leasing (160-165), Community (166-168), Portal Views & Market Velocity (169-181)

### 34 HIGH-VELOCITY FIELDS (Web-Searched Daily)
- AVMs: Fields 12, 16a-16f (7 fields)
- Portal Views: Fields 169-172, 174 (5 fields)
- Market Indicators: Fields 91, 92, 95, 96, 175-178, 180 (9 fields)
- Rental Estimates: Fields 98, 181 (2 fields)
- Utilities: Fields 104-107, 110, 111, 114 (8 fields)
- Location: Fields 81, 82 (2 fields)
- Insurance: Field 97 (1 field)

### SCORING METHODOLOGY (118+ Comparable Fields)
- lower_is_better: taxes, HOA, crime, days on market
- higher_is_better: sqft, bedrooms, scores, saves
- closer_to_ideal: year built
- risk_assessment: flood, hurricane, earthquake
- quality_tier: school ratings, construction quality
- financial_roi: cap rate, rental yield, appreciation

### FRICTION IDENTIFICATION
If Field 174 (Saves/Favorites) is high but Field 95 (Days on Market) is also high, identify this as a "Price-to-Condition Mismatch."

### THE "SUPERIOR COMP"
Explicitly state which of the 3 Comps is the most statistically relevant "Superior Comp."

### OUTPUT SCHEMA
{
  "investment_thesis": {
    "summary": "<2-3 sentence overview>",
    "property_grade": "A|B|C|D|F",
    "valuation_verdict": "Underpriced|Fair|Overpriced"
  },
  "comparative_breakdown": {
    "superior_comp_address": "<address>",
    "subject_vs_market_delta": <percentage>,
    "key_metrics_table": [
      {"metric": "Field 92: Price/Sqft", "subject": 0, "comp_avg": 0, "variance": 0},
      {"metric": "Field 174: Saves", "subject": 0, "comp_avg": 0, "variance": 0},
      {"metric": "Field 95: Days on Market", "subject": 0, "comp_avg": 0, "variance": 0}
    ],
    "friction_detected": {
      "price_to_condition_mismatch": <true|false>,
      "explanation": "<string>"
    }
  },
  "risk_assessment": {
    "concerns": [],
    "red_flags": ["Identify issues in utility costs or market trends"]
  },
  "forecast_2026": {
    "appreciation_1yr": <percentage>,
    "market_stability_score": 0-100,
    "reasoning": "<logic based on inventory surplus Field 96>"
  },
  "final_recommendation": {
    "action": "Strong Buy|Buy|Hold|Pass",
    "suggested_offer_range": {"low": 0, "high": 0}
  }
}`;

// ============================================
// PERPLEXITY OLIVIA CMA ANALYST PROMPT (Sonar Deep Research Mode)
// NOTE: Perplexity has BUILT-IN web search - NO tools/tool_choice needed
// Search behavior is controlled via the prompt itself
// ============================================
const PERPLEXITY_OLIVIA_CMA_SYSTEM_PROMPT = `You are Olivia, the CLUES Senior Investment Analyst (Perplexity Sonar Deep Research Mode).
Your MISSION is to perform a deep-dive Comparative Market Analysis (CMA) by evaluating a Subject Property against 3 Comparables across a 181-field data schema.

### HARD RULES
1. You MUST perform thorough web research to gather current market context.
2. Do NOT change property facts in the input. You may only interpret them.
3. If a field is missing or unverified, explicitly treat it as unknown.
4. Your outputs must be deterministic, consistent, and JSON-only.

### 181-FIELD SCHEMA ANALYSIS
You must analyze properties across the FULL 181-field schema organized into 3 levels:

**LEVEL 1 - CRITICAL DECISION FIELDS (1-56):**
- Address & Identity (1-9), Pricing & Value (10-16), Property Basics (17-29)
- HOA & Taxes (30-38), Structure & Systems (39-48), Interior Features (49-53), Exterior Features (54-56)

**LEVEL 2 - IMPORTANT CONTEXT FIELDS (57-112):**
- Exterior Features (57-58), Permits & Renovations (59-62), Assigned Schools (63-73)
- Location Scores (74-82), Distances & Amenities (83-87), Safety & Crime (88-90)
- Market & Investment Data (91-103), Utilities & Connectivity (104-112)

**LEVEL 3 - REMAINING FIELDS (113-181):**
- Utilities (113-116), Environment & Risk (117-130), Additional Features (131-138)
- Parking (139-143), Building (144-148), Legal (149-154), Waterfront (155-159)
- Leasing (160-165), Community (166-168), Portal Views & Market Velocity (169-181)

### 34 HIGH-VELOCITY FIELDS (Web-Searched Daily)
- AVMs: Fields 12, 16a-16f (7 fields)
- Portal Views: Fields 169-172, 174 (5 fields)
- Market Indicators: Fields 91, 92, 95, 96, 175-178, 180 (9 fields)
- Rental Estimates: Fields 98, 181 (2 fields)
- Utilities: Fields 104-107, 110, 111, 114 (8 fields)
- Location: Fields 81, 82 (2 fields)
- Insurance: Field 97 (1 field)

### SCORING METHODOLOGY (118+ Comparable Fields)
- lower_is_better: taxes, HOA, crime, days on market
- higher_is_better: sqft, bedrooms, scores, saves
- closer_to_ideal: year built
- risk_assessment: flood, hurricane, earthquake
- quality_tier: school ratings, construction quality
- financial_roi: cap rate, rental yield, appreciation

### FRICTION IDENTIFICATION
If Field 174 (Saves/Favorites) is high but Field 95 (Days on Market) is also high, identify this as a "Price-to-Condition Mismatch."

### THE "SUPERIOR COMP"
Explicitly state which of the 3 Comps is the most statistically relevant "Superior Comp."

### MANDATORY WEB SEARCHES
Execute these searches to gather market context:
- "[City/ZIP] real estate market trends 2026"
- "[Neighborhood] home price appreciation forecast"
- "[City] housing inventory and days on market statistics"

### OUTPUT SCHEMA
{
  "investment_thesis": {
    "summary": "<2-3 sentence overview>",
    "property_grade": "A|B|C|D|F",
    "valuation_verdict": "Underpriced|Fair|Overpriced"
  },
  "comparative_breakdown": {
    "superior_comp_address": "<address>",
    "subject_vs_market_delta": <percentage>,
    "key_metrics_table": [
      {"metric": "Field 92: Price/Sqft", "subject": 0, "comp_avg": 0, "variance": 0},
      {"metric": "Field 174: Saves", "subject": 0, "comp_avg": 0, "variance": 0},
      {"metric": "Field 95: Days on Market", "subject": 0, "comp_avg": 0, "variance": 0}
    ],
    "friction_detected": {
      "price_to_condition_mismatch": <true|false>,
      "explanation": "<string>"
    }
  },
  "risk_assessment": {
    "concerns": [],
    "red_flags": ["Identify issues in utility costs or market trends"]
  },
  "forecast_2026": {
    "appreciation_1yr": <percentage>,
    "market_stability_score": 0-100,
    "reasoning": "<logic based on inventory surplus Field 96>"
  },
  "final_recommendation": {
    "action": "Strong Buy|Buy|Hold|Pass",
    "suggested_offer_range": {"low": 0, "high": 0}
  },
  "market_sources": [
    { "url": "<string>", "title": "<string>", "snippet": "<<=25 words>" }
  ]
}`;

/**
 * Grok 4 Expert - X (Twitter) data + real-time social sentiment
 */
async function callGrokForecast(
  address: string,
  price: number,
  neighborhood: string,
  propertyType: string
): Promise<LLMForecast> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY not found in environment variables');
  }

  const prompt = buildForecastPrompt(address, price, neighborhood, propertyType);

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-4-1-fast-reasoning',
      max_tokens: 16000,
      messages: [
        { role: 'system', content: GROK_FORECAST_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'web_search',
            description: 'Search the web for real-time information',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string' },
                num_results: { type: 'integer', default: 10 }
              },
              required: ['query']
            }
          }
        }
      ],
      tool_choice: 'auto',
      generation_config: {
        temperature: 0.2,
        response_mime_type: 'application/json'
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Grok API error: ${response.statusText}`);
  }

  const json = await response.json();
  const text = json.choices[0]?.message?.content;

  if (!text) {
    throw new Error('No content in Grok response');
  }

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in Grok response');
  }

  const data = JSON.parse(jsonMatch[0]);

  return {
    source: 'Grok 4 Expert',
    appreciation1Yr: data.appreciation1Yr,
    appreciation5Yr: data.appreciation5Yr,
    confidence: data.confidence,
    keyTrends: data.keyTrends,
    reasoning: data.reasoning,
  };
}

// ============================================================================
// CONSENSUS CALCULATION
// ============================================================================

function calculateConsensus(forecasts: LLMForecast[]): 'Strong' | 'Moderate' | 'Weak' | 'Divergent' {
  // Calculate standard deviation of 1-year forecasts
  const values = forecasts.map(f => f.appreciation1Yr);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Determine consensus strength based on standard deviation
  if (stdDev < 1.0) return 'Strong';      // All LLMs agree within 1%
  if (stdDev < 2.5) return 'Moderate';    // Reasonable agreement
  if (stdDev < 5.0) return 'Weak';        // Some disagreement
  return 'Divergent';                      // Significant disagreement
}

function findOutliers(forecasts: LLMForecast[]): string[] {
  const values = forecasts.map(f => f.appreciation1Yr);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const outliers: string[] = [];
  forecasts.forEach(forecast => {
    const zScore = Math.abs(forecast.appreciation1Yr - mean) / stdDev;
    if (zScore > 1.5) { // More than 1.5 standard deviations from mean
      outliers.push(`${forecast.source}: ${forecast.appreciation1Yr.toFixed(1)}% (vs avg ${mean.toFixed(1)}%)`);
    }
  });

  return outliers;
}

function aggregateTrends(forecasts: LLMForecast[]): string[] {
  // Collect all trends
  const allTrends = forecasts.flatMap(f => f.keyTrends);

  // Count frequency
  const trendCounts = new Map<string, number>();
  allTrends.forEach(trend => {
    const normalized = trend.toLowerCase().trim();
    trendCounts.set(normalized, (trendCounts.get(normalized) || 0) + 1);
  });

  // Sort by frequency and return top 5
  return Array.from(trendCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([trend, count]) => `${trend} (${count} LLMs)`);
}

// ============================================================================
// MAIN FORECAST FUNCTION
// ============================================================================

/**
 * Get market forecast from all 6 LLMs and calculate consensus
 */
export async function getMultiLLMMarketForecast(
  address: string,
  price: number,
  neighborhood: string,
  propertyType: string = 'Single Family'
): Promise<MarketForecast> {
  console.log('🔮 Starting 6-LLM Market Forecast...');
  console.log(`📍 ${address}, ${neighborhood}`);
  console.log(`💰 Current Price: $${price.toLocaleString()}`);

  // RATE LIMIT FIX: Call Perplexity FIRST (sequential), then other LLMs in parallel
  console.log('[Forecast] Calling Perplexity first (sequential to avoid 429)...');
  const perplexityResult = await Promise.allSettled([
    callPerplexityForecast(address, price, neighborhood, propertyType),  // #1 - Deep web search
  ]);

  // Other 5 LLMs can run in parallel (different rate limits)
  console.log('[Forecast] Calling 5 other LLMs in parallel...');
  const otherResults = await Promise.allSettled([
    callGeminiForecast(address, price, neighborhood, propertyType),      // #2 - Google Search grounding
    callGPT5Forecast(address, price, neighborhood, propertyType),        // #3 - Web evidence mode
    callGrokForecast(address, price, neighborhood, propertyType),        // #4 - X/Twitter real-time
    callClaudeForecast(address, price, neighborhood, propertyType),      // #5 - Web search beta
    callClaudeOpusForecast(address, price, neighborhood, propertyType),  // #6 - Deep reasoning (LAST)
  ]);

  // Combine results in original order
  const forecasts = [...perplexityResult, ...otherResults];

  // Extract successful forecasts
  const successfulForecasts: LLMForecast[] = [];
  forecasts.forEach((result, index) => {
    const sources = ['Perplexity Sonar', 'Gemini 3 Pro', 'GPT-5.2', 'Grok 4', 'Claude Sonnet 4.5', 'Claude Opus 4.5'];
    if (result.status === 'fulfilled') {
      successfulForecasts.push(result.value);
      console.log(`✅ ${sources[index]}: ${result.value.appreciation1Yr.toFixed(1)}% (1yr)`);
    } else {
      console.error(`❌ ${sources[index]} failed:`, result.reason);
    }
  });

  if (successfulForecasts.length === 0) {
    throw new Error('All LLM forecasts failed');
  }

  // Calculate averages
  const avgAppreciation1Yr = successfulForecasts.reduce((sum, f) => sum + f.appreciation1Yr, 0) / successfulForecasts.length;
  const avgAppreciation5Yr = successfulForecasts.reduce((sum, f) => sum + f.appreciation5Yr, 0) / successfulForecasts.length;
  const avgConfidence = successfulForecasts.reduce((sum, f) => sum + f.confidence, 0) / successfulForecasts.length;

  // Calculate consensus
  const consensus = calculateConsensus(successfulForecasts);
  const outliers = findOutliers(successfulForecasts);
  const marketTrends = aggregateTrends(successfulForecasts);

  // Generate key insights
  const keyInsights: string[] = [];
  if (avgAppreciation1Yr > 5) {
    keyInsights.push(`Strong appreciation expected: ${avgAppreciation1Yr.toFixed(1)}% in 1 year`);
  } else if (avgAppreciation1Yr < 0) {
    keyInsights.push(`⚠️ Depreciation risk: ${avgAppreciation1Yr.toFixed(1)}% in 1 year`);
  }

  if (consensus === 'Strong') {
    keyInsights.push('All LLMs agree - high confidence forecast');
  } else if (consensus === 'Divergent') {
    keyInsights.push('⚠️ LLMs disagree significantly - volatile market');
  }

  if (outliers.length > 0) {
    keyInsights.push(`${outliers.length} outlier forecast(s) detected`);
  }

  console.log(`📊 Consensus: ${consensus}`);
  console.log(`📈 Avg 1yr: ${avgAppreciation1Yr.toFixed(1)}%`);
  console.log(`📈 Avg 5yr: ${avgAppreciation5Yr.toFixed(1)}%`);

  return {
    appreciation1Yr: Math.round(avgAppreciation1Yr * 10) / 10,
    appreciation5Yr: Math.round(avgAppreciation5Yr * 10) / 10,
    confidence: Math.round(avgConfidence),
    marketTrends,
    keyInsights,
    consensus,
    outliers,
    llmForecasts: successfulForecasts,
    llmSources: successfulForecasts.map(f => f.source),
    timestamp: new Date().toISOString(),
    location: `${address}, ${neighborhood}`,
  };
}

// ============================================================================
// VERCEL SERVERLESS HANDLER
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address, price, neighborhood, propertyType } = req.body;

    if (!address || !price || !neighborhood) {
      return res.status(400).json({ error: 'Missing required fields: address, price, neighborhood' });
    }

    const forecast = await getMultiLLMMarketForecast(address, price, neighborhood, propertyType);

    return res.status(200).json(forecast);
  } catch (error) {
    console.error('Multi-LLM forecast error:', error);
    return res.status(500).json({
      error: 'Forecast failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
