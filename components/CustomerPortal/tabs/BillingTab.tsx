import { useCallback, useEffect, useMemo, useState } from "react";
import PortalTabLoader from "@/components/CustomerPortal/PortalTabLoader";
import PortalBulkSelectionBar from "@/components/CustomerPortal/PortalBulkSelectionBar";
import PortalSortableTableHead from "@/components/CustomerPortal/PortalSortableTableHead";
import {
  PortalSelectAllHead,
  PortalSelectRowCell,
} from "@/components/CustomerPortal/PortalSelectCells";
import BillingPaymentModal from "@/components/CustomerPortal/BillingPaymentModal";
import BillingPaymentProofListModal from "@/components/CustomerPortal/BillingPaymentProofListModal";
import BillingPaymentProofModal from "@/components/CustomerPortal/BillingPaymentProofModal";
import TableFilterPanel, { TableFilterShell } from "@/components/shared/TableFilterPanel";
import { useRowSelection } from "@/lib/useRowSelection";
import { exportRowsToExcel } from "@/lib/commerceAdmin/exportTableExcel";
import { formatPeso } from "@/lib/customerPortal/mockData";
import {
  addPortalFunds,
  deletePortalPaymentProof,
  fetchPortalBilling,
  notifyPortalNotificationsUpdated,
  payPortalInvoice,
  uploadPortalPaymentProof,
} from "@/services/customerPortalService";
import type { PortalInvoice, PortalPaymentProof } from "@/lib/customerPortal/types";
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

type PaymentModalState =
  | { open: false }
  | {
      open: true;
      mode: "invoice" | "add-funds";
      invoiceId?: string;
      title?: string;
      amount?: number;
      submitLabel?: string;
    };

type ProofModalState =
  | { open: false }
  | {
      open: true;
      invoiceId: string;
      invoiceLabel?: string;
    };

type ProofListModalState =
  | { open: false }
  | {
      open: true;
      invoiceId: string;
      invoiceLabel?: string;
    };

type InvoiceColumnKey = "id" | "service" | "plan" | "issued" | "due" | "amount" | "status";
type InvoiceSortKey =
  | "id-asc"
  | "id-desc"
  | "service-asc"
  | "service-desc"
  | "plan-asc"
  | "plan-desc"
  | "issued-asc"
  | "issued-desc"
  | "due-asc"
  | "due-desc"
  | "amount-asc"
  | "amount-desc"
  | "status-asc"
  | "status-desc";

const INVOICE_FILTER_FIELDS: TableFilterFieldDef[] = [
  { id: "status", label: "Status" },
  { id: "serviceName", label: "Service Name" },
  { id: "plan", label: "Plan" },
  { id: "id", label: "Invoice ID", mode: "contains" },
  { id: "transactionNo", label: "Transaction No", mode: "contains" },
];

const INVOICE_SORT_ASC: Record<InvoiceColumnKey, InvoiceSortKey> = {
  id: "id-asc",
  service: "service-asc",
  plan: "plan-asc",
  issued: "issued-asc",
  due: "due-asc",
  amount: "amount-asc",
  status: "status-asc",
};

const INVOICE_SORT_DESC: Record<InvoiceColumnKey, InvoiceSortKey> = {
  id: "id-desc",
  service: "service-desc",
  plan: "plan-desc",
  issued: "issued-desc",
  due: "due-desc",
  amount: "amount-desc",
  status: "status-desc",
};

function invoiceServiceLabel(inv: PortalInvoice) {
  return String(inv.serviceName ?? inv.items ?? "");
}

function invoicePlanLabel(inv: PortalInvoice) {
  return String(inv.plan ?? inv.subscription ?? "");
}

function sortPortalInvoices(rows: PortalInvoice[], sortBy: InvoiceSortKey) {
  const copy = [...rows];
  copy.sort((a, b) => {
    const compareText = (left: string, right: string, desc: boolean) => {
      const result = left.localeCompare(right);
      return desc ? -result : result;
    };

    if (sortBy.startsWith("id")) return compareText(a.id, b.id, sortBy === "id-desc");
    if (sortBy.startsWith("service")) {
      return compareText(invoiceServiceLabel(a), invoiceServiceLabel(b), sortBy === "service-desc");
    }
    if (sortBy.startsWith("plan")) {
      return compareText(invoicePlanLabel(a), invoicePlanLabel(b), sortBy === "plan-desc");
    }
    if (sortBy.startsWith("issued")) return compareText(a.date, b.date, sortBy === "issued-desc");
    if (sortBy.startsWith("due")) return compareText(a.due, b.due, sortBy === "due-desc");
    if (sortBy.startsWith("amount")) {
      return sortBy === "amount-desc" ? b.amount - a.amount : a.amount - b.amount;
    }
    if (sortBy.startsWith("status")) return compareText(a.status, b.status, sortBy === "status-desc");
    return 0;
  });
  return copy;
}

function toggleInvoiceSort(current: InvoiceSortKey, column: InvoiceColumnKey): InvoiceSortKey {
  const asc = INVOICE_SORT_ASC[column];
  const desc = INVOICE_SORT_DESC[column];
  return current === asc ? desc : asc;
}

function invoiceSortDirection(sortBy: InvoiceSortKey, column: InvoiceColumnKey): "asc" | "desc" | null {
  if (sortBy === INVOICE_SORT_ASC[column]) return "asc";
  if (sortBy === INVOICE_SORT_DESC[column]) return "desc";
  return null;
}

function invoiceStatusClass(status: PortalInvoice["status"]) {
  if (status === "Paid") return styles.badgeGreen;
  if (status === "Overdue") return styles.badgeAmber;
  if (status === "Payment Due") return styles.badgeBlue;
  return styles.badgeAmber;
}

export default function BillingTab() {
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [paymentProofs, setPaymentProofs] = useState<PortalPaymentProof[]>([]);
  const [reminder, setReminder] = useState<{
    invoiceId: string;
    title: string;
    dueDate: string;
    amount: number;
    headline?: string;
    buttonLabel?: string;
    canPay?: boolean;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>(emptyDateRange);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilter, setDraftFilter] = useState<TableFilterState>(emptyTableFilter);
  const [appliedFilter, setAppliedFilter] = useState<TableFilterState>(emptyTableFilter);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [paymentModal, setPaymentModal] = useState<PaymentModalState>({ open: false });
  const [proofModal, setProofModal] = useState<ProofModalState>({ open: false });
  const [proofListModal, setProofListModal] = useState<ProofListModalState>({ open: false });
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<InvoiceSortKey>("issued-desc");
  const PAGE_SIZE = 10;

  const payableInvoices = useMemo(
    () => invoices.filter((inv) => inv.status !== "Paid"),
    [invoices]
  );

  const proofsByInvoice = useMemo(() => {
    const map = new Map<string, PortalPaymentProof[]>();
    paymentProofs.forEach((proof) => {
      const list = map.get(proof.invoiceId) ?? [];
      list.push(proof);
      map.set(proof.invoiceId, list);
    });
    return map;
  }, [paymentProofs]);

  const getInvoiceFilterValue = useCallback((inv: PortalInvoice, fieldId: string) => {
    switch (fieldId) {
      case "status":
        return inv.status;
      case "serviceName":
        return invoiceServiceLabel(inv);
      case "plan":
        return invoicePlanLabel(inv);
      case "id":
        return inv.id;
      case "transactionNo":
        return inv.transactionNo ?? "";
      default:
        return "";
    }
  }, []);

  const filteredInvoices = useMemo(() => {
    let rows = invoices.filter((inv) => {
      if (!rowMatchesDateRange(inv.date, dateRange)) return false;
      return rowMatchesSearch(
        [inv.id, inv.serviceName, inv.items, inv.plan, inv.subscription, inv.status, inv.transactionNo],
        search,
      );
    });
    rows = applyTableFilter(rows, appliedFilter, INVOICE_FILTER_FIELDS, getInvoiceFilterValue);
    return sortPortalInvoices(rows, sortBy);
  }, [invoices, search, dateRange, appliedFilter, sortBy, getInvoiceFilterValue]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredInvoices.slice(start, start + PAGE_SIZE);
  }, [filteredInvoices, page]);

  const getInvoiceRowId = useCallback((inv: PortalInvoice) => String(inv.id), []);
  const selection = useRowSelection(paginatedInvoices, getInvoiceRowId);
  const hasSelection = selection.selectedCount > 0;

  const selectedInvoices = useMemo(() => {
    const ids = new Set(selection.selectedIds);
    return filteredInvoices.filter((inv) => ids.has(String(inv.id)));
  }, [filteredInvoices, selection.selectedIds]);

  const rangeStart = filteredInvoices.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, filteredInvoices.length);

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

  const loadBilling = useCallback(
    (filters?: { dateFrom?: string; dateTo?: string }) =>
      fetchPortalBilling(filters)
        .then((data) => {
          setInvoices(data.invoices ?? []);
          setPaymentProofs(data.paymentProofs ?? []);
          setReminder(data.reminder ?? null);
          return data;
        })
        .catch((err: any) => {
          const status = err?.response?.status;
          const message =
            status === 403
              ? "Customer portal access only. Please sign in with a customer account."
              : err?.response?.data?.message || "Failed to load billing.";
          toast.error(message);
          setInvoices([]);
          setPaymentProofs([]);
          setReminder(null);
          return { invoices: [], reminder: null, paymentProofs: [] } as Awaited<
            ReturnType<typeof fetchPortalBilling>
          >;
        }),
    [],
  );

  useEffect(() => {
    loadBilling().finally(() => setLoading(false));
  }, [loadBilling]);

  const handleDateRangeChange = (next: DateRangeValue) => {
    setDateRange(next);
    setLoading(true);
    loadBilling({
      dateFrom: next.from || undefined,
      dateTo: next.to || undefined,
    }).finally(() => setLoading(false));
  };

  const openInvoicePayment = (payload: {
    invoiceId: string;
    title?: string;
    amount?: number;
    canPay?: boolean;
    submitLabel?: string;
  }) => {
    if (payload.canPay === false) {
      toast.info("Payment is not available yet for this invoice.");
      return;
    }

    setPaymentModal({
      open: true,
      mode: "invoice",
      invoiceId: payload.invoiceId,
      title: payload.title,
      amount: payload.amount,
      submitLabel: payload.submitLabel ?? "Pay Now",
    });
  };

  const openProofModal = (inv: PortalInvoice) => {
    setProofModal({
      open: true,
      invoiceId: inv.id,
      invoiceLabel: `${inv.id} (${inv.plan ?? inv.subscription})`,
    });
  };

  const openProofListModal = (inv: PortalInvoice) => {
    setProofListModal({
      open: true,
      invoiceId: inv.id,
      invoiceLabel: `${inv.id} (${inv.plan ?? inv.subscription})`,
    });
  };

  const handleInvoiceAction = (inv: PortalInvoice, action: string) => {
    if (action === "pay") {
      openInvoicePayment({
        invoiceId: inv.id,
        title: inv.plan ?? inv.subscription,
        amount: inv.amount,
        canPay: inv.canPay,
        submitLabel: reminder?.invoiceId === inv.id ? reminder.buttonLabel : "Pay Now",
      });
      return;
    }

    if (action === "proof") {
      openProofModal(inv);
      return;
    }

    if (action === "view-proofs") {
      openProofListModal(inv);
      return;
    }

    if (action === "orders") {
      window.location.assign("/public/dashboard?tab=orders");
    }
  };

  const openInvoicePrimary = (inv: PortalInvoice) => {
    const invoiceProofs = proofsByInvoice.get(inv.id) ?? [];
    if (inv.status !== "Paid") {
      handleInvoiceAction(inv, "pay");
      return;
    }
    if (invoiceProofs.length > 0) {
      handleInvoiceAction(inv, "view-proofs");
      return;
    }
    handleInvoiceAction(inv, "orders");
  };

  const handleExportSelected = () => {
    if (selectedInvoices.length === 0 || exporting) return;
    setExporting(true);
    try {
      exportRowsToExcel(
        ["Invoice ID", "Service Name", "Plan", "Issued", "Due Date", "Amount", "Status"],
        selectedInvoices.map((inv) => [
          inv.id,
          inv.serviceName ?? inv.items ?? "",
          inv.plan ?? inv.subscription ?? "",
          inv.date,
          inv.due,
          formatPeso(inv.amount),
          inv.status,
        ]),
        "my-billing",
      );
    } finally {
      setExporting(false);
    }
  };

  const handlePaymentSubmit = async (paymentMethod: string, amount?: number) => {
    try {
      setSubmitting(true);

      if (paymentModal.open && paymentModal.mode === "add-funds") {
        const fundAmount = amount ?? 0;
        if (fundAmount < 100) {
          toast.warning("Minimum add funds amount is ₱100.");
          return;
        }

        const result = await addPortalFunds({ amount: fundAmount, paymentMethod });
        toast.success(result?.message || "Add funds request submitted.");
      } else if (paymentModal.open && paymentModal.mode === "invoice") {
        const result = await payPortalInvoice({
          invoiceId: paymentModal.invoiceId || "",
          paymentMethod,
        });
        toast.success(result?.message || "Payment initiated.");
      } else {
        return;
      }

      setPaymentModal({ open: false });
      notifyPortalNotificationsUpdated();
      window.location.assign("/public/dashboard?tab=orders");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Payment could not be started.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadProof = async (payload: { invoiceId: string; notes: string; file: File }) => {
    try {
      setUploadingProof(true);
      const result = await uploadPortalPaymentProof({
        invoiceId: payload.invoiceId,
        notes: payload.notes || undefined,
        receipt: payload.file,
      });
      toast.success(result?.message || "Payment proof uploaded.");
      setProofModal({ open: false });
      notifyPortalNotificationsUpdated();
      await loadBilling({ dateFrom: dateRange.from || undefined, dateTo: dateRange.to || undefined });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not upload payment proof.");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleDeleteProof = async (proof: PortalPaymentProof) => {
    if (!proof.recordId) return;
    if (!window.confirm("Delete this payment proof?")) return;

    try {
      await deletePortalPaymentProof(proof.recordId);
      toast.success("Payment proof deleted.");
      const data = await loadBilling({
        dateFrom: dateRange.from || undefined,
        dateTo: dateRange.to || undefined,
      });
      if (proofListModal.open && proofListModal.invoiceId === proof.invoiceId) {
        const remaining = (data.paymentProofs ?? []).filter((item) => item.invoiceId === proof.invoiceId);
        if (remaining.length === 0) {
          setProofListModal({ open: false });
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not delete payment proof.");
    }
  };

  if (loading && invoices.length === 0) {
    return <PortalTabLoader label="Loading billing..." />;
  }

  return (
    <div className={styles.tabStack}>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>Billing Invoices &amp; Receipts</h2>
            <p className={styles.panelSub}>
              Secure payment processing via GCash, Maya, and Corporate Bank Wire.
            </p>
          </div>
          <button
            type="button"
            className={styles.primaryBtnSm}
            onClick={() => setPaymentModal({ open: true, mode: "add-funds" })}
          >
            Add Funds
          </button>
        </div>

        {reminder ? (
          <div className={styles.reminderBanner}>
            <div className={styles.reminderIcon}>!</div>
            <div>
              <h3 className={styles.reminderTitle}>{reminder.headline ?? "Payment Due Soon"}</h3>
              <p className={styles.reminderText}>
                Invoice <span className={styles.monoBlue}>{reminder.invoiceId}</span> ({reminder.title}) is due on{" "}
                {reminder.dueDate}. Please complete payment or renew subscription to avoid interruption.
              </p>
            </div>
            <button
              type="button"
              className={styles.amberBtn}
              disabled={!reminder.canPay}
              onClick={() =>
                openInvoicePayment({
                  invoiceId: reminder.invoiceId,
                  title: reminder.title,
                  amount: reminder.amount,
                  canPay: reminder.canPay,
                  submitLabel: reminder.buttonLabel,
                })
              }
            >
              {reminder.buttonLabel ?? "Pay & Renew"}
            </button>
          </div>
        ) : null}

        {hasSelection ? (
          <PortalBulkSelectionBar
            selectedCount={selection.selectedCount}
            entityLabel="invoice"
            exporting={exporting}
            onExport={handleExportSelected}
            onClear={selection.clearSelection}
          />
        ) : null}

        <TableFilterShell
          open={filterOpen}
          active={isTableFilterActive(appliedFilter)}
          total={filteredInvoices.length}
          onToggle={() => setFilterOpen((o) => !o)}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search invoices..."
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          sortControl={
            <select
              className={styles.portalToolbarControl}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as InvoiceSortKey)}
              aria-label="Sort invoices"
            >
              <option value="issued-desc">Issued (Newest)</option>
              <option value="issued-asc">Issued (Oldest)</option>
              <option value="due-desc">Due Date (Latest)</option>
              <option value="due-asc">Due Date (Earliest)</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
              <option value="status-asc">Status (A-Z)</option>
              <option value="id-asc">Invoice ID (A-Z)</option>
            </select>
          }
          panel={
            <TableFilterPanel
              rows={invoices}
              fields={INVOICE_FILTER_FIELDS}
              draft={draftFilter}
              applied={appliedFilter}
              getValue={getInvoiceFilterValue}
              onDraftChange={setDraftFilter}
              onApply={applyFilter}
              onClear={clearFilter}
              onClose={() => setFilterOpen(false)}
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
                    disabled={paginatedInvoices.length === 0}
                  />
                  <PortalSortableTableHead
                    label="Invoice ID"
                    active={invoiceSortDirection(sortBy, "id") !== null}
                    direction={invoiceSortDirection(sortBy, "id") ?? "asc"}
                    onClick={() => setSortBy((current) => toggleInvoiceSort(current, "id"))}
                  />
                  <PortalSortableTableHead
                    label="Service Name"
                    active={invoiceSortDirection(sortBy, "service") !== null}
                    direction={invoiceSortDirection(sortBy, "service") ?? "asc"}
                    onClick={() => setSortBy((current) => toggleInvoiceSort(current, "service"))}
                  />
                  <PortalSortableTableHead
                    label="Plan"
                    active={invoiceSortDirection(sortBy, "plan") !== null}
                    direction={invoiceSortDirection(sortBy, "plan") ?? "asc"}
                    onClick={() => setSortBy((current) => toggleInvoiceSort(current, "plan"))}
                  />
                  <PortalSortableTableHead
                    label="Issued"
                    active={invoiceSortDirection(sortBy, "issued") !== null}
                    direction={invoiceSortDirection(sortBy, "issued") ?? "asc"}
                    onClick={() => setSortBy((current) => toggleInvoiceSort(current, "issued"))}
                  />
                  <PortalSortableTableHead
                    label="Due Date"
                    active={invoiceSortDirection(sortBy, "due") !== null}
                    direction={invoiceSortDirection(sortBy, "due") ?? "asc"}
                    onClick={() => setSortBy((current) => toggleInvoiceSort(current, "due"))}
                  />
                  <PortalSortableTableHead
                    label="Amount"
                    active={invoiceSortDirection(sortBy, "amount") !== null}
                    direction={invoiceSortDirection(sortBy, "amount") ?? "asc"}
                    onClick={() => setSortBy((current) => toggleInvoiceSort(current, "amount"))}
                  />
                  <PortalSortableTableHead
                    label="Status"
                    active={invoiceSortDirection(sortBy, "status") !== null}
                    direction={invoiceSortDirection(sortBy, "status") ?? "asc"}
                    onClick={() => setSortBy((current) => toggleInvoiceSort(current, "status"))}
                  />
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9}>No invoices found for the selected filters.</td>
                  </tr>
                ) : (
                  paginatedInvoices.map((inv) => {
                    const invoiceProofs = proofsByInvoice.get(inv.id) ?? [];

                    return (
                      <tr
                        key={inv.id}
                        className={selection.isSelected(inv) ? styles.rowSelected : undefined}
                      >
                        <PortalSelectRowCell
                          checked={selection.isSelected(inv)}
                          onChange={() => selection.toggleRow(inv)}
                          label={`Select invoice ${inv.id}`}
                        />
                        <td className={styles.monoBlue}>
                          <button
                            type="button"
                            className={styles.tableCellLink}
                            onClick={() => openInvoicePrimary(inv)}
                          >
                            {inv.id}
                          </button>
                        </td>
                        <td className={styles.serviceNameBold}>{inv.serviceName ?? inv.items}</td>
                        <td>{inv.plan ?? inv.subscription}</td>
                        <td>{inv.date}</td>
                        <td>{inv.due}</td>
                        <td className={styles.monoBold}>{formatPeso(inv.amount)}</td>
                        <td>
                          <span className={invoiceStatusClass(inv.status)}>{inv.status}</span>
                        </td>
                        <td className={styles.billingActionsCell}>
                          <select
                            className={styles.billingActionsSelect}
                            defaultValue=""
                            onChange={(e) => {
                              const value = e.target.value;
                              if (!value) return;
                              handleInvoiceAction(inv, value);
                              e.target.value = "";
                            }}
                            aria-label={`Actions for ${inv.id}`}
                          >
                            <option value="" disabled hidden>
                              Actions...
                            </option>
                            {invoiceProofs.length > 0 ? (
                              <option value="view-proofs">
                                View Uploaded Receipts ({invoiceProofs.length})
                              </option>
                            ) : null}
                            {inv.status !== "Paid" ? (
                              <>
                                <option value="pay" disabled={!inv.canPay}>
                                  {inv.canPay ? "Pay Now" : "Pay Now (not due yet)"}
                                </option>
                                <option value="proof">Submit Payment Proof</option>
                              </>
                            ) : (
                              <option value="proof">Submit Payment Proof</option>
                            )}
                            <option value="orders">View Orders</option>
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
            <div className={styles.paginationInfo}>Total Records {filteredInvoices.length}</div>
            <div className={styles.paginationControls}>
              <button
                type="button"
                className={styles.secondaryBtnSm}
                disabled={page <= 1 || filteredInvoices.length === 0}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                aria-label="Previous page"
              >
                <i className="fa-solid fa-chevron-left" aria-hidden="true" />
              </button>
              <span className={styles.paginationRange}>
                {filteredInvoices.length === 0 ? "0 to 0" : `${rangeStart} to ${rangeEnd}`}
              </span>
              <button
                type="button"
                className={styles.secondaryBtnSm}
                disabled={page >= totalPages || filteredInvoices.length === 0}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                aria-label="Next page"
              >
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        </TableFilterShell>
      </section>

      <BillingPaymentModal
        open={paymentModal.open}
        mode={paymentModal.open ? paymentModal.mode : "invoice"}
        invoiceId={paymentModal.open ? paymentModal.invoiceId : undefined}
        title={paymentModal.open ? paymentModal.title : undefined}
        amount={paymentModal.open ? paymentModal.amount : undefined}
        submitLabel={paymentModal.open ? paymentModal.submitLabel : "Pay Now"}
        submitting={submitting}
        onClose={() => setPaymentModal({ open: false })}
        onSubmit={handlePaymentSubmit}
      />

      <BillingPaymentProofModal
        open={proofModal.open}
        invoiceId={proofModal.open ? proofModal.invoiceId : ""}
        invoiceLabel={proofModal.open ? proofModal.invoiceLabel : undefined}
        payableInvoices={payableInvoices}
        uploading={uploadingProof}
        onClose={() => setProofModal({ open: false })}
        onSubmit={handleUploadProof}
      />

      <BillingPaymentProofListModal
        open={proofListModal.open}
        invoiceId={proofListModal.open ? proofListModal.invoiceId : ""}
        invoiceLabel={proofListModal.open ? proofListModal.invoiceLabel : undefined}
        proofs={
          proofListModal.open ? proofsByInvoice.get(proofListModal.invoiceId) ?? [] : []
        }
        onClose={() => setProofListModal({ open: false })}
        onDelete={handleDeleteProof}
      />
    </div>
  );
}
