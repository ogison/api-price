const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

export async function fetchWithRetry(
  url: string,
  retries = MAX_RETRIES
): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; PricingBot/1.0; +https://github.com)',
          Accept: 'text/html,application/xhtml+xml,application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return await res.text();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      const delay = INITIAL_DELAY_MS * Math.pow(3, attempt);
      console.warn(
        `  Retry ${attempt + 1}/${retries} for ${url} in ${delay}ms...`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable');
}

export function parsePrice(text: string | undefined): number | undefined {
  if (text === undefined || text === null) return undefined;
  const cleaned = text.replace(/[,$\s]/g, '').trim();
  if (!cleaned || cleaned === '—' || cleaned === 'N/A' || cleaned === '-') {
    return undefined;
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()（）]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
