import { useEffect, useState } from 'react';

/**
 * useState that persists to localStorage.
 * Falls back to the initial value if storage is unavailable or corrupted.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked — keep working in memory */
    }
  }, [key, value]);

  return [value, setValue];
}
