'use client';

import { Suspense } from 'react';
import { BarChart3, Calculator, GitCompareArrows } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PRICING_DATA } from '@/lib/constants/pricing-data';
import { CostSimulator } from './cost-simulator';
import { ModelComparison } from './model-comparison';
import { PricingChart } from './pricing-chart';
import { PricingTable } from './pricing-table';

export function PricingPage() {
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

      {/* Tools Tabs */}
      <Card className="mb-8">
        <Tabs defaultValue="simulator">
          <CardHeader className="pb-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="simulator" className="gap-1.5">
                <Calculator className="h-4 w-4 max-sm:hidden" />
                <span>Cost Simulator</span>
              </TabsTrigger>
              <TabsTrigger value="comparison" className="gap-1.5">
                <GitCompareArrows className="h-4 w-4 max-sm:hidden" />
                <span>Compare</span>
              </TabsTrigger>
              <TabsTrigger value="chart" className="gap-1.5">
                <BarChart3 className="h-4 w-4 max-sm:hidden" />
                <span>Chart</span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-6">
            <TabsContent value="simulator" className="mt-0">
              <CostSimulator />
            </TabsContent>
            <TabsContent value="comparison" className="mt-0">
              <ModelComparison />
            </TabsContent>
            <TabsContent value="chart" className="mt-0">
              <Suspense>
                <PricingChart />
              </Suspense>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Pricing Table */}
      <Suspense>
        <PricingTable />
      </Suspense>
    </main>
  );
}
