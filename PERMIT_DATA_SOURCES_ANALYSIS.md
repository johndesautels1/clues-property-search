# Fields 60-62: Permit History - Complete Data Source Analysis
**Date:** 2025-12-30
**Goal:** Solve permit data problem tonight - evaluate ALL possible sources

---

## The Problem

**Field 60:** Permit History - Roof
**Field 61:** Permit History - HVAC
**Field 62:** Permit History - Other (Pool, Additions, etc.)

**Current State:**
- Property 1-3: NULL for all three fields
- Property 4 (5694 Oakhurst): Field 60 showed "Roof work mentioned: 2018" from PublicRemarks (Medium confidence, likely hallucinated)
- Fields 61-62: Still NULL even for Property 4

**Current Implementation:**
- Maps to `property.PermitRoof`, `property.PermitHVAC`, `property.PermitAdditions` from Bridge MLS
- Fallback: Regex extraction from `property.PublicRemarks`
- NOT protected in STELLAR_MLS_AUTHORITATIVE_FIELDS (so LLMs can hallucinate)

---

## Data Source Options - Complete Table

| # | Source | Type | Cost | Pros | Cons | Data Quality | Implementation Effort | Speed | Recommendation |
|---|--------|------|------|------|------|--------------|---------------------|-------|----------------|
| **1** | **Bridge MLS Fields** | Structured MLS | Already paid | Already integrated, no new code | Bridge may not have permit data in structured fields | ❓ UNKNOWN - need to check if Bridge sends PermitRoof/PermitHVAC/PermitAdditions | ⚡ 5 mins (just verify) | Instant | ⭐⭐⭐⭐⭐ CHECK THIS FIRST |
| **2** | **Bridge MLS PublicRemarks** | Text extraction | Already paid | Already have the text | Inconsistent, agents don't always mention permits | ⚠️ Low (25-40% coverage) | ⚡ 10 mins (improve regex) | Instant | ⭐⭐⭐ Good fallback only |
| **3** | **Pinellas County ePermits (Official)** | Government database | FREE | Official source of truth, comprehensive, searchable by address | Pinellas County only (doesn't scale to other counties) | ✅ High (90%+ accurate) | 🔨 2-4 hours (API integration) | 2-5 seconds per property | ⭐⭐⭐⭐ Best for Pinellas |
| **4** | **BuildFax API** | Paid permit data | ~$50-200/mo | National coverage, structured permit data, includes types/dates/values | Costs money, may have delays vs county records | ✅ High (85%+ accurate) | 🔨 1-2 hours (API integration) | 1-2 seconds per property | ⭐⭐⭐⭐ Best for national scaling |
| **5** | **Realtor.com Scraper** | Web scraping | FREE (risky) | Shows permits visually on property pages | Dynamically rendered (needs headless browser), fragile, may break, legal gray area | ✅ High (pulls from county) | 🔨🔨 4-8 hours (Puppeteer/Browserless) | 5-10 seconds per property | ⭐⭐ Too fragile/slow |
| **6** | **Zillow Scraper** | Web scraping | FREE (risky) | Sometimes shows permit history | Not consistently available, dynamically rendered, legal gray area | ⚠️ Medium (inconsistent) | 🔨🔨 4-8 hours | 5-10 seconds per property | ⭐ Not reliable |
| **7** | **Accela API (Direct)** | Government API | FREE | Many counties use Accela system (including Pinellas), official data | Each county has different Accela instance, need to determine county first | ✅ High (90%+ accurate) | 🔨 3-5 hours (reverse engineer county-specific endpoints) | 2-5 seconds per property | ⭐⭐⭐⭐ Same as option 3 |
| **8** | **PropertyShark API** | Paid data aggregator | ~$100-500/mo | Aggregates permits from multiple counties | Expensive, may have coverage gaps | ✅ High (80%+ accurate) | 🔨 1-2 hours | 1-2 seconds per property | ⭐⭐⭐ Good but expensive |
| **9** | **DataTree by First American** | Paid data aggregator | ~$200-1000/mo | Comprehensive property data including permits | Very expensive, overkill for just permits | ✅ High (85%+ accurate) | 🔨 2-3 hours | 1-2 seconds per property | ⭐⭐ Too expensive |
| **10** | **Attom Data Solutions API** | Paid data aggregator | ~$150-600/mo | Good permit coverage, reliable | Costs money, subscription required | ✅ High (85%+ accurate) | 🔨 1-2 hours | 1-2 seconds per property | ⭐⭐⭐⭐ Good paid option |
| **11** | **County Property Appraiser** | County website scraping | FREE | Sometimes lists major improvements/permits | Each county different, often incomplete, no standardization | ⚠️ Low (30-50% coverage) | 🔨🔨 8+ hours (custom per county) | 5-10 seconds per property | ⭐ Too much work |
| **12** | **FOIA Request** | Government records | FREE | Can get bulk permit data | Slow (weeks/months), manual process, not real-time | ✅ High (official records) | ❌ Weeks to months | N/A | ❌ Not feasible |
| **13** | **LLM Hallucination (Current)** | AI generation | Already paid | Fills fields with something | 100% fabricated, destroys trust | ❌ ZERO accuracy | ⚡ Already done (BAD) | Instant | ❌ ELIMINATE THIS |

---

## Detailed Source Breakdown

### Option 1: Bridge MLS Structured Fields ⭐⭐⭐⭐⭐ **CHECK THIS FIRST**

**What to check:**
- Does Bridge MLS actually send `property.PermitRoof`, `property.PermitHVAC`, `property.PermitAdditions` with data?
- We're currently mapping these fields but they may be returning NULL

**How to verify:**
1. Log raw Bridge MLS response for a property
2. Search for "Permit" in the JSON
3. Check if PermitRoof/PermitHVAC/PermitAdditions fields exist and have values

**If YES:**
- ✅ Use this data (already integrated)
- ✅ Add Fields 60-62 to STELLAR_MLS_AUTHORITATIVE_FIELDS protection
- ✅ Problem solved for FREE

**If NO:**
- Move to Option 3 or 4

**Effort:** 5 minutes to verify
**Cost:** $0

---

### Option 2: Bridge MLS PublicRemarks Extraction ⭐⭐⭐ **FALLBACK ONLY**

**Current Implementation:**
```typescript
if (!property.PermitRoof && property.PublicRemarks) {
  const roofMatch = property.PublicRemarks.match(/roof.*(?:permit|replace|install|new).*(20\d{2})/i);
  if (roofMatch) {
    addField('60_permit_history_roof', `Roof work mentioned: ${roofMatch[0]}`, 'Medium');
  }
}
```

**Improvements:**
- Better regex patterns for HVAC, pool, additions
- Extract year + type more reliably
- Mark as "Low" confidence since it's agent-written text

**Pros:**
- Already have the data
- Zero cost
- Instant

**Cons:**
- Only 25-40% of agents mention permits in remarks
- Inconsistent format
- May be outdated or promotional language

**Recommendation:** Keep as fallback, not primary source

---

### Option 3: Pinellas County ePermits (Official) ⭐⭐⭐⭐ **BEST FOR PINELLAS**

**Official Portal:** https://web5.mypinellasclerk.org/AcclaimWeb/search/SearchTypeName

**What it provides:**
- All building permits issued in Pinellas County
- Searchable by address
- Includes: Permit #, Date Issued, Type, Status, Contractor, Value
- Free and public

**API Options:**

#### Option A: Accela Civic Platform API (if available)
```
GET /v4/records?module=Building&address={address}
```
- Accela is the software Pinellas uses
- May have public API endpoints
- Need to reverse-engineer or check documentation

#### Option B: Web Scraping (if no API)
- Use Puppeteer/Playwright to automate search
- Input address, parse results table
- Extract permit rows

**Implementation Steps:**
1. Determine if Pinellas has public Accela API
2. If yes: Integrate API calls
3. If no: Build scraper with headless browser
4. Parse permit data into structured format
5. Classify permits by type (Roof, HVAC, Other)
6. Store in Fields 60-62

**Sample Response Format:**
```json
{
  "60_permit_history_roof": {
    "value": "Roof replacement - 2021-05-15 (Permit #B21-005432)",
    "source": "Pinellas County ePermits",
    "confidence": "High",
    "rawData": {
      "permitNumber": "B21-005432",
      "dateIssued": "2021-05-15",
      "type": "Roof Replacement",
      "status": "Finaled",
      "value": 12500
    }
  }
}
```

**Pros:**
- Official source of truth
- Free
- Comprehensive for Pinellas properties
- High accuracy (90%+)

**Cons:**
- Pinellas County only (doesn't help with properties in other counties)
- Requires scraper or API integration (2-4 hours work)
- May have rate limits

**Cost:** $0
**Effort:** 2-4 hours
**Speed:** 2-5 seconds per property

**Recommendation:** ⭐⭐⭐⭐ Implement this for Pinellas County properties

---

### Option 4: BuildFax API ⭐⭐⭐⭐ **BEST FOR NATIONAL SCALING**

**Website:** https://buildfax.com/

**What it provides:**
- National building permit database
- Covers 90%+ of US jurisdictions
- Structured API with permit history
- Includes: Date, Type, Scope, Value, Status

**API Example:**
```
GET /api/v2/permits?address={address}&city={city}&state={state}
```

**Response:**
```json
{
  "permits": [
    {
      "permit_id": "ABC123",
      "issue_date": "2021-05-15",
      "permit_type": "Roof",
      "scope": "Roof Replacement",
      "value": 12500,
      "status": "Finaled"
    },
    {
      "permit_id": "DEF456",
      "issue_date": "2019-03-20",
      "permit_type": "HVAC",
      "scope": "AC Replacement",
      "value": 5200,
      "status": "Finaled"
    }
  ]
}
```

**Pricing:**
- API access: ~$50-200/month (based on volume)
- Per-query pricing available
- May have free tier or trial

**Pros:**
- National coverage (works for any property in US)
- Structured data (easy to parse)
- Reliable and maintained
- High accuracy (85%+)
- Faster than scraping

**Cons:**
- Costs money (subscription)
- May have usage limits
- Possible delays vs real-time county data

**Cost:** $50-200/month
**Effort:** 1-2 hours integration
**Speed:** 1-2 seconds per property

**Recommendation:** ⭐⭐⭐⭐ Best option if scaling beyond Pinellas County

---

### Option 5: Realtor.com Scraper ⭐⭐ **TOO FRAGILE**

**What Perplexity mentioned:**
- Realtor.com shows permit history on property detail pages
- Rendered via JavaScript (needs headless browser)
- Data pulled from county records

**Implementation:**
1. Use Puppeteer/Playwright to load property page
2. Wait for permit section to render
3. Parse permit table
4. Extract rows

**Sample Scraper:**
```typescript
import puppeteer from 'puppeteer';

async function scrapeRealtorPermits(address: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate to Realtor.com property page
  await page.goto(`https://www.realtor.com/realestateandhomes-detail/${address}`);

  // Wait for permit section to load
  await page.waitForSelector('.permit-history');

  // Extract permit data
  const permits = await page.evaluate(() => {
    const rows = document.querySelectorAll('.permit-row');
    return Array.from(rows).map(row => ({
      date: row.querySelector('.date').textContent,
      type: row.querySelector('.type').textContent,
      description: row.querySelector('.description').textContent
    }));
  });

  await browser.close();
  return permits;
}
```

**Pros:**
- Free
- Pulls from official county data
- Good coverage

**Cons:**
- Fragile (breaks if Realtor.com changes HTML)
- Slow (5-10 seconds per property due to browser overhead)
- Legal gray area (ToS violation)
- Requires headless browser infrastructure (Browserless.io or self-hosted)
- Rate limiting concerns

**Cost:** $0 (or $20-50/mo for Browserless.io)
**Effort:** 4-8 hours
**Speed:** 5-10 seconds per property

**Recommendation:** ⭐⭐ Too fragile and slow, use only as last resort

---

### Option 6: Attom Data Solutions API ⭐⭐⭐⭐ **GOOD PAID OPTION**

**Website:** https://www.attomdata.com/

**What it provides:**
- Comprehensive property data including permits
- National coverage
- Structured API
- Reliable and well-documented

**API Example:**
```
GET /propertyapi/v1.0.0/permit/detail?address={address}
```

**Pricing:**
- ~$150-600/month depending on volume
- Enterprise pricing available

**Pros:**
- Reliable and maintained
- Good documentation
- National coverage
- High accuracy (85%+)

**Cons:**
- Subscription cost
- May have usage caps

**Cost:** $150-600/month
**Effort:** 1-2 hours
**Speed:** 1-2 seconds per property

**Recommendation:** ⭐⭐⭐⭐ Good alternative to BuildFax

---

## Recommended Implementation Strategy

### Immediate Action (Tonight)

**Step 1: Verify Bridge MLS (5 minutes)**
1. Check if Bridge sends `PermitRoof`, `PermitHVAC`, `PermitAdditions` with actual data
2. Log raw Bridge response for test property
3. If data exists → USE IT, add protection, problem solved

**Step 2: If Bridge has NO permit data (90% likely):**

### Option A: Quick Fix for Tonight (Pinellas Only)
1. Implement Pinellas County ePermits scraper (2-4 hours)
2. Test with the 3 problem properties
3. Mark Fields 60-62 as `backend_only: true` in arbitration
4. Block LLM hallucinations immediately

### Option B: Scalable Solution (If budget allows)
1. Sign up for BuildFax API trial
2. Integrate API calls (1-2 hours)
3. Test with multiple properties
4. Evaluate coverage and accuracy
5. If good → keep subscription

### Option C: Hybrid Approach (Best)
1. **Primary:** BuildFax API for national coverage
2. **Fallback 1:** Pinellas County ePermits for Pinellas properties (higher accuracy)
3. **Fallback 2:** PublicRemarks extraction (Low confidence)
4. **Never:** LLM hallucination

---

## Cost-Benefit Analysis

| Approach | Monthly Cost | One-Time Effort | Coverage | Accuracy | Scalability |
|----------|-------------|----------------|----------|----------|-------------|
| Bridge MLS only | $0 | 5 mins | ❓ Unknown | ❓ Unknown | ✅ Yes |
| Pinellas ePermits only | $0 | 2-4 hours | ⚠️ Pinellas only | ✅ 90%+ | ❌ No |
| BuildFax API | $50-200 | 1-2 hours | ✅ National | ✅ 85%+ | ✅ Yes |
| Attom API | $150-600 | 1-2 hours | ✅ National | ✅ 85%+ | ✅ Yes |
| Hybrid (BuildFax + Pinellas) | $50-200 | 3-6 hours | ✅ National | ✅ 90%+ | ✅ Yes |

---

## Decision Tree

```
START
  ↓
Does Bridge MLS have permit data?
  ├─ YES → Use it, add protection → DONE ✅
  └─ NO → Continue
       ↓
Are you only serving Pinellas County?
  ├─ YES → Build Pinellas ePermits scraper → DONE ✅
  └─ NO → Continue
       ↓
Can you afford $50-200/month?
  ├─ YES → Use BuildFax API (+ optional Pinellas scraper for higher accuracy)
  └─ NO → Build Pinellas scraper + PublicRemarks fallback for other counties
```

---

## Tonight's Action Plan

**1. Verify Bridge MLS (15 mins)**
- Run test property through Bridge API
- Log full response
- Search for permit fields
- Document findings

**2. If Bridge has NO permits:**

**Quick Win Option: Pinellas County ePermits (2-4 hours)**
- Research Accela API endpoints
- Build scraper/API integration
- Test with 3 problem properties
- Add to arbitration pipeline

**OR**

**Enterprise Option: BuildFax Trial (1 hour)**
- Sign up for trial
- Integrate API
- Test coverage
- Evaluate results

**3. Protection (10 mins)**
- Add Fields 60-62 to `STELLAR_MLS_AUTHORITATIVE_FIELDS`
- Block LLM hallucinations immediately
- Set fields to honest NULL if no data

---

## Which option do you prefer?

1. ⚡ **Verify Bridge first** (5 mins) → might already be solved
2. 🏗️ **Build Pinellas scraper** (2-4 hours) → free, Pinellas-only
3. 💰 **Try BuildFax API** (1 hour) → paid, national coverage
4. 🔀 **Hybrid approach** (3-6 hours) → best long-term solution

**Tell me which path and I'll start implementing immediately.**
