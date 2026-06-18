import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants/site';

const ROUTES = [
  { path: '', priority: 1 },
  { path: '/data-sources', priority: 0.8 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: 'weekly',
    priority,
  }));
}
