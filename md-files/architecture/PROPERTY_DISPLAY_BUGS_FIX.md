# Property Display Bugs - Complete Fix Plan

**Date:** 2025-12-06
**Issues Reported:**
1. Rental yield calculations sometimes work, sometimes don't, sometimes inaccurate
2. Property cards showing $0 price, 0 beds, 0 sqft (Properties 1 & 3 on Compare page)
3. Property 2 showing 1,692,157 sqft instead of 1,692 sqft
4. Fluorescent green hue when clicking category sections (user wants removed)

---

## 🐛 **BUG #1: Rental Yield Returns STRING Instead of NUMBER**

**File:** `src/lib/field-calculations.ts`
**Line:** 84
**Current Code:**
```typescript
derived.financial.rentalYieldEst = {
  value: yieldPct.toFixed(2),  // ❌ BUG: Returns STRING "6.42"
  confidence: 'High',
  // ...
};
```

**Problem:**
- `toFixed(2)` returns a **string**, not a number
- This breaks:
  - Numeric comparisons (6.42 > 5 fails)
  - Charts (can't plot strings)
  - Percentage formatting
  - Calculations that use rental yield

**Fix:**
```typescript
derived.financial.rentalYieldEst = {
  value: parseFloat(yieldPct.toFixed(2)),  // ✅ Returns NUMBER 6.42
  confidence: 'High',
  // ...
};
```

**Why this sometimes works:**
- JavaScript type coercion sometimes converts strings to numbers
- But fails in strict comparisons, TypeScript, and chart libraries

---

## 🐛 **BUG #2: PropertyCard Data Not Populated**

**Root Cause:** PropertyCard is created BEFORE API enrichment completes (already documented in PROPERTY_CARD_DATA_POPULATION_ANALYSIS.md)

**Evidence:**
- Property 1 (8613 Herons Cove Pl): price=$0, beds=0, sqft=0
- Property 3 (2901 N 21st St): price=$0, beds=0, sqft=0

**Problem Flow:**
```
1. User adds property via CSV/PDF
2. PropertyCard created immediately with initial data (often zeros)
3. PropertyCard saved to store
4. API enrichment runs (30-300 seconds) ← Too late!
5. Full Property object updated
6. PropertyCard is NEVER UPDATED ❌
```

**File:** `src/pages/AddProperty.tsx` (line ~1442)
```typescript
addProperties(propertyCards, fullProperties); // Cards frozen here with initial data
// API enrichment happens AFTER - only updates fullProperty, NOT propertyCard!
```

**Fix Required:**
Need to implement `refreshPropertyCard()` function that updates PropertyCard after enrichment completes.

**Workaround for now:**
User can manually edit properties to populate missing data.

---

## 🐛 **BUG #3: Sqft Showing 1,692,157 Instead of 1,692**

**Property:** 4450 GULF BLVD, #113 ST PETE BEACH, FL 33706

**Problem:**
- Displaying: 1,692,157 sqft
- Should be: 1,692 sqft

**Possible Causes:**
1. **Data corruption** - sqft stored as 1692157 instead of 1692
2. **Field mapping error** - wrong field being mapped to sqft
3. **Calculation error** - sqft * something = huge number
4. **Display bug** - toLocaleString() adding extra digits

**Investigation Needed:**
- Check raw data in property object: `property.sqft`
- Check if it's PropertyCard.sqft or fullProperty.details.livingSqft
- Verify field #21 (living_sqft) mapping

**Files to check:**
- `src/components/property/PropertyCard.tsx:145` - Display
- `src/pages/Compare.tsx:95` - cardProp.sqft assignment
- `src/lib/field-normalizer.ts` - Field #21 mapping

---

## 🐛 **BUG #4: Fluorescent Green Hue on Click**

**File:** `src/pages/PropertyDetail.tsx`
**Lines:** 203-204

**Current Code:**
```typescript
} else if (confidence === 'High' && !hasConflict) {
  // 🟢 GREEN: Good data (high confidence, no conflicts)
  bgColor = 'bg-green-500/5';
  borderColor = 'border-green-500/20';
}
```

**Problem:**
- High-confidence fields get green background
- User finds this "fluorescent" and distracting
- Appears when clicking/viewing field sections

**Fix:**
Remove or reduce green highlighting for high-confidence fields

**Options:**
1. **Remove entirely:** Use default bg/border for all fields
2. **Make subtle:** Change to gray/cyan instead of green
3. **Only show conflicts:** Only highlight yellow/red for problems

**User preference:** "illuminate those fluorescent hue of green when clicked" = REMOVE IT

**Recommended Fix:**
```typescript
} else if (confidence === 'High' && !hasConflict) {
  // ✅ No special highlighting for high-confidence fields
  bgColor = 'bg-quantum-dark/20';  // Subtle dark background
  borderColor = 'border-gray-700/30';  // Subtle border
}
```

---

## 📋 **FIX PRIORITY:**

1. ✅ **HIGH PRIORITY:** Fix rental yield toFixed() bug (easy, critical)
2. ✅ **HIGH PRIORITY:** Remove green fluorescent hue (easy, user request)
3. ⚠️ **MEDIUM PRIORITY:** Investigate sqft 1,692,157 bug (needs diagnosis)
4. ⚠️ **LOW PRIORITY:** PropertyCard population (complex, requires architecture change)

---

## 🔧 **IMPLEMENTATION PLAN:**

### **Fix #1: Rental Yield (toFixed bug)**
```typescript
// File: src/lib/field-calculations.ts:84
// BEFORE:
value: yieldPct.toFixed(2),

// AFTER:
value: parseFloat(yieldPct.toFixed(2)),
```

### **Fix #2: Remove Green Hue**
```typescript
// File: src/pages/PropertyDetail.tsx:203-204
// BEFORE:
bgColor = 'bg-green-500/5';
borderColor = 'border-green-500/20';

// AFTER:
bgColor = 'bg-quantum-dark/10';
borderColor = 'border-gray-700/20';
```

### **Fix #3: Investigate Sqft Bug**
1. Add console.log to PropertyCard to show raw sqft value
2. Check property object in browser DevTools
3. Identify if it's data corruption or display bug
4. Apply targeted fix

### **Fix #4: PropertyCard Population** (Future work)
1. Create `refreshPropertyCard()` function
2. Call after API enrichment completes
3. Update PropertyCard in store
4. Trigger re-render of property lists

---

## ✅ **TESTING CHECKLIST:**

After fixes:
- [ ] Rental yield displays correctly as number (not string)
- [ ] Rental yield calculations work in all cases
- [ ] Green hue removed from high-confidence fields
- [ ] Sqft displays correct value (1,692 not 1,692,157)
- [ ] PropertyCard shows correct price, beds, sqft after enrichment

---

## 📊 **FILES TO MODIFY:**

| File | Line | Change | Priority |
|------|------|--------|----------|
| `src/lib/field-calculations.ts` | 84 | Add `parseFloat()` to rental yield | HIGH |
| `src/lib/field-calculations.ts` | 107 | Add `parseFloat()` to cap rate (same bug) | HIGH |
| `src/pages/PropertyDetail.tsx` | 203-204 | Remove green bg/border | HIGH |
| PropertyCard/Compare (TBD) | TBD | Fix sqft display bug | MEDIUM |
| `src/pages/AddProperty.tsx` | ~1442 | Add refreshPropertyCard() | LOW |

