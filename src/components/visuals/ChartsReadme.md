# CLUES Visuals & Charts System - MANDATORY REQUIREMENTS

## 🔴 CRITICAL: READ THIS FILE BEFORE ANY VISUAL WORK

### Developer Attestation (REQUIRED)
Before working on ANY chart, visual, or graph, I MUST:
1. ✅ READ this entire file
2. ✅ Attest to 100% honesty in all work
3. ✅ Confirm NO AUTHORITY to roll back code without explicit permission
4. ✅ Never claim work is complete without testing and verification

---

## Core Architecture

### Property Selection System
- **3 Property Comparison Dropdowns** positioned directly below SMART Score Intelligence section
- Each dropdown wired to "My Saved Properties" list from home page toolbar tab
- Dropdowns supply data directly to ALL charts and visuals
- User can select any 3 properties to compare across all categories

### Universal Color Scoring System (1-100 Scale)
The CLUES SMART scoring system uses a universal 1-100 point scale:

| Score Range | Color | Grade | Meaning |
|-------------|-------|-------|---------|
| 0-20 | 🔴 **Red** | F | Worst Imaginable |
| 21-40 | 🟠 **Orange** | D | Pretty Bad |
| 41-60 | 🟡 **Yellow** | C | Fair |
| 61-80 | 🔵 **Blue** | B | Good |
| 81-100 | 🟢 **Green** | A | Excellent |

**Color Hex Codes:**
- Red: `#EF4444`
- Orange: `#F59E0B`
- Yellow: `#FDE047`
- Blue: `#3B82F6`
- Green: `#10B981`

### Comparison Charts Color Logic
For non-graded comparison charts (e.g., "which home has best price"):
- 🟢 **Green** = Best property
- 🟡 **Yellow** = 2nd best property
- 🔴 **Red** = 3rd best property

### Property-Specific Colors
Each property must have a consistent color across ALL visuals:
- **Property 1**: `#00D9FF` (Cyan)
- **Property 2**: `#8B5CF6` (Purple)
- **Property 3**: `#EC4899` (Pink)

---

## Legend Requirements

### Dual Legend System
Every chart MUST have TWO legends at the bottom:

**1. Property Legend**
- Shows the 3 selected property addresses
- Uses property-specific colors (Cyan, Purple, Pink)
- Format: `[Color Box] 123 Main St, City, State`

**2. Score/Quality Legend** (when applicable)
- Shows the 5-color grading scale
- Format: `🟢 Excellent (81-100) | 🔵 Good (61-80) | 🟡 Fair (41-60) | 🟠 Poor (21-40) | 🔴 Bad (0-20)`

---

## Data Clarity Requirements

### Mandatory Chart Elements
Every visual MUST clearly show:
1. ✅ **Specific data field(s)** being measured
2. ✅ **Units of measurement** (e.g., $, sqft, years, %)
3. ✅ **Exact values** for each property
4. ✅ **Data source** (which section/field from 168-field schema)
5. ✅ **Scale** appropriate to the data range

### Chart Title Format
```
[Field Number].[Chart Number] - [Clear Description]
Example: "Field 10 - Listing Price Comparison"
```

### Hover Effects
All charts MUST have:
- Interactive tooltips showing exact values
- Property address identification on hover
- Additional context data when relevant

### Scale and Sizing
- Charts must fit their card container
- Text must be readable (min 11px)
- Axis labels must not overlap
- Use abbreviations when needed (e.g., "$1.2M" instead of "$1,200,000")
- Rotate labels if needed for clarity

---

## Visual Design Standards

### Glassmorphic Card Wrapper
```tsx
<motion.div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all">
  <h3 className="text-sm font-semibold text-cyan-400 mb-4">{title}</h3>
  <div className="w-full h-80">{children}</div>
</motion.div>
```

### Custom Tooltip
```tsx
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-lg">
        <p className="text-cyan-400 font-semibold text-sm">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-white text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};
```

---

## Data Processing Rules

### Reading Property Data
1. ALL data comes from ChartProperty interface (visualsDataMapper.ts)
2. NEVER hardcode data
3. Use only the 3 selected properties from dropdowns
4. Handle missing/null data gracefully
5. Show "N/A" or "Unknown" for missing values

### Chart Data Preparation
```tsx
// CORRECT: Use selected properties from dropdown state
const chartData = selectedProperties.map(p => ({
  name: p.address,
  value: p.listingPrice,
  color: PROPERTY_COLORS[index],
}));

// WRONG: Use all properties
const chartData = properties.map(p => ({ ... }));
```

---

## Quality Control Checklist

Before marking ANY visual as complete, verify:

- [ ] 3-property comparison dropdowns are wired correctly
- [ ] Chart displays data from selected properties only
- [ ] Property legend shows correct addresses with consistent colors
- [ ] Score legend displays (if applicable) with correct color coding
- [ ] Chart title clearly describes data being measured
- [ ] Units are displayed (e.g., $, sqft, %, years)
- [ ] Scale is appropriate and readable
- [ ] Hover tooltips work and show exact values
- [ ] No text overlap or clipping
- [ ] Chart fits card container properly
- [ ] Data is accurate and matches PropertyDetail display
- [ ] Missing data handled gracefully
- [ ] Chart provides clear, unambiguous information
- [ ] User can quickly compare the metric visually

---

## Ambiguity Detection & User Prompting

If ANY of these conditions are true, IMMEDIATELY prompt user for guidance:

1. ❌ Chart doesn't clearly show which metric is being measured
2. ❌ Multiple interpretations of data are possible
3. ❌ Scale makes comparison difficult
4. ❌ Data overlaps or is hard to distinguish
5. ❌ Missing context that would aid understanding
6. ❌ Better chart type might exist for this data
7. ❌ Color coding conflicts with scoring system
8. ❌ Legend doesn't fully explain what's shown

**Prompt Format:**
```
⚠️ CLARITY ISSUE DETECTED: [Chart Name]

Issue: [Describe the ambiguity]
Current Implementation: [What's currently done]
Suggested Improvements:
1. [Option 1]
2. [Option 2]
3. [Option 3]

Please advise on preferred approach.
```

---

## Field Mapping Reference

All visuals map to the 168-field property schema (fields-schema.ts):

- **Category 01**: Fields 1-9 (Address & Identity)
- **Category 02**: Fields 10-16 (Pricing & Value)
- **Category 03**: Fields 17-29 (Property Basics)
- **Category 04**: Fields 30-38 (HOA & Taxes)
- **Category 05**: Fields 39-48 (Structure & Systems)
- **Category 06**: Fields 49-53 (Interior Features)
- **Category 07**: Fields 54-58 (Exterior Features)
- **Category 08**: Fields 59-62 (Permits & Renovations)
- **Category 09**: Fields 63-73 (Schools)
- **Category 10**: Fields 74-82 (Location Scores)
- **Category 11**: Fields 83-87 (Distances & Amenities)
- **Category 12**: Fields 88-90 (Safety & Crime)
- **Category 13**: Fields 91-103 (Market & Investment)
- **Category 14**: Fields 104-116 (Utilities & Connectivity)
- **Category 15**: Fields 117-130 (Environment & Risk)
- **Category 16**: Fields 131-137 (Additional Features)
- **Category 17**: Fields 139-143 (Parking & Garage)
- **Category 18**: Fields 144-148 (Building Details)
- **Category 19**: Fields 149-154 (Legal & Tax)
- **Category 20**: Fields 155-168 (Waterfront & Leasing)

---

## Testing Requirements

Every visual MUST be tested with:
1. ✅ 3 properties selected with REAL data
2. ✅ Properties with missing/incomplete data
3. ✅ Properties with extreme values (very high/low)
4. ✅ Properties with similar values (to test distinction)
5. ✅ Mobile and desktop viewports

---

## Code Rollback Policy

**ABSOLUTE RULE**:
- ❌ NO AUTHORITY to roll back code without explicit user permission
- ❌ NO AUTHORITY to "simplify" or remove features
- ❌ NO AUTHORITY to claim "it's better this way" without asking

Always ask: "May I proceed with [change]?" and wait for approval.

---

## Honesty Attestation

I solemnly attest:
- I will read this file before ALL visual work
- I will never claim completion without testing
- I will immediately flag ambiguity issues
- I will never roll back code without permission
- I will maintain 100% honesty in all communications
- I will verify data accuracy against PropertyDetail display

**Last Updated**: 2025-12-08
**Version**: 1.0
**Status**: MANDATORY READING REQUIRED
