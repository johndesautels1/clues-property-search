# Tavily Field Configuration - Action Items

**Date Created:** 2026-01-10
**Status:** In Progress (8 of 55 fields improved)

---

## Overview

This document tracks improvements needed for Tavily web search field configurations based on comprehensive audit findings.

**Total Fields:** 55 Tavily-enabled fields
**Completed:** 19 fields (97, 98, 99, 100, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116)
**Remaining:** 36 fields

---

## Priority 1: Fix "Poor" Rated Fields

These fields have low expected success rates due to relying on specific listing text that may not exist.

### Field 131: View Type
- **Current Rating:** Poor
- **Issue:** Tries to scrape "ocean view", "mountain view" from listing text - very fragile
- **Suggested Fix:** Add fallback query `"listing description {address}"` to let LLM extract from general description
- **Expected Success Rate:** Currently low
- **Priority:** HIGH

### Field 134: Smart Home Features
- **Current Rating:** Poor (0.25 expected success)
- **Issue:** LISTING-DEPENDENT - searches for "Nest thermostat", "smart locks" in listings
- **Suggested Fix:**
  - Add fallback to general listing description search
  - Add common smart home brand queries: "Nest", "Ring", "Ecobee", "August"
- **Priority:** HIGH

### Field 135: Accessibility Modifications
- **Current Rating:** Poor (0.30 expected success)
- **Issue:** LISTING-DEPENDENT - searches for "wheelchair ramp", "grab bars"
- **Suggested Fix:**
  - Add fallback to general listing description
  - Add ADA compliance queries
  - Search for "accessible home" listings
- **Priority:** HIGH

### Field 138: Special Assessments
- **Current Rating:** Poor
- **Issue:** "Not publicly disclosed" - data rarely available online
- **Suggested Fix:**
  - Consider if Tavily should even try this field
  - May need to rely purely on county records or HOA documents
  - Consider marking as `calculationOnly: true` or removing from Tavily
- **Priority:** MEDIUM (may not be fixable via web search)

---

## Priority 2: Upgrade "Average" Rated Fields

These fields work but could be improved with better sources or extraction patterns.

### Field 115: Cell Coverage Quality ✅ COMPLETED
- **Old Rating:** Average
- **New Rating:** Good/Excellent
- **Changes Made:**
  - Added RootMetrics professional testing data
  - Added carrier-specific coverage maps (Verizon, AT&T)
  - Added cell tower location searches
  - Added quantitative extraction: Mbps, %, bars, tower count
  - Upgraded expected success rate: 75% → 85%
- **Status:** ✅ Committed (2026-01-10)

### Field 114: Cable TV Provider
- **Current Rating:** Average
- **Issue:** Market declining (streaming), low yield expected
- **Suggested Fix:**
  - Add streaming service availability queries
  - Add "cord-cutting" market data
  - Consider renaming to "TV Service Options" to include streaming
- **Priority:** LOW (market declining)

### Field 132: Lot Features
- **Current Rating:** Average
- **Issue:** LISTING-DEPENDENT - regex for "cul-de-sac", "corner lot"
- **Suggested Fix:**
  - Add county GIS/plat map searches for lot shape
  - Add street view analysis queries
  - Improve regex for common lot features
- **Priority:** MEDIUM

### Field 174: Inventory Level
- **Current Rating:** Average
- **Issue:** Regex for "active listings" count
- **Suggested Fix:**
  - Add more authoritative sources (Redfin, Realtor.com market stats)
  - Add ZIP-level inventory data
  - Improve extraction for numeric counts
- **Priority:** MEDIUM

### Field 177: Price Momentum
- **Current Rating:** Average
- **Issue:** Targets Redfin "3 month" stats
- **Suggested Fix:**
  - Add Zillow market trends
  - Add Realtor.com price trend data
  - Add year-over-year comparison queries
- **Priority:** MEDIUM

---

## Priority 3: Enhance "Good" Rated Fields

These fields work well but could be pushed to "Excellent" with additional sources.

### Field 170: Market Trend
- **Current Rating:** Good
- **Suggested Fix:**
  - Add more granular ZIP-level trend data
  - Add seasonal adjustment queries
  - Add local news sources for market sentiment
- **Priority:** LOW

### Field 171: Sale-to-List Ratio
- **Current Rating:** Good
- **Suggested Fix:**
  - Add more recent data sources (30-day vs 90-day)
  - Add neighborhood-specific ratios
- **Priority:** LOW

### Field 178: Buyer/Seller Market Indicator
- **Current Rating:** Good
- **Suggested Fix:**
  - Add months of inventory calculation
  - Add absorption rate data
- **Priority:** LOW

---

## Priority 4: Special Cases

### Field 116: Emergency Services Distance
- **Current Rating:** Poor
- **Issue:** "Difficult to scrape reliably"
- **Audit Recommendation:** Use Google Places API instead of Tavily
- **Action Required:**
  - Verify Google Places API is prioritized over Tavily for this field
  - Consider marking Tavily config as fallback-only
  - May want to set `calculationOnly: true` and rely on API
- **Priority:** HIGH (architectural decision needed)

---

## Completed Improvements

### ✅ Field 97: Insurance Estimate (Annual)
- **Date:** 2026-01-10
- **Changes:**
  - Added zip-level queries to capture local broker data
  - Added flood zone insurance queries (critical for FL coastal)
  - Added year-specific rate queries (2025, 2026)
  - Upgraded granularity: city → zip
  - Added flood zone extraction patterns
  - Increased expected success rate: 75% → 80%
- **Commit:** ab10e27

### ✅ Field 115: Cell Coverage Quality
- **Date:** 2026-01-10
- **Changes:**
  - Added RootMetrics professional testing data
  - Added carrier-specific coverage map queries (Verizon, AT&T)
  - Added cell tower location searches
  - Added quantitative extraction: Mbps, %, bars, tower count
  - Enhanced text markers for signal strength metrics
  - Increased expected success rate: 75% → 85%
- **Commit:** ab10e27

### ✅ Field 98: Rental Estimate (Monthly)
- **Date:** 2026-01-10
- **Changes:**
  - Added property-specific estimates (Zillow Rent Zestimate, Redfin)
  - Prioritized address-level data over zip/city averages
  - Added 2 new queries for recent rental data (2025-2026)
  - Enhanced regex for rent zestimate and rental estimate extraction
  - Added range extraction pattern ($X - $Y/mo)
  - Upgraded granularity: zip → address
  - Increased expected success rate: 85% → 90%
- **Commit:** eeacf1a

### ✅ Field 99: Rental Yield (Est)
- **Date:** 2026-01-10
- **Changes:**
  - **Converted to calculation-only** - No Tavily web search
  - Removed all search queries (Mashvisor, AirDNA, Numbeo)
  - Fixed AirDNA bug: was incorrectly setting occupancy to yield
  - Removed from TAVILY_ENABLED_FIELDS UI set
  - Set calculationOnly: true in config and database mapping
  - 100% success rate (calculated from Fields 10 & 98)
  - Property-specific yield vs inaccurate city averages
- **Commit:** 55910f2

### ✅ Field 100: Vacancy Rate (Neighborhood)
- **Date:** 2026-01-10
- **Changes:**
  - Prioritized current market data: Realtor.com, Redfin (2025 data)
  - Moved Census.gov to last fallback (outdated 1-5 year old data)
  - Added year-specific queries (2024, 2025)
  - Enhanced extraction patterns: rental vacancy, homeowner vacancy, housing vacancy
  - Added 4 new queries for current market trends
  - Increased expected success rate: 75% → 85%
  - Added notes explaining data freshness priorities
- **Commit:** f6c6e95

### ✅ Field 102: Financing Terms
- **Date:** 2026-01-11
- **Changes:**
  - Added property-specific rate queries (Zillow mortgage calculator, Redfin financing)
  - Added state-specific mortgage rate queries (critical for investors - rates vary 0.25-0.75% by state)
  - Added investment property rate queries (0.5-1% higher than primary residence)
  - Added state housing finance agency queries (down payment assistance programs)
  - Added year-specific queries (2025, 2026) for current rates
  - Enhanced extraction patterns: Added APR, jumbo loans, investment property rates, down payment %, points
  - Increased regex patterns: 4 → 9 patterns
  - Increased total queries: 4 → 11 queries
  - Upgraded granularity: national → address (property-specific → state → national)
  - Maintained expected success rate: 95%
  - Updated notes to emphasize investor focus and state program availability
- **UI Improvement:** Widened Field 102 display to full-width for better readability of long mortgage rate details
- **Commit:** d97c1b5

### ✅ Field 103: Comparable Sales
- **Date:** 2026-01-11
- **Changes:**
  - Added Realtor.com queries (MLS-backed official data - 2 new queries)
  - Added Homes.com queries (additional aggregator coverage)
  - Added year-specific queries (2024, 2025, 2026) for recent sales
  - Added ZIP-level fallback queries for neighborhoods
  - Enhanced extraction patterns: Added sale date, price/sqft, distance, closed price, list vs sold price
  - Increased regex patterns: 5 → 10 patterns (100% increase)
  - Increased total queries: 5 → 10 queries (100% increase)
  - Added 4 new textMarkers for better extraction context
  - Increased expected success rate: 85% → 90%
  - Updated notes to reflect MLS prioritization and ZIP-level fallbacks
- **Verified Sources Work:** Redfin (✅), Movoto (✅), Homes.com (✅), Realtor.com (✅) - all documented as accessible
- **Avoided Blocked Sources:** Did not add Zillow (blocks automation ~15-20% success)
- **Commit:** 2253ded

### ✅ Field 104: Electric Provider
- **Date:** 2026-01-11
- **Changes:**
  - Added address-level queries (2 new queries - highest priority)
  - Added ChooseEnergy utility lookup site
  - Added state-level utility map fallback
  - Enhanced extraction patterns: Added 50+ major utility company names (Duke Energy, FPL, ComEd, PG&E, etc.)
  - Increased regex patterns: 2 → 6 patterns (200% increase)
  - Increased total queries: 4 → 8 queries (100% increase)
  - Added 3 new textMarkers ('served by', 'electricity provider', 'electric utility')
  - Increased expected success rate: 95% → 97%
  - Upgraded granularity: zip → address
  - Updated notes: Address-level provides exact provider; ZIP codes may have multiple providers in deregulated markets
- **Major Utility Name Recognition:** Added comprehensive pattern matching for 50+ utility companies across all US states
- **Commit:** 09d98d0

### ✅ Field 105: Avg Electric Bill (BATCH 1 - Utilities)
- **Date:** 2026-01-11
- **Changes:**
  - Added address-specific queries (Zillow, Redfin property utility costs - 3 new queries)
  - Added ZIP-level year-specific queries (2025, 2026 - 3 new queries)
  - Added state-level seasonal queries (summer AC costs - 2 new queries)
  - Added EIA.gov (U.S. Energy Information Administration - authoritative source)
  - Enhanced extraction patterns: Added kWh, summer, winter, seasonal variation patterns
  - Increased regex patterns: 2 → 6 patterns (200% increase)
  - Increased total queries: 4 → 9 queries (125% increase)
  - Added 5 new textMarkers (kWh, summer, winter, average bill, residential)
  - Increased expected success rate: 80% → 90%
  - Upgraded granularity: city → address
  - Upgraded confidence threshold: medium → high
- **Seasonal Analysis:** Critical for AC-heavy states like FL, TX, AZ
- **Commit:** [Batch Pending]

### ✅ Field 106: Water Provider (BATCH 1 - Utilities)
- **Date:** 2026-01-11
- **Changes:**
  - Added address-specific queries (2 new queries - highest priority)
  - Added ZIP-level queries (1 new query)
  - Added state water association queries (1 new query)
  - Enhanced extraction patterns: Added 50+ major water utility names (Miami-Dade Water, LADWP, NYC Water, etc.)
  - Increased regex patterns: 2 → 4 patterns (100% increase)
  - Increased total queries: 3 → 7 queries (133% increase)
  - Added 3 new textMarkers (municipal water, served by, water district)
  - Increased expected success rate: 85% → 98%
  - Upgraded granularity: zip → address
  - Upgraded confidence threshold: medium → high
- **Major Water Utility Recognition:** 50+ metro area water utilities recognized
- **Commit:** [Batch Pending]

### ✅ Field 107: Avg Water Bill (BATCH 1 - Utilities)
- **Date:** 2026-01-11
- **Changes:**
  - Added address-specific queries (Zillow, Redfin water costs - 3 new queries)
  - Added ZIP-level year-specific queries (2025 - 2 new queries)
  - Added city-level rate schedule queries (2 new queries)
  - Added state water board rate queries (2 new queries)
  - Enhanced extraction patterns: Added gallons, tier pricing, rate schedules
  - Increased regex patterns: 2 → 6 patterns (200% increase)
  - Increased total queries: 3 → 9 queries (200% increase)
  - Added 5 new textMarkers (gallons, tier, rate schedule, residential rates, average water)
  - Increased expected success rate: 75% → 88%
  - Upgraded granularity: city → address
  - Upgraded confidence threshold: medium → high
- **Tiered Pricing Support:** Critical for conservation pricing markets (CA, NV, AZ)
- **Commit:** [Batch Pending]

### ✅ Field 108: Sewer Provider (BATCH 1 - Utilities)
- **Date:** 2026-01-11
- **Changes:**
  - Added address-specific queries (septic vs municipal detection - 3 new queries)
  - Added ZIP-level queries (1 new query)
  - Enhanced extraction patterns: Added septic system detection, sanitation district patterns
  - Increased regex patterns: 2 → 5 patterns (150% increase)
  - Increased total queries: 3 → 7 queries (133% increase)
  - Added 4 new textMarkers (septic, municipal sewer, sanitation district, wastewater authority)
  - Increased expected success rate: 80% → 95%
  - Upgraded granularity: zip → address
  - Upgraded confidence threshold: medium → high
- **Septic vs Municipal:** Critical for rural/suburban property determination
- **Commit:** [Batch Pending]

### ✅ Field 109: Natural Gas (BATCH 1 - Utilities)
- **Date:** 2026-01-11
- **Changes:**
  - Added address-specific queries (gas vs all-electric detection - 3 new queries)
  - Added ZIP-level queries (2 new queries)
  - Added state gas association queries (1 new query)
  - Enhanced extraction patterns: Added 20+ major gas utility names, all-electric detection, propane vs natural gas
  - Increased regex patterns: 2 → 6 patterns (200% increase)
  - Increased total queries: 3 → 8 queries (167% increase)
  - Added 5 new textMarkers (all-electric, propane, LP gas, gas available, no gas infrastructure)
  - Increased expected success rate: 90% → 93%
  - Upgraded granularity: zip → address
- **Gas vs All-Electric vs Propane:** Critical for energy source determination
- **Commit:** [Batch Pending]

### ✅ Field 110: Trash Provider (BATCH 1 - Utilities)
- **Date:** 2026-01-11
- **Changes:**
  - Added address-specific queries (HOA vs municipal detection - 3 new queries)
  - Added ZIP-level queries (2 new queries)
  - Added city-level recycling queries (1 new query)
  - Enhanced extraction patterns: Added major waste companies (Waste Management, Republic Services, etc.), HOA-included detection
  - Increased regex patterns: 2 → 5 patterns (150% increase)
  - Increased total queries: 3 → 8 queries (167% increase)
  - Added 5 new textMarkers (included in HOA, municipal service, recycling, private hauler)
  - Increased expected success rate: 75% → 85%
  - Upgraded granularity: zip → address
  - Upgraded confidence threshold: medium → high
- **HOA vs Municipal:** Critical cost determination (often included in HOA/taxes)
- **Commit:** [Batch Pending]

### ✅ Field 111: Internet Providers (Top 3) (BATCH 1 - Utilities)
- **Date:** 2026-01-11
- **Changes:**
  - Added address-specific queries (varies by street - 2 new queries)
  - Added ZIP-level year-specific queries (2025, 2026 - 4 new queries)
  - Added city-level ISP availability queries (2 new queries)
  - Enhanced extraction patterns: Added 25+ major ISP names (Xfinity, Spectrum, Verizon Fios, etc.)
  - Increased regex patterns: 2 → 4 patterns (100% increase)
  - Increased total queries: 4 → 8 queries (100% increase)
  - Added 4 new textMarkers (ISP, available, fixed wireless, satellite)
  - Maintained expected success rate: 98% → 95% (still excellent, slight decrease due to address-level precision requirements)
  - Upgraded granularity: zip → address
- **Address-Level Critical:** ISP availability varies dramatically by street
- **Commit:** [Batch Pending]

### ✅ Field 112: Max Internet Speed (BATCH 1 - Utilities)
- **Date:** 2026-01-11
- **Changes:**
  - Added address-specific queries (fiber varies by street - 2 new queries)
  - Added ZIP-level year-specific queries (2025, gigabit - 4 new queries)
  - Added city-level fiber speed queries (3 new queries)
  - Enhanced extraction patterns: Added upload speed, Gbps vs Mbps, gigabit detection
  - Increased regex patterns: 2 → 7 patterns (250% increase)
  - Increased total queries: 4 → 9 queries (125% increase)
  - Added 6 new textMarkers (download, upload, gigabit, fiber speed, max available)
  - Increased expected success rate: 88% → 93%
  - Upgraded granularity: zip → address
- **Upload Speed Detection:** Critical for remote work (not just download)
- **Commit:** [Batch Pending]

### ✅ Field 113: Fiber Available (BATCH 1 - Utilities)
- **Date:** 2026-01-11
- **Changes:**
  - Added address-specific queries (fiber varies by street - 3 new queries)
  - Added ZIP-level year-specific queries (2025, 2026 - 3 new queries)
  - Added city-level planned deployment queries ("coming soon" - 2 new queries)
  - Enhanced extraction patterns: Added major fiber provider names, "coming soon" detection for planned deployments
  - Increased regex patterns: 2 → 5 patterns (150% increase)
  - Increased total queries: 4 → 10 queries (150% increase)
  - Added 6 new textMarkers (coming soon, planned, fiber expansion, AT&T Fiber, Verizon Fios, Google Fiber)
  - Increased expected success rate: 98% → 99%
- **Planned Deployment Detection:** "Coming soon" valuable for investor timeline planning
- **Commit:** [Batch Pending]

### ✅ Field 114: Cable TV Provider (BATCH 1 - Utilities)
- **Date:** 2026-01-11
- **Changes:**
  - Added address-specific queries (2 new queries)
  - Added ZIP-level streaming service queries (3 new queries)
  - Added city-level cord-cutting queries (3 new queries)
  - Enhanced extraction patterns: Added major cable providers, streaming services (YouTube TV, Hulu Live, etc.)
  - Increased regex patterns: 1 → 5 patterns (400% increase)
  - Increased total queries: 3 → 8 queries (167% increase)
  - Added 5 new textMarkers (streaming, YouTube TV, Hulu Live, cord cutting, TV service)
  - Increased expected success rate: 70% → 80%
  - Upgraded granularity: zip → address
- **Streaming Alternatives:** Market shift to cord-cutting - includes streaming options
- **Commit:** [Batch Pending]

### ✅ Field 116: Emergency Services Distance (BATCH 1 - Utilities)
- **Date:** 2026-01-11
- **Changes:**
  - Added address-specific distance queries (4 new queries - highest priority)
  - Added ZIP-level queries (2 new queries)
  - Added city-level service-specific queries (fire, hospital, police separately - 4 new queries)
  - Enhanced extraction patterns: Added service-specific distance patterns, response time extraction
  - Increased regex patterns: 2 → 8 patterns (300% increase)
  - Increased total queries: 4 → 10 queries (150% increase)
  - Added 3 new textMarkers (nearest, emergency services, response time)
  - Increased expected success rate: 40% → 60% (still limited by web scraping constraints)
  - Upgraded granularity: zip → address
  - Upgraded confidence threshold: low → medium
- **Note:** Still recommends Google Places API as primary source (Tavily as fallback only)
- **Architectural Decision:** Flagged in action items as needing API prioritization
- **Commit:** [Batch Pending]

---

## Next Fields to Review (Sequential Order)

1. **Field 101:** Cap Rate (Est) - Already calculation-only ✅
2. **Field 102:** Financing Terms - ✅ COMPLETED
3. **Field 103:** Comparable Sales - ✅ COMPLETED
4. **Field 104:** Electric Provider - ✅ COMPLETED
5. **Field 105:** Avg Electric Bill - ✅ COMPLETED (Batch 1)
6. **Field 106:** Water Provider - ✅ COMPLETED (Batch 1)
7. **Field 107:** Avg Water Bill - ✅ COMPLETED (Batch 1)
8. **Field 108:** Sewer Provider - ✅ COMPLETED (Batch 1)
9. **Field 109:** Natural Gas - ✅ COMPLETED (Batch 1)
10. **Field 110:** Trash Provider - ✅ COMPLETED (Batch 1)
11. **Field 111:** Internet Providers - ✅ COMPLETED (Batch 1)
12. **Field 112:** Max Internet Speed - ✅ COMPLETED (Batch 1)
13. **Field 113:** Fiber Available - ✅ COMPLETED (Batch 1)
14. **Field 114:** Cable TV Provider - ✅ COMPLETED (Batch 1)
15. **Field 115:** Cell Coverage Quality - ✅ COMPLETED (Session 1)
16. **Field 116:** Emergency Services - ✅ COMPLETED (Batch 1)
17. **Field 131:** View Type - NEXT in sequence (Batch 2: Features)
18. Continue sequentially through remaining 36 fields...

---

## General Improvement Patterns

Based on improvements made so far, common patterns emerge:

### 1. **Prioritize Property-Specific Over General Data**
- Example: Field 98 now checks Zillow Rent Zestimate (address-level) before zip/city averages
- Example: Field 97 upgraded from city → zip granularity for flood zones

### 2. **Add Authoritative Sources**
- Example: Field 115 added RootMetrics (professional testing) vs crowdsourced data
- Pattern: Always prefer government, official, or professionally maintained sources

### 3. **Add Year-Specific Queries**
- Example: Field 97 and 98 now include "2025 2026" in queries
- Rationale: Ensures fresh data, not outdated 2019-2020 articles

### 4. **Enhance Quantitative Extraction**
- Example: Field 115 now extracts Mbps, %, bars, tower counts (not just "Good"/"Poor")
- Pattern: Numeric data > subjective labels

### 5. **Add Fallback Queries**
- Pattern: Property-specific → ZIP → City → State → National
- Ensures graceful degradation if primary sources fail

### 6. **Improve Regex Patterns**
- Add variations: "per month", "/mo", "monthly"
- Add range extraction: "$X - $Y" patterns
- Add context-aware patterns: "rent zestimate: $X"

---

## Notes

- **Cloudflare Blocking:** Some sites (rentometer.com) block automated scraping - avoid these
- **Sequential Execution:** Tavily executes queries one at a time, stops on first success
- **LLM Extraction:** Claude/GPT extract structured data from Tavily search results
- **Confidence Levels:** High confidence (≥90%) required for including field in results

---

## Related Documents

- `api/property/tavily-field-config.ts` - Field configuration source of truth
- `DISABLED_LLMS_BETRAYAL_AUDIT.md` - LLM cascade audit findings
- `GPT_COMPREHENSIVE_AUDIT_REPORT.md` - GPT-specific errors found and fixed
- `TAVILY_55_FIELDS_AUDIT_COMPLETE.md` - Original comprehensive audit

---

**Last Updated:** 2026-01-11
**Next Review:** After completing next 5 fields (Fields 103-107)
