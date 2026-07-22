import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PortalTabLoader from "@/components/CustomerPortal/PortalTabLoader";
import {
  deletePortalNotification,
  fetchPortalNotifications,
  markAllPortalNotificationsRead,
  markPortalNotificationRead,
  notifyPortalNotificationsUpdated,
} from "@/services/customerPortalService";
import type { PortalNotification } from "@/lib/customerPortal/types";
import { toast } from "@/lib/toast";
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

const TYPE_FILTERS = [
  { value: "all", label: "All Categories" },
  { value: "billing", label: "Billing" },
  { value: "payment", label: "Payment" },
  { value: "provisioning", label: "Provisioning" },
  { value: "renewal", label: "Renewal" },
  { value: "support", label: "Support" },
  { value: "maintenance", label: "Maintenance" },
  { value: "general", label: "Advisory" },
];

export default function NotificationsTab() {
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread">("all");
  const [search, setSearch] = useState("");

  const loadNotifications = () =>
    fetchPortalNotifications().then(setNotifications);

  useEffect(() => {
    loadNotifications().finally(() => setLoading(false));
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((item) => {
      if (statusFilter === "unread" && !item.unread) return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;

      if (!query) return true;

      const haystack = [item.title, item.desc, item.type, TYPE_LABEL[item.type ?? ""]]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [notifications, statusFilter, typeFilter, search]);

  const markRead = async (item: PortalNotification) => {
    if (!item.unread) return;

    setBusyId(item.id);
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
      toast.error("Could not mark notification as read.");
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    setMarkingAll(true);
    setNotifications((prev) => prev.map((row) => ({ ...row, unread: false })));

    try {
      await markAllPortalNotificationsRead();
      notifyPortalNotificationsUpdated();
      toast.success("All notifications marked as read.");
    } catch {
      await loadNotifications();
      toast.error("Could not mark all notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDismiss = async (item: PortalNotification) => {
    if (!window.confirm("Dismiss this notification?")) return;

    setBusyId(item.id);

    try {
      await deletePortalNotification(item.id);
      setNotifications((prev) => prev.filter((row) => row.id !== item.id));
      notifyPortalNotificationsUpdated();
      toast.success("Notification dismissed.");
    } catch {
      toast.error("Could not dismiss notification.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <PortalTabLoader label="Loading notifications..." />;
  }

  return (
    <div className={styles.tabStack}>
      <section className={styles.panel}>
        <div className={styles.notifTopBar}>
          <div className={styles.notifTopBarTitle}>
            <h2 className={styles.panelTitle}>System Notifications &amp; Advisories</h2>
            {notifications.length > 0 ? (
              <span className={styles.notifSummaryInline}>
                {unreadCount > 0 ? (
                  <>
                    <strong>{unreadCount}</strong> unread of {notifications.length}
                  </>
                ) : (
                  <>All {notifications.length} read</>
                )}
              </span>
            ) : null}
          </div>

          {notifications.length > 0 ? (
            <div className={styles.portalToolbarInner}>
              <div className={styles.portalToolbarGroup}>
                <span className={styles.portalToolbarLabel}>Category</span>
                <select
                  className={styles.portalToolbarControl}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  aria-label="Filter notifications by category"
                >
                  {TYPE_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.portalToolbarGroup}>
                <span className={styles.portalToolbarLabel}>Status</span>
                <select
                  className={styles.portalToolbarControl}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "unread")}
                  aria-label="Filter notifications by read status"
                >
                  <option value="all">All Notifications</option>
                  <option value="unread">Unread Only</option>
                </select>
              </div>

              <div className={styles.portalToolbarGroup}>
                <span className={styles.portalToolbarLabel}>Search</span>
                <input
                  type="search"
                  className={`${styles.portalToolbarControl} ${styles.portalToolbarSearch}`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  aria-label="Search notifications"
                />
              </div>

              <div className={styles.portalToolbarGroup}>
                <button
                  type="button"
                  className={styles.secondaryBtnSm}
                  disabled={unreadCount === 0 || markingAll}
                  onClick={handleMarkAllRead}
                >
                  {markingAll ? "Marking..." : "Mark All as Read"}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.notifList}>
          {notifications.length === 0 ? (
            <p className={styles.panelSub}>No notifications yet.</p>
          ) : filteredNotifications.length === 0 ? (
            <p className={styles.panelSub}>No notifications match the selected filters.</p>
          ) : (
            filteredNotifications.map((item) => (
              <article
                key={item.id}
                className={[styles.notifCard, item.unread ? styles.notifUnread : ""].filter(Boolean).join(" ")}
              >
                <div className={styles.notifCardBody}>
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
                  <div className={styles.notifCardActions}>
                    {item.unread ? (
                      <button
                        type="button"
                        className={styles.notifActionBtn}
                        disabled={busyId === item.id}
                        onClick={() => markRead(item)}
                      >
                        Mark as Read
                      </button>
                    ) : null}
                    {item.actionUrl ? (
                      <Link href={item.actionUrl} className={styles.notifActionLink}>
                        Open Related Page
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      className={styles.notifDismissBtn}
                      disabled={busyId === item.id}
                      onClick={() => handleDismiss(item)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                {item.unread ? <span className={styles.unreadDot} aria-label="Unread" /> : null}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
