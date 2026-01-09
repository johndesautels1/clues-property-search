/**
 * CLUES Property Dashboard - Advanced Comparison Analytics Page
 * Full 181-field comparison with property dropdown selectors
 * Plus 32 hi-tech visual chart comparisons
 * Plus Olivia AI Analysis
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Scale, TrendingUp, TrendingDown, Minus,
  ChevronDown, Search, Home, DollarSign, Ruler, Calendar,
  MapPin, Building, Zap, Shield, BarChart3, Eye, RefreshCw,
  AlertTriangle, CheckCircle, Info, PieChart, Table2, Receipt,
  Maximize2, TreePine, Car, Waves, GraduationCap, Navigation,
  Users, CloudRain, FileText, Brain, Hammer, Sparkles, Layers, Activity
} from 'lucide-react';
import { usePropertyStore } from '@/store/propertyStore';
import { analyzeWithOlivia, type OliviaAnalysisResult } from '@/api/olivia';
import { OliviaResults } from '@/components/OliviaResults';
import { OliviaExecutiveReport } from '@/components/OliviaExecutiveReport';
import { analyzeWithOliviaProgressive, extractPropertyData } from '@/api/olivia-brain-enhanced';
import type { OliviaEnhancedAnalysisResult } from '@/types/olivia-enhanced';
import type { PropertyCard, Property } from '@/types/property';
import { PropertyComparisonAnalytics, type Property as AnalyticsProperty } from '@/components/analytics';
import { ProgressiveAnalysisPanel } from '@/components/ProgressiveAnalysisPanel';
import { calculateSmartScore } from '@/lib/smart-score-calculator';
import { SMARTScoreDisplay } from '@/components/SMARTScoreDisplay';
import SMARTScoreDiagnostic from '@/components/SMARTScoreDiagnostic';
import { useWeightStore, getCurrentWeights, getWeightsSource } from '@/store/weightStore';

// View modes for comparison
type CompareViewMode = 'table' | 'visual' | 'diagnostic';

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
    redfinEstimate: fullProp ? getFieldValue<number>(fullProp.financial?.redfinEstimate) || price * 0.93 : price * 0.93,
    avms: fullProp ? getFieldValue<number>(fullProp.financial?.avms) || price * 0.92 : price * 0.92,
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

// Comparison field categories - Mapped to 23 Schema Groups (A-W) from fields-schema.ts
// Tab IDs are UNCHANGED to preserve chart/data wiring. Only labels updated to match schema.
const fieldCategories = [
  // Composite/Summary Tabs (not direct schema groups)
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'scores', label: 'Smart Scores & Rankings', icon: TrendingUp },
  // Schema Group A: Address & Identity (Fields 1-9) - Included in Overview
  // Schema Group B: Pricing & Value (Fields 10-16)
  { id: 'price', label: 'Pricing & Value', icon: DollarSign },
  // Schema Group C: Property Basics (Fields 17-29)
  { id: 'size', label: 'Property Basics', icon: Maximize2 },
  // Schema Group D: HOA & Taxes (Fields 30-38)
  { id: 'cost', label: 'HOA & Taxes', icon: Receipt },
  // Schema Group E: Structure & Systems (Fields 39-48)
  { id: 'condition', label: 'Structure & Systems', icon: Calendar },
  // Schema Group F: Interior Features (Fields 49-53)
  { id: 'interior', label: 'Interior Features', icon: Home },
  // Schema Group G: Exterior Features (Fields 54-58)
  { id: 'exterior', label: 'Exterior Features', icon: TreePine },
  // Schema Group H: Permits & Renovations (Fields 59-62) - NEW
  { id: 'permits', label: 'Permits & Renovations', icon: Hammer },
  // Schema Group I: Assigned Schools (Fields 63-73)
  { id: 'schools', label: 'Assigned Schools', icon: GraduationCap },
  // Schema Group J: Location Scores (Fields 74-82)
  { id: 'location', label: 'Location Scores', icon: MapPin },
  // Schema Group K: Distances & Amenities (Fields 83-87)
  { id: 'distances', label: 'Distances & Amenities', icon: Navigation },
  // Schema Group L: Safety & Crime (Fields 88-90)
  { id: 'safety', label: 'Safety & Crime', icon: Shield },
  // Schema Group M: Market & Investment Data (Fields 91-103)
  { id: 'investment', label: 'Market & Investment Data', icon: BarChart3 },
  // Schema Group N: Utilities & Connectivity (Fields 104-116)
  { id: 'utilities', label: 'Utilities & Connectivity', icon: Zap },
  // Schema Group O: Environment & Risk (Fields 117-130)
  { id: 'environmental', label: 'Environment & Risk', icon: CloudRain },
  // Schema Group P: Additional Features (Fields 131-138) - NEW
  { id: 'additional', label: 'Additional Features', icon: Sparkles },
  // Schema Group Q: Parking (Fields 139-143)
  { id: 'parking', label: 'Parking', icon: Car },
  // Schema Group R: Building (Fields 144-148)
  { id: 'building', label: 'Building', icon: Building },
  // Schema Group S: Legal (Fields 149-154)
  { id: 'legal', label: 'Legal', icon: Scale },
  // Schema Group T: Waterfront (Fields 155-159)
  { id: 'waterfront', label: 'Waterfront', icon: Waves },
  // Schema Group U: Leasing (Fields 160-165)
  { id: 'leasing', label: 'Leasing', icon: FileText },
  // Schema Group V: Features (Fields 166-168) - NEW
  { id: 'features', label: 'Features', icon: Layers },
  // Schema Group W: Market Performance (Fields 169-181) - NEW
  { id: 'marketperf', label: 'Market Performance', icon: Activity },
  // Community & HOA kept for backwards compatibility (overlaps with D)
  { id: 'community', label: 'Community & HOA', icon: Users },
];

// Field definitions for comparison (mapped to 181-field schema with CORRECT Property interface paths)
const comparisonFields: Record<string, Array<{
  key: string;
  label: string;
  path: string;
  fieldNum?: number;
  format?: 'currency' | 'number' | 'percent' | 'text' | 'boolean' | 'rating';
  higherIsBetter?: boolean;
  missingDataSource?: boolean;
  calculated?: boolean;
}>> = {
  overview: [
    { key: 'price', label: 'Price', path: 'address.listingPrice.value', fieldNum: 10, format: 'currency', higherIsBetter: false },
    { key: 'pricePerSqft', label: 'Price/SF', path: 'address.pricePerSqft.value', fieldNum: 11, format: 'currency', higherIsBetter: false },
    { key: 'bedrooms', label: 'Bedrooms', path: 'details.bedrooms.value', fieldNum: 17, format: 'number', higherIsBetter: true },
    { key: 'bathrooms', label: 'Bathrooms', path: 'details.totalBathrooms.value', fieldNum: 20, format: 'number', higherIsBetter: true },
    { key: 'sqft', label: 'Living Sqft', path: 'details.livingSqft.value', fieldNum: 21, format: 'number', higherIsBetter: true },
    { key: 'smartScore', label: 'Smart Score', path: 'smartScore', format: 'number', higherIsBetter: true },
  ],
  scores: [
    { key: 'smartScore', label: 'Smart Score', path: 'smartScore', format: 'number', higherIsBetter: true },
    { key: 'price', label: 'Price', path: 'address.listingPrice.value', fieldNum: 10, format: 'currency', higherIsBetter: false },
    { key: 'pricePerSqft', label: 'Price/SF', path: 'address.pricePerSqft.value', fieldNum: 11, format: 'currency', higherIsBetter: false },
    { key: 'dataCompleteness', label: 'Data Completeness %', path: 'dataCompleteness', format: 'percent', higherIsBetter: true },
    { key: 'valueScore', label: 'Value Score', path: 'calculated.valueScore', format: 'number', higherIsBetter: true, missingDataSource: true },
    { key: 'locationScore', label: 'Location Score', path: 'calculated.locationScore', format: 'number', higherIsBetter: true, missingDataSource: true },
  ],
  price: [
    { key: 'listingPrice', label: 'Listing Price', path: 'address.listingPrice.value', fieldNum: 10, format: 'currency', higherIsBetter: false },
    { key: 'pricePerSqft', label: 'Price Per Sq Ft', path: 'address.pricePerSqft.value', fieldNum: 11, format: 'currency', higherIsBetter: false },
    { key: 'marketValueEstimate', label: 'Market Value Estimate', path: 'details.marketValueEstimate.value', fieldNum: 12, format: 'currency', higherIsBetter: true },
    { key: 'assessedValue', label: 'Assessed Value', path: 'details.assessedValue.value', fieldNum: 15, format: 'currency', higherIsBetter: true },
    { key: 'avms', label: 'AVMs (Average)', path: 'financial.avms.value', fieldNum: 16, format: 'currency', higherIsBetter: true },
    { key: 'lastSalePrice', label: 'Last Sale Price', path: 'details.lastSalePrice.value', fieldNum: 14, format: 'currency' },
    { key: 'lastSaleDate', label: 'Last Sale Date', path: 'details.lastSaleDate.value', fieldNum: 13, format: 'text' },
    { key: 'priceVsMedian', label: 'Price vs Median %', path: 'financial.priceVsMedianPercent.value', fieldNum: 94, format: 'percent', higherIsBetter: false },
    { key: 'medianHomePrice', label: 'Median Home Price (Neighborhood)', path: 'financial.medianHomePriceNeighborhood.value', fieldNum: 91, format: 'currency' },
    { key: 'pricePerSqftAvg', label: 'Price Per Sq Ft (Recent Avg)', path: 'financial.pricePerSqftRecentAvg.value', fieldNum: 92, format: 'currency' },
  ],
  cost: [
    // Annual Costs
    { key: 'annualTaxes', label: 'Annual Property Tax', path: 'details.annualTaxes.value', fieldNum: 35, format: 'currency', higherIsBetter: false },
    { key: 'propertyTaxRate', label: 'Property Tax Rate', path: 'financial.propertyTaxRate.value', fieldNum: 37, format: 'percent', higherIsBetter: false },
    { key: 'hoaFeeAnnual', label: 'HOA Fee (Annual)', path: 'details.hoaFeeAnnual.value', fieldNum: 31, format: 'currency', higherIsBetter: false },
    { key: 'insuranceEstAnnual', label: 'Insurance (Annual)', path: 'financial.insuranceEstAnnual.value', fieldNum: 97, format: 'currency', higherIsBetter: false },
    { key: 'cddFee', label: 'CDD Fee (Annual)', path: 'stellarMLS.legal.annualCddFee.value', fieldNum: 153, format: 'currency', higherIsBetter: false },
    { key: 'specialAssessments', label: 'Special Assessments', path: 'financial.specialAssessments.value', fieldNum: 138, format: 'text' },

    // Monthly Breakdown
    { key: 'monthlyPropertyTax', label: 'Monthly Property Tax', path: 'calculated.monthlyPropertyTax', format: 'currency', higherIsBetter: false, calculated: true },
    { key: 'monthlyHOA', label: 'Monthly HOA Fee', path: 'calculated.monthlyHOA', format: 'currency', higherIsBetter: false, calculated: true },
    { key: 'monthlyInsurance', label: 'Monthly Insurance', path: 'calculated.monthlyInsurance', format: 'currency', higherIsBetter: false, calculated: true },
    { key: 'avgElectricBill', label: 'Monthly Electric', path: 'utilities.avgElectricBill.value', fieldNum: 105, format: 'text', higherIsBetter: false },
    { key: 'avgWaterBill', label: 'Monthly Water', path: 'utilities.avgWaterBill.value', fieldNum: 107, format: 'text', higherIsBetter: false },
    { key: 'monthlyMaintenance', label: 'Monthly Maintenance Est.', path: 'calculated.monthlyMaintenance', format: 'currency', higherIsBetter: false, calculated: true },

    // Total Costs
    { key: 'monthlyCarryingCost', label: 'Total Monthly Cost', path: 'calculated.monthlyCarryingCost', format: 'currency', higherIsBetter: false, calculated: true },
    { key: 'annualCarryingCost', label: 'Total Annual Cost', path: 'calculated.annualCarryingCost', format: 'currency', higherIsBetter: false, calculated: true },
    { key: 'fiveYearCost', label: '5-Year Total Cost', path: 'calculated.fiveYearCost', format: 'currency', higherIsBetter: false, calculated: true },
  ],
  size: [
    { key: 'livingSqft', label: 'Living Sq Ft', path: 'details.livingSqft.value', fieldNum: 21, format: 'number', higherIsBetter: true },
    { key: 'totalSqftUnderRoof', label: 'Total Sq Ft Under Roof', path: 'details.totalSqftUnderRoof.value', fieldNum: 22, format: 'number', higherIsBetter: true },
    { key: 'lotSizeSqft', label: 'Lot Size (Sq Ft)', path: 'details.lotSizeSqft.value', fieldNum: 23, format: 'number', higherIsBetter: true },
    { key: 'lotSizeAcres', label: 'Lot Size (Acres)', path: 'details.lotSizeAcres.value', fieldNum: 24, format: 'number', higherIsBetter: true },
    { key: 'bedrooms', label: 'Bedrooms', path: 'details.bedrooms.value', fieldNum: 17, format: 'number', higherIsBetter: true },
    { key: 'fullBathrooms', label: 'Full Bathrooms', path: 'details.fullBathrooms.value', fieldNum: 18, format: 'number', higherIsBetter: true },
    { key: 'halfBathrooms', label: 'Half Bathrooms', path: 'details.halfBathrooms.value', fieldNum: 19, format: 'number', higherIsBetter: true },
    { key: 'totalBathrooms', label: 'Total Bathrooms', path: 'details.totalBathrooms.value', fieldNum: 20, format: 'number', higherIsBetter: true },
    { key: 'stories', label: 'Stories', path: 'details.stories.value', fieldNum: 27, format: 'number' },
    { key: 'floorsInUnit', label: 'Floors in Unit', path: 'stellarMLS.building.floorsInUnit.value', fieldNum: 148, format: 'number' },
  ],
  condition: [
    { key: 'yearBuilt', label: 'Year Built', path: 'details.yearBuilt.value', fieldNum: 25, format: 'number', higherIsBetter: true },
    { key: 'propertyAge', label: 'Property Age (Years)', path: 'calculated.propertyAge', format: 'number', higherIsBetter: false },
    { key: 'interiorCondition', label: 'Interior Condition', path: 'structural.interiorCondition.value', fieldNum: 48, format: 'text' },
    { key: 'recentRenovations', label: 'Recent Renovations', path: 'structural.recentRenovations.value', fieldNum: 59, format: 'text' },
    { key: 'roofType', label: 'Roof Type', path: 'structural.roofType.value', fieldNum: 39, format: 'text' },
    { key: 'roofAgeEst', label: 'Roof Age (Est)', path: 'structural.roofAgeEst.value', fieldNum: 40, format: 'text' },
    { key: 'hvacType', label: 'HVAC Type', path: 'structural.hvacType.value', fieldNum: 45, format: 'text' },
    { key: 'hvacAge', label: 'HVAC Age', path: 'structural.hvacAge.value', fieldNum: 46, format: 'text' },
    { key: 'permitHistoryRoof', label: 'Permit History - Roof', path: 'structural.permitHistoryRoof.value', fieldNum: 60, format: 'text' },
    { key: 'permitHistoryHvac', label: 'Permit History - HVAC', path: 'structural.permitHistoryHvac.value', fieldNum: 61, format: 'text' },
  ],
  interior: [
    { key: 'flooringType', label: 'Flooring Type', path: 'structural.flooringType.value', fieldNum: 49, format: 'text' },
    { key: 'kitchenFeatures', label: 'Kitchen Features', path: 'structural.kitchenFeatures.value', fieldNum: 50, format: 'text' },
    { key: 'appliancesIncluded', label: 'Appliances Included', path: 'structural.appliancesIncluded.value', fieldNum: 51, format: 'text' },
    { key: 'fireplaceYn', label: 'Fireplace', path: 'structural.fireplaceYn.value', fieldNum: 52, format: 'boolean' },
    { key: 'primaryBrLocation', label: 'Primary BR Location', path: 'structural.primaryBrLocation.value', fieldNum: 53, format: 'number' },
    { key: 'laundryType', label: 'Laundry Type', path: 'structural.laundryType.value', fieldNum: 47, format: 'text' },
    { key: 'interiorFeatures', label: 'Interior Features', path: 'stellarMLS.features.interiorFeatures.value', fieldNum: 167, format: 'text' },
    { key: 'smartHomeFeatures', label: 'Smart Home Features', path: 'utilities.smartHomeFeatures.value', fieldNum: 134, format: 'text' },
    { key: 'waterHeaterType', label: 'Water Heater Type', path: 'structural.waterHeaterType.value', fieldNum: 43, format: 'text' },
  ],
  exterior: [
    { key: 'exteriorMaterial', label: 'Exterior Material', path: 'structural.exteriorMaterial.value', fieldNum: 41, format: 'text' },
    { key: 'foundation', label: 'Foundation', path: 'structural.foundation.value', fieldNum: 42, format: 'text' },
    { key: 'poolYn', label: 'Pool', path: 'structural.poolYn.value', fieldNum: 54, format: 'boolean' },
    { key: 'poolType', label: 'Pool Type', path: 'structural.poolType.value', fieldNum: 55, format: 'text' },
    { key: 'deckPatio', label: 'Deck/Patio', path: 'structural.deckPatio.value', fieldNum: 56, format: 'text' },
    { key: 'fence', label: 'Fence', path: 'structural.fence.value', fieldNum: 57, format: 'text' },
    { key: 'landscaping', label: 'Landscaping', path: 'structural.landscaping.value', fieldNum: 58, format: 'text' },
    { key: 'lotFeatures', label: 'Lot Features', path: 'utilities.lotFeatures.value', fieldNum: 132, format: 'text' },
    { key: 'exteriorFeatures', label: 'Exterior Features', path: 'stellarMLS.features.exteriorFeatures.value', fieldNum: 168, format: 'text' },
    { key: 'frontExposure', label: 'Front Exposure', path: 'stellarMLS.legal.frontExposure.value', fieldNum: 154, format: 'text' },
  ],
  parking: [
    { key: 'garageSpaces', label: 'Garage Spaces', path: 'details.garageSpaces.value', fieldNum: 28, format: 'number', higherIsBetter: true },
    { key: 'garageType', label: 'Garage Type', path: 'structural.garageType.value', fieldNum: 44, format: 'text' },
    { key: 'garageAttached', label: 'Garage Attached', path: 'stellarMLS.parking.garageAttachedYn.value', fieldNum: 141, format: 'boolean' },
    { key: 'parkingTotal', label: 'Parking Total', path: 'details.parkingTotal.value', fieldNum: 29, format: 'text' },
    { key: 'carportYn', label: 'Carport', path: 'stellarMLS.parking.carportYn.value', fieldNum: 139, format: 'boolean' },
    { key: 'carportSpaces', label: 'Carport Spaces', path: 'stellarMLS.parking.carportSpaces.value', fieldNum: 140, format: 'number' },
    { key: 'parkingFeatures', label: 'Parking Features', path: 'stellarMLS.parking.parkingFeatures.value', fieldNum: 142, format: 'text' },
    { key: 'assignedParkingSpaces', label: 'Assigned Parking Spaces', path: 'stellarMLS.parking.assignedParkingSpaces.value', fieldNum: 143, format: 'number' },
    { key: 'evCharging', label: 'EV Charging', path: 'utilities.evChargingYn.value', fieldNum: 133, format: 'text' },
  ],
  building: [
    { key: 'propertyType', label: 'Property Type', path: 'details.propertyType.value', fieldNum: 26, format: 'text' },
    { key: 'floorNumber', label: 'Floor Number', path: 'stellarMLS.building.floorNumber.value', fieldNum: 144, format: 'number' },
    { key: 'buildingTotalFloors', label: 'Building Total Floors', path: 'stellarMLS.building.buildingTotalFloors.value', fieldNum: 145, format: 'number' },
    { key: 'buildingNameNumber', label: 'Building Name/Number', path: 'stellarMLS.building.buildingNameNumber.value', fieldNum: 146, format: 'text' },
    { key: 'buildingElevator', label: 'Building Elevator', path: 'stellarMLS.building.buildingElevatorYn.value', fieldNum: 147, format: 'boolean' },
    { key: 'ownershipType', label: 'Ownership Type', path: 'details.ownershipType.value', fieldNum: 34, format: 'text' },
  ],
  waterfront: [
    { key: 'waterFrontageYn', label: 'Water Frontage', path: 'stellarMLS.waterfront.waterFrontageYn.value', fieldNum: 155, format: 'boolean' },
    { key: 'waterfrontFeet', label: 'Waterfront Feet', path: 'stellarMLS.waterfront.waterfrontFeet.value', fieldNum: 156, format: 'number', higherIsBetter: true },
    { key: 'waterAccessYn', label: 'Water Access', path: 'stellarMLS.waterfront.waterAccessYn.value', fieldNum: 157, format: 'boolean' },
    { key: 'waterViewYn', label: 'Water View', path: 'stellarMLS.waterfront.waterViewYn.value', fieldNum: 158, format: 'boolean' },
    { key: 'waterBodyName', label: 'Water Body Name', path: 'stellarMLS.waterfront.waterBodyName.value', fieldNum: 159, format: 'text' },
    { key: 'viewType', label: 'View Type', path: 'utilities.viewType.value', fieldNum: 131, format: 'text' },
    { key: 'distanceBeach', label: 'Distance to Beach (mi)', path: 'location.distanceBeachMiles.value', fieldNum: 87, format: 'number', higherIsBetter: false },
  ],
  location: [
    { key: 'walkScore', label: 'Walk Score', path: 'location.walkScore.value', fieldNum: 74, format: 'number', higherIsBetter: true },
    { key: 'transitScore', label: 'Transit Score', path: 'location.transitScore.value', fieldNum: 75, format: 'number', higherIsBetter: true },
    { key: 'bikeScore', label: 'Bike Score', path: 'location.bikeScore.value', fieldNum: 76, format: 'number', higherIsBetter: true },
    { key: 'walkabilityDesc', label: 'Walkability Description', path: 'location.walkabilityDescription.value', fieldNum: 80, format: 'text' },
    { key: 'publicTransitAccess', label: 'Public Transit Access', path: 'location.publicTransitAccess.value', fieldNum: 81, format: 'text' },
    { key: 'commuteCityCenter', label: 'Commute to City Center', path: 'location.commuteTimeCityCenter.value', fieldNum: 82, format: 'text' },
    { key: 'noiseLevel', label: 'Noise Level', path: 'location.noiseLevel.value', fieldNum: 78, format: 'text', higherIsBetter: false },
    { key: 'noiseLevelDb', label: 'Noise Level (dB Est)', path: 'utilities.noiseLevelDbEst.value', fieldNum: 129, format: 'text', higherIsBetter: false },
    { key: 'trafficLevel', label: 'Traffic Level', path: 'location.trafficLevel.value', fieldNum: 79, format: 'text', higherIsBetter: false },
  ],
  schools: [
    { key: 'schoolDistrict', label: 'School District', path: 'location.schoolDistrictName.value', fieldNum: 63, format: 'text' },
    { key: 'elementarySchool', label: 'Elementary School', path: 'location.assignedElementary.value', fieldNum: 65, format: 'text' },
    { key: 'elementaryRating', label: 'Elementary Rating', path: 'location.elementaryRating.value', fieldNum: 66, format: 'rating', higherIsBetter: true },
    { key: 'elementaryDistance', label: 'Elementary Distance (mi)', path: 'location.elementaryDistanceMiles.value', fieldNum: 67, format: 'number', higherIsBetter: false },
    { key: 'middleSchool', label: 'Middle School', path: 'location.assignedMiddle.value', fieldNum: 68, format: 'text' },
    { key: 'middleRating', label: 'Middle Rating', path: 'location.middleRating.value', fieldNum: 69, format: 'rating', higherIsBetter: true },
    { key: 'middleDistance', label: 'Middle Distance (mi)', path: 'location.middleDistanceMiles.value', fieldNum: 70, format: 'number', higherIsBetter: false },
    { key: 'highSchool', label: 'High School', path: 'location.assignedHigh.value', fieldNum: 71, format: 'text' },
    { key: 'highRating', label: 'High Rating', path: 'location.highRating.value', fieldNum: 72, format: 'rating', higherIsBetter: true },
    { key: 'highDistance', label: 'High Distance (mi)', path: 'location.highDistanceMiles.value', fieldNum: 73, format: 'number', higherIsBetter: false },
  ],
  distances: [
    { key: 'distanceGrocery', label: 'Distance to Grocery (mi)', path: 'location.distanceGroceryMiles.value', fieldNum: 83, format: 'number', higherIsBetter: false },
    { key: 'distanceHospital', label: 'Distance to Hospital (mi)', path: 'location.distanceHospitalMiles.value', fieldNum: 84, format: 'number', higherIsBetter: false },
    { key: 'distanceAirport', label: 'Distance to Airport (mi)', path: 'location.distanceAirportMiles.value', fieldNum: 85, format: 'number', higherIsBetter: false },
    { key: 'distancePark', label: 'Distance to Park (mi)', path: 'location.distanceParkMiles.value', fieldNum: 86, format: 'number', higherIsBetter: false },
    { key: 'distanceBeach', label: 'Distance to Beach (mi)', path: 'location.distanceBeachMiles.value', fieldNum: 87, format: 'number', higherIsBetter: false },
    { key: 'emergencyServicesDistance', label: 'Emergency Services Distance', path: 'utilities.emergencyServicesDistance.value', fieldNum: 116, format: 'text', higherIsBetter: false },
  ],
  safety: [
    { key: 'safetyScore', label: 'Safety Score', path: 'location.safetyScore.value', fieldNum: 77, format: 'number', higherIsBetter: true },
    { key: 'violentCrimeIndex', label: 'Violent Crime Index', path: 'location.crimeIndexViolent.value', fieldNum: 88, format: 'text', higherIsBetter: false },
    { key: 'propertyCrimeIndex', label: 'Property Crime Index', path: 'location.crimeIndexProperty.value', fieldNum: 89, format: 'text', higherIsBetter: false },
    { key: 'neighborhoodSafetyRating', label: 'Neighborhood Safety Rating', path: 'location.neighborhoodSafetyRating.value', fieldNum: 90, format: 'text', higherIsBetter: true },
  ],
  community: [
    { key: 'hoaYn', label: 'HOA Required', path: 'details.hoaYn.value', fieldNum: 30, format: 'boolean' },
    { key: 'hoaName', label: 'HOA Name', path: 'details.hoaName.value', fieldNum: 32, format: 'text' },
    { key: 'hoaIncludes', label: 'HOA Includes', path: 'details.hoaIncludes.value', fieldNum: 33, format: 'text' },
    { key: 'communityFeatures', label: 'Community Features', path: 'stellarMLS.features.communityFeatures.value', fieldNum: 166, format: 'text' },
    { key: 'neighborhood', label: 'Neighborhood', path: 'address.neighborhoodName.value', fieldNum: 6, format: 'text' },
    { key: 'subdivisionName', label: 'Subdivision Name', path: 'stellarMLS.legal.subdivisionName.value', fieldNum: 149, format: 'text' },
  ],
  environmental: [
    { key: 'airQualityIndex', label: 'Air Quality Index', path: 'utilities.airQualityIndexCurrent.value', fieldNum: 117, format: 'text', higherIsBetter: false },
    { key: 'airQualityGrade', label: 'Air Quality Grade', path: 'utilities.airQualityGrade.value', fieldNum: 118, format: 'text', higherIsBetter: true },
    { key: 'floodZone', label: 'Flood Zone', path: 'utilities.floodZone.value', fieldNum: 119, format: 'text' },
    { key: 'floodRiskLevel', label: 'Flood Risk Level', path: 'utilities.floodRiskLevel.value', fieldNum: 120, format: 'text', higherIsBetter: false },
    { key: 'elevationFeet', label: 'Elevation (feet)', path: 'location.elevationFeet.value', fieldNum: 64, format: 'number', higherIsBetter: true },
    { key: 'climateRisk', label: 'Climate Risk', path: 'utilities.climateRiskWildfireFlood.value', fieldNum: 121, format: 'text', higherIsBetter: false },
    { key: 'wildfireRisk', label: 'Wildfire Risk', path: 'utilities.wildfireRisk.value', fieldNum: 122, format: 'text', higherIsBetter: false },
    { key: 'earthquakeRisk', label: 'Earthquake Risk', path: 'utilities.earthquakeRisk.value', fieldNum: 123, format: 'text', higherIsBetter: false },
    { key: 'hurricaneRisk', label: 'Hurricane Risk', path: 'utilities.hurricaneRisk.value', fieldNum: 124, format: 'text', higherIsBetter: false },
    { key: 'tornadoRisk', label: 'Tornado Risk', path: 'utilities.tornadoRisk.value', fieldNum: 125, format: 'text', higherIsBetter: false },
    { key: 'radonRisk', label: 'Radon Risk', path: 'utilities.radonRisk.value', fieldNum: 126, format: 'text', higherIsBetter: false },
    { key: 'superfundSiteNearby', label: 'Superfund Site Nearby', path: 'utilities.superfundNearby.value', fieldNum: 127, format: 'text', higherIsBetter: false },
    { key: 'seaLevelRiseRisk', label: 'Sea Level Rise Risk', path: 'utilities.seaLevelRiseRisk.value', fieldNum: 128, format: 'text', higherIsBetter: false },
    { key: 'solarPotential', label: 'Solar Potential', path: 'utilities.solarPotential.value', fieldNum: 130, format: 'text', higherIsBetter: true },
  ],
  utilities: [
    { key: 'electricProvider', label: 'Electric Provider', path: 'utilities.electricProvider.value', fieldNum: 104, format: 'text' },
    { key: 'waterProvider', label: 'Water Provider', path: 'utilities.waterProvider.value', fieldNum: 106, format: 'text' },
    { key: 'sewerProvider', label: 'Sewer Provider', path: 'utilities.sewerProvider.value', fieldNum: 108, format: 'text' },
    { key: 'naturalGas', label: 'Natural Gas', path: 'utilities.naturalGas.value', fieldNum: 109, format: 'text' },
    { key: 'trashProvider', label: 'Trash Provider', path: 'utilities.trashProvider.value', fieldNum: 110, format: 'text' },
    { key: 'internetProvidersTop3', label: 'Internet Providers (Top 3)', path: 'utilities.internetProvidersTop3.value', fieldNum: 111, format: 'text' },
    { key: 'maxInternetSpeed', label: 'Max Internet Speed', path: 'utilities.maxInternetSpeed.value', fieldNum: 112, format: 'text', higherIsBetter: true },
    { key: 'fiberAvailable', label: 'Fiber Available', path: 'utilities.fiberAvailable.value', fieldNum: 113, format: 'text', higherIsBetter: true },
    { key: 'cableTvProvider', label: 'Cable TV Provider', path: 'utilities.cableTvProvider.value', fieldNum: 114, format: 'text' },
    { key: 'cellCoverageQuality', label: 'Cell Coverage Quality', path: 'utilities.cellCoverageQuality.value', fieldNum: 115, format: 'text', higherIsBetter: true },
  ],
  investment: [
    { key: 'rentalEstimateMonthly', label: 'Rental Estimate (Monthly)', path: 'financial.rentalEstimateMonthly.value', fieldNum: 98, format: 'currency', higherIsBetter: true },
    { key: 'rentalYieldEst', label: 'Rental Yield (Est)', path: 'financial.rentalYieldEst.value', fieldNum: 99, format: 'percent', higherIsBetter: true },
    { key: 'capRateEst', label: 'Cap Rate (Est)', path: 'financial.capRateEst.value', fieldNum: 101, format: 'percent', higherIsBetter: true },
    { key: 'priceToRentRatio', label: 'Price to Rent Ratio', path: 'financial.priceToRentRatio.value', fieldNum: 93, format: 'number', higherIsBetter: false },
    { key: 'vacancyRateNeighborhood', label: 'Vacancy Rate (Neighborhood)', path: 'financial.vacancyRateNeighborhood.value', fieldNum: 100, format: 'percent', higherIsBetter: false },
    { key: 'daysOnMarketAvg', label: 'Days on Market (Avg)', path: 'financial.daysOnMarketAvg.value', fieldNum: 95, format: 'number', higherIsBetter: false },
    { key: 'inventorySurplus', label: 'Inventory Surplus', path: 'financial.inventorySurplus.value', fieldNum: 96, format: 'text' },
    { key: 'financingTerms', label: 'Financing Terms', path: 'financial.financingTerms.value', fieldNum: 102, format: 'text' },
    { key: 'comparableSales', label: 'Comparable Sales', path: 'financial.comparableSalesLast3.value', fieldNum: 103, format: 'text' },
  ],
  leasing: [
    { key: 'canBeLeasedYn', label: 'Can Be Leased', path: 'stellarMLS.leasing.canBeLeasedYn.value', fieldNum: 160, format: 'boolean' },
    { key: 'minimumLeasePeriod', label: 'Minimum Lease Period', path: 'stellarMLS.leasing.minimumLeasePeriod.value', fieldNum: 161, format: 'text' },
    { key: 'leaseRestrictionsYn', label: 'Lease Restrictions', path: 'stellarMLS.leasing.leaseRestrictionsYn.value', fieldNum: 162, format: 'boolean' },
    { key: 'petPolicy', label: 'Pet Policy', path: 'utilities.petPolicy.value', fieldNum: 136, format: 'text' },
    { key: 'petSizeLimit', label: 'Pet Size Limit', path: 'stellarMLS.leasing.petSizeLimit.value', fieldNum: 163, format: 'text' },
    { key: 'maxPetWeight', label: 'Max Pet Weight (lbs)', path: 'stellarMLS.leasing.maxPetWeight.value', fieldNum: 164, format: 'number' },
    { key: 'ageRestrictions', label: 'Age Restrictions', path: 'utilities.ageRestrictions.value', fieldNum: 137, format: 'text' },
    { key: 'associationApprovalYn', label: 'Association Approval Required', path: 'stellarMLS.leasing.associationApprovalYn.value', fieldNum: 165, format: 'boolean' },
    { key: 'accessibilityModifications', label: 'Accessibility Modifications', path: 'utilities.accessibilityMods.value', fieldNum: 135, format: 'text' },
  ],
  legal: [
    { key: 'parcelId', label: 'Parcel ID', path: 'details.parcelId.value', fieldNum: 9, format: 'text' },
    { key: 'legalDescription', label: 'Legal Description', path: 'stellarMLS.legal.legalDescription.value', fieldNum: 150, format: 'text' },
    { key: 'county', label: 'County', path: 'address.county.value', fieldNum: 7, format: 'text' },
    { key: 'taxYear', label: 'Tax Year', path: 'details.taxYear.value', fieldNum: 36, format: 'number' },
    { key: 'taxExemptions', label: 'Tax Exemptions', path: 'financial.taxExemptions.value', fieldNum: 38, format: 'text' },
    { key: 'homesteadYn', label: 'Homestead Exemption', path: 'stellarMLS.legal.homesteadYn.value', fieldNum: 151, format: 'boolean' },
    { key: 'cddYn', label: 'CDD', path: 'stellarMLS.legal.cddYn.value', fieldNum: 152, format: 'boolean' },
    { key: 'mlsPrimary', label: 'MLS Primary', path: 'address.mlsPrimary.value', fieldNum: 2, format: 'text' },
    { key: 'newConstructionYN', label: 'New Construction', path: 'address.newConstructionYN.value', fieldNum: 3, format: 'boolean' },
    { key: 'listingStatus', label: 'Listing Status', path: 'address.listingStatus.value', fieldNum: 4, format: 'text' },
    { key: 'listingDate', label: 'Listing Date', path: 'address.listingDate.value', fieldNum: 5, format: 'text' },
    { key: 'permitHistoryOther', label: 'Permit History - Other', path: 'structural.permitHistoryPoolAdditions.value', fieldNum: 62, format: 'text' },
  ],
  // NEW: Schema Group H - Permits & Renovations (Fields 59-62)
  permits: [
    { key: 'recentRenovations', label: 'Recent Renovations', path: 'structural.recentRenovations.value', fieldNum: 59, format: 'text' },
    { key: 'permitHistoryRoof', label: 'Permit History - Roof', path: 'structural.permitHistoryRoof.value', fieldNum: 60, format: 'text' },
    { key: 'permitHistoryHvac', label: 'Permit History - HVAC', path: 'structural.permitHistoryHvac.value', fieldNum: 61, format: 'text' },
    { key: 'permitHistoryOther', label: 'Permit History - Other', path: 'structural.permitHistoryPoolAdditions.value', fieldNum: 62, format: 'text' },
  ],
  // NEW: Schema Group P - Additional Features (Fields 131-138)
  additional: [
    { key: 'viewType', label: 'View Type', path: 'features.viewType.value', fieldNum: 131, format: 'text' },
    { key: 'lotFeatures', label: 'Lot Features', path: 'features.lotFeatures.value', fieldNum: 132, format: 'text' },
    { key: 'evCharging', label: 'EV Charging', path: 'features.evCharging.value', fieldNum: 133, format: 'text' },
    { key: 'smartHomeFeatures', label: 'Smart Home Features', path: 'features.smartHomeFeatures.value', fieldNum: 134, format: 'text' },
    { key: 'accessibilityMods', label: 'Accessibility Modifications', path: 'features.accessibilityMods.value', fieldNum: 135, format: 'text' },
    { key: 'petPolicy', label: 'Pet Policy', path: 'features.petPolicy.value', fieldNum: 136, format: 'text' },
    { key: 'ageRestrictions', label: 'Age Restrictions', path: 'features.ageRestrictions.value', fieldNum: 137, format: 'text' },
    { key: 'specialAssessments', label: 'Special Assessments', path: 'features.specialAssessments.value', fieldNum: 138, format: 'text' },
  ],
  // NEW: Schema Group V - Features (Fields 166-168)
  features: [
    { key: 'communityFeatures', label: 'Community Features', path: 'stellarMLS.features.communityFeatures.value', fieldNum: 166, format: 'text' },
    { key: 'interiorFeatures', label: 'Interior Features', path: 'stellarMLS.features.interiorFeatures.value', fieldNum: 167, format: 'text' },
    { key: 'exteriorFeatures', label: 'Exterior Features', path: 'stellarMLS.features.exteriorFeatures.value', fieldNum: 168, format: 'text' },
  ],
  // NEW: Schema Group W - Market Performance (Fields 169-181)
  marketperf: [
    { key: 'zillowViews', label: 'Zillow Views', path: 'marketPerformance.zillowViews.value', fieldNum: 169, format: 'number', higherIsBetter: true },
    { key: 'redfinViews', label: 'Redfin Views', path: 'marketPerformance.redfinViews.value', fieldNum: 170, format: 'number', higherIsBetter: true },
    { key: 'homesViews', label: 'Homes.com Views', path: 'marketPerformance.homesViews.value', fieldNum: 171, format: 'number', higherIsBetter: true },
    { key: 'realtorViews', label: 'Realtor.com Views', path: 'marketPerformance.realtorViews.value', fieldNum: 172, format: 'number', higherIsBetter: true },
    { key: 'savesFavorites', label: 'Saves/Favorites', path: 'marketPerformance.savesFavorites.value', fieldNum: 174, format: 'number', higherIsBetter: true },
    { key: 'marketType', label: 'Market Type', path: 'marketPerformance.marketType.value', fieldNum: 175, format: 'text' },
    { key: 'avgSaleToListPercent', label: 'Avg Sale-to-List %', path: 'marketPerformance.avgSaleToListPercent.value', fieldNum: 176, format: 'percent' },
    { key: 'avgDaysToPending', label: 'Avg Days to Pending', path: 'marketPerformance.avgDaysToPending.value', fieldNum: 177, format: 'number', higherIsBetter: false },
    { key: 'multipleOffersLikelihood', label: 'Multiple Offers Likelihood', path: 'marketPerformance.multipleOffersLikelihood.value', fieldNum: 178, format: 'text' },
    { key: 'priceTrend', label: 'Price Trend', path: 'marketPerformance.priceTrend.value', fieldNum: 180, format: 'text' },
    { key: 'rentZestimate', label: 'Rent Zestimate', path: 'marketPerformance.rentZestimate.value', fieldNum: 181, format: 'currency' },
  ],
};

// Property selector dropdown component
function PropertySelector({
  slot,
  selectedId,
  onSelect,
  onClear,
  properties,
  excludeIds,
  getCalculatedScore
}: {
  slot: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
  properties: PropertyCard[];
  excludeIds: string[];
  getCalculatedScore: (propertyId: string) => number;
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
              <span className="text-gray-400">Price/SF:</span>
              <span className="text-white ml-1">
                {selectedProperty.pricePerSqft > 0 ? `$${Math.round(selectedProperty.pricePerSqft)}` : '—'}
              </span>
            </div>
            <div className="bg-white/5 rounded px-2 py-1">
              <span className="text-gray-400">Beds:</span>
              <span className="text-white ml-1">{selectedProperty.bedrooms || '—'}</span>
            </div>
            <div className="bg-white/5 rounded px-2 py-1">
              <span className="text-gray-400">Sqft:</span>
              <span className="text-white ml-1">
                {selectedProperty.sqft > 0 ? selectedProperty.sqft.toLocaleString() : '—'}
              </span>
            </div>
            <div className="bg-white/5 rounded px-2 py-1 col-span-2">
              <span className="text-gray-400">Score:</span>
              <span className="text-quantum-cyan ml-1">
                {getCalculatedScore(selectedProperty.id).toFixed(1)}
              </span>
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
                        <p className="text-xs text-gray-400">
                          Score: {getCalculatedScore(property.id).toFixed(1)}
                        </p>
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
  fullProperties,
  smartScores
}: {
  selectedProperties: PropertyCard[];
  fullProperties: Map<string, Property>;
  smartScores: (any | null)[];
}) {
  const analytics = useMemo(() => {
    if (selectedProperties.length < 2) return null;

    const pricePerSqft = selectedProperties.map(p => p.pricePerSqft);
    const lowestPricePerSqft = Math.min(...pricePerSqft);
    const lowestPriceProperty = selectedProperties.find(p => p.pricePerSqft === lowestPricePerSqft);

    // Calculate average price per square foot
    const avgPricePerSqft = pricePerSqft.reduce((a, b) => a + b, 0) / pricePerSqft.length;

    // Use calculated smartScores from prop instead of PropertyCard.smartScore
    const validScores = smartScores.filter(s => s !== null).map(s => s!.finalScore);
    const highestScore = validScores.length > 0 ? Math.max(...validScores) : undefined;
    const bestScoreIndex = highestScore !== undefined ? smartScores.findIndex(s => s?.finalScore === highestScore) : -1;
    const bestScoreProperty = bestScoreIndex !== -1 ? selectedProperties[bestScoreIndex] : undefined;

    const prices = selectedProperties.map(p => p.price);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    return {
      bestValue: lowestPriceProperty,
      bestScore: bestScoreProperty,
      avgPrice,
      avgPricePerSqft,
      priceSpread: Math.max(...prices) - Math.min(...prices),
      completenessAvg: selectedProperties.reduce((a, b) => a + b.dataCompleteness, 0) / selectedProperties.length,
    };
  }, [selectedProperties, smartScores]);

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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <Home className="w-4 h-4 text-quantum-gold" />
            <span className="text-xs text-gray-400">Avg Price/SF (All)</span>
          </div>
          <p className="text-lg font-semibold text-white">${Math.round(analytics.avgPricePerSqft)}</p>
          <p className="text-xs text-gray-400">Across all properties</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-quantum-cyan" />
            <span className="text-xs text-gray-400">Highest Score</span>
          </div>
          <p className="text-sm font-medium text-white truncate">{analytics.bestScore?.address || 'N/A'}</p>
          <p className="text-xs text-quantum-cyan">
            Score: {analytics.bestScore ? (() => {
              const idx = selectedProperties.findIndex(p => p.id === analytics.bestScore?.id);
              return (idx !== -1 && smartScores[idx]) ? smartScores[idx].finalScore.toFixed(1) : 'N/A';
            })() : 'N/A'}
          </p>
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
            <span className="text-xs text-gray-400">Avg Completeness (All)</span>
          </div>
          <p className="text-lg font-semibold text-white">{analytics.completenessAvg.toFixed(0)}%</p>
          <p className="text-xs text-gray-400">Across all properties</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Compare() {
  const { properties, fullProperties, compareList, addToCompare, removeFromCompare } = usePropertyStore();

  // Initialize from compareList if available - VALIDATE IDs exist in current properties
  const [selectedIds, setSelectedIds] = useState<(string | null)[]>(() => {
    if (compareList.length > 0) {
      // CRITICAL FIX: Only use IDs that exist in current properties array
      const validIds = compareList
        .slice(0, 3)
        .filter(id => properties.some(p => p.id === id));

      const ids: (string | null)[] = [...validIds];
      while (ids.length < 3) ids.push(null);
      return ids;
    }
    return [null, null, null];
  });
  const [activeCategory, setActiveCategory] = useState('overview');
  const [showAllFields, setShowAllFields] = useState(false);
  const [viewMode, setViewMode] = useState<CompareViewMode>('table');
  const [showVisualAnalytics, setShowVisualAnalytics] = useState(false);

  // CRITICAL FIX: Clean up stale IDs from compareList when properties change
  useEffect(() => {
    const validPropertyIds = new Set(properties.map(p => p.id));
    const staleIds = compareList.filter(id => !validPropertyIds.has(id));

    if (staleIds.length > 0) {
      console.warn('[Compare] Removing stale property IDs from compareList:', staleIds);
      staleIds.forEach(id => removeFromCompare(id));
    }
  }, [properties, compareList, removeFromCompare]);

  // Olivia AI state
  const [oliviaResult, setOliviaResult] = useState<OliviaAnalysisResult | null>(null);
  const [oliviaLoading, setOliviaLoading] = useState(false);
  const [oliviaError, setOliviaError] = useState<string | null>(null);

  // Olivia Enhanced (181-field analysis)
  const [useEnhancedOlivia, setUseEnhancedOlivia] = useState(true); // Toggle: true = new UI, false = old UI
  const [oliviaEnhancedResult, setOliviaEnhancedResult] = useState<OliviaEnhancedAnalysisResult | null>(null);

  // Olivia Analysis (NEW! - user-controlled 4-level analysis)
  const [showProgressiveAnalysis, setShowProgressiveAnalysis] = useState(false);

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

  // Calculate SMART Scores for each selected property
  const smartScores = useMemo(() => {
    return selectedProperties.map(propCard => {
      const fullProp = fullProperties.get(propCard.id);
      if (!fullProp) return null;

      try {
        return calculateSmartScore(fullProp, getCurrentWeights(), getWeightsSource());
      } catch (error) {
        console.error('Error calculating SMART Score:', error);
        return null;
      }
    });
  }, [selectedProperties, fullProperties]);

  // Helper to get calculated SMART Score for a property card
  const getCalculatedScore = (propertyId: string): number => {
    const index = selectedProperties.findIndex(p => p.id === propertyId);
    if (index !== -1 && smartScores[index]) {
      return smartScores[index].finalScore;
    }
    // Calculate on-demand for dropdown/non-selected properties (unified scoring)
    const fullProp = fullProperties.get(propertyId);
    if (fullProp) {
      try {
        const score = calculateSmartScore(fullProp, getCurrentWeights(), getWeightsSource());
        return score.finalScore;
      } catch (error) {
        console.error('Error calculating SMART Score for', propertyId, error);
        return 0;  // Consistent fallback
      }
    }
    return 0;
  };

  const handleSelect = (slot: number, id: string) => {
    const newIds = [...selectedIds];
    const oldId = newIds[slot];
    newIds[slot] = id;
    setSelectedIds(newIds);

    // Sync with store's compareList
    if (oldId && oldId !== id) {
      removeFromCompare(oldId);
    }
    if (!compareList.includes(id)) {
      addToCompare(id);
    }
  };

  const handleClear = (slot: number) => {
    const newIds = [...selectedIds];
    const oldId = newIds[slot];
    newIds[slot] = null;
    setSelectedIds(newIds);

    // Remove from store's compareList
    if (oldId) {
      removeFromCompare(oldId);
    }
  };

  const excludeIds = selectedIds.filter((id): id is string => id !== null);

  const currentFields = comparisonFields[activeCategory] || [];

  // Handle Ask Olivia
  const handleAskOlivia = async () => {
    setOliviaLoading(true);
    setOliviaError(null);
    try {
      const result = await analyzeWithOlivia({
        properties: selectedProperties.map((p, idx) => ({
          id: p.id,
          address: p.address,
          city: p.city,
          price: p.price,
          sqft: p.sqft,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          yearBuilt: p.yearBuilt,
          pricePerSqft: p.pricePerSqft,
          smartScore: smartScores[idx]?.finalScore || p.smartScore || 50,
        }))
      });
      setOliviaResult(result);
    } catch (err) {
      setOliviaError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setOliviaLoading(false);
    }
  };

  /**
   * Enhanced Olivia Analysis with 181 fields and mathematical proofs
   */
  const handleAskOliviaEnhanced = async () => {
    // Validation
    if (selectedProperties.length !== 3) {
      setOliviaError('Olivia Enhanced requires exactly 3 properties for mathematical comparison');
      return;
    }

    setOliviaLoading(true);
    setOliviaError(null);
    setOliviaEnhancedResult(null);

    try {
      console.log('🧮 Starting Olivia Enhanced analysis (181 fields)...');

      // Extract all 181 fields from each selected property
      const enhancedProperties = selectedProperties
        .map(prop => {
          // Get full property data from store
          const fullProp = fullProperties.get(prop.id);

          if (!fullProp) {
            console.warn(`⚠️ Full property data not found for ${prop.id} - skipping from enhanced analysis`);
            return null;
          }

          // Extract all 181 fields
          return extractPropertyData(fullProp);
        })
        .filter((prop): prop is NonNullable<typeof prop> => prop !== null);

      console.log('📊 Extracted fields from', enhancedProperties.length, 'properties');

      if (enhancedProperties.length === 0) {
        throw new Error('No properties with full data available for enhanced analysis. Please search properties using the Search tab to get complete data.');
      }

      // Call PROGRESSIVE enhanced mathematical analysis API (4-level)
      // This processes all 181 fields in 4 sequential calls to avoid token limits
      const result = await analyzeWithOliviaProgressive({
        properties: enhancedProperties,
        buyerProfile: 'investor', // TODO: Get from user settings or add selector
        includeMarketForecast: true,
      });

      console.log('✅ Enhanced analysis complete');

      // CRITICAL: Check for hallucinations
      if (result.validation && !result.validation.isValid) {
        console.warn('⚠️ Validation warnings detected:');
        console.warn('Errors:', result.validation.errors);
        console.warn('Warnings:', result.validation.warnings);
        console.warn('Hallucinations:', result.validation.hallucinations);

        // Show warning to user but still display results
        setOliviaError(
          `Analysis completed with ${result.validation.hallucinations.length} validation warnings. ` +
          `Check console for details.`
        );
      } else {
        console.log('✅ Validation passed - no hallucinations detected');
      }

      setOliviaEnhancedResult(result);
    } catch (error) {
      console.error('❌ Enhanced analysis failed:', error);
      setOliviaError(
        error instanceof Error
          ? `Enhanced analysis failed: ${error.message}`
          : 'Enhanced analysis failed. Please try again.'
      );
    } finally {
      setOliviaLoading(false);
    }
  };

  return (
    <motion.div
      className="px-4 py-6 md:px-8 md:py-10 max-w-7xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="mb-8">
        <div className="flex flex-col items-center gap-6">
          {/* Centered Header */}
          <div className="text-center">
            <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-gradient-quantum mb-2">
              Advanced Comparison Analytics
            </h1>
            <p className="text-gray-400">
              Select up to 3 properties for side-by-side comparison
            </p>
          </div>

          {/* OLIVIA ANALYSIS BUTTON - Centered below header */}
          {selectedProperties.length === 3 && (
            <button
              onClick={() => setShowProgressiveAnalysis(!showProgressiveAnalysis)}
              className="flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-semibold transition-all bg-gradient-to-r from-blue-600 via-orange-500 to-amber-400 text-white hover:shadow-2xl hover:scale-105 shadow-xl transform"
            >
              <Brain className="w-6 h-6" />
              Advanced Olivia Analysis
            </button>
          )}

          {/* View Mode Toggle Buttons - Centered below Olivia button */}
          {selectedProperties.length >= 2 && (
            <div className="flex gap-2 flex-wrap justify-center">
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
              <button
                onClick={() => setViewMode('diagnostic')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  viewMode === 'diagnostic'
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                Score Analytics
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
            getCalculatedScore={getCalculatedScore}
          />
        ))}
      </div>

      {/* Olivia AI Results - Conditional Rendering */}
      {useEnhancedOlivia ? (
        /* Enhanced UI - 168 fields */
        oliviaEnhancedResult && (
          <div className="mb-6">
            <OliviaExecutiveReport
              result={oliviaEnhancedResult}
              properties={selectedProperties.map(p => ({
                id: p.id,
                address: p.address,
                city: p.city
              }))}
              onClose={() => setOliviaEnhancedResult(null)}
            />
          </div>
        )
      ) : (
        /* Classic UI - 10 fields (existing, unchanged) */
        oliviaResult && (
          <div className="mb-6">
            <OliviaResults
              result={oliviaResult}
              properties={selectedProperties.map(p => ({
                id: p.id,
                address: p.address,
                city: p.city
              }))}
              onClose={() => setOliviaResult(null)}
            />
          </div>
        )
      )}

      {/* Olivia Error */}
      {oliviaError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-sm font-semibold mb-1">
                {useEnhancedOlivia ? 'Olivia Enhanced Error' : 'Olivia Error'}
              </p>
              <p className="text-red-300 text-sm">{oliviaError}</p>
            </div>
          </div>
        </div>
      )}

      {/* PROGRESSIVE ANALYSIS PANEL (NEW!) */}
      {showProgressiveAnalysis && selectedProperties.length === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <ProgressiveAnalysisPanel
            properties={selectedProperties
              .map(prop => {
                const fullProp = fullProperties.get(prop.id);
                return fullProp ? extractPropertyData(fullProp) : null;
              })
              .filter((prop): prop is NonNullable<typeof prop> => prop !== null)}
            onComplete={(results) => {
              console.log('✅ Olivia Analysis Complete:', results);
              setOliviaEnhancedResult(results);
              // Keep panel open so user can review all levels
            }}
          />
        </motion.div>
      )}

      {/* Analytics Summary */}
      {selectedProperties.length >= 2 && (
        <AnalyticsSummary
          selectedProperties={selectedProperties}
          fullProperties={fullProperties}
          smartScores={smartScores}
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

      {/* Diagnostic View Content */}
      {viewMode === 'diagnostic' && (
        <div className="mb-6">
          {selectedFullProperties.length > 0 ? (
            <div className="space-y-6">
              {selectedFullProperties.map((fullProp, index) => {
                const cardProp = selectedProperties[index];
                return (
                  <div key={fullProp.id} className="glass-card p-6 rounded-2xl">
                    <div className="mb-4 pb-4 border-b border-white/10">
                      <h3 className="text-xl font-semibold text-white">
                        Property {index + 1}: {cardProp.address}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {cardProp.city}, {cardProp.state} • SMART Score: {smartScores[index]?.finalScore.toFixed(1) || 'N/A'}
                      </p>
                    </div>
                    <SMARTScoreDiagnostic property={fullProp} compact={false} />
                  </div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-8 text-center"
            >
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-400 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">No Properties Selected</h3>
              <p className="text-gray-400">
                Please select at least one property above to view field diagnostics.
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* Table View Content */}
      {viewMode === 'table' && (
        <>
          {/* Category Tabs */}
          {selectedProperties.length >= 2 && (
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              {fieldCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all w-72 ${
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
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  console.group('[Compare] Field Availability Diagnostic');
                  selectedIds.filter((id) => id !== null).forEach(id => {
                    const fullProp = fullProperties.get(id);
                    const cardProp = properties.find(p => p.id === id);
                    console.group('Property: ' + (cardProp?.address || id));
                    console.log('Full Property exists:', !!fullProp);
                    if (fullProp) {
                      ['address', 'details', 'structural', 'location', 'financial', 'utilities', 'stellarMLS'].forEach(group => {
                        const groupData = (fullProp as any)[group];
                        if (groupData) {
                          const populated = Object.entries(groupData).filter(([_, v]: [string, any]) => v && v.value !== null && v.value !== undefined).map(([k]) => k);
                          const nullFields = Object.entries(groupData).filter(([_, v]: [string, any]) => !v || v.value === null || v.value === undefined).map(([k]) => k);
                          console.log(group + ': ' + populated.length + ' populated, ' + nullFields.length + ' null');
                        }
                      });
                    }
                    console.groupEnd();
                  });
                  console.groupEnd();
                }}
                className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                Debug Fields
              </button>
              <button
                onClick={() => setShowAllFields(!showAllFields)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${showAllFields ? 'rotate-180' : ''} transition-transform`} />
                {showAllFields ? 'Show Key Fields' : 'Show All Fields'}
              </button>
            </div>
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
                          // Calculated fields
                          if (field.path === 'calculated.propertyAge') {
                            const yearBuilt = fullProp ? getFieldValue<number>(fullProp.details?.yearBuilt) : cardProp?.yearBuilt;
                            if (yearBuilt) {
                              const currentYear = new Date().getFullYear();
                              return currentYear - yearBuilt;
                            }
                          }

                          // Monthly cost calculations (annual / 12)
                          if (field.path === 'calculated.monthlyPropertyTax') {
                            const annualTaxes = fullProp ? getFieldValue<number>(fullProp.details?.annualTaxes) : null;
                            return annualTaxes ? Math.round(annualTaxes / 12) : null;
                          }
                          if (field.path === 'calculated.monthlyHOA') {
                            const hoaFeeAnnual = fullProp ? getFieldValue<number>(fullProp.details?.hoaFeeAnnual) : null;
                            return hoaFeeAnnual ? Math.round(hoaFeeAnnual / 12) : null;
                          }
                          if (field.path === 'calculated.monthlyInsurance') {
                            const insuranceEstAnnual = fullProp ? getFieldValue<number>(fullProp.financial?.insuranceEstAnnual) : null;
                            return insuranceEstAnnual ? Math.round(insuranceEstAnnual / 12) : null;
                          }
                          if (field.path === 'calculated.monthlyMaintenance') {
                            // Estimate 1% of property value per year, divided by 12
                            const price = cardProp?.price || 0;
                            return price ? Math.round((price * 0.01) / 12) : null;
                          }

                          // Total monthly carrying cost (sum of all monthly costs)
                          if (field.path === 'calculated.monthlyCarryingCost') {
                            const annualTaxes = fullProp ? getFieldValue<number>(fullProp.details?.annualTaxes) : null;
                            const hoaFeeAnnual = fullProp ? getFieldValue<number>(fullProp.details?.hoaFeeAnnual) : null;
                            const insuranceEstAnnual = fullProp ? getFieldValue<number>(fullProp.financial?.insuranceEstAnnual) : null;
                            const price = cardProp?.price || 0;

                            const monthlyTax = annualTaxes ? annualTaxes / 12 : 0;
                            const monthlyHOA = hoaFeeAnnual ? hoaFeeAnnual / 12 : 0;
                            const monthlyInsurance = insuranceEstAnnual ? insuranceEstAnnual / 12 : 0;
                            const monthlyMaintenance = price ? (price * 0.01) / 12 : 0;

                            const total = monthlyTax + monthlyHOA + monthlyInsurance + monthlyMaintenance;
                            return total > 0 ? Math.round(total) : null;
                          }

                          // Annual carrying cost
                          if (field.path === 'calculated.annualCarryingCost') {
                            const annualTaxes = fullProp ? getFieldValue<number>(fullProp.details?.annualTaxes) : null;
                            const hoaFeeAnnual = fullProp ? getFieldValue<number>(fullProp.details?.hoaFeeAnnual) : null;
                            const insuranceEstAnnual = fullProp ? getFieldValue<number>(fullProp.financial?.insuranceEstAnnual) : null;
                            const price = cardProp?.price || 0;

                            const totalAnnual = (annualTaxes || 0) + (hoaFeeAnnual || 0) + (insuranceEstAnnual || 0) + (price * 0.01);
                            return totalAnnual > 0 ? Math.round(totalAnnual) : null;
                          }

                          // 5-year total cost
                          if (field.path === 'calculated.fiveYearCost') {
                            const annualTaxes = fullProp ? getFieldValue<number>(fullProp.details?.annualTaxes) : null;
                            const hoaFeeAnnual = fullProp ? getFieldValue<number>(fullProp.details?.hoaFeeAnnual) : null;
                            const insuranceEstAnnual = fullProp ? getFieldValue<number>(fullProp.financial?.insuranceEstAnnual) : null;
                            const price = cardProp?.price || 0;

                            const totalAnnual = (annualTaxes || 0) + (hoaFeeAnnual || 0) + (insuranceEstAnnual || 0) + (price * 0.01);
                            return totalAnnual > 0 ? Math.round(totalAnnual * 5) : null;
                          }

                          return null;
                        }
                        if (field.path.startsWith('card.')) {
                          return cardProp ? getNestedValue(cardProp, field.path) : null;
                        }

                        // Handle property paths (address.*, details.*, location.*, etc.)
                        if (fullProp) {
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

      {/* SMART Score Breakdown Section */}
      {smartScores.some(s => s !== null) && selectedProperties.length > 0 && (
        <div className="mt-12">
          <h2 className="text-3xl font-orbitron font-bold text-quantum-cyan mb-8">
            SMART Score Analysis
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {smartScores.map((scoreResult, idx) => {
              if (!scoreResult) return null;

              const propCard = selectedProperties[idx];

              return (
                <div key={propCard.id} className="glass-card p-6">
                  <h3 className="text-xl font-orbitron text-white mb-4">
                    {propCard.address}
                  </h3>

                  <SMARTScoreDisplay
                    smartScore={scoreResult.finalScore}
                    sectionBreakdown={scoreResult.sectionBreakdown}
                    dataCompleteness={scoreResult.dataCompleteness}
                    confidenceLevel={scoreResult.confidenceLevel}
                    compact={true}
                  />
                </div>
              );
            })}
          </div>
        </div>
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
                Some properties only have basic card data. Full 181-field comparison requires complete property data.
                View individual property details to see all available fields.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
