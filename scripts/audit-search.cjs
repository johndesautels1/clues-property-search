const fs = require('fs');

// Read fields-schema.ts to get correct mappings
const schemaContent = fs.readFileSync('src/types/fields-schema.ts', 'utf8');
const schemaRegex = /\{\s*num:\s*(\d+),\s*key:\s*'([^']+)'/g;
const schemaMap = new Map();
let match;
while ((match = schemaRegex.exec(schemaContent)) !== null) {
  schemaMap.set(match[2], parseInt(match[1]));
}

// Read search.ts
const searchContent = fs.readFileSync('api/property/search.ts', 'utf8');

// Find all numbered field mappings like '7_listing_price'
const fieldMappingRegex = /'(\d+)_([a-z_]+)'/g;
const errors = [];
let lineNum = 0;
const lines = searchContent.split('\n');

for (const line of lines) {
  lineNum++;
  let m;
  const lineFieldRegex = /'(\d+)_([a-z_]+)'/g;
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

console.log('SEARCH.TS FIELD NUMBER ERRORS:');
console.log('==============================');
errors.forEach(e => {
  console.log(`Line ${e.line}: ${e.usedNum}_${e.fieldKey} should be ${e.correctNum}_${e.fieldKey}`);
});
console.log('');
console.log('TOTAL ERRORS:', errors.length);
