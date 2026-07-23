import Link from "next/link";
import { useEffect, useState } from "react";
import { getSalesTransactions } from "@/services/commerceAdminService";
import type { SalesTransaction } from "@/services/salesTransactionService";
import { formatCommerceMoney } from "@/lib/commerceAdmin/mockData";
import styles from "@/styles/commerceAdmin.module.css";

export default function CommerceTransactionsTab() {
  const [rows, setRows] = useState<SalesTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSalesTransactions({ per_page: 50 }, { silent: true })
      .then((res) => setRows(res.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Transactions & Invoices</h3>
          <p className={styles.panelSubtitle}>
            Same sales records customers see as orders and billing in their portal.
          </p>
        </div>
        <div className={styles.toolbar}>
          <Link href="/sales-transactions" className={styles.primaryBtnSm}>
            Open Full Manager
          </Link>
        </div>
      </div>

      {loading ? (
        <p className={styles.emptyState}>Loading transactions...</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Order</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>No transactions found.</td>
                </tr>
              ) : (
                rows.map((txn) => (
                  <tr key={txn.id}>
                    <td className={styles.monoCell}>{txn.transaction_no}</td>
                    <td>
                      <strong>{txn.customer_name ?? "—"}</strong>
                      {txn.customer_email ? (
                        <div className={styles.panelSubtitle}>{txn.customer_email}</div>
                      ) : null}
                    </td>
                    <td className={styles.amountCell}>{formatCommerceMoney(Number(txn.grand_total))}</td>
                    <td>{txn.payment_status}</td>
                    <td>{txn.order_status}</td>
                    <td>{txn.transacted_at ? String(txn.transacted_at).slice(0, 10) : "—"}</td>
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
