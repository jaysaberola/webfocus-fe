import Link from "next/link";
import { PORTAL_OVERVIEW_ALERTS } from "@/lib/customerPortal/mockData";
import type { PortalOverviewAlert } from "@/lib/customerPortal/types";
import styles from "@/styles/customerPortal.module.css";

const TONE_CLASS: Record<PortalOverviewAlert["tone"], string> = {
  provisioning: styles.alertProvisioning,
  payment: styles.alertPayment,
};

export default function OverviewAlertsPanel() {
  return (
    <div className={styles.alertStack}>
      {PORTAL_OVERVIEW_ALERTS.map((alert) => (
        <OverviewAlertBanner key={alert.id} alert={alert} />
      ))}
    </div>
  );
}

function OverviewAlertBanner({ alert }: { alert: PortalOverviewAlert }) {
  return (
    <article className={[styles.alertBanner, TONE_CLASS[alert.tone]].filter(Boolean).join(" ")}>
      <div className={styles.alertIconWrap}>
        {alert.icon === "bell" ? (
          <span className={styles.alertIconBell} aria-hidden="true">
            <i className="fa-solid fa-bell" />
          </span>
        ) : (
          <span className={styles.alertIconCard} aria-hidden="true">
            <i className="fa-solid fa-credit-card" />
          </span>
        )}
      </div>

      <div className={styles.alertCopy}>
        <h3 className={styles.alertTitle}>{alert.title}</h3>
        <p className={styles.alertMessage}>{alert.message}</p>
      </div>

      <Link href={alert.actionHref} className={styles.alertAction}>
        {alert.actionLabel}
      </Link>
    </article>
  );
}
