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
            // Address & Identity
            '1_full_address': ['address', 'fullAddress'],
            '2_mls_primary': ['address', 'mlsPrimary'],
            '3_mls_secondary': ['address', 'mlsSecondary'],
            '4_listing_status': ['address', 'listingStatus'],
            '5_listing_date': ['address', 'listingDate'],
            '6_parcel_id': ['details', 'parcelId'],
            // Pricing
            '7_listing_price': ['address', 'listingPrice'],
            '8_price_per_sqft': ['address', 'pricePerSqft'],
            '9_market_value_estimate': ['details', 'marketValueEstimate'],
            '10_last_sale_date': ['details', 'lastSaleDate'],
            '11_last_sale_price': ['details', 'lastSalePrice'],
            // Property Basics
            '12_bedrooms': ['details', 'bedrooms'],
            '13_full_bathrooms': ['details', 'fullBathrooms'],
            '14_half_bathrooms': ['details', 'halfBathrooms'],
            '15_total_bathrooms': ['details', 'totalBathrooms'],
            '16_living_sqft': ['details', 'livingSqft'],
            '17_total_sqft_under_roof': ['details', 'totalSqftUnderRoof'],
            '18_lot_size_sqft': ['details', 'lotSizeSqft'],
            '19_lot_size_acres': ['details', 'lotSizeAcres'],
            '20_year_built': ['details', 'yearBuilt'],
            '21_property_type': ['details', 'propertyType'],
            '22_stories': ['details', 'stories'],
            '23_garage_spaces': ['details', 'garageSpaces'],
            '24_parking_total': ['details', 'parkingTotal'],
            // HOA & Ownership
            '25_hoa_yn': ['details', 'hoaYn'],
            '26_hoa_fee_annual': ['details', 'hoaFeeAnnual'],
            '27_ownership_type': ['details', 'ownershipType'],
            '28_county': ['address', 'county'],
            // Taxes
            '29_annual_taxes': ['details', 'annualTaxes'],
            '30_tax_year': ['details', 'taxYear'],
            '31_assessed_value': ['details', 'assessedValue'],
            '32_tax_exemptions': ['financial', 'taxExemptions'],
            '33_property_tax_rate': ['financial', 'propertyTaxRate'],
            // Structure
            '36_roof_type': ['structural', 'roofType'],
            '37_roof_age_est': ['structural', 'roofAgeEst'],
            '38_exterior_material': ['structural', 'exteriorMaterial'],
            '39_foundation': ['structural', 'foundation'],
            '40_hvac_type': ['structural', 'hvacType'],
            '41_hvac_age': ['structural', 'hvacAge'],
            '42_flooring_type': ['structural', 'flooringType'],
            '43_kitchen_features': ['structural', 'kitchenFeatures'],
            '44_appliances_included': ['structural', 'appliancesIncluded'],
            '45_fireplace_yn': ['structural', 'fireplaceYn'],
            '46_interior_condition': ['structural', 'interiorCondition'],
            '47_pool_yn': ['structural', 'poolYn'],
            '48_pool_type': ['structural', 'poolType'],
            '49_deck_patio': ['structural', 'deckPatio'],
            '50_fence': ['structural', 'fence'],
            '51_landscaping': ['structural', 'landscaping'],
            '52_recent_renovations': ['structural', 'recentRenovations'],
            '53_permit_history_roof': ['structural', 'permitHistoryRoof'],
            '54_permit_history_hvac': ['structural', 'permitHistoryHvac'],
            '55_permit_history_other': ['structural', 'permitHistoryPoolAdditions'],
            // Schools
            '56_assigned_elementary': ['location', 'assignedElementary'],
            '57_elementary_rating': ['location', 'elementaryRating'],
            '58_elementary_distance_miles': ['location', 'elementaryDistanceMiles'],
            '59_assigned_middle': ['location', 'assignedMiddle'],
            '60_middle_rating': ['location', 'middleRating'],
            '61_middle_distance_miles': ['location', 'middleDistanceMiles'],
            '62_assigned_high': ['location', 'assignedHigh'],
            '63_high_rating': ['location', 'highRating'],
            '64_high_distance_miles': ['location', 'highDistanceMiles'],
            // Location Scores
            '65_walk_score': ['location', 'walkScore'],
            '66_transit_score': ['location', 'transitScore'],
            '67_bike_score': ['location', 'bikeScore'],
            '68_noise_level': ['location', 'noiseLevel'],
            '69_traffic_level': ['location', 'trafficLevel'],
            '70_walkability_description': ['location', 'walkabilityDescription'],
            '71_commute_time_city_center': ['location', 'commuteTimeCityCenter'],
            '72_public_transit_access': ['location', 'publicTransitAccess'],
            // Distances
            '73_distance_grocery_miles': ['location', 'distanceGroceryMiles'],
            '74_distance_hospital_miles': ['location', 'distanceHospitalMiles'],
            '75_distance_airport_miles': ['location', 'distanceAirportMiles'],
            '76_distance_park_miles': ['location', 'distanceParkMiles'],
            '77_distance_beach_miles': ['location', 'distanceBeachMiles'],
            // Safety
            '78_crime_index_violent': ['location', 'crimeIndexViolent'],
            '79_crime_index_property': ['location', 'crimeIndexProperty'],
            '80_neighborhood_safety_rating': ['location', 'neighborhoodSafetyRating'],
            // Market & Investment
            '81_median_home_price_neighborhood': ['financial', 'medianHomePriceNeighborhood'],
            '82_price_per_sqft_recent_avg': ['financial', 'pricePerSqftRecentAvg'],
            '83_days_on_market_avg': ['financial', 'daysOnMarketAvg'],
            '84_inventory_surplus': ['financial', 'inventorySurplus'],
            '85_rental_estimate_monthly': ['financial', 'rentalEstimateMonthly'],
            '86_rental_yield_est': ['financial', 'rentalYieldEst'],
            '87_vacancy_rate_neighborhood': ['financial', 'vacancyRateNeighborhood'],
            '88_cap_rate_est': ['financial', 'capRateEst'],
            '89_insurance_est_annual': ['financial', 'insuranceEstAnnual'],
            '90_financing_terms': ['financial', 'financingTerms'],
            '91_comparable_sales': ['financial', 'comparableSalesLast3'],
            // Utilities
            '92_electric_provider': ['utilities', 'electricProvider'],
            '93_water_provider': ['utilities', 'waterProvider'],
            '94_sewer_provider': ['utilities', 'sewerProvider'],
            '95_natural_gas': ['utilities', 'naturalGas'],
            '96_internet_providers_top3': ['utilities', 'internetProvidersTop3'],
            '97_max_internet_speed': ['utilities', 'maxInternetSpeed'],
            '98_cable_tv_provider': ['utilities', 'cableTvProvider'],
            // Environment & Risk
            '99_air_quality_index_current': ['utilities', 'airQualityIndexCurrent'],
            '100_flood_zone': ['utilities', 'floodZone'],
            '101_flood_risk_level': ['utilities', 'floodRiskLevel'],
            '102_climate_risk_summary': ['utilities', 'climateRiskWildfireFlood'],
            '103_noise_level_db_est': ['utilities', 'noiseLevelDbEst'],
            '104_solar_potential': ['utilities', 'solarPotential'],
            // Additional Features
            '105_ev_charging_yn': ['utilities', 'evChargingYn'],
            '106_smart_home_features': ['utilities', 'smartHomeFeatures'],
            '107_accessibility_mods': ['utilities', 'accessibilityMods'],
            '108_pet_policy': ['utilities', 'petPolicy'],
            '109_age_restrictions': ['utilities', 'ageRestrictions'],
            '110_notes_confidence_summary': ['utilities', 'notesConfidenceSummary'],
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
                  {renderDataField("Full Address", fullProperty.address.fullAddress, "text", undefined, "1_full_address")}
                  {renderDataField("MLS Primary", fullProperty.address.mlsPrimary, "text", undefined, "2_mls_primary")}
                  {renderDataField("MLS Secondary", fullProperty.address.mlsSecondary, "text", undefined, "3_mls_secondary")}
                  {renderDataField("Listing Status", fullProperty.address.listingStatus, "text", undefined, "4_listing_status")}
                </div>
                <div>
                  {renderDataField("Listing Date", fullProperty.address.listingDate, 'date', undefined, "5_listing_date")}
                  {renderDataField("Neighborhood", fullProperty.address.neighborhoodName, "text", undefined, "41_neighborhood_name")}
                  {renderDataField("County", fullProperty.address.county, "text", undefined, "28_county")}
                  {renderDataField("ZIP Code", fullProperty.address.zipCode, "text", undefined, "zip")}
                  {renderDataField("Parcel ID", fullProperty.details.parcelId, "text", undefined, "6_parcel_id")}
                </div>
              </div>
            </Section>

            {/* Pricing */}
            <Section title="Pricing & Value" icon={<DollarSign className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Listing Price", fullProperty.address.listingPrice, 'currency', undefined, "7_listing_price")}
                  {renderDataField("Price Per Sq Ft", fullProperty.address.pricePerSqft, 'currency', undefined, "8_price_per_sqft")}
                  {renderDataField("Market Value Estimate", fullProperty.details.marketValueEstimate, 'currency', undefined, "9_market_value_estimate")}
                </div>
                <div>
                  {renderDataField("Last Sale Date", fullProperty.details.lastSaleDate, 'date', undefined, "10_last_sale_date")}
                  {renderDataField("Last Sale Price", fullProperty.details.lastSalePrice, 'currency', undefined, "11_last_sale_price")}
                  {renderDataField("Assessed Value", fullProperty.details.assessedValue, 'currency', undefined, "31_assessed_value")}
                  {renderDataField("Redfin Estimate", fullProperty.financial.redfinEstimate, 'currency', undefined, "74_redfin_estimate")}
                </div>
              </div>
            </Section>

            {/* Property Basics */}
            <Section title="Property Basics" icon={<Home className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  {renderDataField("Bedrooms", fullProperty.details.bedrooms, "number", undefined, "12_bedrooms")}
                  {renderDataField("Full Bathrooms", fullProperty.details.fullBathrooms, "number", undefined, "13_full_bathrooms")}
                  {renderDataField("Half Bathrooms", fullProperty.details.halfBathrooms, "number", undefined, "14_half_bathrooms")}
                  {renderDataField("Total Bathrooms", fullProperty.details.totalBathrooms, "number", undefined, "15_total_bathrooms")}
                </div>
                <div>
                  {renderDataField("Living Sq Ft", fullProperty.details.livingSqft, "number", undefined, "16_living_sqft")}
                  {renderDataField("Total Sq Ft Under Roof", fullProperty.details.totalSqftUnderRoof, "number", undefined, "17_total_sqft_under_roof")}
                  {renderDataField("Lot Size (Sq Ft)", fullProperty.details.lotSizeSqft, "number", undefined, "18_lot_size_sqft")}
                  {renderDataField("Lot Size (Acres)", fullProperty.details.lotSizeAcres, "number", undefined, "19_lot_size_acres")}
                </div>
                <div>
                  {renderDataField("Year Built", fullProperty.details.yearBuilt, "text", undefined, "20_year_built")}
                  {renderDataField("Property Type", fullProperty.details.propertyType, "text", undefined, "21_property_type")}
                  {renderDataField("Stories", fullProperty.details.stories, "number", undefined, "22_stories")}
                  {renderDataField("Garage Spaces", fullProperty.details.garageSpaces, "number", undefined, "23_garage_spaces")}
                  {renderDataField("Parking Total", fullProperty.details.parkingTotal, "text", undefined, "24_parking_total")}
                </div>
              </div>
            </Section>

            {/* HOA & Taxes */}
            <Section title="HOA & Taxes" icon={<Shield className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("HOA", fullProperty.details.hoaYn, "text", undefined, "25_hoa_yn")}
                  {renderDataField("HOA Fee (Annual)", fullProperty.details.hoaFeeAnnual, "currency", undefined, "26_hoa_fee_annual")}
                  {renderDataField("HOA Name", fullProperty.details.hoaName, "text", undefined, "70_hoa_name")}
                  {renderDataField("HOA Includes", fullProperty.details.hoaIncludes, "text", undefined, "71_hoa_includes")}
                  {renderDataField("Ownership Type", fullProperty.details.ownershipType, "text", undefined, "27_ownership_type")}
                </div>
                <div>
                  {renderDataField("Annual Taxes", fullProperty.details.annualTaxes, "currency", undefined, "29_annual_taxes")}
                  {renderDataField("Tax Year", fullProperty.details.taxYear, "text", undefined, "30_tax_year")}
                  {renderDataField("Property Tax Rate", fullProperty.financial.propertyTaxRate, "percent", undefined, "33_property_tax_rate")}
                  {renderDataField("Tax Exemptions", fullProperty.financial.taxExemptions, "text", undefined, "32_tax_exemptions")}
                </div>
              </div>
            </Section>

            {/* Structure & Systems */}
            <Section title="Structure & Systems" icon={<Building2 className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Roof Type", fullProperty.structural.roofType, "text", undefined, "36_roof_type")}
                  {renderDataField("Roof Age (Est)", fullProperty.structural.roofAgeEst, "text", undefined, "37_roof_age_est")}
                  {renderDataField("Exterior Material", fullProperty.structural.exteriorMaterial, "text", undefined, "38_exterior_material")}
                  {renderDataField("Foundation", fullProperty.structural.foundation, "text", undefined, "39_foundation")}
                  {renderDataField("Water Heater Type", fullProperty.structural.waterHeaterType, "text", undefined, "30_water_heater_type")}
                  {renderDataField("Garage Type", fullProperty.structural.garageType, "text", undefined, "31_garage_type")}
                </div>
                <div>
                  {renderDataField("HVAC Type", fullProperty.structural.hvacType, "text", undefined, "40_hvac_type")}
                  {renderDataField("HVAC Age", fullProperty.structural.hvacAge, "text", undefined, "41_hvac_age")}
                  {renderDataField("Laundry Type", fullProperty.structural.laundryType, "text", undefined, "39_laundry_type")}
                  {renderDataField("Interior Condition", fullProperty.structural.interiorCondition, "text", undefined, "46_interior_condition")}
                </div>
              </div>
            </Section>

            {/* Interior Features */}
            <Section title="Interior Features" icon={<Home className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Flooring Type", fullProperty.structural.flooringType, "text", undefined, "42_flooring_type")}
                  {renderDataField("Kitchen Features", fullProperty.structural.kitchenFeatures, "text", undefined, "43_kitchen_features")}
                  {renderDataField("Appliances Included", fullProperty.structural.appliancesIncluded, "text", undefined, "44_appliances_included")}
                </div>
                <div>
                  {renderDataField("Fireplace", fullProperty.structural.fireplaceYn, "text", undefined, "45_fireplace_yn")}
                  {renderDataField("Fireplace Count", fullProperty.structural.fireplaceCount, "number", undefined, "38_fireplace_count")}
                </div>
              </div>
            </Section>

            {/* Exterior Features */}
            <Section title="Exterior Features" icon={<Trees className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Pool", fullProperty.structural.poolYn, "text", undefined, "47_pool_yn")}
                  {renderDataField("Pool Type", fullProperty.structural.poolType, "text", undefined, "48_pool_type")}
                  {renderDataField("Deck/Patio", fullProperty.structural.deckPatio, "text", undefined, "49_deck_patio")}
                </div>
                <div>
                  {renderDataField("Fence", fullProperty.structural.fence, "text", undefined, "50_fence")}
                  {renderDataField("Landscaping", fullProperty.structural.landscaping, "text", undefined, "51_landscaping")}
                </div>
              </div>
            </Section>

            {/* Permits & Renovations */}
            <Section title="Permits & Renovations" icon={<Wrench className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Recent Renovations", fullProperty.structural.recentRenovations, "text", undefined, "52_recent_renovations")}
                  {renderDataField("Permit History - Roof", fullProperty.structural.permitHistoryRoof, "text", undefined, "53_permit_history_roof")}
                </div>
                <div>
                  {renderDataField("Permit History - HVAC", fullProperty.structural.permitHistoryHvac, "text", undefined, "54_permit_history_hvac")}
                  {renderDataField("Permit History - Other", fullProperty.structural.permitHistoryPoolAdditions, "text", undefined, "55_permit_history_other")}
                </div>
              </div>
            </Section>

            {/* Schools */}
            <Section title="Assigned Schools" icon={<School className="w-6 h-6" />}>
              <div className="space-y-4">
                <div className="mb-4">
                  {renderDataField("School District", fullProperty.location.schoolDistrictName, "text", undefined, "65_school_district_name")}
                  {renderDataField("Elevation (feet)", fullProperty.location.elevationFeet, "number", undefined, "55_elevation_feet")}
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
                {renderDataField("Noise Level", fullProperty.location.noiseLevel, "text", undefined, "68_noise_level")}
                {renderDataField("Traffic Level", fullProperty.location.trafficLevel, "text", undefined, "69_traffic_level")}
                {renderDataField("Walkability Description", fullProperty.location.walkabilityDescription, "text", undefined, "70_walkability_description")}
                {renderDataField("Public Transit Access", fullProperty.location.publicTransitAccess, "text", undefined, "72_public_transit_access")}
                {renderDataField("Commute to City Center", fullProperty.location.commuteTimeCityCenter, "text", undefined, "71_commute_time_city_center")}
              </div>
            </Section>

            {/* Distances & Amenities */}
            <Section title="Distances & Amenities" icon={<MapPin className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {renderDataField("Grocery", fullProperty.location.distanceGroceryMiles, "number", <span className="text-xs">mi</span>, "73_distance_grocery_miles")}
                {renderDataField("Hospital", fullProperty.location.distanceHospitalMiles, "number", <span className="text-xs">mi</span>, "74_distance_hospital_miles")}
                {renderDataField("Airport", fullProperty.location.distanceAirportMiles, "number", <span className="text-xs">mi</span>, "75_distance_airport_miles")}
                {renderDataField("Park", fullProperty.location.distanceParkMiles, "number", <span className="text-xs">mi</span>, "76_distance_park_miles")}
                {renderDataField("Beach", fullProperty.location.distanceBeachMiles, "number", <span className="text-xs">mi</span>, "77_distance_beach_miles")}
              </div>
            </Section>

            {/* Safety & Crime */}
            <Section title="Safety & Crime" icon={<Shield className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderDataField("Violent Crime Index", fullProperty.location.crimeIndexViolent, "text", undefined, "78_crime_index_violent")}
                {renderDataField("Property Crime Index", fullProperty.location.crimeIndexProperty, "text", undefined, "79_crime_index_property")}
                {renderDataField("Neighborhood Safety Rating", fullProperty.location.neighborhoodSafetyRating, "text", undefined, "80_neighborhood_safety_rating")}
              </div>
            </Section>

            {/* Market & Investment */}
            <Section title="Market & Investment Data" icon={<TrendingUp className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Median Home Price (Neighborhood)", fullProperty.financial.medianHomePriceNeighborhood, "currency", undefined, "81_median_home_price_neighborhood")}
                  {renderDataField("Price Per Sq Ft (Recent Avg)", fullProperty.financial.pricePerSqftRecentAvg, "currency", undefined, "82_price_per_sqft_recent_avg")}
                  {renderDataField("Price to Rent Ratio", fullProperty.financial.priceToRentRatio, "number", undefined, "77_price_to_rent_ratio")}
                  {renderDataField("Price vs Median %", fullProperty.financial.priceVsMedianPercent, "percent", undefined, "79_price_vs_median_percent")}
                  {renderDataField("Days on Market (Avg)", fullProperty.financial.daysOnMarketAvg, "number", undefined, "83_days_on_market_avg")}
                  {renderDataField("Inventory Surplus", fullProperty.financial.inventorySurplus, "text", undefined, "84_inventory_surplus")}
                  {renderDataField("Insurance Estimate (Annual)", fullProperty.financial.insuranceEstAnnual, "currency", undefined, "89_insurance_est_annual")}
                </div>
                <div>
                  {renderDataField("Rental Estimate (Monthly)", fullProperty.financial.rentalEstimateMonthly, "currency", undefined, "85_rental_estimate_monthly")}
                  {renderDataField("Rental Yield (Est)", fullProperty.financial.rentalYieldEst, "percent", undefined, "86_rental_yield_est")}
                  {renderDataField("Vacancy Rate (Neighborhood)", fullProperty.financial.vacancyRateNeighborhood, "percent", undefined, "87_vacancy_rate_neighborhood")}
                  {renderDataField("Cap Rate (Est)", fullProperty.financial.capRateEst, "percent", undefined, "88_cap_rate_est")}
                  {renderDataField("Financing Terms", fullProperty.financial.financingTerms, "text", undefined, "90_financing_terms")}
                  {renderDataField("Comparable Sales", fullProperty.financial.comparableSalesLast3)}
                </div>
              </div>
            </Section>

            {/* Utilities */}
            <Section title="Utilities & Connectivity" icon={<Wifi className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Electric Provider", fullProperty.utilities.electricProvider, "text", <Zap className="w-4 h-4" />, "92_electric_provider")}
                  {renderDataField("Avg Electric Bill", fullProperty.utilities.avgElectricBill, "text", undefined, "90_avg_electric_bill")}
                  {renderDataField("Water Provider", fullProperty.utilities.waterProvider, "text", undefined, "93_water_provider")}
                  {renderDataField("Avg Water Bill", fullProperty.utilities.avgWaterBill, "text", undefined, "91_avg_water_bill")}
                  {renderDataField("Sewer Provider", fullProperty.utilities.sewerProvider, "text", undefined, "94_sewer_provider")}
                  {renderDataField("Natural Gas", fullProperty.utilities.naturalGas, "text", undefined, "95_natural_gas")}
                  {renderDataField("Trash Provider", fullProperty.utilities.trashProvider, "text", undefined, "85_trash_provider")}
                </div>
                <div>
                  {renderDataField("Internet Providers (Top 3)", fullProperty.utilities.internetProvidersTop3)}
                  {renderDataField("Max Internet Speed", fullProperty.utilities.maxInternetSpeed, "text", undefined, "97_max_internet_speed")}
                  {renderDataField("Fiber Available", fullProperty.utilities.fiberAvailable, "text", undefined, "88_fiber_available")}
                  {renderDataField("Cable TV Provider", fullProperty.utilities.cableTvProvider, "text", undefined, "98_cable_tv_provider")}
                  {renderDataField("Cell Coverage Quality", fullProperty.utilities.cellCoverageQuality, "text", undefined, "94_cell_coverage_quality")}
                  {renderDataField("Emergency Services Distance", fullProperty.utilities.emergencyServicesDistance, "text", undefined, "95_emergency_services_distance")}
                </div>
              </div>
            </Section>

            {/* Environment & Risk */}
            <Section title="Environment & Risk" icon={<Sun className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("Air Quality Index", fullProperty.utilities.airQualityIndexCurrent, "text", undefined, "99_air_quality_index_current")}
                  {renderDataField("Air Quality Grade", fullProperty.utilities.airQualityGrade, "text", undefined, "97_air_quality_grade")}
                  {renderDataField("Flood Zone", fullProperty.utilities.floodZone, "text", undefined, "100_flood_zone")}
                  {renderDataField("Flood Risk Level", fullProperty.utilities.floodRiskLevel, "text", undefined, "101_flood_risk_level")}
                  {renderDataField("Climate Risk", fullProperty.utilities.climateRiskWildfireFlood, "text", undefined, "102_climate_risk_summary")}
                  {renderDataField("Wildfire Risk", fullProperty.utilities.wildfireRisk, "text", undefined, "98_wildfire_risk")}
                  {renderDataField("Earthquake Risk", fullProperty.utilities.earthquakeRisk, "text", undefined, "99_earthquake_risk")}
                  {renderDataField("Hurricane Risk", fullProperty.utilities.hurricaneRisk, "text", undefined, "100_hurricane_risk")}
                </div>
                <div>
                  {renderDataField("Tornado Risk", fullProperty.utilities.tornadoRisk, "text", undefined, "101_tornado_risk")}
                  {renderDataField("Radon Risk", fullProperty.utilities.radonRisk, "text", undefined, "102_radon_risk")}
                  {renderDataField("Superfund Site Nearby", fullProperty.utilities.superfundNearby, "text", undefined, "103_superfund_nearby")}
                  {renderDataField("Sea Level Rise Risk", fullProperty.utilities.seaLevelRiseRisk, "text", undefined, "105_sea_level_rise_risk")}
                  {renderDataField("Noise Level (dB Est)", fullProperty.utilities.noiseLevelDbEst, "text", undefined, "103_noise_level_db_est")}
                  {renderDataField("Solar Potential", fullProperty.utilities.solarPotential, "text", undefined, "104_solar_potential")}
                </div>
              </div>
            </Section>

            {/* Additional Features */}
            <Section title="Additional Features" icon={<Hammer className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {renderDataField("View Type", fullProperty.utilities.viewType, "text", undefined, "108_view_type")}
                  {renderDataField("Lot Features", fullProperty.utilities.lotFeatures, "text", undefined, "109_lot_features")}
                  {renderDataField("EV Charging", fullProperty.utilities.evChargingYn, "text", undefined, "105_ev_charging_yn")}
                  {renderDataField("Smart Home Features", fullProperty.utilities.smartHomeFeatures, "text", undefined, "106_smart_home_features")}
                  {renderDataField("Accessibility Modifications", fullProperty.utilities.accessibilityMods, "text", undefined, "107_accessibility_mods")}
                </div>
                <div>
                  {renderDataField("Pet Policy", fullProperty.utilities.petPolicy, "text", undefined, "108_pet_policy")}
                  {renderDataField("Age Restrictions", fullProperty.utilities.ageRestrictions, "text", undefined, "109_age_restrictions")}
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
