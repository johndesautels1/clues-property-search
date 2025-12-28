# Two-Stage LLM Orchestrator Integration Plan

## Current Flow (api/property/search.ts)

```
1. TIER 1: Stellar MLS Bridge API
   └─ Returns mlsFields → arbitrationPipeline (Tier 1)

2. TIER 2 & 3: enrichWithFreeAPIs()
   ├─ Google APIs (Tier 2)
   ├─ WalkScore, SchoolDigger, FEMA, NOAA, USGS, EPA, etc. (Tier 3)
   └─ Returns enrichedData → arbitrationPipeline (Tier 2 & 3)

3. TIER 4 & 5: LLM Cascade (Perplexity → Grok → Claude Opus → GPT → Sonnet → Gemini)
   ├─ Each LLM fills gaps left by higher tiers
   ├─ Perplexity (Tier 4), Others (Tier 5)
   └─ Returns llmFields → arbitrationPipeline (Tier 4 & 5)

4. FINAL: arbitrationPipeline.getResult()
   └─ Returns arbitrated 168-field schema with tier precedence enforced
```

---

## Proposed Integration

### Option A: Replace Existing LLM Cascade (RECOMMENDED)

**Why**: The new orchestrator already calls Perplexity and Claude Opus in a structured two-stage workflow, making it superior to the existing cascade.

```
1. TIER 1: Stellar MLS Bridge API (UNCHANGED)
2. TIER 2 & 3: enrichWithFreeAPIs() (UNCHANGED)

3. NEW TIER 4 & 5: buildCmaSchema() Orchestrator
   ├─ Stage 1: 7 Parallel Micro-Prompts (Perplexity - Tier 4)
   │   ├─ WalkScore (Fields 74-76)
   │   ├─ Schools (Fields 63-73)
   │   ├─ Crime (Fields 88-90)
   │   ├─ Climate (Fields 117-130)
   │   ├─ Utilities (Fields 104-110, 114)
   │   ├─ ISP (Fields 111-113, 115)
   │   └─ POI Distances (Fields 83-87)
   │
   ├─ Stage 2: Core Schema Normalizer (Claude Opus - Tier 5)
   │   └─ Receives stellarMlsJson + countyJson + paidApisJson + webChunks
   │       Fills all 168 fields WITHOUT hallucination
   │
   └─ Validation Layer (Zod + Forbidden Words)
       └─ Returns validated 168-field schema

4. Feed Results into Arbitration Pipeline:
   ├─ Perplexity micro-prompt results → arbitrationPipeline (Tier 4, source: "Perplexity")
   └─ Claude Opus normalizer results → arbitrationPipeline (Tier 5, source: "Claude Opus")

5. FINAL: arbitrationPipeline.getResult() (UNCHANGED)
```

**Benefits**:
- ✅ Eliminates redundant LLM calls (orchestrator already uses Perplexity + Claude Opus)
- ✅ Structured micro-prompts more reliable than single large prompt
- ✅ Validation layer prevents hallucinations
- ✅ Respects existing tier arbitration (no code changes needed)
- ✅ County data now integrated (countyJson input)

**Drawbacks**:
- ❌ Removes Grok, GPT, Gemini from cascade (but they're Tier 5 anyway, lowest priority)
- ❌ Changes existing LLM flow significantly

---

### Option B: Supplement Existing LLM Cascade

**Why**: Keep existing cascade intact, add orchestrator as additional data source.

```
1-2. TIER 1-3: (UNCHANGED)

3a. NEW: buildCmaSchema() Orchestrator
    └─ Runs in parallel with existing LLM cascade
    └─ Results fed into arbitration as "Perplexity" (Tier 4) and "Claude Opus" (Tier 5)

3b. EXISTING: LLM Cascade (Perplexity → Grok → Claude → GPT → Sonnet → Gemini)
    └─ Continues as-is

4. FINAL: arbitrationPipeline.getResult()
   └─ Now has MORE data sources competing (orchestrator + cascade)
```

**Benefits**:
- ✅ Non-breaking change (existing cascade still runs)
- ✅ More LLM coverage (orchestrator + cascade)

**Drawbacks**:
- ❌ Redundant LLM calls (orchestrator calls Perplexity, then cascade calls Perplexity again)
- ❌ Higher API costs (running both orchestrator + full cascade)
- ❌ Longer execution time

---

## Recommended Approach: OPTION A

**Implementation Steps**:

1. **Add county scraper call** (before buildCmaSchema):
   ```typescript
   const countyJson = await fetchCountyData(searchQuery, geo.county);
   ```

2. **Call buildCmaSchema** (replace existing LLM cascade):
   ```typescript
   const cmaSchema = await buildCmaSchema({
     address: searchQuery,
     stellarMlsJson: mlsFields,
     countyJson: countyJson,
     paidApisJson: enrichedData,
   });
   ```

3. **Feed results into arbitration**:
   ```typescript
   // Separate Perplexity micro-prompt results (Tier 4)
   const perplexityFields = flattenWebChunks(webChunks);
   arbitrationPipeline.addFieldsFromSource(perplexityFields, 'Perplexity');

   // Claude Opus normalizer results (Tier 5)
   arbitrationPipeline.addFieldsFromSource(cmaSchema, 'Claude Opus');
   ```

4. **Remove old LLM cascade** (lines ~3500-4000):
   - Delete callPerplexity, callGrok, callClaudeOpus, callGPT, callClaudeSonnet, callGemini
   - Keep arbitration pipeline and final response logic

---

## Questions for User

1. **Do you want Option A (replace cascade) or Option B (supplement cascade)?**
2. **Should we keep the existing Perplexity prompt as fallback, or fully replace with orchestrator?**
3. **Do you want to keep Grok/GPT/Gemini in any capacity, or remove them entirely?**
4. **Should county scraper run for ALL properties, or only when geo.county is known?**

---

## Next Steps (Once Approved)

1. Integrate `buildCmaSchema()` into `api/property/search.ts`
2. Add county scraper call via `fetchCountyData()`
3. Update arbitration pipeline to feed orchestrator results
4. Test with sample property address (9840 W Bay St, Seminole, FL 33776)
5. Verify tier precedence working correctly
6. Check field completion percentage improves

