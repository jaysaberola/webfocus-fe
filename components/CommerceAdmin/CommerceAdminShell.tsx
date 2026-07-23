import Link from "next/link";
import { useEffect, useState } from "react";
import { COMMERCE_ADMIN_TABS } from "@/lib/commerceAdmin/mockData";
import { fetchCommerceDashboard } from "@/services/commerceAdminService";
import type { CommerceAdminTab } from "@/lib/commerceAdmin/types";
import AdminPortalNav from "./AdminPortalNav";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  activeTab: CommerceAdminTab;
  onTabChange: (tab: CommerceAdminTab) => void;
  userName: string;
};

export default function CommerceAdminShell({ activeTab, onTabChange, userName }: Props) {
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    fetchCommerceDashboard()
      .then((data) => setPendingApprovals(data.counts.pendingApprovals))
      .catch(() => setPendingApprovals(0));
  }, [activeTab]);

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
              {showBadge ? (
                <span className={styles.moduleTabBadge} aria-label={`${pendingApprovals} pending`}>
                  {pendingApprovals > 9 ? "9+" : pendingApprovals}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className={styles.operatorBar}>
        <div>
          <h2 className={styles.panelTitle}>
            {COMMERCE_ADMIN_TABS.find((tab) => tab.id === activeTab)?.label || "Dashboard"}
          </h2>
          <p className={styles.panelSubtitle}>Welcome back, {userName} — Active Role: Super Admin</p>
        </div>
        <Link href="/public/home" className={styles.secondaryBtnSm}>
          View Public Site
        </Link>
      </div>
    </>
  );
}
