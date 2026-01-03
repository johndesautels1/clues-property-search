#!/usr/bin/env node
/**
 * Fix all remaining Section 6 charts (6-2 through 6-10)
 * Applies Chart 6-1 pattern to all
 */

const fs = require('fs');

const filePath = 'D:\\Clues_Quantum_Property_Dashboard\\src\\components\\visuals\\recharts\\Section6InteriorFeaturesCharts.tsx';

console.log('🔧 Fixing Charts 6-2 through 6-10...\n');

let content = fs.readFileSync(filePath, 'utf8');

// Chart configurations: [chartNum, delay, reason, description]
const charts = [
  ['6-2', '0.2', 'Includes the most appliances', 'Homes offering more appliances (washer, dryer, etc.) score higher on this metric.'],
  ['6-3', '0.3', 'Most fireplaces present', 'Homes with a fireplace (especially multiple fireplaces) score higher, while homes with none score lowest.'],
  ['6-4', '0.4', 'Best overall kitchen features', 'Kitchens with luxury finishes, modern appliances, and open layouts achieve higher scores.'],
  ['6-5', '0.5', 'Best overall interior', 'Combined interior score reflecting all features (flooring, kitchen, appliances, fireplace).'],
  ['6-6', '0.6', 'Highest interior score overall', 'More included appliances often coincide with a higher interior score, as shown by the upward trend.'],
  ['6-7', '0.7', 'Strongest interior features overall', 'The top home\\\'s interior score is built from flooring, kitchen, and appliance points (waterfall breakdown).'],
  ['6-8', '0.8', 'Warmest interior (more fireplaces)', 'Bar color indicates fireplace count (gray for 0, orange for 1, red for 2+).'],
  ['6-9', '0.9', 'Most popular appliance set', 'Larger pie slices mean more properties share that appliance combination.'],
  ['6-10', '1.0', 'Top interior features overall', 'Final ranking of properties by interior quality, from best (1st) to worst (3rd).'],
];

charts.forEach(([chartNum, delay, reason, description]) => {
  const chartId = chartNum.replace('-', '_');
  console.log(`✅ Fixing Chart ${chartNum}...`);

  // Pattern to match the old return statement structure
  const pattern = new RegExp(
    `(function Chart${chartId}_[A-Za-z]+.*?\\n.*?}, \\[homes\\]\\);\\n  return \\(\\n)` +
    `    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">\\n` +
    `(.*?)` +
    `    <\/div>\\n` +
    `  \\);\\n}`,
    'gs'
  );

  content = content.replace(pattern, (match, prefix, body) => {
    // Extract title and subtitle
    const titleMatch = body.match(/<h3 className="text-lg font-semibold text-white mb-2">(.*?)<\/h3>/);
    const subtitleMatch = body.match(/<p className="text-xs text-gray-400 mb-4">(.*?)<\/p>/);

    const title = titleMatch ? titleMatch[1] : `Chart ${chartNum}`;
    const subtitle = subtitleMatch ? subtitleMatch[1] : '';

    // Remove old Brain Widget, TITLE comments, and winner/legend sections
    body = body.replace(/\s*{\/\* BRAIN WIDGET.*?\n.*?<\/div>\n/gs, '');
    body = body.replace(/\s*{\/\* TITLE.*?\n/g, '');
    body = body.replace(/<h3 className="text-lg.*?<\/h3>\n/gs, '');
    body = body.replace(/<p className="text-xs text-gray-400 mb-4">.*?<\/p>\n/gs, '');
    body = body.replace(/\s*{\/\* CHART.*?\n/g, '');
    body = body.replace(/\s*{\/\* WINNER BADGE.*?\n.*?<\/div>\s+<\/div>\s+<\/div>/gs, '');
    body = body.replace(/\s*{\/\* SMART SCALE LEGEND.*?\n.*?<\/div>\s+<\/div>/gs, '');

    // Build new structure
    return `${prefix}    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: ${delay} }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      {/* Chart ID Label */}
      <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">
        Chart ${chartNum}
      </div>

      {/* Brain Widget */}
      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart</span>
        <span className="text-sm font-bold" style={{ color: getScoreColor(maxScore) }}>
          {maxScore}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">${title}</h3>
${subtitle ? `      <p className="text-xs text-gray-400 mb-4">${subtitle}</p>\n\n` : '\n'}${body.trim()}

      <WinnerBadge
        winnerName={winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')}
        score={maxScore}
        reason="${reason}"
      />

      <SmartScaleLegend description="${description}" />
    </motion.div>
  );
}`;
  });
});

fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ All charts 6-2 through 6-10 fixed!');
console.log('🔍 Testing build...\n');
