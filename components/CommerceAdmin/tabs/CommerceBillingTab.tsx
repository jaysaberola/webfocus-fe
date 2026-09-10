import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ClientCrmForm from "@/components/CommerceAdmin/ClientCrmForm";
import ClientInvoiceForm from "@/components/CommerceAdmin/ClientInvoiceForm";
import CommerceBulkSelectionBar from "@/components/CommerceAdmin/CommerceBulkSelectionBar";
import {
  CommerceSelectAllHead,
  CommerceSelectRowCell,
} from "@/components/CommerceAdmin/CommerceSelectCells";
import ConfirmModal from "@/components/UI/ConfirmModal";
import ResizableTableFrame from "@/components/UI/ResizableTableFrame";
import TableFilterPanel, { TableFilterShell } from "@/components/shared/TableFilterPanel";
import {
  buildGlobalInvoiceRows,
  customerRowFromTransaction,
  DEFAULT_INVOICE_COLUMNS,
  INVOICE_COLUMN_LABELS,
  INVOICE_COLUMN_VISIBILITY_KEYS,
  invoiceCellValue,
  type ClientInvoiceRow,
  type InvoiceColumnKey,
} from "@/lib/commerceAdmin/clientInvoiceHelpers";
import { exportRowsToExcel } from "@/lib/commerceAdmin/exportTableExcel";
import { usePersistedColumnVisibility } from "@/lib/commerceAdmin/usePersistedColumnVisibility";
import {
  emptyDateRange,
  rowMatchesDateRange,
  rowMatchesSearch,
  type DateRangeValue,
} from "@/lib/dateRangeHelpers";
import { toast } from "@/lib/toast";
import {
  applyTableFilter,
  emptyTableFilter,
  isTableFilterActive,
  type TableFilterFieldDef,
  type TableFilterState,
} from "@/lib/tableFilterHelpers";
import { useRowSelection } from "@/lib/useRowSelection";
import { getCustomer, type CustomerRow } from "@/services/customerService";
import {
  deleteSalesTransaction,
  getSalesTransactions,
  type SalesTransaction,
} from "@/services/salesTransactionService";
import styles from "@/styles/commerceAdmin.module.css";

const INVOICE_PAGE_SIZE = 10;

const INVOICE_FILTER_FIELDS: TableFilterFieldDef[] = [
  { id: "clientName", label: "Client Name", mode: "contains" },
  { id: "billingInCharge", label: "Billing-in-Charge" },
  { id: "subject", label: "Product Category", mode: "contains" },
  { id: "status", label: "Status" },
  { id: "wsiInvoiceNumber", label: "WSI Invoice Number", mode: "contains" },
];

const getInvoiceRowId = (row: ClientInvoiceRow) => row.id;

export default function CommerceBillingTab() {
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [rows, setRows] = useState<ClientInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "create" | "edit" | "client">("list");
  const [formClient, setFormClient] = useState<CustomerRow | null>(null);
  const [clientInfo, setClientInfo] = useState<CustomerRow | null>(null);
  const [editTransaction, setEditTransaction] = useState<SalesTransaction | null>(null);
  const [columnsVisible, setColumnsVisible] = usePersistedColumnVisibility(
    "commerceAdmin:columnVisibility:billingInvoices:v1",
    DEFAULT_INVOICE_COLUMNS,
  );
  const [colVisOpen, setColVisOpen] = useState(false);
  const colVisRef = useRef<HTMLDivElement>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>(emptyDateRange);
  const [draftFilter, setDraftFilter] = useState<TableFilterState>(emptyTableFilter);
  const [appliedFilter, setAppliedFilter] = useState<TableFilterState>(emptyTableFilter);
  const [exporting, setExporting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSalesTransactions({ per_page: 200 }, { silent: true });
      const list = Array.isArray(res?.data) ? (res.data as SalesTransaction[]) : [];
      setTransactions(list);
      setRows(buildGlobalInvoiceRows(list));
    } catch {
      setTransactions([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (colVisRef.current && !colVisRef.current.contains(event.target as Node)) {
        setColVisOpen(false);
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const getFilterValue = useCallback((invoice: ClientInvoiceRow, fieldId: string) => {
    switch (fieldId) {
      case "clientName":
        return invoice.clientName;
      case "billingInCharge":
        return invoice.billingInCharge;
      case "subject":
        return invoice.subject;
      case "status":
        return invoice.status;
      case "wsiInvoiceNumber":
        return invoice.wsiInvoiceNumber;
      default:
        return "";
    }
  }, []);

  const processedRows = useMemo(() => {
    return applyTableFilter(rows, appliedFilter, INVOICE_FILTER_FIELDS, getFilterValue)
      .filter((invoice) =>
        rowMatchesSearch(
          [
            invoice.clientName,
            invoice.billingInCharge,
            invoice.subject,
            invoice.invoiceDate,
            invoice.dueDate,
            invoice.collectionDate,
            invoice.wsiInvoiceNumber,
            invoice.officialReceipt,
            invoice.status,
            invoice.grandTotal,
          ],
          search,
        ),
      )
      .filter((invoice) => rowMatchesDateRange(invoice.invoiceDate, dateRange));
  }, [rows, appliedFilter, getFilterValue, search, dateRange]);

  const totalPages = Math.max(1, Math.ceil(processedRows.length / INVOICE_PAGE_SIZE));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * INVOICE_PAGE_SIZE;
    return processedRows.slice(start, start + INVOICE_PAGE_SIZE);
  }, [processedRows, page]);

  const selection = useRowSelection(paginatedRows, getInvoiceRowId);
  const hasSelection = selection.selectedCount > 0;
  const selectedRows = useMemo(() => {
    const ids = new Set(selection.selectedIds);
    return processedRows.filter((row) => ids.has(String(row.id)));
  }, [processedRows, selection.selectedIds]);

  const visibleColumns = useMemo(
    () => INVOICE_COLUMN_VISIBILITY_KEYS.filter((key) => columnsVisible[key]),
    [columnsVisible],
  );
  const visibleColumnCount = visibleColumns.length + 1;
  const rangeStart = processedRows.length ? (page - 1) * INVOICE_PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * INVOICE_PAGE_SIZE, processedRows.length);

  useEffect(() => {
    setPage(1);
  }, [appliedFilter, search, dateRange]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const backToList = () => {
    setView("list");
    setFormClient(null);
    setClientInfo(null);
    setEditTransaction(null);
  };

  const openCreateInvoice = () => {
    setEditTransaction(null);
    setFormClient({
      id: 0,
      name: "",
      email: "",
      role: "customer",
      status: "Active",
    });
    setView("create");
  };

  const openEditInvoice = (transaction: SalesTransaction) => {
    setEditTransaction(transaction);
    setFormClient(customerRowFromTransaction(transaction));
    setView("edit");
  };

  const openClientInfo = async (invoice: ClientInvoiceRow) => {
    const transaction = transactions.find((row) => row.id === invoice.transactionId);
    const customerId = Number(transaction?.customer_id ?? transaction?.customer?.id ?? 0);
    if (!customerId) {
      toast.info("No client record is linked to this invoice.");
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

  const handleExportSelected = () => {
    if (selectedRows.length === 0 || exporting) return;
    setExporting(true);
    try {
      exportRowsToExcel(
        visibleColumns.map((key) => INVOICE_COLUMN_LABELS[key]),
        selectedRows.map((invoice) =>
          visibleColumns.map((key) => invoiceCellValue(invoice, key)),
        ),
        "invoices",
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
        await deleteSalesTransaction(row.transactionId);
      }
      toast.success(
        `${selectedRows.length} invoice${selectedRows.length === 1 ? "" : "s"} deleted.`,
      );
      selection.clearSelection();
      setBulkDeleteOpen(false);
      await loadInvoices();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message || "")
          : "";
      toast.error(message || "Failed to delete selected invoices.");
    } finally {
      setBulkDeleting(false);
    }
  };

  if (view === "client" && clientInfo) {
    return (
      <section className={styles.panel}>
        <ClientCrmForm
          mode="edit"
          client={clientInfo}
          pageTitle="Client Info"
          pageSubtitle="Invoices"
          onBack={backToList}
          onSaved={() => {
            backToList();
            void loadInvoices();
          }}
        />
      </section>
    );
  }

  if ((view === "create" || view === "edit") && formClient) {
    return (
      <section className={styles.panel}>
        <ClientInvoiceForm
          client={formClient}
          transaction={view === "edit" ? editTransaction : null}
          onBack={backToList}
          onSaved={(options) => {
            void loadInvoices();
            if (options?.andNew) {
              setEditTransaction(null);
              setView("create");
              return;
            }
            backToList();
          }}
        />
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Invoices</h3>
          <p className={styles.panelSubtitle}>
            Track billing invoices, receipts, and payment status across all clients.
          </p>
        </div>
      </div>

      {hasSelection ? (
        <CommerceBulkSelectionBar
          selectedCount={selection.selectedCount}
          entityLabel="invoice"
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
                onClick={(event) => {
                  event.stopPropagation();
                  setColVisOpen((open) => !open);
                }}
              >
                <i className="fa-solid fa-table-columns" aria-hidden="true" /> Column Visibility
              </button>
              {colVisOpen ? (
                <div className={styles.colVisPanel}>
                  <div className={styles.colVisTitle}>Toggle Columns</div>
                  {INVOICE_COLUMN_VISIBILITY_KEYS.map((key) => (
                    <label key={key} className={styles.colVisItem}>
                      <input
                        type="checkbox"
                        checked={columnsVisible[key]}
                        onChange={(event) =>
                          setColumnsVisible((current) => ({
                            ...current,
                            [key]: event.target.checked,
                          }))
                        }
                      />
                      {INVOICE_COLUMN_LABELS[key]}
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <button type="button" className={styles.primaryBtnSm} onClick={openCreateInvoice}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> Create Invoice
          </button>
        </div>
      )}

      <TableFilterShell
        open={filterOpen}
        active={isTableFilterActive(appliedFilter)}
        total={processedRows.length}
        onToggle={() => setFilterOpen((open) => !open)}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search invoices..."
        dateRange={dateRange}
        onDateRangeChange={(next) => {
          setDateRange(next);
          setPage(1);
        }}
        panel={
          <TableFilterPanel
            rows={rows}
            fields={INVOICE_FILTER_FIELDS}
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
          />
        }
      >
        {loading ? (
          <p className={styles.emptyState}>Loading invoices...</p>
        ) : (
          <>
            <ResizableTableFrame
              storageKey="commerceAdmin:billingInvoices"
              columns={visibleColumns}
              labels={INVOICE_COLUMN_LABELS}
              selectColumn
              className={styles.tableWrap}
            >
              <table className={`${styles.table} ${styles.invoicesTable}`}>
                <thead>
                  <tr>
                    <CommerceSelectAllHead
                      allSelected={selection.allSelected}
                      someSelected={selection.someSelected}
                      onToggleAll={selection.toggleAll}
                      disabled={paginatedRows.length === 0}
                    />
                    {visibleColumns.map((column) => (
                      <th key={column}>{INVOICE_COLUMN_LABELS[column]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumnCount}>No invoices found.</td>
                    </tr>
                  ) : (
                    paginatedRows.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className={selection.isSelected(invoice) ? styles.rowSelected : undefined}
                      >
                        <CommerceSelectRowCell
                          checked={selection.isSelected(invoice)}
                          onChange={() => selection.toggleRow(invoice)}
                          label={`Select invoice ${invoice.wsiInvoiceNumber || invoice.id}`}
                        />
                        {visibleColumns.map((column) =>
                          renderInvoiceCell(invoice, column, {
                            onOpenClient: () => void openClientInfo(invoice),
                            onEditInvoice: () => {
                              const transaction = transactions.find(
                                (row) => row.id === invoice.transactionId,
                              );
                              if (transaction) openEditInvoice(transaction);
                            },
                          }),
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ResizableTableFrame>

            <div className={styles.paginationBar}>
              <div className={styles.paginationInfo}>
                Showing{" "}
                {processedRows.length === 0 ? "0 to 0" : `${rangeStart} to ${rangeEnd}`}
              </div>
              <div className={styles.paginationControls}>
                <button
                  type="button"
                  className={styles.secondaryBtnSm}
                  disabled={page <= 1 || processedRows.length === 0}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  aria-label="Previous invoices page"
                >
                  <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                </button>
                <span className={styles.paginationRange}>
                  {processedRows.length === 0 ? "0 to 0" : `${rangeStart} to ${rangeEnd}`}
                </span>
                <button
                  type="button"
                  className={styles.secondaryBtnSm}
                  disabled={page >= totalPages || processedRows.length === 0}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  aria-label="Next invoices page"
                >
                  <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        )}
      </TableFilterShell>

      <ConfirmModal
        show={bulkDeleteOpen}
        title="Delete invoices"
        message={
          <>
            Delete <strong>{selection.selectedCount}</strong> selected invoice
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
    </section>
  );
}

function renderInvoiceCell(
  invoice: ClientInvoiceRow,
  column: InvoiceColumnKey,
  actions?: {
    onOpenClient?: () => void;
    onEditInvoice?: () => void;
  },
) {
  if (column === "clientName") {
    return (
      <td key={column}>
        <button type="button" className={styles.tableCellLink} onClick={() => actions?.onOpenClient?.()}>
          {invoiceCellValue(invoice, column)}
        </button>
      </td>
    );
  }

  if (column === "subject") {
    return (
      <td key={column}>
        <button type="button" className={styles.tableCellLink} onClick={() => actions?.onEditInvoice?.()}>
          {invoiceCellValue(invoice, column)}
        </button>
      </td>
    );
  }

  if (column === "grandTotal") {
    return (
      <td key={column} className={styles.dealsAmount}>
        {invoiceCellValue(invoice, column)}
      </td>
    );
  }

  return <td key={column}>{invoiceCellValue(invoice, column)}</td>;
}
