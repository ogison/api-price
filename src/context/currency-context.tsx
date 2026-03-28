'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import exchangeRatesData from '@/lib/constants/exchange-rates.json';

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
  convertPrice: (usdPer1M: number) => number;
  formatConvertedPrice: (usdPer1M: number) => string;
  currencySymbol: string;
  unitLabel: string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [tokenUnit, setTokenUnit] = useState<TokenUnit>('1M');

  const convertPrice = useCallback(
    (usdPer1M: number): number => {
      const converted = usdPer1M * EXCHANGE_RATES[currency];
      return tokenUnit === '1K' ? converted / 1000 : converted;
    },
    [currency, tokenUnit]
  );

  const formatConvertedPrice = useCallback(
    (usdPer1M: number): string => {
      const value = convertPrice(usdPer1M);
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
    [convertPrice, currency]
  );

  const value = useMemo(
    (): CurrencyContextValue => ({
      currency,
      setCurrency,
      tokenUnit,
      setTokenUnit,
      convertPrice,
      formatConvertedPrice,
      currencySymbol: CURRENCY_SYMBOLS[currency],
      unitLabel: tokenUnit === '1M' ? '1M tokens' : '1K tokens',
    }),
    [currency, tokenUnit, convertPrice, formatConvertedPrice]
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
