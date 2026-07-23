import { useEffect, useState } from "react";
import { fetchCommerceServices, type CommerceServiceAdminRow } from "@/services/commerceAdminService";
import styles from "@/styles/commerceAdmin.module.css";

export default function CommerceManagedTab() {
  const [rows, setRows] = useState<CommerceServiceAdminRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommerceServices()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Managed Services</h3>
          <p className={styles.panelSubtitle}>
            Live customer services provisioned from sales transactions — mirrored in the client portal Overview.
          </p>
        </div>
      </div>

      {loading ? (
        <p className={styles.emptyState}>Loading services...</p>
      ) : (
        <div className={styles.cardGrid}>
          {rows.length === 0 ? (
            <p className={styles.emptyState}>No managed services found.</p>
          ) : (
            rows.map((service) => (
              <article key={service.id} className={styles.managedCard}>
                <div className={styles.managedCardTop}>
                  <strong>{service.title}</strong>
                  <span className={service.status === "Active" ? styles.statusActive : styles.statusPending}>
                    {service.status}
                  </span>
                </div>
                <p className={styles.panelSubtitle}>{service.client}</p>
                <p className={styles.managedMeta}>
                  {service.plan ?? service.category ?? "Service"}
                  {service.transactionNo ? ` · ${service.transactionNo}` : ""}
                </p>
                {service.renewAt ? (
                  <p className={styles.managedRenew}>Renews {service.renewAt}</p>
                ) : null}
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}
