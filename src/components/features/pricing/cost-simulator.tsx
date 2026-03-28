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
import { formatReleaseDate, isDeprecated } from '@/lib/helpers/format';
import type { Provider } from '@/types/pricing';
import { ProviderBadge } from './provider-badge';

function formatCost(cost: number): string {
  if (cost < 0.001) return `$${cost.toFixed(6)}`;
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

interface CostSimulatorProps {
  activeProviders: Provider[];
  searchQuery: string;
  isLongContext: boolean;
  includeDeprecated: boolean;
}

export function CostSimulator({
  activeProviders,
  searchQuery,
  isLongContext,
  includeDeprecated,
}: CostSimulatorProps) {
  const [inputTokens, setInputTokens] = useState('');
  const [outputTokens, setOutputTokens] = useState('');
  const [requestCount, setRequestCount] = useState('1');
  const [cacheRate, setCacheRate] = useState('0');

  const results = useMemo(() => {
    const inTok = parseFloat(inputTokens) || 0;
    const outTok = parseFloat(outputTokens) || 0;
    const reqCount = parseInt(requestCount) || 1;
    const cache = Math.min(100, Math.max(0, parseFloat(cacheRate) || 0)) / 100;

    if (inTok === 0 && outTok === 0) return [];

    const totalInputTokens = inTok * reqCount;
    const totalOutputTokens = outTok * reqCount;
    const cachedTokens = totalInputTokens * cache;
    const uncachedTokens = totalInputTokens - cachedTokens;

    const q = searchQuery.toLowerCase();
    return PRICING_DATA.filter(
      (m) =>
        activeProviders.includes(m.provider) &&
        m.outputPrice != null &&
        (q === '' || m.model.toLowerCase().includes(q)) &&
        (includeDeprecated || !isDeprecated(m.deprecationDate))
    )
      .map((m) => {
        const inPrice = isLongContext
          ? (m.longContextInputPrice ?? m.inputPrice)
          : m.inputPrice;
        const cachePrice = isLongContext
          ? (m.longContextCachedInputPrice ?? m.cachedInputPrice)
          : m.cachedInputPrice;
        const outPrice = isLongContext
          ? (m.longContextOutputPrice ?? m.outputPrice)
          : m.outputPrice;
        const inputCost = (uncachedTokens / 1_000_000) * inPrice;
        const cachedCost =
          cachePrice != null
            ? (cachedTokens / 1_000_000) * cachePrice
            : (cachedTokens / 1_000_000) * inPrice;
        const outputCost = (totalOutputTokens / 1_000_000) * (outPrice ?? 0);
        const totalCost = inputCost + cachedCost + outputCost;

        return {
          id: m.id,
          provider: m.provider,
          model: m.model,
          totalCost,
          inputCost: inputCost + cachedCost,
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
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Input tokens / request
          </label>
          <Input
            type="number"
            placeholder="e.g. 1000"
            value={inputTokens}
            onChange={(e) => setInputTokens(e.target.value)}
            min="0"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Output tokens / request
          </label>
          <Input
            type="number"
            placeholder="e.g. 500"
            value={outputTokens}
            onChange={(e) => setOutputTokens(e.target.value)}
            min="0"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Request count
          </label>
          <Input
            type="number"
            placeholder="1"
            value={requestCount}
            onChange={(e) => setRequestCount(e.target.value)}
            min="1"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Cache hit rate (%)
          </label>
          <Input
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
                    {formatCost(r.inputCost)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCost(r.outputCost)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatCost(r.totalCost)}
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
