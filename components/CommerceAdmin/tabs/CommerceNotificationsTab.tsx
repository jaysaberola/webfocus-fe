import { useCallback, useEffect, useMemo, useState } from "react";
import {
  broadcastCommerceNotification,
  fetchCommerceNotifications,
  type CommerceNotificationAdminRow,
} from "@/services/commerceAdminService";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  onOpenTransactions?: () => void;
};

type ViewMode = "list" | "grid";

const PAGE_SIZE = 10;

function NotificationCard({
  row,
  kind,
  viewMode,
  onOpenTransactions,
}: {
  row: CommerceNotificationAdminRow;
  kind: "alert" | "broadcast";
  viewMode: ViewMode;
  onOpenTransactions?: () => void;
}) {
  return (
    <article
      className={
        viewMode === "grid" ? styles.broadcastCardGrid : styles.broadcastCard
      }
    >
      <div>
        <h5>{row.title}</h5>
        <p className={styles.panelSubtitle}>{row.desc}</p>
        {(row.email || row.transactionNo) && (
          <p className={styles.panelSubtitle} style={{ marginTop: "0.35rem" }}>
            {[row.email, row.transactionNo].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      <div className={styles.broadcastCardMeta}>
        <span className={kind === "alert" ? styles.badgePending : styles.badgePaid}>
          {row.status}
        </span>
        <span className={styles.monoCell}>{row.date}</span>
        {kind === "alert" && onOpenTransactions ? (
          <button
            type="button"
            className={styles.primaryBtnSm}
            onClick={onOpenTransactions}
          >
            Open Transactions
          </button>
        ) : null}
      </div>
    </article>
  );
}

function ViewToggle({
  viewMode,
  onChange,
}: {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className={styles.analyticsToggle} role="group" aria-label="Notification view mode">
      <button
        type="button"
        className={
          viewMode === "list" ? styles.analyticsToggleBtnActive : styles.analyticsToggleBtn
        }
        onClick={() => onChange("list")}
      >
        <i className="fa-solid fa-list" aria-hidden="true" /> List
      </button>
      <button
        type="button"
        className={
          viewMode === "grid" ? styles.analyticsToggleBtnActive : styles.analyticsToggleBtn
        }
        onClick={() => onChange("grid")}
      >
        <i className="fa-solid fa-table-cells" aria-hidden="true" /> Grid
      </button>
    </div>
  );
}

function NotificationPagination({
  page,
  totalItems,
  itemLabel,
  onPageChange,
}: {
  page: number;
  totalItems: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
}) {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const rangeStart = (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalItems);

  return (
    <div className={styles.paginationBar}>
      <div className={styles.paginationInfo}>
        Showing {rangeStart}-{rangeEnd} of {totalItems} {itemLabel}
      </div>
      <div className={styles.paginationActions}>
        <button
          type="button"
          className={styles.secondaryBtnSm}
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </button>
        <span className={styles.managedServicePageIndicator}>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className={styles.primaryBtnSm}
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function CommerceNotificationsTab({ onOpenTransactions }: Props) {
  const [clientAlerts, setClientAlerts] = useState<CommerceNotificationAdminRow[]>([]);
  const [broadcasts, setBroadcasts] = useState<CommerceNotificationAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [alertsPage, setAlertsPage] = useState(1);
  const [broadcastsPage, setBroadcastsPage] = useState(1);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCommerceNotifications();
      setClientAlerts(Array.isArray(data.clientAlerts) ? data.clientAlerts : []);
      setBroadcasts(Array.isArray(data.broadcasts) ? data.broadcasts : []);
    } catch {
      setClientAlerts([]);
      setBroadcasts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    setAlertsPage(1);
    setBroadcastsPage(1);
  }, [viewMode]);

  const paginatedAlerts = useMemo(() => {
    const start = (alertsPage - 1) * PAGE_SIZE;
    return clientAlerts.slice(start, start + PAGE_SIZE);
  }, [clientAlerts, alertsPage]);

  const paginatedBroadcasts = useMemo(() => {
    const start = (broadcastsPage - 1) * PAGE_SIZE;
    return broadcasts.slice(start, start + PAGE_SIZE);
  }, [broadcasts, broadcastsPage]);

  const handleBroadcast = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) {
      toast.error("Please enter title and description for broadcast.");
      return;
    }

    setSubmitting(true);
    try {
      await broadcastCommerceNotification({ title: trimmedTitle, body: trimmedBody });
      toast.success("Broadcast notice successfully sent to all client portals!");
      setTitle("");
      setBody("");
      setBroadcastsPage(1);
      loadRows();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send broadcast notice.");
    } finally {
      setSubmitting(false);
    }
  };

  const listClass = viewMode === "grid" ? styles.broadcastGrid : styles.discountList;

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Client Quotation Alerts</h3>
          <p className={styles.panelSubtitle}>
            Web design Pending Quotation checkouts from client portals appear here for Sales
            pricing.
          </p>
        </div>
        <ViewToggle viewMode={viewMode} onChange={setViewMode} />
      </div>

      <div className={styles.broadcastHistory} style={{ borderTop: "none", paddingTop: 0 }}>
        {loading ? (
          <p className={styles.emptyState}>Loading client quotation alerts...</p>
        ) : clientAlerts.length === 0 ? (
          <p className={styles.emptyState}>No pending web design quotation checkouts.</p>
        ) : (
          <>
            <div className={listClass}>
              {paginatedAlerts.map((row) => (
                <NotificationCard
                  key={`alert-${row.id}`}
                  row={row}
                  kind="alert"
                  viewMode={viewMode}
                  onOpenTransactions={onOpenTransactions}
                />
              ))}
            </div>
            <NotificationPagination
              page={alertsPage}
              totalItems={clientAlerts.length}
              itemLabel="alerts"
              onPageChange={setAlertsPage}
            />
          </>
        )}
      </div>

      <div className={styles.panelHeader} style={{ marginTop: "1.75rem" }}>
        <div>
          <h3 className={styles.panelTitle}>Broadcast System Notifications</h3>
          <p className={styles.panelSubtitle}>
            Send global maintenance alerts or notices to all client portals.
          </p>
        </div>
      </div>

      <form className={styles.broadcastForm} onSubmit={handleBroadcast}>
        <label className={styles.modalLabel}>
          Notice Title
          <input
            className={styles.modalInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scheduled Core Datacenter Upgrade"
          />
        </label>
        <label className={styles.modalLabel}>
          Notice Description
          <textarea
            className={styles.modalTextarea}
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Provide details of the system update or broadcast message..."
          />
        </label>
        <div className={styles.modalActions}>
          <button type="submit" className={styles.primaryBtnSm} disabled={submitting}>
            {submitting ? "Sending..." : "Broadcast Notice"}
          </button>
        </div>
      </form>

      <div className={styles.broadcastHistory}>
        <div className={styles.broadcastHistoryHeader}>
          <h4 className={styles.broadcastHistoryTitle}>Broadcast History</h4>
          <ViewToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
        {loading ? (
          <p className={styles.emptyState}>Loading notification history...</p>
        ) : broadcasts.length === 0 ? (
          <p className={styles.emptyState}>No broadcast notices sent yet.</p>
        ) : (
          <>
            <div className={listClass}>
              {paginatedBroadcasts.map((row) => (
                <NotificationCard
                  key={`broadcast-${row.id}`}
                  row={row}
                  kind="broadcast"
                  viewMode={viewMode}
                />
              ))}
            </div>
            <NotificationPagination
              page={broadcastsPage}
              totalItems={broadcasts.length}
              itemLabel="broadcasts"
              onPageChange={setBroadcastsPage}
            />
          </>
        )}
      </div>
    </section>
  );
}
