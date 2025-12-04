# Source Breakdown Fix - December 4, 2024

## Problem Statement

The `source_breakdown` object returned to the frontend was **only showing fields that won arbitration**, not the actual number of fields each source returned.

### Example of the Bug:
```
Scenario:
- Stellar MLS returns 50 fields
- Perplexity returns 30 fields
- Grok returns 25 fields
- Stellar MLS wins all 50 fields (Tier 1 beats Tier 4)

OLD (BROKEN) Behavior:
{
  "Stellar MLS": 50,
  "Perplexity": 0,
  "Grok": 0
}

NEW (FIXED) Behavior:
{
  "Stellar MLS": 50,
  "Perplexity": 30,
  "Grok": 25
}
```

## Root Cause

The source_breakdown was built from the **arbitration result** (winning fields only), not from the **actual API responses**.

**Code location:** `api/property/search.ts` lines 2963-2975 (before fix)

```typescript
// OLD CODE - Only tracked winners
for (const [_, field] of Object.entries(arbitrationResult.fields)) {
  const source = field.source || 'Unknown';
  sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
}
```

This only counted fields that **won** arbitration, not fields that were **returned** by each source.

## The Fix

**Commit:** `c3e6611` - "FIX: Show ACTUAL field counts from all sources in source_breakdown"

### Changes Made:

#### 1. Added `actualFieldCounts` tracking object
**File:** `api/property/search.ts` line 2640

```typescript
const actualFieldCounts: Record<string, number> = {}; // Track ACTUAL fields returned by each source
```

#### 2. Track Stellar MLS actual field count
**File:** `api/property/search.ts` lines 2693-2736

```typescript
// When Stellar MLS returns data successfully:
const mlsFieldCount = Object.keys(bridgeData.fields).length;
actualFieldCounts[STELLAR_MLS_SOURCE] = mlsFieldCount; // Track ACTUAL fields returned

// When Stellar MLS returns 0 fields:
actualFieldCounts[STELLAR_MLS_SOURCE] = 0;

// When Stellar MLS errors:
actualFieldCounts[STELLAR_MLS_SOURCE] = 0;
```

#### 3. Track LLM actual field counts
**File:** `api/property/search.ts` lines 2988-3005

```typescript
// Use fields_found (actual count) NOT new_unique_fields (winners only)
for (const llmResponse of llmResponses) {
  const llmSourceName = llmSourceNameMap[llmResponse.llm];
  if (llmSourceName) {
    sourceBreakdown[llmSourceName] = llmResponse.fields_found || 0;
  }
}
```

The `llmResponses` array already tracked `fields_found` (actual returned) vs `new_unique_fields` (arbitration winners).

#### 4. Override sourceBreakdown with actual counts
**File:** `api/property/search.ts` lines 2983-2987

```typescript
// CRITICAL: Override with ACTUAL field counts (not arbitration winners)
for (const [sourceName, actualCount] of Object.entries(actualFieldCounts)) {
  sourceBreakdown[sourceName] = actualCount;
}
```

## Impact

### Before Fix:
- User saw "Perplexity: 0 fields" even though Perplexity returned 30 fields
- User thought sources were failing when they were actually working
- No visibility into which sources were actually returning data

### After Fix:
- User sees ACTUAL field counts: "Perplexity: 30 fields"
- Clear visibility into which sources are working vs failing
- Can see data hierarchy in action: all sources return data, but highest tier wins

## Testing

Test with address: `15912 Gulf Blvd, Redington Beach, FL 33708`

**Expected behavior:**
1. Open browser console
2. Search for property
3. Look for `SOURCE BREAKDOWN (for progress tracker):` in console logs
4. Verify all sources show their actual field counts
5. Frontend `source_breakdown` should match backend logs

**Example output:**
```json
{
  "Stellar MLS": 48,
  "Perplexity": 32,
  "Grok": 28,
  "FBI Crime": 2,
  "Google Places": 15,
  "SchoolDigger": 8
}
```

## Files Changed

- `api/property/search.ts` - Main fix (lines 2640, 2693-2736, 2983-3005)

## Related Commits

- `c3e6611` - This fix
- `f09cf35` - Added 120s timeout for Stellar MLS
- `72a17b2` - FBI Crime source name standardization
- `1b223c6` - Track sources even when returning 0 fields

## Verification

Run this to verify the fix is deployed:
```bash
git log --oneline | grep "Show ACTUAL field counts"
```

Should show commit `c3e6611`.
