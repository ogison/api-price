import * as cheerio from 'cheerio';
import type { FetchResult, RawModelPricing } from '../types.js';
import { fetchWithRetry, parsePrice, slugify } from './utils.js';

// Use ?hl=en to ensure English page
const PRICING_URL =
  'https://cloud.google.com/vertex-ai/generative-ai/pricing?hl=en';

function getPrecedingHeading(
  $: cheerio.CheerioAPI,
  table: Parameters<typeof $>[0]
): string {
  let el = $(table).prev();
  for (let i = 0; i < 5 && el.length; i++) {
    const tag = el.prop('tagName');
    if (tag && /^H[1-6]$/.test(tag)) return el.text().trim().toLowerCase();
    el = el.prev();
  }
  return '';
}

export async function fetchGoogle(): Promise<FetchResult> {
  const errors: string[] = [];
  const models: RawModelPricing[] = [];
  const seenIds = new Set<string>();

  try {
    const html = await fetchWithRetry(PRICING_URL);
    const $ = cheerio.load(html);

    $('table').each((_, table) => {
      const heading = getPrecedingHeading($, table);

      // Only process "Standard" or "Token-based pricing" tables
      if (heading !== 'standard' && heading !== 'token-based pricing') return;

      const headers = $(table)
        .find('th')
        .map((__, th) => $(th).text().trim().toLowerCase())
        .get();

      const hasModel = headers.some((h) => h.includes('model'));
      const hasType = headers.some((h) => h.includes('type'));
      if (!hasModel || !hasType) return;

      const hasCached = headers.some((h) => h.includes('cached'));
      // Token-based tables have "Price | Price with Batch API" — no long context columns
      const isTokenBased = heading === 'token-based pricing';

      let currentModelName = '';

      $(table)
        .find('tbody tr')
        .each((__, row) => {
          const cells = $(row)
            .find('td')
            .map((___, td) => $(td).text().trim())
            .get();

          // Single-cell row = model name header
          if (cells.length === 1) {
            currentModelName = cells[0];
            return;
          }

          if (!currentModelName || cells.length < 2) return;

          const type = cells[0].toLowerCase();

          // Skip audio, video, image, tuning, grounding rows
          if (
            type.includes('audio') ||
            type.includes('video') ||
            type.includes('image output') ||
            type.includes('image input') ||
            type.includes('output image') ||
            type.includes('tuning') ||
            type.includes('grounding') ||
            type.includes('web ')
          )
            return;

          // Detect input/output from both table formats:
          // Standard: "Input (text, image, video, audio)" / "Text output (response and reasoning)"
          // Token-based: "1M Input tokens" / "1M Output text tokens"
          const isInput = type.includes('input');
          const isOutput = type.includes('output') && !type.includes('input');

          if (!isInput && !isOutput) return;

          const id = `gemini-${slugify(currentModelName.replace(/^Gemini\s*/i, ''))}`;

          // Skip if this model was already created from a previous table
          if (seenIds.has(id)) return;

          // Find or create model entry within this table
          let model = models.find((m) => m.id === id);
          if (!model) {
            model = {
              id,
              provider: 'google',
              model: currentModelName,
              inputPrice: 0,
              contextWindow: 1_000_000,
            };
            models.push(model);
          }

          if (isInput) {
            const shortPrice = parsePrice(cells[1]);
            if (shortPrice !== undefined) {
              model.inputPrice = shortPrice;
            }

            // Long context / cached columns only exist in Standard tables
            if (!isTokenBased) {
              if (cells.length >= 3) {
                const longPrice = parsePrice(cells[2]);
                if (
                  longPrice !== undefined &&
                  shortPrice !== undefined &&
                  longPrice !== shortPrice
                ) {
                  model.longContextInputPrice = longPrice;
                }
              }

              if (hasCached && cells.length >= 4) {
                const cachedShort = parsePrice(cells[3]);
                if (cachedShort !== undefined) {
                  model.cachedInputPrice = cachedShort;
                }
                if (cells.length >= 5) {
                  const cachedLong = parsePrice(cells[4]);
                  if (
                    cachedLong !== undefined &&
                    cachedShort !== undefined &&
                    cachedLong !== cachedShort
                  ) {
                    model.longContextCachedInputPrice = cachedLong;
                  }
                }
              }
            }
          }

          if (isOutput) {
            const shortPrice = parsePrice(cells[1]);
            if (shortPrice !== undefined) {
              model.outputPrice = shortPrice;
            }

            if (!isTokenBased && cells.length >= 3) {
              const longPrice = parsePrice(cells[2]);
              if (
                longPrice !== undefined &&
                shortPrice !== undefined &&
                longPrice !== shortPrice
              ) {
                model.longContextOutputPrice = longPrice;
              }
            }
          }
        });

      // Mark all models from this table as seen (prevents later tables from overwriting)
      for (const m of models) {
        seenIds.add(m.id);
      }
    });

    // Remove models with no input price (parsing failed)
    const validModels = models.filter((m) => m.inputPrice > 0);
    models.length = 0;
    models.push(...validModels);

    if (models.length === 0) {
      errors.push('No models parsed from Google pricing page');
    }
  } catch (err) {
    errors.push(
      `Google fetch error: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return { provider: 'google', models, errors };
}
