#!/bin/bash
# Audit Rating, Time/Duration, Currency, List, Speed, Market, Direction fields

echo "## RATING FIELDS (3 fields)"
echo ""

# Field 66: elementary_rating
echo "### FIELD 66: elementary_rating"
echo ""
echo "| File | Line | Code |"
echo "|------|------|------|"
grep -n "66_elementary_rating\|elementary_rating\|normalizeRating" src/lib/semantic-compare.ts | head -3 | while read line; do
  linenum=$(echo "$line" | cut -d: -f1)
  code=$(echo "$line" | cut -d: -f2- | sed 's/^[ \t]*//' | cut -c1-50)
  echo "| semantic-compare.ts | $linenum | \`$code\` |"
done
grep -n "66_elementary_rating" src/pages/AddProperty.tsx | head -1 | while read line; do
  linenum=$(echo "$line" | cut -d: -f1)
  code=$(echo "$line" | cut -d: -f2- | sed 's/^[ \t]*//' | cut -c1-50)
  echo "| AddProperty.tsx | $linenum | \`$code\` |"
done
grep -n "66_elementary_rating" src/llm/validation/cmaSchemas.ts | head -1 | while read line; do
  linenum=$(echo "$line" | cut -d: -f1)
  code=$(echo "$line" | cut -d: -f2- | sed 's/^[ \t]*//' | cut -c1-50)
  echo "| cmaSchemas.ts | $linenum | \`$code\` |"
done
echo ""

echo "## TIME/DURATION FIELDS (9 fields)"
echo ""

# Field 40: roof_age_est
echo "### FIELD 40: roof_age_est"
echo ""
echo "| File | Line | Code |"
echo "|------|------|------|"
grep -n "40_roof_age\|roof_age\|normalizeTimeDuration" src/lib/semantic-compare.ts | head -3 | while read line; do
  linenum=$(echo "$line" | cut -d: -f1)
  code=$(echo "$line" | cut -d: -f2- | sed 's/^[ \t]*//' | cut -c1-50)
  echo "| semantic-compare.ts | $linenum | \`$code\` |"
done
grep -n "40_roof_age" src/pages/AddProperty.tsx | head -1 | while read line; do
  linenum=$(echo "$line" | cut -d: -f1)
  code=$(echo "$line" | cut -d: -f2- | sed 's/^[ \t]*//' | cut -c1-50)
  echo "| AddProperty.tsx | $linenum | \`$code\` |"
done
echo ""

echo "## LIST/ARRAY FIELDS (12 fields)"
echo ""

# Field 33: hoa_includes
echo "### FIELD 33: hoa_includes"
echo ""
echo "| File | Line | Code |"
echo "|------|------|------|"
grep -n "33_hoa_includes\|normalizeListValue" src/lib/semantic-compare.ts | head -3 | while read line; do
  linenum=$(echo "$line" | cut -d: -f1)
  code=$(echo "$line" | cut -d: -f2- | sed 's/^[ \t]*//' | cut -c1-50)
  echo "| semantic-compare.ts | $linenum | \`$code\` |"
done
grep -n "33_hoa_includes" src/pages/AddProperty.tsx | head -1 | while read line; do
  linenum=$(echo "$line" | cut -d: -f1)
  code=$(echo "$line" | cut -d: -f2- | sed 's/^[ \t]*//' | cut -c1-50)
  echo "| AddProperty.tsx | $linenum | \`$code\` |"
done
echo ""

echo "## INTERNET SPEED FIELD"
echo ""

# Field 112: max_internet_speed
echo "### FIELD 112: max_internet_speed"
echo ""
echo "| File | Line | Code |"
echo "|------|------|------|"
grep -n "112_max_internet_speed\|normalizeInternetSpeed" src/lib/semantic-compare.ts | head -3 | while read line; do
  linenum=$(echo "$line" | cut -d: -f1)
  code=$(echo "$line" | cut -d: -f2- | sed 's/^[ \t]*//' | cut -c1-50)
  echo "| semantic-compare.ts | $linenum | \`$code\` |"
done
grep -n "112_max_internet_speed" src/pages/AddProperty.tsx | head -1 | while read line; do
  linenum=$(echo "$line" | cut -d: -f1)
  code=$(echo "$line" | cut -d: -f2- | sed 's/^[ \t]*//' | cut -c1-50)
  echo "| AddProperty.tsx | $linenum | \`$code\` |"
done
echo ""

echo "## SYNONYM FIELDS"
echo ""

# Field 34: ownership_type
echo "### FIELD 34: ownership_type (OWNERSHIP_TYPE_SYNONYMS)"
echo ""
echo "| File | Line | Code |"
echo "|------|------|------|"
grep -n "OWNERSHIP_TYPE_SYNONYMS\|ownership" src/lib/semantic-compare.ts | head -5 | while read line; do
  linenum=$(echo "$line" | cut -d: -f1)
  code=$(echo "$line" | cut -d: -f2- | sed 's/^[ \t]*//' | cut -c1-50)
  echo "| semantic-compare.ts | $linenum | \`$code\` |"
done
echo ""

# Field 154: front_exposure (DIRECTION_SYNONYMS)
echo "### FIELD 154: front_exposure (DIRECTION_SYNONYMS)"
echo ""
echo "| File | Line | Code |"
echo "|------|------|------|"
grep -n "DIRECTION_SYNONYMS\|front_exposure\|direction" src/lib/semantic-compare.ts | head -5 | while read line; do
  linenum=$(echo "$line" | cut -d: -f1)
  code=$(echo "$line" | cut -d: -f2- | sed 's/^[ \t]*//' | cut -c1-50)
  echo "| semantic-compare.ts | $linenum | \`$code\` |"
done
echo ""
