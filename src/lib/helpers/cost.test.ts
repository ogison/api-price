import { describe, expect, it } from 'vitest';
import type { ModelPricing } from '@/types/pricing';
import { calculateModelCost } from './cost';

const model: ModelPricing = {
  id: 'test-model',
  provider: 'openai',
  model: 'Test Model',
  inputPrice: 2, // USD / 1M input tokens
  cachedInputPrice: 0.5,
  outputPrice: 8,
  longContextInputPrice: 4,
  longContextCachedInputPrice: 1,
  longContextOutputPrice: 16,
  contextWindow: 1_000_000,
};

const baseParams = {
  inputTokens: 1_000_000,
  outputTokens: 1_000_000,
  requestCount: 1,
  cacheRate: 0,
  isLongContext: false,
};

describe('calculateModelCost', () => {
  it('computes input and output cost with no caching', () => {
    const result = calculateModelCost(model, baseParams);
    expect(result.inputCost).toBeCloseTo(2);
    expect(result.outputCost).toBeCloseTo(8);
    expect(result.totalCost).toBeCloseTo(10);
  });

  it('applies the cached price to the cached portion of input', () => {
    // 50% cache hit: 0.5M uncached @ $2 + 0.5M cached @ $0.5 = 1 + 0.25
    const result = calculateModelCost(model, { ...baseParams, cacheRate: 0.5 });
    expect(result.inputCost).toBeCloseTo(1.25);
    expect(result.outputCost).toBeCloseTo(8);
    expect(result.totalCost).toBeCloseTo(9.25);
  });

  it('scales linearly with request count', () => {
    const result = calculateModelCost(model, {
      ...baseParams,
      requestCount: 3,
    });
    expect(result.totalCost).toBeCloseTo(30);
  });

  it('uses long context prices when requested', () => {
    const result = calculateModelCost(model, {
      ...baseParams,
      isLongContext: true,
    });
    expect(result.inputCost).toBeCloseTo(4);
    expect(result.outputCost).toBeCloseTo(16);
    expect(result.totalCost).toBeCloseTo(20);
  });

  it('falls back to the standard input price for cached tokens when no cached price exists', () => {
    const noCacheModel: ModelPricing = {
      ...model,
      cachedInputPrice: undefined,
    };
    // Cached tokens billed at the standard $2, so cost is unchanged by cache rate
    const result = calculateModelCost(noCacheModel, {
      ...baseParams,
      cacheRate: 0.5,
    });
    expect(result.inputCost).toBeCloseTo(2);
  });

  it('falls back to standard prices when long context variants are missing', () => {
    const noLongContextModel: ModelPricing = {
      id: 'plain',
      provider: 'openai',
      model: 'Plain',
      inputPrice: 2,
      outputPrice: 8,
      contextWindow: 128_000,
    };
    const result = calculateModelCost(noLongContextModel, {
      ...baseParams,
      isLongContext: true,
    });
    expect(result.inputCost).toBeCloseTo(2);
    expect(result.outputCost).toBeCloseTo(8);
  });

  it('treats a missing output price as zero', () => {
    const noOutputModel: ModelPricing = {
      ...model,
      outputPrice: undefined,
      longContextOutputPrice: undefined,
    };
    const result = calculateModelCost(noOutputModel, baseParams);
    expect(result.outputCost).toBe(0);
    expect(result.totalCost).toBeCloseTo(2);
  });
});
