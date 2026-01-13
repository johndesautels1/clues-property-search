# BatchData API Integration Discussion

**Created:** 2026-01-13
**Status:** PENDING DISCUSSION
**Purpose:** Evaluate BatchData as additional data source for CLUES Property Dashboard

---

## BATCHDATA OVERVIEW

- **Website:** https://batchdata.io
- **Developer Docs:** https://developer.batchdata.com/docs/batchdata/welcome-to-batchdata
- **Coverage:** 155+ million US properties, 700-800+ attributes per property

---

## WHAT BATCHDATA PROVIDES

### Core Data Categories:
| Category | Fields Available |
|----------|------------------|
| Property Basics | Bedrooms, Bathrooms, SqFt, Year Built, Stories, Lot Size |
| Tax Data | Assessed Value, Tax Amount, Tax Year |
| Sales History | Last Sale Date, Last Sale Price, Full Transaction History |
| Ownership | Owner Names, Mailing Address, Owner Occupied Y/N |
| Building Details | Building Type, Roof Type, Pool, Garage, Foundation |
| Legal | APN/Parcel ID, Legal Description, Zoning |
| Mortgage/Liens | Mortgage Amount, Lender, Lien Data |
| Pre-Foreclosure | Foreclosure Status, NOD, Auction Info |
| AVMs | Property Valuations (their own, not Zillow/Redfin) |

---

## FIELDS BATCHDATA CAN HELP WITH

### HIGH-VALUE MATCHES (Fields We Struggle With):

| Field # | Field Name | Current Issue | BatchData Solution |
|---------|------------|---------------|-------------------|
| 13 | Last Sale Date | Only FL counties | Nationwide coverage |
| 14 | Last Sale Price | Only FL counties | Nationwide coverage |
| 35 | Annual Taxes | Tax collector scraping | Direct from assessor records |
| 36 | Tax Year | Often missing | Included in tax data |
| 37 | Property Tax Rate | Calculated/scraped | May need calculation |
| 40 | Roof Age (Est) | Permits only | Roof type available, not age |
| 42 | Foundation | Limited extraction | Building characteristics |
| 150 | Legal Description | FL counties only | Nationwide |
| 151 | Homestead Y/N | FL counties only | Owner occupied flag |

### PARTIAL MATCHES:

| Field # | Field Name | BatchData Has | Gap |
|---------|------------|---------------|-----|
| 16a-16f | AVMs | Their own AVM | Not Zestimate/Redfin |
| 60-62 | Permit History | Limited | Permits NOT their specialty |
| 152-153 | CDD | No | Florida-specific, keep county scraper |

### BATCHDATA CANNOT HELP WITH:

| Field # | Field Name | Why Not |
|---------|------------|---------|
| 78-82 | Walkability/Noise/Traffic | Not location scores |
| 88-90 | Crime Data | Not crime APIs |
| 91-98 | Market Stats (DOM, Median) | Not market analytics |
| 104-116 | Utilities | Not utility providers |
| 117-130 | Environment/Flood/Risk | Not risk assessment |
| 134-135 | Smart Home/Accessibility | Not MLS remarks parsing |
| 169-181 | Market Performance | Not market data |

---

## RECOMMENDED INTEGRATION TIER

### Tier 1.5: BatchData (After Bridge MLS, Before Free APIs)

**Proposed Arbitration Pipeline:**
```
Tier 0: Bridge MLS (Stellar) - Primary
Tier 1.5: BatchData - Sales/Tax/Legal backup  <-- NEW
Tier 1: Free APIs (22 APIs)
Tier 2: Florida Counties (27 fields)
Tier 3: Tavily Web Search (14 functions)
Tier 4: LLMs (Gemini/GPT)
```

**Best Use Cases:**
1. Non-MLS Properties - Off-market, FSBO, pre-foreclosure
2. Tax Data Backup - When county scrapers fail
3. Nationwide Coverage - Properties outside Florida
4. Owner Data - If you ever need owner contact info
5. Transaction History - Complete sales chain

---

## FIELDS TO ROUTE THROUGH BATCHDATA

```
Priority Fields (BatchData excels at):
├── 13_last_sale_date      → Fallback when Bridge/FL-Counties miss
├── 14_last_sale_price     → Fallback when Bridge/FL-Counties miss
├── 35_annual_taxes        → Fallback when Tax Collector fails
├── 36_tax_year            → Often missing from Bridge
├── 42_foundation          → Backup to FL-Counties
├── 150_legal_description  → Nationwide expansion
└── 151_homestead_yn       → Via "owner_occupied" flag
```

---

## COST-BENEFIT ANALYSIS

| Factor | Assessment |
|--------|------------|
| Coverage Overlap | ~60% overlap with Bridge MLS + FL-Counties |
| Unique Value | Transaction history, mortgage data, owner info |
| Best For | Off-market properties, nationwide expansion |
| Cost | Per-record pricing (check their tiers) |
| API Style | REST with JSON, async endpoints available |

---

## UNIQUE VALUE PROPOSITIONS

### What BatchData Has That We Don't:
1. **Mortgage Data** - Current mortgage amount, lender, rate
2. **Pre-Foreclosure** - NOD, auction dates, foreclosure status
3. **Owner Contact** - Phone, email, mailing address (skip tracing)
4. **Transaction Chain** - Full ownership history, not just last sale
5. **Nationwide Tax** - Tax data outside Florida

### Future Feature Ideas (if using BatchData):
- Pre-foreclosure alerts for investors
- Equity estimation (value - mortgage)
- Absentee owner identification
- Distressed property detection

---

## QUESTIONS TO RESOLVE

1. **Pricing** - What tier/plan makes sense for our volume?
2. **Rate Limits** - How many requests per second/day?
3. **Data Freshness** - How often is their data updated?
4. **Florida Coverage** - Is their FL data better than our county scrapers?
5. **Integration Priority** - Before or after Free APIs?

---

## NEXT STEPS

1. [ ] Get BatchData API key and test sandbox
2. [ ] Compare their FL data to our county scrapers
3. [ ] Test fields 13, 14, 35, 150 accuracy
4. [ ] Design integration architecture
5. [ ] Create field mapping: BatchData → CLUES schema
6. [ ] Implement as Tier 1.5 in arbitration pipeline

---

## SOURCES

- BatchData Developer Documentation: https://developer.batchdata.com/docs/batchdata/welcome-to-batchdata
- BatchData Property Search API: https://developer.batchdata.com/docs/batchdata/batchdata-v1/operations/create-a-property-search
- BatchData API Solutions: https://batchdata.io/api-solutions
- BatchData Property Enrichment: https://batchdata.io/property-enrichment

---

**RESUME THIS DISCUSSION:** Read this file to continue BatchData integration planning.
