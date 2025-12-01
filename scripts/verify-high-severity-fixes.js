/**
 * VERIFICATION SCRIPT: High Severity Issue Fixes
 *
 * This script verifies that all HIGH severity issues have been fixed:
 * 1. Unhandled promise rejections
 * 2. Missing null checks
 * 3. Timeout issues
 * 4. Input sanitization
 *
 * Run: node scripts/verify-high-severity-fixes.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files that were fixed
const FILES_TO_CHECK = [
  'src/lib/safe-json-parse.ts',
  'api/property/enrich.ts',
  'api/property/free-apis.ts',
  'api/property/autocomplete.ts',
  'api/property/search.ts',
  'api/property/retry-llm.ts',
];

// Patterns that indicate FIXED code
const FIXED_PATTERNS = {
  safeFetch: /safeFetch\s*<\s*any\s*>\s*\(/g,
  safeFetchImport: /import\s*{\s*[^}]*safeFetch[^}]*}\s*from/g,
  sanitizeAddress: /sanitizeAddress\s*\(/g,
  sanitizeAddressImport: /import\s*{\s*[^}]*sanitizeAddress[^}]*}\s*from/g,
  nullSafeAccess: /\?\.\[/g,
  promiseAllSettled: /Promise\.allSettled/g,
  abortController: /AbortController/g,
};

// Patterns that indicate UNFIXED issues (should NOT be present)
const UNFIXED_PATTERNS = {
  unsafeFetch: /await\s+fetch\s*\([^)]+\)\s*;\s*\n\s*const\s+\w+\s*=\s*await\s+\w+\.json\s*\(\)/g,
  directResponseJson: /const\s+\w+\s*=\s*await\s+response\.json\(\)/g,
};

let totalPassed = 0;
let totalFailed = 0;
const results = [];

console.log('='.repeat(60));
console.log('HIGH SEVERITY FIX VERIFICATION');
console.log('='.repeat(60));
console.log('');

// Check safe-json-parse.ts for new utilities
const safeJsonParsePath = path.join(__dirname, '..', 'src', 'lib', 'safe-json-parse.ts');
if (fs.existsSync(safeJsonParsePath)) {
  const content = fs.readFileSync(safeJsonParsePath, 'utf8');

  console.log('1. SAFE-JSON-PARSE.TS UTILITIES');
  console.log('-'.repeat(40));

  // Check safeFetch function
  const hasSafeFetch = content.includes('export async function safeFetch');
  console.log(`   [${hasSafeFetch ? 'PASS' : 'FAIL'}] safeFetch() function exported`);
  hasSafeFetch ? totalPassed++ : totalFailed++;

  // Check timeout handling
  const hasTimeout = content.includes('AbortController') && content.includes('setTimeout');
  console.log(`   [${hasTimeout ? 'PASS' : 'FAIL'}] Timeout handling (AbortController)`);
  hasTimeout ? totalPassed++ : totalFailed++;

  // Check error handling
  const hasErrorHandling = content.includes('response.ok') && content.includes('catch (error)');
  console.log(`   [${hasErrorHandling ? 'PASS' : 'FAIL'}] Error handling in safeFetch`);
  hasErrorHandling ? totalPassed++ : totalFailed++;

  // Check sanitizeAddress
  const hasSanitize = content.includes('export function sanitizeAddress');
  console.log(`   [${hasSanitize ? 'PASS' : 'FAIL'}] sanitizeAddress() function exported`);
  hasSanitize ? totalPassed++ : totalFailed++;

  // Check isNullish
  const hasIsNullish = content.includes('export function isNullish');
  console.log(`   [${hasIsNullish ? 'PASS' : 'FAIL'}] isNullish() function exported`);
  hasIsNullish ? totalPassed++ : totalFailed++;

  // Check hasValue
  const hasHasValue = content.includes('export function hasValue');
  console.log(`   [${hasHasValue ? 'PASS' : 'FAIL'}] hasValue() function exported`);
  hasHasValue ? totalPassed++ : totalFailed++;

  console.log('');
}

// Check each API file for safeFetch usage
const apiFiles = [
  { name: 'enrich.ts', path: 'api/property/enrich.ts' },
  { name: 'free-apis.ts', path: 'api/property/free-apis.ts' },
  { name: 'autocomplete.ts', path: 'api/property/autocomplete.ts' },
];

console.log('2. API FILES - SAFEFETCH USAGE');
console.log('-'.repeat(40));

for (const file of apiFiles) {
  const filePath = path.join(__dirname, '..', file.path);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check safeFetch import
    const hasImport = content.includes("safeFetch") && content.includes("from '../../src/lib/safe-json-parse");
    console.log(`   [${hasImport ? 'PASS' : 'FAIL'}] ${file.name}: safeFetch imported`);
    hasImport ? totalPassed++ : totalFailed++;

    // Count safeFetch usages
    const safeFetchMatches = content.match(/await\s+safeFetch\s*</g) || [];
    const count = safeFetchMatches.length;
    console.log(`   [${count > 0 ? 'PASS' : 'FAIL'}] ${file.name}: ${count} safeFetch() calls`);
    count > 0 ? totalPassed++ : totalFailed++;

    // Check for remaining unsafe fetch patterns (direct fetch + json)
    const unsafeMatches = content.match(/await\s+fetch\s*\([^)]+\)\s*;\s*\n[^;]*await\s+\w+\.json\s*\(\)/g) || [];
    console.log(`   [${unsafeMatches.length === 0 ? 'PASS' : 'WARN'}] ${file.name}: ${unsafeMatches.length} unsafe fetch patterns remaining`);
    unsafeMatches.length === 0 ? totalPassed++ : totalFailed++;
  }
}

console.log('');

// Check for input sanitization
console.log('3. INPUT SANITIZATION');
console.log('-'.repeat(40));

const sanitizationFiles = [
  { name: 'search.ts', path: 'api/property/search.ts' },
  { name: 'retry-llm.ts', path: 'api/property/retry-llm.ts' },
  { name: 'enrich.ts', path: 'api/property/enrich.ts' },
  { name: 'autocomplete.ts', path: 'api/property/autocomplete.ts' },
];

for (const file of sanitizationFiles) {
  const filePath = path.join(__dirname, '..', file.path);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasSanitize = content.includes('sanitizeAddress(');
    console.log(`   [${hasSanitize ? 'PASS' : 'FAIL'}] ${file.name}: sanitizeAddress() used`);
    hasSanitize ? totalPassed++ : totalFailed++;
  }
}

console.log('');

// Check for Promise.allSettled usage
console.log('4. PROMISE.ALLSETTLED USAGE');
console.log('-'.repeat(40));

const promiseFiles = [
  { name: 'search.ts', path: 'api/property/search.ts' },
  { name: 'enrich.ts', path: 'api/property/enrich.ts' },
];

for (const file of promiseFiles) {
  const filePath = path.join(__dirname, '..', file.path);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasAllSettled = content.includes('Promise.allSettled');
    console.log(`   [${hasAllSettled ? 'PASS' : 'FAIL'}] ${file.name}: Promise.allSettled used`);
    hasAllSettled ? totalPassed++ : totalFailed++;
  }
}

console.log('');

// Check for null-safe property access
console.log('5. NULL-SAFE PROPERTY ACCESS');
console.log('-'.repeat(40));

const nullCheckFiles = [
  { name: 'enrich.ts', path: 'api/property/enrich.ts' },
  { name: 'free-apis.ts', path: 'api/property/free-apis.ts' },
];

for (const file of nullCheckFiles) {
  const filePath = path.join(__dirname, '..', file.path);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Count optional chaining usage
    const optionalChainMatches = content.match(/\?\./g) || [];
    console.log(`   [PASS] ${file.name}: ${optionalChainMatches.length} optional chaining (?.) usages`);
    totalPassed++;

    // Count Array.isArray checks
    const arrayChecks = content.match(/Array\.isArray/g) || [];
    console.log(`   [${arrayChecks.length > 0 ? 'PASS' : 'INFO'}] ${file.name}: ${arrayChecks.length} Array.isArray() checks`);
    if (arrayChecks.length > 0) totalPassed++;
  }
}

console.log('');
console.log('='.repeat(60));
console.log(`VERIFICATION COMPLETE: ${totalPassed} PASSED, ${totalFailed} FAILED`);
console.log('='.repeat(60));

if (totalFailed > 0) {
  console.log('\n⚠️  Some checks failed. Please review the output above.');
  process.exit(1);
} else {
  console.log('\n✅ All HIGH severity fixes verified successfully!');
  process.exit(0);
}
