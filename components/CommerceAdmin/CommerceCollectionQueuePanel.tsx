import { useMemo, useState } from "react";
import Link from "next/link";
import CommerceStatusBadge from "@/components/CommerceAdmin/CommerceStatusBadge";
import ApprovalReviewModal from "@/components/CommerceAdmin/modals/ApprovalReviewModal";
import { COMMERCE_ADMIN_PATH } from "@/lib/commerceAdmin/constants";
import {
  buildCollectionQueueRows,
  collectionAccountBadgeLabel,
  collectionQueueStatusLabel,
  computeCollectionQueueKpis,
  computeReceivablesAging,
  type CollectionQueueRow,
} from "@/lib/commerceAdmin/collectionQueueHelpers";
import { formatDealAmount } from "@/lib/commerceAdmin/clientDealHelpers";
import type { ClientInvoiceRow } from "@/lib/commerceAdmin/clientInvoiceHelpers";
import { exportRowsToExcel } from "@/lib/commerceAdmin/exportTableExcel";
import { toast } from "@/lib/toast";
import {
  rejectCommercePaymentProof,
  verifyCommercePaymentProof,
  type CommercePaymentProofRow,
} from "@/services/commerceAdminService";
import type { SalesTransaction } from "@/services/salesTransactionService";
import ReceivablesAgingChart from "@/components/CommerceAdmin/ReceivablesAgingChart";
import SearchField from "@/components/shared/SearchField";
import styles from "@/styles/commerceAdmin.module.css";
import filterStyles from "@/styles/tableFilter.module.css";

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

  const rows = useMemo(
    () => buildCollectionQueueRows(invoices, transactions, proofs).filter((r) => matchesSearch(r, search)),
    [invoices, transactions, proofs, search],
  );

  const kpis = useMemo(() => computeCollectionQueueKpis(buildCollectionQueueRows(invoices, transactions, proofs), proofs), [
    invoices,
    transactions,
    proofs,
  ]);

  const aging = useMemo(
    () => computeReceivablesAging(buildCollectionQueueRows(invoices, transactions, proofs)),
    [invoices, transactions, proofs],
  );

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
        <div className={`${styles.kpiCard} ${styles.collectionKpiCardStatic}`}>
          <span className={styles.kpiLabel}>Total receivables</span>
          <span className={styles.collectionKpiValue}>{formatDealAmount(kpis.totalReceivables)}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.collectionKpiCardStatic}`}>
          <span className={styles.kpiLabel}>Overdue accounts</span>
          <span className={styles.collectionKpiValue}>{formatDealAmount(kpis.overdueAmount)}</span>
          {kpis.suspensionCount > 0 ? (
            <p className={styles.kpiHintWarning}>{kpis.suspensionCount} for suspension</p>
          ) : null}
        </div>
        <div className={`${styles.kpiCard} ${styles.collectionKpiCardStatic}`}>
          <span className={styles.kpiLabel}>For verification</span>
          <span className={styles.collectionKpiValue}>{kpis.forVerificationCount}</span>
          <p className={styles.kpiHintMuted}>{kpis.forVerificationSub}</p>
        </div>
        <div className={`${styles.kpiCard} ${styles.collectionKpiCardStatic}`}>
          <span className={styles.kpiLabel}>Collected this month</span>
          <span className={styles.collectionKpiValue}>{formatDealAmount(kpis.collectedThisMonth)}</span>
        </div>
      </div>

      <div className={styles.collectionQueueSection}>
        <div className={styles.collectionQueueHeader}>
          <h4 className={styles.collectionQueueTitle}>Payment verification &amp; collection queue</h4>
          <div className={styles.collectionQueueToolbar}>
            <button
              type="button"
              className={styles.secondaryBtnSm}
              disabled
              title="Bulk SOA send is not wired yet — use Export CSV for now."
            >
              <i className="fa-solid fa-bullhorn" aria-hidden="true" /> Send Bulk SOA
            </button>
            <button type="button" className={styles.secondaryBtnSm} onClick={handleExportCsv} disabled={loading}>
              <i className="fa-solid fa-file-csv" aria-hidden="true" /> Export CSV
            </button>
          </div>
        </div>

        {onSearchChange ? (
          <div className={styles.collectionQueueTools}>
            <div className={filterStyles.searchWrap}>
              <SearchField
                value={search}
                onChange={onSearchChange}
                placeholder="Search client, invoice, payment…"
                ariaLabel="Search collection queue"
              />
            </div>
            <span className={styles.collectionQueueTotal}>Total records: {loading ? "—" : rows.length}</span>
          </div>
        ) : null}

        {loading ? (
          <p className={styles.emptyState}>Loading collection queue…</p>
        ) : (
          <div className={`${styles.tableWrap} ${styles.collectionTableScroll}`}>
            <table className={`${styles.table} ${styles.invoicesTable} ${styles.collectionQueueTable}`}>
              <thead>
                <tr>
                  <th>Customer &amp; account</th>
                  <th>Invoice #</th>
                  <th>Due &amp; PTP / logs</th>
                  <th>Amount</th>
                  <th>Payment &amp; ref</th>
                  <th>2307 &amp; OR</th>
                  <th className={styles.collectionColStatus}>Status</th>
                  <th className={styles.collectionColAction}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={styles.collectionQueueEmptyCell}>
                      No invoices in the queue for this search.
                    </td>
                  </tr>
                ) : (
              rows.map((row) => (
                <tr key={row.invoice.id}>
                  <td data-label="Customer & Account">
                    <button
                      type="button"
                      className={styles.tableCellLink}
                      onClick={() => onOpenClient(row.invoice)}
                    >
                      {row.invoice.clientName}
                    </button>
                    <span className={[styles.badge, accountBadgeClass(row.accountBadge)].join(" ")}>
                      {collectionAccountBadgeLabel(row.accountBadge)}
                    </span>
                  </td>
                  <td data-label="Invoice #">
                    <button
                      type="button"
                      className={styles.tableCellLink}
                      onClick={() => onEditInvoice(row.invoice)}
                    >
                      {row.invoice.wsiInvoiceNumber}
                    </button>
                  </td>
                  <td data-label="Due">
                    <span>{row.duePrimary}</span>
                    {row.dueSecondary ? <div className={styles.collectionCellSub}>{row.dueSecondary}</div> : null}
                  </td>
                  <td data-label="Amount" className={styles.dealsAmount}>
                    <span>{row.amountPrimary}</span>
                    {row.amountSecondary ? <div className={styles.collectionCellSub}>{row.amountSecondary}</div> : null}
                  </td>
                  <td data-label="Payment">
                    <span
                      className={
                        row.paymentPrimary !== "—" ? styles.collectionPaymentPrimary : styles.collectionPaymentMuted
                      }
                    >
                      {row.paymentPrimary}
                    </span>
                    {row.paymentSecondary ? <div className={styles.collectionCellSub}>{row.paymentSecondary}</div> : null}
                  </td>
                  <td data-label="2307 & OR">
                    <span className={styles.badgeMuted}>{row.tax2307Label}</span>
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
                  <td data-label="Status">
                    <CommerceStatusBadge
                      value={collectionQueueStatusLabel(row.queueStatus)}
                      context="payment"
                    />
                  </td>
                  <td data-label="Action" className={styles.collectionActionsCell}>
                    {row.proof && row.queueStatus === "for_verification" ? (
                      <button
                        type="button"
                        className={styles.tableCellLink}
                        onClick={() => setReviewTarget(row.proof)}
                      >
                        Verify
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={styles.tableCellLink}
                      onClick={() => onEditInvoice(row.invoice)}
                    >
                      View
                    </button>
                    <Link href={`${COMMERCE_ADMIN_PATH}?tab=approvals`} className={styles.tableCellLink}>
                      Log
                    </Link>
                  </td>
                </tr>
              ))
                )}
              </tbody>
            </table>
          </div>
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
    </div>
  );
}