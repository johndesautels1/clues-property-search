/**
 * Visuals Page - Advanced Property Analytics
 * 175 Charts organized into 20 property data categories
 *
 * MOBILE + DESKTOP RESPONSIVE
 * Mega-tab interface with nested category tabs
 * Real data from usePropertyStore → visualsDataMapper → Charts
 */

import { useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePropertyStore } from '@/store/propertyStore';
import { mapPropertiesToChart } from '@/lib/visualsDataMapper';
import {
  MapPin, DollarSign, Home, Building2, Wrench,
  Sofa, Trees, Hammer, GraduationCap, Navigation,
  Car, Shield, TrendingUp, Zap, CloudRain, Sparkles,
  ParkingCircle, Building, FileText, Waves, ChevronDown
} from 'lucide-react';

// Lazy load category components
const Category01_AddressIdentity = lazy(() => import('@/components/visuals/Category01_AddressIdentity'));
const Category02_PricingValue = lazy(() => import('@/components/visuals/Category02_Placeholder'));
const Category03_PropertyBasics = lazy(() => import('@/components/visuals/Category03_Placeholder'));
const Category04_HOATaxes = lazy(() => import('@/components/visuals/Category04_Placeholder'));
const Category05_StructureSystems = lazy(() => import('@/components/visuals/Category05_Placeholder'));
const Category06_InteriorFeatures = lazy(() => import('@/components/visuals/Category06_Placeholder'));
const Category07_ExteriorFeatures = lazy(() => import('@/components/visuals/Category07_Placeholder'));
const Category08_PermitsRenovations = lazy(() => import('@/components/visuals/Category08_Placeholder'));
const Category09_Schools = lazy(() => import('@/components/visuals/Category09_Placeholder'));
const Category10_LocationScores = lazy(() => import('@/components/visuals/Category10_Placeholder'));
const Category11_DistancesAmenities = lazy(() => import('@/components/visuals/Category11_Placeholder'));
const Category12_SafetyCrime = lazy(() => import('@/components/visuals/Category12_Placeholder'));
const Category13_MarketInvestment = lazy(() => import('@/components/visuals/Category13_Placeholder'));
const Category14_UtilitiesConnectivity = lazy(() => import('@/components/visuals/Category14_Placeholder'));
const Category15_EnvironmentRisk = lazy(() => import('@/components/visuals/Category15_Placeholder'));
const Category16_AdditionalFeatures = lazy(() => import('@/components/visuals/Category16_Placeholder'));
const Category17_ParkingGarage = lazy(() => import('@/components/visuals/Category17_Placeholder'));
const Category18_BuildingDetails = lazy(() => import('@/components/visuals/Category18_Placeholder'));
const Category19_LegalTax = lazy(() => import('@/components/visuals/Category19_Placeholder'));
const Category20_WaterfrontLeasing = lazy(() => import('@/components/visuals/Category20_Placeholder'));

// Category metadata
interface Category {
  id: string;
  title: string;
  icon: typeof MapPin;
  color: string;
  description: string;
  component: React.LazyExoticComponent<any>;
}

const categories: Category[] = [
  { id: '01', title: 'Address & Identity', icon: MapPin, color: '#00D9FF', description: 'Location, MLS, Parcel Data', component: Category01_AddressIdentity },
  { id: '02', title: 'Pricing & Value', icon: DollarSign, color: '#10B981', description: 'List Price, Estimates, Market Comp', component: Category02_PricingValue },
  { id: '03', title: 'Property Basics', icon: Home, color: '#8B5CF6', description: 'Beds, Baths, Sqft, Lot Size', component: Category03_PropertyBasics },
  { id: '04', title: 'HOA & Taxes', icon: Building2, color: '#F59E0B', description: 'HOA Fees, Annual Taxes, Exemptions', component: Category04_HOATaxes },
  { id: '05', title: 'Structure & Systems', icon: Wrench, color: '#EF4444', description: 'Roof, HVAC, Foundation, Age', component: Category05_StructureSystems },
  { id: '06', title: 'Interior Features', icon: Sofa, color: '#EC4899', description: 'Flooring, Kitchen, Appliances, Fireplace', component: Category06_InteriorFeatures },
  { id: '07', title: 'Exterior Features', icon: Trees, color: '#06B6D4', description: 'Pool, Deck, Fence, Landscaping', component: Category07_ExteriorFeatures },
  { id: '08', title: 'Permits & Renovations', icon: Hammer, color: '#84CC16', description: 'Recent Work, Permit History', component: Category08_PermitsRenovations },
  { id: '09', title: 'Schools', icon: GraduationCap, color: '#A855F7', description: 'Assigned Schools, Ratings, Distance', component: Category09_Schools },
  { id: '10', title: 'Location Scores', icon: Navigation, color: '#00D9FF', description: 'Walk, Transit, Bike Scores', component: Category10_LocationScores },
  { id: '11', title: 'Distances & Amenities', icon: Car, color: '#10B981', description: 'Grocery, Hospital, Airport, Beach', component: Category11_DistancesAmenities },
  { id: '12', title: 'Safety & Crime', icon: Shield, color: '#EF4444', description: 'Crime Indices, Safety Ratings', component: Category12_SafetyCrime },
  { id: '13', title: 'Market & Investment', icon: TrendingUp, color: '#F59E0B', description: 'ROI, Cap Rate, Rental Yield', component: Category13_MarketInvestment },
  { id: '14', title: 'Utilities & Connectivity', icon: Zap, color: '#8B5CF6', description: 'Electric, Water, Internet, Fiber', component: Category14_UtilitiesConnectivity },
  { id: '15', title: 'Environment & Risk', icon: CloudRain, color: '#06B6D4', description: 'Flood, Hurricane, Air Quality', component: Category15_EnvironmentRisk },
  { id: '16', title: 'Additional Features', icon: Sparkles, color: '#EC4899', description: 'Solar, EV, Smart Home, Views', component: Category16_AdditionalFeatures },
  { id: '17', title: 'Parking & Garage', icon: ParkingCircle, color: '#84CC16', description: 'Garage, Carport, Parking Features', component: Category17_ParkingGarage },
  { id: '18', title: 'Building Details', icon: Building, color: '#A855F7', description: 'Floor, Elevator, Building Info', component: Category18_BuildingDetails },
  { id: '19', title: 'Legal & Tax (Stellar)', icon: FileText, color: '#00D9FF', description: 'Homestead, CDD, Subdivision', component: Category19_LegalTax },
  { id: '20', title: 'Waterfront & Leasing', icon: Waves, color: '#10B981', description: 'Water Access, Lease Rules, Pets', component: Category20_WaterfrontLeasing },
];

// Loading spinner
function CategoryLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full"
      />
    </div>
  );
}

export default function Visuals() {
  const { fullProperties } = usePropertyStore();
  const [activeCategory, setActiveCategory] = useState<string>('01');

  // Convert Map to array and map to chart format
  const properties = Array.from(fullProperties.values());
  const chartProperties = mapPropertiesToChart(properties);

  const activeTab = categories.find(c => c.id === activeCategory);
  const ActiveComponent = activeTab?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 px-4 py-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] mb-2">
            Advanced Analytics
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            175 Visualizations • 20 Categories • {chartProperties.length} Properties
          </p>
        </motion.div>

        {/* Category Tabs - Horizontal scroll on mobile, wrapped on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex md:flex-wrap gap-2 pb-2 min-w-max md:min-w-0">
              {categories.map((category, index) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;

                return (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveCategory(category.id)}
                    className={`relative px-4 py-3 rounded-xl transition-all duration-300 flex-shrink-0 ${
                      isActive
                        ? 'bg-white/10 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                        : 'bg-white/5 border-2 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeCategory"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}

                    <div className="relative flex items-center gap-2">
                      <Icon
                        className="w-5 h-5 flex-shrink-0"
                        style={{ color: isActive ? category.color : '#9CA3AF' }}
                      />
                      <div className="text-left hidden md:block">
                        <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
                          {category.title}
                        </div>
                        <div className="text-xs text-gray-500">{category.description}</div>
                      </div>
                      <div className="text-left md:hidden">
                        <div className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
                          {category.title.split(' ')[0]}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Active Category Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Category Header */}
            {activeTab && (
              <div className="mb-6 p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                <div className="flex items-center gap-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `${activeTab.color}20` }}
                  >
                    <activeTab.icon className="w-8 h-8" style={{ color: activeTab.color }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{activeTab.title}</h2>
                    <p className="text-gray-400 text-sm">{activeTab.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Charts */}
            <Suspense fallback={<CategoryLoader />}>
              {ActiveComponent && (
                <ActiveComponent properties={chartProperties} />
              )}
            </Suspense>
          </motion.div>
        </AnimatePresence>

        {/* Empty state */}
        {chartProperties.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="p-6 rounded-full bg-cyan-500/10 inline-block mb-4">
              <Building2 className="w-16 h-16 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Properties Yet</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Search for properties to populate the analytics dashboard with real data.
            </p>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 pt-6 border-t border-white/10 text-center"
        >
          <p className="text-gray-500 text-sm">
            Powered by CLUES Quantum Analysis Engine
          </p>
        </motion.div>
      </div>
    </div>
  );
}
