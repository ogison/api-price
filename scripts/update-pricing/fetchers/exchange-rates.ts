import type { ExchangeRates } from '../types.js';
import { fetchWithRetry } from './utils.js';

const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  const text = await fetchWithRetry(API_URL);
  const data = JSON.parse(text);

  return {
    USD: 1,
    JPY: Math.round(data.rates.JPY * 100) / 100,
    EUR: Math.round(data.rates.EUR * 100) / 100,
    GBP: Math.round(data.rates.GBP * 100) / 100,
    updatedAt: new Date().toISOString().split('T')[0],
  };
}
