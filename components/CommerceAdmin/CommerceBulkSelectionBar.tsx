import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  selectedCount: number;
  entityLabel?: string;
  exporting?: boolean;
  deleting?: boolean;
  onExport: () => void;
  onDelete?: () => void;
  onClear: () => void;
  showDelete?: boolean;
};

export default function CommerceBulkSelectionBar({
  selectedCount,
  entityLabel = "item",
  exporting = false,
  deleting = false,
  onExport,
  onDelete,
  onClear,
  showDelete = true,
}: Props) {
  const label = selectedCount === 1 ? entityLabel : `${entityLabel}s`;

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
          disabled={exporting || deleting || selectedCount === 0}
        >
          <i className="fa-solid fa-file-excel" aria-hidden="true" />
          {exporting ? " Exporting..." : " Export Excel"}
        </button>
        {showDelete && onDelete ? (
          <button
            type="button"
            className={styles.dangerBtnSm}
            onClick={onDelete}
            disabled={deleting || exporting || selectedCount === 0}
          >
            <i className="fa-solid fa-trash" aria-hidden="true" /> Delete
          </button>
        ) : null}
        <button
          type="button"
          className={styles.secondaryBtnSm}
          onClick={onClear}
          disabled={deleting || exporting}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
