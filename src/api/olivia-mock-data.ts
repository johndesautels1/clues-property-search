/**
 * OLIVIA MOCK DATA GENERATOR
 * For testing and previewing the UI in Claude Desktop
 * Generates realistic 181-field analysis results
 */

import type { OliviaEnhancedAnalysisResult } from '@/types/olivia-enhanced';

export function generateMockOliviaAnalysis(): OliviaEnhancedAnalysisResult {
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

    // Section Analysis (22 sections)
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
        concerns: [
          'Some neighbor considerations'
        ],
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
        concerns: [
          'Last sale was 8 years ago - limited recent comp data'
        ],
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
      // ... Continue for all 22 sections (abbreviated for space)
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
        sectionId: 'environment_risk',
        sectionName: 'Environment & Risk',
        sectionNumber: 15,
        grade: 'C+',
        score: 68,
        confidence: 90,
        keyFindings: [
          'Flood Zone AE requires mandatory insurance',
          'Hurricane risk HIGH - windstorm premiums significant',
          'Sea level rise moderate concern over 30+ year horizon',
        ],
        strengths: [
          'Above base flood elevation by 3 feet',
          'No superfund sites within 5 miles',
          'Air quality excellent (AQI typically 25-40)',
        ],
        concerns: [
          'Insurance costs $4,800/year (flood + wind)',
          'Climate risk increasing per NOAA projections',
          'Hurricane shutters required - $12k retrofit if absent',
        ],
        visualData: { type: 'heatmap', data: {} },
        fieldsAnalyzed: [117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130],
        fieldCount: 14,
        fieldsWithData: 12,
        completeness: 86,
      },
      // Additional sections...
      {
        sectionId: 'waterfront',
        sectionName: 'Waterfront',
        sectionNumber: 20,
        grade: 'A+',
        score: 96,
        confidence: 98,
        keyFindings: [
          '45 feet of direct water frontage on protected bay',
          'Private dock with boat lift (15,000 lb capacity)',
          'Unobstructed sunset water views',
        ],
        strengths: [
          'Direct Gulf access, no bridges',
          'Deep water channel (6ft at low tide)',
          'Protected waters ideal for kayaking/paddleboarding',
        ],
        concerns: [
          'Dock maintenance responsibility',
        ],
        visualData: { type: 'gauge', data: { score: 96 } },
        fieldsAnalyzed: [155, 156, 157, 158, 159],
        fieldCount: 5,
        fieldsWithData: 5,
        completeness: 100,
      },
    ],

    // Property Rankings
    propertyRankings: [
      {
        rank: 1,
        propertyId: 'prop-789-gulf',
        overallScore: 87,
        grade: 'A-',
        pros: [
          'Best value per square foot ($340 vs $395 average)',
          'Direct waterfront with private dock',
          'Top-rated school district (all 8+ ratings)',
          'Recent major system upgrades (HVAC, roof)',
          'Exceptional walkability (89 Walk Score)',
        ],
        cons: [
          'Higher flood insurance costs ($2,400/year)',
          'HOA fees above average ($485/month)',
          'Smaller lot size than competitors',
        ],
      },
      {
        rank: 2,
        propertyId: 'prop-456-beach',
        overallScore: 82,
        grade: 'B+',
        pros: [
          'Largest living space (2,500 sq ft)',
          'Pool and outdoor entertainment area',
          'Lower HOA fees ($285/month)',
          'Corner lot with extra privacy',
        ],
        cons: [
          'No water frontage (0.3 miles to beach)',
          'Older HVAC system (2008) - replacement likely',
          'Mixed school ratings (6-8 range)',
          'Higher price per square foot',
        ],
      },
      {
        rank: 3,
        propertyId: 'prop-123-ocean',
        overallScore: 79,
        grade: 'B',
        pros: [
          'Newest construction (2018)',
          'Smart home features throughout',
          'Excellent condition (10/10)',
          'EV charging installed',
        ],
        cons: [
          'Highest overall price (limited equity upside)',
          'Water view only (no direct access)',
          'Higher property taxes ($8,200/year)',
          'Rental restrictions (12-month minimum)',
          'Lower cap rate (2.9%)',
        ],
      },
    ],

    // Olivia's Verbal Analysis
    verbalAnalysis: {
      executiveSummary: `Hello! I'm Olivia, and I've completed a comprehensive analysis of these three exceptional Florida waterfront properties. After evaluating all 181 data points across 23 categories, I'm excited to share some fascinating insights with you.

The property at 789 Gulf Way emerges as my top recommendation with an A- investment grade. Here's why: This property offers an incredibly rare combination - premium waterfront living with direct boat access, yet it's priced 18% below the assessed value. That's immediate equity the moment you close.

What really sets this apart is the location intelligence. With a Walk Score of 89, you're in what we call a "Walker's Paradise" - restaurants, shops, and beaches all within a pleasant stroll. The school district is outstanding, with all three assigned schools rated 8 out of 10 or higher. For families, this is gold.

Now, let's talk honestly about the considerations. You're in Florida coastal territory, which means flood insurance is mandatory and hurricane coverage adds about $4,800 annually to your insurance costs. But here's the thing - the property sits 3 feet above base flood elevation and has had major systems upgraded recently. The HVAC is from 2023, roof from 2021. You're looking at warranty-protected systems for the next 8+ years.

The investment fundamentals are solid. Cap rate of 3.9%, rental yield at 4.8%, and if you're considering vacation rentals, this area sees 85% occupancy with premium pricing potential. The HOA fees are $485 monthly, which is higher than average, but they include the dock maintenance and waterfront amenities.

My confidence in this recommendation is 92%. This is based on hard data across value metrics, location quality, property condition, and market position. Whether you're buying as a primary residence, vacation home, or investment property, this checks the right boxes.`,

      propertyAnalysis: [
        {
          propertyId: 'prop-789-gulf',
          verbalSummary: 'The 789 Gulf Way property is my top choice for compelling reasons. The waterfront access with 45 feet of frontage and a private dock creates inherent value that\'s difficult to replicate. The pricing at $750,000 represents an 18% discount to assessed value, creating immediate equity. Location scores are exceptional - Walk Score 89, Transit Score 76, and you\'re 0.4 miles from the beach. The recent system upgrades mean your maintenance exposure for major items is minimal for years to come.',
          topStrengths: [
            'Waterfront with dock - adds $80k+ in comparable value',
            'Below-market pricing creates instant equity',
            'Premium location scores (Walk 89, Transit 76)',
            'Recent major system upgrades reduce risk',
            'Top-rated schools throughout',
          ],
          topConcerns: [
            'Flood Zone AE insurance costs ($2,400/year)',
            'HOA fees above area average',
            'Smaller lot limits expansion options',
          ],
        },
        {
          propertyId: 'prop-456-beach',
          verbalSummary: 'The 456 Beach Avenue property offers the most square footage at 2,500 sq ft and includes a pool - great for entertaining. The corner lot provides extra privacy and the HOA fees are notably lower at $285/month. However, you trade waterfront access for these benefits, and you\'re looking at an HVAC replacement in the near term given the 2008 system age.',
          topStrengths: [
            'Largest living space (2,500 sq ft)',
            'Pool and entertainment-ready outdoor space',
            'Lower monthly costs (HOA $285)',
            'Corner lot privacy',
          ],
          topConcerns: [
            'No waterfront access',
            'HVAC system age (16 years old)',
            'Mixed school ratings',
            'Higher price per square foot reduces value play',
          ],
        },
        {
          propertyId: 'prop-123-ocean',
          verbalSummary: 'The 123 Ocean Drive property is the newest (2018) and features modern smart home technology throughout. Condition is pristine. However, it\'s priced at a premium with the highest property taxes, and rental restrictions limit investment flexibility. It\'s ideal if you\'re looking for a move-in-ready modern home and don\'t need direct water access.',
          topStrengths: [
            'Newest construction (2018)',
            'Smart home features integrated',
            'Pristine condition (10/10)',
            'Modern systems and warranties',
          ],
          topConcerns: [
            'Highest price point limits equity upside',
            'Rental restrictions (12-month minimum)',
            'Elevated property taxes ($8,200/year)',
            'Lower cap rate for investors (2.9%)',
          ],
        },
      ],

      comparisonInsights: 'Comparing these three properties reveals distinct value propositions. Property 789 Gulf Way offers the best balance of value, location, and investment fundamentals. Property 456 Beach Avenue maximizes space and amenities while minimizing monthly costs. Property 123 Ocean Drive delivers modern luxury with premium finishes. Your choice ultimately depends on whether you prioritize waterfront access and investment potential (789), space and entertainment value (456), or modern construction and smart features (123).',

      topRecommendation: {
        propertyId: 'prop-789-gulf',
        reasoning: 'The combination of below-market pricing, premium waterfront access, exceptional location scores, and recent system upgrades creates the strongest overall value proposition. The 18% discount to assessed value provides immediate equity, while the waterfront with dock adds scarcity value that appreciates faster than comparable inland properties. For long-term wealth building, this represents the optimal choice.',
        confidence: 92,
      },
    },

    // Multi-LLM Market Forecast
    marketForecast: {
      llmSources: ['claude-opus', 'gpt-5.2-pro', 'gemini-3-pro', 'perplexity'],
      appreciationForecast: {
        year1: 5.2,
        year3: 16.8,
        year5: 29.5,
        year10: 68.2,
        confidence: 82,
      },
      marketTrends: {
        priceDirection: 'rising',
        demandLevel: 'high',
        inventoryLevel: 'low',
        daysOnMarketTrend: 'decreasing',
      },
      marketRisks: {
        economicRisks: [
          'Interest rate volatility may impact buyer purchasing power',
          'Inflation pressures on construction costs could slow new development',
          'Insurance market disruption in Florida coastal markets',
        ],
        climateRisks: [
          'Hurricane frequency increasing per NOAA data',
          'Sea level rise projections 8-12 inches by 2050',
          'Flood insurance costs rising 8-12% annually',
        ],
        demographicShifts: [
          'Remote work enabling migration from expensive metros',
          'Aging baby boomer population seeking warmer climates',
          'Gen Z homebuyers prioritizing walkability and lifestyle',
        ],
        regulatoryChanges: [
          'Potential flood zone remapping affects insurance requirements',
          'Short-term rental ordinances under review in many municipalities',
          'Building code updates post-recent hurricane seasons',
        ],
      },
      marketOpportunities: {
        nearTerm: [
          'Strong tourism recovery driving vacation rental demand',
          'Inventory shortage (3.2 months supply) supporting prices',
          'Corporate relocations to Florida accelerating',
          'Pent-up demand from buyers priced out of 2021-2022 market',
        ],
        longTerm: [
          'Population growth trends favor Florida (+1.9% annually)',
          'Infrastructure investments ($12B coastal resilience projects)',
          'Waterfront scarcity increasing as development maxes out',
          'Climate migration from extreme heat zones',
        ],
      },
      forecastDate: new Date().toISOString(),
      dataQuality: 'high',
    },

    // Decision Tree Recommendations
    decisionRecommendations: [
      {
        buyerProfile: 'investor',
        recommendation: {
          action: 'highly-recommend',
          reasoning: 'Property 789 Gulf Way offers superior investment fundamentals: 4.8% rental yield, 3.9% cap rate, and below-market entry price creates forced appreciation potential. Waterfront scarcity ensures long-term value growth. Vacation rental potential significant with estimated gross yields of 8-10% achievable.',
          confidence: 89,
        },
        keyConsiderations: [
          'Rental income potential: $3,600-4,200/month long-term, $250-350/night short-term',
          'Insurance costs higher but offset by premium rental rates',
          'Waterfront properties historically appreciate 12-15% faster',
          'Exit liquidity excellent - waterfront moves fast even in down markets',
        ],
        financialAnalysis: {
          upfrontCosts: 187500, // 25% down
          monthlyCosts: 5850, // PITI + HOA + insurance
          expectedROI: 8.5,
          breakEvenYears: 6,
        },
        immediateActions: [
          'Verify vacation rental ordinances and permitting',
          'Analyze rental comps for both long-term and short-term strategies',
          'Model cash flow scenarios at 75%, 85%, and 95% occupancy',
          'Evaluate property management companies and fees (typically 10-12%)',
        ],
        dueDiligenceChecklist: [
          'Review HOA financial reserves and special assessment history',
          'Inspect dock condition and verify boat lift functionality',
          'Confirm flood zone designation and obtain insurance quotes',
          'Research rental demand trends and seasonality',
          'Verify all permits for dock, seawall, and structures',
        ],
      },
      {
        buyerProfile: 'family',
        recommendation: {
          action: 'highly-recommend',
          reasoning: 'Property 789 Gulf Way excels for families: top-rated schools (all 8+), safe neighborhood (low crime indices), walkable lifestyle (Walk Score 89), and waterfront activities. The 3-bedroom layout accommodates growing families while the location supports long-term stability.',
          confidence: 91,
        },
        keyConsiderations: [
          'All assigned schools rated 8/10 or higher within 1.5 miles',
          'Walk Score 89 means kids can safely bike/walk to activities',
          'Waterfront provides endless outdoor recreation',
          'Community-oriented HOA with family events',
        ],
        financialAnalysis: {
          upfrontCosts: 187500,
          monthlyCosts: 5850,
        },
        immediateActions: [
          'Tour all three assigned schools and meet principals',
          'Drive neighborhood during school hours to assess traffic',
          'Visit during weekend to experience community vibe',
          'Verify playground and park locations within walking distance',
        ],
        dueDiligenceChecklist: [
          'Confirm school district boundaries (verify assignments)',
          'Check for any planned school redistricting',
          'Research extracurricular activities and sports programs',
          'Evaluate proximity to pediatricians and urgent care',
          'Assess childcare options and costs in area',
        ],
      },
      {
        buyerProfile: 'retiree',
        recommendation: {
          action: 'consider',
          reasoning: 'Property 789 Gulf Way offers excellent lifestyle benefits for retirees: single-story living, low maintenance with recent system upgrades, waterfront recreation, and walkable amenities. However, hurricane risk and insurance costs warrant careful consideration for fixed-income budgets. Property 456 Beach Avenue may offer lower operating costs if waterfront isn\'t essential.',
          confidence: 76,
        },
        keyConsiderations: [
          'Single-story eliminates stairs - excellent aging-in-place design',
          'Hurricane preparedness requires planning (shutters, evacuation)',
          'Healthcare access: Hospitals within 3.5 miles',
          'Social opportunities through waterfront community',
        ],
        financialAnalysis: {
          upfrontCosts: 750000, // Assume cash purchase for retirees
          monthlyCosts: 2100, // HOA + taxes + insurance (no mortgage)
        },
        immediateActions: [
          'Obtain detailed insurance quotes including flood and wind',
          'Evaluate total monthly carrying costs against fixed income',
          'Visit during different seasons to assess comfort',
          'Research local healthcare facilities and specialists',
        ],
        dueDiligenceChecklist: [
          'Verify Medicare providers and network in area',
          'Assess accessibility features and modification potential',
          'Research community services and senior programs',
          'Evaluate proximity to family and support network',
          'Understand hurricane preparation and evacuation routes',
        ],
      },
    ],

    // HeyGen Configuration
    heygenConfig: {
      avatarId: 'olivia-clues-avatar-v1',
      isLive: false,
      timedPopups: [
        {
          timestamp: 12,
          popupType: 'insight',
          content: { message: 'Investment Grade: A-' },
        },
        {
          timestamp: 28,
          popupType: 'chart',
          content: { chartId: 'waterfront-value-comparison' },
        },
        {
          timestamp: 45,
          popupType: 'data',
          content: { field: 'walk_score', value: 89 },
        },
        {
          timestamp: 67,
          popupType: 'chart',
          content: { chartId: 'school-ratings-map' },
        },
        {
          timestamp: 89,
          popupType: 'insight',
          content: { message: 'Climate Risk Analysis' },
        },
      ],
    },

    // Q&A State
    qaState: {
      conversationHistory: [
        {
          question: 'How does the flood risk affect my insurance costs?',
          answer: 'Great question! This property is in Flood Zone AE, which requires mandatory flood insurance. Based on the elevation certificate showing 3 feet above base flood elevation, your flood insurance premium is estimated at $2,400 annually. Combined with windstorm coverage at approximately $2,400/year, total climate-related insurance is around $4,800/year. This is $3,200 higher than comparable inland properties, but it\'s factored into the overall investment analysis and the premium rental rates achievable for waterfront justify this cost.',
          relatedFields: [119, 120, 97],
          relatedCharts: ['insurance-cost-comparison', 'flood-zone-map'],
          timestamp: new Date().toISOString(),
        },
      ],
      suggestedQuestions: [
        'What are the total monthly carrying costs including all fees?',
        'How do the school ratings compare to other neighborhoods?',
        'What\'s the vacation rental income potential?',
        'Is the HOA financially stable?',
        'What major maintenance should I expect in the next 5 years?',
        'How does this waterfront location compare to others?',
      ],
      activeTopics: ['flood insurance', 'waterfront value', 'investment potential', 'school quality'],
    },

    // Call to Action
    callToAction: {
      primaryAction: 'Based on this comprehensive 181-field analysis, Property 789 Gulf Way represents an exceptional opportunity. The below-market pricing combined with premium waterfront access creates both immediate equity and long-term appreciation potential. I recommend scheduling an in-person tour within the next 7 days, as waterfront properties in this price range typically receive multiple offers.',
      secondaryActions: [
        'Download complete 181-field property report (PDF)',
        'Schedule virtual consultation with CLUES™ certified advisor',
        'Request customized financial analysis for your specific situation',
        'Tour property with Olivia via FaceTime walkthrough',
      ],
      nextSteps: [
        'Verify flood insurance quotes from 3 providers (budget $2,400/year)',
        'Tour property and neighborhood (schedule morning + evening visits)',
        'Review HOA meeting minutes from past 12 months',
        'Obtain pre-approval letter (recommended before offer)',
        'Schedule professional inspection (budget $500-800)',
        'Research comparable waterfront sales in past 6 months',
        'Evaluate rental potential with local property managers',
      ],
    },
  };
}
