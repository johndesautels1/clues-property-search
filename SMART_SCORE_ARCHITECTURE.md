# 🚨 CRITICAL: SMART SCORE ARCHITECTURE - MUST READ BEFORE ANY CHANGES

**LAST UPDATED:** 2025-12-27
**STATUS:** CANONICAL SOURCE OF TRUTH FOR SMART SCORE SYSTEM

---

## ⚠️ WARNING TO ALL DEVELOPERS (INCLUDING CLAUDE)

**READ THIS ENTIRE DOCUMENT BEFORE TOUCHING ANY SMART SCORE CODE**

This system uses a **2-TIER CONSENSUS MODEL** with LLM voting and arbitration.
It is NOT a simple client-side calculation. Failure to understand this has caused
weeks of bugs and rework.

---

## 📊 THE COMPLETE SMART SCORE SYSTEM

### OVERVIEW
- **168 total questions** in property schema
- **138 questions are mathematically scoreable** (0-100 scale)
- **22 sections** total (at least 13 contain scoreable fields)
- **Scores ONLY appear after comparing 3 properties**
- Uses **2-tier consensus**: Client-side + LLM consensus

---

## 🏗️ ARCHITECTURE: 2-TIER CONSENSUS MODEL

### TIER 1: Client-Side Industry Standard Calculation

**Location:** `src/lib/smart-score-calculator.ts`

**Process:**
1. Each of the 138 questions has a **specific normalization equation**
2. Equations vary based on **property location**:
   - Florida beach areas (determined by zip code)
   - Florida inland areas (determined by zip code)
3. Each question is weighted **relative to the OTHER 2 properties** being compared
4. Section scores calculated by averaging normalized field scores
5. Section scores weighted using **industry-standard weights**:
   ```typescript
   INDUSTRY_WEIGHTS = {
     'A': 2.0,   // Address & Identity
     'B': 18.5,  // Pricing & Value
     'C': 15.2,  // Property Basics
     'D': 10.0,  // HOA & Taxes
     'E': 7.0,   // Structure & Systems
     'F': 1.0,   // Interior Features
     'G': 2.0,   // Exterior Features
     'H': 0.5,   // Permits & Renovations
     'I': 12.3,  // Schools
     'J': 5.0,   // Location Scores
     'K': 2.0,   // Distances & Amenities
     'L': 4.0,   // Safety & Crime
     'M': 8.0,   // Market & Investment
     'N': 0.5,   // Utilities
     'O': 9.0,   // Environment & Risk
     'P': 0.0,   // Additional Features
     'Q': 0.0,   // Parking
     'R': 0.0,   // Building
     'S': 0.0,   // Legal
     'T': 6.0,   // Waterfront
     'U': 0.0,   // Leasing
     'V': 0.0,   // Features
   }
   ```
6. Final weighted sum = **CLIENT-SIDE SMART SCORE**

**IMPORTANT:** This is only HALF of the final score!

---

### TIER 2: LLM Consensus Calculation

**Location:** `api/property/smart-score-llm-consensus.ts` (or similar)

**Process:**
1. **Simultaneously or sequentially** call:
   - Perplexity (with detailed constraints)
   - Claude Opus (with detailed constraints)

2. **LLM Instructions Include:**
   - All 138 scoreable questions
   - All 22 section definitions
   - Detailed mathematical models
   - Constraint rules specific to Florida real estate
   - Anti-hallucination strategies
   - Explicit scoring rubrics

3. **Each LLM returns:**
   - Field-level scores (0-100 for each of 138 fields)
   - Section-level scores
   - Overall SMART Score
   - Reasoning/justification

4. **Consensus Logic:**
   - If Perplexity and Claude Opus **AGREE** (within tolerance):
     → Use their consensus score

   - If Perplexity and Claude Opus **DISAGREE**:
     → Call 3rd LLM as tiebreaker:
       - GPT-4o (preferred)
       - OR Grok 4.5 (alternative)
     → Use majority vote or weighted average
     → All get same detailed instructions

5. Result = **LLM CONSENSUS SCORE**

---

### TIER 3: GRAND UNIFIED CONSENSUS

**Location:** `src/lib/smart-score-unifier.ts` (or within comparison logic)

**Process:**
1. Input:
   - Client-side industry score (Tier 1)
   - LLM consensus score (Tier 2)

2. Arbitration algorithm:
   - Compare the two scores
   - If scores differ significantly, apply weighting:
     - Client-side: X% weight (objective, rule-based)
     - LLM consensus: Y% weight (contextual, market-aware)
   - Calculate weighted average

3. Output = **GRAND UNIFIED SMART SCORE**

**THIS is the score displayed in UI/UX**

---

## 🔄 EXECUTION FLOW

### When User Compares 3 Properties:

```
1. User selects 3 properties on Compare page
2. Click "Calculate SMART Score" or trigger automatically
3. TIER 1 executes (client-side):
   ├─ Load all 3 property objects (168 fields each)
   ├─ Extract 138 scoreable fields per property
   ├─ Apply zip-code-based normalization equations
   ├─ Weight each field relative to other 2 properties
   ├─ Calculate section averages
   ├─ Apply industry weights
   └─ Output: Client-side score for each property

4. TIER 2 executes (LLM calls):
   ├─ Prepare payload: all 3 properties × 138 fields
   ├─ Call Perplexity (async)
   ├─ Call Claude Opus (async)
   ├─ Wait for both responses
   ├─ Compare scores:
   │  ├─ If agree → Use consensus
   │  └─ If disagree → Call GPT-4o/Grok as tiebreaker
   └─ Output: LLM consensus score for each property

5. TIER 3 executes (unification):
   ├─ Take client-side scores
   ├─ Take LLM consensus scores
   ├─ Apply arbitration algorithm
   └─ Output: GRAND UNIFIED SMART SCORE × 3 properties

6. UI Update:
   ├─ Display scores on property cards
   ├─ Show section breakdowns
   ├─ Enable "Ask Olivia" analysis

7. Ask Olivia Integration:
   ├─ Receives: Original schema data (168 fields × 3)
   ├─ Receives: SMART Score consensus data
   ├─ Receives: Section breakdowns
   ├─ Generates: Advanced Market Analysis Report
   └─ Powers: Ask Olivia Advanced Comparison Analytics
```

---

## 🚫 WHAT SHOULD NOT HAPPEN

### ❌ WRONG: Showing SMART Score on Individual Property Cards Before Comparison
- Properties searched individually should NOT show a score
- Score requires comparing 3 properties
- Score calculation is expensive (LLM calls)
- Only trigger after explicit user action

### ❌ WRONG: Using Only Client-Side Calculation
- This is HALF the system
- LLM consensus is mandatory
- Without LLM consensus, scores are incomplete

### ❌ WRONG: Skipping Consensus Arbitration
- If Perplexity and Opus disagree, MUST call 3rd LLM
- Cannot just pick one or average without tiebreaker
- This is a core feature of the system

---

## 📁 FILE LOCATIONS

### Current Files (Confirmed):
- `src/lib/smart-score-calculator.ts` - TIER 1 (client-side)
- `src/components/SMARTScoreDisplay.tsx` - UI display
- `src/pages/Compare.tsx` - Comparison page with weights
- `src/lib/normalizations/` - Field normalization functions (138 fields)

### Missing/Incomplete Files (Need Creation or Audit):
- `api/property/smart-score-llm-consensus.ts` - TIER 2 (LLM calls)
- `src/lib/smart-score-unifier.ts` - TIER 3 (grand consensus)
- LLM prompt templates for Perplexity/Opus/GPT/Grok

---

## 🔐 ENVIRONMENT VARIABLES

**Location:** Vercel dashboard

```
PERPLEXITY_API_KEY=...
ANTHROPIC_API_KEY=...  (for Claude Opus)
OPENAI_API_KEY=...     (for GPT-4o tiebreaker)
GROK_API_KEY=...       (for Grok 4.5 tiebreaker, alternative)
XAI_API_KEY=...        (alias for Grok)
```

All 6 LLM keys should be available for the consensus system.

---

## 🧮 NORMALIZATION EQUATIONS

### Location-Based Logic:
Each of the 138 fields has equations that vary by:
- **Beach zip codes:** Higher weight on waterfront, hurricane risk, flood zones
- **Inland zip codes:** Higher weight on schools, crime, commute times

### Example (conceptual):
```typescript
// Field 74: Walk Score
normalizeWalkScore(value, property) {
  const isBeach = BEACH_ZIP_CODES.includes(property.zip);

  if (isBeach) {
    // Beach areas: walkability less important
    return value * 0.7; // 70% weight
  } else {
    // Inland areas: walkability critical
    return value * 1.0; // 100% weight
  }
}
```

**All 138 fields** follow this pattern with Florida-specific logic.

---

## 🎯 EXPECTED OUTCOMES

### For a Good Property:
- Client-side score: 70-85
- LLM consensus score: 68-82
- Grand unified score: 70-83
- **Scores should be close** - if wildly different, investigate

### For a Bad Property:
- Client-side score: 30-50
- LLM consensus score: 28-48
- Grand unified score: 30-50

### Disagreement Threshold:
- If |client_score - llm_score| > 15 points → Flag for review
- If Perplexity and Opus differ by > 10 points → Call tiebreaker

---

## 🐛 COMMON BUGS TO AVOID

1. **Showing scores before comparison**
   - Only show after 3 properties compared

2. **Using only client-side calculation**
   - MUST include LLM consensus

3. **Wrong section mapping**
   - Section B = "Pricing & Value" (NOT "Building Details")
   - Section R = "Building" (Stellar MLS fields)

4. **Walk Score parsing errors**
   - Raw value: "77 - Very Walkable"
   - Must extract: 77 (not return 0)

5. **Weight sum ≠ 100%**
   - Industry weights must sum to exactly 100.0%
   - Currently sum to 103% (BUG - needs normalization)

---

## 🔧 TESTING CHECKLIST

Before deploying SMART Score changes:

- [ ] Scores ONLY appear after comparing 3 properties
- [ ] Client-side calculation works for all 138 fields
- [ ] LLM calls to Perplexity + Opus execute
- [ ] Tiebreaker (GPT-4o/Grok) called on disagreement
- [ ] Grand unified consensus calculated correctly
- [ ] All 22 sections display with correct names
- [ ] Section weights sum to 100.0%
- [ ] Beach vs. inland logic works (test both zip types)
- [ ] Ask Olivia receives complete data package
- [ ] No scores leak to individual property searches

---

## 📞 INTEGRATION WITH ASK OLIVIA

**Data Package Sent to Olivia:**
```typescript
{
  properties: [Property1, Property2, Property3], // 168 fields each
  smartScores: {
    property1: {
      clientSideScore: 78.5,
      llmConsensusScore: 76.2,
      grandUnifiedScore: 77.3,
      sectionBreakdown: [...22 sections with scores...],
      llmReasonings: {
        perplexity: "...",
        claudeOpus: "...",
        tiebreaker: "..." // if disagreement occurred
      }
    },
    property2: {...},
    property3: {...}
  },
  marketContext: {
    zipCodes: ["34235", "34240", "34236"],
    beachProperties: [true, false, true],
    comparisonDate: "2025-12-27"
  }
}
```

**Olivia Uses This To Generate:**
- Advanced Market Analysis Report
- Comparative property insights
- Investment recommendations
- Risk assessments
- Market trend predictions

---

## 🔒 ANTI-HALLUCINATION STRATEGIES

**Included in LLM Prompts:**
1. Strict output format (JSON schema)
2. Field-by-field validation rules
3. Require citations from property data
4. Penalize scores without justification
5. Cross-reference with industry benchmarks
6. Flag any values outside expected ranges
7. Temperature = 0.1 (low creativity, high precision)

---

## 📝 MAINTENANCE NOTES

### When Adding New Fields:
1. Update `fields-schema.ts` (add field definition)
2. Update `normalizations/` (add normalization function)
3. Update LLM prompts (include new field in instructions)
4. Update section weights if new section added
5. Test with 3-property comparison

### When Changing Weights:
1. Update `INDUSTRY_WEIGHTS` in Compare.tsx
2. Ensure sum = 100.0% (normalize if needed)
3. Update LLM prompts to reflect new priorities
4. Re-test scoring with known properties
5. Verify Ask Olivia results still make sense

---

## 🚨 EMERGENCY ROLLBACK

If SMART Score system breaks:
1. Check `git log` for last working commit
2. `git revert` to last stable version
3. File issue with:
   - What changed
   - Error messages
   - Affected components
4. DO NOT deploy half-working scores to production

---

**END OF SMART SCORE ARCHITECTURE DOCUMENTATION**

**Last Updated:** 2025-12-27
**Maintained By:** Project Owner + Development Team
**Version:** 2.0 (2-Tier Consensus Model)
