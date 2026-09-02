import { useCallback, useEffect, useState } from "react";

export function readColumnVisibility<T extends Record<string, boolean>>(
  storageKey: string,
  defaults: T,
): T {
  const merged = { ...defaults };
  if (typeof window === "undefined") return merged;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return merged;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return merged;

    (Object.keys(defaults) as (keyof T)[]).forEach((key) => {
      if (typeof parsed[String(key)] === "boolean") {
        merged[key] = parsed[String(key)] as T[keyof T];
      }
    });
  } catch {
    return { ...defaults };
  }

  if (!Object.values(merged).some(Boolean)) return { ...defaults };
  return merged;
}

export function writeColumnVisibility(storageKey: string, value: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Ignore quota / private-mode failures; the current session still keeps the selection.
  }
}

export function usePersistedColumnVisibility<T extends Record<string, boolean>>(
  storageKey: string,
  defaults: T,
) {
  const [columnsVisible, setColumnsVisibleState] = useState<T>(() =>
    readColumnVisibility(storageKey, defaults),
  );

  useEffect(() => {
    setColumnsVisibleState(readColumnVisibility(storageKey, defaults));
  }, [storageKey, defaults]);

  const setColumnsVisible = useCallback(
    (update: T | ((current: T) => T)) => {
      setColumnsVisibleState((current) => {
        const next = typeof update === "function" ? update(current) : update;
        const merged = { ...defaults };
        (Object.keys(defaults) as (keyof T)[]).forEach((key) => {
          if (typeof next[key] === "boolean") merged[key] = next[key];
        });
        if (!Object.values(merged).some(Boolean)) return current;
        writeColumnVisibility(storageKey, merged);
        return merged;
      });
    },
    [storageKey, defaults],
  );

  return [columnsVisible, setColumnsVisible] as const;
}
