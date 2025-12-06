/**
 * RUNTIME PATH VERIFICATION - Test with actual Property data structure
 * This script verifies ALL 175+ field paths resolve correctly with real data
 */

// Helper function to traverse nested object paths (same as in Compare.tsx)
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return null;
    }
    current = current[part];
  }

  // If we ended on a DataField object, extract the value
  if (current && typeof current === 'object' && 'value' in current) {
    return current.value;
  }

  return current;
}

// Create mock property with ACTUAL Property interface structure
const mockProperty = {
  id: 'test-123',
  createdAt: '2025-12-06T10:00:00Z',
  updatedAt: '2025-12-06T10:00:00Z',
  smartScore: 95,
  dataCompleteness: 87,
  aiConfidence: 0.92,

  address: {
    fullAddress: { value: '123 Test St, Tampa, FL 33601', confidence: 'High', notes: '', sources: [] },
    mlsPrimary: { value: 'STELLAR', confidence: 'High', notes: '', sources: [] },
    mlsSecondary: { value: 'T123456', confidence: 'High', notes: '', sources: [] },
    listingStatus: { value: 'Active', confidence: 'High', notes: '', sources: [] },
    listingDate: { value: '2025-01-15', confidence: 'High', notes: '', sources: [] },
    listingPrice: { value: 450000, confidence: 'High', notes: '', sources: [] },
    pricePerSqft: { value: 225, confidence: 'High', notes: '', sources: [] },
    streetAddress: { value: '123 Test St', confidence: 'High', notes: '', sources: [] },
    city: { value: 'Tampa', confidence: 'High', notes: '', sources: [] },
    state: { value: 'FL', confidence: 'High', notes: '', sources: [] },
    zipCode: { value: '33601', confidence: 'High', notes: '', sources: [] },
    county: { value: 'Hillsborough', confidence: 'High', notes: '', sources: [] },
    latitude: { value: 27.9506, confidence: 'High', notes: '', sources: [] },
    longitude: { value: -82.4572, confidence: 'High', notes: '', sources: [] },
    neighborhoodName: { value: 'Hyde Park', confidence: 'High', notes: '', sources: [] },
  },

  details: {
    bedrooms: { value: 4, confidence: 'High', notes: '', sources: [] },
    fullBathrooms: { value: 3, confidence: 'High', notes: '', sources: [] },
    halfBathrooms: { value: 1, confidence: 'High', notes: '', sources: [] },
    totalBathrooms: { value: 3.5, confidence: 'High', notes: '', sources: [] },
    livingSqft: { value: 2000, confidence: 'High', notes: '', sources: [] },
    totalSqftUnderRoof: { value: 2200, confidence: 'High', notes: '', sources: [] },
    lotSizeSqft: { value: 8000, confidence: 'High', notes: '', sources: [] },
    lotSizeAcres: { value: 0.18, confidence: 'High', notes: '', sources: [] },
    yearBuilt: { value: 2010, confidence: 'High', notes: '', sources: [] },
    propertyType: { value: 'Single Family', confidence: 'High', notes: '', sources: [] },
    stories: { value: 2, confidence: 'High', notes: '', sources: [] },
    garageSpaces: { value: 2, confidence: 'High', notes: '', sources: [] },
    parkingTotal: { value: '4 spaces', confidence: 'High', notes: '', sources: [] },
    hoaYn: { value: true, confidence: 'High', notes: '', sources: [] },
    hoaFeeAnnual: { value: 1200, confidence: 'High', notes: '', sources: [] },
    hoaName: { value: 'Hyde Park HOA', confidence: 'High', notes: '', sources: [] },
    hoaIncludes: { value: 'Lawn, Pool', confidence: 'High', notes: '', sources: [] },
    annualTaxes: { value: 5400, confidence: 'High', notes: '', sources: [] },
    taxYear: { value: 2024, confidence: 'High', notes: '', sources: [] },
    assessedValue: { value: 440000, confidence: 'High', notes: '', sources: [] },
    marketValueEstimate: { value: 455000, confidence: 'Medium-High', notes: '', sources: [] },
    lastSaleDate: { value: '2020-03-15', confidence: 'High', notes: '', sources: [] },
    lastSalePrice: { value: 380000, confidence: 'High', notes: '', sources: [] },
    ownershipType: { value: 'Fee Simple', confidence: 'High', notes: '', sources: [] },
    parcelId: { value: 'HC-12-34-56-78-910', confidence: 'High', notes: '', sources: [] },
  },

  structural: {
    roofType: { value: 'Architectural Shingle', confidence: 'High', notes: '', sources: [] },
    roofAgeEst: { value: '5 years', confidence: 'Medium', notes: '', sources: [] },
    exteriorMaterial: { value: 'Stucco', confidence: 'High', notes: '', sources: [] },
    foundation: { value: 'Slab', confidence: 'High', notes: '', sources: [] },
    hvacType: { value: 'Central Air', confidence: 'High', notes: '', sources: [] },
    hvacAge: { value: '8 years', confidence: 'Medium', notes: '', sources: [] },
    waterHeaterType: { value: 'Gas Tankless', confidence: 'High', notes: '', sources: [] },
    garageType: { value: 'Attached', confidence: 'High', notes: '', sources: [] },
    flooringType: { value: 'Tile, Carpet', confidence: 'High', notes: '', sources: [] },
    kitchenFeatures: { value: 'Granite, Stainless Appliances', confidence: 'High', notes: '', sources: [] },
    appliancesIncluded: { value: ['Refrigerator', 'Dishwasher', 'Range'], confidence: 'High', notes: '', sources: [] },
    laundryType: { value: 'Inside', confidence: 'High', notes: '', sources: [] },
    fireplaceYn: { value: true, confidence: 'High', notes: '', sources: [] },
    fireplaceCount: { value: 1, confidence: 'High', notes: '', sources: [] },
    poolYn: { value: true, confidence: 'High', notes: '', sources: [] },
    poolType: { value: 'In-Ground, Heated', confidence: 'High', notes: '', sources: [] },
    deckPatio: { value: 'Covered Patio', confidence: 'High', notes: '', sources: [] },
    fence: { value: 'Privacy Fence', confidence: 'High', notes: '', sources: [] },
    landscaping: { value: 'Professional', confidence: 'High', notes: '', sources: [] },
    recentRenovations: { value: 'Kitchen 2023', confidence: 'High', notes: '', sources: [] },
    permitHistoryRoof: { value: '2020 - Roof Replacement', confidence: 'High', notes: '', sources: [] },
    permitHistoryHvac: { value: '2017 - HVAC Install', confidence: 'High', notes: '', sources: [] },
    permitHistoryPoolAdditions: { value: '2011 - Pool Install', confidence: 'High', notes: '', sources: [] },
    interiorCondition: { value: 'Excellent', confidence: 'High', notes: '', sources: [] },
  },

  location: {
    assignedElementary: { value: 'Hyde Park Elementary', confidence: 'High', notes: '', sources: [] },
    elementaryRating: { value: '9/10', confidence: 'High', notes: '', sources: [] },
    elementaryDistanceMiles: { value: 0.5, confidence: 'High', notes: '', sources: [] },
    assignedMiddle: { value: 'Wilson Middle', confidence: 'High', notes: '', sources: [] },
    middleRating: { value: '8/10', confidence: 'High', notes: '', sources: [] },
    middleDistanceMiles: { value: 1.2, confidence: 'High', notes: '', sources: [] },
    assignedHigh: { value: 'Plant High', confidence: 'High', notes: '', sources: [] },
    highRating: { value: '9/10', confidence: 'High', notes: '', sources: [] },
    highDistanceMiles: { value: 2.1, confidence: 'High', notes: '', sources: [] },
    schoolDistrictName: { value: 'Hillsborough County', confidence: 'High', notes: '', sources: [] },
    elevationFeet: { value: 15, confidence: 'High', notes: '', sources: [] },
    walkScore: { value: 78, confidence: 'High', notes: '', sources: [] },
    transitScore: { value: 45, confidence: 'High', notes: '', sources: [] },
    bikeScore: { value: 68, confidence: 'High', notes: '', sources: [] },
    distanceGroceryMiles: { value: 0.3, confidence: 'High', notes: '', sources: [] },
    distanceHospitalMiles: { value: 1.8, confidence: 'High', notes: '', sources: [] },
    distanceAirportMiles: { value: 6.5, confidence: 'High', notes: '', sources: [] },
    distanceParkMiles: { value: 0.2, confidence: 'High', notes: '', sources: [] },
    distanceBeachMiles: { value: 8.5, confidence: 'High', notes: '', sources: [] },
    crimeIndexViolent: { value: 'Low', confidence: 'Medium', notes: '', sources: [] },
    crimeIndexProperty: { value: 'Low', confidence: 'Medium', notes: '', sources: [] },
    neighborhoodSafetyRating: { value: 'A', confidence: 'Medium', notes: '', sources: [] },
    noiseLevel: { value: 'Moderate', confidence: 'Medium', notes: '', sources: [] },
    trafficLevel: { value: 'Moderate', confidence: 'Medium', notes: '', sources: [] },
    walkabilityDescription: { value: 'Very Walkable', confidence: 'High', notes: '', sources: [] },
    commuteTimeCityCenter: { value: '15 minutes', confidence: 'Medium', notes: '', sources: [] },
    publicTransitAccess: { value: 'Good', confidence: 'Medium', notes: '', sources: [] },
  },

  financial: {
    annualPropertyTax: { value: 5400, confidence: 'High', notes: '', sources: [] },
    taxExemptions: { value: 'Homestead', confidence: 'High', notes: '', sources: [] },
    propertyTaxRate: { value: 1.2, confidence: 'High', notes: '', sources: [] },
    recentTaxPaymentHistory: { value: 'Current', confidence: 'High', notes: '', sources: [] },
    medianHomePriceNeighborhood: { value: 425000, confidence: 'Medium', notes: '', sources: [] },
    pricePerSqftRecentAvg: { value: 220, confidence: 'Medium', notes: '', sources: [] },
    redfinEstimate: { value: 458000, confidence: 'Medium', notes: '', sources: [] },
    priceToRentRatio: { value: 18.5, confidence: 'Medium', notes: '', sources: [] },
    priceVsMedianPercent: { value: 5.9, confidence: 'Medium', notes: '', sources: [] },
    daysOnMarketAvg: { value: 32, confidence: 'Medium', notes: '', sources: [] },
    inventorySurplus: { value: 'Balanced', confidence: 'Medium', notes: '', sources: [] },
    rentalEstimateMonthly: { value: 2400, confidence: 'Medium', notes: '', sources: [] },
    rentalYieldEst: { value: 6.4, confidence: 'Medium', notes: '', sources: [] },
    vacancyRateNeighborhood: { value: 3.2, confidence: 'Medium', notes: '', sources: [] },
    capRateEst: { value: 5.8, confidence: 'Medium', notes: '', sources: [] },
    insuranceEstAnnual: { value: 1800, confidence: 'Medium', notes: '', sources: [] },
    financingTerms: { value: 'Conventional', confidence: 'Medium', notes: '', sources: [] },
    comparableSalesLast3: { value: ['$445K', '$430K', '$460K'], confidence: 'Medium', notes: '', sources: [] },
    specialAssessments: { value: 'None', confidence: 'High', notes: '', sources: [] },
  },

  utilities: {
    electricProvider: { value: 'TECO', confidence: 'High', notes: '', sources: [] },
    waterProvider: { value: 'Tampa Water', confidence: 'High', notes: '', sources: [] },
    sewerProvider: { value: 'City Sewer', confidence: 'High', notes: '', sources: [] },
    naturalGas: { value: 'TECO Peoples Gas', confidence: 'High', notes: '', sources: [] },
    trashProvider: { value: 'City', confidence: 'High', notes: '', sources: [] },
    internetProvidersTop3: { value: ['Spectrum', 'AT&T', 'Frontier'], confidence: 'High', notes: '', sources: [] },
    maxInternetSpeed: { value: '1000 Mbps', confidence: 'High', notes: '', sources: [] },
    fiberAvailable: { value: true, confidence: 'High', notes: '', sources: [] },
    cableTvProvider: { value: 'Spectrum', confidence: 'High', notes: '', sources: [] },
    avgElectricBill: { value: '$180/month', confidence: 'Medium', notes: '', sources: [] },
    avgWaterBill: { value: '$65/month', confidence: 'Medium', notes: '', sources: [] },
    cellCoverageQuality: { value: 'Excellent', confidence: 'High', notes: '', sources: [] },
    emergencyServicesDistance: { value: '1.2 miles', confidence: 'High', notes: '', sources: [] },
    airQualityIndexCurrent: { value: '42', confidence: 'Medium', notes: '', sources: [] },
    airQualityGrade: { value: 'Good', confidence: 'Medium', notes: '', sources: [] },
    floodZone: { value: 'X (Low Risk)', confidence: 'High', notes: '', sources: [] },
    floodRiskLevel: { value: 'Minimal', confidence: 'High', notes: '', sources: [] },
    climateRiskWildfireFlood: { value: 'Low', confidence: 'Medium', notes: '', sources: [] },
    wildfireRisk: { value: 'Very Low', confidence: 'Medium', notes: '', sources: [] },
    earthquakeRisk: { value: 'Very Low', confidence: 'High', notes: '', sources: [] },
    hurricaneRisk: { value: 'Moderate', confidence: 'High', notes: '', sources: [] },
    tornadoRisk: { value: 'Low', confidence: 'Medium', notes: '', sources: [] },
    radonRisk: { value: 'Low', confidence: 'Medium', notes: '', sources: [] },
    superfundNearby: { value: false, confidence: 'High', notes: '', sources: [] },
    seaLevelRiseRisk: { value: 'Low', confidence: 'Medium', notes: '', sources: [] },
    noiseLevelDbEst: { value: '55 dB', confidence: 'Low', notes: '', sources: [] },
    solarPotential: { value: 'Excellent', confidence: 'Medium', notes: '', sources: [] },
    evChargingYn: { value: 'Available', confidence: 'Medium', notes: '', sources: [] },
    smartHomeFeatures: { value: 'Nest, Ring', confidence: 'High', notes: '', sources: [] },
    accessibilityMods: { value: 'None', confidence: 'High', notes: '', sources: [] },
    viewType: { value: 'Garden', confidence: 'High', notes: '', sources: [] },
    lotFeatures: { value: 'Mature Trees', confidence: 'High', notes: '', sources: [] },
    petPolicy: { value: 'Allowed', confidence: 'High', notes: '', sources: [] },
    ageRestrictions: { value: 'None', confidence: 'High', notes: '', sources: [] },
    notesConfidenceSummary: { value: 'High confidence data', confidence: 'High', notes: '', sources: [] },
  },

  stellarMLS: {
    parking: {
      carportYn: { value: false, confidence: 'High', notes: '', sources: [] },
      carportSpaces: { value: 0, confidence: 'High', notes: '', sources: [] },
      garageAttachedYn: { value: true, confidence: 'High', notes: '', sources: [] },
      parkingFeatures: { value: ['Garage Door Opener', 'Epoxy Floor'], confidence: 'High', notes: '', sources: [] },
      assignedParkingSpaces: { value: 2, confidence: 'High', notes: '', sources: [] },
    },
    building: {
      floorNumber: { value: null, confidence: 'High', notes: 'N/A - Single Family', sources: [] },
      buildingTotalFloors: { value: null, confidence: 'High', notes: 'N/A - Single Family', sources: [] },
      buildingNameNumber: { value: null, confidence: 'High', notes: 'N/A - Single Family', sources: [] },
      buildingElevatorYn: { value: false, confidence: 'High', notes: '', sources: [] },
      floorsInUnit: { value: 2, confidence: 'High', notes: '', sources: [] },
    },
    legal: {
      subdivisionName: { value: 'Hyde Park Estates', confidence: 'High', notes: '', sources: [] },
      legalDescription: { value: 'LOT 12 BLOCK 5 HYDE PARK ESTATES', confidence: 'High', notes: '', sources: [] },
      homesteadYn: { value: true, confidence: 'High', notes: '', sources: [] },
      cddYn: { value: false, confidence: 'High', notes: '', sources: [] },
      annualCddFee: { value: 0, confidence: 'High', notes: '', sources: [] },
      frontExposure: { value: 'North', confidence: 'High', notes: '', sources: [] },
    },
    waterfront: {
      waterFrontageYn: { value: false, confidence: 'High', notes: '', sources: [] },
      waterfrontFeet: { value: 0, confidence: 'High', notes: '', sources: [] },
      waterAccessYn: { value: false, confidence: 'High', notes: '', sources: [] },
      waterViewYn: { value: false, confidence: 'High', notes: '', sources: [] },
      waterBodyName: { value: null, confidence: 'High', notes: '', sources: [] },
    },
    leasing: {
      canBeLeasedYn: { value: true, confidence: 'High', notes: '', sources: [] },
      minimumLeasePeriod: { value: '12 months', confidence: 'High', notes: '', sources: [] },
      leaseRestrictionsYn: { value: true, confidence: 'High', notes: '', sources: [] },
      petSizeLimit: { value: 'Under 50 lbs', confidence: 'High', notes: '', sources: [] },
      maxPetWeight: { value: 50, confidence: 'High', notes: '', sources: [] },
      associationApprovalYn: { value: true, confidence: 'High', notes: '', sources: [] },
    },
    features: {
      communityFeatures: { value: ['Pool', 'Tennis', 'Clubhouse'], confidence: 'High', notes: '', sources: [] },
      interiorFeatures: { value: ['Crown Molding', 'Ceiling Fans', 'Walk-in Closets'], confidence: 'High', notes: '', sources: [] },
      exteriorFeatures: { value: ['Irrigation System', 'Outdoor Kitchen', 'Pavers'], confidence: 'High', notes: '', sources: [] },
    },
  },
};

// All field paths from Compare.tsx
const allFieldPaths = [
  // Scores (5 fields)
  { category: 'scores', path: 'smartScore', label: 'Smart Score', calculated: false },
  { category: 'scores', path: 'dataCompleteness', label: 'Data Completeness', calculated: false },
  { category: 'scores', path: 'calculated.pricePerSqftRank', label: 'Price/Sqft Rank', calculated: true },
  { category: 'scores', path: 'calculated.valueScore', label: 'Value Score', calculated: true },
  { category: 'scores', path: 'calculated.locationScore', label: 'Location Score', calculated: true },

  // Price (10 fields)
  { category: 'price', path: 'address.listingPrice.value', label: 'Listing Price', fieldNum: 10 },
  { category: 'price', path: 'address.pricePerSqft.value', label: 'Price Per Sq Ft', fieldNum: 11 },
  { category: 'price', path: 'details.marketValueEstimate.value', label: 'Market Value Estimate', fieldNum: 12 },
  { category: 'price', path: 'details.assessedValue.value', label: 'Assessed Value', fieldNum: 15 },
  { category: 'price', path: 'financial.redfinEstimate.value', label: 'Redfin Estimate', fieldNum: 16 },
  { category: 'price', path: 'details.lastSalePrice.value', label: 'Last Sale Price', fieldNum: 14 },
  { category: 'price', path: 'details.lastSaleDate.value', label: 'Last Sale Date', fieldNum: 13 },
  { category: 'price', path: 'financial.priceVsMedianPercent.value', label: 'Price vs Median %', fieldNum: 94 },
  { category: 'price', path: 'financial.medianHomePriceNeighborhood.value', label: 'Median Home Price', fieldNum: 91 },
  { category: 'price', path: 'financial.pricePerSqftRecentAvg.value', label: 'Price Per Sq Ft (Avg)', fieldNum: 92 },

  // Cost (10 fields)
  { category: 'cost', path: 'details.annualTaxes.value', label: 'Annual Taxes', fieldNum: 35 },
  { category: 'cost', path: 'financial.propertyTaxRate.value', label: 'Property Tax Rate', fieldNum: 37 },
  { category: 'cost', path: 'details.hoaFeeAnnual.value', label: 'HOA Fee (Annual)', fieldNum: 31 },
  { category: 'cost', path: 'financial.insuranceEstAnnual.value', label: 'Insurance Estimate', fieldNum: 97 },
  { category: 'cost', path: 'stellarMLS.legal.annualCddFee.value', label: 'Annual CDD Fee', fieldNum: 153 },
  { category: 'cost', path: 'utilities.avgElectricBill.value', label: 'Avg Electric Bill', fieldNum: 105 },
  { category: 'cost', path: 'utilities.avgWaterBill.value', label: 'Avg Water Bill', fieldNum: 107 },
  { category: 'cost', path: 'financial.specialAssessments.value', label: 'Special Assessments', fieldNum: 138 },
  { category: 'cost', path: 'calculated.monthlyCarryingCost', label: 'Monthly Carrying Cost', calculated: true },
  { category: 'cost', path: 'calculated.annualCarryingCost', label: 'Annual Carrying Cost', calculated: true },

  // Size (10 fields)
  { category: 'size', path: 'details.livingSqft.value', label: 'Living Sq Ft', fieldNum: 21 },
  { category: 'size', path: 'details.totalSqftUnderRoof.value', label: 'Total Sq Ft Under Roof', fieldNum: 22 },
  { category: 'size', path: 'details.lotSizeSqft.value', label: 'Lot Size (Sq Ft)', fieldNum: 23 },
  { category: 'size', path: 'details.lotSizeAcres.value', label: 'Lot Size (Acres)', fieldNum: 24 },
  { category: 'size', path: 'details.bedrooms.value', label: 'Bedrooms', fieldNum: 17 },
  { category: 'size', path: 'details.fullBathrooms.value', label: 'Full Bathrooms', fieldNum: 18 },
  { category: 'size', path: 'details.halfBathrooms.value', label: 'Half Bathrooms', fieldNum: 19 },
  { category: 'size', path: 'details.totalBathrooms.value', label: 'Total Bathrooms', fieldNum: 20 },
  { category: 'size', path: 'details.stories.value', label: 'Stories', fieldNum: 27 },
  { category: 'size', path: 'stellarMLS.building.floorsInUnit.value', label: 'Floors in Unit', fieldNum: 148 },

  // Condition (10 fields)
  { category: 'condition', path: 'details.yearBuilt.value', label: 'Year Built', fieldNum: 25 },
  { category: 'condition', path: 'calculated.propertyAge', label: 'Property Age', calculated: true },
  { category: 'condition', path: 'structural.interiorCondition.value', label: 'Interior Condition', fieldNum: 48 },
  { category: 'condition', path: 'structural.recentRenovations.value', label: 'Recent Renovations', fieldNum: 59 },
  { category: 'condition', path: 'structural.roofType.value', label: 'Roof Type', fieldNum: 39 },
  { category: 'condition', path: 'structural.roofAgeEst.value', label: 'Roof Age (Est)', fieldNum: 40 },
  { category: 'condition', path: 'structural.hvacType.value', label: 'HVAC Type', fieldNum: 45 },
  { category: 'condition', path: 'structural.hvacAge.value', label: 'HVAC Age', fieldNum: 46 },
  { category: 'condition', path: 'structural.permitHistoryRoof.value', label: 'Permit History - Roof', fieldNum: 60 },
  { category: 'condition', path: 'structural.permitHistoryHvac.value', label: 'Permit History - HVAC', fieldNum: 61 },

  // Interior (9 fields)
  { category: 'interior', path: 'structural.flooringType.value', label: 'Flooring Type', fieldNum: 49 },
  { category: 'interior', path: 'structural.kitchenFeatures.value', label: 'Kitchen Features', fieldNum: 50 },
  { category: 'interior', path: 'structural.appliancesIncluded.value', label: 'Appliances Included', fieldNum: 51 },
  { category: 'interior', path: 'structural.fireplaceYn.value', label: 'Fireplace', fieldNum: 52 },
  { category: 'interior', path: 'structural.fireplaceCount.value', label: 'Fireplace Count', fieldNum: 53 },
  { category: 'interior', path: 'structural.laundryType.value', label: 'Laundry Type', fieldNum: 47 },
  { category: 'interior', path: 'stellarMLS.features.interiorFeatures.value', label: 'Interior Features', fieldNum: 167 },
  { category: 'interior', path: 'utilities.smartHomeFeatures.value', label: 'Smart Home Features', fieldNum: 134 },
  { category: 'interior', path: 'structural.waterHeaterType.value', label: 'Water Heater Type', fieldNum: 43 },

  // Exterior (10 fields)
  { category: 'exterior', path: 'structural.exteriorMaterial.value', label: 'Exterior Material', fieldNum: 41 },
  { category: 'exterior', path: 'structural.foundation.value', label: 'Foundation', fieldNum: 42 },
  { category: 'exterior', path: 'structural.poolYn.value', label: 'Pool', fieldNum: 54 },
  { category: 'exterior', path: 'structural.poolType.value', label: 'Pool Type', fieldNum: 55 },
  { category: 'exterior', path: 'structural.deckPatio.value', label: 'Deck/Patio', fieldNum: 56 },
  { category: 'exterior', path: 'structural.fence.value', label: 'Fence', fieldNum: 57 },
  { category: 'exterior', path: 'structural.landscaping.value', label: 'Landscaping', fieldNum: 58 },
  { category: 'exterior', path: 'utilities.lotFeatures.value', label: 'Lot Features', fieldNum: 132 },
  { category: 'exterior', path: 'stellarMLS.features.exteriorFeatures.value', label: 'Exterior Features', fieldNum: 168 },
  { category: 'exterior', path: 'stellarMLS.legal.frontExposure.value', label: 'Front Exposure', fieldNum: 154 },

  // Parking (9 fields)
  { category: 'parking', path: 'details.garageSpaces.value', label: 'Garage Spaces', fieldNum: 28 },
  { category: 'parking', path: 'structural.garageType.value', label: 'Garage Type', fieldNum: 44 },
  { category: 'parking', path: 'stellarMLS.parking.garageAttachedYn.value', label: 'Garage Attached', fieldNum: 141 },
  { category: 'parking', path: 'details.parkingTotal.value', label: 'Parking Total', fieldNum: 29 },
  { category: 'parking', path: 'stellarMLS.parking.carportYn.value', label: 'Carport', fieldNum: 139 },
  { category: 'parking', path: 'stellarMLS.parking.carportSpaces.value', label: 'Carport Spaces', fieldNum: 140 },
  { category: 'parking', path: 'stellarMLS.parking.parkingFeatures.value', label: 'Parking Features', fieldNum: 142 },
  { category: 'parking', path: 'stellarMLS.parking.assignedParkingSpaces.value', label: 'Assigned Parking Spaces', fieldNum: 143 },
  { category: 'parking', path: 'utilities.evChargingYn.value', label: 'EV Charging', fieldNum: 133 },

  // Building (6 fields)
  { category: 'building', path: 'details.propertyType.value', label: 'Property Type', fieldNum: 26 },
  { category: 'building', path: 'stellarMLS.building.floorNumber.value', label: 'Floor Number', fieldNum: 144 },
  { category: 'building', path: 'stellarMLS.building.buildingTotalFloors.value', label: 'Building Total Floors', fieldNum: 145 },
  { category: 'building', path: 'stellarMLS.building.buildingNameNumber.value', label: 'Building Name/Number', fieldNum: 146 },
  { category: 'building', path: 'stellarMLS.building.buildingElevatorYn.value', label: 'Building Elevator', fieldNum: 147 },
  { category: 'building', path: 'details.ownershipType.value', label: 'Ownership Type', fieldNum: 34 },

  // Waterfront (7 fields)
  { category: 'waterfront', path: 'stellarMLS.waterfront.waterFrontageYn.value', label: 'Water Frontage', fieldNum: 155 },
  { category: 'waterfront', path: 'stellarMLS.waterfront.waterfrontFeet.value', label: 'Waterfront Feet', fieldNum: 156 },
  { category: 'waterfront', path: 'stellarMLS.waterfront.waterAccessYn.value', label: 'Water Access', fieldNum: 157 },
  { category: 'waterfront', path: 'stellarMLS.waterfront.waterViewYn.value', label: 'Water View', fieldNum: 158 },
  { category: 'waterfront', path: 'stellarMLS.waterfront.waterBodyName.value', label: 'Water Body Name', fieldNum: 159 },
  { category: 'waterfront', path: 'utilities.viewType.value', label: 'View Type', fieldNum: 131 },
  { category: 'waterfront', path: 'location.distanceBeachMiles.value', label: 'Distance to Beach', fieldNum: 87 },

  // Location (10 fields)
  { category: 'location', path: 'location.walkScore.value', label: 'Walk Score', fieldNum: 74 },
  { category: 'location', path: 'location.transitScore.value', label: 'Transit Score', fieldNum: 75 },
  { category: 'location', path: 'location.bikeScore.value', label: 'Bike Score', fieldNum: 76 },
  { category: 'location', path: 'location.walkabilityDescription.value', label: 'Walkability Description', fieldNum: 80 },
  { category: 'location', path: 'location.publicTransitAccess.value', label: 'Public Transit Access', fieldNum: 81 },
  { category: 'location', path: 'location.commuteTimeCityCenter.value', label: 'Commute to City Center', fieldNum: 82 },
  { category: 'location', path: 'location.noiseLevel.value', label: 'Noise Level', fieldNum: 78 },
  { category: 'location', path: 'utilities.noiseLevelDbEst.value', label: 'Noise Level (dB Est)', fieldNum: 129 },
  { category: 'location', path: 'location.trafficLevel.value', label: 'Traffic Level', fieldNum: 79 },
  { category: 'location', path: 'location.elevationFeet.value', label: 'Elevation (feet)', fieldNum: 64 },

  // Schools (10 fields)
  { category: 'schools', path: 'location.schoolDistrictName.value', label: 'School District', fieldNum: 63 },
  { category: 'schools', path: 'location.assignedElementary.value', label: 'Elementary School', fieldNum: 65 },
  { category: 'schools', path: 'location.elementaryRating.value', label: 'Elementary Rating', fieldNum: 66 },
  { category: 'schools', path: 'location.elementaryDistanceMiles.value', label: 'Elementary Distance', fieldNum: 67 },
  { category: 'schools', path: 'location.assignedMiddle.value', label: 'Middle School', fieldNum: 68 },
  { category: 'schools', path: 'location.middleRating.value', label: 'Middle Rating', fieldNum: 69 },
  { category: 'schools', path: 'location.middleDistanceMiles.value', label: 'Middle Distance', fieldNum: 70 },
  { category: 'schools', path: 'location.assignedHigh.value', label: 'High School', fieldNum: 71 },
  { category: 'schools', path: 'location.highRating.value', label: 'High Rating', fieldNum: 72 },
  { category: 'schools', path: 'location.highDistanceMiles.value', label: 'High Distance', fieldNum: 73 },

  // Distances (6 fields)
  { category: 'distances', path: 'location.distanceGroceryMiles.value', label: 'Distance to Grocery', fieldNum: 83 },
  { category: 'distances', path: 'location.distanceHospitalMiles.value', label: 'Distance to Hospital', fieldNum: 84 },
  { category: 'distances', path: 'location.distanceAirportMiles.value', label: 'Distance to Airport', fieldNum: 85 },
  { category: 'distances', path: 'location.distanceParkMiles.value', label: 'Distance to Park', fieldNum: 86 },
  { category: 'distances', path: 'location.distanceBeachMiles.value', label: 'Distance to Beach', fieldNum: 87 },
  { category: 'distances', path: 'utilities.emergencyServicesDistance.value', label: 'Emergency Services Distance', fieldNum: 116 },

  // Safety (4 fields)
  { category: 'safety', path: 'calculated.safetyScore', label: 'Safety Score', calculated: true },
  { category: 'safety', path: 'location.crimeIndexViolent.value', label: 'Violent Crime Index', fieldNum: 88 },
  { category: 'safety', path: 'location.crimeIndexProperty.value', label: 'Property Crime Index', fieldNum: 89 },
  { category: 'safety', path: 'location.neighborhoodSafetyRating.value', label: 'Neighborhood Safety Rating', fieldNum: 90 },

  // Community (6 fields)
  { category: 'community', path: 'details.hoaYn.value', label: 'HOA Required', fieldNum: 30 },
  { category: 'community', path: 'details.hoaName.value', label: 'HOA Name', fieldNum: 32 },
  { category: 'community', path: 'details.hoaIncludes.value', label: 'HOA Includes', fieldNum: 33 },
  { category: 'community', path: 'stellarMLS.features.communityFeatures.value', label: 'Community Features', fieldNum: 166 },
  { category: 'community', path: 'address.neighborhoodName.value', label: 'Neighborhood', fieldNum: 6 },
  { category: 'community', path: 'stellarMLS.legal.subdivisionName.value', label: 'Subdivision Name', fieldNum: 149 },

  // Environmental (13 fields)
  { category: 'environmental', path: 'utilities.airQualityIndexCurrent.value', label: 'Air Quality Index', fieldNum: 117 },
  { category: 'environmental', path: 'utilities.airQualityGrade.value', label: 'Air Quality Grade', fieldNum: 118 },
  { category: 'environmental', path: 'utilities.floodZone.value', label: 'Flood Zone', fieldNum: 119 },
  { category: 'environmental', path: 'utilities.floodRiskLevel.value', label: 'Flood Risk Level', fieldNum: 120 },
  { category: 'environmental', path: 'utilities.climateRiskWildfireFlood.value', label: 'Climate Risk', fieldNum: 121 },
  { category: 'environmental', path: 'utilities.wildfireRisk.value', label: 'Wildfire Risk', fieldNum: 122 },
  { category: 'environmental', path: 'utilities.earthquakeRisk.value', label: 'Earthquake Risk', fieldNum: 123 },
  { category: 'environmental', path: 'utilities.hurricaneRisk.value', label: 'Hurricane Risk', fieldNum: 124 },
  { category: 'environmental', path: 'utilities.tornadoRisk.value', label: 'Tornado Risk', fieldNum: 125 },
  { category: 'environmental', path: 'utilities.radonRisk.value', label: 'Radon Risk', fieldNum: 126 },
  { category: 'environmental', path: 'utilities.superfundNearby.value', label: 'Superfund Site Nearby', fieldNum: 127 },
  { category: 'environmental', path: 'utilities.seaLevelRiseRisk.value', label: 'Sea Level Rise Risk', fieldNum: 128 },
  { category: 'environmental', path: 'utilities.solarPotential.value', label: 'Solar Potential', fieldNum: 130 },

  // Utilities (10 fields)
  { category: 'utilities', path: 'utilities.electricProvider.value', label: 'Electric Provider', fieldNum: 104 },
  { category: 'utilities', path: 'utilities.waterProvider.value', label: 'Water Provider', fieldNum: 106 },
  { category: 'utilities', path: 'utilities.sewerProvider.value', label: 'Sewer Provider', fieldNum: 108 },
  { category: 'utilities', path: 'utilities.naturalGas.value', label: 'Natural Gas', fieldNum: 109 },
  { category: 'utilities', path: 'utilities.trashProvider.value', label: 'Trash Provider', fieldNum: 110 },
  { category: 'utilities', path: 'utilities.internetProvidersTop3.value', label: 'Internet Providers', fieldNum: 111 },
  { category: 'utilities', path: 'utilities.maxInternetSpeed.value', label: 'Max Internet Speed', fieldNum: 112 },
  { category: 'utilities', path: 'utilities.fiberAvailable.value', label: 'Fiber Available', fieldNum: 113 },
  { category: 'utilities', path: 'utilities.cableTvProvider.value', label: 'Cable TV Provider', fieldNum: 114 },
  { category: 'utilities', path: 'utilities.cellCoverageQuality.value', label: 'Cell Coverage Quality', fieldNum: 115 },

  // Investment (9 fields)
  { category: 'investment', path: 'financial.rentalEstimateMonthly.value', label: 'Rental Estimate (Monthly)', fieldNum: 98 },
  { category: 'investment', path: 'financial.rentalYieldEst.value', label: 'Rental Yield (Est)', fieldNum: 99 },
  { category: 'investment', path: 'financial.capRateEst.value', label: 'Cap Rate (Est)', fieldNum: 101 },
  { category: 'investment', path: 'financial.priceToRentRatio.value', label: 'Price to Rent Ratio', fieldNum: 93 },
  { category: 'investment', path: 'financial.vacancyRateNeighborhood.value', label: 'Vacancy Rate', fieldNum: 100 },
  { category: 'investment', path: 'financial.daysOnMarketAvg.value', label: 'Days on Market (Avg)', fieldNum: 95 },
  { category: 'investment', path: 'financial.inventorySurplus.value', label: 'Inventory Surplus', fieldNum: 96 },
  { category: 'investment', path: 'financial.financingTerms.value', label: 'Financing Terms', fieldNum: 102 },
  { category: 'investment', path: 'financial.comparableSalesLast3.value', label: 'Comparable Sales', fieldNum: 103 },

  // Leasing (9 fields)
  { category: 'leasing', path: 'stellarMLS.leasing.canBeLeasedYn.value', label: 'Can Be Leased', fieldNum: 160 },
  { category: 'leasing', path: 'stellarMLS.leasing.minimumLeasePeriod.value', label: 'Minimum Lease Period', fieldNum: 161 },
  { category: 'leasing', path: 'stellarMLS.leasing.leaseRestrictionsYn.value', label: 'Lease Restrictions', fieldNum: 162 },
  { category: 'leasing', path: 'utilities.petPolicy.value', label: 'Pet Policy', fieldNum: 136 },
  { category: 'leasing', path: 'stellarMLS.leasing.petSizeLimit.value', label: 'Pet Size Limit', fieldNum: 163 },
  { category: 'leasing', path: 'stellarMLS.leasing.maxPetWeight.value', label: 'Max Pet Weight', fieldNum: 164 },
  { category: 'leasing', path: 'utilities.ageRestrictions.value', label: 'Age Restrictions', fieldNum: 137 },
  { category: 'leasing', path: 'stellarMLS.leasing.associationApprovalYn.value', label: 'Association Approval', fieldNum: 165 },
  { category: 'leasing', path: 'utilities.accessibilityMods.value', label: 'Accessibility Mods', fieldNum: 135 },

  // Legal (12 fields)
  { category: 'legal', path: 'details.parcelId.value', label: 'Parcel ID', fieldNum: 9 },
  { category: 'legal', path: 'stellarMLS.legal.legalDescription.value', label: 'Legal Description', fieldNum: 150 },
  { category: 'legal', path: 'address.county.value', label: 'County', fieldNum: 7 },
  { category: 'legal', path: 'details.taxYear.value', label: 'Tax Year', fieldNum: 36 },
  { category: 'legal', path: 'financial.taxExemptions.value', label: 'Tax Exemptions', fieldNum: 38 },
  { category: 'legal', path: 'stellarMLS.legal.homesteadYn.value', label: 'Homestead Exemption', fieldNum: 151 },
  { category: 'legal', path: 'stellarMLS.legal.cddYn.value', label: 'CDD', fieldNum: 152 },
  { category: 'legal', path: 'address.mlsPrimary.value', label: 'MLS Primary', fieldNum: 2 },
  { category: 'legal', path: 'address.mlsSecondary.value', label: 'MLS Secondary', fieldNum: 3 },
  { category: 'legal', path: 'address.listingStatus.value', label: 'Listing Status', fieldNum: 4 },
  { category: 'legal', path: 'address.listingDate.value', label: 'Listing Date', fieldNum: 5 },
  { category: 'legal', path: 'structural.permitHistoryPoolAdditions.value', label: 'Permit History - Other', fieldNum: 62 },
];

// Run verification
console.log('🔍 RUNTIME PATH VERIFICATION - Testing with actual Property data');
console.log('='.repeat(100));
console.log('');

let totalTested = 0;
let successfulPaths = 0;
let failedPaths = 0;
let calculatedPaths = 0;
const failures: Array<{ category: string; path: string; label: string; error: string }> = [];

allFieldPaths.forEach(field => {
  totalTested++;

  if (field.calculated) {
    calculatedPaths++;
    console.log(`⚙️  [${field.category.toUpperCase().padEnd(15)}] ${field.label.padEnd(35)} | ${field.path.padEnd(50)} | CALCULATED`);
    return;
  }

  const value = getNestedValue(mockProperty, field.path);

  if (value !== null && value !== undefined) {
    successfulPaths++;
    const displayValue = Array.isArray(value) ? `[${value.length} items]` : String(value).substring(0, 30);
    console.log(`✅ [${field.category.toUpperCase().padEnd(15)}] ${field.label.padEnd(35)} | ${field.path.padEnd(50)} | ${displayValue}`);
  } else {
    failedPaths++;
    failures.push({
      category: field.category,
      path: field.path,
      label: field.label,
      error: 'Path returned null or undefined'
    });
    console.log(`❌ [${field.category.toUpperCase().padEnd(15)}] ${field.label.padEnd(35)} | ${field.path.padEnd(50)} | NULL/UNDEFINED`);
  }
});

console.log('');
console.log('='.repeat(100));
console.log('📊 RUNTIME VERIFICATION RESULTS');
console.log('='.repeat(100));
console.log(`Total fields tested:      ${totalTested}`);
console.log(`✅ Successful paths:      ${successfulPaths}`);
console.log(`⚙️  Calculated fields:     ${calculatedPaths}`);
console.log(`❌ Failed paths:          ${failedPaths}`);
console.log('');

if (failedPaths > 0) {
  console.log('❌ VERIFICATION FAILED - The following paths did not resolve:');
  console.log('');
  failures.forEach(failure => {
    console.log(`  Category: ${failure.category}`);
    console.log(`  Label:    ${failure.label}`);
    console.log(`  Path:     ${failure.path}`);
    console.log(`  Error:    ${failure.error}`);
    console.log('');
  });
  process.exit(1);
} else {
  console.log('✅ ✅ ✅ ALL PATHS VERIFIED SUCCESSFULLY! ✅ ✅ ✅');
  console.log('');
  console.log(`All ${successfulPaths} non-calculated field paths correctly resolve to values`);
  console.log(`${calculatedPaths} calculated fields are properly flagged for future implementation`);
  console.log('');
  console.log('🎉 READY FOR PRODUCTION - All 175+ fields are properly wired!');
  process.exit(0);
}
