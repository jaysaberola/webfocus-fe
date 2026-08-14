import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import PortalTabLoader from "@/components/CustomerPortal/PortalTabLoader";
import PortalModal from "@/components/CustomerPortal/PortalModal";
import PortalSortableTableHead from "@/components/CustomerPortal/PortalSortableTableHead";
import PortalBulkSelectionBar from "@/components/CustomerPortal/PortalBulkSelectionBar";
import {
  PortalSelectAllHead,
  PortalSelectRowCell,
} from "@/components/CustomerPortal/PortalSelectCells";
import TableFilterPanel, { TableFilterShell } from "@/components/shared/TableFilterPanel";
import { useRowSelection } from "@/lib/useRowSelection";
import { exportRowsToExcel } from "@/lib/commerceAdmin/exportTableExcel";
import { joinPlanNames } from "@/lib/serviceCategory";
import { formatPeso } from "@/lib/customerPortal/mockData";
import { fetchPortalOrders } from "@/services/customerPortalService";
import type { PortalOrder } from "@/lib/customerPortal/types";
import {
  emptyDateRange,
  rowMatchesDateRange,
  rowMatchesSearch,
  type DateRangeValue,
} from "@/lib/dateRangeHelpers";
import {
  applyTableFilter,
  emptyTableFilter,
  isTableFilterActive,
  type TableFilterFieldDef,
  type TableFilterState,
} from "@/lib/tableFilterHelpers";
import { toast } from "@/lib/toast";
import styles from "@/styles/customerPortal.module.css";

type OrderDetailModalState = { open: false } | { open: true; order: PortalOrder };

const ORDER_FILTER_FIELDS: TableFilterFieldDef[] = [
  { id: "status", label: "Status" },
  { id: "gateway", label: "Payment Method" },
  { id: "serviceName", label: "Service Name" },
  { id: "plan", label: "Plan" },
  { id: "id", label: "Order #", mode: "contains" },
  { id: "invoiceId", label: "Invoice", mode: "contains" },
];

const SORT_OPTIONS = [
  { value: "date-desc", label: "Date Ordered (Newest)" },
  { value: "date-asc", label: "Date Ordered (Oldest)" },
  { value: "due-desc", label: "Due Date (Latest)" },
  { value: "due-asc", label: "Due Date (Earliest)" },
  { value: "amount-desc", label: "Amount (High to Low)" },
  { value: "amount-asc", label: "Amount (Low to High)" },
];

type OrderSortKey =
  | "id-asc"
  | "id-desc"
  | "service-asc"
  | "service-desc"
  | "plan-asc"
  | "plan-desc"
  | "amount-asc"
  | "amount-desc"
  | "gateway-asc"
  | "gateway-desc"
  | "date-asc"
  | "date-desc"
  | "due-asc"
  | "due-desc"
  | "status-asc"
  | "status-desc";

type OrderColumnKey = "id" | "service" | "plan" | "amount" | "gateway" | "date" | "due" | "status";

const ORDER_SORT_ASC: Record<OrderColumnKey, OrderSortKey> = {
  id: "id-asc",
  service: "service-asc",
  plan: "plan-asc",
  amount: "amount-asc",
  gateway: "gateway-asc",
  date: "date-asc",
  due: "due-asc",
  status: "status-asc",
};

const ORDER_SORT_DESC: Record<OrderColumnKey, OrderSortKey> = {
  id: "id-desc",
  service: "service-desc",
  plan: "plan-desc",
  amount: "amount-desc",
  gateway: "gateway-desc",
  date: "date-desc",
  due: "due-desc",
  status: "status-desc",
};

function orderDueDate(order: PortalOrder) {
  return order.dueDate ?? order.expiredDate;
}

function orderPlanLabel(order: PortalOrder) {
  return order.plan ?? joinPlanNames(order.items.map((entry) => entry.detail ?? entry.name));
}

function sortPortalOrders(rows: PortalOrder[], sortBy: OrderSortKey) {
  const copy = [...rows];
  copy.sort((a, b) => {
    const compareText = (left: string, right: string, desc: boolean) => {
      const result = left.localeCompare(right);
      return desc ? -result : result;
    };

    if (sortBy.startsWith("id")) {
      return compareText(a.id, b.id, sortBy === "id-desc");
    }
    if (sortBy.startsWith("service")) {
      return compareText(a.serviceName ?? a.items[0]?.name ?? "", b.serviceName ?? b.items[0]?.name ?? "", sortBy === "service-desc");
    }
    if (sortBy.startsWith("plan")) {
      return compareText(orderPlanLabel(a), orderPlanLabel(b), sortBy === "plan-desc");
    }
    if (sortBy.startsWith("amount")) {
      return sortBy === "amount-desc" ? b.total - a.total : a.total - b.total;
    }
    if (sortBy.startsWith("gateway")) {
      return compareText(a.gateway, b.gateway, sortBy === "gateway-desc");
    }
    if (sortBy.startsWith("date")) {
      const left = Date.parse(String(a.date ?? "")) || 0;
      const right = Date.parse(String(b.date ?? "")) || 0;
      return sortBy === "date-desc" ? right - left : left - right;
    }
    if (sortBy.startsWith("due")) {
      const left = Date.parse(String(orderDueDate(a) ?? "")) || 0;
      const right = Date.parse(String(orderDueDate(b) ?? "")) || 0;
      return sortBy === "due-desc" ? right - left : left - right;
    }
    if (sortBy.startsWith("status")) {
      return compareText(a.status, b.status, sortBy === "status-desc");
    }
    return 0;
  });
  return copy;
}

function toggleOrderSort(current: OrderSortKey, column: OrderColumnKey): OrderSortKey {
  const asc = ORDER_SORT_ASC[column];
  const desc = ORDER_SORT_DESC[column];
  return current === asc ? desc : asc;
}

function orderSortDirection(sortBy: OrderSortKey, column: OrderColumnKey): "asc" | "desc" | null {
  if (sortBy === ORDER_SORT_ASC[column]) return "asc";
  if (sortBy === ORDER_SORT_DESC[column]) return "desc";
  return null;
}

export default function OrdersTab() {
  const [orders, setOrders] = useState<PortalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<OrderSortKey>("date-desc");
  const [dateRange, setDateRange] = useState<DateRangeValue>(emptyDateRange);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilter, setDraftFilter] = useState<TableFilterState>(emptyTableFilter);
  const [appliedFilter, setAppliedFilter] = useState<TableFilterState>(emptyTableFilter);
  const [detailModal, setDetailModal] = useState<OrderDetailModalState>({ open: false });
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchPortalOrders()
      .then(setOrders)
      .catch(() => {
        toast.error("Failed to load orders.");
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const getOrderFilterValue = useCallback((order: PortalOrder, fieldId: string) => {
    switch (fieldId) {
      case "status":
        return order.status;
      case "gateway":
        return order.gateway;
      case "serviceName":
        return order.serviceName ?? order.items[0]?.name ?? "";
      case "plan":
        return orderPlanLabel(order);
      case "id":
        return order.id;
      case "invoiceId":
        return order.invoiceId ?? "";
      default:
        return "";
    }
  }, []);

  const filteredOrders = useMemo(() => {
    let rows = orders.filter((order) => {
      if (!rowMatchesDateRange(order.date, dateRange)) return false;

      const item = order.items[0];
      return rowMatchesSearch(
        [order.id, order.invoiceId, order.serviceName, item?.name, item?.detail, order.gateway, order.status],
        search,
      );
    });

    rows = applyTableFilter(rows, appliedFilter, ORDER_FILTER_FIELDS, getOrderFilterValue);
    rows = sortPortalOrders(rows, sortBy);

    return rows;
  }, [orders, search, sortBy, dateRange, appliedFilter, getOrderFilterValue]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, page]);

  const getOrderRowId = useCallback((order: PortalOrder) => String(order.id), []);
  const selection = useRowSelection(paginatedOrders, getOrderRowId);
  const hasSelection = selection.selectedCount > 0;

  const selectedOrders = useMemo(() => {
    const ids = new Set(selection.selectedIds);
    return filteredOrders.filter((order) => ids.has(String(order.id)));
  }, [filteredOrders, selection.selectedIds]);

  const rangeStart = filteredOrders.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, filteredOrders.length);

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, dateRange, appliedFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const applyFilter = () => {
    setAppliedFilter(draftFilter);
    setPage(1);
  };

  const clearFilter = () => {
    setDraftFilter(emptyTableFilter);
    setAppliedFilter(emptyTableFilter);
    setPage(1);
  };

  const handleExportSelected = () => {
    if (selectedOrders.length === 0 || exporting) return;
    setExporting(true);
    try {
      exportRowsToExcel(
        [
          "Order #",
          "Service Name",
          "Plan",
          "Amount",
          "Payment Method",
          "Date Ordered",
          "Due Date",
          "Status",
        ],
        selectedOrders.map((order) => [
          order.id,
          order.serviceName ?? order.items[0]?.name ?? "",
          orderPlanLabel(order),
          formatPeso(order.total),
          order.gateway,
          order.date,
          orderDueDate(order),
          order.status,
        ]),
        "my-orders",
      );
    } finally {
      setExporting(false);
    }
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

        {hasSelection ? (
          <PortalBulkSelectionBar
            selectedCount={selection.selectedCount}
            entityLabel="order"
            exporting={exporting}
            onExport={handleExportSelected}
            onClear={selection.clearSelection}
          />
        ) : null}

        <TableFilterShell
          open={filterOpen}
          active={isTableFilterActive(appliedFilter)}
          total={filteredOrders.length}
          onToggle={() => setFilterOpen((o) => !o)}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search orders..."
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          panel={
            <TableFilterPanel
              rows={orders}
              fields={ORDER_FILTER_FIELDS}
              draft={draftFilter}
              applied={appliedFilter}
              getValue={getOrderFilterValue}
              onDraftChange={setDraftFilter}
              onApply={applyFilter}
              onClear={clearFilter}
              onClose={() => setFilterOpen(false)}
            sortControl={
              <select
                className={styles.portalToolbarControl}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as OrderSortKey)}
                aria-label="Sort orders"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            }
            />
          }
        >
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <PortalSelectAllHead
                    allSelected={selection.allSelected}
                    someSelected={selection.someSelected}
                    onToggleAll={selection.toggleAll}
                    disabled={paginatedOrders.length === 0}
                  />
                  <PortalSortableTableHead
                    label="Order #"
                    active={orderSortDirection(sortBy, "id") !== null}
                    direction={orderSortDirection(sortBy, "id") ?? "asc"}
                    onClick={() => setSortBy((current) => toggleOrderSort(current, "id"))}
                  />
                  <PortalSortableTableHead
                    label="Service Name"
                    active={orderSortDirection(sortBy, "service") !== null}
                    direction={orderSortDirection(sortBy, "service") ?? "asc"}
                    onClick={() => setSortBy((current) => toggleOrderSort(current, "service"))}
                  />
                  <PortalSortableTableHead
                    label="Plan"
                    active={orderSortDirection(sortBy, "plan") !== null}
                    direction={orderSortDirection(sortBy, "plan") ?? "asc"}
                    onClick={() => setSortBy((current) => toggleOrderSort(current, "plan"))}
                  />
                  <PortalSortableTableHead
                    label="Amount"
                    active={orderSortDirection(sortBy, "amount") !== null}
                    direction={orderSortDirection(sortBy, "amount") ?? "asc"}
                    onClick={() => setSortBy((current) => toggleOrderSort(current, "amount"))}
                  />
                  <PortalSortableTableHead
                    label="Payment Method"
                    active={orderSortDirection(sortBy, "gateway") !== null}
                    direction={orderSortDirection(sortBy, "gateway") ?? "asc"}
                    onClick={() => setSortBy((current) => toggleOrderSort(current, "gateway"))}
                  />
                  <PortalSortableTableHead
                    label="Date Ordered"
                    active={orderSortDirection(sortBy, "date") !== null}
                    direction={orderSortDirection(sortBy, "date") ?? "asc"}
                    onClick={() => setSortBy((current) => toggleOrderSort(current, "date"))}
                  />
                  <PortalSortableTableHead
                    label="Due Date"
                    active={orderSortDirection(sortBy, "due") !== null}
                    direction={orderSortDirection(sortBy, "due") ?? "asc"}
                    onClick={() => setSortBy((current) => toggleOrderSort(current, "due"))}
                  />
                  <PortalSortableTableHead
                    label="Status"
                    active={orderSortDirection(sortBy, "status") !== null}
                    direction={orderSortDirection(sortBy, "status") ?? "asc"}
                    onClick={() => setSortBy((current) => toggleOrderSort(current, "status"))}
                  />
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10}>No orders found for the selected filters.</td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const item = order.items[0];
                    const pending = order.status === "Pending Request";

                    return (
                      <tr
                        key={order.id}
                        className={selection.isSelected(order) ? styles.rowSelected : undefined}
                      >
                        <PortalSelectRowCell
                          checked={selection.isSelected(order)}
                          onChange={() => selection.toggleRow(order)}
                          label={`Select order ${order.id}`}
                        />
                        <td className={styles.monoBlue}>
                          <button
                            type="button"
                            className={styles.tableCellLink}
                            onClick={() => handleOrderAction(order, "details")}
                          >
                            {order.id}
                          </button>
                        </td>
                        <td className={styles.serviceNameBold}>{order.serviceName ?? item?.name}</td>
                        <td>{order.plan ?? joinPlanNames(order.items.map((entry) => entry.detail ?? entry.name))}</td>
                        <td className={styles.monoBold}>{formatPeso(order.total)}</td>
                        <td>{order.gateway}</td>
                        <td>{order.date}</td>
                        <td>{orderDueDate(order)}</td>
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

          <div className={styles.paginationBar}>
            <div className={styles.paginationInfo}>Total Records {filteredOrders.length}</div>
            <div className={styles.paginationControls}>
              <button
                type="button"
                className={styles.secondaryBtnSm}
                disabled={page <= 1 || filteredOrders.length === 0}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                aria-label="Previous page"
              >
                <i className="fa-solid fa-chevron-left" aria-hidden="true" />
              </button>
              <span className={styles.paginationRange}>
                {filteredOrders.length === 0 ? "0 to 0" : `${rangeStart} to ${rangeEnd}`}
              </span>
              <button
                type="button"
                className={styles.secondaryBtnSm}
                disabled={page >= totalPages || filteredOrders.length === 0}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                aria-label="Next page"
              >
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        </TableFilterShell>
      </section>

      <PortalModal
        open={detailModal.open}
        onClose={() => setDetailModal({ open: false })}
        ariaLabelledBy="order-detail-title"
      >
        <div className={styles.billingModalHead}>
          <div className={styles.billingModalHeadText}>
            <h3 id="order-detail-title">Order Details</h3>
            <p className={styles.panelSub}>
              {detailModal.open ? detailModal.order.id : "Order summary"}
            </p>
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

        {detailModal.open ? (
          <div className={styles.billingModalBody}>
            <div className={styles.billingModalDetails}>
              <div className={styles.billingModalDetailRow}>
                <span className={styles.billingModalDetailLabel}>Order #</span>
                <span className={styles.billingModalDetailValueMono}>{detailModal.order.id}</span>
              </div>
              {detailModal.order.invoiceId ? (
                <div className={styles.billingModalDetailRow}>
                  <span className={styles.billingModalDetailLabel}>Invoice</span>
                  <span className={styles.billingModalDetailValueMono}>{detailModal.order.invoiceId}</span>
                </div>
              ) : null}
              <div className={styles.billingModalDetailRow}>
                <span className={styles.billingModalDetailLabel}>Service</span>
                <span className={styles.billingModalDetailValue}>
                  {detailModal.order.serviceName ?? detailModal.order.items[0]?.name}
                </span>
              </div>
              <div className={styles.billingModalDetailRow}>
                <span className={styles.billingModalDetailLabel}>Plan</span>
                <span className={styles.billingModalDetailValue}>
                  {detailModal.order.plan ??
                    joinPlanNames(detailModal.order.items.map((entry) => entry.detail ?? entry.name))}
                </span>
              </div>
              <div className={styles.billingModalDetailRow}>
                <span className={styles.billingModalDetailLabel}>Amount</span>
                <span className={styles.billingModalDetailValue}>{formatPeso(detailModal.order.total)}</span>
              </div>
              <div className={styles.billingModalDetailRow}>
                <span className={styles.billingModalDetailLabel}>Payment</span>
                <span className={styles.billingModalDetailValue}>{detailModal.order.gateway}</span>
              </div>
              <div className={styles.billingModalDetailRow}>
                <span className={styles.billingModalDetailLabel}>Date Ordered</span>
                <span className={styles.billingModalDetailValue}>{detailModal.order.date}</span>
              </div>
              <div className={styles.billingModalDetailRow}>
                <span className={styles.billingModalDetailLabel}>Due Date</span>
                <span className={styles.billingModalDetailValue}>{orderDueDate(detailModal.order)}</span>
              </div>
              <div className={styles.billingModalDetailRow}>
                <span className={styles.billingModalDetailLabel}>Status</span>
                <span className={styles.billingModalDetailValue}>
                  <span
                    className={
                      detailModal.order.status === "Pending Request" ? styles.badgeAmber : styles.badgeGreen
                    }
                  >
                    {detailModal.order.status}
                  </span>
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </PortalModal>
    </div>
  );
}
