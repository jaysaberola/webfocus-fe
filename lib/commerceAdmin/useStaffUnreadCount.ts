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

    window.addEventListener(COMMERCE_NOTIFICATIONS_UPDATED_EVENT, refresh);
    window.addEventListener("public-admin-updated", refresh);

    return () => {
      cancelled = true;
      cancelIdle();
      window.removeEventListener(COMMERCE_NOTIFICATIONS_UPDATED_EVENT, refresh);
      window.removeEventListener("public-admin-updated", refresh);
    };
  }, [enabled]);

  return count;
}
