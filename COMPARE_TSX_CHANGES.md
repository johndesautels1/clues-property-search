# EXACT CODE CHANGES FOR Compare.tsx

**File**: `src/pages/Compare.tsx`

**Goal**: Add toggle between old and new Olivia UI without breaking anything

---

## CHANGE 1: Add Imports (Line ~20)

### FIND THIS:
```typescript
import { OliviaResults } from '@/components/OliviaResults';
```

### REPLACE WITH:
```typescript
import { OliviaResults } from '@/components/OliviaResults';
import { OliviaExecutiveReport } from '@/components/OliviaExecutiveReport'; // NEW
import { analyzeWithOliviaEnhanced, extractPropertyData } from '@/api/olivia-brain-enhanced'; // NEW
import type { OliviaEnhancedAnalysisResult } from '@/types/olivia-enhanced'; // NEW
```

---

## CHANGE 2: Add State Variables (Line ~50-100, where other useState declarations are)

### ADD THESE NEW LINES:
```typescript
// Olivia Enhanced (168-field analysis)
const [useEnhancedOlivia, setUseEnhancedOlivia] = useState(true); // Toggle: true = new UI, false = old UI
const [oliviaEnhancedResult, setOliviaEnhancedResult] = useState<OliviaEnhancedAnalysisResult | null>(null);
```

**Note**: Keep all existing Olivia state (oliviaResult, oliviaLoading, oliviaError) - DON'T delete them!

---

## CHANGE 3: Add New Handler Function (Line ~200-400, near other handler functions)

### ADD THIS NEW FUNCTION:
```typescript
/**
 * Enhanced Olivia Analysis with 168 fields and mathematical proofs
 */
const handleAskOliviaEnhanced = async () => {
  // Validation
  if (selectedProperties.length !== 3) {
    setOliviaError('Olivia Enhanced requires exactly 3 properties for mathematical comparison');
    return;
  }

  setOliviaLoading(true);
  setOliviaError(null);
  setOliviaEnhancedResult(null);

  try {
    console.log('🧮 Starting Olivia Enhanced analysis (168 fields)...');

    // Extract all 168 fields from each selected property
    const enhancedProperties = selectedProperties.map(prop => {
      // Get full property data from store
      const fullProp = fullProperties.get(prop.id);

      // Extract all 168 fields
      return extractPropertyData(fullProp || prop);
    });

    console.log('📊 Extracted fields from', enhancedProperties.length, 'properties');

    // Call enhanced mathematical analysis API
    const result = await analyzeWithOliviaEnhanced({
      properties: enhancedProperties,
      buyerProfile: 'investor', // TODO: Get from user settings or add selector
      includeMarketForecast: true,
    });

    console.log('✅ Enhanced analysis complete');

    // CRITICAL: Check for hallucinations
    if (result.validation && !result.validation.isValid) {
      console.warn('⚠️ Validation warnings detected:');
      console.warn('Errors:', result.validation.errors);
      console.warn('Warnings:', result.validation.warnings);
      console.warn('Hallucinations:', result.validation.hallucinations);

      // Show warning to user but still display results
      setOliviaError(
        `Analysis completed with ${result.validation.hallucinations.length} validation warnings. ` +
        `Check console for details.`
      );
    } else {
      console.log('✅ Validation passed - no hallucinations detected');
    }

    setOliviaEnhancedResult(result);
  } catch (error) {
    console.error('❌ Enhanced analysis failed:', error);
    setOliviaError(
      error instanceof Error
        ? `Enhanced analysis failed: ${error.message}`
        : 'Enhanced analysis failed. Please try again.'
    );
  } finally {
    setOliviaLoading(false);
  }
};
```

**Note**: Keep existing `handleAskOlivia` function - DON'T delete it!

---

## CHANGE 4: Update "Ask Olivia AI" Button (Line ~950-980)

### FIND THIS:
```typescript
<button
  onClick={handleAskOlivia}
  disabled={oliviaLoading || selectedProperties.length < 2}
  className="..."
>
  <Brain className="w-5 h-5" />
  {oliviaLoading ? 'Olivia is analyzing...' : 'Ask Olivia AI'}
</button>
```

### REPLACE WITH:
```typescript
<button
  onClick={useEnhancedOlivia ? handleAskOliviaEnhanced : handleAskOlivia}
  disabled={oliviaLoading || (useEnhancedOlivia ? selectedProperties.length !== 3 : selectedProperties.length < 2)}
  className="w-full px-6 py-4 bg-gradient-to-r from-quantum-purple to-quantum-cyan rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-quantum-purple/50"
>
  <Brain className="w-5 h-5" />
  {oliviaLoading ? (
    'Olivia is analyzing...'
  ) : useEnhancedOlivia ? (
    <>
      ✨ Ask Olivia Enhanced
      <span className="text-xs opacity-75">(168 fields • 3 properties required)</span>
    </>
  ) : (
    'Ask Olivia AI'
  )}
</button>
```

---

## CHANGE 5: Add Toggle UI (Line ~990, BEFORE the Olivia Results section)

### ADD THIS NEW SECTION (before line 999 where OliviaResults is rendered):
```typescript
{/* Olivia UI Toggle */}
{(oliviaResult || oliviaEnhancedResult) && (
  <div className="mb-6 flex items-center justify-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
    <span className="text-sm text-gray-400">Olivia UI Mode:</span>
    <div className="flex gap-2">
      <button
        onClick={() => setUseEnhancedOlivia(false)}
        className={`px-4 py-2 rounded-lg transition-all font-medium ${
          !useEnhancedOlivia
            ? 'bg-quantum-purple text-white shadow-lg shadow-quantum-purple/50'
            : 'bg-white/5 text-gray-400 hover:bg-white/10'
        }`}
      >
        Classic (10 fields)
      </button>
      <button
        onClick={() => setUseEnhancedOlivia(true)}
        className={`px-4 py-2 rounded-lg transition-all font-medium ${
          useEnhancedOlivia
            ? 'bg-gradient-to-r from-quantum-purple to-quantum-cyan text-white shadow-lg shadow-quantum-cyan/50'
            : 'bg-white/5 text-gray-400 hover:bg-white/10'
        }`}
      >
        ✨ Enhanced (168 fields)
      </button>
    </div>
  </div>
)}
```

---

## CHANGE 6: Update Results Rendering (Line ~998-1011)

### FIND THIS:
```typescript
{/* Olivia AI Results */}
{oliviaResult && (
  <div className="mb-6">
    <OliviaResults
      result={oliviaResult}
      properties={selectedProperties.map(p => ({
        id: p.id,
        address: p.address,
        city: p.city
      }))}
      onClose={() => setOliviaResult(null)}
    />
  </div>
)}
```

### REPLACE WITH:
```typescript
{/* Olivia AI Results - Conditional Rendering */}
{useEnhancedOlivia ? (
  /* Enhanced UI - 168 fields */
  oliviaEnhancedResult && (
    <div className="mb-6">
      <OliviaExecutiveReport
        result={oliviaEnhancedResult}
        properties={selectedProperties.map(p => ({
          id: p.id,
          address: p.address,
          city: p.city
        }))}
        onClose={() => setOliviaEnhancedResult(null)}
      />
    </div>
  )
) : (
  /* Classic UI - 10 fields (existing, unchanged) */
  oliviaResult && (
    <div className="mb-6">
      <OliviaResults
        result={oliviaResult}
        properties={selectedProperties.map(p => ({
          id: p.id,
          address: p.address,
          city: p.city
        }))}
        onClose={() => setOliviaResult(null)}
      />
    </div>
  )
)}
```

---

## CHANGE 7: Update Error Display (Optional - make it more informative)

### FIND THIS (Line ~1013-1018):
```typescript
{/* Olivia Error */}
{oliviaError && (
  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
    <p className="text-red-400 text-sm">Olivia Error: {oliviaError}</p>
  </div>
)}
```

### REPLACE WITH (Optional):
```typescript
{/* Olivia Error */}
{oliviaError && (
  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-red-400 text-sm font-semibold mb-1">
          {useEnhancedOlivia ? 'Olivia Enhanced Error' : 'Olivia Error'}
        </p>
        <p className="text-red-300 text-sm">{oliviaError}</p>
      </div>
    </div>
  </div>
)}
```

---

## SUMMARY OF CHANGES:

✅ **7 code changes** to Compare.tsx
✅ **Zero deletions** - all existing code stays
✅ **Backward compatible** - old UI still works
✅ **Easy toggle** - switch between UIs instantly
✅ **Safe rollback** - just change useState(true) to useState(false)

---

## TESTING CHECKLIST:

After making changes:

1. **Compile Check**:
   ```bash
   npm run type-check
   # OR
   tsc --noEmit
   ```

2. **Test Old UI**:
   - Toggle to "Classic"
   - Select 2-3 properties
   - Click "Ask Olivia AI"
   - Verify results display correctly

3. **Test New UI**:
   - Toggle to "Enhanced"
   - Select exactly 3 properties
   - Click "Ask Olivia Enhanced"
   - Verify 168-field report displays
   - Check browser console for validation logs

4. **Test Toggle**:
   - Switch between Classic and Enhanced
   - Verify results persist when switching back
   - Verify no console errors

5. **Test Error Handling**:
   - Try with < 3 properties (should show error for Enhanced)
   - Try with > 3 properties (should show error for Enhanced)
   - Verify error messages are clear

---

## NEXT STEPS:

1. ✅ Make these 7 changes to Compare.tsx
2. ✅ Copy files from OlivaBrainDraft to src/
3. ✅ Run `npm run type-check`
4. ✅ Test in development
5. ✅ Deploy to staging
6. ✅ Test with real users
7. ✅ Gather feedback
8. ✅ Decide: keep both or remove old UI

---

**Questions? Issues? Let me know and I'll help debug!**
