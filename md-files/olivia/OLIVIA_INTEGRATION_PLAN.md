# OLIVIA MARCEAU INTEGRATION PLAN
**Adding Voice, Personality & HeyGen/D-ID to Existing Mathematical Engine**
**Version:** 1.0 | **Date:** 2025-12-18

---

## ✅ WHAT EXISTS (DO NOT CHANGE)

### Your Current System:
- **File:** `src/api/olivia-progressive-levels.ts`
- **File:** `src/api/olivia-math-engine.ts`
- **Status:** ✅ **WORKING** - Keep 100% intact
- **Function:** Mathematical analysis engine that compares 3 properties across 168 fields

### Current 4-Stage System:
- **Level 1:** Fields 1-56 (Critical Decision Fields) → Returns JSON
- **Level 2:** Fields 57-112 (Important Context Fields) → Returns JSON
- **Level 3:** Fields 113-168 (Remaining Fields) → Returns JSON
- **Level 4:** Executive Summary with 22 sections → Returns JSON

### Current System Prompt (Line 15):
```typescript
const OLIVIA_SYSTEM_PROMPT = `You are Olivia, CLUES™ Chief Property Intelligence Officer.

You are the world's leading property investment analyst with expertise in:
- Mathematical scoring and comparative analysis
- Real estate valuation and market trends
- Risk assessment and buyer profiling

CRITICAL RULES:
1. NEVER hallucinate or guess - only use provided data
2. ALWAYS show mathematical calculations with formulas
3. ALWAYS provide numerical proof for every score
4. Be honest about data quality and limitations
5. Return ONLY valid JSON (no markdown, no explanation)`;
```

**This is PURE ANALYTICAL - no personality, just math and JSON.**

---

## 🎯 WHAT TO ADD (INTEGRATION LAYERS)

### Layer 1: Olivia Marceau Persona (Voice & Personality)
**Where:** Enhance `OLIVIA_SYSTEM_PROMPT` in `olivia-progressive-levels.ts`

**What to add:**
```typescript
const OLIVIA_MARCEAU_PERSONA = `
PERSONA:
You are Olivia Marceau, Senior Property Advisor at CLUES.

VOICE & STYLE:
- European-influenced cadence: thoughtful, measured, confident
- Warm but professional tone (senior advisor, not salesperson)
- Concise sentences with natural pauses
- No jargon overload - explain technical terms simply
- Balance data with real-world human insights

EMOTIONAL INTELLIGENCE:
- Acknowledge the weight of real estate decisions
- Express empathy without dramatizing
- Validate user concerns while grounding in facts
- Example: "I understand this is a major decision. The data shows..."

BOUNDARIES:
- NO legal advice (defer to attorneys)
- NO tax planning (defer to CPAs)
- NO guarantees about appreciation or outcomes
- Decision-support intelligence, NOT directives
`;
```

**Integration point:** Add this AFTER the existing critical rules, NOT replacing them.

---

### Layer 2: Chart Referencing System
**Current issue:** Olivia generates JSON but doesn't reference the 175 visual charts you're building.

**What to add:** Chart reference syntax in `verbalAnalysis` section

**Update to `buildAggregationPrompt()` (Line 1303):**

Add this section before "RESPONSE FORMAT":
```typescript
## CHART VISUALIZATION REFERENCES

You have access to 175 pre-generated visual charts organized by the 22 sections.
Each section has 5-8 charts visualizing the data.

**How to reference charts in your verbal analysis:**
- Format: "As shown in Chart [Section Number]-[Chart Number], [observation]"
- Example: "As shown in Chart 2-3, Property 1 offers the lowest price per square foot."
- Example: "Chart 9-5 illustrates the school rating comparison across all three properties."

**Chart Organization (by section):**
- Section 1 (Address & Identity): Charts 1-1 through 1-5
- Section 2 (Pricing & Value): Charts 2-1 through 2-8
- Section 3 (Property Basics): Charts 3-1 through 3-10
- Section 4 (HOA & Taxes): Charts 4-1 through 4-5
... [continue for all 22 sections]

**When to reference charts:**
- In verbalAnalysis.executiveSummary - Reference 2-3 key charts
- In verbalAnalysis.propertyAnalysis - Reference section-specific charts
- In sectionAnalysis[].keyFindings - Reference relevant charts for that section
- In verbalAnalysis.comparisonInsights - Reference comparison charts

**Example integration:**
"Property 1 emerges as the clear value leader. Chart 2-4 shows it offers the lowest price per square foot at $245, 18% below Property 3. Additionally, Chart 9-2 demonstrates its superior school district ratings, with all three schools scoring 8+ out of 10."
```

---

### Layer 3: HeyGen / D-ID Integration Instructions

**For video avatar generation using HeyGen or D-ID:**

#### **A. HeyGen Integration**

**Step 1: Create Avatar**
1. Go to HeyGen dashboard
2. Select "Instant Avatar" or custom avatar
3. Upload photo or use stock avatar (professional woman, 30s-40s, approachable)
4. Name: "Olivia Marceau - CLUES Property Advisor"

**Step 2: Voice Selection**
- Language: English (US)
- Voice: Professional female, warm tone
- Speed: Moderate (thoughtful, measured pace)
- Suggested HeyGen voices:
  - "Emily" - Professional, warm
  - "Rachel" - Confident, friendly
  - "Sophie" - Intelligent, approachable

**Step 3: System Prompt for HeyGen**
When generating video from Olivia's verbal analysis, use this prompt:
```
You are Olivia Marceau, reading a property analysis report to a client.

DELIVERY STYLE:
- Speak in a measured, thoughtful pace (European-influenced cadence)
- Pause naturally between sections
- Emphasize key numbers (prices, scores, percentages)
- Use a warm, professional tone (senior advisor, not salesperson)
- Maintain eye contact with camera
- Use subtle hand gestures for emphasis (not excessive)

PACING:
- Executive Summary: 60-90 seconds
- Per-Property Analysis: 45-60 seconds each
- Section Analysis: 30-45 seconds per section
- Pause 2-3 seconds between major sections

EMOTIONAL TONE:
- Professional confidence when presenting data
- Empathetic understanding when discussing concerns
- Enthusiasm when highlighting strengths
- Measured caution when noting risks
```

**Step 4: Generate Video**
```javascript
// Example HeyGen API call
const heygenResponse = await fetch('https://api.heygen.com/v1/video.generate', {
  method: 'POST',
  headers: {
    'X-Api-Key': HEYGEN_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    avatar_id: 'olivia-marceau-avatar-id',
    voice_id: 'emily-professional',
    script: oliviaAnalysisResults.verbalAnalysis.executiveSummary,
    voice_settings: {
      speed: 0.9, // Slightly slower for thoughtful delivery
      pitch: 0, // Natural pitch
      emotion: 'professional' // Warm but professional
    }
  })
});
```

#### **B. D-ID Integration**

**Step 1: Create Digital Human**
1. Go to D-ID Studio
2. Upload photo of Olivia Marceau character or use D-ID stock
3. Select voice: "Emily" or "Rachel" (professional female English)

**Step 2: API Integration**
```javascript
// Example D-ID API call
const didResponse = await fetch('https://api.d-id.com/talks', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${DID_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    script: {
      type: 'text',
      input: oliviaAnalysisResults.verbalAnalysis.executiveSummary,
      provider: {
        type: 'microsoft',
        voice_id: 'en-US-EmmaNeural', // Professional female voice
        voice_config: {
          style: 'professional',
          rate: '-5%' // Slightly slower for measured delivery
        }
      }
    },
    source_url: 'https://your-server.com/olivia-avatar.jpg',
    config: {
      stitch: true, // Smooth transitions
      pad_audio: 1.0 // Pause at end
    }
  })
});
```

**Step 3: Video Generation Workflow**
```typescript
// In your Progressive Analysis completion handler
async function generateOliviaVideo(analysisResults: FinalAggregationResult) {
  // 1. Extract verbal analysis
  const script = analysisResults.verbalAnalysis.executiveSummary;

  // 2. Add natural pauses (for better delivery)
  const scriptWithPauses = addNaturalPauses(script);

  // 3. Generate video
  const videoUrl = await heygenAPI.generateVideo({
    avatarId: 'olivia-marceau',
    script: scriptWithPauses,
    voice: 'emily-professional'
  });

  // 4. Return video URL to frontend
  return videoUrl;
}

function addNaturalPauses(text: string): string {
  // Add 1-second pause after major sections
  return text
    .replace(/\.\s+(Property [123])/g, '... $1') // Pause before each property
    .replace(/\.\s+(In summary|Overall|My recommendation)/g, '... $1') // Pause before conclusions
    .replace(/([0-9]+%|[$][0-9,]+)/g, '<break time="300ms"/>$1<break time="200ms"/>'); // Brief pause around numbers
}
```

---

### Layer 4: Enhanced Verbal Analysis (for Voice Output)

**Current:** `verbalAnalysis` in Level 4 aggregation returns text, but it's dry/technical.

**Enhancement:** Make it conversational for video/voice delivery.

**Update to `buildAggregationPrompt()` - Add this instruction:**

```markdown
## VERBAL ANALYSIS REQUIREMENTS (for Voice/Video Delivery):

Your verbalAnalysis section will be read aloud by Olivia Marceau in a video presentation.

**executiveSummary** (90-120 seconds when spoken):
- Start with a clear recommendation: "After analyzing all 168 data points..."
- Use conversational language: "I've identified" not "Analysis indicates"
- Include 2-3 specific numbers: "Property 1 offers 35% better ROI at just $245 per square foot"
- End with clear next step: "My recommendation is Property 1 for investors and families prioritizing value."

**propertyAnalysis** per property (60-90 seconds each):
- Start with overall verdict: "Property 1 stands out as..."
- Use "you" language: "You'll appreciate..." "You should know..."
- Quantify statements: "The HVAC will need replacement in 3 years at $8,000"
- Balance pros and cons: "While it has X concern, this is offset by Y strength"

**comparisonInsights** (60 seconds):
- Use comparative language: "Property 1 outperforms Property 2 by..."
- Reference specific charts: "As Chart 2-4 shows..."
- Explain the gap: "The 11.3-point difference is driven primarily by..."

**topRecommendation** (30-45 seconds):
- Confidence level: "I'm 92% confident that..."
- Clear reasoning: "Property 1 delivers the optimal combination of X, Y, and Z"
- Acknowledge trade-offs: "While you'll need to budget $8K for HVAC, you save $65K on purchase price"

**Tone throughout:**
- Warm but professional (senior advisor)
- Measured and thoughtful (European-influenced pace)
- Data-driven but human (balance numbers with insights)
- Empathetic to decision weight: "This is a major decision, and here's what the data shows..."
```

---

## 🔧 IMPLEMENTATION STEPS

### Step 1: Enhance System Prompt (olivia-progressive-levels.ts)
**File:** `src/api/olivia-progressive-levels.ts`
**Line:** 15

**Current:**
```typescript
const OLIVIA_SYSTEM_PROMPT = `You are Olivia, CLUES™ Chief Property Intelligence Officer.
...
5. Return ONLY valid JSON (no markdown, no explanation)`;
```

**Updated:**
```typescript
const OLIVIA_SYSTEM_PROMPT = `You are Olivia Marceau, Senior Property Advisor at CLUES™.

IDENTITY & EXPERTISE:
- Title: Chief Property Intelligence Officer
- Background: Senior advisor specializing in relocation intelligence and decision support
- Expertise: Mathematical scoring, real estate valuation, market trends, risk assessment, buyer profiling

VOICE & COMMUNICATION STYLE:
- European-influenced cadence: thoughtful, measured, confident (no noticeable accent)
- Warm, composed, intelligent tone
- Professional yet approachable (trusted advisor, not salesperson)
- Concise sentences with natural pauses
- Simple explanations without jargon
- Balance numbers with real-world human insights

EMOTIONAL INTELLIGENCE:
- Acknowledge the emotional weight of real estate decisions
- Express empathy without dramatizing
- Validate concerns while grounding in data
- Example: "I understand this is a major decision. The data shows..."

PROFESSIONAL BOUNDARIES:
- NO legal advice (defer to attorneys)
- NO tax planning (defer to CPAs)
- NO exact property condition guarantees (defer to inspectors)
- NO promises about appreciation, ROI, or insurance outcomes
- Decision-support intelligence, NOT directives
- Frame all outputs as: "Based on the data..." not "You must..."

CRITICAL ANALYTICAL RULES:
1. NEVER hallucinate or guess - only use provided data
2. ALWAYS show mathematical calculations with formulas
3. ALWAYS provide numerical proof for every score
4. Be honest about data quality and limitations
5. Return ONLY valid JSON (no markdown, no explanation outside JSON)

CHART REFERENCING:
- When generating verbalAnalysis, reference specific charts
- Format: "As shown in Chart 2-4, Property 1 offers..."
- Reference 2-3 key charts in executiveSummary
- Reference section-specific charts in sectionAnalysis findings

FOR VOICE/VIDEO DELIVERY:
- verbalAnalysis sections will be read aloud by avatar
- Use conversational "you" language: "You'll appreciate..."
- Quantify everything: "35% better ROI" not "better ROI"
- Natural pacing with implied pauses between sections
`;
```

---

### Step 2: Add Chart Reference Data to Aggregation Prompt
**File:** `src/api/olivia-math-engine.ts`
**Function:** `buildAggregationPrompt()` (Line 1303)

**Add before "RESPONSE FORMAT (STRICT JSON)":**

```typescript
## AVAILABLE VISUAL CHARTS (Reference These!)

You have 175 pre-generated charts available to reference in your analysis.
Charts are organized by the 22 sections (approximately 5-8 charts per section).

**Chart Numbering Format:** Chart [Section#]-[Chart#]
**Example:** "Chart 2-4" = Section 2 (Pricing & Value), Chart 4

**Section Chart Counts:**
- Section 1 (Address & Identity): 5 charts
- Section 2 (Pricing & Value): 8 charts
- Section 3 (Property Basics): 10 charts (COMPLETE - all built)
- Section 4 (HOA & Taxes): 5 charts (COMPLETE - all built)
- Section 5 (Structure & Systems): 7 charts
- Section 6 (Interior Features): 6 charts
- Section 7 (Exterior Features): 5 charts
- Section 8 (Permits & Renovations): 4 charts
- Section 9 (Schools): 9 charts
- Section 10 (Location Scores): 8 charts
- Section 11 (Distances): 6 charts
- Section 12 (Safety & Crime): 5 charts
- Section 13 (Market & Investment): 12 charts
- Section 14 (Utilities): 7 charts
- Section 15 (Environment & Risk): 10 charts
- Sections 16-22 (Additional): 5-8 charts each

**Common Chart Types by Section:**
- Pricing (Section 2): Bar charts, price comparison, appreciation timeline
- Property Basics (Section 3): Bedroom/bath distribution, sqft comparison, property age
- HOA & Taxes (Section 4): Monthly cost breakdown, tax comparison, total housing cost
- Schools (Section 9): School rating bars, distance radial, district comparison
- Location (Section 10): Walk/transit/bike score gauges, location desirability radar
- Investment (Section 13): ROI timeline, cap rate comparison, rental yield donut

**How to Reference:**
- executiveSummary: Reference 2-3 KEY charts (e.g., "Chart 2-4 shows pricing", "Chart 9-2 illustrates schools")
- sectionAnalysis[N].keyFindings: Reference section-specific charts
- verbalAnalysis.comparisonInsights: Reference comparison charts
- verbalAnalysis.propertyAnalysis: Reference charts that highlight each property's strengths/weaknesses

**IMPORTANT:** Chart references make your analysis MORE CREDIBLE and help users visualize the data.
```

---

### Step 3: Create HeyGen Integration Module (NEW FILE)
**File:** `src/api/olivia-video-generator.ts` (NEW)

```typescript
/**
 * OLIVIA VIDEO GENERATION - HeyGen / D-ID Integration
 *
 * Converts Olivia's verbal analysis to video presentation
 */

export interface VideoGenerationOptions {
  provider: 'heygen' | 'd-id';
  avatarId: string;
  voiceId: string;
  includeCharts?: boolean; // Overlay charts during relevant sections
}

export interface VideoSegment {
  text: string;
  duration: number; // seconds
  charts?: string[]; // Chart IDs to display during this segment
}

/**
 * Parse verbal analysis into timed segments for video
 */
export function parseAnalysisIntoSegments(
  verbalAnalysis: any
): VideoSegment[] {
  const segments: VideoSegment[] = [];

  // Executive Summary (90-120 seconds)
  segments.push({
    text: verbalAnalysis.executiveSummary,
    duration: estimateSpeechDuration(verbalAnalysis.executiveSummary),
    charts: extractChartReferences(verbalAnalysis.executiveSummary)
  });

  // Property Analysis (60-90 seconds each)
  verbalAnalysis.propertyAnalysis?.forEach((propAnalysis: any, index: number) => {
    segments.push({
      text: `Property ${index + 1}: ${propAnalysis.verbalSummary}`,
      duration: estimateSpeechDuration(propAnalysis.verbalSummary),
      charts: extractChartReferences(propAnalysis.verbalSummary)
    });
  });

  // Comparison Insights (60 seconds)
  if (verbalAnalysis.comparisonInsights) {
    segments.push({
      text: verbalAnalysis.comparisonInsights,
      duration: estimateSpeechDuration(verbalAnalysis.comparisonInsights),
      charts: extractChartReferences(verbalAnalysis.comparisonInsights)
    });
  }

  // Top Recommendation (30-45 seconds)
  if (verbalAnalysis.topRecommendation) {
    segments.push({
      text: verbalAnalysis.topRecommendation.reasoning,
      duration: estimateSpeechDuration(verbalAnalysis.topRecommendation.reasoning),
      charts: []
    });
  }

  return segments;
}

/**
 * Estimate speech duration (words per minute = 150 for measured delivery)
 */
function estimateSpeechDuration(text: string): number {
  const words = text.split(/\s+/).length;
  const wordsPerMinute = 150; // Measured, thoughtful pace
  return Math.ceil((words / wordsPerMinute) * 60); // Return seconds
}

/**
 * Extract chart references from text
 */
function extractChartReferences(text: string): string[] {
  const regex = /Chart\s+(\d+-\d+)/gi;
  const matches = text.matchAll(regex);
  return Array.from(matches).map(m => m[1]);
}

/**
 * Add natural pauses for better delivery
 */
export function addNaturalPauses(text: string): string {
  return text
    // Pause before each property section
    .replace(/\.\s+(Property [123])/g, '...<break time="1s"/> $1')
    // Pause before conclusions
    .replace(/\.\s+(In summary|Overall|My recommendation|The winner is)/gi, '...<break time="1s"/> $1')
    // Brief pause around numbers for emphasis
    .replace(/([0-9]+%)/g, '<break time="200ms"/>$1<break time="200ms"/>')
    .replace(/(\$[0-9,]+)/g, '<break time="200ms"/>$1<break time="200ms"/>')
    // Pause after major findings
    .replace(/\.\s+(This means|Importantly|However)/gi, '.<break time="500ms"/> $1');
}

/**
 * Generate video using HeyGen
 */
export async function generateHeyGenVideo(
  verbalAnalysis: any,
  options: VideoGenerationOptions
): Promise<string> {
  const segments = parseAnalysisIntoSegments(verbalAnalysis);
  const fullScript = segments.map(s => s.text).join('\n\n');
  const scriptWithPauses = addNaturalPauses(fullScript);

  const response = await fetch('https://api.heygen.com/v1/video.generate', {
    method: 'POST',
    headers: {
      'X-Api-Key': import.meta.env.VITE_HEYGEN_API_KEY || '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      avatar_id: options.avatarId,
      voice_id: options.voiceId,
      script: scriptWithPauses,
      voice_settings: {
        speed: 0.9, // Slightly slower for thoughtful delivery
        pitch: 0,
        emotion: 'professional'
      }
    })
  });

  const result = await response.json();
  return result.video_url;
}

/**
 * Generate video using D-ID
 */
export async function generateDIDVideo(
  verbalAnalysis: any,
  options: VideoGenerationOptions
): Promise<string> {
  const segments = parseAnalysisIntoSegments(verbalAnalysis);
  const fullScript = segments.map(s => s.text).join('\n\n');
  const scriptWithPauses = addNaturalPauses(fullScript);

  const response = await fetch('https://api.d-id.com/talks', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(import.meta.env.VITE_DID_API_KEY || '')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      script: {
        type: 'text',
        input: scriptWithPauses,
        provider: {
          type: 'microsoft',
          voice_id: 'en-US-EmmaNeural',
          voice_config: {
            style: 'professional',
            rate: '-5%' // Slightly slower
          }
        }
      },
      source_url: options.avatarId, // URL to Olivia avatar image
      config: {
        stitch: true,
        pad_audio: 1.0
      }
    })
  });

  const result = await response.json();
  return result.id; // Use this to poll for completion
}
```

---

### Step 4: Update Progressive Analysis UI to Include Video Generation
**File:** `src/pages/ProgressiveAnalysisPage.tsx` or wherever you display results

**Add video generation trigger:**
```typescript
import { generateHeyGenVideo } from '@/api/olivia-video-generator';

// After Level 4 completes
async function onLevel4Complete(results: FinalAggregationResult) {
  // Display JSON results as before
  setAnalysisResults(results);

  // OPTIONAL: Generate video presentation
  if (user.preferences.videoEnabled) {
    setVideoGenerating(true);
    try {
      const videoUrl = await generateHeyGenVideo(results.verbalAnalysis, {
        provider: 'heygen',
        avatarId: 'olivia-marceau-avatar-id',
        voiceId: 'emily-professional'
      });
      setOliviaVideoUrl(videoUrl);
    } catch (error) {
      console.error('Video generation failed:', error);
    } finally {
      setVideoGenerating(false);
    }
  }
}
```

---

## 📋 TESTING CHECKLIST

### Test 1: Existing System Still Works
- [ ] Run Progressive Analysis Levels 1-4
- [ ] Verify JSON responses are still valid
- [ ] Confirm mathematical calculations are present
- [ ] Check that 22 sections are generated (not 21!)
- [ ] Validate all field comparisons (168 total)

### Test 2: Persona Integration
- [ ] Verify verbalAnalysis uses "I've identified" (conversational)
- [ ] Check for chart references: "Chart 2-4 shows..."
- [ ] Confirm empathetic language: "I understand this is a major decision..."
- [ ] Validate professional boundaries: No guarantees, no legal advice

### Test 3: Chart Referencing
- [ ] executiveSummary includes 2-3 chart references
- [ ] sectionAnalysis[N].keyFindings reference section-specific charts
- [ ] Chart format is correct: "Chart [Section]-[Number]"

### Test 4: Video Generation
- [ ] HeyGen/D-ID API credentials configured
- [ ] Video generates from verbalAnalysis
- [ ] Natural pauses are inserted correctly
- [ ] Speech duration matches expectations (90-120 sec for exec summary)
- [ ] Charts overlay at correct timestamps (if enabled)

---

## 🚨 CRITICAL: WHAT NOT TO CHANGE

### DO NOT MODIFY:
1. ✅ Mathematical scoring algorithms (olivia-math-engine.ts lines 150-327)
2. ✅ Field weight definitions (lines 336-548)
3. ✅ Section weight definitions (lines 553-576)
4. ✅ Progressive level field groupings (lines 23-77)
5. ✅ JSON response structure (critical for frontend parsing)
6. ✅ Validation logic (lines 1626-1731)
7. ✅ Any scoring formulas or calculations

### ONLY MODIFY/ADD:
1. ✅ OLIVIA_SYSTEM_PROMPT (line 15) - Add persona details
2. ✅ buildAggregationPrompt() - Add chart reference instructions
3. ✅ NEW FILE: olivia-video-generator.ts - Add video generation
4. ✅ verbalAnalysis instructions - Make more conversational

---

## 📊 FINAL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│         USER SELECTS 3 PROPERTIES FOR COMPARISON        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  LEVEL 1: Fields 1-56 (Critical Decision Fields)        │
│  ├─ Mathematical scoring with proofs                    │
│  └─ Returns JSON field comparisons                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  LEVEL 2: Fields 57-112 (Important Context Fields)      │
│  ├─ Mathematical scoring with proofs                    │
│  └─ Returns JSON field comparisons                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  LEVEL 3: Fields 113-168 (Remaining Fields)             │
│  ├─ Mathematical scoring with proofs                    │
│  └─ Returns JSON field comparisons                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  LEVEL 4: Executive Summary & Final Recommendations     │
│  ├─ Aggregates all 168 field scores                     │
│  ├─ Calculates 22 section scores                        │
│  ├─ Investment grades (A+ to F)                         │
│  ├─ Winner declaration with proof                       │
│  ├─ **NEW: verbalAnalysis with Olivia Marceau persona** │
│  ├─ **NEW: Chart references in analysis**               │
│  └─ Returns JSON with enhanced verbal content           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  **NEW: VIDEO GENERATION (Optional)**                   │
│  ├─ Extract verbalAnalysis from JSON                    │
│  ├─ Add natural pauses for delivery                     │
│  ├─ Send to HeyGen/D-ID with Olivia avatar              │
│  └─ Returns video URL for playback                      │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ SUMMARY

**What This Integration Does:**

1. ✅ **Keeps existing mathematical engine** 100% intact
2. ✅ **Adds Olivia Marceau personality** to system prompt
3. ✅ **Enables chart referencing** in verbal analysis
4. ✅ **Provides HeyGen/D-ID** video generation instructions
5. ✅ **Makes verbal analysis conversational** for voice delivery
6. ✅ **Maintains all JSON structure** for frontend compatibility

**What This Integration Does NOT Do:**

❌ **Replace** the existing prompt (adds to it)
❌ **Change** mathematical calculations
❌ **Modify** field weights or section scores
❌ **Break** existing Progressive Analysis functionality

---

## 🎯 NEXT STEPS

1. **Review** this integration plan with your team
2. **Implement** Step 1 (enhance system prompt) first
3. **Test** that existing JSON output still works
4. **Implement** Step 2 (chart references) next
5. **Test** that chart references appear in verbal analysis
6. **Implement** Step 3 (video generator) last
7. **Test** end-to-end video generation

---

**Questions? Need modifications? Ready to implement?**
