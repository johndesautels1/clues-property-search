#!/bin/bash
FILE="src/components/visuals/recharts/Section6InteriorFeaturesCharts.tsx"

echo "🔧 Applying ALL remaining fixes..."

# Add Chart ID labels before each h3 title
for i in {1..10}; do
  sed -i "s|<h3 className=\"text-lg font-semibold text-white mb-2\">Chart 6-$i:|{/* Chart ID Label */}\n      <div className=\"absolute -top-3 left-3 text-[10px] font-mono text-gray-500\">\n        Chart 6-$i\n      </div>\n\n      <h3 className=\"text-lg font-semibold text-white mb-2\">Chart 6-$i:|g" "$FILE"
  echo "✅ Added Chart ID label to Chart 6-$i"
done

echo ""
echo "✅ ALL FIXES COMPLETE"
