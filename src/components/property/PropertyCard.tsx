/**
 * CLUES Property Dashboard - Property Card Component
 * Mobile-optimized glassmorphic card with SMART Score
 */

import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bed,
  Bath,
  Ruler,
  Calendar,
  TrendingUp,
  MapPin,
  Trash2,
} from 'lucide-react';
import type { PropertyCard as PropertyCardType } from '@/types/property';
import { usePropertyStore } from '@/store/propertyStore';

interface PropertyCardProps {
  property: PropertyCardType;
  variant?: 'default' | 'compact' | 'detailed';
  showDelete?: boolean;
}

export default function PropertyCard({
  property,
  variant = 'default',
  showDelete = true,
}: PropertyCardProps) {
  const navigate = useNavigate();
  const { removeProperty } = usePropertyStore();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm(`Delete ${property.address}?`)) {
      removeProperty(property.id);
    }
  };
  const formatPrice = (price: number) => {
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

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="glass-card-hover"
    >
      <Link to={`/property/${property.id}`} className="block">
        <div className="flex flex-col md:flex-row">
          {/* Property Image - Mobile: Full width, Desktop: Fixed width */}
          <div className="relative w-full md:w-48 h-40 md:h-auto flex-shrink-0">
            {property.thumbnail ? (
              <img
                src={property.thumbnail}
                alt={property.address}
                className="w-full h-full object-cover rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-quantum-dark to-quantum-card rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none flex items-center justify-center">
                <MapPin className="w-12 h-12 text-gray-600" />
              </div>
            )}

            {/* SMART Score Badge */}
            <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full bg-gradient-to-r ${getScoreBg(property.smartScore)} backdrop-blur-lg border border-white/20`}>
              <span className={`font-bold text-lg ${getScoreColor(property.smartScore)}`}>
                {property.smartScore}
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
                {property.listingStatus}
              </span>
            </div>
          </div>

          {/* Property Info */}
          <div className="flex-1 p-4 md:p-5">
            {/* Price */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-xl md:text-2xl font-bold text-white">
                {formatPrice(property.price)}
              </span>
              <span className="text-sm text-gray-500">
                ${property.pricePerSqft}/sqft
              </span>
            </div>

            {/* Address */}
            <h3 className="font-semibold text-white mb-1">
              {property.address}
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              {property.city}, {property.state} {property.zip}
            </p>

            {/* Property Features - Mobile: 2x2 grid, Desktop: inline */}
            <div className="grid grid-cols-4 gap-2 md:flex md:gap-4">
              <div className="flex flex-col items-center md:flex-row md:items-center gap-1">
                <Bed className="w-4 h-4 text-quantum-cyan" />
                <span className="text-sm text-gray-300">{property.bedrooms}</span>
                <span className="text-xs text-gray-500 hidden md:inline">beds</span>
              </div>
              <div className="flex flex-col items-center md:flex-row md:items-center gap-1">
                <Bath className="w-4 h-4 text-quantum-cyan" />
                <span className="text-sm text-gray-300">{property.bathrooms}</span>
                <span className="text-xs text-gray-500 hidden md:inline">baths</span>
              </div>
              <div className="flex flex-col items-center md:flex-row md:items-center gap-1">
                <Ruler className="w-4 h-4 text-quantum-cyan" />
                <span className="text-sm text-gray-300">{property.sqft.toLocaleString()}</span>
                <span className="text-xs text-gray-500 hidden md:inline">sqft</span>
              </div>
              <div className="flex flex-col items-center md:flex-row md:items-center gap-1">
                <Calendar className="w-4 h-4 text-quantum-cyan" />
                <span className="text-sm text-gray-300">{property.yearBuilt}</span>
              </div>
            </div>

            {/* Data Completeness Bar */}
            <div className="mt-4 hidden md:block">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Data Completeness</span>
                <span className="text-quantum-cyan">{property.dataCompleteness}%</span>
              </div>
              <div className="progress-quantum h-1.5">
                <div
                  className="progress-quantum-fill"
                  style={{ width: `${property.dataCompleteness}%` }}
                />
              </div>
            </div>

            {/* Days on Market */}
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <TrendingUp className="w-3 h-3" />
              {property.daysOnMarket} days on market
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
