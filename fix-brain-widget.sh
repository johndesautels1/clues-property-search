#!/bin/bash
FILE="src/components/visuals/recharts/Section6InteriorFeaturesCharts.tsx"

# Fix Brain Widget content structure - replace multiline div structure with inline spans
sed -i ':a;N;$!ba;s/<span className="text-xl">🧠<\/span>\n        <div className="text-xs">\n          <div className="font-bold text-white">SMART Score<\/div>\n          <div style={{ color: getScoreColor(maxScore), fontWeight: 700 }}>\n            {maxScore}\/100\n          <\/div>\n        <\/div>/<span className="text-sm">🧠<\/span>\n        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart<\/span>\n        <span className="text-sm font-bold" style={{ color: getScoreColor(maxScore) }}>{maxScore}<\/span>/g' "$FILE"

echo "✅ Fixed Brain Widget content structure"
