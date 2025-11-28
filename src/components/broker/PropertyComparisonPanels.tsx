/**
 * Property Comparison Panels
 *
 * Side-by-side glassmorphic comparison cards
 * Horizontal scroll layout for 2-5 properties
 */

import { motion } from 'framer-motion';
import {
  Home,
  DollarSign,
  Bed,
  Bath,
  Square,
  TrendingUp,
  Percent,
  MapPin,
  Shield,
  Waves,
  Car,
  Zap,
  Flame,
  Palmtree,
} from 'lucide-react';

interface Property {
  id: string | number;
  address: string;
  price: number;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  listPrice: number;
  marketEstimate: number;
  pricePerSqft: number;
  daysOnMarket: number;
  capRate: number;
  rentalYield: number;
  priceToRent: number;
  rentalIncome: number;
  annualTaxes?: number;
  propertyTax: number;
  insurance: number;
  maintenance: number;
  walkScore: number;
  transitScore: number;
  bikeScore: number;
  safetyScore: number;
  floodRisk: number;
  hurricaneRisk: number;
  propertyType?: string;
  yearBuilt: number;
  features_pool?: number;
  features_beachAccess?: number;
  features_evCharging?: number;
  features_smartHome?: number;
  [key: string]: any;
}

interface PropertyComparisonPanelsProps {
  properties: Property[];
  title?: string;
}

// Format currency
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

// Get short address
function shortAddress(address: string): string {
  const parts = address.split(',');
  return parts[0] || address;
}

// Feature badge component
function FeatureBadge({ icon: Icon, label, active }: { icon: any; label: string; active: boolean }) {
  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
        active ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-700/50 text-gray-500'
      }`}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </div>
  );
}

// Single property comparison card
function PropertyCard({ property, index }: { property: Property; index: number }) {
  const hasPool = property.features_pool === 100 || property.features?.pool === 100;
  const hasBeach = property.features_beachAccess === 100 || property.features?.beachAccess === 100;
  const hasEV = property.features_evCharging === 100 || property.features?.evCharging === 100;
  const hasSmart = property.features_smartHome === 100 || property.features?.smartHome === 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="flex-shrink-0 w-80 rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Header with price */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="text-white font-semibold text-lg truncate" title={property.address}>
              {shortAddress(property.address)}
            </p>
            <p className="text-gray-500 text-xs">{property.propertyType || 'Single Family'}</p>
          </div>
          <div className="text-right">
            <p className="text-cyan-400 font-bold text-xl">{formatCurrency(property.listPrice)}</p>
            <p className="text-gray-500 text-xs">{property.daysOnMarket} days</p>
          </div>
        </div>

        {/* Property basics */}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <Bed className="w-4 h-4" /> {property.bedrooms}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-4 h-4" /> {property.bathrooms}
          </span>
          <span className="flex items-center gap-1">
            <Square className="w-4 h-4" /> {property.sqft.toLocaleString()} sqft
          </span>
        </div>
      </div>

      {/* Financial Section */}
      <div className="p-4 border-b border-white/10">
        <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Financial</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-gray-500 text-xs">Cap Rate</p>
            <p className="text-green-400 font-semibold">{property.capRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Rental Yield</p>
            <p className="text-green-400 font-semibold">{property.rentalYield.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">$/Sqft</p>
            <p className="text-white font-semibold">${property.pricePerSqft.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Rent/Mo</p>
            <p className="text-white font-semibold">{formatCurrency(property.rentalIncome)}</p>
          </div>
        </div>
      </div>

      {/* Scores Section */}
      <div className="p-4 border-b border-white/10">
        <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Scores</p>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-white font-bold">{property.walkScore}</p>
            <p className="text-gray-500 text-xs">Walk</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold">{property.transitScore}</p>
            <p className="text-gray-500 text-xs">Transit</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold">{property.bikeScore}</p>
            <p className="text-gray-500 text-xs">Bike</p>
          </div>
          <div className="text-center">
            <p className={`font-bold ${property.safetyScore >= 80 ? 'text-green-400' : property.safetyScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
              {property.safetyScore}
            </p>
            <p className="text-gray-500 text-xs">Safety</p>
          </div>
        </div>
      </div>

      {/* Risk Section */}
      <div className="p-4 border-b border-white/10">
        <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Risk (1-10)</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500 text-xs">Flood</span>
              <span className={`text-xs font-semibold ${property.floodRisk >= 7 ? 'text-red-400' : property.floodRisk >= 4 ? 'text-yellow-400' : 'text-green-400'}`}>
                {property.floodRisk}/10
              </span>
            </div>
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${property.floodRisk >= 7 ? 'bg-red-500' : property.floodRisk >= 4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${property.floodRisk * 10}%` }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500 text-xs">Hurricane</span>
              <span className={`text-xs font-semibold ${property.hurricaneRisk >= 7 ? 'text-red-400' : property.hurricaneRisk >= 4 ? 'text-yellow-400' : 'text-green-400'}`}>
                {property.hurricaneRisk}/10
              </span>
            </div>
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${property.hurricaneRisk >= 7 ? 'bg-red-500' : property.hurricaneRisk >= 4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${property.hurricaneRisk * 10}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="p-4">
        <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Features</p>
        <div className="flex flex-wrap gap-2">
          <FeatureBadge icon={Waves} label="Pool" active={hasPool} />
          <FeatureBadge icon={Palmtree} label="Beach" active={hasBeach} />
          <FeatureBadge icon={Car} label="EV" active={hasEV} />
          <FeatureBadge icon={Zap} label="Smart" active={hasSmart} />
        </div>
      </div>

      {/* Market Estimate Footer */}
      <div className="px-4 pb-4">
        <div className="p-3 rounded-xl bg-white/5">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs">Market Estimate</span>
            <span className="text-white font-semibold">{formatCurrency(property.marketEstimate)}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-gray-500 text-xs">vs List</span>
            <span className={`text-xs font-semibold ${property.marketEstimate >= property.listPrice ? 'text-green-400' : 'text-red-400'}`}>
              {property.marketEstimate >= property.listPrice ? '+' : ''}{formatCurrency(property.marketEstimate - property.listPrice)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function PropertyComparisonPanels({ properties, title = "Property Comparison" }: PropertyComparisonPanelsProps) {
  if (!properties || properties.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 text-center">
        <p className="text-gray-500">No properties to compare</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex items-center gap-3">
        <Home className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <span className="text-gray-500 text-sm">({properties.length} properties)</span>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
          {properties.map((property, index) => (
            <PropertyCard key={property.id} property={property} index={index} />
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      {properties.length > 3 && (
        <p className="text-gray-600 text-xs text-center">← Scroll to see more properties →</p>
      )}
    </div>
  );
}
