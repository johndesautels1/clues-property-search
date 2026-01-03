# PERPLEXITY PROMPT OPTIMIZATION REQUEST
**Date:** January 1, 2026
**From:** CLUES Quantum Property Dashboard Development Team
**To:** Perplexity AI Team

---

## EXECUTIVE SUMMARY

We are building a real estate property data extraction system that uses Perplexity's `sonar-pro` model with web search to fill missing property data fields. We have a **168-field schema** (source of truth) and need Perplexity to extract as many fields as possible from web sources.

**CURRENT PROBLEM:**
- Perplexity is returning **0 fields** on most queries
- We recently unified 7 micro-prompts into 1 massive prompt (~6,000 tokens)
- We suspect prompt overload, conflicting instructions, or token exhaustion

**WHAT WE NEED:**
Your expert guidance on restructuring our prompts to maximize field extraction while maintaining accuracy and avoiding hallucinations.

---

## OUR 168-FIELD SCHEMA (SOURCE OF TRUTH)

### Field Groups (22 total):

**GROUP 1 - Address & Identity (Fields 1-9):**
1. full_address, 2. mls_primary, 3. mls_secondary, 4. listing_status, 5. listing_date, 6. neighborhood, 7. county, 8. zip_code, 9. parcel_id

**GROUP 2 - Pricing & Value (Fields 10-16):**
10. listing_price, 11. price_per_sqft (calculated), 12. market_value_estimate, 13. last_sale_date, 14. last_sale_price, 15. assessed_value, 16. redfin_estimate

**GROUP 3 - Property Basics (Fields 17-29):**
17. bedrooms, 18. full_bathrooms, 19. half_bathrooms, 20. total_bathrooms (calculated), 21. living_sqft, 22. total_sqft_under_roof, 23. lot_size_sqft, 24. lot_size_acres (calculated), 25. year_built, 26. property_type, 27. stories, 28. garage_spaces, 29. parking_total

**GROUP 4 - HOA & Taxes (Fields 30-38):**
30. hoa_yn, 31. hoa_fee_annual, 32. hoa_name, 33. hoa_includes, 34. ownership_type, 35. annual_taxes, 36. tax_year, 37. property_tax_rate, 38. tax_exemptions

**GROUP 5 - Structure & Systems (Fields 39-48):**
39. roof_type, 40. roof_age_est, 41. exterior_material, 42. foundation, 43. water_heater_type, 44. garage_type, 45. hvac_type, 46. hvac_age, 47. laundry_type, 48. interior_condition

**GROUP 6 - Interior Features (Fields 49-53):**
49. flooring_type, 50. kitchen_features, 51. appliances_included, 52. fireplace_yn, 53. fireplace_count

**GROUP 7 - Exterior Features (Fields 54-58):**
54. pool_yn, 55. pool_type, 56. deck_patio, 57. fence, 58. landscaping

**GROUP 8 - Permits & Renovations (Fields 59-62):**
59. recent_renovations, 60. permit_history_roof, 61. permit_history_hvac, 62. permit_history_other

**GROUP 9 - Assigned Schools (Fields 63-73):**
63. school_district, 64. elevation_feet, 65. elementary_school, 66. elementary_rating, 67. elementary_distance_mi, 68. middle_school, 69. middle_rating, 70. middle_distance_mi, 71. high_school, 72. high_rating, 73. high_distance_mi

**GROUP 10 - Location Scores (Fields 74-82):**
74. walk_score, 75. transit_score, 76. bike_score, 77. safety_score, 78. noise_level, 79. traffic_level, 80. walkability_description, 81. public_transit_access, 82. commute_to_city_center

**GROUP 11 - Distances & Amenities (Fields 83-87):**
83. distance_grocery_mi, 84. distance_hospital_mi, 85. distance_airport_mi, 86. distance_park_mi, 87. distance_beach_mi

**GROUP 12 - Safety & Crime (Fields 88-90):**
88. violent_crime_index, 89. property_crime_index, 90. neighborhood_safety_rating

**GROUP 13 - Market & Investment Data (Fields 91-103):**
91. median_home_price_neighborhood, 92. price_per_sqft_recent_avg, 93. price_to_rent_ratio (calculated), 94. price_vs_median_percent (calculated), 95. days_on_market_avg, 96. inventory_surplus, 97. insurance_est_annual, 98. rental_estimate_monthly, 99. rental_yield_est (calculated), 100. vacancy_rate_neighborhood, 101. cap_rate_est (calculated), 102. financing_terms, 103. comparable_sales

**GROUP 14 - Utilities & Connectivity (Fields 104-116):**
104. electric_provider, 105. avg_electric_bill, 106. water_provider, 107. avg_water_bill, 108. sewer_provider, 109. natural_gas, 110. trash_provider, 111. internet_providers_top3, 112. max_internet_speed, 113. fiber_available, 114. cable_tv_provider, 115. cell_coverage_quality, 116. emergency_services_distance

**GROUP 15 - Environment & Risk (Fields 117-130):**
117. air_quality_index, 118. air_quality_grade, 119. flood_zone, 120. flood_risk_level, 121. climate_risk, 122. wildfire_risk, 123. earthquake_risk, 124. hurricane_risk, 125. tornado_risk, 126. radon_risk, 127. superfund_site_nearby, 128. sea_level_rise_risk, 129. noise_level_db_est, 130. solar_potential

**GROUP 16 - Additional Features (Fields 131-138):**
131. view_type, 132. lot_features, 133. ev_charging, 134. smart_home_features, 135. accessibility_modifications, 136. pet_policy, 137. age_restrictions, 138. special_assessments

**GROUP 17 - Stellar MLS Parking (Fields 139-143):**
139. carport_yn, 140. carport_spaces, 141. garage_attached_yn, 142. parking_features, 143. assigned_parking_spaces

**GROUP 18 - Stellar MLS Building (Fields 144-148):**
144. floor_number, 145. building_total_floors, 146. building_name_number, 147. building_elevator_yn, 148. floors_in_unit

**GROUP 19 - Stellar MLS Legal (Fields 149-154):**
149. subdivision_name, 150. legal_description, 151. homestead_yn, 152. cdd_yn, 153. annual_cdd_fee, 154. front_exposure

**GROUP 20 - Stellar MLS Waterfront (Fields 155-159):**
155. water_frontage_yn, 156. waterfront_feet, 157. water_access_yn, 158. water_view_yn, 159. water_body_name

**GROUP 21 - Stellar MLS Leasing (Fields 160-165):**
160. can_be_leased_yn, 161. minimum_lease_period, 162. lease_restrictions_yn, 163. pet_size_limit, 164. max_pet_weight, 165. association_approval_yn

**GROUP 22 - Stellar MLS Features (Fields 166-168):**
166. community_features, 167. interior_features, 168. exterior_features

---

## DATA TIER ARCHITECTURE

Our system fills fields in priority order:

**TIER 1:** Stellar MLS (highest accuracy) - 68 fields
**TIER 2:** Google APIs (Geocode, Places, Distance) - 13 fields
**TIER 3:** Free APIs (WalkScore, FEMA, SchoolDigger, Census, NOAA, etc.) - 28 fields
**TIER 3.5:** Gemini 2.0 Flash with Google Search (20 specific fields)
**TIER 4:** **PERPLEXITY + other LLMs** ← THIS IS WHERE YOU COME IN
**TIER 5:** Lower-priority LLMs

**By the time Perplexity runs:**
- ~110 fields already filled by higher tiers
- **~58 fields remaining** that ONLY Perplexity can fill with web search

---

## CURRENT PERPLEXITY PROMPT (UNIFIED VERSION)

### **SYSTEM MESSAGE** (sent in `role: 'system'`):

```
You are a real estate data researcher with REAL-TIME WEB SEARCH capabilities.

CRITICAL INSTRUCTIONS:
1. You MUST use web search to retrieve VERIFIED, up-to-date property data
2. Prefer official and primary sources: MLS portals (Zillow, Redfin, Realtor.com), county property appraisers, school rating sites (GreatSchools), FEMA
3. NEVER fabricate URLs, values, or data - only return what you actually find via web search
4. If you cannot find data for a field, DO NOT include that field - simply omit it from your response
5. NEVER return null values - omit unfound fields entirely

SOURCE PRIORITY:
1. County Property Appraiser websites (for taxes, assessed value, parcel ID, ownership)
2. MLS-powered listing sites (Zillow, Redfin, Realtor.com) for listing data
3. GreatSchools.org for school assignments and ratings
4. FEMA NFHL for flood zones
5. WalkScore.com for walk/transit/bike scores
```

### **USER PROMPT** (sent in `role: 'user'`):

**PART 1: Global Rules (~600 tokens)**
```
You are a retrieval-only real estate research agent with LIVE WEB SEARCH capabilities.

Your mission: For the property at:

"${address}"

research and extract ALL relevant data for the specific fields listed below, using the strict retrieval rules in this prompt. You must use web search, consult multiple reputable sources, and return ONLY explicitly stated information. For every populated field, include a source and source_url.

Global rules (apply to everything):
- You are a retrieval-only agent.
- Use web search to locate authoritative, original, or well-established data sources.
- Do NOT guess, infer, estimate, or interpolate any values.
- Only return values that are explicitly stated on a page.
- If a field cannot be confidently populated from an explicit statement, omit that field entirely.
- Do NOT use hedging or approximation words such as "likely", "possibly", "about", "around", "approximately", "roughly", or similar.
- Do NOT compute your own indices, ratings, or distances.
- For every field you populate:
  - Include "source" as either the site name or provider.
  - Include "source_url" as the page URL where the value was found.
- If multiple sources disagree, prioritize:
  1. Official government or county records
  2. Original provider sites (e.g., WalkScore, FEMA, BroadbandNow, official utilities)
  3. Major real estate portals (Zillow, Redfin, Realtor.com, Trulia, Homes.com)
- Omit any field you cannot reliably retrieve.
- Output JSON ONLY, with no commentary, no explanations, and no extra keys beyond those specified.
```

**PART 2: Required Search Strategy (~500 tokens)**
```
Required search strategy:
Perform a focused but thorough set of searches, including but not limited to:

General listing and property data:
- "${address} Zillow"
- "${address} Redfin"
- "${address} Realtor.com"
- "${address} Trulia"
- "${address} Homes.com"

County records and tax/ownership/parcel data:
- "[County Name] Property Appraiser ${address}"
- "[County Name] Assessor ${address}"

Sale history and market context:
- "${address} sold"
- "[Neighborhood] median home price"
- "[ZIP code] real estate market"

Schools and ratings:
- "Schools near ${address}"
- "${address} GreatSchools"

Walkability and transportation:
- "${address} WalkScore"

Crime and safety:
- "${address} NeighborhoodScout"
- "${address} CrimeGrade"
- "[City or County] crime statistics ${address}"

Climate, hazards, and environmental risk:
- "[ZIP code] flood zone FEMA"
- "${address} flood risk FirstStreet"
- "${address} ClimateCheck"
- "[City] air quality index AirNow"

Utilities and ISPs:
- "[City] electric utility provider"
- "[City] water utility provider"
- "[City] sewer utility provider"
- "[City] trash collection services"
- "${address} BroadbandNow"
- "${address} fiber internet availability"
- "${address} cell coverage"

Points of interest (distances):
- "Google Maps ${address} nearest grocery store"
- "Google Maps ${address} nearest hospital"
- "Google Maps ${address} nearest airport"
- "Google Maps ${address} nearest park"
- "Google Maps ${address} nearest beach"

Use these patterns to locate the most reliable, explicit values for each of the fields below.
```

**PART 3: Domain-Specific Micro-Rules (~1,200 tokens)**
```
Domain-specific rules:

Walkability metrics (WalkScore):
- Use web search ONLY to find pages from WalkScore.com.
- Retrieve walk_score, transit_score, and bike_score ONLY if explicitly shown.
- Do NOT guess or derive scores from any other source.
- If a given score is not explicitly present, omit that field.

Schools and ratings:
- Use web search ONLY on GreatSchools.org or official school district websites.
- Retrieve: School district name, Elementary/middle/high school names, GreatSchools ratings (1–10 scale), Distance in miles to each school
- Do NOT infer attendance boundaries or ratings.
- Omit any school-related field if not clearly stated.

Crime and safety:
- Use web search ONLY on reputable crime data providers: NeighborhoodScout, CrimeGrade, Official police/open-data portals
- Retrieve only: Violent crime index, Property crime index, Neighborhood safety rating (A–F or 1–10)
- Do NOT compute your own index.

Climate and environmental risk:
- Use web search ONLY on authoritative sources: FEMA.gov, NOAA.gov, FirstStreet.org, ClimateCheck.com, AirNow.gov
- Retrieve ONLY explicitly stated values for: AQI, air quality grade, FEMA flood zone, flood risk, climate/wildfire/earthquake/hurricane/tornado/radon risks, sea level rise, solar potential
- Do NOT infer regional climate risks.

Utilities:
- Use web search ONLY on: Official utility websites, Local government utility pages, Public utility commission databases
- Retrieve ONLY explicitly stated: Electric/water/sewer/trash providers, natural gas availability, cable TV providers
- Do NOT guess providers based on territory maps.

Internet service providers (ISP):
- Use web search ONLY on: BroadbandNow.com, FCC broadband maps, Official ISP coverage pages
- Retrieve ONLY explicitly stated: Top 3 ISPs, max internet speed (Mbps), fiber availability, cell coverage quality
- Do NOT estimate speeds.

Points of interest (POI) distances:
- Use web search ONLY on: Google Maps, MapQuest
- Retrieve distances in miles ONLY when explicitly displayed by mapping service
- Do NOT calculate distances yourself.
- Target: Nearest grocery/hospital/airport/park/beach
```

**PART 4: Field Groups with Source Hints (~3,000 tokens)**
```
GROUP 1 - Address & Identity (Fields 1-9) [P1 = Priority 1]:
1. full_address (from listing sites), 2. mls_primary (from MLS/Zillow/Redfin) [P1],
3. mls_secondary, 4. listing_status (from listing sites) [P1], 5. listing_date (from MLS),
6. neighborhood (from listing sites), 7. county (from county records) [P1],
8. zip_code (from listing sites), 9. parcel_id (from county property appraiser) [P1]

GROUP 2 - Pricing & Value (Fields 10-16) [P1]:
10. listing_price (from Zillow/Redfin/Realtor) [P1], 11. price_per_sqft (calculated),
12. market_value_estimate (Zestimate/Redfin Estimate) [P1], 13. last_sale_date (from county records) [P1],
14. last_sale_price (from county records) [P1], 15. assessed_value (from county property appraiser) [P1],
16. redfin_estimate (from Redfin)

GROUP 3 - Property Basics (Fields 17-29) [P1]:
17. bedrooms (from listing sites) [P1], 18. full_bathrooms (from listing sites) [P1],
19. half_bathrooms (from listing sites), 20. total_bathrooms (calculated),
21. living_sqft (from listing/county) [P1], 22. total_sqft_under_roof (from county),
23. lot_size_sqft (from county) [P1], 24. lot_size_acres (calculated),
25. year_built (from county/listing) [P1], 26. property_type (from listing) [P1],
27. stories (from listing), 28. garage_spaces (from listing), 29. parking_total (from listing)

GROUP 4 - HOA & Taxes (Fields 30-38) [P1]:
30. hoa_yn (from listing) [P1], 31. hoa_fee_annual (from listing/HOA site) [P1],
32. hoa_name (from listing), 33. hoa_includes (from listing),
34. ownership_type (from county), 35. annual_taxes (from county tax collector) [P1],
36. tax_year (from county), 37. property_tax_rate (from county), 38. tax_exemptions (from county)

GROUP 5 - Structure & Systems (Fields 39-48) [P2]:
39. roof_type (from listing/permits), 40. roof_age_est (from permits),
41. exterior_material (from listing), 42. foundation (from listing),
43. water_heater_type (from listing), 44. garage_type (from listing),
45. hvac_type (from listing), 46. hvac_age (from permits),
47. laundry_type (from listing), 48. interior_condition (from listing)

GROUP 6 - Interior Features (Fields 49-53) [P2]:
49. flooring_type (from listing), 50. kitchen_features (from listing),
51. appliances_included (from listing), 52. fireplace_yn (from listing), 53. fireplace_count (from listing)

GROUP 7 - Exterior Features (Fields 54-58) [P2]:
54. pool_yn (from listing/aerial) [P1], 55. pool_type (from listing),
56. deck_patio (from listing), 57. fence (from listing), 58. landscaping (from listing)

GROUP 8 - Permits & Renovations (Fields 59-62) [P2]:
59. recent_renovations (from permits/listing), 60. permit_history_roof (from county permits),
61. permit_history_hvac (from county permits), 62. permit_history_other (from county permits)

GROUP 9 - Assigned Schools (Fields 63-73) [P1]:
63. school_district (from GreatSchools/school site) [P1], 64. elevation_feet (from elevation API),
65. elementary_school (from GreatSchools) [P1], 66. elementary_rating (from GreatSchools) [P1],
67. elementary_distance_mi (calculated), 68. middle_school (from GreatSchools) [P1],
69. middle_rating (from GreatSchools) [P1], 70. middle_distance_mi (calculated),
71. high_school (from GreatSchools) [P1], 72. high_rating (from GreatSchools) [P1],
73. high_distance_mi (calculated)

GROUP 10 - Location Scores (Fields 74-82) [P2]:
74. walk_score (from WalkScore.com), 75. transit_score (from WalkScore.com),
76. bike_score (from WalkScore.com), 77. safety_score (from crime sites),
78. noise_level (from HowLoud), 79. traffic_level (from traffic sites),
80. walkability_description, 81. public_transit_access, 82. commute_to_city_center

GROUP 11 - Distances & Amenities (Fields 83-87) [P2]:
83. distance_grocery_mi (from Google Maps), 84. distance_hospital_mi (from Google Maps),
85. distance_airport_mi (from Google Maps), 86. distance_park_mi (from Google Maps),
87. distance_beach_mi (from Google Maps)

GROUP 12 - Safety & Crime (Fields 88-90) [P2]:
88. violent_crime_index (from NeighborhoodScout/CrimeGrade), 89. property_crime_index (from crime sites),
90. neighborhood_safety_rating (from crime sites)

GROUP 13 - Market & Investment Data (Fields 91-103) [P2]:
91. median_home_price_neighborhood (from Zillow/Redfin), 92. price_per_sqft_recent_avg (from listing sites),
93. price_to_rent_ratio (calculated), 94. price_vs_median_percent (calculated),
95. days_on_market_avg (from listing sites), 96. inventory_surplus (from market reports),
97. insurance_est_annual (from insurance sites), 98. rental_estimate_monthly (from Rentometer/Zillow),
99. rental_yield_est (calculated), 100. vacancy_rate_neighborhood (from census),
101. cap_rate_est (calculated), 102. financing_terms, 103. comparable_sales (from listing sites)

GROUP 14 - Utilities & Connectivity (Fields 104-116) [P3]:
104. electric_provider (from utility sites), 105. avg_electric_bill,
106. water_provider (from utility sites), 107. avg_water_bill,
108. sewer_provider, 109. natural_gas, 110. trash_provider,
111. internet_providers_top3 (from BroadbandNow), 112. max_internet_speed,
113. fiber_available, 114. cable_tv_provider, 115. cell_coverage_quality,
116. emergency_services_distance

GROUP 15 - Environment & Risk (Fields 117-130) [P2]:
117. air_quality_index (from AirNow), 118. air_quality_grade,
119. flood_zone (from FEMA NFHL) [P1], 120. flood_risk_level (from FEMA) [P1],
121. climate_risk, 122. wildfire_risk, 123. earthquake_risk,
124. hurricane_risk, 125. tornado_risk, 126. radon_risk,
127. superfund_site_nearby, 128. sea_level_rise_risk, 129. noise_level_db_est, 130. solar_potential

GROUP 16 - Additional Features (Fields 131-138) [P3]:
131. view_type (from listing), 132. lot_features (from listing),
133. ev_charging (from listing), 134. smart_home_features (from listing),
135. accessibility_modifications, 136. pet_policy, 137. age_restrictions, 138. special_assessments

GROUP 17 - Stellar MLS Parking (Fields 139-143) [P3]:
139. carport_yn, 140. carport_spaces, 141. garage_attached_yn, 142. parking_features, 143. assigned_parking_spaces

GROUP 18 - Stellar MLS Building (Fields 144-148) [P3]:
144. floor_number, 145. building_total_floors, 146. building_name_number, 147. building_elevator_yn, 148. floors_in_unit

GROUP 19 - Stellar MLS Legal (Fields 149-154) [P3]:
149. subdivision_name (from county), 150. legal_description (from county),
151. homestead_yn (from county), 152. cdd_yn, 153. annual_cdd_fee, 154. front_exposure

GROUP 20 - Stellar MLS Waterfront (Fields 155-159) [P3]:
155. water_frontage_yn, 156. waterfront_feet, 157. water_access_yn, 158. water_view_yn, 159. water_body_name

GROUP 21 - Stellar MLS Leasing (Fields 160-165) [P3]:
160. can_be_leased_yn, 161. minimum_lease_period, 162. lease_restrictions_yn,
163. pet_size_limit, 164. max_pet_weight, 165. association_approval_yn

GROUP 22 - Stellar MLS Features (Fields 166-168) [P3]:
166. community_features, 167. interior_features, 168. exterior_features
```

**PART 5: JSON Response Format (~550 tokens)**
```
RESPONSE FORMAT - Return ONLY valid JSON. DO NOT include fields you cannot find - simply omit them.

Example format (use actual values from your web search, NOT these placeholders):
{
  "10_listing_price": { "value": <actual_price_number>, "source": "Zillow - <actual_url>" },
  "7_county": { "value": "<actual_county_name>", "source": "County Property Appraiser - <actual_url>" },
  "35_annual_taxes": { "value": <actual_tax_number>, "source": "County Tax Collector - <actual_url>" },
  "17_bedrooms": { "value": <actual_bedroom_count>, "source": "Redfin - <actual_url>" },
  "119_flood_zone": { "value": "<actual_FEMA_zone>", "source": "FEMA - <actual_url>" }
}

CRITICAL RULES:
- Use EXACT field keys: [number]_[field_name] (e.g., "10_listing_price", "7_county", "17_bedrooms")
- Replace ALL placeholders with ACTUAL values found via web search for the specific property
- If you CANNOT find verified data for a field, DO NOT include it in your response
- NEVER return null values - simply omit unfound fields
- Include source URL for every field you return
- Only return fields where you found REAL data from web search for THIS SPECIFIC ADDRESS
```

**TOTAL PROMPT SIZE:** ~5,850 tokens (System: ~150, User: ~5,700)

---

## FIELDS THAT ARE CONSISTENTLY NULL (HIGHEST PRIORITY)

These fields are **NEVER filled** by higher tiers and **DEPEND ON PERPLEXITY:**

### **CRITICAL MISSING FIELDS (P1 Priority):**
- **Field 16:** `redfin_estimate` - Redfin's home value estimate (from Redfin.com)
- **Field 31:** `hoa_fee_annual` - Annual HOA fees (from listing sites or HOA websites)
- **Field 33:** `hoa_includes` - What HOA covers (from listing descriptions)
- **Field 38:** `tax_exemptions` - Active tax exemptions like Homestead (from county appraiser)
- **Field 40:** `roof_age_est` - Roof age or replacement year (from permits or listing)
- **Field 44:** `garage_type` - Attached/Detached/Carport (from listing)
- **Field 46:** `hvac_age` - HVAC age or replacement year (from permits)
- **Field 66:** `elementary_rating` - GreatSchools rating 1-10 (from GreatSchools.org)
- **Field 69:** `middle_rating` - GreatSchools rating 1-10 (from GreatSchools.org)
- **Field 72:** `high_rating` - GreatSchools rating 1-10 (from GreatSchools.org)
- **Field 75:** `transit_score` - Public transit score (from WalkScore.com)
- **Field 76:** `bike_score` - Bike score (from WalkScore.com)
- **Field 91:** `median_home_price_neighborhood` - ZIP-level median (from Zillow/Redfin market data)
- **Field 92:** `price_per_sqft_recent_avg` - Recent comps avg (from listing sites)
- **Field 95:** `days_on_market_avg` - Average DOM for ZIP (from Redfin/Realtor)
- **Field 98:** `rental_estimate_monthly` - Monthly rent estimate (from Zillow Rent Zestimate/Rentometer)

### **IMPORTANT MISSING FIELDS (P2 Priority):**
- **Field 40:** `roof_age_est`
- **Field 59:** `recent_renovations`
- **Field 60:** `permit_history_roof`
- **Field 61:** `permit_history_hvac`
- **Field 62:** `permit_history_other`
- **Field 80:** `walkability_description`
- **Field 92:** `price_per_sqft_recent_avg`
- **Field 94:** `price_vs_median_percent`
- **Field 96:** `inventory_surplus`
- **Field 102:** `financing_terms`
- **Field 103:** `comparable_sales`
- **Field 105:** `avg_electric_bill`
- **Field 107:** `avg_water_bill`
- **Field 111:** `internet_providers_top3`
- **Field 112:** `max_internet_speed`
- **Field 113:** `fiber_available`
- **Field 114:** `cable_tv_provider`
- **Field 118:** `air_quality_grade`
- **Field 129:** `noise_level_db_est`

### **LOWER PRIORITY (P3) - Nice to Have:**
- Fields 137, 140, 142, 143, 144-148, 150, 152-153, 156, 162-165

---

## QUESTIONS FOR PERPLEXITY TEAM

1. **Is our unified prompt too large (~6,000 tokens)?**
   - Are we exhausting token budget before web search results can be processed?
   - Should we split back into micro-prompts (7 separate API calls)?

2. **Are there conflicting instructions causing LLM paralysis?**
   - Examples: "Do not estimate" vs. "Calculate average of 4 estimates"
   - "Omit if not found" vs. "Return explicit values only"

3. **What is the optimal prompt structure for `sonar-pro` with web search?**
   - Should we prioritize brevity over detail?
   - Should we group fields by data source (Zillow fields, GreatSchools fields, etc.)?

4. **Should we use multiple focused prompts instead of one unified prompt?**
   - Example: One call for "Zillow/Redfin portal data", another for "County tax records", another for "Schools"
   - Would this improve extraction rate even if it costs more API calls?

5. **Are we correctly formatting field keys?**
   - We use: `"12_market_value_estimate": { "value": 500000, "source": "Zillow" }`
   - Is this optimal for Perplexity's JSON parser?

6. **Should we pre-populate more context in the prompt?**
   - Example: If we know the county is "Pinellas County, FL", should we include that explicitly?
   - Should we include coordinates (lat/lon) in the prompt?

7. **What's the best way to request school ratings without hallucination?**
   - GreatSchools often doesn't show ratings prominently
   - Should we say "search for 'GreatSchools [school name] rating'" explicitly?

8. **How can we maximize field extraction while maintaining accuracy?**
   - Current strategy: Strict "retrieval-only, no guessing" policy
   - Are we being TOO strict, causing Perplexity to omit fields it could reasonably infer?

---

## WHAT WE NEED FROM YOU

**PRIMARY REQUEST:**
Please provide an optimized prompt structure (or set of prompts) that will:
1. Maximize the number of fields extracted (targeting 30-50 fields per call)
2. Minimize hallucinations and ensure accuracy
3. Work within `sonar-pro` token/context limits
4. Utilize Perplexity's web search effectively

**SECONDARY REQUEST:**
If you recommend micro-prompts, please suggest:
- How many separate calls? (We had 7 before)
- Which fields should be grouped together?
- Optimal prompt length per call?

**TERTIARY REQUEST:**
Any specific guidance on:
- Search query phrasing for best results
- JSON schema formatting
- Handling "not found" vs. "estimate from similar properties"

---

## TEST PROPERTY (FOR VALIDATION)

**Address:** `2003 GULF WAY, ST PETE BEACH, FL 33706`

**Expected Findable Data:**
- Zillow/Redfin/Realtor listings should have: price estimates, rental estimates, HOA info, property details
- Pinellas County Property Appraiser: tax exemptions, assessed value, parcel details
- GreatSchools: Azalea Elementary, Bay Point Middle, Boca Ciega High (with ratings)
- WalkScore: Walk/Transit/Bike scores for this address

---

## CLOSING

We deeply value Perplexity's web search capabilities and want to use your platform optimally. Any guidance you can provide on prompt engineering, field grouping, or search strategy would be invaluable.

**Contact:** cluesnomad@gmail.com
**GitHub:** https://github.com/johndesautels1/clues-property-search

Thank you for your assistance!

---

**Appendix A: Current Results**
- **Before unified prompt (7 micro-prompts):** 20-40 fields per property (WORKING)
- **After unified prompt:** 0 fields per property (BROKEN)
- **Cost consideration:** 1 call @ $0.05/1K tokens < 7 calls @ $0.35 total, but only if it works

**Appendix B: Competitor Comparison**
- Our tier system ensures Perplexity never overwrites MLS or API data
- We only ask Perplexity to fill ~58 "impossible" fields that require human-readable web search
- Accuracy is MORE important than field count (we prefer 20 accurate fields over 50 hallucinated ones)
