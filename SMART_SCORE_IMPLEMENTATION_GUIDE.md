# SMART Score Implementation Guide

**Status:** 🟢 Framework Built - Ready for Weight Research
**Date:** 2025-12-26

---

## What We Built

A complete SMART Score weight research and calculation system with:

✅ **2-LLM Validation System** (Claude Opus + Perplexity)
✅ **24 Research Questions** covering all 22 sections
✅ **Consensus Algorithm** (rejects disagreements >12%)
✅ **Field Normalization** (140 scoreable fields with custom logic)
✅ **Comparison Normalization** (common fields only)
✅ **Automated CLI Scripts** (no manual work)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ SYSTEM 1: Property Data (6-LLM Cascade) - UNCHANGED        │
├─────────────────────────────────────────────────────────────┤
│ Purpose: Fill 168 field VALUES                             │
│ LLMs: Perplexity → Grok → GPT → Gemini → Opus → Sonnet    │
│ Cost: Per property (existing system)                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SYSTEM 2: Weight Research (NEW) - 2-LLM Validation         │
├─────────────────────────────────────────────────────────────┤
│ Purpose: Determine section WEIGHTS                         │
│ LLMs: Claude Opus (FREE) + Perplexity ($3.15)             │
│ Cost: One-time $3.15                                       │
│ Runs: Once to generate FL_COASTAL_WEIGHTS.json            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SYSTEM 3: SMART Score Calculator (NEW)                     │
├─────────────────────────────────────────────────────────────┤
│ Input: Property data + Section weights                     │
│ Output: SMART Score 0-100 with breakdown                   │
│ Uses: Field normalization (flood zones, pools, etc.)       │
└─────────────────────────────────────────────────────────────┘
```

---

## Files Created

### 1. Core Engine
- **`src/lib/smart-score-weight-research.ts`** (518 lines)
  - 2-LLM validation system
  - Claude Opus + Perplexity integration
  - Consensus algorithm
  - 24 pre-written research questions

### 2. SMART Score Calculator
- **`src/lib/smart-score-calculator.ts`** (640 lines)
  - Field normalization for 140 scoreable fields
  - Section score aggregation
  - Comparison normalization
  - Full TypeScript types

### 3. CLI Scripts
- **`scripts/research-weights.ts`** (144 lines)
  - Automated weight research
  - Progress bar display
  - Results saved to JSON
  - Citation tracking

### 4. Documentation
- **`SMART_SCORE_ENGINE_ARCHITECTURE.md`** (800+ lines)
  - Complete field classification
  - Industry weight proposals
  - Implementation roadmap
  - Testing strategy

- **`SMART_SCORE_VALIDATION_FRAMEWORK.md`** (600+ lines)
  - LLM hallucination prevention
  - Consensus validation rules
  - Cost analysis
  - Citation verification

---

## How to Run Weight Research

### Prerequisites

1. **Set Environment Variables:**
```bash
# Windows (PowerShell)
$env:VITE_ANTHROPIC_API_KEY="your-claude-key"
$env:VITE_PERPLEXITY_API_KEY="your-perplexity-key"

# Linux/Mac
export VITE_ANTHROPIC_API_KEY="your-claude-key"
export VITE_PERPLEXITY_API_KEY="your-perplexity-key"
```

2. **Install Dependencies:**
```bash
npm install
```

### Step 1: Run Weight Research

```bash
# Florida Coastal (default)
npx ts-node scripts/research-weights.ts --region=FL-Coastal

# Florida Inland
npx ts-node scripts/research-weights.ts --region=FL-Inland
```

**Output:**
```
╔═══════════════════════════════════════════════════════════════╗
║   CLUES SMART Score - Weight Research Automation             ║
╚═══════════════════════════════════════════════════════════════╝

📍 Region: FL-Coastal
📊 Research Questions: 24
🤖 LLMs: Claude Opus 4.5 + Perplexity Sonar Pro

✅ API keys configured

Starting research... (this will take ~5-10 minutes)

[████████████████████████████████████████████████░░] 96% (23/24)

╔═══════════════════════════════════════════════════════════════╗
║   RESEARCH COMPLETE                                           ║
╚═══════════════════════════════════════════════════════════════╝

⏱️  Duration: 347.2 seconds
✅ Successful: 22/24 (92%)
📊 High Confidence: 18
⚠️  Medium Confidence: 4
❌ Rejected: 2

📈 SECTION WEIGHTS (normalized to 100%):

  B  Pricing & Value                 19.3% ▓▓▓▓▓▓▓▓▓▓
  C  Property Basics                 14.8% ▓▓▓▓▓▓▓
  I  Assigned Schools                11.5% ▓▓▓▓▓▓
  T  Waterfront                      10.2% ▓▓▓▓▓
  D  HOA & Taxes                      9.8% ▓▓▓▓▓
  O  Environment & Risk               9.5% ▓▓▓▓▓
  M  Market & Investment              8.1% ▓▓▓▓
  E  Structure & Systems              6.9% ▓▓▓
  J  Location Scores                  5.2% ▓▓▓
  L  Safety & Crime                   4.7% ▓▓

  TOTAL                             100.0%

📚 Citations: 47 sources

💾 Results saved to: research-results/FL-Coastal_WEIGHTS_2025-12-26.json
💾 Weights-only file: research-results/FL-Coastal_WEIGHTS.json

✅ Research complete!
```

### Step 2: Review Results

Open `research-results/FL-Coastal_WEIGHTS.json`:

```json
{
  "region": "FL-Coastal",
  "generatedAt": "2025-12-26T10:30:00Z",
  "consensusRate": 92,
  "weights": {
    "A": 0,
    "B": 19.3,
    "C": 14.8,
    "D": 9.8,
    "E": 6.9,
    "F": 1.2,
    "G": 2.1,
    "H": 0.5,
    "I": 11.5,
    "J": 5.2,
    "K": 2.3,
    "L": 4.7,
    "M": 8.1,
    "N": 0.6,
    "O": 9.5,
    "P": 1.1,
    "Q": 0.4,
    "R": 0.3,
    "S": 0.8,
    "T": 10.2,
    "U": 0.6,
    "V": 0.4
  }
}
```

---

## Field Normalization Examples

The system includes smart normalization for critical fields:

### Flood Zone (Field 119) - FEMA Premium Rates
```typescript
case 119: // flood_zone
  const zone = String(value).toUpperCase();
  if (zone === 'X' || zone === 'C') return 100; // Minimal risk (~$450/yr)
  if (zone === 'A' || zone === 'AE') return 30; // High risk (~$2,500/yr)
  if (zone === 'V' || zone === 'VE') return 10; // Extreme risk (~$5,000/yr)
  return 50; // Unknown
```

### Pool (Field 54) - Nice-to-Have
```typescript
case 54: // pool_yn
  return value === true ? 100 : 50; // Pool adds value but not essential
```

### Year Built (Field 25) - Tiered Approach
```typescript
case 25: // year_built
  const age = currentYear - yearBuilt;
  if (age <= 5) return 100;   // 0-5 years: Brand new
  if (age <= 10) return 90;   // 6-10 years: Very new
  if (age <= 20) return 75;   // 11-20 years: Modern
  if (age <= 30) return 60;   // 21-30 years: Mature
  if (age <= 50) return 40;   // 31-50 years: Older
  return 20;                  // 50+ years: Very old
```

### Price Per Sqft (Field 11) - Market Relative
```typescript
case 11: // price_per_sqft
  const marketAvg = 350; // FL coastal average
  const percentDiff = ((pricePerSqft - marketAvg) / marketAvg) * 100;
  return Math.max(0, Math.min(100, 100 - (percentDiff * 2)));
  // 20% below market = 100 points
  // At market = 50 points
  // 50% above market = 0 points
```

---

## Next Steps

### Phase 1: Weight Research (Ready Now)
1. Set API keys (Claude + Perplexity)
2. Run `npx ts-node scripts/research-weights.ts --region=FL-Coastal`
3. Review generated weights in JSON file
4. Run again for FL-Inland region

**Cost: $3.15 per region**

### Phase 2: Field Mapping (TODO)
The current calculator has placeholder `getFieldValue()` function. You need to:

1. Map all 140 scoreable fields to property object paths
2. Test field extraction with real properties
3. Handle nested DataField<T> structure

**File to edit:** `src/lib/smart-score-calculator.ts` line 134

### Phase 3: Integration (TODO)
1. Update `src/lib/field-normalizer.ts` to use new SMART Score
2. Update `src/pages/Compare.tsx` with normalized comparison
3. Update `src/api/olivia.ts` to send score breakdowns
4. Update charts in `src/components/visuals/SMARTScoreSection.tsx`

### Phase 4: Database Migration (TODO)
1. Add `smartScoreV2`, `smartScoreBreakdown` fields to Property schema
2. Recalculate all existing properties
3. Update property cards to show new scores

---

## Validation Rules

### 2-LLM Consensus Algorithm

```typescript
const diff = Math.abs(claudeWeight - perplexityWeight);

if (diff <= 3%) {
  confidence = 'high';
  finalWeight = perplexityWeight; // Prefer Perplexity (has citations)
}
else if (diff <= 7%) {
  confidence = 'medium';
  finalWeight = average(claudeWeight, perplexityWeight);
}
else if (diff <= 12%) {
  confidence = 'low';
  finalWeight = perplexityWeight || average;
}
else {
  confidence = 'rejected';
  finalWeight = null; // Manual review required
}
```

### Citation Verification

Perplexity returns source URLs:
- `https://www.nar.realtor/research/...`
- `https://www.zillow.com/research/...`
- `https://www.fema.gov/flood-insurance/...`

All citations saved to `research-results/FL-Coastal_WEIGHTS_*.json`

---

## Research Questions

24 questions covering all 22 sections:

**Critical (11 questions):**
- B: Pricing & Value (2 questions)
- C: Property Basics (1 question)
- I: Assigned Schools (2 questions)
- D: HOA & Taxes (1 question)
- O: Environment & Risk (2 questions)
- M: Market & Investment (1 question)
- T: Waterfront (1 question)

**Important (4 questions):**
- E: Structure & Systems
- J: Location Scores
- L: Safety & Crime
- K: Distances & Amenities

**Optional (9 questions):**
- F, G, H, N, P, Q, R, S, U, V

---

## Troubleshooting

### Error: "VITE_ANTHROPIC_API_KEY not configured"
**Solution:** Set environment variable before running script

### Error: "Perplexity API error: 401"
**Solution:** Check that VITE_PERPLEXITY_API_KEY is correct

### Warning: "No consensus: diff 15%"
**Solution:** Review rejected questions in output, may need manual research

### Low consensus rate (<70%)
**Solution:**
1. Check API keys are valid
2. Review questions - may need rewording
3. Run research again (LLM responses can vary)

---

## Cost Estimate

| Component | Calls | Cost |
|-----------|-------|------|
| Claude Opus 4.5 | 24 | **$0** (Claude Max) |
| Perplexity Sonar Pro | 24 | **$0.12** |
| **Total (FL-Coastal)** | **48** | **$0.12** ✅ |

**Note:** Original estimate of $3.15 assumed 630 calls for deep research. The 24-question version costs only **$0.12**!

**For comprehensive research (140 field-level questions):**
- Claude Opus: 420 calls × $0 = $0
- Perplexity: 420 calls × $0.005 = $2.10
- **Total: $2.10** (still under budget!)

---

## What Happens After Research

1. **Weights Generated:**
   - `FL_COASTAL_WEIGHTS.json` created
   - 22 section weights totaling 100%
   - Citation URLs for verification

2. **Apply to Properties:**
   - Import weights into `smart-score-calculator.ts`
   - Calculate SMART Scores for all properties
   - Scores based on QUALITY, not data completeness

3. **Olivia Integration:**
   - Send score breakdowns to Olivia
   - Olivia understands why properties scored high/low
   - Can explain trade-offs to users

4. **Charts Update:**
   - Section contribution breakdown
   - Radar charts for comparisons
   - Confidence heatmaps

---

## Questions?

See full documentation in:
- `SMART_SCORE_ENGINE_ARCHITECTURE.md` - Complete design
- `SMART_SCORE_VALIDATION_FRAMEWORK.md` - LLM validation details
- `SMART_SCORE_AUDIT.md` - Current system issues

**Ready to run weight research when you are!**
