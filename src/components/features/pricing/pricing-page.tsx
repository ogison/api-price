'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  Calculator,
  GitCompareArrows,
  TableProperties,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PRICING_DATA } from '@/lib/constants/pricing-data';
import { isDeprecated } from '@/lib/helpers/format';
import type { Provider } from '@/types/pricing';
import { CostSimulator } from './cost-simulator';
import { CurrencySwitcher } from './currency-switcher';
import { ModelComparison } from './model-comparison';
import { PricingChart } from './pricing-chart';
import { PricingFilters } from './pricing-filters';
import { PricingTable } from './pricing-table';

const ALL_PROVIDERS: Provider[] = ['openai', 'google', 'anthropic'];

function parseProviders(param: string | null): Provider[] {
  if (!param) return ALL_PROVIDERS;
  const values = param
    .split(',')
    .filter((v): v is Provider => ALL_PROVIDERS.includes(v as Provider));
  return values.length > 0 ? values : ALL_PROVIDERS;
}

export function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeProviders, setActiveProviders] = useState<Provider[]>(
    parseProviders(searchParams.get('providers'))
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [isLongContext, setIsLongContext] = useState(false);
  const [includeDeprecated, setIncludeDeprecated] = useState(false);

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
      if (newParams.get('providers') === ALL_PROVIDERS.join(','))
        newParams.delete('providers');

      const qs = newParams.toString();
      router.replace(qs ? `?${qs}` : '/', { scroll: false });
    },
    [router, searchParams]
  );

  const handleProvidersChange = (providers: Provider[]) => {
    setActiveProviders(providers);
    updateURL({ providers: providers.join(',') });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    updateURL({ q: query || null });
  };

  const filteredCount = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return PRICING_DATA.filter(
      (m) =>
        activeProviders.includes(m.provider) &&
        (q === '' || m.model.toLowerCase().includes(q)) &&
        (includeDeprecated || !isDeprecated(m.deprecationDate))
    ).length;
  }, [activeProviders, searchQuery, includeDeprecated]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8 rounded-xl bg-gradient-to-br from-primary/5 via-background to-accent/10 px-6 py-10">
        <h1 className="text-4xl font-bold tracking-tight">
          API Price Comparison
        </h1>
        <p className="mt-2 text-muted-foreground">
          OpenAI, Google (Vertex AI), Anthropic の LLM API
          料金を一覧で比較できます。
        </p>
        <Badge variant="secondary" className="mt-3">
          {PRICING_DATA.length} models
        </Badge>
      </div>

      {/* Global Filters */}
      <Card className="mb-4">
        <CardContent className="space-y-3 p-4">
          <PricingFilters
            activeProviders={activeProviders}
            onProvidersChange={handleProvidersChange}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <CurrencySwitcher />
              <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <input
                  type="checkbox"
                  checked={includeDeprecated}
                  onChange={(e) => setIncludeDeprecated(e.target.checked)}
                  className="accent-primary"
                />
                Deprecated
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Pricing:
                </span>
                <ToggleGroup
                  type="single"
                  value={isLongContext ? 'long' : 'standard'}
                  onValueChange={(v) => {
                    if (v) setIsLongContext(v === 'long');
                  }}
                >
                  <ToggleGroupItem value="standard" className="text-xs">
                    Standard
                  </ToggleGroupItem>
                  <ToggleGroupItem value="long" className="text-xs">
                    Long Context
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">
              {filteredCount} models
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tools Tabs */}
      <Card>
        <Tabs defaultValue="table">
          <CardHeader className="pb-0">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="table" className="gap-1.5">
                <TableProperties className="h-4 w-4 max-sm:hidden" />
                <span>Table</span>
              </TabsTrigger>
              <TabsTrigger value="simulator" className="gap-1.5">
                <Calculator className="h-4 w-4 max-sm:hidden" />
                <span>Cost Simulator</span>
              </TabsTrigger>
              <TabsTrigger value="chart" className="gap-1.5">
                <BarChart3 className="h-4 w-4 max-sm:hidden" />
                <span>Chart</span>
              </TabsTrigger>
              <TabsTrigger value="comparison" className="gap-1.5">
                <GitCompareArrows className="h-4 w-4 max-sm:hidden" />
                <span>Compare</span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-6">
            <TabsContent value="simulator" className="mt-0">
              <CostSimulator
                activeProviders={activeProviders}
                searchQuery={searchQuery}
                isLongContext={isLongContext}
                includeDeprecated={includeDeprecated}
              />
            </TabsContent>
            <TabsContent value="comparison" className="mt-0">
              <ModelComparison
                activeProviders={activeProviders}
                searchQuery={searchQuery}
                includeDeprecated={includeDeprecated}
              />
            </TabsContent>
            <TabsContent value="chart" className="mt-0">
              <Suspense>
                <PricingChart
                  activeProviders={activeProviders}
                  searchQuery={searchQuery}
                  isLongContext={isLongContext}
                  includeDeprecated={includeDeprecated}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="table" className="mt-0">
              <Suspense>
                <PricingTable
                  activeProviders={activeProviders}
                  searchQuery={searchQuery}
                  isLongContext={isLongContext}
                  includeDeprecated={includeDeprecated}
                />
              </Suspense>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </main>
  );
}
