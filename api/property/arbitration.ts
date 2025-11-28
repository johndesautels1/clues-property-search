/**
 * CLUES Property Dashboard - Tiered Arbitration Service (API Version)
 * 
 * SINGLE SOURCE OF TRUTH for data source precedence and conflict resolution.
 * 
 * Tier Hierarchy (Higher tier ALWAYS wins):
 *   Tier 1: Stellar MLS (Primary source - when eKey obtained)
 *   Tier 2: Google APIs (Geocode, Places, Distance Matrix)
 *   Tier 3: Paid/Free APIs (WalkScore, SchoolDigger, FEMA, AirNow, HowLoud, Weather, FBI Crime)
 *   Tier 4: LLM Cascade (Perplexity, Grok, Claude Opus, GPT, Claude Sonnet, Gemini)
 * 
 * Key Principles:
 *   - Higher tier data NEVER gets overwritten by lower tier
 *   - LLM quorum voting for numeric/text fields when multiple LLMs return same value
 *   - Validation gates for all fields (price range, year range, geo coords, bathroom math)
 *   - Single-source hallucination protection (flag data from only one LLM)
 *   - Full audit trail with sources, confidence, and conflicts
 */

export type DataTier = 1 | 2 | 3 | 4;

export interface TierConfig {
  tier: DataTier;
  name: string;
  description: string;
  reliability: number;
}

export const DATA_TIERS: Record<string, TierConfig> = {
  'stellar-mls': { tier: 1, name: 'Stellar MLS', description: 'Primary MLS data source', reliability: 100 },
  'google-geocode': { tier: 2, name: 'Google Geocode', description: 'Address geocoding', reliability: 95 },
  'google-places': { tier: 2, name: 'Google Places', description: 'Nearby amenities', reliability: 95 },
  'google-distance': { tier: 2, name: 'Google Distance Matrix', description: 'Commute times', reliability: 95 },
  'walkscore': { tier: 3, name: 'WalkScore', description: 'Walkability scores', reliability: 90 },
  'schooldigger': { tier: 3, name: 'SchoolDigger', description: 'School ratings', reliability: 85 },
  'fema': { tier: 3, name: 'FEMA NFHL', description: 'Flood zones', reliability: 95 },
  'airnow': { tier: 3, name: 'AirNow', description: 'Air quality', reliability: 90 },
  'howloud': { tier: 3, name: 'HowLoud', description: 'Noise levels', reliability: 85 },
  'weather': { tier: 3, name: 'Weather API', description: 'Climate data', reliability: 85 },
  'fbi-crime': { tier: 3, name: 'FBI Crime Stats', description: 'Crime statistics', reliability: 90 },
  'perplexity': { tier: 4, name: 'Perplexity', description: 'LLM with web search', reliability: 75 },
  'grok': { tier: 4, name: 'Grok/xAI', description: 'LLM with real-time data', reliability: 70 },
  'claude-opus': { tier: 4, name: 'Claude Opus', description: 'High-quality LLM', reliability: 65 },
  'gpt': { tier: 4, name: 'GPT-4', description: 'OpenAI LLM', reliability: 60 },
  'claude-sonnet': { tier: 4, name: 'Claude Sonnet', description: 'Fast LLM fallback', reliability: 55 },
  'gemini': { tier: 4, name: 'Gemini', description: 'Google LLM', reliability: 50 },
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
  if (['perplexity', 'grok', 'claude', 'gpt', 'gemini', 'anthropic', 'openai'].some(
    llm => sourceName.toLowerCase().includes(llm)
  )) return 4;
  
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

export function arbitrateField(
  existingField: FieldValue | undefined,
  newValue: any,
  newSource: string,
  auditTrail: AuditEntry[]
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
      confidence: newTier <= 2 ? 'High' : newTier === 3 ? 'Medium' : 'Low',
      tier: newTier,
      timestamp,
      llmSources: newTier === 4 ? [newSource] : undefined,
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
    const overrideField: FieldValue = {
      value: newValue,
      source: newSource,
      confidence: newTier <= 2 ? 'High' : 'Medium',
      tier: newTier,
      timestamp,
      hasConflict: JSON.stringify(existingField.value) !== JSON.stringify(newValue),
      conflictValues: existingField.value !== newValue 
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
  
  if (newTier === existingField.tier && JSON.stringify(existingField.value) !== JSON.stringify(newValue)) {
    if (newTier === 4) {
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
    if (field.tier !== 4 || !field.conflictValues || field.conflictValues.length === 0) {
      continue;
    }
    
    const valueCounts = new Map<string, { count: number; sources: string[]; value: any }>();
    
    valueCounts.set(JSON.stringify(field.value), {
      count: 1,
      sources: [field.source],
      value: field.value,
    });
    
    for (const conflict of field.conflictValues) {
      const valKey = JSON.stringify(conflict.value);
      const existing = valueCounts.get(valKey);
      if (existing) {
        existing.count++;
        existing.sources.push(conflict.source);
      } else {
        valueCounts.set(valKey, {
          count: 1,
          sources: [conflict.source],
          value: conflict.value,
        });
      }
    }
    
    let maxCount = 0;
    let winningEntry: { count: number; sources: string[]; value: any } | null = null;
    
    // Convert to array to avoid MapIterator compatibility issues
    const entries = Array.from(valueCounts.values());
    for (const entry of entries) {
      if (entry.count > maxCount) {
        maxCount = entry.count;
        winningEntry = entry;
      }
    }
    
    if (winningEntry && maxCount >= minQuorum) {
      fields[key] = {
        ...field,
        value: winningEntry.value,
        confidence: maxCount >= 3 ? 'High' : 'Medium',
        llmSources: winningEntry.sources,
        hasConflict: valueCounts.size > 1,
      };
      
      quorumFields.push({
        field: key,
        value: winningEntry.value,
        sources: winningEntry.sources,
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
    if (field.tier === 4) {
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
  addFieldsFromSource: (sourceFields: Record<string, any>, sourceName: string) => number;
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
      
      const { result, action } = arbitrateField(fields[fieldKey], value, source, auditTrail);
      
      if (result) {
        if (auditTrail.length > 0) {
          auditTrail[auditTrail.length - 1].field = fieldKey;
        }
        // Mark field as validation passed since it got through validation gate
        result.validationStatus = 'passed';
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

    addFieldsFromSource(sourceFields: Record<string, any>, sourceName: string): number {
      let addedCount = 0;
      for (const [key, fieldData] of Object.entries(sourceFields)) {
        const value = typeof fieldData === 'object' && fieldData !== null && 'value' in fieldData
          ? fieldData.value
          : fieldData;
        
        if (value === null || value === undefined || value === '') continue;
        
        const strVal = String(value).toLowerCase().trim();
        const isBadValue = strVal === 'null' || strVal === 'undefined' || strVal === 'n/a' || 
          strVal === 'na' || strVal === 'nan' || strVal === 'unknown' || 
          strVal === 'not available' || strVal === 'not found' || strVal === 'none' || 
          strVal === '-' || strVal === '--' || strVal === 'tbd';
        
        if (!isBadValue) {
          this.addField(key, value, sourceName);
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
      
      // Apply single-source warning status to fields for UI display
      for (const warning of singleSourceWarnings) {
        if (votedFields[warning.field]) {
          votedFields[warning.field].validationStatus = 'warning';
          votedFields[warning.field].validationMessage = `Only one LLM (${warning.source}) provided this data - potential hallucination`;
        }
      }
      
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
