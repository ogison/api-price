import type { Metadata } from 'next';
import { ExternalLink } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DATA_SOURCES } from '@/lib/constants/data-sources';

export const metadata: Metadata = {
  title: 'Data Sources — API Price Comparison',
  description: '価格データの取得元・更新頻度について',
};

const providerStyle: Record<string, string> = {
  openai:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  anthropic:
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  google: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'exchange-rate':
    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

export default function DataSourcesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Data Sources</h1>
      <p className="mb-8 text-muted-foreground">
        本サイトの価格データは以下の公式ページ・API
        から自動取得しています。更新は GitHub Actions
        により定期実行され、変更があれば自動で PR が作成されます。
      </p>

      <div className="grid gap-4">
        {DATA_SOURCES.map((source) => (
          <Card key={source.provider}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className={providerStyle[source.provider]}>
                  {source.label}
                </Badge>
                <CardTitle className="text-base">{source.label}</CardTitle>
              </div>
              <CardDescription>{source.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="font-medium text-muted-foreground">URL</dt>
                <dd>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                  >
                    {source.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </dd>
                <dt className="font-medium text-muted-foreground">取得方法</dt>
                <dd>{source.method}</dd>
                <dt className="font-medium text-muted-foreground">更新頻度</dt>
                <dd>{source.schedule}</dd>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
