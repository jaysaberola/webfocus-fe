import { useEffect, useMemo, useState } from "react";
import type { CollectionQueueRow } from "@/lib/commerceAdmin/collectionQueueHelpers";
import styles from "@/styles/commerceAdmin.module.css";

const DEFAULT_MESSAGE =
  "Please review your statement of account and settle any outstanding balance at your earliest convenience.";

type Props = {
  open: boolean;
  rows: CollectionQueueRow[];
  busy?: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
};

export default function BulkCollectionSoaModal({ open, rows, busy, onClose, onSubmit }: Props) {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const preview = useMemo(() => rows.slice(0, 6), [rows]);

  useEffect(() => {
    if (!open) return;
    setMessage(DEFAULT_MESSAGE);
  }, [open, rows.length]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onClose]);

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(message.trim());
  };

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-soa-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className={styles.modalCardWide}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle} id="bulk-soa-title">
              Send bulk statement of account
            </h3>
            <p className={styles.panelSubtitle}>
              {rows.length} invoice{rows.length === 1 ? "" : "s"} · client portal Billing inbox
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
            Each selected client receives a <strong>Statement of Account</strong> notification in their
            portal. Invoice notes are updated with <strong>SOA sent</strong> for your collection log.
          </p>

          <div className={styles.modalLabel}>
            <span>Recipients</span>
            <ul className={styles.collectionBulkSoaList}>
              {preview.map((row) => (
                <li key={row.invoice.id}>
                  <strong>{row.invoice.clientName}</strong>
                  <span>
                    {row.invoice.wsiInvoiceNumber} · {row.amountPrimary}
                  </span>
                </li>
              ))}
              {rows.length > preview.length ? (
                <li className={styles.collectionBulkSoaMore}>
                  + {rows.length - preview.length} more in this list
                </li>
              ) : null}
            </ul>
          </div>

          <label className={styles.modalLabel}>
            Message to clients
            <textarea
              className={styles.modalTextarea}
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={busy}
              autoFocus
            />
          </label>

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryBtn} onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryBtnSm} disabled={busy || rows.length === 0}>
              {busy ? "Sending…" : `Send ${rows.length} SOA`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}