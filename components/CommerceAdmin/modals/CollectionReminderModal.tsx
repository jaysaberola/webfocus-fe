import { useEffect, useState } from "react";
import type { CollectionQueueRow } from "@/lib/commerceAdmin/collectionQueueHelpers";
import styles from "@/styles/commerceAdmin.module.css";

const DEFAULT_NOTE = "Payment follow-up";

type Props = {
  open: boolean;
  row: CollectionQueueRow | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
};

export default function CollectionReminderModal({ open, row, busy, onClose, onSubmit }: Props) {
  const [message, setMessage] = useState(DEFAULT_NOTE);

  useEffect(() => {
    if (!open || !row) return;
    setMessage(DEFAULT_NOTE);
  }, [open, row]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onClose]);

  if (!open || !row) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(message.trim());
  };

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="collection-reminder-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle} id="collection-reminder-title">
              Collection reminder
            </h3>
            <p className={styles.panelSubtitle}>
              {row.invoice.clientName} · {row.invoice.wsiInvoiceNumber}
            </p>
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <p className={styles.panelSubtitle}>
            Log a follow-up on this invoice. The queue will show <strong>Reminded</strong> under Due
            &amp; PTP / logs.
          </p>

          <label className={styles.modalLabel}>
            Follow-up note
            <textarea
              className={styles.modalTextarea}
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={DEFAULT_NOTE}
              disabled={busy}
              autoFocus
            />
          </label>

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryBtn} onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryBtnSm} disabled={busy}>
              {busy ? "Logging…" : "Log reminder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}