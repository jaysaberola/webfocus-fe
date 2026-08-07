import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchCommerceNotifications,
  type CommerceNotificationAdminRow,
} from "@/services/commerceAdminService";
import type { CommerceAdminTab } from "@/lib/commerceAdmin/types";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  onOpenOrders?: () => void;
  onTabChange?: (tab: CommerceAdminTab) => void;
};

type ViewMode = "list" | "grid";

const PAGE_SIZE = 10;

function alertActionTab(row: CommerceNotificationAdminRow): CommerceAdminTab {
  const url = String(row.actionUrl ?? "");
  if (url.includes("tab=approvals") || row.kind === "payment_proof" || row.kind === "profile_change") {
    return "approvals";
  }
  if (url.includes("tab=helpdesk") || row.kind === "support_ticket") {
    return "helpdesk";
  }
  return "orders";
}

function alertActionLabel(row: CommerceNotificationAdminRow) {
  const tab = alertActionTab(row);
  if (tab === "approvals") return "Open Approvals";
  if (tab === "helpdesk") return "Open Helpdesk";
  return "Open Orders";
}

function NotificationCard({
  row,
  viewMode,
  onOpen,
}: {
  row: CommerceNotificationAdminRow;
  viewMode: ViewMode;
  onOpen?: () => void;
}) {
  return (
    <article
      className={[
        viewMode === "grid" ? styles.broadcastCardGrid : styles.broadcastCard,
        onOpen ? styles.broadcastCardWithAction : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.broadcastCardBody}>
        <h5>{row.title}</h5>
        <p className={styles.panelSubtitle}>{row.desc}</p>
        {(row.email || row.transactionNo || row.audience) && (
          <p className={styles.panelSubtitle} style={{ marginTop: "0.35rem" }}>
            {[row.audience, row.email, row.transactionNo].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      <div className={styles.broadcastCardMeta}>
        <div className={styles.broadcastCardMetaTop}>
          <span className={styles.badgePending}>{row.status}</span>
          <span className={styles.monoCell}>{row.date}</span>
        </div>
        {onOpen ? (
          <button type="button" className={styles.primaryBtnSm} onClick={onOpen}>
            {alertActionLabel(row)}
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

export default function CommerceNotificationsTab({ onOpenOrders, onTabChange }: Props) {
  const [clientAlerts, setClientAlerts] = useState<CommerceNotificationAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [alertsPage, setAlertsPage] = useState(1);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCommerceNotifications();
      setClientAlerts(Array.isArray(data.clientAlerts) ? data.clientAlerts : []);
    } catch {
      setClientAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    setAlertsPage(1);
  }, [viewMode]);

  const paginatedAlerts = useMemo(() => {
    const start = (alertsPage - 1) * PAGE_SIZE;
    return clientAlerts.slice(start, start + PAGE_SIZE);
  }, [clientAlerts, alertsPage]);

  const listClass = viewMode === "grid" ? styles.broadcastGrid : styles.discountList;

  const openAlert = (row: CommerceNotificationAdminRow) => {
    const tab = alertActionTab(row);
    if (onTabChange) {
      onTabChange(tab);
      return;
    }
    if (tab === "orders" && onOpenOrders) onOpenOrders();
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Client Activity Alerts</h3>
          <p className={styles.panelSubtitle}>
            Alerts for your role and assigned clients. Web design quotations are shown to Sales only.
          </p>
        </div>
        <ViewToggle viewMode={viewMode} onChange={setViewMode} />
      </div>

      <div className={styles.broadcastHistory} style={{ borderTop: "none", paddingTop: 0 }}>
        {loading ? (
          <p className={styles.emptyState}>Loading client activity alerts...</p>
        ) : clientAlerts.length === 0 ? (
          <p className={styles.emptyState}>No client activity alerts yet.</p>
        ) : (
          <>
            <div className={listClass}>
              {paginatedAlerts.map((row) => (
                <NotificationCard
                  key={`${row.kind ?? "alert"}-${row.id}-${row.date}`}
                  row={row}
                  viewMode={viewMode}
                  onOpen={() => openAlert(row)}
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
    </section>
  );
}
