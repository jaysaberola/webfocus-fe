import Link from "next/link";
import { formatPeso, PORTAL_ORDERS } from "@/lib/customerPortal/mockData";
import styles from "@/styles/customerPortal.module.css";

export default function OrdersTab() {
  return (
    <div className={styles.tabStack}>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>Active Service Subscriptions &amp; Domains</h2>
            <p className={styles.panelSub}>Manage node configurations, SSL certs, and DNS records.</p>
          </div>
          <Link href="/public/services" className={styles.secondaryBtnSm}>
            Order New
          </Link>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Service Name</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Date Ordered</th>
                <th>Expired Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {PORTAL_ORDERS.map((order) => {
                const item = order.items[0];
                const pending = order.status === "Pending Request";
                return (
                  <tr key={order.id}>
                    <td className={styles.monoBlue}>{order.id}</td>
                    <td>{item?.name}</td>
                    <td>{item?.detail}</td>
                    <td className={styles.monoBold}>{formatPeso(order.total)}</td>
                    <td>{order.gateway}</td>
                    <td>{order.date}</td>
                    <td>{order.expiredDate}</td>
                    <td>
                      <span className={pending ? styles.badgeAmber : styles.badgeGreen}>
                        {pending ? "Pending Request" : "Active Live"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
