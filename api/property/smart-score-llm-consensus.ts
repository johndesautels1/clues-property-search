/**
 * CLUES SMART Score - TIER 2 LLM Consensus API
 *
 * Implements 2-tier voting consensus model:
 * 1. Call Perplexity + Claude Opus simultaneously
 * 2. If they agree (within 10 points), use consensus
 * 3. If they disagree, call GPT-5.2 as tiebreaker
 * 4. Return final LLM consensus scores for all 3 properties
 *
 * @module smart-score-llm-consensus
 * @version 1.0.1
 * @date 2025-12-27
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';
import { GEMINI_OLIVIA_CMA_SYSTEM } from '../../src/config/gemini-prompts.js';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface Property {
  [key: string]: any; // Full property object with all 181 fields
}

interface FieldScore {
  rawValue: any;
  score: number;
  reasoning: string;
}

interface SectionScore {
  section_name: string;
  weight: number;
  field_count: number;
  fields_populated: number;
  section_average: number;
  weighted_contribution: number;
}

interface PropertyScoreResult {
  zip_code: string;
  location_type: 'beach' | 'inland';
  fieldScores: Record<string, FieldScore>;
  sectionScores: Record<string, SectionScore>;
  finalScore: number;
  calculation_notes: string;
}

interface LLMResponse {
  property1: PropertyScoreResult;
  property2: PropertyScoreResult;
  property3: PropertyScoreResult;
  metadata: {
    total_fields_scored: number;
    calculation_timestamp: string;
    llm_model: string;
    temperature: number;
  };
}

interface ConsensusResult {
  property1Score: number;
  property2Score: number;
  property3Score: number;
  consensusMethod: 'agreement' | 'tiebreaker';
  llmVotes: {
    perplexity: number[];
    claudeOpus: number[];
    gemini: number[];
    tiebreaker?: {
      model: 'gpt-5.2-pro' | 'grok';
      scores: number[];
    };
  };
  fullResults: {
    perplexity: LLMResponse;
    claudeOpus: LLMResponse;
    gemini: LLMResponse;
    tiebreaker?: LLMResponse;
  };
}

// =============================================================================
// LLM API CALL FUNCTIONS
// =============================================================================

/**
 * Load the master prompt template
 */
function loadPromptTemplate(): string {
  try {
    const promptPath = join(process.cwd(), 'SMART_SCORE_LLM_PROMPT_MASTER.md');
    return readFileSync(promptPath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to load prompt template: ${error}`);
  }
}

/**
 * Build the complete prompt with property data
 */
function buildPrompt(properties: [Property, Property, Property]): string {
  const template = loadPromptTemplate();

  // Append property data to the template
  const propertyData = `

---

## 🏠 PROPERTY DATA

### Property 1:
\`\`\`json
${JSON.stringify(properties[0], null, 2)}
\`\`\`

### Property 2:
\`\`\`json
${JSON.stringify(properties[1], null, 2)}
\`\`\`

### Property 3:
\`\`\`json
${JSON.stringify(properties[2], null, 2)}
\`\`\`

---

## ⚡ EXECUTE CALCULATION NOW

Calculate SMART Scores for all 3 properties above using the exact formulas provided.

Return ONLY valid JSON (no markdown, no extra text) in the format specified in the template.
`;

  return template + propertyData;
}

/**
 * Call Perplexity API
 */
async function callPerplexity(prompt: string): Promise<LLMResponse> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY not configured');
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a Florida real estate SMART Score calculation engine. You MUST return valid JSON with exact mathematical calculations as specified.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 16000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Perplexity API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Perplexity returned empty response');
  }

  // Parse JSON from response (remove markdown if present)
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || [null, content];
  const jsonStr = jsonMatch[1] || content;

  return JSON.parse(jsonStr);
}

/**
 * Call Claude Opus API
 */
async function callClaudeOpus(prompt: string): Promise<LLMResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-20250514',
      max_tokens: 16000,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude Opus API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text;

  if (!content) {
    throw new Error('Claude Opus returned empty response');
  }

  // Parse JSON from response
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || [null, content];
  const jsonStr = jsonMatch[1] || content;

  return JSON.parse(jsonStr);
}

// ============================================
// OLIVIA - CLUES Comparative Real Estate Analyst
// ============================================
const OLIVIA_SYSTEM_PROMPT = `You are Olivia, a CLUES Comparative Real Estate Analyst.

MISSION
Given a subject property and three comparable properties, plus precomputed scoring components from the app, produce:
1) A field-by-field comparison for the requested comparison keys
2) A ranked recommendation with clear tradeoffs
3) A concise executive summary written for a client
4) Optional market forecast (1y and 5y) that uses web search ONLY for macro context — never to overwrite property facts

HARD RULES
- Do NOT change property facts in the input. You may only interpret them.
- If a field is missing or unverified, explicitly treat it as unknown.
- If you use web search, use it only for market context and cite it in a separate "market_sources" section.
- Your outputs must be deterministic, consistent, and JSON-only.

OUTPUT JSON (no markdown)
{
  "ranking": [
    { "property_id": "<subject|comp1|comp2|comp3>", "rank": <1-4>, "why": ["<bullet>", "..."] }
  ],
  "comparisons": {
    "by_field": [
      {
        "field_key": "<string>",
        "subject_value": <any>,
        "comp_values": { "comp1": <any>, "comp2": <any>, "comp3": <any> },
        "verdict": { "comp1": "better|same|worse|unknown", "comp2": "...", "comp3": "..." },
        "threshold_or_logic": "<string>",
        "confidence": "High|Medium|Low"
      }
    ],
    "by_category": [
      { "category": "<string>", "what_mattered": ["<bullet>", "..."], "risks": ["<bullet>", "..."] }
    ]
  },
  "smart_score_summary": {
    "inputs_used": ["<list the score components you received>"],
    "interpretation": ["<bullet>", "..."],
    "tie_break_if_needed": { "applied": <true|false>, "explanation": "<string>" }
  },
  "forecast": {
    "enabled": <true|false>,
    "appreciation1Yr_pct": <number|null>,
    "appreciation5Yr_cum_pct": <number|null>,
    "confidence_0_100": <number>,
    "key_trends": ["<string>", "..."],
    "reasoning": "<2-4 sentences>"
  },
  "executive_summary": {
    "client_facing_summary": "<short paragraph>",
    "top_3_recommendations": ["<bullet>", "..."],
    "top_3_watchouts": ["<bullet>", "..."]
  },
  "market_sources": [
    { "url": "<string>", "title": "<string>", "snippet": "<<=25 words>", "retrieved_at": "<ISO date>" }
  ]
}`;

/**
 * Olivia User Template - Formats input for CMA analysis
 */
const OLIVIA_USER_TEMPLATE = (params: {
  subjectAndComps: unknown;
  comparisonKeys: string[];
  smartScoreComponents: unknown;
  forecastEnabled: boolean;
  city: string;
  county: string;
  state: string;
}) => `INPUT_DATA (do not modify; interpret only):
${JSON.stringify(params.subjectAndComps, null, 2)}

COMPARISON_FIELD_KEYS (only evaluate these):
${JSON.stringify(params.comparisonKeys, null, 2)}

APP_SCORING (precomputed by our code; use in your interpretation):
${JSON.stringify(params.smartScoreComponents, null, 2)}

FORECAST_MODE:
- enabled: ${params.forecastEnabled}
- property_market_context: "${params.city}, ${params.county}, ${params.state}"

Return ONLY the JSON described in the system prompt.`;

// Legacy alias
const GPT_SMART_SCORE_SYSTEM_PROMPT = OLIVIA_SYSTEM_PROMPT;

/**
 * Call GPT-5.2-pro API (tiebreaker)
 */

async function callGPT5(prompt: string): Promise<LLMResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  // Use OpenAI Responses API with web search for market context
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.2-pro',
      input: [
        { role: 'system', content: OLIVIA_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      reasoning: { effort: 'high' },
      tools: [{ type: 'web_search' }],
      tool_choice: 'auto', // Optional for CMA - only use web for market context
      include: ['web_search_call.action.sources'],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GPT-5.2-pro API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  // Handle Responses API format (output_text) or Chat Completions format (choices)
  const content = data.output_text || data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('GPT-5.2-pro returned empty response');
  }

  return JSON.parse(content);
}

// ============================================
// OLIVIA CMA ANALYST PROMPT (Grok 4 Reasoning Mode)
// ============================================
const GROK_SMART_SCORE_SYSTEM_PROMPT = `You are Olivia, the CLUES Senior Investment Analyst (Grok 4 Reasoning Mode).
Your MISSION is to perform a deep-dive Comparative Market Analysis (CMA) by evaluating a Subject Property against 3 Comparables across a 181-question data schema.

### REASONING PROTOCOL
1. METRIC CORRELATION: Compare the 34 high-velocity fields (AVMs, Portal Views) to determine "Market Momentum."
2. VARIANCE ANALYSIS: Calculate the delta between the Subject's 'Price per Sqft' (Field 92) and the Comps.
3. FRICTION IDENTIFICATION: If Field 174 (Saves) is high but Field 95 (Days on Market) is also high, identify this as a "Price-to-Condition Mismatch."
4. THE "SUPERIOR COMP": Explicitly state which of the 3 Comps is the most statistically relevant "Superior Comp."

OUTPUT SCHEMA
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

/**
 * Call Grok API (alternative tiebreaker)
 */
async function callGrok(prompt: string): Promise<LLMResponse> {
  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;

  if (!apiKey) {
    throw new Error('XAI_API_KEY or GROK_API_KEY not configured');
  }

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-4-1-fast-reasoning',
      messages: [
        {
          role: 'system',
          content: GROK_SMART_SCORE_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
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
        temperature: 1.0,
        response_mime_type: 'application/json'
      },
      max_tokens: 16000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Grok returned empty response');
  }

  // Parse JSON from response
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || [null, content];
  const jsonStr = jsonMatch[1] || content;

  return JSON.parse(jsonStr);
}

// ============================================
// GEMINI 3 PRO - OLIVIA CMA ANALYZER
// ============================================

/**
 * Call Gemini API (third primary voter)
 */
async function callGemini(prompt: string): Promise<LLMResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-latest:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: GEMINI_OLIVIA_CMA_SYSTEM }]
        },
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        tool_config: { function_calling_config: { mode: 'ANY' } },
        generation_config: {
          temperature: 1.0,
          response_mime_type: 'application/json',
          thinking_level: 'high'
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error('Gemini returned empty response');
  }

  // Parse JSON from response
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || [null, content];
  const jsonStr = jsonMatch[1] || content;

  return JSON.parse(jsonStr);
}

// =============================================================================
// CONSENSUS LOGIC
// =============================================================================

/**
 * Check if two LLM responses agree (within tolerance)
 */
function scoresAgree(score1: number, score2: number, tolerance: number = 10): boolean {
  return Math.abs(score1 - score2) <= tolerance;
}

/**
 * Calculate consensus from LLM responses
 */
async function calculateConsensus(
  properties: [Property, Property, Property]
): Promise<ConsensusResult> {
  const prompt = buildPrompt(properties);

  // STEP 1: Call Perplexity, Claude Opus, and Gemini simultaneously
  console.log('[LLM Consensus] Calling Perplexity, Claude Opus, and Gemini...');

  const [perplexityResult, claudeOpusResult, geminiResult] = await Promise.all([
    callPerplexity(prompt),
    callClaudeOpus(prompt),
    callGemini(prompt),
  ]);

  const perplexityScores = [
    perplexityResult.property1.finalScore,
    perplexityResult.property2.finalScore,
    perplexityResult.property3.finalScore,
  ];

  const claudeOpusScores = [
    claudeOpusResult.property1.finalScore,
    claudeOpusResult.property2.finalScore,
    claudeOpusResult.property3.finalScore,
  ];

  const geminiScores = [
    geminiResult.property1.finalScore,
    geminiResult.property2.finalScore,
    geminiResult.property3.finalScore,
  ];

  // STEP 2: Check if all 3 LLMs agree on all 3 properties (within tolerance)
  const allAgree =
    scoresAgree(perplexityScores[0], claudeOpusScores[0]) &&
    scoresAgree(perplexityScores[0], geminiScores[0]) &&
    scoresAgree(perplexityScores[1], claudeOpusScores[1]) &&
    scoresAgree(perplexityScores[1], geminiScores[1]) &&
    scoresAgree(perplexityScores[2], claudeOpusScores[2]) &&
    scoresAgree(perplexityScores[2], geminiScores[2]);

  if (allAgree) {
    // CONSENSUS: Average all 3 scores
    console.log('[LLM Consensus] ✅ Perplexity, Claude Opus, and Gemini AGREE');

    return {
      property1Score: (perplexityScores[0] + claudeOpusScores[0] + geminiScores[0]) / 3,
      property2Score: (perplexityScores[1] + claudeOpusScores[1] + geminiScores[1]) / 3,
      property3Score: (perplexityScores[2] + claudeOpusScores[2] + geminiScores[2]) / 3,
      consensusMethod: 'agreement',
      llmVotes: {
        perplexity: perplexityScores,
        claudeOpus: claudeOpusScores,
        gemini: geminiScores,
      },
      fullResults: {
        perplexity: perplexityResult,
        claudeOpus: claudeOpusResult,
        gemini: geminiResult,
      },
    };
  }

  // STEP 3: Disagreement - Use median of 3 primary voters, call tiebreaker if needed
  console.log('[LLM Consensus] ⚠️ DISAGREEMENT detected - using median voting...');

  // For each property, find the median of the 3 scores (no tiebreaker needed with 3 voters)
  const finalScores = [0, 1, 2].map((i) => {
    const scores = [perplexityScores[i], claudeOpusScores[i], geminiScores[i]];
    scores.sort((a, b) => a - b);
    return scores[1]; // Median
  });

  // Check if median produces good consensus or if we need tiebreaker
  const needsTiebreaker = [0, 1, 2].some((i) => {
    const scores = [perplexityScores[i], claudeOpusScores[i], geminiScores[i]];
    const range = Math.max(...scores) - Math.min(...scores);
    return range > 20; // Large disagreement threshold
  });

  if (!needsTiebreaker) {
    console.log('[LLM Consensus] ✅ Median consensus achieved');
    return {
      property1Score: finalScores[0],
      property2Score: finalScores[1],
      property3Score: finalScores[2],
      consensusMethod: 'agreement',
      llmVotes: {
        perplexity: perplexityScores,
        claudeOpus: claudeOpusScores,
        gemini: geminiScores,
      },
      fullResults: {
        perplexity: perplexityResult,
        claudeOpus: claudeOpusResult,
        gemini: geminiResult,
      },
    };
  }

  // STEP 4: Large disagreement - Call GPT-5.2 as 4th voter for weighted consensus
  console.log('[LLM Consensus] ⚠️ Large disagreement - calling GPT-5.2 as 4th voter...');

  let tiebreakerResult: LLMResponse;
  let tiebreakerModel: 'gpt-5.2-pro' | 'grok';

  try {
    tiebreakerResult = await callGPT5(prompt);
    tiebreakerModel = 'gpt-5.2-pro';
    console.log('[LLM Consensus] 4th voter: gpt-5.2-pro');
  } catch (error) {
    console.log('[LLM Consensus] GPT-5.2 failed, trying Grok...');
    tiebreakerResult = await callGrok(prompt);
    tiebreakerModel = 'grok';
    console.log('[LLM Consensus] 4th voter: Grok');
  }

  const tiebreakerScores = [
    tiebreakerResult.property1.finalScore,
    tiebreakerResult.property2.finalScore,
    tiebreakerResult.property3.finalScore,
  ];

  // STEP 5: Use median of all 4 voters
  const finalScoresWithTiebreaker = [0, 1, 2].map((i) => {
    const scores = [perplexityScores[i], claudeOpusScores[i], geminiScores[i], tiebreakerScores[i]];
    scores.sort((a, b) => a - b);
    // With 4 scores, median is average of middle two
    return (scores[1] + scores[2]) / 2;
  });

  return {
    property1Score: finalScoresWithTiebreaker[0],
    property2Score: finalScoresWithTiebreaker[1],
    property3Score: finalScoresWithTiebreaker[2],
    consensusMethod: 'tiebreaker',
    llmVotes: {
      perplexity: perplexityScores,
      claudeOpus: claudeOpusScores,
      gemini: geminiScores,
      tiebreaker: {
        model: tiebreakerModel,
        scores: tiebreakerScores,
      },
    },
    fullResults: {
      perplexity: perplexityResult,
      claudeOpus: claudeOpusResult,
      gemini: geminiResult,
      tiebreaker: tiebreakerResult,
    },
  };
}

// =============================================================================
// API HANDLER
// =============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { properties } = req.body;

    // Validate input
    if (!Array.isArray(properties) || properties.length !== 3) {
      return res.status(400).json({
        error: 'Invalid input: expected array of exactly 3 properties',
      });
    }

    console.log('[SMART Score LLM Consensus] Starting calculation...');
    console.log('[SMART Score LLM Consensus] Properties:', properties.map((p: any) => p.address || 'Unknown'));

    // Calculate consensus
    const consensus = await calculateConsensus(properties as [Property, Property, Property]);

    console.log('[SMART Score LLM Consensus] ✅ Calculation complete');
    console.log('[SMART Score LLM Consensus] Scores:', [
      consensus.property1Score,
      consensus.property2Score,
      consensus.property3Score,
    ]);

    return res.status(200).json({
      success: true,
      consensus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SMART Score LLM Consensus] ERROR:', error);

    return res.status(500).json({
      success: false,
      error: 'LLM consensus calculation failed',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
