import { useEffect, useState } from "react";
import {
  fetchCommercePaymentProofs,
  rejectCommercePaymentProof,
  verifyCommercePaymentProof,
  type CommercePaymentProofRow,
} from "@/services/commerceAdminService";
import { formatCommerceMoney } from "@/lib/commerceAdmin/mockData";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";

export default function CommerceApprovalsTab() {
  const [rows, setRows] = useState<CommercePaymentProofRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetchCommercePaymentProofs("Pending Review")
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleVerify = async (row: CommercePaymentProofRow) => {
    try {
      setBusyId(row.id);
      await verifyCommercePaymentProof(row.id);
      toast.success(`Verified ${row.proofNo}. Customer billing updated.`);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to verify payment proof.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (row: CommercePaymentProofRow) => {
    const reason = window.prompt("Optional rejection note for the customer:");
    if (reason === null) return;

    try {
      setBusyId(row.id);
      await rejectCommercePaymentProof(row.id, reason || undefined);
      toast.success(`Rejected ${row.proofNo}. Customer notified.`);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reject payment proof.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Payment Proof Approvals</h3>
          <p className={styles.panelSubtitle}>
            Receipts uploaded from the customer billing tab. Verify to mark invoices paid and activate services.
          </p>
        </div>
      </div>

      {loading ? (
        <p className={styles.emptyState}>Loading approvals...</p>
      ) : rows.length === 0 ? (
        <p className={styles.emptyState}>No payment proofs pending review.</p>
      ) : (
        <div className={styles.approvalList}>
          {rows.map((row) => (
            <article key={row.id} className={styles.approvalCard}>
              <div className={styles.approvalCardTop}>
                <div>
                  <p className={styles.approvalClient}>{row.client}</p>
                  <p className={styles.approvalRequest}>
                    {row.proofNo} · {row.invoiceId}
                    {row.serviceName ? ` · ${row.serviceName}` : ""}
                  </p>
                  <p className={styles.panelSubtitle}>
                    {formatCommerceMoney(row.amount)} · Uploaded {row.submittedAt}
                  </p>
                </div>
                <span className={styles.statusPill}>{row.status}</span>
              </div>
              <p className={styles.approvalFile}>
                <i className="fa-solid fa-paperclip" aria-hidden="true" /> {row.fileName}
                {row.notes ? ` — ${row.notes}` : ""}
              </p>
              <div className={styles.approvalActions}>
                {row.fileUrl ? (
                  <a href={row.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.secondaryBtnSm}>
                    View Receipt
                  </a>
                ) : null}
                <button
                  type="button"
                  className={styles.primaryBtnSm}
                  disabled={busyId === row.id}
                  onClick={() => handleVerify(row)}
                >
                  Approve & Credit
                </button>
                <button
                  type="button"
                  className={styles.dangerBtnSm}
                  disabled={busyId === row.id}
                  onClick={() => handleReject(row)}
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
