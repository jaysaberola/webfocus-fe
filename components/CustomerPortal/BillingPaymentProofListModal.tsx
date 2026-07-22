import { resolveStorageAssetUrl } from "@/lib/storageAssets";
import type { PortalPaymentProof } from "@/lib/customerPortal/types";
import styles from "@/styles/customerPortal.module.css";

type BillingPaymentProofListModalProps = {
  open: boolean;
  invoiceId: string;
  invoiceLabel?: string;
  proofs: PortalPaymentProof[];
  onClose: () => void;
  onDelete: (proof: PortalPaymentProof) => void;
};

function proofStatusClass(status: string) {
  if (status === "Verified & Credited") return styles.badgeGreen;
  return styles.badgeAmber;
}

export default function BillingPaymentProofListModal({
  open,
  invoiceId,
  invoiceLabel,
  proofs,
  onClose,
  onDelete,
}: BillingPaymentProofListModalProps) {
  if (!open) return null;

  const handleViewFile = (proof: PortalPaymentProof) => {
    const url = resolveStorageAssetUrl(proof.fileUrl);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={styles.billingModalOverlay} role="presentation" onClick={onClose}>
      <div
        className={styles.billingModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="billing-proof-list-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.billingModalHead}>
          <div>
            <h3 id="billing-proof-list-title">Uploaded Receipts &amp; Verification Status</h3>
            <p className={styles.panelSub}>Payment proofs submitted for this invoice.</p>
          </div>
          <button type="button" className={styles.billingModalClose} aria-label="Close" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className={styles.billingModalSummary}>
          <p className={styles.billingModalLine}>
            <strong>Invoice:</strong> {invoiceLabel ?? invoiceId}
          </p>
        </div>

        {proofs.length === 0 ? (
          <p className={styles.proofEmptyState}>No payment proofs uploaded for this invoice yet.</p>
        ) : (
          <div className={styles.proofListModal}>
            {proofs.map((proof) => {
              const fileUrl = resolveStorageAssetUrl(proof.fileUrl);

              return (
                <article key={proof.id} className={styles.proofCardInline}>
                  <div className={styles.proofMeta}>
                    <span className={styles.monoBlue}>{proof.id}</span>
                    <span className={proofStatusClass(proof.status)}>{proof.status}</span>
                  </div>
                  <p className={styles.proofFile}>
                    <i className="fa-solid fa-paperclip" aria-hidden="true" /> {proof.fileName}
                    {proof.notes ? <span className={styles.muted}> ({proof.notes})</span> : null}
                  </p>
                  <p className={styles.proofDate}>Uploaded on {proof.date}</p>
                  <div className={styles.proofCardActions}>
                    {fileUrl ? (
                      <button
                        type="button"
                        className={styles.proofViewLink}
                        onClick={() => handleViewFile(proof)}
                      >
                        View File
                      </button>
                    ) : (
                      <span className={styles.muted}>File unavailable</span>
                    )}
                    {proof.status !== "Verified & Credited" ? (
                      <button type="button" className={styles.proofDeleteBtn} onClick={() => onDelete(proof)}>
                        Delete
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className={styles.billingModalActions}>
          <button type="button" className={styles.secondaryBtnSm} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
