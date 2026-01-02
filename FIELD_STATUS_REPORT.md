# CLUES Property Dashboard - Field Status Report
**Generated:** 2026-01-02
**Total Fields:** 168 (138 core + 30 Stellar MLS)

## Status Legend
- ✅ **GREEN**: Field is working correctly - proven to populate from data sources
- ⚠️ **YELLOW**: Field returns data but may have mapping/display issues
- ❌ **RED**: Field needs implementation or fixes

---

## GROUP 1: Address & Identity (Fields 1-9)

| # | Field Name | Status | Data Source | Notes |
|---|------------|--------|-------------|-------|
| 1 | Full Address | ✅ | Stellar MLS, Google Geocode | Working |
| 2 | MLS Primary # | ✅ | Stellar MLS | Working |
| 3 | MLS Secondary # | ⚠️ | Stellar MLS | Rarely populated |
| 4 | Listing Status | ✅ | Stellar MLS | Working |
| 5 | Listing Date | ✅ | Stellar MLS | Working |
| 6 | Neighborhood | ✅ | Stellar MLS, Google Geocode | Working |
| 7 | County | ✅ | Stellar MLS, Google Geocode | Working |
| 8 | ZIP Code | ✅ | Stellar MLS, Google Geocode | Working |
| 9 | Parcel ID | ✅ | Stellar MLS | Working |

---

## GROUP 2: Pricing & Value (Fields 10-16)

| # | Field Name | Status | Data Source | Notes |
|---|------------|--------|-------------|-------|
| 10 | Listing Price | ✅ | Stellar MLS | Working |
| 11 | Price Per Sq Ft | ✅ | Backend Calculation | **FIXED** - Now calculates from Fields 10 & 21 |
| 12 | Market Value Estimate | ⚠️ | LLMs (Perplexity/Grok) | May duplicate Field 16 |
| 13 | Last Sale Date | ✅ | Stellar MLS, County | Working |
| 14 | Last Sale Price | ✅ | Stellar MLS, County | Working |
| 15 | Assessed Value | ✅ | Stellar MLS | Working |
| 16 | Redfin Estimate | ❌ | Redfin API (disabled) | API not working - needs fix or LLM |

---

## GROUP 3: Property Basics (Fields 17-29)

| # | Field Name | Status | Data Source | Notes |
|---|------------|--------|-------------|-------|
| 17 | Bedrooms | ✅ | Stellar MLS | Working |
| 18 | Full Bathrooms | ✅ | Stellar MLS | Working |
| 19 | Half Bathrooms | ✅ | Stellar MLS | Working |
| 20 | Total Bathrooms | ✅ | Backend Calculation | Working |
| 21 | Living Sq Ft | ✅ | Stellar MLS | Working |
| 22 | Total Sq Ft Under Roof | ✅ | Stellar MLS | Working |
| 23 | Lot Size (Sq Ft) | ✅ | Stellar MLS | Working |
| 24 | Lot Size (Acres) | ✅ | Stellar MLS | Working |
| 25 | Year Built | ✅ | Stellar MLS | Working |
| 26 | Property Type | ✅ | Stellar MLS | Working |
| 27 | Stories | ✅ | Stellar MLS | Working |
| 28 | Garage Spaces | ✅ | Stellar MLS | Working |
| 29 | Parking Total | ✅ | Backend Calculation | Working |

---

## GROUP 4: HOA & Taxes (Fields 30-38)

| # | Field Name | Status | Data Source | Notes |
|---|------------|--------|-------------|-------|
| 30 | HOA Y/N | ✅ | Stellar MLS | Working |
| 31 | HOA Fee (Annual) | ✅ | Stellar MLS | **FIXED** - Converts to annual |
| 32 | HOA Name | ✅ | Stellar MLS | Working |
| 33 | HOA Includes | ✅ | Stellar MLS | Working |
| 34 | Ownership Type | ✅ | Stellar MLS | Working |
| 35 | Annual Taxes | ✅ | Stellar MLS | Working |
| 36 | Tax Year | ✅ | Stellar MLS | Working |
| 37 | Property Tax Rate (%) | ✅ | Backend Calculation | **FIXED** - Now calculates |
| 38 | Tax Exemptions | ✅ | Stellar MLS | **FIXED** - Homestead mapping |

---

## GROUP 5: Structure & Systems (Fields 39-48)

| # | Field Name | Status | Data Source | Notes |
|---|------------|--------|-------------|-------|
| 39 | Roof Type | ✅ | Stellar MLS | Working |
| 40 | Roof Age (Est) | ✅ | Backend Calculation | Working (from permits) |
| 41 | Exterior Material | ✅ | Stellar MLS | **FIXED** - Correct field name |
| 42 | Foundation | ✅ | Stellar MLS | Working |
| 43 | Water Heater Type | ✅ | Stellar MLS | Working |
| 44 | Garage Type | ✅ | Stellar MLS | Working |
| 45 | HVAC Type | ✅ | Stellar MLS | Working |
| 46 | HVAC Age | ✅ | Backend Calculation | Working (from permits) |
| 47 | Laundry Type | ✅ | Stellar MLS | Working |
| 48 | Interior Condition | ✅ | Stellar MLS + AI Parser | **FIXED** - Pattern matching from remarks |

---

## GROUP 6: Interior Features (Fields 49-53)

| # | Field Name | Status | Data Source | Notes |
|---|------------|--------|-------------|-------|
| 49 | Flooring Type | ✅ | Stellar MLS | Working |
| 50 | Kitchen Features | ✅ | Stellar MLS | Working |
| 51 | Appliances Included | ✅ | Stellar MLS | Working |
| 52 | Fireplace Y/N | ✅ | Stellar MLS | Working |
| 53 | Fireplace Count | ✅ | Backend Calculation | Working |

---

## GROUP 7: Exterior Features (Fields 54-58)

| # | Field Name | Status | Data Source | Notes |
|---|------------|--------|-------------|-------|
| 54 | Pool Y/N | ✅ | Stellar MLS | Working |
| 55 | Pool Type | ✅ | Stellar MLS | Working |
| 56 | Deck/Patio | ✅ | Stellar MLS | Working |
| 57 | Fence | ✅ | Stellar MLS | Working |
| 58 | Landscaping | ✅ | Stellar MLS | **FIXED** - Filters out flood data |

---

## GROUP 8: Permits & Renovations (Fields 59-62)

| # | Field Name | Status | Data Source | Notes |
|---|------------|--------|-------------|-------|
| 59 | Recent Renovations | ✅ | Stellar MLS | Working |
| 60 | Permit History (Roof) | ⚠️ | Permit scraper | May not populate |
| 61 | Permit History (HVAC) | ⚠️ | Permit scraper | May not populate |
| 62 | Permit History (Other) | ⚠️ | Permit scraper | May not populate |

---

## GROUP 9: Assigned Schools (Fields 63-73)

| # | Field Name | Status | Data Source | Notes |
|---|------------|--------|-------------|-------|
| 63 | School District | ✅ | SchoolDigger, LLMs | Working |
| 64 | Elevation (Feet) | ✅ | USGS Elevation API | Working |
| 65 | Elementary School | ✅ | **Google Places** | **FIXED** - Now populates name |
| 66 | Elementary Rating | ✅ | SchoolDigger, GreatSchools | Working |
| 67 | Elementary Distance (mi) | ✅ | Google Places | Working |
| 68 | Middle School | ✅ | **Google Places** | **FIXED** - Now populates name |
| 69 | Middle Rating | ✅ | SchoolDigger, GreatSchools | Working |
| 70 | Middle Distance (mi) | ✅ | Google Places | Working |
| 71 | High School | ✅ | **Google Places** | **FIXED** - Now populates name |
| 72 | High Rating | ✅ | SchoolDigger, GreatSchools | Working |
| 73 | High Distance (mi) | ✅ | Google Places | Working |

---

## GROUP 10: Location Scores (Fields 74-82)

| # | Field Name | Status | Data Source | Notes |
|---|------------|--------|-------------|-------|
| 74 | Walk Score | ✅ | WalkScore API | Working |
| 75 | Transit Score | ✅ | WalkScore API | **FIXED** - Field number corrected |
| 76 | Bike Score | ✅ | WalkScore API | **FIXED** - Field number corrected |
| 77 | Safety Score | ✅ | LLMs | Working |
| 78 | Noise Level | ✅ | HowLoud API | Working |
| 79 | Traffic Level | ✅ | HowLoud API | Working |
| 80 | Walkability Description | ✅ | WalkScore API | Working |
| 81 | Public Transit Access | ✅ | Google Places | Working |
| 82 | Commute Time (City Center) | ✅ | Google Distance Matrix | Working |

---

## GROUP 11: Distances & Amenities (Fields 83-87)

| # | Field Name | Status | Data Source | Notes |
|---|------------|--------|-------------|-------|
| 83 | Distance to Grocery (mi) | ✅ | Google Places | Working |
| 84 | Distance to Hospital (mi) | ✅ | Google Places | Working |
| 85 | Distance to Airport (mi) | ✅ | Google Places | Working |
| 86 | Distance to Park (mi) | ✅ | Google Places | Working |
| 87 | Distance to Beach (mi) | ✅ | Google Places | Working |

---

## GROUP 12: Safety & Crime (Fields 88-90)

| # | Field Name | Status | Data Source | Notes |
|---|------------|--------|-------------|-------|
| 88 | Violent Crime Index | ✅ | FBI Crime API | **FIXED** - Added "(per 100,000)" |
| 89 | Property Crime Index | ✅ | FBI Crime API | **FIXED** - Added "(per 100,000)" |
| 90 | Neighborhood Safety Rating | ✅ | LLMs | Working |

---

## GROUP 13: Market & Investment Data (Fields 91-103)

| # | Field Name | Status | Data Source | Notes |
|---|------------|--------|-------------|-------|
| 91 | Median Home Price (Neighborhood) | ✅ | Perplexity, LLMs | **FIXED** - Field name corrected |
| 92 | Price Per Sq Ft (Recent Avg) | ✅ | Perplexity, LLMs | **FIXED** - Now works with Field 94 |
| 93 | Price to Rent Ratio | ✅ | Backend Calculation | **FIXED** - Now calculates |
| 94 | Price vs Median % | ✅ | Backend Calculation | **FIXED** - Now calculates |
| 95 | Days on Market (Avg) | ✅ | Perplexity, LLMs | Working |
| 96 | Inventory Surplus | ✅ | Perplexity, LLMs | Working |
| 97 | Insurance Est (Annual) | ✅ | Stellar MLS, LLMs | Working |
| 98 | Rental Estimate (Monthly) | ✅ | LLMs | Working |
| 99 | Rental Yield Est (%) | ✅ | Backend Calculation | Working |
| 100 | Vacancy Rate (Neighborhood) | ✅ | LLMs | Working |
| 101 | Cap Rate Est (%) | ✅ | Backend Calculation | Working |
| 102 | Financing Terms | ✅ | Stellar MLS | **FIXED** - Now mapped |
| 103 | Comparable Sales | ✅ | LLMs | **FIXED** - JSON array format |

---

## GROUP 14: Utilities & Connectivity (Fields 104-116)

| # | Field Name | Status | Data Source | Notes |
|---|------------|--------|-------------|-------|
| 104 | Electric Provider | ✅ | Perplexity | **FIXED** - Removed MLS-only restriction |
| 105 | Avg Electric Bill | ❌ | Perplexity | **NEEDS:** Micro-prompt |
| 106 | Water Provider | ✅ | Stellar MLS, Perplexity | Working |
| 107 | Avg Water Bill | ❌ | Perplexity | **NEEDS:** Micro-prompt |
| 108 | Sewer Provider | ✅ | Stellar MLS, Perplexity | Working |
| 109 | Natural Gas | ✅ | Stellar MLS, Perplexity | Working |
| 110 | Trash Provider | ✅ | Stellar MLS, LLMs | Working |
| 111 | Internet Providers (Top 3) | ✅ | LLMs | Working |
| 112 | Max Internet Speed | ❌ | Perplexity | **NEEDS:** Micro-prompt |
| 113 | Fiber Available (Y/N) | ❌ | Perplexity | **NEEDS:** Micro-prompt |
| 114 | Cable TV Provider | ✅ | LLMs | Working |
| 115 | Cell Coverage Quality | ❌ | Perplexity | **NEEDS:** Micro-prompt |
| 116 | Emergency Services Distance | ❌ | **NEEDS:** Google Places API implementation |

---

## GROUP 15: Environment & Risk (Fields 117-130)

| # | Field Name | Status | Data Source | Notes |
|---|------------|--------|-------------|-------|
| 117 | Air Quality Index (Current) | ✅ | AirNow API | Working |
| 118 | Air Quality Grade | ✅ | AirNow API | **FIXED** - Separate from Field 117 |
| 119 | Flood Zone | ✅ | FEMA NFHL API | **FIXED** - Filters from landscaping |
| 120 | Flood Risk Level | ✅ | FEMA Risk Index | Working |
| 121 | Climate Risk | ✅ | NOAA Climate API | Working |
| 122 | Wildfire Risk | ✅ | FEMA Risk Index | Working |
| 123 | Earthquake Risk | ✅ | USGS Earthquake API | Working |
| 124 | Hurricane Risk | ✅ | NOAA Storm Events | Working |
| 125 | Tornado Risk | ✅ | NOAA Storm Events | Working |
| 126 | Radon Risk | ✅ | EPA Radon | Working |
| 127 | Superfund Site Nearby | ✅ | EPA FRS API | Working |
| 128 | Sea Level Rise Risk | ✅ | NOAA Sea Level | Working |
| 129 | Noise Level (dB Est) | ✅ | HowLoud API | Working |
| 130 | Solar Potential | ✅ | Google Solar API | Working |

---

## GROUP 16: Additional Features (Fields 131-138)

| # | Field Name | Status | Data Source | Notes |
|---|------------|--------|-------------|-------|
| 131 | View Type | ✅ | Stellar MLS | Working |
| 132 | Lot Features | ✅ | Stellar MLS | Enhanced with topography |
| 133 | EV Charging (Y/N) | ✅ | Stellar MLS | Working |
| 134 | Smart Home Features | ✅ | Stellar MLS, LLMs | Working |
| 135 | Accessibility Modifications | ✅ | LLMs | Working |
| 136 | Pet Policy | ✅ | Stellar MLS, LLMs | Working |
| 137 | Age Restrictions | ✅ | Stellar MLS, LLMs | Working |
| 138 | Special Assessments | ✅ | Stellar MLS | Working |

---

## GROUP 17-22: Stellar MLS Exclusive Fields (139-168)

| # | Field Name | Status | Data Source | Notes |
|---|------------|--------|-------------|-------|
| **PARKING (139-143)** |
| 139 | Carport Y/N | ✅ | Stellar MLS | Working |
| 140 | Carport Spaces | ✅ | Stellar MLS | Working |
| 141 | Garage Attached Y/N | ✅ | Stellar MLS | Working |
| 142 | Parking Features | ✅ | Stellar MLS | Working |
| 143 | Assigned Parking Spaces | ✅ | Stellar MLS | Working |
| **BUILDING (144-148)** |
| 144 | Floor Number | ✅ | Stellar MLS | Working (condos/apartments) |
| 145 | Building Total Floors | ✅ | Stellar MLS | Working |
| 146 | Building Name/Number | ✅ | Stellar MLS | Working |
| 147 | Building Elevator Y/N | ✅ | Stellar MLS | Working |
| 148 | Floors in Unit | ✅ | Stellar MLS | Working |
| **LEGAL (149-154)** |
| 149 | Subdivision Name | ✅ | Stellar MLS | Working |
| 150 | Legal Description | ✅ | Stellar MLS | Working |
| 151 | Homestead Y/N | ✅ | Stellar MLS | Working |
| 152 | CDD Y/N | ✅ | Stellar MLS | Working |
| 153 | Annual CDD Fee | ✅ | Stellar MLS | Working |
| 154 | Front Exposure | ✅ | Stellar MLS | Working |
| **WATERFRONT (155-159)** |
| 155 | Water Frontage Y/N | ✅ | Stellar MLS | Working |
| 156 | Waterfront Feet | ✅ | Stellar MLS | Working |
| 157 | Water Access Y/N | ✅ | Stellar MLS | Working |
| 158 | Water View Y/N | ✅ | Stellar MLS | Working |
| 159 | Water Body Name | ✅ | Stellar MLS | Working |
| **LEASING (160-165)** |
| 160 | Can Be Leased Y/N | ✅ | Stellar MLS | Working |
| 161 | Minimum Lease Period | ✅ | Stellar MLS | Working |
| 162 | Lease Restrictions Y/N | ✅ | Stellar MLS | Working |
| 163 | Pet Size Limit | ✅ | Stellar MLS | Working |
| 164 | Max Pet Weight | ✅ | Stellar MLS | Working |
| 165 | Association Approval Y/N | ✅ | Stellar MLS | Working |
| **FEATURES (166-168)** |
| 166 | Community Features | ✅ | Stellar MLS | Working |
| 167 | Interior Features | ✅ | Stellar MLS | Working |
| 168 | Exterior Features | ✅ | Stellar MLS | Working |

---

## Summary Statistics

**Total Fields:** 168
**✅ Working:** 155 (92%)
**⚠️ Partial:** 4 (2%)
**❌ Needs Work:** 9 (5%)

### Fields Needing Work:
1. **Field 16**: Redfin Estimate - API disabled, needs LLM fallback
2. **Field 105**: Avg Electric Bill - Needs Perplexity micro-prompt
3. **Field 107**: Avg Water Bill - Needs Perplexity micro-prompt
4. **Field 112**: Max Internet Speed - Needs Perplexity micro-prompt
5. **Field 113**: Fiber Available - Needs Perplexity micro-prompt
6. **Field 115**: Cell Coverage Quality - Needs Perplexity micro-prompt
7. **Field 116**: Emergency Services Distance - Needs Google Places API implementation
8. **Fields 60-62**: Permit History - Inconsistent data from permit scrapers
9. **Fields 12 & 16**: Potential duplication - Needs analysis

---

## Recent Fixes (2026-01-02 Session)

1. ✅ **Field 11** - Price Per Sq Ft calculation
2. ✅ **Fields 75-76** - Transit/Bike scores field number correction
3. ✅ **Field 118** - Air Quality Grade separate from AQI
4. ✅ **Field 104** - Electric Provider MLS-only restriction removed
5. ✅ **Fields 91-96** - Market data field name corrections
6. ✅ **Fields 65, 68, 71** - School names now from Google Places
