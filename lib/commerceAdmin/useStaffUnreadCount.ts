import { useEffect, useState } from "react";
import { getCommerceDashboardCached, readCommerceDashboardCache } from "@/lib/commerceAdmin/dashboardCache";

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
      setCount(
        Number(cached.counts.pendingApprovals || 0) + Number(cached.counts.pendingQuotations || 0)
      );
    }

    getCommerceDashboardCached()
      .then((data) => {
        if (cancelled) return;
        setCount(Number(data.counts.pendingApprovals || 0) + Number(data.counts.pendingQuotations || 0));
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return count;
}
