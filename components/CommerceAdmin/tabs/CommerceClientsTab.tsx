import Link from "next/link";
import { useEffect, useState } from "react";
import { getCustomers } from "@/services/commerceAdminService";
import type { CustomerRow } from "@/services/customerService";
import styles from "@/styles/commerceAdmin.module.css";

export default function CommerceClientsTab() {
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomers({ per_page: 50 }, { silent: true })
      .then((res) => setRows(Array.isArray(res?.data) ? res.data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Client Directory</h3>
          <p className={styles.panelSubtitle}>
            Registered customer accounts connected to the client portal (billing, orders, tickets).
          </p>
        </div>
        <div className={styles.toolbar}>
          <Link href="/customers/create" className={styles.primaryBtnSm}>
            Add Client
          </Link>
        </div>
      </div>

      {loading ? (
        <p className={styles.emptyState}>Loading clients...</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Client ID</th>
                <th>Name</th>
                <th>Business Email</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>No clients found.</td>
                </tr>
              ) : (
                rows.map((client) => (
                  <tr key={client.id}>
                    <td className={styles.monoCell}>CL-{client.id}</td>
                    <td>
                      <strong>{client.name}</strong>
                    </td>
                    <td>{client.email}</td>
                    <td className={client.status === "Active" ? styles.statusActive : styles.statusPending}>
                      {client.status}
                    </td>
                    <td>{client.date_registered ?? "—"}</td>
                    <td>
                      <div className={styles.tableActions}>
                        <Link href={`/customers/view/${client.id}`} className={styles.secondaryBtnSm}>
                          View
                        </Link>
                        <Link href={`/customers/edit/${client.id}`} className={styles.secondaryBtnSm}>
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
