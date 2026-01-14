# GEMINI BUTTON IMPLEMENTATION GUIDE

**Created:** 2026-01-13
**Priority:** HIGH
**Status:** READY FOR IMPLEMENTATION
**Estimated Effort:** 4-6 hours

---

## EXECUTIVE SUMMARY

This guide provides detailed instructions for:
1. **Removing Gemini from the LLM cascade** (fixes timeout issues)
2. **Adding "Fetch with Gemini" button to ALL non-Bridge/non-Tier2 fields**
3. **Creating PublicRemarks parse script** for automated field extraction

---

## PART 1: REMOVE GEMINI FROM CASCADE

### Problem
Gemini causes timeout issues in the synchronous LLM cascade, blocking the entire search pipeline.

### Current Architecture (search.ts)
```
Tier 4: LLM Cascade
├── Gemini Flash (primary) ← CAUSES TIMEOUTS
└── GPT-4 (fallback)
```

### Target Architecture
```
Tier 4: LLM Cascade
└── GPT-4 only (faster, more reliable)

Tier 5: On-Demand (User-triggered)
└── "Fetch with Gemini" button (per-field or batch)
```

### Files to Modify

#### 1. `api/property/search.ts`
- **Location:** Look for `runLLMCascade()` or similar function
- **Action:** Remove Gemini from the cascade, keep GPT-4 only
- **Search for:** `gemini`, `GEMINI`, `gemini-flash`, `gemini-pro`

```typescript
// BEFORE: LLM cascade with Gemini primary
const llmResult = await runLLMCascade([
  { name: 'Gemini', fn: callGemini },  // REMOVE THIS
  { name: 'GPT-4', fn: callGPT4 },
]);

// AFTER: GPT-4 only in cascade
const llmResult = await callGPT4(prompt, fields);
```

#### 2. `api/property/retry-llm.ts`
- **Location:** LLM retry logic
- **Action:** Keep Gemini function but don't call it automatically
- **Export:** `callGeminiForFields()` for manual button use

```typescript
// Keep this function but export it for button use
export async function callGeminiForFields(
  address: string,
  fieldIds: number[],
  publicRemarks?: string
): Promise<Record<string, any>> {
  // Existing Gemini call logic
}
```

#### 3. `src/lib/llm-constants.ts`
- **Action:** Add GEMINI_ENABLED_FIELDS constant (similar to TAVILY_ENABLED_FIELDS)

```typescript
// Fields that can use "Fetch with Gemini" button
export const GEMINI_ENABLED_FIELDS = new Set([
  // ALL fields NOT covered by Bridge-Stellar or Tier 2 APIs
  // See PART 2 for complete list
]);
```

---

## PART 2: ADD "FETCH WITH GEMINI" BUTTON

### Which Fields Get the Button

**Rule:** ALL fields that are NOT already covered by:
- Bridge-Stellar MLS (Tier 0)
- Free APIs / Tier 2 (Schools, Crime, Flood, WalkScore, etc.)

### Complete Field List for Gemini Button

```typescript
// PropertyDetail.tsx - Add this constant
const GEMINI_ENABLED_FIELDS = new Set([
  // ================================================================
  // GROUP: Pricing & Value (MLS might miss these)
  // ================================================================
  12,   // market_value_estimate (when MLS doesn't have)

  // ================================================================
  // GROUP: Structure & Systems (HARD TO GET)
  // ================================================================
  39,   // roof_type
  40,   // roof_age_est
  41,   // exterior_material
  42,   // foundation
  43,   // water_heater_type
  44,   // garage_type
  45,   // hvac_type
  46,   // hvac_age
  47,   // laundry_type
  48,   // interior_condition ← GEMINI EXCELS HERE

  // ================================================================
  // GROUP: Interior Features
  // ================================================================
  49,   // flooring_type
  50,   // kitchen_features
  51,   // appliances_included
  52,   // fireplace_yn
  53,   // primary_br_location

  // ================================================================
  // GROUP: Exterior Features
  // ================================================================
  54,   // pool_yn
  55,   // pool_type
  56,   // deck_patio
  57,   // fence
  58,   // landscaping

  // ================================================================
  // GROUP: Permits & Renovations
  // ================================================================
  59,   // recent_renovations
  60,   // permit_history_roof
  61,   // permit_history_hvac
  62,   // permit_history_other

  // ================================================================
  // GROUP: Market & Investment Data
  // ================================================================
  91,   // median_home_price_neighborhood
  92,   // price_per_sqft_recent_avg
  93,   // price_to_rent_ratio
  95,   // days_on_market_avg
  96,   // inventory_surplus
  97,   // insurance_est_annual
  98,   // rental_estimate_monthly
  100,  // vacancy_rate_neighborhood
  102,  // financing_terms
  103,  // comparable_sales

  // ================================================================
  // GROUP: Utilities & Connectivity
  // ================================================================
  104,  // electric_provider
  105,  // avg_electric_bill
  106,  // water_provider
  107,  // avg_water_bill
  108,  // sewer_provider
  109,  // natural_gas
  110,  // trash_provider
  111,  // internet_providers_top3
  112,  // max_internet_speed
  113,  // fiber_available
  114,  // cable_tv_provider
  115,  // cell_coverage_quality
  116,  // emergency_services_distance

  // ================================================================
  // GROUP: Additional Features (GEMINI EXCELS)
  // ================================================================
  131,  // view_type
  132,  // lot_features
  133,  // ev_charging
  134,  // smart_home_features ← GEMINI EXCELS HERE
  135,  // accessibility_modifications ← GEMINI EXCELS HERE
  136,  // pet_policy
  137,  // age_restrictions
  138,  // special_assessments

  // ================================================================
  // GROUP: Stellar MLS - Parking & Garage
  // ================================================================
  139,  // carport_yn
  140,  // carport_spaces
  141,  // garage_attached_yn
  142,  // parking_features
  143,  // assigned_parking_spaces

  // ================================================================
  // GROUP: Stellar MLS - Building Info
  // ================================================================
  144,  // floor_number
  145,  // building_total_floors
  146,  // building_name_number
  147,  // building_elevator_yn
  148,  // floors_in_unit

  // ================================================================
  // GROUP: Stellar MLS - Legal & Tax
  // ================================================================
  149,  // subdivision_name
  150,  // legal_description
  151,  // homestead_yn
  152,  // cdd_yn
  153,  // annual_cdd_fee
  154,  // front_exposure

  // ================================================================
  // GROUP: Stellar MLS - Waterfront
  // ================================================================
  155,  // water_frontage_yn
  156,  // waterfront_feet
  157,  // water_access_yn
  158,  // water_view_yn
  159,  // water_body_name

  // ================================================================
  // GROUP: Stellar MLS - Leasing & Pets
  // ================================================================
  160,  // can_be_leased_yn
  161,  // minimum_lease_period
  162,  // lease_restrictions_yn
  163,  // pet_size_limit
  164,  // max_pet_weight
  165,  // association_approval_yn

  // ================================================================
  // GROUP: Stellar MLS - Features
  // ================================================================
  166,  // community_features
  167,  // interior_features
  168,  // exterior_features

  // ================================================================
  // GROUP: Market Performance
  // ================================================================
  169,  // months_of_inventory
  170,  // new_listings_30d
  171,  // homes_sold_30d
  172,  // median_dom_zip
  173,  // price_reduced_percent
  174,  // homes_under_contract
  175,  // market_type
  176,  // avg_sale_to_list_percent
  177,  // avg_days_to_pending
  178,  // multiple_offers_likelihood
  179,  // appreciation_percent
  180,  // price_trend
  181,  // rent_zestimate
]);
```

### Fields That Should NOT Have Gemini Button

These are already covered by reliable sources:

```typescript
// DO NOT add Gemini button to these (already have reliable sources)
const GEMINI_EXCLUDED_FIELDS = new Set([
  // Address & Identity - From MLS
  1, 2, 3, 4, 5, 6, 7, 8, 9,

  // Pricing - From MLS
  10, 11, 13, 14, 15,

  // Property Basics - From MLS
  17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,

  // HOA & Taxes - From MLS
  30, 31, 32, 33, 34, 35, 36, 37, 38,

  // Schools - From SchoolDigger API
  63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73,

  // Location Scores - From WalkScore/Transit APIs
  74, 75, 76, 77, 78, 79, 80, 81, 82,

  // Distances - From Google Places
  83, 84, 85, 86, 87,

  // Crime - From FBI Crime API
  88, 89, 90,

  // Environment - From FEMA/AirNow/Weather APIs
  117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130,

  // AVMs - From Tavily (Zillow/Redfin scraping)
  '16a', '16b', '16c', '16d', '16e', '16f',
]);
```

---

## PART 3: PROPERTYDETAIL.TSX MODIFICATIONS

### 3.1 Add Gemini Button Component

```typescript
// Add near the Tavily button component (around line 200-300)

interface GeminiButtonProps {
  fieldKey: string;
  fieldId: number | string;
  address: string;
  publicRemarks?: string;
  onSuccess: (fieldKey: string, value: any, source: string) => void;
  disabled?: boolean;
}

const GeminiButton: React.FC<GeminiButtonProps> = ({
  fieldKey,
  fieldId,
  address,
  publicRemarks,
  onSuccess,
  disabled
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/property/gemini-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          fieldId,
          fieldKey,
          publicRemarks,
        }),
      });

      const data = await response.json();

      if (data.success && data.value) {
        onSuccess(fieldKey, data.value, 'Gemini');
      } else {
        setError(data.error || 'No data found');
      }
    } catch (err) {
      setError('Failed to fetch');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFetch}
      disabled={disabled || isLoading}
      className="ml-2 px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700
                 text-white rounded flex items-center gap-1 disabled:opacity-50"
      title="Fetch with Gemini AI"
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Sparkles className="w-3 h-3" />
      )}
      Gemini
    </button>
  );
};
```

### 3.2 Add FIELD_KEY_TO_ID_MAP Entries for Gemini

```typescript
// Add to existing FIELD_KEY_TO_ID_MAP (around line 87-165)
// These map field keys to field IDs for Gemini API

const GEMINI_FIELD_KEY_TO_ID_MAP: Record<string, number | string> = {
  // Structure & Systems
  '39_roof_type': 39,
  '40_roof_age_est': 40,
  '41_exterior_material': 41,
  '42_foundation': 42,
  '43_water_heater_type': 43,
  '44_garage_type': 44,
  '45_hvac_type': 45,
  '46_hvac_age': 46,
  '47_laundry_type': 47,
  '48_interior_condition': 48,

  // Interior Features
  '49_flooring_type': 49,
  '50_kitchen_features': 50,
  '51_appliances_included': 51,
  '52_fireplace_yn': 52,
  '53_primary_br_location': 53,

  // Exterior Features
  '54_pool_yn': 54,
  '55_pool_type': 55,
  '56_deck_patio': 56,
  '57_fence': 57,
  '58_landscaping': 58,

  // ... continue for ALL fields in GEMINI_ENABLED_FIELDS
};
```

### 3.3 Render Gemini Button in Field Display

```typescript
// In the DataField component or field rendering logic
// Add Gemini button next to Tavily button

{/* Existing Tavily button */}
{TAVILY_ENABLED_FIELDS.has(fieldId) && (
  <TavilyButton ... />
)}

{/* NEW: Gemini button */}
{GEMINI_ENABLED_FIELDS.has(fieldId) && (
  <GeminiButton
    fieldKey={fieldKey}
    fieldId={fieldId}
    address={property.address}
    publicRemarks={property.publicRemarks}
    onSuccess={handleFieldUpdate}
    disabled={!!value} // Disable if field already has value
  />
)}
```

---

## PART 4: CREATE GEMINI API ENDPOINT

### Create New File: `api/property/gemini-field.ts`

```typescript
/**
 * Gemini Field Fetch API Endpoint
 * Called by "Fetch with Gemini" button for individual fields
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 30, // 30 second timeout for Gemini
};

interface GeminiFieldRequest {
  address: string;
  fieldId: number | string;
  fieldKey: string;
  publicRemarks?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address, fieldId, fieldKey, publicRemarks } = req.body as GeminiFieldRequest;

  if (!address || !fieldId) {
    return res.status(400).json({ error: 'Missing address or fieldId' });
  }

  try {
    console.log(`[Gemini Field] Fetching field ${fieldId} (${fieldKey}) for ${address}`);

    // Build prompt based on field type
    const prompt = buildFieldPrompt(fieldId, fieldKey, address, publicRemarks);

    // Call Gemini API
    const result = await callGemini(prompt);

    // Parse and validate response
    const value = parseGeminiResponse(result, fieldId, fieldKey);

    if (value) {
      return res.status(200).json({
        success: true,
        fieldId,
        fieldKey,
        value,
        source: 'Gemini',
        confidence: 'Medium',
      });
    } else {
      return res.status(200).json({
        success: false,
        error: 'Could not extract value from Gemini response',
      });
    }
  } catch (error) {
    console.error('[Gemini Field] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function buildFieldPrompt(
  fieldId: number | string,
  fieldKey: string,
  address: string,
  publicRemarks?: string
): string {
  // Field-specific prompts
  const fieldPrompts: Record<string, string> = {
    '48_interior_condition': `
      Based on the property listing for ${address}:
      ${publicRemarks ? `Listing Description: "${publicRemarks}"` : ''}

      Assess the interior condition. Return ONLY one of:
      - "Excellent" (renovated, updated, pristine)
      - "Good" (well-maintained, move-in ready)
      - "Average" (typical wear, functional)
      - "Fair" (dated, needs updates)
      - "Poor" (needs significant work)
    `,

    '134_smart_home_features': `
      Based on the property listing for ${address}:
      ${publicRemarks ? `Listing Description: "${publicRemarks}"` : ''}

      List any smart home features mentioned (Nest, Ring, smart locks, etc.).
      Return "None mentioned" if no smart features found.
    `,

    // Add prompts for each field...
  };

  return fieldPrompts[fieldKey] || `
    For the property at ${address}:
    ${publicRemarks ? `Listing Description: "${publicRemarks}"` : ''}

    What is the ${fieldKey.replace(/_/g, ' ')}?
    Return only the value, no explanation.
  `;
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 200,
        },
      }),
    }
  );

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function parseGeminiResponse(
  response: string,
  fieldId: number | string,
  fieldKey: string
): any {
  // Clean up response
  let value = response.trim();

  // Field-specific parsing
  if (fieldKey.includes('_yn')) {
    // Boolean fields
    value = /yes|true|1/i.test(value) ? 'Yes' : 'No';
  }

  // Reject non-answers
  if (/unknown|not available|cannot determine|n\/a/i.test(value)) {
    return null;
  }

  return value;
}
```

---

## PART 5: PUBLICREMARKS PARSE SCRIPT

### Purpose
Automatically extract field values from MLS PublicRemarks text before LLM calls.

### Create New File: `src/lib/remarks-parser.ts`

```typescript
/**
 * PublicRemarks Parser
 * Extracts structured data from free-text MLS descriptions
 *
 * Two modes:
 * 1. Regex Layer (automatic, free, instant)
 * 2. LLM Layer (on-demand via Gemini button)
 */

export interface ParsedRemarks {
  fields: Record<string, { value: any; confidence: 'High' | 'Medium' | 'Low' }>;
  inferences: {
    sellerMotivation?: 'High' | 'Medium' | 'Low';
    propertyCondition?: 'Excellent' | 'Good' | 'Average' | 'Fair' | 'Poor';
    urgencyLevel?: 'High' | 'Medium' | 'Low';
    negotiationRoom?: 'High' | 'Medium' | 'Low';
    redFlags?: string[];
  };
  rawRemarks: string;
}

/**
 * REGEX LAYER - Fast, free, runs automatically
 */
export function parsePublicRemarks(remarks: string): ParsedRemarks {
  const result: ParsedRemarks = {
    fields: {},
    inferences: {},
    rawRemarks: remarks,
  };

  if (!remarks) return result;

  const text = remarks.toLowerCase();

  // ================================================================
  // FIELD EXTRACTIONS
  // ================================================================

  // Field 40: Roof Age
  const roofYearMatch = remarks.match(/(?:new|replaced|installed)\s+roof\s+(?:in\s+)?(\d{4})/i);
  if (roofYearMatch) {
    const roofYear = parseInt(roofYearMatch[1]);
    const age = new Date().getFullYear() - roofYear;
    result.fields['40_roof_age_est'] = {
      value: `${age} years (installed ${roofYear})`,
      confidence: 'High'
    };
  }

  // Field 46: HVAC Age
  const hvacYearMatch = remarks.match(/(?:new|replaced|installed)\s+(?:ac|a\/c|hvac|air\s+condition(?:er|ing)?)\s+(?:in\s+)?(\d{4})/i);
  if (hvacYearMatch) {
    const hvacYear = parseInt(hvacYearMatch[1]);
    const age = new Date().getFullYear() - hvacYear;
    result.fields['46_hvac_age'] = {
      value: `${age} years (installed ${hvacYear})`,
      confidence: 'High'
    };
  }

  // Field 39: Roof Type
  const roofTypePatterns = [
    { pattern: /tile\s+roof/i, value: 'Tile' },
    { pattern: /metal\s+roof/i, value: 'Metal' },
    { pattern: /shingle\s+roof/i, value: 'Shingle' },
    { pattern: /flat\s+roof/i, value: 'Flat' },
    { pattern: /spanish\s+tile/i, value: 'Tile' },
  ];
  for (const { pattern, value } of roofTypePatterns) {
    if (pattern.test(remarks)) {
      result.fields['39_roof_type'] = { value, confidence: 'High' };
      break;
    }
  }

  // Field 49: Flooring Type
  const flooringPatterns = [
    { pattern: /hardwood\s+floor/i, value: 'Hardwood' },
    { pattern: /tile\s+floor/i, value: 'Tile' },
    { pattern: /laminate\s+floor/i, value: 'Laminate' },
    { pattern: /carpet/i, value: 'Carpet' },
    { pattern: /vinyl\s+plank/i, value: 'Vinyl Plank' },
    { pattern: /marble\s+floor/i, value: 'Marble' },
    { pattern: /travertine/i, value: 'Travertine' },
  ];
  const foundFlooring: string[] = [];
  for (const { pattern, value } of flooringPatterns) {
    if (pattern.test(remarks)) {
      foundFlooring.push(value);
    }
  }
  if (foundFlooring.length > 0) {
    result.fields['49_flooring_type'] = {
      value: foundFlooring.join(', '),
      confidence: 'Medium'
    };
  }

  // Field 52: Fireplace
  if (/fireplace/i.test(remarks)) {
    result.fields['52_fireplace_yn'] = { value: 'Yes', confidence: 'High' };
  }

  // Field 54: Pool
  if (/\bpool\b/i.test(remarks) && !/no\s+pool|pool\s+community/i.test(remarks)) {
    result.fields['54_pool_yn'] = { value: 'Yes', confidence: 'High' };
  }

  // Field 55: Pool Type
  const poolTypePatterns = [
    { pattern: /heated\s+pool/i, value: 'Heated' },
    { pattern: /screened\s+pool/i, value: 'Screened' },
    { pattern: /salt\s*water\s+pool/i, value: 'Saltwater' },
    { pattern: /infinity\s+pool/i, value: 'Infinity' },
    { pattern: /in[\s-]*ground\s+pool/i, value: 'In-ground' },
  ];
  for (const { pattern, value } of poolTypePatterns) {
    if (pattern.test(remarks)) {
      result.fields['55_pool_type'] = { value, confidence: 'Medium' };
      break;
    }
  }

  // Field 133: EV Charging
  if (/ev\s+charg|tesla\s+charg|electric\s+vehicle/i.test(remarks)) {
    result.fields['133_ev_charging'] = { value: 'Yes - EV Charger Installed', confidence: 'High' };
  }

  // Field 134: Smart Home Features
  const smartHomePatterns = [
    /nest\s+thermostat/i,
    /ring\s+doorbell/i,
    /smart\s+home/i,
    /smart\s+lock/i,
    /home\s+automation/i,
    /alexa/i,
    /google\s+home/i,
    /ecobee/i,
  ];
  const smartFeatures: string[] = [];
  for (const pattern of smartHomePatterns) {
    const match = remarks.match(pattern);
    if (match) smartFeatures.push(match[0]);
  }
  if (smartFeatures.length > 0) {
    result.fields['134_smart_home_features'] = {
      value: smartFeatures.join(', '),
      confidence: 'High'
    };
  }

  // Field 135: Accessibility Modifications
  const accessibilityPatterns = [
    /wheelchair\s+accessible/i,
    /ada\s+compliant/i,
    /handicap\s+accessible/i,
    /ramp/i,
    /grab\s+bars/i,
    /walk[\s-]*in\s+shower/i,
    /zero[\s-]*entry/i,
  ];
  const accessFeatures: string[] = [];
  for (const pattern of accessibilityPatterns) {
    if (pattern.test(remarks)) {
      accessFeatures.push(remarks.match(pattern)![0]);
    }
  }
  if (accessFeatures.length > 0) {
    result.fields['135_accessibility_modifications'] = {
      value: accessFeatures.join(', '),
      confidence: 'High'
    };
  }

  // Field 59: Recent Renovations
  const renovationPatterns = [
    /recently\s+(?:renovated|updated|remodeled)/i,
    /new\s+kitchen/i,
    /updated\s+(?:kitchen|bath)/i,
    /(?:complete|total|full)\s+renovation/i,
    /just\s+(?:renovated|updated)/i,
  ];
  for (const pattern of renovationPatterns) {
    if (pattern.test(remarks)) {
      result.fields['59_recent_renovations'] = {
        value: 'Yes - ' + remarks.match(pattern)![0],
        confidence: 'Medium'
      };
      break;
    }
  }

  // Field 131: View Type
  const viewPatterns = [
    { pattern: /water\s+view/i, value: 'Water' },
    { pattern: /ocean\s+view/i, value: 'Ocean' },
    { pattern: /lake\s+view/i, value: 'Lake' },
    { pattern: /golf\s+(?:course\s+)?view/i, value: 'Golf Course' },
    { pattern: /city\s+view/i, value: 'City' },
    { pattern: /mountain\s+view/i, value: 'Mountain' },
    { pattern: /pool\s+view/i, value: 'Pool' },
    { pattern: /preserve\s+view/i, value: 'Nature Preserve' },
  ];
  for (const { pattern, value } of viewPatterns) {
    if (pattern.test(remarks)) {
      result.fields['131_view_type'] = { value, confidence: 'High' };
      break;
    }
  }

  // ================================================================
  // INFERENCES
  // ================================================================

  // Seller Motivation
  const highMotivation = [
    /motivated\s+seller/i,
    /must\s+sell/i,
    /bring\s+(?:all\s+)?offers/i,
    /price\s+reduced/i,
    /relocating/i,
    /divorce/i,
    /estate\s+sale/i,
    /job\s+transfer/i,
  ];
  const mediumMotivation = [
    /priced\s+to\s+sell/i,
    /won't\s+last/i,
    /flexible/i,
    /make\s+(?:an\s+)?offer/i,
  ];

  if (highMotivation.some(p => p.test(remarks))) {
    result.inferences.sellerMotivation = 'High';
  } else if (mediumMotivation.some(p => p.test(remarks))) {
    result.inferences.sellerMotivation = 'Medium';
  }

  // Property Condition
  const excellentCondition = [
    /pristine/i, /immaculate/i, /mint\s+condition/i,
    /completely\s+renovated/i, /fully\s+updated/i,
    /like\s+new/i, /showroom/i, /stunning/i,
  ];
  const goodCondition = [
    /move[\s-]*in\s+ready/i, /well[\s-]*maintained/i,
    /turn[\s-]*key/i, /updated/i, /upgraded/i,
  ];
  const poorCondition = [
    /needs\s+(?:work|tlc|updating)/i, /as[\s-]*is/i,
    /investor\s+special/i, /handyman/i, /fixer/i,
    /cash\s+only/i, /estate\s+sale/i,
  ];

  if (excellentCondition.some(p => p.test(remarks))) {
    result.inferences.propertyCondition = 'Excellent';
    result.fields['48_interior_condition'] = { value: 'Excellent', confidence: 'Medium' };
  } else if (goodCondition.some(p => p.test(remarks))) {
    result.inferences.propertyCondition = 'Good';
    result.fields['48_interior_condition'] = { value: 'Good', confidence: 'Medium' };
  } else if (poorCondition.some(p => p.test(remarks))) {
    result.inferences.propertyCondition = 'Fair';
    result.fields['48_interior_condition'] = { value: 'Fair', confidence: 'Medium' };
  }

  // Red Flags
  const redFlagPatterns = [
    { pattern: /as[\s-]*is/i, flag: 'Sold As-Is' },
    { pattern: /cash\s+only/i, flag: 'Cash Only' },
    { pattern: /no\s+fha/i, flag: 'No FHA Financing' },
    { pattern: /flood\s+zone/i, flag: 'Flood Zone' },
    { pattern: /mold/i, flag: 'Possible Mold' },
    { pattern: /foundation\s+(?:issues?|problems?|cracks?)/i, flag: 'Foundation Issues' },
    { pattern: /roof\s+(?:leak|damage)/i, flag: 'Roof Issues' },
    { pattern: /short\s+sale/i, flag: 'Short Sale' },
    { pattern: /foreclosure/i, flag: 'Foreclosure' },
  ];

  result.inferences.redFlags = [];
  for (const { pattern, flag } of redFlagPatterns) {
    if (pattern.test(remarks)) {
      result.inferences.redFlags.push(flag);
    }
  }

  return result;
}

/**
 * Merge parsed remarks into existing property fields
 * Only fills in missing fields (doesn't overwrite MLS data)
 */
export function mergeRemarksIntoFields(
  existingFields: Record<string, any>,
  parsedRemarks: ParsedRemarks
): Record<string, any> {
  const merged = { ...existingFields };

  for (const [fieldKey, extracted] of Object.entries(parsedRemarks.fields)) {
    // Only add if field doesn't already have a value
    if (!merged[fieldKey] || !merged[fieldKey].value) {
      merged[fieldKey] = {
        value: extracted.value,
        source: 'PublicRemarks Parser',
        confidence: extracted.confidence,
        notes: 'Extracted from listing description',
      };
    }
  }

  return merged;
}
```

### Integration Point in bridge-field-mapper.ts

```typescript
// After mapping MLS fields, parse PublicRemarks
import { parsePublicRemarks, mergeRemarksIntoFields } from './remarks-parser';

export function mapBridgePropertyToSchema(bridgeProperty: BridgeProperty): MappedPropertyData {
  // ... existing field mapping ...

  // Parse PublicRemarks for additional fields
  if (bridgeProperty.PublicRemarks) {
    const parsedRemarks = parsePublicRemarks(bridgeProperty.PublicRemarks);

    // Merge parsed fields (won't overwrite existing MLS data)
    fields = mergeRemarksIntoFields(fields, parsedRemarks);

    // Store inferences separately
    if (parsedRemarks.inferences.sellerMotivation) {
      fields['_seller_motivation'] = {
        value: parsedRemarks.inferences.sellerMotivation,
        source: 'PublicRemarks Parser',
        confidence: 'Medium',
      };
    }

    if (parsedRemarks.inferences.redFlags?.length) {
      fields['_red_flags'] = {
        value: parsedRemarks.inferences.redFlags.join(', '),
        source: 'PublicRemarks Parser',
        confidence: 'Medium',
      };
    }
  }

  return { fields, ... };
}
```

---

## PART 6: IMPLEMENTATION CHECKLIST

### Phase 1: Remove Gemini from Cascade
- [ ] Modify `api/property/search.ts` - Remove Gemini from LLM cascade
- [ ] Keep GPT-4 as sole cascade LLM
- [ ] Test search still works without Gemini timeouts

### Phase 2: Create Gemini Endpoint
- [ ] Create `api/property/gemini-field.ts`
- [ ] Add field-specific prompts
- [ ] Add response parsing logic
- [ ] Test endpoint with sample fields

### Phase 3: Add Gemini Button to UI
- [ ] Add GEMINI_ENABLED_FIELDS constant to PropertyDetail.tsx
- [ ] Create GeminiButton component
- [ ] Add button rendering logic for enabled fields
- [ ] Style button (purple to differentiate from blue Tavily)

### Phase 4: Create Remarks Parser
- [ ] Create `src/lib/remarks-parser.ts`
- [ ] Implement regex patterns for each field
- [ ] Implement inference logic (motivation, condition, flags)
- [ ] Integrate into bridge-field-mapper.ts

### Phase 5: Testing
- [ ] Test Gemini button on 5+ fields
- [ ] Test remarks parser on 10+ listings
- [ ] Verify no regressions in search speed
- [ ] Verify field values populate correctly

---

## ENVIRONMENT VARIABLES REQUIRED

```bash
# Already should exist
GEMINI_API_KEY=your_gemini_api_key_here

# Verify in Vercel dashboard
```

---

## ESTIMATED FIELD COVERAGE IMPROVEMENT

| Phase | Fields Improved | Method |
|-------|-----------------|--------|
| Remarks Parser (Regex) | 10-15 fields | Automatic, free |
| Gemini Button | 80+ fields | On-demand |
| Inferences | 4 new data points | Automatic |

**Total:** 80+ fields now accessible via Gemini, 10-15 auto-extracted from remarks.

---

## RESUME THIS WORK

Read this file at start of session:
```
D:\Clues_Quantum_Property_Dashboard\GEMINI_BUTTON_IMPLEMENTATION_GUIDE.md
```

Follow the implementation checklist in PART 6.

---

**Created by:** Claude Code Session 2026-01-13
**For:** CLUES Property Dashboard
