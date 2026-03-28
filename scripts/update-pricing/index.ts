import { fetchAnthropic } from './fetchers/anthropic.js';
import { fetchExchangeRates } from './fetchers/exchange-rates.js';
import { fetchGoogle } from './fetchers/google.js';
import { fetchOpenAI } from './fetchers/openai.js';
import { validateModels } from './validate.js';
import { generateDiff, formatDiffReport } from './diff-report.js';
import { writePricingFile, writeExchangeRates } from './generate.js';
import type { RawModelPricing, FetchResult } from './types.js';
// tsx can directly import TypeScript source files
import { PRICING_DATA } from '../../src/lib/constants/pricing-data.js';

function loadExistingData(): RawModelPricing[] {
  return PRICING_DATA as RawModelPricing[];
}

function mergeResults(
  existing: RawModelPricing[],
  fetched: FetchResult[]
): RawModelPricing[] {
  const merged = new Map<string, RawModelPricing>();

  // Start with existing data
  for (const m of existing) {
    merged.set(m.id, m);
  }

  // Update/add from fetched data
  for (const result of fetched) {
    if (result.errors.length > 0 && result.models.length === 0) {
      // Provider fetch failed entirely — keep existing data for this provider
      console.warn(
        `  Keeping existing data for ${result.provider} (fetch failed)`
      );
      continue;
    }

    for (const model of result.models) {
      const existing = merged.get(model.id);
      if (existing) {
        // Update prices but preserve metadata not available from scraping
        merged.set(model.id, {
          ...existing,
          inputPrice: model.inputPrice,
          cachedInputPrice: model.cachedInputPrice ?? existing.cachedInputPrice,
          outputPrice: model.outputPrice ?? existing.outputPrice,
          longContextInputPrice:
            model.longContextInputPrice ?? existing.longContextInputPrice,
          longContextCachedInputPrice:
            model.longContextCachedInputPrice ??
            existing.longContextCachedInputPrice,
          longContextOutputPrice:
            model.longContextOutputPrice ?? existing.longContextOutputPrice,
          contextWindow:
            model.contextWindow > 0
              ? model.contextWindow
              : existing.contextWindow,
        });
      } else {
        merged.set(model.id, model);
      }
    }
  }

  return Array.from(merged.values());
}

async function main() {
  console.log('=== Pricing Data Update ===\n');

  // Step 1: Load existing data
  console.log('Loading existing data...');
  const existing = loadExistingData();
  console.log(`  Found ${existing.length} existing models\n`);

  // Step 2: Fetch from all providers in parallel
  console.log('Fetching pricing data...');
  const [openaiResult, anthropicResult, googleResult] = await Promise.all([
    fetchOpenAI().then((r) => {
      console.log(
        `  OpenAI: ${r.models.length} models, ${r.errors.length} errors`
      );
      return r;
    }),
    fetchAnthropic().then((r) => {
      console.log(
        `  Anthropic: ${r.models.length} models, ${r.errors.length} errors`
      );
      return r;
    }),
    fetchGoogle().then((r) => {
      console.log(
        `  Google: ${r.models.length} models, ${r.errors.length} errors`
      );
      return r;
    }),
  ]);

  const allResults = [openaiResult, anthropicResult, googleResult];
  const allErrors = allResults.flatMap((r) => r.errors);

  // Step 3: Fetch exchange rates
  console.log('\nFetching exchange rates...');
  let exchangeRates = null;
  try {
    exchangeRates = await fetchExchangeRates();
    console.log(
      `  USD/JPY: ${exchangeRates.JPY}, USD/EUR: ${exchangeRates.EUR}, USD/GBP: ${exchangeRates.GBP}`
    );
  } catch (err) {
    const msg = `Exchange rates fetch error: ${err instanceof Error ? err.message : String(err)}`;
    allErrors.push(msg);
    console.warn(`  ${msg}`);
  }

  // Step 4: Merge with existing data
  console.log('\nMerging data...');
  const merged = mergeResults(existing, allResults);
  console.log(`  Total: ${merged.length} models`);

  // Step 5: Validate
  console.log('\nValidating...');
  const validation = validateModels(merged, existing);

  if (validation.warnings.length > 0) {
    console.warn('  Warnings:');
    for (const w of validation.warnings) {
      console.warn(`    - ${w}`);
    }
  }

  if (!validation.valid) {
    console.error('\n  Validation FAILED:');
    for (const e of validation.errors) {
      console.error(`    - ${e}`);
    }
    process.exit(1);
  }
  console.log('  Validation passed');

  // Step 6: Generate diff report
  console.log('\nGenerating diff...');
  const diff = generateDiff(existing, merged);
  const report = formatDiffReport(diff, allErrors);
  console.log(report);

  if (diff.length === 0 && !exchangeRates) {
    console.log('\nNo changes detected. Exiting.');
    process.exit(0);
  }

  // Step 7: Write files
  console.log('\nWriting files...');
  writePricingFile(merged);

  if (exchangeRates) {
    writeExchangeRates(exchangeRates);
  }

  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
