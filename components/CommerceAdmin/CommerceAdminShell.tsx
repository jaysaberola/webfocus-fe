import { useEffect, useMemo, useState } from "react";
import { COMMERCE_ADMIN_TABS } from "@/lib/commerceAdmin/mockData";
import { getCommerceDashboardCached, readCommerceDashboardCache } from "@/lib/commerceAdmin/dashboardCache";
import { canAccessCommerceTab } from "@/lib/navPermissions";
import type { User } from "@/services/accountService";
import type { CommerceAdminTab } from "@/lib/commerceAdmin/types";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  activeTab: CommerceAdminTab;
  onTabChange: (tab: CommerceAdminTab) => void;
  user: User | null;
};

export default function CommerceAdminShell({ activeTab, onTabChange, user }: Props) {
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [pendingQuotations, setPendingQuotations] = useState(0);

  const visibleTabs = useMemo(
    () => COMMERCE_ADMIN_TABS.filter((tab) => canAccessCommerceTab(user, tab.id as CommerceAdminTab)),
    [user]
  );

  useEffect(() => {
    let alive = true;
    const cached = readCommerceDashboardCache();
    if (cached) {
      setPendingApprovals(cached.counts.pendingApprovals);
      setPendingQuotations(cached.counts.pendingQuotations ?? 0);
    }

    getCommerceDashboardCached()
      .then((data) => {
        if (!alive) return;
        setPendingApprovals(data.counts.pendingApprovals);
        setPendingQuotations(data.counts.pendingQuotations ?? 0);
      })
      .catch(() => {
        if (!alive) return;
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <nav className={styles.moduleTabNav} aria-label="Commerce admin modules">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const badgeCount =
            tab.id === "approvals"
              ? pendingApprovals
              : tab.id === "notifications"
                ? pendingQuotations
                : 0;
          const showBadge = "badge" in tab && tab.badge && badgeCount > 0;
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
                <span className={styles.moduleTabBadge} aria-label={`${badgeCount} pending`}>
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </>
  );
}
