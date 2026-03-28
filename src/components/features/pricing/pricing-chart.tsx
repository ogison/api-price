'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PRICING_DATA } from '@/lib/constants/pricing-data';
import { isDeprecated } from '@/lib/helpers/format';
import type { Provider } from '@/types/pricing';

const PROVIDER_COLORS: Record<Provider, string> = {
  openai: '#10b981',
  google: '#3b82f6',
  anthropic: '#f97316',
};

const PROVIDER_LABELS: Record<Provider, string> = {
  openai: 'OpenAI',
  google: 'Google',
  anthropic: 'Anthropic',
};

interface PricingChartProps {
  activeProviders: Provider[];
  searchQuery: string;
  isLongContext: boolean;
  includeDeprecated: boolean;
}

export function PricingChart({
  activeProviders,
  searchQuery,
  isLongContext,
  includeDeprecated,
}: PricingChartProps) {
  const dataByProvider = useMemo(() => {
    const result: Record<
      Provider,
      { name: string; input: number; output: number }[]
    > = {
      openai: [],
      google: [],
      anthropic: [],
    };
    const q = searchQuery.toLowerCase();
    for (const m of PRICING_DATA) {
      const inPrice = isLongContext
        ? (m.longContextInputPrice ?? m.inputPrice)
        : m.inputPrice;
      const outPrice = isLongContext
        ? (m.longContextOutputPrice ?? m.outputPrice)
        : m.outputPrice;
      if (outPrice == null || inPrice === 0) continue;
      if (!activeProviders.includes(m.provider)) continue;
      if (q !== '' && !m.model.toLowerCase().includes(q)) continue;
      if (!includeDeprecated && isDeprecated(m.deprecationDate)) continue;
      result[m.provider].push({
        name: m.model,
        input: inPrice,
        output: outPrice,
      });
    }
    return result;
  }, [activeProviders, searchQuery, isLongContext, includeDeprecated]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="input"
          name="Input"
          unit="$"
          scale="log"
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => `$${v}`}
        />
        <YAxis
          type="number"
          dataKey="output"
          name="Output"
          unit="$"
          scale="log"
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => `$${v}`}
        />
        <Tooltip
          content={({ payload }) => {
            if (!payload || payload.length === 0) return null;
            const d = payload[0].payload as {
              name: string;
              input: number;
              output: number;
            };
            return (
              <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
                <p className="font-semibold">{d.name}</p>
                <p>Input: ${d.input}/M</p>
                <p>Output: ${d.output}/M</p>
              </div>
            );
          }}
        />
        <Legend />
        {(Object.keys(dataByProvider) as Provider[]).map((provider) => (
          <Scatter
            key={provider}
            name={PROVIDER_LABELS[provider]}
            data={dataByProvider[provider]}
            fill={PROVIDER_COLORS[provider]}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
