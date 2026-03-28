export type Provider = 'openai' | 'google' | 'anthropic';

export interface RawModelPricing {
  id: string;
  provider: Provider;
  model: string;
  inputPrice: number;
  cachedInputPrice?: number;
  outputPrice?: number;
  longContextInputPrice?: number;
  longContextCachedInputPrice?: number;
  longContextOutputPrice?: number;
  contextWindow: number;
  releaseDate?: string;
  deprecationDate?: string;
  notes?: string;
}

export interface FetchResult {
  provider: Provider;
  models: RawModelPricing[];
  errors: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DiffEntry {
  type: 'added' | 'removed' | 'changed';
  model: string;
  provider: Provider;
  details?: string;
}

export interface ExchangeRates {
  USD: number;
  JPY: number;
  EUR: number;
  GBP: number;
  updatedAt: string;
}
