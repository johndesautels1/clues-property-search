/**
 * CLUES Property Dashboard - Property Search Form
 * 181-field form with real LLM-powered address search
 * Sources visible to admin only
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  Info,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useIsAdmin } from '@/store/authStore';
import {
  UI_FIELD_DEFINITIONS as FIELD_DEFINITIONS,
  UI_FIELD_GROUPS as FIELD_GROUPS,
  DATA_SOURCES,
  getSourceColor,
  type DataSource,
  type UIFieldDefinition as FieldDefinition,
} from '@/types/fields-schema';
import SearchProgressTracker, { type SourceProgress, type SourceStatus, DEFAULT_SOURCES } from './SearchProgressTracker';

interface FieldValue {
  value: string | number | boolean | string[];
  source: DataSource;
  confidence?: string;
}

interface PropertySearchFormProps {
  onSubmit: (data: Record<string, FieldValue>, apiFields?: Record<string, any>) => void;
  initialData?: Record<string, FieldValue>;
}

interface AddressSuggestion {
  description: string;
  placeId: string;
  mainText: string;
  secondaryText: string;
}

// API base URL - uses relative path for Vercel
const API_BASE = '/api/property';

export default function PropertySearchForm({ onSubmit, initialData }: PropertySearchFormProps) {
  const isAdmin = useIsAdmin();
  const [formData, setFormData] = useState<Record<string, FieldValue>>({});
  const [apiResponseFields, setApiResponseFields] = useState<Record<string, any> | null>(null); // Store raw API response with numbered keys
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['A', 'B', 'C']);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState('');
  const [searchError, setSearchError] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedEngines, setSelectedEngines] = useState(['perplexity', 'gpt', 'claude-opus', 'gemini', 'claude-sonnet', 'grok']);
  const [skipLLMs, setSkipLLMs] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [sourcesProgress, setSourcesProgress] = useState<SourceProgress[]>(DEFAULT_SOURCES);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [liveFieldsFound, setLiveFieldsFound] = useState(0);
  const [liveCompletionPct, setLiveCompletionPct] = useState(0);

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Debounced address autocomplete
  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/autocomplete?input=${encodeURIComponent(input)}`);
      const data = await res.json();
      if (data.suggestions) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
    }
  }, []);

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (addressInput) {
        fetchSuggestions(addressInput);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [addressInput, fetchSuggestions]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const expandAllGroups = () => {
    setExpandedGroups(FIELD_GROUPS.map(g => g.id));
  };

  const collapseAllGroups = () => {
    setExpandedGroups([]);
  };

  const updateField = (key: string, value: string | number | boolean | string[], source?: DataSource) => {
    setFormData(prev => ({
      ...prev,
      [key]: {
        value,
        source: source || prev[key]?.source || 'Manual Entry',
      },
    }));
  };

  const updateFieldSource = (key: string, source: DataSource) => {
    setFormData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        source,
      },
    }));
  };

  const toggleEngine = (engine: string) => {
    setSelectedEngines(prev =>
      prev.includes(engine)
        ? prev.filter(e => e !== engine)
        : [...prev, engine]
    );
  };

  // Map API field keys to form field keys
  const mapApiFieldToFormKey = (apiKey: string): string | null => {
    // API returns keys like "1_full_address" or just "full_address"
    // Try parsing number prefix first
    const parts = apiKey.split('_');
    const fieldNumber = parseInt(parts[0]);

    if (!isNaN(fieldNumber)) {
      // Found number prefix like "1_full_address"
      const fieldDef = FIELD_DEFINITIONS.find(f => f.id === fieldNumber);
      if (fieldDef) return fieldDef.key;
    }

    // Fallback: try to match by key name directly (without number prefix)
    // Handle both "full_address" and "1_full_address" formats
    const keyWithoutNumber = isNaN(fieldNumber) ? apiKey : parts.slice(1).join('_');
    const fieldByKey = FIELD_DEFINITIONS.find(f =>
      f.key === keyWithoutNumber ||
      f.key === apiKey ||
      f.key.toLowerCase() === keyWithoutNumber.toLowerCase()
    );

    return fieldByKey?.key || null;
  };

  // Update source progress helper
  const updateSource = (id: string, updates: Partial<SourceProgress>) => {
    setSourcesProgress(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // Map API response to progress tracker sources
  const updateSourcesFromResponse = (data: any) => {
    if (!data) return;

    const sources = data.sources || [];
    const sourceBreakdown = data.source_breakdown || {};
    const llmResponses = data.llm_responses || [];

    setSourcesProgress(prev => prev.map(source => {
      // Check if this source was used
      const sourceUsed = sources.some((s: string) =>
        s.toLowerCase().includes(source.id.toLowerCase()) ||
        source.name.toLowerCase().includes(s.toLowerCase())
      );

      // Check LLM responses
      const llmResponse = llmResponses.find((r: any) =>
        r.llm?.toLowerCase() === source.id.toLowerCase() ||
        r.llm?.toLowerCase().includes(source.id.toLowerCase()) ||
        source.id.toLowerCase().includes(r.llm?.toLowerCase() || '')
      );

      // Count fields from source_breakdown
      let fieldsFound = 0;
      for (const [key, count] of Object.entries(sourceBreakdown)) {
        if (key.toLowerCase().includes(source.name.toLowerCase()) ||
            key.toLowerCase().includes(source.id.toLowerCase())) {
          fieldsFound += count as number;
        }
      }

      // Handle LLM sources specially
      if (source.type === 'llm') {
        // SPECIAL CASE: Perplexity has 5 micro-prompts - merge them into single card
        if (source.id === 'perplexity') {
          const perplexityResponses = llmResponses.filter((r: any) =>
            r.llm?.startsWith('perplexity-')
          );

          if (perplexityResponses.length > 0) {
            // Sum up fields from all 5 micro-prompts
            const totalFields = perplexityResponses.reduce((sum: number, r: any) =>
              sum + (r.fields_found || 0), 0
            );

            // Success if ANY micro-prompt succeeded
            const anySuccess = perplexityResponses.some((r: any) => r.success);

            // Collect errors from failed prompts
            const errors = perplexityResponses
              .filter((r: any) => !r.success && r.error)
              .map((r: any) => r.error);

            return {
              ...source,
              status: anySuccess ? 'complete' as const : 'error' as const,
              fieldsFound: totalFields,
              error: errors.length > 0 ? `${errors.length}/5 prompts failed` : undefined
            };
          }

          return { ...source, status: 'skipped' as const, fieldsFound: 0 };
        }

        // All other LLMs (single call each)
        if (llmResponse) {
          return {
            ...source,
            status: llmResponse.success ? 'complete' as const : 'error' as const,
            fieldsFound: llmResponse.fields_found || 0,
            error: llmResponse.error || undefined
          };
        }
        // Check if this LLM was in the engines list but didn't respond
        return { ...source, status: 'skipped' as const, fieldsFound: 0 };
      }

      // Handle scrapers and free APIs
      if (sourceUsed || fieldsFound > 0) {
        return {
          ...source,
          status: 'complete' as const,
          fieldsFound: fieldsFound || 1
        };
      }

      return { ...source, status: 'complete' as const, fieldsFound: 0 };
    }));
  };
  const handleAddressSearch = async () => {
    if (!addressInput.trim()) return;

    setIsSearching(true);
    setSearchError('');
    setSearchProgress('Initializing search...');
    setShowSuggestions(false);
    setShowProgressTracker(true);
    setSourcesProgress(DEFAULT_SOURCES.map(s => ({ ...s, status: 'pending' as const, fieldsFound: 0 })));
    setLiveFieldsFound(0);
    setLiveCompletionPct(0);

    // Call search API using Server-Sent Events (SSE) for real-time progress
    const performSearch = () => {
      return new Promise<any>((resolve, reject) => {
        const params = new URLSearchParams({
          address: addressInput,
          engines: (skipLLMs ? [] : selectedEngines).join(','),
          skipLLMs: String(skipLLMs),
        });

        // Use SSE for real-time progress updates
        const eventSource = new EventSource(`${API_BASE}/search-stream?${params.toString()}`);

        // Track which sources have been updated
        const updatedSources = new Set<string>();

        // Listen for progress events (real-time updates from each source)
        eventSource.addEventListener('progress', (e) => {
          try {
            const data = JSON.parse(e.data);
            console.log('[SSE Progress]', data.source, data.status, `${data.fieldsFound} fields`);

            // Update source status in real-time
            setSourcesProgress(prev => prev.map(s => {
              if (s.id === data.source || s.id === data.source.replace(/-/g, '')) {
                updatedSources.add(s.id);
                return {
                  ...s,
                  status: data.status as SourceStatus,
                  fieldsFound: data.fieldsFound || 0,
                  error: data.error || undefined
                };
              }
              return s;
            }));

            // Update total field count in real-time
            if (data.totalFieldsSoFar) {
              setLiveFieldsFound(data.totalFieldsSoFar);
              setLiveCompletionPct(Math.round((data.totalFieldsSoFar / 181) * 100));
            }

            // Update progress message
            if (data.message) {
              setSearchProgress(data.message);
            }
          } catch (err) {
            console.error('[SSE] Failed to parse progress event:', err);
          }
        });

        // Listen for complete event (final aggregated data)
        eventSource.addEventListener('complete', (e) => {
          try {
            const data = JSON.parse(e.data);
            console.log('[SSE Complete]', data.total_fields_found, 'fields found');

            // Update final field counts
            if (data.total_fields_found) {
              setLiveFieldsFound(data.total_fields_found);
              setLiveCompletionPct(data.completion_percentage || Math.round((data.total_fields_found / 181) * 100));
            }

            setSearchProgress('Search complete - processing results...');

            // Mark any sources still pending/searching as complete with 0 fields
            setSourcesProgress(prev => prev.map(s => {
              if (s.status === 'searching' || s.status === 'pending') {
                console.log(`⚠️ Source "${s.name}" (${s.id}) still ${s.status} - marking complete with 0 fields`);
                return { ...s, status: 'complete' as const, fieldsFound: 0 };
              }
              return s;
            }));

            // Close EventSource and resolve with complete data
            eventSource.close();
            resolve(data);
          } catch (err) {
            console.error('[SSE] Failed to parse complete event:', err);
            eventSource.close();
            reject(err);
          }
        });

        // Listen for error events
        eventSource.addEventListener('error', (e: any) => {
          console.error('[SSE] Error:', e);
          eventSource.close();

          // Try to parse error data
          try {
            const errorData = e.data ? JSON.parse(e.data) : null;
            reject(new Error(errorData?.error || 'SSE connection error'));
          } catch {
            reject(new Error('SSE connection error'));
          }
        });
      });
    };

    try {
      const data = await performSearch();

      setSearchResults(data);

      // Show appropriate message based on partial vs complete results
      if (data.partial) {
        setSearchError(`Partial results: ${data.error || 'Some sources failed'}. You can still view and edit the data received.`);
        setSearchProgress(`Found ${data.total_fields_found || 0} of 181 fields (${data.completion_percentage || 0}%) - PARTIAL`);
      } else {
        setSearchProgress(`Found ${data.total_fields_found || 0} of 181 fields (${data.completion_percentage || 0}%)`);
      }

      // Map API response to form data (works for both partial and complete)
      const newFormData: Record<string, FieldValue> = {
        'addressIdentity.fullAddress': { value: addressInput, source: 'Manual Entry' },
      };

      if (data.fields) {
        console.log('📊 Mapping API fields to form - Total fields:', Object.keys(data.fields).length);

        // Store the raw API response fields (with numbered keys) for later use
        setApiResponseFields(data.fields);
        console.log('💾 Stored raw API response fields for Property conversion');

        const sourceSample: Record<string, string> = {};
        const lostFields: Array<{apiKey: string, reason: string, value: any}> = [];

        for (const [apiKey, fieldData] of Object.entries(data.fields)) {
          const field = fieldData as any;

          // Skip internal tracking fields (not real data)
          if (apiKey.startsWith('__') && apiKey.endsWith('__')) continue;
          if (apiKey.startsWith('_extended')) continue;

          const formKey = mapApiFieldToFormKey(apiKey);

          // Track lost fields (but not internal/metadata fields)
          if (!formKey) {
            // Skip known extra MLS fields that aren't in our 181-field schema
            const knownExtraFields = [
              'latitude', 'longitude', 'property_description', 'virtual_tour_url',
              'property_photo_url', 'property_photos', 'DaysOnMarket', 'CumulativeDaysOnMarket'
            ];
            if (!knownExtraFields.includes(apiKey)) {
              lostFields.push({apiKey, reason: 'No formKey mapping', value: field.value});
            }
          } else if (field.value === null || field.value === undefined) {
            lostFields.push({apiKey, reason: 'Null/undefined value', value: field.value});
          }

          if (formKey && field.value !== null && field.value !== undefined) {
            // Parse source to get a valid DataSource
            let source: DataSource = 'Other';
            // API returns sources as array, get first one
            const sourceStr = (Array.isArray(field.sources) && field.sources.length > 0)
              ? field.sources[0]
              : (field.source || '');

            // Log first few sources for debugging
            if (Object.keys(sourceSample).length < 5) {
              sourceSample[apiKey] = sourceStr;
            }

            // Normalize source string for matching (remove common suffixes)
            const normalizedSource = sourceStr
              .replace(/ API$/i, '')
              .replace(/ \(.*?\)$/i, '')
              .trim();

            // Try to match known sources (case-insensitive, partial match)
            for (const knownSource of DATA_SOURCES) {
              if (normalizedSource.toLowerCase().includes(knownSource.toLowerCase()) ||
                  knownSource.toLowerCase().includes(normalizedSource.toLowerCase())) {
                source = knownSource;
                break;
              }
            }

            // Handle specific LLM sources (if not matched above)
            if (source === 'Other') {
              if (sourceStr.includes('Claude') && sourceStr.includes('Opus')) source = 'Claude Opus';
              else if (sourceStr.includes('Claude') && sourceStr.includes('Sonnet')) source = 'Claude Sonnet';
              else if (sourceStr.includes('Claude')) source = 'Claude Opus';
              else if (sourceStr.includes('GPT')) source = 'GPT';
              else if (sourceStr.includes('Gemini')) source = 'Gemini';
              else if (sourceStr.includes('Perplexity')) source = 'Perplexity';
              else if (sourceStr.includes('Grok')) source = 'Grok';
            }

            newFormData[formKey] = {
              value: field.value,
              source,
              confidence: field.confidence,
            };

            // Debug: Log first few field-source mappings
            if (Object.keys(newFormData).length <= 5) {
              console.log(`  🔍 Mapped ${formKey}: source="${source}" (from API: "${sourceStr || 'MISSING'}")`);
            }
          }
        }

        console.log('📋 Sample sources from API:', sourceSample);
        console.log('✅ Total fields mapped to form:', Object.keys(newFormData).length);

        // Log lost fields analysis
        if (lostFields.length > 0) {
          console.log(`🚨 LOST FIELDS ANALYSIS: ${lostFields.length} fields not mapped`);
          const noMapping = lostFields.filter(f => f.reason === 'No formKey mapping');
          const nullValues = lostFields.filter(f => f.reason === 'Null/undefined value');
          if (noMapping.length > 0) {
            console.log(`  ❌ ${noMapping.length} fields with no formKey mapping:`, noMapping.map(f => f.apiKey));
            console.log(`  📋 DETAILED LIST:`, noMapping);
          }
          if (nullValues.length > 0) {
            console.log(`  ⚠️  ${nullValues.length} fields with null/undefined values:`, nullValues.map(f => f.apiKey));
          }
        }

        // Count sources in newFormData
        const sourceCounts: Record<string, number> = {};
        for (const [key, fieldData] of Object.entries(newFormData)) {
          const src = fieldData.source || 'UNDEFINED';
          sourceCounts[src] = (sourceCounts[src] || 0) + 1;
        }
        console.log('📊 Source distribution in form data:', sourceCounts);
      }

      setFormData(prev => ({ ...prev, ...newFormData }));

      // Expand all groups to show results (including partial)
      expandAllGroups();

    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
      setSearchProgress('');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    setAddressInput(suggestion.description);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📤 Submitting form with', Object.keys(formData).length, 'UI fields and', apiResponseFields ? Object.keys(apiResponseFields).length : 0, 'API fields');
    onSubmit(formData, apiResponseFields || undefined);
  };

  const renderField = (field: FieldDefinition) => {
    const fieldValue = formData[field.key];
    const value = fieldValue?.value ?? '';
    const source = fieldValue?.source ?? 'Manual Entry';
    const confidence = (fieldValue as any)?.confidence;

    return (
      <div key={field.id} className="grid grid-cols-12 gap-2 items-start py-2 border-b border-white/5">
        {/* Field Number */}
        <div className="col-span-1 text-xs text-gray-500 font-mono pt-2">
          #{field.id}
        </div>

        {/* Field Label & Input */}
        <div className={isAdmin ? "col-span-5" : "col-span-11"}>
          <label className="block text-sm text-gray-300 mb-1">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
            {field.helpText && (
              <span className="ml-1 text-gray-500 cursor-help" title={field.helpText}>
                <Info className="w-3 h-3 inline" />
              </span>
            )}
            {/* Source-based color coding for data reliability */}
            {source && source !== 'Manual Entry' && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${getSourceColor(source).bg} ${getSourceColor(source).text}`}>
                {getSourceColor(source).label}
              </span>
            )}
          </label>
          {renderFieldInput(field, value, (val) => updateField(field.key, val))}
        </div>

        {/* Source Selector - Admin Only */}
        {isAdmin && (
          <div className="col-span-6">
            <label className="block text-xs text-gray-500 mb-1">Source</label>
            <select
              value={source}
              onChange={(e) => updateFieldSource(field.key, e.target.value as DataSource)}
              className="w-full bg-quantum-dark/50 border border-white/10 rounded-lg px-2 py-2 text-sm text-gray-300 focus:border-quantum-cyan focus:outline-none"
            >
              {DATA_SOURCES.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  };

  const renderFieldInput = (
    field: FieldDefinition,
    value: string | number | boolean | string[],
    onChange: (val: string | number | boolean | string[]) => void
  ) => {
    const baseClass = "w-full bg-quantum-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-quantum-cyan focus:outline-none transition-colors";

    switch (field.type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-4 py-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={value === true}
                onChange={() => onChange(true)}
                className="text-quantum-cyan focus:ring-quantum-cyan"
              />
              <span className="text-sm text-gray-300">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={value === false}
                onChange={() => onChange(false)}
                className="text-quantum-cyan focus:ring-quantum-cyan"
              />
              <span className="text-sm text-gray-300">No</span>
            </label>
          </div>
        );

      case 'select':
        return (
          <select
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className={baseClass}
          >
            <option value="">Select...</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-wrap gap-2 py-1">
            {field.options?.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const newValues = selectedValues.includes(opt)
                    ? selectedValues.filter(v => v !== opt)
                    : [...selectedValues, opt];
                  onChange(newValues);
                }}
                className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                  selectedValues.includes(opt)
                    ? 'bg-quantum-cyan/20 border-quantum-cyan text-quantum-cyan'
                    : 'border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                {selectedValues.includes(opt) && <Check className="w-3 h-3 inline mr-1" />}
                {opt}
              </button>
            ))}
          </div>
        );

      case 'number':
      case 'currency':
      case 'percentage':
        // Extract numeric value from various input types
        let numericValue: number | string = '';
        if (typeof value === 'number') {
          numericValue = value;
        } else if (typeof value === 'string' && value) {
          // Try to extract leading number from descriptive strings like "55 - Somewhat Walkable"
          const match = value.match(/^(\d+(?:\.\d+)?)/);
          if (match) {
            numericValue = parseFloat(match[1]);
          } else {
            numericValue = value;
          }
        } else if (typeof value === 'boolean') {
          numericValue = value ? 1 : 0;
        }
        return (
          <div className="relative">
            {field.type === 'currency' && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            )}
            <input
              type="number"
              value={numericValue as number || ''}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              placeholder={field.placeholder}
              className={`${baseClass} ${field.type === 'currency' ? 'pl-7' : ''}`}
            />
            {field.type === 'percentage' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            )}
          </div>
        );

      case 'date':
        // Convert various date formats to yyyy-MM-dd for HTML date input
        let dateValue = value as string || '';
        if (dateValue) {
          try {
            if (dateValue.includes('T')) {
              // Extract yyyy-MM-dd from ISO format (2025-12-02T00:00:00.000Z)
              dateValue = dateValue.split('T')[0];
            } else if (/^[A-Za-z]/.test(dateValue)) {
              // Parse text dates like "April 16, 1998" to yyyy-MM-dd
              const parsed = new Date(dateValue);
              if (!isNaN(parsed.getTime())) {
                const year = parsed.getFullYear();
                const month = String(parsed.getMonth() + 1).padStart(2, '0');
                const day = String(parsed.getDate()).padStart(2, '0');
                dateValue = `${year}-${month}-${day}`;
              }
            } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
              // Try parsing any other format
              const parsed = new Date(dateValue);
              if (!isNaN(parsed.getTime())) {
                const year = parsed.getFullYear();
                const month = String(parsed.getMonth() + 1).padStart(2, '0');
                const day = String(parsed.getDate()).padStart(2, '0');
                dateValue = `${year}-${month}-${day}`;
              }
            }
          } catch (e) {
            console.error('Date parsing error:', e);
          }
        }
        return (
          <input
            type="date"
            value={dateValue}
            onChange={(e) => onChange(e.target.value)}
            className={baseClass}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={baseClass}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Address Search Bar */}
      <div className="glass-card p-4">
        <label className="block text-sm text-gray-400 mb-2">
          <Sparkles className="w-4 h-4 inline mr-1 text-quantum-cyan" />
          AI-Powered Property Search
        </label>
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Enter property address..."
                className="w-full bg-quantum-dark border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-quantum-cyan focus:outline-none"
              />

              {/* Autocomplete Suggestions */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 top-full left-0 right-0 mt-1 bg-quantum-dark border border-white/10 rounded-xl overflow-hidden shadow-lg"
                  >
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                      >
                        <div className="text-white text-sm">{suggestion.mainText}</div>
                        <div className="text-gray-500 text-xs">{suggestion.secondaryText}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={handleAddressSearch}
              disabled={isSearching || !addressInput.trim()}
              className="px-6 py-3 bg-gradient-to-r from-quantum-cyan to-quantum-blue text-quantum-black font-semibold rounded-xl hover:shadow-lg hover:shadow-quantum-cyan/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>

        {/* Data Source Options - 4-Tier Arbitration System */}
        <div className="mt-4 p-3 bg-white/5 rounded-xl space-y-3">
          {/* Tier 1: MLS Data (Always searched first if available) */}
          <div className="pb-2 border-b border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-yellow-400">🥇</span>
              <label className="text-xs font-semibold text-yellow-400">Tier 1: MLS Data</label>
              <span className="text-xs text-gray-500">(Highest Authority)</span>
            </div>
            <p className="text-xs text-white/70 ml-6">Stellar MLS (via Bridge Interactive RESO API) - searches first</p>
          </div>

          {/* Tier 2 & 3: Free APIs Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-cyan-400">🥈</span>
                <label className="text-sm text-white font-medium">Tier 2 & 3: Free APIs (Fast)</label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Google (Geocode, Places, Distance) + FCC Broadband, FEMA, WalkScore, SchoolDigger, AirNow, HowLoud, FBI Crime
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSkipLLMs(!skipLLMs)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                skipLLMs ? 'bg-quantum-green' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  skipLLMs ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Tier 4: AI Engine Selection (only shown if not skipping LLMs) */}
          {!skipLLMs && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-purple-400">🤖</span>
                <label className="text-xs font-semibold text-purple-400">Tier 4: AI Engines</label>
                <span className="text-xs text-gray-500">(Fires in order, costs $):</span>
              </div>
              <div className="flex flex-wrap gap-2 ml-6">
                {[
                  { id: 'perplexity', name: '1. Perplexity', color: 'cyan' },
                  { id: 'gemini', name: '2. Gemini', color: 'purple' },
                  { id: 'gpt', name: '3. GPT-4o', color: 'green' },
                  { id: 'grok', name: '4. Grok', color: 'blue' },
                  { id: 'claude-sonnet', name: '5. Claude Sonnet', color: 'pink' },
                  { id: 'claude-opus', name: '6. Claude Opus', color: 'orange' },
                ].map(engine => (
                  <button
                    key={engine.id}
                    type="button"
                    onClick={() => toggleEngine(engine.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      selectedEngines.includes(engine.id)
                        ? 'bg-quantum-cyan/20 border-quantum-cyan text-quantum-cyan'
                        : 'border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    {selectedEngines.includes(engine.id) && <Check className="w-3 h-3 inline mr-1" />}
                    {engine.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Progress */}
        {(searchProgress || searchError) && (
          <div className="mt-4">
            {searchError ? (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4" />
                {searchError}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-quantum-cyan text-sm">
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {searchProgress}
              </div>
            )}
          </div>
        )}

        {/* Real-time Progress Tracker */}
        {showProgressTracker && (
          <div className="mt-4">
            <SearchProgressTracker
              sources={sourcesProgress}
              isSearching={isSearching}
              totalFieldsFound={liveFieldsFound}
              completionPercentage={liveCompletionPct}
            />
          </div>
        )}
        {/* Search Results Summary */}
        {searchResults && !isSearching && (
          <div className="mt-4 p-3 bg-white/5 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Search Results</span>
              <span className="text-sm font-semibold text-quantum-green">
                {searchResults.completion_percentage}% Complete
              </span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-quantum-cyan to-quantum-green rounded-full transition-all"
                style={{ width: `${searchResults.completion_percentage}%` }}
              />
            </div>
            {searchResults.llm_responses && (
              <div className="mt-2 flex flex-wrap gap-2">
                {(() => {
                  // Merge Perplexity micro-prompts into single display
                  const llmResponses = searchResults.llm_responses;
                  const perplexityResponses = llmResponses.filter((r: any) => r.llm?.startsWith('perplexity-'));
                  const otherResponses = llmResponses.filter((r: any) => !r.llm?.startsWith('perplexity-'));

                  const displayResponses = [...otherResponses];

                  // Add merged Perplexity if any micro-prompts exist
                  if (perplexityResponses.length > 0) {
                    const totalFields = perplexityResponses.reduce((sum: number, r: any) => sum + (r.fields_found || 0), 0);
                    const hasError = perplexityResponses.every((r: any) => r.error);
                    const errorCount = perplexityResponses.filter((r: any) => r.error).length;

                    displayResponses.unshift({
                      llm: 'perplexity',
                      fields_found: totalFields,
                      error: hasError ? `${errorCount}/${perplexityResponses.length} prompts failed` : null
                    });
                  }

                  return displayResponses.map((resp: any, idx: number) => (
                    <span
                      key={idx}
                      className={`text-xs px-2 py-1 rounded ${
                        resp.error ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {resp.llm}: {resp.error ? 'Error' : `${resp.fields_found} fields`}
                    </span>
                  ));
                })()}
              </div>
            )}
            {searchResults.conflicts && searchResults.conflicts.length > 0 && (
              <div className="mt-2 text-xs text-yellow-400">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                {searchResults.conflicts.length} data conflicts found (review flagged fields)
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3">
          {skipLLMs
            ? '🔍 Search order: MLS Data (Tier 1) → Google APIs (Tier 2) → Free APIs (Tier 3) - no AI costs'
            : '🔍 Search order: MLS Data (Tier 1) → Google + Free APIs (Tiers 2 & 3) → AI Engines (Tier 4)'}
        </p>
      </div>

      {/* Expand/Collapse Controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">
          All 181 Property Fields
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={expandAllGroups}
            className="text-xs text-quantum-cyan hover:underline"
          >
            Expand All
          </button>
          <span className="text-gray-600">|</span>
          <button
            type="button"
            onClick={collapseAllGroups}
            className="text-xs text-gray-400 hover:underline"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Field Groups */}
      <div className="space-y-2">
        {FIELD_GROUPS.map((group) => {
          const groupFields = FIELD_DEFINITIONS.filter(f => group.fields.includes(f.id));
          const isExpanded = expandedGroups.includes(group.id);
          const filledCount = groupFields.filter(f => {
            const val = formData[f.key]?.value;
            return val !== undefined && val !== '' && val !== null;
          }).length;

          return (
            <div key={group.id} className="glass-card overflow-hidden">
              {/* Group Header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-quantum-cyan" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                    {group.id}
                  </span>
                  <span className="font-semibold text-white">{group.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {filledCount}/{groupFields.length} fields
                  </span>
                  <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        filledCount === groupFields.length
                          ? 'bg-quantum-green'
                          : filledCount > 0
                          ? 'bg-gradient-to-r from-quantum-cyan to-quantum-purple'
                          : 'bg-white/20'
                      }`}
                      style={{ width: `${(filledCount / groupFields.length) * 100}%` }}
                    />
                  </div>
                </div>
              </button>

              {/* Group Fields */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-4 space-y-1">
                      {/* Header row for admin */}
                      {isAdmin && (
                        <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 pb-2 border-b border-white/10">
                          <div className="col-span-1">#</div>
                          <div className="col-span-5">Field</div>
                          <div className="col-span-6">Data Source (Admin Only)</div>
                        </div>
                      )}
                      {groupFields.map(renderField)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-4 glass-card p-4 flex justify-between items-center">
        <div className="text-sm text-gray-400">
          {Object.keys(formData).filter(k => {
            const val = formData[k]?.value;
            return val !== undefined && val !== '' && val !== null;
          }).length} / 181 fields completed
        </div>
        <button
          type="submit"
          className="px-8 py-3 bg-gradient-to-r from-quantum-cyan to-quantum-purple text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-quantum-purple/30 transition-all"
        >
          Save Property
        </button>
      </div>
    </form>
  );
}
