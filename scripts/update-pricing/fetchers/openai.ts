import * as cheerio from 'cheerio';
import type { FetchResult, RawModelPricing } from '../types.js';
import { fetchWithRetry, parsePrice, slugify } from './utils.js';

const PRICING_URL = 'https://developers.openai.com/docs/pricing';

// Known context windows (not always on the pricing page)
const KNOWN_CONTEXT: Record<string, number> = {
  'gpt-5.4': 1_000_000,
  'gpt-5.4-mini': 1_000_000,
  'gpt-5.4-nano': 1_000_000,
  'gpt-5.4-pro': 1_000_000,
  'gpt-5.2': 1_000_000,
  'gpt-5.2-pro': 1_000_000,
  'gpt-5.1': 1_000_000,
  'gpt-5': 1_000_000,
  'gpt-5-mini': 1_000_000,
  'gpt-5-nano': 1_000_000,
  'gpt-5-pro': 1_000_000,
  'gpt-4.1': 1_000_000,
  'gpt-4.1-mini': 1_000_000,
  'gpt-4.1-nano': 1_000_000,
  'gpt-4o': 128_000,
  'gpt-4o-mini': 128_000,
  o3: 200_000,
  'o3-mini': 200_000,
  'o4-mini': 200_000,
  'o3-pro': 200_000,
  o1: 200_000,
  'o1-mini': 128_000,
  'o1-pro': 200_000,
  'gpt-3.5-turbo': 16_385,
};

export async function fetchOpenAI(): Promise<FetchResult> {
  const errors: string[] = [];
  const models: RawModelPricing[] = [];
  const seenIds = new Set<string>();

  try {
    const html = await fetchWithRetry(PRICING_URL);
    const $ = cheerio.load(html);

    $('table').each((_, table) => {
      // Collect all th texts from the LAST header row (actual column names)
      const headerRows = $(table).find('thead tr');
      const lastHeaderRow =
        headerRows.length > 0 ? headerRows.last() : $(table).find('tr').first();

      const headers = lastHeaderRow
        .find('th')
        .map((__, th) => $(th).text().trim().toLowerCase())
        .get();

      const hasModel = headers.some((h) => h.includes('model'));
      const hasInput = headers.some((h) => h.includes('input'));
      const hasOutput = headers.some(
        (h) => h.includes('output') || h.includes('cost')
      );
      if (!hasModel || !hasInput || !hasOutput) return;

      // Map column positions from the actual header row
      const colMap: Record<string, number> = {};
      let inputCount = 0;
      let cachedCount = 0;
      let outputCount = 0;

      headers.forEach((h, i) => {
        if (h.includes('model') && !colMap['model']) {
          colMap['model'] = i;
        } else if (h.includes('cached') && cachedCount === 0) {
          colMap['cachedInput'] = i;
          cachedCount++;
        } else if (h.includes('cached') && cachedCount === 1) {
          colMap['longCachedInput'] = i;
          cachedCount++;
        } else if (h.includes('input') && inputCount === 0) {
          colMap['input'] = i;
          inputCount++;
        } else if (h.includes('input') && inputCount === 1) {
          colMap['longInput'] = i;
          inputCount++;
        } else if (
          (h.includes('output') || h.includes('cost')) &&
          outputCount === 0
        ) {
          colMap['output'] = i;
          outputCount++;
        } else if (
          (h.includes('output') || h.includes('cost')) &&
          outputCount === 1
        ) {
          colMap['longOutput'] = i;
          outputCount++;
        }
      });

      if (colMap['model'] === undefined || colMap['input'] === undefined)
        return;

      $(table)
        .find('tbody tr')
        .each((__, row) => {
          const cells = $(row)
            .find('td')
            .map((___, td) => $(td).text().trim())
            .get();

          const rawName = cells[colMap['model']];
          if (!rawName) return;

          // Skip sub-rows (modality rows like "Text", "Image", "Audio")
          // and rows with "with data sharing" suffix
          const nameLower = rawName.toLowerCase();
          if (
            nameLower === 'text' ||
            nameLower === 'image' ||
            nameLower === 'audio' ||
            nameLower.includes('with data sharing')
          )
            return;

          const inputPrice = parsePrice(cells[colMap['input']]);
          if (inputPrice === undefined) return;

          const id = slugify(rawName);
          if (seenIds.has(id)) return; // Skip duplicates (batch/flex tables)
          seenIds.add(id);

          const contextWindow = KNOWN_CONTEXT[id] ?? 128_000;

          const model: RawModelPricing = {
            id,
            provider: 'openai',
            model: rawName,
            inputPrice,
            contextWindow,
          };

          if (colMap['cachedInput'] !== undefined) {
            const cached = parsePrice(cells[colMap['cachedInput']]);
            if (cached !== undefined) model.cachedInputPrice = cached;
          }

          if (colMap['output'] !== undefined) {
            const output = parsePrice(cells[colMap['output']]);
            if (output !== undefined) model.outputPrice = output;
          }

          if (colMap['longInput'] !== undefined) {
            const longInput = parsePrice(cells[colMap['longInput']]);
            if (longInput !== undefined)
              model.longContextInputPrice = longInput;
          }
          if (colMap['longCachedInput'] !== undefined) {
            const longCached = parsePrice(cells[colMap['longCachedInput']]);
            if (longCached !== undefined)
              model.longContextCachedInputPrice = longCached;
          }
          if (colMap['longOutput'] !== undefined) {
            const longOutput = parsePrice(cells[colMap['longOutput']]);
            if (longOutput !== undefined)
              model.longContextOutputPrice = longOutput;
          }

          models.push(model);
        });
    });

    if (models.length === 0) {
      errors.push('No models parsed from OpenAI pricing page');
    }
  } catch (err) {
    errors.push(
      `OpenAI fetch error: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return { provider: 'openai', models, errors };
}
