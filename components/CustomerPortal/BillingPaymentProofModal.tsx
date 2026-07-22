import { useEffect, useMemo, useRef, useState } from "react";
import { formatPeso } from "@/lib/customerPortal/mockData";
import type { PortalInvoice } from "@/lib/customerPortal/types";
import PortalModal from "@/components/CustomerPortal/PortalModal";
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
  payableInvoices,
  uploading = false,
  onClose,
  onSubmit,
}: BillingPaymentProofModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoiceId);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedInvoiceId(invoiceId || payableInvoices[0]?.id || "");
    setNotes("");
    setFile(null);
  }, [open, invoiceId, payableInvoices]);

  const selectedInvoice = useMemo(
    () => payableInvoices.find((inv) => inv.id === selectedInvoiceId) ?? null,
    [payableInvoices, selectedInvoiceId]
  );

  const canSubmit = Boolean(selectedInvoiceId && file && !uploading);
  const showInvoicePicker = payableInvoices.length > 1;

  const handleSubmit = () => {
    if (!selectedInvoiceId || !file) return;
    onSubmit({ invoiceId: selectedInvoiceId, notes: notes.trim(), file });
  };

  return (
    <PortalModal
      open={open}
      onClose={onClose}
      ariaLabelledBy="billing-proof-title"
      dialogClassName={styles.billingModalForm}
    >
      <div className={styles.billingModalHead}>
        <div className={styles.billingModalHeadText}>
          <h3 id="billing-proof-title">Submit Payment Proof</h3>
          <p className={styles.panelSub}>Upload your receipt for admin verification.</p>
        </div>
        <button type="button" className={styles.billingModalClose} aria-label="Close" onClick={onClose}>
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </div>

      <div className={styles.billingModalBody}>
        <div className={styles.proofFormPanel}>
          {showInvoicePicker ? (
            <label className={styles.proofField}>
              <span>Select Invoice</span>
              <select
                className={styles.cpControl}
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
              >
                {payableInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.id} · {formatPeso(inv.amount)} · {inv.serviceName ?? inv.items}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {selectedInvoice ? (
            <div className={styles.proofInvoiceCard}>
              <div className={styles.proofInvoiceIcon} aria-hidden="true">
                <i className="fa-solid fa-file-invoice-dollar" />
              </div>
              <div className={styles.proofInvoiceMeta}>
                <p className={styles.proofInvoiceId}>{selectedInvoice.id}</p>
                <p className={styles.proofInvoiceDetail}>
                  {selectedInvoice.serviceName ?? selectedInvoice.items}
                  {selectedInvoice.plan ?? selectedInvoice.subscription
                    ? ` · ${selectedInvoice.plan ?? selectedInvoice.subscription}`
                    : ""}
                </p>
                <p className={styles.proofInvoiceAmount}>{formatPeso(selectedInvoice.amount)}</p>
              </div>
            </div>
          ) : (
            <p className={styles.proofEmptyState}>No unpaid invoices available for payment proof.</p>
          )}

          <div className={styles.proofField}>
            <span>Receipt File</span>
            <button
              type="button"
              className={`${styles.proofUploadZone} ${file ? styles.proofUploadZoneReady : ""}`}
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedInvoice}
            >
              <span className={styles.proofUploadIcon} aria-hidden="true">
                <i className={file ? "fa-solid fa-file-circle-check" : "fa-solid fa-cloud-arrow-up"} />
              </span>
              <span className={styles.proofUploadTitle}>
                {file ? file.name : "Click to upload receipt"}
              </span>
              <span className={styles.proofUploadHint}>
                {file ? "Click to replace file" : "PDF, PNG, or JPG · Max 5MB"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                className={styles.proofFileInput}
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </button>
          </div>

          <label className={styles.proofField}>
            <span>Payment Reference (optional)</span>
            <input
              className={styles.cpControl}
              type="text"
              value={notes}
              placeholder="BDO Ref #, GCash Ref, transaction ID..."
              onChange={(e) => setNotes(e.target.value)}
              disabled={!selectedInvoice}
            />
          </label>
        </div>
      </div>

      <div className={`${styles.billingModalActions} ${styles.billingModalActionsStacked}`}>
        <button
          type="button"
          className={styles.proofSubmitBtn}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {uploading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Uploading...
            </>
          ) : (
            <>
              <i className="fa-solid fa-upload" aria-hidden="true" /> Upload Payment Proof
            </>
          )}
        </button>
      </div>
    </PortalModal>
  );
}
