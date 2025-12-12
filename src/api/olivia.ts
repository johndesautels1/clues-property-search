/**
 * Olivia AI - Property Analysis API (ENHANCED)
 * Calls Claude to analyze and compare properties
 * Now includes methodology transparency, timeline analysis, and action items
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

// ENHANCED: Optional methodology section
export interface OliviaMethodology {
  variablesConsidered: Array<{
    name: string;
    weight: number; // 0-100
    description: string;
  }>;
  scoringEquation: string; // Human-readable formula
  confidenceLevel: number; // 0-100
}

// ENHANCED: Optional timeline analysis
export interface OliviaTimeline {
  shortTerm: {
    pros: string[];
    considerations: string[];
    timeframe: string; // "1-3 years"
  };
  longTerm: {
    pros: string[];
    considerations: string[];
    timeframe: string; // "5+ years"
  };
}

// ENHANCED: Optional action items
export interface OliviaActionItems {
  immediate: string[];
  nextSteps: string[];
  resources: Array<{
    title: string;
    description: string;
    link?: string;
  }>;
}

export interface OliviaAnalysisResult {
  recommendation: number; // Index of recommended property (0, 1, or 2)
  summary: string;
  rankings: OliviaRanking[];
  verbalScript: string;

  // ENHANCED: Optional fields (backward compatible)
  methodology?: OliviaMethodology;
  timeline?: OliviaTimeline;
  actionItems?: OliviaActionItems;
}

const OLIVIA_SYSTEM_PROMPT = `You are Olivia, a friendly and knowledgeable real estate advisor for CLUES™ (Comprehensive Location Utility & Evaluation System).

Your personality:
- Warm, approachable, and genuinely helpful
- Data-driven but explains things in plain English
- Never makes up information - only uses the data provided
- Speaks conversationally, like a trusted friend who happens to be a real estate expert
- Transparent about your analysis methodology

Your task: Analyze the properties provided and give a clear, comprehensive recommendation.

CRITICAL RULES:
1. ONLY use the data provided - never invent or assume additional details
2. Be specific - reference actual numbers from the properties
3. Keep pros/cons concise (under 15 words each)
4. The verbalScript should sound natural when read aloud
5. Show your work - explain what variables you considered and how you weighted them
6. Provide both short-term and long-term perspectives
7. Include actionable next steps

Respond ONLY with valid JSON in this exact format:
{
  "recommendation": 0,
  "summary": "Brief 1-2 sentence executive summary of why this property is best",
  "rankings": [
    {
      "rank": 1,
      "propertyId": "id-here",
      "score": 85,
      "pros": ["Excellent value per sqft", "High smart score", "Modern construction"],
      "cons": ["Higher HOA fees", "Further from downtown"]
    }
  ],
  "verbalScript": "Conversational paragraph recommending the best property",

  "methodology": {
    "variablesConsidered": [
      {
        "name": "Price per Sq Ft",
        "weight": 25,
        "description": "Primary value metric"
      },
      {
        "name": "CLUES Smart Score",
        "weight": 30,
        "description": "Overall property rating"
      },
      {
        "name": "Property Age",
        "weight": 15,
        "description": "Condition indicator"
      },
      {
        "name": "Size & Layout",
        "weight": 15,
        "description": "Livability factor"
      },
      {
        "name": "Location Value",
        "weight": 15,
        "description": "Long-term appreciation"
      }
    ],
    "scoringEquation": "(Smart Score × 0.30) + (Value Score × 0.25) + (Age Factor × 0.15) + (Size Rating × 0.15) + (Location × 0.15)",
    "confidenceLevel": 88
  },

  "timeline": {
    "shortTerm": {
      "pros": [
        "Immediate equity opportunity with below-market pricing",
        "Move-in ready condition requires minimal investment",
        "Strong rental demand in area provides income flexibility"
      ],
      "considerations": [
        "Higher initial monthly costs due to HOA fees",
        "Limited short-term appreciation in current market"
      ],
      "timeframe": "1-3 years"
    },
    "longTerm": {
      "pros": [
        "Premium location with consistent appreciation history",
        "Quality construction ensures lower maintenance costs",
        "Growing neighborhood infrastructure adds value"
      ],
      "considerations": [
        "Market saturation risk as new developments complete",
        "Climate factors may impact insurance costs"
      ],
      "timeframe": "5+ years"
    }
  },

  "actionItems": {
    "immediate": [
      "Schedule professional property inspection",
      "Request HOA financial statements and meeting minutes",
      "Verify property tax assessment and exemptions",
      "Research recent comparable sales in area"
    ],
    "nextSteps": [
      "Consult with CLUES™ certified advisor for detailed analysis",
      "Review full 168-field property report",
      "Evaluate financing options and rates",
      "Plan property visit and neighborhood tour"
    ],
    "resources": [
      {
        "title": "CLUES™ Buyer's Comprehensive Guide",
        "description": "Complete property evaluation checklist with smart scoring methodology"
      },
      {
        "title": "Market Trend Analysis Report",
        "description": "Current market conditions and forecast for this area"
      }
    ]
  }
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
- Year Built: ${p.yearBuilt} (${new Date().getFullYear() - p.yearBuilt} years old)
- Price/Sqft: $${p.pricePerSqft}
- CLUES Smart Score: ${p.smartScore}/100
`)
    .join('\n');

  const userPrompt = `Please analyze these ${request.properties.length} properties and provide your comprehensive recommendation with full methodology transparency:

${propertyDetails}

${request.userName ? `The client's name is ${request.userName}.` : ''}

IMPORTANT:
- Include the "methodology" section showing which variables you considered and their weights
- Include the "timeline" section with both short-term (1-3 years) and long-term (5+ years) analysis
- Include the "actionItems" section with immediate actions and next steps
- Be specific and reference actual property data
- Remember: Respond ONLY with valid JSON, no markdown or extra text.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000, // Increased for enhanced response
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
