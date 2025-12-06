/**
 * CLUES Property Dashboard - Advanced Comparison Analytics Page
 * Full 138-field comparison with property dropdown selectors
 * Plus 32 hi-tech visual chart comparisons
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Scale, TrendingUp, TrendingDown, Minus,
  ChevronDown, Search, Home, DollarSign, Ruler, Calendar,
  MapPin, Building, Zap, Shield, BarChart3, Eye, RefreshCw,
  AlertTriangle, CheckCircle, Info, PieChart, Table2, Receipt,
  Maximize2, TreePine, Car, Waves, GraduationCap, Navigation,
  Users, CloudRain, FileText
} from 'lucide-react';
import { usePropertyStore } from '@/store/propertyStore';
import type { PropertyCard, Property } from '@/types/property';
import { PropertyComparisonAnalytics, type Property as AnalyticsProperty } from '@/components/analytics';

// View modes for comparison
type CompareViewMode = 'table' | 'visual';

// Helper to extract value from DataField
function getFieldValue<T>(field: any): T | null {
  if (!field) return null;
  if (typeof field === 'object' && 'value' in field) {
    return field.value;
  }
  return field as T;
}

// Convert app Property to analytics Property format
function mapToAnalyticsProperty(cardProp: PropertyCard, fullProp?: Property): AnalyticsProperty {
  // Helper to parse risk levels to 0-10 scale
  const parseRiskLevel = (level: string | null | undefined): number => {
    if (!level) return 5;
    const lower = level.toLowerCase();
    if (lower.includes('very low') || lower.includes('minimal')) return 1;
    if (lower.includes('low')) return 3;
    if (lower.includes('moderate') || lower.includes('medium')) return 5;
    if (lower.includes('high')) return 7;
    if (lower.includes('very high') || lower.includes('severe')) return 9;
    return 5;
  };

  // Helper to parse crime level
  const parseCrimeLevel = (level: string | null | undefined): 'LOW' | 'MOD' | 'HIGH' => {
    if (!level) return 'MOD';
    const lower = level.toLowerCase();
    if (lower.includes('low')) return 'LOW';
    if (lower.includes('high')) return 'HIGH';
    return 'MOD';
  };

  // Get values from full property or use defaults
  const price = cardProp.price || 0;
  const yearBuilt = cardProp.yearBuilt || 2000;
  const currentYear = new Date().getFullYear();
  const propertyAge = currentYear - yearBuilt;

  // Extract values from full property if available
  const walkScore = fullProp ? getFieldValue<number>(fullProp.location?.walkScore) : null;
  const transitScore = fullProp ? getFieldValue<number>(fullProp.location?.transitScore) : null;
  const bikeScore = fullProp ? getFieldValue<number>(fullProp.location?.bikeScore) : null;
  const assessedValue = fullProp ? getFieldValue<number>(fullProp.details?.assessedValue) : null;
  const marketEstimate = fullProp ? getFieldValue<number>(fullProp.details?.marketValueEstimate) : null;
  const rentalEstimate = fullProp ? getFieldValue<number>(fullProp.financial?.rentalEstimateMonthly) : null;
  const capRate = fullProp ? getFieldValue<number>(fullProp.financial?.capRateEst) : null;
  const rentalYield = fullProp ? getFieldValue<number>(fullProp.financial?.rentalYieldEst) : null;
  const annualTaxes = fullProp ? getFieldValue<number>(fullProp.details?.annualTaxes) : null;
  const hoaFees = fullProp ? getFieldValue<number>(fullProp.details?.hoaFeeAnnual) : null;
  const insuranceAnnual = fullProp ? getFieldValue<number>(fullProp.financial?.insuranceEstAnnual) : null;

  // Risk values
  const floodRisk = fullProp ? getFieldValue<string>(fullProp.utilities?.floodRiskLevel) : null;
  const hurricaneRisk = fullProp ? getFieldValue<string>(fullProp.utilities?.hurricaneRisk) : null;
  const wildfireRisk = fullProp ? getFieldValue<string>(fullProp.utilities?.wildfireRisk) : null;
  const earthquakeRisk = fullProp ? getFieldValue<string>(fullProp.utilities?.earthquakeRisk) : null;
  const tornadoRisk = fullProp ? getFieldValue<string>(fullProp.utilities?.tornadoRisk) : null;
  const radonRisk = fullProp ? getFieldValue<string>(fullProp.utilities?.radonRisk) : null;
  const seaLevelRisk = fullProp ? getFieldValue<string>(fullProp.utilities?.seaLevelRiseRisk) : null;
  const crimeViolent = fullProp ? getFieldValue<string>(fullProp.location?.crimeIndexViolent) : null;
  const crimeProperty = fullProp ? getFieldValue<string>(fullProp.location?.crimeIndexProperty) : null;
  const safetyRating = fullProp ? getFieldValue<string>(fullProp.location?.neighborhoodSafetyRating) : null;

  // Calculate some derived values
  const appreciationEst = ((marketEstimate || price) / (assessedValue || price) - 1) * 100;

  return {
    id: cardProp.id,
    address: `${cardProp.address}, ${cardProp.city}`,
    price: price,
    sqft: cardProp.sqft || 2000,
    bedrooms: cardProp.bedrooms || 3,
    bathrooms: cardProp.bathrooms || 2,
    lotSize: fullProp ? getFieldValue<number>(fullProp.details?.lotSizeSqft) || 5000 : 5000,
    yearBuilt: yearBuilt,

    // Valuation
    listPrice: price,
    marketEstimate: marketEstimate || price * 0.95,
    redfinEstimate: fullProp ? getFieldValue<number>(fullProp.financial?.redfinEstimate) || price * 0.92 : price * 0.92,
    assessedValue: assessedValue || price * 0.7,

    // Financial
    appreciation5yr: appreciationEst > 0 ? appreciationEst : 25,
    capRate: capRate || 3.5,
    rentalYield: rentalYield || 2.8,
    priceToRent: rentalEstimate ? Math.round(price / (rentalEstimate * 12)) : 20,
    propertyTax: annualTaxes || Math.round(price * 0.01),
    insurance: insuranceAnnual || Math.round(price * 0.003),
    insuranceBase: insuranceAnnual ? Math.round(insuranceAnnual * 0.5) : Math.round(price * 0.0015),
    insuranceFlood: insuranceAnnual ? Math.round(insuranceAnnual * 0.4) : Math.round(price * 0.001),
    insuranceWind: insuranceAnnual ? Math.round(insuranceAnnual * 0.1) : Math.round(price * 0.0005),
    hoaFees: hoaFees ? Math.round(hoaFees / 12) : 100,
    utilities: 400,
    utilitiesElectric: 220,
    utilitiesWater: 80,
    utilitiesInternet: 100,
    maintenance: 400,
    rentalIncome: rentalEstimate || Math.round(price * 0.005),

    // Pricing History
    pricingHistory: {
      salePriceDate: `${yearBuilt + Math.min(5, propertyAge)} Sale`,
      salePrice: Math.round(price * 0.6),
      assessmentDate: `${currentYear} Assessment`,
      assessmentPrice: assessedValue || Math.round(price * 0.7),
      currentListPrice: price,
      marketEstimatePrice: marketEstimate || Math.round(price * 0.95),
    },

    // ROI Projections (5% annual appreciation estimate)
    roiProjection: {
      today: price,
      year1: Math.round(price * 1.05),
      year2: Math.round(price * 1.10),
      year3: Math.round(price * 1.16),
      year4: Math.round(price * 1.22),
      year5: Math.round(price * 1.28),
      year7: Math.round(price * 1.40),
      year10: Math.round(price * 1.63),
    },

    // Location Scores
    walkScore: walkScore || 50,
    transitScore: transitScore || 35,
    bikeScore: bikeScore || 45,

    // Commute
    commute: {
      cityCenter: 80,
      elementary: 90,
      transitHub: 85,
      emergency: 88,
    },

    // Safety
    safetyScore: safetyRating ? (safetyRating.toLowerCase().includes('safe') ? 75 : 60) : 70,
    violentCrime: parseCrimeLevel(crimeViolent),
    propertyCrime: parseCrimeLevel(crimeProperty),

    // Climate Risks (0-10 scale)
    floodRisk: parseRiskLevel(floodRisk),
    hurricaneRisk: parseRiskLevel(hurricaneRisk),
    seaLevelRisk: parseRiskLevel(seaLevelRisk),
    wildfireRisk: parseRiskLevel(wildfireRisk),
    earthquakeRisk: parseRiskLevel(earthquakeRisk),
    tornadoRisk: parseRiskLevel(tornadoRisk),
    airQualityRisk: 3,
    radonRisk: parseRiskLevel(radonRisk),

    // Environmental Quality
    airQuality: 85,
    solarPotential: 85,
    waterQuality: 90,
    foundationStability: 90,

    // Investment Scores
    investmentScore: {
      financialHealth: cardProp.smartScore || 75,
      locationValue: walkScore ? Math.min(100, Math.round((walkScore + (transitScore || 50)) / 2)) : 75,
      propertyCondition: propertyAge < 10 ? 90 : propertyAge < 20 ? 80 : 70,
      riskProfile: 70,
      marketPosition: 80,
      growthPotential: 78,
    },

    // Market Data
    pricePerSqft: cardProp.pricePerSqft || Math.round(price / (cardProp.sqft || 2000)),
    daysOnMarket: cardProp.daysOnMarket || 10,
    neighborhoodMedianPrice: fullProp ? getFieldValue<number>(fullProp.financial?.medianHomePriceNeighborhood) || price * 0.8 : price * 0.8,
    marketVelocityDays: cardProp.daysOnMarket || 10,

    // Neighborhood Pulse (simulated 5-year trend)
    neighborhoodPulse: {
      year2020: Math.round(price * 0.65),
      year2021: Math.round(price * 0.72),
      year2022: Math.round(price * 0.82),
      year2023: Math.round(price * 0.90),
      year2024: Math.round(price * 0.95),
      year2025: price,
    },

    // Space Distribution
    livingSpace: cardProp.sqft || 2000,
    garageStorage: 350,
    coveredAreas: fullProp ? getFieldValue<number>(fullProp.details?.lotSizeSqft) || 5000 : 5000,

    // Room Distribution (percentages)
    roomDistribution: {
      bedrooms: 33,
      bathrooms: 28,
      livingAreas: 25,
      storage: 14,
    },

    // Schools
    schools: {
      elementaryDistance: 90,
      middleDistance: 40,
      highDistance: 38,
      districtRating: 75,
    },

    // Property Condition
    condition: {
      roof: propertyAge < 15 ? 85 : 70,
      hvac: propertyAge < 10 ? 90 : 75,
      kitchen: propertyAge < 5 ? 95 : 80,
      overall: propertyAge < 10 ? 88 : propertyAge < 20 ? 78 : 68,
    },

    // Luxury Features
    features: {
      pool: fullProp && getFieldValue<boolean>(fullProp.structural?.poolYn) ? 100 : 0,
      deck: fullProp && getFieldValue<string>(fullProp.structural?.deckPatio) ? 80 : 50,
      smartHome: 70,
      fireplace: fullProp && getFieldValue<boolean>(fullProp.structural?.fireplaceYn) ? 100 : 0,
      evCharging: 50,
      beachAccess: fullProp && getFieldValue<number>(fullProp.location?.distanceBeachMiles) &&
                   getFieldValue<number>(fullProp.location?.distanceBeachMiles)! < 1 ? 100 : 30,
    },

    // Location Excellence
    locationExcellence: {
      beachAccess: fullProp && getFieldValue<number>(fullProp.location?.distanceBeachMiles) ?
                   Math.max(0, 100 - (getFieldValue<number>(fullProp.location?.distanceBeachMiles)! * 20)) : 50,
      schoolProximity: 85,
      transitAccess: transitScore || 60,
      safety: safetyRating ? (safetyRating.toLowerCase().includes('safe') ? 75 : 60) : 70,
      walkability: walkScore || 50,
      commute: 80,
    },
  };
}

// Comparison field categories
const fieldCategories = [
  { id: 'scores', label: 'Smart Scores & Rankings', icon: TrendingUp },
  { id: 'price', label: 'Price & Value Analysis', icon: DollarSign },
  { id: 'cost', label: 'Total Cost of Ownership', icon: Receipt },
  { id: 'size', label: 'Size & Space', icon: Maximize2 },
  { id: 'condition', label: 'Property Condition & Age', icon: Calendar },
  { id: 'interior', label: 'Interior Features', icon: Home },
  { id: 'exterior', label: 'Exterior & Outdoor Features', icon: TreePine },
  { id: 'parking', label: 'Parking & Garage', icon: Car },
  { id: 'building', label: 'Building Details (Condos)', icon: Building },
  { id: 'waterfront', label: 'Waterfront & Views', icon: Waves },
  { id: 'location', label: 'Location Scores', icon: MapPin },
  { id: 'schools', label: 'Schools', icon: GraduationCap },
  { id: 'distances', label: 'Distances & Amenities', icon: Navigation },
  { id: 'safety', label: 'Safety & Crime', icon: Shield },
  { id: 'community', label: 'Community & HOA', icon: Users },
  { id: 'environmental', label: 'Environmental & Climate Risk', icon: CloudRain },
  { id: 'utilities', label: 'Utilities & Infrastructure', icon: Zap },
  { id: 'investment', label: 'Investment & Rental Metrics', icon: BarChart3 },
  { id: 'leasing', label: 'Leasing & Restrictions', icon: FileText },
  { id: 'legal', label: 'Legal & Compliance', icon: Scale },
];

// Field definitions for comparison (mapped to 168-field schema)
const comparisonFields: Record<string, Array<{
  key: string;
  label: string;
  path: string;
  fieldNum?: number;
  format?: 'currency' | 'number' | 'percent' | 'text' | 'boolean' | 'rating';
  higherIsBetter?: boolean;
  missingDataSource?: boolean;
}>> = {
  scores: [
    { key: 'smartScore', label: 'Smart Score', path: 'smartScore', format: 'number', higherIsBetter: true },
    { key: 'dataCompleteness', label: 'Data Completeness %', path: 'dataCompleteness', format: 'percent', higherIsBetter: true },
    { key: 'pricePerSqftRank', label: 'Price/Sqft Ranking', path: 'calculated.pricePerSqftRank', format: 'text', missingDataSource: true },
    { key: 'valueScore', label: 'Value Score', path: 'calculated.valueScore', format: 'number', higherIsBetter: true, missingDataSource: true },
    { key: 'locationScore', label: 'Location Score', path: 'calculated.locationScore', format: 'number', higherIsBetter: true, missingDataSource: true },
  ],
  price: [
    { key: 'listingPrice', label: 'Listing Price', path: 'fields.10_listing_price.value', fieldNum: 10, format: 'currency', higherIsBetter: false },
    { key: 'pricePerSqft', label: 'Price Per Sq Ft', path: 'fields.11_price_per_sqft.value', fieldNum: 11, format: 'currency', higherIsBetter: false },
    { key: 'marketValueEstimate', label: 'Market Value Estimate', path: 'fields.12_market_value_estimate.value', fieldNum: 12, format: 'currency', higherIsBetter: true },
    { key: 'assessedValue', label: 'Assessed Value', path: 'fields.15_assessed_value.value', fieldNum: 15, format: 'currency', higherIsBetter: true },
    { key: 'redfinEstimate', label: 'Redfin Estimate', path: 'fields.16_redfin_estimate.value', fieldNum: 16, format: 'currency', higherIsBetter: true },
    { key: 'lastSalePrice', label: 'Last Sale Price', path: 'fields.14_last_sale_price.value', fieldNum: 14, format: 'currency' },
    { key: 'lastSaleDate', label: 'Last Sale Date', path: 'fields.13_last_sale_date.value', fieldNum: 13, format: 'text' },
    { key: 'priceVsMedian', label: 'Price vs Median %', path: 'fields.94_price_vs_median_percent.value', fieldNum: 94, format: 'percent', higherIsBetter: false },
    { key: 'medianHomePrice', label: 'Median Home Price (Neighborhood)', path: 'fields.91_median_home_price_neighborhood.value', fieldNum: 91, format: 'currency' },
    { key: 'pricePerSqftAvg', label: 'Price Per Sq Ft (Recent Avg)', path: 'fields.92_price_per_sqft_recent_avg.value', fieldNum: 92, format: 'currency' },
  ],
  cost: [
    { key: 'annualTaxes', label: 'Annual Taxes', path: 'fields.35_annual_taxes.value', fieldNum: 35, format: 'currency', higherIsBetter: false },
    { key: 'propertyTaxRate', label: 'Property Tax Rate', path: 'fields.37_property_tax_rate.value', fieldNum: 37, format: 'percent', higherIsBetter: false },
    { key: 'hoaFeeAnnual', label: 'HOA Fee (Annual)', path: 'fields.31_hoa_fee_annual.value', fieldNum: 31, format: 'currency', higherIsBetter: false },
    { key: 'insuranceEstAnnual', label: 'Insurance Estimate (Annual)', path: 'fields.97_insurance_est_annual.value', fieldNum: 97, format: 'currency', higherIsBetter: false },
    { key: 'cddFee', label: 'Annual CDD Fee', path: 'fields.153_annual_cdd_fee.value', fieldNum: 153, format: 'currency', higherIsBetter: false },
    { key: 'avgElectricBill', label: 'Avg Electric Bill', path: 'fields.105_avg_electric_bill.value', fieldNum: 105, format: 'text', higherIsBetter: false },
    { key: 'avgWaterBill', label: 'Avg Water Bill', path: 'fields.107_avg_water_bill.value', fieldNum: 107, format: 'text', higherIsBetter: false },
    { key: 'specialAssessments', label: 'Special Assessments', path: 'fields.138_special_assessments.value', fieldNum: 138, format: 'text' },
    { key: 'monthlyCarryingCost', label: 'Monthly Carrying Cost', path: 'calculated.monthlyCarryingCost', format: 'currency', higherIsBetter: false, missingDataSource: true },
    { key: 'annualCarryingCost', label: 'Annual Carrying Cost', path: 'calculated.annualCarryingCost', format: 'currency', higherIsBetter: false, missingDataSource: true },
  ],
  size: [
    { key: 'livingSqft', label: 'Living Sq Ft', path: 'fields.21_living_sqft.value', fieldNum: 21, format: 'number', higherIsBetter: true },
    { key: 'totalSqftUnderRoof', label: 'Total Sq Ft Under Roof', path: 'fields.22_total_sqft_under_roof.value', fieldNum: 22, format: 'number', higherIsBetter: true },
    { key: 'lotSizeSqft', label: 'Lot Size (Sq Ft)', path: 'fields.23_lot_size_sqft.value', fieldNum: 23, format: 'number', higherIsBetter: true },
    { key: 'lotSizeAcres', label: 'Lot Size (Acres)', path: 'fields.24_lot_size_acres.value', fieldNum: 24, format: 'number', higherIsBetter: true },
    { key: 'bedrooms', label: 'Bedrooms', path: 'fields.17_bedrooms.value', fieldNum: 17, format: 'number', higherIsBetter: true },
    { key: 'fullBathrooms', label: 'Full Bathrooms', path: 'fields.18_full_bathrooms.value', fieldNum: 18, format: 'number', higherIsBetter: true },
    { key: 'halfBathrooms', label: 'Half Bathrooms', path: 'fields.19_half_bathrooms.value', fieldNum: 19, format: 'number', higherIsBetter: true },
    { key: 'totalBathrooms', label: 'Total Bathrooms', path: 'fields.20_total_bathrooms.value', fieldNum: 20, format: 'number', higherIsBetter: true },
    { key: 'stories', label: 'Stories', path: 'fields.27_stories.value', fieldNum: 27, format: 'number' },
    { key: 'floorsInUnit', label: 'Floors in Unit', path: 'fields.148_floors_in_unit.value', fieldNum: 148, format: 'number' },
  ],
  condition: [
    { key: 'yearBuilt', label: 'Year Built', path: 'fields.25_year_built.value', fieldNum: 25, format: 'number', higherIsBetter: true },
    { key: 'propertyAge', label: 'Property Age (Years)', path: 'calculated.propertyAge', format: 'number', higherIsBetter: false, missingDataSource: true },
    { key: 'interiorCondition', label: 'Interior Condition', path: 'fields.48_interior_condition.value', fieldNum: 48, format: 'text' },
    { key: 'recentRenovations', label: 'Recent Renovations', path: 'fields.59_recent_renovations.value', fieldNum: 59, format: 'text' },
    { key: 'roofType', label: 'Roof Type', path: 'fields.39_roof_type.value', fieldNum: 39, format: 'text' },
    { key: 'roofAgeEst', label: 'Roof Age (Est)', path: 'fields.40_roof_age_est.value', fieldNum: 40, format: 'text' },
    { key: 'hvacType', label: 'HVAC Type', path: 'fields.45_hvac_type.value', fieldNum: 45, format: 'text' },
    { key: 'hvacAge', label: 'HVAC Age', path: 'fields.46_hvac_age.value', fieldNum: 46, format: 'text' },
    { key: 'permitHistoryRoof', label: 'Permit History - Roof', path: 'fields.60_permit_history_roof.value', fieldNum: 60, format: 'text' },
    { key: 'permitHistoryHvac', label: 'Permit History - HVAC', path: 'fields.61_permit_history_hvac.value', fieldNum: 61, format: 'text' },
  ],
  interior: [
    { key: 'flooringType', label: 'Flooring Type', path: 'fields.49_flooring_type.value', fieldNum: 49, format: 'text' },
    { key: 'kitchenFeatures', label: 'Kitchen Features', path: 'fields.50_kitchen_features.value', fieldNum: 50, format: 'text' },
    { key: 'appliancesIncluded', label: 'Appliances Included', path: 'fields.51_appliances_included.value', fieldNum: 51, format: 'text' },
    { key: 'fireplaceYn', label: 'Fireplace', path: 'fields.52_fireplace_yn.value', fieldNum: 52, format: 'boolean' },
    { key: 'fireplaceCount', label: 'Fireplace Count', path: 'fields.53_fireplace_count.value', fieldNum: 53, format: 'number' },
    { key: 'laundryType', label: 'Laundry Type', path: 'fields.47_laundry_type.value', fieldNum: 47, format: 'text' },
    { key: 'interiorFeatures', label: 'Interior Features', path: 'fields.167_interior_features.value', fieldNum: 167, format: 'text' },
    { key: 'smartHomeFeatures', label: 'Smart Home Features', path: 'fields.134_smart_home_features.value', fieldNum: 134, format: 'text' },
    { key: 'waterHeaterType', label: 'Water Heater Type', path: 'fields.43_water_heater_type.value', fieldNum: 43, format: 'text' },
  ],
  exterior: [
    { key: 'exteriorMaterial', label: 'Exterior Material', path: 'fields.41_exterior_material.value', fieldNum: 41, format: 'text' },
    { key: 'foundation', label: 'Foundation', path: 'fields.42_foundation.value', fieldNum: 42, format: 'text' },
    { key: 'poolYn', label: 'Pool', path: 'fields.54_pool_yn.value', fieldNum: 54, format: 'boolean' },
    { key: 'poolType', label: 'Pool Type', path: 'fields.55_pool_type.value', fieldNum: 55, format: 'text' },
    { key: 'deckPatio', label: 'Deck/Patio', path: 'fields.56_deck_patio.value', fieldNum: 56, format: 'text' },
    { key: 'fence', label: 'Fence', path: 'fields.57_fence.value', fieldNum: 57, format: 'text' },
    { key: 'landscaping', label: 'Landscaping', path: 'fields.58_landscaping.value', fieldNum: 58, format: 'text' },
    { key: 'lotFeatures', label: 'Lot Features', path: 'fields.132_lot_features.value', fieldNum: 132, format: 'text' },
    { key: 'exteriorFeatures', label: 'Exterior Features', path: 'fields.168_exterior_features.value', fieldNum: 168, format: 'text' },
    { key: 'frontExposure', label: 'Front Exposure', path: 'fields.154_front_exposure.value', fieldNum: 154, format: 'text' },
  ],
  parking: [
    { key: 'garageSpaces', label: 'Garage Spaces', path: 'fields.28_garage_spaces.value', fieldNum: 28, format: 'number', higherIsBetter: true },
    { key: 'garageType', label: 'Garage Type', path: 'fields.44_garage_type.value', fieldNum: 44, format: 'text' },
    { key: 'garageAttached', label: 'Garage Attached', path: 'fields.141_garage_attached_yn.value', fieldNum: 141, format: 'boolean' },
    { key: 'parkingTotal', label: 'Parking Total', path: 'fields.29_parking_total.value', fieldNum: 29, format: 'text' },
    { key: 'carportYn', label: 'Carport', path: 'fields.139_carport_yn.value', fieldNum: 139, format: 'boolean' },
    { key: 'carportSpaces', label: 'Carport Spaces', path: 'fields.140_carport_spaces.value', fieldNum: 140, format: 'number' },
    { key: 'parkingFeatures', label: 'Parking Features', path: 'fields.142_parking_features.value', fieldNum: 142, format: 'text' },
    { key: 'assignedParkingSpaces', label: 'Assigned Parking Spaces', path: 'fields.143_assigned_parking_spaces.value', fieldNum: 143, format: 'number' },
    { key: 'evCharging', label: 'EV Charging', path: 'fields.133_ev_charging.value', fieldNum: 133, format: 'text' },
  ],
  building: [
    { key: 'propertyType', label: 'Property Type', path: 'fields.26_property_type.value', fieldNum: 26, format: 'text' },
    { key: 'floorNumber', label: 'Floor Number', path: 'fields.144_floor_number.value', fieldNum: 144, format: 'number' },
    { key: 'buildingTotalFloors', label: 'Building Total Floors', path: 'fields.145_building_total_floors.value', fieldNum: 145, format: 'number' },
    { key: 'buildingNameNumber', label: 'Building Name/Number', path: 'fields.146_building_name_number.value', fieldNum: 146, format: 'text' },
    { key: 'buildingElevator', label: 'Building Elevator', path: 'fields.147_building_elevator_yn.value', fieldNum: 147, format: 'boolean' },
    { key: 'ownershipType', label: 'Ownership Type', path: 'fields.34_ownership_type.value', fieldNum: 34, format: 'text' },
  ],
  waterfront: [
    { key: 'waterFrontageYn', label: 'Water Frontage', path: 'fields.155_water_frontage_yn.value', fieldNum: 155, format: 'boolean' },
    { key: 'waterfrontFeet', label: 'Waterfront Feet', path: 'fields.156_waterfront_feet.value', fieldNum: 156, format: 'number', higherIsBetter: true },
    { key: 'waterAccessYn', label: 'Water Access', path: 'fields.157_water_access_yn.value', fieldNum: 157, format: 'boolean' },
    { key: 'waterViewYn', label: 'Water View', path: 'fields.158_water_view_yn.value', fieldNum: 158, format: 'boolean' },
    { key: 'waterBodyName', label: 'Water Body Name', path: 'fields.159_water_body_name.value', fieldNum: 159, format: 'text' },
    { key: 'viewType', label: 'View Type', path: 'fields.131_view_type.value', fieldNum: 131, format: 'text' },
    { key: 'distanceBeach', label: 'Distance to Beach (mi)', path: 'fields.87_distance_beach_mi.value', fieldNum: 87, format: 'number', higherIsBetter: false },
  ],
  location: [
    { key: 'walkScore', label: 'Walk Score', path: 'fields.74_walk_score.value', fieldNum: 74, format: 'number', higherIsBetter: true },
    { key: 'transitScore', label: 'Transit Score', path: 'fields.75_transit_score.value', fieldNum: 75, format: 'number', higherIsBetter: true },
    { key: 'bikeScore', label: 'Bike Score', path: 'fields.76_bike_score.value', fieldNum: 76, format: 'number', higherIsBetter: true },
    { key: 'walkabilityDesc', label: 'Walkability Description', path: 'fields.80_walkability_description.value', fieldNum: 80, format: 'text' },
    { key: 'publicTransitAccess', label: 'Public Transit Access', path: 'fields.81_public_transit_access.value', fieldNum: 81, format: 'text' },
    { key: 'commuteCityCenter', label: 'Commute to City Center', path: 'fields.82_commute_to_city_center.value', fieldNum: 82, format: 'text' },
    { key: 'noiseLevel', label: 'Noise Level', path: 'fields.78_noise_level.value', fieldNum: 78, format: 'text', higherIsBetter: false },
    { key: 'noiseLevelDb', label: 'Noise Level (dB Est)', path: 'fields.129_noise_level_db_est.value', fieldNum: 129, format: 'text', higherIsBetter: false },
    { key: 'trafficLevel', label: 'Traffic Level', path: 'fields.79_traffic_level.value', fieldNum: 79, format: 'text', higherIsBetter: false },
    { key: 'elevationFeet', label: 'Elevation (feet)', path: 'fields.64_elevation_feet.value', fieldNum: 64, format: 'number' },
  ],
  schools: [
    { key: 'schoolDistrict', label: 'School District', path: 'fields.63_school_district.value', fieldNum: 63, format: 'text' },
    { key: 'elementarySchool', label: 'Elementary School', path: 'fields.65_elementary_school.value', fieldNum: 65, format: 'text' },
    { key: 'elementaryRating', label: 'Elementary Rating', path: 'fields.66_elementary_rating.value', fieldNum: 66, format: 'rating', higherIsBetter: true },
    { key: 'elementaryDistance', label: 'Elementary Distance (mi)', path: 'fields.67_elementary_distance_mi.value', fieldNum: 67, format: 'number', higherIsBetter: false },
    { key: 'middleSchool', label: 'Middle School', path: 'fields.68_middle_school.value', fieldNum: 68, format: 'text' },
    { key: 'middleRating', label: 'Middle Rating', path: 'fields.69_middle_rating.value', fieldNum: 69, format: 'rating', higherIsBetter: true },
    { key: 'middleDistance', label: 'Middle Distance (mi)', path: 'fields.70_middle_distance_mi.value', fieldNum: 70, format: 'number', higherIsBetter: false },
    { key: 'highSchool', label: 'High School', path: 'fields.71_high_school.value', fieldNum: 71, format: 'text' },
    { key: 'highRating', label: 'High Rating', path: 'fields.72_high_rating.value', fieldNum: 72, format: 'rating', higherIsBetter: true },
    { key: 'highDistance', label: 'High Distance (mi)', path: 'fields.73_high_distance_mi.value', fieldNum: 73, format: 'number', higherIsBetter: false },
  ],
  distances: [
    { key: 'distanceGrocery', label: 'Distance to Grocery (mi)', path: 'fields.83_distance_grocery_mi.value', fieldNum: 83, format: 'number', higherIsBetter: false },
    { key: 'distanceHospital', label: 'Distance to Hospital (mi)', path: 'fields.84_distance_hospital_mi.value', fieldNum: 84, format: 'number', higherIsBetter: false },
    { key: 'distanceAirport', label: 'Distance to Airport (mi)', path: 'fields.85_distance_airport_mi.value', fieldNum: 85, format: 'number', higherIsBetter: false },
    { key: 'distancePark', label: 'Distance to Park (mi)', path: 'fields.86_distance_park_mi.value', fieldNum: 86, format: 'number', higherIsBetter: false },
    { key: 'distanceBeach', label: 'Distance to Beach (mi)', path: 'fields.87_distance_beach_mi.value', fieldNum: 87, format: 'number', higherIsBetter: false },
    { key: 'emergencyServicesDistance', label: 'Emergency Services Distance', path: 'fields.116_emergency_services_distance.value', fieldNum: 116, format: 'text', higherIsBetter: false },
  ],
  safety: [
    { key: 'safetyScore', label: 'Safety Score', path: 'fields.77_safety_score.value', fieldNum: 77, format: 'number', higherIsBetter: true },
    { key: 'violentCrimeIndex', label: 'Violent Crime Index', path: 'fields.88_violent_crime_index.value', fieldNum: 88, format: 'text', higherIsBetter: false },
    { key: 'propertyCrimeIndex', label: 'Property Crime Index', path: 'fields.89_property_crime_index.value', fieldNum: 89, format: 'text', higherIsBetter: false },
    { key: 'neighborhoodSafetyRating', label: 'Neighborhood Safety Rating', path: 'fields.90_neighborhood_safety_rating.value', fieldNum: 90, format: 'text', higherIsBetter: true },
  ],
  community: [
    { key: 'hoaYn', label: 'HOA Required', path: 'fields.30_hoa_yn.value', fieldNum: 30, format: 'boolean' },
    { key: 'hoaName', label: 'HOA Name', path: 'fields.32_hoa_name.value', fieldNum: 32, format: 'text' },
    { key: 'hoaIncludes', label: 'HOA Includes', path: 'fields.33_hoa_includes.value', fieldNum: 33, format: 'text' },
    { key: 'communityFeatures', label: 'Community Features', path: 'fields.166_community_features.value', fieldNum: 166, format: 'text' },
    { key: 'neighborhood', label: 'Neighborhood', path: 'fields.6_neighborhood.value', fieldNum: 6, format: 'text' },
    { key: 'subdivisionName', label: 'Subdivision Name', path: 'fields.149_subdivision_name.value', fieldNum: 149, format: 'text' },
  ],
  environmental: [
    { key: 'airQualityIndex', label: 'Air Quality Index', path: 'fields.117_air_quality_index.value', fieldNum: 117, format: 'text', higherIsBetter: false },
    { key: 'airQualityGrade', label: 'Air Quality Grade', path: 'fields.118_air_quality_grade.value', fieldNum: 118, format: 'text', higherIsBetter: true },
    { key: 'floodZone', label: 'Flood Zone', path: 'fields.119_flood_zone.value', fieldNum: 119, format: 'text' },
    { key: 'floodRiskLevel', label: 'Flood Risk Level', path: 'fields.120_flood_risk_level.value', fieldNum: 120, format: 'text', higherIsBetter: false },
    { key: 'climateRisk', label: 'Climate Risk', path: 'fields.121_climate_risk.value', fieldNum: 121, format: 'text', higherIsBetter: false },
    { key: 'wildfireRisk', label: 'Wildfire Risk', path: 'fields.122_wildfire_risk.value', fieldNum: 122, format: 'text', higherIsBetter: false },
    { key: 'earthquakeRisk', label: 'Earthquake Risk', path: 'fields.123_earthquake_risk.value', fieldNum: 123, format: 'text', higherIsBetter: false },
    { key: 'hurricaneRisk', label: 'Hurricane Risk', path: 'fields.124_hurricane_risk.value', fieldNum: 124, format: 'text', higherIsBetter: false },
    { key: 'tornadoRisk', label: 'Tornado Risk', path: 'fields.125_tornado_risk.value', fieldNum: 125, format: 'text', higherIsBetter: false },
    { key: 'radonRisk', label: 'Radon Risk', path: 'fields.126_radon_risk.value', fieldNum: 126, format: 'text', higherIsBetter: false },
    { key: 'superfundSiteNearby', label: 'Superfund Site Nearby', path: 'fields.127_superfund_site_nearby.value', fieldNum: 127, format: 'text', higherIsBetter: false },
    { key: 'seaLevelRiseRisk', label: 'Sea Level Rise Risk', path: 'fields.128_sea_level_rise_risk.value', fieldNum: 128, format: 'text', higherIsBetter: false },
    { key: 'solarPotential', label: 'Solar Potential', path: 'fields.130_solar_potential.value', fieldNum: 130, format: 'text', higherIsBetter: true },
  ],
  utilities: [
    { key: 'electricProvider', label: 'Electric Provider', path: 'fields.104_electric_provider.value', fieldNum: 104, format: 'text' },
    { key: 'waterProvider', label: 'Water Provider', path: 'fields.106_water_provider.value', fieldNum: 106, format: 'text' },
    { key: 'sewerProvider', label: 'Sewer Provider', path: 'fields.108_sewer_provider.value', fieldNum: 108, format: 'text' },
    { key: 'naturalGas', label: 'Natural Gas', path: 'fields.109_natural_gas.value', fieldNum: 109, format: 'text' },
    { key: 'trashProvider', label: 'Trash Provider', path: 'fields.110_trash_provider.value', fieldNum: 110, format: 'text' },
    { key: 'internetProvidersTop3', label: 'Internet Providers (Top 3)', path: 'fields.111_internet_providers_top3.value', fieldNum: 111, format: 'text' },
    { key: 'maxInternetSpeed', label: 'Max Internet Speed', path: 'fields.112_max_internet_speed.value', fieldNum: 112, format: 'text', higherIsBetter: true },
    { key: 'fiberAvailable', label: 'Fiber Available', path: 'fields.113_fiber_available.value', fieldNum: 113, format: 'text', higherIsBetter: true },
    { key: 'cableTvProvider', label: 'Cable TV Provider', path: 'fields.114_cable_tv_provider.value', fieldNum: 114, format: 'text' },
    { key: 'cellCoverageQuality', label: 'Cell Coverage Quality', path: 'fields.115_cell_coverage_quality.value', fieldNum: 115, format: 'text', higherIsBetter: true },
  ],
  investment: [
    { key: 'rentalEstimateMonthly', label: 'Rental Estimate (Monthly)', path: 'fields.98_rental_estimate_monthly.value', fieldNum: 98, format: 'currency', higherIsBetter: true },
    { key: 'rentalYieldEst', label: 'Rental Yield (Est)', path: 'fields.99_rental_yield_est.value', fieldNum: 99, format: 'percent', higherIsBetter: true },
    { key: 'capRateEst', label: 'Cap Rate (Est)', path: 'fields.101_cap_rate_est.value', fieldNum: 101, format: 'percent', higherIsBetter: true },
    { key: 'priceToRentRatio', label: 'Price to Rent Ratio', path: 'fields.93_price_to_rent_ratio.value', fieldNum: 93, format: 'number', higherIsBetter: false },
    { key: 'vacancyRateNeighborhood', label: 'Vacancy Rate (Neighborhood)', path: 'fields.100_vacancy_rate_neighborhood.value', fieldNum: 100, format: 'percent', higherIsBetter: false },
    { key: 'daysOnMarketAvg', label: 'Days on Market (Avg)', path: 'fields.95_days_on_market_avg.value', fieldNum: 95, format: 'number', higherIsBetter: false },
    { key: 'inventorySurplus', label: 'Inventory Surplus', path: 'fields.96_inventory_surplus.value', fieldNum: 96, format: 'text' },
    { key: 'financingTerms', label: 'Financing Terms', path: 'fields.102_financing_terms.value', fieldNum: 102, format: 'text' },
    { key: 'comparableSales', label: 'Comparable Sales', path: 'fields.103_comparable_sales.value', fieldNum: 103, format: 'text' },
  ],
  leasing: [
    { key: 'canBeLeasedYn', label: 'Can Be Leased', path: 'fields.160_can_be_leased_yn.value', fieldNum: 160, format: 'boolean' },
    { key: 'minimumLeasePeriod', label: 'Minimum Lease Period', path: 'fields.161_minimum_lease_period.value', fieldNum: 161, format: 'text' },
    { key: 'leaseRestrictionsYn', label: 'Lease Restrictions', path: 'fields.162_lease_restrictions_yn.value', fieldNum: 162, format: 'boolean' },
    { key: 'petPolicy', label: 'Pet Policy', path: 'fields.136_pet_policy.value', fieldNum: 136, format: 'text' },
    { key: 'petSizeLimit', label: 'Pet Size Limit', path: 'fields.163_pet_size_limit.value', fieldNum: 163, format: 'text' },
    { key: 'maxPetWeight', label: 'Max Pet Weight (lbs)', path: 'fields.164_max_pet_weight.value', fieldNum: 164, format: 'number' },
    { key: 'ageRestrictions', label: 'Age Restrictions', path: 'fields.137_age_restrictions.value', fieldNum: 137, format: 'text' },
    { key: 'associationApprovalYn', label: 'Association Approval Required', path: 'fields.165_association_approval_yn.value', fieldNum: 165, format: 'boolean' },
    { key: 'accessibilityModifications', label: 'Accessibility Modifications', path: 'fields.135_accessibility_modifications.value', fieldNum: 135, format: 'text' },
  ],
  legal: [
    { key: 'parcelId', label: 'Parcel ID', path: 'fields.9_parcel_id.value', fieldNum: 9, format: 'text' },
    { key: 'legalDescription', label: 'Legal Description', path: 'fields.150_legal_description.value', fieldNum: 150, format: 'text' },
    { key: 'county', label: 'County', path: 'fields.7_county.value', fieldNum: 7, format: 'text' },
    { key: 'taxYear', label: 'Tax Year', path: 'fields.36_tax_year.value', fieldNum: 36, format: 'number' },
    { key: 'taxExemptions', label: 'Tax Exemptions', path: 'fields.38_tax_exemptions.value', fieldNum: 38, format: 'text' },
    { key: 'homesteadYn', label: 'Homestead Exemption', path: 'fields.151_homestead_yn.value', fieldNum: 151, format: 'boolean' },
    { key: 'cddYn', label: 'CDD', path: 'fields.152_cdd_yn.value', fieldNum: 152, format: 'boolean' },
    { key: 'mlsPrimary', label: 'MLS Primary', path: 'fields.2_mls_primary.value', fieldNum: 2, format: 'text' },
    { key: 'mlsSecondary', label: 'MLS Secondary', path: 'fields.3_mls_secondary.value', fieldNum: 3, format: 'text' },
    { key: 'listingStatus', label: 'Listing Status', path: 'fields.4_listing_status.value', fieldNum: 4, format: 'text' },
    { key: 'listingDate', label: 'Listing Date', path: 'fields.5_listing_date.value', fieldNum: 5, format: 'text' },
    { key: 'permitHistoryOther', label: 'Permit History - Other', path: 'fields.62_permit_history_other.value', fieldNum: 62, format: 'text' },
  ],
};

// Property selector dropdown component
function PropertySelector({
  slot,
  selectedId,
  onSelect,
  onClear,
  properties,
  excludeIds
}: {
  slot: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
  properties: PropertyCard[];
  excludeIds: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedProperty = properties.find(p => p.id === selectedId);

  const filteredProperties = useMemo(() => {
    return properties
      .filter(p => !excludeIds.includes(p.id))
      .filter(p => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
          p.address.toLowerCase().includes(search) ||
          p.city.toLowerCase().includes(search) ||
          p.zip.includes(search)
        );
      });
  }, [properties, excludeIds, searchTerm]);

  return (
    <div className="relative">
      {selectedProperty ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-4 border border-quantum-cyan/30"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-quantum-cyan">Property {slot}</span>
            <button
              onClick={onClear}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          </div>
          <h3 className="font-semibold text-white text-sm mb-1">{selectedProperty.address}</h3>
          <p className="text-xs text-gray-400 mb-2">{selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/5 rounded px-2 py-1">
              <span className="text-gray-400">Price:</span>
              <span className="text-white ml-1">${selectedProperty.price.toLocaleString()}</span>
            </div>
            <div className="bg-white/5 rounded px-2 py-1">
              <span className="text-gray-400">Score:</span>
              <span className="text-quantum-cyan ml-1">{selectedProperty.smartScore}</span>
            </div>
            <div className="bg-white/5 rounded px-2 py-1">
              <span className="text-gray-400">Beds:</span>
              <span className="text-white ml-1">{selectedProperty.bedrooms}</span>
            </div>
            <div className="bg-white/5 rounded px-2 py-1">
              <span className="text-gray-400">Sqft:</span>
              <span className="text-white ml-1">{selectedProperty.sqft.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>
      ) : (
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="glass-card p-6 border-2 border-dashed border-white/10 hover:border-quantum-cyan/30 transition-colors cursor-pointer"
        >
          <div className="flex flex-col items-center justify-center h-24 text-center">
            <Plus className="w-8 h-8 text-gray-500 mb-2" />
            <p className="text-gray-400 text-sm">Select Property {slot}</p>
            <ChevronDown className="w-4 h-4 text-gray-500 mt-1" />
          </div>
        </div>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && !selectedProperty && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 top-full left-0 right-0 mt-2 glass-card border border-white/10 rounded-xl overflow-hidden max-h-80"
          >
            {/* Search */}
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-quantum-cyan/50"
                />
              </div>
            </div>

            {/* Property List */}
            <div className="overflow-y-auto max-h-60">
              {filteredProperties.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No properties available
                </div>
              ) : (
                filteredProperties.map((property) => (
                  <div
                    key={property.id}
                    onClick={() => {
                      onSelect(property.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-b-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-white">{property.address}</p>
                        <p className="text-xs text-gray-400">{property.city}, {property.state}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-quantum-green">${property.price.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">Score: {property.smartScore}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setSearchTerm('');
          }}
        />
      )}
    </div>
  );
}

// Get nested value from property object
function getNestedValue(obj: any, path: string): any {
  if (!obj) return null;

  // Handle special card prefix for PropertyCard fields
  if (path.startsWith('card.')) {
    return obj[path.replace('card.', '')];
  }

  const parts = path.split('.');
  let value = obj;

  for (const part of parts) {
    if (value === null || value === undefined) return null;
    value = value[part];
  }

  // Handle DataField structure
  if (value && typeof value === 'object' && 'value' in value) {
    return value.value;
  }

  return value;
}

// Format value for display
function formatValue(value: any, format?: string): string {
  if (value === null || value === undefined) return '—';

  switch (format) {
    case 'currency':
      return typeof value === 'number' ? `$${value.toLocaleString()}` : value.toString();
    case 'percent':
      return typeof value === 'number' ? `${value.toFixed(1)}%` : value.toString();
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : value.toString();
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'rating':
      return value?.toString() || '—';
    default:
      return value?.toString() || '—';
  }
}

// Compare values and determine which is better
function compareValues(
  values: (any)[],
  higherIsBetter?: boolean
): ('better' | 'worse' | 'equal' | 'neutral')[] {
  const numericValues = values.map(v => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return v;
    if (typeof v === 'boolean') return v ? 1 : 0;
    const num = parseFloat(v);
    return isNaN(num) ? null : num;
  });

  // If we can't compare numerically or no preference set, return neutral
  if (higherIsBetter === undefined || numericValues.every(v => v === null)) {
    return values.map(() => 'neutral');
  }

  const validValues = numericValues.filter(v => v !== null) as number[];
  if (validValues.length < 2) {
    return values.map(() => 'neutral');
  }

  const best = higherIsBetter ? Math.max(...validValues) : Math.min(...validValues);
  const worst = higherIsBetter ? Math.min(...validValues) : Math.max(...validValues);

  return numericValues.map(v => {
    if (v === null) return 'neutral';
    if (v === best && v !== worst) return 'better';
    if (v === worst && v !== best) return 'worse';
    return 'equal';
  });
}

// Analytics summary component
function AnalyticsSummary({
  selectedProperties,
  fullProperties
}: {
  selectedProperties: PropertyCard[];
  fullProperties: Map<string, Property>;
}) {
  const analytics = useMemo(() => {
    if (selectedProperties.length < 2) return null;

    const pricePerSqft = selectedProperties.map(p => p.pricePerSqft);
    const lowestPricePerSqft = Math.min(...pricePerSqft);
    const lowestPriceProperty = selectedProperties.find(p => p.pricePerSqft === lowestPricePerSqft);

    const smartScores = selectedProperties.map(p => p.smartScore);
    const highestScore = Math.max(...smartScores);
    const bestScoreProperty = selectedProperties.find(p => p.smartScore === highestScore);

    const prices = selectedProperties.map(p => p.price);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    return {
      bestValue: lowestPriceProperty,
      bestScore: bestScoreProperty,
      avgPrice,
      priceSpread: Math.max(...prices) - Math.min(...prices),
      completenessAvg: selectedProperties.reduce((a, b) => a + b.dataCompleteness, 0) / selectedProperties.length,
    };
  }, [selectedProperties]);

  if (!analytics) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 mb-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-quantum-purple" />
        <h3 className="font-semibold text-white">Quick Analytics</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-quantum-green" />
            <span className="text-xs text-gray-400">Best Value</span>
          </div>
          <p className="text-sm font-medium text-white truncate">{analytics.bestValue?.address}</p>
          <p className="text-xs text-quantum-green">${analytics.bestValue?.pricePerSqft}/sqft</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-quantum-cyan" />
            <span className="text-xs text-gray-400">Highest Score</span>
          </div>
          <p className="text-sm font-medium text-white truncate">{analytics.bestScore?.address}</p>
          <p className="text-xs text-quantum-cyan">Score: {analytics.bestScore?.smartScore}</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-quantum-purple" />
            <span className="text-xs text-gray-400">Price Spread</span>
          </div>
          <p className="text-lg font-semibold text-white">${analytics.priceSpread.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Between properties</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-quantum-orange" />
            <span className="text-xs text-gray-400">Avg Completeness</span>
          </div>
          <p className="text-lg font-semibold text-white">{analytics.completenessAvg.toFixed(0)}%</p>
          <p className="text-xs text-gray-400">Data coverage</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Compare() {
  const { properties, fullProperties } = usePropertyStore();
  const [selectedIds, setSelectedIds] = useState<(string | null)[]>([null, null, null]);
  const [activeCategory, setActiveCategory] = useState('overview');
  const [showAllFields, setShowAllFields] = useState(false);
  const [viewMode, setViewMode] = useState<CompareViewMode>('table');
  const [showVisualAnalytics, setShowVisualAnalytics] = useState(false);

  const selectedProperties = useMemo(() => {
    return selectedIds
      .filter((id): id is string => id !== null)
      .map(id => properties.find(p => p.id === id))
      .filter((p): p is PropertyCard => p !== undefined);
  }, [selectedIds, properties]);

  const selectedFullProperties = useMemo(() => {
    return selectedIds
      .filter((id): id is string => id !== null)
      .map(id => fullProperties.get(id))
      .filter((p): p is Property => p !== undefined);
  }, [selectedIds, fullProperties]);

  // Convert selected properties to analytics format
  const analyticsProperties = useMemo((): [AnalyticsProperty, AnalyticsProperty, AnalyticsProperty] | null => {
    if (selectedProperties.length < 3) return null;

    return selectedProperties.slice(0, 3).map((cardProp, index) => {
      const fullProp = fullProperties.get(cardProp.id);
      return mapToAnalyticsProperty(cardProp, fullProp);
    }) as [AnalyticsProperty, AnalyticsProperty, AnalyticsProperty];
  }, [selectedProperties, fullProperties]);

  const handleSelect = (slot: number, id: string) => {
    const newIds = [...selectedIds];
    newIds[slot] = id;
    setSelectedIds(newIds);
  };

  const handleClear = (slot: number) => {
    const newIds = [...selectedIds];
    newIds[slot] = null;
    setSelectedIds(newIds);
  };

  const excludeIds = selectedIds.filter((id): id is string => id !== null);

  const currentFields = comparisonFields[activeCategory] || [];

  return (
    <motion.div
      className="px-4 py-6 md:px-8 md:py-10 max-w-7xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-gradient-quantum mb-2">
              Advanced Comparison Analytics
            </h1>
            <p className="text-gray-400">
              Select up to 3 properties for side-by-side comparison
            </p>
          </div>

          {/* View Mode Toggle */}
          {selectedProperties.length >= 2 && (
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                <Table2 className="w-4 h-4" />
                Table View
              </button>
              <button
                onClick={() => setViewMode('visual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  viewMode === 'visual'
                    ? 'bg-quantum-purple/20 text-quantum-purple border border-quantum-purple/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                <PieChart className="w-4 h-4" />
                32 Visual Charts
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Property Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map((slot) => (
          <PropertySelector
            key={slot}
            slot={slot + 1}
            selectedId={selectedIds[slot]}
            onSelect={(id) => handleSelect(slot, id)}
            onClear={() => handleClear(slot)}
            properties={properties}
            excludeIds={excludeIds.filter(id => id !== selectedIds[slot])}
          />
        ))}
      </div>

      {/* Analytics Summary */}
      {selectedProperties.length >= 2 && (
        <AnalyticsSummary
          selectedProperties={selectedProperties}
          fullProperties={fullProperties}
        />
      )}

      {/* Visual Analytics Mode */}
      {viewMode === 'visual' && selectedProperties.length >= 3 && analyticsProperties && (
        <div className="mb-6">
          <PropertyComparisonAnalytics
            properties={analyticsProperties}
            onClose={() => setViewMode('table')}
          />
        </div>
      )}

      {/* Visual Analytics - Need 3 properties message */}
      {viewMode === 'visual' && selectedProperties.length >= 2 && selectedProperties.length < 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 text-center mb-6"
        >
          <PieChart className="w-16 h-16 mx-auto mb-4 text-quantum-purple opacity-50" />
          <h3 className="text-xl font-semibold text-white mb-2">Select 3 Properties</h3>
          <p className="text-gray-400">
            The 32 visual chart comparisons require exactly 3 properties selected.
            <br />
            Please select one more property above.
          </p>
        </motion.div>
      )}

      {/* Table View Content */}
      {viewMode === 'table' && (
        <>
          {/* Category Tabs */}
          {selectedProperties.length >= 2 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {fieldCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeCategory === cat.id
                        ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/30'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Comparison Table */}
      <div className="glass-5d p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-quantum-cyan" />
            <h2 className="font-semibold text-white">Comparison Matrix</h2>
          </div>

          {selectedProperties.length >= 2 && (
            <button
              onClick={() => setShowAllFields(!showAllFields)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${showAllFields ? 'rotate-180' : ''} transition-transform`} />
              {showAllFields ? 'Show Key Fields' : 'Show All Fields'}
            </button>
          )}
        </div>

        {selectedProperties.length < 2 ? (
          <div className="text-center text-gray-500 py-12">
            <Scale className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Select at least 2 properties to compare</p>
            <p className="text-sm mt-2">Use the dropdown selectors above to choose properties</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 w-48">
                    Field
                  </th>
                  {selectedProperties.map((prop, idx) => (
                    <th key={prop.id} className="text-left py-3 px-4 text-sm font-medium text-white min-w-[180px]">
                      <div className="truncate">{prop.address}</div>
                      <div className="text-xs text-gray-400 font-normal">{prop.city}, {prop.state}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentFields
                  .slice(0, showAllFields ? undefined : 6)
                  .map((field) => {
                    // Get values from either full property or card
                    const values = selectedIds
                      .filter((id): id is string => id !== null)
                      .map(id => {
                        const fullProp = fullProperties.get(id);
                        const cardProp = properties.find(p => p.id === id);

                        // Handle special paths
                        if (field.path === 'smartScore') {
                          return cardProp?.smartScore ?? null;
                        }
                        if (field.path === 'dataCompleteness') {
                          return cardProp?.dataCompleteness ?? null;
                        }
                        if (field.path.startsWith('calculated.')) {
                          // Calculated fields - return null for now (marked as missing data source)
                          return null;
                        }
                        if (field.path.startsWith('card.')) {
                          return cardProp ? getNestedValue(cardProp, field.path) : null;
                        }

                        // Handle fields.XX_fieldname.value paths
                        if (field.path.startsWith('fields.') && fullProp) {
                          const val = getNestedValue(fullProp, field.path);
                          if (val !== null && val !== undefined) return val;
                        }

                        // Fallback: Try to map from PropertyCard using field number
                        if (cardProp && field.fieldNum) {
                          const fieldNumMappings: Record<number, keyof PropertyCard> = {
                            10: 'price',           // listing_price
                            11: 'pricePerSqft',    // price_per_sqft
                            17: 'bedrooms',        // bedrooms
                            20: 'bathrooms',       // total_bathrooms
                            21: 'sqft',            // living_sqft
                            25: 'yearBuilt',       // year_built
                          };
                          const cardKey = fieldNumMappings[field.fieldNum];
                          if (cardKey && cardProp[cardKey] !== undefined) {
                            return cardProp[cardKey];
                          }
                        }

                        return null;
                      });

                    const comparisons = compareValues(values, field.higherIsBetter);

                    return (
                      <tr key={field.key} className={`border-b border-white/5 hover:bg-white/5 ${field.missingDataSource ? 'bg-orange-500/10' : ''}`}>
                        <td className={`py-3 px-4 text-sm ${field.missingDataSource ? 'text-orange-400' : 'text-gray-400'}`}>
                          <div className="flex items-center gap-2">
                            {field.label}
                            {field.missingDataSource && (
                              <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                Missing Data
                              </span>
                            )}
                          </div>
                        </td>
                        {values.map((value, idx) => {
                          const comparison = comparisons[idx];
                          const colorClass = field.missingDataSource ? 'text-orange-400' :
                            comparison === 'better' ? 'text-quantum-green' :
                            comparison === 'worse' ? 'text-quantum-red' :
                            comparison === 'equal' ? 'text-gray-400' :
                            'text-white';

                          return (
                            <td key={idx} className={`py-3 px-4 text-sm ${colorClass} ${field.missingDataSource ? 'bg-orange-500/5' : ''}`}>
                              <div className="flex items-center gap-2">
                                {formatValue(value, field.format)}
                                {!field.missingDataSource && comparison === 'better' && <TrendingUp className="w-3 h-3" />}
                                {!field.missingDataSource && comparison === 'worse' && <TrendingDown className="w-3 h-3" />}
                                {comparison === 'equal' && <Minus className="w-3 h-3" />}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {!showAllFields && currentFields.length > 6 && (
              <div className="text-center py-4">
                <button
                  onClick={() => setShowAllFields(true)}
                  className="text-sm text-quantum-cyan hover:text-quantum-cyan/80 transition-colors"
                >
                  Show {currentFields.length - 6} more fields...
                </button>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex justify-center gap-6 text-sm text-gray-400 border-t border-white/10 pt-4 mt-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-quantum-green" />
            <span>Better</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="w-4 h-4 text-gray-500" />
            <span>Equal</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-quantum-red" />
            <span>Worse</span>
          </div>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-500" />
            <span>N/A</span>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Data completeness warning */}
      {selectedFullProperties.length < selectedProperties.length && selectedProperties.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-4 bg-quantum-orange/10 border border-quantum-orange/30 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-quantum-orange flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white font-medium">Limited Data Available</p>
              <p className="text-xs text-gray-400 mt-1">
                Some properties only have basic card data. Full 138-field comparison requires complete property data.
                View individual property details to see all available fields.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
