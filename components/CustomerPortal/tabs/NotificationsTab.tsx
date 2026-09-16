import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import PortalTabLoader from "@/components/CustomerPortal/PortalTabLoader";
import {
  deletePortalNotification,
  fetchPortalNotifications,
  markAllPortalNotificationsRead,
  markPortalNotificationRead,
  notifyPortalNotificationsUpdated,
} from "@/services/customerPortalService";
import type { PortalNotification, PortalNotificationAttachment } from "@/lib/customerPortal/types";
import { resolveStorageAssetUrl } from "@/lib/storageAssets";
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
  order: "Orders",
  account: "Account",
};

const TYPE_FILTERS = [
  { value: "all", label: "All Categories" },
  { value: "billing", label: "Billing" },
  { value: "payment", label: "Payment" },
  { value: "provisioning", label: "Provisioning" },
  { value: "renewal", label: "Renewal" },
  { value: "support", label: "Support" },
  { value: "maintenance", label: "Maintenance" },
  { value: "order", label: "Orders" },
  { value: "account", label: "Account" },
  { value: "general", label: "Advisory" },
];

const PAGE_SIZE = 15;

function senderLabel(item: PortalNotification) {
  return TYPE_LABEL[item.type ?? ""] || item.type || "WebFocus";
}

function formatInboxDate(item: PortalNotification) {
  const raw = String(item.createdAt || item.date || "").trim();
  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) return item.date || "";

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

function formatMessageDate(item: PortalNotification) {
  const raw = String(item.createdAt || item.date || "").trim();
  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) return item.date || "";

  return new Date(parsed).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function senderInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "W";
}

function isImageAttachment(attachment: PortalNotificationAttachment) {
  return /\.(png|jpe?g|gif|webp|bmp|jfif)(\?.*)?$/i.test(`${attachment.name} ${attachment.url}`);
}

function attachmentUrl(attachment: PortalNotificationAttachment) {
  return resolveStorageAssetUrl(attachment.url) || attachment.url;
}

function actionLabel(item: PortalNotification) {
  if (item.actionLabel) return item.actionLabel;
  const url = String(item.actionUrl || "");
  if (url.includes("tab=billing")) return "Open Billing";
  if (url.includes("tab=orders")) return "Open Orders";
  if (url.includes("tab=account")) return "Open Account";
  if (url.includes("tab=help")) return "Open Help & Communication";
  if (url.includes("tab=overview")) return "Open Overview";
  if (url.includes("tab=contract")) return "Open Contract";
  return "Open related page";
}

export default function NotificationsTab() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [openedId, setOpenedId] = useState<number | null>(null);

  const loadNotifications = () =>
    fetchPortalNotifications()
      .then(setNotifications)
      .catch(() => setNotifications([]));

  useEffect(() => {
    loadNotifications().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
    setOpenedId(null);
  }, [typeFilter, statusFilter, search]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((item) => {
      if (statusFilter === "unread" && !item.unread) return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (!query) return true;

      const haystack = [
        item.title,
        item.desc,
        item.intro,
        item.type,
        TYPE_LABEL[item.type ?? ""],
        ...(item.details ?? []).flatMap((row) => [row.label, row.value]),
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
  const pageIds = paginatedNotifications.map((item) => item.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const somePageSelected = pageIds.some((id) => selectedIds.includes(id));
  const selectedCount = selectedIds.length;
  const openedIndex = filteredNotifications.findIndex((item) => item.id === openedId);
  const opened = openedIndex >= 0 ? filteredNotifications[openedIndex] : null;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (openedId && openedIndex < 0) setOpenedId(null);
  }, [openedId, openedIndex]);

  const toggleSelected = (id: number) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((rowId) => rowId !== id) : [...current, id],
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((current) => {
      if (allPageSelected) return current.filter((id) => !pageIds.includes(id));
      return [...new Set([...current, ...pageIds])];
    });
  };

  const markRead = async (item: PortalNotification) => {
    if (!item.unread) return;

    setBusyId(item.id);
    setNotifications((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, unread: false } : row)),
    );

    try {
      await markPortalNotificationRead(item.id);
      notifyPortalNotificationsUpdated();
    } catch {
      setNotifications((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, unread: true } : row)),
      );
      toast.error("Could not mark notification as read.");
    } finally {
      setBusyId(null);
    }
  };

  const openNotification = async (item: PortalNotification) => {
    setOpenedId(item.id);
    if (item.unread) await markRead(item);
  };

  const openRelated = (item: PortalNotification) => {
    if (item.actionUrl) void router.push(item.actionUrl);
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

  const handleMarkSelectedRead = async () => {
    const unreadSelected = notifications.filter((item) => selectedIds.includes(item.id) && item.unread);
    if (unreadSelected.length === 0) return;

    setMarkingAll(true);
    setNotifications((prev) =>
      prev.map((row) => (selectedIds.includes(row.id) ? { ...row, unread: false } : row)),
    );

    try {
      await Promise.all(unreadSelected.map((item) => markPortalNotificationRead(item.id)));
      notifyPortalNotificationsUpdated();
    } catch {
      await loadNotifications();
      toast.error("Could not mark selected notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDismiss = async (item: PortalNotification) => {
    setBusyId(item.id);

    try {
      await deletePortalNotification(item.id);
      setNotifications((prev) => prev.filter((row) => row.id !== item.id));
      setSelectedIds((current) => current.filter((id) => id !== item.id));
      if (openedId === item.id) setOpenedId(null);
      notifyPortalNotificationsUpdated();
    } catch {
      toast.error("Could not dismiss notification.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDismissSelected = async () => {
    if (selectedCount === 0) return;
    const ids = [...selectedIds];
    setMarkingAll(true);

    try {
      await Promise.all(ids.map((id) => deletePortalNotification(id)));
      setNotifications((prev) => prev.filter((row) => !ids.includes(row.id)));
      setSelectedIds([]);
      if (openedId && ids.includes(openedId)) setOpenedId(null);
      notifyPortalNotificationsUpdated();
    } catch {
      await loadNotifications();
      toast.error("Could not dismiss selected notifications.");
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading) {
    return <PortalTabLoader label="Loading notifications..." />;
  }

  return (
    <div className={styles.tabStack}>
      <section className={`${styles.panel} ${styles.inboxPanel}`}>
        <div className={styles.inboxHeader}>
          <div className={styles.inboxHeaderTitle}>
            <h2 className={styles.panelTitle}>Inbox</h2>
            <p className={styles.inboxCount}>
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              {notifications.length > 0 ? ` · ${notifications.length} total` : ""}
            </p>
          </div>

          {opened ? (
            <div className={styles.inboxHeaderTools}>
              <button
                type="button"
                className={styles.inboxToolBtn}
                title="Back to inbox"
                onClick={() => setOpenedId(null)}
                aria-label="Back to inbox"
              >
                <i className="fa-solid fa-arrow-left" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles.inboxToolBtn}
                title="Dismiss"
                disabled={busyId === opened.id}
                onClick={() => void handleDismiss(opened)}
              >
                <i className="fa-regular fa-trash-can" aria-hidden="true" />
              </button>
            </div>
          ) : notifications.length > 0 ? (
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
                disabled={markingAll || (selectedCount === 0 ? unreadCount === 0 : false)}
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
                disabled={markingAll || selectedCount === 0}
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
                {TYPE_FILTERS.map((option) => (
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

          {opened ? null : (
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
          )}

          {opened ? (
            <div className={styles.inboxToolbarRight}>
              <span>
                {openedIndex + 1} of {filteredNotifications.length}
              </span>
              <button
                type="button"
                className={styles.inboxToolBtn}
                disabled={openedIndex <= 0}
                onClick={() => void openNotification(filteredNotifications[openedIndex - 1])}
                aria-label="Newer"
              >
                <i className="fa-solid fa-chevron-left" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles.inboxToolBtn}
                disabled={openedIndex >= filteredNotifications.length - 1}
                onClick={() => void openNotification(filteredNotifications[openedIndex + 1])}
                aria-label="Older"
              >
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
            </div>
          ) : notifications.length > 0 ? (
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

        {opened ? (
          <InboxMessageView item={opened} onOpenRelated={() => openRelated(opened)} />
        ) : notifications.length === 0 ? (
          <p className={styles.inboxEmpty}>No notifications yet.</p>
        ) : filteredNotifications.length === 0 ? (
          <p className={styles.inboxEmpty}>No notifications match the selected filters.</p>
        ) : (
          <div className={styles.inboxList} role="list">
            {paginatedNotifications.map((item) => {
              const selected = selectedIds.includes(item.id);
              const sender = senderLabel(item);
              const hasAttachment = (item.attachments?.length ?? 0) > 0;

              return (
                <div
                  key={item.id}
                  role="listitem"
                  className={[
                    styles.inboxRow,
                    item.unread ? styles.inboxRowUnread : "",
                    selected ? styles.inboxRowSelected : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <label className={styles.inboxCheck} onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSelected(item.id)}
                      aria-label={`Select ${item.title}`}
                    />
                  </label>
                  <button
                    type="button"
                    className={styles.inboxStar}
                    title={item.unread ? "Mark as read" : "Read"}
                    disabled={busyId === item.id}
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
                    <span className={styles.inboxRowEnd}>
                      <span className={styles.inboxClip} aria-hidden="true">
                        {hasAttachment ? <i className="fa-solid fa-paperclip" /> : null}
                      </span>
                      <span className={styles.inboxDate}>{formatInboxDate(item)}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.inboxRowDismiss}
                    title="Dismiss"
                    disabled={busyId === item.id}
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
    </div>
  );
}

function InboxMessageView({
  item,
  onOpenRelated,
}: {
  item: PortalNotification;
  onOpenRelated: () => void;
}) {
  const fromName = item.fromName || "WebFocus";
  const fromEmail = item.fromEmail || "";
  const attachments = item.attachments ?? [];
  const details = (item.details ?? []).filter((row) => String(row.value || "").trim());
  const intro = String(item.intro || item.desc || "").trim();

  return (
    <article className={styles.inboxMessage}>
      <div className={styles.inboxMessageCard}>
        <div className={styles.inboxMessageMeta}>
          <span className={styles.inboxMessageAvatar} aria-hidden="true">
            {senderInitial(fromName)}
          </span>
          <div className={styles.inboxMessageFrom}>
            <strong>{fromName}</strong>
            {fromEmail ? <span>&lt;{fromEmail}&gt;</span> : null}
            <p>to me</p>
          </div>
          <time className={styles.inboxMessageDate}>{formatMessageDate(item)}</time>
        </div>

        <h2 className={styles.inboxMessageSubject}>{item.title}</h2>
        <p className={styles.inboxMessageGreeting}>Hello,</p>
        {intro ? <p className={styles.inboxMessageIntro}>{intro}</p> : null}

        {details.length > 0 ? (
          <dl className={styles.inboxMessageDetails}>
            {details.map((row) => (
              <div key={`${row.label}-${row.value}`} className={styles.inboxMessageDetail}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {attachments.length > 0 ? (
          <div className={styles.inboxAttachments}>
            <p>
              {attachments.length} {attachments.length === 1 ? "Attachment" : "Attachments"}
            </p>
            <div className={styles.inboxAttachmentGrid}>
              {attachments.map((attachment) => {
                const url = attachmentUrl(attachment);
                const image =
                  isImageAttachment(attachment) || !/\.[a-z0-9]+$/i.test(String(attachment.name || ""));

                return (
                  <a
                    key={`${attachment.name}-${url}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.inboxAttachment}
                  >
                    {image ? (
                      <img src={url} alt={attachment.name} />
                    ) : (
                      <span className={styles.inboxAttachmentFile}>
                        <i className="fa-regular fa-file" aria-hidden="true" />
                      </span>
                    )}
                    <span className={styles.inboxAttachmentName}>{attachment.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        ) : null}

        {item.actionUrl ? (
          <div className={styles.inboxMessageActions}>
            <button type="button" className={styles.primaryBtnSm} onClick={onOpenRelated}>
              {actionLabel(item)}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
