export function formatPrice(price: number): string {
  if (price < 0.01) {
    return `$${price.toFixed(3)}`;
  }
  return `$${price.toFixed(2)}`;
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
