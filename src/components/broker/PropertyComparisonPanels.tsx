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

// Single property comparison card - FULL WIDTH responsive
function PropertyCard({ property, index, totalCount }: { property: Property; index: number; totalCount: number }) {
  const hasPool = property.features_pool === 100 || property.features?.pool === 100;
  const hasBeach = property.features_beachAccess === 100 || property.features?.beachAccess === 100;
  const hasEV = property.features_evCharging === 100 || property.features?.evCharging === 100;
  const hasSmart = property.features_smartHome === 100 || property.features?.smartHome === 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="flex-1 min-w-[320px] rounded-2xl overflow-hidden"
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
            {/* BRIGHT CYAN for property type */}
            <p className="text-cyan-300 text-sm font-medium">{property.propertyType || 'Single Family'}</p>
          </div>
          <div className="text-right">
            <p className="text-cyan-400 font-bold text-xl">{formatCurrency(property.listPrice)}</p>
            <p className="text-amber-400 text-xs font-medium">{property.daysOnMarket} days on market</p>
          </div>
        </div>

        {/* Property basics - BRIGHTER COLORS */}
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-purple-300 font-semibold">
            <Bed className="w-4 h-4" /> {property.bedrooms} bed
          </span>
          <span className="flex items-center gap-1 text-purple-300 font-semibold">
            <Bath className="w-4 h-4" /> {property.bathrooms} bath
          </span>
          <span className="flex items-center gap-1 text-blue-300 font-semibold">
            <Square className="w-4 h-4" /> {property.sqft.toLocaleString()} sqft
          </span>
        </div>
      </div>

      {/* Financial Section - BRIGHT LABELS */}
      <div className="p-4 border-b border-white/10">
        <p className="text-amber-400 text-xs uppercase tracking-wider mb-2 font-bold">FINANCIAL</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-cyan-300 text-xs font-medium">Cap Rate</p>
            <p className="text-emerald-400 font-bold text-lg">{property.capRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-cyan-300 text-xs font-medium">Rental Yield</p>
            <p className="text-emerald-400 font-bold text-lg">{property.rentalYield.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-cyan-300 text-xs font-medium">$/Sqft</p>
            <p className="text-white font-bold text-lg">${property.pricePerSqft.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-cyan-300 text-xs font-medium">Rent/Mo</p>
            <p className="text-white font-bold text-lg">{formatCurrency(property.rentalIncome)}</p>
          </div>
        </div>
      </div>

      {/* Scores Section - BRIGHT LABELS */}
      <div className="p-4 border-b border-white/10">
        <p className="text-purple-400 text-xs uppercase tracking-wider mb-2 font-bold">SCORES</p>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 rounded-lg bg-white/5">
            <p className="text-white font-bold text-lg">{property.walkScore}</p>
            <p className="text-cyan-300 text-xs font-medium">Walk</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <p className="text-white font-bold text-lg">{property.transitScore}</p>
            <p className="text-cyan-300 text-xs font-medium">Transit</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <p className="text-white font-bold text-lg">{property.bikeScore}</p>
            <p className="text-cyan-300 text-xs font-medium">Bike</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <p className={`font-bold text-lg ${property.safetyScore >= 80 ? 'text-emerald-400' : property.safetyScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
              {property.safetyScore}
            </p>
            <p className="text-cyan-300 text-xs font-medium">Safety</p>
          </div>
        </div>
      </div>

      {/* Risk Section - BRIGHT LABELS */}
      <div className="p-4 border-b border-white/10">
        <p className="text-red-400 text-xs uppercase tracking-wider mb-2 font-bold">RISK (1-10)</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-blue-300 text-xs font-medium">Flood</span>
              <span className={`text-sm font-bold ${property.floodRisk >= 7 ? 'text-red-400' : property.floodRisk >= 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {property.floodRisk}/10
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${property.floodRisk >= 7 ? 'bg-red-500' : property.floodRisk >= 4 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${property.floodRisk * 10}%` }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-blue-300 text-xs font-medium">Hurricane</span>
              <span className={`text-sm font-bold ${property.hurricaneRisk >= 7 ? 'text-red-400' : property.hurricaneRisk >= 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {property.hurricaneRisk}/10
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${property.hurricaneRisk >= 7 ? 'bg-red-500' : property.hurricaneRisk >= 4 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${property.hurricaneRisk * 10}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - BRIGHT LABELS */}
      <div className="p-4">
        <p className="text-emerald-400 text-xs uppercase tracking-wider mb-2 font-bold">FEATURES</p>
        <div className="flex flex-wrap gap-2">
          <FeatureBadge icon={Waves} label="Pool" active={hasPool} />
          <FeatureBadge icon={Palmtree} label="Beach" active={hasBeach} />
          <FeatureBadge icon={Car} label="EV" active={hasEV} />
          <FeatureBadge icon={Zap} label="Smart" active={hasSmart} />
        </div>
      </div>

      {/* Market Estimate Footer - HIGHLIGHTED */}
      <div className="px-4 pb-4">
        <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
          <div className="flex items-center justify-between">
            <span className="text-cyan-300 text-xs font-medium">Market Estimate</span>
            <span className="text-white font-bold">{formatCurrency(property.marketEstimate)}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-purple-300 text-xs font-medium">vs List Price</span>
            <span className={`text-sm font-bold ${property.marketEstimate >= property.listPrice ? 'text-emerald-400' : 'text-red-400'}`}>
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
        <span className="text-cyan-300 text-sm font-medium">({properties.length} properties)</span>
      </div>

      {/* FULL WIDTH Grid - cards expand to fill screen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((property, index) => (
          <PropertyCard key={property.id} property={property} index={index} totalCount={properties.length} />
        ))}
      </div>
    </div>
  );
}
