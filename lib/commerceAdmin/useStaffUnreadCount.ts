import { useEffect, useState } from "react";
import { getCommerceDashboardCached, readCommerceDashboardCache } from "@/lib/commerceAdmin/dashboardCache";
import { scheduleIdleTask } from "@/lib/publicAuthState";
import {
  COMMERCE_NOTIFICATIONS_UPDATED_EVENT,
  fetchCommerceUnreadNotificationCount,
} from "@/services/commerceAdminService";

function dashboardUnread(data: { counts?: { unreadNotifications?: number } } | null) {
  const value = Number(data?.counts?.unreadNotifications);
  return Number.isFinite(value) ? value : 0;
}

export function useStaffUnreadCount(enabled: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }

    let cancelled = false;
    const cached = readCommerceDashboardCache();
    if (cached) {
      setCount(dashboardUnread(cached));
    }

    const refresh = () => {
      fetchCommerceUnreadNotificationCount()
        .then((value) => {
          if (!cancelled) setCount(value);
        })
        .catch(() => {
          getCommerceDashboardCached({ force: true })
            .then((data) => {
              if (!cancelled) setCount(dashboardUnread(data));
            })
            .catch(() => {
              if (!cancelled) setCount(0);
            });
        });
    };

    const cancelIdle = scheduleIdleTask(refresh, 300);
    const interval = window.setInterval(refresh, 8000);

    const onFocus = () => refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener(COMMERCE_NOTIFICATIONS_UPDATED_EVENT, refresh);
    window.addEventListener("public-admin-updated", refresh);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      cancelIdle();
      window.clearInterval(interval);
      window.removeEventListener(COMMERCE_NOTIFICATIONS_UPDATED_EVENT, refresh);
      window.removeEventListener("public-admin-updated", refresh);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled]);

  return count;
}
