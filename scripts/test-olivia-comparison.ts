/**
 * OLIVIA PROMPT COMPARISON TEST
 *
 * Tests old vs new prompt to identify recommendation differences
 *
 * USAGE:
 * 1. Set your API key: export ANTHROPIC_API_KEY="sk-ant-..."
 * 2. Update the testProperties array with your actual 3 properties
 * 3. Run: npx ts-node test-olivia-comparison.ts
 */

import Anthropic from '@anthropic-ai/sdk';

// Sample property data (use your actual 3 properties)
const testProperties = [
  {
    id: "prop1",
    address: "123 Beach Ave",
    city: "St Pete Beach, FL",
    price: 750000,
    sqft: 2000,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2015,
    pricePerSqft: 375,
    smartScore: 82
  },
  {
    id: "prop2",
    address: "456 Ocean Blvd",
    city: "St Pete Beach, FL",
    price: 850000,
    sqft: 2200,
    bedrooms: 4,
    bathrooms: 3,
    yearBuilt: 2010,
    pricePerSqft: 386,
    smartScore: 78
  },
  {
    id: "prop3",
    address: "789 Gulf Way",
    city: "St Pete Beach, FL",
    price: 900000,
    sqft: 2500,
    bedrooms: 4,
    bathrooms: 3.5,
    yearBuilt: 2018,
    pricePerSqft: 360,
    smartScore: 85
  }
];

// ============================================================================
// OLD PROMPT (Original working version)
// ============================================================================
const OLD_PROMPT = `You are Olivia, a friendly and knowledgeable real estate advisor for CLUES™ (Comprehensive Location Utility & Evaluation System).

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

// ============================================================================
// NEW PROMPT (Enhanced version)
// ============================================================================
const NEW_PROMPT = `You are Olivia, a friendly and knowledgeable real estate advisor for CLUES™ (Comprehensive Location Utility & Evaluation System).

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
      "Review full 181-field property report",
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

// ============================================================================
// TEST FUNCTION
// ============================================================================
async function runComparisonTest() {
  const apiKey = process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('❌ ERROR: No Anthropic API key found');
    console.error('Set VITE_ANTHROPIC_API_KEY or ANTHROPIC_API_KEY environment variable');
    process.exit(1);
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  // Format property details for prompt
  const propertyDetails = testProperties
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

  const userPrompt = `Please analyze these ${testProperties.length} properties and provide your recommendation:

${propertyDetails}

Remember: Respond ONLY with valid JSON, no markdown or extra text.`;

  console.log('🔬 OLIVIA PROMPT COMPARISON TEST');
  console.log('=' .repeat(80));
  console.log('\n📊 Testing with properties:');
  testProperties.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.address} - $${p.price.toLocaleString()} - Score: ${p.smartScore}`);
  });
  console.log('\n');

  // ============================================================================
  // TEST 1: OLD PROMPT
  // ============================================================================
  console.log('🧪 TEST 1: OLD PROMPT (Original)');
  console.log('-'.repeat(80));

  try {
    const oldResponse = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      system: OLD_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const oldText = oldResponse.content.find(b => b.type === 'text');
    if (oldText && oldText.type === 'text') {
      const oldResult = JSON.parse(oldText.text);
      console.log(`✅ Recommendation: Property #${oldResult.recommendation + 1} (${testProperties[oldResult.recommendation].address})`);
      console.log(`📝 Summary: ${oldResult.summary}`);
      console.log('\n🏆 Rankings:');
      oldResult.rankings.sort((a: any, b: any) => a.rank - b.rank).forEach((r: any) => {
        const prop = testProperties.find(p => p.id === r.propertyId);
        console.log(`   #${r.rank}: ${prop?.address} - Score: ${r.score}`);
      });
      console.log('\n');
    }
  } catch (error: any) {
    console.error('❌ OLD PROMPT FAILED:', error.message);
  }

  // ============================================================================
  // TEST 2: NEW PROMPT
  // ============================================================================
  console.log('🧪 TEST 2: NEW PROMPT (Enhanced)');
  console.log('-'.repeat(80));

  try {
    const newResponse = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3000,
      system: NEW_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const newText = newResponse.content.find(b => b.type === 'text');
    if (newText && newText.type === 'text') {
      const newResult = JSON.parse(newText.text);
      console.log(`✅ Recommendation: Property #${newResult.recommendation + 1} (${testProperties[newResult.recommendation].address})`);
      console.log(`📝 Summary: ${newResult.summary}`);
      console.log('\n🏆 Rankings:');
      newResult.rankings.sort((a: any, b: any) => a.rank - b.rank).forEach((r: any) => {
        const prop = testProperties.find(p => p.id === r.propertyId);
        console.log(`   #${r.rank}: ${prop?.address} - Score: ${r.score}`);
      });

      if (newResult.methodology) {
        console.log('\n🧠 Methodology:');
        console.log(`   Confidence: ${newResult.methodology.confidenceLevel}%`);
        console.log('   Variables:');
        newResult.methodology.variablesConsidered.forEach((v: any) => {
          console.log(`      - ${v.name} (${v.weight}%): ${v.description}`);
        });
      }
      console.log('\n');
    }
  } catch (error: any) {
    console.error('❌ NEW PROMPT FAILED:', error.message);
  }

  // ============================================================================
  // TEST 3: NEW PROMPT WITH TEMPERATURE = 0
  // ============================================================================
  console.log('🧪 TEST 3: NEW PROMPT with Temperature=0 (Deterministic)');
  console.log('-'.repeat(80));

  try {
    const deterministicResponse = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3000,
      temperature: 0, // Make it deterministic
      system: NEW_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const detText = deterministicResponse.content.find(b => b.type === 'text');
    if (detText && detText.type === 'text') {
      const detResult = JSON.parse(detText.text);
      console.log(`✅ Recommendation: Property #${detResult.recommendation + 1} (${testProperties[detResult.recommendation].address})`);
      console.log(`📝 Summary: ${detResult.summary}`);
      console.log('\n🏆 Rankings:');
      detResult.rankings.sort((a: any, b: any) => a.rank - b.rank).forEach((r: any) => {
        const prop = testProperties.find(p => p.id === r.propertyId);
        console.log(`   #${r.rank}: ${prop?.address} - Score: ${r.score}`);
      });
      console.log('\n');
    }
  } catch (error: any) {
    console.error('❌ DETERMINISTIC PROMPT FAILED:', error.message);
  }

  console.log('=' .repeat(80));
  console.log('✅ Comparison test complete!');
  console.log('\nNOTE: Replace the sample properties above with your actual 3 properties');
  console.log('      to see how recommendations differ for your specific case.');
}

// Run the test
runComparisonTest().catch(console.error);
