import { useEffect, useState } from "react";
import {
  fetchPortalUnreadNotificationCount,
  PORTAL_NOTIFICATIONS_UPDATED_EVENT,
} from "@/services/customerPortalService";
import { scheduleIdleTask } from "@/lib/publicAuthState";

export function usePortalUnreadCount(enabled: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }

    let cancelled = false;

    const refresh = () => {
      fetchPortalUnreadNotificationCount()
        .then((value) => {
          if (!cancelled) setCount(value);
        })
        .catch(() => {
          if (!cancelled) setCount(0);
        });
    };

    const cancelIdle = scheduleIdleTask(refresh, 3000);
    const interval = window.setInterval(refresh, 8000);

    const onFocus = () => refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener(PORTAL_NOTIFICATIONS_UPDATED_EVENT, refresh);
    window.addEventListener("public-customer-updated", refresh);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      cancelIdle();
      window.clearInterval(interval);
      window.removeEventListener(PORTAL_NOTIFICATIONS_UPDATED_EVENT, refresh);
      window.removeEventListener("public-customer-updated", refresh);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled]);

  return count;
}
