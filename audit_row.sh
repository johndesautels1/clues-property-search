#!/bin/bash
# Usage: ./audit_row.sh FIELD_NUM FIELD_NAME

FIELD_NUM=$1
FIELD_NAME=$2

echo "## FIELD $FIELD_NUM: $FIELD_NAME"
echo ""
echo "| File | Lines | Code Found | Status |"
echo "|------|-------|------------|--------|"

# K1
K1_RESULT=$(grep -n "$FIELD_NAME\|${FIELD_NUM}_" src/lib/semantic-compare.ts 2>/dev/null | head -2)
if [ -n "$K1_RESULT" ]; then
  echo "| K1 semantic-compare.ts | $(echo "$K1_RESULT" | cut -d: -f1 | tr '\n' ', ') | Found | ✅ |"
else
  echo "| K1 semantic-compare.ts | N/A | NOT FOUND | ❌ |"
fi

# K2
K2_RESULT=$(grep -n "$FIELD_NAME\|${FIELD_NUM}_" api/property/semantic-compare.ts 2>/dev/null | head -2)
if [ -n "$K2_RESULT" ]; then
  echo "| K2 semantic-compare.ts | $(echo "$K2_RESULT" | cut -d: -f1 | tr '\n' ', ') | Found | ✅ |"
else
  echo "| K2 semantic-compare.ts | N/A | NOT FOUND | ❌ |"
fi

# I - AddProperty.tsx
I_RESULT=$(grep -n "${FIELD_NUM}_\|$FIELD_NAME" src/pages/AddProperty.tsx 2>/dev/null | head -1)
if [ -n "$I_RESULT" ]; then
  echo "| I AddProperty.tsx | $(echo "$I_RESULT" | cut -d: -f1) | \`$(echo "$I_RESULT" | cut -d: -f2- | head -c 50)...\` | ✅ |"
else
  echo "| I AddProperty.tsx | N/A | NOT FOUND | ❌ |"
fi

# H - cmaSchemas.ts
H_RESULT=$(grep -n "${FIELD_NUM}_" src/llm/validation/cmaSchemas.ts 2>/dev/null)
if [ -n "$H_RESULT" ]; then
  echo "| H cmaSchemas.ts | $(echo "$H_RESULT" | cut -d: -f1) | \`$(echo "$H_RESULT" | cut -d: -f2 | head -c 50)\` | ✅ |"
else
  echo "| H cmaSchemas.ts | N/A | NOT FOUND | ❌ |"
fi

# G - property.ts
G_RESULT=$(grep -n "$FIELD_NAME\|${FIELD_NUM}" src/types/property.ts 2>/dev/null | head -1)
if [ -n "$G_RESULT" ]; then
  echo "| G property.ts | $(echo "$G_RESULT" | cut -d: -f1) | \`$(echo "$G_RESULT" | cut -d: -f2 | head -c 50)...\` | ✅ |"
else
  echo "| G property.ts | N/A | NOT FOUND | ❌ |"
fi

# C - search.ts
C_RESULT=$(grep -n "${FIELD_NUM}_" api/property/search.ts 2>/dev/null | head -1)
if [ -n "$C_RESULT" ]; then
  echo "| C search.ts | $(echo "$C_RESULT" | cut -d: -f1) | \`$(echo "$C_RESULT" | cut -d: -f2 | head -c 50)...\` | ✅ |"
else
  echo "| C search.ts | N/A | NOT FOUND | ❌ |"
fi

# D - PropertyDetail.tsx
D_RESULT=$(grep -n "$FIELD_NAME\|${FIELD_NUM}_" src/pages/PropertyDetail.tsx 2>/dev/null | head -1)
if [ -n "$D_RESULT" ]; then
  echo "| D PropertyDetail.tsx | $(echo "$D_RESULT" | cut -d: -f1) | \`$(echo "$D_RESULT" | cut -d: -f2 | head -c 40)...\` | ✅ |"
else
  echo "| D PropertyDetail.tsx | N/A | NOT FOUND | ❌ |"
fi

# B - field-normalizer.ts
B_RESULT=$(grep -n "${FIELD_NUM}_\|$FIELD_NAME" src/lib/field-normalizer.ts 2>/dev/null | head -1)
if [ -n "$B_RESULT" ]; then
  echo "| B field-normalizer.ts | $(echo "$B_RESULT" | cut -d: -f1) | \`$(echo "$B_RESULT" | cut -d: -f2 | head -c 50)...\` | ✅ |"
else
  echo "| B field-normalizer.ts | N/A | NOT FOUND | ❌ |"
fi

# F - parse-mls-pdf.ts
F_RESULT=$(grep -n "$FIELD_NAME\|${FIELD_NUM}" api/property/parse-mls-pdf.ts 2>/dev/null | head -1)
if [ -n "$F_RESULT" ]; then
  echo "| F parse-mls-pdf.ts | $(echo "$F_RESULT" | cut -d: -f1) | \`$(echo "$F_RESULT" | cut -d: -f2 | head -c 50)...\` | ✅ |"
else
  echo "| F parse-mls-pdf.ts | N/A | NOT FOUND | ❌ |"
fi

# E - arbitration.ts (always uses K2)
echo "| E arbitration.ts | N/A | Uses K2 semantic-compare | ✅ |"

echo ""
