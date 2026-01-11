# Cascade & Success Meter Architecture Audit
**Date:** 2026-01-11
**Status:** 🔴 **5 CRITICAL ARCHITECTURAL ISSUES FOUND**
**Scope:** UI Success Meter, LLM Cascade Logic, Real-Time Progress

---

## Executive Summary

Audited success meter UI and cascade orchestration logic per user's concerns:
- ❌ "If one LLM fails, the cascade below it does not appear to run"
- ❌ "If the LLM is not completely successful, none of the fields it gathers populate"
- ❌ "Why do we not have a real success meter in real time"

**CRITICAL FINDING:** The backend cascade logic is CORRECT (uses `Promise.allSettled`, continues on failures, uses partial results), but the UI is NOT using the real-time streaming endpoint. The "success meter" is a **POST-FACTO ANIMATION** that replays what already happened, not a real-time tracker.

---

## Architecture Analysis

### Current Data Flow (BROKEN)

```
User submits address
    ↓
PropertySearchForm.tsx (line 293)
    ↓
fetch('/api/property/search') ← NON-STREAMING JSON ENDPOINT
    ↓
search.ts runs ENTIRE cascade (30-120 seconds)
    ├─ Stellar MLS
    ├─ Google APIs
    ├─ Tier 3 APIs (SchoolDigger, WalkScore, etc.)
    ├─ Perplexity (5 prompts sequentially)
    ├─ Gemini, GPT, Sonnet, Grok, Opus (parallel)
    └─ Backend calculations
    ↓
WAIT 30-120 seconds... ← USER SEES NOTHING
    ↓
ONE BIG JSON RESPONSE RETURNED
    ↓
PropertySearchForm.tsx receives response (line 303)
    ↓
SearchProgressTracker ANIMATES the final llm_responses array
    ↓
User THINKS they saw "real-time" but it's just post-facto replay
```

### Ideal Data Flow (NOT IMPLEMENTED)

```
User submits address
    ↓
PropertySearchForm.tsx
    ↓
fetch('/api/property/search-stream') ← SSE STREAMING ENDPOINT (EXISTS BUT UNUSED!)
    ↓
REAL-TIME Server-Sent Events:
    - event: progress { source: "stellar-mls", status: "searching", fieldsFound: 0 }
    - event: progress { source: "stellar-mls", status: "complete", fieldsFound: 47 }
    - event: progress { source: "perplexity", status: "searching", fieldsFound: 0 }
    - event: progress { source: "perplexity", status: "complete", fieldsFound: 12 }
    - event: progress { source: "gemini", status: "error", error: "timeout" }
    - event: progress { source: "gpt", status: "complete", fieldsFound: 8 }
    ↓
SearchProgressTracker updates LIVE as each source completes
    ↓
User sees ACTUAL progress bars moving, sources lighting up, field counts incrementing
```

---

## 🐛 BUG #1: UI Uses Non-Streaming Endpoint

**Location:** `src/components/property/PropertySearchForm.tsx` line 293

**Problem:**
```typescript
// CURRENT (WRONG - No real-time updates):
fetch(`${API_BASE}/search`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body,
}).then(async response => {
  const data = await response.json(); // ← Waits for ENTIRE cascade to finish
  // ... update UI AFTER the fact
});
```

**Why This Is Wrong:**
- `/api/property/search` returns ONE big JSON response at the end
- User waits 30-120 seconds seeing NOTHING
- "Success meter" animates AFTER cascade completes (illusion of real-time)
- If cascade hangs, user has NO IDEA which source is stuck

**Impact:**
- User experiences: "The UI just freezes, I don't know what's happening"
- Vercel logs show cascade running, but UI shows nothing until final response
- User thinks LLMs aren't running because they can't see progress

**Fix:**
```typescript
// CORRECT - Use SSE streaming endpoint:
const eventSource = new EventSource(`${API_BASE}/search-stream?address=${encodeURIComponent(addressInput)}`);

eventSource.addEventListener('progress', (e) => {
  const data = JSON.parse(e.data);
  // Update SearchProgressTracker IN REAL-TIME
  updateSource(data.source, {
    status: data.status,
    fieldsFound: data.fieldsFound,
    error: data.error
  });
  setLiveFieldsFound(data.totalFieldsSoFar);
});

eventSource.addEventListener('complete', (e) => {
  const finalData = JSON.parse(e.data);
  // Final response with all fields
  setSearchResults(finalData);
  eventSource.close();
});

eventSource.addEventListener('error', (e) => {
  console.error('SSE error:', e);
  eventSource.close();
});
```

---

## 🐛 BUG #2: search-stream.ts Exists But Is Disconnected

**Location:** `api/property/search-stream.ts`

**Problem:**
- File exists and implements SSE streaming
- Lines 76-85: Sends `progress` events for each source
- Line 87-89: Imports and wraps working `search.ts`
- **BUT NOBODY CALLS THIS ENDPOINT**

**Why This Exists:**
```typescript
// api/property/search-stream.ts lines 1-7
/**
 * SSE Streaming wrapper for search.ts
 * Provides real-time progress updates by wrapping the working search.ts endpoint
 *
 * This endpoint wraps the fully-functional search.ts to provide Server-Sent Events (SSE)
 * for real-time progress tracking while maintaining 100% identical data sources.
 */
```

**Status:** ✅ Code exists, ❌ Never called by UI

**Fix:** Update PropertySearchForm to use `/api/property/search-stream` instead of `/api/property/search`

---

## 🐛 BUG #3: Success Meter is Post-Facto Animation, Not Real-Time

**Location:** `src/components/property/SearchProgressTracker.tsx` + `PropertySearchForm.tsx`

**Problem:**
```typescript
// PropertySearchForm.tsx line 189-274
setSourcesProgress(prev => prev.map(source => {
  // ... maps llm_responses AFTER cascade completes
}));
```

**How It Works Now (FAKE REAL-TIME):**
1. Cascade runs (30-120 seconds)
2. Returns `llm_responses: [{ llm: "perplexity", fields_found: 12 }, ...]`
3. UI REPLAYS the results with animations
4. User THINKS they saw real-time progress

**Why This Is Misleading:**
- SearchProgressTracker animates `status: 'searching'` AFTER it already completed
- Loader spinners show AFTER the LLM finished
- Field count increments AFTER all data arrived
- If an LLM times out, user sees nothing for 60 seconds, THEN sees "error"

**Real-Time Meter Requirements:**
- Show source status change WHEN IT HAPPENS (not after)
- Show field count increment AS EACH FIELD IS FOUND (not at the end)
- Show errors IMMEDIATELY when they occur
- Show timeout warnings at 30s, 45s, 60s (not just final timeout)

---

## 🐛 BUG #4: Cascade DOES Continue on Failures (Backend Correct, UI Misleading)

**Location:** `api/property/search.ts` lines 5504-5520

**Backend Code (CORRECT):**
```typescript
// Lines 5504-5520
const parallelPromises = parallelLlms.map(llm => {
  return withTimeout(
    llm.fn(realAddress),
    LLM_TIMEOUT,
    { fields: {}, error: 'timeout' }
  ).then(result => {
    console.log(`  ${llm.id} completed - found ${Object.keys(result?.fields || {}).length} fields`);
    return result;
  }).catch(err => {
    console.log(`  ${llm.id} failed: ${err}`);
    throw err; // ← This throw is caught by Promise.allSettled
  });
});
const parallelResults = await Promise.allSettled(parallelPromises); // ← KEY!
```

**Why This Is Correct:**
- `Promise.allSettled()` waits for ALL promises to settle (fulfill OR reject)
- If Gemini fails, GPT/Sonnet/Grok/Opus still run
- If one times out, others continue
- Failures are logged but don't stop cascade

**User's Perception (INCORRECT):**
> "The way our application is setup if one LLM fails the cascade below it does not appear to run"

**Why User Thinks This:**
- UI shows nothing during cascade execution
- Vercel logs show LLM failures, but UI never updates
- When cascade finishes, `llm_responses` shows: `{ llm: "gemini", success: false, error: "timeout" }`
- User ASSUMES cascade stopped because they didn't see other LLMs run
- **REALITY:** Other LLMs DID run, but UI doesn't show progress

**Root Cause:** No real-time progress = user can't see cascade continuing after failure

---

## 🐛 BUG #5: Partial Fields ARE Used (Backend Correct, User Doesn't Know)

**Location:** `api/property/search.ts` lines 5556-5624

**Backend Code (CORRECT):**
```typescript
// Lines 5556-5605
if (llmFields && rawFieldCount > 0) {
  const formattedFields: Record<string, FieldValue> = {};
  let skippedNulls = 0;
  let invalidKeys = 0;

  for (const [key, value] of Object.entries(llmFields)) {
    // Skip null/empty responses
    if (fieldValue === null || fieldValue === undefined || fieldValue === '' || fieldValue === 'Not available') {
      skippedNulls++;
      continue; // ← Skips null, CONTINUES processing other fields
    }

    // Validate field key format
    if (!/^\d+_/.test(key)) {
      invalidKeys++;
      continue; // ← Skips invalid key, CONTINUES processing
    }

    // Add valid field to formattedFields
    formattedFields[key] = { value: fieldValue, source: llm.id, tier: llmTier };
  }

  // Add ALL valid fields to pipeline
  newUniqueFields = arbitrationPipeline.addFieldsFromSource(formattedFields, llmSourceNames[llm.id]);
  console.log(`✅ ${llm.id}: ${rawFieldCount} returned, ${skippedNulls} nulls skipped, ${newUniqueFields} new unique added`);
}
```

**Why This Is Correct:**
- LLM returns 20 fields, 8 are null → 12 valid fields ARE USED
- LLM returns 10 fields, 2 have invalid keys → 8 valid fields ARE USED
- Partial results are ACCUMULATED via arbitration pipeline
- Nulls are skipped, but valid fields are kept

**User's Perception (INCORRECT):**
> "If the LLM is not completely successful none of the fields it gathers populate"

**Why User Thinks This:**
- UI success meter shows "12 fields found" AFTER cascade completes
- User doesn't see: "Perplexity found field 169... field 170... field 171..."
- User only sees final count, assumes all-or-nothing
- Vercel logs show field-by-field processing, but UI doesn't

**Root Cause:** No real-time field count = user doesn't see incremental population

---

## Cascade Orchestration Analysis

### ✅ What's CORRECT (Backend Logic)

**1. Promise.allSettled Usage (Lines 5518)**
```typescript
const parallelResults = await Promise.allSettled(parallelPromises);
```
✅ All LLMs run in parallel
✅ Failures don't stop others
✅ Timeouts are caught and logged

**2. Timeout Fallback (Lines 5506-5510)**
```typescript
withTimeout(
  llm.fn(realAddress),
  LLM_TIMEOUT,
  { fields: {}, error: 'timeout' } // ← Fallback on timeout
)
```
✅ LLM times out → returns empty fields, cascade continues

**3. Sequential Processing (Lines 5526-5654)**
```typescript
for (let idx = 0; idx < llmResults.length; idx++) {
  // Process results sequentially to avoid race conditions
}
```
✅ Results processed in order (Perplexity → Gemini → GPT → Sonnet → Grok → Opus)
✅ Arbitration pipeline applies tier priority correctly

**4. Partial Result Handling (Lines 5562-5605)**
```typescript
for (const [key, value] of Object.entries(llmFields)) {
  if (fieldValue === null) {
    skippedNulls++;
    continue; // ← Skip nulls, keep processing
  }
  formattedFields[key] = { value: fieldValue, ... };
}
```
✅ Nulls skipped, valid fields used
✅ Invalid keys skipped, valid fields used

**5. Error Logging (Lines 5608-5653)**
```typescript
} catch (pipelineError) {
  console.error(`CRASH FIX #7: LLM pipeline error for ${llm.id}:`, pipelineError);
}
```
✅ Errors caught and logged
✅ Pipeline continues even if one LLM crashes

### ❌ What's BROKEN (UI Communication)

**1. No Real-Time Progress Events**
- Backend logs progress to console
- UI gets NOTHING until final response
- User sees: "Searching... [30 seconds] ...done!"
- User doesn't see: "MLS: 47 fields, Perplexity: 12 fields, Gemini: error, GPT: 8 fields..."

**2. No Incremental Field Updates**
- Backend adds fields one by one to arbitration pipeline
- UI gets final count only
- User doesn't see fields populate in real-time

**3. No Timeout Warnings**
- Backend waits up to 60s for LLMs
- User sees nothing for 60 seconds
- User assumes app crashed

**4. No Source-Specific Error Messages**
- Gemini times out → logged to Vercel, NOT shown in UI
- User clicks away, assuming search failed
- Search actually succeeded with other LLMs

---

## search-stream.ts Analysis

### What It Does (Lines 1-100)

```typescript
// Lines 20-36: Set up SSE headers
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');

// Lines 76-85: Send initial progress events
allSources.forEach(source => {
  sendEvent(res, 'progress', {
    source,
    status: 'searching',
    fieldsFound: 0,
    totalFieldsSoFar: 0
  });
});

// Lines 87-89: Call working search.ts
const searchModule = await import('./search.js');
const searchHandler = searchModule.default;

// Lines 92-99: Capture search.ts JSON result
const mockRes = {
  status: (code: number) => mockRes,
  json: (data: any) => {
    searchResult = data;
    return mockRes;
  },
};
```

**Status:** ✅ File exists and wraps search.ts correctly

**Problem:** ❌ Doesn't inject progress events DURING search.ts execution

**Why:** search-stream.ts sends initial "searching" events, then calls search.ts, then sends final "complete" event. It doesn't intercept progress DURING execution because search.ts doesn't emit progress events.

---

## Improvement Plan

### Option 1: Modify search.ts to Emit SSE Events (RECOMMENDED)

**Approach:**
1. Add optional `res` parameter to search.ts
2. Detect if response headers include SSE
3. Emit `progress` events at key points:
   - After Stellar MLS completes
   - After each Tier 3 API completes
   - After each Perplexity prompt completes
   - After each parallel LLM completes
   - After backend calculations complete

**Benefits:**
- Real-time progress tracking
- User sees exactly which source is running
- User sees field count increment live
- Timeouts visible in real-time

**Implementation:**
```typescript
// In search.ts, add helper:
function sendProgress(res: any, source: string, status: string, fieldsFound: number, totalSoFar: number) {
  if (res.write && res.getHeader('Content-Type') === 'text/event-stream') {
    res.write(`event: progress\n`);
    res.write(`data: ${JSON.stringify({ source, status, fieldsFound, totalSoFar })}\n\n`);
  }
}

// After Stellar MLS:
if (mlsAdded > 0) {
  sendProgress(res, 'stellar-mls', 'complete', mlsAdded, arbitrationPipeline.getFieldCount());
}

// After each Perplexity prompt:
sendProgress(res, llm.id, 'complete', Object.keys(llmData.fields || {}).length, arbitrationPipeline.getFieldCount());

// After each parallel LLM:
sendProgress(res, llm.id, 'complete', rawFieldCount, arbitrationPipeline.getFieldCount());
```

### Option 2: Modify search-stream.ts to Poll search.ts State (NOT RECOMMENDED)

**Approach:**
- search-stream.ts calls search.ts in background
- Polls internal state every 1-2 seconds
- Sends progress events based on polling

**Problems:**
- Requires search.ts to expose state
- Polling adds overhead
- Progress updates delayed by 1-2 seconds

### Option 3: Use Separate WebSocket Connection (OVERKILL)

**Approach:**
- Maintain WebSocket connection
- search.ts sends progress via WebSocket
- UI subscribes to WebSocket

**Problems:**
- Requires WebSocket server
- More complex architecture
- Overkill for one-way progress updates

---

## Recommended Fixes

### Fix #1: Add SSE Support to search.ts

**File:** `api/property/search.ts`

**Changes:**
1. Add `sendProgress()` helper function
2. Emit `progress` events after each major source:
   - Line ~4932: After Stellar MLS
   - Line ~5100: After Tier 3 APIs
   - Line ~5478: After each Perplexity prompt
   - Line ~5610: After each parallel LLM
   - Line ~5680: After backend calculations
3. Detect SSE mode via headers

### Fix #2: Update PropertySearchForm to Use SSE

**File:** `src/components/property/PropertySearchForm.tsx`

**Changes:**
1. Replace `fetch()` with `EventSource`
2. Listen for `progress` events
3. Update SearchProgressTracker in real-time
4. Listen for `complete` event for final data

### Fix #3: Update SearchProgressTracker for Real-Time Updates

**File:** `src/components/property/SearchProgressTracker.tsx`

**Changes:**
1. Add `isLiveMode` prop (true for SSE, false for post-facto)
2. If live mode, update sources immediately as events arrive
3. If post-facto mode (backward compat), animate replay

### Fix #4: Add Timeout Warnings

**File:** `api/property/search.ts`

**Changes:**
1. At 30s mark, send warning event: `{ source: "gpt", status: "warning", message: "Taking longer than usual..." }`
2. At 45s mark, send timeout warning
3. At 60s timeout, send error event immediately

---

## Testing Plan

### Test Case 1: Real-Time Progress Display

**Before Fix:**
1. Search property with Address mode
2. UI shows generic "Searching..." for 30-120 seconds
3. Suddenly, all sources show complete with field counts
4. User thinks: "Did it freeze? Is it working?"

**After Fix:**
1. Search property with Address mode
2. UI shows: "Stellar MLS: Searching..." [3s] → "Complete: 47 fields"
3. UI shows: "Perplexity: Searching..." [5s] → "Complete: 12 fields"
4. UI shows: "Gemini: Searching..." [30s] → "Timeout: 0 fields"
5. UI shows: "GPT: Searching..." [8s] → "Complete: 8 fields"
6. User sees EXACTLY what's happening in real-time

### Test Case 2: Cascade Continues After Failure

**Before Fix:**
1. Gemini times out
2. User sees nothing for 60 seconds
3. Final response shows: gemini: 0 fields, gpt: 8 fields, sonnet: 5 fields
4. User can't tell if cascade continued or not

**After Fix:**
1. Gemini times out
2. At 30s: "Gemini: Taking longer than usual..."
3. At 60s: "Gemini: Timeout (0 fields)"
4. Immediately: "GPT: Searching..."
5. After 8s: "GPT: Complete (8 fields)"
6. User SEES cascade continuing despite Gemini failure

### Test Case 3: Partial Fields Population

**Before Fix:**
1. Perplexity returns 20 fields, 8 are null
2. Final response shows: "Perplexity: 12 fields found"
3. User assumes: "Perplexity only searched for 12 fields"

**After Fix:**
1. Perplexity returns 20 fields, 8 are null
2. Real-time events:
   - "Perplexity: Found field 169_months_of_inventory"
   - "Perplexity: Found field 170_new_listings_30d"
   - "Perplexity: Skipped field 16a_zestimate (null)"
   - ...
   - "Perplexity: Complete (12 valid fields, 8 nulls skipped)"
3. User sees EXACTLY what was found and what was skipped

---

## Summary

**Backend Cascade Logic:** ✅ 100% CORRECT
- Uses Promise.allSettled()
- Continues on failures
- Uses partial results
- Handles timeouts gracefully
- Logs everything to Vercel

**UI Progress Tracking:** ❌ 100% BROKEN
- Uses non-streaming endpoint
- Shows post-facto animations
- User sees nothing for 30-120 seconds
- User assumes failures stop cascade (they don't)
- User assumes partial results rejected (they're not)

**Root Cause:** Disconnect between backend capabilities (working) and UI consumption (not using streaming)

**Fix Complexity:**
- Backend changes: MEDIUM (add SSE progress events at 6 locations)
- Frontend changes: LOW (replace fetch with EventSource, wire up events)
- Testing: MEDIUM (verify all 26 sources emit progress correctly)

---

**Document Status:** READY FOR IMPLEMENTATION
**Next Steps:**
1. Implement SSE progress events in search.ts
2. Update PropertySearchForm to use EventSource
3. Update SearchProgressTracker for live updates
4. Test with all data sources
5. Add timeout warnings for slow LLMs

**Estimated Effort:** 4-6 hours implementation + 2-3 hours testing
