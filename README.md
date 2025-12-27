# CLUES Quantum Property Dashboard

**Florida Real Estate Search & Analysis Platform with AI-Powered SMART Scores**

---

## 🚨 CRITICAL DEVELOPER INSTRUCTIONS

### ✅ ALL API KEYS ARE ALREADY CONFIGURED IN VERCEL

**DO NOT ASK ABOUT API KEYS. THEY ARE ALREADY SET UP.**

The following API keys are configured in Vercel environment variables and do NOT need to be added:

- ✅ `PERPLEXITY_API_KEY` - Configured
- ✅ `ANTHROPIC_API_KEY` - Configured (Claude Opus)
- ✅ `OPENAI_API_KEY` - Configured (GPT-4.5)
- ✅ `XAI_API_KEY` / `GROK_API_KEY` - Configured
- ✅ `GEMINI_API_KEY` - Configured
- ✅ `GOOGLE_MAPS_API_KEY` - Configured

**All LLM providers are ready. Do not request API key setup.**

---

## 📋 GITHUB WORKFLOW - MANDATORY

### **ALL CODE CHANGES MUST GO TO GITHUB**

**Repository:** `github.com/johndesautels1/clues-property-search.git`

**Branch:** `main`

**Workflow for every code change:**
```bash
# 1. Stage changes
git add .

# 2. Commit with descriptive message
git commit -m "Your detailed commit message here"

# 3. Push to GitHub (REQUIRED - NOT OPTIONAL)
git push origin main
```

**Vercel will auto-deploy from GitHub pushes.**

---

## 🏗️ PROJECT STRUCTURE

```
clues-property-search/
├── api/                          # Vercel serverless functions
│   ├── property/
│   │   ├── search.ts            # Main property search API
│   │   ├── smart-score-llm-consensus.ts  # TIER 2 LLM voting
│   │   ├── parse-mls-pdf.ts     # PDF parsing
│   │   └── [other APIs]
│   └── broker-dashboard.ts
├── src/
│   ├── components/              # React components
│   ├── lib/
│   │   ├── smart-score-calculator.ts     # TIER 1 client-side
│   │   ├── smart-score-unifier.ts        # TIER 3 arbitration
│   │   ├── florida-location-logic.ts     # Beach/inland detection
│   │   └── normalizations/      # 138 field normalizers
│   ├── pages/
│   │   ├── Compare.tsx          # 3-property comparison
│   │   └── [other pages]
│   └── types/
│       └── fields-schema.ts     # SOURCE OF TRUTH (168 fields)
├── SMART_SCORE_ARCHITECTURE.md          # System architecture
├── SMART_SCORE_LLM_PROMPT_MASTER.md     # LLM instructions (1,931 lines)
├── FLORIDA_ZIP_CODE_LOGIC.md            # 182 zip codes mapped
├── SMART_SCORE_IMPLEMENTATION_COMPLETE.md
└── README.md                     # This file
```

---

## 🎯 SMART SCORE SYSTEM

### 2-Tier Consensus Model

**TIER 1: Client-Side Calculation**
- Location: `src/lib/smart-score-calculator.ts`
- 138 scoreable fields with normalization equations
- 22 sections with industry-standard weights
- Beach vs. inland differentiation

**TIER 2: LLM Consensus**
- Location: `api/property/smart-score-llm-consensus.ts`
- Calls Perplexity + Claude Opus simultaneously
- If scores agree (within 10 points): Use average
- If scores disagree: Call GPT-4.5 as tiebreaker, use median

**TIER 3: Grand Unified Arbitration**
- Location: `src/lib/smart-score-unifier.ts`
- Combines TIER 1 + TIER 2 intelligently
- Divergence ≤5 points: Simple average (50/50)
- Divergence 6-15 points: Weighted (55% client, 45% LLM)
- Divergence >15 points: Weighted (60% client, 40% LLM)

### Florida Location Logic

**Beach Zip Codes (82 total):**
- Siesta Key (34235), South Beach (33139), St. Pete Beach (33706), etc.
- Scoring: Prioritize waterfront, pools, flood zones
- Thresholds: Higher price expectations ($250-700/sqft)

**Inland Zip Codes (100+ total):**
- Orlando (32801), Tampa (33606), Coral Gables (33133), etc.
- Scoring: Prioritize schools, crime, walkability
- Thresholds: Lower price expectations ($150-400/sqft)

**Implementation:** `src/lib/florida-location-logic.ts`

---

## 🚀 DEPLOYMENT

### Automatic Deployment

**Every GitHub push triggers Vercel auto-deploy:**
1. Push code to `main` branch
2. Vercel detects changes
3. Builds and deploys automatically
4. Live in ~2-3 minutes

**No manual deployment needed.**

---

## 🔧 DEVELOPMENT

### Local Development
```bash
npm install
npm run dev
```

### Testing
```bash
npm test
```

### Build for Production
```bash
npm run build
```

---

## 📊 FIELD MAPPING

**SOURCE OF TRUTH:** `src/types/fields-schema.ts`

**168 Total Fields:**
- 138 scoreable fields (0-100 scale)
- 30 metadata fields

**Critical fields must match across:**
- `src/types/fields-schema.ts` (SOURCE OF TRUTH)
- `src/lib/field-normalizer.ts`
- `api/property/search.ts`
- `api/property/parse-mls-pdf.ts`

**Verification:** `npx ts-node scripts/verify-field-mapping.ts`

---

## 🎨 FLORIDA-SPECIFIC FEATURES

### Critical Florida Scoring Factors

1. **Flood Zone (Field 119)** - Most critical for insurance costs
   - Zone X: 100 score (~$450/yr)
   - Zone A/AE: 30 score (~$2,500/yr)
   - Zone V/VE: 10 score (~$5,000/yr)

2. **Hurricane Risk (Field 124)** - Impact windows/shutters required

3. **HOA Fees (Field 31)** - Common in FL, heavily impacts affordability

4. **Pool (Field 54)** - Near-mandatory for FL market (100 score if yes)

5. **Waterfront (Field 155)** - Massive premium in coastal areas

6. **Year Built (Field 25)** - Pre-1992 (Hurricane Andrew) vs Post-2002 (FL Building Code)

---

## 📝 LLM PROMPTS

### Master Prompt Template

**File:** `SMART_SCORE_LLM_PROMPT_MASTER.md` (1,931 lines)

Contains:
- All 138 field scoring equations
- Beach vs. inland differentiation
- Industry weights (normalized to 100%)
- JSON output format
- Anti-hallucination rules
- Common mistakes to avoid

**Used by:** `api/property/smart-score-llm-consensus.ts`

---

## 🐛 KNOWN ISSUES

See `SMART_SCORE_ARCHITECTURE.md` for complete list.

**Critical bugs to fix:**
1. Section weights in Compare.tsx sum to 103% (need normalization)
2. Fake score calculator in SearchProperty.tsx (remove)
3. Scores showing before 3-property comparison (fix UI logic)
4. Walk Score parsing errors ("77 - Very Walkable" → 77)

---

## 📚 DOCUMENTATION

- **Architecture:** `SMART_SCORE_ARCHITECTURE.md`
- **Implementation Guide:** `SMART_SCORE_IMPLEMENTATION_COMPLETE.md`
- **LLM Prompts:** `SMART_SCORE_LLM_PROMPT_MASTER.md`
- **Zip Codes:** `FLORIDA_ZIP_CODE_LOGIC.md`
- **Field Mapping:** `FIELD_MAPPING_TRUTH.md`

---

## 🤖 AI ASSISTANT INSTRUCTIONS

### For Claude Code / AI Assistants:

**CRITICAL RULES:**

1. ✅ **ALL API KEYS ARE CONFIGURED** - Never ask about API keys
2. ✅ **ALWAYS COMMIT TO GITHUB** - Every code change must be pushed
3. ✅ **READ THIS FILE FIRST** - Before asking questions about setup
4. ✅ **RESPECT THE SOURCE OF TRUTH** - `fields-schema.ts` is canonical
5. ✅ **TEST BEFORE COMMITTING** - But always commit after testing

**Git workflow is mandatory, not optional.**

---

## 💡 TIPS FOR DEVELOPERS

### When Adding New Features

1. Read relevant architecture docs first
2. Check if API keys are needed (they're already configured)
3. Update field-schema.ts if adding new fields
4. Test with 3 properties on Compare page
5. **Commit to GitHub immediately**
6. Vercel will auto-deploy

### When Debugging

1. Check Vercel logs (not local logs)
2. API keys are in Vercel env vars (not .env files)
3. SMART Score requires 3 properties (not 1 or 2)
4. Beach/inland logic affects scoring thresholds

---

## 📞 SUPPORT

**Repository:** https://github.com/johndesautels1/clues-property-search

**Issues:** Create GitHub issue with:
- What changed
- Error messages
- Expected vs actual behavior
- Steps to reproduce

---

## ⚖️ LICENSE

Proprietary - All Rights Reserved

---

**Last Updated:** 2025-12-27
**Version:** 2.0.0
**SMART Score System:** Fully Implemented
