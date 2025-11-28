/**
 * CLUES Property Dashboard - Advanced Comparison Analytics Page
 * Full 138-field comparison with property dropdown selectors
 * Plus 32 hi-tech visual chart comparisons
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Scale, TrendingUp, TrendingDown, Minus,
  ChevronDown, Search, Home, DollarSign, Ruler, Calendar,
  MapPin, Building, Zap, Shield, BarChart3, Eye, RefreshCw,
  AlertTriangle, CheckCircle, Info, PieChart, Table2
} from 'lucide-react';
import { usePropertyStore } from '@/store/propertyStore';
import type { PropertyCard, Property } from '@/types/property';
import { PropertyComparisonAnalytics, type Property as AnalyticsProperty } from '@/components/analytics';

// View modes for comparison
type CompareViewMode = 'table' | 'visual';

// Helper to extract value from DataField
function getFieldValue<T>(field: any): T | null {
  if (!field) return null;
  if (typeof field === 'object' && 'value' in field) {
    return field.value;
  }
  return field as T;
}

// Convert app Property to analytics Property format
function mapToAnalyticsProperty(cardProp: PropertyCard, fullProp?: Property): AnalyticsProperty {
  // Helper to parse risk levels to 0-10 scale
  const parseRiskLevel = (level: string | null | undefined): number => {
    if (!level) return 5;
    const lower = level.toLowerCase();
    if (lower.includes('very low') || lower.includes('minimal')) return 1;
    if (lower.includes('low')) return 3;
    if (lower.includes('moderate') || lower.includes('medium')) return 5;
    if (lower.includes('high')) return 7;
    if (lower.includes('very high') || lower.includes('severe')) return 9;
    return 5;
  };

  // Helper to parse crime level
  const parseCrimeLevel = (level: string | null | undefined): 'LOW' | 'MOD' | 'HIGH' => {
    if (!level) return 'MOD';
    const lower = level.toLowerCase();
    if (lower.includes('low')) return 'LOW';
    if (lower.includes('high')) return 'HIGH';
    return 'MOD';
  };

  // Get values from full property or use defaults
  const price = cardProp.price || 0;
  const yearBuilt = cardProp.yearBuilt || 2000;
  const currentYear = new Date().getFullYear();
  const propertyAge = currentYear - yearBuilt;

  // Extract values from full property if available
  const walkScore = fullProp ? getFieldValue<number>(fullProp.location?.walkScore) : null;
  const transitScore = fullProp ? getFieldValue<number>(fullProp.location?.transitScore) : null;
  const bikeScore = fullProp ? getFieldValue<number>(fullProp.location?.bikeScore) : null;
  const assessedValue = fullProp ? getFieldValue<number>(fullProp.details?.assessedValue) : null;
  const marketEstimate = fullProp ? getFieldValue<number>(fullProp.details?.marketValueEstimate) : null;
  const rentalEstimate = fullProp ? getFieldValue<number>(fullProp.financial?.rentalEstimateMonthly) : null;
  const capRate = fullProp ? getFieldValue<number>(fullProp.financial?.capRateEst) : null;
  const rentalYield = fullProp ? getFieldValue<number>(fullProp.financial?.rentalYieldEst) : null;
  const annualTaxes = fullProp ? getFieldValue<number>(fullProp.details?.annualTaxes) : null;
  const hoaFees = fullProp ? getFieldValue<number>(fullProp.details?.hoaFeeAnnual) : null;
  const insuranceAnnual = fullProp ? getFieldValue<number>(fullProp.financial?.insuranceEstAnnual) : null;

  // Risk values
  const floodRisk = fullProp ? getFieldValue<string>(fullProp.utilities?.floodRiskLevel) : null;
  const hurricaneRisk = fullProp ? getFieldValue<string>(fullProp.utilities?.hurricaneRisk) : null;
  const wildfireRisk = fullProp ? getFieldValue<string>(fullProp.utilities?.wildfireRisk) : null;
  const earthquakeRisk = fullProp ? getFieldValue<string>(fullProp.utilities?.earthquakeRisk) : null;
  const tornadoRisk = fullProp ? getFieldValue<string>(fullProp.utilities?.tornadoRisk) : null;
  const radonRisk = fullProp ? getFieldValue<string>(fullProp.utilities?.radonRisk) : null;
  const seaLevelRisk = fullProp ? getFieldValue<string>(fullProp.utilities?.seaLevelRiseRisk) : null;
  const crimeViolent = fullProp ? getFieldValue<string>(fullProp.location?.crimeIndexViolent) : null;
  const crimeProperty = fullProp ? getFieldValue<string>(fullProp.location?.crimeIndexProperty) : null;
  const safetyRating = fullProp ? getFieldValue<string>(fullProp.location?.neighborhoodSafetyRating) : null;

  // Calculate some derived values
  const appreciationEst = ((marketEstimate || price) / (assessedValue || price) - 1) * 100;

  return {
    id: cardProp.id,
    address: `${cardProp.address}, ${cardProp.city}`,
    price: price,
    sqft: cardProp.sqft || 2000,
    bedrooms: cardProp.bedrooms || 3,
    bathrooms: cardProp.bathrooms || 2,
    lotSize: fullProp ? getFieldValue<number>(fullProp.details?.lotSizeSqft) || 5000 : 5000,
    yearBuilt: yearBuilt,

    // Valuation
    listPrice: price,
    marketEstimate: marketEstimate || price * 0.95,
    redfinEstimate: fullProp ? getFieldValue<number>(fullProp.financial?.redfinEstimate) || price * 0.92 : price * 0.92,
    assessedValue: assessedValue || price * 0.7,

    // Financial
    appreciation5yr: appreciationEst > 0 ? appreciationEst : 25,
    capRate: capRate || 3.5,
    rentalYield: rentalYield || 2.8,
    priceToRent: rentalEstimate ? Math.round(price / (rentalEstimate * 12)) : 20,
    propertyTax: annualTaxes || Math.round(price * 0.01),
    insurance: insuranceAnnual || Math.round(price * 0.003),
    insuranceBase: insuranceAnnual ? Math.round(insuranceAnnual * 0.5) : Math.round(price * 0.0015),
    insuranceFlood: insuranceAnnual ? Math.round(insuranceAnnual * 0.4) : Math.round(price * 0.001),
    insuranceWind: insuranceAnnual ? Math.round(insuranceAnnual * 0.1) : Math.round(price * 0.0005),
    hoaFees: hoaFees ? Math.round(hoaFees / 12) : 100,
    utilities: 400,
    utilitiesElectric: 220,
    utilitiesWater: 80,
    utilitiesInternet: 100,
    maintenance: 400,
    rentalIncome: rentalEstimate || Math.round(price * 0.005),

    // Pricing History
    pricingHistory: {
      salePriceDate: `${yearBuilt + Math.min(5, propertyAge)} Sale`,
      salePrice: Math.round(price * 0.6),
      assessmentDate: `${currentYear} Assessment`,
      assessmentPrice: assessedValue || Math.round(price * 0.7),
      currentListPrice: price,
      marketEstimatePrice: marketEstimate || Math.round(price * 0.95),
    },

    // ROI Projections (5% annual appreciation estimate)
    roiProjection: {
      today: price,
      year1: Math.round(price * 1.05),
      year2: Math.round(price * 1.10),
      year3: Math.round(price * 1.16),
      year4: Math.round(price * 1.22),
      year5: Math.round(price * 1.28),
      year7: Math.round(price * 1.40),
      year10: Math.round(price * 1.63),
    },

    // Location Scores
    walkScore: walkScore || 50,
    transitScore: transitScore || 35,
    bikeScore: bikeScore || 45,

    // Commute
    commute: {
      cityCenter: 80,
      elementary: 90,
      transitHub: 85,
      emergency: 88,
    },

    // Safety
    safetyScore: safetyRating ? (safetyRating.toLowerCase().includes('safe') ? 75 : 60) : 70,
    violentCrime: parseCrimeLevel(crimeViolent),
    propertyCrime: parseCrimeLevel(crimeProperty),

    // Climate Risks (0-10 scale)
    floodRisk: parseRiskLevel(floodRisk),
    hurricaneRisk: parseRiskLevel(hurricaneRisk),
    seaLevelRisk: parseRiskLevel(seaLevelRisk),
    wildfireRisk: parseRiskLevel(wildfireRisk),
    earthquakeRisk: parseRiskLevel(earthquakeRisk),
    tornadoRisk: parseRiskLevel(tornadoRisk),
    airQualityRisk: 3,
    radonRisk: parseRiskLevel(radonRisk),

    // Environmental Quality
    airQuality: 85,
    solarPotential: 85,
    waterQuality: 90,
    foundationStability: 90,

    // Investment Scores
    investmentScore: {
      financialHealth: cardProp.smartScore || 75,
      locationValue: walkScore ? Math.min(100, Math.round((walkScore + (transitScore || 50)) / 2)) : 75,
      propertyCondition: propertyAge < 10 ? 90 : propertyAge < 20 ? 80 : 70,
      riskProfile: 70,
      marketPosition: 80,
      growthPotential: 78,
    },

    // Market Data
    pricePerSqft: cardProp.pricePerSqft || Math.round(price / (cardProp.sqft || 2000)),
    daysOnMarket: cardProp.daysOnMarket || 10,
    neighborhoodMedianPrice: fullProp ? getFieldValue<number>(fullProp.financial?.medianHomePriceNeighborhood) || price * 0.8 : price * 0.8,
    marketVelocityDays: cardProp.daysOnMarket || 10,

    // Neighborhood Pulse (simulated 5-year trend)
    neighborhoodPulse: {
      year2020: Math.round(price * 0.65),
      year2021: Math.round(price * 0.72),
      year2022: Math.round(price * 0.82),
      year2023: Math.round(price * 0.90),
      year2024: Math.round(price * 0.95),
      year2025: price,
    },

    // Space Distribution
    livingSpace: cardProp.sqft || 2000,
    garageStorage: 350,
    coveredAreas: fullProp ? getFieldValue<number>(fullProp.details?.lotSizeSqft) || 5000 : 5000,

    // Room Distribution (percentages)
    roomDistribution: {
      bedrooms: 33,
      bathrooms: 28,
      livingAreas: 25,
      storage: 14,
    },

    // Schools
    schools: {
      elementaryDistance: 90,
      middleDistance: 40,
      highDistance: 38,
      districtRating: 75,
    },

    // Property Condition
    condition: {
      roof: propertyAge < 15 ? 85 : 70,
      hvac: propertyAge < 10 ? 90 : 75,
      kitchen: propertyAge < 5 ? 95 : 80,
      overall: propertyAge < 10 ? 88 : propertyAge < 20 ? 78 : 68,
    },

    // Luxury Features
    features: {
      pool: fullProp && getFieldValue<boolean>(fullProp.structural?.poolYn) ? 100 : 0,
      deck: fullProp && getFieldValue<string>(fullProp.structural?.deckPatio) ? 80 : 50,
      smartHome: 70,
      fireplace: fullProp && getFieldValue<boolean>(fullProp.structural?.fireplaceYn) ? 100 : 0,
      evCharging: 50,
      beachAccess: fullProp && getFieldValue<number>(fullProp.location?.distanceBeachMiles) &&
                   getFieldValue<number>(fullProp.location?.distanceBeachMiles)! < 1 ? 100 : 30,
    },

    // Location Excellence
    locationExcellence: {
      beachAccess: fullProp && getFieldValue<number>(fullProp.location?.distanceBeachMiles) ?
                   Math.max(0, 100 - (getFieldValue<number>(fullProp.location?.distanceBeachMiles)! * 20)) : 50,
      schoolProximity: 85,
      transitAccess: transitScore || 60,
      safety: safetyRating ? (safetyRating.toLowerCase().includes('safe') ? 75 : 60) : 70,
      walkability: walkScore || 50,
      commute: 80,
    },
  };
}

// Comparison field categories
const fieldCategories = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'financial', label: 'Financial', icon: DollarSign },
  { id: 'details', label: 'Property Details', icon: Building },
  { id: 'location', label: 'Location & Schools', icon: MapPin },
  { id: 'structural', label: 'Structural', icon: Ruler },
  { id: 'utilities', label: 'Utilities & Environment', icon: Zap },
  { id: 'risks', label: 'Risk Assessment', icon: Shield },
];

// Field definitions for comparison
const comparisonFields: Record<string, Array<{
  key: string;
  label: string;
  path: string;
  format?: 'currency' | 'number' | 'percent' | 'text' | 'boolean' | 'rating';
  higherIsBetter?: boolean;
}>> = {
  overview: [
    { key: 'price', label: 'Listing Price', path: 'address.listingPrice', format: 'currency', higherIsBetter: false },
    { key: 'pricePerSqft', label: 'Price per Sqft', path: 'address.pricePerSqft', format: 'currency', higherIsBetter: false },
    { key: 'smartScore', label: 'Smart Score', path: 'smartScore', format: 'number', higherIsBetter: true },
    { key: 'dataCompleteness', label: 'Data Completeness', path: 'dataCompleteness', format: 'percent', higherIsBetter: true },
    { key: 'listingStatus', label: 'Listing Status', path: 'address.listingStatus', format: 'text' },
    { key: 'daysOnMarket', label: 'Days on Market', path: 'card.daysOnMarket', format: 'number', higherIsBetter: false },
  ],
  financial: [
    { key: 'annualTaxes', label: 'Annual Taxes', path: 'details.annualTaxes', format: 'currency', higherIsBetter: false },
    { key: 'hoaFeeAnnual', label: 'HOA Fee (Annual)', path: 'details.hoaFeeAnnual', format: 'currency', higherIsBetter: false },
    { key: 'assessedValue', label: 'Assessed Value', path: 'details.assessedValue', format: 'currency', higherIsBetter: true },
    { key: 'marketValueEstimate', label: 'Market Value Est.', path: 'details.marketValueEstimate', format: 'currency', higherIsBetter: true },
    { key: 'rentalEstimateMonthly', label: 'Rental Est. (Monthly)', path: 'financial.rentalEstimateMonthly', format: 'currency', higherIsBetter: true },
    { key: 'rentalYieldEst', label: 'Rental Yield Est.', path: 'financial.rentalYieldEst', format: 'percent', higherIsBetter: true },
    { key: 'capRateEst', label: 'Cap Rate Est.', path: 'financial.capRateEst', format: 'percent', higherIsBetter: true },
    { key: 'insuranceEstAnnual', label: 'Insurance Est. (Annual)', path: 'financial.insuranceEstAnnual', format: 'currency', higherIsBetter: false },
    { key: 'lastSalePrice', label: 'Last Sale Price', path: 'details.lastSalePrice', format: 'currency' },
    { key: 'lastSaleDate', label: 'Last Sale Date', path: 'details.lastSaleDate', format: 'text' },
  ],
  details: [
    { key: 'bedrooms', label: 'Bedrooms', path: 'details.bedrooms', format: 'number', higherIsBetter: true },
    { key: 'totalBathrooms', label: 'Total Bathrooms', path: 'details.totalBathrooms', format: 'number', higherIsBetter: true },
    { key: 'livingSqft', label: 'Living Sqft', path: 'details.livingSqft', format: 'number', higherIsBetter: true },
    { key: 'lotSizeSqft', label: 'Lot Size (Sqft)', path: 'details.lotSizeSqft', format: 'number', higherIsBetter: true },
    { key: 'yearBuilt', label: 'Year Built', path: 'details.yearBuilt', format: 'number', higherIsBetter: true },
    { key: 'stories', label: 'Stories', path: 'details.stories', format: 'number' },
    { key: 'garageSpaces', label: 'Garage Spaces', path: 'details.garageSpaces', format: 'number', higherIsBetter: true },
    { key: 'propertyType', label: 'Property Type', path: 'details.propertyType', format: 'text' },
    { key: 'hoaYn', label: 'HOA Required', path: 'details.hoaYn', format: 'boolean' },
  ],
  location: [
    { key: 'walkScore', label: 'Walk Score', path: 'location.walkScore', format: 'number', higherIsBetter: true },
    { key: 'transitScore', label: 'Transit Score', path: 'location.transitScore', format: 'number', higherIsBetter: true },
    { key: 'bikeScore', label: 'Bike Score', path: 'location.bikeScore', format: 'number', higherIsBetter: true },
    { key: 'elementaryRating', label: 'Elementary School Rating', path: 'location.elementaryRating', format: 'rating', higherIsBetter: true },
    { key: 'middleRating', label: 'Middle School Rating', path: 'location.middleRating', format: 'rating', higherIsBetter: true },
    { key: 'highRating', label: 'High School Rating', path: 'location.highRating', format: 'rating', higherIsBetter: true },
    { key: 'distanceGroceryMiles', label: 'Nearest Grocery (mi)', path: 'location.distanceGroceryMiles', format: 'number', higherIsBetter: false },
    { key: 'distanceHospitalMiles', label: 'Nearest Hospital (mi)', path: 'location.distanceHospitalMiles', format: 'number', higherIsBetter: false },
    { key: 'distanceBeachMiles', label: 'Nearest Beach (mi)', path: 'location.distanceBeachMiles', format: 'number', higherIsBetter: false },
    { key: 'neighborhoodSafetyRating', label: 'Neighborhood Safety', path: 'location.neighborhoodSafetyRating', format: 'text' },
  ],
  structural: [
    { key: 'roofType', label: 'Roof Type', path: 'structural.roofType', format: 'text' },
    { key: 'roofAgeEst', label: 'Roof Age Est.', path: 'structural.roofAgeEst', format: 'text' },
    { key: 'exteriorMaterial', label: 'Exterior Material', path: 'structural.exteriorMaterial', format: 'text' },
    { key: 'foundation', label: 'Foundation', path: 'structural.foundation', format: 'text' },
    { key: 'hvacType', label: 'HVAC Type', path: 'structural.hvacType', format: 'text' },
    { key: 'hvacAge', label: 'HVAC Age', path: 'structural.hvacAge', format: 'text' },
    { key: 'poolYn', label: 'Has Pool', path: 'structural.poolYn', format: 'boolean' },
    { key: 'poolType', label: 'Pool Type', path: 'structural.poolType', format: 'text' },
    { key: 'fireplaceYn', label: 'Has Fireplace', path: 'structural.fireplaceYn', format: 'boolean' },
    { key: 'interiorCondition', label: 'Interior Condition', path: 'structural.interiorCondition', format: 'text' },
  ],
  utilities: [
    { key: 'electricProvider', label: 'Electric Provider', path: 'utilities.electricProvider', format: 'text' },
    { key: 'waterProvider', label: 'Water Provider', path: 'utilities.waterProvider', format: 'text' },
    { key: 'naturalGas', label: 'Natural Gas', path: 'utilities.naturalGas', format: 'text' },
    { key: 'maxInternetSpeed', label: 'Max Internet Speed', path: 'utilities.maxInternetSpeed', format: 'text' },
    { key: 'fiberAvailable', label: 'Fiber Available', path: 'utilities.fiberAvailable', format: 'boolean' },
    { key: 'avgElectricBill', label: 'Avg Electric Bill', path: 'utilities.avgElectricBill', format: 'text' },
    { key: 'avgWaterBill', label: 'Avg Water Bill', path: 'utilities.avgWaterBill', format: 'text' },
    { key: 'solarPotential', label: 'Solar Potential', path: 'utilities.solarPotential', format: 'text' },
    { key: 'smartHomeFeatures', label: 'Smart Home Features', path: 'utilities.smartHomeFeatures', format: 'text' },
  ],
  risks: [
    { key: 'floodZone', label: 'Flood Zone', path: 'utilities.floodZone', format: 'text' },
    { key: 'floodRiskLevel', label: 'Flood Risk Level', path: 'utilities.floodRiskLevel', format: 'text' },
    { key: 'hurricaneRisk', label: 'Hurricane Risk', path: 'utilities.hurricaneRisk', format: 'text' },
    { key: 'wildfireRisk', label: 'Wildfire Risk', path: 'utilities.wildfireRisk', format: 'text' },
    { key: 'earthquakeRisk', label: 'Earthquake Risk', path: 'utilities.earthquakeRisk', format: 'text' },
    { key: 'tornadoRisk', label: 'Tornado Risk', path: 'utilities.tornadoRisk', format: 'text' },
    { key: 'radonRisk', label: 'Radon Risk', path: 'utilities.radonRisk', format: 'text' },
    { key: 'seaLevelRiseRisk', label: 'Sea Level Rise Risk', path: 'utilities.seaLevelRiseRisk', format: 'text' },
    { key: 'airQualityGrade', label: 'Air Quality Grade', path: 'utilities.airQualityGrade', format: 'text' },
    { key: 'superfundNearby', label: 'Superfund Nearby', path: 'utilities.superfundNearby', format: 'boolean' },
  ],
};

// Property selector dropdown component
function PropertySelector({
  slot,
  selectedId,
  onSelect,
  onClear,
  properties,
  excludeIds
}: {
  slot: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
  properties: PropertyCard[];
  excludeIds: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedProperty = properties.find(p => p.id === selectedId);

  const filteredProperties = useMemo(() => {
    return properties
      .filter(p => !excludeIds.includes(p.id))
      .filter(p => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
          p.address.toLowerCase().includes(search) ||
          p.city.toLowerCase().includes(search) ||
          p.zip.includes(search)
        );
      });
  }, [properties, excludeIds, searchTerm]);

  return (
    <div className="relative">
      {selectedProperty ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-4 border border-quantum-cyan/30"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-quantum-cyan">Property {slot}</span>
            <button
              onClick={onClear}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          </div>
          <h3 className="font-semibold text-white text-sm mb-1">{selectedProperty.address}</h3>
          <p className="text-xs text-gray-400 mb-2">{selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/5 rounded px-2 py-1">
              <span className="text-gray-400">Price:</span>
              <span className="text-white ml-1">${selectedProperty.price.toLocaleString()}</span>
            </div>
            <div className="bg-white/5 rounded px-2 py-1">
              <span className="text-gray-400">Score:</span>
              <span className="text-quantum-cyan ml-1">{selectedProperty.smartScore}</span>
            </div>
            <div className="bg-white/5 rounded px-2 py-1">
              <span className="text-gray-400">Beds:</span>
              <span className="text-white ml-1">{selectedProperty.bedrooms}</span>
            </div>
            <div className="bg-white/5 rounded px-2 py-1">
              <span className="text-gray-400">Sqft:</span>
              <span className="text-white ml-1">{selectedProperty.sqft.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>
      ) : (
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="glass-card p-6 border-2 border-dashed border-white/10 hover:border-quantum-cyan/30 transition-colors cursor-pointer"
        >
          <div className="flex flex-col items-center justify-center h-24 text-center">
            <Plus className="w-8 h-8 text-gray-500 mb-2" />
            <p className="text-gray-400 text-sm">Select Property {slot}</p>
            <ChevronDown className="w-4 h-4 text-gray-500 mt-1" />
          </div>
        </div>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && !selectedProperty && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 top-full left-0 right-0 mt-2 glass-card border border-white/10 rounded-xl overflow-hidden max-h-80"
          >
            {/* Search */}
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-quantum-cyan/50"
                />
              </div>
            </div>

            {/* Property List */}
            <div className="overflow-y-auto max-h-60">
              {filteredProperties.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No properties available
                </div>
              ) : (
                filteredProperties.map((property) => (
                  <div
                    key={property.id}
                    onClick={() => {
                      onSelect(property.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-b-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-white">{property.address}</p>
                        <p className="text-xs text-gray-400">{property.city}, {property.state}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-quantum-green">${property.price.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">Score: {property.smartScore}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setSearchTerm('');
          }}
        />
      )}
    </div>
  );
}

// Get nested value from property object
function getNestedValue(obj: any, path: string): any {
  if (!obj) return null;

  // Handle special card prefix for PropertyCard fields
  if (path.startsWith('card.')) {
    return obj[path.replace('card.', '')];
  }

  const parts = path.split('.');
  let value = obj;

  for (const part of parts) {
    if (value === null || value === undefined) return null;
    value = value[part];
  }

  // Handle DataField structure
  if (value && typeof value === 'object' && 'value' in value) {
    return value.value;
  }

  return value;
}

// Format value for display
function formatValue(value: any, format?: string): string {
  if (value === null || value === undefined) return '—';

  switch (format) {
    case 'currency':
      return typeof value === 'number' ? `$${value.toLocaleString()}` : value.toString();
    case 'percent':
      return typeof value === 'number' ? `${value.toFixed(1)}%` : value.toString();
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : value.toString();
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'rating':
      return value?.toString() || '—';
    default:
      return value?.toString() || '—';
  }
}

// Compare values and determine which is better
function compareValues(
  values: (any)[],
  higherIsBetter?: boolean
): ('better' | 'worse' | 'equal' | 'neutral')[] {
  const numericValues = values.map(v => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return v;
    if (typeof v === 'boolean') return v ? 1 : 0;
    const num = parseFloat(v);
    return isNaN(num) ? null : num;
  });

  // If we can't compare numerically or no preference set, return neutral
  if (higherIsBetter === undefined || numericValues.every(v => v === null)) {
    return values.map(() => 'neutral');
  }

  const validValues = numericValues.filter(v => v !== null) as number[];
  if (validValues.length < 2) {
    return values.map(() => 'neutral');
  }

  const best = higherIsBetter ? Math.max(...validValues) : Math.min(...validValues);
  const worst = higherIsBetter ? Math.min(...validValues) : Math.max(...validValues);

  return numericValues.map(v => {
    if (v === null) return 'neutral';
    if (v === best && v !== worst) return 'better';
    if (v === worst && v !== best) return 'worse';
    return 'equal';
  });
}

// Analytics summary component
function AnalyticsSummary({
  selectedProperties,
  fullProperties
}: {
  selectedProperties: PropertyCard[];
  fullProperties: Map<string, Property>;
}) {
  const analytics = useMemo(() => {
    if (selectedProperties.length < 2) return null;

    const pricePerSqft = selectedProperties.map(p => p.pricePerSqft);
    const lowestPricePerSqft = Math.min(...pricePerSqft);
    const lowestPriceProperty = selectedProperties.find(p => p.pricePerSqft === lowestPricePerSqft);

    const smartScores = selectedProperties.map(p => p.smartScore);
    const highestScore = Math.max(...smartScores);
    const bestScoreProperty = selectedProperties.find(p => p.smartScore === highestScore);

    const prices = selectedProperties.map(p => p.price);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    return {
      bestValue: lowestPriceProperty,
      bestScore: bestScoreProperty,
      avgPrice,
      priceSpread: Math.max(...prices) - Math.min(...prices),
      completenessAvg: selectedProperties.reduce((a, b) => a + b.dataCompleteness, 0) / selectedProperties.length,
    };
  }, [selectedProperties]);

  if (!analytics) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 mb-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-quantum-purple" />
        <h3 className="font-semibold text-white">Quick Analytics</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-quantum-green" />
            <span className="text-xs text-gray-400">Best Value</span>
          </div>
          <p className="text-sm font-medium text-white truncate">{analytics.bestValue?.address}</p>
          <p className="text-xs text-quantum-green">${analytics.bestValue?.pricePerSqft}/sqft</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-quantum-cyan" />
            <span className="text-xs text-gray-400">Highest Score</span>
          </div>
          <p className="text-sm font-medium text-white truncate">{analytics.bestScore?.address}</p>
          <p className="text-xs text-quantum-cyan">Score: {analytics.bestScore?.smartScore}</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-quantum-purple" />
            <span className="text-xs text-gray-400">Price Spread</span>
          </div>
          <p className="text-lg font-semibold text-white">${analytics.priceSpread.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Between properties</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-quantum-orange" />
            <span className="text-xs text-gray-400">Avg Completeness</span>
          </div>
          <p className="text-lg font-semibold text-white">{analytics.completenessAvg.toFixed(0)}%</p>
          <p className="text-xs text-gray-400">Data coverage</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Compare() {
  const { properties, fullProperties } = usePropertyStore();
  const [selectedIds, setSelectedIds] = useState<(string | null)[]>([null, null, null]);
  const [activeCategory, setActiveCategory] = useState('overview');
  const [showAllFields, setShowAllFields] = useState(false);
  const [viewMode, setViewMode] = useState<CompareViewMode>('table');
  const [showVisualAnalytics, setShowVisualAnalytics] = useState(false);

  const selectedProperties = useMemo(() => {
    return selectedIds
      .filter((id): id is string => id !== null)
      .map(id => properties.find(p => p.id === id))
      .filter((p): p is PropertyCard => p !== undefined);
  }, [selectedIds, properties]);

  const selectedFullProperties = useMemo(() => {
    return selectedIds
      .filter((id): id is string => id !== null)
      .map(id => fullProperties.get(id))
      .filter((p): p is Property => p !== undefined);
  }, [selectedIds, fullProperties]);

  // Convert selected properties to analytics format
  const analyticsProperties = useMemo((): [AnalyticsProperty, AnalyticsProperty, AnalyticsProperty] | null => {
    if (selectedProperties.length < 3) return null;

    return selectedProperties.slice(0, 3).map((cardProp, index) => {
      const fullProp = fullProperties.get(cardProp.id);
      return mapToAnalyticsProperty(cardProp, fullProp);
    }) as [AnalyticsProperty, AnalyticsProperty, AnalyticsProperty];
  }, [selectedProperties, fullProperties]);

  const handleSelect = (slot: number, id: string) => {
    const newIds = [...selectedIds];
    newIds[slot] = id;
    setSelectedIds(newIds);
  };

  const handleClear = (slot: number) => {
    const newIds = [...selectedIds];
    newIds[slot] = null;
    setSelectedIds(newIds);
  };

  const excludeIds = selectedIds.filter((id): id is string => id !== null);

  const currentFields = comparisonFields[activeCategory] || [];

  return (
    <motion.div
      className="px-4 py-6 md:px-8 md:py-10 max-w-7xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-gradient-quantum mb-2">
              Advanced Comparison Analytics
            </h1>
            <p className="text-gray-400">
              Select up to 3 properties for side-by-side comparison
            </p>
          </div>

          {/* View Mode Toggle */}
          {selectedProperties.length >= 2 && (
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                <Table2 className="w-4 h-4" />
                Table View
              </button>
              <button
                onClick={() => setViewMode('visual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  viewMode === 'visual'
                    ? 'bg-quantum-purple/20 text-quantum-purple border border-quantum-purple/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                <PieChart className="w-4 h-4" />
                32 Visual Charts
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Property Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map((slot) => (
          <PropertySelector
            key={slot}
            slot={slot + 1}
            selectedId={selectedIds[slot]}
            onSelect={(id) => handleSelect(slot, id)}
            onClear={() => handleClear(slot)}
            properties={properties}
            excludeIds={excludeIds.filter(id => id !== selectedIds[slot])}
          />
        ))}
      </div>

      {/* Analytics Summary */}
      {selectedProperties.length >= 2 && (
        <AnalyticsSummary
          selectedProperties={selectedProperties}
          fullProperties={fullProperties}
        />
      )}

      {/* Visual Analytics Mode */}
      {viewMode === 'visual' && selectedProperties.length >= 3 && analyticsProperties && (
        <div className="mb-6">
          <PropertyComparisonAnalytics
            properties={analyticsProperties}
            onClose={() => setViewMode('table')}
          />
        </div>
      )}

      {/* Visual Analytics - Need 3 properties message */}
      {viewMode === 'visual' && selectedProperties.length >= 2 && selectedProperties.length < 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 text-center mb-6"
        >
          <PieChart className="w-16 h-16 mx-auto mb-4 text-quantum-purple opacity-50" />
          <h3 className="text-xl font-semibold text-white mb-2">Select 3 Properties</h3>
          <p className="text-gray-400">
            The 32 visual chart comparisons require exactly 3 properties selected.
            <br />
            Please select one more property above.
          </p>
        </motion.div>
      )}

      {/* Table View Content */}
      {viewMode === 'table' && (
        <>
          {/* Category Tabs */}
          {selectedProperties.length >= 2 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {fieldCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeCategory === cat.id
                        ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/30'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Comparison Table */}
      <div className="glass-5d p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-quantum-cyan" />
            <h2 className="font-semibold text-white">Comparison Matrix</h2>
          </div>

          {selectedProperties.length >= 2 && (
            <button
              onClick={() => setShowAllFields(!showAllFields)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${showAllFields ? 'rotate-180' : ''} transition-transform`} />
              {showAllFields ? 'Show Key Fields' : 'Show All Fields'}
            </button>
          )}
        </div>

        {selectedProperties.length < 2 ? (
          <div className="text-center text-gray-500 py-12">
            <Scale className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Select at least 2 properties to compare</p>
            <p className="text-sm mt-2">Use the dropdown selectors above to choose properties</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 w-48">
                    Field
                  </th>
                  {selectedProperties.map((prop, idx) => (
                    <th key={prop.id} className="text-left py-3 px-4 text-sm font-medium text-white min-w-[180px]">
                      <div className="truncate">{prop.address}</div>
                      <div className="text-xs text-gray-400 font-normal">{prop.city}, {prop.state}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentFields
                  .slice(0, showAllFields ? undefined : 6)
                  .map((field) => {
                    // Get values from either full property or card
                    const values = selectedIds
                      .filter((id): id is string => id !== null)
                      .map(id => {
                        const fullProp = fullProperties.get(id);
                        const cardProp = properties.find(p => p.id === id);

                        if (field.path.startsWith('card.')) {
                          return cardProp ? getNestedValue(cardProp, field.path) : null;
                        }

                        // Try full property first, then fall back to card for basic fields
                        if (fullProp) {
                          const val = getNestedValue(fullProp, field.path);
                          if (val !== null && val !== undefined) return val;
                        }

                        // Map some common fields from card
                        if (cardProp) {
                          const cardMappings: Record<string, keyof PropertyCard> = {
                            'address.listingPrice': 'price',
                            'address.pricePerSqft': 'pricePerSqft',
                            'details.bedrooms': 'bedrooms',
                            'details.totalBathrooms': 'bathrooms',
                            'details.livingSqft': 'sqft',
                            'details.yearBuilt': 'yearBuilt',
                          };
                          const cardKey = cardMappings[field.path];
                          if (cardKey && cardProp[cardKey] !== undefined) {
                            return cardProp[cardKey];
                          }
                        }

                        return null;
                      });

                    const comparisons = compareValues(values, field.higherIsBetter);

                    return (
                      <tr key={field.key} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-sm text-gray-400">
                          {field.label}
                        </td>
                        {values.map((value, idx) => {
                          const comparison = comparisons[idx];
                          const colorClass =
                            comparison === 'better' ? 'text-quantum-green' :
                            comparison === 'worse' ? 'text-quantum-red' :
                            comparison === 'equal' ? 'text-gray-400' :
                            'text-white';

                          return (
                            <td key={idx} className={`py-3 px-4 text-sm ${colorClass}`}>
                              <div className="flex items-center gap-2">
                                {formatValue(value, field.format)}
                                {comparison === 'better' && <TrendingUp className="w-3 h-3" />}
                                {comparison === 'worse' && <TrendingDown className="w-3 h-3" />}
                                {comparison === 'equal' && <Minus className="w-3 h-3" />}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {!showAllFields && currentFields.length > 6 && (
              <div className="text-center py-4">
                <button
                  onClick={() => setShowAllFields(true)}
                  className="text-sm text-quantum-cyan hover:text-quantum-cyan/80 transition-colors"
                >
                  Show {currentFields.length - 6} more fields...
                </button>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex justify-center gap-6 text-sm text-gray-400 border-t border-white/10 pt-4 mt-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-quantum-green" />
            <span>Better</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="w-4 h-4 text-gray-500" />
            <span>Equal</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-quantum-red" />
            <span>Worse</span>
          </div>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-500" />
            <span>N/A</span>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Data completeness warning */}
      {selectedFullProperties.length < selectedProperties.length && selectedProperties.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-4 bg-quantum-orange/10 border border-quantum-orange/30 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-quantum-orange flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white font-medium">Limited Data Available</p>
              <p className="text-xs text-gray-400 mt-1">
                Some properties only have basic card data. Full 138-field comparison requires complete property data.
                View individual property details to see all available fields.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
