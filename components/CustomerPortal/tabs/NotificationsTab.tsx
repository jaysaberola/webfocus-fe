import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  fetchPortalNotifications,
  markPortalNotificationRead,
  notifyPortalNotificationsUpdated,
} from "@/services/customerPortalService";
import type { PortalNotification } from "@/lib/customerPortal/types";
import styles from "@/styles/customerPortal.module.css";

const TYPE_LABEL: Record<string, string> = {
  provisioning: "Provisioning",
  payment: "Payment",
  billing: "Billing",
  general: "Advisory",
  maintenance: "Maintenance",
  support: "Support",
  renewal: "Renewal",
};

const TYPE_CLASS: Record<string, string> = {
  provisioning: styles.badgeBlue,
  payment: styles.badgeAmber,
  billing: styles.badgeAmber,
  general: styles.badgeGreen,
  maintenance: styles.badgeBlue,
  support: styles.badgeBlue,
  renewal: styles.badgeAmber,
};

export default function NotificationsTab() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = () =>
    fetchPortalNotifications().then(setNotifications);

  useEffect(() => {
    loadNotifications().finally(() => setLoading(false));
  }, []);

  const handleOpen = async (item: PortalNotification) => {
    if (item.unread) {
      setNotifications((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, unread: false } : row))
      );

      try {
        await markPortalNotificationRead(item.id);
        notifyPortalNotificationsUpdated();
      } catch {
        setNotifications((prev) =>
          prev.map((row) => (row.id === item.id ? { ...row, unread: true } : row))
        );
      }
    }

    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  if (loading) {
    return <div className={styles.loadingState}>Loading notifications...</div>;
  }

  return (
    <div className={styles.tabStack}>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>System Notifications &amp; Advisories</h2>
            <p className={styles.panelSub}>
              Real-time alerts regarding provisioning, billing, and service status updates.
            </p>
          </div>
        </div>

        <div className={styles.notifList}>
          {notifications.length === 0 ? (
            <p className={styles.panelSub}>No notifications yet.</p>
          ) : (
            notifications.map((item) => (
              <article
                key={item.id}
                className={[styles.notifCard, item.unread ? styles.notifUnread : ""].filter(Boolean).join(" ")}
                onClick={() => handleOpen(item)}
                onKeyDown={(e) => e.key === "Enter" && handleOpen(item)}
                role="button"
                tabIndex={0}
              >
                <div>
                  <div className={styles.notifHead}>
                    <div className={styles.notifTitleRow}>
                      <h3>{item.title}</h3>
                      {item.type ? (
                        <span className={TYPE_CLASS[item.type] ?? styles.badgeBlue}>
                          {TYPE_LABEL[item.type] ?? item.type}
                        </span>
                      ) : null}
                    </div>
                    <span className={styles.notifDate}>{item.date}</span>
                  </div>
                  <p>{item.desc}</p>
                  {item.actionUrl ? (
                    <Link
                      href={item.actionUrl}
                      className={styles.notifActionLink}
                      onClick={(event) => event.stopPropagation()}
                    >
                      Open related page
                    </Link>
                  ) : null}
                </div>
                {item.unread && <span className={styles.unreadDot} aria-label="Unread" />}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
