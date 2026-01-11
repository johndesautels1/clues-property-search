# ABORT CONTROLLER FIX PLAN

**Created:** 2026-01-10
**Conversation ID:** CLUES-IMPL-2026-0110-A
**Status:** IN PROGRESS - Ready for implementation

---

## THE PROBLEM

The LLM cascade **hangs** after Gemini completes and before GPT returns data. The Vercel console simply STOPS - no error message, no timeout, nothing. This happens because:

1. The `fetch()` calls to LLM APIs have **NO AbortController**
2. The `withTimeout()` wrapper only races a timer - it does NOT cancel the actual fetch
3. When OpenAI (or any LLM) doesn't respond, the fetch hangs forever
4. Eventually Vercel's 300s limit kills the entire function

---

## FIX ALREADY APPLIED

**File:** `api/property/search.ts`
**Lines:** 4024-4030
**Change:** Added try/catch around `JSON.parse(toolCall.function.arguments)` in GPT tool calls handler

```typescript
// BEFORE (could crash)
const args = JSON.parse(toolCall.function.arguments || '{}');

// AFTER (safe)
let args: { query?: string; num_results?: number } = {};
try {
  args = JSON.parse(toolCall.function.arguments || '{}');
} catch (parseErr) {
  console.error(`❌ [GPT] Failed to parse tool call arguments: ${parseErr}`);
  continue;
}
```

---

## COMPLETE FETCH AUDIT (80 total calls across 17 files)

### FILES THAT ALREADY HAVE AbortController:

| File | Line | API | Status |
|------|------|-----|--------|
| api/property/llm-client.ts | 36 | Perplexity | ✅ Done |
| api/property/multi-llm-forecast.ts | 760 | Perplexity | ✅ Done |
| api/property/smart-score-llm-consensus.ts | 170 | Perplexity | ✅ Done |
| api/property/tavily-field-fetcher.ts | 183 | Tavily | ✅ Done |
| src/lib/smart-score-weight-research.ts | 372 | Perplexity | ✅ Done |
| src/services/llmClient.ts | 36 | Perplexity | ✅ Done |

**Total with AbortController: 6 calls**

---

### FILES NEEDING AbortController (DO NOT TOUCH PERPLEXITY):

#### 1. api/property/search.ts (11 LLM calls)

| Line | API | Function | Timeout |
|------|-----|----------|---------|
| 2467 | Perplexity | callPerplexity | **SKIP - DO NOT MODIFY** |
| 3688 | Anthropic | callClaudeSonnet | 60000ms |
| 3747 | Anthropic | callClaudeSonnet (tool result) | 60000ms |
| 3863 | OpenAI | callCopilot | 60000ms |
| 3980 | OpenAI | callGPT5 | 60000ms |
| 4045 | OpenAI | callGPT5 (tool result) | 60000ms |
| 4176 | OpenAI | callGPT5FieldAuditor | 60000ms |
| 4379 | Tavily | callTavilySearch | 30000ms |
| 4430 | xAI | callGrok | 60000ms |
| 4473 | xAI | callGrok (tool result) | 60000ms |
| 4534 | Gemini | callGemini | 60000ms |

**Needs fix: 10 calls (skip Perplexity)**

#### 2. api/property/retry-llm.ts (8 LLM calls)

| Line | API | Function | Timeout |
|------|-----|----------|---------|
| 753 | Perplexity | callPerplexity | **SKIP - DO NOT MODIFY** |
| 941 | Tavily | (Grok helper) | 30000ms |
| 990 | xAI | callGrok | 60000ms |
| 1039 | xAI | callGrok (tool result) | 60000ms |
| 1125 | Anthropic | callClaudeOpus | 60000ms |
| 1299 | OpenAI | callGPT5 | 60000ms |
| 1465 | Anthropic | callClaudeSonnet | 60000ms |
| 1550 | Gemini | callGemini | 60000ms |

**Needs fix: 7 calls (skip Perplexity)**

#### 3. api/property/multi-llm-forecast.ts (6 LLM calls)

| Line | API | Function | Timeout |
|------|-----|----------|---------|
| 578 | OpenAI | callGPT5Forecast | 60000ms |
| 644 | Gemini | callGeminiForecast | 60000ms |
| 762 | Perplexity | callPerplexityForecast | **ALREADY HAS AbortController** |
| 1020 | Tavily | (Grok helper) | 30000ms |
| 1074 | xAI | callGrokForecast | 60000ms |
| 1126 | xAI | callGrokForecast (tool result) | 60000ms |

**Needs fix: 5 calls**

#### 4. api/property/smart-score-llm-consensus.ts (7 LLM calls)

| Line | API | Function | Timeout |
|------|-----|----------|---------|
| 172 | Perplexity | callPerplexity | **ALREADY HAS AbortController** |
| 231 | Anthropic | callClaudeOpus | 60000ms |
| 381 | OpenAI | callGPT5 | 60000ms |
| 481 | Tavily | (Grok helper) | 30000ms |
| 532 | xAI | callGrok | 60000ms |
| 585 | xAI | callGrok (tool result) | 60000ms |
| 640 | Gemini | callGemini | 60000ms |

**Needs fix: 6 calls**

#### 5. api/property/parse-mls-pdf.ts (1 LLM call)

| Line | API | Function | Timeout |
|------|-----|----------|---------|
| 899 | Anthropic | parsePDF | 60000ms |

**Needs fix: 1 call**

#### 6. api/property/tavily-search.ts (1 call)

| Line | API | Function | Timeout |
|------|-----|----------|---------|
| 59 | Tavily | searchTavily | 30000ms |

**Needs fix: 1 call**

#### 7. api/property/fetch-tavily-field.ts (2 calls)

| Line | API | Function | Timeout |
|------|-----|----------|---------|
| 193 | Tavily | searchTavily | 30000ms |
| 332 | Anthropic | extractWithClaude | 60000ms |

**Needs fix: 2 calls**

#### 8. src/api/scraper.ts (1 LLM call)

| Line | API | Function | Timeout |
|------|-----|----------|---------|
| 219 | OpenAI | parseWithGPT | 60000ms |

**Needs fix: 1 call**

#### 9. api/property/llm-client.ts (1 call needs fix)

| Line | API | Function | Timeout |
|------|-----|----------|---------|
| 40 | Perplexity | callPerplexity | **ALREADY HAS AbortController** |
| 109 | Anthropic | callClaudeOpus | 60000ms |

**Needs fix: 1 call**

#### 10. src/services/llmClient.ts (1 call needs fix)

| Line | API | Function | Timeout |
|------|-----|----------|---------|
| 40 | Perplexity | callPerplexity | **ALREADY HAS AbortController** |
| 109 | Anthropic | callClaudeOpus | 60000ms |

**Needs fix: 1 call**

---

### NON-LLM FILES (Lower Priority - County/MLS APIs)

| File | Lines | APIs | Timeout |
|------|-------|------|---------|
| api/property/census.ts | 53 | Census API | 30000ms |
| api/property/florida-counties.ts | 44,61,75,86,215,279,314,358,393,493,585 | County scrapers | 30000ms |
| api/property/search-by-mls.ts | 77, 157 | Bridge MLS | 15000ms |
| src/api/county-client.ts | 106 | County API | 30000ms |
| src/lib/bridge-api-client.ts | 318,506,883,936 | Bridge MLS | 15000ms |
| src/lib/safe-json-parse.ts | 432 | Generic fetch | 30000ms |

---

## TIMEOUT VALUES (From search.ts)

```typescript
const STELLAR_MLS_TIMEOUT = 15000;  // 15s for Bridge MLS
const FREE_API_TIMEOUT = 30000;     // 30s for free APIs
const TAVILY_TIMEOUT = 30000;       // 30s for Tavily
const LLM_TIMEOUT = 60000;          // 60s for GPT, Claude, Grok, Gemini
const PERPLEXITY_TIMEOUT = 45000;   // 45s for Perplexity (DO NOT MODIFY)
```

---

## IMPLEMENTATION PATTERN

For each fetch call that needs AbortController:

```typescript
// BEFORE
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify({ ... }),
});

// AFTER
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 60000); // Use appropriate timeout

try {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { ... },
    body: JSON.stringify({ ... }),
    signal: controller.signal,  // ADD THIS
  });
  clearTimeout(timeoutId);

  // ... rest of existing code ...

} catch (error) {
  clearTimeout(timeoutId);
  if (error.name === 'AbortError') {
    console.error('❌ [GPT] Request timed out after 60s');
    return { error: 'Request timed out', fields: {}, llm: 'GPT' };
  }
  throw error;
}
```

---

## IMPLEMENTATION ORDER

1. **api/property/search.ts** - 10 calls (HIGHEST PRIORITY - main cascade)
2. **api/property/retry-llm.ts** - 7 calls (retry endpoint)
3. **api/property/multi-llm-forecast.ts** - 5 calls
4. **api/property/smart-score-llm-consensus.ts** - 6 calls
5. **api/property/parse-mls-pdf.ts** - 1 call
6. **api/property/tavily-search.ts** - 1 call
7. **api/property/fetch-tavily-field.ts** - 2 calls
8. **api/property/llm-client.ts** - 1 call
9. **src/services/llmClient.ts** - 1 call
10. **src/api/scraper.ts** - 1 call

**Total LLM calls to fix: 35**

---

## CRITICAL RULES

1. **DO NOT MODIFY PERPLEXITY CALLS** - They already have AbortController
2. **Use existing timeout constants** - Don't create new ones
3. **Add timeout constants to files that don't have them** - Copy from search.ts
4. **Test after each file** - Run `npm run build` to verify TypeScript compiles
5. **Don't change response formats** - Only add timeout protection

---

## VERIFICATION CHECKLIST

After implementing:

- [ ] `npm run build` passes with zero errors
- [ ] All 35 LLM calls have AbortController
- [ ] Perplexity calls were NOT modified
- [ ] Timeout values match the constants above
- [ ] Console logs show timeout messages when LLMs hang

---

## FILES REFERENCE

```
D:\Clues_Quantum_Property_Dashboard\
├── api/property/
│   ├── search.ts              # 10 calls to fix
│   ├── retry-llm.ts           # 7 calls to fix
│   ├── multi-llm-forecast.ts  # 5 calls to fix
│   ├── smart-score-llm-consensus.ts  # 6 calls to fix
│   ├── parse-mls-pdf.ts       # 1 call to fix
│   ├── tavily-search.ts       # 1 call to fix
│   ├── fetch-tavily-field.ts  # 2 calls to fix
│   └── llm-client.ts          # 1 call to fix
├── src/
│   ├── services/llmClient.ts  # 1 call to fix
│   └── api/scraper.ts         # 1 call to fix
└── ABORT_CONTROLLER_FIX_PLAN.md  # THIS FILE
```

---

## PROMPT FOR NEW CONVERSATION

```
Read D:\Clues_Quantum_Property_Dashboard\ABORT_CONTROLLER_FIX_PLAN.md

This file contains the complete plan for adding AbortController to all LLM fetch calls.
The problem: LLM cascade hangs because fetch() calls have no timeout/abort mechanism.

Tasks:
1. Add AbortController to all 35 LLM fetch calls listed in the plan
2. DO NOT modify Perplexity calls - they already have AbortController
3. Use the timeout values specified (60s for LLMs, 30s for Tavily)
4. Follow the implementation pattern in the plan
5. Run npm run build after each file to verify

Start with api/property/search.ts (10 calls) - this is the main cascade file.
```

---

**END OF PLAN**
