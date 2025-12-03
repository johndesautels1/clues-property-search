/**
 * CLUES Property Dashboard - Property Search Form
 * 138-field form with real LLM-powered address search
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
  const [selectedEngines, setSelectedEngines] = useState(['grok', 'perplexity', 'claude-opus', 'gpt', 'claude-sonnet', 'gemini']);
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
    // API returns keys like "1_full_address", we need "addressIdentity.fullAddress"
    const fieldNumber = parseInt(apiKey.split('_')[0]);
    const fieldDef = FIELD_DEFINITIONS.find(f => f.id === fieldNumber);
    return fieldDef?.key || null;
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

    // Call search API and get JSON response
    const performSearch = () => {
      return new Promise<any>((resolve, reject) => {
        // Create POST request body
        const body = JSON.stringify({
          address: addressInput,
          engines: skipLLMs ? [] : selectedEngines,
          skipLLMs,
        });

        // Use regular JSON fetch (search.ts returns JSON, not SSE)
        fetch(`${API_BASE}/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        }).then(async response => {
          if (!response.ok) {
            throw new Error('Search failed');
          }

          // Parse JSON response directly
          const data = await response.json();

          // Update progress message
          setSearchProgress('Search complete - processing results...');

          // Update final field counts
          if (data.total_fields_found) {
            setLiveFieldsFound(data.total_fields_found);
            setLiveCompletionPct(data.completion_percentage || Math.round((data.total_fields_found / 168) * 100));
          }

          // Mark all sources as complete (since we get final result only)
          if (data.source_breakdown) {
            console.log('📊 Updating progress tracker from source_breakdown:', data.source_breakdown);

            Object.entries(data.source_breakdown).forEach(([sourceName, count]) => {
              console.log(`  - Trying to map "${sourceName}" to source ID...`);

              // Normalize source name for matching
              const normalizedSourceName = sourceName.toLowerCase()
                .replace(/\./g, '')  // Remove dots
                .replace(/\s+/g, ''); // Remove spaces

              // Find matching source with flexible matching rules
              const matchingSource = DEFAULT_SOURCES.find(s => {
                const normalizedId = s.id.replace(/-/g, '');
                const normalizedName = s.name.toLowerCase().replace(/\s+/g, '');

                // Direct match by ID or name
                if (normalizedId === normalizedSourceName || normalizedName === normalizedSourceName) {
                  return true;
                }

                // Special case mappings
                const mappings: Record<string, string[]> = {
                  'google-geocode': ['googlemaps', 'googlegeocoding'],
                  'google-places': ['googleplaces'],
                  'walkscore': ['walkscore'],
                  'fema': ['fema', 'femanfhl', 'femaflood'],
                  'airnow': ['airnow'],
                  'howloud': ['howloud'],
                  'weather': ['weathercom', 'weather'],
                  'crime': ['crimegradeorg', 'crimegrade', 'fbicrime'],
                  'schooldigger': ['schooldigger'],
                };

                const validMappings = mappings[s.id] || [];
                return validMappings.some(mapping => normalizedSourceName.includes(mapping) || mapping.includes(normalizedSourceName));
              });

              if (matchingSource) {
                console.log(`    ✅ Matched to ID: "${matchingSource.id}" (${matchingSource.name}) - ${count} fields`);
                updateSource(matchingSource.id, {
                  status: 'complete',
                  fieldsFound: count as number || 0
                });
              } else {
                console.log(`    ❌ No match found for "${sourceName}" (normalized: "${normalizedSourceName}")`);
                console.log(`       Available source IDs:`, DEFAULT_SOURCES.map(s => s.id).join(', '));
              }
            });
          } else {
            console.log('⚠️ No source_breakdown in response');
          }

          // Mark any sources still in "searching" state as complete with 0 fields
          setSourcesProgress(prev => {
            const updated = prev.map(s => {
              if (s.status === 'searching' || s.status === 'pending') {
                console.log(`⚠️ Source "${s.name}" (${s.id}) still ${s.status} - marking complete with 0 fields`);
                return { ...s, status: 'complete' as const, fieldsFound: 0 };
              }
              return s;
            });
            return updated;
          });

          // Resolve with the complete data
          resolve(data);
        }).catch(reject);
      });
    };

    try {
      const data = await performSearch();

      setSearchResults(data);

      // Show appropriate message based on partial vs complete results
      if (data.partial) {
        setSearchError(`Partial results: ${data.error || 'Some sources failed'}. You can still view and edit the data received.`);
        setSearchProgress(`Found ${data.total_fields_found || 0} of 168 fields (${data.completion_percentage || 0}%) - PARTIAL`);
      } else {
        setSearchProgress(`Found ${data.total_fields_found || 0} of 168 fields (${data.completion_percentage || 0}%)`);
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

        for (const [apiKey, fieldData] of Object.entries(data.fields)) {
          const field = fieldData as any;
          const formKey = mapApiFieldToFormKey(apiKey);

          if (formKey && field.value !== null && field.value !== undefined) {
            // Parse source to get a valid DataSource
            let source: DataSource = 'Other';
            const sourceStr = field.source || '';

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
          }
        }

        console.log('📋 Sample sources from API:', sourceSample);
        console.log('✅ Total fields mapped to form:', Object.keys(newFormData).length);
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
        // Convert ISO date to yyyy-MM-dd format for HTML date input
        let dateValue = value as string || '';
        if (dateValue && dateValue.includes('T')) {
          // Extract yyyy-MM-dd from ISO format (2025-12-02T00:00:00.000Z)
          dateValue = dateValue.split('T')[0];
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
                Google (Geocode, Places, Distance) + FEMA, WalkScore, SchoolDigger, AirNow, HowLoud, FBI Crime
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
                  { id: 'grok', name: '2. Grok', color: 'blue' },
                  { id: 'claude-opus', name: '3. Claude Opus', color: 'orange' },
                  { id: 'gpt', name: '4. GPT-4', color: 'green' },
                  { id: 'claude-sonnet', name: '5. Claude Sonnet', color: 'pink' },
                  { id: 'gemini', name: '6. Gemini', color: 'purple' },
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
                {searchResults.llm_responses.map((resp: any, idx: number) => (
                  <span
                    key={idx}
                    className={`text-xs px-2 py-1 rounded ${
                      resp.error ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {resp.llm}: {resp.error ? 'Error' : `${resp.fields_found} fields`}
                  </span>
                ))}
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
          All 138 Property Fields
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
          }).length} / 138 fields completed
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
