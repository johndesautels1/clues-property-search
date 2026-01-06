/**
 * Visuals Page - Advanced Property Analytics
 * 175 Charts organized into 20 property data categories
 *
 * MOBILE + DESKTOP RESPONSIVE
 * Mega-tab interface with nested category tabs
 * Real data from usePropertyStore → visualsDataMapper → Charts
 */

import { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePropertyStore } from '@/store/propertyStore';
import { mapPropertiesToChart, type ChartProperty } from '@/lib/visualsDataMapper';
import {
  MapPin, DollarSign, Home, Building2, Wrench,
  Sofa, Trees, Hammer, GraduationCap, Navigation,
  Car, Shield, TrendingUp, Zap, CloudRain, Sparkles,
  ParkingCircle, Building, FileText, Waves, ChevronDown, Rocket
} from 'lucide-react';

// Import Property Selector (displayed at top)
import PropertyComparisonSelector from '@/components/visuals/PropertyComparisonSelector';

// Lazy load category components
const Category01_AddressIdentity = lazy(() => import('@/components/visuals/Category01_AddressIdentity'));
const Category02_PricingValue = lazy(() => import('@/components/visuals/Category02_PricingValue'));
const Category03_PropertyBasics = lazy(() => import('@/components/visuals/Category03_PropertyBasics'));
const Category04_HOATaxes = lazy(() => import('@/components/visuals/Category04_HOATaxes'));
const Category05_StructureSystems = lazy(() => import('@/components/visuals/Category05_StructureSystems'));
const Category06_InteriorFeatures = lazy(() => import('@/components/visuals/Category06_Placeholder'));
const Category07_ExteriorFeatures = lazy(() => import('@/components/visuals/Category07_ExteriorFeatures'));
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
const Category21_AdvancedVisuals = lazy(() => import('@/components/visuals/Category21_AdvancedVisuals'));

// Category component props
interface CategoryComponentProps {
  properties: ChartProperty[];
}

// Category metadata
interface Category {
  id: string;
  title: string;
  icon: typeof MapPin;
  color: string;
  description: string;
  component: React.LazyExoticComponent<React.ComponentType<CategoryComponentProps>>;
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
  { id: '21', title: 'Advanced Visuals (DeepSeek)', icon: Rocket, color: '#FF00FF', description: '5 D3.js Charts - Radar, Momentum, Topography', component: Category21_AdvancedVisuals },
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

  // State for 3 selected properties to compare
  const [selectedProperties, setSelectedProperties] = useState<[string | null, string | null, string | null]>([null, null, null]);

  // Convert Map to array and map to chart format
  const properties = Array.from(fullProperties.values());
  const chartProperties = useMemo(() => mapPropertiesToChart(properties), [properties.length]);

  // Sample properties for testing (used when no real properties exist)
  const SAMPLE_PROPERTIES: ChartProperty[] = [
    {
      id: 'sample-1',
      address: '1821 Hillcrest Drive',
      city: 'Tampa',
      state: 'FL',
      zip: '33610',
      county: 'Hillsborough',
      neighborhood: 'Seminole Heights',
      mlsNumber: 'T3520001',
      listingStatus: 'Active',
      listingDate: '2024-01-15',
      listingPrice: 875000,
      pricePerSqft: 292,
      marketValueEstimate: 850000,
      redfinEstimate: 860000,
      assessedValue: 825000,
      lastSalePrice: 650000,
      lastSaleDate: '2020-06-15',
      bedrooms: 4,
      bathrooms: 3,
      fullBathrooms: 3,
      halfBaths: 1,
      livingSqft: 3000,
      totalSqft: 3200,
      lotSizeSqft: 8000,
      lotSizeAcres: 0.18,
      yearBuilt: 1985,
      propertyType: 'Single Family',
      stories: 2,
      garageSpaces: 2,
      parkingTotal: '2',
      hoaYn: false,
      hoaFeeAnnual: 0,
      hoaName: '',
      hoaIncludes: '',
      ownershipType: 'Fee Simple',
      annualTaxes: 35000,
      taxYear: 2024,
      propertyTaxRate: 0.88,
      taxExemptions: '',
      roofType: 'Shingle',
      roofAge: '10 years',
      hvacType: 'Central',
      hvacAge: '5 years',
      exteriorMaterial: 'Brick',
      foundation: 'Slab',
      waterHeaterType: 'Tank',
      laundryType: 'In-unit',
      interiorCondition: 'Excellent',
      flooringType: 'Hardwood',
      kitchenFeatures: 'Granite, Stainless',
      appliancesIncluded: ['Refrigerator', 'Dishwasher', 'Microwave'],
      fireplaceYn: true,
      primaryBrLocation: "Unknown",
      poolYn: false,
      poolType: '',
      deckPatio: 'Covered Patio',
      fence: 'Privacy',
      landscaping: 'Professional',
      recentRenovations: 'Kitchen 2022',
      permitHistoryRoof: 'None',
      permitHistoryHvac: '2019',
      assignedElementary: 'Seminole Elementary',
      elementaryRating: 'A',
      elementaryDistance: 0.5,
      assignedMiddle: 'Madison Middle',
      middleRating: 'A',
      middleDistance: 1.2,
      assignedHigh: 'Hillsborough High',
      highRating: 'B+',
      highDistance: 2.1,
      schoolDistrict: 'Hillsborough County',
      walkScore: 65,
      transitScore: 45,
      bikeScore: 70,
      noiseLevel: 'Moderate',
      trafficLevel: 'Low',
      walkabilityDescription: 'Somewhat Walkable',
      distanceGrocery: 0.8,
      distanceHospital: 2.5,
      distanceAirport: 8.2,
      distancePark: 0.3,
      distanceBeach: 15.5,
      violentCrimeIndex: 'Low',
      propertyCrimeIndex: 'Low',
      neighborhoodSafetyRating: 'A',
      medianHomePriceNeighborhood: 650000,
      pricePerSqftRecentAvg: 280,
      priceToRentRatio: 18,
      rentalEstimateMonthly: 3500,
      rentalYieldEst: 4.8,
      capRateEst: 3.2,
      insuranceEstAnnual: 4500,
      daysOnMarketAvg: 25,
      electricProvider: 'Tampa Electric',
      waterProvider: 'City of Tampa',
      sewerProvider: 'City of Tampa',
      internetProvidersTop3: ['Frontier', 'Spectrum', 'AT&T'],
      maxInternetSpeed: '1 Gbps',
      fiberAvailable: true,
      avgElectricBill: '$180',
      avgWaterBill: '$65',
      airQualityIndex: 'Good',
      airQualityGrade: 'B',
      floodZone: 'X',
      floodRiskLevel: 'Low',
      hurricaneRisk: 'Moderate',
      earthquakeRisk: 'Very Low',
      wildfireRisk: 'Low',
      seaLevelRiseRisk: 'Low',
      solarPotential: 'Excellent',
      evCharging: 'None',
      smartHomeFeatures: 'Nest Thermostat',
      viewType: 'Street',
      lotFeatures: 'Mature Trees',
      petPolicy: 'Allowed',
      carportYn: false,
      carportSpaces: 0,
      garageAttachedYn: true,
      parkingFeatures: ['2-Car Garage'],
      floorNumber: 0,
      buildingTotalFloors: 2,
      buildingElevatorYn: false,
      subdivisionName: 'Seminole Heights Historic',
      homesteadYn: true,
      cddYn: false,
      annualCddFee: 0,
      waterFrontageYn: false,
      waterfrontFeet: 0,
      waterAccessYn: false,
      waterViewYn: false,
      waterBodyName: '',
      canBeLeasedYn: true,
      minimumLeasePeriod: '12 months',
      petSizeLimit: 'No limit',
      communityFeatures: ['Sidewalks', 'Street Lights'],
      interiorFeatures: ['Crown Molding', 'Ceiling Fans'],
      exteriorFeatures: ['Covered Patio', 'Privacy Fence'],
      smartScore: 85,
      dataCompleteness: 92,
    },
    {
      id: 'sample-2',
      address: '1947 Oakwood Avenue',
      city: 'Tampa',
      state: 'FL',
      zip: '33606',
      county: 'Hillsborough',
      neighborhood: 'Hyde Park',
      mlsNumber: 'T3520002',
      listingStatus: 'Active',
      listingDate: '2024-01-20',
      listingPrice: 1250000,
      pricePerSqft: 312,
      marketValueEstimate: 1200000,
      redfinEstimate: 1225000,
      assessedValue: 1180000,
      lastSalePrice: 980000,
      lastSaleDate: '2019-03-10',
      bedrooms: 5,
      bathrooms: 4,
      fullBathrooms: 4,
      halfBaths: 1,
      livingSqft: 4000,
      totalSqft: 4300,
      lotSizeSqft: 10000,
      lotSizeAcres: 0.23,
      yearBuilt: 2010,
      propertyType: 'Single Family',
      stories: 2,
      garageSpaces: 3,
      parkingTotal: '3',
      hoaYn: true,
      hoaFeeAnnual: 1200,
      hoaName: 'Hyde Park HOA',
      hoaIncludes: 'Landscaping, Pool',
      ownershipType: 'Fee Simple',
      annualTaxes: 33000,
      taxYear: 2024,
      propertyTaxRate: 0.85,
      taxExemptions: 'Homestead',
      roofType: 'Tile',
      roofAge: '14 years',
      hvacType: 'Central',
      hvacAge: '3 years',
      exteriorMaterial: 'Stucco',
      foundation: 'Slab',
      waterHeaterType: 'Tankless',
      laundryType: 'In-unit',
      interiorCondition: 'Excellent',
      flooringType: 'Hardwood/Tile',
      kitchenFeatures: 'Granite, Stainless, Island',
      appliancesIncluded: ['Refrigerator', 'Dishwasher', 'Microwave', 'Range'],
      fireplaceYn: true,
      primaryBrLocation: "Unknown",
      poolYn: true,
      poolType: 'In-ground',
      deckPatio: 'Pool Deck',
      fence: 'Privacy',
      landscaping: 'Professional',
      recentRenovations: 'Master Bath 2023',
      permitHistoryRoof: 'None',
      permitHistoryHvac: '2021',
      assignedElementary: 'Gorrie Elementary',
      elementaryRating: 'A+',
      elementaryDistance: 0.4,
      assignedMiddle: 'Wilson Middle',
      middleRating: 'A',
      middleDistance: 1.0,
      assignedHigh: 'Plant High',
      highRating: 'A',
      highDistance: 1.8,
      schoolDistrict: 'Hillsborough County',
      walkScore: 78,
      transitScore: 52,
      bikeScore: 80,
      noiseLevel: 'Low',
      trafficLevel: 'Moderate',
      walkabilityDescription: 'Very Walkable',
      distanceGrocery: 0.4,
      distanceHospital: 1.8,
      distanceAirport: 6.5,
      distancePark: 0.2,
      distanceBeach: 12.0,
      violentCrimeIndex: 'Very Low',
      propertyCrimeIndex: 'Low',
      neighborhoodSafetyRating: 'A+',
      medianHomePriceNeighborhood: 950000,
      pricePerSqftRecentAvg: 305,
      priceToRentRatio: 20,
      rentalEstimateMonthly: 5200,
      rentalYieldEst: 5.0,
      capRateEst: 3.5,
      insuranceEstAnnual: 6000,
      daysOnMarketAvg: 18,
      electricProvider: 'Tampa Electric',
      waterProvider: 'City of Tampa',
      sewerProvider: 'City of Tampa',
      internetProvidersTop3: ['Frontier', 'Spectrum', 'AT&T'],
      maxInternetSpeed: '1 Gbps',
      fiberAvailable: true,
      avgElectricBill: '$220',
      avgWaterBill: '$75',
      airQualityIndex: 'Good',
      airQualityGrade: 'A',
      floodZone: 'X',
      floodRiskLevel: 'Low',
      hurricaneRisk: 'Moderate',
      earthquakeRisk: 'Very Low',
      wildfireRisk: 'Low',
      seaLevelRiseRisk: 'Low',
      solarPotential: 'Excellent',
      evCharging: 'Level 2',
      smartHomeFeatures: 'Full Smart Home',
      viewType: 'Garden',
      lotFeatures: 'Mature Trees, Pool',
      petPolicy: 'Allowed',
      carportYn: false,
      carportSpaces: 0,
      garageAttachedYn: true,
      parkingFeatures: ['3-Car Garage'],
      floorNumber: 0,
      buildingTotalFloors: 2,
      buildingElevatorYn: false,
      subdivisionName: 'Hyde Park',
      homesteadYn: true,
      cddYn: false,
      annualCddFee: 0,
      waterFrontageYn: false,
      waterfrontFeet: 0,
      waterAccessYn: false,
      waterViewYn: false,
      waterBodyName: '',
      canBeLeasedYn: true,
      minimumLeasePeriod: '12 months',
      petSizeLimit: 'No limit',
      communityFeatures: ['Pool', 'Tennis Courts', 'Sidewalks'],
      interiorFeatures: ['Crown Molding', 'Coffered Ceilings', 'Built-ins'],
      exteriorFeatures: ['Pool', 'Summer Kitchen', 'Privacy Fence'],
      smartScore: 92,
      dataCompleteness: 96,
    },
    {
      id: 'sample-3',
      address: '725 Live Oak Street',
      city: 'Tampa',
      state: 'FL',
      zip: '33602',
      county: 'Hillsborough',
      neighborhood: 'Downtown',
      mlsNumber: 'T3520003',
      listingStatus: 'Active',
      listingDate: '2024-02-01',
      listingPrice: 625000,
      pricePerSqft: 357,
      marketValueEstimate: 610000,
      redfinEstimate: 620000,
      assessedValue: 590000,
      lastSalePrice: 450000,
      lastSaleDate: '2018-11-20',
      bedrooms: 2,
      bathrooms: 2,
      fullBathrooms: 2,
      halfBaths: 1,
      livingSqft: 1750,
      totalSqft: 1900,
      lotSizeSqft: 0,
      lotSizeAcres: 0,
      yearBuilt: 2015,
      propertyType: 'Condo',
      stories: 1,
      garageSpaces: 1,
      parkingTotal: '1',
      hoaYn: true,
      hoaFeeAnnual: 600,
      hoaName: 'Downtown Tower HOA',
      hoaIncludes: 'Water, Trash, Gym, Pool',
      ownershipType: 'Condo',
      annualTaxes: 31000,
      taxYear: 2024,
      propertyTaxRate: 0.82,
      taxExemptions: 'None',
      roofType: 'Flat',
      roofAge: '9 years',
      hvacType: 'Central',
      hvacAge: '9 years',
      exteriorMaterial: 'Concrete',
      foundation: 'Concrete',
      waterHeaterType: 'Tankless',
      laundryType: 'In-unit',
      interiorCondition: 'Good',
      flooringType: 'Tile/Carpet',
      kitchenFeatures: 'Granite, Stainless',
      appliancesIncluded: ['Refrigerator', 'Dishwasher', 'Microwave'],
      fireplaceYn: false,
      primaryBrLocation: "Unknown",
      poolYn: false,
      poolType: '',
      deckPatio: 'Balcony',
      fence: 'None',
      landscaping: 'HOA Maintained',
      recentRenovations: 'None',
      permitHistoryRoof: 'None',
      permitHistoryHvac: 'None',
      assignedElementary: 'Mitchell Elementary',
      elementaryRating: 'B',
      elementaryDistance: 1.2,
      assignedMiddle: 'Madison Middle',
      middleRating: 'B+',
      middleDistance: 2.0,
      assignedHigh: 'Blake High',
      highRating: 'B',
      highDistance: 3.5,
      schoolDistrict: 'Hillsborough County',
      walkScore: 95,
      transitScore: 75,
      bikeScore: 92,
      noiseLevel: 'High',
      trafficLevel: 'High',
      walkabilityDescription: "Walker's Paradise",
      distanceGrocery: 0.2,
      distanceHospital: 0.5,
      distanceAirport: 5.0,
      distancePark: 0.3,
      distanceBeach: 18.0,
      violentCrimeIndex: 'Moderate',
      propertyCrimeIndex: 'Moderate',
      neighborhoodSafetyRating: 'B',
      medianHomePriceNeighborhood: 480000,
      pricePerSqftRecentAvg: 340,
      priceToRentRatio: 22,
      rentalEstimateMonthly: 2800,
      rentalYieldEst: 5.4,
      capRateEst: 3.8,
      insuranceEstAnnual: 2200,
      daysOnMarketAvg: 35,
      electricProvider: 'Tampa Electric',
      waterProvider: 'City of Tampa',
      sewerProvider: 'City of Tampa',
      internetProvidersTop3: ['Frontier', 'Spectrum', 'AT&T'],
      maxInternetSpeed: '1 Gbps',
      fiberAvailable: true,
      avgElectricBill: '$95',
      avgWaterBill: 'Included in HOA',
      airQualityIndex: 'Moderate',
      airQualityGrade: 'B',
      floodZone: 'X',
      floodRiskLevel: 'Low',
      hurricaneRisk: 'Moderate',
      earthquakeRisk: 'Very Low',
      wildfireRisk: 'Very Low',
      seaLevelRiseRisk: 'Low',
      solarPotential: 'Limited',
      evCharging: 'Available',
      smartHomeFeatures: 'Basic',
      viewType: 'City',
      lotFeatures: 'None',
      petPolicy: 'Cats Only',
      carportYn: false,
      carportSpaces: 0,
      garageAttachedYn: false,
      parkingFeatures: ['Assigned Parking'],
      floorNumber: 12,
      buildingTotalFloors: 20,
      buildingElevatorYn: true,
      subdivisionName: 'Downtown Tower',
      homesteadYn: false,
      cddYn: false,
      annualCddFee: 0,
      waterFrontageYn: false,
      waterfrontFeet: 0,
      waterAccessYn: false,
      waterViewYn: true,
      waterBodyName: 'Hillsborough River',
      canBeLeasedYn: true,
      minimumLeasePeriod: '6 months',
      petSizeLimit: 'Cats only',
      communityFeatures: ['Pool', 'Gym', 'Concierge'],
      interiorFeatures: ['Open Floor Plan', 'High Ceilings'],
      exteriorFeatures: ['Balcony'],
      smartScore: 78,
      dataCompleteness: 88,
    },
  ];

  // Use sample properties if no real properties exist
  const displayProperties = chartProperties.length > 0 ? chartProperties : SAMPLE_PROPERTIES;

  // Auto-select first 3 properties if none selected and properties exist
  useEffect(() => {
    if (displayProperties.length >= 3 && !selectedProperties[0] && !selectedProperties[1] && !selectedProperties[2]) {
      setSelectedProperties([
        displayProperties[0].id,
        displayProperties[1].id,
        displayProperties[2].id,
      ]);
    } else if (displayProperties.length === 2 && !selectedProperties[0] && !selectedProperties[1]) {
      setSelectedProperties([displayProperties[0].id, displayProperties[1].id, null]);
    } else if (displayProperties.length === 1 && !selectedProperties[0]) {
      setSelectedProperties([displayProperties[0].id, null, null]);
    }
  }, [displayProperties.length]);

  // Handle property selection change
  const handlePropertySelect = (index: 0 | 1 | 2, propertyId: string | null) => {
    const newSelected = [...selectedProperties] as [string | null, string | null, string | null];
    newSelected[index] = propertyId;
    setSelectedProperties(newSelected);
  };

  // Get only the selected properties for charts
  const selectedChartProperties = displayProperties.filter(p =>
    selectedProperties.includes(p.id)
  );

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
          className="mb-6 text-center"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] mb-2">
            Advanced Visuals
          </h1>
        </motion.div>

        {/* Property Comparison Selector - 3 dropdown fields - ALWAYS VISIBLE */}
        <PropertyComparisonSelector
          properties={displayProperties}
          selectedProperties={selectedProperties}
          onPropertySelect={handlePropertySelect}
        />

        {/* Category Tabs - Uniform size, centered content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex md:flex-wrap gap-3 pb-2 min-w-max md:min-w-0 justify-center">
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
                    className={`relative w-[180px] h-[80px] rounded-xl transition-all duration-300 flex-shrink-0 ${
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

                    <div className="relative h-full flex flex-col items-center justify-center gap-2 px-2">
                      <Icon
                        className="w-6 h-6 flex-shrink-0"
                        style={{ color: isActive ? category.color : '#9CA3AF' }}
                      />
                      <div className="text-center">
                        <div className={`text-xs font-semibold leading-tight ${isActive ? 'text-white' : 'text-gray-400'}`}>
                          {category.title}
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
                <ActiveComponent properties={selectedChartProperties} />
              )}
            </Suspense>
          </motion.div>
        </AnimatePresence>

        {/* Empty state */}
        {displayProperties.length === 0 && (
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
