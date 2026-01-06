/**
 * Verify all 181 fields are mapped in CSV import
 * Run with: npx tsx scripts/verify-csv-field-mapping.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const addPropertyPath = path.join(__dirname, '../src/pages/AddProperty.tsx');
const content = fs.readFileSync(addPropertyPath, 'utf-8');

// Extract all field numbers from row['N_xxx'] patterns
const fieldPattern = /row\['(\d+)_[^']+'\]/g;
const foundFields = new Set<number>();

let match;
while ((match = fieldPattern.exec(content)) !== null) {
  foundFields.add(parseInt(match[1]));
}

console.log('========================================');
console.log('CSV FIELD MAPPING VERIFICATION');
console.log('========================================\n');

// Check all 181 fields
const missingFields: number[] = [];
for (let i = 1; i <= 181; i++) {
  if (!foundFields.has(i)) {
    missingFields.push(i);
  }
}

console.log(`Total unique fields mapped: ${foundFields.size}`);
console.log(`Expected fields: 181`);

if (missingFields.length > 0) {
  console.log(`\n❌ MISSING FIELDS (${missingFields.length}):`);
  missingFields.forEach(f => console.log(`   - Field ${f}`));
  process.exit(1);
} else {
  console.log('\n✅ ALL 181 FIELDS ARE MAPPED');

  // Show distribution
  const sorted = Array.from(foundFields).sort((a, b) => a - b);
  console.log(`\nField range: ${sorted[0]} - ${sorted[sorted.length - 1]}`);

  // Verify no gaps
  let hasGaps = false;
  for (let i = 1; i <= 181; i++) {
    if (!foundFields.has(i)) {
      hasGaps = true;
      break;
    }
  }

  if (!hasGaps) {
    console.log('✅ No gaps in field numbering (1-181 continuous)');
  }

  process.exit(0);
}
