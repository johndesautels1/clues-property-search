#!/bin/bash
echo "=== FIELD 3: new_construction_yn ==="
echo ""
echo "K1 (src/lib/semantic-compare.ts):"
grep -n "new_construction" src/lib/semantic-compare.ts | head -3
echo ""
echo "K2 (api/property/semantic-compare.ts):"
grep -n "new_construction" api/property/semantic-compare.ts | head -3
echo ""
echo "I (AddProperty.tsx):"
grep -n "3_new_construction_yn\|newConstructionYN" src/pages/AddProperty.tsx | head -5
echo ""
echo "H (cmaSchemas.ts):"
grep -n "3_new_construction_yn" src/llm/validation/cmaSchemas.ts
echo ""
echo "G (property.ts):"
grep -n "newConstructionYN" src/types/property.ts
echo ""
echo "C (search.ts):"
grep -n "3_new_construction_yn\|new_construction_yn" api/property/search.ts | head -5
echo ""
echo "D (PropertyDetail.tsx):"
grep -n "newConstructionYN\|new_construction_yn" src/pages/PropertyDetail.tsx | head -5
echo ""
echo "B (field-normalizer.ts):"
grep -n "newConstructionYN\|3_new_construction" src/lib/field-normalizer.ts
echo ""
echo "F (parse-mls-pdf.ts):"
grep -n "new_construction\|New Construction" api/property/parse-mls-pdf.ts | head -3
