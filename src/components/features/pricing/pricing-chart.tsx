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
import { PROVIDER_CONFIG } from '@/lib/constants/providers';
import { isDeprecated } from '@/lib/helpers/format';
import { useCurrency } from '@/context/currency-context';
import type { Provider } from '@/types/pricing';

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
  const { convertPrice, formatConvertedPrice, currencySymbol, unitLabel } =
    useCurrency();
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

  const hasData = (Object.values(dataByProvider) as { name: string }[][]).some(
    (points) => points.length > 0
  );

  if (!hasData) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        条件に一致するモデルがありません。フィルターや検索条件を見直してください。
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 10, right: 30, bottom: 28, left: 18 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="input"
          name="Input"
          scale="log"
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => `${currencySymbol}${convertPrice(v)}`}
          label={{
            value: `Input 価格 (${unitLabel})`,
            position: 'insideBottom',
            offset: -18,
            style: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' },
          }}
        />
        <YAxis
          type="number"
          dataKey="output"
          name="Output"
          scale="log"
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => `${currencySymbol}${convertPrice(v)}`}
          label={{
            value: `Output 価格 (${unitLabel})`,
            angle: -90,
            position: 'insideLeft',
            style: {
              fontSize: 12,
              fill: 'hsl(var(--muted-foreground))',
              textAnchor: 'middle',
            },
          }}
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
                <p>
                  Input: {formatConvertedPrice(d.input)} / {unitLabel}
                </p>
                <p>
                  Output: {formatConvertedPrice(d.output)} / {unitLabel}
                </p>
              </div>
            );
          }}
        />
        <Legend
          verticalAlign="top"
          align="center"
          wrapperStyle={{ paddingBottom: 12 }}
        />
        {(Object.keys(dataByProvider) as Provider[]).map((provider) => (
          <Scatter
            key={provider}
            name={PROVIDER_CONFIG[provider].label}
            data={dataByProvider[provider]}
            fill={PROVIDER_CONFIG[provider].color}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
