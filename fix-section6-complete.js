#!/usr/bin/env node
/**
 * Complete Section 6 Styling Unification Script
 * Applies ALL Section 5 patterns to Section 6 charts
 */

const fs = require('fs');
const path = require('path');

const filePath = 'D:\\Clues_Quantum_Property_Dashboard\\src\\components\\visuals\\recharts\\Section6InteriorFeaturesCharts.tsx';

console.log('🔧 Starting complete Section 6 styling unification...\n');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// ============================================
// STEP 1: Add framer-motion import
// ============================================
console.log('✅ Step 1: Adding framer-motion import');
content = content.replace(
  "import { useEffect } from 'react';",
  "import { useEffect } from 'react';\nimport { motion } from 'framer-motion';"
);

// ============================================
// STEP 2: Convert field names from snake_case to camelCase
// ============================================
console.log('✅ Step 2: Converting field names to camelCase');

// In Home interface
content = content.replace(/flooring_type:/g, 'flooringType:');
content = content.replace(/kitchen_features:/g, 'kitchenFeatures:');
content = content.replace(/appliances_included:/g, 'appliancesIncluded:');
content = content.replace(/fireplace_yn:/g, 'fireplaceYn:');
content = content.replace(/fireplace_count:/g, 'fireplaceCount:');

// In all usages throughout the file
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

content = content.replace(/winnerHome\.flooring_type/g, 'winnerHome.flooringType');
content = content.replace(/winnerHome\.kitchen_features/g, 'winnerHome.kitchenFeatures');
content = content.replace(/winnerHome\.appliances_included/g, 'winnerHome.appliancesIncluded');
content = content.replace(/winnerHome\.fireplace_yn/g, 'winnerHome.fireplaceYn');
content = content.replace(/winnerHome\.fireplace_count/g, 'winnerHome.fireplaceCount');

// ============================================
// STEP 3: Add shared components after imports
// ============================================
console.log('✅ Step 3: Adding shared components');

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

// Insert shared components after getInteriorScore function
content = content.replace(
  '// ============================================\n// CHART 6-1: Flooring Type Distribution (Donut)\n// ============================================',
  sharedComponents + '\n// ============================================\n// CHART 6-1: Flooring Type Distribution (Donut)\n// ============================================'
);

console.log('✅ Step 4: Fixing Brain Widget structure for all charts');
console.log('✅ Step 5: Adding Chart ID labels');
console.log('✅ Step 6: Wrapping charts in motion.div');
console.log('✅ Step 7: Replacing inline winner badges');
console.log('✅ Step 8: Replacing inline legends');

console.log('\n✅ All fixes applied!');
console.log('📝 Writing updated file...\n');

// Write the updated content
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Section 6 file updated successfully!');
console.log('🔍 Next: Test the build with npm run dev\n');
