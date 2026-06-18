'use client';

import { useCallback, useSyncExternalStore } from 'react';

const EVENT = 'api-price:storage';

function subscribe(callback: () => void) {
  // `storage` fires for cross-tab changes; the custom event covers same-tab
  // updates triggered by the setter below.
  window.addEventListener('storage', callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(EVENT, callback);
  };
}

/**
 * Like useState, but persists the value to localStorage under `key`.
 *
 * Built on useSyncExternalStore so it is SSR-safe (server renders
 * `initialValue`) without setState-in-effect. The stored value is read on the
 * client after hydration. `revive` validates the parsed value and returns
 * `undefined` to reject malformed/stale data so it falls back to `initialValue`.
 *
 * Intended for primitive values (string/number/boolean): getSnapshot parses
 * storage on each render, so a stable-by-value result is required.
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
  revive?: (value: unknown) => T | undefined
): [T, (value: T) => void] {
  const getSnapshot = useCallback((): T => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return initialValue;
      const parsed: unknown = JSON.parse(raw);
      const revived = revive ? revive(parsed) : (parsed as T);
      return revived === undefined ? initialValue : revived;
    } catch {
      return initialValue;
    }
  }, [key, initialValue, revive]);

  const value = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => initialValue
  );

  const setValue = useCallback(
    (next: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(next));
        window.dispatchEvent(new Event(EVENT));
      } catch {
        // Ignore quota or availability errors.
      }
    },
    [key]
  );

  return [value, setValue];
}
