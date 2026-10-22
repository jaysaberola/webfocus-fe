import { useEffect, useRef } from "react";
import {
  fetchCommerceNotifications,
  notifyCommerceNotificationsUpdated,
  type CommerceNotificationAdminRow,
} from "@/services/commerceAdminService";
import {
  fetchPortalNotifications,
  notifyPortalNotificationsUpdated,
} from "@/services/customerPortalService";
import { toast } from "@/lib/toast";
import type { PortalNotification } from "@/lib/customerPortal/types";
import {
  inboxToastActionLabel,
  inboxToastPriority,
  notifyInboxToastShown,
  sortInboxByPriority,
  type InboxToastPriority,
} from "@/lib/inboxToastPriority";

export type InboxToastOpenContext = {
  priority: InboxToastPriority;
};

const POLL_MS_DEFAULT = 8000;

/** Re-show popup while unread remain (admin + customer stay aware). */
function remindIntervalMs(items: LiveInboxItem[]): number {
  if (!items.length) return 45000;
  const priority = inboxToastPriority(sortInboxByPriority(items)[0]);
  if (priority === "critical") return 20000;
  if (priority === "warning") return 30000;
  return 45000;
}

type Audience = "customer" | "staff";

type LiveInboxItem = {
  id: number;
  title: string;
  body: string;
  unread: boolean;
  kind?: string | null;
  type?: string | null;
};

type Props = {
  audience: Audience;
  enabled?: boolean;
  pollMs?: number;
  onOpenInbox?: (context?: InboxToastOpenContext) => void;
};

function asCustomerItems(rows: PortalNotification[]): LiveInboxItem[] {
  return rows.map((row) => ({
    id: Number(row.id),
    title: String(row.title || "New notification").trim() || "New notification",
    body: String(row.desc || row.intro || "").trim(),
    unread: Boolean(row.unread),
    kind: row.type ?? null,
    type: row.type ?? null,
  }));
}

function asStaffItems(payload: {
  clientAlerts?: CommerceNotificationAdminRow[];
  broadcasts?: CommerceNotificationAdminRow[];
}): LiveInboxItem[] {
  const rows = [...(payload.clientAlerts ?? []), ...(payload.broadcasts ?? [])];
  return rows.map((row) => ({
    id: Number(row.id),
    title: String(row.title || "New notification").trim() || "New notification",
    body: String(row.desc || row.intro || "").trim(),
    unread: Boolean(row.unread),
    kind: row.kind ?? null,
    type: row.kind ?? null,
  }));
}

async function loadInbox(audience: Audience): Promise<LiveInboxItem[]> {
  if (audience === "customer") {
    return asCustomerItems(await fetchPortalNotifications());
  }
  return asStaffItems(await fetchCommerceNotifications());
}

function popupUnread(items: LiveInboxItem[], onOpenInbox?: (context?: InboxToastOpenContext) => void) {
  if (!items.length) return;
  const sorted = sortInboxByPriority(items);
  const latest = sorted[0];
  const priority = inboxToastPriority(latest);
  const extra = sorted.length - 1;
  const detail = String(latest.body || "").trim();
  notifyInboxToastShown(priority);
  toast.inbox({
    title: latest.title,
    body:
      extra > 0
        ? `${detail || "You have unread notifications."}${detail ? " " : ""}· ${extra} more unread`
        : detail || "Open your inbox to review this message.",
    onClick: () => onOpenInbox?.({ priority }),
    priority,
    actionLabel: inboxToastActionLabel(priority),
    unreadCount: sorted.length,
  });
}

export default function LiveInboxHost({
  audience,
  enabled = true,
  pollMs = POLL_MS_DEFAULT,
  onOpenInbox,
}: Props) {
  const seenIds = useRef<Set<number>>(new Set());
  const primed = useRef(false);
  const lastUnread = useRef(0);
  const toasting = useRef(false);
  const onOpenInboxRef = useRef(onOpenInbox);
  const lastOpenPopupAt = useRef(0);

  useEffect(() => {
    onOpenInboxRef.current = onOpenInbox;
  }, [onOpenInbox]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    primed.current = false;
    seenIds.current = new Set();
    lastUnread.current = 0;
    lastOpenPopupAt.current = 0;

    const showPopup = (items: LiveInboxItem[]) => {
      if (!items.length || toasting.current) return;
      toasting.current = true;
      popupUnread(items, () => onOpenInboxRef.current?.());
      lastOpenPopupAt.current = Date.now();
      window.setTimeout(() => {
        toasting.current = false;
      }, 400);
    };

    const refresh = async (reason: "poll" | "open" | "focus" = "poll") => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

      try {
        const items = await loadInbox(audience);
        if (cancelled) return;

        const unreadItems = items.filter((item) => item.unread && Number.isFinite(item.id) && item.id > 0);
        const unreadCount = unreadItems.length;
        const ids = new Set(items.map((item) => item.id).filter((id) => Number.isFinite(id) && id > 0));

        // Login / first portal open: always popup current unread notifications.
        if (!primed.current) {
          primed.current = true;
          seenIds.current = ids;
          lastUnread.current = unreadCount;
          if (audience === "customer") notifyPortalNotificationsUpdated();
          else notifyCommerceNotificationsUpdated();
          showPopup(unreadItems);
          return;
        }

        const freshUnread = unreadItems
          .filter((item) => !seenIds.current.has(item.id))
          .sort((a, b) => b.id - a.id);

        const grew = unreadCount > lastUnread.current;
        lastUnread.current = unreadCount;
        seenIds.current = new Set([...seenIds.current, ...ids]);

        if (!unreadItems.length) return;

        const elapsed = Date.now() - lastOpenPopupAt.current;
        const remindMs = remindIntervalMs(unreadItems);
        const dueForReminder = elapsed >= remindMs;
        const tabReturned = reason === "open" || reason === "focus";
        const shouldPopup =
          freshUnread.length > 0 ||
          grew ||
          dueForReminder ||
          (tabReturned && elapsed >= 8000);

        if (!shouldPopup) return;

        if (audience === "customer") notifyPortalNotificationsUpdated();
        else notifyCommerceNotificationsUpdated();

        // Prefer all unread on reminders so count stays visible; new-only when just arrived.
        const payload =
          freshUnread.length > 0 && (grew || elapsed < remindMs) ? freshUnread : unreadItems;
        showPopup(payload);
      } catch {
        // Keep polling quietly; offline/auth blips should not spam the UI.
      }
    };

    void refresh("open");
    const interval = window.setInterval(() => {
      void refresh("poll");
    }, Math.max(4000, pollMs));

    const onFocus = () => {
      void refresh("focus");
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh("open");
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [audience, enabled, pollMs]);

  return null;
}
