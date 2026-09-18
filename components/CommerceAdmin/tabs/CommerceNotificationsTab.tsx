import { useCallback, useEffect, useMemo, useState } from "react";
import { invalidateCommerceDashboardCache } from "@/lib/commerceAdmin/dashboardCache";
import {
  approveCommerceProfileChange,
  deleteCommerceNotification,
  fetchCommerceNotifications,
  markAllCommerceNotificationsRead,
  markCommerceNotificationRead,
  notifyCommerceNotificationsUpdated,
  rejectCommercePaymentProof,
  rejectCommerceProfileChange,
  verifyCommercePaymentProof,
  type CommerceNotificationAdminRow,
  type CommerceNotificationAttachment,
} from "@/services/commerceAdminService";
import type { CommerceAdminTab } from "@/lib/commerceAdmin/types";
import { resolveStorageAssetUrl } from "@/lib/storageAssets";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  onOpenOrders?: () => void;
  onTabChange?: (tab: CommerceAdminTab) => void;
};

const PAGE_SIZE = 15;

const KIND_LABEL: Record<string, string> = {
  payment_proof: "Billing",
  billing: "Billing",
  profile_change: "Account",
  support_ticket: "Support",
  web_design_quotation: "Quotations",
  order: "Orders",
  broadcast: "Advisory",
  general: "Advisory",
};

const KIND_FILTERS = [
  { value: "all", label: "All Categories" },
  { value: "billing", label: "Billing" },
  { value: "profile_change", label: "Account" },
  { value: "support_ticket", label: "Support" },
  { value: "web_design_quotation", label: "Quotations" },
  { value: "order", label: "Orders" },
  { value: "general", label: "Advisory" },
];

function rowKey(row: CommerceNotificationAdminRow) {
  return `${row.kind ?? "alert"}-${row.id}`;
}

function isManageable(row: CommerceNotificationAdminRow) {
  return row.manageable !== false;
}

function isPendingReview(row: CommerceNotificationAdminRow) {
  return String(row.status || "").toLowerCase() === "pending review";
}

function canReviewFromInbox(row: CommerceNotificationAdminRow) {
  return Boolean(row.referenceId) && isPendingReview(row) && (row.kind === "payment_proof" || row.kind === "profile_change");
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

function formatMessageDate(row: CommerceNotificationAdminRow) {
  const raw = String(row.createdAt || row.date || "").trim();
  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) return row.date || "";

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

function isUnread(row: CommerceNotificationAdminRow) {
  return row.unread === true;
}

function bumpNotificationBadges() {
  invalidateCommerceDashboardCache();
  notifyCommerceNotificationsUpdated();
}

function isImageAttachment(attachment: CommerceNotificationAttachment) {
  return /\.(png|jpe?g|gif|webp|bmp|jfif)(\?.*)?$/i.test(`${attachment.name} ${attachment.url}`);
}

function attachmentUrl(attachment: CommerceNotificationAttachment) {
  return resolveStorageAssetUrl(attachment.url) || attachment.url;
}

function alertActionTab(row: CommerceNotificationAdminRow): CommerceAdminTab {
  const url = String(row.actionUrl ?? "");
  if (url.includes("tab=approvals") || row.kind === "payment_proof" || row.kind === "profile_change") {
    return "approvals";
  }
  if (url.includes("tab=helpdesk") || row.kind === "support_ticket") {
    return "helpdesk";
  }
  if (url.includes("tab=invoices") || url.includes("tab=billing") || row.kind === "billing") {
    return "billing";
  }
  return "orders";
}

function alertActionLabel(row: CommerceNotificationAdminRow) {
  if (row.actionLabel) return row.actionLabel;
  const tab = alertActionTab(row);
  if (tab === "approvals") return "Open Approvals";
  if (tab === "helpdesk") return "Open Helpdesk";
  if (tab === "billing") return "Open Billing";
  return "Open Deals";
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
  const [openedKey, setOpenedKey] = useState<string | null>(null);

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
    setOpenedKey(null);
  }, [typeFilter, statusFilter, search]);

  const unreadCount = useMemo(
    () => notifications.filter(isUnread).length,
    [notifications],
  );
  const unreadManageableCount = useMemo(
    () => notifications.filter((item) => isUnread(item) && isManageable(item)).length,
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((item) => {
      if (statusFilter === "unread" && !isUnread(item)) return false;
      if (typeFilter !== "all") {
        const kind = item.kind ?? "general";
        if (typeFilter === "billing") {
          if (kind !== "billing" && kind !== "payment_proof") return false;
        } else if (typeFilter === "general") {
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
        item.fromName,
        item.fromEmail,
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

  const openedIndex = filteredNotifications.findIndex((item) => rowKey(item) === openedKey);
  const opened = openedIndex >= 0 ? filteredNotifications[openedIndex] : null;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (openedKey && openedIndex < 0) setOpenedKey(null);
  }, [openedKey, openedIndex]);

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
    if (!isUnread(item) || !isManageable(item)) return;

    const key = rowKey(item);
    setBusyKey(key);
    setNotifications((prev) =>
      prev.map((row) => (rowKey(row) === key ? { ...row, unread: false } : row)),
    );

    try {
      await markCommerceNotificationRead(item.id);
      bumpNotificationBadges();
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
    setOpenedKey(rowKey(item));
    if (isUnread(item) && isManageable(item)) await markRead(item);
  };

  const handleMarkAllRead = async () => {
    const unreadManageable = notifications.filter((item) => isUnread(item) && isManageable(item));
    if (unreadManageable.length === 0) return;

    setMarkingAll(true);
    setNotifications((prev) =>
      prev.map((row) => (isManageable(row) ? { ...row, unread: false } : row)),
    );

    try {
      await markAllCommerceNotificationsRead();
      bumpNotificationBadges();
      toast.success("All notifications marked as read.");
    } catch {
      await loadRows();
      toast.error("Could not mark all notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkSelectedRead = async () => {
    const unreadSelected = selectedManageable.filter(isUnread);
    if (unreadSelected.length === 0) return;

    setMarkingAll(true);
    const keys = unreadSelected.map(rowKey);
    setNotifications((prev) =>
      prev.map((row) => (keys.includes(rowKey(row)) ? { ...row, unread: false } : row)),
    );

    try {
      await Promise.all(unreadSelected.map((item) => markCommerceNotificationRead(item.id)));
      bumpNotificationBadges();
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
      if (openedKey === key) setOpenedKey(null);
      bumpNotificationBadges();
    } catch {
      toast.error("Could not dismiss notification.");
    } finally {
      setBusyKey(null);
    }
  };

  const handleReviewDecision = async (item: CommerceNotificationAdminRow, decision: "confirm" | "decline") => {
    if (!canReviewFromInbox(item) || !item.referenceId) return;

    if (decision === "decline") {
      const reason = window.prompt("Optional note for the customer:");
      if (reason === null) return;
      const key = rowKey(item);
      setBusyKey(key);
      try {
        if (item.kind === "profile_change") {
          await rejectCommerceProfileChange(item.referenceId, reason || undefined);
          toast.success("Profile change declined. Customer notified.");
        } else {
          await rejectCommercePaymentProof(item.referenceId, reason || undefined);
          toast.success("Payment proof declined. Customer notified.");
        }
        bumpNotificationBadges();
        await loadRows();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Could not decline this request.");
      } finally {
        setBusyKey(null);
      }
      return;
    }

    const key = rowKey(item);
    setBusyKey(key);
    try {
      if (item.kind === "profile_change") {
        await approveCommerceProfileChange(item.referenceId);
        toast.success("Profile change confirmed. Customer profile updated.");
      } else {
        await verifyCommercePaymentProof(item.referenceId);
        toast.success("Payment proof confirmed. Customer billing updated.");
      }
      bumpNotificationBadges();
      await loadRows();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not confirm this request.");
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
      bumpNotificationBadges();
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

        {opened ? (
          <div className={styles.inboxHeaderTools}>
            <button
              type="button"
              className={styles.inboxToolBtn}
              title="Back to inbox"
              onClick={() => setOpenedKey(null)}
              aria-label="Back to inbox"
            >
              <i className="fa-solid fa-arrow-left" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.inboxToolBtn}
              title="Dismiss"
              disabled={busyKey === rowKey(opened) || !isManageable(opened)}
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
        <InboxMessageView
          item={opened}
          busy={busyKey === rowKey(opened)}
          onOpenRelated={() => openAlert(opened)}
          onConfirm={() => void handleReviewDecision(opened, "confirm")}
          onDecline={() => void handleReviewDecision(opened, "decline")}
        />
      ) : notifications.length === 0 ? (
        <p className={styles.inboxEmpty}>No notifications yet.</p>
      ) : filteredNotifications.length === 0 ? (
        <p className={styles.inboxEmpty}>No notifications match the selected filters.</p>
      ) : (
        <div className={styles.inboxList} role="list">
          {paginatedNotifications.map((item) => {
            const key = rowKey(item);
            const selected = selectedKeys.includes(key);
            const unread = isUnread(item);
            const sender = senderLabel(item);
            const hasAttachment = (item.attachments?.length ?? 0) > 0;

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

function InboxMessageView({
  item,
  busy = false,
  onOpenRelated,
  onConfirm,
  onDecline,
}: {
  item: CommerceNotificationAdminRow;
  busy?: boolean;
  onOpenRelated: () => void;
  onConfirm: () => void;
  onDecline: () => void;
}) {
  const fromName = item.fromName || item.audience || senderLabel(item);
  const fromEmail = item.fromEmail || item.email || "";
  const attachments = item.attachments ?? [];
  const details = (item.details ?? []).filter((row) => String(row.value || "").trim());
  const intro = String(item.intro || item.desc || "").trim();
  const reviewable = canReviewFromInbox(item);
  const confirmLabel = item.kind === "profile_change" ? "Confirm Profile" : "Confirm Receipt";
  const declineLabel = "Decline";

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

        <div className={styles.inboxMessageActions}>
          {reviewable ? (
            <>
              <button type="button" className={styles.primaryBtnSm} disabled={busy} onClick={onConfirm}>
                {busy ? "Saving..." : confirmLabel}
              </button>
              <button type="button" className={styles.dangerBtnSm} disabled={busy} onClick={onDecline}>
                {declineLabel}
              </button>
            </>
          ) : null}
          <button type="button" className={styles.secondaryBtnSm} onClick={onOpenRelated}>
            {alertActionLabel(item)}
          </button>
        </div>
      </div>
    </article>
  );
}

