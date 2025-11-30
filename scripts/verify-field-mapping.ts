/**
 * FIELD MAPPING VERIFICATION SCRIPT
 *
 * Run with: npx ts-node scripts/verify-field-mapping.ts
 * Or add to package.json: "verify-fields": "ts-node scripts/verify-field-mapping.ts"
 *
 * This script verifies that all field mapping files are synchronized
 * with the source of truth (src/types/fields-schema.ts)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

interface FieldDef {
  num: number;
  key: string;
  label: string;
}

// Load the source of truth
function loadFieldsSchema(): FieldDef[] {
  const schemaPath = path.join(__dirname, '../src/types/fields-schema.ts');
  const content = fs.readFileSync(schemaPath, 'utf-8');

  // Extract field definitions using regex
  const fieldRegex = /\{\s*num:\s*(\d+),\s*key:\s*'([^']+)',\s*label:\s*'([^']+)'/g;
  const fields: FieldDef[] = [];
  let match;

  while ((match = fieldRegex.exec(content)) !== null) {
    fields.push({
      num: parseInt(match[1]),
      key: match[2],
      label: match[3]
    });
  }

  return fields;
}

// Check field-normalizer.ts
function checkFieldNormalizer(truthFields: FieldDef[]): { errors: string[], warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const filePath = path.join(__dirname, '../src/lib/field-normalizer.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract apiKey definitions
  const apiKeyRegex = /apiKey:\s*'(\d+)_([^']+)'/g;
  const foundMappings: Map<number, string> = new Map();
  let match;

  while ((match = apiKeyRegex.exec(content)) !== null) {
    const num = parseInt(match[1]);
    const key = match[2];
    foundMappings.set(num, key);
  }

  // Compare with truth
  for (const field of truthFields) {
    const foundKey = foundMappings.get(field.num);
    if (!foundKey) {
      warnings.push(`Field #${field.num} (${field.key}) not found in field-normalizer.ts`);
    } else if (foundKey !== field.key) {
      errors.push(`Field #${field.num}: Expected '${field.key}', found '${foundKey}' in field-normalizer.ts`);
    }
  }

  return { errors, warnings };
}

// Check search.ts API
function checkSearchApi(truthFields: FieldDef[]): { errors: string[], warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const filePath = path.join(__dirname, '../api/property/search.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract field mappings from convertFlatToNestedStructure
  const fieldRegex = /'(\d+)_([^']+)':\s*\[/g;
  const foundMappings: Map<number, string> = new Map();
  let match;

  while ((match = fieldRegex.exec(content)) !== null) {
    const num = parseInt(match[1]);
    const key = match[2];
    foundMappings.set(num, key);
  }

  // Compare with truth
  for (const field of truthFields) {
    const foundKey = foundMappings.get(field.num);
    if (!foundKey) {
      // Only warn for fields 1-138, Stellar MLS might not be in API yet
      if (field.num <= 138) {
        warnings.push(`Field #${field.num} (${field.key}) not found in search.ts`);
      }
    } else if (foundKey !== field.key) {
      errors.push(`Field #${field.num}: Expected '${field.key}', found '${foundKey}' in search.ts`);
    }
  }

  return { errors, warnings };
}

// Check parse-mls-pdf.ts
function checkPdfParser(truthFields: FieldDef[]): { errors: string[], warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const filePath = path.join(__dirname, '../api/property/parse-mls-pdf.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract MLS_FIELD_MAPPING values
  const fieldRegex = /:\s*'(\d+)_([^']+)'/g;
  const foundMappings: Map<number, Set<string>> = new Map();
  let match;

  while ((match = fieldRegex.exec(content)) !== null) {
    const num = parseInt(match[1]);
    const key = match[2];
    if (!foundMappings.has(num)) {
      foundMappings.set(num, new Set());
    }
    foundMappings.get(num)!.add(key);
  }

  // Compare with truth
  for (const field of truthFields) {
    const foundKeys = foundMappings.get(field.num);
    if (!foundKeys) {
      // Skip - not all fields need PDF mapping
      continue;
    }
    if (!foundKeys.has(field.key)) {
      const foundList = Array.from(foundKeys).join(', ');
      errors.push(`Field #${field.num}: Expected '${field.key}', found '${foundList}' in parse-mls-pdf.ts`);
    }
  }

  return { errors, warnings };
}

// Main verification
function main() {
  console.log('\n========================================');
  console.log('FIELD MAPPING VERIFICATION');
  console.log('========================================\n');

  console.log('Loading source of truth (fields-schema.ts)...');
  const truthFields = loadFieldsSchema();
  console.log(`Found ${truthFields.length} field definitions\n`);

  let totalErrors = 0;
  let totalWarnings = 0;

  // Check field-normalizer.ts
  console.log('Checking src/lib/field-normalizer.ts...');
  const normalizerResult = checkFieldNormalizer(truthFields);
  normalizerResult.errors.forEach(e => console.log(`  ${RED}ERROR: ${e}${RESET}`));
  normalizerResult.warnings.forEach(w => console.log(`  ${YELLOW}WARNING: ${w}${RESET}`));
  if (normalizerResult.errors.length === 0 && normalizerResult.warnings.length === 0) {
    console.log(`  ${GREEN}✓ All fields match${RESET}`);
  }
  totalErrors += normalizerResult.errors.length;
  totalWarnings += normalizerResult.warnings.length;
  console.log();

  // Check search.ts
  console.log('Checking api/property/search.ts...');
  const searchResult = checkSearchApi(truthFields);
  searchResult.errors.forEach(e => console.log(`  ${RED}ERROR: ${e}${RESET}`));
  searchResult.warnings.forEach(w => console.log(`  ${YELLOW}WARNING: ${w}${RESET}`));
  if (searchResult.errors.length === 0 && searchResult.warnings.length === 0) {
    console.log(`  ${GREEN}✓ All fields match${RESET}`);
  }
  totalErrors += searchResult.errors.length;
  totalWarnings += searchResult.warnings.length;
  console.log();

  // Check parse-mls-pdf.ts
  console.log('Checking api/property/parse-mls-pdf.ts...');
  const pdfResult = checkPdfParser(truthFields);
  pdfResult.errors.forEach(e => console.log(`  ${RED}ERROR: ${e}${RESET}`));
  pdfResult.warnings.forEach(w => console.log(`  ${YELLOW}WARNING: ${w}${RESET}`));
  if (pdfResult.errors.length === 0 && pdfResult.warnings.length === 0) {
    console.log(`  ${GREEN}✓ All fields match${RESET}`);
  }
  totalErrors += pdfResult.errors.length;
  totalWarnings += pdfResult.warnings.length;
  console.log();

  // Summary
  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Total Errors: ${totalErrors > 0 ? RED : GREEN}${totalErrors}${RESET}`);
  console.log(`Total Warnings: ${totalWarnings > 0 ? YELLOW : GREEN}${totalWarnings}${RESET}`);
  console.log();

  if (totalErrors > 0) {
    console.log(`${RED}FIELD MAPPING IS NOT SYNCHRONIZED${RESET}`);
    console.log('See FIELD_MAPPING_TRUTH.md for the correct field numbers.');
    process.exit(1);
  } else {
    console.log(`${GREEN}FIELD MAPPING IS SYNCHRONIZED${RESET}`);
    process.exit(0);
  }
}

main();
