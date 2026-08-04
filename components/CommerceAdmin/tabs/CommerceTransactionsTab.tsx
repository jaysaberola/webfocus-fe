import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ConfirmModal from "@/components/UI/ConfirmModal";
import CreateClientOrderModal from "@/components/CommerceAdmin/modals/CreateClientOrderModal";
import HostingTransactionModal from "@/components/CommerceAdmin/modals/HostingTransactionModal";
import SortableTableHead from "@/components/CommerceAdmin/SortableTableHead";
import {
  DEFAULT_TX_COLUMNS,
  TX_COLUMN_LABELS,
  filterTransactions,
  formatTxDate,
  isPaidStatus,
  paymentStatusLabel,
  sortTransactions,
  transactionDueDate,
  transactionIssuedDate,
  transactionItemSummary,
  transactionOrderType,
  transactionPlanLabel,
  type TxColumnKey,
  type TxFilterKey,
  type TxSortKey,
} from "@/lib/commerceAdmin/transactionHelpers";
import { isTxColumnSorted, toggleTxSort, txSortDirection } from "@/lib/commerceAdmin/tableSortHelpers";
import {
  HOSTING_SERVICE_NAME,
  hostingSubTypesForTransaction,
  inferHostingTypeName,
  isHostingTransaction,
  parseHostingClassification,
  hostingClassificationLabel,
  type HostingClassification,
} from "@/lib/commerceAdmin/hostingTransactionTypes";
import {
  mergeEditedTransactionNotes,
  resolveHostingActionUpdate,
  userFacingNotes,
} from "@/lib/commerceAdmin/hostingTransactionActions";
import { formatCommerceMoney } from "@/lib/commerceAdmin/mockData";
import { toast } from "@/lib/toast";
import {
  deleteSalesTransaction,
  getSalesTransactions,
  updateSalesTransaction,
  type SalesTransaction,
} from "@/services/salesTransactionService";
import styles from "@/styles/commerceAdmin.module.css";

const PAGE_SIZE = 5;

const emptyForm = {
  transaction_no: "",
  customer_name: "",
  customer_email: "",
  subtotal: 0,
  discount_total: 0,
  tax_total: 0,
  shipping_total: 0,
  payment_status: "pending",
  order_status: "pending",
  notes: "",
  transacted_at: "",
  items: [] as any[],
};

export default function CommerceTransactionsTab() {
  const [rows, setRows] = useState<SalesTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<TxSortKey>("date-desc");
  const [filterStatus, setFilterStatus] = useState<TxFilterKey>("all");
  const [columnsVisible, setColumnsVisible] = useState(DEFAULT_TX_COLUMNS);
  const [colVisOpen, setColVisOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [clientFilter, setClientFilter] = useState<{ id?: number; name?: string; email?: string } | null>(
    null,
  );
  const [modalMode, setModalMode] = useState<"view" | "edit" | null>(null);
  const [selected, setSelected] = useState<SalesTransaction | null>(null);
  const [rejectTarget, setRejectTarget] = useState<SalesTransaction | null>(null);
  const [hostingTarget, setHostingTarget] = useState<SalesTransaction | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const colVisRef = useRef<HTMLDivElement>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSalesTransactions({ per_page: 200 }, { silent: true });
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    const raw = sessionStorage.getItem("commerceAdmin:txClientFilter");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setClientFilter(parsed);
      sessionStorage.removeItem("commerceAdmin:txClientFilter");
    } catch {
      sessionStorage.removeItem("commerceAdmin:txClientFilter");
    }
  }, []);

  useEffect(() => {
    setPage(1);
  }, [sortBy, filterStatus, clientFilter]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (colVisRef.current && !colVisRef.current.contains(event.target as Node)) {
        setColVisOpen(false);
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const processedRows = useMemo(() => {
    let filtered = filterTransactions(rows, filterStatus);
    if (clientFilter) {
      const needleName = String(clientFilter.name ?? "").toLowerCase();
      const needleEmail = String(clientFilter.email ?? "").toLowerCase();
      filtered = filtered.filter((row) => {
        const rowName = String(row.customer_name ?? "").toLowerCase();
        const rowEmail = String(row.customer_email ?? "").toLowerCase();
        if (needleEmail && rowEmail === needleEmail) return true;
        if (needleName && rowName.includes(needleName)) return true;
        return false;
      });
    }
    return sortTransactions(filtered, sortBy);
  }, [rows, filterStatus, sortBy, clientFilter]);

  const displayRows = useMemo(() => {
    if (showAll) return processedRows;
    const start = (page - 1) * PAGE_SIZE;
    return processedRows.slice(start, start + PAGE_SIZE);
  }, [processedRows, page, showAll]);

  const totalCount = processedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startNum = totalCount === 0 ? 0 : showAll ? 1 : (page - 1) * PAGE_SIZE + 1;
  const endNum = showAll ? totalCount : Math.min(page * PAGE_SIZE, totalCount);

  useEffect(() => {
    if (!showAll && page > totalPages) setPage(totalPages);
  }, [page, totalPages, showAll]);

  const handleColumnSort = (column: TxColumnKey) => {
    setSortBy((current) => toggleTxSort(current, column));
  };

  const renderSortableHead = (column: TxColumnKey, label = TX_COLUMN_LABELS[column]) => (
    <SortableTableHead
      key={column}
      label={label}
      active={isTxColumnSorted(sortBy, column)}
      direction={txSortDirection(sortBy, column) ?? "asc"}
      onClick={() => handleColumnSort(column)}
    />
  );

  const openView = (row: SalesTransaction) => {
    setSelected(row);
    setModalMode("view");
  };

  const openEdit = (row: SalesTransaction) => {
    setSelected(row);
    setForm({
      transaction_no: row.transaction_no ?? "",
      customer_name: row.customer_name ?? "",
      customer_email: row.customer_email ?? "",
      subtotal: row.subtotal ?? 0,
      discount_total: row.discount_total ?? 0,
      tax_total: row.tax_total ?? 0,
      shipping_total: row.shipping_total ?? 0,
      payment_status: row.payment_status ?? "pending",
      order_status: row.order_status ?? "pending",
      notes: userFacingNotes(row.notes) ?? "",
      transacted_at: formatTxDate(row.transacted_at),
      items: row.items ?? [],
    });
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelected(null);
  };

  const markPaid = async (row: SalesTransaction) => {
    try {
      await updateSalesTransaction(row.id, {
        payment_status: "paid",
        order_status: row.order_status || "completed",
      });
      toast.success(`Invoice ${row.transaction_no} marked as paid.`);
      loadRows();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update payment status.");
    }
  };

  const applyHostingAction = async (
    row: SalesTransaction,
    classification: HostingClassification,
  ) => {
    try {
      const update = resolveHostingActionUpdate(row, classification);
      await updateSalesTransaction(row.id, {
        notes: update.notes,
        ...(update.order_status ? { order_status: update.order_status } : {}),
        ...(update.payment_status ? { payment_status: update.payment_status } : {}),
      });
      toast.success(update.successMessage);
      setHostingTarget(null);
      loadRows();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to apply hosting action.");
    }
  };

  const handleAction = async (row: SalesTransaction, action: string) => {
    if (action === "view") openView(row);
    else if (action === "pay") await markPaid(row);
    else if (action === "edit") openEdit(row);
    else if (action === "reject") setRejectTarget(row);
    else if (action === "hosting:classify") setHostingTarget(row);
    else if (action.startsWith("hosting:")) {
      const subType = action.slice("hosting:".length);
      await applyHostingAction(row, {
        serviceName: HOSTING_SERVICE_NAME,
        typeName: inferHostingTypeName(row),
        subType,
      });
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    try {
      await deleteSalesTransaction(rejectTarget.id);
      toast.success(`Transaction ${rejectTarget.transaction_no} rejected and removed.`);
      setRejectTarget(null);
      loadRows();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reject transaction.");
    }
  };

  const submitEdit = async () => {
    if (!selected) return;
    try {
      const savedClassification = parseHostingClassification(selected.notes);
      const notes = mergeEditedTransactionNotes(
        selected.notes,
        form.notes,
        savedClassification,
      );

      await updateSalesTransaction(selected.id, {
        ...form,
        notes,
        transacted_at: form.transacted_at || null,
      });
      toast.success("Transaction updated successfully.");
      closeModal();
      loadRows();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save transaction.");
    }
  };

  const toggleColumn = (key: TxColumnKey, checked: boolean) => {
    setColumnsVisible((current) => ({ ...current, [key]: checked }));
  };

  const renderStatusBadge = (status?: string | null) => {
    const label = paymentStatusLabel(status);
    const paid = isPaidStatus(status);
    return <span className={paid ? styles.badgePaid : styles.badgePending}>{label}</span>;
  };

  const renderOrderTypeBadge = (row: SalesTransaction) => {
    const type = transactionOrderType(row);
    const clientOrder = type === "Client Order";
    return <span className={clientOrder ? styles.badgePurple : styles.badgeBlue}>{type}</span>;
  };

  const renderHostingMeta = (row: SalesTransaction) => {
    if (!isHostingTransaction(row)) return null;
    const classified = parseHostingClassification(row.notes);
    if (!classified) return null;
    return <div className={styles.txHostingMeta}>{hostingClassificationLabel(row)}</div>;
  };

  const renderActionSelect = (row: SalesTransaction) => {
    const hosting = isHostingTransaction(row);
    const hostingType = hosting ? inferHostingTypeName(row) : null;
    const hostingSubTypes = hosting ? hostingSubTypesForTransaction(row) : [];

    return (
      <select
        className={styles.actionSelect}
        defaultValue=""
        onChange={(e) => {
          const value = e.target.value;
          e.target.value = "";
          if (value) void handleAction(row, value);
        }}
      >
        <option value="" disabled>
          Actions...
        </option>
        <option value="view">View Purchase details</option>
        {!isPaidStatus(row.payment_status) ? <option value="pay">Mark Invoice as Paid</option> : null}
        <option value="edit">Edit</option>
        <option value="reject">Reject Purchase</option>
        {hosting ? (
          <optgroup label={`Hosting · ${hostingType}`}>
            {hostingSubTypes.map((subType) => (
              <option key={subType} value={`hosting:${subType}`}>
                {subType}
              </option>
            ))}
            <option value="hosting:classify">Set Type / Sub-Type...</option>
          </optgroup>
        ) : null}
      </select>
    );
  };

  const visibleColumnCount =
    Object.values(columnsVisible).filter(Boolean).length + 1;

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>All Transactions &amp; Invoices</h3>
          <p className={styles.panelSubtitle}>
            View and verify all financial invoices, payment gateway checkouts, and receipts.
          </p>
        </div>
        <div className={styles.analyticsToggle}>
          <button
            type="button"
            className={viewMode === "list" ? styles.analyticsToggleBtnActive : styles.analyticsToggleBtn}
            onClick={() => setViewMode("list")}
          >
            <i className="fa-solid fa-list" aria-hidden="true" /> List
          </button>
          <button
            type="button"
            className={viewMode === "grid" ? styles.analyticsToggleBtnActive : styles.analyticsToggleBtn}
            onClick={() => setViewMode("grid")}
          >
            <i className="fa-solid fa-table-cells" aria-hidden="true" /> Grid
          </button>
        </div>
      </div>

      {clientFilter ? (
        <div className={styles.filterBanner}>
          <span>
            Showing purchases for <strong>{clientFilter.name ?? clientFilter.email}</strong>
          </span>
          <button type="button" className={styles.secondaryBtnSm} onClick={() => setClientFilter(null)}>
            Clear filter
          </button>
        </div>
      ) : null}

      <div className={styles.toolbarRow}>
        <div className={styles.toolbarFilters}>
          <select className={styles.selectInline} value={sortBy} onChange={(e) => setSortBy(e.target.value as TxSortKey)}>
            <option value="date-desc">Sort: Newest First</option>
            <option value="date-asc">Sort: Oldest First</option>
            <option value="amount-desc">Sort: Amount (High to Low)</option>
            <option value="amount-asc">Sort: Amount (Low to High)</option>
            <option value="id-asc">Sort: Invoice ID (A-Z)</option>
          </select>
          <select
            className={styles.selectInline}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TxFilterKey)}
          >
            <option value="all">Filter: All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending Payment</option>
          </select>
          <div className={styles.colVisWrap} ref={colVisRef}>
            <button
              type="button"
              className={styles.colVisBtn}
              onClick={(e) => {
                e.stopPropagation();
                setColVisOpen((open) => !open);
              }}
            >
              <i className="fa-solid fa-table-columns" aria-hidden="true" /> Column Visibility
            </button>
            {colVisOpen ? (
              <div className={styles.colVisPanel}>
                <div className={styles.colVisTitle}>Toggle Columns</div>
                {(Object.keys(TX_COLUMN_LABELS) as TxColumnKey[]).map((key) => (
                  <label key={key} className={styles.colVisItem}>
                    <input
                      type="checkbox"
                      checked={columnsVisible[key]}
                      onChange={(e) => toggleColumn(key, e.target.checked)}
                    />
                    <span>{TX_COLUMN_LABELS[key]}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <button type="button" className={styles.primaryBtnSm} onClick={() => setCreateOpen(true)}>
          <i className="fa-solid fa-plus" aria-hidden="true" /> Create Client Order
        </button>
      </div>

      {loading ? (
        <p className={styles.emptyState}>Loading transactions...</p>
      ) : viewMode === "list" ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {columnsVisible.id ? renderSortableHead("id") : null}
                {columnsVisible.items ? renderSortableHead("items") : null}
                {columnsVisible.subscription ? renderSortableHead("subscription") : null}
                {columnsVisible.orderType ? renderSortableHead("orderType") : null}
                {columnsVisible.date ? renderSortableHead("date") : null}
                {columnsVisible.expiredDate ? renderSortableHead("expiredDate") : null}
                {columnsVisible.amount ? renderSortableHead("amount") : null}
                {columnsVisible.status ? renderSortableHead("status") : null}
                <th className={styles.tableActionHead}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnCount}>No transactions found matching filter.</td>
                </tr>
              ) : (
                displayRows.map((row) => (
                  <tr key={row.id}>
                    {columnsVisible.id ? <td className={styles.monoCell}>{row.transaction_no}</td> : null}
                    {columnsVisible.items ? (
                      <td className={styles.txServiceCell}>
                        {transactionItemSummary(row)}
                        {renderHostingMeta(row)}
                      </td>
                    ) : null}
                    {columnsVisible.subscription ? (
                      <td className={styles.txPlanCell}>
                        <strong>{transactionPlanLabel(row)}</strong>
                      </td>
                    ) : null}
                    {columnsVisible.orderType ? <td>{renderOrderTypeBadge(row)}</td> : null}
                    {columnsVisible.date ? <td>{transactionIssuedDate(row)}</td> : null}
                    {columnsVisible.expiredDate ? <td>{transactionDueDate(row)}</td> : null}
                    {columnsVisible.amount ? (
                      <td className={styles.amountCell}>{formatCommerceMoney(Number(row.grand_total))}</td>
                    ) : null}
                    {columnsVisible.status ? (
                      <td className={styles.statusCell}>{renderStatusBadge(row.payment_status)}</td>
                    ) : null}
                    <td className={styles.tableActionCell}>{renderActionSelect(row)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.txGrid}>
          {displayRows.length === 0 ? (
            <p className={styles.emptyState}>No transactions found matching filter.</p>
          ) : (
            displayRows.map((row) => (
              <article key={row.id} className={styles.txGridCard}>
                <div className={styles.txGridCardTop}>
                  <span className={styles.monoCell}>{row.transaction_no}</span>
                  {renderStatusBadge(row.payment_status)}
                </div>
                <div>
                  <div className={styles.txGridLabel}>Service Name</div>
                  <div className={styles.txGridValue}>{transactionItemSummary(row)}</div>
                </div>
                <div>
                  <div className={styles.txGridLabel}>Plan</div>
                  <div className={styles.txGridValue}>{transactionPlanLabel(row)}</div>
                </div>
                <div>{renderOrderTypeBadge(row)}</div>
                <div className={styles.txGridMeta}>
                  <span>Issued: {transactionIssuedDate(row)}</span>
                  <span>Due: {transactionDueDate(row)}</span>
                </div>
                <div className={styles.txGridFooter}>
                  <strong className={styles.amountCell}>{formatCommerceMoney(Number(row.grand_total))}</strong>
                  {!isPaidStatus(row.payment_status) ? (
                    <button type="button" className={styles.primaryBtnSm} onClick={() => void markPaid(row)}>
                      Mark Paid
                    </button>
                  ) : (
                    <span className={styles.statusActive}>Verified</span>
                  )}
                </div>
                <div>{renderActionSelect(row)}</div>
              </article>
            ))
          )}
        </div>
      )}

      <div className={styles.paginationBar}>
        <div className={styles.paginationInfo}>
          {showAll
            ? `Showing all ${totalCount} items`
            : totalCount === 0
              ? "Showing 0 items"
              : `Showing ${startNum}-${endNum} of ${totalCount} items`}
        </div>
        <div className={styles.paginationActions}>
          <button
            type="button"
            className={styles.secondaryBtnSm}
            disabled={page <= 1 || showAll}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </button>
          {!showAll ? (
            <span className={styles.managedServicePageIndicator}>
              {page} / {totalPages}
            </span>
          ) : null}
          <button
            type="button"
            className={styles.secondaryBtnSm}
            disabled={showAll || page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Next
          </button>
          <button
            type="button"
            className={styles.primaryBtnSm}
            onClick={() => {
              setShowAll((current) => !current);
              setPage(1);
            }}
          >
            {showAll ? "Show Paginated" : "View All"}
          </button>
        </div>
      </div>

      <CreateClientOrderModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={loadRows} />

      <HostingTransactionModal
        open={!!hostingTarget}
        transaction={hostingTarget}
        onClose={() => setHostingTarget(null)}
        onSave={(classification) => {
          if (!hostingTarget) return;
          void applyHostingAction(hostingTarget, classification);
        }}
      />

      {modalMode ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCardWide}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalMode === "view" ? "Purchase Details" : "Edit Transaction"}
              </h3>
              <button type="button" className={styles.modalCloseBtn} onClick={closeModal} aria-label="Close">
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
            {modalMode === "view" && selected ? (
              <div className={styles.detailGrid}>
                <DetailField label="Invoice ID" value={selected.transaction_no} />
                <DetailField label="Customer" value={selected.customer_name} />
                <DetailField label="Email" value={selected.customer_email} />
                <DetailField label="Service" value={transactionItemSummary(selected)} />
                {isHostingTransaction(selected) ? (
                  <>
                    <DetailField label="Service Name" value={HOSTING_SERVICE_NAME} />
                    <DetailField
                      label="Type Name"
                      value={
                        parseHostingClassification(selected.notes)?.typeName ??
                        inferHostingTypeName(selected)
                      }
                    />
                    <DetailField
                      label="Sub-Type"
                      value={parseHostingClassification(selected.notes)?.subType ?? "—"}
                    />
                  </>
                ) : null}
                <DetailField label="Plan" value={transactionPlanLabel(selected)} />
                <DetailField label="Amount" value={formatCommerceMoney(Number(selected.grand_total))} />
                <DetailField label="Payment Status" value={paymentStatusLabel(selected.payment_status)} />
                <DetailField label="Order Status" value={selected.order_status} />
                <DetailField label="Issued Date" value={transactionIssuedDate(selected)} />
                <DetailField label="Due Date" value={transactionDueDate(selected)} />
                <DetailField label="Notes" value={userFacingNotes(selected.notes) || "—"} wide />
              </div>
            ) : (
              <form
                className={styles.modalForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  void submitEdit();
                }}
              >
                <label className={styles.modalLabel}>
                  Customer Name
                  <input
                    className={styles.modalInput}
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  />
                </label>
                <label className={styles.modalLabel}>
                  Customer Email
                  <input
                    className={styles.modalInput}
                    type="email"
                    value={form.customer_email}
                    onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                  />
                </label>
                <label className={styles.modalLabel}>
                  Payment Status
                  <select
                    className={styles.select}
                    value={form.payment_status}
                    onChange={(e) => setForm({ ...form, payment_status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </label>
                <label className={styles.modalLabel}>
                  Order Status
                  <select
                    className={styles.select}
                    value={form.order_status}
                    onChange={(e) => setForm({ ...form, order_status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
                <label className={styles.modalLabel}>
                  Notes
                  <textarea
                    className={styles.modalTextarea}
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </label>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.secondaryBtnSm} onClick={closeModal}>
                    Close
                  </button>
                  <button type="submit" className={styles.primaryBtnSm}>
                    Save Changes
                  </button>
                </div>
              </form>
            )}
            {modalMode === "view" ? (
              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryBtnSm} onClick={closeModal}>
                  Close
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <ConfirmModal
        show={!!rejectTarget}
        title="Reject Purchase"
        message={
          <>
            Are you sure you want to reject and delete <strong>{rejectTarget?.transaction_no}</strong>?
          </>
        }
        confirmLabel="Reject"
        onConfirm={confirmReject}
        onCancel={() => setRejectTarget(null)}
      />
    </section>
  );
}

function DetailField({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={wide ? styles.detailFieldWide : styles.detailField}>
      <span className={styles.detailLabel}>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}
