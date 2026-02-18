import { useState, useCallback } from "react";

/**
 * Like useState but persists the value in sessionStorage.
 * Filters survive navigation (back/forward) but are cleared when the tab closes.
 */
export function usePersistedFilters<T>(storageKey: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored) as T;
    } catch {
      // ignore parse errors
    }
    return defaultValue;
  });

  const setValue = useCallback((value: T) => {
    setState(value);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // ignore storage errors (e.g. private browsing quota)
    }
  }, [storageKey]);

  return [state, setValue];
}
