# SMART Score Display Component

A comprehensive React component for visualizing SMART Score data with interactive 22-section breakdowns, charts, and field-level details.

## Features

- **Final Score Display**: Large, prominent score with color-coded gradients (0-100 scale)
- **Letter Grade**: Automatic letter grade calculation (A to F)
- **22 Section Breakdown**: Complete analysis across all property evaluation categories
- **Interactive Expansion**: Click any section to view individual field contributions
- **Multiple Visualizations**:
  - Radar chart (top 6 weighted sections)
  - Bar chart (all sections with weighted contributions)
  - Pie chart (section weight distribution)
  - List view (sortable by contribution)
- **Data Quality Metrics**:
  - Data completeness percentage
  - Confidence level indicators
  - Field population statistics
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Quantum UI Styling**: Matches existing CLUES dashboard aesthetics

## Installation

The component is already included in your project at:
```
src/components/SMARTScoreDisplay.tsx
```

Required dependencies (already installed):
- `framer-motion` - for animations
- `recharts` - for chart visualizations
- `lucide-react` - for icons

## Basic Usage

```tsx
import { SMARTScoreDisplay } from '@/components/SMARTScoreDisplay';
import { calculateSmartScore } from '@/lib/smart-score-calculator';

function PropertyDetail({ property }) {
  // Define section weights
  const weights = {
    A: 3, B: 20, C: 18, D: 8, E: 7, F: 4,
    G: 5, H: 3, I: 15, J: 6, K: 3, L: 5,
    M: 8, N: 2, O: 12, P: 2, Q: 2, R: 1,
    S: 2, T: 4, U: 1, V: 1
  };

  // Calculate SMART Score
  const result = calculateSmartScore(property, weights, 'industry-standard');

  return (
    <SMARTScoreDisplay
      smartScore={result.finalScore}
      sectionBreakdown={result.sectionBreakdown}
      dataCompleteness={result.dataCompleteness}
      confidenceLevel={result.confidenceLevel}
    />
  );
}
```

## Props

### `SMARTScoreDisplayProps`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `smartScore` | `number` | Yes | Final SMART Score (0-100) |
| `sectionBreakdown` | `SectionScore[]` | Yes | Array of all 22 section scores |
| `dataCompleteness` | `number` | Yes | Percentage of fields populated (0-100) |
| `confidenceLevel` | `ConfidenceLevel` | Yes | Overall confidence: 'High', 'Medium-High', 'Medium', or 'Low' |

### `SectionScore` Type

```typescript
interface SectionScore {
  sectionId: string;              // 'A', 'B', 'C', etc.
  sectionName: string;            // 'Pricing & Value', etc.
  sectionWeight: number;          // Percentage (0-100)
  fieldScores: FieldScore[];      // Individual field scores
  sectionAverage: number;         // Average of populated fields (0-100)
  weightedContribution: number;   // Contribution to final score
  fieldsPopulated: number;        // How many fields have data
  fieldsTotal: number;            // Total scoreable fields in section
}
```

### `FieldScore` Type

```typescript
interface FieldScore {
  fieldId: number;                // Field number (1-168)
  fieldName: string;              // Human-readable name
  rawValue: any;                  // Actual field value
  normalizedScore: number;        // Normalized 0-100 score
  confidence: ConfidenceLevel;    // Data confidence
  notes?: string;                 // Optional notes
}
```

## Advanced Usage

### 1. Property Detail Page Integration

```tsx
import { SMARTScoreDisplay } from '@/components/SMARTScoreDisplay';

export function PropertyDetailPage({ propertyId }) {
  const property = useProperty(propertyId);
  const scoreResult = calculateSmartScore(property, INDUSTRY_WEIGHTS);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Property Info */}
      <div className="lg:col-span-1">
        <PropertyInfo property={property} />
      </div>

      {/* Right: SMART Score */}
      <div className="lg:col-span-2">
        <SMARTScoreDisplay {...scoreResult} />
      </div>
    </div>
  );
}
```

### 2. Comparison View (3 Properties)

```tsx
export function ComparisonView({ properties }) {
  return (
    <div className="space-y-8">
      {properties.map(property => {
        const result = calculateSmartScore(property, WEIGHTS);
        return (
          <div key={property.id}>
            <h3>{property.address.streetAddress.value}</h3>
            <SMARTScoreDisplay {...result} />
          </div>
        );
      })}
    </div>
  );
}
```

### 3. Executive Report Integration

```tsx
export function ExecutiveReport({ property }) {
  const result = calculateSmartScore(property, WEIGHTS);

  return (
    <>
      {/* Header with overall grade */}
      <ReportHeader score={result.finalScore} />

      {/* Detailed breakdown */}
      <SMARTScoreDisplay {...result} />

      {/* Olivia's recommendations */}
      <OliviaRecommendations score={result.finalScore} />
    </>
  );
}
```

## Styling

The component uses the CLUES Quantum design system with these key classes:

- `glass-card` - Glassmorphic card backgrounds
- `text-quantum-*` - Color utilities (cyan, purple, green, etc.)
- `bg-gradient-to-*` - Gradient backgrounds
- `font-orbitron` - Futuristic heading font

### Color Coding by Score

| Score Range | Color | Grade | Meaning |
|-------------|-------|-------|---------|
| 90-100 | quantum-green | A/A- | Exceptional |
| 80-89 | quantum-cyan | B+/B/B- | Excellent |
| 70-79 | quantum-blue | C+/C/C- | Good |
| 60-69 | quantum-purple | D+/D/D- | Fair |
| 50-59 | quantum-orange | F | Below Average |
| 0-49 | quantum-red | F | Needs Improvement |

## Visualizations

### 1. Radar Chart
Shows top 6 sections by weight in a hexagonal radar chart. Best for seeing overall balance.

### 2. Bar Chart
Displays all 22 sections with both section scores and weighted contributions. Best for detailed comparison.

### 3. List View
Sortable list with progress bars. Best for finding specific sections quickly.

### 4. Pie Chart
Shows weight distribution of top 8 sections. Best for understanding methodology.

## Interactive Features

### Section Expansion
Click any section header to expand and view:
- Individual field scores
- Field values and confidence levels
- Visual score bars for each field
- Section summary statistics

### View Mode Toggle
Switch between Radar, Bar, and List views using the buttons at the top of the visualization section.

## Performance

The component is optimized for:
- **Initial render**: ~100ms for 22 sections with 140 fields
- **Animations**: Uses `framer-motion` with GPU acceleration
- **Charts**: `recharts` with responsive containers
- **Re-renders**: Memoized where appropriate

## Accessibility

- Semantic HTML with proper ARIA labels
- Keyboard navigation support
- Screen reader friendly (all scores announced)
- High contrast color schemes
- Focus indicators on interactive elements

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Examples

See `SMARTScoreDisplay.example.tsx` for complete working examples including:
- Basic usage with mock data
- Integration with real calculator
- Comparison view (multiple properties)
- Embedded in property detail page

## File Size

- Component: 739 lines
- Gzipped: ~12 KB
- Dependencies: Shared with existing components (no additional bundle cost)

## Section Icons

Each section has a unique icon from Lucide React:

| Section | Icon | Description |
|---------|------|-------------|
| A | MapPin | Address & Identity |
| B | DollarSign | Pricing & Value |
| C | Home | Property Basics |
| D | Receipt | HOA & Taxes |
| E | Wrench | Structure & Systems |
| F | Home | Interior Features |
| G | TreePine | Exterior Features |
| H | FileCheck | Permits & Renovations |
| I | GraduationCap | Assigned Schools |
| J | Navigation | Location Scores |
| K | MapPin | Distances & Amenities |
| L | Shield | Safety & Crime |
| M | TrendingUp | Market & Investment |
| N | Zap | Utilities & Connectivity |
| O | CloudRain | Environment & Risk |
| P | Star | Additional Features |
| Q | Car | Parking |
| R | Building | Building Details |
| S | Scale | Legal & Compliance |
| T | Waves | Waterfront |
| U | FileText | Leasing & Rentals |
| V | Users | Community Features |

## Related Components

- `OliviaExecutiveReport` - Uses similar styling patterns
- `PropertyComparisonAnalytics` - Uses Recharts for visualizations
- `ProgressiveAnalysisPanel` - Similar expandable section pattern

## Future Enhancements

Potential improvements for v2:
- Export to PDF functionality
- Comparison mode (overlay 2-3 properties)
- Historical score tracking (show changes over time)
- Custom weight editor (let users adjust section weights)
- Field-level drill-down (click field to see normalization logic)
- Mobile-optimized view with swipeable sections

## Support

For questions or issues:
1. Check `SMARTScoreDisplay.example.tsx` for usage patterns
2. Review `smart-score-calculator.ts` for score calculation logic
3. See `fields-schema.ts` for complete field definitions

## License

Part of the CLUES Quantum Property Dashboard.
© 2025 CLUES™ - Comprehensive Location Utility & Evaluation System
