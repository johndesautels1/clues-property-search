# Tavily Field Configuration - Action Items

**Date Created:** 2026-01-10
**Status:** In Progress (7 of 55 fields improved)

---

## Overview

This document tracks improvements needed for Tavily web search field configurations based on comprehensive audit findings.

**Total Fields:** 55 Tavily-enabled fields
**Completed:** 7 fields (97, 98, 99, 100, 102, 103, 115)
**Remaining:** 48 fields

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
- **Commit:** [Pending]

---

## Next Fields to Review (Sequential Order)

1. **Field 101:** Cap Rate (Est) - Already calculation-only ✅
2. **Field 102:** Financing Terms - ✅ COMPLETED
3. **Field 103:** Comparable Sales - ✅ COMPLETED
4. **Field 104:** Electric Provider - NEXT in sequence
5. Continue sequentially through remaining 48 fields...

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
