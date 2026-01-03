# Strategy for 30 Difficult/Unreliable Fields

## Problem
These fields are consistently missing or have unverified data from LLMs:
Fields 19, 26, 40, 41, 43, 48, 55, 58, 60, 61, 62, 77, 89, 93, 94, 95, 96, 100, 134, 135, 138, 142, 143, 150, 161, 162, 163, 166, 167, 168

---

## ✅ ALREADY SOLVED (Auto-Calculated)

| Field | Solution | Status |
|-------|----------|--------|
| 93 | Price to Rent Ratio | ✅ Auto-calculated from Fields 10, 98 |
| 94 | Price vs Median % | ✅ Auto-calculated from Fields 10, 91 |

**These 2 fields now auto-populate with HIGH confidence!**

---

## 🎯 CAN BE SOLVED WITH CODE

### Category 1: Calculate from Other Fields

| Field | Name | Calculation | Dependencies |
|-------|------|-------------|--------------|
| 19 | Half Bathrooms | Can infer: `totalBaths - fullBaths = halfBaths` | Fields 18, 20 |

**Recommendation:** Add to `field-calculations.ts`
```typescript
// If we have total and full, calculate half
if (totalBathrooms && fullBathrooms && !halfBathrooms) {
  halfBathrooms = (totalBathrooms - fullBathrooms) * 2; // Convert back to half bath count
}
```

---

### Category 2: Age-Based Estimates (Already Partially Implemented)

| Field | Name | Current Status | Improvement |
|-------|------|---------------|-------------|
| 40 | Roof Age (Est) | ✅ Implemented in field-calculations.ts | Add permit data lookup |
| 48 | Interior Condition | ✅ Implemented in field-calculations.ts | Enhanced with more criteria |

**These are working but need permit data for accuracy**

---

### Category 3: Stellar MLS Should Provide (Check if being extracted)

| Field | Name | MLS Field | Currently Extracted? |
|-------|------|-----------|---------------------|
| 26 | Property Type | `PropertyType` or `PropertySubType` | ✅ Yes |
| 41 | Exterior Material | `ConstructionMaterials` | ✅ Yes |
| 43 | Water Heater Type | `WaterHeaterFeatures` | ⚠️ Check |
| 55 | Pool Type | `PoolFeatures` | ✅ Yes |
| 58 | Landscaping | `LandscapingFeatures` | ⚠️ Check |
| 142 | Parking Features | `ParkingFeatures` | ✅ Yes |
| 143 | Assigned Parking Spaces | `AssignedParkingSpaces` | ⚠️ Check |
| 150 | Legal Description | `LegalDescription` | ✅ Yes |
| 161 | Minimum Lease Period | `LeaseTermMinimum` | ⚠️ Check |
| 162 | Lease Restrictions | `LeaseRestrictionsYN` | ✅ Yes |
| 163 | Pet Size Limit | `PetSizeDescription` | ⚠️ Check |
| 166 | Community Features | `CommunityFeatures` | ✅ Yes |
| 167 | Interior Features | `InteriorFeatures` | ✅ Yes |
| 168 | Exterior Features | `ExteriorFeatures` | ✅ Yes |

**Action:** Check bridge-field-mapper.ts to ensure ALL these are being extracted

---

## ⚠️ NEED EXTERNAL DATA SOURCES

### Category 4: Permit Data (Requires County APIs)

| Field | Name | Source Needed | Free API Available? |
|-------|------|---------------|---------------------|
| 60 | Permit History - Roof | County Building Dept | ✅ Pinellas: Yes |
| 61 | Permit History - HVAC | County Building Dept | ✅ Pinellas: Yes |
| 62 | Permit History - Other | County Building Dept | ✅ Pinellas: Yes |

**Solution:** Integrate county permit APIs
- Pinellas County: https://aca.pinellas.gov/ (has API)
- Hillsborough: https://www.hillsboroughcounty.org/en/residents/building
- Other counties: Each has different system

**Estimated work:** 2-4 hours per county

---

### Category 5: Market Data (Need Premium Sources or Better LLM Prompts)

| Field | Name | Best Source | Current Reliability |
|-------|------|-------------|---------------------|
| 95 | Days on Market (Avg) | Stellar MLS, Zillow API | Low - LLMs hallucinate |
| 96 | Inventory Surplus | Market analysis | Very Low |
| 100 | Vacancy Rate | US Census API | ✅ Can be added |

**Recommendations:**
1. **Field 95**: Stellar MLS might have this - check `DaysOnMarket` or `CumulativeDaysOnMarket`
2. **Field 96**: Calculate from Field 95 (if > 90 days = "High", < 30 = "Low")
3. **Field 100**: Add US Census API (free) - already in data gap analysis doc

---

### Category 6: Crime Data (Partially Available)

| Field | Name | Current Source | Issue |
|-------|------|---------------|-------|
| 77 | Safety Score | Calculated | Not implemented |
| 89 | Property Crime Index | FBI Crime API | ✅ Working but limited data |

**Recommendation:**
- Field 77: Calculate from Field 88 (violent) + 89 (property)
- Formula: `safetyScore = 100 - ((violentCrime + propertyCrime) / 2)`

**Add to field-calculations.ts:**
```typescript
if (violentCrimeIndex && propertyCrimeIndex) {
  safetyScore = Math.round(100 - ((violentCrimeIndex + propertyCrimeIndex) / 20));
}
```

---

### Category 7: Smart Home & Accessibility (Rarely Available)

| Field | Name | Availability | Recommendation |
|-------|------|--------------|----------------|
| 134 | Smart Home Features | Very Rare | Parse from MLS remarks if available |
| 135 | Accessibility Modifications | Very Rare | Parse from MLS remarks if available |
| 138 | Special Assessments | Rare | HOA documents required - keep as manual |

**Action:** These should remain optional/manual entry. LLMs can extract from `PublicRemarks` field if present.

---

## 📊 PRIORITY ACTION PLAN

### Phase 1: Quick Wins (30 min - 1 hour)

1. ✅ **Already Done:** Fields 93, 94 auto-calculated
2. **Add Field 19 calculation** (halfBathrooms from total - full)
3. **Add Field 77 calculation** (safetyScore from crime indices)
4. **Add Field 96 inference** (inventory surplus from days on market)

**Expected improvement:** +3 fields per property

---

### Phase 2: Check MLS Field Mapping (1-2 hours)

Review `bridge-field-mapper.ts` and verify these MLS fields are being extracted:
- WaterHeaterFeatures → Field 43
- LandscapingFeatures → Field 58
- AssignedParkingSpaces → Field 143
- LeaseTermMinimum → Field 161
- PetSizeDescription → Field 163

**Expected improvement:** +5 fields per property (if currently missing)

---

### Phase 3: Add Census Vacancy Rate (1 hour)

Integrate US Census API for Field 100 (vacancy_rate_neighborhood)
- API: https://api.census.gov/data/2023/acs/acs5
- Field: B25002_003E (Vacant housing units)
- Coverage: All US addresses

**Expected improvement:** +1 field per property

---

### Phase 4: County Permit APIs (2-4 hours per county)

Start with Pinellas County (your primary market):
- Fields 60, 61, 62 (permit history)
- Also improves Field 40 accuracy (roof age from permits)

**Expected improvement:** +3-4 fields per property in Pinellas

---

## 🎯 EXPECTED RESULTS AFTER ALL PHASES

### Current (Before Improvements):
- **30 difficult fields**
- Average availability: ~30-40% (9-12 fields populated)
- Low confidence on most

### After Phase 1-3 (Easy wins):
- **30 difficult fields**
- Average availability: ~60-70% (18-21 fields populated)
- HIGH confidence on calculated fields

### After Phase 4 (County permits):
- **30 difficult fields**
- Average availability: ~75-85% (22-25 fields populated)
- Pinellas County properties: 90%+

---

## 🛠️ IMPLEMENTATION CODE SAMPLES

### 1. Add to field-calculations.ts

```typescript
/**
 * Calculate half bathrooms if missing but we have total and full
 */
export function calculateMissingBathrooms(property: FullProperty): Partial<FullProperty> {
  const derived: any = { details: {} };

  const total = property.details?.totalBathrooms?.value;
  const full = property.details?.fullBathrooms?.value;
  const half = property.details?.halfBathrooms?.value;

  // If we have total and full, but missing half
  if (total && full && !half) {
    const calculatedHalf = (total - full) * 2;
    derived.details.halfBathrooms = {
      value: calculatedHalf,
      confidence: 'High',
      notes: 'Auto-calculated: (Total Baths - Full Baths) × 2',
      sources: ['Auto-Calculated'],
      llmSources: ['Auto-Calculated'],
      validationStatus: 'valid'
    };
  }

  return derived;
}

/**
 * Calculate safety score from crime indices
 */
export function calculateSafetyScore(property: FullProperty): Partial<FullProperty> {
  const derived: any = { location: {} };

  const violent = parseFloat(property.location?.crimeIndexViolent?.value) || 0;
  const propertyC = parseFloat(property.location?.crimeIndexProperty?.value) || 0;

  if (violent || propertyC) {
    const avgCrime = (violent + propertyC) / 2;
    const safetyScore = Math.max(0, Math.round(100 - (avgCrime / 10)));

    derived.location.safety_score = {
      value: safetyScore,
      confidence: 'Medium',
      notes: `Auto-calculated from crime indices. Formula: 100 - ((Violent ${violent} + Property ${propertyC}) / 20)`,
      sources: ['Auto-Calculated'],
      llmSources: ['Auto-Calculated'],
      validationStatus: 'valid'
    };
  }

  return derived;
}

/**
 * Infer inventory surplus from days on market
 */
export function inferInventorySurplus(property: FullProperty): Partial<FullProperty> {
  const derived: any = { financial: {} };

  const daysOnMarket = property.financial?.daysOnMarketAvg?.value;

  if (daysOnMarket) {
    let surplus = 'Balanced';
    if (daysOnMarket > 90) surplus = 'High - Buyer\'s market';
    else if (daysOnMarket < 30) surplus = 'Low - Seller\'s market';

    derived.financial.inventorySurplus = {
      value: surplus,
      confidence: 'Medium',
      notes: `Auto-inferred from Days on Market (${daysOnMarket} days). >90=High, 30-90=Balanced, <30=Low`,
      sources: ['Auto-Calculated'],
      llmSources: ['Auto-Calculated'],
      validationStatus: 'valid'
    };
  }

  return derived;
}
```

---

## 📝 RECOMMENDED STRATEGY

**For these 30 difficult fields, adopt a tiered approach:**

### Tier 1: Auto-Calculate (HIGH accuracy)
- Fields 19, 77, 93, 94, 96
- **Action:** Implement in code
- **Confidence:** HIGH

### Tier 2: Stellar MLS Extract (MEDIUM-HIGH accuracy)
- Fields 26, 41, 43, 55, 58, 142, 143, 150, 161, 162, 163, 166, 167, 168
- **Action:** Verify extraction in bridge-field-mapper.ts
- **Confidence:** HIGH (when available in MLS)

### Tier 3: External APIs (HIGH accuracy when available)
- Fields 60, 61, 62 (County permits)
- Field 100 (Census data)
- **Action:** Integrate APIs for your 6 counties
- **Confidence:** HIGH

### Tier 4: Keep as LLM/Manual (LOW accuracy)
- Fields 40, 48, 89, 95, 134, 135, 138
- **Action:** Accept low reliability, flag with "Verify" warnings
- **Confidence:** LOW - User should verify

### Tier 5: Age-Based Estimates (MEDIUM accuracy)
- Fields 40, 48 (already implemented)
- **Confidence:** MEDIUM - Better than nothing

---

## 🎯 FINAL RECOMMENDATION

**Implement Phase 1 now (30-60 minutes):**
1. Add halfBathrooms calculation (Field 19)
2. Add safetyScore calculation (Field 77)
3. Add inventorySurplus inference (Field 96)

**Result:** 3 more HIGH-confidence fields with ZERO API costs

**Want me to implement Phase 1 right now?**
