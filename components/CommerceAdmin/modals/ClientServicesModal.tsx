import { useEffect, useState } from "react";
import { fetchCommerceServices, type CommerceServiceAdminRow } from "@/services/commerceAdminService";
import type { CustomerRow } from "@/services/customerService";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  open: boolean;
  client: CustomerRow | null;
  onClose: () => void;
};

export default function ClientServicesModal({ open, client, onClose }: Props) {
  const [rows, setRows] = useState<CommerceServiceAdminRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !client?.id) return;
    setLoading(true);
    fetchCommerceServices("Active", client.id)
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [open, client?.id]);

  if (!open || !client) return null;

  const count = rows.length;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className={styles.modalCardWide}
        onClick={(event) => event.stopPropagation()}
        role="document"
      >
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>
              {client.name} (CL-{client.id})
            </h3>
            <p className={styles.panelSubtitle}>
              Joined: {client.date_registered ?? "—"} · Status: {client.status ?? "—"} · {count} active service
              {count === 1 ? "" : "s"}
            </p>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <p className={styles.emptyState}>Loading active services...</p>
        ) : rows.length === 0 ? (
          <p className={styles.emptyState}>No active services found for this client.</p>
        ) : (
          <div className={styles.clientServiceList}>
            {rows.map((service) => (
              <div key={service.id} className={styles.clientServiceItem}>
                <div>
                  <strong>{service.title}</strong>
                  {service.plan ? <div className={styles.panelSubtitle}>{service.plan}</div> : null}
                  {service.category ? (
                    <div className={styles.panelSubtitle}>{service.category}</div>
                  ) : null}
                </div>
                <span className={styles.badgePaid}>{service.status || "Active"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
