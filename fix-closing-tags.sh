#!/bin/bash
FILE="src/components/visuals/recharts/Section6InteriorFeaturesCharts.tsx"

# Fix closing divs - need to close motion.div properly
# Find lines with just </div> that should be </motion.div>
sed -i 's|    </div>\n  );|    </motion.div>\n  );|g' "$FILE"

echo "✅ Fixed closing motion.div tags"
