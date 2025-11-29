# CLUES Analytics Dashboard Specification

## ATTESTATION & RULES

**I, Claude, hereby attest with 100% honesty:**
1. I will NOT revert any code without explicit user permission
2. I will TEST all changes before committing
3. I will NOT break existing functionality
4. I will read this file at the start of every session
5. I will follow these specifications exactly

---

## OVERVIEW

- **Total Fields**: 138-140
- **Categories**: 16 (A through P)
- **Charts per Category**: 3
- **Total Charts**: 48
- **Visual Elements (5D)**: 240
- **Dashboard Screens**: 3 (Overview, Categories, Detail)
- **Simultaneous Elements**: 108

---

## DATA TYPE REQUIREMENTS

```
Numbers as numbers: price: 3500000 (NOT "3500000")
Dates as ISO: "2025-11-15"
Categoricals: "EXCELLENT"/"GOOD"/"FAIR", "LOW"/"MOD"/"HIGH"
Booleans: 0/1 for features_*
```

---

## API REQUEST FORMAT

```json
{
  "category": "B",
  "visual": "value-gap",
  "properties": [array of 140-field objects],
  "glassStyle": "neon"
}
```

## API RESPONSE FORMAT

```json
{
  "chartId": "B-value-gap",
  "svgCanvas": "<svg glassmorphic...>",
  "interactiveJS": "bundle.js",
  "dataSummary": {
    "propertiesAnalyzed": 10,
    "webAugmentations": 47,
    "confidence": 98.7
  },
  "crossFilters": ["click property → update all 47 other charts"]
}
```

---

## PERFORMANCE

| Properties | Time |
|------------|------|
| 1 property | 2.3s |
| 10 properties | 4.1s |
| 100 properties | 8.7s |

---

## 5D GLASSMORPHIC DESIGN

```css
backdrop-filter: blur(20px);
box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
background: rgba(255, 255, 255, 0.2);
```

- 2D Base: X/Y scatter, bar height, radial sweep
- 3D Layer: Bubble size, extruded depth, tilt animations
- 4D Motion: Hover expansions, timeline scrubbing, live pulses
- 5D Interactivity: Cross-filtering, drill-down, AR overlays

---

## 16 CATEGORIES (A-P)

### A: Address & Identity (9 fields)
1. PIN-CLUSTER ORBS - Glass sphere clusters by location
2. IDENTITY MATRIX - Table with row glow on hover
3. GEO-DENSITY HEAT - Gulf Coast heatmap

### B: Pricing & Value (7 fields)
1. VALUE-GAP FUNNEL - Assessed→Market→List cascade
2. PRICE/SQFT VIOLIN - Dual density by property type
3. TRIPLE GAUGE - Assessed/Market/Redfin neon rings

### C: Property Basics (13 fields)
1. ROOM SUNBURST - Bed→Bath→Living→Storage rings
2. SPACE EFFICIENCY SCATTER - Living/Total vs $/sqft
3. LAYOUT BARS - Bed/Bath/Garage horizontal bars

### D: HOA & Taxes (9 fields)
1. COST DONUT - Taxes 45% / HOA 25% / Other 30%
2. HOA HEATMAP - Red→Green by annual fee
3. TAX SCATTER - Tax Rate vs Assessed Value

### E: Structure & Systems (10 fields)
1. SYSTEMS RADAR - 8pt star: Roof/HVAC/Foundation
2. AGE→CONDITION TREND - Degradation curve
3. REPLACEMENT BARS - Years left for Roof/HVAC

### F: Interior Features (5 fields)
1. AMENITY HEATMAP - Kitchen/Smart/Fire binary grid
2. FINISH INDEX BAR - Weighted composite score
3. UPLIFT VIOLIN - Features vs $/sqft premium

### G: Exterior Features (5 fields)
1. FEATURE MATRIX - Pool/Deck/EV/Beach heat grid
2. CURB APPEAL RADAR - Multi-axis exterior scores
3. OUTDOOR ROI BUBBLES - Feature count vs premium

### H: Permits & Renovations (4 fields)
1. GANTT TIMELINE - Kitchen 2021, Roof 2025
2. VALUE ADD BARS - Pre $2.6M → Post $3.25M +25%
3. COMPLIANCE GAUGE - 5-dot permit status

### I: Assigned Schools (11 fields)
1. SCHOOL TRIPOD - Triangle: Elem/Middle/High distances
2. FAMILY RADIAL - Weighted avg 8.7/10
3. TIER HEATMAP - Rating color grid

### J: Location Scores (9 fields)
1. EXCELLENCE SPIDER - 9 axes radar
2. 9-GAUGE CLUSTER - Mini neon rings 3x3 grid
3. LOCATION→YIELD SCATTER - Avg score vs cap rate

### K: Distances & Amenities (5 fields)
1. COMMUTE COMPASS - City/Elem/Transit arrows
2. ACCESS TILES - Icon cards with times
3. PROXIMITY→PRICE SCATTER - Avg commute vs $/sqft

### L: Safety & Crime (3 fields)
1. CRIME GAUGE TRIO - Safety/Violent/Property levels
2. SAFETY→YIELD GALAXY - Bubble scatter
3. CRIME HEAT ROW - Horizontal heat cells

### M: Market & Investment (13 fields)
1. ROI HIGHWAY - Today→Year10 sparkline
2. CAP→APPRECIATION BUBBLES - Yield vs growth
3. PULSE TIMELINE - 2020→2025 neighborhood trend

### N: Utilities & Connectivity (13 fields)
1. UTILITY SPECTRUM DONUT - Electric/Water/Gas/Internet
2. CONNECTIVITY→LUXURY SCATTER - Internet vs $/sqft
3. EXPENSE TREND SURFACE - Sqft vs total utilities

### O: Environment & Risk (14 fields)
1. 14-RISK MEGA-RADAR - All risk fields on axes
2. RISK→REWARD MATRIX - Risk composite vs cap rate
3. ENVIRONMENTAL SCORECARD - Air/Solar/Water/Foundation

### P: Additional Features (8 fields)
1. FEATURE FINGERPRINT - Binary heatmap all features
2. PREMIUM ADD-ON INDEX - Weighted sum bar
3. FEATURE UPLIFT VIOLIN - Count vs $/sqft premium

---

## WEB AUGMENTATION SOURCES

| Category | Source |
|----------|--------|
| A: Address | Redfin/Zillow validation |
| B: Pricing | Zestimate/marketEstimate live |
| C: Basics | Public records sqft/bed/bath |
| D: HOA | County tax assessor |
| E: Structure | Permit history searches |
| I: Schools | GreatSchools, district data |
| J: Location | WalkScore API |
| L: Crime | Local police, NeighborhoodScout |
| O: Risk | FEMA, EPA, state agencies |

---

## PROCESSING PIPELINE

```
Parse → Aggregate → Compute Derived → Validate 16 Categories → Render SVG
```

- Categorical → Ordinal: LOW=1, MOD=2, HIGH=3
- Condition → Score: EXCELLENT=10, GOOD=7, FAIR=4
- Computed: age (2025-yearBuilt), ratios, averages

---

## EXECUTIVE OVERVIEW (12 KPI Cards)

- Portfolio Value (neon glass orb, pulses green)
- Avg Cap Rate (radial sweep 43%)
- Safety Avg (multi-risk hazard meter)
- Total Properties
- Avg Price/Sqft
- Avg Appreciation
- Avg Walk Score
- Properties at Risk
- Avg ROI Projection
- Data Completeness
- Web Augmented Fields
- Confidence Score

---

## IMPLEMENTATION NOTES

1. Tab already added: `/perplexity` route with Sparkles icon
2. After integration: Rename to "Analytics Dashboard"
3. Delete broker dashboard and replace
4. Cross-filter: Click property updates all 47 other charts
5. Lazy load charts as categories scroll into view

---

## CATEGORY O: ENVIRONMENT & RISK (14 fields) - WIREFRAMES

### O-1: 14-RISK CONSTELLATION ★★★
```
         Flood●━━━━━●Hurricane
            ╲       ╱
      Fire●━━━━●━━━━●Sinkhole
            ╱   ╲   ╲
   Radon●━━●Center●━━●Coastal
            ╲   ╱   ╱
      Air●━━━━●━━━━●Noise
            ╱       ╲
      Solar●━━━━━━━●Foundation

[RISK composite: 23/100 - LOW]
[Property: 101 Sunrise Cove]
```

### O-2: RISK→REWARD MATRIX
```
Cap Rate
   8%┤    ●PropA(low risk)
     │         ●PropB
   6%┤              ●PropC
     │                   ●PropD(high risk)
   4%┤
     └────┬────┬────┬────┬
         20   40   60   80  Risk Score
         LOW    MOD    HIGH
```

### O-3: ENV GAUGES - Air/Solar/Water [web:22]
```
┌─AIR QUALITY──┐ ┌─SOLAR INDEX──┐ ┌─WATER QUALITY─┐
│    ████████  │ │    ████████  │ │    ████████   │
│     92/100   │ │     87/100   │ │     95/100    │
│   EXCELLENT  │ │     GOOD     │ │   EXCELLENT   │
└──────────────┘ └──────────────┘ └───────────────┘
[Foundation Risk: LOW] [Noise Score: 72]
```

---

## CATEGORY P: ADDITIONAL FEATURES (8 fields) - WIREFRAMES

### P-1: FEATURE MOSAIC - 8x Binary Tiles
```
┌──────┬──────┬──────┬──────┐
│ Pool │ Dock │  EV  │Beach │
│  ✓   │  ✗   │  ✓   │  ✓   │
├──────┼──────┼──────┼──────┤
│Smart │ Fire │Guest │Solar │
│  ✓   │  ✓   │  ✗   │  ✓   │
└──────┴──────┴──────┴──────┘
[6/8 Premium Features Active]
[Property: 101 Sunrise Cove]
```

### P-2: PREMIUM INDEX - Weighted Bar
```
Premium Feature Score
┌────────────────────────────────────┐
│████████████████████░░░░░░░░░░░░░░░│ 67/100
└────────────────────────────────────┘

Breakdown:
Pool (+15)  EV (+10)  Beach (+20)  Smart (+12)  Solar (+10)
[Avg Portfolio: 54/100]
```

### P-3: UPLIFT VIOLIN [web:23]
```
$/sqft Premium
   +$150┤    ╭───╮
        │   ╱     ╲ 6+ features
   +$100┤  ╱       ╲
        │ ╱    ╭────╲────╮
    +$50┤╱    ╱ 3-5 feat  ╲
        │    ╱             ╲
      $0┤───╱───────────────╲───
        └────┬────┬────┬────┬
            0-2  3-4  5-6  7-8  Feature Count

[Web-augmented: Redfin price premium data]
```

---

## ALL 48 CHARTS DOCUMENTED

Categories A-P complete with 3 charts each = 48 total glassmorphic visualizations.

---

## CLAUDE INTEGRATION

### JSON Contract (Backend → Claude)
```json
{
  "instruction": "GENERATE_CHARTS",
  "glassmorphism_style": {
    "theme": "dark",
    "primary_color": "#4f9dff",
    "accent_color": "#ff6bcb",
    "blur_radius": 20,
    "card_opacity": 0.2
  },
  "requested_visuals": [
    { "category": "B", "visual_id": "pricing_value_gap_funnel" },
    { "category": "M", "visual_id": "roi_trajectory_timeline" },
    { "category": "O", "visual_id": "multi_risk_radar" }
  ],
  "properties": [/* array of 140-field property objects */]
}
```

### Data Normalization Rules
- Numbers as numbers (not strings)
- Dates as ISO: "YYYY-MM-DD"
- Conditions: "EXCELLENT" | "GOOD" | "FAIR" | "POOR"
- Risks: Numeric 1-10 OR "LOW" | "MOD" | "HIGH" (consistent)
- Feature flags: 0/1

### Claude System Prompt (paste into system/developer slot)
```
You are a real-estate analytics and visualization engine that outputs
SPECIFICATIONS for glassmorphic 5D charts, not raw UI code.

INPUT:
- JSON payload with instruction, glassmorphism_style, requested_visuals, properties
- All field names match keys exactly (listPrice, capRate, features_pool, etc.)

GOAL:
For each requested_visual, produce JSON describing:
1) Chart type and glassmorphic styling
2) Fields to use from properties
3) Axis/size/color/filter mappings
4) Multi-property and missing value handling

DO NOT invent fields not in properties.
MAY derive metrics from existing fields (totals, ratios, averages).

CHART TYPES:
bar | line | scatter | radar | sunburst | heatmap | gauge | donut | violin | timeline

OUTPUT FORMAT:
{
  "charts": [{
    "chart_id": "B_pricing_value_gap_funnel",
    "category": "B",
    "visual_id": "pricing_value_gap_funnel",
    "title": "Pricing vs Value Gap Funnel",
    "base_type": "bar",
    "data_requirements": {
      "required_fields": ["listPrice", "marketEstimate", "assessedValue"],
      "optional_fields": ["redfinEstimate", "zestimate"],
      "grouping_key": "id"
    },
    "data_mappings": {
      "x_axis": { "field": "id", "label": "Property ID" },
      "y_series": [
        { "field": "assessedValue", "label": "Assessed", "stack_order": 1 },
        { "field": "marketEstimate", "label": "Market", "stack_order": 2 },
        { "field": "listPrice", "label": "List", "stack_order": 3 }
      ],
      "color_encoding": { "strategy": "by_series", "palette": ["#4f9dff","#7cf3ff","#ff6bcb"] }
    },
    "derived_metrics": [{
      "name": "value_gap_percent",
      "formula": "(marketEstimate - listPrice) / marketEstimate"
    }],
    "interactions": { "hover": { "show_tooltip": true }, "click": { "emit_filter_event": true } },
    "glassmorphism": {
      "card_background": "rgba(255,255,255,0.18)",
      "backdrop_blur": 20,
      "border_radius": 24,
      "glow": { "color": "#4f9dff", "blur": 40 }
    },
    "missing_data_handling": {
      "drop_if_missing": ["listPrice", "marketEstimate"],
      "show_warning_badge": true
    }
  }]
}
```

### Visual ID Catalog (48 charts)
| Category | visual_id | base_type |
|----------|-----------|-----------|
| A | address_pin_cluster | scatter |
| A | identity_matrix | heatmap |
| A | geo_density_strip | bar |
| B | pricing_value_gap_funnel | bar |
| B | price_per_sqft_violin | violin |
| B | triple_estimate_gauges | gauge |
| C | room_sunburst | sunburst |
| C | space_efficiency_scatter | scatter |
| C | layout_bar_strips | bar |
| D | annual_cost_donut | donut |
| D | hoa_burden_heatmap | heatmap |
| D | tax_rate_value_scatter | scatter |
| E | systems_health_radar | radar |
| E | age_condition_trend | line |
| E | replacement_horizon_bars | bar |
| F | interior_amenity_heatmap | heatmap |
| F | finish_quality_index_bar | bar |
| F | interior_uplift_violin | violin |
| G | exterior_feature_matrix | heatmap |
| G | curb_appeal_radar | radar |
| G | outdoor_roi_bubbles | scatter |
| H | renovation_timeline | timeline |
| H | upgrade_value_add_bars | bar |
| H | compliance_score_gauge | gauge |
| I | school_tripod_plot | scatter |
| I | family_score_radial | radar |
| I | school_tier_heatmap | heatmap |
| J | location_excellence_spider | radar |
| J | scorecard_cluster | gauge |
| J | location_yield_scatter | scatter |
| K | commute_radar_compass | radar |
| K | access_icon_tiles | card |
| K | proximity_price_scatter | scatter |
| L | crime_gauge_trio | gauge |
| L | safety_yield_scatter | scatter |
| L | crime_heat_row | heatmap |
| M | roi_trajectory_timeline | line |
| M | cap_appreciation_bubbles | scatter |
| M | market_pulse_timeline | line |
| N | utility_cost_donut | donut |
| N | connectivity_luxury_scatter | scatter |
| N | utility_expense_trend | bar |
| O | multi_risk_radar | radar |
| O | risk_reward_matrix | heatmap |
| O | environment_gauges | gauge |
| P | feature_fingerprint_mosaic | heatmap |
| P | premium_index_bar | bar |
| P | feature_uplift_violin | violin |

---

*Last Updated: 2025-11-29*
*Session ID: perplexity-analytics-build*
