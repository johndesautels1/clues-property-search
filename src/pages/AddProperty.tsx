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
  Save,
} from 'lucide-react';
import { usePropertyStore } from '@/store/propertyStore';
import type { PropertyCard, Property, DataField } from '@/types/property';
import { LLM_CASCADE_ORDER, LLM_DISPLAY_NAMES } from '@/lib/llm-constants';
import { normalizeToProperty } from '@/lib/field-normalizer';
import { validateCsvData, getValidationSummary, type ValidationResult } from '@/lib/csv-validator';
import { initializeSourceProgress, type SourceProgress, getSourceName } from '@/lib/data-sources';
import SearchProgressTracker from '@/components/property/SearchProgressTracker';

// Helper to parse numbers and remove commas (e.g., "1,345" → 1345)
const safeParseNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  const cleaned = String(val || '0').replace(/,/g, '');
  const num = parseFloat(cleaned);
  return !isNaN(num) ? num : 0;
};

// Helper to extract value from DataField or direct value
const getFieldValue = (field: any): any => {
  if (!field) return null;
  return field.value !== undefined ? field.value : field;
};

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

// LLM Engine options - MATCHES api/property/llm-constants.ts LLM_CASCADE_ORDER
const LLM_ENGINES = [
  { id: 'Auto', label: 'Auto Cascade', desc: 'All 6 engines', icon: '🔄' },
  { id: 'perplexity', label: LLM_DISPLAY_NAMES['perplexity'], desc: '1. Deep Web Search', icon: '🔍' },
  { id: 'gemini', label: LLM_DISPLAY_NAMES['gemini'], desc: '2. Google Grounding', icon: '♊' },
  { id: 'gpt', label: LLM_DISPLAY_NAMES['gpt'], desc: '3. Web Evidence', icon: '🤖' },
  { id: 'grok', label: LLM_DISPLAY_NAMES['grok'], desc: '4. X/Twitter Data', icon: '⚡' },
  { id: 'claude-sonnet', label: LLM_DISPLAY_NAMES['claude-sonnet'], desc: '5. Web Search Beta', icon: '🧊' },
  { id: 'claude-opus', label: LLM_DISPLAY_NAMES['claude-opus'], desc: '6. Deep Reasoning', icon: '👑' },
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [accumulatedFields, setAccumulatedFields] = useState<Record<string, any>>({});  // Accumulated fields across LLM calls
  const [currentAddress, setCurrentAddress] = useState('');  // Track address for accumulation
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [propertyText, setPropertyText] = useState('');
  const [enrichWithAI, setEnrichWithAI] = useState(false);

  // CSV validation state
  const [csvValidationResult, setCsvValidationResult] = useState<{ isValid: boolean; totalErrors: number; totalWarnings: number; validRows: number; invalidRows: number; results: ValidationResult[]; allValidatedData: Record<string, any>[] } | null>(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  // PDF upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfParsedFields, setPdfParsedFields] = useState<Record<string, any>>({});
  const [pdfParseStatus, setPdfParseStatus] = useState<'idle' | 'uploading' | 'parsing' | 'complete' | 'error'>('idle');
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [sourcesProgress, setSourcesProgress] = useState<SourceProgress[]>(initializeSourceProgress());

  // Manual entry form state - Expanded to 25 high-value fields per 5-Agent Audit
  const [manualForm, setManualForm] = useState({
    // Basic Address (5 fields)
    address: '',
    city: '',
    state: 'FL',
    zip: '',
    county: '',
    // Pricing (3 fields)
    price: '',
    pricePerSqft: '',
    lastSalePrice: '',
    // Property Details (7 fields)
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    lotSizeSqft: '',
    yearBuilt: '',
    propertyType: 'Single Family',
    stories: '',
    // HOA & Taxes (4 fields)
    hoaYn: 'no',
    hoaFeeAnnual: '',
    annualTaxes: '',
    taxYear: new Date().getFullYear().toString(),
    // Structural (3 fields)
    garageSpaces: '',
    poolYn: 'no',
    roofType: '',
    // Status (3 fields)
    listingStatus: 'Active',
    mlsNumber: '',
    listingDate: '',
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

  // Auto-dismiss "saved" message after 3 seconds
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleManualSubmit = async () => {
    if (!manualForm.mlsNumber) {
      alert('Please enter an MLS number');
      return;
    }

    // Use MLS number for API search
    const fullAddress = manualForm.mlsNumber;

    // Use startTransition for non-urgent UI updates to improve INP
    startTransition(() => {
      setStatus('searching');
      setProgress(0);
      setTotalFieldsFound(0);
      setSourcesProgress(initializeSourceProgress());
    });

    // Allow browser to paint before heavy async work
    await new Promise(resolve => requestAnimationFrame(resolve));

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';

      // Determine which engines to use based on selection
      const getEngines = () => {
        if (selectedEngine === 'Auto') {
          // ALL 6 LLMs in CASCADE ORDER (MUST MATCH api/property/llm-constants.ts LLM_CASCADE_ORDER)
          // Perplexity → Gemini → GPT → Grok → Sonnet → Opus (Opus LAST - no web search)
          return ['perplexity', 'gemini', 'gpt', 'grok', 'claude-sonnet', 'claude-opus'];
        }
        return [selectedEngine];
      };

      // Call EXISTING search endpoint with MLS# (SAME as Property Search page)
      const response = await fetch(`${apiUrl}/api/property/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mlsNumber: fullAddress, // MLS number (e.g. "TB1234567")
          engines: getEngines(),
          skipLLMs: false,
          skipApis: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      // Parse JSON response directly (search.ts returns JSON, not SSE)
      const data = await response.json();

      // Update progress UI
      startTransition(() => {
        setProgress(100);
        setStatus('scraping');
        if (data.total_fields_found !== undefined) {
          setTotalFieldsFound(data.total_fields_found);
        }
      });

      // Extract property data from API response
      const fields = data.fields || {};
      const fieldSources = data.field_sources || {};
      const conflicts = data.conflicts || [];

      console.log('🔍 Manual Entry Response:', data);
      console.log('📊 Total Fields Found:', data.total_fields_found);
      console.log('📊 Field Sources:', fieldSources);

      // Update cascade status with field counts from API
      if (fieldSources && Object.keys(fieldSources).length > 0) {
        startTransition(() => {
          setSourcesProgress(prev => prev.map(source => {
            // Try multiple variations to find matching field source
            // 1. Exact match
            let fieldsFound = fieldSources[source.name] || 0;

            // 2. Try common variations if exact match failed
            if (fieldsFound === 0) {
              const variations = [
                source.name.replace('GPT-4o', 'GPT'),
                source.name.replace('FBI Crime', 'FBI Crime Data'),
                source.name,
              ];

              for (const variation of variations) {
                if (fieldSources[variation]) {
                  fieldsFound = fieldSources[variation];
                  break;
                }
              }
            }

            return {
              ...source,
              status: fieldsFound > 0 ? 'complete' : 'skipped',
              fieldsFound,
            };
          }));
        });
      }

      // Parse address components from API (MLS search should return full address)
      const apiFullAddress = fields['1_full_address']?.value || '';
      const addressParts = (apiFullAddress || '').split(',').map((s: string) => s.trim());
      const street = addressParts[0] || 'Unknown Address';
      const city = addressParts[1] || 'Unknown City';
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
        price: safeParseNumber(getFieldValue(fields['10_listing_price'])) || parseInt(manualForm.price) || 0,
        pricePerSqft: safeParseNumber(getFieldValue(fields['11_price_per_sqft'])) || (
          manualForm.sqft && manualForm.price
            ? Math.round(parseInt(manualForm.price) / parseInt(manualForm.sqft))
            : 0
        ),
        bedrooms: safeParseNumber(getFieldValue(fields['17_bedrooms'])) || parseInt(manualForm.bedrooms) || 0,
        bathrooms: safeParseNumber(getFieldValue(fields['20_total_bathrooms'])) || parseFloat(manualForm.bathrooms) || 0,
        sqft: safeParseNumber(getFieldValue(fields['21_living_sqft'])) || parseInt(manualForm.sqft) || 0,
        yearBuilt: safeParseNumber(getFieldValue(fields['25_year_built'])) || parseInt(manualForm.yearBuilt) || new Date().getFullYear(),
        smartScore: undefined,
        dataCompleteness: data.completion_percentage || 0,
        listingStatus: fields['4_listing_status']?.value || manualForm.listingStatus as 'Active' | 'Pending' | 'Sold',
        daysOnMarket: 0,
      };

      // Create full property object with all 181 fields if available
      const fullPropertyData = convertApiResponseToFullProperty(fields, scrapedProperty.id, fieldSources, conflicts);

      setSaveStatus('saving');
      addProperty(scrapedProperty, fullPropertyData);
      setLastAddedId(scrapedProperty.id);
      setSaveStatus('saved');
      setStatus('complete');
      setProgress(data.completion_percentage || 100);

      console.log('✅ Property added from manual entry:', data);

      // Reset form
      setManualForm({
        address: '',
        city: '',
        state: 'FL',
        zip: '',
        county: '',
        price: '',
        pricePerSqft: '',
        lastSalePrice: '',
        bedrooms: '',
        bathrooms: '',
        sqft: '',
        lotSizeSqft: '',
        yearBuilt: '',
        propertyType: 'Single Family',
        stories: '',
        hoaYn: 'no',
        hoaFeeAnnual: '',
        annualTaxes: '',
        taxYear: new Date().getFullYear().toString(),
        garageSpaces: '',
        poolYn: 'no',
        roofType: '',
        listingStatus: 'Active',
        mlsNumber: '',
        listingDate: '',
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

    setStatus('searching');
    setProgress(10);

    try {
      // Call the backend API - use same endpoint as SearchProperty for consistent data fetching
      const apiUrl = import.meta.env.VITE_API_URL || '';

      setStatus('scraping');
      setProgress(30);

      // Map selected engine to API format
      const getEngines = () => {
        if (selectedEngine === 'Auto') {
          // ONLY Perplexity and Grok (web search LLMs) - Claude/GPT/Gemini disabled for testing
          return ['perplexity', 'grok'];
        }
        // Single engine selected
        return [selectedEngine]; // Already in correct format (e.g., 'claude-opus', 'gpt')
      };

      const requestBody = {
        address: searchQuery,
        url: inputMode === 'url' ? url : undefined,
        engines: getEngines(),
        skipLLMs: false,
      };

      const response = await fetch(`${apiUrl}/api/property/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      // Parse JSON response directly (search.ts returns JSON, not SSE)
      const data = await response.json();
      setProgress(90);

      // Extract property data from API response
      const fields = data.fields || {};
      const fieldSources = data.field_sources || {}; // NEW: Track which LLMs provided each field
      const conflicts = data.conflicts || []; // NEW: Track conflicting values

      // If partial data, warn but continue
      if (data.partial) {
        console.warn('⚠️ Partial data received:', data.error || 'Timeout');
      }

      // Update total fields found
      if (data.total_fields_found !== undefined) {
        setTotalFieldsFound(data.total_fields_found);
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
      const parseNumber = (val: any): number => {
        if (typeof val === 'number') return val;
        // Remove commas from formatted numbers (e.g., "1,345" → "1345")
        const cleaned = String(val).replace(/,/g, '');
        const num = parseFloat(cleaned);
        return !isNaN(num) ? num : 0;
      };

      const scrapedProperty: PropertyCard = {
        id: generateId(),
        address: street || fullAddress,
        city,
        state: stateMatch?.[1] || 'FL',
        zip: zipMatch?.[1] || '',
        price: safeParseNumber(getFieldValue(fields['10_listing_price'])),
        pricePerSqft: safeParseNumber(getFieldValue(fields['11_price_per_sqft'])) || (
          safeParseNumber(getFieldValue(fields['10_listing_price'])) && safeParseNumber(getFieldValue(fields['21_living_sqft']))
            ? Math.round(safeParseNumber(getFieldValue(fields['10_listing_price'])) / safeParseNumber(getFieldValue(fields['21_living_sqft'])))
            : 0
        ),
        bedrooms: safeParseNumber(getFieldValue(fields['17_bedrooms'])),
        bathrooms: safeParseNumber(getFieldValue(fields['20_total_bathrooms'])),
        sqft: safeParseNumber(getFieldValue(fields['21_living_sqft'])),
        yearBuilt: safeParseNumber(getFieldValue(fields['25_year_built'])) || new Date().getFullYear(),
        smartScore: undefined,
        dataCompleteness: data.completion_percentage || 0,
        listingStatus: (getFieldValue(fields['4_listing_status']) || 'Active') as 'Active' | 'Pending' | 'Sold',
        daysOnMarket: 0,
      };

      // Create full property object with all 181 fields if available
      const fullPropertyData = convertApiResponseToFullProperty(fields, scrapedProperty.id, fieldSources, conflicts);

      setSaveStatus('saving');
      addProperty(scrapedProperty, fullPropertyData);
      setLastAddedId(scrapedProperty.id);
      setSaveStatus('saved');

      // Set status based on whether we got partial or complete data
      if (data.partial) {
        setStatus('complete'); // Still mark complete so user can view data
        setProgress(data.completion_percentage || 60);
        console.warn('⚠️ Property added with partial data:', data.total_fields_found, 'fields');
        // Don't show blocking alert - just log it
      } else {
        setStatus('complete');
        setProgress(100);
        console.log('✅ Property scraped successfully:', data);
      }

      console.log('📊 Fields found:', data.total_fields_found);
      console.log('📋 Sources:', data.sources);

    } catch (error) {
      console.error('Scrape error:', error);
      // Check if we have accumulated fields we can use
      if (Object.keys(accumulatedFields).length > 0) {
        console.warn('⚠️ Using accumulated fields after error:', Object.keys(accumulatedFields).length);
        const fields = accumulatedFields;
        const fullAddress = fields['1_full_address']?.value || searchQuery || '';
        const addressParts = (fullAddress || '').split(',').map((s: string) => s.trim());

        const scrapedProperty: PropertyCard = {
          id: generateId(),
          address: addressParts[0] || fullAddress,
          city: addressParts[1] || 'Unknown',
          state: addressParts[2]?.match(/([A-Z]{2})/)?.[1] || 'FL',
          zip: addressParts[2]?.match(/(\d{5})/)?.[1] || '',
          price: safeParseNumber(getFieldValue(fields['10_listing_price'])),
          pricePerSqft: safeParseNumber(getFieldValue(fields['11_price_per_sqft'])) || (
            safeParseNumber(getFieldValue(fields['10_listing_price'])) && safeParseNumber(getFieldValue(fields['21_living_sqft']))
              ? Math.round(safeParseNumber(getFieldValue(fields['10_listing_price'])) / safeParseNumber(getFieldValue(fields['21_living_sqft'])))
              : 0
          ),
          bedrooms: safeParseNumber(getFieldValue(fields['17_bedrooms'])),
          bathrooms: safeParseNumber(getFieldValue(fields['20_total_bathrooms'])),
          sqft: safeParseNumber(getFieldValue(fields['21_living_sqft'])),
          yearBuilt: safeParseNumber(getFieldValue(fields['25_year_built'])) || new Date().getFullYear(),
          smartScore: Math.round((Object.keys(fields).length / 181) * 100),
          dataCompleteness: Math.round((Object.keys(fields).length / 181) * 100),
          listingStatus: fields['4_listing_status']?.value || 'Active',
          daysOnMarket: 0,
        };

        const fullPropertyData = convertApiResponseToFullProperty(fields, scrapedProperty.id, {}, []);
        setSaveStatus('saving');
        addProperty(scrapedProperty, fullPropertyData);
        setLastAddedId(scrapedProperty.id);
        setSaveStatus('saved');
        setStatus('complete');
        setProgress(scrapedProperty.dataCompleteness);
        console.warn('⚠️ Property added with cached data after error');
      } else {
        setStatus('error');
        alert(`Failed to extract property data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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
        return 'Extracting 181 fields with AI...';
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

      // Validate CSV data immediately after parsing
      const validationResult = validateCsvData(data);
      setCsvValidationResult(validationResult);
      
      if (validationResult.totalErrors > 0) {
        console.warn('[CSV VALIDATION] Found', validationResult.totalErrors, 'errors in CSV data');
      }
      if (validationResult.totalWarnings > 0) {
        console.log('[CSV VALIDATION]', validationResult.totalWarnings, 'warnings');
      }
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

  // Helper to normalize boolean values consistently
  // Handles: true, 'true', 'TRUE', 'yes', 'YES', 'y', 'Y', '1', 1
  const parseBoolean = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      return lower === 'true' || lower === 'yes' || lower === 'y' || lower === '1';
    }
    return false;
  };

  // Convert CSV row with 181 fields to full Property object
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
        // Photos will be populated from Stellar MLS API, not CSV
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
        hoaYn: createDataField(parseBoolean(row['30_hoa_yn'])),
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
        fireplaceYn: createDataField(parseBoolean(row['52_fireplace_yn'])),
        primaryBrLocation: createDataField(row['53_primary_br_location'] || ''),
        poolYn: createDataField(parseBoolean(row['54_pool_yn'])),
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
        safetyScore: createDataField(row['77_safety_score'] ? parseInt(row['77_safety_score']) : null),
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
        avms: createDataField(row['16_avms'] ? parseFloat(row['16_avms'].toString().replace(/[^0-9.]/g, '')) : null),
        // AVM Subfields (16a-16f)
        zestimate: createDataField(row['16a_zestimate'] ? parseFloat(row['16a_zestimate'].toString().replace(/[^0-9.]/g, '')) : null),
        redfinEstimate: createDataField(row['16b_redfin_estimate'] ? parseFloat(row['16b_redfin_estimate'].toString().replace(/[^0-9.]/g, '')) : null),
        firstAmericanAvm: createDataField(row['16c_first_american_avm'] ? parseFloat(row['16c_first_american_avm'].toString().replace(/[^0-9.]/g, '')) : null),
        quantariumAvm: createDataField(row['16d_quantarium_avm'] ? parseFloat(row['16d_quantarium_avm'].toString().replace(/[^0-9.]/g, '')) : null),
        iceAvm: createDataField(row['16e_ice_avm'] ? parseFloat(row['16e_ice_avm'].toString().replace(/[^0-9.]/g, '')) : null),
        collateralAnalyticsAvm: createDataField(row['16f_collateral_analytics_avm'] ? parseFloat(row['16f_collateral_analytics_avm'].toString().replace(/[^0-9.]/g, '')) : null),
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
        fiberAvailable: createDataField(parseBoolean(row['113_fiber_available'])),
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
        superfundNearby: createDataField(parseBoolean(row['127_superfund_site_nearby'])),
        seaLevelRiseRisk: createDataField(row['128_sea_level_rise_risk'] || ''),
        noiseLevelDbEst: createDataField(row['129_noise_level_db_est'] || ''),
        solarPotential: createDataField(row['130_solar_potential'] || ''),
        // Additional Features (fields 131-168)
        evChargingYn: createDataField(row['133_ev_charging'] || ''),
        smartHomeFeatures: createDataField(row['134_smart_home_features'] || ''),
        accessibilityMods: createDataField(row['135_accessibility_modifications'] || ''),
        viewType: createDataField(row['131_view_type'] || ''),
        lotFeatures: createDataField(row['132_lot_features'] || ''),
        petPolicy: createDataField(row['136_pet_policy'] || ''),
        ageRestrictions: createDataField(row['137_age_restrictions'] || ''),
        notesConfidenceSummary: createDataField(''),
      },
      // Stellar MLS fields (139-168) - Added for complete 168-field CSV support
      stellarMLS: {
        parking: {
          carportYn: createDataField(parseBoolean(row['139_carport_yn'])),
          carportSpaces: createDataField(row['140_carport_spaces'] ? parseInt(row['140_carport_spaces']) : null),
          garageAttachedYn: createDataField(parseBoolean(row['141_garage_attached_yn'])),
          parkingFeatures: createDataField(row['142_parking_features'] ? row['142_parking_features'].split(',').map((s: string) => s.trim()) : []),
          assignedParkingSpaces: createDataField(row['143_assigned_parking_spaces'] ? parseInt(row['143_assigned_parking_spaces']) : null),
        },
        building: {
          floorNumber: createDataField(row['144_floor_number'] ? parseInt(row['144_floor_number']) : null),
          buildingTotalFloors: createDataField(row['145_building_total_floors'] ? parseInt(row['145_building_total_floors']) : null),
          buildingNameNumber: createDataField(row['146_building_name_number'] || ''),
          buildingElevatorYn: createDataField(parseBoolean(row['147_building_elevator_yn'])),
          floorsInUnit: createDataField(row['148_floors_in_unit'] ? parseInt(row['148_floors_in_unit']) : null),
        },
        legal: {
          subdivisionName: createDataField(row['149_subdivision_name'] || ''),
          legalDescription: createDataField(row['150_legal_description'] || ''),
          homesteadYn: createDataField(parseBoolean(row['151_homestead_yn'])),
          cddYn: createDataField(parseBoolean(row['152_cdd_yn'])),
          annualCddFee: createDataField(row['153_annual_cdd_fee'] ? parseFloat(row['153_annual_cdd_fee'].toString().replace(/[^0-9.]/g, '')) : null),
          frontExposure: createDataField(row['154_front_exposure'] || ''),
        },
        waterfront: {
          waterFrontageYn: createDataField(parseBoolean(row['155_water_frontage_yn'])),
          waterfrontFeet: createDataField(row['156_waterfront_feet'] ? parseInt(row['156_waterfront_feet']) : null),
          waterAccessYn: createDataField(parseBoolean(row['157_water_access_yn'])),
          waterViewYn: createDataField(parseBoolean(row['158_water_view_yn'])),
          waterBodyName: createDataField(row['159_water_body_name'] || ''),
        },
        leasing: {
          canBeLeasedYn: createDataField(parseBoolean(row['160_can_be_leased_yn'])),
          minimumLeasePeriod: createDataField(row['161_minimum_lease_period'] || ''),
          leaseRestrictionsYn: createDataField(parseBoolean(row['162_lease_restrictions_yn'])),
          petSizeLimit: createDataField(row['163_pet_size_limit'] || ''),
          maxPetWeight: createDataField(row['164_max_pet_weight'] ? parseInt(row['164_max_pet_weight']) : null),
          associationApprovalYn: createDataField(parseBoolean(row['165_association_approval_yn'])),
        },
        features: {
          communityFeatures: createDataField(row['166_community_features'] ? row['166_community_features'].split(',').map((s: string) => s.trim()) : []),
          interiorFeatures: createDataField(row['167_interior_features'] ? row['167_interior_features'].split(',').map((s: string) => s.trim()) : []),
          exteriorFeatures: createDataField(row['168_exterior_features'] ? row['168_exterior_features'].split(',').map((s: string) => s.trim()) : []),
        },
      },
    };
  };

  const handleCsvImport = async () => {
    if (csvData.length === 0) {
      alert('No data to import');
      return;
    }

    // CSV VALIDATION: Check validation results before proceeding
    if (csvValidationResult && csvValidationResult.totalErrors > 0) {
      const proceed = window.confirm(
        `CSV validation found ${csvValidationResult.totalErrors} error(s) that will block data from being imported incorrectly.\n\n` +
        `Valid rows: ${csvValidationResult.validRows}\n` +
        `Invalid rows: ${csvValidationResult.invalidRows}\n\n` +
        `Do you want to proceed with importing only the valid data?\n\n` +
        `(Invalid fields will be blocked from populating incorrect schema fields)`
      );
      if (!proceed) {
        setShowValidationDetails(true);
        return;
      }
    }

    setStatus('scraping');
    setProgress(10);

    try {
      let imported = 0;
      const propertyCards: PropertyCard[] = [];
      const fullProperties: Property[] = [];

      // Use validated data if available, otherwise fall back to raw CSV data
      // Validated data has type coercion applied and invalid rows filtered
      const dataToImport = csvValidationResult?.allValidatedData || csvData;

      // Process each CSV row
      for (let i = 0; i < dataToImport.length; i++) {
        const row = dataToImport[i];

        // Generate ID for this property
        const propertyId = generateId();

        // Try to extract address from 168-field format or standard format
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
        const dataCompleteness = Math.round((filledFieldsCount / 181) * 100);

        // Create full property with all 181 fields from CSV
        let fullProperty = convertCsvToFullProperty(row, propertyId);

        // ENRICHMENT: Always query MLS and Google APIs; use LLM cascade if enrichWithAI enabled
        if (address) {
          setStatus('enriching');
          setProgress(50 + (i / dataToImport.length) * 40); // 50-90% for enrichment

          console.log(`🔍 Querying MLS/APIs for property ${i + 1}/${dataToImport.length}:`, address);

          try {
            const apiUrl = import.meta.env.VITE_API_URL || '/api/property/search';
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address: address,
                engines: enrichWithAI ? ['perplexity', 'grok'] : undefined,  // LLM cascade only if enrichWithAI enabled
                useCascade: enrichWithAI,
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
          smartScore: undefined,
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

      // Get price with fallbacks
      // IMPORTANT: ListPrice from Bridge API or 10_listing_price from PDF = CURRENT listing price
      // NEVER use ClosePrice (14_last_sale_price) which is the old sale price
      // UPDATED: 2025-12-07 - Added 'ListPrice' from Bridge API as highest priority
      const priceRaw = getFieldValue(pdfParsedFields,
        'ListPrice', '10_listing_price', 'listing_price', 'list_price', 'current_price'
      );
      const price = parseFloat(String(priceRaw || '0').replace(/[^0-9.]/g, '')) || 0;

      // Debug logging to catch price field confusion
      console.log('[AddProperty] Price extraction:', {
        priceRaw,
        price,
        availablePriceFields: Object.keys(pdfParsedFields).filter(k =>
          k.toLowerCase().includes('price') || k.toLowerCase().includes('list')
        ).map(k => ({ key: k, value: pdfParsedFields[k]?.value }))
      });

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

      // Get days on market (DOM) - Current listing period
      // Stellar MLS Bridge API uses: DaysOnMarket
      // Stellar MLS PDF uses: DOM, Days on Market
      const domRaw = getFieldValue(pdfParsedFields,
        'DaysOnMarket', 'DOM', 'days_on_market', 'dom', 'Days on Market'
      );
      const domValue = parseInt(String(domRaw || ''));
      const daysOnMarket = isNaN(domValue) ? undefined : domValue;

      // Get cumulative days on market (CDOM) - Total time on market including relists
      // Stellar MLS Bridge API uses: CumulativeDaysOnMarket
      // Stellar MLS PDF uses: CDOM, ADOM, 95_days_on_market_avg
      const cdomRaw = getFieldValue(pdfParsedFields,
        'CumulativeDaysOnMarket', 'CDOM', 'ADOM', 'cdom', 'adom', '95_days_on_market_avg'
      );
      const cdomValue = parseInt(String(cdomRaw || ''));
      const cumulativeDaysOnMarket = isNaN(cdomValue) ? undefined : cdomValue;

      // Debug logging
      console.log('[AddProperty] DOM extraction:', { domRaw, daysOnMarket, cdomRaw, cumulativeDaysOnMarket });
      console.log('[AddProperty] Available field keys:', Object.keys(pdfParsedFields).filter(k => k.toLowerCase().includes('day') || k.toLowerCase().includes('dom') || k.toLowerCase().includes('market')));

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
        smartScore: undefined,
        dataCompleteness: Math.round((Object.keys(pdfParsedFields).length / 181) * 100),
        listingStatus: listingStatus,
        daysOnMarket: daysOnMarket,
        cumulativeDaysOnMarket: cumulativeDaysOnMarket,
      };

      setProgress(75);

      // Create full property using normalizer
      const fullProperty = normalizeToProperty(pdfParsedFields, propertyId, {}, []);

      setProgress(75);

      // Add to store with PDF data first
      addProperty(propertyCard, fullProperty);
      setLastAddedId(propertyId);

      console.log('✅ Property added from MLS PDF:', Object.keys(pdfParsedFields).length, 'fields');
      console.log('📋 Property Card:', propertyCard);
      console.log('🔄 Starting auto-enrichment cascade...');

      // ================================================================
      // AUTO-ENRICHMENT: Trigger cascade to fill missing fields
      // ================================================================
      try {
        setStatus('scraping');
        setProgress(80);
        setSourcesProgress(initializeSourceProgress());

        const apiUrl = import.meta.env.VITE_API_URL || '';

        // Build full address for API enrichment
        const enrichAddress = unit ? `${street}, ${unit}, ${city}, ${state} ${zip}` : `${street}, ${city}, ${state} ${zip}`;

        console.log('🔍 Enriching with address:', enrichAddress);

        // Query MLS and all APIs (unified with SearchProperty method)
        const response = await fetch(`${apiUrl}/api/property/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: enrichAddress,
            engines: ['perplexity', 'grok'], // Only web search LLMs (not Claude/GPT/Gemini)
            existingFields: pdfParsedFields, // Pass PDF data so APIs don't re-fetch what we have
            skipApis: false, // IMPORTANT: Run free APIs (WalkScore, Crime, etc.) to fill missing fields
            skipLLMs: false, // Run LLMs to fill gaps
            propertyId: propertyId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Enrichment API error: ${response.status}`);
        }

        // Parse JSON response (unified with SearchProperty method)
        const data = await response.json();
        setProgress(90);

        // Extract enriched fields
        const enrichedFields = data.fields || {};
        const fieldSources = data.field_sources || {};
        const conflicts = data.conflicts || [];

        // Warn if partial data
        if (data.partial) {
          console.warn('⚠️ Partial data received:', data.error || 'Timeout');
        }

        console.log('🔍 Enrichment Response:', data);
        console.log('📊 Field Sources:', fieldSources);
        console.log('⚠️  Conflicts:', conflicts);

        // Merge enriched data with PDF fields (PDF data takes precedence)
        const mergedFields = { ...enrichedFields, ...pdfParsedFields };
        const enrichedFullProperty = normalizeToProperty(mergedFields, propertyId, fieldSources, conflicts);

        // Update property card with new data completeness
        const enrichedCard = {
          ...propertyCard,
          dataCompleteness: Math.round((Object.keys(mergedFields).length / 181) * 100),
        };

        // Update store with enriched data
        addProperty(enrichedCard, enrichedFullProperty);

        console.log('✅ Auto-enrichment complete:', Object.keys(mergedFields).length, 'total fields');
        setProgress(100);
        setStatus('complete');

        // Reset PDF state
        setPdfFile(null);
        setPdfParsedFields({});
        setPdfParseStatus('idle');

      } catch (enrichError) {
        // Enrichment failed, but PDF data is already saved
        console.error('❌ Auto-enrichment error:', enrichError);
        console.log('✅ Property saved with PDF data only (enrichment skipped)');
        setProgress(100);
        setStatus('complete');

        // Reset PDF state
        setPdfFile(null);
        setPdfParsedFields({});
        setPdfParseStatus('idle');
      }

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

    // Could merge all 181 fields here, but for now just key ones
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
          MLS Search
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
                        Cascade: Perplexity → Gemini → GPT → Grok → Sonnet → Opus (stops at 100%)
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
                Upload a Stellar MLS CustomerFull PDF to extract all 181 property fields automatically
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
            {/* MLS Search - Simplified UI */}
            <div className="max-w-md mx-auto">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  MLS # *
                </label>
                <input
                  type="text"
                  placeholder="TB1234567"
                  value={manualForm.mlsNumber}
                  onChange={(e) => setManualForm({ ...manualForm, mlsNumber: e.target.value })}
                  className="input-glass"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter Stellar MLS number to fetch complete property data (181 fields)
                </p>
              </div>
            </div>

            <button
              onClick={handleManualSubmit}
              disabled={status !== 'idle' && status !== 'complete' && status !== 'error'}
              className="btn-quantum w-full mt-4"
            >
              {status === 'idle' || status === 'complete' || status === 'error' ? (
                <>
                  <Search className="w-5 h-5" />
                  MLS Search
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
                Cascade: Perplexity → Gemini → GPT → Grok → Sonnet → Opus
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
                Cascade: Perplexity → Gemini → GPT → Grok → Sonnet → Opus
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
              AI will extract all 181 property fields from your description
            </p>

            {/* LLM Selection - Cascade Order per Reliability Audit */}
            <div className="mt-6">
              <label className="block text-sm text-gray-400 mb-2">
                AI Engine <span className="text-quantum-cyan text-xs">(Reliability Order)</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Cascade: Perplexity → Gemini → GPT → Grok → Sonnet → Opus
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

          {/* Real-time API/LLM Progress Tracker */}
          <SearchProgressTracker
            sources={sourcesProgress}
            isSearching={status === 'searching' || status === 'scraping'}
            totalFieldsFound={totalFieldsFound || Math.round(progress * 1.68)}
            completionPercentage={progress}
          />

          {/* Show View Partial Data button when error but we have some data */}
          {status === 'error' && Object.keys(accumulatedFields).length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 pt-4 border-t border-white/10"
            >
              <div className="text-sm text-yellow-400 mb-3">
                ⚠️ Search incomplete, but {Object.keys(accumulatedFields).length} fields were found
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    // Create property from accumulated fields
                    const fields = accumulatedFields;
                    const fullAddress = fields['1_full_address']?.value || url || address || 'Unknown';
                    const addressParts = (fullAddress || '').split(',').map((s: string) => s.trim());

                    // Helper to parse numbers from field values (removes commas, etc.)
                    const parseFieldNumber = (val: any): number => {
                      if (typeof val === 'number') return val;
                      const cleaned = String(val || '0').replace(/,/g, '');
                      const num = parseFloat(cleaned);
                      return !isNaN(num) ? num : 0;
                    };

                    const partialProperty: PropertyCard = {
                      id: generateId(),
                      address: addressParts[0] || fullAddress,
                      city: addressParts[1] || 'Unknown',
                      state: addressParts[2]?.match(/([A-Z]{2})/)?.[1] || 'FL',
                      zip: addressParts[2]?.match(/(\d{5})/)?.[1] || '',
                      price: parseFieldNumber(fields['10_listing_price']?.value),
                      pricePerSqft: parseFieldNumber(fields['11_price_per_sqft']?.value),
                      bedrooms: parseFieldNumber(fields['17_bedrooms']?.value),
                      bathrooms: parseFieldNumber(fields['20_total_bathrooms']?.value),
                      sqft: parseFieldNumber(fields['21_living_sqft']?.value),
                      yearBuilt: parseFieldNumber(fields['25_year_built']?.value) || new Date().getFullYear(),
                      smartScore: Math.round((Object.keys(fields).length / 181) * 100),
                      dataCompleteness: Math.round((Object.keys(fields).length / 181) * 100),
                      listingStatus: fields['4_listing_status']?.value || 'Active',
                      daysOnMarket: 0,
                    };

                    const fullPropertyData = convertApiResponseToFullProperty(fields, partialProperty.id, {}, []);
                    addProperty(partialProperty, fullPropertyData);
                    setLastAddedId(partialProperty.id);
                    navigate(`/property/${partialProperty.id}`);
                  }}
                  className="btn-quantum flex-1 bg-yellow-600 hover:bg-yellow-500"
                >
                  View Partial Data ({Object.keys(accumulatedFields).length} fields)
                </button>
                <button
                  onClick={resetForm}
                  className="btn-glass flex-1"
                >
                  Try Again
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

      {/* Auto-save status indicator */}
      <AnimatePresence>
        {saveStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${
              saveStatus === 'saving'
                ? 'bg-quantum-cyan/20 border border-quantum-cyan/40'
                : 'bg-quantum-green/20 border border-quantum-green/40'
            }`}>
              {saveStatus === 'saving' ? (
                <>
                  <Save className="w-4 h-4 text-quantum-cyan animate-pulse" />
                  <span className="text-sm font-medium text-quantum-cyan">Saving property...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-quantum-green" />
                  <span className="text-sm font-medium text-quantum-green">Auto-saved ✓</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
