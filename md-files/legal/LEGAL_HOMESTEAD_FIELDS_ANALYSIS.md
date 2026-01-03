# Legal & Homestead Fields Analysis (Fields 151-153)
**Date:** 2025-12-31
**Purpose:** Investigate why Fields 151-153 are NULL and determine best data sources

---

## Current Status: ✅ ALREADY MAPPED IN BRIDGE MLS

### Fields in Question:

| Field | Name | Bridge MLS Field | Current Status |
|-------|------|------------------|----------------|
| **151** | Homestead Exemption Y/N | `property.HomesteadYN` | NULL |
| **152** | CDD Y/N | `property.CDDYN` | NULL |
| **153** | Annual CDD Fee | `property.CDDAnnualFee` | NULL |
| **154** | Front Exposure | `property.DirectionFaces` | ✅ "West" (Working!) |

### Mapping Confirmed:

**File:** `src/lib/bridge-field-mapper.ts:586-589`

```typescript
addField('151_homestead_yn', property.HomesteadYN);
addField('152_cdd_yn', property.CDDYN);
addField('153_annual_cdd_fee', property.CDDAnnualFee);
addField('154_front_exposure', property.DirectionFaces);
```

**Protection:** All 4 fields are in `STELLAR_MLS_AUTHORITATIVE_FIELDS` (Tier 1 priority)

---

## Analysis: Why Are They NULL?

### Field 154 Works, Fields 151-153 Don't

**This tells us:**
- ✅ Bridge MLS mapper IS working (Field 154 populated with "West")
- ❌ Bridge MLS is NOT returning HomesteadYN, CDDYN, CDDAnnualFee
- **OR** these values genuinely don't exist in the MLS listing

### Two Possibilities:

**1. Bridge API doesn't expose these fields**
   - Stellar MLS may not include homestead/CDD data
   - These are typically county tax assessor fields, not MLS fields
   - Bridge may not have access to this data

**2. MLS listing doesn't have this data**
   - Listing agent didn't enter homestead status
   - Property isn't in a CDD (so legitimately NULL for 152-153)
   - Data exists but not in Bridge's response

---

## Recommended Solutions (3 Options)

### OPTION 1: Check Vercel Logs (5 mins) ⚡ DO THIS FIRST

**Action:** Review actual Bridge MLS API response for Property 3

**What to look for:**
```json
{
  "rawData": {
    "HomesteadYN": "Yes" or null,
    "CDDYN": "No" or null,
    "CDDAnnualFee": 500 or null,
    "DirectionFaces": "West" ← THIS ONE WORKS
  }
}
```

**Decision tree:**
- If fields exist but NULL → They're correctly mapped (property doesn't have data)
- If fields exist with values → Debug why mapper isn't extracting them
- If fields don't exist in response → Need alternative data source (Option 2 or 3)

---

### OPTION 2: Add Pinellas County Property Appraiser Scraper (2-4 hours) 🔨

**Best for:** Field 151 (Homestead Exemption)

**Data Source:** https://www.pcpao.gov/

**How it works:**
1. Search by property address
2. Parse property detail page
3. Look for "Exemptions" section
4. Extract: Homestead ($50,000), Additional Homestead, Senior, Disability, etc.
5. Return Y/N for Field 151

**Pros:**
- Authoritative source (county tax assessor)
- Always up-to-date
- Free public data

**Cons:**
- Requires web scraping (fragile if site changes)
- OR paid API if Pinellas County offers one
- Specific to Pinellas County (need to add other counties later)

**Implementation:**
```typescript
// api/property/county-scrapers/pinellas-property-appraiser.ts
export async function scrapePinellasPropertyAppraiser(address: string): Promise<ApiResult> {
  // 1. Search for property: https://www.pcpao.gov/search?address={address}
  // 2. Parse search results to get parcel ID
  // 3. Fetch property details: https://www.pcpao.gov/property/{parcelID}
  // 4. Extract exemptions section
  // 5. Return:
  //    - '151_homestead_yn': Has homestead exemption? (Yes/No)
  //    - Additional context: exemption amount, type, etc.
}
```

---

### OPTION 3: Extract from Property Tax Bill Parser (4-6 hours) 🔨🔨

**Best for:** All 3 fields (151, 152, 153)

**Data Source:** Property tax bill PDF or county tax collector website

**How it works:**
1. Fetch tax bill from Pinellas County Tax Collector
2. Parse PDF or HTML for:
   - Exemptions section → Field 151
   - Non-ad valorem assessments → Fields 152, 153
3. CDD fee usually listed as separate line item

**Pros:**
- Gets all 3 fields in one call
- Authoritative source
- Shows actual dollar amounts for CDD

**Cons:**
- Requires PDF parsing or HTML scraping
- Tax bills may not be available mid-year
- County-specific (need multiple scrapers)

**Implementation:**
```typescript
// api/property/county-scrapers/pinellas-tax-collector.ts
export async function scrapePinellasTaxBill(address: string, parcelID: string): Promise<ApiResult> {
  // 1. Fetch tax bill: https://www.taxcollector.com/pinellas
  // 2. Parse exemptions: Homestead Y/N → Field 151
  // 3. Parse non-ad valorem assessments:
  //    - Look for "CDD" or "Community Development District"
  //    - Extract annual fee → Fields 152, 153
}
```

---

### OPTION 4: LLM Web Search Fallback (Quick but unreliable) ⚡

**Best for:** Temporary solution while building scrapers

**How it works:**
1. Perplexity already has web search
2. Add specific search patterns:
   - "16326 Gulf Blvd homestead exemption site:pcpao.gov"
   - "16326 Gulf Blvd CDD community development district"
3. Extract from search results

**Pros:**
- No new code needed (Perplexity already integrated)
- Works across all counties

**Cons:**
- May hallucinate
- Not as reliable as scraping official source
- Perplexity may not find correct property

**Implementation:**
```typescript
// Add to Perplexity prompt (search.ts:2100-2150)
"151_homestead_yn: Search '{address} homestead exemption site:pcpao.gov' -
 Return Yes if property has homestead exemption, No otherwise"

"152_cdd_yn: Search '{address} CDD community development district' -
 Return Yes if property is in a CDD, No otherwise"

"153_annual_cdd_fee: Search '{address} CDD annual fee tax bill' -
 Return dollar amount if found"
```

**⚠️ PROBLEM:** These fields are in `STELLAR_MLS_AUTHORITATIVE_FIELDS`, so LLMs are BLOCKED from populating them!

Would need to REMOVE from protection to use this option (not recommended).

---

## My Recommendations

### Immediate Action (5 mins):

**✅ Option 1: Check Vercel Logs**
- Verify if Bridge MLS returns these fields at all
- Determines if we need alternative data source

---

### If Bridge MLS doesn't have data (choose one):

#### **RECOMMENDED: Option 2 - Pinellas Property Appraiser Scraper**

**Why:**
- Most reliable for Field 151 (Homestead)
- Official county source
- Can expand to other counties later

**Time estimate:** 2-3 hours

**Steps:**
1. Create `api/property/county-scrapers/pinellas-property-appraiser.ts`
2. Implement address search + property detail scraping
3. Extract homestead exemption status
4. Add to Tier 3 API pipeline
5. Set as Tier 2 (above LLMs, below Bridge MLS)

#### **Alternative: Option 3 - Tax Bill Parser**

**Why:**
- Gets all 3 fields at once
- CDD fees are on tax bills

**Time estimate:** 4-6 hours

**Challenge:**
- Need to handle PDF parsing
- OR find county tax collector API

---

### For CDD Fields (152-153):

**Observation:** Many properties aren't in CDDs!

**Check first:**
- Is Property 3 (16326 Gulf Blvd Apt 510) even in a CDD?
- Most beach condos are NOT in CDDs
- CDDs are common in new subdivisions, not established areas

**If property ISN'T in CDD:**
- Fields 152-153 should legitimately be NULL (or "No" + 0)
- No scraper needed - this is correct!

**If property IS in CDD:**
- Need tax bill scraper to get fee amount
- OR check CDD public records (harder to automate)

---

## Questions for You:

1. **Do you want me to check Vercel logs first?** (5 mins)
   - See actual Bridge MLS response
   - Determine if these fields are even available

2. **If Bridge doesn't have data, which option?**
   - Option 2: Pinellas Property Appraiser scraper (2-3 hours)
   - Option 3: Tax bill parser (4-6 hours)
   - Option 4: Leave as NULL if legitimately unavailable

3. **Is Property 3 actually in a CDD?**
   - Beach condos usually aren't
   - If not, Fields 152-153 should be NULL

---

## Next Steps

**I recommend:**

1. ✅ Check Vercel logs for Property 3 Bridge MLS response
2. ✅ Verify if HomesteadYN, CDDYN, CDDAnnualFee exist in raw data
3. ✅ If they don't exist → Build Pinellas Property Appraiser scraper
4. ✅ For CDD: Verify property is actually in CDD before building scraper

**What would you like me to do?**
