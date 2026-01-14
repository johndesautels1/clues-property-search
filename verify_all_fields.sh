#!/bin/bash

# Field 109 verification
echo "=== FIELD 109: natural_gas ==="
echo "K1:" && grep -n "natural_gas" src/lib/semantic-compare.ts | grep -E "includes.*natural_gas|109" | head -2
echo "K2:" && grep -n "natural_gas" api/property/semantic-compare.ts | grep -E "includes.*natural_gas|109" | head -2
echo "I:" && grep -n "109_natural_gas" src/pages/AddProperty.tsx
echo "H:" && grep -n "109_natural_gas" src/llm/validation/cmaSchemas.ts
echo "G:" && grep -n "naturalGas.*109" src/types/property.ts
echo "C:" && grep -n "109_natural_gas.*boolean" api/property/search.ts | head -2
echo "D:" && grep -n "naturalGas.*109" src/pages/PropertyDetail.tsx
echo "B:" && grep -n "109_natural_gas" src/lib/field-normalizer.ts
echo ""

# Field 133 verification
echo "=== FIELD 133: ev_charging ==="
echo "K1:" && grep -n "ev_charging" src/lib/semantic-compare.ts | grep -E "includes.*ev_charging|133" | head -2
echo "K2:" && grep -n "ev_charging" api/property/semantic-compare.ts | grep -E "includes.*ev_charging|133" | head -2
echo "I:" && grep -n "133_ev_charging" src/pages/AddProperty.tsx
echo "H:" && grep -n "133_ev_charging" src/llm/validation/cmaSchemas.ts
echo "G:" && grep -n "evChargingYn.*133" src/types/property.ts
echo "C:" && grep -n "133_ev_charging.*boolean" api/property/search.ts | head -2
echo "D:" && grep -n "evChargingYn.*133" src/pages/PropertyDetail.tsx
echo "B:" && grep -n "133_ev_charging" src/lib/field-normalizer.ts
echo "F:" && grep -n "EV Charging\|ev_charging" api/property/parse-mls-pdf.ts | head -3
echo ""

# Field 66 verification (elementary_rating)
echo "=== FIELD 66: elementary_rating ==="
echo "K1:" && grep -n "normalizeRating\|rating.*normalize" src/lib/semantic-compare.ts | head -3
echo "K2:" && grep -n "normalizeRating\|rating.*normalize" api/property/semantic-compare.ts | head -3
echo "I:" && grep -n "66_elementary_rating" src/pages/AddProperty.tsx
echo "H:" && grep -n "66_elementary_rating" src/llm/validation/cmaSchemas.ts
echo "G:" && grep -n "elementaryRating.*66" src/types/property.ts
echo "C:" && grep -n "66_elementary_rating" api/property/search.ts | head -2
echo ""

# Field 40 verification (roof_age_est)
echo "=== FIELD 40: roof_age_est ==="
echo "K1:" && grep -n "normalizeTimeDuration" src/lib/semantic-compare.ts | head -3
echo "K2:" && grep -n "normalizeTimeDuration" api/property/semantic-compare.ts | head -3
echo "I:" && grep -n "40_roof_age" src/pages/AddProperty.tsx
echo "H:" && grep -n "40_roof_age" src/llm/validation/cmaSchemas.ts
echo "G:" && grep -n "roofAge.*40" src/types/property.ts
echo "C:" && grep -n "40_roof_age" api/property/search.ts | head -2
echo ""

# Field 112 verification (max_internet_speed)
echo "=== FIELD 112: max_internet_speed ==="
echo "K1:" && grep -n "normalizeInternetSpeed\|internet_speed" src/lib/semantic-compare.ts | grep -E "function|includes.*internet" | head -3
echo "K2:" && grep -n "normalizeInternetSpeed\|internet_speed" api/property/semantic-compare.ts | grep -E "function|includes.*internet" | head -3
echo "I:" && grep -n "112_max_internet_speed" src/pages/AddProperty.tsx
echo "H:" && grep -n "112_max_internet_speed" src/llm/validation/cmaSchemas.ts
echo "G:" && grep -n "maxInternetSpeed.*112" src/types/property.ts
echo "C:" && grep -n "112_max_internet_speed" api/property/search.ts | head -2
echo ""

# Field 33 verification (hoa_includes - list field)
echo "=== FIELD 33: hoa_includes (LIST) ==="
echo "K1:" && grep -n "normalizeListValue\|hoa_includes" src/lib/semantic-compare.ts | grep -E "function|includes.*hoa_includes|includes.*includes" | head -3
echo "K2:" && grep -n "normalizeListValue\|hoa_includes" api/property/semantic-compare.ts | grep -E "function|includes.*hoa_includes|includes.*includes" | head -3
echo "I:" && grep -n "33_hoa_includes" src/pages/AddProperty.tsx
echo "H:" && grep -n "33_hoa_includes" src/llm/validation/cmaSchemas.ts
echo "G:" && grep -n "hoaIncludes.*33" src/types/property.ts
echo "C:" && grep -n "33_hoa_includes" api/property/search.ts | head -2
echo ""

# Field 39 verification (roof_type - synonym)
echo "=== FIELD 39: roof_type (SYNONYM) ==="
echo "K1:" && grep -n "ROOF_TYPE_SYNONYMS\|roof_type.*normalizeSynonym" src/lib/semantic-compare.ts | head -5
echo "K2:" && grep -n "ROOF_TYPE_SYNONYMS\|roof_type.*normalizeSynonym" api/property/semantic-compare.ts | head -5
echo "I:" && grep -n "39_roof_type" src/pages/AddProperty.tsx
echo "H:" && grep -n "39_roof_type" src/llm/validation/cmaSchemas.ts
echo "G:" && grep -n "roofType.*39" src/types/property.ts
echo "C:" && grep -n "39_roof_type" api/property/search.ts | head -2

