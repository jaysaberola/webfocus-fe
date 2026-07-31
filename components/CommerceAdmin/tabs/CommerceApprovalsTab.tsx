import { useEffect, useMemo, useState } from "react";
import {
  fetchCommercePaymentProofs,
  rejectCommercePaymentProof,
  verifyCommercePaymentProof,
  type CommercePaymentProofRow,
} from "@/services/commerceAdminService";
import {
  approvalPlanLabel,
  approvalServiceLabel,
  filterApprovals,
  formatApprovalDate,
  sortApprovals,
  type ApprovalFilterKey,
  type ApprovalSortKey,
} from "@/lib/commerceAdmin/approvalHelpers";
import { formatCommerceMoney } from "@/lib/commerceAdmin/mockData";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";

const PAGE_SIZE = 5;

export default function CommerceApprovalsTab() {
  const [rows, setRows] = useState<CommercePaymentProofRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<ApprovalSortKey>("date-desc");
  const [filterType, setFilterType] = useState<ApprovalFilterKey>("all");
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    fetchCommercePaymentProofs("Pending Review")
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [sortBy, filterType, viewMode]);

  const processedRows = useMemo(() => {
    const filtered = filterApprovals(rows, filterType);
    return sortApprovals(filtered, sortBy);
  }, [rows, filterType, sortBy]);

  const totalPages = Math.max(1, Math.ceil(processedRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return processedRows.slice(start, start + PAGE_SIZE);
  }, [processedRows, page]);

  const rangeStart = processedRows.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, processedRows.length);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleVerify = async (row: CommercePaymentProofRow) => {
    try {
      setBusyId(row.id);
      await verifyCommercePaymentProof(row.id);
      toast.success(`Verified ${row.proofNo}. Customer billing updated.`);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to verify payment proof.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (row: CommercePaymentProofRow) => {
    const reason = window.prompt("Optional rejection note for the customer:");
    if (reason === null) return;

    try {
      setBusyId(row.id);
      await rejectCommercePaymentProof(row.id, reason || undefined);
      toast.success(`Rejected ${row.proofNo}. Customer notified.`);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reject payment proof.");
    } finally {
      setBusyId(null);
    }
  };

  const handleAction = async (row: CommercePaymentProofRow, action: string) => {
    if (action === "view") {
      toast.info(
        `${row.proofNo} · ${row.client} · ${formatCommerceMoney(row.amount)} · ${row.fileName}`,
      );
      return;
    }
    if (action === "edit") {
      toast.info("Edit approval details from the linked invoice or transaction record.");
      return;
    }
    if (action === "pay") {
      await handleVerify(row);
      return;
    }
    if (action === "file") {
      if (row.fileUrl) {
        window.open(row.fileUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error("No receipt file attached.");
      }
      return;
    }
    if (action === "reject") {
      await handleReject(row);
    }
  };

  const renderActionSelect = (row: CommercePaymentProofRow) => (
    <select
      className={styles.actionSelect}
      defaultValue=""
      disabled={busyId === row.id}
      onChange={(e) => {
        const value = e.target.value;
        e.target.value = "";
        if (value) void handleAction(row, value);
      }}
    >
      <option value="" disabled>
        Actions...
      </option>
      <option value="view">View Service Details</option>
      <option value="edit">Edit</option>
      <option value="pay">Approve Order</option>
      <option value="file">Attached File</option>
      <option value="reject">Reject Purchase</option>
    </select>
  );

  const renderApprovalGridCard = (row: CommercePaymentProofRow) => (
    <article key={row.id} className={styles.txGridCard}>
      <div className={styles.txGridCardTop}>
        <span className={styles.monoCell}>{row.invoiceId || row.proofNo}</span>
        <span className={styles.badgePending}>{row.status || "Pending Review"}</span>
      </div>
      <div>
        <div className={styles.txGridLabel}>Service Name</div>
        <div className={styles.txGridValue}>{approvalServiceLabel(row)}</div>
      </div>
      <div>
        <div className={styles.txGridLabel}>Plan</div>
        <div className={styles.txGridValue}>{approvalPlanLabel(row)}</div>
      </div>
      <div className={styles.txGridMeta}>
        <span>Client: {row.client}</span>
        <span>Issued: {formatApprovalDate(row.submittedAt)}</span>
      </div>
      {row.fileName ? <div className={styles.approvalFileInline}>{row.fileName}</div> : null}
      <div className={styles.txGridFooter}>
        <strong className={styles.amountCell}>{formatCommerceMoney(row.amount)}</strong>
        <button
          type="button"
          className={styles.primaryBtnSm}
          disabled={busyId === row.id}
          onClick={() => void handleVerify(row)}
        >
          Approve
        </button>
      </div>
      <div>{renderActionSelect(row)}</div>
    </article>
  );

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Provisioning &amp; Payment Proof Approvals</h3>
          <p className={styles.panelSubtitle}>
            Review pending server deployment requests and uploaded bank deposit, GCash, or wire transfer receipts.
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

      <div className={styles.toolbarRow}>
        <div className={styles.toolbarFilters}>
          <select
            className={styles.selectInline}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ApprovalSortKey)}
          >
            <option value="date-desc">Sort: Newest First</option>
            <option value="date-asc">Sort: Oldest First</option>
            <option value="amount-desc">Sort: Amount (High to Low)</option>
            <option value="amount-asc">Sort: Amount (Low to High)</option>
          </select>
          <select
            className={styles.selectInline}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ApprovalFilterKey)}
          >
            <option value="all">Filter: All Queue Items</option>
            <option value="provisioning">Pending Provisioning</option>
            <option value="receipt">Receipt Verification</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className={styles.emptyState}>Loading approvals...</p>
      ) : viewMode === "list" ? (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Service Name</th>
                  <th>Plan</th>
                  <th>Client</th>
                  <th>Issued Date</th>
                  <th>Expired Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className={styles.tableActionHead}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={9}>No pending approvals or verification items found matching filter.</td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr key={row.id}>
                      <td className={styles.monoCell}>{row.invoiceId || row.proofNo}</td>
                      <td className={styles.txServiceCell}>{approvalServiceLabel(row)}</td>
                      <td className={styles.txPlanCell}>
                        <strong>{approvalPlanLabel(row)}</strong>
                      </td>
                      <td>{row.client}</td>
                      <td>{formatApprovalDate(row.submittedAt)}</td>
                      <td>—</td>
                      <td className={styles.amountCell}>{formatCommerceMoney(row.amount)}</td>
                      <td>
                        <span className={styles.badgePending}>{row.status || "Pending Review"}</span>
                      </td>
                      <td className={styles.tableActionCell}>{renderActionSelect(row)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.paginationBar}>
            <div className={styles.paginationInfo}>
              {processedRows.length === 0
                ? "Showing 0 queue items"
                : `Showing ${rangeStart}-${rangeEnd} of ${processedRows.length} queue items`}
            </div>
            <div className={styles.paginationActions}>
              <button
                type="button"
                className={styles.secondaryBtnSm}
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <span className={styles.managedServicePageIndicator}>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                className={styles.primaryBtnSm}
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.txGrid}>
            {paginatedRows.length === 0 ? (
              <p className={styles.emptyState}>No pending approvals or verification items found matching filter.</p>
            ) : (
              paginatedRows.map(renderApprovalGridCard)
            )}
          </div>

          <div className={styles.paginationBar}>
            <div className={styles.paginationInfo}>
              {processedRows.length === 0
                ? "Showing 0 queue items"
                : `Showing ${rangeStart}-${rangeEnd} of ${processedRows.length} queue items`}
            </div>
            <div className={styles.paginationActions}>
              <button
                type="button"
                className={styles.secondaryBtnSm}
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <span className={styles.managedServicePageIndicator}>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                className={styles.primaryBtnSm}
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
