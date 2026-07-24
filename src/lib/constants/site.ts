/**
 * Shared site-level metadata used across the layout, sitemap, robots, manifest,
 * and Open Graph image. The public base URL comes from NEXT_PUBLIC_SITE_URL so
 * deployments can set their own canonical origin; it falls back to localhost in
 * development.
 */
export const SITE_NAME = 'API Price Comparison';

export const SITE_DESCRIPTION =
  'OpenAI、Google (Vertex AI)、Anthropic、さくらのAI Engine の LLM API 料金を一覧・比較できる Web アプリです。';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
