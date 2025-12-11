# 🚀 NEW CONVERSATION STARTER
**CLUES Property Dashboard - Quick Context File**
**Conversation ID:** [Generate new ID each conversation]
**Last Updated:** 2025-12-10

---

## 📋 COPY-PASTE THIS TO START NEW CONVERSATION

```
CLUES Property Dashboard - Section 6: Interior Features Integration

PROJECT PATH: /d/Clues_Quantum_Property_Dashboard

CRITICAL FILES:
✅ Read first: SECTION6_INTEGRATION_MASTER_PLAN.md (complete project context)
⚠️ Source of truth: src/types/fields-schema.ts (Fields 49-53)
📖 References:
  - src/components/visuals/Category05_StructureSystems.tsx (Section 5 example)
  - src/components/visuals/recharts/Section5StructureSystemsCharts.tsx

TARGET FILES TO MODIFY:
1. src/components/visuals/Category06_Placeholder.tsx (update with real component)
2. src/components/visuals/recharts/Section6InteriorChart.tsx (create new file)

FIELD MAPPING (Fields 49-53):
- Field 49: flooring_type → flooringType (text)
- Field 50: kitchen_features → kitchenFeatures (text)
- Field 51: appliances_included → appliancesIncluded (multiselect array)
- Field 52: fireplace_yn → fireplaceYn (boolean)
- Field 53: fireplace_count → fireplaceCount (number)

DESIGN REQUIREMENTS:
- Property colors: Green #22c55e, Lavender #8b5cf6, Pink #ec4899
- CLUES-Smart scoring: 5-tier system (≥90 Exceptional, 75-89 Above Avg, etc.)
- Chart titles: Include field numbers (e.g., "Chart 6-1: Appliances (Field 51)")
- Tooltips: Show full property addresses
- Layout: Card-based with glass-card styling

WORKFLOW:
1. Read SECTION6_INTEGRATION_MASTER_PLAN.md for full context
2. User will upload HTML chart files from Claude/Perplexity
3. Convert HTML charts to React/Recharts components
4. Follow Section 5 patterns exactly
5. Verify field numbers 49-53 in all comments
6. Test on PropertyDetail page with 3 properties selected

Ready to receive HTML chart files?
```

---

## 🎯 CURRENT STATUS

### ✅ Completed Sections
- **Section 3:** Property Basics (Fields 17-29) - 10 charts
- **Section 4:** HOA & Taxes (Fields 30-38) - 5 charts
- **Section 5:** Structure & Systems (Fields 39-48) - 6 charts

### ⏳ Current Work
- **Section 6:** Interior Features (Fields 49-53) - Charts TBD

### 🔜 Next Sections
- **Section 7:** Exterior Features (Fields 54-58)
- **Section 8:** Permits & Renovations (Fields 59-62)
- **Sections 1-2, 9-22:** Remaining

---

## 📁 ESSENTIAL FILE PATHS

### Source of Truth
```
src/types/fields-schema.ts              # 168 fields, 22 sections - NEVER MODIFY
```

### Data Mapping
```
src/lib/visualsDataMapper.ts            # ChartProperty interface & mapPropertyToChartData
src/lib/cluesSmartScoring.ts            # CLUES-Smart 5-tier scoring algorithm
src/lib/visualConstants.ts              # Property colors & design constants
```

### Visual Components (Section 6 targets)
```
src/components/visuals/Category06_Placeholder.tsx          # ⚠️ UPDATE THIS
src/components/visuals/recharts/Section6InteriorChart.tsx  # ⚠️ CREATE THIS
```

### Reference Components
```
src/components/visuals/Category05_StructureSystems.tsx     # Best reference
src/components/visuals/recharts/Section5StructureSystemsCharts.tsx
src/components/visuals/recharts/HOATaxesCharts.tsx         # Section 4 example
```

### Documentation
```
SECTION6_INTEGRATION_MASTER_PLAN.md     # Complete Section 6 guide
GRAND_MASTER_CHART_INSTRUCTIONS.md      # Full chart generation rules
SCHEMA_FIELDS_BY_SECTION.md             # All 168 fields organized
Section5_Charts.md                      # Section 5 detailed docs
```

---

## 🔑 KEY RULES (ALWAYS REMEMBER)

### Field Mapping
1. ⚠️ **NEVER modify** `src/types/fields-schema.ts`
2. ✅ Field numbers in comments MUST match schema exactly
3. ✅ Section 6 = Fields 49-53 ONLY
4. ✅ Use exact field keys from ChartProperty interface

### Chart Standards
1. ✅ Property colors: Green, Lavender, Pink (see visualConstants.ts)
2. ✅ CLUES-Smart badges on all composite score charts
3. ✅ Field numbers in chart titles: "Chart 6-X: Title (Field ##)"
4. ✅ Tooltips show full addresses, not truncated names
5. ✅ Always include units (%, $, count, etc.)

### Florida Context
1. ✅ Appliances: AC highly valued (hurricane climate)
2. ✅ Kitchen features: Hurricane-proof considerations
3. ✅ Fireplace: Less common in FL (warm climate)
4. ✅ Flooring: Tile/waterproof flooring preferred (humidity)

### Code Style
1. ✅ TypeScript strict mode
2. ✅ Functional components only
3. ✅ Interface > Type for props
4. ✅ Comments reference field numbers
5. ✅ Glass-card styling (glassmorphic UI)

---

## 🎨 PROPERTY COLORS (EXACT VALUES)

```typescript
// From src/lib/visualConstants.ts
Property 1 (Green):    #22c55e  rgb(34, 197, 94)
Property 2 (Lavender): #8b5cf6  rgb(139, 92, 246)
Property 3 (Pink):     #ec4899  rgb(236, 72, 153)

// Array format for mapping:
const colors = ['#22c55e', '#8b5cf6', '#ec4899'];
```

---

## 📊 CLUES-SMART SCORING TIERS

```typescript
// From src/lib/cluesSmartScoring.ts
Score ≥ 90:  "Exceptional"      (Green)
Score 75-89: "Above Average"    (Blue)
Score 60-74: "Average"          (Yellow)
Score 45-59: "Below Average"    (Orange)
Score < 45:  "Needs Improvement" (Red)
```

---

## 🧪 TESTING COMMANDS

```bash
# Navigate to project
cd /d/Clues_Quantum_Property_Dashboard

# Install dependencies (if needed)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run verification scripts (if exists)
npx ts-node scripts/verify-field-mapping.ts
npx ts-node test-section6-datachain.ts
```

---

## 📝 SECTION 6 CHART IDEAS (5 fields)

Based on Fields 49-53, suggested charts:

1. **Chart 6-1: Appliances Included Count**
   - Bar chart showing number of appliances per property
   - Field 51 (multiselect array length)

2. **Chart 6-2: Kitchen Quality Score**
   - Composite score based on kitchen_features
   - Field 50 + Field 51 (appliances)

3. **Chart 6-3: Flooring Type Distribution**
   - Categorical comparison of flooring types
   - Field 49

4. **Chart 6-4: Fireplace Analysis**
   - Combined boolean presence + count
   - Fields 52 & 53

5. **Chart 6-5: Interior Amenities Radar**
   - Multi-dimensional: appliances, kitchen, fireplace, flooring quality
   - Composite of Fields 49-53

6. **Chart 6-6: Interior Feature Score**
   - Final CLUES-Smart composite score
   - All fields 49-53 weighted

---

## 🚨 COMMON MISTAKES TO AVOID

### ❌ Wrong Field Numbers
```typescript
// WRONG
kitchenFeatures: p.kitchenFeatures || '',  // Field 45 ❌

// CORRECT
kitchenFeatures: p.kitchenFeatures || '',  // Field 50 ✅
```

### ❌ Wrong Property Colors
```typescript
// WRONG
color: ['#ff0000', '#00ff00', '#0000ff'][idx]  ❌

// CORRECT
color: ['#22c55e', '#8b5cf6', '#ec4899'][idx]  ✅
```

### ❌ Missing Field Numbers in Titles
```typescript
// WRONG
<h3>Chart 6-1: Appliances</h3>  ❌

// CORRECT
<h3>Chart 6-1: Appliances (Field 51)</h3>  ✅
```

### ❌ Portfolio Aggregate Charts
```typescript
// WRONG: Single donut with all 3 properties combined ❌

// CORRECT: 3 separate donuts, one per property ✅
```

---

## 📞 USER INSTRUCTIONS REFERENCE

From CLAUDE.md:
1. ✅ Always create conversation ID
2. ✅ Always perform specific code number requests without prompting
3. ✅ Read FIELD_MAPPING_TRUTH.md before field work
4. ✅ Source of truth: src/types/fields-schema.ts
5. ✅ Never claim field mapping done without verification script

---

## ✅ VERIFICATION CHECKLIST

Before marking Section 6 complete:
- [ ] All HTML charts converted to React/Recharts
- [ ] Field numbers 49-53 verified in ALL comments
- [ ] Property colors correct (Green/Lavender/Pink)
- [ ] CLUES-Smart badges render on composite charts
- [ ] Charts display on PropertyDetail page
- [ ] Console has zero errors
- [ ] Tooltips show full addresses
- [ ] Responsive design tested on mobile view
- [ ] Florida-specific context in descriptions
- [ ] Documentation created (Section6_Charts.md)
- [ ] Git commit created with proper message format

---

## 🔄 GIT COMMIT FORMAT

After Section 6 complete:
```bash
git add .
git commit -m "$(cat <<'EOF'
Section 6 Interior Features integration complete

- Integrated all charts from Section6.html into React/Recharts
- Created Section6InteriorChart component with X charts
- Updated Category06_Placeholder with proper field mapping
- Added CLUES-Smart scoring with 5-tier thresholds
- Fixed property colors (Green/Lavender/Pink)
- Verified field numbers 49-53 in all comments
- Added Florida-specific context for appliances/kitchen
- Charts numbered 6-1 through 6-X
- WinnerBadge styling matches Sections 3-5
- Responsive design with glass-card layout

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## 📚 QUICK LINKS TO DOCUMENTATION

### Primary Documentation
- [SECTION6_INTEGRATION_MASTER_PLAN.md](SECTION6_INTEGRATION_MASTER_PLAN.md) - Complete Section 6 guide
- [GRAND_MASTER_CHART_INSTRUCTIONS.md](GRAND_MASTER_CHART_INSTRUCTIONS.md) - All chart rules
- [SCHEMA_FIELDS_BY_SECTION.md](SCHEMA_FIELDS_BY_SECTION.md) - 168 fields organized

### Example Sections
- [Section5_Charts.md](Section5_Charts.md) - Section 5 detailed example
- [SECTION5_DUAL_CHARTS_SUMMARY.md](SECTION5_DUAL_CHARTS_SUMMARY.md) - Section 5 summary

### Field Mapping
- [src/types/fields-schema.ts](src/types/fields-schema.ts) - Source of truth
- [src/lib/visualsDataMapper.ts](src/lib/visualsDataMapper.ts) - ChartProperty interface

---

**END OF QUICK START GUIDE**
**Save this file for every new conversation!**
**Conversation ID:** [Generate unique ID per session]
