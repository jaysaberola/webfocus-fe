import { useEffect, useMemo, useRef, useState } from "react";
import { formatPeso } from "@/lib/customerPortal/mockData";
import type { PortalInvoice } from "@/lib/customerPortal/types";
import { ocrReceiptFile, type PaynamicsProofScan } from "@/lib/paynamicsProofScan";
import PortalModal from "@/components/CustomerPortal/PortalModal";
import { scanPortalPaymentProof } from "@/services/customerPortalService";
import styles from "@/styles/customerPortal.module.css";

type ScanState = {
  status: "idle" | "scanning" | "valid" | "invalid";
  message: string;
  scannedText: string;
};

type BillingPaymentProofModalProps = {
  open: boolean;
  invoiceId: string;
  invoiceLabel?: string;
  payableInvoices: PortalInvoice[];
  uploading?: boolean;
  onClose: () => void;
  onSubmit: (payload: { invoiceId: string; notes: string; file: File; scannedText?: string }) => void;
};

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

export default function BillingPaymentProofModal({
  open,
  invoiceId,
  payableInvoices,
  uploading = false,
  onClose,
  onSubmit,
}: BillingPaymentProofModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanSeq = useRef(0);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoiceId);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [scan, setScan] = useState<ScanState>({ status: "idle", message: "", scannedText: "" });

  useEffect(() => {
    if (!open) return;
    scanSeq.current += 1;
    setSelectedInvoiceId(invoiceId || payableInvoices[0]?.id || "");
    setNotes("");
    setFile(null);
    setScan({ status: "idle", message: "", scannedText: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open, invoiceId, payableInvoices]);

  const selectedInvoice = useMemo(
    () => payableInvoices.find((inv) => inv.id === selectedInvoiceId) ?? null,
    [payableInvoices, selectedInvoiceId]
  );

  useEffect(() => {
    if (!open || !file || !selectedInvoiceId) return;

    const seq = ++scanSeq.current;
    let cancelled = false;

    const runScan = async () => {
      if (file.size > MAX_RECEIPT_BYTES) {
        setScan({
          status: "invalid",
          message: "File must be 5MB or smaller.",
          scannedText: "",
        });
        return;
      }

      setScan({
        status: "scanning",
        message: "Scanning receipt for a Paynamics payment proof...",
        scannedText: "",
      });

      try {
        const first = await scanReceipt(selectedInvoiceId, file);
        if (cancelled || seq !== scanSeq.current) return;

        if (first.valid) {
          setScan({ status: "valid", message: first.message, scannedText: "" });
          return;
        }

        if (first.code === "unreadable" || first.code === "request_id_mismatch") {
          const ocrText = await ocrReceiptFile(file);
          if (cancelled || seq !== scanSeq.current) return;

          if (ocrText) {
            const retry = await scanReceipt(selectedInvoiceId, file, ocrText);
            if (cancelled || seq !== scanSeq.current) return;
            setScan({
              status: retry.valid ? "valid" : "invalid",
              message: retry.message,
              scannedText: retry.valid ? ocrText : "",
            });
            return;
          }
        }

        setScan({ status: "invalid", message: first.message, scannedText: "" });
      } catch (err: any) {
        if (cancelled || seq !== scanSeq.current) return;
        setScan({
          status: "invalid",
          message:
            err?.response?.data?.message ||
            "We could not scan this file. Upload a clearer Paynamics Payment Success screenshot.",
          scannedText: "",
        });
      }
    };

    void runScan();

    return () => {
      cancelled = true;
    };
  }, [open, file, selectedInvoiceId]);

  const canSubmit = Boolean(selectedInvoiceId && file && scan.status === "valid" && !uploading);
  const showInvoicePicker = payableInvoices.length > 1;

  const handleSubmit = () => {
    if (!selectedInvoiceId || !file || scan.status !== "valid") return;
    onSubmit({
      invoiceId: selectedInvoiceId,
      notes: notes.trim(),
      file,
      scannedText: scan.scannedText || undefined,
    });
  };

  const handleFileChange = (nextFile: File | null) => {
    setFile(nextFile);
    if (!nextFile) {
      scanSeq.current += 1;
      setScan({ status: "idle", message: "", scannedText: "" });
      return;
    }

    setScan({
      status: "scanning",
      message: "Scanning receipt for a Paynamics payment proof...",
      scannedText: "",
    });
  };

  const zoneClass = [
    styles.proofUploadZone,
    scan.status === "scanning" ? styles.proofUploadZoneScanning : "",
    scan.status === "valid" ? styles.proofUploadZoneReady : "",
    scan.status === "invalid" ? styles.proofUploadZoneInvalid : "",
  ]
    .filter(Boolean)
    .join(" ");

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
          <p className={styles.panelSub}>
            {selectedInvoice?.status === "Paid"
              ? "This invoice is already paid in Paynamics. Upload the Payment Success screenshot so billing can confirm your receipt."
              : "Upload a Paynamics Payment Success receipt. We scan it before it can be submitted."}
          </p>
        </div>
        <button type="button" className={styles.billingModalClose} aria-label="Close" onClick={onClose}>
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </div>

      <div className={styles.billingModalBody}>
        <ol className={styles.proofNeedSteps}>
          <li>Screenshot or download the Paynamics Payment Success page.</li>
          <li>Upload that file below. We scan it before it can be submitted.</li>
        </ol>
        <div className={styles.proofFormPanel}>
          {showInvoicePicker ? (
            <label className={styles.proofField}>
              <span>Select Invoice</span>
              <select
                className={styles.cpControl}
                value={selectedInvoiceId}
                onChange={(e) => {
                  setSelectedInvoiceId(e.target.value);
                  if (file) {
                    setScan({
                      status: "scanning",
                      message: "Scanning receipt for a Paynamics payment proof...",
                      scannedText: "",
                    });
                  }
                }}
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
            <p className={styles.proofEmptyState}>No invoices available for payment proof.</p>
          )}

          <div className={styles.proofField}>
            <span>Receipt File</span>
            <button
              type="button"
              className={zoneClass}
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedInvoice || scan.status === "scanning"}
            >
              <span className={styles.proofUploadIcon} aria-hidden="true">
                <i
                  className={
                    scan.status === "scanning"
                      ? "fa-solid fa-spinner fa-spin"
                      : scan.status === "valid"
                        ? "fa-solid fa-file-circle-check"
                        : scan.status === "invalid"
                          ? "fa-solid fa-file-circle-xmark"
                          : file
                            ? "fa-solid fa-file-circle-check"
                            : "fa-solid fa-cloud-arrow-up"
                  }
                />
              </span>
              <span className={styles.proofUploadTitle}>
                {scan.status === "scanning"
                  ? "Scanning receipt..."
                  : file
                    ? file.name
                    : "Click to upload receipt"}
              </span>
              <span className={styles.proofUploadHint}>
                {scan.status === "scanning"
                  ? "Checking for a Paynamics payment success proof"
                  : file
                    ? "Click to replace file"
                    : "PDF, PNG, or JPG · Max 5MB · Paynamics receipt only"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                className={styles.proofFileInput}
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
            </button>
            {scan.message ? (
              <p
                className={
                  scan.status === "valid"
                    ? styles.proofScanOk
                    : scan.status === "invalid"
                      ? styles.proofScanErr
                      : styles.proofScanInfo
                }
              >
                {scan.message}
              </p>
            ) : null}
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
          ) : scan.status === "scanning" ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Scanning receipt...
            </>
          ) : scan.status === "invalid" ? (
            <>
              <i className="fa-solid fa-ban" aria-hidden="true" /> Receipt not accepted
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

async function scanReceipt(invoiceId: string, receipt: File, scannedText?: string): Promise<PaynamicsProofScan> {
  const result = await scanPortalPaymentProof({ invoiceId, receipt, scannedText });
  return (result?.data ?? result) as PaynamicsProofScan;
}
