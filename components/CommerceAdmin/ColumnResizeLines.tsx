import styles from "@/styles/commerceAdmin.module.css";
import type { PointerEvent as ReactPointerEvent } from "react";

type Props<K extends string> = {
  columns: K[];
  widthOf: (key: K) => number;
  onResizeStart: (key: K, event: ReactPointerEvent<HTMLSpanElement>) => void;
  labelOf: (key: K) => string;
};

export default function ColumnResizeLines<K extends string>({
  columns,
  widthOf,
  onResizeStart,
  labelOf,
}: Props<K>) {
  const total = columns.reduce((sum, column) => sum + widthOf(column), 0) || 1;
  let offset = 0;

  return (
    <div className={styles.colResizeLines}>
      {columns.map((column) => {
        offset += widthOf(column);
        return (
          <span
            key={column}
            className={styles.colResizeLine}
            style={{ left: `${(offset / total) * 100}%` }}
            onPointerDown={(event) => onResizeStart(column, event)}
            role="separator"
            aria-orientation="vertical"
            aria-label={`Resize ${labelOf(column)} column`}
          />
        );
      })}
    </div>
  );
}
