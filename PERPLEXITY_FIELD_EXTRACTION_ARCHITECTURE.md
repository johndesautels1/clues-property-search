# Perplexity's Advanced Field Extraction Architecture
**Source:** User instructions from previous conversation
**Date:** 2025-12-30
**Purpose:** Eliminate hallucinations and improve NULL field coverage through backend-first architecture

---

## Executive Summary

Perplexity recommends a **fundamental shift** from "LLM fills everything" to "Backend calculates, APIs fetch, LLM only validates/extracts evidence-based text."

**Key Principle:** You can get much better coverage and far fewer hallucinations by changing how the API call is framed and by moving "truth control" into your own code instead of the model.

---

## 1. Split Fields into "LLM Allowed" vs "LLM Forbidden"

Hard-code which fields the model is allowed to fill vs which must be null or computed by backend.

### Backend-Only (LLM Forbidden)

**These fields are ALWAYS null from LLM, filled ONLY by backend/APIs:**

- **29** - Parking Total (calculated)
- **37-38** - Tax rate & exemptions (calculated/scraped)
- **40** - Roof Age (from permits)
- **44** - Garage Type (evidence-based only, not guessed)
- **46** - HVAC Age (from permits)
- **53** - Fireplace Count (evidence-based only)
- **59** - Recent Renovations (from permits/evidence)
- **60-62** - Permit History (Realtor/Accela scraper)
- **66/69/72** - School ratings (SchoolDigger/GreatSchools API)
- **75-76** - Walk/Transit/Bike scores (WalkScore API)
- **77** - Safety Score (external API)
- **82** - Commute to City Center (Google Distance Matrix)
- **91-96** - All market/investment metrics (calculated or APIs)
- **98-99** - Rental estimate & yield (Zillow API + calculation)
- **102-103** - Financing & comparables (APIs)
- **104-116** - All utilities & connectivity (Stellar MLS + APIs)
- **134** - Smart Home Features (evidence-based only)
- **137-138** - Age restrictions & assessments (MLS fields + evidence)
- **140, 143-148** - Parking & building details (Stellar MLS)
- **150-153** - Legal & compliance (county records)
- **156** - Waterfront Feet (Stellar MLS)
- **161-165** - Leasing & pet policies (evidence-based only)

### LLM-Allowed (Evidence-Based Only)

**Fields where LLM can extract from text, BUT ONLY if explicit evidence exists:**

- Interpretive/descriptive fields where you show exact source text
- Must have corresponding `fieldCandidates` entries
- If no evidence snippet provided → LLM returns "null"

---

## 2. Change Contract: "Validate + Fill Only Where Explicit"

**OLD APPROACH (WRONG):**
> "Fill as many of these fields as possible."

**NEW APPROACH (CORRECT):**
> "Only fill a field if its value is explicitly present in provided text/data. Never infer, estimate, or guess."

### New System Prompt Template

```
You are a strict data extractor.

You receive:
- Raw MLS text, permit records, appraiser text
- External numeric data already looked up by tools
- A list of target fields with their IDs and definitions

RULES:
1. Only fill a field if its value is EXPLICITLY present in the provided text/data or passed as a numeric input parameter.
2. If a value is not explicitly present, return "null" for that field.
3. Never infer, estimate, or guess.
4. Do not calculate metrics the caller can compute (e.g., price/rent ratios) – return "null" unless exact final value is given.
5. Some fields are marked "backend_only": true. ALWAYS return "null" for those fields.
6. Output only JSON, schema: { fieldId: value | "null" }
```

---

## 3. Move Calculations and APIs to Backend

### External APIs (No LLM Involvement)

#### School Ratings (Fields 66, 69, 72)
- **Source:** SchoolDigger, GreatSchools, Niche APIs
- **Backend:** Call API directly, store failures and response codes
- **LLM:** Receives ratings as simple numbers in `numericInputs`, OR skip LLM entirely

#### WalkScore / Transit / Bike (Fields 75, 76)
- **Source:** WalkScore API
- **Backend:** Call directly, map missing to null
- **LLM:** Not involved

#### Permits (Fields 60-62)
- **Source:** Accela + Realtor.com JS-rendered pages
- **Backend:** Dedicated scraper, classify permits deterministically by keywords (roof/HVAC/other)
- **LLM:** ONLY used to normalize free-text "Type of Work" into standard tags, NEVER to invent rows

**Permit Scraping Implementation:**
1. Scrape Realtor.com dynamically-rendered permit section (requires headless browser)
2. Scrape Pinellas County Accela ePermits system
3. Parse permit rows deterministically
4. Classify by keywords: "roof" → Field 60, "hvac/air/heat" → Field 61, "addition/pool/etc" → Field 62
5. LLM only normalizes text descriptions, never fabricates permit data

#### Derived Metrics (Fields 91-96, 98-99, 103)
- **All math done in code, NOT in model**

Example backend functions:

```python
def compute_price_to_rent(price, est_rent):
    if not price or not est_rent or est_rent <= 0:
        return None
    return round(price / (est_rent * 12), 2)

def compute_rental_yield(price, est_rent):
    if not price or not est_rent or price <= 0:
        return None
    return round((est_rent * 12) / price * 100, 2)
```

**Then:** Send final numbers to LLM ONLY if you want natural-language explanation. Sheet values written directly by backend.

---

## 4. Use "Strict Schema + Evidence Pointers" (fieldCandidates Pattern)

For interpretive fields that need LLM extraction:
- **Garage Type (44)**
- **Fireplace Count (53)**
- **Recent Renovations (59)**
- **Smart Home Features (134)**
- **Lease/Pet details (161-165)**

### Implementation:

**Step 1:** Pre-extract candidate fragments via regex/heuristics from MLS description

Examples:
- Any sentence containing "garage" → candidates for Field 44
- Any sentence containing "fireplace" → candidates for Field 53
- Any sentence containing "renovated", "remodeled", year patterns → candidates for Field 59
- Any sentence containing "smart thermostat", "nest", "ring" → candidates for Field 134
- Any sentence containing "pets", "lease", "rental" → candidates for Fields 161-165

**Step 2:** Pass ONLY those short snippets to the model

### JSON Payload Example

```json
{
  "fieldCandidates": {
    "44": [
      "Oversized 2-car garage with storage",
      "Parking: Attached Garage"
    ],
    "53": [
      "Cozy wood-burning fireplace in the living room"
    ],
    "59": [
      "Kitchen fully remodeled in 2022 with quartz counters",
      "New LVP flooring throughout (2021)"
    ]
  },
  "fields": [
    {"id": 44, "name": "Garage Type", "backend_only": false},
    {"id": 53, "name": "Fireplace Count", "backend_only": false},
    {"id": 59, "name": "Recent Renovations", "backend_only": false}
  ]
}
```

### Prompt Rule

```
Only use the text in fieldCandidates when deciding values.
If the candidate array for a given field is empty, return "null" for that field.
```

**This sharply reduces the space the model can fabricate from.**

---

## 5. Add Validator Pass (Optional But Powerful)

Instead of trusting a single generation:

### Two-Pass Validation

**Pass 1:** LLM fills allowed fields

**Pass 2:** Validator LLM (or same model) checks:
```
Given the raw source text and this JSON of extracted fields,
list any fields where the value is not explicitly supported
by the source (or incorrect), and suggest "null" for them.
```

**Backend:** Programmatically zero-out any flagged fields

**Benefits:**
- Catches hallucinations that slipped through
- Self-correcting mechanism
- Can be run async for performance

---

## 6. Implementation Sketch (Claude Code Side)

### High-Level Flow

#### Step 1: Collect Data
- MLS JSON + remarks
- Realtor/Zillow permit HTML (pre-scraped)
- County/appraiser JSON
- API results (SchoolDigger, WalkScore, etc.)

#### Step 2: Backend Pre-Processing
1. **Compute all purely numeric metrics** and assign to fields directly
2. **Build `fieldCandidates` dict** from MLS text where applicable
3. **Build whitelist/blacklist** (`backend_only` flags) for each field

#### Step 3: Single Structured Call to Perplexity/LLM

**System prompt:** As in §2 above

**User JSON payload:**
```json
{
  "fields": [
    {"id": 29, "name": "Parking Total", "backend_only": true},
    {"id": 37, "name": "Property Tax Rate", "backend_only": true},
    ...
  ],
  "mlsText": "full public remarks, features, parking description, etc.",
  "permitRows": [
    // ... parsed rows from Realtor/Accela ...
  ],
  "appraiserText": "legal description / exemptions ...",
  "numericInputs": {
    "medianNeighborhoodPrice": 715000,
    "recentAvgPpsf": 520,
    "marketDaysAvg": 46,
    "estRent": 3800
  },
  "fieldCandidates": {
    "44": ["Oversized 2-car garage with storage"],
    "53": ["Cozy wood-burning fireplace"],
    "59": ["Kitchen remodeled in 2022"]
  }
}
```

#### Step 4: Deterministic Merge

For each field:
- **If `backend_only: true`:** Use backend value (ignore LLM)
- **Else:** Use LLM value, but ONLY if not "null"
- **Never let LLM overwrite backend-calculated values**

#### Step 5: Run Optional Validator Step
- Null-out any inconsistencies flagged by validator

#### Step 6: Telemetry
Log per-field source:
```json
{
  "value": 1.0,
  "source": "backend_schooldigger"
}
```
vs
```json
{
  "value": "Attached",
  "source": "llm_mls_text"
}
```

**This lets you see quickly which fields are still problematic.**

---

## 7. What Changes in Current Behavior

### Fields That NEVER Touch LLM (Backend-Only)

**29, 40, 46, 53, 59, 60–62, 77, 82, 96, 102, 103, 104–116, 134, 137, 150, 151–153, 156, 161–165**

→ Model is **never allowed to fill these**
→ It will always output "null"
→ Your code is the **only writer**

### Fields Fully Driven by APIs + Math (LLM Optional)

**37–38, 66/69/72, 75/76, 91–96, 98–99, 138**

→ Fully driven by APIs + your math
→ LLM **optional** for explanation text only
→ Sheet values written by backend

### Descriptive Fields (Evidence-Only)

**Garage type, fireplace count, smart features, lease/pet rules**

→ Only extracted if **explicit in MLS text fragments** that your code passes as evidence
→ Otherwise forced to "null"
→ No guessing, no inference

---

## Implementation Priority for Fields 60-62 (Permits)

### Current State
- Fields 60-62 showing NULL or hallucinated "2018" dates
- Currently mapped to `property.PermitRoof`, `property.PermitHVAC`, `property.PermitAdditions` from Bridge MLS
- Fallback extraction from `PublicRemarks` with regex

### Perplexity's Recommended Solution

**1. Implement Dedicated Scraper**
- **Source 1:** Realtor.com permit section (dynamically rendered, requires headless browser)
- **Source 2:** Pinellas County Accela ePermits system
- **Technology:** Browserless.io or Puppeteer for JS rendering

**2. Parse Permit Rows Deterministically**
```typescript
interface PermitRow {
  date: string;
  type: string; // "Roof", "HVAC", "Pool", "Addition", etc.
  description: string;
  value: number;
  status: string; // "Issued", "Finaled", "Pending"
}
```

**3. Classify by Keywords**
```typescript
function classifyPermit(permit: PermitRow): 60 | 61 | 62 | null {
  const desc = permit.description.toLowerCase();

  if (desc.includes('roof') || desc.includes('reroof')) return 60;
  if (desc.includes('hvac') || desc.includes('air') || desc.includes('heat')) return 61;
  if (desc.includes('pool') || desc.includes('addition') || desc.includes('remodel')) return 62;

  return null; // Unclassified
}
```

**4. LLM Only Normalizes Text (Optional)**
- Use LLM to normalize "Type of Work" free text into standard categories
- **NEVER** use LLM to invent permit rows
- **ALWAYS** source from actual scraped data

**5. Store as Backend-Only Fields**
```json
{
  "60_permit_history_roof": {
    "value": "Roof replacement - 2021 (Permit #21-00123)",
    "source": "Realtor.com Scraper",
    "confidence": "High"
  }
}
```

---

## Benefits of This Architecture

### Hallucination Reduction
- **Before:** LLM guesses ~40% of fields
- **After:** LLM only extracts from explicit evidence, backend owns truth

### NULL Field Improvement
- **Before:** 60+ fields NULL because LLM has no data
- **After:** APIs and scrapers fill most NULLs with real data

### Transparency
- Every field has `source` tracking
- Can audit which fields need better data sources
- Clear separation: backend truth vs LLM interpretation

### Maintainability
- Backend calculations are testable, deterministic
- LLM changes don't break core metrics
- Evidence-based extraction is debuggable

---

## Next Steps for Implementation

### Phase 1: Categorize All 168 Fields
1. Mark each field as `backend_only: true/false`
2. Identify which need APIs vs calculations vs evidence extraction
3. Document current vs desired source for each

### Phase 2: Build Evidence Extraction Engine
1. Create regex/heuristic extractors for MLS text
2. Generate `fieldCandidates` for each property
3. Test extraction quality

### Phase 3: Implement Permit Scraper
1. Research Realtor.com permit API (reverse engineer)
2. If no API, implement headless browser (Browserless.io)
3. Add Pinellas County ePermits scraper
4. Classify permits into Fields 60-62

### Phase 4: Restructure LLM Prompts
1. Update system prompt per §2
2. Add `backend_only` enforcement
3. Switch from "fill sheet" to "validate evidence"
4. Add `fieldCandidates` to payload

### Phase 5: Add Validator Pass
1. Implement two-pass validation
2. Log discrepancies
3. Auto-null flagged fields

### Phase 6: Migrate Calculations to Backend
1. Move all math from LLM prompts to TypeScript/Python
2. Call APIs directly (SchoolDigger, WalkScore, etc.)
3. LLM only receives final numbers for optional verbalization

---

## Critical Success Factors

✅ **DO:**
- Treat backend as source of truth for calculations and API data
- Use LLM only for evidence-based text extraction
- Implement `fieldCandidates` pattern for all interpretive fields
- Add per-field source tracking
- Build dedicated scrapers for permits, market data, etc.
- Use validator pass to catch hallucinations

❌ **DON'T:**
- Let LLM calculate metrics (price/rent ratios, tax rates, etc.)
- Let LLM fill fields without explicit evidence
- Trust LLM for data that should come from APIs
- Allow LLM to overwrite backend-calculated values
- Skip the `backend_only` enforcement

---

**This architecture is the foundation for eliminating hallucinations and improving data quality across all 168 fields.**
