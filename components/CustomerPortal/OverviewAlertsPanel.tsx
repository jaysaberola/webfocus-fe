import Link from "next/link";
import type { PortalOverviewAlert } from "@/lib/customerPortal/types";
import styles from "@/styles/customerPortal.module.css";

const TONE_CLASS: Record<PortalOverviewAlert["tone"], string> = {
  provisioning: styles.alertProvisioning,
  payment: styles.alertPayment,
};

type OverviewAlertsPanelProps = {
  alerts: PortalOverviewAlert[];
};

function consolidateAlerts(alerts: PortalOverviewAlert[]): PortalOverviewAlert[] {
  const provisioning = alerts.filter((alert) => alert.tone === "provisioning");
  const payment = alerts.filter((alert) => alert.tone === "payment");
  const consolidated: PortalOverviewAlert[] = [];

  if (provisioning.length > 0) {
    const count = provisioning.length;
    const first = provisioning[0];

    consolidated.push({
      id: "alert-provisioning-summary",
      tone: "provisioning",
      title:
        count === 1 ? first.title : `Provisioning Alerts (${count})`,
      message:
        count === 1
          ? first.message
          : `You have ${count} services currently provisioning. We'll notify you when they're active.`,
      actionLabel: first.actionLabel || "View Alerts",
      actionHref: first.actionHref || "/public/dashboard?tab=notification",
      icon: "bell",
    });
  }

  if (payment.length > 0) {
    const count = payment.length;
    const first = payment[0];

    consolidated.push({
      id: "alert-payment-summary",
      tone: "payment",
      title: first.title || "Payment pending admin approval",
      message:
        count === 1
          ? first.message
          : `You have ${count} orders pending payment approval. Provisioning begins only after payment is complete.`,
      actionLabel: first.actionLabel || "View Orders",
      actionHref: first.actionHref || "/public/dashboard?tab=orders",
      icon: "card",
    });
  }

  return consolidated;
}

export default function OverviewAlertsPanel({ alerts }: OverviewAlertsPanelProps) {
  const visibleAlerts = consolidateAlerts(alerts);

  if (visibleAlerts.length === 0) return null;

  return (
    <div className={styles.alertStack}>
      {visibleAlerts.map((alert) => (
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
