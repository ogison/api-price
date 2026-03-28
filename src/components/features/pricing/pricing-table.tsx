'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Card, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCurrency } from '@/context/currency-context';
import { PRICING_DATA } from '@/lib/constants/pricing-data';
import {
  formatContextWindow,
  formatReleaseDate,
  isDeprecated,
} from '@/lib/helpers/format';
import type { Provider, SortDirection, SortField } from '@/types/pricing';
import { ProviderBadge } from './provider-badge';

const SORTABLE_FIELDS: { key: SortField; label: string }[] = [
  { key: 'provider', label: 'Provider' },
  { key: 'model', label: 'Model' },
  { key: 'inputPrice', label: 'Input' },
  { key: 'cachedInputPrice', label: 'Cached Input' },
  { key: 'outputPrice', label: 'Output' },
  { key: 'contextWindow', label: 'Context' },
  { key: 'releaseDate', label: 'Release' },
  { key: 'deprecationDate', label: 'Deprecation' },
];

interface PricingTableProps {
  activeProviders: Provider[];
  searchQuery: string;
  isLongContext: boolean;
  includeDeprecated: boolean;
}

export function PricingTable({
  activeProviders,
  searchQuery,
  isLongContext,
  includeDeprecated,
}: PricingTableProps) {
  const { formatConvertedPrice, unitLabel } = useCurrency();

  const [sortField, setSortField] = useState<SortField>('inputPrice');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
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
        (query === '' || m.model.toLowerCase().includes(query)) &&
        (includeDeprecated || !isDeprecated(m.deprecationDate))
    ).sort((a, b) => {
      const fallback =
        sortField === 'outputPrice' ||
        sortField === 'releaseDate' ||
        sortField === 'deprecationDate'
          ? undefined
          : 0;
      const aVal = a[sortField] ?? fallback;
      const bVal = b[sortField] ?? fallback;
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp =
        typeof aVal === 'string' && typeof bVal === 'string'
          ? aVal.localeCompare(bVal)
          : (aVal as number) - (bVal as number);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [
    activeProviders,
    searchQuery,
    sortField,
    sortDirection,
    includeDeprecated,
  ]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {SORTABLE_FIELDS.map(({ key, label }) => (
                <TableHead
                  key={key}
                  className="cursor-pointer select-none hover:bg-muted/80"
                  onClick={() => handleSort(key)}
                >
                  <div className="flex items-center whitespace-nowrap">
                    {label}
                    <SortIcon field={key} />
                  </div>
                </TableHead>
              ))}
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-muted-foreground"
                >
                  No models found.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((model) => {
                const deprecated = isDeprecated(model.deprecationDate);
                const inputPrice = isLongContext
                  ? (model.longContextInputPrice ?? model.inputPrice)
                  : model.inputPrice;
                const cachedInputPrice = isLongContext
                  ? (model.longContextCachedInputPrice ??
                    model.cachedInputPrice)
                  : model.cachedInputPrice;
                const outputPrice = isLongContext
                  ? (model.longContextOutputPrice ?? model.outputPrice)
                  : model.outputPrice;
                return (
                  <TableRow
                    key={model.id}
                    className={`transition-colors ${deprecated ? 'opacity-40' : 'even:bg-muted/30'}`}
                  >
                    <TableCell>
                      <ProviderBadge provider={model.provider} />
                    </TableCell>
                    <TableCell className="font-medium">{model.model}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatConvertedPrice(inputPrice)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {cachedInputPrice != null
                        ? formatConvertedPrice(cachedInputPrice)
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {outputPrice != null
                        ? formatConvertedPrice(outputPrice)
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatContextWindow(model.contextWindow)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatReleaseDate(model.releaseDate)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatReleaseDate(model.deprecationDate)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {model.notes ?? '—'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <CardFooter className="border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">
          ※ 価格は {unitLabel} あたり。
          {isLongContext &&
            'Long Context モード: 長文プロンプト（>200Kトークン）適用時の料金を表示中。'}
        </p>
      </CardFooter>
    </Card>
  );
}
