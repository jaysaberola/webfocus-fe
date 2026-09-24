import type { CustomerPortalTab } from "@/lib/customerPortal/types";
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
};

export default function CustomerPortalTabs({
  activeTab,
  onTabChange,
  unreadNotifications = 0,
}: Props) {
  return (
    <div className={styles.tabNavSticky}>
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
              <span className={styles.tabLabelMobile}>{tab.shortLabel}</span>
              {tab.id === "notification" && unreadNotifications > 0 && (
                <span className={styles.tabBadge} aria-hidden="true" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
