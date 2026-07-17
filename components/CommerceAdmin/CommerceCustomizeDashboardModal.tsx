import { useEffect } from "react";
import {
  COMMERCE_DASHBOARD_WIDGETS,
  CommerceDashboardWidgetId,
} from "@/lib/commerceAdmin/dashboardWidgets";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  open: boolean;
  visibleWidgets: CommerceDashboardWidgetId[];
  onClose: () => void;
  onToggle: (id: CommerceDashboardWidgetId) => void;
  onReset: () => void;
};

export default function CommerceCustomizeDashboardModal({
  open,
  visibleWidgets,
  onClose,
  onToggle,
  onReset,
}: Props) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.customizeOverlay} role="presentation" onClick={onClose}>
      <div
        className={styles.customizeModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customize-dashboard-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.customizeModalHeader}>
          <div className={styles.customizeModalTitleWrap}>
            <span className={styles.customizeModalIcon} aria-hidden="true">
              <i className="fa-solid fa-table-cells-large" />
            </span>
            <div>
              <p className={styles.customizeModalKicker}>Dashboard Controls</p>
              <h2 id="customize-dashboard-title" className={styles.customizeModalTitle}>
                Customize Admin View
              </h2>
              <p className={styles.customizeModalSubtitle}>
                Choose which widgets stay visible on the admin dashboard.
              </p>
            </div>
          </div>
          <button type="button" className={styles.customizeCloseBtn} onClick={onClose}>
            Close
          </button>
        </div>

        <div className={styles.customizeToolbar}>
          <div>
            <p className={styles.customizeToolbarLabel}>Visible Widgets</p>
            <p className={styles.customizeToolbarMeta}>
              {visibleWidgets.length} of {COMMERCE_DASHBOARD_WIDGETS.length} dashboard items selected
            </p>
          </div>
          <button type="button" className={styles.customizeResetBtn} onClick={onReset}>
            <i className="fa-solid fa-rotate-left" aria-hidden="true" />
            Reset Default
          </button>
        </div>

        <div className={styles.customizeWidgetGrid}>
          {COMMERCE_DASHBOARD_WIDGETS.map((widget) => {
            const active = visibleWidgets.includes(widget.id);
            return (
              <button
                key={widget.id}
                type="button"
                className={active ? styles.customizeWidgetCardActive : styles.customizeWidgetCard}
                onClick={() => onToggle(widget.id)}
                aria-pressed={active}
              >
                <span className={styles.customizeWidgetIcon}>
                  <i className={widget.icon} aria-hidden="true" />
                </span>
                <span className={styles.customizeWidgetCopy}>
                  <strong>{widget.title}</strong>
                  <span>{widget.description}</span>
                </span>
                <span className={active ? styles.customizeWidgetStatusOn : styles.customizeWidgetStatusOff}>
                  {active ? (
                    <>
                      <i className="fa-solid fa-circle-check" aria-hidden="true" />
                      Visible
                    </>
                  ) : (
                    "Hidden"
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
