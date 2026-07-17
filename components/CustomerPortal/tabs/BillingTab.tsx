import {
  formatPeso,
  PORTAL_BILLING_REMINDER,
  PORTAL_INVOICES,
  PORTAL_PAYMENT_PROOFS,
} from "@/lib/customerPortal/mockData";
import styles from "@/styles/customerPortal.module.css";

export default function BillingTab() {
  const reminder = PORTAL_BILLING_REMINDER;

  return (
    <div className={styles.tabStack}>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>Billing Invoices &amp; Receipts</h2>
            <p className={styles.panelSub}>
              Secure payment processing via GCash, Maya, and Corporate Bank Wire.
            </p>
          </div>
          <button type="button" className={styles.primaryBtnSm}>
            Add Funds
          </button>
        </div>

        <div className={styles.reminderBanner}>
          <div className={styles.reminderIcon}>!</div>
          <div>
            <h3 className={styles.reminderTitle}>Renewal Reminder: Invoice Due in 3 Days</h3>
            <p className={styles.reminderText}>
              Invoice <span className={styles.monoBlue}>{reminder.invoiceId}</span> ({reminder.title}) is due on{" "}
              {reminder.dueDate}. Please complete payment to avoid interruption.
            </p>
          </div>
          <button type="button" className={styles.amberBtn}>
            Pay &amp; Renew
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Service Name</th>
                <th>Plan</th>
                <th>Issued</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {PORTAL_INVOICES.map((inv) => (
                <tr key={inv.id}>
                  <td className={styles.monoBlue}>{inv.id}</td>
                  <td>{inv.items}</td>
                  <td>{inv.subscription}</td>
                  <td>{inv.date}</td>
                  <td>{inv.due}</td>
                  <td className={styles.monoBold}>{formatPeso(inv.amount)}</td>
                  <td>
                    <span className={inv.status === "Paid" ? styles.badgeGreen : styles.badgeAmber}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.sectionDivider}>
          <h3 className={styles.sectionTitle}>Payment Proofs &amp; Attached Receipts</h3>
          <div className={styles.proofList}>
            {PORTAL_PAYMENT_PROOFS.map((proof) => (
              <div key={proof.id} className={styles.proofCard}>
                <div>
                  <div className={styles.proofMeta}>
                    <span className={styles.monoBlue}>{proof.id}</span>
                    <span className={styles.chip}>Invoice: {proof.invoiceId}</span>
                    <span className={styles.badgeGreen}>{proof.status}</span>
                  </div>
                  <p className={styles.proofFile}>
                    <i className="fa-solid fa-paperclip" aria-hidden="true" /> {proof.fileName}
                    {proof.notes ? <span className={styles.muted}> ({proof.notes})</span> : null}
                  </p>
                  <p className={styles.proofDate}>Uploaded on {proof.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
