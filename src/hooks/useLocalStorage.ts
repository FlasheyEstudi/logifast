'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useLocalStorage — robust, SSR-safe localStorage hook.
 *
 * - Reads from localStorage on mount (not during SSR) to avoid hydration
 *   mismatches; the `defaultValue` is used for the initial server render.
 * - JSON-parses stored values; falls back to the raw string when parsing
 *   fails (so plain strings stored elsewhere still work).
 * - Catches QuotaExceededError and other write failures with a console.warn
 *   so the UI never crashes on storage errors.
 * - Supports functional updates: `set(prev => next)`.
 *
 * @param key        localStorage key
 * @param defaultValue  value used on first render / when key is missing
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(defaultValue);

  // Hydrate from localStorage on the client after mount.
  // We intentionally use `setState` inside this effect — that's the
  // canonical SSR-safe pattern for reading localStorage (so the
  // server's first render matches the client's first render and we
  // avoid hydration mismatches).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        setStoredValue(defaultValue);
        return;
      }
      try {
        setStoredValue(JSON.parse(item) as T);
      } catch {
        // JSON parse failed — fall back to raw string if T is string-like.
        setStoredValue(item as unknown as T);
      }
    } catch (err) {
      console.warn(`useLocalStorage: failed to read key "${key}"`, err);
    }
    // `defaultValue` is intentionally omitted from deps: we only want
    // to re-read from localStorage when the key changes, not when the
    // caller passes a fresh literal each render.
  }, [key]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next =
          typeof value === 'function'
            ? (value as (p: T) => T)(prev)
            : value;

        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(key, JSON.stringify(next));
          } catch (err) {
            if (
              err instanceof DOMException &&
              (err.name === 'QuotaExceededError' ||
                err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
            ) {
              console.warn(
                `useLocalStorage: quota exceeded for key "${key}"`
              );
            } else {
              console.warn(
                `useLocalStorage: failed to write key "${key}"`,
                err
              );
            }
          }
        }
        return next;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}

/**
 * useLocalStorageListener — subscribes to `storage` events for `key`,
 * enabling cross-tab/cross-window sync. The callback is kept in a ref
 * so callers don't need to memoize it.
 *
 * @param key       localStorage key to watch
 * @param callback  invoked with `newValue` (string | null) on changes
 *                  from OTHER tabs. `null` means the key was deleted.
 */
export function useLocalStorageListener(
  key: string,
  callback: (newValue: string | null) => void
): void {
  const cbRef = useRef(callback);
  useEffect(() => {
    cbRef.current = callback;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: StorageEvent) => {
      if (e.key === key) {
        cbRef.current(e.newValue);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key]);
}
