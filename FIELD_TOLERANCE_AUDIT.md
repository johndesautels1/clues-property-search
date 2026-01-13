# 181-FIELD CONFLICT TOLERANCE AUDIT

**Conversation ID:** `CLUES-181-AUDIT-20260113`
**Last Updated:** 2026-01-13
**Current Position:** Field 2 (mls_primary)
**Last Fix:** Added comprehensive tolerance rules to semantic-compare.ts
**Primary File:** `src/lib/semantic-compare.ts`

---

## CRITICAL INSTRUCTIONS FOR CLAUDE (READ ON EVERY SESSION)

1. **PROBLEM:** Minor semantic differences flagging as "Conflict Detected" (yellow) or "Low Confidence" (red)
2. **EXAMPLE:** "1118 Carlton Rd" vs "1118 Carlton Road" should NOT be a conflict
3. **TEST ADDRESS:** 1118 Carlton Road, Tarpon Springs, FL 34689
4. **GOAL:** Add tolerance rules for ALL 181 fields to prevent trivial conflicts
5. **CONTINUE FROM:** Check "Current Position" above

---

## FILES TO MODIFY

| File | Purpose |
|------|---------|
| `src/lib/semantic-compare.ts` | Main tolerance logic |
| `api/property/arbitration.ts` | Calls hasRealConflict() |

---

## TOLERANCE RULES NEEDED

### Category 1: Boolean Y/N Fields (20+ fields)
```
RULE: "Yes" = "Y" = "y" = "YES" = true = "TRUE" = "1"
RULE: "No" = "N" = "n" = "NO" = false = "FALSE" = "0"
```

**Fields:** 3, 30, 52, 54, 113, 127, 139, 141, 147, 151, 152, 155, 157, 158, 160, 162, 165, 167C

### Category 2: Address Abbreviations
```
RULE: "Road" = "Rd" = "Rd."
RULE: "Street" = "St" = "St."
RULE: "Avenue" = "Ave" = "Ave."
RULE: "Boulevard" = "Blvd" = "Blvd."
RULE: "Drive" = "Dr" = "Dr."
RULE: "Lane" = "Ln" = "Ln."
RULE: "Court" = "Ct" = "Ct."
RULE: "Circle" = "Cir" = "Cir."
RULE: "North" = "N" = "N."
RULE: "South" = "S" = "S."
RULE: "East" = "E" = "E."
RULE: "West" = "W" = "W."
RULE: "Florida" = "FL" = "Fla"
```

**Fields:** 1, 6, 7, 65, 68, 71, 149

### Category 3: Risk Level Synonyms
```
RULE: "Low" = "Minimal" = "Minor" = "Negligible"
RULE: "Moderate" = "Medium" = "Average"
RULE: "High" = "Elevated" = "Significant"
RULE: "Very Low" = "Minimal" = "None"
```

**Fields:** 77, 88, 89, 90, 118, 120, 121, 122, 123, 124, 125, 126, 128, 130

### Category 4: Property Type Synonyms
```
RULE: "Single Family" = "SFR" = "Single-Family" = "Single Family Residence" = "Detached"
RULE: "Townhouse" = "Townhome" = "TH"
RULE: "Condo" = "Condominium" = "Condo/Co-op"
RULE: "Multi-Family" = "Multifamily" = "Multi Family"
```

**Fields:** 26

### Category 5: Rating Format Normalization
```
RULE: "8/10" = "8" = "8 out of 10" = "8.0"
RULE: Strip "/10" suffix and compare numbers
```

**Fields:** 66, 69, 72, 77

### Category 6: Time/Duration Normalization
```
RULE: "25 min" = "25 minutes" = "25 mins" = "25"
RULE: "6 months" = "6 mo" = "6 mos" = "6-month"
RULE: "10 years" = "10 yrs" = "10"
```

**Fields:** 40, 46, 82, 116, 161

### Category 7: Currency Normalization
```
RULE: "$150" = "150" = "$150.00" = "150.00"
RULE: Strip $ and compare numbers
```

**Fields:** 105, 107, 138

### Category 8: List/Array Comparison
```
RULE: Order-insensitive comparison
RULE: "Pool, Gym" = "Gym, Pool"
RULE: Semicolon = Comma separator
```

**Fields:** 33, 50, 51, 56, 103, 111, 132, 134, 142, 166, 167, 168

### Category 9: Internet Speed Normalization
```
RULE: "1 Gbps" = "1000 Mbps" = "1000" = "Gigabit"
RULE: "100 Mbps" = "100"
```

**Fields:** 112

### Category 10: Market Type Synonyms
```
RULE: "Buyer's Market" = "Buyers Market" = "Buyer's"
RULE: "Seller's Market" = "Sellers Market" = "Seller's"
RULE: "Balanced" = "Neutral" = "Even"
```

**Fields:** 96, 175

### Category 11: Direction/Exposure Normalization
```
RULE: "South" = "S" = "Southern"
RULE: "North" = "N" = "Northern"
RULE: "East" = "E" = "Eastern"
RULE: "West" = "W" = "Western"
RULE: "Southeast" = "SE"
```

**Fields:** 154

---

## COMPLETE TOLERANCE AUDIT TABLE

| # | Key | Has Rule? | Category | Status | Notes |
|---|-----|-----------|----------|--------|-------|
| **GROUP 1: Address & Identity (1-9)** |
| 1 | full_address | [X] | 2 (Address) | FIXED | "Rd" vs "Road" - Added to shouldUseSemanticComparison + expandAbbreviations |
| 2 | mls_primary | N/A | Exact | OK | IDs must match |
| 3 | new_construction_yn | [ ] | 1 (Boolean) | NEEDS FIX | |
| 4 | listing_status | [ ] | Case | NEEDS FIX | "Active" vs "ACTIVE" |
| 5 | listing_date | N/A | Date | OK | |
| 6 | neighborhood | [~] | 2 (Address) | CHECK | Has partial rules |
| 7 | county | [~] | 2 (Address) | CHECK | "County" suffix |
| 8 | zip_code | N/A | Exact | OK | |
| 9 | parcel_id | N/A | Exact | OK | |
| **GROUP 2: Pricing & Value (10-16)** |
| 10 | listing_price | N/A | Numeric | OK | 1% tolerance |
| 11 | price_per_sqft | N/A | Numeric | OK | |
| 12 | market_value_estimate | N/A | Numeric | OK | |
| 13 | last_sale_date | [ ] | Date | NEEDS FIX | Format variations |
| 14 | last_sale_price | N/A | Numeric | OK | |
| 15 | assessed_value | N/A | Numeric | OK | |
| 16 | avms | N/A | Numeric | OK | |
| 16a-f | AVM subfields | N/A | Numeric | OK | |
| **GROUP 3: Property Basics (17-29)** |
| 17-25 | Numeric fields | N/A | Numeric | OK | |
| 26 | property_type | [ ] | 4 (PropType) | NEEDS FIX | "SFR" variations |
| 27-28 | Numeric fields | N/A | Numeric | OK | |
| 29 | parking_total | [ ] | Mixed | NEEDS FIX | "2 Car" vs "2" |
| **GROUP 4: HOA & Taxes (30-38)** |
| 30 | hoa_yn | [ ] | 1 (Boolean) | NEEDS FIX | |
| 31-31F | Fee fields | N/A | Numeric | OK | |
| 32 | hoa_name | [~] | Name | CHECK | |
| 33 | hoa_includes | [ ] | 8 (List) | NEEDS FIX | |
| 34 | ownership_type | [ ] | Synonym | NEEDS FIX | "Fee Simple" |
| 35-37 | Numeric fields | N/A | Numeric | OK | |
| 38 | tax_exemptions | [ ] | Synonym | NEEDS FIX | "Homestead" |
| **GROUP 5: Structure & Systems (39-48)** |
| 39 | roof_type | [ ] | Synonym | NEEDS FIX | "Shingle" variations |
| 40 | roof_age_est | [ ] | 6 (Time) | NEEDS FIX | "10 years" vs "10" |
| 41 | exterior_material | [ ] | Synonym | NEEDS FIX | |
| 42 | foundation | [ ] | Synonym | NEEDS FIX | "Slab" variations |
| 43 | water_heater_type | [ ] | Synonym | NEEDS FIX | |
| 44 | garage_type | [ ] | Synonym | NEEDS FIX | |
| 45 | hvac_type | [ ] | Synonym | NEEDS FIX | |
| 46 | hvac_age | [ ] | 6 (Time) | NEEDS FIX | |
| 47 | laundry_type | [ ] | Synonym | NEEDS FIX | |
| 48 | interior_condition | [ ] | Synonym | NEEDS FIX | |
| **GROUP 6: Interior Features (49-53)** |
| 49 | flooring_type | [ ] | Synonym | NEEDS FIX | |
| 50 | kitchen_features | [ ] | 8 (List) | NEEDS FIX | |
| 51 | appliances_included | [ ] | 8 (List) | NEEDS FIX | |
| 52 | fireplace_yn | [ ] | 1 (Boolean) | NEEDS FIX | |
| 53 | primary_br_location | [ ] | Synonym | NEEDS FIX | |
| **GROUP 7: Exterior Features (54-58)** |
| 54 | pool_yn | [ ] | 1 (Boolean) | NEEDS FIX | |
| 55 | pool_type | [ ] | Synonym | NEEDS FIX | |
| 56 | deck_patio | [ ] | 8 (List) | NEEDS FIX | |
| 57 | fence | [ ] | Synonym | NEEDS FIX | |
| 58 | landscaping | [ ] | Synonym | NEEDS FIX | |
| **GROUP 8: Permits (59-62)** |
| 59-62 | Permit fields | [ ] | Text | NEEDS FIX | |
| **GROUP 9: Schools (63-73)** |
| 63 | school_district | [~] | 2 (Address) | CHECK | |
| 64 | elevation_feet | N/A | Numeric | OK | |
| 65, 68, 71 | School names | [~] | 2 (Address) | CHECK | |
| 66, 69, 72 | School ratings | [ ] | 5 (Rating) | NEEDS FIX | "8/10" vs "8" |
| 67, 70, 73 | Distances | N/A | Numeric | OK | |
| **GROUP 10: Location Scores (74-82)** |
| 74-77 | Score fields | N/A | Numeric | OK | |
| 78 | noise_level | [ ] | 3 (Risk) | NEEDS FIX | |
| 79 | traffic_level | [ ] | 3 (Risk) | NEEDS FIX | |
| 80 | walkability_description | [~] | Text | CHECK | |
| 81 | public_transit_access | [ ] | Synonym | NEEDS FIX | |
| 82 | commute_to_city_center | [ ] | 6 (Time) | NEEDS FIX | |
| **GROUP 11: Distances (83-87)** |
| 83-87 | Distance fields | N/A | Numeric | OK | |
| **GROUP 12: Safety & Crime (88-90)** |
| 88-90 | Crime fields | [ ] | 3 (Risk) | NEEDS FIX | |
| **GROUP 13: Market (91-103)** |
| 91-101 | Numeric fields | N/A | Numeric | OK | |
| 102 | financing_terms | [ ] | Text | NEEDS FIX | |
| 103 | comparable_sales | [ ] | 8 (List) | NEEDS FIX | |
| **GROUP 14: Utilities (104-116)** |
| 104, 106, 108, 110, 114 | Provider names | [~] | Name | CHECK | |
| 105, 107 | Bill amounts | [ ] | 7 (Currency) | NEEDS FIX | |
| 109 | natural_gas | [ ] | 1 (Boolean) | NEEDS FIX | |
| 111 | internet_providers | [ ] | 8 (List) | NEEDS FIX | |
| 112 | max_internet_speed | [ ] | 9 (Speed) | NEEDS FIX | |
| 113 | fiber_available | [ ] | 1 (Boolean) | NEEDS FIX | |
| 115 | cell_coverage | [ ] | Synonym | NEEDS FIX | |
| 116 | emergency_distance | [ ] | 6 (Time) | NEEDS FIX | |
| **GROUP 15: Environment & Risk (117-130)** |
| 117 | air_quality_index | N/A | Numeric | OK | |
| 118 | air_quality_grade | [ ] | 3 (Risk) | NEEDS FIX | |
| 119 | flood_zone | [~] | Zone | CHECK | |
| 120-126 | Risk levels | [ ] | 3 (Risk) | NEEDS FIX | |
| 127 | superfund_nearby | [ ] | 1 (Boolean) | NEEDS FIX | |
| 128 | sea_level_rise_risk | [X] | 3 (Risk) | FIXED | Commit 37a16af |
| 129 | noise_level_db | [ ] | Mixed | NEEDS FIX | |
| 130 | solar_potential | [ ] | 3 (Risk) | NEEDS FIX | |
| **GROUP 16: Additional (131-138)** |
| 131 | view_type | [ ] | Synonym | NEEDS FIX | |
| 132 | lot_features | [ ] | 8 (List) | NEEDS FIX | |
| 133 | ev_charging | [ ] | 1 (Boolean) | NEEDS FIX | |
| 134 | smart_home_features | [ ] | 8 (List) | NEEDS FIX | |
| 135 | accessibility | [ ] | Synonym | NEEDS FIX | |
| 136 | pet_policy | [ ] | Synonym | NEEDS FIX | |
| 137 | age_restrictions | [ ] | Synonym | NEEDS FIX | |
| 138 | special_assessments | [ ] | 7 (Currency) | NEEDS FIX | |
| **GROUP 17: Parking (139-143)** |
| 139 | carport_yn | [ ] | 1 (Boolean) | NEEDS FIX | |
| 140 | carport_spaces | N/A | Numeric | OK | |
| 141 | garage_attached_yn | [ ] | 1 (Boolean) | NEEDS FIX | |
| 142 | parking_features | [ ] | 8 (List) | NEEDS FIX | |
| 143 | assigned_spaces | N/A | Numeric | OK | |
| **GROUP 18: Building (144-148)** |
| 144-145, 148 | Numeric | N/A | Numeric | OK | |
| 146 | building_name | [~] | Name | CHECK | |
| 147 | elevator_yn | [ ] | 1 (Boolean) | NEEDS FIX | |
| **GROUP 19: Legal (149-154)** |
| 149 | subdivision_name | [~] | 2 (Address) | CHECK | |
| 150 | legal_description | [X] | Strict | OK | |
| 151 | homestead_yn | [ ] | 1 (Boolean) | NEEDS FIX | |
| 152 | cdd_yn | [ ] | 1 (Boolean) | NEEDS FIX | |
| 153 | annual_cdd_fee | N/A | Numeric | OK | |
| 154 | front_exposure | [ ] | 11 (Direction) | NEEDS FIX | |
| **GROUP 20: Waterfront (155-159)** |
| 155, 157, 158 | YN fields | [ ] | 1 (Boolean) | NEEDS FIX | |
| 156 | waterfront_feet | N/A | Numeric | OK | |
| 159 | water_body_name | [~] | Name | CHECK | |
| **GROUP 21: Leasing (160-165)** |
| 160, 162, 165 | YN fields | [ ] | 1 (Boolean) | NEEDS FIX | |
| 161 | min_lease_period | [ ] | 6 (Time) | NEEDS FIX | |
| 163 | pet_size_limit | [ ] | Synonym | NEEDS FIX | |
| 164 | max_pet_weight | N/A | Numeric | OK | |
| **GROUP 22: Features (166-168)** |
| 166-168 | Feature lists | [ ] | 8 (List) | NEEDS FIX | |
| 167C | furnished_yn | [ ] | 1 (Boolean) | NEEDS FIX | |
| **GROUP 23: Market Performance (169-181)** |
| 169-174, 176-177, 179, 181 | Numeric | N/A | Numeric | OK | |
| 175 | market_type | [ ] | 10 (Market) | NEEDS FIX | |
| 178 | multiple_offers | [ ] | Synonym | NEEDS FIX | |
| 180 | price_trend | [ ] | Synonym | NEEDS FIX | |

---

## PROGRESS SUMMARY

| Category | Total | Fixed | Remaining |
|----------|-------|-------|-----------|
| 1. Boolean Y/N | 20 | 0 | 20 |
| 2. Address Abbrev | 7 | 0 | 7 |
| 3. Risk Synonyms | 14 | 1 | 13 |
| 4. Property Type | 1 | 0 | 1 |
| 5. Rating Format | 4 | 0 | 4 |
| 6. Time/Duration | 6 | 0 | 6 |
| 7. Currency | 3 | 0 | 3 |
| 8. List/Array | 12 | 0 | 12 |
| 9. Internet Speed | 1 | 0 | 1 |
| 10. Market Type | 2 | 0 | 2 |
| 11. Direction | 1 | 0 | 1 |
| Numeric (OK) | ~55 | 55 | 0 |
| **TOTAL** | ~126 | 56 | ~70 |

---

## CHANGE LOG

| Date | Field | Category | Action |
|------|-------|----------|--------|
| 2026-01-13 | 128 | 3 (Risk) | Fixed toFixed(1) |
| 2026-01-13 | 1 | 2 (Address) | Verified abbreviation handling works |
| 2026-01-13 | ALL | Multiple | Added Boolean Y/N normalization (BOOLEAN_TRUE_VALUES, BOOLEAN_FALSE_VALUES) |
| 2026-01-13 | ALL | Multiple | Added Risk level synonyms (RISK_SYNONYMS) |
| 2026-01-13 | ALL | Multiple | Added Property type synonyms (PROPERTY_TYPE_SYNONYMS) |
| 2026-01-13 | ALL | Multiple | Expanded shouldUseSemanticComparison to cover 50+ field patterns |
