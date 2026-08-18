import { useEffect, useState } from "react";
import type { SalesTransaction } from "@/services/salesTransactionService";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  open: boolean;
  transaction: SalesTransaction | null;
  uploading?: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
};

export default function UploadProposalModal({
  open,
  transaction,
  uploading = false,
  onClose,
  onUpload,
}: Props) {
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setFile(null);
  }, [open, transaction?.id]);

  if (!open || !transaction) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Upload Proposal Quotation</h3>
            <p className={styles.panelSubtitle}>
              {transaction.transaction_no} · Client will download, sign, and re-upload this file.
            </p>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Close" disabled={uploading}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <form
          className={styles.modalForm}
          onSubmit={(event) => {
            event.preventDefault();
            if (file) onUpload(file);
          }}
        >
          <label className={styles.modalLabel}>
            Proposal file (PDF, image, or Word)
            <input
              className={styles.modalInput}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
          </label>
          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryBtnSm} onClick={onClose} disabled={uploading}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryBtnSm} disabled={!file || uploading}>
              {uploading ? "Uploading..." : "Upload Proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
