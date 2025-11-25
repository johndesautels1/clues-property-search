/**
 * CLUES Property Dashboard - Comprehensive Property Detail Page
 * Displays all 110 fields organized by category with data quality indicators
 */

import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  ArrowLeft,
  Share2,
  Heart,
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
  Search,
} from 'lucide-react';
import { usePropertyStore } from '@/store/propertyStore';
import { useIsAdmin } from '@/store/authStore';

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
  llmSources?: string[];
  hasConflict?: boolean;
  conflictValues?: Array<{ source: string; value: any }>;
  fieldKey?: string; // Field key for retry API calls
  onRetry?: (fieldKey: string, llmName: string) => void;
  isRetrying?: boolean;
  isAdmin?: boolean; // Controls visibility of source info
}

const DataField = ({ label, value, icon, format = 'text', confidence, llmSources, hasConflict, conflictValues, fieldKey, onRetry, isRetrying, isAdmin = false }: DataFieldProps) => {
  const [showRetry, setShowRetry] = useState(false);

  // Don't render if no value AND not explicitly showing missing data
  const isMissing = value === null || value === undefined || value === '';
  const needsRetry = isMissing || confidence === 'Low' || confidence === 'Unverified';

  const formattedValue = formatValue(value, format);

  // Determine background color based on status (ADMIN ONLY - users see neutral styling)
  let bgColor = 'bg-transparent';
  let borderColor = 'border-white/5';
  let statusBadge = null;

  // Only show color coding and status badges to admins
  if (isAdmin) {
    if (hasConflict && conflictValues && conflictValues.length > 0) {
      // 🟡 YELLOW: Conflicting data from multiple LLMs
      bgColor = 'bg-yellow-500/10';
      borderColor = 'border-yellow-500/30';
      statusBadge = (
        <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs">
          <div className="flex items-center gap-1 text-yellow-400 font-semibold mb-1">
            <AlertCircle className="w-3 h-3" />
            CONFLICT DETECTED
          </div>
          <div className="text-gray-300">
            {conflictValues.map((cv, idx) => (
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
      // 🔴 RED: Suspected hallucination (low confidence)
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
          {isAdmin && llmSources && llmSources.length > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              Source: {llmSources.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
            </div>
          )}
        </div>
      </div>
      {/* STATUS BADGES - ADMIN ONLY */}
      {isAdmin && statusBadge}

      {/* Retry UI - ADMIN ONLY */}
      {isAdmin && showRetry && needsRetry && fieldKey && onRetry && (
        <div className="mt-2 p-3 bg-black/30 border border-quantum-cyan/20 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">
            {isRetrying ? 'Fetching...' : 'Try fetching this field with:'}
          </div>
          <div className="flex flex-wrap gap-2">
            {['Claude Opus', 'GPT', 'Grok', 'Claude Sonnet', 'Copilot', 'Gemini'].map((llm) => (
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
  if (value === null || value === undefined) return 'N/A';

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
      if (Array.isArray(value)) return value.join(', ');
      return String(value);
  }
};

// Helper to extract DataField metadata for display
interface DataFieldInput<T> {
  value: T | null;
  confidence?: string;
  llmSources?: string[];
  hasConflict?: boolean;
  conflictValues?: Array<{ source: string; value: any }>;
}

// This will be set by the component
let globalRetryHandler: ((fieldKey: string, llmName: string) => void) | undefined;
let globalIsRetrying = false;
let globalIsAdmin = false; // Controls source visibility (admin vs user view)

const renderDataField = (
  label: string,
  field: DataFieldInput<any>,
  format: 'currency' | 'number' | 'percent' | 'date' | 'text' = 'text',
  icon?: React.ReactNode,
  fieldKey?: string
) => {
  return (
    <DataField
      label={label}
      value={field.value}
      format={format}
      icon={icon}
      confidence={field.confidence}
      llmSources={field.llmSources}
      hasConflict={field.hasConflict}
      conflictValues={field.conflictValues}
      fieldKey={fieldKey}
      onRetry={globalRetryHandler}
      isRetrying={globalIsRetrying}
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
  const { getPropertyById, getFullPropertyById, removeProperty, updateFullProperty } = usePropertyStore();
  const [isRetrying, setIsRetrying] = useState(false);
  const isAdmin = useIsAdmin(); // Check if current user is admin (agent/broker)

  const property = id ? getPropertyById(id) : undefined;
  const fullProperty = id ? getFullPropertyById(id) : undefined;

  // Retry handler - calls API with specific LLM (ADMIN ONLY)
  const handleRetryField = async (fieldKey: string, llmName: string) => {
    globalIsRetrying = true;
    if (!fullProperty || !id) return;

    setIsRetrying(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api/property/search';
      const address = fullProperty.address.fullAddress.value;

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
        const newFieldData = data.fields[fieldKey];

        if (newFieldData && newFieldData.value != null) {
          const updated = JSON.parse(JSON.stringify(fullProperty));
          const paths: Record<string, [string, string]> = {
            '1_full_address': ['address', 'fullAddress'],
            '7_listing_price': ['address', 'listingPrice'],
            '12_bedrooms': ['details', 'bedrooms'],
            '16_living_sqft': ['details', 'livingSqft'],
            '65_walk_score': ['location', 'walkScore'],
            '100_flood_zone': ['utilities', 'floodZone'],
          };
          const path = paths[fieldKey];
          if (path && updated[path[0]]) {
            updated[path[0]][path[1]] = { value: newFieldData.value, confidence: 'Medium', notes: `Updated by ${llmName}`, sources: [llmName] };
            updateFullProperty(id, updated);
            alert(`✅ ${llmName}: ${newFieldData.value}`);
          } else { alert(`✅ ${llmName}: ${newFieldData.value}`); }
        } else {
          alert(`❌ ${llmName} found no data`);
        }
      } else {
        alert(`Error calling ${llmName} API`);
      }
    } catch (error) {
      console.error('Retry error:', error);
      alert(`Failed to retry with ${llmName}: ${error}`);
    } finally {
      setIsRetrying(false);
      globalIsRetrying = false;
    }
  };

  // Set global handlers and admin state
  globalRetryHandler = handleRetryField;
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

      {/* Hero Image */}
      <motion.div
        variants={itemVariants}
        className="relative h-64 md:h-96 bg-gradient-to-br from-quantum-dark to-quantum-card"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin className="w-24 h-24 text-gray-600" />
        </div>

        {/* SMART Score Badge */}
        <div className="absolute bottom-4 right-4 glass-card px-6 py-3">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-quantum-cyan" />
            <span className={`text-3xl font-bold ${
              property.smartScore >= 90 ? 'text-quantum-green' :
              property.smartScore >= 70 ? 'text-quantum-cyan' :
              'text-quantum-gold'
            }`}>
              {property.smartScore}
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
        {/* Address & Price Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {fullProperty?.address.fullAddress.value || property.address}
              </h1>
              <p className="text-lg text-gray-400">
                {property.city}, {property.state} {property.zip}
              </p>
            </div>
            <div className="text-left md:text-right">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                {formatValue(property.price, 'currency')}
              </div>
              {property.pricePerSqft > 0 && (
                <p className="text-gray-400">
                  ${property.pricePerSqft}/sqft
                </p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
              property.listingStatus === 'Active' ? 'bg-quantum-green/20 text-quantum-green' :
              property.listingStatus === 'Pending' ? 'bg-quantum-gold/20 text-quantum-gold' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {property.listingStatus}
            </span>
            <span className="text-sm text-gray-400">
              {property.dataCompleteness}% Data Complete ({Math.round(property.dataCompleteness * 1.1)}/110 fields)
            </span>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="glass-card p-6 text-center">
            <Bed className="w-6 h-6 text-quantum-cyan mx-auto mb-2" />
            <span className="text-2xl font-bold text-white block">{property.bedrooms}</span>
            <p className="text-sm text-gray-500">Bedrooms</p>
          </div>
          <div className="glass-card p-6 text-center">
            <Bath className="w-6 h-6 text-quantum-cyan mx-auto mb-2" />
            <span className="text-2xl font-bold text-white block">{property.bathrooms}</span>
            <p className="text-sm text-gray-500">Bathrooms</p>
          </div>
          <div className="glass-card p-6 text-center">
            <Ruler className="w-6 h-6 text-quantum-cyan mx-auto mb-2" />
            <span className="text-2xl font-bold text-white block">{property.sqft.toLocaleString()}</span>
            <p className="text-sm text-gray-500">Sq Ft</p>
          </div>
          <div className="glass-card p-6 text-center">
            <Calendar className="w-6 h-6 text-quantum-cyan mx-auto mb-2" />
            <span className="text-2xl font-bold text-white block">{property.yearBuilt}</span>
            <p className="text-sm text-gray-500">Year Built</p>
          </div>
        </motion.div>

        {/* Full Property Data Sections */}
        {fullProperty ? (
          <div className="space-y-6">
            {/* Address & Identity */}
            <Section title="Address & Identity" icon={<MapPin className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Full Address", fullProperty.address.fullAddress)}
                  {renderDataField("MLS Primary", fullProperty.address.mlsPrimary)}
                  {renderDataField("MLS Secondary", fullProperty.address.mlsSecondary)}
                  {renderDataField("Listing Status", fullProperty.address.listingStatus)}
                </div>
                <div>
                  {renderDataField("Listing Date", fullProperty.address.listingDate, 'date')}
                  {renderDataField("Neighborhood", fullProperty.address.neighborhoodName)}
                  {renderDataField("County", fullProperty.address.county)}
                  {renderDataField("ZIP Code", fullProperty.address.zipCode)}
                  {renderDataField("Parcel ID", fullProperty.details.parcelId)}
                </div>
              </div>
            </Section>

            {/* Pricing */}
            <Section title="Pricing & Value" icon={<DollarSign className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Listing Price", fullProperty.address.listingPrice, 'currency')}
                  {renderDataField("Price Per Sq Ft", fullProperty.address.pricePerSqft, 'currency')}
                  {renderDataField("Market Value Estimate", fullProperty.details.marketValueEstimate, 'currency')}
                </div>
                <div>
                  {renderDataField("Last Sale Date", fullProperty.details.lastSaleDate, 'date')}
                  {renderDataField("Last Sale Price", fullProperty.details.lastSalePrice, 'currency')}
                  {renderDataField("Assessed Value", fullProperty.details.assessedValue, 'currency')}
                  {renderDataField("Redfin Estimate", fullProperty.financial.redfinEstimate, 'currency')}
                </div>
              </div>
            </Section>

            {/* Property Basics */}
            <Section title="Property Basics" icon={<Home className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  {renderDataField("Bedrooms", fullProperty.details.bedrooms, "number")}
                  {renderDataField("Full Bathrooms", fullProperty.details.fullBathrooms, "number")}
                  {renderDataField("Half Bathrooms", fullProperty.details.halfBathrooms, "number")}
                  {renderDataField("Total Bathrooms", fullProperty.details.totalBathrooms, "number")}
                </div>
                <div>
                  {renderDataField("Living Sq Ft", fullProperty.details.livingSqft, "number")}
                  {renderDataField("Total Sq Ft Under Roof", fullProperty.details.totalSqftUnderRoof, "number")}
                  {renderDataField("Lot Size (Sq Ft)", fullProperty.details.lotSizeSqft, "number")}
                  {renderDataField("Lot Size (Acres)", fullProperty.details.lotSizeAcres, "number")}
                </div>
                <div>
                  {renderDataField("Year Built", fullProperty.details.yearBuilt)}
                  {renderDataField("Property Type", fullProperty.details.propertyType)}
                  {renderDataField("Stories", fullProperty.details.stories, "number")}
                  {renderDataField("Garage Spaces", fullProperty.details.garageSpaces, "number")}
                  {renderDataField("Parking Total", fullProperty.details.parkingTotal)}
                </div>
              </div>
            </Section>

            {/* HOA & Taxes */}
            <Section title="HOA & Taxes" icon={<Shield className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("HOA", fullProperty.details.hoaYn)}
                  {renderDataField("HOA Fee (Annual)", fullProperty.details.hoaFeeAnnual, "currency")}
                  {renderDataField("HOA Name", fullProperty.details.hoaName)}
                  {renderDataField("HOA Includes", fullProperty.details.hoaIncludes)}
                  {renderDataField("Ownership Type", fullProperty.details.ownershipType)}
                </div>
                <div>
                  {renderDataField("Annual Taxes", fullProperty.details.annualTaxes, "currency")}
                  {renderDataField("Tax Year", fullProperty.details.taxYear)}
                  {renderDataField("Property Tax Rate", fullProperty.financial.propertyTaxRate, "percent")}
                  {renderDataField("Tax Exemptions", fullProperty.financial.taxExemptions)}
                </div>
              </div>
            </Section>

            {/* Structure & Systems */}
            <Section title="Structure & Systems" icon={<Building2 className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Roof Type", fullProperty.structural.roofType)}
                  {renderDataField("Roof Age (Est)", fullProperty.structural.roofAgeEst)}
                  {renderDataField("Exterior Material", fullProperty.structural.exteriorMaterial)}
                  {renderDataField("Foundation", fullProperty.structural.foundation)}
                  {renderDataField("Water Heater Type", fullProperty.structural.waterHeaterType)}
                  {renderDataField("Garage Type", fullProperty.structural.garageType)}
                </div>
                <div>
                  {renderDataField("HVAC Type", fullProperty.structural.hvacType)}
                  {renderDataField("HVAC Age", fullProperty.structural.hvacAge)}
                  {renderDataField("Laundry Type", fullProperty.structural.laundryType)}
                  {renderDataField("Interior Condition", fullProperty.structural.interiorCondition)}
                </div>
              </div>
            </Section>

            {/* Interior Features */}
            <Section title="Interior Features" icon={<Home className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Flooring Type", fullProperty.structural.flooringType)}
                  {renderDataField("Kitchen Features", fullProperty.structural.kitchenFeatures)}
                  {renderDataField("Appliances Included", fullProperty.structural.appliancesIncluded)}
                </div>
                <div>
                  {renderDataField("Fireplace", fullProperty.structural.fireplaceYn)}
                  {renderDataField("Fireplace Count", fullProperty.structural.fireplaceCount, "number")}
                </div>
              </div>
            </Section>

            {/* Exterior Features */}
            <Section title="Exterior Features" icon={<Trees className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Pool", fullProperty.structural.poolYn)}
                  {renderDataField("Pool Type", fullProperty.structural.poolType)}
                  {renderDataField("Deck/Patio", fullProperty.structural.deckPatio)}
                </div>
                <div>
                  {renderDataField("Fence", fullProperty.structural.fence)}
                  {renderDataField("Landscaping", fullProperty.structural.landscaping)}
                </div>
              </div>
            </Section>

            {/* Permits & Renovations */}
            <Section title="Permits & Renovations" icon={<Wrench className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Recent Renovations", fullProperty.structural.recentRenovations)}
                  {renderDataField("Permit History - Roof", fullProperty.structural.permitHistoryRoof)}
                </div>
                <div>
                  {renderDataField("Permit History - HVAC", fullProperty.structural.permitHistoryHvac)}
                  {renderDataField("Permit History - Other", fullProperty.structural.permitHistoryPoolAdditions)}
                </div>
              </div>
            </Section>

            {/* Schools */}
            <Section title="Assigned Schools" icon={<School className="w-6 h-6" />}>
              <div className="space-y-4">
                <div className="mb-4">
                  {renderDataField("School District", fullProperty.location.schoolDistrictName)}
                  {renderDataField("Elevation (feet)", fullProperty.location.elevationFeet, "number")}
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

            {/* Location Scores */}
            <Section title="Location Scores" icon={<Target className="w-6 h-6" />}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderDataField("Noise Level", fullProperty.location.noiseLevel)}
                {renderDataField("Traffic Level", fullProperty.location.trafficLevel)}
                {renderDataField("Walkability Description", fullProperty.location.walkabilityDescription)}
                {renderDataField("Public Transit Access", fullProperty.location.publicTransitAccess)}
                {renderDataField("Commute to City Center", fullProperty.location.commuteTimeCityCenter)}
              </div>
            </Section>

            {/* Distances & Amenities */}
            <Section title="Distances & Amenities" icon={<MapPin className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {renderDataField("Grocery", fullProperty.location.distanceGroceryMiles, "number", <span className="text-xs">mi</span>)}
                {renderDataField("Hospital", fullProperty.location.distanceHospitalMiles, "number", <span className="text-xs">mi</span>)}
                {renderDataField("Airport", fullProperty.location.distanceAirportMiles, "number", <span className="text-xs">mi</span>)}
                {renderDataField("Park", fullProperty.location.distanceParkMiles, "number", <span className="text-xs">mi</span>)}
                {renderDataField("Beach", fullProperty.location.distanceBeachMiles, "number", <span className="text-xs">mi</span>)}
              </div>
            </Section>

            {/* Safety & Crime */}
            <Section title="Safety & Crime" icon={<Shield className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderDataField("Violent Crime Index", fullProperty.location.crimeIndexViolent)}
                {renderDataField("Property Crime Index", fullProperty.location.crimeIndexProperty)}
                {renderDataField("Neighborhood Safety Rating", fullProperty.location.neighborhoodSafetyRating)}
              </div>
            </Section>

            {/* Market & Investment */}
            <Section title="Market & Investment Data" icon={<TrendingUp className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Median Home Price (Neighborhood)", fullProperty.financial.medianHomePriceNeighborhood, "currency")}
                  {renderDataField("Price Per Sq Ft (Recent Avg)", fullProperty.financial.pricePerSqftRecentAvg, "currency")}
                  {renderDataField("Price to Rent Ratio", fullProperty.financial.priceToRentRatio, "number")}
                  {renderDataField("Price vs Median %", fullProperty.financial.priceVsMedianPercent, "percent")}
                  {renderDataField("Days on Market (Avg)", fullProperty.financial.daysOnMarketAvg, "number")}
                  {renderDataField("Inventory Surplus", fullProperty.financial.inventorySurplus)}
                  {renderDataField("Insurance Estimate (Annual)", fullProperty.financial.insuranceEstAnnual, "currency")}
                </div>
                <div>
                  {renderDataField("Rental Estimate (Monthly)", fullProperty.financial.rentalEstimateMonthly, "currency")}
                  {renderDataField("Rental Yield (Est)", fullProperty.financial.rentalYieldEst, "percent")}
                  {renderDataField("Vacancy Rate (Neighborhood)", fullProperty.financial.vacancyRateNeighborhood, "percent")}
                  {renderDataField("Cap Rate (Est)", fullProperty.financial.capRateEst, "percent")}
                  {renderDataField("Financing Terms", fullProperty.financial.financingTerms)}
                  {renderDataField("Comparable Sales", fullProperty.financial.comparableSalesLast3)}
                </div>
              </div>
            </Section>

            {/* Utilities */}
            <Section title="Utilities & Connectivity" icon={<Wifi className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Electric Provider", fullProperty.utilities.electricProvider, "text", <Zap className="w-4 h-4" />)}
                  {renderDataField("Avg Electric Bill", fullProperty.utilities.avgElectricBill)}
                  {renderDataField("Water Provider", fullProperty.utilities.waterProvider)}
                  {renderDataField("Avg Water Bill", fullProperty.utilities.avgWaterBill)}
                  {renderDataField("Sewer Provider", fullProperty.utilities.sewerProvider)}
                  {renderDataField("Natural Gas", fullProperty.utilities.naturalGas)}
                  {renderDataField("Trash Provider", fullProperty.utilities.trashProvider)}
                </div>
                <div>
                  {renderDataField("Internet Providers (Top 3)", fullProperty.utilities.internetProvidersTop3)}
                  {renderDataField("Max Internet Speed", fullProperty.utilities.maxInternetSpeed)}
                  {renderDataField("Fiber Available", fullProperty.utilities.fiberAvailable)}
                  {renderDataField("Cable TV Provider", fullProperty.utilities.cableTvProvider)}
                  {renderDataField("Cell Coverage Quality", fullProperty.utilities.cellCoverageQuality)}
                  {renderDataField("Emergency Services Distance", fullProperty.utilities.emergencyServicesDistance)}
                </div>
              </div>
            </Section>

            {/* Environment & Risk */}
            <Section title="Environment & Risk" icon={<Sun className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Air Quality Index", fullProperty.utilities.airQualityIndexCurrent)}
                  {renderDataField("Air Quality Grade", fullProperty.utilities.airQualityGrade)}
                  {renderDataField("Flood Zone", fullProperty.utilities.floodZone)}
                  {renderDataField("Flood Risk Level", fullProperty.utilities.floodRiskLevel)}
                  {renderDataField("Climate Risk", fullProperty.utilities.climateRiskWildfireFlood)}
                  {renderDataField("Wildfire Risk", fullProperty.utilities.wildfireRisk)}
                  {renderDataField("Earthquake Risk", fullProperty.utilities.earthquakeRisk)}
                  {renderDataField("Hurricane Risk", fullProperty.utilities.hurricaneRisk)}
                </div>
                <div>
                  {renderDataField("Tornado Risk", fullProperty.utilities.tornadoRisk)}
                  {renderDataField("Radon Risk", fullProperty.utilities.radonRisk)}
                  {renderDataField("Superfund Site Nearby", fullProperty.utilities.superfundNearby)}
                  {renderDataField("Sea Level Rise Risk", fullProperty.utilities.seaLevelRiseRisk)}
                  {renderDataField("Noise Level (dB Est)", fullProperty.utilities.noiseLevelDbEst)}
                  {renderDataField("Solar Potential", fullProperty.utilities.solarPotential)}
                </div>
              </div>
            </Section>

            {/* Additional Features */}
            <Section title="Additional Features" icon={<Hammer className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("View Type", fullProperty.utilities.viewType)}
                  {renderDataField("Lot Features", fullProperty.utilities.lotFeatures)}
                  {renderDataField("EV Charging", fullProperty.utilities.evChargingYn)}
                  {renderDataField("Smart Home Features", fullProperty.utilities.smartHomeFeatures)}
                  {renderDataField("Accessibility Modifications", fullProperty.utilities.accessibilityMods)}
                </div>
                <div>
                  {renderDataField("Pet Policy", fullProperty.utilities.petPolicy)}
                  {renderDataField("Age Restrictions", fullProperty.utilities.ageRestrictions)}
                  {renderDataField("Special Assessments", fullProperty.utilities.specialAssessments)}
                </div>
              </div>
            </Section>
          </div>
        ) : (
          <motion.div variants={itemVariants} className="glass-card p-8 text-center">
            <AlertCircle className="w-16 h-16 text-quantum-gold mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Limited Data Available</h3>
            <p className="text-gray-400 mb-6">
              This property only has basic information. Upload a complete CSV or use the Search Property page to add full 110-field data.
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
