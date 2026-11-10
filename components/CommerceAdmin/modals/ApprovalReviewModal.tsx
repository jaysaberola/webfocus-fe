import { useEffect, useState } from "react";
import {
  openCommercePaymentProofFile,
  type CommercePaymentProofRow,
} from "@/services/commerceAdminService";
import { axiosInstance } from "@/services/axios";
import { approvalIssuedDate } from "@/lib/commerceAdmin/approvalHelpers";
import { formatCommerceMoney } from "@/lib/commerceAdmin/mockData";
import { resolveStorageAssetUrl } from "@/lib/storageAssets";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";
type Props = {
  open: boolean;
  row: CommercePaymentProofRow | null;
  busy?: boolean;
  onClose: () => void;
  onApprove: (row: CommercePaymentProofRow) => void;
  onReject: (row: CommercePaymentProofRow) => void;
};

function isImageFileName(value?: string | null) {
  return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(String(value || ""));
}

function resolveApprovalImageUrl(value?: string | null, fallback?: string | null) {
  if (value && value !== "—") {
    return resolveStorageAssetUrl(value) || value;
  }
  return resolveStorageAssetUrl(fallback) || fallback || undefined;
}

function ApprovalPhoto({ src, label }: { src?: string; label: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={styles.approvalPhotoBox}>
        <span className={styles.approvalPhotoEmpty}>{src && failed ? "Unable to load photo" : "No photo"}</span>
      </div>
    );
  }

  return (
    <div className={styles.approvalPhotoBox}>
      <img
        src={src}
        alt={label}
        className={styles.approvalPhotoImage}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function ApprovalReviewModal({ open, row, busy, onClose, onApprove, onReject }: Props) {
  const [receiptBlobUrl, setReceiptBlobUrl] = useState<string | null>(null);
  const [receiptLoadError, setReceiptLoadError] = useState(false);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;

    setReceiptBlobUrl(null);
    setReceiptLoadError(false);

    if (!open || !row || row.kind === "profile_change") {
      return () => undefined;
    }

    void (async () => {
      try {
        const res = await axiosInstance.get(`/commerce-admin/payment-proofs/${row.id}/file`, {
          responseType: "blob",
          headers: { "X-No-Loading": true },
        });
        if (cancelled) return;
        const contentType = String(res.headers?.["content-type"] || "application/octet-stream");
        const blob = new Blob([res.data], { type: contentType });
        const objectUrl = URL.createObjectURL(blob);
        revoked = objectUrl;
        setReceiptBlobUrl(objectUrl);
      } catch {
        if (!cancelled) setReceiptLoadError(true);
      }
    })();

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [open, row]);

  if (!open || !row) return null;

  const isProfileChange = row.kind === "profile_change";
  const title = isProfileChange ? "Profile Change Review" : "Payment Proof Review";
  const changes = row.changes ?? [];
  const avatarChange = changes.find((change) => change.field === "avatar");
  const textChanges = changes.filter((change) => change.field !== "avatar");
  const currentPhotoUrl = resolveApprovalImageUrl(avatarChange?.from, row.currentAvatarUrl);
  const requestedPhotoUrl = resolveApprovalImageUrl(avatarChange?.to, row.fileUrl);
  const receiptUrl = receiptBlobUrl || resolveStorageAssetUrl(row.fileUrl);
  const receiptIsImage = isImageFileName(row.fileName) || isImageFileName(row.fileUrl);

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className={styles.modalCardWide}
        onClick={(event) => event.stopPropagation()}
        role="document"
      >
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>{title}</h3>
            <p className={styles.panelSubtitle}>
              {row.proofNo || row.invoiceId} · {row.client}
            </p>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className={styles.detailGrid}>
          <DetailField label="Reference" value={row.proofNo || row.invoiceId} />
          <DetailField label="Client" value={row.client} />
          <DetailField label="Email" value={row.email} />
          <DetailField label="Submitted" value={approvalIssuedDate(row)} />
          <DetailField label="Status" value={row.status || "Pending Review"} />
          {!isProfileChange ? (
            <DetailField
              label="Invoice"
              value={row.alreadyPaid || row.invoiceStatus === "Paid" ? "Paid via Paynamics" : row.invoiceStatus || "Unpaid"}
            />
          ) : null}
          {!isProfileChange ? (
            <DetailField label="Amount" value={formatCommerceMoney(Number(row.amount ?? 0))} />
          ) : null}
          <DetailField label="Summary" value={row.summary || row.plan} wide />
        </div>

        {isProfileChange ? (
          <>
            {avatarChange ? (
              <section className={styles.approvalCompareSection}>
                <h4 className={styles.approvalCompareTitle}>Profile Photo</h4>
                <div className={styles.approvalProfileCompare}>
                  <div className={styles.approvalProfileCompareCol}>
                    <span className={styles.detailLabel}>Current</span>
                    <ApprovalPhoto src={currentPhotoUrl} label="Current profile photo" />
                  </div>
                  <div className={styles.approvalProfileCompareArrow} aria-hidden="true">
                    <i className="fa-solid fa-arrow-right" />
                  </div>
                  <div className={styles.approvalProfileCompareCol}>
                    <span className={styles.detailLabel}>Requested</span>
                    <ApprovalPhoto src={requestedPhotoUrl} label="Requested profile photo" />
                  </div>
                </div>
              </section>
            ) : null}

            {textChanges.length ? (
              <section className={styles.approvalCompareSection}>
                <h4 className={styles.approvalCompareTitle}>Profile Details</h4>
                <div className={styles.approvalChangesTableWrap}>
                  <table className={styles.approvalChangesTable}>
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Current</th>
                        <th>Requested</th>
                      </tr>
                    </thead>
                    <tbody>
                      {textChanges.map((change) => (
                        <tr key={change.field}>
                          <td data-label="Field">{change.label}</td>
                          <td data-label="Current">{change.from || "—"}</td>
                          <td data-label="Requested">
                            <strong>{change.to || "—"}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {!changes.length ? (
              <p className={styles.emptyState}>{row.summary || "No detailed change breakdown available."}</p>
            ) : null}
          </>
        ) : (
          <section className={styles.approvalCompareSection}>
            <h4 className={styles.approvalCompareTitle}>Attached Receipt</h4>
            {receiptLoadError ? (
              <p className={styles.emptyState}>
                Attached file was not found on the server. Ask the customer to re-upload, or check `storage:link` /
                `storage/app/public` on cPanel.
              </p>
            ) : receiptUrl ? (
              receiptIsImage ? (
                <div className={styles.approvalReceiptPreview}>
                  <img src={receiptUrl} alt={row.fileName || "Payment receipt"} />
                </div>
              ) : (
                <div className={styles.approvalReceiptFile}>
                  <i className="fa-solid fa-file-lines" aria-hidden="true" />
                  <span>{row.fileName || "Receipt file"}</span>
                  <button
                    type="button"
                    className={styles.primaryBtnSm}
                    onClick={() => {
                      void openCommercePaymentProofFile(row.id).catch((err: any) => {
                        toast.error(err?.response?.data?.message || "Could not open attached file.");
                      });
                    }}
                  >
                    Open File
                  </button>
                </div>
              )
            ) : (
              <p className={styles.emptyState}>Loading receipt...</p>
            )}
          </section>
        )}

        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryBtnSm} onClick={onClose} disabled={busy}>
            Close
          </button>
          <button
            type="button"
            className={styles.secondaryBtnSm}
            disabled={busy}
            onClick={() => onReject(row)}
          >
            Reject
          </button>
          <button
            type="button"
            className={styles.primaryBtnSm}
            disabled={busy}
            onClick={() => onApprove(row)}
          >
            {isProfileChange ? "Approve Profile Change" : row.alreadyPaid ? "Confirm Receipt" : "Approve Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={wide ? styles.detailFieldWide : styles.detailField}>
      <span className={styles.detailLabel}>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}
