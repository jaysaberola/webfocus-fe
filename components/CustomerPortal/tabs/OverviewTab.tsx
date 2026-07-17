import { PORTAL_OVERVIEW_STATS } from "@/lib/customerPortal/mockData";
import OverviewAlertsPanel from "@/components/CustomerPortal/OverviewAlertsPanel";
import ServiceStatusPanel from "@/components/CustomerPortal/ServiceStatusPanel";
import styles from "@/styles/customerPortal.module.css";

export default function OverviewTab() {
  const stats = PORTAL_OVERVIEW_STATS;

  return (
    <div className={styles.tabStack}>
      <div className={styles.statGrid}>
        <article className={styles.statCard}>
          <span className={styles.statLabel}>Active Nodes</span>
          <strong className={styles.statValue}>{stats.activeNodes}</strong>
          <p className={styles.statMetaGreen}>{stats.activeNodesDetail}</p>
        </article>
        <article className={styles.statCard}>
          <span className={styles.statLabel}>Unpaid Invoices</span>
          <strong className={styles.statValue}>{stats.unpaidInvoices}</strong>
          <p className={styles.statMetaAmber}>{stats.unpaidInvoicesDetail}</p>
        </article>
        <article className={styles.statCard}>
          <span className={styles.statLabel}>Support Tickets</span>
          <strong className={styles.statValue}>{stats.supportTickets}</strong>
          <p className={styles.statMetaBlue}>{stats.supportTicketsDetail}</p>
        </article>
        <article className={styles.statCard}>
          <span className={styles.statLabel}>SLA Uptime</span>
          <strong className={`${styles.statValue} ${styles.statValueGreen}`}>{stats.slaUptime}</strong>
          <p className={styles.statMetaMuted}>{stats.slaUptimeDetail}</p>
        </article>
      </div>

      <OverviewAlertsPanel />
      <ServiceStatusPanel />
    </div>
  );
}
