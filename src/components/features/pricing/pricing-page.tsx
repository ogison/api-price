import { PricingTable } from './pricing-table';

export function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          API Price Comparison
        </h1>
        <p className="text-muted-foreground">
          OpenAI, Google (Vertex AI), Anthropic の LLM API
          料金を一覧で比較できます。価格は 1M トークンあたり（USD）です。
        </p>
      </div>
      <PricingTable />
    </main>
  );
}
