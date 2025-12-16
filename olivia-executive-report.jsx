import { useState, useRef } from 'react';
import {
  X, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2,
  Trophy, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Info, MessageCircle, Send, ChevronDown, ChevronRight,
  Star, Award, Target, Calendar, Brain, Sparkles, Zap,
  Phone, Mail, Video, FileText, ArrowRight, ExternalLink,
  DollarSign, Home, MapPin, Shield, CloudRain, GraduationCap,
  Receipt, Wrench, TreePine, Navigation, Car, Building, Waves,
  Users, Scale, FileCheck
} from 'lucide-react';

// ============================================================================
// MOCK DATA GENERATOR
// ============================================================================

function generateMockOliviaAnalysis() {
  return {
    // Metadata
    analysisId: `OLIVIA-MOCK-${Date.now()}`,
    timestamp: new Date().toISOString(),
    propertiesAnalyzed: 3,

    // Investment Grade
    investmentGrade: {
      overallGrade: 'A-',
      overallScore: 87,
      confidence: 92,
      valueScore: 89,
      locationScore: 85,
      conditionScore: 90,
      investmentScore: 82,
      riskScore: 28, // Lower is better
      summary: 'Exceptional investment opportunity with strong fundamentals across all key metrics. Premium location combined with excellent value proposition makes this a standout choice for long-term appreciation.',
    },

    // Key Findings (6-8 critical insights)
    keyFindings: [
      {
        category: 'strength',
        title: 'Outstanding Value Per Square Foot',
        description: 'Property priced 18% below neighborhood median while maintaining superior condition and amenities. Represents immediate equity opportunity.',
        impact: 'high',
        fields: [10, 11, 12, 91, 92],
      },
      {
        category: 'opportunity',
        title: 'High-Rated School District Premium',
        description: 'All assigned schools rated 8/10 or higher, within walkable distance. Properties in this district historically appreciate 12% faster.',
        impact: 'high',
        fields: [63, 65, 66, 68, 69, 71, 72],
      },
      {
        category: 'strength',
        title: 'Exceptional Location Scores',
        description: 'Walk Score of 89 ("Walker\'s Paradise"), Transit Score 76, premium beach access under 0.5 miles. Lifestyle quality significantly above comparable properties.',
        impact: 'high',
        fields: [74, 75, 76, 87],
      },
      {
        category: 'concern',
        title: 'Elevated Climate Risk Profile',
        description: 'Moderate flood risk (Zone AE) and high hurricane exposure require comprehensive insurance. Annual insurance costs estimated $3,200 higher than comparable inland properties.',
        impact: 'high',
        fields: [119, 120, 124, 128, 97],
      },
      {
        category: 'opportunity',
        title: 'Strong Rental Income Potential',
        description: 'Estimated rental yield of 4.8%, cap rate 3.9%. Short-term vacation rental market shows 85% occupancy rates with premium pricing potential.',
        impact: 'medium',
        fields: [98, 99, 101, 160, 161],
      },
      {
        category: 'strength',
        title: 'Recent System Upgrades Reduce Maintenance Risk',
        description: 'HVAC replaced 2023, roof 2021, water heater 2022. Major systems warranty-protected for 8+ years, eliminating typical 5-year capital expense concerns.',
        impact: 'medium',
        fields: [40, 45, 46, 43, 60, 61],
      },
      {
        category: 'risk',
        title: 'HOA Fee Trajectory Concern',
        description: 'Current HOA $485/month, but building reserves at 62% (target 100%). Special assessment risk moderate; recommend reviewing last 3 years of meeting minutes.',
        impact: 'medium',
        fields: [31, 32, 33, 138],
      },
      {
        category: 'opportunity',
        title: 'Waterfront Premium Undervalued',
        description: 'Direct water access with 45 feet of frontage typically commands 35% premium. This property priced at only 18% premium, suggesting $82k equity gap.',
        impact: 'high',
        fields: [155, 156, 157, 158, 159],
      },
    ],

    // Section Analysis (all 22 sections)
    sectionAnalysis: [
      {
        sectionId: 'address_identity',
        sectionName: 'Address & Identity',
        sectionNumber: 1,
        grade: 'A',
        score: 92,
        confidence: 98,
        keyFindings: [
          'Premium waterfront address with verified MLS data',
          'Active listing status with excellent market exposure',
          'Desirable Pinellas County location',
        ],
        strengths: [
          'Verified through dual MLS systems',
          'Prime neighborhood designation',
          'Complete parcel documentation',
        ],
        concerns: ['Some neighbor considerations'],
        visualData: { type: 'gauge', data: { score: 92 } },
        fieldsAnalyzed: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        fieldCount: 9,
        fieldsWithData: 9,
        completeness: 100,
      },
      {
        sectionId: 'pricing_value',
        sectionName: 'Pricing & Value',
        sectionNumber: 2,
        grade: 'A',
        score: 89,
        confidence: 95,
        keyFindings: [
          'Priced 18% below assessed value - immediate equity',
          'Multiple valuation sources align within 3%',
          'Recent comparable sales support pricing',
        ],
        strengths: [
          'Below-market pricing creates instant equity',
          'Conservative Redfin estimate validates value',
          'Price per sqft 12% below area average',
        ],
        concerns: ['Last sale was 8 years ago - limited recent comp data'],
        visualData: { type: 'bar', data: {} },
        fieldsAnalyzed: [10, 11, 12, 13, 14, 15, 16],
        fieldCount: 7,
        fieldsWithData: 6,
        completeness: 86,
      },
      {
        sectionId: 'property_basics',
        sectionName: 'Property Basics',
        sectionNumber: 3,
        grade: 'A-',
        score: 88,
        confidence: 92,
        keyFindings: [
          'Ideal 3-bedroom, 2.5-bath layout for families or executives',
          'Generous 2,200 sq ft living space with open floor plan',
          '2-car attached garage plus additional parking',
        ],
        strengths: [
          'Spacious primary suite with water views',
          'Well-proportioned room sizes throughout',
          'Functional layout maximizes livable space',
        ],
        concerns: [
          'Single-story limits expansion options',
          'Lot size modest for waterfront (5,800 sq ft)',
        ],
        visualData: { type: 'donut', data: {} },
        fieldsAnalyzed: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
        fieldCount: 13,
        fieldsWithData: 11,
        completeness: 85,
      },
      {
        sectionId: 'hoa_taxes',
        sectionName: 'HOA & Taxes',
        sectionNumber: 4,
        grade: 'B+',
        score: 83,
        confidence: 90,
        keyFindings: [
          'Annual taxes $4,850 (effective rate 1.18%) - competitive',
          'HOA $485/month includes insurance, exterior maintenance, amenities',
          'No CDD fees or special assessments currently',
        ],
        strengths: [
          'Tax rate below county average',
          'HOA amenities justify monthly cost',
          'Clean financial history',
        ],
        concerns: [
          'HOA reserves at 62% (industry standard 100%)',
          'Potential for special assessment in 3-5 years',
        ],
        visualData: { type: 'pie', data: {} },
        fieldsAnalyzed: [30, 31, 32, 33, 34, 35, 36, 37, 38],
        fieldCount: 9,
        fieldsWithData: 7,
        completeness: 78,
      },
      {
        sectionId: 'structure_systems',
        sectionName: 'Structure & Systems',
        sectionNumber: 5,
        grade: 'A',
        score: 90,
        confidence: 94,
        keyFindings: [
          'All major systems recently upgraded with warranties',
          'Architectural shingle roof (2021) - 18 years remaining',
          'High-efficiency HVAC system (2023 Carrier) - 12+ year life',
        ],
        strengths: [
          'Zero major capital expenses anticipated 5+ years',
          'Concrete foundation - superior durability',
          'Stucco exterior recently painted',
        ],
        concerns: ['Water heater approaching mid-life (5 years old)'],
        visualData: { type: 'timeline', data: {} },
        fieldsAnalyzed: [39, 40, 41, 42, 43, 44, 45, 46, 47, 48],
        fieldCount: 10,
        fieldsWithData: 9,
        completeness: 90,
      },
      {
        sectionId: 'interior_features',
        sectionName: 'Interior Features',
        sectionNumber: 6,
        grade: 'A-',
        score: 87,
        confidence: 91,
        keyFindings: [
          'Gourmet kitchen with granite counters, SS appliances',
          'Hardwood floors main areas, tile bathrooms',
          'Gas fireplace living room - coastal ambiance',
        ],
        strengths: [
          'Recent kitchen renovation (2022)',
          'High-end appliance package',
          'Quality finishes throughout',
        ],
        concerns: ['Master bath could benefit from update'],
        visualData: { type: 'grid', data: {} },
        fieldsAnalyzed: [49, 50, 51, 52, 53],
        fieldCount: 5,
        fieldsWithData: 5,
        completeness: 100,
      },
      {
        sectionId: 'exterior_features',
        sectionName: 'Exterior Features',
        sectionNumber: 7,
        grade: 'A',
        score: 92,
        confidence: 96,
        keyFindings: [
          'Heated saltwater pool (2020) with spa',
          'Private dock accommodates 30ft vessel',
          'Covered lanai 400 sq ft - entertaining space',
        ],
        strengths: [
          'Pool equipment warranty-protected',
          'Dock recently refurbished',
          'Professional landscaping with irrigation',
        ],
        concerns: ['Pool heater energy costs ($180/mo summer)'],
        visualData: { type: 'photos', data: {} },
        fieldsAnalyzed: [54, 55, 56, 57, 58],
        fieldCount: 5,
        fieldsWithData: 5,
        completeness: 100,
      },
      {
        sectionId: 'permits_renovations',
        sectionName: 'Permits & Renovations',
        sectionNumber: 8,
        grade: 'A',
        score: 94,
        confidence: 92,
        keyFindings: [
          'All recent work properly permitted and inspected',
          'Roof replacement permit 2021 - passed final',
          'HVAC permit 2023 - COO issued',
        ],
        strengths: [
          'Clean permit history',
          'No open violations',
          'All work documented',
        ],
        concerns: ['None identified'],
        visualData: { type: 'table', data: {} },
        fieldsAnalyzed: [59, 60, 61, 62],
        fieldCount: 4,
        fieldsWithData: 4,
        completeness: 100,
      },
      {
        sectionId: 'schools',
        sectionName: 'Assigned Schools',
        sectionNumber: 9,
        grade: 'A+',
        score: 95,
        confidence: 97,
        keyFindings: [
          'All schools rated 8/10 or higher (GreatSchools)',
          'Elementary within 0.3 miles - walkable',
          'High school Blue Ribbon award winner',
        ],
        strengths: [
          'Consistently high test scores',
          'Active parent communities',
          'Excellent extracurricular programs',
        ],
        concerns: ['High school 2.8 miles - bus required'],
        visualData: { type: 'map', data: {} },
        fieldsAnalyzed: [63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73],
        fieldCount: 11,
        fieldsWithData: 11,
        completeness: 100,
      },
      {
        sectionId: 'location_scores',
        sectionName: 'Location Scores',
        sectionNumber: 10,
        grade: 'A',
        score: 89,
        confidence: 93,
        keyFindings: [
          'Walk Score 89 - "Walker\'s Paradise"',
          'Transit Score 76 - "Excellent Transit"',
          'Bike Score 82 - "Very Bikeable"',
        ],
        strengths: [
          'Car-optional lifestyle possible',
          'Multiple transit options',
          'Safe bike infrastructure',
        ],
        concerns: ['Evening noise from beach traffic'],
        visualData: { type: 'radar', data: {} },
        fieldsAnalyzed: [74, 75, 76, 77, 78, 79, 80, 81, 82],
        fieldCount: 9,
        fieldsWithData: 8,
        completeness: 89,
      },
      {
        sectionId: 'distances_amenities',
        sectionName: 'Distances & Amenities',
        sectionNumber: 11,
        grade: 'A',
        score: 91,
        confidence: 95,
        keyFindings: [
          'Beach access 0.4 miles - 8 minute walk',
          'Publix supermarket 0.6 miles',
          'Bayfront Medical Center 2.1 miles',
        ],
        strengths: [
          'All daily needs within 1 mile',
          'International airport 12 miles',
          'Downtown St Pete 4 miles',
        ],
        concerns: ['No Whole Foods within 5 miles'],
        visualData: { type: 'distance', data: {} },
        fieldsAnalyzed: [83, 84, 85, 86, 87],
        fieldCount: 5,
        fieldsWithData: 5,
        completeness: 100,
      },
      {
        sectionId: 'safety_crime',
        sectionName: 'Safety & Crime',
        sectionNumber: 12,
        grade: 'B+',
        score: 84,
        confidence: 88,
        keyFindings: [
          'Violent crime 18% below national average',
          'Property crime 12% above national average',
          'Active neighborhood watch program',
        ],
        strengths: [
          'Well-lit streets',
          'Regular police patrols',
          'Low serious crime incidents',
        ],
        concerns: ['Beach area sees seasonal theft spikes'],
        visualData: { type: 'heatmap', data: {} },
        fieldsAnalyzed: [88, 89, 90],
        fieldCount: 3,
        fieldsWithData: 3,
        completeness: 100,
      },
      {
        sectionId: 'market_investment',
        sectionName: 'Market & Investment Data',
        sectionNumber: 13,
        grade: 'B+',
        score: 82,
        confidence: 88,
        keyFindings: [
          'Cap rate 3.9% - solid for waterfront',
          'Rental yield 4.8% exceeds area average',
          'Price-to-rent ratio favorable at 18:1',
        ],
        strengths: [
          'Strong rental demand (95% occupancy)',
          'Vacation rental potential significant',
          'Below median pricing creates value play',
        ],
        concerns: [
          'Inventory increasing (buyer\'s market emerging)',
          'Days on market up 15% year-over-year',
        ],
        visualData: { type: 'line', data: {} },
        fieldsAnalyzed: [91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103],
        fieldCount: 13,
        fieldsWithData: 10,
        completeness: 77,
      },
      {
        sectionId: 'utilities_connectivity',
        sectionName: 'Utilities & Connectivity',
        sectionNumber: 14,
        grade: 'A-',
        score: 86,
        confidence: 91,
        keyFindings: [
          'Fiber internet available (1 Gbps Frontier)',
          'Average electric $165/month (Duke Energy)',
          'City water/sewer - no well/septic concerns',
        ],
        strengths: [
          'Multiple ISP options',
          'Excellent cell coverage all carriers',
          'Natural gas available',
        ],
        concerns: ['Electric bills spike to $280 in summer'],
        visualData: { type: 'cost', data: {} },
        fieldsAnalyzed: [104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116],
        fieldCount: 13,
        fieldsWithData: 11,
        completeness: 85,
      },
      {
        sectionId: 'environment_risk',
        sectionName: 'Environment & Risk',
        sectionNumber: 15,
        grade: 'C+',
        score: 72,
        confidence: 90,
        keyFindings: [
          'Flood Zone AE - elevation cert required',
          'Hurricane risk HIGH (Cat 3+ every 10-15 years)',
          'Air quality Good (AQI 45 average)',
        ],
        strengths: [
          'Structure elevated 8ft above base flood',
          'Impact-rated windows/doors',
          'No radon or soil contamination',
        ],
        concerns: [
          'Flood insurance mandatory ($3,200/year)',
          'Storm surge potential 8-12 feet',
          'Climate change sea level considerations',
        ],
        visualData: { type: 'risk', data: {} },
        fieldsAnalyzed: [117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130],
        fieldCount: 14,
        fieldsWithData: 12,
        completeness: 86,
      },
      {
        sectionId: 'additional_features',
        sectionName: 'Additional Features',
        sectionNumber: 16,
        grade: 'A-',
        score: 87,
        confidence: 89,
        keyFindings: [
          'Direct water views from living areas',
          'EV charger installed (Level 2, 240V)',
          'Smart home system (Nest, Ring, Lutron)',
        ],
        strengths: [
          'Western exposure - stunning sunsets',
          'Energy-efficient LED throughout',
          'Solar potential excellent (88/100)',
        ],
        concerns: ['No age restrictions - family-friendly only'],
        visualData: { type: 'checklist', data: {} },
        fieldsAnalyzed: [131, 132, 133, 134, 135, 136, 137, 138],
        fieldCount: 8,
        fieldsWithData: 7,
        completeness: 88,
      },
      {
        sectionId: 'parking',
        sectionName: 'Parking Details',
        sectionNumber: 17,
        grade: 'A',
        score: 93,
        confidence: 97,
        keyFindings: [
          '2-car attached garage with storage',
          'Additional driveway parking (2 vehicles)',
          'Guest parking available on street',
        ],
        strengths: [
          'Garage door opener 2022',
          'Epoxy-coated garage floors',
          'Workshop area with workbench',
        ],
        concerns: ['None identified'],
        visualData: { type: 'diagram', data: {} },
        fieldsAnalyzed: [139, 140, 141, 142, 143],
        fieldCount: 5,
        fieldsWithData: 5,
        completeness: 100,
      },
      {
        sectionId: 'building',
        sectionName: 'Building Details',
        sectionNumber: 18,
        grade: 'A',
        score: 91,
        confidence: 94,
        keyFindings: [
          'Single-family detached - no shared walls',
          'Single story - accessibility advantages',
          'Well-maintained exterior and grounds',
        ],
        strengths: [
          'Privacy and independence',
          'No elevator maintenance concerns',
          'Direct ground access',
        ],
        concerns: ['Single-story limits view potential'],
        visualData: { type: 'structure', data: {} },
        fieldsAnalyzed: [144, 145, 146, 147, 148],
        fieldCount: 5,
        fieldsWithData: 4,
        completeness: 80,
      },
      {
        sectionId: 'legal',
        sectionName: 'Legal & Compliance',
        sectionNumber: 19,
        grade: 'A',
        score: 94,
        confidence: 96,
        keyFindings: [
          'Clear title - no liens or encumbrances',
          'Homestead exemption active ($50k savings)',
          'No CDD or special assessments',
        ],
        strengths: [
          'All permits closed',
          'Survey on file (2015)',
          'Clean legal history',
        ],
        concerns: ['None identified'],
        visualData: { type: 'status', data: {} },
        fieldsAnalyzed: [149, 150, 151, 152, 153, 154],
        fieldCount: 6,
        fieldsWithData: 6,
        completeness: 100,
      },
      {
        sectionId: 'waterfront',
        sectionName: 'Waterfront',
        sectionNumber: 20,
        grade: 'A+',
        score: 96,
        confidence: 98,
        keyFindings: [
          '45 feet of water frontage - rare find',
          'Deep water access - no bridge restrictions',
          'Private dock with lift (10,000 lbs)',
        ],
        strengths: [
          'Protected cove location',
          'Seawall in excellent condition',
          'Quick Gulf access (15 minutes)',
        ],
        concerns: ['Dock maintenance $800 annually'],
        visualData: { type: 'aerial', data: {} },
        fieldsAnalyzed: [155, 156, 157, 158, 159],
        fieldCount: 5,
        fieldsWithData: 5,
        completeness: 100,
      },
      {
        sectionId: 'leasing',
        sectionName: 'Leasing & Rentals',
        sectionNumber: 21,
        grade: 'A',
        score: 90,
        confidence: 92,
        keyFindings: [
          'Short-term vacation rentals permitted',
          'No minimum lease period restrictions',
          'Pets allowed (2 max, 50 lbs combined)',
        ],
        strengths: [
          'Airbnb/VRBO allowed with permit',
          'Strong rental history available',
          'No board approval required',
        ],
        concerns: ['City requires STR license ($250/year)'],
        visualData: { type: 'policy', data: {} },
        fieldsAnalyzed: [160, 161, 162, 163, 164, 165],
        fieldCount: 6,
        fieldsWithData: 6,
        completeness: 100,
      },
      {
        sectionId: 'community_features',
        sectionName: 'Community & Features',
        sectionNumber: 22,
        grade: 'A',
        score: 89,
        confidence: 93,
        keyFindings: [
          'HOA includes clubhouse, fitness center, pool',
          'Active social calendar and events',
          'Well-maintained common areas',
        ],
        strengths: [
          'Strong community engagement',
          'Professional management company',
          'Financial reserves healthy',
        ],
        concerns: ['Some resident turnover recently'],
        visualData: { type: 'amenities', data: {} },
        fieldsAnalyzed: [166, 167, 168],
        fieldCount: 3,
        fieldsWithData: 3,
        completeness: 100,
      },
    ],

    // Property Rankings
    propertyRankings: [
      {
        rank: 1,
        propertyId: 'prop-123',
        overallScore: 87,
        grade: 'A-',
        pros: [
          'Outstanding waterfront value',
          'Recent system upgrades',
          'Premier school district',
          'Strong rental potential',
        ],
        cons: [
          'Elevated flood insurance costs',
          'HOA reserve concerns',
          'Modest lot size',
        ],
      },
      {
        rank: 2,
        propertyId: 'prop-456',
        overallScore: 82,
        grade: 'B+',
        pros: [
          'Lower price point',
          'No flood zone concerns',
          'Larger lot size',
        ],
        cons: [
          'No water access',
          'Schools rated lower',
          'Older systems need replacement',
        ],
      },
      {
        rank: 3,
        propertyId: 'prop-789',
        overallScore: 76,
        grade: 'B',
        pros: [
          'Turnkey condition',
          'Low HOA fees',
          'Good schools',
        ],
        cons: [
          'High traffic area',
          'Limited parking',
          'No special features',
        ],
      },
    ],

    // Olivia's Verbal Analysis
    verbalAnalysis: {
      executiveSummary: `Hello! I'm Olivia, your AI property advisor, and I'm excited to walk you through this comprehensive analysis. After analyzing 168 data points across 22 critical categories, I'm pleased to report this property earns a strong A-minus investment grade with an overall score of 87 out of 100. Here's what makes this property special: You're looking at an exceptional waterfront opportunity that's priced 18% below the neighborhood median—that's immediate equity in your pocket. The property combines premium location with smart value, featuring recent system upgrades that eliminate major capital expenses for years to come. The school district is outstanding, all rated 8 out of 10 or higher, and you have beach access just a 400-meter walk away. Now, I want to be completely transparent about the considerations. This is a flood zone property with hurricane exposure, so your insurance costs will run about $3,200 annually—that's factored into our analysis. The HOA reserves are at 62 percent, below the industry standard, which suggests a potential special assessment in the next few years. However, when we balance the exceptional value, prime location, and strong fundamentals against these concerns, this property represents a compelling investment opportunity, especially for someone who values waterfront living and understands the associated responsibilities. Let me walk you through the details section by section.`,
      propertyAnalysis: [
        {
          propertyId: 'prop-123',
          verbalSummary: 'Property #1 is our top recommendation with outstanding waterfront value and recent system upgrades.',
          topStrengths: [
            'Waterfront premium undervalued by $82k',
            'All major systems replaced 2021-2023',
            'Walk Score 89 - Walker\'s Paradise',
          ],
          topConcerns: [
            'Flood Zone AE requires $3,200 annual insurance',
            'HOA reserves at 62% - special assessment possible',
          ],
        },
      ],
      comparisonInsights: 'Property #1 stands out significantly for its waterfront access and value proposition. While Properties #2 and #3 offer lower entry points, they lack the premium location and appreciation potential of our top choice.',
      topRecommendation: {
        propertyId: 'prop-123',
        reasoning: 'Exceptional combination of value, location, and condition with manageable risks for informed buyers.',
        confidence: 87,
      },
    },

    // Market Forecast (Multi-LLM Consensus)
    marketForecast: {
      llmSources: ['claude-opus', 'gpt-4', 'gemini-pro', 'perplexity'],
      appreciationForecast: {
        year1: 4.2,
        year3: 13.8,
        year5: 24.5,
        year10: 52.3,
        confidence: 78,
      },
      marketTrends: {
        priceDirection: 'rising',
        demandLevel: 'high',
        inventoryLevel: 'low',
        daysOnMarketTrend: 'stable',
      },
      marketRisks: {
        economicRisks: [
          'Interest rate volatility could impact buyer pool',
          'Insurance costs rising faster than home values',
        ],
        climateRisks: [
          'Hurricane frequency increasing long-term',
          'Sea level rise affects long-term insurability',
        ],
        demographicShifts: [
          'Remote work enabling migration to Florida',
          'Retiree population growing 3.2% annually',
        ],
        regulatoryChanges: [
          'Short-term rental regulations may tighten',
          'Building codes getting more stringent',
        ],
      },
      marketOpportunities: {
        nearTerm: [
          'Pre-season buying window (Jan-March)',
          'Motivated sellers creating value plays',
          'Low inventory driving multiple offers',
        ],
        longTerm: [
          'Florida no-tax advantage attracting wealth',
          'Climate migration benefiting inland Florida',
          'Infrastructure improvements boosting values',
        ],
      },
      forecastDate: new Date().toISOString(),
      dataQuality: 'high',
    },

    // Decision Recommendations
    decisionRecommendations: [
      {
        buyerProfile: 'investor',
        recommendation: {
          action: 'recommend',
          reasoning: 'Strong rental yield and appreciation potential offset climate risks. Cash flow positive from day one with proper insurance planning.',
          confidence: 82,
        },
        keyConsiderations: [
          'Build insurance costs into cash flow analysis',
          'Consider short-term rental strategy for maximum ROI',
          'Plan for HOA special assessment reserve (est. $15k)',
        ],
        financialAnalysis: {
          upfrontCosts: 178500, // 20% down + closing
          monthlyCosts: 4820,
          expectedROI: 8.4,
          breakEvenYears: 7.2,
        },
        immediateActions: [
          'Order elevation certificate',
          'Get 3 flood insurance quotes',
          'Request HOA financial statements (3 years)',
          'Schedule comprehensive inspection',
        ],
        dueDiligenceChecklist: [
          'Review all permits and survey',
          'Verify dock permits and seawall condition',
          'Check short-term rental license requirements',
          'Inspect HVAC, roof, pool equipment',
          'Review recent comparable sales',
        ],
      },
      {
        buyerProfile: 'family',
        recommendation: {
          action: 'highly-recommend',
          reasoning: 'Perfect family home in exceptional school district with walkable lifestyle. The waterfront access and community features align perfectly with family priorities.',
          confidence: 89,
        },
        keyConsiderations: [
          'Schools all rated 8+ within walkable distance',
          'Safe neighborhood with low crime',
          'Pool and dock require supervision protocols',
        ],
        financialAnalysis: {
          upfrontCosts: 178500,
          monthlyCosts: 5100,
        },
        immediateActions: [
          'Tour schools and meet principals',
          'Walk neighborhood at different times',
          'Meet neighbors if possible',
          'Review HOA rules for families',
        ],
        dueDiligenceChecklist: [
          'Verify school boundaries haven\'t changed',
          'Check playground/park proximity',
          'Review pool safety barriers and alarms',
          'Inspect child-safety features',
          'Evaluate bedroom sizes for family growth',
        ],
      },
    ],

    // HeyGen Config
    heygenConfig: {
      avatarId: 'olivia-professional-v1',
      videoUrl: null,
      isLive: false,
      timedPopups: [
        {
          timestamp: 30,
          popupType: 'chart',
          content: { chartId: 'pricing-comparison' },
        },
        {
          timestamp: 90,
          popupType: 'data',
          content: { sectionId: 'schools' },
        },
        {
          timestamp: 150,
          popupType: 'insight',
          content: { findingId: 'waterfront-premium' },
        },
      ],
    },

    // Q&A State
    qaState: {
      conversationHistory: [
        {
          question: 'What are the insurance costs?',
          answer: 'Based on the flood zone (AE) and hurricane exposure, expect annual insurance around $3,200 for flood plus $2,800 for homeowners, totaling approximately $6,000 per year. This is higher than inland properties but typical for waterfront in this area.',
          relatedFields: [97, 119, 124],
          relatedCharts: ['insurance-breakdown'],
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
      suggestedQuestions: [
        'How does this property compare to others in my search?',
        'What are the total monthly costs including everything?',
        'Is this a good property for short-term rentals?',
        'What are the biggest risks I should know about?',
        'How strong is the appreciation potential?',
      ],
      activeTopics: ['insurance', 'waterfront', 'schools', 'investment'],
    },

    // Call to Action
    callToAction: {
      primaryAction: 'Schedule Showing',
      secondaryActions: [
        'Request Full Property Package',
        'Get Pre-Qualified for Financing',
        'Order Home Inspection',
      ],
      nextSteps: [
        'Review this complete analysis with your family',
        'Schedule a showing to experience the property in person',
        'Request the detailed field-by-field data breakdown',
        'Discuss financing options with your lender',
        'Prepare your offer strategy with your agent',
      ],
    },
  };
}

// Section icons mapping
const SECTION_ICONS = {
  'Address & Identity': MapPin,
  'Pricing & Value': DollarSign,
  'Property Basics': Home,
  'HOA & Taxes': Receipt,
  'Structure & Systems': Wrench,
  'Interior Features': Home,
  'Exterior Features': TreePine,
  'Permits & Renovations': FileCheck,
  'Assigned Schools': GraduationCap,
  'Location Scores': Navigation,
  'Distances & Amenities': MapPin,
  'Safety & Crime': Shield,
  'Market & Investment Data': TrendingUp,
  'Utilities & Connectivity': Zap,
  'Environment & Risk': CloudRain,
  'Additional Features': Star,
  'Parking Details': Car,
  'Building Details': Building,
  'Legal & Compliance': Scale,
  'Waterfront': Waves,
  'Leasing & Rentals': FileText,
  'Community & Features': Users,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function OliviaExecutiveReport({ result, properties, onClose }) {
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);

  // Navigation state
  const [activeSection, setActiveSection] = useState(null);
  const [showTranscript, setShowTranscript] = useState(true);

  // Q&A state
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState(result.qaState.conversationHistory);

  // Get property address helper
  const getPropertyAddress = (propertyId) => {
    const prop = properties.find(p => p.id === propertyId);
    return prop ? `${prop.address}, ${prop.city}` : 'Unknown Property';
  };

  // Grade color helper
  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'text-emerald-400';
    if (grade.startsWith('B')) return 'text-cyan-400';
    if (grade.startsWith('C')) return 'text-amber-400';
    return 'text-red-400';
  };

  // Grade background helper
  const getGradeBg = (grade) => {
    if (grade.startsWith('A')) return 'from-emerald-500/20 to-emerald-500/5';
    if (grade.startsWith('B')) return 'from-cyan-500/20 to-cyan-500/5';
    if (grade.startsWith('C')) return 'from-amber-500/20 to-amber-500/5';
    return 'from-red-500/20 to-red-500/5';
  };

  // Finding icon helper
  const getFindingIcon = (category) => {
    switch (category) {
      case 'strength': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'opportunity': return <TrendingUp className="w-5 h-5 text-cyan-400" />;
      case 'concern': return <Info className="w-5 h-5 text-amber-400" />;
      case 'risk': return <AlertTriangle className="w-5 h-5 text-red-400" />;
    }
  };

  // Impact badge helper
  const getImpactBadge = (impact) => {
    const colors = {
      high: 'bg-red-500/20 text-red-300 border-red-500/30',
      medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      low: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full border ${colors[impact]}`}>
        {impact.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-sm">
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* ============================================================
              HEADER
          ============================================================ */}
          <div className="relative bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-2xl overflow-hidden mb-6 backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 opacity-50" />
            
            <div className="relative z-10 flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                    Executive Property Appraisal
                  </h1>
                  <p className="text-sm text-cyan-400 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Olivia's Comprehensive 168-Field Intelligence Report
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:rotate-90"
              >
                <X className="w-6 h-6 text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>

          {/* ============================================================
              HEYGEN AVATAR + INVESTMENT GRADE
          ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Video Player (Left - 2 columns) */}
            <div className="lg:col-span-2">
              <div className="bg-gray-900/60 backdrop-blur-md p-6 border border-purple-500/30 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                      <span className="text-xl font-bold">O</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Olivia's Video Analysis</h3>
                      <p className="text-xs text-gray-400">Your Personal Property Advisor</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Video Container */}
                <div ref={videoRef} className="relative aspect-video bg-black/50 rounded-xl overflow-hidden mb-4">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Video className="w-12 h-12" />
                      </div>
                      <p className="text-white font-semibold mb-2">HeyGen Avatar Integration</p>
                      <p className="text-sm text-gray-400 mb-4">Olivia will guide you through your property analysis</p>
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl font-semibold hover:opacity-90 transition-all hover:scale-105"
                      >
                        <Play className="w-5 h-5 inline mr-2" />
                        Start Video Analysis
                      </button>
                    </div>
                  </div>

                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>

                      <div className="flex-1 mx-4">
                        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full w-1/3 bg-cyan-400 rounded-full transition-all" />
                        </div>
                      </div>

                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transcript Toggle */}
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <span className="text-sm text-gray-400">Live Transcript</span>
                  {showTranscript ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {/* Transcript */}
                {showTranscript && (
                  <div className="mt-4 p-4 bg-black/30 rounded-xl max-h-40 overflow-y-auto">
                    <p className="text-sm text-gray-300 leading-relaxed italic">
                      "{result.verbalAnalysis.executiveSummary}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Investment Grade Card (Right - 1 column) */}
            <div className="lg:col-span-1">
              <div className={`bg-gray-900/60 backdrop-blur-md p-6 border-2 border-emerald-400/40 rounded-2xl bg-gradient-to-br ${getGradeBg(result.investmentGrade.overallGrade)}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-6 h-6 text-emerald-400" />
                  <h3 className="font-semibold text-white">Investment Grade</h3>
                </div>

                <div className="text-center mb-6">
                  <div className={`text-6xl font-bold ${getGradeColor(result.investmentGrade.overallGrade)} mb-2`}>
                    {result.investmentGrade.overallGrade}
                  </div>
                  <div className="text-2xl font-semibold text-white mb-1">
                    {result.investmentGrade.overallScore}/100
                  </div>
                  <div className="text-sm text-gray-400">
                    {result.investmentGrade.confidence}% Confidence
                  </div>
                </div>

                {/* Component Scores */}
                <div className="space-y-3">
                  {[
                    { label: 'Value', score: result.investmentGrade.valueScore, color: 'emerald' },
                    { label: 'Location', score: result.investmentGrade.locationScore, color: 'cyan' },
                    { label: 'Condition', score: result.investmentGrade.conditionScore, color: 'purple' },
                    { label: 'Investment', score: result.investmentGrade.investmentScore, color: 'blue' },
                    { label: 'Risk', score: 100 - result.investmentGrade.riskScore, color: 'amber' },
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">{item.label}</span>
                        <span className="text-white font-medium">{item.score}/100</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-${item.color}-400 rounded-full transition-all duration-1000`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              KEY FINDINGS
          ============================================================ */}
          <div className="bg-gray-900/60 backdrop-blur-md p-6 border border-purple-500/30 rounded-2xl mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Key Findings</h2>
              <span className="ml-auto text-sm text-gray-400">{result.keyFindings.length} Critical Insights</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.keyFindings.map((finding, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all hover:scale-105 cursor-pointer"
                >
                  <div className="flex items-start gap-3 mb-2">
                    {getFindingIcon(finding.category)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white text-sm">{finding.title}</h4>
                        {getImpactBadge(finding.impact)}
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{finding.description}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <FileText className="w-3 h-3" />
                        <span>Fields: {finding.fields.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================
              SECTION ANALYSIS (All 22 Sections)
          ============================================================ */}
          <div className="bg-gray-900/60 backdrop-blur-md p-6 border border-purple-500/30 rounded-2xl mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">Section-by-Section Analysis</h2>
              <span className="ml-auto text-sm text-gray-400">22 Comprehensive Sections</span>
            </div>

            <div className="space-y-3">
              {result.sectionAnalysis.map((section) => {
                const IconComponent = SECTION_ICONS[section.sectionName] || Star;
                const isActive = activeSection === section.sectionNumber;

                return (
                  <div key={section.sectionId} className="border border-white/10 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setActiveSection(isActive ? null : section.sectionNumber)}
                      className="w-full p-4 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">#{section.sectionNumber}</span>
                            <h4 className="font-semibold text-white">{section.sectionName}</h4>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-lg font-bold ${getGradeColor(section.grade)}`}>
                              {section.grade}
                            </span>
                            <span className="text-sm text-gray-400">{section.score}/100</span>
                            <span className="text-xs text-gray-500">
                              • {section.fieldsWithData}/{section.fieldCount} fields • {section.completeness}% complete
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-gray-400">{section.confidence}% confident</div>
                        {isActive ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                    </button>

                    {isActive && (
                      <div className="p-4 bg-black/20 border-t border-white/10">
                        {/* Key Findings */}
                        <div className="mb-4">
                          <h5 className="text-sm font-semibold text-gray-300 mb-2">Key Findings:</h5>
                          <ul className="space-y-1">
                            {section.keyFindings.map((finding, idx) => (
                              <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                {finding}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Strengths */}
                        {section.strengths.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-semibold text-emerald-400 mb-2">Strengths:</h5>
                            <ul className="space-y-1">
                              {section.strengths.map((strength, idx) => (
                                <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                                  <Star className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Concerns */}
                        {section.concerns.length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold text-amber-400 mb-2">Concerns:</h5>
                            <ul className="space-y-1">
                              {section.concerns.map((concern, idx) => (
                                <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                  {concern}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================
              PROPERTY RANKINGS
          ============================================================ */}
          <div className="bg-gray-900/60 backdrop-blur-md p-6 border border-purple-500/30 rounded-2xl mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-white">Property Rankings</h2>
            </div>

            <div className="space-y-4">
              {result.propertyRankings.map((property) => (
                <div
                  key={property.propertyId}
                  className={`p-4 rounded-xl border-2 ${
                    property.rank === 1
                      ? 'border-yellow-400/50 bg-yellow-500/10'
                      : property.rank === 2
                      ? 'border-gray-400/50 bg-gray-500/10'
                      : 'border-orange-400/50 bg-orange-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                          property.rank === 1
                            ? 'bg-yellow-400/20 text-yellow-400'
                            : property.rank === 2
                            ? 'bg-gray-400/20 text-gray-400'
                            : 'bg-orange-400/20 text-orange-400'
                        }`}
                      >
                        #{property.rank}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">
                          {getPropertyAddress(property.propertyId)}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xl font-bold ${getGradeColor(property.grade)}`}>
                            {property.grade}
                          </span>
                          <span className="text-gray-400">• {property.overallScore}/100</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-semibold text-emerald-400 mb-2">Pros:</h5>
                      <ul className="space-y-1">
                        {property.pros.map((pro, idx) => (
                          <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-amber-400 mb-2">Cons:</h5>
                      <ul className="space-y-1">
                        {property.cons.map((con, idx) => (
                          <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                            <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================
              MARKET FORECAST
          ============================================================ */}
          <div className="bg-gray-900/60 backdrop-blur-md p-6 border border-purple-500/30 rounded-2xl mb-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold text-white">Market Forecast</h2>
              <span className="ml-auto text-xs text-gray-500">
                Multi-LLM Consensus • {result.marketForecast.confidence}% Confidence
              </span>
            </div>

            {/* Appreciation Forecast */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Appreciation Forecast:</h3>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: '1 Year', value: result.marketForecast.appreciationForecast.year1 },
                  { label: '3 Years', value: result.marketForecast.appreciationForecast.year3 },
                  { label: '5 Years', value: result.marketForecast.appreciationForecast.year5 },
                  { label: '10 Years', value: result.marketForecast.appreciationForecast.year10 },
                ].map((forecast, idx) => (
                  <div key={idx} className="p-4 bg-white/5 rounded-xl text-center">
                    <div className="text-2xl font-bold text-green-400">+{forecast.value}%</div>
                    <div className="text-sm text-gray-400 mt-1">{forecast.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Trends */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Price Direction', value: result.marketForecast.marketTrends.priceDirection },
                { label: 'Demand Level', value: result.marketForecast.marketTrends.demandLevel },
                { label: 'Inventory', value: result.marketForecast.marketTrends.inventoryLevel },
                { label: 'Days on Market', value: result.marketForecast.marketTrends.daysOnMarketTrend },
              ].map((trend, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">{trend.label}</div>
                  <div className="text-sm font-semibold text-white capitalize">{trend.value}</div>
                </div>
              ))}
            </div>

            {/* Risks and Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-amber-400 mb-2">Key Risks:</h4>
                <ul className="space-y-1">
                  {[
                    ...result.marketForecast.marketRisks.economicRisks.slice(0, 2),
                    ...result.marketForecast.marketRisks.climateRisks.slice(0, 1),
                  ].map((risk, idx) => (
                    <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-emerald-400 mb-2">Opportunities:</h4>
                <ul className="space-y-1">
                  {result.marketForecast.marketOpportunities.nearTerm.map((opp, idx) => (
                    <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                      <TrendingUp className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                      {opp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ============================================================
              DECISION RECOMMENDATIONS
          ============================================================ */}
          <div className="bg-gray-900/60 backdrop-blur-md p-6 border border-purple-500/30 rounded-2xl mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Brain className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Decision Recommendations</h2>
            </div>

            <div className="space-y-4">
              {result.decisionRecommendations.map((rec, idx) => (
                <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white capitalize flex items-center gap-2">
                      <Users className="w-5 h-5 text-cyan-400" />
                      {rec.buyerProfile.replace(/-/g, ' ')} Buyer
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      rec.recommendation.action === 'highly-recommend'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : rec.recommendation.action === 'recommend'
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {rec.recommendation.action.toUpperCase().replace(/-/g, ' ')}
                    </span>
                  </div>

                  <p className="text-sm text-gray-400 mb-4">{rec.recommendation.reasoning}</p>

                  {rec.financialAnalysis.expectedROI && (
                    <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-black/20 rounded-lg">
                      <div>
                        <div className="text-xs text-gray-400">Monthly Costs</div>
                        <div className="text-lg font-bold text-white">
                          ${rec.financialAnalysis.monthlyCosts.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Expected ROI</div>
                        <div className="text-lg font-bold text-green-400">
                          {rec.financialAnalysis.expectedROI}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Break Even</div>
                        <div className="text-lg font-bold text-white">
                          {rec.financialAnalysis.breakEvenYears} yrs
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-semibold text-cyan-400 mb-2">Immediate Actions:</h5>
                      <ul className="space-y-1">
                        {rec.immediateActions.map((action, aidx) => (
                          <li key={aidx} className="text-xs text-gray-400 flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-purple-400 mb-2">Due Diligence:</h5>
                      <ul className="space-y-1">
                        {rec.dueDiligenceChecklist.slice(0, 4).map((item, didx) => (
                          <li key={didx} className="text-xs text-gray-400 flex items-start gap-2">
                            <FileCheck className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================
              INTERACTIVE Q&A
          ============================================================ */}
          <div className="bg-gray-900/60 backdrop-blur-md p-6 border border-purple-500/30 rounded-2xl mb-6">
            <div className="flex items-center gap-2 mb-6">
              <MessageCircle className="w-6 h-6 text-pink-400" />
              <h2 className="text-xl font-bold text-white">Ask Olivia Anything</h2>
            </div>

            {/* Chat History */}
            <div className="mb-4 space-y-3 max-h-60 overflow-y-auto">
              {qaHistory.map((qa, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <span className="text-sm font-medium text-white">{qa.question}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 ml-8">
                    <div className="p-2 bg-white/5 rounded-lg flex-1">
                      <p className="text-sm text-gray-300">{qa.answer}</p>
                      {qa.relatedFields && qa.relatedFields.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          Related fields: {qa.relatedFields.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested Questions */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">Suggested Questions:</h4>
              <div className="flex flex-wrap gap-2">
                {result.qaState.suggestedQuestions.slice(0, 3).map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQaQuestion(question)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-xs text-gray-300 transition-all"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={qaQuestion}
                onChange={(e) => setQaQuestion(e.target.value)}
                placeholder="Ask about pricing, schools, risks, or anything else..."
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl font-semibold hover:opacity-90 transition-all hover:scale-105">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ============================================================
              CALL TO ACTION
          ============================================================ */}
          <div className="bg-gradient-to-r from-purple-900/60 to-blue-900/60 backdrop-blur-md p-8 border border-purple-500/30 rounded-2xl text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Ready to Take the Next Step?</h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Based on this comprehensive 168-field analysis, this property represents an excellent opportunity. 
              Let's move forward with confidence.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <button className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-bold text-lg hover:scale-105 transition-all flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {result.callToAction.primaryAction}
              </button>
              {result.callToAction.secondaryActions.map((action, idx) => (
                <button
                  key={idx}
                  className="px-6 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all"
                >
                  {action}
                </button>
              ))}
            </div>

            <div className="flex justify-center gap-6">
              <button className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                <Phone className="w-5 h-5" />
                Call John
              </button>
              <button className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                <Mail className="w-5 h-5" />
                Email Report
              </button>
              <button className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                <Video className="w-5 h-5" />
                Video Consultation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// APP CONTAINER
// ============================================================================

export default function App() {
  const [showReport, setShowReport] = useState(true);

  // Generate mock data
  const mockData = generateMockOliviaAnalysis();
  
  // Mock properties
  const mockProperties = [
    { id: 'prop-123', address: '1234 Waterfront Way', city: 'St. Pete Beach, FL' },
    { id: 'prop-456', address: '5678 Bayshore Blvd', city: 'Tampa, FL' },
    { id: 'prop-789', address: '9012 Sunset Drive', city: 'Clearwater, FL' },
  ];

  if (!showReport) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <button
          onClick={() => setShowReport(true)}
          className="px-8 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl font-bold text-white hover:scale-105 transition-all"
        >
          Show Olivia Executive Report
        </button>
      </div>
    );
  }

  return (
    <OliviaExecutiveReport
      result={mockData}
      properties={mockProperties}
      onClose={() => setShowReport(false)}
    />
  );
}
