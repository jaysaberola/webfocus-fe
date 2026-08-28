import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import { useResizableColumns } from "@/lib/commerceAdmin/useResizableColumns";
import styles from "@/styles/resizableTable.module.css";

const SELECT_KEY = "__select";

type Props = {
  storageKey: string;
  columns: string[];
  labels?: Record<string, string>;
  selectColumn?: boolean;
  /** Keep the table inside its card; resize steals width from the next column instead of overflowing. */
  lockToContainer?: boolean;
  className?: string;
  children: ReactElement;
};

export default function ResizableTableFrame({
  storageKey,
  columns,
  labels = {},
  selectColumn = false,
  lockToContainer = false,
  className,
  children,
}: Props) {
  const keys = selectColumn ? [SELECT_KEY, ...columns] : columns;
  const labelFor = useCallback(
    (key: string) => (key === SELECT_KEY ? "Select" : labels[key] || key),
    [labels],
  );
  const { containerRef, layoutFor, startResize } = useResizableColumns(storageKey, labelFor, {
    lockToContainer,
  });
  const layout = layoutFor(keys);
  const table = Children.only(children);

  if (!isValidElement(table) || keys.length === 0) return children;

  const tableElement = table as ReactElement<{ className?: string; style?: CSSProperties; children?: unknown }>;
  const total = keys.reduce((sum, key) => sum + layout.widthOf(key), 0) || 1;
  let offset = 0;

  return (
    <div
      ref={containerRef}
      className={[styles.wrap, className].filter(Boolean).join(" ")}
      style={{ overflowX: lockToContainer || !layout.overflowing ? "hidden" : "auto" }}
    >
      <div className={styles.inner} style={{ width: layout.innerWidth }}>
        {cloneElement(tableElement, {
          className: [tableElement.props.className, styles.table].filter(Boolean).join(" "),
          style: { ...tableElement.props.style, width: "100%", tableLayout: "fixed" },
          children: (
            <>
              <colgroup>
                {keys.map((key) => (
                  <col key={key} style={{ width: layout.widthOf(key) }} />
                ))}
              </colgroup>
              {tableElement.props.children}
            </>
          ),
        })}
        <div className={styles.lines}>
          {keys.map((key) => {
            offset += layout.widthOf(key);
            if (key.startsWith("__") || key === "select") return null;
            return (
              <span
                key={key}
                className={styles.line}
                style={{ left: `${(offset / total) * 100}%` }}
                onPointerDown={(event: ReactPointerEvent<HTMLSpanElement>) =>
                  startResize(key, event, keys)
                }
                role="separator"
                aria-orientation="vertical"
                aria-label={`Resize ${labelFor(key)} column`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
