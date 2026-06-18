import { describe, expect, it } from 'vitest';
import { PRICING_DATA } from '@/lib/constants/pricing-data';
import { modelKey } from './merge';
import { ModelPricingSchema, validateModels } from './validate';
import type { RawModelPricing } from './types';

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

describe('validateModels duplicate detection', () => {
  it('flags ids that collapse to the same normalized key', () => {
    const models = [
      model({ id: 'gpt-5.4' }),
      model({ id: 'gpt-5-4', model: 'GPT-5.4 dup' }),
    ];

    const { errors } = validateModels(models, []);

    expect(
      errors.some((e) => e.includes('Duplicate model key "openai:gpt54"'))
    ).toBe(true);
  });

  it('does not flag distinct models', () => {
    const models = [model({ id: 'gpt-5.4' }), model({ id: 'gpt-5.5' })];

    const { errors } = validateModels(models, []);

    expect(errors.some((e) => e.includes('Duplicate model key'))).toBe(false);
  });
});

describe('PRICING_DATA integrity', () => {
  it('has no duplicate normalized model keys', () => {
    const seen = new Map<string, string[]>();
    for (const m of PRICING_DATA) {
      const key = modelKey(m);
      seen.set(key, [...(seen.get(key) ?? []), m.id]);
    }
    const dups = [...seen.entries()].filter(([, ids]) => ids.length > 1);
    expect(dups).toEqual([]);
  });

  it('has unique ids', () => {
    const ids = PRICING_DATA.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('conforms to the pricing schema', () => {
    const invalid = PRICING_DATA.filter(
      (m) => !ModelPricingSchema.safeParse(m).success
    ).map((m) => m.id);
    expect(invalid).toEqual([]);
  });
});
