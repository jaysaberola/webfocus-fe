import { useEffect, useMemo, useState } from "react";
import { COMMERCE_ADMIN_TABS } from "@/lib/commerceAdmin/mockData";
import { getCommerceDashboardCached, readCommerceDashboardCache } from "@/lib/commerceAdmin/dashboardCache";
import { useStaffUnreadCount } from "@/lib/commerceAdmin/useStaffUnreadCount";
import { canAccessCommerceTab } from "@/lib/navPermissions";
import { scheduleIdleTask } from "@/lib/publicAuthState";
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
  const unreadNotifications = useStaffUnreadCount(true);

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
    <div className={styles.moduleTabNavSticky}>
      <nav className={styles.moduleTabNav} aria-label="Commerce admin modules">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const badgeCount =
            tab.id === "approvals" ? pendingApprovals : tab.id === "notifications" ? unreadNotifications : 0;
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
                <span
                  className={styles.moduleTabBadge}
                  aria-label={
                    tab.id === "approvals" ? `${badgeCount} pending` : `${badgeCount} unread`
                  }
                >
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
