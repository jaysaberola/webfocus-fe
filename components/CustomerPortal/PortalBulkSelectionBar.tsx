import styles from "@/styles/customerPortal.module.css";

type Props = {
  selectedCount: number;
  entityLabel?: string;
  exporting?: boolean;
  onExport: () => void;
  onClear: () => void;
};

export default function PortalBulkSelectionBar({
  selectedCount,
  entityLabel = "item",
  exporting = false,
  onExport,
  onClear,
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
          disabled={exporting || selectedCount === 0}
        >
          <i className="fa-solid fa-file-excel" aria-hidden="true" />
          {exporting ? " Exporting..." : " Export Excel"}
        </button>
        <button type="button" className={styles.secondaryBtnSm} onClick={onClear} disabled={exporting}>
          Clear
        </button>
      </div>
    </div>
  );
}
