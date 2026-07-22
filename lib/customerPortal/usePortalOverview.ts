import { useEffect, useState } from "react";
import { fetchPortalOverview } from "@/services/customerPortalService";
import type { PortalOverviewAlert, PortalOverviewStats, PortalServiceStatus } from "@/lib/customerPortal/types";

const EMPTY_STATS: PortalOverviewStats = {
  activeNodes: "0 Active",
  activeNodesDetail: "No active services yet",
  unpaidInvoices: "0 Pending",
  unpaidInvoicesDetail: "All invoices are paid",
  supportTickets: "0 Open",
  supportTicketsDetail: "No open tickets",
  slaUptime: "99.99%",
  slaUptimeDetail: "Tier-1 Fiber Route",
};

export function usePortalOverview() {
  const [stats, setStats] = useState<PortalOverviewStats>(EMPTY_STATS);
  const [alerts, setAlerts] = useState<PortalOverviewAlert[]>([]);
  const [services, setServices] = useState<PortalServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchPortalOverview()
      .then((data) => {
        if (cancelled) return;
        setStats(data.stats ?? EMPTY_STATS);
        setAlerts(data.alerts ?? []);
        setServices(data.services ?? []);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load overview");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, alerts, services, loading, error };
}
