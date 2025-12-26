/**
 * CLI Script: Research SMART Score Weights
 *
 * Usage:
 *   npx ts-node scripts/research-weights.ts --region=FL-Coastal
 *   npx ts-node scripts/research-weights.ts --region=FL-Inland
 *
 * Environment variables required:
 *   VITE_ANTHROPIC_API_KEY
 *   VITE_PERPLEXITY_API_KEY
 */

import { researchSectionWeights, RESEARCH_QUESTIONS } from '../src/lib/smart-score-weight-research';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);
  const regionArg = args.find(arg => arg.startsWith('--region='));
  const region = regionArg ? regionArg.split('=')[1] : 'FL-Coastal';

  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   CLUES SMART Score - Weight Research Automation             ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log(`📍 Region: ${region}`);
  console.log(`📊 Research Questions: ${RESEARCH_QUESTIONS.length}`);
  console.log(`🤖 LLMs: Claude Opus 4.5 + Perplexity Sonar Pro\n`);

  // Check API keys
  if (!process.env.VITE_ANTHROPIC_API_KEY) {
    console.error('❌ ERROR: VITE_ANTHROPIC_API_KEY environment variable not set');
    process.exit(1);
  }

  if (!process.env.VITE_PERPLEXITY_API_KEY) {
    console.error('❌ ERROR: VITE_PERPLEXITY_API_KEY environment variable not set');
    process.exit(1);
  }

  console.log('✅ API keys configured\n');
  console.log('Starting research... (this will take ~5-10 minutes)\n');

  const startTime = Date.now();

  // Run research with progress updates
  const result = await researchSectionWeights(
    region,
    RESEARCH_QUESTIONS,
    (current, total, question) => {
      const percent = Math.round((current / total) * 100);
      const bar = '█'.repeat(Math.floor(percent / 2)) + '░'.repeat(50 - Math.floor(percent / 2));
      process.stdout.write(`\r[${bar}] ${percent}% (${current}/${total})`);
    }
  );

  console.log('\n');

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Display results
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   RESEARCH COMPLETE                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log(`⏱️  Duration: ${duration} seconds`);
  console.log(`✅ Successful: ${result.successfulValidations}/${result.totalQuestions} (${result.consensusRate}%)`);
  console.log(`📊 High Confidence: ${result.summary.highConfidence}`);
  console.log(`⚠️  Medium Confidence: ${result.summary.mediumConfidence}`);
  console.log(`❌ Rejected: ${result.summary.rejected}\n`);

  // Display weights
  console.log('📈 SECTION WEIGHTS (normalized to 100%):\n');

  const sortedWeights = Object.entries(result.weights)
    .sort((a, b) => b[1] - a[1]);

  sortedWeights.forEach(([section, weight]) => {
    const question = RESEARCH_QUESTIONS.find(q => q.section === section);
    const name = question?.sectionName || section;
    const bar = '▓'.repeat(Math.floor(weight / 2));
    console.log(`  ${section.padEnd(2)} ${name.padEnd(30)} ${weight.toFixed(1).padStart(5)}% ${bar}`);
  });

  console.log(`\n  ${'TOTAL'.padEnd(33)} ${Object.values(result.weights).reduce((sum, w) => sum + w, 0).toFixed(1)}%\n`);

  // Display citations
  console.log(`📚 Citations: ${result.citations.length} sources\n`);
  result.citations.slice(0, 5).forEach((url, i) => {
    console.log(`  ${i + 1}. ${url}`);
  });
  if (result.citations.length > 5) {
    console.log(`  ... and ${result.citations.length - 5} more\n`);
  }

  // Save results to file
  const outputDir = path.join(process.cwd(), 'research-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `${region.replace(/\s+/g, '-')}_WEIGHTS_${new Date().toISOString().split('T')[0]}.json`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(result, null, 2));

  console.log(`\n💾 Results saved to: ${filepath}`);

  // Save weights-only file for easy import
  const weightsFilename = `${region.replace(/\s+/g, '-')}_WEIGHTS.json`;
  const weightsFilepath = path.join(outputDir, weightsFilename);

  fs.writeFileSync(weightsFilepath, JSON.stringify({
    region,
    generatedAt: result.generatedAt,
    consensusRate: result.consensusRate,
    weights: result.weights
  }, null, 2));

  console.log(`💾 Weights-only file: ${weightsFilepath}\n`);

  // Display rejected questions for manual review
  if (result.summary.rejected > 0) {
    console.log('⚠️  MANUAL REVIEW REQUIRED:\n');

    result.validations
      .filter(v => v.consensus.confidence === 'rejected')
      .forEach((v, i) => {
        const question = RESEARCH_QUESTIONS.find(q => q.question === v.question);
        console.log(`  ${i + 1}. ${question?.sectionName || 'Unknown'}`);
        console.log(`     ${v.consensus.reason}`);
        console.log(`     Claude: ${v.claudeResponse.weight}%, Perplexity: ${v.perplexityResponse.weight}%\n`);
      });
  }

  console.log('✅ Research complete! Next steps:');
  console.log('   1. Review weights in the generated JSON file');
  console.log('   2. Run validation: npx ts-node scripts/validate-weights.ts');
  console.log('   3. Apply to production: npm run migrate:smart-score\n');

  process.exit(0);
}

main().catch(error => {
  console.error('\n❌ ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
});
