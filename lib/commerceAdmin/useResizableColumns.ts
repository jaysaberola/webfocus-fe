import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

const MIN_COL_WIDTH = 80;
const DEFAULT_COL_WIDTH = 160;
const FIXED_COL_WIDTH = 48;

function isFixedColumn(key: string) {
  return key.startsWith("__");
}

function readStoredWidths(storageKey: string): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, number] => typeof entry[1] === "number" && entry[1] > 0),
    );
  } catch {
    return {};
  }
}

export function defaultColumnWidth(label: string) {
  return Math.max(DEFAULT_COL_WIDTH, Math.min(280, label.length * 8 + 48));
}

export function useResizableColumns<K extends string>(
  storageKey: string,
  labelFor: (key: K) => string,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [allowOverflow, setAllowOverflow] = useState(false);
  const [widths, setWidths] = useState<Record<string, number>>({});
  const widthsRef = useRef(widths);
  widthsRef.current = widths;

  useLayoutEffect(() => {
    setWidths(readStoredWidths(storageKey));
    setAllowOverflow(false);
  }, [storageKey]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(Math.floor(el.clientWidth));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const rawWidthOf = useCallback(
    (key: K) => {
      if (isFixedColumn(key)) return widths[key] ?? FIXED_COL_WIDTH;
      return widths[key] ?? defaultColumnWidth(labelFor(key));
    },
    [labelFor, widths],
  );

  const layoutFor = useCallback(
    (columns: K[]) => {
      const raw = columns.map((column) => rawWidthOf(column));
      const flexIndexes = columns
        .map((column, index) => ({ column, index }))
        .filter((item) => !isFixedColumn(item.column));
      const fixedSum = columns.reduce(
        (total, column, index) => total + (isFixedColumn(column) ? raw[index] : 0),
        0,
      );
      const flexSum = flexIndexes.reduce((total, item) => total + raw[item.index], 0) || 1;
      const overflowing = allowOverflow && containerWidth > 0 && fixedSum + flexSum > containerWidth + 1;
      const targetFlex = overflowing || containerWidth <= 0 ? flexSum : Math.max(containerWidth - fixedSum, flexIndexes.length * MIN_COL_WIDTH);
      const scale = overflowing || containerWidth <= 0 ? 1 : targetFlex / flexSum;
      const sized = columns.map((column, index) => {
        if (isFixedColumn(column)) {
          return { column, width: raw[index] };
        }
        return {
          column,
          width: Math.max(MIN_COL_WIDTH, overflowing ? raw[index] : Math.floor(raw[index] * scale)),
        };
      });
      if (!overflowing && containerWidth > 0 && flexIndexes.length) {
        const lastFlex = flexIndexes[flexIndexes.length - 1];
        const used = sized.reduce((total, item, index) => (index === lastFlex.index ? total : total + item.width), 0);
        sized[lastFlex.index].width = Math.max(MIN_COL_WIDTH, containerWidth - used);
      }
      const map = Object.fromEntries(sized.map((item) => [item.column, item.width])) as Record<K, number>;
      const tableWidth = sized.reduce((total, item) => total + item.width, 0);
      return {
        widthOf: (key: K) => map[key] ?? rawWidthOf(key),
        innerWidth: overflowing ? tableWidth : "100%",
        overflowing,
      };
    },
    [allowOverflow, containerWidth, rawWidthOf],
  );

  const persist = useCallback(
    (next: Record<string, number>) => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore quota / private mode */
      }
    },
    [storageKey],
  );

  const startResize = useCallback(
    (key: K, event: ReactPointerEvent<HTMLElement>, columns: K[]) => {
      event.preventDefault();
      event.stopPropagation();
      const handle = event.currentTarget;
      handle.setPointerCapture(event.pointerId);
      const layout = layoutFor(columns);
      const startWidth = layout.widthOf(key);
      const snapshot = Object.fromEntries(columns.map((column) => [column, layout.widthOf(column)]));
      const previousCursor = document.body.style.cursor;
      const previousUserSelect = document.body.style.userSelect;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.body.dataset.colResizing = "true";
      const startX = event.clientX;

      const onMove = (moveEvent: PointerEvent) => {
        const nextWidth = Math.max(MIN_COL_WIDTH, Math.round(startWidth + (moveEvent.clientX - startX)));
        setAllowOverflow(true);
        setWidths({ ...snapshot, [key]: nextWidth });
      };

      const onUp = () => {
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onUp);
        handle.removeEventListener("pointercancel", onUp);
        document.body.style.cursor = previousCursor;
        document.body.style.userSelect = previousUserSelect;
        delete document.body.dataset.colResizing;
        persist({ ...widthsRef.current });
      };

      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp);
      handle.addEventListener("pointercancel", onUp);
    },
    [layoutFor, persist],
  );

  return { containerRef, layoutFor, startResize };
}
