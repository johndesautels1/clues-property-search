# 🔧 SOURCE ATTRIBUTION FIX PLAN
**Created:** 2026-01-12
**Priority:** CRITICAL
**Issue:** Source information ("Stellar MLS", "Google Maps", etc.) is being lost in the data pipeline, showing as "Source: Unknown" in UI

---

## 🎯 EXECUTIVE SUMMARY

**Problem:** Property fields display "Source: Unknown" even though they come from known sources (Stellar MLS via Bridge, Google APIs, Tavily, LLMs).

**Root Cause:** Source metadata is stripped at multiple points in the data pipeline:
1. Bridge MLS fields lose source during extraction (search.ts:4956-4963)
2. Conflict detection exposes debug info to users instead of resolving conflicts
3. Source attribution inconsistent across 11 core files

**Impact:**
- Unprofessional UI with "Source: Unknown" everywhere
- Users see internal "CONFLICT DETECTED" debug messages
- Can't verify data reliability (which fields came from MLS vs LLMs)

---

## 🔍 DETAILED ANALYSIS

### Data Flow Pipeline:
```
1. Bridge MLS API → returns { fields: { "1_full_address": { value, source, confidence } } }
2. search.ts extracts → mlsFields[key] = actualValue  ❌ LOSES source/confidence
3. arbitrationPipeline.addFieldsFromSource(mlsFields, 'Stellar MLS')  ⚠️ Generic source
4. field-normalizer.ts → createDataField(value, confidence, source='Unknown', ...)
5. propertyStore → stores fullProperty with sources: []
6. PropertyDetail.tsx → displays "Source: Unknown"
```

---

## 📋 FILES TO FIX (11 Core Files)

### **Priority 1: Critical Path Files**

#### 1. ✅ `api/property/search.ts` (Lines 4956-4963)
**Current Problem:**
```typescript
for (const [key, fieldData] of Object.entries(bridgeData.fields)) {
  const field = fieldData as any;
  const actualValue = typeof field.value === 'object' && field.value !== null && 'value' in field.value
    ? field.value.value
    : field.value;
  mlsFields[key] = actualValue;  // ❌ Only stores value
}
```

**Fix:**
```typescript
for (const [key, fieldData] of Object.entries(bridgeData.fields)) {
  const field = fieldData as any;

  // Preserve full field object with source and confidence
  if (typeof field === 'object' && field !== null) {
    // If Bridge returns nested format like { value: { value, source, confidence } }
    if (typeof field.value === 'object' && field.value !== null && 'value' in field.value) {
      mlsFields[key] = {
        value: field.value.value,
        source: field.value.source || field.source || 'Stellar MLS',
        confidence: field.value.confidence || field.confidence || 'High'
      };
    } else {
      // Standard format: { value, source, confidence }
      mlsFields[key] = {
        value: field.value,
        source: field.source || 'Stellar MLS',
        confidence: field.confidence || 'High'
      };
    }
  } else {
    // Primitive value - wrap with metadata
    mlsFields[key] = {
      value: field,
      source: 'Stellar MLS',
      confidence: 'High'
    };
  }
}
```

**Impact:** Preserves Bridge MLS source attribution for all 50+ Stellar MLS fields

---

#### 2. ✅ `api/property/arbitration.ts`
**Check:** Ensure `addFieldsFromSource()` properly handles source parameter
**Verify:** Source is passed through to final field objects
**Test:** Log field source at arbitration output

---

#### 3. ✅ `src/lib/field-normalizer.ts` (Lines 964-966)
**Current:**
```typescript
const source = fieldData.source || 'Unknown';
const confidence = mapConfidence(fieldData.confidence);
const llmSources = fieldSources[apiKey] || fieldData.llmSources || [];
```

**Issue:** If `fieldData.source` is undefined, defaults to 'Unknown'

**Fix:** Add better fallback logic based on field type:
```typescript
const source = fieldData.source ||
               (apiKey.startsWith('1_') || apiKey.startsWith('2_') ? 'Stellar MLS' : null) ||
               'API Data';
const confidence = mapConfidence(fieldData.confidence);
const llmSources = fieldSources[apiKey] || fieldData.llmSources || [];
```

**Better:** Ensure upstream always sets source so we don't need fallbacks

---

#### 4. ✅ `src/pages/PropertyDetail.tsx` (Lines 217-239)
**Current Problem:** Conflict detection shown to end users
```typescript
} else if (hasConflict && conflictValues && conflictValues.length > 0) {
  bgColor = 'bg-yellow-500/5';
  borderColor = 'border-yellow-500/20';
  statusBadge = (
    <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-600">
      <div className="flex items-center gap-1 font-semibold">
        <AlertCircle className="w-3 h-3" />
        CONFLICT DETECTED
      </div>
      <div className="text-yellow-700 mt-1">
        Multiple sources provided different values:
      </div>
      <ul className="mt-1 space-y-0.5 pl-4">
        {conflictValues.map((cv, i) => (
          <li key={i} className="text-[11px]">
            • {cv.source}: {formatValue(cv.value, format)}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Fix:** Remove conflict display from user view - only show in admin mode
```typescript
} else if (isAdmin && hasConflict && conflictValues && conflictValues.length > 0) {
  // Show conflicts ONLY to admins, not end users
  bgColor = 'bg-yellow-500/5';
  borderColor = 'border-yellow-500/20';
  statusBadge = (
    <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-600">
      <div className="flex items-center gap-1 font-semibold">
        <AlertCircle className="w-3 h-3" />
        DATA CONFLICT (Admin View)
      </div>
      <div className="text-yellow-700 mt-1">
        Arbitration resolved between:
      </div>
      <ul className="mt-1 space-y-0.5 pl-4">
        {conflictValues.map((cv, i) => (
          <li key={i} className="text-[11px]">
            • {cv.source}: {formatValue(cv.value, format)}
          </li>
        ))}
      </ul>
      <div className="text-yellow-600 mt-1 text-[10px]">
        ✓ Highest-tier source selected automatically
      </div>
    </div>
  );
}
```

**Impact:** Users see clean, resolved data; admins see conflict details

---

### **Priority 2: Verification Files**

#### 5. ✅ `api/property/free-apis.ts`
**Check:** All API functions set proper source:
- ✅ `callNOAASeaLevel` → `source: 'NOAA Sea Level'`
- ✅ `callUSGSElevation` → `source: 'USGS Elevation'`
- ✅ `callFEMARiskIndex` → `source: 'FEMA Risk Index'`

**Verify:** Each function returns `{ value, source, confidence }`

---

#### 6. ✅ `api/property/bridge-mls.ts`
**Check:** Bridge API response format includes source
**Verify:** Response structure:
```typescript
{
  success: true,
  fields: {
    "1_full_address": {
      value: "123 Main St",
      source: "Stellar MLS",
      confidence: "High"
    }
  }
}
```

---

#### 7. ✅ `src/lib/bridge-field-mapper.ts`
**Check:** mapBridgeToFields() preserves source metadata
**Verify:** Mapped fields include source
**Test:** Log sample mapped field

---

#### 8. ✅ `api/property/retry-llm.ts`
**Check:** LLM retries set proper source (Perplexity, GPT, etc.)
**Verify:** Field objects include source in response

---

#### 9. ✅ `api/property/parse-mls-pdf.ts`
**Check:** PDF parsed fields set `source: 'Stellar MLS PDF'`
**Verify:** All extracted fields have source attribution

---

#### 10. ✅ `src/pages/AddProperty.tsx`
**Check:** convertApiResponseToFullProperty() preserves sources
**Verify:** fieldSources parameter is passed through
**Current:** Lines 667-673 call `normalizeToProperty(fields, propertyId, fieldSources, conflicts)`

---

#### 11. ✅ `src/store/propertyStore.ts`
**Check:** Property merging preserves source arrays
**Verify:** updateFullProperty() doesn't strip sources
**Test:** Source arrays survive store operations

---

## 🧪 TESTING CHECKLIST

### Test Case 1: Stellar MLS Fields
- [ ] Search property with active MLS listing
- [ ] Check field `1_full_address` source = "Stellar MLS"
- [ ] Check field `2_mls_primary` source = "Stellar MLS"
- [ ] Check field `10_listing_price` source = "Stellar MLS"
- [ ] Verify NO fields show "Source: Unknown" for MLS data

### Test Case 2: API-Enriched Fields
- [ ] Enrich property with APIs
- [ ] Check field `74_walk_score` source = "WalkScore"
- [ ] Check field `119_flood_zone` source = "FEMA NFHL"
- [ ] Check field `128_sea_level_rise_risk` source = "NOAA Sea Level"

### Test Case 3: LLM Fields
- [ ] Retry a field with Perplexity
- [ ] Verify source = "Perplexity A" (or appropriate LLM)
- [ ] Check llmSources array is populated

### Test Case 4: Conflict Resolution
- [ ] Create property with conflicting data
- [ ] Verify conflict NOT shown to regular users
- [ ] Enable admin mode
- [ ] Verify conflict shown with "Admin View" label
- [ ] Verify winning value displayed to users

### Test Case 5: Source Display Consistency
- [ ] Verify all fields with data show proper source (not "Unknown")
- [ ] Check PropertyDetail.tsx renders sources correctly
- [ ] Test both admin and user views

---

## 📈 SUCCESS CRITERIA

1. ✅ **Zero "Source: Unknown"** for fields with known sources
2. ✅ **No "CONFLICT DETECTED"** shown to end users
3. ✅ **Accurate source attribution** for all data:
   - Stellar MLS fields → "Stellar MLS"
   - API fields → Specific API name
   - LLM fields → Specific LLM name
4. ✅ **Admin-only conflict display** with resolution notes
5. ✅ **Consistent source tracking** across all 11 files

---

## 🚀 IMPLEMENTATION ORDER

### Phase 1: Fix Critical Path (30 min)
1. Fix `search.ts:4956-4963` - Preserve Bridge MLS source
2. Test: Verify Bridge fields keep source metadata
3. Fix `PropertyDetail.tsx` - Hide conflicts from users

### Phase 2: Verify Pipeline (20 min)
4. Check `arbitration.ts` - Ensure source passthrough
5. Check `field-normalizer.ts` - Remove "Unknown" defaults
6. Test end-to-end: API → Store → UI

### Phase 3: Validate All Sources (30 min)
7. Audit `free-apis.ts` - All APIs set source
8. Audit `bridge-field-mapper.ts` - Preserves source
9. Audit `retry-llm.ts` - LLMs set source
10. Test all source types

### Phase 4: Final Testing (20 min)
11. Run all 5 test cases
12. Verify admin vs user views
13. Check conflict resolution works
14. Deploy and monitor

**Total Estimated Time:** ~100 minutes (1h 40min)

---

## 📝 NOTES

- **Backward Compatibility:** Keep "Unknown" as last resort fallback
- **Admin Mode:** Use `isAdmin` flag to show debug info
- **Logging:** Add console.logs at each stage to trace source flow
- **Documentation:** Update field mapping docs with source expectations

---

**Status:** Ready for implementation
**Next Step:** Execute Phase 1 fixes

