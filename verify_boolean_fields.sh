#!/bin/bash
# Audit all Boolean Y/N fields (Fields 3, 30, 52, 54, 109, 113, 127, 133, 139, 141, 147, 151, 152, 155, 157, 158, 160, 162, 165)

FIELDS=(
  "30:hoa_yn"
  "52:fireplace_yn"
  "54:pool_yn"
  "113:fiber_available"
  "127:superfund_site_nearby"
  "139:carport_yn"
  "141:garage_attached_yn"
  "147:building_elevator_yn"
  "151:homestead"
  "152:cdd_yn"
  "155:water_frontage_yn"
  "157:water_access_yn"
  "158:water_view_yn"
  "160:can_be_leased_yn"
  "162:lease_restrictions_yn"
  "165:association_approval_yn"
)

FILES=(
  "src/lib/semantic-compare.ts:K1"
  "api/property/semantic-compare.ts:K2"
  "src/pages/AddProperty.tsx:I"
  "src/llm/validation/cmaSchemas.ts:H"
  "src/types/property.ts:G"
  "api/property/search.ts:C"
  "src/pages/PropertyDetail.tsx:D"
  "src/lib/field-normalizer.ts:B"
  "api/property/parse-mls-pdf.ts:F"
  "api/property/arbitration.ts:E"
)

for FIELD in "${FIELDS[@]}"; do
  NUM="${FIELD%%:*}"
  NAME="${FIELD##*:}"
  
  echo ""
  echo "## FIELD ${NUM}: ${NAME}"
  echo ""
  echo "| File | Line | Actual Code | Status |"
  echo "|------|------|-------------|--------|"
  
  for FILE_ENTRY in "${FILES[@]}"; do
    FILE="${FILE_ENTRY%%:*}"
    LABEL="${FILE_ENTRY##*:}"
    
    if [ -f "$FILE" ]; then
      # Search for field number pattern
      RESULT=$(grep -n "${NUM}_${NAME}\|'${NAME}'" "$FILE" | head -1)
      if [ -n "$RESULT" ]; then
        LINE=$(echo "$RESULT" | cut -d: -f1)
        CODE=$(echo "$RESULT" | cut -d: -f2- | sed 's/^[ \t]*//' | cut -c1-60)
        echo "| **${LABEL}** ${FILE##*/} | ${LINE} | \`${CODE}...\` | ✅ FOUND |"
      else
        echo "| **${LABEL}** ${FILE##*/} | N/A | Not found | ❌ |"
      fi
    fi
  done
done
