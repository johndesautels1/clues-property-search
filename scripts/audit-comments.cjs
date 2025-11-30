const fs = require('fs');

// Read property.ts
const propContent = fs.readFileSync('src/types/property.ts', 'utf8');

// Extract field comments like '// #6' or '// #41'
const fieldCommentRegex = /(\w+):\s*DataField<[^>]+>;\s*\/\/\s*#(\d+)/g;
const propFields = [];
let match;
while ((match = fieldCommentRegex.exec(propContent)) !== null) {
  propFields.push({ propName: match[1], commentNum: parseInt(match[2]) });
}

// Read field-normalizer.ts to get propName -> fieldNumber
const normContent = fs.readFileSync('src/lib/field-normalizer.ts', 'utf8');
const normRegex = /fieldNumber:\s*(\d+),\s*apiKey:\s*'[^']+',\s*group:\s*'[^']+',\s*propName:\s*'([^']+)'/g;
const normMap = new Map();
while ((match = normRegex.exec(normContent)) !== null) {
  normMap.set(match[2], parseInt(match[1]));
}

console.log('PROPERTY.TS COMMENT ERRORS:');
console.log('============================');
let errorCount = 0;
for (const pf of propFields) {
  const correctNum = normMap.get(pf.propName);
  if (correctNum && correctNum !== pf.commentNum) {
    console.log('propName:', pf.propName, '| Comment says #' + pf.commentNum, '| Should be #' + correctNum);
    errorCount++;
  }
}
console.log('');
console.log('TOTAL WRONG COMMENTS:', errorCount);
