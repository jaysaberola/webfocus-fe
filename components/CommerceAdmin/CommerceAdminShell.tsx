import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { COMMERCE_ADMIN_TABS } from "@/lib/commerceAdmin/mockData";
import { getCommerceDashboardCached, readCommerceDashboardCache } from "@/lib/commerceAdmin/dashboardCache";
import { canAccessCommerceTab } from "@/lib/navPermissions";
import { scheduleIdleTask } from "@/lib/publicAuthState";
import type { User } from "@/services/accountService";
import type { CommerceAdminTab } from "@/lib/commerceAdmin/types";
import AdminPortalNav from "./AdminPortalNav";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  activeTab: CommerceAdminTab;
  onTabChange: (tab: CommerceAdminTab) => void;
  userName: string;
  roleLabel: string;
  user: User | null;
};

export default function CommerceAdminShell({ activeTab, onTabChange, userName, roleLabel, user }: Props) {
  const [pendingApprovals, setPendingApprovals] = useState(0);

  const visibleTabs = useMemo(
    () => COMMERCE_ADMIN_TABS.filter((tab) => canAccessCommerceTab(user, tab.id as CommerceAdminTab)),
    [user]
  );

  useEffect(() => {
    let alive = true;
    const cached = readCommerceDashboardCache();
    if (cached) {
      setPendingApprovals(cached.counts.pendingApprovals);
    }

    const cancel = scheduleIdleTask(() => {
      getCommerceDashboardCached()
        .then((data) => {
          if (!alive) return;
          setPendingApprovals(data.counts.pendingApprovals);
        })
        .catch(() => {
          if (!alive) return;
          setPendingApprovals(0);
        });
    }, 500);

    return () => {
      alive = false;
      cancel();
    };
  }, []);

  return (
    <>
      <AdminPortalNav active="commerce" />

      <nav className={styles.moduleTabNav} aria-label="Commerce admin modules">
        {visibleTabs.map((tab) => {
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
            {visibleTabs.find((tab) => tab.id === activeTab)?.label || visibleTabs[0]?.label || "Dashboard"}
          </h2>
          <p className={styles.panelSubtitle}>Welcome back, {userName} — Active Role: {roleLabel}</p>
        </div>
        <Link href="/public/home" className={styles.secondaryBtnSm}>
          View Public Site
        </Link>
      </div>
    </>
  );
}
