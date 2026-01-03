# 🎯 SMART SCORE LLM CALCULATION PROMPT - MASTER TEMPLATE

**Created:** 2025-12-27
**Version:** 1.0
**Purpose:** Complete instructions for LLMs to calculate SMART Scores with exact mathematical formulas

---

## 🚨 CRITICAL: READ THIS FIRST

You are being asked to calculate **CLUES SMART Scores** for **3 properties** in a Florida real estate comparison.

This is NOT a simple calculation. You MUST:
1. ✅ Score **ALL 138 scoreable fields** for **ALL 3 properties** (414 scores total)
2. ✅ Use the **EXACT mathematical formulas** provided below
3. ✅ Apply **Florida beach vs. inland location adjustments**
4. ✅ Calculate **22 section averages** with **industry weights**
5. ✅ Return results in the **EXACT JSON format** specified
6. ✅ Cite your reasoning for any controversial scores

**Temperature Setting:** 0.1 (maximum precision, minimal creativity)

---

## 📊 SECTION WEIGHTS (Industry Standard)

**CRITICAL:** These weights MUST sum to exactly 100.0%

```javascript
INDUSTRY_WEIGHTS = {
  'A': 1.94%,  // Address & Identity (2.0 normalized)
  'B': 17.96%, // Pricing & Value (18.5 normalized)
  'C': 14.76%, // Property Basics (15.2 normalized)
  'D': 9.71%,  // HOA & Taxes (10.0 normalized)
  'E': 6.80%,  // Structure & Systems (7.0 normalized)
  'F': 0.97%,  // Interior Features (1.0 normalized)
  'G': 1.94%,  // Exterior Features (2.0 normalized)
  'H': 0.49%,  // Permits & Renovations (0.5 normalized)
  'I': 11.94%, // Schools (12.3 normalized)
  'J': 4.85%,  // Location Scores (5.0 normalized)
  'K': 1.94%,  // Distances & Amenities (2.0 normalized)
  'L': 3.88%,  // Safety & Crime (4.0 normalized)
  'M': 7.77%,  // Market & Investment (8.0 normalized)
  'N': 0.49%,  // Utilities (0.5 normalized)
  'O': 8.74%,  // Environment & Risk (9.0 normalized)
  'P': 0.00%,  // Additional Features
  'Q': 0.00%,  // Parking
  'R': 0.00%,  // Building
  'S': 0.00%,  // Legal
  'T': 5.83%,  // Waterfront (6.0 normalized)
  'U': 0.00%,  // Leasing
  'V': 0.00%,  // Features
}
// TOTAL: 100.00%
```

---

## 🏖️ FLORIDA LOCATION LOGIC

### Beach Zip Codes (High-value coastal areas)
```
34235, 34240, 34236, 34217, 34242  // Sarasota/Siesta Key
33706, 33767, 33785, 33774, 33770  // St. Pete Beach/Treasure Island
33139, 33140, 33141, 33154, 33109  // Miami Beach
32034, 32080, 32082  // St. Augustine Beach
32176, 32174, 32169  // Daytona Beach
33004, 33019, 33009  // Dania Beach/Hollywood Beach
32561, 32459, 32550  // Fort Walton Beach/Destin
```

### Inland Zip Codes (Non-beachfront)
```
33606, 33609, 33611, 33618, 33629  // Tampa inland
32801, 32803, 32804, 32806, 32807  // Orlando
33301, 33311, 33312, 33321  // Fort Lauderdale inland
33101, 33125, 33126, 33127, 33130  // Miami inland
32789, 32792, 32765  // Seminole County
```

**IF zip code NOT in either list:** Treat as **INLAND** by default.

---

## 📐 FIELD-BY-FIELD SCORING EQUATIONS

### SECTION A: ADDRESS & IDENTITY (Weight: 1.94%)

#### Field 6: Neighborhood Name
```
Premium FL keywords → 90:
  "beach", "bay", "harbor", "marina", "island", "gulf",
  "ocean", "estates", "country club", "golf", "lakefront"

Mid-tier keywords → 70:
  "village", "gardens", "heights", "grove", "park"

Unknown → 50
```

#### Field 7: County
```
Tier 1 counties → 95-100:
  Palm Beach(100), Collier(100), Miami-Dade(98), Monroe(100), Martin(95)

Tier 2 counties → 80-88:
  Sarasota(88), Pinellas(85), Lee(82), Broward(80), St. Johns(100)

Tier 3 counties → 65-75:
  Hillsborough(70), Orange(72), Duval(68), Volusia(68)

Tier 4 counties → 50-60:
  Pasco(55), Polk(50), Osceola(52)
```

#### Field 8: Zip Code
```
Beach zips → 90
Mid-tier zips → 70
Inland zips → 60
```

---

### SECTION B: PRICING & VALUE (Weight: 17.96%)

#### Field 11: Price Per Square Foot

**BEACH AREAS:**
```javascript
IF price_per_sqft < 200:  score = 100  // Exceptional value
IF price_per_sqft < 280:  score = 95
IF price_per_sqft < 350:  score = 80   // Good value
IF price_per_sqft < 450:  score = 60   // Market rate for beach
IF price_per_sqft < 550:  score = 40   // Premium beach pricing
IF price_per_sqft < 700:  score = 25   // Luxury/beachfront
IF price_per_sqft >= 700: score = 10   // Ultra-luxury
```

**INLAND AREAS:**
```javascript
IF price_per_sqft < 150:  score = 100  // Incredible value
IF price_per_sqft < 200:  score = 95
IF price_per_sqft < 250:  score = 88   // Excellent value
IF price_per_sqft < 280:  score = 80
IF price_per_sqft < 320:  score = 72   // Good value (median)
IF price_per_sqft < 350:  score = 60   // Fair (at market)
IF price_per_sqft < 400:  score = 48
IF price_per_sqft < 450:  score = 35
IF price_per_sqft < 500:  score = 25
IF price_per_sqft < 600:  score = 18
IF price_per_sqft >= 600: score = 10
```

#### Field 12: Market Value Estimate
**Context Required:** Listing Price (Field 10)

```javascript
ratio = listing_price / market_estimate

IF ratio <= 0.85: score = 100  // 15%+ below estimate
IF ratio <= 0.90: score = 92   // 10-15% below
IF ratio <= 0.95: score = 82   // 5-10% below
IF ratio <= 0.98: score = 72   // 2-5% below
IF ratio <= 1.00: score = 62   // At estimate
IF ratio <= 1.02: score = 50   // 0-2% above
IF ratio <= 1.05: score = 40   // 2-5% above
IF ratio <= 1.10: score = 28   // 5-10% above
IF ratio <= 1.15: score = 18   // 10-15% above
IF ratio > 1.15:  score = 8    // >15% above
```

#### Field 14: Last Sale Price
**Context Required:** Listing Price (Field 10)

```javascript
appreciation_percent = ((listing_price - last_sale_price) / last_sale_price) * 100

IF appreciation < -20%: score = 20  // Significant depreciation
IF appreciation < -10%: score = 35
IF appreciation < 0%:   score = 45
IF appreciation < 10%:  score = 55  // Minimal growth
IF appreciation < 20%:  score = 70
IF appreciation < 35%:  score = 85  // Healthy FL appreciation
IF appreciation < 50%:  score = 95  // Strong FL market
IF appreciation < 70%:  score = 90
IF appreciation < 100%: score = 75  // High (verify pricing)
IF appreciation < 150%: score = 55  // Excessive (bubble risk)
IF appreciation >= 150%: score = 35 // Overpriced risk
```

#### Field 15: Assessed Value
**Context Required:** Listing Price (Field 10)

```javascript
ratio = listing_price / assessed_value

IF ratio <= 0.95: score = 100  // Listed below assessed
IF ratio <= 1.00: score = 95   // At assessed
IF ratio <= 1.10: score = 88   // 10% above
IF ratio <= 1.20: score = 78   // 20% above
IF ratio <= 1.30: score = 68   // 30% above (normal FL)
IF ratio <= 1.40: score = 55
IF ratio <= 1.50: score = 42
IF ratio <= 1.75: score = 30
IF ratio > 1.75:  score = 18   // Overpriced
```

#### Field 16: Redfin Estimate
**Context Required:** Listing Price (Field 10)

```javascript
ratio = listing_price / redfin_estimate

IF ratio <= 0.88: score = 100  // 12%+ below
IF ratio <= 0.92: score = 90   // 8-12% below
IF ratio <= 0.96: score = 80   // 4-8% below
IF ratio <= 0.99: score = 70   // 1-4% below
IF ratio <= 1.01: score = 60   // At Redfin estimate
IF ratio <= 1.04: score = 48
IF ratio <= 1.08: score = 38
IF ratio <= 1.12: score = 28
IF ratio <= 1.18: score = 18
IF ratio > 1.18:  score = 10
```

---

### SECTION C: PROPERTY BASICS (Weight: 14.76%)

#### Field 17: Bedrooms
```javascript
IF bedrooms = 0: score = 15   // Studio
IF bedrooms = 1: score = 35   // Investment only
IF bedrooms = 2: score = 70   // Popular with retirees
IF bedrooms = 3: score = 100  // OPTIMAL for most buyers
IF bedrooms = 4: score = 92   // Great for families
IF bedrooms = 5: score = 78   // Large family
IF bedrooms = 6: score = 65   // Niche market
IF bedrooms = 7: score = 52
IF bedrooms >= 8: score = 40  // Luxury/niche
```

#### Field 18: Full Bathrooms
```javascript
IF bathrooms < 1:  score = 10   // Major issue
IF bathrooms = 1:  score = 50   // Small homes only
IF bathrooms = 2:  score = 85   // Standard
IF bathrooms = 3:  score = 100  // Excellent
IF bathrooms = 4:  score = 95   // Large homes
IF bathrooms = 5:  score = 88
IF bathrooms >= 6: score = 80   // Mansion
```

#### Field 19: Half Bathrooms
```javascript
IF half_baths = 0: score = 50   // Common
IF half_baths = 1: score = 85   // Convenient
IF half_baths = 2: score = 100  // Luxury
IF half_baths >= 3: score = 90
```

#### Field 21: Living Square Feet
```javascript
IF sqft < 800:   score = 25   // Tiny
IF sqft < 1000:  score = 40
IF sqft < 1200:  score = 55
IF sqft < 1500:  score = 68
IF sqft < 1800:  score = 78
IF sqft < 2100:  score = 88
IF sqft < 2400:  score = 95
IF sqft < 2800:  score = 100  // IDEAL - spacious but efficient
IF sqft < 3200:  score = 95
IF sqft < 3800:  score = 88
IF sqft < 4500:  score = 78
IF sqft < 5500:  score = 68
IF sqft >= 5500: score = 55   // Mansion (niche, high costs)
```

#### Field 22: Total Sqft Under Roof
**Context Required:** Living Sqft (Field 21)

```javascript
bonus_ratio = (total_sqft - living_sqft) / living_sqft

IF bonus_ratio < 0.05:  score = 45  // Very little bonus
IF bonus_ratio < 0.15:  score = 60
IF bonus_ratio < 0.25:  score = 75  // Average
IF bonus_ratio < 0.35:  score = 88  // Good
IF bonus_ratio < 0.50:  score = 100 // Excellent (garage + lanai)
IF bonus_ratio >= 0.50: score = 90  // Very large
```

#### Field 23: Lot Size (sqft)
```
Note: Quarter-acre = 10,890 sqft, Half-acre = 21,780 sqft, Acre = 43,560 sqft

IF lot < 3000:   score = 30   // Zero-lot line
IF lot < 5000:   score = 45
IF lot < 7000:   score = 60
IF lot < 9000:   score = 72   // Average FL
IF lot < 11000:  score = 85   // Quarter-acre
IF lot < 15000:  score = 95
IF lot < 22000:  score = 100  // Half-acre
IF lot < 44000:  score = 95   // Half to full acre
IF lot < 87000:  score = 88   // 1-2 acres
IF lot >= 87000: score = 80   // Estate (more maintenance)
```

#### Field 25: Year Built
```javascript
current_year = 2025
age = current_year - year_built

// Florida Building Code context:
// Pre-1992: Before Hurricane Andrew
// 1992-2001: Post-Andrew improvements
// 2002+: Florida Building Code (strongest wind)
// 2010+: Updated energy codes

IF age <= 2:  score = 100  // Brand new
IF age <= 5:  score = 95   // Nearly new
IF age <= 10: score = 88   // Very new
IF age <= 15: score = 80   // Modern (post-2010 codes)
IF age <= 20: score = 72   // Recent (post-2005)
IF age <= 25: score = 65   // Post-2002 FL Building Code
IF age <= 32: score = 55   // Post-Andrew (1992+)
IF age <= 40: score = 42   // Pre-Andrew - check upgrades
IF age <= 50: score = 32
IF age <= 60: score = 25
IF age <= 80: score = 18
IF age > 80:  score = 12   // Historic value possible
```

#### Field 26: Property Type
```javascript
IF "single family" OR "single-family" OR "sfr" OR "sfh" OR "detached":
  score = 100  // Most desirable

IF "townhome" OR "townhouse": score = 82
IF "row house": score = 78
IF "attached": score = 75

IF "condo" OR "condominium": score = 68
IF "co-op" OR "cooperative": score = 55
IF "apartment": score = 50

IF "duplex": score = 72
IF "triplex": score = 68
IF "fourplex" OR "quadplex": score = 65
IF "multi": score = 60

IF "villa": score = 78
IF "mobile" OR "manufactured": score = 40
IF "modular": score = 55
IF "land" OR "lot": score = 35
IF "commercial": score = 30
```

#### Field 27: Stories
```javascript
// Florida strongly favors single-story (retiree market)
IF stories = 1:   score = 100  // Premium
IF stories = 1.5: score = 90   // Split-level
IF stories = 2:   score = 82   // Family friendly
IF stories = 2.5: score = 75
IF stories = 3:   score = 60   // Townhouse
IF stories >= 4:  score = 45   // Unusual for SFH
```

#### Field 28: Garage Spaces
```javascript
IF spaces = 0: score = 25   // No garage - major negative in FL
IF spaces = 1: score = 60   // Minimal
IF spaces = 2: score = 90   // Standard
IF spaces = 3: score = 100  // Excellent
IF spaces = 4: score = 95   // Luxury
IF spaces >= 5: score = 88  // Estate/collector
```

---

### SECTION D: HOA & TAXES (Weight: 9.71%)

#### Field 30: HOA Y/N
```javascript
IF has_HOA = true: score = 60
IF has_HOA = false: score = 100  // No HOA = maximum flexibility
```

#### Field 31: HOA Fee Annual
```javascript
IF fee = 0:           score = 100
IF fee < 1200:        score = 90   // <$100/mo
IF fee < 2400:        score = 75   // $100-200/mo
IF fee < 4800:        score = 60   // $200-400/mo
IF fee < 7200:        score = 40   // $400-600/mo
IF fee >= 7200:       score = 20   // >$600/mo
```

#### Field 33: HOA Includes (string analysis)
```javascript
base_score = 50

High-value inclusions (add points):
  "insurance/hazard/flood" → +15
  "roof/roofing" → +12
  "exterior/paint/stucco" → +10
  "reserves" → +8

Medium-value inclusions:
  "pool/swimming" → +6
  "landscaping/lawn/grounds" → +5
  "security/guard/gated" → +5
  "trash/garbage" → +3
  "water/irrigation" → +3
  "cable/internet" → +2
  "clubhouse/fitness/gym" → +4

MAX score = 100
```

#### Field 34: Ownership Type
```javascript
IF "fee simple" OR "fee-simple": score = 100  // Full ownership
IF "townhouse" OR "townhome" OR "th": score = 85
IF "condo" OR "condominium": score = 80
IF "co-op" OR "cooperative": score = 50  // Board approval required
IF "lease" OR "ground lease": score = 30  // Check remaining term
```

#### Field 35: Annual Taxes
**Context Required:** Listing Price (Field 10)

```javascript
effective_rate = (annual_taxes / listing_price) * 100

// Florida typical: 1.5-2.5% effective rate
IF effective_rate < 1.0%: score = 100  // Excellent
IF effective_rate < 1.5%: score = 90   // Good
IF effective_rate < 2.0%: score = 70   // Average
IF effective_rate < 2.5%: score = 50   // Above average
IF effective_rate >= 2.5%: score = 30  // High

// If listing price unavailable, use absolute thresholds:
IF taxes < 3000:  score = 100
IF taxes < 5000:  score = 85
IF taxes < 8000:  score = 70
IF taxes < 12000: score = 50
IF taxes >= 12000: score = 30
```

#### Field 37: Property Tax Rate
```javascript
// Convert millage to % if needed (mills > 5 likely)
IF rate > 5: rate = rate / 10

IF rate < 1.0%: score = 100  // Excellent
IF rate < 1.5%: score = 85   // Good
IF rate < 2.0%: score = 70   // Average FL
IF rate < 2.5%: score = 50   // Above average
IF rate >= 2.5%: score = 30  // High
```

#### Field 38: Tax Exemptions (string analysis)
```javascript
base_score = 50

IF "homestead": score += 30
IF "senior" OR "65+" OR "elderly": score += 15
IF "veteran" OR "military" OR "disabled": score += 15
IF "widow" OR "widower": score += 10
IF "none" OR "no exemption": score = 40

MAX score = 100
```

---

### SECTION E: STRUCTURE & SYSTEMS (Weight: 6.80%)

#### Field 39: Roof Type
```javascript
// Florida hurricane context
IF "tile" OR "clay" OR "concrete tile": score = 100  // 50+ years
IF "metal" OR "standing seam": score = 95   // 40-70 years
IF "slate": score = 95   // 100+ years
IF "architectural" OR "dimensional" (shingle): score = 80  // 25-30 years
IF "shingle" OR "asphalt": score = 60  // 15-20 years in FL
IF "flat" OR "built-up" OR "roll": score = 50  // High maintenance
IF "wood" OR "shake": score = 40  // Fire/termite concerns
```

#### Field 40: Roof Age (years)
```javascript
// Florida context: Roof = $15K-40K+
// Insurance strict on roofs >15 years

IF age <= 3:  score = 100  // New
IF age <= 7:  score = 85   // Good (15+ years left)
IF age <= 12: score = 70   // Moderate (plan replacement in 10yr)
IF age <= 20: score = 45   // Aging (insurance concerns)
IF age > 20:  score = 20   // Old (needs replacement)
```

#### Field 41: Exterior Material
```javascript
// Florida hurricane/termite context
IF "block" OR "stucco" OR "cbs" OR "concrete": score = 100
IF "brick": score = 95
IF "fiber cement" OR "hardie" OR "cement board": score = 85
IF "vinyl" OR "siding": score = 60  // Storm damage risk
IF "aluminum": score = 55  // Dated, dents
IF "wood" OR "cedar" OR "shake": score = 40  // Termite/moisture
```

#### Field 42: Foundation
```javascript
IF "slab" OR "concrete slab": score = 100  // Standard FL
IF "pilings" OR "stilts" OR "elevated" OR "pier": score = 90  // Flood protection
IF "crawl" OR "crawlspace": score = 50  // Moisture/termite risk
IF "basement": score = 30  // Unusual in FL, flood risk
```

#### Field 43: Water Heater Type
```javascript
IF "tankless" OR "on-demand" OR "instant": score = 100  // Energy efficient
IF "solar": score = 95  // Excellent for FL
IF "heat pump" OR "hybrid": score = 90  // Efficient for FL
IF "gas" OR "propane" OR "natural gas": score = 70  // Faster recovery
IF "electric" OR "tank": score = 60  // Standard, higher cost
```

#### Field 44: Garage Type
```javascript
IF "attached": score = 100  // Maximum convenience
IF "detached": score = 80   // Good protection
IF "carport": score = 50    // Minimal protection
IF "none" OR "no garage": score = 30  // Limited protection
```

#### Field 45: HVAC Type
```javascript
// AC critical in Florida
IF "heat pump" AND "central": score = 100  // Most efficient for FL
IF "central" AND ("electric" OR "a/c" OR "air"): score = 90  // Standard
IF "central" AND "gas": score = 85
IF "mini-split" OR "ductless": score = 85  // Zone control
IF "central" (generic): score = 85
IF "window" OR "wall unit" OR "ptac": score = 30  // Inadequate
IF "none": score = 10  // CRITICAL concern
```

#### Field 46: HVAC Age (years)
```javascript
// Florida: HVAC = $5K-15K, works harder, shorter life

IF age <= 3:  score = 100  // New
IF age <= 7:  score = 85   // Good (8+ years left)
IF age <= 12: score = 65   // Moderate (plan replacement)
IF age <= 15: score = 40   // Aging (replacement within 3yr)
IF age > 15:  score = 20   // Old (budget $8K-15K)
```

#### Field 47: Laundry Type
```javascript
IF "in-unit" (W/D included): score = 100
IF "hookups" OR "hook-up" OR "connections": score = 85  // No appliances
IF "shared" OR "building" OR "common": score = 50
IF "community" OR "complex": score = 30  // Less convenient
IF "none" OR "no laundry": score = 20
```

#### Field 48: Interior Condition
```javascript
IF "excellent" OR "new" OR "pristine": score = 100
IF "renovated" OR "updated" OR "remodeled": score = 95
IF "good" OR "well maintained": score = 80
IF "fair" OR "average" OR "dated": score = 55  // Needs updates
IF "needs work" OR "fixer" OR "tlc": score = 30  // Budget renovations
IF "poor" OR "distressed": score = 15  // Significant renovation
```

---

### SECTION I: SCHOOLS (Weight: 11.94%)

#### Field 63: School District
```javascript
// Florida district rankings
Tier 1 → 90-100:
  St. Johns(100), Seminole(95), Clay(92), Nassau(90)

Tier 2 → 80-88:
  Sarasota(88), Brevard(85), Martin(85), Collier(82),
  Manatee(80), Indian River(80)

Tier 3 → 65-75:
  Orange(70), Leon(72), Volusia(68), Alachua(70),
  Pinellas(68), Lee(65)

Tier 4 → 52-58:
  Hillsborough(55), Duval(52), Palm Beach(58),
  Pasco(55), Escambia(52)

Tier 5 → 42-48:
  Miami-Dade(45), Broward(48), Polk(42), Osceola(45)

Unknown → 55
```

#### Field 64: Elevation (feet)
```javascript
// Critical for FL flood risk/insurance
IF elevation < 0:  score = 5    // Below sea level
IF elevation < 3:  score = 15   // Very low
IF elevation < 5:  score = 28   // Low
IF elevation < 7:  score = 42
IF elevation < 10: score = 55   // Average coastal FL
IF elevation < 15: score = 72
IF elevation < 20: score = 85
IF elevation < 30: score = 95
IF elevation < 50: score = 100  // Excellent (rare coastal)
IF elevation >= 50: score = 95
```

#### Field 66: Elementary Rating (0-10 scale)
```javascript
// Convert letter grades if needed:
// A+→10, A→9.5, A-→9, B+→8.5, B→8, B-→7.5, etc.

IF rating >= 9:  score = 100  // A/A+
IF rating >= 8:  score = 90   // B+/A-
IF rating >= 7:  score = 78   // B
IF rating >= 6:  score = 65   // B-/C+
IF rating >= 5:  score = 50   // C
IF rating >= 4:  score = 38   // C-/D+
IF rating >= 3:  score = 25   // D
IF rating < 3:   score = 15   // F
```

#### Field 67: Elementary Distance (miles)
```javascript
IF distance <= 0.25: score = 100  // Very close
IF distance <= 0.5:  score = 95   // Walking distance
IF distance <= 1.0:  score = 85   // Bikeable
IF distance <= 2.0:  score = 72   // Short drive
IF distance <= 3.0:  score = 60
IF distance <= 5.0:  score = 48
IF distance <= 7.0:  score = 35
IF distance > 7.0:   score = 22
```

#### Field 69: Middle School Rating
```
Use same formula as Field 66 (Elementary Rating)
```

#### Field 70: Middle School Distance (miles)
```javascript
// Bus service more common
IF distance <= 0.5:  score = 100
IF distance <= 1.0:  score = 90
IF distance <= 2.0:  score = 78
IF distance <= 4.0:  score = 65
IF distance <= 6.0:  score = 52
IF distance <= 10.0: score = 38
IF distance > 10.0:  score = 25
```

#### Field 72: High School Rating
```
Use same formula as Field 66 (Elementary Rating)
```

#### Field 73: High School Distance (miles)
```javascript
// Students often drive
IF distance <= 1.0:  score = 100
IF distance <= 2.0:  score = 88
IF distance <= 4.0:  score = 75
IF distance <= 6.0:  score = 62
IF distance <= 10.0: score = 48
IF distance <= 15.0: score = 35
IF distance > 15.0:  score = 22
```

---

### SECTION J: LOCATION SCORES (Weight: 4.85%)

#### Field 74: Walk Score (0-100)
```javascript
// Pass through, already 0-100
score = MIN(100, MAX(0, walk_score))

Categories:
  90-100: Walker's Paradise
  70-89: Very Walkable
  50-69: Somewhat Walkable
  25-49: Car-Dependent
  0-24: Almost All Errands Require Car
```

#### Field 75: Transit Score (0-100)
```javascript
score = MIN(100, MAX(0, transit_score))
```

#### Field 76: Bike Score (0-100)
```javascript
score = MIN(100, MAX(0, bike_score))
```

#### Field 77: Safety Score
```javascript
// May be 0-100 or text descriptors
IF text:
  "excellent" OR "very safe" → 95
  "good" OR "safe" → 80
  "average" OR "moderate" → 60
  "below average" OR "caution" → 40
  "poor" OR "unsafe" → 20

IF numeric AND <= 10: score = value * 10  // Convert 0-10 to 0-100
ELSE: score = value
```

#### Field 78: Noise Level
```javascript
IF "quiet" OR "low" OR "peaceful" OR "silent": score = 100
IF "moderate" OR "average" OR "normal": score = 70
IF "busy" OR "active": score = 55
IF "loud" OR "high" OR "noisy": score = 30

// If dB provided:
IF db < 40:  score = 100  // Library quiet
IF db < 55:  score = 85   // Residential
IF db < 65:  score = 70   // Conversation level
IF db < 75:  score = 50   // Near busy road
IF db >= 75: score = 25   // Airport/highway
```

#### Field 79: Traffic Level
```javascript
IF "light" OR "low" OR "minimal": score = 100
IF "moderate" OR "average" OR "normal": score = 70
IF "heavy" OR "high" OR "congested": score = 35
IF "rush hour" OR "peak": score = 55
```

#### Field 81: Public Transit Access
```javascript
IF "rail" OR "metro" OR "subway" OR "trolley": score = 100
IF "multiple" OR "several" OR "excellent": score = 95
IF "bus" AND ("frequent" OR "regular"): score = 75
IF "bus": score = 60
IF "limited" OR "minimal": score = 35
IF "none" OR "no public": score = 20
```

#### Field 82: Commute to City Center (minutes)
```javascript
IF minutes <= 15: score = 100  // Excellent
IF minutes <= 30: score = 85   // Good
IF minutes <= 45: score = 65   // Moderate
IF minutes <= 60: score = 45   // Long
IF minutes > 60:  score = 25   // Very long
```

---

### SECTION F: INTERIOR FEATURES (Weight: 0.97%)

#### Field 49: Flooring Type
```javascript
IF "marble" OR "travertine" OR "natural stone" OR "porcelain": score = 95
IF "hardwood" OR "wood" OR "engineered wood": score = 85
IF "tile" OR "ceramic": score = 80  // Ideal for FL humidity
IF "luxury vinyl" OR "lvp" OR "lvt": score = 70
IF "laminate": score = 55
IF "carpet": score = 40  // Not ideal for FL humidity
```

#### Field 50: Kitchen Features (text analysis)
```javascript
base_score = 40

Premium countertops:
  "granite" OR "quartz" OR "marble" OR "quartzite" → +20

Premium appliances:
  "stainless" OR "sub-zero" OR "viking" OR "wolf" OR "thermador" OR "miele" → +15

Modern features:
  "island" OR "breakfast bar" → +10
  "updated" OR "renovated" OR "remodeled" → +10
  "walk-in pantry" OR "butler" → +5

MAX score = 100
```

#### Field 51: Appliances Included (count)
```javascript
Essential appliances: refrigerator, range, oven, dishwasher, microwave
Bonus appliances: washer, dryer, wine cooler, ice maker

essentialScore = MIN(60, essentialCount * 12)
bonusScore = MIN(40, bonusCount * 10)
finalScore = MIN(100, essentialScore + bonusScore)
```

#### Field 52: Fireplace Y/N
```javascript
IF has_fireplace = true: score = 70  // Ambiance value, not essential in FL
IF has_fireplace = false: score = 50  // Neutral in FL
```

---

### SECTION G: EXTERIOR FEATURES (Weight: 1.94%)

#### Field 54: Pool Y/N
```javascript
// CRITICAL for Florida market
IF has_pool = true:  score = 100  // Major FL amenity
IF has_pool = false: score = 35   // Significant disadvantage
```

#### Field 55: Pool Type
```javascript
IF "heated" OR "saltwater" OR "infinity" OR "resort": score = 100
IF "in-ground" OR "inground" OR "gunite" OR "fiberglass": score = 90
IF "screen" OR "lanai": score = 85  // Ideal for FL (bugs)
IF "community" OR "hoa": score = 60
IF "above-ground" OR "aboveground": score = 45
IF no pool: score = 30
```

#### Field 56: Deck/Patio (text analysis)
```javascript
base_score = 50

IF "screened" OR "lanai": score += 25  // Essential in FL
IF "covered" OR "roof": score += 15
IF "paver" OR "travertine" OR "stone": score += 15
IF "outdoor kitchen" OR "summer kitchen": score += 20
IF "pergola" OR "gazebo": score += 10
IF "deck" OR "patio": score += 10

MAX score = 100
```

#### Field 57: Fence
```javascript
IF "privacy" OR "block" OR "masonry" OR "stucco": score = 90
IF "aluminum" OR "wrought iron" OR "ornamental": score = 85
IF "vinyl" OR "pvc": score = 75  // Low maintenance
IF "wood" OR "cedar": score = 65  // Needs maintenance in FL
IF "chain link" OR "chainlink": score = 45
IF "partial": score = 55
IF "none" OR "no fence": score = 30
```

#### Field 58: Landscaping (text analysis)
```javascript
base_score = 50

IF "professional" OR "mature" OR "lush" OR "tropical": score += 25
IF "irrigation" OR "sprinkler": score += 15
IF "palm" OR "fruit tree" OR "citrus": score += 10
IF "lighting" OR "landscape light": score += 10
IF "xeriscaping" OR "drought": score += 10
IF "minimal" OR "basic": score = 45
IF "needs work" OR "overgrown": score = 25

MAX score = 100
```

---

### SECTION H: PERMITS & RENOVATIONS (Weight: 0.49%)

#### Field 59: Recent Renovations (text analysis)
```javascript
base_score = 40

IF "complete" OR "full renovation" OR "gut renovation": score = 100

Major renovations (additive):
  "kitchen" → +20
  "bathroom" OR "bath" → +15
  "roof" → +15
  "hvac" OR "ac" → +10
  "electrical" → +10
  "plumbing" → +10
  "window" → +10
  "flooring" OR "floor" → +8
  "paint" → +5

Recent bonus (if year mentioned):
  Within 2 years → +10
  Within 5 years → +5

MAX score = 100
```

#### Field 60: Permit History - Roof
```javascript
current_year = 2025
age = current_year - permit_year

IF age <= 5:  score = 100  // Recent permitted roof
IF age <= 10: score = 85   // Permitted roof 6-10 yrs
IF age <= 15: score = 65   // Older permitted roof
IF age > 15:  score = 45   // Old roof permit
IF no permit: score = 40
```

#### Field 61: Permit History - HVAC
```javascript
age = current_year - permit_year

IF age <= 5:  score = 100  // Recent permitted HVAC
IF age <= 10: score = 80   // Permitted HVAC 6-10 yrs
IF age <= 15: score = 55   // Older permitted HVAC
IF age > 15:  score = 35   // Old HVAC permit (likely needs replacement)
IF no permit: score = 40
```

#### Field 62: Permit History - Other (text analysis)
```javascript
base_score = 50

IF "pool" AND "permit": score += 15
IF "electrical" AND "permit": score += 10
IF "addition" AND "permit": score += 15
IF "remodel" AND "permit": score += 10

Negative indicators:
  "violation" OR "unpermitted": score -= 25
  "open permit" OR "not closed": score -= 15

MIN score = 20, MAX score = 100
```

---

### SECTION K: DISTANCES & AMENITIES (Weight: 1.94%)

#### Field 83: Distance to Grocery (miles)
```javascript
IF distance <= 0.5:  score = 100  // Within 0.5 mi
IF distance <= 1:    score = 95   // Within 1 mi
IF distance <= 2:    score = 85   // Within 2 mi
IF distance <= 3:    score = 75   // Within 3 mi
IF distance <= 5:    score = 60   // Within 5 mi
IF distance <= 10:   score = 40   // Within 10 mi
IF distance > 10:    score = 25   // Rural area
```

#### Field 84: Distance to Hospital (miles)
```javascript
// Critical for FL retiree population
IF distance <= 3:  score = 100  // Within 3 mi
IF distance <= 5:  score = 90   // Within 5 mi
IF distance <= 10: score = 75   // Within 10 mi
IF distance <= 15: score = 60   // Within 15 mi
IF distance <= 20: score = 45   // Within 20 mi
IF distance > 20:  score = 25   // Concern for emergencies
```

#### Field 85: Distance to Airport (miles)
```javascript
// Sweet spot: 10-25 miles (convenient but no noise)
IF distance < 3:   score = 40  // Too close - noise
IF distance <= 5:  score = 55  // Near airport - potential noise
IF distance <= 10: score = 75  // Convenient
IF distance <= 20: score = 90  // IDEAL
IF distance <= 30: score = 80  // Acceptable
IF distance <= 45: score = 60
IF distance > 45:  score = 40  // Inconvenient
```

#### Field 86: Distance to Park (miles)
```javascript
IF distance <= 0.25: score = 100  // Within 0.25 mi
IF distance <= 0.5:  score = 95   // Within 0.5 mi
IF distance <= 1:    score = 85   // Within 1 mi
IF distance <= 2:    score = 70   // Within 2 mi
IF distance <= 3:    score = 55   // Within 3 mi
IF distance <= 5:    score = 40   // Within 5 mi
IF distance > 5:     score = 30   // No park nearby
```

#### Field 87: Distance to Beach (miles)
```javascript
// CRITICAL for Florida coastal market
IF distance <= 0.5:  score = 100  // Beachfront
IF distance <= 1:    score = 95   // Beach within 1 mi
IF distance <= 2:    score = 85   // Beach within 2 mi
IF distance <= 5:    score = 75   // Beach within 5 mi
IF distance <= 10:   score = 60   // Beach within 10 mi
IF distance <= 20:   score = 45   // Beach within 20 mi
IF distance <= 50:   score = 30   // Beach within 50 mi
IF distance > 50:    score = 20   // Inland - no beach access
```

---

### SECTION L: SAFETY & CRIME (Weight: 3.88%)

#### Field 88: Violent Crime Index
```javascript
// Index where 100 = national average, lower = safer

IF index <= 20:  score = 100  // Very low
IF index <= 40:  score = 90   // Low
IF index <= 60:  score = 75   // Below average
IF index <= 80:  score = 60   // Slightly below average
IF index <= 100: score = 50   // National average
IF index <= 150: score = 35   // Above average
IF index <= 200: score = 20   // High
IF index > 200:  score = 10   // Very high

Text descriptors:
  "very low" OR "minimal" → 95
  "low" OR "below average" → 80
  "average" OR "moderate" → 55
  "above average" OR "high" → 30
  "very high" OR "extreme" → 10
```

#### Field 89: Property Crime Index
```javascript
// Same scoring as Field 88 (Violent Crime Index)

IF index <= 20:  score = 100
IF index <= 40:  score = 90
IF index <= 60:  score = 75
IF index <= 80:  score = 60
IF index <= 100: score = 50
IF index <= 150: score = 35
IF index <= 200: score = 20
IF index > 200:  score = 10
```

#### Field 90: Neighborhood Safety Rating
```javascript
// Letter grades:
A+/A = 100/95, A- = 90
B+/B/B- = 85/80/75
C+/C/C- = 65/60/55
D+/D/D- = 45/40/35
F = 20

// Numeric 1-10:
score = rating * 10

// Numeric 0-100:
score = rating

// Text:
"excellent" OR "very safe" → 95
"good" OR "safe" → 75
"fair" OR "moderate" → 55
"poor" OR "unsafe" → 30
```

---

### SECTION M: MARKET & INVESTMENT (Weight: 7.77%)

#### Field 91: Days on Market
```javascript
// Florida market context: Median ~45 days

IF days <= 7:   score = 100  // HOT listing
IF days <= 14:  score = 95   // Very active
IF days <= 30:  score = 88   // Normal
IF days <= 60:  score = 70   // Average
IF days <= 90:  score = 55   // Slower
IF days <= 120: score = 40   // Stale
IF days <= 180: score = 28   // Very stale
IF days > 180:  score = 15   // Motivated seller likely
```

#### Field 92: Price Change Count
```javascript
IF changes = 0: score = 100  // No reductions
IF changes = 1: score = 75   // One adjustment
IF changes = 2: score = 60   // Two adjustments
IF changes = 3: score = 45   // Multiple reductions
IF changes >= 4: score = 30  // Desperation indicator
```

#### Field 93: Price Change Total %
```javascript
// Negative = price reduced

IF change > 0:    score = 60   // Price increase (unusual)
IF change = 0:    score = 100  // No change
IF change > -2%:  score = 95   // Minor adjustment
IF change > -5%:  score = 85   // Small reduction
IF change > -10%: score = 70   // Moderate reduction
IF change > -15%: score = 55   // Significant reduction
IF change > -20%: score = 40   // Major reduction
IF change <= -20%: score = 25  // Desperate seller
```

#### Field 94: Price History Trend
```javascript
IF "increasing" OR "up" OR "rising": score = 60
IF "stable" OR "flat" OR "unchanged": score = 100
IF "decreasing" OR "down" OR "falling": score = 85  // Opportunity
IF "volatile" OR "fluctuating": score = 50
```

#### Field 95: List to Sale Ratio (%)
```javascript
// 100% = sold at ask, <100% = below ask, >100% = above ask

IF ratio >= 105%: score = 60   // Overpriced historically
IF ratio >= 100%: score = 75   // Sold at/above ask
IF ratio >= 98%:  score = 88   // Sold near ask
IF ratio >= 95%:  score = 100  // Solid market (2-5% below)
IF ratio >= 90%:  score = 95   // Negotiable market
IF ratio >= 85%:  score = 85   // Soft market
IF ratio < 85%:   score = 70   // Weak market
```

#### Field 96: Absorption Rate (months)
```javascript
// Months of inventory at current sales pace

IF rate < 3:  score = 100  // Hot seller's market
IF rate < 5:  score = 85   // Seller's market
IF rate < 6:  score = 70   // Balanced market
IF rate < 8:  score = 55   // Buyer's market
IF rate < 12: score = 40   // Slow market
IF rate >= 12: score = 25  // Very slow market
```

#### Field 97: Median Price YoY %
```javascript
// Year-over-year appreciation

IF appreciation < -10%: score = 20  // Declining market
IF appreciation < -5%:  score = 35
IF appreciation < 0%:   score = 45
IF appreciation < 3%:   score = 60  // Slow growth
IF appreciation < 6%:   score = 75  // Healthy growth
IF appreciation < 10%:  score = 90  // Strong growth
IF appreciation < 15%:  score = 100 // Excellent FL market
IF appreciation < 20%:  score = 90
IF appreciation >= 20%: score = 70  // Bubble risk
```

#### Field 98: Inventory Level
```javascript
IF "very low" OR "minimal": score = 100  // Seller's market
IF "low": score = 85
IF "moderate" OR "normal": score = 70
IF "high": score = 50
IF "very high" OR "excess": score = 30  // Buyer's market
```

#### Field 99: Market Velocity
```javascript
IF "hot" OR "very fast" OR "rapid": score = 100
IF "fast" OR "quick": score = 85
IF "moderate" OR "normal" OR "average": score = 70
IF "slow": score = 50
IF "very slow" OR "stagnant": score = 30
```

#### Field 100: Comp Sales 3mo Count
```javascript
// More comps = more liquid market

IF count >= 20: score = 100  // Very active
IF count >= 15: score = 90
IF count >= 10: score = 80
IF count >= 6:  score = 65
IF count >= 3:  score = 50
IF count < 3:   score = 35   // Illiquid market
```

#### Field 101: Cap Rate % (for investment)
```javascript
// Gross cap rate = (annual_rent / purchase_price) * 100

IF cap_rate >= 8%:  score = 100  // Excellent investment
IF cap_rate >= 7%:  score = 90
IF cap_rate >= 6%:  score = 80
IF cap_rate >= 5%:  score = 65   // Average FL market
IF cap_rate >= 4%:  score = 50
IF cap_rate >= 3%:  score = 35
IF cap_rate < 3%:   score = 20   // Poor investment
```

#### Field 102: Rental Demand
```javascript
IF "very high" OR "strong" OR "excellent": score = 100
IF "high" OR "good": score = 85
IF "moderate" OR "average": score = 65
IF "low": score = 45
IF "very low" OR "poor": score = 25
```

---

### SECTION N: UTILITIES (Weight: 0.49%)

#### Field 105: Average Electric Bill
```javascript
// FL average: $130-150/month

IF bill <= 80:   score = 100  // Very low
IF bill <= 100:  score = 90   // Low
IF bill <= 130:  score = 75   // Below average
IF bill <= 160:  score = 60   // Average
IF bill <= 200:  score = 45   // Above average
IF bill <= 250:  score = 30   // High
IF bill > 250:   score = 20   // Very high
```

#### Field 107: Average Water Bill
```javascript
// FL average: $40-60/month

IF bill <= 30:  score = 100  // Very low
IF bill <= 45:  score = 85   // Low
IF bill <= 60:  score = 70   // Average
IF bill <= 80:  score = 55   // Above average
IF bill <= 100: score = 40   // High
IF bill > 100:  score = 25   // Very high
```

#### Field 109: Natural Gas Available
```javascript
IF "yes" OR "available" OR "connected": score = 80
IF "propane" OR "tank": score = 60
IF "no" OR "all electric": score = 55  // Common in FL, not major disadvantage
```

#### Field 111: Internet Providers Top 3 (count)
```javascript
IF count >= 4: score = 100  // Excellent competition
IF count = 3:  score = 85   // Good options
IF count = 2:  score = 70   // Limited choice
IF count = 1:  score = 50   // Monopoly
IF count = 0:  score = 30   // No providers listed
```

#### Field 112: Max Internet Speed (Mbps)
```javascript
IF speed >= 1000: score = 100  // Gigabit+
IF speed >= 500:  score = 90   // 500+ Mbps
IF speed >= 300:  score = 80   // 300+ Mbps
IF speed >= 100:  score = 65   // 100+ Mbps
IF speed >= 50:   score = 50   // 50-100 Mbps
IF speed >= 25:   score = 35   // 25-50 Mbps
IF speed < 25:    score = 20   // Slow (<25 Mbps)
```

#### Field 113: Fiber Available Y/N
```javascript
IF "yes" OR "available" OR "ftth": score = 100  // Future-proof
IF "coming soon" OR "planned": score = 70
IF "no" OR "not available": score = 35
```

#### Field 115: Cell Coverage Quality
```javascript
IF "excellent" OR "5 bars" OR "strong": score = 100
IF "good" OR "4 bars": score = 85
IF "average" OR "fair" OR "3 bars": score = 65
IF "weak" OR "poor" OR "2 bars": score = 40
IF "no signal" OR "none" OR "1 bar": score = 15
```

#### Field 116: Emergency Services Distance
```javascript
// Response time if minutes:
IF minutes <= 5:  score = 100
IF minutes <= 8:  score = 85
IF minutes <= 12: score = 70
IF minutes <= 15: score = 55
IF minutes > 15:  score = 35

// Distance if miles:
IF miles <= 2:  score = 100
IF miles <= 5:  score = 85
IF miles <= 10: score = 65
IF miles <= 15: score = 45
IF miles > 15:  score = 30
```

---

### SECTION O: ENVIRONMENT & RISK (Weight: 8.74%)

#### Field 117: Air Quality Index (AQI)
```javascript
// EPA AQI Scale

IF aqi <= 50:  score = 100  // Good
IF aqi <= 100: score = 80   // Moderate
IF aqi <= 150: score = 55   // Unhealthy for sensitive
IF aqi <= 200: score = 30   // Unhealthy
IF aqi > 200:  score = 10   // Very unhealthy/hazardous
```

#### Field 118: Air Quality Grade
```javascript
Grade A: score = 100
Grade B: score = 80
Grade C: score = 60
Grade D: score = 40
Grade F: score = 20
```

#### Field 119: Flood Zone
```javascript
// CRITICAL FOR FLORIDA

Zone X/C: score = 100  // Minimal risk (~$450/yr insurance)
Zone X500: score = 85  // 0.2% annual chance
Zone B: score = 80     // Moderate risk
Zone A/AE/AO/AH/AR: score = 30  // HIGH risk (~$2,500+/yr insurance)
Zone V/VE/VH: score = 10  // COASTAL HIGH HAZARD (~$5,000+/yr insurance, wave action)
Zone D: score = 50     // Undetermined
```

#### Field 120: Flood Risk Level
```javascript
IF "minimal" OR "very low" OR "negligible": score = 100
IF "low": score = 85
IF "moderate" OR "medium": score = 55
IF "high": score = 25
IF "very high" OR "extreme" OR "severe": score = 10
```

#### Field 121: Climate Risk
```javascript
IF "minimal" OR "very low": score = 100
IF "low": score = 85
IF "moderate" OR "medium": score = 60
IF "high": score = 30
IF "very high" OR "extreme" OR "severe": score = 15
```

#### Field 122: Wildfire Risk
```javascript
// Generally low in FL coastal

IF "minimal" OR "very low" OR "none": score = 100
IF "low": score = 90
IF "moderate" OR "medium": score = 65
IF "high": score = 35
IF "very high" OR "extreme": score = 15
```

#### Field 123: Earthquake Risk
```javascript
// Very low seismic activity in FL

IF "minimal" OR "very low" OR "none" OR "negligible": score = 100
IF "low": score = 90
IF "moderate" OR "medium": score = 60
IF "high": score = 30
```

#### Field 124: Hurricane Risk
```javascript
// CRITICAL FOR FLORIDA COASTAL

IF "minimal" OR "very low": score = 100  // Inland FL
IF "low": score = 85
IF "moderate" OR "medium": score = 55  // Typical FL coastal
IF "high": score = 35  // Verify impact windows/shutters
IF "very high" OR "extreme": score = 15  // Critical insurance concern
```

#### Field 125: Tornado Risk
```javascript
// FL has notable tornado activity

IF "minimal" OR "very low": score = 100
IF "low": score = 85
IF "moderate" OR "medium": score = 60  // Common in FL
IF "high": score = 35
IF "very high" OR "extreme": score = 15
```

#### Field 126: Radon Risk
```javascript
// Generally low in FL

IF "minimal" OR "very low" OR "low": score = 100
IF "moderate" OR "medium": score = 65
IF "high" OR "elevated": score = 30
```

#### Field 127: Superfund Site Nearby
```javascript
IF "no" OR "none" OR "not near" OR "false": score = 100
IF "5+ miles away": score = 85
IF "2-5 miles": score = 60
IF "yes" OR "true" OR "near" OR "within": score = 20
IF "adjacent" OR "immediate": score = 5  // Major concern
```

#### Field 128: Sea Level Rise Risk
```javascript
// CRITICAL FOR FLORIDA COASTAL

IF "minimal" OR "very low" OR "none": score = 100  // High elevation
IF "low": score = 85
IF "moderate" OR "medium": score = 55  // 30-year concern
IF "high": score = 30  // Long-term value concern
IF "very high" OR "extreme" OR "critical": score = 10

// Or by elevation:
IF elevation >= 15ft: score = 100
IF elevation >= 10ft: score = 80
IF elevation >= 6ft:  score = 55
IF elevation < 6ft:   score = 30
```

#### Field 129: Noise Level dB
```javascript
IF db < 35:  score = 100  // Library quiet
IF db < 45:  score = 90   // Residential quiet
IF db < 55:  score = 75   // Conversation level
IF db < 65:  score = 55   // Moderately noisy
IF db < 75:  score = 35   // Noisy (busy road)
IF db >= 75: score = 15   // Very noisy (airport/highway)
```

#### Field 130: Solar Potential
```javascript
// FL has excellent solar potential statewide

IF "excellent" OR "very high" OR "optimal": score = 100
IF "good" OR "high": score = 85
IF "moderate" OR "medium" OR "average": score = 65
IF "low" OR "poor": score = 40  // Shading concerns
IF "minimal" OR "very low": score = 20
```

---

### SECTION P: ADDITIONAL FEATURES (Weight: 0.00%)

#### Field 131: View Type
```javascript
IF "ocean" OR "gulf" OR "beachfront": score = 100  // Premium FL
IF "bay" OR "harbor" OR "marina": score = 95
IF "water" OR "lake" OR "river" OR "canal" OR "intercoastal": score = 85
IF "golf" OR "fairway": score = 80
IF "sunset" OR "sunrise": score = 75
IF "pool" OR "garden" OR "preserve" OR "conservation" OR "nature": score = 70
IF "city" OR "skyline": score = 65
IF "courtyard" OR "landscape": score = 55
IF "parking" OR "street" OR "none": score = 30
```

#### Field 132: Lot Features (text analysis)
```javascript
base_score = 40

Premium features (additive):
  "waterfront" OR "water view" → +25
  "corner" → +20
  "cul-de-sac" → +15
  "oversized" OR "large" → +15
  "golf" OR "preserve" → +15
  "private" OR "secluded" → +12
  "wooded" OR "mature trees" → +10
  "fenced" → +8
  "level" OR "flat" → +5

Negative features:
  "flood zone" OR "wetland" → -15
  "easement" → -10
  "power lines" OR "utility" → -10

MIN score = 20, MAX score = 100
```

#### Field 133: EV Charging
```javascript
IF "yes" OR "installed" OR "level 2" OR "240v": score = 90
IF "pre-wired" OR "ready" OR "capable": score = 75
IF "outlet" OR "120v": score = 60  // Basic outlet
IF "no" OR "not available": score = 40
```

#### Field 134: Smart Home Features (text analysis)
```javascript
base_score = 40

Features (additive):
  "thermostat" OR "nest" OR "ecobee" → +15
  "security" OR "camera" OR "alarm" → +15
  "automation" OR "whole home" → +15
  "lighting" OR "smart light" → +10
  "lock" OR "keyless" → +10
  "speaker" OR "alexa" OR "google home" → +10
  "doorbell" OR "ring" → +8
  "garage" OR "opener" → +5

MAX score = 100
```

#### Field 135: Accessibility Modifications (text analysis)
```javascript
IF "none" OR "no" OR "n/a": score = 50  // Neutral

Features (additive from base 50):
  "wheelchair" OR "ada" → +25
  "step-in shower" OR "walk-in shower" → +15
  "elevator" OR "lift" → +20
  "ramp" → +15
  "first floor master" OR "main floor master" → +15
  "grab bar" OR "handrail" → +10
  "wide door" OR "wide hall" → +10
  "single story" OR "one story" → +10

MAX score = 100
```

#### Field 136: Pet Policy
```javascript
IF "no restrictions" OR "no limit" OR "all pets" OR "pets allowed": score = 100
IF "dogs" AND "cats": score = 85
IF "2 pets" OR "two pets": score = 75
IF "1 pet" OR "one pet" OR "small": score = 60
IF "weight limit" OR "size limit": score = 55
IF "no pets" OR "pets not allowed" OR "prohibited": score = 25
```

#### Field 137: Age Restrictions
```javascript
IF "none" OR "no" OR "no restriction" OR "all ages": score = 80  // Broader market
IF "55+" OR "55 and over" OR "senior": score = 65  // Limited but strong FL market
IF "62+" OR "65+": score = 55  // More restricted
```

#### Field 138: Special Assessments
```javascript
IF "none" OR "no" OR "n/a" OR "$0": score = 100

By amount:
IF amount <= 1000:  score = 85   // Minor (<$1k)
IF amount <= 5000:  score = 65   // Moderate ($1k-$5k)
IF amount <= 15000: score = 45   // Significant ($5k-$15k)
IF amount <= 30000: score = 30   // Major ($15k-$30k)
IF amount > 30000:  score = 15   // Very high (>$30k)

IF "pending" OR "possible" OR "planned": score = 50
IF "paid" OR "complete": score = 90
```

---

### SECTION Q: PARKING (Weight: 0.00%)

#### Field 139: Carport Y/N
```javascript
IF has_carport = true: score = 70  // Vehicle protection
IF has_carport = false: score = 50
```

#### Field 140: Carport Spaces
```javascript
IF spaces = 0: score = 45
IF spaces = 1: score = 65
IF spaces = 2: score = 80
IF spaces >= 3: score = 90
```

#### Field 141: Garage Attached Y/N
```javascript
IF attached = true: score = 90  // Convenient access
IF attached = false: score = 60  // Detached or no garage
```

#### Field 142: Parking Features (text analysis)
```javascript
base_score = 40

Features (additive):
  "covered" → +15
  "rv" OR "boat" → +15
  "garage door opener" → +10
  "circular" → +10
  "guest" → +10
  "assigned" → +5
  "paved" → +5
  "lighted" → +5

MAX score = 100
```

#### Field 143: Assigned Parking Spaces
```javascript
IF spaces = 0: score = 35  // No assigned parking
IF spaces = 1: score = 60  // 1 assigned space
IF spaces = 2: score = 85  // 2 assigned spaces
IF spaces >= 3: score = 100  // 3+ assigned spaces
```

---

### SECTION R: BUILDING (Weight: 0.00%)

#### Field 144: Floor Number
```javascript
// For condos - higher floors = better views

IF floor = 0 OR floor = 1: score = 60  // Ground floor
IF floor <= 3:  score = 70  // Lower floors
IF floor <= 5:  score = 80  // Mid floors
IF floor <= 10: score = 88  // Upper floors
IF floor <= 20: score = 95  // High floors
IF floor > 20:  score = 100 // Penthouse level
```

#### Field 147: Building Elevator Y/N
```javascript
IF has_elevator = true: score = 90  // Essential for upper floors
IF has_elevator = false: score = 45  // Walk-up only
```

#### Field 148: Floors in Unit
```javascript
IF floors = 1: score = 60  // Single-level
IF floors = 2: score = 85  // 2-story townhome
IF floors = 3: score = 90  // 3-story
IF floors >= 4: score = 95  // 4+ story multi-level
```

---

### SECTION S: LEGAL (Weight: 0.00%)

#### Field 151: Homestead Y/N
```javascript
// Homestead exemption saves ~$500-1000+/year in FL

IF has_homestead = true: score = 85  // Tax savings
IF has_homestead = false: score = 50
```

#### Field 152: CDD Y/N
```javascript
// Community Development District = additional annual fees

IF has_CDD = true: score = 40  // Additional cost
IF has_CDD = false: score = 90  // No CDD fees
```

#### Field 153: Annual CDD Fee
```javascript
IF fee = 0:         score = 100  // No CDD
IF fee <= 500:      score = 90   // Low (<$500/yr)
IF fee <= 1000:     score = 75   // Moderate ($500-$1k/yr)
IF fee <= 2000:     score = 55   // Average ($1k-$2k/yr)
IF fee <= 3000:     score = 40   // High ($2k-$3k/yr)
IF fee <= 5000:     score = 25   // Very high ($3k-$5k/yr)
IF fee > 5000:      score = 15   // Extreme (>$5k/yr)
```

#### Field 154: Front Exposure
```javascript
// FL context: North-facing is coolest

IF "north": score = 90      // Coolest in FL
IF "east": score = 80       // Morning sun
IF "northeast": score = 85  // Good for FL
IF "south": score = 60      // More sun exposure
IF "southeast": score = 65
IF "west": score = 50       // Hot afternoon sun in FL
IF "southwest": score = 45  // Hot in FL
IF "northwest": score = 75
```

---

### SECTION T: WATERFRONT (Weight: 5.83%)

#### Field 155: Water Frontage Y/N
```javascript
// Waterfront commands massive premium in FL

IF has_waterfront = true: score = 100  // Premium FL property
IF has_waterfront = false: score = 30  // Not waterfront
```

#### Field 156: Waterfront Feet
```javascript
IF feet = 0:      score = 30   // No waterfront
IF feet <= 50:    score = 70   // Limited (<50 ft)
IF feet <= 100:   score = 85   // Moderate (50-100 ft)
IF feet <= 200:   score = 95   // Good (100-200 ft)
IF feet > 200:    score = 100  // Extensive (200+ ft)
```

#### Field 157: Water Access Y/N
```javascript
// Boat access to open water

IF has_access = true: score = 95  // Boat to open water
IF has_access = false: score = 40  // No water access
```

#### Field 158: Water View Y/N
```javascript
IF has_view = true: score = 85  // Water view property
IF has_view = false: score = 35  // No water view
```

#### Field 159: Water Body Name
```javascript
// Type of water affects value

IF "gulf" OR "ocean" OR "atlantic": score = 100  // Maximum premium
IF "bay" OR "tampa bay" OR "biscayne": score = 95  // High premium
IF "intercoastal" OR "intracoastal" OR "icw": score = 90  // Great access
IF "river" OR "inlet": score = 80
IF "lake": score = 75  // Lakefront
IF "canal": score = 70
IF "pond" OR "lagoon": score = 55
IF "preserve" OR "wetland": score = 50
```

---

### SECTION U: LEASING (Weight: 0.00%)

#### Field 160: Can Be Leased Y/N
```javascript
IF can_lease = true: score = 90  // Investment flexibility
IF can_lease = false: score = 40  // Leasing not allowed
```

#### Field 161: Minimum Lease Period
```javascript
IF "no minimum" OR "none" OR "any": score = 100  // Maximum flexibility
IF "month" OR "30 day" OR "weekly" OR "short-term": score = 90
IF "3 month" OR "quarterly" OR "90 day": score = 75
IF "6 month" OR "180 day": score = 65
IF "1 year" OR "12 month" OR "annual": score = 55  // Most common
IF "2 year" OR "24 month": score = 40  // Restrictive
```

#### Field 162: Lease Restrictions Y/N
```javascript
IF has_restrictions = true: score = 40  // Restrictions in place
IF has_restrictions = false: score = 85  // No restrictions
```

#### Field 165: Association Approval Y/N
```javascript
IF requires_approval = true: score = 45  // Delays
IF requires_approval = false: score = 85  // No approval needed
```

---

### SECTION V: FEATURES (Weight: 0.00%)

#### Field 166: Community Features (text analysis, count features)
```javascript
base_score = 40

Premium amenities (additive):
  "pool" OR "swimming" → +15
  "golf" → +15
  "marina" OR "boat" → +15
  "beach" → +12
  "clubhouse" OR "community center" → +12
  "gym" OR "fitness" → +12
  "gated" → +10
  "tennis" OR "pickleball" → +8
  "playground" OR "park" → +5
  "dog park" OR "pet" → +5
  "sidewalk" OR "walking trail" → +5

MAX score = 100
```

#### Field 167: Interior Features (text analysis, count features)
```javascript
base_score = 40

Premium features (additive):
  "cathedral" OR "vaulted" → +12
  "walk-in closet" → +8
  "main floor" OR "master main" → +10
  "open floor" → +8
  "wood floor" OR "hardwood" → +10
  "crown molding" → +5
  "skylight" → +5
  "wet bar" → +8
  "built-in" → +8
  "wine" → +5
  "tray ceiling" → +5

MAX score = 100
```

#### Field 168: Exterior Features (text analysis, count features)
```javascript
base_score = 40

Premium features (additive):
  "private dock" OR "dock" → +18
  "outdoor kitchen" OR "summer kitchen" → +15
  "screened" → +12
  "hurricane shutter" → +10
  "balcony" → +10
  "sprinkler" OR "irrigation" → +8
  "paver" → +8
  "sliding doors" → +5
  "outdoor shower" → +5
  "lighting" → +5
  "awning" OR "shade" → +5

MAX score = 100
```

---

## 📤 REQUIRED OUTPUT FORMAT

```json
{
  "property1": {
    "zip_code": "34235",
    "location_type": "beach",
    "fieldScores": {
      "6": {
        "rawValue": "Siesta Key Village",
        "score": 90,
        "reasoning": "Premium beach neighborhood keyword match"
      },
      "11": {
        "rawValue": 325.50,
        "score": 80,
        "reasoning": "Beach area: $325/sqft is good value (between 280-350 range)"
      },
      // ... ALL 138 fields ...
    },
    "sectionScores": {
      "A": {
        "section_name": "Address & Identity",
        "weight": 1.94,
        "field_count": 3,
        "fields_populated": 3,
        "section_average": 86.67,
        "weighted_contribution": 1.68
      },
      "B": {
        "section_name": "Pricing & Value",
        "weight": 17.96,
        "field_count": 5,
        "fields_populated": 5,
        "section_average": 77.2,
        "weighted_contribution": 13.87
      },
      // ... ALL 22 sections ...
    },
    "finalScore": 78.5,
    "calculation_notes": "Strong pricing fundamentals, excellent location"
  },
  "property2": { ... },
  "property3": { ... },
  "metadata": {
    "total_fields_scored": 414,
    "calculation_timestamp": "2025-12-27T12:00:00Z",
    "llm_model": "your-model-name",
    "temperature": 0.1
  }
}
```

---

## 🚫 ANTI-HALLUCINATION RULES

1. ✅ **USE ONLY** the exact formulas provided above
2. ✅ **DO NOT** make up your own scoring logic
3. ✅ **CITE** reasoning for any score that differs from the standard formula
4. ✅ **RETURN NULL** for missing fields (do NOT guess or estimate)
5. ✅ **VALIDATE** that all section weights sum to 100.00%
6. ✅ **ENSURE** all scores are within 0-100 range
7. ✅ **FLAG** any data quality issues in the notes field
8. ✅ **VERIFY** beach vs. inland logic based on zip code
9. ✅ **CALCULATE** ALL 138 fields for ALL 3 properties (414 total scores)
10. ✅ **DOUBLE-CHECK** mathematical formulas before returning

---

## ⚠️ COMMON MISTAKES TO AVOID

❌ **DON'T** use simple averaging without weights
❌ **DON'T** ignore beach vs. inland differentiation
❌ **DON'T** skip fields that have null/missing data (still return score=0)
❌ **DON'T** round prematurely (keep 2 decimals until final)
❌ **DON'T** conflate Section B (Pricing) with Section R (Building)
❌ **DON'T** use outdated Florida market assumptions
❌ **DON'T** return scores outside 0-100 range
❌ **DON'T** hallucinate data that isn't provided

---

**END OF MASTER PROMPT TEMPLATE**

---

**NEXT STEPS FOR LLM:**
1. Read all 3 property data objects
2. Determine location type (beach/inland) for each
3. Score ALL 138 fields using formulas above
4. Calculate 22 section averages
5. Apply industry weights
6. Return complete JSON as specified
