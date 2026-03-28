import type { DiffEntry, RawModelPricing } from './types.js';

export function generateDiff(
  existing: RawModelPricing[],
  scraped: RawModelPricing[]
): DiffEntry[] {
  const diff: DiffEntry[] = [];
  const existingMap = new Map(existing.map((m) => [m.id, m]));
  const scrapedMap = new Map(scraped.map((m) => [m.id, m]));

  // Added models
  for (const model of scraped) {
    if (!existingMap.has(model.id)) {
      diff.push({
        type: 'added',
        model: model.model,
        provider: model.provider,
        details: `Input: $${model.inputPrice}, Output: $${model.outputPrice ?? 'N/A'}`,
      });
    }
  }

  // Removed models
  for (const model of existing) {
    if (!scrapedMap.has(model.id)) {
      diff.push({
        type: 'removed',
        model: model.model,
        provider: model.provider,
      });
    }
  }

  // Changed models
  for (const model of scraped) {
    const prev = existingMap.get(model.id);
    if (!prev) continue;

    const changes: string[] = [];
    const fields = [
      'inputPrice',
      'cachedInputPrice',
      'outputPrice',
      'longContextInputPrice',
      'longContextOutputPrice',
      'contextWindow',
    ] as const;

    for (const field of fields) {
      const oldVal = prev[field];
      const newVal = model[field];
      if (oldVal !== newVal && (oldVal !== undefined || newVal !== undefined)) {
        changes.push(`${field}: $${oldVal ?? 'N/A'} → $${newVal ?? 'N/A'}`);
      }
    }

    if (changes.length > 0) {
      diff.push({
        type: 'changed',
        model: model.model,
        provider: model.provider,
        details: changes.join(', '),
      });
    }
  }

  return diff;
}

export function formatDiffReport(
  diff: DiffEntry[],
  fetchErrors: string[]
): string {
  const lines: string[] = ['## Pricing Data Update Report\n'];

  if (fetchErrors.length > 0) {
    lines.push('### ⚠ Fetch Warnings\n');
    for (const err of fetchErrors) {
      lines.push(`- ${err}`);
    }
    lines.push('');
  }

  const added = diff.filter((d) => d.type === 'added');
  const removed = diff.filter((d) => d.type === 'removed');
  const changed = diff.filter((d) => d.type === 'changed');

  if (added.length > 0) {
    lines.push(`### Added Models (${added.length})\n`);
    for (const d of added) {
      lines.push(`- **${d.model}** (${d.provider}) — ${d.details}`);
    }
    lines.push('');
  }

  if (changed.length > 0) {
    lines.push(`### Price Changes (${changed.length})\n`);
    for (const d of changed) {
      lines.push(`- **${d.model}** (${d.provider}) — ${d.details}`);
    }
    lines.push('');
  }

  if (removed.length > 0) {
    lines.push(`### Removed Models (${removed.length})\n`);
    for (const d of removed) {
      lines.push(`- **${d.model}** (${d.provider})`);
    }
    lines.push('');
  }

  if (diff.length === 0 && fetchErrors.length === 0) {
    lines.push('No changes detected.\n');
  }

  lines.push(
    `\n---\nGenerated at ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`
  );

  return lines.join('\n');
}
