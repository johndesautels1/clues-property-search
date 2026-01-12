/**
 * CLUES Property Dashboard - Comprehensive Property Detail Page
 * Displays all 181 fields organized by category with data quality indicators
 * Uses schema from src/types/fields-schema.ts as single source of truth
 */

import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Share2,
  Heart,
  Eye,
  Bookmark,
  MapPin,
  Bed,
  Bath,
  Ruler,
  Calendar,
  Trash2,
  DollarSign,
  Home,
  Shield,
  Hammer,
  School,
  TrendingUp,
  TrendingDown,
  Wifi,
  Sun,
  Zap,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Building2,
  Trees,
  Wrench,
  Target,
  AlertCircle,
  AlertTriangle,
  Search,
  Sparkles,
  Loader2,
  FileText,
  Info,
  Waves,
  Wind,
} from 'lucide-react';
import { usePropertyStore } from '@/store/propertyStore';
import { useIsAdmin } from '@/store/authStore';
import { isCalculatedField, getCalculationBadge } from '@/lib/field-calculations';
import { MultiSelectField } from '@/components/MultiSelectField';

// Tavily-enabled fields (54 fields + 6 AVM subfields = 60 total) - can be fetched with Tavily button
// Field 99 removed - calculation-only (auto-calculated from Fields 10 & 98)
const TAVILY_ENABLED_FIELDS = new Set([
  12, '16a', '16b', '16c', '16d', '16e', '16f', 40, 46, 59, 60, 61, 62, 78, 79, 80, 81, 82, 91, 92, 93, 95, 96, 97, 98, 100, 102, 103,
  104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 131, 132, 133, 134, 135, 136,
  137, 138, 170, 171, 174, 177, 178
]);

// Map field keys to numeric field IDs for Tavily API
// CRITICAL: These MUST match the exact field keys in the paths object below (lines 780-927)
const FIELD_KEY_TO_ID_MAP: Record<string, number | string> = {
  '12_market_value_estimate': 12,
  // AVM Subfields (16a-16f)
  '16a_zestimate': '16a',
  '16b_redfin_estimate': '16b',
  '16c_first_american_avm': '16c',
  '16d_quantarium_avm': '16d',
  '16e_ice_avm': '16e',
  '16f_collateral_analytics_avm': '16f',
  '40_roof_age_est': 40,  // NOTE: _est suffix!
  '46_hvac_age': 46,
  '59_recent_renovations': 59,
  '60_permit_history_roof': 60,
  '61_permit_history_hvac': 61,
  '62_permit_history_other': 62,
  '78_noise_level': 78,
  '79_traffic_level': 79,
  '80_walkability_description': 80,  // NOTE: _description suffix!
  '81_public_transit_access': 81,  // NOTE: _access suffix!
  '82_commute_to_city_center': 82,
  '91_median_home_price_neighborhood': 91,  // NOTE: _neighborhood suffix!
  '92_price_per_sqft_recent_avg': 92,  // NOTE: _recent_avg suffix!
  '93_price_to_rent_ratio': 93,
  '95_days_on_market_avg': 95,  // NOTE: _avg suffix!
  '96_inventory_surplus': 96,
  '97_insurance_est_annual': 97,  // NOTE: _est_annual suffix!
  '98_rental_estimate_monthly': 98,  // NOTE: _monthly suffix!
  '99_rental_yield_est': 99,  // NOTE: _est suffix!
  '100_vacancy_rate_neighborhood': 100,  // NOTE: _neighborhood suffix!
  '102_financing_terms': 102,
  '103_comparable_sales': 103,
  '104_electric_provider': 104,
  '105_avg_electric_bill': 105,
  '106_water_provider': 106,
  '107_avg_water_bill': 107,
  '108_sewer_provider': 108,
  '109_natural_gas': 109,
  '110_trash_provider': 110,
  '111_internet_providers_top3': 111,  // NOTE: _top3 suffix!
  '112_max_internet_speed': 112,
  '113_fiber_available': 113,
  '114_cable_tv_provider': 114,
  '115_cell_coverage_quality': 115,  // NOTE: _quality suffix!
  '116_emergency_services_distance': 116,
  '131_view_type': 131,
  '132_lot_features': 132,
  '133_ev_charging': 133,
  '134_smart_home_features': 134,
  '135_accessibility_modifications': 135,  // NOTE: _modifications suffix!
  '136_pet_policy': 136,
  '137_age_restrictions': 137,
  '138_special_assessments': 138,
  // Market Performance (Fields 169-181) - Updated 2026-01-11
  '169_months_of_inventory': 169,
  '170_new_listings_30d': 170,
  '171_homes_sold_30d': 171,
  '172_median_dom_zip': 172,
  '173_price_reduced_percent': 173,
  '174_homes_under_contract': 174,
  '175_market_type': 175,
  '176_avg_sale_to_list_percent': 176,
  '177_avg_days_to_pending': 177,
  '178_multiple_offers_likelihood': 178,
  '179_appreciation_percent': 179,
  '180_price_trend': 180,
  '181_rent_zestimate': 181,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface DataFieldProps {
  label: string;
  value: any;
  icon?: React.ReactNode;
  format?: 'currency' | 'number' | 'percent' | 'date' | 'text';
  // LLM metadata for color coding (ADMIN ONLY)
  confidence?: string;
  sources?: string[]; // Primary sources (MLS, Google, APIs, etc.)
  llmSources?: string[]; // LLM-specific sources
  hasConflict?: boolean;
  conflictValues?: Array<{ source: string; value: any }>;
  fieldKey?: string; // Field key for retry API calls
  onRetry?: (fieldKey: string, llmName: string) => void;
  isRetrying?: boolean;
  isAdmin?: boolean; // Controls visibility of source info
  // Validation status from arbitration service
  validationStatus?: 'passed' | 'failed' | 'warning';
  validationMessage?: string;
  // Single-source hallucination warning
  singleSourceWarning?: boolean;
}

const DataField = ({ label, value, icon, format = 'text', confidence, sources, llmSources, hasConflict, conflictValues, fieldKey, onRetry, isRetrying, isAdmin = false, validationStatus, validationMessage, singleSourceWarning }: DataFieldProps) => {
  const [showRetry, setShowRetry] = useState(false);

  // Don't render if no value AND not explicitly showing missing data
  const isMissing = value === null || value === undefined || value === '';
  const needsRetry = isMissing || confidence === 'Low' || confidence === 'Unverified';

  const formattedValue = formatValue(value, format);

  // Determine background color based on status (ADMIN ONLY - users see neutral styling)
  let bgColor = 'bg-transparent';
  let borderColor = 'border-white/5';
  let statusBadge = null;

  // MISSING FIELDS - Orange highlight for ALL users (not just admins)
  if (isMissing) {
    bgColor = 'bg-orange-500/10';
    borderColor = 'border-orange-400/30';
  }

  // Only show color coding and status badges to admins
  if (isAdmin) {
    // VALIDATION FAILURES get highest priority - faint red highlight
    if (validationStatus === 'failed') {
      bgColor = 'bg-red-500/15';
      borderColor = 'border-red-500/40';
      statusBadge = (
        <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded text-xs">
          <div className="flex items-center gap-1 text-red-400 font-semibold">
            <AlertCircle className="w-3 h-3" />
            VALIDATION FAILED
          </div>
          {validationMessage && (
            <div className="text-red-300 mt-1">{validationMessage}</div>
          )}
        </div>
      );
    } else if (singleSourceWarning) {
      // Single-source hallucination warning - faint orange highlight
      bgColor = 'bg-orange-500/10';
      borderColor = 'border-orange-500/30';
      statusBadge = (
        <div className="mt-2 p-2 bg-orange-500/20 border border-orange-500/30 rounded text-xs">
          <div className="flex items-center gap-1 text-orange-400 font-semibold">
            <AlertCircle className="w-3 h-3" />
            SINGLE SOURCE WARNING
          </div>
          <div className="text-orange-300 mt-1">This data came from only one LLM source - verify independently</div>
        </div>
      );
    } else if (hasConflict && conflictValues && conflictValues.length > 0) {
      // 🟡 YELLOW: Conflicting data from multiple LLMs
      // Deduplicate conflicts (same source + value) to prevent "Washer, Dryer" x7 bug
      const uniqueConflicts = conflictValues.reduce((acc, cv) => {
        const key = `${cv.source}::${String(cv.value)}`;
        if (!acc.has(key)) {
          acc.set(key, cv);
        }
        return acc;
      }, new Map<string, typeof conflictValues[0]>());

      const deduplicatedConflicts = Array.from(uniqueConflicts.values());

      bgColor = 'bg-yellow-500/10';
      borderColor = 'border-yellow-500/30';
      statusBadge = (
        <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs">
          <div className="flex items-center gap-1 text-yellow-400 font-semibold mb-1">
            <AlertCircle className="w-3 h-3" />
            CONFLICT DETECTED
          </div>
          <div className="text-gray-300">
            {deduplicatedConflicts.map((cv, idx) => (
              <div key={idx} className="ml-4">
                • {cv.source}: {formatValue(cv.value, format)}
              </div>
            ))}
          </div>
        </div>
      );
    } else if (isMissing) {
      // ⚪ WHITE: Missing data (no LLM found it)
      bgColor = 'bg-white/5';
      borderColor = 'border-white/20';
      statusBadge = (
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400 italic">Data not found by any source</div>
          <button
            onClick={() => setShowRetry(!showRetry)}
            className="text-xs text-quantum-cyan hover:underline"
          >
            Retry with LLM
          </button>
        </div>
      );
    } else if (confidence === 'Low' || confidence === 'Unverified') {
      // 🔴 RED: Suspected hallucination (low confidence) - but SKIP for Perplexity/Grok (they use web search)
      const isWebSearchLLM = llmSources && llmSources.some(s =>
        s.toLowerCase().includes('perplexity') || s.toLowerCase().includes('grok')
      );

      if (!isWebSearchLLM) {
        bgColor = 'bg-red-500/10';
        borderColor = 'border-red-500/30';
        statusBadge = (
          <div className="flex items-center justify-between">
            <div className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Low confidence - verify this data
            </div>
            <button
              onClick={() => setShowRetry(!showRetry)}
              className="text-xs text-quantum-cyan hover:underline"
            >
              Retry with LLM
            </button>
          </div>
        );
      }
    } else if (confidence === 'High' && !hasConflict) {
      // 🟢 GREEN: Good data (high confidence, no conflicts)
      bgColor = 'bg-green-500/5';
      borderColor = 'border-green-500/20';
    }
  }

  return (
    <div className={`flex flex-col gap-2 py-3 px-3 rounded-lg border ${borderColor} ${bgColor} last:border-b-0`}>
      <div className="flex items-start gap-3">
        {icon && <div className="text-quantum-cyan mt-0.5">{icon}</div>}
        <div className="flex-1">
          <span className="text-sm text-gray-400">{label}</span>
          <p className="text-white font-medium">
            {isMissing ? <span className="text-gray-500 italic">Not available</span> : formattedValue}
          </p>
          {/* SOURCE INFO - ADMIN ONLY */}
          {isAdmin && (sources || llmSources) && ((sources && sources.length > 0) || (llmSources && llmSources.length > 0)) && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-gray-500">
                Source: {
                  llmSources && llmSources.length > 0
                    ? llmSources.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')
                    : sources ? sources.join(', ') : 'Unknown'
                }
              </span>
              {/* Calculated Field Badge */}
              {isCalculatedField({ sources: llmSources || sources || [] }) && (
                <span className="px-2 py-0.5 bg-quantum-cyan/20 text-quantum-cyan text-[10px] font-semibold rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {getCalculationBadge({ sources: llmSources || sources || [] })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      {/* STATUS BADGES - Show to ALL users for missing fields, ADMIN ONLY for other statuses */}
      {(isMissing || isAdmin) && statusBadge}

      {/* Tavily button - ALWAYS VISIBLE for missing/low-confidence fields (ALL USERS) */}
      {needsRetry && fieldKey && (() => {
        const fieldIdMatch = fieldKey?.match(/^(\d+)/);
        const fieldId = fieldIdMatch ? parseInt(fieldIdMatch[1]) : null;
        const isTavilyEnabled = fieldId && TAVILY_ENABLED_FIELDS.has(fieldId);

        return isTavilyEnabled && globalTavilyHandler && (
          <div className="mt-2">
            <button
              onClick={() => globalTavilyHandler!(fieldKey)}
              disabled={isRetrying}
              className={`w-full px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-500/40 transition-all ${isRetrying ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-cyan-500/20'}`}
            >
              <span className="flex items-center justify-center gap-2">
                <Search className="w-4 h-4" />
                🔍 Fetch with Tavily (Targeted Web Search)
              </span>
            </button>
            <div className="text-[10px] text-gray-600 mt-1 text-center">
              Fast • Field-specific sources (Redfin, FCC, PlugShare, etc.) • 30s max
            </div>
          </div>
        );
      })()}

      {/* LLM Retry UI - ADMIN ONLY (toggle on click) */}
      {isAdmin && showRetry && needsRetry && fieldKey && onRetry && (
        <div className="mt-2 p-3 bg-black/30 border border-quantum-cyan/20 rounded-lg">
          <div className="text-xs text-gray-500 mb-1.5">🤖 LLM retry (slower, less reliable):</div>
          <div className="flex flex-wrap gap-2">
            {['Perplexity', 'Gemini', 'GPT-4o', 'Grok', 'Claude Sonnet', 'Claude Opus'].map((llm) => (
              <button
                key={llm}
                onClick={() => onRetry(fieldKey, llm)}
                disabled={isRetrying}
                className={`px-3 py-1 text-xs rounded-full bg-quantum-cyan/10 hover:bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/30 transition-colors ${isRetrying ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {llm}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const formatValue = (value: any, format: string): string => {
  if (value === null || value === undefined || value === 'null' || value === 'undefined' || value === '') return '';

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(Number(value));
    case 'number':
      return new Intl.NumberFormat('en-US').format(Number(value));
    case 'percent':
      return `${Number(value).toFixed(2)}%`;
    case 'date':
      return new Date(value).toLocaleDateString();
    default:
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (Array.isArray(value)) {
        // Handle arrays of objects (e.g., comparable sales)
        return value.map(item => {
          if (typeof item === 'object' && item !== null) {
            // For comparable sales, format as "address: $price"
            if (item.address && item.price) {
              return `${item.address}: $${item.price.toLocaleString()}`;
            }
            // Generic object: try to JSON stringify or extract first string value
            const firstStringValue = Object.values(item).find(v => typeof v === 'string');
            if (firstStringValue) return firstStringValue;
            try {
              return JSON.stringify(item);
            } catch {
              return '[Complex Object]';
            }
          }
          return String(item);
        }).join('; ');
      }
      // Handle plain objects
      if (typeof value === 'object' && value !== null) {
        try {
          return JSON.stringify(value);
        } catch {
          return '[Object]';
        }
      }
      return String(value);
  }
};

// Helper to extract DataField metadata for display
interface DataFieldInput<T> {
  value: T | null;
  confidence?: string;
  sources?: string[]; // Primary sources (MLS, Google, APIs, etc.)
  llmSources?: string[]; // LLM-specific sources
  hasConflict?: boolean;
  conflictValues?: Array<{ source: string; value: any }>;
  validationStatus?: 'passed' | 'failed' | 'warning' | 'valid' | 'single_source_warning';
  validationMessage?: string;
}

// This will be set by the component
let globalRetryHandler: ((fieldKey: string, llmName: string) => void) | undefined;
let globalTavilyHandler: ((fieldKey: string) => void) | undefined;
let globalIsRetrying = false;
let globalIsAdmin = false; // Controls source visibility (admin vs user view)

const renderDataField = (
  label: string,
  field: DataFieldInput<any> | undefined,
  format: 'currency' | 'number' | 'percent' | 'date' | 'text' = 'text',
  icon?: React.ReactNode,
  fieldKey?: string
) => {
  // Handle undefined fields (allows arbitration system to fill gaps from lower tiers)
  if (!field) {
    field = { value: null };
  }

  // Filter out boolean values for text fields (prevent "true"/"false" display)
  if (format === 'text' && typeof field.value === 'boolean') {
    field = { value: null };
  }

  // Map API validationStatus values to DataField prop format
  const validationStatus = field.validationStatus === 'single_source_warning' ? undefined :
    (field.validationStatus === 'valid' ? 'passed' : field.validationStatus);
  const singleSourceWarning = field.validationStatus === 'single_source_warning';

  return (
    <DataField
      label={label}
      value={field.value}
      format={format}
      icon={icon}
      confidence={field.confidence}
      sources={field.sources}
      llmSources={field.llmSources}
      hasConflict={field.hasConflict}
      conflictValues={field.conflictValues}
      fieldKey={fieldKey}
      onRetry={globalRetryHandler}
      isRetrying={globalIsRetrying}
      isAdmin={globalIsAdmin}
      validationStatus={validationStatus as 'passed' | 'failed' | 'warning' | undefined}
      validationMessage={field.validationMessage}
      singleSourceWarning={singleSourceWarning}
    />
  );
};

// Helper to render multiselect fields with verification UI
const renderMultiSelectField = (
  label: string,
  field: DataFieldInput<any> | undefined,
  fieldKey?: string
) => {
  // Handle undefined fields
  if (!field) {
    field = { value: null };
  }

  return (
    <MultiSelectField
      label={label}
      value={field.value}
      fieldKey={fieldKey}
      confidence={field.confidence}
      sources={field.sources}
      llmSources={field.llmSources}
      hasConflict={field.hasConflict}
      isAdmin={globalIsAdmin}
    />
  );
};

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const Section = ({ title, icon, children, defaultExpanded = true }: SectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <motion.div variants={itemVariants} className="glass-card overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-quantum-cyan">{icon}</div>
          <h2 className="font-semibold text-white text-lg">{title}</h2>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="p-4 pt-0"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
};

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPropertyById, getFullPropertyById, removeProperty, updateFullProperty, updateProperty, markPropertyAsViewed, saveProperty, unsaveProperty } = usePropertyStore();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Error state for consistent UX
  const isAdmin = useIsAdmin(); // Check if current user is admin (agent/broker)

  const property = id ? getPropertyById(id) : undefined;
  const fullProperty = id ? getFullPropertyById(id) : undefined;

  // Mark property as viewed when component mounts or id changes
  useEffect(() => {
    if (id) {
      markPropertyAsViewed(id);
    }
  }, [id, markPropertyAsViewed]);

  // Calculate views in last 7 days
  const getViewsLast7Days = () => {
    if (!property?.viewHistory) return 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return property.viewHistory.filter(timestamp => new Date(timestamp) >= sevenDaysAgo).length;
  };

  // Check if property is saved by current user
  const currentUserId = 'anonymous'; // TODO: Replace with actual user ID from auth store
  const isSaved = property?.savedByUsers?.includes(currentUserId) || false;

  // Toggle save/unsave
  const handleToggleSave = () => {
    if (!id) return;
    if (isSaved) {
      unsaveProperty(id, currentUserId);
    } else {
      saveProperty(id, currentUserId);
    }
  };

  // Handler for "Enrich with APIs" button - calls search API to add more data
  const handleEnrichWithApis = async () => {
    if (!fullProperty || !id || !property) return;

    const address = fullProperty.address.fullAddress.value;
    if (!address) {
      alert('No address found for this property');
      return;
    }

    setIsEnriching(true);
    setEnrichProgress(10);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';

      // Convert existing property to flat fields for additive merging
      const { propertyToFlatFields } = await import('@/lib/field-normalizer');
      const existingFields = propertyToFlatFields(fullProperty);
      console.log('📤 Sending existing fields for merge:', Object.keys(existingFields).length, 'fields');

      // Use SSE streaming for real-time progress
      const response = await fetch(`${apiUrl}/api/property/search-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          engines: ['perplexity', 'gemini', 'gpt', 'claude-sonnet', 'grok', 'claude-opus'],  // Full cascade for maximum accuracy
          skipLLMs: false,
          existingFields, // CRITICAL: Pass existing fields for additive merging
          skipApis: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalData: any = null;

      if (!reader) {
        throw new Error('No response body');
      }

      let partialFields: Record<string, any> = {};  // Collect partial data

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Use partial data if no complete event received
          if (!finalData && Object.keys(partialFields).length > 0) {
            console.warn('⚠️ Stream ended without complete event, using partial data:', Object.keys(partialFields).length, 'fields');
            const fieldsCount = Object.keys(partialFields).length;
            finalData = {
              fields: partialFields,
              partial: true,
              total_fields_found: fieldsCount,
              completion_percentage: Math.round((fieldsCount / 181) * 100),
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
                const { fieldsFound, currentFields } = data;

                // 🔥 FIX: Capture partial fields as they arrive
                if (currentFields && Object.keys(currentFields).length > 0) {
                  partialFields = { ...partialFields, ...currentFields };
                  console.log(`💾 Enrich: Captured ${Object.keys(currentFields).length} fields, total: ${Object.keys(partialFields).length}`);
                }

                setEnrichProgress(Math.min(Math.round((fieldsFound / 181) * 100), 99));
              } else if (eventType === 'complete') {
                finalData = data;
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

      // Convert API response to Property format and merge
      const { normalizeToProperty } = await import('@/lib/field-normalizer');
      const enrichedProperty = normalizeToProperty(finalData.fields || {}, id, {}, []);

      // Add publicRemarks metadata if available
      if (finalData.publicRemarks) {
        enrichedProperty.publicRemarks = finalData.publicRemarks;
      }
      if (finalData.publicRemarksExtracted) {
        enrichedProperty.publicRemarksExtracted = finalData.publicRemarksExtracted;
      }

      // FIXED 2026-01-12: Store actual field count from API
      if (finalData.total_fields_found !== undefined) {
        enrichedProperty.totalFieldsFound = finalData.total_fields_found;
      }
      if (finalData.completion_percentage !== undefined) {
        enrichedProperty.dataCompleteness = finalData.completion_percentage;
      }

      // This will trigger additive merge due to our updated store
      updateFullProperty(id, enrichedProperty);

      // Update property card with new data completeness
      if (finalData.completion_percentage !== undefined || finalData.total_fields_found !== undefined) {
        updateProperty(id, {
          dataCompleteness: finalData.completion_percentage,
          // smartScore is calculated via 2-tier system during comparison, not here
        });
      }

      setEnrichProgress(100);
      alert(`✅ Property enriched! Added data from ${Object.keys(finalData.fields || {}).length} fields.`);

    } catch (error) {
      console.error('Enrich error:', error);
      setErrorMessage(`Failed to enrich property: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsEnriching(false);
      setEnrichProgress(0);
    }
  };

  // Retry handler - calls API with specific LLM (ADMIN ONLY)
  const handleRetryField = async (fieldKey: string, llmName: string) => {
    globalIsRetrying = true;
    if (!fullProperty || !id) return;

    setIsRetrying(true);
    try {
      const apiUrl = '/api/property/retry-llm';
      const address = fullProperty.address?.fullAddress?.value || fullProperty.address?.streetAddress?.value || '';

      if (!address) {
        console.error('[RETRY-LLM] No address found in property');
        setErrorMessage('Cannot retry: No address found for this property');
        setIsRetrying(false);
        globalIsRetrying = false;
        return;
      }

      // Map display names to engine IDs
      const engineMap: Record<string, string> = {
        'Claude Opus': 'claude-opus',
        'GPT': 'gpt',
        'Grok': 'grok',
        'Claude Sonnet': 'claude-sonnet',
        'Copilot': 'copilot',
        'Gemini': 'gemini',
        'Perplexity': 'perplexity',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          engines: [engineMap[llmName] || llmName.toLowerCase()],
          skipLLMs: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[RETRY-LLM] Response:`, data);
        console.log(`[RETRY-LLM] Looking for fieldKey: ${fieldKey}`);
        console.log(`[RETRY-LLM] Available fields:`, Object.keys(data.fields || {}));

        // Check if the specific field was found, OR if ANY fields were returned
        const newFieldData = data.fields[fieldKey];
        const totalFieldsReturned = Object.keys(data.fields || {}).length;

        if (totalFieldsReturned > 0) {
          const updated = JSON.parse(JSON.stringify(fullProperty));
          const paths: Record<string, [string, string]> = {
            // GROUP 1: Address & Identity (1-9)
            '1_full_address': ['address', 'fullAddress'],
            '2_mls_primary': ['address', 'mlsPrimary'],
            '3_new_construction_yn': ['address', 'newConstructionYN'],
            '4_listing_status': ['address', 'listingStatus'],
            '5_listing_date': ['address', 'listingDate'],
            '6_neighborhood': ['address', 'neighborhoodName'],
            '7_county': ['address', 'county'],
            '8_zip_code': ['address', 'zipCode'],
            '9_parcel_id': ['details', 'parcelId'],
            // GROUP 2: Pricing & Value (10-16)
            '10_listing_price': ['address', 'listingPrice'],
            '11_price_per_sqft': ['address', 'pricePerSqft'],
            '12_market_value_estimate': ['details', 'marketValueEstimate'],
            '13_last_sale_date': ['details', 'lastSaleDate'],
            '14_last_sale_price': ['details', 'lastSalePrice'],
            '15_assessed_value': ['details', 'assessedValue'],
            '16_avms': ['financial', 'avms'],
            // AVM Subfields (16a-16f) - Individual AVM Sources
            '16a_zestimate': ['financial', 'zestimate'],
            '16b_redfin_estimate': ['financial', 'redfinEstimate'],
            '16c_first_american_avm': ['financial', 'firstAmericanAvm'],
            '16d_quantarium_avm': ['financial', 'quantariumAvm'],
            '16e_ice_avm': ['financial', 'iceAvm'],
            '16f_collateral_analytics_avm': ['financial', 'collateralAnalyticsAvm'],
            // GROUP 3: Property Basics (17-29)
            '17_bedrooms': ['details', 'bedrooms'],
            '18_full_bathrooms': ['details', 'fullBathrooms'],
            '19_half_bathrooms': ['details', 'halfBathrooms'],
            '20_total_bathrooms': ['details', 'totalBathrooms'],
            '21_living_sqft': ['details', 'livingSqft'],
            '22_total_sqft_under_roof': ['details', 'totalSqftUnderRoof'],
            '23_lot_size_sqft': ['details', 'lotSizeSqft'],
            '24_lot_size_acres': ['details', 'lotSizeAcres'],
            '25_year_built': ['details', 'yearBuilt'],
            '26_property_type': ['details', 'propertyType'],
            '27_stories': ['details', 'stories'],
            '28_garage_spaces': ['details', 'garageSpaces'],
            '29_parking_total': ['details', 'parkingTotal'],
            // GROUP 4: HOA & Taxes (30-38)
            '30_hoa_yn': ['details', 'hoaYn'],
            '31_association_fee': ['details', 'associationFeeAnnualized'],
            '32_hoa_name': ['details', 'hoaName'],
            '33_hoa_includes': ['details', 'hoaIncludes'],
            '34_ownership_type': ['details', 'ownershipType'],
            '35_annual_taxes': ['details', 'annualTaxes'],
            '36_tax_year': ['details', 'taxYear'],
            '37_property_tax_rate': ['financial', 'propertyTaxRate'],
            '38_tax_exemptions': ['financial', 'taxExemptions'],
            // GROUP 5: Structure & Systems (39-48)
            '39_roof_type': ['structural', 'roofType'],
            '40_roof_age_est': ['structural', 'roofAgeEst'],
            '41_exterior_material': ['structural', 'exteriorMaterial'],
            '42_foundation': ['structural', 'foundation'],
            '43_water_heater_type': ['structural', 'waterHeaterType'],
            '44_garage_type': ['structural', 'garageType'],
            '45_hvac_type': ['structural', 'hvacType'],
            '46_hvac_age': ['structural', 'hvacAge'],
            '47_laundry_type': ['structural', 'laundryType'],
            '48_interior_condition': ['structural', 'interiorCondition'],
            // GROUP 6: Interior Features (49-53)
            '49_flooring_type': ['structural', 'flooringType'],
            '50_kitchen_features': ['structural', 'kitchenFeatures'],
            '51_appliances_included': ['structural', 'appliancesIncluded'],
            '52_fireplace_yn': ['structural', 'fireplaceYn'],
            '53_primary_br_location': ['structural', 'primaryBrLocation'],
            // GROUP 7: Exterior Features (54-58)
            '54_pool_yn': ['structural', 'poolYn'],
            '55_pool_type': ['structural', 'poolType'],
            '56_deck_patio': ['structural', 'deckPatio'],
            '57_fence': ['structural', 'fence'],
            '58_landscaping': ['structural', 'landscaping'],
            // GROUP 8: Permits & Renovations (59-62)
            '59_recent_renovations': ['structural', 'recentRenovations'],
            '60_permit_history_roof': ['structural', 'permitHistoryRoof'],
            '61_permit_history_hvac': ['structural', 'permitHistoryHvac'],
            '62_permit_history_other': ['structural', 'permitHistoryPoolAdditions'],
            // GROUP 9: Assigned Schools (63-73)
            '63_school_district': ['location', 'schoolDistrictName'],
            '64_elevation_feet': ['location', 'elevationFeet'],
            '65_elementary_school': ['location', 'assignedElementary'],
            '66_elementary_rating': ['location', 'elementaryRating'],
            '67_elementary_distance_mi': ['location', 'elementaryDistanceMiles'],
            '68_middle_school': ['location', 'assignedMiddle'],
            '69_middle_rating': ['location', 'middleRating'],
            '70_middle_distance_mi': ['location', 'middleDistanceMiles'],
            '71_high_school': ['location', 'assignedHigh'],
            '72_high_rating': ['location', 'highRating'],
            '73_high_distance_mi': ['location', 'highDistanceMiles'],
            // GROUP 10: Location Scores (74-82)
            '74_walk_score': ['location', 'walkScore'],
            '75_transit_score': ['location', 'transitScore'],
            '76_bike_score': ['location', 'bikeScore'],
            '77_safety_score': ['location', 'neighborhoodSafetyRating'],
            '78_noise_level': ['location', 'noiseLevel'],
            '79_traffic_level': ['location', 'trafficLevel'],
            '80_walkability_description': ['location', 'walkabilityDescription'],
            '81_public_transit_access': ['location', 'publicTransitAccess'],
            '82_commute_to_city_center': ['location', 'commuteTimeCityCenter'],
            // GROUP 11: Distances & Amenities (83-87)
            '83_distance_grocery_mi': ['location', 'distanceGroceryMiles'],
            '84_distance_hospital_mi': ['location', 'distanceHospitalMiles'],
            '85_distance_airport_mi': ['location', 'distanceAirportMiles'],
            '86_distance_park_mi': ['location', 'distanceParkMiles'],
            '87_distance_beach_mi': ['location', 'distanceBeachMiles'],
            // GROUP 12: Safety & Crime (88-90)
            '88_violent_crime_index': ['location', 'crimeIndexViolent'],
            '89_property_crime_index': ['location', 'crimeIndexProperty'],
            '90_neighborhood_safety_rating': ['location', 'neighborhoodSafetyRating'],
            // GROUP 13: Market & Investment Data (91-103)
            '91_median_home_price_neighborhood': ['financial', 'medianHomePriceNeighborhood'],
            '92_price_per_sqft_recent_avg': ['financial', 'pricePerSqftRecentAvg'],
            '93_price_to_rent_ratio': ['financial', 'priceToRentRatio'],
            '94_price_vs_median_percent': ['financial', 'priceVsMedianPercent'],
            '95_days_on_market_avg': ['financial', 'daysOnMarketAvg'],
            '96_inventory_surplus': ['financial', 'inventorySurplus'],
            '97_insurance_est_annual': ['financial', 'insuranceEstAnnual'],
            '98_rental_estimate_monthly': ['financial', 'rentalEstimateMonthly'],
            '99_rental_yield_est': ['financial', 'rentalYieldEst'],
            '100_vacancy_rate_neighborhood': ['financial', 'vacancyRateNeighborhood'],
            '101_cap_rate_est': ['financial', 'capRateEst'],
            '102_financing_terms': ['financial', 'financingTerms'],
            '103_comparable_sales': ['financial', 'comparableSalesLast3'],
            // GROUP 14: Utilities & Connectivity (104-116)
            '104_electric_provider': ['utilities', 'electricProvider'],
            '105_avg_electric_bill': ['utilities', 'avgElectricBill'],
            '106_water_provider': ['utilities', 'waterProvider'],
            '107_avg_water_bill': ['utilities', 'avgWaterBill'],
            '108_sewer_provider': ['utilities', 'sewerProvider'],
            '109_natural_gas': ['utilities', 'naturalGas'],
            '110_trash_provider': ['utilities', 'trashProvider'],
            '111_internet_providers_top3': ['utilities', 'internetProvidersTop3'],
            '112_max_internet_speed': ['utilities', 'maxInternetSpeed'],
            '113_fiber_available': ['utilities', 'fiberAvailable'],
            '114_cable_tv_provider': ['utilities', 'cableTvProvider'],
            '115_cell_coverage_quality': ['utilities', 'cellCoverageQuality'],
            '116_emergency_services_distance': ['utilities', 'emergencyServicesDistance'],
            // GROUP 15: Environment & Risk (117-130)
            '117_air_quality_index': ['utilities', 'airQualityIndexCurrent'],
            '118_air_quality_grade': ['utilities', 'airQualityGrade'],
            '119_flood_zone': ['utilities', 'floodZone'],
            '120_flood_risk_level': ['utilities', 'floodRiskLevel'],
            '121_climate_risk': ['utilities', 'climateRiskWildfireFlood'],
            '122_wildfire_risk': ['utilities', 'wildfireRisk'],
            '123_earthquake_risk': ['utilities', 'earthquakeRisk'],
            '124_hurricane_risk': ['utilities', 'hurricaneRisk'],
            '125_tornado_risk': ['utilities', 'tornadoRisk'],
            '126_radon_risk': ['utilities', 'radonRisk'],
            '127_superfund_site_nearby': ['utilities', 'superfundSiteNearby'],
            '128_sea_level_rise_risk': ['utilities', 'seaLevelRiseRisk'],
            '129_noise_level_db_est': ['utilities', 'noiseLevelDbEst'],
            '130_solar_potential': ['utilities', 'solarPotential'],
            // GROUP 16: Additional Features (131-138)
            '131_view_type': ['utilities', 'viewType'],
            '132_lot_features': ['utilities', 'lotFeatures'],
            '133_ev_charging': ['utilities', 'evChargingYn'],
            '134_smart_home_features': ['utilities', 'smartHomeFeatures'],
            '135_accessibility_modifications': ['utilities', 'accessibilityMods'],
            '136_pet_policy': ['utilities', 'petPolicy'],
            '137_age_restrictions': ['utilities', 'ageRestrictions'],
            '138_special_assessments': ['utilities', 'specialAssessments'],
          };

          // Update ALL fields returned by the LLM, not just the one clicked
          let fieldsUpdated = 0;
          let requestedFieldValue = null;

          for (const [returnedFieldKey, fieldData] of Object.entries(data.fields)) {
            const path = paths[returnedFieldKey];
            if (path && updated[path[0]] && (fieldData as any)?.value != null) {
              updated[path[0]][path[1]] = {
                value: (fieldData as any).value,
                confidence: 'Medium',
                notes: `Updated by ${llmName}`,
                sources: [llmName],
                llmSources: [llmName]
              };
              fieldsUpdated++;

              // Track if we found the specific field that was clicked
              if (returnedFieldKey === fieldKey) {
                requestedFieldValue = (fieldData as any).value;
              }
            }
          }

          if (fieldsUpdated > 0) {
            updateFullProperty(id, updated);
            if (requestedFieldValue !== null) {
              alert(`✅ ${llmName}: ${requestedFieldValue} (+ ${fieldsUpdated - 1} other fields updated)`);
            } else {
              alert(`✅ ${llmName}: Updated ${fieldsUpdated} fields (requested field not found)`);
            }
          } else {
            alert(`❌ ${llmName} returned data but no matching fields`);
          }
        } else {
          alert(`❌ ${llmName} found no data for this property`);
        }
      } else {
        // Parse error response to show actual error message
        try {
          const errorData = await response.json();
          const errorMsg = errorData.error || response.statusText || 'Unknown error';
          alert(`❌ Error calling ${llmName} API (${response.status})\n\n${errorMsg}`);
          console.error(`[RETRY-LLM] ${llmName} API error:`, errorData);
        } catch (parseError) {
          // If JSON parsing fails, show generic error with status
          alert(`❌ Error calling ${llmName} API (${response.status}): ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Retry error:', error);
      setErrorMessage(`Failed to retry with ${llmName}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRetrying(false);
      globalIsRetrying = false;
    }
  };

  // Tavily handler - fetches single field with targeted web search (ADMIN ONLY)
  const handleTavilyField = async (fieldKey: string) => {
    if (!fullProperty || !id) return;

    setIsRetrying(true);
    try {
      const apiUrl = '/api/property/fetch-tavily-field';
      const address = fullProperty.address?.fullAddress?.value || fullProperty.address?.streetAddress?.value || '';
      const city = fullProperty.address?.city?.value || '';
      const state = fullProperty.address?.state?.value || '';
      const zip = fullProperty.address?.zipCode?.value || '';

      if (!address) {
        console.error('[TAVILY-FIELD] No address found in property');
        setErrorMessage('Cannot fetch with Tavily: No address found for this property');
        setIsRetrying(false);
        return;
      }

      // Convert field key to numeric ID
      const fieldId = FIELD_KEY_TO_ID_MAP[fieldKey];
      if (!fieldId) {
        console.error('[TAVILY-FIELD] Unknown field key:', fieldKey);
        setErrorMessage(`Unknown field: ${fieldKey}`);
        setIsRetrying(false);
        return;
      }

      console.log(`[TAVILY-FIELD] Fetching field ${fieldId} (${fieldKey}) for ${address}`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldId,
          address,
          city,
          state,
          zip,
          propertyId: id,
          propertyData: fullProperty // For calculated fields
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[TAVILY-FIELD] Response:`, data);

        if (data.success && data.results) {
          const result = data.results;

          if (result.value !== null && result.value !== undefined) {
            // Success - found data
            alert(`✅ Tavily found: ${JSON.stringify(result.value)}\n\nSource: ${result.sourceName || 'N/A'}\nConfidence: ${result.confidence}`);

            // Refresh property data to show updated value
            const refreshed = await getFullPropertyById(id);
            if (refreshed) {
              updateFullProperty(id, refreshed);
            }
          } else {
            // No data found
            const note = result.note || 'No data found in top sources';
            alert(`ℹ️ Tavily could not find this field\n\n${note}\n\nTry "Retry with LLM" instead.`);
          }
        } else {
          alert('❌ Tavily search failed - check console for details');
        }
      } else {
        alert(`Error calling Tavily API: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Tavily fetch error:', error);
      setErrorMessage(`Failed to fetch with Tavily: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRetrying(false);
    }
  };

  // Set global handlers and admin state
  globalRetryHandler = handleRetryField;
  globalTavilyHandler = handleTavilyField;
  globalIsRetrying = isRetrying;
  globalIsAdmin = isAdmin; // Pass admin state to renderDataField

  console.log('🔎 DETAIL PAGE: Property ID:', id);
  console.log('📇 Basic property:', property);
  console.log('📋 Full property:', fullProperty);
  if (fullProperty) {
    console.log('✅ Full property has address:', fullProperty.address);
    console.log('✅ Full property has details:', fullProperty.details);
    console.log('✅ Full property has location:', fullProperty.location);
    console.log('🔍 ACTUAL VALUES:');
    console.log('  - Full Address:', fullProperty.address.fullAddress.value);
    console.log('  - MLS Primary:', fullProperty.address.mlsPrimary.value);
    console.log('  - Bedrooms:', fullProperty.details.bedrooms.value);
    console.log('  - Living Sqft:', fullProperty.details.livingSqft.value);
    console.log('  - Elementary School:', fullProperty.location.assignedElementary.value);
    console.log('🆕 EXTENDED MLS DATA CHECK:');
    console.log('  - Has extendedMLS?:', !!fullProperty.extendedMLS);
    if (fullProperty.extendedMLS) {
      console.log('  - Extended MLS keys:', Object.keys(fullProperty.extendedMLS));
      console.log('  - Extended MLS data:', fullProperty.extendedMLS);
    } else {
      console.log('  ⚠️ NO EXTENDED MLS DATA - Property may need to be re-searched from Stellar MLS');
    }
  } else {
    console.log('❌ NO FULL PROPERTY DATA FOUND!');
  }

  const handleDelete = () => {
    if (id && confirm('Are you sure you want to delete this property?')) {
      removeProperty(id);
      navigate('/properties');
    }
  };

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-4">Property Not Found</h2>
          <p className="text-gray-400 mb-6">This property may have been deleted.</p>
          <Link to="/properties" className="btn-quantum">
            <ArrowLeft className="w-5 h-5" />
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen pb-20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="sticky top-0 z-40 glass-card border-b border-white/10"
      >
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <Link to="/properties" className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex gap-2">
            {/* Enrich with APIs Button */}
            <button
              onClick={handleEnrichWithApis}
              disabled={isEnriching}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                isEnriching
                  ? 'bg-quantum-cyan/20 text-quantum-cyan cursor-wait'
                  : 'bg-quantum-cyan/10 hover:bg-quantum-cyan/20 text-quantum-cyan'
              }`}
              title="Add data from APIs (WalkScore, FEMA, etc.) and LLMs"
            >
              {isEnriching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">{enrichProgress}%</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm hidden md:inline">Enrich with APIs</span>
                </>
              )}
            </button>
            <button className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <Heart className="w-6 h-6" />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <Share2 className="w-6 h-6" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-500/20 rounded-xl transition-colors text-red-400"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Error Banner - displays errors from enrich/retry operations */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-2 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-200">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Hero Image with Property Photo and CLUES Score */}
      <motion.div
        variants={itemVariants}
        className="relative bg-gradient-to-br from-quantum-dark to-quantum-card"
      >
        {/* Property Photo - Centered */}
        {fullProperty?.address.primaryPhotoUrl?.value ? (
          <div className="flex justify-center pt-6 pb-20">
            <div className="glass-card overflow-hidden max-w-md">
              <img
                src={fullProperty.address.primaryPhotoUrl.value}
                alt={`${fullProperty.address.fullAddress.value || property.address} - Primary Photo`}
                className="w-full h-auto object-cover"
                style={{ aspectRatio: '3/2' }}
                onError={(e) => {
                  // Hide image if it fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {fullProperty.address.photoGallery?.value && fullProperty.address.photoGallery.value.length > 1 && (
                <div className="p-3 bg-quantum-dark/50 border-t border-white/5">
                  <p className="text-xs text-gray-400 text-center">
                    {fullProperty.address.photoGallery.value.length} photos available from Stellar MLS
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-64 md:h-96 flex items-center justify-center">
            <MapPin className="w-24 h-24 text-gray-600" />
          </div>
        )}

        {/* Waterfront Badge - Top Left (if waterfront property) */}
        {String(fullProperty?.stellarMLS?.waterfront?.waterFrontageYn?.value || '').toLowerCase() === 'yes' && (
          <div className="absolute top-4 left-4 glass-card px-4 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-lg border-2 border-cyan-400/40">
            <div className="flex items-center gap-3">
              <Waves className="w-6 h-6 text-cyan-400" />
              <div className="text-left">
                <span className="text-lg font-bold text-cyan-300 block">WATERFRONT</span>
                {fullProperty?.stellarMLS?.waterfront?.waterfrontFeet?.value && (
                  <span className="text-xs text-cyan-400">{fullProperty?.stellarMLS?.waterfront?.waterfrontFeet?.value} ft frontage</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Water View Badge - Top Left (if water view but not waterfront) */}
        {String(fullProperty?.stellarMLS?.waterfront?.waterViewYn?.value || '').toLowerCase() === 'yes' &&
         String(fullProperty?.stellarMLS?.waterfront?.waterFrontageYn?.value || '').toLowerCase() !== 'yes' && (
          <div className="absolute top-4 left-4 glass-card px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-lg border border-blue-400/30">
            <div className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-semibold text-blue-300">WATER VIEW</span>
            </div>
          </div>
        )}

        {/* SMART Score Badge - Bottom Right */}
        <div className="absolute bottom-4 right-4 glass-card px-6 py-3">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-quantum-cyan" />
            <span className={`text-3xl font-bold ${
              property.smartScore === undefined ? 'text-gray-400' :
              property.smartScore >= 90 ? 'text-quantum-green' :
              property.smartScore >= 70 ? 'text-quantum-cyan' :
              'text-quantum-gold'
            }`}>
              {property.smartScore !== undefined ? property.smartScore : 'N/A'}
            </span>
            <div className="text-left">
              <span className="text-xs text-gray-400 block">CLUES</span>
              <span className="text-xs text-gray-400">Score</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-4 py-6 md:px-8 md:py-10 max-w-7xl mx-auto">
        {/* Hero Section - Redesigned for Visual Impact */}
        <motion.div variants={itemVariants} className="mb-8">

          {/* Stunning Gradient Price Banner - Centered Layout */}
          <div className="relative mb-6 p-8 rounded-2xl bg-gradient-to-br from-quantum-cyan/20 via-quantum-purple/20 to-quantum-gold/20 border border-quantum-cyan/30 backdrop-blur-xl overflow-hidden">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-quantum-cyan/10 via-transparent to-quantum-purple/10 animate-pulse" />

            {/* Top Right: Views & Save Buttons */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              {/* View Count */}
              {property?.viewCount && property.viewCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-400/40 backdrop-blur-sm">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold text-blue-300">{getViewsLast7Days()} {getViewsLast7Days() === 1 ? 'view' : 'views'} (7d)</span>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleToggleSave}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:scale-105 backdrop-blur-sm ${
                  isSaved
                    ? 'bg-quantum-purple/30 border-quantum-purple/60 text-quantum-purple'
                    : 'bg-white/10 border-white/30 text-gray-300 hover:bg-white/20'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                <span className="text-sm font-semibold">
                  {isSaved ? 'Saved' : 'Save'}
                  {property?.saveCount && property.saveCount > 0 && ` (${property.saveCount})`}
                </span>
              </button>
            </div>

            <div className="relative z-10 text-center">
              {/* Line 1: Price - CENTERED AT TOP */}
              <div className="mb-4">
                <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-quantum-cyan via-white to-quantum-gold bg-clip-text text-transparent mb-2">
                  {formatValue(fullProperty?.address.listingPrice.value || property.price, 'currency')}
                </div>
                {property.pricePerSqft > 0 && (
                  <p className="text-xl text-quantum-cyan font-semibold">
                    ${property.pricePerSqft}/sqft
                  </p>
                )}
              </div>

              {/* Line 2: Address - CENTERED */}
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                {fullProperty?.address.fullAddress.value || property.address}
              </h1>

              {/* Line 3: Status, MLS#, APN, Data Completeness - CENTERED (4 items) */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {/* Status Badge */}
                <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                  (fullProperty?.address.listingStatus.value || property.listingStatus) === 'Active' ? 'bg-quantum-green/30 text-quantum-green border border-quantum-green/50' :
                  (fullProperty?.address.listingStatus.value || property.listingStatus) === 'Pending' ? 'bg-quantum-gold/30 text-quantum-gold border border-quantum-gold/50' :
                  'bg-gray-500/30 text-gray-300 border border-gray-400/50'
                }`}>
                  ● {fullProperty?.address.listingStatus.value || property.listingStatus}
                </span>

                {/* MLS# Badge */}
                {fullProperty?.address.mlsPrimary?.value && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      navigator.clipboard.writeText(String(fullProperty.address.mlsPrimary.value));
                      const btn = e.currentTarget;
                      const originalText = btn.innerHTML;
                      btn.innerHTML = '<span class="text-quantum-green">✓ Copied!</span>';
                      setTimeout(() => { btn.innerHTML = originalText; }, 1500);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-quantum-cyan/20 hover:bg-quantum-cyan/30 border border-quantum-cyan/40 transition-all cursor-pointer group"
                    title="Click to copy MLS#"
                  >
                    <span className="text-xs font-semibold text-quantum-cyan group-hover:text-white">
                      MLS# {fullProperty.address.mlsPrimary.value}
                    </span>
                  </button>
                )}

                {/* New Construction Badge */}
                {fullProperty?.address.newConstructionYN?.value && (
                  <div className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-400/40 shadow-lg">
                    <span className="text-xs font-bold text-green-400">
                      🏗️ NEW CONSTRUCTION
                    </span>
                  </div>
                )}

                {/* APN Badge */}
                {fullProperty?.details.parcelId?.value && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      navigator.clipboard.writeText(String(fullProperty.details.parcelId.value));
                      const btn = e.currentTarget;
                      const originalText = btn.innerHTML;
                      btn.innerHTML = '<span class="text-quantum-green">✓ Copied!</span>';
                      setTimeout(() => { btn.innerHTML = originalText; }, 1500);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 transition-all cursor-pointer group"
                    title="Click to copy Parcel ID (APN)"
                  >
                    <span className="text-xs font-semibold text-amber-400 group-hover:text-white">
                      APN: {fullProperty.details.parcelId.value}
                    </span>
                  </button>
                )}

                {/* Data Completeness - Circular Progress Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-400/30">
                  <div className="relative w-8 h-8">
                    <svg className="w-8 h-8 transform -rotate-90">
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00f0ff" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="3"
                        fill="none"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="url(#progressGradient)"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 14}`}
                        strokeDashoffset={`${2 * Math.PI * 14 * (1 - Math.min(100, property.dataCompleteness) / 100)}`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                      {Math.min(100, property.dataCompleteness)}%
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-purple-300">
                    {fullProperty?.totalFieldsFound || Math.round(Math.min(100, property.dataCompleteness) * 1.68)}/181 Fields
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Stats Bar - Inline Prominent Display */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-4 text-center hover:scale-105 transition-transform">
              <Bed className="w-6 h-6 text-quantum-cyan mx-auto mb-1" />
              <div className="text-3xl font-bold text-white">{fullProperty?.details.bedrooms.value || property.bedrooms || 0}</div>
              <p className="text-xs text-gray-400">Beds</p>
            </div>
            <div className="glass-card p-4 text-center hover:scale-105 transition-transform">
              <Bath className="w-6 h-6 text-quantum-cyan mx-auto mb-1" />
              <div className="text-3xl font-bold text-white">{fullProperty?.details.totalBathrooms.value || property.bathrooms || 0}</div>
              <p className="text-xs text-gray-400">Baths</p>
            </div>
            <div className="glass-card p-4 text-center hover:scale-105 transition-transform">
              <Ruler className="w-6 h-6 text-quantum-cyan mx-auto mb-1" />
              <div className="text-3xl font-bold text-white">{(fullProperty?.details.livingSqft.value || property.sqft).toLocaleString()}</div>
              <p className="text-xs text-gray-400">Sq Ft</p>
            </div>
          </div>

          {/* Climate Risk Badges - Condensed Card View */}
          {(fullProperty?.utilities.floodRiskLevel?.value || fullProperty?.utilities.hurricaneRisk?.value || fullProperty?.utilities.seaLevelRiseRisk?.value) && (
            <div className="glass-card p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">Climate Risks</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {fullProperty.utilities.floodRiskLevel?.value && (
                  <div className={`p-3 rounded-lg border flex items-center gap-3 ${
                    String(fullProperty.utilities.floodRiskLevel.value).toLowerCase().includes('minimal') || String(fullProperty.utilities.floodRiskLevel.value).toLowerCase().includes('low') ?
                      'bg-emerald-500/10 border-emerald-500/30' :
                    String(fullProperty.utilities.floodRiskLevel.value).toLowerCase().includes('moderate') ?
                      'bg-amber-500/10 border-amber-500/30' :
                      'bg-red-500/10 border-red-500/30'
                  }`}>
                    <Waves className={`w-5 h-5 ${
                      String(fullProperty.utilities.floodRiskLevel.value).toLowerCase().includes('minimal') || String(fullProperty.utilities.floodRiskLevel.value).toLowerCase().includes('low') ?
                        'text-emerald-400' :
                      String(fullProperty.utilities.floodRiskLevel.value).toLowerCase().includes('moderate') ?
                        'text-amber-400' :
                        'text-red-400'
                    }`} />
                    <div>
                      <p className="text-xs text-gray-400">Flood</p>
                      <p className={`text-sm font-bold ${
                        String(fullProperty.utilities.floodRiskLevel.value).toLowerCase().includes('minimal') || String(fullProperty.utilities.floodRiskLevel.value).toLowerCase().includes('low') ?
                          'text-emerald-300' :
                        String(fullProperty.utilities.floodRiskLevel.value).toLowerCase().includes('moderate') ?
                          'text-amber-300' :
                          'text-red-300'
                      }`}>
                        {fullProperty.utilities.floodRiskLevel.value}
                      </p>
                    </div>
                  </div>
                )}
                {fullProperty.utilities.hurricaneRisk?.value && (
                  <div className={`p-3 rounded-lg border flex items-center gap-3 ${
                    String(fullProperty.utilities.hurricaneRisk.value).toLowerCase().includes('minimal') || String(fullProperty.utilities.hurricaneRisk.value).toLowerCase().includes('low') ?
                      'bg-emerald-500/10 border-emerald-500/30' :
                    String(fullProperty.utilities.hurricaneRisk.value).toLowerCase().includes('moderate') ?
                      'bg-amber-500/10 border-amber-500/30' :
                      'bg-red-500/10 border-red-500/30'
                  }`}>
                    <Wind className={`w-5 h-5 ${
                      String(fullProperty.utilities.hurricaneRisk.value).toLowerCase().includes('minimal') || String(fullProperty.utilities.hurricaneRisk.value).toLowerCase().includes('low') ?
                        'text-emerald-400' :
                      String(fullProperty.utilities.hurricaneRisk.value).toLowerCase().includes('moderate') ?
                        'text-amber-400' :
                        'text-red-400'
                    }`} />
                    <div>
                      <p className="text-xs text-gray-400">Hurricane</p>
                      <p className={`text-sm font-bold ${
                        String(fullProperty.utilities.hurricaneRisk.value).toLowerCase().includes('minimal') || String(fullProperty.utilities.hurricaneRisk.value).toLowerCase().includes('low') ?
                          'text-emerald-300' :
                        String(fullProperty.utilities.hurricaneRisk.value).toLowerCase().includes('moderate') ?
                          'text-amber-300' :
                          'text-red-300'
                      }`}>
                        {fullProperty.utilities.hurricaneRisk.value}
                      </p>
                    </div>
                  </div>
                )}
                {fullProperty.utilities.seaLevelRiseRisk?.value && (
                  <div className={`p-3 rounded-lg border flex items-center gap-3 ${
                    String(fullProperty.utilities.seaLevelRiseRisk.value).toLowerCase().includes('minimal') || String(fullProperty.utilities.seaLevelRiseRisk.value).toLowerCase().includes('low') ?
                      'bg-emerald-500/10 border-emerald-500/30' :
                    String(fullProperty.utilities.seaLevelRiseRisk.value).toLowerCase().includes('moderate') ?
                      'bg-amber-500/10 border-amber-500/30' :
                      'bg-red-500/10 border-red-500/30'
                  }`}>
                    <TrendingUp className={`w-5 h-5 ${
                      String(fullProperty.utilities.seaLevelRiseRisk.value).toLowerCase().includes('minimal') || String(fullProperty.utilities.seaLevelRiseRisk.value).toLowerCase().includes('low') ?
                        'text-emerald-400' :
                      String(fullProperty.utilities.seaLevelRiseRisk.value).toLowerCase().includes('moderate') ?
                        'text-amber-400' :
                        'text-red-400'
                    }`} />
                    <div>
                      <p className="text-xs text-gray-400">Sea Level</p>
                      <p className={`text-sm font-bold ${
                        String(fullProperty.utilities.seaLevelRiseRisk.value).toLowerCase().includes('minimal') || String(fullProperty.utilities.seaLevelRiseRisk.value).toLowerCase().includes('low') ?
                          'text-emerald-300' :
                        String(fullProperty.utilities.seaLevelRiseRisk.value).toLowerCase().includes('moderate') ?
                          'text-amber-300' :
                          'text-red-300'
                      }`}>
                        {fullProperty.utilities.seaLevelRiseRisk.value}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feature Badges - Organized in Card - CENTERED */}
          <div className="glass-card p-4 mb-4">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide mb-3 text-center">Property Features</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {/* Water Body Name */}
              {fullProperty?.stellarMLS?.waterfront?.waterBodyName?.value && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
                  <Waves className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-cyan-300">
                    {fullProperty.stellarMLS.waterfront.waterBodyName.value}
                  </span>
                </div>
              )}

              {/* Front Exposure */}
              {fullProperty?.stellarMLS?.legal?.frontExposure?.value && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-400/30">
                  <Sun className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-semibold text-orange-300">
                    Faces {fullProperty.stellarMLS.legal.frontExposure.value}
                  </span>
                </div>
              )}

              {/* Solar Potential */}
              {fullProperty?.utilities.solarPotential?.value && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  String(fullProperty.utilities.solarPotential.value).toLowerCase().includes('excellent') || String(fullProperty.utilities.solarPotential.value).toLowerCase().includes('high') ?
                    'bg-yellow-500/10 border-yellow-400/30' :
                  String(fullProperty.utilities.solarPotential.value).toLowerCase().includes('good') || String(fullProperty.utilities.solarPotential.value).toLowerCase().includes('moderate') ?
                    'bg-orange-500/10 border-orange-400/30' :
                    'bg-gray-500/10 border-gray-400/30'
                }`}>
                  <Zap className={`w-4 h-4 ${
                    String(fullProperty.utilities.solarPotential.value).toLowerCase().includes('excellent') || String(fullProperty.utilities.solarPotential.value).toLowerCase().includes('high') ?
                      'text-yellow-400' :
                    String(fullProperty.utilities.solarPotential.value).toLowerCase().includes('good') || String(fullProperty.utilities.solarPotential.value).toLowerCase().includes('moderate') ?
                      'text-orange-400' :
                      'text-gray-400'
                  }`} />
                  <span className={`text-sm font-semibold ${
                    String(fullProperty.utilities.solarPotential.value).toLowerCase().includes('excellent') || String(fullProperty.utilities.solarPotential.value).toLowerCase().includes('high') ?
                      'text-yellow-300' :
                    String(fullProperty.utilities.solarPotential.value).toLowerCase().includes('good') || String(fullProperty.utilities.solarPotential.value).toLowerCase().includes('moderate') ?
                      'text-orange-300' :
                      'text-gray-300'
                  }`}>
                    Solar: {fullProperty.utilities.solarPotential.value}
                  </span>
                </div>
              )}

              {/* Occupancy */}
              {fullProperty?.extendedMLS?.occupantType && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/20 border border-purple-400/30">
                  <span className="px-1.5 py-0.5 bg-purple-500/30 border border-purple-400/40 rounded text-purple-200 text-xs font-bold">E.D.</span>
                  <span className="text-sm font-semibold text-purple-300">
                    {fullProperty.extendedMLS.occupantType}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        >
          <div className="glass-card p-6 text-center">
            <Bed className="w-6 h-6 text-quantum-cyan mx-auto mb-2" />
            <span className="text-2xl font-bold text-white block">{fullProperty?.details.bedrooms.value || property.bedrooms || 0}</span>
            <p className="text-sm text-gray-500">Bedrooms</p>
          </div>
          <div className="glass-card p-6 text-center">
            <Bath className="w-6 h-6 text-quantum-cyan mx-auto mb-2" />
            <span className="text-2xl font-bold text-white block">{fullProperty?.details.totalBathrooms.value || property.bathrooms || 0}</span>
            <p className="text-sm text-gray-500">Bathrooms</p>
          </div>
          <div className="glass-card p-6 text-center">
            <Ruler className="w-6 h-6 text-quantum-cyan mx-auto mb-2" />
            <span className="text-2xl font-bold text-white block">{fullProperty?.details.livingSqft.value?.toLocaleString() || property.sqft.toLocaleString()}</span>
            <p className="text-sm text-gray-500">Living Sq Ft</p>
            {fullProperty?.details.totalSqftUnderRoof?.value && fullProperty.details.totalSqftUnderRoof.value !== fullProperty.details.livingSqft.value && (
              <p className="text-xs text-gray-400 mt-1">
                {fullProperty.details.totalSqftUnderRoof.value.toLocaleString()} total
              </p>
            )}
          </div>
          <div className="glass-card p-6 text-center">
            <Calendar className="w-6 h-6 text-quantum-cyan mx-auto mb-2" />
            <span className="text-2xl font-bold text-white block">{fullProperty?.details.yearBuilt.value || property.yearBuilt}</span>
            <p className="text-sm text-gray-500">Year Built</p>
          </div>
          <div className="glass-card p-6 text-center">
            <Trees className="w-6 h-6 text-quantum-cyan mx-auto mb-2" />
            {fullProperty?.details.lotSizeAcres?.value ? (
              <>
                <span className="text-2xl font-bold text-white block">{fullProperty.details.lotSizeAcres.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                <p className="text-sm text-gray-500">Acres</p>
                {fullProperty?.details.lotSizeSqft?.value && (
                  <p className="text-xs text-gray-400 mt-1">
                    {fullProperty.details.lotSizeSqft.value.toLocaleString()} sq ft
                  </p>
                )}
              </>
            ) : fullProperty?.details.lotSizeSqft?.value ? (
              <>
                <span className="text-2xl font-bold text-white block">{fullProperty.details.lotSizeSqft.value.toLocaleString()}</span>
                <p className="text-sm text-gray-500">Lot Sq Ft</p>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-white block">—</span>
                <p className="text-sm text-gray-500">Lot Size</p>
              </>
            )}
          </div>
        </motion.div>

        {/* Extended Data - Virtual Tour CTA */}
        {fullProperty?.extendedMLS?.virtualTourURLUnbranded && (
          <motion.div variants={itemVariants} className="mb-8">
            <a
              href={fullProperty.extendedMLS.virtualTourURLUnbranded}
              target="_blank"
              rel="noopener noreferrer"
              className="block glass-card p-6 hover:bg-purple-500/10 transition-all group border-2 border-purple-400/30 hover:border-purple-400/60"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                    <Eye className="w-6 h-6 text-purple-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-white">Take a Virtual Tour</h3>
                      <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-400/30 rounded text-purple-300 text-xs font-bold">E.D.</span>
                    </div>
                    <p className="text-gray-400">Explore this property in 3D from anywhere</p>
                  </div>
                </div>
                <div className="text-purple-300 group-hover:translate-x-1 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </a>
          </motion.div>
        )}

        {/* Extended Data - Showing Instructions Banner */}
        {fullProperty?.extendedMLS?.showingInstructions && (
          <motion.div variants={itemVariants} className="mb-8">
            <div className="glass-card p-6 border-2 border-blue-400/30 bg-blue-500/5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-white">Showing Instructions</h3>
                    <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-400/30 rounded text-purple-300 text-xs font-bold">E.D.</span>
                  </div>
                  <p className="text-gray-300">{fullProperty.extendedMLS.showingInstructions}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent Improvements / System Ages */}
        {fullProperty && (fullProperty.structural?.roofAgeEst?.value || fullProperty.structural?.hvacAge?.value) && (
          <motion.div
            variants={itemVariants}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Hammer className="w-6 h-6 text-quantum-cyan" />
              <h2 className="text-2xl font-bold text-white">Recent Improvements</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Roof Age */}
              {fullProperty.structural?.roofAgeEst?.value && (
                <div className="glass-card p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-1">Roof</p>
                      <p className="text-lg text-white font-semibold">{fullProperty.structural.roofAgeEst.value}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      String(fullProperty.structural.roofAgeEst.value).includes('Recent permit') ||
                      (String(fullProperty.structural.roofAgeEst.value).match(/(\d+)\s*year/) &&
                       parseInt(String(fullProperty.structural.roofAgeEst.value).match(/(\d+)\s*year/)?.[1] || '999') < 5)
                        ? 'bg-green-500/20 text-green-300'
                        : (String(fullProperty.structural.roofAgeEst.value).match(/(\d+)\s*year/) &&
                           parseInt(String(fullProperty.structural.roofAgeEst.value).match(/(\d+)\s*year/)?.[1] || '999') <= 15)
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                    }`}>
                      {String(fullProperty.structural.roofAgeEst.value).includes('Recent permit') ||
                       (String(fullProperty.structural.roofAgeEst.value).match(/(\d+)\s*year/) &&
                        parseInt(String(fullProperty.structural.roofAgeEst.value).match(/(\d+)\s*year/)?.[1] || '999') < 5)
                        ? '✓ Recent'
                        : (String(fullProperty.structural.roofAgeEst.value).match(/(\d+)\s*year/) &&
                           parseInt(String(fullProperty.structural.roofAgeEst.value).match(/(\d+)\s*year/)?.[1] || '999') <= 15)
                          ? '⚠ Aging'
                          : '⚠ Replace Soon'}
                    </div>
                  </div>
                </div>
              )}

              {/* HVAC Age */}
              {fullProperty.structural?.hvacAge?.value && typeof fullProperty.structural.hvacAge.value !== 'boolean' && (
                <div className="glass-card p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-1">HVAC System</p>
                      <p className="text-lg text-white font-semibold">{fullProperty.structural.hvacAge.value}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      String(fullProperty.structural.hvacAge.value).includes('Recent permit')
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-gray-500/20 text-gray-300'
                    }`}>
                      {String(fullProperty.structural.hvacAge.value).includes('Recent permit')
                        ? '✓ Recent'
                        : 'ℹ Info Available'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Full Property Data Sections */}
        {fullProperty ? (
          <div className="space-y-6">
            {/* Address & Identity (Fields 1-9) */}
            <Section title="Address & Identity" defaultExpanded={false} icon={<MapPin className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Full Address", fullProperty.address.fullAddress, "text", undefined, "1_full_address")}
                  {/* Extract and display Unit Number if present */}
                  {(() => {
                    const fullAddr = fullProperty.address.fullAddress.value;
                    if (fullAddr) {
                      const unitMatch = fullAddr.match(/(?:UNIT|APT|#)\s*(\w+)/i);
                      if (unitMatch) {
                        return renderDataField("Unit #", { value: unitMatch[1], confidence: 'High' }, "text");
                      }
                    }
                    return null;
                  })()}
                  {renderDataField("MLS Primary", fullProperty.address.mlsPrimary, "text", undefined, "2_mls_primary")}
                  {renderDataField("New Construction", { value: fullProperty.address.newConstructionYN?.value ? 'Yes' : 'No', sources: fullProperty.address.newConstructionYN?.sources || [] }, "text", undefined, "3_new_construction_yn")}
                  {renderDataField("Listing Status", fullProperty.address.listingStatus, "text", undefined, "4_listing_status")}
                  {renderDataField("Listing Date", fullProperty.address.listingDate, 'date', undefined, "5_listing_date")}
                </div>
                <div>
                  {renderDataField("Neighborhood", fullProperty.address.neighborhoodName, "text", undefined, "6_neighborhood")}
                  {renderDataField("County", fullProperty.address.county, "text", undefined, "7_county")}
                  {renderDataField("ZIP Code", fullProperty.address.zipCode, "text", undefined, "8_zip_code")}
                  {renderDataField("Parcel ID", fullProperty.details.parcelId, "text", undefined, "9_parcel_id")}
                </div>
              </div>
            </Section>

            {/* Pricing & Value (Fields 10-16) */}
            <Section title="Pricing & Value" defaultExpanded={false} icon={<DollarSign className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Listing Price", fullProperty.address.listingPrice, 'currency', undefined, "10_listing_price")}
                  {renderDataField("Price Per Sq Ft", fullProperty.address.pricePerSqft, 'currency', undefined, "11_price_per_sqft")}
                  {renderDataField("Market Value Estimate", fullProperty.details.marketValueEstimate, 'currency', undefined, "12_market_value_estimate")}
                  {renderDataField("Last Sale Date", fullProperty.details.lastSaleDate, 'date', undefined, "13_last_sale_date")}
                </div>
                <div>
                  {renderDataField("Last Sale Price", fullProperty.details.lastSalePrice, 'currency', undefined, "14_last_sale_price")}
                  {renderDataField("Assessed Value", fullProperty.details.assessedValue, 'currency', undefined, "15_assessed_value")}
                  {renderDataField("AVMs (Average)", fullProperty.financial.avms, 'currency', undefined, "16_avms")}
                </div>
              </div>

              {/* Individual AVM Sources (16a-16f) */}
              {(fullProperty.financial?.zestimate?.value || fullProperty.financial?.redfinEstimate?.value ||
                fullProperty.financial?.firstAmericanAvm?.value || fullProperty.financial?.quantariumAvm?.value ||
                fullProperty.financial?.iceAvm?.value || fullProperty.financial?.collateralAnalyticsAvm?.value) && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Individual AVM Sources</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      {renderDataField("Zillow Zestimate", fullProperty.financial.zestimate, 'currency', undefined, "16a_zestimate")}
                      {renderDataField("Redfin Estimate", fullProperty.financial.redfinEstimate, 'currency', undefined, "16b_redfin_estimate")}
                    </div>
                    <div>
                      {renderDataField("First American AVM", fullProperty.financial.firstAmericanAvm, 'currency', undefined, "16c_first_american_avm")}
                      {renderDataField("Quantarium AVM", fullProperty.financial.quantariumAvm, 'currency', undefined, "16d_quantarium_avm")}
                    </div>
                    <div>
                      {renderDataField("ICE AVM", fullProperty.financial.iceAvm, 'currency', undefined, "16e_ice_avm")}
                      {renderDataField("Collateral Analytics", fullProperty.financial.collateralAnalyticsAvm, 'currency', undefined, "16f_collateral_analytics_avm")}
                    </div>
                  </div>
                </div>
              )}

              {/* Extended Data - Price History */}
              {fullProperty?.extendedMLS?.originalListPrice && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Price History</h4>
                    <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-400/30 rounded text-purple-300 text-xs font-bold">E.D.</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {fullProperty.extendedMLS.originalListPrice && (
                      <div className="px-4 py-3 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Original Price</div>
                        <div className="text-lg font-bold text-yellow-300">${fullProperty.extendedMLS.originalListPrice.toLocaleString()}</div>
                      </div>
                    )}
                    {fullProperty.extendedMLS.currentPrice && (
                      <div className="px-4 py-3 bg-green-500/10 border border-green-400/20 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Current Price</div>
                        <div className="text-lg font-bold text-green-300">${fullProperty.extendedMLS.currentPrice.toLocaleString()}</div>
                      </div>
                    )}
                    {fullProperty.extendedMLS.priceChangeTimestamp && (
                      <div className="px-4 py-3 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Last Price Change</div>
                        <div className="text-sm font-semibold text-blue-300">{new Date(fullProperty.extendedMLS.priceChangeTimestamp).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Section>

            {/* Property Basics (Fields 17-29) */}
            <Section title="Property Basics" defaultExpanded={false} icon={<Home className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  {renderDataField("Bedrooms", fullProperty.details.bedrooms, "number", undefined, "17_bedrooms")}
                  {renderDataField("Full Bathrooms", fullProperty.details.fullBathrooms, "number", undefined, "18_full_bathrooms")}
                  {renderDataField("Half Bathrooms", fullProperty.details.halfBathrooms, "number", undefined, "19_half_bathrooms")}
                  {renderDataField("Total Bathrooms", fullProperty.details.totalBathrooms, "number", undefined, "20_total_bathrooms")}
                </div>
                <div>
                  {renderDataField("Living Sq Ft", fullProperty.details.livingSqft, "number", undefined, "21_living_sqft")}
                  {renderDataField("Total Sq Ft Under Roof", fullProperty.details.totalSqftUnderRoof, "number", undefined, "22_total_sqft_under_roof")}
                  {renderDataField("Lot Size (Sq Ft)", fullProperty.details.lotSizeSqft, "number", undefined, "23_lot_size_sqft")}
                  {renderDataField("Lot Size (Acres)", fullProperty.details.lotSizeAcres, "number", undefined, "24_lot_size_acres")}
                </div>
                <div>
                  {renderDataField("Year Built", fullProperty.details.yearBuilt, "text", undefined, "25_year_built")}
                  {renderDataField("Property Type", fullProperty.details.propertyType, "text", undefined, "26_property_type")}
                  {renderDataField("Stories", fullProperty.details.stories, "number", undefined, "27_stories")}
                  {renderDataField("Garage Spaces", fullProperty.details.garageSpaces, "number", undefined, "28_garage_spaces")}
                  {renderDataField("Parking Total", fullProperty.details.parkingTotal, "text", undefined, "29_parking_total")}
                </div>
              </div>

              {/* Extended Data - Architectural Style & Master Bedroom */}
              {(fullProperty?.extendedMLS?.architecturalStyle || fullProperty?.extendedMLS?.masterBedroomLevel) && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Additional Property Details</h4>
                    <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-400/30 rounded text-purple-300 text-xs font-bold">E.D.</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fullProperty.extendedMLS.architecturalStyle &&
                     fullProperty.extendedMLS.architecturalStyle.value !== 'ARCHITECTUAL STYLE' &&
                     fullProperty.extendedMLS.architecturalStyle.value !== 'Architectural Style' &&
                     fullProperty.extendedMLS.architecturalStyle.value && (
                      <div className="px-4 py-3 bg-indigo-500/10 border border-indigo-400/20 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Architectural Style</div>
                        <div className="text-base font-semibold text-indigo-300">{fullProperty.extendedMLS.architecturalStyle.value || fullProperty.extendedMLS.architecturalStyle}</div>
                      </div>
                    )}
                    {fullProperty.extendedMLS.masterBedroomLevel && (
                      <div className="px-4 py-3 bg-violet-500/10 border border-violet-400/20 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Master Bedroom Level</div>
                        <div className="text-base font-semibold text-violet-300">{fullProperty.extendedMLS.masterBedroomLevel}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Section>

            {/* HOA & Taxes (Fields 30-38) */}
            <Section title="HOA & Taxes" defaultExpanded={false} icon={<Shield className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("HOA", fullProperty.details.hoaYn, "text", undefined, "30_hoa_yn")}
                  {renderDataField("HOA Fee (Annual)", fullProperty.details.hoaFeeAnnual, "currency", undefined, "31_association_fee")}
                  {renderDataField("HOA Name", fullProperty.details.hoaName, "text", undefined, "32_hoa_name")}
                  {renderDataField("HOA Includes", fullProperty.details.hoaIncludes, "text", undefined, "33_hoa_includes")}
                  {renderDataField("Ownership Type", fullProperty.details.ownershipType, "text", undefined, "34_ownership_type")}
                </div>
                <div>
                  {renderDataField("Annual Taxes", fullProperty.details.annualTaxes, "currency", undefined, "35_annual_taxes")}
                  {renderDataField("Tax Year", fullProperty.details.taxYear, "text", undefined, "36_tax_year")}
                  {renderDataField("Property Tax Rate", fullProperty.financial.propertyTaxRate, "percent", undefined, "37_property_tax_rate")}
                  {renderDataField("Tax Exemptions", fullProperty.financial.taxExemptions, "text", undefined, "38_tax_exemptions")}
                </div>
              </div>
            </Section>

            {/* Structure & Systems (Fields 39-48) */}
            <Section title="Structure & Systems" defaultExpanded={false} icon={<Building2 className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Roof Type", fullProperty.structural.roofType, "text", undefined, "39_roof_type")}
                  {renderDataField("Roof Age (Est)", fullProperty.structural.roofAgeEst, "text", undefined, "40_roof_age_est")}
                  {renderDataField("Exterior Material", fullProperty.structural.exteriorMaterial, "text", undefined, "41_exterior_material")}
                  {renderDataField("Foundation", fullProperty.structural.foundation, "text", undefined, "42_foundation")}
                  {renderDataField("Water Heater Type", fullProperty.structural.waterHeaterType, "text", undefined, "43_water_heater_type")}
                </div>
                <div>
                  {renderDataField("Garage Type", fullProperty.structural.garageType, "text", undefined, "44_garage_type")}
                  {renderDataField("HVAC Type", fullProperty.structural.hvacType, "text", undefined, "45_hvac_type")}
                  {renderDataField("HVAC Age", fullProperty.structural.hvacAge, "text", undefined, "46_hvac_age")}
                  {renderDataField("Laundry Type", fullProperty.structural.laundryType, "text", undefined, "47_laundry_type")}
                  {renderDataField("Interior Condition", fullProperty.structural.interiorCondition, "text", undefined, "48_interior_condition")}
                </div>
              </div>
            </Section>

            {/* Interior Features (Fields 49-53) */}
            <Section title="Interior Features" icon={<Home className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Flooring Type", fullProperty.structural.flooringType, "text", undefined, "49_flooring_type")}
                  {renderDataField("Kitchen Features", fullProperty.structural.kitchenFeatures, "text", undefined, "50_kitchen_features")}
                  {renderMultiSelectField("Appliances Included", fullProperty.structural.appliancesIncluded, "51_appliances_included")}
                </div>
                <div>
                  {renderDataField("Fireplace", fullProperty.structural.fireplaceYn, "text", undefined, "52_fireplace_yn")}
                  {renderDataField("Primary BR Location", fullProperty.structural.primaryBrLocation, "text", undefined, "53_primary_br_location")}
                </div>
              </div>
            </Section>

            {/* Exterior Features (Fields 54-58) */}
            <Section title="Exterior Features" icon={<Trees className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Pool", fullProperty.structural.poolYn, "text", undefined, "54_pool_yn")}
                  {renderMultiSelectField("Pool Type", fullProperty.structural.poolType, "55_pool_type")}
                  {renderDataField("Deck/Patio", fullProperty.structural.deckPatio, "text", undefined, "56_deck_patio")}
                </div>
                <div>
                  {renderDataField("Fence", fullProperty.structural.fence, "text", undefined, "57_fence")}
                  {renderDataField("Landscaping", fullProperty.structural.landscaping, "text", undefined, "58_landscaping")}
                </div>
              </div>
            </Section>

            {/* Permits & Renovations (Fields 59-62) */}
            <Section title="Permits & Renovations" icon={<Wrench className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Recent Renovations", fullProperty.structural.recentRenovations, "text", undefined, "59_recent_renovations")}
                  {renderDataField("Permit History - Roof", fullProperty.structural.permitHistoryRoof, "text", undefined, "60_permit_history_roof")}
                </div>
                <div>
                  {renderDataField("Permit History - HVAC", fullProperty.structural.permitHistoryHvac, "text", undefined, "61_permit_history_hvac")}
                  {renderDataField("Permit History - Other", fullProperty.structural.permitHistoryPoolAdditions, "text", undefined, "62_permit_history_other")}
                </div>
              </div>
            </Section>

            {/* Assigned Schools (Fields 63-73) */}
            <Section title="Assigned Schools" icon={<School className="w-6 h-6" />} defaultExpanded={false}>
              <div className="space-y-4">
                <div className="mb-4">
                  {renderDataField("School District", fullProperty.location.schoolDistrictName, "text", undefined, "63_school_district")}
                </div>
                {fullProperty.location.assignedElementary.value && (
                  <div className="glass-5d p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold">Elementary School</h3>
                      <span className="px-3 py-1 rounded-full bg-quantum-cyan/20 text-quantum-cyan text-sm font-bold">
                        {fullProperty.location.elementaryRating.value || 'N/A'}
                      </span>
                    </div>
                    <p className="text-gray-300">{fullProperty.location.assignedElementary.value}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Distance: {fullProperty.location.elementaryDistanceMiles.value || 'N/A'} miles
                    </p>
                  </div>
                )}
                {fullProperty.location.assignedMiddle.value && (
                  <div className="glass-5d p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold">Middle School</h3>
                      <span className="px-3 py-1 rounded-full bg-quantum-cyan/20 text-quantum-cyan text-sm font-bold">
                        {fullProperty.location.middleRating.value || 'N/A'}
                      </span>
                    </div>
                    <p className="text-gray-300">{fullProperty.location.assignedMiddle.value}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Distance: {fullProperty.location.middleDistanceMiles.value || 'N/A'} miles
                    </p>
                  </div>
                )}
                {fullProperty.location.assignedHigh.value && (
                  <div className="glass-5d p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold">High School</h3>
                      <span className="px-3 py-1 rounded-full bg-quantum-cyan/20 text-quantum-cyan text-sm font-bold">
                        {fullProperty.location.highRating.value || 'N/A'}
                      </span>
                    </div>
                    <p className="text-gray-300">{fullProperty.location.assignedHigh.value}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Distance: {fullProperty.location.highDistanceMiles.value || 'N/A'} miles
                    </p>
                  </div>
                )}
              </div>
            </Section>

            {/* Location Scores (Fields 74-82) */}
            <Section title="Location Scores" icon={<Target className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-quantum-cyan mb-1">
                    {fullProperty.location.walkScore.value || '--'}
                  </div>
                  <p className="text-sm text-gray-400">Walk Score</p>
                  <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-quantum-cyan"
                      style={{ width: `${fullProperty.location.walkScore.value || 0}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-quantum-cyan mb-1">
                    {fullProperty.location.transitScore.value || '--'}
                  </div>
                  <p className="text-sm text-gray-400">Transit Score</p>
                  <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-quantum-cyan"
                      style={{ width: `${fullProperty.location.transitScore.value || 0}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-quantum-cyan mb-1">
                    {fullProperty.location.bikeScore.value || '--'}
                  </div>
                  <p className="text-sm text-gray-400">Bike Score</p>
                  <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-quantum-cyan"
                      style={{ width: `${fullProperty.location.bikeScore.value || 0}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-quantum-green mb-1">
                    {fullProperty.location.neighborhoodSafetyRating.value || '--'}
                  </div>
                  <p className="text-sm text-gray-400">Safety</p>
                </div>
                <div className="text-center">
                  {fullProperty.location.noiseLevel.value && (
                    <>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <div className={`text-2xl font-bold ${
                          String(fullProperty.location.noiseLevel.value).toLowerCase().includes('quiet') ? 'text-quantum-green' :
                          String(fullProperty.location.noiseLevel.value).toLowerCase().includes('moderate') ? 'text-amber-400' :
                          'text-red-400'
                        }`}>
                          {String(fullProperty.location.noiseLevel.value).match(/\d+/) ?
                            String(fullProperty.location.noiseLevel.value).match(/\d+/)?.[0] :
                            '--'}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">Noise Level</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {String(fullProperty.location.noiseLevel.value).replace(/\d+\s*-?\s*/,'')}
                      </p>
                    </>
                  )}
                  {!fullProperty.location.noiseLevel.value && (
                    <>
                      <div className="text-3xl font-bold text-gray-500 mb-1">--</div>
                      <p className="text-sm text-gray-400">Noise Level</p>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderDataField("Noise Level", fullProperty.location.noiseLevel, "text", undefined, "78_noise_level")}
                {renderDataField("Traffic Level", fullProperty.location.trafficLevel, "text", undefined, "79_traffic_level")}
                {renderDataField("Walkability Description", fullProperty.location.walkabilityDescription, "text", undefined, "80_walkability_description")}
                {renderDataField("Public Transit Access", fullProperty.location.publicTransitAccess, "text", undefined, "81_public_transit_access")}
                {renderDataField("Commute to City Center", fullProperty.location.commuteTimeCityCenter, "text", undefined, "82_commute_to_city_center")}
              </div>
            </Section>

            {/* Distances & Amenities (Fields 83-87) */}
            <Section title="Distances & Amenities" icon={<MapPin className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {renderDataField("Distance to Grocery", fullProperty.location.distanceGroceryMiles, "number", <span className="text-xs">mi</span>, "83_distance_grocery_mi")}
                {renderDataField("Distance to Hospital", fullProperty.location.distanceHospitalMiles, "number", <span className="text-xs">mi</span>, "84_distance_hospital_mi")}
                {renderDataField("Distance to Airport", fullProperty.location.distanceAirportMiles, "number", <span className="text-xs">mi</span>, "85_distance_airport_mi")}
                {renderDataField("Distance to Park", fullProperty.location.distanceParkMiles, "number", <span className="text-xs">mi</span>, "86_distance_park_mi")}
                {renderDataField("Distance to Beach", fullProperty.location.distanceBeachMiles, "number", <span className="text-xs">mi</span>, "87_distance_beach_mi")}
              </div>
            </Section>

            {/* Safety & Crime (Fields 88-90) */}
            <Section title="Safety & Crime" icon={<Shield className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderDataField("Violent Crime Index", fullProperty.location.crimeIndexViolent, "text", undefined, "88_violent_crime_index")}
                {renderDataField("Property Crime Index", fullProperty.location.crimeIndexProperty, "text", undefined, "89_property_crime_index")}
                {renderDataField("Neighborhood Safety Rating", fullProperty.location.neighborhoodSafetyRating, "text", undefined, "90_neighborhood_safety_rating")}
              </div>
            </Section>

            {/* Market & Investment Data (Fields 91-103) */}
            <Section title="Market & Investment Data" icon={<TrendingUp className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Median Home Price (Neighborhood)", fullProperty.financial.medianHomePriceNeighborhood, "currency", undefined, "91_median_home_price_neighborhood")}
                  {renderDataField("Price Per Sq Ft (Recent Avg)", fullProperty.financial.pricePerSqftRecentAvg, "currency", undefined, "92_price_per_sqft_recent_avg")}
                  {renderDataField("Price to Rent Ratio", fullProperty.financial.priceToRentRatio, "number", undefined, "93_price_to_rent_ratio")}
                  {renderDataField("Price vs Median %", fullProperty.financial.priceVsMedianPercent, "percent", undefined, "94_price_vs_median_percent")}
                  {renderDataField("Days on Market (Avg)", fullProperty.financial.daysOnMarketAvg, "number", undefined, "95_days_on_market_avg")}
                  {renderDataField("Inventory Surplus", fullProperty.financial.inventorySurplus, "text", undefined, "96_inventory_surplus")}
                  {renderDataField("Insurance Estimate (Annual)", fullProperty.financial.insuranceEstAnnual, "currency", undefined, "97_insurance_est_annual")}
                </div>
                <div>
                  {renderDataField("Rental Estimate (Monthly)", fullProperty.financial.rentalEstimateMonthly, "currency", undefined, "98_rental_estimate_monthly")}
                  {renderDataField("Rental Yield (Est)", fullProperty.financial.rentalYieldEst, "percent", undefined, "99_rental_yield_est")}
                  {renderDataField("Vacancy Rate (Neighborhood)", fullProperty.financial.vacancyRateNeighborhood, "percent", undefined, "100_vacancy_rate_neighborhood")}
                  {renderDataField("Cap Rate (Est)", fullProperty.financial.capRateEst, "percent", undefined, "101_cap_rate_est")}
                </div>
              </div>
              {/* Field 102: Financing Terms - Full width for long mortgage rate details */}
              <div className="mt-6">
                {renderDataField("Financing Terms", fullProperty.financial.financingTerms, "text", undefined, "102_financing_terms")}
              </div>
              {/* Field 103: Comparable Sales - Custom rendering for structured data */}
              <div className="mt-6">
                {(() => {
                    const compData = fullProperty.financial.comparableSalesLast3;
                    if (!compData || !compData.value) return null;

                    // Extract comparable sales array from various formats
                    let comps: any[] = [];
                    try {
                      const val: any = compData.value;
                      if (typeof val === 'string') {
                        // Try to parse JSON string
                        const parsed = JSON.parse(val);
                        comps = Array.isArray(parsed) ? parsed : (parsed.comps || parsed.comparables || parsed.comparable_sales || []);
                      } else if (Array.isArray(val)) {
                        comps = val;
                      } else if (typeof val === 'object' && val !== null) {
                        // Handle nested object structures like {comps: [...]} or {value: [...]}
                        const objVal = val as Record<string, any>;
                        comps = objVal.comps || objVal.comparables || objVal.comparable_sales || objVal.value || [];
                        if (!Array.isArray(comps)) comps = [];
                      }
                    } catch (e) {
                      // If not valid JSON, check if it's already a text description
                      const valueStr = compData.value as unknown as string;
                      if (typeof valueStr === 'string' && valueStr.length > 0) {
                        return renderDataField("Comparable Sales", compData, "text", undefined, "103_comparable_sales");
                      }
                      return null;
                    }

                    if (!Array.isArray(comps) || comps.length === 0) {
                      // If we have a value but couldn't parse it as comps, show as text
                      const valCheck = compData.value as unknown;
                      if (valCheck && typeof valCheck === 'string') {
                        return renderDataField("Comparable Sales", compData, "text", undefined, "103_comparable_sales");
                      }
                      return null;
                    }

                    return (
                      <div className="py-3">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-400">Comparable Sales</span>
                          {globalIsAdmin && compData.sources && compData.sources.length > 0 && (
                            <span className="text-xs text-gray-500">Source: {compData.sources.join(', ')}</span>
                          )}
                        </div>
                        <div className="grid gap-3">
                          {comps.slice(0, 3).map((comp: any, idx: number) => (
                            <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="text-sm font-medium text-white">{comp.address || 'Unknown Address'}</div>
                                <div className="text-sm font-semibold text-quantum-green">
                                  {comp.price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(comp.price) : 'N/A'}
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-2 text-xs text-gray-400">
                                <div><span className="text-gray-500">Sqft:</span> {comp.sqft?.toLocaleString() || 'N/A'}</div>
                                <div><span className="text-gray-500">Beds:</span> {comp.beds || 'N/A'}</div>
                                <div><span className="text-gray-500">Baths:</span> {comp.baths || 'N/A'}</div>
                                <div><span className="text-gray-500">Sold:</span> {comp.sold_date || 'N/A'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
              </div>
            </Section>

            {/* Utilities & Connectivity (Fields 104-116) */}
            <Section title="Utilities & Connectivity" icon={<Wifi className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Electric Provider", fullProperty.utilities.electricProvider, "text", <Zap className="w-4 h-4" />, "104_electric_provider")}
                  {renderDataField("Avg Electric Bill", fullProperty.utilities.avgElectricBill, "text", undefined, "105_avg_electric_bill")}
                  {renderDataField("Water Provider", fullProperty.utilities.waterProvider, "text", undefined, "106_water_provider")}
                  {renderDataField("Avg Water Bill", fullProperty.utilities.avgWaterBill, "text", undefined, "107_avg_water_bill")}
                  {renderDataField("Sewer Provider", fullProperty.utilities.sewerProvider, "text", undefined, "108_sewer_provider")}
                  {renderDataField("Natural Gas", fullProperty.utilities.naturalGas, "text", undefined, "109_natural_gas")}
                  {renderDataField("Trash Provider", fullProperty.utilities.trashProvider, "text", undefined, "110_trash_provider")}
                </div>
                <div>
                  {renderDataField("Internet Providers (Top 3)", fullProperty.utilities.internetProvidersTop3, "text", undefined, "111_internet_providers_top3")}
                  {renderDataField("Max Internet Speed", fullProperty.utilities.maxInternetSpeed, "text", undefined, "112_max_internet_speed")}
                  {renderDataField("Fiber Available", fullProperty.utilities.fiberAvailable, "text", undefined, "113_fiber_available")}
                  {renderDataField("Cable TV Provider", fullProperty.utilities.cableTvProvider, "text", undefined, "114_cable_tv_provider")}
                  {renderDataField("Cell Coverage Quality", fullProperty.utilities.cellCoverageQuality, "text", undefined, "115_cell_coverage_quality")}
                  {renderDataField("Emergency Services Distance", fullProperty.utilities.emergencyServicesDistance, "text", undefined, "116_emergency_services_distance")}
                </div>
              </div>
            </Section>

            {/* Environment & Risk (Fields 117-130) */}
            <Section title="Environment & Risk" icon={<Sun className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Air Quality Index", fullProperty.utilities.airQualityIndexCurrent, "text", undefined, "117_air_quality_index")}
                  {renderDataField("Air Quality Grade", fullProperty.utilities.airQualityGrade, "text", undefined, "118_air_quality_grade")}
                  {renderDataField("Flood Zone", fullProperty.utilities.floodZone, "text", undefined, "119_flood_zone")}
                  {renderDataField("Flood Risk Level", fullProperty.utilities.floodRiskLevel, "text", undefined, "120_flood_risk_level")}
                  {renderDataField("Elevation (feet)", fullProperty.location.elevationFeet, "number", undefined, "64_elevation_feet")}
                  {renderDataField("Climate Risk", fullProperty.utilities.climateRiskWildfireFlood, "text", undefined, "121_climate_risk")}
                  {renderDataField("Wildfire Risk", fullProperty.utilities.wildfireRisk, "text", undefined, "122_wildfire_risk")}
                  {renderDataField("Earthquake Risk", fullProperty.utilities.earthquakeRisk, "text", undefined, "123_earthquake_risk")}
                </div>
                <div>
                  {renderDataField("Hurricane Risk", fullProperty.utilities.hurricaneRisk, "text", undefined, "124_hurricane_risk")}
                  {renderDataField("Tornado Risk", fullProperty.utilities.tornadoRisk, "text", undefined, "125_tornado_risk")}
                  {renderDataField("Radon Risk", fullProperty.utilities.radonRisk, "text", undefined, "126_radon_risk")}
                  {renderDataField("Superfund Site Nearby", fullProperty.utilities.superfundNearby, "text", undefined, "127_superfund_site_nearby")}
                  {renderDataField("Sea Level Rise Risk", fullProperty.utilities.seaLevelRiseRisk, "text", undefined, "128_sea_level_rise_risk")}
                  {renderDataField("Noise Level (dB Est)", fullProperty.utilities.noiseLevelDbEst, "text", undefined, "129_noise_level_db_est")}

                  {/* dB Reference Scale - helps users understand decibel values */}
                  <div className="text-xs text-gray-400 italic mt-1 mb-3 pl-2 border-l-2 border-gray-700">
                    <div className="font-semibold text-gray-300 mb-1">Decibel Reference:</div>
                    <div className="space-y-0.5">
                      <div>30-40 dB: Library, quiet bedroom</div>
                      <div>40-50 dB: Quiet residential area</div>
                      <div>50-60 dB: Normal conversation</div>
                      <div>60-70 dB: Busy office, restaurant</div>
                      <div>70-80 dB: Busy street, alarm clock</div>
                      <div>80+ dB: Heavy traffic, construction</div>
                    </div>
                  </div>

                  {renderDataField("Solar Potential", fullProperty.utilities.solarPotential, "text", undefined, "130_solar_potential")}
                </div>
              </div>
            </Section>

            {/* Additional Features (Fields 131-138) */}
            <Section title="Additional Features" icon={<Hammer className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("View Type", fullProperty.utilities.viewType, "text", undefined, "131_view_type")}
                  {renderDataField("Lot Features", fullProperty.utilities.lotFeatures, "text", undefined, "132_lot_features")}
                  {renderDataField("EV Charging", fullProperty.utilities.evChargingYn, "text", undefined, "133_ev_charging")}
                  {renderDataField("Smart Home Features", fullProperty.utilities.smartHomeFeatures, "text", undefined, "134_smart_home_features")}
                </div>
                <div>
                  {renderDataField("Accessibility Modifications", fullProperty.utilities.accessibilityMods, "text", undefined, "135_accessibility_modifications")}
                  {renderDataField("Pet Policy", fullProperty.utilities.petPolicy, "text", undefined, "136_pet_policy")}
                  {renderDataField("Age Restrictions", fullProperty.utilities.ageRestrictions, "text", undefined, "137_age_restrictions")}
                  {renderDataField("Special Assessments", fullProperty.financial.specialAssessments, "text", undefined, "138_special_assessments")}
                </div>
              </div>
            </Section>

            {/* Stellar MLS - Parking & Garage (Fields 139-143) */}
            <Section title="Parking & Garage" icon={<Building2 className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Carport", fullProperty.stellarMLS?.parking?.carportYn, "text", undefined, "139_carport_yn")}
                  {renderDataField("Carport Spaces", fullProperty.stellarMLS?.parking?.carportSpaces, "number", undefined, "140_carport_spaces")}
                  {renderDataField("Garage Attached", fullProperty.stellarMLS?.parking?.garageAttachedYn, "text", undefined, "141_garage_attached_yn")}
                </div>
                <div>
                  {renderMultiSelectField("Parking Features", fullProperty.stellarMLS?.parking?.parkingFeatures, "142_parking_features")}
                  {renderDataField("Assigned Parking Spaces", fullProperty.stellarMLS?.parking?.assignedParkingSpaces, "number", undefined, "143_assigned_parking_spaces")}
                </div>
              </div>
            </Section>

            {/* Stellar MLS - Building Info (Fields 144-148) */}
            <Section title="Building Info" icon={<Building2 className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Floor Number", fullProperty.stellarMLS?.building?.floorNumber, "number", undefined, "144_floor_number")}
                  {renderDataField("Building Total Floors", fullProperty.stellarMLS?.building?.buildingTotalFloors, "number", undefined, "145_building_total_floors")}
                  {renderDataField("Building Name/Number", fullProperty.stellarMLS?.building?.buildingNameNumber, "text", undefined, "146_building_name_number")}
                </div>
                <div>
                  {renderDataField("Building Elevator", fullProperty.stellarMLS?.building?.buildingElevatorYn, "text", undefined, "147_building_elevator_yn")}
                  {renderDataField("Floors in Unit", fullProperty.stellarMLS?.building?.floorsInUnit, "number", undefined, "148_floors_in_unit")}
                </div>
              </div>
            </Section>

            {/* Stellar MLS - Legal & Tax (Fields 149-154) */}
            <Section title="Legal & Tax" icon={<Shield className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Subdivision Name", fullProperty.stellarMLS?.legal?.subdivisionName, "text", undefined, "149_subdivision_name")}
                  {renderDataField("Legal Description", fullProperty.stellarMLS?.legal?.legalDescription, "text", undefined, "150_legal_description")}
                  {renderDataField("Homestead Exemption", fullProperty.stellarMLS?.legal?.homesteadYn, "text", undefined, "151_homestead_yn")}
                </div>
                <div>
                  {renderDataField("CDD (Community Development District)", fullProperty.stellarMLS?.legal?.cddYn, "text", undefined, "152_cdd_yn")}
                  {renderDataField("Annual CDD Fee", fullProperty.stellarMLS?.legal?.annualCddFee, "currency", undefined, "153_annual_cdd_fee")}
                  {renderDataField("Front Exposure", fullProperty.stellarMLS?.legal?.frontExposure, "text", undefined, "154_front_exposure")}
                </div>
              </div>
            </Section>

            {/* Stellar MLS - Waterfront (Fields 155-159) */}
            <Section title="Waterfront" icon={<Trees className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Water Frontage", fullProperty.stellarMLS?.waterfront?.waterFrontageYn, "text", undefined, "155_water_frontage_yn")}
                  {renderDataField("Waterfront Feet", fullProperty.stellarMLS?.waterfront?.waterfrontFeet, "number", undefined, "156_waterfront_feet")}
                  {renderDataField("Water Access", fullProperty.stellarMLS?.waterfront?.waterAccessYn, "text", undefined, "157_water_access_yn")}
                </div>
                <div>
                  {renderDataField("Water View", fullProperty.stellarMLS?.waterfront?.waterViewYn, "text", undefined, "158_water_view_yn")}
                  {renderDataField("Water Body Name", fullProperty.stellarMLS?.waterfront?.waterBodyName, "text", undefined, "159_water_body_name")}
                </div>
              </div>

              {/* Extended Data - Waterfront Features */}
              {fullProperty?.extendedMLS?.waterfrontFeatures && fullProperty.extendedMLS.waterfrontFeatures.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Waterfront Features</h4>
                    <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-400/30 rounded text-purple-300 text-xs font-bold">E.D.</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {fullProperty.extendedMLS.waterfrontFeatures.map((feature: string, idx: number) => (
                      <span key={idx} className="px-3 py-1.5 bg-cyan-500/20 border border-cyan-400/30 rounded-lg text-cyan-300 text-sm font-semibold">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* Stellar MLS - Leasing & Pets (Fields 160-165) */}
            <Section title="Leasing & Pets" icon={<Home className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Can Be Leased", fullProperty.stellarMLS?.leasing?.canBeLeasedYn, "text", undefined, "160_can_be_leased_yn")}
                  {renderDataField("Minimum Lease Period", fullProperty.stellarMLS?.leasing?.minimumLeasePeriod, "text", undefined, "161_minimum_lease_period")}
                  {renderDataField("Lease Restrictions", fullProperty.stellarMLS?.leasing?.leaseRestrictionsYn, "text", undefined, "162_lease_restrictions_yn")}
                </div>
                <div>
                  {renderDataField("Pet Size Limit", fullProperty.stellarMLS?.leasing?.petSizeLimit, "text", undefined, "163_pet_size_limit")}
                  {renderDataField("Max Pet Weight (lbs)", fullProperty.stellarMLS?.leasing?.maxPetWeight, "number", undefined, "164_max_pet_weight")}
                  {renderDataField("Association Approval Required", fullProperty.stellarMLS?.leasing?.associationApprovalYn, "text", undefined, "165_association_approval_yn")}
                </div>
              </div>
            </Section>

            {/* Stellar MLS - Community & Features (Fields 166-168) */}
            <Section title="Community & Features" icon={<Sparkles className="w-6 h-6" />} defaultExpanded={true}>
              <div className="grid grid-cols-1 gap-4">
                {renderMultiSelectField("Community Features", fullProperty.stellarMLS?.features?.communityFeatures, "166_community_features")}
                {renderMultiSelectField("Interior Features", fullProperty.stellarMLS?.features?.interiorFeatures, "167_interior_features")}
                {renderMultiSelectField("Exterior Features", fullProperty.stellarMLS?.features?.exteriorFeatures, "168_exterior_features")}
              </div>
            </Section>

            {/* Section W: Market Performance (Fields 169-181) - Updated 2026-01-11 */}
            <Section title="Market Performance" icon={<TrendingUp className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Market Metrics (169-174) */}
                {renderDataField("Months of Inventory", fullProperty.marketPerformance?.monthsOfInventory, "number", <TrendingUp className="w-5 h-5" />, "169_months_of_inventory")}
                {renderDataField("New Listings (30d)", fullProperty.marketPerformance?.newListings30d, "number", <Home className="w-5 h-5" />, "170_new_listings_30d")}
                {renderDataField("Homes Sold (30d)", fullProperty.marketPerformance?.homesSold30d, "number", <CheckCircle className="w-5 h-5" />, "171_homes_sold_30d")}
                {renderDataField("Median DOM (ZIP)", fullProperty.marketPerformance?.medianDomZip, "number", <Calendar className="w-5 h-5" />, "172_median_dom_zip")}
                {renderDataField("Price Reduced %", fullProperty.marketPerformance?.priceReducedPercent, "percent", <TrendingDown className="w-5 h-5" />, "173_price_reduced_percent")}
                {renderDataField("Homes Under Contract", fullProperty.marketPerformance?.homesUnderContract, "number", <FileText className="w-5 h-5" />, "174_homes_under_contract")}

                {/* Market Analysis (175-181) */}
                {renderDataField("Market Type", fullProperty.marketPerformance?.marketType, "text", <TrendingUp className="w-5 h-5" />, "175_market_type")}
                {renderDataField("Avg Sale-to-List %", fullProperty.marketPerformance?.avgSaleToListPercent, "percent", <Target className="w-5 h-5" />, "176_avg_sale_to_list_percent")}
                {renderDataField("Avg Days to Pending", fullProperty.marketPerformance?.avgDaysToPending, "number", <Calendar className="w-5 h-5" />, "177_avg_days_to_pending")}
                {renderDataField("Multiple Offers Likelihood", fullProperty.marketPerformance?.multipleOffersLikelihood, "text", <TrendingUp className="w-5 h-5" />, "178_multiple_offers_likelihood")}
                {renderDataField("Appreciation %", fullProperty.marketPerformance?.appreciationPercent, "percent", <TrendingUp className="w-5 h-5" />, "179_appreciation_percent")}
                {renderDataField("Price Trend", fullProperty.marketPerformance?.priceTrend, "text", <TrendingUp className="w-5 h-5" />, "180_price_trend")}
                {renderDataField("Rent Zestimate", fullProperty.marketPerformance?.rentZestimate, "currency", <DollarSign className="w-5 h-5" />, "181_rent_zestimate")}
              </div>

              {/* Property Description - Public Remarks (Field 48 extraction result) */}
              {fullProperty.publicRemarksExtracted && fullProperty.publicRemarksExtracted.length > 50 && (
                <div className="mt-8 bg-quantum-dark/30 p-6 rounded-lg border border-quantum-cyan/20">
                  <div className="flex items-start gap-3 mb-4">
                    <FileText className="w-5 h-5 text-quantum-cyan mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        Property Description
                      </h3>
                      <p className="text-sm text-gray-400">
                        Original listing agent remarks from Stellar MLS. Data extracted to specific fields above has been removed from this display.
                      </p>
                    </div>
                  </div>
                  <div className="text-white leading-relaxed whitespace-pre-wrap">
                    {fullProperty.publicRemarksExtracted}
                  </div>
                  <div className="mt-4 pt-4 border-t border-quantum-cyan/10">
                    <span className="text-xs text-gray-500">
                      Source: Stellar MLS Public Remarks (Field 48 extraction)
                    </span>
                  </div>
                </div>
              )}
            </Section>
          </div>
        ) : (
          <motion.div variants={itemVariants} className="glass-card p-8 text-center">
            <AlertCircle className="w-16 h-16 text-quantum-gold mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Limited Data Available</h3>
            <p className="text-gray-400 mb-6">
              This property only has basic information. Upload a complete CSV or use the Search Property page to add full 138-field data.
            </p>
            <Link to="/search" className="btn-quantum inline-flex items-center gap-2">
              <Search className="w-5 h-5" />
              Add Complete Data
            </Link>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex gap-4 mt-8">
          <Link to="/compare" className="btn-quantum flex-1 text-center">
            Compare Properties
          </Link>
          <Link to="/properties" className="btn-glass flex-1 text-center">
            Back to List
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
