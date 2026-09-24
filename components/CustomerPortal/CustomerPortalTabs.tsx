import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ConfirmModal from "@/components/UI/ConfirmModal";
import type { CustomerPortalTab } from "@/lib/customerPortal/types";
import { customerDisplayName } from "@/lib/customerPortal/mockData";
import { resolveAvatarUrl } from "@/lib/currentUser";
import { signOutCustomerAndStayOnSite } from "@/lib/publicSignOut";
import type { PublicCustomer } from "@/services/publicCustomerService";
import styles from "@/styles/customerPortal.module.css";

const TABS: Array<{ id: CustomerPortalTab; label: string; shortLabel: string; icon: string }> = [
  { id: "overview", label: "Overview", shortLabel: "Home", icon: "fa-solid fa-gauge-high" },
  { id: "billing", label: "Billing", shortLabel: "Bills", icon: "fa-solid fa-credit-card" },
  { id: "orders", label: "Orders", shortLabel: "Orders", icon: "fa-solid fa-bag-shopping" },
  { id: "contract", label: "Contract", shortLabel: "Docs", icon: "fa-solid fa-file-lines" },
  { id: "notification", label: "Notification", shortLabel: "Inbox", icon: "fa-solid fa-bell" },
  { id: "help", label: "Help & Communication", shortLabel: "Help", icon: "fa-solid fa-headset" },
  { id: "account", label: "Manage Account", shortLabel: "Account", icon: "fa-solid fa-gear" },
];

type Props = {
  activeTab: CustomerPortalTab;
  onTabChange: (tab: CustomerPortalTab) => void;
  unreadNotifications?: number;
  customer?: PublicCustomer | null;
};

export default function CustomerPortalTabs({
  activeTab,
  onTabChange,
  unreadNotifications = 0,
  customer = null,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const activeItem = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];
  const customerName = customerDisplayName(customer?.fname, customer?.lname);
  const customerInitial = (customerName.charAt(0) || "C").toUpperCase();
  const avatarUrl = resolveAvatarUrl(customer?.avatar);
  const showAvatar = Boolean(avatarUrl && !avatarFailed);

  useEffect(() => {
    setAvatarFailed(false);
  }, [customer?.avatar]);

  useEffect(() => {
    setMounted(true);
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

  const selectTab = (tabId: CustomerPortalTab) => {
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
              aria-label="Close portal menu"
              onClick={() => setMenuOpen(false)}
            />
            <aside
              id="customer-portal-sections"
              className={styles.moduleDrawer}
              aria-label="Customer portal sections"
            >
              <div className={styles.moduleDrawerHead}>
                <div className={styles.moduleDrawerBrand}>
                  <span className={styles.moduleDrawerAvatar} aria-hidden="true">
                    {showAvatar ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        onError={() => setAvatarFailed(true)}
                      />
                    ) : (
                      customerInitial
                    )}
                  </span>
                  <div>
                    <p className={styles.moduleDrawerKicker}>Customer Portal</p>
                    <p className={styles.moduleDrawerTitle}>{customerName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.moduleDrawerClose}
                  aria-label="Close portal menu"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
              </div>
              <nav className={styles.moduleDrawerNav}>
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const showBadge = tab.id === "notification" && unreadNotifications > 0;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={isActive ? styles.moduleDrawerBtnActive : styles.moduleDrawerBtn}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => selectTab(tab.id)}
                    >
                      <i className={tab.icon} aria-hidden="true" />
                      <span>{tab.label}</span>
                      {showBadge ? (
                        <span
                          className={styles.moduleDrawerBadge}
                          aria-label={`${unreadNotifications} unread`}
                        >
                          {unreadNotifications > 9 ? "9+" : unreadNotifications}
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
    <div className={styles.tabNavSticky}>
      <div className={styles.moduleMobileBar}>
        <button
          type="button"
          className={styles.moduleHamburger}
          aria-label="Open portal menu"
          aria-expanded={menuOpen}
          aria-controls="customer-portal-sections"
          onClick={() => setMenuOpen(true)}
        >
          <i className="fa-solid fa-bars" aria-hidden="true" />
          {unreadNotifications > 0 ? <span className={styles.moduleHamburgerDot} aria-hidden="true" /> : null}
        </button>
        <div className={styles.moduleMobileCurrent}>
          <i className={activeItem.icon} aria-hidden="true" />
          <span>{activeItem.label}</span>
        </div>
      </div>

      <nav className={styles.tabNav} aria-label="Customer portal sections">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={[styles.tabBtn, isActive ? styles.tabBtnActive : ""].filter(Boolean).join(" ")}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onTabChange(tab.id)}
            >
              <i className={tab.icon} aria-hidden="true" />
              <span className={styles.tabLabelDesktop}>{tab.label}</span>
              {tab.id === "notification" && unreadNotifications > 0 && (
                <span className={styles.tabBadge} aria-hidden="true" />
              )}
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
          signOutCustomerAndStayOnSite();
        }}
      />
    </div>
  );
}
