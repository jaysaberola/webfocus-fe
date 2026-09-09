import styles from "@/styles/customerPortal.module.css";

type Props = {
  selectedCount: number;
  entityLabel?: string;
  exporting?: boolean;
  deleting?: boolean;
  onExport: () => void;
  onDelete?: () => void;
  onClear: () => void;
};

export default function PortalBulkSelectionBar({
  selectedCount,
  entityLabel = "item",
  exporting = false,
  deleting = false,
  onExport,
  onDelete,
  onClear,
}: Props) {
  const label = selectedCount === 1 ? entityLabel : `${entityLabel}s`;
  const busy = exporting || deleting;

  return (
    <div className={styles.bulkSelectionBar}>
      <span>
        {selectedCount} {label} selected
      </span>
      <div className={styles.bulkSelectionActions}>
        <button
          type="button"
          className={styles.secondaryBtnSm}
          onClick={onExport}
          disabled={busy || selectedCount === 0}
        >
          <i className="fa-solid fa-file-excel" aria-hidden="true" />
          {exporting ? " Exporting..." : " Export Excel"}
        </button>
        {onDelete ? (
          <button
            type="button"
            className={`${styles.secondaryBtnSm} ${styles.dangerBtnSm}`}
            onClick={onDelete}
            disabled={busy || selectedCount === 0}
          >
            <i className="fa-solid fa-trash" aria-hidden="true" />
            {deleting ? " Deleting..." : " Delete"}
          </button>
        ) : null}
        <button type="button" className={styles.secondaryBtnSm} onClick={onClear} disabled={busy}>
          Clear
        </button>
      </div>
    </div>
  );
}
