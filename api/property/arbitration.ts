/**
 * CLUES Property Dashboard - Tiered Arbitration Service
 *
 * SINGLE SOURCE OF TRUTH for data source precedence and conflict resolution.
 *
 * Tier Hierarchy (Higher tier ALWAYS wins):
 *   Tier 1: Stellar MLS (Primary source - Bridge Interactive API)
 *   Tier 2: APIs (Google APIs first, then Free APIs: WalkScore, SchoolDigger, FEMA, etc.)
 *   Tier 3: Tavily Web Search (Targeted searches for AVMs, WalkScore, Schools, Crime)
 *   Tier 4: Web-Search LLMs (Perplexity → GPT → Sonnet → Grok)
 *   Tier 5: Claude Opus (Deep reasoning, NO web search - LAST)
 *
 * LLM Cascade Order (Updated 2026-01-13 - Gemini removed from auto-cascade):
 *   #1 Perplexity - Deep web search (HIGHEST)
 *   #2 GPT - Web evidence mode
 *   #3 Claude Sonnet - Web search beta
 *   #4 Grok - X/Twitter real-time data
 *   #5 Claude Opus - Deep reasoning, NO web search (LAST)
 *   (Gemini available on-demand via button on PropertyDetail)
 *
 * Key Principles:
 *   - Higher tier data NEVER gets overwritten by lower tier
 *   - LLM quorum voting for numeric/text fields when multiple LLMs return same value
 *   - Validation gates for all fields (price range, year range, geo coords, bathroom math)
 *   - Single-source hallucination protection (flag data from only one LLM)
 *   - Full audit trail with sources, confidence, and conflicts
 */

import { hasRealConflict } from './semantic-compare.js';

export type DataTier = 1 | 2 | 3 | 4 | 5;

export interface TierConfig {
  tier: DataTier;
  name: string;
  description: string;
  reliability: number;
}

export const DATA_TIERS: Record<string, TierConfig> = {
  // TIER 1: Primary MLS Data
  'stellar-mls': { tier: 1, name: 'Stellar MLS', description: 'Primary MLS data source', reliability: 100 },
  'backend-calculation': { tier: 1, name: 'Backend Calculation', description: 'Math-derived fields (price/sqft, tax rate, etc.)', reliability: 100 },
  'backend-logic': { tier: 1, name: 'Backend Logic', description: 'Smart defaults and conditional N/A fields', reliability: 100 },
  // TIER 2: APIs (Google first, then Free APIs)
  'google-geocode': { tier: 2, name: 'Google Geocode', description: 'Address geocoding', reliability: 95 },
  'google-places': { tier: 2, name: 'Google Places', description: 'Nearby amenities', reliability: 95 },
  'google-distance': { tier: 2, name: 'Google Distance Matrix', description: 'Commute times', reliability: 95 },
  'walkscore': { tier: 2, name: 'WalkScore', description: 'Walkability scores', reliability: 90 },
  'schooldigger': { tier: 2, name: 'SchoolDigger', description: 'School ratings', reliability: 85 },
  'fema': { tier: 2, name: 'FEMA NFHL', description: 'Flood zones', reliability: 95 },
  'airnow': { tier: 2, name: 'AirNow', description: 'Air quality', reliability: 90 },
  'howloud': { tier: 2, name: 'HowLoud', description: 'Noise levels', reliability: 85 },
  'weather': { tier: 2, name: 'Weather API', description: 'Climate data', reliability: 85 },
  'fbi-crime': { tier: 2, name: 'FBI Crime', description: 'Crime statistics', reliability: 90 },
  // TIER 3: Tavily Web Search (targeted AVM, school, crime searches)
  'tavily': { tier: 3, name: 'Tavily Web Search', description: 'Targeted web searches for AVMs, schools, crime', reliability: 85 },
  // TIER 4: LLM Cascade Order: Perplexity → GPT → Sonnet → Grok (Gemini on-demand only - 2026-01-13)
  'perplexity': { tier: 4, name: 'Perplexity Sonar Reasoning Pro', description: '#1 - Deep web search (HIGHEST LLM)', reliability: 90 },
  'gemini': { tier: 4, name: 'Gemini 3 Pro Preview', description: 'On-demand only (removed from auto-cascade 2026-01-13)', reliability: 85 },
  'gpt': { tier: 4, name: 'GPT-4o', description: '#2 - Web evidence mode', reliability: 80 },
  'claude-sonnet': { tier: 4, name: 'Claude Sonnet 4.5', description: '#3 - Web search beta (fills gaps)', reliability: 75 },
  'grok': { tier: 4, name: 'Grok 4.1 Fast', description: '#4 - X/Twitter real-time data', reliability: 70 },
  // TIER 5: Claude Opus (Deep reasoning, NO web search - LAST)
  'claude-opus': { tier: 5, name: 'Claude Opus 4.5', description: '#5 - Deep reasoning, NO web search (LAST)', reliability: 65 },
};

export interface FieldValue {
  value: any;
  source: string;
  confidence: 'High' | 'Medium' | 'Low';
  tier: DataTier;
  timestamp?: string;
  llmSources?: string[];
  hasConflict?: boolean;
  conflictValues?: Array<{ source: string; value: any }>;
  validationStatus?: 'passed' | 'failed' | 'warning';
  validationMessage?: string;
}

export interface AuditEntry {
  field: string;
  action: 'set' | 'skip' | 'override' | 'conflict' | 'validation_fail';
  source: string;
  tier: DataTier;
  value: any;
  previousValue?: any;
  previousSource?: string;
  reason: string;
  timestamp: string;
}

export interface ArbitrationResult {
  fields: Record<string, FieldValue>;
  conflicts: Array<{ field: string; values: Array<{ source: string; value: any; tier: DataTier }> }>;
  auditTrail: AuditEntry[];
  validationFailures: Array<{ field: string; value: any; reason: string }>;
  llmQuorumFields: Array<{ field: string; value: any; sources: string[]; quorumCount: number }>;
  singleSourceWarnings: Array<{ field: string; source: string }>;
}

export function getSourceTier(sourceName: string): DataTier {
  const sourceKey = sourceName.toLowerCase().replace(/\s+/g, '-').replace('maps', 'geocode');
  
  for (const [key, config] of Object.entries(DATA_TIERS)) {
    if (sourceKey.includes(key) || key.includes(sourceKey)) {
      return config.tier;
    }
  }
  
  if (sourceName.toLowerCase().includes('google')) return 2;

  // Fallback classification for LLMs when the source name doesn't match an exact key in DATA_TIERS
  if (sourceKey.includes('perplexity')) return 4; // highest-priority LLM tier
  if (['grok', 'claude', 'gpt', 'gemini', 'anthropic', 'openai'].some(
    llm => sourceName.toLowerCase().includes(llm)
  )) return 5; // other LLMs

  return 4;
}

export function getSourceReliability(sourceName: string): number {
  const sourceKey = sourceName.toLowerCase().replace(/\s+/g, '-');

  for (const [key, config] of Object.entries(DATA_TIERS)) {
    if (sourceKey.includes(key) || key.includes(sourceKey)) {
      return config.reliability;
    }
  }

  return 50;
}

// HIGH CONFIDENCE sources (normal color)
const HIGH_CONFIDENCE_SOURCES = [
  'perplexity',  // Has web citations
  'grok',        // Has real-time data
  'tavily',      // Tier 3 - Targeted web searches
  'google',
  'walkscore',
  'fema',
  'weather',
  'schooldigger',
  'airnow',
  'stellar',
  'mls',
];

// MEDIUM CONFIDENCE sources (yellow)
const MEDIUM_CONFIDENCE_SOURCES = [
  'claude-opus',
  'opus',
  'howloud',
  'fbi',
  'crime',
];

// LOW CONFIDENCE sources (red) - everything else including:
// gpt, claude-sonnet, gemini
// NOTE: Gemini consistently returns incorrect data and should be treated as CODE RED

export function getSourceConfidence(sourceName: string, hasCitations: boolean = false): 'High' | 'Medium' | 'Low' {
  const sourceKey = sourceName.toLowerCase();

  // Gemini: treat as Medium only when explicitly web-grounded (e.g., "Gemini 2.0 Search")
  if (sourceKey.includes('gemini')) {
    if (hasCitations || sourceKey.includes('2.0') || sourceKey.includes('search')) return 'Medium';
    return 'Low';
  }

// Perplexity and Grok with citations = High
  if ((sourceKey.includes('perplexity') || sourceKey.includes('grok')) && hasCitations) {
    return 'High';
  }

  // Perplexity and Grok without citations = Medium
  if (sourceKey.includes('perplexity') || sourceKey.includes('grok')) {
    return 'Medium';
  }

  // Check high confidence sources
  if (HIGH_CONFIDENCE_SOURCES.some(s => sourceKey.includes(s))) {
    return 'High';
  }

  // Check medium confidence sources
  if (MEDIUM_CONFIDENCE_SOURCES.some(s => sourceKey.includes(s))) {
    return 'Medium';
  }

  // Everything else (GPT, Claude Sonnet) = Low
  return 'Low';
}

export interface ValidationRule {
  fieldPattern: RegExp;
  validate: (value: any) => { valid: boolean; message?: string };
}

export const VALIDATION_RULES: ValidationRule[] = [
  {
    fieldPattern: /price|sale_price|listing_price|market_value|assessed_value/i,
    validate: (v) => {
      const num = typeof v === 'number' ? v : parseFloat(String(v).replace(/[$,]/g, ''));
      if (isNaN(num)) return { valid: false, message: 'Price must be a number' };
      if (num < 1000) return { valid: false, message: 'Price too low (<$1,000)' };
      if (num > 100000000) return { valid: false, message: 'Price too high (>$100M)' };
      return { valid: true };
    }
  },
  {
    fieldPattern: /year_built|tax_year/i,
    validate: (v) => {
      const year = typeof v === 'number' ? v : parseInt(String(v));
      if (isNaN(year)) return { valid: false, message: 'Year must be a number' };
      if (year < 1700) return { valid: false, message: 'Year too old (<1700)' };
      if (year > new Date().getFullYear() + 2) return { valid: false, message: 'Year in future' };
      return { valid: true };
    }
  },
  {
    fieldPattern: /latitude|lat$/i,
    validate: (v) => {
      const num = typeof v === 'number' ? v : parseFloat(String(v));
      if (isNaN(num)) return { valid: false, message: 'Latitude must be a number' };
      if (num < -90 || num > 90) return { valid: false, message: 'Latitude out of range (-90 to 90)' };
      return { valid: true };
    }
  },
  {
    fieldPattern: /longitude|lon$|lng$/i,
    validate: (v) => {
      const num = typeof v === 'number' ? v : parseFloat(String(v));
      if (isNaN(num)) return { valid: false, message: 'Longitude must be a number' };
      if (num < -180 || num > 180) return { valid: false, message: 'Longitude out of range (-180 to 180)' };
      return { valid: true };
    }
  },
  {
    fieldPattern: /bedrooms/i,
    validate: (v) => {
      const num = typeof v === 'number' ? v : parseInt(String(v));
      if (isNaN(num)) return { valid: false, message: 'Bedrooms must be a number' };
      if (num < 0 || num > 50) return { valid: false, message: 'Bedrooms out of range (0-50)' };
      return { valid: true };
    }
  },
  {
    fieldPattern: /bathrooms|full_bath|half_bath/i,
    validate: (v) => {
      const num = typeof v === 'number' ? v : parseFloat(String(v));
      if (isNaN(num)) return { valid: false, message: 'Bathrooms must be a number' };
      if (num < 0 || num > 30) return { valid: false, message: 'Bathrooms out of range (0-30)' };
      return { valid: true };
    }
  },
  {
    fieldPattern: /sqft|square_feet|living_area/i,
    validate: (v) => {
      const num = typeof v === 'number' ? v : parseFloat(String(v).replace(/[,]/g, ''));
      if (isNaN(num)) return { valid: false, message: 'Square footage must be a number' };
      if (num < 100) return { valid: false, message: 'Square footage too small (<100)' };
      if (num > 100000) return { valid: false, message: 'Square footage too large (>100,000)' };
      return { valid: true };
    }
  },
  {
    fieldPattern: /walk_score|transit_score|bike_score/i,
    validate: (v) => {
      const num = typeof v === 'number' ? v : parseInt(String(v));
      if (isNaN(num)) return { valid: false, message: 'Score must be a number' };
      if (num < 0 || num > 100) return { valid: false, message: 'Score out of range (0-100)' };
      return { valid: true };
    }
  },
];

export function validateField(fieldKey: string, value: any): { valid: boolean; message?: string } {
  for (const rule of VALIDATION_RULES) {
    if (rule.fieldPattern.test(fieldKey)) {
      return rule.validate(value);
    }
  }
  return { valid: true };
}

/**
 * CRASH FIX #9: Safe JSON stringify that handles BigInt, circular refs, and other edge cases
 */
function safeStringify(value: any): string {
  try {
    const seen = new WeakSet();
    return JSON.stringify(value, (key, val) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);
      }
      if (typeof val === 'bigint') return val.toString();
      return val;
    });
  } catch {
    return String(value);
  }
}

export function validateBathroomMath(
  fullBathrooms: number | undefined,
  halfBathrooms: number | undefined,
  totalBathrooms: number | undefined
): { valid: boolean; message?: string } {
  if (fullBathrooms === undefined || halfBathrooms === undefined || totalBathrooms === undefined) {
    return { valid: true };
  }
  
  const expectedTotal = fullBathrooms + (halfBathrooms * 0.5);
  const tolerance = 0.5;
  
  if (Math.abs(expectedTotal - totalBathrooms) > tolerance) {
    return {
      valid: false,
      message: `Bathroom math mismatch: ${fullBathrooms} full + ${halfBathrooms} half = ${expectedTotal}, but total is ${totalBathrooms}`
    };
  }
  
  return { valid: true };
}

export function arbitrateField(
  existingField: FieldValue | undefined,
  newValue: any,
  newSource: string,
  auditTrail: AuditEntry[],
  fieldKey?: string
): { result: FieldValue | null; action: 'set' | 'skip' | 'override' | 'conflict' | 'validation_fail' } {
  const newTier = getSourceTier(newSource);
  const timestamp = new Date().toISOString();
  
  if (newValue === null || newValue === undefined || newValue === '') {
    return { result: null, action: 'skip' };
  }
  
  if (!existingField) {
    const newField: FieldValue = {
      value: newValue,
      source: newSource,
      confidence: getSourceConfidence(newSource, true), // Assume citations for Perplexity/Grok
      tier: newTier,
      timestamp,
      llmSources: newTier >= 4 ? [newSource] : undefined,
    };
    
    auditTrail.push({
      field: '',
      action: 'set',
      source: newSource,
      tier: newTier,
      value: newValue,
      reason: 'Field was empty',
      timestamp,
    });
    
    return { result: newField, action: 'set' };
  }
  
  if (newTier < existingField.tier) {
    // Use semantic comparison to determine if this is a real conflict
    const isRealConflict = hasRealConflict(existingField.value, newValue, fieldKey);

    const overrideField: FieldValue = {
      value: newValue,
      source: newSource,
      confidence: getSourceConfidence(newSource, true),
      tier: newTier,
      timestamp,
      hasConflict: isRealConflict,
      conflictValues: isRealConflict
        ? [{ source: existingField.source, value: existingField.value }]
        : undefined,
    };
    
    auditTrail.push({
      field: '',
      action: 'override',
      source: newSource,
      tier: newTier,
      value: newValue,
      previousValue: existingField.value,
      previousSource: existingField.source,
      reason: `Higher tier (${newTier}) overrides lower tier (${existingField.tier})`,
      timestamp,
    });
    
    return { result: overrideField, action: 'override' };
  }

  // Check for semantic differences (not just JSON equality)
  const isRealConflict = hasRealConflict(existingField.value, newValue, fieldKey);

  if (newTier === existingField.tier && isRealConflict) {
    if (newTier >= 4) {
      const updatedField: FieldValue = {
        ...existingField,
        llmSources: [...(existingField.llmSources || [existingField.source]), newSource],
        hasConflict: true,
        conflictValues: [
          ...(existingField.conflictValues || []),
          { source: newSource, value: newValue }
        ],
      };
      
      auditTrail.push({
        field: '',
        action: 'conflict',
        source: newSource,
        tier: newTier,
        value: newValue,
        previousValue: existingField.value,
        previousSource: existingField.source,
        reason: 'LLM conflict - added to conflict list',
        timestamp,
      });
      
      return { result: updatedField, action: 'conflict' };
    }
    
    auditTrail.push({
      field: '',
      action: 'skip',
      source: newSource,
      tier: newTier,
      value: newValue,
      previousValue: existingField.value,
      previousSource: existingField.source,
      reason: 'Same tier conflict - keeping first value',
      timestamp,
    });
    
    return { result: existingField, action: 'skip' };
  }
  
  if (newTier === 4 && existingField.tier === 4) {
    const updatedField: FieldValue = {
      ...existingField,
      llmSources: [...(existingField.llmSources || [existingField.source]), newSource],
    };
    
    return { result: updatedField, action: 'skip' };
  }
  
  auditTrail.push({
    field: '',
    action: 'skip',
    source: newSource,
    tier: newTier,
    value: newValue,
    previousValue: existingField.value,
    previousSource: existingField.source,
    reason: `Lower tier (${newTier}) cannot override higher tier (${existingField.tier})`,
    timestamp,
  });
  
  return { result: null, action: 'skip' };
}

export function applyLLMQuorumVoting(
  fields: Record<string, FieldValue>,
  minQuorum: number = 2
): { fields: Record<string, FieldValue>; quorumFields: Array<{ field: string; value: any; sources: string[]; quorumCount: number }> } {
  const quorumFields: Array<{ field: string; value: any; sources: string[]; quorumCount: number }> = [];
  
  for (const [key, field] of Object.entries(fields)) {
    // Include both tier 4 and tier 5 LLMs in quorum voting
    if (field.tier < 4 || !field.conflictValues || field.conflictValues.length === 0) {
      continue;
    }
    
    const valueCounts = new Map<string, { count: number; sources: string[]; value: any }>();
    
    valueCounts.set(JSON.stringify(field.value), {
      count: 1,
      sources: [field.source],
      value: field.value,
    });
    
    for (const conflict of field.conflictValues) {
      const key = JSON.stringify(conflict.value);
      const existing = valueCounts.get(key);
      if (existing) {
        existing.count++;
        existing.sources.push(conflict.source);
      } else {
        valueCounts.set(key, {
          count: 1,
          sources: [conflict.source],
          value: conflict.value,
        });
      }
    }
    
    let maxCount = 0;
    let winningEntry: { count: number; sources: string[]; value: any } | null = null;

    Array.from(valueCounts.values()).forEach(entry => {
      if (entry.count > maxCount) { maxCount = entry.count; winningEntry = entry; } });

    if (winningEntry !== null && maxCount >= minQuorum) {
      // Extract to const to satisfy TypeScript control flow analysis
      const winner = winningEntry;

      fields[key] = {
        ...field,
        value: winner.value,
        confidence: maxCount >= 3 ? 'High' : 'Medium',
        llmSources: winner.sources,
        hasConflict: valueCounts.size > 1,
      };

      quorumFields.push({
        field: key,
        value: winner.value,
        sources: winner.sources,
        quorumCount: maxCount,
      });
    }
  }
  
  return { fields, quorumFields };
}

export function detectSingleSourceHallucinations(
  fields: Record<string, FieldValue>
): Array<{ field: string; source: string }> {
  const warnings: Array<{ field: string; source: string }> = [];

  for (const [key, field] of Object.entries(fields)) {
    // FIX: Check both Tier 4 (web-search LLMs) AND Tier 5 (Claude LLMs) for hallucinations
    // Previously only checked Tier 4, missing Claude Opus/Sonnet single-source warnings
    if (field.tier >= 4) {
      const sources = field.llmSources || [field.source];
      if (sources.length === 1 && !field.conflictValues?.length) {
        warnings.push({ field: key, source: sources[0] });
      }
    }
  }

  return warnings;
}

export function createArbitrationPipeline(minLLMQuorum: number = 2): {
  addField: (fieldKey: string, value: any, source: string) => void;
  addFieldsFromSource: (fields: Record<string, any>, source: string) => number;
  getFieldCount: () => number;
  getResult: () => ArbitrationResult;
} {
  const fields: Record<string, FieldValue> = {};
  const auditTrail: AuditEntry[] = [];
  const conflicts: ArbitrationResult['conflicts'] = [];
  const validationFailures: ArbitrationResult['validationFailures'] = [];

  return {
    addField(fieldKey: string, value: any, source: string) {
      const validation = validateField(fieldKey, value);
      
      if (!validation.valid) {
        validationFailures.push({
          field: fieldKey,
          value,
          reason: validation.message || 'Validation failed',
        });
        
        auditTrail.push({
          field: fieldKey,
          action: 'validation_fail',
          source,
          tier: getSourceTier(source),
          value,
          reason: validation.message || 'Validation failed',
          timestamp: new Date().toISOString(),
        });
        
        return;
      }
      
      const { result, action } = arbitrateField(fields[fieldKey], value, source, auditTrail, fieldKey);
      
      if (result) {
        if (auditTrail.length > 0) {
          auditTrail[auditTrail.length - 1].field = fieldKey;
        }
        fields[fieldKey] = result;
        
        if (action === 'conflict' && result.conflictValues) {
          const existingConflict = conflicts.find(c => c.field === fieldKey);
          if (existingConflict) {
            existingConflict.values.push({
              source,
              value,
              tier: getSourceTier(source),
            });
          } else {
            conflicts.push({
              field: fieldKey,
              values: [
                { source: result.source, value: result.value, tier: result.tier },
                { source, value, tier: getSourceTier(source) },
              ],
            });
          }
        }
      }
    },

    addFieldsFromSource(sourceFields: Record<string, any>, source: string): number {
      let addedCount = 0;
      for (const [key, value] of Object.entries(sourceFields)) {
        if (value !== null && value !== undefined && value !== '') {
          // CRITICAL: Extract primitive value if wrapped in {value, source, confidence} format
          // Some sources return {value: X, source: Y} - we need just X
          let actualValue = value;
          if (typeof value === 'object' && value !== null && 'value' in value) {
            actualValue = value.value;
          }

          this.addField(key, actualValue, source);
          addedCount++;
        }
      }
      return addedCount;
    },

    getFieldCount(): number {
      return Object.keys(fields).length;
    },

    getResult(): ArbitrationResult {
      const { fields: votedFields, quorumFields } = applyLLMQuorumVoting(fields, minLLMQuorum);
      const singleSourceWarnings = detectSingleSourceHallucinations(votedFields);
      
      return {
        fields: votedFields,
        conflicts,
        auditTrail,
        validationFailures,
        llmQuorumFields: quorumFields,
        singleSourceWarnings,
      };
    },
  };
}

export function getTierDisplayInfo(tier: DataTier): { label: string; color: string } {
  switch (tier) {
    case 1: return { label: 'MLS', color: 'text-quantum-gold' };
    case 2: return { label: 'Google', color: 'text-quantum-green' };
    case 3: return { label: 'API', color: 'text-quantum-cyan' };
    case 4: return { label: 'LLM (High)', color: 'text-quantum-purple' };
    case 5: return { label: 'LLM (Low)', color: 'text-quantum-pink' };
  }
}
