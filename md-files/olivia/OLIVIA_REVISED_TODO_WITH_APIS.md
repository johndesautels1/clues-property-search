# OLIVIA COMPLETION - REVISED TODO (With All APIs Available!)

**NEW INFORMATION**:
- ✅ All LLM API keys exist in Vercel env vars
- ✅ HeyGen account exists
- ✅ Olivia GPT brain exists on cluesnomad.com
- ✅ Just needs to wire everything together in THIS app

---

## 🎯 ACTUAL TODO LIST (Only 3 Core Tasks + 2 Optional)

### **TASK 1: Integrate Olivia Enhanced UI** ⚠️ CRITICAL - 30 MINUTES
**Status**: ✅ Code ready, just needs deployment

**Steps**:
1. Copy files from OlivaBrainDraft to src/:
   - `OlivaBrainDraft/src/components/OliviaExecutiveReport.tsx` → `src/components/`
   - `OlivaBrainDraft/src/types/olivia-enhanced.ts` → `src/types/`
   - `OlivaBrainDraft/src/api/olivia-brain-enhanced.ts` → `src/api/` (already done)
   - `OlivaBrainDraft/src/api/olivia-math-engine.ts` → `src/api/` (already done)

2. Update `src/pages/Compare.tsx` with 7 changes from `COMPARE_TSX_CHANGES.md`

3. Test with 3 properties

**Blocker**: None - Can do NOW

---

### **TASK 2: Wire Multi-LLM Market Forecast** ⚠️ HIGH PRIORITY - 2 HOURS

**What**: Call Claude + GPT-4 + Gemini + Perplexity for market consensus

**API Keys Needed** (Check Vercel env vars for these):
```bash
# Required:
VITE_ANTHROPIC_API_KEY          # ✅ Already have
VITE_OPENAI_API_KEY             # ✅ You said you have this
VITE_GOOGLE_AI_API_KEY          # ⚠️ Which Google API exactly?
VITE_PERPLEXITY_API_KEY         # ✅ You said you have this
```

**Which Google API?**
For Gemini Pro, you need **Google AI Studio API** (not Google Maps/Places):
- Go to: https://makersuite.google.com/app/apikey
- Create API key for Gemini Pro
- Add to Vercel as: `VITE_GOOGLE_AI_API_KEY`

**Code to Write**:

```typescript
// NEW FILE: src/api/multi-llm-forecast.ts
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface MarketForecast {
  appreciation1Yr: number;
  appreciation5Yr: number;
  appreciation10Yr: number;
  marketTrends: string[];
  marketRisks: string[];
  consensus: {
    confidence: number; // 0-100
    agreement: number;  // 0-100 (how much LLMs agree)
    outliers: string[]; // Which LLMs disagree
  };
  llmSources: string[];
  forecastDate: string;
}

interface LLMForecast {
  source: string;
  appreciation1Yr: number;
  appreciation5Yr: number;
  appreciation10Yr: number;
  trends: string[];
  risks: string[];
  confidence: number;
}

const FORECAST_PROMPT = (address: string, price: number, neighborhood: string) => `
You are a real estate market analyst. Forecast the market appreciation for this property:

Address: ${address}
Current Price: $${price.toLocaleString()}
Neighborhood: ${neighborhood}

Provide:
1. 1-year appreciation forecast (% gain/loss)
2. 5-year appreciation forecast (% total)
3. 10-year appreciation forecast (% total)
4. Top 3 market trends affecting this property
5. Top 3 market risks
6. Confidence level (0-100)

Base forecast on: local market conditions, neighborhood trends, economic indicators, historical data.

Return ONLY valid JSON:
{
  "appreciation1Yr": 3.5,
  "appreciation5Yr": 18.2,
  "appreciation10Yr": 42.8,
  "trends": ["Tech industry growth", "Infrastructure improvements", "Population influx"],
  "risks": ["Interest rate volatility", "Supply increase", "Economic uncertainty"],
  "confidence": 75
}
`;

async function callClaudeForecast(
  address: string,
  price: number,
  neighborhood: string
): Promise<LLMForecast> {
  const client = new Anthropic({
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: FORECAST_PROMPT(address, price, neighborhood),
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const data = JSON.parse(text.replace(/```json\n?/g, '').replace(/```/g, ''));

  return {
    source: 'Claude Sonnet 4',
    ...data,
  };
}

async function callGPT4Forecast(
  address: string,
  price: number,
  neighborhood: string
): Promise<LLMForecast> {
  const client = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{
      role: 'user',
      content: FORECAST_PROMPT(address, price, neighborhood),
    }],
    response_format: { type: 'json_object' },
  });

  const data = JSON.parse(response.choices[0].message.content || '{}');

  return {
    source: 'GPT-4 Turbo',
    ...data,
  };
}

async function callGeminiForecast(
  address: string,
  price: number,
  neighborhood: string
): Promise<LLMForecast> {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

  const result = await model.generateContent(
    FORECAST_PROMPT(address, price, neighborhood)
  );
  const text = result.response.text();
  const data = JSON.parse(text.replace(/```json\n?/g, '').replace(/```/g, ''));

  return {
    source: 'Gemini Pro',
    ...data,
  };
}

async function callPerplexityForecast(
  address: string,
  price: number,
  neighborhood: string
): Promise<LLMForecast> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [{
        role: 'user',
        content: FORECAST_PROMPT(address, price, neighborhood),
      }],
    }),
  });

  const result = await response.json();
  const text = result.choices[0].message.content;
  const data = JSON.parse(text.replace(/```json\n?/g, '').replace(/```/g, ''));

  return {
    source: 'Perplexity',
    ...data,
  };
}

function calculateConsensus(forecasts: LLMForecast[]): MarketForecast['consensus'] {
  // Calculate agreement (how close are the forecasts?)
  const avg1Yr = forecasts.reduce((sum, f) => sum + f.appreciation1Yr, 0) / forecasts.length;
  const deviations = forecasts.map(f => Math.abs(f.appreciation1Yr - avg1Yr));
  const avgDeviation = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;

  // Agreement: 100 = perfect agreement, 0 = total disagreement
  const agreement = Math.max(0, 100 - (avgDeviation * 10));

  // Average confidence
  const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length;

  // Find outliers (forecasts > 1.5x std dev from mean)
  const stdDev = Math.sqrt(
    forecasts.reduce((sum, f) => sum + Math.pow(f.appreciation1Yr - avg1Yr, 2), 0) / forecasts.length
  );
  const outliers = forecasts
    .filter(f => Math.abs(f.appreciation1Yr - avg1Yr) > stdDev * 1.5)
    .map(f => f.source);

  return {
    confidence: Math.round(avgConfidence),
    agreement: Math.round(agreement),
    outliers,
  };
}

export async function getMultiLLMMarketForecast(
  address: string,
  price: number,
  neighborhood: string
): Promise<MarketForecast> {
  console.log('🔮 Calling 4 LLMs for market forecast consensus...');

  // Call all LLMs in parallel
  const forecasts = await Promise.all([
    callClaudeForecast(address, price, neighborhood),
    callGPT4Forecast(address, price, neighborhood),
    callGeminiForecast(address, price, neighborhood),
    callPerplexityForecast(address, price, neighborhood),
  ]);

  console.log('✅ All LLM forecasts received');

  // Calculate averages
  const avgAppreciation1Yr = forecasts.reduce((sum, f) => sum + f.appreciation1Yr, 0) / forecasts.length;
  const avgAppreciation5Yr = forecasts.reduce((sum, f) => sum + f.appreciation5Yr, 0) / forecasts.length;
  const avgAppreciation10Yr = forecasts.reduce((sum, f) => sum + f.appreciation10Yr, 0) / forecasts.length;

  // Merge all trends (unique only)
  const allTrends = [...new Set(forecasts.flatMap(f => f.trends))];
  const allRisks = [...new Set(forecasts.flatMap(f => f.risks))];

  return {
    appreciation1Yr: Math.round(avgAppreciation1Yr * 10) / 10,
    appreciation5Yr: Math.round(avgAppreciation5Yr * 10) / 10,
    appreciation10Yr: Math.round(avgAppreciation10Yr * 10) / 10,
    marketTrends: allTrends.slice(0, 5), // Top 5
    marketRisks: allRisks.slice(0, 5),
    consensus: calculateConsensus(forecasts),
    llmSources: forecasts.map(f => f.source),
    forecastDate: new Date().toISOString(),
  };
}
```

**Then update `olivia-brain-enhanced.ts`**:

```typescript
// Add import
import { getMultiLLMMarketForecast } from './multi-llm-forecast';

// In analyzeWithOliviaEnhanced(), after getting main result:
if (request.includeMarketForecast) {
  console.log('📊 Generating multi-LLM market forecast...');

  const leadProperty = request.properties[0]; // Use first property for forecast

  result.marketForecast = await getMultiLLMMarketForecast(
    leadProperty.full_address,
    leadProperty.listing_price || 0,
    leadProperty.neighborhood || 'Unknown'
  );

  console.log('✅ Market forecast complete');
}
```

**Dependencies to Install**:
```bash
npm install openai @google/generative-ai
```

---

### **TASK 3: HeyGen Olivia Avatar** ⚠️ HIGH PRIORITY - 1-2 HOURS

**What**: Generate video of Olivia speaking the analysis

**HeyGen Setup** (Since you already have account):

1. **Create Olivia Avatar** (if not already):
   - Go to HeyGen dashboard
   - Upload reference image of Olivia
   - Train avatar (takes ~1 hour)
   - Get `avatar_id`

2. **Get API Key**:
   - HeyGen Dashboard → API
   - Copy API key
   - Add to Vercel: `VITE_HEYGEN_API_KEY`

3. **Create Video Generation Function**:

```typescript
// NEW FILE: src/api/heygen-avatar.ts
export interface HeyGenVideoResult {
  videoUrl: string;
  duration: number;
  status: 'processing' | 'completed' | 'failed';
  videoId: string;
}

export async function generateOliviaVideo(
  analysisScript: string,
  propertyAddress: string
): Promise<HeyGenVideoResult> {
  console.log('🎬 Generating HeyGen video for Olivia...');

  // Step 1: Create video
  const createResponse = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: {
      'X-Api-Key': import.meta.env.VITE_HEYGEN_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video_inputs: [{
        character: {
          type: 'avatar',
          avatar_id: 'olivia_clues_v1', // Your avatar ID from HeyGen
          avatar_style: 'normal',
        },
        voice: {
          type: 'text',
          input_text: analysisScript,
          voice_id: 'multilingual_female_professional', // Or custom voice
        },
        background: {
          type: 'color',
          value: '#1a1a2e', // Dark blue matching CLUES theme
        },
      }],
      dimension: {
        width: 1920,
        height: 1080,
      },
      aspect_ratio: '16:9',
      test: false, // Set to true for testing (free)
    }),
  });

  if (!createResponse.ok) {
    throw new Error(`HeyGen API error: ${createResponse.statusText}`);
  }

  const createData = await createResponse.json();
  const videoId = createData.data.video_id;

  console.log(`✅ Video generation started (ID: ${videoId})`);

  // Step 2: Poll for completion (videos take 1-3 minutes)
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max wait

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

    const statusResponse = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: {
        'X-Api-Key': import.meta.env.VITE_HEYGEN_API_KEY,
      },
    });

    const statusData = await statusResponse.json();

    if (statusData.data.status === 'completed') {
      console.log('✅ HeyGen video ready!');
      return {
        videoUrl: statusData.data.video_url,
        duration: statusData.data.duration,
        status: 'completed',
        videoId,
      };
    }

    if (statusData.data.status === 'failed') {
      throw new Error('HeyGen video generation failed');
    }

    attempts++;
    console.log(`⏳ Video processing... (${attempts * 5}s elapsed)`);
  }

  // If still processing after 5 minutes, return processing status
  return {
    videoUrl: '',
    duration: 0,
    status: 'processing',
    videoId,
  };
}

// Helper: Create analysis script from Olivia result
export function createAnalysisScript(result: OliviaEnhancedAnalysisResult): string {
  const winner = result.overallRecommendation.winner;
  const winningProperty = result.propertyRankings[winner - 1];

  return `
Hello, I'm Olivia, your CLUES property intelligence advisor.

I've completed a comprehensive analysis of three properties across 168 data points.

My recommendation is Property ${winner}, located at ${winningProperty.address}.

This property earned an investment grade of ${result.investmentGrade.overallGrade},
with a total score of ${result.overallRecommendation.winnerScore} out of 100.

Here are the top three reasons I recommend this property:

${result.keyFindings.slice(0, 3).map((finding, i) =>
  `${i + 1}. ${finding.title}. ${finding.description}`
).join('\n\n')}

For families, this property scores ${result.buyerSpecificRecommendations?.family?.score || 'N/A'}
due to ${result.buyerSpecificRecommendations?.family?.topReason || 'strong fundamentals'}.

For investors, the estimated cap rate is ${result.financialMetrics?.capRate || 'N/A'} percent,
with a projected rental yield of ${result.financialMetrics?.rentalYield || 'N/A'} percent annually.

Based on consensus from four leading AI models, I forecast this property will appreciate
${result.marketForecast?.appreciation5Yr || 'N/A'} percent over the next five years.

I'm confident in this recommendation, and I'm here to answer any questions you have about this analysis.

Let's find your perfect property together.
  `.trim();
}
```

4. **Update `OliviaExecutiveReport.tsx`**:

```typescript
// Add to imports
import { generateOliviaVideo, createAnalysisScript } from '@/api/heygen-avatar';

// In component, add state
const [heygenVideo, setHeygenVideo] = useState<string | null>(null);
const [videoLoading, setVideoLoading] = useState(false);

// On component mount, generate video
useEffect(() => {
  async function generateVideo() {
    setVideoLoading(true);
    try {
      const script = createAnalysisScript(result);
      const video = await generateOliviaVideo(script, properties[0].address);
      setHeygenVideo(video.videoUrl);
    } catch (error) {
      console.error('Failed to generate video:', error);
    } finally {
      setVideoLoading(false);
    }
  }

  generateVideo();
}, [result]);

// In JSX, replace placeholder video:
{videoLoading ? (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-quantum-cyan mx-auto mb-4" />
      <p className="text-gray-400">Olivia is preparing her video analysis...</p>
    </div>
  </div>
) : heygenVideo ? (
  <video
    ref={videoRef}
    src={heygenVideo}
    className="w-full rounded-xl"
    controls
    autoPlay
  />
) : (
  <div className="bg-gradient-to-br from-quantum-purple/20 to-quantum-cyan/20 rounded-xl aspect-video flex items-center justify-center">
    <p className="text-gray-400">Video unavailable</p>
  </div>
)}
```

---

### **TASK 4: Sync Olivia GPT Brain** (Optional - For cluesnomad.com integration)

**What**: Share knowledge base between this app and cluesnomad.com Olivia

**Options**:
1. **Separate GPTs** - Keep app Olivia and website Olivia separate (recommended)
2. **Shared Knowledge** - Upload same knowledge base to both
3. **API Bridge** - Have app call cluesnomad.com Olivia

**Recommendation**: Keep separate for now. Different use cases:
- App Olivia: Deep 168-field property analysis
- Website Olivia: General CLUES™ info + marketing

---

### **TASK 5: Buyer Profile Selector** (Quick Win - 15 MIN)

Already documented in previous file - just add dropdown UI.

---

## 📋 REVISED IMPLEMENTATION PLAN

### **Week 1: Core Olivia (Tasks 1-2)**
- ✅ Day 1: Implement Task 1 (Integrate UI) - 30 min
- ✅ Day 2: Test with real data
- ✅ Day 3-4: Implement Task 2 (Multi-LLM) - 2 hrs
- ✅ Day 5: Test forecast consensus

### **Week 2: HeyGen + Polish (Tasks 3-5)**
- ✅ Day 1-2: Create Olivia avatar in HeyGen
- ✅ Day 3: Implement Task 3 (Video generation) - 2 hrs
- ✅ Day 4: Add Task 5 (Buyer selector) - 15 min
- ✅ Day 5: Final testing + deploy

---

## 🔑 API KEYS CHECKLIST

Verify these exist in Vercel env vars:

```bash
# Already confirmed:
✅ VITE_ANTHROPIC_API_KEY

# You said you have (verify in Vercel):
⚠️ VITE_OPENAI_API_KEY
⚠️ VITE_PERPLEXITY_API_KEY

# Need to add:
❌ VITE_GOOGLE_AI_API_KEY (Google AI Studio for Gemini)
❌ VITE_HEYGEN_API_KEY (From HeyGen dashboard)
```

**Google AI Studio Setup**:
1. Go to: https://makersuite.google.com/app/apikey
2. Create new API key
3. Copy key
4. Add to Vercel as `VITE_GOOGLE_AI_API_KEY`

**HeyGen API Key**:
1. Go to: https://app.heygen.com/settings/api
2. Generate API token
3. Copy token
4. Add to Vercel as `VITE_HEYGEN_API_KEY`

---

## 🎯 BOTTOM LINE

**You can implement ALL 5 tasks** because you have:
- ✅ All LLM APIs
- ✅ HeyGen account
- ✅ Existing Olivia GPT brain

**Total Time**: ~6-8 hours to complete everything

**Can start TODAY with Task 1** (30 min) to get users Olivia Enhanced immediately!

---

**Ready to proceed?** I can implement Task 1 right now if you approve!
