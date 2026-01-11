# TAVILY INTEGRATION AUDIT REPORT
## Comprehensive Code and Prompt Analysis

**Generated:** 2026-01-10
**Purpose:** Identify why Tavily is not returning data for most of the 181 fields

---

## EXECUTIVE SUMMARY

### Current State
- **Total Fields in Schema:** 181 fields
- **Fields Tavily is Configured For:** ~16 fields (8.8%)
- **Fields Returned by Tavily:** Variable, typically 5-10 fields (2.7-5.5%)
- **Success Rate:** Low - most fields return no data

### Root Causes Identified
1. **Limited Field Coverage:** Only 16 out of 181 fields have dedicated Tavily searches
2. **Missing Configuration Files:** `tavily-field-config.ts` and `tavily-field-database-mapping.ts` don't exist
3. **Narrow Extraction Patterns:** Regex patterns too specific, miss variations
4. **No Fallback Strategy:** When primary search fails, no alternative queries attempted
5. **LLM Tool Use Not Optimized:** LLMs can call Tavily but aren't prompted to do so for missing fields
6. **Search Query Quality:** Queries too generic or too specific

---

## DETAILED AUDIT TABLE

### Section 1: TIER 3 - Direct Tavily Searches (tavily-search.ts)

| Field # | Field Name | Tavily Function | Search Query | Extraction Pattern | Status | Issues |
|---------|------------|-----------------|--------------|-------------------|--------|--------|
| **16a** | Zestimate | `searchAVMs()` | `site:zillow.com "{address}" Zestimate home value` | `/Zestimate[:\s]*\$?([\d,]+)/i` | 🟡 PARTIAL | • Domain-restricted search may fail<br>• Regex misses "Zestimate:" variations<br>• Only checks first result with break |
| **16b** | Redfin Estimate | `searchAVMs()` | `site:redfin.com "{address}" estimate home value` | `/(?:Redfin Estimate\|Estimate)[:\s]*\$?([\d,]+)/i` | 🟡 PARTIAL | • Similar issues as 16a<br>• May match wrong "Estimate" text<br>• Single result checked |
| **16c-16f** | Other AVMs | ❌ MISSING | N/A | N/A | 🔴 NONE | • First American, Quantarium, ICE, Collateral Analytics not implemented |
| **91** | Median Home Price (Neighborhood) | `searchMarketStats()` | `"{city}" {zip} median home price average days on market 2026` | `/median.*?\$?([\d,]+)/i` | 🟡 PARTIAL | • Too broad - may match irrelevant text<br>• Searches for "{city}" not "{address}"<br>• Year hardcoded to 2026 |
| **92** | Price Per Sq Ft (Recent Avg) | `searchMarketStats()` | Same as #91 | `/\$?([\d]+)\s*(?:per\|\/)\s*(?:sq\.?\s*ft\|sqft)/i` | 🟡 PARTIAL | • Misses "$150 / square foot"<br>• Doesn't capture cents<br>• Generic pattern |
| **95** | Days on Market (Avg) | `searchMarketStats()` | Same as #91 | `/(\d+)\s*(?:days?\s*on\s*market\|DOM)/i` | 🟡 PARTIAL | • May match "30 days on market" from single listing<br>• Not area average |
| **104** | Electric Provider | `searchUtilities()` | `"{city}" {state} electric utility provider water utility natural gas` | `/Duke Energy\|TECO\|Tampa Electric\|FPL\|Florida Power/i` | 🔴 POOR | • FLORIDA-ONLY patterns<br>• Hardcoded utility names<br>• Fails in other states |
| **106** | Water Provider | `searchUtilities()` | Same as #104 | `/(\w+\s*(?:Water\|Utilities\|Public Works))/i` | 🟡 PARTIAL | • Too broad - matches "drinking water"<br>• Captures only first word |
| **109** | Natural Gas | `searchUtilities()` | Same as #104 | `/Peoples Gas\|TECO Gas\|No natural gas/i` | 🔴 POOR | • FLORIDA-ONLY<br>• Hardcoded providers<br>• Binary result |
| **60** | Permit History - Roof | `searchPermits()` | `"{address}" {county} county building permits roof HVAC renovation` | `/roof.*permit\|permit.*roof/i` | 🔴 POOR | • Too generic - may miss actual dates<br>• No date extraction<br>• Returns generic text |
| **61** | Permit History - HVAC | `searchPermits()` | Same as #60 | `/HVAC.*permit\|permit.*HVAC\|AC.*permit/i` | 🔴 POOR | • Same issues as #60<br>• Returns "Permit found - see county records" (useless) |
| **169** | Zillow Views | `searchPortalViews()` | `"{address}" views saves favorites Zillow Redfin` | `/(\d+(?:,\d+)?)\s*views/i` + URL check | 🔴 POOR | • Portals don't publicly show view counts<br>• Data not in search results<br>• Domain restriction too tight |
| **170** | Redfin Views | `searchPortalViews()` | Same as #169 | Same as #169 | 🔴 POOR | • Same issue - data not public |
| **171** | Homes.com Views | `searchPortalViews()` | Same as #169 | Same as #169 | 🔴 POOR | • Same issue - data not public |
| **172** | Realtor.com Views | `searchPortalViews()` | Same as #169 | Same as #169 | 🔴 POOR | • Same issue - data not public |
| **174** | Saves/Favorites | `searchPortalViews()` | Same as #169 | `/(\d+(?:,\d+)?)\s*(?:saves\|favorites)/i` | 🔴 POOR | • Same issue - data not public |
| **151** | Homestead Exemption | `searchHomesteadAndCDD()` | `"{address}" homestead exemption site:{paoDomain}` OR<br>`"{address}" {county} homestead exemption property appraiser` | `/homestead.*exempt\|exempt.*homestead\|\$50,000.*homestead/i` | 🟡 PARTIAL | • County domain mapping incomplete<br>• Fallback search too broad<br>• Binary Y/N only |
| **152** | CDD Y/N | `searchHomesteadAndCDD()` | Same as #151 | `/community development district\|cdd.*\$\|cdd.*fee/i` | 🟡 PARTIAL | • Good approach<br>• Could miss variations |
| **153** | Annual CDD Fee | `searchHomesteadAndCDD()` | Same as #151 | `/cdd.*?\$\s*([\d,]+(?:\.\d{2})?)/i` | 🟡 PARTIAL | • Good pattern<br>• Sanity check too tight (< $10k) |

**TIER 3 Summary:**
- ✅ Implemented: 16 fields
- 🟡 Partial Success: 10 fields
- 🔴 Poor/Failing: 6 fields
- ❌ Not Implemented: 165 fields (91%)

---

### Section 2: LLM Tool Calls with Tavily (search.ts, retry-llm.ts, etc.)

| LLM Model | Has Tavily Tool | Search Function | Prompt Quality | Usage Pattern | Issues |
|-----------|-----------------|-----------------|----------------|---------------|--------|
| **Grok** | ✅ YES | `callTavilySearch()` | 🟡 BASIC | Tool available via function calling | • LLM decides when to search<br>• No explicit instruction to search for missing fields<br>• Returns formatted text, not structured data |
| **GPT-5** | ✅ YES | `callTavilySearch()` | 🟡 BASIC | Tool available via function calling | • Same issues as Grok<br>• May not use tool if not prompted |
| **Claude Opus** | ❌ NO | N/A | N/A | No tool access | • Cannot search web<br>• Relies on training data only |
| **Claude Sonnet** | ❌ NO | N/A | N/A | No tool access | • Same as Opus |
| **Gemini** | ❌ NO | N/A | N/A | No tool access | • Same as above |
| **Perplexity** | ⚡ BUILT-IN | N/A | ✅ GOOD | Native web search | • Best performing<br>• Already has citations<br>• Not using Tavily |

**Tool Call Analysis:**
```typescript
// Current Tavily tool definition (search.ts:4425)
async function callTavilySearch(query: string, numResults: number = 5): Promise<string> {
  // Returns formatted text, NOT structured field data
  // LLMs must then parse this text to extract values
}
```

**Problems:**
1. Tool returns unstructured text - LLMs must parse it
2. No field-specific tool (e.g., "get_zestimate", "get_median_price")
3. LLMs not explicitly told to search for missing fields
4. No retry logic if search returns no results

---

### Section 3: Dedicated Field Fetcher (fetch-tavily-field.ts)

| Component | Status | Issues |
|-----------|--------|--------|
| **API Endpoint** | ✅ EXISTS | `/api/property/fetch-tavily-field` - but may not be called |
| **Field Config File** | 🔴 MISSING | `tavily-field-config.ts` does NOT exist - import fails |
| **Database Mapping** | 🔴 MISSING | `tavily-field-database-mapping.ts` does NOT exist - import fails |
| **Sequential Search** | ✅ IMPLEMENTED | Searches queries one at a time until results found |
| **LLM Extraction** | ✅ IMPLEMENTED | Uses Claude Sonnet to extract values from search results |
| **Error Handling** | ✅ GOOD | Proper validation and error messages |

**Critical Issue:**
```typescript
// Line 15-16 in fetch-tavily-field.ts
import { getTavilyFieldConfig } from './tavily-field-config.js';
import { getFieldDatabasePath, updateNestedProperty } from './tavily-field-database-mapping.js';

// ❌ THESE FILES DON'T EXIST - System cannot fetch individual fields
```

**Impact:** The per-field Tavily fetcher is completely broken. Missing configuration files mean:
- No search queries defined for individual fields
- No database paths for updating fields
- Manual field fetching via UI button likely fails

---

### Section 4: Search Query Quality Analysis

| Field Category | Current Query Approach | Problems | Recommended Fix |
|----------------|------------------------|----------|------------------|
| **AVMs** | Domain-restricted | • Blocks other sources<br>• Zillow/Redfin may not index property | Use broad query + LLM extraction:<br>`"{address}" home value estimate 2026"` |
| **Market Stats** | City-level generic | • Returns area stats, not property-specific<br>• May match wrong city | Add neighborhood/ZIP:<br>`"{address}" OR "{neighborhood}" {zip} median home price` |
| **Utilities** | State-specific providers | • Hardcoded FL utilities<br>• Fails in other states | Generic query + LLM extraction:<br>`"{city}" {state} electric utility provider 2026"` |
| **Permits** | Too broad | • Returns generic matches<br>• No dates extracted | Targeted query:<br>`site:county-permit-portal "{address}" roof permit date` |
| **Portal Views** | Impossible data | • View counts not public<br>• Wasting API calls | Remove or acknowledge as unavailable |
| **HOA/Taxes** | Good approach | • County PAO searches work<br>• Some counties missing | Expand county mapping |

---

### Section 5: Extraction Pattern Analysis

| Field Type | Current Pattern | Matches | Misses | Fix Needed |
|------------|----------------|---------|--------|------------|
| **Currency** | `/\$?([\d,]+)/` | "$500000", "500,000" | "$500k", "$1.2M", "$1,200,500.50" | Add k/M/B support, cents |
| **Percentages** | Not consistent | - | "3.5%", "3.5 percent", "three percent" | Standardize across all fields |
| **Yes/No** | String matching | "Yes", "No" | "Y", "N", "True", "Active", "Has exemption" | Map all variations to boolean |
| **Dates** | Not implemented | - | All date formats | Add date parser |
| **Providers** | Hardcoded list | Known FL utilities | Out-of-state providers, variations | Use LLM extraction instead |
| **Numbers** | `/(\d+)/` | "2000" | "2,000", "two thousand" | Handle formatting, text |

---

### Section 6: Missing Fields Analysis

**Fields 1-181: Coverage Breakdown**

| Field Group | Total Fields | Tavily Coverage | % Covered | Status |
|-------------|--------------|-----------------|-----------|--------|
| Address & Identity (1-9) | 9 | 0 | 0% | ❌ Most from MLS/Geocode |
| Pricing & Value (10-16) | 13 | 2 (16a, 16b) | 15% | 🔴 AVMs only |
| Property Basics (17-29) | 13 | 0 | 0% | ❌ MLS/Public Records |
| HOA & Taxes (30-38) | 9 | 3 (151, 152, 153) | 33% | 🟡 CDD/Homestead only |
| Structure & Systems (39-48) | 10 | 2 (60, 61) | 20% | 🔴 Permits only |
| Interior Features (49-53) | 5 | 0 | 0% | ❌ MLS data |
| Exterior Features (54-58) | 5 | 0 | 0% | ❌ MLS data |
| Permits & Renovations (59-62) | 4 | 2 (60, 61) | 50% | 🟡 Generic results |
| Assigned Schools (63-73) | 11 | 0 | 0% | ❌ Should use GreatSchools API |
| Location Scores (74-82) | 9 | 0 | 0% | ❌ Should use WalkScore API |
| Distances & Amenities (83-87) | 5 | 0 | 0% | ❌ Google Maps API |
| Safety & Crime (88-90) | 3 | 0 | 0% | ❌ NeighborhoodScout API |
| Market & Investment (91-103) | 13 | 3 (91, 92, 95) | 23% | 🔴 Limited market stats |
| Utilities & Connectivity (104-116) | 13 | 3 (104, 106, 109) | 23% | 🔴 FL-only, poor |
| Environment & Risk (117-130) | 14 | 0 | 0% | ❌ Should use FirstStreet/FEMA APIs |
| Additional Features (131-138) | 8 | 0 | 0% | ❌ MLS data |
| Parking Details (139-143) | 5 | 0 | 0% | ❌ MLS data |
| Building Details (144-148) | 5 | 0 | 0% | ❌ MLS data |
| Legal & Compliance (149-154) | 6 | 3 (151, 152, 153) | 50% | 🟡 Tax data only |
| Waterfront (155-159) | 5 | 0 | 0% | ❌ MLS data |
| Leasing & Rentals (160-165) | 6 | 0 | 0% | ❌ MLS data |
| Community & Features (166-168) | 3 | 0 | 0% | ❌ MLS data |
| Market Performance (169-181) | 13 | 5 (169-172, 174) | 38% | 🔴 Data not public |

**TOTAL: 181 fields, 16 covered = 8.8%**

---

## ROOT CAUSE ANALYSIS

### Issue 1: Tavily is Wrong Tool for Most Fields ⚠️

**Problem:** Tavily is a web search API. Most property data is NOT publicly searchable on the web.

**Fields Better Served by Direct APIs:**
- **MLS Data (90+ fields):** Should come from Stellar MLS integration
- **Schools (11 fields):** GreatSchools/SchoolDigger APIs
- **Location Scores (9 fields):** WalkScore API
- **Crime (3 fields):** NeighborhoodScout/FBI APIs
- **Environment (14 fields):** FirstStreet/FEMA APIs
- **Geocoding (5 fields):** Google Geocode API

**Tavily Appropriate For:**
- AVMs from public sites (Zillow, Redfin)
- Market statistics from real estate news/reports
- Utility provider identification
- County tax/exemption lookup
- Permit history (if county doesn't have API)

### Issue 2: Missing Configuration System 🔴

**Problem:** The per-field Tavily system is non-functional.

```typescript
// These files are imported but DO NOT EXIST:
tavily-field-config.ts          // Should define search queries per field
tavily-field-database-mapping.ts // Should define database paths per field
```

**Impact:**
- Individual field fetch API is broken
- No way to manually trigger Tavily for specific field
- UI "Fetch with Tavily" button likely fails
- No systematic coverage of all 181 fields

### Issue 3: LLM Prompts Don't Emphasize Tool Use 🟡

**Problem:** LLMs have Tavily tool but aren't prompted to use it for missing fields.

**Current Prompt Pattern (approximate):**
```
You are extracting property data for {address}.
Extract these fields: [list of 50+ fields]
You have access to web search via tavily_search tool.
Return JSON with field values.
```

**Issues:**
- Prompt says "you have access" but doesn't say "you MUST use"
- LLM tries to answer from training data first
- No explicit instruction: "If a field is missing, search for it"
- No field prioritization (which fields NEED web search vs training data)

**Better Prompt:**
```
CRITICAL: For these fields, you MUST use tavily_search:
- AVMs (Zestimate, Redfin Estimate)
- Market statistics (median price, days on market)
- Utility providers
- Permit history

For each field above, if you don't have data:
1. Call tavily_search with specific query
2. Extract value from results
3. If no results, mark field as "not_found"
```

### Issue 4: No Fallback or Retry Strategy ❌

**Problem:** Searches fail silently with no alternatives attempted.

**Example:**
1. Search `site:zillow.com "{address}" Zestimate` returns no results
2. System returns empty field
3. No attempt to search broader: `"{address}" Zillow home value`
4. No attempt to search alternative: `"{address}" Zestimate OR home estimate`

**Fix:** Implement cascading queries:
```typescript
const cascadeQueries = [
  `site:zillow.com "${address}" Zestimate`,           // Most specific
  `"${address}" Zestimate site:zillow.com OR site:redfin.com`, // Broader
  `"${address}" home value estimate Zillow`,          // Generic
];
```

### Issue 5: Extraction Patterns Too Rigid 🔴

**Problem:** Regex patterns miss common variations.

**Examples:**
```typescript
// Current: /\$?([\d,]+)/
// Matches: "$500000", "500,000"
// Misses: "$500k", "$1.2M", "$500,000.00"

// Current: /Zestimate[:\s]*\$?([\d,]+)/i
// Matches: "Zestimate: $500000"
// Misses: "Zestimate®: $500,000", "Zestimate $500k", "Zestimate of $500,000"
```

**Fix:** Use LLM extraction instead of regex:
```typescript
// Instead of regex, send to Claude:
const prompt = `Extract the Zestimate value from this text: "${content}"
Return ONLY the number, no currency symbol. If not found, return "null".`;
```

---

## RECOMMENDATIONS

### Priority 1: Fix Broken Systems 🔴

1. **Create Missing Config Files**
   - Create `tavily-field-config.ts` with search queries for all relevant fields
   - Create `tavily-field-database-mapping.ts` with database paths
   - Test individual field fetching API

2. **Remove Impossible Fields from Tavily**
   - Portal views (169-172, 174) are NOT publicly available
   - Remove these from Tavily searches
   - Document as "Unavailable via web search"

3. **Fix Florida-Only Patterns**
   - Remove hardcoded utility provider lists
   - Use LLM extraction for all location-specific data
   - Test with properties outside Florida

### Priority 2: Improve Coverage 🟡

4. **Expand AVM Coverage**
   - Add queries for fields 16c-16f (First American, Quantarium, ICE, Collateral)
   - Use broader queries with LLM extraction
   - Add fallback to generic "home value estimate" searches

5. **Improve Market Statistics**
   - Add property-specific context to queries
   - Search for comp sales, not just area medians
   - Extract price trends, sale-to-list ratios

6. **Add Missing Field Categories**
   - Renovation/upgrade details (fields 59, 62)
   - Rental estimates (field 98)
   - Insurance estimates (field 97)
   - Community features (field 166)

### Priority 3: Optimize Prompts 🟡

7. **Rewrite LLM Prompts for Mandatory Tool Use**
   ```typescript
   const MANDATORY_SEARCH_FIELDS = [
     '16a_zestimate', '16b_redfin_estimate',
     '91_median_home_price', '92_price_per_sqft',
     '104_electric_provider', '106_water_provider'
   ];

   // In prompt:
   "CRITICAL: For fields ${MANDATORY_SEARCH_FIELDS.join(', ')},
   you MUST call tavily_search. Do NOT answer from training data."
   ```

8. **Add Field-Specific Tool Calls**
   ```typescript
   // Instead of generic "tavily_search"
   // Create specific tools:
   {
     name: "get_zestimate",
     description: "Get Zillow Zestimate for an address",
     parameters: { address: string }
   }
   ```

### Priority 4: Data Source Strategy ⚡

9. **Reassess Which Fields Should Use Tavily**
   - Document which fields are appropriate for web search
   - Identify fields better served by direct APIs
   - Don't waste Tavily calls on data that's not publicly available

10. **Implement Data Source Hierarchy**
    ```
    1. Stellar MLS (90+ fields)
    2. County APIs (tax, permits)
    3. Specialized APIs (WalkScore, GreatSchools, etc.)
    4. Perplexity/Grok web search (fields needing current data + citations)
    5. Tavily (fallback for missing fields)
    6. Other LLMs (inference only)
    ```

---

## CONCLUSION

**Current State:** Tavily integration is returning minimal data (5-10 fields out of 181) due to:
1. Only 16 fields have dedicated searches (8.8% coverage)
2. Missing configuration files break per-field fetching
3. Many fields Tavily searches for are not publicly available
4. Extraction patterns are too rigid
5. LLMs aren't prompted to use Tavily effectively

**Key Insight:** Tavily is being asked to do too much. It's a web search API, not a property data API. Most fields should come from:
- **MLS feeds** (property details)
- **County APIs** (tax, permits, assessments)
- **Specialized APIs** (schools, crime, environment, location scores)
- **Perplexity/Grok** (for cited web research)

**Tavily's Best Use:** Filling gaps when other sources fail, and fetching public data like AVMs, market stats, and utility providers.

---

## ACTION ITEMS

### Immediate (This Week)
- [ ] Create `tavily-field-config.ts` and `tavily-field-database-mapping.ts`
- [ ] Remove portal view searches (169-172, 174)
- [ ] Fix Florida-only utility patterns
- [ ] Test individual field fetching API

### Short Term (Next 2 Weeks)
- [ ] Rewrite LLM prompts to emphasize mandatory tool use
- [ ] Expand AVM searches to include all providers (16c-16f)
- [ ] Add cascading query fallbacks
- [ ] Replace regex extraction with LLM extraction

### Long Term (Next Month)
- [ ] Integrate specialized APIs (WalkScore, GreatSchools, FirstStreet, etc.)
- [ ] Reassess data source hierarchy
- [ ] Document which fields are Tavily-appropriate
- [ ] Implement field-specific tool calls

---

**Report End**
