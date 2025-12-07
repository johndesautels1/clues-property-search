# CLUES Property Dashboard - UX Improvements List
**Created:** 2025-12-07
**Context:** Discussion with user comparing our property detail display vs Redfin

## Background
User compared our property detail page to Redfin's listing for:
**640 Capri Blvd, Treasure Island, FL 33706**

We have 168 fields vs Redfin's ~70 fields, but Redfin has better UX in some areas.

## Items NOT Being Pursued
- ❌ Loan/mortgage calculators - User building separate app
- ❌ Virtual tours / 3D walkthroughs - User building separate app

---

## Priority UX Improvements

### 1. Building Area Total vs Living Area Display
**Issue:** We show "Living Sqft" (Field 21) but not "Building Area Total" (Field 22)
**Redfin Shows:** Both interior sqft and total sqft under roof
**Impact:** Medium - Important for condos/townhomes with shared walls
**Implementation:**
- Display both Field 21 (living_sqft) and Field 22 (total_sqft_under_roof)
- Show as: "2,450 sqft living / 2,800 sqft total"
- Highlight difference if > 10% variance

**Files to modify:**
- `src/pages/PropertyDetail.tsx` - Add total sqft display
- `src/components/property/PropertyCardUnified.tsx` - Show both in expanded view

---

### 2. Waterfront Features Prominence
**Issue:** Waterfront data buried in field list
**Redfin Shows:** "Waterfront" badge prominently if property has water features
**Impact:** High - Major selling point for Florida properties
**Fields Available:**
- Field 155: water_frontage_yn
- Field 156: waterfront_feet
- Field 157: water_access_yn
- Field 158: water_view_yn
- Field 159: water_body_name

**Implementation:**
- Add prominent "WATERFRONT" badge in hero section if Field 155 = Yes
- Show waterfront footage (Field 156) next to badge
- Display water body name (Field 159) in location section
- Add water view/access icons to quick stats

**Files to modify:**
- `src/pages/PropertyDetail.tsx` - Add waterfront badge to hero
- `src/components/property/PropertyCardUnified.tsx` - Add waterfront indicator

---

### 3. Recent Improvements / System Dates Tracking
**Issue:** No tracking of recent upgrades (roof, HVAC, water heater, etc.)
**Redfin Shows:** "Recent improvements" section with dates
**Impact:** High - Critical for buyers evaluating maintenance costs
**Fields Available:**
- Field 40: roof_age_est
- Field 46: hvac_age
- Additional fields for permit dates if available from MLS

**Implementation:**
- Create "Recent Improvements" section showing system ages
- Highlight systems < 5 years old in green
- Flag systems > 15 years old in yellow/red
- Calculate replacement cost estimates

**Files to modify:**
- `src/pages/PropertyDetail.tsx` - Add "Recent Improvements" section
- May need new API fields for permit data

---

### 4. Lot Dimensions Display
**Issue:** We show lot size (Field 23-24) but not dimensions
**Redfin Shows:** "Lot: 0.25 acres (75x145)"
**Impact:** Medium - Helpful for understanding property shape
**Fields Available:**
- Field 23: lot_size_sqft
- Field 24: lot_size_acres
- Need to add: lot_dimensions (width x depth)

**Implementation:**
- Parse MLS remarks or add new field for lot dimensions
- Display as: "10,875 sqft (0.25 acres) • 75' x 145'"
- Show lot diagram/shape if available

**Files to modify:**
- `src/pages/PropertyDetail.tsx` - Update lot size display
- May need `api/property/parse-mls-pdf.ts` to extract dimensions

---

### 5. Direction Faces (Front Exposure)
**Issue:** Direction property faces not prominently displayed
**Redfin Shows:** "Faces: North"
**Impact:** Medium - Important for sun exposure, energy costs
**Field Available:**
- Field 154: front_exposure

**Implementation:**
- Add "Faces: [direction]" to quick stats or location section
- Add sun icon showing solar exposure pattern
- Link to solar panel estimate if applicable

**Files to modify:**
- `src/pages/PropertyDetail.tsx` - Add direction to quick stats
- Consider adding Field 154 to PropertyCard summary

---

### 6. APN / MLS# More Prominent
**Issue:** MLS# and Parcel ID buried in field list
**Redfin Shows:** MLS# and APN prominently at top
**Impact:** Medium - Important for realtors and title research
**Fields Available:**
- Field 2: mls_primary
- Field 3: mls_secondary
- Field 9: parcel_id

**Implementation:**
- Add MLS# and APN to header section below address
- Make them copyable on click
- Style as badges: `MLS# T3XXXXXX` `APN: 12-34-56-78`

**Files to modify:**
- `src/pages/PropertyDetail.tsx` - Add to address header section

---

### 7. Sun Exposure / Solar Data
**Issue:** No sun exposure or solar potential data
**Redfin Shows:** (varies by market)
**Impact:** Medium-Low - Growing interest in solar panels
**Related Fields:**
- Field 154: front_exposure (direction)
- Could add: solar_panel_yn, solar_potential_kw

**Implementation:**
- Use Field 154 (direction) + location to estimate sun exposure
- Add "Solar Potential" estimate using Google Solar API
- Show: "High solar potential (South-facing, ~8.5kW system possible)"

**Files to modify:**
- `api/property/free-apis.ts` - Add Google Solar API call
- `src/pages/PropertyDetail.tsx` - Add solar section

---

### 8. Popularity / Engagement Metrics
**Issue:** No "interest signals" like views, saves, tour requests
**Redfin Shows:** "X people favorited" "Y tours booked"
**Impact:** Low - Nice social proof but we don't have this data
**Implementation:**
- Track local view counts for each property
- Show: "Viewed X times in last 7 days"
- Add "Save Property" feature with counter

**Files to modify:**
- Need to add analytics tracking
- `src/store/propertyStore.ts` - Track views
- `src/pages/PropertyDetail.tsx` - Display view counter

---

### 9. Climate Risk Visual Icons
**Issue:** Climate data (FEMA, sea level, etc.) in text fields
**Redfin Shows:** (limited)
**Impact:** High - Florida-specific concern
**Fields Available:**
- Field 118: fema_flood_zone
- Field 119: fema_risk_rating
- Field 121: climate_zone
- Field 125: storm_surge_ft

**Implementation:**
- Add visual risk indicators in hero section:
  - 🌊 Flood Zone: X (High/Medium/Low)
  - 🌀 Storm Surge: X ft
  - 🌡️ Climate Zone: X
- Color-code by risk level
- Link to detailed climate report

**Files to modify:**
- `src/pages/PropertyDetail.tsx` - Add climate risk badges
- Consider creating `ClimateRiskIndicator.tsx` component

---

### 10. Noise Score Display
**Issue:** We have noise score (Field 81) but don't show it
**Redfin Shows:** (limited)
**Impact:** Medium - Important quality of life factor
**Field Available:**
- Field 81: noise_score

**Implementation:**
- Add noise score to location scores section
- Show as: "Noise Score: 72 (Moderate)"
- Add explanation: "Based on traffic, airport, industry"

**Files to modify:**
- `src/pages/PropertyDetail.tsx` - Add to location scores section

---

### 11. Internet Providers
**Issue:** We collect internet data (Field 111-113) but don't show it well
**Redfin Shows:** (varies)
**Impact:** Medium - Work-from-home era essential
**Fields Available:**
- Field 111: internet_providers_top3
- Field 112: max_internet_speed
- Field 113: fiber_available

**Implementation:**
- Add "Internet" to utilities section
- Show: "Fiber Available: Yes • Max Speed: 1Gbps"
- List providers: "Spectrum, Frontier, AT&T"

**Files to modify:**
- `src/pages/PropertyDetail.tsx` - Enhance utilities section

---

### 12. Electricity Cost Estimate
**Issue:** We have electric provider (Field 104) but no cost estimate
**Redfin Shows:** (limited)
**Impact:** Medium - Ongoing cost consideration
**Fields Available:**
- Field 104: electric_provider
- Field 105: avg_electric_bill
- Could calculate: sqft × climate zone × rate

**Implementation:**
- Estimate monthly electric cost based on:
  - Living sqft (Field 21)
  - Climate zone (Field 121)
  - Provider rates (Duke Energy, TECO, etc.)
- Show: "Est. Electric: $180-240/month"

**Files to modify:**
- `src/pages/PropertyDetail.tsx` - Add to utilities section
- May need rate table for FL electric providers

---

## Implementation Priority Order

**Phase 1 - High Impact, Low Effort:**
1. Waterfront Features Prominence (Fields 155-159)
2. APN / MLS# More Prominent (Fields 2, 3, 9)
3. Direction Faces (Field 154)
4. Noise Score Display (Field 81)

**Phase 2 - High Impact, Medium Effort:**
5. Climate Risk Visual Icons (Fields 118-125)
6. Building Area Total vs Living Area (Fields 21-22)
7. Recent Improvements / System Dates (Fields 40, 46)

**Phase 3 - Medium Impact:**
8. Lot Dimensions Display (Fields 23-24 + new)
9. Internet Providers (Fields 111-113)
10. Electricity Cost Estimate (Fields 104-105)

**Phase 4 - Nice to Have:**
11. Sun Exposure / Solar Data (Field 154 + API)
12. Popularity / Engagement Metrics (new feature)

---

## Notes
- User wants to discuss this list in a future session
- Focus on leveraging our 168-field advantage
- Emphasize Florida-specific concerns (climate, waterfront, hurricane risk)
- Don't duplicate features user is building separately (loans, virtual tours)
