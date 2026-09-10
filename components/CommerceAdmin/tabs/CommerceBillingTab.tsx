import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ClientInvoiceForm from "@/components/CommerceAdmin/ClientInvoiceForm";
import ColumnResizeLines from "@/components/CommerceAdmin/ColumnResizeLines";
import ResizableTableHead from "@/components/CommerceAdmin/ResizableTableHead";
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
import { usePersistedColumnVisibility } from "@/lib/commerceAdmin/usePersistedColumnVisibility";
import { useResizableColumns } from "@/lib/commerceAdmin/useResizableColumns";
import type { CustomerRow } from "@/services/customerService";
import { getSalesTransactions, type SalesTransaction } from "@/services/salesTransactionService";
import styles from "@/styles/commerceAdmin.module.css";

const INVOICE_PAGE_SIZE = 10;

export default function CommerceBillingTab() {
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [rows, setRows] = useState<ClientInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [formClient, setFormClient] = useState<CustomerRow | null>(null);
  const [editTransaction, setEditTransaction] = useState<SalesTransaction | null>(null);
  const [columnsVisible, setColumnsVisible] = usePersistedColumnVisibility(
    "commerceAdmin:columnVisibility:billingInvoices:v1",
    DEFAULT_INVOICE_COLUMNS,
  );
  const [colVisOpen, setColVisOpen] = useState(false);
  const colVisRef = useRef<HTMLDivElement>(null);
  const invoiceColumnLabel = useCallback((key: InvoiceColumnKey) => INVOICE_COLUMN_LABELS[key], []);
  const { containerRef, layoutFor, startResize } = useResizableColumns<InvoiceColumnKey>(
    "commerceAdmin:billingInvoiceColumnWidths:v2",
    invoiceColumnLabel,
    {
      defaultOverflow: true,
      preferredWidths: {
        clientName: 220,
        billingInCharge: 150,
        subject: 190,
        invoiceDate: 120,
        dueDate: 120,
        collectionDate: 130,
        wsiInvoiceNumber: 190,
        officialReceipt: 140,
        status: 150,
        grandTotal: 130,
      },
    },
  );

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

  const visibleColumns = useMemo(
    () => INVOICE_COLUMN_VISIBILITY_KEYS.filter((key) => columnsVisible[key]),
    [columnsVisible],
  );
  const invoiceLayout = layoutFor(visibleColumns);

  const totalPages = Math.max(1, Math.ceil(rows.length / INVOICE_PAGE_SIZE));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * INVOICE_PAGE_SIZE;
    return rows.slice(start, start + INVOICE_PAGE_SIZE);
  }, [rows, page]);
  const rangeStart = rows.length ? (page - 1) * INVOICE_PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * INVOICE_PAGE_SIZE, rows.length);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const backToList = () => {
    setView("list");
    setFormClient(null);
    setEditTransaction(null);
  };

  const openCreateInvoice = async () => {
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
        <div className={styles.dealsHeaderActions}>
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
              <div className={`${styles.colVisPanel} ${styles.dealsColVisPanel}`}>
                <div className={styles.colVisTitle}>Toggle Columns</div>
                {INVOICE_COLUMN_VISIBILITY_KEYS.map((key) => (
                  <label key={key} className={styles.colVisItem}>
                    <input
                      type="checkbox"
                      checked={columnsVisible[key]}
                      onChange={(event) =>
                        setColumnsVisible((current) => ({ ...current, [key]: event.target.checked }))
                      }
                    />
                    {INVOICE_COLUMN_LABELS[key]}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
          <button type="button" className={styles.primaryBtnSm} onClick={() => void openCreateInvoice()}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> Create Invoice
          </button>
        </div>
      </div>

      <div
        className={`${styles.tableWrap} ${styles.resizableTableWrap}`}
        ref={containerRef}
        style={{ overflowX: invoiceLayout.overflowing ? "auto" : "hidden" }}
      >
        <div className={styles.resizableTableInner} style={{ width: invoiceLayout.innerWidth }}>
          <table
            className={`${styles.table} ${styles.invoicesTable} ${styles.resizableTable}`}
            style={{ width: "100%" }}
          >
            <colgroup>
              {visibleColumns.map((column) => (
                <col key={column} style={{ width: invoiceLayout.widthOf(column) }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {visibleColumns.map((column) => (
                  <ResizableTableHead key={column} label={INVOICE_COLUMN_LABELS[column]} />
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={Math.max(visibleColumns.length, 1)}>Loading invoices...</td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={Math.max(visibleColumns.length, 1)}>No invoices found.</td>
                </tr>
              ) : (
                paginatedRows.map((invoice) => (
                  <tr key={invoice.id}>
                    {visibleColumns.map((column) =>
                      renderInvoiceCell(invoice, column, () => {
                        const transaction = transactions.find((row) => row.id === invoice.transactionId);
                        if (transaction) openEditInvoice(transaction);
                      }),
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <ColumnResizeLines
            columns={visibleColumns}
            widthOf={invoiceLayout.widthOf}
            onResizeStart={(column, event) => startResize(column, event, visibleColumns)}
            labelOf={invoiceColumnLabel}
          />
        </div>
      </div>

      <div className={styles.paginationBar}>
        <div className={styles.paginationInfo}>
          Showing {rows.length === 0 ? "0 to 0" : `${rangeStart} to ${rangeEnd}`} of {rows.length}
        </div>
        <div className={styles.paginationControls}>
          <button
            type="button"
            className={styles.secondaryBtnSm}
            disabled={page <= 1 || rows.length === 0}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            aria-label="Previous invoices page"
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
          <span className={styles.paginationRange}>
            {rows.length === 0 ? "0 to 0" : `${rangeStart} - ${rangeEnd}`}
          </span>
          <button
            type="button"
            className={styles.secondaryBtnSm}
            disabled={page >= totalPages || rows.length === 0}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            aria-label="Next invoices page"
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

function renderInvoiceCell(
  invoice: ClientInvoiceRow,
  column: InvoiceColumnKey,
  onEditInvoice?: () => void,
) {
  if (column === "clientName" || column === "subject") {
    return (
      <td key={column} className={`${styles.dealsNowrap} ${styles.resizableCell}`}>
        <button type="button" className={styles.tableCellLink} onClick={() => onEditInvoice?.()}>
          {invoiceCellValue(invoice, column)}
        </button>
      </td>
    );
  }

  if (column === "grandTotal") {
    return (
      <td key={column} className={`${styles.dealsNowrap} ${styles.resizableCell} ${styles.dealsAmount}`}>
        {invoiceCellValue(invoice, column)}
      </td>
    );
  }

  return (
    <td key={column} className={`${styles.dealsNowrap} ${styles.resizableCell}`}>
      {invoiceCellValue(invoice, column)}
    </td>
  );
}
