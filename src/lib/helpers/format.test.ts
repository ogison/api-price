import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatContextWindow,
  formatPrice,
  formatReleaseDate,
  isDeprecated,
} from './format';

describe('formatPrice', () => {
  it('uses 2 decimals for prices >= 0.01', () => {
    expect(formatPrice(2.5)).toBe('$2.50');
    expect(formatPrice(15)).toBe('$15.00');
    expect(formatPrice(0.01)).toBe('$0.01');
  });

  it('uses 3 decimals for prices < 0.01', () => {
    expect(formatPrice(0.005)).toBe('$0.005');
    expect(formatPrice(0.001)).toBe('$0.001');
  });
});

describe('formatReleaseDate', () => {
  it('returns an em dash when no date is given', () => {
    expect(formatReleaseDate()).toBe('—');
    expect(formatReleaseDate(undefined)).toBe('—');
  });

  it('replaces hyphens with slashes', () => {
    expect(formatReleaseDate('2026-03-05')).toBe('2026/03/05');
  });
});

describe('isDeprecated', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false when no deprecation date is given', () => {
    expect(isDeprecated()).toBe(false);
    expect(isDeprecated(undefined)).toBe(false);
  });

  it('returns true for past dates and false for future dates', () => {
    expect(isDeprecated('2000-01-01')).toBe(true);
    expect(isDeprecated('2999-01-01')).toBe(false);
  });

  it('compares against the current date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00Z'));
    // Use dates a day clear of "today" so the assertion stays independent of
    // the runner's timezone.
    expect(isDeprecated('2026-06-17')).toBe(true);
    expect(isDeprecated('2026-06-20')).toBe(false);
  });
});

describe('formatContextWindow', () => {
  it('returns an em dash for 0 tokens', () => {
    expect(formatContextWindow(0)).toBe('—');
  });

  it('formats millions with an M suffix', () => {
    expect(formatContextWindow(1_000_000)).toBe('1M');
    expect(formatContextWindow(2_000_000)).toBe('2M');
  });

  it('formats thousands with a K suffix', () => {
    expect(formatContextWindow(128_000)).toBe('128K');
    expect(formatContextWindow(16_385)).toBe('16.385K');
  });
});
