import Link from "next/link";
import styles from "@/styles/services.module.css";

export type ServiceTab = "hosting" | "webdesign" | "domains" | "dms";

type TabConfig = {
  id: ServiceTab;
  label: string;
  description: string;
  icon: "hosting" | "webdesign" | "domains" | "dms";
};

const TABS: TabConfig[] = [
  {
    id: "hosting",
    label: "Hosting",
    description: "Servers, SSL, and uptime",
    icon: "hosting",
  },
  {
    id: "webdesign",
    label: "Web Design",
    description: "Sites, templates, branding",
    icon: "webdesign",
  },
  {
    id: "domains",
    label: "Domains",
    description: "Registration and DNS",
    icon: "domains",
  },
  {
    id: "dms",
    label: "DMS",
    description: "Document management",
    icon: "dms",
  },
];

function TabIcon({ name }: { name: TabConfig["icon"] }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "hosting") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="6" rx="1.2" />
        <rect x="3" y="14" width="18" height="6" rx="1.2" />
        <path d="M7 7h.01M7 17h.01" />
        <path d="M11 7h6M11 17h6" />
      </svg>
    );
  }

  if (name === "webdesign") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="13" rx="1.5" />
        <path d="M8 21h8M12 17v4" />
        <path d="M7 8h10M7 11.5h6" />
      </svg>
    );
  }

  if (name === "domains") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.6 3.2 3.9 6.4 3.9 9S14.6 17.8 12 21c-2.6-3.2-3.9-6.4-3.9-9S9.4 6.2 12 3z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M4 7.2A1.2 1.2 0 0 1 5.2 6h4.1l1.7 1.8H18.8A1.2 1.2 0 0 1 20 9v8.8A1.2 1.2 0 0 1 18.8 19H5.2A1.2 1.2 0 0 1 4 17.8z" />
    </svg>
  );
}

type Props = {
  activeTab: ServiceTab;
  onTabChange: (tab: ServiceTab) => void;
  onTabPrefetch?: (tab: ServiceTab) => void;
};

export { TABS };

export default function ServicesIntro({ activeTab, onTabChange, onTabPrefetch }: Props) {
  return (
    <header className={styles.intro}>
      <div className={styles.introAccent} aria-hidden="true" />

      <div className={styles.introBody}>
        <div className={styles.introCopy}>
          <div className={styles.introTitleRow}>
            <span className={styles.introBadge}>Service Catalogue</span>
            <h1 className={styles.introTitle}>Services</h1>
            <p className={styles.introLead}>
              Choose a category to explore packages, pricing, and setup options.
            </p>
          </div>
          <Link href="/public/contact-us" className={styles.introQuoteBtn}>
            <span className={styles.introQuoteBtnLabel}>Get a Quote</span>
            <span className={styles.introQuoteBtnIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </span>
          </Link>
        </div>

        <nav className={styles.introTabsShell} aria-label="Service categories">
          <div className={styles.introTabs} role="tablist">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={[styles.introTab, isActive ? styles.introTabActive : styles.introTabIdle]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => onTabChange(tab.id)}
                  onPointerEnter={() => onTabPrefetch?.(tab.id)}
                  onFocus={() => onTabPrefetch?.(tab.id)}
                >
                  <span className={styles.introTabCard}>
                    <span className={styles.introTabIconWell} aria-hidden="true">
                      <span className={styles.introTabIcon}>
                        <TabIcon name={tab.icon} />
                      </span>
                    </span>
                    <span className={styles.introTabText}>
                      <span className={styles.introTabLabel}>{tab.label}</span>
                      <span className={styles.introTabHint}>{tab.description}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
