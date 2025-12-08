# CLUES PROPERTY DASHBOARD - MASTER CONTEXT
**Last Updated**: 2025-12-04
**Purpose**: Core reference for all future conversations - READ THIS FIRST

---

## 🔑 API KEY NAMES (NEVER ASK ABOUT THESE AGAIN)

**CRITICAL - THESE ARE CORRECT IN VERCEL:**
- ✅ **Grok API Key**: `XAI_API_KEY` (NOT `GROK_API_KEY`)
- ✅ **FBI Crime API Key**: `FBI_CRIME_API_KEY` (value: `P27MsaAHe4XRlqtem65e3MZoTcy9xOZo2C02BTl8`)
- ✅ **Gemini API Key**: `GEMINI_API_KEY`
- ✅ **OpenAI API Key**: `OPENAI_API_KEY`
- ✅ **Anthropic API Key**: `ANTHROPIC_API_KEY`
- ✅ **Perplexity API Key**: `PERPLEXITY_API_KEY`

**ALL KEYS ARE PROPERLY CONFIGURED - DO NOT QUESTION THEM**

---

## 🎯 APP PURPOSE (3 Core Functions)

1. **Search properties via Stellar MLS API** (not yet hooked up)
2. **Save/manage found properties**
3. **Compare up to 3 properties** using Advanced Comparison Analytics

---

## 📊 168-FIELD SYSTEM (SOURCE OF TRUTH)

### **Field Schema Files (NEVER CHANGE THESE):**
- ✅ `src/types/fields-schema.ts` - **MASTER DEFINITION** (168 fields)
- ✅ `src/lib/field-normalizer.ts` - **IMPLEMENTATION** (168 fields, 100% match verified)
- ✅ `FIELD_MAPPING_TRUTH.md` - **REFERENCE DOCUMENT**
- ✅ `FIELD_AUDIT_COMPLETE.md` - **VERIFICATION PROOF**

### **Field Numbering Format:**
```
{field_number}_{field_key}
Examples: 10_listing_price, 17_bedrooms, 35_annual_taxes, 168_exterior_features
```

### **Translation Layers:**
1. **Perplexity**: 76 mappings (grouped → numbered) in `field-normalizer.ts:269`
2. **Grok/Opus/Gemini**: 286 mappings (flat → numbered) in `field-map-flat-to-numbered.ts`

**ALL 168 FIELDS VERIFIED SYNCHRONIZED - DO NOT MODIFY FIELD NUMBERS**

---

## 🏆 DATA SOURCE HIERARCHY (CRITICAL!)

### **TIER 1 - SOURCE OF TRUTH:**
1. Stellar MLS API (not yet hooked up)
2. Stellar MLS PDF Upload (Customer Full Report)

### **TIER 2 - Paid APIs:**
Google Geocode, WalkScore, SchoolDigger, FEMA, AirNow, HowLoud, Weather, FBI Crime

### **TIER 3 - Web Search LLMs (Auto-Run):**
1. Perplexity (primary)
2. Grok (secondary)

### **TIER 4 - Other LLMs (Manual Retry Only):**
Claude Opus, GPT-4, Claude Sonnet, Gemini

**Rule**: Higher tier data NEVER overwritten by lower tier

---

## 📁 PAGE ARCHITECTURE

### **1. Home / PropertyAnalytics**
- Dashboard summary (being refined)
- Recently added/viewed homes

### **2. My Saved Homes**
- Property cards display
- **TODO**: Finalize save mechanism architecture

### **3. Search Property**
- Direct Stellar MLS API search (waiting for API hookup)
- User saves or discards results

### **4. Add Property** (Most Work Done Here)
**Input Methods:**
- ✅ Manual Address Entry (LLMs + APIs populate)
- ✅ URL Scraper (Zillow, Redfin, Realtor.com)
- ✅ CSV Upload
- ✅ PDF Upload (Stellar MLS Customer Full Report - SOURCE OF TRUTH)
- ✅ Text Entry (LLM search)
- ✅ Comments/Notes

### **5. Property Detail**
- View individual property
- ✅ "Enrich with AI" button (Perplexity + Grok)
- ⏳ "Retry with LLM" dropdown (IN PROGRESS)

### **6. Compare Properties**
- Advanced Comparison Analytics
- Up to 3 properties

### **7. Broker Executive Dashboard**
- Broker analytics charts
- **TODO**: Merge with Perplexity Dashboard once data consistent

### **8. Perplexity Analytics Dashboard**
- Perplexity data charts
- **TODO**: Merge with Broker Dashboard

---

## ✅ WHAT'S ALREADY WORKING

### **Field System:**
- ✅ All 168 fields synchronized across codebase
- ✅ Perplexity translation (76 mappings)
- ✅ Backend translation (286 mappings)
- ✅ Field normalization (`normalizeToProperty()`)
- ✅ Arbitration pipeline (data merging with tier hierarchy)

### **Data Retrieval:**
- ✅ SSE streaming (real-time progress, partial data capture)
- ✅ Perplexity + Grok auto-execution
- ✅ All 8 paid APIs working
- ✅ Timeout handling (52s LLM, 55s Vercel)
- ✅ Field counting (excludes nulls/N/A)

### **Frontend:**
- ✅ Add Property modal (all 6 input methods)
- ✅ Property Detail view
- ✅ Partial data saving on timeout
- ✅ Property cards display

### **Backend:**
- ✅ `/api/property/search-stream` - SSE endpoint
- ✅ `/api/property/retry-llm` - Retry endpoint (exists, ready to use)
- ✅ Arbitration with conflict resolution
- ✅ Single-source hallucination detection

---

## 🔧 CURRENT WORK IN PROGRESS

### **Task: Manual LLM Retry Dropdown**
**File**: `src/pages/PropertyDetail.tsx`

**What to Build:**
1. Add dropdown to "Retry with LLM" button
2. Show 4 disabled LLMs: Claude Opus, GPT-4, Claude Sonnet, Gemini
3. User selects ONE
4. Call `/api/property/retry-llm` with selected engine
5. Merge returned data with existing property

**Why**: Avoid timeouts by only running 2 LLMs initially, allow user to manually trigger others

---

## 📋 TODO LIST (Priority Order)

### **HIGH PRIORITY:**
1. ⏳ Implement manual LLM retry dropdown (IN PROGRESS)
2. 🔴 Hook up Stellar MLS API (data source tier 1)
3. 🔴 Finalize "My Saved Homes" save mechanism

### **MEDIUM PRIORITY:**
4. 🟡 Merge Broker + Perplexity dashboards (waiting for data consistency)
5. 🟡 Refine Home/PropertyAnalytics dashboard summary
6. 🟡 Test all 6 Add Property input methods thoroughly

### **LOW PRIORITY:**
7. 🟢 Remove diagnostic console.log statements (field-normalizer.ts)
8. 🟢 Optimize translation map performance
9. 🟢 Add UI for partial data indicator

---

## ⚠️ CRITICAL RULES - NEVER VIOLATE

### **1. Field Numbers**
- NEVER change field numbers in `fields-schema.ts`
- NEVER change `field-normalizer.ts` field mappings
- Always use format: `{num}_{key}`

### **2. Data Hierarchy**
- Stellar MLS data ALWAYS wins
- Paid APIs > LLMs
- Higher tier NEVER overwritten by lower tier

### **3. Streaming (Added Yesterday)**
- `/search-stream` endpoint used for URL/Address/Text modes
- DO NOT revert to `/search` endpoint
- Partial data capture is CRITICAL for timeout handling

### **4. LLM Execution**
- Auto-run: Perplexity + Grok ONLY
- Manual: Other 4 LLMs via dropdown
- NEVER run all 6 in parallel (causes timeouts)

### **5. Translation Layers**
- Perplexity uses grouped names → translate in frontend
- Grok/Opus/Gemini use flat names → translate in backend
- DO NOT bypass translation

---

## 🗂️ KEY FILES & LOCATIONS

### **Schema & Mapping:**
- `src/types/fields-schema.ts` - Field definitions (168)
- `src/lib/field-normalizer.ts` - Normalization + Perplexity translation
- `src/lib/field-map-flat-to-numbered.ts` - Backend translation (286 mappings)

### **Backend APIs:**
- `api/property/search-stream.ts` - SSE endpoint (primary)
- `api/property/search.ts` - JSON endpoint (legacy, not used)
- `api/property/retry-llm.ts` - Manual LLM retry endpoint
- `api/property/arbitration.ts` - Data merging logic
- `api/property/free-apis.ts` - 8 paid API integrations

### **Frontend Pages:**
- `src/pages/AddProperty.tsx` - Add property modal (6 input methods)
- `src/pages/PropertyDetail.tsx` - Property detail view + Enrich
- `src/pages/Dashboard.tsx` - Home/PropertyAnalytics
- `src/pages/Compare.tsx` - Comparison analytics

### **Reference Docs:**
- `FIELD_MAPPING_TRUTH.md` - Field number reference
- `FIELD_AUDIT_COMPLETE.md` - Verification proof (automated)
- `README.md` - This file (read first)

---

## 🔍 VERIFICATION COMMANDS

### **Check Field Sync:**
```bash
node -e "/* Script that compares fields-schema.ts and field-normalizer.ts */"
# Should show 168/168 ✅
```

### **Count Translation Maps:**
```bash
# Perplexity: Should be 76
grep -c "'.*':" src/lib/field-normalizer.ts

# Backend: Should be 286
grep -c "'.*':" src/lib/field-map-flat-to-numbered.ts
```

### **Find All Field Users:**
```bash
grep -r "FIELD_TO_PROPERTY_MAP\|ALL_FIELDS" --include="*.ts" --include="*.tsx" -l
```

---

## 💡 COMMON MISTAKES TO AVOID

1. ❌ Changing field numbers → Breaks entire system
2. ❌ Running all 6 LLMs in parallel → Timeout
3. ❌ Bypassing arbitration pipeline → Loses tier hierarchy
4. ❌ Ignoring translation layers → 66-82 fields won't map
5. ❌ Reverting to `/search` endpoint → Loses streaming benefits
6. ❌ Not passing `existingFields` on retry → Overwrites data

---

## 📞 USER'S CONTEXT

**User is**: Real estate broker
**Use case**: Analyze properties, compare up to 3, use MLS data as source of truth
**Pain point**: Data consistency, timeouts, field mapping issues
**Yesterday's work**: 16 hours synchronizing all 168 fields across codebase
**Today's work**: Fixed Perplexity field mapping, verified all 168 fields

---

## 🚀 NEXT CONVERSATION STARTUP

**When starting a new conversation, read:**
1. This file (README.md) - Overview
2. FIELD_MAPPING_TRUTH.md - Field reference
3. TODO list in this file - What needs to be done

**Always verify:**
- Are we modifying field numbers? (NEVER do this)
- Are we respecting data hierarchy? (Stellar MLS > APIs > LLMs)
- Are we using correct endpoint? (/search-stream, not /search)

---

**Last verified**: 2025-12-02 - All 168 fields synchronized, streaming working, Perplexity translation added
