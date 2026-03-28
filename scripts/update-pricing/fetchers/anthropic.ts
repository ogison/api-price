import * as cheerio from 'cheerio';
import type { FetchResult, RawModelPricing } from '../types.js';
import { fetchWithRetry, parsePrice } from './utils.js';

const PRICING_URL = 'https://platform.claude.com/docs/en/about-claude/pricing';

interface ModelInfo {
  contextWindow: number;
  releaseDate?: string;
  deprecationDate?: string;
}

// Known context windows and release dates (fallback if models page fails)
const KNOWN_MODELS: Record<string, ModelInfo> = {
  'Claude Opus 4.6': {
    contextWindow: 1_000_000,
    releaseDate: '2026-02-05',
  },
  'Claude Sonnet 4.6': {
    contextWindow: 1_000_000,
    releaseDate: '2026-02-17',
  },
  'Claude Haiku 4.5': {
    contextWindow: 200_000,
    releaseDate: '2025-10-01',
  },
  'Claude Opus 4.5': {
    contextWindow: 200_000,
    releaseDate: '2025-11-01',
  },
  'Claude Sonnet 4.5': {
    contextWindow: 1_000_000,
    releaseDate: '2025-09-29',
  },
  'Claude Opus 4.1': {
    contextWindow: 200_000,
    releaseDate: '2025-08-05',
  },
  'Claude Opus 4': { contextWindow: 200_000, releaseDate: '2025-05-14' },
  'Claude Sonnet 4': {
    contextWindow: 1_000_000,
    releaseDate: '2025-05-14',
  },
  'Claude Sonnet 3.7': {
    contextWindow: 200_000,
    releaseDate: '2025-02-24',
  },
  'Claude Haiku 3.5': {
    contextWindow: 200_000,
    releaseDate: '2024-11-04',
  },
  'Claude Opus 3': { contextWindow: 200_000, releaseDate: '2024-03-04' },
  'Claude Haiku 3': { contextWindow: 200_000, releaseDate: '2024-03-14' },
};

function modelNameToId(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\./g, '-')
    .replace(/(\d+)-(\d+)/g, '$1.$2') // restore version dots: "4-6" -> "4.6"
    .replace(/^claude-/, 'claude-');
}

export async function fetchAnthropic(): Promise<FetchResult> {
  const errors: string[] = [];
  const models: RawModelPricing[] = [];

  try {
    const html = await fetchWithRetry(PRICING_URL);
    const $ = cheerio.load(html);

    // Find the model pricing table (first table with "Base Input Tokens" header)
    const tables = $('table');
    let pricingTable: ReturnType<typeof $> | null = null;

    tables.each((_, table) => {
      const headerText = $(table).find('th').text();
      if (
        headerText.includes('Base Input') ||
        headerText.includes('Output Tokens')
      ) {
        pricingTable = $(table);
        return false;
      }
    });

    if (!pricingTable) {
      errors.push('Could not find model pricing table on Anthropic page');
      return { provider: 'anthropic', models, errors };
    }

    const rows = $(pricingTable!).find('tbody tr');
    rows.each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 6) return;

      const rawName = $(cells[0])
        .text()
        .trim()
        .replace(/\s*\(deprecated\)/, '');
      const inputPriceText = $(cells[1]).text().trim();
      const cacheHitsText = $(cells[4]).text().trim();
      const outputPriceText = $(cells[5]).text().trim();

      const inputPrice = parsePrice(inputPriceText.replace(/\/\s*MTok/, ''));
      const cachedInputPrice = parsePrice(
        cacheHitsText.replace(/\/\s*MTok/, '')
      );
      const outputPrice = parsePrice(outputPriceText.replace(/\/\s*MTok/, ''));

      if (inputPrice === undefined) return;

      const info = KNOWN_MODELS[rawName];
      const id = modelNameToId(rawName);

      const model: RawModelPricing = {
        id,
        provider: 'anthropic',
        model: rawName,
        inputPrice,
        outputPrice,
        contextWindow: info?.contextWindow ?? 200_000,
        releaseDate: info?.releaseDate,
      };

      if (cachedInputPrice !== undefined) {
        model.cachedInputPrice = cachedInputPrice;
      }

      models.push(model);
    });

    // Try to parse long context pricing table
    tables.each((_, table) => {
      const headerText = $(table).find('th').text();
      if (
        headerText.includes('200k input tokens') &&
        headerText.includes('Input')
      ) {
        const lcRows = $(table).find('tbody tr');
        lcRows.each((_, row) => {
          const cells = $(row).find('td');
          if (cells.length < 5) return;

          const rawName = $(cells[0]).text().trim();
          const longInputText = $(cells[3]).text().trim();
          const longOutputText = $(cells[4]).text().trim();

          const longInput = parsePrice(longInputText.replace(/\/\s*MTok/, ''));
          const longOutput = parsePrice(
            longOutputText.replace(/\/\s*MTok/, '')
          );

          // Find existing model and add long context pricing
          for (const m of models) {
            if (rawName.includes(m.model.replace('Claude ', ''))) {
              if (longInput !== undefined) m.longContextInputPrice = longInput;
              if (longOutput !== undefined)
                m.longContextOutputPrice = longOutput;
              // Compute long context cached price (same multiplier as standard)
              if (
                m.cachedInputPrice !== undefined &&
                longInput !== undefined &&
                m.inputPrice > 0
              ) {
                m.longContextCachedInputPrice =
                  (m.cachedInputPrice / m.inputPrice) * longInput;
              }
            }
          }
        });
      }
    });

    if (models.length === 0) {
      errors.push('No models parsed from Anthropic pricing page');
    }
  } catch (err) {
    errors.push(
      `Anthropic fetch error: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return { provider: 'anthropic', models, errors };
}
