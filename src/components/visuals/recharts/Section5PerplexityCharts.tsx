/**
 * Section 5: Perplexity Analysis Charts (adapted for Visuals tab)
 * Originally from src/components/perplexity/categories/CategoryE.tsx
 *
 * Charts:
 * 1. Systems Health Radar - 7-8 axis radar chart
 * 2. Exterior Condition - Bar scores for Roof, Foundation, Siding, Landscaping
 * 3. Replacement Horizon - Years left bars for Roof & HVAC
 *
 * NOTE: Interior Condition chart moved to Section 6 (Interior Features)
 */

import { motion } from 'framer-motion';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler);

// CLUES-Smart scoring colors (for brain widgets and badges)
function getScoreColor(score: number): string {
  if (score >= 81) return '#4CAF50'; // Green - Excellent
  if (score >= 61) return '#2196F3'; // Blue - Good
  if (score >= 41) return '#FFEB3B'; // Yellow - Average
  if (score >= 21) return '#FF9800'; // Orange - Fair
  return '#FF4444'; // Red - Poor
}

function getScoreLabel(score: number): string {
  if (score >= 81) return 'Excellent';
  if (score >= 61) return 'Good';
  if (score >= 41) return 'Average';
  if (score >= 21) return 'Fair';
  return 'Poor';
}

// Winner Badge Component
const WinnerBadge: React.FC<{ winnerName: string; score: number; reason: string }> = ({
  winnerName,
  score,
  reason,
}) => {
  const color = getScoreColor(score);
  return (
    <div className="mt-4 flex justify-center">
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-xl"
        style={{
          background: `${color}20`,
          border: `2px solid ${color}`,
        }}
      >
        <span className="text-2xl">🏆</span>
        <div>
          <p className="text-sm font-bold text-white">Winner: {winnerName}</p>
          <p className="text-xs" style={{ color }}>
            CLUES-Smart Score: {score}/100 ({getScoreLabel(score)}) - {reason}
          </p>
        </div>
      </div>
    </div>
  );
};

// CLUES-Smart Scale Legend Component
const SmartScaleLegend: React.FC = () => {
  return (
    <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-4 border-purple-400">
      <p className="text-xs font-bold text-purple-300 mb-2">CLUES-Smart Score Scale:</p>
      <div className="grid grid-cols-5 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: '#4CAF50' }}></div>
          <span className="text-gray-300">81-100: Excellent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: '#2196F3' }}></div>
          <span className="text-gray-300">61-80: Good</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: '#FFEB3B' }}></div>
          <span className="text-gray-300">41-60: Average</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: '#FF9800' }}></div>
          <span className="text-gray-300">21-40: Fair</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: '#FF4444' }}></div>
          <span className="text-gray-300">0-20: Poor</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// DATA INTERFACE (matching Visuals tab format)
// ============================================
export interface Home {
  id: string;
  name: string; // Full address
  color: string; // Property color (Green/Lavender/Pink)

  // Fields 39-48
  roofType: string;
  roofAgeEst: string;
  exteriorMaterial: string;
  foundation: string;
  waterHeaterType: string;
  garageType: string;
  hvacType: string;
  hvacAge: string;
  laundryType: string;
  interiorCondition: string;

  // Supporting fields
  listingPrice?: number;
  yearBuilt?: number;

  // Additional fields for Perplexity charts
  poolYn?: boolean;
  poolType?: string;
  electricProvider?: string;
  waterProvider?: string;
  kitchenFeatures?: string;
  flooringType?: string;
  landscaping?: string;
  fullBathrooms?: number;
}

// ============================================
// AGE-BASED SCORING SYSTEM (CLUES-Smart)
// ============================================

/**
 * Extract numeric age from string like "5 years", "10+ yrs", "2"
 */
function extractAge(ageStr: string | undefined | null): number | null {
  if (!ageStr) return null;
  const match = String(ageStr).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Roof Age Scoring (depends on roof type)
 * - Shingle: 0-5 Excellent (95), 6-10 Good (75), 11-15 Average (55), 16-20 Fair (35), 20+ Poor (15)
 * - Flat: 0-4 Excellent (95), 5-8 Good (75), 9-12 Average (55), 13-17 Fair (35), 17+ Poor (15)
 * - Tile: 0-10 Excellent (95), 11-20 Good (75), 21-30 Average (55), 31-40 Fair (35), 40+ Poor (15)
 */
function scoreRoofByAge(roofType: string, ageYears: number | null): number {
  if (ageYears === null) return 50; // Unknown age

  const type = (roofType || '').toLowerCase();

  // Shingle roof thresholds
  if (type.includes('shingle') || type.includes('asphalt')) {
    if (ageYears <= 5) return 95;  // Excellent (Green)
    if (ageYears <= 10) return 75; // Good (Blue)
    if (ageYears <= 15) return 55; // Average (Yellow)
    if (ageYears <= 20) return 35; // Fair (Orange)
    return 15; // Poor (Red)
  }

  // Flat roof thresholds
  if (type.includes('flat')) {
    if (ageYears <= 4) return 95;  // Excellent (Green)
    if (ageYears <= 8) return 75;  // Good (Blue)
    if (ageYears <= 12) return 55; // Average (Yellow)
    if (ageYears <= 17) return 35; // Fair (Orange)
    return 15; // Poor (Red)
  }

  // Tile roof thresholds (also applies to Metal, Slate)
  if (type.includes('tile') || type.includes('metal') || type.includes('slate')) {
    if (ageYears <= 10) return 95;  // Excellent (Green)
    if (ageYears <= 20) return 75;  // Good (Blue)
    if (ageYears <= 30) return 55;  // Average (Yellow)
    if (ageYears <= 40) return 35;  // Fair (Orange)
    return 15; // Poor (Red)
  }

  // Default to shingle thresholds for unknown types
  if (ageYears <= 5) return 95;
  if (ageYears <= 10) return 75;
  if (ageYears <= 15) return 55;
  if (ageYears <= 20) return 35;
  return 15;
}

/**
 * Water Heater / Plumbing Age Scoring
 * 0-3 Excellent (95), 4-6 Good (75), 7-10 Average (55), 11-13 Fair (35), 13+ Poor (15)
 */
function scoreWaterHeaterByAge(ageYears: number | null): number {
  if (ageYears === null) return 50; // Unknown age
  if (ageYears <= 3) return 95;   // Excellent (Green)
  if (ageYears <= 6) return 75;   // Good (Blue)
  if (ageYears <= 10) return 55;  // Average (Yellow)
  if (ageYears <= 13) return 35;  // Fair (Orange)
  return 15; // Poor (Red)
}

/**
 * HVAC Age Scoring (same as water heater)
 * 0-3 Excellent (95), 4-6 Good (75), 7-10 Average (55), 11-13 Fair (35), 13+ Poor (15)
 */
function scoreHVACByAge(ageYears: number | null): number {
  if (ageYears === null) return 50; // Unknown age
  if (ageYears <= 3) return 95;   // Excellent (Green)
  if (ageYears <= 6) return 75;   // Good (Blue)
  if (ageYears <= 10) return 55;  // Average (Yellow)
  if (ageYears <= 13) return 35;  // Fair (Orange)
  return 15; // Poor (Red)
}

/**
 * Electrical Panel Age Scoring
 * 0-10 Excellent (95), 11-25 Good (75), 26-40 Average (55), 41-55 Fair (35), 55+ Poor (15)
 */
function scoreElectricalByAge(ageYears: number | null): number {
  if (ageYears === null) return 50; // Unknown age
  if (ageYears <= 10) return 95;  // Excellent (Green)
  if (ageYears <= 25) return 75;  // Good (Blue)
  if (ageYears <= 40) return 55;  // Average (Yellow)
  if (ageYears <= 55) return 35;  // Fair (Orange)
  return 15; // Poor (Red)
}

/**
 * Windows Age Scoring
 * 0-10 Excellent (95), 11-20 Good (75), 21-30 Average (55), 31-40 Fair (35), 40+ Poor (15)
 */
function scoreWindowsByAge(ageYears: number | null): number {
  if (ageYears === null) return 50; // Unknown age
  if (ageYears <= 10) return 95;  // Excellent (Green)
  if (ageYears <= 20) return 75;  // Good (Blue)
  if (ageYears <= 30) return 55;  // Average (Yellow)
  if (ageYears <= 40) return 35;  // Fair (Orange)
  return 15; // Poor (Red)
}

/**
 * Foundation Scoring - QUALITY BASED (age irrelevant)
 * Scores foundation types by structural quality and longevity
 * Uses 5-tier CLUES-Smart system: 0-20 Poor, 21-40 Fair, 41-60 Average, 61-80 Good, 81-100 Excellent
 */
function scoreFoundationByType(foundationType: string | null): number {
  if (!foundationType) return 50; // Unknown foundation

  const type = foundationType.toLowerCase();

  // EXCELLENT (81-100): Best long-term structural integrity
  if (type.includes('slab') || type.includes('monolithic')) return 95;
  if (type.includes('basement') || type.includes('full basement')) return 90;

  // GOOD (61-80): Solid foundations with good longevity
  if (type.includes('crawl space') || type.includes('crawlspace')) return 75;
  if (type.includes('pier and beam') || type.includes('pier & beam')) return 70;

  // AVERAGE (41-60): Adequate but may require more maintenance
  if (type.includes('stem wall')) return 55;
  if (type.includes('continuous footer')) return 50;

  // FAIR (21-40): Older or less stable foundation types
  if (type.includes('pier') || type.includes('post')) return 35;
  if (type.includes('stone')) return 30;

  // POOR (0-20): Foundation types that may have issues
  if (type.includes('block') && !type.includes('slab')) return 15;

  // Default to average if type not recognized
  return 50;
}

/**
 * Pool / General Condition Scoring - CONDITION ONLY
 * Uses 5-tier CLUES-Smart system for condition-based scoring
 */
function conditionToScore(condition: string | null): number {
  if (!condition) return 50; // Unknown

  const c = condition.toUpperCase();

  // EXCELLENT (81-100)
  if (c === 'EXCELLENT' || c === 'LIKE NEW' || c === 'NEW') return 95;
  if (c === 'VERY GOOD') return 85;

  // GOOD (61-80)
  if (c === 'GOOD' || c === 'ABOVE AVERAGE') return 75;
  if (c === 'GOOD CONDITION') return 70;

  // AVERAGE (41-60)
  if (c === 'AVERAGE' || c === 'FAIR' || c === 'SATISFACTORY') return 50;

  // FAIR (21-40)
  if (c === 'BELOW AVERAGE' || c === 'NEEDS WORK') return 35;
  if (c === 'DATED') return 30;

  // POOR (0-20)
  if (c === 'POOR' || c === 'NEEDS MAJOR WORK') return 15;
  if (c === 'DILAPIDATED') return 5;

  // Default to average
  return 50;
}

function getConditionColor(score: number): string {
  if (score >= 81) return '#10B981'; // Green (81-100)
  if (score >= 61) return '#3B82F6'; // Blue (61-80)
  if (score >= 41) return '#F59E0B'; // Yellow (41-60)
  if (score >= 21) return '#F97316'; // Orange (21-40)
  return '#EF4444'; // Red (0-20)
}

// ============================================
// CHART 5-1: SYSTEMS HEALTH RADAR (AGE-BASED SCORING)
// ============================================
function SystemsRadar({ homes }: { homes: Home[] }) {
  const comparisonProperties = homes.slice(0, 3);
  const currentYear = new Date().getFullYear();

  // Check if any property has a pool
  const anyHasPool = comparisonProperties.some(h => h.poolYn === true || (h.poolType && h.poolType !== 'None'));

  console.log('\n🔍 ========================================');
  console.log('📊 CHART 5-1: SYSTEMS HEALTH RADAR - AGE-BASED CLUES-SMART SCORING');
  console.log('========================================\n');

  const propertyData = comparisonProperties.map((h, idx) => {
    const address = h.name || `Property ${idx + 1}`; // FULL address, no truncation
    const hasPool = h.poolYn === true || (h.poolType && h.poolType !== 'None');

    // Extract ages from fields
    const roofAge = extractAge(h.roofAgeEst);
    const hvacAge = extractAge(h.hvacAge);
    const houseAge = h.yearBuilt ? currentYear - h.yearBuilt : null;

    // Estimate component ages if not explicitly provided
    const waterHeaterAge = roofAge !== null ? roofAge : (houseAge !== null ? Math.min(houseAge, 15) : null);
    const electricalAge = houseAge; // Electrical panel typically as old as house
    const windowsAge = houseAge !== null ? Math.min(houseAge, 30) : null; // Cap at 30 years typical replacement

    // Apply age-based scoring
    const roofScore = scoreRoofByAge(h.roofType || '', roofAge);
    const hvacScore = scoreHVACByAge(hvacAge);
    const plumbingScore = scoreWaterHeaterByAge(waterHeaterAge);
    const electricalScore = scoreElectricalByAge(electricalAge);
    const windowsScore = scoreWindowsByAge(windowsAge);

    // Foundation uses TYPE-based scoring (age irrelevant)
    const foundationScore = scoreFoundationByType(h.foundation);

    // Pool uses condition scoring (age irrelevant)
    const poolScore = hasPool ? conditionToScore('GOOD') : 0;

    // Detailed logging for proof of calculation
    console.log(`\n🏠 Property ${idx + 1}: ${address}`);
    console.log(`   Property Color: ${h.color}`);
    console.log('   ─────────────────────────────────────');
    console.log(`   🏗️  ROOF (${h.roofType || 'Unknown Type'}):`);
    console.log(`      Age: ${roofAge !== null ? roofAge + ' years' : 'Unknown'}`);
    console.log(`      ⭐ CLUES Score: ${roofScore}/100`);
    console.log('   ─────────────────────────────────────');
    console.log(`   🏛️  FOUNDATION (type-based, age irrelevant):`);
    console.log(`      Type: ${h.foundation || 'Unknown'}`);
    console.log(`      ⭐ CLUES Score: ${foundationScore}/100 (Scored by foundation quality)`);
    console.log('   ─────────────────────────────────────');
    console.log(`   ⚡ ELECTRICAL PANEL:`);
    console.log(`      Age: ${electricalAge !== null ? electricalAge + ' years' : 'Unknown'}`);
    console.log(`      ⭐ CLUES Score: ${electricalScore}/100`);
    console.log('   ─────────────────────────────────────');
    console.log(`   🚰 PLUMBING / WATER HEATER:`);
    console.log(`      Age: ${waterHeaterAge !== null ? waterHeaterAge + ' years' : 'Unknown'}`);
    console.log(`      ⭐ CLUES Score: ${plumbingScore}/100`);
    console.log('   ─────────────────────────────────────');
    console.log(`   ❄️  HVAC SYSTEM:`);
    console.log(`      Age: ${hvacAge !== null ? hvacAge + ' years' : 'Unknown'}`);
    console.log(`      Type: ${h.hvacType || 'Unknown'}`);
    console.log(`      ⭐ CLUES Score: ${hvacScore}/100`);
    console.log('   ─────────────────────────────────────');
    console.log(`   🪟 WINDOWS/DOORS:`);
    console.log(`      Estimated Age: ${windowsAge !== null ? windowsAge + ' years' : 'Unknown'}`);
    console.log(`      ⭐ CLUES Score: ${windowsScore}/100`);
    if (hasPool) {
      console.log('   ─────────────────────────────────────');
      console.log(`   🏊 POOL/SPA (condition-only):`);
      console.log(`      Condition: GOOD (assumed)`);
      console.log(`      ⭐ CLUES Score: ${poolScore}/100`);
    }
    console.log('   ─────────────────────────────────────\n');

    return {
      id: h.id,
      label: `P${idx + 1}`, // Short label for legend
      fullAddress: address, // Full address for display
      // Age-based scores
      roof: roofScore,
      foundation: foundationScore,
      electrical: electricalScore,
      plumbing: plumbingScore,
      hvac: hvacScore,
      windowsExterior: windowsScore,
      poolSpa: poolScore,
      hasPool,
      color: h.color,
      propertyNum: idx + 1,
      // Store ages for reference
      roofAge,
      hvacAge,
      waterHeaterAge,
      electricalAge,
      windowsAge,
    };
  });

  const baseLabels = ['Roof', 'Foundation', 'Electrical', 'Plumbing', 'HVAC', 'Windows/Doors'];
  const labels = anyHasPool ? [...baseLabels, 'Pool/Spa'] : baseLabels;

  const data = {
    labels,
    datasets: propertyData.map((prop) => {
      const baseData = [prop.roof, prop.foundation, prop.electrical, prop.plumbing, prop.hvac, prop.windowsExterior];
      const chartData = anyHasPool ? [...baseData, prop.poolSpa] : baseData;

      return {
        label: prop.label,
        data: chartData,
        backgroundColor: `${prop.color}33`, // 20% opacity
        borderColor: prop.color,
        borderWidth: 2,
        pointBackgroundColor: prop.color,
        pointBorderColor: '#fff',
        pointRadius: 4,
      };
    }),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(255,255,255,0.1)' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        pointLabels: { color: '#FFFFFF', font: { size: 10, weight: 'bold' as const } },
        ticks: { color: '#9CA3AF', backdropColor: 'transparent', stepSize: 25 },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    plugins: {
      legend: {
        display: false, // Use custom legend instead for better address display
      },
    },
  };

  // Calculate individual scores for each property
  const propertyScores = propertyData.map((prop) => {
    const scores = [prop.roof, prop.foundation, prop.electrical, prop.plumbing, prop.hvac, prop.windowsExterior];
    if (prop.hasPool) scores.push(prop.poolSpa);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return {
      property: prop,
      averageScore,
    };
  });

  // Find the winner (highest individual score)
  const winner = propertyScores.reduce((best, current) =>
    current.averageScore > best.averageScore ? current : best
  );

  // Calculate overall average for brain widget (average of all properties)
  const avgScore = Math.round(
    propertyScores.reduce((sum, ps) => sum + ps.averageScore, 0) / propertyScores.length
  );

  console.log('\n🏆 ========================================');
  console.log('🏆 CHART 5-1 WINNER CALCULATION:');
  console.log('🏆 ========================================');
  propertyScores.forEach((ps) => {
    const isWinner = ps === winner;
    console.log(`   ${isWinner ? '🏆 WINNER' : '  '} ${ps.property.fullAddress}`);
    console.log(`      Systems Health Score: ${ps.averageScore}/100`);
  });
  console.log('🏆 ========================================\n');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      {/* Chart ID Label */}
      <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">
        Chart 5-1
      </div>

      {/* Brain Widget */}
      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart</span>
        <span className="text-sm font-bold" style={{ color: getScoreColor(avgScore) }}>
          {avgScore}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">Chart 5-1: Systems Health Radar</h3>
      <p className="text-xs text-gray-400 mb-4">
        Comparing {propertyData.length} properties across core building systems
      </p>

      <div className="h-80">
        <Radar data={data} options={options} />
      </div>

      {/* Property Legend with FULL Addresses */}
      <div className="flex flex-col gap-2 pt-3 mt-3 border-t border-white/10">
        {propertyData.map((prop) => (
          <div key={prop.id} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: prop.color, boxShadow: `0 0 6px ${prop.color}` }}
            />
            <span className="text-xs font-medium" style={{ color: prop.color }}>
              {prop.label}: {prop.fullAddress}
            </span>
          </div>
        ))}
      </div>

      {/* Winner Badge */}
      <WinnerBadge
        winnerName={winner.property.fullAddress}
        score={winner.averageScore}
        reason="Best overall systems age and condition"
      />

      {/* CLUES-Smart Scale Legend */}
      <SmartScaleLegend />

      {/* DETAILED SCORING METHODOLOGY */}
      <div className="mt-4 p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-400/30">
        <h4 className="text-xs font-bold text-purple-300 mb-3 flex items-center gap-2">
          <span className="text-lg">📐</span>
          CLUES-Smart Age-Based Scoring Methodology
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] text-gray-300">
          {/* Roof Scoring */}
          <div className="space-y-1">
            <p className="font-semibold text-cyan-300">🏗️ ROOF (age-based, varies by type):</p>
            <p className="pl-3 text-[9px]">
              <strong>Shingle:</strong> 0-5yr=Excellent, 6-10yr=Good, 11-15yr=Avg, 16-20yr=Fair, 20+yr=Poor
            </p>
            <p className="pl-3 text-[9px]">
              <strong>Flat:</strong> 0-4yr=Excellent, 5-8yr=Good, 9-12yr=Avg, 13-17yr=Fair, 17+yr=Poor
            </p>
            <p className="pl-3 text-[9px]">
              <strong>Tile/Metal/Slate:</strong> 0-10yr=Excellent, 11-20yr=Good, 21-30yr=Avg, 31-40yr=Fair, 40+yr=Poor
            </p>
          </div>

          {/* HVAC & Plumbing */}
          <div className="space-y-1">
            <p className="font-semibold text-blue-300">❄️ HVAC & 🚰 PLUMBING (age-based):</p>
            <p className="pl-3 text-[9px]">0-3yr=Excellent, 4-6yr=Good, 7-10yr=Average, 11-13yr=Fair, 13+yr=Poor</p>
          </div>

          {/* Electrical */}
          <div className="space-y-1">
            <p className="font-semibold text-yellow-300">⚡ ELECTRICAL PANEL (age-based):</p>
            <p className="pl-3 text-[9px]">0-10yr=Excellent, 11-25yr=Good, 26-40yr=Average, 41-55yr=Fair, 55+yr=Poor</p>
          </div>

          {/* Windows */}
          <div className="space-y-1">
            <p className="font-semibold text-green-300">🪟 WINDOWS/DOORS (age-based):</p>
            <p className="pl-3 text-[9px]">0-10yr=Excellent, 11-20yr=Good, 21-30yr=Average, 31-40yr=Fair, 40+yr=Poor</p>
          </div>

          {/* Foundation */}
          <div className="space-y-1">
            <p className="font-semibold text-orange-300">🏛️ FOUNDATION (type-based, age irrelevant):</p>
            <p className="pl-3 text-[9px]">
              <strong>Excellent (81-100):</strong> Slab/Monolithic (95), Basement (90)<br/>
              <strong>Good (61-80):</strong> Crawl Space (75), Pier & Beam (70)<br/>
              <strong>Average (41-60):</strong> Stem Wall (55), Continuous Footer (50)<br/>
              <strong>Fair (21-40):</strong> Pier/Post (35), Stone (30)<br/>
              <strong>Poor (0-20):</strong> Block (15)
            </p>
          </div>

          {/* Pool */}
          <div className="space-y-1">
            <p className="font-semibold text-teal-300">🏊 POOL (condition-only, age irrelevant):</p>
            <p className="pl-3 text-[9px]">Excellent=95, Very Good=85, Good=75, Average/Fair=50, Below Avg=35, Poor=15</p>
          </div>
        </div>

        <p className="text-[10px] text-purple-200 mt-3 pt-3 border-t border-purple-400/20">
          ⚡ <strong>This scoring system is applied consistently across all 21 sections</strong> whenever these components are compared.
        </p>
      </div>
    </motion.div>
  );
}

// ============================================
// CHART 5-3: EXTERIOR CONDITION (CORRECTED - TRUE SCORING & WINNER)
// ============================================
function ExteriorCondition({ homes }: { homes: Home[] }) {
  const currentYear = new Date().getFullYear();
  const comparisonProperties = homes.slice(0, 3);

  console.log('\n🔍 ========================================');
  console.log('📊 CHART 5-3: EXTERIOR CONDITION - DATABASE-CONNECTED SCORING');
  console.log('========================================\n');

  const exteriorComponents = [
    { key: 'roof', label: 'Roof' },
    { key: 'foundation', label: 'Foundation' },
    { key: 'siding', label: 'Siding' },
    { key: 'landscape', label: 'Landscape' },
    { key: 'exterior', label: 'Overall' },
  ];

  const propertyData = comparisonProperties.map((h, idx) => {
    const address = h.name || `Property ${idx + 1}`; // FULL address, no truncation
    const houseAge = h.yearBuilt ? currentYear - h.yearBuilt : null;

    // EXTRACT AGES AND TYPES FROM DATABASE
    const roofAgeRaw = extractAge(h.roofAgeEst);   // Field #40: roof_age_est (can be null)
    const roofType = h.roofType || '';              // Field #39: roof_type
    const foundationType = h.foundation || '';      // Field #42: foundation
    const sidingType = h.exteriorMaterial || '';    // Field #41: exterior_material
    const landscaping = h.landscaping || '';        // Landscaping field

    // INTELLIGENT FALLBACK: If roof age unknown, assume same as house age
    const roofAge = roofAgeRaw !== null ? roofAgeRaw : houseAge;

    // USE PROPER SCORING FUNCTIONS
    const roofScore = scoreRoofByAge(roofType, roofAge);
    const foundationScore = scoreFoundationByType(foundationType);

    // Siding quality based on material type
    const sidingQualityMap: { [key: string]: number } = {
      'Brick': 95,
      'Stone': 90,
      'Block/Stucco': 85,
      'Fiber Cement': 80,
      'Vinyl Siding': 55,
      'Wood': 50,
      'Other': 50,
    };
    let sidingScore = 50;
    const sidingLower = sidingType.toLowerCase();
    for (const [key, value] of Object.entries(sidingQualityMap)) {
      if (sidingLower.includes(key.toLowerCase())) {
        sidingScore = value;
        break;
      }
    }

    // Landscape quality (simple presence check for now)
    const landscapeScore = landscaping ? 75 : 50;

    // Overall exterior = average of roof, foundation, siding
    const exteriorScore = Math.round((roofScore + foundationScore + sidingScore) / 3);

    const scores = {
      roof: roofScore,
      foundation: foundationScore,
      siding: sidingScore,
      landscape: landscapeScore,
      exterior: exteriorScore,
    };

    // COMPOSITE SCORE = average of all 5 components
    const compositeScore = Math.round(
      Object.values(scores).reduce((sum, val) => sum + val, 0) / 5
    );

    console.log(`\n🏠 Property ${idx + 1}: ${address}`);
    console.log(`   Property Color: ${h.color}`);
    console.log(`   🏗️  HOUSE AGE: ${houseAge !== null ? houseAge + ' years old' : 'Unknown'} (Built ${h.yearBuilt || 'Unknown'})`);
    console.log('   ═════════════════════════════════════');
    console.log('   📂 DATABASE FIELDS EXTRACTED:');
    console.log(`      Field #39 (roof_type): "${roofType}"`);
    console.log(`      Field #40 (roof_age_est): "${h.roofAgeEst}" → Parsed: ${roofAgeRaw !== null ? roofAgeRaw + 'yr' : 'NULL'}`);
    console.log(`      Field #41 (exterior_material): "${sidingType}"`);
    console.log(`      Field #42 (foundation): "${foundationType}"`);
    console.log(`      Landscaping field: "${landscaping}"`);
    console.log('   ═════════════════════════════════════');
    console.log('   🧮 INTELLIGENT AGE CALCULATION:');
    console.log(`      Raw Roof Age: ${roofAgeRaw !== null ? roofAgeRaw + 'yr' : 'NULL'}`);
    console.log(`      House Age: ${houseAge !== null ? houseAge + 'yr' : 'NULL'}`);
    console.log(`      ✅ Final Roof Age Used: ${roofAge !== null ? roofAge + 'yr' : 'NULL'} ${roofAgeRaw === null && houseAge !== null ? '(FALLBACK to house age)' : '(from database)'}`);
    console.log('   ═════════════════════════════════════');
    console.log('   📊 COMPONENT SCORING:');
    console.log(`      🏗️  ROOF: ${roofScore}/100`);
    console.log(`         - Type: ${roofType || 'Unknown'}`);
    console.log(`         - Age: ${roofAge !== null ? roofAge + 'yr' : 'Unknown'}`);
    console.log(`         - Calculation: scoreRoofByAge("${roofType}", ${roofAge}) = ${roofScore}`);
    console.log(`      🏛️  FOUNDATION: ${foundationScore}/100`);
    console.log(`         - Type: ${foundationType || 'Unknown'}`);
    console.log(`         - Calculation: scoreFoundationByType("${foundationType}") = ${foundationScore}`);
    console.log(`      🧱 SIDING: ${sidingScore}/100`);
    console.log(`         - Material: ${sidingType || 'Unknown'}`);
    console.log(`         - Calculation: Material quality map = ${sidingScore}`);
    console.log(`      🌳 LANDSCAPE: ${landscapeScore}/100`);
    console.log(`         - Status: ${landscaping ? 'Present ("' + landscaping + '")' : 'Unknown'}`);
    console.log(`         - Calculation: ${landscaping ? '75 (present)' : '50 (unknown)'}`);
    console.log(`      🏠 OVERALL EXTERIOR: ${exteriorScore}/100`);
    console.log(`         - Calculation: (${roofScore} + ${foundationScore} + ${sidingScore}) ÷ 3 = ${exteriorScore}`);
    console.log('   ═════════════════════════════════════');
    console.log(`   ⭐ COMPOSITE SCORE: ${compositeScore}/100`);
    console.log(`      Formula: (Roof + Foundation + Siding + Landscape + Overall) ÷ 5`);
    console.log(`      Calculation: (${roofScore} + ${foundationScore} + ${sidingScore} + ${landscapeScore} + ${exteriorScore}) ÷ 5`);
    console.log(`      = ${roofScore + foundationScore + sidingScore + landscapeScore + exteriorScore} ÷ 5 = ${compositeScore}`);
    console.log('   ═════════════════════════════════════\n');

    return {
      id: h.id,
      label: `P${idx + 1}`,
      address,
      age: houseAge,
      scores,
      compositeScore,
      color: h.color,
      propertyNum: idx + 1,
      // Debug info
      roofAgeRaw,
      roofAgeFinal: roofAge,
      roofType,
    };
  });

  // FIND TRUE WINNER: Property with highest composite score
  const maxComposite = Math.max(...propertyData.map(p => p.compositeScore));
  const winnerIndices = propertyData
    .map((p, i) => (p.compositeScore === maxComposite ? i : -1))
    .filter(i => i !== -1);

  const winnerIndex = winnerIndices[0];
  const winner = propertyData[winnerIndex];
  const winnerScore = winner.compositeScore;

  console.log(`🏆 ========================================`);
  console.log(`🏆 TRUE WINNER CALCULATION:`);
  console.log(`🏆 ========================================`);
  propertyData.forEach((p, i) => {
    console.log(`   ${i === winnerIndex ? '🏆 WINNER' : '  '} Property ${i + 1}: ${p.address}`);
    console.log(`      Composite Score: ${p.compositeScore}/100`);
  });
  console.log(`🏆 ========================================\n`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      {/* Chart ID Label */}
      <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">
        Chart 5-3
      </div>

      {/* Brain Widget - FIXED: Shows winner's composite score */}
      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart</span>
        <span className="text-sm font-bold" style={{ color: getScoreColor(winnerScore) }}>
          {winnerScore}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">Chart 5-3: Exterior Condition</h3>
      <p className="text-xs text-gray-400 mb-4">
        Roof, Foundation, Siding, Landscape - Composite scoring across all exterior components
      </p>

      <div className="space-y-4">
        {/* Explanation */}
        <div className="px-2 py-2 bg-purple-500/10 rounded-lg border border-purple-400/20">
          <p className="text-[10px] text-purple-200">
            <strong>CLUES-Smart Scores (0-100):</strong> Each component scored by quality/condition.
            Higher scores = better condition/quality. Colors: Green (81-100 Excellent), Blue (61-80 Good),
            Yellow (41-60 Average), Orange (21-40 Fair), Red (0-20 Poor)
          </p>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-5 gap-2 text-xs text-gray-400 font-bold px-1">
          {exteriorComponents.map(c => (
            <div key={c.key} className="text-center">{c.label}</div>
          ))}
        </div>

        {/* Property rows */}
        {propertyData.map((prop, i) => (
          <motion.div
            key={prop.id}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="space-y-2"
          >
            {/* Score bars row */}
            <div className="grid grid-cols-5 gap-2 px-1">
              {exteriorComponents.map(c => {
                const score = prop.scores[c.key as keyof typeof prop.scores];
                const barColor = getConditionColor(score);
                return (
                  <div key={c.key} className="flex flex-col items-center">
                    <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: barColor }}
                      />
                    </div>
                    <span className="text-xs font-bold mt-1" style={{ color: barColor }}>{score}</span>
                  </div>
                );
              })}
            </div>

            {/* Property address and composite score */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: prop.color, boxShadow: `0 0 6px ${prop.color}` }}
                />
                <span className="text-xs font-bold" style={{ color: prop.color }}>
                  {prop.label}: {prop.address}
                </span>
                <span className="text-xs text-gray-400 font-bold flex-shrink-0">
                  {prop.age ? `(Built ${prop.age}yr ago)` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">Composite:</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${getScoreColor(prop.compositeScore)}20`,
                    color: getScoreColor(prop.compositeScore),
                    border: `1px solid ${getScoreColor(prop.compositeScore)}40`
                  }}
                >
                  {prop.compositeScore}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Property Legend with Composite Scores */}
      <div className="flex flex-col gap-2 pt-3 mt-3 border-t border-white/10">
        {propertyData.map((prop) => (
          <div key={prop.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: prop.color, boxShadow: `0 0 6px ${prop.color}` }}
              />
              <span className="text-xs font-medium" style={{ color: prop.color }}>
                {prop.label}: {prop.address}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">Composite →</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `${getScoreColor(prop.compositeScore)}20`,
                  color: getScoreColor(prop.compositeScore),
                }}
              >
                {prop.compositeScore}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Winner Badge - FIXED: Shows TRUE winner */}
      <WinnerBadge
        winnerName={winner.address}
        score={winnerScore}
        reason="Best overall exterior condition (highest composite score)"
      />

      {/* CLUES-Smart Scale Legend */}
      <SmartScaleLegend />

      {/* METHODOLOGY SECTION */}
      <div className="mt-4 p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-400/30">
        <h4 className="text-xs font-bold text-green-300 mb-3 flex items-center gap-2">
          <span className="text-lg">📐</span>
          Chart 5-3 Methodology: Exterior Condition Composite Scoring
        </h4>

        <div className="space-y-3 text-[10px] text-gray-300">
          {/* Database Connection */}
          <div>
            <p className="font-semibold text-green-300 mb-1">📂 Database Connection:</p>
            <ul className="pl-4 space-y-0.5 text-[9px]">
              <li>• <strong>Field #39 (roof_type)</strong> → Determines roof type for age-based scoring</li>
              <li>• <strong>Field #40 (roof_age_est)</strong> → Current roof age in years</li>
              <li>• <strong>Field #41 (exterior_material)</strong> → Siding material quality</li>
              <li>• <strong>Field #42 (foundation)</strong> → Foundation type for quality scoring</li>
              <li>• <strong>Landscaping field</strong> → Presence/quality of landscaping</li>
            </ul>
          </div>

          {/* Scoring Methods */}
          <div>
            <p className="font-semibold text-emerald-300 mb-1">🧮 Component Scoring:</p>
            <ul className="pl-4 space-y-0.5 text-[9px]">
              <li>• <strong>Roof:</strong> Age-based with type-specific thresholds (same as Chart 5-1)</li>
              <li>• <strong>Foundation:</strong> Quality-based by foundation type (Slab=95, Basement=90, etc.)</li>
              <li>• <strong>Siding:</strong> Material quality (Brick=95, Stone=90, Vinyl=55, etc.)</li>
              <li>• <strong>Landscape:</strong> Presence-based (75 if present, 50 if unknown)</li>
              <li>• <strong>Overall Exterior:</strong> Average of Roof + Foundation + Siding</li>
            </ul>
          </div>

          {/* Composite Calculation */}
          <div>
            <p className="font-semibold text-yellow-300 mb-1">⭐ Composite Score:</p>
            <p className="pl-4 text-[9px]">
              Average of all 5 components (Roof + Foundation + Siding + Landscape + Overall) ÷ 5
            </p>
          </div>

          {/* Winner Determination */}
          <div>
            <p className="font-semibold text-cyan-300 mb-1">🏆 Winner Determination:</p>
            <p className="pl-4 text-[9px]">
              Property with the <strong>HIGHEST composite score</strong> wins, representing the best
              overall exterior condition across all components.
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

// ============================================
// CHART 5-2: REPLACEMENT HORIZON (CORRECTED - TRUE WINNER CALCULATION)
// ============================================

/**
 * Calculate CLUES-Smart score based on years remaining
 * Returns score 0-100 based on condition
 */
function calculateReplacementScore(yearsLeft: number, maxLifespan: number): number {
  // Dynamic scale: 0 years = 0, maxLifespan = 100
  const percentage = (yearsLeft / maxLifespan) * 100;
  return Math.min(100, Math.max(0, Math.round(percentage)));
}

/**
 * Get color based on years remaining score
 */
function getReplacementColor(yearsLeft: number, maxLifespan: number): string {
  const score = calculateReplacementScore(yearsLeft, maxLifespan);
  return getScoreColor(score);
}

function ReplacementBars({ homes }: { homes: Home[] }) {
  const currentYear = new Date().getFullYear();
  const comparisonProperties = homes.slice(0, 3);

  console.log('\n🔍 ========================================');
  console.log('📊 CHART 5-2: REPLACEMENT HORIZON - DATABASE-CONNECTED CALCULATION');
  console.log('========================================\n');

  const estimates = comparisonProperties.map((h, idx) => {
    const address = h.name || `Property ${idx + 1}`; // FULL address

    // EXTRACT AGES FROM DATABASE (Fields #40, #46)
    const roofAge = extractAge(h.roofAgeEst);  // Field #40: roof_age_est
    const hvacAge = extractAge(h.hvacAge);     // Field #46: hvac_age
    const roofType = h.roofType || '';          // Field #39: roof_type

    // DETERMINE ROOF LIFESPAN BASED ON TYPE (matching Chart 5-1 logic)
    let roofLifespan = 20; // Default shingle
    const type = roofType.toLowerCase();
    if (type.includes('tile') || type.includes('metal') || type.includes('slate')) {
      roofLifespan = 40;
    } else if (type.includes('flat')) {
      roofLifespan = 17;
    } else if (type.includes('shingle') || type.includes('asphalt')) {
      roofLifespan = 20;
    }

    // HVAC LIFESPAN (standard)
    const hvacLifespan = 15;

    // CALCULATE YEARS REMAINING
    const roofYearsLeft = Math.max(0, roofLifespan - (roofAge !== null ? roofAge : 10));
    const hvacYearsLeft = Math.max(0, hvacLifespan - (hvacAge !== null ? hvacAge : 10));

    // NEXT MAJOR EXPENSE = minimum of the two
    const nextExpenseYears = Math.min(roofYearsLeft, hvacYearsLeft);

    // CALCULATE INDIVIDUAL SYSTEM SCORES (dynamic based on lifespan)
    const roofScore = calculateReplacementScore(roofYearsLeft, roofLifespan);
    const hvacScore = calculateReplacementScore(hvacYearsLeft, hvacLifespan);
    const roofColor = getReplacementColor(roofYearsLeft, roofLifespan);
    const hvacColor = getReplacementColor(hvacYearsLeft, hvacLifespan);

    // CALCULATE OVERALL CLUES-SMART SCORE (average of both systems)
    const cluesScore = Math.round((roofScore + hvacScore) / 2);

    console.log(`\n🏠 Property ${idx + 1}: ${address}`);
    console.log(`   Property Color: ${h.color}`);
    console.log('   ─────────────────────────────────────');
    console.log(`   📂 DATABASE FIELD #39 (roof_type): "${roofType}"`);
    console.log(`   📂 DATABASE FIELD #40 (roof_age_est): "${h.roofAgeEst}"`);
    console.log(`   📂 DATABASE FIELD #46 (hvac_age): "${h.hvacAge}"`);
    console.log('   ─────────────────────────────────────');
    console.log(`   🏗️  ROOF ANALYSIS:`);
    console.log(`      Type: ${roofType}`);
    console.log(`      Type-Specific Lifespan: ${roofLifespan} years`);
    console.log(`      Current Age: ${roofAge !== null ? roofAge : 'Unknown'} years`);
    console.log(`      ⏰ Years Until Replacement: ${roofYearsLeft} years`);
    console.log(`      ⭐ Roof Score: ${roofScore}/100 (${getScoreLabel(roofScore)})`);
    console.log(`      🎨 Bar Color: ${roofColor}`);
    console.log('   ─────────────────────────────────────');
    console.log(`   ❄️  HVAC ANALYSIS:`);
    console.log(`      Standard Lifespan: ${hvacLifespan} years`);
    console.log(`      Current Age: ${hvacAge !== null ? hvacAge : 'Unknown'} years`);
    console.log(`      ⏰ Years Until Replacement: ${hvacYearsLeft} years`);
    console.log(`      ⭐ HVAC Score: ${hvacScore}/100 (${getScoreLabel(hvacScore)})`);
    console.log(`      🎨 Bar Color: ${hvacColor}`);
    console.log('   ─────────────────────────────────────');
    console.log(`   💰 NEXT MAJOR EXPENSE:`);
    console.log(`      Coming in: ${nextExpenseYears} years (${nextExpenseYears === roofYearsLeft ? 'ROOF' : 'HVAC'})`);
    console.log(`      ⭐ Overall CLUES-Smart Score: ${cluesScore}/100 (Average of Roof + HVAC)`);
    console.log('   ─────────────────────────────────────\n');

    return {
      id: h.id,
      address,
      roofType,
      roofAge,
      hvacAge,
      roofLifespan,
      roofYearsLeft,
      hvacYearsLeft,
      nextExpenseYears,
      cluesScore,
      roofScore,
      hvacScore,
      roofColor,
      hvacColor,
      color: h.color, // Property color for address display
      propertyNum: idx + 1,
    };
  });

  // FIND TRUE WINNER: Property with LONGEST time until next major expense
  const maxNextExpense = Math.max(...estimates.map(e => e.nextExpenseYears));
  const winnerIndices = estimates
    .map((e, i) => (e.nextExpenseYears === maxNextExpense ? i : -1))
    .filter(i => i !== -1);

  const winnerIndex = winnerIndices[0];
  const winner = estimates[winnerIndex];
  const winnerScore = winner.cluesScore;

  console.log(`🏆 ========================================`);
  console.log(`🏆 TRUE WINNER CALCULATION:`);
  console.log(`🏆 ========================================`);
  estimates.forEach((e, i) => {
    console.log(`   ${i === winnerIndex ? '🏆 WINNER' : '  '} Property ${i + 1}: ${e.address}`);
    console.log(`      Next expense in: ${e.nextExpenseYears} years`);
    console.log(`      CLUES Score: ${e.cluesScore}/100`);
  });
  console.log(`🏆 ========================================\n`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      {/* Chart ID Label */}
      <div className="absolute -top-3 left-3 text-[10px] font-mono text-gray-500">
        Chart 5-2
      </div>

      {/* Brain Widget - FIXED: Shows winner's score */}
      <div className="absolute -top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full backdrop-blur-sm">
        <span className="text-sm">🧠</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smart</span>
        <span className="text-sm font-bold" style={{ color: getScoreColor(winnerScore) }}>
          {winnerScore}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">Chart 5-2: Replacement Horizon</h3>
      <p className="text-xs text-gray-400 mb-4">
        Years until next major expense (roof or HVAC) for {estimates.length} properties
      </p>

      <div className="space-y-4">
        {estimates.map((est, i) => (
          <motion.div
            key={est.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="space-y-2"
          >
            {/* Property Header with CLUES Score */}
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold" style={{ color: est.color }}>
                P{est.propertyNum}: {est.address}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">Next Expense:</span>
                <span className="text-xs font-bold text-white">{est.nextExpenseYears}yr</span>
                <span className="text-[10px] text-gray-400">Score:</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${getScoreColor(est.cluesScore)}20`,
                    color: getScoreColor(est.cluesScore),
                    border: `1px solid ${getScoreColor(est.cluesScore)}40`
                  }}
                >
                  {est.cluesScore}
                </span>
              </div>
            </div>

            {/* Roof Type Display */}
            <div className="text-[10px] text-gray-400">
              Roof: {est.roofType || 'Unknown'} ({est.roofLifespan}yr lifespan)
            </div>

            {/* Bars - Color reflects system condition (CLUES-Smart) */}
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Roof</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold" style={{ color: est.roofColor }}>
                      {est.roofYearsLeft}yr
                    </span>
                    <span className="text-[9px] text-gray-400">({est.roofScore})</span>
                  </div>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((est.roofYearsLeft / est.roofLifespan) * 100, 100)}%` }}
                    transition={{ duration: 0.6, delay: i * 0.15 }}
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: est.roofColor,
                      boxShadow: `0 0 8px ${est.roofColor}`,
                    }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">HVAC</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold" style={{ color: est.hvacColor }}>
                      {est.hvacYearsLeft}yr
                    </span>
                    <span className="text-[9px] text-gray-400">({est.hvacScore})</span>
                  </div>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((est.hvacYearsLeft / 15) * 100, 100)}%` }}
                    transition={{ duration: 0.6, delay: i * 0.15 }}
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: est.hvacColor,
                      boxShadow: `0 0 8px ${est.hvacColor}`,
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Property Legend with Scores */}
      <div className="flex flex-col gap-2 pt-3 mt-3 border-t border-white/10">
        {estimates.map((est, i) => (
          <div key={est.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: est.color, boxShadow: `0 0 6px ${est.color}` }}
              />
              <span className="text-xs font-medium" style={{ color: est.color }}>
                P{est.propertyNum}: {est.address}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">Next in {est.nextExpenseYears}yr →</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `${getScoreColor(est.cluesScore)}20`,
                  color: getScoreColor(est.cluesScore),
                }}
              >
                {est.cluesScore}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Winner Badge - FIXED: Shows TRUE winner */}
      <WinnerBadge
        winnerName={winner.address}
        score={winnerScore}
        reason={`Longest time (${winner.nextExpenseYears} years) until next major expense`}
      />

      {/* CLUES-Smart Scale Legend */}
      <SmartScaleLegend />

      {/* METHODOLOGY SECTION */}
      <div className="mt-4 p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border border-cyan-400/30">
        <h4 className="text-xs font-bold text-cyan-300 mb-3 flex items-center gap-2">
          <span className="text-lg">📐</span>
          Chart 5-2 Methodology: Replacement Horizon Calculation
        </h4>

        <div className="space-y-3 text-[10px] text-gray-300">
          {/* Database Connection */}
          <div>
            <p className="font-semibold text-cyan-300 mb-1">📂 Database Connection:</p>
            <ul className="pl-4 space-y-0.5 text-[9px]">
              <li>• <strong>Field #39 (roof_type)</strong> → Determines type-specific lifespan</li>
              <li>• <strong>Field #40 (roof_age_est)</strong> → Current roof age in years</li>
              <li>• <strong>Field #46 (hvac_age)</strong> → Current HVAC age in years</li>
            </ul>
          </div>

          {/* Lifespan Logic */}
          <div>
            <p className="font-semibold text-blue-300 mb-1">⏰ Type-Specific Roof Lifespans:</p>
            <ul className="pl-4 space-y-0.5 text-[9px]">
              <li>• <strong>Tile/Metal/Slate:</strong> 40 years</li>
              <li>• <strong>Shingle/Asphalt:</strong> 20 years</li>
              <li>• <strong>Flat:</strong> 17 years</li>
              <li>• <strong>HVAC (all types):</strong> 15 years</li>
            </ul>
          </div>

          {/* Calculation Logic */}
          <div>
            <p className="font-semibold text-green-300 mb-1">🧮 Calculation Logic:</p>
            <ul className="pl-4 space-y-0.5 text-[9px]">
              <li>1. Extract ages from database Fields #40 and #46</li>
              <li>2. Determine type-specific lifespan from Field #39</li>
              <li>3. Calculate: Years Remaining = Lifespan - Current Age</li>
              <li>4. Next Major Expense = MIN(Roof Years, HVAC Years)</li>
              <li>5. CLUES Score = (Next Expense Years / 15) × 100 (capped at 100)</li>
            </ul>
          </div>

          {/* Winner Determination */}
          <div>
            <p className="font-semibold text-yellow-300 mb-1">🏆 Winner Determination:</p>
            <p className="pl-4 text-[9px]">
              Property with the <strong>LONGEST time until next major expense</strong> wins.
              This is the property that gives you the most time before facing a major capital expenditure.
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

// ============================================
// MAIN WRAPPER
// ============================================
export interface Section5PerplexityChartsProps {
  homes: Home[];
}

export default function Section5PerplexityCharts({ homes }: Section5PerplexityChartsProps) {
  if (!homes || homes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No properties to compare
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Charts Grid - Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemsRadar homes={homes} />
        <ReplacementBars homes={homes} />
      </div>

      {/* Full-Width Chart */}
      <div className="w-full">
        <ExteriorCondition homes={homes} />
      </div>
    </div>
  );
}

// ============================================
// EXPORT SCORING FUNCTIONS FOR REUSE ACROSS ALL 21 SECTIONS
// ============================================

/**
 * These scoring functions implement the CLUES-Smart age-based scoring system
 * and should be used consistently across all sections (1-21) whenever
 * roof, HVAC, plumbing, electrical, windows, foundation, or pool components are compared.
 */
export {
  extractAge,
  scoreRoofByAge,
  scoreHVACByAge,
  scoreWaterHeaterByAge,
  scoreElectricalByAge,
  scoreWindowsByAge,
  scoreFoundationByType,
  conditionToScore,
};
