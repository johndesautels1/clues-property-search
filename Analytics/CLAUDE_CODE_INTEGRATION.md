# Claude Code Integration Guide

## 🚀 Quick Start for Claude Code

This guide will help you integrate the Property Comparison Analytics into your Vite-Capacitor mobile app using Claude Code.

## Step 1: Copy Files to Your Project

In your terminal (Claude Code):

```bash
# Navigate to your project
cd /path/to/your/vite-capacitor-project

# Create components directory if it doesn't exist
mkdir -p src/components

# Copy the 4 files
cp PropertyComparisonAnalytics.tsx src/components/
cp PropertyComparisonAnalytics.css src/components/
cp types.ts src/components/
cp exampleData.ts src/components/
```

## Step 2: Install Dependencies

```bash
npm install chart.js react-chartjs-2
```

## Step 3: Test with Example Data

Create a test page (`src/pages/AnalyticsTest.tsx`):

```tsx
import React, { useState } from 'react';
import PropertyComparisonAnalytics from '../components/PropertyComparisonAnalytics';
import { TEST_PROPERTIES } from '../components/exampleData';

export default function AnalyticsTest() {
  const [showAnalytics, setShowAnalytics] = useState(true);
  
  return (
    <div>
      {showAnalytics ? (
        <PropertyComparisonAnalytics
          properties={TEST_PROPERTIES}
          onClose={() => setShowAnalytics(false)}
        />
      ) : (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Property Analytics Test</h1>
          <button 
            onClick={() => setShowAnalytics(true)}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              background: '#F7E7CE',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Show Analytics Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
```

## Step 4: Add to Your Router

In your `App.tsx` or router config:

```tsx
import AnalyticsTest from './pages/AnalyticsTest';

// Add to your routes
<Route path="/analytics-test" element={<AnalyticsTest />} />
```

## Step 5: Test on Mobile

```bash
# Build for iOS
npm run build
npx cap sync ios
npx cap open ios

# Build for Android
npm run build
npx cap sync android
npx cap open android
```

## Step 6: Connect to Your Real Data

Replace the test data with your actual property data:

```tsx
// In your property selection screen
import PropertyComparisonAnalytics from '../components/PropertyComparisonAnalytics';
import type { Property } from '../components/types';

function PropertySelection() {
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  
  const handleCompare = () => {
    if (selectedProperties.length === 3) {
      setShowComparison(true);
    }
  };
  
  return (
    <>
      {showComparison ? (
        <PropertyComparisonAnalytics
          properties={selectedProperties as [Property, Property, Property]}
          onClose={() => setShowComparison(false)}
        />
      ) : (
        <div>
          {/* Your property selection UI */}
          <button 
            onClick={handleCompare}
            disabled={selectedProperties.length !== 3}
          >
            Compare Selected Properties
          </button>
        </div>
      )}
    </>
  );
}
```

## Step 7: Map Your API Data

If your API returns different field names, create a mapper:

```tsx
// src/utils/propertyMapper.ts
import type { Property } from '../components/types';

export function mapApiToProperty(apiData: any): Property {
  return {
    id: apiData.property_id,
    address: apiData.full_address,
    price: apiData.listing_price,
    sqft: apiData.square_footage,
    bedrooms: apiData.beds,
    bathrooms: apiData.baths,
    
    // Financial
    listPrice: apiData.listing_price,
    marketEstimate: apiData.market_value,
    redfinEstimate: apiData.redfin_estimate || apiData.market_value,
    assessedValue: apiData.tax_assessed_value,
    
    appreciation5yr: calculateAppreciation(apiData),
    capRate: calculateCapRate(apiData),
    // ... map all other fields
    
    // Nested objects
    investmentScore: {
      financialHealth: apiData.scores.financial,
      locationValue: apiData.scores.location,
      propertyCondition: apiData.scores.condition,
      riskProfile: apiData.scores.risk,
      marketPosition: apiData.scores.market,
      growthPotential: apiData.scores.growth
    },
    
    // ... continue mapping
  };
}

function calculateAppreciation(data: any): number {
  // Your calculation logic
  return ((data.current_value - data.purchase_price) / data.purchase_price) * 100;
}

function calculateCapRate(data: any): number {
  // Your calculation logic
  return (data.annual_income / data.property_value) * 100;
}
```

## Step 8: Add Fonts (Optional but Recommended)

In your `index.html`:

```html
<head>
  <!-- Existing head content -->
  
  <!-- Add Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
```

## Common Issues & Solutions

### Issue: "Module not found: chart.js"
**Solution**: 
```bash
npm install chart.js react-chartjs-2 --save
```

### Issue: Charts not rendering
**Solution**: Check Chart.js imports in component:
```tsx
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  // ... all required imports
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  // ... all required registrations
);
```

### Issue: TypeScript errors on Property interface
**Solution**: Ensure all fields are populated. Use the EXAMPLE_PROPERTY in types.ts as reference:
```tsx
import { EXAMPLE_PROPERTY } from './components/types';

// Use as template
const myProperty: Property = {
  ...EXAMPLE_PROPERTY,
  id: 'my-unique-id',
  address: 'My actual address',
  // ... override specific fields
};
```

### Issue: CSS not loading
**Solution**: Ensure CSS import in component:
```tsx
import './PropertyComparisonAnalytics.css';
```

### Issue: Mobile layout broken
**Solution**: Check viewport meta tag in index.html:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

## Customization

### Change Color Scheme

In `PropertyComparisonAnalytics.tsx`, modify the colors object:

```tsx
const colors = {
  prop1: {
    primary: 'rgba(YOUR_COLOR)',
    border: 'rgba(YOUR_COLOR)',
    bg: 'rgba(YOUR_COLOR)'
  },
  // ...
};
```

### Adjust Chart Heights

In `PropertyComparisonAnalytics.css`:

```css
.chart-container {
  height: 400px; /* Change from 350px */
}

@media (max-width: 768px) {
  .chart-container {
    height: 320px; /* Change from 300px */
  }
}
```

### Add More View Types

In the component, add to ViewType:

```tsx
export type ViewType = 'all' | 'financial' | 'location' | 'risk' | 'amenities' | 'custom';

// Then add button
<button 
  className={view === 'custom' ? 'active' : ''} 
  onClick={() => setView('custom')}
>
  Custom View
</button>

// And conditional rendering
{(view === 'all' || view === 'custom') && (
  <div className="chart-card">
    {/* Your custom charts */}
  </div>
)}
```

## Performance Monitoring

Add performance tracking:

```tsx
import React, { useEffect } from 'react';

const PropertyComparisonAnalytics: React.FC<PropertyComparisonProps> = ({
  properties,
  onClose
}) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      console.log(`Analytics render time: ${endTime - startTime}ms`);
    };
  }, []);
  
  // ... rest of component
};
```

## Next Steps

1. ✅ Test with example data
2. ✅ Verify all 32 charts render correctly
3. ✅ Test on physical iOS device
4. ✅ Test on physical Android device
5. ✅ Map your API data to Property interface
6. ✅ Integrate into your main app flow
7. ✅ Add analytics tracking
8. ✅ Performance optimization if needed
9. ✅ User testing

## Support Commands

```bash
# Check dependencies
npm list chart.js react-chartjs-2

# Rebuild Capacitor
npx cap sync

# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npx tsc --noEmit

# Run linter
npm run lint
```

## File Checklist

- [ ] `PropertyComparisonAnalytics.tsx` (Main component - 32 charts)
- [ ] `PropertyComparisonAnalytics.css` (Styles)
- [ ] `types.ts` (TypeScript interfaces)
- [ ] `exampleData.ts` (Test data)
- [ ] Dependencies installed (chart.js, react-chartjs-2)
- [ ] Fonts added to index.html (optional)
- [ ] Component imported in your app
- [ ] Test route created

## Ready for Production?

Before deploying:

- [ ] All charts render correctly on mobile
- [ ] Performance is acceptable (< 3s initial load)
- [ ] Data mapping complete and tested
- [ ] Error boundaries added
- [ ] Analytics tracking implemented
- [ ] User feedback collected
- [ ] Accessibility tested
- [ ] Cross-browser tested (iOS Safari, Android Chrome)

---

**Questions?** Check the main README.md for detailed documentation.
