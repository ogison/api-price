'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PRICING_DATA } from '@/lib/constants/pricing-data';
import { formatContextWindow, formatPrice } from '@/lib/helpers/format';
import type { Provider, SortDirection, SortField } from '@/types/pricing';
import { PricingFilters } from './pricing-filters';
import { ProviderBadge } from './provider-badge';

const SORTABLE_FIELDS: { key: SortField; label: string }[] = [
  { key: 'provider', label: 'Provider' },
  { key: 'model', label: 'Model' },
  { key: 'inputPrice', label: 'Input' },
  { key: 'cachedInputPrice', label: 'Cached Input' },
  { key: 'outputPrice', label: 'Output' },
  { key: 'contextWindow', label: 'Context' },
];

export function PricingTable() {
  const [sortField, setSortField] = useState<SortField>('inputPrice');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [activeProviders, setActiveProviders] = useState<Provider[]>([
    'openai',
    'google',
    'anthropic',
  ]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return PRICING_DATA.filter(
      (m) =>
        activeProviders.includes(m.provider) &&
        (query === '' || m.model.toLowerCase().includes(query))
    ).sort((a, b) => {
      const aVal =
        sortField === 'outputPrice'
          ? (a.outputPrice ?? Number.POSITIVE_INFINITY)
          : (a[sortField] ?? 0);
      const bVal =
        sortField === 'outputPrice'
          ? (b.outputPrice ?? Number.POSITIVE_INFINITY)
          : (b[sortField] ?? 0);
      const cmp =
        typeof aVal === 'string' && typeof bVal === 'string'
          ? aVal.localeCompare(bVal)
          : (aVal as number) - (bVal as number);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [activeProviders, searchQuery, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const hasLongContext = filteredData.some(
    (m) => m.longContextInputPrice != null
  );

  return (
    <div className="space-y-4">
      <PricingFilters
        activeProviders={activeProviders}
        onProvidersChange={setActiveProviders}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {SORTABLE_FIELDS.map(({ key, label }) => (
                <TableHead
                  key={key}
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort(key)}
                >
                  <div className="flex items-center whitespace-nowrap">
                    {label}
                    <SortIcon field={key} />
                  </div>
                </TableHead>
              ))}
              {hasLongContext && (
                <>
                  <TableHead className="whitespace-nowrap">
                    Long Input
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Long Cached
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Long Output
                  </TableHead>
                </>
              )}
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={hasLongContext ? 10 : 7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No models found.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>
                    <ProviderBadge provider={model.provider} />
                  </TableCell>
                  <TableCell className="font-medium">{model.model}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPrice(model.inputPrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {model.cachedInputPrice != null
                      ? formatPrice(model.cachedInputPrice)
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {model.outputPrice != null
                      ? formatPrice(model.outputPrice)
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatContextWindow(model.contextWindow)}
                  </TableCell>
                  {hasLongContext && (
                    <>
                      <TableCell className="text-right font-mono">
                        {model.longContextInputPrice != null
                          ? formatPrice(model.longContextInputPrice)
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {model.longContextCachedInputPrice != null
                          ? formatPrice(model.longContextCachedInputPrice)
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {model.longContextOutputPrice != null
                          ? formatPrice(model.longContextOutputPrice)
                          : '—'}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="text-sm text-muted-foreground">
                    {model.notes ?? '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        ※ 価格は 1M トークンあたり（USD）。Long
        列は長文プロンプト（&gt;200Kトークン）適用時の料金。
      </p>
    </div>
  );
}
