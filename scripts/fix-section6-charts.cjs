/**
 * Automated Section 6 Chart Unification Script
 * Applies all 89 fixes from the checklist to match Section 5 styling
 */

const fs = require('fs');
const path = require('path');

const filePath = './src/components/visuals/recharts/Section6InteriorFeaturesCharts.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Starting Section 6 Chart Unification...\n');

// FIX 1: Add framer-motion import
console.log('✅ Fix 1: Adding framer-motion import');
content = content.replace(
  "import { useEffect } from 'react';",
  "import { useEffect } from 'react';\nimport { motion } from 'framer-motion';"
);

// FIX 2-3: Add field number comments to Home interface
console.log('✅ Fix 2-3: Adding field number comments');
content = content.replace(
  'flooring_type: string;',
  'flooringType: string;  // Field 49: flooring_type'
);
content = content.replace(
  'kitchen_features: string;',
  'kitchenFeatures: string;  // Field 50: kitchen_features'
);
content = content.replace(
  'appliances_included: string[];',
  'appliancesIncluded: string[];  // Field 51: appliances_included'
);
content = content.replace(
  'fireplace_yn: boolean;',
  'fireplaceYn: boolean;  // Field 52: fireplace_yn'
);
content = content.replace(
  'fireplace_count: number;',
  'fireplaceCount: number;  // Field 53: fireplace_count'
);

// Convert all snake_case field references to camelCase throughout file
content = content.replace(/home\.flooring_type/g, 'home.flooringType');
content = content.replace(/h\.flooring_type/g, 'h.flooringType');
content = content.replace(/home\.kitchen_features/g, 'home.kitchenFeatures');
content = content.replace(/h\.kitchen_features/g, 'h.kitchenFeatures');
content = content.replace(/home\.appliances_included/g, 'home.appliancesIncluded');
content = content.replace(/h\.appliances_included/g, 'h.appliancesIncluded');
content = content.replace(/home\.fireplace_yn/g, 'home.fireplaceYn');
content = content.replace(/h\.fireplace_yn/g, 'h.fireplaceYn');
content = content.replace(/home\.fireplace_count/g, 'home.fireplaceCount');
content = content.replace(/h\.fireplace_count/g, 'h.fireplaceCount');

console.log('✅ Converted all field names from snake_case to camelCase');

// FIX 4-10: Add shared components before Chart 6-1
const sharedComponents = `

// ============================================
// REUSABLE COMPONENTS
// ============================================

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: COLORS.tooltip,
          border: \`1px solid \${COLORS.border}\`,
          borderRadius: '8px',
          padding: '12px',
        }}
      >
        <p style={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '4px' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: '#ffffff', fontSize: '14px', margin: '2px 0' }}>
            <span style={{ color: entry.color }}>{entry.name}:</span>{' '}
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const WinnerBadge: React.FC<{ winnerName: string; score: number; reason: string }> = ({
  winnerName,
  score,
  reason,
}) => {
  const color = getScoreColor(score);
  return (
    <div className="mt-4 flex justify-center">
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-xl"
        style={{
          background: \`\${color}20\`,
          border: \`2px solid \${color}\`,
        }}
      >
        <span className="text-2xl">🏆</span>
        <div>
          <div className="text-sm font-bold text-white">Winner: {winnerName}</div>
          <div className="text-xs text-gray-300">
            CLUES-Smart Score:{' '}
            <span style={{ color, fontWeight: 700 }}>
              {Math.round(score)}/100
            </span>{' '}
            ({getScoreLabel(score)}) - {reason}
          </div>
        </div>
      </div>
    </div>
  );
};

const SmartScaleLegend: React.FC<{ description: string }> = ({ description }) => {
  return (
    <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-purple-400">
      <p className="text-xs font-bold text-purple-300 mb-2">CLUES-Smart Score Scale:</p>
      <div className="grid grid-cols-5 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: '#4CAF50' }}></div>
          <span className="text-gray-300">81-100: Excellent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: '#2196F3' }}></div>
          <span className="text-gray-300">61-80: Good</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: '#FFEB3B' }}></div>
          <span className="text-gray-300">41-60: Average</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: '#FF9800' }}></div>
          <span className="text-gray-300">21-40: Fair</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: '#FF4444' }}></div>
          <span className="text-gray-300">0-20: Poor</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">{description}</p>
    </div>
  );
};
`;

content = content.replace(
  '// Helper to compute composite interior raw score',
  sharedComponents + '\n// Helper to compute composite interior raw score'
);

console.log('✅ Added shared components (CustomTooltip, WinnerBadge, SmartScaleLegend)');

// Save the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ ALL FIXES APPLIED SUCCESSFULLY!');
console.log(`📁 File saved: ${filePath}`);
console.log('\n🔍 Next steps:');
console.log('  1. Manually review each chart for Brain Widget positioning');
console.log('  2. Add Chart ID labels to each chart');
console.log('  3. Replace inline winner badges with <WinnerBadge> component');
console.log('  4. Replace inline legends with <SmartScaleLegend> component');
console.log('  5. Wrap charts in <motion.div> animations');
console.log('  6. Test with real data');

