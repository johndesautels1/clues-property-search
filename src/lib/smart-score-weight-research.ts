/**
 * SMART Score Weight Research System
 *
 * Uses 2-LLM validation (Claude Opus + Perplexity) to determine
 * how much each section should weigh in the SMART Score calculation.
 *
 * This is SEPARATE from the 6-LLM cascade used for property data population.
 *
 * Purpose: Research WEIGHTS (how much things matter), not VALUES (what the data is)
 */

import Anthropic from '@anthropic-ai/sdk';

// ================================================================
// TYPE DEFINITIONS
// ================================================================

export interface LLMResponse {
  provider: 'claude-opus' | 'perplexity';
  weight: number | null;        // Proposed weight percentage (0-100)
  reasoning: string;             // Explanation of the weight
  sources?: string[];            // URLs (Perplexity only)
  confidence: number;            // 0-100
  rawResponse: string;           // Full LLM response for debugging
}

export interface WeightValidation {
  question: string;
  region: string;
  claudeResponse: LLMResponse;
  perplexityResponse: LLMResponse;
  consensus: {
    agreed: boolean;
    finalWeight: number | null;
    confidence: 'high' | 'medium' | 'low' | 'rejected';
    reason: string;
  };
  timestamp: string;
}

export interface ResearchQuestion {
  section: string;               // 'B', 'C', 'I', etc.
  sectionName: string;           // 'Pricing & Value'
  question: string;              // The research question
  priority: 'critical' | 'important' | 'optional';
}

export interface WeightResearchResult {
  region: string;
  generatedAt: string;
  totalQuestions: number;
  successfulValidations: number;
  consensusRate: number;         // Percentage
  weights: Record<string, number>; // Section ID -> weight %
  validations: WeightValidation[];
  citations: string[];           // All Perplexity sources
  summary: {
    highConfidence: number;
    mediumConfidence: number;
    rejected: number;
  };
}

// ================================================================
// RESEARCH QUESTIONS BY SECTION
// ================================================================

export const RESEARCH_QUESTIONS: ResearchQuestion[] = [
  // Section B: Pricing & Value (CRITICAL)
  {
    section: 'B',
    sectionName: 'Pricing & Value',
    question: 'In Florida coastal real estate markets, what percentage of buyer decision-making is driven by price-to-value metrics (price per square foot, price vs. assessed value, price vs. market estimate) compared to all other factors?',
    priority: 'critical'
  },
  {
    section: 'B',
    sectionName: 'Pricing & Value',
    question: 'According to real estate appraisal standards and recent sales data analysis, how much weight do professional appraisers give to comparable sales analysis and market value estimates when determining property value in Florida?',
    priority: 'critical'
  },

  // Section C: Property Basics (CRITICAL)
  {
    section: 'C',
    sectionName: 'Property Basics',
    question: 'What percentage of home buyer search filters and purchase decisions are based on basic property attributes (bedrooms, bathrooms, square footage, lot size) in Florida residential real estate?',
    priority: 'critical'
  },

  // Section I: Assigned Schools (CRITICAL)
  {
    section: 'I',
    sectionName: 'Assigned Schools',
    question: 'What percentage premium do homes in top-rated school districts (GreatSchools rating 8-10) command compared to similar homes in average-rated districts (5-7) in Florida coastal markets?',
    priority: 'critical'
  },
  {
    section: 'I',
    sectionName: 'Assigned Schools',
    question: 'For Florida coastal retiree communities (55+ age-restricted), how much does school quality affect home values compared to family-oriented neighborhoods?',
    priority: 'important'
  },

  // Section D: HOA & Taxes (CRITICAL)
  {
    section: 'D',
    sectionName: 'HOA & Taxes',
    question: 'In Florida, what percentage of monthly housing costs do HOA fees and property taxes represent on average, and how much does this factor influence buyer affordability calculations?',
    priority: 'critical'
  },

  // Section O: Environment & Risk (CRITICAL - FL Specific)
  {
    section: 'O',
    sectionName: 'Environment & Risk',
    question: 'What percentage of home value is lost when a Florida coastal property is designated FEMA Flood Zone AE (high risk) versus Zone X (minimal risk), accounting for insurance costs and buyer perception?',
    priority: 'critical'
  },
  {
    section: 'O',
    sectionName: 'Environment & Risk',
    question: 'How much do hurricane risk ratings and climate change projections affect buyer decisions and property values in Florida coastal markets (2020-2024 data)?',
    priority: 'critical'
  },

  // Section M: Market & Investment (IMPORTANT)
  {
    section: 'M',
    sectionName: 'Market & Investment Data',
    question: 'For real estate investors in Florida markets, what percentage weight do rental yield, cap rate, and appreciation potential carry in purchase decisions compared to property attributes?',
    priority: 'important'
  },

  // Section E: Structure & Systems (IMPORTANT)
  {
    section: 'E',
    sectionName: 'Structure & Systems',
    question: 'What is the estimated cost and buyer concern level for major system replacements (HVAC, roof, water heater) in Florida, and how much does system age/condition affect home value?',
    priority: 'important'
  },

  // Section T: Waterfront (CRITICAL - FL Coastal)
  {
    section: 'T',
    sectionName: 'Waterfront',
    question: 'What percentage premium do Gulf of Mexico waterfront properties with direct boat access command compared to similar non-waterfront properties in Florida coastal markets like St. Pete Beach, Clearwater, and Naples?',
    priority: 'critical'
  },

  // Section J: Location Scores (IMPORTANT)
  {
    section: 'J',
    sectionName: 'Location Scores',
    question: 'How much do walkability scores, transit access, and commute times influence property values in Florida coastal vs. inland suburban markets?',
    priority: 'important'
  },

  // Section L: Safety & Crime (IMPORTANT)
  {
    section: 'L',
    sectionName: 'Safety & Crime',
    question: 'What percentage impact do violent crime index and property crime rates have on home values and buyer decisions in Florida residential markets?',
    priority: 'important'
  },

  // Section K: Distances & Amenities (OPTIONAL)
  {
    section: 'K',
    sectionName: 'Distances & Amenities',
    question: 'How much value do proximity to beaches, grocery stores, hospitals, and parks add to Florida coastal properties compared to properties 5+ miles from these amenities?',
    priority: 'optional'
  },

  // Section G: Exterior Features (OPTIONAL)
  {
    section: 'G',
    sectionName: 'Exterior Features',
    question: 'What percentage value does a pool add to Florida residential properties, and how does this vary between coastal vs. inland markets?',
    priority: 'optional'
  },

  // Section F: Interior Features (OPTIONAL)
  {
    section: 'F',
    sectionName: 'Interior Features',
    question: 'How much do upgraded kitchen features (granite counters, stainless appliances) and flooring types (hardwood vs. tile vs. carpet) affect Florida home values?',
    priority: 'optional'
  },

  // Section N: Utilities & Connectivity (OPTIONAL)
  {
    section: 'N',
    sectionName: 'Utilities & Connectivity',
    question: 'What percentage of remote workers in Florida consider fiber internet availability and high-speed connectivity as a critical factor in home purchase decisions (2022-2024)?',
    priority: 'optional'
  },

  // Section H: Permits & Renovations (OPTIONAL)
  {
    section: 'H',
    sectionName: 'Permits & Renovations',
    question: 'How much value do recent permitted renovations add to Florida homes, and what percentage discount do buyers apply for unpermitted work or lack of renovation history?',
    priority: 'optional'
  },

  // Section P: Additional Features (OPTIONAL)
  {
    section: 'P',
    sectionName: 'Additional Features',
    question: 'What percentage premium do properties with golf course views, corner lots, or smart home features command in Florida markets?',
    priority: 'optional'
  },

  // Sections Q, R, S, U, V: Stellar MLS (Low Priority)
  {
    section: 'Q',
    sectionName: 'Parking',
    question: 'How much value does garage type (attached vs. detached) and additional parking spaces add in Florida residential markets?',
    priority: 'optional'
  },

  {
    section: 'R',
    sectionName: 'Building',
    question: 'For Florida condos, how much does floor level and elevator access affect unit prices in mid-rise and high-rise buildings?',
    priority: 'optional'
  },

  {
    section: 'S',
    sectionName: 'Legal',
    question: 'What percentage of Florida home buyers are deterred by CDD (Community Development District) fees, and how much do these fees affect property values?',
    priority: 'optional'
  },

  {
    section: 'U',
    sectionName: 'Leasing',
    question: 'For real estate investors in Florida, how much do rental restrictions and HOA leasing policies affect property desirability and purchase price?',
    priority: 'optional'
  },

  {
    section: 'V',
    sectionName: 'Features',
    question: 'What value do community amenities (pool, clubhouse, fitness center) add to Florida HOA properties compared to properties without shared amenities?',
    priority: 'optional'
  }
];

// ================================================================
// CLAUDE OPUS INTEGRATION
// ================================================================

export async function queryClaudeOpus(
  question: string,
  region: string
): Promise<LLMResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const systemPrompt = `You are a real estate research expert specializing in property valuation and market analysis.

Your task: Analyze the provided research question and determine a SPECIFIC PERCENTAGE WEIGHT (0-100) representing how much this factor influences home buyer decisions and property values.

CRITICAL RULES:
1. Provide a single percentage (e.g., 18.5, 12.0, 6.3)
2. Base your answer on:
   - Published real estate research (NAR, Zillow, Redfin)
   - Appraisal industry standards
   - Market data from 2020-2024
   - Regional factors specific to ${region}
3. Explain your reasoning with specific references
4. Rate your confidence (0-100) based on data availability

Respond ONLY with valid JSON in this format:
{
  "weight": 18.5,
  "confidence": 85,
  "reasoning": "Based on NAR 2023 research showing school quality accounts for 15-20% of buyer decisions in family markets, combined with Florida coastal demographic data showing 40% of buyers have school-age children, the weighted average is approximately 18.5%. Confidence is high due to multiple corroborating studies."
}`;

  const userPrompt = `Region: ${region}

Research Question:
${question}

Provide your analysis as JSON with weight, confidence, and reasoning.`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 1500,
      temperature: 0.3, // Lower temperature for more factual responses
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude Opus');
    }

    const rawResponse = textContent.text;

    // Parse JSON response
    const parsed = JSON.parse(rawResponse);

    return {
      provider: 'claude-opus',
      weight: parsed.weight,
      reasoning: parsed.reasoning,
      confidence: parsed.confidence,
      rawResponse
    };
  } catch (error: any) {
    console.error('[CLAUDE OPUS] Error:', error.message);
    return {
      provider: 'claude-opus',
      weight: null,
      reasoning: `Error: ${error.message}`,
      confidence: 0,
      rawResponse: error.message
    };
  }
}

// ================================================================
// PERPLEXITY INTEGRATION
// ================================================================

export async function queryPerplexity(
  question: string,
  region: string
): Promise<LLMResponse> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY not configured');
  }

  const contextualQuestion = `${question}

Region: ${region}
Time frame: 2020-2024

Provide:
1. A specific percentage weight (0-100)
2. Citations from real estate research, government data, or industry reports
3. Brief reasoning

Format as JSON:
{
  "weight": 18.5,
  "reasoning": "explanation with data"
}`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-deep-research',
        messages: [
          {
            role: 'system',
            content: 'You are a real estate data analyst. Provide specific percentages with citations from verifiable sources.'
          },
          {
            role: 'user',
            content: contextualQuestion
          }
        ],
        return_citations: true,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const rawResponse = data.choices[0].message.content;
    const citations = data.citations || [];

    // Try to parse JSON response
    let parsed: any;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                        rawResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : rawResponse;
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      // Fallback: extract percentage from text
      const weightMatch = rawResponse.match(/(\d+(?:\.\d+)?)\s*%/);
      parsed = {
        weight: weightMatch ? parseFloat(weightMatch[1]) : null,
        reasoning: rawResponse
      };
    }

    return {
      provider: 'perplexity',
      weight: parsed.weight,
      reasoning: parsed.reasoning || rawResponse,
      sources: citations,
      confidence: citations.length > 0 ? 90 : 40,
      rawResponse
    };
  } catch (error: any) {
    console.error('[PERPLEXITY] Error:', error.message);
    return {
      provider: 'perplexity',
      weight: null,
      reasoning: `Error: ${error.message}`,
      sources: [],
      confidence: 0,
      rawResponse: error.message
    };
  }
}

// ================================================================
// CONSENSUS VALIDATION
// ================================================================

export function validateConsensus(
  question: string,
  region: string,
  claudeResponse: LLMResponse,
  perplexityResponse: LLMResponse
): WeightValidation {

  // RULE 1: Both must have returned valid weights
  if (claudeResponse.weight === null || perplexityResponse.weight === null) {
    return {
      question,
      region,
      claudeResponse,
      perplexityResponse,
      consensus: {
        agreed: false,
        finalWeight: null,
        confidence: 'rejected',
        reason: '❌ One or both LLMs failed to provide a weight'
      },
      timestamp: new Date().toISOString()
    };
  }

  // RULE 2: Perplexity should have citations (preferred but not required)
  const hasCitations = (perplexityResponse.sources?.length || 0) > 0;

  // Calculate difference
  const diff = Math.abs(claudeResponse.weight - perplexityResponse.weight);

  // RULE 3: Determine consensus based on agreement
  let finalWeight: number | null;
  let confidence: 'high' | 'medium' | 'low' | 'rejected';
  let reason: string;

  if (diff <= 3) {
    // Strong agreement (within 3%)
    finalWeight = hasCitations
      ? perplexityResponse.weight  // Prefer Perplexity if it has citations
      : (claudeResponse.weight + perplexityResponse.weight) / 2;
    confidence = hasCitations ? 'high' : 'medium';
    reason = `✅ Strong consensus: Claude ${claudeResponse.weight}%, Perplexity ${perplexityResponse.weight}% (diff: ${diff.toFixed(1)}%)${hasCitations ? ', with citations' : ''}`;
  } else if (diff <= 7) {
    // Moderate agreement (within 7%)
    finalWeight = (claudeResponse.weight + perplexityResponse.weight) / 2;
    confidence = 'medium';
    reason = `⚠️ Moderate consensus: Claude ${claudeResponse.weight}%, Perplexity ${perplexityResponse.weight}% (diff: ${diff.toFixed(1)}%) - using average`;
  } else if (diff <= 12) {
    // Weak agreement (within 12%)
    finalWeight = hasCitations
      ? perplexityResponse.weight  // Trust Perplexity if it has citations
      : (claudeResponse.weight + perplexityResponse.weight) / 2;
    confidence = 'low';
    reason = `⚠️ Weak consensus: Claude ${claudeResponse.weight}%, Perplexity ${perplexityResponse.weight}% (diff: ${diff.toFixed(1)}%) - ${hasCitations ? 'using Perplexity (has citations)' : 'using average, manual review recommended'}`;
  } else {
    // No agreement (diff > 12%)
    finalWeight = null;
    confidence = 'rejected';
    reason = `❌ No consensus: Claude ${claudeResponse.weight}%, Perplexity ${perplexityResponse.weight}% (diff: ${diff.toFixed(1)}%) - manual review required`;
  }

  return {
    question,
    region,
    claudeResponse,
    perplexityResponse,
    consensus: {
      agreed: finalWeight !== null,
      finalWeight: finalWeight ? Math.round(finalWeight * 10) / 10 : null,
      confidence,
      reason
    },
    timestamp: new Date().toISOString()
  };
}

// ================================================================
// MAIN RESEARCH FUNCTION
// ================================================================

export async function researchSectionWeights(
  region: string = 'FL-Coastal',
  questions: ResearchQuestion[] = RESEARCH_QUESTIONS,
  onProgress?: (current: number, total: number, question: string) => void
): Promise<WeightResearchResult> {

  console.log(`\n🔬 Starting SMART Score Weight Research`);
  console.log(`Region: ${region}`);
  console.log(`Questions: ${questions.length}\n`);

  const validations: WeightValidation[] = [];
  const allCitations: Set<string> = new Set();

  // Process each question
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    if (onProgress) {
      onProgress(i + 1, questions.length, q.question.substring(0, 80) + '...');
    }

    console.log(`[${i + 1}/${questions.length}] ${q.sectionName}...`);

    // Query both LLMs in parallel
    const [claudeRes, perplexityRes] = await Promise.all([
      queryClaudeOpus(q.question, region),
      queryPerplexity(q.question, region)
    ]);

    // Validate consensus
    const validation = validateConsensus(
      q.question,
      region,
      claudeRes,
      perplexityRes
    );

    validations.push(validation);

    // Collect citations
    if (perplexityRes.sources) {
      perplexityRes.sources.forEach(url => allCitations.add(url));
    }

    console.log(`  ${validation.consensus.reason}\n`);

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Aggregate weights by section
  const sectionWeights: Record<string, number[]> = {};

  validations.forEach(v => {
    const question = questions.find(q => q.question === v.question);
    if (!question || !v.consensus.finalWeight) return;

    if (!sectionWeights[question.section]) {
      sectionWeights[question.section] = [];
    }
    sectionWeights[question.section].push(v.consensus.finalWeight);
  });

  // Average weights per section
  const weights: Record<string, number> = {};
  for (const [section, vals] of Object.entries(sectionWeights)) {
    const avg = vals.reduce((sum, v) => sum + v, 0) / vals.length;
    weights[section] = Math.round(avg * 10) / 10;
  }

  // Normalize to 100%
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (total > 0) {
    for (const section in weights) {
      weights[section] = Math.round((weights[section] / total) * 1000) / 10;
    }
  }

  // Calculate summary stats
  const summary = {
    highConfidence: validations.filter(v => v.consensus.confidence === 'high').length,
    mediumConfidence: validations.filter(v => v.consensus.confidence === 'medium').length,
    rejected: validations.filter(v => v.consensus.confidence === 'rejected').length
  };

  const successfulValidations = summary.highConfidence + summary.mediumConfidence;
  const consensusRate = Math.round((successfulValidations / questions.length) * 100);

  return {
    region,
    generatedAt: new Date().toISOString(),
    totalQuestions: questions.length,
    successfulValidations,
    consensusRate,
    weights,
    validations,
    citations: Array.from(allCitations),
    summary
  };
}
