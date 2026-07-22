import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PortalTabLoader from "@/components/CustomerPortal/PortalTabLoader";
import { formatPeso } from "@/lib/customerPortal/mockData";
import { fetchPortalOrders } from "@/services/customerPortalService";
import type { PortalOrder } from "@/lib/customerPortal/types";
import { toast } from "@/lib/toast";
import styles from "@/styles/customerPortal.module.css";

type OrderDetailModalState = { open: false } | { open: true; order: PortalOrder };

const STATUS_FILTERS = [
  { value: "all", label: "All Status / Types" },
  { value: "Active Live", label: "Active Live" },
  { value: "Pending Request", label: "Pending Request" },
];

const SORT_OPTIONS = [
  { value: "date-desc", label: "Date Ordered (Newest)" },
  { value: "date-asc", label: "Date Ordered (Oldest)" },
  { value: "amount-desc", label: "Amount (High to Low)" },
  { value: "amount-asc", label: "Amount (Low to High)" },
];

export default function OrdersTab() {
  const [orders, setOrders] = useState<PortalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detailModal, setDetailModal] = useState<OrderDetailModalState>({ open: false });

  useEffect(() => {
    fetchPortalOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    let rows = orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;

      if (dateFrom && order.date < dateFrom) return false;
      if (dateTo && order.date > dateTo) return false;

      if (!query) return true;

      const item = order.items[0];
      const haystack = [
        order.id,
        order.invoiceId,
        order.serviceName,
        item?.name,
        item?.detail,
        order.gateway,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });

    rows = [...rows].sort((a, b) => {
      if (sortBy === "date-asc") return a.date.localeCompare(b.date);
      if (sortBy === "amount-desc") return b.total - a.total;
      if (sortBy === "amount-asc") return a.total - b.total;
      return b.date.localeCompare(a.date);
    });

    return rows;
  }, [orders, statusFilter, search, sortBy, dateFrom, dateTo]);

  const clearDateFilter = () => {
    setDateFrom("");
    setDateTo("");
  };

  const handleOrderAction = (order: PortalOrder, action: string) => {
    if (action === "renew") {
      window.location.assign("/public/dashboard?tab=billing");
      return;
    }

    if (action === "receipt") {
      if (order.status !== "Active Live") {
        toast.info("Receipt is available once the order is active.");
        return;
      }
      window.location.assign("/public/dashboard?tab=billing");
      return;
    }

    if (action === "details") {
      setDetailModal({ open: true, order });
    }
  };

  if (loading) {
    return <PortalTabLoader label="Loading orders..." />;
  }

  return (
    <div className={styles.tabStack}>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>Active Service Subscriptions &amp; Domains</h2>
            <p className={styles.panelSub}>Manage node configurations, SSL certs, and DNS records.</p>
          </div>
          <Link href="/public/services" className={styles.primaryBtnSm}>
            Order New
          </Link>
        </div>

        <div className={styles.portalTableToolbar}>
          <div className={styles.portalToolbarInner}>
            <div className={styles.portalToolbarGroup}>
              <span className={styles.portalToolbarLabel}>Filter By</span>
              <select
                className={styles.portalToolbarControl}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter orders by status"
              >
                {STATUS_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.portalToolbarGroup}>
              <span className={styles.portalToolbarLabel}>Search</span>
              <input
                type="search"
                className={`${styles.portalToolbarControl} ${styles.portalToolbarSearch}`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders..."
                aria-label="Search orders"
              />
            </div>

            <div className={styles.portalToolbarGroup}>
              <span className={styles.portalToolbarLabel}>Sort By</span>
              <select
                className={styles.portalToolbarControl}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort orders"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.portalToolbarGroup}>
              <span className={styles.portalToolbarLabel}>Date Range</span>
              <input
                type="date"
                className={`${styles.portalToolbarControl} ${styles.portalToolbarDate}`}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="Filter orders from date"
              />
              <span className={styles.portalToolbarDivider}>to</span>
              <input
                type="date"
                className={`${styles.portalToolbarControl} ${styles.portalToolbarDate}`}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="Filter orders to date"
              />
              <button type="button" className={styles.portalToolbarClear} onClick={clearDateFilter}>
                Clear Date Filter
              </button>
            </div>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Service Name</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Date Ordered</th>
                <th>Expired Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9}>No orders found for the selected filters.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const item = order.items[0];
                  const pending = order.status === "Pending Request";

                  return (
                    <tr key={order.id}>
                      <td className={styles.monoBlue}>{order.id}</td>
                      <td className={styles.serviceNameBold}>{order.serviceName ?? item?.name}</td>
                      <td>{item?.detail ?? item?.name}</td>
                      <td className={styles.monoBold}>{formatPeso(order.total)}</td>
                      <td>{order.gateway}</td>
                      <td>{order.date}</td>
                      <td>{order.expiredDate}</td>
                      <td>
                        <span className={pending ? styles.badgeAmber : styles.badgeGreen}>
                          {pending ? "Pending Request" : "Active Live"}
                        </span>
                      </td>
                      <td className={styles.billingActionsCell}>
                        <select
                          className={styles.billingActionsSelect}
                          defaultValue=""
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!value) return;
                            handleOrderAction(order, value);
                            e.target.value = "";
                          }}
                          aria-label={`Actions for ${order.id}`}
                        >
                          <option value="" disabled hidden>
                            Actions...
                          </option>
                          <option value="renew">Renew Subscription</option>
                          <option value="receipt">Download Receipt</option>
                          <option value="details">View Details</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detailModal.open ? (
        <div className={styles.billingModalOverlay} role="presentation" onClick={() => setDetailModal({ open: false })}>
          <div
            className={styles.billingModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.billingModalHead}>
              <div>
                <h3 id="order-detail-title">Order Details</h3>
                <p className={styles.panelSub}>Summary for {detailModal.order.id}</p>
              </div>
              <button
                type="button"
                className={styles.billingModalClose}
                aria-label="Close"
                onClick={() => setDetailModal({ open: false })}
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div className={styles.billingModalSummary}>
              <p className={styles.billingModalLine}>
                <strong>Order #:</strong> {detailModal.order.id}
              </p>
              {detailModal.order.invoiceId ? (
                <p className={styles.billingModalLine}>
                  <strong>Invoice:</strong> {detailModal.order.invoiceId}
                </p>
              ) : null}
              <p className={styles.billingModalLine}>
                <strong>Service:</strong>{" "}
                {detailModal.order.serviceName ?? detailModal.order.items[0]?.name}
              </p>
              <p className={styles.billingModalLine}>
                <strong>Plan:</strong> {detailModal.order.items[0]?.detail ?? detailModal.order.items[0]?.name}
              </p>
              <p className={styles.billingModalLine}>
                <strong>Amount:</strong> {formatPeso(detailModal.order.total)}
              </p>
              <p className={styles.billingModalLine}>
                <strong>Payment Method:</strong> {detailModal.order.gateway}
              </p>
              <p className={styles.billingModalLine}>
                <strong>Date Ordered:</strong> {detailModal.order.date}
              </p>
              <p className={styles.billingModalLine}>
                <strong>Expired Date:</strong> {detailModal.order.expiredDate}
              </p>
              <p className={styles.billingModalLine}>
                <strong>Status:</strong> {detailModal.order.status}
              </p>
            </div>

            <div className={styles.billingModalActions}>
              <button type="button" className={styles.secondaryBtnSm} onClick={() => setDetailModal({ open: false })}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
