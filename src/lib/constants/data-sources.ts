import type { Provider } from '@/types/pricing';

export interface DataSource {
  provider: Provider | 'exchange-rate';
  label: string;
  url: string;
  description: string;
  method: string;
  schedule: string;
}

export const DATA_SOURCES: DataSource[] = [
  {
    provider: 'openai',
    label: 'OpenAI',
    url: 'https://developers.openai.com/docs/pricing',
    description: 'OpenAI 公式料金ページからモデル名・価格をスクレイピング',
    method: 'HTML scraping (Cheerio)',
    schedule: '毎週月曜・木曜 10:00 JST',
  },
  {
    provider: 'anthropic',
    label: 'Anthropic',
    url: 'https://platform.claude.com/docs/en/about-claude/pricing',
    description: 'Anthropic 公式料金ページからモデル名・価格をスクレイピング',
    method: 'HTML scraping (Cheerio)',
    schedule: '毎週月曜・木曜 10:00 JST',
  },
  {
    provider: 'google',
    label: 'Google (Vertex AI)',
    url: 'https://cloud.google.com/vertex-ai/generative-ai/pricing?hl=en',
    description:
      'Google Cloud Vertex AI 公式料金ページからモデル名・価格をスクレイピング',
    method: 'HTML scraping (Cheerio)',
    schedule: '毎週月曜・木曜 10:00 JST',
  },
  {
    provider: 'exchange-rate',
    label: 'Exchange Rate API',
    url: 'https://api.exchangerate-api.com/v4/latest/USD',
    description: 'USD基準の為替レート (JPY, EUR, GBP) を取得',
    method: 'REST API (JSON)',
    schedule: '毎週月曜・木曜 10:00 JST',
  },
];
