import { describe, expect, it, vi } from 'vitest';
import { mergeResults, modelKey } from './merge';
import type { RawModelPricing, FetchResult } from './types';

function model(overrides: Partial<RawModelPricing> = {}): RawModelPricing {
  return {
    id: 'gpt-test',
    provider: 'openai',
    model: 'GPT Test',
    inputPrice: 1,
    outputPrice: 2,
    contextWindow: 128_000,
    ...overrides,
  };
}

function result(models: RawModelPricing[], errors: string[] = []): FetchResult {
  return { provider: 'openai', models, errors };
}

describe('modelKey', () => {
  it('normalizes separators so version drift collapses to one key', () => {
    expect(modelKey({ provider: 'openai', id: 'gpt-5.4' })).toBe(
      modelKey({ provider: 'openai', id: 'gpt-5-4' })
    );
  });

  it('is case insensitive', () => {
    expect(modelKey({ provider: 'anthropic', id: 'Claude-Opus-4-6' })).toBe(
      'anthropic:claudeopus46'
    );
  });

  it('keys differ across providers', () => {
    expect(modelKey({ provider: 'openai', id: 'x' })).not.toBe(
      modelKey({ provider: 'google', id: 'x' })
    );
  });
});

describe('mergeResults', () => {
  it('updates prices on an existing model while preserving metadata', () => {
    const existing = [
      model({
        id: 'gpt-5.4',
        model: 'GPT-5.4',
        inputPrice: 2.5,
        releaseDate: '2026-03-05',
      }),
    ];
    const fetched = [result([model({ id: 'gpt-5-4', inputPrice: 3 })])];

    const merged = mergeResults(existing, fetched);

    expect(merged).toHaveLength(1);
    expect(merged[0].inputPrice).toBe(3); // price updated
    expect(merged[0].id).toBe('gpt-5.4'); // existing id preserved
    expect(merged[0].model).toBe('GPT-5.4'); // display name preserved
    expect(merged[0].releaseDate).toBe('2026-03-05'); // metadata preserved
  });

  it('adds models that do not exist yet', () => {
    const existing = [model({ id: 'gpt-a' })];
    const fetched = [result([model({ id: 'gpt-b' })])];

    const merged = mergeResults(existing, fetched);

    expect(merged.map((m) => m.id)).toEqual(['gpt-a', 'gpt-b']);
  });

  it('keeps existing data when a provider fetch fails entirely', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const existing = [model({ id: 'gpt-a', inputPrice: 1 })];
    const fetched = [result([], ['network error'])];

    const merged = mergeResults(existing, fetched);

    expect(merged).toHaveLength(1);
    expect(merged[0].inputPrice).toBe(1);
    warn.mockRestore();
  });

  it('does not overwrite a known context window with zero', () => {
    const existing = [model({ id: 'gpt-a', contextWindow: 200_000 })];
    const fetched = [result([model({ id: 'gpt-a', contextWindow: 0 })])];

    const merged = mergeResults(existing, fetched);

    expect(merged[0].contextWindow).toBe(200_000);
  });

  it('preserves existing optional prices when the fetch omits them', () => {
    const existing = [model({ id: 'gpt-a', cachedInputPrice: 0.5 })];
    const fetched = [
      result([model({ id: 'gpt-a', cachedInputPrice: undefined })]),
    ];

    const merged = mergeResults(existing, fetched);

    expect(merged[0].cachedInputPrice).toBe(0.5);
  });
});
