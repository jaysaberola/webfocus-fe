import { useEffect, useState } from "react";
import {
  fetchPortalUnreadNotificationCount,
  PORTAL_NOTIFICATIONS_UPDATED_EVENT,
} from "@/services/customerPortalService";

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

    refresh();
    window.addEventListener(PORTAL_NOTIFICATIONS_UPDATED_EVENT, refresh);
    window.addEventListener("public-customer-updated", refresh);

    return () => {
      cancelled = true;
      window.removeEventListener(PORTAL_NOTIFICATIONS_UPDATED_EVENT, refresh);
      window.removeEventListener("public-customer-updated", refresh);
    };
  }, [enabled]);

  return count;
}
