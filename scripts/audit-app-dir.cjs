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
console.log('APP DIRECTORY AUDIT - Field Number Mismatches');
console.log('='.repeat(80));
console.log('');

// Files to audit in app directory
const filesToAudit = [
  'app/api/property/search.ts',
  'app/api/property/search-stream.ts',
  'app/api/property/enrich.ts',
  'app/api/property/free-apis.ts',
  'app/api/property/scrapers.ts',
  'app/api/property/scrape-realtor.ts',
  'app/api/property/florida-crime-scraper.ts',
  'app/src/pages/AddProperty.tsx',
  'app/src/pages/PropertyDetail.tsx',
  'app/src/store/propertyStore.ts',
  'app/src/lib/field-mapping.ts',
  'app/src/types/property.ts',
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
  errors.slice(0, 10).forEach(e => {
    console.log(`  Line ${e.line}: ${e.usedNum}_${e.fieldKey} → ${e.correctNum}_${e.fieldKey}`);
  });
  if (errors.length > 10) {
    console.log(`  ... and ${errors.length - 10} more errors`);
  }
}

console.log('\n');
console.log('='.repeat(80));
console.log('APP DIRECTORY SUMMARY');
console.log('='.repeat(80));
console.log('');
for (const { file, errors } of fileResults) {
  console.log(`${file}: ${errors.length} errors`);
}
console.log('');
console.log(`TOTAL FIELD NUMBER ERRORS IN APP/: ${totalErrors}`);
