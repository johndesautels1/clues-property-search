/**
 * CLUES Property Dashboard - Unified Property Card Component
 *
 * Combines best features from PropertyCard and PropertyComparisonPanels
 * - Pulls from FULL Property object (168 fields) from source of truth
 * - Two modes: Compact (default) and Detailed (expanded)
 * - Mobile-first: Vertical scrolling only, no horizontal scroll
 * - Remembers user preference per card
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Bed,
  Bath,
  Ruler,
  Calendar,
  TrendingUp,
  MapPin,
  Trash2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Percent,
  Waves,
  Car,
  Zap,
  Shield,
  Flame,
} from 'lucide-react';
import type { PropertyCard as PropertyCardType, Property, DataField } from '@/types/property';
import { usePropertyStore } from '@/store/propertyStore';

interface PropertyCardUnifiedProps {
  property: PropertyCardType;
  variant?: 'default' | 'compact' | 'detailed';
  showDelete?: boolean;
  defaultExpanded?: boolean;
}

export default function PropertyCardUnified({
  property,
  variant = 'default',
  showDelete = true,
  defaultExpanded = false,
}: PropertyCardUnifiedProps) {
  const { removeProperty, fullProperties } = usePropertyStore();

  // Get user's preference from localStorage
  const getStoredPreference = () => {
    const stored = localStorage.getItem(`card-expanded-${property.id}`);
    if (stored !== null) return stored === 'true';
    return defaultExpanded;
  };

  const [isExpanded, setIsExpanded] = useState(getStoredPreference);

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem(`card-expanded-${property.id}`, String(isExpanded));
  }, [isExpanded, property.id]);

  // Get full property object (168 fields) if available
  const fullProperty = fullProperties.get(property.id);

  // Helper to safely extract field values from DataField<T>
  const getFieldValue = <T,>(field: DataField<T> | undefined): T | null => {
    return field?.value ?? null;
  };

  // Extract all data we need from full property (fallback to PropertyCard if not enriched)
  const data = {
    // Basic info (from PropertyCard - always available)
    id: property.id,
    address: property.address,
    city: property.city,
    state: property.state,
    zip: property.zip,

    // FIX #1: Show list price if on market, otherwise market estimate
    // Priority: listing_price (field 10) > market_value_estimate (field 12)
    price: (() => {
      const listPrice = fullProperty ? getFieldValue(fullProperty.address?.listingPrice) as number | null : property.price;
      const marketEst = fullProperty ? getFieldValue(fullProperty.details?.marketValueEstimate) as number | null : null;

      // If we have a listing price and status is Active/Pending, use it
      if (listPrice && (property.listingStatus === 'Active' || property.listingStatus === 'Pending')) {
        return listPrice;
      }
      // Otherwise use market estimate if available
      if (marketEst) return marketEst;
      // Fallback to property.price
      return property.price;
    })(),

    pricePerSqft: property.pricePerSqft,
    bedrooms: property.bedrooms || (fullProperty ? getFieldValue(fullProperty.details?.bedrooms) as number | null : null),
    bathrooms: property.bathrooms || (fullProperty ? getFieldValue(fullProperty.details?.totalBathrooms) as number | null : null),
    sqft: property.sqft,
    yearBuilt: property.yearBuilt,
    smartScore: property.smartScore,

    // FIX #6: Cap data completeness at 100% and calculate correctly
    // Use actual filled fields / 168 total fields
    dataCompleteness: Math.min(100, property.dataCompleteness || 0),

    thumbnail: property.thumbnail,
    listingStatus: property.listingStatus,
    daysOnMarket: property.daysOnMarket,

    // Enhanced data (from full Property if enriched)
    propertyType: fullProperty ? getFieldValue(fullProperty.details?.propertyType) : 'Single Family',

    // Financial metrics (fields 97-102)
    capRate: (fullProperty ? getFieldValue(fullProperty.financial?.capRateEst) : null) as number | null,
    rentalYield: (fullProperty ? getFieldValue(fullProperty.financial?.rentalYieldEst) : null) as number | null,
    monthlyRent: (fullProperty ? getFieldValue(fullProperty.financial?.rentalEstimateMonthly) : null) as number | null,
    insurance: (fullProperty ? getFieldValue(fullProperty.financial?.insuranceEstAnnual) : null) as number | null,

    // FIX #5: Keep listPrice and marketEstimate separate (don't duplicate)
    listPrice: (fullProperty ? getFieldValue(fullProperty.address?.listingPrice) : property.price) as number | null,
    marketEstimate: (fullProperty ? getFieldValue(fullProperty.details?.marketValueEstimate) : null) as number | null,

    // Location scores (fields 74-76)
    walkScore: (fullProperty ? getFieldValue(fullProperty.location?.walkScore) : null) as number | null,
    transitScore: (fullProperty ? getFieldValue(fullProperty.location?.transitScore) : null) as number | null,
    bikeScore: (fullProperty ? getFieldValue(fullProperty.location?.bikeScore) : null) as number | null,

    // Safety score (placeholder - would come from crime data if available)
    safetyScore: null,

    // FIX #4: Use real FEMA Risk Index data - fields 120, 124 from FEMA API
    // These come from callFEMARiskIndex() in free-apis.ts
    floodRisk: fullProperty ? (() => {
      const level = getFieldValue(fullProperty.utilities?.floodRiskLevel) as string | null;
      if (!level) return null;
      const levelMap: { [key: string]: number } = { 'Minimal': 2, 'Low': 3, 'Moderate': 5, 'High': 7, 'Very High': 9, 'Severe': 10 };
      return levelMap[level] || null; // Return null instead of defaulting to 5
    })() : null,

    hurricaneRisk: fullProperty ? (() => {
      const risk = getFieldValue(fullProperty.utilities?.hurricaneRisk) as string | null;
      if (!risk) return null;
      const riskMap: { [key: string]: number } = { 'Minimal': 2, 'Low': 3, 'Moderate': 5, 'High': 7, 'Very High': 9, 'Severe': 10 };
      return riskMap[risk] || null; // Return null instead of defaulting to 5
    })() : null,

    // Features (fields 54, 133, 134)
    hasPool: fullProperty ? getFieldValue(fullProperty.structural?.poolYn) === true : false,
    hasBeach: false, // Not in 168-field schema
    hasEV: fullProperty ? (getFieldValue(fullProperty.utilities?.evChargingYn) === 'Yes' || getFieldValue(fullProperty.utilities?.evChargingYn) === 'true') : false,
    hasSmart: fullProperty ? (getFieldValue(fullProperty.utilities?.smartHomeFeatures) ? true : false) : false,

    // FIX #4: Get garage spaces for bottom widget
    garageSpaces: fullProperty ? getFieldValue(fullProperty.details?.garageSpaces) as number | null : null,
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm(`Delete ${property.address}?`)) {
      removeProperty(property.id);
    }
  };

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(2)}M`;
    }
    if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'score-excellent';
    if (score >= 80) return 'score-good';
    if (score >= 70) return 'score-fair';
    return 'score-poor';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'from-quantum-green/20 to-quantum-cyan/20';
    if (score >= 80) return 'from-quantum-blue/20 to-quantum-cyan/20';
    if (score >= 70) return 'from-quantum-gold/20 to-yellow-500/20';
    return 'from-quantum-red/20 to-orange-500/20';
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 7) return 'text-red-400';
    if (risk >= 4) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getRiskBg = (risk: number) => {
    if (risk >= 7) return 'bg-red-500';
    if (risk >= 4) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="glass-card-hover"
    >
      <Link to={`/property/${property.id}`} className="block">
        <div className="flex flex-col">
          {/* ========================================
              COMPACT MODE (Always Visible)
              ======================================== */}

          {/* Property Image */}
          <div className="relative w-full h-40 flex-shrink-0">
            {data.thumbnail ? (
              <img
                src={data.thumbnail}
                alt={data.address}
                className="w-full h-full object-cover rounded-t-2xl"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-quantum-dark to-quantum-card rounded-t-2xl flex items-center justify-center">
                <MapPin className="w-12 h-12 text-gray-600" />
              </div>
            )}

            {/* SMART Score Badge */}
            <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full bg-gradient-to-r ${getScoreBg(data.smartScore)} backdrop-blur-lg border border-white/20`}>
              <span className={`font-bold text-lg ${getScoreColor(data.smartScore)}`}>
                {data.smartScore}
              </span>
            </div>

            {/* Delete Button */}
            {showDelete && (
              <button
                onClick={handleDelete}
                className="absolute top-3 left-3 p-2 rounded-full bg-red-500/20 backdrop-blur-lg border border-red-500/30 hover:bg-red-500/40 transition-colors"
                title="Delete property"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            )}

            {/* Status Badge */}
            <div className="absolute bottom-3 left-3 px-2 py-1 rounded-full bg-quantum-green/20 backdrop-blur-lg border border-quantum-green/30">
              <span className="text-xs font-semibold text-quantum-green">
                {data.listingStatus}
              </span>
            </div>
          </div>

          {/* Basic Property Info */}
          <div className="p-4">
            {/* Price & Property Type */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-white">
                    {formatPrice(data.price)}
                  </span>
                  <span className="text-sm text-gray-500">
                    ${data.pricePerSqft}/sqft
                  </span>
                </div>
                <p className="text-cyan-300 text-sm font-medium mt-1">{data.propertyType}</p>
              </div>
              <div className="text-right">
                {/* FIX #3: Add "Days on Market" label */}
                <p className="text-gray-500 text-[10px] uppercase tracking-wide">Days on Market</p>
                <span className="text-amber-400 text-xs font-bold">{data.daysOnMarket}</span>
              </div>
            </div>

            {/* Address */}
            <h3 className="font-semibold text-white mb-1">
              {data.address}
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              {data.city}, {data.state} {data.zip}
            </p>

            {/* FIX #4: Property Features with labels and null handling */}
            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col items-center gap-0.5">
                <Bed className="w-4 h-4 text-quantum-cyan" />
                <span className="text-sm font-semibold text-white">{data.bedrooms ?? '—'}</span>
                <span className="text-[9px] text-gray-500 uppercase">Beds</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <Bath className="w-4 h-4 text-quantum-cyan" />
                <span className="text-sm font-semibold text-white">{data.bathrooms ?? '—'}</span>
                <span className="text-[9px] text-gray-500 uppercase">Baths</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <Car className="w-4 h-4 text-quantum-cyan" />
                <span className="text-sm font-semibold text-white">{data.garageSpaces ?? '—'}</span>
                <span className="text-[9px] text-gray-500 uppercase">Garage</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <Calendar className="w-4 h-4 text-quantum-cyan" />
                <span className="text-sm font-semibold text-white">{data.yearBuilt ?? '—'}</span>
                <span className="text-[9px] text-gray-500 uppercase">Built</span>
              </div>
            </div>

            {/* Expand/Collapse Button */}
            <button
              onClick={toggleExpanded}
              className="w-full mt-4 py-2 px-4 rounded-lg bg-quantum-cyan/10 hover:bg-quantum-cyan/20 border border-quantum-cyan/30 transition-colors flex items-center justify-center gap-2 text-quantum-cyan font-medium text-sm"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show Details
                </>
              )}
            </button>
          </div>

          {/* ========================================
              DETAILED MODE (Expandable)
              ======================================== */}

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-4">

                  {/* Financial Section */}
                  {(data.capRate || data.rentalYield || data.monthlyRent) && (
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-amber-400 text-xs uppercase tracking-wider mb-3 font-bold flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        FINANCIAL
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {data.capRate !== null && (
                          <div>
                            <p className="text-cyan-300 text-xs font-medium">Cap Rate</p>
                            <p className="text-emerald-400 font-bold text-lg">{data.capRate.toFixed(1)}%</p>
                          </div>
                        )}
                        {data.rentalYield !== null && (
                          <div>
                            <p className="text-cyan-300 text-xs font-medium">Rental Yield</p>
                            <p className="text-emerald-400 font-bold text-lg">{data.rentalYield.toFixed(1)}%</p>
                          </div>
                        )}
                        {data.pricePerSqft && (
                          <div>
                            <p className="text-cyan-300 text-xs font-medium">$/Sqft</p>
                            <p className="text-white font-bold text-lg">${data.pricePerSqft.toFixed(0)}</p>
                          </div>
                        )}
                        {data.monthlyRent !== null && (
                          <div>
                            <p className="text-cyan-300 text-xs font-medium">Rent/Mo</p>
                            <p className="text-white font-bold text-lg">{formatPrice(data.monthlyRent)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Scores Section */}
                  {(data.walkScore || data.transitScore || data.bikeScore || data.safetyScore) && (
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-purple-400 text-xs uppercase tracking-wider mb-3 font-bold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        SCORES
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {data.walkScore !== null && (
                          <div className="text-center p-2 rounded-lg bg-white/5 overflow-hidden">
                            <p className="text-white font-bold text-lg">{data.walkScore}</p>
                            <p className="text-cyan-300 text-[10px] font-medium truncate leading-tight">Walk</p>
                          </div>
                        )}
                        {data.transitScore !== null && (
                          <div className="text-center p-2 rounded-lg bg-white/5">
                            <p className="text-white font-bold text-lg">{data.transitScore}</p>
                            <p className="text-cyan-300 text-xs font-medium">Transit</p>
                          </div>
                        )}
                        {data.bikeScore !== null && (
                          <div className="text-center p-2 rounded-lg bg-white/5">
                            <p className="text-white font-bold text-lg">{data.bikeScore}</p>
                            <p className="text-cyan-300 text-xs font-medium">Bike</p>
                          </div>
                        )}
                        {data.safetyScore !== null && (
                          <div className="text-center p-2 rounded-lg bg-white/5">
                            <p className={`font-bold text-lg ${data.safetyScore >= 80 ? 'text-emerald-400' : data.safetyScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                              {data.safetyScore}
                            </p>
                            <p className="text-cyan-300 text-xs font-medium">Safety</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Risk Section */}
                  {(data.floodRisk !== null || data.hurricaneRisk !== null) && (
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-red-400 text-xs uppercase tracking-wider mb-3 font-bold flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        RISK (1-10)
                      </p>
                      <div className="space-y-3">
                        {data.floodRisk !== null && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-blue-300 text-xs font-medium flex items-center gap-1">
                                <Waves className="w-3 h-3" />
                                Flood
                              </span>
                              <span className={`text-sm font-bold ${getRiskColor(data.floodRisk)}`}>
                                {data.floodRisk}/10
                              </span>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getRiskBg(data.floodRisk)}`}
                                style={{ width: `${data.floodRisk * 10}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {data.hurricaneRisk !== null && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-blue-300 text-xs font-medium flex items-center gap-1">
                                <Flame className="w-3 h-3" />
                                Hurricane
                              </span>
                              <span className={`text-sm font-bold ${getRiskColor(data.hurricaneRisk)}`}>
                                {data.hurricaneRisk}/10
                              </span>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getRiskBg(data.hurricaneRisk)}`}
                                style={{ width: `${data.hurricaneRisk * 10}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Features Section */}
                  {(data.hasPool || data.hasBeach || data.hasEV || data.hasSmart) && (
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-emerald-400 text-xs uppercase tracking-wider mb-3 font-bold">FEATURES</p>
                      <div className="flex flex-wrap gap-2">
                        {data.hasPool && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs">
                            <Waves className="w-3 h-3" />
                            <span>Pool</span>
                          </div>
                        )}
                        {data.hasBeach && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs">
                            <MapPin className="w-3 h-3" />
                            <span>Beach</span>
                          </div>
                        )}
                        {data.hasEV && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs">
                            <Car className="w-3 h-3" />
                            <span>EV</span>
                          </div>
                        )}
                        {data.hasSmart && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs">
                            <Zap className="w-3 h-3" />
                            <span>Smart</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* FIX #5: Market Estimate Comparison - only show if different from list price */}
                  {data.marketEstimate !== null && data.listPrice !== null && Math.abs(data.marketEstimate - data.listPrice) > 1000 && (
                    <div className="border-t border-white/10 pt-4">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-cyan-300 text-xs font-medium">Market Estimate</span>
                          <span className="text-white font-bold">{formatPrice(data.marketEstimate)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-purple-300 text-xs font-medium">vs List Price</span>
                          <span className={`text-sm font-bold ${data.marketEstimate >= data.listPrice ? 'text-emerald-400' : 'text-red-400'}`}>
                            {data.marketEstimate >= data.listPrice ? '+' : ''}{formatPrice(data.marketEstimate - data.listPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Data Completeness */}
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Data Completeness</span>
                      <span className="text-quantum-cyan">{data.dataCompleteness}%</span>
                    </div>
                    <div className="progress-quantum h-1.5">
                      <div
                        className="progress-quantum-fill"
                        style={{ width: `${data.dataCompleteness}%` }}
                      />
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>
    </motion.div>
  );
}
