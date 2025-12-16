/**
 * MATHEMATICAL ANALYSIS SYSTEM - USAGE EXAMPLE
 *
 * This file demonstrates how to use the mathematical analysis system
 * to get honest, provable property recommendations from Olivia AI.
 */

import { analyzeWithOliviaEnhanced, extractPropertyData } from './src/api/olivia-brain-enhanced';
import type { Property } from './src/types/property';

// ============================================================================
// EXAMPLE 1: Clear Winner (Obvious Best Choice)
// ============================================================================

async function example1_ClearWinner() {
  console.log('\n📊 EXAMPLE 1: Clear Winner\n');

  // Three properties with obvious differences
  const property1: Property = {
    id: 'prop-1',
    address: {
      fullAddress: { value: '123 Main St, Tampa, FL 33601', confidence: 'high', notes: '', sources: [] },
      listingPrice: { value: 300000, confidence: 'high', notes: '', sources: [] },
    },
    details: {
      bedrooms: { value: 4, confidence: 'high', notes: '', sources: [] },
      livingSqft: { value: 2500, confidence: 'high', notes: '', sources: [] },
      annualTaxes: { value: 4000, confidence: 'high', notes: '', sources: [] },
      yearBuilt: { value: 2010, confidence: 'high', notes: '', sources: [] },
    },
    location: {
      walkScore: { value: 85, confidence: 'high', notes: '', sources: [] },
      highSchoolRating: { value: 'A+', confidence: 'high', notes: '', sources: [] },
    },
    financial: {
      capRateEst: { value: 8.2, confidence: 'medium', notes: '', sources: [] },
      rentalYield: { value: 9.1, confidence: 'medium', notes: '', sources: [] },
    },
    utilities: {
      floodRisk: { value: 'low', confidence: 'high', notes: '', sources: [] },
    },
    smartScore: 95,
    dataCompleteness: 98,
    // ... other fields
  } as any;

  const property2: Property = {
    id: 'prop-2',
    address: {
      fullAddress: { value: '456 Oak Ave, Tampa, FL 33602', confidence: 'high', notes: '', sources: [] },
      listingPrice: { value: 500000, confidence: 'high', notes: '', sources: [] },
    },
    details: {
      bedrooms: { value: 3, confidence: 'high', notes: '', sources: [] },
      livingSqft: { value: 1800, confidence: 'high', notes: '', sources: [] },
      annualTaxes: { value: 8000, confidence: 'high', notes: '', sources: [] },
      yearBuilt: { value: 1995, confidence: 'high', notes: '', sources: [] },
    },
    location: {
      walkScore: { value: 65, confidence: 'high', notes: '', sources: [] },
      highSchoolRating: { value: 'B', confidence: 'high', notes: '', sources: [] },
    },
    financial: {
      capRateEst: { value: 5.1, confidence: 'medium', notes: '', sources: [] },
      rentalYield: { value: 5.8, confidence: 'medium', notes: '', sources: [] },
    },
    utilities: {
      floodRisk: { value: 'moderate', confidence: 'high', notes: '', sources: [] },
    },
    smartScore: 72,
    dataCompleteness: 89,
    // ... other fields
  } as any;

  const property3: Property = {
    id: 'prop-3',
    address: {
      fullAddress: { value: '789 Elm Dr, Tampa, FL 33603', confidence: 'high', notes: '', sources: [] },
      listingPrice: { value: 600000, confidence: 'high', notes: '', sources: [] },
    },
    details: {
      bedrooms: { value: 3, confidence: 'high', notes: '', sources: [] },
      livingSqft: { value: 1500, confidence: 'high', notes: '', sources: [] },
      annualTaxes: { value: 12000, confidence: 'high', notes: '', sources: [] },
      yearBuilt: { value: 1985, confidence: 'high', notes: '', sources: [] },
    },
    location: {
      walkScore: { value: 55, confidence: 'high', notes: '', sources: [] },
      highSchoolRating: { value: 'C', confidence: 'high', notes: '', sources: [] },
    },
    financial: {
      capRateEst: { value: 4.2, confidence: 'medium', notes: '', sources: [] },
      rentalYield: { value: 4.5, confidence: 'medium', notes: '', sources: [] },
    },
    utilities: {
      floodRisk: { value: 'high', confidence: 'high', notes: '', sources: [] },
    },
    smartScore: 58,
    dataCompleteness: 85,
    // ... other fields
  } as any;

  // Extract all 168 fields
  const prop1Data = extractPropertyData(property1);
  const prop2Data = extractPropertyData(property2);
  const prop3Data = extractPropertyData(property3);

  // Analyze with mathematical rigor
  const result = await analyzeWithOliviaEnhanced({
    properties: [prop1Data, prop2Data, prop3Data],
    buyerProfile: 'investor',
    includeMarketForecast: false,
  });

  // Check validation
  if (result.validation && !result.validation.isValid) {
    console.error('❌ HALLUCINATION DETECTED!');
    console.error('Errors:', result.validation.errors);
    console.error('Hallucinations:', result.validation.hallucinations);
    return;
  }

  // Expected result: Property 1 should win by significant margin
  console.log('✅ Analysis complete - No hallucinations');
  console.log(`\nWinner: Property ${result.overallRecommendation.winner}`);
  console.log(`Score: ${result.overallRecommendation.winnerScore}/100`);
  console.log(`Runner-up: Property ${result.overallRecommendation.runnerUp} (${result.overallRecommendation.runnerUpScore})`);
  console.log(`Score gap: ${result.overallRecommendation.scoreGap} points`);
  console.log(`\nCalculation proof:\n${result.overallRecommendation.calculation}`);

  // Show section winners
  console.log('\n📋 Section Winners:');
  result.sectionScores.forEach(section => {
    console.log(`  ${section.sectionName}: Property ${section.winner} (${section.property1.score}, ${section.property2.score}, ${section.property3.score})`);
  });

  // Show key findings
  console.log('\n🔍 Key Findings:');
  result.keyFindings.forEach((finding, i) => {
    console.log(`  ${i + 1}. ${finding.finding}`);
    console.log(`     Proof: ${finding.proof}`);
  });

  // EXPECTED OUTPUT:
  // Winner: Property 1
  // Score: 94-96 / 100
  // Runner-up: Property 2 (75-80)
  // Score gap: 15-20 points
  //
  // Property 1 wins because:
  // - 40% cheaper ($300k vs $500k vs $600k)
  // - 39% more sqft than P2, 67% more than P3
  // - 60% better cap rate than P2, 95% better than P3
  // - Best schools (A+ vs B vs C)
  // - Lowest taxes ($4k vs $8k vs $12k)
  // - Lowest flood risk
}

// ============================================================================
// EXAMPLE 2: Close Competition (Buyer Profile Dependent)
// ============================================================================

async function example2_CloseCompetition() {
  console.log('\n📊 EXAMPLE 2: Close Competition - Buyer Profile Matters\n');

  // Property 1: Cheaper, smaller, OK schools, GREAT ROI
  const property1: Property = {
    id: 'prop-a',
    address: {
      fullAddress: { value: '100 Investment Ln, Tampa, FL', confidence: 'high', notes: '', sources: [] },
      listingPrice: { value: 250000, confidence: 'high', notes: '', sources: [] },
    },
    details: {
      bedrooms: { value: 3, confidence: 'high', notes: '', sources: [] },
      livingSqft: { value: 1400, confidence: 'high', notes: '', sources: [] },
      annualTaxes: { value: 3500, confidence: 'high', notes: '', sources: [] },
    },
    location: {
      highSchoolRating: { value: 'B-', confidence: 'high', notes: '', sources: [] },
      walkScore: { value: 70, confidence: 'high', notes: '', sources: [] },
    },
    financial: {
      capRateEst: { value: 9.5, confidence: 'high', notes: '', sources: [] },
      rentalYield: { value: 10.2, confidence: 'high', notes: '', sources: [] },
      rentalEstimate: { value: 2100, confidence: 'high', notes: '', sources: [] },
    },
    smartScore: 88,
    dataCompleteness: 95,
    // ... other fields
  } as any;

  // Property 2: More expensive, larger, EXCELLENT schools, lower ROI
  const property2: Property = {
    id: 'prop-b',
    address: {
      fullAddress: { value: '200 Family Blvd, Tampa, FL', confidence: 'high', notes: '', sources: [] },
      listingPrice: { value: 425000, confidence: 'high', notes: '', sources: [] },
    },
    details: {
      bedrooms: { value: 4, confidence: 'high', notes: '', sources: [] },
      livingSqft: { value: 2200, confidence: 'high', notes: '', sources: [] },
      annualTaxes: { value: 7000, confidence: 'high', notes: '', sources: [] },
    },
    location: {
      highSchoolRating: { value: 'A+', confidence: 'high', notes: '', sources: [] },
      elementaryRating: { value: 'A', confidence: 'high', notes: '', sources: [] },
      middleRating: { value: 'A', confidence: 'high', notes: '', sources: [] },
      walkScore: { value: 92, confidence: 'high', notes: '', sources: [] },
      crimeRate: { value: 0.2, confidence: 'high', notes: '', sources: [] },
    },
    financial: {
      capRateEst: { value: 5.8, confidence: 'high', notes: '', sources: [] },
      rentalYield: { value: 6.2, confidence: 'high', notes: '', sources: [] },
      rentalEstimate: { value: 2600, confidence: 'high', notes: '', sources: [] },
    },
    smartScore: 91,
    dataCompleteness: 97,
    // ... other fields
  } as any;

  // Property 3: Middle ground
  const property3: Property = {
    id: 'prop-c',
    address: {
      fullAddress: { value: '300 Compromise St, Tampa, FL', confidence: 'high', notes: '', sources: [] },
      listingPrice: { value: 350000, confidence: 'high', notes: '', sources: [] },
    },
    details: {
      bedrooms: { value: 4, confidence: 'high', notes: '', sources: [] },
      livingSqft: { value: 1900, confidence: 'high', notes: '', sources: [] },
      annualTaxes: { value: 5500, confidence: 'high', notes: '', sources: [] },
    },
    location: {
      highSchoolRating: { value: 'B+', confidence: 'high', notes: '', sources: [] },
      walkScore: { value: 78, confidence: 'high', notes: '', sources: [] },
    },
    financial: {
      capRateEst: { value: 7.1, confidence: 'high', notes: '', sources: [] },
      rentalYield: { value: 7.8, confidence: 'high', notes: '', sources: [] },
      rentalEstimate: { value: 2300, confidence: 'high', notes: '', sources: [] },
    },
    smartScore: 85,
    dataCompleteness: 93,
    // ... other fields
  } as any;

  const prop1Data = extractPropertyData(property1);
  const prop2Data = extractPropertyData(property2);
  const prop3Data = extractPropertyData(property3);

  // Test 1: Investor perspective
  console.log('🏦 INVESTOR PERSPECTIVE:');
  const investorResult = await analyzeWithOliviaEnhanced({
    properties: [prop1Data, prop2Data, prop3Data],
    buyerProfile: 'investor',
    includeMarketForecast: false,
  });

  console.log(`  Winner: Property ${investorResult.overallRecommendation.winner}`);
  console.log(`  Score: ${investorResult.overallRecommendation.winnerScore}/100`);
  console.log(`  Key reason: ${investorResult.buyerSpecificRecommendations?.investor?.reasoning}`);
  console.log(`  Proof: ${investorResult.buyerSpecificRecommendations?.investor?.proof}`);

  // EXPECTED: Property 1 wins (best cap rate + rental yield)

  // Test 2: Family perspective
  console.log('\n👨‍👩‍👧‍👦 FAMILY PERSPECTIVE:');
  const familyResult = await analyzeWithOliviaEnhanced({
    properties: [prop1Data, prop2Data, prop3Data],
    buyerProfile: 'family',
    includeMarketForecast: false,
  });

  console.log(`  Winner: Property ${familyResult.overallRecommendation.winner}`);
  console.log(`  Score: ${familyResult.overallRecommendation.winnerScore}/100`);
  console.log(`  Key reason: ${familyResult.buyerSpecificRecommendations?.family?.reasoning}`);
  console.log(`  Proof: ${familyResult.buyerSpecificRecommendations?.family?.proof}`);

  // EXPECTED: Property 2 wins (best schools + safety + space)

  console.log('\n📊 COMPARISON:');
  console.log('  Investor winner: Property 1 (highest ROI)');
  console.log('  Family winner: Property 2 (best schools/safety)');
  console.log('  → Different buyers, different winners - BOTH MATHEMATICALLY PROVEN');
}

// ============================================================================
// EXAMPLE 3: Hallucination Detection
// ============================================================================

async function example3_HallucinationDetection() {
  console.log('\n📊 EXAMPLE 3: Hallucination Detection\n');

  // Simulate a response that's missing calculations
  const fakeResponse = {
    investmentGrade: {
      property1: {
        grade: 'A+',
        score: 95,
        calculation: '', // ❌ MISSING!
      },
      property2: {
        grade: 'B',
        score: 80,
        calculation: 'Some calculation',
      },
      property3: {
        grade: 'A',
        score: 90,
        calculation: 'Some calculation',
      },
      winner: 1,
      reasoning: 'Property 1 is best',
    },
    fieldComparisons: [
      // Only 50 fields instead of 168
      {
        fieldNumber: 10,
        fieldName: 'listing_price',
        property1: { value: '$300k', score: 100, calculation: '' }, // ❌ MISSING!
        property2: { value: '$400k', score: 50, calculation: 'Some calc' },
        property3: { value: '$500k', score: 0, calculation: 'Some calc' },
        winner: 1,
      },
      // ... only 49 more fields (missing 118!)
    ],
    sectionScores: [
      {
        sectionName: 'Pricing & Value',
        property1: { score: 95, calculation: '' }, // ❌ MISSING!
        property2: { score: 80, calculation: 'Some calc' },
        property3: { score: 70, calculation: 'Some calc' },
        winner: 1,
      },
      // ... only 10 sections (missing 12!)
    ],
    overallRecommendation: {
      winner: 1,
      winnerScore: 95,
      calculation: '', // ❌ MISSING!
      reasoning: 'Property 1 is best overall',
    },
    keyFindings: [
      {
        finding: 'Property 1 has better value',
        proof: '', // ❌ MISSING!
      },
    ],
  };

  // Validate
  const { validateOliviaResponse } = await import('./src/api/olivia-math-engine');
  const validation = validateOliviaResponse(fakeResponse);

  console.log('🔍 Validation Results:');
  console.log(`  Valid: ${validation.isValid}`);
  console.log(`  Errors: ${validation.errors.length}`);
  console.log(`  Warnings: ${validation.warnings.length}`);
  console.log(`  Hallucinations: ${validation.hallucinations.length}`);

  if (!validation.isValid) {
    console.log('\n❌ CAUGHT HALLUCINATIONS:');
    validation.hallucinations.forEach((h, i) => {
      console.log(`  ${i + 1}. ${h}`);
    });

    console.log('\n❌ ERRORS:');
    validation.errors.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e}`);
    });

    console.log('\n⚠️ WARNINGS:');
    validation.warnings.forEach((w, i) => {
      console.log(`  ${i + 1}. ${w}`);
    });
  }

  // EXPECTED OUTPUT:
  // Valid: false
  // Hallucinations detected:
  //   1. investmentGrade.property1 missing calculation proof
  //   2. Field 10 (listing_price) missing calculation proof
  //   3. Section "Pricing & Value" missing calculation proof
  //   4. Overall recommendation missing calculation proof
  //   5. Key finding 1 missing mathematical proof
  // Warnings:
  //   1. Only 50 fields analyzed, expected 168
  //   2. Only 11 sections analyzed, expected 22
}

// ============================================================================
// EXAMPLE 4: Field-by-Field Scoring Examples
// ============================================================================

function example4_FieldScoring() {
  console.log('\n📊 EXAMPLE 4: Field-by-Field Scoring Examples\n');

  const {
    scoreLowerIsBetter,
    scoreHigherIsBetter,
    scoreCloserToIdeal,
    scoreBinary,
    scoreRiskAssessment,
    scoreQualityTier,
    scoreFinancialROI,
  } = require('./src/api/olivia-math-engine');

  // Example 1: Lower is better (annual taxes)
  console.log('1️⃣ Lower is Better (Annual Taxes):');
  const taxResult = scoreLowerIsBetter([5000, 8000, 12000]);
  console.log(`   Values: $5k, $8k, $12k`);
  console.log(`   Scores: ${taxResult.scores.map(s => s.toFixed(1)).join(', ')}`);
  console.log(`   Proof: ${taxResult.proof}`);
  console.log(`   Winner: Property 1 (lowest taxes)\n`);

  // Example 2: Higher is better (sqft)
  console.log('2️⃣ Higher is Better (Living Sqft):');
  const sqftResult = scoreHigherIsBetter([1500, 2000, 2500]);
  console.log(`   Values: 1500, 2000, 2500 sqft`);
  console.log(`   Scores: ${sqftResult.scores.map(s => s.toFixed(1)).join(', ')}`);
  console.log(`   Proof: ${sqftResult.proof}`);
  console.log(`   Winner: Property 3 (most sqft)\n`);

  // Example 3: Closer to ideal (year built)
  console.log('3️⃣ Closer to Ideal (Year Built):');
  const yearResult = scoreCloserToIdeal([1985, 2005, 2015], 2010, 10);
  console.log(`   Values: 1985, 2005, 2015 (ideal: 2010 ±10)`);
  console.log(`   Scores: ${yearResult.scores.map(s => s.toFixed(1)).join(', ')}`);
  console.log(`   Proof: ${yearResult.proof}`);
  console.log(`   Winner: Tie P2 & P3 (both near ideal)\n`);

  // Example 4: Binary (has pool)
  console.log('4️⃣ Binary (Has Pool):');
  const poolResult = scoreBinary([false, true, false]);
  console.log(`   Values: No, Yes, No`);
  console.log(`   Scores: ${poolResult.scores.map(s => s.toFixed(1)).join(', ')}`);
  console.log(`   Proof: ${poolResult.proof}`);
  console.log(`   Winner: Property 2 (only one with pool)\n`);

  // Example 5: Risk assessment (flood risk)
  console.log('5️⃣ Risk Assessment (Flood Risk):');
  const floodResult = scoreRiskAssessment(['low', 'moderate', 'none']);
  console.log(`   Values: Low, Moderate, None`);
  console.log(`   Scores: ${floodResult.scores.map(s => s.toFixed(1)).join(', ')}`);
  console.log(`   Proof: ${floodResult.proof}`);
  console.log(`   Winner: Property 3 (no flood risk)\n`);

  // Example 6: Quality tier (school rating)
  console.log('6️⃣ Quality Tier (School Rating):');
  const schoolResult = scoreQualityTier(['A-', 'B+', 'A']);
  console.log(`   Values: A-, B+, A`);
  console.log(`   Scores: ${schoolResult.scores.map(s => s.toFixed(1)).join(', ')}`);
  console.log(`   Proof: ${schoolResult.proof}`);
  console.log(`   Winner: Property 3 (best school)\n`);

  // Example 7: Financial ROI (cap rate)
  console.log('7️⃣ Financial ROI (Cap Rate):');
  const capRateResult = scoreFinancialROI([4.0, 8.0, 12.0], 8.0);
  console.log(`   Values: 4%, 8%, 12% (benchmark: 8%)`);
  console.log(`   Scores: ${capRateResult.scores.map(s => s.toFixed(1)).join(', ')}`);
  console.log(`   Proof: ${capRateResult.proof}`);
  console.log(`   Winner: Tie P2 & P3 (meet/exceed benchmark)\n`);
}

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

export async function runAllExamples() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   OLIVIA MATHEMATICAL ANALYSIS SYSTEM - EXAMPLES');
  console.log('═══════════════════════════════════════════════════════════');

  // Run examples
  await example1_ClearWinner();
  await example2_CloseCompetition();
  await example3_HallucinationDetection();
  example4_FieldScoring();

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   ALL EXAMPLES COMPLETE');
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Uncomment to run:
// runAllExamples().catch(console.error);
