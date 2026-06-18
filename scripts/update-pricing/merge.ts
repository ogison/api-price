import type { RawModelPricing, FetchResult } from './types.js';

// Build a canonical comparison key that is robust to id formatting drift.
// Scraped ids vary in how version numbers are separated (e.g. "claude-opus-4-6"
// vs "claude-opus-4.6") and existing data mixes "-" and "." conventions.
// Stripping every non-alphanumeric character collapses these variants so the
// same model is matched instead of being added as a duplicate.
export function modelKey(
  model: Pick<RawModelPricing, 'provider' | 'id'>
): string {
  return `${model.provider}:${model.id.toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
}

export function mergeResults(
  existing: RawModelPricing[],
  fetched: FetchResult[]
): RawModelPricing[] {
  // Keyed by normalized key, but insertion order preserves the existing model
  // ordering so the generated file stays stable.
  const merged = new Map<string, RawModelPricing>();

  // Start with existing data
  for (const m of existing) {
    const key = modelKey(m);
    if (!merged.has(key)) {
      merged.set(key, m);
    }
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
      const key = modelKey(model);
      const current = merged.get(key);
      if (current) {
        // Update prices but preserve the existing id, display name, and
        // metadata not available from scraping.
        merged.set(key, {
          ...current,
          inputPrice: model.inputPrice,
          cachedInputPrice: model.cachedInputPrice ?? current.cachedInputPrice,
          outputPrice: model.outputPrice ?? current.outputPrice,
          longContextInputPrice:
            model.longContextInputPrice ?? current.longContextInputPrice,
          longContextCachedInputPrice:
            model.longContextCachedInputPrice ??
            current.longContextCachedInputPrice,
          longContextOutputPrice:
            model.longContextOutputPrice ?? current.longContextOutputPrice,
          contextWindow:
            model.contextWindow > 0
              ? model.contextWindow
              : current.contextWindow,
        });
      } else {
        merged.set(key, model);
      }
    }
  }

  return Array.from(merged.values());
}
