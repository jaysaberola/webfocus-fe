import styles from "@/styles/services.module.css";

export type ServiceTab = "hosting" | "webdesign" | "domains" | "dms";

type TabConfig = {
  id: ServiceTab;
  label: string;
  tone: "blue" | "violet" | "emerald" | "amber";
  icon: JSX.Element;
};

const TABS: TabConfig[] = [
  {
    id: "hosting",
    label: "Hosting",
    tone: "blue",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="2" y="3" width="20" height="7" rx="2" />
        <rect x="2" y="14" width="20" height="7" rx="2" />
      </svg>
    ),
  },
  {
    id: "webdesign",
    label: "Web Design",
    tone: "violet",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2.5" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    id: "domains",
    label: "Domains",
    tone: "emerald",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M2 12h20" />
      </svg>
    ),
  },
  {
    id: "dms",
    label: "DMS",
    tone: "amber",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
    ),
  },
];

const TONE_CLASS: Record<TabConfig["tone"], string> = {
  blue: styles.introTab_blue,
  violet: styles.introTab_violet,
  emerald: styles.introTab_emerald,
  amber: styles.introTab_amber,
};

type Props = {
  activeTab: ServiceTab;
  onTabChange: (tab: ServiceTab) => void;
};

export { TABS };

export default function ServicesIntro({ activeTab, onTabChange }: Props) {
  return (
    <header className={styles.intro}>
      <div className={styles.introAccent} aria-hidden="true" />
      <div className={styles.introGlow} aria-hidden="true" />

      <div className={styles.introBody}>
        <div className={styles.introCopy}>
          <div className={styles.introTitleRow}>
            <span className={styles.introBadge}>Service Catalogue</span>
            <h1 className={styles.introTitle}>Services</h1>
          </div>
          <p className={styles.introText}>Browse plans, add-ons, and pricing by category.</p>
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
                  className={[
                    styles.introTab,
                    TONE_CLASS[tab.tone],
                    isActive ? styles.introTabActive : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => onTabChange(tab.id)}
                >
                  <span className={styles.introTabIcon}>{tab.icon}</span>
                  <span className={styles.introTabLabel}>{tab.label}</span>
                  {isActive && <span className={styles.introTabIndicator} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
