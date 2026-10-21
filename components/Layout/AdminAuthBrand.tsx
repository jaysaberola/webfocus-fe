import type { ReactNode } from "react";
import styles from "@/styles/adminAuth.module.css";

export function AdminAuthWordmark({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const webClass = variant === "dark" ? styles.wordmarkWeb : styles.wordmarkWebLight;
  const subClass = variant === "dark" ? styles.wordmarkSub : styles.wordmarkSubLight;

  return (
    <div className={styles.wordmark} aria-label="WebFocus Solutions, Inc.">
      <div className={styles.wordmarkMain}>
        <span className={webClass}>Web</span>
        <span className={styles.wordmarkFocus}>Focus</span>
      </div>
      <div className={subClass}>SOLUTIONS, INC.</div>
    </div>
  );
}

export function AdminAuthRadar() {
  return (
    <svg
      className={styles.radarSvg}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 600"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="300" cy="300" r="70" stroke="#FF5A1F" strokeOpacity="0.22" strokeWidth="1.5" />
      <circle cx="300" cy="300" r="130" stroke="#FF5A1F" strokeOpacity="0.22" strokeWidth="1.5" />
      <circle cx="300" cy="300" r="190" stroke="#FF5A1F" strokeOpacity="0.22" strokeWidth="1.5" />
      <circle cx="300" cy="300" r="250" stroke="#FF5A1F" strokeOpacity="0.22" strokeWidth="1.5" />
      <circle cx="300" cy="300" r="296" stroke="#FF5A1F" strokeOpacity="0.22" strokeWidth="1.5" />
      <path d="M300 0v120M300 480v120M0 300h120M480 300h120" stroke="#FF5A1F" strokeOpacity="0.22" strokeWidth="1.5" />
      <circle cx="300" cy="300" r="6" fill="#FF5A1F" fillOpacity="0.5" />
    </svg>
  );
}

function FeatureIcon({ children }: { children: ReactNode }) {
  return <div className={styles.featureIconBox}>{children}</div>;
}

const BRAND_FEATURES = [
  {
    label: "CMS modules for pages, banners, and news",
    icon: (
      <>
        <path d="M12 2 2 7l10 5 10-5-10-5Z" />
        <path d="m2 17 10 5 10-5" />
        <path d="m2 12 10 5 10-5" />
      </>
    ),
  },
  {
    label: "Commerce Control Center for clients and billing",
    icon: (
      <>
        <path d="M3 9l1.5-5h15L21 9" />
        <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
        <path d="M5 12v8h14v-8" />
        <path d="M10 20v-4h4v4" />
      </>
    ),
  },
  {
    label: "Role-based access for your staff",
    icon: (
      <>
        <path d="M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  },
] as const;

function BrandFeatureIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FF7A45"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function AdminAuthBrandHero() {
  return (
    <div className={styles.brandHero}>
      <div className={styles.brandHeroBackdrop} aria-hidden="true" />
      <div className={styles.brandHeroContent}>
        <header className={styles.brandHeroHeader}>
          <h1 className={styles.brandTitle}>Admin Portal</h1>
          <p className={styles.brandLead}>
            Manage your website content, commerce operations, and team access from one secure workspace.
          </p>
        </header>

        <ul className={styles.featureList}>
          {BRAND_FEATURES.map((feature) => (
            <li key={feature.label} className={styles.featureRow}>
              <FeatureIcon>
                <BrandFeatureIcon>{feature.icon}</BrandFeatureIcon>
              </FeatureIcon>
              <span className={styles.featureLabel}>{feature.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
