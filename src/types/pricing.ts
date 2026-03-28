export type Provider = 'openai' | 'google' | 'anthropic';

export interface ModelPricing {
  id: string;
  provider: Provider;
  model: string;
  inputPrice: number; // USD per 1M input tokens
  cachedInputPrice?: number; // USD per 1M cached input tokens
  /** USD per 1M output tokens（公式表で「—」の場合は省略可） */
  outputPrice?: number;
  longContextInputPrice?: number; // USD per 1M input tokens (long context)
  longContextCachedInputPrice?: number; // USD per 1M cached input tokens (long context)
  longContextOutputPrice?: number; // USD per 1M output tokens (long context)
  contextWindow: number; // max context in tokens
  releaseDate?: string; // YYYY-MM-DD format
  deprecationDate?: string; // YYYY-MM-DD format
  notes?: string;
}

export type SortField =
  | 'provider'
  | 'model'
  | 'inputPrice'
  | 'cachedInputPrice'
  | 'outputPrice'
  | 'contextWindow'
  | 'releaseDate'
  | 'deprecationDate';

export type SortDirection = 'asc' | 'desc';
