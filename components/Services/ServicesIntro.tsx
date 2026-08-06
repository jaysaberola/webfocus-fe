import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "@/styles/services.module.css";

export type ServiceTab = "hosting" | "webdesign" | "domains" | "dms";

type TabConfig = {
  id: ServiceTab;
  label: string;
  tone: "blue" | "violet" | "emerald" | "amber";
  iconSrc: string;
};

const TABS: TabConfig[] = [
  {
    id: "hosting",
    label: "Hosting",
    tone: "blue",
    iconSrc: "/images/service-icons/hosting.png",
  },
  {
    id: "webdesign",
    label: "Web Design",
    tone: "violet",
    iconSrc: "/images/service-icons/webdesign.png",
  },
  {
    id: "domains",
    label: "Domains",
    tone: "emerald",
    iconSrc: "/images/service-icons/domains.png",
  },
  {
    id: "dms",
    label: "DMS",
    tone: "amber",
    iconSrc: "/images/service-icons/dms.png",
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
  onTabPrefetch?: (tab: ServiceTab) => void;
};

export { TABS };

export default function ServicesIntro({ activeTab, onTabChange, onTabPrefetch }: Props) {
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setAnimKey((key) => key + 1);
  }, [activeTab]);

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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
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
                  className={[
                    styles.introTab,
                    TONE_CLASS[tab.tone],
                    isActive ? styles.introTabActive : styles.introTabIdle,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => onTabChange(tab.id)}
                  onPointerEnter={() => onTabPrefetch?.(tab.id)}
                  onFocus={() => onTabPrefetch?.(tab.id)}
                >
                  <span
                    key={isActive ? `active-${animKey}` : `idle-${tab.id}`}
                    className={styles.introTabCard}
                  >
                    <span className={styles.introTabIconWell} aria-hidden="true">
                      <span className={styles.introTabIcon}>
                        <Image
                          src={tab.iconSrc}
                          alt=""
                          width={52}
                          height={52}
                          className={styles.introTabIconImg}
                          draggable={false}
                          priority={isActive}
                        />
                      </span>
                    </span>
                    <span className={styles.introTabLabel}>{tab.label}</span>
                    <span className={styles.introTabIndicator} aria-hidden="true" />
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
