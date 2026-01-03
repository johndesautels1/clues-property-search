import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Home, Star, TrendingUp, MapPin, DollarSign, Building, Shield, Waves, Car, Users, Zap, TreePine, School, Navigation, BarChart3, FileText, Scale, PawPrint, Sparkles, Wrench } from 'lucide-react';

// Category definitions with all 22 sections and 220 fields
const categories = [
  {
    id: 'addressIdentity',
    name: 'Address & Identity',
    icon: MapPin,
    color: '#3b82f6',
    fields: [
      { id: 'address', name: 'Address', type: 'string', importance: 'CRITICAL' },
      { id: 'city', name: 'City', type: 'string', importance: 'MEDIUM' },
      { id: 'zipCode', name: 'Zip Code', type: 'string', importance: 'MEDIUM' },
      { id: 'subdivision', name: 'Subdivision', type: 'string', importance: 'MEDIUM' },
      { id: 'neighborhoodName', name: 'Neighborhood', type: 'string', importance: 'MEDIUM' },
      { id: 'propertyType', name: 'Property Type', type: 'string', importance: 'MEDIUM' },
      { id: 'mlsNumber', name: 'MLS Number', type: 'string', importance: 'HIGH' },
      { id: 'mlsStatus', name: 'MLS Status', type: 'string', importance: 'HIGH' },
      { id: 'county', name: 'County', type: 'string', importance: 'MEDIUM' },
      { id: 'parcelNumber', name: 'Parcel Number', type: 'string', importance: 'LOW' }
    ]
  },
  {
    id: 'pricingValue',
    name: 'Pricing & Value',
    icon: DollarSign,
    color: '#22c55e',
    fields: [
      { id: 'listPrice', name: 'List Price', type: 'currency', importance: 'CRITICAL' },
      { id: 'pricePerSqft', name: 'Price/Sq Ft', type: 'currency', importance: 'CRITICAL' },
      { id: 'zestimate', name: 'Zestimate', type: 'currency', importance: 'CRITICAL' },
      { id: 'redfinEstimate', name: 'Redfin Estimate', type: 'currency', importance: 'CRITICAL' },
      { id: 'quantariumAvm', name: 'Quantarium AVM', type: 'currency', importance: 'HIGH' },
      { id: 'firstAmericanAvm', name: 'First American AVM', type: 'currency', importance: 'HIGH' },
      { id: 'iceAvm', name: 'ICE AVM', type: 'currency', importance: 'MEDIUM' },
      { id: 'collateralAnalyticsAvm', name: 'Collateral Analytics', type: 'currency', importance: 'MEDIUM' },
      { id: 'averageAvm', name: 'Average AVM', type: 'currency', importance: 'CRITICAL' },
      { id: 'avmVsListPrice', name: 'AVM vs List %', type: 'percentage', importance: 'CRITICAL' },
      { id: 'originalListPrice', name: 'Original List', type: 'currency', importance: 'HIGH' },
      { id: 'priceChangeAmount', name: 'Price Change $', type: 'currency', importance: 'HIGH' },
      { id: 'priceChangePercent', name: 'Price Change %', type: 'percentage', importance: 'HIGH' },
      { id: 'numberOfPriceChanges', name: '# Price Changes', type: 'number', importance: 'MEDIUM' }
    ]
  },
  {
    id: 'propertyBasics',
    name: 'Property Basics',
    icon: Home,
    color: '#8b5cf6',
    fields: [
      { id: 'bedrooms', name: 'Bedrooms', type: 'number', importance: 'HIGH' },
      { id: 'bathroomsFull', name: 'Full Baths', type: 'number', importance: 'HIGH' },
      { id: 'bathroomsHalf', name: 'Half Baths', type: 'number', importance: 'MEDIUM' },
      { id: 'livingAreaSqft', name: 'Living Area', type: 'number', importance: 'CRITICAL', unit: 'sqft' },
      { id: 'lotSizeSqft', name: 'Lot Size', type: 'number', importance: 'HIGH', unit: 'sqft' },
      { id: 'lotSizeAcres', name: 'Lot (Acres)', type: 'number', importance: 'HIGH', unit: 'ac' },
      { id: 'buildingAreaSqft', name: 'Building Area', type: 'number', importance: 'MEDIUM', unit: 'sqft' },
      { id: 'yearBuilt', name: 'Year Built', type: 'number', importance: 'HIGH' },
      { id: 'yearRenovated', name: 'Year Renovated', type: 'number', importance: 'HIGH' },
      { id: 'stories', name: 'Stories', type: 'number', importance: 'MEDIUM' },
      { id: 'daysOnMarket', name: 'Days on Market', type: 'number', importance: 'CRITICAL' },
      { id: 'cumulativeDom', name: 'Cumulative DOM', type: 'number', importance: 'HIGH' }
    ]
  },
  {
    id: 'hoaTaxes',
    name: 'HOA & Taxes',
    icon: FileText,
    color: '#f97316',
    fields: [
      { id: 'hoaFee', name: 'HOA Fee', type: 'currency', importance: 'CRITICAL' },
      { id: 'hoaFrequency', name: 'HOA Frequency', type: 'string', importance: 'MEDIUM' },
      { id: 'hoaIncludes', name: 'HOA Includes', type: 'array', importance: 'HIGH' },
      { id: 'cddFee', name: 'CDD Fee', type: 'currency', importance: 'HIGH' },
      { id: 'specialAssessments', name: 'Special Assess', type: 'currency', importance: 'HIGH' },
      { id: 'currentYearTax', name: 'Current Year Tax', type: 'currency', importance: 'CRITICAL' },
      { id: 'monthlyTaxEstimate', name: 'Monthly Tax Est', type: 'currency', importance: 'CRITICAL' },
      { id: 'taxAssessmentTotal', name: 'Tax Assessment', type: 'currency', importance: 'HIGH' },
      { id: 'taxAssessmentLand', name: 'Land Assessment', type: 'currency', importance: 'HIGH' },
      { id: 'taxAssessmentImprovement', name: 'Improvement', type: 'currency', importance: 'HIGH' },
      { id: 'homesteadExemption', name: 'Homestead', type: 'boolean', importance: 'MEDIUM' },
      { id: 'tax2025', name: '2025 Tax', type: 'currency', importance: 'CRITICAL' },
      { id: 'tax2024', name: '2024 Tax', type: 'currency', importance: 'CRITICAL' },
      { id: 'tax2023', name: '2023 Tax', type: 'currency', importance: 'HIGH' },
      { id: 'taxYoyChange', name: 'Tax YoY %', type: 'percentage', importance: 'HIGH' },
      { id: 'taxAsPercentOfValue', name: 'Tax % of Value', type: 'percentage', importance: 'CRITICAL' }
    ]
  },
  {
    id: 'structureSystems',
    name: 'Structure & Systems',
    icon: Wrench,
    color: '#64748b',
    fields: [
      { id: 'foundationType', name: 'Foundation', type: 'string', importance: 'MEDIUM' },
      { id: 'roofType', name: 'Roof Type', type: 'string', importance: 'MEDIUM' },
      { id: 'roofAge', name: 'Roof Age', type: 'number', importance: 'HIGH', unit: 'yrs' },
      { id: 'exteriorMaterial', name: 'Exterior', type: 'string', importance: 'MEDIUM' },
      { id: 'constructionQuality', name: 'Construction', type: 'string', importance: 'HIGH' },
      { id: 'condition', name: 'Condition', type: 'string', importance: 'HIGH' },
      { id: 'acType', name: 'A/C Type', type: 'string', importance: 'HIGH' },
      { id: 'heatingType', name: 'Heating', type: 'string', importance: 'HIGH' },
      { id: 'waterHeaterType', name: 'Water Heater', type: 'string', importance: 'MEDIUM' },
      { id: 'windowType', name: 'Windows', type: 'string', importance: 'HIGH' },
      { id: 'impactWindows', name: 'Impact Windows', type: 'boolean', importance: 'CRITICAL' },
      { id: 'hurricaneShutters', name: 'Hurricane Shutters', type: 'boolean', importance: 'HIGH' },
      { id: 'electricalPanel', name: 'Electrical', type: 'string', importance: 'MEDIUM' },
      { id: 'plumbingType', name: 'Plumbing', type: 'string', importance: 'MEDIUM' }
    ]
  },
  {
    id: 'interiorFeatures',
    name: 'Interior Features',
    icon: Sparkles,
    color: '#ec4899',
    fields: [
      { id: 'flooringTypes', name: 'Flooring', type: 'array', importance: 'MEDIUM' },
      { id: 'kitchenStyle', name: 'Kitchen Style', type: 'string', importance: 'MEDIUM' },
      { id: 'appliancesIncluded', name: 'Appliances', type: 'array', importance: 'MEDIUM' },
      { id: 'laundryType', name: 'Laundry Type', type: 'string', importance: 'MEDIUM' },
      { id: 'laundryLocation', name: 'Laundry Loc', type: 'string', importance: 'LOW' },
      { id: 'primaryBedroomLocation', name: 'Primary BR Loc', type: 'string', importance: 'MEDIUM' },
      { id: 'walkInCloset', name: 'Walk-in Closet', type: 'boolean', importance: 'MEDIUM' },
      { id: 'pantry', name: 'Pantry', type: 'boolean', importance: 'MEDIUM' },
      { id: 'cathedralCeiling', name: 'Cathedral Ceiling', type: 'boolean', importance: 'MEDIUM' },
      { id: 'ceilingFans', name: 'Ceiling Fans', type: 'number', importance: 'LOW' },
      { id: 'smartHomeFeatures', name: 'Smart Home', type: 'array', importance: 'MEDIUM' },
      { id: 'fireplace', name: 'Fireplace', type: 'boolean', importance: 'MEDIUM' },
      { id: 'fireplaceCount', name: 'Fireplace #', type: 'number', importance: 'LOW' }
    ]
  },
  {
    id: 'exteriorFeatures',
    name: 'Exterior Features',
    icon: TreePine,
    color: '#16a34a',
    fields: [
      { id: 'fencing', name: 'Fencing', type: 'string', importance: 'MEDIUM' },
      { id: 'balconyDeck', name: 'Balcony/Deck', type: 'boolean', importance: 'MEDIUM' },
      { id: 'patio', name: 'Patio', type: 'boolean', importance: 'MEDIUM' },
      { id: 'screened', name: 'Screened Area', type: 'boolean', importance: 'MEDIUM' },
      { id: 'outdoorKitchen', name: 'Outdoor Kitchen', type: 'boolean', importance: 'MEDIUM' },
      { id: 'sprinklerSystem', name: 'Sprinklers', type: 'boolean', importance: 'LOW' },
      { id: 'landscaping', name: 'Landscaping', type: 'string', importance: 'LOW' },
      { id: 'directionFaces', name: 'Faces', type: 'string', importance: 'MEDIUM' }
    ]
  },
  {
    id: 'permitsRenovations',
    name: 'Permits & Renovations',
    icon: FileText,
    color: '#eab308',
    fields: [
      { id: 'newConstruction', name: 'New Construction', type: 'boolean', importance: 'HIGH' },
      { id: 'permitHistory', name: 'Permit History', type: 'array', importance: 'HIGH' },
      { id: 'recentRenovations', name: 'Recent Renos', type: 'array', importance: 'HIGH' },
      { id: 'openPermits', name: 'Open Permits', type: 'boolean', importance: 'CRITICAL' }
    ]
  },
  {
    id: 'assignedSchools',
    name: 'Assigned Schools',
    icon: School,
    color: '#06b6d4',
    fields: [
      { id: 'elementarySchoolName', name: 'Elementary', type: 'string', importance: 'MEDIUM' },
      { id: 'elementaryRating', name: 'Elem Rating', type: 'number', importance: 'CRITICAL' },
      { id: 'elementaryDistance', name: 'Elem Distance', type: 'number', importance: 'MEDIUM', unit: 'mi' },
      { id: 'middleSchoolName', name: 'Middle School', type: 'string', importance: 'MEDIUM' },
      { id: 'middleRating', name: 'Middle Rating', type: 'number', importance: 'CRITICAL' },
      { id: 'middleDistance', name: 'Middle Distance', type: 'number', importance: 'MEDIUM', unit: 'mi' },
      { id: 'highSchoolName', name: 'High School', type: 'string', importance: 'MEDIUM' },
      { id: 'highRating', name: 'High Rating', type: 'number', importance: 'CRITICAL' },
      { id: 'highDistance', name: 'High Distance', type: 'number', importance: 'MEDIUM', unit: 'mi' },
      { id: 'averageSchoolRating', name: 'Avg Rating', type: 'number', importance: 'CRITICAL' }
    ]
  },
  {
    id: 'locationScores',
    name: 'Location Scores',
    icon: BarChart3,
    color: '#a855f7',
    fields: [
      { id: 'walkScore', name: 'Walk Score', type: 'number', importance: 'HIGH' },
      { id: 'bikeScore', name: 'Bike Score', type: 'number', importance: 'MEDIUM' },
      { id: 'transitScore', name: 'Transit Score', type: 'number', importance: 'MEDIUM' },
      { id: 'walkScoreDescription', name: 'Walkability', type: 'string', importance: 'MEDIUM' },
      { id: 'soundScore', name: 'Sound Score', type: 'number', importance: 'MEDIUM' }
    ]
  },
  {
    id: 'distancesAmenities',
    name: 'Distances & Amenities',
    icon: Navigation,
    color: '#0ea5e9',
    fields: [
      { id: 'distanceToBeach', name: 'To Beach', type: 'number', importance: 'CRITICAL', unit: 'mi' },
      { id: 'distanceToDowntown', name: 'To Downtown', type: 'number', importance: 'HIGH', unit: 'mi' },
      { id: 'distanceToAirport', name: 'To Airport', type: 'number', importance: 'HIGH', unit: 'mi' },
      { id: 'distanceToInterstate', name: 'To Interstate', type: 'number', importance: 'HIGH', unit: 'mi' },
      { id: 'distanceToGrocery', name: 'To Grocery', type: 'number', importance: 'MEDIUM', unit: 'mi' },
      { id: 'distanceToHospital', name: 'To Hospital', type: 'number', importance: 'MEDIUM', unit: 'mi' },
      { id: 'nearbyPoiCount', name: 'Nearby POIs', type: 'number', importance: 'MEDIUM' },
      { id: 'restaurantCount1Mi', name: 'Restaurants 1mi', type: 'number', importance: 'MEDIUM' },
      { id: 'parkCount1Mi', name: 'Parks 1mi', type: 'number', importance: 'MEDIUM' },
      { id: 'percentWithinWalkOfPark', name: '% Near Park', type: 'percentage', importance: 'MEDIUM' }
    ]
  },
  {
    id: 'safetyCrime',
    name: 'Safety & Crime',
    icon: Shield,
    color: '#ef4444',
    fields: [
      { id: 'crimeScore', name: 'Crime Score', type: 'number', importance: 'CRITICAL' },
      { id: 'violentCrimeRate', name: 'Violent Crime', type: 'number', importance: 'HIGH' },
      { id: 'propertyCrimeRate', name: 'Property Crime', type: 'number', importance: 'HIGH' },
      { id: 'safeWalkAloneNight', name: 'Safe Walk Night', type: 'percentage', importance: 'HIGH' },
      { id: 'policeResponseTime', name: 'Police Response', type: 'number', importance: 'MEDIUM', unit: 'min' }
    ]
  },
  {
    id: 'marketInvestment',
    name: 'Market & Investment',
    icon: TrendingUp,
    color: '#10b981',
    fields: [
      { id: 'viewsZillow', name: 'Zillow Views', type: 'number', importance: 'HIGH' },
      { id: 'viewsRedfin', name: 'Redfin Views', type: 'number', importance: 'HIGH' },
      { id: 'totalViews', name: 'Total Views', type: 'number', importance: 'CRITICAL' },
      { id: 'savesFavorites', name: 'Saves', type: 'number', importance: 'HIGH' },
      { id: 'marketType', name: 'Market Type', type: 'string', importance: 'CRITICAL' },
      { id: 'avgSaleToListPercent', name: 'Sale/List %', type: 'percentage', importance: 'CRITICAL' },
      { id: 'avgDaysToPending', name: 'Days to Pending', type: 'number', importance: 'HIGH' },
      { id: 'multipleOffersLikelihood', name: 'Multi Offers', type: 'string', importance: 'HIGH' },
      { id: 'neighborhoodMedianPrice', name: 'Nbhd Median', type: 'currency', importance: 'CRITICAL' },
      { id: 'percentAboveBelowMedian', name: '% vs Median', type: 'percentage', importance: 'CRITICAL' },
      { id: 'lastSaleDate', name: 'Last Sale Date', type: 'date', importance: 'HIGH' },
      { id: 'lastSalePrice', name: 'Last Sale Price', type: 'currency', importance: 'CRITICAL' },
      { id: 'appreciationPercent', name: 'Appreciation %', type: 'percentage', importance: 'CRITICAL' },
      { id: 'priceTrend', name: 'Price Trend', type: 'string', importance: 'HIGH' },
      { id: 'rentZestimate', name: 'Rent Zestimate', type: 'currency', importance: 'HIGH' },
      { id: 'priceToRentRatio', name: 'Price/Rent', type: 'number', importance: 'MEDIUM' }
    ]
  },
  {
    id: 'utilitiesConnectivity',
    name: 'Utilities & Connectivity',
    icon: Zap,
    color: '#f59e0b',
    fields: [
      { id: 'monthlyElectricEstimate', name: 'Monthly Electric', type: 'currency', importance: 'HIGH' },
      { id: 'solarSavingsPotential', name: 'Solar Savings', type: 'currency', importance: 'HIGH' },
      { id: 'sunExposureJune', name: 'Sun (June)', type: 'number', importance: 'MEDIUM', unit: 'hrs' },
      { id: 'waterSewerType', name: 'Water/Sewer', type: 'string', importance: 'LOW' },
      { id: 'gasService', name: 'Gas Service', type: 'boolean', importance: 'LOW' },
      { id: 'internetProvidersCount', name: 'Internet ISPs', type: 'number', importance: 'MEDIUM' },
      { id: 'maxInternetSpeed', name: 'Max Speed', type: 'number', importance: 'MEDIUM', unit: 'Mbps' },
      { id: 'estimatedTotalMonthlyUtilities', name: 'Total Utils', type: 'currency', importance: 'HIGH' }
    ]
  },
  {
    id: 'environmentRisk',
    name: 'Environment & Risk',
    icon: Waves,
    color: '#0891b2',
    fields: [
      { id: 'floodFactor', name: 'Flood Factor', type: 'number', importance: 'CRITICAL' },
      { id: 'floodZone', name: 'Flood Zone', type: 'string', importance: 'CRITICAL' },
      { id: 'fireFactor', name: 'Fire Factor', type: 'number', importance: 'MEDIUM' },
      { id: 'heatFactor', name: 'Heat Factor', type: 'number', importance: 'HIGH' },
      { id: 'windFactor', name: 'Wind Factor', type: 'number', importance: 'CRITICAL' },
      { id: 'airQualityFactor', name: 'Air Quality', type: 'number', importance: 'MEDIUM' },
      { id: 'hurricaneDamageHistory', name: 'Hurricane Hx', type: 'string', importance: 'HIGH' },
      { id: 'elevationAboveSeaLevel', name: 'Elevation', type: 'number', importance: 'HIGH', unit: 'ft' },
      { id: 'sinkholeRisk', name: 'Sinkhole Risk', type: 'string', importance: 'HIGH' }
    ]
  },
  {
    id: 'additionalFeatures',
    name: 'Additional Features',
    icon: Star,
    color: '#d946ef',
    fields: [
      { id: 'greenCertified', name: 'Green Certified', type: 'boolean', importance: 'MEDIUM' },
      { id: 'solarPanels', name: 'Solar Panels', type: 'boolean', importance: 'HIGH' },
      { id: 'solarOwned', name: 'Solar Own/Lease', type: 'string', importance: 'HIGH' },
      { id: 'generator', name: 'Generator', type: 'boolean', importance: 'HIGH' },
      { id: 'viewTypes', name: 'Views', type: 'array', importance: 'HIGH' },
      { id: 'comingSoon', name: 'Coming Soon', type: 'boolean', importance: 'MEDIUM' },
      { id: 'elevator', name: 'Elevator', type: 'boolean', importance: 'MEDIUM' },
      { id: 'securitySystem', name: 'Security', type: 'boolean', importance: 'MEDIUM' },
      { id: 'gatedCommunity', name: 'Gated', type: 'boolean', importance: 'HIGH' }
    ]
  },
  {
    id: 'parkingGarage',
    name: 'Parking & Garage',
    icon: Car,
    color: '#6366f1',
    fields: [
      { id: 'garageSpaces', name: 'Garage Spaces', type: 'number', importance: 'HIGH' },
      { id: 'garageType', name: 'Garage Type', type: 'string', importance: 'MEDIUM' },
      { id: 'parkingTotalSpaces', name: 'Total Parking', type: 'number', importance: 'MEDIUM' },
      { id: 'drivewayType', name: 'Driveway', type: 'string', importance: 'LOW' },
      { id: 'coveredParking', name: 'Covered', type: 'boolean', importance: 'MEDIUM' },
      { id: 'rvParking', name: 'RV Parking', type: 'boolean', importance: 'MEDIUM' },
      { id: 'boatParking', name: 'Boat Parking', type: 'boolean', importance: 'HIGH' },
      { id: 'storageUnits', name: 'Storage', type: 'number', importance: 'LOW' }
    ]
  },
  {
    id: 'buildingInfo',
    name: 'Building Info',
    icon: Building,
    color: '#78716c',
    fields: [
      { id: 'buildingName', name: 'Building Name', type: 'string', importance: 'MEDIUM' },
      { id: 'totalUnitsInBuilding', name: 'Total Units', type: 'number', importance: 'MEDIUM' },
      { id: 'floorNumber', name: 'Floor #', type: 'number', importance: 'MEDIUM' },
      { id: 'totalFloors', name: 'Total Floors', type: 'number', importance: 'MEDIUM' },
      { id: 'buildingAmenities', name: 'Amenities', type: 'array', importance: 'HIGH' }
    ]
  },
  {
    id: 'legalTax',
    name: 'Legal & Tax',
    icon: Scale,
    color: '#a1a1aa',
    fields: [
      { id: 'legalDescription', name: 'Legal Desc', type: 'string', importance: 'LOW' },
      { id: 'zoning', name: 'Zoning', type: 'string', importance: 'MEDIUM' },
      { id: 'ownershipType', name: 'Ownership', type: 'string', importance: 'MEDIUM' },
      { id: 'titleStatus', name: 'Title Status', type: 'string', importance: 'HIGH' }
    ]
  },
  {
    id: 'waterfront',
    name: 'Waterfront',
    icon: Waves,
    color: '#14b8a6',
    fields: [
      { id: 'waterfront', name: 'Waterfront', type: 'boolean', importance: 'CRITICAL' },
      { id: 'waterView', name: 'Water View', type: 'boolean', importance: 'HIGH' },
      { id: 'waterfrontFeet', name: 'WF Feet', type: 'number', importance: 'CRITICAL', unit: 'ft' },
      { id: 'waterType', name: 'Water Type', type: 'string', importance: 'HIGH' },
      { id: 'dock', name: 'Dock', type: 'boolean', importance: 'HIGH' },
      { id: 'seawall', name: 'Seawall', type: 'boolean', importance: 'HIGH' },
      { id: 'boatLift', name: 'Boat Lift', type: 'boolean', importance: 'HIGH' },
      { id: 'gulfAccess', name: 'Gulf Access', type: 'boolean', importance: 'CRITICAL' }
    ]
  },
  {
    id: 'leasingPets',
    name: 'Leasing & Pets',
    icon: PawPrint,
    color: '#f472b6',
    fields: [
      { id: 'rentalAllowed', name: 'Rental OK', type: 'boolean', importance: 'HIGH' },
      { id: 'minLeaseLength', name: 'Min Lease', type: 'number', importance: 'MEDIUM', unit: 'mo' },
      { id: 'maxLeasesPerYear', name: 'Max Leases/Yr', type: 'number', importance: 'MEDIUM' },
      { id: 'petsAllowed', name: 'Pets OK', type: 'boolean', importance: 'HIGH' },
      { id: 'petRestrictions', name: 'Pet Rules', type: 'string', importance: 'MEDIUM' },
      { id: 'maxPets', name: 'Max Pets', type: 'number', importance: 'MEDIUM' },
      { id: 'petWeightLimit', name: 'Pet Weight', type: 'number', importance: 'MEDIUM', unit: 'lbs' }
    ]
  },
  {
    id: 'communityFeatures',
    name: 'Community & Features',
    icon: Users,
    color: '#2563eb',
    fields: [
      { id: 'avgHouseholdIncome', name: 'Avg Income', type: 'currency', importance: 'HIGH' },
      { id: 'medianAge', name: 'Median Age', type: 'number', importance: 'MEDIUM' },
      { id: 'percentCollegeGrads', name: '% College', type: 'percentage', importance: 'MEDIUM' },
      { id: 'percentRenters', name: '% Renters', type: 'percentage', importance: 'HIGH' },
      { id: 'populationDensity', name: 'Pop Density', type: 'number', importance: 'MEDIUM' },
      { id: 'pool', name: 'Pool', type: 'boolean', importance: 'HIGH' },
      { id: 'poolType', name: 'Pool Type', type: 'string', importance: 'MEDIUM' },
      { id: 'poolHeated', name: 'Pool Heated', type: 'boolean', importance: 'MEDIUM' },
      { id: 'poolScreen', name: 'Pool Screen', type: 'boolean', importance: 'MEDIUM' },
      { id: 'spa', name: 'Spa', type: 'boolean', importance: 'MEDIUM' },
      { id: 'communityPool', name: 'Comm Pool', type: 'boolean', importance: 'MEDIUM' },
      { id: 'communityGym', name: 'Comm Gym', type: 'boolean', importance: 'MEDIUM' },
      { id: 'tennisCourtsCommunity', name: 'Tennis', type: 'boolean', importance: 'LOW' },
      { id: 'golfCommunity', name: 'Golf', type: 'boolean', importance: 'MEDIUM' },
      { id: 'clubhouse', name: 'Clubhouse', type: 'boolean', importance: 'MEDIUM' }
    ]
  }
];

// Importance colors
const importanceColors = {
  CRITICAL: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', dot: '#ef4444' },
  HIGH: { bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.3)', dot: '#f97316' },
  MEDIUM: { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.25)', dot: '#eab308' },
  LOW: { bg: 'rgba(107, 114, 128, 0.08)', border: 'rgba(107, 114, 128, 0.2)', dot: '#6b7280' }
};

// SMART Score component
const SmartScore = ({ score, label, isSubject }) => {
  const getColor = (s) => {
    if (s >= 80) return '#22c55e';
    if (s >= 60) return '#84cc16';
    if (s >= 40) return '#eab308';
    if (s >= 20) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className={`relative flex flex-col items-center p-4 rounded-xl ${isSubject ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-white/[0.02] border border-white/[0.06]'}`}
         style={{ backdropFilter: 'blur(12px)', minWidth: '100px' }}>
      <span className="text-[10px] uppercase tracking-wider text-white/40 mb-2">{label}</span>
      {score !== null ? (
        <>
          <span className="text-3xl font-bold" style={{ color: getColor(score), textShadow: `0 0 20px ${getColor(score)}40` }}>
            {score}
          </span>
          <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" 
                 style={{ width: `${score}%`, background: `linear-gradient(90deg, ${getColor(score)}60, ${getColor(score)})` }} />
          </div>
        </>
      ) : (
        <span className="text-2xl text-white/20">—</span>
      )}
    </div>
  );
};

// Category section component
const CategorySection = ({ category, isExpanded, onToggle }) => {
  const Icon = category.icon;
  const [hoveredField, setHoveredField] = useState(null);

  return (
    <div className="mb-2">
      {/* Category Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 group"
        style={{
          background: isExpanded 
            ? `linear-gradient(135deg, ${category.color}15 0%, ${category.color}05 100%)`
            : 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(12px)',
          border: isExpanded 
            ? `1px solid ${category.color}40`
            : '1px solid rgba(255,255,255,0.06)',
          boxShadow: isExpanded 
            ? `0 0 30px ${category.color}10, inset 0 1px 0 rgba(255,255,255,0.05)`
            : 'inset 0 1px 0 rgba(255,255,255,0.03)'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: `${category.color}20` }}>
            <Icon size={18} style={{ color: category.color }} />
          </div>
          <span className="text-white/90 font-medium text-sm">{category.name}</span>
          <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
            {category.fields.length}
          </span>
        </div>
        <div className="text-white/40 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
          <ChevronDown size={18} />
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div 
          className="mt-1 rounded-xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.01)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.04)',
            animation: 'slideDown 0.3s ease'
          }}
        >
          {/* Column Headers */}
          <div className="grid grid-cols-5 gap-2 p-3 border-b border-white/5">
            <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold pl-2">Field</div>
            <div className="text-[10px] uppercase tracking-wider text-blue-400/80 font-semibold flex items-center gap-1">
              <Home size={10} /> Subject
            </div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Comp 1</div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Comp 2</div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Comp 3</div>
          </div>

          {/* Field Rows */}
          <div className="p-2">
            {category.fields.map((field, idx) => {
              const imp = importanceColors[field.importance];
              return (
                <div
                  key={field.id}
                  className="grid grid-cols-5 gap-2 py-2 px-2 rounded-lg transition-all duration-200"
                  style={{
                    background: hoveredField === field.id ? 'rgba(255,255,255,0.03)' : 'transparent'
                  }}
                  onMouseEnter={() => setHoveredField(field.id)}
                  onMouseLeave={() => setHoveredField(null)}
                >
                  {/* Field Name */}
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                          style={{ background: imp.dot, boxShadow: `0 0 6px ${imp.dot}` }} />
                    <span className="text-xs text-white/60 truncate">{field.name}</span>
                  </div>

                  {/* Subject */}
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-md px-2 py-1">
                    <span className="text-xs text-white/30 italic">—</span>
                  </div>

                  {/* Comps */}
                  {[1, 2, 3].map(n => (
                    <div key={n} className="bg-white/[0.02] border border-white/[0.04] rounded-md px-2 py-1 flex items-center justify-between">
                      <span className="text-xs text-white/30 italic">—</span>
                      <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[9px] text-white/20">—</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Main component
export default function OliviaCMA() {
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandAll, setExpandAll] = useState(false);

  const toggleCategory = (id) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (expandAll) {
      setExpandedCategories(new Set());
    } else {
      setExpandedCategories(new Set(categories.map(c => c.id)));
    }
    setExpandAll(!expandAll);
  };

  const totalFields = categories.reduce((sum, c) => sum + c.fields.length, 0);

  return (
    <div className="min-h-screen p-5" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)' }}>
      {/* Header */}
      <div 
        className="rounded-2xl p-6 mb-6"
        style={{
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
        }}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                OLIVIA CMA
              </span>
              <span className="text-xs text-white/30 font-normal ml-3 bg-white/5 px-2 py-1 rounded">
                SMART Score™ Analysis
              </span>
            </h1>
            <p className="text-white/40 text-sm">
              {categories.length} Categories • {totalFields} Fields • 1 Subject + 3 Comparables
            </p>
          </div>
          <button
            onClick={toggleAll}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 transition-all hover:text-white/90"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {expandAll ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {/* SMART Scores */}
        <div className="flex gap-4 pt-4 border-t border-white/5">
          <SmartScore score={null} label="Subject" isSubject={true} />
          <SmartScore score={null} label="Comp 1" isSubject={false} />
          <SmartScore score={null} label="Comp 2" isSubject={false} />
          <SmartScore score={null} label="Comp 3" isSubject={false} />
        </div>
      </div>

      {/* Property Headers */}
      <div className="grid grid-cols-5 gap-3 mb-4 px-2">
        <div />
        <div 
          className="rounded-xl p-4 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.02) 100%)',
            border: '1px solid rgba(59,130,246,0.25)',
            boxShadow: '0 0 30px rgba(59,130,246,0.08)'
          }}
        >
          <div className="text-[10px] uppercase tracking-wider text-blue-400/70 mb-1">Subject Property</div>
          <div className="text-xs text-white/30 italic">Enter address...</div>
        </div>
        {[1, 2, 3].map(n => (
          <div 
            key={n}
            className="rounded-xl p-4 text-center"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Comparable {n}</div>
            <div className="text-xs text-white/25 italic">Enter address...</div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {categories.map(category => (
          <CategorySection
            key={category.id}
            category={category}
            isExpanded={expandedCategories.has(category.id)}
            onToggle={() => toggleCategory(category.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div 
        className="mt-6 rounded-xl p-4 flex justify-between items-center"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <span className="text-xs text-white/30">John E. Desautels & Associates • OLIVIA CMA v1.0</span>
        <div className="flex gap-2">
          {Object.entries(importanceColors).map(([key, val]) => (
            <span key={key} className="text-[9px] font-semibold px-2 py-1 rounded" style={{ background: val.bg, color: val.dot }}>
              ● {key}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
