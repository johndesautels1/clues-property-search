/**
 * Multi-LLM Market Forecast System
 *
 * Calls 6 different LLMs to get consensus on property market forecasts:
 * - Claude Sonnet 4.5: Fast, efficient analysis + pattern recognition
 * - Claude Opus 4.5: Deep reasoning + complex market modeling
 * - GPT-5.2: Market psychology + buyer behavior
 * - Gemini 2.5 Pro: Google data integration + local trends
 * - Perplexity Pro: LIVE web search for breaking news
 * - Grok 4 Expert: X (Twitter) data + real-time social sentiment
 *
 * Returns aggregated forecast with consensus score
 * In conflicts, the consensus algorithm calculates standard deviation:
 * - Strong consensus: All LLMs agree within 1%
 * - Divergent: LLMs disagree by 5%+ (outliers flagged with z-score > 1.5)
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  llmSources: string[];          // ['Claude', 'GPT-4', 'Gemini', 'Perplexity']

  // Metadata
  timestamp: string;
  location: string;
}

// ============================================================================
// FORECAST PROMPT TEMPLATE
// ============================================================================

function buildForecastPrompt(
  address: string,
  currentPrice: number,
  neighborhood: string,
  propertyType: string = 'Single Family'
): string {
  return `You are a real estate market analyst. Analyze the market forecast for this property:

**PROPERTY:**
- Address: ${address}
- Current Price: $${currentPrice.toLocaleString()}
- Neighborhood: ${neighborhood}
- Property Type: ${propertyType}

**YOUR TASK:**
Provide a data-driven market forecast in JSON format:

{
  "appreciation1Yr": <number>,     // Expected % price change in 1 year (can be negative)
  "appreciation5Yr": <number>,     // Expected % price change in 5 years (cumulative)
  "confidence": <number>,          // 0-100 confidence in this forecast
  "keyTrends": [<string>, ...],    // Top 3-5 market trends affecting this property
  "reasoning": "<string>"          // 2-3 sentence explanation
}

**ANALYSIS FACTORS:**
- Recent comparable sales trends
- Local job market & economic indicators
- School quality changes
- New development/construction
- Interest rate trends
- Supply/demand dynamics
- Neighborhood demographic shifts
- Crime trends
- Natural disaster risks
- Transit/infrastructure projects

**CRITICAL RULES:**
1. Be REALISTIC - avoid overly optimistic forecasts
2. If data is limited, lower confidence score
3. Consider both appreciation AND depreciation scenarios
4. Base on DATA, not speculation
5. Focus on THIS SPECIFIC LOCATION

Return ONLY valid JSON. No markdown, no explanation outside JSON.`;
}

// ============================================================================
// INDIVIDUAL LLM CALLS
// ============================================================================

/**
 * Claude Sonnet 4.5 - Historical patterns + economic modeling
 */
async function callClaudeForecast(
  address: string,
  price: number,
  neighborhood: string,
  propertyType: string
): Promise<LLMForecast> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY not found in environment variables');
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  const prompt = buildForecastPrompt(address, price, neighborhood, propertyType);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929', // Claude Sonnet 4.5
    max_tokens: 2000,
    temperature: 0.5, // Balanced for forecasting
    messages: [{ role: 'user', content: prompt }],
  });

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
 * Claude Opus 4.5 - Deep reasoning + complex market modeling
 */
async function callClaudeOpusForecast(
  address: string,
  price: number,
  neighborhood: string,
  propertyType: string
): Promise<LLMForecast> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY not found in environment variables');
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  const prompt = buildForecastPrompt(address, price, neighborhood, propertyType);

  const response = await client.messages.create({
    model: 'claude-opus-4-5-20251101', // Claude Opus 4.5
    max_tokens: 2000,
    temperature: 0.5, // Balanced for forecasting
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
 * GPT-5.2 - Market psychology + buyer behavior
 */
async function callGPT4Forecast(
  address: string,
  price: number,
  neighborhood: string,
  propertyType: string
): Promise<LLMForecast> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_OPENAI_API_KEY not found in environment variables');
  }

  const client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  const prompt = buildForecastPrompt(address, price, neighborhood, propertyType);

  const response = await client.chat.completions.create({
    model: 'gpt-5.2', // GPT-5.2
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error('No content in GPT-5.2 response');
  }

  const data = JSON.parse(text);

  return {
    source: 'GPT-5.2',
    appreciation1Yr: data.appreciation1Yr,
    appreciation5Yr: data.appreciation5Yr,
    confidence: data.confidence,
    keyTrends: data.keyTrends,
    reasoning: data.reasoning,
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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY not found in environment variables');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' }); // Gemini 2.5 Pro

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
 * Perplexity Pro - LIVE web search for breaking news
 */
async function callPerplexityForecast(
  address: string,
  price: number,
  neighborhood: string,
  propertyType: string
): Promise<LLMForecast> {
  const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_PERPLEXITY_API_KEY not found in environment variables');
  }

  const prompt = buildForecastPrompt(address, price, neighborhood, propertyType);

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'perplexity-pro', // Perplexity Pro
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 2000,
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
    source: 'Perplexity Pro',
    appreciation1Yr: data.appreciation1Yr,
    appreciation5Yr: data.appreciation5Yr,
    confidence: data.confidence,
    keyTrends: data.keyTrends,
    reasoning: data.reasoning,
  };
}

/**
 * Grok 4 Expert - X (Twitter) data + real-time social sentiment
 */
async function callGrokForecast(
  address: string,
  price: number,
  neighborhood: string,
  propertyType: string
): Promise<LLMForecast> {
  const apiKey = import.meta.env.VITE_GROK_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GROK_API_KEY not found in environment variables');
  }

  const prompt = buildForecastPrompt(address, price, neighborhood, propertyType);

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-4-expert', // Grok 4 Expert
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 2000,
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
// MAIN EXPORT
// ============================================================================

/**
 * Get market forecast from all 6 LLMs and calculate consensus
 *
 * CONFLICT RESOLUTION: When LLMs disagree, we use statistical consensus:
 * - Calculate mean and standard deviation of all forecasts
 * - Flag outliers with z-score > 1.5
 * - Return weighted average with confidence based on agreement level
 * - Strong consensus (stdDev < 1%): High confidence
 * - Divergent (stdDev >= 5%): Low confidence, review individual LLM reasoning
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

  // Call all 6 LLMs in parallel
  const forecasts = await Promise.allSettled([
    callClaudeForecast(address, price, neighborhood, propertyType),
    callClaudeOpusForecast(address, price, neighborhood, propertyType),
    callGPT4Forecast(address, price, neighborhood, propertyType),
    callGeminiForecast(address, price, neighborhood, propertyType),
    callPerplexityForecast(address, price, neighborhood, propertyType),
    callGrokForecast(address, price, neighborhood, propertyType),
  ]);

  // Extract successful forecasts
  const successfulForecasts: LLMForecast[] = [];
  forecasts.forEach((result, index) => {
    const sources = ['Claude Sonnet 4.5', 'Claude Opus 4.5', 'GPT-5.2', 'Gemini 2.5', 'Perplexity Pro', 'Grok 4'];
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
