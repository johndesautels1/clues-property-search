/**
 * CLUES Property Dashboard - Search Property Page
 * Full 181-field property search/entry form
 * Sources visible to admin only
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, CheckCircle } from 'lucide-react';
import PropertySearchForm from '@/components/property/PropertySearchForm';
import { usePropertyStore } from '@/store/propertyStore';
import { useCurrentUser } from '@/store/authStore';
import type { PropertyCard } from '@/types/property';
import { normalizeToProperty } from '@/lib/field-normalizer';

// Generate unique ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export default function SearchProperty() {
  const navigate = useNavigate();
  const { addProperty, clearProperty } = usePropertyStore();
  const currentUser = useCurrentUser();
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedPropertyId, setSavedPropertyId] = useState<string | null>(null);

  const handleSubmit = (formData: Record<string, { value: any; source: string }>, apiFields?: Record<string, any>) => {
    // Extract values from form data
    const getValue = (key: string, defaultVal: any = '') => {
      return formData[key]?.value ?? defaultVal;
    };

    // Parse address components
    const fullAddress = getValue('addressIdentity.fullAddress', '');
    const addressParts = fullAddress.split(',').map((s: string) => s.trim());
    const street = addressParts[0] || '';
    const cityStateZip = addressParts.slice(1).join(', ');
    const cityMatch = cityStateZip.match(/^([^,]+)/);
    const stateZipMatch = cityStateZip.match(/([A-Z]{2})\s*(\d{5})/);

    const city = cityMatch?.[1]?.trim() || getValue('hoaOwnership.county', 'Unknown City');
    const state = stateZipMatch?.[1] || 'FL';
    const zip = stateZipMatch?.[2] || '';

    const propertyId = generateId();

    // Create property card
    // Extract Days on Market from Stellar MLS API if available
    let daysOnMarket: number | undefined = undefined;
    let cumulativeDaysOnMarket: number | undefined = undefined;

    if (apiFields) {
      // Try raw Stellar MLS Bridge API fields first (these are the accurate values)
      if (apiFields['DaysOnMarket']?.value !== undefined && apiFields['DaysOnMarket'].value !== null) {
        const domValue = parseInt(String(apiFields['DaysOnMarket'].value));
        daysOnMarket = isNaN(domValue) ? undefined : domValue;
      }

      // Get CDOM if available
      if (apiFields['CumulativeDaysOnMarket']?.value !== undefined && apiFields['CumulativeDaysOnMarket'].value !== null) {
        const cdomValue = parseInt(String(apiFields['CumulativeDaysOnMarket'].value));
        cumulativeDaysOnMarket = isNaN(cdomValue) ? undefined : cdomValue;
      }

      console.log('[SearchProperty] Extracted DOM/CDOM:', { daysOnMarket, cumulativeDaysOnMarket });
    }

    // Helper to get API field value by numbered key (e.g., "10_listing_price")
    const getApiValue = (key: string, defaultVal: any = 0): any => {
      if (!apiFields || !apiFields[key]) return defaultVal;
      const field = apiFields[key];
      return field.value !== null && field.value !== undefined ? field.value : defaultVal;
    };

    // Build PropertyCard from API numbered fields (source of truth) when available,
    // fall back to formData UI fields if API data missing
    const price = apiFields ? getApiValue('10_listing_price', 0) : getValue('pricing.listingPrice', 0);
    const sqft = apiFields ? getApiValue('21_living_sqft', 0) : getValue('propertyBasics.livingSqft', 0);
    const pricePerSqftField = apiFields ? getApiValue('11_price_per_sqft', 0) : getValue('pricing.pricePerSqft', 0);

    // Calculate pricePerSqft if not provided
    const pricePerSqft = pricePerSqftField || (price && sqft ? Math.round(price / sqft) : 0);

    const newProperty: PropertyCard = {
      id: propertyId,
      address: street || fullAddress,
      city,
      state,
      zip,
      price,
      pricePerSqft,
      bedrooms: apiFields ? getApiValue('17_bedrooms', 0) : getValue('propertyBasics.bedrooms', 0),
      bathrooms: apiFields
        ? getApiValue('20_total_bathrooms', 0)
        : (getValue('propertyBasics.totalBathrooms', 0) || (getValue('propertyBasics.fullBathrooms', 0) + getValue('propertyBasics.halfBathrooms', 0) * 0.5)),
      sqft,
      yearBuilt: apiFields ? getApiValue('25_year_built', new Date().getFullYear()) : getValue('propertyBasics.yearBuilt', new Date().getFullYear()),
      // smartScore omitted - will be calculated via 2-tier system during comparison
      dataCompleteness: calculateCompleteness(formData),
      listingStatus: (apiFields ? getApiValue('4_listing_status', 'Active') : getValue('addressIdentity.listingStatus', 'Active')) || 'Active',
      daysOnMarket: daysOnMarket,
      cumulativeDaysOnMarket: cumulativeDaysOnMarket,
    };

    // Convert API fields to proper Property structure if available
    let fullProperty = undefined;
    if (apiFields && Object.keys(apiFields).length > 0) {
      console.log('✅ Converting', Object.keys(apiFields).length, 'API fields to Property structure');
      try {
        fullProperty = normalizeToProperty(apiFields, propertyId);
        console.log('✅ Successfully created fullProperty structure');

        // Extract photo URL from Stellar MLS data if available
        if (fullProperty.address.primaryPhotoUrl?.value) {
          newProperty.thumbnail = fullProperty.address.primaryPhotoUrl.value;
          console.log('📸 Property photo extracted from Stellar MLS');
        }
      } catch (error) {
        console.error('❌ Error normalizing property:', error);
      }
    } else {
      console.log('⚠️ No API fields available - property will have limited data');
    }

    // Save to store with full property data
    // BUGFIX 2026-01-11: Clear any existing property with this ID to prevent
    // data contamination from previous searches
    clearProperty(propertyId);
    addProperty(newProperty, fullProperty);
    setSavedPropertyId(propertyId);
    setShowSuccess(true);
  };

  // Calculate data completeness percentage
  const calculateCompleteness = (formData: Record<string, { value: any; source: string }>) => {
    const totalFields = 181;
    const filledFields = Object.values(formData).filter(f => {
      const val = f.value;
      return val !== undefined && val !== '' && val !== null &&
             !(Array.isArray(val) && val.length === 0);
    }).length;

    return Math.round((filledFields / totalFields) * 100);
  };

  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center p-4"
      >
        <div className="glass-card p-8 max-w-md w-full text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-quantum-green/20 flex items-center justify-center"
          >
            <CheckCircle className="w-10 h-10 text-quantum-green" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Property Saved!</h2>
          <p className="text-gray-400 mb-6">
            Your property has been added to the dashboard.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => savedPropertyId && navigate(`/property/${savedPropertyId}`)}
              className="flex-1 py-3 bg-gradient-to-r from-quantum-cyan to-quantum-blue text-quantum-black font-semibold rounded-xl hover:shadow-lg hover:shadow-quantum-cyan/30 transition-all"
            >
              View Property
            </button>
            <button
              onClick={() => {
                setShowSuccess(false);
                setSavedPropertyId(null);
              }}
              className="flex-1 py-3 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/5 transition-colors"
            >
              Add Another
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-6 md:px-8 md:py-10 max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-quantum-cyan to-quantum-purple bg-clip-text text-transparent flex items-center gap-3">
            <Search className="w-8 h-8 text-quantum-cyan" />
            Search for Property
          </h1>
          <p className="text-gray-400 mt-1">
            Enter address to auto-populate or fill in all 181 fields manually
          </p>
        </div>
      </div>

      {/* User Info Badge */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <span className="text-gray-500">Logged in as:</span>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          currentUser?.role === 'admin'
            ? 'bg-quantum-cyan/20 text-quantum-cyan'
            : 'bg-quantum-purple/20 text-quantum-purple'
        }`}>
          {currentUser?.role === 'admin' ? 'Admin' : 'User'}
        </span>
        <span className="text-white">{currentUser?.name}</span>
        {currentUser?.role === 'admin' && (
          <span className="text-gray-500 text-xs ml-2">
            (Source fields visible)
          </span>
        )}
      </div>

      {/* Property Search Form */}
      <PropertySearchForm onSubmit={handleSubmit} />
    </motion.div>
  );
}
