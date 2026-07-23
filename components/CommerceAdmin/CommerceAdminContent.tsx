import type { CommerceAdminTab } from "@/lib/commerceAdmin/types";
import CommerceDashboardTab from "./CommerceDashboardTab";
import CommerceClientsTab from "./tabs/CommerceClientsTab";
import CommerceTransactionsTab from "./tabs/CommerceTransactionsTab";
import CommerceApprovalsTab from "./tabs/CommerceApprovalsTab";
import CommerceManagedTab from "./tabs/CommerceManagedTab";
import CommerceHelpdeskTab from "./tabs/CommerceHelpdeskTab";
import CommerceCatalogTab from "./tabs/CommerceCatalogTab";
import {
  COMMERCE_CONTRACTS,
  COMMERCE_NOTIFICATIONS,
  COMMERCE_REPORTS,
  formatCommerceMoney,
} from "@/lib/commerceAdmin/mockData";
import styles from "@/styles/commerceAdmin.module.css";
import Link from "next/link";

type Props = {
  activeTab: CommerceAdminTab;
  onTabChange: (tab: CommerceAdminTab) => void;
};

function ContractsTab() {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Contracts & Renewals</h3>
          <p className={styles.panelSubtitle}>Renewal pipeline mirrored from managed customer services.</p>
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Contract</th>
              <th>Client</th>
              <th>Service</th>
              <th>Renews</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {COMMERCE_CONTRACTS.map((row) => (
              <tr key={row.id}>
                <td className={styles.monoCell}>{row.id}</td>
                <td>{row.client}</td>
                <td>{row.service}</td>
                <td>{row.renews}</td>
                <td className={styles.amountCell}>{formatCommerceMoney(row.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function UsersTab() {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Operator Accounts</h3>
          <p className={styles.panelSubtitle}>CMS staff users, roles, and access rights.</p>
        </div>
        <Link href="/users" className={styles.primaryBtnSm}>
          Manage Users
        </Link>
      </div>
      <p className={styles.emptyState}>
        Operator account management lives in CMS Users. Use the button above to invite admins and assign roles.
      </p>
    </section>
  );
}

function NotificationsTab() {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Outbound Notifications</h3>
          <p className={styles.panelSubtitle}>
            Customer portal notifications are generated automatically from billing, provisioning, and support events.
          </p>
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Audience</th>
              <th>Sent</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {COMMERCE_NOTIFICATIONS.map((row) => (
              <tr key={row.id}>
                <td>{row.title}</td>
                <td>{row.audience}</td>
                <td>{row.sentAt}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReportsTab() {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Reports</h3>
          <p className={styles.panelSubtitle}>Exportable commerce reports (coming soon).</p>
        </div>
      </div>
      <div className={styles.cardGrid}>
        {COMMERCE_REPORTS.map((report) => (
          <article key={report.id} className={styles.reportCard}>
            <strong>{report.title}</strong>
            <p className={styles.panelSubtitle}>{report.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function CommerceAdminContent({ activeTab, onTabChange }: Props) {
  switch (activeTab) {
    case "dashboard":
      return <CommerceDashboardTab onTabChange={onTabChange} />;
    case "clients":
      return <CommerceClientsTab />;
    case "transactions":
      return <CommerceTransactionsTab />;
    case "approvals":
      return <CommerceApprovalsTab />;
    case "managed":
      return <CommerceManagedTab />;
    case "contracts":
      return <ContractsTab />;
    case "catalog":
      return <CommerceCatalogTab />;
    case "users":
      return <UsersTab />;
    case "notifications":
      return <NotificationsTab />;
    case "helpdesk":
      return <CommerceHelpdeskTab />;
    case "reports":
      return <ReportsTab />;
    default:
      return <CommerceDashboardTab onTabChange={onTabChange} />;
  }
}
