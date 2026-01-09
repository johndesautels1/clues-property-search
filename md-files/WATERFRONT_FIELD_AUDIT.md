# WATERFRONT FIELDS (155-159) - COMPREHENSIVE AUDIT

## Last Updated: 2026-01-09

## Field Definitions (from fields-schema.ts SOURCE OF TRUTH)
| Field # | Key | Type | Description |
|---------|-----|------|-------------|
| 155 | water_frontage_yn | boolean | Has waterfront (Y/N) |
| 156 | waterfront_feet | number | Linear feet of water frontage |
| 157 | water_access_yn | boolean | Has water access (Y/N) |
| 158 | water_view_yn | boolean | Has water view (Y/N) |
| 159 | water_body_name | string | Name of water body |

---

## DATA FLOW (Priority Order)

### TIER 1: Bridge MLS (PRIMARY SOURCE)
**File: `src/lib/bridge-field-mapper.ts`**
- Lines 935-985: Extracts waterfront from RESO property object
- Sets `source: 'Stellar MLS'`, `confidence: 'High'`
- Handles: WaterfrontYN, WaterfrontFeet, WaterAccessYN, WaterViewYN, WaterBodyName
- Also infers from: WaterfrontFeatures array, DockYN, CanalFrontage

**File: `api/property/search.ts`** (FIXED 2026-01-09)
- Lines 4877-4894: Extracts waterfront from `bridgeData.rawData` as fallback
- Now properly structures: `{ value, source: 'Stellar MLS', confidence: 'High' }`
- Previously was setting raw values without source (caused "Source: Unknown")

### TIER 2: PDF Parsing
**File: `api/property/parse-mls-pdf.ts`**
- Lines 383-409: MLS_FIELD_MAPPING for waterfront labels
- Lines 737-741: Sets `{ value, source: sourceName, confidence: 'High' }`
- sourceName = 'Stellar MLS PDF' for Stellar MLS documents

### TIER 3: LLM Fallback
**File: `api/property/retry-llm.ts`**
- Lines 335-340: TYPE_MAP defines waterfront field types
- LLMs don't specifically search for waterfront (MLS-only data)
- If returned, properly structured with source

---

## FIELD MAPPING FILES (All Verified)

### 1. `src/lib/field-map-flat-to-numbered.ts` (UPDATED 2026-01-09)
```
Lines 321-344: Comprehensive waterfront aliases
- water_frontage_yn, water_frontage, waterfront_yn, waterfront, on_water, is_waterfront, waterfront_property → 155
- waterfront_feet, water_feet, water_frontage_feet, frontage_feet, linear_water_feet → 156
- water_access_yn, water_access, has_water_access → 157
- water_view_yn, water_view, has_water_view → 158
- water_body_name, water_body, body_of_water, waterbody, water_name → 159
```

### 2. `api/property/perplexity-prompts.ts` (UPDATED 2026-01-09)
```
Lines 527-550: Added waterfront aliases to PERPLEXITY_FIELD_MAPPING
- Same comprehensive aliases as field-map-flat-to-numbered.ts
```

### 3. `src/lib/field-mapping.ts`
```
Lines 259-263: Frontend mapping with correct paths
- 155 → stellarMLS.waterfront.waterFrontageYn
- 156 → stellarMLS.waterfront.waterfrontFeet
- 157 → stellarMLS.waterfront.waterAccessYn
- 158 → stellarMLS.waterfront.waterViewYn
- 159 → stellarMLS.waterfront.waterBodyName
```

### 4. `src/lib/field-normalizer.ts`
```
Lines 326-330: Field definitions with types and groups
- fieldNumber: 155-159
- group: 'stellarMLS.waterfront'
- Proper type definitions (boolean/number/string)
Lines 453-457: API key aliases for exterior_features_* variants
```

### 5. `api/property/stellar-mls.ts`
```
Lines 245-249: RESO field name mapping
- WaterfrontYN → 155_water_frontage_yn
- WaterfrontFeet → 156_waterfront_feet
- WaterAccessYN → 157_water_access_yn
- WaterViewYN → 158_water_view_yn
- WaterBodyName → 159_water_body_name
```

---

## TAVILY WEB SEARCH
**File: `api/property/tavily-search.ts`**
- Does NOT search for waterfront data (intentional)
- Waterfront is MLS-specific data, not reliably available via web search
- Tavily searches for: AVMs, market stats, utilities, permits, portal views

---

## SOURCE ATTRIBUTION FIX

### Root Cause (Fixed 2026-01-09)
`api/property/search.ts` was adding fields from `bridgeData.rawData` as raw values:
```typescript
// BEFORE (broken):
additionalFields['159_water_body_name'] = bridgeData.rawData.WaterBodyName;
// Result: "Source: Unknown"

// AFTER (fixed):
additionalFields['159_water_body_name'] = {
  value: bridgeData.rawData.WaterBodyName,
  source: 'Stellar MLS',
  confidence: 'High'
};
// Result: "Source: Stellar MLS"
```

---

## VERIFICATION CHECKLIST

- [x] bridge-field-mapper.ts - Sets source correctly
- [x] search.ts - Fixed source attribution (commit 692b53d)
- [x] parse-mls-pdf.ts - Sets source correctly
- [x] retry-llm.ts - TYPE_MAP includes waterfront
- [x] field-map-flat-to-numbered.ts - Added comprehensive aliases
- [x] perplexity-prompts.ts - Added waterfront aliases
- [x] field-mapping.ts - Correct frontend paths
- [x] field-normalizer.ts - Correct field definitions
- [x] stellar-mls.ts - RESO field mapping present

---

## FILES NOT NEEDING WATERFRONT

These files intentionally DON'T handle waterfront:
- `gemini-prompts.ts` - LLMs search for web data, not MLS-specific data
- `tavily-search.ts` - Web search can't reliably find waterfront data
- `enrich.ts` - Free APIs (WalkScore, FEMA, etc.) don't provide waterfront
