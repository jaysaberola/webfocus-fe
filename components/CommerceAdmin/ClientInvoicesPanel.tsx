import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ResizableTableHead from "@/components/CommerceAdmin/ResizableTableHead";
import ColumnResizeLines from "@/components/CommerceAdmin/ColumnResizeLines";
import {
  buildClientInvoiceRows,
  DEFAULT_INVOICE_COLUMNS,
  fetchCustomerDealTransactions,
  INVOICE_COLUMN_LABELS,
  INVOICE_COLUMN_VISIBILITY_KEYS,
  invoiceCellValue,
  type ClientInvoiceRow,
  type InvoiceColumnKey,
} from "@/lib/commerceAdmin/clientInvoiceHelpers";
import { useResizableColumns } from "@/lib/commerceAdmin/useResizableColumns";
import { usePersistedColumnVisibility } from "@/lib/commerceAdmin/usePersistedColumnVisibility";
import { getCustomer, type CustomerRow } from "@/services/customerService";
import styles from "@/styles/commerceAdmin.module.css";

const INVOICE_PAGE_SIZE = 10;

type Props = {
  client: CustomerRow;
  onEditClient?: () => void;
  onCreateInvoice?: () => void;
};

export default function ClientInvoicesPanel({ client, onEditClient, onCreateInvoice }: Props) {
  const [rows, setRows] = useState<ClientInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [columnsVisible, setColumnsVisible] = usePersistedColumnVisibility(
    "commerceAdmin:columnVisibility:clientInvoices",
    DEFAULT_INVOICE_COLUMNS,
  );
  const [colVisOpen, setColVisOpen] = useState(false);
  const colVisRef = useRef<HTMLDivElement>(null);
  const invoiceColumnLabel = useCallback((key: InvoiceColumnKey) => INVOICE_COLUMN_LABELS[key], []);
  const { containerRef, layoutFor, startResize } = useResizableColumns<InvoiceColumnKey>(
    "commerceAdmin:invoiceColumnWidths",
    invoiceColumnLabel,
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);

    Promise.all([
      fetchCustomerDealTransactions(Number(client.id)),
      getCustomer(client.id, { silent: true }).catch(() => null),
    ])
      .then(([transactions, detail]) => {
        if (cancelled) return;
        const enriched: CustomerRow = {
          ...client,
          ...detail,
          owner: detail?.owner ?? client.owner,
          owner_name: detail?.owner_name ?? client.owner_name,
          owner_id: detail?.owner_id ?? client.owner_id,
          contact_person: detail?.contact_person ?? client.contact_person,
        };
        setRows(buildClientInvoiceRows(enriched, transactions));
      })
      .catch(() => {
        if (!cancelled) setRows(buildClientInvoiceRows(client, []));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [client]);

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

  return (
    <div className={styles.clientDealsBlock}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Invoices</h3>
          <p className={styles.panelSubtitle}>Invoices and receipts for this client.</p>
        </div>
        <div className={styles.dealsHeaderActions}>
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
                {INVOICE_COLUMN_VISIBILITY_KEYS.map((key) => (
                  <label key={key} className={styles.colVisItem}>
                    <input
                      type="checkbox"
                      checked={columnsVisible[key]}
                      onChange={(e) =>
                        setColumnsVisible((current) => ({ ...current, [key]: e.target.checked }))
                      }
                    />
                    {INVOICE_COLUMN_LABELS[key]}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
          {onCreateInvoice ? (
            <button type="button" className={styles.dealsActionBtn} onClick={onCreateInvoice}>
              Create Invoice
            </button>
          ) : null}
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
                <td colSpan={Math.max(visibleColumns.length, 1)}>No invoices found for this client.</td>
              </tr>
            ) : (
              paginatedRows.map((invoice) => (
                <tr key={invoice.id}>
                  {visibleColumns.map((column) => renderInvoiceCell(invoice, column, onEditClient))}
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
          Showing {rows.length === 0 ? "0 to 0" : `${rangeStart} to ${rangeEnd}`}
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
    </div>
  );
}

function renderInvoiceCell(
  invoice: ClientInvoiceRow,
  column: InvoiceColumnKey,
  onEditClient?: () => void,
) {
  if (column === "clientName") {
    return (
      <td key={column} className={`${styles.dealsNowrap} ${styles.resizableCell}`}>
        <button type="button" className={styles.tableCellLink} onClick={() => onEditClient?.()}>
          {invoice.clientName}
        </button>
      </td>
    );
  }

  if (column === "productCategory") {
    return (
      <td key={column} className={`${styles.dealsNowrap} ${styles.resizableCell}`}>
        {invoice.productCategory}
      </td>
    );
  }

  return (
    <td key={column} className={`${styles.dealsNowrap} ${styles.resizableCell}`}>
      {invoiceCellValue(invoice, column)}
    </td>
  );
}
