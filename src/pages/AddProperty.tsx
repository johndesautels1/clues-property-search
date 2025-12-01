/**
 * CLUES Property Dashboard - Add Property Page
 * LLM-powered property scraping + Manual entry - CONNECTED TO STORE
 */

import { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Globe,
  CheckCircle,
  Loader2,
  AlertCircle,
  PenLine,
  Upload,
  MapPin,
  FileText,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { usePropertyStore } from '@/store/propertyStore';
import type { PropertyCard, Property, DataField } from '@/types/property';
import { LLM_CASCADE_ORDER, LLM_DISPLAY_NAMES } from '@/lib/llm-constants';
import { normalizeToProperty } from '@/lib/field-normalizer';
import { initializeCascadeStatus, getSourceName } from '@/lib/data-sources';
import { ALL_FIELDS, UI_FIELD_GROUPS, type FieldDefinition } from '@/types/fields-schema';

// Autocomplete suggestion type
interface AddressSuggestion {
  description: string;
  placeId: string;
  mainText: string;
  secondaryText: string;
}

type ScrapeStatus = 'idle' | 'searching' | 'scraping' | 'enriching' | 'complete' | 'error';
type InputMode = 'address' | 'url' | 'manual' | 'csv' | 'text' | 'pdf';

// Generate a simple unique ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// LLM Engine options - Use unified cascade order from constants (Perplexity & Grok first for web search)
const LLM_ENGINES = [
  { id: 'Auto', label: 'Auto Cascade', desc: 'All 6 engines', icon: '🔄' },
  { id: 'perplexity', label: LLM_DISPLAY_NAMES['perplexity'], desc: 'Web Search', icon: '🔍' },
  { id: 'grok', label: LLM_DISPLAY_NAMES['grok'], desc: 'Web Search', icon: '⚡' },
  { id: 'claude-opus', label: LLM_DISPLAY_NAMES['claude-opus'], desc: 'Knowledge', icon: '👑' },
  { id: 'gpt', label: LLM_DISPLAY_NAMES['gpt'], desc: 'Knowledge', icon: '🤖' },
  { id: 'claude-sonnet', label: LLM_DISPLAY_NAMES['claude-sonnet'], desc: 'Fallback', icon: '🧊' },
  { id: 'gemini', label: LLM_DISPLAY_NAMES['gemini'], desc: 'Last resort', icon: '♊' },
];

export default function AddProperty() {
  const navigate = useNavigate();
  const { addProperty, addProperties } = usePropertyStore();

  const [address, setAddress] = useState('');
  const [url, setUrl] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [status, setStatus] = useState<ScrapeStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [totalFieldsFound, setTotalFieldsFound] = useState(0);  // Actual field count from backend
  const [selectedEngine, setSelectedEngine] = useState('Auto');
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [accumulatedFields, setAccumulatedFields] = useState<Record<string, any>>({});  // Accumulated fields across LLM calls
  const [currentAddress, setCurrentAddress] = useState('');  // Track address for accumulation
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [propertyText, setPropertyText] = useState('');
  const [enrichWithAI, setEnrichWithAI] = useState(false);

  // PDF upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfParsedFields, setPdfParsedFields] = useState<Record<string, any>>({});
  const [pdfParseStatus, setPdfParseStatus] = useState<'idle' | 'uploading' | 'parsing' | 'complete' | 'error'>('idle');
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [cascadeStatus, setCascadeStatus] = useState<{llm: string; status: 'pending' | 'running' | 'complete' | 'error' | 'skipped'; fieldsFound?: number}[]>([]);

  // Manual entry form state - now stores all 168 fields
  // Initialize with empty strings for all fields from the schema
  const [manualFormFields, setManualFormFields] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    ALL_FIELDS.forEach(field => {
      initial[field.key] = '';
    });
    return initial;
  });

  // Legacy form state for backward compatibility with address autocomplete
  const [manualForm, setManualForm] = useState({
    address: '',
    city: '',
    state: 'FL',
    zip: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    yearBuilt: '',
    propertyType: 'Single Family',
    listingStatus: 'Active',
  });

  // Track which field groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // Default to first 4 groups expanded
    return new Set(['A', 'B', 'C', 'D']);
  });

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Update manual form field
  const updateManualField = (key: string, value: string) => {
    setManualFormFields(prev => ({ ...prev, [key]: value }));
    
    // Also update legacy form for address-related fields
    if (key === 'full_address') {
      setManualForm(prev => ({ ...prev, address: value }));
    } else if (key === 'zip_code') {
      setManualForm(prev => ({ ...prev, zip: value }));
    } else if (key === 'listing_price') {
      setManualForm(prev => ({ ...prev, price: value }));
    } else if (key === 'bedrooms') {
      setManualForm(prev => ({ ...prev, bedrooms: value }));
    } else if (key === 'total_bathrooms') {
      setManualForm(prev => ({ ...prev, bathrooms: value }));
    } else if (key === 'living_sqft') {
      setManualForm(prev => ({ ...prev, sqft: value }));
    } else if (key === 'year_built') {
      setManualForm(prev => ({ ...prev, yearBuilt: value }));
    } else if (key === 'property_type') {
      setManualForm(prev => ({ ...prev, propertyType: value }));
    } else if (key === 'listing_status') {
      setManualForm(prev => ({ ...prev, listingStatus: value }));
    }
  };

  // Get field definition by key
  const getFieldByKey = (key: string): FieldDefinition | undefined => {
    return ALL_FIELDS.find(f => f.key === key);
  };

  // Render input based on field type
  const renderFieldInput = (field: FieldDefinition) => {
    const value = manualFormFields[field.key] || '';
    const commonClasses = 'input-glass text-sm';
    
    switch (field.type) {
      case 'boolean':
        return (
          <select
            value={value}
            onChange={(e) => updateManualField(field.key, e.target.value)}
            className={commonClasses}
          >
            <option value="">Select...</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => updateManualField(field.key, e.target.value)}
            className={commonClasses}
          >
            <option value="">Select...</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      
      case 'multiselect':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => updateManualField(field.key, e.target.value)}
            className={commonClasses}
            placeholder="Comma-separated values"
          />
        );
      
      case 'number':
      case 'currency':
      case 'percentage':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => updateManualField(field.key, e.target.value)}
            className={commonClasses}
            placeholder={field.placeholder || (field.type === 'currency' ? '$0' : field.type === 'percentage' ? '0%' : '0')}
            step={field.type === 'percentage' ? '0.01' : '1'}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => updateManualField(field.key, e.target.value)}
            className={commonClasses}
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => updateManualField(field.key, e.target.value)}
            className={commonClasses}
            placeholder={field.placeholder || field.label}
          />
        );
    }
  };

  // Count filled fields
  const filledFieldsCount = Object.values(manualFormFields).filter(v => v !== '').length;
  const totalFieldsCount = ALL_FIELDS.length;
  const completionPercentage = Math.round((filledFieldsCount / totalFieldsCount) * 100);

  // Autocomplete state for Manual tab
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AddressSuggestion | null>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced fetch for address autocomplete (8 FL counties only)
  const fetchAddressSuggestions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/property/autocomplete?input=${encodeURIComponent(input)}`);

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(data.suggestions?.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Handle address input change with debounce
  const handleAddressInputChange = (value: string) => {
    setManualForm({ ...manualForm, address: value });
    setSelectedSuggestion(null);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer (300ms)
    debounceTimerRef.current = setTimeout(() => {
      fetchAddressSuggestions(value);
    }, 300);
  };

  // Handle suggestion selection - parse address and fill form
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setSelectedSuggestion(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);

    // Parse the suggestion to fill form fields
    // Format: "123 Main St, City, FL 33706, USA"
    const parts = suggestion.description.split(',').map(s => s.trim());

    const streetAddress = suggestion.mainText || parts[0] || '';
    const secondary = suggestion.secondaryText || '';

    // Parse city, state, zip from secondary text
    // Format: "City, FL 33706, USA" or "City, FL, USA"
    const secondaryParts = secondary.split(',').map(s => s.trim());
    const city = secondaryParts[0] || '';

    // Extract state and zip from second part (e.g., "FL 33706")
    const stateZipPart = secondaryParts[1] || '';
    const stateMatch = stateZipPart.match(/([A-Z]{2})/);
    const zipMatch = stateZipPart.match(/(\d{5})/);

    setManualForm({
      ...manualForm,
      address: streetAddress,
      city: city,
      state: stateMatch?.[1] || 'FL',
      zip: zipMatch?.[1] || '',
    });
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleManualSubmit = async () => {
    // Check full_address from new form fields, fall back to legacy form
    const fullAddressField = manualFormFields['full_address'] || '';
    const legacyFullAddress = `${manualForm.address}, ${manualForm.city}, ${manualForm.state}${manualForm.zip ? ' ' + manualForm.zip : ''}`;
    
    // Use the new field if filled, otherwise use legacy
    const fullAddress = fullAddressField || legacyFullAddress;
    
    if (!fullAddress || fullAddress === ', FL') {
      alert('Please fill in at least the Full Address field');
      return;
    }

    // Convert manualFormFields to the API format (num_key: { value })
    const manualFields: Record<string, { value: any; source: string }> = {};
    ALL_FIELDS.forEach(field => {
      const value = manualFormFields[field.key];
      if (value !== '' && value !== null && value !== undefined) {
        // Convert types appropriately
        let parsedValue: any = value;
        if (field.type === 'number' || field.type === 'currency' || field.type === 'percentage') {
          parsedValue = parseFloat(value) || value;
        } else if (field.type === 'boolean') {
          parsedValue = value === 'true';
        }
        manualFields[`${field.num}_${field.key}`] = { 
          value: parsedValue, 
          source: 'Manual Entry' 
        };
      }
    });

    // Check if this is a new address or continuing with same address
    const isNewAddress = fullAddress !== currentAddress;
    const hasExistingData = Object.keys(accumulatedFields).length > 0;
    const shouldAccumulate = !isNewAddress && hasExistingData;

    // Use startTransition for non-urgent UI updates to improve INP
    startTransition(() => {
      setStatus('searching');
      if (isNewAddress) {
        // New address - reset everything
        setProgress(0);
        setTotalFieldsFound(0);
        setAccumulatedFields({});
        setCurrentAddress(fullAddress);
      }
      setCascadeStatus(initializeCascadeStatus());
    });

    // Allow browser to paint before heavy async work
    await new Promise(resolve => requestAnimationFrame(resolve));

    try {
      // Use SSE streaming for real-time progress
      const apiUrl = import.meta.env.VITE_API_URL || '';

      // Determine which engines to use based on selection
      const getEngines = () => {
        if (selectedEngine === 'Auto') {
          return ['perplexity', 'grok', 'claude-opus', 'gpt', 'claude-sonnet', 'gemini'];
        }
        return [selectedEngine];
      };

      // Merge manual fields with any existing accumulated fields
      const mergedFields = { ...accumulatedFields, ...manualFields };

      const response = await fetch(`${apiUrl}/api/property/search-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: fullAddress,
          engines: getEngines(),
          skipLLMs: false,
          existingFields: shouldAccumulate ? mergedFields : manualFields,  // Include manual fields
          skipApis: shouldAccumulate,  // Skip APIs if we already have data from this address
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalData: any = null;
      let currentFieldsFound = 0;

      // Use unified source name mapping from data-sources manifest

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          if (!finalData) {
            throw new Error('Stream ended without complete event');
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (eventType === 'progress') {
                // Update cascade status for summary display - use startTransition for non-blocking updates
                // fieldsFound = actual raw fields returned by source
                // newUniqueFields = fields that weren't already found (for dedup tracking)
                const { source, status: sourceStatus, fieldsFound, newUniqueFields } = data;
                const displayName = getSourceName(source);

                startTransition(() => {
                  setCascadeStatus(prev => {
                    const existing = prev.find(s => s.llm === displayName);
                    if (existing) {
                      return prev.map(s => s.llm === displayName
                        ? { ...s, status: sourceStatus as 'pending' | 'running' | 'complete' | 'error', fieldsFound }
                        : s
                      );
                    }
                    return [...prev, { llm: displayName, status: sourceStatus as 'pending' | 'running' | 'complete' | 'error', fieldsFound }];
                  });

                  // Update progress based on NEW UNIQUE fields (not raw count to avoid double counting)
                  if (newUniqueFields !== undefined) {
                    currentFieldsFound += newUniqueFields;
                  } else {
                    // Fallback for non-LLM sources that don't send newUniqueFields
                    currentFieldsFound += fieldsFound || 0;
                  }
                  setProgress(Math.min(Math.round((currentFieldsFound / 138) * 100), 99));

                  // Update status message
                  if (sourceStatus === 'searching') {
                    setStatus('scraping');
                  }
                });
              } else if (eventType === 'complete') {
                finalData = data;
                // Set actual total fields found from backend
                if (data.total_fields_found !== undefined) {
                  setTotalFieldsFound(data.total_fields_found);
                }
                // Store accumulated fields for next LLM call
                if (data.fields) {
                  setAccumulatedFields(data.fields);
                  console.log('💾 Accumulated fields saved:', Object.keys(data.fields).length);
                }
                // Handle partial data (timeout with some data retrieved)
                if (data.partial) {
                  console.warn('⚠️ Partial data received due to timeout:', data.error);
                }
              } else if (eventType === 'error') {
                throw new Error(data.error || 'Search error');
              }
            } catch (e) {
              if (eventType === 'error') throw e;
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      const data = finalData;

      // Extract property data from API response
      const fields = data.fields || {};
      const fieldSources = data.field_sources || {};
      const conflicts = data.conflicts || [];

      console.log('🔍 Manual Entry SSE Response:', data);
      console.log('📊 Total Fields Found:', data.total_fields_found);

      // Parse address components from API or use form values as fallback (with safe guard for undefined)
      const apiFullAddress = fields['1_full_address']?.value || fullAddress || '';
      const addressParts = (apiFullAddress || '').split(',').map((s: string) => s.trim());
      const street = addressParts[0] || manualForm.address;
      const city = addressParts[1] || manualForm.city;
      const stateZip = addressParts[2] || '';
      const stateMatch = stateZip.match(/([A-Z]{2})/);
      const zipMatch = stateZip.match(/(\d{5})/);

      // Create property card from API response with form fallbacks
      const scrapedProperty: PropertyCard = {
        id: generateId(),
        address: street,
        city,
        state: stateMatch?.[1] || manualForm.state,
        zip: zipMatch?.[1] || manualForm.zip,
        price: fields['10_listing_price']?.value || parseInt(manualForm.price) || 0,
        pricePerSqft: fields['11_price_per_sqft']?.value || (
          manualForm.sqft && manualForm.price
            ? Math.round(parseInt(manualForm.price) / parseInt(manualForm.sqft))
            : 0
        ),
        bedrooms: fields['17_bedrooms']?.value || parseInt(manualForm.bedrooms) || 0,
        bathrooms: fields['20_total_bathrooms']?.value || parseFloat(manualForm.bathrooms) || 0,
        sqft: fields['21_living_sqft']?.value || parseInt(manualForm.sqft) || 0,
        yearBuilt: fields['25_year_built']?.value || parseInt(manualForm.yearBuilt) || new Date().getFullYear(),
        smartScore: data.completion_percentage || 75,
        dataCompleteness: data.completion_percentage || 0,
        listingStatus: fields['4_listing_status']?.value || manualForm.listingStatus as 'Active' | 'Pending' | 'Sold',
        daysOnMarket: 0,
      };

      // Create full property object with all 138 fields if available
      const fullPropertyData = convertApiResponseToFullProperty(fields, scrapedProperty.id, fieldSources, conflicts);

      addProperty(scrapedProperty, fullPropertyData);
      setLastAddedId(scrapedProperty.id);
      setStatus('complete');
      setProgress(data.completion_percentage || 100);

      console.log('✅ Property added from manual entry:', data);

      // Reset all form fields
      setManualForm({
        address: '',
        city: '',
        state: 'FL',
        zip: '',
        price: '',
        bedrooms: '',
        bathrooms: '',
        sqft: '',
        yearBuilt: '',
        propertyType: 'Single Family',
        listingStatus: 'Active',
      });
      // Reset the new 168-field form
      const resetFields: Record<string, string> = {};
      ALL_FIELDS.forEach(field => {
        resetFields[field.key] = '';
      });
      setManualFormFields(resetFields);
      setSelectedSuggestion(null);

    } catch (error) {
      console.error('Manual entry error:', error);
      setStatus('error');
      alert(`Failed to fetch property data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleScrape = async () => {
    // Validate input based on mode
    if (inputMode === 'address' && !address) {
      alert('Please enter a property address');
      return;
    }
    if (inputMode === 'url' && !url) {
      alert('Please enter a listing URL');
      return;
    }
    if (inputMode === 'text' && !propertyText) {
      alert('Please paste a property description');
      return;
    }

    // Determine which input to use
    let searchQuery = '';
    if (inputMode === 'address') {
      searchQuery = address;
    } else if (inputMode === 'url') {
      searchQuery = url;
    } else if (inputMode === 'text') {
      // Extract address from text if possible, or use full text
      searchQuery = propertyText;
    }

    // Check if this is a new address or continuing with same address
    const isNewAddress = searchQuery !== currentAddress;
    const hasExistingData = Object.keys(accumulatedFields).length > 0;
    const shouldAccumulate = !isNewAddress && hasExistingData;

    if (isNewAddress) {
      // New address - reset accumulation
      setAccumulatedFields({});
      setCurrentAddress(searchQuery);
      setTotalFieldsFound(0);
    }

    setStatus('searching');
    setProgress(10);

    try {

      // Call the backend API
      const apiUrl = import.meta.env.VITE_API_URL || '/api/property/search';

      setStatus('scraping');
      setProgress(30);

      // Map selected engine to API format
      const getEngines = () => {
        if (selectedEngine === 'Auto') {
          // Full cascade order per reliability audit
          return ['perplexity', 'grok', 'claude-opus', 'gpt', 'claude-sonnet', 'gemini'];
        }
        // Single engine selected
        return [selectedEngine]; // Already in correct format (e.g., 'claude-opus', 'gpt')
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: searchQuery,
          url: inputMode === 'url' ? url : undefined,
          engines: getEngines(),
          useGrok: selectedEngine === 'Auto' || selectedEngine === 'grok',
          usePerplexity: selectedEngine === 'perplexity',
          useCascade: selectedEngine === 'Auto', // Only cascade on Auto
          existingFields: shouldAccumulate ? accumulatedFields : {},  // Send existing fields for accumulation
          skipApis: shouldAccumulate,  // Skip APIs if we already have data from this address
        }),
      });

      setStatus('enriching');
      setProgress(60);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      setProgress(90);

      // Extract property data from API response
      const fields = data.fields || {};
      const fieldSources = data.field_sources || {}; // NEW: Track which LLMs provided each field
      const conflicts = data.conflicts || []; // NEW: Track conflicting values

      // Store accumulated fields for next LLM call
      if (fields && Object.keys(fields).length > 0) {
        setAccumulatedFields(fields);
        setTotalFieldsFound(data.total_fields_found || Object.keys(fields).length);
        console.log('💾 Accumulated fields saved:', Object.keys(fields).length);
      }

      console.log('🔍 API Response:', data);
      console.log('📊 Field Sources:', fieldSources);
      console.log('⚠️  Conflicts:', conflicts);

      // Parse address components (with safe guard for undefined)
      const fullAddress = fields['1_full_address']?.value || searchQuery || '';
      const addressParts = (fullAddress || '').split(',').map((s: string) => s.trim());
      const street = addressParts[0] || '';
      const city = addressParts[1] || 'Unknown';
      const stateZip = addressParts[2] || '';
      const stateMatch = stateZip.match(/([A-Z]{2})/);
      const zipMatch = stateZip.match(/(\d{5})/);

      // Create property card from API response with type coercion
      const getFieldValue = (field: any): any => {
        if (!field) return null;
        return field.value !== undefined ? field.value : field;
      };

      const parseNumber = (val: any): number => {
        const num = typeof val === 'number' ? val : parseFloat(String(val));
        return !isNaN(num) ? num : 0;
      };

      const scrapedProperty: PropertyCard = {
        id: generateId(),
        address: street || fullAddress,
        city,
        state: stateMatch?.[1] || 'FL',
        zip: zipMatch?.[1] || '',
        price: parseNumber(getFieldValue(fields['10_listing_price'])),
        pricePerSqft: parseNumber(getFieldValue(fields['11_price_per_sqft'])),
        bedrooms: parseNumber(getFieldValue(fields['17_bedrooms'])),
        bathrooms: parseNumber(getFieldValue(fields['20_total_bathrooms'])),
        sqft: parseNumber(getFieldValue(fields['21_living_sqft'])),
        yearBuilt: parseNumber(getFieldValue(fields['25_year_built'])) || new Date().getFullYear(),
        smartScore: data.completion_percentage || 75,
        dataCompleteness: data.completion_percentage || 0,
        listingStatus: (getFieldValue(fields['4_listing_status']) || 'Active') as 'Active' | 'Pending' | 'Sold',
        daysOnMarket: 0,
      };

      // Create full property object with all 138 fields if available
      const fullPropertyData = convertApiResponseToFullProperty(fields, scrapedProperty.id, fieldSources, conflicts);

      addProperty(scrapedProperty, fullPropertyData);
      setLastAddedId(scrapedProperty.id);
      setStatus('complete');
      setProgress(100);

      console.log('✅ Property scraped successfully:', data);
      console.log('📊 Fields found:', data.total_fields_found);
      console.log('📋 Sources:', data.sources);

    } catch (error) {
      console.error('Scrape error:', error);
      setStatus('error');
      alert(`Failed to extract property data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Convert API response to full Property object using unified normalizer
   * This ensures consistent field mapping across the entire application
   */
  const convertApiResponseToFullProperty = (
    fields: any,
    propertyId: string,
    fieldSources: Record<string, string[]> = {},
    conflicts: Array<{ field: string; values: Array<{ source: string; value: any }> }> = []
  ): Property => {
    return normalizeToProperty(fields, propertyId, fieldSources, conflicts);
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'searching':
        return 'Finding property listings...';
      case 'scraping':
        return 'Extracting 138 fields with AI...';
      case 'enriching':
        return 'Enriching with Walk Score, Crime, Schools...';
      case 'complete':
        return 'Property added successfully!';
      case 'error':
        return 'Error scraping property';
      default:
        return '';
    }
  };

  const resetForm = () => {
    setStatus('idle');
    setProgress(0);
    setAddress('');
    setUrl('');
    setLastAddedId(null);
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;

      // Parse CSV properly handling quoted fields with commas
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const rows = text.split('\n').filter(r => r.trim());
      const headers = parseCSVLine(rows[0]);

      // Check if this is a field definition format (Field, Category, Name, Value, Notes/Sources)
      const isFieldDefinitionFormat = headers.includes('Field') && headers.includes('Name') && headers.includes('Value');

      let data: any[];

      if (isFieldDefinitionFormat) {
        // Convert field definition format to single property object
        const property: any = {};
        rows.slice(1).forEach(row => {
          const values = parseCSVLine(row);
          const fieldNum = values[headers.indexOf('Field')] || '';
          const fieldName = values[headers.indexOf('Name')] || '';
          const fieldValue = values[headers.indexOf('Value')] || '';

          // Create key from field number and name
          const key = `${fieldNum}_${fieldName}`;
          property[key] = fieldValue;
        });

        data = [property]; // Single property with all fields
        console.log('CSV parsed as field definition format:', { fields: Object.keys(property).length, property });
      } else {
        // Standard CSV format - each row is a property
        data = rows.slice(1).map(row => {
          const values = parseCSVLine(row);
          const obj: any = {};
          headers.forEach((header, i) => {
            obj[header] = values[i] || '';
          });
          return obj;
        });
        console.log('CSV parsed as standard format:', { headers: headers.length, rows: data.length, firstRow: data[0] });
      }

      setCsvData(data);
    };

    reader.readAsText(file);
  };

  // Helper to create a DataField with default values
  const createDataField = <T,>(
    value: T | null,
    confidence: 'High' | 'Medium-High' | 'Medium' | 'Low' = 'Medium',
    llmSources: string[] = [],
    hasConflict: boolean = false,
    conflictValues: Array<{ source: string; value: any }> = []
  ): DataField<T> => ({
    value,
    confidence,
    notes: llmSources.length > 0 ? `Sourced from ${llmSources.join(', ')}` : 'Imported from CSV',
    sources: llmSources.length > 0 ? llmSources : ['CSV Upload'],
    lastUpdated: new Date().toISOString(),
    llmSources,
    hasConflict,
    conflictValues,
  });

  // Helper to parse price ranges - takes first number only
  const parsePrice = (str: string | undefined): number | null => {
    if (!str) return null;
    // Handle ranges like "$1,085-$1,499" - extract first number only
    const firstNumber = str.split('-')[0].replace(/[^0-9.]/g, '');
    return firstNumber ? parseFloat(firstNumber) : null;
  };

  // Convert CSV row with 168 fields to full Property object
  // UPDATED: 2025-11-30 - Field numbers aligned with fields-schema.ts (SOURCE OF TRUTH)
  const convertCsvToFullProperty = (row: any, propertyId: string): Property => {
    const now = new Date().toISOString();

    return {
      id: propertyId,
      createdAt: now,
      updatedAt: now,
      address: {
        fullAddress: createDataField(row['1_full_address'] || ''),
        mlsPrimary: createDataField(row['2_mls_primary'] || ''),
        mlsSecondary: createDataField(row['3_mls_secondary'] || ''),
        listingStatus: createDataField(row['4_listing_status'] || 'Active'),
        listingDate: createDataField(row['5_listing_date'] || ''),
        listingPrice: createDataField(row['10_listing_price'] ? parseFloat(row['10_listing_price'].toString().replace(/[^0-9.]/g, '')) : null),
        pricePerSqft: createDataField(row['11_price_per_sqft'] ? parseFloat(row['11_price_per_sqft'].toString().replace(/[^0-9.]/g, '')) : null),
        streetAddress: createDataField(row['1_full_address'] || ''),
        city: createDataField(row['city'] || ''),
        state: createDataField(row['state'] || 'FL'),
        zipCode: createDataField(row['8_zip_code'] || ''),
        county: createDataField(row['7_county'] || ''),
        latitude: createDataField(row['latitude'] ? parseFloat(row['latitude']) : null),
        longitude: createDataField(row['longitude'] ? parseFloat(row['longitude']) : null),
        neighborhoodName: createDataField(row['6_neighborhood'] || ''),
      },
      details: {
        bedrooms: createDataField(row['17_bedrooms'] ? parseInt(row['17_bedrooms']) : null),
        fullBathrooms: createDataField(row['18_full_bathrooms'] ? parseInt(row['18_full_bathrooms']) : null),
        halfBathrooms: createDataField(row['19_half_bathrooms'] ? parseInt(row['19_half_bathrooms']) : null),
        totalBathrooms: createDataField(row['20_total_bathrooms'] ? parseFloat(row['20_total_bathrooms']) : null),
        livingSqft: createDataField(row['21_living_sqft'] ? parseInt(row['21_living_sqft']) : null),
        totalSqftUnderRoof: createDataField(row['22_total_sqft_under_roof'] ? parseInt(row['22_total_sqft_under_roof']) : null),
        lotSizeSqft: createDataField(row['23_lot_size_sqft'] ? parseInt(row['23_lot_size_sqft']) : null),
        lotSizeAcres: createDataField(row['24_lot_size_acres'] ? parseFloat(row['24_lot_size_acres']) : null),
        yearBuilt: createDataField(row['25_year_built'] ? parseInt(row['25_year_built']) : null),
        propertyType: createDataField(row['26_property_type'] || 'Single Family'),
        stories: createDataField(row['27_stories'] || null),
        garageSpaces: createDataField(row['28_garage_spaces'] ? parseInt(row['28_garage_spaces']) : null),
        parkingTotal: createDataField(row['29_parking_total'] || ''),
        hoaYn: createDataField(row['30_hoa_yn'] === 'true' || row['30_hoa_yn'] === 'yes' || row['30_hoa_yn'] === true),
        hoaFeeAnnual: createDataField(row['31_hoa_fee_annual'] ? parseFloat(row['31_hoa_fee_annual'].toString().replace(/[^0-9.]/g, '')) : null),
        hoaName: createDataField(row['32_hoa_name'] || ''),
        hoaIncludes: createDataField(row['33_hoa_includes'] || ''),
        annualTaxes: createDataField(row['35_annual_taxes'] ? parseFloat(row['35_annual_taxes'].toString().replace(/[^0-9.]/g, '')) : null),
        taxYear: createDataField(row['36_tax_year'] ? parseInt(row['36_tax_year']) : new Date().getFullYear()),
        assessedValue: createDataField(row['15_assessed_value'] ? parseFloat(row['15_assessed_value'].toString().replace(/[^0-9.]/g, '')) : null),
        marketValueEstimate: createDataField(row['12_market_value_estimate'] ? parseFloat(row['12_market_value_estimate'].toString().replace(/[^0-9.]/g, '')) : null),
        lastSaleDate: createDataField(row['13_last_sale_date'] || ''),
        lastSalePrice: createDataField(row['14_last_sale_price'] ? parseFloat(row['14_last_sale_price'].toString().replace(/[^0-9.]/g, '')) : null),
        ownershipType: createDataField(row['34_ownership_type'] || ''),
        parcelId: createDataField(row['9_parcel_id'] || ''),
      },
      structural: {
        roofType: createDataField(row['39_roof_type'] || ''),
        roofAgeEst: createDataField(row['40_roof_age_est'] || ''),
        exteriorMaterial: createDataField(row['41_exterior_material'] || ''),
        foundation: createDataField(row['42_foundation'] || ''),
        hvacType: createDataField(row['45_hvac_type'] || ''),
        hvacAge: createDataField(row['46_hvac_age'] || ''),
        waterHeaterType: createDataField(row['43_water_heater_type'] || ''),
        garageType: createDataField(row['44_garage_type'] || ''),
        flooringType: createDataField(row['49_flooring_type'] || ''),
        kitchenFeatures: createDataField(row['50_kitchen_features'] || ''),
        appliancesIncluded: createDataField(row['51_appliances_included'] ? row['51_appliances_included'].split(',').map((s: string) => s.trim()) : []),
        laundryType: createDataField(row['47_laundry_type'] || ''),
        fireplaceYn: createDataField(row['52_fireplace_yn'] === 'true' || row['52_fireplace_yn'] === 'yes' || row['52_fireplace_yn'] === true),
        fireplaceCount: createDataField(row['53_fireplace_count'] ? parseInt(row['53_fireplace_count']) : null),
        poolYn: createDataField(row['54_pool_yn'] === 'true' || row['54_pool_yn'] === 'yes' || row['54_pool_yn'] === true),
        poolType: createDataField(row['55_pool_type'] || ''),
        deckPatio: createDataField(row['56_deck_patio'] || ''),
        fence: createDataField(row['57_fence'] || ''),
        landscaping: createDataField(row['58_landscaping'] || ''),
        recentRenovations: createDataField(row['59_recent_renovations'] || ''),
        permitHistoryRoof: createDataField(row['60_permit_history_roof'] || ''),
        permitHistoryHvac: createDataField(row['61_permit_history_hvac'] || ''),
        permitHistoryPoolAdditions: createDataField(row['62_permit_history_other'] || ''),
        interiorCondition: createDataField(row['48_interior_condition'] || ''),
      },
      location: {
        // Schools (fields 63-73)
        assignedElementary: createDataField(row['65_elementary_school'] || ''),
        elementaryRating: createDataField(row['66_elementary_rating'] || ''),
        elementaryDistanceMiles: createDataField(row['67_elementary_distance_mi'] ? parseFloat(row['67_elementary_distance_mi']) : null),
        assignedMiddle: createDataField(row['68_middle_school'] || ''),
        middleRating: createDataField(row['69_middle_rating'] || ''),
        middleDistanceMiles: createDataField(row['70_middle_distance_mi'] ? parseFloat(row['70_middle_distance_mi']) : null),
        assignedHigh: createDataField(row['71_high_school'] || ''),
        highRating: createDataField(row['72_high_rating'] || ''),
        highDistanceMiles: createDataField(row['73_high_distance_mi'] ? parseFloat(row['73_high_distance_mi']) : null),
        schoolDistrictName: createDataField(row['63_school_district'] || ''),
        elevationFeet: createDataField(row['64_elevation_feet'] ? parseFloat(row['64_elevation_feet']) : null),
        // Location Scores (fields 74-82)
        walkScore: createDataField(row['74_walk_score'] ? parseInt(row['74_walk_score']) : null),
        transitScore: createDataField(row['75_transit_score'] ? parseInt(row['75_transit_score']) : null),
        bikeScore: createDataField(row['76_bike_score'] ? parseInt(row['76_bike_score']) : null),
        // Distances & Amenities (fields 83-87)
        distanceGroceryMiles: createDataField(row['83_distance_grocery_mi'] ? parseFloat(row['83_distance_grocery_mi']) : null),
        distanceHospitalMiles: createDataField(row['84_distance_hospital_mi'] ? parseFloat(row['84_distance_hospital_mi']) : null),
        distanceAirportMiles: createDataField(row['85_distance_airport_mi'] ? parseFloat(row['85_distance_airport_mi']) : null),
        distanceParkMiles: createDataField(row['86_distance_park_mi'] ? parseFloat(row['86_distance_park_mi']) : null),
        distanceBeachMiles: createDataField(row['87_distance_beach_mi'] ? parseFloat(row['87_distance_beach_mi']) : null),
        // Safety & Crime (fields 88-90)
        crimeIndexViolent: createDataField(row['88_violent_crime_index'] || ''),
        crimeIndexProperty: createDataField(row['89_property_crime_index'] || ''),
        neighborhoodSafetyRating: createDataField(row['90_neighborhood_safety_rating'] || ''),
        noiseLevel: createDataField(row['78_noise_level'] || ''),
        trafficLevel: createDataField(row['79_traffic_level'] || ''),
        walkabilityDescription: createDataField(row['80_walkability_description'] || ''),
        commuteTimeCityCenter: createDataField(row['82_commute_to_city_center'] || ''),
        publicTransitAccess: createDataField(row['81_public_transit_access'] || ''),
      },
      financial: {
        // Market & Investment Data (fields 91-103)
        annualPropertyTax: createDataField(row['35_annual_taxes'] ? parseFloat(row['35_annual_taxes'].toString().replace(/[^0-9.]/g, '')) : null),
        taxExemptions: createDataField(row['38_tax_exemptions'] || ''),
        propertyTaxRate: createDataField(row['37_property_tax_rate'] ? parseFloat(row['37_property_tax_rate']) : null),
        recentTaxPaymentHistory: createDataField(''),
        medianHomePriceNeighborhood: createDataField(row['91_median_home_price_neighborhood'] ? parseFloat(row['91_median_home_price_neighborhood'].toString().replace(/[^0-9.]/g, '')) : null),
        pricePerSqftRecentAvg: createDataField(row['92_price_per_sqft_recent_avg'] ? parseFloat(row['92_price_per_sqft_recent_avg'].toString().replace(/[^0-9.]/g, '')) : null),
        redfinEstimate: createDataField(row['16_redfin_estimate'] ? parseFloat(row['16_redfin_estimate'].toString().replace(/[^0-9.]/g, '')) : null),
        priceToRentRatio: createDataField(row['93_price_to_rent_ratio'] ? parseFloat(row['93_price_to_rent_ratio']) : null),
        priceVsMedianPercent: createDataField(row['94_price_vs_median_percent'] ? parseFloat(row['94_price_vs_median_percent']) : null),
        daysOnMarketAvg: createDataField(row['95_days_on_market_avg'] ? parseFloat(row['95_days_on_market_avg']) : null),
        inventorySurplus: createDataField(row['96_inventory_surplus'] || ''),
        rentalEstimateMonthly: createDataField(row['98_rental_estimate_monthly'] ? parseFloat(row['98_rental_estimate_monthly'].toString().replace(/[^0-9.]/g, '')) : null),
        rentalYieldEst: createDataField(row['99_rental_yield_est'] ? parseFloat(row['99_rental_yield_est']) : null),
        vacancyRateNeighborhood: createDataField(row['100_vacancy_rate_neighborhood'] ? parseFloat(row['100_vacancy_rate_neighborhood']) : null),
        capRateEst: createDataField(row['101_cap_rate_est'] ? parseFloat(row['101_cap_rate_est']) : null),
        insuranceEstAnnual: createDataField(row['97_insurance_est_annual'] ? parseFloat(row['97_insurance_est_annual'].toString().replace(/[^0-9.]/g, '')) : null),
        financingTerms: createDataField(row['102_financing_terms'] || ''),
        comparableSalesLast3: createDataField(row['103_comparable_sales'] ? [row['103_comparable_sales']] : []),
        specialAssessments: createDataField(row['138_special_assessments'] || ''),
      },
      utilities: {
        // Utilities & Connectivity (fields 104-116)
        electricProvider: createDataField(row['104_electric_provider'] || ''),
        waterProvider: createDataField(row['106_water_provider'] || ''),
        sewerProvider: createDataField(row['108_sewer_provider'] || ''),
        naturalGas: createDataField(row['109_natural_gas'] || ''),
        trashProvider: createDataField(row['110_trash_provider'] || ''),
        internetProvidersTop3: createDataField(row['111_internet_providers_top3'] ? row['111_internet_providers_top3'].split(',').map((s: string) => s.trim()) : []),
        maxInternetSpeed: createDataField(row['112_max_internet_speed'] || ''),
        fiberAvailable: createDataField(row['113_fiber_available'] === 'true' || row['113_fiber_available'] === 'yes' || row['113_fiber_available'] === true),
        cableTvProvider: createDataField(row['114_cable_tv_provider'] || ''),
        avgElectricBill: createDataField(row['105_avg_electric_bill'] || ''),
        avgWaterBill: createDataField(row['107_avg_water_bill'] || ''),
        cellCoverageQuality: createDataField(row['115_cell_coverage_quality'] || ''),
        emergencyServicesDistance: createDataField(row['116_emergency_services_distance'] || ''),
        // Environment & Risk (fields 117-130)
        airQualityIndexCurrent: createDataField(row['117_air_quality_index'] || ''),
        airQualityGrade: createDataField(row['118_air_quality_grade'] || ''),
        floodZone: createDataField(row['119_flood_zone'] || ''),
        floodRiskLevel: createDataField(row['120_flood_risk_level'] || ''),
        climateRiskWildfireFlood: createDataField(row['121_climate_risk'] || ''),
        wildfireRisk: createDataField(row['122_wildfire_risk'] || ''),
        earthquakeRisk: createDataField(row['123_earthquake_risk'] || ''),
        hurricaneRisk: createDataField(row['124_hurricane_risk'] || ''),
        tornadoRisk: createDataField(row['125_tornado_risk'] || ''),
        radonRisk: createDataField(row['126_radon_risk'] || ''),
        superfundNearby: createDataField(row['127_superfund_site_nearby'] === 'true' || row['127_superfund_site_nearby'] === 'yes' || row['127_superfund_site_nearby'] === true),
        seaLevelRiseRisk: createDataField(row['128_sea_level_rise_risk'] || ''),
        noiseLevelDbEst: createDataField(row['129_noise_level_db_est'] || ''),
        solarPotential: createDataField(row['130_solar_potential'] || ''),
        // Additional Features (fields 131-138)
        evChargingYn: createDataField(row['133_ev_charging'] || ''),
        smartHomeFeatures: createDataField(row['134_smart_home_features'] || ''),
        accessibilityMods: createDataField(row['135_accessibility_modifications'] || ''),
        viewType: createDataField(row['131_view_type'] || ''),
        lotFeatures: createDataField(row['132_lot_features'] || ''),
        petPolicy: createDataField(row['136_pet_policy'] || ''),
        ageRestrictions: createDataField(row['137_age_restrictions'] || ''),
        notesConfidenceSummary: createDataField(''),
      },
    };
  };

  const handleCsvImport = async () => {
    if (csvData.length === 0) {
      alert('No data to import');
      return;
    }

    setStatus('scraping');
    setProgress(10);

    try {
      let imported = 0;
      const propertyCards: PropertyCard[] = [];
      const fullProperties: Property[] = [];

      // Process each CSV row
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];

        // Generate ID for this property
        const propertyId = generateId();

        // Try to extract address from 138-field format or standard format
        const address = row['1_full_address'] || row['address'] || row['Address'] || '';
        const city = row['city'] || row['City'] || '';
        const state = row['state'] || row['State'] || 'FL';
        const zip = row['zip'] || row['ZIP'] || '';

        // Extract price (field 10 = listing_price per fields-schema.ts)
        const listingPrice = row['10_listing_price'] || row['14_last_sale_price'] || row['price'] || row['Price'] || '0';
        const price = parseInt(String(listingPrice).replace(/[^0-9]/g, '')) || 0;

        // Extract bedrooms/bathrooms (field 17 = bedrooms, field 20 = total_bathrooms)
        const bedrooms = parseInt(row['17_bedrooms'] || row['bedrooms'] || row['Bedrooms'] || '0');
        const bathrooms = parseFloat(row['20_total_bathrooms'] || row['bathrooms'] || row['Bathrooms'] || '0');

        // Extract sqft (field 21 = living_sqft)
        const sqft = parseInt(row['21_living_sqft'] || row['sqft'] || row['Sqft'] || '0');

        // Extract year built (field 25 = year_built)
        const yearBuilt = parseInt(row['25_year_built'] || row['yearBuilt'] || row['Year Built'] || new Date().getFullYear().toString());

        // Extract status
        const listingStatus = row['4_listing_status'] || row['status'] || row['Status'] || 'Active';

        // Count non-empty fields for data completeness
        const filledFieldsCount = Object.values(row).filter(v => v && v !== '').length;
        const dataCompleteness = Math.round((filledFieldsCount / 168) * 100);

        // Create full property with all 168 fields from CSV
        let fullProperty = convertCsvToFullProperty(row, propertyId);

        // ENRICHMENT: Call LLM APIs to fill missing fields if enabled
        if (enrichWithAI && address) {
          setStatus('enriching');
          setProgress(50 + (i / csvData.length) * 40); // 50-90% for enrichment

          console.log(`🤖 Enriching property ${i + 1}/${csvData.length} with AI:`, address);

          try {
            const apiUrl = import.meta.env.VITE_API_URL || '/api/property/search';
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address: address,
                engines: ['perplexity', 'grok', 'claude-opus', 'gpt', 'claude-sonnet', 'gemini'],
                useCascade: true,
              }),
            });

            if (response.ok) {
              const enrichData = await response.json();
              const enrichedFields = enrichData.fields || {};

              // Merge enriched data with CSV data (CSV takes precedence)
              fullProperty = mergePropertyData(fullProperty, enrichedFields, propertyId);

              // Update completion percentage
              const totalFields = Object.keys(enrichedFields).length;
              console.log(`✅ Enriched ${totalFields} fields for ${address}`);
            }
          } catch (error) {
            console.error(`❌ Failed to enrich ${address}:`, error);
          }
        }

        const propertyCard: PropertyCard = {
          id: propertyId,
          address,
          city,
          state,
          zip,
          price,
          pricePerSqft: sqft && price ? Math.round(price / sqft) : 0,
          bedrooms,
          bathrooms,
          sqft,
          yearBuilt,
          smartScore: Math.floor(Math.random() * 20) + 75,
          dataCompleteness,
          listingStatus: listingStatus as 'Active' | 'Pending' | 'Sold',
          daysOnMarket: 0,
        };

        if (propertyCard.address || propertyCard.price > 0) {
          propertyCards.push(propertyCard);
          fullProperties.push(fullProperty);
          imported++;
        }
      }

      setProgress(95);

      // Add all properties to the store at once
      if (propertyCards.length > 0) {
        console.log('✅ Adding to store:', propertyCards.length, 'properties');
        addProperties(propertyCards, fullProperties);
      }

      setProgress(100);
      setStatus('complete');
      alert(`Successfully imported ${imported} properties${enrichWithAI ? ' and enriched with AI' : ''}`);
      setCsvFile(null);
      setCsvData([]);

      // Navigate to property list
      setTimeout(() => navigate('/properties'), 1500);

    } catch (error) {
      console.error('CSV import error:', error);
      setStatus('error');
      alert(`Failed to import CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle PDF upload and parsing via API
  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setPdfError('Please upload a PDF file');
      return;
    }

    setPdfFile(file);
    setPdfParseStatus('uploading');
    setPdfError(null);
    setPdfParsedFields({});

    try {
      // Convert file to base64 for API transmission
      const reader = new FileReader();

      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;

        setPdfParseStatus('parsing');

        try {
          const apiUrl = import.meta.env.VITE_API_URL || '';
          const response = await fetch(`${apiUrl}/api/property/parse-mls-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pdfBase64: base64Data.split(',')[1], // Remove data:application/pdf;base64, prefix
              filename: file.name,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API Error: ${response.status}`);
          }

          const data = await response.json();

          if (data.fields && Object.keys(data.fields).length > 0) {
            setPdfParsedFields(data.fields);
            setPdfParseStatus('complete');
            console.log('📄 PDF parsed successfully:', Object.keys(data.fields).length, 'fields');
          } else {
            throw new Error('No fields extracted from PDF');
          }
        } catch (error) {
          console.error('PDF parse error:', error);
          setPdfParseStatus('error');
          setPdfError(error instanceof Error ? error.message : 'Failed to parse PDF');
        }
      };

      reader.onerror = () => {
        setPdfParseStatus('error');
        setPdfError('Failed to read PDF file');
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('PDF upload error:', error);
      setPdfParseStatus('error');
      setPdfError(error instanceof Error ? error.message : 'Failed to upload PDF');
    }
  };

  // Helper to get field value with multiple fallback keys
  const getFieldValue = (fields: Record<string, any>, ...keys: string[]): any => {
    for (const key of keys) {
      const val = fields[key]?.value;
      if (val !== null && val !== undefined && val !== '' && val !== 'N/A') {
        return val;
      }
    }
    return null;
  };

  // Import parsed PDF data as a property
  const handlePdfImport = async () => {
    if (Object.keys(pdfParsedFields).length === 0) {
      alert('No data to import. Please upload and parse a PDF first.');
      return;
    }

    setStatus('scraping');
    setProgress(50);

    try {
      const propertyId = generateId();

      // Extract address from parsed fields with comprehensive fallbacks
      // Stellar MLS uses "Address" directly in header, mapped to "1_full_address" or "address"
      const fullAddress = getFieldValue(pdfParsedFields,
        '1_full_address', 'full_address', 'address', 'property_address', 'street_address'
      ) || '';

      // Parse address components from full address string
      // Format: "3200 GULF BLVD, #203, ST PETE BEACH, FL 33706"
      const addressParts = fullAddress.split(',').map((s: string) => s.trim());
      const street = addressParts[0] || '';
      const unit = addressParts[1] && addressParts[1].startsWith('#') ? addressParts[1] : '';
      const cityPart = unit ? addressParts[2] : addressParts[1];
      const stateZipPart = unit ? addressParts[3] : addressParts[2];

      // Extract city (fallback to parsed fields)
      const city = cityPart || getFieldValue(pdfParsedFields, 'city') || '';

      // Extract state and zip from "FL 33706" format
      const stateMatch = stateZipPart?.match(/([A-Z]{2})/);
      const zipMatch = stateZipPart?.match(/(\d{5})/);
      const state = stateMatch?.[1] || getFieldValue(pdfParsedFields, 'state') || 'FL';
      const zip = zipMatch?.[1] || getFieldValue(pdfParsedFields, 'zip_code', 'zip', 'postal_code') || '';

      // Get price with fallbacks (Stellar MLS: "List Price" -> "7_listing_price")
      // UPDATED: 2025-11-30 - Corrected field numbers to match fields-schema.ts
      const priceRaw = getFieldValue(pdfParsedFields,
        '10_listing_price', 'listing_price', 'list_price', 'price', 'current_price'
      );
      const price = parseFloat(String(priceRaw || '0').replace(/[^0-9.]/g, '')) || 0;

      // Get price per sqft (Stellar MLS: "LP/SqFt" -> "11_price_per_sqft")
      const pricePerSqftRaw = getFieldValue(pdfParsedFields,
        '11_price_per_sqft', 'price_per_sqft', 'lp/sqft', 'lpsqft'
      );
      const pricePerSqft = parseFloat(String(pricePerSqftRaw || '0').replace(/[^0-9.]/g, '')) || 0;

      // Get bedrooms (Stellar MLS: "Beds" -> "17_bedrooms")
      const bedsRaw = getFieldValue(pdfParsedFields,
        '17_bedrooms', 'bedrooms', 'beds', 'br'
      );
      const bedrooms = parseInt(String(bedsRaw || '0')) || 0;

      // Get bathrooms (Stellar MLS: "Baths: 2/0" format - need to parse)
      // The "2/0" means 2 full baths, 0 half baths
      const bathsRaw = getFieldValue(pdfParsedFields,
        '20_total_bathrooms', 'total_bathrooms', 'baths', 'bathrooms'
      );
      let bathrooms = 0;
      if (typeof bathsRaw === 'string' && bathsRaw.includes('/')) {
        // Parse "2/0" format
        const [full, half] = bathsRaw.split('/').map(n => parseInt(n) || 0);
        bathrooms = full + (half * 0.5);
      } else {
        bathrooms = parseFloat(String(bathsRaw || '0')) || 0;
      }

      // Get square footage (Stellar MLS: "Heated Area" -> "21_living_sqft")
      const sqftRaw = getFieldValue(pdfParsedFields,
        '21_living_sqft', 'living_sqft', 'heated_area', 'living_area', 'sqft', 'square_feet'
      );
      const sqft = parseInt(String(sqftRaw || '0').replace(/[^0-9]/g, '')) || 0;

      // Get year built (Stellar MLS: "Year Built" -> "25_year_built")
      const yearRaw = getFieldValue(pdfParsedFields,
        '25_year_built', 'year_built', 'built', 'year'
      );
      const yearBuilt = parseInt(String(yearRaw || new Date().getFullYear())) || new Date().getFullYear();

      // Get listing status (Stellar MLS: "Status" -> "4_listing_status")
      const statusRaw = getFieldValue(pdfParsedFields,
        '4_listing_status', 'listing_status', 'status'
      );
      const listingStatus = (statusRaw || 'Active') as 'Active' | 'Pending' | 'Sold';

      // Get days on market (Stellar MLS: "ADOM" or "CDOM" -> "95_days_on_market_avg")
      const domRaw = getFieldValue(pdfParsedFields,
        '95_days_on_market_avg', 'days_on_market', 'adom', 'cdom', 'dom'
      );
      const daysOnMarket = parseInt(String(domRaw || '0')) || 0;

      // Create property card
      const propertyCard: PropertyCard = {
        id: propertyId,
        address: unit ? `${street}, ${unit}` : street || fullAddress,
        city: city,
        state: state,
        zip: zip,
        price: price,
        pricePerSqft: pricePerSqft,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        sqft: sqft,
        yearBuilt: yearBuilt,
        smartScore: 85,
        dataCompleteness: Math.round((Object.keys(pdfParsedFields).length / 168) * 100),
        listingStatus: listingStatus,
        daysOnMarket: daysOnMarket,
      };

      setProgress(75);

      // Create full property using normalizer
      const fullProperty = normalizeToProperty(pdfParsedFields, propertyId, {}, []);

      setProgress(90);

      // Add to store
      addProperty(propertyCard, fullProperty);
      setLastAddedId(propertyId);
      setStatus('complete');
      setProgress(100);

      console.log('✅ Property added from MLS PDF:', Object.keys(pdfParsedFields).length, 'fields');
      console.log('📋 Property Card:', propertyCard);

      // Reset PDF state
      setPdfFile(null);
      setPdfParsedFields({});
      setPdfParseStatus('idle');

    } catch (error) {
      console.error('PDF import error:', error);
      setStatus('error');
      alert(`Failed to import PDF data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Merge enriched API data with existing CSV data (CSV takes precedence)
  // UPDATED: 2025-11-30 - Field numbers aligned with fields-schema.ts (SOURCE OF TRUTH)
  const mergePropertyData = (csvProperty: Property, apiFields: any, propertyId: string): Property => {
    // For each field, only fill if CSV value is null/empty
    const merged = { ...csvProperty };

    // Helper to merge if CSV field is empty
    const mergeField = (csvField: DataField<any>, apiFieldKey: string) => {
      if (!csvField.value && apiFields[apiFieldKey]?.value) {
        return createDataField(apiFields[apiFieldKey].value, 'Medium');
      }
      return csvField;
    };

    // Merge address fields (1-9)
    merged.address.mlsPrimary = mergeField(merged.address.mlsPrimary, '2_mls_primary');
    merged.address.county = mergeField(merged.address.county, '7_county');
    merged.address.latitude = mergeField(merged.address.latitude, 'coordinates');
    merged.address.longitude = mergeField(merged.address.longitude, 'coordinates');

    // Merge location fields (74-82)
    merged.location.walkScore = mergeField(merged.location.walkScore, '74_walk_score');
    merged.location.transitScore = mergeField(merged.location.transitScore, '75_transit_score');

    // Merge environment fields (117-130)
    merged.utilities.floodZone = mergeField(merged.utilities.floodZone, '119_flood_zone');

    // Could merge all 168 fields here, but for now just key ones
    return merged;
  };

  return (
    <motion.div
      className="px-4 py-6 md:px-8 md:py-10 max-w-2xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-gradient-quantum mb-2">
          Add Property
        </h1>
        <p className="text-gray-400">
          AI-powered extraction or manual entry
        </p>
      </div>

      {/* Input Mode Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-white/10 mb-6">
        <button
          onClick={() => setInputMode('manual')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            inputMode === 'manual'
              ? 'bg-quantum-cyan/20 text-quantum-cyan'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <PenLine className="w-4 h-4" />
          Manual
        </button>
        <button
          onClick={() => setInputMode('address')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            inputMode === 'address'
              ? 'bg-quantum-cyan/20 text-quantum-cyan'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          Address
        </button>
        <button
          onClick={() => setInputMode('url')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            inputMode === 'url'
              ? 'bg-quantum-cyan/20 text-quantum-cyan'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          URL
        </button>
        <button
          onClick={() => setInputMode('csv')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            inputMode === 'csv'
              ? 'bg-quantum-cyan/20 text-quantum-cyan'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          CSV
        </button>
        <button
          onClick={() => setInputMode('pdf')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            inputMode === 'pdf'
              ? 'bg-quantum-cyan/20 text-quantum-cyan'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          MLS PDF
        </button>
        <button
          onClick={() => setInputMode('text')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            inputMode === 'text'
              ? 'bg-quantum-cyan/20 text-quantum-cyan'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Text
        </button>
      </div>

      {/* Input Form */}
      <div className="glass-card p-6 mb-6">
        {inputMode === 'csv' ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Upload className="w-16 h-16 mx-auto mb-4 text-quantum-cyan" />
              <h3 className="text-lg font-semibold mb-2">Upload Property CSV</h3>
              <p className="text-sm text-gray-400 mb-6">
                Import multiple properties at once. CSV should include: address, city, state, zip, price, bedrooms, bathrooms, sqft
              </p>

              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="btn-quantum inline-flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-5 h-5" />
                Choose CSV File
              </label>
            </div>

            {csvFile && (
              <div className="border border-quantum-cyan/20 rounded-xl p-4 bg-quantum-cyan/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold">{csvFile.name}</p>
                    <p className="text-sm text-gray-400">{csvData.length} properties found</p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-quantum-cyan" />
                </div>

                {csvData.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">Preview (first 3 properties):</p>
                    <div className="bg-black/30 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                      {csvData.slice(0, 3).map((row, i) => {
                        const address = row['1_full_address'] || row['address'] || row['Address'] || 'No address';
                        const city = row['city'] || row['City'] || '';
                        const state = row['state'] || row['State'] || '';
                        const priceRaw = row['10_listing_price'] || row['price'] || row['Price'] || '0';
                        const price = parseInt(String(priceRaw).replace(/[^0-9]/g, '')) || 0;
                        const fieldCount = Object.values(row).filter(v => v && v !== '').length;

                        return (
                          <div key={i} className="mb-2">
                            {address} - {city}{city && state ? ', ' : ''}{state} - ${price.toLocaleString()} ({fieldCount} fields)
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* AI Enrichment Option - OPTIONAL */}
                <div className="mt-6 p-4 bg-quantum-cyan/5 border border-quantum-cyan/20 rounded-xl">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enrichWithAI}
                      onChange={(e) => setEnrichWithAI(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600 text-quantum-cyan focus:ring-quantum-cyan"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-quantum-cyan" />
                        <span className="text-white font-semibold">Enhance with AI (Optional)</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Cascade: 👑 Opus → GPT → Grok → Sonnet → Copilot → Gemini (stops at 100%)
                      </p>
                    </div>
                  </label>

                  {/* Show LLM selector when AI enrichment is enabled */}
                  {enrichWithAI && (
                    <div className="mt-4 pt-4 border-t border-quantum-cyan/20">
                      <label className="block text-xs text-gray-400 mb-2">Select Engine</label>
                      <div className="grid grid-cols-4 gap-2">
                        {LLM_ENGINES.slice(0, 4).map((engine) => (
                          <button
                            key={engine.id}
                            onClick={() => setSelectedEngine(engine.id)}
                            className={`p-2 rounded-lg border text-xs transition-colors ${
                              engine.id === selectedEngine
                                ? 'border-quantum-cyan bg-quantum-cyan/10 text-quantum-cyan'
                                : 'border-white/10 text-gray-400 hover:border-white/20'
                            }`}
                          >
                            {engine.icon} {engine.label.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCsvImport}
                  disabled={status === 'scraping' || status === 'enriching'}
                  className="btn-quantum w-full mt-4"
                >
                  {status === 'scraping' || status === 'enriching' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {enrichWithAI ? 'Enriching with AI...' : 'Importing...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Import {csvData.length} Properties {enrichWithAI && '+ AI Enrich'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : inputMode === 'pdf' ? (
          /* PDF MLS Upload Section */
          <div className="space-y-4">
            <div className="text-center py-8">
              <FileText className="w-16 h-16 mx-auto mb-4 text-quantum-cyan" />
              <h3 className="text-lg font-semibold mb-2">Upload MLS PDF Sheet</h3>
              <p className="text-sm text-gray-400 mb-6">
                Upload a Stellar MLS CustomerFull PDF to extract all 168 property fields automatically
              </p>

              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="btn-quantum inline-flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-5 h-5" />
                Choose MLS PDF File
              </label>
            </div>

            {/* PDF Upload Status */}
            {pdfParseStatus !== 'idle' && (
              <div className="border border-quantum-cyan/20 rounded-xl p-4 bg-quantum-cyan/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold">{pdfFile?.name}</p>
                    <p className="text-sm text-gray-400">
                      {pdfParseStatus === 'uploading' && 'Uploading PDF...'}
                      {pdfParseStatus === 'parsing' && 'Parsing with AI (Claude)...'}
                      {pdfParseStatus === 'complete' && `${Object.keys(pdfParsedFields).length} fields extracted`}
                      {pdfParseStatus === 'error' && 'Error parsing PDF'}
                    </p>
                  </div>
                  {pdfParseStatus === 'complete' ? (
                    <CheckCircle className="w-6 h-6 text-quantum-cyan" />
                  ) : pdfParseStatus === 'error' ? (
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  ) : (
                    <Loader2 className="w-6 h-6 text-quantum-cyan animate-spin" />
                  )}
                </div>

                {/* Error message */}
                {pdfError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">{pdfError}</p>
                  </div>
                )}

                {/* Parsed fields preview */}
                {pdfParseStatus === 'complete' && Object.keys(pdfParsedFields).length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">Preview (first 10 fields):</p>
                    <div className="bg-black/30 rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto">
                      {Object.entries(pdfParsedFields).slice(0, 10).map(([key, field]: [string, any]) => (
                        <div key={key} className="mb-1 flex justify-between">
                          <span className="text-quantum-cyan">{key}:</span>
                          <span className="text-white ml-2 truncate max-w-[200px]">{String(field?.value || field).slice(0, 50)}</span>
                        </div>
                      ))}
                      {Object.keys(pdfParsedFields).length > 10 && (
                        <div className="text-gray-500 mt-2">... and {Object.keys(pdfParsedFields).length - 10} more fields</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Import button */}
                {pdfParseStatus === 'complete' && (
                  <button
                    onClick={handlePdfImport}
                    disabled={status === 'scraping'}
                    className="btn-quantum w-full"
                  >
                    {status === 'scraping' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Import {Object.keys(pdfParsedFields).length} Fields as Property
                      </>
                    )}
                  </button>
                )}

                {/* Retry button on error */}
                {pdfParseStatus === 'error' && (
                  <div className="flex gap-2">
                    <label
                      htmlFor="pdf-upload"
                      className="btn-glass flex-1 text-center cursor-pointer"
                    >
                      Try Another PDF
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Info about supported PDFs */}
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>Supported: Stellar MLS CustomerFull PDFs</p>
              <p>Extracts: Address, Price, Beds/Baths, Sqft, HOA, Schools, Waterfront, and 160+ more fields</p>
            </div>
          </div>
        ) : inputMode === 'manual' ? (
          <div className="space-y-4">
            {/* Coverage Progress Bar */}
            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Data Coverage</span>
                <span className="text-sm font-semibold text-quantum-cyan">
                  {filledFieldsCount} / {totalFieldsCount} fields ({completionPercentage}%)
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-quantum-cyan to-quantum-green transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setExpandedGroups(new Set(UI_FIELD_GROUPS.map(g => g.id)))}
                className="text-xs px-3 py-1.5 rounded-lg bg-quantum-cyan/10 text-quantum-cyan hover:bg-quantum-cyan/20 transition-colors"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={() => setExpandedGroups(new Set())}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-700/50 text-gray-400 hover:bg-gray-700 transition-colors"
              >
                Collapse All
              </button>
            </div>

            {/* Collapsible Field Groups */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {UI_FIELD_GROUPS.map((group) => {
                const groupFields = ALL_FIELDS.filter(f => group.fields.includes(f.num));
                const filledInGroup = groupFields.filter(f => manualFormFields[f.key] !== '').length;
                const isExpanded = expandedGroups.has(group.id);
                
                return (
                  <div key={group.id} className="border border-white/10 rounded-xl overflow-hidden">
                    {/* Group Header */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className="w-full flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-quantum-cyan" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="text-sm font-semibold text-white">{group.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-400">
                          {filledInGroup}/{groupFields.length}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Fields {group.fields[0]}-{group.fields[group.fields.length - 1]}
                      </span>
                    </button>
                    
                    {/* Group Fields */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {groupFields.map((field) => (
                              <div key={field.key}>
                                <label className="block text-xs text-gray-400 mb-1">
                                  {field.label}
                                  {field.required && <span className="text-quantum-cyan ml-1">*</span>}
                                  {field.calculated && <span className="text-gray-600 ml-1">(auto)</span>}
                                </label>
                                {renderFieldInput(field)}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Legacy Address Autocomplete (hidden, used for API compatibility) */}
            <input type="hidden" value={manualForm.address} />
            <input type="hidden" value={manualForm.city} />
            <input type="hidden" value={manualForm.state} />

            <button
              onClick={handleManualSubmit}
              disabled={status !== 'idle' && status !== 'complete' && status !== 'error'}
              className="btn-quantum w-full mt-4"
            >
              {status === 'idle' || status === 'complete' || status === 'error' ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  Save Property ({filledFieldsCount} fields)
                </>
              ) : (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving Property Data...
                </>
              )}
            </button>
          </div>
        ) : inputMode === 'address' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Property Address
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="280 41st Ave, St Pete Beach, FL 33706"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-glass pl-12"
                />
              </div>
            </div>

            {/* LLM Selection - Cascade Order per Reliability Audit */}
            <div className="mt-6">
              <label className="block text-sm text-gray-400 mb-2">
                AI Engine <span className="text-quantum-cyan text-xs">(Reliability Order)</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Cascade: Perplexity → Grok → Claude Opus → GPT → Claude Sonnet → Gemini
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {LLM_ENGINES.map((engine) => (
                  <button
                    key={engine.id}
                    onClick={() => setSelectedEngine(engine.id)}
                    className={`p-2 rounded-xl border transition-colors text-left ${
                      engine.id === selectedEngine
                        ? 'border-quantum-cyan bg-quantum-cyan/10 text-quantum-cyan'
                        : 'border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <span className="text-sm font-semibold block">{engine.icon} {engine.label}</span>
                    <span className="text-xs opacity-60">{engine.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleScrape}
              disabled={status !== 'idle' && status !== 'complete' && status !== 'error'}
              className="btn-quantum w-full mt-6"
            >
              {status === 'idle' || status === 'complete' || status === 'error' ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  Extract Property Data
                </>
              ) : (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              )}
            </button>
          </div>
        ) : inputMode === 'url' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Listing URL
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="url"
                  placeholder="https://www.zillow.com/homedetails/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="input-glass pl-12"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Uses AI to analyze listing pages and extract property data
            </p>

            {/* LLM Selection - Cascade Order per Reliability Audit */}
            <div className="mt-6">
              <label className="block text-sm text-gray-400 mb-2">
                AI Engine <span className="text-quantum-cyan text-xs">(Reliability Order)</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Cascade: Perplexity → Grok → Claude Opus → GPT → Claude Sonnet → Gemini
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {LLM_ENGINES.map((engine) => (
                  <button
                    key={engine.id}
                    onClick={() => setSelectedEngine(engine.id)}
                    className={`p-2 rounded-xl border transition-colors text-left ${
                      engine.id === selectedEngine
                        ? 'border-quantum-cyan bg-quantum-cyan/10 text-quantum-cyan'
                        : 'border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <span className="text-sm font-semibold block">{engine.icon} {engine.label}</span>
                    <span className="text-xs opacity-60">{engine.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleScrape}
              disabled={status !== 'idle' && status !== 'complete' && status !== 'error'}
              className="btn-quantum w-full mt-6"
            >
              {status === 'idle' || status === 'complete' || status === 'error' ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  Extract Property Data
                </>
              ) : (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Property Description / Paragraph
              </label>
              <textarea
                placeholder="Paste property description here... Example:

Beautiful 3BR/2BA beach house at 290 41st Ave, St Pete Beach, FL 33706. Built in 1958, 1,426 sqft living space on a 7,200 sqft lot. Listed at $549,000 ($385/sqft). Walk to beach, hurricane risk extreme, flood zone AE. Assigned schools: Azalea Elementary (8/10), Azalea Middle (7/10), SPHS (9/10)..."
                value={propertyText}
                onChange={(e) => setPropertyText(e.target.value)}
                className="input-glass min-h-[200px] resize-y"
              />
            </div>
            <p className="text-xs text-gray-500">
              AI will extract all 138 property fields from your description
            </p>

            {/* LLM Selection - Cascade Order per Reliability Audit */}
            <div className="mt-6">
              <label className="block text-sm text-gray-400 mb-2">
                AI Engine <span className="text-quantum-cyan text-xs">(Reliability Order)</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Cascade: Perplexity → Grok → Claude Opus → GPT → Claude Sonnet → Gemini
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {LLM_ENGINES.map((engine) => (
                  <button
                    key={engine.id}
                    onClick={() => setSelectedEngine(engine.id)}
                    className={`p-2 rounded-xl border transition-colors text-left ${
                      engine.id === selectedEngine
                        ? 'border-quantum-cyan bg-quantum-cyan/10 text-quantum-cyan'
                        : 'border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <span className="text-sm font-semibold block">{engine.icon} {engine.label}</span>
                    <span className="text-xs opacity-60">{engine.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleScrape}
              disabled={status !== 'idle' && status !== 'complete' && status !== 'error'}
              className="btn-quantum w-full mt-6"
            >
              {status === 'idle' || status === 'complete' || status === 'error' ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  Parse with AI
                </>
              ) : (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Progress Display - for scraping modes including manual */}
      {status !== 'idle' && inputMode !== 'csv' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-5d p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-white">
              {getStatusMessage()}
            </span>
            {status === 'complete' ? (
              <CheckCircle className="w-6 h-6 text-quantum-green" />
            ) : status === 'error' ? (
              <AlertCircle className="w-6 h-6 text-quantum-red" />
            ) : (
              <Loader2 className="w-6 h-6 text-quantum-cyan animate-spin" />
            )}
          </div>

          <div className="progress-quantum h-2 mb-4">
            <motion.div
              className="progress-quantum-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Real-time API Status */}
          <div className="space-y-2">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Data Sources</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {cascadeStatus.map((source) => (
                <div
                  key={source.llm}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                    source.status === 'complete' ? 'bg-quantum-green/10 border border-quantum-green/30' :
                    source.status === 'running' || source.status === 'searching' as any ? 'bg-quantum-cyan/10 border border-quantum-cyan/30' :
                    source.status === 'error' ? 'bg-red-500/10 border border-red-500/30' :
                    'bg-white/5 border border-white/10'
                  }`}
                >
                  {source.status === 'complete' ? (
                    <CheckCircle className="w-3 h-3 text-quantum-green flex-shrink-0" />
                  ) : source.status === 'running' || source.status === 'searching' as any ? (
                    <Loader2 className="w-3 h-3 text-quantum-cyan animate-spin flex-shrink-0" />
                  ) : source.status === 'error' ? (
                    <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-gray-600 flex-shrink-0" />
                  )}
                  <span className={`truncate ${
                    source.status === 'complete' ? 'text-quantum-green' :
                    source.status === 'running' || source.status === 'searching' as any ? 'text-quantum-cyan' :
                    source.status === 'error' ? 'text-red-400' :
                    'text-gray-500'
                  }`}>
                    {source.llm}
                  </span>
                  {source.fieldsFound !== undefined && source.fieldsFound > 0 && (
                    <span className="text-quantum-green text-[10px] ml-auto">+{source.fieldsFound}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {progress}% complete ({totalFieldsFound || Math.round(progress * 1.38)} of 138 fields)
            </div>
          </div>

          {status === 'complete' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 pt-4 border-t border-white/10"
            >
              <div className="flex gap-4">
                <button
                  onClick={() => lastAddedId && navigate(`/property/${lastAddedId}`)}
                  className="btn-quantum flex-1"
                >
                  View Property
                </button>
                <button
                  onClick={resetForm}
                  className="btn-glass flex-1"
                >
                  Add Another
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Success message for all modes */}
      {status === 'complete' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-5d p-6"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-quantum-green" />
            <span className="font-semibold text-white text-lg">
              Property Added Successfully!
            </span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => lastAddedId && navigate(`/property/${lastAddedId}`)}
              className="btn-quantum flex-1"
            >
              View Property
            </button>
            <button
              onClick={resetForm}
              className="btn-glass flex-1"
            >
              Add Another
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
