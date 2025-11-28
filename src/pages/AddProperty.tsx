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
} from 'lucide-react';
import { usePropertyStore } from '@/store/propertyStore';
import type { PropertyCard, Property, DataField } from '@/types/property';
import { LLM_CASCADE_ORDER, LLM_DISPLAY_NAMES } from '@/lib/llm-constants';
import { normalizeToProperty } from '@/lib/field-normalizer';
import { initializeCascadeStatus, getSourceName } from '@/lib/data-sources';

// Autocomplete suggestion type
interface AddressSuggestion {
  description: string;
  placeId: string;
  mainText: string;
  secondaryText: string;
}

type ScrapeStatus = 'idle' | 'searching' | 'scraping' | 'enriching' | 'complete' | 'error';
type InputMode = 'address' | 'url' | 'manual' | 'csv' | 'text';

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
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [propertyText, setPropertyText] = useState('');
  const [enrichWithAI, setEnrichWithAI] = useState(false);
  const [cascadeStatus, setCascadeStatus] = useState<{llm: string; status: 'pending' | 'running' | 'complete' | 'error' | 'skipped'; fieldsFound?: number}[]>([]);

  // Manual entry form state
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
    if (!manualForm.address || !manualForm.city) {
      alert('Please fill in at least address and city');
      return;
    }

    // Construct full address for API search
    const fullAddress = `${manualForm.address}, ${manualForm.city}, ${manualForm.state}${manualForm.zip ? ' ' + manualForm.zip : ''}`;

    // Use startTransition for non-urgent UI updates to improve INP
    startTransition(() => {
      setStatus('searching');
      setProgress(0);
      setTotalFieldsFound(0);  // Reset field count for new search
      setCascadeStatus(initializeCascadeStatus());
    });

    // Allow browser to paint before heavy async work
    await new Promise(resolve => requestAnimationFrame(resolve));

    try {
      // Use SSE streaming for real-time progress
      const apiUrl = import.meta.env.VITE_API_URL || '';

      const response = await fetch(`${apiUrl}/api/property/search-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: fullAddress,
          engines: ['perplexity', 'grok', 'claude-opus', 'gpt', 'claude-sonnet', 'gemini'],
          skipLLMs: false,
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
        price: fields['7_listing_price']?.value || parseInt(manualForm.price) || 0,
        pricePerSqft: fields['8_price_per_sqft']?.value || (
          manualForm.sqft && manualForm.price
            ? Math.round(parseInt(manualForm.price) / parseInt(manualForm.sqft))
            : 0
        ),
        bedrooms: fields['12_bedrooms']?.value || parseInt(manualForm.bedrooms) || 0,
        bathrooms: fields['15_total_bathrooms']?.value || parseFloat(manualForm.bathrooms) || 0,
        sqft: fields['16_living_sqft']?.value || parseInt(manualForm.sqft) || 0,
        yearBuilt: fields['20_year_built']?.value || parseInt(manualForm.yearBuilt) || new Date().getFullYear(),
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

      // Reset form
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

    setStatus('searching');
    setProgress(10);

    try {
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
        price: parseNumber(getFieldValue(fields['7_listing_price'])),
        pricePerSqft: parseNumber(getFieldValue(fields['8_price_per_sqft'])),
        bedrooms: parseNumber(getFieldValue(fields['12_bedrooms'])),
        bathrooms: parseNumber(getFieldValue(fields['15_total_bathrooms'])),
        sqft: parseNumber(getFieldValue(fields['16_living_sqft'])),
        yearBuilt: parseNumber(getFieldValue(fields['20_year_built'])) || new Date().getFullYear(),
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

  // Convert CSV row with 138 fields to full Property object
  const convertCsvToFullProperty = (row: any, propertyId: string): Property => {
    const now = new Date().toISOString();

    return {
      id: propertyId,
      createdAt: now,
      updatedAt: now,
      address: {
        fullAddress: createDataField(row['1_full_address'] || ''),
        mlsPrimary: createDataField(row['2_mls_number_primary'] || ''),
        mlsSecondary: createDataField(row['3_mls_number_secondary'] || ''),
        listingStatus: createDataField(row['4_listing_status'] || 'Active'),
        listingDate: createDataField(row['5_list_price'] || ''),
        listingPrice: createDataField(row['5_list_price'] ? parseFloat(row['5_list_price'].toString().replace(/[^0-9.]/g, '')) : null),
        pricePerSqft: createDataField(row['19_price_per_sqft'] ? parseFloat(row['19_price_per_sqft'].toString().replace(/[^0-9.]/g, '')) : null),
        streetAddress: createDataField(row['1_full_address'] || ''),
        city: createDataField(row['42_city'] || ''),
        state: createDataField(row['44_state'] || 'FL'),
        zipCode: createDataField(row['45_zip_code'] || ''),
        county: createDataField(row['43_county'] || ''),
        latitude: createDataField(row['46_latitude'] ? parseFloat(row['46_latitude']) : null),
        longitude: createDataField(row['47_longitude'] ? parseFloat(row['47_longitude']) : null),
        neighborhoodName: createDataField(row['41_neighborhood_name'] || ''),
      },
      details: {
        bedrooms: createDataField(row['11_bedrooms'] ? parseInt(row['11_bedrooms']) : null),
        fullBathrooms: createDataField(row['12_bathrooms_full'] ? parseInt(row['12_bathrooms_full']) : null),
        halfBathrooms: createDataField(row['13_bathrooms_half'] ? parseInt(row['13_bathrooms_half']) : null),
        totalBathrooms: createDataField(row['14_bathrooms_total'] ? parseFloat(row['14_bathrooms_total']) : null),
        livingSqft: createDataField(row['15_living_area_sqft'] ? parseInt(row['15_living_area_sqft']) : null),
        totalSqftUnderRoof: createDataField(row['16_total_area_sqft'] ? parseInt(row['16_total_area_sqft']) : null),
        lotSizeSqft: createDataField(row['17_lot_size_sqft'] ? parseInt(row['17_lot_size_sqft']) : null),
        lotSizeAcres: createDataField(row['18_lot_size_acres'] ? parseFloat(row['18_lot_size_acres']) : null),
        yearBuilt: createDataField(row['9_year_built'] ? parseInt(row['9_year_built']) : null),
        propertyType: createDataField(row['8_property_type'] || 'Single Family'),
        stories: createDataField(row['stories'] || null),
        garageSpaces: createDataField(row['32_garage_spaces'] ? parseInt(row['32_garage_spaces']) : null),
        parkingTotal: createDataField(row['33_parking_spaces_total'] || ''),
        hoaYn: createDataField(row['69_hoa_fee_monthly'] && row['69_hoa_fee_monthly'] !== '$0'),
        hoaFeeAnnual: createDataField(row['69_hoa_fee_monthly'] ? parseFloat(row['69_hoa_fee_monthly'].toString().replace(/[^0-9.]/g, '')) * 12 : null),
        hoaName: createDataField(row['70_hoa_name'] || ''),
        hoaIncludes: createDataField(row['71_hoa_includes'] || ''),
        annualTaxes: createDataField(row['67_annual_property_tax'] ? parseFloat(row['67_annual_property_tax'].toString().replace(/[^0-9.]/g, '')) : null),
        taxYear: createDataField(new Date().getFullYear()),
        assessedValue: createDataField(row['66_tax_assessed_value'] ? parseFloat(row['66_tax_assessed_value'].toString().replace(/[^0-9.]/g, '')) : null),
        marketValueEstimate: createDataField(row['73_zestimate'] ? parseFloat(row['73_zestimate'].toString().replace(/[^0-9.]/g, '')) : null),
        lastSaleDate: createDataField(row['7_sold_price'] || ''),
        lastSalePrice: createDataField(row['7_sold_price'] ? parseFloat(row['7_sold_price'].toString().replace(/[^0-9.]/g, '')) : null),
        ownershipType: createDataField(''),
        parcelId: createDataField(''),
      },
      structural: {
        roofType: createDataField(''),
        roofAgeEst: createDataField(row['10_year_renovated'] || ''),
        exteriorMaterial: createDataField(''),
        foundation: createDataField(''),
        hvacType: createDataField(''),
        hvacAge: createDataField(''),
        waterHeaterType: createDataField(row['30_water_heater_type'] || ''),
        garageType: createDataField(row['31_garage_type'] || ''),
        flooringType: createDataField(row['40_flooring_types'] || ''),
        kitchenFeatures: createDataField(''),
        appliancesIncluded: createDataField([]),
        laundryType: createDataField(row['39_laundry_type'] || ''),
        fireplaceYn: createDataField(row['37_fireplace'] ? row['37_fireplace'].toLowerCase() === 'true' || row['37_fireplace'].toLowerCase() === 'yes' : false),
        fireplaceCount: createDataField(row['38_fireplace_count'] ? parseInt(row['38_fireplace_count']) : null),
        poolYn: createDataField(row['34_pool'] ? row['34_pool'].toLowerCase() === 'true' || row['34_pool'].toLowerCase() === 'yes' : false),
        poolType: createDataField(row['35_pool_type'] || ''),
        deckPatio: createDataField(''),
        fence: createDataField(row['36_fence_type'] || ''),
        landscaping: createDataField(''),
        recentRenovations: createDataField(row['10_year_renovated'] || ''),
        permitHistoryRoof: createDataField(''),
        permitHistoryHvac: createDataField(''),
        permitHistoryPoolAdditions: createDataField(''),
        interiorCondition: createDataField(''),
      },
      location: {
        assignedElementary: createDataField(row['56_elementary_school_name'] || ''),
        elementaryRating: createDataField(row['57_elementary_school_rating'] || ''),
        elementaryDistanceMiles: createDataField(row['58_elementary_school_distance'] ? parseFloat(row['58_elementary_school_distance']) : null),
        assignedMiddle: createDataField(row['59_middle_school_name'] || ''),
        middleRating: createDataField(row['60_middle_school_rating'] || ''),
        middleDistanceMiles: createDataField(row['61_middle_school_distance'] ? parseFloat(row['61_middle_school_distance']) : null),
        assignedHigh: createDataField(row['62_high_school_name'] || ''),
        highRating: createDataField(row['63_high_school_rating'] || ''),
        highDistanceMiles: createDataField(row['64_high_school_distance'] ? parseFloat(row['64_high_school_distance']) : null),
        schoolDistrictName: createDataField(row['65_school_district_name'] || ''),
        elevationFeet: createDataField(row['55_elevation_feet'] ? parseFloat(row['55_elevation_feet']) : null),
        walkScore: createDataField(row['48_walk_score'] ? parseInt(row['48_walk_score']) : null),
        transitScore: createDataField(row['50_transit_score'] ? parseInt(row['50_transit_score']) : null),
        bikeScore: createDataField(row['49_bike_score'] ? parseInt(row['49_bike_score']) : null),
        distanceGroceryMiles: createDataField(0),
        distanceHospitalMiles: createDataField(0),
        distanceAirportMiles: createDataField(0),
        distanceParkMiles: createDataField(0),
        distanceBeachMiles: createDataField(0),
        crimeIndexViolent: createDataField(''),
        crimeIndexProperty: createDataField(''),
        neighborhoodSafetyRating: createDataField(row['51_crime_rate_level'] || ''),
        noiseLevel: createDataField(row['52_noise_level_estimate'] || ''),
        trafficLevel: createDataField(''),
        walkabilityDescription: createDataField(''),
        commuteTimeCityCenter: createDataField(''),
        publicTransitAccess: createDataField(''),
      },
      financial: {
        annualPropertyTax: createDataField(row['67_annual_property_tax'] ? parseFloat(row['67_annual_property_tax'].toString().replace(/[^0-9.]/g, '')) : null),
        taxExemptions: createDataField(''),
        propertyTaxRate: createDataField(row['68_tax_rate_percent'] ? parseFloat(row['68_tax_rate_percent']) : null),
        recentTaxPaymentHistory: createDataField(''),
        medianHomePriceNeighborhood: createDataField(row['78_median_home_price_area'] ? parseFloat(row['78_median_home_price_area'].toString().replace(/[^0-9.]/g, '')) : null),
        pricePerSqftRecentAvg: createDataField(row['19_price_per_sqft'] ? parseFloat(row['19_price_per_sqft'].toString().replace(/[^0-9.]/g, '')) : null),
        redfinEstimate: createDataField(row['74_redfin_estimate'] ? parseFloat(row['74_redfin_estimate'].toString().replace(/[^0-9.]/g, '')) : null),
        priceToRentRatio: createDataField(row['77_price_to_rent_ratio'] ? parseFloat(row['77_price_to_rent_ratio']) : null),
        priceVsMedianPercent: createDataField(row['79_price_vs_median_percent'] ? parseFloat(row['79_price_vs_median_percent']) : null),
        daysOnMarketAvg: createDataField(row['20_days_on_market'] && row['20_days_on_market'] !== 'N/A' ? parseFloat(row['20_days_on_market']) : null),
        inventorySurplus: createDataField(''),
        rentalEstimateMonthly: createDataField(row['75_rental_estimate_monthly'] ? parseFloat(row['75_rental_estimate_monthly'].toString().replace(/[^0-9.]/g, '')) : null),
        rentalYieldEst: createDataField(0),
        vacancyRateNeighborhood: createDataField(0),
        capRateEst: createDataField(row['76_cap_rate_estimate'] ? parseFloat(row['76_cap_rate_estimate']) : null),
        insuranceEstAnnual: createDataField(parsePrice(row['80_insurance_estimate_annual'])),
        financingTerms: createDataField(''),
        comparableSalesLast3: createDataField([]),
        specialAssessments: createDataField(row['72_special_assessments'] || ''),
      },
      utilities: {
        electricProvider: createDataField(row['81_electric_provider'] || ''),
        waterProvider: createDataField(row['82_water_provider'] || ''),
        sewerProvider: createDataField(row['83_sewer_type'] || ''),
        naturalGas: createDataField(row['84_gas_provider'] || ''),
        trashProvider: createDataField(row['85_trash_provider'] || ''),
        internetProvidersTop3: createDataField(row['86_internet_providers'] ? row['86_internet_providers'].split(',').map((s: string) => s.trim()) : []),
        maxInternetSpeed: createDataField(row['87_max_internet_speed_mbps'] || ''),
        fiberAvailable: createDataField(row['88_fiber_available'] ? row['88_fiber_available'].toLowerCase() === 'true' : false),
        cableTvProvider: createDataField(row['89_cable_provider'] || ''),
        avgElectricBill: createDataField(row['90_avg_electric_bill'] || ''),
        avgWaterBill: createDataField(row['91_avg_water_bill'] || ''),
        cellCoverageQuality: createDataField(row['94_cell_coverage_quality'] || ''),
        emergencyServicesDistance: createDataField(row['95_emergency_services_distance'] || ''),
        airQualityIndexCurrent: createDataField(row['96_air_quality_index'] || ''),
        airQualityGrade: createDataField(row['97_air_quality_grade'] || ''),
        floodZone: createDataField(row['53_flood_zone'] || ''),
        floodRiskLevel: createDataField(row['54_flood_risk_level'] || ''),
        climateRiskWildfireFlood: createDataField(row['104_climate_risk_overall'] || ''),
        wildfireRisk: createDataField(row['98_wildfire_risk'] || ''),
        earthquakeRisk: createDataField(row['99_earthquake_risk'] || ''),
        hurricaneRisk: createDataField(row['100_hurricane_risk'] || ''),
        tornadoRisk: createDataField(row['101_tornado_risk'] || ''),
        radonRisk: createDataField(row['102_radon_risk'] || ''),
        superfundNearby: createDataField(row['103_superfund_nearby'] ? row['103_superfund_nearby'].toLowerCase() === 'true' : false),
        seaLevelRiseRisk: createDataField(row['105_sea_level_rise_risk'] || ''),
        noiseLevelDbEst: createDataField(''),
        solarPotential: createDataField(row['92_solar_potential'] || ''),
        evChargingYn: createDataField(row['93_ev_charging_nearby'] || ''),
        smartHomeFeatures: createDataField(row['106_smart_home_features'] || ''),
        accessibilityMods: createDataField(row['107_accessibility_features'] || ''),
        viewType: createDataField(row['108_view_type'] || ''),
        lotFeatures: createDataField(row['109_lot_features'] || ''),
        petPolicy: createDataField(''),
        ageRestrictions: createDataField(''),
        notesConfidenceSummary: createDataField(row['110_notes_and_confidence'] || ''),
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

        // Extract price (support both field definition format and standard)
        const listingPrice = row['5_list_price'] || row['7_sold_price'] || row['price'] || row['Price'] || '0';
        const price = parseInt(String(listingPrice).replace(/[^0-9]/g, '')) || 0;

        // Extract bedrooms/bathrooms
        const bedrooms = parseInt(row['11_bedrooms'] || row['bedrooms'] || row['Bedrooms'] || '0');
        const bathrooms = parseFloat(row['14_bathrooms_total'] || row['bathrooms'] || row['Bathrooms'] || '0');

        // Extract sqft
        const sqft = parseInt(row['15_living_area_sqft'] || row['sqft'] || row['Sqft'] || '0');

        // Extract year built
        const yearBuilt = parseInt(row['9_year_built'] || row['yearBuilt'] || row['Year Built'] || new Date().getFullYear().toString());

        // Extract status
        const listingStatus = row['4_listing_status'] || row['status'] || row['Status'] || 'Active';

        // Count non-empty fields for data completeness
        const filledFieldsCount = Object.values(row).filter(v => v && v !== '').length;
        const dataCompleteness = Math.round((filledFieldsCount / 138) * 100);

        // Create full property with all 138 fields from CSV
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

  // Merge enriched API data with existing CSV data (CSV takes precedence)
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

    // Merge address fields
    merged.address.mlsPrimary = mergeField(merged.address.mlsPrimary, '2_mls_primary');
    merged.address.county = mergeField(merged.address.county, '28_county');
    merged.address.latitude = mergeField(merged.address.latitude, 'coordinates');
    merged.address.longitude = mergeField(merged.address.longitude, 'coordinates');

    // Merge location fields
    merged.location.walkScore = mergeField(merged.location.walkScore, '65_walk_score');
    merged.location.transitScore = mergeField(merged.location.transitScore, '66_transit_score');
    merged.utilities.floodZone = mergeField(merged.utilities.floodZone, '100_flood_zone');

    // Could merge all 138 fields here, but for now just key ones
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
          Upload CSV
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
          Paste Description
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
                        const priceRaw = row['6_listing_price'] || row['7_listing_price'] || row['price'] || row['Price'] || '0';
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
        ) : inputMode === 'manual' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Address input with autocomplete */}
              <div className="md:col-span-2 relative" ref={autocompleteRef}>
                <label className="block text-sm text-gray-400 mb-2">
                  Street Address * <span className="text-quantum-cyan text-xs">(8 FL Counties)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Start typing address... (Pinellas, Pasco, Hillsborough, etc.)"
                    value={manualForm.address}
                    onChange={(e) => handleAddressInputChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    className="input-glass pl-12"
                    autoComplete="off"
                  />
                  {isLoadingSuggestions && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-quantum-cyan animate-spin" />
                  )}
                </div>

                {/* Autocomplete dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full mt-1 bg-gray-900 border border-quantum-cyan/30 rounded-xl shadow-lg overflow-hidden"
                    >
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.placeId || index}
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-quantum-cyan/10 transition-colors border-b border-white/5 last:border-b-0"
                        >
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-quantum-cyan mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-white font-medium text-sm">{suggestion.mainText}</p>
                              <p className="text-gray-400 text-xs">{suggestion.secondaryText}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Helper text */}
                <p className="text-xs text-gray-500 mt-1">
                  Covers: Pinellas, Pasco, Manatee, Sarasota, Polk, Hernando, Hillsborough, Citrus
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  placeholder="St Pete Beach"
                  value={manualForm.city}
                  onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                  className="input-glass"
                  readOnly={!!selectedSuggestion}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    State
                  </label>
                  <select
                    value={manualForm.state}
                    onChange={(e) => setManualForm({ ...manualForm, state: e.target.value })}
                    className="input-glass"
                  >
                    <option value="FL">FL</option>
                    <option value="GA">GA</option>
                    <option value="TX">TX</option>
                    <option value="CA">CA</option>
                    <option value="NY">NY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    ZIP
                  </label>
                  <input
                    type="text"
                    placeholder="33706"
                    value={manualForm.zip}
                    onChange={(e) => setManualForm({ ...manualForm, zip: e.target.value })}
                    className="input-glass"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  placeholder="549000"
                  value={manualForm.price}
                  onChange={(e) => setManualForm({ ...manualForm, price: e.target.value })}
                  className="input-glass"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Sq Ft
                </label>
                <input
                  type="number"
                  placeholder="1426"
                  value={manualForm.sqft}
                  onChange={(e) => setManualForm({ ...manualForm, sqft: e.target.value })}
                  className="input-glass"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Bedrooms
                </label>
                <select
                  value={manualForm.bedrooms}
                  onChange={(e) => setManualForm({ ...manualForm, bedrooms: e.target.value })}
                  className="input-glass"
                >
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Bathrooms
                </label>
                <select
                  value={manualForm.bathrooms}
                  onChange={(e) => setManualForm({ ...manualForm, bathrooms: e.target.value })}
                  className="input-glass"
                >
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="1.5">1.5</option>
                  <option value="2">2</option>
                  <option value="2.5">2.5</option>
                  <option value="3">3+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Year Built
                </label>
                <input
                  type="number"
                  placeholder="1958"
                  value={manualForm.yearBuilt}
                  onChange={(e) => setManualForm({ ...manualForm, yearBuilt: e.target.value })}
                  className="input-glass"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Status
                </label>
                <select
                  value={manualForm.listingStatus}
                  onChange={(e) => setManualForm({ ...manualForm, listingStatus: e.target.value })}
                  className="input-glass"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleManualSubmit}
              disabled={status !== 'idle' && status !== 'complete' && status !== 'error'}
              className="btn-quantum w-full mt-4"
            >
              {status === 'idle' || status === 'complete' || status === 'error' ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  Search & Add Property
                </>
              ) : (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Fetching Real Property Data...
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
