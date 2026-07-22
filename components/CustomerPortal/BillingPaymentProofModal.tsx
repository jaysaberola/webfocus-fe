import { useEffect, useState } from "react";
import { formatPeso } from "@/lib/customerPortal/mockData";
import type { PortalInvoice } from "@/lib/customerPortal/types";
import styles from "@/styles/customerPortal.module.css";

type BillingPaymentProofModalProps = {
  open: boolean;
  invoiceId: string;
  invoiceLabel?: string;
  payableInvoices: PortalInvoice[];
  uploading?: boolean;
  onClose: () => void;
  onSubmit: (payload: { invoiceId: string; notes: string; file: File }) => void;
};

export default function BillingPaymentProofModal({
  open,
  invoiceId,
  invoiceLabel,
  payableInvoices,
  uploading = false,
  onClose,
  onSubmit,
}: BillingPaymentProofModalProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoiceId);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedInvoiceId(invoiceId || payableInvoices[0]?.id || "");
    setNotes("");
    setFile(null);
  }, [open, invoiceId, payableInvoices]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!selectedInvoiceId || !file) return;
    onSubmit({ invoiceId: selectedInvoiceId, notes: notes.trim(), file });
  };

  return (
    <div className={styles.billingModalOverlay} role="presentation" onClick={onClose}>
      <div
        className={styles.billingModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="billing-proof-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.billingModalHead}>
          <div>
            <h3 id="billing-proof-title">Submit New Payment Proof</h3>
            <p className={styles.panelSub}>
              Upload your bank transfer, GCash, or Maya receipt for admin verification.
            </p>
          </div>
          <button type="button" className={styles.billingModalClose} aria-label="Close" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        {invoiceLabel ? (
          <div className={styles.billingModalSummary}>
            <p className={styles.billingModalLine}>
              <strong>Invoice:</strong> {invoiceLabel}
            </p>
          </div>
        ) : null}

        <label className={styles.proofField}>
          <span>Select Invoice</span>
          <select
            value={selectedInvoiceId}
            onChange={(e) => setSelectedInvoiceId(e.target.value)}
            disabled={payableInvoices.length === 0}
          >
            {payableInvoices.length === 0 ? (
              <option value="">No unpaid invoices</option>
            ) : (
              payableInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.id} ({formatPeso(inv.amount)} - {inv.serviceName ?? inv.items})
                </option>
              ))
            )}
          </select>
        </label>

        <label className={styles.proofField}>
          <span>Attach Receipt File</span>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <small className={styles.proofHint}>PDF, PNG, or JPG up to 5MB</small>
        </label>

        <label className={styles.proofField}>
          <span>Reference / Notes</span>
          <input
            type="text"
            value={notes}
            placeholder="e.g. BDO Ref # 99281032 or GCash Ref"
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <div className={styles.billingModalActions}>
          <button type="button" className={styles.secondaryBtnSm} onClick={onClose} disabled={uploading}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.primaryBtnSm}
            disabled={uploading || !selectedInvoiceId || !file}
            onClick={handleSubmit}
          >
            {uploading ? "Uploading..." : "Upload Payment Proof"}
          </button>
        </div>
      </div>
    </div>
  );
}
