export function formatPrice(price: number): string {
  if (price < 0.01) {
    return `$${price.toFixed(3)}`;
  }
  return `$${price.toFixed(2)}`;
}

export function formatReleaseDate(date?: string): string {
  if (!date) return '—';
  return date.replace(/-/g, '/');
}

export function isDeprecated(deprecationDate?: string): boolean {
  if (!deprecationDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(deprecationDate) <= today;
}

export function formatContextWindow(tokens: number): string {
  if (tokens === 0) {
    return '—';
  }
  if (tokens >= 1_000_000) {
    return `${tokens / 1_000_000}M`;
  }
  return `${tokens / 1_000}K`;
}
