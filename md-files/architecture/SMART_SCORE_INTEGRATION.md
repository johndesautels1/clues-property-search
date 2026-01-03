# SMART Score Display - Quick Integration Guide

## Component Location
```
src/components/SMARTScoreDisplay.tsx (739 lines)
```

## Quick Start (30 seconds)

```tsx
import { SMARTScoreDisplay } from '@/components/SMARTScoreDisplay';
import { calculateSmartScore } from '@/lib/smart-score-calculator';

// In your component
const result = calculateSmartScore(property, sectionWeights, 'industry-standard');

<SMARTScoreDisplay
  smartScore={result.finalScore}
  sectionBreakdown={result.sectionBreakdown}
  dataCompleteness={result.dataCompleteness}
  confidenceLevel={result.confidenceLevel}
/>
```

## Industry-Standard Section Weights

Use these weights for FL coastal properties (validated by 2-LLM consensus):

```typescript
const INDUSTRY_WEIGHTS = {
  A: 3,   // Address & Identity
  B: 20,  // Pricing & Value ⭐ HIGHEST
  C: 18,  // Property Basics ⭐ SECOND
  D: 8,   // HOA & Taxes
  E: 7,   // Structure & Systems
  F: 4,   // Interior Features
  G: 5,   // Exterior Features
  H: 3,   // Permits & Renovations
  I: 15,  // Assigned Schools ⭐ THIRD
  J: 6,   // Location Scores
  K: 3,   // Distances & Amenities
  L: 5,   // Safety & Crime
  M: 8,   // Market & Investment
  N: 2,   // Utilities & Connectivity
  O: 12,  // Environment & Risk (FL specific) ⭐
  P: 2,   // Additional Features
  Q: 2,   // Parking
  R: 1,   // Building Details
  S: 2,   // Legal & Compliance
  T: 4,   // Waterfront (FL coastal)
  U: 1,   // Leasing & Rentals
  V: 1    // Community Features
};
// Total: 100%
```

## Integration Points

### 1. Property Detail Page
```tsx
// src/pages/PropertyDetail.tsx
import { SMARTScoreDisplay } from '@/components/SMARTScoreDisplay';

function PropertyDetail({ propertyId }) {
  const property = usePropertyStore(state =>
    state.properties.find(p => p.id === propertyId)
  );

  const scoreResult = calculateSmartScore(
    property,
    INDUSTRY_WEIGHTS,
    'industry-standard'
  );

  return (
    <div>
      <PropertyHeader property={property} />
      <SMARTScoreDisplay {...scoreResult} />
    </div>
  );
}
```

### 2. Compare Page (3 Properties)
```tsx
// src/pages/Compare.tsx
function ComparePage() {
  const [property1, property2, property3] = useSelectedProperties();

  const scores = [property1, property2, property3].map(p =>
    calculateSmartScore(p, INDUSTRY_WEIGHTS, 'industry-standard')
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {scores.map((result, idx) => (
        <SMARTScoreDisplay key={idx} {...result} />
      ))}
    </div>
  );
}
```

### 3. Olivia Executive Report
```tsx
// Already integrated in OliviaExecutiveReport.tsx
// Add SMART Score section after Investment Grade:

<SMARTScoreDisplay
  smartScore={result.smartScore}
  sectionBreakdown={result.sectionBreakdown}
  dataCompleteness={result.dataCompleteness}
  confidenceLevel={result.confidenceLevel}
/>
```

## Component Features

✅ **Final Score Display** - Large 0-100 score with letter grade
✅ **22 Section Breakdown** - All categories with expandable details
✅ **3 Visualization Modes** - Radar, Bar, List views
✅ **Field-Level Details** - Click sections to see individual field scores
✅ **Data Quality Metrics** - Completeness percentage & confidence levels
✅ **Responsive Design** - Works on all screen sizes
✅ **Quantum UI Styling** - Matches existing CLUES aesthetic

## Visual Hierarchy

```
┌─────────────────────────────────────────────────────┐
│ SMART Score: 82.5/100          Grade: B             │  ← Main Score
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░                                 │
├─────────────────────────────────────────────────────┤
│ Data Completeness: 78%    Confidence: High          │  ← Quality Metrics
├─────────────────────────────────────────────────────┤
│ [Radar View] [Bar Chart] [List View]                │  ← Visualization Toggle
│                                                       │
│  ┌─────────────────────┐  ┌───────────────────┐    │
│  │   Radar Chart       │  │   Pie Chart       │    │  ← Charts
│  │   (Top 6 sections)  │  │   (Weights)       │    │
│  └─────────────────────┘  └───────────────────┘    │
├─────────────────────────────────────────────────────┤
│ Section-by-Section Breakdown (22 sections)          │
│                                                       │
│ ▼ B. Pricing & Value (20% weight)    Score: 85.3   │  ← Expandable
│   ├─ Field #11: Price per Sqft: 75                 │     Sections
│   ├─ Field #12: Market Value: 90                   │
│   └─ Field #14: Last Sale Price: 80                │
│                                                       │
│ ▼ I. Assigned Schools (15% weight)   Score: 88.0   │
│   ├─ Field #66: Elementary Rating: 90              │
│   └─ ...                                            │
└─────────────────────────────────────────────────────┘
```

## Color Coding

| Score | Color | CSS Class | Grade |
|-------|-------|-----------|-------|
| 90-100 | Green | `text-quantum-green` | A/A- |
| 80-89 | Cyan | `text-quantum-cyan` | B+/B/B- |
| 70-79 | Blue | `text-quantum-blue` | C+/C/C- |
| 60-69 | Purple | `text-quantum-purple` | D+/D/D- |
| 50-59 | Orange | `text-quantum-orange` | F |
| 0-49 | Red | `text-quantum-red` | F |

## Data Flow

```
Property (168 fields)
    ↓
calculateSmartScore(property, weights, source)
    ↓
SmartScoreResult {
  finalScore: 82.5
  sectionBreakdown: [22 sections]
  dataCompleteness: 78
  confidenceLevel: 'High'
}
    ↓
SMARTScoreDisplay component
    ↓
Rendered UI with charts & expandable sections
```

## Performance Tips

1. **Memoize calculation results** if property doesn't change often:
   ```tsx
   const scoreResult = useMemo(
     () => calculateSmartScore(property, INDUSTRY_WEIGHTS, 'industry-standard'),
     [property.id, property.updatedAt]
   );
   ```

2. **Lazy load the component** for faster initial page load:
   ```tsx
   const SMARTScoreDisplay = lazy(() => import('@/components/SMARTScoreDisplay'));
   ```

3. **Render above the fold** - Put main score display at top, detailed breakdown below

## Testing

```tsx
// Mock data for testing
const mockResult = {
  finalScore: 82.5,
  sectionBreakdown: [
    {
      sectionId: 'B',
      sectionName: 'Pricing & Value',
      sectionWeight: 20,
      sectionAverage: 85.3,
      weightedContribution: 17.06,
      fieldsPopulated: 4,
      fieldsTotal: 5,
      fieldScores: [/* ... */]
    }
    // ... 21 more sections
  ],
  dataCompleteness: 78,
  confidenceLevel: 'High' as const,
  scoreableFieldsPopulated: 109,
  scoreableFieldsTotal: 140,
  calculationTimestamp: new Date().toISOString(),
  weightsUsed: INDUSTRY_WEIGHTS,
  weightsSource: 'industry-standard',
  version: 'v2' as const
};

<SMARTScoreDisplay {...mockResult} />
```

## Common Issues

### Issue: "Cannot find module '@/lib/smart-score-calculator'"
**Solution**: Make sure the calculator is implemented at that path, or update import

### Issue: Charts not rendering
**Solution**: Ensure `recharts` is installed: `npm install recharts`

### Issue: Colors not showing
**Solution**: Verify Tailwind config includes quantum color palette

### Issue: Sections not expanding
**Solution**: Check `framer-motion` is installed: `npm install framer-motion`

## Next Steps

1. ✅ Component created at `src/components/SMARTScoreDisplay.tsx`
2. ✅ Examples created at `src/components/SMARTScoreDisplay.example.tsx`
3. ✅ Documentation at `src/components/SMARTScoreDisplay.README.md`
4. 🔲 Integrate into PropertyDetail page
5. 🔲 Integrate into Compare page
6. 🔲 Add to OliviaExecutiveReport
7. 🔲 Test with real property data
8. 🔲 Optimize field normalization logic in calculator

## Related Files

- `src/lib/smart-score-calculator.ts` - Score calculation engine
- `src/lib/smart-score-weight-research.ts` - Weight validation system
- `src/types/fields-schema.ts` - 168-field schema (SOURCE OF TRUTH)
- `src/components/OliviaExecutiveReport.tsx` - Similar UI patterns

## Support

Questions? Check:
1. `SMARTScoreDisplay.README.md` - Full documentation
2. `SMARTScoreDisplay.example.tsx` - Usage examples
3. `smart-score-calculator.ts` - Score calculation logic

---

**Created**: 2025-12-26
**Component Version**: v1.0
**Lines of Code**: 739
**Dependencies**: framer-motion, recharts, lucide-react
