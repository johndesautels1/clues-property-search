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
}

const DataField = ({ label, value, icon, format = 'text' }: DataFieldProps) => {
  if (value === null || value === undefined || value === '') return null;

  const formattedValue = formatValue(value, format);

  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
      {icon && <div className="text-quantum-cyan mt-0.5">{icon}</div>}
      <div className="flex-1">
        <span className="text-sm text-gray-400">{label}</span>
        <p className="text-white font-medium">{formattedValue}</p>
      </div>
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
  const { getPropertyById, getFullPropertyById, removeProperty } = usePropertyStore();

  const property = id ? getPropertyById(id) : undefined;
  const fullProperty = id ? getFullPropertyById(id) : undefined;

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
                  <DataField label="Full Address" value={fullProperty.address.fullAddress.value} />
                  <DataField label="MLS Primary" value={fullProperty.address.mlsPrimary.value} />
                  <DataField label="MLS Secondary" value={fullProperty.address.mlsSecondary.value} />
                  <DataField label="Listing Status" value={fullProperty.address.listingStatus.value} />
                </div>
                <div>
                  <DataField label="Listing Date" value={fullProperty.address.listingDate.value} format="date" />
                  <DataField label="County" value={fullProperty.address.county.value} />
                  <DataField label="ZIP Code" value={fullProperty.address.zipCode.value} />
                  <DataField label="Parcel ID" value={fullProperty.details.parcelId.value} />
                </div>
              </div>
            </Section>

            {/* Pricing */}
            <Section title="Pricing & Value" icon={<DollarSign className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <DataField label="Listing Price" value={fullProperty.address.listingPrice.value} format="currency" />
                  <DataField label="Price Per Sq Ft" value={fullProperty.address.pricePerSqft.value} format="currency" />
                  <DataField label="Market Value Estimate" value={fullProperty.details.marketValueEstimate.value} format="currency" />
                </div>
                <div>
                  <DataField label="Last Sale Date" value={fullProperty.details.lastSaleDate.value} format="date" />
                  <DataField label="Last Sale Price" value={fullProperty.details.lastSalePrice.value} format="currency" />
                  <DataField label="Assessed Value" value={fullProperty.details.assessedValue.value} format="currency" />
                </div>
              </div>
            </Section>

            {/* Property Basics */}
            <Section title="Property Basics" icon={<Home className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <DataField label="Bedrooms" value={fullProperty.details.bedrooms.value} format="number" />
                  <DataField label="Full Bathrooms" value={fullProperty.details.fullBathrooms.value} format="number" />
                  <DataField label="Half Bathrooms" value={fullProperty.details.halfBathrooms.value} format="number" />
                  <DataField label="Total Bathrooms" value={fullProperty.details.totalBathrooms.value} format="number" />
                </div>
                <div>
                  <DataField label="Living Sq Ft" value={fullProperty.details.livingSqft.value} format="number" />
                  <DataField label="Total Sq Ft Under Roof" value={fullProperty.details.totalSqftUnderRoof.value} format="number" />
                  <DataField label="Lot Size (Sq Ft)" value={fullProperty.details.lotSizeSqft.value} format="number" />
                  <DataField label="Lot Size (Acres)" value={fullProperty.details.lotSizeAcres.value} format="number" />
                </div>
                <div>
                  <DataField label="Year Built" value={fullProperty.details.yearBuilt.value} />
                  <DataField label="Property Type" value={fullProperty.details.propertyType.value} />
                  <DataField label="Stories" value={fullProperty.details.stories.value} format="number" />
                  <DataField label="Garage Spaces" value={fullProperty.details.garageSpaces.value} format="number" />
                  <DataField label="Parking Total" value={fullProperty.details.parkingTotal.value} />
                </div>
              </div>
            </Section>

            {/* HOA & Taxes */}
            <Section title="HOA & Taxes" icon={<Shield className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <DataField label="HOA" value={fullProperty.details.hoaYn.value} />
                  <DataField label="HOA Fee (Annual)" value={fullProperty.details.hoaFeeAnnual.value} format="currency" />
                  <DataField label="Ownership Type" value={fullProperty.details.ownershipType.value} />
                </div>
                <div>
                  <DataField label="Annual Taxes" value={fullProperty.details.annualTaxes.value} format="currency" />
                  <DataField label="Tax Year" value={fullProperty.details.taxYear.value} />
                  <DataField label="Property Tax Rate" value={fullProperty.financial.propertyTaxRate.value} format="percent" />
                  <DataField label="Tax Exemptions" value={fullProperty.financial.taxExemptions.value} />
                </div>
              </div>
            </Section>

            {/* Structure & Systems */}
            <Section title="Structure & Systems" icon={<Building2 className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <DataField label="Roof Type" value={fullProperty.structural.roofType.value} />
                  <DataField label="Roof Age (Est)" value={fullProperty.structural.roofAgeEst.value} />
                  <DataField label="Exterior Material" value={fullProperty.structural.exteriorMaterial.value} />
                  <DataField label="Foundation" value={fullProperty.structural.foundation.value} />
                </div>
                <div>
                  <DataField label="HVAC Type" value={fullProperty.structural.hvacType.value} />
                  <DataField label="HVAC Age" value={fullProperty.structural.hvacAge.value} />
                  <DataField label="Interior Condition" value={fullProperty.structural.interiorCondition.value} />
                </div>
              </div>
            </Section>

            {/* Interior Features */}
            <Section title="Interior Features" icon={<Home className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <DataField label="Flooring Type" value={fullProperty.structural.flooringType.value} />
                  <DataField label="Kitchen Features" value={fullProperty.structural.kitchenFeatures.value} />
                  <DataField label="Appliances Included" value={fullProperty.structural.appliancesIncluded.value} />
                </div>
                <div>
                  <DataField label="Fireplace" value={fullProperty.structural.fireplaceYn.value} />
                </div>
              </div>
            </Section>

            {/* Exterior Features */}
            <Section title="Exterior Features" icon={<Trees className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <DataField label="Pool" value={fullProperty.structural.poolYn.value} />
                  <DataField label="Pool Type" value={fullProperty.structural.poolType.value} />
                  <DataField label="Deck/Patio" value={fullProperty.structural.deckPatio.value} />
                </div>
                <div>
                  <DataField label="Fence" value={fullProperty.structural.fence.value} />
                  <DataField label="Landscaping" value={fullProperty.structural.landscaping.value} />
                </div>
              </div>
            </Section>

            {/* Permits & Renovations */}
            <Section title="Permits & Renovations" icon={<Wrench className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <DataField label="Recent Renovations" value={fullProperty.structural.recentRenovations.value} />
                  <DataField label="Permit History - Roof" value={fullProperty.structural.permitHistoryRoof.value} />
                </div>
                <div>
                  <DataField label="Permit History - HVAC" value={fullProperty.structural.permitHistoryHvac.value} />
                  <DataField label="Permit History - Other" value={fullProperty.structural.permitHistoryPoolAdditions.value} />
                </div>
              </div>
            </Section>

            {/* Schools */}
            <Section title="Assigned Schools" icon={<School className="w-6 h-6" />}>
              <div className="space-y-4">
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
                <DataField label="Noise Level" value={fullProperty.location.noiseLevel.value} />
                <DataField label="Traffic Level" value={fullProperty.location.trafficLevel.value} />
                <DataField label="Walkability Description" value={fullProperty.location.walkabilityDescription.value} />
                <DataField label="Public Transit Access" value={fullProperty.location.publicTransitAccess.value} />
                <DataField label="Commute to City Center" value={fullProperty.location.commuteTimeCityCenter.value} />
              </div>
            </Section>

            {/* Distances & Amenities */}
            <Section title="Distances & Amenities" icon={<MapPin className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DataField label="Grocery" value={fullProperty.location.distanceGroceryMiles.value} format="number" icon={<span className="text-xs">mi</span>} />
                <DataField label="Hospital" value={fullProperty.location.distanceHospitalMiles.value} format="number" icon={<span className="text-xs">mi</span>} />
                <DataField label="Airport" value={fullProperty.location.distanceAirportMiles.value} format="number" icon={<span className="text-xs">mi</span>} />
                <DataField label="Park" value={fullProperty.location.distanceParkMiles.value} format="number" icon={<span className="text-xs">mi</span>} />
                <DataField label="Beach" value={fullProperty.location.distanceBeachMiles.value} format="number" icon={<span className="text-xs">mi</span>} />
              </div>
            </Section>

            {/* Safety & Crime */}
            <Section title="Safety & Crime" icon={<Shield className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DataField label="Violent Crime Index" value={fullProperty.location.crimeIndexViolent.value} />
                <DataField label="Property Crime Index" value={fullProperty.location.crimeIndexProperty.value} />
                <DataField label="Neighborhood Safety Rating" value={fullProperty.location.neighborhoodSafetyRating.value} />
              </div>
            </Section>

            {/* Market & Investment */}
            <Section title="Market & Investment Data" icon={<TrendingUp className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <DataField label="Median Home Price (Neighborhood)" value={fullProperty.financial.medianHomePriceNeighborhood.value} format="currency" />
                  <DataField label="Price Per Sq Ft (Recent Avg)" value={fullProperty.financial.pricePerSqftRecentAvg.value} format="currency" />
                  <DataField label="Days on Market (Avg)" value={fullProperty.financial.daysOnMarketAvg.value} format="number" />
                  <DataField label="Inventory Surplus" value={fullProperty.financial.inventorySurplus.value} />
                  <DataField label="Insurance Estimate (Annual)" value={fullProperty.financial.insuranceEstAnnual.value} format="currency" />
                </div>
                <div>
                  <DataField label="Rental Estimate (Monthly)" value={fullProperty.financial.rentalEstimateMonthly.value} format="currency" />
                  <DataField label="Rental Yield (Est)" value={fullProperty.financial.rentalYieldEst.value} format="percent" />
                  <DataField label="Vacancy Rate (Neighborhood)" value={fullProperty.financial.vacancyRateNeighborhood.value} format="percent" />
                  <DataField label="Cap Rate (Est)" value={fullProperty.financial.capRateEst.value} format="percent" />
                  <DataField label="Financing Terms" value={fullProperty.financial.financingTerms.value} />
                  <DataField label="Comparable Sales" value={fullProperty.financial.comparableSalesLast3.value} />
                </div>
              </div>
            </Section>

            {/* Utilities */}
            <Section title="Utilities & Connectivity" icon={<Wifi className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <DataField label="Electric Provider" value={fullProperty.utilities.electricProvider.value} icon={<Zap className="w-4 h-4" />} />
                  <DataField label="Water Provider" value={fullProperty.utilities.waterProvider.value} />
                  <DataField label="Sewer Provider" value={fullProperty.utilities.sewerProvider.value} />
                  <DataField label="Natural Gas" value={fullProperty.utilities.naturalGas.value} />
                </div>
                <div>
                  <DataField label="Internet Providers (Top 3)" value={fullProperty.utilities.internetProvidersTop3.value} />
                  <DataField label="Max Internet Speed" value={fullProperty.utilities.maxInternetSpeed.value} />
                  <DataField label="Cable TV Provider" value={fullProperty.utilities.cableTvProvider.value} />
                </div>
              </div>
            </Section>

            {/* Environment & Risk */}
            <Section title="Environment & Risk" icon={<Sun className="w-6 h-6" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <DataField label="Air Quality Index" value={fullProperty.utilities.airQualityIndexCurrent.value} />
                  <DataField label="Flood Zone" value={fullProperty.utilities.floodZone.value} />
                  <DataField label="Flood Risk Level" value={fullProperty.utilities.floodRiskLevel.value} />
                  <DataField label="Climate Risk" value={fullProperty.utilities.climateRiskWildfireFlood.value} />
                </div>
                <div>
                  <DataField label="Noise Level (dB Est)" value={fullProperty.utilities.noiseLevelDbEst.value} />
                  <DataField label="Solar Potential" value={fullProperty.utilities.solarPotential.value} />
                </div>
              </div>
            </Section>

            {/* Additional Features */}
            <Section title="Additional Features" icon={<Hammer className="w-6 h-6" />} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <DataField label="EV Charging" value={fullProperty.utilities.evChargingYn.value} />
                  <DataField label="Smart Home Features" value={fullProperty.utilities.smartHomeFeatures.value} />
                  <DataField label="Accessibility Modifications" value={fullProperty.utilities.accessibilityMods.value} />
                </div>
                <div>
                  <DataField label="Pet Policy" value={fullProperty.utilities.petPolicy.value} />
                  <DataField label="Age Restrictions" value={fullProperty.utilities.ageRestrictions.value} />
                  <DataField label="Special Assessments" value={fullProperty.utilities.specialAssessments.value} />
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
