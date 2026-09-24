import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ConfirmModal from "@/components/UI/ConfirmModal";
import { COMMERCE_ADMIN_TABS } from "@/lib/commerceAdmin/mockData";
import { getCommerceDashboardCached, readCommerceDashboardCache } from "@/lib/commerceAdmin/dashboardCache";
import { useStaffUnreadCount } from "@/lib/commerceAdmin/useStaffUnreadCount";
import { canAccessCommerceTab } from "@/lib/navPermissions";
import { scheduleIdleTask } from "@/lib/publicAuthState";
import type { User } from "@/services/accountService";
import type { CommerceAdminTab } from "@/lib/commerceAdmin/types";
import { signOutAdminAndStayOnSite } from "@/lib/publicSignOut";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  activeTab: CommerceAdminTab;
  onTabChange: (tab: CommerceAdminTab) => void;
  user: User | null;
};

export default function CommerceAdminShell({ activeTab, onTabChange, user }: Props) {
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const unreadNotifications = useStaffUnreadCount(true);

  const visibleTabs = useMemo(
    () => COMMERCE_ADMIN_TABS.filter((tab) => canAccessCommerceTab(user, tab.id as CommerceAdminTab)),
    [user]
  );

  const activeItem = visibleTabs.find((tab) => tab.id === activeTab) ?? visibleTabs[0];
  const drawerBadgeTotal =
    (visibleTabs.some((tab) => tab.id === "approvals") ? pendingApprovals : 0) +
    (visibleTabs.some((tab) => tab.id === "notifications") ? unreadNotifications : 0);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const media = window.matchMedia("(min-width: 769px)");
    const onViewport = () => {
      if (media.matches) setMenuOpen(false);
    };

    document.addEventListener("keydown", onKey);
    media.addEventListener("change", onViewport);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      media.removeEventListener("change", onViewport);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const tabBadge = (tabId: string) => {
    if (tabId === "approvals") return pendingApprovals;
    if (tabId === "notifications") return unreadNotifications;
    return 0;
  };

  const selectTab = (tabId: CommerceAdminTab) => {
    onTabChange(tabId);
    setMenuOpen(false);
  };

  const requestLogout = () => {
    setMenuOpen(false);
    setLogoutOpen(true);
  };

  const drawer =
    mounted && menuOpen
      ? createPortal(
          <>
            <button
              type="button"
              className={styles.moduleDrawerOverlay}
              aria-label="Close module menu"
              onClick={() => setMenuOpen(false)}
            />
            <aside
              id="commerce-admin-modules"
              className={styles.moduleDrawer}
              aria-label="Commerce admin modules"
            >
              <div className={styles.moduleDrawerHead}>
                <div className={styles.moduleDrawerBrand}>
                  <span className={styles.moduleDrawerBrandIcon} aria-hidden="true">
                    <i className="fa-solid fa-layer-group" />
                  </span>
                  <div>
                    <p className={styles.moduleDrawerKicker}>WebFocus</p>
                    <p className={styles.moduleDrawerTitle}>Commerce Admin</p>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.moduleDrawerClose}
                  aria-label="Close module menu"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
              </div>
              <nav className={styles.moduleDrawerNav}>
                {visibleTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const badgeCount = tabBadge(tab.id);
                  const showBadge = "badge" in tab && tab.badge && badgeCount > 0;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={isActive ? styles.moduleDrawerBtnActive : styles.moduleDrawerBtn}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => selectTab(tab.id as CommerceAdminTab)}
                    >
                      <i className={tab.icon} aria-hidden="true" />
                      <span>{tab.label}</span>
                      {showBadge ? (
                        <span
                          className={styles.moduleDrawerBadge}
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
              <div className={styles.moduleDrawerFoot}>
                <button type="button" className={styles.moduleDrawerLogout} onClick={requestLogout}>
                  <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
                  Log out
                </button>
              </div>
            </aside>
          </>,
          document.body
        )
      : null;

  return (
    <div className={styles.moduleTabNavSticky}>
      <div className={styles.moduleMobileBar}>
        <button
          type="button"
          className={styles.moduleHamburger}
          aria-label="Open module menu"
          aria-expanded={menuOpen}
          aria-controls="commerce-admin-modules"
          onClick={() => setMenuOpen(true)}
        >
          <i className="fa-solid fa-bars" aria-hidden="true" />
          {drawerBadgeTotal > 0 ? <span className={styles.moduleHamburgerDot} aria-hidden="true" /> : null}
        </button>
        <div className={styles.moduleMobileCurrent}>
          {activeItem ? <i className={activeItem.icon} aria-hidden="true" /> : null}
          <span>{activeItem?.label ?? "Commerce Admin"}</span>
        </div>
      </div>

      <nav className={styles.moduleTabNav} aria-label="Commerce admin modules">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const badgeCount = tabBadge(tab.id);
          const showBadge = "badge" in tab && tab.badge && badgeCount > 0;
          return (
            <button
              key={tab.id}
              type="button"
              className={isActive ? styles.moduleTabBtnActive : styles.moduleTabBtn}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onTabChange(tab.id as CommerceAdminTab)}
            >
              <i className={tab.icon} aria-hidden="true" />
              <span className={styles.moduleTabLabelDesktop}>{tab.label}</span>
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
      {drawer}
      <ConfirmModal
        show={logoutOpen}
        title="Log out"
        message="Are you sure you want to log out?"
        danger={false}
        confirmLabel="Yes, log out"
        cancelLabel="Cancel"
        confirmVariant="primary"
        accentVariant="primary"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          signOutAdminAndStayOnSite();
        }}
      />
    </div>
  );
}
