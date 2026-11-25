import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CommerceSelectAllHead, CommerceSelectRowCell } from "@/components/CommerceAdmin/CommerceSelectCells";
import CommerceStatusBadge from "@/components/CommerceAdmin/CommerceStatusBadge";
import ApprovalReviewModal from "@/components/CommerceAdmin/modals/ApprovalReviewModal";
import BulkCollectionSoaModal from "@/components/CommerceAdmin/modals/BulkCollectionSoaModal";
import CollectionReminderModal from "@/components/CommerceAdmin/modals/CollectionReminderModal";
import { COMMERCE_ADMIN_PATH } from "@/lib/commerceAdmin/constants";
import {
  buildCollectionQueueRows,
  collectionAccountBadgeLabel,
  COLLECTION_QUEUE_COLUMN_KEYS,
  COLLECTION_QUEUE_COLUMN_LABELS,
  collectionQueueActions,
  collectionQueueStatusLabel,
  computeCollectionQueueKpis,
  computeReceivablesAging,
  collectionQueueRowsEligibleForBulkSoa,
  DEFAULT_COLLECTION_QUEUE_COLUMNS,
  matchesCollectionKpiFilter,
  type CollectionQueueAction,
  type CollectionQueueColumnKey,
  type CollectionQueueKpiFilter,
  type CollectionQueueRow,
} from "@/lib/commerceAdmin/collectionQueueHelpers";
import { formatDealAmount } from "@/lib/commerceAdmin/clientDealHelpers";
import type { ClientInvoiceRow } from "@/lib/commerceAdmin/clientInvoiceHelpers";
import { exportRowsToExcel } from "@/lib/commerceAdmin/exportTableExcel";
import { toast } from "@/lib/toast";
import {
  rejectCommercePaymentProof,
  sendBulkCollectionSoa,
  verifyCommercePaymentProof,
  type CommercePaymentProofRow,
} from "@/services/commerceAdminService";
import { notesAfterCollectionReminder } from "@/lib/commerceAdmin/collectionReminderHelpers";
import { updateSalesTransaction, type SalesTransaction } from "@/services/salesTransactionService";
import ReceivablesAgingChart from "@/components/CommerceAdmin/ReceivablesAgingChart";
import SearchField from "@/components/shared/SearchField";
import { useRowSelection } from "@/lib/useRowSelection";
import { usePersistedColumnVisibility } from "@/lib/commerceAdmin/usePersistedColumnVisibility";
import styles from "@/styles/commerceAdmin.module.css";
import filterStyles from "@/styles/tableFilter.module.css";

const COLLECTION_QUEUE_PAGE_SIZE = 10;

type Props = {
  invoices: ClientInvoiceRow[];
  transactions: SalesTransaction[];
  proofs: CommercePaymentProofRow[];
  loading?: boolean;
  search: string;
  onSearchChange?: (value: string) => void;
  onOpenClient: (invoice: ClientInvoiceRow) => void;
  onEditInvoice: (invoice: ClientInvoiceRow) => void;
  onReload: () => void | Promise<void>;
};

function matchesSearch(row: CollectionQueueRow, needle: string) {
  if (!needle.trim()) return true;
  const q = needle.trim().toLowerCase();
  const fields = [
    row.invoice.clientName,
    row.invoice.wsiInvoiceNumber,
    row.invoice.status,
    row.paymentPrimary,
    row.paymentSecondary,
    row.invoice.billingInCharge,
  ];
  return fields.some((v) => String(v ?? "").toLowerCase().includes(q));
}

export default function CommerceCollectionQueuePanel({
  invoices,
  transactions,
  proofs,
  loading,
  search,
  onSearchChange,
  onOpenClient,
  onEditInvoice,
  onReload,
}: Props) {
  const [reviewTarget, setReviewTarget] = useState<CommercePaymentProofRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [remindBusyId, setRemindBusyId] = useState<number | null>(null);
  const [remindTarget, setRemindTarget] = useState<CollectionQueueRow | null>(null);
  const [bulkSoaOpen, setBulkSoaOpen] = useState(false);
  const [bulkSoaBusy, setBulkSoaBusy] = useState(false);
  const [kpiFilter, setKpiFilter] = useState<CollectionQueueKpiFilter>("all");
  const [columnsVisible, setColumnsVisible] = usePersistedColumnVisibility(
    "commerceAdmin:columnVisibility:collectionQueue:v1",
    DEFAULT_COLLECTION_QUEUE_COLUMNS,
  );
  const [colVisOpen, setColVisOpen] = useState(false);
  const colVisRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);

  const allQueueRows = useMemo(
    () => buildCollectionQueueRows(invoices, transactions, proofs),
    [invoices, transactions, proofs],
  );

  const rows = useMemo(() => {
    return allQueueRows
      .filter((r) => matchesSearch(r, search))
      .filter((r) => matchesCollectionKpiFilter(r, kpiFilter));
  }, [allQueueRows, search, kpiFilter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / COLLECTION_QUEUE_PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * COLLECTION_QUEUE_PAGE_SIZE;
    return rows.slice(start, start + COLLECTION_QUEUE_PAGE_SIZE);
  }, [rows, page]);

  const paginatedSelectableRows = useMemo(
    () => paginatedRows.filter((row) => !row.isSample),
    [paginatedRows],
  );

  const rangeStart = rows.length ? (page - 1) * COLLECTION_QUEUE_PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * COLLECTION_QUEUE_PAGE_SIZE, rows.length);

  const getQueueRowId = useCallback((row: CollectionQueueRow) => row.invoice.id, []);

  const selection = useRowSelection(paginatedSelectableRows, getQueueRowId);

  const selectedRows = useMemo(() => {
    const ids = new Set(selection.selectedIds);
    return rows.filter((row) => ids.has(String(row.invoice.id)));
  }, [rows, selection.selectedIds]);

  const kpis = useMemo(() => computeCollectionQueueKpis(allQueueRows, proofs), [allQueueRows, proofs]);

  const aging = useMemo(() => computeReceivablesAging(allQueueRows), [allQueueRows]);

  const bulkSoaTargets = useMemo(
    () => collectionQueueRowsEligibleForBulkSoa(selectedRows),
    [selectedRows],
  );

  const isColumnVisible = useCallback(
    (key: CollectionQueueColumnKey) => Boolean(columnsVisible[key]),
    [columnsVisible],
  );

  const tableColumnCount = useMemo(
    () =>
      2 + COLLECTION_QUEUE_COLUMN_KEYS.filter((key) => columnsVisible[key]).length,
    [columnsVisible],
  );

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (colVisRef.current && !colVisRef.current.contains(event.target as Node)) {
        setColVisOpen(false);
      }
    };
    if (!colVisOpen) return undefined;
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [colVisOpen]);

  useEffect(() => {
    setPage(1);
  }, [search, kpiFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const submitBulkSoa = async (message: string) => {
    const transactionIds = bulkSoaTargets.map((row) => row.invoice.transactionId).filter((id) => id > 0);
    if (transactionIds.length === 0) {
      toast.info("No eligible invoices in the current list.");
      return;
    }

    try {
      setBulkSoaBusy(true);
      const result = await sendBulkCollectionSoa({
        transaction_ids: transactionIds,
        message: message || undefined,
      });
      if (result.sent > 0) {
        toast.success(result.message || `Sent ${result.sent} statement(s) of account.`);
      } else {
        toast.info(result.message || "No statements were sent.");
      }
      if (result.skipped > 0 && result.sent > 0) {
        toast.info(`${result.skipped} invoice(s) skipped (paid or not linked to a client).`);
      }
      setBulkSoaOpen(false);
      selection.clearSelection();
      await onReload();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message || "")
          : "";
      toast.error(msg || "Could not send bulk SOA.");
    } finally {
      setBulkSoaBusy(false);
    }
  };

  const submitCollectionReminder = async (message: string) => {
    const row = remindTarget;
    if (!row) return;

    const txId = row.invoice.transactionId;
    if (!(txId > 0)) {
      toast.error("Could not find the invoice transaction.");
      return;
    }

    try {
      setRemindBusyId(txId);
      const nextNotes = notesAfterCollectionReminder(row.transaction.notes, { message });
      await updateSalesTransaction(txId, { notes: nextNotes });
      toast.success("Reminder logged on the invoice — Due & PTP / logs will show Reminded.");
      setRemindTarget(null);
      await onReload();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message || "")
          : "";
      toast.error(msg || "Could not log collection reminder.");
    } finally {
      setRemindBusyId(null);
    }
  };

  const handleQueueAction = (row: CollectionQueueRow, kind: CollectionQueueAction["kind"]) => {
    if (row.isSample) {
      toast.info("Sample row — layout preview only.");
      return;
    }
    switch (kind) {
      case "verify":
        if (row.proof) setReviewTarget(row.proof);
        break;
      case "remind":
        if (!(row.invoice.transactionId > 0)) {
          toast.error("Could not find the invoice transaction.");
          break;
        }
        setRemindTarget(row);
        break;
      case "view":
        onEditInvoice(row.invoice);
        break;
      case "soa":
        toast.info("View SOA is not wired yet — use Export CSV for now.");
        break;
      default:
        break;
    }
  };

  const handleExportCsv = () => {
    exportRowsToExcel(
      [
        "Client",
        "Account",
        "Invoice #",
        "Due",
        "PTP / Note",
        "Amount",
        "Payment",
        "OR",
        "2307",
        "Status",
      ],
      rows.map((row) => [
        row.invoice.clientName,
        collectionAccountBadgeLabel(row.accountBadge),
        row.invoice.wsiInvoiceNumber,
        row.duePrimary,
        row.dueSecondary,
        row.amountPrimary,
        row.paymentPrimary,
        row.orLabel,
        row.tax2307Label,
        collectionQueueStatusLabel(row.queueStatus),
      ]),
      "collection-queue",
    );
    toast.success("Collection queue exported.");
  };

  const handleVerify = async (row: CommercePaymentProofRow) => {
    try {
      setBusy(true);
      await verifyCommercePaymentProof(row.id);
      toast.success("Payment verified — same flow as Approvals.");
      setReviewTarget(null);
      await onReload();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message || "")
          : "";
      toast.error(message || "Could not verify payment.");
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (row: CommercePaymentProofRow) => {
    const reason = window.prompt("Optional rejection note for the customer:");
    if (reason === null) return;
    try {
      setBusy(true);
      await rejectCommercePaymentProof(row.id, reason || undefined);
      toast.success("Payment proof declined.");
      setReviewTarget(null);
      await onReload();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message || "")
          : "";
      toast.error(message || "Could not reject payment.");
    } finally {
      setBusy(false);
    }
  };

  const toggleKpiFilter = (next: CollectionQueueKpiFilter) => {
    setKpiFilter((current) => (current === next ? "all" : next));
    selection.clearSelection();
  };

  const accountBadgeClass = (badge: CollectionQueueRow["accountBadge"]) => {
    switch (badge) {
      case "suspension":
        return styles.badgeRose;
      case "grace":
        return styles.badgeAmber;
      default:
        return styles.badgeBlue;
    }
  };

  return (
    <div className={styles.collectionQueueWrap}>
      <div className={styles.kpiGrid}>
        <button
          type="button"
          className={`${styles.kpiCard} ${styles.collectionKpiCardStatic}${
            kpiFilter === "receivables" ? ` ${styles.collectionKpiCardActive}` : ""
          }`}
          aria-pressed={kpiFilter === "receivables"}
          onClick={() => toggleKpiFilter("receivables")}
        >
          <span className={styles.kpiLabel}>Total receivables</span>
          <span className={styles.collectionKpiValue}>{formatDealAmount(kpis.totalReceivables)}</span>
        </button>
        <button
          type="button"
          className={`${styles.kpiCard} ${styles.collectionKpiCardStatic}${
            kpiFilter === "overdue" ? ` ${styles.collectionKpiCardActive}` : ""
          }`}
          aria-pressed={kpiFilter === "overdue"}
          onClick={() => toggleKpiFilter("overdue")}
        >
          <span className={styles.kpiLabel}>Overdue accounts</span>
          <span className={styles.collectionKpiValue}>{formatDealAmount(kpis.overdueAmount)}</span>
          {kpis.suspensionCount > 0 ? (
            <p className={styles.kpiHintWarning}>{kpis.suspensionCount} for suspension</p>
          ) : null}
        </button>
        <button
          type="button"
          className={`${styles.kpiCard} ${styles.collectionKpiCardStatic}${
            kpiFilter === "verification" ? ` ${styles.collectionKpiCardActive}` : ""
          }`}
          aria-pressed={kpiFilter === "verification"}
          onClick={() => toggleKpiFilter("verification")}
        >
          <span className={styles.kpiLabel}>For verification</span>
          <span className={styles.collectionKpiValue}>{kpis.forVerificationCount}</span>
          {kpis.forVerificationCount > 0 || kpis.forVerificationSub !== "Nothing pending review" ? (
            <p className={styles.kpiHintMuted}>{kpis.forVerificationSub}</p>
          ) : null}
        </button>
        <button
          type="button"
          className={`${styles.kpiCard} ${styles.collectionKpiCardStatic}${
            kpiFilter === "collected" ? ` ${styles.collectionKpiCardActive}` : ""
          }`}
          aria-pressed={kpiFilter === "collected"}
          onClick={() => toggleKpiFilter("collected")}
        >
          <span className={styles.kpiLabel}>Collected this month</span>
          <span className={styles.collectionKpiValue}>{formatDealAmount(kpis.collectedThisMonth)}</span>
        </button>
      </div>

      <div className={styles.collectionQueueSection}>
        <div className={styles.collectionQueueHeader}>
          <h4 className={styles.collectionQueueTitle}>Payment verification &amp; collection queue</h4>
          <div className={styles.collectionQueueToolbar}>
            <button
              type="button"
              className={styles.secondaryBtnSm}
              disabled={loading || bulkSoaBusy || bulkSoaTargets.length === 0}
              title={
                selection.selectedCount === 0
                  ? "Select invoices using the checkboxes, then send SOA."
                  : bulkSoaTargets.length === 0
                    ? "Selected rows cannot receive SOA (paid, awaiting verification, or no client account)."
                    : `Send SOA to ${bulkSoaTargets.length} selected invoice(s)`
              }
              onClick={() => setBulkSoaOpen(true)}
            >
              <i className="fa-solid fa-bullhorn" aria-hidden="true" /> Send Bulk SOA
              {bulkSoaTargets.length > 0 ? ` (${bulkSoaTargets.length})` : ""}
            </button>
            <button type="button" className={styles.secondaryBtnSm} onClick={handleExportCsv} disabled={loading}>
              <i className="fa-solid fa-file-csv" aria-hidden="true" /> Export CSV
            </button>
          </div>
        </div>

        <div className={styles.collectionQueueTools}>
          {onSearchChange ? (
            <div className={filterStyles.searchWrap}>
              <SearchField
                value={search}
                onChange={onSearchChange}
                placeholder="Search client, invoice, payment…"
                ariaLabel="Search collection queue"
              />
            </div>
          ) : null}
          <div className={styles.collectionQueueToolsMeta}>
            <div className={styles.colVisWrap} ref={colVisRef}>
              <button
                type="button"
                className={styles.colVisBtn}
                onClick={(event) => {
                  event.stopPropagation();
                  setColVisOpen((open) => !open);
                }}
                aria-expanded={colVisOpen}
              >
                <i className="fa-solid fa-table-columns" aria-hidden="true" />
                <span className={styles.toolbarLabelFull}>Column Visibility</span>
                <span className={styles.toolbarLabelShort}>Columns</span>
              </button>
              {colVisOpen ? (
                <div className={styles.colVisPanel}>
                  <div className={styles.colVisTitle}>Toggle Columns</div>
                  {COLLECTION_QUEUE_COLUMN_KEYS.map((key) => (
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
                      {COLLECTION_QUEUE_COLUMN_LABELS[key]}
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
            <span className={styles.collectionQueueTotal}>
              {selection.selectedCount > 0 ? (
                <>
                  <strong>{selection.selectedCount}</strong> selected ·{" "}
                </>
              ) : null}
              Total records: {loading ? "—" : rows.length}
            </span>
          </div>
        </div>

        {loading ? (
          <p className={styles.emptyState}>Loading collection queue…</p>
        ) : (
          <>
          <div className={`${styles.tableWrap} ${styles.collectionTableScroll}`}>
            <table className={`${styles.table} ${styles.invoicesTable} ${styles.collectionQueueTable}`}>
              <thead>
                <tr>
                  <CommerceSelectAllHead
                    allSelected={selection.allSelected}
                    someSelected={selection.someSelected}
                    onToggleAll={selection.toggleAll}
                    disabled={loading || paginatedSelectableRows.length === 0}
                    label="Select all invoices on this page"
                  />
                  {isColumnVisible("customer") ? <th>Customer &amp; account</th> : null}
                  {isColumnVisible("invoice") ? <th>Invoice #</th> : null}
                  {isColumnVisible("due") ? <th>Due &amp; PTP / logs</th> : null}
                  {isColumnVisible("amount") ? <th>Amount</th> : null}
                  {isColumnVisible("payment") ? <th>Payment &amp; ref</th> : null}
                  {isColumnVisible("taxOr") ? <th>2307 &amp; OR</th> : null}
                  {isColumnVisible("status") ? (
                    <th className={styles.collectionColStatus}>Status</th>
                  ) : null}
                  <th className={styles.collectionColAction}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={tableColumnCount} className={styles.collectionQueueEmptyCell}>
                      {kpiFilter === "collected"
                        ? "No payments collected this month yet (sample rows are preview-only)."
                        : kpiFilter !== "all"
                          ? "No live invoices match this KPI filter. Click the same card again to show all."
                          : "No invoices in the queue for this search."}
                    </td>
                  </tr>
                ) : (
              paginatedRows.map((row) => (
                <tr
                  key={row.invoice.id}
                  className={[
                    row.isSample ? styles.collectionQueueSampleRow : undefined,
                    !row.isSample && selection.isSelected(row) ? styles.rowSelected : undefined,
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined}
                >
                  {row.isSample ? (
                    <td className={styles.selectCol} data-label="Select">
                      <input
                        type="checkbox"
                        className={styles.selectCheckbox}
                        disabled
                        aria-label="Sample row (not selectable)"
                      />
                    </td>
                  ) : (
                    <CommerceSelectRowCell
                      checked={selection.isSelected(row)}
                      onChange={() => selection.toggleRow(row)}
                      label={`Select ${row.invoice.clientName} · ${row.invoice.wsiInvoiceNumber}`}
                    />
                  )}
                  {isColumnVisible("customer") ? (
                    <td data-label="Customer & Account">
                      <button
                        type="button"
                        className={styles.tableCellLink}
                        onClick={() => {
                          if (row.isSample) {
                            toast.info("Sample row — layout preview only.");
                            return;
                          }
                          onOpenClient(row.invoice);
                        }}
                      >
                        {row.invoice.clientName}
                      </button>
                      {row.isSample ? <span className={styles.collectionQueueSampleTag}>Sample</span> : null}
                      <span className={[styles.badge, accountBadgeClass(row.accountBadge)].join(" ")}>
                        {collectionAccountBadgeLabel(row.accountBadge)}
                      </span>
                    </td>
                  ) : null}
                  {isColumnVisible("invoice") ? (
                    <td data-label="Invoice #">
                      <button
                        type="button"
                        className={styles.tableCellLink}
                        onClick={() => {
                          if (row.isSample) {
                            toast.info("Sample row — layout preview only.");
                            return;
                          }
                          onEditInvoice(row.invoice);
                        }}
                      >
                        {row.invoice.wsiInvoiceNumber}
                      </button>
                    </td>
                  ) : null}
                  {isColumnVisible("due") ? (
                    <td data-label="Due">
                      <span>{row.duePrimary}</span>
                      {row.dueSecondary ? (
                        <div className={styles.collectionCellSub}>{row.dueSecondary}</div>
                      ) : null}
                    </td>
                  ) : null}
                  {isColumnVisible("amount") ? (
                    <td data-label="Amount" className={styles.dealsAmount}>
                      <span>{row.amountPrimary}</span>
                      {row.amountSecondary ? (
                        <div className={styles.collectionCellSub}>{row.amountSecondary}</div>
                      ) : null}
                    </td>
                  ) : null}
                  {isColumnVisible("payment") ? (
                    <td data-label="Payment">
                      <span
                        className={
                          row.paymentPrimary !== "—"
                            ? styles.collectionPaymentPrimary
                            : styles.collectionPaymentMuted
                        }
                      >
                        {row.paymentPrimary}
                      </span>
                      {row.paymentSecondary ? (
                        <div className={styles.collectionCellSub}>{row.paymentSecondary}</div>
                      ) : null}
                    </td>
                  ) : null}
                  {isColumnVisible("taxOr") ? (
                    <td data-label="2307 & OR">
                      <span
                        className={row.tax2307Label === "2307 Received" ? styles.badgePaid : styles.badgeMuted}
                      >
                        {row.tax2307Label}
                      </span>
                      <span
                        className={[
                          row.orLabel === "OR Issued" ? styles.badgePaid : styles.badgePending,
                          styles.collectionDocBadgeGap,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {row.orLabel}
                      </span>
                    </td>
                  ) : null}
                  {isColumnVisible("status") ? (
                    <td data-label="Status">
                      <CommerceStatusBadge
                        value={collectionQueueStatusLabel(row.queueStatus)}
                        context="payment"
                      />
                    </td>
                  ) : null}
                  <td data-label="Action" className={styles.collectionActionsCell}>
                    <div className={styles.collectionActionsInner}>
                      {collectionQueueActions(row).map((action, index) => (
                        <Fragment key={`${row.invoice.id}-${action.kind}`}>
                          {index > 0 ? (
                            <span className={styles.collectionActionSep} aria-hidden="true">
                              |
                            </span>
                          ) : null}
                          {action.kind === "log" ? (
                            <Link
                              href={`${COMMERCE_ADMIN_PATH}?tab=approvals`}
                              className={styles.tableCellLink}
                              onClick={(event) => {
                                if (row.isSample) {
                                  event.preventDefault();
                                  toast.info("Sample row — layout preview only.");
                                }
                              }}
                            >
                              {action.label}
                            </Link>
                          ) : (
                            <button
                              type="button"
                              className={styles.tableCellLink}
                              disabled={action.kind === "remind" && remindBusyId === row.invoice.transactionId}
                              onClick={() => handleQueueAction(row, action.kind)}
                            >
                              {action.kind === "remind" && remindBusyId === row.invoice.transactionId
                                ? "Logging…"
                                : action.label}
                            </button>
                          )}
                        </Fragment>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
                )}
              </tbody>
            </table>
          </div>

          {rows.length > 0 ? (
            <div className={styles.paginationBar}>
              <div className={styles.paginationInfo}>
                Showing {rangeStart} to {rangeEnd} of {rows.length}
              </div>
              <div className={styles.paginationControls}>
                <button
                  type="button"
                  className={styles.secondaryBtnSm}
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  aria-label="Previous collection queue page"
                >
                  <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                </button>
                <span className={styles.paginationRange}>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className={styles.secondaryBtnSm}
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  aria-label="Next collection queue page"
                >
                  <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}
          </>
        )}
      </div>

      <div className={styles.collectionAgingSection}>
        <h4 className={styles.collectionAgingTitle}>Receivables aging (30 / 60 / 90+ days)</h4>
        <ReceivablesAgingChart buckets={aging} />
      </div>

      <ApprovalReviewModal
        open={Boolean(reviewTarget)}
        row={reviewTarget}
        busy={busy}
        onClose={() => setReviewTarget(null)}
        onApprove={(row) => void handleVerify(row)}
        onReject={(row) => void handleReject(row)}
      />

      <CollectionReminderModal
        open={Boolean(remindTarget)}
        row={remindTarget}
        busy={Boolean(remindTarget && remindBusyId === remindTarget.invoice.transactionId)}
        onClose={() => {
          if (!remindBusyId) setRemindTarget(null);
        }}
        onSubmit={(message) => void submitCollectionReminder(message)}
      />

      <BulkCollectionSoaModal
        open={bulkSoaOpen}
        rows={bulkSoaTargets}
        busy={bulkSoaBusy}
        onClose={() => {
          if (!bulkSoaBusy) setBulkSoaOpen(false);
        }}
        onSubmit={(message) => void submitBulkSoa(message)}
      />
    </div>
  );
}