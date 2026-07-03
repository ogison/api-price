'use client';

import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { PRICING_DATA } from '@/lib/constants/pricing-data';
import { calculateModelCost } from '@/lib/helpers/cost';
import { formatReleaseDate, isDeprecated } from '@/lib/helpers/format';
import { useCurrency } from '@/context/currency-context';
import type { Provider } from '@/types/pricing';
import { ProviderBadge } from './provider-badge';

interface CostSimulatorProps {
  activeProviders: Provider[];
  searchQuery: string;
  isLongContext: boolean;
  includeDeprecated: boolean;
}

/** Coerce parsed input to a finite number, falling back when NaN/Infinity. */
function toFinite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

export function CostSimulator({
  activeProviders,
  searchQuery,
  isLongContext,
  includeDeprecated,
}: CostSimulatorProps) {
  const { formatAmount } = useCurrency();
  const [inputTokens, setInputTokens] = useState('1000');
  const [outputTokens, setOutputTokens] = useState('1000');
  const [requestCount, setRequestCount] = useState('1');
  const [cacheRate, setCacheRate] = useState('0');

  const results = useMemo(() => {
    const inTok = Math.max(0, toFinite(parseFloat(inputTokens)));
    const outTok = Math.max(0, toFinite(parseFloat(outputTokens)));
    const reqCount = Math.max(
      1,
      Math.floor(toFinite(parseInt(requestCount, 10), 1))
    );
    const cache =
      Math.min(100, Math.max(0, toFinite(parseFloat(cacheRate)))) / 100;

    if (inTok === 0 && outTok === 0) return [];

    const q = searchQuery.toLowerCase();
    return PRICING_DATA.filter(
      (m) =>
        activeProviders.includes(m.provider) &&
        m.outputPrice != null &&
        (q === '' || m.model.toLowerCase().includes(q)) &&
        (includeDeprecated || !isDeprecated(m.deprecationDate))
    )
      .map((m) => {
        const { inputCost, outputCost, totalCost } = calculateModelCost(m, {
          inputTokens: inTok,
          outputTokens: outTok,
          requestCount: reqCount,
          cacheRate: cache,
          isLongContext,
        });

        return {
          id: m.id,
          provider: m.provider,
          model: m.model,
          totalCost,
          inputCost,
          outputCost,
          releaseDate: m.releaseDate,
          deprecationDate: m.deprecationDate,
        };
      })
      .sort((a, b) => a.totalCost - b.totalCost);
  }, [
    inputTokens,
    outputTokens,
    requestCount,
    cacheRate,
    activeProviders,
    searchQuery,
    isLongContext,
    includeDeprecated,
  ]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label
            htmlFor="sim-input-tokens"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Input tokens / request
          </label>
          <Input
            id="sim-input-tokens"
            type="number"
            placeholder="e.g. 1000"
            value={inputTokens}
            onChange={(e) => setInputTokens(e.target.value)}
            min="0"
          />
        </div>
        <div>
          <label
            htmlFor="sim-output-tokens"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Output tokens / request
          </label>
          <Input
            id="sim-output-tokens"
            type="number"
            placeholder="e.g. 500"
            value={outputTokens}
            onChange={(e) => setOutputTokens(e.target.value)}
            min="0"
          />
        </div>
        <div>
          <label
            htmlFor="sim-request-count"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Request count
          </label>
          <Input
            id="sim-request-count"
            type="number"
            placeholder="1"
            value={requestCount}
            onChange={(e) => setRequestCount(e.target.value)}
            min="1"
          />
        </div>
        <div>
          <label
            htmlFor="sim-cache-rate"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Cache hit rate (%)
          </label>
          <Input
            id="sim-cache-rate"
            type="number"
            placeholder="0"
            value={cacheRate}
            onChange={(e) => setCacheRate(e.target.value)}
            min="0"
            max="100"
          />
        </div>
      </div>

      {results.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Rank</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Input Cost</TableHead>
                <TableHead className="text-right">Output Cost</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead>Release</TableHead>
                <TableHead>Deprecation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.slice(0, 100).map((r, i) => (
                <TableRow
                  key={r.id}
                  className="even:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-mono text-muted-foreground">
                    {i + 1}
                  </TableCell>
                  <TableCell>
                    <ProviderBadge provider={r.provider} />
                  </TableCell>
                  <TableCell className="font-medium">{r.model}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatAmount(r.inputCost)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatAmount(r.outputCost)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatAmount(r.totalCost)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatReleaseDate(r.releaseDate)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatReleaseDate(r.deprecationDate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {results.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          トークン数を入力するとコスト比較が表示されます。
        </p>
      )}
    </div>
  );
}
