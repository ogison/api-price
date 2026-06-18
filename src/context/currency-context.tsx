'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import exchangeRatesData from '@/lib/constants/exchange-rates.json';
import { usePersistedState } from '@/hooks/use-persisted-state';

export type Currency = 'USD' | 'JPY' | 'EUR' | 'GBP';
export type TokenUnit = '1M' | '1K';

const EXCHANGE_RATES: Record<Currency, number> = {
  USD: exchangeRatesData.USD,
  JPY: exchangeRatesData.JPY,
  EUR: exchangeRatesData.EUR,
  GBP: exchangeRatesData.GBP,
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  JPY: '¥',
  EUR: '€',
  GBP: '£',
};

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  tokenUnit: TokenUnit;
  setTokenUnit: (u: TokenUnit) => void;
  /** Convert a per-1M-token USD price into the active currency and token unit. */
  convertPrice: (usdPer1M: number) => number;
  /** Format a per-1M-token USD price for display. */
  formatConvertedPrice: (usdPer1M: number) => string;
  /** Convert an absolute USD amount into the active currency (no token-unit scaling). */
  convertAmount: (usd: number) => number;
  /** Format an absolute USD amount (e.g. a simulated total cost) for display. */
  formatAmount: (usd: number) => string;
  currencySymbol: string;
  unitLabel: string;
  /** Exchange rate applied to the active currency (USD = 1). */
  exchangeRate: number;
  /** ISO date the bundled exchange rates were last updated. */
  ratesUpdatedAt: string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = usePersistedState<Currency>(
    'api-price:currency',
    'USD',
    (v) =>
      typeof v === 'string' && (CURRENCIES as string[]).includes(v)
        ? (v as Currency)
        : undefined
  );
  const [tokenUnit, setTokenUnit] = usePersistedState<TokenUnit>(
    'api-price:tokenUnit',
    '1M',
    (v) =>
      typeof v === 'string' && (TOKEN_UNITS as string[]).includes(v)
        ? (v as TokenUnit)
        : undefined
  );

  const formatCurrencyValue = useCallback(
    (value: number): string => {
      const symbol = CURRENCY_SYMBOLS[currency];

      if (currency === 'JPY') {
        if (value < 1) return `${symbol}${value.toFixed(2)}`;
        return `${symbol}${Math.round(value).toLocaleString()}`;
      }
      if (value < 0.001) return `${symbol}${value.toFixed(6)}`;
      if (value < 0.01) return `${symbol}${value.toFixed(4)}`;
      if (value < 1) return `${symbol}${value.toFixed(3)}`;
      return `${symbol}${value.toFixed(2)}`;
    },
    [currency]
  );

  const convertPrice = useCallback(
    (usdPer1M: number): number => {
      const converted = usdPer1M * EXCHANGE_RATES[currency];
      return tokenUnit === '1K' ? converted / 1000 : converted;
    },
    [currency, tokenUnit]
  );

  const formatConvertedPrice = useCallback(
    (usdPer1M: number): string => formatCurrencyValue(convertPrice(usdPer1M)),
    [convertPrice, formatCurrencyValue]
  );

  // Absolute monetary amounts (e.g. simulated total costs) only get the
  // exchange-rate conversion — the per-token unit (1M/1K) must not apply.
  const convertAmount = useCallback(
    (usd: number): number => usd * EXCHANGE_RATES[currency],
    [currency]
  );

  const formatAmount = useCallback(
    (usd: number): string => formatCurrencyValue(convertAmount(usd)),
    [convertAmount, formatCurrencyValue]
  );

  const value = useMemo(
    (): CurrencyContextValue => ({
      currency,
      setCurrency,
      tokenUnit,
      setTokenUnit,
      convertPrice,
      formatConvertedPrice,
      convertAmount,
      formatAmount,
      currencySymbol: CURRENCY_SYMBOLS[currency],
      unitLabel: tokenUnit === '1M' ? '1M tokens' : '1K tokens',
      exchangeRate: EXCHANGE_RATES[currency],
      ratesUpdatedAt: exchangeRatesData.updatedAt,
    }),
    [
      currency,
      setCurrency,
      tokenUnit,
      setTokenUnit,
      convertPrice,
      formatConvertedPrice,
      convertAmount,
      formatAmount,
    ]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return ctx;
}

export const CURRENCIES: Currency[] = ['USD', 'JPY', 'EUR', 'GBP'];
export const TOKEN_UNITS: TokenUnit[] = ['1M', '1K'];
