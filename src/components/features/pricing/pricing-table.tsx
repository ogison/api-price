'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
import { CurrencySwitcher } from './currency-switcher';
import { PricingFilters } from './pricing-filters';
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

const ALL_PROVIDERS: Provider[] = ['openai', 'google', 'anthropic'];

function parseProviders(param: string | null): Provider[] {
  if (!param) return ALL_PROVIDERS;
  const values = param
    .split(',')
    .filter((v): v is Provider => ALL_PROVIDERS.includes(v as Provider));
  return values.length > 0 ? values : ALL_PROVIDERS;
}

function parseSortField(param: string | null): SortField {
  const valid: SortField[] = [
    'provider',
    'model',
    'inputPrice',
    'cachedInputPrice',
    'outputPrice',
    'contextWindow',
    'releaseDate',
    'deprecationDate',
  ];
  return valid.includes(param as SortField)
    ? (param as SortField)
    : 'inputPrice';
}

function parseSortDirection(param: string | null): SortDirection {
  return param === 'desc' ? 'desc' : 'asc';
}

export function PricingTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatConvertedPrice, unitLabel } = useCurrency();

  const [sortField, setSortField] = useState<SortField>(
    parseSortField(searchParams.get('sort'))
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    parseSortDirection(searchParams.get('dir'))
  );
  const [activeProviders, setActiveProviders] = useState<Provider[]>(
    parseProviders(searchParams.get('providers'))
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');

  const updateURL = useCallback(
    (params: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === '') {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      }
      if (newParams.get('sort') === 'inputPrice') newParams.delete('sort');
      if (newParams.get('dir') === 'asc') newParams.delete('dir');
      if (newParams.get('providers') === ALL_PROVIDERS.join(','))
        newParams.delete('providers');

      const qs = newParams.toString();
      router.replace(qs ? `?${qs}` : '/', { scroll: false });
    },
    [router, searchParams]
  );

  const handleSort = (field: SortField) => {
    let newDir: SortDirection;
    if (sortField === field) {
      newDir = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      newDir = 'asc';
    }
    setSortField(field);
    setSortDirection(newDir);
    updateURL({ sort: field, dir: newDir });
  };

  const handleProvidersChange = (providers: Provider[]) => {
    setActiveProviders(providers);
    updateURL({ providers: providers.join(',') });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    updateURL({ q: query || null });
  };

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return PRICING_DATA.filter(
      (m) =>
        activeProviders.includes(m.provider) &&
        (query === '' || m.model.toLowerCase().includes(query))
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
      {/* Toolbar */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <PricingFilters
            activeProviders={activeProviders}
            onProvidersChange={handleProvidersChange}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CurrencySwitcher />
            <span className="text-sm text-muted-foreground">
              {filteredData.length} models
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
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
                    colSpan={hasLongContext ? 12 : 9}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No models found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((model) => {
                  const deprecated = isDeprecated(model.deprecationDate);
                  return (
                    <TableRow
                      key={model.id}
                      className={`transition-colors ${deprecated ? 'opacity-40' : 'even:bg-muted/30'}`}
                    >
                      <TableCell>
                        <ProviderBadge provider={model.provider} />
                      </TableCell>
                      <TableCell className="font-medium">
                        {model.model}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatConvertedPrice(model.inputPrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {model.cachedInputPrice != null
                          ? formatConvertedPrice(model.cachedInputPrice)
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {model.outputPrice != null
                          ? formatConvertedPrice(model.outputPrice)
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
                      {hasLongContext && (
                        <>
                          <TableCell className="text-right font-mono">
                            {model.longContextInputPrice != null
                              ? formatConvertedPrice(
                                  model.longContextInputPrice
                                )
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {model.longContextCachedInputPrice != null
                              ? formatConvertedPrice(
                                  model.longContextCachedInputPrice
                                )
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {model.longContextOutputPrice != null
                              ? formatConvertedPrice(
                                  model.longContextOutputPrice
                                )
                              : '—'}
                          </TableCell>
                        </>
                      )}
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
            ※ 価格は {unitLabel} あたり。Long
            列は長文プロンプト（&gt;200Kトークン）適用時の料金。
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
