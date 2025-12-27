/**
 * CLUES SMART Score - TIER 2 LLM Consensus API
 *
 * Implements 2-tier voting consensus model:
 * 1. Call Perplexity + Claude Opus simultaneously
 * 2. If they agree (within 10 points), use consensus
 * 3. If they disagree, call GPT-4.5 as tiebreaker
 * 4. Return final LLM consensus scores for all 3 properties
 *
 * @module smart-score-llm-consensus
 * @version 1.0.1
 * @date 2025-12-27
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface Property {
  [key: string]: any; // Full property object with all 168 fields
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
    tiebreaker?: {
      model: 'gpt-4.5' | 'grok';
      scores: number[];
    };
  };
  fullResults: {
    perplexity: LLMResponse;
    claudeOpus: LLMResponse;
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
      model: 'llama-3.1-sonar-huge-128k-online',
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

/**
 * Call GPT-4.5 API (tiebreaker)
 */
async function callGPT4(prompt: string): Promise<LLMResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.5-turbo',
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
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GPT-4.5 API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('GPT-4.5 returned empty response');
  }

  return JSON.parse(content);
}

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
      model: 'grok-beta',
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

  // STEP 1: Call Perplexity and Claude Opus simultaneously
  console.log('[LLM Consensus] Calling Perplexity and Claude Opus...');

  const [perplexityResult, claudeOpusResult] = await Promise.all([
    callPerplexity(prompt),
    callClaudeOpus(prompt),
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

  // STEP 2: Check if they agree on all 3 properties
  const allAgree =
    scoresAgree(perplexityScores[0], claudeOpusScores[0]) &&
    scoresAgree(perplexityScores[1], claudeOpusScores[1]) &&
    scoresAgree(perplexityScores[2], claudeOpusScores[2]);

  if (allAgree) {
    // CONSENSUS: Average the two scores
    console.log('[LLM Consensus] ✅ Perplexity and Claude Opus AGREE');

    return {
      property1Score: (perplexityScores[0] + claudeOpusScores[0]) / 2,
      property2Score: (perplexityScores[1] + claudeOpusScores[1]) / 2,
      property3Score: (perplexityScores[2] + claudeOpusScores[2]) / 2,
      consensusMethod: 'agreement',
      llmVotes: {
        perplexity: perplexityScores,
        claudeOpus: claudeOpusScores,
      },
      fullResults: {
        perplexity: perplexityResult,
        claudeOpus: claudeOpusResult,
      },
    };
  }

  // STEP 3: Disagreement - Call tiebreaker
  console.log('[LLM Consensus] ⚠️ DISAGREEMENT detected - calling tiebreaker...');

  let tiebreakerResult: LLMResponse;
  let tiebreakerModel: 'gpt-4.5' | 'grok';

  try {
    tiebreakerResult = await callGPT4(prompt);
    tiebreakerModel = 'gpt-4.5';
    console.log('[LLM Consensus] Tiebreaker: GPT-4.5');
  } catch (error) {
    console.log('[LLM Consensus] GPT-4.5 failed, trying Grok...');
    tiebreakerResult = await callGrok(prompt);
    tiebreakerModel = 'grok';
    console.log('[LLM Consensus] Tiebreaker: Grok');
  }

  const tiebreakerScores = [
    tiebreakerResult.property1.finalScore,
    tiebreakerResult.property2.finalScore,
    tiebreakerResult.property3.finalScore,
  ];

  // STEP 4: Use majority vote or weighted average
  // For each property, find the median of the 3 scores
  const finalScores = [0, 1, 2].map((i) => {
    const scores = [perplexityScores[i], claudeOpusScores[i], tiebreakerScores[i]];
    scores.sort((a, b) => a - b);
    return scores[1]; // Median
  });

  return {
    property1Score: finalScores[0],
    property2Score: finalScores[1],
    property3Score: finalScores[2],
    consensusMethod: 'tiebreaker',
    llmVotes: {
      perplexity: perplexityScores,
      claudeOpus: claudeOpusScores,
      tiebreaker: {
        model: tiebreakerModel,
        scores: tiebreakerScores,
      },
    },
    fullResults: {
      perplexity: perplexityResult,
      claudeOpus: claudeOpusResult,
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
