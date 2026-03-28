'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PRICING_DATA } from '@/lib/constants/pricing-data';
import {
  formatContextWindow,
  formatPrice,
  formatReleaseDate,
  isDeprecated,
} from '@/lib/helpers/format';
import type { ModelPricing, Provider } from '@/types/pricing';
import { ProviderBadge } from './provider-badge';

const MAX_COMPARE = 4;

interface ModelComparisonProps {
  activeProviders: Provider[];
  searchQuery: string;
  includeDeprecated: boolean;
}

export function ModelComparison({
  activeProviders,
  searchQuery,
  includeDeprecated,
}: ModelComparisonProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const filteredModels = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return PRICING_DATA.filter(
      (m) =>
        activeProviders.includes(m.provider) &&
        (q === '' || m.model.toLowerCase().includes(q)) &&
        (includeDeprecated || !isDeprecated(m.deprecationDate))
    );
  }, [activeProviders, searchQuery, includeDeprecated]);

  const suggestions = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return filteredModels
      .filter(
        (m) => m.model.toLowerCase().includes(q) && !selectedIds.includes(m.id)
      )
      .slice(0, 8);
  }, [search, selectedIds, filteredModels]);

  const selectedModels = useMemo(
    () =>
      selectedIds
        .map((id) => PRICING_DATA.find((m) => m.id === id))
        .filter((m): m is ModelPricing => m != null),
    [selectedIds]
  );

  const addModel = (id: string) => {
    if (selectedIds.length < MAX_COMPARE && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
    setSearch('');
  };

  const removeModel = (id: string) => {
    setSelectedIds(selectedIds.filter((s) => s !== id));
  };

  const rows: {
    label: string;
    render: (m: ModelPricing) => string;
  }[] = [
    { label: 'Input Price', render: (m) => formatPrice(m.inputPrice) },
    {
      label: 'Cached Input',
      render: (m) =>
        m.cachedInputPrice != null ? formatPrice(m.cachedInputPrice) : '—',
    },
    {
      label: 'Output Price',
      render: (m) => (m.outputPrice != null ? formatPrice(m.outputPrice) : '—'),
    },
    {
      label: 'Context Window',
      render: (m) => formatContextWindow(m.contextWindow),
    },
    {
      label: 'Release Date',
      render: (m) => formatReleaseDate(m.releaseDate),
    },
    {
      label: 'Long Context Input',
      render: (m) =>
        m.longContextInputPrice != null
          ? formatPrice(m.longContextInputPrice)
          : '—',
    },
    {
      label: 'Long Context Output',
      render: (m) =>
        m.longContextOutputPrice != null
          ? formatPrice(m.longContextOutputPrice)
          : '—',
    },
  ];

  const getBestIndex = (
    getter: (m: ModelPricing) => number | undefined
  ): number => {
    let bestIdx = -1;
    let bestVal = Infinity;
    for (let i = 0; i < selectedModels.length; i++) {
      const v = getter(selectedModels[i]);
      if (v != null && v < bestVal) {
        bestVal = v;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

  const bestInputIdx = getBestIndex((m) => m.inputPrice);
  const bestOutputIdx = getBestIndex((m) => m.outputPrice);

  return (
    <div className="space-y-4">
      {/* Model selector */}
      <div className="relative">
        <Input
          placeholder={
            selectedIds.length >= MAX_COMPARE
              ? `Max ${MAX_COMPARE} models`
              : 'Search model to add...'
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={selectedIds.length >= MAX_COMPARE}
        />
        {suggestions.length > 0 && (
          <div className="absolute top-full z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
            {suggestions.map((m) => (
              <button
                key={m.id}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                onClick={() => addModel(m.id)}
              >
                <ProviderBadge provider={m.provider} />
                {m.model}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected tags */}
      {selectedModels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedModels.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm"
            >
              {m.model}
              <button
                onClick={() => removeModel(m.id)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Comparison table */}
      {selectedModels.length >= 2 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left text-muted-foreground"></th>
                {selectedModels.map((m) => (
                  <th key={m.id} className="px-3 py-2 text-center">
                    <div className="mb-1">
                      <ProviderBadge provider={m.provider} />
                    </div>
                    <div className="font-semibold">{m.model}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.label}
                  className="border-b even:bg-muted/30 transition-colors hover:bg-muted/50"
                >
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.label}
                  </td>
                  {selectedModels.map((m, i) => {
                    const isBest =
                      (row.label === 'Input Price' && i === bestInputIdx) ||
                      (row.label === 'Output Price' && i === bestOutputIdx);
                    return (
                      <td
                        key={m.id}
                        className={`px-3 py-2 text-center font-mono ${isBest ? 'font-bold text-green-600 dark:text-green-400' : ''}`}
                      >
                        {row.render(m)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedModels.length < 2 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          2つ以上のモデルを選択すると比較表が表示されます。
        </p>
      )}
    </div>
  );
}
