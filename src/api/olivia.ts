/**
 * Olivia AI - Property Analysis API
 * Calls Claude to analyze and compare properties
 */

import Anthropic from '@anthropic-ai/sdk';

export interface OliviaPropertyInput {
  id: string;
  address: string;
  city: string;
  price: number;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  pricePerSqft: number;
  smartScore: number;
}

export interface OliviaAnalysisRequest {
  properties: OliviaPropertyInput[];
  userName?: string;
}

export interface OliviaRanking {
  rank: number;
  propertyId: string;
  score: number;
  pros: string[];
  cons: string[];
}

export interface OliviaAnalysisResult {
  recommendation: number; // Index of recommended property (0, 1, or 2)
  summary: string;
  rankings: OliviaRanking[];
  verbalScript: string;
}

const OLIVIA_SYSTEM_PROMPT = `You are Olivia, a friendly and knowledgeable real estate advisor for CLUES™ (Comprehensive Location Utility & Evaluation System). 

Your personality:
- Warm, approachable, and genuinely helpful
- Data-driven but explains things in plain English
- Never makes up information - only uses the data provided
- Speaks conversationally, like a trusted friend who happens to be a real estate expert

Your task: Analyze the properties provided and give a clear recommendation.

CRITICAL RULES:
1. ONLY use the data provided - never invent or assume additional details
2. Be specific - reference actual numbers from the properties
3. Keep pros/cons concise (under 15 words each)
4. The verbalScript should sound natural when read aloud

Respond ONLY with valid JSON in this exact format:
{
  "recommendation": 0,
  "summary": "Brief 1-2 sentence summary of why this property is best",
  "rankings": [
    {
      "rank": 1,
      "propertyId": "id-here",
      "score": 85,
      "pros": ["Pro 1", "Pro 2", "Pro 3"],
      "cons": ["Con 1", "Con 2"]
    }
  ],
  "verbalScript": "Conversational paragraph recommending the best property"
}`;

export async function analyzeWithOlivia(
  request: OliviaAnalysisRequest
): Promise<OliviaAnalysisResult> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY not configured');
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const propertyDetails = request.properties
    .map((p, i) => `
Property ${i + 1} (ID: ${p.id}):
- Address: ${p.address}, ${p.city}
- Price: $${p.price.toLocaleString()}
- Size: ${p.sqft.toLocaleString()} sq ft
- Bedrooms: ${p.bedrooms} | Bathrooms: ${p.bathrooms}
- Year Built: ${p.yearBuilt}
- Price/Sqft: $${p.pricePerSqft}
- CLUES Smart Score: ${p.smartScore}/100
`)
    .join('\n');

  const userPrompt = `Please analyze these ${request.properties.length} properties and provide your recommendation:

${propertyDetails}

${request.userName ? `The client's name is ${request.userName}.` : ''}

Remember: Respond ONLY with valid JSON, no markdown or extra text.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: OLIVIA_SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: userPrompt }
    ],
  });

  // Extract text from response
  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Olivia');
  }

  // Parse JSON response
  try {
    const result = JSON.parse(textBlock.text) as OliviaAnalysisResult;
    return result;
  } catch (e) {
    console.error('Failed to parse Olivia response:', textBlock.text);
    throw new Error('Failed to parse Olivia analysis');
  }
}