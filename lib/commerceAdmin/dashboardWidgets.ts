export type CommerceDashboardWidgetId =
  | "new-orders"
  | "expiring-services"
  | "overdue"
  | "performance-chart"
  | "quick-actions"
  | "recent-activity"
  | "active-summary"
  | "expiring-summary"
  | "expired-summary"
  | "pending-orders-summary";

export type CommerceDashboardWidget = {
  id: CommerceDashboardWidgetId;
  title: string;
  description: string;
  icon: string;
};

export const COMMERCE_DASHBOARD_WIDGETS: CommerceDashboardWidget[] = [
  {
    id: "new-orders",
    title: "New Orders",
    description: "Show the newest order queue at the top of the dashboard.",
    icon: "fa-regular fa-file-lines",
  },
  {
    id: "expiring-services",
    title: "Expiring Services",
    description: "Keep the expiring service reminder table visible.",
    icon: "fa-regular fa-calendar",
  },
  {
    id: "overdue",
    title: "Overdue",
    description: "Show overdue receivables and due-date pressure.",
    icon: "fa-solid fa-circle-exclamation",
  },
  {
    id: "performance-chart",
    title: "Performance Chart",
    description: "Display projected renewals versus actual collection.",
    icon: "fa-solid fa-chart-line",
  },
  {
    id: "quick-actions",
    title: "Quick Actions",
    description: "Keep admin shortcuts like reports and upload actions visible.",
    icon: "fa-solid fa-bolt",
  },
  {
    id: "recent-activity",
    title: "Recent Activity",
    description: "Show the latest admin actions and status updates.",
    icon: "fa-solid fa-clock-rotate-left",
  },
  {
    id: "active-summary",
    title: "Active Summary",
    description: "Keep the active services summary card visible.",
    icon: "fa-solid fa-circle-check",
  },
  {
    id: "expiring-summary",
    title: "Expiring Summary",
    description: "Keep the expiring services summary card visible.",
    icon: "fa-regular fa-clock",
  },
  {
    id: "expired-summary",
    title: "Expired Summary",
    description: "Keep the expired services summary card visible.",
    icon: "fa-solid fa-circle-xmark",
  },
  {
    id: "pending-orders-summary",
    title: "Pending Orders Summary",
    description: "Keep the pending orders summary card visible.",
    icon: "fa-solid fa-cart-shopping",
  },
];

export const DEFAULT_VISIBLE_WIDGETS: CommerceDashboardWidgetId[] =
  COMMERCE_DASHBOARD_WIDGETS.map((widget) => widget.id);

const STORAGE_KEY = "cms5.commerceAdmin.dashboardWidgets.v1";

export function readVisibleDashboardWidgets(): CommerceDashboardWidgetId[] {
  if (typeof window === "undefined") return DEFAULT_VISIBLE_WIDGETS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VISIBLE_WIDGETS;
    const parsed = JSON.parse(raw) as CommerceDashboardWidgetId[];
    if (!Array.isArray(parsed)) return DEFAULT_VISIBLE_WIDGETS;
    return DEFAULT_VISIBLE_WIDGETS.filter((id) => parsed.includes(id));
  } catch {
    return DEFAULT_VISIBLE_WIDGETS;
  }
}

export function writeVisibleDashboardWidgets(ids: CommerceDashboardWidgetId[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function isWidgetVisible(
  visible: CommerceDashboardWidgetId[],
  id: CommerceDashboardWidgetId
) {
  return visible.includes(id);
}
