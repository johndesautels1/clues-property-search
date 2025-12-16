/**
 * OLIVIA ENHANCED - 168-Field Intelligence System
 * Comprehensive TypeScript interfaces for Olivia's brain
 *
 * This file defines all data structures for:
 * - 168-field property analysis
 * - 22-section executive appraisal report
 * - Multi-LLM market forecasting
 * - HeyGen avatar integration
 * - Interactive Q&A system
 */

import type { Property } from '@/types/property';
import type { ALL_FIELDS } from '@/types/fields-schema';

// ============================================================================
// PROPERTY INPUT (ALL 168 FIELDS)
// ============================================================================

export interface OliviaEnhancedPropertyInput {
  // Property identification
  id: string;

  // All 168 fields extracted from Property type
  // GROUP 1: Address & Identity (1-9)
  full_address: string;
  mls_primary?: string;
  mls_secondary?: string;
  listing_status?: string;
  listing_date?: string;
  neighborhood?: string;
  county?: string;
  zip_code?: string;
  parcel_id?: string;

  // GROUP 2: Pricing & Value (10-16)
  listing_price?: number;
  price_per_sqft?: number;
  market_value_estimate?: number;
  last_sale_date?: string;
  last_sale_price?: number;
  assessed_value?: number;
  redfin_estimate?: number;

  // GROUP 3: Property Basics (17-29)
  bedrooms: number;
  full_bathrooms: number;
  half_bathrooms?: number;
  total_bathrooms?: number;
  living_sqft: number;
  total_sqft_under_roof?: number;
  lot_size_sqft?: number;
  lot_size_acres?: number;
  year_built: number;
  property_type: string;
  stories?: number;
  garage_spaces?: number;
  parking_total?: string;

  // GROUP 4: HOA & Taxes (30-38)
  hoa_yn?: boolean;
  hoa_fee_annual?: number;
  hoa_name?: string;
  hoa_includes?: string;
  ownership_type?: string;
  annual_taxes?: number;
  tax_year?: number;
  property_tax_rate?: number;
  tax_exemptions?: string;

  // GROUP 5: Structure & Systems (39-48)
  roof_type?: string;
  roof_age_est?: string;
  exterior_material?: string;
  foundation?: string;
  water_heater_type?: string;
  garage_type?: string;
  hvac_type?: string;
  hvac_age?: string;
  laundry_type?: string;
  interior_condition?: string;

  // GROUP 6: Interior Features (49-53)
  flooring_type?: string;
  kitchen_features?: string;
  appliances_included?: string[];
  fireplace_yn?: boolean;
  fireplace_count?: number;

  // GROUP 7: Exterior Features (54-58)
  pool_yn?: boolean;
  pool_type?: string[];
  deck_patio?: string;
  fence?: string;
  landscaping?: string;

  // GROUP 8: Permits & Renovations (59-62)
  recent_renovations?: string;
  permit_history_roof?: string;
  permit_history_hvac?: string;
  permit_history_other?: string;

  // GROUP 9: Assigned Schools (63-73)
  school_district?: string;
  elevation_feet?: number;
  elementary_school?: string;
  elementary_rating?: string;
  elementary_distance_mi?: number;
  middle_school?: string;
  middle_rating?: string;
  middle_distance_mi?: number;
  high_school?: string;
  high_rating?: string;
  high_distance_mi?: number;

  // GROUP 10: Location Scores (74-82)
  walk_score?: number;
  transit_score?: number;
  bike_score?: number;
  safety_score?: number;
  noise_level?: string;
  traffic_level?: string;
  walkability_description?: string;
  public_transit_access?: string;
  commute_to_city_center?: string;

  // GROUP 11: Distances & Amenities (83-87)
  distance_grocery_mi?: number;
  distance_hospital_mi?: number;
  distance_airport_mi?: number;
  distance_park_mi?: number;
  distance_beach_mi?: number;

  // GROUP 12: Safety & Crime (88-90)
  violent_crime_index?: string;
  property_crime_index?: string;
  neighborhood_safety_rating?: string;

  // GROUP 13: Market & Investment Data (91-103)
  median_home_price_neighborhood?: number;
  price_per_sqft_recent_avg?: number;
  price_to_rent_ratio?: number;
  price_vs_median_percent?: number;
  days_on_market_avg?: number;
  inventory_surplus?: string;
  insurance_est_annual?: number;
  rental_estimate_monthly?: number;
  rental_yield_est?: number;
  vacancy_rate_neighborhood?: number;
  cap_rate_est?: number;
  financing_terms?: string;
  comparable_sales?: string;

  // GROUP 14: Utilities & Connectivity (104-116)
  electric_provider?: string;
  avg_electric_bill?: string;
  water_provider?: string;
  avg_water_bill?: string;
  sewer_provider?: string;
  natural_gas?: string;
  trash_provider?: string;
  internet_providers_top3?: string;
  max_internet_speed?: string;
  fiber_available?: string;
  cable_tv_provider?: string;
  cell_coverage_quality?: string;
  emergency_services_distance?: string;

  // GROUP 15: Environment & Risk (117-130)
  air_quality_index?: string;
  air_quality_grade?: string;
  flood_zone?: string;
  flood_risk_level?: string;
  climate_risk?: string;
  wildfire_risk?: string;
  earthquake_risk?: string;
  hurricane_risk?: string;
  tornado_risk?: string;
  radon_risk?: string;
  superfund_site_nearby?: string;
  sea_level_rise_risk?: string;
  noise_level_db_est?: string;
  solar_potential?: string;

  // GROUP 16: Additional Features (131-138)
  view_type?: string;
  lot_features?: string;
  ev_charging?: string;
  smart_home_features?: string;
  accessibility_modifications?: string;
  pet_policy?: string;
  age_restrictions?: string;
  special_assessments?: string;

  // GROUP 17: Parking Details (139-143)
  carport_yn?: boolean;
  carport_spaces?: number;
  garage_attached_yn?: boolean;
  parking_features?: string[];
  assigned_parking_spaces?: number;

  // GROUP 18: Building Details (144-148)
  floor_number?: number;
  building_total_floors?: number;
  building_name_number?: string;
  building_elevator_yn?: boolean;
  floors_in_unit?: number;

  // GROUP 19: Legal & Compliance (149-154)
  subdivision_name?: string;
  legal_description?: string;
  homestead_yn?: boolean;
  cdd_yn?: boolean;
  annual_cdd_fee?: number;
  front_exposure?: string;

  // GROUP 20: Waterfront (155-159)
  water_frontage_yn?: boolean;
  waterfront_feet?: number;
  water_access_yn?: boolean;
  water_view_yn?: boolean;
  water_body_name?: string;

  // GROUP 21: Leasing & Rentals (160-165)
  can_be_leased_yn?: boolean;
  minimum_lease_period?: string;
  lease_restrictions_yn?: boolean;
  pet_size_limit?: string;
  max_pet_weight?: number;
  association_approval_yn?: boolean;

  // GROUP 22: Community & Features (166-168)
  community_features?: string[];
  interior_features?: string[];
  exterior_features?: string[];

  // CLUES Smart Score
  smartScore: number;
  dataCompleteness: number;
}

// ============================================================================
// SECTION ANALYSIS (22 Sections)
// ============================================================================

export interface SectionAnalysis {
  sectionId: string;
  sectionName: string;
  sectionNumber: number; // 1-22

  // Analysis
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'F';
  score: number; // 0-100
  confidence: number; // 0-100

  // Findings
  keyFindings: string[]; // 2-4 bullet points
  strengths: string[]; // Top strengths
  concerns: string[]; // Top concerns

  // Summary visual data
  visualData: {
    type: 'gauge' | 'radar' | 'bar' | 'donut' | 'heatmap' | 'line';
    data: any; // Chart-specific data
  };

  // Fields analyzed in this section
  fieldsAnalyzed: number[]; // Field numbers
  fieldCount: number;
  fieldsWithData: number;
  completeness: number; // 0-100
}

// ============================================================================
// INVESTMENT GRADE RATING
// ============================================================================

export interface InvestmentGradeRating {
  overallGrade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'F';
  overallScore: number; // 0-100
  confidence: number; // 0-100

  // Component scores
  valueScore: number; // 0-100
  locationScore: number; // 0-100
  conditionScore: number; // 0-100
  investmentScore: number; // 0-100
  riskScore: number; // 0-100 (lower is better)

  // One-liner summary
  summary: string;
}

// ============================================================================
// KEY FINDINGS
// ============================================================================

export interface KeyFinding {
  category: 'strength' | 'opportunity' | 'concern' | 'risk';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  fields: number[]; // Field numbers that support this finding
}

// ============================================================================
// MULTI-LLM MARKET FORECAST
// ============================================================================

export interface MarketForecast {
  // Generated by multiple LLMs for consensus
  llmSources: ('claude-opus' | 'gpt-4' | 'gemini-pro' | 'perplexity')[];

  // Consensus forecast
  appreciationForecast: {
    year1: number; // % expected appreciation
    year3: number;
    year5: number;
    year10: number;
    confidence: number; // 0-100
  };

  // Market trends
  marketTrends: {
    priceDirection: 'rising' | 'stable' | 'declining';
    demandLevel: 'high' | 'moderate' | 'low';
    inventoryLevel: 'low' | 'balanced' | 'high';
    daysOnMarketTrend: 'decreasing' | 'stable' | 'increasing';
  };

  // Risk factors
  marketRisks: {
    economicRisks: string[];
    climateRisks: string[];
    demographicShifts: string[];
    regulatoryChanges: string[];
  };

  // Opportunities
  marketOpportunities: {
    nearTerm: string[]; // 1-3 years
    longTerm: string[]; // 5+ years
  };

  // Data freshness
  forecastDate: string;
  dataQuality: 'high' | 'medium' | 'low';
}

// ============================================================================
// DECISION TREE RECOMMENDATIONS
// ============================================================================

export interface DecisionTreeRecommendation {
  buyerProfile: 'investor' | 'family' | 'retiree' | 'vacation' | 'first-time';

  recommendation: {
    action: 'highly-recommend' | 'recommend' | 'consider' | 'proceed-with-caution' | 'not-recommended';
    reasoning: string;
    confidence: number; // 0-100
  };

  // Tailored insights
  keyConsiderations: string[];
  financialAnalysis: {
    upfrontCosts: number;
    monthlyCosts: number;
    expectedROI?: number; // For investors
    breakEvenYears?: number;
  };

  // Next steps
  immediateActions: string[];
  dueDiligenceChecklist: string[];
}

// ============================================================================
// OLIVIA'S VERBAL ANALYSIS
// ============================================================================

export interface OliviaVerbalAnalysis {
  // Executive summary (HeyGen script)
  executiveSummary: string; // 2-3 minute script

  // Property-by-property analysis
  propertyAnalysis: {
    propertyId: string;
    verbalSummary: string; // 1-2 minute script per property
    topStrengths: string[];
    topConcerns: string[];
  }[];

  // Comparison insights
  comparisonInsights: string; // How properties compare

  // Final recommendation
  topRecommendation: {
    propertyId: string;
    reasoning: string;
    confidence: number;
  };
}

// ============================================================================
// Q&A SYSTEM
// ============================================================================

export interface OliviaQADialog {
  question: string;
  answer: string;
  relatedFields: number[]; // Field numbers referenced
  relatedCharts?: string[]; // Chart IDs to navigate to
  timestamp: string;
}

export interface OliviaQAState {
  conversationHistory: OliviaQADialog[];
  suggestedQuestions: string[];
  activeTopics: string[];
}

// ============================================================================
// HEYGEN INTEGRATION
// ============================================================================

export interface HeyGenConfig {
  avatarId: string;
  videoUrl?: string;
  isLive: boolean;

  // Timed popup system
  timedPopups?: {
    timestamp: number; // Seconds into video
    popupType: 'chart' | 'data' | 'insight';
    content: any;
  }[];
}

// ============================================================================
// MAIN ANALYSIS RESULT
// ============================================================================

export interface OliviaEnhancedAnalysisResult {
  // Metadata
  analysisId: string;
  timestamp: string;
  propertiesAnalyzed: number;

  // Investment grade
  investmentGrade: InvestmentGradeRating;

  // Key findings (6-8 top insights)
  keyFindings: KeyFinding[];

  // Section-by-section analysis (22 sections)
  sectionAnalysis: SectionAnalysis[];

  // Property rankings
  propertyRankings: {
    rank: number;
    propertyId: string;
    overallScore: number;
    grade: string;
    pros: string[];
    cons: string[];
  }[];

  // Olivia's verbal analysis
  verbalAnalysis: OliviaVerbalAnalysis;

  // Market forecast (multi-LLM)
  marketForecast: MarketForecast;

  // Decision tree recommendations
  decisionRecommendations: DecisionTreeRecommendation[];

  // HeyGen integration
  heygenConfig: HeyGenConfig;

  // Q&A system
  qaState: OliviaQAState;

  // Call to action
  callToAction: {
    primaryAction: string;
    secondaryActions: string[];
    nextSteps: string[];
  };
}

// ============================================================================
// API REQUEST
// ============================================================================

export interface OliviaEnhancedAnalysisRequest {
  properties: OliviaEnhancedPropertyInput[];

  // User context
  buyerProfile?: 'investor' | 'family' | 'retiree' | 'vacation' | 'first-time';
  userName?: string;

  // Analysis options
  includeMarketForecast?: boolean;
  includeLLMSources?: ('claude-opus' | 'gpt-4' | 'gemini-pro' | 'perplexity')[];

  // HeyGen options
  generateHeyGenScript?: boolean;
  avatarPersonality?: 'professional' | 'friendly' | 'conversational';
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type SectionId =
  | 'address_identity'
  | 'pricing_value'
  | 'property_basics'
  | 'hoa_taxes'
  | 'structure_systems'
  | 'interior_features'
  | 'exterior_features'
  | 'permits_renovations'
  | 'schools'
  | 'location_scores'
  | 'distances_amenities'
  | 'safety_crime'
  | 'market_investment'
  | 'utilities_connectivity'
  | 'environment_risk'
  | 'additional_features'
  | 'parking'
  | 'building'
  | 'legal'
  | 'waterfront'
  | 'leasing'
  | 'community_features';

export const SECTION_METADATA: Record<SectionId, { name: string; fields: number[]; icon: string }> = {
  address_identity: { name: 'Address & Identity', fields: [1, 2, 3, 4, 5, 6, 7, 8, 9], icon: 'MapPin' },
  pricing_value: { name: 'Pricing & Value', fields: [10, 11, 12, 13, 14, 15, 16], icon: 'DollarSign' },
  property_basics: { name: 'Property Basics', fields: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], icon: 'Home' },
  hoa_taxes: { name: 'HOA & Taxes', fields: [30, 31, 32, 33, 34, 35, 36, 37, 38], icon: 'Receipt' },
  structure_systems: { name: 'Structure & Systems', fields: [39, 40, 41, 42, 43, 44, 45, 46, 47, 48], icon: 'Wrench' },
  interior_features: { name: 'Interior Features', fields: [49, 50, 51, 52, 53], icon: 'Sofa' },
  exterior_features: { name: 'Exterior Features', fields: [54, 55, 56, 57, 58], icon: 'TreePine' },
  permits_renovations: { name: 'Permits & Renovations', fields: [59, 60, 61, 62], icon: 'FileCheck' },
  schools: { name: 'Assigned Schools', fields: [63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73], icon: 'GraduationCap' },
  location_scores: { name: 'Location Scores', fields: [74, 75, 76, 77, 78, 79, 80, 81, 82], icon: 'Navigation' },
  distances_amenities: { name: 'Distances & Amenities', fields: [83, 84, 85, 86, 87], icon: 'MapPin' },
  safety_crime: { name: 'Safety & Crime', fields: [88, 89, 90], icon: 'Shield' },
  market_investment: { name: 'Market & Investment', fields: [91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103], icon: 'TrendingUp' },
  utilities_connectivity: { name: 'Utilities & Connectivity', fields: [104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116], icon: 'Zap' },
  environment_risk: { name: 'Environment & Risk', fields: [117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130], icon: 'CloudRain' },
  additional_features: { name: 'Additional Features', fields: [131, 132, 133, 134, 135, 136, 137, 138], icon: 'Star' },
  parking: { name: 'Parking Details', fields: [139, 140, 141, 142, 143], icon: 'Car' },
  building: { name: 'Building Details', fields: [144, 145, 146, 147, 148], icon: 'Building' },
  legal: { name: 'Legal & Compliance', fields: [149, 150, 151, 152, 153, 154], icon: 'Scale' },
  waterfront: { name: 'Waterfront', fields: [155, 156, 157, 158, 159], icon: 'Waves' },
  leasing: { name: 'Leasing & Rentals', fields: [160, 161, 162, 163, 164, 165], icon: 'FileText' },
  community_features: { name: 'Community & Features', fields: [166, 167, 168], icon: 'Users' },
};
