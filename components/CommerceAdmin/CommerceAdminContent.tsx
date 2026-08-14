import dynamic from "next/dynamic";
import type { CommerceAdminTab } from "@/lib/commerceAdmin/types";
import styles from "@/styles/commerceAdmin.module.css";
import { COMMERCE_REPORTS } from "@/lib/commerceAdmin/mockData";

const CommerceDashboardTab = dynamic(() => import("./CommerceDashboardTab"));
const CommerceClientsTab = dynamic(() => import("./tabs/CommerceClientsTab"));
const CommerceTransactionsTab = dynamic(() => import("./tabs/CommerceTransactionsTab"));
const CommerceApprovalsTab = dynamic(() => import("./tabs/CommerceApprovalsTab"));
const CommerceNotificationsTab = dynamic(() => import("./tabs/CommerceNotificationsTab"));
const CommerceHelpdeskTab = dynamic(() => import("./tabs/CommerceHelpdeskTab"));

type Props = {
  activeTab: CommerceAdminTab;
  onTabChange: (tab: CommerceAdminTab) => void;
};

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
      return <CommerceClientsTab onTabChange={onTabChange} />;
    case "orders":
      return <CommerceTransactionsTab />;
    case "approvals":
      return <CommerceApprovalsTab />;
    case "notifications":
      return <CommerceNotificationsTab onOpenOrders={() => onTabChange("orders")} onTabChange={onTabChange} />;
    case "helpdesk":
      return <CommerceHelpdeskTab />;
    case "reports":
      return <ReportsTab />;
    case "contracts":
    default:
      return <CommerceDashboardTab onTabChange={onTabChange} />;
  }
}
