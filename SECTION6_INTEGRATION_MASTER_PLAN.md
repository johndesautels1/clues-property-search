# SECTION 6: INTERIOR FEATURES - INTEGRATION MASTER PLAN
**Conversation ID:** SECTION6-INT-20251210
**Date:** 2025-12-10
**Status:** Ready to Start

---

## 🎯 MISSION
Integrate Section 6 (Interior Features) charts from HTML into React/Recharts components following the proven patterns from Sections 3, 4, and 5.

---

## 📋 PROJECT STRUCTURE REFERENCE

### Core Application Files
```
/d/Clues_Quantum_Property_Dashboard/
├── src/
│   ├── types/
│   │   ├── fields-schema.ts          ⚠️ SOURCE OF TRUTH - DO NOT MODIFY
│   │   ├── property.ts                Property interfaces
│   │   └── property-110-fields.ts     Legacy field definitions
│   │
│   ├── lib/
│   │   ├── visualsDataMapper.ts       Maps property data to ChartProperty
│   │   ├── cluesSmartScoring.ts       CLUES-Smart scoring algorithm
│   │   ├── field-normalizer.ts        Field number normalization
│   │   └── visualConstants.ts         Property colors (Green/Lavender/Pink)
│   │
│   ├── components/visuals/
│   │   ├── Category06_Placeholder.tsx  ⚠️ TARGET FILE TO UPDATE
│   │   │
│   │   ├── Category03_PropertyBasics.tsx      ✅ REFERENCE (Section 3)
│   │   ├── Category04_HOATaxes.tsx            ✅ REFERENCE (Section 4)
│   │   ├── Category05_StructureSystems.tsx    ✅ REFERENCE (Section 5)
│   │   │
│   │   ├── SmartScoreBadge.tsx        CLUES-Smart badge component
│   │   ├── ChartLegends.tsx           Property color legends
│   │   └── PropertyComparisonSelector.tsx  Property dropdown
│   │
│   └── components/visuals/recharts/
│       ├── Section6InteriorChart.tsx   ⚠️ TARGET FILE TO CREATE/UPDATE
│       │
│       ├── PropertyBasicsCharts.tsx         ✅ REFERENCE (Section 3)
│       ├── PropertyBasicsAdvancedCharts.tsx ✅ REFERENCE (Section 3 advanced)
│       ├── HOATaxesCharts.tsx               ✅ REFERENCE (Section 4)
│       ├── Section5StructureSystemsCharts.tsx  ✅ REFERENCE (Section 5)
│       └── Section5PerplexityCharts.tsx     ✅ REFERENCE (Section 5 advanced)
│
├── api/property/
│   ├── search.ts                      API search endpoint
│   └── parse-mls-pdf.ts              PDF parsing
│
└── Documentation/
    ├── GRAND_MASTER_CHART_INSTRUCTIONS.md  📖 Complete chart generation guide
    ├── SCHEMA_FIELDS_BY_SECTION.md         📖 All 168 fields organized
    ├── Section5_Charts.md                  📖 Section 5 example documentation
    └── SECTION6_INTEGRATION_MASTER_PLAN.md ⚠️ THIS FILE
```

---

## 📊 SECTION 6: INTERIOR FEATURES - FIELD MAPPING

### SOURCE OF TRUTH: src/types/fields-schema.ts
**Section:** Group 6 - Interior Features
**Fields:** 49-53 (5 fields total)
**Chart Numbers:** 6-1 through 6-X (TBD based on HTML uploads)

### Field Definitions
| Field # | Key | Label | Type | Required | Options |
|---------|-----|-------|------|----------|---------|
| **49** | flooring_type | Flooring Type | text | No | - |
| **50** | kitchen_features | Kitchen Features | text | No | - |
| **51** | appliances_included | Appliances Included | multiselect | No | Refrigerator, Dishwasher, Range/Oven, Microwave, Washer, Dryer, Disposal |
| **52** | fireplace_yn | Fireplace | boolean | No | - |
| **53** | fireplace_count | Fireplace Count | number | No | - |

### ChartProperty Interface Mapping
From `src/lib/visualsDataMapper.ts`:
```typescript
export interface ChartProperty {
  // Section 6: Interior Features (Fields 49-53)
  flooringType?: string;           // Field 49
  kitchenFeatures?: string;        // Field 50
  appliancesIncluded?: string[];   // Field 51 (multiselect)
  fireplaceYn?: boolean;           // Field 52
  fireplaceCount?: number;         // Field 53
}
```

---

## 🎨 DESIGN SYSTEM REFERENCE

### Property Colors (visualConstants.ts)
```typescript
Property 1 (Green):    #22c55e (rgb(34, 197, 94))
Property 2 (Lavender): #8b5cf6 (rgb(139, 92, 246))
Property 3 (Pink):     #ec4899 (rgb(236, 72, 153))
```

### CLUES-Smart Scoring Thresholds
From `src/lib/cluesSmartScoring.ts`:
```typescript
≥ 90: "Exceptional" (Green)
75-89: "Above Average" (Blue)
60-74: "Average" (Yellow)
45-59: "Below Average" (Orange)
< 45: "Needs Improvement" (Red)
```

### Florida-Specific Context
- **High HOA fees:** Common in FL condos/communities
- **Property taxes:** Lower than national average (no state income tax)
- **Hurricane features:** Impact roof type, exterior materials
- **Appliances:** AC, washer, dryer, hurricane shutters highly valued

---

## ✅ COMPLETED SECTIONS (FOR REFERENCE)

### Section 3: Property Basics ✅
**Files:**
- `src/components/visuals/Category03_PropertyBasics.tsx`
- `src/components/visuals/recharts/PropertyBasicsCharts.tsx`
- `src/components/visuals/recharts/PropertyBasicsAdvancedCharts.tsx`

**Charts:** 10 total (3-1 through 3-10)
- 3-1: Bedrooms & Bathrooms
- 3-2: Living Space (sq ft)
- 3-3: Lot Size (acres)
- 3-4: Age & Stories
- 3-5: Bed-to-Bath Ratio
- 3-6: Space Efficiency
- 3-7: Property Age Scoring
- 3-8: Combined Space Analysis (Bubble)
- 3-9: Property Age vs Living Space (Scatter)
- 3-10: Property Profile Radar

### Section 4: HOA & Taxes ✅
**Files:**
- `src/components/visuals/Category04_HOATaxes.tsx`
- `src/components/visuals/recharts/HOATaxesCharts.tsx`

**Charts:** 5 total (4-1 through 4-5)
- 4-1: HOA Presence (3 separate donuts)
- 4-2: Property Tax Rates (Relative scoring, lowest = 100)
- 4-3: Annual HOA Fees (0-36000 range)
- 4-4: Annual Property Taxes
- 4-5: Monthly Housing Costs (Taxes + HOA stacked)

### Section 5: Structure & Systems ✅
**Files:**
- `src/components/visuals/Category05_StructureSystems.tsx`
- `src/components/visuals/recharts/Section5StructureSystemsCharts.tsx`
- `src/components/visuals/recharts/Section5PerplexityCharts.tsx`

**Charts:** 6 total (5-1 through 5-6)
- 5-1: Construction Quality Score (Composite of materials + condition)
- 5-2: Roof Type Distribution
- 5-3: Exterior Materials
- 5-4: Foundation Types
- 5-5: Interior Condition Rating
- 5-6: System Age Analysis (HVAC, Roof)

---

## 🔧 INTEGRATION WORKFLOW

### Step 1: Receive HTML Chart Files
User will upload chart HTML files from Claude/Perplexity, likely named:
- `Section6_Chart1.html` (or similar)
- Expected charts: 3-6 charts based on 5 fields

### Step 2: Analyze HTML Structure
For each HTML file:
1. Identify chart type (bar, pie, line, radar, scatter, etc.)
2. Extract data structure and fields used
3. Note any Florida-specific context or scoring
4. Document chart title, axes, tooltips

### Step 3: Create React/Recharts Components
**Target file:** `src/components/visuals/recharts/Section6InteriorChart.tsx`

**Template structure (based on Section 5):**
```typescript
/**
 * Section 6: Interior Features Charts
 * Fields 49-53: Flooring, Kitchen, Appliances, Fireplace
 * Charts: 6-1 through 6-X
 */

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { SmartScoreBadge } from '../SmartScoreBadge';

interface Home {
  id: string;
  name: string;
  color: string;

  // Fields 49-53
  flooringType: string;          // Field 49
  kitchenFeatures: string;       // Field 50
  appliancesIncluded: string[];  // Field 51
  fireplaceYn: boolean;          // Field 52
  fireplaceCount: number;        // Field 53
}

interface SectionChartsProps {
  homes: Home[];
}

export default function Section6InteriorChart({ homes }: SectionChartsProps) {
  // Chart 6-1: [Chart name from HTML]
  const chart1Data = homes.map(h => ({
    name: h.name.split(',')[0],
    // ... field mappings
  }));

  // Chart 6-2: [Chart name from HTML]
  // ... etc

  return (
    <div className="space-y-8">
      {/* Chart 6-1 */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">
            Chart 6-1: [Title] (Field XX)
          </h3>
          <SmartScoreBadge score={score} />
        </div>
        <ResponsiveContainer width="100%" height={400}>
          {/* Recharts component */}
        </ResponsiveContainer>
        {/* Property color legend */}
      </div>

      {/* Chart 6-2, 6-3, etc. */}
    </div>
  );
}
```

### Step 4: Update Category06_Placeholder.tsx
**Target file:** `src/components/visuals/Category06_Placeholder.tsx`

**Changes needed:**
1. Import `Section6InteriorChart`
2. Map `ChartProperty[]` to `Home[]` interface
3. Render chart component
4. Verify field numbers (49-53)

**Template (based on Category05_StructureSystems.tsx):**
```typescript
/**
 * Category 06: Interior Features
 * Fields 49-53: Flooring, Kitchen, Appliances, Fireplace
 */

import type { ChartProperty } from '@/lib/visualsDataMapper';
import Section6InteriorChart from './recharts/Section6InteriorChart';

interface CategoryProps {
  properties: ChartProperty[];
}

function mapToSection6Homes(properties: ChartProperty[]) {
  return properties.map((p, idx) => ({
    id: p.id,
    name: p.address || 'Unknown Address',
    color: ['#22c55e', '#8b5cf6', '#ec4899'][idx] || '#22c55e',

    // Fields 49-53: Interior Features
    flooringType: p.flooringType || '',              // Field 49
    kitchenFeatures: p.kitchenFeatures || '',        // Field 50
    appliancesIncluded: p.appliancesIncluded || [],  // Field 51
    fireplaceYn: p.fireplaceYn || false,             // Field 52
    fireplaceCount: p.fireplaceCount || 0,           // Field 53
  }));
}

export default function Category06_InteriorFeatures({ properties }: CategoryProps) {
  const homes = mapToSection6Homes(properties);

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Section 6: Interior Features
        </h2>
        <p className="text-gray-400">
          Fields 49-53: Flooring, Kitchen, Appliances, Fireplace
        </p>
      </div>

      <Section6InteriorChart homes={homes} />
    </div>
  );
}
```

### Step 5: Verification Checklist
- [ ] All field numbers in comments match fields-schema.ts (49-53)
- [ ] Property colors correct (Green #22c55e, Lavender #8b5cf6, Pink #ec4899)
- [ ] SmartScoreBadge components rendered
- [ ] Chart titles include field numbers (e.g., "Chart 6-1: Appliances (Field 51)")
- [ ] Tooltips show full property addresses
- [ ] Units displayed correctly (%, count, boolean)
- [ ] Florida-specific context in scoring/descriptions
- [ ] Card-based layout with glass-card styling
- [ ] Responsive design (ResponsiveContainer)
- [ ] Property color legends below charts
- [ ] No console errors
- [ ] Data wires correctly from PropertyDetail page

### Step 6: Testing Protocol
```bash
# 1. Navigate to Property Detail page with 3 properties selected
# 2. Scroll to Section 6: Interior Features
# 3. Verify all charts render
# 4. Check console for errors
# 5. Inspect data in React DevTools
# 6. Take screenshots for documentation
```

---

## 📖 CRITICAL RULES (FROM GRAND_MASTER_CHART_INSTRUCTIONS.md)

### Field Mapping Rules
1. **NEVER modify** `src/types/fields-schema.ts`
2. **ALL field numbers in comments MUST match** fields-schema.ts exactly
3. Section 6 = Fields 49-53 ONLY
4. Use exact field keys from schema (flooringType, kitchenFeatures, etc.)

### Chart Generation Rules
1. **Property colors:** Green (#22c55e), Lavender (#8b5cf6), Pink (#ec4899)
2. **CLUES-Smart scoring:** Use 5-tier thresholds
3. **Field numbers in titles:** "Chart 6-1: Appliances (Field 51)"
4. **Tooltips:** Show full addresses, not truncated
5. **Units:** Always display (%, count, $, etc.)
6. **Florida context:** Hurricane features, climate considerations

### Code Style Rules
1. TypeScript strict mode
2. Functional components only (no class components)
3. Interface > Type for component props
4. Comments reference field numbers
5. Glass-card styling (glassmorphic UI)
6. Responsive design (mobile-friendly)

---

## 🚀 QUICK START PROMPT

**For new conversation, paste this:**

```
I'm ready to integrate Section 6: Interior Features charts into the CLUES Property Dashboard.

CONTEXT:
- Project: /d/Clues_Quantum_Property_Dashboard
- Section: 6 (Interior Features, Fields 49-53)
- Target files:
  1. src/components/visuals/Category06_Placeholder.tsx
  2. src/components/visuals/recharts/Section6InteriorChart.tsx (new)

REFERENCES:
- Master plan: SECTION6_INTEGRATION_MASTER_PLAN.md
- Field schema: src/types/fields-schema.ts (Fields 49-53)
- Section 5 example: src/components/visuals/Category05_StructureSystems.tsx

CHART HTML FILES:
[User will upload Section 6 chart HTML files here]

REQUIREMENTS:
1. Read existing Category06_Placeholder.tsx
2. Create Section6InteriorChart.tsx component
3. Convert HTML charts to React/Recharts
4. Follow Section 5 patterns (card layout, CLUES-Smart, property colors)
5. Verify field numbers 49-53 in all comments
6. Test on PropertyDetail page with 3 properties

Ready to proceed?
```

---

## 📚 ADDITIONAL RESOURCES

### Key Documentation Files
- `GRAND_MASTER_CHART_INSTRUCTIONS.md` - Complete chart generation guide
- `SCHEMA_FIELDS_BY_SECTION.md` - All 168 fields organized by section
- `Section5_Charts.md` - Detailed Section 5 example
- `SECTION5_DUAL_CHARTS_SUMMARY.md` - Section 5 final summary
- `PROPERTY_BASICS_WIRING_VERIFICATION.md` - Section 3 wiring verification

### Reference Components
- Section 3: Basic comparison charts + advanced visualizations
- Section 4: Financial charts with stacked bars and relative scoring
- Section 5: Material/condition charts with composite scoring

### Common Chart Types
- **Bar Chart:** Comparison of numeric/categorical data
- **Pie/Donut Chart:** Distribution or boolean (3 separate donuts, not portfolio)
- **Radar Chart:** Multi-dimensional property profiles
- **Scatter/Bubble Chart:** Relationship between 2-3 variables
- **Stacked Bar:** Composite costs/scores

---

## ✅ SUCCESS CRITERIA

Section 6 integration is complete when:
1. ✅ All HTML charts converted to React/Recharts
2. ✅ Field numbers 49-53 verified in all comments
3. ✅ Property colors correct (Green/Lavender/Pink)
4. ✅ CLUES-Smart scoring badges render
5. ✅ Charts display on PropertyDetail page
6. ✅ No console errors
7. ✅ Tooltips show full addresses
8. ✅ Responsive design works on mobile
9. ✅ Florida-specific context included
10. ✅ Documentation updated (create Section6_Charts.md)

---

## 🔄 SECTION PROGRESSION

**Status of all 22 sections:**
- ✅ Section 3: Property Basics (10 charts)
- ✅ Section 4: HOA & Taxes (5 charts)
- ✅ Section 5: Structure & Systems (6 charts)
- ⏳ **Section 6: Interior Features (IN PROGRESS)**
- 🔜 Section 7: Exterior Features (next)
- 🔜 Sections 1-2, 8-22 (remaining)

---

**END OF MASTER PLAN**
**Conversation ID:** SECTION6-INT-20251210
**Ready to execute: YES ✅**
