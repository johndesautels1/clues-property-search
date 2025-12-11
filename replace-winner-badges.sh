#!/bin/bash
FILE="src/components/visuals/recharts/Section6InteriorFeaturesCharts.tsx"

# Replace inline winner badge in Chart 6-1 with component
perl -i -pe 's|      <div className="mt-4 flex justify-center">.*?most premium flooring.*?</div>\s*</div>\s*</div>|      <WinnerBadge\n        winnerName={winnerIndices.map(i => homes[i].name).join(\' & \')}\n        score={maxScore}\n        reason="Has the most premium flooring"\n      />|gs' "$FILE"

echo "✅ Replaced inline winner badges with WinnerBadge component"
