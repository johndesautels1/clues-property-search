/**
 * CLUES Property Dashboard - Property Detail Page
 * Full property display with data quality indicators - CONNECTED TO STORE
 */

import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Edit,
  Zap,
  School,
  Wifi,
  Sun,
  CheckCircle,
} from 'lucide-react';
import { usePropertyStore } from '@/store/propertyStore';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPropertyById, getFullPropertyById, removeProperty } = usePropertyStore();

  const property = id ? getPropertyById(id) : undefined;
  const fullProperty = id ? getFullPropertyById(id) : undefined;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

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
      className="min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Mobile Header */}
      <motion.div
        variants={itemVariants}
        className="sticky top-0 z-40 glass-card border-b border-white/10 md:hidden"
      >
        <div className="flex items-center justify-between p-4">
          <Link to="/properties" className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex gap-2">
            <button className="p-2">
              <Heart className="w-6 h-6" />
            </button>
            <button className="p-2">
              <Share2 className="w-6 h-6" />
            </button>
            <button onClick={handleDelete} className="p-2 text-red-400 hover:text-red-300">
              <Trash2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Property Image */}
      <motion.div
        variants={itemVariants}
        className="relative h-64 md:h-96 bg-gradient-to-br from-quantum-dark to-quantum-card"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin className="w-24 h-24 text-gray-600" />
        </div>

        {/* SMART Score Badge */}
        <div className="absolute bottom-4 right-4 glass-card px-4 py-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-quantum-cyan" />
            <span className={`text-2xl font-bold ${
              property.smartScore === undefined ? 'text-gray-400' :
              property.smartScore >= 90 ? 'text-quantum-green' :
              property.smartScore >= 70 ? 'text-quantum-cyan' :
              'text-quantum-gold'
            }`}>
              {property.smartScore !== undefined ? property.smartScore : 'N/A'}
            </span>
            <span className="text-xs text-gray-400">SMART Score</span>
          </div>
        </div>

        {/* Desktop back button */}
        <div className="hidden md:block absolute top-4 left-4">
          <Link to="/properties" className="glass-card p-3 inline-flex items-center gap-2 hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex absolute top-4 right-4 gap-2">
          <button className="glass-card p-3 hover:bg-white/10">
            <Heart className="w-5 h-5" />
          </button>
          <button className="glass-card p-3 hover:bg-white/10">
            <Share2 className="w-5 h-5" />
          </button>
          <button onClick={handleDelete} className="glass-card p-3 hover:bg-red-500/20 text-red-400">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-4 py-6 md:px-8 md:py-10 max-w-4xl mx-auto">
        {/* Price & Address */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl md:text-4xl font-bold text-white">
              {formatPrice(property.price)}
            </span>
            {property.pricePerSqft > 0 && (
              <span className="text-gray-500">
                ${property.pricePerSqft}/sqft
              </span>
            )}
          </div>
          <h1 className="text-xl font-semibold text-white">
            {property.address}
          </h1>
          <p className="text-gray-400">
            {property.city}, {property.state} {property.zip}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
              property.listingStatus === 'Active' ? 'bg-quantum-green/20 text-quantum-green' :
              property.listingStatus === 'Pending' ? 'bg-quantum-gold/20 text-quantum-gold' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {property.listingStatus}
            </span>
            {property.daysOnMarket !== undefined && property.daysOnMarket > 0 && (
              <span className="text-xs text-gray-500">
                {property.daysOnMarket} days on market
              </span>
            )}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-4 gap-4 mb-6"
        >
          <div className="glass-card p-4 text-center">
            <Bed className="w-5 h-5 text-quantum-cyan mx-auto mb-1" />
            <span className="text-xl font-bold text-white">{property.bedrooms}</span>
            <p className="text-xs text-gray-500">Beds</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Bath className="w-5 h-5 text-quantum-cyan mx-auto mb-1" />
            <span className="text-xl font-bold text-white">{property.bathrooms}</span>
            <p className="text-xs text-gray-500">Baths</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Ruler className="w-5 h-5 text-quantum-cyan mx-auto mb-1" />
            <span className="text-xl font-bold text-white">{property.sqft.toLocaleString()}</span>
            <p className="text-xs text-gray-500">Sq Ft</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Calendar className="w-5 h-5 text-quantum-cyan mx-auto mb-1" />
            <span className="text-xl font-bold text-white">{property.yearBuilt}</span>
            <p className="text-xs text-gray-500">Built</p>
          </div>
        </motion.div>

        {/* Data Completeness */}
        <motion.div variants={itemVariants} className="glass-5d p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-white">110-Field Data Quality</span>
            <span className="text-quantum-cyan font-bold">{property.dataCompleteness}%</span>
          </div>
          <div className="progress-quantum h-2">
            <div
              className="progress-quantum-fill"
              style={{ width: `${property.dataCompleteness}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {Math.round(property.dataCompleteness * 1.1)}/110 fields populated
          </p>
        </motion.div>

        {/* Location Scores */}
        <motion.div variants={itemVariants} className="glass-card p-4 mb-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-quantum-cyan" />
            Location Scores
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Walk</span>
                <span className="text-sm font-bold text-quantum-cyan">
                  {fullProperty?.location.walkScore.value ?? '--'}
                </span>
              </div>
              <div className="progress-quantum h-1.5">
                <div className="progress-quantum-fill" style={{ width: `${fullProperty?.location.walkScore.value ?? 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Transit</span>
                <span className="text-sm font-bold text-quantum-cyan">
                  {fullProperty?.location.transitScore.value ?? '--'}
                </span>
              </div>
              <div className="progress-quantum h-1.5">
                <div className="progress-quantum-fill" style={{ width: `${fullProperty?.location.transitScore.value ?? 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Bike</span>
                <span className="text-sm font-bold text-quantum-cyan">
                  {fullProperty?.location.bikeScore.value ?? '--'}
                </span>
              </div>
              <div className="progress-quantum h-1.5">
                <div className="progress-quantum-fill" style={{ width: `${fullProperty?.location.bikeScore.value ?? 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Safety</span>
                <span className="text-sm font-bold text-quantum-green">
                  {fullProperty?.location.neighborhoodSafetyRating.value ?? '--'}
                </span>
              </div>
              <div className="progress-quantum h-1.5">
                <div className="progress-quantum-fill" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
          {!fullProperty && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              Location scores available after AI enrichment
            </p>
          )}
        </motion.div>

        {/* Schools */}
        <motion.div variants={itemVariants} className="glass-card p-4 mb-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <School className="w-5 h-5 text-quantum-cyan" />
            Assigned Schools
          </h2>
          {fullProperty ? (
            <div className="space-y-3">
              {fullProperty.location.assignedElementary.value && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{fullProperty.location.assignedElementary.value}</p>
                    <p className="text-xs text-gray-400">Elementary • {fullProperty.location.elementaryDistanceMiles.value ?? '--'} miles</p>
                  </div>
                  <span className="px-2 py-1 rounded bg-quantum-cyan/20 text-quantum-cyan text-sm font-bold">
                    {fullProperty.location.elementaryRating.value ?? '--'}
                  </span>
                </div>
              )}
              {fullProperty.location.assignedMiddle.value && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{fullProperty.location.assignedMiddle.value}</p>
                    <p className="text-xs text-gray-400">Middle • {fullProperty.location.middleDistanceMiles.value ?? '--'} miles</p>
                  </div>
                  <span className="px-2 py-1 rounded bg-quantum-cyan/20 text-quantum-cyan text-sm font-bold">
                    {fullProperty.location.middleRating.value ?? '--'}
                  </span>
                </div>
              )}
              {fullProperty.location.assignedHigh.value && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{fullProperty.location.assignedHigh.value}</p>
                    <p className="text-xs text-gray-400">High School • {fullProperty.location.highDistanceMiles.value ?? '--'} miles</p>
                  </div>
                  <span className="px-2 py-1 rounded bg-quantum-cyan/20 text-quantum-cyan text-sm font-bold">
                    {fullProperty.location.highRating.value ?? '--'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">
              School data available after AI enrichment
            </p>
          )}
        </motion.div>

        {/* Utilities & Connectivity */}
        <motion.div variants={itemVariants} className="glass-card p-4 mb-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Wifi className="w-5 h-5 text-quantum-cyan" />
            Utilities & Connectivity
          </h2>
          {fullProperty ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {fullProperty.utilities.electricProvider.value && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-quantum-cyan" />
                  <span className="text-gray-400">Electric:</span>
                  <span className="text-white">{fullProperty.utilities.electricProvider.value}</span>
                </div>
              )}
              {fullProperty.utilities.waterProvider.value && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-quantum-cyan" />
                  <span className="text-gray-400">Water:</span>
                  <span className="text-white">{fullProperty.utilities.waterProvider.value}</span>
                </div>
              )}
              {fullProperty.utilities.maxInternetSpeed.value && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-quantum-cyan" />
                  <span className="text-gray-400">Internet:</span>
                  <span className="text-white">{fullProperty.utilities.maxInternetSpeed.value}</span>
                </div>
              )}
              {fullProperty.utilities.naturalGas.value && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-quantum-cyan" />
                  <span className="text-gray-400">Gas:</span>
                  <span className="text-white">{fullProperty.utilities.naturalGas.value}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">
              Utility data available after AI enrichment
            </p>
          )}
        </motion.div>

        {/* Environmental Data */}
        <motion.div variants={itemVariants} className="glass-card p-4 mb-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Sun className="w-5 h-5 text-quantum-cyan" />
            Environmental Data
          </h2>
          {fullProperty ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {fullProperty.utilities.floodZone.value && (
                <div>
                  <span className="text-gray-400">Flood Zone:</span>
                  <span className="text-white ml-2">{fullProperty.utilities.floodZone.value}</span>
                </div>
              )}
              {fullProperty.utilities.floodRiskLevel.value && (
                <div>
                  <span className="text-gray-400">Flood Risk:</span>
                  <span className="text-white ml-2">{fullProperty.utilities.floodRiskLevel.value}</span>
                </div>
              )}
              {fullProperty.utilities.airQualityIndexCurrent.value && (
                <div>
                  <span className="text-gray-400">Air Quality:</span>
                  <span className="text-white ml-2">{fullProperty.utilities.airQualityIndexCurrent.value}</span>
                </div>
              )}
              {fullProperty.utilities.solarPotential.value && (
                <div>
                  <span className="text-gray-400">Solar Potential:</span>
                  <span className="text-white ml-2">{fullProperty.utilities.solarPotential.value}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">
              Environmental data available after AI enrichment
            </p>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex gap-4">
          <button className="btn-quantum flex-1">
            Request AI Enrichment
          </button>
          <Link to="/compare" className="btn-glass flex-1 text-center">
            Compare Properties
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
