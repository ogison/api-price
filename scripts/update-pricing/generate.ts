import fs from 'node:fs';
import path from 'node:path';
import type { ExchangeRates, RawModelPricing } from './types.js';

const PRICING_DATA_PATH = path.resolve(
  new URL('.', import.meta.url).pathname,
  '../../src/lib/constants/pricing-data.ts'
);
const EXCHANGE_RATES_PATH = path.resolve(
  new URL('.', import.meta.url).pathname,
  '../../src/lib/constants/exchange-rates.json'
);

function formatNumber(n: number): string {
  if (n >= 1_000_000) return n.toLocaleString('en-US').replace(/,/g, '_');
  if (n >= 1_000) return n.toLocaleString('en-US').replace(/,/g, '_');
  // Avoid trailing zeros for whole numbers
  if (Number.isInteger(n)) return String(n);
  return String(n);
}

function formatContextWindow(n: number): string {
  if (n === 1_000_000) return '1_000_000';
  if (n === 200_000) return '200_000';
  if (n === 128_000) return '128_000';
  if (n === 32_768) return '32_768';
  if (n === 16_385) return '16_385';
  if (n === 16_384) return '16_384';
  if (n === 8_192) return '8_192';
  if (n === 4_096) return '4_096';
  if (n === 0) return '0';
  return formatNumber(n);
}

function modelToString(m: RawModelPricing): string {
  const lines: string[] = [];
  lines.push('  {');
  lines.push(`    id: '${m.id}',`);
  lines.push(`    provider: '${m.provider}',`);
  lines.push(`    model: '${m.model}',`);
  lines.push(`    inputPrice: ${m.inputPrice},`);
  if (m.cachedInputPrice !== undefined) {
    lines.push(`    cachedInputPrice: ${m.cachedInputPrice},`);
  }
  if (m.outputPrice !== undefined) {
    lines.push(`    outputPrice: ${m.outputPrice},`);
  }
  if (m.longContextInputPrice !== undefined) {
    lines.push(`    longContextInputPrice: ${m.longContextInputPrice},`);
  }
  if (m.longContextCachedInputPrice !== undefined) {
    lines.push(
      `    longContextCachedInputPrice: ${m.longContextCachedInputPrice},`
    );
  }
  if (m.longContextOutputPrice !== undefined) {
    lines.push(`    longContextOutputPrice: ${m.longContextOutputPrice},`);
  }
  lines.push(`    contextWindow: ${formatContextWindow(m.contextWindow)},`);
  if (m.releaseDate) {
    lines.push(`    releaseDate: '${m.releaseDate}',`);
  }
  if (m.deprecationDate) {
    lines.push(`    deprecationDate: '${m.deprecationDate}',`);
  }
  if (m.notes) {
    lines.push(`    notes: '${m.notes.replace(/'/g, "\\'")}',`);
  }
  lines.push('  },');
  return lines.join('\n');
}

export function generatePricingFile(models: RawModelPricing[]): string {
  const providerOrder = ['openai', 'anthropic', 'google'] as const;
  const providerLabels: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google (Vertex AI)',
  };

  const lines: string[] = [];
  lines.push("import type { ModelPricing } from '@/types/pricing';");
  lines.push('');
  lines.push('export const PRICING_DATA: ModelPricing[] = [');

  for (const provider of providerOrder) {
    const providerModels = models.filter((m) => m.provider === provider);
    if (providerModels.length === 0) continue;

    lines.push(`  // ${providerLabels[provider]}`);
    for (const model of providerModels) {
      lines.push(modelToString(model));
    }
    lines.push('');
  }

  lines.push('];');
  lines.push('');

  return lines.join('\n');
}

export function writePricingFile(models: RawModelPricing[]): void {
  const content = generatePricingFile(models);
  fs.writeFileSync(PRICING_DATA_PATH, content, 'utf-8');
  console.log(`  Written ${models.length} models to ${PRICING_DATA_PATH}`);
}

export function writeExchangeRates(rates: ExchangeRates): void {
  fs.writeFileSync(
    EXCHANGE_RATES_PATH,
    JSON.stringify(rates, null, 2) + '\n',
    'utf-8'
  );
  console.log(`  Written exchange rates to ${EXCHANGE_RATES_PATH}`);
}
