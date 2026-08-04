import { useEffect, useState } from "react";
import { getCustomer, type CustomerRow } from "@/services/customerService";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  open: boolean;
  client: CustomerRow | null;
  mode: "info" | "audit";
  onClose: () => void;
  onEdit?: (client: CustomerRow) => void;
};

function formatAuditSentence(audit: any) {
  const model = audit.auditable_type ?? "record";
  const auditId = audit.auditable_id ? `#${audit.auditable_id}` : "";
  const date = audit.created_at ? new Date(audit.created_at).toLocaleString() : "unknown time";

  switch (audit.event) {
    case "created":
      return `Created a new ${model} ${auditId} on ${date}.`;
    case "updated":
      return `Updated ${model} ${auditId} on ${date}.`;
    case "deleted":
      return `Deleted ${model} ${auditId} on ${date}.`;
    case "restored":
      return `Restored ${model} ${auditId} on ${date}.`;
    default:
      return `Performed "${audit.event}" on ${model} ${auditId} on ${date}.`;
  }
}

export default function ClientDetailModal({ open, client, mode, onClose, onEdit }: Props) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !client?.id) return;
    setLoading(true);
    getCustomer(client.id, { silent: true })
      .then((data) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [open, client?.id]);

  if (!open || !client) return null;

  const title =
    mode === "audit"
      ? `Audit Trail · ${client.name}`
      : `Client Account · ${client.name}`;

  const audits = detail?.audits ?? [];

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
              CL-{client.id} · {client.email} · Joined {client.date_registered ?? "—"}
            </p>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <p className={styles.emptyState}>Loading client details...</p>
        ) : mode === "audit" ? (
          audits.length === 0 ? (
            <p className={styles.emptyState}>No audit records found for this client.</p>
          ) : (
            <ul className={styles.auditList}>
              {audits.map((audit: any) => (
                <li key={audit.id}>{formatAuditSentence(audit)}</li>
              ))}
            </ul>
          )
        ) : (
          <div className={styles.clientInfoGrid}>
            <div>
              <span className={styles.txGridLabel}>Company / Organization</span>
              <div className={styles.txGridValue}>{detail?.company ?? client.company ?? client.name}</div>
            </div>
            <div>
              <span className={styles.txGridLabel}>Customer Name</span>
              <div className={styles.txGridValue}>
                {[detail?.fname, detail?.lname].filter(Boolean).join(" ") || client.name}
              </div>
            </div>
            <div>
              <span className={styles.txGridLabel}>Business Email</span>
              <div className={styles.txGridValue}>{detail?.email ?? client.email}</div>
            </div>
            <div>
              <span className={styles.txGridLabel}>Business Address</span>
              <div className={styles.txGridValue}>{detail?.address_street ?? "—"}</div>
            </div>
            <div>
              <span className={styles.txGridLabel}>Mobile Number</span>
              <div className={styles.txGridValue}>{detail?.mobile ?? "—"}</div>
            </div>
            <div>
              <span className={styles.txGridLabel}>Phone Number</span>
              <div className={styles.txGridValue}>{detail?.phone ?? "—"}</div>
            </div>
            <div>
              <span className={styles.txGridLabel}>Status</span>
              <div className={styles.txGridValue}>{client.status ?? "—"}</div>
            </div>
            <div>
              <span className={styles.txGridLabel}>Date Registered</span>
              <div className={styles.txGridValue}>{client.date_registered ?? "—"}</div>
            </div>
          </div>
        )}

        <div className={styles.modalActions}>
          {mode === "info" && onEdit ? (
            <button type="button" className={styles.secondaryBtnSm} onClick={() => onEdit(client)}>
              Edit Customer Account
            </button>
          ) : null}
          <button type="button" className={styles.primaryBtnSm} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
