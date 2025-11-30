const fs = require('fs');
const path = require('path');

// Read fields-schema.ts to get correct mappings
const schemaContent = fs.readFileSync('src/types/fields-schema.ts', 'utf8');
const schemaRegex = /\{\s*num:\s*(\d+),\s*key:\s*'([^']+)'/g;
const schemaMap = new Map();
let match;
while ((match = schemaRegex.exec(schemaContent)) !== null) {
  schemaMap.set(match[2], parseInt(match[1]));
}

console.log('='.repeat(80));
console.log('MASTER CODEBASE AUDIT - Field Number Mismatches');
console.log('='.repeat(80));
console.log('');

// Files to audit
const filesToAudit = [
  'api/property/search-stream.ts',
  'api/property/search.ts',
  'api/property/stellar-mls.ts',
  'api/property/parse-mls-pdf.ts',
  'api/property/arbitration.ts',
  'api/property/free-apis.ts',
  'api/property/retry-llm.ts',
  'api/property/enrich.ts',
  'src/lib/field-normalizer.ts',
  'src/lib/field-mapping.ts',
  'src/lib/arbitration.ts',
  'src/pages/PropertyDetail.tsx',
  'src/pages/AddProperty.tsx',
  'src/store/propertyStore.ts',
  'src/types/property.ts',
];

let totalErrors = 0;
const fileResults = [];

for (const file of filesToAudit) {
  if (!fs.existsSync(file)) continue;

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const errors = [];

  let lineNum = 0;
  for (const line of lines) {
    lineNum++;
    const lineFieldRegex = /'(\d+)_([a-z_]+)'/g;
    let m;
    while ((m = lineFieldRegex.exec(line)) !== null) {
      const usedNum = parseInt(m[1]);
      const fieldKey = m[2];
      const correctNum = schemaMap.get(fieldKey);

      if (correctNum && correctNum !== usedNum) {
        errors.push({
          line: lineNum,
          fieldKey: fieldKey,
          usedNum: usedNum,
          correctNum: correctNum
        });
      }
    }
  }

  if (errors.length > 0) {
    fileResults.push({ file, errors });
    totalErrors += errors.length;
  }
}

// Print results
for (const { file, errors } of fileResults) {
  console.log(`\n### ${file} (${errors.length} errors)`);
  console.log('-'.repeat(60));
  for (const e of errors) {
    console.log(`  Line ${e.line}: ${e.usedNum}_${e.fieldKey} → ${e.correctNum}_${e.fieldKey}`);
  }
}

console.log('\n');
console.log('='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log('');
for (const { file, errors } of fileResults) {
  console.log(`${file}: ${errors.length} errors`);
}
console.log('');
console.log(`TOTAL FIELD NUMBER ERRORS: ${totalErrors}`);
