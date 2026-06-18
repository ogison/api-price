import type { ModelPricing } from '@/types/pricing';

export interface CostParams {
  /** Input tokens per request */
  inputTokens: number;
  /** Output tokens per request */
  outputTokens: number;
  requestCount: number;
  /** Cache hit rate as a fraction in the range 0..1 */
  cacheRate: number;
  isLongContext: boolean;
}

export interface CostBreakdown {
  /** Combined uncached + cached input cost */
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

/**
 * Calculate the cost of running a model for the given workload.
 *
 * Cached input tokens are billed at the model's cached input price when one is
 * available, otherwise they fall back to the standard input price. When long
 * context pricing is requested, the long-context variants are used with a
 * fallback to the standard prices.
 */
export function calculateModelCost(
  model: ModelPricing,
  params: CostParams
): CostBreakdown {
  const { inputTokens, outputTokens, requestCount, cacheRate, isLongContext } =
    params;

  const totalInputTokens = inputTokens * requestCount;
  const totalOutputTokens = outputTokens * requestCount;
  const cachedTokens = totalInputTokens * cacheRate;
  const uncachedTokens = totalInputTokens - cachedTokens;

  const inPrice = isLongContext
    ? (model.longContextInputPrice ?? model.inputPrice)
    : model.inputPrice;
  const cachePrice = isLongContext
    ? (model.longContextCachedInputPrice ?? model.cachedInputPrice)
    : model.cachedInputPrice;
  const outPrice = isLongContext
    ? (model.longContextOutputPrice ?? model.outputPrice)
    : model.outputPrice;

  const uncachedInputCost = (uncachedTokens / 1_000_000) * inPrice;
  const cachedCost =
    cachePrice != null
      ? (cachedTokens / 1_000_000) * cachePrice
      : (cachedTokens / 1_000_000) * inPrice;
  const outputCost = (totalOutputTokens / 1_000_000) * (outPrice ?? 0);

  return {
    inputCost: uncachedInputCost + cachedCost,
    outputCost,
    totalCost: uncachedInputCost + cachedCost + outputCost,
  };
}
