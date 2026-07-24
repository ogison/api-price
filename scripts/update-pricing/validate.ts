import { z } from 'zod/v4';
import { modelKey } from './merge.js';
import type { RawModelPricing, ValidationResult } from './types.js';

export const ModelPricingSchema = z.object({
  id: z.string().min(1),
  provider: z.enum(['openai', 'google', 'anthropic', 'sakura']),
  model: z.string().min(1),
  inputPrice: z.number().positive(),
  cachedInputPrice: z.number().nonnegative().optional(),
  outputPrice: z.number().nonnegative().optional(),
  longContextInputPrice: z.number().positive().optional(),
  longContextCachedInputPrice: z.number().nonnegative().optional(),
  longContextOutputPrice: z.number().nonnegative().optional(),
  contextWindow: z.number().int().nonnegative().max(10_000_000),
  releaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  deprecationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  notes: z.string().optional(),
});

const MIN_MODELS_PER_PROVIDER: Record<string, number> = {
  openai: 10,
  google: 5,
  anthropic: 3,
};

export function validateModels(
  scraped: RawModelPricing[],
  existing: RawModelPricing[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Schema validation
  for (const model of scraped) {
    const result = ModelPricingSchema.safeParse(model);
    if (!result.success) {
      errors.push(`${model.id}: ${z.prettifyError(result.error)}`);
    }
  }

  // Duplicate ID check
  const ids = scraped.map((m) => m.id);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicates.length > 0) {
    errors.push(`Duplicate IDs: ${[...new Set(duplicates)].join(', ')}`);
  }

  // Normalized-key duplicate check. The merge step keys models by modelKey()
  // (provider + id with separators stripped), so ids that differ only in
  // separators or case — e.g. "gpt-5.4" vs "gpt-5-4" — collapse to one model
  // there but would silently coexist here. Flag them so the data file and the
  // merge dedup logic cannot drift apart.
  const keyToIds = new Map<string, string[]>();
  for (const model of scraped) {
    const key = modelKey(model);
    const list = keyToIds.get(key) ?? [];
    list.push(model.id);
    keyToIds.set(key, list);
  }
  for (const [key, idList] of keyToIds) {
    if (idList.length > 1) {
      errors.push(`Duplicate model key "${key}": ${idList.join(', ')}`);
    }
  }

  // Per-provider minimum model count
  const providerCounts: Record<string, number> = {};
  for (const model of scraped) {
    providerCounts[model.provider] = (providerCounts[model.provider] ?? 0) + 1;
  }
  for (const [provider, min] of Object.entries(MIN_MODELS_PER_PROVIDER)) {
    const count = providerCounts[provider] ?? 0;
    if (count < min) {
      errors.push(
        `${provider}: only ${count} models found (minimum: ${min}). Possible scraping failure.`
      );
    }
  }

  // Cross-field validation
  for (const model of scraped) {
    if (
      model.cachedInputPrice !== undefined &&
      model.cachedInputPrice >= model.inputPrice
    ) {
      warnings.push(
        `${model.id}: cachedInputPrice (${model.cachedInputPrice}) >= inputPrice (${model.inputPrice})`
      );
    }
    if (
      model.longContextInputPrice !== undefined &&
      model.longContextInputPrice < model.inputPrice
    ) {
      warnings.push(
        `${model.id}: longContextInputPrice (${model.longContextInputPrice}) < inputPrice (${model.inputPrice})`
      );
    }
  }

  // Price change anomaly detection
  const existingMap = new Map(existing.map((m) => [m.id, m]));
  for (const model of scraped) {
    const prev = existingMap.get(model.id);
    if (!prev) continue;
    const checkField = (field: 'inputPrice' | 'outputPrice') => {
      const oldVal = prev[field];
      const newVal = model[field];
      if (oldVal === undefined || newVal === undefined) return;
      if (oldVal === 0) return;
      const change = Math.abs(newVal - oldVal) / oldVal;
      if (change > 0.5) {
        warnings.push(
          `${model.id}: ${field} changed by ${(change * 100).toFixed(0)}% ($${oldVal} -> $${newVal})`
        );
      }
    };
    checkField('inputPrice');
    checkField('outputPrice');
  }

  return { valid: errors.length === 0, errors, warnings };
}
