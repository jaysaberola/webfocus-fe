import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { COMMERCE_ADMIN_PATH } from "@/lib/commerceAdmin/constants";
import ConfirmModal from "@/components/UI/ConfirmModal";
import AssignTransactionModal from "@/components/CommerceAdmin/modals/AssignTransactionModal";
import ClientCrmForm from "@/components/CommerceAdmin/ClientCrmForm";
import ClientOrderForm from "@/components/CommerceAdmin/ClientOrderForm";
import HostingTransactionModal from "@/components/CommerceAdmin/modals/HostingTransactionModal";
import SetWebDesignPriceModal from "@/components/CommerceAdmin/modals/SetWebDesignPriceModal";
import UploadProposalModal from "@/components/CommerceAdmin/modals/UploadProposalModal";
import SortableTableHead from "@/components/CommerceAdmin/SortableTableHead";
import CommerceBulkSelectionBar from "@/components/CommerceAdmin/CommerceBulkSelectionBar";
import {
  CommerceSelectAllHead,
  CommerceSelectRowCell,
} from "@/components/CommerceAdmin/CommerceSelectCells";
import { useRowSelection } from "@/lib/useRowSelection";
import { exportRowsToExcel } from "@/lib/commerceAdmin/exportTableExcel";
import { orderAdminColumnValue } from "@/lib/commerceAdmin/clientDealHelpers";
import {
  DEFAULT_TX_COLUMNS,
  TX_COLUMN_KEYS,
  TX_COLUMN_LABELS,
  TX_COLUMN_VISIBILITY_KEYS,
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
  type TxSortKey,
} from "@/lib/commerceAdmin/transactionHelpers";
import { isTxColumnSorted, toggleTxSort, txSortDirection } from "@/lib/commerceAdmin/tableSortHelpers";
import TableFilterPanel, { TableFilterShell } from "@/components/shared/TableFilterPanel";
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
import {
  HOSTING_SERVICE_NAME,
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
import {
  parseWebDesignMeta,
  webDesignAdditionalServicesLabel,
} from "@/lib/webDesignSetup";
import {
  applyWebDesignPriceToItems,
  buildWebDesignPricedNotes,
  isPendingQuotationTransaction,
  isProposalSignedTransaction,
  isProposalSubmittedTransaction,
  isWebDesignTransaction,
  transactionAmountLabel,
} from "@/lib/commerceAdmin/webDesignPricing";
import { toast } from "@/lib/toast";
import { readStoredCurrentUser } from "@/lib/currentUser";
import { canAssignSalesTransactions, isSalesRoleUser } from "@/lib/userRoles";
import {
  deleteSalesTransaction,
  getSalesTransactions,
  proceedWebDesignPayment,
  updateSalesTransaction,
  uploadWebDesignProposal,
  type SalesTransaction,
} from "@/services/salesTransactionService";
import { getCustomer, type CustomerRow } from "@/services/customerService";
import styles from "@/styles/commerceAdmin.module.css";

const PAGE_SIZE = 5;

const TX_FILTER_FIELDS: TableFilterFieldDef[] = [
  { id: "payment_status", label: "Payment Status" },
  { id: "order_status", label: "Order Status" },
  { id: "order_type", label: "Order Type" },
  { id: "customer_name", label: "Customer Name" },
  { id: "customer_email", label: "Customer Email" },
  { id: "assigned", label: "Assigned" },
  { id: "service", label: "Service" },
  { id: "plan", label: "Plan" },
  { id: "transaction_no", label: "Transaction #", mode: "contains" },
];

function assignedUserLabel(row: SalesTransaction) {
  if (row.user) {
    const name = `${row.user.fname || ""} ${row.user.lname || ""}`.trim();
    return name || row.user.email || null;
  }
  return null;
}

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
  const router = useRouter();
  const [rows, setRows] = useState<SalesTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<TxSortKey>("date-desc");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilter, setDraftFilter] = useState<TableFilterState>(emptyTableFilter);
  const [appliedFilter, setAppliedFilter] = useState<TableFilterState>(emptyTableFilter);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>(emptyDateRange);
  const [columnsVisible, setColumnsVisible] = useState(DEFAULT_TX_COLUMNS);
  const [colVisOpen, setColVisOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [view, setView] = useState<"list" | "create" | "client" | "deal">("list");
  const [createCustomerId, setCreateCustomerId] = useState<number | null>(null);
  const [clientInfo, setClientInfo] = useState<CustomerRow | null>(null);
  const [dealInfo, setDealInfo] = useState<SalesTransaction | null>(null);
  const [clientFilter, setClientFilter] = useState<{ id?: number; name?: string; email?: string } | null>(
    null,
  );
  const [queueFilter, setQueueFilter] = useState<"new" | "overdue" | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit" | null>(null);
  const [selected, setSelected] = useState<SalesTransaction | null>(null);
  const [rejectTarget, setRejectTarget] = useState<SalesTransaction | null>(null);
  const [hostingTarget, setHostingTarget] = useState<SalesTransaction | null>(null);
  const [webDesignPriceTarget, setWebDesignPriceTarget] = useState<SalesTransaction | null>(null);
  const [proposalTarget, setProposalTarget] = useState<SalesTransaction | null>(null);
  const [uploadingProposal, setUploadingProposal] = useState(false);
  const [neededOpen, setNeededOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<SalesTransaction | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [exporting, setExporting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const colVisRef = useRef<HTMLDivElement>(null);
  const neededShownRef = useRef(false);
  const currentUser = readStoredCurrentUser();
  const canAssign = canAssignSalesTransactions(currentUser);
  const salesRole = isSalesRoleUser(currentUser);

  useEffect(() => {
    if (!router.isReady) return;

    const queue = router.query.queue;
    const shouldOpenCreate = router.query.createOrder === "1";
    const shouldApplyQueue = queue === "new" || queue === "overdue";

    if (!shouldOpenCreate && !shouldApplyQueue) return;

    if (shouldApplyQueue) setQueueFilter(queue);
    if (shouldOpenCreate) {
      const parsedId = Number(router.query.customerId);
      setCreateCustomerId(Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null);
      setView("create");
    }

    void router.replace(
      { pathname: COMMERCE_ADMIN_PATH, query: { tab: "orders" } },
      undefined,
      { shallow: true },
    );
  }, [router.isReady, router.query.createOrder, router.query.customerId, router.query.queue, router]);

  const getFilterValue = useCallback((row: SalesTransaction, fieldId: string) => {
    switch (fieldId) {
      case "payment_status":
        return paymentStatusLabel(row.payment_status);
      case "order_status":
        return String(row.order_status ?? "").trim();
      case "order_type":
        return transactionOrderType(row);
      case "customer_name":
        return String(row.customer_name ?? "").trim();
      case "customer_email":
        return String(row.customer_email ?? "").trim();
      case "assigned":
        return assignedUserLabel(row) ?? "Unassigned";
      case "service":
        return transactionItemSummary(row);
      case "plan":
        return transactionPlanLabel(row);
      case "transaction_no":
        return String(row.transaction_no ?? "").trim();
      default:
        return "";
    }
  }, []);

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
  }, [sortBy, appliedFilter, clientFilter, queueFilter, search, dateRange]);

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
    let filtered = applyTableFilter(rows, appliedFilter, TX_FILTER_FIELDS, getFilterValue);
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
    if (queueFilter === "new") {
      filtered = filtered.filter((row) =>
        ["new", "pending", "processing"].includes(String(row.order_status ?? "").toLowerCase()),
      );
    } else if (queueFilter === "overdue") {
      const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
      filtered = filtered.filter((row) => {
        if (isPaidStatus(row.payment_status)) return false;
        const issued = Date.parse(String(row.transacted_at || row.issued_date || ""));
        return Number.isFinite(issued) && issued <= cutoff;
      });
    }
    filtered = filtered
      .filter((row) =>
        rowMatchesSearch(
          [
            row.transaction_no,
            row.customer_name,
            row.customer_email,
            paymentStatusLabel(row.payment_status),
            assignedUserLabel(row),
            transactionItemSummary(row),
          ],
          search,
        ),
      )
      .filter((row) =>
        rowMatchesDateRange(
          transactionIssuedDate(row) || row.transacted_at || row.issued_date,
          dateRange,
        ),
      );
    return sortTransactions(filtered, sortBy, (row, column) =>
      orderAdminColumnValue(row, column, { assigned: assignedUserLabel(row) }),
    );
  }, [rows, appliedFilter, sortBy, clientFilter, queueFilter, getFilterValue, search, dateRange]);

  const neededActions = useMemo(() => {
    if (!salesRole) return [];
    const myId = Number((currentUser as { id?: number } | null)?.id);
    return rows
      .filter((row) => {
        if (!isWebDesignTransaction(row) || !isPendingQuotationTransaction(row)) return false;
        const assignedToMe = myId > 0 && Number(row.user_id || row.user?.id) === myId;
        if (!assignedToMe) return false;
        if (!isProposalSubmittedTransaction(row)) return true;
        return isProposalSignedTransaction(row);
      })
      .map((row) => ({
        row,
        action: isProposalSignedTransaction(row) ? ("proceed" as const) : ("upload" as const),
      }));
  }, [rows, salesRole, currentUser]);

  useEffect(() => {
    if (loading || !salesRole || neededShownRef.current || neededActions.length === 0) return;
    neededShownRef.current = true;
    setNeededOpen(true);
  }, [loading, salesRole, neededActions.length]);

  const displayRows = useMemo(() => {
    if (showAll) return processedRows;
    const start = (page - 1) * PAGE_SIZE;
    return processedRows.slice(start, start + PAGE_SIZE);
  }, [processedRows, page, showAll]);

  const getTxRowId = useCallback((row: SalesTransaction) => String(row.id), []);
  const selection = useRowSelection(displayRows, getTxRowId);
  const hasSelection = selection.selectedCount > 0;

  const selectedRows = useMemo(() => {
    const ids = new Set(selection.selectedIds);
    return processedRows.filter((row) => ids.has(String(row.id)));
  }, [processedRows, selection.selectedIds]);

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

  const openDealInfo = (row: SalesTransaction) => {
    setDealInfo(row);
    setView("deal");
  };

  const openView = (row: SalesTransaction) => {
    openDealInfo(row);
  };

  const openClientInfo = async (row: SalesTransaction) => {
    const customerId = Number(row.customer_id);
    if (!customerId) {
      toast.info("No client record is linked to this deal.");
      return;
    }
    try {
      const customer = await getCustomer(customerId, { silent: true });
      if (!customer) {
        toast.error("Unable to load client info.");
        return;
      }
      setClientInfo(customer);
      setView("client");
    } catch {
      toast.error("Unable to load client info.");
    }
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

  const applyWebDesignPrice = async (row: SalesTransaction, amount: number) => {
    try {
      const items = applyWebDesignPriceToItems(row.items, amount);
      const notes = buildWebDesignPricedNotes(row.notes, amount);
      await updateSalesTransaction(row.id, {
        items,
        notes,
        subtotal: amount,
        discount_total: 0,
        tax_total: 0,
        shipping_total: 0,
        grand_total: amount,
        payment_status: row.payment_status || "pending",
      });
      toast.success(`Web design price set for ${row.transaction_no}.`);
      setWebDesignPriceTarget(null);
      loadRows();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to set web design price.");
    }
  };

  const handleAction = async (row: SalesTransaction, action: string) => {
    if (action === "view") openDealInfo(row);
    else if (action === "pay") await markPaid(row);
    else if (action === "edit") openEdit(row);
    else if (action === "reject") setRejectTarget(row);
    else if (action === "assign") setAssignTarget(row);
    else if (action === "webdesign:set-price") setWebDesignPriceTarget(row);
    else if (action === "webdesign:upload-proposal") setProposalTarget(row);
    else if (action === "webdesign:proceed-payment") {
      try {
        await proceedWebDesignPayment(row.id);
        toast.success(`Payment requested for ${row.transaction_no}. The client was notified to upload proof of payment.`);
        loadRows();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to proceed to payment.");
      }
    }
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

  const renderStatusBadge = (row: SalesTransaction) => {
    if (isPendingQuotationTransaction(row)) {
      return <span className={styles.badgePending}>Pending Quotation</span>;
    }
    const label = paymentStatusLabel(row.payment_status);
    const paid = isPaidStatus(row.payment_status);
    return <span className={paid ? styles.badgePaid : styles.badgePending}>{label}</span>;
  };

  const renderAssignedBadge = (row: SalesTransaction) => {
    const label = assignedUserLabel(row) ?? "Unassigned";
    if (canAssign) {
      return (
        <button
          type="button"
          className={styles.tableCellLink}
          onClick={() => setAssignTarget(row)}
          title="Assign staff"
        >
          {label}
        </button>
      );
    }
    return <span className={styles.tableCellLink}>{label}</span>;
  };

  const renderOrderColumnCell = (row: SalesTransaction, column: TxColumnKey) => {
    if (column === "clientOwner") {
      return <td key={column} className={styles.dealsNowrap}>{renderAssignedBadge(row)}</td>;
    }
    if (column === "paymentStatus") {
      const label = orderAdminColumnValue(row, column, { assigned: assignedUserLabel(row) });
      const paid = label.toLowerCase() === "paid" || isPaidStatus(row.payment_status);
      return (
        <td key={column} className={styles.statusCell}>
          <span className={paid ? styles.badgePaid : styles.badgePending}>{label}</span>
        </td>
      );
    }
    if (column === "expectedRevenue") {
      return (
        <td key={column} className={styles.amountCell}>
          {orderAdminColumnValue(row, column, { assigned: assignedUserLabel(row) })}
        </td>
      );
    }
    if (column === "clientName") {
      const name = orderAdminColumnValue(row, column, { assigned: assignedUserLabel(row) });
      return (
        <td key={column} className={styles.dealsNowrap}>
          <button type="button" className={styles.tableCellLink} onClick={() => void openClientInfo(row)}>
            {name}
          </button>
        </td>
      );
    }
    if (column === "dealName") {
      const name = orderAdminColumnValue(row, column, { assigned: assignedUserLabel(row) });
      return (
        <td key={column} className={styles.dealsNowrap}>
          <button type="button" className={styles.tableCellLink} onClick={() => openDealInfo(row)}>
            {name}
          </button>
        </td>
      );
    }
    return (
      <td
        key={column}
        className={column === "collectionNote" ? undefined : styles.dealsNowrap}
      >
        {orderAdminColumnValue(row, column, { assigned: assignedUserLabel(row) })}
      </td>
    );
  };

  const renderHostingMeta = (row: SalesTransaction) => {
    if (!isHostingTransaction(row)) return null;
    const classified = parseHostingClassification(row.notes);
    if (!classified) return null;
    return <div className={styles.txHostingMeta}>{hostingClassificationLabel(row)}</div>;
  };

  const visibleOrderColumns = useMemo(
    () => TX_COLUMN_KEYS.filter((key) => columnsVisible[key]),
    [columnsVisible],
  );

  const visibleColumnCount = visibleOrderColumns.length + 1;

  const handleExportSelected = () => {
    if (selectedRows.length === 0 || exporting) return;
    setExporting(true);
    try {
      exportRowsToExcel(
        ["Invoice ID", ...TX_COLUMN_KEYS.map((key) => TX_COLUMN_LABELS[key]), "Order Type"],
        selectedRows.map((row) => [
          row.transaction_no,
          ...TX_COLUMN_KEYS.map((key) =>
            orderAdminColumnValue(row, key, { assigned: assignedUserLabel(row) }),
          ),
          transactionOrderType(row),
        ]),
        "deals",
      );
    } finally {
      setExporting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0 || bulkDeleting) return;
    setBulkDeleting(true);
    try {
      for (const row of selectedRows) {
        await deleteSalesTransaction(row.id);
      }
      toast.success(`${selectedRows.length} deal(s) deleted.`);
      selection.clearSelection();
      setBulkDeleteOpen(false);
      loadRows();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete selected deals.");
    } finally {
      setBulkDeleting(false);
    }
  };

  if (view === "deal" && dealInfo) {
    return (
      <section className={styles.panel}>
        <ClientOrderForm
          transaction={dealInfo}
          pageTitle="Deal Info"
          pageSubtitle="Deals"
          onBack={() => {
            setView("list");
            setDealInfo(null);
          }}
          onSaved={() => {
            setView("list");
            setDealInfo(null);
            loadRows();
          }}
        />
      </section>
    );
  }

  if (view === "client" && clientInfo) {
    return (
      <section className={styles.panel}>
        <ClientCrmForm
          mode="edit"
          client={clientInfo}
          pageTitle="Client Info"
          pageSubtitle="Deals"
          onBack={() => {
            setView("list");
            setClientInfo(null);
          }}
          onSaved={() => {
            setView("list");
            setClientInfo(null);
            loadRows();
          }}
        />
      </section>
    );
  }

  if (view === "create") {
    return (
      <section className={styles.panel}>
        <ClientOrderForm
          defaultCustomerId={createCustomerId}
          onBack={() => {
            setView("list");
            setCreateCustomerId(null);
          }}
          onSaved={() => {
            setView("list");
            setCreateCustomerId(null);
            setSortBy("date-desc");
            setPage(1);
            loadRows();
          }}
        />
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Deals</h3>
          <p className={styles.panelSubtitle}>
            Track client deals, owners, domains, and product categories.
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

      {queueFilter ? (
        <div className={styles.filterBanner}>
          <span>
            {queueFilter === "new"
              ? "Showing new deals in queue"
              : "Showing overdue invoices"}
          </span>
          <button type="button" className={styles.secondaryBtnSm} onClick={() => setQueueFilter(null)}>
            Clear filter
          </button>
        </div>
      ) : null}

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

      {hasSelection ? (
        <CommerceBulkSelectionBar
          selectedCount={selection.selectedCount}
          entityLabel="deal"
          exporting={exporting}
          deleting={bulkDeleting}
          onExport={handleExportSelected}
          onDelete={() => setBulkDeleteOpen(true)}
          onClear={selection.clearSelection}
        />
      ) : (
        <div className={styles.toolbarRow}>
          <div className={styles.toolbarFilters}>
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
                <div className={`${styles.colVisPanel} ${styles.dealsColVisPanel}`}>
                  <div className={styles.colVisTitle}>Toggle Columns</div>
                  {TX_COLUMN_VISIBILITY_KEYS.map((key) => (
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
          <button
            type="button"
            className={styles.primaryBtnSm}
            onClick={() => {
              setCreateCustomerId(null);
              setView("create");
            }}
          >
            <i className="fa-solid fa-plus" aria-hidden="true" /> Create Deal
          </button>
        </div>
      )}

      {loading ? (
        <p className={styles.emptyState}>Loading deals...</p>
      ) : (
        <TableFilterShell
          open={filterOpen}
          active={isTableFilterActive(appliedFilter)}
          total={totalCount}
          onToggle={() => setFilterOpen((open) => !open)}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search transactions..."
          dateRange={dateRange}
          onDateRangeChange={(next) => {
            setDateRange(next);
            setPage(1);
          }}
          panel={
            <TableFilterPanel
              rows={rows}
              fields={TX_FILTER_FIELDS}
              draft={draftFilter}
              applied={appliedFilter}
              getValue={getFilterValue}
              onDraftChange={setDraftFilter}
              onApply={() => {
                setAppliedFilter(draftFilter);
                setPage(1);
              }}
              onClear={() => {
                setDraftFilter(emptyTableFilter);
                setAppliedFilter(emptyTableFilter);
                setPage(1);
              }}
              onClose={() => setFilterOpen(false)}
              sortControl={
                <select
                  className={styles.selectInline}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as TxSortKey)}
                  aria-label="Sort transactions"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="amount-desc">Amount (High to Low)</option>
                  <option value="amount-asc">Amount (Low to High)</option>
                </select>
              }
            />
          }
        >
          {viewMode === "list" ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <CommerceSelectAllHead
                      allSelected={selection.allSelected}
                      someSelected={selection.someSelected}
                      onToggleAll={selection.toggleAll}
                      disabled={displayRows.length === 0}
                    />
                    {visibleOrderColumns.map((column) => renderSortableHead(column))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumnCount}>No deals found matching filter.</td>
                    </tr>
                  ) : (
                    displayRows.map((row) => (
                      <tr
                        key={row.id}
                        className={selection.isSelected(row) ? styles.rowSelected : undefined}
                      >
                        <CommerceSelectRowCell
                          checked={selection.isSelected(row)}
                          onChange={() => selection.toggleRow(row)}
                          label={`Select deal ${row.transaction_no}`}
                        />
                        {visibleOrderColumns.map((column) => renderOrderColumnCell(row, column))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.txGrid}>
              {displayRows.length === 0 ? (
                <p className={styles.emptyState}>No deals found matching filter.</p>
              ) : (
                displayRows.map((row) => (
                  <article key={row.id} className={styles.txGridCard}>
                    <div className={styles.txGridCardTop}>
                      <button
                        type="button"
                        className={styles.tableCellLink}
                        onClick={() => openView(row)}
                      >
                        {orderAdminColumnValue(row, "dealName", { assigned: assignedUserLabel(row) })}
                      </button>
                      {renderStatusBadge(row)}
                    </div>
                    <div>
                      <div className={styles.txGridLabel}>Client Owner</div>
                      <div className={styles.txGridValue}>{renderAssignedBadge(row)}</div>
                    </div>
                    <div>
                      <div className={styles.txGridLabel}>Client Name</div>
                      <div className={styles.txGridValue}>
                        <button
                          type="button"
                          className={styles.tableCellLink}
                          onClick={() => void openClientInfo(row)}
                        >
                          {orderAdminColumnValue(row, "clientName", { assigned: assignedUserLabel(row) })}
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className={styles.txGridLabel}>Deal Name</div>
                      <div className={styles.txGridValue}>
                        <button
                          type="button"
                          className={styles.tableCellLink}
                          onClick={() => openView(row)}
                        >
                          {orderAdminColumnValue(row, "dealName", { assigned: assignedUserLabel(row) })}
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className={styles.txGridLabel}>Domain Name</div>
                      <div className={styles.txGridValue}>
                        {orderAdminColumnValue(row, "domainName", { assigned: assignedUserLabel(row) })}
                      </div>
                    </div>
                    <div>
                      <div className={styles.txGridLabel}>Product Category</div>
                      <div className={styles.txGridValue}>
                        {orderAdminColumnValue(row, "productCategory", { assigned: assignedUserLabel(row) })}
                      </div>
                    </div>
                    <div className={styles.txGridFooter}>
                      <strong className={styles.amountCell}>{transactionAmountLabel(row)}</strong>
                      {salesRole && isPendingQuotationTransaction(row) && !isProposalSubmittedTransaction(row) ? (
                        <button
                          type="button"
                          className={styles.primaryBtnSm}
                          onClick={() => setProposalTarget(row)}
                        >
                          Upload Proposal
                        </button>
                      ) : salesRole && isProposalSignedTransaction(row) && isPendingQuotationTransaction(row) ? (
                        <button
                          type="button"
                          className={styles.primaryBtnSm}
                          onClick={() => void handleAction(row, "webdesign:proceed-payment")}
                        >
                          Proceed Payment
                        </button>
                      ) : isPendingQuotationTransaction(row) ? (
                        <span className={styles.badgePending}>Pending Quotation</span>
                      ) : !isPaidStatus(row.payment_status) ? (
                        <button type="button" className={styles.primaryBtnSm} onClick={() => void markPaid(row)}>
                          Mark Paid
                        </button>
                      ) : (
                        <span className={styles.statusActive}>Verified</span>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          <div className={styles.paginationBar}>
            <div className={styles.paginationInfo}>
              Showing {totalCount === 0 ? "0 to 0" : `${startNum} to ${endNum}`}
            </div>
            <div className={styles.paginationControls}>
              <button
                type="button"
                className={styles.secondaryBtnSm}
                disabled={page <= 1 || showAll || totalCount === 0}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                aria-label="Previous page"
              >
                <i className="fa-solid fa-chevron-left" aria-hidden="true" />
              </button>
              <span className={styles.paginationRange}>
                {showAll
                  ? totalCount === 0
                    ? "0 to 0"
                    : `1 to ${totalCount}`
                  : totalCount === 0
                    ? "0 to 0"
                    : `${startNum} to ${endNum}`}
              </span>
              <button
                type="button"
                className={styles.secondaryBtnSm}
                disabled={showAll || page >= totalPages || totalCount === 0}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                aria-label="Next page"
              >
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
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
        </TableFilterShell>
      )}

      <HostingTransactionModal
        open={!!hostingTarget}
        transaction={hostingTarget}
        onClose={() => setHostingTarget(null)}
        onSave={(classification) => {
          if (!hostingTarget) return;
          void applyHostingAction(hostingTarget, classification);
        }}
      />

      <SetWebDesignPriceModal
        open={!!webDesignPriceTarget}
        transaction={webDesignPriceTarget}
        onClose={() => setWebDesignPriceTarget(null)}
        onSave={(amount) => {
          if (!webDesignPriceTarget) return;
          void applyWebDesignPrice(webDesignPriceTarget, amount);
        }}
      />

      <UploadProposalModal
        open={!!proposalTarget}
        transaction={proposalTarget}
        uploading={uploadingProposal}
        onClose={() => setProposalTarget(null)}
        onUpload={async (file) => {
          if (!proposalTarget) return;
          try {
            setUploadingProposal(true);
            await uploadWebDesignProposal(proposalTarget.id, file);
            toast.success("Proposal quotation uploaded. The client can now download and sign it.");
            setProposalTarget(null);
            loadRows();
          } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to upload proposal.");
          } finally {
            setUploadingProposal(false);
          }
        }}
      />

      {neededOpen && neededActions.length > 0 ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCardWide}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Needed actions</h3>
                <p className={styles.panelSubtitle}>Latest web design requests assigned to you.</p>
              </div>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setNeededOpen(false)} aria-label="Close">
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Client</th>
                    <th>Needed Action</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {neededActions.map((item) => (
                    <tr key={item.row.id}>
                      <td>{item.row.transaction_no}</td>
                      <td>{item.row.customer_name || "—"}</td>
                      <td>
                        {item.action === "upload"
                          ? "Upload Proposal Quotation"
                          : "Proceed Payment — signed proposal received"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.primaryBtnSm}
                          onClick={() => {
                            setNeededOpen(false);
                            if (item.action === "upload") setProposalTarget(item.row);
                            else void handleAction(item.row, "webdesign:proceed-payment");
                          }}
                        >
                          {item.action === "upload" ? "Upload" : "Proceed"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {modalMode ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCardWide}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalMode === "view" ? "Deal Info" : "Edit Transaction"}
              </h3>
              <button type="button" className={styles.modalCloseBtn} onClick={closeModal} aria-label="Close">
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
            {modalMode === "view" && selected ? (
              <div className={styles.detailGrid}>
                <DetailField
                  label="Deal Name"
                  value={orderAdminColumnValue(selected, "dealName", { assigned: assignedUserLabel(selected) })}
                />
                <DetailField label="Client Name" value={selected.customer_name} />
                <DetailField
                  label="Domain Name"
                  value={orderAdminColumnValue(selected, "domainName", { assigned: assignedUserLabel(selected) })}
                />
                <DetailField
                  label="Product Category"
                  value={orderAdminColumnValue(selected, "productCategory", { assigned: assignedUserLabel(selected) })}
                />
                <DetailField label="Assigned To" value={assignedUserLabel(selected)} />
                <DetailField label="Email" value={selected.customer_email} />
                <DetailField label="Invoice ID" value={selected.transaction_no} />
                <DetailField label="Service" value={transactionItemSummary(selected)} />
                {isWebDesignTransaction(selected) ? (
                  <>
                    <DetailField label="Selected Service" value="Web Design" />
                    <DetailField
                      label="Template Name"
                      value={parseWebDesignMeta(selected.notes)?.templateLabel || "—"}
                    />
                    <DetailField
                      label="Additional Services"
                      value={
                        webDesignAdditionalServicesLabel(parseWebDesignMeta(selected.notes)) || "—"
                      }
                    />
                    {(selected.items ?? []).map((item, index) => (
                      <DetailField
                        key={`${item.name}-${index}`}
                        label={`Service item: ${item.name}`}
                        value={
                          isPendingQuotationTransaction(selected)
                            ? "Pending Quotation"
                            : `₱${Number(item.total_price ?? item.price ?? 0).toLocaleString("en-PH", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                        }
                      />
                    ))}
                    <DetailField label="Total Order Amount" value={transactionAmountLabel(selected)} />
                  </>
                ) : null}
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
                <DetailField label="Amount" value={transactionAmountLabel(selected)} />
                <DetailField
                  label="Payment Status"
                  value={
                    isPendingQuotationTransaction(selected)
                      ? "Pending Quotation"
                      : paymentStatusLabel(selected.payment_status)
                  }
                />
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

      <ConfirmModal
        show={bulkDeleteOpen}
        title="Delete deals"
        message={
          <>
            Delete <strong>{selection.selectedCount}</strong> selected deal
            {selection.selectedCount === 1 ? "" : "s"}? This cannot be undone.
          </>
        }
        confirmLabel={bulkDeleting ? "Deleting..." : "Delete"}
        danger
        onConfirm={() => {
          if (!bulkDeleting) void handleBulkDelete();
        }}
        onCancel={() => {
          if (!bulkDeleting) setBulkDeleteOpen(false);
        }}
      />

      <AssignTransactionModal
        open={!!assignTarget}
        transaction={assignTarget}
        restrictRoles={
          assignTarget && isWebDesignTransaction(assignTarget)
            ? ["sales_staff", "sales_admin"]
            : undefined
        }
        onClose={() => setAssignTarget(null)}
        onAssigned={(updated) => {
          setRows((current) =>
            current.map((row) => (row.id === updated.id ? { ...row, ...updated } : row))
          );
          setAssignTarget(null);
        }}
      />
    </section>
  );
}

function DetailField({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={wide ? styles.detailFieldWide : styles.detailField}>
      <span className={styles.detailLabel}>{label}</span>
      <strong className={wide ? styles.detailValueMultiline : undefined}>{value || "—"}</strong>
    </div>
  );
}
