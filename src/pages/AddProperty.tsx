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
} from 'lucide-react';
import { usePropertyStore } from '@/store/propertyStore';
import type { PropertyCard, Property, DataField } from '@/types/property';
import { LLM_CASCADE_ORDER, LLM_DISPLAY_NAMES } from '@/lib/llm-constants';
import { normalizeToProperty } from '@/lib/field-normalizer';
import { validateCsvData, getValidationSummary, type ValidationResult } from '@/lib/csv-validator';
import { initializeCascadeStatus, getSourceName } from '@/lib/data-sources';

// Helper to parse numbers and remove commas (e.g., "1,345" → 1345)
const safeParseNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  const cleaned = String(val || '0').replace(/,/g, '');
  const num = parseFloat(cleaned);
  return !isNaN(num) ? num : 0;
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

  // CSV validation state
  const [csvValidationResult, setCsvValidationResult] = useState<{ isValid: boolean; totalErrors: number; totalWarnings: number; validRows: number; invalidRows: number; results: ValidationResult[]; allValidatedData: Record<string, any>[] } | null>(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  // PDF upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfParsedFields, setPdfParsedFields] = useState<Record<string, any>>({});
  const [pdfParseStatus, setPdfParseStatus] = useState<'idle' | 'uploading' | 'parsing' | 'complete' | 'error'>('idle');
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [cascadeStatus, setCascadeStatus] = useState<{llm: string; status: 'pending' | 'running' | 'complete' | 'error' | 'skipped'; fieldsFound?: number}[]>([]);

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

  const handleManualSubmit = async () => {
    if (!manualForm.address || !manualForm.city) {
      alert('Please fill in at least address and city');
      return;
    }

    // Construct full address for API search
    const fullAddress = `${manualForm.address}, ${manualForm.city}, ${manualForm.state}${manualForm.zip ? ' ' + manualForm.zip : ''}`;

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
          // ONLY Perplexity and Grok (web search LLMs) - Claude/GPT/Gemini disabled for testing
          return ['perplexity', 'grok'];
        }
        return [selectedEngine];
      };

      // Build existingFields from manual form data for the API
      const manualFields: Record<string, any> = {};
      
      // Pre-populate fields from manual entry form
      if (manualForm.price) {
        manualFields['10_listing_price'] = { value: parseFloat(manualForm.price), source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.pricePerSqft) {
        manualFields['11_price_per_sqft'] = { value: parseFloat(manualForm.pricePerSqft), source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.lastSalePrice) {
        manualFields['14_last_sale_price'] = { value: parseFloat(manualForm.lastSalePrice), source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.bedrooms) {
        manualFields['17_bedrooms'] = { value: parseInt(manualForm.bedrooms), source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.bathrooms) {
        manualFields['20_total_bathrooms'] = { value: parseFloat(manualForm.bathrooms), source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.sqft) {
        manualFields['21_living_sqft'] = { value: parseInt(manualForm.sqft), source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.lotSizeSqft) {
        manualFields['23_lot_size_sqft'] = { value: parseInt(manualForm.lotSizeSqft), source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.yearBuilt) {
        manualFields['25_year_built'] = { value: parseInt(manualForm.yearBuilt), source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.propertyType) {
        manualFields['26_property_type'] = { value: manualForm.propertyType, source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.stories) {
        manualFields['27_stories'] = { value: parseInt(manualForm.stories), source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.hoaYn) {
        manualFields['30_hoa_yn'] = { value: parseBoolean(manualForm.hoaYn), source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.hoaFeeAnnual) {
        manualFields['31_hoa_fee_annual'] = { value: parseFloat(manualForm.hoaFeeAnnual), source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.annualTaxes) {
        manualFields['35_annual_taxes'] = { value: parseFloat(manualForm.annualTaxes), source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.taxYear) {
        manualFields['36_tax_year'] = { value: parseInt(manualForm.taxYear), source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.garageSpaces) {
        manualFields['28_garage_spaces'] = { value: parseInt(manualForm.garageSpaces), source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.poolYn) {
        manualFields['54_pool_yn'] = { value: parseBoolean(manualForm.poolYn), source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.roofType) {
        manualFields['39_roof_type'] = { value: manualForm.roofType, source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.listingStatus) {
        manualFields['4_listing_status'] = { value: manualForm.listingStatus, source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.mlsNumber) {
        manualFields['2_mls_primary'] = { value: manualForm.mlsNumber, source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.listingDate) {
        manualFields['5_listing_date'] = { value: manualForm.listingDate, source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.county) {
        manualFields['7_county'] = { value: manualForm.county, source: 'Manual Entry', confidence: 'High' };
      }
      if (manualForm.zip) {
        manualFields['8_zip_code'] = { value: manualForm.zip, source: 'Manual Entry', confidence: 'High' };
      }
      
      // Merge manual fields with any previously accumulated fields
      const mergedExistingFields = shouldAccumulate 
        ? { ...accumulatedFields, ...manualFields }
        : manualFields;

      const response = await fetch(`${apiUrl}/api/property/search-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: fullAddress,
          engines: getEngines(),
          skipLLMs: false,
          existingFields: mergedExistingFields,  // Send manual + accumulated fields
          skipApis: shouldAccumulate,  // Skip APIs if we already have data from this address
        }),
      });

      // Don't throw on 504 - we may have partial data from SSE stream
      const is504 = response.status === 504;
      if (!response.ok && !is504) {
        throw new Error(`API Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalData: any = null;
      let currentFieldsFound = 0;
      let partialFields: Record<string, any> = {};  // Collect fields even if stream fails

      // Use unified source name mapping from data-sources manifest

      if (!reader) {
        throw new Error('No response body');
      }

      let streamError: Error | null = null;

      while (true) {
        let done = false;
        let value: Uint8Array | undefined;

        try {
          const result = await reader.read();
          done = result.done;
          value = result.value;
        } catch (readError) {
          // Connection failed (504, network error, etc.) - don't throw, use partial data
          console.warn('⚠️ Stream read error:', readError);
          streamError = readError instanceof Error ? readError : new Error('Stream read failed');
          done = true;
        }

        if (done) {
          // If we have finalData (complete event received), use it
          // If not but we have partialFields, create synthetic finalData from them
          if (!finalData && Object.keys(partialFields).length > 0) {
            console.warn('⚠️ Stream ended without complete event, using partial data:', Object.keys(partialFields).length, 'fields');
            finalData = {
              fields: partialFields,
              partial: true,
              error: streamError?.message || 'Stream ended prematurely',
              total_fields_found: Object.keys(partialFields).length,
              completion_percentage: Math.round((Object.keys(partialFields).length / 168) * 100),
            };
          } else if (!finalData) {
            throw new Error('Stream ended without complete event and no data received');
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
                const { source, status: sourceStatus, fieldsFound, newUniqueFields, currentFields } = data;
                const displayName = getSourceName(source);

                // 🔥 FIX: Capture intermediate field data as it arrives
                if (currentFields && Object.keys(currentFields).length > 0) {
                  partialFields = { ...partialFields, ...currentFields };
                  console.log(`💾 Captured ${Object.keys(currentFields).length} fields from ${displayName}, total now: ${Object.keys(partialFields).length}`);
                }

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
                  setProgress(Math.min(Math.round((currentFieldsFound / 168) * 100), 99));

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
        pricePerSqft: safeParseNumber(getFieldValue(fields['11_price_per_sqft'])) || (
          manualForm.sqft && manualForm.price
            ? Math.round(parseInt(manualForm.price) / parseInt(manualForm.sqft))
            : 0
        ),
        bedrooms: safeParseNumber(getFieldValue(fields['17_bedrooms'])) || parseInt(manualForm.bedrooms) || 0,
        bathrooms: safeParseNumber(getFieldValue(fields['20_total_bathrooms'])) || parseFloat(manualForm.bathrooms) || 0,
        sqft: safeParseNumber(getFieldValue(fields['21_living_sqft'])) || parseInt(manualForm.sqft) || 0,
        yearBuilt: safeParseNumber(getFieldValue(fields['25_year_built'])) || parseInt(manualForm.yearBuilt) || new Date().getFullYear(),
        smartScore: data.completion_percentage || 75,
        dataCompleteness: data.completion_percentage || 0,
        listingStatus: fields['4_listing_status']?.value || manualForm.listingStatus as 'Active' | 'Pending' | 'Sold',
        daysOnMarket: 0,
      };

      // Create full property object with all 168 fields if available
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

    // Check if this is a new address or continuing with same address
    const isNewAddress = searchQuery !== currentAddress;
    const hasExistingData = Object.keys(accumulatedFields).length > 0;
    const shouldAccumulate = !isNewAddress && hasExistingData;

    // DEBUG: Trace accumulation logic
    console.log('🔍 [DEBUG] handleScrape called');
    console.log('🔍 [DEBUG] searchQuery:', searchQuery);
    console.log('🔍 [DEBUG] currentAddress:', currentAddress);
    console.log('🔍 [DEBUG] isNewAddress:', isNewAddress);
    console.log('🔍 [DEBUG] hasExistingData:', hasExistingData);
    console.log('🔍 [DEBUG] shouldAccumulate:', shouldAccumulate);
    console.log('🔍 [DEBUG] accumulatedFields count:', Object.keys(accumulatedFields).length);

    if (isNewAddress) {
      // New address - reset accumulation
      console.log('🔍 [DEBUG] RESETTING accumulatedFields because isNewAddress=true');
      setAccumulatedFields({});
      setCurrentAddress(searchQuery);
      setTotalFieldsFound(0);
    }

    setStatus('searching');
    setProgress(10);

    try {

      // Call the backend API - use streaming endpoint for real-time progress
      const apiUrl = import.meta.env.VITE_API_URL || '/api/property/search-stream';

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
        useGrok: selectedEngine === 'Auto' || selectedEngine === 'grok',
        usePerplexity: selectedEngine === 'perplexity',
        useCascade: selectedEngine === 'Auto', // Only cascade on Auto
        existingFields: shouldAccumulate ? accumulatedFields : {},  // Send existing fields for accumulation
        skipApis: shouldAccumulate,  // Skip APIs if we already have data from this address
      };

      console.log('🔍 [DEBUG] Sending to API:', apiUrl);
      console.log('🔍 [DEBUG] Request body existingFields count:', Object.keys(requestBody.existingFields).length);
      console.log('🔍 [DEBUG] skipApis:', requestBody.skipApis);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Don't throw on 504 - we may have partial data from SSE stream
      const is504 = response.status === 504;
      if (!response.ok && !is504) {
        throw new Error(`API Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalData: any = null;
      let currentFieldsFound = 0;
      let partialFields: Record<string, any> = {};  // Collect fields even if stream fails

      if (!reader) {
        throw new Error('No response body');
      }

      let streamError: Error | null = null;

      while (true) {
        let done = false;
        let value: Uint8Array | undefined;

        try {
          const result = await reader.read();
          done = result.done;
          value = result.value;
        } catch (readError) {
          // Connection failed (504, network error, etc.) - don't throw, use partial data
          console.warn('⚠️ Stream read error:', readError);
          streamError = readError instanceof Error ? readError : new Error('Stream read failed');
          done = true;
        }

        if (done) {
          // If we have finalData (complete event received), use it
          // If not but we have partialFields, create synthetic finalData from them
          if (!finalData && Object.keys(partialFields).length > 0) {
            console.warn('⚠️ Stream ended without complete event, using partial data:', Object.keys(partialFields).length, 'fields');
            finalData = {
              fields: partialFields,
              partial: true,
              error: streamError?.message || 'Stream ended prematurely',
              total_fields_found: Object.keys(partialFields).length,
              completion_percentage: Math.round((Object.keys(partialFields).length / 168) * 100),
            };
          } else if (!finalData) {
            throw new Error('Stream ended without complete event and no data received');
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
                const { source, status: sourceStatus, fieldsFound, newUniqueFields, currentFields } = data;
                const displayName = getSourceName(source);

                // 🔥 FIX: Capture intermediate field data as it arrives
                if (currentFields && Object.keys(currentFields).length > 0) {
                  partialFields = { ...partialFields, ...currentFields };
                  console.log(`💾 Captured ${Object.keys(currentFields).length} fields from ${displayName}, total now: ${Object.keys(partialFields).length}`);
                }

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

                  // Update progress based on NEW UNIQUE fields
                  if (newUniqueFields !== undefined) {
                    currentFieldsFound += newUniqueFields;
                  } else {
                    currentFieldsFound += fieldsFound || 0;
                  }
                  setProgress(Math.min(Math.round((currentFieldsFound / 168) * 100), 99));

                  if (sourceStatus === 'searching') {
                    setStatus('scraping');
                  }
                });
              } else if (eventType === 'complete') {
                finalData = data;
                if (data.total_fields_found !== undefined) {
                  setTotalFieldsFound(data.total_fields_found);
                }
                if (data.fields) {
                  setAccumulatedFields(data.fields);
                  console.log('💾 Accumulated fields saved:', Object.keys(data.fields).length);
                }
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
      setProgress(90);

      // Extract property data from API response
      const fields = data.fields || {};
      const fieldSources = data.field_sources || {}; // NEW: Track which LLMs provided each field
      const conflicts = data.conflicts || []; // NEW: Track conflicting values

      // If partial data, warn but continue
      if (data.partial) {
        console.warn('⚠️ Partial data received:', data.error || 'Timeout');
      }

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
        pricePerSqft: safeParseNumber(getFieldValue(fields['11_price_per_sqft'])),
        bedrooms: safeParseNumber(getFieldValue(fields['17_bedrooms'])),
        bathrooms: safeParseNumber(getFieldValue(fields['20_total_bathrooms'])),
        sqft: safeParseNumber(getFieldValue(fields['21_living_sqft'])),
        yearBuilt: safeParseNumber(getFieldValue(fields['25_year_built'])) || new Date().getFullYear(),
        smartScore: data.completion_percentage || 75,
        dataCompleteness: data.completion_percentage || 0,
        listingStatus: (getFieldValue(fields['4_listing_status']) || 'Active') as 'Active' | 'Pending' | 'Sold',
        daysOnMarket: 0,
      };

      // Create full property object with all 168 fields if available
      const fullPropertyData = convertApiResponseToFullProperty(fields, scrapedProperty.id, fieldSources, conflicts);

      addProperty(scrapedProperty, fullPropertyData);
      setLastAddedId(scrapedProperty.id);

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
          pricePerSqft: safeParseNumber(getFieldValue(fields['11_price_per_sqft'])),
          bedrooms: safeParseNumber(getFieldValue(fields['17_bedrooms'])),
          bathrooms: safeParseNumber(getFieldValue(fields['20_total_bathrooms'])),
          sqft: safeParseNumber(getFieldValue(fields['21_living_sqft'])),
          yearBuilt: safeParseNumber(getFieldValue(fields['25_year_built'])) || new Date().getFullYear(),
          smartScore: Math.round((Object.keys(fields).length / 168) * 100),
          dataCompleteness: Math.round((Object.keys(fields).length / 168) * 100),
          listingStatus: fields['4_listing_status']?.value || 'Active',
          daysOnMarket: 0,
        };

        const fullPropertyData = convertApiResponseToFullProperty(fields, scrapedProperty.id, {}, []);
        addProperty(scrapedProperty, fullPropertyData);
        setLastAddedId(scrapedProperty.id);
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
        return 'Extracting 168 fields with AI...';
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
        fireplaceCount: createDataField(row['53_fireplace_count'] ? parseInt(row['53_fireplace_count']) : null),
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
        // Distances & Amenities (fields 83-87)
        distanceGroceryMiles: createDataField(row['83_distance_grocery_mi'] ? parseFloat(row['83_distance_grocery_mi']) : null),
        distanceHospitalMiles: createDataField(row['84_distance_hospital_mi'] ? parseFloat(row['84_distance_hospital_mi']) : null),
        distanceAirportMiles: createDataField(row['85_distance_airport_mi'] ? parseFloat(row['85_distance_airport_mi']) : null),
        distanceParkMiles: createDataField(row['86_distance_park_mi'] ? parseFloat(row['86_distance_park_mi']) : null),
        distanceBeachMiles: createDataField(row['87_distance_beach_mi'] ? parseFloat(row['87_distance_beach_mi']) : null),
        // Safety & Crime (fields 88-90)
        crimeIndexViolent: createDataField(row['88_violent_crime_index'] || ''),
        crimeIndexProperty: createDataField(row['89_property_crime_index'] || ''),
        neighborhoodSafetyRating: createDataField(row['90_neighborhood_safety_rating'] || row['77_safety_score'] || ''),
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
        const dataCompleteness = Math.round((filledFieldsCount / 168) * 100);

        // Create full property with all 168 fields from CSV
        let fullProperty = convertCsvToFullProperty(row, propertyId);

        // ENRICHMENT: Call LLM APIs to fill missing fields if enabled
        if (enrichWithAI && address) {
          setStatus('enriching');
          setProgress(50 + (i / dataToImport.length) * 40); // 50-90% for enrichment

          console.log(`🤖 Enriching property ${i + 1}/${dataToImport.length} with AI:`, address);

          try {
            const apiUrl = import.meta.env.VITE_API_URL || '/api/property/search';
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address: address,
                engines: ['perplexity', 'grok'],  // ONLY web search LLMs - Claude/GPT/Gemini disabled for testing
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

      // Get days on market (Stellar MLS Bridge API: DaysOnMarket or CumulativeDaysOnMarket)
      // Check both Bridge API field names AND parsed PDF field names
      const domRaw = getFieldValue(pdfParsedFields,
        'DaysOnMarket', 'CumulativeDaysOnMarket', // Stellar MLS Bridge API field names
        '95_days_on_market_avg', 'days_on_market', 'adom', 'cdom', 'dom' // PDF field names
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
        setCascadeStatus(initializeCascadeStatus());

        const apiUrl = import.meta.env.VITE_API_URL || '';

        // Build full address for API enrichment
        const enrichAddress = unit ? `${street}, ${unit}, ${city}, ${state} ${zip}` : `${street}, ${city}, ${state} ${zip}`;

        console.log('🔍 Enriching with address:', enrichAddress);

        // Use SSE streaming for real-time progress (same as Address mode)
        const response = await fetch(`${apiUrl}/api/property/search-stream`, {
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

        if (!response.body) {
          throw new Error('No response body from enrichment API');
        }

        // Process SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalData: any = null;
        let partialFields: Record<string, any> = { ...pdfParsedFields };

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            if (!finalData && Object.keys(partialFields).length > Object.keys(pdfParsedFields).length) {
              console.log('⚠️ Stream ended without complete event, using partial enriched data');
              finalData = {
                fields: partialFields,
                partial: true,
                total_fields_found: Object.keys(partialFields).length,
              };
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
                  const { source, status: sourceStatus, fieldsFound, currentFields, message } = data;
                  const displayName = getSourceName(source);

                  // Log API progress to debug why Location/Crime/Market fields are empty
                  console.log(`📡 ${displayName}: ${sourceStatus}`, {
                    fieldsFound,
                    message,
                    currentFieldsCount: currentFields ? Object.keys(currentFields).length : 0
                  });

                  if (currentFields && Object.keys(currentFields).length > 0) {
                    partialFields = { ...partialFields, ...currentFields };
                  }

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
                  });
                } else if (eventType === 'complete') {
                  finalData = data;
                } else if (eventType === 'error') {
                  console.error('Enrichment error:', data.error);
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }

        if (finalData && finalData.fields) {
          // Merge enriched data with existing property
          const enrichedFields = { ...pdfParsedFields, ...finalData.fields };
          const enrichedFullProperty = normalizeToProperty(enrichedFields, propertyId, {}, []);

          // Update property card with new data completeness
          const enrichedCard = {
            ...propertyCard,
            dataCompleteness: Math.round((Object.keys(enrichedFields).length / 168) * 100),
          };

          // Update store with enriched data
          addProperty(enrichedCard, enrichedFullProperty);

          console.log('✅ Auto-enrichment complete:', Object.keys(enrichedFields).length, 'total fields');
          setProgress(100);
          setStatus('complete');
        } else {
          // Enrichment failed, but PDF data is already saved
          console.warn('⚠️ Auto-enrichment failed, but PDF data was saved');
          setProgress(100);
          setStatus('complete');
        }

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
                  Stories
                </label>
                <select
                  value={manualForm.stories}
                  onChange={(e) => setManualForm({ ...manualForm, stories: e.target.value })}
                  className="input-glass"
                >
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Property Type
                </label>
                <select
                  value={manualForm.propertyType}
                  onChange={(e) => setManualForm({ ...manualForm, propertyType: e.target.value })}
                  className="input-glass"
                >
                  <option value="Single Family">Single Family</option>
                  <option value="Condo">Condo</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Multi-Family">Multi-Family</option>
                  <option value="Villa">Villa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Lot Size (Sq Ft)
                </label>
                <input
                  type="number"
                  placeholder="5000"
                  value={manualForm.lotSizeSqft}
                  onChange={(e) => setManualForm({ ...manualForm, lotSizeSqft: e.target.value })}
                  className="input-glass"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Garage Spaces
                </label>
                <select
                  value={manualForm.garageSpaces}
                  onChange={(e) => setManualForm({ ...manualForm, garageSpaces: e.target.value })}
                  className="input-glass"
                >
                  <option value="">Select</option>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Pool
                </label>
                <select
                  value={manualForm.poolYn}
                  onChange={(e) => setManualForm({ ...manualForm, poolYn: e.target.value })}
                  className="input-glass"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Roof Type
                </label>
                <select
                  value={manualForm.roofType}
                  onChange={(e) => setManualForm({ ...manualForm, roofType: e.target.value })}
                  className="input-glass"
                >
                  <option value="">Select</option>
                  <option value="Shingle">Shingle</option>
                  <option value="Tile">Tile</option>
                  <option value="Metal">Metal</option>
                  <option value="Flat">Flat</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* HOA & Tax Section */}
            <div className="pt-4 border-t border-white/10">
              <h4 className="text-sm font-medium text-quantum-cyan mb-3">HOA & Taxes</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    HOA?
                  </label>
                  <select
                    value={manualForm.hoaYn}
                    onChange={(e) => setManualForm({ ...manualForm, hoaYn: e.target.value })}
                    className="input-glass"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                {manualForm.hoaYn === 'yes' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      HOA Annual Fee
                    </label>
                    <input
                      type="number"
                      placeholder="1200"
                      value={manualForm.hoaFeeAnnual}
                      onChange={(e) => setManualForm({ ...manualForm, hoaFeeAnnual: e.target.value })}
                      className="input-glass"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Annual Taxes
                  </label>
                  <input
                    type="number"
                    placeholder="3500"
                    value={manualForm.annualTaxes}
                    onChange={(e) => setManualForm({ ...manualForm, annualTaxes: e.target.value })}
                    className="input-glass"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Tax Year
                  </label>
                  <input
                    type="number"
                    placeholder="2024"
                    value={manualForm.taxYear}
                    onChange={(e) => setManualForm({ ...manualForm, taxYear: e.target.value })}
                    className="input-glass"
                  />
                </div>
              </div>
            </div>

            {/* Listing Info Section */}
            <div className="pt-4 border-t border-white/10">
              <h4 className="text-sm font-medium text-quantum-cyan mb-3">Listing Info</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <option value="OffMarket">Off Market</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    MLS #
                  </label>
                  <input
                    type="text"
                    placeholder="TB1234567"
                    value={manualForm.mlsNumber}
                    onChange={(e) => setManualForm({ ...manualForm, mlsNumber: e.target.value })}
                    className="input-glass"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    List Date
                  </label>
                  <input
                    type="date"
                    value={manualForm.listingDate}
                    onChange={(e) => setManualForm({ ...manualForm, listingDate: e.target.value })}
                    className="input-glass"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Last Sale Price
                  </label>
                  <input
                    type="number"
                    placeholder="450000"
                    value={manualForm.lastSalePrice}
                    onChange={(e) => setManualForm({ ...manualForm, lastSalePrice: e.target.value })}
                    className="input-glass"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    County
                  </label>
                  <select
                    value={manualForm.county}
                    onChange={(e) => setManualForm({ ...manualForm, county: e.target.value })}
                    className="input-glass"
                  >
                    <option value="">Select</option>
                    <option value="Pinellas">Pinellas</option>
                    <option value="Pasco">Pasco</option>
                    <option value="Hillsborough">Hillsborough</option>
                    <option value="Manatee">Manatee</option>
                    <option value="Sarasota">Sarasota</option>
                    <option value="Polk">Polk</option>
                    <option value="Hernando">Hernando</option>
                    <option value="Citrus">Citrus</option>
                  </select>
                </div>
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
              AI will extract all 168 property fields from your description
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
              {progress}% complete ({totalFieldsFound || Math.round(progress * 1.68)} of 168 fields)
            </div>
          </div>

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
                      smartScore: Math.round((Object.keys(fields).length / 168) * 100),
                      dataCompleteness: Math.round((Object.keys(fields).length / 168) * 100),
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
    </motion.div>
  );
}
