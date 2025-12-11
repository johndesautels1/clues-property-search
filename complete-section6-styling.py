#!/usr/bin/env python3
"""
Complete Section 6 Chart Styling Unification
Fixes all 10 charts to match Section 5 patterns
"""

import re

file_path = r'D:\Clues_Quantum_Property_Dashboard\src\components\visuals\recharts\Section6InteriorFeaturesCharts.tsx'

print('🔧 Starting complete Section 6 styling unification...\n')

with open(file_path, 'r', encoding='utf8') as f:
    content = f.read()

# Define chart numbers and names for systematic replacement
charts = [
    ('6-1', 'Flooring Type Distribution', 'Has the most premium flooring'),
    ('6-2', 'Appliance Counts per Property', 'Includes the most appliances'),
    ('6-3', 'Fireplace Presence & Count', 'Most fireplaces present'),
    ('6-4', 'Kitchen Features Scoring', 'Best overall kitchen features'),
    ('6-5', 'Composite Interior Score', 'Best overall interior'),
    ('6-6', 'Appliance Richness vs Interior Score', 'Highest interior score overall'),
    ('6-7', 'Interior Score Contribution', 'Strongest interior features overall'),
    ('6-8', 'Fireplace Presence Heatmap', 'Warmest interior (more fireplaces)'),
    ('6-9', 'Appliance Combination Popularity', 'Most popular appliance set'),
    ('6-10', 'Interior Features Smart Rank', 'Top interior features overall'),
]

def fix_chart_structure(chart_num, chart_name, reason):
    """Fix a single chart's structure"""
    chart_id = chart_num.replace('-', '_')

    # Pattern to find the return statement
    pattern = rf'(function Chart{chart_id}_[A-Za-z]+.*?\n.*?return \(\n)(.*?)(^\s+\);$)'

    def replace_return(match):
        func_line = match.group(1)
        body = match.group(2)
        closing = match.group(3)

        # Check if already has motion.div
        if '<motion.div' in body:
            return match.group(0)  # Already fixed

        # Add motion.div wrapper
        new_body = f'''    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.{chart_num.split('-')[1]} }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      {{/* Chart ID Label */}}
      <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">
        Chart {chart_num}
      </div>

      {{/* Brain Widget */}}
      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart</span>
        <span className="text-sm font-bold" style={{{{ color: getScoreColor(maxScore) }}}}>
          {{maxScore}}
        </span>
      </div>

'''

        # Remove old Brain Widget div and title section
        body = re.sub(r'\s*{\/\* BRAIN WIDGET.*?\n.*?<div className="absolute top-4.*?<\/div>\n', '', body, flags=re.DOTALL)
        body = re.sub(r'\s*{\/\* TITLE.*?\n', '', body)

        new_body += body.lstrip()

        # Replace inline winner badge
        winner_pattern = r'<div className="mt-4 flex justify-center">.*?<\/div>\s+<\/div>\s+<\/div>'
        new_body = re.sub(winner_pattern,
                         f'''<WinnerBadge
        winnerName={{winnerIndices.map(i => homes[i].name.split(',')[0]).join(' & ')}}
        score={{maxScore}}
        reason="{reason}"
      />''',
                         new_body, flags=re.DOTALL)

        # Replace inline legend
        legend_pattern = r'<div className="mt-4 p-3 bg-white\/5.*?<\/div>\s+<\/div>'
        description_map = {
            '6-1': 'CLUES favors premium flooring (e.g., hardwood) with higher scores, while basic flooring (e.g., carpet) scores lower.',
            '6-2': 'Homes offering more appliances (washer, dryer, etc.) score higher on this metric.',
            '6-3': 'Homes with a fireplace (especially multiple fireplaces) score higher, while homes with none score lowest.',
            '6-4': 'Kitchens with luxury finishes, modern appliances, and open layouts achieve higher scores.',
            '6-5': 'Combined interior score reflecting all features (flooring, kitchen, appliances, fireplace).',
            '6-6': 'More included appliances often coincide with a higher interior score, as shown by the upward trend.',
            '6-7': 'The top home\'s interior score is built from flooring, kitchen, and appliance points (waterfall breakdown).',
            '6-8': 'Bar color indicates fireplace count (gray for 0, orange for 1, red for 2+).',
            '6-9': 'Larger pie slices mean more properties share that appliance combination.',
            '6-10': 'Final ranking of properties by interior quality, from best (1st) to worst (3rd).',
        }
        desc = description_map.get(chart_num, 'Interior features comparison')
        new_body = re.sub(legend_pattern,
                         f'<SmartScaleLegend description="{desc}" />',
                         new_body, flags=re.DOTALL)

        # Close motion.div
        new_body += '\n    </motion.div>'

        return func_line + new_body + '\n' + closing

    return re.sub(pattern, replace_return, content, flags=re.MULTILINE | re.DOTALL)

# Apply fixes to all charts
for chart_num, chart_name, reason in charts:
    print(f'✅ Fixing Chart {chart_num}: {chart_name}')
    content = fix_chart_structure(chart_num, chart_name, reason)

print('\n✅ All chart structures updated!')
print('📝 Writing updated file...\n')

with open(file_path, 'w', encoding='utf8') as f:
    f.write(content)

print('✅ Section 6 styling unification complete!')
print('🔍 Next: Test the build with npm run dev\n')
