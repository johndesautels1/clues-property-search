/**
 * CLUES Property Dashboard - Property Detail Page
 * Full 110-field display with data quality indicators
 */

import { useParams } from 'react-router-dom';
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
  DollarSign,
  Shield,
  Zap,
  School,
  Car,
  Droplets,
  Sun,
  Wifi,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Demo property data (would come from API)
const demoProperty = {
  id: '1',
  address: {
    fullAddress: '280 41st Ave, St Pete Beach, FL 33706',
    street: '280 41st Ave',
    city: 'St Pete Beach',
    state: 'FL',
    zip: '33706',
    county: 'Pinellas',
  },
  price: 549000,
  pricePerSqft: 385,
  smartScore: 94,
  dataCompleteness: 98,
  details: {
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1426,
    lotSqft: 5000,
    yearBuilt: 1958,
    propertyType: 'Single Family',
    stories: 1,
    garage: 1,
  },
  scores: {
    walk: 72,
    transit: 35,
    bike: 68,
    crime: 85,
  },
  schools: {
    elementary: { name: 'Gulf Beaches Elementary', rating: 8 },
    middle: { name: 'Azalea Middle', rating: 7 },
    high: { name: 'Boca Ciega High', rating: 6 },
  },
  utilities: {
    electric: 'Duke Energy',
    water: 'Pinellas County',
    internet: ['Spectrum', 'AT&T Fiber', 'Xfinity'],
    maxSpeed: '1 Gbps',
  },
  environmental: {
    floodZone: 'X (Minimal)',
    airQuality: 'Good (45 AQI)',
    solarPotential: 'Excellent',
  },
};

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

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
            <span className="text-2xl font-bold text-quantum-green">
              {demoProperty.smartScore}
            </span>
            <span className="text-xs text-gray-400">SMART Score</span>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-4 py-6 md:px-8 md:py-10 max-w-4xl mx-auto">
        {/* Price & Address */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl md:text-4xl font-bold text-white">
              {formatPrice(demoProperty.price)}
            </span>
            <span className="text-gray-500">
              ${demoProperty.pricePerSqft}/sqft
            </span>
          </div>
          <h1 className="text-xl font-semibold text-white">
            {demoProperty.address.street}
          </h1>
          <p className="text-gray-400">
            {demoProperty.address.city}, {demoProperty.address.state}{' '}
            {demoProperty.address.zip}
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-4 gap-4 mb-6"
        >
          <div className="glass-card p-4 text-center">
            <Bed className="w-5 h-5 text-quantum-cyan mx-auto mb-1" />
            <span className="text-xl font-bold text-white">{demoProperty.details.bedrooms}</span>
            <p className="text-xs text-gray-500">Beds</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Bath className="w-5 h-5 text-quantum-cyan mx-auto mb-1" />
            <span className="text-xl font-bold text-white">{demoProperty.details.bathrooms}</span>
            <p className="text-xs text-gray-500">Baths</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Ruler className="w-5 h-5 text-quantum-cyan mx-auto mb-1" />
            <span className="text-xl font-bold text-white">{demoProperty.details.sqft.toLocaleString()}</span>
            <p className="text-xs text-gray-500">Sq Ft</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Calendar className="w-5 h-5 text-quantum-cyan mx-auto mb-1" />
            <span className="text-xl font-bold text-white">{demoProperty.details.yearBuilt}</span>
            <p className="text-xs text-gray-500">Built</p>
          </div>
        </motion.div>

        {/* Data Completeness */}
        <motion.div variants={itemVariants} className="glass-5d p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-white">110-Field Data Quality</span>
            <span className="text-quantum-cyan font-bold">{demoProperty.dataCompleteness}%</span>
          </div>
          <div className="progress-quantum h-2">
            <div
              className="progress-quantum-fill"
              style={{ width: `${demoProperty.dataCompleteness}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            108/110 fields populated with Medium+ confidence
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
                <span className="text-sm font-bold text-quantum-cyan">{demoProperty.scores.walk}</span>
              </div>
              <div className="progress-quantum h-1.5">
                <div className="progress-quantum-fill" style={{ width: `${demoProperty.scores.walk}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Transit</span>
                <span className="text-sm font-bold text-quantum-cyan">{demoProperty.scores.transit}</span>
              </div>
              <div className="progress-quantum h-1.5">
                <div className="progress-quantum-fill" style={{ width: `${demoProperty.scores.transit}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Bike</span>
                <span className="text-sm font-bold text-quantum-cyan">{demoProperty.scores.bike}</span>
              </div>
              <div className="progress-quantum h-1.5">
                <div className="progress-quantum-fill" style={{ width: `${demoProperty.scores.bike}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Safety</span>
                <span className="text-sm font-bold text-quantum-green">{demoProperty.scores.crime}</span>
              </div>
              <div className="progress-quantum h-1.5">
                <div className="progress-quantum-fill" style={{ width: `${demoProperty.scores.crime}%` }} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Schools */}
        <motion.div variants={itemVariants} className="glass-card p-4 mb-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <School className="w-5 h-5 text-quantum-cyan" />
            Assigned Schools
          </h2>
          <div className="space-y-3">
            {Object.entries(demoProperty.schools).map(([level, school]) => (
              <div key={level} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{school.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{level}</p>
                </div>
                <div className={`px-2 py-1 rounded-full ${
                  school.rating >= 8 ? 'bg-quantum-green/20 text-quantum-green' :
                  school.rating >= 6 ? 'bg-quantum-blue/20 text-quantum-blue' :
                  'bg-quantum-gold/20 text-quantum-gold'
                }`}>
                  <span className="text-sm font-bold">{school.rating}/10</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Utilities */}
        <motion.div variants={itemVariants} className="glass-card p-4 mb-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Wifi className="w-5 h-5 text-quantum-cyan" />
            Utilities & Connectivity
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Electric</p>
              <p className="text-white">{demoProperty.utilities.electric}</p>
            </div>
            <div>
              <p className="text-gray-500">Water</p>
              <p className="text-white">{demoProperty.utilities.water}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500">Internet ({demoProperty.utilities.maxSpeed})</p>
              <p className="text-white">{demoProperty.utilities.internet.join(', ')}</p>
            </div>
          </div>
        </motion.div>

        {/* Environmental */}
        <motion.div variants={itemVariants} className="glass-card p-4 mb-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Sun className="w-5 h-5 text-quantum-cyan" />
            Environmental Data
          </h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Flood Zone</p>
              <p className="text-quantum-green flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {demoProperty.environmental.floodZone}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Air Quality</p>
              <p className="text-quantum-green">{demoProperty.environmental.airQuality}</p>
            </div>
            <div>
              <p className="text-gray-500">Solar</p>
              <p className="text-quantum-gold">{demoProperty.environmental.solarPotential}</p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex gap-4">
          <button className="btn-quantum flex-1">
            Request Full Report
          </button>
          <button className="btn-glass flex-1">
            Compare Properties
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
