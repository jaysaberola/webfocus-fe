import Link from "next/link";
import { COMMERCE_ADMIN_TABS, COMMERCE_APPROVALS } from "@/lib/commerceAdmin/mockData";
import type { CommerceAdminTab } from "@/lib/commerceAdmin/types";
import AdminPortalNav from "./AdminPortalNav";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  activeTab: CommerceAdminTab;
  onTabChange: (tab: CommerceAdminTab) => void;
  userName: string;
};

export default function CommerceAdminShell({ activeTab, onTabChange, userName }: Props) {
  const pendingApprovals = COMMERCE_APPROVALS.length;

  return (
    <>
      <AdminPortalNav active="commerce" />

      <nav className={styles.moduleTabNav} aria-label="Commerce admin modules">
        {COMMERCE_ADMIN_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const showBadge = "badge" in tab && tab.badge && pendingApprovals > 0;
          return (
            <button
              key={tab.id}
              type="button"
              className={isActive ? styles.moduleTabBtnActive : styles.moduleTabBtn}
              onClick={() => onTabChange(tab.id as CommerceAdminTab)}
            >
              <i className={tab.icon} aria-hidden="true" />
              {tab.label}
              {showBadge && <span className={styles.moduleTabBadge} aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      <div className={styles.operatorBar}>
        <div>
          <h2>{COMMERCE_ADMIN_TABS.find((tab) => tab.id === activeTab)?.label || "Dashboard"}</h2>
          <p>Welcome back, {userName} — Active Role: Super Admin</p>
        </div>
        <Link href="/public/home" className={styles.viewSiteLink}>
          View Public Site
        </Link>
      </div>
    </>
  );
}
