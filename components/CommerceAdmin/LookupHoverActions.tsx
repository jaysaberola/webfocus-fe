import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  label: string;
  assigned: boolean;
  onEdit: () => void;
  onLabelClick?: () => void;
  onUnassign?: () => void;
  unassigning?: boolean;
  editLabel?: string;
  unassignLabel?: string;
};

export default function LookupHoverActions({
  label,
  assigned,
  onEdit,
  onLabelClick,
  onUnassign,
  unassigning = false,
  editLabel = "Edit",
  unassignLabel = "Unassign",
}: Props) {
  return (
    <span className={styles.lookupHover}>
      <span className={styles.lookupHoverActions}>
        <button
          type="button"
          className={styles.lookupHoverBtn}
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
          aria-label={editLabel}
        >
          <i className="fa-solid fa-pencil" aria-hidden="true" />
          <span className={styles.lookupHoverTooltip}>{editLabel}</span>
        </button>
        {assigned && onUnassign ? (
          <button
            type="button"
            className={styles.lookupHoverBtn}
            onClick={(event) => {
              event.stopPropagation();
              if (!unassigning) onUnassign();
            }}
            disabled={unassigning}
            aria-label={unassignLabel}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
            <span className={styles.lookupHoverTooltip}>{unassignLabel}</span>
          </button>
        ) : null}
      </span>
      <button
        type="button"
        className={styles.lookupHoverLabel}
        onClick={(event) => {
          event.stopPropagation();
          (onLabelClick ?? onEdit)();
        }}
      >
        {label}
      </button>
    </span>
  );
}
