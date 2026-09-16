import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteCommerceNotification,
  fetchCommerceNotifications,
  markAllCommerceNotificationsRead,
  markCommerceNotificationRead,
  type CommerceNotificationAdminRow,
} from "@/services/commerceAdminService";
import type { CommerceAdminTab } from "@/lib/commerceAdmin/types";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  onOpenOrders?: () => void;
  onTabChange?: (tab: CommerceAdminTab) => void;
};

const PAGE_SIZE = 15;

const KIND_LABEL: Record<string, string> = {
  payment_proof: "Billing",
  profile_change: "Account",
  support_ticket: "Support",
  web_design_quotation: "Quotations",
  broadcast: "Advisory",
  general: "Advisory",
};

const KIND_FILTERS = [
  { value: "all", label: "All Categories" },
  { value: "payment_proof", label: "Billing" },
  { value: "profile_change", label: "Account" },
  { value: "support_ticket", label: "Support" },
  { value: "web_design_quotation", label: "Quotations" },
  { value: "general", label: "Advisory" },
];

function rowKey(row: CommerceNotificationAdminRow) {
  return `${row.kind ?? "alert"}-${row.id}`;
}

function isManageable(row: CommerceNotificationAdminRow) {
  return row.manageable !== false;
}

function senderLabel(row: CommerceNotificationAdminRow) {
  return KIND_LABEL[row.kind ?? ""] || row.kind || "WebFocus";
}

function formatInboxDate(row: CommerceNotificationAdminRow) {
  const raw = String(row.createdAt || row.date || "").trim();
  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) return row.date || "";

  const date = new Date(parsed);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function alertActionTab(row: CommerceNotificationAdminRow): CommerceAdminTab {
  const url = String(row.actionUrl ?? "");
  if (url.includes("tab=approvals") || row.kind === "payment_proof" || row.kind === "profile_change") {
    return "approvals";
  }
  if (url.includes("tab=helpdesk") || row.kind === "support_ticket") {
    return "helpdesk";
  }
  return "orders";
}

export default function CommerceNotificationsTab({ onOpenOrders, onTabChange }: Props) {
  const [notifications, setNotifications] = useState<CommerceNotificationAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const loadRows = useCallback(async () => {
    try {
      const data = await fetchCommerceNotifications();
      setNotifications(Array.isArray(data.clientAlerts) ? data.clientAlerts : []);
    } catch {
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    loadRows().finally(() => setLoading(false));
  }, [loadRows]);

  useEffect(() => {
    setPage(1);
    setSelectedKeys([]);
  }, [typeFilter, statusFilter, search]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.unread !== false).length,
    [notifications],
  );
  const unreadManageableCount = useMemo(
    () => notifications.filter((item) => item.unread !== false && isManageable(item)).length,
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((item) => {
      if (statusFilter === "unread" && item.unread === false) return false;
      if (typeFilter !== "all") {
        const kind = item.kind ?? "general";
        if (typeFilter === "general") {
          if (kind !== "general" && kind !== "broadcast") return false;
        } else if (kind !== typeFilter) {
          return false;
        }
      }
      if (!query) return true;

      const haystack = [
        item.title,
        item.desc,
        item.kind,
        KIND_LABEL[item.kind ?? ""],
        item.audience,
        item.email,
        item.transactionNo,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [notifications, statusFilter, typeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE));
  const paginatedNotifications = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredNotifications.slice(start, start + PAGE_SIZE);
  }, [filteredNotifications, page]);

  const rangeStart = filteredNotifications.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filteredNotifications.length);
  const pageKeys = paginatedNotifications.map(rowKey);
  const allPageSelected = pageKeys.length > 0 && pageKeys.every((key) => selectedKeys.includes(key));
  const somePageSelected = pageKeys.some((key) => selectedKeys.includes(key));
  const selectedCount = selectedKeys.length;
  const selectedManageable = notifications.filter(
    (item) => selectedKeys.includes(rowKey(item)) && isManageable(item),
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const toggleSelected = (key: string) => {
    setSelectedKeys((current) =>
      current.includes(key) ? current.filter((rowId) => rowId !== key) : [...current, key],
    );
  };

  const toggleSelectAll = () => {
    setSelectedKeys((current) => {
      if (allPageSelected) return current.filter((key) => !pageKeys.includes(key));
      return [...new Set([...current, ...pageKeys])];
    });
  };

  const openAlert = (row: CommerceNotificationAdminRow) => {
    const tab = alertActionTab(row);
    if (onTabChange) {
      onTabChange(tab);
      return;
    }
    if (tab === "orders" && onOpenOrders) onOpenOrders();
  };

  const markRead = async (item: CommerceNotificationAdminRow) => {
    if (item.unread === false || !isManageable(item)) return;

    const key = rowKey(item);
    setBusyKey(key);
    setNotifications((prev) =>
      prev.map((row) => (rowKey(row) === key ? { ...row, unread: false } : row)),
    );

    try {
      await markCommerceNotificationRead(item.id);
    } catch {
      setNotifications((prev) =>
        prev.map((row) => (rowKey(row) === key ? { ...row, unread: true } : row)),
      );
      toast.error("Could not mark notification as read.");
    } finally {
      setBusyKey(null);
    }
  };

  const openNotification = async (item: CommerceNotificationAdminRow) => {
    if (item.unread !== false && isManageable(item)) await markRead(item);
    openAlert(item);
  };

  const handleMarkAllRead = async () => {
    const unreadManageable = notifications.filter((item) => item.unread !== false && isManageable(item));
    if (unreadManageable.length === 0) return;

    setMarkingAll(true);
    setNotifications((prev) =>
      prev.map((row) => (isManageable(row) ? { ...row, unread: false } : row)),
    );

    try {
      await markAllCommerceNotificationsRead();
      toast.success("All notifications marked as read.");
    } catch {
      await loadRows();
      toast.error("Could not mark all notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkSelectedRead = async () => {
    const unreadSelected = selectedManageable.filter((item) => item.unread !== false);
    if (unreadSelected.length === 0) return;

    setMarkingAll(true);
    const keys = unreadSelected.map(rowKey);
    setNotifications((prev) =>
      prev.map((row) => (keys.includes(rowKey(row)) ? { ...row, unread: false } : row)),
    );

    try {
      await Promise.all(unreadSelected.map((item) => markCommerceNotificationRead(item.id)));
    } catch {
      await loadRows();
      toast.error("Could not mark selected notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDismiss = async (item: CommerceNotificationAdminRow) => {
    if (!isManageable(item)) return;

    const key = rowKey(item);
    setBusyKey(key);

    try {
      await deleteCommerceNotification(item.id);
      setNotifications((prev) => prev.filter((row) => rowKey(row) !== key));
      setSelectedKeys((current) => current.filter((id) => id !== key));
    } catch {
      toast.error("Could not dismiss notification.");
    } finally {
      setBusyKey(null);
    }
  };

  const handleDismissSelected = async () => {
    if (selectedManageable.length === 0) return;
    const ids = selectedManageable.map((item) => item.id);
    const keys = selectedManageable.map(rowKey);
    setMarkingAll(true);

    try {
      await Promise.all(ids.map((id) => deleteCommerceNotification(id)));
      setNotifications((prev) => prev.filter((row) => !keys.includes(rowKey(row))));
      setSelectedKeys((current) => current.filter((key) => !keys.includes(key)));
    } catch {
      await loadRows();
      toast.error("Could not dismiss selected notifications.");
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading) {
    return (
      <section className={`${styles.panel} ${styles.inboxPanel}`}>
        <p className={styles.inboxEmpty}>Loading notifications...</p>
      </section>
    );
  }

  return (
    <section className={`${styles.panel} ${styles.inboxPanel}`}>
      <div className={styles.inboxHeader}>
        <div className={styles.inboxHeaderTitle}>
          <h3 className={styles.panelTitle}>Inbox</h3>
          <p className={styles.inboxCount}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            {notifications.length > 0 ? ` · ${notifications.length} total` : ""}
          </p>
        </div>

        {notifications.length > 0 ? (
          <div className={styles.inboxHeaderTools}>
            <label className={styles.inboxCheck}>
              <input
                type="checkbox"
                checked={allPageSelected}
                ref={(node) => {
                  if (node) node.indeterminate = somePageSelected && !allPageSelected;
                }}
                onChange={toggleSelectAll}
                aria-label="Select all notifications on this page"
              />
            </label>
            <button
              type="button"
              className={styles.inboxToolBtn}
              title="Mark as read"
              disabled={
                markingAll ||
                (selectedCount === 0
                  ? unreadManageableCount === 0
                  : selectedManageable.every((item) => item.unread === false))
              }
              onClick={() => {
                if (selectedCount > 0) void handleMarkSelectedRead();
                else void handleMarkAllRead();
              }}
            >
              <i className="fa-regular fa-envelope-open" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.inboxToolBtn}
              title="Dismiss"
              disabled={markingAll || selectedManageable.length === 0}
              onClick={() => void handleDismissSelected()}
            >
              <i className="fa-regular fa-trash-can" aria-hidden="true" />
            </button>
            <select
              className={styles.inboxSelect}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by category"
            >
              {KIND_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className={styles.inboxSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "unread")}
              aria-label="Filter by read status"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
            </select>
          </div>
        ) : null}

        <label className={styles.inboxSearch}>
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search mail"
            aria-label="Search notifications"
          />
        </label>

        {notifications.length > 0 ? (
          <div className={styles.inboxToolbarRight}>
            <span>
              {rangeStart}-{rangeEnd} of {filteredNotifications.length}
            </span>
            <button
              type="button"
              className={styles.inboxToolBtn}
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              aria-label="Newer"
            >
              <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.inboxToolBtn}
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              aria-label="Older"
            >
              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <p className={styles.inboxEmpty}>No notifications yet.</p>
      ) : filteredNotifications.length === 0 ? (
        <p className={styles.inboxEmpty}>No notifications match the selected filters.</p>
      ) : (
        <div className={styles.inboxList} role="list">
          {paginatedNotifications.map((item) => {
            const key = rowKey(item);
            const selected = selectedKeys.includes(key);
            const unread = item.unread !== false;
            const sender = senderLabel(item);

            return (
              <div
                key={key}
                role="listitem"
                className={[
                  styles.inboxRow,
                  unread ? styles.inboxRowUnread : "",
                  selected ? styles.inboxRowSelected : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <label className={styles.inboxCheck} onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleSelected(key)}
                    aria-label={`Select ${item.title}`}
                  />
                </label>
                <button
                  type="button"
                  className={styles.inboxStar}
                  title={unread ? "Mark as read" : "Read"}
                  disabled={busyKey === key || !isManageable(item) || !unread}
                  onClick={(event) => {
                    event.stopPropagation();
                    void markRead(item);
                  }}
                >
                  <i className="fa-regular fa-star" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={styles.inboxRowMain}
                  onClick={() => void openNotification(item)}
                >
                  <span className={styles.inboxSender}>{sender}</span>
                  <span className={styles.inboxCopy}>
                    <span className={styles.inboxSubject}>{item.title}</span>
                    <span className={styles.inboxPreview}> - {item.desc}</span>
                  </span>
                  <span className={styles.inboxDate}>{formatInboxDate(item)}</span>
                </button>
                <button
                  type="button"
                  className={styles.inboxRowDismiss}
                  title="Dismiss"
                  disabled={busyKey === key || !isManageable(item)}
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleDismiss(item);
                  }}
                >
                  <i className="fa-regular fa-trash-can" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
