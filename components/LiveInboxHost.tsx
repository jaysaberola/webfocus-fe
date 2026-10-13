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

const POLL_MS_DEFAULT = 8000;

type Audience = "customer" | "staff";

type LiveInboxItem = {
  id: number;
  title: string;
  body: string;
  unread: boolean;
};

type Props = {
  audience: Audience;
  enabled?: boolean;
  pollMs?: number;
  onOpenInbox?: () => void;
};

function asCustomerItems(rows: PortalNotification[]): LiveInboxItem[] {
  return rows.map((row) => ({
    id: Number(row.id),
    title: String(row.title || "New notification").trim() || "New notification",
    body: String(row.desc || row.intro || "").trim(),
    unread: Boolean(row.unread),
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
  }));
}

async function loadInbox(audience: Audience): Promise<LiveInboxItem[]> {
  if (audience === "customer") {
    return asCustomerItems(await fetchPortalNotifications());
  }
  return asStaffItems(await fetchCommerceNotifications());
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

  useEffect(() => {
    onOpenInboxRef.current = onOpenInbox;
  }, [onOpenInbox]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    primed.current = false;
    seenIds.current = new Set();
    lastUnread.current = 0;

    const refresh = async () => {
      if (cancelled || toasting.current) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

      try {
        const items = await loadInbox(audience);
        if (cancelled) return;

        const unreadItems = items.filter((item) => item.unread && Number.isFinite(item.id) && item.id > 0);
        const unreadCount = unreadItems.length;
        const ids = new Set(items.map((item) => item.id).filter((id) => Number.isFinite(id) && id > 0));

        if (!primed.current) {
          primed.current = true;
          seenIds.current = ids;
          lastUnread.current = unreadCount;
          return;
        }

        const freshUnread = unreadItems
          .filter((item) => !seenIds.current.has(item.id))
          .sort((a, b) => b.id - a.id);

        const grew = unreadCount > lastUnread.current;
        lastUnread.current = unreadCount;
        seenIds.current = new Set([...seenIds.current, ...ids]);

        if (!freshUnread.length && !grew) return;

        if (audience === "customer") notifyPortalNotificationsUpdated();
        else notifyCommerceNotificationsUpdated();

        if (!freshUnread.length) return;

        toasting.current = true;
        const latest = freshUnread[0];
        const extra = freshUnread.length - 1;
        toast.inbox({
          title: latest.title,
          body:
            extra > 0
              ? `${latest.body || "You have a new message."}${latest.body ? " " : ""}(+${extra} more)`
              : latest.body || "You have a new message.",
          onClick: () => onOpenInboxRef.current?.(),
        });
        window.setTimeout(() => {
          toasting.current = false;
        }, 400);
      } catch {
        // Keep polling quietly; offline/auth blips should not spam the UI.
      }
    };

    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, Math.max(4000, pollMs));

    const onFocus = () => {
      void refresh();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
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
