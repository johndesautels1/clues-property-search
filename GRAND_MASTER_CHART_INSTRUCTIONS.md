# GRAND MASTER CHART GENERATION INSTRUCTIONS
# CLUES Property Dashboard - Complete Charting System
**Version:** 1.0
**Date:** 2025-12-09
**For:** Perplexity, Claude Desktop Sonnet, GitHub Co-Pilot, and Claude Code

---

# TABLE OF CONTENTS
1. [Project Overview](#project-overview)
2. [Instructions for AI Chart Generators (Perplexity, Claude Desktop, Co-Pilot)](#part-1-instructions-for-ai-chart-generators)
3. [Instructions for Claude Code (Integration & Polish)](#part-2-instructions-for-claude-code)
4. [All 22 Schema Sections Reference](#schema-sections-reference)
5. [Critical Rules Summary](#critical-rules-summary)

---

# PROJECT OVERVIEW

## Mission
Build the world's most thorough and accurate real estate comparison visualization system. Compare ANY 3 properties across 168 data points, feed results into AI model for final CLUES Score.

## Tech Stack
- **Frontend:** React 18.x + TypeScript 5.x + Vite
- **Charts:** Recharts 2.x
- **Backend:** Postgres + Vercel
- **State:** Zustand (propertyStore)
- **Animation:** Framer Motion 11.x
- **Styling:** Tailwind CSS + Glassmorphic UI

## Source of Truth
**File:** `src/types/fields-schema.ts`
**Fields:** 168 total (138 original + 30 Stellar MLS)
**Groups:** 22 sections (Groups 1-22)
**NEVER MODIFY THIS FILE OR RELATED SCHEMA FILES**

---

# PART 1: INSTRUCTIONS FOR AI CHART GENERATORS
## (Perplexity, Claude Desktop Sonnet, GitHub Co-Pilot)

### YOUR ROLE
You will generate chart components for ONE section at a time. Each section has 3-10 charts showcasing different aspects of the data in that section.

---

## 1. SECTION-BY-SECTION STRUCTURE

### Completed Sections:
- ✅ **Section 3: Property Basics (Fields 17-29)** - 10 charts complete
  - Charts 3-1 through 3-7: Basic comparison charts
  - Charts 3-8 through 3-10: Advanced visualizations

### Remaining Sections (22 Total):

| Section # | Group Name | Field Range | Chart Numbers | Status |
|-----------|------------|-------------|---------------|--------|
| 1 | Address & Identity | Fields 1-9 | Charts 1-1 to 1-X | PENDING |
| 2 | Pricing & Value | Fields 10-16 | Charts 2-1 to 2-X | PENDING |
| **3** | **Property Basics** | **Fields 17-29** | **Charts 3-1 to 3-10** | **✅ COMPLETE** |
| 4 | HOA & Taxes | Fields 30-38 | Charts 4-1 to 4-X | **NEXT** |
| 5 | Structure & Systems | Fields 39-48 | Charts 5-1 to 5-X | PENDING |
| 6 | Interior Features | Fields 49-53 | Charts 6-1 to 6-X | PENDING |
| 7 | Exterior Features | Fields 54-58 | Charts 7-1 to 7-X | PENDING |
| 8 | Permits & Renovations | Fields 59-62 | Charts 8-1 to 8-X | PENDING |
| 9 | Assigned Schools | Fields 63-73 | Charts 9-1 to 9-X | PENDING |
| 10 | Location Scores | Fields 74-82 | Charts 10-1 to 10-X | PENDING |
| 11 | Distances & Amenities | Fields 83-87 | Charts 11-1 to 11-X | PENDING |
| 12 | Safety & Crime | Fields 88-90 | Charts 12-1 to 12-X | PENDING |
| 13 | Market & Investment Data | Fields 91-103 | Charts 13-1 to 13-X | PENDING |
| 14 | Utilities & Connectivity | Fields 104-116 | Charts 14-1 to 14-X | PENDING |
| 15 | Environment & Risk | Fields 117-130 | Charts 15-1 to 15-X | PENDING |
| 16 | Additional Features | Fields 131-138 | Charts 16-1 to 16-X | PENDING |
| 17 | Stellar MLS - Parking & Garage | Fields 139-143 | Charts 17-1 to 17-X | PENDING |
| 18 | Stellar MLS - Building Info | Fields 144-148 | Charts 18-1 to 18-X | PENDING |
| 19 | Stellar MLS - Legal & Tax | Fields 149-154 | Charts 19-1 to 19-X | PENDING |
| 20 | Stellar MLS - Waterfront | Fields 155-159 | Charts 20-1 to 20-X | PENDING |
| 21 | Stellar MLS - Leasing & Pets | Fields 160-165 | Charts 21-1 to 21-X | PENDING |
| 22 | Stellar MLS - Features & Flood | Fields 166-168 | Charts 22-1 to 22-X | PENDING |

---

## 2. YOUR CHART GENERATION WORKFLOW

### Step 1: Receive Assignment
You will be given:
- Section number (e.g., "Section 4: HOA & Taxes")
- Field range (e.g., "Fields 30-38")
- Number of charts to create (e.g., "Create 5-7 charts")

### Step 2: Study the Fields
Look up the fields in the schema reference below. Example for Section 4:
```
Field 30: hoa_yn (boolean)
Field 31: hoa_fee_annual (currency)
Field 32: hoa_name (text)
Field 33: hoa_includes (text)
Field 34: ownership_type (select)
Field 35: annual_taxes (currency)
Field 36: tax_year (number)
Field 37: property_tax_rate (percentage)
Field 38: tax_exemptions (text)
```

### Step 3: Design Chart Concepts
For EACH field or logical grouping, design 1-3 different chart visualizations. Aim for visual diversity:

**Chart Types to Use:**
- Bar Charts (simple, grouped, stacked)
- Line Charts
- Area Charts
- Pie/Donut Charts
- Radar Charts
- Scatter/Bubble Charts
- Heatmaps
- Tree Maps
- Funnel Charts
- Waterfall Charts
- **Get creative!** Use different Recharts types

**Example for HOA & Taxes:**
- Chart 4-1: HOA Fee Comparison (Bar Chart)
- Chart 4-2: Annual Taxes Comparison (Grouped Bar Chart)
- Chart 4-3: Tax Rate vs HOA Fee (Scatter Chart)
- Chart 4-4: Total Housing Cost Breakdown (Stacked Bar Chart showing Taxes + HOA)
- Chart 4-5: Ownership Type Distribution (Pie Chart)
- Chart 4-6: Tax Burden Analysis (Waterfall Chart)

---

## 3. CHART CODE STRUCTURE (REQUIRED TEMPLATE)

### Each Chart Function Must Follow This Exact Structure:

```typescript
// ============================================
// CHART X-Y: [CHART NAME IN CAPS]
// [Brief description of what this chart shows]
// ============================================
function ChartName({ homes }: { homes: Home[] }) {
  // 1. CALCULATE RAW VALUES
  const rawValues = homes.map(h => /* extract field value */);

  // 2. CALCULATE CLUES-SMART SCORES (0-100)
  // Use scoreHigherIsBetter() or scoreLowerIsBetter() or custom scoring
  const scores = scoreHigherIsBetter(rawValues);

  // 3. FIND WINNER
  const maxScore = Math.max(...scores);
  const winnerIndices = scores
    .map((s, i) => (s === maxScore ? i : -1))
    .filter(i => i !== -1);

  // 4. PREPARE CHART DATA
  const chartData = homes.map((h, idx) => ({
    name: h.name.split(',')[0], // Short address
    value: rawValues[idx],
    score: scores[idx],
    color: h.color, // Use property color, not score color!
  }));

  // 5. CONSOLE LOGGING (REQUIRED!)
  useEffect(() => {
    console.log('🔍 Chart X-Y: [Name] - SMART SCORING:');
    chartData.forEach((d) => {
      console.log(`📊 ${d.name}:`);
      console.log('  Raw value:', d.value);
      console.log(`  🧠 SMART SCORE: ${d.score}/100 (${getScoreLabel(d.score)})`);
    });
    console.log(`🏆 WINNER: ${winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')} with score ${maxScore}`);
  }, [homes]);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      {/* BRAIN WIDGET - TOP RIGHT (REQUIRED!) */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: `${getScoreColor(maxScore)}20`,
          border: `2px solid ${getScoreColor(maxScore)}`
        }}
      >
        <span className="text-xl">🧠</span>
        <div className="text-xs">
          <div className="font-bold text-white">SMART Score</div>
          <div style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>
            {maxScore}/100
          </div>
        </div>
      </div>

      {/* TITLE */}
      <h3 className="text-lg font-semibold text-white mb-2">
        Chart X-Y: [Chart Name]
      </h3>
      <p className="text-xs text-gray-400 mb-4">[Subtitle explaining what's being compared]</p>

      {/* RECHARTS CHART */}
      <ResponsiveContainer width="100%" height={320}>
        {/* YOUR CHART CODE HERE */}
      </ResponsiveContainer>

      {/* WINNER BADGE (REQUIRED!) */}
      <div className="mt-4 flex justify-center">
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-xl"
          style={{
            background: `${getScoreColor(maxScore)}20`,
            border: `2px solid ${getScoreColor(maxScore)}`
          }}
        >
          <span className="text-2xl">🏆</span>
          <div>
            <div className="text-sm font-bold text-white">
              Winner: {winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')}
            </div>
            <div className="text-xs text-gray-300">
              CLUES-Smart Score: <span style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>
                {maxScore}/100
              </span> ({getScoreLabel(maxScore)}) - [Why they won]
            </div>
          </div>
        </div>
      </div>

      {/* SMART SCALE LEGEND (REQUIRED!) */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-purple-400">
        <p className="text-xs font-bold text-purple-300 mb-2">CLUES-Smart Score Scale:</p>
        <div className="grid grid-cols-5 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#4CAF50' }}></div>
            <span className="text-gray-300">81-100: Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#2196F3' }}></div>
            <span className="text-gray-300">61-80: Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FFEB3B' }}></div>
            <span className="text-gray-300">41-60: Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF9800' }}></div>
            <span className="text-gray-300">21-40: Fair</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#FF4444' }}></div>
            <span className="text-gray-300">0-20: Poor</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          [Explanation of how this chart is scored]
        </p>
      </div>
    </div>
  );
}
```

---

## 4. CRITICAL REQUIREMENTS (DO NOT VIOLATE!)

### ❌ NEVER DO THESE THINGS:

1. **❌ DO NOT use dark text on dark backgrounds**
   - ALL tooltip text MUST be `color: '#ffffff'` (bright white)
   - ALL tooltip `labelStyle` and `itemStyle` MUST be `color: '#ffffff'`

2. **❌ DO NOT overlap text on text**
   - Use proper spacing, padding, margins
   - X-axis labels: horizontal, fontSize={12}, fontWeight={600}, NO rotation

3. **❌ DO NOT confuse property colors with score colors**
   - **Property Colors (3):** Use for chart elements (bars, lines, bubbles, etc.)
     - Property 1: Green `#22c55e`
     - Property 2: Lavender `#8b5cf6`
     - Property 3: Pink `#ec4899`
   - **Score Colors (5):** ONLY use for badges/widgets
     - 81-100: `#4CAF50` (Green - Excellent)
     - 61-80: `#2196F3` (Blue - Good)
     - 41-60: `#FFEB3B` (Yellow - Average)
     - 21-40: `#FF9800` (Orange - Fair)
     - 0-20: `#FF4444` (Red - Poor)

4. **❌ DO NOT use wrong score thresholds**
   - Correct: 81/61/41/21
   - Wrong: 100/75/50/25

5. **❌ DO NOT forget required elements**
   - Brain widget (top right) - REQUIRED
   - Winner badge (below chart) - REQUIRED
   - Smart Scale legend (bottom) - REQUIRED
   - Console logging - REQUIRED
   - Chart numbering in title - REQUIRED

6. **❌ DO NOT make charts without CLUES-Smart scoring**
   - Every chart MUST calculate 0-100 scores
   - Every chart MUST identify winner(s)
   - Every chart MUST show meaningful comparisons

---

## 5. DATA INTERFACE (USE PLACEHOLDER DATA)

### Home Interface Structure:
```typescript
interface Home {
  id: string;
  name: string; // Address
  // Include ONLY the fields for YOUR section
  // Example for HOA & Taxes (Section 4):
  hoaYn: boolean;
  hoaFeeAnnual: number;
  hoaName: string;
  hoaIncludes: string;
  ownershipType: string;
  annualTaxes: number;
  taxYear: number;
  propertyTaxRate: number;
  taxExemptions: string;
  // Color for chart elements
  color: string;
  // Supporting fields
  listingPrice?: number;
  livingSqft?: number;
}
```

### Create 3 Sample Properties:
```typescript
const SAMPLE_DATA: Home[] = [
  {
    id: 'sample-1',
    name: '1821 Hillcrest Drive',
    hoaYn: true,
    hoaFeeAnnual: 2400,
    hoaName: 'Hillcrest HOA',
    hoaIncludes: 'Pool, Landscaping, Security',
    ownershipType: 'Fee Simple',
    annualTaxes: 12500,
    taxYear: 2024,
    propertyTaxRate: 1.8,
    taxExemptions: 'Homestead',
    color: '#22c55e', // Green - Property 1
    listingPrice: 450000,
    livingSqft: 2200,
  },
  {
    id: 'sample-2',
    name: '1947 Oakwood Avenue',
    hoaYn: false,
    hoaFeeAnnual: 0,
    hoaName: '',
    hoaIncludes: '',
    ownershipType: 'Fee Simple',
    annualTaxes: 8900,
    taxYear: 2024,
    propertyTaxRate: 1.5,
    taxExemptions: 'Homestead, Senior',
    color: '#8b5cf6', // Lavender - Property 2
    listingPrice: 385000,
    livingSqft: 1850,
  },
  {
    id: 'sample-3',
    name: '725 Live Oak Street',
    hoaYn: true,
    hoaFeeAnnual: 1800,
    hoaName: 'Oak Grove Community',
    hoaIncludes: 'Pool, Gym',
    ownershipType: 'Condo',
    annualTaxes: 6200,
    taxYear: 2024,
    propertyTaxRate: 1.2,
    taxExemptions: 'None',
    color: '#ec4899', // Pink - Property 3
    listingPrice: 295000,
    livingSqft: 1400,
  },
];
```

---

## 6. SCORING FUNCTIONS (USE THESE!)

### Pre-Built Scoring Functions:
```typescript
// For fields where HIGHER is BETTER (bedrooms, sqft, etc.)
function scoreHigherIsBetter(values: number[]): number[] {
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max === min) return values.map(() => 100);
  return values.map(v => Math.round(((v - min) / (max - min)) * 100));
}

// For fields where LOWER is BETTER (taxes, fees, distance, etc.)
function scoreLowerIsBetter(values: number[]): number[] {
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max === min) return values.map(() => 100);
  return values.map(v => Math.round(((max - v) / (max - min)) * 100));
}

// For custom scoring logic
function customScore(value: number): number {
  // Your logic here
  // MUST return 0-100
}
```

### Color Helper:
```typescript
function getScoreColor(score: number): string {
  if (score >= 81) return '#4CAF50'; // Green - Excellent
  if (score >= 61) return '#2196F3'; // Blue - Good
  if (score >= 41) return '#FFEB3B'; // Yellow - Average
  if (score >= 21) return '#FF9800'; // Orange - Fair
  return '#FF4444'; // Red - Poor
}

function getScoreLabel(score: number): string {
  if (score >= 81) return 'Excellent';
  if (score >= 61) return 'Good';
  if (score >= 41) return 'Average';
  if (score >= 21) return 'Fair';
  return 'Poor';
}
```

---

## 7. CHART STYLING (USE THESE CONSTANTS)

```typescript
const COLORS = {
  background: 'rgba(15, 23, 42, 0.5)',
  border: 'rgba(255, 255, 255, 0.1)',
  text: '#e2e8f0',
  grid: 'rgba(255, 255, 255, 0.1)',
  tooltip: 'rgba(15, 23, 42, 0.95)',
};

// Glassmorphic container
className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"

// All tooltip configurations
<Tooltip
  contentStyle={{
    backgroundColor: COLORS.tooltip,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    color: '#ffffff', // ALWAYS WHITE!
  }}
  labelStyle={{ color: '#ffffff' }}
  itemStyle={{ color: '#ffffff' }}
/>
```

---

## 8. FILE NAMING AND ORGANIZATION

### Your Output File:
- **Filename:** `Section[N]_[SectionName]Charts.tsx`
- **Example:** `Section4_HOATaxesCharts.tsx`

### File Structure:
```typescript
/**
 * Section [N]: [Section Name] Visualizations (Fields X-Y)
 * [Brief description of section]
 * Score thresholds: 81-100 Excellent, 61-80 Good, 41-60 Average, 21-40 Fair, 0-20 Poor
 */

import { useEffect } from 'react';
import { /* Recharts imports */ } from 'recharts';

// Property data interface
interface Home {
  // ... fields
}

// Scoring helper functions
function scoreHigherIsBetter(values: number[]): number[] { /* ... */ }
function scoreLowerIsBetter(values: number[]): number[] { /* ... */ }
function getScoreColor(score: number): string { /* ... */ }
function getScoreLabel(score: number): string { /* ... */ }

const COLORS = { /* ... */ };

// ============================================
// CHART X-1: [FIRST CHART NAME]
// ============================================
function ChartName1({ homes }: { homes: Home[] }) {
  // ... chart code
}

// ============================================
// CHART X-2: [SECOND CHART NAME]
// ============================================
function ChartName2({ homes }: { homes: Home[] }) {
  // ... chart code
}

// ... all other charts

// ============================================
// MAIN COMPONENT
// ============================================
interface Section[N]ChartsProps {
  homes: Home[];
}

export default function Section[N]Charts({ homes }: Section[N]ChartsProps) {
  if (!homes.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        No properties to compare
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
        <div className="w-2 h-2 bg-[color] rounded-full animate-pulse" />
        <span className="text-sm font-medium text-[color]">[Section Name] Comparison with CLUES-Smart Scoring</span>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartName1 homes={homes} />
        <ChartName2 homes={homes} />
        {/* ... all charts */}
      </div>

      {/* Footer Note */}
      <div className="mt-6 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
        <p className="text-xs text-gray-400">
          <strong className="text-white">CLUES-Smart Scoring:</strong> Each metric scores 0-100 comparing properties...
        </p>
      </div>
    </div>
  );
}
```

---

## 9. WHAT TO DELIVER

### Your Deliverable Package:

1. **Main Chart File:** `Section[N]_[Name]Charts.tsx` with all chart functions
2. **Documentation:** Brief markdown explaining:
   - What each chart shows
   - Field mapping (which fields are used)
   - Scoring logic for each chart
   - Any special considerations
3. **Chart Count:** Specify how many charts you created

### Example Delivery Message:
```
SECTION 4: HOA & TAXES CHARTS COMPLETE

File: Section4_HOATaxesCharts.tsx

Charts Created (7 total):
- Chart 4-1: HOA Fee Comparison (Bar Chart) - Fields 30, 31
- Chart 4-2: Annual Taxes Comparison (Bar Chart) - Field 35
- Chart 4-3: Tax Rate Analysis (Line Chart) - Field 37
- Chart 4-4: Total Housing Cost (Stacked Bar) - Fields 31, 35
- Chart 4-5: Ownership Type Distribution (Pie Chart) - Field 34
- Chart 4-6: Tax Burden Comparison (Grouped Bar) - Fields 35, 37
- Chart 4-7: HOA Value Analysis (Scatter Chart) - Fields 31, 33

All charts:
✅ Include CLUES-Smart scoring (0-100)
✅ Have brain widgets with real scores
✅ Have winner badges
✅ Have Smart Scale legends
✅ Use correct property colors
✅ Use correct score colors for badges
✅ Have bright white tooltip text
✅ Have proper console logging
✅ Follow numbering system (4-1 through 4-7)
✅ Use placeholder data structured for real data integration

Ready for Claude Code integration!
```

---

## 10. FINAL CHECKLIST BEFORE DELIVERY

Before sending your charts to Claude Code, verify:

- [ ] All charts have Chart [Section]-[Number] in title
- [ ] All charts calculate 0-100 scores
- [ ] All charts identify winner(s)
- [ ] All brain widgets show REAL calculated scores (not hardcoded)
- [ ] All tooltips have `color: '#ffffff'` for text
- [ ] All chart elements use property colors (Green/Lavender/Pink)
- [ ] All badges/widgets use score colors (5-tier system)
- [ ] All X-axis labels are horizontal (no rotation)
- [ ] All charts have Smart Scale legend with 5 tiers
- [ ] All charts have winner badge
- [ ] All charts have console logging with 🔍🧠🏆 emojis
- [ ] Sample data uses correct property colors
- [ ] File is named correctly: `Section[N]_[Name]Charts.tsx`
- [ ] Code compiles (no TypeScript errors)
- [ ] All Recharts imports are correct

---

# PART 2: INSTRUCTIONS FOR CLAUDE CODE
## (Integration & Polish)

### YOUR ROLE
You will receive chart files from AI generators (Perplexity, Claude Desktop, Co-Pilot). Your job is to:
1. Integrate them into the codebase
2. Wire them to real data from the 168-field schema
3. Fix any issues
4. Test and verify
5. Commit to local repository

---

## 1. WHEN YOU RECEIVE CHARTS

### Step 1: Receive and Review
You will be given:
- Chart file: `Section[N]_[Name]Charts.tsx`
- Section information (e.g., "Section 4: HOA & Taxes, Fields 30-38")
- Number of charts created

### Step 2: Do NOT Create Your Own Charts
**CRITICAL RULE:** You are COMMANDED to obey 100% the provided charts. DO NOT:
- ❌ Decide to make your own charts
- ❌ Replace charts with different chart types
- ❌ Add extra charts not requested
- ❌ Remove charts that were provided
- **✅ ONLY integrate, wire, and polish what was given**

---

## 2. FILE PLACEMENT AND STRUCTURE

### Where Charts Go:

#### A. Create New Charts File
**Location:** `src/components/visuals/recharts/Section[N]Charts.tsx`
**Example:** `src/components/visuals/recharts/Section4Charts.tsx`

**Action:** Copy the provided chart file to this location.

#### B. Create Integration Component
**Location:** `src/components/visuals/Category[N]_Visuals.tsx`
**Example:** `src/components/visuals/Category4_Visuals.tsx`

**Purpose:** This file handles:
- Reading from propertyStore
- Mapping 168-field schema to chart format
- Property selection dropdowns (3 properties)
- Passing mapped data to charts

**Template:** Use Category21_AdvancedVisuals.tsx as reference

#### C. Update Toolbar Navigation
**File:** `src/components/ui/advanced-comparison/toolbar-with-sections.tsx`

**Action:** Add new section to toolbar subtabs

---

## 3. DATA WIRING (CRITICAL!)

### Step 1: Verify Source of Truth is UNCHANGED

**Before ANY work, run:**
```bash
git diff HEAD -- src/types/fields-schema.ts src/lib/field-normalizer.ts api/property/search.ts api/property/parse-mls-pdf.ts
```

**Expected Result:** NO OUTPUT (no changes)

**If there are changes:** STOP and report. Schema must NEVER be modified.

### Step 2: Create Field Mapper Function

**File:** `src/components/visuals/Category[N]_Visuals.tsx`

**Template:**
```typescript
// Map ChartProperty to Section-specific Home interface
function mapToSectionHomes(properties: ChartProperty[]): Home[] {
  return properties.map((p, idx) => ({
    id: p.id,
    name: p.address || 'Unknown Address',

    // MAP FIELDS FROM SCHEMA (READ-ONLY!)
    // Example for Section 4 (HOA & Taxes, Fields 30-38):
    hoaYn: p.hoaYn || false,                     // Field 30
    hoaFeeAnnual: p.hoaFeeAnnual || 0,           // Field 31
    hoaName: p.hoaName || '',                    // Field 32
    hoaIncludes: p.hoaIncludes || '',            // Field 33
    ownershipType: p.ownershipType || 'Unknown', // Field 34
    annualTaxes: p.annualTaxes || 0,             // Field 35
    taxYear: p.taxYear || new Date().getFullYear(), // Field 36
    propertyTaxRate: p.propertyTaxRate || 0,     // Field 37
    taxExemptions: p.taxExemptions || '',        // Field 38

    // Supporting fields (if needed)
    listingPrice: p.listingPrice || 0,           // Field 10
    livingSqft: p.livingSqft || 0,               // Field 21

    // Property color assignment
    color: ['#22c55e', '#8b5cf6', '#ec4899'][idx] || '#22c55e',
  }));
}
```

**CRITICAL:**
- Map field names EXACTLY as they appear in `fields-schema.ts`
- Use ONLY the fields for this section
- Add comments with field numbers
- This is READ-ONLY - no writes to schema

### Step 3: Connect to PropertyStore

```typescript
export default function Category[N]_Visuals() {
  const { fullProperties } = usePropertyStore();

  // State for 3 selected properties
  const [selectedProperties, setSelectedProperties] = useState<
    [string | null, string | null, string | null]
  >([null, null, null]);

  // Convert properties from store
  const allProperties = Array.from(fullProperties.values());
  const allChartProperties = mapPropertiesToChart(allProperties);

  // Fallback to sample data if no real properties
  const availableProperties = allChartProperties.length > 0
    ? allChartProperties
    : SAMPLE_PROPERTIES;

  // Filter to selected properties
  const selectedChartProperties = availableProperties.filter(p =>
    selectedProperties.includes(p.id)
  );

  // Map to section-specific format
  const sectionHomes = mapToSectionHomes(selectedChartProperties);

  return (
    <div className="space-y-8">
      <PropertyComparisonSelector
        properties={availableProperties}
        selectedProperties={selectedProperties}
        onPropertySelect={handlePropertySelect}
      />

      {sectionHomes.length > 0 ? (
        <Section[N]Charts homes={sectionHomes} />
      ) : (
        <div className="text-center py-12 text-gray-400">
          Please select at least one property
        </div>
      )}
    </div>
  );
}
```

### Step 4: Verify Field Mapping

**Create a mapping verification table in a comment:**
```typescript
// FIELD MAPPING VERIFICATION for Section [N]
// ============================================
// Schema Field → Chart Property → Mapped Field
// Field 30: hoa_yn → p.hoaYn → hoaYn
// Field 31: hoa_fee_annual → p.hoaFeeAnnual → hoaFeeAnnual
// ... all fields
```

---

## 4. INTEGRATION CHECKLIST

### Before Integration:
- [ ] Read provided chart file completely
- [ ] Understand what each chart shows
- [ ] Identify all fields used
- [ ] Verify fields exist in schema

### During Integration:
- [ ] Create `Section[N]Charts.tsx` in correct location
- [ ] Create `Category[N]_Visuals.tsx` with mapper
- [ ] Add to toolbar navigation
- [ ] Test with sample data
- [ ] Test with real properties (if available)

### After Integration:
- [ ] Verify NO schema changes: `git diff HEAD -- src/types/fields-schema.ts`
- [ ] Check browser console for errors
- [ ] Verify all charts render
- [ ] Verify all brain widgets show real scores
- [ ] Verify all winner badges show correct winners
- [ ] Verify all tooltips have white text
- [ ] Verify dropdown selector works
- [ ] Verify property colors are consistent

---

## 5. COMMON FIXES YOU'LL NEED TO MAKE

### Fix 1: Dark Tooltip Text
If tooltips have dark text on dark background:
```typescript
// WRONG:
<Tooltip contentStyle={{ color: COLORS.text }} />

// CORRECT:
<Tooltip
  contentStyle={{ color: '#ffffff' }}
  labelStyle={{ color: '#ffffff' }}
  itemStyle={{ color: '#ffffff' }}
/>
```

### Fix 2: Rotated X-Axis Labels
If addresses are rotated/stacked:
```typescript
// WRONG:
<XAxis dataKey="name" angle={-15} textAnchor="end" />

// CORRECT:
<XAxis
  dataKey="name"
  tick={{ fill: COLORS.text }}
  fontSize={12}
  fontWeight={600}
/>
```

### Fix 3: Missing Chart Numbers
If title doesn't have chart number:
```typescript
// WRONG:
<h3>HOA Fee Comparison</h3>

// CORRECT:
<h3 className="text-lg font-semibold text-white mb-2">
  Chart 4-1: HOA Fee Comparison
</h3>
```

### Fix 4: Wrong Score Colors on Chart Elements
If bars/lines use score colors instead of property colors:
```typescript
// WRONG:
<Bar dataKey="value" fill={getScoreColor(score)} />

// CORRECT:
<Bar dataKey="value" fill={data.color} />
// OR
{homes.map((h, idx) => (
  <Bar key={idx} dataKey={`value${idx}`} fill={h.color} />
))}
```

### Fix 5: Missing Smart Scale Legend
If chart doesn't have the 5-tier scale:
```typescript
// ADD THIS at bottom of chart:
<div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-purple-400">
  <p className="text-xs font-bold text-purple-300 mb-2">CLUES-Smart Score Scale:</p>
  <div className="grid grid-cols-5 gap-2 text-xs">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded" style={{ background: '#4CAF50' }}></div>
      <span className="text-gray-300">81-100: Excellent</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded" style={{ background: '#2196F3' }}></div>
      <span className="text-gray-300">61-80: Good</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded" style={{ background: '#FFEB3B' }}></div>
      <span className="text-gray-300">41-60: Average</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded" style={{ background: '#FF9800' }}></div>
      <span className="text-gray-300">21-40: Fair</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded" style={{ background: '#FF4444' }}></div>
      <span className="text-gray-300">0-20: Poor</span>
    </div>
  </div>
  <p className="text-xs text-gray-400 mt-2">
    [Explanation text]
  </p>
</div>
```

---

## 6. TESTING PROTOCOL

### Test with Sample Data:
```typescript
// In Category[N]_Visuals.tsx
const SAMPLE_PROPERTIES: ChartProperty[] = [
  {
    id: 'sample-1',
    address: '1821 Hillcrest Drive',
    // ... all fields with realistic values
    // Use the 3 test addresses from Property Basics
  },
  // ... 2 more
];
```

### Test with Real Data (if available):
1. Use the Add Property modal
2. Add 3 properties with data for this section
3. Navigate to the section
4. Select 3 properties from dropdowns
5. Verify all charts display correct data
6. Check console logs for verification

### Browser Console Verification:
Look for:
```
🔍 Chart X-Y: [Name] - SMART SCORING:
📊 [Property Name]:
  Raw value: [value]
  🧠 SMART SCORE: [score]/100 (Excellent)
🏆 WINNER: [Property Name] with score [score]
```

---

## 7. COMMIT PROTOCOL

### After Each Chart is Complete:
```bash
git add -A
git commit -m "Add Chart [Section]-[Number]: [Chart Name]

- [Brief description of what chart shows]
- Uses Fields [X, Y, Z] from schema
- Implements CLUES-Smart scoring
- Includes brain widget, winner badge, Smart Scale legend
- Verified against 168-field schema (no modifications)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### After Full Section is Complete:
```bash
git add -A
git commit -m "Complete Section [N]: [Section Name] Charts

Completed [X] charts for [Section Name] (Fields [Y-Z]):
- Chart [N]-1: [Name]
- Chart [N]-2: [Name]
... all charts

All charts:
✅ Wired to real data from 168-field schema
✅ Include CLUES-Smart scoring (0-100)
✅ Have brain widgets, winner badges, Smart Scale legends
✅ Use correct property colors and score colors
✅ Have white tooltip text
✅ Verified NO modifications to schema source of truth

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 8. VERIFICATION DOCUMENT (CREATE AFTER SECTION)

After completing a section, create:
**File:** `SECTION_[N]_VERIFICATION.md`

**Template:**
```markdown
# Section [N]: [Section Name] - 100% Data Flow Verification

**Date:** [Date]
**Status:** ✅ FULLY VERIFIED
**Charts:** [Count] charts complete

## DATA FLOW CHAIN
[Document complete flow from propertyStore to charts]

## FIELD MAPPING TABLE
| Field # | Field Name | Mapped To | Used In Charts |
|---------|------------|-----------|----------------|
...

## CHART VERIFICATION
### Chart [N]-1: [Name]
- Fields Used: ...
- Scoring Logic: ...
- ✅ Verified

... all charts

## SCHEMA VERIFICATION
git diff result: NO CHANGES

## 100% ATTESTATION
[Full attestation statement]
```

---

## 9. WHAT YOU MUST NEVER DO

### ❌ ABSOLUTELY FORBIDDEN:

1. **❌ DO NOT modify schema files**
   - `src/types/fields-schema.ts`
   - `src/lib/field-normalizer.ts`
   - `api/property/search.ts`
   - `api/property/parse-mls-pdf.ts`

2. **❌ DO NOT create your own charts**
   - Only use charts provided by AI generators
   - Do not substitute different chart types
   - Do not add extra charts

3. **❌ DO NOT skip verification steps**
   - Always verify schema unchanged
   - Always test with sample data
   - Always check console logs
   - Always create verification document

4. **❌ DO NOT forget to commit**
   - Commit after each chart
   - Commit after full section
   - Use proper commit messages

5. **❌ DO NOT use wrong colors**
   - Property colors = Green/Lavender/Pink (chart elements)
   - Score colors = 5-tier system (badges only)

6. **❌ DO NOT use dark text**
   - All tooltips must have white text
   - All text must be readable

---

## 10. YOUR INTEGRATION WORKFLOW SUMMARY

```
1. RECEIVE charts from AI generator
   ↓
2. CREATE Section[N]Charts.tsx file
   ↓
3. CREATE Category[N]_Visuals.tsx with mapper
   ↓
4. VERIFY schema unchanged (git diff)
   ↓
5. MAP fields from 168-field schema
   ↓
6. ADD to toolbar navigation
   ↓
7. TEST with sample data
   ↓
8. FIX any issues (tooltips, colors, labels)
   ↓
9. TEST with real properties (if available)
   ↓
10. VERIFY all elements present (brain, winner, scale)
   ↓
11. COMMIT each chart
   ↓
12. COMMIT full section
   ↓
13. CREATE verification document
   ↓
14. REPORT completion
```

---

# SCHEMA SECTIONS REFERENCE

## All 22 Sections of 168-Field Schema:

| Section | Group Name | Fields | Chart Numbers |
|---------|------------|--------|---------------|
| 1 | Address & Identity | 1-9 | 1-1 to 1-X |
| 2 | Pricing & Value | 10-16 | 2-1 to 2-X |
| 3 | Property Basics | 17-29 | 3-1 to 3-10 ✅ |
| 4 | HOA & Taxes | 30-38 | 4-1 to 4-X |
| 5 | Structure & Systems | 39-48 | 5-1 to 5-X |
| 6 | Interior Features | 49-53 | 6-1 to 6-X |
| 7 | Exterior Features | 54-58 | 7-1 to 7-X |
| 8 | Permits & Renovations | 59-62 | 8-1 to 8-X |
| 9 | Assigned Schools | 63-73 | 9-1 to 9-X |
| 10 | Location Scores | 74-82 | 10-1 to 10-X |
| 11 | Distances & Amenities | 83-87 | 11-1 to 11-X |
| 12 | Safety & Crime | 88-90 | 12-1 to 12-X |
| 13 | Market & Investment Data | 91-103 | 13-1 to 13-X |
| 14 | Utilities & Connectivity | 104-116 | 14-1 to 14-X |
| 15 | Environment & Risk | 117-130 | 15-1 to 15-X |
| 16 | Additional Features | 131-138 | 16-1 to 16-X |
| 17 | Stellar MLS - Parking & Garage | 139-143 | 17-1 to 17-X |
| 18 | Stellar MLS - Building Info | 144-148 | 18-1 to 18-X |
| 19 | Stellar MLS - Legal & Tax | 149-154 | 19-1 to 19-X |
| 20 | Stellar MLS - Waterfront | 155-159 | 20-1 to 20-X |
| 21 | Stellar MLS - Leasing & Pets | 160-165 | 21-1 to 21-X |
| 22 | Stellar MLS - Features & Flood | 166-168 | 22-1 to 22-X |

---

# CRITICAL RULES SUMMARY

## For AI Chart Generators:
1. ✅ Create diverse, visually interesting charts
2. ✅ Use placeholder data structured for real data
3. ✅ Include ALL required elements (brain, winner, legend)
4. ✅ Use correct colors (property vs score)
5. ✅ Use correct score thresholds (81/61/41/21)
6. ✅ Number charts correctly ([Section]-[Number])
7. ✅ Use white tooltip text
8. ✅ No dark text on dark backgrounds
9. ✅ Horizontal X-axis labels
10. ✅ Include console logging

## For Claude Code:
1. ✅ NEVER modify schema files
2. ✅ ONLY use provided charts (no substitutions)
3. ✅ Map fields from 168-field schema (READ-ONLY)
4. ✅ Wire to propertyStore correctly
5. ✅ Fix tooltip colors to white
6. ✅ Fix any label overlaps
7. ✅ Verify all required elements present
8. ✅ Test with sample and real data
9. ✅ Commit after each chart and full section
10. ✅ Create verification document

## For Everyone:
- **Property Colors (chart elements):** Green #22c55e, Lavender #8b5cf6, Pink #ec4899
- **Score Colors (badges only):** 81-100 #4CAF50, 61-80 #2196F3, 41-60 #FFEB3B, 21-40 #FF9800, 0-20 #FF4444
- **Score Thresholds:** 81, 61, 41, 21 (NOT 100, 75, 50, 25)
- **Tooltip Text:** ALWAYS #ffffff (bright white)
- **Chart Numbering:** [Section]-[Number] (e.g., 4-1, 4-2, etc.)
- **Required Elements:** Brain widget, winner badge, Smart Scale legend, console logging

---

# COMPLETION METRICS

## Progress Tracking:

**Completed:** 1 section (Section 3: Property Basics - 10 charts)
**Remaining:** 21 sections
**Total Estimated Charts:** ~150-200 charts across all sections

## Section Status Board:

- [x] Section 3: Property Basics ✅
- [ ] Section 4: HOA & Taxes (NEXT)
- [ ] Section 5: Structure & Systems
- [ ] Section 6: Interior Features
- [ ] Section 7: Exterior Features
- [ ] Section 8: Permits & Renovations
- [ ] Section 9: Assigned Schools
- [ ] Section 10: Location Scores
- [ ] Section 11: Distances & Amenities
- [ ] Section 12: Safety & Crime
- [ ] Section 13: Market & Investment Data
- [ ] Section 14: Utilities & Connectivity
- [ ] Section 15: Environment & Risk
- [ ] Section 16: Additional Features
- [ ] Section 17: Stellar MLS - Parking & Garage
- [ ] Section 18: Stellar MLS - Building Info
- [ ] Section 19: Stellar MLS - Legal & Tax
- [ ] Section 20: Stellar MLS - Waterfront
- [ ] Section 21: Stellar MLS - Leasing & Pets
- [ ] Section 22: Stellar MLS - Features & Flood

---

**END OF GRAND MASTER INSTRUCTIONS**

**Version:** 1.0
**Last Updated:** 2025-12-09
**Maintained By:** Claude Sonnet 4.5
