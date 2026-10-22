export type InboxToastPriority = "default" | "warning" | "critical";

export type InboxToastSource = {
  id: number;
  title: string;
  body: string;
  unread?: boolean;
  kind?: string | null;
  type?: string | null;
};

const PRIORITY_RANK: Record<InboxToastPriority, number> = {
  critical: 0,
  warning: 1,
  default: 2,
};

export function inboxToastPriority(item: InboxToastSource): InboxToastPriority {
  const kind = String(item.kind ?? item.type ?? "").toLowerCase();
  const hay = `${item.title} ${item.body}`.toLowerCase();

  if (
    kind === "service_renewal" ||
    hay.includes("expired service") ||
    hay.includes("renew your expired") ||
    hay.includes("renewal needed") ||
    (hay.includes("expired on") && hay.includes("renew"))
  ) {
    return "critical";
  }

  if (
    kind === "service_expiry" ||
    hay.includes("expiring soon") ||
    hay.includes("expiring in") ||
    hay.includes("renewal reminder") ||
    hay.includes("days remaining") ||
    hay.includes("days left")
  ) {
    return "warning";
  }

  return "default";
}

export function sortInboxByPriority<T extends InboxToastSource>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const rankLeft = PRIORITY_RANK[inboxToastPriority(left)];
    const rankRight = PRIORITY_RANK[inboxToastPriority(right)];
    if (rankLeft !== rankRight) return rankLeft - rankRight;
    return right.id - left.id;
  });
}

export function inboxToastActionLabel(priority: InboxToastPriority): string {
  if (priority === "critical") return "Renew in Orders";
  if (priority === "warning") return "View renewal steps";
  return "Open notifications";
}

export function inboxToastEyebrow(unreadCount: number, priority: InboxToastPriority): string {
  const count = Math.max(1, unreadCount);
  if (priority === "critical") {
    return count > 1 ? `${count} unread · action needed` : "Urgent · action needed";
  }
  if (priority === "warning") {
    return count > 1 ? `${count} unread · expiring soon` : "Reminder · expiring soon";
  }
  return count > 1 ? `${count} unread` : "New notification";
}

export const INBOX_TOAST_SHOWN_EVENT = "portal-inbox-toast-shown";

export function notifyInboxToastShown(priority: InboxToastPriority) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(INBOX_TOAST_SHOWN_EVENT, { detail: { priority } }));
}
